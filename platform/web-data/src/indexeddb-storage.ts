import type { CommandLog, CommandLogEntry, DomainEvent, EventLog } from '@onestrand/contract';
import type { Id } from '@onestrand/core';
import {
  assertChecksum,
  copyOfBytes,
  isPlainRecord,
  matchesChecksum,
  parseFileMeta,
  plainCopy,
  sha256Of,
  StorageError,
  type AnyTableRegistry,
  type BusinessBase,
  type BusinessStore,
  type Clock,
  type FileMeta,
  type FileStore,
  type Hasher,
  type IdGenerator,
  type RecordStore,
  type Rows,
  type Storage,
  type StoredFile,
  type StoredRow,
  type TableAccess,
  type TableDefinition,
} from '@onestrand/storage';
import { WebDataError } from './errors';
import { asSuiteError, listOf, resultOf, transactionDone } from './idb';
import {
  indexKeyPath,
  indexName,
  schemaLedgerProblems,
  type SchemaLedger,
  type SchemaProblem,
} from './schema-ledger';

/**
 * The storage ports (`Storage` of `@onestrand/storage`) on IndexedDB. The reference for how it
 * behaves is `createMemoryStorage`: it refuses what that one refuses, with the same codes, and a
 * test suite runs the same cases against both.
 *
 * **Where the data lies.** One object store per table of the register, keyed by `id` and
 * indexed by `businessId` and by the indexes the register lists; then one each for the
 * businesses, the events (in the order they were appended), the command log and the meta data
 * of files, and one for the bytes of files. A file is its bytes as they are, never a text and
 * never a data URL; its meta data lies apart, so listing the files of a business reads no photo.
 * The names of the stores that are not tables are the names the storage keeps for itself
 * (`RESERVED_TABLE_NAMES`), and `files.bytes`, which no table can be called because it has a dot.
 *
 * **The transaction.** The database of the browser ends a transaction the moment something
 * other than the database is awaited, and a checksum is such a thing (the ledger computes one
 * inside a command, between a read and a write; WebCrypto answers after a pause). So the
 * transaction of this adapter is not a transaction of the database while the work runs. The
 * work reads and writes through a layer in memory: reads see the writes of the transaction, the
 * writes are only collected. When the work has ended well, everything is written in one
 * transaction of the database, with no pause in it, so it happens as a whole or not at all. When
 * the work fails, nothing was written and nothing is undone. As in the storage in memory, a
 * transaction started inside another one joins it and shares its fate.
 */

/** What a storage on IndexedDB needs from the outside world. */
export interface IndexedDbStoragePorts {
  /** Computes the checksums of files. */
  hasher: Hasher;
  /** Gives a new file its time. */
  clock: Clock;
  /** Gives a new file its id. */
  ids: IdGenerator;
}

/** A migration of rows, as the database runs it when it opens: the same shape as the manifests. */
export interface RowMigration {
  readonly id: string;
  /** The table whose rows it changes. */
  readonly table: string;
  /** Pure: a row in, the row as it should be out. It keeps the `id` and the `businessId`. */
  readonly upgrade: (row: Record<string, unknown>) => Record<string, unknown>;
}

/** What `openIndexedDbStorage` takes. */
export interface IndexedDbStorageOptions<TRegistry extends AnyTableRegistry> {
  /** The name of the database on the device: the `database` of the edition. Never renamed. */
  name: string;
  /** The tables the database holds: the register of the edition. */
  tables: TRegistry;
  /** The history of the schema; its length is the version of the database. */
  ledger: SchemaLedger;
  /** The migrations of rows the ledger may name. */
  migrations?: readonly RowMigration[];
  ports: IndexedDbStoragePorts;
  /** The factory of the browser. Default: the global `indexedDB`. */
  indexedDB?: IDBFactory;
  /** Called when the opening waits for another tab to close its connection to an older version. */
  onBlocked?: () => void;
  /**
   * Called when another tab upgrades the database: this connection closes and every further call
   * fails with `closed`. The app tells the person to reload.
   */
  onVersionChange?: () => void;
}

/** The storage ports on a database of the browser, and what the app does to the connection. */
export interface IndexedDbStorage<
  TRegistry extends AnyTableRegistry = AnyTableRegistry,
  TBusiness extends BusinessBase = BusinessBase,
> extends Storage<TRegistry, TBusiness> {
  /** The name of the database. */
  readonly name: string;
  /** The version of the database: the number of steps of the ledger. */
  readonly version: number;
  /** Closes the connection. Calls after it fail with `closed`; the data stays on the device. */
  close: () => void;
}

const BUSINESSES = 'businesses';
const EVENTS = 'events';
const COMMANDS = 'commands';
const FILES = 'files';
const BYTES = 'files.bytes';

const ROW_IDS = ['id', 'businessId'] as const;

/** An entry of the layer in memory: a row to write, or a row to delete. */
type Write =
  | {
      kind: 'put';
      value: unknown;
      /** `add` for what the database does not have yet: a second one at the same time is refused. */
      mode: 'add' | 'put';
      /** The key, for a store whose values carry none. */
      key?: string;
    }
  | { kind: 'delete'; key: IDBValidKey };

/** What a transaction collected, not yet written. */
interface Layer {
  /** By store, then by the id of the row. */
  writes: Map<string, Map<string, Write>>;
  events: { added: DomainEvent[]; removed: Set<IDBValidKey> };
  /** True once the transaction is over: a write that comes later has nowhere to go. */
  ended: boolean;
}

function newLayer(): Layer {
  return { writes: new Map(), events: { added: [], removed: new Set() }, ended: false };
}

function exists(what: string, id: Id): StorageError {
  return new StorageError('exists', `${what} ${id} exists`);
}

/**
 * A copy of what is about to be stored, with the ids the storage itself depends on (see the
 * storage in memory): throws a `StorageError`, `not_plain` for what is not plain data,
 * `invalid_id` for an id that is missing, empty or no text.
 */
function storable<TValue>(what: string, value: TValue, ids: readonly string[]): TValue {
  const copy = plainCopy(value);
  for (const key of ids) {
    const id: unknown = isPlainRecord(copy) && Object.hasOwn(copy, key) ? copy[key] : undefined;
    if (typeof id !== 'string' || id === '') {
      throw new StorageError('invalid_id', `${what} needs "${key}": a text that is not empty`);
    }
  }
  return copy;
}

const byCodeUnit = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** The ArrayBuffer of a file as bytes of their own. */
const bytesFrom = (buffer: ArrayBuffer): Uint8Array<ArrayBuffer> =>
  new Uint8Array(new Uint8Array(buffer));

const isBuffer = (value: unknown): value is ArrayBuffer => value instanceof ArrayBuffer;

/** What a call sees of a row: the layer of the running transaction over what the database has. */
function visible(layer: Layer | undefined, store: string, key: string, stored: unknown): unknown {
  const write = layer?.writes.get(store)?.get(key);
  if (write === undefined) {
    return stored;
  }
  return write.kind === 'put' ? write.value : undefined;
}

const belongsTo = (value: unknown, businessId: Id): boolean =>
  isPlainRecord(value) && value.businessId === businessId;

/**
 * The rows of a store the database has (`stored`, all of one business or all there are), with
 * the layer laid over them: changed rows replaced, deleted rows gone, new rows that `wanted`
 * accepts added. By id.
 */
function listVisible(
  layer: Layer | undefined,
  store: string,
  stored: readonly unknown[],
  wanted: (value: unknown) => boolean,
): unknown[] {
  const writes = layer?.writes.get(store);
  if (writes === undefined) {
    return [...stored];
  }
  const seen = new Set<string>();
  const rows: unknown[] = [];
  for (const value of stored) {
    const key = idOf(value);
    seen.add(key);
    const write = writes.get(key);
    if (write === undefined) {
      rows.push(value);
    } else if (write.kind === 'put' && wanted(write.value)) {
      rows.push(write.value);
    }
  }
  for (const [key, write] of writes) {
    if (!seen.has(key) && write.kind === 'put' && wanted(write.value)) {
      rows.push(write.value);
    }
  }
  return rows.sort((a, b) => byCodeUnit(idOf(a), idOf(b)));
}

function idOf(value: unknown): string {
  return isPlainRecord(value) && typeof value.id === 'string' ? value.id : '';
}

function lateWrite(): WebDataError {
  return new WebDataError(
    'failed',
    'A write came after its transaction had ended: wait for every call of the storage inside the work of a transaction',
  );
}

/** Puts a row into the layer; the mode says whether the database already has it. */
function setPut(
  layer: Layer,
  store: string,
  id: string,
  value: unknown,
  stored: unknown,
  key?: string,
): void {
  if (layer.ended) {
    throw lateWrite();
  }
  let writes = layer.writes.get(store);
  if (writes === undefined) {
    writes = new Map();
    layer.writes.set(store, writes);
  }
  const prior = writes.get(id);
  let mode: 'add' | 'put' = stored === undefined ? 'add' : 'put';
  if (prior?.kind === 'put') {
    mode = prior.mode;
  } else if (prior?.kind === 'delete') {
    mode = 'put';
  }
  writes.set(id, { kind: 'put', value, mode, ...(key === undefined ? {} : { key }) });
}

/** Marks a row of the database as deleted, or forgets a row the database never had. */
function setDelete(layer: Layer, store: string, id: string, key: IDBValidKey): void {
  const writes = layer.writes.get(store);
  const prior = writes?.get(id);
  if (prior?.kind === 'put' && prior.mode === 'add') {
    writes?.delete(id);
    return;
  }
  if (writes === undefined) {
    layer.writes.set(store, new Map([[id, { kind: 'delete', key }]]));
  } else {
    writes.set(id, { kind: 'delete', key });
  }
}

/** Opens the database, creating or upgrading it by the steps of the ledger. */
function openDatabase<TRegistry extends AnyTableRegistry>(
  factory: IDBFactory,
  options: IndexedDbStorageOptions<TRegistry>,
): Promise<IDBDatabase> {
  const { name, ledger } = options;
  return new Promise((resolve, reject) => {
    let failure: { error: unknown } | undefined;
    const request = factory.open(name, ledger.length);

    request.onblocked = () => {
      options.onBlocked?.();
    };
    request.onupgradeneeded = (event) => {
      const transaction = request.transaction;
      if (transaction === null) {
        return;
      }
      upgrade(request.result, transaction, event.oldVersion, options).catch((error: unknown) => {
        failure = { error };
        transaction.abort();
      });
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      const error: unknown = request.error;
      if (failure !== undefined) {
        reject(
          new WebDataError(
            'migration',
            `The database ${name} could not be upgraded and stays as it was: ${failure.error instanceof Error ? failure.error.message : String(failure.error)}`,
            { cause: failure.error },
          ),
        );
      } else if (typeof error === 'object' && error !== null && 'name' in error) {
        reject(
          error.name === 'VersionError'
            ? new WebDataError(
                'downgrade',
                `The database ${name} was written by a newer version of the app than this one (this one knows ${String(ledger.length)} steps of its schema)`,
                { cause: error },
              )
            : asSuiteError(error),
        );
      } else {
        reject(asSuiteError(error));
      }
    };
  });
}

/** Runs the steps of the ledger the database has not seen, inside its upgrade transaction. */
async function upgrade<TRegistry extends AnyTableRegistry>(
  db: IDBDatabase,
  transaction: IDBTransaction,
  oldVersion: number,
  options: IndexedDbStorageOptions<TRegistry>,
): Promise<void> {
  const { ledger, migrations = [] } = options;
  if (oldVersion === 0) {
    db.createObjectStore(BUSINESSES, { keyPath: 'id' });
    const events = db.createObjectStore(EVENTS, { autoIncrement: true });
    events.createIndex('id', 'id', { unique: true });
    events.createIndex('businessId', 'businessId');
    db.createObjectStore(COMMANDS, { keyPath: 'commandId' }).createIndex(
      'businessId',
      'businessId',
    );
    db.createObjectStore(FILES, { keyPath: 'id' }).createIndex('businessId', 'businessId');
    db.createObjectStore(BYTES);
  }
  for (const step of ledger.slice(oldVersion)) {
    for (const table of step.tables ?? []) {
      const store = db.createObjectStore(table.name, { keyPath: 'id' });
      store.createIndex('businessId', 'businessId');
      for (const index of table.indexes ?? []) {
        store.createIndex(indexName(index), indexKeyPath(index));
      }
    }
    for (const { table, index } of step.indexes ?? []) {
      transaction.objectStore(table).createIndex(indexName(index), indexKeyPath(index));
    }
    for (const id of step.migrations ?? []) {
      const migration = migrations.find((candidate) => candidate.id === id);
      if (migration !== undefined) {
        await migrateRows(transaction.objectStore(migration.table), migration);
      }
    }
  }
}

/** Runs one migration over every row of its table. */
function migrateRows(store: IDBObjectStore, migration: RowMigration): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = store.openCursor();
    request.onerror = () => {
      reject(request.error ?? new Error('The cursor of the database failed'));
    };
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor === null) {
        resolve();
        return;
      }
      try {
        const row: unknown = cursor.value;
        const next: unknown = isPlainRecord(row) ? migration.upgrade(row) : undefined;
        if (
          !isPlainRecord(row) ||
          !isPlainRecord(next) ||
          next.id !== row.id ||
          next.businessId !== row.businessId
        ) {
          throw new Error(
            `The migration ${migration.id} must return the row with its id and its business`,
          );
        }
        cursor.update(plainCopy(next));
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
        return;
      }
      cursor.continue();
    };
  });
}

function problemsMessage(name: string, problems: readonly SchemaProblem[]): string {
  return `The schema ledger of ${name} does not fit its tables: ${problems.map((problem) => `${problem.code} (${problem.subject})`).join(', ')}`;
}

/**
 * Opens the database of an edition on the device and returns the storage ports on it.
 *
 * The ledger is checked against the register first (`schemaLedgerProblems`); a ledger that does
 * not lead to the register is a `WebDataError` `invalid_ledger` with the findings in
 * `problems`, and nothing is opened. The version of the database is the number of steps; steps
 * a device has not run yet run now, in order, with their migrations, in one transaction that
 * either all happens or leaves the database as it was (`migration`). A database written by a
 * newer ledger is `downgrade`.
 */
export async function openIndexedDbStorage<
  TRegistry extends AnyTableRegistry,
  TBusiness extends BusinessBase = BusinessBase,
>(options: IndexedDbStorageOptions<TRegistry>): Promise<IndexedDbStorage<TRegistry, TBusiness>> {
  const { name, tables: registry, ledger, ports } = options;
  const { hasher, clock, ids } = ports;
  const factory = options.indexedDB ?? (typeof indexedDB === 'undefined' ? undefined : indexedDB);
  if (factory === undefined) {
    throw new WebDataError('unavailable', 'This browser gives no IndexedDB');
  }
  const problems = schemaLedgerProblems({
    ledger,
    tables: registry,
    migrations: options.migrations ?? [],
  });
  if (problems.length > 0) {
    throw new WebDataError('invalid_ledger', problemsMessage(name, problems), { problems });
  }
  const db = await openDatabase(factory, options);
  let closed = false;
  db.onversionchange = () => {
    closed = true;
    db.close();
    options.onVersionChange?.();
  };
  db.onclose = () => {
    closed = true;
  };

  function database(): IDBDatabase {
    if (closed) {
      throw new WebDataError('closed', `The database ${name} is closed`);
    }
    return db;
  }

  /** Runs reads in one transaction of the database that ends with them. */
  async function read<T>(
    stores: readonly string[],
    work: (open: (store: string) => IDBObjectStore) => Promise<T>,
  ): Promise<T> {
    try {
      const transaction = database().transaction([...stores], 'readonly');
      return await work((store) => transaction.objectStore(store));
    } catch (error) {
      throw asSuiteError(error);
    }
  }

  const getStored = (store: string, id: string): Promise<unknown> =>
    read([store], (open) => resultOf(open(store).get(id)));

  const listStored = async (store: string, businessId: Id): Promise<unknown[]> =>
    listOf(
      await read([store], (open) => resultOf(open(store).index('businessId').getAll(businessId))),
    );

  /** Writes what a transaction collected, in one transaction of the database. */
  async function writeLayer(layer: Layer): Promise<void> {
    layer.ended = true;
    const stores = new Set<string>();
    for (const [store, writes] of layer.writes) {
      if (writes.size > 0) {
        stores.add(store);
      }
    }
    if (layer.events.added.length > 0 || layer.events.removed.size > 0) {
      stores.add(EVENTS);
    }
    if (stores.size === 0) {
      return;
    }
    try {
      const transaction = database().transaction([...stores], 'readwrite');
      const finished = transactionDone(transaction);
      try {
        for (const [store, writes] of layer.writes) {
          const target = writes.size > 0 ? transaction.objectStore(store) : undefined;
          for (const write of writes.values()) {
            if (write.kind === 'delete') {
              target?.delete(write.key);
            } else if (write.key === undefined) {
              if (write.mode === 'add') {
                target?.add(write.value);
              } else {
                target?.put(write.value);
              }
            } else if (write.mode === 'add') {
              target?.add(write.value, write.key);
            } else {
              target?.put(write.value, write.key);
            }
          }
        }
        if (stores.has(EVENTS)) {
          const events = transaction.objectStore(EVENTS);
          for (const key of layer.events.removed) {
            events.delete(key);
          }
          for (const event of layer.events.added) {
            events.add(event);
          }
        }
      } catch (error) {
        transaction.abort();
        await finished.catch(() => undefined);
        throw error;
      }
      await finished;
    } catch (error) {
      throw asSuiteError(error);
    }
  }

  /** The transaction that is running, with the first error of one that had joined it. */
  let running: { layer: Layer; failedInside?: { error: unknown } } | undefined;
  /** The write of the last transaction, so the next one starts after it. */
  let committing: Promise<unknown> = Promise.resolve();

  /**
   * Changes the storage: inside a running transaction the change goes into its layer, otherwise
   * it is a transaction of its own and is written at once.
   */
  async function change<T>(work: (layer: Layer) => Promise<T>): Promise<T> {
    if (running !== undefined) {
      return work(running.layer);
    }
    await committing;
    const layer = newLayer();
    const result = await work(layer);
    await track(writeLayer(layer));
    return result;
  }

  function track(write: Promise<void>): Promise<void> {
    committing = write.catch(() => undefined);
    return write;
  }

  function recordStore(definition: TableDefinition): RecordStore<StoredRow> {
    const { name: tableName, appendOnly } = definition;
    const what = `A row of ${tableName}`;
    return {
      get: async (id) => {
        const layer = running?.layer;
        if (typeof id !== 'string') {
          return undefined;
        }
        const row = visible(layer, tableName, id, await getStored(tableName, id));
        return plainCopy(row) as StoredRow | undefined;
      },
      ofBusiness: async (businessId) => {
        const layer = running?.layer;
        if (typeof businessId !== 'string') {
          return [];
        }
        const rows = listVisible(
          layer,
          tableName,
          await listStored(tableName, businessId),
          (value) => belongsTo(value, businessId),
        );
        return rows.map((row) => plainCopy(row) as StoredRow);
      },
      add: (record) =>
        change(async (layer) => {
          const row = storable(what, record, ROW_IDS);
          const stored = await getStored(tableName, row.id);
          if (visible(layer, tableName, row.id, stored) !== undefined) {
            throw exists(`Row of ${tableName}`, row.id);
          }
          setPut(layer, tableName, row.id, row, stored);
        }),
      put: (record) =>
        change(async (layer) => {
          const row = storable(what, record, ROW_IDS);
          const stored = await getStored(tableName, row.id);
          const current = visible(layer, tableName, row.id, stored);
          if (current !== undefined && appendOnly) {
            throw new StorageError(
              'append_only',
              `Row ${row.id} of ${tableName} exists; rows of this table are added, never replaced`,
            );
          }
          if (isPlainRecord(current) && current.businessId !== row.businessId) {
            throw new StorageError(
              'other_business',
              `Row ${row.id} of ${tableName} belongs to another business`,
            );
          }
          setPut(layer, tableName, row.id, row, stored);
        }),
    };
  }

  const stores = new Map(
    registry.tables.map((definition) => [
      definition.name,
      { definition, store: recordStore(definition) },
    ]),
  );

  function table(nameOrDefinition: string | TableDefinition): RecordStore<StoredRow> {
    const tableName =
      typeof nameOrDefinition === 'string' ? nameOrDefinition : nameOrDefinition.name;
    const found = stores.get(tableName);
    if (found === undefined) {
      throw new StorageError(
        'unknown_table',
        `Unknown table ${JSON.stringify(tableName)}; registered: ${registry.names.join(', ')}`,
      );
    }
    if (
      typeof nameOrDefinition !== 'string' &&
      (found.definition.schema !== nameOrDefinition.schema ||
        found.definition.appendOnly !== nameOrDefinition.appendOnly)
    ) {
      throw new StorageError(
        'unknown_table',
        `Table ${JSON.stringify(tableName)} of this storage is not the table of the definition given: another schema or another appendOnly`,
      );
    }
    return found.store;
  }

  const businesses: BusinessStore<TBusiness> = {
    get: async (id) => {
      const layer = running?.layer;
      if (typeof id !== 'string') {
        return undefined;
      }
      return plainCopy(visible(layer, BUSINESSES, id, await getStored(BUSINESSES, id))) as
        TBusiness | undefined;
    },
    all: async () => {
      const layer = running?.layer;
      const stored = listOf(
        await read([BUSINESSES], (open) => resultOf(open(BUSINESSES).getAll())),
      );
      return listVisible(layer, BUSINESSES, stored, () => true).map(
        (row) => plainCopy(row) as TBusiness,
      );
    },
    add: (business) =>
      change(async (layer) => {
        const row = storable('A business', business, ['id']);
        const stored = await getStored(BUSINESSES, row.id);
        if (visible(layer, BUSINESSES, row.id, stored) !== undefined) {
          throw exists('Business', row.id);
        }
        setPut(layer, BUSINESSES, row.id, row, stored);
      }),
    put: (business) =>
      change(async (layer) => {
        const row = storable('A business', business, ['id']);
        setPut(layer, BUSINESSES, row.id, row, await getStored(BUSINESSES, row.id));
      }),
  };

  const events: EventLog = {
    append: (event) =>
      change(async (layer) => {
        const row = storable('An event', event, ROW_IDS);
        const key = await read([EVENTS], (open) =>
          resultOf(open(EVENTS).index('id').getKey(row.id)),
        );
        const stored = key !== undefined && !layer.events.removed.has(key as IDBValidKey);
        if (stored || layer.events.added.some((added) => added.id === row.id)) {
          throw exists('Event', row.id);
        }
        if (layer.ended) {
          throw lateWrite();
        }
        layer.events.added.push(row);
      }),
    ofBusiness: async (businessId) => {
      const layer = running?.layer;
      if (typeof businessId !== 'string') {
        return [];
      }
      const [keys, values] = await read([EVENTS], (open) => {
        const index = open(EVENTS).index('businessId');
        return Promise.all([
          resultOf(index.getAllKeys(businessId)),
          resultOf(index.getAll(businessId)),
        ]);
      });
      const removed = layer?.events.removed;
      const stored = listOf(values).filter(
        (_event, position) => !removed?.has(listOf(keys)[position] as IDBValidKey),
      );
      const added = layer?.events.added.filter((event) => event.businessId === businessId) ?? [];
      return [...stored, ...added].map((event) => plainCopy(event) as DomainEvent);
    },
  };

  const commands: CommandLog = {
    find: async (commandId) => {
      const layer = running?.layer;
      if (typeof commandId !== 'string') {
        return undefined;
      }
      return plainCopy(
        visible(layer, COMMANDS, commandId, await getStored(COMMANDS, commandId)),
      ) as CommandLogEntry | undefined;
    },
    record: (entry) =>
      change(async (layer) => {
        const row = storable('An entry of the command log', entry, ['commandId', 'businessId']);
        const stored = await getStored(COMMANDS, row.commandId);
        if (visible(layer, COMMANDS, row.commandId, stored) !== undefined) {
          throw exists('Command', row.commandId);
        }
        setPut(layer, COMMANDS, row.commandId, row, stored);
      }),
  };

  /** Stores a file that is checked already: its meta data and its bytes, as new. */
  function addFile(meta: FileMeta, bytes: Uint8Array<ArrayBuffer>): Promise<void> {
    return change(async (layer) => {
      const stored = await getStored(FILES, meta.id);
      if (visible(layer, FILES, meta.id, stored) !== undefined) {
        throw exists('File', meta.id);
      }
      setPut(layer, FILES, meta.id, meta, stored);
      setPut(layer, BYTES, meta.id, bytes.buffer, stored, meta.id);
    });
  }

  const files: FileStore = {
    put: async ({ businessId, bytes, mediaType, name: fileName }) => {
      const copy = copyOfBytes(bytes);
      // The checksum is computed before the database is touched: awaiting it inside a
      // transaction of the database would end that transaction.
      const meta = parseFileMeta({
        id: ids.next(),
        businessId,
        sha256: await sha256Of(hasher, copy),
        size: copy.length,
        mediaType,
        ...(fileName === undefined ? {} : { name: fileName }),
        createdAt: clock.now(),
      });
      await addFile(meta, copy);
      return plainCopy(meta);
    },
    get: async (id) => {
      const layer = running?.layer;
      if (typeof id !== 'string') {
        return undefined;
      }
      const [storedMeta, storedBytes] = await read([FILES, BYTES], (open) =>
        Promise.all([resultOf(open(FILES).get(id)), resultOf(open(BYTES).get(id))]),
      );
      const meta = visible(layer, FILES, id, storedMeta);
      const bytes = visible(layer, BYTES, id, storedBytes);
      if (meta === undefined || !isBuffer(bytes)) {
        return undefined;
      }
      return { meta: plainCopy(meta) as FileMeta, bytes: bytesFrom(bytes) };
    },
    ofBusiness: async (businessId) => {
      const layer = running?.layer;
      if (typeof businessId !== 'string') {
        return [];
      }
      const metas = listVisible(layer, FILES, await listStored(FILES, businessId), (value) =>
        belongsTo(value, businessId),
      );
      return metas.map((meta) => plainCopy(meta) as FileMeta);
    },
    verify: async (id) => {
      const entry = await files.get(id);
      return entry !== undefined && (await matchesChecksum(hasher, entry.meta, entry.bytes));
    },
    restore: async (file: StoredFile) => {
      // Checked for its form, kept as given: fields a newer version added stay on the file.
      parseFileMeta(file.meta);
      const meta = plainCopy(file.meta);
      const bytes = copyOfBytes(file.bytes);
      await assertChecksum(hasher, meta, bytes);
      await addFile(meta, bytes);
    },
  };

  async function transaction<T>(work: () => Promise<T>): Promise<T> {
    if (running === undefined) {
      await committing;
    }
    const outer = running;
    if (outer !== undefined) {
      try {
        return await work();
      } catch (error) {
        // Noted on the transaction it joined, not on whichever runs when it fails: a late
        // failure must never reach a transaction that started after that one was over.
        outer.failedInside ??= { error };
        throw error;
      }
    }
    const own: { layer: Layer; failedInside?: { error: unknown } } = { layer: newLayer() };
    running = own;
    try {
      const result = await work();
      if (own.failedInside !== undefined) {
        // The inner one promised «all or nothing» for its writes and is part of this one: the
        // only way to keep that promise is to write nothing, whoever caught its error.
        throw own.failedInside.error;
      }
      running = undefined;
      await track(writeLayer(own.layer));
      return result;
    } catch (error) {
      // Nothing was written, so there is nothing to undo; what came after must not join.
      own.layer.ended = true;
      throw error;
    } finally {
      if (running === own) {
        running = undefined;
      }
    }
  }

  async function purge(businessId: Id): Promise<void> {
    if (typeof businessId !== 'string') {
      return;
    }
    await change(async (layer) => {
      const tableNames = registry.names;
      const withIndex = [...tableNames, COMMANDS, FILES];
      const [found, businessStored, eventKeys] = await read(
        [BUSINESSES, EVENTS, ...withIndex],
        (open) =>
          Promise.all([
            Promise.all(
              withIndex.map(
                async (store) =>
                  [
                    store,
                    listOf(await resultOf(open(store).index('businessId').getAllKeys(businessId))),
                  ] as const,
              ),
            ),
            resultOf(open(BUSINESSES).get(businessId)),
            resultOf(open(EVENTS).index('businessId').getAllKeys(businessId)),
          ]),
      );
      // Rows of the business the transaction wrote itself go; rows the database has are marked.
      const fileIds = new Set<string>();
      for (const [store, keys] of found) {
        for (const key of keys) {
          setDelete(layer, store, String(key), key as IDBValidKey);
          if (store === FILES) {
            fileIds.add(String(key));
          }
        }
        for (const [id, write] of layer.writes.get(store) ?? []) {
          if (write.kind === 'put' && belongsTo(write.value, businessId)) {
            setDelete(layer, store, id, id);
            if (store === FILES) {
              fileIds.add(id);
            }
          }
        }
      }
      if (businessStored !== undefined || layer.writes.get(BUSINESSES)?.has(businessId) === true) {
        setDelete(layer, BUSINESSES, businessId, businessId);
      }
      for (const id of fileIds) {
        setDelete(layer, BYTES, id, id);
      }
      for (const key of listOf(eventKeys)) {
        layer.events.removed.add(key as IDBValidKey);
      }
      layer.events.added = layer.events.added.filter((event) => event.businessId !== businessId);
    });
  }

  function close(): void {
    closed = true;
    db.close();
  }

  return {
    // The stores work on rows as plain data; the register gives them their types at the door.
    table: table as TableAccess<Rows<TRegistry>>,
    businesses,
    events,
    commands,
    files,
    purge,
    transaction,
    name,
    version: ledger.length,
    close,
  };
}

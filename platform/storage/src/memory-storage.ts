// Origin: BanioX/Randen packages/core/src/ports/memory-storage.ts @ e0f0907 — adapted: tables from a register; several businesses per device (purge removes one business and only its entries of the command log); files with a checksum; append-only tables; a row never changes its business; the command log keeps whole entries and refuses a second one; events keep their order; copies refuse what is not plain data; nothing is stored without its id and its business; a failed transaction inside another fails the outer one
import type { CommandLog, CommandLogEntry, DomainEvent, EventLog } from '@onestrand/contract';
import type { Id } from '@onestrand/core';
import type { BusinessBase } from './business';
import { StorageError } from './errors';
import {
  assertChecksum,
  copyOfBytes,
  matchesChecksum,
  parseFileMeta,
  sha256Of,
  type FileMeta,
  type Hasher,
} from './files';
import { isPlainRecord, plainCopy } from './plain';
import type {
  BusinessStore,
  Clock,
  FileStore,
  IdGenerator,
  RecordStore,
  Storage,
  TableAccess,
} from './ports';
import type { AnyTableRegistry, Rows, StoredRow, TableDefinition } from './tables';

/** What the storage in memory needs from the outside world. */
export interface MemoryStoragePorts {
  /** Computes the checksums of files. */
  hasher: Hasher;
  /** Gives a new file its time. */
  clock: Clock;
  /** Gives a new file its id. */
  ids: IdGenerator;
}

interface FileEntry {
  meta: FileMeta;
  bytes: Uint8Array<ArrayBuffer>;
}

/**
 * Everything the storage holds. Stored values are never changed in place, only replaced, and
 * every map keeps the order in which its entries were added.
 */
interface State<TBusiness> {
  tables: Map<string, Map<Id, StoredRow>>;
  businesses: Map<Id, TBusiness>;
  events: Map<Id, DomainEvent>;
  commands: Map<Id, CommandLogEntry>;
  files: Map<Id, FileEntry>;
}

/** A copy of the state that shares the stored values, which is safe because they never change. */
function snapshotOf<TBusiness>(state: State<TBusiness>): State<TBusiness> {
  return {
    tables: new Map([...state.tables].map(([name, rows]) => [name, new Map(rows)])),
    businesses: new Map(state.businesses),
    events: new Map(state.events),
    commands: new Map(state.commands),
    files: new Map(state.files),
  };
}

/**
 * Runs work that needs no waiting as a call of the storage: its result and its error both
 * arrive through the promise, never as an exception of the call itself.
 */
function settled<T>(work: () => T): Promise<T> {
  return new Promise((resolve) => {
    resolve(work());
  });
}

function exists(what: string, id: Id): StorageError {
  return new StorageError('exists', `${what} ${id} exists`);
}

/**
 * A copy of what is about to be stored, with the ids the storage itself depends on. No schema
 * is checked, but without its id a value would be stored under no key, and without its business
 * nothing would ever find it again or purge it. Throws a `StorageError`: `not_plain` for what
 * is not plain data, `invalid_id` for an id that is missing, empty or no text.
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

const ROW_IDS = ['id', 'businessId'] as const;

/** Removes the entries of one business from a map. */
function removeWhere<TValue>(entries: Map<Id, TValue>, belongs: (value: TValue) => boolean): void {
  for (const [id, value] of entries) {
    if (belongs(value)) {
      entries.delete(id);
    }
  }
}

/**
 * Storage in plain memory, for tests of the use cases and as the reference behaviour of the
 * storage ports. Values are copied in and out, so callers cannot change stored data by
 * accident. Rows are kept exactly as given: no schema is checked and no field is dropped. A
 * failing transaction restores everything (tables, businesses, events, command log, files). A
 * transaction inside another joins it and shares its fate: if the inner one fails, the outer
 * one fails with the same error at its end, even if it caught that error, so the writes of a
 * half-done step are never kept. The database of the browser behaves the same way.
 *
 * The tables are those of the register; the ports give files their checksum, time and id.
 */
export function createMemoryStorage<
  TRegistry extends AnyTableRegistry,
  TBusiness extends BusinessBase = BusinessBase,
>(registry: TRegistry, ports: MemoryStoragePorts): Storage<TRegistry, TBusiness> {
  const { hasher, clock, ids } = ports;
  // Replaced as a whole when a transaction fails, so every store reads it anew on each call.
  let state: State<TBusiness> = {
    tables: new Map(registry.tables.map((table) => [table.name, new Map<Id, StoredRow>()])),
    businesses: new Map(),
    events: new Map(),
    commands: new Map(),
    files: new Map(),
  };

  function recordStore({ name, appendOnly }: TableDefinition): RecordStore<StoredRow> {
    const what = `A row of ${name}`;
    const rows = (): Map<Id, StoredRow> => {
      const found = state.tables.get(name);
      if (found === undefined) {
        // Cannot happen: every table of the register has its map from the start.
        throw new StorageError('unknown_table', `Unknown table ${JSON.stringify(name)}`);
      }
      return found;
    };
    return {
      get: (id) => settled(() => plainCopy(rows().get(id))),
      ofBusiness: (businessId) =>
        settled(() =>
          [...rows().values()]
            .filter((row) => row.businessId === businessId)
            .map((row) => plainCopy(row)),
        ),
      add: (record) =>
        settled(() => {
          const row = storable(what, record, ROW_IDS);
          if (rows().has(row.id)) {
            throw exists(`Row of ${name}`, row.id);
          }
          rows().set(row.id, row);
        }),
      put: (record) =>
        settled(() => {
          const row = storable(what, record, ROW_IDS);
          const current = rows().get(row.id);
          if (current !== undefined && appendOnly) {
            throw new StorageError(
              'append_only',
              `Row ${row.id} of ${name} exists; rows of this table are added, never replaced`,
            );
          }
          if (current !== undefined && current.businessId !== row.businessId) {
            throw new StorageError(
              'other_business',
              `Row ${row.id} of ${name} belongs to another business`,
            );
          }
          rows().set(row.id, row);
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
    const name = typeof nameOrDefinition === 'string' ? nameOrDefinition : nameOrDefinition.name;
    const found = stores.get(name);
    if (found === undefined) {
      throw new StorageError(
        'unknown_table',
        `Unknown table ${JSON.stringify(name)}; registered: ${registry.names.join(', ')}`,
      );
    }
    if (
      typeof nameOrDefinition !== 'string' &&
      (found.definition.schema !== nameOrDefinition.schema ||
        found.definition.appendOnly !== nameOrDefinition.appendOnly)
    ) {
      // Two modules that both call a table `name` would write into each other's rows, typed as
      // their own. The register of the edition holds one of them; the other is told here.
      throw new StorageError(
        'unknown_table',
        `Table ${JSON.stringify(name)} of this storage is not the table of the definition given: another schema or another appendOnly`,
      );
    }
    return found.store;
  }

  const businesses: BusinessStore<TBusiness> = {
    get: (id) => settled(() => plainCopy(state.businesses.get(id))),
    all: () => settled(() => [...state.businesses.values()].map((row) => plainCopy(row))),
    add: (business) =>
      settled(() => {
        const row = storable('A business', business, ['id']);
        if (state.businesses.has(row.id)) {
          throw exists('Business', row.id);
        }
        state.businesses.set(row.id, row);
      }),
    put: (business) =>
      settled(() => {
        const row = storable('A business', business, ['id']);
        state.businesses.set(row.id, row);
      }),
  };

  const events: EventLog = {
    append: (event) =>
      settled(() => {
        const row = storable('An event', event, ROW_IDS);
        if (state.events.has(row.id)) {
          throw exists('Event', row.id);
        }
        state.events.set(row.id, row);
      }),
    ofBusiness: (businessId) =>
      settled(() =>
        [...state.events.values()]
          .filter((event) => event.businessId === businessId)
          .map((event) => plainCopy(event)),
      ),
  };

  const commands: CommandLog = {
    find: (commandId) => settled(() => plainCopy(state.commands.get(commandId))),
    record: (entry) =>
      settled(() => {
        const row = storable('An entry of the command log', entry, ['commandId', 'businessId']);
        if (state.commands.has(row.commandId)) {
          throw exists('Command', row.commandId);
        }
        state.commands.set(row.commandId, row);
      }),
  };

  function addFile(entry: FileEntry): void {
    if (state.files.has(entry.meta.id)) {
      throw exists('File', entry.meta.id);
    }
    state.files.set(entry.meta.id, entry);
  }

  const files: FileStore = {
    put: async ({ businessId, bytes, mediaType, name }) => {
      const copy = copyOfBytes(bytes);
      const meta = parseFileMeta({
        id: ids.next(),
        businessId,
        sha256: await sha256Of(hasher, copy),
        size: copy.length,
        mediaType,
        ...(name === undefined ? {} : { name }),
        createdAt: clock.now(),
      });
      addFile({ meta, bytes: copy });
      return plainCopy(meta);
    },
    get: (id) =>
      settled(() => {
        const entry = state.files.get(id);
        return entry === undefined
          ? undefined
          : { meta: plainCopy(entry.meta), bytes: new Uint8Array(entry.bytes) };
      }),
    ofBusiness: (businessId) =>
      settled(() =>
        [...state.files.values()]
          .filter((entry) => entry.meta.businessId === businessId)
          .map((entry) => plainCopy(entry.meta)),
      ),
    verify: async (id) => {
      const entry = state.files.get(id);
      return entry !== undefined && (await matchesChecksum(hasher, entry.meta, entry.bytes));
    },
    restore: async (file) => {
      // Checked for its form, kept as given: fields a newer version added stay on the file.
      parseFileMeta(file.meta);
      const entry = { meta: plainCopy(file.meta), bytes: copyOfBytes(file.bytes) };
      await assertChecksum(hasher, entry.meta, entry.bytes);
      addFile(entry);
    },
  };

  /** The transaction that is running, with the first error of one that had joined it. */
  let running: { failedInside?: { error: unknown } } | undefined;
  async function transaction<T>(work: () => Promise<T>): Promise<T> {
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
    const own: { failedInside?: { error: unknown } } = {};
    const snapshot = snapshotOf(state);
    running = own;
    try {
      const result = await work();
      if (own.failedInside !== undefined) {
        // The inner one promised «all or nothing» for its writes and is part of this one: the
        // only way to keep that promise is to undo everything, whoever caught its error.
        throw own.failedInside.error;
      }
      return result;
    } catch (error) {
      state = snapshot;
      throw error;
    } finally {
      running = undefined;
    }
  }

  function purge(businessId: Id): Promise<void> {
    // One step without a pause in between, so nobody ever sees half of a business.
    return settled(() => {
      for (const rows of state.tables.values()) {
        removeWhere(rows, (row) => row.businessId === businessId);
      }
      removeWhere(state.events, (event) => event.businessId === businessId);
      removeWhere(state.commands, (entry) => entry.businessId === businessId);
      removeWhere(state.files, (entry) => entry.meta.businessId === businessId);
      state.businesses.delete(businessId);
    });
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
  };
}

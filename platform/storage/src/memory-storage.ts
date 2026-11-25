// Origin: BanioX/Randen packages/core/src/ports/memory-storage.ts @ e0f0907 — adapted: tables from a register; several businesses per device (purge removes one business and only its entries of the command log); files with a checksum; append-only tables; a row never changes its business; the command log keeps whole entries and refuses a second one; events keep their order; copies refuse what is not plain data
import type { CommandLog, CommandLogEntry, DomainEvent, EventLog } from '@onestrand/contract';
import type { Id } from '@onestrand/core';
import type { BusinessBase } from './business';
import { StorageError } from './errors';
import {
  assertChecksum,
  FileMetaSchema,
  matchesChecksum,
  sha256Of,
  type FileMeta,
  type Hasher,
} from './files';
import { plainCopy } from './plain';
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
 * failing transaction restores everything (tables, businesses, events, command log, files); a
 * transaction inside another joins it.
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
          if (rows().has(record.id)) {
            throw exists(`Row of ${name}`, record.id);
          }
          rows().set(record.id, plainCopy(record));
        }),
      put: (record) =>
        settled(() => {
          const current = rows().get(record.id);
          if (current !== undefined && appendOnly) {
            throw new StorageError(
              'append_only',
              `Row ${record.id} of ${name} exists; rows of this table are added, never replaced`,
            );
          }
          if (current !== undefined && current.businessId !== record.businessId) {
            throw new StorageError(
              'other_business',
              `Row ${record.id} of ${name} belongs to another business`,
            );
          }
          rows().set(record.id, plainCopy(record));
        }),
    };
  }

  const stores = new Map(registry.tables.map((table) => [table.name, recordStore(table)]));

  function table(nameOrDefinition: string | TableDefinition): RecordStore<StoredRow> {
    const name = typeof nameOrDefinition === 'string' ? nameOrDefinition : nameOrDefinition.name;
    const store = stores.get(name);
    if (store === undefined) {
      throw new StorageError(
        'unknown_table',
        `Unknown table ${JSON.stringify(name)}; registered: ${registry.names.join(', ')}`,
      );
    }
    return store;
  }

  const businesses: BusinessStore<TBusiness> = {
    get: (id) => settled(() => plainCopy(state.businesses.get(id))),
    all: () => settled(() => [...state.businesses.values()].map((row) => plainCopy(row))),
    add: (business) =>
      settled(() => {
        if (state.businesses.has(business.id)) {
          throw exists('Business', business.id);
        }
        state.businesses.set(business.id, plainCopy(business));
      }),
    put: (business) =>
      settled(() => {
        state.businesses.set(business.id, plainCopy(business));
      }),
  };

  const events: EventLog = {
    append: (event) =>
      settled(() => {
        if (state.events.has(event.id)) {
          throw exists('Event', event.id);
        }
        state.events.set(event.id, plainCopy(event));
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
        if (state.commands.has(entry.commandId)) {
          throw exists('Command', entry.commandId);
        }
        state.commands.set(entry.commandId, plainCopy(entry));
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
      const copy = new Uint8Array(bytes);
      const meta = FileMetaSchema.parse({
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
      FileMetaSchema.parse(file.meta);
      const entry = { meta: plainCopy(file.meta), bytes: new Uint8Array(file.bytes) };
      await assertChecksum(hasher, entry.meta, entry.bytes);
      addFile(entry);
    },
  };

  let depth = 0;
  async function transaction<T>(work: () => Promise<T>): Promise<T> {
    if (depth > 0) {
      return work();
    }
    const snapshot = snapshotOf(state);
    depth += 1;
    try {
      return await work();
    } catch (error) {
      state = snapshot;
      throw error;
    } finally {
      depth -= 1;
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

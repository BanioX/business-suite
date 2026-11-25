// Origin: BanioX/Randen packages/core/src/ports/storage.ts @ e0f0907 — adapted: tables come from a register instead of a fixed list and are reached through `table`; several businesses per device; files as their own store; the business row is generic; clock, ids, logs and transaction are the ports of the contract package
// Origin: BanioX/Randen packages/core/src/application/command.ts @ e0f0907 — adapted: only the row helper, on the error of the contract package
import { CommandError, type CommandStorage } from '@onestrand/contract';
import type { Id } from '@onestrand/core';
import type { BusinessBase } from './business';
import type { FileMeta, NewFile, StoredFile } from './files';
import type { AnyTableRegistry, Rows, RowTypes, StoredRow, TableDefinition } from './tables';

/**
 * Storage ports (suite ADR-0009; ADR-0003 of the origin): how the use cases read and write the
 * data of a business without knowing the database. The browser implements them on its own
 * database, tests with `createMemoryStorage`, a later server on its own.
 *
 * The ports a command needs are defined in the contract package, which sits below this one, and
 * are handed on here; this package adds the tables, the businesses and the files.
 */
export type {
  Clock,
  CommandContext,
  CommandLog,
  CommandLogEntry,
  CommandStorage,
  EventLog,
  IdGenerator,
  Transactional,
} from '@onestrand/contract';

/**
 * One table. Soft-deleted rows are returned; callers filter them (`alive`). Rows are plain data
 * (`plainCopy`): the store hands out copies and keeps a copy, checks no schema and drops no
 * field, so a row with fields a schema does not know yet is stored and read back as it is.
 */
export interface RecordStore<TRecord extends StoredRow> {
  /**
   * The row with this id, of whatever business on the device. A use case never hands it on
   * unchecked: `requireRow` compares the business and leaves out soft-deleted rows.
   */
  get: (id: Id) => Promise<TRecord | undefined>;
  /** Every row of one business, soft-deleted ones included, in no particular order. */
  ofBusiness: (businessId: Id) => Promise<TRecord[]>;
  /** Inserts a new row; fails if the id exists, or if the row lacks its id or its business. */
  add: (record: TRecord) => Promise<void>;
  /**
   * Inserts or replaces a row. Fails if the id belongs to a row of another business (a row
   * never changes hands), in an append-only table if the id exists at all, and if the row lacks
   * its id or its business.
   */
  put: (record: TRecord) => Promise<void>;
}

/** The businesses on this device. */
export interface BusinessStore<TBusiness extends BusinessBase = BusinessBase> {
  get: (id: Id) => Promise<TBusiness | undefined>;
  all: () => Promise<TBusiness[]>;
  /** Inserts a new business; fails if the id exists. */
  add: (business: TBusiness) => Promise<void>;
  /** Inserts or replaces a business. */
  put: (business: TBusiness) => Promise<void>;
}

/**
 * Files as bytes with a checksum (suite ADR-0005, 7). A row refers to a file by its id. There
 * is no way to change a file, and none to remove a single one: new bytes are a new file, and
 * files go with their business (`purge`).
 *
 * `put`, `verify` and `restore` compute a checksum, which is no call of the storage. An
 * implementation on a database must keep a running transaction open across it, or compute it
 * before it touches the database.
 */
export interface FileStore {
  /**
   * Stores the bytes as a new file and returns what the storage knows about it. The checksum
   * comes from the `Hasher` of the storage. Fails with a `StorageError` `invalid_file` if the
   * media type or the name are malformed (see `FileMetaSchema`) or the bytes are no
   * `Uint8Array`.
   */
  put: (file: NewFile) => Promise<FileMeta>;
  /**
   * The file with this id, of whatever business on the device, or nothing. A use case compares
   * `meta.businessId` before it hands a file on.
   */
  get: (id: Id) => Promise<StoredFile | undefined>;
  /** What is known about every file of one business, without the bytes, in no particular order. */
  ofBusiness: (businessId: Id) => Promise<FileMeta[]>;
  /**
   * Computes the checksum of the stored bytes again and compares it and the size with the meta
   * data. False if the file was damaged, and false if there is no such file.
   */
  verify: (id: Id) => Promise<boolean>;
  /**
   * Brings a file back with the id and the time it had (a backup, later another device). Meta
   * data a newer version added is kept. Fails with a `StorageError`: `invalid_file` for
   * malformed meta data, `checksum` if the bytes do not match the checksum and the size of the
   * meta data, `exists` if the id is taken.
   */
  restore: (file: StoredFile) => Promise<void>;
}

/** How a storage hands out its tables: by name, typed by the register, or by definition. */
export interface TableAccess<TRows extends RowTypes = RowTypes> {
  /** A table of the register by its name. */
  <TName extends keyof TRows & string>(name: TName): RecordStore<TRows[TName]>;
  /**
   * A table by its definition; the rows have the type of the definition. For code that owns a
   * table but not the register (a module, a ledger). Fails with `unknown_table` if the storage
   * has no table of that name, or holds another table under it (another schema, or rows that
   * may be replaced where the definition says they may not).
   */
  <TRow extends StoredRow>(table: TableDefinition<string, TRow>): RecordStore<TRow>;
}

/**
 * What a module or a kit needs from the storage: its tables by their definitions, files, the
 * two logs and the transaction. It says nothing about the register or the business row, so the
 * storage of every edition fits, whatever other tables it holds.
 *
 * A transaction inside another joins it and shares its fate: if the inner one fails, the outer
 * one fails too, even if it caught the error (see `Transactional`).
 */
export interface ModuleStorage extends CommandStorage {
  table: <TRow extends StoredRow>(table: TableDefinition<string, TRow>) => RecordStore<TRow>;
  files: FileStore;
}

/**
 * The whole storage of a device: the tables of a register, the businesses, events, the command
 * log and files. Tables are reached through `table`, never as properties, so the name of a
 * table cannot collide with a member of the storage.
 */
export interface Storage<
  TRegistry extends AnyTableRegistry = AnyTableRegistry,
  TBusiness extends BusinessBase = BusinessBase,
> extends ModuleStorage {
  table: TableAccess<Rows<TRegistry>>;
  businesses: BusinessStore<TBusiness>;
  /**
   * Removes one business for good: every row of every table, its events, its files, its
   * entries in the command log (their results carry names of the business and its team) and
   * the business itself. Every other business on the device stays untouched. The one hard
   * delete there is; it serves «delete everything» and the restore of a backup, which replaces
   * the business it holds.
   */
  purge: (businessId: Id) => Promise<void>;
}

/** Rows that are not soft-deleted. */
export function alive<TRecord extends { deletedAt?: unknown }>(
  rows: readonly TRecord[],
): TRecord[] {
  return rows.filter((row) => row.deletedAt === undefined);
}

/** The live row with this id in this business, or a `not_found` error naming `what`. */
export async function requireRow<TRecord extends StoredRow & { deletedAt?: unknown }>(
  store: Pick<RecordStore<TRecord>, 'get'>,
  businessId: Id,
  id: Id,
  what: string,
): Promise<TRecord> {
  const row = await store.get(id);
  if (row?.businessId !== businessId || row.deletedAt !== undefined) {
    throw new CommandError('not_found', `${what} ${id} not found`);
  }
  return row;
}

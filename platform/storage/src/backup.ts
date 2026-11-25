// Origin: BanioX/Randen packages/core/src/modules/settings/backup.ts @ e0f0907 — adapted: a kit over a table register with format and version as parameters; loose reading keeps unknown fields; older versions through readers, newer ones refused; unknown top-level fields, counts and files with checksums are checked; rules of the caller instead of the team rule
// Origin: BanioX/Randen packages/core/src/modules/settings/contract.ts @ e0f0907 — adapted: only the backup document, its problems and its preview, as types over a register; files added; no name of an app in the document
// Origin: BanioX/Randen packages/core/src/modules/settings/use-cases.ts @ e0f0907 — adapted: only export and restore, as functions over a storage; restore replaces the business of the file and no other; the event is left to the caller
import { CommandError } from '@onestrand/contract';
import { IsoDateTimeSchema, type Id, type IsoDateTime } from '@onestrand/core';
import type { z } from 'zod';
import { BusinessBaseSchema, type BusinessBase } from './business';
import { base64Decode, base64Encode } from './bytes';
import {
  FileMetaSchema,
  matchesChecksum,
  type FileMeta,
  type Hasher,
  type StoredFile,
} from './files';
import { isPlainRecord, keepUnknownFields, plainCopy } from './plain';
import type { Clock, Storage } from './ports';
import type { AnyTableRegistry, Rows, StoredRow, TableDefinition, TableName } from './tables';

/**
 * The backup of a business (suite ADR-0005; ADR-0006 of the origin): writing it, checking a
 * file before it replaces anything, and bringing it back. Every edition has its own format name
 * and counts its own versions; both are frozen once a file was written with them.
 *
 * A backup holds one business: its row, every row of every table that is part of the backup
 * (soft-deleted ones included) and its files. Events and the command log stay on the device.
 */

/** What can keep a file from coming back, by kind. */
export const BACKUP_PROBLEM_KINDS = [
  'format',
  'version',
  'field',
  'business',
  'table',
  'row',
  'count',
  'file',
] as const;
/**
 * - `format`: not a backup of this edition.
 * - `version`: written by a newer version of the app, no version at all, or a version no reader
 *   leads on from (`version` as written, if it could be read).
 * - `field`: a field of the document itself is unknown, missing or malformed (`field`).
 * - `business`: the business row does not fit its schema.
 * - `table`: the tables are missing (no `table`), a table of the register is missing or the
 *   file holds a table the register does not know (`table`).
 * - `row`: a row does not fit the schema of its table, belongs to another business or has an id
 *   that occurs twice (`table`, and `id` if it could be read).
 * - `count`: the file does not hold as many rows as it says (`table`), or says nothing.
 * - `file`: the files are missing (no `id`), or a file is malformed, belongs to another
 *   business, occurs twice or does not match its checksum (`id` if it could be read).
 */
export type BackupProblemKind = (typeof BACKUP_PROBLEM_KINDS)[number];

/** The kind of a rule a caller adds with `validate`: `<namespace>.<what>`. */
export type CustomBackupProblemKind = `${string}.${string}`;

/** One thing that keeps a backup from coming back. Problems are data, never thrown. */
export interface BackupProblem {
  kind: BackupProblemKind | CustomBackupProblemKind;
  table?: string;
  id?: string;
  version?: string;
  field?: string;
}

/** A file inside a backup: what the storage knows about it and its bytes as Base64. */
export interface BackupFile {
  meta: FileMeta;
  data: string;
}

/** The rows of the tables of a backup, by table name. Tables outside the backup are absent. */
export type BackupRows<TRegistry extends AnyTableRegistry = AnyTableRegistry> = {
  [TName in TableName<TRegistry>]?: Rows<TRegistry>[TName][];
};

/** The whole business as one document, ready to be written as JSON. */
export interface BackupDocument<
  TRegistry extends AnyTableRegistry = AnyTableRegistry,
  TBusiness extends BusinessBase = BusinessBase,
> {
  format: string;
  version: number;
  exportedAt: IsoDateTime;
  business: TBusiness;
  tables: BackupRows<TRegistry>;
  /** Rows per table. Written for the reader of the file and checked when it comes back. */
  counts: Record<string, number>;
  files: BackupFile[];
}

/** What a file holds, read without changing anything. */
export interface BackupPreview {
  /** A backup of this edition in a version this app can read. */
  recognised: boolean;
  /** Nothing in it keeps it from coming back. */
  importable: boolean;
  /** The version the file was written in. */
  version?: number;
  businessId?: Id;
  businessName?: string;
  exportedAt?: IsoDateTime;
  /** All rows of the file, soft-deleted ones included. */
  rows: number;
  /** Rows per table, as found in the file. */
  counts: Record<string, number>;
  /** Number of files. */
  files: number;
  problems: BackupProblem[];
}

/**
 * A backup that passed the check: the business, the rows and the files as they will be written.
 * Only `checkBackup` makes one, and `restoreBackup` takes no other.
 */
export interface CheckedBackup<
  TRegistry extends AnyTableRegistry = AnyTableRegistry,
  TBusiness extends BusinessBase = BusinessBase,
> {
  readonly exportedAt: IsoDateTime;
  readonly business: TBusiness;
  readonly tables: BackupRows<TRegistry>;
  readonly files: readonly StoredFile[];
}

/** The result of checking a file: what the preview shows, and the backup when it may come back. */
export interface BackupCheck<
  TRegistry extends AnyTableRegistry = AnyTableRegistry,
  TBusiness extends BusinessBase = BusinessBase,
> {
  preview: BackupPreview;
  /** Present only when the file is importable. */
  backup?: CheckedBackup<TRegistry, TBusiness>;
}

/** What `restoreBackup` wrote. */
export interface RestoreResult {
  businessId: Id;
  /** All rows written. */
  rows: number;
  /** Rows per table. */
  counts: Record<string, number>;
  /** Number of files written. */
  files: number;
}

/**
 * Turns the document of one version into the document of the next. It gets a copy of what was
 * read and returns the whole document; the kit sets the new version number itself.
 */
export type BackupReader = (document: Record<string, unknown>) => Record<string, unknown>;

/** What `createBackupKit` takes. */
export interface BackupKitOptions<
  TRegistry extends AnyTableRegistry,
  TBusiness extends BusinessBase = BusinessBase,
> {
  /** The format name of the edition, e.g. `field-backup`. Never renamed. */
  format: string;
  /** The version this kit writes: 1, 2, 3 … Raised when a reader of the old one is added. */
  version: number;
  /** The tables of the edition; those with `backup: false` are left out. */
  registry: TRegistry;
  /** Verifies the checksums of the files when a backup is checked. */
  hasher: Hasher;
  /** Schema of the business row. Default: `BusinessBaseSchema`. */
  businessSchema?: z.ZodType<TBusiness>;
  /**
   * Readers of older versions: `readers[n]` turns a document of version `n` into one of version
   * `n + 1`. Every version below `version` needs one, so no file ever written stays unread.
   */
  readers?: Readonly<Record<number, BackupReader>>;
  /**
   * Further rules of the caller, asked once everything else fits. Whatever it returns keeps the
   * file from coming back; the kinds are the caller's own (`<namespace>.<what>`).
   */
  validate?: (
    backup: CheckedBackup<TRegistry, TBusiness>,
  ) => readonly BackupProblem[] | Promise<readonly BackupProblem[]>;
}

/** Writing, checking and restoring the backups of one edition. */
export interface BackupKit<
  TRegistry extends AnyTableRegistry = AnyTableRegistry,
  TBusiness extends BusinessBase = BusinessBase,
> {
  readonly format: string;
  readonly version: number;
  /** The names of the tables a backup holds, in the order of the register. */
  readonly tables: readonly string[];
  /**
   * Reads the whole business as one document, soft-deleted rows included. Writes nothing.
   * Fails with a `CommandError` `not_found` if the business is not on the device. Rows and
   * files are written as they are stored; `checkBackup` on the result tells whether it would
   * come back.
   */
  exportBackup: (
    storage: Storage<TRegistry, TBusiness>,
    businessId: Id,
    ports: { clock: Clock },
  ) => Promise<BackupDocument<TRegistry, TBusiness>>;
  /**
   * Reads a parsed file as a backup and changes nothing. Every row is checked with the schema
   * of its table and must belong to the business of the file, every file must match its
   * checksum. What is written back keeps every field a schema does not know.
   */
  checkBackup: (data: unknown) => Promise<BackupCheck<TRegistry, TBusiness>>;
  /**
   * Brings a checked backup back in one transaction: the business of the file is removed from
   * the device if it is there, then written as the file holds it. No other business is touched;
   * if a row or a file of the backup has the id of one that belongs to another business,
   * nothing is written at all. Takes only what `checkBackup` of this kit returned.
   */
  restoreBackup: (
    storage: Storage<TRegistry, TBusiness>,
    backup: CheckedBackup<TRegistry, TBusiness>,
  ) => Promise<RestoreResult>;
}

/** The fields of a document. Anything else in a file cannot be kept, so it refuses the file. */
const DOCUMENT_FIELDS = [
  'format',
  'version',
  'exportedAt',
  'business',
  'tables',
  'counts',
  'files',
] as const;

/** The backup as the kit works with it: rows of any table, the business as the storage sees it. */
interface LooseBackup {
  exportedAt: IsoDateTime;
  business: BusinessBase;
  tables: Record<string, StoredRow[]>;
  files: StoredFile[];
}

const isList = (value: unknown): value is readonly unknown[] => Array.isArray(value);

const isVersion = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;

const byId = (a: { id: string }, b: { id: string }): number =>
  a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

const sum = (counts: Record<string, number>): number =>
  Object.values(counts).reduce((total, count) => total + count, 0);

/** A field of a record that was read from a file: its own, never one it inherits. */
function own(record: Record<string, unknown>, key: string): unknown {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}

/** The id of something that is not checked yet, if it has one that can be shown. */
function readableId(value: unknown): { id?: string } {
  return isPlainRecord(value) && typeof value.id === 'string' ? { id: value.id } : {};
}

function checkedReaders(
  version: number,
  readers: Readonly<Record<number, BackupReader>>,
): ReadonlyMap<number, BackupReader> {
  const byVersion = new Map<number, BackupReader>();
  for (const [key, reader] of Object.entries(readers)) {
    const from = Number(key);
    if (!isVersion(from) || from >= version || typeof reader !== 'function') {
      throw new TypeError(
        `A reader belongs to a version below ${version}, got ${JSON.stringify(key)}`,
      );
    }
    byVersion.set(from, reader);
  }
  for (let from = 1; from < version; from += 1) {
    if (!byVersion.has(from)) {
      throw new TypeError(`Version ${version} of a backup needs a reader for version ${from}`);
    }
  }
  return byVersion;
}

/**
 * Builds the backup of an edition from its table register. Throws a `TypeError` for a format
 * without a name, a version that is not a whole number from 1, or a missing reader.
 */
export function createBackupKit<
  TRegistry extends AnyTableRegistry,
  TBusiness extends BusinessBase = BusinessBase,
>(options: BackupKitOptions<TRegistry, TBusiness>): BackupKit<TRegistry, TBusiness> {
  const { format, version, registry, hasher, validate } = options;
  if (typeof format !== 'string' || format.trim() === '' || format !== format.trim()) {
    throw new TypeError('The backup format needs a name without surrounding spaces');
  }
  if (!isVersion(version)) {
    throw new TypeError(`The backup version must be a whole number from 1, got ${String(version)}`);
  }
  const readers = checkedReaders(version, options.readers ?? {});
  const businessSchema: z.ZodType<BusinessBase> = options.businessSchema ?? BusinessBaseSchema;
  const backupTables: readonly TableDefinition[] = registry.tables.filter((table) => table.backup);
  const tableNames = Object.freeze(backupTables.map((table) => table.name));
  /** The backups this kit checked, with the form it works on. */
  const checked = new WeakMap<object, LooseBackup>();

  const emptyCounts = (): Record<string, number> =>
    Object.fromEntries(tableNames.map((name) => [name, 0]));

  function refused(problems: BackupProblem[], fileVersion?: number): { preview: BackupPreview } {
    return {
      preview: {
        recognised: false,
        importable: false,
        ...(fileVersion === undefined ? {} : { version: fileVersion }),
        rows: 0,
        counts: emptyCounts(),
        files: 0,
        problems,
      },
    };
  }

  /**
   * The document in the version of this kit, or the problem that keeps it from being read: a
   * newer version is refused, an older one goes through the readers, one after the other.
   */
  function upgraded(
    data: Record<string, unknown>,
  ): { document: Record<string, unknown>; fileVersion: number } | { problem: BackupProblem } {
    const written = data.version;
    if (!isVersion(written) || written > version) {
      const shown =
        typeof written === 'number' || typeof written === 'string' ? String(written) : undefined;
      return { problem: { kind: 'version', ...(shown === undefined ? {} : { version: shown }) } };
    }
    if (written === version) {
      return { document: data, fileVersion: written };
    }
    try {
      // A copy, so a reader may change what it gets without changing what the caller holds.
      let document = plainCopy(data);
      for (let from = written; from < version; from += 1) {
        const next: unknown = readers.get(from)?.(document);
        if (!isPlainRecord(next)) {
          return { problem: { kind: 'version', version: String(written) } };
        }
        document = { ...plainCopy(next), version: from + 1 };
      }
      return { document, fileVersion: written };
    } catch {
      // A reader that cannot make sense of the file, or a file that is not plain data.
      return { problem: { kind: 'version', version: String(written) } };
    }
  }

  /** A row as it will be written, or nothing if it must not come back. */
  function readRow(
    table: TableDefinition,
    raw: unknown,
    businessId: Id | undefined,
    seen: Set<string>,
  ): StoredRow | undefined {
    try {
      const parsed = table.schema.safeParse(raw);
      if (
        !parsed.success ||
        (businessId !== undefined && parsed.data.businessId !== businessId) ||
        seen.has(parsed.data.id)
      ) {
        return undefined;
      }
      seen.add(parsed.data.id);
      return keepUnknownFields(raw, parsed.data);
    } catch {
      // What is not plain data cannot be a row.
      return undefined;
    }
  }

  /** Meta data and bytes of a file entry, before its checksum is looked at. */
  function readFile(
    raw: unknown,
    businessId: Id | undefined,
    seen: Set<string>,
  ): StoredFile | undefined {
    try {
      if (
        !isPlainRecord(raw) ||
        Object.keys(raw).some((key) => key !== 'meta' && key !== 'data') ||
        typeof raw.data !== 'string'
      ) {
        return undefined;
      }
      const parsed = FileMetaSchema.safeParse(raw.meta);
      if (
        !parsed.success ||
        (businessId !== undefined && parsed.data.businessId !== businessId) ||
        seen.has(parsed.data.id)
      ) {
        return undefined;
      }
      seen.add(parsed.data.id);
      return { meta: keepUnknownFields(raw.meta, parsed.data), bytes: base64Decode(raw.data) };
    } catch {
      // Not Base64, or meta data that is not plain data.
      return undefined;
    }
  }

  async function checkBackup(data: unknown): Promise<BackupCheck<TRegistry, TBusiness>> {
    if (!isPlainRecord(data) || data.format !== format) {
      return refused([{ kind: 'format' }]);
    }
    const read = upgraded(data);
    if ('problem' in read) {
      return refused([read.problem], isVersion(data.version) ? data.version : undefined);
    }
    const { document, fileVersion } = read;

    const problems: BackupProblem[] = [];
    for (const field of Object.keys(document)) {
      if (!(DOCUMENT_FIELDS as readonly string[]).includes(field)) {
        problems.push({ kind: 'field', field });
      }
    }
    const exported = IsoDateTimeSchema.safeParse(document.exportedAt);
    if (!exported.success) {
      problems.push({ kind: 'field', field: 'exportedAt' });
    }

    let business: BusinessBase | undefined;
    try {
      const parsed = businessSchema.safeParse(document.business);
      business = parsed.success ? keepUnknownFields(document.business, parsed.data) : undefined;
    } catch {
      business = undefined;
    }
    if (business === undefined) {
      problems.push({ kind: 'business' });
    }

    const counts = emptyCounts();
    const tables: Record<string, StoredRow[]> = {};
    const rawTables = isPlainRecord(document.tables) ? document.tables : undefined;
    if (rawTables === undefined) {
      // Without the tables there is nothing to check row by row: one problem says so.
      problems.push({ kind: 'table' });
    } else {
      for (const table of backupTables) {
        const rawRows = own(rawTables, table.name);
        if (!isList(rawRows)) {
          problems.push({ kind: 'table', table: table.name });
          continue;
        }
        counts[table.name] = rawRows.length;
        const seen = new Set<string>();
        const rows: StoredRow[] = [];
        for (const raw of rawRows) {
          const row = readRow(table, raw, business?.id, seen);
          if (row === undefined) {
            problems.push({ kind: 'row', table: table.name, ...readableId(raw) });
          } else {
            rows.push(row);
          }
        }
        tables[table.name] = rows;
      }
      for (const name of Object.keys(rawTables)) {
        if (!tableNames.includes(name)) {
          problems.push({ kind: 'table', table: name });
        }
      }
      const rawCounts = isPlainRecord(document.counts) ? document.counts : undefined;
      if (rawCounts === undefined) {
        problems.push({ kind: 'count' });
      } else {
        // A table that is missing altogether has its problem already; here every table the file
        // holds must have as many rows as the file says, and the file must count no other.
        for (const name of tableNames) {
          const rawRows = own(rawTables, name);
          if (isList(rawRows) && own(rawCounts, name) !== rawRows.length) {
            problems.push({ kind: 'count', table: name });
          }
        }
        for (const name of Object.keys(rawCounts)) {
          if (!tableNames.includes(name)) {
            problems.push({ kind: 'count', table: name });
          }
        }
      }
    }

    const files: StoredFile[] = [];
    const rawFiles = isList(document.files) ? document.files : undefined;
    if (rawFiles === undefined) {
      problems.push({ kind: 'file' });
    } else {
      const seen = new Set<string>();
      for (const raw of rawFiles) {
        const file = readFile(raw, business?.id, seen);
        if (file !== undefined && (await matchesChecksum(hasher, file.meta, file.bytes))) {
          files.push(file);
        } else {
          problems.push({ kind: 'file', ...readableId(isPlainRecord(raw) ? raw.meta : undefined) });
        }
      }
    }

    const preview = (all: BackupProblem[]): BackupPreview => ({
      recognised: true,
      importable: all.length === 0,
      version: fileVersion,
      ...(business === undefined ? {} : { businessId: business.id, businessName: business.name }),
      ...(exported.success ? { exportedAt: exported.data } : {}),
      rows: sum(counts),
      counts,
      files: rawFiles?.length ?? 0,
      problems: all,
    });
    if (problems.length > 0 || business === undefined || !exported.success) {
      return { preview: preview(problems) };
    }

    const loose: LooseBackup = { exportedAt: exported.data, business, tables, files };
    // The rows were checked with the schemas of this register and the business with its schema;
    // from here on they carry those types.
    const backup = Object.freeze(loose) as unknown as CheckedBackup<TRegistry, TBusiness>;
    const further = validate === undefined ? [] : await validate(backup);
    if (further.length > 0) {
      return { preview: preview([...further]) };
    }
    checked.set(backup, loose);
    return { preview: preview([]), backup };
  }

  async function exportBackup(
    storage: Storage<TRegistry, TBusiness>,
    businessId: Id,
    { clock }: { clock: Clock },
  ): Promise<BackupDocument<TRegistry, TBusiness>> {
    // One transaction: the file is one moment of the business, not a mix of two.
    return storage.transaction(async () => {
      const business = await storage.businesses.get(businessId);
      if (business === undefined) {
        throw new CommandError('not_found', `Business ${businessId} not found`);
      }
      const tables: Record<string, StoredRow[]> = {};
      const counts: Record<string, number> = {};
      for (const table of backupTables) {
        // Sorted, so the same business gives the same file whatever order the store answers in.
        const rows = (await storage.table(table).ofBusiness(businessId)).sort(byId);
        tables[table.name] = rows;
        counts[table.name] = rows.length;
      }
      const files: BackupFile[] = [];
      for (const meta of (await storage.files.ofBusiness(businessId)).sort(byId)) {
        const file = await storage.files.get(meta.id);
        if (file !== undefined) {
          files.push({ meta: file.meta, data: base64Encode(file.bytes) });
        }
      }
      return {
        format,
        version,
        exportedAt: clock.now(),
        business,
        // Read from the tables of this register, so the rows have the types it gives them.
        tables: tables as BackupRows<TRegistry>,
        counts,
        files,
      };
    });
  }

  async function restoreBackup(
    storage: Storage<TRegistry, TBusiness>,
    backup: CheckedBackup<TRegistry, TBusiness>,
  ): Promise<RestoreResult> {
    const loose = checked.get(backup);
    if (loose === undefined) {
      // Unchecked rows would replace a whole business: fail before anything is removed.
      throw new TypeError(
        'restoreBackup takes only a backup that checkBackup of this kit returned',
      );
    }
    const businessId = loose.business.id;
    return storage.transaction(async () => {
      await storage.purge(businessId);
      await storage.businesses.add(backup.business);
      const counts = emptyCounts();
      for (const table of backupTables) {
        const store = storage.table(table);
        // `add`, not `put`: an id that is taken belongs to another business, and that row stays.
        for (const row of loose.tables[table.name] ?? []) {
          await store.add(row);
        }
        counts[table.name] = loose.tables[table.name]?.length ?? 0;
      }
      for (const file of loose.files) {
        await storage.files.restore(file);
      }
      return { businessId, rows: sum(counts), counts, files: loose.files.length };
    });
  }

  return { format, version, tables: tableNames, exportBackup, checkBackup, restoreBackup };
}

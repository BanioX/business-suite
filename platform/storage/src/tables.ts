import type { Id } from '@onestrand/core';
import { z } from 'zod';
import { StorageError } from './errors';

/**
 * The register of tables (suite ADR-0005). The platform holds no fixed list of tables: every
 * module and every industry declares its own with `defineTable`, and an edition puts them
 * together with `createTableRegistry`. One register then drives the storage in memory, the
 * database of the browser and the backup, so a new table cannot be forgotten in one of them.
 *
 * A register is a value: it is never changed after creation, `extend` returns a new one.
 */

/** What every stored row carries: its own id and the business it belongs to. */
export interface StoredRow {
  id: Id;
  businessId: Id;
}

/**
 * Lower-case words joined by single underscores, starting with a letter: `time_entries`. Tables
 * of an industry carry its prefix (`facility_keys`), so two industries never share a table by
 * accident.
 */
export const TABLE_NAME_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

/**
 * Names the storage keeps for itself: businesses, events, the command log and files are stored
 * next to the tables, and an adapter of a database gives each of them a store of that name.
 */
export const RESERVED_TABLE_NAMES = ['businesses', 'events', 'commands', 'files'] as const;

/** How delicate data is, lowest first (suite ADR-0005, 9). */
export const SENSITIVITIES = ['normal', 'internal', 'sensitive'] as const;
/**
 * - `normal`: everybody who may see the function sees it.
 * - `internal`: for the business only, never for third parties (notes, costs).
 * - `sensitive`: needs a delicate right and never reaches a device without it (wages, health).
 */
export type Sensitivity = (typeof SENSITIVITIES)[number];

/** How a table is reconciled between devices later (suite ADR-0005, 10; ADR-0006). */
export const SYNC_KINDS = ['ledger', 'single_writer', 'device', 'computed'] as const;
/**
 * - `ledger`: rows are only added, so two devices merge by taking the rows of both.
 * - `single_writer`: one device at a time owns a row or a number range; the others read.
 * - `device`: stays on the device it was made on.
 * - `computed`: can be rebuilt from other tables at any time.
 */
export type SyncKind = (typeof SYNC_KINDS)[number];

/** An index: one field, or several as a compound index in this order. */
export type TableIndex = string | readonly string[];

/** A name a field of a row can have; an index names fields of the row itself, no paths. */
const FIELD_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** The keys of a row type; for a union of row types the keys of every member. */
type FieldOf<TRow> = TRow extends unknown ? keyof TRow & string : never;

/** What `defineTable` takes. */
export interface TableOptions<TName extends string, TRow extends StoredRow> {
  /** See `TABLE_NAME_PATTERN`. Never renamed once an edition has shipped with it. */
  name: TName;
  /** Zod schema of a row. A row has at least `id` and `businessId` (`syncFields` of the core). */
  schema: z.ZodType<TRow>;
  /**
   * Fields the database indexes, a compound index as a list. `id` is the key of every table and
   * `businessId` is always indexed; neither is listed.
   */
  indexes: readonly (FieldOf<TRow> | readonly FieldOf<TRow>[])[];
  /** How delicate the table is as a whole. */
  sensitivity: Sensitivity;
  /** Single fields that are more or less delicate than the table. */
  fields?: Readonly<Partial<Record<FieldOf<TRow>, Sensitivity>>>;
  sync: SyncKind;
  /** Default true. False keeps the table out of the backup (device-only or computed data). */
  backup?: boolean;
  /** Default false. True means rows are added and never replaced (ledgers). */
  appendOnly?: boolean;
}

/** A table as the register holds it: checked, with every default filled in, frozen. */
export interface TableDefinition<
  TName extends string = string,
  TRow extends StoredRow = StoredRow,
> {
  readonly name: TName;
  readonly schema: z.ZodType<TRow>;
  readonly indexes: readonly TableIndex[];
  readonly sensitivity: Sensitivity;
  /** Fields whose sensitivity differs from the table's; empty if none does. */
  readonly fields: Readonly<Record<string, Sensitivity>>;
  readonly sync: SyncKind;
  readonly backup: boolean;
  readonly appendOnly: boolean;
}

function invalid(name: unknown, problem: string): StorageError {
  return new StorageError('invalid_table', `Table ${JSON.stringify(name)}: ${problem}`);
}

const isList = (value: unknown): value is readonly unknown[] => Array.isArray(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !isList(value);

function oneOf<TValue extends string>(values: readonly TValue[], value: unknown): value is TValue {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}

/**
 * The fields a schema declares, if it is an object schema. Other schemas (a union of row kinds,
 * a schema with a transform) cannot be asked; for them only the type guards the field names.
 */
function declaredFields(schema: z.ZodType): ReadonlySet<string> | undefined {
  return schema instanceof z.ZodObject ? new Set(Object.keys(schema.shape)) : undefined;
}

function checkedIndexes(
  name: string,
  indexes: unknown,
  declared: ReadonlySet<string> | undefined,
): readonly TableIndex[] {
  if (!isList(indexes)) {
    throw invalid(name, 'indexes must be a list (empty if the table needs none)');
  }
  const seen = new Set<string>();
  return Object.freeze(
    indexes.map((index): TableIndex => {
      const fields = isList(index) ? index : [index];
      if (fields.length === 0) {
        throw invalid(name, 'a compound index needs at least one field');
      }
      const checked = fields.map((field) => {
        if (typeof field !== 'string' || !FIELD_NAME_PATTERN.test(field)) {
          throw invalid(name, `an index names fields of the row, got ${JSON.stringify(field)}`);
        }
        if (declared?.has(field) === false) {
          throw invalid(name, `the index on "${field}" names a field the schema does not know`);
        }
        return field;
      });
      if (new Set(checked).size !== checked.length) {
        throw invalid(name, `the index on ${checked.join(', ')} names a field twice`);
      }
      const key = checked.join(',');
      if (seen.has(key)) {
        throw invalid(name, `the index on ${checked.join(', ')} is declared twice`);
      }
      seen.add(key);
      return isList(index) ? Object.freeze(checked) : (checked[0] ?? '');
    }),
  );
}

function checkedFields(
  name: string,
  fields: unknown,
  declared: ReadonlySet<string> | undefined,
): Readonly<Record<string, Sensitivity>> {
  if (fields === undefined) {
    return Object.freeze({});
  }
  if (!isRecord(fields)) {
    throw invalid(name, 'fields must map field names to a sensitivity');
  }
  const checked: Record<string, Sensitivity> = {};
  for (const [field, sensitivity] of Object.entries(fields)) {
    if (!FIELD_NAME_PATTERN.test(field)) {
      throw invalid(name, `fields names fields of the row, got ${JSON.stringify(field)}`);
    }
    if (declared?.has(field) === false) {
      throw invalid(name, `fields names "${field}", which the schema does not know`);
    }
    if (!oneOf(SENSITIVITIES, sensitivity)) {
      throw invalid(
        name,
        `the sensitivity of "${field}" must be one of ${SENSITIVITIES.join(', ')}`,
      );
    }
    checked[field] = sensitivity;
  }
  return Object.freeze(checked);
}

function checkedFlag(name: string, flag: string, value: unknown, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== 'boolean') {
    throw invalid(name, `${flag} must be true or false`);
  }
  return value;
}

/**
 * Checks a table and returns it with every default filled in, frozen. The one place that knows
 * the rules; `defineTable` and `createTableRegistry` both go through it, so a definition written
 * by hand is held to them as well.
 */
function checkedTable(options: {
  readonly [TKey in keyof TableDefinition]?: unknown;
}): TableDefinition {
  const { name, schema } = options;
  if (typeof name !== 'string' || !TABLE_NAME_PATTERN.test(name)) {
    throw invalid(name, `the name must match ${String(TABLE_NAME_PATTERN)}`);
  }
  if (oneOf(RESERVED_TABLE_NAMES, name)) {
    throw invalid(name, 'the name is kept for the storage itself');
  }
  if (!(schema instanceof z.ZodType)) {
    throw invalid(name, 'the schema must be a Zod schema');
  }
  const declared = declaredFields(schema);
  for (const field of ['id', 'businessId']) {
    if (declared?.has(field) === false) {
      throw invalid(name, `a row needs the field "${field}"`);
    }
  }
  const { sensitivity, sync } = options;
  if (!oneOf(SENSITIVITIES, sensitivity)) {
    throw invalid(name, `the sensitivity must be one of ${SENSITIVITIES.join(', ')}`);
  }
  if (!oneOf(SYNC_KINDS, sync)) {
    throw invalid(name, `sync must be one of ${SYNC_KINDS.join(', ')}`);
  }
  const appendOnly = checkedFlag(name, 'appendOnly', options.appendOnly, false);
  if (sync === 'ledger' && !appendOnly) {
    // Two devices merge a ledger by taking the rows of both; a row that one of them replaced
    // would come back in two versions.
    throw invalid(name, 'a table reconciled as a ledger must be appendOnly');
  }
  return Object.freeze({
    name,
    // The class check above says it is a schema; that its rows carry the ids is the caller's
    // word where the schema is not an object schema.
    schema: schema as z.ZodType<StoredRow>,
    indexes: checkedIndexes(name, options.indexes, declared),
    sensitivity,
    fields: checkedFields(name, options.fields, declared),
    sync,
    backup: checkedFlag(name, 'backup', options.backup, true),
    appendOnly,
  });
}

/**
 * Declares a table. Throws a `StorageError` with the code `invalid_table` and a message that
 * names the table and the rule: a bad name, a schema without `id` or `businessId`, an index or
 * a field sensitivity on a field the schema does not know, a ledger that is not append-only.
 *
 * Field names are checked against the schema where it is an object schema; for other schemas
 * (a union of row kinds) the types of `indexes` and `fields` are the only guard.
 */
export function defineTable<const TName extends string, TRow extends StoredRow>(
  options: TableOptions<TName, TRow>,
): TableDefinition<TName, TRow> {
  // The check works on unknown values; name and row type are those of the options it was given.
  return checkedTable(options) as TableDefinition<TName, TRow>;
}

/**
 * How delicate one field of a table is: its own entry in `fields`, otherwise the sensitivity of
 * the table. One rule for everyone who filters by it.
 */
export function fieldSensitivity(table: TableDefinition, field: string): Sensitivity {
  return Object.hasOwn(table.fields, field)
    ? (table.fields[field] ?? table.sensitivity)
    : table.sensitivity;
}

/** The row types of a list of tables, by table name. */
export type RowsOf<TTables extends readonly TableDefinition[]> = {
  [TTable in TTables[number] as TTable['name']]: TTable extends TableDefinition<
    string,
    infer TRow extends StoredRow
  >
    ? TRow
    : never;
};

/** Row types by table name: what a register knows by type. */
export type RowTypes = Record<string, StoredRow>;

/**
 * A register whose tables are not known by type. Code that works for every register (the
 * storage in memory, the backup) takes this; every `TableRegistry` is one.
 */
export interface AnyTableRegistry {
  /** The names in the order of registration. */
  readonly names: readonly string[];
  /** The definitions in the order of registration. */
  readonly tables: readonly TableDefinition[];
  has(name: string): boolean;
  /** The definition of a table; throws a `StorageError` with the code `unknown_table`. */
  get(name: string): TableDefinition;
  /** A new register with further tables; this one stays as it is. */
  extend(more: readonly TableDefinition[]): AnyTableRegistry;
}

/** A register that knows the names of its tables and the type of their rows. */
export interface TableRegistry<TRows extends RowTypes> extends AnyTableRegistry {
  readonly names: readonly (keyof TRows & string)[];
  has(name: string): name is keyof TRows & string;
  get<TName extends keyof TRows & string>(name: TName): TableDefinition<TName, TRows[TName]>;
  extend<const TMore extends readonly TableDefinition[]>(
    more: TMore,
  ): TableRegistry<TRows & RowsOf<TMore>>;
}

/** The row types of a register by table name: `Rows<typeof REGISTER>['time_entries']`. */
export type Rows<TRegistry extends AnyTableRegistry> =
  TRegistry extends TableRegistry<infer TRows extends RowTypes> ? TRows : RowTypes;

/** The names of the tables of a register. */
export type TableName<TRegistry extends AnyTableRegistry> = keyof Rows<TRegistry> & string;

/**
 * Builds a register from definitions. Every definition is checked as by `defineTable`; a name
 * that occurs twice is a `StorageError` with the code `duplicate_table`. The result is frozen.
 */
export function createTableRegistry<const TTables extends readonly TableDefinition[]>(
  tables: TTables,
): TableRegistry<RowsOf<TTables>> {
  return registryOf<RowsOf<TTables>>(tables);
}

function registryOf<TRows extends RowTypes>(
  definitions: readonly TableDefinition[],
): TableRegistry<TRows> {
  type Name = keyof TRows & string;
  const byName = new Map<string, TableDefinition>();
  for (const definition of definitions) {
    const table = checkedTable(definition);
    if (byName.has(table.name)) {
      throw new StorageError('duplicate_table', `Table "${table.name}" is registered twice`);
    }
    byName.set(table.name, table);
  }
  const tables = Object.freeze([...byName.values()]);
  // The names are those of the definitions the type was built from.
  const names = Object.freeze(tables.map((table) => table.name)) as readonly Name[];

  return Object.freeze({
    names,
    tables,
    has: (name: string): name is Name => byName.has(name),
    get: <TName extends Name>(name: TName) => {
      const table = byName.get(name);
      if (table === undefined) {
        throw new StorageError(
          'unknown_table',
          `Unknown table ${JSON.stringify(name)}; registered: ${names.join(', ')}`,
        );
      }
      return table as TableDefinition<TName, TRows[TName]>;
    },
    extend: <const TMore extends readonly TableDefinition[]>(more: TMore) =>
      registryOf<TRows & RowsOf<TMore>>([...tables, ...more]),
  });
}

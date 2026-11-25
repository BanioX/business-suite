import type { AnyTableRegistry, TableIndex } from '@onestrand/storage';
import { z } from 'zod';

/**
 * The schema ledger of a database (suite architecture, 8): the history of its schema as data,
 * written once and only ever appended to. Each step names the tables and indexes that come with
 * it and the migrations of rows that run with it; the version of the database is the number of
 * steps. A step that was written is never changed and never removed, so every device, whichever
 * version it last ran, ends on the same schema by running the steps it has not seen.
 *
 * The ledger itself belongs to the edition, which keeps it next to its manifest. This module is
 * the mechanics: what a step is, whether a ledger fits the register of tables, and what the next
 * step would be. All of it is pure; opening the database is `openIndexedDbStorage`.
 */

/** A table that comes with a step, and the indexes it has from the start. */
export interface SchemaTable {
  /** The name of a table of the register. Never renamed. */
  readonly name: string;
  /**
   * The indexes the table has from the start, as `indexes` of `defineTable` names them: a field,
   * or a list of fields as a compound index. `businessId` is always indexed and not listed.
   */
  readonly indexes?: readonly TableIndex[];
}

/** An index that comes to a table an earlier step created. */
export interface SchemaIndexAddition {
  readonly table: string;
  readonly index: TableIndex;
}

/** One step of the schema. */
export interface SchemaStep {
  /** Tables that come with this step. */
  readonly tables?: readonly SchemaTable[];
  /** Indexes that come to tables of this step or of an earlier one. */
  readonly indexes?: readonly SchemaIndexAddition[];
  /**
   * The ids of the migrations of rows that run with this step, in this order, after its tables
   * and indexes exist. A migration runs once on a device: in the step that names it.
   */
  readonly migrations?: readonly string[];
}

/** The history of a schema: step `n` brings the database to version `n`. */
export type SchemaLedger = readonly SchemaStep[];

/** What the ledger needs to know of a migration: where it runs. */
export interface MigrationReference {
  readonly id: string;
  readonly table: string;
}

/** The codes of what can be wrong with a ledger. */
export const SCHEMA_PROBLEM_CODES = [
  'empty',
  'invalid_step',
  'step_changed',
  'step_removed',
  'table_twice',
  'table_missing',
  'unknown_table',
  'index_twice',
  'index_missing',
  'index_misplaced',
  'unknown_index',
  'migration_twice',
  'unknown_migration',
  'migration_misplaced',
] as const;
export type SchemaProblemCode = (typeof SCHEMA_PROBLEM_CODES)[number];

/**
 * One thing that is wrong with a ledger, as data.
 *
 * - `empty`: the ledger has no step, so there is no database to open.
 * - `invalid_step`: a step is not shaped like a `SchemaStep` (a ledger read from a file).
 * - `step_changed`, `step_removed`: a step that an earlier ledger (`previous`) had is not the
 *   same any more, or is gone.
 * - `table_twice`: two steps (or one) create the same table.
 * - `table_missing`: a table of the register is created by no step.
 * - `unknown_table`: a step names a table the register does not know.
 * - `index_twice`: an index of a table is named twice.
 * - `index_missing`: an index of a table of the register is named by no step.
 * - `index_misplaced`: an index comes to a table that no step so far has created.
 * - `unknown_index`: a step names an index the register does not list for that table.
 * - `migration_twice`, `unknown_migration`: a migration is named twice, or is not one of the
 *   migrations the edition has.
 * - `migration_misplaced`: a migration runs in a step before the table it works on exists.
 */
export interface SchemaProblem {
  code: SchemaProblemCode;
  /** The step, counted from 1: the version of the database it brings. Absent for the whole ledger. */
  step?: number;
  /** What the finding is about: a table, an index as `table.index`, or a migration. */
  subject: string;
  /** English, for the person who reads a red test. */
  message: string;
}

const IndexSchema = z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]);

/** The shape of a step, as a ledger read from a file must have it. */
const StepSchema = z.strictObject({
  tables: z
    .array(z.strictObject({ name: z.string().min(1), indexes: z.array(IndexSchema).optional() }))
    .optional(),
  indexes: z.array(z.strictObject({ table: z.string().min(1), index: IndexSchema })).optional(),
  migrations: z.array(z.string().min(1)).optional(),
});

/** The name an index has in the database: its field, or its fields joined by commas. */
export function indexName(index: TableIndex): string {
  return typeof index === 'string' ? index : index.join(',');
}

/** The key path of an index: a field, or a list of fields for a compound index. */
export function indexKeyPath(index: TableIndex): string | string[] {
  return typeof index === 'string' ? index : [...index];
}

/** An index as one text that tells a field from a list of fields. */
const indexIdentity = (index: TableIndex): string => JSON.stringify(index);

/** A step with every optional part filled in, so two steps compare by what they say. */
function normalized(step: SchemaStep): {
  tables: { name: string; indexes: TableIndex[] }[];
  indexes: { table: string; index: TableIndex }[];
  migrations: string[];
} {
  return {
    tables: (step.tables ?? []).map((table) => ({
      name: table.name,
      indexes: [...(table.indexes ?? [])],
    })),
    indexes: (step.indexes ?? []).map(({ table, index }) => ({ table, index })),
    migrations: [...(step.migrations ?? [])],
  };
}

/** A step as one text, for comparing it with itself later; a step that is no step compares as it is. */
function identityOf(step: SchemaStep): string {
  return JSON.stringify(StepSchema.safeParse(step).success ? normalized(step) : step);
}

/**
 * The schema a ledger arrives at: every table with its indexes, in the order the tables and
 * indexes were added. The steps are assumed to be well formed (see `schemaLedgerProblems`).
 */
export function schemaOf(ledger: SchemaLedger): Map<string, TableIndex[]> {
  const schema = new Map<string, TableIndex[]>();
  for (const step of ledger) {
    const { tables, indexes } = normalized(step);
    for (const table of tables) {
      schema.set(table.name, [...(schema.get(table.name) ?? []), ...table.indexes]);
    }
    for (const { table, index } of indexes) {
      schema.set(table, [...(schema.get(table) ?? []), index]);
    }
  }
  return schema;
}

/** What `schemaLedgerProblems` and `proposeSchemaStep` look at. */
export interface SchemaLedgerInput {
  readonly ledger: SchemaLedger;
  /** The register of tables the ledger has to lead to. */
  readonly tables: Pick<AnyTableRegistry, 'tables'>;
  /** The migrations of rows the edition has; those a step names must be among them. */
  readonly migrations?: readonly MigrationReference[];
}

/**
 * What is wrong with a ledger, as data; empty when the ledger leads exactly to the register.
 * Pure, and never throws for what it finds.
 *
 * `previous` is the ledger as it was frozen the last time (the edition keeps a copy next to the
 * ledger, or a test reads the one in the last release): every step in it must still be there,
 * unchanged. That is the rule «only appended» as a check; the steps after the last frozen one
 * are free to be new.
 */
export function schemaLedgerProblems(
  input: SchemaLedgerInput & { readonly previous?: SchemaLedger },
): SchemaProblem[] {
  const { ledger, previous = [] } = input;
  const problems: SchemaProblem[] = [];
  const report = (
    code: SchemaProblemCode,
    subject: string,
    message: string,
    step?: number,
  ): void => {
    problems.push({ code, ...(step === undefined ? {} : { step }), subject, message });
  };

  previous.forEach((before, index) => {
    const now = ledger[index];
    if (now === undefined) {
      report(
        'step_removed',
        `step ${String(index + 1)}`,
        `Step ${String(index + 1)} was in the ledger before and is gone: steps are only appended.`,
        index + 1,
      );
    } else if (identityOf(before) !== identityOf(now)) {
      report(
        'step_changed',
        `step ${String(index + 1)}`,
        `Step ${String(index + 1)} is not what it was: a step that was written is never changed, a correction is a new step.`,
        index + 1,
      );
    }
  });

  if (ledger.length === 0) {
    report(
      'empty',
      'ledger',
      'The ledger has no step: it needs at least the step that creates the tables.',
    );
    return problems;
  }

  const register = new Map(
    input.tables.tables.map((table) => [
      table.name,
      new Set(table.indexes.map((index) => indexIdentity(index))),
    ]),
  );
  const migrations = new Map((input.migrations ?? []).map((entry) => [entry.id, entry.table]));
  /** Per table the indexes the steps so far brought, by identity. */
  const created = new Map<string, Set<string>>();
  const usedMigrations = new Set<string>();

  ledger.forEach((raw, position) => {
    const number = position + 1;
    const shape = StepSchema.safeParse(raw);
    if (!shape.success) {
      const where = shape.error.issues.map((issue) => issue.path.map(String).join('.') || 'step');
      report(
        'invalid_step',
        `step ${String(number)}`,
        `Step ${String(number)} is not shaped like a step of the ledger: ${[...new Set(where)].join(', ')}.`,
        number,
      );
      return;
    }
    const step = normalized(raw);

    const addIndex = (table: string, index: TableIndex): void => {
      const identity = indexIdentity(index);
      const seen = created.get(table);
      if (seen === undefined) {
        return;
      }
      if (seen.has(identity)) {
        report(
          'index_twice',
          `${table}.${indexName(index)}`,
          `The index ${indexName(index)} of ${table} is named twice (step ${String(number)}).`,
          number,
        );
        return;
      }
      seen.add(identity);
      if (register.get(table)?.has(identity) === false) {
        report(
          'unknown_index',
          `${table}.${indexName(index)}`,
          `Step ${String(number)} gives ${table} the index ${indexName(index)}, which the register does not list for it.`,
          number,
        );
      }
    };

    for (const table of step.tables) {
      if (created.has(table.name)) {
        report(
          'table_twice',
          table.name,
          `Step ${String(number)} creates ${table.name}, which an earlier step created already.`,
          number,
        );
        continue;
      }
      if (!register.has(table.name)) {
        report(
          'unknown_table',
          table.name,
          `Step ${String(number)} creates ${table.name}, which the register does not know.`,
          number,
        );
        continue;
      }
      created.set(table.name, new Set());
      for (const index of table.indexes) {
        addIndex(table.name, index);
      }
    }

    for (const { table, index } of step.indexes) {
      if (!register.has(table)) {
        report(
          'unknown_table',
          table,
          `Step ${String(number)} gives ${table} an index, but the register does not know the table.`,
          number,
        );
      } else if (!created.has(table)) {
        report(
          'index_misplaced',
          `${table}.${indexName(index)}`,
          `Step ${String(number)} gives ${table} an index before any step creates the table.`,
          number,
        );
      } else {
        addIndex(table, index);
      }
    }

    for (const id of step.migrations) {
      const table = migrations.get(id);
      if (usedMigrations.has(id)) {
        report(
          'migration_twice',
          id,
          `The migration ${id} is named twice: it runs once, in the step that names it.`,
          number,
        );
      } else if (table === undefined) {
        report(
          'unknown_migration',
          id,
          `Step ${String(number)} names the migration ${id}, which the edition does not have.`,
          number,
        );
      } else if (!created.has(table)) {
        report(
          'migration_misplaced',
          id,
          `Step ${String(number)} runs the migration ${id} before ${table} exists.`,
          number,
        );
      }
      usedMigrations.add(id);
    }
  });

  for (const [table, indexes] of register) {
    const have = created.get(table);
    if (have === undefined) {
      report(
        'table_missing',
        table,
        `The table ${table} of the register is created by no step of the ledger.`,
      );
      continue;
    }
    for (const identity of indexes) {
      if (!have.has(identity)) {
        const index = JSON.parse(identity) as TableIndex;
        report(
          'index_missing',
          `${table}.${indexName(index)}`,
          `The index ${indexName(index)} of ${table} is named by no step of the ledger.`,
        );
      }
    }
  }
  return problems;
}

/**
 * The step that brings a ledger up to the register: every table of the register that no step
 * creates, with all its indexes; every index of a known table that no step names; and the
 * migrations of the edition that no step names. `undefined` when the ledger is up to date.
 *
 * The proposal is a suggestion for the person who keeps the ledger: they append it (or not) and
 * commit it. It never changes a step that exists, and it cannot repair a ledger that names
 * what the register does not have (that is for `schemaLedgerProblems` to tell).
 */
export function proposeSchemaStep(input: SchemaLedgerInput): SchemaStep | undefined {
  const known = schemaOf(input.ledger);
  const tables: SchemaTable[] = [];
  const indexes: SchemaIndexAddition[] = [];
  for (const table of input.tables.tables) {
    const have = known.get(table.name);
    if (have === undefined) {
      tables.push({ name: table.name, indexes: [...table.indexes] });
      continue;
    }
    const haveIdentities = new Set(have.map((index) => indexIdentity(index)));
    for (const index of table.indexes) {
      if (!haveIdentities.has(indexIdentity(index))) {
        indexes.push({ table: table.name, index });
      }
    }
  }
  const named = new Set(input.ledger.flatMap((step) => step.migrations ?? []));
  const migrations = (input.migrations ?? []).map(({ id }) => id).filter((id) => !named.has(id));
  if (tables.length === 0 && indexes.length === 0 && migrations.length === 0) {
    return undefined;
  }
  return {
    ...(tables.length === 0 ? {} : { tables }),
    ...(indexes.length === 0 ? {} : { indexes }),
    ...(migrations.length === 0 ? {} : { migrations }),
  };
}

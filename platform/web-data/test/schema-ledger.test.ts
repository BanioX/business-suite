import { syncFields } from '@onestrand/core';
import {
  createTableRegistry,
  defineTable,
  type AnyTableRegistry,
  type TableDefinition,
} from '@onestrand/storage';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  indexKeyPath,
  indexName,
  proposeSchemaStep,
  schemaLedgerProblems,
  schemaOf,
  SCHEMA_PROBLEM_CODES,
  type SchemaLedger,
  type SchemaProblem,
  type SchemaStep,
} from '../src';
import {
  deviceSettingsTable,
  extraTable,
  FIRST_STEP as FIRST,
  notesTable,
  REGISTRY,
  timeEntriesTable,
} from './support';

const codes = (problems: readonly SchemaProblem[]) => problems.map((problem) => problem.code);

describe('indexes', () => {
  it('names an index by its field, or by its fields joined by commas', () => {
    expect(indexName('text')).toBe('text');
    expect(indexName(['personId', 'at'])).toBe('personId,at');
    expect(indexName(['key'])).toBe('key');
  });

  it('gives the key path as a field, or as a list for a compound index', () => {
    expect(indexKeyPath('text')).toBe('text');
    expect(indexKeyPath(['personId', 'at'])).toEqual(['personId', 'at']);
    expect(indexKeyPath(['key'])).toEqual(['key']);
  });
});

describe('what the steps of a ledger lead to', () => {
  it('collects the tables and their indexes in the order they came', () => {
    const ledger: SchemaLedger = [
      FIRST,
      { tables: [{ name: 'extra_things' }], indexes: [{ table: 'notes', index: 'updatedAt' }] },
    ];
    expect([...schemaOf(ledger)]).toEqual([
      ['notes', ['text', 'updatedAt']],
      ['time_entries', [['personId', 'at']]],
      ['device_settings', ['key']],
      ['extra_things', []],
    ]);
  });

  it('is empty for no step', () => {
    expect(schemaOf([]).size).toBe(0);
  });
});

describe('the next step', () => {
  const input = (ledger: SchemaLedger, register: Pick<AnyTableRegistry, 'tables'> = REGISTRY) => ({
    ledger,
    tables: register,
  });

  it('creates every table with all its indexes when there is no step yet', () => {
    expect(proposeSchemaStep(input([]))).toEqual(FIRST);
  });

  it('proposes nothing when the ledger is up to date', () => {
    expect(proposeSchemaStep(input([FIRST]))).toBeUndefined();
  });

  it('proposes only the new table', () => {
    expect(proposeSchemaStep(input([FIRST], REGISTRY.extend([extraTable])))).toEqual({
      tables: [{ name: 'extra_things', indexes: ['label'] }],
    });
  });

  it('proposes a new index of a table that is there', () => {
    const more = createTableRegistry([
      { ...notesTable, indexes: ['text', 'updatedAt'] },
      timeEntriesTable,
      deviceSettingsTable,
    ]);
    expect(proposeSchemaStep(input([FIRST], more))).toEqual({
      indexes: [{ table: 'notes', index: 'updatedAt' }],
    });
  });

  it('proposes the migrations that no step names, once', () => {
    const migrations = [
      { id: 'sample.first', table: 'notes' },
      { id: 'sample.second', table: 'notes' },
    ];
    expect(proposeSchemaStep({ ...input([FIRST]), migrations })).toEqual({
      migrations: ['sample.first', 'sample.second'],
    });
    expect(
      proposeSchemaStep({ ...input([FIRST, { migrations: ['sample.first'] }]), migrations }),
    ).toEqual({ migrations: ['sample.second'] });
    expect(
      proposeSchemaStep({
        ...input([FIRST, { migrations: ['sample.first', 'sample.second'] }]),
        migrations,
      }),
    ).toBeUndefined();
  });

  it('puts everything the register gained into one step', () => {
    const more = createTableRegistry([
      { ...notesTable, indexes: ['text', 'updatedAt'] },
      timeEntriesTable,
      deviceSettingsTable,
      extraTable,
    ]);
    const step = proposeSchemaStep({
      ledger: [FIRST],
      tables: more,
      migrations: [{ id: 'sample.first', table: 'notes' }],
    });
    expect(step).toEqual({
      tables: [{ name: 'extra_things', indexes: ['label'] }],
      indexes: [{ table: 'notes', index: 'updatedAt' }],
      migrations: ['sample.first'],
    });
  });
});

describe('what is wrong with a ledger, as data', () => {
  const check = (
    ledger: SchemaLedger,
    more: Partial<Parameters<typeof schemaLedgerProblems>[0]> = {},
  ) => schemaLedgerProblems({ ledger, tables: REGISTRY, ...more });

  it('finds nothing wrong with a ledger that leads exactly to the register', () => {
    expect(check([FIRST])).toEqual([]);
    expect(check([FIRST], { previous: [FIRST] })).toEqual([]);
    // A table may come in two steps, an index later than its table.
    expect(
      check([
        { tables: [{ name: 'notes' }, { name: 'device_settings', indexes: ['key'] }] },
        {
          tables: [{ name: 'time_entries' }],
          indexes: [
            { table: 'notes', index: 'text' },
            { table: 'time_entries', index: ['personId', 'at'] },
          ],
        },
      ]),
    ).toEqual([]);
  });

  it('finds a ledger with no step', () => {
    expect(codes(check([]))).toEqual(['empty']);
  });

  it('finds a step that was changed, and a step that was removed', () => {
    const changed: SchemaStep = { tables: FIRST.tables?.slice(0, 2) ?? [] };
    expect(codes(check([changed], { previous: [FIRST] }))).toContain('step_changed');
    const second: SchemaStep = { tables: [{ name: 'extra_things', indexes: ['label'] }] };
    const found = schemaLedgerProblems({
      ledger: [FIRST],
      tables: REGISTRY.extend([extraTable]),
      previous: [FIRST, second],
    });
    expect(found).toEqual([
      expect.objectContaining({ code: 'step_removed', step: 2 }),
      expect.objectContaining({ code: 'table_missing', subject: 'extra_things' }),
    ]);
  });

  it('does not take a step for changed because it leaves out what is empty', () => {
    const explicit: SchemaStep = { tables: FIRST.tables ?? [], indexes: [], migrations: [] };
    expect(check([explicit], { previous: [FIRST] })).toEqual([]);
    // But the order inside a step is part of it: a written step is never touched.
    const shuffled: SchemaStep = { tables: [...(FIRST.tables ?? [])].reverse() };
    expect(codes(check([shuffled], { previous: [FIRST] }))).toEqual(['step_changed']);
  });

  it('says which step it is: the version it brings', () => {
    const found = check([FIRST, { tables: [{ name: 'nowhere' }] }]);
    expect(found).toEqual([
      expect.objectContaining({ code: 'unknown_table', step: 2, subject: 'nowhere' }),
    ]);
  });

  it('finds a table of the register that no step creates', () => {
    expect(check([{ tables: [{ name: 'notes', indexes: ['text'] }] }])).toEqual([
      expect.objectContaining({ code: 'table_missing', subject: 'time_entries' }),
      expect.objectContaining({ code: 'table_missing', subject: 'device_settings' }),
    ]);
  });

  it('finds a table that is created twice, and one the register does not know', () => {
    expect(codes(check([FIRST, { tables: [{ name: 'notes' }] }]))).toEqual(['table_twice']);
    expect(codes(check([FIRST, { tables: [{ name: 'customers' }] }]))).toEqual(['unknown_table']);
    expect(codes(check([FIRST, { indexes: [{ table: 'customers', index: 'name' }] }]))).toEqual([
      'unknown_table',
    ]);
  });

  it('finds an index that is missing, one the register does not list, and one named twice', () => {
    const missing: SchemaStep = {
      tables: [
        { name: 'notes' },
        { name: 'time_entries', indexes: [['personId', 'at']] },
        { name: 'device_settings', indexes: ['key'] },
      ],
    };
    expect(check([missing])).toEqual([
      expect.objectContaining({ code: 'index_missing', subject: 'notes.text' }),
    ]);
    expect(check([FIRST, { indexes: [{ table: 'notes', index: 'createdAt' }] }])).toEqual([
      expect.objectContaining({ code: 'unknown_index', step: 2, subject: 'notes.createdAt' }),
    ]);
    expect(check([FIRST, { indexes: [{ table: 'notes', index: 'text' }] }])).toEqual([
      expect.objectContaining({ code: 'index_twice', step: 2, subject: 'notes.text' }),
    ]);
  });

  it('tells an index on one field from a compound index on that field', () => {
    const compound = createTableRegistry([
      { ...notesTable, indexes: [['text']] },
      timeEntriesTable,
      deviceSettingsTable,
    ]);
    const found = schemaLedgerProblems({ ledger: [FIRST], tables: compound });
    expect(codes(found).sort()).toEqual(['index_missing', 'unknown_index']);
  });

  it('finds an index that comes before its table', () => {
    const early: SchemaStep = { indexes: [{ table: 'notes', index: 'text' }] };
    expect(codes(check([early, FIRST]))).toContain('index_misplaced');
  });

  it('finds a migration that is named twice, unknown, or runs before its table exists', () => {
    const migrations = [
      { id: 'sample.first', table: 'notes' },
      { id: 'sample.late', table: 'extra_things' },
    ];
    const withExtra = REGISTRY.extend([extraTable]);
    const base = { tables: withExtra, migrations };
    const ok: SchemaStep = { ...FIRST, tables: [...(FIRST.tables ?? [])] };
    const extra: SchemaStep = { tables: [{ name: 'extra_things', indexes: ['label'] }] };
    expect(
      schemaLedgerProblems({
        ledger: [ok, { migrations: ['sample.first'] }, extra, { migrations: ['sample.late'] }],
        ...base,
      }),
    ).toEqual([]);
    expect(
      codes(
        schemaLedgerProblems({
          ledger: [ok, { migrations: ['sample.first'] }, { migrations: ['sample.first'] }, extra],
          ...base,
        }),
      ),
    ).toEqual(['migration_twice']);
    expect(
      codes(
        schemaLedgerProblems({
          ledger: [ok, { migrations: ['sample.unknown'] }, extra],
          ...base,
        }),
      ),
    ).toEqual(['unknown_migration']);
    expect(
      codes(
        schemaLedgerProblems({
          ledger: [ok, { migrations: ['sample.late'] }, extra],
          ...base,
        }),
      ),
    ).toEqual(['migration_misplaced']);
  });

  it('finds a step that is no step, as a ledger read from a file may hold', () => {
    const broken = [
      FIRST,
      { tables: 'notes' },
      { colour: 'blue' },
      { tables: [{ name: '' }] },
      'step',
    ] as unknown as SchemaLedger;
    const found = check(broken);
    expect(found.map((problem) => [problem.code, problem.step])).toEqual([
      ['invalid_step', 2],
      ['invalid_step', 3],
      ['invalid_step', 4],
      ['invalid_step', 5],
    ]);
    expect(found[0]?.message).toContain('tables');
    expect(found[1]?.message).toContain('Step 3');
    // Comparing with what was frozen does not fall over a malformed step either.
    expect(
      codes(check([FIRST], { previous: [{ tables: 'notes' } as unknown as SchemaStep] })),
    ).toEqual(['step_changed']);
  });

  it('only ever reports the codes it lists', () => {
    const found = [
      ...check([]),
      ...check([{ tables: [{ name: 'x' }, { name: 'x' }] }]),
      ...check([FIRST, { indexes: [{ table: 'notes', index: 'createdAt' }] }]),
    ];
    for (const problem of found) {
      expect(SCHEMA_PROBLEM_CODES).toContain(problem.code);
      expect(problem.message).not.toBe('');
    }
  });
});

describe('appending proposals', () => {
  const FIELDS = ['a', 'b', 'c'] as const;
  const tableOf = (name: string, indexes: readonly (typeof FIELDS)[number][]): TableDefinition =>
    defineTable({
      name,
      schema: z.object({
        ...syncFields,
        a: z.string().optional(),
        b: z.string().optional(),
        c: z.string().optional(),
      }),
      indexes,
      sensitivity: 'normal',
      sync: 'device',
    });

  it('keeps the ledger sound whatever the register grows by, and never touches a step', () => {
    // Per release: how many tables the register has and how many indexes each of them has.
    const release = fc.array(fc.integer({ min: 0, max: 3 }), { minLength: 1, maxLength: 6 });
    fc.assert(
      fc.property(fc.array(release, { minLength: 1, maxLength: 5 }), (releases) => {
        let ledger: SchemaLedger = [];
        // The register only grows: tables and indexes are added, never taken away.
        const grown: number[] = [];
        for (const wanted of releases) {
          wanted.forEach((count, position) => {
            grown[position] = Math.max(grown[position] ?? 0, count);
          });
          const register = createTableRegistry(
            grown.map((count, position) =>
              tableOf(`table_${String(position)}`, FIELDS.slice(0, count)),
            ),
          );
          const step = proposeSchemaStep({ ledger, tables: register });
          const previous = ledger;
          ledger = step === undefined ? ledger : [...ledger, step];
          expect(schemaLedgerProblems({ ledger, tables: register, previous })).toEqual([]);
          expect(proposeSchemaStep({ ledger, tables: register })).toBeUndefined();
        }
      }),
    );
  });
});

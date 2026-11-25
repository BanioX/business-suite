import { command, commandBase, type ContractFragment, type Operation } from '@onestrand/contract';
import { defineTable } from '@onestrand/storage';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import {
  INDUSTRY_ID_PATTERN,
  ManifestError,
  defineIndustry,
  defineModule,
  industryProblems,
  moduleProblems,
  type ManifestProblem,
  type ModuleInput,
} from '../src';
import {
  NoteSchema,
  alphaContract,
  alphaIndustry,
  alphaInput,
  betaContract,
  notesContract,
  notesModule,
  without,
} from './support';

/** The compact form of problems, to read a list at a glance. */
const brief = (problems: readonly ManifestProblem[]) =>
  problems.map((problem) => `${problem.code} ${problem.part} ${problem.id}`);

/** `alpha` as plain data with some fields replaced; `undefined` leaves the field out. */
function changed(changes: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries<unknown>({ ...alphaInput(), ...changes }).filter(
      ([, value]) => value !== undefined,
    ),
  );
}

/** The same without the parts that refer to tables and kinds, so one problem shows alone. */
function bare(changes: Record<string, unknown>): Record<string, unknown> {
  return changed({ demo: undefined, migrations: undefined, ...changes });
}

const withoutAccess = (operation: Operation): ContractFragment => ({
  [operation.name]: Object.fromEntries(
    Object.entries(operation).filter(([field]) => field !== 'access'),
    // An operation of the wrong form, written without types.
  ) as unknown as ContractFragment[string],
});

describe('defineIndustry', () => {
  it('takes an industry with one table, two operations and one function', () => {
    expect(industryProblems(alphaInput())).toEqual([]);
    expect(alphaIndustry.id).toBe('alpha');
    expect(alphaIndustry.kind).toBe('industry');
    expect(alphaIndustry.tables.map((table) => table.name)).toEqual(['alpha_visits']);
    expect(Object.keys(alphaIndustry.contract)).toEqual(['alpha.visits.add', 'alpha.visits.list']);
    expect(alphaIndustry.catalog.features?.map((feature) => feature.id)).toEqual(['alpha.visits']);
  });

  it('enters the industry in the registers under its own id', () => {
    expect(alphaIndustry.catalog.industries).toEqual([{ id: 'alpha' }]);
    expect(alphaIndustry.rights.industry).toBe('alpha');
    // What it was given is not changed.
    expect(Object.hasOwn(alphaInput().catalog, 'industries')).toBe(false);
  });

  it('fills in what is left out and freezes the result in every depth', () => {
    const lean = defineIndustry({
      id: 'gamma',
      tables: [],
      contract: {},
      useCases: () => ({}),
      catalog: {},
    });
    expect(lean.events).toEqual([]);
    expect(lean.templates).toEqual([]);
    expect(lean.ruleSets).toEqual([]);
    expect(lean.migrations).toEqual([]);
    expect(lean.demo).toBeUndefined();
    expect(lean.rights).toEqual({ industry: 'gamma' });
    expect(Object.isFrozen(alphaIndustry)).toBe(true);
    expect(Object.isFrozen(alphaIndustry.tables)).toBe(true);
    expect(Object.isFrozen(alphaIndustry.contract)).toBe(true);
    expect(Object.isFrozen(alphaIndustry.catalog.features)).toBe(true);
    expect(Object.isFrozen(alphaIndustry.catalog.features?.[0]?.options?.[0])).toBe(true);
    expect(Object.isFrozen(alphaIndustry.ruleSets[0]?.data)).toBe(true);
    expect(Object.isFrozen(alphaIndustry.demo?.kinds)).toBe(true);
    expect(Object.isFrozen(alphaIndustry.migrations[0])).toBe(true);
  });

  it('holds a copy: changing what it was given changes nothing', () => {
    const features = [{ id: 'gamma.one', group: 'gamma.main' }];
    const industry = defineIndustry({
      id: 'gamma',
      tables: [],
      contract: {},
      useCases: () => ({}),
      catalog: { groups: [{ id: 'gamma.main' }], features },
    });
    features.push({ id: 'gamma.two', group: 'gamma.main' });
    expect(industry.catalog.features).toEqual([{ id: 'gamma.one', group: 'gamma.main' }]);
  });

  it('fails when an operation says nothing about its access, and says which', () => {
    const input = changed({
      contract: withoutAccess(alphaContract['alpha.visits.list']),
      useCases: () => ({}),
    });
    expect(brief(industryProblems(input))).toEqual(['invalid_entry contract alpha.visits.list']);
    expect(industryProblems(input)[0]?.message).toContain('access is missing');
    expect(() => defineIndustry(input as never)).toThrow(ManifestError);
    expect(() => defineIndustry(input as never)).toThrow(
      expect.objectContaining({ code: 'invalid_entry' }),
    );
  });

  describe('the namespace', () => {
    it.each([
      [
        'a table outside it',
        { tables: [defineTable({ ...tableOptions(), name: 'visits' })] },
        'wrong_namespace tables visits',
      ],
      [
        'a table that shares the prefix of another industry',
        { tables: [defineTable({ ...tableOptions(), name: 'beta_visits' })] },
        'wrong_namespace tables beta_visits',
      ],
      [
        'an operation of another industry',
        { contract: { ...alphaContract, ...betaContract }, useCases: () => ({}) },
        'wrong_namespace contract beta.rounds.list',
      ],
      [
        'an event that is not of its own',
        { events: ['visit.recorded'] },
        'wrong_namespace events visit.recorded',
      ],
      [
        'a function of the platform',
        { catalog: { features: [{ id: 'visits', group: 'alpha.visits' }] } },
        'wrong_namespace catalog visits',
      ],
      [
        'a module of the platform',
        { catalog: { groups: [{ id: 'work' }] } },
        'wrong_namespace catalog work',
      ],
      [
        'a kind of another industry',
        { catalog: { kinds: [{ id: 'beta.large' }] } },
        'wrong_namespace catalog beta.large',
      ],
      [
        'a question of the platform',
        { catalog: { questions: [{ id: 'setup', answers: [] }] } },
        'wrong_namespace catalog setup',
      ],
      [
        'a device mode of another industry',
        { catalog: { deviceModes: [{ id: 'beta.counter', feature: 'beta.rounds' }] } },
        'wrong_namespace catalog beta.counter',
      ],
      [
        'a right of the platform',
        { rights: { rights: [{ id: 'wages' }] } },
        'wrong_namespace rights wages',
      ],
      [
        'a right of another industry',
        { rights: { rights: [{ id: 'beta.keys' }] } },
        'wrong_namespace rights beta.keys',
      ],
      [
        'another industry in the register of functions',
        { catalog: { industries: [{ id: 'beta' }] } },
        'wrong_namespace catalog beta',
      ],
      [
        'rights entered for another industry',
        { rights: { industry: 'beta', rights: [] } },
        'wrong_namespace rights beta',
      ],
    ])('refuses %s', (_name, changes, expected) => {
      expect(brief(industryProblems(changed(changes)))).toContain(expected);
      expect(() => defineIndustry(changed(changes) as never)).toThrow(
        expect.objectContaining({ code: 'wrong_namespace' }),
      );
    });

    it('lets an industry name itself, and name the platform in what it requires', () => {
      expect(
        industryProblems(
          changed({ catalog: { ...alphaInput().catalog, industries: [{ id: 'alpha' }] } }),
        ),
      ).toEqual([]);
      expect(
        alphaIndustry.catalog.features?.find((feature) => feature.id === 'alpha.visits')?.requires,
      ).toEqual(['notes']);
    });
  });

  describe('the form', () => {
    it.each([
      ['no object', 'alpha'],
      ['null', null],
      ['a list', []],
    ])('refuses %s', (_name, input) => {
      expect(brief(industryProblems(input))).toEqual(['invalid_entry manifest ?']);
    });

    it('refuses a field it does not have: a typo would drop a setting', () => {
      expect(brief(industryProblems(bare({ ruleset: [] })))).toEqual(['invalid_entry manifest ?']);
      expect(brief(industryProblems(bare({ use_cases: () => ({}) })))).toEqual([
        'invalid_entry manifest ?',
      ]);
    });

    it.each([
      ['no id', undefined],
      ['a number', 7],
      ['capital letters', 'Alpha'],
      ['an underscore: it is the prefix of tables and operations', 'alpha_beta'],
      ['a dot', 'alpha.beta'],
      ['an empty id', ''],
    ])('refuses an id with %s', (_name, id) => {
      expect(industryProblems(bare({ id })).map((problem) => problem.part)).toContain('id');
    });

    it('refuses what is not a list of tables, a bag of entries or a function', () => {
      expect(brief(industryProblems(bare({ tables: undefined })))).toEqual([
        'invalid_entry tables ?',
      ]);
      expect(brief(industryProblems(bare({ tables: [{ name: 'alpha_x' }] })))).toEqual([
        'invalid_entry tables alpha_x',
      ]);
      expect(brief(industryProblems(bare({ tables: [7] })))).toEqual(['invalid_entry tables ?']);
      expect(brief(industryProblems(bare({ contract: undefined })))).toEqual([
        'invalid_entry contract ?',
      ]);
      expect(brief(industryProblems(bare({ useCases: {} })))).toEqual([
        'invalid_entry use_cases ?',
      ]);
      expect(brief(industryProblems(bare({ catalog: [] })))).toEqual(['invalid_entry catalog ?']);
      expect(brief(industryProblems(bare({ rights: [] })))).toEqual(['invalid_entry rights ?']);
      expect(brief(industryProblems(bare({ events: 'x' })))).toEqual(['invalid_entry events ?']);
    });

    it('names a table twice and an id twice', () => {
      const [table] = alphaIndustry.tables;
      expect(brief(industryProblems(bare({ tables: [table, table] })))).toEqual([
        'duplicate_id tables alpha_visits',
      ]);
      expect(brief(industryProblems(bare({ events: ['alpha_a.b', 'alpha_a.b'] })))).toEqual([
        'duplicate_id events alpha_a.b',
      ]);
    });

    it('refuses an event that is not of the form thing.what_happened', () => {
      expect(brief(industryProblems(bare({ events: ['alphaVisit.recorded', 7] })))).toEqual([
        'invalid_entry events alphaVisit.recorded',
        'invalid_entry events ?',
      ]);
    });

    it('refuses entries without an id and unknown fields of the catalog and of the rights', () => {
      expect(
        brief(industryProblems(bare({ catalog: { features: [{}], groups: 'x', typo: [] } }))),
      ).toEqual(['invalid_entry catalog ?', 'invalid_entry catalog ?', 'invalid_entry catalog ?']);
      expect(brief(industryProblems(bare({ rights: { rights: [{}], right: [] } })))).toEqual([
        'invalid_entry rights ?',
        'invalid_entry rights ?',
      ]);
    });

    it('refuses a catalog or rights that are not plain data', () => {
      expect(
        brief(
          industryProblems(
            bare({ catalog: { features: [], groups: [{ id: 'alpha.a', f: () => 1 }] } }),
          ),
        ),
      ).toEqual(['invalid_entry catalog ?']);
      expect(
        brief(industryProblems(bare({ rights: { rights: [{ id: 'alpha.a', f: () => 1 }] } }))),
      ).toEqual(['invalid_entry rights ?']);
    });
  });

  describe('templates, rule sets, demo and migrations', () => {
    it('needs a source for every rule set: law only with a source', () => {
      for (const source of [undefined, '', '   ', 7]) {
        const problems = industryProblems(
          changed({ ruleSets: [{ id: 'alpha.limits', source, data: {} }] }),
        );
        expect(brief(problems)).toEqual(['missing_source rule_sets alpha.limits']);
      }
      expect(() =>
        defineIndustry(changed({ ruleSets: [{ id: 'alpha.limits', data: {} }] }) as never),
      ).toThrow(expect.objectContaining({ code: 'missing_source' }));
    });

    it('keeps the source on the rule set', () => {
      expect(alphaIndustry.ruleSets).toEqual([
        { id: 'alpha.limits', source: 'docs/fakten/alpha-limits.md', data: { maxVisitsPerDay: 8 } },
      ]);
    });

    it.each([
      [
        'templates',
        [{ id: 'beta.round', kind: 'checklist', data: {} }],
        'wrong_namespace templates beta.round',
      ],
      [
        'templates',
        [{ id: 'round', kind: 'checklist', data: {} }],
        'invalid_entry templates round',
      ],
      [
        'templates',
        [{ id: 'alpha.Round', kind: 'checklist', data: {} }],
        'invalid_entry templates alpha.Round',
      ],
      [
        'templates',
        [{ id: 'alpha.round', kind: 'Check list', data: {} }],
        'invalid_entry templates alpha.round',
      ],
      [
        'templates',
        [{ id: 'alpha.round', kind: 'checklist', data: [] }],
        'invalid_entry templates alpha.round',
      ],
      [
        'templates',
        [{ id: 'alpha.round', kind: 'checklist', data: { f: () => 1 } }],
        'invalid_entry templates alpha.round',
      ],
      [
        'templates',
        [{ id: 'alpha.round', kind: 'checklist', data: {}, extra: 1 }],
        'invalid_entry templates alpha.round',
      ],
      [
        'templates',
        [
          { id: 'alpha.a', kind: 'c', data: {} },
          { id: 'alpha.a', kind: 'c', data: {} },
        ],
        'duplicate_id templates alpha.a',
      ],
      ['templates', 'x', 'invalid_entry templates ?'],
      ['templates', [7], 'invalid_entry templates ?'],
      [
        'ruleSets',
        [{ id: 'beta.limits', source: 's', data: {} }],
        'wrong_namespace rule_sets beta.limits',
      ],
      ['ruleSets', [{ id: 'alpha.a', source: 's', data: 1 }], 'invalid_entry rule_sets alpha.a'],
      [
        'ruleSets',
        [
          { id: 'alpha.a', source: 's', data: {} },
          { id: 'alpha.a', source: 's', data: {} },
        ],
        'duplicate_id rule_sets alpha.a',
      ],
      ['demo', 'x', 'invalid_entry demo ?'],
      ['demo', { businessName: '', ownerName: 'Person Muster' }, 'invalid_entry demo ?'],
      ['demo', { businessName: 'Betrieb Muster', ownerName: 3 }, 'invalid_entry demo ?'],
      [
        'demo',
        { businessName: 'Betrieb Muster', ownerName: 'P', kinds: 'x' },
        'invalid_entry demo ?',
      ],
      [
        'demo',
        { businessName: 'Betrieb Muster', ownerName: 'P', people: [' '] },
        'invalid_entry demo ?',
      ],
      [
        'demo',
        { businessName: 'Betrieb Muster', ownerName: 'P', extra: 1 },
        'invalid_entry demo ?',
      ],
      [
        'demo',
        { businessName: 'Betrieb Muster', ownerName: 'P', kinds: ['alpha.other'] },
        'unknown_reference demo alpha.other',
      ],
      [
        'migrations',
        [{ id: 'alpha.m', table: 'beta_x', upgrade: (row: unknown) => row }],
        'unknown_reference migrations alpha.m',
      ],
      [
        'migrations',
        [{ id: 'alpha.m', table: 'alpha_visits', upgrade: 1 }],
        'invalid_entry migrations alpha.m',
      ],
      [
        'migrations',
        [{ id: 'beta.m', table: 'alpha_visits', upgrade: (row: unknown) => row }],
        'wrong_namespace migrations beta.m',
      ],
      [
        'migrations',
        [
          { id: 'alpha.m', table: 'alpha_visits', upgrade: (row: unknown) => row },
          { id: 'alpha.m', table: 'alpha_visits', upgrade: (row: unknown) => row },
        ],
        'duplicate_id migrations alpha.m',
      ],
    ])('refuses %s: %j', (field, value, expected) => {
      expect(brief(industryProblems(changed({ [field]: value })))).toContain(expected);
    });

    it('holds a demo with its defaults filled in', () => {
      const industry = defineIndustry(
        changed({ demo: { businessName: 'Betrieb Muster', ownerName: 'Person Muster' } }) as never,
      );
      expect(industry.demo).toEqual({
        businessName: 'Betrieb Muster',
        ownerName: 'Person Muster',
        kinds: [],
        people: [],
      });
      expect(alphaIndustry.demo?.kinds).toEqual(['alpha.standard']);
    });

    it('holds a migration that upgrades a row', () => {
      expect(alphaIndustry.migrations[0]?.upgrade({ place: 'x' })).toEqual({ place: 'x' });
    });
  });

  it('reports every problem at once; the first decides the code', () => {
    const input = changed({
      tables: [defineTable({ ...tableOptions(), name: 'visits' })],
      events: ['visit.recorded'],
      ruleSets: [{ id: 'alpha.limits', data: {} }],
    });
    expect(brief(industryProblems(input))).toEqual([
      'wrong_namespace tables visits',
      'wrong_namespace events visit.recorded',
      'missing_source rule_sets alpha.limits',
      'unknown_reference migrations alpha.visits_place',
    ]);
    try {
      defineIndustry(input as never);
      expect.unreachable('the industry was taken');
    } catch (error) {
      expect((error as ManifestError).code).toBe('wrong_namespace');
      expect((error as ManifestError).problems).toHaveLength(4);
    }
  });

  it('writes the pattern of an id as documented', () => {
    expect(['alpha', 'a1', 'field'].every((id) => INDUSTRY_ID_PATTERN.test(id))).toBe(true);
    expect(['1a', 'a_b', 'A', 'a-b', ''].some((id) => INDUSTRY_ID_PATTERN.test(id))).toBe(false);
  });
});

describe('defineModule', () => {
  it('takes a module of the platform', () => {
    expect(moduleProblems({ ...moduleInput() })).toEqual([]);
    expect(notesModule.kind).toBe('module');
    expect(notesModule.id).toBe('notes');
    expect(notesModule.rights).toEqual({ rights: [{ id: 'export_delete' }] });
    expect(notesModule.events).toEqual(['note.added', 'note.removed']);
    expect(Object.isFrozen(notesModule)).toBe(true);
    expect(Object.isFrozen(notesModule.catalog.features)).toBe(true);
  });

  it('allows ids with underscores for the id of a module', () => {
    expect(moduleProblems({ ...moduleInput(), id: 'team_time' })).toEqual([]);
    expect(moduleProblems({ ...moduleInput(), id: 'Team' })).toHaveLength(1);
  });

  it.each([
    [
      'a function of an industry',
      { catalog: { features: [{ id: 'alpha.keys', group: 'work' }] } },
      'wrong_namespace catalog alpha.keys',
    ],
    [
      'an industry',
      { catalog: { industries: [{ id: 'alpha' }] } },
      'wrong_namespace catalog alpha',
    ],
    [
      'a right of an industry',
      { rights: { rights: [{ id: 'alpha.keys' }] } },
      'wrong_namespace rights alpha.keys',
    ],
    [
      'rights entered for an industry',
      { rights: { industry: 'alpha', rights: [] } },
      'wrong_namespace rights alpha',
    ],
  ])('refuses %s', (_name, changes, expected) => {
    expect(brief(moduleProblems({ ...moduleInput(), ...changes }))).toContain(expected);
    expect(() => defineModule({ ...moduleInput(), ...changes })).toThrow(ManifestError);
  });

  it('does not know the extras of an industry', () => {
    expect(brief(moduleProblems({ ...moduleInput(), demo: {} }))).toEqual([
      'invalid_entry manifest ?',
    ]);
    expect(brief(moduleProblems({ ...moduleInput(), templates: [] }))).toEqual([
      'invalid_entry manifest ?',
    ]);
  });

  it('finds an operation without access', () => {
    expect(
      brief(
        moduleProblems({ ...moduleInput(), contract: withoutAccess(notesContract['notes.list']) }),
      ),
    ).toEqual(['invalid_entry contract notes.list']);
  });

  it('does not take an operation twice from one module: a key is a name', () => {
    expect(
      brief(
        moduleProblems({
          ...moduleInput(),
          contract: { 'notes.other': notesContract['notes.add'] },
        }),
      ),
    ).toEqual(['invalid_entry contract notes.add']);
  });
});

/** Takes code that is only compiled and never run: calls that would fail if they happened. */
function typesOnly(probe: () => void): void {
  expectTypeOf(probe).toBeFunction();
}

describe('the types of a manifest', () => {
  const input = alphaInput();

  it('does not compile without an id, a contract, use cases, tables or a catalog', () => {
    typesOnly(() => {
      // @ts-expect-error the id is required
      defineIndustry(without(input, 'id'));
      // @ts-expect-error the contract is required
      defineIndustry(without(input, 'contract'));
      // @ts-expect-error the use cases are required
      defineIndustry(without(input, 'useCases'));
      // @ts-expect-error the tables are required, even if there are none
      defineIndustry(without(input, 'tables'));
      // @ts-expect-error the catalog is required
      defineIndustry(without(input, 'catalog'));
      // @ts-expect-error the id of a module is required
      defineModule(without(moduleInput(), 'id'));
    });
  });

  it('does not compile when an operation has no use case, or one that does not fit', () => {
    typesOnly(() => {
      defineModule({
        id: 'delta',
        tables: [],
        catalog: {},
        contract: notesContract,
        // @ts-expect-error `notes.list` and `notes.remove` have no use case
        useCases: () => ({ 'notes.add': () => Promise.resolve({ note: notesNote }) }),
      });
      defineModule({
        id: 'delta',
        tables: [],
        catalog: {},
        contract: { 'delta.x': notesContract['notes.list'] },
        // @ts-expect-error the result does not fit the output of the operation
        useCases: () => ({ 'delta.x': () => Promise.resolve({ notes: 'many' }) }),
      });
    });
  });

  it('does not compile with an operation that has no access', () => {
    typesOnly(() => {
      command({
        name: 'delta.run',
        summary: 'Runs.',
        // @ts-expect-error the operation must say its access
        access: undefined,
        input: z.object({ ...commandBase }),
        output: z.object({}),
      });
    });
  });

  it('knows the manifests it makes', () => {
    expectTypeOf(alphaIndustry.kind).toEqualTypeOf<'industry'>();
    expectTypeOf(notesModule.kind).toEqualTypeOf<'module'>();
  });
});

const notesNote = NoteSchema.parse({
  id: '00000000-0000-7000-8000-000000000001',
  businessId: '00000000-0000-7000-8000-000000000002',
  text: 'x',
  createdAt: '2026-11-14T10:00:00.000Z',
  updatedAt: '2026-11-14T10:00:00.000Z',
});
function tableOptions() {
  const [table] = alphaIndustry.tables;
  if (table === undefined) {
    throw new Error('alpha has a table');
  }
  return {
    schema: table.schema,
    indexes: [],
    sensitivity: 'normal',
    sync: 'single_writer',
  } as const;
}

function moduleInput(): ModuleInput<ContractFragment> {
  return {
    id: 'notes',
    tables: notesModule.tables,
    contract: notesContract,
    useCases: notesModule.useCases,
    catalog: notesModule.catalog,
    rights: notesModule.rights,
    events: notesModule.events,
  };
}

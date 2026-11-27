import { DomainEventSchema } from '@onestrand/contract';
import type { Industry } from '@onestrand/manifest';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  EVENT_TYPE_PATTERN,
  NAME_KINDS,
  NAME_STATUSES,
  NAMES_PATH,
  PACKAGE_SCOPES,
  industryNames,
  namesProblems,
  packageNames,
  readNames,
  type IndustryShape,
  type NameEntry,
  type UsedName,
} from '../src/names.ts';
import { formatProblem } from '../src/repo-files.ts';

const CORE = { kind: 'package', name: '@onestrand/core', owner: 'platform', status: 'active' };
const BUSINESSES = { kind: 'table', name: 'businesses', owner: 'platform', status: 'active' };
const HOUR = { kind: 'unit', name: 'h', owner: 'platform', status: 'active' };

const registerOf = (names: unknown, more: Record<string, unknown> = {}) =>
  JSON.stringify({ about: 'Made up for the test.', version: 1, names, ...more });

const messagesOf = (text: string | undefined) =>
  readNames(text).problems.map((problem) => problem.message);

describe('readNames', () => {
  it('reads a well-formed register', () => {
    const reserved = {
      kind: 'table',
      name: 'facility_keys',
      owner: 'industry:facility',
      status: 'reserved',
      note: 'Held for the first industry.',
    };
    expect(readNames(registerOf([CORE, BUSINESSES, HOUR, reserved]))).toEqual({
      entries: [CORE, BUSINESSES, HOUR, reserved],
      problems: [],
    });
    expect(readNames(registerOf([]))).toEqual({ entries: [], problems: [] });
  });

  it('knows these kinds and these states', () => {
    expect(NAME_KINDS).toEqual([
      'package',
      'table',
      'unit',
      'operation',
      'event',
      'feature',
      'module',
      'right',
    ]);
    expect(NAME_STATUSES).toEqual(['active', 'reserved']);
  });

  it('fails without a register, at the file', () => {
    const { entries, problems } = readNames(undefined);
    expect(entries).toBeUndefined();
    expect(problems.map(formatProblem)).toEqual([`${NAMES_PATH}: The name register is missing`]);
  });

  it('names a text that is no JSON, and JSON that is no object', () => {
    expect(messagesOf('{ "names": [')[0]).toMatch(/^The register is no JSON: /);
    expect(messagesOf('[]')).toEqual(['The register must be a JSON object']);
    expect(messagesOf('null')).toEqual(['The register must be a JSON object']);
  });

  it('names what is wrong at the top', () => {
    expect(messagesOf(JSON.stringify({ version: 2, names: {}, owners: [] }))).toEqual([
      'unknown field "owners"',
      'version must be 1',
      'names must be a list',
    ]);
  });

  it.each([
    [
      'what is no object',
      'core',
      ['names[0]: an entry is an object with kind, name, owner and status'],
    ],
    [
      'an unknown kind',
      { ...CORE, kind: 'record' },
      [
        'names[0]: kind must be one of package, table, unit, operation, event, feature, module, right',
      ],
    ],
    ['a name that is no text', { ...CORE, name: 7 }, ['names[0]: name must be a text']],
    [
      'an owner the suite does not know',
      { ...CORE, owner: 'somebody' },
      ['names[0]: owner must be head, platform or industry:<id>'],
    ],
    [
      'an unknown state',
      { ...CORE, status: 'gone' },
      ['names[0]: status must be one of active, reserved'],
    ],
    ['a note that is no text', { ...CORE, note: 1 }, ['names[0]: note must be a text']],
    [
      'a field the format does not know',
      { ...CORE, staus: 'active' },
      ['names[0]: unknown field "staus"'],
    ],
    [
      'an entry without anything',
      {},
      [
        'names[0]: kind must be one of package, table, unit, operation, event, feature, module, right',
        'names[0]: name must be a text',
        'names[0]: owner must be head, platform or industry:<id>',
        'names[0]: status must be one of active, reserved',
      ],
    ],
  ])('names %s', (_what, entry, messages) => {
    expect(messagesOf(registerOf([entry]))).toEqual(messages);
    // Nothing is compared with a register that is half read.
    expect(readNames(registerOf([entry, BUSINESSES])).entries).toBeUndefined();
  });

  it.each([
    ['package', 'onestrand-core'],
    ['package', '@other/core'],
    ['package', '@onestrand/Core'],
    ['package', '@onestrand-industries/muster'],
    ['package', '@onestrand-industry/Muster'],
    ['package', '@onestrand-edition/field'],
    ['table', 'facility-keys'],
    ['table', 'Businesses'],
    ['table', 'keys_'],
    ['unit', 'm²'],
    ['unit', '2m'],
    ['operation', 'business'],
    ['operation', 'Business.create'],
    ['operation', 'business.people.add.again.more'],
    ['operation', 'business.create_new'],
    ['event', 'business.created.again'],
    ['event', 'business.Created'],
    ['event', 'business'],
    ['feature', 'business.keys.assign'],
    ['feature', 'Business'],
    ['module', 'team-time'],
    ['right', 'a.b.c.d'],
    ['right', 'Settings'],
  ])('wants a %s in its form, not «%s»', (kind, name) => {
    const [message, ...rest] = messagesOf(registerOf([{ ...CORE, kind, name }]));
    expect(message).toContain(`"${name}" has not the form of a ${kind}`);
    expect(rest).toEqual([]);
  });

  it('names an identifier that stands twice under one kind', () => {
    expect(messagesOf(registerOf([CORE, BUSINESSES, { ...CORE, status: 'reserved' }]))).toEqual([
      'the package "@onestrand/core" stands twice',
    ]);
  });

  it.each([
    ['operation', 'business.features.setOption'],
    ['operation', 'facility.keys.issue'],
    ['event', 'facility_key.issued'],
    ['event', 'feature.option_set'],
    ['feature', 'business'],
    ['feature', 'team_time'],
    ['feature', 'facility.keys'],
    ['module', 'muster.visits'],
    ['package', '@onestrand-industry/muster'],
    ['package', '@onestrand-industry/muster-web'],
    ['right', 'export_delete'],
    ['right', 'facility.keys.assign'],
  ])('takes a %s in the form of the contract: %s', (kind, name) => {
    expect(readNames(registerOf([{ ...CORE, kind, name }])).problems).toEqual([]);
  });

  it('takes the form of an event the contract takes, no other', () => {
    for (const type of [
      'business.created',
      'person.option_set',
      'business.created.again',
      'Business.created',
      'business.created2',
      'business',
      '',
    ]) {
      expect(EVENT_TYPE_PATTERN.test(type), type).toBe(
        DomainEventSchema.shape.type.safeParse(type).success,
      );
    }
  });

  it('lets one word stand under two kinds: a table and a unit are told apart', () => {
    const table = { kind: 'table', name: 'h', owner: 'platform', status: 'reserved' };
    expect(readNames(registerOf([HOUR, table])).problems).toEqual([]);
  });
});

describe('packageNames', () => {
  it('reads the name of every package of the suite', () => {
    const files = [
      { path: 'package.json', text: '{ "name": "onestrand-business-suite" }' },
      { path: 'platform/core/package.json', text: '{ "name": "@onestrand/core" }' },
      { path: 'tools/package.json', text: '{ "name": "@onestrand/tooling" }' },
      { path: 'platform/core/src/package.json.ts', text: 'export {};' },
      { path: 'editions/sample/package.json', text: '{ "name": "sample-app" }' },
      { path: 'platform/broken/package.json', text: '{ "name": ' },
      { path: 'platform/odd/package.json', text: '[]' },
      { path: 'platform/nameless/package.json', text: '{ "private": true }' },
      {
        path: 'industries/sample/core/package.json',
        text: '{ "name": "@onestrand-industry/sample" }',
      },
      { path: 'industries/other/core/package.json', text: '{ "name": "@onestrand-other/x" }' },
    ];
    expect(packageNames(files)).toEqual([
      { kind: 'package', name: '@onestrand/core', path: 'platform/core/package.json' },
      { kind: 'package', name: '@onestrand/tooling', path: 'tools/package.json' },
      {
        kind: 'package',
        name: '@onestrand-industry/sample',
        path: 'industries/sample/core/package.json',
      },
    ]);
    expect(PACKAGE_SCOPES).toEqual(['@onestrand/', '@onestrand-industry/']);
  });
});

describe('industryNames', () => {
  const sample: IndustryShape = {
    kind: 'industry',
    id: 'sample',
    tables: [{ name: 'sample_rounds' }],
    contract: { 'sample.rounds.add': {}, 'sample.rounds.list': {} },
    events: ['sample_round.added'],
    catalog: { groups: [{ id: 'sample.rounds' }], features: [{ id: 'sample.rounds' }] },
    rights: { rights: [{ id: 'sample.keys' }] },
  };
  const at = 'industries/sample/core/src/index.ts';

  it('reads what a manifest sets for good, kind by kind', () => {
    expect(industryNames(sample, at).map(({ kind, name }) => `${kind} ${name}`)).toEqual([
      'table sample_rounds',
      'operation sample.rounds.add',
      'operation sample.rounds.list',
      'event sample_round.added',
      'feature sample.rounds',
      'module sample.rounds',
      'right sample.keys',
    ]);
    expect(industryNames(sample, at).every(({ path }) => path === at)).toBe(true);
  });

  it('reads a manifest without functions, modules or rights', () => {
    const bare: IndustryShape = { ...sample, catalog: {}, rights: {} };
    expect(industryNames(bare, at).map(({ kind }) => kind)).toEqual([
      'table',
      'operation',
      'operation',
      'event',
    ]);
  });

  it('has the shape of a manifest made by defineIndustry', () => {
    // If the manifest changes its shape, the guard would read nothing: this does not compile then.
    expectTypeOf<Industry>().toExtend<IndustryShape>();
  });
});

describe('namesProblems', () => {
  const entries = readNames(registerOf([CORE, BUSINESSES, HOUR])).entries ?? [];
  const used: UsedName[] = [
    { kind: 'package', name: '@onestrand/core', path: 'platform/core/package.json' },
    { kind: 'table', name: 'businesses', path: 'platform/storage/src/tables.ts' },
    { kind: 'unit', name: 'h', path: 'platform/core/src/units.ts' },
  ];

  it('finds nothing where register and code agree', () => {
    expect(entries).toHaveLength(3);
    expect(namesProblems(entries, used)).toEqual([]);
    expect(namesProblems([], [])).toEqual([]);
  });

  it('names an identifier the code uses and the register does not hold, at its file', () => {
    const more: UsedName = { kind: 'unit', name: 'km', path: 'platform/core/src/units.ts' };
    expect(namesProblems(entries, [...used, more]).map(formatProblem)).toEqual([
      `platform/core/src/units.ts: The unit "km" is not in the name register: the head enters it in ${NAMES_PATH} before it is used`,
    ]);
  });

  it('names an identifier that two files use, also where the register holds it', () => {
    const copy: UsedName = {
      kind: 'package',
      name: '@onestrand/core',
      path: 'platform/copy/package.json',
    };
    expect(namesProblems(entries, [...used, copy]).map(formatProblem)).toEqual([
      'platform/copy/package.json: The package "@onestrand/core" is used twice: here and in platform/core/package.json',
    ]);
    // Read twice from the same file, it is one use.
    expect(namesProblems(entries, [...used, ...used])).toEqual([]);
  });

  it('names an active identifier the code has dropped, at the register', () => {
    expect(namesProblems(entries, used.slice(0, 2)).map(formatProblem)).toEqual([
      `${NAMES_PATH}: The unit "h" is active in the register, but the code does not use it: a name that was shipped stays, as reserved with a note`,
    ]);
  });

  it('lets a reserved identifier wait, and lets the code take it up', () => {
    const reserved: NameEntry = { kind: 'unit', name: 'km', owner: 'platform', status: 'reserved' };
    expect(namesProblems([...entries, reserved], used)).toEqual([]);
    const taken: UsedName = { kind: 'unit', name: 'km', path: 'platform/core/src/units.ts' };
    expect(namesProblems([...entries, reserved], [...used, taken])).toEqual([]);
  });

  it('tells kinds apart: a unit in the register is no table', () => {
    const table: UsedName = { kind: 'table', name: 'h', path: 'platform/storage/src/tables.ts' };
    expect(namesProblems(entries, [...used, table])).toHaveLength(1);
  });
});

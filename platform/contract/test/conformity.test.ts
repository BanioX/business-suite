import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import {
  assertOperation,
  commandBase,
  fragmentProblems,
  operationProblems,
  queryBase,
  type Operation,
  type OperationProblem,
  type OperationProblemPart,
} from '../src';
import { customersContract } from './sample-contract';

/** A well-formed command as plain data, to break one part at a time. */
function sample(): Record<string, unknown> {
  return {
    name: 'customers.create',
    kind: 'command',
    summary: 'Creates a customer of the business.',
    access: { feature: 'customers', level: 'operate' },
    input: z.object({ ...commandBase, name: z.string() }),
    output: z.object({ done: z.boolean() }),
  };
}

/** The sample with some fields replaced; `undefined` stands for a field that is missing. */
function broken(changes: Record<string, unknown>): Record<string, unknown> {
  return { ...sample(), ...changes };
}

const parts = (problems: readonly OperationProblem[]): OperationProblemPart[] =>
  problems.map((problem) => problem.part);

describe('operationProblems', () => {
  it('finds nothing in a well-formed operation', () => {
    expect(operationProblems(sample())).toEqual([]);
    for (const operation of Object.values(customersContract)) {
      expect(operationProblems(operation), operation.name).toEqual([]);
    }
    expect(
      operationProblems(
        broken({
          name: 'facility.keys.moves.list',
          kind: 'query',
          access: { feature: 'facility.keys', level: 'view', rights: ['facility.access_notes'] },
          input: z.object({ ...queryBase }),
        }),
      ),
    ).toEqual([]);
    // An empty list of rights asks for none, like no list.
    expect(
      operationProblems(broken({ access: { feature: 'customers', level: 'manage', rights: [] } })),
    ).toEqual([]);
  });

  it.each([
    ['nothing', undefined, 'expected an operation, got nothing'],
    ['null', null, 'expected an operation, got null'],
    ['a text', 'customers.create', 'expected an operation, got «customers.create»'],
    ['a number', 7, 'expected an operation, got 7'],
    ['a list', [sample()], 'expected an operation, got a list'],
    ['a function', () => sample(), 'expected an operation, got a function'],
  ])('refuses %s as an operation', (_what, value, message) => {
    expect(operationProblems(value)).toEqual([{ operation: '?', part: 'operation', message }]);
  });

  it.each([
    ['missing', undefined, 'got nothing'],
    ['not a text', 12, 'got 12'],
    ['empty', '', 'got «»'],
    ['a single segment', 'customers', 'got «customers»'],
    ['five segments', 'a.b.c.d.e', 'got «a.b.c.d.e»'],
    ['an upper-case start', 'Customers.create', 'got «Customers.create»'],
    ['an underscore', 'customers.create_one', 'got «customers.create_one»'],
    ['an empty segment', 'customers..create', 'got «customers..create»'],
    ['a blank', 'customers create', 'got «customers create»'],
  ])('reports a name that is %s', (_what, name, got) => {
    const problems = operationProblems(broken({ name }));
    expect(parts(problems)).toEqual(['name']);
    expect(problems[0]?.message).toContain(got);
    expect(problems[0]?.message).toContain('two to four segments');
    // Without a usable name the problem is filed under «?», else under the name it has.
    expect(problems[0]?.operation).toBe(typeof name === 'string' && name !== '' ? name : '?');
  });

  it.each([
    ['missing', undefined, 'got nothing'],
    ['another word', 'mutation', 'got «mutation»'],
    ['in upper case', 'Command', 'got «Command»'],
    ['not a text', true, 'got true'],
  ])('reports a kind that is %s', (_what, kind, got) => {
    const problems = operationProblems(broken({ kind }));
    expect(parts(problems)).toEqual(['kind']);
    expect(problems[0]).toMatchObject({ operation: 'customers.create' });
    expect(problems[0]?.message).toBe(`kind must be «command» or «query», ${got}`);
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['blank', '  \n'],
    ['in two languages, as an object', { de: 'Legt an.', en: 'Creates.' }],
  ])('reports a summary that is %s', (_what, summary) => {
    expect(parts(operationProblems(broken({ summary })))).toEqual(['summary']);
  });

  it('reports an operation without access', () => {
    expect(operationProblems(broken({ access: undefined }))).toEqual([
      {
        operation: 'customers.create',
        part: 'access',
        message: 'access is missing: every operation declares the feature and level it needs',
      },
    ]);
  });

  it.each([
    ['null', null, 'got null'],
    ['a text', 'customers:write', 'got «customers:write»'],
    ['a list of scopes', ['customers:write'], 'got a list'],
  ])('reports access that is %s', (_what, access, got) => {
    const problems = operationProblems(broken({ access }));
    expect(parts(problems)).toEqual(['access']);
    expect(problems[0]?.message).toBe(`access must be { feature, level, rights? }, ${got}`);
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['not a text', 3],
    ['with a blank', 'customer list'],
    ['with an upper-case start', 'Customers'],
    ['with a dot at the end', 'facility.'],
    ['with a hyphen', 'team-time'],
    ['in camel case', 'teamTime'],
    ['with a double underscore', 'team__time'],
    ['with an underscore at the end', 'team_'],
    ['with three segments', 'jobs.reports.sign'],
    ['with a segment that starts with a digit', 'facility.2keys'],
  ])('reports a feature that is %s', (_what, feature) => {
    const access = feature === undefined ? { level: 'operate' } : { feature, level: 'operate' };
    expect(parts(operationProblems(broken({ access })))).toEqual(['access.feature']);
  });

  it.each([['customers'], ['facility.keys'], ['team_time'], ['facility.key_moves'], ['jobs2']])(
    'accepts the feature %s',
    (feature) => {
      expect(operationProblems(broken({ access: { feature, level: 'operate' } }))).toEqual([]);
    },
  );

  it.each([
    ['missing', undefined, 'got nothing'],
    ['the level «none»', 'none', 'got «none»'],
    ['a scope of the old kind', 'write', 'got «write»'],
    ['a number', 2, 'got 2'],
  ])('reports a level that is %s', (_what, level, got) => {
    const access = level === undefined ? { feature: 'customers' } : { feature: 'customers', level };
    const problems = operationProblems(broken({ access }));
    expect(parts(problems)).toEqual(['access.level']);
    expect(problems[0]?.message).toBe(`level must be one of view, operate, manage, ${got}`);
  });

  it('reports a command that asks only for «view»', () => {
    const access = { feature: 'customers', level: 'view' };
    expect(operationProblems(broken({ access }))).toEqual([
      {
        operation: 'customers.create',
        part: 'access.level',
        message: 'a command changes data and needs the level «operate» or «manage», not «view»',
      },
    ]);
    // A query may ask for any level.
    for (const level of ['view', 'operate', 'manage']) {
      expect(
        operationProblems(broken({ kind: 'query', access: { feature: 'customers', level } })),
      ).toEqual([]);
    }
  });

  it.each([
    [
      'a single text',
      'export_delete',
      ['rights must be a list of ids of rights, got «export_delete»'],
    ],
    ['an object', { export: true }, ['rights must be a list of ids of rights, got an object']],
    ['null', null, ['rights must be a list of ids of rights, got null']],
    [
      'a list with a number',
      ['wages', 4],
      ['a right must be an id such as «export_delete», got 4'],
    ],
    ['a list with an empty text', [''], ['a right must be an id such as «export_delete», got «»']],
    [
      'a list with a sentence',
      ['may export'],
      ['a right must be an id such as «export_delete», got «may export»'],
    ],
    [
      'a list that names a right three times',
      ['wages', 'export_delete', 'wages', 'wages'],
      ['the right «wages» is listed more than once'],
    ],
  ])('reports rights that are %s', (_what, rights, messages) => {
    const access = { feature: 'customers', level: 'manage', rights };
    const problems = operationProblems(broken({ access }));
    expect(parts(problems)).toEqual(messages.map(() => 'access.rights'));
    expect(problems.map((problem) => problem.message)).toEqual(messages);
  });

  it('reports an unknown field of access, so a typo cannot drop a right', () => {
    const access = { feature: 'customers', level: 'manage', right: ['export_delete'] };
    expect(operationProblems(broken({ access }))).toEqual([
      {
        operation: 'customers.create',
        part: 'access',
        message: 'access has the unknown field «right»',
      },
    ]);
  });

  it.each(['input', 'output'] as const)('reports a missing or wrong %s schema', (side) => {
    expect(operationProblems(broken({ [side]: undefined }))).toEqual([
      {
        operation: 'customers.create',
        part: side,
        message: `${side} must be a Zod schema, got nothing`,
      },
    ]);
    // A JSON Schema or a plain shape is not a Zod schema.
    expect(operationProblems(broken({ [side]: { type: 'object' } }))).toEqual([
      {
        operation: 'customers.create',
        part: side,
        message: `${side} must be a Zod schema, got an object`,
      },
    ]);
    expect(parts(operationProblems(broken({ [side]: commandBase })))).toEqual([side]);
    expect(parts(operationProblems(broken({ [side]: 'z.object({})' })))).toEqual([side]);
  });

  it('reports every problem of an operation at once, in the order of its fields', () => {
    const problems = operationProblems({
      name: 'Customers',
      kind: 'mutation',
      summary: '',
      access: { feature: '', level: 'all', rights: 'none', scope: 'customers:write' },
      input: undefined,
    });
    expect(parts(problems)).toEqual([
      'name',
      'kind',
      'summary',
      'access',
      'access.feature',
      'access.level',
      'access.rights',
      'input',
      'output',
    ]);
    expect(new Set(problems.map((problem) => problem.operation))).toEqual(new Set(['Customers']));
    for (const problem of problems) {
      expect(problem.message.length, problem.part).toBeGreaterThan(10);
    }
  });
});

describe('assertOperation', () => {
  it('lets a well-formed operation through and tells the compiler', () => {
    const value: unknown = sample();
    assertOperation(value);
    expectTypeOf(value).toEqualTypeOf<Operation>();
    expect(value.name).toBe('customers.create');
    for (const operation of Object.values(customersContract)) {
      expect(() => {
        assertOperation(operation);
      }).not.toThrow();
    }
  });

  it('throws a TypeError that names the operation and every problem', () => {
    const attempt = () => {
      assertOperation(broken({ kind: 'mutation', access: undefined }));
    };
    expect(attempt).toThrow(TypeError);
    expect(attempt).toThrow(
      'Operation customers.create is not well formed: kind must be «command» or «query», got «mutation»; access is missing: every operation declares the feature and level it needs',
    );
    expect(() => {
      assertOperation(null);
    }).toThrow('Operation ? is not well formed: expected an operation, got null');
  });
});

describe('fragmentProblems', () => {
  it('finds nothing in a fragment whose keys are the names', () => {
    expect(fragmentProblems(customersContract)).toEqual([]);
    expect(fragmentProblems({})).toEqual([]);
    // A record without a prototype, as the namespace of a module is one.
    const bare: unknown = Object.assign(Object.create(null), customersContract);
    expect(fragmentProblems(bare)).toEqual([]);
  });

  it.each([
    ['nothing', undefined, 'got nothing'],
    ['null', null, 'got null'],
    ['a list of operations', Object.values(customersContract), 'got a list'],
    ['a text', 'customers', 'got «customers»'],
    // A map has no keys of its own to compare with the names; nothing in it would be checked.
    ['a map', new Map(Object.entries(customersContract)), 'got an object'],
    ['a schema', customersContract['customers.create'].input, 'got an object'],
  ])('refuses %s as a fragment', (_what, fragment, got) => {
    expect(fragmentProblems(fragment)).toEqual([
      {
        operation: '?',
        part: 'fragment',
        message: `expected a plain record of operations by name, ${got}`,
      },
    ]);
  });

  it('reports an operation filed under another key', () => {
    const fragment = {
      'customers.creat': customersContract['customers.create'],
      'customers.list': customersContract['customers.list'],
    };
    expect(fragmentProblems(fragment)).toEqual([
      {
        operation: 'customers.create',
        part: 'key',
        message:
          'the key «customers.creat» must equal the name of the operation, «customers.create»',
      },
    ]);
  });

  it('reports the same operation filed twice', () => {
    const fragment = {
      'customers.create': customersContract['customers.create'],
      'customers.add': customersContract['customers.create'],
    };
    expect(fragmentProblems(fragment)).toEqual([
      expect.objectContaining({ operation: 'customers.create', part: 'key' }),
    ]);
  });

  it('reports the problems of every operation, filed under its name or else its key', () => {
    const fragment = {
      'customers.create': broken({ access: undefined }),
      'customers.broken': null,
      'customers.unnamed': broken({ name: undefined }),
      'customers.misnamed': broken({ name: 'customers' }),
    };
    expect(fragmentProblems(fragment).map((problem) => [problem.operation, problem.part])).toEqual([
      ['customers.create', 'access'],
      ['customers.broken', 'operation'],
      ['customers.unnamed', 'name'],
      ['customers', 'name'],
      ['customers', 'key'],
    ]);
  });
});

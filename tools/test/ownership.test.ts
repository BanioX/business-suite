import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type GitCommit,
  GitError,
  git as runGit,
  readCommit,
  readCommitRange,
  resolveCommit,
} from '../src/git.ts';
import {
  BASE_VARIABLE,
  baseFromEnvironment,
  checkOwnership,
  CI_VARIABLE,
  findOrder,
  formatOwnershipProblem,
  formatOwnershipSummary,
  ownerOf,
  ownershipProblems,
  parseRegister,
  parseTrailers,
  readRegister,
  type Register,
  REGISTER_PATH,
  ROLES,
  subjectOf,
} from '../src/ownership.ts';
import { formatProblem, REPO_ROOT } from '../src/repo-files.ts';
import { fixtureGit as git } from './git-fixture.ts';

// --- Made-up register and commits --------------------------------------------------------------

/** A register in the format of `registry/owners.json`, small enough to read at a glance. */
const SAMPLE = {
  about: 'A made-up register for the tests.',
  version: 1,
  owners: [
    { pattern: 'docs/fakten/**', owner: 'facts' },
    { pattern: 'docs/branchen/README.md', owner: 'head' },
    { pattern: 'docs/branchen/**', owner: 'industry:*' },
    { pattern: 'platform/*/**', owner: 'platform:*' },
    { pattern: 'industries/muster/**', owner: 'head' },
    { pattern: 'industries/*/**', owner: 'industry:*' },
    { pattern: '**', owner: 'head' },
  ],
  orders: {
    'W0-01': {
      role: 'platform',
      write: ['package.json', 'tsconfig*.json', 'tools/**', 'platform/core/**', 'docs/herkunft.md'],
    },
    HEAD: { role: 'head', write: ['*', 'docs/**', 'registry/**', 'tools/**'] },
    'F-01': { role: 'facts', write: ['docs/fakten/**'] },
  },
  orderRules: [
    {
      order: 'branche-*',
      role: 'industry',
      write: ['industries/<id>/**', 'docs/branchen/<name>*', 'docs/branchen/<name>/**'],
    },
  ],
};

/** The sample with some of its parts replaced. */
function sampleWith(parts: Record<string, unknown>): Record<string, unknown> {
  return { ...SAMPLE, ...parts };
}

function registerFrom(value: unknown): Register {
  const { value: register, problems } = parseRegister(value);
  if (register === undefined) {
    throw new Error(`the made-up register is malformed: ${problems.join('; ')}`);
  }
  return register;
}

const REGISTER = registerFrom(SAMPLE);

/** The other trailers every commit of this repository ends with. */
const OTHER_TRAILERS = [
  'Co-Authored-By: Person Eins <person.eins@example.invalid>',
  'Claude-Session: https://example.invalid/session_0001',
];

let counter = 0;

/** A made-up commit: the trailers of an order and a role (if given) among the usual ones. */
function commit(made: {
  order?: string;
  role?: string;
  paths?: readonly string[];
  subject?: string;
  message?: string;
  parents?: readonly string[];
}): GitCommit {
  counter += 1;
  const subject = made.subject ?? 'feat: something small';
  const trailers = [
    ...(made.order === undefined ? [] : [`Order: ${made.order}`]),
    ...(made.role === undefined ? [] : [`Role: ${made.role}`]),
    ...OTHER_TRAILERS,
  ];
  return {
    hash: counter.toString(16).padStart(40, '0'),
    parents: made.parents ?? ['f'.repeat(40)],
    message: made.message ?? `${subject}\n\nWhat changed and why.\n\n${trailers.join('\n')}\n`,
    paths: made.paths ?? [],
  };
}

/** The problems of one made-up commit, as `path: reason` (or the reason alone). */
function reasons(made: Parameters<typeof commit>[0], register = REGISTER): string[] {
  return ownershipProblems([commit(made)], register).map(({ path, reason }) =>
    path === '' ? reason : `${path}: ${reason}`,
  );
}

// --- Trailers ----------------------------------------------------------------------------------

describe('parseTrailers', () => {
  it('reads the «Key: value» lines of the last paragraph, keys in lower case', () => {
    const message = 'feat: a thing\n\nBody text.\n\nOrder: W0-01\nRole: platform\n';
    expect(parseTrailers(message)).toEqual([
      { key: 'order', value: 'W0-01' },
      { key: 'role', value: 'platform' },
    ]);
  });

  it('reads them in a block together with other trailers', () => {
    const message = [
      'feat(core): base types',
      '',
      'IDs, money and dates.',
      '',
      'Order: W0-01',
      'Role: platform',
      ...OTHER_TRAILERS,
      '',
    ].join('\n');
    expect(parseTrailers(message)).toEqual([
      { key: 'order', value: 'W0-01' },
      { key: 'role', value: 'platform' },
      { key: 'co-authored-by', value: 'Person Eins <person.eins@example.invalid>' },
      { key: 'claude-session', value: 'https://example.invalid/session_0001' },
    ]);
  });

  it('keeps a colon inside the value', () => {
    expect(parseTrailers('x\n\nRole: industry:painting\n')).toEqual([
      { key: 'role', value: 'industry:painting' },
    ]);
  });

  it('takes upper and lower case of a key for the same key', () => {
    expect(parseTrailers('x\n\nORDER: W0-01\nrole: platform\n').map(({ key }) => key)).toEqual([
      'order',
      'role',
    ]);
  });

  it('tolerates white space around the colon and at the end of a line', () => {
    expect(parseTrailers('x\n\nOrder : W0-01  \nRole:platform\n')).toEqual([
      { key: 'order', value: 'W0-01' },
      { key: 'role', value: 'platform' },
    ]);
  });

  it('reads a message with Windows line ends and empty lines at its end', () => {
    expect(parseTrailers('x\r\n\r\nOrder: W0-01\r\nRole: platform\r\n\r\n\r\n')).toEqual([
      { key: 'order', value: 'W0-01' },
      { key: 'role', value: 'platform' },
    ]);
  });

  it('finds none in a message of one paragraph: that paragraph is the subject', () => {
    expect(parseTrailers('Order: W0-01\n')).toEqual([]);
    expect(parseTrailers('fix: a thing\nOrder: W0-01\nRole: platform\n')).toEqual([]);
    expect(parseTrailers('')).toEqual([]);
  });

  it('reads the last paragraph only', () => {
    const message = 'x\n\nOrder: W0-01\nRole: platform\n\nA closing remark without a trailer.\n';
    expect(parseTrailers(message)).toEqual([]);
  });

  it('passes over the lines of the last paragraph that are no trailers', () => {
    const message = 'x\n\nThis closes the work\nOrder: HEAD\n  continued line\n- a list item\n';
    expect(parseTrailers(message)).toEqual([{ key: 'order', value: 'HEAD' }]);
  });

  it('reads an empty value as empty', () => {
    expect(parseTrailers('x\n\nOrder:\n')).toEqual([{ key: 'order', value: '' }]);
  });
});

describe('subjectOf', () => {
  it('is the first line that is not empty', () => {
    expect(subjectOf('feat: a thing\n\nBody.\n')).toBe('feat: a thing');
    expect(subjectOf('\n\n  docs: late start  \r\nmore\n')).toBe('docs: late start');
    expect(subjectOf('')).toBe('');
  });
});

// --- The register ------------------------------------------------------------------------------

describe('parseRegister', () => {
  it('reads owners, orders and order rules', () => {
    expect(REGISTER.owners).toHaveLength(7);
    expect(REGISTER.owners.at(-1)).toEqual({ pattern: '**', owner: 'head' });
    expect([...REGISTER.orders.keys()]).toEqual(['W0-01', 'HEAD', 'F-01']);
    expect(REGISTER.orders.get('F-01')).toEqual({ role: 'facts', write: ['docs/fakten/**'] });
    expect(REGISTER.orderRules).toEqual([
      {
        order: 'branche-*',
        role: 'industry',
        write: ['industries/<id>/**', 'docs/branchen/<name>*', 'docs/branchen/<name>/**'],
      },
    ]);
  });

  it('needs neither «about» nor «orderRules»', () => {
    const { version, owners, orders } = SAMPLE;
    const { value, problems } = parseRegister({ version, owners, orders });
    expect(problems).toEqual([]);
    expect(value?.orderRules).toEqual([]);
  });

  it.each<[string, unknown, string]>([
    ['a list instead of an object', [], 'the register is an object'],
    ['no content', null, 'the register is an object'],
    ['another version', sampleWith({ version: 2 }), '«version» is 1'],
    ['no version', sampleWith({ version: undefined }), '«version» is 1'],
    ['an unknown field', sampleWith({ order: {} }), 'the register has an unknown field «order»'],
    ['an «about» that is no text', sampleWith({ about: 1 }), '«about» is a text'],
    ['no owners', sampleWith({ owners: undefined }), '«owners» is a list with at least one entry'],
    ['empty owners', sampleWith({ owners: [] }), '«owners» is a list with at least one entry'],
    [
      'an owner entry that is no object',
      sampleWith({ owners: ['**'] }),
      'owners[0] is an object with the texts «pattern» and «owner»',
    ],
    [
      'an owner entry without an owner',
      sampleWith({ owners: [{ pattern: '**' }] }),
      'owners[0] is an object with the texts «pattern» and «owner»',
    ],
    [
      'an owner entry with an unknown field',
      sampleWith({ owners: [{ pattern: '**', owner: 'head', note: 'x' }] }),
      'owners[0] has an unknown field «note»',
    ],
    [
      'an owner nobody knows',
      sampleWith({ owners: [{ pattern: '**', owner: 'somebody' }] }),
      'the owner «somebody» is none of head, facts, platform:<package>, industry:<id>',
    ],
    [
      'a platform owner without a package',
      sampleWith({ owners: [{ pattern: '**', owner: 'platform' }] }),
      'the owner «platform» is none of',
    ],
    [
      'an owner pattern in another dialect',
      sampleWith({
        owners: [
          { pattern: 'docs/{a,b}/**', owner: 'head' },
          { pattern: '**', owner: 'head' },
        ],
      }),
      'owners[0]: the pattern «docs/{a,b}/**» uses «{»',
    ],
    [
      'an owner pattern twice',
      sampleWith({
        owners: [
          { pattern: 'docs/**', owner: 'head' },
          { pattern: 'docs/**', owner: 'facts' },
          { pattern: '**', owner: 'head' },
        ],
      }),
      'the pattern «docs/**» is listed twice; the first one wins',
    ],
    [
      'owners that do not end with «**»',
      sampleWith({ owners: [{ pattern: 'docs/**', owner: 'head' }] }),
      'the last pattern of «owners» is «**», so that every path has an owner',
    ],
    ['orders that are a list', sampleWith({ orders: [] }), '«orders» is an object'],
    ['no orders', sampleWith({ orders: undefined }), '«orders» is an object'],
    [
      'an order with a slash in its name',
      sampleWith({ orders: { 'W0/01': { role: 'head', write: ['**'] } } }),
      'orders.W0/01: the name of an order is letters, digits',
    ],
    [
      'an order that is no object',
      sampleWith({ orders: { X: 'docs/**' } }),
      'orders.X is an object with «role» and «write»',
    ],
    [
      'an order with an unknown field',
      sampleWith({ orders: { X: { role: 'head', write: ['**'], read: [] } } }),
      'orders.X has an unknown field «read»',
    ],
    [
      'an order with an unknown role',
      sampleWith({ orders: { X: { role: 'reviewer', write: ['**'] } } }),
      'orders.X: «role» is one of head, platform, industry, facts',
    ],
    [
      'an order without write patterns',
      sampleWith({ orders: { X: { role: 'head', write: [] } } }),
      'orders.X: «write» is a list with at least one pattern',
    ],
    [
      'an order whose write patterns are a text',
      sampleWith({ orders: { X: { role: 'head', write: 'docs/**' } } }),
      'orders.X: «write» is a list with at least one pattern',
    ],
    [
      'a write pattern that is no text',
      sampleWith({ orders: { X: { role: 'head', write: ['docs/**', 7] } } }),
      'orders.X: a write pattern is a text',
    ],
    [
      'a write pattern that names a directory',
      sampleWith({ orders: { X: { role: 'head', write: ['tools/'] } } }),
      'orders.X: the write pattern «tools/» ends with a slash',
    ],
    [
      'a write pattern with a placeholder outside a rule',
      sampleWith({ orders: { X: { role: 'industry', write: ['industries/<id>/**'] } } }),
      'orders.X: the write pattern «industries/<id>/**» uses «<»',
    ],
    [
      'a write pattern twice',
      sampleWith({ orders: { X: { role: 'head', write: ['docs/**', 'docs/**'] } } }),
      'orders.X: «docs/**» is listed twice',
    ],
    ['order rules that are no list', sampleWith({ orderRules: {} }), '«orderRules» is a list'],
    [
      'an order rule that is no object',
      sampleWith({ orderRules: ['branche-*'] }),
      'orderRules[0] is an object with «order», «role» and «write»',
    ],
    [
      'an order rule without a star',
      sampleWith({ orderRules: [{ order: 'branche-maler', role: 'industry', write: ['**'] }] }),
      'orderRules[0]: «order» names a family of orders with exactly one «*»',
    ],
    [
      'an order rule with two stars',
      sampleWith({ orderRules: [{ order: '*-*', role: 'industry', write: ['**'] }] }),
      'orderRules[0]: «order» names a family of orders with exactly one «*»',
    ],
    [
      'an order rule for every order',
      sampleWith({ orderRules: [{ order: '*', role: 'head', write: ['**'] }] }),
      'orderRules[0]: «order» names a family of orders with exactly one «*»',
    ],
    [
      'an order rule with an unknown role',
      sampleWith({ orderRules: [{ order: 'x-*', role: 'guest', write: ['**'] }] }),
      'orderRules[0]: «role» is one of',
    ],
    [
      'an order rule with an unknown placeholder',
      sampleWith({ orderRules: [{ order: 'x-*', role: 'industry', write: ['a/<industry>/**'] }] }),
      'orderRules[0]: the write pattern «a/<industry>/**» uses «<»',
    ],
    [
      'an order rule with an unknown field',
      sampleWith({ orderRules: [{ order: 'x-*', role: 'industry', write: ['**'], id: 'y' }] }),
      'orderRules[0] has an unknown field «id»',
    ],
    [
      'an order rule twice',
      sampleWith({
        orderRules: [
          { order: 'x-*', role: 'industry', write: ['industries/<id>/**'] },
          { order: 'x-*', role: 'industry', write: ['docs/branchen/<name>/**'] },
        ],
      }),
      'the family «x-*» is listed twice; the first one wins',
    ],
  ])('refuses %s', (_what, value, message) => {
    const { value: register, problems } = parseRegister(value);
    expect(problems.join('\n')).toContain(message);
    // No half-read register: nothing is judged by a register with a problem.
    expect(register).toBeUndefined();
  });

  it('names every problem, not only the first', () => {
    const { problems } = parseRegister({
      version: 3,
      owners: [{ pattern: 'docs/', owner: 'nobody' }],
      orders: { X: { role: 'guest', write: [] } },
    });
    expect(problems).toHaveLength(6);
  });
});

describe('readRegister', () => {
  it('reads the text of the file', () => {
    const { register, problems } = readRegister(JSON.stringify(SAMPLE));
    expect(problems).toEqual([]);
    expect(register?.orders.get('HEAD')?.role).toBe('head');
  });

  it('reports a missing file', () => {
    expect(readRegister(undefined)).toEqual({
      register: undefined,
      problems: [{ path: REGISTER_PATH, line: 0, message: 'the file is missing' }],
    });
  });

  it('reports text that is not JSON', () => {
    const { register, problems } = readRegister('{ "version": 1, ');
    expect(register).toBeUndefined();
    expect(problems.map(formatProblem).join('\n')).toContain('registry/owners.json: is not JSON');
  });

  it('reports the problems of the content at the path of the register', () => {
    const { register, problems } = readRegister(JSON.stringify(sampleWith({ version: 2 })));
    expect(register).toBeUndefined();
    expect(problems.map(formatProblem)).toEqual([
      'registry/owners.json: «version» is 1: this tool reads no other format',
    ]);
  });
});

describe('ownerOf', () => {
  it.each([
    ['platform/core/src/money.ts', 'platform:core'],
    ['platform/storage/api.md', 'platform:storage'],
    ['platform/README.md', 'head'],
    ['industries/painting/core/index.ts', 'industry:painting'],
    ['industries/building-services/NAMES.md', 'industry:building-services'],
    ['industries/muster/core/index.ts', 'head'],
    ['industries/README.md', 'head'],
    ['docs/branchen/maler.md', 'industry:*'],
    ['docs/branchen/maler/adr/PNT-0001-titel.md', 'industry:*'],
    ['docs/branchen/README.md', 'head'],
    ['docs/fakten/geld-steuern.md', 'facts'],
    ['docs/fahrplan.md', 'head'],
    ['registry/names.json', 'head'],
    ['editions/vor-ort/edition.ts', 'head'],
    ['tools/check.mjs', 'head'],
    ['.github/workflows/ci.yml', 'head'],
    ['package.json', 'head'],
  ])('%s belongs to %s', (path, owner) => {
    expect(ownerOf(REGISTER, path)).toBe(owner);
  });

  it('takes the first pattern that matches', () => {
    const register = registerFrom(
      sampleWith({
        owners: [
          { pattern: 'platform/core/**', owner: 'head' },
          { pattern: 'platform/*/**', owner: 'platform:*' },
          { pattern: '**', owner: 'head' },
        ],
      }),
    );
    expect(ownerOf(register, 'platform/core/src/money.ts')).toBe('head');
    expect(ownerOf(register, 'platform/ledger/src/index.ts')).toBe('platform:ledger');
  });

  it('leaves the star where the path names no id', () => {
    // A directory that is no id of a package: the owner is «a platform package», not a name.
    expect(ownerOf(REGISTER, 'platform/Core Old/x.ts')).toBe('platform:*');
  });

  it('fails for a register without the closing pattern', () => {
    const open: Register = { owners: [], orders: new Map(), orderRules: [] };
    expect(() => ownerOf(open, 'package.json')).toThrow('the list must end with «**»');
  });
});

describe('findOrder', () => {
  it('finds a listed order', () => {
    expect(findOrder(REGISTER, 'F-01')).toEqual({ role: 'facts', write: ['docs/fakten/**'] });
  });

  it('fills the name of the order and the id of the role into the patterns of a family', () => {
    expect(findOrder(REGISTER, 'branche-maler', 'painting')).toEqual({
      role: 'industry',
      write: ['industries/painting/**', 'docs/branchen/maler*', 'docs/branchen/maler/**'],
    });
  });

  it('takes the name for the id where the role names none', () => {
    expect(findOrder(REGISTER, 'branche-facility')?.write).toEqual([
      'industries/facility/**',
      'docs/branchen/facility*',
      'docs/branchen/facility/**',
    ]);
  });

  it('reads a name with dashes', () => {
    expect(findOrder(REGISTER, 'branche-haustechnik-holz', 'carpentry')?.write).toEqual([
      'industries/carpentry/**',
      'docs/branchen/haustechnik-holz*',
      'docs/branchen/haustechnik-holz/**',
    ]);
  });

  it('puts a listed order before a family', () => {
    const register = registerFrom(
      sampleWith({
        orders: { 'branche-aussen': { role: 'industry', write: ['industries/garden/**'] } },
      }),
    );
    expect(findOrder(register, 'branche-aussen', 'chimney')?.write).toEqual([
      'industries/garden/**',
    ]);
  });

  it.each([
    ['an order nobody entered', 'W9-99'],
    ['another case', 'w0-01'],
    ['a family name without a name', 'branche-'],
    ['a name that is no id', 'branche-Maler'],
    ['a name with a star', 'branche-*'],
    ['a name with a slash', 'branche-a/b'],
    ['a name with dots', 'branche-..'],
    ['a member of every object', 'constructor'],
    ['the prototype', '__proto__'],
    ['an empty name', ''],
  ])('does not know %s (%s)', (_what, id) => {
    expect(findOrder(REGISTER, id)).toBeUndefined();
  });

  it('fills in nothing but a plain id', () => {
    expect(findOrder(REGISTER, 'branche-maler', '*')).toBeUndefined();
    expect(findOrder(REGISTER, 'branche-maler', '../platform')).toBeUndefined();
  });
});

// --- The check ---------------------------------------------------------------------------------

describe('ownershipProblems: one commit', () => {
  it('passes a commit that changes only paths of its order', () => {
    expect(
      reasons({
        order: 'W0-01',
        role: 'platform',
        paths: [
          'package.json',
          'tsconfig.base.json',
          'tools/src/ownership.ts',
          'platform/core/src/money.ts',
          'docs/herkunft.md',
        ],
      }),
    ).toEqual([]);
  });

  it('reports a foreign path with the commit, the path and the reason', () => {
    const made = commit({
      order: 'W0-01',
      role: 'platform',
      subject: 'feat(core): money',
      paths: ['platform/core/src/money.ts', 'platform/ledger/src/index.ts', 'docs/fahrplan.md'],
    });
    expect(ownershipProblems([made], REGISTER)).toEqual([
      {
        commit: made.hash,
        subject: 'feat(core): money',
        path: 'platform/ledger/src/index.ts',
        reason: 'not among the write paths of the order W0-01 (belongs to platform:ledger)',
      },
      {
        commit: made.hash,
        subject: 'feat(core): money',
        path: 'docs/fahrplan.md',
        reason: 'not among the write paths of the order W0-01 (belongs to head)',
      },
    ]);
  });

  it('reports a commit without the trailers', () => {
    expect(reasons({ paths: ['docs/plan.md'] })).toEqual([
      'the message has no trailer «Order: <order>» in its last paragraph',
      'the message has no trailer «Role: <role>» in its last paragraph',
    ]);
    expect(reasons({ order: 'HEAD', paths: ['docs/plan.md'] })).toEqual([
      'the message has no trailer «Role: <role>» in its last paragraph',
    ]);
    expect(reasons({ role: 'head', paths: ['docs/plan.md'] })).toEqual([
      'the message has no trailer «Order: <order>» in its last paragraph',
    ]);
  });

  it('reports trailers that do not stand in the last paragraph', () => {
    const message = `docs: plan\n\nOrder: HEAD\nRole: head\n\n${OTHER_TRAILERS.join('\n')}\n`;
    expect(reasons({ message, paths: ['docs/plan.md'] })).toHaveLength(2);
    expect(reasons({ message: 'docs: plan\nOrder: HEAD\nRole: head\n' })).toHaveLength(2);
  });

  it('reports a commit without paths that lacks the trailers: every commit says what it is', () => {
    expect(reasons({ paths: [] })).toHaveLength(2);
    expect(reasons({ order: 'HEAD', role: 'head', paths: [] })).toEqual([]);
  });

  it('reads the trailers whatever the case of their keys', () => {
    const message = `x\n\norder: W0-01\nROLE: platform\n${OTHER_TRAILERS.join('\n')}\n`;
    expect(reasons({ message, paths: ['tools/check.mjs'] })).toEqual([]);
  });

  it('reports several orders or roles in one commit, and an empty one', () => {
    const twice = 'x\n\nOrder: W0-01\nOrder: HEAD\nRole: platform\nRole: platform\n';
    expect(reasons({ message: twice })).toEqual([
      'the message has 2 «Order» trailers (W0-01, HEAD): a commit has one',
      'the message has 2 «Role» trailers (platform, platform): a commit has one',
    ]);
    expect(reasons({ message: 'x\n\nOrder:\nRole: head\n' })).toEqual([
      'the trailer «Order» is empty',
    ]);
  });

  it('reports an order the register does not know', () => {
    expect(reasons({ order: 'W9-99', role: 'platform', paths: ['tools/check.mjs'] })).toEqual([
      'unknown order «W9-99»: registry/owners.json knows W0-01, HEAD, F-01, branche-*',
    ]);
    expect(reasons({ order: 'constructor', role: 'head' })).toEqual([
      'unknown order «constructor»: registry/owners.json knows W0-01, HEAD, F-01, branche-*',
    ]);
    expect(reasons({ order: 'w0-01', role: 'platform' })[0]).toContain('unknown order «w0-01»');
  });

  it('reports a role that does not exist', () => {
    expect(reasons({ order: 'W0-01', role: 'reviewer' })).toEqual([
      'unknown role «reviewer»: the roles are head, platform, industry, facts (an industry also as «industry:<id>»)',
    ]);
    expect(reasons({ order: 'W0-01', role: 'Platform' })[0]).toContain('unknown role «Platform»');
  });

  it('reports a role with a detail it does not carry, or with a detail that is no id', () => {
    for (const role of ['platform:core', 'head:x', 'industry:', 'industry:*', 'industry:a/b']) {
      expect(reasons({ order: 'W0-01', role }), role).toEqual([
        `the role «${role}» is not understood: only «industry:<id>» carries a detail, and an id is lower case with digits and single dashes`,
      ]);
    }
  });

  it('reports a role that is not the role of the order', () => {
    expect(reasons({ order: 'W0-01', role: 'industry', paths: ['tools/check.mjs'] })).toEqual([
      'the order W0-01 is worked on in the role platform (or head), not in the role industry',
    ]);
    expect(reasons({ order: 'HEAD', role: 'platform', paths: ['docs/plan.md'] })).toEqual([
      'the order HEAD is worked on in the role head, not in the role platform',
    ]);
    expect(reasons({ order: 'branche-maler', role: 'facts' })).toEqual([
      'the order branche-maler is worked on in the role industry (or head), not in the role facts',
    ]);
  });

  it('lets the head work on every order, inside the paths of that order', () => {
    expect(reasons({ order: 'W0-01', role: 'head', paths: ['platform/core/api.md'] })).toEqual([]);
    expect(reasons({ order: 'W0-01', role: 'head', paths: ['platform/ledger/api.md'] })).toEqual([
      'platform/ledger/api.md: not among the write paths of the order W0-01 (belongs to platform:ledger)',
    ]);
  });

  it('keeps the standing order of the head out of the platform and the industries', () => {
    expect(
      reasons({
        order: 'HEAD',
        role: 'head',
        paths: ['CLAUDE.md', '.gitignore', 'docs/adr/0012-titel.md', 'registry/names.json'],
      }),
    ).toEqual([]);
    expect(
      reasons({
        order: 'HEAD',
        role: 'head',
        paths: ['platform/core/src/money.ts', 'industries/painting/core/index.ts'],
      }),
    ).toEqual([
      'platform/core/src/money.ts: not among the write paths of the order HEAD (belongs to platform:core)',
      'industries/painting/core/index.ts: not among the write paths of the order HEAD (belongs to industry:painting)',
    ]);
  });

  it('counts a moved file with both paths', () => {
    // Moved out of the paths of the order: the new place is foreign.
    expect(
      reasons({
        order: 'W0-01',
        role: 'platform',
        paths: ['platform/core/src/money.ts', 'platform/ledger/src/money.ts'],
      }),
    ).toEqual([
      'platform/ledger/src/money.ts: not among the write paths of the order W0-01 (belongs to platform:ledger)',
    ]);
    // Moved in from a foreign place: the file was taken away there.
    expect(
      reasons({
        order: 'branche-maler',
        role: 'industry:painting',
        paths: ['industries/facility/core/rooms.ts', 'industries/painting/core/rooms.ts'],
      }),
    ).toEqual([
      'industries/facility/core/rooms.ts: not among the write paths of the order branche-maler (belongs to industry:facility)',
    ]);
  });
});

describe('ownershipProblems: the orders of the industries', () => {
  it('lets an industry write its code and its docs', () => {
    expect(
      reasons({
        order: 'branche-maler',
        role: 'industry:painting',
        paths: [
          'industries/painting/core/index.ts',
          'industries/painting/web/pages/survey.tsx',
          'industries/painting/NAMES.md',
          'docs/branchen/maler.md',
          'docs/branchen/maler/adr/PNT-0001-titel.md',
          'docs/branchen/maler/antraege.md',
        ],
      }),
    ).toEqual([]);
  });

  it('takes the name of the order for the id where both are the same', () => {
    expect(
      reasons({
        order: 'branche-facility',
        role: 'industry',
        paths: ['industries/facility/core/index.ts', 'docs/branchen/facility.md'],
      }),
    ).toEqual([]);
    expect(
      reasons({
        order: 'branche-maler',
        role: 'industry',
        paths: ['industries/painting/core/index.ts'],
      }),
    ).toEqual([
      'industries/painting/core/index.ts: not among the write paths of the order branche-maler (belongs to industry:painting)',
    ]);
  });

  it('keeps an industry out of every other path', () => {
    expect(
      reasons({
        order: 'branche-maler',
        role: 'industry:painting',
        paths: [
          'industries/facility/core/index.ts',
          'docs/branchen/umzug.md',
          'docs/branchen/README.md',
          'docs/glossar.md',
          'platform/core/src/money.ts',
          'registry/names.json',
          'pnpm-lock.yaml',
          'industries/paintings/core/index.ts',
        ],
      }),
    ).toEqual([
      'industries/facility/core/index.ts: not among the write paths of the order branche-maler (belongs to industry:facility)',
      'docs/branchen/umzug.md: not among the write paths of the order branche-maler (belongs to industry:*)',
      'docs/branchen/README.md: not among the write paths of the order branche-maler (belongs to head)',
      'docs/glossar.md: not among the write paths of the order branche-maler (belongs to head)',
      'platform/core/src/money.ts: not among the write paths of the order branche-maler (belongs to platform:core)',
      'registry/names.json: not among the write paths of the order branche-maler (belongs to head)',
      'pnpm-lock.yaml: not among the write paths of the order branche-maler (belongs to head)',
      'industries/paintings/core/index.ts: not among the write paths of the order branche-maler (belongs to industry:paintings)',
    ]);
  });

  it('lets one order work in several industries, one per commit', () => {
    const garden = { order: 'branche-aussen', role: 'industry:garden' };
    expect(reasons({ ...garden, paths: ['industries/garden/core/index.ts'] })).toEqual([]);
    expect(reasons({ ...garden, paths: ['industries/chimney/core/index.ts'] })).toHaveLength(1);
    expect(
      reasons({
        order: 'branche-aussen',
        role: 'industry:chimney',
        paths: ['industries/chimney/core/index.ts', 'docs/branchen/aussen/antraege.md'],
      }),
    ).toEqual([]);
  });
});

describe('ownershipProblems: the second fence', () => {
  it('keeps an industry out of what the head owns, even where the family lists it', () => {
    // The family gives «industries/<id>/**»; the reference industry belongs to the head.
    expect(
      reasons({
        order: 'branche-muster',
        role: 'industry',
        paths: ['industries/muster/core/index.ts'],
      }),
    ).toEqual([
      'industries/muster/core/index.ts: belongs to head: the role industry never writes there, whatever the order branche-muster lists',
    ]);
    expect(
      reasons({
        order: 'branche-README.md',
        role: 'industry',
        paths: ['docs/branchen/README.md'],
      })[0],
    ).toContain('unknown order');
  });

  it('holds when the register itself lists too much', () => {
    const register = registerFrom(
      sampleWith({
        orders: {
          'branche-maler': { role: 'industry', write: ['industries/painting/**', 'platform/**'] },
          'F-02': { role: 'facts', write: ['docs/**'] },
          'P-09': { role: 'platform', write: ['platform/**', 'industries/**', 'docs/**'] },
        },
      }),
    );
    expect(
      reasons(
        {
          order: 'branche-maler',
          role: 'industry:painting',
          paths: ['industries/painting/core/index.ts', 'platform/core/src/money.ts'],
        },
        register,
      ),
    ).toEqual([
      'platform/core/src/money.ts: belongs to platform:core: the role industry never writes there, whatever the order branche-maler lists',
    ]);
    expect(
      reasons(
        { order: 'F-02', role: 'facts', paths: ['docs/fakten/arbeit.md', 'docs/plan.md'] },
        register,
      ),
    ).toEqual([
      'docs/plan.md: belongs to head: the role facts never writes there, whatever the order F-02 lists',
    ]);
    expect(
      reasons(
        {
          order: 'P-09',
          role: 'platform',
          paths: [
            'platform/core/src/money.ts',
            'docs/plattform.md',
            'industries/painting/core/index.ts',
            'docs/fakten/arbeit.md',
          ],
        },
        register,
      ),
    ).toEqual([
      'industries/painting/core/index.ts: belongs to industry:painting: the role platform never writes there, whatever the order P-09 lists',
      'docs/fakten/arbeit.md: belongs to facts: the role platform never writes there, whatever the order P-09 lists',
    ]);
    // The head lands and repairs the work of every role.
    expect(
      reasons(
        {
          order: 'P-09',
          role: 'head',
          paths: ['industries/painting/core/index.ts', 'docs/fakten/arbeit.md'],
        },
        register,
      ),
    ).toEqual([]);
  });

  it('lets the facts role write the facts', () => {
    expect(reasons({ order: 'F-01', role: 'facts', paths: ['docs/fakten/arbeit.md'] })).toEqual([]);
  });

  it('knows every role', () => {
    expect(ROLES).toEqual(['head', 'platform', 'industry', 'facts']);
  });
});

describe('checkOwnership: a range of commits', () => {
  it('checks every commit on its own and says how many it checked', () => {
    const good = commit({ order: 'W0-01', role: 'platform', paths: ['tools/check.mjs'] });
    const foreign = commit({ order: 'F-01', role: 'facts', paths: ['tools/check.mjs'] });
    const silent = commit({ subject: 'docs: plan', paths: ['docs/plan.md'] });
    const report = checkOwnership([good, foreign, silent], REGISTER);
    expect(report.checked).toBe(3);
    expect(report.skipped).toEqual([]);
    expect(report.problems.map(({ commit: hash, path }) => [hash, path])).toEqual([
      [foreign.hash, 'tools/check.mjs'],
      [silent.hash, ''],
      [silent.hash, ''],
    ]);
  });

  it('judges a path by the order of its own commit, not by a neighbour', () => {
    // The same path: allowed for the one order, foreign for the other.
    const allowed = commit({ order: 'HEAD', role: 'head', paths: ['docs/plan.md'] });
    const foreign = commit({ order: 'W0-01', role: 'platform', paths: ['docs/plan.md'] });
    expect(ownershipProblems([allowed, foreign], REGISTER).map(({ commit: hash }) => hash)).toEqual(
      [foreign.hash],
    );
  });

  it('skips a clean merge with a note and does not count it as checked', () => {
    const merge = commit({
      subject: 'Merge the work of an order',
      message: 'Merge the work of an order\n',
      parents: ['a'.repeat(40), 'b'.repeat(40)],
      paths: [],
    });
    const report = checkOwnership(
      [commit({ order: 'HEAD', role: 'head', paths: ['docs/plan.md'] }), merge],
      REGISTER,
    );
    expect(report.checked).toBe(1);
    expect(report.problems).toEqual([]);
    expect(report.skipped).toEqual([
      {
        commit: merge.hash,
        subject: 'Merge the work of an order',
        reason: 'a clean merge: the commits it merges are checked on their own',
      },
    ]);
  });

  it('judges a merge that changes paths itself like every other commit', () => {
    // The paths of a merge are what differs from every parent: a change made inside the merge.
    const parents = ['a'.repeat(40), 'b'.repeat(40)];
    const silent = commit({
      subject: 'Merge the work of an order',
      message: 'Merge the work of an order\n',
      parents,
      paths: ['docs/plan.md'],
    });
    const foreign = commit({ order: 'W0-01', role: 'platform', parents, paths: ['docs/plan.md'] });
    const fine = commit({ order: 'W0-01', role: 'platform', parents, paths: ['tools/check.mjs'] });
    const report = checkOwnership([silent, foreign, fine], REGISTER);
    expect(report.checked).toBe(3);
    expect(report.skipped).toEqual([]);
    expect(report.problems.map(({ commit: hash, path }) => ({ hash, path }))).toEqual([
      { hash: silent.hash, path: '' },
      { hash: silent.hash, path: '' },
      { hash: foreign.hash, path: 'docs/plan.md' },
    ]);
    expect(report.problems[0]?.reason).toContain('no trailer «Order: <order>»');
  });

  it('checks the first commit of a repository like any other', () => {
    const first = commit({ order: 'HEAD', role: 'head', paths: ['README.md'], parents: [] });
    expect(checkOwnership([first], REGISTER)).toEqual({ checked: 1, skipped: [], problems: [] });
  });

  it('finds nothing in no commits', () => {
    expect(checkOwnership([], REGISTER)).toEqual({ checked: 0, skipped: [], problems: [] });
  });
});

describe('formatting', () => {
  it('writes a problem as one line with the short hash and the subject', () => {
    expect(
      formatOwnershipProblem({
        commit: '0123456789abcdef0123456789abcdef01234567',
        subject: 'feat(core): money',
        path: 'docs/plan.md',
        reason: 'not among the write paths of the order W0-01 (belongs to head)',
      }),
    ).toBe(
      '0123456 «feat(core): money»: docs/plan.md: not among the write paths of the order W0-01 (belongs to head)',
    );
    expect(
      formatOwnershipProblem({
        commit: '0123456789abcdef0123456789abcdef01234567',
        subject: 'docs: plan',
        path: '',
        reason: 'the trailer «Order» is empty',
      }),
    ).toBe('0123456 «docs: plan»: the trailer «Order» is empty');
  });

  it('writes the summary of a run as one line', () => {
    expect(
      formatOwnershipSummary({ checked: 4, skipped: [], problems: [] }, '4 commits after main'),
    ).toBe('ownership: 4 commits after main: checked 4, no problem');
    const problem = { commit: 'c'.repeat(40), subject: 'x', path: '', reason: 'y' };
    expect(
      formatOwnershipSummary(
        {
          checked: 1,
          skipped: [{ commit: 'ab'.repeat(20), subject: 'Merge', reason: 'a merge' }],
          problems: [problem],
        },
        '2 commits after main',
      ),
    ).toBe('ownership: 2 commits after main: checked 1, skipped abababa (a merge), 1 problem');
    expect(
      formatOwnershipSummary({ checked: 2, skipped: [], problems: [problem, problem] }, 'HEAD'),
    ).toBe('ownership: HEAD: checked 2, 2 problems');
  });

  it('names the variable of the base', () => {
    expect(BASE_VARIABLE).toBe('OWNERSHIP_BASE');
  });
});

describe('baseFromEnvironment', () => {
  it('takes the base the environment names, without the white space around it', () => {
    expect(baseFromEnvironment({ OWNERSHIP_BASE: 'origin/main' })).toBe('origin/main');
    expect(baseFromEnvironment({ OWNERSHIP_BASE: ' abc1234\n' })).toBe('abc1234');
    expect(baseFromEnvironment({ OWNERSHIP_BASE: 'origin/main', GITHUB_ACTIONS: 'true' })).toBe(
      'origin/main',
    );
  });

  it('names no base on a desk where the variable is missing or empty', () => {
    expect(baseFromEnvironment({})).toBeUndefined();
    expect(baseFromEnvironment({ OWNERSHIP_BASE: '' })).toBeUndefined();
    expect(baseFromEnvironment({ OWNERSHIP_BASE: '  ', GITHUB_ACTIONS: 'false' })).toBeUndefined();
  });

  it('fails on the CI without a base: an empty range after origin/main would pass unread', () => {
    expect(CI_VARIABLE).toBe('GITHUB_ACTIONS');
    expect(() => baseFromEnvironment({ GITHUB_ACTIONS: 'true' })).toThrow(
      /OWNERSHIP_BASE is not set, and this is the CI/,
    );
    expect(() => baseFromEnvironment({ GITHUB_ACTIONS: 'true', OWNERSHIP_BASE: ' ' })).toThrow(
      /OWNERSHIP_BASE is not set/,
    );
  });
});

// --- The real register -------------------------------------------------------------------------

describe('the real register (registry/owners.json)', () => {
  const { register, problems } = readRegister(readFileSync(join(REPO_ROOT, REGISTER_PATH), 'utf8'));
  const real = (made: Parameters<typeof commit>[0]): string[] => {
    if (register === undefined) {
      throw new Error('the real register is malformed');
    }
    return reasons(made, register);
  };

  it('is well formed', () => {
    expect(problems.map(formatProblem)).toEqual([]);
  });

  it('gives the order W0-01 the paths its document lists', () => {
    expect(
      real({
        order: 'W0-01',
        role: 'platform',
        paths: [
          'package.json',
          'pnpm-workspace.yaml',
          'pnpm-lock.yaml',
          'tsconfig.json',
          'tsconfig.base.json',
          'eslint.config.js',
          'vitest.config.ts',
          '.prettierrc.json',
          '.prettierignore',
          '.editorconfig',
          '.gitignore',
          '.nvmrc',
          '.github/workflows/ci.yml',
          'tools/check.mjs',
          'tools/guards/ownership.guard.test.ts',
          'registry/owners.json',
          'registry/names.json',
          'platform/core/src/money.ts',
          'platform/contract/api.md',
          'platform/storage/test/backup.test.ts',
          'platform/ledger/package.json',
          'platform/testing/src/index.ts',
          'docs/herkunft.md',
          'docs/schulden.md',
          'docs/nebenwirkungen.md',
          'docs/lernbuch.md',
          'docs/fahrplan.md',
          'docs/auftraege/w0-01-fundament.md',
          'CLAUDE.md',
        ],
      }),
    ).toEqual([]);
  });

  it('keeps the order W0-01 out of everything else', () => {
    const foreign = [
      'AGENTS.md',
      'README.md',
      'LICENSE',
      'docs/architektur.md',
      'docs/adr/0012-titel.md',
      'docs/auftraege/w0-02-zusammensetzen.md',
      'docs/branchen/facility.md',
      'docs/fakten/geld-steuern.md',
      'platform/business/src/index.ts',
      'industries/muster/core/index.ts',
      'industries/facility/core/index.ts',
      'editions/vor-ort/edition.ts',
      'services/vermittler/index.ts',
      '.github/dependabot.yml',
    ];
    expect(real({ order: 'W0-01', role: 'platform', paths: foreign })).toHaveLength(foreign.length);
  });

  it('gives the head a standing order for docs, registers, tools, editions and the root', () => {
    expect(
      real({
        order: 'HEAD',
        role: 'head',
        paths: [
          'CLAUDE.md',
          'AGENTS.md',
          'README.md',
          'package.json',
          'pnpm-lock.yaml',
          '.gitignore',
          '.github/workflows/ci.yml',
          'docs/entscheide.md',
          'docs/adr/0012-titel.md',
          'docs/auftraege/w0-02-zusammensetzen.md',
          'docs/branchen/facility.md',
          'docs/fakten/README.md',
          'registry/names.json',
          'tools/src/ownership.ts',
          'editions/vor-ort/edition.ts',
        ],
      }),
    ).toEqual([]);
  });

  it('keeps the standing order out of the platform, the industries and the services', () => {
    const foreign = [
      'platform/core/src/money.ts',
      'platform/README.md',
      'industries/muster/core/index.ts',
      'industries/facility/core/index.ts',
      'services/vermittler/index.ts',
    ];
    expect(real({ order: 'HEAD', role: 'head', paths: foreign })).toHaveLength(foreign.length);
    expect(real({ order: 'HEAD', role: 'platform', paths: ['docs/plan.md'] })).toHaveLength(1);
  });

  it('lets the industries work as their orders say', () => {
    expect(
      real({
        order: 'branche-gebaeudehuelle',
        role: 'industry:envelope',
        paths: [
          'industries/envelope/core/index.ts',
          'industries/envelope/NAMES.md',
          'docs/branchen/gebaeudehuelle.md',
          'docs/branchen/gebaeudehuelle/adr/ENV-0001-titel.md',
        ],
      }),
    ).toEqual([]);
    const foreign = [
      'industries/painting/core/index.ts',
      'industries/muster/core/index.ts',
      'docs/branchen/maler.md',
      'docs/branchen/README.md',
      'docs/fakten/geld-steuern.md',
      'platform/core/src/money.ts',
      'registry/names.json',
    ];
    expect(
      real({ order: 'branche-gebaeudehuelle', role: 'industry:envelope', paths: foreign }),
    ).toHaveLength(foreign.length);
  });

  it('gives no industry the docs that belong to the head', () => {
    for (const name of ['gastro', 'weitere', 'muster']) {
      const paths = [`docs/branchen/${name}.md`, `industries/${name}/core/index.ts`];
      expect(real({ order: `branche-${name}`, role: 'industry', paths }), name).not.toEqual([]);
    }
    expect(
      real({ order: 'branche-gastro', role: 'industry', paths: ['docs/branchen/gastro.md'] }),
    ).toEqual([
      'docs/branchen/gastro.md: belongs to head: the role industry never writes there, whatever the order branche-gastro lists',
    ]);
  });
});

// --- Git: a made-up repository in a temporary directory ----------------------------------------

const temporary: string[] = [];
afterEach(() => {
  vi.unstubAllEnvs();
  for (const dir of temporary.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function temporaryDirectory(): string {
  const dir = mkdtempSync(join(tmpdir(), 'onestrand-ownership-'));
  temporary.push(dir);
  return dir;
}

function write(root: string, path: string, content = `${path}\n`): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
}

/** Commits everything that changed, with the given message; returns the hash. */
function save(root: string, message: string): string {
  git(root, 'add', '--all');
  git(root, 'commit', '--quiet', '--allow-empty', '--message', message);
  return git(root, 'rev-parse', 'HEAD');
}

/** A message with the trailers of an order, as the commits of this repository end. */
function messageFor(subject: string, order: string, role: string): string {
  return `${subject}\n\nWhat and why.\n\nOrder: ${order}\nRole: ${role}\n${OTHER_TRAILERS.join('\n')}`;
}

/** A repository with one commit on `main`. */
function repository(): { root: string; start: string } {
  const root = temporaryDirectory();
  git(root, 'init', '--quiet', '--initial-branch=main');
  write(root, 'README.md');
  write(root, 'docs/plan.md');
  const start = save(root, messageFor('docs: start', 'HEAD', 'head'));
  return { root, start };
}

describe('readCommit', () => {
  it('reads the parents, the message and the changed paths, sorted', () => {
    const { root, start } = repository();
    write(root, 'tools/check.mjs');
    write(root, 'docs/plan.md', 'changed\n');
    write(root, '.gitignore', 'node_modules/\n');
    const message = messageFor('feat: tools', 'W0-01', 'platform');
    const hash = save(root, message);
    expect(readCommit(root, hash)).toEqual({
      hash,
      parents: [start],
      message: `${message}\n`,
      paths: ['.gitignore', 'docs/plan.md', 'tools/check.mjs'],
    });
  });

  it('reads all files of the first commit, which has no parent', () => {
    const { root, start } = repository();
    expect(readCommit(root, start)).toMatchObject({
      parents: [],
      paths: ['README.md', 'docs/plan.md'],
    });
  });

  it('counts a moved file with both paths, and a deleted one with its path', () => {
    const { root } = repository();
    write(root, 'platform/core/src/money.ts', 'export const rappen = 100;\n'.repeat(20));
    save(root, 'feat: money');
    mkdirSync(join(root, 'platform/ledger/src'), { recursive: true });
    renameSync(
      join(root, 'platform/core/src/money.ts'),
      join(root, 'platform/ledger/src/money.ts'),
    );
    rmSync(join(root, 'docs/plan.md'));
    const hash = save(root, 'refactor: move money');
    expect(readCommit(root, hash).paths).toEqual([
      'docs/plan.md',
      'platform/core/src/money.ts',
      'platform/ledger/src/money.ts',
    ]);
  });

  it('gives a path with spaces, umlauts and quotes as it is', () => {
    const { root } = repository();
    write(root, 'docs/über uns "neu".md');
    const hash = save(root, 'docs: about');
    expect(readCommit(root, hash).paths).toEqual(['docs/über uns "neu".md']);
  });

  it('reads a clean merge with its parents and without paths', () => {
    const { root, start } = repository();
    git(root, 'switch', '--quiet', '--create', 'work');
    write(root, 'tools/check.mjs');
    const work = save(root, 'feat: tools');
    git(root, 'switch', '--quiet', 'main');
    write(root, 'docs/plan.md', 'main moved on\n');
    const main = save(root, 'docs: plan');
    git(root, 'merge', '--quiet', '--no-ff', '--message', 'Merge work', 'work');
    const merge = git(root, 'rev-parse', 'HEAD');
    expect(readCommit(root, merge)).toEqual({
      hash: merge,
      parents: [main, work],
      message: 'Merge work\n',
      paths: [],
    });
    expect(start).not.toBe(merge);
  });

  it('reads the paths a merge changes itself: an edit made inside it, both names of a move', () => {
    const { root } = repository();
    git(root, 'switch', '--quiet', '--create', 'work');
    write(root, 'tools/check.mjs');
    save(root, 'feat: tools');
    git(root, 'switch', '--quiet', 'main');
    write(root, 'LICENSE');
    save(root, 'docs: licence');
    git(root, 'merge', '--quiet', '--no-ff', '--no-commit', 'work');
    // Neither branch touched these: the merge does, by hand.
    write(root, 'docs/plan.md', 'changed inside the merge\n');
    write(root, 'registry/names.json', '{}\n');
    renameSync(join(root, 'README.md'), join(root, 'LIESMICH.md'));
    const merge = save(root, 'Merge work');
    expect(readCommit(root, merge).parents).toHaveLength(2);
    expect(readCommit(root, merge).paths).toEqual([
      'LIESMICH.md',
      'README.md',
      'docs/plan.md',
      'registry/names.json',
    ]);
  });

  it('reads the path of a conflict that a merge settles', () => {
    const { root } = repository();
    git(root, 'switch', '--quiet', '--create', 'work');
    write(root, 'docs/plan.md', 'the plan of the branch\n');
    write(root, 'tools/check.mjs');
    save(root, 'docs: plan of the branch');
    git(root, 'switch', '--quiet', 'main');
    write(root, 'docs/plan.md', 'the plan of main\n');
    save(root, 'docs: plan of main');
    expect(() => git(root, 'merge', '--quiet', '--no-ff', 'work')).toThrow();
    write(root, 'docs/plan.md', 'the plan of both\n');
    const merge = save(root, 'Merge work');
    expect(readCommit(root, merge).parents).toHaveLength(2);
    expect(readCommit(root, merge).paths).toEqual(['docs/plan.md']);
  });

  it('reads a commit without changes', () => {
    const { root } = repository();
    const hash = save(root, 'chore: nothing');
    expect(readCommit(root, hash).paths).toEqual([]);
  });

  it('keeps the message as it was written, with every paragraph and line', () => {
    const { root } = repository();
    const message = 'docs: plan\n\nFirst paragraph,\nsecond line.\n\n\nAfter two empty lines.';
    const hash = git(
      root,
      'commit-tree',
      '-m',
      message,
      `${git(root, 'rev-parse', 'HEAD')}^{tree}`,
    );
    expect(readCommit(root, hash).message).toBe(`${message}\n`);
    expect(readCommit(root, hash).parents).toEqual([]);
  });

  it('reads a commit without a message', () => {
    const { root } = repository();
    const hash = git(root, 'commit-tree', `${git(root, 'rev-parse', 'HEAD')}^{tree}`);
    expect(readCommit(root, hash)).toMatchObject({ parents: [], message: '' });
    expect(parseTrailers(readCommit(root, hash).message)).toEqual([]);
  });

  it('takes nothing but a full hash', () => {
    const { root, start } = repository();
    for (const name of ['HEAD', 'main', start.slice(0, 12), '--all', '']) {
      expect(() => readCommit(root, name), name).toThrow('is not the full hash of a commit');
    }
    expect(() => readCommit(root, 'a'.repeat(40))).toThrow(GitError);
  });
});

describe('resolveCommit', () => {
  it('gives the full hash of a branch, of HEAD and of a short hash', () => {
    const { root, start } = repository();
    expect(resolveCommit(root, 'main')).toBe(start);
    expect(resolveCommit(root, 'HEAD')).toBe(start);
    expect(resolveCommit(root, start.slice(0, 8))).toBe(start);
  });

  it('gives undefined for a name this clone does not have', () => {
    const { root } = repository();
    expect(resolveCommit(root, 'origin/main')).toBeUndefined();
    expect(resolveCommit(root, '')).toBeUndefined();
    expect(resolveCommit(temporaryDirectory(), 'HEAD')).toBeUndefined();
  });

  it('takes a name that looks like an option for a name', () => {
    const { root } = repository();
    expect(resolveCommit(root, '--all')).toBeUndefined();
    expect(resolveCommit(root, '--git-dir=/nowhere')).toBeUndefined();
  });
});

describe('git', () => {
  it('fails with what git says', () => {
    const { root } = repository();
    expect(() => runGit(root, ['rev-parse', '--verify', 'no-such-branch'])).toThrow(GitError);
    expect(() => runGit(root, ['rev-parse', '--verify', 'no-such-branch'])).toThrow(
      /git rev-parse failed in .*: fatal/,
    );
  });

  it('reads the repository of its directory, whatever a hook exported', () => {
    const { root, start } = repository();
    const other = repository();
    save(other.root, 'docs: another repository');
    vi.stubEnv('GIT_DIR', join(other.root, '.git'));
    vi.stubEnv('GIT_WORK_TREE', other.root);
    expect(runGit(root, ['rev-parse', 'HEAD']).trim()).toBe(start);
    expect(readCommitRange(root, undefined).commits.map(({ hash }) => hash)).toEqual([start]);
  });
});

describe('readCommitRange', () => {
  /** A repository with `origin/main` at the start and two commits of work after it. */
  function withWork(): { root: string; start: string; first: string; second: string } {
    const { root, start } = repository();
    git(root, 'update-ref', 'refs/remotes/origin/main', start);
    git(root, 'switch', '--quiet', '--create', 'work');
    write(root, 'tools/check.mjs');
    const first = save(root, messageFor('feat: tools', 'W0-01', 'platform'));
    write(root, 'platform/core/src/money.ts');
    const second = save(root, messageFor('feat(core): money', 'W0-01', 'platform'));
    return { root, start, first, second };
  }

  it('reads the commits after the base up to HEAD, oldest first', () => {
    const { root, start, first, second } = withWork();
    const range = readCommitRange(root, 'main');
    expect(range.base).toEqual({ name: 'main', hash: start });
    expect(range.commits.map(({ hash }) => hash)).toEqual([first, second]);
    expect(range.commits.map(({ paths }) => paths)).toEqual([
      ['tools/check.mjs'],
      ['platform/core/src/money.ts'],
    ]);
    expect(range.note).toBe(
      `2 commits after main (${start.slice(0, 7)}) up to HEAD (${second.slice(0, 7)})`,
    );
  });

  it('takes a hash for the base, as the CI gives it on a push', () => {
    const { root, first, second } = withWork();
    const range = readCommitRange(root, first);
    expect(range.commits.map(({ hash }) => hash)).toEqual([second]);
    expect(range.note).toBe(
      `1 commit after ${first.slice(0, 7)} up to HEAD (${second.slice(0, 7)})`,
    );
  });

  it('takes origin/main where no base is set', () => {
    const { root, start, first, second } = withWork();
    for (const unset of [undefined, '', '  ']) {
      const range = readCommitRange(root, unset);
      expect(range.base).toEqual({ name: 'origin/main', hash: start });
      expect(range.commits.map(({ hash }) => hash)).toEqual([first, second]);
    }
  });

  it('reads HEAD on its own where no base is set and the clone has no origin/main', () => {
    const { root } = repository();
    write(root, 'tools/check.mjs');
    save(root, 'feat: one');
    const head = save(root, 'feat: two');
    const range = readCommitRange(root, undefined);
    expect(range.base).toBeUndefined();
    expect(range.commits.map(({ hash }) => hash)).toEqual([head]);
    expect(range.note).toBe(
      `no base is set and this clone has no origin/main: HEAD (${head.slice(0, 7)}) is read on its own`,
    );
  });

  it('reads HEAD on its own for a base of zeros: a new branch has no commit before it', () => {
    const { root, second } = withWork();
    for (const zeros of ['0'.repeat(40), '0'.repeat(64)]) {
      const range = readCommitRange(root, zeros);
      expect(range.base).toBeUndefined();
      expect(range.commits.map(({ hash }) => hash)).toEqual([second]);
      expect(range.note).toContain('the base is a hash of zeros (a new branch)');
    }
  });

  it('reads no commit where HEAD is the base', () => {
    const { root, second } = withWork();
    const range = readCommitRange(root, 'work');
    expect(range.commits).toEqual([]);
    expect(range.note).toBe(
      `0 commits after work (${second.slice(0, 7)}) up to HEAD (${second.slice(0, 7)})`,
    );
  });

  it('reads only the commits of the branch where the base has moved on', () => {
    const { root, start, first, second } = withWork();
    git(root, 'switch', '--quiet', 'main');
    write(root, 'docs/plan.md', 'main moved on\n');
    const moved = save(root, messageFor('docs: plan', 'HEAD', 'head'));
    git(root, 'switch', '--quiet', 'work');
    const range = readCommitRange(root, 'main');
    expect(range.base).toEqual({ name: 'main', hash: moved });
    expect(range.commits.map(({ hash }) => hash)).toEqual([first, second]);
    expect(start).not.toBe(moved);
  });

  it('reads the commits a merge brings, and the merge itself', () => {
    const { root, first, second } = withWork();
    git(root, 'switch', '--quiet', 'main');
    write(root, 'docs/plan.md', 'main moved on\n');
    save(root, messageFor('docs: plan', 'HEAD', 'head'));
    git(root, 'merge', '--quiet', '--no-ff', '--message', 'Merge work', 'work');
    const merge = git(root, 'rev-parse', 'HEAD');
    const range = readCommitRange(root, 'HEAD^1');
    expect(range.commits.map(({ hash }) => hash)).toEqual([first, second, merge]);
    expect(range.commits.at(-1)?.parents).toHaveLength(2);
  });

  it('fails for a base this clone does not have', () => {
    const { root } = withWork();
    expect(() => readCommitRange(root, 'origin/release')).toThrow(GitError);
    expect(() => readCommitRange(root, 'origin/release')).toThrow(
      'the base «origin/release» is not a commit in this clone',
    );
    expect(() => readCommitRange(root, 'abcdef0123456789abcdef0123456789abcdef01')).toThrow(
      'is not a commit in this clone',
    );
    // Zeros of another length are a name like any other, not «no commit».
    expect(() => readCommitRange(root, '0000000')).toThrow('is not a commit in this clone');
  });

  it('takes a base that looks like an option for a name', () => {
    const { root } = withWork();
    expect(() => readCommitRange(root, '--all')).toThrow('the base «--all» is not a commit');
  });

  it('fails where the base and HEAD share no history', () => {
    const { root } = withWork();
    git(root, 'switch', '--quiet', '--orphan', 'elsewhere');
    save(root, 'chore: another beginning');
    expect(() => readCommitRange(root, 'main')).toThrow(
      'the base «main» and HEAD have no common commit in this clone',
    );
  });

  it('fails outside a git repository and in one without a commit', () => {
    const outside = temporaryDirectory();
    expect(() => readCommitRange(outside, 'main')).toThrow(GitError);
    expect(() => readCommitRange(outside, 'main')).toThrow(
      /there is no commit to read at HEAD: git rev-parse failed in .*not a git repository/s,
    );
    const empty = temporaryDirectory();
    git(empty, 'init', '--quiet', '--initial-branch=main');
    expect(() => readCommitRange(empty, undefined)).toThrow(GitError);
    expect(() => readCommitRange(empty, undefined)).toThrow('there is no commit to read at HEAD');
  });

  it('fails where git cannot be started, and says so', () => {
    const { root } = withWork();
    vi.stubEnv('PATH', temporaryDirectory());
    expect(() => readCommitRange(root, 'main')).toThrow(
      /there is no commit to read at HEAD: git rev-parse failed in .*ENOENT/s,
    );
    expect(resolveCommit(root, 'HEAD')).toBeUndefined();
  });
});

describe('from git to the problems', () => {
  it('finds the commit that leaves the paths of its order, among commits that do not', () => {
    const { root, start } = repository();
    write(root, 'tools/check.mjs');
    const good = save(root, messageFor('feat: tools', 'W0-01', 'platform'));
    write(root, 'platform/ledger/src/index.ts');
    write(root, 'platform/core/src/money.ts');
    const foreign = save(root, messageFor('feat: two packages', 'W0-01', 'platform'));
    write(root, 'docs/plan.md', 'changed\n');
    const silent = save(root, 'docs: plan without trailers');
    const range = readCommitRange(root, start);
    const report = checkOwnership(range.commits, REGISTER);
    expect(range.commits.map(({ hash }) => hash)).toEqual([good, foreign, silent]);
    expect(report.checked).toBe(3);
    expect(report.problems.map(formatOwnershipProblem)).toEqual([
      `${foreign.slice(0, 7)} «feat: two packages»: platform/ledger/src/index.ts: not among the write paths of the order W0-01 (belongs to platform:ledger)`,
      `${silent.slice(0, 7)} «docs: plan without trailers»: the message has no trailer «Order: <order>» in its last paragraph`,
      `${silent.slice(0, 7)} «docs: plan without trailers»: the message has no trailer «Role: <role>» in its last paragraph`,
    ]);
  });
});

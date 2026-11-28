import { join } from 'node:path';
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { beforeAll, describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../src/repo-files.ts';

// The import boundaries of the platform hold (order W0-01, acceptance: «a deliberately wrong
// import makes lint red»; docs/architektur.md, 3.2; docs/zusammenarbeit.md, 10.1 and 10.2).
//
// Deliberately wrong code is linted with the real `eslint.config.js` under the path of a file
// that does not exist, and the rule must fire. Nothing is written into `platform/`: other agents
// and the other checks read it at the same time.
//
// One thing stands in the way. The real config lints with type information (`projectService`),
// and the project service refuses a file that is not on disk («was not found by the project
// service»). So ESLint gets one more config object behind the real ones: `disableTypeChecked`
// of typescript-eslint, which switches off the type information of the parser and exactly the
// rules that need it. Everything else stays as the real file says, and the boundaries need no
// types: they are `no-restricted-imports`, `no-restricted-syntax` and `no-restricted-globals` of
// ESLint itself, and two rules of typescript-eslint that read the syntax only. ESLint loads the
// real file on its own, so whoever weakens a rule there turns these tests red; the first test
// compares the boundary rules of both configs, setting by setting.
//
// An import has four forms, and each is refused by a rule of its own: the import statement
// (`no-restricted-imports`), `import('…')` (`no-restricted-syntax`), the type `import('…').Thing`
// (`consistent-type-imports`) and `require('…')` (`no-require-imports`).
//
// What lint does not see, and what holds there instead:
// - A Node module without the `node:` prefix (`fs`) and globals that are not on the list
//   (`console`, `setTimeout`, `globalThis.fetch`): the purity typecheck of a package
//   (`tsconfig.src.json`: no DOM, no Node types).
// - A test that imports a platform package above its own layer: pnpm does not link it.
// - `import(name)` with a name that is computed: nothing, so the pure part has no `import()`
//   at all, and a test that needs one names its module as a plain text.

const DYNAMIC = 'no-restricted-syntax';
const TYPE_FORM = '@typescript-eslint/consistent-type-imports';
const REQUIRE = '@typescript-eslint/no-require-imports';
const BOUNDARY_RULES = [
  'no-restricted-imports',
  'no-restricted-globals',
  DYNAMIC,
  TYPE_FORM,
  REQUIRE,
] as const;

/** Every file of code, as the real config lints them (`CODE` in eslint.config.js). */
const WITHOUT_TYPES = {
  files: ['**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'],
  ...tseslint.configs.disableTypeChecked,
};

/**
 * The layers of the platform (docs/architektur.md, 3.2): what each package may import. Written
 * down here a second time on purpose: a layer that is opened in `eslint.config.js` alone turns
 * these tests red, so opening one is a decision made in two places.
 */
const LAYERS: Readonly<Record<string, readonly string[]>> = {
  core: [],
  contract: ['core'],
  storage: ['core', 'contract'],
  ledger: ['core', 'contract', 'storage'],
  testing: ['core', 'contract', 'storage'],
};
const PACKAGES = Object.keys(LAYERS);

/** The real config, and the real config without type information. */
let real: ESLint;
let linter: ESLint;

/** A file of the pure part of a package, and one of its tests; neither exists. */
const source = (name: string, file = 'boundary-probe.ts'): string => `platform/${name}/src/${file}`;
const test = (name: string): string => `platform/${name}/test/boundary-probe.test.ts`;

/** Code that imports from a module and uses what it imports: wrong only in where it reaches. */
function importing(specifier: string): string {
  return `import { thing } from '${specifier}';\n\nexport const used = thing;\n`;
}

/** The same reach with `import('…')`, with the type `import('…').Thing` and with `require`. */
function loading(specifier: string): string {
  return `export const load = () => import('${specifier}');\n`;
}
function typeOf(specifier: string): string {
  return `export type Used = import('${specifier}').Thing;\n`;
}
function requiring(specifier: string): string {
  return `export const used: unknown = require('${specifier}');\n`;
}

/** Code that reads a global. */
function reading(name: string): string {
  return `export const used = ${name};\n`;
}

interface Finding {
  rule: string;
  severity: number;
  line: number;
  message: string;
}

/** What lint says about the code, as if it stood in the given file of the repository. */
async function lint(file: string, code: string): Promise<Finding[]> {
  const [result] = await linter.lintText(code, {
    filePath: join(REPO_ROOT, file),
    warnIgnored: true,
  });
  if (result === undefined) {
    throw new Error(`ESLint returned no result for ${file}`);
  }
  // A message without a rule is a parsing error or «file ignored»: then nothing was checked,
  // and an empty list of findings would be a pass for the wrong reason.
  const unread = result.messages.find((message) => message.ruleId === null);
  if (unread !== undefined) {
    throw new Error(`${file} was not linted: ${unread.message}`);
  }
  return result.messages.map((message) => ({
    rule: message.ruleId ?? '',
    severity: message.severity,
    line: message.line,
    message: message.message,
  }));
}

/** The code is refused: only by the given rule, as an error, at its first line, naming `what`. */
async function expectRefused(file: string, code: string, rule: string, what: string) {
  const findings = await lint(file, code);
  expect(findings, `${file}: ${code}`).not.toEqual([]);
  for (const finding of findings) {
    expect(finding, `${file}: ${code}`).toMatchObject({ rule, severity: 2, line: 1 });
    expect(finding.message).toContain(`'${what}'`);
  }
}

function expectNoImport(file: string, specifier: string): Promise<void> {
  return expectRefused(file, importing(specifier), 'no-restricted-imports', specifier);
}

/** The code is refused by exactly the given rule, as an error at its first line. */
async function expectRefusedBy(file: string, code: string, rule: string): Promise<void> {
  const findings = await lint(file, code);
  expect(findings, `${file}: ${code}`).not.toEqual([]);
  for (const finding of findings) {
    expect(finding, `${file}: ${code}`).toMatchObject({ rule, severity: 2, line: 1 });
  }
}

/** Lint has nothing to say about the code, no boundary and nothing else. */
async function expectAccepted(file: string, code: string): Promise<void> {
  expect(await lint(file, code), `${file}: ${code}`).toEqual([]);
}

beforeAll(async () => {
  real = new ESLint({ cwd: REPO_ROOT });
  linter = new ESLint({ cwd: REPO_ROOT, overrideConfig: [WITHOUT_TYPES] });
  // The first run loads the parser and the plugins; the tests after it are quick.
  await lint(source('core'), importing('./ids'));
}, 120_000);

/** A file of a package that is neither its pure part nor a test, and one of a part to come. */
const CONFIG = 'platform/core/vitest.config.ts';
const ELSEWHERE = 'platform/core/web/boundary-probe.tsx';

/** A file of the pure part of an industry, one of its tests and its configuration; none exists. */
const industrySource = (id: string, file = 'boundary-probe.ts'): string =>
  `industries/${id}/core/src/${file}`;
const industryTest = (id: string): string => `industries/${id}/core/test/boundary-probe.test.ts`;
const INDUSTRY_CONFIG = 'industries/muster/core/vitest.config.ts';

describe('the probe', () => {
  it.each([
    source('core'),
    source('ledger'),
    source('unlisted'),
    source('ui', 'boundary-probe.tsx'),
    test('core'),
    CONFIG,
    ELSEWHERE,
    industrySource('muster'),
    industryTest('muster'),
    INDUSTRY_CONFIG,
  ])('keeps the boundary rules of the real config for %s', async (file) => {
    const path = join(REPO_ROOT, file);
    const [before, after] = (await Promise.all([
      real.calculateConfigForFile(path),
      linter.calculateConfigForFile(path),
    ])) as { rules?: Record<string, unknown> }[];
    expect(before?.rules?.['no-restricted-imports']).toBeDefined();
    for (const rule of BOUNDARY_RULES) {
      expect(after?.rules?.[rule], rule).toEqual(before?.rules?.[rule]);
    }
  });

  it('accepts code that respects every boundary', async () => {
    await expectAccepted(source('core'), importing('./ids'));
  });
});

describe('the pure part of a package: no UI, no database, no Node', () => {
  it.each([
    'react',
    'react-dom',
    'react-dom/client',
    'react/jsx-runtime',
    'dexie',
    'dexie-react-hooks',
    'node:fs',
    'node:crypto',
    'node:child_process',
  ])('refuses %s', async (specifier) => {
    await expectNoImport(source('core'), specifier);
    await expectNoImport(source('ledger'), specifier);
    await expectNoImport(source('unlisted'), specifier);
  });

  it('holds for a file in a subdirectory and for every TypeScript extension', async () => {
    await expectNoImport(source('core', 'model/deep/probe.ts'), 'react');
    await expectNoImport(source('core', 'widget.tsx'), 'react');
    await expectNoImport(source('core', 'probe.mts'), 'node:fs');
    await expectNoImport(source('core', 'probe.cts'), 'dexie');
  });

  it('holds for a JavaScript file put there: no typecheck reads it, so lint must', async () => {
    await expectNoImport(source('core', 'probe.js'), 'react');
    await expectNoImport(source('core', 'probe.mjs'), 'node:fs');
    await expectNoImport(source('core', 'probe.jsx'), '@onestrand/storage');
    await expectNoImport(source('core', 'probe.cjs'), 'dexie');
    await expectNoImport(
      source('unlisted', 'probe.mjs'),
      '../../../industries/facility/core/index',
    );
  });

  it('refuses the React part of another package', async () => {
    await expectNoImport(source('storage'), '@onestrand/contract/web');
    await expectNoImport(source('storage'), '@onestrand/storage/web');
  });

  it('accepts a library without UI', async () => {
    await expectAccepted(source('core'), importing('zod'));
  });
});

describe('the pure part of a package: import statements only', () => {
  // The rules for imports read import statements. Every other form is refused as such, so no
  // import slips past them, whatever it reaches.
  const targets = [
    'react',
    'node:fs',
    '@onestrand/storage',
    '../../../industries/facility/core/index',
    './ids',
  ];

  it.each(targets)("refuses import('%s')", async (specifier) => {
    await expectRefusedBy(source('core'), loading(specifier), DYNAMIC);
    await expectRefusedBy(source('unlisted'), loading(specifier), DYNAMIC);
    await expectRefusedBy(source('core', 'probe.mjs'), loading(specifier), DYNAMIC);
  });

  it.each(targets)("refuses the type import('%s').Thing", async (specifier) => {
    await expectRefusedBy(source('core'), typeOf(specifier), TYPE_FORM);
    await expectRefusedBy(source('unlisted'), typeOf(specifier), TYPE_FORM);
  });

  it.each(targets)("refuses require('%s')", async (specifier) => {
    await expectRefusedBy(source('core'), requiring(specifier), REQUIRE);
  });
});

describe('the pure part of a package: no browser and no Node globals', () => {
  it.each([
    'window',
    'document',
    'localStorage',
    'sessionStorage',
    'indexedDB',
    'fetch',
    'navigator',
    'process',
    'Buffer',
    'crypto',
  ])('refuses the global %s', async (name) => {
    await expectRefused(source('core'), reading(name), 'no-restricted-globals', name);
    await expectRefused(source('unlisted'), reading(name), 'no-restricted-globals', name);
  });

  it('accepts the same name where it is a parameter: the outside world comes in through ports', async () => {
    await expectAccepted(
      source('storage'),
      'export function randomByte(crypto: { random(): number }): number {\n  return crypto.random();\n}\n',
    );
  });

  it('leaves the tests alone: they run on Node', async () => {
    await expectAccepted(test('core'), reading('crypto'));
    await expectAccepted(test('core'), reading('process'));
  });
});

describe('the platform imports no industry and no edition', () => {
  it.each(['../../../industries/facility/core/index', '../../../editions/field/edition'])(
    'refuses %s, in the pure part and in a test',
    async (specifier) => {
      await expectNoImport(source('core'), specifier);
      await expectNoImport(source('unlisted'), specifier);
      await expectNoImport(test('core'), specifier);
    },
  );

  it('refuses an industry by a package name, too', async () => {
    await expectNoImport(source('ledger'), '@onestrand/facility');
    await expectNoImport(source('ledger'), '@onestrand/industry-facility');
  });

  it.each(['../../../industries/facility/core/index', '../../../editions/field/edition'])(
    'refuses %s in a test of any extension, and in every other form of an import',
    async (specifier) => {
      await expectNoImport('platform/core/test/boundary-probe.test.tsx', specifier);
      await expectNoImport('platform/core/test/boundary-probe.test.mts', specifier);
      await expectRefusedBy(test('core'), loading(specifier), DYNAMIC);
      await expectRefusedBy(test('core'), typeOf(specifier), TYPE_FORM);
      await expectRefusedBy(test('core'), requiring(specifier), REQUIRE);
    },
  );

  it('refuses an industry that is not reached by a relative path, with import() too', async () => {
    await expectNoImport(test('core'), 'industries/facility/core/index');
    await expectRefusedBy(test('core'), loading('industries/facility/core/index'), DYNAMIC);
    await expectRefusedBy(CONFIG, loading('editions/field/edition'), DYNAMIC);
  });

  it.each(['../../industries/facility/core/index', '../../editions/field/edition'])(
    'refuses %s in every other file under platform/: a config, a part without rules of its own',
    async (specifier) => {
      for (const file of [CONFIG, ELSEWHERE, 'platform/core/scripts/probe.mjs']) {
        await expectNoImport(file, specifier);
        await expectRefusedBy(file, loading(specifier), DYNAMIC);
      }
      await expectRefusedBy(CONFIG, typeOf(specifier), TYPE_FORM);
    },
  );

  it('leaves such a file its other imports', async () => {
    await expectAccepted(CONFIG, importing('vitest/config'));
    await expectAccepted(CONFIG, loading('node:fs'));
  });
});

describe('the layers of the platform', () => {
  const pairs = PACKAGES.flatMap((from) => PACKAGES.map((to) => [from, to] as const));

  it.each(pairs.filter(([from, to]) => LAYERS[from]?.includes(to) === true))(
    '%s may import %s',
    async (from, to) => {
      await expectAccepted(source(from), importing(`@onestrand/${to}`));
    },
  );

  it.each(pairs.filter(([from, to]) => LAYERS[from]?.includes(to) !== true))(
    '%s may not import %s',
    async (from, to) => {
      await expectNoImport(source(from), `@onestrand/${to}`);
    },
  );

  it('covers the two cases of the order: core imports storage, storage imports ledger', async () => {
    await expectNoImport(source('core'), '@onestrand/storage');
    await expectNoImport(source('storage'), '@onestrand/ledger');
  });

  it('counts a type and a re-export as an import', async () => {
    await expectRefused(
      source('core'),
      "import type { Thing } from '@onestrand/storage';\n\nexport type Used = Thing;\n",
      'no-restricted-imports',
      '@onestrand/storage',
    );
    await expectRefused(
      source('core'),
      "export * from '@onestrand/storage';\n",
      'no-restricted-imports',
      '@onestrand/storage',
    );
    await expectRefused(
      source('contract'),
      "export { thing } from '@onestrand/ledger';\n",
      'no-restricted-imports',
      '@onestrand/ledger',
    );
  });

  it('gives a package without a line of its own no platform package at all', async () => {
    for (const name of PACKAGES) {
      await expectNoImport(source('unlisted'), `@onestrand/${name}`);
    }
  });
});

describe('a package is imported by its public entry', () => {
  it('refuses a file inside another package, by name', async () => {
    await expectNoImport(source('storage'), '@onestrand/contract/src/index');
    await expectNoImport(source('ledger'), '@onestrand/core/src/money');
    await expectNoImport(test('core'), '@onestrand/core/src/money');
    await expectNoImport(test('ledger'), '@onestrand/storage/src/memory');
    await expectNoImport('platform/core/test/boundary-probe.test.mts', '@onestrand/core/src/money');
    await expectNoImport('platform/core/test/boundary-probe.test.tsx', '@onestrand/core/src/money');
  });

  it('refuses a file inside another package, by path', async () => {
    await expectNoImport(source('storage'), '../../core/src/index');
    await expectNoImport(source('storage'), '../../core/src');
    await expectNoImport(source('storage', 'backup/probe.ts'), '../../../contract/src/ports');
    await expectNoImport(test('core'), '../../storage/src/index');
    await expectNoImport(test('core'), '../../storage');
  });

  it('refuses the tests and the tools from the pure part', async () => {
    await expectNoImport(source('core'), '../test/helper');
    await expectNoImport(source('core'), '../../../tools/src/repo-files');
  });

  it('refuses the same reach from a test with import()', async () => {
    await expectRefusedBy(test('core'), loading('@onestrand/core/src/money'), DYNAMIC);
    await expectRefusedBy(test('ledger'), loading('@onestrand/storage/src/memory'), DYNAMIC);
    await expectRefusedBy(test('core'), loading('../../storage/src/index'), DYNAMIC);
    await expectRefusedBy(test('core'), loading('../../storage'), DYNAMIC);
  });

  it('lets a test load its own package and a public entry with import()', async () => {
    await expectAccepted(test('storage'), loading('../src/index'));
    await expectAccepted(test('storage'), loading('./fakes'));
    await expectAccepted(test('ledger'), loading('@onestrand/ledger'));
    await expectAccepted(test('ledger'), loading('@onestrand/storage/testing'));
  });

  it('accepts the files of the own package', async () => {
    await expectAccepted(source('storage'), importing('./ports'));
    await expectAccepted(source('storage', 'backup/probe.ts'), importing('../ports'));
    await expectAccepted(source('storage', 'backup/probe.ts'), importing('./crypto/envelope'));
    await expectAccepted(test('storage'), importing('../src/index'));
    await expectAccepted(test('storage'), importing('./fakes'));
  });
});

describe('the packages of the layer «Browser»', () => {
  // `web-data` is the first: it opens the database of the browser. It is held to the same rules as
  // a pure package, with the globals named for it in `BROWSER_PACKAGES` of `eslint.config.js` as
  // the one difference. The list is written down here a second time on purpose: opening a
  // global, or making a second package a browser package, is a decision made in two places.
  const BROWSER = 'web-data';
  const REACHES = ['indexedDB', 'localStorage', 'navigator', 'crypto'];
  const CLOSED = ['window', 'document', 'sessionStorage', 'fetch', 'process', 'Buffer'];
  const WEB_DATA_LAYERS = ['core', 'contract', 'storage', 'business', 'manifest'];
  const OTHERS = ['ledger', 'testing', 'features', 'access', 'i18n'];

  it.each(REACHES)('lets %s through in web-data', async (name) => {
    await expectAccepted(source(BROWSER), reading(name));
    await expectAccepted(source(BROWSER, 'idb/deep/probe.ts'), reading(name));
  });

  it.each(CLOSED)('still refuses the global %s in web-data', async (name) => {
    await expectRefused(source(BROWSER), reading(name), 'no-restricted-globals', name);
  });

  it.each(REACHES)('still refuses %s in a pure package', async (name) => {
    for (const pure of [...PACKAGES, 'manifest', 'i18n', 'unlisted']) {
      await expectRefused(source(pure), reading(name), 'no-restricted-globals', name);
    }
  });

  it('lets through the globals of the list and no others, by the rule of the real config', async () => {
    const path = join(REPO_ROOT, source(BROWSER));
    const config = (await real.calculateConfigForFile(path)) as {
      rules?: Record<string, unknown[]>;
    };
    const [severity, ...refused] = config.rules?.['no-restricted-globals'] ?? [];
    expect(severity).toBe(2);
    expect([...refused].sort()).toEqual([...CLOSED].sort());
  });

  it.each(['react', 'react-dom', 'react-dom/client', 'dexie', 'node:fs', 'node:crypto'])(
    'refuses %s: no UI, no other database, no Node',
    async (specifier) => {
      await expectNoImport(source(BROWSER), specifier);
      await expectNoImport(source(BROWSER, 'deep/probe.ts'), specifier);
    },
  );

  it('refuses the React part of a package and import() in any form', async () => {
    await expectNoImport(source(BROWSER), '@onestrand/storage/web');
    await expectNoImport(source(BROWSER), '@onestrand/manifest/web');
    await expectRefusedBy(source(BROWSER), loading('./idb'), DYNAMIC);
    await expectRefusedBy(source(BROWSER), typeOf('react'), TYPE_FORM);
    await expectRefusedBy(source(BROWSER), requiring('node:fs'), REQUIRE);
  });

  it('refuses an industry and an edition, by path and by name', async () => {
    await expectNoImport(source(BROWSER), '../../../industries/facility/core/index');
    await expectNoImport(source(BROWSER), '../../../editions/field/edition');
    await expectNoImport(source(BROWSER), '@onestrand/facility');
    await expectRefusedBy(
      source(BROWSER),
      loading('../../../industries/facility/core/index'),
      DYNAMIC,
    );
  });

  it.each(WEB_DATA_LAYERS)('may import %s', async (layer) => {
    await expectAccepted(source(BROWSER), importing(`@onestrand/${layer}`));
  });

  it.each([...OTHERS, BROWSER])('may not import %s', async (layer) => {
    await expectNoImport(source(BROWSER), `@onestrand/${layer}`);
  });

  it('is imported by no package below it: the layers stay as they were', async () => {
    for (const lower of [...PACKAGES, 'manifest', 'business']) {
      await expectNoImport(source(lower), `@onestrand/${BROWSER}`);
    }
  });

  it('gives a package with no line of its own no global of the list', async () => {
    await expectRefused(
      source('unlisted'),
      reading('indexedDB'),
      'no-restricted-globals',
      'indexedDB',
    );
    await expectRefused(
      source('unlisted'),
      reading('localStorage'),
      'no-restricted-globals',
      'localStorage',
    );
  });

  it('leaves the tests of web-data alone, as it does for every package', async () => {
    await expectAccepted(test(BROWSER), reading('indexedDB'));
    await expectAccepted(test(BROWSER), importing('fake-indexeddb'));
    await expectAccepted(test(BROWSER), importing('@onestrand/testing'));
  });

  it('keeps the boundary rules of the real config for web-data, with and without types', async () => {
    const path = join(REPO_ROOT, source(BROWSER));
    const [before, after] = (await Promise.all([
      real.calculateConfigForFile(path),
      linter.calculateConfigForFile(path),
    ])) as { rules?: Record<string, unknown> }[];
    for (const rule of BOUNDARY_RULES) {
      expect(after?.rules?.[rule], rule).toEqual(before?.rules?.[rule]);
    }
  });
});
describe('the platform imports no industry by the scope of the industries', () => {
  // The packages of the industries are `@onestrand-industry/<id>`, outside `@onestrand/`: no rule
  // of the platform's own layers would see them, so the rule against industries names the scope.
  it.each(['@onestrand-industry/muster', '@onestrand-industry/muster/src/index'])(
    'refuses %s in the pure part, in a test and in any other file under platform/',
    async (specifier) => {
      for (const file of [
        source('core'),
        source('manifest'),
        source('web-data'),
        source('unlisted'),
        test('core'),
        CONFIG,
        ELSEWHERE,
      ]) {
        await expectNoImport(file, specifier);
      }
    },
  );

  it('refuses the scope in every other form of an import', async () => {
    await expectRefusedBy(source('core'), loading('@onestrand-industry/muster'), DYNAMIC);
    await expectRefusedBy(test('core'), loading('@onestrand-industry/muster'), DYNAMIC);
    await expectRefusedBy(CONFIG, loading('@onestrand-industry/muster'), DYNAMIC);
    await expectRefusedBy(test('core'), typeOf('@onestrand-industry/muster'), TYPE_FORM);
    await expectRefusedBy(test('core'), requiring('@onestrand-industry/muster'), REQUIRE);
  });
});

describe('the pure part of an industry', () => {
  // `industries/<id>/core/src`: pure like the platform, importing the public entries of the pure
  // layers of the platform, never another industry, never an edition (suite ADR-0004).
  const SOURCES = [
    industrySource('muster'),
    industrySource('muster', 'deep/probe.ts'),
    industrySource('other'),
  ];
  const PURE_PLATFORM = [
    'core',
    'contract',
    'storage',
    'ledger',
    'features',
    'access',
    'business',
    'i18n',
    'manifest',
  ];

  it.each(PURE_PLATFORM)('may import @onestrand/%s by its public entry', async (name) => {
    await expectAccepted(industrySource('muster'), importing(`@onestrand/${name}`));
  });

  it('may import a library without UI and its own files', async () => {
    await expectAccepted(industrySource('muster'), importing('zod'));
    await expectAccepted(industrySource('muster'), importing('./model'));
    await expectAccepted(industrySource('muster', 'deep/probe.ts'), importing('../model'));
  });

  it.each(['@onestrand/web-data', '@onestrand/testing'])(
    'refuses %s: no package of the layer «Browser», no test kit',
    async (specifier) => {
      for (const file of SOURCES) {
        await expectNoImport(file, specifier);
      }
    },
  );

  it.each([
    '@onestrand/contract/src/index',
    '@onestrand/manifest/web',
    '@onestrand/storage/testing',
    '../../../../platform/core/src/index',
  ])('refuses %s: only the public entry of a platform package', async (specifier) => {
    for (const file of SOURCES) {
      await expectNoImport(file, specifier);
    }
  });

  it.each([
    'react',
    'react-dom',
    'react-dom/client',
    'react/jsx-runtime',
    'dexie',
    'dexie-react-hooks',
    'node:fs',
    'node:crypto',
  ])('refuses %s: no UI, no database, no Node', async (specifier) => {
    for (const file of SOURCES) {
      await expectNoImport(file, specifier);
    }
  });

  it.each([
    '@onestrand-industry/other',
    '@onestrand-industry/other/src/index',
    '@onestrand-industry/muster',
    '../../../other/core/src/index',
    '../../../../industries/other/core/src/index',
  ])('refuses %s: no other industry, and itself by relative path only', async (specifier) => {
    await expectNoImport(industrySource('muster'), specifier);
    await expectNoImport(industrySource('muster', 'probe.mjs'), specifier);
  });

  it.each(['../../web/messages', '../test/messages'])(
    'refuses %s: the pure part stays in its src, away from its React part and its tests',
    async (specifier) => {
      await expectNoImport(industrySource('muster'), specifier);
    },
  );

  it.each(['../../../../editions/field/edition', 'editions/field/edition'])(
    'refuses the edition %s: the edition lists the industry',
    async (specifier) => {
      await expectNoImport(industrySource('muster'), specifier);
    },
  );

  it('holds for every extension of code', async () => {
    await expectNoImport(industrySource('muster', 'widget.tsx'), 'react');
    await expectNoImport(industrySource('muster', 'probe.mts'), 'node:fs');
    await expectNoImport(industrySource('muster', 'probe.cjs'), '@onestrand-industry/other');
    await expectNoImport(industrySource('muster', 'probe.js'), '@onestrand/web-data');
  });

  it.each(['./model', '@onestrand/manifest', '@onestrand-industry/other', 'react'])(
    "refuses import('%s'), the type import('%s').Thing and require('%s')",
    async (specifier) => {
      await expectRefusedBy(industrySource('muster'), loading(specifier), DYNAMIC);
      await expectRefusedBy(industrySource('muster'), typeOf(specifier), TYPE_FORM);
      await expectRefusedBy(industrySource('muster'), requiring(specifier), REQUIRE);
    },
  );

  it.each([
    'window',
    'document',
    'localStorage',
    'sessionStorage',
    'indexedDB',
    'fetch',
    'navigator',
    'process',
    'Buffer',
    'crypto',
  ])('refuses the global %s', async (name) => {
    await expectRefused(industrySource('muster'), reading(name), 'no-restricted-globals', name);
  });

  it('accepts the same name as a parameter: the outside world comes in through ports', async () => {
    await expectAccepted(
      industrySource('muster'),
      'export function randomByte(crypto: { random(): number }): number {\n  return crypto.random();\n}\n',
    );
  });
});

describe('the tests of an industry', () => {
  it.each([
    'node:fs',
    'vitest',
    'zod',
    '@onestrand/testing',
    '@onestrand/manifest',
    '@onestrand/storage/testing',
    '../src',
    './support',
  ])('may import %s', async (specifier) => {
    await expectAccepted(industryTest('muster'), importing(specifier));
  });

  it('may read the globals of Node', async () => {
    await expectAccepted(industryTest('muster'), reading('process'));
  });

  it.each([
    '@onestrand-industry/other',
    '@onestrand-industry/muster',
    '../../../other/core/src/index',
    '../../web/messages',
    '../../../../editions/field/edition',
    '@onestrand/contract/src/index',
    '../../../../platform/storage/src/memory',
  ])(
    'refuses %s: no other industry, no edition, nothing outside the package',
    async (specifier) => {
      await expectNoImport(industryTest('muster'), specifier);
    },
  );

  it.each([
    '@onestrand-industry/other',
    '../../../other/core/src/index',
    '../../../../editions/field/edition',
    '@onestrand/contract/src/index',
  ])("refuses import('%s') as well", async (specifier) => {
    await expectRefusedBy(industryTest('muster'), loading(specifier), DYNAMIC);
  });

  it('lets a test load its own package with import()', async () => {
    await expectAccepted(industryTest('muster'), loading('../src/index'));
    await expectAccepted(industryTest('muster'), loading('@onestrand/manifest'));
  });
});

describe('whatever else stands under industries/', () => {
  it('reaches no edition, in any form', async () => {
    await expectNoImport(INDUSTRY_CONFIG, '../../../editions/field/edition');
    await expectRefusedBy(INDUSTRY_CONFIG, loading('../../../editions/field/edition'), DYNAMIC);
    await expectAccepted(INDUSTRY_CONFIG, importing('vitest/config'));
  });
});

describe('the tests of a package', () => {
  it.each(['node:fs', 'node:crypto', 'node:path', 'vitest', 'fast-check'])(
    'may import %s',
    async (specifier) => {
      await expectAccepted(test('core'), importing(specifier));
      await expectAccepted(test('ledger'), importing(specifier));
    },
  );

  it('may import the platform packages by name', async () => {
    await expectAccepted(test('ledger'), importing('@onestrand/ledger'));
    await expectAccepted(test('ledger'), importing('@onestrand/testing'));
  });
});

describe('the packages of the layer «React»', () => {
  // `ui` is the first: its whole `src/` is React (the kit, P-08). It is held to the rules of a pure
  // package with three differences, named in `REACT_PACKAGES` of `eslint.config.js`: it imports
  // React and its icons, it reaches `window` and `document`, and the rules of the hooks apply. The
  // lists are written down here a second time on purpose: opening an import or a global, or
  // making a second package a React package, is a decision made in two places.
  const REACT = 'ui';
  const file = (name = 'boundary-probe.tsx') => source(REACT, name);
  const REACHES = ['window', 'document'];
  const CLOSED = [
    'localStorage',
    'sessionStorage',
    'indexedDB',
    'fetch',
    'navigator',
    'process',
    'Buffer',
    'crypto',
  ];
  const UI_LAYERS = ['core', 'i18n'];
  const CLOSED_LAYERS = [
    'contract',
    'storage',
    'ledger',
    'testing',
    'features',
    'access',
    'business',
    'manifest',
    'web-data',
  ];
  const PURE = [...PACKAGES, 'features', 'access', 'business', 'i18n', 'manifest', 'unlisted'];

  it.each(['react', 'react/jsx-runtime', 'lucide-react'])(
    'lets %s through in ui, in every file of its src',
    async (specifier) => {
      await expectAccepted(file(), importing(specifier));
      await expectAccepted(file('deep/probe.ts'), importing(specifier));
    },
  );

  it.each(['react', 'react/jsx-runtime', 'react-dom', 'lucide-react'])(
    'still refuses %s in a pure package and in the layer «Browser»',
    async (specifier) => {
      for (const pure of [...PURE, 'web-data']) {
        await expectNoImport(source(pure, 'widget.tsx'), specifier);
      }
      await expectNoImport(industrySource('muster', 'widget.tsx'), specifier);
    },
  );

  it.each([
    'react-dom',
    'react-dom/client',
    'dexie',
    'dexie-react-hooks',
    'node:fs',
    'node:crypto',
  ])('refuses %s in ui: no mounting, no database, no Node', async (specifier) => {
    await expectNoImport(file(), specifier);
  });

  it.each(UI_LAYERS)('may import %s', async (layer) => {
    await expectAccepted(file(), importing(`@onestrand/${layer}`));
  });

  it.each([...CLOSED_LAYERS, REACT])(
    'may not import %s: no data, no rights, no device',
    async (layer) => {
      await expectNoImport(file(), `@onestrand/${layer}`);
    },
  );

  it('covers the case of the order: the kit reaches no storage', async () => {
    await expectNoImport(file(), '@onestrand/storage');
    await expectNoImport(file(), '@onestrand/web-data');
  });

  it('is imported by no package of the lower layers', async () => {
    for (const lower of [...PURE, 'web-data']) {
      await expectNoImport(source(lower), `@onestrand/${REACT}`);
    }
  });

  it.each(REACHES)('lets the global %s through in ui', async (name) => {
    await expectAccepted(file(), reading(name));
  });

  it.each(CLOSED)('still refuses the global %s in ui', async (name) => {
    await expectRefused(file(), reading(name), 'no-restricted-globals', name);
  });

  it.each(REACHES)('still refuses the global %s in a pure package', async (name) => {
    for (const pure of PURE) {
      await expectRefused(source(pure), reading(name), 'no-restricted-globals', name);
    }
  });

  it('lets through the globals of the list and no others, by the rule of the real config', async () => {
    const config = (await real.calculateConfigForFile(join(REPO_ROOT, file()))) as {
      rules?: Record<string, unknown[]>;
    };
    const [severity, ...refused] = config.rules?.['no-restricted-globals'] ?? [];
    expect(severity).toBe(2);
    expect([...refused].sort()).toEqual([...CLOSED].sort());
  });

  it('refuses an industry, an edition, a file inside a package and import() in any form', async () => {
    await expectNoImport(file(), '../../../industries/facility/core/index');
    await expectNoImport(file(), '../../../editions/field/edition');
    await expectNoImport(file(), '@onestrand-industry/muster');
    await expectNoImport(file(), '@onestrand/core/src/money');
    await expectNoImport(file(), '@onestrand/i18n/web');
    await expectRefusedBy(file(), loading('./Button'), DYNAMIC);
    await expectRefusedBy(file(), typeOf('react'), TYPE_FORM);
    await expectRefusedBy(file(), requiring('react'), REQUIRE);
  });

  it('holds the hooks of React to their rules', async () => {
    const conditional =
      "import { useState } from 'react';\n\nexport function Probe({ on }: { on: boolean }) {\n  if (on) {\n    useState(0);\n  }\n  return null;\n}\n";
    const findings = await lint(file(), conditional);
    expect(findings.map((finding) => finding.rule)).toContain('react-hooks/rules-of-hooks');
  });

  it('leaves the tests of ui their tools: Node, the testing library, the test kit', async () => {
    const probe = 'platform/ui/test/boundary-probe.test.tsx';
    for (const specifier of [
      'node:fs',
      '@testing-library/react',
      '@onestrand/testing',
      '@onestrand/ui',
      '../src/index',
    ]) {
      await expectAccepted(probe, importing(specifier));
    }
    await expectNoImport(probe, '../../storage/src/index');
  });

  it('keeps the boundary rules of the real config for ui, with and without types', async () => {
    const path = join(REPO_ROOT, file());
    const [before, after] = (await Promise.all([
      real.calculateConfigForFile(path),
      linter.calculateConfigForFile(path),
    ])) as { rules?: Record<string, unknown> }[];
    for (const rule of BOUNDARY_RULES) {
      expect(after?.rules?.[rule], rule).toEqual(before?.rules?.[rule]);
    }
  });
});

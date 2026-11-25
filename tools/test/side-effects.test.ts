import { describe, expect, it } from 'vitest';
import { formatProblem, type RepoFile } from '../src/repo-files.ts';
import {
  isShippedSource,
  shippedSources,
  SIDE_EFFECTS_DOCUMENT,
  sideEffectGuardProblems,
} from '../src/side-effects.ts';

const file = (path: string, text: string): RepoFile => ({ path, text });

const HEADER = [
  '| Kennung | Nebenwirkung | Im Code | Wo | Daten verlassen das Gerät? | Entscheid | Seit |',
  '| --- | --- | --- | --- | --- | --- | --- |',
];
const register = (...rows: string[]) => ['# Nebenwirkungen', '', ...HEADER, ...rows, ''].join('\n');

const DATABASE =
  '| SE-01 | Datenbank des Geräts | `indexedDB` | `platform/web-data` | nein | ADR-0009 | geplant |';

describe('isShippedSource', () => {
  it.each([
    'platform/storage/src/memory-storage.ts',
    'platform/web-ui/web/button.tsx',
    'industries/muster/core/use-cases.ts',
    'industries/muster/web/pages/list.tsx',
    'editions/sample/src/main.tsx',
    'editions/sample/index.html',
    'services/vermittler/src/worker.ts',
    'editions/sample/public/sw.js',
  ])('takes %s', (path) => {
    expect(isShippedSource(path)).toBe(true);
  });

  it.each([
    // tests and their helpers
    'platform/storage/test/memory-storage.test.ts',
    'platform/storage/src/memory-storage.test.ts',
    'editions/sample/e2e/start.spec.ts',
    'industries/muster/core/tests/fixtures.ts',
    // configuration and build scripts of a package
    'platform/storage/vitest.config.ts',
    'editions/sample/vite.config.ts',
    'editions/sample/scripts/stamp.mjs',
    'platform/web-ui/web/globals.d.ts',
    // the test helpers name every kind in order to find it
    'platform/testing/src/side-effects.ts',
    // what is no code
    'platform/storage/api.md',
    'platform/storage/package.json',
    'editions/sample/public/icon.svg',
    // what is never shipped
    'tools/src/git.ts',
    'tools/check.mjs',
    'docs/nebenwirkungen.md',
    'eslint.config.js',
    'platform/README.ts',
  ])('leaves out %s', (path) => {
    expect(isShippedSource(path)).toBe(false);
  });

  it('gives the shipped files as sources, with their text as code', () => {
    const files = [
      file('platform/core/src/money.ts', 'export const one = 1;\n'),
      file('platform/core/test/money.test.ts', 'fetch(url);\n'),
      file('docs/plan.md', 'Plan\n'),
    ];
    expect(shippedSources(files)).toEqual([
      { path: 'platform/core/src/money.ts', code: 'export const one = 1;\n' },
    ]);
  });
});

describe('sideEffectGuardProblems', () => {
  it('finds nothing where the code does nothing outside itself', () => {
    const files = [file('platform/core/src/money.ts', 'export const one = 1;\n')];
    expect(sideEffectGuardProblems({ files, register: register() })).toEqual([]);
  });

  it('finds nothing where every side effect has its row', () => {
    const files = [file('platform/web-data/src/db.ts', "indexedDB.open('sample');\n")];
    expect(sideEffectGuardProblems({ files, register: register(DATABASE) })).toEqual([]);
  });

  it('fails without a register', () => {
    expect(sideEffectGuardProblems({ files: [], register: undefined }).map(formatProblem)).toEqual([
      `${SIDE_EFFECTS_DOCUMENT}: The register of side effects is missing, so no code can be checked against it`,
    ]);
  });

  it('names a side effect in shipped code that has no row, at its first file', () => {
    const files = [
      file('platform/web-ui/web/print.tsx', 'window.print();\n'),
      file('editions/sample/src/main.tsx', 'window.print();\n'),
    ];
    const problems = sideEffectGuardProblems({ files, register: register(DATABASE) });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatchObject({ path: 'platform/web-ui/web/print.tsx', line: 0 });
    expect(problems[0]?.message).toContain(
      '`window.print` in platform/web-ui/web/print.tsx, editions/sample/src/main.tsx',
    );
  });

  it('names a request to a server that the product owner has not decided', () => {
    const files = [file('editions/sample/src/sync.ts', 'await fetch(url);\n')];
    const ordinary = '| SE-02 | Abruf | `fetch(` | `editions/sample` | ja | ADR-0009 | geplant |';
    const problems = sideEffectGuardProblems({ files, register: register(DATABASE, ordinary) });
    expect(problems.map(({ path, line }) => [path, line])).toEqual([
      // The row itself lacks the decision, and the code has no row that carries one.
      [SIDE_EFFECTS_DOCUMENT, 6],
      ['editions/sample/src/sync.ts', 0],
    ]);

    const decided =
      '| SE-02 | Abruf | `fetch(` | `editions/sample` | ja | Alban, 17.11.2026, ADR-0012 | geplant |';
    expect(sideEffectGuardProblems({ files, register: register(DATABASE, decided) })).toEqual([]);
  });

  it('does not read tests, tools and comments', () => {
    const files = [
      file('platform/core/test/money.test.ts', 'await fetch(url);\n'),
      file('tools/src/download.ts', 'await fetch(url);\n'),
      file('platform/core/src/money.ts', '// Never fetch(url) here.\nexport const one = 1;\n'),
      file('platform/testing/src/side-effects.ts', 'const pattern = /fetch(/;\n'),
    ];
    expect(sideEffectGuardProblems({ files, register: register() })).toEqual([]);
  });

  it('names what is wrong with the register at its row', () => {
    const broken =
      '| SE-02 | Druck | `window.print` | `platform/web-ui` | vielleicht | ADR-0009 | bald |';
    const problems = sideEffectGuardProblems({ files: [], register: register(DATABASE, broken) });
    expect(problems.map(formatProblem)).toEqual([
      `${SIDE_EFFECTS_DOCUMENT}:6: SE-02: «Daten verlassen das Gerät?» must start with «ja» or «nein».`,
      `${SIDE_EFFECTS_DOCUMENT}:6: SE-02: «Seit» must be a date TT.MM.JJJJ or «geplant».`,
    ]);
  });

  it('names a register without a table, at the file', () => {
    const problems = sideEffectGuardProblems({ files: [], register: '# Nebenwirkungen\n' });
    expect(problems.map(formatProblem)).toEqual([
      `${SIDE_EFFECTS_DOCUMENT}: The register holds no table that starts with «Kennung».`,
    ]);
  });
});

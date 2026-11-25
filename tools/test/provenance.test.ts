import { describe, expect, it } from 'vitest';
import {
  canCarryHeader,
  GENERATED_END,
  GENERATED_START,
  isOriginHeader,
  MANUAL_END,
  MANUAL_START,
  parseOriginHeader,
  PROVENANCE_DOCUMENT,
  provenanceProblems,
  provenanceRows,
  readOrigins,
  renderGenerated,
  updateGenerated,
} from '../src/provenance.ts';
import type { RepoFile } from '../src/repo-files.ts';

const file = (path: string, text: string): RepoFile => ({ path, text });

const UNCHANGED = '// Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 — unchanged';
const ADAPTED =
  '// Origin: BanioX/Randen packages/core/src/model/primitives.ts @ e0f0907 — adapted: units and food fields left out';

describe('parseOriginHeader', () => {
  it('reads an unchanged file', () => {
    expect(parseOriginHeader(UNCHANGED)).toEqual({
      repo: 'BanioX/Randen',
      path: 'packages/core/src/money.ts',
      commit: 'e0f0907',
      kind: 'unchanged',
      what: '',
    });
  });

  it('reads an adapted file with what was changed', () => {
    expect(parseOriginHeader(ADAPTED)).toEqual({
      repo: 'BanioX/Randen',
      path: 'packages/core/src/model/primitives.ts',
      commit: 'e0f0907',
      kind: 'adapted',
      what: 'units and food fields left out',
    });
  });

  it('reads another repository of the same owner and a full commit', () => {
    const line =
      '// Origin: BanioX/Rettich apps/web/src/private-ideas.test.ts @ 0ac1fd2d5c7b9e8f1a2b3c4d5e6f708192a3b4c5 — adapted: a — b: c';
    expect(parseOriginHeader(line)).toMatchObject({
      repo: 'BanioX/Rettich',
      commit: '0ac1fd2d5c7b9e8f1a2b3c4d5e6f708192a3b4c5',
      what: 'a — b: c',
    });
  });

  it('refuses everything that is not exactly the header', () => {
    for (const line of [
      '// Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907',
      '// Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 —',
      '// Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 — copied',
      '// Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 — unchanged, mostly',
      '// Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 — unchanged ',
      '// Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 — adapted',
      '// Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 — adapted:',
      '// Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 — adapted: ',
      '// Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 — adapted: imports ',
      '// Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 - unchanged',
      '// Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 – unchanged',
      '// Origin: BanioX/Randen packages/core/src/money.ts @ e0f09 — unchanged',
      '// Origin: BanioX/Randen packages/core/src/money.ts @ E0F0907 — unchanged',
      '// Origin: BanioX/Randen packages/core/src/money.ts @ main — unchanged',
      '// Origin: BanioX/Randen packages/core/src/money.ts e0f0907 — unchanged',
      '// Origin: BanioX/Randen packages/core/src/my money.ts @ e0f0907 — unchanged',
      '// Origin: BanioX/Randen @ e0f0907 — unchanged',
      '// Origin: Randen packages/core/src/money.ts @ e0f0907 — unchanged',
      '// Origin: Jemand/Randen packages/core/src/money.ts @ e0f0907 — unchanged',
      '// origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 — unchanged',
      '//Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 — unchanged',
      ' // Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 — unchanged',
      '/* Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 — unchanged */',
      '# Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 — unchanged',
      '',
    ]) {
      expect(parseOriginHeader(line), line).toBeUndefined();
      expect(isOriginHeader(line), line).toBe(false);
    }
    expect(isOriginHeader(UNCHANGED)).toBe(true);
    expect(isOriginHeader(ADAPTED)).toBe(true);
  });
});

describe('canCarryHeader', () => {
  it('is true for files that can start with a line comment', () => {
    for (const path of ['a.ts', 'a.tsx', 'a.js', 'a.jsx', 'a.mjs', 'a.cjs', 'a.mts', 'a.cts']) {
      expect(canCarryHeader(path), path).toBe(true);
    }
    for (const path of ['a.json', 'a.md', 'a.yaml', '.gitignore', 'tsconfig', 'a.ts.md', 'ats']) {
      expect(canCarryHeader(path), path).toBe(false);
    }
  });
});

describe('readOrigins', () => {
  it('reads the header at the start of a file', () => {
    expect(readOrigins(file('platform/core/src/money.ts', `${UNCHANGED}\nexport {};\n`))).toEqual({
      rows: [
        {
          file: 'platform/core/src/money.ts',
          repo: 'BanioX/Randen',
          path: 'packages/core/src/money.ts',
          commit: 'e0f0907',
          kind: 'unchanged',
          what: '',
        },
      ],
      problems: [],
    });
  });

  it('reads one line per source, also after a line for the shell and with Windows line ends', () => {
    const text = ['#!/usr/bin/env node', UNCHANGED, ADAPTED, '', 'export {};', ''].join('\r\n');
    const { rows, problems } = readOrigins(file('tools/x.mjs', text));
    expect(rows.map((row) => row.path)).toEqual([
      'packages/core/src/money.ts',
      'packages/core/src/model/primitives.ts',
    ]);
    expect(problems).toEqual([]);
  });

  it('has nothing to say about a file without a header', () => {
    const text = '/** Origin of the coordinates: the top left corner. */\nexport {};\n';
    expect(readOrigins(file('platform/core/src/a.ts', text))).toEqual({ rows: [], problems: [] });
  });

  it('reports a malformed header with its line, wherever it stands', () => {
    const text = [
      '// Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907',
      'export {};',
      '  //origin : somewhere',
    ].join('\n');
    const { rows, problems } = readOrigins(file('platform/core/src/money.ts', text));
    expect(rows).toEqual([]);
    expect(problems.map(({ line, message }) => ({ line, start: message.slice(0, 27) }))).toEqual([
      { line: 1, start: 'malformed provenance header' },
      { line: 3, start: 'malformed provenance header' },
    ]);
  });

  it('reports a header that is not at the start of the file', () => {
    for (const before of ['', '// A comment first.', "import { a } from './a';"]) {
      const { rows, problems } = readOrigins(
        file('platform/core/src/money.ts', [before, UNCHANGED, 'export {};'].join('\n')),
      );
      expect(rows, before).toEqual([]);
      expect(problems, before).toEqual([
        {
          path: 'platform/core/src/money.ts',
          line: 2,
          message: 'provenance header is not at the start of the file',
        },
      ]);
    }
  });

  it('reports a source that is named twice', () => {
    const { rows, problems } = readOrigins(
      file('platform/core/src/money.ts', [UNCHANGED, UNCHANGED, 'export {};'].join('\n')),
    );
    expect(rows).toHaveLength(1);
    expect(problems).toEqual([
      {
        path: 'platform/core/src/money.ts',
        line: 2,
        message: 'provenance header names BanioX/Randen packages/core/src/money.ts twice',
      },
    ]);
  });
});

describe('provenanceRows', () => {
  it('sorts by file and then by source, whatever the order of the files', () => {
    const files = [
      file('platform/storage/src/ports.ts', `${ADAPTED}\n${UNCHANGED}\n`),
      file('platform/core/src/money.ts', `${UNCHANGED}\n`),
      file('platform/core/src/Money.ts', `${UNCHANGED}\n`),
      file('platform/core/src/new.ts', 'export {};\n'),
    ];
    const sorted = provenanceRows(files).rows.map((row) => `${row.file} ${row.path}`);
    expect(sorted).toEqual([
      'platform/core/src/Money.ts packages/core/src/money.ts',
      'platform/core/src/money.ts packages/core/src/money.ts',
      'platform/storage/src/ports.ts packages/core/src/model/primitives.ts',
      'platform/storage/src/ports.ts packages/core/src/money.ts',
    ]);
    expect(
      provenanceRows([...files].reverse()).rows.map((row) => `${row.file} ${row.path}`),
    ).toEqual(sorted);
  });

  it('reads source files only: a document may show the header as an example', () => {
    const files = [
      file('docs/herkunft.md', `${UNCHANGED}\n// Origin: nonsense\n`),
      file('platform/core/package.json', `${UNCHANGED}\n`),
    ];
    expect(provenanceRows(files)).toEqual({ rows: [], problems: [] });
  });

  it('collects the problems of all files', () => {
    const files = [
      file('platform/core/src/a.ts', '// Origin: BanioX/Randen a.ts\n'),
      file('platform/core/src/b.ts', `${UNCHANGED}\n`),
      file('platform/core/src/c.ts', '// Origin: copied\n'),
    ];
    const { rows, problems } = provenanceRows(files);
    expect(rows.map((row) => row.file)).toEqual(['platform/core/src/b.ts']);
    expect(problems.map((problem) => problem.path)).toEqual([
      'platform/core/src/a.ts',
      'platform/core/src/c.ts',
    ]);
  });
});

const HEAD = [
  '| Datei der Suite | Quelle | Commit | Art | Was geändert wurde |',
  '| --- | --- | --- | --- | --- |',
];

/** A made-up document with both tables; the generated one starts empty. */
const documentWith = (manual: string[]) =>
  [
    '# Herkunft',
    '',
    'Text davor.',
    '',
    GENERATED_START,
    GENERATED_END,
    '',
    'Text dazwischen.',
    '',
    MANUAL_START,
    ...HEAD,
    ...manual,
    MANUAL_END,
    '',
    'Text danach.',
    '',
  ].join('\n');

describe('the generated table', () => {
  const { rows } = provenanceRows([
    file('platform/core/src/money.ts', `${UNCHANGED}\n`),
    file('platform/core/src/primitives.ts', `${ADAPTED}\n`),
  ]);

  it('has one row per source, in German, with what was changed', () => {
    expect(renderGenerated(rows).split('\n')).toEqual([
      ...HEAD,
      '| `platform/core/src/money.ts` | BanioX/Randen `packages/core/src/money.ts` | `e0f0907` | unverändert | – |',
      '| `platform/core/src/primitives.ts` | BanioX/Randen `packages/core/src/model/primitives.ts` | `e0f0907` | angepasst | units and food fields left out |',
    ]);
  });

  it('keeps a bar in the text from breaking the table', () => {
    const [row] = provenanceRows([
      file(
        'tools/a.ts',
        '// Origin: BanioX/Randen scripts/a.mjs @ e0f0907 — adapted: a | b instead of c\n',
      ),
    ]).rows;
    expect(row).toBeDefined();
    expect(renderGenerated(row === undefined ? [] : [row])).toContain('| a \\| b instead of c |');
  });

  it('says so when no file carries a header', () => {
    expect(renderGenerated([])).toBe('_Noch trägt keine Datei einen Herkunftsvermerk._');
  });

  it('is written between the markers and leaves the rest of the document alone', () => {
    const before = documentWith([]);
    const after = updateGenerated(before, rows);
    expect(after.split('\n')).toEqual([
      '# Herkunft',
      '',
      'Text davor.',
      '',
      GENERATED_START,
      ...renderGenerated(rows).split('\n'),
      GENERATED_END,
      ...before.split('\n').slice(6),
    ]);
  });

  it('gives the same text when it is written twice, and shrinks again', () => {
    const once = updateGenerated(documentWith([]), rows);
    expect(updateGenerated(once, rows)).toBe(once);
    expect(updateGenerated(once, rows.slice(0, 1)).split('\n')).toHaveLength(
      once.split('\n').length - 1,
    );
    expect(updateGenerated(updateGenerated(once, []), rows)).toBe(once);
  });

  it('fails when the markers are missing or in the wrong order', () => {
    expect(() => updateGenerated('# Herkunft\n', rows)).toThrow(/needs the lines/);
    expect(() => updateGenerated(`${GENERATED_START}\n`, rows)).toThrow(/needs the lines/);
    expect(() => updateGenerated(`${GENERATED_END}\n${GENERATED_START}\n`, rows)).toThrow(
      /needs the lines/,
    );
    expect(() => updateGenerated(`Text ${GENERATED_START}\n${GENERATED_END}\n`, rows)).toThrow(
      /needs the lines/,
    );
  });
});

describe('provenanceProblems', () => {
  const files = [
    file('platform/core/src/money.ts', `${UNCHANGED}\nexport {};\n`),
    file('platform/core/src/primitives.ts', `${ADAPTED}\nexport {};\n`),
    file('platform/core/src/units.ts', 'export {};\n'),
    file('eslint.config.js', 'export default [];\n'),
  ];
  const paths = [
    ...files.map((entry) => entry.path),
    '.editorconfig',
    'package.json',
    'platform/core/tsconfig.json',
    'platform/storage/tsconfig.json',
    PROVENANCE_DOCUMENT,
  ];
  const MANUAL = [
    '| `.editorconfig` | BanioX/Randen `.editorconfig` | `e0f0907` | unverändert | – |',
    '| `package.json` | BanioX/Randen `package.json` | `e0f0907` | angepasst | Name; Skripte auf `tools/` |',
    '| `platform/*/tsconfig.json` | BanioX/Randen `packages/core/tsconfig.json` | `e0f0907` | angepasst | Node-Typen für die Tests |',
    '| `eslint.config.js` | BanioX/Randen `eslint.config.js` | `e0f0907` | angepasst | Schichten der Plattform |',
  ];
  const upToDate = (manual: string[] = MANUAL) =>
    updateGenerated(documentWith(manual), provenanceRows(files).rows);
  const messages = (document: string | undefined, given = files, existing = paths) =>
    provenanceProblems({ files: given, paths: existing, document }).map(
      (problem) => `${problem.path}:${problem.line}: ${problem.message}`,
    );
  /** The line of the first row of the table kept by hand, in the document of `upToDate`. */
  const firstManualLine = upToDate().split('\n').indexOf(MANUAL_START) + 1 + HEAD.length + 1;

  it('finds nothing in a repository whose document is up to date', () => {
    expect(messages(upToDate())).toEqual([]);
  });

  it('reports a missing document and missing markers', () => {
    expect(messages(undefined)).toEqual(['docs/herkunft.md:0: the file is missing']);
    expect(messages('# Herkunft\n')).toEqual([
      `docs/herkunft.md:0: the lines ${GENERATED_START} and ${GENERATED_END} are missing`,
      `docs/herkunft.md:0: the lines ${MANUAL_START} and ${MANUAL_END} are missing`,
    ]);
  });

  it('reports a generated table that is out of date', () => {
    const outOfDate =
      'docs/herkunft.md:0: the generated table is out of date: run «node tools/provenance.mjs»';
    expect(messages(documentWith(MANUAL))).toEqual([outOfDate]);
    const more = [...files, file('platform/core/src/ids.ts', `${UNCHANGED}\n`)];
    expect(messages(upToDate(), more, [...paths, 'platform/core/src/ids.ts'])).toEqual([outOfDate]);
    expect(messages(upToDate().replace('unverändert | – |', 'angepasst | x |'))).toEqual([
      outOfDate,
    ]);
  });

  it('reports a generated row whose file is gone', () => {
    const gone = paths.filter((path) => path !== 'platform/core/src/money.ts');
    expect(messages(upToDate(), files.slice(1), gone)).toEqual([
      'docs/herkunft.md:0: the generated table is out of date: run «node tools/provenance.mjs»',
      'docs/herkunft.md:8: names a file that does not exist: platform/core/src/money.ts',
    ]);
  });

  it('reports a malformed header next to everything else', () => {
    const broken = [
      ...files,
      file('platform/core/src/ids.ts', '// Origin: BanioX/Randen ids.ts\n'),
    ];
    expect(messages(upToDate(), broken, [...paths, 'platform/core/src/ids.ts'])).toEqual([
      expect.stringMatching(/^platform\/core\/src\/ids\.ts:1: malformed provenance header/),
    ]);
  });

  it('reports a row kept by hand that names a file that does not exist', () => {
    const row = '| `.nvmrc` | BanioX/Randen `.nvmrc` | `e0f0907` | unverändert | – |';
    expect(messages(upToDate([row, ...MANUAL]))).toEqual([
      `docs/herkunft.md:${firstManualLine}: names a file that does not exist: .nvmrc`,
    ]);
    const pattern =
      '| `industries/*/tsconfig.json` | BanioX/Randen `a.json` | `e0f0907` | unverändert | – |';
    expect(messages(upToDate([pattern]))).toEqual([
      `docs/herkunft.md:${firstManualLine}: names a file that does not exist: industries/*/tsconfig.json`,
    ]);
  });

  it('lets a star stand for one part of a path, not for several', () => {
    const one =
      '| `platform/*/tsconfig.json` | BanioX/Randen `a.json` | `e0f0907` | unverändert | – |';
    const deep = '| `*/tsconfig.json` | BanioX/Randen `a.json` | `e0f0907` | unverändert | – |';
    expect(messages(upToDate([one]))).toEqual([]);
    expect(messages(upToDate([deep]))).toEqual([
      `docs/herkunft.md:${firstManualLine}: names a file that does not exist: */tsconfig.json`,
    ]);
  });

  it('reports a row that does not say unchanged or adapted, or not what was changed', () => {
    const rows = [
      '| `.editorconfig` | BanioX/Randen `.editorconfig` | `e0f0907` | kopiert | – |',
      '| `.editorconfig` | BanioX/Randen `.editorconfig` | `e0f0907` |  | – |',
      '| `package.json` | BanioX/Randen `package.json` | `e0f0907` | angepasst | – |',
      '| `package.json` | BanioX/Randen `package.json` | `e0f0907` | angepasst |  |',
    ];
    expect(messages(upToDate(rows))).toEqual([
      `docs/herkunft.md:${firstManualLine}: .editorconfig: says neither «unverändert» nor «angepasst»`,
      `docs/herkunft.md:${firstManualLine + 1}: .editorconfig: says neither «unverändert» nor «angepasst»`,
      `docs/herkunft.md:${firstManualLine + 2}: package.json: an adapted file says what was changed`,
      `docs/herkunft.md:${firstManualLine + 3}: package.json: an adapted file says what was changed`,
    ]);
  });

  it('reports a row without a proper source or commit', () => {
    const rows = [
      '| `.editorconfig` | Randen | `e0f0907` | unverändert | – |',
      '| `.editorconfig` | BanioX/Randen `.editorconfig` | e0f0907 | unverändert | – |',
      '| `.editorconfig` | BanioX/Randen `.editorconfig` | `main` | unverändert | – |',
    ];
    expect(messages(upToDate(rows))).toEqual([
      `docs/herkunft.md:${firstManualLine}: .editorconfig: the source is written «BanioX/<Repo> \`<path>\`»`,
      `docs/herkunft.md:${firstManualLine + 1}: .editorconfig: the commit is 7 to 40 hex digits in backticks`,
      `docs/herkunft.md:${firstManualLine + 2}: .editorconfig: the commit is 7 to 40 hex digits in backticks`,
    ]);
  });

  it('reports a row that is not a row of five cells with a path first', () => {
    const rows = [
      '| `.editorconfig` | BanioX/Randen `.editorconfig` | `e0f0907` | unverändert |',
      '| .editorconfig | BanioX/Randen `.editorconfig` | `e0f0907` | unverändert | – |',
    ];
    expect(messages(upToDate(rows))).toEqual([
      `docs/herkunft.md:${firstManualLine}: a row has five cells, the first a path in backticks`,
      `docs/herkunft.md:${firstManualLine + 1}: a row has five cells, the first a path in backticks`,
    ]);
  });

  it('reads every line of a table without its head as a row, and reports the missing head', () => {
    // Before, the first two lines of a table were passed over as its head, whatever they said.
    const rows = [
      '| `.nvmrc` | BanioX/Randen `.nvmrc` | `e0f0907` | unverändert | – |',
      '| `package.json` | BanioX/Randen `package.json` | `e0f0907` | kopiert | – |',
      ...MANUAL,
    ];
    const headless = upToDate(rows)
      .split('\n')
      .filter((line, index, lines) => {
        const start = lines.indexOf(MANUAL_START);
        return index <= start || index > start + HEAD.length;
      })
      .join('\n');
    const firstLine = headless.split('\n').indexOf(MANUAL_START) + 2;
    expect(messages(headless)).toEqual([
      `docs/herkunft.md:${firstLine}: the table starts with its head: ${HEAD[0]}`,
      `docs/herkunft.md:${firstLine}: names a file that does not exist: .nvmrc`,
      `docs/herkunft.md:${firstLine + 1}: package.json: says neither «unverändert» nor «angepasst»`,
    ]);
  });

  it('has nothing to say about a table kept by hand that is still empty', () => {
    const empty = upToDate([])
      .split('\n')
      .filter((line, index, lines) => index < lines.indexOf(MANUAL_START) || !HEAD.includes(line))
      .join('\n');
    expect(empty).toContain(`${MANUAL_START}\n${MANUAL_END}`);
    expect(messages(empty)).toEqual([]);
  });

  it('reports a path written in a way the patterns of the tools do not know', () => {
    const rows = [
      '| `platform/{core,storage}/tsconfig.json` | BanioX/Randen `a.json` | `e0f0907` | unverändert | – |',
      '| `/package.json` | BanioX/Randen `package.json` | `e0f0907` | unverändert | – |',
    ];
    expect(messages(upToDate(rows))).toEqual([
      `docs/herkunft.md:${firstManualLine}: the path «platform/{core,storage}/tsconfig.json» uses «{», which this matcher does not understand (only «*» and «**»)`,
      `docs/herkunft.md:${firstManualLine + 1}: the path «/package.json» starts with a slash: a pattern is a path from the root of the repository`,
    ]);
  });

  it('reads an escaped bar as part of a cell', () => {
    const row =
      '| `package.json` | BanioX/Randen `package.json` | `e0f0907` | angepasst | a \\| b |';
    expect(messages(upToDate([row]))).toEqual([]);
  });

  it('reports a file that carries its own header and is listed by hand as well', () => {
    const row =
      '| `platform/core/src/money.ts` | BanioX/Randen `packages/core/src/money.ts` | `e0f0907` | unverändert | – |';
    expect(messages(upToDate([row]))).toEqual([
      `docs/herkunft.md:${firstManualLine}: platform/core/src/money.ts carries its own header and is listed by hand as well`,
    ]);
  });
});

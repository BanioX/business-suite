import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  BINARY_KINDS,
  formatProblem,
  isBinary,
  linesOf,
  listFiles,
  readFiles,
  readTextFiles,
  REPO_ROOT,
  unreadFileProblems,
} from '../src/repo-files.ts';

/** A made-up repository on disk: what is ours, what is installed, what is built. */
const FIXTURE: Record<string, string | Uint8Array> = {
  'README.md': '# Muster\n',
  '.editorconfig': 'root = true\n',
  LICENSE: 'Alle Rechte vorbehalten.\n',
  'docs/plan.md': 'Plan\n',
  'platform/core/src/index.ts': 'export const one = 1;\n',
  'platform/core/package.json': '{}\n',
  'platform/core/node_modules/zod/index.js': 'installed\n',
  'platform/core/dist/index.js': 'built\n',
  'platform/core/tsconfig.tsbuildinfo': '{"built":true}\n',
  'node_modules/vitest/index.js': 'installed\n',
  '.git/HEAD': 'ref: refs/heads/main\n',
  'coverage/index.html': '<html></html>\n',
  '.claude/worktrees/agent/README.md': '# Kopie\n',
  '.claude/settings.json': '{}\n',
  'pnpm-lock.yaml': 'lockfileVersion: 9\n',
  'docs/bild.png': new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01, 0x02]),
  'docs/bom.md': '\uFEFF# Mit Marke\n',
  // A document with one stray NUL byte, and one saved in UTF-16: text that reads as binary.
  'docs/kaputt.md': '# Notiz\n\u0000\nmehr Text\n',
  'docs/breit.md': new Uint8Array([0xff, 0xfe, 0x4e, 0x00, 0x6f, 0x00, 0x74, 0x00]),
};

let root: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'repo-files-'));
  for (const [path, content] of Object.entries(FIXTURE)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  symlinkSync(join(root, 'README.md'), join(root, 'docs', 'link.md'));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('listFiles', () => {
  it('lists the files of the repository, sorted, with forward slashes', () => {
    expect(listFiles(root)).toEqual([
      '.claude/settings.json',
      '.editorconfig',
      'LICENSE',
      'README.md',
      'docs/bild.png',
      'docs/bom.md',
      'docs/breit.md',
      'docs/kaputt.md',
      'docs/plan.md',
      'platform/core/package.json',
      'platform/core/src/index.ts',
      'platform/core/tsconfig.tsbuildinfo',
      'pnpm-lock.yaml',
    ]);
  });

  it('skips the Git store, installed packages, build output and copies for subagents', () => {
    const files = listFiles(root);
    for (const skipped of ['.git/', 'node_modules/', '/dist/', 'coverage/', '.claude/worktrees/']) {
      expect(files.filter((path) => path.includes(skipped))).toEqual([]);
    }
  });

  it('does not follow symbolic links', () => {
    expect(listFiles(root)).not.toContain('docs/link.md');
  });

  it('lists only the files below a directory, with paths still from the root', () => {
    expect(listFiles(root, 'platform')).toEqual([
      'platform/core/package.json',
      'platform/core/src/index.ts',
      'platform/core/tsconfig.tsbuildinfo',
    ]);
    expect(listFiles(root, './platform/core/src/')).toEqual(['platform/core/src/index.ts']);
  });

  it('has no files for a directory that does not exist', () => {
    expect(listFiles(root, 'industries')).toEqual([]);
  });
});

describe('readTextFiles', () => {
  it('reads every text file, also dot files and files without an extension', () => {
    const files = readTextFiles(root);
    expect(files.map((file) => file.path)).toEqual([
      '.claude/settings.json',
      '.editorconfig',
      'LICENSE',
      'README.md',
      'docs/bom.md',
      'docs/plan.md',
      'platform/core/package.json',
      'platform/core/src/index.ts',
    ]);
    expect(files.find((file) => file.path === 'LICENSE')?.text).toBe('Alle Rechte vorbehalten.\n');
  });

  it('leaves out binary files, the lockfile and build information', () => {
    const paths = readTextFiles(root).map((file) => file.path);
    expect(paths).not.toContain('docs/bild.png');
    expect(paths).not.toContain('pnpm-lock.yaml');
    expect(paths).not.toContain('platform/core/tsconfig.tsbuildinfo');
  });

  it('removes a byte order mark', () => {
    expect(readTextFiles(root, 'docs').find((file) => file.path === 'docs/bom.md')?.text).toBe(
      '# Mit Marke\n',
    );
  });

  it('reads only below a directory when asked', () => {
    expect(readTextFiles(root, 'platform').map((file) => file.path)).toEqual([
      'platform/core/package.json',
      'platform/core/src/index.ts',
    ]);
  });
});

describe('readFiles', () => {
  it('names the files it takes for binary, so none is left out unseen', () => {
    const { text, binary } = readFiles(root);
    expect(binary).toEqual(['docs/bild.png', 'docs/breit.md', 'docs/kaputt.md']);
    expect(text).toEqual(readTextFiles(root));
    // Every file is in one of the two lists, apart from the two kinds left out by name.
    expect([...text.map((file) => file.path), ...binary].sort()).toEqual(
      listFiles(root).filter((path) => path !== 'pnpm-lock.yaml' && !path.endsWith('.tsbuildinfo')),
    );
    expect(readFiles(root, 'platform').binary).toEqual([]);
  });
});

describe('unreadFileProblems', () => {
  it('lets a picture, a font and a PDF be binary', () => {
    expect(
      unreadFileProblems([
        'docs/bild.png',
        'editions/muster/public/icon-512.PNG',
        'platform/ui/fonts/schrift.woff2',
        'docs/fakten/merkblatt.pdf',
        'favicon.ico',
      ]),
    ).toEqual([]);
  });

  it('reports a text file that was taken for binary: no guard has read it', () => {
    const problems = unreadFileProblems(readFiles(root).binary);
    expect(problems.map(({ path, line }) => ({ path, line }))).toEqual([
      { path: 'docs/breit.md', line: 0 },
      { path: 'docs/kaputt.md', line: 0 },
    ]);
    expect(problems[0]?.message).toContain('the guards take it for binary and do not read it');
  });

  it('reports every kind it does not know, also a file without an extension', () => {
    for (const path of ['platform/core/src/money.ts', 'LICENSE', 'docs/a.png.md', '.env', 'a.']) {
      expect(unreadFileProblems([path]), path).toHaveLength(1);
    }
  });

  it('knows only kinds that hold no text', () => {
    for (const kind of ['md', 'ts', 'json', 'yml', 'svg', 'html', 'txt', 'csv', '']) {
      expect(BINARY_KINDS.has(kind), kind).toBe(false);
    }
  });
});

describe('isBinary', () => {
  it('tells binary from text by a NUL byte', () => {
    expect(isBinary(new Uint8Array([0x00, 0x61]))).toBe(true);
    expect(isBinary(new TextEncoder().encode('Grüezi, Betrieb Muster'))).toBe(false);
    expect(isBinary(new Uint8Array())).toBe(false);
  });
});

describe('linesOf', () => {
  it('splits at line ends of both kinds and has no empty last line', () => {
    expect(linesOf('a\nb\r\nc\n')).toEqual(['a', 'b', 'c']);
    expect(linesOf('a\n\nb')).toEqual(['a', '', 'b']);
    expect(linesOf('')).toEqual([]);
  });
});

describe('formatProblem', () => {
  it('writes the place the way editors link to it', () => {
    expect(formatProblem({ path: 'docs/plan.md', line: 12, message: 'wrong' })).toBe(
      'docs/plan.md:12: wrong',
    );
    expect(formatProblem({ path: 'docs/plan.md', line: 0, message: 'missing' })).toBe(
      'docs/plan.md: missing',
    );
  });
});

describe('REPO_ROOT', () => {
  it('is the root of this repository', () => {
    expect(listFiles(REPO_ROOT)).toContain('tools/src/repo-files.ts');
    expect(listFiles(REPO_ROOT)).toContain('CLAUDE.md');
  });
});

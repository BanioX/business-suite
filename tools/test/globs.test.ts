import { describe, expect, it } from 'vitest';
import { compileGlob, globProblems, matchesGlob } from '../src/globs.ts';

/** Which of the paths a pattern matches. */
function matched(pattern: string, paths: readonly string[]): string[] {
  const glob = compileGlob(pattern);
  return paths.filter((path) => glob.matches(path));
}

const PATHS = [
  'package.json',
  'tsconfig.json',
  'tsconfig.base.json',
  'tsconfigs.json.bak',
  '.gitignore',
  '.github/workflows/ci.yml',
  'api.md',
  'docs/plan.md',
  'docs/branchen/maler.md',
  'docs/branchen/maler-recherche.md',
  'docs/branchen/maler/adr/PNT-0001-titel.md',
  'docs/branchen/malerei.md',
  'platform/core/api.md',
  'platform/core/src/index.ts',
  'platform/core/src/model/fields.ts',
  'platform/storage/src/index.ts',
  'tools/check.mjs',
  'tools/src/globs.ts',
  'toolsmith/readme.md',
];

describe('a literal pattern', () => {
  it('matches exactly its path', () => {
    expect(matched('package.json', PATHS)).toEqual(['package.json']);
    expect(matched('docs/plan.md', PATHS)).toEqual(['docs/plan.md']);
    expect(matched('.github/workflows/ci.yml', PATHS)).toEqual(['.github/workflows/ci.yml']);
  });

  it('matches neither a longer nor a shorter path', () => {
    expect(matchesGlob('docs', 'docs/plan.md')).toBe(false);
    expect(matchesGlob('docs/plan.md', 'docs/plan.md.bak')).toBe(false);
    expect(matchesGlob('docs/plan.md', 'old/docs/plan.md')).toBe(false);
    expect(matchesGlob('tools', 'toolsmith/readme.md')).toBe(false);
  });

  it('tells upper from lower case', () => {
    expect(matchesGlob('CLAUDE.md', 'CLAUDE.md')).toBe(true);
    expect(matchesGlob('CLAUDE.md', 'claude.md')).toBe(false);
  });

  it('takes the characters of a regular expression for themselves', () => {
    expect(matchesGlob('a.b', 'a.b')).toBe(true);
    expect(matchesGlob('a.b', 'axb')).toBe(false);
    expect(matchesGlob('a+b/(c)|d^$', 'a+b/(c)|d^$')).toBe(true);
    expect(matchesGlob('a+b', 'aab')).toBe(false);
    expect(matchesGlob('docs/übersicht für alle.md', 'docs/übersicht für alle.md')).toBe(true);
  });

  it('matches no empty path', () => {
    expect(matchesGlob('package.json', '')).toBe(false);
    expect(matchesGlob('**', '')).toBe(false);
    expect(matchesGlob('*', '')).toBe(false);
  });
});

describe('a star', () => {
  it('stands for any characters inside one segment, also for none', () => {
    expect(matched('tsconfig*.json', PATHS)).toEqual(['tsconfig.json', 'tsconfig.base.json']);
    expect(matched('docs/branchen/maler*', PATHS)).toEqual([
      'docs/branchen/maler.md',
      'docs/branchen/maler-recherche.md',
      'docs/branchen/malerei.md',
    ]);
    expect(matched('*.md', PATHS)).toEqual(['api.md']);
  });

  it('never crosses a slash', () => {
    expect(matched('platform/*/api.md', PATHS)).toEqual(['platform/core/api.md']);
    expect(matched('platform/*', PATHS)).toEqual([]);
    expect(matchesGlob('docs/*', 'docs/branchen/maler.md')).toBe(false);
    expect(matchesGlob('*/*.md', 'docs/branchen/maler.md')).toBe(false);
  });

  it('alone is every file directly at the root, dot files included', () => {
    expect(matched('*', PATHS)).toEqual([
      'package.json',
      'tsconfig.json',
      'tsconfig.base.json',
      'tsconfigs.json.bak',
      '.gitignore',
      'api.md',
    ]);
  });

  it('matches a name that starts with a dot like any other name', () => {
    expect(matchesGlob('*', '.gitignore')).toBe(true);
    expect(matchesGlob('*ignore', '.gitignore')).toBe(true);
    expect(matchesGlob('*/workflows/*.yml', '.github/workflows/ci.yml')).toBe(true);
    expect(matchesGlob('.*', '.gitignore')).toBe(true);
    expect(matchesGlob('.*', 'package.json')).toBe(false);
  });

  it('as a whole segment never stands for an empty name', () => {
    expect(matchesGlob('platform/*/api.md', 'platform//api.md')).toBe(false);
    expect(matchesGlob('docs/*', 'docs/')).toBe(false);
  });

  it('can stand several times in one segment', () => {
    expect(matchesGlob('*-*.md', 'maler-recherche.md')).toBe(true);
    expect(matchesGlob('*-*.md', 'maler.md')).toBe(false);
    expect(matchesGlob('a*b*c', 'abc')).toBe(true);
    expect(matchesGlob('a*b*c', 'a1b22c')).toBe(true);
    expect(matchesGlob('a*b*c', 'a1c')).toBe(false);
  });
});

describe('two stars', () => {
  it('at the end stand for everything below a directory', () => {
    expect(matched('tools/**', PATHS)).toEqual(['tools/check.mjs', 'tools/src/globs.ts']);
    expect(matched('platform/core/**', PATHS)).toEqual([
      'platform/core/api.md',
      'platform/core/src/index.ts',
      'platform/core/src/model/fields.ts',
    ]);
    expect(matched('.github/**', PATHS)).toEqual(['.github/workflows/ci.yml']);
  });

  it('at the end stand for what is inside, not for the directory itself', () => {
    expect(matchesGlob('tools/**', 'tools')).toBe(false);
    expect(matchesGlob('industries/*/**', 'industries/README.md')).toBe(false);
    expect(matchesGlob('industries/*/**', 'industries/painting/NAMES.md')).toBe(true);
  });

  it('at the start and in the middle stand for no segment as well', () => {
    expect(matchesGlob('**/api.md', 'api.md')).toBe(true);
    expect(matchesGlob('platform/**/index.ts', 'platform/index.ts')).toBe(true);
    expect(matchesGlob('**/src/**', 'src/index.ts')).toBe(true);
  });

  it('at the start stand for any depth', () => {
    expect(matched('**/api.md', PATHS)).toEqual(['api.md', 'platform/core/api.md']);
    expect(matched('**/src/index.ts', PATHS)).toEqual([
      'platform/core/src/index.ts',
      'platform/storage/src/index.ts',
    ]);
  });

  it('in the middle stand for any number of segments', () => {
    expect(matched('platform/**/*.ts', PATHS)).toEqual([
      'platform/core/src/index.ts',
      'platform/core/src/model/fields.ts',
      'platform/storage/src/index.ts',
    ]);
    expect(matched('platform/*/src/**', PATHS)).toEqual([
      'platform/core/src/index.ts',
      'platform/core/src/model/fields.ts',
      'platform/storage/src/index.ts',
    ]);
  });

  it('alone stand for every path', () => {
    expect(matched('**', PATHS)).toEqual(PATHS);
  });

  it('do not reach into a directory whose name merely starts the same', () => {
    expect(matchesGlob('tools/**', 'toolsmith/readme.md')).toBe(false);
    expect(matchesGlob('docs/branchen/maler/**', 'docs/branchen/malerei.md')).toBe(false);
    expect(matchesGlob('**/api.md', 'platform/core/myapi.md')).toBe(false);
  });

  it('reach into directories that start with a dot', () => {
    expect(matchesGlob('**', '.github/workflows/ci.yml')).toBe(true);
    expect(matchesGlob('**/*.yml', '.github/workflows/ci.yml')).toBe(true);
  });

  it('can stand twice in one pattern', () => {
    expect(matchesGlob('**/src/**', 'platform/core/src/model/fields.ts')).toBe(true);
    expect(matchesGlob('**/src/**', 'src/index.ts')).toBe(true);
    expect(matchesGlob('**/src/**', 'platform/core/test/money.test.ts')).toBe(false);
  });
});

describe('captures', () => {
  it('gives what every star stands for, in the order of the pattern', () => {
    expect(compileGlob('industries/*/**').captures('industries/painting/core/index.ts')).toEqual([
      'painting',
    ]);
    expect(compileGlob('platform/*/src/*.ts').captures('platform/core/src/money.ts')).toEqual([
      'core',
      'money',
    ]);
    expect(compileGlob('branche-*').captures('branche-haustechnik-holz')).toEqual([
      'haustechnik-holz',
    ]);
    expect(compileGlob('tsconfig*.json').captures('tsconfig.json')).toEqual(['']);
  });

  it('gives an empty list for a pattern without a star', () => {
    expect(compileGlob('docs/**').captures('docs/plan.md')).toEqual([]);
    expect(compileGlob('package.json').captures('package.json')).toEqual([]);
  });

  it('gives undefined for a path that does not match', () => {
    expect(compileGlob('industries/*/**').captures('platform/core/src/index.ts')).toBeUndefined();
  });

  it('keeps the pattern as it was written', () => {
    expect(compileGlob('tools/**').pattern).toBe('tools/**');
  });
});

describe('globProblems', () => {
  it('finds no fault with the patterns the registers use', () => {
    for (const pattern of [
      '**',
      '*',
      'package.json',
      'tsconfig*.json',
      '.github/workflows/**',
      'platform/*/**',
      'docs/branchen/maler*',
      '**/api.md',
      'a/**/b/**',
      'docs/übersicht für alle.md',
      'not!negated',
    ]) {
      expect(globProblems(pattern), pattern).toEqual([]);
    }
  });

  it.each([
    ['', 'is empty'],
    ['/docs/**', 'starts with a slash'],
    ['tools/', 'ends with a slash'],
    ['docs//plan.md', 'empty segment'],
    ['./docs/**', '«.» or «..»'],
    ['docs/../platform/**', '«.» or «..»'],
    ['docs/**.md', '«**» inside a segment'],
    ['docs/a**', '«**» inside a segment'],
    ['docs/***', '«**» inside a segment'],
    ['docs/**/**/x', 'repeats «**»'],
    ['docs/?.md', 'uses «?»'],
    ['docs/[a-z].md', 'uses «[»'],
    ['*.{js,ts}', 'uses «{»'],
    ['docs\\plan.md', 'uses «\\»'],
    ['industries/<id>/**', 'uses «<»'],
    ['!docs/**', 'starts with «!»'],
    [' docs/**', 'white space'],
    ['docs/** ', 'white space'],
  ])('finds fault with «%s»: %s', (pattern, message) => {
    expect(globProblems(pattern).join('; ')).toContain(message);
  });

  it('names every fault of a pattern, not only the first', () => {
    expect(globProblems('/docs//?/')).toHaveLength(4);
  });
});

describe('compileGlob', () => {
  it('refuses a malformed pattern and says why', () => {
    expect(() => compileGlob('*.{js,ts}')).toThrow(
      'The pattern «*.{js,ts}» uses «{», which this matcher does not understand',
    );
    expect(() => compileGlob('tools/')).toThrow('write «<directory>/**»');
    expect(() => matchesGlob('', 'package.json')).toThrow('The pattern «» is empty.');
  });
});

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { industryFolders, loadIndustries, manifestOf } from '../src/industries.ts';
import { REPO_ROOT } from '../src/repo-files.ts';

const temporary: string[] = [];
afterEach(() => {
  for (const dir of temporary.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function temporaryDirectory(): string {
  const dir = mkdtempSync(join(tmpdir(), 'onestrand-industries-'));
  temporary.push(dir);
  return dir;
}

function write(root: string, path: string, content = ''): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
}

const SAMPLE = {
  id: 'sample',
  core: 'industries/sample/core',
  entry: 'industries/sample/core/src/index.ts',
};

describe('industryFolders', () => {
  it('finds every industry with a core package, by id, and nothing else', () => {
    const root = temporaryDirectory();
    write(root, 'industries/sample/core/package.json', '{}');
    write(root, 'industries/alpha/core/package.json', '{}');
    // Not industries: no core package, a file, a hidden directory, a package elsewhere.
    write(root, 'industries/notyet/README.md');
    write(root, 'industries/notes.txt');
    write(root, 'industries/.cache/core/package.json', '{}');
    write(root, 'industries/beta/web/package.json', '{}');
    expect(industryFolders(root)).toEqual([
      { id: 'alpha', core: 'industries/alpha/core', entry: 'industries/alpha/core/src/index.ts' },
      SAMPLE,
    ]);
  });

  it('finds none in a repository without industries', () => {
    expect(industryFolders(temporaryDirectory())).toEqual([]);
  });

  it('finds the reference industry in this repository', () => {
    expect(industryFolders(REPO_ROOT).map(({ id }) => id)).toContain('muster');
  });
});

describe('manifestOf', () => {
  const manifest = { kind: 'industry', id: 'sample' };

  it('takes the one export that is the industry of the directory', () => {
    expect(manifestOf({ MUSTER: 'sample', sample: manifest, other: {} }, SAMPLE)).toBe(manifest);
  });

  it.each([
    ['no manifest', { sample: { kind: 'module', id: 'sample' } }, 0],
    ['a manifest of another id', { other: { kind: 'industry', id: 'other' } }, 0],
    ['two manifests', { one: manifest, two: { ...manifest } }, 2],
    ['no exports at all', undefined, 0],
  ])('refuses an entry with %s', (_what, exports, count) => {
    expect(() => manifestOf(exports, SAMPLE)).toThrow(
      `${SAMPLE.entry} must export exactly one manifest made by defineIndustry with the id "sample", found ${String(count)}`,
    );
  });
});

describe('loadIndustries', () => {
  it('runs the entry of every industry and takes its manifest', async () => {
    const root = temporaryDirectory();
    write(root, 'industries/sample/core/package.json', '{}');
    write(
      root,
      SAMPLE.entry,
      "export const sample = { kind: 'industry', id: 'sample', tables: [], contract: {}, events: [], catalog: {}, rights: {}, ruleSets: [] };\n",
    );
    const loaded = await loadIndustries(root);
    expect(loaded).toEqual([
      {
        folder: SAMPLE,
        manifest: {
          kind: 'industry',
          id: 'sample',
          tables: [],
          contract: {},
          events: [],
          catalog: {},
          rights: {},
          ruleSets: [],
        },
      },
    ]);
  });

  it('fails for an industry whose entry exports no manifest', async () => {
    const root = temporaryDirectory();
    write(root, 'industries/sample/core/package.json', '{}');
    write(root, SAMPLE.entry, 'export const nothing = 1;\n');
    await expect(loadIndustries(root)).rejects.toThrow('must export exactly one manifest');
  });
});

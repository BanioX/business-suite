import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  STEPS,
  changedPaths,
  isDocs,
  planCheck,
  planEverything,
  readWorkspace,
  vitestProject,
  withDependents,
  workspaceGraph,
  workspacePatterns,
} from '../src/affected.ts';
import type { CheckPlan, PlannedStep, WorkspacePackage } from '../src/affected.ts';
import { fixtureGit as git } from './git-fixture.ts';

/** A made-up workspace: base ← middle ← top, a package on its own, and the tools on top of all. */
function pkg(name: string, dir: string, dependsOn: string[] = []): WorkspacePackage {
  return { name, dir, project: vitestProject(dir), dependsOn };
}
const BASE = pkg('@sample/base', 'platform/base');
const MIDDLE = pkg('@sample/middle', 'platform/middle', ['@sample/base']);
const TOP = pkg('@sample/top', 'platform/top', ['@sample/middle']);
const ALONE = pkg('@sample/alone', 'platform/alone');
const TOOLS = pkg('@sample/tooling', 'tools', ['@sample/base', '@sample/middle', '@sample/top']);
const WORKSPACE = [ALONE, BASE, MIDDLE, TOP, TOOLS];

function plan(...changedPaths: string[]): CheckPlan {
  return planCheck({ changedPaths, packages: WORKSPACE });
}

function actions(checkPlan: CheckPlan): Record<string, PlannedStep['action']> {
  return Object.fromEntries(checkPlan.steps.map(({ step, action }) => [step, action]));
}

function argsOf(checkPlan: CheckPlan, step: string): readonly string[] {
  const planned = checkPlan.steps.find((candidate) => candidate.step === step);
  if (planned?.action !== 'command') {
    throw new Error(`${step} is not narrowed`);
  }
  return planned.args;
}

const EVERYTHING = {
  'licenses:check': 'script',
  'format:check': 'script',
  lint: 'script',
  typecheck: 'script',
  'test:coverage': 'script',
  build: 'script',
  guards: 'script',
};

describe('the steps', () => {
  it('run in the order of the order: cheap ones first, the guards last', () => {
    expect(STEPS).toEqual([
      'licenses:check',
      'format:check',
      'lint',
      'typecheck',
      'test:coverage',
      'build',
      'guards',
    ]);
  });

  it('plain `pnpm check` runs every step as its script', () => {
    const everything = planEverything('no option');
    expect(everything.scope).toBe('everything');
    expect(everything.reason).toBe('no option');
    expect(everything.packages).toEqual([]);
    expect(everything.steps).toEqual(STEPS.map((step) => ({ step, action: 'script' })));
  });
});

describe('isDocs', () => {
  it.each(['docs/fahrplan.md', 'docs/bilder/plan.png', 'README.md', 'LICENSE'])(
    'counts %s as docs',
    (path) => {
      expect(isDocs(path)).toBe(true);
    },
  );

  it.each(['platform/base/api.md', 'tools/README.md', '.github/pull_request_template.md'])(
    'counts the Markdown file %s as docs wherever it lies',
    (path) => {
      expect(isDocs(path)).toBe(true);
    },
  );

  it.each([
    'platform/base/src/index.ts',
    'platform/base/docs/example.ts',
    'docs.ts',
    'LICENSE.txt',
    'licenses/LICENSE',
    'notes.mdx',
    'package.json',
  ])('does not count %s as docs', (path) => {
    expect(isDocs(path)).toBe(false);
  });
});

describe('planCheck: only docs changed', () => {
  it('skips lint, typecheck, tests and build, and still runs licences, format and guards', () => {
    const docs = plan('docs/fahrplan.md', 'README.md', 'LICENSE', 'platform/base/api.md');
    expect(docs.scope).toBe('docs');
    expect(docs.reason).toBe('only docs changed');
    expect(docs.packages).toEqual([]);
    expect(docs.steps).toEqual([
      { step: 'licenses:check', action: 'script' },
      { step: 'format:check', action: 'script' },
      { step: 'lint', action: 'skip', reason: 'only docs changed' },
      { step: 'typecheck', action: 'skip', reason: 'only docs changed' },
      { step: 'test:coverage', action: 'skip', reason: 'only docs changed' },
      { step: 'build', action: 'skip', reason: 'only docs changed' },
      { step: 'guards', action: 'script' },
    ]);
  });

  it('holds for a Markdown file inside the tools, the registers and the CI directory', () => {
    expect(plan('tools/README.md', 'registry/README.md', '.github/CODEOWNERS.md').scope).toBe(
      'docs',
    );
  });
});

describe('planCheck: something concerns the whole repository', () => {
  it.each([
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'eslint.config.js',
    'vitest.config.ts',
    'tsconfig.base.json',
    '.prettierrc.json',
    '.nvmrc',
    'tools/check.mjs',
    'tools/src/affected.ts',
    'tools/test/affected.test.ts',
    'tools/guards/names.guard.test.ts',
    'registry/owners.json',
    '.github/workflows/ci.yml',
  ])('runs everything when %s changed', (path) => {
    const whole = plan(path);
    expect(whole.scope).toBe('everything');
    expect(whole.reason).toBe(`${path} concerns the whole repository`);
    expect(actions(whole)).toEqual(EVERYTHING);
  });

  it('runs everything for a path that no workspace package owns', () => {
    expect(plan('industries/sample/src/index.ts').scope).toBe('everything');
    expect(plan('scripts/release.mjs').scope).toBe('everything');
  });

  it('does not take a directory with a similar name for a package', () => {
    // «platform/basement» starts with «platform/base», but it is not inside it.
    const similar = plan('platform/basement/src/index.ts');
    expect(similar.scope).toBe('everything');
    expect(plan('platform/base').scope).toBe('everything');
  });

  it('runs everything as soon as one path among many is global', () => {
    const mixed = plan(
      'docs/fahrplan.md',
      'platform/base/src/index.ts',
      'pnpm-lock.yaml',
      'registry/names.json',
      'tools/check.mjs',
    );
    expect(mixed.scope).toBe('everything');
    expect(mixed.reason).toBe('pnpm-lock.yaml and 2 more paths concern the whole repository');
    expect(plan('package.json', 'registry/names.json').reason).toBe(
      'package.json and 1 more path concern the whole repository',
    );
  });

  it('runs everything when nothing changed: an empty comparison must not look like a pass', () => {
    for (const nothing of [plan(), plan('', '')]) {
      expect(nothing.scope).toBe('everything');
      expect(nothing.reason).toBe('nothing changed, so there is nothing to narrow down');
      expect(actions(nothing)).toEqual(EVERYTHING);
    }
  });
});

describe('planCheck: only some packages changed', () => {
  it('checks a package on top together with what depends on it, and nothing below', () => {
    const top = plan('platform/top/src/index.ts');
    expect(top.scope).toBe('packages');
    expect(top.reason).toBe('only @sample/top changed');
    expect(top.packages).toEqual(['@sample/top', '@sample/tooling']);
    expect(actions(top)).toEqual({
      'licenses:check': 'script',
      'format:check': 'script',
      lint: 'command',
      typecheck: 'command',
      'test:coverage': 'command',
      build: 'command',
      guards: 'script',
    });
  });

  it('follows the dependencies through every layer above a changed package', () => {
    const base = plan('platform/base/src/money.ts');
    expect(base.packages).toEqual([
      '@sample/base',
      '@sample/middle',
      '@sample/top',
      '@sample/tooling',
    ]);
    expect(base.packages).not.toContain('@sample/alone');
  });

  it('leaves the rest alone when a package without dependents changed', () => {
    expect(plan('platform/alone/test/alone.test.ts').packages).toEqual(['@sample/alone']);
  });

  it('ignores docs next to the code, repeated paths and their order', () => {
    const once = plan('platform/top/src/a.ts', 'platform/alone/src/b.ts');
    const noisy = plan(
      'docs/fahrplan.md',
      'platform/alone/src/b.ts',
      'platform/top/src/a.ts',
      'platform/top/src/a.ts',
      'platform/top/api.md',
    );
    expect(noisy).toEqual(once);
    expect(once.reason).toBe('only @sample/alone, @sample/top changed');
    expect(once.packages).toEqual(['@sample/alone', '@sample/top', '@sample/tooling']);
  });

  it('narrows lint to the directories of the affected packages', () => {
    expect(argsOf(plan('platform/middle/src/x.ts'), 'lint')).toEqual([
      'exec',
      'eslint',
      '--max-warnings',
      '0',
      'platform/middle',
      'platform/top',
      'tools',
    ]);
  });

  it('narrows typecheck and build with pnpm filters', () => {
    const middle = plan('platform/middle/src/x.ts');
    const filters = [
      '--filter',
      '@sample/middle',
      '--filter',
      '@sample/top',
      '--filter',
      '@sample/tooling',
    ];
    expect(argsOf(middle, 'typecheck')).toEqual([...filters, 'run', '--parallel', 'typecheck']);
    expect(argsOf(middle, 'build')).toEqual([...filters, '--if-present', 'run', 'build']);
  });

  it('narrows the tests to the Vitest projects and the coverage to their sources', () => {
    expect(argsOf(plan('platform/middle/src/x.ts'), 'test:coverage')).toEqual([
      'exec',
      'vitest',
      'run',
      '--coverage',
      '--project',
      'middle',
      '--project',
      'top',
      '--project',
      'tooling',
      // Relative to each selected project, not to the repository: see NARROWED.
      '--coverage.include=src/**',
    ]);
  });

  it('checks the core of an industry when it changes, and the industry when the platform below it changes', () => {
    const industry = pkg('@sample-industry/one', 'industries/one/core', ['@sample/top']);
    const packages = [...WORKSPACE, industry];
    const own = planCheck({ changedPaths: ['industries/one/core/src/index.ts'], packages });
    expect(own.scope).toBe('packages');
    expect(own.packages).toEqual(['@sample-industry/one']);
    expect(argsOf(own, 'lint')).toEqual([
      'exec',
      'eslint',
      '--max-warnings',
      '0',
      'industries/one/core',
    ]);
    expect(argsOf(own, 'test:coverage')).toContain('one-core');
    const below = planCheck({ changedPaths: ['platform/base/src/money.ts'], packages });
    expect(below.packages).toContain('@sample-industry/one');
    // The README of an industry is docs; a file beside its parts belongs to no package.
    expect(planCheck({ changedPaths: ['industries/one/README.md'], packages }).scope).toBe('docs');
    expect(planCheck({ changedPaths: ['industries/one/NAMES.ts'], packages }).scope).toBe(
      'everything',
    );
  });

  it('gives a nested package its own files and the outer package the rest', () => {
    const outer = pkg('@sample/outer', 'editions/outer');
    const inner = pkg('@sample/inner', 'editions/outer/app');
    const packages = [outer, inner];
    expect(
      planCheck({ changedPaths: ['editions/outer/app/src/main.ts'], packages }).packages,
    ).toEqual(['@sample/inner']);
    expect(planCheck({ changedPaths: ['editions/outer/config.ts'], packages }).packages).toEqual([
      '@sample/outer',
    ]);
  });

  it('has one entry per step, in order, whatever changed', () => {
    for (const some of [
      plan(),
      plan('docs/a.md'),
      plan('package.json'),
      plan('platform/base/x.ts'),
    ]) {
      expect(some.steps.map(({ step }) => step)).toEqual([...STEPS]);
    }
  });
});

describe('withDependents', () => {
  it('keeps the order of the workspace and adds nothing for an unknown name', () => {
    expect(withDependents(new Set(['@sample/top', '@sample/base']), WORKSPACE)).toEqual([
      BASE,
      MIDDLE,
      TOP,
      TOOLS,
    ]);
    expect(withDependents(new Set(['@sample/unknown']), WORKSPACE)).toEqual([]);
    expect(withDependents(new Set(), WORKSPACE)).toEqual([]);
  });

  it('ends on packages that depend on each other in a circle', () => {
    const one = pkg('@sample/one', 'platform/one', ['@sample/two']);
    const two = pkg('@sample/two', 'platform/two', ['@sample/one']);
    const three = pkg('@sample/three', 'platform/three');
    expect(withDependents(new Set(['@sample/one']), [one, two, three])).toEqual([one, two]);
  });
});

describe('workspaceGraph', () => {
  it('reads names and the dependencies between workspace packages from every dependency field', () => {
    const graph = workspaceGraph([
      {
        dir: 'tools',
        manifest: {
          name: '@sample/tooling',
          devDependencies: { '@sample/base': 'workspace:*', '@sample/top': 'workspace:*' },
        },
      },
      {
        dir: 'platform/top',
        manifest: {
          name: '@sample/top',
          dependencies: { '@sample/middle': 'workspace:*', zod: '^4.0.0' },
          peerDependencies: { '@sample/base': 'workspace:*' },
          optionalDependencies: { '@sample/alone': 'workspace:*' },
        },
      },
      { dir: 'platform/middle', manifest: { name: '@sample/middle', dependencies: {} } },
      { dir: 'platform/base', manifest: { name: '@sample/base' } },
      { dir: 'platform/alone', manifest: { name: '@sample/alone', dependencies: null } },
    ]);
    expect(graph).toEqual([
      { name: '@sample/alone', dir: 'platform/alone', project: 'alone', dependsOn: [] },
      { name: '@sample/base', dir: 'platform/base', project: 'base', dependsOn: [] },
      { name: '@sample/middle', dir: 'platform/middle', project: 'middle', dependsOn: [] },
      {
        name: '@sample/top',
        dir: 'platform/top',
        project: 'top',
        dependsOn: ['@sample/alone', '@sample/base', '@sample/middle'],
      },
      {
        name: '@sample/tooling',
        dir: 'tools',
        project: 'tooling',
        dependsOn: ['@sample/base', '@sample/top'],
      },
    ]);
  });

  it('does not let a package depend on itself', () => {
    const [own] = workspaceGraph([
      {
        dir: 'platform/own',
        manifest: { name: '@sample/own', dependencies: { '@sample/own': '*' } },
      },
    ]);
    expect(own?.dependsOn).toEqual([]);
  });

  it.each([{ version: '1.0.0' }, { name: '' }, { name: 7 }, null, 'text', ['@sample/list']])(
    'refuses a package.json without a name: %j',
    (manifest) => {
      expect(() => workspaceGraph([{ dir: 'platform/odd', manifest }])).toThrow(
        'platform/odd/package.json has no name',
      );
    },
  );

  it('refuses two packages with the same name', () => {
    expect(() =>
      workspaceGraph([
        { dir: 'platform/one', manifest: { name: '@sample/same' } },
        { dir: 'platform/two', manifest: { name: '@sample/same' } },
      ]),
    ).toThrow('two workspace packages are called @sample/same');
  });

  it('names the Vitest project after the directory, and the tools «tooling»', () => {
    expect(vitestProject('platform/core')).toBe('core');
    expect(vitestProject('editions/field/app')).toBe('app');
    expect(vitestProject('tools')).toBe('tooling');
  });

  it('names a part of an industry after the industry and the part: every industry has a core', () => {
    expect(vitestProject('industries/muster/core')).toBe('muster-core');
    expect(vitestProject('industries/muster/web')).toBe('muster-web');
    expect(vitestProject('industries/facility/core')).not.toBe(vitestProject('platform/core'));
    // Only a part directly below an industry: anything else keeps the name of its directory.
    expect(vitestProject('industries/muster')).toBe('muster');
    expect(vitestProject('industries/muster/core/fixtures')).toBe('fixtures');
  });
});

describe('workspacePatterns', () => {
  it('reads the block list, with comments, quotes and the keys after it', () => {
    const yaml = [
      '# The workspace',
      'packages:',
      '  - platform/*',
      '',
      '  # the tools',
      "  - 'tools' # one package",
      '  - "editions/*/app"',
      '',
      'minimumReleaseAge: 4320',
      'onlyBuiltDependencies:',
      '  - sample',
    ].join('\n');
    expect(workspacePatterns(yaml)).toEqual(['platform/*', 'tools', 'editions/*/app']);
  });

  it('reads a list written at the indentation of its key, and Windows line ends', () => {
    expect(workspacePatterns('packages:\r\n- platform/*\r\n- tools\r\nother: 1\r\n')).toEqual([
      'platform/*',
      'tools',
    ]);
  });

  it('reads the one-line form', () => {
    expect(workspacePatterns("packages: ['platform/*', tools] # all\n")).toEqual([
      'platform/*',
      'tools',
    ]);
    expect(workspacePatterns('packages: []\n')).toEqual([]);
  });

  it('reads an empty list', () => {
    expect(workspacePatterns('packages:\nminimumReleaseAge: 1\n')).toEqual([]);
  });

  it.each([
    ['no list at all', 'minimumReleaseAge: 4320\n', 'has no «packages» list'],
    ['a nested key only', 'catalog:\n  packages: 1\n', 'has no «packages» list'],
    ['a scalar instead of a list', 'packages: platform/*\n', 'cannot read «packages: platform/*»'],
    ['an open quote', "packages:\n  - 'platform/*\n", 'cannot read the entry'],
    ['text after a quote', "packages:\n  - 'platform/*' tools\n", 'cannot read the entry'],
    ['a pattern over any depth', 'packages:\n  - platform/**\n', 'is not understood'],
    ['an exclusion', "packages:\n  - 'platform/*'\n  - '!**/test/**'\n", 'is not understood'],
    ['braces', "packages:\n  - '{platform,tools}/*'\n", 'is not understood'],
    ['a path from the current directory', 'packages:\n  - ./platform/*\n', 'is not understood'],
    ['a path out of the repository', 'packages:\n  - ../other/*\n', 'is not understood'],
    ['an empty entry', 'packages:\n  - \n', 'is not understood'],
    ['an entry without anything', 'packages:\n  -\n  - tools\n', 'is not understood'],
    ['a mapping as entry', 'packages:\n  - name: platform\n', 'is not understood'],
    ['an entry over two lines', 'packages:\n  - platform/*\n    tools\n', 'cannot read «tools»'],
    ['a list item glued to its dash', 'packages:\n-tools\n', 'cannot read «-tools»'],
  ])('refuses %s instead of guessing', (_what, yaml, message) => {
    expect(() => workspacePatterns(yaml)).toThrow(message);
  });
});

// --- On disk: a workspace and a git repository, made up in a temporary directory -------------

const temporary: string[] = [];
afterEach(() => {
  for (const dir of temporary.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function temporaryDirectory(): string {
  const dir = mkdtempSync(join(tmpdir(), 'onestrand-affected-'));
  temporary.push(dir);
  return dir;
}

function write(root: string, path: string, content = ''): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
}

function writeManifest(root: string, dir: string, manifest: object): void {
  write(root, `${dir}/package.json`, JSON.stringify(manifest));
}

describe('readWorkspace', () => {
  it('finds the packages that pnpm-workspace.yaml names, with their dependencies', () => {
    const root = temporaryDirectory();
    write(root, 'pnpm-workspace.yaml', 'packages:\n  - platform/*\n  - tools\n  - apps/*/web\n');
    writeManifest(root, '.', { name: 'sample-root' });
    writeManifest(root, 'platform/base', { name: '@sample/base' });
    writeManifest(root, 'platform/top', {
      name: '@sample/top',
      dependencies: { '@sample/base': 'workspace:*' },
    });
    writeManifest(root, 'tools', {
      name: '@sample/tooling',
      devDependencies: { '@sample/top': 'workspace:*' },
    });
    writeManifest(root, 'apps/field/web', { name: '@sample/field-web' });
    // Not packages: no package.json, a file, installed code, a hidden directory, too deep.
    write(root, 'platform/empty/src/index.ts');
    write(root, 'platform/notes.txt');
    writeManifest(root, 'platform/node_modules', { name: 'installed' });
    writeManifest(root, 'platform/.cache', { name: 'hidden' });
    writeManifest(root, 'platform/base/fixtures/inner', { name: 'too-deep' });
    writeManifest(root, 'apps/field', { name: 'not-listed' });

    expect(readWorkspace(root)).toEqual([
      { name: '@sample/field-web', dir: 'apps/field/web', project: 'web', dependsOn: [] },
      { name: '@sample/base', dir: 'platform/base', project: 'base', dependsOn: [] },
      { name: '@sample/top', dir: 'platform/top', project: 'top', dependsOn: ['@sample/base'] },
      { name: '@sample/tooling', dir: 'tools', project: 'tooling', dependsOn: ['@sample/top'] },
    ]);
  });

  it('matches a star inside a name and tolerates a pattern that matches nothing', () => {
    const root = temporaryDirectory();
    write(root, 'pnpm-workspace.yaml', 'packages:\n  - industries/sample-*\n  - editions/*\n');
    writeManifest(root, 'industries/sample-one', { name: '@sample/one' });
    writeManifest(root, 'industries/other', { name: '@sample/other' });
    expect(readWorkspace(root).map(({ dir }) => dir)).toEqual(['industries/sample-one']);
  });

  it('fails when the workspace file is missing', () => {
    expect(() => readWorkspace(temporaryDirectory())).toThrow(/pnpm-workspace\.yaml/);
  });
});

function repository(): string {
  const root = temporaryDirectory();
  git(root, 'init', '--quiet', '--initial-branch=main');
  write(root, '.gitignore', 'node_modules/\ncoverage/\n');
  write(root, 'package.json', '{}');
  write(root, 'docs/plan.md', 'plan\n');
  write(root, 'platform/base/src/index.ts', 'export const base = 1;\n');
  write(root, 'platform/base/src/old.ts', 'export const old = 1;\n');
  write(root, 'platform/top/src/index.ts', 'export const top = 1;\n');
  git(root, 'add', '--all');
  git(root, 'commit', '--quiet', '--message', 'start');
  return root;
}

describe('changedPaths', () => {
  it('finds nothing in a clean working tree', () => {
    const root = repository();
    expect(changedPaths(root, 'main')).toEqual({ base: git(root, 'rev-parse', 'HEAD'), paths: [] });
  });

  it('lists what a branch brings since it left the ref, not what the ref gained meanwhile', () => {
    const root = repository();
    const start = git(root, 'rev-parse', 'HEAD');
    git(root, 'switch', '--quiet', '--create', 'work');
    write(root, 'platform/top/src/index.ts', 'export const top = 2;\n');
    write(root, 'platform/top/src/more.ts', 'export const more = 1;\n');
    git(root, 'add', '--all');
    git(root, 'commit', '--quiet', '--message', 'work on top');
    git(root, 'switch', '--quiet', 'main');
    write(root, 'docs/plan.md', 'a newer plan\n');
    git(root, 'commit', '--quiet', '--all', '--message', 'main moves on');
    git(root, 'switch', '--quiet', 'work');

    expect(changedPaths(root, 'main')).toEqual({
      base: start,
      paths: ['platform/top/src/index.ts', 'platform/top/src/more.ts'],
    });
  });

  it('adds staged, unstaged and untracked changes, and leaves ignored files out', () => {
    const root = repository();
    write(root, 'platform/base/src/index.ts', 'export const base = 2;\n');
    git(root, 'add', 'platform/base/src/index.ts');
    write(root, 'docs/plan.md', 'changed, not staged\n');
    write(root, 'platform/top/src/new file ä.ts', 'export const fresh = 1;\n');
    write(root, 'node_modules/installed/index.js', '');
    write(root, 'coverage/index.html', '');

    expect(changedPaths(root, 'HEAD').paths).toEqual([
      'docs/plan.md',
      'platform/base/src/index.ts',
      'platform/top/src/new file ä.ts',
    ]);
  });

  it('lists a deleted file, and a moved file with both of its names', () => {
    const root = repository();
    rmSync(join(root, 'platform/top/src/index.ts'));
    mkdirSync(join(root, 'platform/moved/src'), { recursive: true });
    renameSync(join(root, 'platform/base/src/old.ts'), join(root, 'platform/moved/src/old.ts'));
    git(root, 'add', '--all');
    git(root, 'commit', '--quiet', '--message', 'move and delete');

    expect(changedPaths(root, 'HEAD~1').paths).toEqual([
      'platform/base/src/old.ts',
      'platform/moved/src/old.ts',
      'platform/top/src/index.ts',
    ]);
  });

  it('accepts a commit id as well as a branch', () => {
    const root = repository();
    const start = git(root, 'rev-parse', 'HEAD');
    write(root, 'platform/base/src/index.ts', 'export const base = 3;\n');
    git(root, 'commit', '--quiet', '--all', '--message', 'change base');
    expect(changedPaths(root, start).paths).toEqual(['platform/base/src/index.ts']);
  });

  it('fails for a ref that does not exist', () => {
    expect(() => changedPaths(repository(), 'origin/main')).toThrow(
      '«origin/main» is not a commit in this clone',
    );
  });

  it('takes a ref that looks like an option for a name, not for an option', () => {
    const root = repository();
    expect(() => changedPaths(root, '--all')).toThrow('«--all» is not a commit in this clone');
    expect(() => changedPaths(root, '--git-dir=/nowhere')).toThrow('is not a commit in this clone');
  });

  it('fails outside a git repository', () => {
    expect(() => changedPaths(temporaryDirectory(), 'main')).toThrow(
      '«main» is not a commit in this clone',
    );
  });

  it('fails where git cannot be started: a missing tool is not «nothing changed»', () => {
    const root = repository();
    vi.stubEnv('PATH', temporaryDirectory());
    try {
      expect(() => changedPaths(root, 'main')).toThrow(
        '«main» is not a commit in this clone (no git,',
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('reads the repository of its directory, whatever a hook exported', () => {
    const root = repository();
    const other = repository();
    write(other, 'platform/top/src/elsewhere.ts', 'export const elsewhere = 1;\n');
    write(root, 'docs/plan.md', 'a better plan\n');
    vi.stubEnv('GIT_DIR', join(other, '.git'));
    vi.stubEnv('GIT_WORK_TREE', other);
    try {
      expect(changedPaths(root, 'main').paths).toEqual(['docs/plan.md']);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('fails when the ref and HEAD share no history', () => {
    const root = repository();
    git(root, 'switch', '--quiet', '--orphan', 'elsewhere');
    git(root, 'commit', '--quiet', '--allow-empty', '--message', 'another beginning');
    expect(() => changedPaths(root, 'main')).toThrow('have no common commit in this clone');
  });
});

// --- The real repository: the conventions the narrowed commands rely on ----------------------

describe('the real workspace', () => {
  const root = fileURLToPath(new URL('../..', import.meta.url));
  const workspace = readWorkspace(root);

  it('is read without a problem and contains the tools, the platform and the industries', () => {
    const names = workspace.map(({ name }) => name);
    expect(names).toContain('@onestrand/tooling');
    expect(names).toContain('@onestrand/core');
    expect(new Set(names).size).toBe(names.length);
    expect(workspace.find(({ dir }) => dir === 'industries/muster/core')).toMatchObject({
      name: '@onestrand-industry/muster',
      project: 'muster-core',
    });
  });

  it('gives every package a Vitest project of its own name', () => {
    const projects = workspace.map(({ project }) => project);
    expect(new Set(projects).size).toBe(projects.length);
  });

  it('checks an industry when a platform package below it changes', () => {
    const affected = withDependents(new Set(['@onestrand/manifest']), workspace);
    expect(affected.map(({ name }) => name)).toContain('@onestrand-industry/muster');
  });

  it('narrows a change of the kit to the kit and what builds on it, with its own Vitest project', () => {
    // The kit (W0-03) is the first React package: jsdom and its own project, `ui`. The device
    // (`@onestrand/web-device`) builds its visible parts with it, so a change of the kit checks it too.
    const plan = planCheck({ changedPaths: ['platform/ui/src/Button.tsx'], packages: workspace });
    expect(plan.scope).toBe('packages');
    expect(plan.packages).toEqual(
      withDependents(new Set(['@onestrand/ui']), workspace).map(({ name }) => name),
    );
    expect(plan.packages).toEqual(
      expect.arrayContaining(['@onestrand/ui', '@onestrand/web-device']),
    );
    expect(plan.packages).not.toContain('@onestrand/core');
    const test = plan.steps.find((step) => step.step === 'test:coverage');
    expect(test).toMatchObject({ action: 'command' });
    expect(test?.action === 'command' ? test.args : []).toEqual(
      expect.arrayContaining(['--project', 'ui', '--coverage.include=src/**']),
    );
    // A change below the kit checks the kit too.
    const below = withDependents(new Set(['@onestrand/i18n']), workspace);
    expect(below.map(({ name }) => name)).toContain('@onestrand/ui');
  });

  it('puts the tools on top of the platform and the platform on top of nothing outside', () => {
    const affected = withDependents(new Set(['@onestrand/core']), workspace);
    expect(affected.map(({ name }) => name)).toContain('@onestrand/tooling');
    const core = workspace.find(({ name }) => name === '@onestrand/core');
    expect(core?.dependsOn).toEqual([]);
  });

  it('names every Vitest project as the narrowed test run expects', () => {
    for (const { dir, project } of workspace) {
      const config = readFileSync(join(root, dir, 'vitest.config.ts'), 'utf8');
      expect(config, `${dir}/vitest.config.ts`).toMatch(new RegExp(`\\bname: '${project}'`));
    }
  });

  it('has the root scripts that the narrowed commands mirror', () => {
    // If one of these changes, change NARROWED in tools/src/affected.ts with it: a narrowed
    // run must apply the same rules as the full one.
    const manifest: unknown = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    expect(manifest).toMatchObject({
      scripts: {
        lint: 'eslint . --max-warnings 0',
        typecheck: 'tsc -p tsconfig.json && pnpm -r --parallel typecheck',
        'test:coverage': 'vitest run --coverage',
        build: 'pnpm -r --if-present run build',
      },
    });
    for (const step of STEPS) {
      expect(manifest).toHaveProperty(['scripts', step]);
    }
  });

  it('measures in the full run the same sources as in a narrowed one: `src` of every package', () => {
    // The narrowed test run counts `src/**` of each affected package. The full run counts what
    // the root vitest.config.ts lists; both must mean the same files, or a package would be
    // measured in one of them only.
    const config = readFileSync(join(root, 'vitest.config.ts'), 'utf8');
    const listed = /coverage:\s*\{[^}]*?\binclude:\s*\[([^\]]*)\]/.exec(config)?.[1] ?? '';
    const patterns = [...listed.matchAll(/'([^']+)'/g)].map((match) => match[1] ?? '');
    expect(patterns.length).toBeGreaterThan(0);
    for (const pattern of patterns) {
      expect(pattern, 'a coverage pattern of the root vitest.config.ts').toMatch(/\/src\/\*\*$/);
    }
    const measured = patterns.map(
      (pattern) => new RegExp(`^${pattern.replace(/\/src\/\*\*$/, '').replaceAll('*', '[^/]+')}$`),
    );
    for (const { dir } of workspace) {
      expect(
        measured.some((shape) => shape.test(dir)),
        `${dir}/src is missing in coverage.include of the root vitest.config.ts`,
      ).toBe(true);
    }
  });
});

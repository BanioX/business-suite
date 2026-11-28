// `pnpm check --affected=<git ref>`: which steps a change needs (order W0-01, step 9).
//
// The decision is a pure function: changed paths + workspace graph → plan (`planCheck`). Reading
// the workspace from disk and the changed paths from git (through tools/src/git.ts) sits at the
// end of this file; running the plan is the job of tools/check.mjs. Node runs this file as it is
// (type stripping), so it uses erasable syntax only.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { git, pathList, resolveCommit } from './git.ts';
import { escapeRegExp } from './globs.ts';

/** The steps of `pnpm check`, cheap ones first. Each is a script of the root package.json. */
export const STEPS = [
  'licenses:check',
  'format:check',
  'lint',
  'typecheck',
  'test:coverage',
  'build',
  'guards',
] as const;

export type StepName = (typeof STEPS)[number];

/** One package of the pnpm workspace, as far as the decision needs it. */
export interface WorkspacePackage {
  /** Name in its package.json, e.g. `@onestrand/core`: what `pnpm --filter` takes. */
  readonly name: string;
  /** Directory relative to the repository root, with `/`, e.g. `platform/core`. */
  readonly dir: string;
  /** Name of its Vitest project (see `vitestProject`). */
  readonly project: string;
  /** Names of the workspace packages it lists in any dependency field. */
  readonly dependsOn: readonly string[];
}

/** What `pnpm check` does with one step. */
export type PlannedStep =
  /** `pnpm run <step>`: the script of the root package.json, over the whole repository. */
  | { readonly step: StepName; readonly action: 'script' }
  /** `pnpm <args>`: the same check, narrowed to the affected packages. */
  | { readonly step: StepName; readonly action: 'command'; readonly args: readonly string[] }
  /** Not run; printed as `<step> skipped (<reason>)` and counted as passed. */
  | { readonly step: StepName; readonly action: 'skip'; readonly reason: string };

export interface CheckPlan {
  /** `everything`: all steps as scripts; `docs`: code steps skipped; `packages`: code steps narrowed. */
  readonly scope: 'everything' | 'docs' | 'packages';
  /** One line for the log: why this scope. */
  readonly reason: string;
  /** The changed packages and every package that depends on them; empty unless the scope is `packages`. */
  readonly packages: readonly string[];
  /** One entry per step of `STEPS`, in that order. */
  readonly steps: readonly PlannedStep[];
}

/**
 * Docs: `docs/**`, every Markdown file, and the licence text. No lint, typecheck, unit test or
 * build reads them, so a change of docs alone skips those steps. Whatever does read docs
 * (forbidden names, the register of side effects, provenance) is a guard, and the guards always
 * run. A unit test that reads a Markdown file would break this rule: make it a guard instead.
 */
export function isDocs(path: string): boolean {
  return path === 'LICENSE' || path.startsWith('docs/') || path.endsWith('.md');
}

/**
 * Directories whose content steers every check, although `tools` is a workspace package of its
 * own: the tools, the registers and the CI. A change there runs everything.
 */
const WHOLE_REPOSITORY = ['tools/', 'registry/', '.github/'] as const;

/**
 * The checks that can be narrowed to some packages, as arguments for pnpm. Each mirrors the
 * script of the same name in the root package.json (tools/test/affected.test.ts pins that), so a
 * narrowed run applies the same rules as a full one.
 *
 * Coverage counts only the sources of the affected packages; otherwise the thresholds would
 * fail on packages whose tests did not run. With `--project`, Vitest reads `coverage.include`
 * relative to the directory of every selected project, not to the repository root (found on
 * Vitest 5.1): `src/**` is the sources of exactly the selected projects, while a path from the
 * root such as `platform/core/src/**` would match nothing and let the thresholds pass on an
 * empty report.
 */
const NARROWED = {
  lint: (affected) => ['exec', 'eslint', '--max-warnings', '0', ...affected.map(({ dir }) => dir)],
  typecheck: (affected) => [...filters(affected), 'run', '--parallel', 'typecheck'],
  'test:coverage': (affected) => [
    'exec',
    'vitest',
    'run',
    '--coverage',
    ...affected.flatMap(({ project }) => ['--project', project]),
    '--coverage.include=src/**',
  ],
  build: (affected) => [...filters(affected), '--if-present', 'run', 'build'],
} satisfies Partial<Record<StepName, (affected: readonly WorkspacePackage[]) => readonly string[]>>;

export type CodeStep = keyof typeof NARROWED;

/**
 * The arguments for pnpm that run one of the steps lint, typecheck, test:coverage and build
 * narrowed to the given packages: what `pnpm check --affected` runs for them, so another runner
 * (`pnpm check:industry`) applies exactly the same rules.
 */
export function narrowedArgs(step: CodeStep, packages: readonly WorkspacePackage[]): string[] {
  return [...NARROWED[step](packages)];
}

/** The steps that look at code only: skipped for docs, narrowed for packages. */
function isCodeStep(step: StepName): step is CodeStep {
  return step in NARROWED;
}

function filters(affected: readonly WorkspacePackage[]): string[] {
  return affected.flatMap(({ name }) => ['--filter', name]);
}

/** Every step as its script over the whole repository: plain `pnpm check`, and the safe answer. */
export function planEverything(reason: string): CheckPlan {
  return {
    scope: 'everything',
    reason,
    packages: [],
    steps: STEPS.map((step) => ({ step, action: 'script' })),
  };
}

/** The package whose directory contains the path; the deepest one if packages are nested. */
function owner(path: string, packages: readonly WorkspacePackage[]): WorkspacePackage | undefined {
  let best: WorkspacePackage | undefined;
  for (const candidate of packages) {
    const inside = path.startsWith(`${candidate.dir}/`);
    if (inside && (best === undefined || candidate.dir.length > best.dir.length)) {
      best = candidate;
    }
  }
  return best;
}

/**
 * The changed packages plus every package that depends on one of them, directly or through
 * others, in the order of `packages`. A change in a lower layer can break every layer above it.
 */
export function withDependents(
  changed: ReadonlySet<string>,
  packages: readonly WorkspacePackage[],
): WorkspacePackage[] {
  const affected = new Set(changed);
  let grew = true;
  while (grew) {
    grew = false;
    for (const candidate of packages) {
      if (!affected.has(candidate.name) && candidate.dependsOn.some((name) => affected.has(name))) {
        affected.add(candidate.name);
        grew = true;
      }
    }
  }
  return packages.filter((candidate) => affected.has(candidate.name));
}

function describe(paths: readonly string[]): string {
  const [first = '', ...more] = paths;
  if (more.length === 0) {
    return `${first} concerns the whole repository`;
  }
  return `${first} and ${more.length} more ${more.length === 1 ? 'path' : 'paths'} concern the whole repository`;
}

/**
 * Decides what a change needs.
 *
 * - Nothing changed: everything. An empty comparison is far more often a wrong ref than a real
 *   «nothing to do», and a check that skips its steps then would look like a pass.
 * - Only docs changed: lint, typecheck, tests and build are skipped.
 * - Something outside the workspace packages changed (root configuration, lockfile, tools,
 *   registers, CI, a directory no package owns): everything.
 * - Otherwise: lint, typecheck, tests and build for the changed packages and their dependents.
 *
 * Licences, format and the guards run over the whole repository in every case.
 */
export function planCheck(input: {
  readonly changedPaths: readonly string[];
  readonly packages: readonly WorkspacePackage[];
}): CheckPlan {
  const paths = [...new Set(input.changedPaths)].filter((path) => path !== '');
  if (paths.length === 0) {
    return planEverything('nothing changed, so there is nothing to narrow down');
  }
  const code = paths.filter((path) => !isDocs(path));
  if (code.length === 0) {
    const reason = 'only docs changed';
    return {
      scope: 'docs',
      reason,
      packages: [],
      steps: STEPS.map((step) =>
        isCodeStep(step) ? { step, action: 'skip', reason } : { step, action: 'script' },
      ),
    };
  }

  const changed = new Set<string>();
  const global: string[] = [];
  for (const path of code) {
    const owning = WHOLE_REPOSITORY.some((prefix) => path.startsWith(prefix))
      ? undefined
      : owner(path, input.packages);
    if (owning === undefined) {
      global.push(path);
    } else {
      changed.add(owning.name);
    }
  }
  if (global.length > 0) {
    return planEverything(describe(global));
  }

  const affected = withDependents(changed, input.packages);
  return {
    scope: 'packages',
    reason: `only ${[...changed].sort().join(', ')} changed`,
    packages: affected.map(({ name }) => name),
    steps: STEPS.map((step) =>
      isCodeStep(step)
        ? { step, action: 'command', args: NARROWED[step](affected) }
        : { step, action: 'script' },
    ),
  };
}

// --- The workspace -------------------------------------------------------------------------

/** A part of an industry: `industries/<id>/<part>`, such as `industries/muster/core`. */
const INDUSTRY_PART = /^industries\/([^/]+)\/([^/]+)$/;

/**
 * The Vitest project of a package: the name of its directory, `tooling` for the tools, and
 * `<id>-<part>` for a part of an industry (`muster-core`), because every industry has a `core`
 * and the name of the directory alone would clash with `platform/core` and with each other (the
 * convention of the `vitest.config.ts` files; tools/test/affected.test.ts pins it against the
 * real ones). A name Vitest does not know makes the narrowed test run fail, never pass.
 */
export function vitestProject(dir: string): string {
  if (dir === 'tools') {
    return 'tooling';
  }
  const industry = INDUSTRY_PART.exec(dir);
  if (industry !== null) {
    return `${industry[1] ?? ''}-${industry[2] ?? ''}`;
  }
  return dir.slice(dir.lastIndexOf('/') + 1);
}

const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Turns the package.json files of the workspace into the graph the decision reads. A dependency
 * counts when its name is a workspace package, whatever the field and the version say: checking
 * one package too many is harmless, one too few is not.
 */
export function workspaceGraph(
  found: readonly { readonly dir: string; readonly manifest: unknown }[],
): WorkspacePackage[] {
  const named = found.map(({ dir, manifest }) => {
    if (!isRecord(manifest) || typeof manifest.name !== 'string' || manifest.name === '') {
      throw new Error(`${dir}/package.json has no name`);
    }
    return { dir, name: manifest.name, manifest };
  });
  const names = new Set<string>();
  for (const { name, dir } of named) {
    if (names.has(name)) {
      throw new Error(`two workspace packages are called ${name} (one of them in ${dir})`);
    }
    names.add(name);
  }
  return named
    .map(({ dir, name, manifest }) => {
      const listed = DEPENDENCY_FIELDS.flatMap((field) => {
        const dependencies = manifest[field];
        return isRecord(dependencies) ? Object.keys(dependencies) : [];
      });
      const dependsOn = [...new Set(listed)].filter((other) => other !== name && names.has(other));
      return { name, dir, project: vitestProject(dir), dependsOn: dependsOn.sort() };
    })
    .sort((a, b) => (a.dir < b.dir ? -1 : a.dir > b.dir ? 1 : 0));
}

/** A pattern this file can expand: path segments of letters, digits, `.`, `_`, `@`, `-` and `*`. */
const SIMPLE_PATTERN = /^[\w.@*-]+(\/[\w.@*-]+)*$/;

/** One entry of a YAML list: a plain or quoted scalar, possibly followed by a comment. */
function scalar(raw: string): string {
  const text = raw.trim();
  const quote = text.startsWith('"') ? '"' : text.startsWith("'") ? "'" : undefined;
  if (quote === undefined) {
    return text.replace(/(^|\s+)#.*$/, '');
  }
  const end = text.indexOf(quote, 1);
  const rest = end === -1 ? undefined : text.slice(end + 1).trim();
  if (rest === undefined || (rest !== '' && !rest.startsWith('#'))) {
    throw new Error(`pnpm-workspace.yaml: cannot read the entry ${text}`);
  }
  return text.slice(1, end);
}

/**
 * The `packages` list of pnpm-workspace.yaml. This reads the small part of YAML that list is
 * written in (a block list or a one-line `[a, b]`) and refuses everything else, as well as
 * patterns it cannot expand (`**`, `!…`, `./…`, braces): a pattern read wrongly would leave a
 * package unchecked, so an unknown form is an error, never a guess.
 */
export function workspacePatterns(yaml: string): string[] {
  const lines = yaml.split(/\r?\n/);
  const start = lines.findIndex((line) => /^packages\s*:/.test(line));
  if (start === -1) {
    throw new Error('pnpm-workspace.yaml has no «packages» list');
  }
  const inline = scalar((lines[start] ?? '').replace(/^packages\s*:/, ''));
  let entries: string[];
  if (inline !== '') {
    if (!inline.startsWith('[') || !inline.endsWith(']')) {
      throw new Error(`pnpm-workspace.yaml: cannot read «packages: ${inline}»`);
    }
    entries = inline
      .slice(1, -1)
      .split(',')
      .map(scalar)
      .filter((entry) => entry !== '');
  } else {
    entries = [];
    for (const line of lines.slice(start + 1)) {
      if (/^\s*(#.*)?$/.test(line)) {
        continue;
      }
      const item = /^\s*-(?:\s+(.*))?$/.exec(line);
      if (item !== null) {
        entries.push(scalar(item[1] ?? ''));
      } else if (/^[^\s-]/.test(line)) {
        break; // The next key of the file ends the list.
      } else {
        throw new Error(`pnpm-workspace.yaml: cannot read «${line.trim()}» in the «packages» list`);
      }
    }
  }
  for (const entry of entries) {
    const odd = entry.split('/').some((segment) => segment.includes('**') || /^\.+$/.test(segment));
    if (!SIMPLE_PATTERN.test(entry) || odd) {
      throw new Error(
        `pnpm-workspace.yaml: the pattern «${entry}» is not understood by tools/src/affected.ts`,
      );
    }
  }
  return entries;
}

/** The directories below `at` that one segment of a pattern matches (`*` stands for any characters). */
function matching(root: string, at: string, segment: string): string[] {
  const shape = new RegExp(`^${segment.split('*').map(escapeRegExp).join('.*')}$`);
  return (
    readdirSync(join(root, at), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name !== 'node_modules')
      // As in a shell, `*` does not reach hidden directories; a segment that names one does.
      .filter((entry) => segment.startsWith('.') || !entry.name.startsWith('.'))
      .filter((entry) => shape.test(entry.name))
      .map((entry) => (at === '' ? entry.name : `${at}/${entry.name}`))
  );
}

/**
 * Reads the workspace from disk: the directories that pnpm-workspace.yaml names and that hold a
 * package.json, with their dependencies on each other. The root package is not part of the
 * list: its files concern the whole repository.
 */
export function readWorkspace(root: string): WorkspacePackage[] {
  const patterns = workspacePatterns(readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8'));
  const dirs = new Set<string>();
  for (const pattern of patterns) {
    let found = [''];
    for (const segment of pattern.split('/')) {
      found = found.flatMap((at) => matching(root, at, segment));
    }
    for (const dir of found) {
      if (existsSync(join(root, dir, 'package.json'))) {
        dirs.add(dir);
      }
    }
  }
  return workspaceGraph(
    [...dirs].map((dir) => ({
      dir,
      manifest: JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf8')) as unknown,
    })),
  );
}

// --- Git -----------------------------------------------------------------------------------

export interface ChangedPaths {
  /** The commit the working tree was compared with: the merge base of the ref and HEAD. */
  readonly base: string;
  /** Paths relative to `root`, with `/`: committed, uncommitted and untracked changes. */
  readonly paths: readonly string[];
}

/**
 * What differs between the working tree and the merge base of `ref` and HEAD: what a pull
 * request would bring, plus what is not committed yet. A moved file counts with both names, a
 * deleted one with its old name, so the package that lost a file is checked too.
 *
 * Throws when the comparison is not possible (no git, no repository, unknown ref, no common
 * history as in a shallow clone): the caller must fail then, not guess.
 */
export function changedPaths(root: string, ref: string): ChangedPaths {
  const target = resolveCommit(root, ref);
  if (target === undefined) {
    throw new Error(
      `«${ref}» is not a commit in this clone (no git, no git repository, a typo, or a branch that was not fetched)`,
    );
  }
  let base: string;
  try {
    base = git(root, ['merge-base', target, 'HEAD']).trim();
  } catch {
    throw new Error(
      `«${ref}» and HEAD have no common commit in this clone (a shallow clone? fetch the full history)`,
    );
  }
  // Both throw when git fails: a list that could not be read is never an empty list.
  const tracked = git(root, [
    'diff',
    '--name-only',
    '--no-renames',
    '--relative',
    '-z',
    base,
    '--',
  ]);
  const untracked = git(root, ['ls-files', '--others', '--exclude-standard', '-z']);
  return {
    base,
    paths: [...new Set([...pathList(tracked), ...pathList(untracked)])].sort(),
  };
}

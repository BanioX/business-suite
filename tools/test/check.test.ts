import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { STEPS } from '../src/affected.ts';

// The runner is tested as it is used: `node tools/check.mjs` in a made-up repository in a
// temporary directory, never against this repository. Some tests let the real pnpm run made-up
// scripts; the others put a made-up pnpm in front of it that records what it is asked to do.

const TOOLS = fileURLToPath(new URL('..', import.meta.url));

/** The pnpm of the fixture must be the one of this repository, or a version manager would fetch another. */
function packageManager(): string {
  const manifest: unknown = JSON.parse(readFileSync(join(TOOLS, '..', 'package.json'), 'utf8'));
  const value: unknown =
    typeof manifest === 'object' && manifest !== null
      ? Reflect.get(manifest, 'packageManager')
      : undefined;
  if (typeof value !== 'string') {
    throw new Error('the root package.json names no packageManager');
  }
  return value;
}

const temporary: string[] = [];
afterEach(() => {
  for (const dir of temporary.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function write(root: string, path: string, content = ''): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
}

function scriptsFor(
  steps: readonly string[],
  command: (step: string) => string,
): Record<string, string> {
  return Object.fromEntries(steps.map((step) => [step, command(step)]));
}

/** A made-up repository with a copy of the runner in `tools/`, as in the real one. */
function fixture(scripts: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'onestrand-check-'));
  temporary.push(root);
  write(
    root,
    'package.json',
    JSON.stringify({
      name: 'sample-root',
      private: true,
      type: 'module',
      packageManager: packageManager(),
      scripts,
    }),
  );
  mkdirSync(join(root, 'tools/src'), { recursive: true });
  copyFileSync(join(TOOLS, 'check.mjs'), join(root, 'tools/check.mjs'));
  copyFileSync(join(TOOLS, 'src/affected.ts'), join(root, 'tools/src/affected.ts'));
  return root;
}

interface Outcome {
  status: number | null;
  stdout: string;
  stderr: string;
  /** The lines of stdout after `=== check ===`: the summary. */
  summary: string[];
  /** What the made-up pnpm was asked to do, one line per call. */
  asked: string[];
}

interface Options {
  /** Put a made-up pnpm in front of the real one. */
  fakePnpm?: boolean;
  /** A call (its arguments, joined by spaces) that the made-up pnpm fails with exit code 4. */
  fail?: string;
  /** A call during which the made-up pnpm is killed. */
  kill?: string;
  /** Run without any pnpm on the PATH. */
  noPnpm?: boolean;
}

function check(root: string, args: readonly string[], options: Options = {}): Outcome {
  const bin = join(root, '.bin');
  const log = join(root, '.asked.log');
  mkdirSync(bin, { recursive: true });
  if (options.fakePnpm === true) {
    writeFileSync(
      join(bin, 'pnpm'),
      [
        '#!/bin/sh',
        `printf '%s\\n' "$*" >> '${log}'`,
        'case "$*" in',
        '  "$FAKE_PNPM_FAIL") exit 4 ;;',
        '  "$FAKE_PNPM_KILL") kill -9 $$ ;;',
        'esac',
        'exit 0',
        '',
      ].join('\n'),
    );
    chmodSync(join(bin, 'pnpm'), 0o755);
  }
  const path = options.noPnpm === true ? bin : `${bin}${delimiter}${process.env.PATH ?? ''}`;
  const result = spawnSync(process.execPath, [join(root, 'tools/check.mjs'), ...args], {
    // Not the repository: the runner must find its root by its own place, not by where it is called.
    cwd: tmpdir(),
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: path,
      FAKE_PNPM_FAIL: options.fail ?? '',
      FAKE_PNPM_KILL: options.kill ?? '',
    },
  });
  const lines = result.stdout.trimEnd().split('\n');
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    summary: lines.slice(lines.indexOf('=== check ===') + 1),
    asked: existsSync(log) ? readFileSync(log, 'utf8').trimEnd().split('\n') : [],
  };
}

const TIMED = /^(\S+) exit=(\d+) \(\d+\.\d s\)$/;

/** `<step> exit=<code> (<seconds> s)` → [step, code], and a skipped step → [step, 'skipped (…)']. */
function results(summary: readonly string[]): [string, string][] {
  return summary.slice(0, -1).map((line) => {
    const timed = TIMED.exec(line);
    if (timed !== null) {
      return [timed[1] ?? '', timed[2] ?? ''];
    }
    const space = line.indexOf(' ');
    return [line.slice(0, space), line.slice(space + 1)];
  });
}

// The runner starts pnpm without a shell, which Windows does not allow for `pnpm.cmd`: there
// every step ends as «could not start» and the check is RED. The made-up pnpm is a shell script.
const posix = process.platform !== 'win32';

describe.skipIf(!posix)('pnpm check with the real pnpm', { timeout: 120_000 }, () => {
  it('runs every step in order and ends GREEN with exit code 0', () => {
    const root = fixture(scriptsFor(STEPS, (step) => `echo ran-${step}`));
    const outcome = check(root, []);

    expect(results(outcome.summary)).toEqual(STEPS.map((step) => [step, '0']));
    expect(outcome.summary.at(-1)).toBe('ALL=GREEN');
    expect(outcome.stdout.trimEnd().split('\n').at(-1)).toBe('ALL=GREEN');
    expect(outcome.status).toBe(0);
    // Every step really ran, in order, and printed its own line right after its output.
    const positions = STEPS.flatMap((step) => [
      outcome.stdout.indexOf(`=== ${step} ===`),
      outcome.stdout.indexOf(`\nran-${step}\n`),
      outcome.stdout.indexOf(`\n${step} exit=0 (`),
    ]);
    expect(positions).not.toContain(-1);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('goes on after a failure, prints every exit code and ends RED with exit code 1', () => {
    const scripts = scriptsFor(STEPS, (step) => `echo ran-${step}`);
    scripts.lint = 'echo ran-lint && exit 3';
    delete scripts.build;
    const outcome = check(fixture(scripts), []);

    expect(results(outcome.summary)).toEqual([
      ['licenses:check', '0'],
      ['format:check', '0'],
      ['lint', '3'],
      ['typecheck', '0'],
      ['test:coverage', '0'],
      ['build', '127'],
      ['guards', '0'],
    ]);
    expect(outcome.summary.at(-1)).toBe('ALL=RED');
    expect(outcome.status).toBe(1);
    expect(outcome.stderr).toContain('check: package.json has no script «build»');
    // The steps after the failures still ran.
    expect(outcome.stdout).toContain('\nran-typecheck\n');
    expect(outcome.stdout).toContain('\nran-guards\n');
    expect(outcome.stdout).not.toContain('ran-build');
  });
});

describe('pnpm check: options', () => {
  it.each([
    [['--e2e'], 'Unknown option: --e2e. Known: --affected=<git ref>'],
    [['--afected=main'], 'Unknown option: --afected=main. Known: --affected=<git ref>'],
    [['--affected'], 'Unknown option: --affected. Known: --affected=<git ref>'],
    [['--affected', 'main'], 'Unknown option: --affected main. Known: --affected=<git ref>'],
    [['--affected=main', 'lint'], 'Unknown option: lint. Known: --affected=<git ref>'],
    [
      ['--affected='],
      '--affected=<git ref> takes exactly one ref, for example --affected=origin/main',
    ],
    [
      ['--affected=main', '--affected=work'],
      '--affected=<git ref> takes exactly one ref, for example --affected=origin/main',
    ],
  ])('refuses %j with exit code 2 and runs nothing', (args, message) => {
    const root = fixture(scriptsFor(STEPS, () => 'exit 0'));
    const outcome = check(root, args, { fakePnpm: true });
    expect(outcome.stderr).toBe(`${message}\nALL=RED\n`);
    expect(outcome.stdout).toBe('');
    expect(outcome.status).toBe(2);
    expect(outcome.asked).toEqual([]);
  });
});

describe.skipIf(!posix)('pnpm check: a step that cannot run', () => {
  it('counts every step as failed when pnpm cannot be started', () => {
    const root = fixture(scriptsFor(STEPS, () => 'exit 0'));
    const outcome = check(root, [], { noPnpm: true });
    expect(results(outcome.summary)).toEqual(STEPS.map((step) => [step, '127']));
    expect(outcome.summary.at(-1)).toBe('ALL=RED');
    expect(outcome.status).toBe(1);
    expect(outcome.stderr).toContain('check: could not start «pnpm run lint»');
  });

  it('counts a step as failed when it is stopped by a signal', () => {
    const root = fixture(scriptsFor(STEPS, () => 'exit 0'));
    const outcome = check(root, [], { fakePnpm: true, kill: 'run typecheck' });
    expect(results(outcome.summary)).toEqual(
      STEPS.map((step) => [step, step === 'typecheck' ? '1' : '0']),
    );
    expect(outcome.stderr).toContain('check: «pnpm run typecheck» was stopped by SIGKILL');
    expect(outcome.summary.at(-1)).toBe('ALL=RED');
    expect(outcome.status).toBe(1);
  });

  it('counts every step as failed when the package.json has no scripts, without asking pnpm', () => {
    const root = fixture({});
    write(root, 'package.json', JSON.stringify({ name: 'sample-root', type: 'module' }));
    const outcome = check(root, [], { fakePnpm: true });
    expect(results(outcome.summary)).toEqual(STEPS.map((step) => [step, '127']));
    expect(outcome.stderr).toContain('check: package.json has no script «licenses:check»');
    expect(outcome.summary.at(-1)).toBe('ALL=RED');
    expect(outcome.status).toBe(1);
    expect(outcome.asked).toEqual([]);
  });
});

/** A git repository with made-up authorship, independent of the configuration of the machine. */
function git(root: string, ...args: string[]): void {
  const result = spawnSync(
    'git',
    [
      '-c',
      'user.name=Person Eins',
      '-c',
      'user.email=person.eins@example.invalid',
      '-c',
      'commit.gpgsign=false',
      '-c',
      'core.hooksPath=/dev/null',
      ...args,
    ],
    { cwd: root, encoding: 'utf8' },
  );
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  }
}

/** The fixture as a workspace under git: base ← top ← tools, and a package on its own. */
function repository(): string {
  const root = fixture(scriptsFor(STEPS, () => 'exit 0'));
  write(root, '.gitignore', '.bin/\n.asked.log\n');
  write(root, 'pnpm-workspace.yaml', 'packages:\n  - platform/*\n  - tools\n');
  write(root, 'docs/plan.md', 'plan\n');
  write(root, 'platform/base/package.json', JSON.stringify({ name: '@sample/base' }));
  write(root, 'platform/base/src/index.ts', 'export const base = 1;\n');
  write(
    root,
    'platform/top/package.json',
    JSON.stringify({ name: '@sample/top', dependencies: { '@sample/base': 'workspace:*' } }),
  );
  write(root, 'platform/top/src/index.ts', 'export const top = 1;\n');
  write(root, 'platform/alone/package.json', JSON.stringify({ name: '@sample/alone' }));
  write(
    root,
    'tools/package.json',
    JSON.stringify({ name: '@sample/tooling', devDependencies: { '@sample/top': 'workspace:*' } }),
  );
  git(root, 'init', '--quiet', '--initial-branch=main');
  git(root, 'add', '--all');
  git(root, 'commit', '--quiet', '--message', 'start');
  return root;
}

const WHOLE = STEPS.map((step) => `run ${step}`);

describe.skipIf(!posix)('pnpm check --affected=<git ref>', () => {
  it('skips lint, typecheck, tests and build when only docs changed', () => {
    const root = repository();
    write(root, 'docs/plan.md', 'a better plan\n');
    write(root, 'platform/base/api.md', 'what the package offers\n');
    const outcome = check(root, ['--affected=main'], { fakePnpm: true });

    expect(outcome.asked).toEqual(['run licenses:check', 'run format:check', 'run guards']);
    expect(results(outcome.summary)).toEqual([
      ['licenses:check', '0'],
      ['format:check', '0'],
      ['lint', 'skipped (only docs changed)'],
      ['typecheck', 'skipped (only docs changed)'],
      ['test:coverage', 'skipped (only docs changed)'],
      ['build', 'skipped (only docs changed)'],
      ['guards', '0'],
    ]);
    expect(outcome.stdout).toMatch(
      /^check: 2 changed paths against main \(merge base [0-9a-f]{7}\): only docs changed\ncheck: lint, typecheck, tests and build skipped\n/,
    );
    expect(outcome.summary.at(-1)).toBe('ALL=GREEN');
    expect(outcome.status).toBe(0);
  });

  it('narrows the four steps to the changed package and what depends on it', () => {
    const root = repository();
    write(root, 'platform/top/src/index.ts', 'export const top = 2;\n');
    write(root, 'platform/top/src/new.ts', 'export const fresh = 1;\n');
    write(root, 'docs/plan.md', 'a better plan\n');
    const outcome = check(root, ['--affected=main'], { fakePnpm: true });

    expect(outcome.asked).toEqual([
      'run licenses:check',
      'run format:check',
      'exec eslint --max-warnings 0 platform/top tools',
      '--filter @sample/top --filter @sample/tooling run --parallel typecheck',
      'exec vitest run --coverage --project top --project tooling --coverage.include=src/**',
      '--filter @sample/top --filter @sample/tooling --if-present run build',
      'run guards',
    ]);
    expect(results(outcome.summary)).toEqual(STEPS.map((step) => [step, '0']));
    expect(outcome.stdout).toContain('check: 3 changed paths against main (merge base ');
    expect(outcome.stdout).toContain('): only @sample/top changed\n');
    expect(outcome.stdout).toContain(
      'check: lint, typecheck, tests and build only for @sample/top, @sample/tooling\n',
    );
    expect(outcome.stdout).toContain('$ pnpm exec eslint --max-warnings 0 platform/top tools\n');
    expect(outcome.status).toBe(0);
  });

  it('compares a branch with the point where it left the ref', () => {
    const root = repository();
    git(root, 'switch', '--quiet', '--create', 'work');
    write(root, 'platform/alone/src/index.ts', 'export const alone = 1;\n');
    git(root, 'add', '--all');
    git(root, 'commit', '--quiet', '--message', 'work on a package');
    git(root, 'switch', '--quiet', 'main');
    write(root, 'package.json', `${readFileSync(join(root, 'package.json'), 'utf8')}\n`);
    git(root, 'commit', '--quiet', '--all', '--message', 'main moves on');
    git(root, 'switch', '--quiet', 'work');
    const outcome = check(root, ['--affected=main'], { fakePnpm: true });

    expect(outcome.asked).toContain('exec eslint --max-warnings 0 platform/alone');
    expect(outcome.asked).toContain('--filter @sample/alone run --parallel typecheck');
    expect(outcome.status).toBe(0);
  });

  it('prints the exit code of a narrowed step and ends RED when it fails', () => {
    const root = repository();
    write(root, 'platform/alone/src/index.ts', 'export const alone = 1;\n');
    const outcome = check(root, ['--affected=main'], {
      fakePnpm: true,
      fail: 'exec eslint --max-warnings 0 platform/alone',
    });
    expect(results(outcome.summary)).toEqual(
      STEPS.map((step) => [step, step === 'lint' ? '4' : '0']),
    );
    expect(outcome.summary.at(-1)).toBe('ALL=RED');
    expect(outcome.status).toBe(1);
  });

  it.each([
    ['the root configuration', 'package.json', 'package.json concerns the whole repository'],
    ['the tools', 'tools/check.mjs', 'tools/check.mjs concerns the whole repository'],
    [
      'the CI',
      '.github/workflows/ci.yml',
      '.github/workflows/ci.yml concerns the whole repository',
    ],
  ])('runs everything when %s changed', (_what, path, reason) => {
    const root = repository();
    const before = existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8') : '';
    write(root, path, `${before}\n`);
    write(root, 'platform/alone/src/index.ts', 'export const alone = 1;\n');
    const outcome = check(root, ['--affected=main'], { fakePnpm: true });

    expect(outcome.asked).toEqual(WHOLE);
    expect(outcome.stdout).toContain(`): ${reason}\n`);
    expect(outcome.stdout).not.toContain('check: lint, typecheck, tests and build');
    expect(outcome.status).toBe(0);
  });

  it('runs everything when nothing differs from the ref', () => {
    const outcome = check(repository(), ['--affected=HEAD'], { fakePnpm: true });
    expect(outcome.asked).toEqual(WHOLE);
    expect(outcome.stdout).toContain('check: 0 changed paths against HEAD (merge base ');
    expect(outcome.status).toBe(0);
  });

  it.each([
    ['a ref that does not exist', 'origin/main', '«origin/main» is not a commit in this clone'],
    ['a ref that looks like an option', '--all', '«--all» is not a commit in this clone'],
  ])('fails loudly for %s: exit code 2, RED, nothing runs', (_what, ref, message) => {
    const root = repository();
    write(root, 'docs/plan.md', 'a better plan\n');
    const outcome = check(root, [`--affected=${ref}`], { fakePnpm: true });

    expect(outcome.stderr).toContain(`check: cannot decide what to run: ${message}`);
    expect(outcome.stderr.trimEnd().split('\n').at(-1)).toBe('ALL=RED');
    expect(outcome.stdout).toBe('');
    expect(outcome.status).toBe(2);
    expect(outcome.asked).toEqual([]);
  });

  it('fails loudly outside a git repository', () => {
    const root = fixture(scriptsFor(STEPS, () => 'exit 0'));
    const outcome = check(root, ['--affected=main'], { fakePnpm: true });
    expect(outcome.stderr).toContain('check: cannot decide what to run: «main» is not a commit');
    expect(outcome.status).toBe(2);
    expect(outcome.asked).toEqual([]);
  });

  it('fails loudly when it cannot read the workspace', () => {
    const root = repository();
    write(root, 'pnpm-workspace.yaml', "packages:\n  - 'platform/**'\n");
    const outcome = check(root, ['--affected=main'], { fakePnpm: true });
    expect(outcome.stderr).toContain(
      'check: cannot decide what to run: pnpm-workspace.yaml: the pattern «platform/**» is not understood',
    );
    expect(outcome.stderr.trimEnd().split('\n').at(-1)).toBe('ALL=RED');
    expect(outcome.status).toBe(2);
    expect(outcome.asked).toEqual([]);
  });
});

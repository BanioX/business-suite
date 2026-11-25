import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STEPS } from '../src/affected.ts';
import { BASE_VARIABLE, CI_VARIABLE } from '../src/ownership.ts';
import {
  linesOf,
  listFiles,
  REPO_ROOT,
  SKIPPED_DIRS,
  SKIPPED_FILES,
  SKIPPED_PATHS,
} from '../src/repo-files.ts';

// The parts of the tooling agree with each other. Each part has its own tests; these look at the
// seams between them, where a difference makes no test red and no check fail: a guard file with
// a name the runner does not pick up, a script whose filter selects nothing or too much, a
// workflow that sets a variable under another name than the guard reads. In each of these cases
// a check would pass because it looked at nothing.

const GUARDS_DIR = 'tools/guards';
const GUARDS_CONFIG = 'tools/vitest.guards.config.ts';
const GUARD_FILE = /^tools\/guards\/([a-z][a-z0-9-]*)\.guard\.test\.ts$/;

function read(path: string): string {
  return readFileSync(join(REPO_ROOT, path), 'utf8');
}

function rootScripts(): Record<string, string> {
  const manifest: unknown = JSON.parse(read('package.json'));
  const scripts: unknown =
    typeof manifest === 'object' && manifest !== null
      ? Reflect.get(manifest, 'scripts')
      : undefined;
  if (typeof scripts !== 'object' || scripts === null) {
    throw new Error('the root package.json has no scripts');
  }
  return Object.fromEntries(
    Object.entries(scripts).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

describe('the guards and the scripts that run them', () => {
  const files = listFiles(REPO_ROOT, GUARDS_DIR);
  const scripts = rootScripts();
  const runsGuards = `vitest run --config ${GUARDS_CONFIG}`;

  it('names every file of tools/guards so that the runner picks it up', () => {
    // The config collects `guards/**/*.guard.test.ts`. A guard under any other name would
    // never run, and nothing would say so.
    expect(read(GUARDS_CONFIG)).toContain("include: ['guards/**/*.guard.test.ts']");
    expect(files).not.toEqual([]);
    expect(files.filter((file) => !GUARD_FILE.test(file))).toEqual([]);
  });

  it('runs all of them as a step of pnpm check', () => {
    expect(scripts.guards).toBe(runsGuards);
    expect(STEPS).toContain('guards');
    expect(scripts.check).toBe('node tools/check.mjs');
  });

  it('gives every script for one guard a filter that selects that guard and no other', () => {
    // `pnpm ownership` is `… ownership`: the runner takes every guard file whose path holds
    // the word. A guard that comes later (`names`) has its script already; until its file
    // exists, the script finds no test and fails, which is the right answer.
    const single = Object.entries(scripts).filter(
      ([name, command]) => name !== 'guards' && command.startsWith(`${runsGuards} `),
    );
    expect(single.map(([name]) => name).sort()).toEqual(['names', 'ownership']);
    for (const [name, command] of single) {
      const filter = command.slice(runsGuards.length + 1);
      expect(filter, name).toBe(name);
      const selected = files.filter((file) => file.slice('tools/'.length).includes(filter));
      const own = `${GUARDS_DIR}/${name}.guard.test.ts`;
      expect(
        selected.filter((file) => file !== own),
        name,
      ).toEqual([]);
    }
    expect(files).toContain(`${GUARDS_DIR}/ownership.guard.test.ts`);
  });
});

describe('what the guards do not read', () => {
  // The guards over «the whole repository» leave some directories out. Whatever they leave out
  // must be something git never takes in: a directory that can be committed and is skipped by
  // the guards would be a place where nothing is checked.
  const ignored = linesOf(read('.gitignore')).map((line) => line.trim());

  it('skips only directories that .gitignore keeps out of the repository', () => {
    const skipped = [...SKIPPED_DIRS].filter((dir) => dir !== '.git');
    expect(skipped).not.toEqual([]);
    expect(skipped.filter((dir) => !ignored.includes(`${dir}/`))).toEqual([]);
    expect([...SKIPPED_PATHS].filter((path) => !ignored.includes(`${path}/`))).toEqual([]);
    expect(ignored).toContain('*.tsbuildinfo');
  });

  it('leaves out one committed file on purpose, the lockfile, and no other', () => {
    expect([...SKIPPED_FILES]).toEqual(['pnpm-lock.yaml']);
  });
});

describe('the CI workflow (.github/workflows/ci.yml)', () => {
  const workflow = read('.github/workflows/ci.yml');
  const lines = linesOf(workflow);
  /** The lines without the comments that explain them. */
  const code = lines.filter((line) => !line.trimStart().startsWith('#'));

  /** The shell of every `run:`, a line of its own or a block below it. */
  function shell(): string[] {
    const found: string[] = [];
    code.forEach((line, index) => {
      const run = /^(\s*)(?:- )?run:\s*(.*)$/.exec(line);
      if (run?.[1] === undefined || run[2] === undefined) {
        return;
      }
      if (!run[2].startsWith('|') && !run[2].startsWith('>')) {
        found.push(run[2]);
        return;
      }
      const indent = run[1].length;
      for (const below of code.slice(index + 1)) {
        if (below.trim() !== '' && below.length - below.trimStart().length <= indent) {
          break;
        }
        found.push(below.trim());
      }
    });
    return found;
  }

  it('runs pnpm check in every case, with the base of the ownership guard named before it', () => {
    // The guard reads the commits after the base. Without the variable it would fall back to
    // `origin/main`, which is HEAD itself after a push to main: nothing read, and green.
    const script = shell();
    const cases = script.filter((line) => /^[a-z_*|]+\)$/.test(line));
    expect(cases).toEqual(['pull_request)', 'push)', '*)']);
    const exported = script.filter((line) => line.startsWith(`export ${BASE_VARIABLE}=`));
    const checks = script.filter((line) => /^pnpm check\b/.test(line));
    expect(exported).toHaveLength(cases.length);
    expect(checks).toHaveLength(cases.length);
    for (const line of exported) {
      // Never an empty value, which the guard would read as «not set».
      expect(line).toMatch(new RegExp(`^export ${BASE_VARIABLE}="(origin/[^"]+|\\$[A-Z_]+)"$`));
    }
    expect(script.indexOf(exported[0] ?? '')).toBeLessThan(script.indexOf(checks[0] ?? ''));
    // And the guard knows the runner of this workflow, to fail there without a base.
    expect(CI_VARIABLE).toBe('GITHUB_ACTIONS');
  });

  it('narrows the check on a pull request only: a push to main checks everything', () => {
    const checks = shell().filter((line) => /^pnpm check\b/.test(line));
    expect(checks).toEqual([
      'pnpm check --affected="origin/$BASE_BRANCH"',
      'pnpm check',
      'pnpm check',
    ]);
  });

  it('has the whole history: the merge base and the commits of a push are read from it', () => {
    expect(code.map((line) => line.trim())).toContain('fetch-depth: 0');
  });

  it('never cancels a run for a push: its commits would stay unread by the ownership guard', () => {
    const at = code.findIndex((line) => line.startsWith('concurrency:'));
    expect(at).toBeGreaterThan(-1);
    expect(code.slice(at + 1, at + 3).map((line) => line.trim())).toEqual([
      "group: ci-${{ github.event_name == 'pull_request' && github.ref || github.run_id }}",
      'cancel-in-progress: true',
    ]);
  });

  it('puts no expression into a shell: a branch name is data, not a piece of a script', () => {
    expect(shell()).not.toEqual([]);
    expect(shell().filter((line) => line.includes('${{'))).toEqual([]);
  });

  it('installs what the lockfile says, with the Node and the pnpm the repository names', () => {
    const trimmed = code.map((line) => line.trim());
    expect(trimmed).toContain('node-version-file: .nvmrc');
    expect(shell()).toContain('corepack enable');
    expect(shell()).toContain('pnpm install --frozen-lockfile');
  });

  it('costs nothing: standard runners, no artifacts, no cache, only the read permission', () => {
    const trimmed = code.map((line) => line.trim());
    const runners = trimmed.filter((line) => line.startsWith('runs-on:'));
    expect(runners).not.toEqual([]);
    expect(runners.filter((line) => line !== 'runs-on: ubuntu-latest')).toEqual([]);
    const actions = trimmed
      .filter((line) => /^(- )?uses:/.test(line))
      .map((line) => line.replace(/^(- )?uses:\s*/, ''));
    expect(actions.map((action) => action.replace(/@.*$/, '')).sort()).toEqual([
      'actions/checkout',
      'actions/setup-node',
    ]);
    expect(actions.filter((action) => !/@v\d+$/.test(action))).toEqual([]);
    expect(trimmed).toContain('package-manager-cache: false');
    expect(trimmed.filter((line) => /^cache(-|:)/.test(line))).toEqual([]);
    const at = code.findIndex((line) => line.startsWith('permissions:'));
    expect(code[at + 1]?.trim()).toBe('contents: read');
    expect(code[at + 2]?.trim()).toBe('');
  });
});

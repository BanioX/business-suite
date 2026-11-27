import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { listFiles, REPO_ROOT } from '../src/repo-files.ts';

// The acceptance of order W0-02: «`pnpm industry:new probe` makes an industry that passes
// `pnpm check:industry probe`; afterwards it is removed.» And `check:industry` goes red for a
// missing text, an exclamation mark in a text, an import of another industry and an operation
// without access.
//
// Everything happens in a copy of the repository in a temporary directory, never in this
// checkout: `pnpm install` rewrites the lockfile, and other agents and checks read this checkout
// at the same time (a `probe` here would turn their name guard red). The copy is installed from
// the store of pnpm without the network (`--offline`), so it needs the packages a `pnpm install`
// of this checkout already fetched. At the end the copy is removed, and the test holds that this
// checkout is exactly as it was: lockfile, register, workspace file, root package and the list of
// industries.

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

/** The environment of a child: no variable of this Vitest run leaks into the Vitest of the copy. */
function childEnvironment(): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) =>
        !key.startsWith('VITEST') && key !== 'NODE_V8_COVERAGE' && key !== 'ONESTRAND_INDUSTRY',
    ),
  );
}

interface Run {
  readonly code: number;
  readonly output: string;
  /** `<step> exit=<n>` of the summary after `=== check:industry … ===`, by step. */
  readonly steps: Readonly<Record<string, number>>;
  /** The last line `ALL=…` (pnpm may print its own line after it). */
  readonly last: string;
}

function run(cwd: string, args: readonly string[]): Run {
  const result = spawnSync(pnpm, args, { cwd, encoding: 'utf8', env: childEnvironment() });
  const output = `${result.stdout}\n${result.stderr}`;
  const lines = result.stdout.trimEnd().split('\n');
  const summary = lines.slice(lines.findIndex((line) => line.startsWith('=== check:industry')) + 1);
  const steps: Record<string, number> = {};
  for (const line of summary) {
    const match = /^([a-z-]+) exit=(\d+)/.exec(line);
    if (match !== null) {
      steps[match[1] ?? ''] = Number(match[2]);
    }
  }
  const last = lines.filter((line) => line.startsWith('ALL=')).at(-1) ?? '';
  return { code: result.status ?? 1, output, steps, last };
}

/** What this checkout must still be afterwards, file by file. */
function fingerprint(root: string): Record<string, string> {
  const files = ['pnpm-lock.yaml', 'pnpm-workspace.yaml', 'package.json', 'registry/names.json'];
  return {
    ...Object.fromEntries(
      files.map((path) => [
        path,
        createHash('sha256')
          .update(readFileSync(join(root, path)))
          .digest('hex'),
      ]),
    ),
    industries: readdirSync(join(root, 'industries')).sort().join(','),
  };
}

/** A copy of the repository as the guards see it: no Git store, no installed packages, no reports. */
function copyRepository(to: string): void {
  for (const path of listFiles(REPO_ROOT)) {
    mkdirSync(dirname(join(to, path)), { recursive: true });
    cpSync(join(REPO_ROOT, path), join(to, path));
  }
}

/** Replaces exactly one occurrence of a text in a file of the copy, or fails. */
function replaceOnce(root: string, path: string, from: string, to: string): void {
  const file = join(root, path);
  const text = readFileSync(file, 'utf8');
  expect(text.split(from), `${path} holds «${from}» once`).toHaveLength(2);
  writeFileSync(file, text.replace(from, to));
}

const STEPS = [
  'manifest',
  'edition',
  'texts',
  'switched-off',
  'backup',
  'device-filter',
  'side-effects',
  'names',
  'format',
  'lint',
  'typecheck',
  'tests',
];

const PROBE = 'industries/probe/core';

describe('pnpm industry:new probe, then pnpm check:industry probe, in a copy of the repository', () => {
  const before = fingerprint(REPO_ROOT);
  let copy = '';
  let made: Run;
  let green: Run;

  beforeAll(() => {
    copy = mkdtempSync(join(tmpdir(), 'onestrand-industry-'));
    copyRepository(copy);
    const install = run(copy, ['install', '--offline', '--frozen-lockfile']);
    expect(install.code, install.output).toBe(0);
    made = run(copy, ['industry:new', 'probe']);
    const link = run(copy, ['install', '--offline']);
    expect(link.code, link.output).toBe(0);
    green = run(copy, ['check:industry', 'probe']);
  }, 240_000);

  afterAll(() => {
    if (copy !== '') {
      rmSync(copy, { recursive: true, force: true });
    }
  });

  it('makes the industry: every file of the pattern under the new id, and its proposal of names', () => {
    expect(made.code, made.output).toBe(0);
    expect(existsSync(join(copy, PROBE, 'src/index.ts'))).toBe(true);
    expect(existsSync(join(copy, PROBE, 'node_modules'))).toBe(true);
    expect(readFileSync(join(copy, PROBE, 'package.json'), 'utf8')).toContain(
      '"name": "@onestrand-industry/probe"',
    );
    const names = readFileSync(join(copy, 'industries/probe/NAMES.md'), 'utf8');
    expect(names).toContain('| `operation` | `probe.entries.add` |');
    // The register is the head's: the generator only prints what to enter.
    expect(readFileSync(join(copy, 'registry/names.json'), 'utf8')).not.toContain('probe');
    expect(made.output).toContain('"name":"probe_entries","owner":"industry:probe"');
    expect(made.output).toContain('Next steps:');
  });

  it('passes pnpm check:industry probe: every step exit=0 and ALL=GREEN', () => {
    expect(Object.keys(green.steps), green.output).toEqual(STEPS);
    expect(green.steps, green.output).toEqual(Object.fromEntries(STEPS.map((step) => [step, 0])));
    expect(green.last).toBe('ALL=GREEN');
    expect(green.code).toBe(0);
    // Its names are proposed, not registered, and the check says so.
    expect(green.output).toContain('proposed in industries/probe/NAMES.md: 8');
  });

  it('goes red for an exclamation mark, a missing text and an import of another industry', () => {
    const messages = `${PROBE}/test/messages.ts`;
    const original = readFileSync(join(copy, messages), 'utf8');
    replaceOnce(copy, messages, "'Nur erfassen'", "'Nur erfassen!'");
    replaceOnce(
      copy,
      messages,
      "options: {\n    'probe.entries': { newestFirst: 'Neueste Einträge zuerst' },\n  },\n",
      '',
    );
    writeFileSync(
      join(copy, PROBE, 'src/borrowed.ts'),
      "import { MUSTER } from '../../../muster/core/src/entries';\n\nexport const borrowed = MUSTER;\n",
    );
    try {
      const red = run(copy, ['check:industry', 'probe']);
      expect(red.last, red.output).toBe('ALL=RED');
      expect(red.code).toBe(1);
      expect(red.steps.texts, red.output).toBe(1);
      expect(red.output).toContain('exclamation: «Nur erfassen!»');
      expect(red.steps.edition, red.output).toBe(1);
      expect(red.output).toContain('missing_text options.probe.entries.newestFirst');
      expect(red.steps.lint, red.output).toBe(1);
      expect(red.output).toContain('../../../muster/core/src/entries');
      // What none of the three touches stays green: the check names the step that broke.
      expect(red.steps.manifest).toBe(0);
      expect(red.steps.backup).toBe(0);
      expect(red.steps.names).toBe(0);
    } finally {
      writeFileSync(join(copy, messages), original);
      rmSync(join(copy, PROBE, 'src/borrowed.ts'));
    }
  }, 120_000);

  it('goes red for an operation without access: defineIndustry refuses the manifest', () => {
    const contract = `${PROBE}/src/contract.ts`;
    const original = readFileSync(join(copy, contract), 'utf8');
    replaceOnce(
      copy,
      contract,
      "    access: { feature: ENTRIES_FEATURE, level: 'operate' },\n",
      '',
    );
    try {
      const red = run(copy, ['check:industry', 'probe']);
      expect(red.last, red.output).toBe('ALL=RED');
      expect(red.steps.manifest, red.output).toBe(1);
      expect(red.output).toContain('invalid_entry contract probe.entries.add');
      // The texts do not need the manifest, the format does not either.
      expect(red.steps.texts).toBe(0);
      expect(red.steps.format).toBe(0);
    } finally {
      writeFileSync(join(copy, contract), original);
    }
  }, 120_000);

  it('leaves this checkout as it was: lockfile, register, workspace and industries', () => {
    expect(fingerprint(REPO_ROOT)).toEqual(before);
    expect(existsSync(join(REPO_ROOT, 'industries/probe'))).toBe(false);
  });
});

describe('pnpm check:industry for an industry that is not there', () => {
  it('cannot start: exit code 2 and ALL=RED, nothing runs', () => {
    const result = run(REPO_ROOT, ['check:industry', 'nosuchindustry']);
    expect(result.code).toBe(2);
    expect(result.output).toContain('there is no industry "nosuchindustry"');
    expect(result.output).toContain('ALL=RED');
    expect(result.output).not.toContain('=== conformity');
  });
});

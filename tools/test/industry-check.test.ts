import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { planCheck, readWorkspace, type WorkspacePackage } from '../src/affected.ts';
import {
  allLine,
  CODE_STEPS,
  codeArgs,
  CONFORMITY_CONFIG,
  CONFORMITY_PROCESS,
  CONFORMITY_STEPS,
  conformityArgs,
  conformityFile,
  conformityResults,
  outcomeLine,
} from '../src/industry-check.ts';
import { REPO_ROOT } from '../src/repo-files.ts';

const MUSTER: WorkspacePackage = {
  name: '@onestrand-industry/muster',
  dir: 'industries/muster/core',
  project: 'muster-core',
  dependsOn: [],
};

/** A JSON report of Vitest as it writes one: one entry per test file. */
function report(
  files: { step: string; status?: string; assertions?: string[] }[],
): Record<string, unknown> {
  return {
    numTotalTests: files.length,
    testResults: files.map(({ step, status = 'passed', assertions = ['passed'] }) => ({
      name: `/repo/tools/conformity/${step}.conformity.test.ts`,
      status,
      startTime: 1000,
      endTime: 1500,
      assertionResults: assertions.map((assertion) => ({ status: assertion })),
    })),
  };
}

const allSteps = () => CONFORMITY_STEPS.map((step) => ({ step }));

describe('the steps of check:industry', () => {
  it('are a test file under tools/conformity/ for each conformity step, and no file more', () => {
    const files = readdirSync(join(REPO_ROOT, 'tools/conformity')).sort();
    expect(files).toEqual(CONFORMITY_STEPS.map(conformityFile).sort());
  });

  it('run the conformity in one Vitest process with its own config and a JSON report', () => {
    expect(conformityArgs('/tmp/x/report.json')).toEqual([
      'exec',
      'vitest',
      'run',
      '--config',
      CONFORMITY_CONFIG,
      '--reporter=default',
      '--reporter=json',
      '--outputFile.json=/tmp/x/report.json',
    ]);
    expect(readdirSync(join(REPO_ROOT, 'tools'))).toContain('vitest.conformity.config.ts');
  });

  it('check the code with the commands of pnpm check --affected for the package: one rule, two runners', () => {
    const input = { dir: 'industries/muster', core: MUSTER, reportsDirectory: '/tmp/x/coverage' };
    expect(CODE_STEPS.map((step) => codeArgs(step, input))).toEqual([
      ['exec', 'prettier', '--check', 'industries/muster'],
      ['exec', 'eslint', '--max-warnings', '0', 'industries/muster'],
      ['--filter', '@onestrand-industry/muster', 'run', '--parallel', 'typecheck'],
      [
        'exec',
        'vitest',
        'run',
        '--coverage',
        '--project',
        'muster-core',
        '--coverage.include=src/**',
        '--coverage.reportsDirectory=/tmp/x/coverage',
      ],
    ]);
    // The same as `pnpm check --affected` runs for a change inside the industry.
    const affected = planCheck({
      changedPaths: ['industries/muster/core/src/index.ts'],
      packages: readWorkspace(REPO_ROOT),
    });
    const narrowed = (step: string) =>
      affected.steps.find((planned) => planned.step === step && planned.action === 'command');
    expect(narrowed('typecheck')).toMatchObject({ args: codeArgs('typecheck', input) });
    expect(narrowed('test:coverage')).toMatchObject({
      args: codeArgs('tests', input).slice(0, -1),
    });
  });

  it('are root scripts: pnpm industry:new and pnpm check:industry', () => {
    const { scripts } = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(scripts['industry:new']).toBe('node tools/industry-new.mjs');
    expect(scripts['check:industry']).toBe('node tools/check-industry.mjs');
  });
});

describe('conformityResults', () => {
  it('passes a step whose file passed every test', () => {
    const outcomes = conformityResults(report(allSteps()), 0);
    expect(outcomes.map(({ step, code }) => `${step} ${String(code)}`)).toEqual(
      CONFORMITY_STEPS.map((step) => `${step} 0`),
    );
    expect(outcomes[0]?.seconds).toBe(0.5);
    expect(allLine(outcomes)).toBe('ALL=GREEN');
  });

  it('fails the step whose file failed, and only that one', () => {
    const files = allSteps().map((file) =>
      file.step === 'texts' ? { ...file, status: 'failed', assertions: ['failed'] } : file,
    );
    const outcomes = conformityResults(report(files), 1);
    expect(outcomes.filter(({ code }) => code !== 0).map(({ step }) => step)).toEqual(['texts']);
    expect(outcomes.find(({ step }) => step === 'texts')?.reason).toBeUndefined();
    expect(allLine(outcomes)).toBe('ALL=RED');
  });

  it('fails a step that did not run, that ran no test or that was skipped: never a pass for nothing', () => {
    const files = [
      ...allSteps().filter(({ step }) => !['names', 'backup', 'edition'].includes(step)),
      { step: 'backup', assertions: [] },
      { step: 'edition', status: 'skipped', assertions: ['skipped'] },
    ];
    const outcomes = conformityResults(report(files), 0);
    const failed = outcomes.filter(({ code }) => code !== 0);
    expect(failed.map(outcomeLine)).toEqual([
      'edition exit=1 (0.5 s): the step ended as «skipped» without a passed test',
      'backup exit=1 (0.5 s): the step ended as «passed» without a passed test',
      'names exit=1 (0.0 s): tools/conformity/names.conformity.test.ts did not run',
    ]);
  });

  it('is red when Vitest fails although every step passed: an unhandled error is never a pass', () => {
    // Vitest 5 reports every file as passed (and `success: true`) after an unhandled rejection,
    // and ends with exit code 1: seen on 27.11.2026.
    const outcomes = conformityResults(report(allSteps()), 1);
    expect(outcomes.slice(0, -1).every(({ code }) => code === 0)).toBe(true);
    expect(outcomes.at(-1)).toMatchObject({ step: CONFORMITY_PROCESS, code: 1 });
    expect(outcomeLine(outcomes.at(-1) ?? { step: '', code: 0, seconds: 0 })).toContain(
      'conformity exit=1 (0.0 s): Vitest ended with exit=1 although every step passed',
    );
    expect(allLine(outcomes)).toBe('ALL=RED');
    // A failed step explains the exit code itself: no line more.
    const failed = allSteps().map((file) =>
      file.step === 'names' ? { ...file, status: 'failed', assertions: ['failed'] } : file,
    );
    expect(conformityResults(report(failed), 1)).toHaveLength(CONFORMITY_STEPS.length);
  });

  it('fails every step without a report, with the exit code of Vitest and at least 1', () => {
    for (const [missing, code, expected] of [
      [undefined, 0, 1],
      ['not json', 4, 4],
      [{ testResults: [] }, 1, 1],
    ] as const) {
      const outcomes = conformityResults(missing, code);
      expect(outcomes).toHaveLength(CONFORMITY_STEPS.length);
      expect(outcomes.every((outcome) => outcome.code === expected)).toBe(true);
      expect(outcomes[0]?.reason).toBe(
        `the conformity tests did not report (Vitest ended with exit=${String(code)})`,
      );
    }
  });

  it('is never green without a step', () => {
    expect(allLine([])).toBe('ALL=RED');
    expect(outcomeLine({ step: 'lint', code: 0, seconds: 4.04 })).toBe('lint exit=0 (4.0 s)');
  });
});

// The runner is tested where it cannot start, in a made-up repository: the files it imports,
// file by file (a new import must be added here on purpose), and no pnpm is ever run.
describe('node tools/check-industry.mjs, when it cannot start', () => {
  const temporary: string[] = [];
  afterEach(() => {
    for (const dir of temporary.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function fixture(files: Record<string, string>): string {
    const root = mkdtempSync(join(tmpdir(), 'onestrand-check-industry-'));
    temporary.push(root);
    for (const file of [
      'check-industry.mjs',
      'src/affected.ts',
      'src/git.ts',
      'src/globs.ts',
      'src/industries.ts',
      'src/industry-check.ts',
    ]) {
      mkdirSync(dirname(join(root, 'tools', file)), { recursive: true });
      copyFileSync(join(REPO_ROOT, 'tools', file), join(root, 'tools', file));
    }
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), text);
    }
    return root;
  }

  function runner(root: string, ...args: string[]) {
    const result = spawnSync(process.execPath, [join(root, 'tools/check-industry.mjs'), ...args], {
      cwd: tmpdir(),
      encoding: 'utf8',
      // No pnpm on the way: should the runner get past its refusals, it fails instead of checking.
      env: { ...process.env, PATH: '' },
    });
    return { status: result.status, stderr: result.stderr, stdout: result.stdout };
  }

  const industry = {
    'pnpm-workspace.yaml': 'packages:\n  - industries/*/core\n',
    'industries/sample/core/package.json': '{ "name": "@onestrand-industry/sample" }',
  };

  it.each([
    [[], 'Usage: pnpm check:industry <id>'],
    [['a', 'b'], 'Usage: pnpm check:industry <id>'],
    [['--all'], 'Usage: pnpm check:industry <id>'],
    [
      ['other'],
      'there is no industry "other": industries/other/core/package.json is missing (industries: sample)',
    ],
  ])('refuses %j: exit code 2 and ALL=RED', (args, message) => {
    const result = runner(fixture(industry), ...args);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain(message);
    expect(result.stderr.trimEnd().split('\n').at(-1)).toBe('ALL=RED');
    expect(result.stdout).toBe('');
  });

  it('refuses an industry that is no package of the workspace', () => {
    const root = fixture({ ...industry, 'pnpm-workspace.yaml': 'packages:\n  - platform/*\n' });
    const result = runner(root, 'sample');
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('industries/sample/core is not a package of the workspace');
  });

  it('refuses an industry that is not installed yet, and says what to do', () => {
    const result = runner(fixture(industry), 'sample');
    expect(result.status).toBe(2);
    expect(result.stderr).toContain(
      'industries/sample/core is not installed yet: run pnpm install first',
    );
  });
});

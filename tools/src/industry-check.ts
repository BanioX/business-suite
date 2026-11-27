// `pnpm check:industry <id>`: everything an industry must pass before it lands (suite ADR-0004,
// 8; docs/architektur.md, section 4; rule 10 of platform/manifest/api.md). The steps and the
// arguments are here; tools/check-industry.mjs runs them and prints `exit=` per step and the line
// `ALL=GREEN|RED`, in the style of `pnpm check`.
//
// Two kinds of steps:
//
// - The conformity of the industry as data (manifest, edition, texts, switched off, backup, filter
//   for other devices, side effects, names) needs its manifest (all but the texts), and the
//   manifest is TypeScript that imports the platform:
//   Vitest runs it as it is, plain Node does not (the platform imports its files without
//   extension). So these steps are test files under tools/conformity/, one per step, run in one
//   Vitest process with tools/vitest.conformity.config.ts; the industry comes in the environment
//   (`INDUSTRY_ENV`), and the JSON report of Vitest says which step passed. The same mechanism
//   as the guards, which read the manifests of every industry (tools/src/industries.ts).
// - The checks of its code (format, lint with the boundaries, typecheck with the purity check,
//   its own tests with coverage) are the commands of `pnpm check --affected` narrowed to the
//   package of the industry (`narrowedArgs` in tools/src/affected.ts): one rule, two runners.
//
// Node runs this file as it is (type stripping), so it uses erasable syntax only.
import { basename } from 'node:path';
import { narrowedArgs, type WorkspacePackage } from './affected.ts';

/** The variable that names the industry for the conformity tests. */
export const INDUSTRY_ENV = 'ONESTRAND_INDUSTRY';

/** The config of the conformity tests, from the root of the repository. */
export const CONFORMITY_CONFIG = 'tools/vitest.conformity.config.ts';

/**
 * The steps of the conformity, in the order they are printed; each is the test file
 * `tools/conformity/<step>.conformity.test.ts`.
 */
export const CONFORMITY_STEPS = [
  'manifest',
  'edition',
  'texts',
  'switched-off',
  'backup',
  'device-filter',
  'side-effects',
  'names',
] as const;

export type ConformityStep = (typeof CONFORMITY_STEPS)[number];

/** The steps on the code of the industry, after the conformity. */
export const CODE_STEPS = ['format', 'lint', 'typecheck', 'tests'] as const;

export type IndustryCodeStep = (typeof CODE_STEPS)[number];

/** The test file of a conformity step. */
export function conformityFile(step: ConformityStep): string {
  return `${step}.conformity.test.ts`;
}

/**
 * The arguments for pnpm that run every conformity step in one Vitest process, with the
 * default reporter for the person and the JSON report for `conformityResults`.
 */
export function conformityArgs(reportFile: string): string[] {
  return [
    'exec',
    'vitest',
    'run',
    '--config',
    CONFORMITY_CONFIG,
    '--reporter=default',
    '--reporter=json',
    `--outputFile.json=${reportFile}`,
  ];
}

/**
 * The arguments for pnpm of a step on the code. `dir` is `industries/<id>`, the whole industry
 * (its pure part and, from W0-03, its React part); `core` is the package of its pure part.
 * `reportsDirectory` keeps the coverage report of the check out of the `coverage/` of the
 * repository, which a `pnpm check` running at the same time writes.
 */
export function codeArgs(
  step: IndustryCodeStep,
  input: {
    readonly dir: string;
    readonly core: WorkspacePackage;
    readonly reportsDirectory: string;
  },
): string[] {
  switch (step) {
    case 'format':
      return ['exec', 'prettier', '--check', input.dir];
    case 'lint':
      return ['exec', 'eslint', '--max-warnings', '0', input.dir];
    case 'typecheck':
      return narrowedArgs('typecheck', [input.core]);
    case 'tests':
      return [
        ...narrowedArgs('test:coverage', [input.core]),
        `--coverage.reportsDirectory=${input.reportsDirectory}`,
      ];
  }
}

/** The outcome of one step, as a line of the check prints it. */
export interface StepOutcome {
  readonly step: string;
  /** 0 when it passed. */
  readonly code: number;
  readonly seconds: number;
  /** Why the step failed without a test failing in it (it did not run, the report is missing). */
  readonly reason?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The outcome of every conformity step from the JSON report of Vitest and the exit code of its
 * process. A step whose file is not in the report did not run and has failed: a check that does
 * not run must never look like a pass. Without a report every step takes the exit code of the
 * process, and at least 1.
 */
export function conformityResults(report: unknown, exitCode: number): StepOutcome[] {
  const files = isRecord(report) && Array.isArray(report.testResults) ? report.testResults : [];
  const byFile = new Map<string, Record<string, unknown>>();
  for (const file of files) {
    if (isRecord(file) && typeof file.name === 'string') {
      byFile.set(basename(file.name), file);
    }
  }
  return CONFORMITY_STEPS.map((step) => {
    const file = byFile.get(conformityFile(step));
    if (file === undefined) {
      return {
        step,
        code: Math.max(exitCode, 1),
        seconds: 0,
        reason:
          files.length === 0
            ? `the conformity tests did not report (Vitest ended with exit=${String(exitCode)})`
            : `tools/conformity/${conformityFile(step)} did not run`,
      };
    }
    const assertions = Array.isArray(file.assertionResults) ? file.assertionResults : [];
    const passed =
      file.status === 'passed' &&
      assertions.length > 0 &&
      assertions.every((assertion) => isRecord(assertion) && assertion.status === 'passed');
    const start = typeof file.startTime === 'number' ? file.startTime : 0;
    const end = typeof file.endTime === 'number' ? file.endTime : start;
    return {
      step,
      code: passed ? 0 : 1,
      seconds: Math.max(0, (end - start) / 1000),
      ...(passed || file.status === 'failed'
        ? {}
        : { reason: `the step ended as «${String(file.status)}» without a passed test` }),
    };
  });
}

/** A step as one line of the summary: `<step> exit=<code> (<seconds> s)`. */
export function outcomeLine(outcome: StepOutcome): string {
  const line = `${outcome.step} exit=${String(outcome.code)} (${outcome.seconds.toFixed(1)} s)`;
  return outcome.reason === undefined ? line : `${line}: ${outcome.reason}`;
}

/** The last line: green only when every step is. */
export function allLine(outcomes: readonly StepOutcome[]): string {
  return `ALL=${outcomes.length > 0 && outcomes.every(({ code }) => code === 0) ? 'GREEN' : 'RED'}`;
}

// Origin: BanioX/Randen scripts/check.mjs @ e0f0907 — adapted: steps of the suite, affected mode with skipped and narrowed steps
// «pnpm check»: everything a push must pass, one step after the other, WITHOUT stopping at the
// first failure. Each step prints `<step> exit=<code> (<seconds> s)`; the last line is
// `ALL=GREEN` or `ALL=RED`, and the exit code is 1 on RED.
//
//   pnpm check                        licences, format, lint, typecheck, unit tests with
//                                     coverage, build and guards over the whole repository
//   pnpm check --affected=<git ref>   the same, narrowed to what differs from the merge base of
//                                     that ref and HEAD (committed, uncommitted, untracked):
//                                     only docs → lint, typecheck, tests and build are skipped
//                                     (`<step> skipped (<reason>)`, counted as passed); only
//                                     some packages → these four for those packages and every
//                                     package that depends on them; anything else → everything.
//                                     The rules live in tools/src/affected.ts.
//
// Two lessons are built in:
// - `pnpm -s` swallows errors, so every step runs loud and its exit code is printed.
// - A check whose tool is missing must fail, not look like a pass: a step that cannot be
//   started, or that is killed by a signal, counts as failed. The same holds before the first
//   step: an unknown option, or a ref that cannot be compared with, ends with `ALL=RED` and
//   exit code 2, and nothing runs.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// TypeScript, run by Node as it is (Node 24 strips the types): no build step for the tools.
import { changedPaths, planCheck, planEverything, readWorkspace } from './src/affected.ts';

const rootUrl = new URL('..', import.meta.url);
const root = fileURLToPath(rootUrl);
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const AFFECTED = '--affected=';

/** The check cannot start: says why and returns the exit code for that. Never looks like a pass. */
function refuse(message) {
  console.error(message);
  console.error('ALL=RED');
  return 2;
}

/**
 * What to run: everything, or what the comparison with the ref leaves over. Throws when the
 * comparison is not possible.
 */
function decide(ref) {
  if (ref === undefined) {
    return planEverything(`no ${AFFECTED}<git ref>`);
  }
  const { base, paths } = changedPaths(root, ref);
  const plan = planCheck({ changedPaths: paths, packages: readWorkspace(root) });
  const count = `${paths.length} changed ${paths.length === 1 ? 'path' : 'paths'}`;
  process.stdout.write(
    `check: ${count} against ${ref} (merge base ${base.slice(0, 7)}): ${plan.reason}\n`,
  );
  if (plan.scope !== 'everything') {
    const narrowed = plan.scope === 'docs' ? 'skipped' : `only for ${plan.packages.join(', ')}`;
    process.stdout.write(`check: lint, typecheck, tests and build ${narrowed}\n`);
  }
  return plan;
}

/** Runs pnpm with the given arguments and returns its exit code (never undefined). */
function spawn(pnpmArgs) {
  const shown = `${pnpm} ${pnpmArgs.join(' ')}`;
  const result = spawnSync(pnpm, pnpmArgs, { cwd: root, stdio: 'inherit' });
  if (result.error !== undefined) {
    console.error(`check: could not start «${shown}»: ${result.error.message}`);
    return 127;
  }
  if (result.status === null) {
    console.error(`check: «${shown}» was stopped by ${result.signal ?? 'a signal'}`);
    return 1;
  }
  return result.status;
}

/** Runs one planned step: a script of the root package.json, or its narrowed form. */
function run(planned, scripts) {
  if (planned.action === 'command') {
    process.stdout.write(`$ ${pnpm} ${planned.args.join(' ')}\n`);
    return spawn(planned.args);
  }
  if (!(planned.step in scripts)) {
    console.error(`check: package.json has no script «${planned.step}»`);
    return 127;
  }
  return spawn(['run', planned.step]);
}

/** The whole check; returns the exit code of the process. */
function main(args) {
  const unknown = args.filter((arg) => !arg.startsWith(AFFECTED));
  if (unknown.length > 0) {
    // A typo such as `--afected` must not quietly run a different check.
    return refuse(`Unknown option: ${unknown.join(' ')}. Known: ${AFFECTED}<git ref>`);
  }
  const refs = args.map((arg) => arg.slice(AFFECTED.length));
  if (refs.length > 1 || refs[0] === '') {
    return refuse(`${AFFECTED}<git ref> takes exactly one ref, for example ${AFFECTED}origin/main`);
  }

  let plan;
  let scripts;
  try {
    ({ scripts = {} } = JSON.parse(readFileSync(new URL('package.json', rootUrl), 'utf8')));
    plan = decide(refs[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return refuse(`check: cannot decide what to run: ${message}`);
  }

  const lines = [];
  for (const planned of plan.steps) {
    process.stdout.write(`\n=== ${planned.step} ===\n`);
    if (planned.action === 'skip') {
      const line = `${planned.step} skipped (${planned.reason})`;
      lines.push({ line, code: 0 });
      process.stdout.write(`${line}\n`);
      continue;
    }
    const started = performance.now();
    const code = run(planned, scripts);
    const seconds = ((performance.now() - started) / 1000).toFixed(1);
    const line = `${planned.step} exit=${String(code)} (${seconds} s)`;
    lines.push({ line, code });
    process.stdout.write(`${line}\n`);
  }

  // The summary once more at the very end, so nobody has to scroll: read the line `ALL=`, and
  // on RED every line whose `exit=` is not 0.
  const green = lines.every(({ code }) => code === 0);
  process.stdout.write(`\n=== check ===\n${lines.map(({ line }) => line).join('\n')}\n`);
  process.stdout.write(`ALL=${green ? 'GREEN' : 'RED'}\n`);
  return green ? 0 : 1;
}

// The exit code is set, not forced with process.exit(): the last line is written before the
// process ends, also into a slow pipe.
process.exitCode = main(process.argv.slice(2));

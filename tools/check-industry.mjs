// «pnpm check:industry <id>»: everything the industry `<id>` must pass before it lands (suite
// ADR-0004, 8; docs/architektur.md, section 4; rule 10 of platform/manifest/api.md), one step
// after the other, WITHOUT stopping at the first failure, in the style of `pnpm check`: each step
// prints `<step> exit=<code> (<seconds> s)`, the last line is `ALL=GREEN` or `ALL=RED`, and the
// exit code is 1 on RED. When the Vitest run of the conformity fails although each of its steps
// passed (an unhandled error), the line `conformity exit=<code>` comes in addition.
//
//   manifest      the entry exports one manifest made by defineIndustry under the id, without a
//                 problem; package name, Vitest project, sources of the rule sets
//   edition       an edition of the business module and the industry composes, editionProblems = []
//   texts         the catalogue in de-CH: du, ss, no exclamation mark, no product name, own ids only
//   switched-off  a function switched off has no way in, its rows stay (in the backup too)
//   backup        the demo business goes there and back through a file
//   device-filter every table names its function and right; its rows go to other devices only as the profile allows
//   side-effects  no side effect in the shipped code without its row in docs/nebenwirkungen.md
//   names         every identifier is in registry/names.json or proposed in industries/<id>/NAMES.md
//   format, lint (with the boundaries), typecheck (with the purity check), tests (with coverage)
//
// The steps and why the conformity runs under Vitest: tools/src/industry-check.ts. It cannot
// start (exit code 2, `ALL=RED`, nothing runs) for a wrong call, an industry that is not there,
// and one whose package is not installed yet.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// TypeScript, run by Node as it is (Node 24 strips the types): no build step for the tools.
import { readWorkspace } from './src/affected.ts';
import {
  allLine,
  CODE_STEPS,
  codeArgs,
  conformityArgs,
  conformityResults,
  INDUSTRY_ENV,
  outcomeLine,
} from './src/industry-check.ts';
import { industryFolders, INDUSTRIES_DIR } from './src/industries.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

/** The check cannot start: says why and returns the exit code for that. Never looks like a pass. */
function refuse(message) {
  console.error(message);
  console.error('ALL=RED');
  return 2;
}

/** Runs pnpm with the given arguments and returns its exit code (never undefined). */
function spawn(args, env = process.env) {
  const shown = `${pnpm} ${args.join(' ')}`;
  process.stdout.write(`$ ${shown}\n`);
  const result = spawnSync(pnpm, args, { cwd: root, stdio: 'inherit', env });
  if (result.error !== undefined) {
    console.error(`check:industry: could not start «${shown}»: ${result.error.message}`);
    return 127;
  }
  if (result.status === null) {
    console.error(`check:industry: «${shown}» was stopped by ${result.signal ?? 'a signal'}`);
    return 1;
  }
  return result.status;
}

function readReport(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
}

function main(args) {
  if (args.length !== 1 || args[0].startsWith('-')) {
    return refuse(
      'Usage: pnpm check:industry <id>   (an industry under industries/, for example muster)',
    );
  }
  const [id] = args;
  const folders = industryFolders(root);
  const folder = folders.find((candidate) => candidate.id === id);
  if (folder === undefined) {
    const known = folders.map((candidate) => candidate.id).join(', ') || 'none';
    return refuse(
      `check:industry: there is no industry "${id}": ${INDUSTRIES_DIR}/${id}/core/package.json is missing (industries: ${known})`,
    );
  }
  let core;
  try {
    core = readWorkspace(root).find((candidate) => candidate.dir === folder.core);
  } catch (error) {
    return refuse(
      `check:industry: cannot read the workspace: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (core === undefined) {
    return refuse(
      `check:industry: ${folder.core} is not a package of the workspace (pnpm-workspace.yaml)`,
    );
  }
  if (!existsSync(join(root, folder.core, 'node_modules'))) {
    return refuse(`check:industry: ${folder.core} is not installed yet: run pnpm install first`);
  }

  const scratch = mkdtempSync(join(tmpdir(), 'onestrand-check-industry-'));
  try {
    const outcomes = [];
    const print = (outcome) => {
      outcomes.push(outcome);
      process.stdout.write(`${outcomeLine(outcome)}\n`);
    };

    process.stdout.write(`\n=== conformity of ${id} ===\n`);
    const report = join(scratch, 'conformity.json');
    const started = performance.now();
    const code = spawn(conformityArgs(report), { ...process.env, [INDUSTRY_ENV]: id });
    const seconds = (performance.now() - started) / 1000;
    process.stdout.write(`conformity exit=${String(code)} (${seconds.toFixed(1)} s)\n`);
    conformityResults(readReport(report), code).forEach(print);

    const input = {
      dir: `${INDUSTRIES_DIR}/${id}`,
      core,
      reportsDirectory: join(scratch, 'coverage'),
    };
    for (const step of CODE_STEPS) {
      process.stdout.write(`\n=== ${step} ===\n`);
      const begun = performance.now();
      const exit = spawn(codeArgs(step, input));
      print({ step, code: exit, seconds: (performance.now() - begun) / 1000 });
    }

    // The summary once more at the very end: read the line `ALL=`, and on RED every line whose
    // `exit=` is not 0.
    process.stdout.write(
      `\n=== check:industry ${id} ===\n${outcomes.map(outcomeLine).join('\n')}\n`,
    );
    const all = allLine(outcomes);
    process.stdout.write(`${all}\n`);
    return all === 'ALL=GREEN' ? 0 : 1;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

// The exit code is set, not forced with process.exit(): the last line is written before the
// process ends, also into a slow pipe.
process.exitCode = main(process.argv.slice(2));

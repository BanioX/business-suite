import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readCommitRange } from '../src/git.ts';
import {
  baseFromEnvironment,
  checkOwnership,
  formatOwnershipProblem,
  formatOwnershipSummary,
  readRegister,
  REGISTER_PATH,
} from '../src/ownership.ts';
import { formatProblem, REPO_ROOT } from '../src/repo-files.ts';

/**
 * Every commit changes only paths its order may write (docs/zusammenarbeit.md, 2 and 10.12).
 * The rules and the format of the register are written down in `tools/src/ownership.ts`.
 *
 * Which commits: everything after the commit that `OWNERSHIP_BASE` names, up to HEAD; without
 * the variable, everything after `origin/main`. The CI sets it to the base branch of a pull
 * request and to the commit before a push (.github/workflows/ci.yml), and there the guard fails
 * without it. A base that this clone does not have fails the guard; a hash of zeros (a new
 * branch) and a clone without `origin/main` leave HEAD on its own. Whatever the case, the guard
 * prints what it read.
 */
describe('path ownership per commit (registry/owners.json)', () => {
  const file = join(REPO_ROOT, REGISTER_PATH);
  const { register, problems } = readRegister(
    existsSync(file) ? readFileSync(file, 'utf8') : undefined,
  );

  it('has a register that is well formed', () => {
    expect(problems.map(formatProblem)).toEqual([]);
  });

  it('changes only paths of its order, in every commit since the base', () => {
    if (register === undefined) {
      throw new Error(`${REGISTER_PATH} cannot be read, so no commit can be judged.`);
    }
    // Throws when the base cannot be found: a guard that reads nothing must not pass.
    // The same holds on the CI for a base that is not named at all.
    const range = readCommitRange(REPO_ROOT, baseFromEnvironment(process.env));
    const report = checkOwnership(range.commits, register);
    // Written straight to the output: the test runner shows what a passing test logs through
    // the console only in some of its modes, and this line is the proof that commits were read.
    process.stdout.write(`${formatOwnershipSummary(report, range.note)}\n`);
    expect(report.checked + report.skipped.length).toBe(range.commits.length);
    expect(report.problems.map(formatOwnershipProblem)).toEqual([]);
  });
});

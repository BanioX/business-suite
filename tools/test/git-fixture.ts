import { execFileSync } from 'node:child_process';

/**
 * Git for the made-up repositories of the tests: made-up authorship, no signing and no hooks,
 * whatever the machine is configured to do. Returns what git prints, trimmed; throws with what
 * git says when it fails.
 *
 * Every `GIT_*` variable is taken out of the environment. When the tests run from a hook, git
 * exports `GIT_DIR` and its like, and a helper that passed them on would act on the real
 * repository instead of the one `root` lies in.
 */
export function fixtureGit(root: string, ...args: string[]): string {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')),
  );
  return execFileSync(
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
    { cwd: root, encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'] },
  ).trim();
}

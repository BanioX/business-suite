// Reading from git, for everything in the tools that asks it: the guards that look at the history
// (path ownership per commit, tools/src/ownership.ts) and `pnpm check --affected`
// (tools/src/affected.ts). Git is started with a list of arguments and never through a shell, so
// a branch name or a path is always data, never a piece of a command.
import { execFileSync } from 'node:child_process';

/** A commit as git stores it, as far as a guard needs it. */
export interface GitCommit {
  /** The full hash. */
  readonly hash: string;
  /** The hashes of its parents: none for the first commit, two or more for a merge. */
  readonly parents: readonly string[];
  /** The whole message, subject and body, as it was written. */
  readonly message: string;
  /**
   * The paths the commit changes against its parent, from the root with forward slashes, sorted.
   * An added, changed or deleted file counts with its path, a moved file with both, the old and
   * the new one. Empty for a merge: what a merge brings was changed by the commits it merges.
   */
  readonly paths: readonly string[];
}

/** The commits a guard looks at. */
export interface CommitRange {
  /** The commit the range starts after; undefined when HEAD is read on its own. */
  readonly base: { readonly name: string; readonly hash: string } | undefined;
  /** The commits after the base up to HEAD, oldest first; or HEAD alone. */
  readonly commits: readonly GitCommit[];
  /** One line for the log: which commits these are, and why. */
  readonly note: string;
}

/** Git could not be started, or it answered with an error. */
export class GitError extends Error {
  override readonly name = 'GitError';
}

/**
 * Variables with which a caller (a hook, a rebase) points git at a repository. They are taken
 * out of the environment: the repository a guard reads is the one `root` lies in, nothing else.
 */
const LOCATING = new Set([
  'GIT_DIR',
  'GIT_WORK_TREE',
  'GIT_INDEX_FILE',
  'GIT_COMMON_DIR',
  'GIT_OBJECT_DIRECTORY',
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_NAMESPACE',
  'GIT_PREFIX',
]);

function environment(): NodeJS.ProcessEnv {
  return Object.fromEntries(Object.entries(process.env).filter(([name]) => !LOCATING.has(name)));
}

/** What a failed start of a program left behind on its error output, if anything. */
function errorOutput(error: unknown): string {
  const stderr: unknown =
    typeof error === 'object' && error !== null ? Reflect.get(error, 'stderr') : undefined;
  return typeof stderr === 'string' ? stderr.trim() : '';
}

/** Runs git in `root` and returns what it prints. Throws a `GitError` when git fails. */
export function git(root: string, args: readonly string[]): string {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      env: environment(),
      maxBuffer: 256 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const reason = errorOutput(error) || (error instanceof Error ? error.message : String(error));
    throw new GitError(`git ${args[0] ?? ''} failed in ${root}: ${reason}`);
  }
}

/**
 * The full hash of the commit a name stands for (a branch, a tag, a hash, `HEAD`), or undefined
 * if this clone has no such commit. A name that starts with a dash is a name, never an option.
 */
export function resolveCommit(root: string, name: string): string | undefined {
  try {
    const hash = git(root, [
      'rev-parse',
      '--verify',
      '--quiet',
      '--end-of-options',
      `${name}^{commit}`,
    ]).trim();
    return hash === '' ? undefined : hash;
  } catch {
    return undefined;
  }
}

/** Paths as git prints them with `-z`: separated by NUL, never quoted. */
export function pathList(output: string): string[] {
  return output.split('\0').filter((path) => path !== '');
}

/** A full hash: 40 hex digits, or 64 in a repository that uses SHA-256. */
const FULL_HASH = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;

/**
 * Reads one commit by its full hash: its parents, its message and the paths it changes. Only
 * the plumbing of git is used, so no setting of the machine (how a log is shown, whether moved
 * files are detected) changes what is read.
 */
export function readCommit(root: string, hash: string): GitCommit {
  if (!FULL_HASH.test(hash)) {
    throw new GitError(`«${hash}» is not the full hash of a commit`);
  }
  // The commit as git stores it: header lines, an empty line, the message.
  const stored = git(root, ['cat-file', 'commit', hash]);
  const cut = stored.indexOf('\n\n');
  const header = cut === -1 ? stored : stored.slice(0, cut);
  const parents = header
    .split('\n')
    .filter((line) => line.startsWith('parent '))
    .map((line) => line.slice('parent '.length).trim());
  const paths =
    parents.length > 1
      ? []
      : pathList(
          git(root, [
            'diff-tree',
            '--no-commit-id',
            '--name-only',
            '-r',
            // The first commit has no parent: its paths are all it holds.
            '--root',
            // A moved file is listed as a deleted and an added one: both paths, whatever git
            // would guess about their likeness.
            '--no-renames',
            '-z',
            hash,
          ]),
        ).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return { hash, parents, message: cut === -1 ? '' : stored.slice(cut + 2), paths };
}

/** A hash of zeros: what a hosting service sends as «the commit before» of a new branch. */
const NO_COMMIT = /^(?:0{40}|0{64})$/;

/** HEAD on its own. */
function headAlone(root: string, head: string, why: string): CommitRange {
  return {
    base: undefined,
    commits: [readCommit(root, head)],
    note: `${why}: HEAD (${head.slice(0, 7)}) is read on its own`,
  };
}

/**
 * The commits to look at: everything after a base up to HEAD (`<base>..HEAD`), oldest first.
 *
 * - `base` is a branch, a tag or a hash. If this clone has no such commit, or the base and HEAD
 *   share no history (a shallow clone), this throws: a guard must fail then, not pass on nothing.
 * - `base` is undefined or empty: `fallback` is the base, if this clone has it. Without it (a
 *   clone without that remote branch) HEAD is read on its own.
 * - `base` is a hash of zeros (a new branch has no commit before its first push): HEAD is read on
 *   its own. Nothing says where the branch started, and its tip is the one commit that is new for
 *   certain.
 *
 * Commits that are not yet made (the working tree, the index) are not part of any range.
 */
export function readCommitRange(
  root: string,
  base: string | undefined,
  fallback = 'origin/main',
): CommitRange {
  let head: string;
  try {
    head = git(root, ['rev-parse', '--verify', 'HEAD^{commit}']).trim();
  } catch (error) {
    // No git, no repository, or a repository without a commit: git says which.
    const reason = error instanceof Error ? error.message : String(error);
    throw new GitError(`there is no commit to read at HEAD: ${reason}`);
  }
  const wanted = base?.trim() ?? '';
  if (NO_COMMIT.test(wanted)) {
    return headAlone(root, head, 'the base is a hash of zeros (a new branch)');
  }
  const name = wanted === '' ? fallback : wanted;
  const hash = resolveCommit(root, name);
  if (hash === undefined) {
    if (wanted === '') {
      return headAlone(root, head, `no base is set and this clone has no ${fallback}`);
    }
    throw new GitError(
      `the base «${wanted}» is not a commit in this clone (a typo, a branch that was not fetched, or a commit that a forced push removed)`,
    );
  }
  try {
    git(root, ['merge-base', hash, head]);
  } catch {
    throw new GitError(
      `the base «${name}» and HEAD have no common commit in this clone (a shallow clone? fetch the full history)`,
    );
  }
  const hashes = git(root, ['rev-list', '--reverse', '--topo-order', head, `^${hash}`])
    .split('\n')
    .filter(Boolean);
  const count = `${hashes.length} ${hashes.length === 1 ? 'commit' : 'commits'}`;
  // A base that was given as a hash needs no hash beside it.
  const shown = hash.startsWith(name) ? hash.slice(0, 7) : `${name} (${hash.slice(0, 7)})`;
  return {
    base: { name, hash },
    commits: hashes.map((each) => readCommit(root, each)),
    note: `${count} after ${shown} up to HEAD (${head.slice(0, 7)})`,
  };
}

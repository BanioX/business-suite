import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * The files of the repository, as the guards read them: every guard that looks at «the whole
 * repository» takes its files from here, so all of them agree on what the repository is.
 *
 * What is left out is what never reaches the public repository or is not ours to read: the Git
 * store, installed packages and the output of builds and test runs (the same list as
 * `.gitignore`). Everything else counts, also files without an extension and dot files.
 *
 * Text is told from binary by the content, not by the name. That alone would let one stray NUL
 * byte hide a file from every guard, so a file taken for binary must also be of a binary kind
 * (`unreadFileProblems`); the guard of the public repository holds the whole repository to it.
 */

/** A text file of the repository. */
export interface RepoFile {
  /** Path from the root of the repository, with forward slashes. */
  path: string;
  text: string;
}

/** What a guard reports: where, and what is wrong there. */
export interface Problem {
  path: string;
  /** 1 for the first line; 0 when the finding is about the file as a whole or its path. */
  line: number;
  message: string;
}

/** A problem as one line, the way editors and logs link to a place: `path:line: message`. */
export function formatProblem(problem: Problem): string {
  const place = problem.line === 0 ? problem.path : `${problem.path}:${problem.line}`;
  return `${place}: ${problem.message}`;
}

/** The root of the repository these tools live in. */
export const REPO_ROOT = resolve(import.meta.dirname, '..', '..');

/** Directories that are skipped wherever they stand. */
export const SKIPPED_DIRS: ReadonlySet<string> = new Set([
  '.git',
  'node_modules',
  'coverage',
  'dist',
  'dev-dist',
  'playwright-report',
  'test-results',
  '.previews',
  '.wrangler',
]);

/** Directories that are skipped at exactly this path: copies of the repository for subagents. */
export const SKIPPED_PATHS: ReadonlySet<string> = new Set(['.claude/worktrees']);

/**
 * Files whose text is not read, by name: the lockfile names thousands of packages, none of them
 * written by us, and is checked by the licence check instead.
 */
export const SKIPPED_FILES: ReadonlySet<string> = new Set(['pnpm-lock.yaml']);

/** Build output that is text but not written by anyone. */
const SKIPPED_SUFFIXES = ['.tsbuildinfo'];

/** How many bytes are looked at to tell text from binary (the same test as Git: a NUL byte). */
const SNIFFED_BYTES = 8000;

/** Plain comparison by code unit: the same order on every machine, whatever its language. */
export function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function walk(root: string, dir: string): string[] {
  return readdirSync(dir === '' ? root : join(root, dir), { withFileTypes: true }).flatMap(
    (entry) => {
      const path = dir === '' ? entry.name : `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        return SKIPPED_DIRS.has(entry.name) || SKIPPED_PATHS.has(path) ? [] : walk(root, path);
      }
      // Symbolic links and other special entries are not followed: a link out of the repository
      // is not part of it.
      return entry.isFile() ? [path] : [];
    },
  );
}

/**
 * Every file of the repository below `under` (a directory from the root, '' for all), as paths
 * from the root with forward slashes, sorted. A directory that does not exist has no files.
 */
export function listFiles(root: string, under = ''): string[] {
  const start = under.replace(/^\.?\/+|\/+$/g, '');
  if (!existsSync(start === '' ? root : join(root, start))) {
    return [];
  }
  return walk(root, start).sort(byCodeUnit);
}

/** True if the content is binary: it holds a NUL byte near its start. */
export function isBinary(bytes: Uint8Array): boolean {
  return bytes.subarray(0, SNIFFED_BYTES).includes(0);
}

/** True if a guard reads the text of this file (see `SKIPPED_FILES`). */
function isRead(path: string): boolean {
  const name = path.slice(path.lastIndexOf('/') + 1);
  return !SKIPPED_FILES.has(name) && !SKIPPED_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

/** The content of a file, or undefined if it was removed since the directory was listed. */
function bytesOf(file: string): Buffer | undefined {
  try {
    return readFileSync(file);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

/** The files of the repository as the guards see them: the text of some, of the others the path. */
export interface ReadFiles {
  /** Every text file with its content, sorted by path. */
  text: RepoFile[];
  /**
   * The files whose content is binary, sorted. No guard reads what is in them, so each must be
   * of a kind that holds no text (`unreadFileProblems`).
   */
  binary: string[];
}

/**
 * Every file of the repository below `under`: the text files with their content (a byte order
 * mark is removed), the binary ones by their path. A file that disappears while the repository
 * is read (another process is writing) is left out: it is not there.
 */
export function readFiles(root: string, under = ''): ReadFiles {
  const text: RepoFile[] = [];
  const binary: string[] = [];
  for (const path of listFiles(root, under).filter(isRead)) {
    const bytes = bytesOf(join(root, path));
    if (bytes === undefined) {
      continue;
    }
    if (isBinary(bytes)) {
      binary.push(path);
      continue;
    }
    const content = bytes.toString('utf8');
    text.push({ path, text: content.startsWith('\uFEFF') ? content.slice(1) : content });
  }
  return { text, binary };
}

/**
 * Every text file of the repository below `under`, with its content, sorted by path. Binary
 * files (images, fonts) are left out; `readFiles` names them.
 */
export function readTextFiles(root: string, under = ''): RepoFile[] {
  return readFiles(root, under).text;
}

/**
 * The kinds of files that are binary by nature (by the end of their name, lower case): pictures,
 * fonts and PDF. Only these may be left unread. A new kind gets its line here on purpose.
 */
export const BINARY_KINDS: ReadonlySet<string> = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'avif',
  'ico',
  'woff',
  'woff2',
  'ttf',
  'otf',
  'pdf',
]);

/**
 * A file that was taken for binary and is not of a binary kind is a text file no guard has
 * read: one NUL byte near its start (or an encoding other than UTF-8) would hide a whole source
 * file or document from every check. So each such file is a problem.
 */
export function unreadFileProblems(binary: readonly string[]): Problem[] {
  return binary
    .filter((path) => {
      const name = path.slice(path.lastIndexOf('/') + 1);
      const dot = name.lastIndexOf('.');
      return dot === -1 || !BINARY_KINDS.has(name.slice(dot + 1).toLowerCase());
    })
    .map((path) => ({
      path,
      line: 0,
      message:
        'holds a NUL byte near its start, so the guards take it for binary and do not read it: ' +
        'write it as UTF-8 text, or (a new kind of picture or font) add its kind to BINARY_KINDS in tools/src/repo-files.ts',
    }));
}

/**
 * The lines of a text, without their line ends. The last line of a file that ends with a line
 * break is not a line of its own.
 */
export function linesOf(text: string): string[] {
  const lines = text.split(/\r?\n/);
  if (lines.at(-1) === '') {
    lines.pop();
  }
  return lines;
}

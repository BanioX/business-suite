import {
  occurrences,
  parseRegister,
  registerProblems,
  sideEffectProblems,
  type SourceFile,
} from '@onestrand/testing';
import { linesOf, type Problem, type RepoFile } from './repo-files.ts';

/**
 * The register of side effects against the code (CLAUDE.md, «Daten bleiben auf dem Gerät»;
 * acceptance of W0-01). Whatever shipped code does outside itself (network, storage of the
 * device, camera, printing, sharing, files) must stand in `docs/nebenwirkungen.md`, and a request
 * to a server needs the decision of the product owner there.
 *
 * The rules live in `@onestrand/testing` (`side-effects.ts`), where an edition uses them for its
 * own test. This module says which files of the repository are shipped code, and turns the
 * findings into the problems of a guard.
 *
 * What it does not check yet: the storage keys of an edition (`storageKeyProblems`). They need
 * the prefix of each edition, and there is no edition yet.
 */

/** The register, from the root of the repository. */
export const SIDE_EFFECTS_DOCUMENT = 'docs/nebenwirkungen.md';

/** The roots under which code is shipped with an app, or runs as a service. */
const SHIPPED_ROOTS = ['platform', 'industries', 'editions', 'services'] as const;

/** Code, and the page of an app: an `<input type="file">` in markup is a side effect too. */
const SHIPPED_FILE = /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs|html)$/;

/** Directories whose files are never shipped, wherever they stand. */
const NOT_SHIPPED_DIRS: ReadonlySet<string> = new Set(['test', 'tests', 'e2e', 'scripts']);

/** Files that are never shipped: tests beside the code, and the configuration of tools. */
const NOT_SHIPPED_FILE = /(?:\.(?:test|spec)\.[a-z]+|\.config\.[a-z]+|\.d\.ts)$/;

/**
 * The package of test helpers is never shipped, and it names every kind in order to find it.
 * Nothing else is left out by name: an exception for a package would be a blind spot.
 */
const NOT_SHIPPED_PACKAGE = 'platform/testing/';

/**
 * True for a file of shipped code: code or markup under `platform/`, `industries/`, `editions/`
 * or `services/`, outside the tests and the configuration of a package.
 */
export function isShippedSource(path: string): boolean {
  const parts = path.split('/');
  const [root = ''] = parts;
  return (
    (SHIPPED_ROOTS as readonly string[]).includes(root) &&
    parts.length > 2 &&
    SHIPPED_FILE.test(path) &&
    !NOT_SHIPPED_FILE.test(path) &&
    !path.startsWith(NOT_SHIPPED_PACKAGE) &&
    !parts.slice(0, -1).some((part) => NOT_SHIPPED_DIRS.has(part))
  );
}

/** The shipped code among the files of the repository, as the standard test reads it. */
export function shippedSources(files: readonly RepoFile[]): SourceFile[] {
  return files
    .filter((file) => isShippedSource(file.path))
    .map((file) => ({ path: file.path, code: file.text }));
}

/** The line of the register that holds the row with this id; 0 if there is none. */
function lineOfRow(register: string, id: string): number {
  return linesOf(register).findIndex((line) => line.split('|')[1]?.trim() === id) + 1;
}

/**
 * Everything that is wrong with the register and between the register and the code. `files` are
 * the text files of the repository, `register` is the text of `docs/nebenwirkungen.md`, or
 * undefined if the file is missing.
 *
 * A finding in the register stands at its row; a finding in the code stands at the first file
 * the kind occurs in, and its message names them all.
 */
export function sideEffectGuardProblems(input: {
  files: readonly RepoFile[];
  register: string | undefined;
}): Problem[] {
  const { register } = input;
  if (register === undefined) {
    return [
      {
        path: SIDE_EFFECTS_DOCUMENT,
        line: 0,
        message: 'The register of side effects is missing, so no code can be checked against it',
      },
    ];
  }
  const inRegister = registerProblems(register).map((problem) => ({
    path: SIDE_EFFECTS_DOCUMENT,
    line: lineOfRow(register, problem.subject),
    message: problem.message,
  }));
  const found = occurrences(shippedSources(input.files));
  const inCode = sideEffectProblems(found, parseRegister(register)).map((problem) => ({
    path: problem.paths[0] ?? SIDE_EFFECTS_DOCUMENT,
    line: 0,
    message: problem.message,
  }));
  return [...inRegister, ...inCode];
}

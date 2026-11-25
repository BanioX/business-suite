// Origin: BanioX/Randen scripts/check-licenses.mjs @ e0f0907 — adapted: SPDX expressions with nesting, judgement exported for tests, loud failure when the list cannot be read
// Fails when the licence of a dependency could limit commercial use of the suite (CLAUDE.md,
// hard rules). Runtime code (shipped to users) must be permissive; tooling may use weak
// copyleft (e.g. MPL-2.0 in build tools) but never strong copyleft such as GPL or AGPL.
//
// The judgement is pure and exported (tools/test/check-licenses.test.ts); pnpm is asked for the
// list only when this file runs as a script.
import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// SPDX identifiers compare without regard to case.
const PERMISSIVE = new Set(
  [
    'MIT',
    'Apache-2.0',
    'ISC',
    'BSD-2-Clause',
    'BSD-3-Clause',
    '0BSD',
    'BlueOak-1.0.0',
    'CC0-1.0',
    'Unlicense',
    'Zlib',
    'OFL-1.1',
  ].map((id) => id.toLowerCase()),
);
/**
 * The families of strong copyleft: by their short name, and the GNU licences also by their long
 * one. A package.json may hold anything as its licence, not only SPDX: «GPLv3», «GPL3» and «GNU
 * General Public License v3» are found like «GPL-3.0-only». A short name ends at a word border or
 * at its version («v3», «3»), so «GPLX-1.0» is no member of the family.
 */
const STRONG_COPYLEFT =
  /\b(?:A?GPL|LGPL|SSPL|EUPL|OSL|CPAL)(?:\b|v?\d)|\bgeneral public licen[cs]e\b/i;

/** The operators of an SPDX expression; the standard allows them in upper or in lower case. */
const OPERATOR = new Map([
  ['AND', 'AND'],
  ['and', 'AND'],
  ['OR', 'OR'],
  ['or', 'OR'],
  ['WITH', 'WITH'],
  ['with', 'WITH'],
]);
/** A licence or exception identifier; a trailing `+` means «or any later version». */
const IDENTIFIER = /^[A-Za-z0-9.-]+\+?$/;

class NotSpdx extends Error {}

const some = (parts) => parts.some(Boolean);
const every = (parts) => parts.every(Boolean);

/**
 * Evaluates an SPDX licence expression such as «(MIT OR Apache-2.0) AND ISC». `leaf` judges one
 * licence identifier, `or` combines the sides of an OR, `and` those of an AND. Precedence as in
 * SPDX: WITH binds tighter than AND, AND tighter than OR; parentheses nest. An exception after
 * WITH only adds permissions, so the licence before it decides.
 *
 * Returns undefined for text that is not a well-formed expression, so the caller decides what
 * an unreadable licence means instead of this function guessing.
 */
function evaluate(expression, { leaf, or, and }) {
  const tokens = expression.match(/[()]|[^\s()]+/g) ?? [];
  let at = 0;

  function identifier() {
    const token = tokens[at];
    if (token === undefined || !IDENTIFIER.test(token) || OPERATOR.has(token)) {
      throw new NotSpdx();
    }
    at += 1;
    return token;
  }
  function atom() {
    if (tokens[at] === '(') {
      at += 1;
      const inner = alternatives();
      if (tokens[at] !== ')') {
        throw new NotSpdx();
      }
      at += 1;
      return inner;
    }
    const verdict = leaf(identifier().replace(/\+$/, ''));
    if (OPERATOR.get(tokens[at]) === 'WITH') {
      at += 1;
      identifier();
    }
    return verdict;
  }
  function sequence(operator, part) {
    const parts = [part()];
    while (OPERATOR.get(tokens[at]) === operator) {
      at += 1;
      parts.push(part());
    }
    return parts;
  }
  function conjunction() {
    return and(sequence('AND', atom));
  }
  function alternatives() {
    return or(sequence('OR', conjunction));
  }

  try {
    const verdict = alternatives();
    return at === tokens.length ? verdict : undefined;
  } catch (error) {
    if (error instanceof NotSpdx) {
      return undefined;
    }
    throw error;
  }
}

/**
 * True when the expression lets us use the package under permissive terms only: «MIT OR
 * GPL-3.0-only» lets us pick MIT, so one permissive choice is enough; «MIT AND Zlib» means both
 * apply, so both must be permissive. Text that is not an SPDX expression is never permissive.
 *
 * @param {string} expression
 * @returns {boolean}
 */
export function permissive(expression) {
  const leaf = (id) => PERMISSIVE.has(id.toLowerCase());
  return evaluate(expression, { leaf, or: some, and: every }) ?? false;
}

/**
 * True when strong copyleft cannot be avoided: every choice of an OR is strong copyleft, or one
 * part of an AND is. Text that is not an SPDX expression counts as soon as it mentions one of
 * the families.
 *
 * @param {string} expression
 * @returns {boolean}
 */
export function strongCopyleft(expression) {
  const leaf = (id) => STRONG_COPYLEFT.test(id);
  return evaluate(expression, { leaf, or: every, and: some }) ?? STRONG_COPYLEFT.test(expression);
}

const names = (packages) => packages.map((item) => item.name).join(', ');

/**
 * The verdict over the two lists of `pnpm licenses list --json`, each shaped
 * `{ "<licence>": [{ name, … }] }`: `runtime` is what ships (`--prod`), `all` includes the
 * tooling. Returns one line per licence that is not allowed; empty when all is well.
 *
 * @param {{ runtime: Record<string, { name: string }[]>, all: Record<string, { name: string }[]> }} lists
 * @returns {string[]}
 */
export function licenceProblems({ runtime, all }) {
  const problems = [];
  const reported = new Set();
  for (const [licence, packages] of Object.entries(runtime)) {
    if (!permissive(licence)) {
      problems.push(`runtime  ${licence}: ${names(packages)}`);
      for (const { name } of packages) {
        reported.add(`${licence}\n${name}`);
      }
    }
  }
  for (const [licence, packages] of Object.entries(all)) {
    // What ships is part of `all` too: one line per package is enough.
    const tooling = packages.filter(({ name }) => !reported.has(`${licence}\n${name}`));
    if (strongCopyleft(licence) && tooling.length > 0) {
      problems.push(`tooling  ${licence}: ${names(tooling)}`);
    }
  }
  return problems;
}

/** What pnpm prints instead of JSON when a project has no dependency at all. */
const NO_DEPENDENCIES = 'No licenses in packages found';

const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Reads the answer of `pnpm licenses list --json`. Anything that is not the expected list is an
 * error: an answer this script does not understand must not count as «no problems».
 *
 * @param {string} output
 * @returns {Record<string, { name: string }[]>}
 */
export function parseLicenceList(output) {
  if (output.trim() === NO_DEPENDENCIES) {
    return {};
  }
  let parsed;
  try {
    parsed = JSON.parse(output);
  } catch {
    throw new Error('the answer of pnpm is not JSON');
  }
  const listed =
    isRecord(parsed) &&
    Object.values(parsed).every(
      (packages) =>
        Array.isArray(packages) &&
        packages.every((item) => isRecord(item) && typeof item.name === 'string'),
    );
  if (!listed) {
    throw new Error('the answer of pnpm is not a list of licences with their packages');
  }
  return parsed;
}

const root = fileURLToPath(new URL('..', import.meta.url));
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

/** Asks pnpm for the licences of the dependencies: of what ships, or of everything. */
function licenceList(production) {
  const args = ['licenses', 'list', '--json', ...(production ? ['--prod'] : [])];
  const shown = `${pnpm} ${args.join(' ')}`;
  const result = spawnSync(pnpm, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  if (result.error !== undefined) {
    throw new Error(`could not start «${shown}»: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const detail = `${result.stdout}${result.stderr}`.trim();
    throw new Error(`«${shown}» failed (${String(result.status ?? result.signal)}): ${detail}`);
  }
  try {
    return parseLicenceList(result.stdout);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`«${shown}»: ${message}`, { cause: error });
  }
}

/** Returns the exit code: 0 all well, 1 a licence that is not allowed, 2 the check could not run. */
function main() {
  let problems;
  try {
    problems = licenceProblems({ runtime: licenceList(true), all: licenceList(false) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`licenses:check could not read the licences: ${message}`);
    return 2;
  }
  if (problems.length > 0) {
    console.error(`Licences that could limit commercial use:\n${problems.join('\n')}`);
    return 1;
  }
  process.stdout.write('Licences OK: runtime permissive, no strong copyleft anywhere.\n');
  return 0;
}

/**
 * True when this file is what node was started with (`node tools/check-licenses.mjs`), false
 * when a test imports the judgement. Real paths on both sides, so a symlink on the way cannot
 * turn the check into a silent no-op.
 */
function runsAsScript() {
  const started = process.argv[1];
  if (started === undefined) {
    return false;
  }
  try {
    return realpathSync(started) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    // Started with something that is not a file: not with this one.
    return false;
  }
}

if (runsAsScript()) {
  process.exitCode = main();
}

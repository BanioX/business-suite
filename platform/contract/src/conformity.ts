import { z } from 'zod';
import { ACCESS_LEVELS, OPERATION_NAME_PATTERN, type Operation } from './operation';

/**
 * Checks of an operation at runtime. The types catch most mistakes where a contract is written;
 * these functions catch the rest (a contract put together without types, a cast, a typo in a
 * key) where contracts are composed and in the conformity tests of every module and industry.
 * They return problems as data and are cheap enough to run at the start of the app.
 */

/** Which part of an operation a problem is in. */
export type OperationProblemPart =
  | 'fragment'
  | 'operation'
  | 'key'
  | 'name'
  | 'kind'
  | 'summary'
  | 'access'
  | 'access.feature'
  | 'access.level'
  | 'access.rights'
  | 'input'
  | 'output';

export interface OperationProblem {
  /** The name of the operation; without a name its key in the fragment, else `?`. */
  operation: string;
  part: OperationProblemPart;
  /** For the person who fixes it: what is wrong and what is expected. */
  message: string;
}

const UNNAMED = '?';

/**
 * An id of the feature register or of a delicate right: words of letters, digits and
 * underscores, each starting with a lower-case letter, joined by dots for a namespace
 * (`customers`, `facility.keys`, `export_delete`). The registers themselves decide which ids
 * exist; here only the form is checked.
 */
const ACCESS_ID_PATTERN = /^[a-z][a-zA-Z0-9_]*(?:\.[a-z][a-zA-Z0-9_]*)*$/;

/** The fields `access` may have. An unknown one is a problem: a typo in `rights` would drop a right without a sound. */
const ACCESS_FIELDS: ReadonlySet<string> = new Set(['feature', 'level', 'rights']);

const LEVELS: readonly string[] = ACCESS_LEVELS;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isList(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

/** A record written as an object literal (or a module namespace), not a map or another class. */
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** A value in a few words, for a message. */
function describe(value: unknown): string {
  if (value === undefined) {
    return 'nothing';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'string') {
    return `«${value}»`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (isList(value)) {
    return 'a list';
  }
  return typeof value === 'object' ? 'an object' : `a ${typeof value}`;
}

/** The name of the operation if it has one, else the fallback. */
function labelOf(operation: unknown, fallback: string): string {
  return isRecord(operation) && typeof operation.name === 'string' && operation.name !== ''
    ? operation.name
    : fallback;
}

type PartProblem = readonly [part: OperationProblemPart, message: string];

function accessProblems(access: unknown, kind: unknown): PartProblem[] {
  if (access === undefined) {
    return [
      ['access', 'access is missing: every operation declares the feature and level it needs'],
    ];
  }
  if (!isRecord(access)) {
    return [['access', `access must be { feature, level, rights? }, got ${describe(access)}`]];
  }
  const problems: PartProblem[] = [];
  for (const field of Object.keys(access)) {
    if (!ACCESS_FIELDS.has(field)) {
      problems.push(['access', `access has the unknown field «${field}»`]);
    }
  }
  if (typeof access.feature !== 'string' || !ACCESS_ID_PATTERN.test(access.feature)) {
    problems.push([
      'access.feature',
      `feature must be an id of the feature register such as «customers», got ${describe(access.feature)}`,
    ]);
  }
  if (typeof access.level !== 'string' || !LEVELS.includes(access.level)) {
    problems.push([
      'access.level',
      `level must be one of ${LEVELS.join(', ')}, got ${describe(access.level)}`,
    ]);
  } else if (kind === 'command' && access.level === 'view') {
    problems.push([
      'access.level',
      'a command changes data and needs the level «operate» or «manage», not «view»',
    ]);
  }
  if (access.rights !== undefined) {
    problems.push(...rightsProblems(access.rights));
  }
  return problems;
}

function rightsProblems(rights: unknown): PartProblem[] {
  if (!isList(rights)) {
    return [['access.rights', `rights must be a list of ids of rights, got ${describe(rights)}`]];
  }
  const problems: PartProblem[] = [];
  const counts = new Map<string, number>();
  for (const right of rights) {
    if (typeof right !== 'string' || !ACCESS_ID_PATTERN.test(right)) {
      problems.push([
        'access.rights',
        `a right must be an id such as «export_delete», got ${describe(right)}`,
      ]);
      continue;
    }
    const count = (counts.get(right) ?? 0) + 1;
    counts.set(right, count);
    // Reported once, at the first repeat.
    if (count === 2) {
      problems.push(['access.rights', `the right «${right}» is listed more than once`]);
    }
  }
  return problems;
}

function problemsOf(operation: unknown, label: string): OperationProblem[] {
  const problem = ([part, message]: PartProblem): OperationProblem => ({
    operation: label,
    part,
    message,
  });
  if (!isRecord(operation)) {
    return [problem(['operation', `expected an operation, got ${describe(operation)}`])];
  }
  const problems: PartProblem[] = [];
  if (typeof operation.name !== 'string' || !OPERATION_NAME_PATTERN.test(operation.name)) {
    problems.push([
      'name',
      `name must be two to four segments of letters and digits joined by dots, each starting with a lower-case letter, such as «customers.create»; got ${describe(operation.name)}`,
    ]);
  }
  if (operation.kind !== 'command' && operation.kind !== 'query') {
    problems.push(['kind', `kind must be «command» or «query», got ${describe(operation.kind)}`]);
  }
  if (typeof operation.summary !== 'string' || operation.summary.trim() === '') {
    problems.push([
      'summary',
      `summary must say in English what the operation does, got ${describe(operation.summary)}`,
    ]);
  }
  problems.push(...accessProblems(operation.access, operation.kind));
  for (const side of ['input', 'output'] as const) {
    if (!(operation[side] instanceof z.ZodType)) {
      problems.push([side, `${side} must be a Zod schema, got ${describe(operation[side])}`]);
    }
  }
  return problems.map(problem);
}

/**
 * Everything that is wrong with the form of one operation: its name, its kind, its summary, its
 * access (present, well formed, and never «view» for a command) and its two schemas. An empty
 * list means the value is an operation.
 */
export function operationProblems(operation: unknown): OperationProblem[] {
  return problemsOf(operation, labelOf(operation, UNNAMED));
}

/** Throws a `TypeError` that lists every problem of the operation; returns if there is none. */
export function assertOperation(operation: unknown): asserts operation is Operation {
  const problems = operationProblems(operation);
  const [first] = problems;
  if (first !== undefined) {
    throw new TypeError(
      `Operation ${first.operation} is not well formed: ${problems.map((problem) => problem.message).join('; ')}`,
    );
  }
}

/**
 * Everything that is wrong with a fragment: the problems of each of its operations, and every
 * operation that is filed under a key other than its name. A fragment whose keys equal the
 * names cannot hold the same operation twice, and two fragments can be merged by key.
 */
export function fragmentProblems(fragment: unknown): OperationProblem[] {
  if (!isPlainRecord(fragment)) {
    return [
      {
        operation: UNNAMED,
        part: 'fragment',
        message: `expected a plain record of operations by name, got ${describe(fragment)}`,
      },
    ];
  }
  return Object.entries(fragment).flatMap(([key, operation]) => {
    const label = labelOf(operation, key);
    const problems = problemsOf(operation, label);
    if (isRecord(operation) && typeof operation.name === 'string' && operation.name !== key) {
      problems.push({
        operation: label,
        part: 'key',
        message: `the key «${key}» must equal the name of the operation, «${operation.name}»`,
      });
    }
    return problems;
  });
}

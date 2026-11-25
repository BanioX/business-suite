import { fragmentProblems } from './conformity';
import type { OperationProblemPart } from './conformity';
import type { ContractFragment } from './operation';

/**
 * The contract of an edition is the sum of the fragments of its modules and industries; no
 * fixed sum lives in the platform (suite ADR-0004, 2). This file puts the fragments together and
 * refuses what cannot be one contract: an operation that two parts bring, and an operation that
 * is not well formed. Like every check of the contract, the problems come as data first
 * (`composeProblems`); `composeContract` throws only when there is one.
 */

/** A fragment and where it comes from: the id of the module or industry that owns it. */
export interface ContractPart {
  /** Names the owner in a problem, e.g. `business` or `muster`. */
  readonly source: string;
  readonly fragment: ContractFragment;
}

/**
 * What can be wrong with the parts of a contract.
 *
 * - `invalid_part`: the part is no `{ source, fragment }`, its source is empty, or its fragment
 *   is no record of operations.
 * - `invalid_operation`: an operation of a fragment is not well formed (`fragmentProblems`:
 *   name, kind, summary, access, schemas, key).
 * - `duplicate_operation`: two parts bring an operation of the same name.
 */
export const COMPOSE_PROBLEM_CODES = [
  'invalid_part',
  'invalid_operation',
  'duplicate_operation',
] as const;
export type ComposeProblemCode = (typeof COMPOSE_PROBLEM_CODES)[number];

export interface ComposeProblem {
  code: ComposeProblemCode;
  /** The name of the operation; `?` where the problem is with a whole part. */
  operation: string;
  /** Who brought it: for a duplicate every part that has it, in the order of the parts. */
  sources: readonly string[];
  /** For `invalid_operation`: which part of the operation is wrong. */
  part?: OperationProblemPart;
  /** For the person who fixes it, in English. */
  message: string;
}

/** Every code of an error of the composer: the problems above. */
export class ComposeError extends Error {
  readonly code: ComposeProblemCode;
  /** Every problem found: the first decides the code. */
  readonly problems: readonly ComposeProblem[];

  constructor(code: ComposeProblemCode, message: string, problems: readonly ComposeProblem[]) {
    super(message);
    this.name = 'ComposeError';
    this.code = code;
    this.problems = problems;
  }
}

type UnionToIntersection<TUnion> = (
  TUnion extends unknown ? (value: TUnion) => void : never
) extends (value: infer TIntersection) => void
  ? TIntersection
  : never;

/**
 * The type of the sum of the parts given as a tuple: every operation of every fragment, by name.
 * For a list whose members are not known one by one it is a plain `ContractFragment`.
 */
export type ComposedContract<TParts extends readonly ContractPart[]> = [TParts[number]] extends [
  never,
]
  ? ContractFragment
  : Readonly<UnionToIntersection<TParts[number]['fragment']>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Everything that is wrong with the parts of a contract, as data, and nothing thrown: a part
 * that is none, every operation that is not well formed, and every operation that two parts
 * bring (named once, with every part that has it). An empty list means `composeContract` works.
 */
export function composeProblems(parts: unknown): ComposeProblem[] {
  if (!Array.isArray(parts)) {
    return [
      {
        code: 'invalid_part',
        operation: '?',
        sources: [],
        message: 'the parts of a contract must be a list of { source, fragment }',
      },
    ];
  }
  const problems: ComposeProblem[] = [];
  const bringers = new Map<string, string[]>();
  parts.forEach((part: unknown, index) => {
    if (!isRecord(part) || typeof part.source !== 'string' || part.source.trim() === '') {
      problems.push({
        code: 'invalid_part',
        operation: '?',
        sources: [],
        message: `part ${String(index)} needs a source: the id of the module or industry that owns the fragment`,
      });
      return;
    }
    const { source, fragment } = part;
    const found = fragmentProblems(fragment);
    for (const problem of found) {
      problems.push({
        code: problem.part === 'fragment' ? 'invalid_part' : 'invalid_operation',
        operation: problem.operation,
        sources: [source],
        ...(problem.part === 'fragment' ? {} : { part: problem.part }),
        message: `${source}: ${problem.message}`,
      });
    }
    if (found.some((problem) => problem.part === 'fragment')) {
      return;
    }
    // An operation filed under another key than its name is reported above; the key decides here.
    for (const name of Object.keys(fragment as ContractFragment)) {
      bringers.set(name, [...(bringers.get(name) ?? []), source]);
    }
  });
  for (const [name, sources] of bringers) {
    if (sources.length > 1) {
      problems.push({
        code: 'duplicate_operation',
        operation: name,
        sources,
        message: `the operation ${name} comes from ${sources.map((source) => `"${source}"`).join(' and from ')}: every operation has one owner`,
      });
    }
  }
  return problems;
}

/**
 * Puts the fragments of an edition together into one contract, by operation name. Throws a
 * `ComposeError` with the code of the first problem if a fragment is not well formed or two
 * parts bring the same operation (`composeProblems` lists them all, with both owners). The
 * result is frozen; the operations are the ones of the fragments, not copies.
 */
export function composeContract<const TParts extends readonly ContractPart[]>(
  parts: TParts,
): ComposedContract<TParts> {
  const problems = composeProblems(parts);
  const [first] = problems;
  if (first !== undefined) {
    throw new ComposeError(
      first.code,
      `The contract cannot be put together: ${problems.map((problem) => problem.message).join('; ')}`,
      problems,
    );
  }
  const composed: Record<string, ContractFragment[string]> = {};
  for (const { fragment } of parts) {
    Object.assign(composed, fragment);
  }
  return Object.freeze(composed) as ComposedContract<TParts>;
}

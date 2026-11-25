import { RIGHT_ID_PATTERN } from '@onestrand/contract';
import { FEATURE_SEGMENT_PATTERN, namespaceOf } from '@onestrand/features';

/**
 * The register of delicate rights (suite ADR-0004, 6; rule R-4). A delicate right is a switch of
 * its own, on top of the level in a function: seeing wages, correcting the time of others,
 * exporting and deleting. The platform holds no fixed list: every package and every industry
 * enters its own, an edition puts them together with `createRightRegistry`, and `extend` adds
 * more. Operations name rights in `access.rights`, profiles hold them, the filter for other
 * devices asks for them.
 *
 * An id follows `RIGHT_ID_PATTERN` of the contract. An id with a namespace (`facility.access_notes`)
 * belongs to the industry of that name, an id without one to the platform; nobody enters a right
 * into a namespace that is not their own. A register is a value: it is never changed after
 * creation, `extend` returns a new one. It holds no text: the name and the sentence of a right
 * live in the language catalogues under the same id.
 */

/**
 * What is wrong with the entries of a register of rights, as a code. A check returns these as
 * data (`RightProblem`); building a register throws a `RightError` with the code of the first.
 *
 * - `invalid_entry`: an entry is not well formed: a bad id, a field of the wrong type, a field the
 *   entry does not have.
 * - `duplicate_id`: two entries share an id, in these entries or with the register.
 * - `unknown_namespace`: the industry that enters the rights is not registered in the register of
 *   features.
 * - `wrong_namespace`: a right does not carry the namespace of who enters it: an industry enters
 *   `<industry>.<name>` only, the platform enters ids without a namespace.
 */
export const RIGHT_PROBLEM_CODES = [
  'invalid_entry',
  'duplicate_id',
  'unknown_namespace',
  'wrong_namespace',
] as const;
export type RightProblemCode = (typeof RIGHT_PROBLEM_CODES)[number];

/** One thing that is wrong with the entries of a register of rights. */
export interface RightProblem {
  code: RightProblemCode;
  /** The id of the right or industry concerned; `?` for an entry that has none. */
  id: string;
  /** For the person who fixes it: what is wrong and what is expected. */
  message: string;
}

/**
 * Every error of the register carries a code, so callers never read the message. It is a mistake
 * of the program, not of the person: entries that were refused.
 */
export class RightError extends Error {
  readonly code: RightProblemCode;
  /** Every problem found: the first decides the code. */
  readonly problems: readonly RightProblem[];

  constructor(code: RightProblemCode, message: string, problems: readonly RightProblem[]) {
    super(message);
    this.name = 'RightError';
    this.code = code;
    this.problems = problems;
  }
}

/** One right as an entry. */
export interface RightInput<TId extends string = string> {
  id: TId;
}

/**
 * What a package or an industry enters, as one bag. `industry` says who enters: the id of an
 * industry that is registered in the register of features, or nothing for the platform.
 */
export interface RightEntries<TId extends string = string> {
  industry?: string;
  rights?: readonly RightInput<TId>[];
}

/** A right as the register holds it: checked, frozen. */
export interface RightDefinition<TId extends string = string> {
  readonly id: TId;
}

/**
 * What the register of rights needs to know about the register of features: the industries that
 * exist. A `FeatureRegistry` fits.
 */
export interface KnownIndustries {
  readonly industries: readonly { readonly id: string }[];
}

export interface RightRegistry<TId extends string = string> {
  /** The rights in the order of registration. */
  readonly rights: readonly RightDefinition<TId>[];
  /** The ids in the order of registration. */
  readonly ids: readonly TId[];
  has(id: string): id is TId;
  /** A new register with further rights; this one stays as it is. Throws like `createRightRegistry`. */
  extend<const TMore extends string>(more: RightEntries<TMore>): RightRegistry<TId | TMore>;
}

const ENTRY_FIELDS: readonly string[] = ['industry', 'rights'];
const RIGHT_FIELDS: readonly string[] = ['id'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describe(value: unknown): string {
  if (value === undefined) {
    return 'nothing';
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'a list';
  }
  return typeof value === 'object' ? 'an object' : `a ${typeof value}`;
}

const UNNAMED = '?';

interface Checked {
  readonly rights: readonly RightDefinition[];
  readonly problems: readonly RightProblem[];
}

/** Checks entries of any shape against the rights already registered; returns what it found as data. */
function check(
  industries: ReadonlySet<string>,
  base: readonly RightDefinition[],
  entries: unknown,
): Checked {
  const problems: RightProblem[] = [];
  const report = (code: RightProblemCode, id: string, message: string): void => {
    problems.push({ code, id, message });
  };
  if (!isRecord(entries)) {
    report('invalid_entry', UNNAMED, `expected an object, got ${describe(entries)}`);
    return { rights: [], problems };
  }
  for (const field of Object.keys(entries)) {
    if (!ENTRY_FIELDS.includes(field)) {
      report('invalid_entry', UNNAMED, `the entries have the unknown field "${field}"`);
    }
  }
  let industry: string | undefined;
  if (entries.industry !== undefined) {
    if (typeof entries.industry !== 'string' || !FEATURE_SEGMENT_PATTERN.test(entries.industry)) {
      report(
        'invalid_entry',
        UNNAMED,
        `industry must be the id of an industry, got ${describe(entries.industry)}`,
      );
    } else if (!industries.has(entries.industry)) {
      report(
        'unknown_namespace',
        entries.industry,
        `the industry "${entries.industry}" is not registered in the register of features`,
      );
    } else {
      industry = entries.industry;
    }
  }
  const list: unknown = entries.rights ?? [];
  if (!Array.isArray(list)) {
    report('invalid_entry', UNNAMED, `rights must be a list, got ${describe(list)}`);
    return { rights: [], problems };
  }
  const seen = new Set(base.map((right) => right.id));
  const rights: RightDefinition[] = [];
  for (const item of list as unknown[]) {
    if (!isRecord(item)) {
      report('invalid_entry', UNNAMED, `a right must be an object, got ${describe(item)}`);
      continue;
    }
    const id = typeof item.id === 'string' ? item.id : UNNAMED;
    for (const field of Object.keys(item)) {
      if (!RIGHT_FIELDS.includes(field)) {
        report('invalid_entry', id, `has the unknown field "${field}"`);
      }
    }
    if (typeof item.id !== 'string' || !RIGHT_ID_PATTERN.test(item.id)) {
      report(
        'invalid_entry',
        UNNAMED,
        `the id of a right must be one to three lower-case words joined by dots, got ${describe(item.id)}`,
      );
      continue;
    }
    const namespace = namespaceOf(item.id);
    if (namespace !== industry) {
      report(
        'wrong_namespace',
        item.id,
        industry === undefined
          ? `the platform enters rights without a namespace, "${item.id}" belongs to the industry "${String(namespace)}"`
          : `the industry "${industry}" enters rights of its own namespace only, got "${item.id}"`,
      );
      continue;
    }
    if (seen.has(item.id)) {
      report('duplicate_id', item.id, `the right "${item.id}" is registered twice`);
      continue;
    }
    seen.add(item.id);
    rights.push(Object.freeze({ id: item.id }));
  }
  return { rights, problems };
}

function industriesOf(features: KnownIndustries): ReadonlySet<string> {
  return new Set(features.industries.map((industry) => industry.id));
}

/**
 * What is wrong with entries of rights, without building anything: every problem as data, in the
 * form of each entry and against the register of features and `base`. The conformity test of an
 * industry calls it; an empty list means a register can be built.
 */
export function rightEntryProblems(
  features: KnownIndustries,
  entries: unknown,
  base?: RightRegistry,
): readonly RightProblem[] {
  return check(industriesOf(features), base?.rights ?? [], entries).problems;
}

function build<TId extends string>(
  industries: ReadonlySet<string>,
  base: readonly RightDefinition[],
  entries: unknown,
): RightRegistry<TId> {
  const { rights: added, problems } = check(industries, base, entries);
  const [first] = problems;
  if (first !== undefined) {
    const found = problems.map((problem) => `${problem.id}: ${problem.message}`);
    throw new RightError(
      first.code,
      `The entries of the register of rights are not well formed: ${found.join('; ')}`,
      problems,
    );
  }
  // The entries passed the checks, so every id is one of `TId`.
  const rights = Object.freeze([...base, ...added]) as readonly RightDefinition<TId>[];
  const ids = Object.freeze(rights.map((right) => right.id));
  const known = new Set<string>(ids);
  return Object.freeze({
    rights,
    ids,
    has: (id: string): id is TId => known.has(id),
    extend: <const TMore extends string>(more: RightEntries<TMore>) =>
      build<TId | TMore>(industries, rights, more),
  });
}

/**
 * Builds a register of rights from entries. Every entry is checked (see `rightEntryProblems`);
 * the first problem decides the code of the `RightError` that is thrown, and it carries all of
 * them. The industries are those of the register of features, so a right of an industry that
 * does not exist cannot be entered. Write the entries with `as const satisfies RightEntries` and
 * the type knows every id. The result is frozen.
 */
export function createRightRegistry<const TId extends string>(
  features: KnownIndustries,
  entries: RightEntries<TId>,
): RightRegistry<TId> {
  return build<TId>(industriesOf(features), [], entries);
}

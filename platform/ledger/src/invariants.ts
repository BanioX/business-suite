import { isPlainRecord, plainCopy, type Hasher } from '@onestrand/storage';
import { canonicalText } from './canonical';
import { allChainProblems, type LedgerProblem } from './chain';
import type { LedgerDefinition } from './definition';
import { readBackProblem, type LedgerEntry } from './entry';
import { effectiveEntries, foldLedger } from './fold';
import { compareText, deepFreeze, fieldOf } from './internal';

/**
 * What must hold for the rows of every ledger, whatever was booked. A module or an industry
 * that builds a ledger runs these in its own property test: book any sequence of entries and
 * corrections, read the rows of the table, expect no problems. Like every check of the
 * platform, it returns its findings as data.
 */

/** The invariants, by name. */
export const LEDGER_INVARIANTS = ['schema', 'chain', 'fold', 'history'] as const;
/**
 * - `schema`: every stored row fits the schema of the table, and reading it with the schema
 *   changes nothing. A schema that fills in or rewrites a field of a stored entry would break
 *   its checksum when the row comes back from a backup.
 * - `chain`: every row is an entry of a chain that holds together (`allChainProblems`).
 * - `fold`: `reduce` accepts every stored chain, changes neither the state nor the entry it is
 *   given, and gives the same state for the same entries. Asked only of chains that hold
 *   together and whose rows fit the schema: the fold of a damaged chain says nothing.
 * - `history`: every entry that was there before is still there, unchanged (with `before`).
 */
export type LedgerInvariant = (typeof LEDGER_INVARIANTS)[number];

/** One invariant that does not hold, and where. */
export interface LedgerInvariantProblem {
  invariant: LedgerInvariant;
  businessId?: string;
  stream?: string;
  /** The id of the entry, where the problem is about one entry. */
  id?: string;
  /** For logs and tests, in English. */
  message: string;
}

/** What `ledgerInvariantProblems` takes besides the rows. */
export interface LedgerInvariantOptions<TState> {
  /**
   * The rows of the same table at an earlier time. Every one of them must still be among the
   * rows, the same in every field.
   */
  before?: readonly unknown[];
  /**
   * How two states are compared. Default: as plain data. A ledger whose state is not plain data
   * (it holds a map, a date object) passes its own comparison.
   */
  sameState?: (a: TState, b: TState) => boolean;
}

/** The business, the stream and the id of a row that may be anything, as far as it has them. */
function placeOf(row: unknown): { businessId?: string; stream?: string; id?: string } {
  const place: { businessId?: string; stream?: string; id?: string } = {};
  if (isPlainRecord(row)) {
    for (const key of ['businessId', 'stream', 'id'] as const) {
      const value = fieldOf(row, key);
      if (typeof value === 'string') {
        place[key] = value;
      }
    }
  }
  return place;
}

/** The canonical text of a value for a comparison; nothing if it is not plain data. */
function textOf(value: unknown): string | undefined {
  // No value is a value here: a state may be `undefined`, and it equals itself.
  return value === undefined ? 'undefined' : canonicalText(value);
}

function fromChain(problem: LedgerProblem): LedgerInvariantProblem {
  const place = problem.position === undefined ? '' : ` at place ${problem.position}`;
  return {
    invariant: 'chain',
    ...(problem.businessId === undefined ? {} : { businessId: problem.businessId }),
    ...(problem.stream === undefined ? {} : { stream: problem.stream }),
    ...(problem.id === undefined ? {} : { id: problem.id }),
    message: `${problem.kind}${place}: ${problem.message}`,
  };
}

/** `foldLedger`, with every state frozen as soon as `reduce` returned it. */
function foldFrozen<TEntry extends LedgerEntry, TState>(
  definition: LedgerDefinition<TEntry, TState>,
  entries: readonly TEntry[],
): TState {
  let state = definition.initial;
  for (const entry of effectiveEntries(entries)) {
    state = deepFreeze(definition.reduce(state, entry));
  }
  return state;
}

function foldProblem<TEntry extends LedgerEntry, TState>(
  definition: LedgerDefinition<TEntry, TState>,
  entries: readonly TEntry[],
  sameState: ((a: TState, b: TState) => boolean) | undefined,
): string | undefined {
  let first: TState;
  let second: TState;
  try {
    // Frozen entries and frozen states: a reduce that changes what it is given fails here.
    first = foldFrozen(definition, entries);
    second = foldLedger(definition, entries);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return `reduce failed on stored entries (it must accept every stored chain and change neither the state nor the entry it is given): ${reason}`;
  }
  if (sameState !== undefined) {
    return sameState(first, second) ? undefined : 'reduce gave two states for the same entries';
  }
  const text = textOf(first);
  if (text === undefined || textOf(second) === undefined) {
    return 'The state is not plain data; pass sameState to compare it';
  }
  return text === textOf(second) ? undefined : 'reduce gave two states for the same entries';
}

/**
 * Every invariant of a ledger that does not hold for `rows`, the rows of its table as they are
 * stored (of one business or of several). An empty list means all hold.
 *
 * Meant for tests: it reads every row several times, and it freezes the states `reduce`
 * returns, to catch a `reduce` that changes a state in place.
 */
export async function ledgerInvariantProblems<TEntry extends LedgerEntry, TState>(
  definition: LedgerDefinition<TEntry, TState>,
  hasher: Hasher,
  rows: readonly unknown[],
  options: LedgerInvariantOptions<TState> = {},
): Promise<LedgerInvariantProblem[]> {
  const problems: LedgerInvariantProblem[] = [];

  /** The rows the schema accepts, by chain: what the fold can be asked about. */
  const chains = new Map<string, { businessId: string; stream: string; entries: TEntry[] }>();
  /** Chains with a row the schema refuses or a break in them: their fold would say nothing. */
  const incomplete = new Set<string>();
  for (const row of rows) {
    const place = placeOf(row);
    const key = JSON.stringify([place.businessId, place.stream]);
    const problem = readBackProblem(definition.table.schema, row);
    if (problem !== undefined) {
      const message = `The row is no entry of ${definition.table.name}: ${problem}`;
      problems.push({ invariant: 'schema', ...place, message });
      incomplete.add(key);
      continue;
    }
    const { businessId = '', stream = '' } = place;
    const chain = chains.get(key) ?? { businessId, stream, entries: [] };
    // The schema accepted the row as it is, so it is an entry of this ledger.
    chain.entries.push(deepFreeze(plainCopy(row)) as TEntry);
    chains.set(key, chain);
  }

  for (const problem of await allChainProblems(hasher, rows)) {
    problems.push(fromChain(problem));
    incomplete.add(JSON.stringify([problem.businessId, problem.stream]));
  }

  const ordered = [...chains.entries()].sort(([a], [b]) => compareText(a, b));
  for (const [key, { businessId, stream, entries }] of ordered) {
    const message = incomplete.has(key)
      ? undefined
      : foldProblem(definition, entries, options.sameState);
    if (message !== undefined) {
      problems.push({ invariant: 'fold', businessId, stream, message });
    }
  }

  const now = new Map<string, unknown>();
  for (const row of rows) {
    const { id } = placeOf(row);
    if (id !== undefined) {
      now.set(id, row);
    }
  }
  for (const old of options.before ?? []) {
    const place = placeOf(old);
    if (place.id === undefined) {
      continue;
    }
    if (!now.has(place.id)) {
      problems.push({ invariant: 'history', ...place, message: 'The entry is gone' });
    } else if (textOf(now.get(place.id)) !== textOf(old)) {
      problems.push({
        invariant: 'history',
        ...place,
        message: 'The entry was changed after it was written',
      });
    }
  }
  return problems;
}

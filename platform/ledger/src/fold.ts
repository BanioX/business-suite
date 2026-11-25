import type { LedgerDefinition } from './definition';
import { inSequence, type LedgerEntry } from './entry';

/**
 * From entries to a state (suite ADR-0005, 2: computed, never stored).
 *
 * A correction is a new entry that names the one it corrects. For the state it takes the place
 * of that entry: the stream is read as if the fact had been written correctly the first time,
 * and what was written before stays in the ledger for everyone to see. A correction can itself
 * be corrected; the last one counts.
 */

/**
 * The entries that count, in the order of the chain: every entry that was corrected is replaced
 * in its place by its correction (by the last one, if that was corrected again).
 *
 * Total on purpose: a correction that names no earlier entry of the list (a damaged chain)
 * counts as an entry of its own. Whether the entries can be trusted is the question of
 * `chainProblems`, not of this function.
 */
export function effectiveEntries<
  TEntry extends { id: string; seq: number; corrects?: string | undefined },
>(entries: readonly TEntry[]): TEntry[] {
  const counted: TEntry[] = [];
  /** Where the entry with this id stands in `counted`, also after it was corrected. */
  const placeOf = new Map<string, number>();
  for (const entry of inSequence(entries)) {
    const place = entry.corrects === undefined ? undefined : placeOf.get(entry.corrects);
    if (place === undefined) {
      placeOf.set(entry.id, counted.length);
      counted.push(entry);
    } else {
      counted[place] = entry;
      placeOf.set(entry.id, place);
    }
  }
  return counted;
}

/**
 * The state of one stream: `reduce` over the entries that count, starting from `initial`. The
 * entries may come in any order; they are the entries of one stream of one business.
 */
export function foldLedger<TEntry extends LedgerEntry, TState>(
  definition: Pick<LedgerDefinition<TEntry, TState>, 'initial' | 'reduce'>,
  entries: readonly TEntry[],
): TState {
  let state = definition.initial;
  for (const entry of effectiveEntries(entries)) {
    state = definition.reduce(state, entry);
  }
  return state;
}

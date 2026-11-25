import { describe, expect, it } from 'vitest';
import { effectiveEntries, foldLedger } from '../src';
import { accountLedger, OVERDRAWN, statusLedger, type StatusEntry } from './support';

/** The least an entry needs for the fold. */
function row(id: string, seq: number, corrects?: string) {
  return corrects === undefined ? { id, seq } : { id, seq, corrects };
}

const idsOf = (rows: readonly { id: string }[]) => rows.map((entry) => entry.id);

describe('the entries that count', () => {
  it('are all of them, in the order of the chain, while nothing was corrected', () => {
    expect(idsOf(effectiveEntries([row('c', 3), row('a', 1), row('b', 2)]))).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(effectiveEntries([])).toEqual([]);
  });

  it('put a correction in the place of the entry it corrects', () => {
    const rows = [row('a', 1), row('b', 2), row('c', 3), row('d', 4, 'b')];
    expect(idsOf(effectiveEntries(rows))).toEqual(['a', 'd', 'c']);
  });

  it('follow a correction of a correction to the last one', () => {
    const rows = [row('a', 1), row('b', 2), row('c', 3, 'a'), row('d', 4, 'c'), row('e', 5, 'd')];
    expect(idsOf(effectiveEntries(rows))).toEqual(['e', 'b']);
  });

  it('keep several corrected entries apart', () => {
    const rows = [row('a', 1), row('b', 2), row('c', 3, 'b'), row('d', 4, 'a'), row('e', 5)];
    expect(idsOf(effectiveEntries(rows))).toEqual(['d', 'c', 'e']);
  });

  it('do not change the list they were given', () => {
    const rows = [row('b', 2, 'a'), row('a', 1)];
    const given = [...rows];
    effectiveEntries(rows);
    expect(rows).toEqual(given);
  });

  describe('in a damaged chain, without failing', () => {
    it('count a correction of an entry that is not there as an entry of its own', () => {
      const rows = [row('a', 1), row('b', 2, 'gone')];
      expect(idsOf(effectiveEntries(rows))).toEqual(['a', 'b']);
    });

    it('count a correction of a later entry as an entry of its own', () => {
      const rows = [row('a', 1, 'b'), row('b', 2)];
      expect(idsOf(effectiveEntries(rows))).toEqual(['a', 'b']);
    });

    it('let the last of two corrections of one entry count', () => {
      const rows = [row('a', 1), row('b', 2, 'a'), row('c', 3, 'a')];
      expect(idsOf(effectiveEntries(rows))).toEqual(['c']);
    });

    it('count an entry that corrects itself once', () => {
      expect(idsOf(effectiveEntries([row('a', 1, 'a')]))).toEqual(['a']);
    });
  });
});

describe('the fold', () => {
  const status = (id: string, seq: number, value: StatusEntry['status'], corrects?: string) =>
    ({ ...row(id, seq, corrects), status: value }) as unknown as StatusEntry;

  it('is the initial state for a stream without entries', () => {
    expect(foldLedger(statusLedger, [])).toBe(statusLedger.initial);
    expect(foldLedger(accountLedger, [])).toEqual({ balance: 0, bookings: 0 });
  });

  it('applies the rule to every entry in the order of the chain, whatever order they come in', () => {
    const rows = [status('c', 3, 'done'), status('a', 1, 'planned'), status('b', 2, 'started')];
    expect(foldLedger(statusLedger, rows)).toEqual({
      status: 'done',
      history: ['planned', 'started', 'done'],
    });
  });

  it('reads a corrected entry as if it had been written correctly the first time', () => {
    // «started» was entered by mistake as «planned» and is corrected after the job is done:
    // the job stays done, because the correction stands where the mistake stood.
    const rows = [
      status('a', 1, 'planned'),
      status('b', 2, 'planned'),
      status('c', 3, 'done'),
      status('d', 4, 'started', 'b'),
    ];
    expect(foldLedger(statusLedger, rows)).toEqual({
      status: 'done',
      history: ['planned', 'started', 'done'],
    });
  });

  it('never shows the rule an entry that was corrected', () => {
    const seen: string[] = [];
    foldLedger(
      {
        initial: 0,
        reduce: (count: number, entry: StatusEntry) => {
          seen.push(entry.id);
          return count + 1;
        },
      },
      [status('a', 1, 'planned'), status('b', 2, 'done', 'a')],
    );
    expect(seen).toEqual(['b']);
  });

  it('lets the error of the rule out', () => {
    const amount = (id: string, seq: number, value: number) =>
      ({ ...row(id, seq), amount: value }) as unknown as Parameters<typeof accountLedger.reduce>[1];
    expect(() => foldLedger(accountLedger, [amount('a', 1, 500), amount('b', 2, -501)])).toThrow(
      expect.objectContaining({ code: OVERDRAWN }),
    );
  });

  it('does not change the initial state', () => {
    foldLedger(statusLedger, [status('a', 1, 'planned')]);
    expect(statusLedger.initial).toEqual({ status: null, history: [] });
  });
});

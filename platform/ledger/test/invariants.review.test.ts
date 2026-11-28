import { rappen } from '@onestrand/core';
import { defineTable } from '@onestrand/storage';
import { beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  defineLedger,
  entryHash,
  LEDGER_INVARIANTS,
  ledgerInvariantProblems,
  type LedgerInvariantProblem,
} from '../src';
import {
  accountEntriesTable,
  AccountEntrySchema,
  accountLedger,
  accountRows,
  createTestLedgers,
  hasher,
  statusLedger,
  withField,
  type AccountEntry,
  type TestLedgers,
} from './support';

/**
 * The checks other packages run on their own ledgers. Each invariant is broken here once, on
 * rows the kit wrote, so that a ledger which breaks it is told so.
 */

let t: TestLedgers;
/** Two businesses, three chains; in «cash» of the first one the third entry corrects the second. */
let rows: AccountEntry[];
let cash: AccountEntry[];

beforeAll(async () => {
  t = await createTestLedgers();
  const { businessId } = t.one;
  await t.account.append(businessId, 'cash', { amount: rappen(500), text: 'Anfang' });
  const second = await t.account.append(businessId, 'cash', { amount: rappen(-100) });
  await t.account.correct(businessId, second.entry.id, { amount: rappen(-90), tags: ['a'] });
  await t.account.append(businessId, 'bank', { amount: rappen(900) });
  await t.account.append(t.two.businessId, 'cash', { amount: rappen(70) });
  rows = await accountRows(t);
  cash = await t.account.entries(businessId, 'cash');
});

const check = (table: readonly unknown[], before?: readonly unknown[]) =>
  ledgerInvariantProblems(accountLedger, hasher, table, before === undefined ? {} : { before });

/** The rows with one of them replaced. */
const replaced = (id: string, row: unknown): unknown[] =>
  rows.map((entry) => (entry.id === id ? row : entry));

/** A row with the checksum it must carry now, so that only the invariant in question breaks. */
async function rehashed<TRow extends object>(row: TRow): Promise<TRow> {
  return { ...row, hash: await entryHash(hasher, row) };
}

const entryAt = (seq: number): AccountEntry => {
  const entry = cash[seq - 1];
  if (entry === undefined) {
    throw new Error(`The chain of the test has no entry ${seq}`);
  }
  return entry;
};

const invariants = (problems: readonly LedgerInvariantProblem[]) =>
  problems.map((problem) => problem.invariant);

describe('the invariants of a ledger', () => {
  it('are these four', () => {
    expect(LEDGER_INVARIANTS).toEqual(['schema', 'chain', 'fold', 'history']);
  });

  it('hold for rows the kit wrote, of several streams and businesses', async () => {
    expect(await check(rows)).toEqual([]);
    expect(await check([...rows].reverse())).toEqual([]);
    expect(await check([])).toEqual([]);
  });

  it('hold for rows compared with themselves at an earlier time', async () => {
    expect(await check(rows, rows.slice(0, 3))).toEqual([]);
    expect(await check(rows, rows)).toEqual([]);
  });

  it('hold for a ledger of another kind', async () => {
    await t.status.append(t.one.businessId, 'job-1', { status: 'planned' });
    await t.status.append(t.one.businessId, 'job-1', { status: 'done', note: 'Fertig' });
    const statusRows = await t.storage.table('status_entries').ofBusiness(t.one.businessId);
    expect(await ledgerInvariantProblems(statusLedger, hasher, statusRows)).toEqual([]);
  });

  it('leave the rows they were given alone', async () => {
    const given = rows.map((row) => ({ ...row }));
    await check(given);
    expect(given).toEqual(rows);
    expect(given.some((row) => Object.isFrozen(row))).toBe(false);
  });
});

describe('schema: every stored row is an entry its schema reads back unchanged', () => {
  it('reports a row the schema refuses, with the field', async () => {
    const half = await rehashed({ ...entryAt(1), amount: 1.5 });
    expect(await check(replaced(half.id, half))).toEqual([
      {
        invariant: 'schema',
        businessId: t.one.businessId,
        stream: 'cash',
        id: half.id,
        message: 'The row is no entry of account_entries: the schema refuses it: amount',
      },
      // The entry after it no longer names its checksum.
      expect.objectContaining({ invariant: 'chain', stream: 'cash' }) as LedgerInvariantProblem,
    ]);
  });

  it('reports a row the schema would change when it comes back from a backup', async () => {
    // Written past the schema: the text was never trimmed. Its checksum fits what is stored.
    const untrimmed = await rehashed({ ...entryAt(3), text: '  Kasse ' });
    const problems = await check(replaced(untrimmed.id, untrimmed));
    expect(problems).toEqual([
      {
        invariant: 'schema',
        businessId: t.one.businessId,
        stream: 'cash',
        id: untrimmed.id,
        message: expect.stringContaining('reads it differently from how it is stored') as string,
      },
    ]);
  });

  it('accepts a field the schema does not know: a backup keeps it', async () => {
    const later = await rehashed({ ...entryAt(3), later: { since: 2 } });
    expect(await check(replaced(later.id, later))).toEqual([]);
  });

  it.each([
    ['a date object in it', { ...({} as AccountEntry), on: new Date(0) }],
    ['a number no file can carry', { amount: Number.NaN }],
  ])('reports a row that is not plain data: %s', async (_what, extra) => {
    const row = { ...entryAt(3), ...extra };
    const problems = await check(replaced(row.id, row));
    expect(problems).toEqual([
      {
        invariant: 'schema',
        businessId: t.one.businessId,
        stream: 'cash',
        id: row.id,
        message: 'The row is no entry of account_entries: it is not plain data',
      },
      expect.objectContaining({ invariant: 'chain', id: row.id }) as LedgerInvariantProblem,
    ]);
  });

  it.each([
    ['nothing', undefined],
    ['null', null],
    ['a text', 'row'],
    ['a list', []],
    ['an empty record', {}],
  ])('reports a row that is %s, without a place', async (_what, row) => {
    const problems = await check([...rows, row]);
    expect(problems).toEqual([
      { invariant: 'schema', message: expect.stringMatching(/^The row is no entry/) as string },
      {
        invariant: 'chain',
        message: 'entry: No entry: it names no business and stream, so it belongs to no chain',
      },
    ]);
  });

  it('reports a schema that reads a row as something no file can carry', async () => {
    const schema = AccountEntrySchema.extend({
      text: z.string().transform((text) => new Date(text)),
    });
    const table = defineTable({
      name: 'dated_entries',
      schema,
      indexes: [],
      sensitivity: 'normal',
      sync: 'ledger',
      appendOnly: true,
    });
    const dated = defineLedger({
      table,
      initial: 0,
      reduce: (count: number, _entry: z.output<typeof schema>) => count + 1,
    });
    const row = await rehashed({ ...entryAt(1), text: '2026-11-16' });
    expect(await ledgerInvariantProblems(dated, hasher, [row])).toEqual([
      {
        invariant: 'schema',
        businessId: t.one.businessId,
        stream: 'cash',
        id: row.id,
        message:
          'The row is no entry of dated_entries: the schema reads it as something that is not plain data',
      },
    ]);
  });

  it('does not fold a chain with a row the schema refuses', async () => {
    const seen: string[] = [];
    const watching = defineLedger<AccountEntry, number>({
      table: accountEntriesTable,
      initial: 0,
      reduce: (count, entry) => {
        seen.push(entry.stream);
        return count + 1;
      },
    });
    const half = await rehashed({ ...entryAt(3), amount: 1.5 });
    const problems = await ledgerInvariantProblems(watching, hasher, replaced(half.id, half));
    expect(invariants(problems)).toEqual(['schema']);
    // The other chains were folded (twice each), the one with the bad row was not.
    expect([...new Set(seen)].sort()).toEqual(['bank', 'cash']);
    expect(seen.filter((stream) => stream === 'cash')).toHaveLength(2);
  });
});

describe('chain: every row is an entry of a chain that holds together', () => {
  it('reports a changed entry with its place and the kind of the problem', async () => {
    const changed = { ...entryAt(2), text: 'Nachgetragen' };
    expect(await check(replaced(changed.id, changed))).toEqual([
      {
        invariant: 'chain',
        businessId: t.one.businessId,
        stream: 'cash',
        id: changed.id,
        message: 'hash at place 2: The hash does not match what the entry holds',
      },
    ]);
  });

  it('reports a removed entry on the one after it', async () => {
    const problems = await check(rows.filter((row) => row.id !== entryAt(1).id));
    expect(problems.map((problem) => problem.message)).toEqual([
      'seq at place 1: Expected seq 1, found 2',
      'prev_hash at place 1: The first entry of a chain names no entry before it',
    ]);
    expect(invariants(problems)).toEqual(['chain', 'chain']);
  });

  it('reports a row that belongs to no chain without a place', async () => {
    const lost = withField(entryAt(3), 'stream', undefined);
    const problems = await check(replaced(lost.id, lost));
    expect(problems).toContainEqual({
      invariant: 'chain',
      id: lost.id,
      message: 'entry: No entry: it names no business and stream, so it belongs to no chain',
    });
  });
});

describe('fold: the rule accepts every stored chain and changes nothing it is given', () => {
  const foldProblems = async <TState>(
    reduce: (state: TState, entry: AccountEntry) => TState,
    initial: TState,
    sameState?: (a: TState, b: TState) => boolean,
  ) =>
    ledgerInvariantProblems(
      defineLedger<AccountEntry, TState>({ table: accountEntriesTable, initial, reduce }),
      hasher,
      rows,
      sameState === undefined ? {} : { sameState },
    );

  it('reports a rule that refuses a stored chain, per chain and sorted', async () => {
    const problems = await foldProblems((total: number, entry) => {
      if (entry.amount > 600) {
        throw new Error(`Too much at once: ${entry.amount}`);
      }
      return total + entry.amount;
    }, 0);
    expect(problems).toEqual([
      {
        invariant: 'fold',
        businessId: t.one.businessId,
        stream: 'bank',
        message: expect.stringMatching(
          /^reduce failed on stored entries.*Too much at once: 900$/s,
        ) as string,
      },
    ]);
  });

  it('says what was thrown also if it is no error object', async () => {
    const problems = await foldProblems((_total: number, entry) => {
      if (entry.stream === 'bank') {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- a rule written without care
        throw 'no bank today';
      }
      return 0;
    }, 0);
    expect(problems.map((problem) => problem.message)).toEqual([
      expect.stringMatching(/: no bank today$/),
    ]);
  });

  it('reports a rule that changes the state in place', async () => {
    const problems = await foldProblems(
      (state: { amounts: number[] }, entry) => {
        state.amounts.push(entry.amount);
        return state;
      },
      { amounts: [] },
    );
    expect(invariants(problems)).toEqual(['fold', 'fold', 'fold']);
    expect(problems[0]?.message).toMatch(/^reduce failed on stored entries/);
  });

  it('reports a rule that changes a state it returned before', async () => {
    // The initial state is left alone, but every later state is changed in place.
    const problems = await foldProblems(
      (state: { amounts: number[] }, entry) => {
        if (state.amounts.length === 0) {
          return { amounts: [entry.amount] };
        }
        state.amounts.push(entry.amount);
        return state;
      },
      { amounts: [] },
    );
    // Only the chain with more than one entry that counts gets that far.
    expect(problems).toMatchObject([{ invariant: 'fold', stream: 'cash' }]);
  });

  it('reports a rule that changes the entry it is given', async () => {
    const problems = await foldProblems((total: number, entry) => {
      entry.amount = rappen(Math.abs(entry.amount));
      return total + entry.amount;
    }, 0);
    expect(invariants(problems)).toEqual(['fold', 'fold', 'fold']);
  });

  it('reports a rule that gives two states for the same entries', async () => {
    let calls = 0;
    const problems = await foldProblems((_state: number) => (calls += 1), 0);
    expect(problems.map((problem) => problem.message)).toEqual([
      'reduce gave two states for the same entries',
      'reduce gave two states for the same entries',
      'reduce gave two states for the same entries',
    ]);
  });

  it('asks for a comparison if the state is not plain data', async () => {
    const reduce = (state: Map<string, number>, entry: AccountEntry) =>
      new Map(state).set(entry.id, entry.amount);
    const problems = await foldProblems(reduce, new Map<string, number>());
    expect(problems.map((problem) => problem.message)).toEqual([
      'The state is not plain data; pass sameState to compare it',
      'The state is not plain data; pass sameState to compare it',
      'The state is not plain data; pass sameState to compare it',
    ]);

    const same = (a: Map<string, number>, b: Map<string, number>) =>
      JSON.stringify([...a]) === JSON.stringify([...b]);
    expect(await foldProblems(reduce, new Map<string, number>(), same)).toEqual([]);
  });

  it('uses the comparison it was given', async () => {
    const problems = await foldProblems(
      (total: number, entry) => total + entry.amount,
      0,
      () => false,
    );
    expect(problems.map((problem) => problem.message)).toEqual([
      'reduce gave two states for the same entries',
      'reduce gave two states for the same entries',
      'reduce gave two states for the same entries',
    ]);
  });

  it('accepts a state without a value', async () => {
    expect(await foldProblems((): undefined => undefined, undefined)).toEqual([]);
  });

  it('shows the rule only the entries that count', async () => {
    const seen = new Set<string>();
    await foldProblems((count: number, entry) => {
      seen.add(entry.id);
      return count + 1;
    }, 0);
    expect(seen.has(entryAt(2).id)).toBe(false);
    expect(seen.has(entryAt(3).id)).toBe(true);
  });
});

describe('history: what was written stays as it was written', () => {
  it('reports an entry that is gone', async () => {
    const problems = await check(
      rows.filter((row) => row.id !== entryAt(3).id),
      rows,
    );
    expect(problems).toEqual([
      {
        invariant: 'history',
        businessId: t.one.businessId,
        stream: 'cash',
        id: entryAt(3).id,
        message: 'The entry is gone',
      },
    ]);
  });

  it('reports an entry that was changed, also if its checksum was written anew', async () => {
    const forged = await rehashed({ ...entryAt(3), amount: rappen(-80) });
    const problems = await check(replaced(forged.id, forged), rows);
    expect(problems).toEqual([
      {
        invariant: 'history',
        businessId: t.one.businessId,
        stream: 'cash',
        id: forged.id,
        message: 'The entry was changed after it was written',
      },
    ]);
  });

  it('reports an entry that turned into something that is not plain data', async () => {
    const broken = { ...entryAt(3), on: new Date(0) };
    const problems = await check(replaced(broken.id, broken), rows);
    expect(invariants(problems)).toEqual(['schema', 'chain', 'history']);
  });

  it('does not mind the order of the keys or a field without a value', async () => {
    const reordered = rows.map((row) =>
      Object.fromEntries([...Object.entries(row).reverse(), ['later', undefined]]),
    );
    expect(await check(rows, reordered)).toEqual([]);
  });

  it('skips an earlier row that has no id', async () => {
    expect(await check(rows, [null, 'row', {}, { id: 5 }])).toEqual([]);
  });

  it('holds while entries are only added', async () => {
    const fresh = await createTestLedgers();
    let before: AccountEntry[] = [];
    for (const amount of [500, -100, 20]) {
      await fresh.account.append(fresh.one.businessId, 'cash', { amount: rappen(amount) });
      const now = await accountRows(fresh);
      expect(await check(now, before)).toEqual([]);
      before = now;
    }
  });
});

import { rappen } from '@onestrand/core';
import { defineTable } from '@onestrand/storage';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  defineLedger,
  entryHash,
  LEDGER_INVARIANTS,
  ledgerInvariantProblems,
  type LedgerInvariant,
  type LedgerInvariantProblem,
} from '../src';
import {
  accountLedger,
  accountRows,
  AccountEntrySchema,
  createTestLedgers,
  hasher,
  withField,
  type AccountEntry,
  type AccountState,
} from './support';

/**
 * The invariants a module runs over the rows of its own ledger. Each test here breaks one of
 * them on purpose and expects it to be named; the clean cases expect no problem at all.
 */

/** Three bookings on «cash» and one on «bank» of the first business, one on «cash» of the second. */
async function history() {
  const t = await createTestLedgers();
  const first = await t.account.append(t.one.businessId, 'cash', { amount: rappen(500) });
  await t.account.append(t.one.businessId, 'cash', { amount: rappen(250) });
  await t.account.correct(t.one.businessId, first.entry.id, { amount: rappen(400) });
  await t.account.append(t.one.businessId, 'bank', { amount: rappen(90) });
  await t.account.append(t.two.businessId, 'cash', { amount: rappen(70) });
  return { t, rows: await accountRows(t) };
}

const of = (problems: readonly LedgerInvariantProblem[], invariant: LedgerInvariant) =>
  problems.filter((problem) => problem.invariant === invariant);

/** The row with a field changed and its checksum computed anew: only the chain after it breaks. */
async function rehashed(row: AccountEntry, key: string, value: unknown): Promise<AccountEntry> {
  const changed = withField(row, key, value);
  return { ...changed, hash: await entryHash(hasher, changed) };
}

/** A ledger on the rows of the account table with another rule for the state. */
function accountWith<TState>(
  initial: TState,
  reduce: (state: TState, entry: AccountEntry) => TState,
) {
  return defineLedger<AccountEntry, TState>({ table: accountLedger.table, initial, reduce });
}

describe('the invariants of a ledger', () => {
  it('are these four', () => {
    expect(LEDGER_INVARIANTS).toEqual(['schema', 'chain', 'fold', 'history']);
  });

  it('all hold for what the kit wrote, with and without an earlier state of the table', async () => {
    const { t, rows } = await history();
    expect(await ledgerInvariantProblems(accountLedger, hasher, rows)).toEqual([]);

    const before = [...rows];
    await t.account.append(t.one.businessId, 'cash', { amount: rappen(5) });
    expect(
      await ledgerInvariantProblems(accountLedger, hasher, await accountRows(t), { before }),
    ).toEqual([]);
  });

  it('hold for a table without rows', async () => {
    expect(await ledgerInvariantProblems(accountLedger, hasher, [], { before: [] })).toEqual([]);
  });
});

describe('schema', () => {
  it('names a row the schema refuses, with the fields that do not fit', async () => {
    const { rows } = await history();
    const [row] = rows;
    if (row === undefined) {
      throw new Error('The history has rows');
    }
    const table = rows.map((entry) => (entry === row ? withField(row, 'amount', 'viel') : entry));
    const problems = await ledgerInvariantProblems(accountLedger, hasher, table);
    expect(of(problems, 'schema')).toEqual([
      {
        invariant: 'schema',
        businessId: row.businessId,
        stream: row.stream,
        id: row.id,
        message: 'The row does not fit the schema of account_entries: amount',
      },
    ]);
    // The fold of a chain with a row the schema refuses would say nothing; it is left out.
    expect(of(problems, 'fold')).toEqual([]);
  });

  it('names a row that is not plain data', async () => {
    const { rows } = await history();
    const [row] = rows;
    if (row === undefined) {
      throw new Error('The history has rows');
    }
    const table = [withField(row, 'text', new Date(0)), ...rows.slice(1)];
    const problems = await ledgerInvariantProblems(accountLedger, hasher, table);
    expect(of(problems, 'schema')).toEqual([
      expect.objectContaining({ id: row.id, message: 'The row is not plain data' }),
    ]);
  });

  it('names what is no row at all, without a place', async () => {
    const problems = await ledgerInvariantProblems(accountLedger, hasher, [null, 'text', 7]);
    expect(of(problems, 'schema')).toEqual([
      { invariant: 'schema', message: 'The row does not fit the schema of account_entries: row' },
      { invariant: 'schema', message: 'The row does not fit the schema of account_entries: row' },
      { invariant: 'schema', message: 'The row does not fit the schema of account_entries: row' },
    ]);
    // None of them names a chain: the check of the chains says so, without a place either.
    expect(of(problems, 'chain')).toHaveLength(3);
    expect(of(problems, 'chain').every((problem) => problem.businessId === undefined)).toBe(true);
    expect(of(problems, 'chain')[0]?.message).toMatch(/^entry: No entry/);
  });

  it('names a schema that fills in a field of a stored entry', async () => {
    const { rows } = await history();
    const WithDefaultSchema = AccountEntrySchema.extend({ kind: z.string().default('booking') });
    const filling = defineLedger<z.infer<typeof WithDefaultSchema>, AccountState>({
      table: defineTable({
        name: 'account_entries',
        schema: WithDefaultSchema,
        indexes: [['stream', 'seq']],
        sensitivity: 'internal',
        sync: 'ledger',
        appendOnly: true,
      }),
      initial: accountLedger.initial,
      reduce: accountLedger.reduce,
    });
    const problems = await ledgerInvariantProblems(filling, hasher, rows);
    expect(problems).toHaveLength(rows.length);
    expect(problems.every((problem) => problem.invariant === 'schema')).toBe(true);
    expect(problems[0]?.message).toMatch(/^The schema changes the stored row/);
  });

  it('accepts a field the schema does not know: a newer version wrote it', async () => {
    const t = await createTestLedgers();
    const { entry } = await t.account.append(t.one.businessId, 'cash', { amount: rappen(10) });
    const row = await rehashed(entry, 'invented', { later: true });
    expect(await ledgerInvariantProblems(accountLedger, hasher, [row])).toEqual([]);
  });
});

describe('chain', () => {
  it('names a changed entry with the kind and the place of the break', async () => {
    const { rows } = await history();
    const row = rows.find((entry) => entry.stream === 'cash' && entry.seq === 2);
    if (row === undefined) {
      throw new Error('The history has a second booking on cash');
    }
    const table = rows.map((entry) => (entry === row ? { ...row, amount: rappen(251) } : entry));
    const problems = await ledgerInvariantProblems(accountLedger, hasher, table);
    expect(problems).toEqual([
      {
        invariant: 'chain',
        businessId: row.businessId,
        stream: 'cash',
        id: row.id,
        message: 'hash at place 2: The hash does not match what the entry holds',
      },
    ]);
  });

  it('names a row that belongs to a chain but is no entry, without a place', async () => {
    const { rows } = await history();
    const [row] = rows;
    if (row === undefined) {
      throw new Error('The history has rows');
    }
    const stray = { id: row.id, businessId: row.businessId, stream: 'safe' };
    const problems = await ledgerInvariantProblems(accountLedger, hasher, [stray]);
    expect(of(problems, 'chain')).toEqual([
      {
        invariant: 'chain',
        businessId: row.businessId,
        stream: 'safe',
        id: row.id,
        message: expect.stringMatching(/^entry: No entry: these fields do not fit/) as string,
      },
    ]);
  });
});

describe('fold', () => {
  it('names a rule that refuses a stored chain', async () => {
    const { t, rows } = await history();
    const refusing = accountWith<AccountState>(accountLedger.initial, () => {
      throw new Error('no');
    });
    const problems = await ledgerInvariantProblems(refusing, hasher, rows);
    expect(problems.map(({ invariant, businessId, stream }) => [invariant, businessId, stream]))
      // One finding per chain, ordered by business and stream.
      .toEqual([
        ['fold', t.one.businessId, 'bank'],
        ['fold', t.one.businessId, 'cash'],
        ['fold', t.two.businessId, 'cash'],
      ]);
    expect(problems[0]?.message).toMatch(/^reduce failed on stored entries .*: no$/);
  });

  it('gives the reason also where the rule throws something that is no error', async () => {
    const { rows } = await history();
    const refusing = accountWith<AccountState>(accountLedger.initial, () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- what a careless rule may do
      throw 'just a text';
    });
    const [problem] = await ledgerInvariantProblems(refusing, hasher, rows);
    expect(problem?.message).toMatch(/: just a text$/);
  });

  it('names a rule that changes the state it is given', async () => {
    const { rows } = await history();
    // The first step returns a fresh state, every later one writes into it: the fold of the
    // kit would not notice, the check freezes each state and does.
    const inPlace = accountWith<AccountState>(accountLedger.initial, (state, entry) =>
      state.bookings === 0
        ? { balance: entry.amount, bookings: 1 }
        : Object.assign(state, { bookings: state.bookings + 1 }),
    );
    const problems = await ledgerInvariantProblems(inPlace, hasher, rows);
    // Only the chain with more than one entry that counts reaches the second step.
    expect(problems.map(({ invariant, stream }) => [invariant, stream])).toEqual([
      ['fold', 'cash'],
    ]);
    expect(problems[0]?.message).toMatch(/^reduce failed on stored entries/);
  });

  it('names a rule that changes the entry it is given', async () => {
    const { rows } = await history();
    const greedy = accountWith<AccountState>(accountLedger.initial, (state, entry) => {
      Object.assign(entry, { amount: rappen(0) });
      return { balance: state.balance, bookings: state.bookings + 1 };
    });
    const problems = await ledgerInvariantProblems(greedy, hasher, rows);
    expect(problems).toHaveLength(3);
    expect(problems.every((problem) => problem.invariant === 'fold')).toBe(true);
    // The rows the caller passed are untouched: the check works on frozen copies.
    expect(await ledgerInvariantProblems(accountLedger, hasher, rows)).toEqual([]);
  });

  it('names a rule that gives two states for the same entries', async () => {
    const { rows } = await history();
    let calls = 0;
    const moody = accountWith<{ calls: number }>({ calls: 0 }, () => {
      calls += 1;
      return { calls };
    });
    const problems = await ledgerInvariantProblems(moody, hasher, rows);
    expect(problems).toHaveLength(3);
    expect(problems[0]).toMatchObject({
      invariant: 'fold',
      message: 'reduce gave two states for the same entries',
    });
  });

  describe('with a state that is not plain data', () => {
    const counting = accountWith<Map<string, number>>(
      new Map(),
      (state, entry) => new Map([...state, [entry.id, entry.amount]]),
    );

    it('asks for a comparison', async () => {
      const { rows } = await history();
      const problems = await ledgerInvariantProblems(counting, hasher, rows);
      expect(problems).toHaveLength(3);
      expect(problems[0]).toMatchObject({
        invariant: 'fold',
        message: 'The state is not plain data; pass sameState to compare it',
      });
    });

    it('takes the comparison it is given', async () => {
      const { rows } = await history();
      const sameState = (a: Map<string, number>, b: Map<string, number>) =>
        JSON.stringify([...a]) === JSON.stringify([...b]);
      expect(await ledgerInvariantProblems(counting, hasher, rows, { sameState })).toEqual([]);

      const never = await ledgerInvariantProblems(counting, hasher, rows, {
        sameState: () => false,
      });
      expect(never).toHaveLength(3);
      expect(never[0]?.message).toBe('reduce gave two states for the same entries');
    });
  });
});

describe('history', () => {
  it('names an entry that is gone', async () => {
    const { rows } = await history();
    const last = rows.find((entry) => entry.stream === 'bank');
    if (last === undefined) {
      throw new Error('The history has a booking on bank');
    }
    const now = rows.filter((entry) => entry !== last);
    // The only entry of its chain: the chain itself cannot show that it is gone.
    expect(await ledgerInvariantProblems(accountLedger, hasher, now)).toEqual([]);
    expect(await ledgerInvariantProblems(accountLedger, hasher, now, { before: rows })).toEqual([
      {
        invariant: 'history',
        businessId: last.businessId,
        stream: 'bank',
        id: last.id,
        message: 'The entry is gone',
      },
    ]);
  });

  it('names an entry that was changed, also where its chain was written anew', async () => {
    const t = await createTestLedgers();
    const { entry } = await t.account.append(t.one.businessId, 'cash', { amount: rappen(10) });
    const forged = await rehashed(entry, 'amount', rappen(1000));
    expect(await ledgerInvariantProblems(accountLedger, hasher, [forged])).toEqual([]);
    expect(
      await ledgerInvariantProblems(accountLedger, hasher, [forged], { before: [entry] }),
    ).toEqual([
      {
        invariant: 'history',
        businessId: entry.businessId,
        stream: 'cash',
        id: entry.id,
        message: 'The entry was changed after it was written',
      },
    ]);
  });

  it('passes over an earlier row without an id: there is nothing to look for', async () => {
    const { rows } = await history();
    const before = [null, { stream: 'cash' }, ...rows];
    expect(await ledgerInvariantProblems(accountLedger, hasher, rows, { before })).toEqual([]);
  });
});

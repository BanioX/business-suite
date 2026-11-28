import { rappen } from '@onestrand/core';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  allChainProblems,
  chainProblems,
  entryHash,
  LEDGER_PROBLEM_KINDS,
  type LedgerProblem,
} from '../src';
import {
  accountRows,
  createTestLedgers,
  hasher,
  sequentialIds,
  withField,
  type AccountEntry,
  type TestLedgers,
} from './support';

/**
 * Every way a stored chain can be damaged, one at a time. The rows are written by the kit and
 * then changed as somebody with access to the table could change them.
 */

let t: TestLedgers;
/** The stream «cash» of the first business: five entries, the fourth corrects the second. */
let cash: AccountEntry[];
/** Every row of the table: two businesses, three chains. */
let all: AccountEntry[];
let chain: { businessId: string; stream: string };

beforeAll(async () => {
  t = await createTestLedgers();
  const { businessId } = t.one;
  await t.account.append(businessId, 'cash', { amount: rappen(500), text: 'Anfang' });
  const second = await t.account.append(businessId, 'cash', {
    amount: rappen(-100),
    ref: { kind: 'receipt', id: t.ids.next() },
    tags: ['a', 'b'],
  });
  await t.account.append(businessId, 'cash', { amount: rappen(20) });
  await t.account.correct(businessId, second.entry.id, { amount: rappen(-90) });
  await t.account.append(businessId, 'cash', { amount: rappen(7) });
  await t.account.append(businessId, 'bank', { amount: rappen(900) });
  await t.account.append(businessId, 'bank', { amount: rappen(-1) });
  await t.account.append(t.two.businessId, 'cash', { amount: rappen(70) });
  cash = await t.account.entries(businessId, 'cash');
  all = await accountRows(t);
  chain = { businessId, stream: 'cash' };
});

const freshIds = sequentialIds(700_000);

/** The entry at this place of the chain, counted from 1. */
const at = (seq: number): AccountEntry => {
  const entry = cash[seq - 1];
  if (entry === undefined) {
    throw new Error(`The chain of the test has no entry ${seq}`);
  }
  return entry;
};

/** The chain with one entry replaced. */
const replaced = (seq: number, row: unknown): unknown[] =>
  cash.map((entry) => (entry.seq === seq ? row : entry));

/** A row with the checksum it must carry now: what somebody who knows the rule would write. */
async function rehashed<TRow extends object>(row: TRow): Promise<TRow> {
  return { ...row, hash: await entryHash(hasher, row) };
}

/** Where and why, without the words. */
const found = (problems: readonly LedgerProblem[]) =>
  problems.map((problem) => [problem.position, problem.kind]);

const check = (rows: readonly unknown[]) => chainProblems(hasher, rows, chain);

describe('a chain that holds together', () => {
  it('has no problems', async () => {
    expect(await check(cash)).toEqual([]);
  });

  it('has none in whatever order its rows are read', async () => {
    expect(await check([...cash].reverse())).toEqual([]);
    expect(await check([at(3), at(1), at(5), at(2), at(4)])).toEqual([]);
  });

  it('has none without entries', async () => {
    expect(await check([])).toEqual([]);
  });

  it('is checked with the names of the kinds the package lists', () => {
    expect(LEDGER_PROBLEM_KINDS).toEqual([
      'entry',
      'business',
      'stream',
      'seq',
      'prev_hash',
      'hash',
      'corrects',
      'anchor',
    ]);
  });
});

describe('a changed entry', () => {
  it.each([
    ['an amount', (row: AccountEntry) => ({ ...row, amount: rappen(-10) })],
    [
      'a field inside a record',
      (row: AccountEntry) => ({ ...row, ref: { ...row.ref, kind: 'x' } }),
    ],
    ['an item of a list', (row: AccountEntry) => ({ ...row, tags: ['a', 'c'] })],
    ['the order of a list', (row: AccountEntry) => ({ ...row, tags: ['b', 'a'] })],
    ['a field that was added', (row: AccountEntry) => ({ ...row, text: 'Nachgetragen' })],
    ['a field no schema knows', (row: AccountEntry) => ({ ...row, invented: 1 })],
    [
      'a field no schema knows inside a record',
      (row: AccountEntry) => ({ ...row, ref: { ...row.ref, page: 2 } }),
    ],
    [
      'a field no schema knows deep inside a list',
      (row: AccountEntry) => ({ ...row, tags: ['a', 'b', [{ later: { on: true } }]] }),
    ],
    ['nothing in the place of a field', (row: AccountEntry) => ({ ...row, text: null })],
    ['a number written as a text', (row: AccountEntry) => ({ ...row, amount: '-100' })],
    ['a field that was removed', (row: AccountEntry) => withField(row, 'ref', undefined)],
    ['the time', (row: AccountEntry) => ({ ...row, at: '2026-11-16T07:00:00.000Z' })],
    ['the person', (row: AccountEntry) => ({ ...row, actor: freshIds.next() })],
  ])('shows where it stands: %s', async (_what, change) => {
    const problems = await check(replaced(2, change(at(2))));
    expect(problems).toEqual([
      {
        kind: 'hash',
        businessId: t.one.businessId,
        stream: 'cash',
        position: 2,
        id: at(2).id,
        message: 'The hash does not match what the entry holds',
      },
    ]);
  });

  it('shows on the next entry if its checksum was written anew', async () => {
    const forged = await rehashed({ ...at(3), amount: rappen(2000) });
    expect(found(await check(replaced(3, forged)))).toEqual([[4, 'prev_hash']]);
  });

  it('shows twice if only the checksum was changed', async () => {
    const problems = await check(replaced(3, { ...at(3), hash: 'f'.repeat(64) }));
    expect(found(problems)).toEqual([
      [3, 'hash'],
      [4, 'prev_hash'],
    ]);
  });

  it('shows on the entry that corrects it if its id was changed', async () => {
    const problems = await check(replaced(2, { ...at(2), id: freshIds.next() }));
    expect(found(problems)).toEqual([
      [2, 'hash'],
      [4, 'corrects'],
    ]);
  });
});

describe('a changed place in the chain', () => {
  it('shows a changed seq', async () => {
    const problems = await check(replaced(2, { ...at(2), seq: 9 }));
    // The entry now stands at the end; the gap it left shows on the entry after it.
    expect(found(problems)).toEqual([
      [2, 'seq'],
      [2, 'prev_hash'],
      [3, 'corrects'],
      [5, 'seq'],
      [5, 'prev_hash'],
      [5, 'hash'],
    ]);
  });

  it('shows a changed prevHash', async () => {
    const problems = await check(replaced(3, { ...at(3), prevHash: at(1).hash }));
    expect(found(problems)).toEqual([
      [3, 'prev_hash'],
      [3, 'hash'],
    ]);
  });

  it('shows a prevHash that was removed', async () => {
    const problems = await check(replaced(2, withField(at(2), 'prevHash', undefined)));
    expect(found(problems)).toEqual([
      [2, 'prev_hash'],
      [2, 'hash'],
    ]);
  });

  it('shows a first entry that names an entry before it', async () => {
    const problems = await check(replaced(1, { ...at(1), prevHash: at(2).hash }));
    expect(found(problems)).toEqual([
      [1, 'prev_hash'],
      [1, 'hash'],
    ]);
    expect(problems[0]?.message).toMatch(/first entry/);
  });

  it('shows two entries that changed places', async () => {
    const swapped = cash.map((entry) => {
      if (entry.seq === 2) {
        return { ...entry, seq: 3 };
      }
      return entry.seq === 3 ? { ...entry, seq: 2 } : entry;
    });
    expect(found(await check(swapped))).toEqual([
      [2, 'prev_hash'],
      [2, 'hash'],
      [3, 'prev_hash'],
      [3, 'hash'],
      [4, 'prev_hash'],
    ]);
  });

  it('shows two entries that changed places, checksums written anew', async () => {
    const second = await rehashed({ ...at(3), seq: 2, prevHash: at(1).hash });
    const third = await rehashed({ ...at(2), seq: 3, prevHash: second.hash });
    const swapped = cash.map((entry) => {
      if (entry.seq === 2) {
        return third;
      }
      return entry.seq === 3 ? second : entry;
    });
    expect(found(await check(swapped))).toEqual([[4, 'prev_hash']]);
  });
});

describe('a removed entry', () => {
  it('shows on the entry after the gap', async () => {
    const problems = await check(cash.filter((entry) => entry.seq !== 3));
    expect(found(problems)).toEqual([
      [3, 'seq'],
      [3, 'prev_hash'],
    ]);
    expect(problems[0]).toMatchObject({ id: at(4).id, message: 'Expected seq 3, found 4' });
  });

  it('shows if it was the first', async () => {
    const problems = await check(cash.filter((entry) => entry.seq !== 1));
    expect(found(problems)).toEqual([
      [1, 'seq'],
      [1, 'prev_hash'],
    ]);
  });

  it('shows on its correction if it was corrected', async () => {
    const problems = await check(cash.filter((entry) => entry.seq !== 2));
    expect(found(problems)).toEqual([
      [2, 'seq'],
      [2, 'prev_hash'],
      [3, 'corrects'],
    ]);
  });

  it('does not show by itself if it was the last: that takes an anchor', async () => {
    const cut = cash.filter((entry) => entry.seq !== 5);
    expect(await check(cut)).toEqual([]);
    const anchor = { seq: 5, hash: at(5).hash };
    expect(await chainProblems(hasher, cut, { ...chain, anchor })).toEqual([
      {
        kind: 'anchor',
        businessId: t.one.businessId,
        stream: 'cash',
        position: 5,
        message: 'The chain no longer holds the entry noted as seq 5',
      },
    ]);
  });
});

describe('an entry that was put in', () => {
  it('shows, also with a checksum that fits it', async () => {
    const forged = await rehashed({
      ...at(3),
      id: freshIds.next(),
      amount: rappen(4000),
      prevHash: at(2).hash,
    });
    const problems = await check([...cash, forged]);
    // Two entries now claim the third place; the one put in stands behind the real one.
    expect(found(problems)).toEqual([
      [4, 'seq'],
      [4, 'prev_hash'],
      [5, 'prev_hash'],
    ]);
    expect(problems[0]?.id).toBe(forged.id);
  });

  it('shows at the end if it names the wrong entry before it', async () => {
    const forged = await rehashed({ ...at(5), id: freshIds.next(), seq: 6, prevHash: at(4).hash });
    expect(found(await check([...cash, forged]))).toEqual([[6, 'prev_hash']]);
  });

  it('shows if the same row is there twice', async () => {
    const problems = await check([...cash, at(5)]);
    expect(found(problems)).toEqual([
      [6, 'entry'],
      [6, 'seq'],
      [6, 'prev_hash'],
    ]);
    expect(problems[0]?.message).toMatch(/occurs twice/);
  });
});

describe('an entry in the wrong chain', () => {
  it('shows an entry that was moved to another stream', async () => {
    const problems = await check(replaced(2, { ...at(2), stream: 'bank' }));
    expect(found(problems)).toEqual([
      [2, 'stream'],
      [2, 'hash'],
    ]);
  });

  it('shows an entry that was moved to another business', async () => {
    const problems = await check(replaced(2, { ...at(2), businessId: t.two.businessId }));
    expect(found(problems)).toEqual([
      [2, 'business'],
      [2, 'hash'],
    ]);
  });

  it('shows a whole chain read as the chain of another business', async () => {
    const problems = await chainProblems(hasher, cash, {
      businessId: t.two.businessId,
      stream: 'cash',
    });
    expect(found(problems)).toEqual(cash.map((entry) => [entry.seq, 'business']));
  });
});

describe('a row that is no entry', () => {
  it.each([
    ['nothing', null],
    ['a text', 'entry'],
    ['a list', []],
    ['an empty record', {}],
    ['a date object', new Date(0)],
  ])('is reported without a place: %s', async (_what, row) => {
    const problems = await check([...cash, row]);
    expect(problems).toEqual([
      {
        kind: 'entry',
        businessId: t.one.businessId,
        stream: 'cash',
        message: expect.stringMatching(/^No entry: /) as string,
      },
    ]);
  });

  it.each([
    ['seq', 'three'],
    ['seq', 0],
    ['seq', undefined],
    ['hash', undefined],
    ['hash', 'short'],
    ['prevHash', 5],
    ['at', 'yesterday'],
    ['actor', undefined],
    ['businessId', 'elsewhere'],
    ['stream', 'Other Stream'],
    ['corrects', 'that one'],
  ])('is reported with its id and the field: %s as %j', async (field, value) => {
    const problems = await check([...cash.slice(0, 4), withField(at(5), field, value)]);
    expect(problems).toEqual([
      {
        kind: 'entry',
        businessId: t.one.businessId,
        stream: 'cash',
        id: at(5).id,
        message: `No entry: these fields do not fit: ${field}`,
      },
    ]);
  });

  it('is reported if it holds something that is not plain data', async () => {
    const problems = await check([...cash.slice(0, 4), { ...at(5), on: new Date(0) }]);
    expect(problems).toMatchObject([
      { kind: 'entry', id: at(5).id, message: 'No entry: it is not plain data' },
    ]);
  });

  it('leaves the entries around it to be checked as a chain', async () => {
    const problems = await check(replaced(3, withField(at(3), 'seq', 'three')));
    expect(found(problems)).toEqual([
      [undefined, 'entry'],
      [3, 'seq'],
      [3, 'prev_hash'],
    ]);
  });
});

describe('corrections', () => {
  it('must name an entry of the chain', async () => {
    const dangling = await rehashed({ ...at(5), corrects: freshIds.next() });
    const problems = await check(replaced(5, dangling));
    expect(found(problems)).toEqual([[5, 'corrects']]);
    expect(problems[0]?.message).toMatch(/is not before this one/);
  });

  it('must name an entry before the correction, not after it', async () => {
    const early = await rehashed({ ...at(1), corrects: at(3).id });
    const problems = await check(replaced(1, early));
    expect(found(problems)).toEqual([
      [1, 'corrects'],
      [2, 'prev_hash'],
    ]);
  });

  it('must not name the correction itself', async () => {
    const own = await rehashed({ ...at(5), corrects: at(5).id });
    expect(found(await check(replaced(5, own)))).toEqual([[5, 'corrects']]);
  });

  it('must not correct an entry a second time', async () => {
    const second = await rehashed({ ...at(5), corrects: at(2).id });
    const problems = await check(replaced(5, second));
    expect(found(problems)).toEqual([[5, 'corrects']]);
    expect(problems[0]?.message).toBe(`Entry ${at(2).id} was corrected already, by ${at(4).id}`);
  });
});

describe('an anchor', () => {
  it('holds while the entry it names is in the chain', async () => {
    for (const entry of cash) {
      const anchor = { seq: entry.seq, hash: entry.hash };
      expect(await chainProblems(hasher, cash, { ...chain, anchor })).toEqual([]);
    }
  });

  it.each([
    ['another checksum at that place', () => ({ seq: 3, hash: at(2).hash })],
    ['a place behind the end', () => ({ seq: 6, hash: at(5).hash })],
    ['a place that never was', () => ({ seq: 0, hash: at(1).hash })],
  ])('does not hold for %s', async (_what, anchor) => {
    expect(found(await chainProblems(hasher, cash, { ...chain, anchor: anchor() }))).toEqual([
      [anchor().seq, 'anchor'],
    ]);
  });

  it('shows a chain that was written anew from one entry on', async () => {
    // Somebody changes the second entry and writes every checksum after it again.
    const rewritten: AccountEntry[] = [at(1)];
    for (const entry of cash.slice(1)) {
      const changed = entry.seq === 2 ? { ...entry, amount: rappen(-1) } : entry;
      rewritten.push(await rehashed({ ...changed, prevHash: rewritten.at(-1)?.hash }));
    }
    expect(await check(rewritten)).toEqual([]);
    const anchor = { seq: 5, hash: at(5).hash };
    expect(found(await chainProblems(hasher, rewritten, { ...chain, anchor }))).toEqual([
      [5, 'anchor'],
    ]);
    // An anchor from before the change still holds: it says nothing about what came later.
    const early = { seq: 1, hash: at(1).hash };
    expect(await chainProblems(hasher, rewritten, { ...chain, anchor: early })).toEqual([]);
  });
});

describe('the hasher', () => {
  it('is asked once per entry', async () => {
    let calls = 0;
    const counting = {
      sha256: (data: Uint8Array) => {
        calls += 1;
        return hasher.sha256(data);
      },
    };
    await chainProblems(counting, cash, chain);
    expect(calls).toBe(cash.length);
  });

  it('fails the check if it fails: a broken hasher is no problem of the data', async () => {
    const failing = { sha256: () => Promise.reject(new Error('no digest today')) };
    await expect(chainProblems(failing, cash, chain)).rejects.toThrow('no digest today');
    const lying = { sha256: () => Promise.resolve('not a checksum') };
    await expect(chainProblems(lying, cash, chain)).rejects.toThrow(TypeError);
  });
});

describe('all chains of a table', () => {
  it('have no problems as the kit wrote them', async () => {
    expect(all).toHaveLength(8);
    expect(await allChainProblems(hasher, all)).toEqual([]);
    expect(await allChainProblems(hasher, [...all].reverse())).toEqual([]);
    expect(await allChainProblems(hasher, [])).toEqual([]);
  });

  it('are told apart by business and stream', async () => {
    const changed = all.map((row) =>
      row.businessId === t.two.businessId ? { ...row, amount: rappen(71) } : row,
    );
    expect(await allChainProblems(hasher, changed)).toMatchObject([
      { kind: 'hash', businessId: t.two.businessId, stream: 'cash', position: 1 },
    ]);
  });

  it('report problems chain by chain, sorted by business and stream', async () => {
    const changed = all.map((row) => ({ ...row, text: 'Überall geändert' }));
    const problems = await allChainProblems(hasher, changed);
    expect(
      problems.map((problem) => [problem.businessId, problem.stream, problem.position]),
    ).toEqual([
      [t.one.businessId, 'bank', 1],
      [t.one.businessId, 'bank', 2],
      ...cash.map((entry) => [t.one.businessId, 'cash', entry.seq]),
      [t.two.businessId, 'cash', 1],
    ]);
  });

  it.each([
    ['is no record', 'row'],
    ['is nothing', null],
    ['has no stream', { id: 'x', businessId: 'b' }],
    ['has a number as its stream', { id: 'x', businessId: 'b', stream: 5 }],
    ['has no business', { id: 'x', stream: 'cash' }],
  ])('report a row that %s, since it belongs to no chain', async (_what, row) => {
    const problems = await allChainProblems(hasher, [...all, row]);
    expect(problems).toEqual([
      {
        kind: 'entry',
        ...(typeof row === 'object' && row !== null ? { id: 'x' } : {}),
        message: 'No entry: it names no business and stream, so it belongs to no chain',
      },
    ]);
  });

  it('find an entry moved to another stream where it left and where it arrived', async () => {
    const moved = all.map((row) => (row.id === at(2).id ? { ...row, stream: 'bank' } : row));
    const problems = await allChainProblems(hasher, moved);
    expect(problems.map((problem) => [problem.stream, problem.position, problem.kind])).toEqual([
      // It claims the second place of the other chain and stands before the entry that has it.
      ['bank', 2, 'prev_hash'],
      ['bank', 2, 'hash'],
      ['bank', 3, 'seq'],
      ['bank', 3, 'prev_hash'],
      ['cash', 2, 'seq'],
      ['cash', 2, 'prev_hash'],
      ['cash', 3, 'corrects'],
    ]);
  });

  it('find the last entry of a chain moved elsewhere only where it arrived', async () => {
    const moved = all.map((row) =>
      row.id === at(5).id ? { ...row, businessId: t.two.businessId } : row,
    );
    const problems = await allChainProblems(hasher, moved);
    expect(problems.map((problem) => [problem.businessId, problem.stream, problem.kind])).toEqual([
      [t.two.businessId, 'cash', 'seq'],
      [t.two.businessId, 'cash', 'prev_hash'],
      [t.two.businessId, 'cash', 'hash'],
    ]);
  });

  it('find an entry moved into a stream nobody wrote to', async () => {
    const moved = all.map((row) => (row.id === at(5).id ? { ...row, stream: 'safe' } : row));
    const problems = await allChainProblems(hasher, moved);
    expect(problems.map((problem) => [problem.stream, problem.position, problem.kind])).toEqual([
      ['safe', 1, 'seq'],
      ['safe', 1, 'prev_hash'],
      ['safe', 1, 'hash'],
    ]);
  });
});

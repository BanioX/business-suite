import { rappen, type Id } from '@onestrand/core';
import { createBackupKit } from '@onestrand/storage';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  allChainProblems,
  canonicalJson,
  effectiveEntries,
  ledgerInvariantProblems,
  type LedgerAnchor,
} from '../src';
import {
  accountLedger,
  accountRows,
  createTestLedgers,
  deviceHolding,
  hasher,
  OVERDRAWN,
  REGISTRY,
  sequentialIds,
  withField,
  type AccountEntry,
  type TestLedgers,
} from './support';

/**
 * Any sequence of bookings and corrections, on several streams of two businesses. A model kept
 * beside the ledger says what must come out: per chain, the amounts that count, in their places.
 */

const STREAMS = ['cash', 'bank', 'safe'] as const;
const TIMEOUT = 60_000;

type Op =
  | { kind: 'append'; business: 0 | 1; stream: (typeof STREAMS)[number]; amount: number }
  | { kind: 'correct'; business: 0 | 1; pick: number; amount: number };

/** Rappen, in and out, small and large; more in than out, so that most bookings go through. */
const amountArb = fc.oneof(
  { weight: 5, arbitrary: fc.integer({ min: 0, max: 500_000 }) },
  { weight: 3, arbitrary: fc.integer({ min: -200_000, max: -1 }) },
  { weight: 1, arbitrary: fc.integer({ min: -1_000_000_000_000, max: 1_000_000_000_000 }) },
  { weight: 1, arbitrary: fc.constantFrom(0, 1, -1, 5, 95) },
);
const businessArb = fc.constantFrom(0 as const, 1 as const);

const opArb: fc.Arbitrary<Op> = fc.oneof(
  {
    weight: 3,
    arbitrary: fc.record({
      kind: fc.constant('append' as const),
      business: businessArb,
      stream: fc.constantFrom(...STREAMS),
      amount: amountArb,
    }),
  },
  {
    weight: 2,
    arbitrary: fc.record({
      kind: fc.constant('correct' as const),
      business: businessArb,
      pick: fc.nat(),
      amount: amountArb,
    }),
  },
);

/** What the model knows of one entry that was written. */
interface Written {
  id: Id;
  stream: string;
  amount: number;
  /** The place in `written` of the chain of the entry this one corrects. */
  corrects?: number;
}

interface ChainModel {
  /** Every entry of the chain, in the order written. */
  written: Written[];
  /** The entries that count, each in the place of the entry it stands for. */
  counted: { id: Id; amount: number }[];
}

/** The balance after every booking, in whole numbers without a limit: no float can hide here. */
function balances(amounts: readonly number[]): bigint[] {
  let balance = 0n;
  return amounts.map((amount) => (balance += BigInt(amount)));
}

const overdrawn = (amounts: readonly number[]) => balances(amounts).some((balance) => balance < 0n);

class Model {
  readonly chains = new Map<string, ChainModel>();

  chain(business: number, stream: string): ChainModel {
    const key = `${business}/${stream}`;
    const found = this.chains.get(key) ?? { written: [], counted: [] };
    this.chains.set(key, found);
    return found;
  }

  /** Every entry of a business, of all its streams, in no particular order. */
  entriesOf(business: number): Written[] {
    return [...this.chains.entries()]
      .filter(([key]) => key.startsWith(`${business}/`))
      .flatMap(([, chain]) => chain.written);
  }
}

/** Every row of the table as text, by id. */
async function snapshot(t: TestLedgers): Promise<Map<string, string>> {
  return new Map((await accountRows(t)).map((row) => [row.id, canonicalJson(row)]));
}

/**
 * Runs one operation against the ledger and the model, and checks what the model predicts: the
 * booking goes through with this state, or it is refused for this reason and nothing is written.
 */
async function run(t: TestLedgers, model: Model, op: Op): Promise<void> {
  const businessId = [t.one.businessId, t.two.businessId][op.business] ?? t.one.businessId;
  if (op.kind === 'append') {
    const chain = model.chain(op.business, op.stream);
    const amounts = [...chain.counted.map((entry) => entry.amount), op.amount];
    const booking = t.account.append(businessId, op.stream, { amount: rappen(op.amount) });
    if (overdrawn(amounts)) {
      await expect(booking).rejects.toMatchObject({ code: OVERDRAWN });
      return;
    }
    const { entry, state } = await booking;
    chain.written.push({ id: entry.id, stream: op.stream, amount: op.amount });
    chain.counted.push({ id: entry.id, amount: op.amount });
    expect(BigInt(state.balance)).toBe(balances(amounts).at(-1));
    expect(state.bookings).toBe(amounts.length);
    return;
  }

  const candidates = model.entriesOf(op.business);
  const target = candidates[op.pick % Math.max(candidates.length, 1)];
  const correction = t.account.correct(businessId, target?.id ?? t.ids.next(), {
    amount: rappen(op.amount),
  });
  if (target === undefined) {
    await expect(correction).rejects.toMatchObject({ code: 'not_found' });
    return;
  }
  const chain = model.chain(op.business, target.stream);
  const place = chain.counted.findIndex((entry) => entry.id === target.id);
  if (place === -1) {
    // It does not count any more: it was corrected before.
    await expect(correction).rejects.toMatchObject({ code: 'not_allowed' });
    return;
  }
  const amounts = chain.counted.map((entry, index) => (index === place ? op.amount : entry.amount));
  if (overdrawn(amounts)) {
    await expect(correction).rejects.toMatchObject({ code: OVERDRAWN });
    return;
  }
  const { entry, state } = await correction;
  chain.written.push({
    id: entry.id,
    stream: target.stream,
    amount: op.amount,
    corrects: chain.written.findIndex((written) => written.id === target.id),
  });
  chain.counted[place] = { id: entry.id, amount: op.amount };
  expect(entry.corrects).toBe(target.id);
  expect(BigInt(state.balance)).toBe(balances(amounts).at(-1));
  expect(state.bookings).toBe(amounts.length);
}

/** A ledger with a history that is never refused: only money in, and corrections to money in. */
async function historyOf(amounts: readonly number[], corrections: readonly number[]) {
  const t = await createTestLedgers();
  const written: AccountEntry[] = [];
  for (const [index, amount] of amounts.entries()) {
    const businessId = index % 3 === 2 ? t.two.businessId : t.one.businessId;
    const stream = STREAMS[index % 2] ?? 'cash';
    written.push((await t.account.append(businessId, stream, { amount: rappen(amount) })).entry);
  }
  const corrected = new Set<string>();
  for (const pick of corrections) {
    const target = written[pick % written.length];
    if (target !== undefined && !corrected.has(target.id)) {
      corrected.add(target.id);
      const { entry } = await t.account.correct(target.businessId, target.id, {
        amount: rappen(target.amount + 1),
        text: 'Korrektur',
      });
      written.push(entry);
    }
  }
  return { t, rows: await accountRows(t) };
}

const historyArb = fc.record({
  amounts: fc.array(fc.integer({ min: 0, max: 100_000 }), { minLength: 1, maxLength: 12 }),
  corrections: fc.array(fc.nat(), { maxLength: 4 }),
});

const HEX = Array.from('0123456789abcdef');
const hashArb = fc.string({ unit: fc.constantFrom(...HEX), minLength: 64, maxLength: 64 });
const freshIds = sequentialIds(800_000);

/** Any value a file can hold, without the one key the storage refuses as data. */
const jsonArb = fc.jsonValue().filter((value) => !JSON.stringify(value).includes('"__proto__"'));

/** One change to one row: any field set to anything, a field removed, or an aimed change. */
type Change =
  | { kind: 'set'; key: string; value: unknown }
  | { kind: 'remove'; key: string }
  | { kind: 'aimed'; what: (typeof AIMED)[number]; other: number; hash: string };

const KEYS = [
  'id',
  'businessId',
  'stream',
  'seq',
  'prevHash',
  'hash',
  'at',
  'actor',
  'corrects',
  'amount',
  'text',
  'ref',
  'tags',
  'invented',
] as const;

const AIMED = [
  'amount_plus_one',
  'seq_plus_one',
  'seq_minus_one',
  'seq_of_other',
  'prev_hash_of_other',
  'hash_of_other',
  'any_hash',
  'any_prev_hash',
  'other_stream',
  'other_business',
  'other_id',
  'fresh_id',
  'corrects_other',
  'later_time',
  'other_actor',
] as const;

const changeArb: fc.Arbitrary<Change> = fc.oneof(
  fc.record({ kind: fc.constant('set' as const), key: fc.constantFrom(...KEYS), value: jsonArb }),
  fc.record({ kind: fc.constant('remove' as const), key: fc.constantFrom(...KEYS) }),
  fc.record({
    kind: fc.constant('aimed' as const),
    what: fc.constantFrom(...AIMED),
    other: fc.nat(),
    hash: hashArb,
  }),
);

/** The row after the change. `other` is another row of the table to take values from. */
function changed(row: AccountEntry, other: AccountEntry, t: TestLedgers, change: Change): unknown {
  if (change.kind === 'set') {
    return withField(row, change.key, change.value);
  }
  if (change.kind === 'remove') {
    return withField(row, change.key, undefined);
  }
  switch (change.what) {
    case 'amount_plus_one':
      return { ...row, amount: row.amount + 1 };
    case 'seq_plus_one':
      return { ...row, seq: row.seq + 1 };
    case 'seq_minus_one':
      return { ...row, seq: row.seq - 1 };
    case 'seq_of_other':
      return { ...row, seq: other.seq };
    case 'prev_hash_of_other':
      return { ...row, prevHash: other.hash };
    case 'hash_of_other':
      return { ...row, hash: other.hash };
    case 'any_hash':
      return { ...row, hash: change.hash };
    case 'any_prev_hash':
      return { ...row, prevHash: change.hash };
    case 'other_stream':
      return { ...row, stream: row.stream === 'cash' ? 'bank' : 'cash' };
    case 'other_business':
      return {
        ...row,
        businessId: row.businessId === t.one.businessId ? t.two.businessId : t.one.businessId,
      };
    case 'other_id':
      return { ...row, id: other.id };
    case 'fresh_id':
      return { ...row, id: freshIds.next() };
    case 'corrects_other':
      return { ...row, corrects: other.id };
    case 'later_time':
      return { ...row, at: '2031-01-01T00:00:00.000Z' };
    case 'other_actor':
      return { ...row, actor: t.two.personId };
  }
}

describe('any sequence of bookings and corrections', () => {
  it(
    'gives the state the entries fold to, in a chain that holds, without touching what was written',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(opArb, { maxLength: 30 }), async (ops) => {
          const t = await createTestLedgers();
          const model = new Model();
          let seen = await snapshot(t);
          for (const op of ops) {
            await run(t, model, op);
            const now = await snapshot(t);
            // Earlier entries are the same, byte for byte, and at most one entry came.
            for (const [id, text] of seen) {
              expect(now.get(id)).toBe(text);
            }
            expect(now.size - seen.size).toBeLessThanOrEqual(1);
            seen = now;
          }

          const businesses = [t.one.businessId, t.two.businessId];
          for (const [index, businessId] of businesses.entries()) {
            const streams = STREAMS.filter(
              (stream) => model.chain(index, stream).written.length > 0,
            );
            expect(await t.account.streams(businessId)).toEqual([...streams].sort());
            for (const stream of STREAMS) {
              const chain = model.chain(index, stream);
              const entries = await t.account.entries(businessId, stream);

              // The entries are the ones the model saw written, in their places, in whole Rappen.
              expect(entries.map((entry) => entry.id)).toEqual(chain.written.map((w) => w.id));
              expect(entries.map((entry) => entry.seq)).toEqual(entries.map((_, i) => i + 1));
              expect(entries.every((entry) => Number.isSafeInteger(entry.amount))).toBe(true);
              expect(entries.every((entry) => entry.businessId === businessId)).toBe(true);
              expect(entries.map((entry) => entry.corrects)).toEqual(
                chain.written.map((w) =>
                  w.corrects === undefined ? undefined : chain.written[w.corrects]?.id,
                ),
              );

              // The state is the fold of the entries that count, and nothing else.
              const amounts = chain.counted.map((entry) => entry.amount);
              expect(effectiveEntries(entries).map((entry) => entry.id)).toEqual(
                chain.counted.map((entry) => entry.id),
              );
              const state = await t.account.state(businessId, stream);
              expect(Number.isSafeInteger(state.balance)).toBe(true);
              expect(BigInt(state.balance)).toBe(balances(amounts).at(-1) ?? 0n);
              expect(state.bookings).toBe(amounts.length);

              // The chain holds, and its end is the last entry.
              const last = entries.at(-1);
              expect(await t.account.verify(businessId, stream)).toEqual({
                ok: true,
                entries: entries.length,
                ...(last === undefined ? {} : { head: { seq: last.seq, hash: last.hash } }),
              });
            }
            expect(await t.account.verifyAll(businessId)).toMatchObject({
              ok: true,
              entries: model.entriesOf(index).length,
            });
          }
          expect(
            await ledgerInvariantProblems(accountLedger, hasher, await accountRows(t)),
          ).toEqual([]);
        }),
      );
    },
    TIMEOUT,
  );

  it(
    'writes a chain as if its stream were alone: other streams and businesses change nothing',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(opArb, { maxLength: 30 }), async (ops) => {
          const t = await createTestLedgers();
          const model = new Model();
          for (const op of ops) {
            await run(t, model, op);
          }
          for (const [key, chain] of model.chains) {
            const [business = '0', stream = 'cash'] = key.split('/');
            const businessId = business === '0' ? t.one.businessId : t.two.businessId;
            // The same bookings again, on a device that never saw another stream or business.
            const alone = await createTestLedgers();
            const ids: Id[] = [];
            for (const written of chain.written) {
              const target = written.corrects === undefined ? undefined : ids[written.corrects];
              const payload = { amount: rappen(written.amount) };
              const { entry } =
                target === undefined
                  ? await alone.account.append(alone.one.businessId, stream, payload)
                  : await alone.account.correct(alone.one.businessId, target, payload);
              ids.push(entry.id);
            }
            const mixed = await t.account.entries(businessId, stream);
            const single = await alone.account.entries(alone.one.businessId, stream);
            const shape = (entries: readonly AccountEntry[]) =>
              entries.map((entry) => ({
                seq: entry.seq,
                amount: entry.amount,
                corrects: entries.findIndex((other) => other.id === entry.corrects),
                chained: entry.prevHash === entries[entry.seq - 2]?.hash,
              }));
            expect(shape(mixed)).toEqual(shape(single));
            expect(await t.account.state(businessId, stream)).toEqual(
              await alone.account.state(alone.one.businessId, stream),
            );
          }
        }),
        { numRuns: 50 },
      );
    },
    TIMEOUT,
  );
});

describe('a single changed entry', () => {
  it(
    'breaks the check, whatever was changed',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          historyArb,
          fc.nat(),
          fc.nat(),
          changeArb,
          async ({ amounts, corrections }, pick, otherPick, change) => {
            const { t, rows } = await historyOf(amounts, corrections);
            const row = rows[pick % rows.length];
            const other = rows[otherPick % rows.length];
            if (row === undefined || other === undefined) {
              throw new Error('A history has at least one entry');
            }
            const after = changed(row, other, t, change);
            // A change that leaves the row as it was is none (the same value, -0 for 0).
            fc.pre(canonicalJson(after) !== canonicalJson(row));
            const table = rows.map((entry) => (entry === row ? after : entry));

            expect(await allChainProblems(hasher, rows)).toEqual([]);
            expect(await allChainProblems(hasher, table)).not.toEqual([]);

            // The same through the kit, on a device that holds the changed table, if a table
            // can hold it at all (a row needs its id and its business, an id is there once).
            const device = await deviceHolding(table).catch(() => undefined);
            const claimed = (after as { businessId?: unknown }).businessId;
            if (device !== undefined && typeof claimed === 'string') {
              const result = await device.account.verifyAll(claimed as Id);
              expect(result.ok).toBe(false);
            }
          },
        ),
        { numRuns: 300 },
      );
    },
    TIMEOUT,
  );

  it(
    'breaks the check of its stream, or of the stream it was moved to',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          historyArb,
          fc.nat(),
          fc.nat(),
          changeArb,
          async ({ amounts, corrections }, pick, otherPick, change) => {
            const { t, rows } = await historyOf(amounts, corrections);
            const row = rows[pick % rows.length];
            const other = rows[otherPick % rows.length];
            if (row === undefined || other === undefined) {
              throw new Error('A history has at least one entry');
            }
            const after = changed(row, other, t, change) as Partial<AccountEntry>;
            fc.pre(canonicalJson(after) !== canonicalJson(row));
            const device = await deviceHolding(rows.map((entry) => (entry === row ? after : entry)))
              // Not a table a storage can hold; the property above covers the rows themselves.
              .catch(() => undefined);
            fc.pre(device !== undefined);
            fc.pre(typeof after.businessId === 'string' && typeof after.stream === 'string');

            const left = await device.account.verify(row.businessId, row.stream);
            const arrived = await device.account.verify(
              after.businessId ?? row.businessId,
              after.stream ?? row.stream,
            );
            expect([left.ok, arrived.ok]).toContain(false);
          },
        ),
        { numRuns: 200 },
      );
    },
    TIMEOUT,
  );
});

describe('a ledger that goes through a backup', () => {
  /** Any text a person could type, as its schema stores it: trimmed and not empty. */
  const textArb = fc
    .string({ unit: 'grapheme', maxLength: 30 })
    .map((text) => text.trim())
    .filter((text) => text.length > 0);

  const bookingArb = fc.record({
    amount: fc.oneof(
      fc.integer({ min: 0, max: 500_000 }),
      // Large, but the sum of all bookings of a run stays a whole number a file can carry.
      fc.constantFrom(0, -0, 900_000_000_000_000),
    ),
    text: fc.option(textArb, { nil: undefined }),
    tags: fc.option(fc.array(textArb, { maxLength: 3 }), { nil: undefined }),
    correct: fc.boolean(),
  });

  it(
    'comes back the same, byte for byte, with every chain whole',
    async () => {
      const backups = createBackupKit({
        format: 'sample-backup',
        version: 1,
        registry: REGISTRY,
        hasher,
      });
      await fc.assert(
        fc.asyncProperty(fc.array(bookingArb, { minLength: 1, maxLength: 8 }), async (bookings) => {
          const t = await createTestLedgers();
          const { businessId } = t.one;
          for (const [index, { amount, text, tags, correct }] of bookings.entries()) {
            const stream = STREAMS[index % 2] ?? 'cash';
            const payload = {
              amount: rappen(amount),
              ...(text === undefined ? {} : { text }),
              ...(tags === undefined ? {} : { tags }),
            };
            const { entry } = await t.account.append(businessId, stream, payload);
            if (correct) {
              await t.account.correct(businessId, entry.id, { ...payload, text: 'Korrektur' });
            }
          }
          const before = await accountRows(t);

          // Out as a file, in again on another device.
          const document = await backups.exportBackup(t.storage, businessId, { clock: t.clock });
          const check = await backups.checkBackup(JSON.parse(JSON.stringify(document)));
          expect(check.preview.problems).toEqual([]);
          const other = await createTestLedgers();
          if (check.backup === undefined) {
            throw new Error('The backup was refused');
          }
          await backups.restoreBackup(other.storage, check.backup);

          const after = await other.storage.table('account_entries').ofBusiness(businessId);
          expect(after.map((row) => canonicalJson(row)).sort()).toEqual(
            before.map((row) => canonicalJson(row)).sort(),
          );
          expect(await other.account.verifyAll(businessId)).toEqual(
            await t.account.verifyAll(businessId),
          );
          expect(await ledgerInvariantProblems(accountLedger, hasher, after, { before })).toEqual(
            [],
          );
          for (const stream of await t.account.streams(businessId)) {
            expect(await other.account.state(businessId, stream)).toEqual(
              await t.account.state(businessId, stream),
            );
          }
        }),
        { numRuns: 50 },
      );
    },
    TIMEOUT,
  );
});

describe('a single removed entry', () => {
  it(
    'breaks the check if it stood inside a chain, and the check against an anchor if it was the last',
    async () => {
      await fc.assert(
        fc.asyncProperty(historyArb, fc.nat(), async ({ amounts, corrections }, pick) => {
          const { t, rows } = await historyOf(amounts, corrections);
          const row = rows[pick % rows.length];
          if (row === undefined) {
            throw new Error('A history has at least one entry');
          }
          const noted = await t.account.verify(row.businessId, row.stream);
          const anchor: LedgerAnchor | undefined = noted.ok ? noted.head : undefined;
          const device = await deviceHolding(rows.filter((entry) => entry !== row));
          const alone = await device.account.verify(row.businessId, row.stream);
          const anchored = await device.account.verify(row.businessId, row.stream, anchor);

          const last = anchor?.seq === row.seq;
          expect(alone.ok).toBe(last);
          expect(anchored.ok).toBe(false);
        }),
      );
    },
    TIMEOUT,
  );
});

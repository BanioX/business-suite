import { command, commandBase, createCommandKit } from '@onestrand/contract';
import { rappen, RappenSchema } from '@onestrand/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createLedger } from '../src';
import {
  accountEntriesTable,
  accountLedger,
  accountRows,
  createTestLedgers,
  hasher,
  lockingStorage,
  nextTask,
  OVERDRAWN,
  slowHasher,
  type TestLedgers,
} from './support';

/**
 * Bookings that are started before the one before them is over. Every booking reads the end of
 * its chain, waits for a checksum and writes: without an order between them, two would read the
 * same end and write the same place twice.
 */

/** The same ledger, written by the second person and with a checksum that takes its time. */
function slowLedger(t: TestLedgers) {
  return createLedger(accountLedger, {
    storage: t.storage,
    hasher: slowHasher,
    clock: t.clock,
    ids: t.ids,
    actor: t.two.personId,
  });
}

describe('bookings started at the same time', () => {
  it('get one place each in the chain of their stream, in the order they were started', async () => {
    const t = await createTestLedgers();
    const { businessId } = t.one;
    const bookings = await Promise.all(
      [500, 20, 7, 1, 3].map((amount) =>
        t.account.append(businessId, 'cash', { amount: rappen(amount) }),
      ),
    );
    expect(bookings.map((booking) => booking.entry.seq)).toEqual([1, 2, 3, 4, 5]);
    expect(bookings.map((booking) => booking.entry.amount)).toEqual([500, 20, 7, 1, 3]);
    expect(bookings.map((booking) => booking.state.balance)).toEqual([500, 520, 527, 528, 531]);
    expect(await t.account.verify(businessId, 'cash')).toMatchObject({ ok: true, entries: 5 });
  });

  it('get their places also when the checksum takes its time', async () => {
    const t = await createTestLedgers();
    const slow = slowLedger(t);
    const bookings = await Promise.all(
      [5, 6, 7].map((amount) => slow.append(t.one.businessId, 'cash', { amount: rappen(amount) })),
    );
    expect(bookings.map((booking) => booking.entry.seq)).toEqual([1, 2, 3]);
    expect(await slow.verify(t.one.businessId, 'cash')).toMatchObject({ ok: true, entries: 3 });
  });

  it('keep the chains of several streams and businesses whole', async () => {
    const t = await createTestLedgers();
    const places = [
      [t.one.businessId, 'cash'],
      [t.one.businessId, 'bank'],
      [t.two.businessId, 'cash'],
    ] as const;
    const bookings = await Promise.all(
      [0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
        const [businessId, stream] = places[index % 3] ?? places[0];
        return t.account.append(businessId, stream, { amount: rappen(index) });
      }),
    );
    expect(bookings.map((booking) => booking.entry.seq)).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3]);
    for (const [businessId, stream] of places) {
      expect(await t.account.verify(businessId, stream)).toMatchObject({ ok: true, entries: 3 });
    }
  });

  it('wait for each other across two ledgers set up on the same storage', async () => {
    const t = await createTestLedgers();
    const other = slowLedger(t);
    const { businessId } = t.one;
    const bookings = await Promise.all([
      other.append(businessId, 'cash', { amount: rappen(1) }),
      t.account.append(businessId, 'cash', { amount: rappen(2) }),
      other.append(businessId, 'cash', { amount: rappen(3) }),
      t.account.append(businessId, 'cash', { amount: rappen(4) }),
    ]);
    expect(bookings.map((booking) => booking.entry.seq)).toEqual([1, 2, 3, 4]);
    expect(bookings.map((booking) => booking.entry.actor)).toEqual([
      t.two.personId,
      t.one.personId,
      t.two.personId,
      t.one.personId,
    ]);
    expect(await t.account.verify(businessId, 'cash')).toMatchObject({ ok: true, entries: 4 });
  });

  it('do not wait for a ledger on another device', async () => {
    const one = await createTestLedgers();
    const two = await createTestLedgers();
    // The first device never finishes its checksum; the second one is not held up by it.
    const stuck = createLedger(accountLedger, {
      storage: one.storage,
      hasher: { sha256: () => new Promise<string>(() => undefined) },
      clock: one.clock,
      ids: one.ids,
      actor: one.one.personId,
    });
    void stuck.append(one.one.businessId, 'cash', { amount: rappen(1) });
    await nextTask();
    const { entry } = await two.account.append(two.one.businessId, 'cash', { amount: rappen(2) });
    expect(entry.seq).toBe(1);
  });

  it('correct an entry once: the second correction finds the first', async () => {
    const t = await createTestLedgers();
    const { businessId } = t.one;
    const first = await t.account.append(businessId, 'cash', { amount: rappen(500) });
    const results = await Promise.allSettled([
      t.account.correct(businessId, first.entry.id, { amount: rappen(450) }),
      t.account.correct(businessId, first.entry.id, { amount: rappen(400) }),
    ]);
    expect(results.map((result) => result.status)).toEqual(['fulfilled', 'rejected']);
    expect(results[1]).toMatchObject({ reason: { code: 'not_allowed' } });
    expect(await t.account.state(businessId, 'cash')).toEqual({ balance: 450, bookings: 1 });
    expect(await t.account.verify(businessId, 'cash')).toMatchObject({ ok: true, entries: 2 });
  });

  it('go on after one of them was refused', async () => {
    const t = await createTestLedgers();
    const { businessId } = t.one;
    const results = await Promise.allSettled([
      t.account.append(businessId, 'cash', { amount: rappen(100) }),
      t.account.append(businessId, 'cash', { amount: rappen(-101) }),
      t.account.append(businessId, 'cash', { amount: rappen(-100) }),
      t.account.correct(businessId, t.ids.next(), { amount: rappen(1) }),
      t.account.append(businessId, 'cash', { amount: rappen(7) }),
    ]);
    expect(results.map((result) => result.status)).toEqual([
      'fulfilled',
      'rejected',
      'fulfilled',
      'rejected',
      'fulfilled',
    ]);
    expect(results[1]).toMatchObject({ reason: { code: OVERDRAWN } });
    expect(results[3]).toMatchObject({ reason: { code: 'not_found' } });
    const entries = await t.account.entries(businessId, 'cash');
    expect(entries.map((entry) => [entry.seq, entry.amount])).toEqual([
      [1, 100],
      [2, -100],
      [3, 7],
    ]);
    expect(await t.account.verify(businessId, 'cash')).toMatchObject({ ok: true, entries: 3 });
  });
});

describe('any bookings started at the same time', () => {
  const bookingArb = fc.record({
    business: fc.constantFrom(0 as const, 1 as const),
    stream: fc.constantFrom('cash', 'bank'),
    // More in than out, so that some bookings are refused and most are not.
    amount: fc.oneof(fc.integer({ min: 0, max: 1000 }), fc.integer({ min: -600, max: -1 })),
  });

  it('leave the table exactly as the same bookings one after the other', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(bookingArb, { maxLength: 12 }), async (bookings) => {
        const together = await createTestLedgers();
        const inOrder = await createTestLedgers();
        const book = (t: TestLedgers, { business, stream, amount }: (typeof bookings)[number]) =>
          t.account.append(business === 0 ? t.one.businessId : t.two.businessId, stream, {
            amount: rappen(amount),
          });

        const outcomes = await Promise.allSettled(
          bookings.map((booking) => book(together, booking)),
        );
        const expected: string[] = [];
        for (const booking of bookings) {
          expected.push(
            await book(inOrder, booking).then(
              () => 'fulfilled',
              () => 'rejected',
            ),
          );
        }

        expect(outcomes.map((outcome) => outcome.status)).toEqual(expected);
        // Same ids, same places, same checksums: the order of the calls is the order of the chain.
        expect(await accountRows(together)).toEqual(await accountRows(inOrder));
        for (const businessId of [together.one.businessId, together.two.businessId]) {
          expect(await together.account.verifyAll(businessId)).toMatchObject({ ok: true });
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe('bookings started at the same time inside one command', () => {
  const transfer = command({
    name: 'account.transfer',
    summary: 'Books two amounts on one account at once.',
    access: { feature: 'account', level: 'operate' },
    input: z.object({ ...commandBase, amounts: z.array(RappenSchema) }),
    output: z.object({ places: z.array(z.int()) }),
  });

  async function setup() {
    const t = await createTestLedgers();
    const kit = createCommandKit({
      storage: t.storage,
      clock: t.clock,
      ids: t.ids,
      actor: t.one.personId,
    });
    const run = (amounts: readonly number[]) => {
      const input = transfer.input.parse({
        commandId: t.ids.next(),
        businessId: t.one.businessId,
        amounts,
      });
      return kit.runCommand(transfer, input, async () => {
        const bookings = await Promise.all(
          input.amounts.map((amount) => t.account.append(input.businessId, 'cash', { amount })),
        );
        await kit.emit(input.businessId, 'account_entry.booked', { count: bookings.length });
        return { places: bookings.map((booking) => booking.entry.seq) };
      });
    };
    return { t, run };
  }

  it('are all booked, each in its place', async () => {
    const { t, run } = await setup();
    expect(await run([500, -100, 20])).toEqual({ places: [1, 2, 3] });
    expect(await t.account.state(t.one.businessId, 'cash')).toEqual({ balance: 420, bookings: 3 });
    expect(await t.account.verify(t.one.businessId, 'cash')).toMatchObject({ ok: true });
  });

  it('are all undone if one of them is refused', async () => {
    const { t, run } = await setup();
    await expect(run([500, -501, 20])).rejects.toMatchObject({ code: OVERDRAWN });
    expect(await accountRows(t)).toEqual([]);
    expect(await t.storage.events.ofBusiness(t.one.businessId)).toEqual([]);
  });
});

describe('on a storage whose transactions wait for each other', () => {
  /** Fails instead of hanging if two bookings wait for each other. */
  const TIMEOUT = 2000;

  async function setup() {
    const t = await createTestLedgers();
    const storage = lockingStorage(t.storage);
    const account = createLedger(accountLedger, {
      storage,
      hasher: slowHasher,
      clock: t.clock,
      ids: t.ids,
      actor: t.one.personId,
    });
    return { t, storage, account, businessId: t.one.businessId };
  }

  it(
    'two bookings of two transactions follow each other',
    async () => {
      const { t, account, businessId } = await setup();
      const bookings = await Promise.all([
        account.append(businessId, 'cash', { amount: rappen(500) }),
        account.append(businessId, 'cash', { amount: rappen(20) }),
      ]);
      expect(bookings.map((booking) => booking.entry.seq)).toEqual([1, 2]);
      expect(await t.account.verify(businessId, 'cash')).toMatchObject({ ok: true, entries: 2 });
    },
    TIMEOUT,
  );

  it(
    'a booking started beside a transaction at work does not take the turn of its bookings',
    async () => {
      const { t, storage, account, businessId } = await setup();
      let goOn = (): void => undefined;
      const pause = new Promise<void>((resolve) => {
        goOn = resolve;
      });
      // A command is at work: its transaction has the storage and has not booked yet.
      const inside = storage.transaction(async () => {
        await storage.table(accountEntriesTable).ofBusiness(businessId);
        await pause;
        const first = await account.append(businessId, 'cash', { amount: rappen(500) });
        const second = await account.append(businessId, 'cash', { amount: rappen(-100) });
        return [first.entry.seq, second.entry.seq];
      });
      // Meanwhile a booking of its own transaction starts; the storage lets it wait.
      const beside = account.append(businessId, 'cash', { amount: rappen(7) });
      await nextTask();
      goOn();
      expect(await inside).toEqual([1, 2]);
      expect((await beside).entry.seq).toBe(3);
      expect(await t.account.verify(businessId, 'cash')).toMatchObject({ ok: true, entries: 3 });
    },
    TIMEOUT,
  );
});

describe('a booking whose checksum fails', () => {
  it.each([
    ['fails', () => Promise.reject(new Error('no digest today')), 'no digest today'],
    ['answers with something that is no checksum', () => Promise.resolve('ABC'), /sha256|hex/i],
  ])(
    'writes nothing if the hasher %s, and the next booking goes on',
    async (_what, sha256, why) => {
      const t = await createTestLedgers();
      const { businessId } = t.one;
      await t.account.append(businessId, 'cash', { amount: rappen(500) });
      const broken = createLedger(accountLedger, {
        storage: t.storage,
        hasher: { sha256 },
        clock: t.clock,
        ids: t.ids,
        actor: t.one.personId,
      });
      const results = await Promise.allSettled([
        broken.append(businessId, 'cash', { amount: rappen(1) }),
        t.account.append(businessId, 'cash', { amount: rappen(2) }),
      ]);
      expect(results.map((result) => result.status)).toEqual(['rejected', 'fulfilled']);
      await expect(broken.append(businessId, 'cash', { amount: rappen(1) })).rejects.toThrow(why);
      const entries = await t.account.entries(businessId, 'cash');
      expect(entries.map((entry) => [entry.seq, entry.amount])).toEqual([
        [1, 500],
        [2, 2],
      ]);
      expect(await t.account.verify(businessId, 'cash')).toMatchObject({ ok: true, entries: 2 });
    },
  );

  it('takes the whole command with it', async () => {
    const t = await createTestLedgers();
    const broken = createLedger(accountLedger, {
      storage: t.storage,
      hasher: { sha256: () => Promise.reject(new Error('no digest today')) },
      clock: t.clock,
      ids: t.ids,
      actor: t.one.personId,
    });
    const outer = t.storage.transaction(async () => {
      await t.account.append(t.one.businessId, 'cash', { amount: rappen(500) });
      // Caught, but the transaction it was part of does not go through.
      await broken.append(t.one.businessId, 'cash', { amount: rappen(1) }).catch(() => undefined);
    });
    await expect(outer).rejects.toThrow('no digest today');
    expect(await accountRows(t)).toEqual([]);
  });
});

describe('the checksum of a booking', () => {
  it('is asked for once, after the end of the chain was read', async () => {
    const t = await createTestLedgers();
    const asked: string[] = [];
    const listening = createLedger(accountLedger, {
      storage: t.storage,
      hasher: {
        sha256: async (data) => {
          const rows = await accountRows(t);
          asked.push(`${rows.length} stored`);
          return hasher.sha256(data);
        },
      },
      clock: t.clock,
      ids: t.ids,
      actor: t.one.personId,
    });
    await listening.append(t.one.businessId, 'cash', { amount: rappen(1) });
    await listening.append(t.one.businessId, 'cash', { amount: rappen(2) });
    expect(asked).toEqual(['0 stored', '1 stored']);
  });
});

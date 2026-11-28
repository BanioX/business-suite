import { describe, expect, it } from 'vitest';
import { createCommandKit } from '../src';
import { createTestContext, takingTurns } from './support';

/**
 * The fake storage of these tests stands for every storage behind the ports of a command. What
 * the ports promise is pinned here, so the tests of the kit rest on a fake that keeps it; the
 * memory storage of `@onestrand/storage` has the same tests for the same behaviour.
 */
describe('the fake storage: one transaction', () => {
  it('keeps what was written when the work comes to its end', async () => {
    const t = createTestContext();
    const { emit } = createCommandKit(t.ctx);
    expect(
      await t.storage.transaction(async () => {
        await emit(t.businessId, 'customer.created');
        return 'done';
      }),
    ).toBe('done');
    expect(t.storage.allEvents()).toHaveLength(1);
    expect(t.storage.transactions()).toBe(1);
  });

  it('restores both logs when the work fails, and hands on the error as it was thrown', async () => {
    const t = createTestContext();
    const { emit } = createCommandKit(t.ctx);
    await emit(t.businessId, 'customer.created');
    const failure = new Error('the work fails');
    const entry = {
      commandId: t.cmd(),
      businessId: t.businessId,
      operation: 'customers.create',
      result: {},
      at: t.clock.now(),
    };
    const attempt = t.storage.transaction(async () => {
      await emit(t.businessId, 'customer.renamed');
      await t.storage.commands.record(entry);
      throw failure;
    });
    expect(await attempt.catch((caught: unknown) => caught)).toBe(failure);
    expect(t.storage.allEvents().map((event) => event.type)).toEqual(['customer.created']);
    expect(t.storage.allCommands()).toEqual([]);
    // The next transaction starts clean.
    await t.storage.transaction(() => t.storage.commands.record(entry));
    expect(t.storage.allCommands()).toEqual([entry]);
  });

  it('copies values in and out', async () => {
    const t = createTestContext();
    const result = { names: ['Betrieb Muster'] };
    const commandId = t.cmd();
    await t.storage.commands.record({
      commandId,
      businessId: t.businessId,
      operation: 'customers.create',
      result,
      at: t.clock.now(),
    });
    result.names.push('changed after it was recorded');
    const found = await t.storage.commands.find(commandId);
    expect(found?.result).toEqual({ names: ['Betrieb Muster'] });
    (found?.result as { names: string[] }).names.push('changed after it was read');
    expect((await t.storage.commands.find(commandId))?.result).toEqual({
      names: ['Betrieb Muster'],
    });
  });

  it('refuses a second entry for a commandId', async () => {
    const t = createTestContext();
    const entry = {
      commandId: t.cmd(),
      businessId: t.businessId,
      operation: 'customers.create',
      result: {},
      at: t.clock.now(),
    };
    await t.storage.commands.record(entry);
    await expect(
      t.storage.commands.record({ ...entry, businessId: t.otherBusinessId }),
    ).rejects.toThrow(`Command ${entry.commandId} is recorded already`);
    expect(t.storage.allCommands()).toEqual([entry]);
  });
});

describe('the fake storage: a transaction inside another', () => {
  it('joins it: the outer one decides what is kept', async () => {
    const t = createTestContext();
    const { emit } = createCommandKit(t.ctx);
    await expect(
      t.storage.transaction(async () => {
        await t.storage.transaction(() => emit(t.businessId, 'customer.created'));
        throw new Error('the outer work fails');
      }),
    ).rejects.toThrow('the outer work fails');
    expect(t.storage.allEvents()).toEqual([]);
    expect(t.storage.transactions()).toBe(1);
  });

  it('shares its fate: a failed inner one fails the outer one, even if the error was caught', async () => {
    const t = createTestContext();
    const { emit } = createCommandKit(t.ctx);
    const failure = new Error('the inner work fails');
    let wentOn = false;
    const attempt = t.storage.transaction(async () => {
      await emit(t.businessId, 'customer.created');
      await t.storage
        .transaction(async () => {
          await emit(t.businessId, 'customer.renamed');
          throw failure;
        })
        .catch(() => undefined);
      await emit(t.businessId, 'customer.removed');
      wentOn = true;
    });
    // The outer work came to its end; the transaction fails all the same, with the first error.
    expect(await attempt.catch((caught: unknown) => caught)).toBe(failure);
    expect(wentOn).toBe(true);
    expect(t.storage.allEvents()).toEqual([]);
  });

  it('reports the first of several failures inside', async () => {
    const t = createTestContext();
    const attempt = t.storage.transaction(async () => {
      for (const reason of ['first', 'second']) {
        await t.storage.transaction(() => Promise.reject(new Error(reason))).catch(() => undefined);
      }
    });
    await expect(attempt).rejects.toThrow('first');
  });

  it('is not failed by a single call that was refused and caught', async () => {
    const t = createTestContext();
    const { emit } = createCommandKit(t.ctx);
    const entry = {
      commandId: t.cmd(),
      businessId: t.businessId,
      operation: 'customers.create',
      result: {},
      at: t.clock.now(),
    };
    await t.storage.commands.record(entry);
    await t.storage.transaction(async () => {
      // Not a transaction of its own: a refused call that is caught undoes nothing.
      await t.storage.commands.record(entry).catch(() => undefined);
      await emit(t.businessId, 'customer.created');
    });
    expect(t.storage.allEvents()).toHaveLength(1);
  });

  it('keeps a late failure away from the transaction that starts next', async () => {
    const t = createTestContext();
    const { emit } = createCommandKit(t.ctx);
    let fail: (reason: Error) => void = () => undefined;
    const held = new Promise<never>((_resolve, reject) => {
      fail = reject;
    });
    let late: Promise<unknown> = Promise.resolve();
    await t.storage.transaction(() => {
      // Started inside, never awaited: it is still open when the outer one is over.
      late = t.storage.transaction(() => held).catch((caught: unknown) => caught);
      return Promise.resolve();
    });
    const next = t.storage.transaction(async () => {
      fail(new Error('too late'));
      await late;
      await emit(t.businessId, 'customer.created');
    });
    await expect(next).resolves.toBeUndefined();
    expect(t.storage.allEvents()).toHaveLength(1);
  });
});

describe('takingTurns', () => {
  it('lets a transaction wait until the one started before it is over', async () => {
    const t = createTestContext();
    const storage = takingTurns(t.storage);
    const steps: string[] = [];
    const work = (name: string) => async () => {
      steps.push(`${name} starts`);
      await storage.events.ofBusiness(t.businessId);
      await storage.events.ofBusiness(t.businessId);
      steps.push(`${name} ends`);
      return name;
    };
    expect(
      await Promise.all([storage.transaction(work('first')), storage.transaction(work('second'))]),
    ).toEqual(['first', 'second']);
    expect(steps).toEqual(['first starts', 'first ends', 'second starts', 'second ends']);
    expect(t.storage.transactions()).toBe(2);
  });

  it('goes on after a transaction that failed, and undoes only that one', async () => {
    const t = createTestContext();
    const storage = takingTurns(t.storage);
    const { emit } = createCommandKit({ ...t.ctx, storage });
    const [first, second] = await Promise.allSettled([
      storage.transaction(async () => {
        await emit(t.businessId, 'customer.created');
        throw new Error('the first fails');
      }),
      storage.transaction(() => emit(t.businessId, 'customer.renamed')),
    ]);
    expect(first).toMatchObject({ status: 'rejected', reason: { message: 'the first fails' } });
    expect(second.status).toBe('fulfilled');
    expect(t.storage.allEvents().map((event) => event.type)).toEqual(['customer.renamed']);
  });

  it('lets a transaction inside another join it instead of waiting for it', async () => {
    const t = createTestContext();
    const storage = takingTurns(t.storage);
    const { emit } = createCommandKit({ ...t.ctx, storage });
    const failure = new Error('the inner work fails');
    const attempt = storage.transaction(async () => {
      // Two at once inside one transaction: both belong to it.
      await Promise.all([
        storage.transaction(() => emit(t.businessId, 'customer.created')),
        storage.transaction(() => emit(t.businessId, 'customer.renamed')),
      ]);
      await storage.transaction(() => Promise.reject(failure)).catch(() => undefined);
    });
    // Joined, so it shares the fate of the one outside.
    expect(await attempt.catch((caught: unknown) => caught)).toBe(failure);
    expect(t.storage.allEvents()).toEqual([]);
    expect(t.storage.transactions()).toBe(1);
  });
});

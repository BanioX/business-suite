import { IsoDateTimeSchema, QuantitySchema, type Id, type IsoDateTime } from '@onestrand/core';
import fc from 'fast-check';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import {
  command,
  commandBase,
  CommandError,
  createCommandKit,
  type CommandKit,
  type CommandStorage,
  type DomainEvent,
  type OperationOutput,
  type Transactional,
  type UseCase,
} from '../src';
import { customersContract, type Customer, type CustomersContract } from './sample-contract';
import { createTestContext, takingTurns, type TestContext } from './support';

const createOperation = customersContract['customers.create'];
const removeOperation = customersContract['customers.remove'];
const listOperation = customersContract['customers.list'];

/** The use cases of the sample fragment, as a module would write them. */
function createCustomers(t: TestContext) {
  const { emit, runCommand, stamps } = createCommandKit(t.ctx);
  let executed = 0;

  const create: UseCase<CustomersContract['customers.create']> = async (raw) => {
    const input = createOperation.input.parse(raw);
    return runCommand(createOperation, input, async () => {
      executed += 1;
      const customer: Customer = {
        id: t.ids.next(),
        businessId: input.businessId,
        name: input.name,
        ...stamps(),
      };
      await emit(input.businessId, 'customer.created', { customerId: customer.id });
      if (input.name === 'Taken') {
        throw new CommandError('duplicate_name', 'Customer Taken exists');
      }
      return { customer };
    });
  };

  const remove: UseCase<CustomersContract['customers.remove']> = async (raw) => {
    const input = removeOperation.input.parse(raw);
    return runCommand(removeOperation, input, async () => {
      executed += 1;
      await emit(input.businessId, 'customer.removed', { customerId: input.customerId });
      return {};
    });
  };

  return { create, remove, executed: () => executed };
}

describe('event', () => {
  it('builds an event with a fresh id, the actor and the time, and stores nothing', () => {
    const t = createTestContext();
    const { event } = createCommandKit(t.ctx);
    const customerId = t.cmd();
    const first = event(t.businessId, 'customer.created', { customerId });
    expect(first).toEqual({
      id: first.id,
      type: 'customer.created',
      version: 1,
      businessId: t.businessId,
      actor: t.actor,
      at: '2026-11-14T10:00:00.000Z',
      payload: { customerId },
    });
    t.clock.setToday('2026-12-01');
    const second = event(t.businessId, 'customer.renamed', {});
    expect(second.id).not.toBe(first.id);
    expect(second.at).toBe('2026-12-01T10:00:00.000Z');
    expect(t.storage.allEvents()).toEqual([]);
    expectTypeOf(first).toEqualTypeOf<DomainEvent>();
  });

  it('refuses a type that is not thing.what_happened', async () => {
    const t = createTestContext();
    const { event, emit } = createCommandKit(t.ctx);
    expect(() => event(t.businessId, 'customers.create.done', {})).toThrow(
      'Expected thing.what_happened',
    );
    expect(() => event(t.businessId, 'CustomerCreated', {})).toThrow(z.ZodError);
    // Nothing is appended when the event is refused.
    await expect(emit(t.businessId, 'created')).rejects.toThrow(z.ZodError);
    expect(t.storage.allEvents()).toEqual([]);
  });
});

describe('emit', () => {
  it('appends one event to the log of its business', async () => {
    const t = createTestContext();
    const { emit } = createCommandKit(t.ctx);
    const customerId = t.cmd();
    await emit(t.businessId, 'customer.created', { customerId });
    await emit(t.otherBusinessId, 'customer.created');
    const events = await t.storage.events.ofBusiness(t.businessId);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'customer.created',
      businessId: t.businessId,
      actor: t.actor,
      at: t.clock.now(),
      payload: { customerId },
    });
    // Without a payload the event carries an empty one.
    const others = await t.storage.events.ofBusiness(t.otherBusinessId);
    expect(others.map((event) => event.payload)).toEqual([{}]);
    expect(t.storage.allEvents()).toHaveLength(2);
  });
});

describe('stamps', () => {
  it('gives a new row the same instant twice', () => {
    const t = createTestContext();
    const { stamps } = createCommandKit(t.ctx);
    expect(stamps()).toEqual({
      createdAt: '2026-11-14T10:00:00.000Z',
      updatedAt: '2026-11-14T10:00:00.000Z',
    });
    expectTypeOf(stamps()).toEqualTypeOf<{ createdAt: IsoDateTime; updatedAt: IsoDateTime }>();
  });

  it('reads the clock once: on a clock that runs, both are still the same instant', () => {
    const t = createTestContext();
    let asked = 0;
    const now = () => {
      asked += 1;
      return IsoDateTimeSchema.parse(`2026-11-14T10:00:00.00${asked}Z`);
    };
    const { stamps } = createCommandKit({ ...t.ctx, clock: { now, today: t.clock.today } });
    const { createdAt, updatedAt } = stamps();
    expect(createdAt).toBe('2026-11-14T10:00:00.001Z');
    expect(updatedAt).toBe(createdAt);
    expect(asked).toBe(1);
  });
});

describe('runCommand', () => {
  it('runs a command in one transaction: result, event and entry in the command log', async () => {
    const t = createTestContext();
    const customers = createCustomers(t);
    const commandId = t.cmd();
    const { customer } = await customers.create({
      commandId,
      businessId: t.businessId,
      name: '  Betrieb Muster ',
    });
    expect(customer).toMatchObject({ businessId: t.businessId, name: 'Betrieb Muster' });
    expect(customers.executed()).toBe(1);
    expect(t.storage.transactions()).toBe(1);
    expect(t.storage.allEvents()).toMatchObject([
      { type: 'customer.created', actor: t.actor, payload: { customerId: customer.id } },
    ]);
    expect(t.storage.allCommands()).toEqual([
      {
        commandId,
        businessId: t.businessId,
        operation: 'customers.create',
        result: { customer },
        at: '2026-11-14T10:00:00.000Z',
      },
    ]);
  });

  it('returns the stored result when a command is repeated, and does not run it again', async () => {
    const t = createTestContext();
    const customers = createCustomers(t);
    const commandId = t.cmd();
    const first = await customers.create({ commandId, businessId: t.businessId, name: 'Eins' });
    t.clock.setToday('2026-11-20');
    // The same command again, even with other content: the first answer stands.
    const again = await customers.create({ commandId, businessId: t.businessId, name: 'Zwei' });
    expect(again).toEqual(first);
    expect(again.customer.name).toBe('Eins');
    expect(customers.executed()).toBe(1);
    expect(t.storage.allEvents()).toHaveLength(1);
    expect(t.storage.allCommands()).toHaveLength(1);
    expect(t.storage.allCommands()[0]?.at).toBe('2026-11-14T10:00:00.000Z');
    // A new commandId is a new command.
    await customers.create({ commandId: t.cmd(), businessId: t.businessId, name: 'Zwei' });
    expect(customers.executed()).toBe(2);
    expect(t.storage.allCommands()).toHaveLength(2);
  });

  it('reads a stored result through the output schema of the operation', async () => {
    const t = createTestContext();
    const customers = createCustomers(t);
    const { runCommand } = createCommandKit(t.ctx);
    const { customer } = await customers.create({
      commandId: t.cmd(),
      businessId: t.businessId,
      name: 'Eins',
    });
    // An entry written by an older version: one field more than the contract knows today.
    const older = t.cmd();
    await t.storage.commands.record({
      commandId: older,
      businessId: t.businessId,
      operation: 'customers.create',
      result: { customer, legacy: true },
      at: t.clock.now(),
    });
    const neverRuns = () => Promise.reject(new Error('must not run'));
    expect(
      await runCommand(createOperation, { commandId: older, businessId: t.businessId }, neverRuns),
    ).toEqual({ customer });
    // An entry that no longer fits the contract fails loudly instead of handing out half a result.
    const unfit = t.cmd();
    await t.storage.commands.record({
      commandId: unfit,
      businessId: t.businessId,
      operation: 'customers.create',
      result: { customer: { id: customer.id } },
      at: t.clock.now(),
    });
    await expect(
      runCommand(createOperation, { commandId: unfit, businessId: t.businessId }, neverRuns),
    ).rejects.toThrow(z.ZodError);
  });

  it('refuses a commandId that was used for another operation', async () => {
    const t = createTestContext();
    const customers = createCustomers(t);
    const commandId = t.cmd();
    const { customer } = await customers.create({ commandId, businessId: t.businessId, name: 'A' });
    const attempt = customers.remove({
      commandId,
      businessId: t.businessId,
      customerId: customer.id,
    });
    await expect(attempt).rejects.toBeInstanceOf(CommandError);
    await expect(attempt).rejects.toMatchObject({
      code: 'invalid',
      message: `Command ${commandId} was already used for another operation or business`,
    });
    // Nothing ran and nothing was written: the customer was not removed without a sound, and
    // the caller did not get the result of the creation as the result of the removal.
    expect(customers.executed()).toBe(1);
    expect(t.storage.allEvents().map((event) => event.type)).toEqual(['customer.created']);
    expect(t.storage.allCommands()).toHaveLength(1);
  });

  it('refuses a commandId that was used in another business', async () => {
    const t = createTestContext();
    const customers = createCustomers(t);
    const commandId = t.cmd();
    await customers.create({ commandId, businessId: t.businessId, name: 'Person Eins' });
    const attempt = customers.create({ commandId, businessId: t.otherBusinessId, name: 'B' });
    const error: unknown = await attempt.catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(CommandError);
    expect(error).toMatchObject({ code: 'invalid' });
    // The answer names nothing of the other business.
    expect(String(error)).not.toContain('Person Eins');
    expect(customers.executed()).toBe(1);
    expect(await t.storage.events.ofBusiness(t.otherBusinessId)).toEqual([]);
    expect(t.storage.allCommands().map((entry) => entry.businessId)).toEqual([t.businessId]);
  });

  it('records every command with its business', async () => {
    const t = createTestContext();
    const customers = createCustomers(t);
    await customers.create({ commandId: t.cmd(), businessId: t.businessId, name: 'A' });
    await customers.create({ commandId: t.cmd(), businessId: t.otherBusinessId, name: 'B' });
    await customers.create({ commandId: t.cmd(), businessId: t.businessId, name: 'C' });
    expect(t.storage.allCommands().map((entry) => entry.businessId)).toEqual([
      t.businessId,
      t.otherBusinessId,
      t.businessId,
    ]);
    expect(await t.storage.events.ofBusiness(t.businessId)).toHaveLength(2);
    expect(await t.storage.events.ofBusiness(t.otherBusinessId)).toHaveLength(1);
  });

  it('undoes everything when the command fails: no event, no entry', async () => {
    const t = createTestContext();
    const customers = createCustomers(t);
    await customers.create({ commandId: t.cmd(), businessId: t.businessId, name: 'Kept' });
    const commandId = t.cmd();
    const attempt = customers.create({ commandId, businessId: t.businessId, name: 'Taken' });
    // The error of the use case arrives as it was thrown.
    await expect(attempt).rejects.toBeInstanceOf(CommandError);
    await expect(attempt).rejects.toMatchObject({
      code: 'duplicate_name',
      message: 'Customer Taken exists',
    });
    expect(customers.executed()).toBe(2);
    // The event the failed command had already emitted is gone, what was there before stays.
    expect(t.storage.allEvents()).toHaveLength(1);
    expect(t.storage.allCommands()).toHaveLength(1);
    expect(await t.storage.commands.find(commandId)).toBeUndefined();
    // The same commandId is free again: the command can be sent once more, corrected.
    const { customer } = await customers.create({
      commandId,
      businessId: t.businessId,
      name: 'Free',
    });
    expect(customer.name).toBe('Free');
    expect(t.storage.allEvents()).toHaveLength(2);
    expect(t.storage.allCommands()).toHaveLength(2);
  });

  it('hands on the error of the use case as it was thrown, whatever it is', async () => {
    const t = createTestContext();
    const { emit, runCommand } = createCommandKit(t.ctx);
    const failure = new RangeError('the use case fails with an error of its own');
    const attempt = runCommand(
      removeOperation,
      { commandId: t.cmd(), businessId: t.businessId },
      async () => {
        await emit(t.businessId, 'customer.removed', {});
        throw failure;
      },
    );
    // Not wrapped and not turned into a CommandError: the caller sees what happened.
    expect(await attempt.catch((caught: unknown) => caught)).toBe(failure);
    expect(t.storage.allEvents()).toEqual([]);
    expect(t.storage.allCommands()).toEqual([]);
  });

  it('undoes the command when its entry cannot be recorded', async () => {
    const t = createTestContext();
    // A storage whose command log is full: reading works, writing fails.
    const storage: CommandStorage = {
      ...t.storage,
      commands: {
        find: t.storage.commands.find,
        record: () => Promise.reject(new Error('the command log cannot be written')),
      },
    };
    const { emit, runCommand } = createCommandKit({ ...t.ctx, storage });
    let executed = 0;
    const attempt = runCommand(
      removeOperation,
      { commandId: t.cmd(), businessId: t.businessId },
      async () => {
        executed += 1;
        await emit(t.businessId, 'customer.removed', {});
        return {};
      },
    );
    await expect(attempt).rejects.toThrow('the command log cannot be written');
    // It ran, and nothing of it is left: a command that is not recorded did not happen.
    expect(executed).toBe(1);
    expect(t.storage.allEvents()).toEqual([]);
    expect(t.storage.allCommands()).toEqual([]);
  });

  it('runs nothing when the command log cannot be read', async () => {
    const t = createTestContext();
    const storage: CommandStorage = {
      ...t.storage,
      commands: {
        find: () => Promise.reject(new Error('the command log cannot be read')),
        record: t.storage.commands.record,
      },
    };
    const { runCommand } = createCommandKit({ ...t.ctx, storage });
    let executed = false;
    const attempt = runCommand(
      removeOperation,
      { commandId: t.cmd(), businessId: t.businessId },
      () => {
        executed = true;
        return Promise.resolve({});
      },
    );
    // Without knowing whether the command ran before, running it could run it twice.
    await expect(attempt).rejects.toThrow('the command log cannot be read');
    expect(executed).toBe(false);
    expect(t.storage.allCommands()).toEqual([]);
  });

  it('undoes a command whose result breaks the contract', async () => {
    const t = createTestContext();
    const { emit, runCommand, stamps } = createCommandKit(t.ctx);
    const commandId = t.cmd();
    const attempt = runCommand(
      createOperation,
      { commandId, businessId: t.businessId },
      async () => {
        await emit(t.businessId, 'customer.created', {});
        // A name the schema of a customer refuses.
        return { customer: { id: t.ids.next(), businessId: t.businessId, name: '', ...stamps() } };
      },
    );
    await expect(attempt).rejects.toThrow(z.ZodError);
    expect(t.storage.allEvents()).toEqual([]);
    expect(t.storage.allCommands()).toEqual([]);
  });

  it('gives the first answer and every repeated one the same form', async () => {
    const t = createTestContext();
    const { runCommand } = createCommandKit(t.ctx);
    const measure = command({
      name: 'jobs.measure',
      summary: 'Records a measured length.',
      access: { feature: 'jobs', level: 'operate' },
      input: z.object({ ...commandBase }),
      output: z.object({ metres: QuantitySchema }),
    });
    const base = { commandId: t.cmd(), businessId: t.businessId };
    // The use case returns float noise and a field the contract does not know.
    const noisy = { metres: 0.1 + 0.2, internal: 'not for the caller' };
    const first = await runCommand(measure, base, () => Promise.resolve(noisy));
    expect(first).toEqual({ metres: 0.3 });
    expect(t.storage.allCommands()[0]?.result).toEqual({ metres: 0.3 });
    const again = await runCommand(measure, base, () => Promise.reject(new Error('must not run')));
    expect(again).toEqual(first);
  });

  it('rejects a query, before anything runs', async () => {
    const t = createTestContext();
    const { runCommand } = createCommandKit(t.ctx);
    let executed = false;
    const attempt = runCommand(
      // @ts-expect-error -- a query changes nothing and is never recorded
      listOperation,
      { commandId: t.cmd(), businessId: t.businessId },
      () => {
        executed = true;
        return Promise.resolve({ customers: [] });
      },
    );
    await expect(attempt).rejects.toThrow(TypeError);
    await expect(attempt).rejects.toThrow(
      'runCommand takes a command, but customers.list is a query',
    );
    expect(executed).toBe(false);
    expect(t.storage.transactions()).toBe(0);
    expect(t.storage.allCommands()).toEqual([]);
  });

  it('joins a transaction that is already open', async () => {
    const t = createTestContext();
    const customers = createCustomers(t);
    await expect(
      t.storage.transaction(async () => {
        await customers.create({ commandId: t.cmd(), businessId: t.businessId, name: 'A' });
        await customers.create({ commandId: t.cmd(), businessId: t.businessId, name: 'B' });
        throw new Error('the outer work fails');
      }),
    ).rejects.toThrow('the outer work fails');
    expect(customers.executed()).toBe(2);
    expect(t.storage.transactions()).toBe(1);
    expect(t.storage.allEvents()).toEqual([]);
    expect(t.storage.allCommands()).toEqual([]);
  });

  it('fails the transaction it joined when it fails, even if its error was caught', async () => {
    const t = createTestContext();
    const customers = createCustomers(t);
    const base = { businessId: t.businessId };
    let wentOn = false;
    const attempt = t.storage.transaction(async () => {
      await customers.create({ ...base, commandId: t.cmd(), name: 'Before' });
      // A step that fails, and a caller that means to go on without it.
      await customers.create({ ...base, commandId: t.cmd(), name: 'Taken' }).catch(() => undefined);
      await customers.create({ ...base, commandId: t.cmd(), name: 'After' });
      wentOn = true;
      return 'done';
    });
    // The failed command was «all or none» inside this transaction: the whole of it is undone,
    // with the error of the command, although the work itself came to its end.
    await expect(attempt).rejects.toBeInstanceOf(CommandError);
    await expect(attempt).rejects.toMatchObject({ code: 'duplicate_name' });
    expect(wentOn).toBe(true);
    expect(customers.executed()).toBe(3);
    expect(t.storage.allEvents()).toEqual([]);
    expect(t.storage.allCommands()).toEqual([]);
  });

  it('fails the transaction it joined when its commandId is refused there', async () => {
    const t = createTestContext();
    const customers = createCustomers(t);
    const commandId = t.cmd();
    const { customer } = await customers.create({ commandId, businessId: t.businessId, name: 'A' });
    const attempt = t.storage.transaction(async () => {
      await customers.create({ commandId: t.cmd(), businessId: t.businessId, name: 'B' });
      await customers
        .remove({ commandId, businessId: t.businessId, customerId: customer.id })
        .catch(() => undefined);
    });
    await expect(attempt).rejects.toMatchObject({ code: 'invalid' });
    // What was there before the transaction stays, nothing of it is added.
    expect(t.storage.allCommands().map((entry) => entry.commandId)).toEqual([commandId]);
    expect(t.storage.allEvents().map((event) => event.type)).toEqual(['customer.created']);
  });

  it('types the result by the output schema of the operation', async () => {
    const t = createTestContext();
    const { runCommand } = createCommandKit(t.ctx);
    const base = { commandId: t.cmd(), businessId: t.businessId };
    const result = runCommand(removeOperation, base, () => Promise.resolve({}));
    expectTypeOf(result).toEqualTypeOf<
      Promise<OperationOutput<CustomersContract['customers.remove']>>
    >();
    expect(await result).toEqual({});

    const wrong = runCommand(
      createOperation,
      { commandId: t.cmd(), businessId: t.businessId },
      // @ts-expect-error -- the use case must return what the operation promises
      () => Promise.resolve({ customers: [] }),
    );
    await expect(wrong).rejects.toThrow(z.ZodError);
    const withoutId = () =>
      // @ts-expect-error -- a command needs its commandId
      runCommand(removeOperation, { businessId: t.businessId }, () => Promise.resolve({}));
    const withText = () =>
      // @ts-expect-error -- the ids are UUIDv7 that went through a schema, not any text
      runCommand(removeOperation, { commandId: 'abc', businessId: 'def' }, () =>
        Promise.resolve({}),
      );
    // Declared only: the compiler is the one who refuses them.
    expect([withoutId, withText]).toHaveLength(2);
  });

  it('runs each commandId once, whatever order commands and repeats arrive in', async () => {
    const name = fc.oneof(fc.string(), fc.constantFrom('Taken', '', ' ', 'Betrieb Muster'));
    const call = fc.record({ id: fc.integer({ min: 0, max: 5 }), name });
    await fc.assert(
      fc.asyncProperty(fc.array(call, { maxLength: 30 }), async (calls) => {
        const t = createTestContext();
        const customers = createCustomers(t);
        const commandIds = Array.from({ length: 6 }, () => t.cmd());
        const firstAnswers = new Map<Id, unknown>();
        let executions = 0;
        for (const { id, name: typed } of calls) {
          const commandId = commandIds[id];
          if (commandId === undefined) {
            throw new Error('unreachable: the index is within the list');
          }
          const attempt = customers.create({ commandId, businessId: t.businessId, name: typed });
          if (typed.trim() === '') {
            // Refused by the input schema, before the kit is reached.
            await expect(attempt).rejects.toThrow(z.ZodError);
          } else if (firstAnswers.has(commandId)) {
            // A repeat: the stored answer, whatever the name is now.
            expect(await attempt).toEqual(firstAnswers.get(commandId));
          } else if (typed.trim() === 'Taken') {
            // Refused by the use case: it ran, and all of it was undone.
            executions += 1;
            await expect(attempt).rejects.toMatchObject({ code: 'duplicate_name' });
          } else {
            executions += 1;
            firstAnswers.set(commandId, await attempt);
          }
        }
        expect(customers.executed()).toBe(executions);
        const entries = t.storage.allCommands();
        expect(entries).toHaveLength(firstAnswers.size);
        for (const entry of entries) {
          expect(entry.result).toEqual(firstAnswers.get(entry.commandId));
        }
        expect(t.storage.allEvents()).toHaveLength(firstAnswers.size);
      }),
    );
  });
});

describe('commands sent at the same moment', () => {
  /** A context whose storage lets one transaction in at a time, as the adapter of a database does. */
  function createWaitingContext(): TestContext {
    const t = createTestContext();
    const storage = takingTurns(t.storage);
    return { ...t, storage, ctx: { ...t.ctx, storage } };
  }

  it('run once if they carry the same commandId: the second waits and gets the stored answer', async () => {
    const t = createWaitingContext();
    const customers = createCustomers(t);
    const commandId = t.cmd();
    // A double tap: the same command twice, neither awaited before the other starts.
    const [first, second] = await Promise.all([
      customers.create({ commandId, businessId: t.businessId, name: 'Eins' }),
      customers.create({ commandId, businessId: t.businessId, name: 'Eins' }),
    ]);
    expect(second).toEqual(first);
    expect(customers.executed()).toBe(1);
    expect(t.storage.allEvents()).toHaveLength(1);
    expect(t.storage.allCommands()).toHaveLength(1);
    expect(t.storage.transactions()).toBe(2);
  });

  it('run the second if the first failed and left nothing', async () => {
    const t = createWaitingContext();
    const customers = createCustomers(t);
    const commandId = t.cmd();
    const [first, second] = await Promise.allSettled([
      customers.create({ commandId, businessId: t.businessId, name: 'Taken' }),
      customers.create({ commandId, businessId: t.businessId, name: 'Free' }),
    ]);
    expect(first).toMatchObject({ status: 'rejected', reason: { code: 'duplicate_name' } });
    expect(second).toMatchObject({ status: 'fulfilled', value: { customer: { name: 'Free' } } });
    expect(customers.executed()).toBe(2);
    // Only the second one left a trace.
    expect(t.storage.allEvents()).toHaveLength(1);
    expect(t.storage.allCommands()).toMatchObject([
      { commandId, result: { customer: { name: 'Free' } } },
    ]);
  });

  it('refuse the second if it spends the commandId on another operation', async () => {
    const t = createWaitingContext();
    const customers = createCustomers(t);
    const commandId = t.cmd();
    const [created, removed] = await Promise.allSettled([
      customers.create({ commandId, businessId: t.businessId, name: 'A' }),
      customers.remove({ commandId, businessId: t.businessId, customerId: t.cmd() }),
    ]);
    expect(created.status).toBe('fulfilled');
    expect(removed).toMatchObject({ status: 'rejected', reason: { code: 'invalid' } });
    expect(customers.executed()).toBe(1);
    expect(t.storage.allEvents().map((event) => event.type)).toEqual(['customer.created']);
  });

  it('run one after the other, in the order they were sent, if they are different commands', async () => {
    const t = createWaitingContext();
    const customers = createCustomers(t);
    const names = ['A', 'B', 'C'];
    const answers = await Promise.all(
      names.map((name) => customers.create({ commandId: t.cmd(), businessId: t.businessId, name })),
    );
    expect(answers.map(({ customer }) => customer.name)).toEqual(names);
    expect(customers.executed()).toBe(3);
    expect(t.storage.allCommands().map((entry) => entry.result)).toEqual(answers);
    expect(t.storage.allEvents()).toHaveLength(3);
  });

  it('are not safe on a storage in memory, which cannot let the second wait', async () => {
    // The fake joins transactions that overlap, as every storage in memory does: the second
    // command reads the log before the first has written its entry.
    const t = createTestContext();
    const customers = createCustomers(t);
    const commandId = t.cmd();
    const results = await Promise.allSettled([
      customers.create({ commandId, businessId: t.businessId, name: 'Eins' }),
      customers.create({ commandId, businessId: t.businessId, name: 'Eins' }),
    ]);
    // The command ran twice. That is why tests await a command before they start the next, and
    // why the adapter of a database must let the second wait.
    expect(customers.executed()).toBe(2);
    // The log never takes a second entry for the id, so the damage does not pass for success:
    // at most one caller gets an answer.
    expect(results.filter((result) => result.status === 'fulfilled').length).toBeLessThan(2);
    expect(t.storage.allCommands().length).toBeLessThan(2);
  });
});

describe('the ports of a command', () => {
  it('are all the kit needs from a storage', () => {
    expectTypeOf<CommandStorage>().toExtend<Transactional>();
    expectTypeOf<keyof CommandStorage>().toEqualTypeOf<'transaction' | 'commands' | 'events'>();
    expectTypeOf(createCommandKit).returns.toEqualTypeOf<CommandKit>();
    expectTypeOf<keyof CommandKit>().toEqualTypeOf<'event' | 'emit' | 'runCommand' | 'stamps'>();
  });
});

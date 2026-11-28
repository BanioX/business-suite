import {
  command,
  commandBase,
  CommandError,
  createCommandKit,
  type CommandContext,
} from '@onestrand/contract';
import { IdSchema, rappen, RappenSchema } from '@onestrand/core';
import { createLedger, defineLedger, LedgerStreamSchema, ledgerFields } from '@onestrand/ledger';
import { createTableRegistry, defineTable, type BusinessBase } from '@onestrand/storage';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { openIndexedDbStorage, proposeSchemaStep } from '../src';
import { bytesOf, fixedClock, hasher, sequentialIds } from './support';

/**
 * The transaction of the adapter, with the things that end a transaction of the database: a
 * checksum (WebCrypto answers after a pause) between a read and a write, and a file with its own
 * checksum, inside one command.
 */

const AccountEntrySchema = z.object({ ...ledgerFields, amount: RappenSchema });
type AccountEntry = z.infer<typeof AccountEntrySchema>;

const accountEntries = defineTable({
  name: 'account_entries',
  schema: AccountEntrySchema,
  indexes: [['stream', 'seq']],
  sensitivity: 'internal',
  sync: 'ledger',
  appendOnly: true,
});

const accountLedger = defineLedger<AccountEntry, { balance: number }>({
  table: accountEntries,
  initial: { balance: 0 },
  reduce: (state, entry) => {
    const balance = state.balance + entry.amount;
    if (balance < 0) {
      throw new CommandError('account.overdrawn', 'The booking would take the account below zero');
    }
    return { balance };
  },
});

const REGISTER = createTableRegistry([accountEntries]);

const book = command({
  name: 'account.book',
  summary: 'Books an amount and files the receipt.',
  access: { feature: 'account', level: 'operate' },
  input: z.object({
    ...commandBase,
    stream: LedgerStreamSchema,
    amount: RappenSchema,
    receipt: z.string().optional(),
    fail: z.boolean().optional(),
  }),
  output: z.object({ entryId: IdSchema, fileId: IdSchema.optional() }),
});

async function setup() {
  const factory = new IDBFactory();
  const clock = fixedClock();
  const ids = sequentialIds();
  const open = () => {
    const step = proposeSchemaStep({ ledger: [], tables: REGISTER });
    return openIndexedDbStorage({
      name: 'sample',
      tables: REGISTER,
      ledger: step === undefined ? [] : [step],
      // The checksums come from WebCrypto: the chain of the ledger and the file wait for it.
      ports: { hasher, clock, ids },
      indexedDB: factory,
    });
  };
  const storage = await open();
  const now = clock.now();
  const businessId = ids.next();
  const row: BusinessBase = {
    id: businessId,
    name: 'Betrieb Muster',
    createdAt: now,
    updatedAt: now,
  };
  await storage.businesses.add(row);
  const actor = ids.next();
  const ctx: CommandContext = { storage, clock, ids, actor };
  const kit = createCommandKit(ctx);
  const account = createLedger(accountLedger, { storage, hasher, clock, ids, actor });
  const run = (raw: z.input<typeof book.input>) => {
    const input = book.input.parse(raw);
    return kit.runCommand(book, input, async () => {
      const { entry } = await account.append(input.businessId, input.stream, {
        amount: rappen(input.amount),
      });
      const file =
        input.receipt === undefined
          ? undefined
          : await storage.files.put({
              businessId: input.businessId,
              bytes: bytesOf(input.receipt),
              mediaType: 'text/plain',
            });
      await kit.emit(input.businessId, 'account_entry.booked', { entryId: entry.id });
      if (input.fail === true) {
        throw new CommandError('invalid', 'Something after the booking went wrong');
      }
      return { entryId: entry.id, ...(file === undefined ? {} : { fileId: file.id }) };
    });
  };
  return { factory, storage, businessId, ids, account, run, open, cmd: () => ids.next() };
}

describe('why the transaction is not one of the database', () => {
  it('ends a transaction of the database the moment a checksum is awaited in it', async () => {
    const factory = new IDBFactory();
    const storage = await openIndexedDbStorage({
      name: 'sample',
      tables: REGISTER,
      ledger: [{ tables: [{ name: 'account_entries', indexes: [['stream', 'seq']] }] }],
      ports: { hasher, clock: fixedClock(), ids: sequentialIds() },
      indexedDB: factory,
    });
    storage.close();
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open('sample');
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error ?? new Error('open failed'));
      };
    });
    const transaction = db.transaction('events', 'readwrite');
    const events = transaction.objectStore('events');
    const ended = new Promise((resolve) => {
      transaction.oncomplete = resolve;
    });
    await new Promise((resolve) => {
      const request = events.count();
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
    // What a ledger does between reading the last entry and writing the next one. When the
    // checksum resolves depends on the WebCrypto of the runtime, so the test does not race it:
    // it waits until the database has ended the transaction by itself, with the write still to
    // come (if the database waited for the ledger, this would never resolve and the test fail).
    await hasher.sha256(bytesOf('the next entry'));
    await ended;
    expect(() => events.add({ id: 'x', businessId: 'y' })).toThrow(
      expect.objectContaining({ name: 'TransactionInactiveError' }) as Error,
    );
    db.close();
  });
});

describe('a command that books, files and writes an event', () => {
  it('keeps all of it when it ends well, over closing and opening again', async () => {
    const t = await setup();
    const commandId = t.cmd();
    const result = await t.run({
      commandId,
      businessId: t.businessId,
      stream: 'cash',
      amount: 1500,
      receipt: 'Beleg 1',
    });
    expect(result.fileId).toBeDefined();
    await t.run({ commandId: t.cmd(), businessId: t.businessId, stream: 'cash', amount: -500 });
    t.storage.close();

    const again = await t.open();
    expect(await again.table('account_entries').ofBusiness(t.businessId)).toHaveLength(2);
    expect(await again.events.ofBusiness(t.businessId)).toHaveLength(2);
    expect((await again.commands.find(commandId))?.result).toEqual(result);
    const files = await again.files.ofBusiness(t.businessId);
    expect(files.map((file) => file.id)).toEqual([result.fileId]);
    expect(await again.files.verify(files[0]?.id ?? t.cmd())).toBe(true);
    // The chain of the ledger holds, with the checksums computed in the transaction.
    const reader = createLedger(accountLedger, {
      storage: again,
      hasher,
      clock: fixedClock(),
      ids: sequentialIds(5000),
      actor: t.cmd(),
    });
    expect(await reader.verify(t.businessId, 'cash')).toMatchObject({ ok: true, entries: 2 });
    expect((await reader.state(t.businessId, 'cash')).balance).toBe(1000);
  });

  it('leaves nothing behind when it fails after the booking and the file', async () => {
    const t = await setup();
    const commandId = t.cmd();
    const failure: unknown = await t
      .run({
        commandId,
        businessId: t.businessId,
        stream: 'cash',
        amount: 1500,
        receipt: 'Beleg 2',
        fail: true,
      })
      .catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(CommandError);
    expect(await t.storage.table('account_entries').ofBusiness(t.businessId)).toEqual([]);
    expect(await t.storage.files.ofBusiness(t.businessId)).toEqual([]);
    expect(await t.storage.events.ofBusiness(t.businessId)).toEqual([]);
    expect(await t.storage.commands.find(commandId)).toBeUndefined();

    // Not in the database either: close it and look.
    t.storage.close();
    const again = await t.open();
    expect(await again.table('account_entries').ofBusiness(t.businessId)).toEqual([]);
    expect(await again.files.ofBusiness(t.businessId)).toEqual([]);
  });

  it('leaves nothing behind when the booking itself is refused after the file was put', async () => {
    const t = await setup();
    await t.run({ commandId: t.cmd(), businessId: t.businessId, stream: 'cash', amount: 100 });
    const failure: unknown = await t
      .run({
        commandId: t.cmd(),
        businessId: t.businessId,
        stream: 'cash',
        amount: -900,
        receipt: 'Beleg 3',
      })
      .catch((error: unknown) => error);
    expect(failure).toMatchObject({ code: 'account.overdrawn' });
    expect(await t.storage.table('account_entries').ofBusiness(t.businessId)).toHaveLength(1);
    expect(await t.storage.files.ofBusiness(t.businessId)).toEqual([]);
    expect(await t.storage.events.ofBusiness(t.businessId)).toHaveLength(1);
  });

  it('runs once for a repeated command and gives the same answer', async () => {
    const t = await setup();
    const commandId = t.cmd();
    const input = {
      commandId,
      businessId: t.businessId,
      stream: 'cash',
      amount: 700,
      receipt: 'Beleg 4',
    };
    const first = await t.run(input);
    expect(await t.run(input)).toEqual(first);
    expect(await t.storage.table('account_entries').ofBusiness(t.businessId)).toHaveLength(1);
    expect(await t.storage.files.ofBusiness(t.businessId)).toHaveLength(1);
  });

  it('chains the entries of commands that run one after the other, each after the one before', async () => {
    const t = await setup();
    for (let index = 0; index < 8; index += 1) {
      await t.run({
        commandId: t.cmd(),
        businessId: t.businessId,
        stream: 'cash',
        amount: 100,
        ...(index % 2 === 0 ? { receipt: `Beleg ${String(index)}` } : {}),
      });
    }
    expect(await t.account.verify(t.businessId, 'cash')).toMatchObject({ ok: true, entries: 8 });
    expect((await t.account.state(t.businessId, 'cash')).balance).toBe(800);
  });

  it('sees its own writes: a read in the transaction finds what an earlier call of it wrote', async () => {
    const t = await setup();
    const seen = await t.storage.transaction(async () => {
      await t.account.append(t.businessId, 'cash', { amount: rappen(250) });
      const file = await t.storage.files.put({
        businessId: t.businessId,
        bytes: bytesOf('Beleg'),
        mediaType: 'text/plain',
      });
      return {
        entries: (await t.storage.table('account_entries').ofBusiness(t.businessId)).length,
        file: await t.storage.files.verify(file.id),
        balance: (await t.account.state(t.businessId, 'cash')).balance,
      };
    });
    expect(seen).toEqual({ entries: 1, file: true, balance: 250 });
  });
});

import {
  command,
  commandBase,
  CommandError,
  createCommandKit,
  type CommandContext,
} from '@onestrand/contract';
import { IdSchema, LocalDateSchema, rappen, RappenSchema, type Rappen } from '@onestrand/core';
import {
  createMemoryStorage,
  createTableRegistry,
  defineTable,
  type Hasher,
  type ModuleStorage,
} from '@onestrand/storage';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  createLedger,
  defineLedger,
  ledgerFields,
  ledgerInvariantProblems,
  LedgerStreamSchema,
} from '../src';
import { fixedClock, hasher, sequentialIds } from './support';

/**
 * The example of `api.md`, as a test: what the document shows to the agents of the industries
 * compiles and runs. Change both together.
 */

// The row: the fields of the kit plus the payload.
const CashEntrySchema = z.object({ ...ledgerFields, on: LocalDateSchema, amount: RappenSchema });
type CashEntry = z.infer<typeof CashEntrySchema>;

const cashEntriesTable = defineTable({
  name: 'cash_entries',
  schema: CashEntrySchema,
  indexes: [['stream', 'seq']],
  sensitivity: 'internal',
  sync: 'ledger',
  appendOnly: true,
});

// The ledger: the state is the balance, and the rule never lets it fall below zero.
const cashLedger = defineLedger<CashEntry, { balance: Rappen }>({
  table: cashEntriesTable,
  initial: { balance: rappen(0) },
  reduce: (state, entry) => {
    const balance = rappen(state.balance + entry.amount);
    if (balance < 0) {
      throw new CommandError('cash.overdrawn', `Entry ${entry.id} takes the cash below zero`);
    }
    return { balance };
  },
});

const book = command({
  name: 'cash.book',
  summary: 'Books an amount into or out of a cash book.',
  access: { feature: 'cash', level: 'operate' },
  input: z.object({
    ...commandBase,
    stream: LedgerStreamSchema,
    on: LocalDateSchema,
    amount: RappenSchema,
  }),
  output: z.object({ entryId: IdSchema, balance: RappenSchema }),
});

interface CashContext extends CommandContext {
  storage: ModuleStorage;
  hasher: Hasher;
}

// In the use case: booking belongs inside a command.
function createCashUseCases(ctx: CashContext) {
  const { emit, runCommand } = createCommandKit(ctx);
  const cash = createLedger(cashLedger, ctx);
  return {
    cash,
    'cash.book': async (raw: unknown) => {
      const input = book.input.parse(raw);
      return runCommand(book, input, async () => {
        const { businessId, stream, on, amount } = input;
        const { entry, state } = await cash.append(businessId, stream, { on, amount });
        await emit(businessId, 'cash_entry.booked', { entryId: entry.id });
        return { entryId: entry.id, balance: state.balance };
      });
    },
  };
}

describe('the example of api.md', () => {
  it('books in a command, reads the state and checks the chain', async () => {
    const clock = fixedClock();
    const ids = sequentialIds();
    const storage = createMemoryStorage(createTableRegistry([cashEntriesTable]), {
      hasher,
      clock,
      ids,
    });
    const businessId = ids.next();
    const useCases = createCashUseCases({ storage, hasher, clock, ids, actor: ids.next() });
    const input = { businessId, stream: 'main', on: clock.today() };

    const first = await useCases['cash.book']({ ...input, commandId: ids.next(), amount: 5000 });
    expect(first.balance).toBe(5000);
    await expect(
      useCases['cash.book']({ ...input, commandId: ids.next(), amount: -5001 }),
    ).rejects.toMatchObject({ code: 'cash.overdrawn' });

    const { cash } = useCases;
    const { balance } = await cash.state(businessId, 'main');
    expect(balance).toBe(5000);
    const check = await cash.verify(businessId, 'main');
    expect(check).toMatchObject({ ok: true, entries: 1, head: { seq: 1 } });

    // In the test of a ledger of one's own: the invariants every ledger keeps.
    const rows = await storage.table(cashEntriesTable).ofBusiness(businessId);
    expect(await ledgerInvariantProblems(cashLedger, hasher, rows)).toEqual([]);
  });
});

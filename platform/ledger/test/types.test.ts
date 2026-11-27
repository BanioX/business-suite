import type { Id, Rappen } from '@onestrand/core';
import { defineTable, type ModuleStorage } from '@onestrand/storage';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import {
  createLedger,
  createLedgerReader,
  defineLedger,
  ledgerFields,
  type Ledger,
  type LedgerAnchor,
  type LedgerBooking,
  type LedgerDefinition,
  type LedgerPayload,
  type LedgerProblem,
  type LedgerVerification,
} from '../src';
import {
  accountEntriesTable,
  accountLedger,
  createTestLedgers,
  fixedClock,
  hasher,
  sequentialIds,
  type AccountEntry,
  type AccountState,
} from './support';

/**
 * What the types promise to the layers on top. Checked by `tsc` with the tests; the assertions
 * at run time only keep the cases alive.
 */

const In = z.object({ ...ledgerFields, kind: z.literal('in'), minutes: z.int().min(1) });
const Out = z.object({ ...ledgerFields, kind: z.literal('out'), reason: z.string() });
const kindsTable = defineTable({
  name: 'kinds_entries',
  schema: z.discriminatedUnion('kind', [In, Out]),
  indexes: [['stream', 'seq']],
  sensitivity: 'normal',
  sync: 'ledger',
  appendOnly: true,
});
type KindsEntry = z.infer<typeof In> | z.infer<typeof Out>;

describe('the types of a ledger', () => {
  it('reads the entry from the table and the state from the initial state', () => {
    const ledger = defineLedger({
      table: accountEntriesTable,
      initial: { total: 0 },
      reduce: (state, entry) => ({ total: state.total + entry.amount }),
    });
    expectTypeOf(ledger).toEqualTypeOf<LedgerDefinition<AccountEntry, { total: number }>>();
    expect(ledger.initial).toEqual({ total: 0 });
  });

  it('reads a state that is a number or a text as wide as its kind, not as the one value', () => {
    const ledger = defineLedger({
      table: accountEntriesTable,
      initial: 0,
      reduce: (total, entry) => total + entry.amount,
    });
    expectTypeOf(ledger).toEqualTypeOf<LedgerDefinition<AccountEntry, number>>();
    expect(ledger.initial).toBe(0);
  });

  it('takes the type of the state as given where the initial state says too little', () => {
    interface Open {
      open: Id[];
    }
    const ledger = defineLedger<AccountEntry, Open>({
      table: accountEntriesTable,
      initial: { open: [] },
      reduce: (state, entry) => ({ open: [...state.open, entry.id] }),
    });
    expectTypeOf(ledger.reduce).returns.toEqualTypeOf<Open>();
    expect(ledger.initial.open).toEqual([]);
  });

  it('refuses a table whose rows are no entries', () => {
    const table = defineTable({
      name: 'plain_rows',
      schema: z.object({ id: ledgerFields.id, businessId: ledgerFields.businessId }),
      indexes: [],
      sensitivity: 'normal',
      sync: 'ledger',
      appendOnly: true,
    });
    expect(() =>
      // @ts-expect-error -- the rows of a ledger table carry the fields of the kit
      defineLedger({ table, initial: 0, reduce: (count: number) => count + 1 }),
    ).toThrow(/lacks stream, seq/);
  });

  it('refuses a rule that returns another state than it takes', () => {
    const define = () =>
      defineLedger<AccountEntry, number>({
        table: accountEntriesTable,
        initial: 0,
        // @ts-expect-error -- the state after an entry has the type of the state before it
        reduce: (total, entry) => `${total + entry.amount}`,
      });
    expect(define).not.toThrow();
  });
});

describe('the payload of an entry', () => {
  it('is the row without the fields the kit writes', () => {
    expectTypeOf<LedgerPayload<AccountEntry>>().toEqualTypeOf<{
      amount: Rappen;
      text?: string | undefined;
      ref?: { kind: string; id: Id } | undefined;
      tags?: string[] | undefined;
    }>();
  });

  it('is one of the kinds for a ledger whose rows are a union', () => {
    expectTypeOf<LedgerPayload<KindsEntry>>().toEqualTypeOf<
      { kind: 'in'; minutes: number } | { kind: 'out'; reason: string }
    >();
    const ledger = defineLedger({
      table: kindsTable,
      initial: 0,
      reduce: (minutes, entry) => (entry.kind === 'in' ? minutes + entry.minutes : minutes),
    });
    expectTypeOf(ledger).toEqualTypeOf<LedgerDefinition<KindsEntry, number>>();
    expect(ledger.table.name).toBe('kinds_entries');
  });

  it('is what append and correct ask for', async () => {
    const t = await createTestLedgers();
    expectTypeOf(t.account.append).parameters.toEqualTypeOf<
      [businessId: Id, stream: string, payload: LedgerPayload<AccountEntry>]
    >();
    expectTypeOf(t.account.correct).parameters.toEqualTypeOf<
      [businessId: Id, entryId: Id, payload: LedgerPayload<AccountEntry>]
    >();
    expectTypeOf(t.account.append).returns.resolves.toEqualTypeOf<
      LedgerBooking<AccountEntry, AccountState>
    >();
    // @ts-expect-error -- the place in the chain is written by the kit, never by the caller
    const withSeq: LedgerPayload<AccountEntry> = { amount: 5 as Rappen, seq: 1 };
    // @ts-expect-error -- a payload carries every field the row needs
    const empty: LedgerPayload<AccountEntry> = {};
    expect([withSeq, empty]).toHaveLength(2);
  });
});

describe('a ledger on a storage', () => {
  it('gives entries and states their types', async () => {
    const t = await createTestLedgers();
    expectTypeOf(t.account).toEqualTypeOf<Ledger<AccountEntry, AccountState>>();
    expectTypeOf(t.account.entries).returns.resolves.toEqualTypeOf<AccountEntry[]>();
    expectTypeOf(t.account.state).returns.resolves.toEqualTypeOf<AccountState>();
    expectTypeOf(t.account.streams).returns.resolves.toEqualTypeOf<string[]>();
    expect(await t.account.streams(t.one.businessId)).toEqual([]);
  });

  it('says ok with the end of the chain, or not ok with the problems', async () => {
    const t = await createTestLedgers();
    const result = await t.account.verify(t.one.businessId, 'cash');
    expectTypeOf(result).toEqualTypeOf<LedgerVerification>();
    if (result.ok) {
      expectTypeOf(result.head).toEqualTypeOf<LedgerAnchor | undefined>();
      // @ts-expect-error -- a chain that holds has no problems to list
      expect(result.problems).toBeUndefined();
    } else {
      expectTypeOf(result.problems).toEqualTypeOf<LedgerProblem[]>();
    }
    expect(result.ok).toBe(true);
  });

  it('needs a storage with transactions to write, and only the tables to read', async () => {
    const t = await createTestLedgers();
    const tables: Pick<ModuleStorage, 'table'> = { table: t.storage.table };
    const ports = { hasher, clock: fixedClock(), ids: sequentialIds(), actor: t.one.personId };
    expect(Object.keys(createLedgerReader(accountLedger, { storage: tables, hasher }))).toContain(
      'verify',
    );
    // @ts-expect-error -- adding an entry reads the end of the chain inside a transaction
    const write = () => createLedger(accountLedger, { storage: tables, ...ports });
    expect(write).not.toThrow();
  });
});

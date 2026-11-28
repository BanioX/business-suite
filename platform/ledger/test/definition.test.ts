import { IdSchema } from '@onestrand/core';
import { defineTable } from '@onestrand/storage';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineLedger, ledgerFields, LedgerError, type LedgerEntry } from '../src';
import {
  accountEntriesTable,
  accountLedger,
  notesTable,
  statusLedger,
  type AccountEntry,
} from './support';

const sum = (total: number, entry: AccountEntry) => total + entry.amount;

/** Calls `defineLedger` with what the types forbid, as code without types could. */
function defineUntyped(options: Record<string, unknown>) {
  return () => defineLedger(options as unknown as Parameters<typeof defineLedger>[0]);
}

const invalidDefinition: unknown = expect.objectContaining({ code: 'invalid_definition' });

describe('defineLedger', () => {
  it('returns the table, the initial state and the rule, frozen', () => {
    const ledger = defineLedger({ table: accountEntriesTable, initial: 0, reduce: sum });
    expect(ledger.table).toBe(accountEntriesTable);
    expect(ledger.initial).toBe(0);
    expect(ledger.reduce).toBe(sum);
    expect(Object.isFrozen(ledger)).toBe(true);
  });

  it('freezes an initial state of plain data at every depth', () => {
    expect(Object.isFrozen(accountLedger.initial)).toBe(true);
    expect(Object.isFrozen(statusLedger.initial.history)).toBe(true);
    expect(() => {
      statusLedger.initial.history.push('changed in place');
    }).toThrow(TypeError);
    expect(statusLedger.initial.history).toEqual([]);
  });

  it('freezes the records inside a list of the initial state too', () => {
    interface Open {
      open: { stream: string; amounts: number[] }[];
    }
    const ledger = defineLedger<AccountEntry, Open>({
      table: accountEntriesTable,
      initial: { open: [{ stream: 'cash', amounts: [1] }] },
      reduce: (state) => state,
    });
    expect(Object.isFrozen(ledger.initial.open[0])).toBe(true);
    expect(Object.isFrozen(ledger.initial.open[0]?.amounts)).toBe(true);
  });

  it('leaves an initial state alone that is not plain data', () => {
    const initial = new Map<string, number>();
    const ledger = defineLedger({
      table: accountEntriesTable,
      initial,
      reduce: (state: Map<string, number>, entry: AccountEntry) =>
        new Map(state).set(entry.stream, entry.amount),
    });
    expect(ledger.initial).toBe(initial);
    expect(Object.isFrozen(initial)).toBe(false);
  });

  it('accepts an initial state without a value', () => {
    const ledger = defineLedger({
      table: accountEntriesTable,
      initial: undefined,
      reduce: (_state: number | undefined, entry: AccountEntry) => entry.amount,
    });
    expect(ledger.initial).toBeUndefined();
  });

  it('refuses a table whose rows may be replaced', () => {
    const define = defineUntyped({ table: notesTable, initial: 0, reduce: sum });
    expect(define).toThrow(LedgerError);
    expect(define).toThrow(invalidDefinition);
    expect(define).toThrow(/"notes".*appendOnly/);
  });

  it('refuses a schema that lacks fields of the kit, and names them', () => {
    const table = defineTable({
      name: 'bare_entries',
      schema: z.object({ id: IdSchema, businessId: IdSchema, stream: z.string(), amount: z.int() }),
      indexes: [],
      sensitivity: 'normal',
      sync: 'ledger',
      appendOnly: true,
    });
    const define = defineUntyped({ table, initial: 0, reduce: sum });
    expect(define).toThrow(invalidDefinition);
    expect(define).toThrow(/lacks seq, prevHash, hash, at, actor, corrects/);
  });

  it('takes a schema that is no object schema at the word of its type', () => {
    const In = z.object({ ...ledgerFields, kind: z.literal('in'), amount: z.int().min(0) });
    const Out = z.object({ ...ledgerFields, kind: z.literal('out'), amount: z.int().min(0) });
    const table = defineTable({
      name: 'kinds_entries',
      schema: z.discriminatedUnion('kind', [In, Out]),
      indexes: [['stream', 'seq']],
      sensitivity: 'normal',
      sync: 'ledger',
      appendOnly: true,
    });
    const ledger = defineLedger({
      table,
      initial: 0,
      reduce: (total: number, entry) =>
        entry.kind === 'in' ? total + entry.amount : total - entry.amount,
    });
    expect(ledger.table.name).toBe('kinds_entries');
  });

  it.each([
    ['no table', { initial: 0, reduce: sum }],
    ['a table that is no object', { table: 'account_entries', initial: 0, reduce: sum }],
    [
      'a table without a schema',
      { table: { name: 'x', appendOnly: true }, initial: 0, reduce: sum },
    ],
    ['no rule', { table: accountEntriesTable, initial: 0 }],
    ['a rule that is no function', { table: accountEntriesTable, initial: 0, reduce: 'sum' }],
  ])('refuses %s', (_what, options) => {
    expect(defineUntyped(options)).toThrow(invalidDefinition);
  });

  it('does not ask how the table is reconciled, only that entries are never replaced', () => {
    const table = defineTable({
      name: 'device_entries',
      schema: z.object({ ...ledgerFields }),
      indexes: [],
      sensitivity: 'normal',
      sync: 'device',
      appendOnly: true,
      backup: false,
    });
    const ledger = defineLedger({
      table,
      initial: 0,
      reduce: (count: number, _entry: LedgerEntry) => count + 1,
    });
    expect(ledger.table.sync).toBe('device');
  });
});

import type { TableDefinition } from '@onestrand/storage';
import { z } from 'zod';
import { LEDGER_FIELD_NAMES, type LedgerEntry } from './entry';
import { LedgerError } from './errors';
import { deepFreeze, fieldOf } from './internal';

/**
 * A ledger: an append-only table and the rule that turns its entries into a state. One kit for
 * everything that is booked instead of overwritten: time, a cash book, the status of an order,
 * keys handed out, cards with a number of visits.
 */

/** What `defineLedger` takes. */
export interface LedgerOptions<TEntry extends LedgerEntry, TState> {
  /**
   * The table of the entries: `defineTable({ …, appendOnly: true })` with a schema of
   * `ledgerFields` plus the payload. A chain is written by one device at a time, the one that
   * runs the commands; two devices that both add to one stream end up with two entries of the
   * same `seq`, which `verify` reports.
   */
  table: TableDefinition<string, TEntry>;
  /** The state of a stream without entries. Plain data is frozen; never change it in place. */
  initial: TState;
  /**
   * One step of the fold: the state after `entry`, given the state before it. A pure function:
   * it returns a new state and changes neither argument. It may refuse an entry by throwing (a
   * `CommandError` with a code of its module), and then the entry is not written.
   *
   * Corrections are resolved before it is called (`effectiveEntries`): it sees every entry that
   * counts once, in the place of the entry it stands for, and never the corrected ones.
   */
  reduce: (state: TState, entry: TEntry) => TState;
}

/** A ledger as the kit uses it: checked and frozen. */
export interface LedgerDefinition<TEntry extends LedgerEntry = LedgerEntry, TState = unknown> {
  readonly table: TableDefinition<string, TEntry>;
  readonly initial: TState;
  readonly reduce: (state: TState, entry: TEntry) => TState;
}

function invalid(table: unknown, problem: string): LedgerError {
  return new LedgerError(
    'invalid_definition',
    `Ledger on table ${JSON.stringify(table)}: ${problem}`,
  );
}

/**
 * Declares a ledger. Throws a `LedgerError` with the code `invalid_definition` if the table is
 * not append-only (an entry could be replaced), if its schema is an object schema that lacks a
 * field of `ledgerFields`, or if `reduce` is no function.
 */
export function defineLedger<TEntry extends LedgerEntry, TState>(
  options: LedgerOptions<TEntry, TState>,
): LedgerDefinition<TEntry, TState> {
  // Checked as unknown values: a definition put together without types gets the same answers.
  const table: unknown = options.table;
  if (typeof table !== 'object' || table === null) {
    throw invalid(undefined, 'it needs a table made with defineTable');
  }
  const name = fieldOf(table, 'name');
  const schema = fieldOf(table, 'schema');
  if (!(schema instanceof z.ZodType)) {
    throw invalid(name, 'it needs a table made with defineTable');
  }
  if (fieldOf(table, 'appendOnly') !== true) {
    throw invalid(name, 'the table must be appendOnly, an entry is never replaced');
  }
  if (schema instanceof z.ZodObject) {
    const missing = LEDGER_FIELD_NAMES.filter((field) => !Object.hasOwn(schema.shape, field));
    if (missing.length > 0) {
      throw invalid(name, `the schema lacks ${missing.join(', ')}; spread ledgerFields into it`);
    }
  }
  if (typeof options.reduce !== 'function') {
    throw invalid(name, 'reduce must be a function');
  }
  return Object.freeze({
    table: options.table,
    initial: deepFreeze(options.initial),
    reduce: options.reduce,
  });
}

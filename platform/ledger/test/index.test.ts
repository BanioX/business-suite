import { describe, expect, it } from 'vitest';
import * as ledger from '../src';

/**
 * The public surface, name by name. Every later ledger (time, cash book, status) builds on it:
 * a name that disappears or appears here is a decision, not an accident. Types are not listed;
 * `tsc` guards them where they are used.
 */
describe('@onestrand/ledger', () => {
  it('exports exactly these values', () => {
    expect(Object.keys(ledger).sort()).toEqual(
      [
        // errors
        'LedgerError',
        // the one spelling of a value
        'canonicalJson',
        // entries
        'LEDGER_FIELD_NAMES',
        'LEDGER_STREAM_PATTERN',
        'LedgerEntrySchema',
        'LedgerStreamSchema',
        'ledgerFields',
        'hashedContent',
        'entryHash',
        'inSequence',
        // a ledger and its state
        'defineLedger',
        'effectiveEntries',
        'foldLedger',
        // checking a chain
        'LEDGER_PROBLEM_KINDS',
        'chainProblems',
        'allChainProblems',
        // the kit on a storage
        'createLedger',
        'createLedgerReader',
        // what a module checks in its own property test
        'LEDGER_INVARIANTS',
        'ledgerInvariantProblems',
      ].sort(),
    );
  });

  it('keeps its small helpers inside', () => {
    for (const name of ['compareText', 'fieldOf', 'deepFreeze', 'isList', 'contentHash']) {
      expect(Object.keys(ledger), name).not.toContain(name);
    }
  });

  it('holds no table and no ledger of its own: every module brings its ledgers', () => {
    const ledgers = Object.values(ledger).filter(
      (value) => typeof value === 'object' && ('table' in value || 'initial' in value),
    );
    expect(ledgers).toEqual([]);
  });
});

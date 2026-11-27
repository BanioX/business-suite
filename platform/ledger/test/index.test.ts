import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as ledger from '../src';

/**
 * The public surface, name by name. The ledgers of the modules and of every industry build on
 * it: a name that disappears or appears here is a decision, not an accident. Types are not
 * listed; `tsc` guards them where they are used.
 */
describe('@onestrand/ledger', () => {
  it('exports exactly these values', () => {
    expect(Object.keys(ledger).sort()).toEqual(
      [
        // errors
        'LedgerError',
        // canonical JSON
        'canonicalJson',
        // an entry and its checksum
        'LEDGER_FIELD_NAMES',
        'LEDGER_STREAM_PATTERN',
        'LedgerEntrySchema',
        'LedgerStreamSchema',
        'ledgerFields',
        'hashedContent',
        'entryHash',
        'inSequence',
        // a ledger: table, initial state, rule
        'defineLedger',
        // from entries to a state
        'effectiveEntries',
        'foldLedger',
        // checking a chain
        'LEDGER_PROBLEM_KINDS',
        'chainProblems',
        'allChainProblems',
        // the kit on a storage
        'createLedger',
        'createLedgerReader',
        // checks for the tests of other ledgers
        'LEDGER_INVARIANTS',
        'ledgerInvariantProblems',
      ].sort(),
    );
  });

  it('builds on the layers below it and on nothing else', () => {
    const src = new URL('../src/', import.meta.url);
    const imported = new Set<string>();
    for (const file of readdirSync(src)) {
      const code = readFileSync(new URL(file, src), 'utf8');
      for (const match of code.matchAll(/\bfrom\s+'([^']+)'/g)) {
        imported.add(match[1] ?? '');
      }
    }
    const packages = [...imported].filter((name) => !name.startsWith('./')).sort();
    // The checks for other ledgers live in src and are used in tests: they bring no test library.
    expect(packages).toEqual([
      '@onestrand/contract',
      '@onestrand/core',
      '@onestrand/storage',
      'zod',
    ]);
  });

  it('names no table and no stream of its own: every ledger brings both', () => {
    const texts = Object.values(ledger).filter((value) => typeof value === 'string');
    expect(texts).toEqual([]);
  });
});

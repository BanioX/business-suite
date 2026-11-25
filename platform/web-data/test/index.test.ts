import { describe, expect, it } from 'vitest';
import * as webData from '../src';

/**
 * The public surface, name by name. The editions and the app shell build on it: a name that
 * disappears or appears here is a decision, not an accident. Types are not listed; `tsc` guards
 * them where they are used.
 */
describe('@onestrand/web-data', () => {
  it('exports exactly these values', () => {
    expect(Object.keys(webData).sort()).toEqual(
      [
        // errors
        'WebDataError',
        // the schema ledger
        'SCHEMA_PROBLEM_CODES',
        'indexName',
        'indexKeyPath',
        'schemaOf',
        'schemaLedgerProblems',
        'proposeSchemaStep',
        // the storage ports on IndexedDB
        'openIndexedDbStorage',
        // the storage of the device
        'deviceKey',
        'DEVICE_NAMES',
        'createMemoryDeviceStore',
        'createBrowserDeviceStore',
        // what the browser gives the app
        'requestPersistentStorage',
        'createBrowserClock',
        'createBrowserIds',
        // start
        'openEditionData',
      ].sort(),
    );
  });

  it('holds no fixed list of tables and no name of an edition: both come from the edition', () => {
    const texts = Object.values(webData).filter((value) => typeof value === 'string');
    expect(texts).toEqual([]);
    const registers = Object.values(webData).filter(
      (value) => typeof value === 'object' && 'tables' in value && 'names' in value,
    );
    expect(registers).toEqual([]);
  });

  it('lists every code a problem of a schema ledger can have', () => {
    expect([...webData.SCHEMA_PROBLEM_CODES].sort()).toEqual(
      [
        'empty',
        'invalid_step',
        'step_changed',
        'step_removed',
        'table_twice',
        'table_missing',
        'unknown_table',
        'index_twice',
        'index_missing',
        'index_misplaced',
        'unknown_index',
        'migration_twice',
        'unknown_migration',
        'migration_misplaced',
      ].sort(),
    );
  });
});

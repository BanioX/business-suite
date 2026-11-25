import { describe, expect, it } from 'vitest';
import * as storage from '../src';

/**
 * The public surface, name by name. The ledger, the test helpers and every module build on it:
 * a name that disappears or appears here is a decision, not an accident. Types are not listed;
 * `tsc` guards them where they are used.
 */
describe('@onestrand/storage', () => {
  it('exports exactly these values', () => {
    expect(Object.keys(storage).sort()).toEqual([]);
  });

  it('holds no fixed list of tables: every edition brings its register', () => {
    const registers = Object.values(storage).filter(
      (value) => typeof value === 'object' && 'tables' in value && 'names' in value,
    );
    expect(registers).toEqual([]);
  });
});

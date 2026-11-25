import { ACCESS_LEVELS } from '@onestrand/contract';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { higherLevel, levelRank, levelReaches } from '../src';
import { levelArb } from './support';

const anyLevel = fc.option(levelArb, { nil: undefined });

describe('the order of the levels', () => {
  it('runs from nothing over view and operate to manage', () => {
    expect([undefined, ...ACCESS_LEVELS].map(levelRank)).toEqual([0, 1, 2, 3]);
  });

  it('lets a level reach itself and every lower one, nothing higher', () => {
    expect(levelReaches('manage', 'operate')).toBe(true);
    expect(levelReaches('operate', 'operate')).toBe(true);
    expect(levelReaches('view', 'operate')).toBe(false);
    expect(levelReaches(undefined, 'view')).toBe(false);
    expect(levelReaches(undefined, undefined)).toBe(true);
    expect(levelReaches('view', undefined)).toBe(true);
  });

  it('reaches by rank for any two levels', () => {
    fc.assert(
      fc.property(anyLevel, anyLevel, (have, need) => {
        expect(levelReaches(have, need)).toBe(levelRank(have) >= levelRank(need));
      }),
    );
  });

  it('names the higher of two levels, and the same level twice gives that level', () => {
    expect(higherLevel('view', 'manage')).toBe('manage');
    expect(higherLevel('manage', 'view')).toBe('manage');
    expect(higherLevel(undefined, 'view')).toBe('view');
    expect(higherLevel(undefined, undefined)).toBeUndefined();
    fc.assert(
      fc.property(anyLevel, anyLevel, (a, b) => {
        const higher = higherLevel(a, b);
        expect(levelReaches(higher, a) && levelReaches(higher, b)).toBe(true);
        expect(levelRank(higher)).toBe(Math.max(levelRank(a), levelRank(b)));
      }),
    );
  });
});

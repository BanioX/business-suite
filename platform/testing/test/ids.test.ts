// Origin: BanioX/Randen packages/core/src/testing/index.ts @ e0f0907 — adapted: the origin has no test of its own for the counting ids; the first test pins the ids its generator gives
import { IdSchema, isUuidV7, uuidV7Timestamp } from '@onestrand/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { sequentialIds } from '../src';

describe('sequentialIds', () => {
  it('counts up from 1 and gives the same ids every time', () => {
    const ids = sequentialIds();
    expect([ids.next(), ids.next(), ids.next()]).toEqual([
      '01a3185c-5000-7000-8000-000000000001',
      '01a3185c-5000-7000-8000-000000000002',
      '01a3185c-5000-7000-8000-000000000003',
    ]);
    expect(sequentialIds().next()).toBe('01a3185c-5000-7000-8000-000000000001');
  });

  it('gives ids of the suite: UUIDv7, lower case, all with the same time', () => {
    const ids = sequentialIds(250);
    const id = ids.next();
    expect(IdSchema.safeParse(id).success).toBe(true);
    expect(isUuidV7(id)).toBe(true);
    expect(uuidV7Timestamp(id)).toBe(1_800_000_000_000);
    expect(uuidV7Timestamp(ids.next())).toBe(1_800_000_000_000);
  });

  it('starts where it is told to', () => {
    expect(sequentialIds(0).next()).toBe('01a3185c-5000-7000-8000-000000000000');
    expect(sequentialIds(256).next()).toBe('01a3185c-5000-7000-8000-000000000100');
    expect(sequentialIds(1_000_001).next()).toBe('01a3185c-5000-7000-8000-0000000f4241');
  });

  it('never repeats an id, and the ids sort in the order they were made', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER - 200 }),
        fc.integer({ min: 2, max: 200 }),
        (start, count) => {
          const ids = sequentialIds(start);
          const made = Array.from({ length: count }, () => ids.next());
          expect(new Set(made).size).toBe(count);
          expect([...made].sort()).toEqual(made);
          expect(made.every(isUuidV7)).toBe(true);
        },
      ),
    );
  });

  it('keeps two ranges apart: generators that start far from each other never meet', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000_000 }), (start) => {
        const one = sequentialIds(start);
        const two = sequentialIds(start + 1_000_000);
        const made = Array.from({ length: 50 }, () => [one.next(), two.next()]).flat();
        expect(new Set(made).size).toBe(100);
      }),
    );
  });

  it('counts each generator on its own', () => {
    const one = sequentialIds();
    const two = sequentialIds();
    one.next();
    one.next();
    expect(two.next()).toBe('01a3185c-5000-7000-8000-000000000001');
  });

  it('refuses a start that is no whole number from 0 on', () => {
    for (const start of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53]) {
      expect(() => sequentialIds(start), String(start)).toThrow(RangeError);
    }
  });

  it('fails when it has run out, instead of handing out an id twice', () => {
    const ids = sequentialIds(Number.MAX_SAFE_INTEGER);
    expect(ids.next()).toBe('01a3185c-5000-7000-801f-ffffffffffff');
    expect(() => ids.next()).toThrow(RangeError);
    expect(() => ids.next()).toThrow('run out');
  });
});

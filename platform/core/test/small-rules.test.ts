// Origin: BanioX/Randen packages/core/test/small-rules.test.ts @ e0f0907 — adapted: months and years only; expiry and unit labels left out
import { describe, expect, it } from 'vitest';
import { addMonths, addYears, localDate } from '../src/dates';

/**
 * Small rules of the calendar no other test reached: the numbers of the real logic count.
 */
describe('addMonths', () => {
  it('keeps the day when the target month has it', () => {
    expect(addMonths(localDate('2026-11-14'), 1)).toBe('2026-12-14');
    expect(addMonths(localDate('2026-11-14'), 0)).toBe('2026-11-14');
  });

  it('crosses the turn of the year in both directions', () => {
    expect(addMonths(localDate('2026-11-14'), 2)).toBe('2027-01-14');
    expect(addMonths(localDate('2026-01-14'), -1)).toBe('2025-12-14');
    expect(addMonths(localDate('2026-11-14'), 14)).toBe('2028-01-14');
    expect(addMonths(localDate('2026-03-14'), -15)).toBe('2024-12-14');
  });

  it('clamps the day to the end of a shorter month', () => {
    expect(addMonths(localDate('2026-01-31'), 1)).toBe('2026-02-28');
    expect(addMonths(localDate('2028-01-31'), 1)).toBe('2028-02-29');
    expect(addMonths(localDate('2026-08-31'), 1)).toBe('2026-09-30');
    expect(addMonths(localDate('2026-03-31'), -1)).toBe('2026-02-28');
  });

  it('refuses parts of a month', () => {
    expect(() => addMonths(localDate('2026-11-14'), 1.5)).toThrow(RangeError);
    expect(() => addMonths(localDate('2026-11-14'), Number.NaN)).toThrow(RangeError);
  });
});

describe('addYears', () => {
  it('moves by whole years and lands on 28.2. after a leap day', () => {
    expect(addYears(localDate('2026-11-14'), 1)).toBe('2027-11-14');
    expect(addYears(localDate('2026-11-14'), -2)).toBe('2024-11-14');
    expect(addYears(localDate('2028-02-29'), 1)).toBe('2029-02-28');
    expect(addYears(localDate('2028-02-29'), 4)).toBe('2032-02-29');
  });
});

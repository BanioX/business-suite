import { describe, expect, it } from 'vitest';
import {
  addDays,
  CurrencyCodeSchema,
  DEFAULT_CURRENCY,
  HOME_TIME_ZONE,
  localDate,
  parseDateInput,
  parseMoney,
  rappen,
  sumRappen,
  toLocalDate,
  UUID_V7_PATTERN,
  ZERO_RAPPEN,
} from '../src';

/**
 * Unhappy paths and constants of the harvested files that their own tests did not reach. The
 * harvested tests stay as they came; what the suite adds stands here.
 */
describe('amounts beyond the safe range', () => {
  const EUR = CurrencyCodeSchema.parse('EUR');

  it('refuses a typed amount that no whole number can hold', () => {
    expect(parseMoney('99999999999999999999', EUR)).toBeNull();
    expect(parseMoney('99999999999999999999,50', EUR)).toBeNull();
    expect(parseMoney('99999999999999999999', DEFAULT_CURRENCY)).toBeNull();
  });

  it('fails instead of summing into the unsafe range', () => {
    const huge = rappen(Number.MAX_SAFE_INTEGER);
    expect(() => sumRappen([huge, huge])).toThrow(RangeError);
    expect(ZERO_RAPPEN).toBe(0);
  });
});

describe('dates without a year', () => {
  const today = localDate('2026-11-06');

  it('refuses a day the month does not have', () => {
    expect(parseDateInput('31.2.', today)).toBeNull();
    expect(parseDateInput('30.02', today)).toBeNull();
    expect(parseDateInput('0.5.', today)).toBeNull();
  });

  it('takes a leap day only in a leap year and does not guess another year', () => {
    // 2026 has no 29 February.
    expect(parseDateInput('29.2.', today)).toBeNull();
    expect(parseDateInput('29.2.', localDate('2028-01-10'))).toBe('2028-02-29');
  });
});

describe('the home of the calendar', () => {
  it('is Zurich', () => {
    expect(HOME_TIME_ZONE).toBe('Europe/Zurich');
    expect(toLocalDate('2026-11-24T23:30:00Z')).toBe(
      toLocalDate('2026-11-24T23:30:00Z', HOME_TIME_ZONE),
    );
  });

  it('refuses a time zone that does not exist and a date out of range', () => {
    expect(() => toLocalDate('2026-11-24T12:00:00Z', 'Mars/Olympus')).toThrow(RangeError);
    expect(() => addDays(localDate('2026-11-24'), Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
  });
});

describe('the pattern of an id', () => {
  it('matches lower-case UUIDs of version 7 only', () => {
    expect(UUID_V7_PATTERN.test('01901234-5678-7abc-8def-0123456789ab')).toBe(true);
    expect(UUID_V7_PATTERN.test('01901234-5678-7abc-cdef-0123456789ab')).toBe(false);
    expect(UUID_V7_PATTERN.test('01901234-5678-1abc-8def-0123456789ab')).toBe(false);
    expect(UUID_V7_PATTERN.test('01901234567870008000000000000000')).toBe(false);
  });
});

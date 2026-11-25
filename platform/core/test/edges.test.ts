import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  addYears,
  CurrencyCodeSchema,
  DEFAULT_CURRENCY,
  daysBetween,
  formatMoney,
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

describe('thousands in a typed amount', () => {
  const EUR = CurrencyCodeSchema.parse('EUR');
  const JPY = CurrencyCodeSchema.parse('JPY');
  const KWD = CurrencyCodeSchema.parse('KWD');

  it('reads groups of three behind one mark, with either decimal mark', () => {
    expect(parseMoney('1.234.567,89', EUR)).toBe(123_456_789);
    expect(parseMoney('1,234,567.89', EUR)).toBe(123_456_789);
    expect(parseMoney('12.345', EUR)).toBe(1_234_500);
    expect(parseMoney('123,456', EUR)).toBe(12_345_600);
    expect(parseMoney('1234567,89', EUR)).toBe(123_456_789);
    expect(parseMoney(',5', EUR)).toBe(50);
    expect(parseMoney('1.234', JPY)).toBe(1234);
    expect(parseMoney('1.234,567', KWD)).toBe(1_234_567);
  });

  it('refuses marks that group nothing: a typing mistake is not an amount', () => {
    for (const typed of [
      '1.23.45',
      '1,2,3,4.50',
      '12.345.6',
      '1234,567',
      '1.2345,00',
      '1.234,567.89',
      '1.234.50',
      '1,234,50',
      '.123.456',
      '1..234',
      '12.',
    ]) {
      expect(parseMoney(typed, EUR)).toBeNull();
    }
    expect(parseMoney('1.5', JPY)).toBeNull();
    expect(parseMoney('12,34', JPY)).toBeNull();
  });

  it('reads back every amount it writes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000_000_000, max: 100_000_000_000 }),
        fc.constantFrom('EUR', 'USD', 'JPY', 'KWD'),
        (amount, code) => {
          const currency = CurrencyCodeSchema.parse(code);
          const shown = formatMoney(rappen(amount), currency);
          expect(parseMoney(shown, currency)).toBe(amount);
          expect(
            parseMoney(formatMoney(rappen(amount), currency, { currency: false }), currency),
          ).toBe(amount);
        },
      ),
    );
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

describe('the first hundred years', () => {
  // The built-in date reads the years 0 to 99 as 1900 to 1999 unless it is told otherwise.
  it('counts days in the year that is written', () => {
    expect(addDays(localDate('0050-01-01'), 1)).toBe('0050-01-02');
    expect(addDays(localDate('0099-12-31'), 1)).toBe('0100-01-01');
    expect(addDays(localDate('0100-01-01'), -1)).toBe('0099-12-31');
    expect(daysBetween(localDate('0099-12-31'), localDate('0100-01-01'))).toBe(1);
    // 36524 days of the first century plus the leap day of the year 0.
    expect(daysBetween(localDate('0000-01-01'), localDate('0100-01-01'))).toBe(36_525);
    expect(daysBetween(localDate('0050-01-01'), localDate('1950-01-01'))).toBe(693_960);
  });

  it('knows their leap years', () => {
    // The year 0 is a leap year, 1900 is none.
    expect(addMonths(localDate('0000-01-31'), 1)).toBe('0000-02-29');
    expect(addYears(localDate('0004-02-29'), -4)).toBe('0000-02-29');
    expect(addMonths(localDate('1900-01-31'), 1)).toBe('1900-02-28');
    expect(parseDateInput('02.0000', localDate('2026-11-06'))).toBe('0000-02-29');
    expect(parseDateInput('02.1900', localDate('2026-11-06'))).toBe('1900-02-28');
  });

  it('steps through every year like a calendar written out by hand', () => {
    const isLeap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const pad = (value: number, length: number) => String(value).padStart(length, '0');
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 9998 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 31 }),
        (year, month, day) => {
          const days = [31, isLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          const length = days[month - 1] ?? 0;
          fc.pre(day <= length);
          const date = localDate(`${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`);
          const next =
            day < length
              ? `${pad(year, 4)}-${pad(month, 2)}-${pad(day + 1, 2)}`
              : month < 12
                ? `${pad(year, 4)}-${pad(month + 1, 2)}-01`
                : `${pad(year + 1, 4)}-01-01`;
          expect(addDays(date, 1)).toBe(next);
          expect(addDays(localDate(next), -1)).toBe(date);
          expect(daysBetween(date, localDate(next))).toBe(1);
          // The end of the month, reached by adding a month to the end of the month before.
          expect(addMonths(localDate(`${pad(year, 4)}-${pad(month, 2)}-01`), 1)).toBe(
            month < 12 ? `${pad(year, 4)}-${pad(month + 1, 2)}-01` : `${pad(year + 1, 4)}-01-01`,
          );
        },
      ),
    );
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

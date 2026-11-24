import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  assertWholeAmount,
  divideRounded,
  fromThousandths,
  hasAtMostThreeDecimals,
  toSafeNumber,
  toThousandths,
  typedDecimal,
} from '../src/exact';

/** Any quantity the model keeps, built from its whole number of thousandths. */
const thousandths = fc.integer({ min: -1_000_000_000_000, max: 1_000_000_000_000 });

describe('hasAtMostThreeDecimals', () => {
  it('accepts quantities and float noise from sums', () => {
    for (const value of [0, 1, 2.5, 0.001, -0.001, 0.1 + 0.2, 1.1 + 2.2, 999_999_999.999, 1e9]) {
      expect(hasAtMostThreeDecimals(value)).toBe(true);
    }
  });

  it('refuses a fourth decimal and what is no number', () => {
    for (const value of [0.0001, 1.0005, -2.5555, 1e9 + 0.0005, 0.00101]) {
      expect(hasAtMostThreeDecimals(value)).toBe(false);
    }
    expect(hasAtMostThreeDecimals(Number.NaN)).toBe(false);
    expect(hasAtMostThreeDecimals(Number.POSITIVE_INFINITY)).toBe(false);
    expect(hasAtMostThreeDecimals(Number.NEGATIVE_INFINITY)).toBe(false);
  });

  it('takes less than 5 × 10^-7 beside a multiple of 0.001 as float noise', () => {
    expect(hasAtMostThreeDecimals(2.5000004)).toBe(true);
    expect(hasAtMostThreeDecimals(0.0000004)).toBe(true);
    expect(hasAtMostThreeDecimals(2.500001)).toBe(false);
    expect(hasAtMostThreeDecimals(0.000001)).toBe(false);
    // The difference of two large quantities carries the noise of the large ones.
    expect(396_432_865.503 - 432_798_716.02).not.toBe(-36_365_850.517);
    expect(hasAtMostThreeDecimals(396_432_865.503 - 432_798_716.02)).toBe(true);
  });

  it('accepts large quantities whose product with 1000 is no whole float', () => {
    // 544525079.379 × 1000 is 544525079378.99994 as a float: a check after the
    // multiplication would see a fourth decimal that is not there.
    expect(544_525_079.379 * 1000).not.toBe(544_525_079_379);
    expect(hasAtMostThreeDecimals(544_525_079.379)).toBe(true);
    expect(hasAtMostThreeDecimals(67_596_824.849)).toBe(true);
  });

  it('accepts every multiple of 0.001 and refuses every tenth of it in between', () => {
    fc.assert(
      fc.property(thousandths, fc.integer({ min: 1, max: 9 }), (whole, tenth) => {
        expect(hasAtMostThreeDecimals(whole / 1000)).toBe(true);
        expect(hasAtMostThreeDecimals((whole * 10 + tenth) / 10_000)).toBe(false);
      }),
    );
  });
});

describe('toThousandths and fromThousandths', () => {
  it('turns a quantity into a whole number and back', () => {
    expect(toThousandths(2.5)).toBe(2500);
    expect(toThousandths(-0.001)).toBe(-1);
    expect(toThousandths(0.1 + 0.2)).toBe(300);
    expect(toThousandths(1_000_000_000)).toBe(1_000_000_000_000);
    expect(fromThousandths(2500)).toBe(2.5);
    expect(fromThousandths(-1)).toBe(-0.001);
  });

  it('never yields minus zero', () => {
    expect(Object.is(toThousandths(-0), 0)).toBe(true);
    expect(Object.is(toThousandths(-0.0000000001), 0)).toBe(true);
    expect(Object.is(fromThousandths(-0), 0)).toBe(true);
  });

  it('refuses more than three decimals, what is no number and what is too large', () => {
    expect(() => toThousandths(1.0005)).toThrow(
      'A quantity is a finite number with at most three decimals, got 1.0005',
    );
    expect(() => toThousandths(Number.NaN)).toThrow(RangeError);
    expect(() => toThousandths(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => toThousandths(1e16)).toThrow(RangeError);
  });

  it('round-trips every quantity without noise', () => {
    fc.assert(
      fc.property(thousandths, (whole) => {
        expect(toThousandths(whole / 1000)).toBe(whole === 0 ? 0 : whole);
        expect(toThousandths(fromThousandths(whole))).toBe(whole === 0 ? 0 : whole);
      }),
    );
  });
});

describe('assertWholeAmount', () => {
  it('passes safe integers through and names what is wrong', () => {
    expect(assertWholeAmount(8_500_000, 'pricePer1000')).toBe(8_500_000);
    expect(assertWholeAmount(-5, 'total')).toBe(-5);
    expect(() => assertWholeAmount(0.5, 'pricePer1000')).toThrow(
      'pricePer1000 must be a safe integer, got 0.5',
    );
    expect(() => assertWholeAmount(Number.NaN, 'total')).toThrow(RangeError);
    expect(() => assertWholeAmount(2 ** 53, 'total')).toThrow(RangeError);
  });
});

describe('divideRounded', () => {
  it('rounds to the nearest whole number, halves away from zero', () => {
    expect(divideRounded(5n, 2n)).toBe(3n);
    expect(divideRounded(-5n, 2n)).toBe(-3n);
    expect(divideRounded(7n, 2n)).toBe(4n);
    expect(divideRounded(1n, 3n)).toBe(0n);
    expect(divideRounded(-1n, 3n)).toBe(0n);
    expect(divideRounded(2n, 3n)).toBe(1n);
    expect(divideRounded(-2n, 3n)).toBe(-1n);
    expect(divideRounded(0n, 7n)).toBe(0n);
    expect(divideRounded(1499n, 1000n)).toBe(1n);
    expect(divideRounded(1500n, 1000n)).toBe(2n);
    expect(divideRounded(10n ** 30n + 5n, 10n)).toBe(10n ** 29n + 1n);
  });

  it('needs a positive denominator', () => {
    expect(() => divideRounded(1n, 0n)).toThrow(RangeError);
    expect(() => divideRounded(1n, -2n)).toThrow(RangeError);
  });

  it('is within half of the exact quotient, symmetric, and takes halves away from zero', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: -(10n ** 30n), max: 10n ** 30n }),
        fc.bigInt({ min: 1n, max: 10n ** 12n }),
        (numerator, denominator) => {
          const result = divideRounded(numerator, denominator);
          const distance = result * denominator - numerator;
          const absolute = distance < 0n ? -distance : distance;
          expect(2n * absolute <= denominator).toBe(true);
          if (2n * absolute === denominator) {
            // A half: the result is the one further from zero.
            expect(numerator < 0n ? distance < 0n : distance > 0n).toBe(true);
          }
          expect(divideRounded(-numerator, denominator)).toBe(-result);
        },
      ),
    );
  });
});

describe('toSafeNumber', () => {
  it('returns exact numbers and fails beyond them', () => {
    expect(toSafeNumber(12_750n, 'The value')).toBe(12_750);
    expect(toSafeNumber(-(2n ** 53n) + 1n, 'The value')).toBe(-Number.MAX_SAFE_INTEGER);
    expect(Object.is(toSafeNumber(-0n, 'The value'), 0)).toBe(true);
    expect(() => toSafeNumber(2n ** 53n, 'The value')).toThrow(
      'The value exceeds the safe integer range',
    );
    expect(() => toSafeNumber(-(10n ** 400n), 'The value')).toThrow(RangeError);
  });
});

describe('typedDecimal', () => {
  it('reads the digits before and after the decimal mark exactly', () => {
    expect(typedDecimal('7', '5')).toEqual({ digits: 75n, scale: 1 });
    expect(typedDecimal('', '5')).toEqual({ digits: 5n, scale: 1 });
    expect(typedDecimal('12', '')).toEqual({ digits: 12n, scale: 0 });
    expect(typedDecimal('0', '0125')).toEqual({ digits: 125n, scale: 4 });
    expect(typedDecimal('1'.repeat(30), '')).toEqual({ digits: BigInt('1'.repeat(30)), scale: 0 });
  });

  it('refuses no digits, other characters and absurd lengths', () => {
    expect(typedDecimal('', '')).toBeNull();
    expect(typedDecimal('1e', '3')).toBeNull();
    expect(typedDecimal('-1', '')).toBeNull();
    expect(typedDecimal('1'.repeat(31), '')).toBeNull();
    expect(typedDecimal('1'.repeat(20), '1'.repeat(11))).toBeNull();
  });
});

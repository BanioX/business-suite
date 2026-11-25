/**
 * Exact arithmetic behind quantities and unit prices. A quantity has at most three decimals, so it
 * is a whole number of thousandths; multiplied by a price in Rappen per 1000 units the result is a
 * whole number again. Everything here works on whole numbers (BigInt where a product may leave the
 * safe integer range) and rounds exactly once, halves away from zero. No float touches money.
 *
 * Internal to the package: `index.ts` does not export this file.
 */

/**
 * The float noise one sum or difference of two quantities can carry. Quantities reach 10^9, where
 * neighbouring floats lie about 1.2 × 10^-7 apart; two operands and their result miss the exact
 * value by less than 5 × 10^-7 together. A fourth decimal is at least 10^-4 away: no confusion.
 */
const NOISE = 5e-7;

/**
 * True if a number is a quantity: finite and, apart from float noise, a multiple of 0.001.
 *
 * The comparison happens at the size of the value, not after multiplying by 1000: the product of a
 * large quantity (some ten millions with decimals) and 1000 is itself a rounded float and would
 * look like a fourth decimal. The nearest multiple of 0.001 is exact at any size.
 */
export function hasAtMostThreeDecimals(value: number): boolean {
  const nearest = Math.round(value * 1000) / 1000;
  return Math.abs(value - nearest) < NOISE;
}

/**
 * A quantity as a whole number of thousandths. Throws on more than three decimals, on what is no
 * finite number and on a quantity too large to count its thousandths exactly.
 */
export function toThousandths(quantity: number): number {
  const thousandths = Math.round(quantity * 1000);
  if (!hasAtMostThreeDecimals(quantity) || !Number.isSafeInteger(thousandths)) {
    throw new RangeError(
      `A quantity is a finite number with at most three decimals, got ${String(quantity)}`,
    );
  }
  return thousandths === 0 ? 0 : thousandths;
}

/** Thousandths back to a quantity. The division of a whole number by 1000 carries no noise. */
export function fromThousandths(thousandths: number): number {
  const quantity = thousandths / 1000;
  return quantity === 0 ? 0 : quantity;
}

/** A price in Rappen per 1000 units, or any other amount of money: a safe integer or an error. */
export function assertWholeAmount(value: number, what: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${what} must be a safe integer, got ${String(value)}`);
  }
  return value;
}

/** `numerator / denominator`, rounded to the nearest whole number, halves away from zero. */
export function divideRounded(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) {
    throw new RangeError('divideRounded needs a positive denominator');
  }
  const absolute = numerator < 0n ? -numerator : numerator;
  const quotient = (2n * absolute + denominator) / (2n * denominator);
  return numerator < 0n ? -quotient : quotient;
}

/** A BigInt result as a number; throws if it left the range where numbers are exact. */
export function toSafeNumber(value: bigint, what: string): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result)) {
    throw new RangeError(`${what} exceeds the safe integer range`);
  }
  return result;
}

/** A decimal number as typed: `digits / 10^scale`, without ever becoming a float. */
export interface TypedDecimal {
  readonly digits: bigint;
  readonly scale: number;
}

/** Longest number a person types; anything longer is not an amount. */
const MAX_TYPED_DIGITS = 30;

/**
 * Reads the whole and the fractional digits of a typed number («7», «7.5», «.5») exactly.
 * Returns null if there are no digits or absurdly many.
 */
export function typedDecimal(whole: string, fraction: string): TypedDecimal | null {
  const text = `${whole}${fraction}`;
  if (!/^\d+$/.test(text) || text.length > MAX_TYPED_DIGITS) {
    return null;
  }
  return { digits: BigInt(text), scale: fraction.length };
}

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CURRENCY,
  formatQuantity,
  formatUnitPrice,
  lineValue,
  milliToRappen,
  parseQuantityInput,
  parseUnitPrice,
  PLATFORM_UNITS,
  QuantityDeltaSchema,
  rappen,
  roundQuantity,
  UnitError,
  unitPriceFromTotal,
  valueMilli,
  type PlatformUnitId,
  type UnitDefinition,
} from '../src';

/**
 * Properties of quantities, conversions and values over arbitrary input. The reference is always
 * whole-number arithmetic written out here (BigInt), never the code under test.
 */

/** A quantity built from its whole number of thousandths: the only source without float noise. */
const quantityOf = (thousandths: number): number => thousandths / 1000;
const thousandthsOf = (quantity: number): bigint => BigInt(Math.round(quantity * 1000));

/** Up to a million units either way; times the largest factor (10^6) still a safe integer. */
const anyThousandths = fc.integer({ min: -1_000_000_000, max: 1_000_000_000 });
/** Up to 100'000 units: more than a line of a document carries. */
const lineThousandths = fc.integer({ min: 0, max: 100_000_000 });
/** Up to 9'000'000 Rappen per 1000 units, e.g. CHF 90.00 per hour or CHF 90'000.00 per kg. */
const price = fc.integer({ min: 0, max: 9_000_000 });

/** Pairs of units that convert into each other, the same unit twice included. */
const unitPair = fc
  .constantFrom<[PlatformUnitId, PlatformUnitId]>(
    ['min', 'h'],
    ['h', 'min'],
    ['m', 'km'],
    ['km', 'm'],
    ['ml', 'm3'],
    ['m3', 'ml'],
    ['h', 'h'],
    ['g', 'g'],
    ['m2', 'm2'],
    ['pcs', 'pcs'],
  )
  .map(([from, to]) => ({ from: PLATFORM_UNITS.get(from), to: PLATFORM_UNITS.get(to) }));

/**
 * Pairs whose factors differ by at most 1000: with the quantities and prices above, every value
 * stays a safe integer (at most 10^8 × 9 × 10^6 × 1000 / 1000 thousandths of a Rappen).
 */
const pricedPair = unitPair.filter(({ from, to }) => from.dimension !== 'volume' || from === to);

const abs = (value: bigint): bigint => (value < 0n ? -value : value);

/** True if `result` is `numerator / denominator` rounded once, halves away from zero. */
function isRoundedOnce(result: number, numerator: bigint, denominator: bigint): boolean {
  const distance = abs(BigInt(result) * denominator - numerator);
  if (2n * distance > denominator) {
    return false;
  }
  // On a half, the result is the candidate further from zero.
  return 2n * distance < denominator || abs(BigInt(result)) * denominator > abs(numerator);
}

describe('quantities carry no float noise', () => {
  it('stores the sum and the difference of two quantities as those of their thousandths', () => {
    // The whole range of the model: sums of large amounts and differences that nearly cancel.
    const modelThousandths = fc.integer({ min: -500_000_000_000, max: 500_000_000_000 });
    fc.assert(
      fc.property(modelThousandths, modelThousandths, (a, b) => {
        const sum = quantityOf(a) + quantityOf(b);
        expect(QuantityDeltaSchema.parse(sum)).toBe(quantityOf(a + b));
        expect(roundQuantity(sum)).toBe(a + b === 0 ? 0 : quantityOf(a + b));
        const difference = quantityOf(a) - quantityOf(b);
        expect(QuantityDeltaSchema.parse(difference)).toBe(quantityOf(a - b));
      }),
    );
  });

  it('keeps a running total exact when every step is rounded', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100_000_000 }), { maxLength: 60 }),
        (steps) => {
          let total = 0;
          let exact = 0;
          for (const step of steps) {
            total = roundQuantity(total + quantityOf(step));
            exact += step;
          }
          expect(total).toBe(quantityOf(exact));
        },
      ),
    );
  });
});

describe('conversion', () => {
  it('is exact or fails: nothing is rounded on the way', () => {
    fc.assert(
      fc.property(anyThousandths, unitPair, (thousandths, { from, to }) => {
        const quantity = quantityOf(thousandths);
        const scaled = BigInt(thousandths) * BigInt(from.factor);
        const fits = scaled % BigInt(to.factor) === 0n;
        let converted: number;
        try {
          converted = PLATFORM_UNITS.convert(quantity, from.id, to.id);
        } catch (error) {
          expect(fits).toBe(false);
          expect(error).toBeInstanceOf(UnitError);
          expect((error as UnitError).code).toBe('not_exact');
          return;
        }
        expect(fits).toBe(true);
        expect(thousandthsOf(converted)).toBe(scaled / BigInt(to.factor));
        // The result is a clean quantity: exactly the float of its three decimals.
        expect(converted).toBe(quantityOf(Number(thousandthsOf(converted))));
        expect(Object.is(converted, -0)).toBe(false);
      }),
    );
  });

  it('round-trips: there and back is the same quantity', () => {
    fc.assert(
      fc.property(anyThousandths, unitPair, (thousandths, { from, to }) => {
        const quantity = quantityOf(thousandths);
        fc.pre(PLATFORM_UNITS.convertible(from.id, to.id));
        fc.pre((BigInt(thousandths) * BigInt(from.factor)) % BigInt(to.factor) === 0n);
        const there = PLATFORM_UNITS.convert(quantity, from.id, to.id);
        expect(PLATFORM_UNITS.convert(there, to.id, from.id)).toBe(quantity === 0 ? 0 : quantity);
      }),
    );
  });

  it('always succeeds towards the smaller unit', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000_000, max: 1_000_000_000 }),
        fc.constantFrom<[PlatformUnitId, PlatformUnitId]>(['h', 'min'], ['km', 'm'], ['m3', 'ml']),
        (thousandths, [from, to]) => {
          const factor = PLATFORM_UNITS.get(from).factor / PLATFORM_UNITS.get(to).factor;
          const expected = quantityOf(thousandths * factor);
          expect(PLATFORM_UNITS.convert(quantityOf(thousandths), from, to)).toBe(
            expected === 0 ? 0 : expected,
          );
        },
      ),
    );
  });
});

describe('the value of a line', () => {
  const unitsOf = (pair: { from: UnitDefinition; to: UnitDefinition }) => ({
    quantityUnit: pair.from,
    priceUnit: pair.to,
  });

  it('is a whole number of Rappen: the exact product, rounded once, halves away from zero', () => {
    fc.assert(
      fc.property(lineThousandths, price, pricedPair, (thousandths, pricePer1000, pair) => {
        const value = lineValue(quantityOf(thousandths), pricePer1000, unitsOf(pair));
        expect(Number.isSafeInteger(value)).toBe(true);
        const numerator = BigInt(thousandths) * BigInt(pricePer1000) * BigInt(pair.from.factor);
        expect(isRoundedOnce(value, numerator, 1_000_000n * BigInt(pair.to.factor))).toBe(true);

        const milli = valueMilli(quantityOf(thousandths), pricePer1000, unitsOf(pair));
        expect(Number.isSafeInteger(milli)).toBe(true);
        expect(isRoundedOnce(milli, numerator, 1000n * BigInt(pair.to.factor))).toBe(true);
      }),
    );
  });

  it('is the same with and without naming the unit when both are one', () => {
    fc.assert(
      fc.property(lineThousandths, price, (thousandths, pricePer1000) => {
        const h = PLATFORM_UNITS.get('h');
        const quantity = quantityOf(thousandths);
        expect(lineValue(quantity, pricePer1000, { quantityUnit: h, priceUnit: h })).toBe(
          lineValue(quantity, pricePer1000),
        );
      }),
    );
  });

  it('never falls when the quantity grows', () => {
    fc.assert(
      fc.property(
        lineThousandths,
        lineThousandths,
        price,
        pricedPair,
        (a, b, pricePer1000, pair) => {
          const [less, more] = a <= b ? [a, b] : [b, a];
          const units = unitsOf(pair);
          expect(lineValue(quantityOf(less), pricePer1000, units)).toBeLessThanOrEqual(
            lineValue(quantityOf(more), pricePer1000, units),
          );
          expect(valueMilli(quantityOf(less), pricePer1000, units)).toBeLessThanOrEqual(
            valueMilli(quantityOf(more), pricePer1000, units),
          );
        },
      ),
    );
  });

  it('adds exactly the price of every further unit when the price is whole Rappen', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (units, wholeRappenPerUnit) => {
          // A price in whole Rappen per unit: every further unit adds exactly that.
          const pricePer1000 = wholeRappenPerUnit * 1000;
          expect(lineValue(units + 1, pricePer1000) - lineValue(units, pricePer1000)).toBe(
            wholeRappenPerUnit,
          );
          expect(lineValue(units, pricePer1000)).toBe(units * wholeRappenPerUnit);
        },
      ),
    );
  });

  it('cancels with its correction: a negative quantity has the opposite value', () => {
    fc.assert(
      fc.property(lineThousandths, price, pricedPair, (thousandths, pricePer1000, pair) => {
        const units = unitsOf(pair);
        const quantity = quantityOf(thousandths);
        expect(
          lineValue(quantity, pricePer1000, units) + lineValue(-quantity, pricePer1000, units),
        ).toBe(0);
        expect(
          valueMilli(quantity, pricePer1000, units) + valueMilli(-quantity, pricePer1000, units),
        ).toBe(0);
      }),
    );
  });

  it('is the same whether the quantity is converted first or priced across units', () => {
    fc.assert(
      fc.property(lineThousandths, price, pricedPair, (thousandths, pricePer1000, pair) => {
        fc.pre((BigInt(thousandths) * BigInt(pair.from.factor)) % BigInt(pair.to.factor) === 0n);
        const quantity = quantityOf(thousandths);
        const converted = PLATFORM_UNITS.convert(quantity, pair.from.id, pair.to.id);
        expect(lineValue(quantity, pricePer1000, unitsOf(pair))).toBe(
          lineValue(converted, pricePer1000),
        );
      }),
    );
  });

  it('differs by at most one Rappen from the detour over thousandths', () => {
    fc.assert(
      fc.property(lineThousandths, price, pricedPair, (thousandths, pricePer1000, pair) => {
        const units = unitsOf(pair);
        const quantity = quantityOf(thousandths);
        const direct = lineValue(quantity, pricePer1000, units);
        const detour = milliToRappen(valueMilli(quantity, pricePer1000, units));
        expect(detour - direct === 0 || detour - direct === 1).toBe(true);
      }),
    );
  });

  it('turns thousandths into Rappen like a division rounded once', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -Number.MAX_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER }),
        (milli) => {
          const value = milliToRappen(milli);
          expect(isRoundedOnce(value, BigInt(milli), 1000n)).toBe(true);
          expect(Object.is(value, -0)).toBe(false);
        },
      ),
    );
  });
});

describe('the unit price from a total', () => {
  it('is the exact quotient, rounded once', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000, max: 1_000_000 }),
        fc.integer({ min: 1000, max: 1_000_000_000 }),
        pricedPair,
        (total, thousandths, pair) => {
          const units = { quantityUnit: pair.from, priceUnit: pair.to };
          const unitPrice = unitPriceFromTotal(rappen(total), quantityOf(thousandths), units);
          expect(
            isRoundedOnce(
              unitPrice,
              BigInt(total) * 1_000_000n * BigInt(pair.to.factor),
              BigInt(thousandths) * BigInt(pair.from.factor),
            ),
          ).toBe(true);
        },
      ),
    );
  });

  it('gives the total back within one Rappen for up to 1000 units', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000_000 }),
        fc.integer({ min: 1, max: 1_000_000 }),
        (total, thousandths) => {
          const quantity = quantityOf(thousandths);
          const unitPrice = unitPriceFromTotal(rappen(total), quantity);
          expect(Math.abs(lineValue(quantity, unitPrice) - total)).toBeLessThanOrEqual(1);
        },
      ),
    );
  });
});

describe('what is shown reads back', () => {
  const kinds = fc.constantFrom<PlatformUnitId>('g', 'ml', 'h', 'pcs', 'm2', 'flat');

  it('reads a formatted unit price back to the same price', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100_000_000_000 }), kinds, (pricePer1000, id) => {
        const unit = PLATFORM_UNITS.get(id);
        const [shown = ''] = formatUnitPrice(pricePer1000, unit, DEFAULT_CURRENCY).split(' / ');
        expect(parseUnitPrice(shown, unit, DEFAULT_CURRENCY)).toBe(pricePer1000);
      }),
    );
  });

  /** `rounded / 10^digits` written out by hand: the whole part, then the decimals without closing zeros. */
  const written = (rounded: bigint, digits: number): string => {
    const scale = 10n ** BigInt(digits);
    const decimals = (rounded % scale).toString().padStart(digits, '0').replace(/0+$/, '');
    return `${(rounded / scale).toString()}${decimals === '' ? '' : `.${decimals}`}`;
  };
  const shownIn = (thousandths: number, digits: number): string =>
    formatQuantity(quantityOf(thousandths), PLATFORM_UNITS.get('h'), { digits }).replaceAll(
      '’',
      '',
    );

  it('shows fewer decimals as the thousandths rounded once, halves away from zero', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000_000_000, max: 1_000_000_000_000 }),
        fc.constantFrom(0, 1, 2),
        (thousandths, digits) => {
          const step = 10n ** BigInt(3 - digits);
          const rounded = (abs(BigInt(thousandths)) * 2n + step) / (2n * step);
          const sign = thousandths < 0 && rounded !== 0n ? '-' : '';
          expect(shownIn(thousandths, digits)).toBe(`${sign}${written(rounded, digits)} h`);
        },
      ),
    );
  });

  it('rounds every half of the second decimal away from zero, up to 200 units', () => {
    // One in twenty of these falls short as a float product: 1.005 × 100 is 100.49999999999999.
    for (let thousandths = 5; thousandths < 200_000; thousandths += 10) {
      const hundredths = BigInt((thousandths + 5) / 10);
      expect(shownIn(thousandths, 2)).toBe(`${written(hundredths, 2)} h`);
      expect(shownIn(-thousandths, 2)).toBe(`-${written(hundredths, 2)} h`);
    }
  });

  it('reads a formatted quantity back to the same quantity', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000_000_000 }), kinds, (thousandths, id) => {
        const unit = PLATFORM_UNITS.get(id);
        // From 1000 on, grams and millilitres are shown in whole units of their thousand.
        const shownExactly = unit.thousandSymbol === undefined || thousandths < 1_000_000;
        const quantity = quantityOf(
          shownExactly ? thousandths : thousandths - (thousandths % 1000),
        );
        expect(parseQuantityInput(formatQuantity(quantity, unit), unit)).toBe(quantity);
      }),
    );
  });
});

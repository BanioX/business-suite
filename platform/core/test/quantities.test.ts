// Origin: BanioX/Randen packages/core/test/units.test.ts @ e0f0907 — adapted: units come from the register, cases for time, length and area added, temperature left out
import { describe, expect, it } from 'vitest';
import {
  CurrencyCodeSchema,
  DEFAULT_CURRENCY,
  formatPercent,
  formatQuantity,
  formatUnitPrice,
  lineValue,
  milliToRappen,
  parseQuantityInput,
  parseUnitPrice,
  PLATFORM_UNITS,
  priceUnitLabel,
  rappen,
  roundQuantity,
  UnitError,
  unitLabel,
  unitPriceFromTotal,
  valueMilli,
  type UnitDefinition,
} from '../src';

const G = PLATFORM_UNITS.get('g');
const ML = PLATFORM_UNITS.get('ml');
const M3 = PLATFORM_UNITS.get('m3');
const PCS = PLATFORM_UNITS.get('pcs');
const MIN = PLATFORM_UNITS.get('min');
const H = PLATFORM_UNITS.get('h');
const M = PLATFORM_UNITS.get('m');
const KM = PLATFORM_UNITS.get('km');
const M2 = PLATFORM_UNITS.get('m2');
const FLAT = PLATFORM_UNITS.get('flat');

/** What a language catalogue does: the same unit with the word of the language. */
const PIECES_DE: UnitDefinition = { ...PCS, symbol: 'Stk.' };
/** A spelling for reading only: never registered, never stored. */
const DECILITRE: UnitDefinition = { id: 'dl', dimension: 'volume', factor: 100, symbol: 'dl' };

const codeOf = (action: () => unknown): string | undefined => {
  try {
    action();
  } catch (error) {
    return error instanceof UnitError ? error.code : `other: ${String(error)}`;
  }
  return undefined;
};

describe('formatQuantity', () => {
  it('writes small and large amounts with the symbols of the unit', () => {
    expect(formatQuantity(750, G)).toBe('750 g');
    expect(formatQuantity(2500, G)).toBe('2.5 kg');
    expect(formatQuantity(1000, G)).toBe('1 kg');
    expect(formatQuantity(12_340, G)).toBe('12.34 kg');
    expect(formatQuantity(2.5, G)).toBe('2.5 g');
    expect(formatQuantity(1200, ML)).toBe('1.2 l');
    expect(formatQuantity(330, ML)).toBe('330 ml');
    expect(formatQuantity(12, PCS)).toBe('12 pcs');
    expect(formatQuantity(0.5, PCS)).toBe('0.5 pcs');
    expect(formatQuantity(1_250_000, G)).toBe('1’250 kg');
  });

  it('writes time, length, area and volume per single unit', () => {
    expect(formatQuantity(1.5, H)).toBe('1.5 h');
    expect(formatQuantity(90, MIN)).toBe('90 min');
    expect(formatQuantity(12.345, M2)).toBe('12.345 m²');
    expect(formatQuantity(1500, M)).toBe('1’500 m');
    expect(formatQuantity(2.5, KM)).toBe('2.5 km');
    expect(formatQuantity(2, M3)).toBe('2 m³');
    expect(formatQuantity(1, FLAT)).toBe('1 flat');
  });

  it('keeps the sign and drops float noise', () => {
    expect(formatQuantity(-2500, G)).toBe('-2.5 kg');
    expect(formatQuantity(-0.25, H)).toBe('-0.25 h');
    expect(formatQuantity(0.1 + 0.2, H)).toBe('0.3 h');
    expect(formatQuantity(-0.0001, H)).toBe('0 h');
  });

  it('rounds the thousand to whole units, halves away from zero', () => {
    expect(formatQuantity(1234.4, G)).toBe('1.234 kg');
    expect(formatQuantity(1234.5, G)).toBe('1.235 kg');
    expect(formatQuantity(-1234.5, G)).toBe('-1.235 kg');
    expect(formatQuantity(999.999, G)).toBe('999.999 g');
  });

  it('limits the decimals on request', () => {
    expect(formatQuantity(2.555, G)).toBe('2.555 g');
    expect(formatQuantity(2.555, G, { digits: 1 })).toBe('2.6 g');
    expect(formatQuantity(0.5, PCS, { digits: 0 })).toBe('1 pcs');
  });

  it('takes the word of a language from the definition', () => {
    expect(formatQuantity(12, PIECES_DE)).toBe('12 Stk.');
  });
});

describe('parseQuantityInput', () => {
  it('reads typed amounts into the unit of the field', () => {
    expect(parseQuantityInput('2.5 kg', G)).toBe(2500);
    expect(parseQuantityInput('2,5kg', G)).toBe(2500);
    expect(parseQuantityInput('750', G)).toBe(750);
    expect(parseQuantityInput('750 g', G)).toBe(750);
    expect(parseQuantityInput('2 l', ML)).toBe(2000);
    expect(parseQuantityInput('12 pcs', PCS)).toBe(12);
    expect(parseQuantityInput('0.5', PCS)).toBe(0.5);
    expect(parseQuantityInput('.5', PCS)).toBe(0.5);
    expect(parseQuantityInput('1’250', G)).toBe(1250);
    expect(parseQuantityInput("1'250.5 g", G)).toBe(1250.5);
    expect(parseQuantityInput('  1.5 h ', H)).toBe(1.5);
    expect(parseQuantityInput('0', H)).toBe(0);
  });

  it('knows a unit by its id and by its symbol, without case', () => {
    expect(parseQuantityInput('12 m2', M2)).toBe(12);
    expect(parseQuantityInput('12 m²', M2)).toBe(12);
    expect(parseQuantityInput('12 M2', M2)).toBe(12);
    expect(parseQuantityInput('3 m3', M3)).toBe(3);
    expect(parseQuantityInput('3 m³', M3)).toBe(3);
    expect(parseQuantityInput('2 KG', G)).toBe(2000);
  });

  it('takes a bare number in the unit of the field', () => {
    expect(parseQuantityInput('2.5', G, { fallback: 'kg' })).toBe(2500);
    expect(parseQuantityInput('250 g', G, { fallback: 'kg' })).toBe(250);
    expect(parseQuantityInput('1.5', ML, { fallback: 'l' })).toBe(1500);
    expect(parseQuantityInput('1.5', MIN, { fallback: 'h', also: [H] })).toBe(90);
  });

  it('reads other units of the same dimension when the field allows them', () => {
    expect(parseQuantityInput('1.5 h', MIN, { also: [H] })).toBe(90);
    expect(parseQuantityInput('90 min', H, { also: [MIN] })).toBe(1.5);
    expect(parseQuantityInput('2 km', M, { also: [KM] })).toBe(2000);
    expect(parseQuantityInput('1 m3', ML, { also: [M3] })).toBe(1_000_000);
    expect(parseQuantityInput('2.5 l', M3, { also: [ML] })).toBe(0.003);
    expect(parseQuantityInput('1.5 h', MIN)).toBeNull();
  });

  it('reads the spellings of a language that are passed in', () => {
    expect(parseQuantityInput('12 Stk.', PIECES_DE)).toBe(12);
    expect(parseQuantityInput('12 stk', PIECES_DE)).toBe(12);
    expect(parseQuantityInput('12 pcs', PIECES_DE)).toBe(12);
    expect(parseQuantityInput('7.5 dl', ML, { also: [DECILITRE] })).toBe(750);
    expect(parseQuantityInput('7,5', ML, { fallback: 'dl', also: [DECILITRE] })).toBe(750);
  });

  it('lets the first definition of a spelling win', () => {
    const other: UnitDefinition = { id: 'other', dimension: 'time', factor: 1, symbol: 'h' };
    expect(parseQuantityInput('2 h', MIN, { also: [H, other] })).toBe(120);
    expect(parseQuantityInput('2 h', MIN, { also: [other, H] })).toBe(2);
  });

  it('rounds what does not fit three decimals, halves away from zero', () => {
    expect(parseQuantityInput('50 min', H, { also: [MIN] })).toBe(0.833);
    expect(parseQuantityInput('1.23456 kg', G)).toBe(1234.56);
    expect(parseQuantityInput('0.0005', PCS)).toBe(0.001);
    expect(parseQuantityInput('0.0004', PCS)).toBe(0);
    expect(parseQuantityInput('0.0025', G)).toBe(0.003);
    expect(parseQuantityInput('1.0005', H)).toBe(1.001);
  });

  it('refuses what is not an amount of this unit', () => {
    expect(parseQuantityInput('', G)).toBeNull();
    expect(parseQuantityInput('two', G)).toBeNull();
    expect(parseQuantityInput('2 l', G)).toBeNull();
    expect(parseQuantityInput('-3', G)).toBeNull();
    expect(parseQuantityInput('3 kg', PCS)).toBeNull();
    expect(parseQuantityInput('12.', G)).toBeNull();
    expect(parseQuantityInput('1.2.3', G)).toBeNull();
    expect(parseQuantityInput('1 250', G)).toBeNull();
    expect(parseQuantityInput('2 kg net', G)).toBeNull();
    expect(parseQuantityInput('1e3', G)).toBeNull();
  });

  it('refuses amounts beyond what the model keeps', () => {
    expect(parseQuantityInput('1000000000', G)).toBe(1_000_000_000);
    expect(parseQuantityInput('1000000000.001', G)).toBeNull();
    expect(parseQuantityInput('1000001 kg', G)).toBeNull();
    expect(parseQuantityInput('9'.repeat(40), G)).toBeNull();
  });

  it('fails loudly on a wrong set-up of the field', () => {
    expect(codeOf(() => parseQuantityInput('1', G, { fallback: 'h' }))).toBe('unknown_unit');
    expect(codeOf(() => parseQuantityInput('1', G, { also: [H] }))).toBe('dimension_mismatch');
    const broken: UnitDefinition = { id: 'broken', dimension: 'mass', factor: 0, symbol: 'b' };
    expect(codeOf(() => parseQuantityInput('1', G, { also: [broken] }))).toBe('invalid_definition');
  });
});

describe('values', () => {
  it('multiplies a quantity by a price per 1000 units', () => {
    // 2 kg at CHF 62.00/kg
    expect(valueMilli(2000, 6200)).toBe(12_400_000);
    expect(lineValue(2000, 6200)).toBe(12_400);
    // 12 pieces at CHF 0.45
    expect(lineValue(12, 45_000)).toBe(540);
    // 2.5 g at CHF 9'000/kg
    expect(lineValue(2.5, 900_000)).toBe(2250);
    // 12.5 m² at CHF 38.00/m²
    expect(lineValue(12.5, 3_800_000)).toBe(47_500);
    // a lump sum of CHF 1'200.00
    expect(lineValue(1, 120_000_000)).toBe(120_000);
    expect(lineValue(0, 6200)).toBe(0);
  });

  it('prices minutes at an hourly rate through the register', () => {
    const units = { quantityUnit: MIN, priceUnit: H };
    // CHF 85.00 per hour is 8'500'000 Rappen per 1000 h.
    expect(lineValue(90, 8_500_000, units)).toBe(12_750);
    expect(lineValue(1.5, 8_500_000)).toBe(12_750);
    expect(lineValue(1.5, 8_500_000, { quantityUnit: H, priceUnit: H })).toBe(12_750);
    // 50 min are no round number of hours and still have a value: 7083.33 Rappen.
    expect(lineValue(50, 8_500_000, units)).toBe(7083);
    expect(valueMilli(50, 8_500_000, units)).toBe(7_083_333);
    // 40 min: 5666.67 Rappen
    expect(lineValue(40, 8_500_000, units)).toBe(5667);
  });

  it('prices across the units of length and volume', () => {
    // 2500 m at CHF 0.70 per km
    expect(lineValue(2500, 70_000, { quantityUnit: M, priceUnit: KM })).toBe(175);
    // 0.5 km of pipe at CHF 12.00 per metre
    expect(lineValue(0.5, 1_200_000, { quantityUnit: KM, priceUnit: M })).toBe(600_000);
    // 3 m³ are 3000 litres, at CHF 1.90 per litre
    expect(lineValue(3, 190, { quantityUnit: M3, priceUnit: ML })).toBe(570_000);
  });

  it('rounds half away from zero', () => {
    expect(milliToRappen(1500)).toBe(2);
    expect(milliToRappen(1499)).toBe(1);
    expect(milliToRappen(-1500)).toBe(-2);
    expect(milliToRappen(-1499)).toBe(-1);
    expect(Object.is(milliToRappen(-1), 0)).toBe(true);
    expect(lineValue(1, 1500)).toBe(2);
    expect(lineValue(-1, 1500)).toBe(-2);
    expect(lineValue(1, 1499)).toBe(1);
    expect(valueMilli(0.5, 1001)).toBe(501);
    expect(valueMilli(-0.5, 1001)).toBe(-501);
    expect(Object.is(lineValue(-0.001, 1), 0)).toBe(true);
  });

  it('rounds a line once: no detour over thousandths', () => {
    // 0.5 at 999 per 1000 is 0.4995 Rappen: nothing. Rounded to thousandths first it would be
    // 500 thousandths and then one Rappen.
    expect(lineValue(0.5, 999)).toBe(0);
    expect(valueMilli(0.5, 999)).toBe(500);
    expect(milliToRappen(valueMilli(0.5, 999))).toBe(1);
  });

  it('carries no float noise into money', () => {
    // 1.005 × 1500 is 1507.4999999999998 as floats; 1005 thousandths at 1500 are exactly 1507.5.
    expect(valueMilli(1.005, 1500)).toBe(1508);
    // 0.285 × 1500 is 427.49999999999994 as floats, exactly 427.5.
    expect(valueMilli(0.285, 1500)).toBe(428);
    expect(valueMilli(0.1 + 0.2, 1000)).toBe(300);
    expect(lineValue(1.005, 1_000_000)).toBe(1005);
    expect(lineValue(8.325, 100_000)).toBe(833);
  });

  it('derives the unit price from a line total', () => {
    // 10 kg for CHF 520.00 → CHF 52.00/kg
    expect(unitPriceFromTotal(rappen(52_000), 10_000)).toBe(5200);
    // 30 pieces for CHF 13.50 → CHF 0.45 each
    expect(unitPriceFromTotal(rappen(1350), 30)).toBe(45_000);
    expect(unitPriceFromTotal(rappen(1350), 0)).toBe(0);
    expect(unitPriceFromTotal(rappen(1350), -2)).toBe(0);
    // 90 min for CHF 127.50 → CHF 85.00 per hour
    expect(unitPriceFromTotal(rappen(12_750), 90, { quantityUnit: MIN, priceUnit: H })).toBe(
      8_500_000,
    );
    // 3 for CHF 1.00 → 33.333 Rappen each; a credit rounds the same way
    expect(unitPriceFromTotal(rappen(100), 3)).toBe(33_333);
    expect(unitPriceFromTotal(rappen(-100), 3)).toBe(-33_333);
    expect(unitPriceFromTotal(rappen(1), 0.002)).toBe(500_000);
  });

  it('keeps quantities free of float noise', () => {
    expect(roundQuantity(0.1 + 0.2)).toBe(0.3);
    expect(Object.is(roundQuantity(-0.0001), 0)).toBe(true);
  });

  it('refuses a quantity with more than three decimals and a price that is no whole number', () => {
    expect(() => lineValue(0.0001, 1000)).toThrow(RangeError);
    expect(() => valueMilli(1.0005, 1000)).toThrow(RangeError);
    expect(() => valueMilli(Number.NaN, 1000)).toThrow(RangeError);
    expect(() => lineValue(Number.POSITIVE_INFINITY, 1000)).toThrow(RangeError);
    expect(() => lineValue(1, 0.5)).toThrow(RangeError);
    expect(() => valueMilli(1, Number.NaN)).toThrow(RangeError);
    expect(() => milliToRappen(1.5)).toThrow(RangeError);
    expect(() => unitPriceFromTotal(rappen(100), 0.0005)).toThrow(RangeError);
    expect(() => unitPriceFromTotal(rappen(100), Number.NaN)).toThrow(RangeError);
  });

  it('refuses units that do not measure the same', () => {
    expect(codeOf(() => lineValue(1, 1000, { quantityUnit: H, priceUnit: M }))).toBe(
      'dimension_mismatch',
    );
    expect(codeOf(() => valueMilli(1, 1000, { quantityUnit: G, priceUnit: ML }))).toBe(
      'dimension_mismatch',
    );
    expect(
      codeOf(() => unitPriceFromTotal(rappen(1), 1, { quantityUnit: PCS, priceUnit: FLAT })),
    ).toBe('dimension_mismatch');
  });

  it('refuses a unit with a broken factor instead of computing a wrong amount', () => {
    const broken: UnitDefinition = { id: 'broken', dimension: 'time', factor: 1.5, symbol: 'b' };
    expect(codeOf(() => lineValue(1, 1000, { quantityUnit: broken, priceUnit: H }))).toBe(
      'invalid_definition',
    );
    expect(codeOf(() => lineValue(1, 1000, { quantityUnit: H, priceUnit: broken }))).toBe(
      'invalid_definition',
    );
  });

  it('fails instead of leaving the range where whole numbers are exact', () => {
    expect(() => valueMilli(1_000_000_000, Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
    expect(() =>
      lineValue(1_000_000_000, Number.MAX_SAFE_INTEGER, { quantityUnit: M3, priceUnit: ML }),
    ).toThrow(RangeError);
    expect(() => unitPriceFromTotal(rappen(Number.MAX_SAFE_INTEGER), 0.001)).toThrow(RangeError);
    // Inside the range the product may be far beyond 2^53 on the way.
    expect(lineValue(1_000_000_000, 9_007_199_254)).toBe(9_007_199_254_000_000);
  });
});

describe('unit prices', () => {
  it('formats per kilogram and litre, and per single unit elsewhere', () => {
    expect(formatUnitPrice(6200, G, DEFAULT_CURRENCY)).toBe('CHF 62.00 / kg');
    expect(formatUnitPrice(640, ML, DEFAULT_CURRENCY)).toBe('CHF 6.40 / l');
    expect(formatUnitPrice(45_000, PCS, DEFAULT_CURRENCY)).toBe('CHF 0.45 / pcs');
    expect(formatUnitPrice(1200, PCS, DEFAULT_CURRENCY)).toBe('CHF 0.012 / pcs');
    expect(formatUnitPrice(6200, G, DEFAULT_CURRENCY, { currency: false })).toBe('62.00 / kg');
    expect(formatUnitPrice(8_500_000, H, DEFAULT_CURRENCY)).toBe('CHF 85.00 / h');
    expect(formatUnitPrice(3_800_000, M2, DEFAULT_CURRENCY)).toBe('CHF 38.00 / m²');
    expect(formatUnitPrice(120_000_000, FLAT, DEFAULT_CURRENCY)).toBe('CHF 1’200.00 / flat');
    expect(formatUnitPrice(45_000, PIECES_DE, DEFAULT_CURRENCY)).toBe('CHF 0.45 / Stk.');
  });

  it('shows every decimal of a price below one Rappen', () => {
    expect(formatUnitPrice(1234, PCS, DEFAULT_CURRENCY)).toBe('CHF 0.01234 / pcs');
    expect(formatUnitPrice(1, PCS, DEFAULT_CURRENCY)).toBe('CHF 0.00001 / pcs');
    expect(formatUnitPrice(1200, PCS, DEFAULT_CURRENCY, { currency: false })).toBe('0.012 / pcs');
    expect(formatUnitPrice(-1200, PCS, DEFAULT_CURRENCY)).toBe('CHF -0.012 / pcs');
    expect(formatUnitPrice(1_234_567_891, PCS, DEFAULT_CURRENCY)).toBe('CHF 12’345.67891 / pcs');
    expect(formatUnitPrice(-45_000, PCS, DEFAULT_CURRENCY)).toBe('CHF -0.45 / pcs');
  });

  it('rounds a price that is no whole number for display and refuses what is no number', () => {
    expect(formatUnitPrice(6200.4, G, DEFAULT_CURRENCY)).toBe('CHF 62.00 / kg');
    expect(formatUnitPrice(44_999.6, PCS, DEFAULT_CURRENCY)).toBe('CHF 0.45 / pcs');
    expect(() => formatUnitPrice(Number.NaN, PCS, DEFAULT_CURRENCY)).toThrow(RangeError);
    expect(() => formatUnitPrice(Number.NaN, G, DEFAULT_CURRENCY)).toThrow(RangeError);
  });

  it('reads typed prices', () => {
    expect(parseUnitPrice('62', G, DEFAULT_CURRENCY)).toBe(6200);
    expect(parseUnitPrice('62.50', G, DEFAULT_CURRENCY)).toBe(6250);
    expect(parseUnitPrice('62.', G, DEFAULT_CURRENCY)).toBe(6200);
    expect(parseUnitPrice('.5', G, DEFAULT_CURRENCY)).toBe(50);
    expect(parseUnitPrice('CHF 6,40', ML, DEFAULT_CURRENCY)).toBe(640);
    expect(parseUnitPrice('0.45', PCS, DEFAULT_CURRENCY)).toBe(45_000);
    expect(parseUnitPrice('0.012', PCS, DEFAULT_CURRENCY)).toBe(1200);
    expect(parseUnitPrice('85', H, DEFAULT_CURRENCY)).toBe(8_500_000);
    expect(parseUnitPrice(' 1’234.50 ', G, DEFAULT_CURRENCY)).toBe(123_450);
    expect(parseUnitPrice('abc', G, DEFAULT_CURRENCY)).toBeNull();
    expect(parseUnitPrice('-5', G, DEFAULT_CURRENCY)).toBeNull();
    expect(parseUnitPrice('', G, DEFAULT_CURRENCY)).toBeNull();
    expect(parseUnitPrice('1,234.50', G, DEFAULT_CURRENCY)).toBeNull();
    expect(parseUnitPrice('.', G, DEFAULT_CURRENCY)).toBeNull();
  });

  it('rounds decimals a price cannot keep, halves away from zero and without float noise', () => {
    // 1.005 × 100 is 100.49999999999999 as a float; typed, it is exactly 100.5 Rappen.
    expect(parseUnitPrice('1.005', G, DEFAULT_CURRENCY)).toBe(101);
    expect(parseUnitPrice('62.555', G, DEFAULT_CURRENCY)).toBe(6256);
    expect(parseUnitPrice('62.554', G, DEFAULT_CURRENCY)).toBe(6255);
    expect(parseUnitPrice('0.0125', PCS, DEFAULT_CURRENCY)).toBe(1250);
    expect(parseUnitPrice('0.000015', PCS, DEFAULT_CURRENCY)).toBe(2);
    expect(parseUnitPrice('0.000014', PCS, DEFAULT_CURRENCY)).toBe(1);
  });

  it('refuses prices beyond the highest a person can mean', () => {
    expect(parseUnitPrice('1000000000', G, DEFAULT_CURRENCY)).toBe(100_000_000_000);
    expect(parseUnitPrice('1000000000.01', G, DEFAULT_CURRENCY)).toBeNull();
    expect(parseUnitPrice('1000000.01', H, DEFAULT_CURRENCY)).toBeNull();
    expect(parseUnitPrice('9'.repeat(40), G, DEFAULT_CURRENCY)).toBeNull();
  });

  it('follows the decimals of the currency', () => {
    const JPY = CurrencyCodeSchema.parse('JPY');
    expect(parseUnitPrice('1200', G, JPY)).toBe(1200);
    expect(formatUnitPrice(1200, G, JPY)).toBe('JPY 1’200 / kg');
    expect(parseUnitPrice('1.5', PCS, JPY)).toBe(1500);
    expect(formatUnitPrice(1500, PCS, JPY)).toBe('JPY 1.5 / pcs');
    expect(formatUnitPrice(2000, PCS, JPY)).toBe('JPY 2 / pcs');
  });

  it('names what a quantity and a price refer to', () => {
    expect(unitLabel(G)).toBe('g');
    expect(unitLabel(M2)).toBe('m²');
    expect(unitLabel(PIECES_DE)).toBe('Stk.');
    expect(priceUnitLabel(G)).toBe('kg');
    expect(priceUnitLabel(ML)).toBe('l');
    expect(priceUnitLabel(H)).toBe('h');
    expect(priceUnitLabel(PCS)).toBe('pcs');
  });
});

describe('percent', () => {
  it('formats shares', () => {
    expect(formatPercent(3000)).toBe('30 %');
    expect(formatPercent(810)).toBe('8.1 %');
    expect(formatPercent(3529)).toBe('35.3 %');
    expect(formatPercent(3529, { digits: 0 })).toBe('35 %');
    expect(formatPercent(3529, { digits: 2 })).toBe('35.29 %');
  });
});

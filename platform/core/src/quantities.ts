// Origin: BanioX/Randen packages/core/src/domain/units.ts @ e0f0907 — adapted: generalised over the unit register; exact whole-number arithmetic with one rounding; temperature, the decilitre style and the words of a language left out
import { formatMoney, minorDigits, type CurrencyCode } from './currency';
import {
  assertWholeAmount,
  divideRounded,
  fromThousandths,
  toSafeNumber,
  toThousandths,
  typedDecimal,
} from './exact';
import { formatDecimal, groupThousands } from './format';
import { rappen, type Rappen } from './money';
import { assertSameDimension, UnitError, unitFactor, type UnitDefinition } from './units';

/**
 * Quantities and unit prices (suite ADR-0009; ADR-0004 of the origin).
 *
 * A quantity is a number with at most three decimals in a registered unit. A unit price is
 * `pricePer1000`: Rappen per 1000 units of the unit the price is quoted in (per kg, per litre,
 * per 1000 pieces, per 1000 hours). So one calculation serves every unit: quantity × price is a
 * whole number of thousandths of a Rappen. Nobody divides by 1000 by hand.
 */

/** Rounds a quantity to the three decimals the model keeps; removes float noise after sums. */
export function roundQuantity(value: number): number {
  const rounded = Math.round(value * 1000) / 1000;
  return rounded === 0 ? 0 : rounded;
}

/** The unit as people write it after a number. */
export function unitLabel(unit: UnitDefinition): string {
  return unit.symbol;
}

/** What a unit price is quoted for: `kg` for grams, `l` for millilitres, else the unit itself. */
export function priceUnitLabel(unit: UnitDefinition): string {
  return unit.thousandSymbol ?? unit.symbol;
}

/**
 * A quantity as people write it: `750 g`, `2.5 kg`, `1.2 l`, `1.5 h`, `12.345 m²`. From 1000 on,
 * a unit with a name for its thousand switches to it. `digits` limits the decimals of the plain
 * form (default: all three a quantity can have).
 */
export function formatQuantity(
  quantity: number,
  unit: UnitDefinition,
  options: { digits?: number } = {},
): string {
  const value = roundQuantity(quantity);
  if (unit.thousandSymbol !== undefined && Math.abs(value) >= 1000) {
    // Three decimals of the thousand are whole units: round to them before dividing.
    const whole = Math.sign(value) * Math.round(Math.abs(value));
    return `${formatDecimal(whole / 1000, { digits: 3 })} ${unit.thousandSymbol}`;
  }
  return `${formatDecimal(value, { digits: options.digits ?? 3 })} ${unit.symbol}`;
}

/** How large a typed unit is, in the unit of the field: `numerator / denominator`. */
interface Ratio {
  readonly numerator: bigint;
  readonly denominator: bigint;
}

/** A typed unit compares without case, a closing dot and the difference between `m2` and `m²`. */
function typedName(text: string): string {
  return text.toLowerCase().replace(/\.+$/, '').replaceAll('²', '2').replaceAll('³', '3');
}

/** Every spelling a person may type for a quantity of `unit`; the first definition of a name wins. */
function typedUnits(unit: UnitDefinition, also: readonly UnitDefinition[]): Map<string, Ratio> {
  const names = new Map<string, Ratio>();
  const denominator = unitFactor(unit);
  for (const candidate of [unit, ...also]) {
    assertSameDimension(candidate, unit);
    const factor = unitFactor(candidate);
    const spellings: [string | undefined, bigint][] = [
      [candidate.id, factor],
      [candidate.symbol, factor],
      [candidate.thousandSymbol, 1000n * factor],
    ];
    for (const [spelling, numerator] of spellings) {
      if (spelling !== undefined && !names.has(typedName(spelling))) {
        names.set(typedName(spelling), { numerator, denominator });
      }
    }
  }
  return names;
}

/** A number with `.` or `,` as decimal mark, then an optional unit that starts with a letter. */
const TYPED_QUANTITY = /^(?:(\d+)(?:[.,](\d+))?|[.,](\d+))\s*(\p{L}[\p{L}\p{N}.]*)?$/u;

/** The largest quantity the model keeps (1_000_000_000), in thousandths. */
const MAX_QUANTITY_THOUSANDTHS = 1_000_000_000_000n;

export interface ParseQuantityOptions {
  /**
   * What a bare number means, as a person would type it: a field labelled «kg» passes `kg`.
   * Default: the unit of the field.
   */
  readonly fallback?: string;
  /**
   * Further units of the same dimension a person may type, e.g. `h` in a field of minutes, or the
   * spellings of a language as definitions that are used for reading only (`dl` with factor 100).
   */
  readonly also?: readonly UnitDefinition[];
}

/**
 * Reads a quantity typed by a person into the unit of the field: `2.5 kg`, `750`, `7,5 h`, `12 m2`.
 * A typed unit is the id, the symbol or the name of the thousand of the unit or of one in `also`.
 * What does not fit three decimals is rounded, halves away from zero («50 min» in hours is 0.833).
 * Returns null for anything that is not a non-negative amount of this unit. A wrong set-up of the
 * field (a fallback that is no spelling, a unit of another dimension in `also`) throws a
 * `UnitError`.
 */
export function parseQuantityInput(
  input: string,
  unit: UnitDefinition,
  options: ParseQuantityOptions = {},
): number | null {
  const names = typedUnits(unit, options.also ?? []);
  const fallback = names.get(typedName(options.fallback ?? unit.id));
  if (fallback === undefined) {
    throw new UnitError(
      'unknown_unit',
      `The fallback ${JSON.stringify(options.fallback)} is not a spelling of ${unit.id}`,
    );
  }
  const match = TYPED_QUANTITY.exec(input.trim().replace(/[’'\u2009\u202f]/g, ''));
  if (match === null) {
    return null;
  }
  const typed = typedDecimal(match[1] ?? '', match[2] ?? match[3] ?? '');
  const size = match[4] === undefined ? fallback : names.get(typedName(match[4]));
  if (typed === null || size === undefined) {
    return null;
  }
  const thousandths = divideRounded(
    typed.digits * 1000n * size.numerator,
    10n ** BigInt(typed.scale) * size.denominator,
  );
  return thousandths > MAX_QUANTITY_THOUSANDTHS ? null : fromThousandths(Number(thousandths));
}

/**
 * The two units of a priced line when they differ: minutes worked at a price per hour, metres at
 * a price per kilometre. Both must be of the same dimension.
 */
export interface PriceUnits {
  /** The unit the quantity is given in. */
  readonly quantityUnit: UnitDefinition;
  /** The unit the price is quoted in: `pricePer1000` is Rappen per 1000 of it. */
  readonly priceUnit: UnitDefinition;
}

const SAME_UNIT: Ratio = { numerator: 1n, denominator: 1n };

/** How many price units one quantity unit is, as an exact ratio of the two factors. */
function priceRatio(units: PriceUnits | undefined): Ratio {
  if (units === undefined) {
    return SAME_UNIT;
  }
  assertSameDimension(units.quantityUnit, units.priceUnit);
  return { numerator: unitFactor(units.quantityUnit), denominator: unitFactor(units.priceUnit) };
}

/**
 * quantity × price as an exact whole number, divided by `per` and rounded once: `per` 1000 gives
 * thousandths of a Rappen, 1_000_000 gives Rappen.
 */
function exactValue(
  quantity: number,
  pricePer1000: number,
  units: PriceUnits | undefined,
  per: bigint,
): bigint {
  const ratio = priceRatio(units);
  const product =
    BigInt(toThousandths(quantity)) *
    BigInt(assertWholeAmount(pricePer1000, 'pricePer1000')) *
    ratio.numerator;
  return divideRounded(product, per * ratio.denominator);
}

/**
 * The value of a quantity at a unit price, in thousandths of the smallest currency unit: for
 * sums over many lines that become Rappen only at the end (`milliToRappen`). Computed in whole
 * numbers and rounded once, halves away from zero. Without `units` the quantity is in the unit
 * the price is quoted in. Throws on a quantity with more than three decimals and on a price that
 * is not a whole number.
 */
export function valueMilli(quantity: number, pricePer1000: number, units?: PriceUnits): number {
  return toSafeNumber(exactValue(quantity, pricePer1000, units, 1000n), 'The value');
}

/** Thousandths back to the smallest currency unit, rounded half away from zero. */
export function milliToRappen(milli: number): Rappen {
  return rappen(Number(divideRounded(BigInt(assertWholeAmount(milli, 'milli')), 1000n)));
}

/**
 * The value of a quantity at a unit price, in the smallest currency unit: the amount of one line.
 * Converts through the factors of the two units and rounds once at the end, halves away from
 * zero: 90 `min` at 8_500_000 per 1000 `h` are exactly 12_750 Rappen, and 50 `min` have a value
 * although they are no round number of hours.
 */
export function lineValue(quantity: number, pricePer1000: number, units?: PriceUnits): Rappen {
  return rappen(toSafeNumber(exactValue(quantity, pricePer1000, units, 1_000_000n), 'The value'));
}

/**
 * The unit price that makes `quantity` cost `total`; 0 if there is no quantity. With `units` the
 * quantity is in `quantityUnit` and the result is quoted per 1000 `priceUnit`.
 */
export function unitPriceFromTotal(total: Rappen, quantity: number, units?: PriceUnits): Rappen {
  if (quantity <= 0) {
    return rappen(0);
  }
  const ratio = priceRatio(units);
  const price = divideRounded(
    BigInt(assertWholeAmount(total, 'total')) * 1_000_000n * ratio.denominator,
    BigInt(toThousandths(quantity)) * ratio.numerator,
  );
  return rappen(toSafeNumber(price, 'The unit price'));
}

/** A price with a fraction of the smallest currency unit, as a decimal number without noise. */
function fractionalAmount(price: number, decimals: number): string {
  const scale = 10 ** decimals;
  const absolute = Math.abs(price);
  const fraction = absolute % scale;
  const whole = (absolute - fraction) / scale;
  const fractionText = String(fraction).padStart(decimals, '0').replace(/0+$/, '');
  return `${price < 0 ? '-' : ''}${groupThousands(String(whole))}.${fractionText}`;
}

/**
 * A unit price as people read it: `CHF 62.00 / kg`, `CHF 2.40 / l`, `CHF 85.00 / h`. A price per
 * single unit that is no whole number of Rappen shows every decimal it has, so
 * `CHF 0.012 / pcs` stays true. A price that is not a whole number is rounded for display.
 */
export function formatUnitPrice(
  pricePer1000: number,
  unit: UnitDefinition,
  currency: CurrencyCode,
  options: { currency?: boolean } = {},
): string {
  const suffix = ` / ${priceUnitLabel(unit)}`;
  const price = rappen(Math.round(pricePer1000));
  if (unit.thousandSymbol !== undefined) {
    return `${formatMoney(price, currency, options)}${suffix}`;
  }
  if (price % 1000 === 0) {
    return `${formatMoney(rappen(price / 1000), currency, options)}${suffix}`;
  }
  const number = fractionalAmount(price, minorDigits(currency) + 3);
  const withSymbol = options.currency ?? true;
  return `${withSymbol ? `${currency} ` : ''}${number}${suffix}`;
}

/** The highest unit price a person can type: 100_000_000_000 per 1000 units. */
const MAX_TYPED_PRICE = 100_000_000_000n;

/**
 * Reads a unit price typed in the major currency unit («62», «62.50», «0.012») into
 * `pricePer1000`. The unit decides what the number refers to: its thousand where it has a name
 * (per kg, per litre), else a single unit (per hour, per piece). More decimals than the price
 * can keep are rounded, halves away from zero. Returns null for anything that is not a price.
 */
export function parseUnitPrice(
  input: string,
  unit: UnitDefinition,
  currency: CurrencyCode,
): Rappen | null {
  const text = input
    .trim()
    .replace(/^[A-Za-z€$]+\s*/, '')
    .replace(/[’'\u2009\u202f ]/g, '')
    .replace(',', '.');
  const match = /^(?:(\d+)(?:\.(\d*))?|\.(\d+))$/.exec(text);
  const typed = match === null ? null : typedDecimal(match[1] ?? '', match[2] ?? match[3] ?? '');
  if (typed === null) {
    return null;
  }
  const minor = typed.digits * 10n ** BigInt(minorDigits(currency));
  const per1000 = unit.thousandSymbol === undefined ? minor * 1000n : minor;
  const rounded = divideRounded(per1000, 10n ** BigInt(typed.scale));
  return rounded > MAX_TYPED_PRICE ? null : rappen(Number(rounded));
}

/** A share in basis points as text: 3000 → `30 %`, 810 → `8.1 %`. */
export function formatPercent(bps: number, options: { digits?: number } = {}): string {
  return `${formatDecimal(bps / 100, { digits: options.digits ?? 1 })} %`;
}

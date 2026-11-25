import { z } from 'zod';
import { fromThousandths, toSafeNumber, toThousandths } from './exact';

/**
 * The register of units. The platform knows the units every business needs (`PLATFORM_UNITS`);
 * an industry or a later platform package adds its own with `extend`. A register is a value, not
 * a closed enum: it is never changed after creation, `extend` returns a new one.
 *
 * Quantities are stored in a registered unit with at most three decimals. A unit price is always
 * Rappen per 1000 units of the unit it is quoted in (`quantities.ts`).
 */

/** Ids are lower case and start with a letter; units of an industry carry its prefix. */
export const UNIT_ID_PATTERN = /^[a-z][a-z0-9_]*$/;

/** Longest symbol a unit may have; symbols are written next to numbers in narrow columns. */
const MAX_SYMBOL_LENGTH = 12;

export interface UnitDefinition<TId extends string = string> {
  /** Stable id stored in rows, e.g. `h` or `moving_person_hour`. Never renamed. */
  readonly id: TId;
  /**
   * What the unit measures: `mass`, `volume`, `count`, `time`, `length`, `area`, `flat`, or a
   * dimension of an industry. Only units of the same dimension convert into each other.
   */
  readonly dimension: string;
  /**
   * How many smallest units of its dimension one unit is; a positive integer.
   * `min` 1 and `h` 60; `m` 1 and `km` 1000; `ml` 1 and `m3` 1_000_000.
   */
  readonly factor: number;
  /**
   * How the unit is written after a number, e.g. `m²`. For units without an international symbol
   * (`pcs`, `flat`) this is a neutral default; a language catalogue passes its own word by
   * spreading the definition: `{ ...unit, symbol }`.
   */
  readonly symbol: string;
  /**
   * The name of 1000 of this unit where people think in it: `kg` for `g`, `l` for `ml`. Large
   * quantities and unit prices are then written with it (`2.5 kg`, `CHF 62.00 / kg`). Without it
   * a price is shown for a single unit (`CHF 85.00 / h`).
   */
  readonly thousandSymbol?: string;
}

export type UnitErrorCode =
  'invalid_definition' | 'duplicate_unit' | 'unknown_unit' | 'dimension_mismatch' | 'not_exact';

/** Every error of the register carries a code, so callers never read the message. */
export class UnitError extends RangeError {
  readonly code: UnitErrorCode;

  constructor(code: UnitErrorCode, message: string) {
    super(message);
    this.name = 'UnitError';
    this.code = code;
  }
}

function invalid(id: string, problem: string): UnitError {
  return new UnitError('invalid_definition', `Unit ${JSON.stringify(id)}: ${problem}`);
}

function assertSymbol(id: string, field: string, symbol: string): void {
  if (symbol === '' || symbol !== symbol.trim() || symbol.length > MAX_SYMBOL_LENGTH) {
    throw invalid(
      id,
      `${field} must be 1 to ${MAX_SYMBOL_LENGTH} characters without surrounding spaces`,
    );
  }
}

/**
 * Checks a unit and returns a frozen copy. Throws a `UnitError` with code `invalid_definition`
 * and a message that names the unit and the field.
 */
export function defineUnit<const TId extends string>(
  definition: UnitDefinition<TId>,
): UnitDefinition<TId> {
  const { id, dimension, factor, symbol, thousandSymbol } = definition;
  if (!UNIT_ID_PATTERN.test(id)) {
    throw invalid(id, `the id must match ${String(UNIT_ID_PATTERN)}`);
  }
  if (!UNIT_ID_PATTERN.test(dimension)) {
    throw invalid(id, `the dimension must match ${String(UNIT_ID_PATTERN)}, got "${dimension}"`);
  }
  unitFactor(definition);
  assertSymbol(id, 'the symbol', symbol);
  if (thousandSymbol === undefined) {
    return Object.freeze({ id, dimension, factor, symbol });
  }
  assertSymbol(id, 'the thousandSymbol', thousandSymbol);
  return Object.freeze({ id, dimension, factor, symbol, thousandSymbol });
}

/**
 * The factor of a unit for exact arithmetic. A definition that was written by hand and never went
 * through `defineUnit` is checked here, so a wrong factor is an error and not a wrong amount.
 */
export function unitFactor(unit: UnitDefinition): bigint {
  if (!Number.isSafeInteger(unit.factor) || unit.factor <= 0) {
    throw invalid(unit.id, `the factor must be a positive integer, got ${String(unit.factor)}`);
  }
  return BigInt(unit.factor);
}

/** True if both units measure the same thing and so convert into each other. */
export function sameDimension(a: UnitDefinition, b: UnitDefinition): boolean {
  return a.dimension === b.dimension;
}

/** Throws a `UnitError` with code `dimension_mismatch` unless both units measure the same. */
export function assertSameDimension(a: UnitDefinition, b: UnitDefinition): void {
  if (!sameDimension(a, b)) {
    throw new UnitError(
      'dimension_mismatch',
      `Cannot convert between ${a.id} (${a.dimension}) and ${b.id} (${b.dimension})`,
    );
  }
}

/**
 * Converts a quantity into another unit of the same dimension, exactly: 90 `min` are 1.5 `h`.
 * Throws a `UnitError` with code `not_exact` if the result needs more than three decimals
 * (50 `min` in `h`); nothing is ever rounded silently. To put a price on such a quantity, pass
 * both units to `lineValue` instead of converting first.
 */
export function convertQuantity(
  quantity: number,
  from: UnitDefinition,
  to: UnitDefinition,
): number {
  assertSameDimension(from, to);
  const scaled = BigInt(toThousandths(quantity)) * unitFactor(from);
  const divisor = unitFactor(to);
  if (scaled % divisor !== 0n) {
    throw new UnitError(
      'not_exact',
      `${String(quantity)} ${from.id} cannot be written in ${to.id} with at most three decimals`,
    );
  }
  return fromThousandths(
    toSafeNumber(scaled / divisor, `${String(quantity)} ${from.id} in ${to.id}`),
  );
}

export interface UnitRegistry<TId extends string = string> {
  /** The ids in the order of registration. */
  readonly ids: readonly TId[];
  /** The definitions in the order of registration. */
  readonly units: readonly UnitDefinition<TId>[];
  /** Accepts exactly the registered ids; use it for the unit field of a row or an input. */
  readonly schema: z.ZodType<TId, TId>;
  has(id: string): id is TId;
  /** The definition of a unit; throws a `UnitError` with code `unknown_unit`. */
  get(id: TId): UnitDefinition<TId>;
  /** True if both units are registered and of the same dimension. */
  convertible(from: string, to: string): boolean;
  /** `convertQuantity` by id. */
  convert(quantity: number, from: TId, to: TId): number;
  /** A new register with further units; this one stays as it is. */
  extend<const TMore extends string>(
    more: readonly UnitDefinition<TMore>[],
  ): UnitRegistry<TId | TMore>;
}

/**
 * Builds a register from definitions. Every definition is checked as by `defineUnit`; an id that
 * occurs twice is a `UnitError` with code `duplicate_unit`. The result is frozen.
 */
export function createUnitRegistry<const TId extends string>(
  definitions: readonly UnitDefinition<TId>[],
): UnitRegistry<TId> {
  const byId = new Map<string, UnitDefinition<TId>>();
  for (const definition of definitions) {
    const unit = defineUnit(definition);
    if (byId.has(unit.id)) {
      throw new UnitError('duplicate_unit', `Unit "${unit.id}" is registered twice`);
    }
    byId.set(unit.id, unit);
  }
  const units = Object.freeze([...byId.values()]);
  const ids = Object.freeze(units.map((unit) => unit.id));

  const has = (id: string): id is TId => byId.has(id);
  const get = (id: TId): UnitDefinition<TId> => {
    const unit = byId.get(id);
    if (unit === undefined) {
      throw new UnitError(
        'unknown_unit',
        `Unknown unit ${JSON.stringify(id)}; registered: ${ids.join(', ')}`,
      );
    }
    return unit;
  };

  return Object.freeze({
    ids,
    units,
    schema: z.enum(ids),
    has,
    get,
    convertible: (from: string, to: string) => {
      const source = byId.get(from);
      const target = byId.get(to);
      return source !== undefined && target !== undefined && sameDimension(source, target);
    },
    convert: (quantity: number, from: TId, to: TId) =>
      convertQuantity(quantity, get(from), get(to)),
    extend: <const TMore extends string>(more: readonly UnitDefinition<TMore>[]) =>
      createUnitRegistry<TId | TMore>([...units, ...more]),
  });
}

/**
 * The units of the platform. Mass and volume keep their smallest unit and write large amounts as
 * `kg` and `l`; time, length, area and count are quoted per single unit. `flat` is a lump sum:
 * quantity 1 at the price of the whole.
 */
export const PLATFORM_UNITS = createUnitRegistry([
  { id: 'g', dimension: 'mass', factor: 1, symbol: 'g', thousandSymbol: 'kg' },
  { id: 'ml', dimension: 'volume', factor: 1, symbol: 'ml', thousandSymbol: 'l' },
  { id: 'pcs', dimension: 'count', factor: 1, symbol: 'pcs' },
  { id: 'h', dimension: 'time', factor: 60, symbol: 'h' },
  { id: 'min', dimension: 'time', factor: 1, symbol: 'min' },
  { id: 'm', dimension: 'length', factor: 1, symbol: 'm' },
  { id: 'm2', dimension: 'area', factor: 1, symbol: 'm²' },
  { id: 'm3', dimension: 'volume', factor: 1_000_000, symbol: 'm³' },
  { id: 'km', dimension: 'length', factor: 1000, symbol: 'km' },
  { id: 'flat', dimension: 'flat', factor: 1, symbol: 'flat' },
]);

/** The id of a unit of the platform: `'g' | 'ml' | 'pcs' | 'h' | 'min' | 'm' | 'm2' | 'm3' | 'km' | 'flat'`. */
export type PlatformUnitId = (typeof PLATFORM_UNITS.ids)[number];

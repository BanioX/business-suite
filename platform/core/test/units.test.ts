import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import {
  assertSameDimension,
  convertQuantity,
  createUnitRegistry,
  defineUnit,
  PLATFORM_UNITS,
  sameDimension,
  UNIT_ID_PATTERN,
  UnitError,
  unitFactor,
  type PlatformUnitId,
  type UnitDefinition,
  type UnitErrorCode,
  type UnitRegistry,
} from '../src';

/** The error an action throws, or undefined if it throws nothing. */
function errorOf(action: () => unknown): unknown {
  try {
    action();
  } catch (error) {
    return error;
  }
  return undefined;
}

function expectUnitError(action: () => unknown, code: UnitErrorCode, message: RegExp): void {
  const error = errorOf(action);
  expect(error).toBeInstanceOf(UnitError);
  expect(error).toBeInstanceOf(RangeError);
  expect((error as UnitError).name).toBe('UnitError');
  expect((error as UnitError).code).toBe(code);
  expect((error as UnitError).message).toMatch(message);
}

const TONNE = { id: 't', dimension: 'mass', factor: 1_000_000, symbol: 't' } as const;
/** A unit of an industry: its own prefix, its own dimension. */
const PERSON_HOUR = {
  id: 'moving_person_hour',
  dimension: 'moving_person_time',
  factor: 1,
  symbol: 'ph',
} as const;

describe('PLATFORM_UNITS', () => {
  it('knows the units of the platform and nothing else', () => {
    expect(PLATFORM_UNITS.ids).toEqual([
      'g',
      'ml',
      'pcs',
      'h',
      'min',
      'm',
      'm2',
      'm3',
      'km',
      'flat',
    ]);
    expect(PLATFORM_UNITS.units.map((unit) => unit.id)).toEqual(PLATFORM_UNITS.ids);
  });

  it('counts every dimension in its smallest unit', () => {
    const table = PLATFORM_UNITS.units.map((unit) => [unit.id, unit.dimension, unit.factor]);
    expect(table).toEqual([
      ['g', 'mass', 1],
      ['ml', 'volume', 1],
      ['pcs', 'count', 1],
      ['h', 'time', 60],
      ['min', 'time', 1],
      ['m', 'length', 1],
      ['m2', 'area', 1],
      ['m3', 'volume', 1_000_000],
      ['km', 'length', 1000],
      ['flat', 'flat', 1],
    ]);
  });

  it('writes the symbols people know and names the thousand of grams and millilitres', () => {
    const symbols = Object.fromEntries(
      PLATFORM_UNITS.units.map((unit) => [unit.id, [unit.symbol, unit.thousandSymbol]]),
    );
    expect(symbols).toEqual({
      g: ['g', 'kg'],
      ml: ['ml', 'l'],
      m3: ['m³', undefined],
      pcs: ['pcs', undefined],
      min: ['min', undefined],
      h: ['h', undefined],
      m: ['m', undefined],
      km: ['km', undefined],
      m2: ['m²', undefined],
      flat: ['flat', undefined],
    });
  });

  it('has a schema that accepts exactly the registered ids', () => {
    for (const id of PLATFORM_UNITS.ids) {
      expect(PLATFORM_UNITS.schema.parse(id)).toBe(id);
    }
    for (const other of ['kg', 'l', 'G', '', ' h', 'h ', 'hour', 1, null, undefined]) {
      expect(PLATFORM_UNITS.schema.safeParse(other).success).toBe(false);
    }
  });

  it('describes the schema as a list of ids for the contract', () => {
    expect(z.toJSONSchema(PLATFORM_UNITS.schema)).toMatchObject({
      type: 'string',
      enum: [...PLATFORM_UNITS.ids],
    });
  });

  it('is typed by its ids', () => {
    expectTypeOf<PlatformUnitId>().toEqualTypeOf<
      'g' | 'ml' | 'pcs' | 'h' | 'min' | 'm' | 'm2' | 'm3' | 'km' | 'flat'
    >();
    expectTypeOf<z.infer<typeof PLATFORM_UNITS.schema>>().toEqualTypeOf<PlatformUnitId>();
    expectTypeOf<z.input<typeof PLATFORM_UNITS.schema>>().toEqualTypeOf<PlatformUnitId>();
    expectTypeOf(PLATFORM_UNITS.get('h')).toEqualTypeOf<UnitDefinition<PlatformUnitId>>();
    expectTypeOf(PLATFORM_UNITS).toExtend<UnitRegistry>();
    // @ts-expect-error -- a kilogram is a way of writing grams, not a unit of the register
    expect(() => PLATFORM_UNITS.get('kg')).toThrow(UnitError);
  });
});

describe('defineUnit', () => {
  it('returns a frozen copy with exactly the fields of a unit', () => {
    const source = { id: 't', dimension: 'mass', factor: 1_000_000, symbol: 't', note: 'extra' };
    const unit = defineUnit(source);
    expect(unit).toEqual({ id: 't', dimension: 'mass', factor: 1_000_000, symbol: 't' });
    expect(unit).not.toBe(source);
    expect(Object.isFrozen(unit)).toBe(true);
    expect('thousandSymbol' in unit).toBe(false);

    const withThousand = defineUnit({ ...source, id: 'mg', factor: 1, thousandSymbol: 'g' });
    expect(withThousand.thousandSymbol).toBe('g');
    expect(Object.isFrozen(withThousand)).toBe(true);
  });

  it('keeps the literal type of the id', () => {
    expectTypeOf(defineUnit(TONNE)).toEqualTypeOf<UnitDefinition<'t'>>();
  });

  it.each(['', 'T', 'Kg', '1h', 'person-hour', 'person hour', 'm²', '_h', 'h.'])(
    'refuses the id %j',
    (id) => {
      expect(UNIT_ID_PATTERN.test(id)).toBe(false);
      expectUnitError(
        () => defineUnit({ ...TONNE, id }),
        'invalid_definition',
        /the id must match/,
      );
    },
  );

  it.each(['', 'Mass', 'person time', '2d'])('refuses the dimension %j', (dimension) => {
    expectUnitError(
      () => defineUnit({ ...TONNE, dimension }),
      'invalid_definition',
      /^Unit "t": the dimension must match/,
    );
  });

  it.each([0, -1, 1.5, 0.001, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53])(
    'refuses the factor %d',
    (factor) => {
      expectUnitError(
        () => defineUnit({ ...TONNE, factor }),
        'invalid_definition',
        /^Unit "t": the factor must be a positive integer/,
      );
    },
  );

  it.each(['', ' t', 't ', '   ', 'thirteen chars'])('refuses the symbol %j', (symbol) => {
    expectUnitError(
      () => defineUnit({ ...TONNE, symbol }),
      'invalid_definition',
      /^Unit "t": the symbol must be 1 to 12 characters/,
    );
    expectUnitError(
      () => defineUnit({ ...TONNE, thousandSymbol: symbol }),
      'invalid_definition',
      /^Unit "t": the thousandSymbol must be 1 to 12 characters/,
    );
  });

  it('accepts a symbol of twelve characters', () => {
    expect(defineUnit({ ...TONNE, symbol: 'twelve chars' }).symbol).toBe('twelve chars');
  });
});

describe('createUnitRegistry', () => {
  it('registers definitions in their order and finds them by id', () => {
    const registry = createUnitRegistry([TONNE, PERSON_HOUR]);
    expect(registry.ids).toEqual(['t', 'moving_person_hour']);
    expect(registry.get('t')).toEqual(TONNE);
    expect(registry.has('t')).toBe(true);
    expect(registry.has('g')).toBe(false);
    expect(registry.schema.safeParse('moving_person_hour').success).toBe(true);
    expect(registry.schema.safeParse('g').success).toBe(false);
    expectTypeOf(registry.ids).toEqualTypeOf<readonly ('t' | 'moving_person_hour')[]>();
  });

  it('narrows a plain string with has', () => {
    const typed = ['h', 'kg'].join('').slice(0, 1);
    if (PLATFORM_UNITS.has(typed)) {
      expectTypeOf(typed).toEqualTypeOf<PlatformUnitId>();
      expect(PLATFORM_UNITS.get(typed).factor).toBe(60);
    } else {
      expect.unreachable('h is a unit of the platform');
    }
  });

  it('refuses an id that occurs twice', () => {
    expectUnitError(
      () => createUnitRegistry([TONNE, PERSON_HOUR, { ...TONNE, symbol: 'to' }]),
      'duplicate_unit',
      /^Unit "t" is registered twice$/,
    );
  });

  it('checks every definition', () => {
    expectUnitError(
      () => createUnitRegistry([TONNE, { ...PERSON_HOUR, factor: 0 }]),
      'invalid_definition',
      /^Unit "moving_person_hour": the factor/,
    );
  });

  it('names the unknown unit and the registered ones', () => {
    const registry: UnitRegistry = createUnitRegistry([TONNE, PERSON_HOUR]);
    expectUnitError(
      () => registry.get('kg'),
      'unknown_unit',
      /^Unknown unit "kg"; registered: t, moving_person_hour$/,
    );
  });

  it('may be empty: then no unit is valid', () => {
    const registry = createUnitRegistry([]);
    expect(registry.ids).toEqual([]);
    expect(registry.schema.safeParse('g').success).toBe(false);
    expect(registry.has('g')).toBe(false);
  });

  it('cannot be changed after creation', () => {
    const definitions: UnitDefinition[] = [{ ...TONNE }];
    const registry = createUnitRegistry(definitions);

    // Changing what was passed in changes nothing.
    definitions.push({ ...PERSON_HOUR });
    (definitions[0] as { factor: number }).factor = 7;
    expect(registry.ids).toEqual(['t']);
    expect(registry.get('t').factor).toBe(1_000_000);

    expect(Object.isFrozen(registry)).toBe(true);
    expect(Object.isFrozen(registry.ids)).toBe(true);
    expect(Object.isFrozen(registry.units)).toBe(true);
    expect(registry.units.every((unit) => Object.isFrozen(unit))).toBe(true);
    expect(() => {
      (registry.ids as string[]).push('x');
    }).toThrow(TypeError);
    expect(() => {
      (registry.get('t') as { factor: number }).factor = 1;
    }).toThrow(TypeError);
    expect(() => {
      (registry as { get: unknown }).get = () => TONNE;
    }).toThrow(TypeError);
    expect(Object.isFrozen(PLATFORM_UNITS)).toBe(true);
  });
});

describe('extend', () => {
  it('returns a new register and leaves the old one as it is', () => {
    const extended = PLATFORM_UNITS.extend([TONNE, PERSON_HOUR]);
    expect(extended.ids).toEqual([...PLATFORM_UNITS.ids, 't', 'moving_person_hour']);
    expect(extended.has('t')).toBe(true);
    expect(extended.schema.parse('moving_person_hour')).toBe('moving_person_hour');
    expect(extended.convert(1.5, 't', 'g')).toBe(1_500_000);
    expect(extended.convert(2_500_000, 'g', 't')).toBe(2.5);
    expect(Object.isFrozen(extended)).toBe(true);

    expect(extended).not.toBe(PLATFORM_UNITS);
    expect(PLATFORM_UNITS.has('t')).toBe(false);
    expect(PLATFORM_UNITS.ids).toHaveLength(10);
    expect(PLATFORM_UNITS.schema.safeParse('t').success).toBe(false);

    expectTypeOf(extended.ids).toEqualTypeOf<
      readonly (PlatformUnitId | 't' | 'moving_person_hour')[]
    >();
  });

  it('can be extended again', () => {
    const twice = PLATFORM_UNITS.extend([TONNE]).extend([PERSON_HOUR]);
    expect(twice.ids).toEqual([...PLATFORM_UNITS.ids, 't', 'moving_person_hour']);
  });

  it('refuses a unit that exists already and a broken one', () => {
    expectUnitError(
      () => PLATFORM_UNITS.extend([{ ...TONNE, id: 'h' }]),
      'duplicate_unit',
      /^Unit "h" is registered twice$/,
    );
    expectUnitError(
      () => PLATFORM_UNITS.extend([{ ...TONNE, factor: 1.5 }]),
      'invalid_definition',
      /the factor/,
    );
  });
});

describe('convert', () => {
  it('converts exactly inside a dimension', () => {
    expect(PLATFORM_UNITS.convert(90, 'min', 'h')).toBe(1.5);
    expect(PLATFORM_UNITS.convert(1.5, 'h', 'min')).toBe(90);
    expect(PLATFORM_UNITS.convert(0.25, 'h', 'min')).toBe(15);
    expect(PLATFORM_UNITS.convert(2, 'km', 'm')).toBe(2000);
    expect(PLATFORM_UNITS.convert(250, 'm', 'km')).toBe(0.25);
    expect(PLATFORM_UNITS.convert(1, 'm3', 'ml')).toBe(1_000_000);
    expect(PLATFORM_UNITS.convert(2000, 'ml', 'm3')).toBe(0.002);
    expect(PLATFORM_UNITS.convert(12.345, 'm2', 'm2')).toBe(12.345);
    expect(PLATFORM_UNITS.convert(0.06, 'min', 'h')).toBe(0.001);
    expect(PLATFORM_UNITS.convert(0, 'min', 'h')).toBe(0);
  });

  it('keeps the sign, takes float noise away and never returns minus zero', () => {
    expect(PLATFORM_UNITS.convert(-90, 'min', 'h')).toBe(-1.5);
    expect(PLATFORM_UNITS.convert(0.1 + 0.2, 'h', 'min')).toBe(18);
    expect(PLATFORM_UNITS.convert(0.1 + 0.2, 'h', 'h')).toBe(0.3);
    expect(Object.is(PLATFORM_UNITS.convert(-0, 'min', 'h'), 0)).toBe(true);
    expect(Object.is(PLATFORM_UNITS.convert(-0.0000000001, 'h', 'min'), 0)).toBe(true);
  });

  it('fails instead of rounding when the result needs more than three decimals', () => {
    expectUnitError(
      () => PLATFORM_UNITS.convert(50, 'min', 'h'),
      'not_exact',
      /^50 min cannot be written in h with at most three decimals$/,
    );
    expectUnitError(() => PLATFORM_UNITS.convert(2500, 'ml', 'm3'), 'not_exact', /2500 ml/);
    expectUnitError(() => PLATFORM_UNITS.convert(0.5, 'm', 'km'), 'not_exact', /0\.5 m/);
  });

  it('refuses to convert across dimensions', () => {
    expectUnitError(
      () => PLATFORM_UNITS.convert(1, 'h', 'm'),
      'dimension_mismatch',
      /^Cannot convert between h \(time\) and m \(length\)$/,
    );
    expectUnitError(() => PLATFORM_UNITS.convert(1, 'pcs', 'flat'), 'dimension_mismatch', /flat/);
    expectUnitError(() => PLATFORM_UNITS.convert(1, 'g', 'ml'), 'dimension_mismatch', /volume/);
  });

  it('refuses an unknown unit', () => {
    const registry: UnitRegistry = PLATFORM_UNITS;
    expectUnitError(() => registry.convert(1, 'kg', 'g'), 'unknown_unit', /"kg"/);
    expectUnitError(() => registry.convert(1, 'g', 'kg'), 'unknown_unit', /"kg"/);
  });

  it('refuses what is not a quantity', () => {
    for (const quantity of [1.0005, Number.NaN, Number.POSITIVE_INFINITY, 1e16]) {
      const error = errorOf(() => PLATFORM_UNITS.convert(quantity, 'h', 'min'));
      expect(error).toBeInstanceOf(RangeError);
      expect(error).not.toBeInstanceOf(UnitError);
    }
  });

  it('fails instead of leaving the range where numbers are exact', () => {
    const error = errorOf(() => PLATFORM_UNITS.convert(9_000_000_000_000, 'm3', 'ml'));
    expect(error).toBeInstanceOf(RangeError);
    expect((error as RangeError).message).toMatch(/exceeds the safe integer range/);
  });

  it('says which units convert into each other', () => {
    expect(PLATFORM_UNITS.convertible('min', 'h')).toBe(true);
    expect(PLATFORM_UNITS.convertible('h', 'h')).toBe(true);
    expect(PLATFORM_UNITS.convertible('ml', 'm3')).toBe(true);
    expect(PLATFORM_UNITS.convertible('min', 'm')).toBe(false);
    expect(PLATFORM_UNITS.convertible('pcs', 'flat')).toBe(false);
    expect(PLATFORM_UNITS.convertible('kg', 'g')).toBe(false);
    expect(PLATFORM_UNITS.convertible('g', 'kg')).toBe(false);
  });
});

describe('definitions without a register', () => {
  const H = PLATFORM_UNITS.get('h');
  const MIN = PLATFORM_UNITS.get('min');
  const M = PLATFORM_UNITS.get('m');

  it('converts between two definitions', () => {
    expect(convertQuantity(3, H, MIN)).toBe(180);
    expect(convertQuantity(45, MIN, H)).toBe(0.75);
    expect(sameDimension(H, MIN)).toBe(true);
    expect(sameDimension(H, M)).toBe(false);
    expect(() => {
      assertSameDimension(H, MIN);
    }).not.toThrow();
    expectUnitError(
      () => {
        assertSameDimension(H, M);
      },
      'dimension_mismatch',
      /time.*length/,
    );
  });

  it('checks the factor of a definition that never went through defineUnit', () => {
    expect(unitFactor(H)).toBe(60n);
    const broken: UnitDefinition = { id: 'broken', dimension: 'time', factor: -60, symbol: 'b' };
    expectUnitError(() => unitFactor(broken), 'invalid_definition', /^Unit "broken": the factor/);
    expectUnitError(() => convertQuantity(1, broken, MIN), 'invalid_definition', /broken/);
    expectUnitError(() => convertQuantity(1, MIN, broken), 'invalid_definition', /broken/);
  });
});

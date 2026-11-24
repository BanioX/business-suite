import fc from 'fast-check';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import {
  BpsSchema,
  CountryCodeSchema,
  GtinSchema,
  IsoDateTimeSchema,
  isValidGtin,
  LocalDateSchema,
  nameSchema,
  PositiveQuantitySchema,
  QuantityDeltaSchema,
  QuantitySchema,
  syncFields,
  textSchema,
  uuidV7,
  WEEKDAYS,
  WeekdaySchema,
  YearMonthSchema,
  type Id,
  type IsoDateTime,
  type LocalDate,
} from '../src';

const accepts = (schema: z.ZodType, value: unknown) => schema.safeParse(value).success;

describe('calendar days, instants and months', () => {
  it('accepts real calendar days only', () => {
    expect(LocalDateSchema.parse('2026-11-24')).toBe('2026-11-24');
    expect(accepts(LocalDateSchema, '2028-02-29')).toBe(true);
    for (const value of [
      '2026-02-30',
      '2026-2-3',
      '24.11.2026',
      '2026-11-24T10:00:00Z',
      '',
      20261124,
    ]) {
      expect(accepts(LocalDateSchema, value)).toBe(false);
    }
  });

  it('accepts instants in UTC only', () => {
    expect(IsoDateTimeSchema.parse('2026-11-24T15:00:00.000Z')).toBe('2026-11-24T15:00:00.000Z');
    expect(accepts(IsoDateTimeSchema, '2026-11-24T15:00:00Z')).toBe(true);
    for (const value of ['2026-11-24T15:00:00+01:00', '2026-11-24T15:00:00', '2026-11-24', 'now']) {
      expect(accepts(IsoDateTimeSchema, value)).toBe(false);
    }
  });

  it('accepts months as YYYY-MM', () => {
    expect(YearMonthSchema.parse('2026-11')).toBe('2026-11');
    expect(accepts(YearMonthSchema, '2026-01')).toBe(true);
    for (const value of ['2026-13', '2026-00', '2026-1', '26-11', '2026-11-01', '']) {
      expect(accepts(YearMonthSchema, value)).toBe(false);
    }
  });

  it('brands the values, so a plain string is not a date by accident', () => {
    expectTypeOf<LocalDate>().toExtend<string>();
    expectTypeOf<string>().not.toExtend<LocalDate>();
    expectTypeOf<LocalDate>().not.toExtend<IsoDateTime>();
  });
});

describe('quantities', () => {
  it('accepts up to three decimals from zero to a thousand millions', () => {
    for (const value of [0, 1, 2.5, 0.001, 12.345, 1_000_000_000]) {
      expect(QuantitySchema.parse(value)).toBe(value);
    }
  });

  it('refuses a fourth decimal, negative amounts, too much and what is no number', () => {
    for (const value of [0.0001, 1.0005, -1, -0.001, 1_000_000_000.001, 1e12, Number.NaN, '1']) {
      expect(accepts(QuantitySchema, value)).toBe(false);
    }
  });

  it('stores sums without float noise', () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(QuantitySchema.parse(0.1 + 0.2)).toBe(0.3);
    expect(QuantityDeltaSchema.parse(-(0.1 + 0.2))).toBe(-0.3);
  });

  it('accepts large quantities with decimals', () => {
    // Both failed a check that multiplied by 1000 first: the product is itself a rounded float.
    expect(QuantitySchema.parse(544_525_079.379)).toBe(544_525_079.379);
    expect(QuantitySchema.parse(67_596_824.849)).toBe(67_596_824.849);
    expect(QuantityDeltaSchema.parse(-999_999_999.999)).toBe(-999_999_999.999);
  });

  it('accepts every quantity of the model and stores it unchanged', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000_000_000 }), (thousandths) => {
        const quantity = thousandths / 1000;
        expect(QuantitySchema.parse(quantity)).toBe(quantity);
        expect(QuantityDeltaSchema.parse(-quantity)).toBe(quantity === 0 ? -0 : -quantity);
      }),
    );
  });

  it('wants more than nothing where a quantity must be positive', () => {
    expect(PositiveQuantitySchema.parse(0.001)).toBe(0.001);
    expect(accepts(PositiveQuantitySchema, 0)).toBe(false);
    // Float noise beside zero is stored as zero, and zero is not positive.
    expect(QuantitySchema.parse(0.0000004)).toBe(0);
    expect(accepts(PositiveQuantitySchema, 0.0000004)).toBe(false);
    expect(accepts(PositiveQuantitySchema, -1)).toBe(false);
    expect(accepts(PositiveQuantitySchema, 0.0001)).toBe(false);
  });

  it('allows a signed change within the same limits', () => {
    expect(QuantityDeltaSchema.parse(-2.5)).toBe(-2.5);
    expect(QuantityDeltaSchema.parse(1_000_000_000)).toBe(1_000_000_000);
    expect(QuantityDeltaSchema.parse(-1_000_000_000)).toBe(-1_000_000_000);
    for (const value of [-1.0005, 1_000_000_001, -1_000_000_001, Number.POSITIVE_INFINITY]) {
      expect(accepts(QuantityDeltaSchema, value)).toBe(false);
    }
  });
});

describe('shares, countries and weekdays', () => {
  it('keeps shares as whole basis points from 0 to 100 %', () => {
    expect(BpsSchema.parse(0)).toBe(0);
    expect(BpsSchema.parse(810)).toBe(810);
    expect(BpsSchema.parse(10_000)).toBe(10_000);
    for (const value of [-1, 10_001, 8.1, '810']) {
      expect(accepts(BpsSchema, value)).toBe(false);
    }
  });

  it('accepts two capital letters as a country', () => {
    expect(CountryCodeSchema.parse('CH')).toBe('CH');
    for (const value of ['ch', 'CHE', 'C', '', 'C1']) {
      expect(accepts(CountryCodeSchema, value)).toBe(false);
    }
  });

  it('starts the week on Monday', () => {
    expect(WEEKDAYS).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
    expect(WeekdaySchema.parse('sun')).toBe('sun');
    expect(accepts(WeekdaySchema, 'Mon')).toBe(false);
  });
});

describe('typed text', () => {
  it('trims names and refuses empty ones', () => {
    expect(nameSchema().parse('  Betrieb Muster ')).toBe('Betrieb Muster');
    expect(accepts(nameSchema(), '')).toBe(false);
    expect(accepts(nameSchema(), '   ')).toBe(false);
    expect(accepts(nameSchema(), 'a'.repeat(120))).toBe(true);
    expect(accepts(nameSchema(), 'a'.repeat(121))).toBe(false);
    expect(accepts(nameSchema(5), 'abcdef')).toBe(false);
    expect(accepts(nameSchema(), 5)).toBe(false);
  });

  it('allows longer free text up to its limit', () => {
    expect(textSchema().parse(' note \n')).toBe('note');
    expect(accepts(textSchema(), 'a'.repeat(2000))).toBe(true);
    expect(accepts(textSchema(), 'a'.repeat(2001))).toBe(false);
    expect(accepts(textSchema(10), 'a'.repeat(11))).toBe(false);
    expect(accepts(textSchema(), '  ')).toBe(false);
  });
});

describe('GTIN', () => {
  /** The check digit as the standard defines it, written independently of the code under test. */
  const checkDigit = (body: string): number => {
    let sum = 0;
    for (let index = 0; index < body.length; index += 1) {
      const fromRight = body.length - index;
      sum += Number(body[index]) * (fromRight % 2 === 1 ? 3 : 1);
    }
    return (10 - (sum % 10)) % 10;
  };
  const digits = (length: number) =>
    fc.array(fc.integer({ min: 0, max: 9 }), { minLength: length, maxLength: length });

  it('accepts made-up numbers with the right check digit', () => {
    // Made-up bodies; the last digit is computed.
    expect(isValidGtin('00000000')).toBe(true);
    expect(isValidGtin('12345670')).toBe(true);
    expect(isValidGtin('7600000000012')).toBe(true);
    expect(GtinSchema.parse('12345670')).toBe('12345670');
  });

  it('refuses a wrong check digit, wrong lengths and other characters', () => {
    expect(isValidGtin('12345671')).toBe(false);
    expect(isValidGtin('7600000000013')).toBe(false);
    for (const value of [
      '',
      '1234567',
      '123456789',
      '1234567890',
      '12345678901',
      '123456789012345',
    ]) {
      expect(isValidGtin(value)).toBe(false);
    }
    expect(isValidGtin('1234567a')).toBe(false);
    expect(isValidGtin(' 12345670')).toBe(false);
    expect(accepts(GtinSchema, '12345671')).toBe(false);
    expect(accepts(GtinSchema, 12345670)).toBe(false);
  });

  it('accepts exactly one check digit for every body of 7, 11, 12 and 13 digits', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(7, 11, 12, 13).chain((length) => digits(length)),
        fc.integer({ min: 0, max: 9 }),
        (bodyDigits, last) => {
          const body = bodyDigits.join('');
          expect(isValidGtin(`${body}${last}`)).toBe(last === checkDigit(body));
        },
      ),
    );
  });
});

describe('syncFields', () => {
  const id = (byte: number): Id => uuidV7(1_795_000_000_000, new Uint8Array(10).fill(byte));
  const RowSchema = z.object({ ...syncFields, name: nameSchema() });
  const row = {
    id: id(1),
    businessId: id(2),
    createdAt: '2026-11-24T10:00:00.000Z',
    updatedAt: '2026-11-24T10:00:00.000Z',
    name: 'Betrieb Muster',
  };

  it('gives every row an id, a business and its times', () => {
    expect(RowSchema.parse(row)).toEqual(row);
    expect(RowSchema.parse({ ...row, deletedAt: '2026-11-25T08:00:00.000Z' }).deletedAt).toBe(
      '2026-11-25T08:00:00.000Z',
    );
  });

  it.each(['id', 'businessId', 'createdAt', 'updatedAt'] as const)('requires %s', (field) => {
    const rest = Object.fromEntries(Object.entries(row).filter(([key]) => key !== field));
    expect(accepts(RowSchema, rest)).toBe(false);
  });

  it('refuses an id that is no UUIDv7 and a local time', () => {
    expect(accepts(RowSchema, { ...row, businessId: 'betrieb-muster' })).toBe(false);
    expect(accepts(RowSchema, { ...row, deletedAt: '2026-11-25 08:00' })).toBe(false);
  });
});

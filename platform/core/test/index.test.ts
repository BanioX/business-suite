import { describe, expect, it } from 'vitest';
import * as core from '../src';

/**
 * The public surface, name by name. The packages above build on it, and the edition the files
 * were harvested from switches to it without renaming: a name that disappears or appears here is
 * a decision, not an accident. Types are not listed; `tsc` guards them where they are used.
 */
describe('@onestrand/core', () => {
  it('exports exactly these values', () => {
    expect(Object.keys(core).sort()).toEqual([
      'BpsSchema',
      'CountryCodeSchema',
      'CurrencyCodeSchema',
      'DEFAULT_CURRENCY',
      'GtinSchema',
      'HOME_TIME_ZONE',
      'IdSchema',
      'IsoDateTimeSchema',
      'LocalDateSchema',
      'PLATFORM_UNITS',
      'PositiveQuantitySchema',
      'QuantityDeltaSchema',
      'QuantitySchema',
      'RappenSchema',
      'UNIT_ID_PATTERN',
      'UUID_V7_PATTERN',
      'UnitError',
      'WEEKDAYS',
      'WeekdaySchema',
      'YearMonthSchema',
      'ZERO_RAPPEN',
      'addDays',
      'addMonths',
      'addYears',
      'allocate',
      'assertSameDimension',
      'convertQuantity',
      'createIdGenerator',
      'createUnitRegistry',
      'currencySymbol',
      'daysBetween',
      'defineUnit',
      'formatChf',
      'formatDecimal',
      'formatMoney',
      'formatPercent',
      'formatQuantity',
      'formatSwissDate',
      'formatUnitPrice',
      'groupThousands',
      'isUuidV7',
      'isValidGtin',
      'lineValue',
      'localDate',
      'milliToRappen',
      'minLocalDate',
      'minorDigits',
      'nameSchema',
      'parseChf',
      'parseDateInput',
      'parseMoney',
      'parseQuantityInput',
      'parseUnitPrice',
      'priceUnitLabel',
      'rappen',
      'roundQuantity',
      'sameDimension',
      'splitEvenly',
      'sumRappen',
      'syncFields',
      'textSchema',
      'toLocalDate',
      'unitFactor',
      'unitLabel',
      'unitPriceFromTotal',
      'uuidV7',
      'uuidV7Timestamp',
      'valueMilli',
    ]);
  });

  it('keeps what stays with one industry out: temperature, date kinds, photos as text', () => {
    const names = Object.keys(core);
    for (const left of [
      'UnitSchema',
      'UNITS',
      'DeciCelsiusSchema',
      'DateKindSchema',
      'PhotoSchema',
      'formatTemperature',
      'parseTemperature',
    ]) {
      expect(names).not.toContain(left);
    }
  });

  it('keeps the helpers of the exact arithmetic to itself', () => {
    const names = Object.keys(core);
    for (const internal of ['divideRounded', 'toThousandths', 'hasAtMostThreeDecimals']) {
      expect(names).not.toContain(internal);
    }
  });
});

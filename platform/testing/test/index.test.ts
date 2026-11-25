import { describe, expect, it } from 'vitest';
import * as testing from '../src';

/**
 * The public surface, name by name. Every package, industry and edition tests with it: a name
 * that disappears or appears here is a decision, not an accident. Types are not listed; `tsc`
 * guards them where they are used.
 */
describe('@onestrand/testing', () => {
  it('exports exactly these values', () => {
    expect(Object.keys(testing).sort()).toEqual(
      [
        // a clock that stands still and ids that count
        'fixedClock',
        'sequentialIds',
        // checksums without the runtime
        'sha256Hex',
        'testHasher',
        // the lean seed
        'createTestContext',
        'businessSnapshot',
        // standard test of texts
        'catalogueTexts',
        'textProblems',
        'productNameRule',
        'DE_CH_TEXT_RULES',
        'DE_CH_OPENING_SIE_RULE',
        // standard test of side effects
        'SIDE_EFFECT_KINDS',
        'REGISTER_COLUMNS',
        'withoutComments',
        'occurrences',
        'parseRegister',
        'registerProblems',
        'sideEffectProblems',
        'storageKeys',
        'storageKeyProblems',
        // standard test of security
        'parseHeadersFile',
        'headerProblems',
        'htmlProblems',
        'securityProblems',
      ].sort(),
    );
  });

  it('holds no name of a product: the list for the texts comes from the caller', () => {
    const lists = Object.values(testing).filter(
      (value) => Array.isArray(value) && value.some((entry) => typeof entry === 'string'),
    );
    // The only list of words is the columns of the register of side effects.
    expect(lists).toEqual([testing.REGISTER_COLUMNS]);
  });
});

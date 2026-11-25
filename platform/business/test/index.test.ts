import { describe, expect, it } from 'vitest';
import * as business from '../src';

/**
 * The public surface, name by name. The editions, the reference industry and the pages build on
 * it: a name that disappears or appears here is a decision, not an accident. Types are not
 * listed; `tsc` guards them where they are used.
 */
describe('@onestrand/business', () => {
  it('exports exactly these values', () => {
    expect(Object.keys(business).sort()).toEqual(
      [
        // the IBAN
        'IBAN_PATTERN',
        'IBAN_PROBLEMS',
        'ibanProblem',
        'isValidIban',
        'normalizeIban',
        // the model
        'BankAccountSchema',
        'BusinessSchema',
        'CANTONS',
        'LetterheadSchema',
        'OptionValuesSchema',
        'PersonSchema',
        'VAT_METHODS',
        'businessTables',
        'peopleTable',
        // what it enters in the registers
        'BUSINESS_FEATURE',
        'RIGHT_PEOPLE_ROLES',
        'RIGHT_SETTINGS',
        'businessFeatureEntries',
        'businessRightEntries',
        // the contract and its use cases
        'BUSINESS_ERROR_CODES',
        'BUSINESS_EVENT_TYPES',
        'businessContract',
        'createBusinessUseCases',
        // people, the guard's source, the device
        'activeOwners',
        'leavesNoOwner',
        'profileOfActor',
        'createAccessSource',
        'listBusinesses',
      ].sort(),
    );
  });

  it('keeps its helpers inside', () => {
    for (const name of [
      'readBusiness',
      'withUnknownIds',
      'unknownFields',
      'isRecord',
      'StoredIdSchema',
    ]) {
      expect(Object.keys(business), name).not.toContain(name);
    }
  });

  it('holds no rule of law: no number, so no rate and no threshold', () => {
    const text = JSON.stringify({
      cantons: business.CANTONS,
      vat: business.VAT_METHODS,
      features: business.businessFeatureEntries,
      rights: business.businessRightEntries,
    });
    expect(text).not.toMatch(/\d/);
  });
});

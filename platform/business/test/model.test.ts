import { OWNER_PROFILE } from '@onestrand/access';
import { createTableRegistry, fieldSensitivity } from '@onestrand/storage';
import { sequentialIds } from '@onestrand/testing';
import { describe, expect, it } from 'vitest';
import {
  BankAccountSchema,
  BusinessSchema,
  CANTONS,
  LetterheadSchema,
  PersonSchema,
  VAT_METHODS,
  businessTables,
  peopleTable,
} from '../src';

const ids = sequentialIds();
const NOW = '2026-11-14T10:00:00.000Z';
const base = () => ({ id: ids.next(), name: 'Betrieb Muster', createdAt: NOW, updatedAt: NOW });

describe('the lists of choices', () => {
  it('names the 26 cantons by their abbreviation, once each', () => {
    expect(CANTONS).toHaveLength(26);
    expect(new Set(CANTONS).size).toBe(26);
    expect([...CANTONS].sort()).toEqual([...CANTONS]);
    expect(CANTONS.every((canton) => /^[A-Z]{2}$/.test(canton))).toBe(true);
  });

  it('names two ways of accounting for VAT and carries no rate', () => {
    expect(VAT_METHODS).toEqual(['effective', 'flat_rate']);
  });
});

describe('BusinessSchema', () => {
  it('reads a row with only the base: nothing chosen, nothing switched on', () => {
    expect(BusinessSchema.parse(base())).toMatchObject({
      name: 'Betrieb Muster',
      industries: [],
      kinds: [],
      features: [],
      options: {},
    });
  });

  it('reads a full row', () => {
    const row = {
      ...base(),
      industries: ['muster'],
      kinds: ['muster.standard'],
      canton: 'ZH',
      vatMethod: 'flat_rate',
      letterhead: {
        name: 'Muster Betrieb',
        street: 'Musterweg 1',
        postalCode: '8000',
        city: 'Musterstadt',
        country: 'CH',
        phone: '044 000 00 00',
        email: 'info@beispiel.example',
        logoFileId: ids.next(),
      },
      bank: { iban: 'CH9300762011623852957' },
      features: ['customers'],
      options: { jobs: { reminder: 15 } },
    };
    expect(BusinessSchema.parse(row)).toEqual(row);
  });

  it('keeps what it does not know, in every depth', () => {
    const row = {
      ...base(),
      future: { list: [1, 2] },
      letterhead: { name: 'Muster Betrieb', later: 'x' },
      bank: { iban: 'CH9300762011623852957', bic: 'later' },
      options: { 'later.feature': { anything: { deep: true } } },
      features: ['later.feature'],
    };
    expect(BusinessSchema.parse(row)).toMatchObject(row);
  });

  it.each([
    ['a canton that is none', { canton: 'XX' }],
    ['a VAT method it does not know', { vatMethod: 'none' }],
    ['a bank account with a wrong check digit', { bank: { iban: 'CH9300762011623852958' } }],
    ['an IBAN with spaces', { bank: { iban: 'CH93 0076 2011 6238 5295 7' } }],
    ['a letterhead without a name', { letterhead: { street: 'Musterweg 1' } }],
    ['an address for an email', { letterhead: { name: 'Muster', email: 'not an address' } }],
    ['a logo that is no id', { letterhead: { name: 'Muster', logoFileId: 'logo.png' } }],
  ])('refuses %s', (_what, fields) => {
    expect(BusinessSchema.safeParse({ ...base(), ...fields }).success).toBe(false);
  });

  it('stores a logo only as the id of a file', () => {
    const letterhead = LetterheadSchema.parse({ name: 'Muster', logoFileId: ids.next() });
    expect(typeof letterhead.logoFileId).toBe('string');
    expect(JSON.stringify(letterhead).length).toBeLessThan(200);
  });

  it('reads an id of a newer version loosely: any text, not a form', () => {
    const row = BusinessSchema.parse({ ...base(), kinds: ['Later Kind!'], features: ['Later!'] });
    expect(row.kinds).toEqual(['Later Kind!']);
    expect(BusinessSchema.safeParse({ ...base(), features: [''] }).success).toBe(false);
  });
});

describe('BankAccountSchema', () => {
  it('takes the plain form of an IBAN with right check digits', () => {
    expect(BankAccountSchema.parse({ iban: 'CH9300762011623852957' })).toEqual({
      iban: 'CH9300762011623852957',
    });
    expect(BankAccountSchema.safeParse({ iban: 'ch9300762011623852957' }).success).toBe(false);
    expect(BankAccountSchema.safeParse({}).success).toBe(false);
  });
});

describe('PersonSchema and the table of the people', () => {
  const person = {
    id: ids.next(),
    businessId: ids.next(),
    name: 'Person Muster',
    profile: OWNER_PROFILE,
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
  };

  it('has the least there is: a name, the business, a profile, whether active', () => {
    expect(Object.keys(PersonSchema.shape).sort()).toEqual(
      [
        'id',
        'businessId',
        'createdAt',
        'updatedAt',
        'deletedAt',
        'name',
        'profile',
        'active',
      ].sort(),
    );
    expect(PersonSchema.parse(person)).toEqual(person);
    expect(PersonSchema.parse({ ...person, deletedAt: NOW }).deletedAt).toBe(NOW);
  });

  it.each([
    ['a name that is empty', { name: '  ' }],
    ['a profile that is no profile', { profile: { type: 'owner', rights: [] } }],
    ['no word on whether active', { active: undefined }],
  ])('refuses %s', (_what, fields) => {
    expect(PersonSchema.safeParse({ ...person, ...fields }).success).toBe(false);
  });

  it('is a table that is for the business only and edited by one device', () => {
    expect(peopleTable.name).toBe('people');
    expect(peopleTable.sensitivity).toBe('internal');
    expect(peopleTable.sync).toBe('single_writer');
    expect(peopleTable.appendOnly).toBe(false);
    expect(peopleTable.backup).toBe(true);
    for (const field of ['name', 'profile', 'active']) {
      expect(fieldSensitivity(peopleTable, field), field).toBe('internal');
    }
  });

  it('goes into a register of its own', () => {
    expect(businessTables).toEqual([peopleTable]);
    expect(createTableRegistry(businessTables).names).toEqual(['people']);
  });
});

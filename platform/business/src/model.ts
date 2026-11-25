// Origin: BanioX/Randen packages/core/src/model/business.ts @ 5d016f1 — adapted: the business keeps branches, kinds, canton, VAT method, letterhead, bank account, the switched-on functions and the values of their options as plain identifiers instead of a fixed trade, kind and module list; the person has a profile of the access package instead of a trade role; no target costs, no default VAT rate, no demo flag
import { CountryCodeSchema, IdSchema, nameSchema, syncFields } from '@onestrand/core';
import { ProfileSchema } from '@onestrand/access';
import { BusinessBaseSchema, defineTable } from '@onestrand/storage';
import { z } from 'zod';
import { IBAN_PATTERN, isValidIban } from './iban';

/**
 * The full model of a business (suite ADR-0005; P-20) and of its people. The storage keeps the
 * row of the business as it is and knows only the base (`BusinessBaseSchema`); this schema
 * extends it, and an edition hands it to the backup kit as `businessSchema`.
 *
 * What the business stores are choices, never rules: the canton and the VAT method are items of
 * a list, no rate and no threshold stands here (law only with a source, in the facts). Ids of
 * industries, kinds, functions and options are stored as plain text and read loosely: a newer
 * version may have written one this version does not know, and it must neither break the row
 * nor be lost when the row is written back.
 */

/** The 26 cantons, by their abbreviation (ISO 3166-2:CH). */
export const CANTONS = [
  'AG',
  'AI',
  'AR',
  'BE',
  'BL',
  'BS',
  'FR',
  'GE',
  'GL',
  'GR',
  'JU',
  'LU',
  'NE',
  'NW',
  'OW',
  'SG',
  'SH',
  'SO',
  'SZ',
  'TG',
  'TI',
  'UR',
  'VD',
  'VS',
  'ZG',
  'ZH',
] as const;
export type Canton = (typeof CANTONS)[number];

/** How the business accounts for VAT: with the effective method or with a flat rate (Saldosteuersatz). The ids carry no rate. */
export const VAT_METHODS = ['effective', 'flat_rate'] as const;
export type VatMethod = (typeof VAT_METHODS)[number];

/**
 * The letterhead of documents the business sends: its name as it stands there, the address, the
 * contact, and the logo as the id of a file (never the bytes, suite ADR-0005, 7). Loose: a field
 * of a newer version stays.
 */
export const LetterheadSchema = z.looseObject({
  name: nameSchema(120),
  street: nameSchema(120).optional(),
  postalCode: nameSchema(10).optional(),
  city: nameSchema(80).optional(),
  country: CountryCodeSchema.optional(),
  phone: nameSchema(40).optional(),
  email: z.email().max(120).optional(),
  logoFileId: IdSchema.optional(),
});
export type Letterhead = z.infer<typeof LetterheadSchema>;

/**
 * The account for the QR payment slip. The IBAN is stored in its plain form (`normalizeIban`:
 * capitals, no spaces), with the right form and check digits.
 */
export const BankAccountSchema = z.looseObject({
  iban: z
    .string()
    .regex(IBAN_PATTERN, 'Expected an IBAN without spaces')
    .refine(isValidIban, 'The check digits of the IBAN do not fit'),
});
export type BankAccount = z.infer<typeof BankAccountSchema>;

/** An id as it is stored: any text of a sensible length; whether the register knows it is asked at the register. */
export const StoredIdSchema = z.string().min(1).max(100);

/**
 * The values of the options, { <function>: { <key>: <value> } }: what the person set. Read
 * loosely, because the register decides what is valid (
esolveOptions): whatever stands under
 * a function is kept, also what this version does not know how to read.
 */
export const OptionValuesSchema = z.record(z.string(), z.unknown());

/** The business as a device holds it. */
export const BusinessSchema = BusinessBaseSchema.extend({
  /** The industries (branches) the business works in: ids of the register of functions. */
  industries: z.array(StoredIdSchema).max(20).default([]),
  /** The kinds of business (`<industry>.<kind>`), ids of the register of functions. */
  kinds: z.array(StoredIdSchema).max(20).default([]),
  canton: z.enum(CANTONS).optional(),
  vatMethod: z.enum(VAT_METHODS).optional(),
  letterhead: LetterheadSchema.optional(),
  bank: BankAccountSchema.optional(),
  /**
   * The functions the business switched on, as the person holds them (`resolve` of the register
   * completes the list). Ids the register does not know stay: a newer version wrote them. The
   * extent (lean, usual, all) is never stored; it is recognised from this list.
   */
  features: z.array(StoredIdSchema).max(500).default([]),
  /** The values of the options, `{ <function>: { <key>: <value> } }`; what the register does not know stays. */
  options: OptionValuesSchema.default({}),
});
export type Business = z.infer<typeof BusinessSchema>;

/**
 * A person of a business with the least there is (data minimisation): a name to show, the
 * business they belong to (`businessId`), the profile of their rights and whether they are
 * active. No address, no date of birth, no wage: the module that needs such a fact brings its
 * own table. A person is never removed: `deletedAt` marks a row as deleted, `active` false
 * only keeps the person from acting.
 */
export const PersonSchema = z.object({
  ...syncFields,
  name: nameSchema(80),
  profile: ProfileSchema,
  active: z.boolean(),
});
export type Person = z.infer<typeof PersonSchema>;

/**
 * The table of the people. `internal`: names are for the business, never for third parties. The
 * profile is no more delicate than that: the device of a person must read their own profile to
 * enforce it, and a delicate field would not reach it. `single_writer`: the main device of the
 * business edits people.
 */
export const peopleTable = defineTable({
  name: 'people',
  schema: PersonSchema,
  indexes: [],
  sensitivity: 'internal',
  sync: 'single_writer',
});

/** The tables this package registers: an edition adds them to its register. */
export const businessTables = [peopleTable] as const;

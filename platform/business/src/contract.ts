import { ProfileSchema } from '@onestrand/access';
import { command, commandBase, query, queryBase, type ContractFragment } from '@onestrand/contract';
import { IdSchema, nameSchema } from '@onestrand/core';
import { z } from 'zod';
import { BUSINESS_FEATURE, RIGHT_PEOPLE_ROLES, RIGHT_SETTINGS } from './entries';
import {
  BankAccountSchema,
  BusinessSchema,
  CANTONS,
  LetterheadSchema,
  PersonSchema,
  VAT_METHODS,
  StoredIdSchema,
} from './model';

/**
 * The contract of the business (suite ADR-0009; ADR-0005 of the origin): what the app can ask of
 * the business and its people. Every operation names its function and level, and where it needs
 * more, a delicate right; the guard of `@onestrand/access` enforces it. Summaries are English and
 * for a technical reader; the words of the app live in the catalogues.
 *
 * `business.create` is the one operation on a business the device does not hold yet. It names
 * the same function and level as the others; the source of the guard (`createAccessSource`) lets
 * whoever holds the device create a business that is not there, and nothing else.
 */

/** The events this package appends: `<thing>.<what_happened>`, ids and small facts in the payload. */
export const BUSINESS_EVENT_TYPES = [
  'business.created',
  'business.updated',
  'feature.switched',
  'feature.option_set',
  'person.created',
  'person.updated',
  'person.deactivated',
  'person.reactivated',
] as const;
export type BusinessEventType = (typeof BUSINESS_EVENT_TYPES)[number];

/**
 * The codes of errors this package throws, beyond those of the platform:
 *
 * - `business.last_owner`: the change would leave the business without an active owner.
 * - `business.profile_refused`: the profile asked for gives or takes more than the person acting
 *   holds, or names a function or right nobody registered.
 */
export const BUSINESS_ERROR_CODES = ['business.last_owner', 'business.profile_refused'] as const;

const IdListSchema = z.array(StoredIdSchema).max(500);

const OptionValueSchema = z.union([z.boolean(), z.number(), z.string(), z.array(z.string())]);

export const businessContract = {
  'business.create': command({
    name: 'business.create',
    summary:
      'Creates a business on this device with its first person as owner, in one transaction. The person gets the id of the actor. Functions are completed by the register; ids the register does not know are refused.',
    access: { feature: BUSINESS_FEATURE, level: 'manage' },
    input: z.object({
      ...commandBase,
      name: nameSchema(120),
      ownerName: nameSchema(80),
      industries: IdListSchema.default([]),
      kinds: IdListSchema.default([]),
      features: IdListSchema.default([]),
    }),
    output: z.object({ business: BusinessSchema, owner: PersonSchema }),
  }),
  'business.get': query({
    name: 'business.get',
    summary:
      'Reads the business: name, canton, VAT method, letterhead, bank account, functions and option values.',
    access: { feature: BUSINESS_FEATURE, level: 'view' },
    input: z.object({ ...queryBase }),
    output: z.object({ business: BusinessSchema }),
  }),
  'business.update': command({
    name: 'business.update',
    summary:
      'Changes the name, canton, VAT method, letterhead, bank account, industries or kinds of the business. A field that is left out stays; null removes canton, VAT method, letterhead or bank account. Fields of a newer version stay.',
    access: { feature: BUSINESS_FEATURE, level: 'manage', rights: [RIGHT_SETTINGS] },
    input: z.object({
      ...commandBase,
      name: nameSchema(120).optional(),
      canton: z.enum(CANTONS).nullable().optional(),
      vatMethod: z.enum(VAT_METHODS).nullable().optional(),
      letterhead: LetterheadSchema.nullable().optional(),
      bank: BankAccountSchema.nullable().optional(),
      industries: IdListSchema.optional(),
      kinds: IdListSchema.optional(),
    }),
    output: z.object({ business: BusinessSchema }),
  }),
  'business.features.switch': command({
    name: 'business.features.switch',
    summary:
      'Switches one function on or off. On brings what it needs, off takes along everything that needs it; the result says what changed. Data of a function that is off stays; ids of a newer version stay in the list.',
    access: { feature: BUSINESS_FEATURE, level: 'manage', rights: [RIGHT_SETTINGS] },
    input: z.object({ ...commandBase, featureId: StoredIdSchema, on: z.boolean() }),
    output: z.object({
      business: BusinessSchema,
      turnedOn: z.array(z.string()),
      turnedOff: z.array(z.string()),
    }),
  }),
  'business.features.setOption': command({
    name: 'business.features.setOption',
    summary:
      'Sets the value of one option of a function. The value must fit the type of the option; options and functions of a newer version stay.',
    access: { feature: BUSINESS_FEATURE, level: 'manage', rights: [RIGHT_SETTINGS] },
    input: z.object({
      ...commandBase,
      featureId: StoredIdSchema,
      key: StoredIdSchema,
      value: OptionValueSchema,
    }),
    output: z.object({ business: BusinessSchema }),
  }),
  'business.people.add': command({
    name: 'business.people.add',
    summary:
      'Adds a person to the business with a profile. The profile may not give more than the person acting holds.',
    access: { feature: BUSINESS_FEATURE, level: 'manage', rights: [RIGHT_PEOPLE_ROLES] },
    input: z.object({ ...commandBase, name: nameSchema(80), profile: ProfileSchema }),
    output: z.object({ person: PersonSchema }),
  }),
  'business.people.update': command({
    name: 'business.people.update',
    summary:
      'Changes the name or the profile of a person. A profile change follows the rules of passing on; the owner profile cannot be changed.',
    access: { feature: BUSINESS_FEATURE, level: 'manage', rights: [RIGHT_PEOPLE_ROLES] },
    input: z.object({
      ...commandBase,
      personId: IdSchema,
      name: nameSchema(80).optional(),
      profile: ProfileSchema.optional(),
    }),
    output: z.object({ person: PersonSchema }),
  }),
  'business.people.setActive': command({
    name: 'business.people.setActive',
    summary:
      'Deactivates or reactivates a person. A person who is not active cannot act. The last active owner cannot be deactivated.',
    access: { feature: BUSINESS_FEATURE, level: 'manage', rights: [RIGHT_PEOPLE_ROLES] },
    input: z.object({ ...commandBase, personId: IdSchema, active: z.boolean() }),
    output: z.object({ person: PersonSchema }),
  }),
  'business.people.list': query({
    name: 'business.people.list',
    summary: 'Lists the people of the business that are not deleted, active or not.',
    access: { feature: BUSINESS_FEATURE, level: 'view' },
    input: z.object({ ...queryBase }),
    output: z.object({ people: z.array(PersonSchema) }),
  }),
} as const satisfies ContractFragment;

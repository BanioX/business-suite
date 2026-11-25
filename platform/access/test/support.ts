import { IdSchema, syncFields } from '@onestrand/core';
import {
  ACCESS_LEVELS,
  command,
  commandBase,
  query,
  queryBase,
  type ContractFragment,
  type UseCasesOf,
} from '@onestrand/contract';
import { createFeatureRegistry } from '@onestrand/features';
import { defineTable } from '@onestrand/storage';
import { sequentialIds } from '@onestrand/testing';
import fc from 'fast-check';
import { z } from 'zod';
import { createRightRegistry, type AccessContext, type CustomProfile, type Profile } from '../src';

/**
 * A small world for the tests: a register of functions with a core, a chain and one industry, a
 * register of rights, a made-up contract, two tables. Plain names, no industry of the real world.
 */

export const FEATURES = createFeatureRegistry({
  groups: [{ id: 'core' }, { id: 'work' }, { id: 'time' }],
  features: [
    { id: 'today', group: 'core', core: true },
    { id: 'customers', group: 'work' },
    { id: 'jobs', group: 'work', requires: ['customers'] },
    { id: 'team', group: 'time' },
    { id: 'team_time', group: 'time', requires: ['team'] },
  ],
}).extend({
  industries: [{ id: 'muster' }],
  groups: [{ id: 'muster.counter' }],
  features: [{ id: 'muster.visits', group: 'muster.counter', requires: ['customers'] }],
});

export const RIGHTS = createRightRegistry(FEATURES, {
  rights: [{ id: 'wages' }, { id: 'export_delete' }, { id: 'correct_time' }],
}).extend({
  industry: 'muster',
  rights: [{ id: 'muster.access_notes' }, { id: 'muster.visits.assign' }],
});

export const ALL_FEATURES = FEATURES.ids;
export const FEATURES_ON = FEATURES.resolve(['customers', 'team']).features;

export function custom(
  levels: CustomProfile['levels'] = {},
  rights: readonly string[] = [],
): CustomProfile {
  return { type: 'custom', levels, rights };
}

export function contextOf(profile: Profile, features: readonly string[] = ALL_FEATURES) {
  return { profile, features } satisfies AccessContext;
}

const ids = sequentialIds();
export const BUSINESS_ID = ids.next();
export const OTHER_BUSINESS_ID = ids.next();

export const notesContract = {
  'notes.add': command({
    name: 'notes.add',
    summary: 'Adds a note.',
    access: { feature: 'customers', level: 'operate' },
    input: z.object({ ...commandBase, text: z.string() }),
    output: z.object({ count: z.number() }),
  }),
  'notes.list': query({
    name: 'notes.list',
    summary: 'Lists the notes.',
    access: { feature: 'customers', level: 'view' },
    input: z.object({ ...queryBase }),
    output: z.object({ notes: z.array(z.string()) }),
  }),
  'notes.export': command({
    name: 'notes.export',
    summary: 'Exports and deletes the notes.',
    access: { feature: 'customers', level: 'manage', rights: ['export_delete', 'correct_time'] },
    input: z.object({ ...commandBase }),
    output: z.object({ count: z.number() }),
  }),
  'muster.visits.list': query({
    name: 'muster.visits.list',
    summary: 'Lists the visits.',
    access: { feature: 'muster.visits', level: 'view' },
    input: z.object({ ...queryBase }),
    output: z.object({ visits: z.array(z.string()) }),
  }),
} as const satisfies ContractFragment;

/** Use cases that record what ran, so a test can see that a refused operation did not. */
export function recordingUseCases(): {
  calls: string[];
  useCases: UseCasesOf<typeof notesContract>;
} {
  const calls: string[] = [];
  return {
    calls,
    useCases: {
      'notes.add': (input) => {
        calls.push(`notes.add:${input.text}`);
        return Promise.resolve({ count: calls.length });
      },
      'notes.list': () => {
        calls.push('notes.list');
        return Promise.resolve({ notes: [] });
      },
      'notes.export': () => {
        calls.push('notes.export');
        return Promise.resolve({ count: 0 });
      },
      'muster.visits.list': () => {
        calls.push('muster.visits.list');
        return Promise.resolve({ visits: [] });
      },
    },
  };
}

const StaffRowSchema = z.object({
  ...syncFields,
  name: z.string(),
  wage: z.number(),
  note: z.string().optional(),
});
export type StaffRow = z.infer<typeof StaffRowSchema>;

/** A table that is normal as a whole with one sensitive field and one internal field. */
export const STAFF_TABLE = defineTable({
  name: 'staff',
  schema: StaffRowSchema,
  indexes: [],
  sensitivity: 'normal',
  fields: { wage: 'sensitive', note: 'internal' },
  sync: 'single_writer',
});

const HealthRowSchema = z.object({ id: IdSchema, businessId: IdSchema, text: z.string() });
export type HealthRow = z.infer<typeof HealthRowSchema>;

/** A table that is sensitive as a whole, with one field that says it is not. */
export const HEALTH_TABLE = defineTable({
  name: 'health_notes',
  schema: HealthRowSchema,
  indexes: [],
  sensitivity: 'sensitive',
  fields: { text: 'normal' },
  sync: 'single_writer',
});

export function staffRow(n: number, note?: string): StaffRow {
  const row = {
    id: ids.next(),
    businessId: BUSINESS_ID,
    name: `Person ${String(n)}`,
    wage: 1000 * n,
    createdAt: '2026-11-25T10:00:00.000Z',
    updatedAt: '2026-11-25T10:00:00.000Z',
  } as StaffRow;
  return note === undefined ? row : { ...row, note };
}

/* Generators of data for the properties. */

const FEATURE_POOL = ['customers', 'jobs', 'team', 'team_time', 'muster.visits', 'today'] as const;
const RIGHT_POOL = ['wages', 'export_delete', 'correct_time', 'muster.access_notes'] as const;

export const levelArb = fc.constantFrom(...ACCESS_LEVELS);

export const customProfileArb: fc.Arbitrary<CustomProfile> = fc
  .record({
    levels: fc.dictionary(fc.constantFrom(...FEATURE_POOL), levelArb),
    rights: fc.uniqueArray(fc.constantFrom(...RIGHT_POOL)),
  })
  .map(({ levels, rights }) => ({ type: 'custom', levels, rights }));

export const profileArb: fc.Arbitrary<Profile> = fc.oneof(
  { weight: 1, arbitrary: fc.constant<Profile>({ type: 'owner' }) },
  { weight: 4, arbitrary: customProfileArb },
);

export const featuresOnArb = fc.subarray([...FEATURE_POOL]);

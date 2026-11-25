import {
  ACCESS_LEVELS,
  FEATURE_ID_PATTERN,
  RIGHT_ID_PATTERN,
  type AccessLevel,
} from '@onestrand/contract';
import { z } from 'zod';

/**
 * What a person may do (suite ADR-0004, 6; rule R-4), as plain data: a level in each function
 * (nothing, `view`, `operate`, `manage`) and a set of delicate rights. A profile is what a
 * person holds; the guard, the rules of passing on and the filter for other devices read it and
 * nothing else. Who holds which profile, and the pages that edit one, come with the people of a
 * business (W1).
 *
 * Two kinds of profile exist:
 *
 * - `owner`: may do everything, in every function and every right, also those that only a later
 *   version adds. It is fixed: it has no list to edit, and it can be neither changed nor taken
 *   away (see `profileChangeProblems`). The word "Inhaber:in" is a text of the app; the code knows
 *   only this id.
 * - `custom`: a level in some functions, a set of rights. A function that is not listed is
 *   nothing: the person does not see it.
 */

/** The ids of the kinds of profile. */
export const PROFILE_TYPES = ['owner', 'custom'] as const;
export type ProfileType = (typeof PROFILE_TYPES)[number];

export interface OwnerProfile {
  readonly type: 'owner';
}

export interface CustomProfile {
  readonly type: 'custom';
  /** The level in each function by its id; a function that is not here is nothing. */
  readonly levels: Readonly<Record<string, AccessLevel>>;
  /** The delicate rights, each once. */
  readonly rights: readonly string[];
}

export type Profile = OwnerProfile | CustomProfile;

/**
 * A profile as it is stored: strict (a field it does not know is refused, so a typo cannot drop a
 * right), ids in the form of the contract, each right once. The ids are checked for their form
 * only; whether they exist is `profileProblems`, because a profile written by a newer version
 * may name a function or a right this version does not know, and must still be readable.
 */
export const ProfileSchema: z.ZodType<Profile> = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('owner') }),
  z.strictObject({
    type: z.literal('custom'),
    levels: z.record(z.string().regex(FEATURE_ID_PATTERN), z.enum(ACCESS_LEVELS)),
    rights: z
      .array(z.string().regex(RIGHT_ID_PATTERN))
      .refine((rights) => new Set(rights).size === rights.length, {
        message: 'a right is listed more than once',
      }),
  }),
]);

/** The profile that may do everything. The same value for every owner. */
export const OWNER_PROFILE: OwnerProfile = Object.freeze({ type: 'owner' });

/** The profile of a person who may nothing: for a person the business does not know. */
export const NO_ACCESS_PROFILE: CustomProfile = Object.freeze({
  type: 'custom',
  levels: Object.freeze({}),
  rights: Object.freeze([]),
});

export function isOwner(profile: Profile): profile is OwnerProfile {
  return profile.type === 'owner';
}

/** The level a profile has in a function: `manage` for the owner, `undefined` (nothing) where none is listed. */
export function levelOf(profile: Profile, feature: string): AccessLevel | undefined {
  if (isOwner(profile)) {
    return 'manage';
  }
  return Object.hasOwn(profile.levels, feature) ? profile.levels[feature] : undefined;
}

/** Whether a profile holds a delicate right; the owner holds every one. */
export function holdsRight(profile: Profile, right: string): boolean {
  return isOwner(profile) || profile.rights.includes(right);
}

export type ProfileProblemCode = 'unknown_feature' | 'unknown_right';

/** One id in a profile that the registers do not know. */
export interface ProfileProblem {
  code: ProfileProblemCode;
  id: string;
  message: string;
}

/** What a profile is checked against: the register of features and the register of rights; both fit as they are. */
export interface KnownIds {
  features: { has(id: string): boolean };
  rights: { has(id: string): boolean };
}

/**
 * The functions and rights of a profile that the registers do not know, as data. Not a fault of
 * the profile: a newer version may have written them, so keep them when you save it back. The
 * page that edits a profile refuses them for a new one. The owner names nothing and has none.
 */
export function profileProblems(profile: Profile, known: KnownIds): readonly ProfileProblem[] {
  if (isOwner(profile)) {
    return [];
  }
  return [
    ...Object.keys(profile.levels)
      .filter((id) => !known.features.has(id))
      .map((id): ProfileProblem => ({
        code: 'unknown_feature',
        id,
        message: `the register of features has no function "${id}"`,
      })),
    ...profile.rights
      .filter((id) => !known.rights.has(id))
      .map((id): ProfileProblem => ({
        code: 'unknown_right',
        id,
        message: `the register of rights has no right "${id}"`,
      })),
  ];
}

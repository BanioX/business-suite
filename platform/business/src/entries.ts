import type { RightEntries } from '@onestrand/access';
import type { FeatureEntries } from '@onestrand/features';

/**
 * What this package enters in the registers (suite ADR-0004). Ids are for ever: they stand in
 * `registry/names.json`, in stored profiles and in the texts of the catalogues.
 *
 * - The function `business` is core: the business, its people and its functions are there as
 *   long as the app is, and nobody can switch them off. Every operation of the package names it.
 * - Two delicate rights (P-21): `people_roles` for who may add people and change their
 *   profiles, `settings` for who may change the business and its functions.
 */

/** The id of the function every operation of this package names. */
export const BUSINESS_FEATURE = 'business';

export const businessFeatureEntries = {
  groups: [{ id: 'business' }],
  features: [{ id: BUSINESS_FEATURE, group: 'business', core: true }],
} as const satisfies FeatureEntries;

/** Who may add people and change their profiles. */
export const RIGHT_PEOPLE_ROLES = 'people_roles';
/** Who may change the business and switch its functions. */
export const RIGHT_SETTINGS = 'settings';

export const businessRightEntries = {
  rights: [{ id: RIGHT_PEOPLE_ROLES }, { id: RIGHT_SETTINGS }],
} as const satisfies RightEntries;

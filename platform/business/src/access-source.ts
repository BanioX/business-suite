import { NO_ACCESS_PROFILE, OWNER_PROFILE, type AccessSource } from '@onestrand/access';
import { isUuidV7, type Id } from '@onestrand/core';
import type { FeatureRegistry } from '@onestrand/features';
import { BusinessSchema } from './model';
import { profileOfActor } from './people';
import type { BusinessStorage } from './use-cases';

/** The one operation on a business the device does not hold yet. */
const CREATE_OPERATION = 'business.create';

/** What the source reads: the businesses and the people of the device. */
export type AccessSourceStorage = Pick<BusinessStorage, 'businesses' | 'table'>;

/**
 * The source of the guard of `@onestrand/access` (`guardUseCases`): for an operation on a
 * business it says which profile the person acting holds there and which functions the business
 * has switched on, read from the storage.
 *
 * - The profile is the one of the person's row in that business, as long as the person is active
 *   and not deleted. A person of another business, a deactivated person, a deleted one and one
 *   the device does not know get `NO_ACCESS_PROFILE`: nothing.
 * - The functions are the ones the business holds, completed by the register (`resolve`), so the
 *   core is always there. For a business the device does not know, only the core.
 * - A business the device does not hold yet can be created, by whoever holds the device: there
 *   is no person yet to ask. The source then gives the owner profile for `business.create`, and
 *   for no other operation. A business that exists is asked as any other, so `business.create`
 *   on it is refused unless the person acting may manage it (and the use case then refuses it,
 *   because it exists).
 *
 * `actor` is the person acting, the same id as in the context of the commands.
 */
export function createAccessSource(options: {
  readonly storage: AccessSourceStorage;
  readonly features: FeatureRegistry;
  readonly actor: Id;
}): AccessSource {
  const { storage, features, actor } = options;
  return async ({ operation, businessId }) => {
    const row = isUuidV7(businessId) ? await storage.businesses.get(businessId) : undefined;
    if (row === undefined) {
      return {
        profile: operation.name === CREATE_OPERATION ? OWNER_PROFILE : NO_ACCESS_PROFILE,
        features: features.resolve([]).features,
      };
    }
    const business = BusinessSchema.safeParse(row);
    return {
      profile: await profileOfActor(storage, row.id, actor),
      features: features.resolve(business.success ? business.data.features : []).features,
    };
  };
}

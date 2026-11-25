import { NO_ACCESS_PROFILE, ProfileSchema, isOwner, type Profile } from '@onestrand/access';
import type { Id } from '@onestrand/core';
import type { ModuleStorage } from '@onestrand/storage';
import { peopleTable, type Person } from './model';

/**
 * Who a person is to a business, read from the storage: the profile of a person that may act,
 * and the rule that a business keeps an owner.
 */

/**
 * The profile of a person in a business, as far as they may act: the profile of their row if the
 * row belongs to this business, is not deleted and is active. A person of another business, a
 * deactivated one, a deleted one, one the device does not know and one whose profile this version
 * cannot read get `NO_ACCESS_PROFILE`: when in doubt, nothing.
 */
export async function profileOfActor(
  storage: Pick<ModuleStorage, 'table'>,
  businessId: Id,
  actor: Id,
): Promise<Profile> {
  const person = await storage.table(peopleTable).get(actor);
  if (person?.businessId !== businessId || person.deletedAt !== undefined || !person.active) {
    return NO_ACCESS_PROFILE;
  }
  const profile = ProfileSchema.safeParse(person.profile);
  return profile.success ? profile.data : NO_ACCESS_PROFILE;
}

/** The people who may act and hold the owner profile. Deleted rows do not count. */
export function activeOwners(people: readonly Person[]): readonly Person[] {
  return people.filter(
    (person) => person.deletedAt === undefined && person.active && isOwner(person.profile),
  );
}

/**
 * Whether replacing one row of `people` by `after` leaves the business without an active owner
 * where it had one before: the last owner can be neither deactivated nor lowered. A business
 * that had no owner (a seeded one in a test, a restored one) is not blocked: nothing is lost.
 */
export function leavesNoOwner(people: readonly Person[], after: Person): boolean {
  const changed = people.map((person) => (person.id === after.id ? after : person));
  return activeOwners(people).length > 0 && activeOwners(changed).length === 0;
}

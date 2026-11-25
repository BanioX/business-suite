import type { Id } from '@onestrand/core';
import type { BusinessStorage } from './use-cases';

/** One business of the device, as the list for switching between them shows it. */
export interface BusinessListing {
  readonly id: Id;
  readonly name: string;
}

/**
 * The businesses on this device: only the id and the name, by name. A device holds several
 * businesses (suite ADR-0005, 8) and the person picks one before they act, so this question has
 * no business to ask and no person to check. It is no operation of the contract, which names a
 * business in every input and is guarded by that business (debt TD-11); it is a plain function
 * of the device that gives away nothing else of a business.
 */
export async function listBusinesses(
  storage: Pick<BusinessStorage, 'businesses'>,
): Promise<readonly BusinessListing[]> {
  const rows = await storage.businesses.all();
  return rows
    .map(({ id, name }) => ({ id, name }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : a.id < b.id ? -1 : 1));
}

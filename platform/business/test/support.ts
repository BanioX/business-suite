import { OWNER_PROFILE, createRightRegistry, guardUseCases, type Profile } from '@onestrand/access';
import type { CommandContext } from '@onestrand/contract';
import type { Id } from '@onestrand/core';
import { createFeatureRegistry } from '@onestrand/features';
import { createTableRegistry, type BusinessBase, type StoredRow } from '@onestrand/storage';
import { createTestContext, type TestContext } from '@onestrand/testing';
import {
  BusinessSchema,
  businessContract,
  businessFeatureEntries,
  businessRightEntries,
  businessTables,
  createAccessSource,
  createBusinessUseCases,
  type Business,
  type BusinessContext,
  type Person,
} from '../src';

/**
 * A small world for the tests: a register of functions with the core of this package, a short
 * chain with options and one made-up industry, a register of rights, and a storage with a
 * business and two people. Plain names, nothing of a real trade.
 */

export const FEATURES = createFeatureRegistry(businessFeatureEntries)
  .extend({
    groups: [{ id: 'work' }],
    features: [
      { id: 'customers', group: 'work' },
      {
        id: 'jobs',
        group: 'work',
        requires: ['customers'],
        options: [
          { key: 'reminder', type: 'minutes', default: 30 },
          { key: 'mode', type: 'enum', values: ['plain', 'detailed'], default: 'plain' },
          { key: 'tags', type: 'list', default: [] },
        ],
      },
      { id: 'reports', group: 'work', requires: ['jobs'] },
      { id: 'team', group: 'work' },
    ],
  })
  .extend({
    industries: [{ id: 'muster' }],
    groups: [{ id: 'muster.visits' }],
    features: [{ id: 'muster.visits', group: 'muster.visits', requires: ['customers'] }],
    kinds: [
      { id: 'muster.standard', on: ['customers'] },
      { id: 'muster.large', on: ['customers', 'jobs'] },
    ],
  });

export const RIGHTS = createRightRegistry(FEATURES, businessRightEntries)
  .extend({ rights: [{ id: 'wages' }] })
  .extend({ industry: 'muster', rights: [{ id: 'muster.access_notes' }] });

export const REGISTERS = { features: FEATURES, rights: RIGHTS };
export const REGISTER = createTableRegistry(businessTables);

/** The functions that are not core: what a person can switch. */
export const SWITCHABLE = FEATURES.ids.filter((id) => !FEATURES.get(id).core);

export type World = TestContext<typeof REGISTER, Business>;

/** A profile with a level in some functions and some rights. */
export function custom(
  levels: Record<string, 'view' | 'operate' | 'manage'> = {},
  rights: string[] = [],
): Profile {
  return { type: 'custom', levels, rights };
}

/** The profile of a person who may do everything in the package, but is no owner. */
export const MANAGER: Profile = custom({ business: 'manage' }, ['people_roles', 'settings']);

export function personRow(
  world: Pick<World, 'businessId' | 'clock'>,
  id: Id,
  name: string,
  profile: Profile,
  active = true,
): Person {
  const now = world.clock.now();
  return {
    id,
    businessId: world.businessId,
    name,
    profile,
    active,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * A storage with the business `Betrieb Muster` and two people: the owner and a second person
 * with the profile given (default: may only look). Ids are those of the seed.
 */
export async function seed(second: Profile = custom({ business: 'view' })): Promise<World> {
  const world = await createTestContext({
    registry: REGISTER,
    business: (base: BusinessBase) => BusinessSchema.parse(base),
  });
  const people = world.storage.table('people');
  await people.put(personRow(world, world.ownerId, 'Person Muster', OWNER_PROFILE));
  await people.put(personRow(world, world.secondPersonId, 'Person Beispiel', second));
  return world;
}

/** The context of a command for one person acting in the world, with the storage of the world. */
export function contextOf(world: World, actor: Id = world.ownerId): BusinessContext {
  return { ...world.ctx, storage: world.storage, actor };
}

/** The use cases for one person acting, not guarded. */
export function useCasesOf(world: World, actor: Id = world.ownerId) {
  return createBusinessUseCases(contextOf(world, actor), REGISTERS);
}

/** The use cases for one person acting, behind the guard fed from the storage. */
export function guardedOf(world: World, actor: Id = world.ownerId) {
  return guardUseCases(
    businessContract,
    useCasesOf(world, actor),
    createAccessSource({ storage: world.storage, features: FEATURES, actor }),
  );
}

export type BusinessUseCases = ReturnType<typeof useCasesOf>;

/** Every row of the table of the people of a business, soft-deleted ones included. */
export async function peopleOf(world: World): Promise<StoredRow[]> {
  return world.storage.table('people').ofBusiness(world.businessId);
}

export type { CommandContext };

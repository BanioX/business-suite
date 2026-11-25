import { NO_ACCESS_PROFILE, OWNER_PROFILE } from '@onestrand/access';
import { CommandError } from '@onestrand/contract';
import { describe, expect, it } from 'vitest';
import { businessContract, createAccessSource, profileOfActor } from '../src';
import { FEATURES, MANAGER, custom, guardedOf, personRow, seed } from './support';

const refused = async (promise: Promise<unknown>) => {
  const error = await promise.then(
    () => undefined,
    (thrown: unknown) => thrown,
  );
  expect(error).toBeInstanceOf(CommandError);
  expect((error as CommandError).code).toBe('forbidden');
};

const sourceOf = (world: Awaited<ReturnType<typeof seed>>, actor = world.ownerId) =>
  createAccessSource({ storage: world.storage, features: FEATURES, actor });

describe('profileOfActor', () => {
  it('is the profile of an active person of the business', async () => {
    const world = await seed(MANAGER);
    expect(await profileOfActor(world.storage, world.businessId, world.ownerId)).toEqual(
      OWNER_PROFILE,
    );
    expect(await profileOfActor(world.storage, world.businessId, world.secondPersonId)).toEqual(
      MANAGER,
    );
  });

  it('is nothing for a person of another business, a deactivated one, a deleted one and an unknown one', async () => {
    const world = await seed(MANAGER);
    const other = await world.addBusiness();
    const people = world.storage.table('people');
    await people.put(personRow(other, other.ownerId, 'Person Fremd', OWNER_PROFILE));
    await people.put({
      ...personRow(world, world.secondPersonId, 'Person Beispiel', MANAGER, false),
    });
    const gone = world.ids.next();
    await people.put({
      ...personRow(world, gone, 'Person Weg', MANAGER),
      deletedAt: world.clock.now(),
    });
    for (const actor of [other.ownerId, world.secondPersonId, gone, world.ids.next()]) {
      expect(await profileOfActor(world.storage, world.businessId, actor)).toBe(NO_ACCESS_PROFILE);
    }
  });

  it('is nothing for a profile this version cannot read', async () => {
    const world = await seed();
    await world.storage.table('people').put({
      ...personRow(world, world.secondPersonId, 'Person Beispiel', OWNER_PROFILE),
      profile: { type: 'later' },
    } as never);
    expect(await profileOfActor(world.storage, world.businessId, world.secondPersonId)).toBe(
      NO_ACCESS_PROFILE,
    );
  });
});

describe('createAccessSource', () => {
  const request = (
    world: Awaited<ReturnType<typeof seed>>,
    name: keyof typeof businessContract,
  ) => ({
    operation: businessContract[name],
    businessId: world.businessId,
  });

  it('gives the profile and the functions of the business, completed by the register', async () => {
    const world = await seed(MANAGER);
    await world.storage.businesses.put({ ...world.business, features: ['jobs'] });
    const context = await sourceOf(world, world.secondPersonId)(request(world, 'business.get'));
    expect(context.profile).toEqual(MANAGER);
    expect(context.features).toEqual(['business', 'customers', 'jobs']);
  });

  it('gives only the core for a business with a row that cannot be read', async () => {
    const world = await seed();
    await world.storage.businesses.put({ ...world.business, features: 'broken' } as never);
    const context = await sourceOf(world)(request(world, 'business.get'));
    expect(context.features).toEqual(['business']);
  });

  it('gives nothing for a business the device does not hold, and the owner profile to create one', async () => {
    const world = await seed();
    const source = sourceOf(world, world.ids.next());
    const elsewhere = world.ids.next();
    const ask = (name: keyof typeof businessContract, businessId: string = elsewhere) =>
      source({ operation: businessContract[name], businessId });
    expect((await ask('business.create')).profile).toBe(OWNER_PROFILE);
    expect((await ask('business.get')).profile).toBe(NO_ACCESS_PROFILE);
    expect((await ask('business.update')).profile).toBe(NO_ACCESS_PROFILE);
    expect((await ask('business.get', 'not an id')).profile).toBe(NO_ACCESS_PROFILE);
    expect((await ask('business.create')).features).toEqual(['business']);
  });

  it('gives no more for the creation of a business that exists: it is asked as any other', async () => {
    const world = await seed();
    const context = await sourceOf(world, world.ids.next())(request(world, 'business.create'));
    expect(context.profile).toBe(NO_ACCESS_PROFILE);
  });
});

describe('the use cases behind the guard', () => {
  it('lets an owner do everything', async () => {
    const world = await seed();
    const guarded = guardedOf(world);
    const base = () => ({ commandId: world.cmd(), businessId: world.businessId });
    await expect(guarded['business.get']({ businessId: world.businessId })).resolves.toBeDefined();
    await expect(guarded['business.update']({ ...base(), canton: 'LU' })).resolves.toBeDefined();
    await expect(
      guarded['business.features.switch']({ ...base(), featureId: 'jobs', on: true }),
    ).resolves.toBeDefined();
    await expect(
      guarded['business.people.add']({ ...base(), name: 'Person Drei', profile: custom() }),
    ).resolves.toBeDefined();
  });

  it('lets whoever holds the device create a business, and then that person is its owner', async () => {
    const world = await seed();
    const actor = world.ids.next();
    const businessId = world.ids.next();
    const guarded = guardedOf(world, actor);
    await guarded['business.create']({
      commandId: world.cmd(),
      businessId,
      name: 'Betrieb Beispiel',
      ownerName: 'Person Beispiel',
    });
    await expect(
      guarded['business.update']({ commandId: world.cmd(), businessId, canton: 'GE' }),
    ).resolves.toBeDefined();
    // The same business a second time is asked like any other: the owner may manage it, and the use case refuses it.
    await expect(
      guarded['business.create']({
        commandId: world.cmd(),
        businessId,
        name: 'Betrieb Beispiel',
        ownerName: 'Person Beispiel',
      }),
    ).rejects.toMatchObject({ code: 'invalid' });
  });

  it('lets a person who may only look read, and nothing else', async () => {
    const world = await seed();
    const guarded = guardedOf(world, world.secondPersonId);
    const base = () => ({ commandId: world.cmd(), businessId: world.businessId });
    await expect(guarded['business.get']({ businessId: world.businessId })).resolves.toBeDefined();
    await expect(
      guarded['business.people.list']({ businessId: world.businessId }),
    ).resolves.toBeDefined();
    await refused(guarded['business.update']({ ...base(), canton: 'LU' }));
    await refused(guarded['business.features.switch']({ ...base(), featureId: 'jobs', on: true }));
    await refused(
      guarded['business.features.setOption']({
        ...base(),
        featureId: 'jobs',
        key: 'reminder',
        value: 1,
      }),
    );
    await refused(
      guarded['business.people.add']({ ...base(), name: 'Person Drei', profile: custom() }),
    );
    await refused(
      guarded['business.people.update']({
        ...base(),
        personId: world.ownerId,
        name: 'Person Eins',
      }),
    );
    await refused(
      guarded['business.people.setActive']({ ...base(), personId: world.ownerId, active: false }),
    );
  });

  it('asks for the right on top of the level: a manager without it is refused', async () => {
    const world = await seed(custom({ business: 'manage' }, ['settings']));
    const guarded = guardedOf(world, world.secondPersonId);
    const base = () => ({ commandId: world.cmd(), businessId: world.businessId });
    await expect(guarded['business.update']({ ...base(), canton: 'LU' })).resolves.toBeDefined();
    await refused(
      guarded['business.people.add']({ ...base(), name: 'Person Drei', profile: custom() }),
    );
  });

  it('refuses a person of another business, a deactivated one and an unknown one, in every operation', async () => {
    const world = await seed();
    const other = await world.addBusiness();
    await world.storage
      .table('people')
      .put(personRow(other, other.ownerId, 'Person Fremd', OWNER_PROFILE));
    await world.storage
      .table('people')
      .put(personRow(world, world.secondPersonId, 'Person Beispiel', MANAGER, false));
    for (const actor of [other.ownerId, world.secondPersonId, world.ids.next()]) {
      const guarded = guardedOf(world, actor);
      await refused(guarded['business.get']({ businessId: world.businessId }));
      await refused(guarded['business.people.list']({ businessId: world.businessId }));
      await refused(
        guarded['business.update']({
          commandId: world.cmd(),
          businessId: world.businessId,
          canton: 'LU',
        }),
      );
    }
  });

  it('does not let the business create another with the person of a business', async () => {
    const world = await seed();
    await refused(
      guardedOf(world, world.ownerId)['business.update']({
        commandId: world.cmd(),
        businessId: world.ids.next(),
        canton: 'LU',
      }),
    );
  });
});

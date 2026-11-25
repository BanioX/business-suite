import { OWNER_PROFILE, NO_ACCESS_PROFILE } from '@onestrand/access';
import { CommandError } from '@onestrand/contract';
import type { TableDefinition } from '@onestrand/storage';
import { describe, expect, it } from 'vitest';
import {
  BUSINESS_ERROR_CODES,
  BusinessSchema,
  PersonSchema,
  createBusinessUseCases,
  type Business,
  type BusinessStorage,
  type Person,
} from '../src';
import { FEATURES, MANAGER, REGISTERS, custom, personRow, seed, useCasesOf } from './support';

const rejects = async (promise: Promise<unknown>, code: string) => {
  const error = await promise.then(
    () => undefined,
    (thrown: unknown) => thrown,
  );
  expect(error).toBeInstanceOf(CommandError);
  expect((error as CommandError).code).toBe(code);
};

const storedBusiness = async (world: Awaited<ReturnType<typeof seed>>): Promise<Business> => {
  const row = await world.storage.businesses.get(world.businessId);
  return BusinessSchema.parse(row);
};

describe('business.create', () => {
  it('makes the business and its first person as owner, with the id of the actor', async () => {
    const world = await seed();
    const businessId = world.ids.next();
    const actor = world.ids.next();
    const useCases = useCasesOf(world, actor);

    const { business, owner } = await useCases['business.create']({
      commandId: world.cmd(),
      businessId,
      name: 'Betrieb Beispiel',
      ownerName: 'Person Beispiel',
      industries: ['muster'],
      kinds: ['muster.large'],
      features: ['jobs'],
    });

    expect(business).toMatchObject({
      id: businessId,
      name: 'Betrieb Beispiel',
      industries: ['muster'],
      kinds: ['muster.large'],
      // The register completes the list: the core, and what `jobs` needs.
      features: ['business', 'customers', 'jobs'],
      options: {},
    });
    expect(owner).toMatchObject({
      id: actor,
      businessId,
      name: 'Person Beispiel',
      profile: OWNER_PROFILE,
      active: true,
    });
    expect(await world.storage.businesses.get(businessId)).toEqual(business);
    expect(await world.storage.table('people').get(actor)).toEqual(owner);
    expect(world.clock.now()).toBe(business.createdAt);
  });

  it('refuses an actor who is a person of a business already, and writes nothing', async () => {
    const world = await seed();
    const businessId = world.ids.next();
    await rejects(
      useCasesOf(world, world.ownerId)['business.create']({
        commandId: world.cmd(),
        businessId,
        name: 'Betrieb Beispiel',
        ownerName: 'Person Beispiel',
      }),
      'invalid',
    );
    expect(await world.storage.businesses.get(businessId)).toBeUndefined();
    expect(await world.storage.events.ofBusiness(businessId)).toEqual([]);
  });

  it('is one transaction: no business stays if the first person cannot be written', async () => {
    const world = await seed();
    const businessId = world.ids.next();
    const actor = world.ids.next();
    const failing: BusinessStorage = {
      ...world.storage,
      table: ((definition: TableDefinition) => {
        const store = world.storage.table(definition);
        return definition.name === 'people'
          ? { ...store, add: () => Promise.reject(new Error('disk full')) }
          : store;
      }) as BusinessStorage['table'],
    };
    const useCases = createBusinessUseCases({ ...world.ctx, storage: failing, actor }, REGISTERS);
    await expect(
      useCases['business.create']({
        commandId: world.cmd(),
        businessId,
        name: 'Betrieb Beispiel',
        ownerName: 'Person Beispiel',
      }),
    ).rejects.toThrow('disk full');
    expect(await world.storage.businesses.get(businessId)).toBeUndefined();
    expect(await world.storage.events.ofBusiness(businessId)).toEqual([]);
  });
  it('refuses a business id that is taken, a kind or industry nobody registered, a function nobody registered', async () => {
    const world = await seed();
    const useCases = (actor = world.ids.next()) => useCasesOf(world, actor);
    const input = () => ({
      commandId: world.cmd(),
      businessId: world.ids.next(),
      name: 'Betrieb Beispiel',
      ownerName: 'Person Beispiel',
    });
    await rejects(
      useCases()['business.create']({ ...input(), businessId: world.businessId }),
      'invalid',
    );
    await rejects(
      useCases()['business.create']({ ...input(), industries: ['unknown'] }),
      'invalid',
    );
    await rejects(
      useCases()['business.create']({ ...input(), kinds: ['muster.unknown'] }),
      'invalid',
    );
    await rejects(useCases()['business.create']({ ...input(), features: ['unknown'] }), 'invalid');
    expect(await world.storage.businesses.all()).toHaveLength(1);
  });

  it('answers a repeated command with the stored result and writes once', async () => {
    const world = await seed();
    const actor = world.ids.next();
    const useCases = useCasesOf(world, actor);
    const input = {
      commandId: world.cmd(),
      businessId: world.ids.next(),
      name: 'Betrieb Beispiel',
      ownerName: 'Person Beispiel',
    };
    const first = await useCases['business.create'](input);
    const again = await useCases['business.create'](input);
    expect(again).toEqual(first);
    expect(await world.storage.businesses.all()).toHaveLength(2);
    expect(await world.storage.events.ofBusiness(input.businessId)).toHaveLength(2);
  });
});

describe('business.get and business.update', () => {
  it('reads the business', async () => {
    const world = await seed();
    const { business } = await useCasesOf(world)['business.get']({ businessId: world.businessId });
    expect(business).toEqual(await storedBusiness(world));
    await rejects(useCasesOf(world)['business.get']({ businessId: world.ids.next() }), 'not_found');
  });

  it('changes what is given and leaves the rest', async () => {
    const world = await seed();
    const useCases = useCasesOf(world);
    const letterhead = {
      name: 'Muster Betrieb',
      city: 'Musterstadt',
      email: 'info@beispiel.example',
    };
    const { business } = await useCases['business.update']({
      commandId: world.cmd(),
      businessId: world.businessId,
      name: 'Betrieb Muster AG',
      canton: 'BE',
      vatMethod: 'effective',
      letterhead,
      bank: { iban: 'CH9300762011623852957' },
      industries: ['muster'],
      kinds: ['muster.standard'],
    });
    expect(business).toMatchObject({
      name: 'Betrieb Muster AG',
      canton: 'BE',
      vatMethod: 'effective',
      letterhead,
      bank: { iban: 'CH9300762011623852957' },
      industries: ['muster'],
      kinds: ['muster.standard'],
    });

    const { business: renamed } = await useCases['business.update']({
      commandId: world.cmd(),
      businessId: world.businessId,
      name: 'Betrieb Muster GmbH',
    });
    expect({ ...renamed, name: '', updatedAt: '' }).toEqual({
      ...business,
      name: '',
      updatedAt: '',
    });
    expect(renamed.name).toBe('Betrieb Muster GmbH');
  });

  it('takes away canton, VAT method, letterhead and bank account with null', async () => {
    const world = await seed();
    const useCases = useCasesOf(world);
    await useCases['business.update']({
      commandId: world.cmd(),
      businessId: world.businessId,
      canton: 'ZH',
      vatMethod: 'flat_rate',
      letterhead: { name: 'Muster Betrieb' },
      bank: { iban: 'CH9300762011623852957' },
    });
    const { business } = await useCases['business.update']({
      commandId: world.cmd(),
      businessId: world.businessId,
      canton: null,
      vatMethod: null,
      letterhead: null,
      bank: null,
    });
    for (const field of ['canton', 'vatMethod', 'letterhead', 'bank']) {
      expect(business, field).not.toHaveProperty(field);
    }
    expect(await world.storage.businesses.get(world.businessId)).not.toHaveProperty('canton');
  });

  it('keeps fields of a newer version: on the business, in the letterhead and in the bank account, and kinds nobody here knows', async () => {
    const world = await seed();
    const row = await storedBusiness(world);
    await world.storage.businesses.put({
      ...row,
      future: { list: [1] },
      kinds: ['later.kind', 'muster.standard'],
      industries: ['later'],
      letterhead: { name: 'Muster Betrieb', later: 'letterhead' },
      bank: { iban: 'CH9300762011623852957', later: 'bank' },
    });
    const { business } = await useCasesOf(world)['business.update']({
      commandId: world.cmd(),
      businessId: world.businessId,
      letterhead: { name: 'Muster Betrieb', city: 'Musterstadt' },
      bank: { iban: 'DE89370400440532013000' },
      kinds: ['muster.large'],
      industries: ['muster'],
    });
    expect(business).toMatchObject({
      future: { list: [1] },
      letterhead: { name: 'Muster Betrieb', city: 'Musterstadt', later: 'letterhead' },
      bank: { iban: 'DE89370400440532013000', later: 'bank' },
      kinds: ['muster.large', 'later.kind'],
      industries: ['muster', 'later'],
    });
  });

  it('refuses a kind or an industry nobody registered, and an IBAN that does not add up', async () => {
    const world = await seed();
    const useCases = useCasesOf(world);
    const base = () => ({ commandId: world.cmd(), businessId: world.businessId });
    await rejects(useCases['business.update']({ ...base(), kinds: ['muster.unknown'] }), 'invalid');
    await rejects(useCases['business.update']({ ...base(), industries: ['unknown'] }), 'invalid');
    await expect(
      useCases['business.update']({ ...base(), bank: { iban: 'CH9300762011623852958' } }),
    ).rejects.toThrow();
    await expect(storedBusiness(world)).resolves.not.toHaveProperty('bank');
  });
});

describe('business.features.switch', () => {
  it('switches on with what is needed and says what went along', async () => {
    const world = await seed();
    const result = await useCasesOf(world)['business.features.switch']({
      commandId: world.cmd(),
      businessId: world.businessId,
      featureId: 'reports',
      on: true,
    });
    expect(result.turnedOn).toEqual(['customers', 'jobs', 'reports']);
    expect(result.turnedOff).toEqual([]);
    expect(result.business.features).toEqual(['business', 'customers', 'jobs', 'reports']);
    expect((await storedBusiness(world)).features).toEqual(result.business.features);
  });

  it('switches off with everything that needs it, and keeps the data of the option values', async () => {
    const world = await seed();
    const useCases = useCasesOf(world);
    const base = () => ({ commandId: world.cmd(), businessId: world.businessId });
    await useCases['business.features.switch']({ ...base(), featureId: 'reports', on: true });
    await useCases['business.features.setOption']({
      ...base(),
      featureId: 'jobs',
      key: 'reminder',
      value: 10,
    });
    const result = await useCases['business.features.switch']({
      ...base(),
      featureId: 'customers',
      on: false,
    });
    expect(result.turnedOff).toEqual(['customers', 'jobs', 'reports']);
    expect(result.business.features).toEqual(['business']);
    // What was set stays for the day the function is switched on again.
    expect(result.business.options).toEqual({ jobs: { reminder: 10 } });
  });

  it('keeps the ids of a newer version', async () => {
    const world = await seed();
    const row = await storedBusiness(world);
    await world.storage.businesses.put({ ...row, features: ['later.thing', 'customers'] });
    const result = await useCasesOf(world)['business.features.switch']({
      commandId: world.cmd(),
      businessId: world.businessId,
      featureId: 'team',
      on: true,
    });
    expect(result.business.features).toEqual(['business', 'customers', 'team', 'later.thing']);
    const off = await useCasesOf(world)['business.features.switch']({
      commandId: world.cmd(),
      businessId: world.businessId,
      featureId: 'customers',
      on: false,
    });
    expect(off.business.features).toEqual(['business', 'team', 'later.thing']);
  });

  it('refuses a function nobody registered and one of the core, and changes nothing', async () => {
    const world = await seed();
    const useCases = useCasesOf(world);
    const before = await storedBusiness(world);
    await rejects(
      useCases['business.features.switch']({
        commandId: world.cmd(),
        businessId: world.businessId,
        featureId: 'unknown',
        on: true,
      }),
      'invalid',
    );
    await rejects(
      useCases['business.features.switch']({
        commandId: world.cmd(),
        businessId: world.businessId,
        featureId: 'business',
        on: false,
      }),
      'not_allowed',
    );
    expect(await storedBusiness(world)).toEqual(before);
  });
});

describe('business.features.setOption', () => {
  const set = (world: Awaited<ReturnType<typeof seed>>, key: string, value: unknown) =>
    useCasesOf(world)['business.features.setOption']({
      commandId: world.cmd(),
      businessId: world.businessId,
      featureId: 'jobs',
      key,
      value: value as never,
    });

  it('sets a value that fits and keeps the other values of the function and other functions', async () => {
    const world = await seed();
    await set(world, 'reminder', 45);
    await set(world, 'mode', 'detailed');
    const { business } = await set(world, 'tags', ['a', 'b']);
    expect(business.options).toEqual({
      jobs: { reminder: 45, mode: 'detailed', tags: ['a', 'b'] },
    });
    expect(FEATURES.resolveOptions('jobs', business.options.jobs).values).toEqual({
      reminder: 45,
      mode: 'detailed',
      tags: ['a', 'b'],
    });
  });

  it('keeps options of a newer version, in a function it knows and in one it does not', async () => {
    const world = await seed();
    const row = await storedBusiness(world);
    await world.storage.businesses.put({
      ...row,
      options: { jobs: { later: { deep: 1 } }, 'later.feature': { key: 'value' } },
    });
    const { business } = await set(world, 'reminder', 5);
    expect(business.options).toEqual({
      jobs: { later: { deep: 1 }, reminder: 5 },
      'later.feature': { key: 'value' },
    });
  });

  it('mends a stored value that is not a record', async () => {
    const world = await seed();
    const row = await storedBusiness(world);
    await world.storage.businesses.put({ ...row, options: { jobs: 'broken' } });
    expect((await set(world, 'reminder', 5)).business.options).toEqual({ jobs: { reminder: 5 } });
  });

  it.each([
    ['a value of the wrong type', 'reminder', 'soon'],
    ['minutes below zero', 'reminder', -5],
    ['a value an enum does not list', 'mode', 'other'],
    ['an option the function does not have', 'colour', 'red'],
  ])('refuses %s', async (_what, key, value) => {
    const world = await seed();
    await rejects(set(world, key, value), 'invalid');
    expect((await storedBusiness(world)).options).toEqual({});
  });

  it('refuses a function nobody registered', async () => {
    const world = await seed();
    await rejects(
      useCasesOf(world)['business.features.setOption']({
        commandId: world.cmd(),
        businessId: world.businessId,
        featureId: 'unknown',
        key: 'reminder',
        value: 1,
      }),
      'invalid',
    );
  });
});

describe('the people', () => {
  const add = (
    world: Awaited<ReturnType<typeof seed>>,
    actor = world.ownerId,
    profile = custom(),
  ) =>
    useCasesOf(world, actor)['business.people.add']({
      commandId: world.cmd(),
      businessId: world.businessId,
      name: 'Person Drei',
      profile,
    });

  it('adds a person who is active, with the profile given', async () => {
    const world = await seed();
    const { person } = await add(world, world.ownerId, custom({ customers: 'operate' }));
    expect(person).toMatchObject({
      businessId: world.businessId,
      name: 'Person Drei',
      profile: { type: 'custom', levels: { customers: 'operate' }, rights: [] },
      active: true,
    });
    expect(await world.storage.table('people').get(person.id)).toEqual(person);
    const { people } = await useCasesOf(world)['business.people.list']({
      businessId: world.businessId,
    });
    expect(people.map(({ name }) => name)).toEqual([
      'Person Muster',
      'Person Beispiel',
      'Person Drei',
    ]);
  });

  it('lists the people who are not deleted, the inactive ones too', async () => {
    const world = await seed();
    const { person } = await add(world);
    await world.storage.table('people').put({ ...person, deletedAt: world.clock.now() });
    await useCasesOf(world)['business.people.setActive']({
      commandId: world.cmd(),
      businessId: world.businessId,
      personId: world.secondPersonId,
      active: false,
    });
    const { people } = await useCasesOf(world)['business.people.list']({
      businessId: world.businessId,
    });
    expect(people.map(({ name, active }) => [name, active])).toEqual([
      ['Person Muster', true],
      ['Person Beispiel', false],
    ]);
    await rejects(
      useCasesOf(world)['business.people.list']({ businessId: world.ids.next() }),
      'not_found',
    );
  });

  describe('passing on', () => {
    it('lets an owner give any profile, the owner profile too', async () => {
      const world = await seed();
      const { person } = await add(world, world.ownerId, OWNER_PROFILE);
      expect(person.profile).toEqual(OWNER_PROFILE);
    });

    it('does not let a person give more than they hold: not the owner, no level above their own, no right they lack', async () => {
      const world = await seed(MANAGER);
      const actor = world.secondPersonId;
      await rejects(add(world, actor, OWNER_PROFILE), 'business.profile_refused');
      await rejects(add(world, actor, custom({ customers: 'view' })), 'business.profile_refused');
      await rejects(
        add(world, actor, custom({ business: 'manage' }, ['wages'])),
        'business.profile_refused',
      );
      // What they hold they may give.
      await expect(
        add(world, actor, custom({ business: 'operate' }, ['settings'])),
      ).resolves.toBeDefined();
      expect(await world.storage.table('people').ofBusiness(world.businessId)).toHaveLength(3);
    });

    it('refuses a function or a right nobody registered, for a new profile', async () => {
      const world = await seed();
      await rejects(
        add(world, world.ownerId, custom({ 'later.feature': 'view' })),
        'business.profile_refused',
      );
      await rejects(
        add(world, world.ownerId, custom({}, ['later_right'])),
        'business.profile_refused',
      );
    });

    it('changes a name or a profile', async () => {
      const world = await seed();
      const { person } = await useCasesOf(world)['business.people.update']({
        commandId: world.cmd(),
        businessId: world.businessId,
        personId: world.secondPersonId,
        name: 'Person Vier',
        profile: custom({ customers: 'manage' }, ['wages']),
      });
      expect(person).toMatchObject({
        id: world.secondPersonId,
        name: 'Person Vier',
        profile: { levels: { customers: 'manage' }, rights: ['wages'] },
      });
      const { person: same } = await useCasesOf(world)['business.people.update']({
        commandId: world.cmd(),
        businessId: world.businessId,
        personId: world.secondPersonId,
        name: 'Person Fuenf',
      });
      expect(same.profile).toEqual(person.profile);
      expect(same.name).toBe('Person Fuenf');
    });

    it('keeps a profile of a newer version when the name changes, and when the profile is set again with the same ids', async () => {
      const world = await seed();
      const later = custom({ 'later.feature': 'operate', customers: 'view' }, ['later_right']);
      await world.storage.table('people').put({
        ...personRow(world, world.secondPersonId, 'Person Beispiel', later),
      });
      const useCases = useCasesOf(world);
      const base = () => ({
        commandId: world.cmd(),
        businessId: world.businessId,
        personId: world.secondPersonId,
      });
      await useCases['business.people.update']({ ...base(), name: 'Person Vier' });
      const { person } = await useCases['business.people.update']({
        ...base(),
        profile: custom({ 'later.feature': 'operate', customers: 'operate' }, ['later_right']),
      });
      expect(person.profile).toEqual(
        custom({ 'later.feature': 'operate', customers: 'operate' }, ['later_right']),
      );
      // A new unknown id is refused all the same.
      await rejects(
        useCases['business.people.update']({
          ...base(),
          profile: custom({ 'later.feature': 'operate', 'other.feature': 'view' }, ['later_right']),
        }),
        'business.profile_refused',
      );
    });

    it('does not let a person change what they lack the level for', async () => {
      const world = await seed(MANAGER);
      await rejects(
        useCasesOf(world, world.secondPersonId)['business.people.update']({
          commandId: world.cmd(),
          businessId: world.businessId,
          personId: world.ownerId,
          profile: custom(),
        }),
        'business.profile_refused',
      );
    });

    it('never lowers an owner, not even the last one, and not by an owner', async () => {
      const world = await seed();
      await rejects(
        useCasesOf(world)['business.people.update']({
          commandId: world.cmd(),
          businessId: world.businessId,
          personId: world.ownerId,
          profile: NO_ACCESS_PROFILE,
        }),
        'business.profile_refused',
      );
      expect((await world.storage.table('people').get(world.ownerId))?.profile).toEqual(
        OWNER_PROFILE,
      );
    });
  });

  describe('deactivating', () => {
    const setActive = (
      world: Awaited<ReturnType<typeof seed>>,
      personId: Person['id'],
      active: boolean,
      actor = world.ownerId,
    ) =>
      useCasesOf(world, actor)['business.people.setActive']({
        commandId: world.cmd(),
        businessId: world.businessId,
        personId,
        active,
      });

    it('deactivates a person and brings them back', async () => {
      const world = await seed();
      expect((await setActive(world, world.secondPersonId, false)).person.active).toBe(false);
      expect((await setActive(world, world.secondPersonId, true)).person.active).toBe(true);
    });

    it('keeps the last active owner', async () => {
      const world = await seed();
      await rejects(setActive(world, world.ownerId, false), 'business.last_owner');
      expect((await world.storage.table('people').get(world.ownerId))?.active).toBe(true);
    });

    it('lets an owner go when another one is active, and then keeps the last', async () => {
      const world = await seed();
      const { person: second } = await add(world, world.ownerId, OWNER_PROFILE);
      await setActive(world, world.ownerId, false);
      // The person who is deactivated cannot be the actor any more for the guard, but the use case itself decides on the rows.
      await rejects(setActive(world, second.id, false, second.id), 'business.last_owner');
    });

    it('counts the owner who comes back', async () => {
      const world = await seed();
      const { person: second } = await add(world, world.ownerId, OWNER_PROFILE);
      await setActive(world, second.id, false);
      await setActive(world, second.id, true);
      await setActive(world, world.ownerId, false);
      await rejects(setActive(world, second.id, false, second.id), 'business.last_owner');
    });

    it('does not let a person who is no owner deactivate one, or take out of action a person with more than they hold', async () => {
      const world = await seed(MANAGER);
      const actor = world.secondPersonId;
      await rejects(setActive(world, world.ownerId, false, actor), 'business.profile_refused');
      const { person: stronger } = await add(
        world,
        world.ownerId,
        custom({ business: 'manage', customers: 'manage' }),
      );
      await rejects(setActive(world, stronger.id, false, actor), 'business.profile_refused');
      const { person: weaker } = await add(world, world.ownerId, custom({ business: 'view' }));
      await expect(setActive(world, weaker.id, false, actor)).resolves.toBeDefined();
    });

    it('deactivates a person whose profile names things of a newer version', async () => {
      const world = await seed();
      await world.storage
        .table('people')
        .put(
          personRow(
            world,
            world.secondPersonId,
            'Person Beispiel',
            custom({ 'later.feature': 'view' }, ['later_right']),
          ),
        );
      expect((await setActive(world, world.secondPersonId, false)).person.active).toBe(false);
    });

    it('does not know a person of another business', async () => {
      const world = await seed();
      const other = await world.addBusiness();
      await rejects(setActive(world, other.ownerId, false), 'not_found');
      await rejects(
        useCasesOf(world)['business.people.update']({
          commandId: world.cmd(),
          businessId: world.businessId,
          personId: other.ownerId,
          name: 'Person Fremd',
        }),
        'not_found',
      );
    });
  });

  it('keeps fields of a newer version of a person when it changes', async () => {
    const world = await seed();
    const row = await world.storage.table('people').get(world.secondPersonId);
    await world.storage.table('people').put({ ...row, later: { field: 1 } } as never);
    await useCasesOf(world)['business.people.update']({
      commandId: world.cmd(),
      businessId: world.businessId,
      personId: world.secondPersonId,
      name: 'Person Vier',
    });
    await useCasesOf(world)['business.people.setActive']({
      commandId: world.cmd(),
      businessId: world.businessId,
      personId: world.secondPersonId,
      active: false,
    });
    expect(await world.storage.table('people').get(world.secondPersonId)).toMatchObject({
      name: 'Person Vier',
      active: false,
      later: { field: 1 },
    });
  });

  it('holds a row that PersonSchema reads', async () => {
    const world = await seed();
    const { person } = await add(world);
    expect(PersonSchema.parse(person)).toEqual(person);
  });
});

describe('the error codes', () => {
  it('are namespaced and form a code of a command', () => {
    expect(BUSINESS_ERROR_CODES).toEqual(['business.last_owner', 'business.profile_refused']);
    for (const code of BUSINESS_ERROR_CODES) {
      expect(new CommandError(code, 'test').code).toBe(code);
    }
  });
});

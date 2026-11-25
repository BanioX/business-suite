import { contractAccessProblems } from '@onestrand/access';
import {
  CommandError,
  contractJsonSchemas,
  fragmentProblems,
  isCommandErrorCode,
  operationSchemaProblems,
} from '@onestrand/contract';
import { featureEntryProblems } from '@onestrand/features';
import { describe, expect, it } from 'vitest';
import {
  BUSINESS_ERROR_CODES,
  BUSINESS_EVENT_TYPES,
  BUSINESS_FEATURE,
  RIGHT_PEOPLE_ROLES,
  RIGHT_SETTINGS,
  businessContract,
  businessFeatureEntries,
  businessRightEntries,
  businessTables,
} from '../src';
import { FEATURES, RIGHTS, custom, seed, useCasesOf } from './support';

describe('the contract of the business', () => {
  const operations = Object.values(businessContract);

  it('is a fragment that is well formed', () => {
    expect(fragmentProblems(businessContract)).toEqual([]);
  });

  it.each(operations.map((operation) => [operation.name, operation] as const))(
    'has schemas JSON can carry, with the base fields required: %s',
    (_name, operation) => {
      expect(operationSchemaProblems(operation)).toEqual([]);
    },
  );

  it('can be published as JSON Schema', () => {
    expect(contractJsonSchemas(businessContract).map(({ name }) => name)).toEqual(
      operations.map(({ name }) => name),
    );
  });

  it('names a function and a right the registers know', () => {
    expect(
      contractAccessProblems(businessContract, { features: FEATURES, rights: RIGHTS }),
    ).toEqual([]);
  });

  it('asks for the function of this package in every operation, and for a delicate right where it matters', () => {
    expect(new Set(operations.map(({ access }) => access.feature))).toEqual(
      new Set([BUSINESS_FEATURE]),
    );
    const rightsOf = (name: keyof typeof businessContract) =>
      businessContract[name].access.rights ?? [];
    expect(rightsOf('business.update')).toEqual([RIGHT_SETTINGS]);
    expect(rightsOf('business.features.switch')).toEqual([RIGHT_SETTINGS]);
    expect(rightsOf('business.features.setOption')).toEqual([RIGHT_SETTINGS]);
    expect(rightsOf('business.people.add')).toEqual([RIGHT_PEOPLE_ROLES]);
    expect(rightsOf('business.people.update')).toEqual([RIGHT_PEOPLE_ROLES]);
    expect(rightsOf('business.people.setActive')).toEqual([RIGHT_PEOPLE_ROLES]);
    // Reading needs only the level `view`.
    for (const name of ['business.get', 'business.people.list'] as const) {
      expect(businessContract[name].access).toEqual({ feature: BUSINESS_FEATURE, level: 'view' });
    }
    for (const operation of operations.filter(({ kind }) => kind === 'command')) {
      expect(operation.access.level).toBe('manage');
    }
  });

  it('has no operation that lists the businesses of the device: that is no question to a business', () => {
    expect(Object.keys(businessContract).filter((name) => /businesses|devices/.test(name))).toEqual(
      [],
    );
  });
});

describe('what the package enters in the registers', () => {
  it('has well formed entries for the register of functions', () => {
    expect(featureEntryProblems(businessFeatureEntries)).toEqual([]);
  });

  it('is a core function: always on, never switched', () => {
    expect(FEATURES.get(BUSINESS_FEATURE).core).toBe(true);
    expect(FEATURES.resolve([]).features).toContain(BUSINESS_FEATURE);
    expect(() => FEATURES.switchFeature([], BUSINESS_FEATURE, false)).toThrow(/core/i);
  });

  it('enters two delicate rights of the platform, without a namespace', () => {
    expect(businessRightEntries.rights.map(({ id }) => id)).toEqual(['people_roles', 'settings']);
    expect(RIGHTS.has(RIGHT_PEOPLE_ROLES)).toBe(true);
    expect(RIGHTS.has(RIGHT_SETTINGS)).toBe(true);
  });

  it('registers one table', () => {
    expect(businessTables.map(({ name }) => name)).toEqual(['people']);
  });
});

describe('events and error codes', () => {
  it('appends exactly the events it declares, each of the form thing.what_happened, and each command at least one', async () => {
    const world = await seed();
    const useCases = useCasesOf(world);
    const actor = world.ids.next();
    const created = world.ids.next();
    const base = () => ({ commandId: world.cmd(), businessId: world.businessId });
    const eventTypes = async (businessId: string) =>
      (await world.storage.events.ofBusiness(businessId as typeof world.businessId)).map(
        ({ type }) => type,
      );

    await useCasesOf(world, actor)['business.create']({
      commandId: world.cmd(),
      businessId: created,
      name: 'Betrieb Beispiel',
      ownerName: 'Person Beispiel',
    });
    expect(await eventTypes(created)).toEqual(['business.created', 'person.created']);

    const steps: [string, () => Promise<unknown>, string[]][] = [
      [
        'business.update',
        () => useCases['business.update']({ ...base(), canton: 'ZH' }),
        ['business.updated'],
      ],
      [
        'business.features.switch',
        () => useCases['business.features.switch']({ ...base(), featureId: 'jobs', on: true }),
        ['feature.switched'],
      ],
      [
        'business.features.setOption',
        () =>
          useCases['business.features.setOption']({
            ...base(),
            featureId: 'jobs',
            key: 'reminder',
            value: 5,
          }),
        ['feature.option_set'],
      ],
      [
        'business.people.add',
        () =>
          useCases['business.people.add']({ ...base(), name: 'Person Drei', profile: custom() }),
        ['person.created'],
      ],
      [
        'business.people.update',
        () =>
          useCases['business.people.update']({
            ...base(),
            personId: world.secondPersonId,
            name: 'Person Vier',
          }),
        ['person.updated'],
      ],
      [
        'business.people.setActive',
        () =>
          useCases['business.people.setActive']({
            ...base(),
            personId: world.secondPersonId,
            active: false,
          }),
        ['person.deactivated'],
      ],
      [
        'business.people.setActive',
        () =>
          useCases['business.people.setActive']({
            ...base(),
            personId: world.secondPersonId,
            active: true,
          }),
        ['person.reactivated'],
      ],
    ];
    const seen = new Set(await eventTypes(created));
    for (const [name, run, expected] of steps) {
      const before = (await eventTypes(world.businessId)).length;
      await run();
      const added = (await eventTypes(world.businessId)).slice(before);
      expect(added, name).toEqual(expected);
      expected.forEach((type) => seen.add(type));
    }
    expect([...seen].sort()).toEqual([...BUSINESS_EVENT_TYPES].sort());
    for (const type of BUSINESS_EVENT_TYPES) {
      expect(type).toMatch(/^[a-z][a-z_]*\.[a-z][a-z_]*$/);
    }
  });

  it('carries no name and no address of a person in an event: ids and small facts only', async () => {
    const world = await seed();
    const useCases = useCasesOf(world);
    await useCases['business.update']({
      commandId: world.cmd(),
      businessId: world.businessId,
      name: 'Betrieb Neu',
      letterhead: { name: 'Muster Betrieb', street: 'Musterweg 1' },
      bank: { iban: 'CH9300762011623852957' },
    });
    await useCases['business.people.add']({
      commandId: world.cmd(),
      businessId: world.businessId,
      name: 'Person Drei',
      profile: custom(),
    });
    const text = JSON.stringify(await world.storage.events.ofBusiness(world.businessId));
    for (const secret of ['Betrieb Neu', 'Musterweg', 'CH9300762011623852957', 'Person Drei']) {
      expect(text).not.toContain(secret);
    }
  });

  it('has error codes with the namespace of the package', () => {
    for (const code of BUSINESS_ERROR_CODES) {
      expect(code).toMatch(/^business\./);
      expect(isCommandErrorCode(code)).toBe(true);
      expect(new CommandError(code, 'test').code).toBe(code);
    }
  });
});

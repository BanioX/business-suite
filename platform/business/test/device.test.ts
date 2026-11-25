import { OWNER_PROFILE } from '@onestrand/access';
import {
  createBackupKit,
  createMemoryStorage,
  type BusinessBase,
  type Hasher,
  type Storage,
} from '@onestrand/storage';
import { businessSnapshot, createTestContext } from '@onestrand/testing';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { BusinessSchema, createBusinessUseCases, listBusinesses, type Business } from '../src';
import {
  FEATURES,
  REGISTER,
  REGISTERS,
  SWITCHABLE,
  contextOf,
  custom,
  guardedOf,
  personRow,
  seed,
  useCasesOf,
} from './support';

describe('several businesses on one device', () => {
  it('lists them by name, with nothing but the id and the name', async () => {
    const world = await seed();
    const second = await world.addBusiness();
    const third = await world.addBusiness({ name: 'Betrieb Anfang' });
    await world.storage.businesses.put({
      ...world.business,
      canton: 'ZH',
      bank: { iban: 'CH9300762011623852957' },
    });
    expect(await listBusinesses(world.storage)).toEqual([
      { id: third.businessId, name: 'Betrieb Anfang' },
      { id: second.businessId, name: 'Betrieb Beispiel' },
      { id: world.businessId, name: 'Betrieb Muster' },
    ]);
  });

  it('lists nothing on an empty device, and two businesses of one name in the order of their ids', async () => {
    const world = await seed();
    await world.storage.purge(world.businessId);
    expect(await listBusinesses(world.storage)).toEqual([]);
    const a = await world.addBusiness({ name: 'Betrieb Gleich' });
    const b = await world.addBusiness({ name: 'Betrieb Gleich' });
    expect((await listBusinesses(world.storage)).map(({ id }) => id)).toEqual([
      a.businessId,
      b.businessId,
    ]);
  });

  it('keeps two businesses apart: what one does never shows in the other', async () => {
    const world = await seed();
    const other = await world.addBusiness();
    await world.storage
      .table('people')
      .put(personRow(other, other.ownerId, 'Person Fremd', OWNER_PROFILE));
    const before = await other.snapshot();

    const useCases = useCasesOf(world);
    const base = () => ({ commandId: world.cmd(), businessId: world.businessId });
    await useCases['business.update']({
      ...base(),
      name: 'Betrieb Muster AG',
      canton: 'ZH',
      bank: { iban: 'CH9300762011623852957' },
    });
    await useCases['business.features.switch']({ ...base(), featureId: 'reports', on: true });
    await useCases['business.features.setOption']({
      ...base(),
      featureId: 'jobs',
      key: 'reminder',
      value: 5,
    });
    const { person } = await useCases['business.people.add']({
      ...base(),
      name: 'Person Drei',
      profile: custom(),
    });
    await useCases['business.people.setActive']({ ...base(), personId: person.id, active: false });

    expect(await other.snapshot()).toEqual(before);
    const names = async (businessId: typeof world.businessId) =>
      (await useCases['business.people.list']({ businessId })).people.map(({ name }) => name);
    expect(await names(other.businessId)).toEqual(['Person Fremd']);
    expect(await names(world.businessId)).toEqual([
      'Person Muster',
      'Person Beispiel',
      'Person Drei',
    ]);
  });

  it('does not let a person of one business reach the other, with the guard in front', async () => {
    const world = await seed();
    const other = await world.addBusiness();
    await world.storage
      .table('people')
      .put(personRow(other, other.ownerId, 'Person Fremd', OWNER_PROFILE));
    const guarded = guardedOf(world, world.ownerId);
    // The owner of the first business has no profile in the second.
    await expect(guarded['business.get']({ businessId: other.businessId })).rejects.toMatchObject({
      code: 'forbidden',
    });
    await expect(
      guarded['business.update']({
        commandId: world.cmd(),
        businessId: other.businessId,
        name: 'Betrieb Beute',
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });
    expect((await other.snapshot()).business).toMatchObject({ name: 'Betrieb Beispiel' });
  });

  it('purges one business with its people and leaves the other', async () => {
    const world = await seed();
    const other = await world.addBusiness();
    await world.storage
      .table('people')
      .put(personRow(other, other.ownerId, 'Person Fremd', OWNER_PROFILE));
    const before = await other.snapshot();
    await world.storage.purge(world.businessId);
    expect(await world.storage.table('people').ofBusiness(world.businessId)).toEqual([]);
    expect(await other.snapshot()).toEqual(before);
  });
});

describe('the backup of a business', () => {
  const kit = (hasher: Hasher) =>
    createBackupKit({
      format: 'sample-backup',
      version: 1,
      registry: REGISTER,
      hasher,
      businessSchema: BusinessSchema,
    });

  it('goes out and comes back, with every field it does not know', async () => {
    const world = await seed();
    const logo = await world.storage.files.put({
      businessId: world.businessId,
      bytes: new Uint8Array([1, 2, 3]),
      mediaType: 'image/png',
    });
    const full: Business = {
      ...world.business,
      industries: ['muster', 'later'],
      kinds: ['muster.standard', 'later.kind'],
      canton: 'BE',
      vatMethod: 'flat_rate',
      letterhead: {
        name: 'Muster Betrieb',
        city: 'Musterstadt',
        logoFileId: logo.id,
        later: { shape: [1, { deep: true }] },
      },
      bank: { iban: 'CH9300762011623852957', later: 'bank' },
      features: ['business', 'customers', 'jobs', 'later.feature'],
      options: {
        jobs: { reminder: 5, later: [1, 2] },
        'later.feature': { key: { deep: 'value' } },
      },
      future: { list: [1, 2, { a: null }] },
    };
    await world.storage.businesses.put(full);
    await world.storage.table('people').put({
      ...personRow(
        world,
        world.secondPersonId,
        'Person Beispiel',
        custom({ 'later.feature': 'view' }, ['later_right']),
      ),
      later: { field: 1 },
    } as never);

    const backups = kit(world.hasher);
    const document = JSON.parse(
      JSON.stringify(await backups.exportBackup(world.storage, world.businessId, world)),
    ) as unknown;
    const { preview, backup } = await backups.checkBackup(document);
    expect(preview.problems).toEqual([]);
    expect(backup).toBeDefined();

    // Back onto an empty device.
    const device: Storage<typeof REGISTER, Business> = createMemoryStorage<
      typeof REGISTER,
      Business
    >(REGISTER, {
      hasher: world.hasher,
      clock: world.clock,
      ids: world.ids,
    });
    if (backup === undefined) {
      throw new Error('the backup was refused');
    }
    await backups.restoreBackup(device, backup);

    const restored = await businessSnapshot(device, REGISTER, world.businessId);
    const original = await world.snapshot();
    expect(restored.business).toEqual(full);
    expect(restored.tables).toEqual(original.tables);
    expect(restored.files).toEqual(original.files);
    expect(await listBusinesses(device)).toEqual([
      { id: world.businessId, name: 'Betrieb Muster' },
    ]);
  });

  it('brings one business back and leaves the other one on the device as it is', async () => {
    const world = await seed();
    const other = await world.addBusiness();
    const backups = kit(world.hasher);
    const backup = (
      await backups.checkBackup(
        JSON.parse(
          JSON.stringify(await backups.exportBackup(world.storage, world.businessId, world)),
        ),
      )
    ).backup;
    if (backup === undefined) {
      throw new Error('the backup was refused');
    }
    await useCasesOf(world)['business.update']({
      commandId: world.cmd(),
      businessId: world.businessId,
      name: 'Betrieb Neu',
    });
    const otherBefore = await other.snapshot();
    await backups.restoreBackup(world.storage, backup);
    expect((await world.snapshot()).business).toMatchObject({ name: 'Betrieb Muster' });
    expect(await other.snapshot()).toEqual(otherBefore);
  });
});

describe('switching functions on and off, in any order', () => {
  it('leaves the stored list complete and keeps every id nobody here knows', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.tuple(fc.constantFrom(...SWITCHABLE), fc.boolean()), { maxLength: 12 }),
        fc.uniqueArray(fc.constantFrom('later.one', 'later.two', 'Later Three', 'later_four'), {
          maxLength: 4,
        }),
        async (steps, unknown) => {
          const world = await createTestContext({
            registry: REGISTER,
            business: (base: BusinessBase) => BusinessSchema.parse({ ...base, features: unknown }),
          });
          const useCases = createBusinessUseCases(contextOf(world), REGISTERS);
          let on = new Set<string>(FEATURES.resolve([]).features);
          for (const [featureId, wanted] of steps) {
            const result = await useCases['business.features.switch']({
              commandId: world.cmd(),
              businessId: world.businessId,
              featureId,
              on: wanted,
            });
            const stored = BusinessSchema.parse(
              await world.storage.businesses.get(world.businessId),
            );
            const known: string[] = stored.features.filter((id) => FEATURES.has(id));

            // What went along is what changed, and nothing else.
            const after = new Set(known);
            expect([...on].filter((id) => !after.has(id)).sort()).toEqual(
              [...result.turnedOff].sort(),
            );
            expect([...after].filter((id) => !on.has(id)).sort()).toEqual(
              [...result.turnedOn].filter((id) => !on.has(id)).sort(),
            );
            on = after;

            // The list is complete: the core, and everything each function needs.
            expect(known).toEqual(FEATURES.resolve(known).features);
            expect(known).toContain('business');
            // The function asked for is as asked.
            expect(after.has(featureId)).toBe(wanted);
            // Nothing a newer version wrote is lost.
            for (const id of unknown) {
              expect(stored.features).toContain(id);
            }
            expect(stored.features.filter((id) => !FEATURES.has(id)).sort()).toEqual(
              [...unknown].sort(),
            );
          }
        },
      ),
      { numRuns: 60 },
    );
  });
});

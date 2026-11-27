import { filterRowsForDevice, OWNER_PROFILE } from '@onestrand/access';
import type { Business } from '@onestrand/business';
import { availableSlotEntries, type SlotEntries } from '@onestrand/manifest';
import { createMemoryStorage, type AnyTableRegistry } from '@onestrand/storage';
import { businessSnapshot, fixedClock, sequentialIds, testHasher } from '@onestrand/testing';
import { describe, expect, it } from 'vitest';
import {
  ENTRIES_FEATURE,
  RIGHT_JOURNAL_READ,
  STAFF_PROFILE,
  entriesTable,
  musterTableAccess,
  type Entry,
} from '../src';
import {
  addEntry,
  call,
  codeOf,
  composed,
  custom,
  putPerson,
  seed,
  setProfile,
  startFor,
  titles,
  type World,
} from './support';

const switchEntries = (owner: ReturnType<typeof startFor>, world: World, on: boolean) =>
  call(owner, 'business.features.switch', {
    commandId: world.cmd(),
    businessId: world.businessId,
    featureId: ENTRIES_FEATURE,
    on,
  });

describe('the operations of muster', () => {
  it('record an entry with its event, and list it', async () => {
    const { world, owner } = await seed();
    const added = (await addEntry(owner, world, '  Eintrag Muster  ')) as { entry: Entry };
    expect(added.entry).toMatchObject({
      businessId: world.businessId,
      on: '2026-11-14',
      title: 'Eintrag Muster',
      createdAt: world.clock.now(),
    });
    expect(await titles(owner, world)).toEqual(['Eintrag Muster']);
    const { events } = await world.snapshot();
    expect(events.map((event) => event.type).at(-1)).toBe('muster_entry.added');
    expect(events.at(-1)?.payload).toEqual({ entryId: added.entry.id });
    expect(events.at(-1)?.actor).toBe(world.ownerId);
  });

  it('give the stored result back for a repeated commandId and write nothing new', async () => {
    const { world, owner } = await seed();
    const input = {
      commandId: world.cmd(),
      businessId: world.businessId,
      on: '2026-11-14',
      title: 'Eintrag Muster',
    };
    const first = await call(owner, 'muster.entries.add', input);
    const again = await call(owner, 'muster.entries.add', input);
    expect(again).toEqual(first);
    expect(await world.storage.table(entriesTable).ofBusiness(world.businessId)).toHaveLength(1);
  });

  it('refuse an entry that does not fit the schema', async () => {
    const { world, owner } = await seed();
    expect(await codeOf(addEntry(owner, world, ''))).not.toBeUndefined();
    expect(await codeOf(addEntry(owner, world, 'Eintrag', '14.11.2026'))).not.toBeUndefined();
    expect(await world.storage.table(entriesTable).ofBusiness(world.businessId)).toEqual([]);
  });

  it('list by calendar day, newest first, and the option turns the order', async () => {
    const { world, owner } = await seed();
    await addEntry(owner, world, 'Eintrag B', '2026-11-13');
    await addEntry(owner, world, 'Eintrag C', '2026-11-14');
    await addEntry(owner, world, 'Eintrag A', '2026-11-12');
    expect(await titles(owner, world)).toEqual(['Eintrag C', 'Eintrag B', 'Eintrag A']);

    await call(owner, 'business.features.setOption', {
      commandId: world.cmd(),
      businessId: world.businessId,
      featureId: ENTRIES_FEATURE,
      key: 'newestFirst',
      value: false,
    });
    expect(await titles(owner, world)).toEqual(['Eintrag A', 'Eintrag B', 'Eintrag C']);
  });

  it('keep the order of the moment of writing within a day, and leave out deleted entries', async () => {
    const { world, owner } = await seed();
    await addEntry(owner, world, 'Eintrag früh');
    world.clock.advance({ minutes: 5 });
    const later = (await addEntry(owner, world, 'Eintrag spät')) as { entry: Entry };
    world.clock.advance({ minutes: 5 });
    const gone = (await addEntry(owner, world, 'Eintrag weg')) as { entry: Entry };
    expect(await titles(owner, world)).toEqual(['Eintrag weg', 'Eintrag spät', 'Eintrag früh']);
    await world.storage
      .table(entriesTable)
      .put({ ...gone.entry, deletedAt: world.clock.now(), updatedAt: world.clock.now() });
    expect(await titles(owner, world)).toEqual(['Eintrag spät', 'Eintrag früh']);
    expect(later.entry.title).toBe('Eintrag spät');
  });

  it('read an option a newer version stored in a form this one does not know as its default', async () => {
    const { world, owner } = await seed();
    await addEntry(owner, world, 'Eintrag A', '2026-11-12');
    await addEntry(owner, world, 'Eintrag B', '2026-11-13');
    const business = await world.storage.businesses.get(world.businessId);
    if (business === undefined) {
      throw new Error('The business is there');
    }
    await world.storage.businesses.put({
      ...business,
      options: { [ENTRIES_FEATURE]: { newestFirst: 'sometimes', later: 1 } },
    });
    expect(await titles(owner, world)).toEqual(['Eintrag B', 'Eintrag A']);
  });
});

describe('an operation called without the right', () => {
  it('is refused: the level is there, the delicate right is not', async () => {
    const { world, owner } = await seed(composed, STAFF_PROFILE);
    const staff = startFor(world, world.secondPersonId);
    // The staff profile records entries ...
    expect(await codeOf(addEntry(staff, world, 'Eintrag Beispiel'))).toBeUndefined();
    // ... but reading the whole journal needs `muster.journal_read`, and the use case does not run.
    const refused = call(staff, 'muster.entries.list', { businessId: world.businessId });
    expect(await codeOf(refused)).toBe('forbidden');
    await expect(refused).rejects.toThrow(RIGHT_JOURNAL_READ);
    // With the right the same call goes through.
    await setProfile(
      world,
      world.secondPersonId,
      custom({ [ENTRIES_FEATURE]: 'operate' }, [RIGHT_JOURNAL_READ]),
    );
    expect(await titles(staff, world)).toEqual(['Eintrag Beispiel']);
    expect(await titles(owner, world)).toEqual(['Eintrag Beispiel']);
  });

  it('is refused: the right is there, the level is not', async () => {
    const { world } = await seed(
      composed,
      custom({ [ENTRIES_FEATURE]: 'view' }, [RIGHT_JOURNAL_READ]),
    );
    const reader = startFor(world, world.secondPersonId);
    expect(await codeOf(addEntry(reader, world, 'Eintrag'))).toBe('forbidden');
    expect(await titles(reader, world)).toEqual([]);
  });

  it('is refused to a person without a level in the function, and to a stranger', async () => {
    const { world } = await seed(composed, custom());
    const nobody = startFor(world, world.secondPersonId);
    expect(await codeOf(addEntry(nobody, world, 'Eintrag'))).toBe('forbidden');
    const stranger = startFor(world, world.ids.next());
    expect(
      await codeOf(call(stranger, 'muster.entries.list', { businessId: world.businessId })),
    ).toBe('forbidden');
    expect(await world.storage.table(entriesTable).ofBusiness(world.businessId)).toEqual([]);
  });
});

/** What `defineIndustryWeb` (W0-03) will put in the slots, as far as pure TypeScript knows it. */
const slots = {
  routes: [{ id: 'muster.journal', feature: ENTRIES_FEATURE, level: 'view' }],
  capture: [{ id: 'muster.new_entry', feature: ENTRIES_FEATURE, level: 'operate' }],
  sections: [{ id: 'muster.today', page: 'today', feature: ENTRIES_FEATURE }],
} as const satisfies SlotEntries;
const allSlots = [...slots.routes, ...slots.capture, ...slots.sections];

describe('the function switched off', () => {
  it('has no way in, its data stays (in the backup too), and switched on again it is all there', async () => {
    const { world, owner } = await seed();
    await addEntry(owner, world, 'Eintrag A', '2026-11-12');
    await addEntry(owner, world, 'Eintrag B', '2026-11-13');
    const rows = () => world.storage.table(entriesTable).ofBusiness(world.businessId);
    const contextOf = async () => {
      const business = await world.storage.businesses.get(world.businessId);
      return {
        profile: OWNER_PROFILE,
        features: composed.features.resolve(business?.features ?? []).features,
      };
    };
    expect(availableSlotEntries(allSlots, await contextOf())).toEqual(allSlots);

    const off = (await switchEntries(owner, world, false)) as { turnedOff: string[] };
    expect(off.turnedOff).toEqual([ENTRIES_FEATURE]);

    // No way in: not for a command, not for a query, not for the owner, not in a slot.
    expect(await codeOf(addEntry(owner, world, 'Eintrag C'))).toBe('forbidden');
    const list = call(owner, 'muster.entries.list', { businessId: world.businessId });
    expect(await codeOf(list)).toBe('forbidden');
    await expect(list).rejects.toThrow('switched off');
    expect(availableSlotEntries(allSlots, await contextOf())).toEqual([]);
    // The rest of the edition goes on.
    expect(
      await codeOf(call(owner, 'business.get', { businessId: world.businessId })),
    ).toBeUndefined();

    // The data stays: in the storage and in the backup, which comes back whole.
    expect(await rows()).toHaveLength(2);
    const document = await owner.backups.exportBackup(world.storage, world.businessId, {
      clock: world.clock,
    });
    expect(document.tables.muster_entries).toHaveLength(2);
    expect(document.business.features).not.toContain(ENTRIES_FEATURE);
    const checked = await owner.backups.checkBackup(JSON.parse(JSON.stringify(document)));
    expect(checked.preview.problems).toEqual([]);
    const device = createMemoryStorage<AnyTableRegistry, Business>(composed.tables, {
      hasher: testHasher,
      clock: fixedClock(),
      ids: sequentialIds(9000),
    });
    if (checked.backup === undefined) {
      throw new Error('The backup fits');
    }
    await owner.backups.restoreBackup(device, checked.backup);
    expect(await device.table(entriesTable).ofBusiness(world.businessId)).toEqual(await rows());

    // Switched on again: the entries are there, the slots too.
    await switchEntries(owner, world, true);
    expect(await titles(owner, world)).toEqual(['Eintrag B', 'Eintrag A']);
    expect(availableSlotEntries(allSlots, await contextOf())).toEqual(allSlots);
  });

  it('keeps the value of its option while it is off', async () => {
    const { world, owner } = await seed();
    await call(owner, 'business.features.setOption', {
      commandId: world.cmd(),
      businessId: world.businessId,
      featureId: ENTRIES_FEATURE,
      key: 'newestFirst',
      value: false,
    });
    await switchEntries(owner, world, false);
    await switchEntries(owner, world, true);
    const business = await world.storage.businesses.get(world.businessId);
    expect(business?.options[ENTRIES_FEATURE]).toEqual({ newestFirst: false });
  });

  it('shows a slot only to a person who reaches its level', () => {
    const staff = {
      profile: STAFF_PROFILE,
      features: composed.features.resolve([ENTRIES_FEATURE]).features,
    };
    expect(availableSlotEntries(allSlots, staff).map((entry) => entry.id)).toEqual([
      'muster.journal',
      'muster.new_entry',
      'muster.today',
    ]);
    const viewer = { profile: custom({ [ENTRIES_FEATURE]: 'view' }), features: staff.features };
    expect(availableSlotEntries(allSlots, viewer).map((entry) => entry.id)).toEqual([
      'muster.journal',
      'muster.today',
    ]);
  });
});

describe('the rows of muster on another device', () => {
  it('go only to a person with the delicate right, because the table is sensitive', async () => {
    const { world, owner } = await seed();
    await addEntry(owner, world, 'Eintrag Muster');
    const rows = await world.storage.table(entriesTable).ofBusiness(world.businessId);
    const access = musterTableAccess[entriesTable.name];
    const on = composed.features.resolve([ENTRIES_FEATURE]).features;

    const staff = filterRowsForDevice(entriesTable, access, rows, {
      profile: STAFF_PROFILE,
      features: on,
    });
    expect(staff).toEqual({ allowed: false, rows: [], hiddenFields: [] });

    const reader = filterRowsForDevice(entriesTable, access, rows, {
      profile: custom({ [ENTRIES_FEATURE]: 'view' }, [RIGHT_JOURNAL_READ]),
      features: on,
    });
    expect(reader.allowed).toBe(true);
    expect(reader.rows).toEqual(rows);

    const off = filterRowsForDevice(entriesTable, access, rows, {
      profile: OWNER_PROFILE,
      features: composed.features.resolve([]).features,
    });
    expect(off.allowed).toBe(false);
  });
});

describe('two businesses on one storage', () => {
  it('stay apart: an entry of one is not in the other, and no person reaches across', async () => {
    const { world, owner } = await seed();
    const other = await world.addBusiness();
    await putPerson(other, other.ownerId, 'Person Beispiel', OWNER_PROFILE);
    const otherOwner = startFor(other, other.ownerId);
    await switchEntries(otherOwner, other, true);
    const before = await businessSnapshot(other.storage, composed.tables, other.businessId);

    await addEntry(owner, world, 'Nur für Betrieb Muster');

    expect(await businessSnapshot(other.storage, composed.tables, other.businessId)).toEqual(
      before,
    );
    expect(await titles(otherOwner, other)).toEqual([]);
    expect(await codeOf(call(owner, 'muster.entries.list', { businessId: other.businessId }))).toBe(
      'forbidden',
    );
  });
});

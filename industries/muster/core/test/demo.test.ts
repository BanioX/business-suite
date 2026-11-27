import type { Business } from '@onestrand/business';
import type { Id } from '@onestrand/core';
import { startEdition } from '@onestrand/manifest';
import { createMemoryStorage, type AnyTableRegistry } from '@onestrand/storage';
import { businessSnapshot, fixedClock, sequentialIds, testHasher } from '@onestrand/testing';
import { describe, expect, it } from 'vitest';
import {
  ENTRIES_FEATURE,
  MUSTER_DEMO_ENTRIES,
  MUSTER_DEMO_LETTERHEAD,
  STAFF_PROFILE,
  entriesTable,
  layOutMusterDemo,
  musterDemo,
} from '../src';
import { call, codeOf, composed } from './support';

/** An empty device of the edition, and the edition started on it by a person not known yet. */
function emptyDevice(start = 1) {
  const clock = fixedClock();
  const ids = sequentialIds(start);
  const storage = createMemoryStorage<AnyTableRegistry, Business>(composed.tables, {
    hasher: testHasher,
    clock,
    ids,
  });
  const actor: Id = ids.next();
  const running = startEdition(composed, { storage, clock, ids, hasher: testHasher, actor });
  return { clock, ids, storage, actor, running };
}

describe('the demo of muster', () => {
  it('is laid out through the operations on an empty device', async () => {
    const device = emptyDevice();
    const { businessId } = await layOutMusterDemo(device.running.useCases, {
      ...device,
      features: composed.features,
    });

    const { business } = (await call(device.running, 'business.get', { businessId })) as {
      business: Business;
    };
    expect(business).toMatchObject({
      name: musterDemo.businessName,
      industries: ['muster'],
      kinds: musterDemo.kinds,
      canton: 'ZH',
      letterhead: MUSTER_DEMO_LETTERHEAD,
    });
    // The usual extent of its kind and its answer: the function of muster is on.
    expect(business.features).toEqual(['business', ENTRIES_FEATURE]);

    const { people } = (await call(device.running, 'business.people.list', { businessId })) as {
      people: { id: string; name: string; profile: unknown }[];
    };
    expect(people.map((person) => person.name).sort()).toEqual(
      [musterDemo.ownerName, ...musterDemo.people].sort(),
    );
    expect(people.find((person) => person.id === device.actor)?.profile).toEqual({ type: 'owner' });
    expect(people.find((person) => person.name === 'Person Beispiel')?.profile).toEqual(
      STAFF_PROFILE,
    );

    const { entries } = (await call(device.running, 'muster.entries.list', { businessId })) as {
      entries: { title: string; on: string }[];
    };
    expect(entries.map((entry) => `${entry.on} ${entry.title}`)).toEqual([
      '2026-11-14 Eintrag Beispiel',
      '2026-11-13 Eintrag Muster',
    ]);
    expect(entries).toHaveLength(MUSTER_DEMO_ENTRIES.length);

    // Every step went through the contract: one event at least for each command.
    const events = await device.storage.events.ofBusiness(businessId);
    expect(events.map((event) => event.type)).toEqual([
      'business.created',
      'person.created',
      'business.updated',
      'person.created',
      'muster_entry.added',
      'muster_entry.added',
    ]);
  });

  it('passes the guard like any work: the person of the demo is refused what the profile lacks', async () => {
    const device = emptyDevice();
    const { businessId } = await layOutMusterDemo(device.running.useCases, {
      ...device,
      features: composed.features,
    });
    const { people } = (await call(device.running, 'business.people.list', { businessId })) as {
      people: { id: Id; name: string }[];
    };
    const staffId = people.find((person) => person.name === 'Person Beispiel')?.id;
    if (staffId === undefined) {
      throw new Error('The demo has its second person');
    }
    const staff = startEdition(composed, { ...device, hasher: testHasher, actor: staffId });
    expect(await codeOf(call(staff, 'muster.entries.list', { businessId }))).toBe('forbidden');
    expect(
      await codeOf(
        call(staff, 'muster.entries.add', {
          commandId: device.ids.next(),
          businessId,
          on: '2026-11-14',
          title: 'Eintrag Beispiel',
        }),
      ),
    ).toBeUndefined();
  });

  it('is refused on an edition without muster, before anything is written', async () => {
    const device = emptyDevice();
    const useCases = Object.fromEntries(
      Object.entries(device.running.useCases).filter(([name]) => !name.startsWith('muster.')),
    );
    await expect(
      layOutMusterDemo(useCases, { ...device, features: composed.features }),
    ).rejects.toThrow('muster.entries.add');
  });
});

describe('the backup of the demo', () => {
  it('goes there and back: every row of the business and of muster comes back as it was', async () => {
    const device = emptyDevice();
    const { businessId } = await layOutMusterDemo(device.running.useCases, {
      ...device,
      features: composed.features,
    });
    const { backups } = device.running;
    expect(backups.format).toBe('muster-backup');
    expect(backups.version).toBe(1);
    expect(backups.tables).toEqual(['people', 'muster_entries']);

    const before = await businessSnapshot(device.storage, composed.tables, businessId);
    const document = await backups.exportBackup(device.storage, businessId, {
      clock: device.clock,
    });
    expect(document.counts).toEqual({ people: 2, muster_entries: 2 });
    // Through a file: what JSON carries, nothing more.
    const checked = await backups.checkBackup(JSON.parse(JSON.stringify(document)));
    expect(checked.preview.problems).toEqual([]);
    if (checked.backup === undefined) {
      throw new Error('The backup fits');
    }

    const other = emptyDevice(5000);
    await backups.restoreBackup(other.storage, checked.backup);
    const after = await businessSnapshot(other.storage, composed.tables, businessId);
    expect(after.business).toEqual(before.business);
    expect(after.tables).toEqual(before.tables);
    expect(await other.storage.table(entriesTable).ofBusiness(businessId)).toHaveLength(2);
  });

  it('keeps a field of a newer version in an entry, there and back', async () => {
    const device = emptyDevice();
    const { businessId } = await layOutMusterDemo(device.running.useCases, {
      ...device,
      features: composed.features,
    });
    const [entry] = await device.storage.table(entriesTable).ofBusiness(businessId);
    if (entry === undefined) {
      throw new Error('The demo has entries');
    }
    await device.storage
      .table(entriesTable)
      .put({ ...entry, later: { kept: true } } as typeof entry);
    const { backups } = device.running;
    const document = await backups.exportBackup(device.storage, businessId, {
      clock: device.clock,
    });
    const checked = await backups.checkBackup(JSON.parse(JSON.stringify(document)));
    if (checked.backup === undefined) {
      throw new Error('The backup fits');
    }
    const other = emptyDevice(5000);
    await backups.restoreBackup(other.storage, checked.backup);
    const back = await other.storage.table(entriesTable).get(entry.id);
    expect(back).toEqual({ ...entry, later: { kept: true } });
  });

  it('refuses a file of another edition', async () => {
    const device = emptyDevice();
    const { businessId } = await layOutMusterDemo(device.running.useCases, {
      ...device,
      features: composed.features,
    });
    const document = await device.running.backups.exportBackup(device.storage, businessId, {
      clock: device.clock,
    });
    const foreign = { ...JSON.parse(JSON.stringify(document)), format: 'sample-backup' } as unknown;
    const checked = await device.running.backups.checkBackup(foreign);
    expect(checked.backup).toBeUndefined();
    expect(checked.preview.problems.map((problem) => problem.kind)).toContain('format');
  });
});

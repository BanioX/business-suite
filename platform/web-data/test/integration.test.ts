import type { Id } from '@onestrand/core';
import {
  createBackupCipher,
  createBackupKit,
  StorageError,
  WrongPasswordError,
  type BackupDocument,
  type BusinessBase,
  type Storage,
  type StoredFile,
} from '@onestrand/storage';
import { createTestContext } from '@onestrand/testing';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { openIndexedDbStorage, proposeSchemaStep } from '../src';
import {
  bytesOf,
  fixedClock,
  hasher,
  type Note,
  REGISTRY,
  type Registry,
  sequentialIds,
  snapshot,
} from './support';

/**
 * The adapter with the kits of the platform on top of it: the backup through the database and
 * back, and the test context of `@onestrand/testing` on it.
 */

/**
 * The time limit of a test that derives a key from a password: 600 000 rounds of PBKDF2, on
 * purpose slow, and under load (a full run with coverage) far slower than the usual 5 s.
 */
const KEY_DERIVATION_TIMEOUT = 60_000;

const BACKUP_FORMAT = 'sample-backup';

async function device(idStart = 1) {
  const clock = fixedClock();
  const ids = sequentialIds(idStart);
  const factory = new IDBFactory();
  const step = proposeSchemaStep({ ledger: [], tables: REGISTRY });
  const storage = await openIndexedDbStorage<Registry>({
    name: 'sample',
    tables: REGISTRY,
    ledger: step === undefined ? [] : [step],
    ports: { hasher, clock, ids },
    indexedDB: factory,
  });
  const backups = createBackupKit({
    format: BACKUP_FORMAT,
    version: 1,
    registry: REGISTRY,
    hasher,
  });
  return { storage, clock, ids, backups, factory };
}

type Device = Awaited<ReturnType<typeof device>>;

/** A business with notes (one with fields no schema knows), a deleted note, a time entry and a file. */
async function fill(d: Device, name: string) {
  const now = d.clock.now();
  const business: BusinessBase = { id: d.ids.next(), name, createdAt: now, updatedAt: now };
  await d.storage.businesses.add({ ...business, currency: 'CHF', settings: { colour: 'blue' } });
  const stamps = { createdAt: now, updatedAt: now };
  const notes: Note[] = [
    {
      id: d.ids.next(),
      businessId: business.id,
      text: `Notiz von ${name}`,
      ...stamps,
      place: { room: 'Lager', floor: 1, door: 'B' } as Note['place'],
      colour: 'blue',
      nested: { list: [{ a: 1, b: [true, null] }] },
    } as Note,
    { id: d.ids.next(), businessId: business.id, text: 'Entfernt', ...stamps, deletedAt: now },
  ];
  for (const note of notes) {
    await d.storage.table('notes').put(note);
  }
  await d.storage.table('time_entries').add({
    id: d.ids.next(),
    businessId: business.id,
    personId: d.ids.next(),
    minutes: 45,
    at: now,
  });
  // A newer version added a field to the meta data of this file.
  const bytes = bytesOf(`Beleg von ${name}`);
  const sha256 = await hasher.sha256(bytes);
  const file: StoredFile = {
    meta: {
      id: d.ids.next(),
      businessId: business.id,
      sha256,
      size: bytes.length,
      mediaType: 'text/plain',
      name: 'beleg.txt',
      createdAt: now,
      takenAt: '2026-11-13T08:00:00.000Z',
    } as StoredFile['meta'],
    bytes,
  };
  await d.storage.files.restore(file);
  await d.storage.table('device_settings').add({
    id: d.ids.next(),
    businessId: business.id,
    key: 'printer',
    value: 'A4',
  });
  return business.id;
}

/** A business from one device to another, the way a person does it: through a file, checked by the kit that restores it. */
async function bring(from: Device, to: Device, businessId: Id): Promise<void> {
  const document = await from.backups.exportBackup(from.storage, businessId, { clock: from.clock });
  const { preview, backup } = await to.backups.checkBackup(JSON.parse(JSON.stringify(document)));
  if (backup === undefined) {
    throw new Error(`The backup was refused: ${JSON.stringify(preview.problems)}`);
  }
  await to.backups.restoreBackup(to.storage, backup);
}
/** Everything the backup carries, for comparing two devices: no events, no log, no device tables. */
async function carried(storage: Storage<Registry>, businessId: Id) {
  const { tables, files, business } = await snapshot(storage, businessId);
  const rest = Object.entries(tables).filter(([name]) => name !== 'device_settings');
  return { business, tables: Object.fromEntries(rest), files };
}

describe('the backup through the database and back', () => {
  it('brings a business to another device exactly as it was, unknown fields and all', async () => {
    const one = await device();
    const id = await fill(one, 'Betrieb Muster');
    const other = await device(500_000);
    await bring(one, other, id);
    expect(await carried(other.storage, id)).toEqual(await carried(one.storage, id));
    // What stands in no backup stays on its device.
    expect(await other.storage.table('device_settings').ofBusiness(id)).toEqual([]);
    expect(await one.storage.table('device_settings').ofBusiness(id)).toHaveLength(1);
    // The fields no schema knows survived, at every depth.
    const note = (await other.storage.table('notes').ofBusiness(id)).find(
      (row) => row.text !== 'Entfernt',
    );
    expect(note).toMatchObject({
      colour: 'blue',
      place: { room: 'Lager', floor: 1, door: 'B' },
      nested: { list: [{ a: 1, b: [true, null] }] },
    });
    expect(await other.storage.businesses.get(id)).toMatchObject({
      currency: 'CHF',
      settings: { colour: 'blue' },
    });
    const files = await other.storage.files.ofBusiness(id);
    expect(files[0]).toMatchObject({ takenAt: '2026-11-13T08:00:00.000Z' });
    expect(await other.storage.files.verify(files[0]?.id ?? id)).toBe(true);
  });

  it('replaces a business on the same device and leaves the other one alone', async () => {
    const d = await device();
    const mine = await fill(d, 'Betrieb Muster');
    const theirs = await fill(d, 'Betrieb Beispiel');
    const document = await d.backups.exportBackup(d.storage, mine, { clock: d.clock });
    const { backup } = await d.backups.checkBackup(JSON.parse(JSON.stringify(document)));
    if (backup === undefined) {
      throw new Error('The backup was refused');
    }
    const before = {
      mine: await carried(d.storage, mine),
      theirs: await carried(d.storage, theirs),
    };

    // After the backup: one note changed, one added, the file's business gets a second file.
    const changed = (await d.storage.table('notes').ofBusiness(mine))[0];
    if (changed === undefined) {
      throw new Error('The business has no note');
    }
    await d.storage.table('notes').put({ ...changed, text: 'Nachher geändert' });
    await d.storage.files.put({ businessId: mine, bytes: bytesOf('Neu'), mediaType: 'text/plain' });

    const result = await d.backups.restoreBackup(d.storage, backup);
    expect(result).toBeDefined();
    expect(await carried(d.storage, mine)).toEqual(before.mine);
    expect(await carried(d.storage, theirs)).toEqual(before.theirs);
  });

  it('leaves the device as it was when the restore fails halfway', async () => {
    const source = await device();
    const id = await fill(source, 'Betrieb Muster');
    // On the other device another business already holds the id of the file in the backup.
    const target = await device(500_000);
    const stranger = await fill(target, 'Betrieb Beispiel');
    const taken = (await source.storage.files.ofBusiness(id))[0];
    if (taken === undefined) {
      throw new Error('The business has no file');
    }
    const bytes = bytesOf('Fremde Datei');
    await target.storage.files.restore({
      meta: {
        ...taken,
        businessId: stranger,
        sha256: await hasher.sha256(bytes),
        size: bytes.length,
      },
      bytes,
    });
    const before = await carried(target.storage, stranger);

    const failure: unknown = await bring(source, target, id).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(StorageError);
    expect(failure).toMatchObject({ code: 'exists' });
    expect(await carried(target.storage, stranger)).toEqual(before);
    expect(await target.storage.businesses.get(id)).toBeUndefined();
    expect(await target.storage.table('notes').ofBusiness(id)).toEqual([]);
  });

  it(
    'goes through a password and back: a wrong one is told apart, the right one gives the same business',
    async () => {
      const one = await device();
      const id = await fill(one, 'Betrieb Muster');
      const cipher = createBackupCipher({ crypto: globalThis.crypto, format: BACKUP_FORMAT });
      const document = await one.backups.exportBackup(one.storage, id, { clock: one.clock });
      const sealed = await cipher.encryptBackup(JSON.stringify(document), 'ein langes Passwort');
      expect(sealed).not.toContain('Betrieb Muster');

      const envelope = cipher.readEnvelope(JSON.parse(sealed));
      if (envelope === 'invalid' || envelope === 'plain') {
        throw new Error(`The envelope was read as ${envelope}`);
      }
      await expect(cipher.decryptBackup(envelope, 'ein falsches Passwort')).rejects.toBeInstanceOf(
        WrongPasswordError,
      );
      const plain = JSON.parse(
        await cipher.decryptBackup(envelope, 'ein langes Passwort'),
      ) as BackupDocument;
      const other = await device(500_000);
      const { backup } = await other.backups.checkBackup(plain);
      if (backup === undefined) {
        throw new Error('The backup was refused');
      }
      await other.backups.restoreBackup(other.storage, backup);
      expect(await carried(other.storage, id)).toEqual(await carried(one.storage, id));
    },
    KEY_DERIVATION_TIMEOUT,
  );
});

describe('the test context of the platform on the database', () => {
  it('seeds a business and keeps a second one apart', async () => {
    const d = await device(900_000);
    const one = await createTestContext({ registry: REGISTRY, storage: d.storage });
    const two = await one.addBusiness();
    const before = await two.snapshot();
    const now = one.clock.now();
    await one.storage.table('notes').put({
      id: one.ids.next(),
      businessId: one.businessId,
      text: 'Schlüssel beim Empfang',
      createdAt: now,
      updatedAt: now,
    });
    await one.storage.files.put({
      businessId: one.businessId,
      bytes: bytesOf('Foto'),
      mediaType: 'image/jpeg',
    });
    expect(await two.snapshot()).toEqual(before);
    expect((await one.snapshot()).tables.notes).toHaveLength(1);
    expect((await one.snapshot()).files).toHaveLength(1);
    expect((await d.storage.businesses.all()).map((business) => business.name)).toEqual([
      'Betrieb Muster',
      'Betrieb Beispiel',
    ]);
  });
});

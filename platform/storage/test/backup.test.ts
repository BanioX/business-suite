// Origin: BanioX/Randen packages/core/test/settings-backup.test.ts @ e0f0907 — adapted: the backup kit on a sample register with two made-up businesses instead of use cases on a fixed list of tables; tests for files, the password, loose reading, versions and readers, counts, unknown fields, the frozen result of the check and the rules of a caller added
import { CommandError } from '@onestrand/contract';
import type { Id } from '@onestrand/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  BACKUP_PROBLEM_KINDS,
  base64Encode,
  BusinessBaseSchema,
  createBackupCipher,
  createBackupKit,
  createMemoryStorage,
  StorageError,
  type BackupProblem,
  type BackupReader,
  type CheckedBackup,
} from '../src';
import {
  bytesOf,
  createTestStorage,
  fixedClock,
  hasher,
  KEY_DERIVATION_TIMEOUT,
  plainJson,
  REGISTRY,
  sequentialIds,
  snapshot,
  type Registry,
  type TestStorage,
} from './support';

const FORMAT = 'sample-backup';
const kit = createBackupKit({ format: FORMAT, version: 1, registry: REGISTRY, hasher });

/** A backup as the tests read and alter it: loosely typed, so broken files can be built. */
interface Doc {
  format?: unknown;
  version?: unknown;
  exportedAt?: unknown;
  business?: Record<string, unknown>;
  counts: Record<string, unknown>;
  tables: Record<string, Record<string, unknown>[] | undefined>;
  files: { meta: Record<string, unknown>; data: unknown; [key: string]: unknown }[];
  [key: string]: unknown;
}

/** A business with notes (one soft-deleted), bookings, a device setting and two files. */
async function seed(t: TestStorage, businessId: Id, personId: Id) {
  const photo = await t.storage.files.put({
    businessId,
    bytes: bytesOf(`Foto vorher, ${businessId}`),
    mediaType: 'image/jpeg',
    name: 'vorher.jpg',
  });
  const receipt = await t.storage.files.put({
    businessId,
    bytes: Uint8Array.of(0, 255, 128, 7),
    mediaType: 'application/pdf',
  });
  const notes = [
    t.note(businessId, 'Schlüssel beim Hauswart', { fileId: photo.id, tags: ['zugang'] }),
    t.note(businessId, 'Treppenhaus', {
      place: { room: 'Eingang', floor: 0 },
      lines: [
        { label: 'wischen', minutes: 30 },
        { label: 'Fenster', minutes: 45 },
      ],
    }),
    t.note(businessId, 'Erledigt', { deletedAt: t.clock.now() }),
  ];
  for (const note of notes) {
    await t.storage.table('notes').add(note);
  }
  const entries = [t.timeEntry(businessId, personId, 90), t.timeEntry(businessId, personId, -15)];
  for (const entry of entries) {
    await t.storage.table('time_entries').add(entry);
  }
  await t.storage.table('device_settings').add({
    id: t.ids.next(),
    businessId,
    key: 'printer',
    value: 'A4',
  });
  return { notes, entries, photo, receipt };
}

async function setup() {
  const t = await createTestStorage();
  const one = await seed(t, t.one.business.id, t.one.personId);
  const two = await seed(t, t.two.business.id, t.two.personId);
  return { t, one, two };
}

/** The backup of «Betrieb Muster», as a file gives it back. */
async function exported(t: TestStorage): Promise<Doc> {
  const document = await kit.exportBackup(t.storage, t.one.business.id, { clock: t.clock });
  return JSON.parse(JSON.stringify(document)) as Doc;
}

async function problemsOf(data: unknown): Promise<BackupProblem[]> {
  const check = await kit.checkBackup(data);
  expect(check.preview.importable).toBe(check.preview.problems.length === 0);
  expect(check.backup === undefined).toBe(check.preview.problems.length > 0);
  return check.preview.problems;
}

async function checked(data: unknown): Promise<CheckedBackup<Registry>> {
  const check = await kit.checkBackup(data);
  if (check.backup === undefined) {
    throw new Error(`The backup does not fit: ${JSON.stringify(check.preview.problems)}`);
  }
  return check.backup;
}

/** A second device: an empty storage with ids of its own. */
function otherDevice() {
  return createMemoryStorage(REGISTRY, {
    hasher,
    clock: fixedClock('2027-02-01'),
    ids: sequentialIds(500_000),
  });
}

describe('createBackupKit', () => {
  it('carries its format, its version and the tables of a backup', () => {
    expect(kit.format).toBe(FORMAT);
    expect(kit.version).toBe(1);
    // The table that stays on the device is not part of it.
    expect(kit.tables).toEqual(['notes', 'time_entries']);
    expect(Object.isFrozen(kit.tables)).toBe(true);
  });

  it.each(['', '  ', ' padded', 'padded '])('refuses the format name %j', (format) => {
    expect(() => createBackupKit({ format, version: 1, registry: REGISTRY, hasher })).toThrow(
      TypeError,
    );
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53])(
    'refuses the version %d',
    (version) => {
      expect(() =>
        createBackupKit({ format: FORMAT, version, registry: REGISTRY, hasher }),
      ).toThrow(TypeError);
    },
  );

  it('asks for a reader of every older version, so no file ever written stays unread', () => {
    const reader: BackupReader = (document) => document;
    const base = { format: FORMAT, registry: REGISTRY, hasher };
    expect(() => createBackupKit({ ...base, version: 2 })).toThrow(
      'Version 2 of a backup needs a reader for version 1',
    );
    expect(() => createBackupKit({ ...base, version: 3, readers: { 1: reader } })).toThrow(
      'Version 3 of a backup needs a reader for version 2',
    );
    expect(() => createBackupKit({ ...base, version: 3, readers: { 2: reader } })).toThrow(
      'Version 3 of a backup needs a reader for version 1',
    );
    expect(
      createBackupKit({ ...base, version: 3, readers: { 1: reader, 2: reader } }).version,
    ).toBe(3);
  });

  it('refuses a reader that belongs to no older version', () => {
    const reader: BackupReader = (document) => document;
    const base = { format: FORMAT, registry: REGISTRY, hasher };
    expect(() => createBackupKit({ ...base, version: 1, readers: { 1: reader } })).toThrow(
      TypeError,
    );
    expect(() =>
      createBackupKit({ ...base, version: 2, readers: { 1: reader, 2: reader } }),
    ).toThrow(TypeError);
    expect(() =>
      createBackupKit({ ...base, version: 2, readers: { 0: reader, 1: reader } }),
    ).toThrow(TypeError);
    expect(() =>
      createBackupKit({
        ...base,
        version: 2,
        readers: { 1: 'no function' as unknown as BackupReader },
      }),
    ).toThrow(TypeError);
  });
});

describe('exportBackup', () => {
  it('writes the whole business as one document with every table of the backup and counts', async () => {
    const { t, one } = await setup();
    const document = await kit.exportBackup(t.storage, t.one.business.id, { clock: t.clock });
    expect(Object.keys(document)).toEqual([
      'format',
      'version',
      'exportedAt',
      'business',
      'tables',
      'counts',
      'files',
    ]);
    expect(document).toMatchObject({ format: FORMAT, version: 1 });
    expect(document.exportedAt).toBe('2026-11-14T10:00:00.000Z');
    expect(document.business).toEqual(t.one.business);
    expect(Object.keys(document.tables)).toEqual(['notes', 'time_entries']);
    expect(document.tables.notes).toEqual(one.notes);
    expect(document.tables.time_entries).toEqual(one.entries);
    expect(document.counts).toEqual({ notes: 3, time_entries: 2 });
  });

  it('writes the files with what the storage knows about them and their bytes as Base64', async () => {
    const { t, one } = await setup();
    const document = await kit.exportBackup(t.storage, t.one.business.id, { clock: t.clock });
    expect(document.files).toEqual([
      { meta: one.photo, data: base64Encode(bytesOf(`Foto vorher, ${t.one.business.id}`)) },
      { meta: one.receipt, data: 'AP+ABw==' },
    ]);
  });

  it('includes soft-deleted rows, so a later sync can tell «deleted» from «never seen»', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    const removed = doc.tables.notes?.find((row) => row.text === 'Erledigt');
    expect(removed?.deletedAt).toBeDefined();
  });

  it('leaves out the table that is not part of the backup', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    expect(doc.tables).not.toHaveProperty('device_settings');
    expect(doc.counts).not.toHaveProperty('device_settings');
    expect(JSON.stringify(doc)).not.toContain('printer');
  });

  it('holds nothing of another business on the device', async () => {
    const { t, two } = await setup();
    const text = JSON.stringify(await exported(t));
    expect(text).not.toContain(t.two.business.id);
    expect(text).not.toContain('Betrieb Beispiel');
    expect(text).not.toContain(two.photo.id);
  });

  it('keeps the business row whole: fields the storage does not know are part of it', async () => {
    const { t } = await setup();
    const full = { ...t.one.business, currency: 'CHF', functions: ['customers', 'time'] };
    await t.storage.businesses.put(full);
    expect((await exported(t)).business).toEqual(full);
  });

  it('writes the rows as they are stored, unknown fields included', async () => {
    const { t, one } = await setup();
    const newer = {
      ...one.notes[0],
      colour: 'blue',
      place: { room: 'Lager', floor: 1, door: 'B' },
    };
    await t.storage.table('notes').put(newer as (typeof one.notes)[number]);
    const doc = await exported(t);
    expect(doc.tables.notes?.find((row) => row.id === newer.id)).toEqual(newer);
  });

  it('gives the same file for the same business, whatever order the rows were written in', async () => {
    const { t } = await setup();
    // An id that sorts before all others, written last.
    const early = { ...t.note(t.one.business.id, 'Früh'), id: sequentialIds(0).next() };
    await t.storage.table('notes').add(early);
    const doc = await exported(t);
    const ids = (doc.tables.notes ?? []).map((row) => String(row.id));
    expect(ids).toEqual([...ids].sort());
    expect(ids[0]).toBe(early.id);
    const fileIds = doc.files.map((file) => String(file.meta.id));
    expect(fileIds).toEqual([...fileIds].sort());
    expect(await exported(t)).toEqual(doc);
  });

  it('is plain data: the file gives back exactly what was written', async () => {
    const { t } = await setup();
    const document = await kit.exportBackup(t.storage, t.one.business.id, { clock: t.clock });
    expect(JSON.parse(JSON.stringify(document))).toStrictEqual(document);
  });

  it('does not write anything', async () => {
    const { t } = await setup();
    const before = await snapshot(t.storage, t.one.business.id);
    await exported(t);
    expect(await snapshot(t.storage, t.one.business.id)).toEqual(before);
    expect(await t.storage.events.ofBusiness(t.one.business.id)).toEqual([]);
  });

  it('fails for a business that does not exist', async () => {
    const { t } = await setup();
    const error = await kit
      .exportBackup(t.storage, t.ids.next(), { clock: t.clock })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(CommandError);
    expect((error as CommandError).code).toBe('not_found');
  });

  it('fails if the storage lists a file it cannot read, instead of writing a backup without it', async () => {
    const { t, one } = await setup();
    // A storage whose bytes of one file are gone, as a damaged database would have it.
    const damaged = {
      ...t.storage,
      files: {
        ...t.storage.files,
        get: (id: Id) =>
          id === one.receipt.id ? Promise.resolve(undefined) : t.storage.files.get(id),
      },
    };
    const error = await kit
      .exportBackup(damaged, t.one.business.id, { clock: t.clock })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(StorageError);
    expect((error as StorageError).code).toBe('invalid_file');
    expect((error as StorageError).message).toBe(
      `File ${one.receipt.id} is listed for the business but cannot be read`,
    );
  });

  it('writes a business without rows and files', async () => {
    const t = await createTestStorage();
    const document = await kit.exportBackup(t.storage, t.one.business.id, { clock: t.clock });
    expect(document.tables).toEqual({ notes: [], time_entries: [] });
    expect(document.counts).toEqual({ notes: 0, time_entries: 0 });
    expect(document.files).toEqual([]);
    expect(await problemsOf(JSON.parse(JSON.stringify(document)))).toEqual([]);
  });
});

describe('checkBackup', () => {
  it('reads a backup of this version and says what it holds', async () => {
    const { t } = await setup();
    const check = await kit.checkBackup(await exported(t));
    expect(check.preview).toEqual({
      recognised: true,
      importable: true,
      version: 1,
      businessId: t.one.business.id,
      businessName: 'Betrieb Muster',
      exportedAt: '2026-11-14T10:00:00.000Z',
      // Rows: the sum of all tables (3 + 2).
      rows: 5,
      counts: { notes: 3, time_entries: 2 },
      files: 2,
      problems: [],
    });
    expect(check.backup).toBeDefined();
  });

  it('hands back the business, the rows and the files as they will be written', async () => {
    const { t, one } = await setup();
    const backup = await checked(await exported(t));
    expect(backup.business).toEqual(t.one.business);
    expect(backup.exportedAt).toBe('2026-11-14T10:00:00.000Z');
    expect(backup.tables).toEqual({ notes: one.notes, time_entries: one.entries });
    expect(backup.files).toEqual([
      { meta: one.photo, bytes: bytesOf(`Foto vorher, ${t.one.business.id}`) },
      { meta: one.receipt, bytes: Uint8Array.of(0, 255, 128, 7) },
    ]);
    expect(Object.isFrozen(backup)).toBe(true);
  });

  it('hands back a backup nobody can change between the check and the restore', async () => {
    const { t } = await setup();
    const backup = await checked(await exported(t));
    const note = backup.tables.notes?.[1];
    const photo = backup.files[0];
    if (note === undefined || photo === undefined) {
      throw new Error('The backup has notes and files');
    }
    // What was checked is what will be written: every attempt to change it fails.
    const attempts: (() => void)[] = [
      () => {
        note.businessId = t.two.business.id;
      },
      () => {
        note.text = 'changed after the check';
      },
      () => {
        note.lines?.push({ label: 'neu', minutes: 1 });
      },
      () => {
        Object.assign(note.place ?? {}, { floor: 9 });
      },
      () => {
        Object.assign(note, { added: true });
      },
      () => {
        (backup.tables.notes as unknown[]).pop();
      },
      () => {
        Object.assign(backup.tables, { notes: [] });
      },
      () => {
        Object.assign(backup.business, { name: 'Umbenannt' });
      },
      () => {
        photo.meta.businessId = t.two.business.id;
      },
      () => {
        Object.assign(photo, { bytes: new Uint8Array() });
      },
      () => {
        (backup.files as unknown[]).pop();
      },
      () => {
        Object.assign(backup, { tables: {} });
      },
    ];
    for (const [index, attempt] of attempts.entries()) {
      expect(attempt, `attempt ${index}`).toThrow(TypeError);
    }
  });

  it.each([
    ['a file of another format', { format: 'other-export', items: [] }],
    ['a file without a format', { version: 1 }],
    ['nothing', null],
    ['no value', undefined],
    ['a list', []],
    ['a text', 'Text'],
    ['a number', 7],
  ])('refuses %s, without a version to show', async (_what, data) => {
    const check = await kit.checkBackup(data);
    expect(check).toEqual({
      preview: {
        recognised: false,
        importable: false,
        rows: 0,
        counts: { notes: 0, time_entries: 0 },
        files: 0,
        problems: [{ kind: 'format' }],
      },
    });
  });

  it('refuses a file from a newer version and names the version', async () => {
    const { t } = await setup();
    const doc = { ...(await exported(t)), version: 2 };
    const check = await kit.checkBackup(doc);
    expect(check.preview).toMatchObject({
      recognised: false,
      importable: false,
      version: 2,
      rows: 0,
      problems: [{ kind: 'version', version: '2' }],
    });
    expect(check.backup).toBeUndefined();
  });

  it.each([
    ['a record', { major: 1 }, [{ kind: 'version' }]],
    ['missing', undefined, [{ kind: 'version' }]],
    ['a text', '1', [{ kind: 'version', version: '1' }]],
    ['zero', 0, [{ kind: 'version', version: '0' }]],
    ['negative', -1, [{ kind: 'version', version: '-1' }]],
    ['no whole number', 1.5, [{ kind: 'version', version: '1.5' }]],
  ])('refuses a version that is %s', async (_what, version, problems) => {
    const { t } = await setup();
    const check = await kit.checkBackup({ ...(await exported(t)), version });
    expect(check.preview.problems).toEqual(problems);
    expect(check.preview.recognised).toBe(false);
    expect(check.preview).not.toHaveProperty('version');
  });

  it('lists every row that does not fit its schema, with table and id', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    const broken = doc.tables.time_entries?.[0] ?? {};
    // Minutes are whole numbers.
    doc.tables.time_entries = [
      { ...broken, minutes: 90.5 },
      ...(doc.tables.time_entries ?? []).slice(1),
    ];
    const check = await kit.checkBackup(doc);
    expect(check.preview.problems).toEqual([{ kind: 'row', table: 'time_entries', id: broken.id }]);
    expect(check.preview).toMatchObject({ recognised: true, importable: false, rows: 5 });
    expect(check.backup).toBeUndefined();
  });

  it('refuses a row without an id, a row that is none, and a row of another business', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    const first = doc.tables.notes?.[0] ?? {};
    doc.tables.notes = [
      { text: 'ohne Id' },
      'kein Datensatz' as unknown as Record<string, unknown>,
      { ...first, businessId: t.two.business.id },
      { ...first, id: 7 },
    ];
    doc.counts.notes = 4;
    expect(await problemsOf(doc)).toEqual([
      { kind: 'row', table: 'notes' },
      { kind: 'row', table: 'notes' },
      { kind: 'row', table: 'notes', id: first.id },
      { kind: 'row', table: 'notes' },
    ]);
  });

  it('refuses an id that occurs twice in a table', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    const first = doc.tables.notes?.[0] ?? {};
    doc.tables.notes = [...(doc.tables.notes ?? []), { ...first, text: 'Doppelt' }];
    doc.counts.notes = 4;
    expect(await problemsOf(doc)).toEqual([{ kind: 'row', table: 'notes', id: first.id }]);
  });

  it('refuses a row that carries the key which would replace a prototype', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    const text = JSON.stringify(doc).replace('"tags":', '"__proto__":{"admin":true},"tags":');
    const first = doc.tables.notes?.[0] ?? {};
    expect(await problemsOf(JSON.parse(text))).toEqual([
      { kind: 'row', table: 'notes', id: first.id },
    ]);
  });

  it('names a missing and an unknown table, and a broken business row', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    delete doc.tables.time_entries;
    doc.tables.customers = [];
    doc.business = { name: 'kaputt' };
    const check = await kit.checkBackup(doc);
    expect(check.preview.problems).toEqual([
      { kind: 'business' },
      { kind: 'table', table: 'time_entries' },
      { kind: 'table', table: 'customers' },
    ]);
    expect(check.preview).not.toHaveProperty('businessName');
    expect(check.preview).not.toHaveProperty('businessId');
    expect(check.preview.counts).toEqual({ notes: 3, time_entries: 0 });
  });

  it('refuses a business row that carries the key which would replace a prototype', async () => {
    const { t } = await setup();
    const text = JSON.stringify(await exported(t)).replace(
      '"name":"Betrieb Muster"',
      '"name":"Betrieb Muster","__proto__":{"admin":true}',
    );
    const check = await kit.checkBackup(JSON.parse(text));
    expect(check.preview.problems).toEqual([{ kind: 'business' }]);
    expect(check.preview).not.toHaveProperty('businessName');
    expect(({} as { admin?: boolean }).admin).toBeUndefined();
  });

  it('refuses a table that is no list', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    (doc.tables as Record<string, unknown>).notes = { rows: [] };
    expect(await problemsOf(doc)).toEqual([{ kind: 'table', table: 'notes' }]);
  });

  it('refuses a table of the register that has no place in a backup', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    doc.tables.device_settings = [];
    expect(await problemsOf(doc)).toEqual([{ kind: 'table', table: 'device_settings' }]);
  });

  it('refuses a file without tables with one problem that says so', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    for (const tables of [undefined, null, [], 'notes']) {
      expect(await problemsOf({ ...doc, tables })).toEqual([{ kind: 'table' }]);
    }
  });

  it('refuses a field of the document it does not know, because it could not keep it', async () => {
    const { t } = await setup();
    const doc = { ...(await exported(t)), app: 'Muster', settings: { theme: 'dark' } };
    const check = await kit.checkBackup(doc);
    expect(check.preview.problems).toEqual([
      { kind: 'field', field: 'app' },
      { kind: 'field', field: 'settings' },
    ]);
    expect(check.preview).toMatchObject({ recognised: true, importable: false });
    expect(check.backup).toBeUndefined();
  });

  it('refuses a file that does not say when it was written', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    expect(await problemsOf({ ...doc, exportedAt: '14.11.2026' })).toEqual([
      { kind: 'field', field: 'exportedAt' },
    ]);
    const without: Record<string, unknown> = { ...doc };
    delete without.exportedAt;
    const check = await kit.checkBackup(without);
    expect(check.preview.problems).toEqual([{ kind: 'field', field: 'exportedAt' }]);
    expect(check.preview).not.toHaveProperty('exportedAt');
  });

  it('refuses a file that does not hold as many rows as it says', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    // A row cut out of the file by hand: the count gives it away.
    doc.tables.notes = (doc.tables.notes ?? []).slice(1);
    expect(await problemsOf(doc)).toEqual([{ kind: 'count', table: 'notes' }]);
  });

  it.each([
    ['says nothing about the rows', undefined, [{ kind: 'count' }]],
    ['counts in a list', [3, 2], [{ kind: 'count' }]],
    ['misses a table', { notes: 3 }, [{ kind: 'count', table: 'time_entries' }]],
    ['counts in text', { notes: '3', time_entries: 2 }, [{ kind: 'count', table: 'notes' }]],
    [
      'counts a table it does not hold',
      { notes: 3, time_entries: 2, customers: 0 },
      [{ kind: 'count', table: 'customers' }],
    ],
  ])('refuses a file that %s', async (_what, counts, problems) => {
    const { t } = await setup();
    expect(await problemsOf({ ...(await exported(t)), counts })).toEqual(problems);
  });

  it('says one thing only about a table that is missing altogether', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    delete doc.tables.notes;
    expect(await problemsOf(doc)).toEqual([{ kind: 'table', table: 'notes' }]);
  });

  describe('files', () => {
    it('refuses a backup without its list of files', async () => {
      const { t } = await setup();
      const doc = await exported(t);
      for (const files of [undefined, null, {}, 'none']) {
        expect(await problemsOf({ ...doc, files })).toEqual([{ kind: 'file' }]);
      }
    });

    it('refuses a file whose bytes do not match its checksum', async () => {
      const { t, one } = await setup();
      const doc = await exported(t);
      const [photo, receipt] = doc.files;
      if (photo === undefined || receipt === undefined) {
        throw new Error('The backup has two files');
      }
      // Same length, one byte changed: only the checksum can tell.
      doc.files = [photo, { ...receipt, data: 'AP+ACA==' }];
      const check = await kit.checkBackup(doc);
      expect(check.preview.problems).toEqual([{ kind: 'file', id: one.receipt.id }]);
      expect(check.preview.files).toBe(2);
    });

    it.each([
      ['more bytes than it says', (meta: Record<string, unknown>) => ({ meta, data: 'AP+ABwA=' })],
      [
        'a size that is not the size of its bytes',
        (meta: Record<string, unknown>) => ({ meta: { ...meta, size: 5 }, data: 'AP+ABw==' }),
      ],
      [
        'bytes that are no Base64',
        (meta: Record<string, unknown>) => ({ meta, data: 'AP+A Bw==' }),
      ],
      ['bytes that are no text', (meta: Record<string, unknown>) => ({ meta, data: [0, 255] })],
      ['no bytes', (meta: Record<string, unknown>) => ({ meta })],
      [
        'a field the backup does not know',
        (meta: Record<string, unknown>) => ({ meta, data: 'AP+ABw==', thumbnail: 'AA==' }),
      ],
      [
        'a media type that is none',
        (meta: Record<string, unknown>) => ({
          meta: { ...meta, mediaType: 'PDF' },
          data: 'AP+ABw==',
        }),
      ],
      [
        'a checksum that is none',
        (meta: Record<string, unknown>) => ({ meta: { ...meta, sha256: 'abc' }, data: 'AP+ABw==' }),
      ],
    ])('refuses a file with %s', async (_what, change) => {
      const { t, one } = await setup();
      const doc = await exported(t);
      const [photo, receipt] = doc.files;
      if (photo === undefined || receipt === undefined) {
        throw new Error('The backup has two files');
      }
      doc.files = [photo, change(receipt.meta) as Doc['files'][number]];
      expect(await problemsOf(doc)).toEqual([{ kind: 'file', id: one.receipt.id }]);
    });

    it('refuses an entry that is no file, a file of another business and a file twice', async () => {
      const { t, one } = await setup();
      const doc = await exported(t);
      const [photo, receipt] = doc.files;
      if (photo === undefined || receipt === undefined) {
        throw new Error('The backup has two files');
      }
      doc.files = [
        'vorher.jpg' as unknown as Doc['files'][number],
        { meta: 'none' as unknown as Record<string, unknown>, data: 'AA==' },
        { ...photo, meta: { ...photo.meta, businessId: t.two.business.id } },
        receipt,
        receipt,
      ];
      expect(await problemsOf(doc)).toEqual([
        { kind: 'file' },
        { kind: 'file' },
        { kind: 'file', id: one.photo.id },
        { kind: 'file', id: one.receipt.id },
      ]);
    });

    it('lets a broken hasher fail instead of calling every file damaged', async () => {
      const { t } = await setup();
      const broken = createBackupKit({
        format: FORMAT,
        version: 1,
        registry: REGISTRY,
        hasher: { sha256: () => Promise.resolve('not a checksum') },
      });
      await expect(broken.checkBackup(await exported(t))).rejects.toThrow(TypeError);
    });
  });

  it('writes nothing and leaves what it was given as it is', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    const text = JSON.stringify(doc);
    const before = await snapshot(t.storage, t.one.business.id);
    await kit.checkBackup(doc);
    expect(JSON.stringify(doc)).toBe(text);
    expect(await snapshot(t.storage, t.one.business.id)).toEqual(before);
  });

  it('shares nothing with what it was given', async () => {
    const { t, one } = await setup();
    const doc = await exported(t);
    const backup = await checked(doc);
    for (const row of doc.tables.notes ?? []) {
      row.text = 'changed after the check';
    }
    if (doc.business !== undefined) {
      doc.business.name = 'changed after the check';
    }
    expect(backup.tables.notes).toEqual(one.notes);
    expect(backup.business.name).toBe('Betrieb Muster');
  });

  it('knows the kinds of its problems', () => {
    expect(BACKUP_PROBLEM_KINDS).toEqual([
      'format',
      'version',
      'field',
      'business',
      'table',
      'row',
      'count',
      'file',
    ]);
  });
});

describe('checkBackup with rules of the caller', () => {
  const noNotes: BackupProblem = { kind: 'sample.no_notes' };

  it('adds the problems of the caller, which keep the file from coming back', async () => {
    const strict = createBackupKit({
      format: FORMAT,
      version: 1,
      registry: REGISTRY,
      hasher,
      validate: (backup) => ((backup.tables.notes ?? []).length > 5 ? [] : [noNotes]),
    });
    const { t } = await setup();
    const check = await strict.checkBackup(await exported(t));
    expect(check.preview).toMatchObject({
      recognised: true,
      importable: false,
      businessName: 'Betrieb Muster',
      rows: 5,
      problems: [noNotes],
    });
    expect(check.backup).toBeUndefined();
  });

  it('waits for a rule that takes its time, and accepts a file the rule accepts', async () => {
    const seen: string[] = [];
    const patient = createBackupKit({
      format: FORMAT,
      version: 1,
      registry: REGISTRY,
      hasher,
      validate: async (backup) => {
        await Promise.resolve();
        seen.push(backup.business.name);
        return [];
      },
    });
    const { t } = await setup();
    const check = await patient.checkBackup(await exported(t));
    expect(seen).toEqual(['Betrieb Muster']);
    expect(check.preview.importable).toBe(true);
    expect(check.backup).toBeDefined();
  });

  it('asks the caller only once everything else fits', async () => {
    let asked = 0;
    const counting = createBackupKit({
      format: FORMAT,
      version: 1,
      registry: REGISTRY,
      hasher,
      validate: () => {
        asked += 1;
        return [];
      },
    });
    const { t } = await setup();
    const doc = await exported(t);
    await counting.checkBackup({ ...doc, version: 9 });
    await counting.checkBackup({ ...doc, app: 'Muster' });
    await counting.checkBackup({ ...doc, tables: undefined });
    expect(asked).toBe(0);
    await counting.checkBackup(doc);
    expect(asked).toBe(1);
  });
});

describe('restoreBackup', () => {
  it('brings the business back as it was: every table and every file equal', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    const before = await snapshot(t.storage, t.one.business.id);

    await t.storage.purge(t.one.business.id);
    expect(await t.storage.businesses.get(t.one.business.id)).toBeUndefined();

    const result = await kit.restoreBackup(t.storage, await checked(doc));
    expect(result).toEqual({
      businessId: t.one.business.id,
      rows: 5,
      counts: { notes: 3, time_entries: 2 },
      files: 2,
    });
    const after = await snapshot(t.storage, t.one.business.id);
    expect(after.business).toEqual(before.business);
    expect(after.tables.notes).toEqual(before.tables.notes);
    expect(after.tables.time_entries).toEqual(before.tables.time_entries);
    expect(after.files).toEqual(before.files);
    for (const file of await t.storage.files.ofBusiness(t.one.business.id)) {
      expect(await t.storage.files.verify(file.id)).toBe(true);
    }
    // What stays on a device is not part of a backup and does not come back.
    expect(after.tables.device_settings).toEqual([]);
  });

  it('replaces what is on the device with what the file holds', async () => {
    const { t, one } = await setup();
    const doc = await exported(t);
    const first = one.notes[0];
    if (first === undefined) {
      throw new Error('The business has notes');
    }
    await t.storage.table('notes').put({ ...first, text: 'Nach der Sicherung geändert' });
    await t.storage.table('notes').add(t.note(t.one.business.id, 'Nur hier'));
    await t.storage.table('time_entries').add(t.timeEntry(t.one.business.id, t.one.personId, 480));
    await t.storage.businesses.put({ ...t.one.business, name: 'Umbenannt' });
    const later = await t.storage.files.put({
      businessId: t.one.business.id,
      bytes: bytesOf('nur hier'),
      mediaType: 'text/plain',
    });

    await kit.restoreBackup(t.storage, await checked(doc));

    const notes = await t.storage.table('notes').ofBusiness(t.one.business.id);
    expect(notes.map((row) => row.text).sort()).toEqual([
      'Erledigt',
      'Schlüssel beim Hauswart',
      'Treppenhaus',
    ]);
    expect(await t.storage.table('time_entries').ofBusiness(t.one.business.id)).toHaveLength(2);
    expect((await t.storage.businesses.get(t.one.business.id))?.name).toBe('Betrieb Muster');
    expect(await t.storage.files.get(later.id)).toBeUndefined();
    expect(await t.storage.files.ofBusiness(t.one.business.id)).toHaveLength(2);
  });

  it('removes what the device kept for the business it replaces, and only for that one', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    expect(await t.storage.table('device_settings').ofBusiness(t.one.business.id)).toHaveLength(1);
    await kit.restoreBackup(t.storage, await checked(doc));
    // A table outside the backup may point at rows the file does not hold: it goes with the
    // business and is set up again, it is never mixed with a business from a file.
    expect(await t.storage.table('device_settings').ofBusiness(t.one.business.id)).toEqual([]);
    expect(await t.storage.table('device_settings').ofBusiness(t.two.business.id)).toHaveLength(1);
  });

  it('removes the events and the command log of the business it replaces', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    const commandId = t.ids.next();
    await t.storage.commands.record({
      commandId,
      businessId: t.one.business.id,
      operation: 'notes.add',
      result: {},
      at: t.clock.now(),
    });
    await t.storage.events.append({
      id: t.ids.next(),
      type: 'note.added',
      version: 1,
      businessId: t.one.business.id,
      actor: t.one.personId,
      at: t.clock.now(),
      payload: {},
    });
    await kit.restoreBackup(t.storage, await checked(doc));
    // Neither is part of a backup; what the caller writes after the restore is the new start.
    expect(await t.storage.events.ofBusiness(t.one.business.id)).toEqual([]);
    expect(await t.storage.commands.find(commandId)).toBeUndefined();
  });

  it('never touches another business on the device', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    const commandId = t.ids.next();
    await t.storage.commands.record({
      commandId,
      businessId: t.two.business.id,
      operation: 'notes.add',
      result: { ok: true },
      at: t.clock.now(),
    });
    const before = await snapshot(t.storage, t.two.business.id);

    await kit.restoreBackup(t.storage, await checked(doc));

    expect(await snapshot(t.storage, t.two.business.id)).toEqual(before);
    expect(await t.storage.commands.find(commandId)).toBeDefined();
    expect((await t.storage.businesses.all()).map((row) => row.name).sort()).toEqual([
      'Betrieb Beispiel',
      'Betrieb Muster',
    ]);
  });

  it('brings a business onto a device that never had it, next to the one that is there', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    const before = await snapshot(t.storage, t.one.business.id);
    const device = otherDevice();
    const resident = { ...t.two.business, id: sequentialIds(700_000).next(), name: 'Betrieb Drei' };
    await device.businesses.add(resident);

    await kit.restoreBackup(device, await checked(doc));

    const after = await snapshot(device, t.one.business.id);
    expect({ ...after, tables: { ...after.tables, device_settings: undefined } }).toEqual({
      ...before,
      tables: { ...before.tables, device_settings: undefined },
    });
    expect(await device.businesses.all()).toEqual([resident, t.one.business]);
  });

  it('takes only a backup that checkBackup of this kit returned', async () => {
    const { t } = await setup();
    const doc = await exported(t);
    const before = await snapshot(t.storage, t.one.business.id);
    const unchecked = doc as unknown as CheckedBackup<Registry>;
    await expect(kit.restoreBackup(t.storage, unchecked)).rejects.toThrow(TypeError);

    const backup = await checked(doc);
    // A copy is not the checked backup, and a backup of another kit is not ours.
    await expect(kit.restoreBackup(t.storage, { ...backup })).rejects.toThrow(TypeError);
    const otherKit = createBackupKit({ format: FORMAT, version: 1, registry: REGISTRY, hasher });
    await expect(otherKit.restoreBackup(t.storage, backup)).rejects.toThrow(
      'restoreBackup takes only a backup that checkBackup of this kit returned',
    );
    expect(await snapshot(t.storage, t.one.business.id)).toEqual(before);
  });

  it('writes nothing at all if a row of the file has the id of a row of another business', async () => {
    const { t, two } = await setup();
    const doc = await exported(t);
    const foreign = two.notes[0];
    const first = doc.tables.notes?.[0];
    if (foreign === undefined || first === undefined) {
      throw new Error('Both businesses have notes');
    }
    // A file that claims a row of «Betrieb Beispiel» for «Betrieb Muster».
    first.id = foreign.id;
    const backup = await checked(doc);
    const before = {
      one: await snapshot(t.storage, t.one.business.id),
      two: await snapshot(t.storage, t.two.business.id),
    };
    const commandId = t.ids.next();
    const entry = {
      commandId,
      businessId: t.one.business.id,
      operation: 'notes.add',
      result: { ok: true },
      at: t.clock.now(),
    };
    await t.storage.commands.record(entry);
    const error = await kit.restoreBackup(t.storage, backup).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(StorageError);
    expect((error as StorageError).code).toBe('exists');
    // The business of the file was removed first: the failed transaction brought it back, with
    // what the device kept for it and its entries of the command log.
    expect(await snapshot(t.storage, t.one.business.id)).toEqual(before.one);
    expect(await snapshot(t.storage, t.two.business.id)).toEqual(before.two);
    expect(before.one.tables.device_settings).toHaveLength(1);
    expect(await t.storage.commands.find(commandId)).toEqual(entry);
  });

  it('writes nothing at all if the bytes of a file were changed after the check', async () => {
    const { t } = await setup();
    const backup = await checked(await exported(t));
    const before = {
      one: await snapshot(t.storage, t.one.business.id),
      two: await snapshot(t.storage, t.two.business.id),
    };
    // Bytes cannot be frozen: the storage compares them with the checksum once more.
    backup.files[1]?.bytes.fill(0);
    const error = await kit.restoreBackup(t.storage, backup).catch((caught: unknown) => caught);
    expect((error as StorageError).code).toBe('checksum');
    expect(await snapshot(t.storage, t.one.business.id)).toEqual(before.one);
    expect(await snapshot(t.storage, t.two.business.id)).toEqual(before.two);
  });

  it('restores inside a transaction of the caller and shares its fate', async () => {
    const { t } = await setup();
    const backup = await checked(await exported(t));
    await t.storage.table('notes').add(t.note(t.one.business.id, 'Nur hier'));
    const before = await snapshot(t.storage, t.one.business.id);
    await expect(
      t.storage.transaction(async () => {
        await kit.restoreBackup(t.storage, backup);
        throw new Error('stop');
      }),
    ).rejects.toThrow('stop');
    expect(await snapshot(t.storage, t.one.business.id)).toEqual(before);
  });

  it('writes nothing at all if a file of the backup has the id of a file of another business', async () => {
    const { t, two } = await setup();
    const doc = await exported(t);
    const photo = doc.files[0];
    if (photo === undefined) {
      throw new Error('The backup has files');
    }
    photo.meta.id = two.photo.id;
    const backup = await checked(doc);
    const before = {
      one: await snapshot(t.storage, t.one.business.id),
      two: await snapshot(t.storage, t.two.business.id),
    };
    const error = await kit.restoreBackup(t.storage, backup).catch((caught: unknown) => caught);
    expect((error as StorageError).code).toBe('exists');
    expect(await snapshot(t.storage, t.one.business.id)).toEqual(before.one);
    expect(await snapshot(t.storage, t.two.business.id)).toEqual(before.two);
  });

  it('can bring the same backup back twice', async () => {
    const { t } = await setup();
    const backup = await checked(await exported(t));
    const first = await kit.restoreBackup(t.storage, backup);
    const after = await snapshot(t.storage, t.one.business.id);
    expect(await kit.restoreBackup(t.storage, backup)).toEqual(first);
    expect(await snapshot(t.storage, t.one.business.id)).toEqual(after);
  });
});

describe('a backup as a file, with and without a password', () => {
  const cipher = createBackupCipher({ crypto: globalThis.crypto, format: 'sample-encrypted' });

  /** What an app does with the text of a file: open the envelope if there is one, then check. */
  async function readFile(text: string, password?: string) {
    const json: unknown = JSON.parse(text);
    const envelope = cipher.readEnvelope(json);
    if (envelope === 'invalid') {
      throw new Error('The envelope is damaged');
    }
    if (envelope === 'plain') {
      return kit.checkBackup(json);
    }
    const plain: unknown = JSON.parse(await cipher.decryptBackup(envelope, password ?? ''));
    return kit.checkBackup(plain);
  }

  it('goes out and comes back without a password', async () => {
    const { t } = await setup();
    const before = await snapshot(t.storage, t.one.business.id);
    const document = await kit.exportBackup(t.storage, t.one.business.id, { clock: t.clock });
    const text = `${JSON.stringify(document, null, 2)}\n`;

    const device = otherDevice();
    const check = await readFile(text);
    expect(check.preview).toMatchObject({ importable: true, rows: 5, files: 2 });
    if (check.backup === undefined) {
      throw new Error('The backup fits');
    }
    await kit.restoreBackup(device, check.backup);

    const after = await snapshot(device, t.one.business.id);
    expect(after.business).toEqual(before.business);
    expect(after.tables.notes).toEqual(before.tables.notes);
    expect(after.tables.time_entries).toEqual(before.tables.time_entries);
    expect(after.files).toEqual(before.files);
  });

  it('goes out and comes back with a password', { timeout: KEY_DERIVATION_TIMEOUT }, async () => {
    const { t } = await setup();
    const before = await snapshot(t.storage, t.one.business.id);
    const document = await kit.exportBackup(t.storage, t.one.business.id, { clock: t.clock });
    const text = await cipher.encryptBackup(JSON.stringify(document), 'correct horse battery');
    // Nothing of the business can be read in the file.
    expect(text).not.toContain('Betrieb Muster');
    expect(text).not.toContain(t.one.business.id);
    expect(text).not.toContain(FORMAT);

    const device = otherDevice();
    const check = await readFile(text, 'correct horse battery');
    if (check.backup === undefined) {
      throw new Error('The backup fits');
    }
    await kit.restoreBackup(device, check.backup);

    const after = await snapshot(device, t.one.business.id);
    expect(after.business).toEqual(before.business);
    expect(after.tables.notes).toEqual(before.tables.notes);
    expect(after.tables.time_entries).toEqual(before.tables.time_entries);
    expect(after.files).toEqual(before.files);
  });

  it(
    'stays closed with the wrong password and when the file was damaged',
    { timeout: KEY_DERIVATION_TIMEOUT },
    async () => {
      const { t } = await setup();
      const document = await kit.exportBackup(t.storage, t.one.business.id, { clock: t.clock });
      const text = await cipher.encryptBackup(JSON.stringify(document), 'correct horse battery');
      await expect(readFile(text, 'wrong horse battery')).rejects.toThrow(
        'wrong password or damaged backup',
      );

      const envelope = JSON.parse(text) as { data: string };
      const swapped = envelope.data.startsWith('A') ? 'B' : 'A';
      const damaged = JSON.stringify({ ...envelope, data: swapped + envelope.data.slice(1) });
      await expect(readFile(damaged, 'correct horse battery')).rejects.toThrow(
        'wrong password or damaged backup',
      );
      const cut = JSON.stringify({ ...envelope, data: envelope.data.slice(0, -3) });
      await expect(readFile(cut, 'correct horse battery')).rejects.toThrow(
        'The envelope is damaged',
      );
    },
  );

  it(
    'carries every text exactly, with and without a password',
    { timeout: KEY_DERIVATION_TIMEOUT },
    async () => {
      const t = await createTestStorage();
      const texts = [
        'Zürich, Genève, Müstair: äöü ÀÉÈ œ ñ',
        '日本語 und Ελληνικά',
        'Astral: 😀 𝄞 👩🏽‍🔧',
        // Half of a character, as a field cut at a length leaves it behind.
        'cut \ud83d here',
        'Zeile\nmit\tSteuerzeichen \u0000 \u2028 und "Anführung" \\',
      ];
      // A list of plain texts is kept to the letter, white space at the ends included.
      const tags = ['\uFEFFmit Marke am Anfang', '  Leerzeichen an beiden Enden  ', ''];
      const notes = texts.map((text) => t.note(t.one.business.id, text, { tags: [text, ...tags] }));
      for (const note of notes) {
        await t.storage.table('notes').add(note);
      }
      await t.storage.businesses.put({ ...t.one.business, name: 'Betrieb Müster 😀' });
      const before = await snapshot(t.storage, t.one.business.id);
      const document = await kit.exportBackup(t.storage, t.one.business.id, { clock: t.clock });
      const plain = JSON.stringify(document);
      const encrypted = await cipher.encryptBackup(plain, 'pässwörd-日本語-😀');

      for (const [text, password] of [[plain], [encrypted, 'pässwörd-日本語-😀']] as const) {
        const device = otherDevice();
        const check = await readFile(text, password);
        expect(check.preview.problems).toEqual([]);
        if (check.backup !== undefined) {
          await kit.restoreBackup(device, check.backup);
        }
        const after = await snapshot(device, t.one.business.id);
        expect(after.business).toStrictEqual(before.business);
        expect(after.tables.notes).toStrictEqual(before.tables.notes);
        const stored = await device.table('notes').ofBusiness(t.one.business.id);
        expect(stored.map((row) => row.text).sort()).toEqual([...texts].sort());
      }
    },
  );

  it(
    'carries files of any bytes, an empty one included',
    { timeout: KEY_DERIVATION_TIMEOUT },
    async () => {
      const t = await createTestStorage();
      const contents = [
        new Uint8Array(),
        Uint8Array.of(0),
        Uint8Array.from({ length: 256 }, (_, index) => index),
        Uint8Array.from({ length: 70_001 }, (_, index) => (index * 7) % 251),
      ];
      for (const bytes of contents) {
        await t.storage.files.put({
          businessId: t.one.business.id,
          bytes,
          mediaType: 'application/octet-stream',
        });
      }
      const before = await snapshot(t.storage, t.one.business.id);
      const text = JSON.stringify(
        await kit.exportBackup(t.storage, t.one.business.id, { clock: t.clock }),
      );
      const device = otherDevice();
      const check = await readFile(
        await cipher.encryptBackup(text, 'correct horse'),
        'correct horse',
      );
      expect(check.preview).toMatchObject({ importable: true, files: 4 });
      if (check.backup !== undefined) {
        await kit.restoreBackup(device, check.backup);
      }
      expect((await snapshot(device, t.one.business.id)).files).toEqual(before.files);
      for (const meta of await device.files.ofBusiness(t.one.business.id)) {
        expect(await device.files.verify(meta.id), meta.id).toBe(true);
      }
    },
  );

  it('refuses a damaged file without a password: one changed letter in a row is found', async () => {
    const { t } = await setup();
    const document = await kit.exportBackup(t.storage, t.one.business.id, { clock: t.clock });
    const text = JSON.stringify(document).replace('"minutes":90', '"minutes":"90"');
    const check = await readFile(text);
    expect(check.preview.problems).toEqual([
      { kind: 'row', table: 'time_entries', id: document.tables.time_entries?.[0]?.id },
    ]);
  });
});

describe('loose reading: a backup from a newer app loses no field', () => {
  /** What a newer version of the app would have written into the same format. */
  function fromNewerApp(doc: Doc): Doc {
    const [first, second] = doc.tables.notes ?? [];
    const [photo] = doc.files;
    if (first === undefined || second === undefined || photo === undefined) {
      throw new Error('The backup has notes and files');
    }
    // An unknown field in the row, in a record of the row and in the records of a list.
    first.colour = 'blue';
    first.reminder = { on: '2026-12-01', repeat: ['mon', 'thu'] };
    second.place = { ...(second.place as object), door: 'B', coordinates: { x: 1, y: 2 } };
    second.lines = (second.lines as Record<string, unknown>[]).map((line, index) => ({
      ...line,
      done: index === 0,
      by: { personId: 'Person Eins' },
    }));
    (doc.tables.time_entries ?? []).forEach((entry) => {
      entry.kind = 'work';
    });
    doc.business = { ...doc.business, currency: 'CHF', functions: { customers: { on: true } } };
    photo.meta.takenAt = '2026-11-13T08:00:00.000Z';
    return doc;
  }

  it('accepts the file: fields no schema knows are no problem', async () => {
    const { t } = await setup();
    const check = await kit.checkBackup(fromNewerApp(await exported(t)));
    expect(check.preview).toMatchObject({ importable: true, problems: [], rows: 5 });
  });

  it('keeps an unknown field of a row, of a record in it and of the records in a list', async () => {
    const { t } = await setup();
    const doc = fromNewerApp(await exported(t));
    const backup = await checked(doc);
    expect(backup.tables.notes).toEqual(doc.tables.notes);
    expect(backup.tables.time_entries).toEqual(doc.tables.time_entries);
    expect(backup.tables.notes?.[0]).toMatchObject({
      colour: 'blue',
      reminder: { on: '2026-12-01', repeat: ['mon', 'thu'] },
    });
    expect(backup.tables.notes?.[1]).toMatchObject({
      place: { room: 'Eingang', floor: 0, door: 'B', coordinates: { x: 1, y: 2 } },
      lines: [
        { label: 'wischen', minutes: 30, done: true, by: { personId: 'Person Eins' } },
        { label: 'Fenster', minutes: 45, done: false, by: { personId: 'Person Eins' } },
      ],
    });
  });

  it('keeps unknown fields of the business row and of what is known about a file', async () => {
    const { t } = await setup();
    const doc = fromNewerApp(await exported(t));
    const backup = await checked(doc);
    expect(backup.business).toEqual(doc.business);
    expect(backup.files[0]?.meta).toEqual(doc.files[0]?.meta);
    expect(backup.files[0]?.meta).toMatchObject({ takenAt: '2026-11-13T08:00:00.000Z' });
  });

  it('writes the fields into the storage, and the next backup carries them again', async () => {
    const { t } = await setup();
    const doc = fromNewerApp(await exported(t));
    const device = otherDevice();
    await kit.restoreBackup(device, await checked(doc));

    const stored = await device.table('notes').get((doc.tables.notes?.[0]?.id ?? '') as Id);
    expect(stored).toMatchObject({ colour: 'blue', reminder: { repeat: ['mon', 'thu'] } });
    expect(await device.businesses.get(t.one.business.id)).toMatchObject({ currency: 'CHF' });

    // Out again from the older app: the file is the one that came in, field for field.
    const again = await kit.exportBackup(device, t.one.business.id, { clock: t.clock });
    expect(JSON.parse(JSON.stringify(again))).toEqual(doc);
  });

  it('keeps the unknown fields with a business schema that names every field it knows', async () => {
    const StrictBusinessSchema = z.object({
      ...BusinessBaseSchema.shape,
      currency: z.literal('CHF'),
    });
    type StrictBusiness = z.infer<typeof StrictBusinessSchema>;
    const strictKit = createBackupKit({
      format: FORMAT,
      version: 1,
      registry: REGISTRY,
      hasher,
      businessSchema: StrictBusinessSchema,
    });
    const { t } = await setup();
    const doc = fromNewerApp(await exported(t));
    const check = await strictKit.checkBackup(doc);
    expect(check.preview.problems).toEqual([]);
    expect(check.backup?.business).toEqual(doc.business);
    expect(check.backup?.business.currency).toBe('CHF');

    const device = createMemoryStorage<Registry, StrictBusiness>(REGISTRY, {
      hasher,
      clock: fixedClock(),
      ids: sequentialIds(900_000),
    });
    if (check.backup !== undefined) {
      await strictKit.restoreBackup(device, check.backup);
    }
    expect(await device.businesses.get(t.one.business.id)).toEqual(doc.business);

    // The same schema refuses a business row that lacks what it asks for.
    expect((await strictKit.checkBackup(await exported(t))).preview.problems).toEqual([
      { kind: 'business' },
    ]);
  });

  it('writes a field a schema knows as the schema reads it: a name comes back trimmed', async () => {
    const { t } = await setup();
    const doc = fromNewerApp(await exported(t));
    const first = doc.tables.notes?.[0];
    if (first === undefined || doc.business === undefined) {
      throw new Error('The backup has notes');
    }
    // Written past its schema: what the schema knows wins, what it does not know stays as it is.
    first.text = '  Schlüssel beim Hauswart  ';
    first.colour = '  blue  ';
    doc.business.name = ' Betrieb Muster ';
    const backup = await checked(doc);
    expect(backup.tables.notes?.[0]).toMatchObject({
      text: 'Schlüssel beim Hauswart',
      colour: '  blue  ',
    });
    expect(backup.business.name).toBe('Betrieb Muster');
  });

  it('still refuses a known field with a wrong value next to unknown ones', async () => {
    const { t } = await setup();
    const doc = fromNewerApp(await exported(t));
    const second = doc.tables.notes?.[1];
    if (second === undefined) {
      throw new Error('The backup has notes');
    }
    second.place = { ...(second.place as object), floor: 'ground' };
    expect(await problemsOf(doc)).toEqual([{ kind: 'row', table: 'notes', id: second.id }]);
  });

  it('loses no field of any row, whatever a newer app added to it', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.dictionary(fc.string(), plainJson, { maxKeys: 4 }), { maxLength: 4 }),
        fc.dictionary(fc.string(), plainJson, { maxKeys: 3 }),
        async (extras, businessExtra) => {
          const known = ['id', 'businessId', 'text', 'createdAt', 'updatedAt', 'deletedAt'];
          const optional = ['tags', 'place', 'lines', 'fileId', '__proto__'];
          const clash = (extra: Record<string, unknown>, names: string[]) =>
            Object.keys(extra).some((key) => names.includes(key));
          fc.pre(!extras.some((extra) => clash(extra, [...known, ...optional])));
          fc.pre(!clash(businessExtra, ['id', 'name', 'createdAt', 'updatedAt', '__proto__']));

          const t = await createTestStorage();
          const business = { ...t.one.business, ...businessExtra };
          await t.storage.businesses.put(business);
          for (const [index, extra] of extras.entries()) {
            const row = { ...extra, ...t.note(t.one.business.id, `Notiz ${index}`) };
            await t.storage.table('notes').put(row);
          }
          const before = await snapshot(t.storage, t.one.business.id);

          const text = JSON.stringify(
            await kit.exportBackup(t.storage, t.one.business.id, { clock: t.clock }),
          );
          const device = otherDevice();
          await kit.restoreBackup(device, await checked(JSON.parse(text)));

          expect(await snapshot(device, t.one.business.id)).toStrictEqual(before);
        },
      ),
      { numRuns: 40 },
    );
  });
});

describe('older versions of a format', () => {
  /** A file of version 1 of the sample format: the notes were called «memos», no files yet. */
  interface OldDoc {
    counts: Doc['counts'];
    tables: Doc['tables'];
    [key: string]: unknown;
  }

  function asVersionOne(doc: Doc): OldDoc {
    const { notes, ...tables } = doc.tables;
    const { notes: count, ...counts } = doc.counts;
    const old: OldDoc = {
      ...doc,
      version: 1,
      tables: { ...tables, memos: notes },
      counts: { ...counts, memos: count },
    };
    delete old.files;
    return old;
  }

  const fromOne: BackupReader = (document) => {
    const tables = document.tables as Record<string, unknown>;
    const counts = document.counts as Record<string, unknown>;
    const { memos, ...otherTables } = tables;
    const { memos: count, ...otherCounts } = counts;
    return {
      ...document,
      tables: { ...otherTables, notes: memos },
      counts: { ...otherCounts, notes: count },
      files: [],
    };
  };

  const kitTwo = createBackupKit({
    format: FORMAT,
    version: 2,
    registry: REGISTRY,
    hasher,
    readers: { 1: fromOne },
  });

  it('reads a file of the version before through its reader', async () => {
    const { t, one } = await setup();
    const old = asVersionOne(await exported(t));
    const check = await kitTwo.checkBackup(old);
    expect(check.preview).toMatchObject({
      recognised: true,
      importable: true,
      // The version the file was written in, not the one it was read as.
      version: 1,
      rows: 5,
      counts: { notes: 3, time_entries: 2 },
      files: 0,
      problems: [],
    });
    expect(check.backup?.tables.notes).toEqual(one.notes);

    const device = otherDevice();
    if (check.backup !== undefined) {
      await kitTwo.restoreBackup(device, check.backup);
    }
    expect(await device.table('notes').ofBusiness(t.one.business.id)).toHaveLength(3);
  });

  it('writes the new version and reads it without a reader', async () => {
    const { t } = await setup();
    const document = await kitTwo.exportBackup(t.storage, t.one.business.id, { clock: t.clock });
    expect(document.version).toBe(2);
    const check = await kitTwo.checkBackup(JSON.parse(JSON.stringify(document)));
    expect(check.preview).toMatchObject({ importable: true, version: 2, files: 2 });
  });

  it('holds an upgraded file to the same rules as a new one', async () => {
    const { t } = await setup();
    const old = asVersionOne(await exported(t));
    // A table the reader does not know about is carried along and then refused.
    old.tables.customers = [];
    expect((await kitTwo.checkBackup(old)).preview.problems).toEqual([
      { kind: 'table', table: 'customers' },
    ]);
  });

  it('gives a reader a copy: what the caller holds stays as it is', async () => {
    const meddling = createBackupKit({
      format: FORMAT,
      version: 2,
      registry: REGISTRY,
      hasher,
      readers: {
        1: (document) => {
          const upgraded = fromOne(document);
          (document.tables as Record<string, unknown>).memos = 'gone';
          delete document.business;
          return upgraded;
        },
      },
    });
    const { t } = await setup();
    const old = asVersionOne(await exported(t));
    const text = JSON.stringify(old);
    expect((await meddling.checkBackup(old)).preview.importable).toBe(true);
    expect(JSON.stringify(old)).toBe(text);
  });

  it('goes through every reader in turn, and sets the version itself', async () => {
    const seen: unknown[] = [];
    const kitThree = createBackupKit({
      format: FORMAT,
      version: 3,
      registry: REGISTRY,
      hasher,
      readers: {
        1: (document) => {
          seen.push(document.version);
          return fromOne(document);
        },
        2: (document) => {
          seen.push(document.version);
          // A reader that leaves a wrong version behind does no harm.
          return { ...document, version: 99 };
        },
      },
    });
    const { t } = await setup();
    const doc = await exported(t);
    expect((await kitThree.checkBackup(asVersionOne(doc))).preview).toMatchObject({
      importable: true,
      version: 1,
    });
    expect(seen).toEqual([1, 2]);
    // A file of version 2 starts at the second reader.
    expect((await kitThree.checkBackup({ ...doc, version: 2 })).preview).toMatchObject({
      importable: true,
      version: 2,
    });
    expect(seen).toEqual([1, 2, 2]);
    expect((await kitThree.checkBackup({ ...doc, version: 4 })).preview.problems).toEqual([
      { kind: 'version', version: '4' },
    ]);
  });

  it.each([
    [
      'fails',
      () => {
        throw new Error('cannot read this');
      },
    ],
    ['returns nothing', () => undefined as unknown as Record<string, unknown>],
    ['returns a list', () => [] as unknown as Record<string, unknown>],
    [
      'returns what is not plain data',
      (document: Record<string, unknown>) => ({ ...document, exportedAt: new Date(0) }),
    ],
  ])('refuses the file with its version if a reader %s', async (_what, reader) => {
    const failing = createBackupKit({
      format: FORMAT,
      version: 2,
      registry: REGISTRY,
      hasher,
      readers: { 1: reader },
    });
    const { t } = await setup();
    const check = await failing.checkBackup(asVersionOne(await exported(t)));
    expect(check.preview).toMatchObject({
      recognised: false,
      importable: false,
      version: 1,
      problems: [{ kind: 'version', version: '1' }],
    });
  });
});

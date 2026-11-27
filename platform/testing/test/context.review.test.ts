import { createHash } from 'node:crypto';
import { command, commandBase, createCommandKit, type CommandContext } from '@onestrand/contract';
import { IdSchema, IsoDateTimeSchema, isUuidV7, type Id } from '@onestrand/core';
import {
  alive,
  BusinessBaseSchema,
  createBackupKit,
  createMemoryStorage,
  createWebCryptoHasher,
  StorageError,
  type BusinessBase,
  type ModuleStorage,
  type Rows,
  type Storage,
} from '@onestrand/storage';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import {
  businessSnapshot,
  createTestContext,
  fixedClock,
  sequentialIds,
  testHasher,
  type TestContext,
} from '../src';
import {
  bytesOf,
  notesTable,
  REGISTRY,
  timeEntriesTable,
  type Note,
  type Registry,
  type TimeEntry,
} from './support';

const NOW = '2026-11-14T10:00:00.000Z';

/** The n-th counting id, as `sequentialIds` gives it. */
const idNumber = (n: number) => sequentialIds(n).next();

function note(t: TestContext<Registry>, text: string, more: Partial<Note> = {}): Note {
  const now = t.clock.now();
  return {
    id: t.ids.next(),
    businessId: t.businessId,
    text,
    createdAt: now,
    updatedAt: now,
    ...more,
  };
}

function timeEntry(t: TestContext<Registry>, minutes: number): TimeEntry {
  return {
    id: t.ids.next(),
    businessId: t.businessId,
    personId: t.ownerId,
    minutes,
    at: t.clock.now(),
  };
}

describe('createTestContext', () => {
  it('seeds one business, «Betrieb Muster», with an owner and a second person as ids', async () => {
    const t = await createTestContext({ registry: REGISTRY });

    expect(t.business).toEqual({
      id: idNumber(1),
      name: 'Betrieb Muster',
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(t.businessId).toBe(idNumber(1));
    expect(t.ownerId).toBe(idNumber(2));
    expect(t.secondPersonId).toBe(idNumber(3));
    expect(t.actor).toBe(t.ownerId);
    expect([t.businessId, t.ownerId, t.secondPersonId].every(isUuidV7)).toBe(true);
    expect(BusinessBaseSchema.safeParse(t.business).success).toBe(true);

    expect(await t.storage.businesses.all()).toEqual([t.business]);
    expect(await t.storage.businesses.get(t.businessId)).toEqual(t.business);
  });

  it('is lean: nothing but the business is stored, and no row of a person', async () => {
    const t = await createTestContext({ registry: REGISTRY });
    expect(await t.snapshot()).toEqual({
      business: t.business,
      tables: { notes: [], time_entries: [], device_settings: [] },
      files: [],
      events: [],
    });
    expect(await t.storage.commands.find(t.ownerId)).toBeUndefined();
  });

  it('gives the same seed every time', async () => {
    const one = await createTestContext({ registry: REGISTRY });
    const two = await createTestContext({ registry: REGISTRY });
    expect(two.business).toEqual(one.business);
    expect([two.ownerId, two.secondPersonId]).toEqual([one.ownerId, one.secondPersonId]);
    expect(two.storage).not.toBe(one.storage);
    expect(two.clock).not.toBe(one.clock);
  });

  it('starts a fixed clock at 14.11.2026, or at the day it is told', async () => {
    const t = await createTestContext({ registry: REGISTRY });
    expect(t.clock.today()).toBe('2026-11-14');
    expect(t.clock.now()).toBe(NOW);
    expect(t.ctx.clock).toBe(t.clock);

    const later = await createTestContext({ registry: REGISTRY, today: '2027-03-01' });
    expect(later.clock.today()).toBe('2027-03-01');
    expect(later.business.createdAt).toBe('2027-03-01T10:00:00.000Z');
  });

  it('takes a clock of the test, and stamps the business with its time', async () => {
    const clock = fixedClock('2026-12-24');
    clock.advance({ hours: 3, minutes: 30 });
    const t = await createTestContext({ registry: REGISTRY, clock });
    expect(t.clock).toBe(clock);
    expect(t.business.createdAt).toBe('2026-12-24T13:30:00.000Z');
    expect(t.business.updatedAt).toBe('2026-12-24T13:30:00.000Z');
  });

  it('refuses a clock together with a day, a day that does not exist and a bad first id', async () => {
    await expect(
      createTestContext({ registry: REGISTRY, clock: fixedClock(), today: '2026-11-20' }),
    ).rejects.toThrow(TypeError);
    await expect(createTestContext({ registry: REGISTRY, today: '2026-02-30' })).rejects.toThrow();
    await expect(createTestContext({ registry: REGISTRY, idStart: -1 })).rejects.toThrow(
      RangeError,
    );
    await expect(createTestContext({ registry: REGISTRY, idStart: 1.5 })).rejects.toThrow(
      RangeError,
    );
  });

  it('counts the ids from where it is told, and takes another name', async () => {
    const t = await createTestContext({ registry: REGISTRY, idStart: 500, name: 'Betrieb Probe' });
    expect(t.businessId).toBe(idNumber(500));
    expect(t.ownerId).toBe(idNumber(501));
    expect(t.secondPersonId).toBe(idNumber(502));
    expect(t.business.name).toBe('Betrieb Probe');
    expect(t.cmd()).toBe(idNumber(503));
  });

  it('hands out fresh ids after the seed: for commands and for rows', async () => {
    const t = await createTestContext({ registry: REGISTRY });
    const made = [t.cmd(), t.ids.next(), t.cmd(), t.ctx.ids.next()];
    expect(made).toEqual([idNumber(4), idNumber(5), idNumber(6), idNumber(7)]);
    expect(made.every((id) => IdSchema.safeParse(id).success)).toBe(true);
  });

  it('types the tables by the register it was given', async () => {
    const t = await createTestContext({ registry: REGISTRY });
    expectTypeOf(t).toEqualTypeOf<TestContext<Registry>>();
    // A helper that takes any test context takes this one.
    expectTypeOf(t).toExtend<TestContext>();
    expectTypeOf(t.storage).toEqualTypeOf<Storage<Registry>>();
    expectTypeOf(t.storage.table('notes').get).returns.resolves.toEqualTypeOf<
      Rows<Registry>['notes'] | undefined
    >();
    expectTypeOf(t.business).toEqualTypeOf<BusinessBase>();
    expectTypeOf(t.ctx).toEqualTypeOf<CommandContext>();
    expectTypeOf(t.storage).toExtend<ModuleStorage>();
    // @ts-expect-error a table the register does not hold
    expect(() => t.storage.table('customers')).toThrow(StorageError);
    expect(t.registry).toBe(REGISTRY);
  });

  describe('as the context of a command', () => {
    const addNote = command({
      name: 'notes.add',
      summary: 'Adds a note to the business.',
      access: { feature: 'notes', level: 'operate' },
      input: z.object({ ...commandBase, text: z.string() }),
      output: z.object({ noteId: IdSchema }),
    });

    async function runAddNote(t: TestContext<Registry>, ctx: CommandContext, commandId: Id) {
      const { emit, runCommand, stamps } = createCommandKit(ctx);
      return runCommand(addNote, { commandId, businessId: t.businessId }, async () => {
        const row: Note = {
          id: ctx.ids.next(),
          businessId: t.businessId,
          text: 'Schlüssel abgeholt',
          ...stamps(),
        };
        await t.storage.table(notesTable).add(row);
        await emit(t.businessId, 'note.added', { noteId: row.id });
        return { noteId: row.id };
      });
    }

    it('runs a command once: the row, the event of the owner and the entry of the log', async () => {
      const t = await createTestContext({ registry: REGISTRY });
      t.clock.advance({ hours: 2 });
      const commandId = t.cmd();
      const { noteId } = await runAddNote(t, t.ctx, commandId);

      expect(await t.storage.table('notes').get(noteId)).toMatchObject({
        businessId: t.businessId,
        createdAt: '2026-11-14T12:00:00.000Z',
      });
      const events = await t.storage.events.ofBusiness(t.businessId);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'note.added',
        businessId: t.businessId,
        actor: t.ownerId,
        at: '2026-11-14T12:00:00.000Z',
        payload: { noteId },
      });
      expect(await t.storage.commands.find(commandId)).toMatchObject({
        commandId,
        businessId: t.businessId,
        operation: 'notes.add',
      });

      // The same command again changes nothing and answers the same.
      expect(await runAddNote(t, t.ctx, commandId)).toEqual({ noteId });
      expect(await t.storage.table('notes').ofBusiness(t.businessId)).toHaveLength(1);
    });

    it('lets another person act: the same storage, clock and ids, another actor', async () => {
      const t = await createTestContext({ registry: REGISTRY });
      const second = t.actingAs(t.secondPersonId);
      expect(second.actor).toBe(t.secondPersonId);
      expect(second.storage).toBe(t.storage);
      expect(second.clock).toBe(t.clock);
      expect(second.ids).toBe(t.ids);
      // The context of the owner stays what it was.
      expect(t.ctx.actor).toBe(t.ownerId);

      await runAddNote(t, second, t.cmd());
      await runAddNote(t, t.ctx, t.cmd());
      const actors = (await t.storage.events.ofBusiness(t.businessId)).map((event) => event.actor);
      expect(actors).toEqual([t.secondPersonId, t.ownerId]);
    });
  });

  describe('hasher', () => {
    it('uses the hasher of this package: the checksum of a file is real SHA-256', async () => {
      const t = await createTestContext({ registry: REGISTRY });
      expect(t.hasher).toBe(testHasher);
      const bytes = bytesOf('Rapport vom 14.11.2026');
      const meta = await t.storage.files.put({
        businessId: t.businessId,
        bytes,
        mediaType: 'text/plain',
      });
      expect(meta.sha256).toBe(createHash('sha256').update(bytes).digest('hex'));
      expect(meta.createdAt).toBe(NOW);
      expect(await t.storage.files.verify(meta.id)).toBe(true);
    });

    it('takes another hasher, and the storage in memory computes with it', async () => {
      const calls: number[] = [];
      const webCrypto = createWebCryptoHasher(globalThis.crypto);
      const t = await createTestContext({
        registry: REGISTRY,
        hasher: {
          sha256: (data) => {
            calls.push(data.length);
            return webCrypto.sha256(data);
          },
        },
      });
      const meta = await t.storage.files.put({
        businessId: t.businessId,
        bytes: bytesOf('abc'),
        mediaType: 'text/plain',
      });
      expect(calls).toEqual([3]);
      expect(meta.sha256).toBe(await testHasher.sha256(bytesOf('abc')));
      expect(await t.hasher.sha256(bytesOf('abc'))).toBe(meta.sha256);
    });

    it('gives a file its id from the ids of the first business, so no id is handed out twice', async () => {
      const t = await createTestContext({ registry: REGISTRY });
      const other = await t.addBusiness();
      const meta = await t.storage.files.put({
        businessId: other.businessId,
        bytes: bytesOf('abc'),
        mediaType: 'text/plain',
      });
      expect(meta.id).toBe(idNumber(4));
      expect(t.cmd()).toBe(idNumber(5));
    });
  });

  describe('a fuller business', () => {
    type SampleBusiness = BusinessBase & { currency: 'CHF' };
    const complete = (base: BusinessBase): SampleBusiness => ({ ...base, currency: 'CHF' });

    it('completes the row of the business where the storage holds more than the base', async () => {
      const t = await createTestContext({ registry: REGISTRY, business: complete });
      expectTypeOf(t).toEqualTypeOf<TestContext<Registry, SampleBusiness>>();
      expectTypeOf(t.business.currency).toEqualTypeOf<'CHF'>();
      expect(t.business).toEqual({
        id: idNumber(1),
        name: 'Betrieb Muster',
        createdAt: NOW,
        updatedAt: NOW,
        currency: 'CHF',
      });
      expect(await t.storage.businesses.get(t.businessId)).toEqual(t.business);

      const other = await t.addBusiness();
      expect(other.business.currency).toBe('CHF');
      expect(other.business.name).toBe('Betrieb Beispiel');
    });

    it('does not compile for a storage of fuller businesses without the completion', async () => {
      const clock = fixedClock();
      const storage = createMemoryStorage<Registry, SampleBusiness>(REGISTRY, {
        hasher: testHasher,
        clock,
        ids: sequentialIds(900_000),
      });
      // Only compiled, never run: without `business` the row would lack its currency.
      const incomplete = () =>
        // @ts-expect-error the storage keeps businesses with a currency: `business` is required
        createTestContext({ registry: REGISTRY, storage });
      expect(incomplete).toBeTypeOf('function');

      const t = await createTestContext({ registry: REGISTRY, storage, clock, business: complete });
      expect(t.storage).toBe(storage);
      expect((await storage.businesses.get(t.businessId))?.currency).toBe('CHF');
    });
  });

  describe('on a storage of the test', () => {
    it('seeds the storage it is given, so an adapter runs the same tests', async () => {
      const clock = fixedClock();
      const storage = createMemoryStorage(REGISTRY, {
        hasher: testHasher,
        clock,
        ids: sequentialIds(900_000),
      });
      const t = await createTestContext({ registry: REGISTRY, storage, clock });
      expect(t.storage).toBe(storage);
      expect(t.ctx.storage).toBe(storage);
      expect(await storage.businesses.all()).toEqual([t.business]);

      // Files get their ids from the ports the storage was built with.
      const meta = await storage.files.put({
        businessId: t.businessId,
        bytes: bytesOf('abc'),
        mediaType: 'text/plain',
      });
      expect(meta.id).toBe(idNumber(900_000));
    });

    it('fails loudly when the same seed is put on one storage twice', async () => {
      const t = await createTestContext({ registry: REGISTRY });
      const again = createTestContext({ registry: REGISTRY, storage: t.storage });
      await expect(again).rejects.toThrow(StorageError);
      await expect(again).rejects.toMatchObject({ code: 'exists' });
      // The business that was there is untouched.
      expect(await t.storage.businesses.all()).toEqual([t.business]);
    });
  });

  describe('addBusiness: a second business on the same storage', () => {
    it('adds «Betrieb Beispiel» with its own two persons and its own range of ids', async () => {
      const t = await createTestContext({ registry: REGISTRY });
      const other = await t.addBusiness();

      expect(other.business).toEqual({
        id: idNumber(1_000_001),
        name: 'Betrieb Beispiel',
        createdAt: NOW,
        updatedAt: NOW,
      });
      expect(other.ownerId).toBe(idNumber(1_000_002));
      expect(other.secondPersonId).toBe(idNumber(1_000_003));
      expect(other.actor).toBe(other.ownerId);
      expect(other.ctx.actor).toBe(other.ownerId);
      expect(other.cmd()).toBe(idNumber(1_000_004));

      expect(other.storage).toBe(t.storage);
      expect(other.clock).toBe(t.clock);
      expect(other.registry).toBe(t.registry);
      expect(other.hasher).toBe(t.hasher);
      expect(other.ids).not.toBe(t.ids);
      expect(await t.storage.businesses.all()).toEqual([t.business, other.business]);
    });

    it('stamps a later business with the time the clock shows then', async () => {
      const t = await createTestContext({ registry: REGISTRY });
      t.clock.setToday('2026-12-01');
      const other = await t.addBusiness();
      expect(other.business.createdAt).toBe('2026-12-01T10:00:00.000Z');
      expect(t.business.createdAt).toBe(NOW);
    });

    it('keeps the ranges apart from wherever the first one starts', async () => {
      const t = await createTestContext({ registry: REGISTRY, idStart: 40 });
      const second = await t.addBusiness();
      const third = await second.addBusiness({ name: 'Betrieb Dritter' });
      const fourth = await t.addBusiness();
      expect(second.businessId).toBe(idNumber(1_000_040));
      expect(third.businessId).toBe(idNumber(2_000_040));
      expect(fourth.businessId).toBe(idNumber(3_000_040));
      expect([second, third, fourth].map((each) => each.business.name)).toEqual([
        'Betrieb Beispiel',
        'Betrieb Dritter',
        'Betrieb 4',
      ]);
    });

    it('never gives two businesses the same range, also when they are added side by side', async () => {
      const t = await createTestContext({ registry: REGISTRY });
      const added = await Promise.all([t.addBusiness(), t.addBusiness(), t.addBusiness()]);
      const all = [t, ...added];
      const ids = all.flatMap((each) => [
        each.businessId,
        each.ownerId,
        each.secondPersonId,
        ...Array.from({ length: 50 }, () => each.cmd()),
      ]);
      expect(new Set(ids).size).toBe(ids.length);
      expect(added.map((each) => each.businessId)).toEqual([
        idNumber(1_000_001),
        idNumber(2_000_001),
        idNumber(3_000_001),
      ]);
      expect(await t.storage.businesses.all()).toHaveLength(4);
    });

    it('keeps two businesses apart: what one writes, the other never sees', async () => {
      const t = await createTestContext({ registry: REGISTRY });
      const other = await t.addBusiness();
      const before = await other.snapshot();

      await t.storage.table('notes').add(note(t, 'Nur im ersten Betrieb'));
      await t.storage.table(timeEntriesTable).add(timeEntry(t, 90));
      await t.storage.files.put({
        businessId: t.businessId,
        bytes: bytesOf('abc'),
        mediaType: 'text/plain',
      });
      await createCommandKit(t.ctx).emit(t.businessId, 'note.added', {});

      expect(await other.snapshot()).toEqual(before);
      expect(await other.storage.table('notes').ofBusiness(other.businessId)).toEqual([]);
      expect((await t.snapshot()).tables.notes).toHaveLength(1);
    });

    it('leaves the other business as it is when one is deleted', async () => {
      const t = await createTestContext({ registry: REGISTRY });
      const other = await t.addBusiness();
      for (const each of [t, other]) {
        await each.storage.table('notes').add(note(each, `Notiz von ${each.business.name}`));
        await each.storage.table('time_entries').add(timeEntry(each, 45));
        await each.storage.files.put({
          businessId: each.businessId,
          bytes: bytesOf(each.business.name),
          mediaType: 'text/plain',
        });
        await createCommandKit(each.ctx).emit(each.businessId, 'note.added', {});
      }
      const before = await other.snapshot();
      expect(before.tables.notes).toHaveLength(1);
      expect(before.files).toHaveLength(1);
      expect(before.events).toHaveLength(1);

      await t.storage.purge(t.businessId);

      expect(await other.snapshot()).toEqual(before);
      expect(await t.snapshot()).toEqual({
        business: undefined,
        tables: { notes: [], time_entries: [], device_settings: [] },
        files: [],
        events: [],
      });
    });
  });
});

describe('businessSnapshot', () => {
  it('holds the business, every table, the files with their bytes and the events in order', async () => {
    const t = await createTestContext({ registry: REGISTRY });
    // Written against the order of their ids, to see the snapshot sort them.
    const [first, second, third] = [note(t, 'eins'), note(t, 'zwei'), note(t, 'drei')];
    const removed = { ...third, deletedAt: IsoDateTimeSchema.parse('2026-11-14T11:00:00.000Z') };
    for (const row of [removed, first, second]) {
      await t.storage.table('notes').add(row);
    }
    const entry = timeEntry(t, 30);
    await t.storage.table('time_entries').add(entry);
    const meta = await t.storage.files.put({
      businessId: t.businessId,
      bytes: new Uint8Array([0, 255, 7]),
      mediaType: 'application/octet-stream',
      name: 'beleg.bin',
    });
    const kit = createCommandKit(t.ctx);
    await kit.emit(t.businessId, 'note.added', { n: 1 });
    await kit.emit(t.businessId, 'note.removed', { n: 2 });

    const snapshot = await t.snapshot();
    expect(snapshot.business).toEqual(t.business);
    // Soft-deleted rows are part of what is stored.
    expect(snapshot.tables).toEqual({
      notes: [first, second, removed],
      time_entries: [entry],
      device_settings: [],
    });
    expect(alive(snapshot.tables.notes)).toHaveLength(2);
    expectTypeOf(snapshot.tables.notes).toEqualTypeOf<Note[]>();
    expectTypeOf(snapshot.tables.time_entries).toEqualTypeOf<TimeEntry[]>();
    expectTypeOf(snapshot.business).toEqualTypeOf<BusinessBase | undefined>();
    expect(snapshot.files).toEqual([{ meta, bytes: [0, 255, 7] }]);
    expect(snapshot.events.map((event) => event.type)).toEqual(['note.added', 'note.removed']);

    expect(await businessSnapshot(t.storage, REGISTRY, t.businessId)).toEqual(snapshot);
  });

  it('sorts files by id, whatever order the storage returns them in', async () => {
    const t = await createTestContext({ registry: REGISTRY });
    const put = (text: string) =>
      t.storage.files.put({
        businessId: t.businessId,
        bytes: bytesOf(text),
        mediaType: 'text/plain',
      });
    const [a, b, c] = [await put('a'), await put('b'), await put('c')];
    // What the storage handed out, to see that the snapshot leaves it in its order.
    const handedOut: { id: string }[][] = [];
    const reversed = <TRow extends { id: string }>(rows: TRow[]): TRow[] => {
      const list = rows.reverse();
      handedOut.push(list);
      return list;
    };
    const shuffled: ModuleStorage & { businesses: typeof t.storage.businesses } = {
      ...t.storage,
      files: {
        ...t.storage.files,
        ofBusiness: async (businessId) => reversed(await t.storage.files.ofBusiness(businessId)),
      },
      table: (definition) => {
        const store = t.storage.table(definition);
        return {
          ...store,
          ofBusiness: async (businessId) => reversed(await store.ofBusiness(businessId)),
        };
      },
    };
    for (const text of ['eins', 'zwei', 'drei']) {
      await t.storage.table('notes').add(note(t, text));
    }
    const snapshot = await businessSnapshot(shuffled, REGISTRY, t.businessId);
    expect(snapshot.files.map((file) => file.meta.id)).toEqual([a.id, b.id, c.id]);
    expect(snapshot.tables.notes.map((row) => row.id)).toEqual(
      (await t.snapshot()).tables.notes.map((row) => row.id),
    );
    expect(snapshot).toEqual(await t.snapshot());

    // The lists of the storage are sorted as copies, never in place.
    const lists = handedOut.filter((list) => list.length === 3);
    expect(lists).toHaveLength(2);
    for (const list of lists) {
      const ids = list.map((each) => each.id);
      expect(ids).toEqual([...ids].sort().reverse());
    }
  });

  it('is empty for a business the storage does not hold', async () => {
    const t = await createTestContext({ registry: REGISTRY });
    expect(await businessSnapshot(t.storage, REGISTRY, idNumber(77))).toEqual({
      business: undefined,
      tables: { notes: [], time_entries: [], device_settings: [] },
      files: [],
      events: [],
    });
  });

  it('tells two states apart: a changed row, a changed byte, another event', async () => {
    const t = await createTestContext({ registry: REGISTRY });
    const row = note(t, 'eins');
    await t.storage.table('notes').add(row);
    const before = await t.snapshot();

    await t.storage.table('notes').put({ ...row, text: 'zwei' });
    const changed = await t.snapshot();
    expect(changed).not.toEqual(before);

    await t.storage.files.put({
      businessId: t.businessId,
      bytes: bytesOf('a'),
      mediaType: 'text/plain',
    });
    const withFile = await t.snapshot();
    expect(withFile).not.toEqual(changed);

    await createCommandKit(t.ctx).emit(t.businessId, 'note.changed', {});
    expect(await t.snapshot()).not.toEqual(withFile);
  });

  it('proves a backup round trip in one line: the restored business equals the saved one', async () => {
    const t = await createTestContext({ registry: REGISTRY });
    const other = await t.addBusiness();
    const file = await t.storage.files.put({
      businessId: t.businessId,
      bytes: bytesOf('Foto'),
      mediaType: 'image/jpeg',
    });
    await t.storage.table('notes').add(note(t, 'mit Beleg', { fileId: file.id }));
    await t.storage.table('time_entries').add(timeEntry(t, 15));
    await other.storage.table('notes').add(note(other, 'bleibt'));
    const saved = await t.snapshot();
    const untouched = await other.snapshot();

    const backups = createBackupKit({
      format: 'sample-backup',
      version: 1,
      registry: REGISTRY,
      hasher: t.hasher,
    });
    const document = await backups.exportBackup(t.storage, t.businessId, { clock: t.clock });
    const { preview, backup } = await backups.checkBackup(JSON.parse(JSON.stringify(document)));
    expect(preview.problems).toEqual([]);
    if (backup === undefined) {
      throw new Error('The backup was refused');
    }

    await t.storage.purge(t.businessId);
    expect(await t.snapshot()).not.toEqual(saved);
    await backups.restoreBackup(t.storage, backup);

    expect(await t.snapshot()).toEqual(saved);
    expect(await other.snapshot()).toEqual(untouched);
  });
});

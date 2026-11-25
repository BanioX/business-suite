// Origin: BanioX/Randen packages/core/test/application.test.ts @ e0f0907 — adapted: the cases of the storage tests of this suite (tables, plain data, businesses, events, command log, files, transactions, purge, the command kit), written as one suite that runs against any storage; the tests that built the storage in memory themselves take a function that builds the storage under test
import {
  command,
  commandBase,
  CommandError,
  createCommandKit,
  type CommandContext,
  type CommandLogEntry,
  type DomainEvent,
} from '@onestrand/contract';
import { IdSchema, nameSchema, type Id } from '@onestrand/core';
import {
  alive,
  defineTable,
  requireRow,
  StorageError,
  type BusinessBase,
  type Hasher,
  type StorageErrorCode,
  type StoredFile,
} from '@onestrand/storage';
import { createHash } from 'node:crypto';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  anyJson,
  bytesOf,
  createTestStorage,
  hasher,
  NoteSchema,
  notesTable,
  REGISTRY,
  sequentialIds,
  snapshot,
  timeEntriesTable,
  type MakeStorage,
  type Note,
  type TestStorage,
  type TimeEntry,
} from './support';

/**
 * The time limit of a test that runs a property against a real database: many small databases are
 * opened, and under load (a full run with coverage) that takes far longer than the usual 5 s. Only
 * the properties carry it; every other test keeps the default.
 */
const PROPERTY_TIMEOUT = 60_000;

/** How a run of the suite is tuned: the properties run as often as the storage can bear. */
export interface ConformanceOptions {
  /** The number of runs of each property of fast-check. */
  runs: number;
}

/** The code of the `StorageError` a storage call fails with. */
async function codeOf(call: Promise<unknown>): Promise<StorageErrorCode | 'no error'> {
  try {
    await call;
  } catch (error) {
    if (error instanceof StorageError) {
      return error.code;
    }
    throw error;
  }
  return 'no error';
}

function event(t: TestStorage, businessId: Id, type: string): DomainEvent {
  return {
    id: t.ids.next(),
    type,
    version: 1,
    businessId,
    actor: t.one.personId,
    at: t.clock.now(),
    payload: { step: type },
  };
}

function commandEntry(t: TestStorage, businessId: Id, result: unknown): CommandLogEntry {
  return { commandId: t.ids.next(), businessId, operation: 'notes.add', result, at: t.clock.now() };
}

/** Rows, an event, a command and a file for a business, so there is something to lose. */
async function fill(t: TestStorage, businessId: Id, personId: Id) {
  const note = t.note(businessId, 'Erste Notiz');
  await t.storage.table('notes').add(note);
  await t.storage.table('notes').add(t.note(businessId, 'Zweite Notiz'));
  const entry = t.timeEntry(businessId, personId, 90);
  await t.storage.table('time_entries').add(entry);
  await t.storage.table('device_settings').add({
    id: t.ids.next(),
    businessId,
    key: 'printer',
    value: 'A4',
  });
  await t.storage.events.append(event(t, businessId, 'note.added'));
  const command = commandEntry(t, businessId, { noteId: note.id });
  await t.storage.commands.record(command);
  const file = await t.storage.files.put({
    businessId,
    bytes: bytesOf(`Datei von ${businessId}`),
    mediaType: 'text/plain',
    name: 'notiz.txt',
  });
  return { note, entry, command, file };
}

const renameNote = command({
  name: 'notes.rename',
  summary: 'Changes the text of a note.',
  access: { feature: 'notes', level: 'operate' },
  input: z.object({ ...commandBase, noteId: IdSchema, text: nameSchema(200) }),
  output: z.object({ noteId: IdSchema, text: z.string() }),
});

/** The sample operation as a use case: the command kit of the contract on the memory storage. */
function useCases(t: TestStorage, actor: Id) {
  const ctx: CommandContext = { storage: t.storage, clock: t.clock, ids: t.ids, actor };
  const { emit, runCommand } = createCommandKit(ctx);
  let runs = 0;
  return {
    runs: () => runs,
    rename: (raw: z.input<typeof renameNote.input>) => {
      const input = renameNote.input.parse(raw);
      return runCommand(renameNote, input, async () => {
        runs += 1;
        const notes = t.storage.table('notes');
        const note = await requireRow(notes, input.businessId, input.noteId, 'Note');
        await notes.put({ ...note, text: input.text, updatedAt: t.clock.now() });
        await emit(input.businessId, 'note.renamed', { noteId: note.id });
        return { noteId: note.id, text: input.text };
      });
    },
  };
}

async function setup(make: MakeStorage) {
  const t = await createTestStorage(make);
  const mine = t.note(t.one.business.id, 'Notiz von Betrieb Muster');
  const theirs = t.note(t.two.business.id, 'Notiz von Betrieb Beispiel');
  await t.storage.table('notes').add(mine);
  await t.storage.table('notes').add(theirs);
  return { t, mine, theirs, run: useCases(t, t.one.personId) };
}

export function storageConformance(
  label: string,
  make: MakeStorage,
  { runs }: ConformanceOptions,
): void {
  describe(label, () => {
    describe('tables', () => {
      it('has a store for every table of the register, by name and by definition', async () => {
        const t = await createTestStorage(make);
        for (const table of REGISTRY.tables) {
          expect(await t.storage.table(table).ofBusiness(t.one.business.id), table.name).toEqual(
            [],
          );
        }
        const note = t.note(t.one.business.id, 'Notiz');
        await t.storage.table('notes').add(note);
        // The same table, whichever way it is asked for.
        expect(await t.storage.table(notesTable).get(note.id)).toEqual(note);
        expect(t.storage.table(notesTable)).toBe(t.storage.table('notes'));
      });

      it('fails for a table the register does not have', async () => {
        const t = await createTestStorage(make);
        const anyStorage: { table: (name: string) => unknown } = t.storage;
        expect(() => anyStorage.table('customers')).toThrow(StorageError);
        expect(() => anyStorage.table('customers')).toThrow(
          'Unknown table "customers"; registered: notes, time_entries, device_settings',
        );
        expect(() => t.storage.table({ ...notesTable, name: 'other_notes' })).toThrow(
          /Unknown table "other_notes"/,
        );
      });

      it('refuses a definition that is another table of the same name', async () => {
        const t = await createTestStorage(make);
        // Another module calls its table «notes» too: its rows are not the rows stored here.
        const otherNotes = defineTable({
          name: 'notes',
          schema: NoteSchema.extend({}),
          indexes: [],
          sensitivity: 'normal',
          sync: 'device',
        });
        expect(() => t.storage.table(otherNotes)).toThrow(StorageError);
        expect(() => t.storage.table(otherNotes)).toThrow(
          'Table "notes" of this storage is not the table of the definition given',
        );
        // A ledger must be able to rely on «rows are never replaced».
        expect(() => t.storage.table({ ...notesTable, appendOnly: true })).toThrow(StorageError);
        expect(() => t.storage.table({ ...timeEntriesTable, appendOnly: false })).toThrow(
          StorageError,
        );
        // The same table declared again, or taken from the register, is the same table.
        expect(t.storage.table({ ...notesTable })).toBe(t.storage.table('notes'));
        expect(t.storage.table(REGISTRY.get('time_entries'))).toBe(t.storage.table('time_entries'));
      });

      it('hands out copies and keeps a copy', async () => {
        const t = await createTestStorage(make);
        const note = t.note(t.one.business.id, 'Notiz', { tags: ['a'] });
        await t.storage.table('notes').add(note);
        note.tags?.push('changed after add');
        const read = await t.storage.table('notes').get(note.id);
        read?.tags?.push('changed after get');
        const listed = await t.storage.table('notes').ofBusiness(t.one.business.id);
        listed[0]?.tags?.push('changed after ofBusiness');
        expect((await t.storage.table('notes').get(note.id))?.tags).toEqual(['a']);
      });

      it('keeps fields no schema knows exactly as they are, at any depth', async () => {
        const t = await createTestStorage(make);
        const row = {
          ...t.note(t.one.business.id, 'Notiz', { place: { room: 'Lager', floor: 1 } }),
          colour: 'blue',
          nested: { list: [{ a: 1, b: [true, null] }], text: 'ä' },
        };
        Object.assign(row.place ?? {}, { door: 'B' });
        await t.storage.table('notes').put(row);
        expect(await t.storage.table('notes').get(row.id)).toEqual(row);
        expect(await t.storage.table('notes').ofBusiness(t.one.business.id)).toEqual([row]);
      });

      it('checks no schema: what the table would not accept is stored all the same', async () => {
        const t = await createTestStorage(make);
        const broken = { ...t.note(t.one.business.id, 'Notiz'), text: 42 } as unknown as Note;
        await t.storage.table('notes').put(broken);
        expect(await t.storage.table('notes').get(broken.id)).toEqual(broken);
      });

      it.each([
        ['no id', { id: undefined }],
        ['an empty id', { id: '' }],
        ['an id that is no text', { id: 7 }],
        ['no business', { businessId: undefined }],
        ['an empty business', { businessId: '' }],
        ['a business that is no text', { businessId: null }],
      ])(
        'refuses a row with %s: it would be stored where nothing finds it',
        async (_what, change) => {
          const t = await createTestStorage(make);
          const row = { ...t.note(t.one.business.id, 'Notiz'), ...change } as unknown as Note;
          expect(await codeOf(t.storage.table('notes').put(row))).toBe('invalid_id');
          expect(await codeOf(t.storage.table('notes').add(row))).toBe('invalid_id');
          const entry = { ...t.timeEntry(t.one.business.id, t.one.personId, 5), ...change };
          expect(
            await codeOf(t.storage.table('time_entries').put(entry as unknown as TimeEntry)),
          ).toBe('invalid_id');
          for (const table of REGISTRY.tables) {
            expect(await t.storage.table(table).ofBusiness(t.one.business.id), table.name).toEqual(
              [],
            );
            expect(await t.storage.table(table).get(undefined as unknown as Id)).toBeUndefined();
          }
        },
      );

      it('refuses what is no row at all', async () => {
        const t = await createTestStorage(make);
        for (const value of [null, undefined, 'Notiz', 7, [t.note(t.one.business.id, 'Notiz')]]) {
          expect(await codeOf(t.storage.table('notes').put(value as unknown as Note))).toBe(
            'invalid_id',
          );
        }
        await expect(t.storage.table('notes').put(null as unknown as Note)).rejects.toThrow(
          'A row of notes needs "id": a text that is not empty',
        );
      });

      it('answers nothing for an id it does not have', async () => {
        const t = await createTestStorage(make);
        expect(await t.storage.table('notes').get(t.ids.next())).toBeUndefined();
      });

      it('refuses to add a row twice', async () => {
        const t = await createTestStorage(make);
        const note = t.note(t.one.business.id, 'Notiz');
        await t.storage.table('notes').add(note);
        expect(await codeOf(t.storage.table('notes').add({ ...note, text: 'Andere' }))).toBe(
          'exists',
        );
        expect((await t.storage.table('notes').get(note.id))?.text).toBe('Notiz');
      });

      it('inserts and replaces with put', async () => {
        const t = await createTestStorage(make);
        const note = t.note(t.one.business.id, 'Notiz');
        await t.storage.table('notes').put(note);
        await t.storage.table('notes').put({ ...note, text: 'Geändert' });
        expect(await t.storage.table('notes').ofBusiness(t.one.business.id)).toEqual([
          { ...note, text: 'Geändert' },
        ]);
      });

      it('keeps the same id apart in two tables', async () => {
        const t = await createTestStorage(make);
        const note = t.note(t.one.business.id, 'Notiz');
        await t.storage.table('notes').add(note);
        expect(await t.storage.table('time_entries').get(note.id)).toBeUndefined();
      });

      it('returns soft-deleted rows; alive filters them', async () => {
        const t = await createTestStorage(make);
        const kept = t.note(t.one.business.id, 'Bleibt');
        const removed = t.note(t.one.business.id, 'Entfernt', { deletedAt: t.clock.now() });
        await t.storage.table('notes').add(kept);
        await t.storage.table('notes').add(removed);
        const rows = await t.storage.table('notes').ofBusiness(t.one.business.id);
        expect(rows).toHaveLength(2);
        expect(alive(rows)).toEqual([kept]);
      });

      it('settles every refusal through the promise, never as an exception of the call', async () => {
        const t = await createTestStorage(make);
        const note = t.note(t.one.business.id, 'Notiz');
        await t.storage.table('notes').add(note);
        let call: Promise<void> | undefined;
        expect(() => {
          call = t.storage.table('notes').add(note);
        }).not.toThrow();
        await expect(call).rejects.toBeInstanceOf(StorageError);
      });
    });

    describe('append-only tables', () => {
      it('adds rows with add and with put', async () => {
        const t = await createTestStorage(make);
        const first = t.timeEntry(t.one.business.id, t.one.personId, 60);
        const second = t.timeEntry(t.one.business.id, t.one.personId, -15);
        await t.storage.table('time_entries').add(first);
        await t.storage.table('time_entries').put(second);
        expect(await t.storage.table('time_entries').ofBusiness(t.one.business.id)).toEqual([
          first,
          second,
        ]);
      });

      it('never replaces a row: put on an existing id fails and changes nothing', async () => {
        const t = await createTestStorage(make);
        const entry = t.timeEntry(t.one.business.id, t.one.personId, 60);
        await t.storage.table('time_entries').add(entry);
        expect(await codeOf(t.storage.table('time_entries').put({ ...entry, minutes: 600 }))).toBe(
          'append_only',
        );
        // Not even with the very same content: the table is told «add», and the row is there.
        expect(await codeOf(t.storage.table('time_entries').put(entry))).toBe('append_only');
        expect(await codeOf(t.storage.table('time_entries').add(entry))).toBe('exists');
        expect(await t.storage.table('time_entries').get(entry.id)).toEqual(entry);
      });
    });

    describe('plain data', () => {
      it.each([
        ['a number that is not finite', { score: Number.NaN }],
        ['infinity', { score: Number.POSITIVE_INFINITY }],
        ['a date object', { on: new Date(0) }],
        ['a map', { byKey: new Map([['a', 1]]) }],
        ['bytes', { photo: Uint8Array.of(1, 2, 3) }],
        ['a function', { run: () => 1 }],
        ['a big integer', { count: 10n }],
        ['a missing value in a list', { tags: ['a', undefined] }],
      ])('refuses a row with %s and stores nothing', async (_what, more) => {
        const t = await createTestStorage(make);
        const row = { ...t.note(t.one.business.id, 'Notiz'), ...more } as unknown as Note;
        expect(await codeOf(t.storage.table('notes').put(row))).toBe('not_plain');
        expect(await codeOf(t.storage.table('notes').add(row))).toBe('not_plain');
        expect(await t.storage.table('notes').ofBusiness(t.one.business.id)).toEqual([]);
      });

      it('stores a row as a backup file would give it back', async () => {
        const t = await createTestStorage(make);
        const row = {
          ...t.note(t.one.business.id, 'Notiz'),
          nothing: undefined,
          zero: -0,
          empty: null,
        };
        await t.storage.table('notes').put(row);
        const read = await t.storage.table('notes').get(row.id);
        expect(read).toStrictEqual(JSON.parse(JSON.stringify(row)));
        expect(Object.is((read as { zero?: number } | undefined)?.zero, 0)).toBe(true);
        expect(read).not.toHaveProperty('nothing');
      });

      it(
        'stores any row of plain data as JSON would carry it',
        async () => {
          const t = await createTestStorage(make);
          await fc.assert(
            fc.asyncProperty(fc.dictionary(fc.string(), anyJson), async (more) => {
              fc.pre(
                !Object.keys(more).some((key) => ['id', 'businessId', '__proto__'].includes(key)),
              );
              const row = { ...more, id: t.ids.next(), businessId: t.one.business.id };
              await t.storage.table('notes').put(row as unknown as Note);
              expect(await t.storage.table('notes').get(row.id)).toStrictEqual(
                JSON.parse(JSON.stringify(row)),
              );
            }),
            { numRuns: runs },
          );
        },
        PROPERTY_TIMEOUT,
      );
    });

    describe('several businesses on one device', () => {
      it('keeps businesses apart', async () => {
        const t = await createTestStorage(make);
        const mine = await fill(t, t.one.business.id, t.one.personId);
        const theirs = await fill(t, t.two.business.id, t.two.personId);

        const notes = await t.storage.table('notes').ofBusiness(t.one.business.id);
        expect(notes.map((row) => row.text).sort()).toEqual(['Erste Notiz', 'Zweite Notiz']);
        expect(notes.every((row) => row.businessId === t.one.business.id)).toBe(true);
        expect(await t.storage.table('time_entries').ofBusiness(t.two.business.id)).toEqual([
          theirs.entry,
        ]);
        expect(
          (await t.storage.events.ofBusiness(t.one.business.id)).map((e) => e.businessId),
        ).toEqual([t.one.business.id]);
        expect(await t.storage.files.ofBusiness(t.one.business.id)).toEqual([mine.file]);
        expect(await t.storage.files.ofBusiness(t.two.business.id)).toEqual([theirs.file]);
        // A business that is not on the device has nothing.
        expect(await t.storage.table('notes').ofBusiness(t.ids.next())).toEqual([]);
      });

      it('never lets a row change hands', async () => {
        const t = await createTestStorage(make);
        const note = t.note(t.one.business.id, 'Notiz von Betrieb Muster');
        await t.storage.table('notes').add(note);
        const taken = { ...note, businessId: t.two.business.id, text: 'Übernommen' };
        expect(await codeOf(t.storage.table('notes').put(taken))).toBe('other_business');
        expect(await codeOf(t.storage.table('notes').add(taken))).toBe('exists');
        expect(await t.storage.table('notes').get(note.id)).toEqual(note);
        expect(await t.storage.table('notes').ofBusiness(t.two.business.id)).toEqual([]);
      });

      it('lists every business on the device', async () => {
        const t = await createTestStorage(make);
        expect(await t.storage.businesses.all()).toEqual([t.one.business, t.two.business]);
        expect(await t.storage.businesses.get(t.two.business.id)).toEqual(t.two.business);
        expect(await t.storage.businesses.get(t.ids.next())).toBeUndefined();
      });

      it('adds a business once, replaces it with put and keeps fields it does not know', async () => {
        const t = await createTestStorage(make);
        expect(await codeOf(t.storage.businesses.add(t.one.business))).toBe('exists');
        const changed = { ...t.one.business, name: 'Betrieb Muster AG', currency: 'CHF' };
        await t.storage.businesses.put(changed);
        const read = await t.storage.businesses.get(t.one.business.id);
        expect(read).toEqual(changed);
        if (read !== undefined) {
          read.name = 'changed after get';
        }
        expect((await t.storage.businesses.get(t.one.business.id))?.name).toBe('Betrieb Muster AG');
        const third = { ...t.one.business, id: t.ids.next(), name: 'Betrieb Drei' };
        await t.storage.businesses.put(third);
        expect((await t.storage.businesses.all()).map((row) => row.name)).toEqual([
          'Betrieb Muster AG',
          'Betrieb Beispiel',
          'Betrieb Drei',
        ]);
      });

      it('refuses a business without an id', async () => {
        const t = await createTestStorage(make);
        for (const id of [undefined, '', 7]) {
          const business = {
            ...t.one.business,
            id,
            name: 'Ohne Kennung',
          } as unknown as BusinessBase;
          expect(await codeOf(t.storage.businesses.add(business))).toBe('invalid_id');
          expect(await codeOf(t.storage.businesses.put(business))).toBe('invalid_id');
        }
        expect(await t.storage.businesses.all()).toEqual([t.one.business, t.two.business]);
      });

      it('purges one business for good and leaves the other alone', async () => {
        const t = await createTestStorage(make);
        const mine = await fill(t, t.one.business.id, t.one.personId);
        const theirs = await fill(t, t.two.business.id, t.two.personId);
        const before = await snapshot(t.storage, t.two.business.id);

        await t.storage.purge(t.one.business.id);

        expect(await t.storage.businesses.get(t.one.business.id)).toBeUndefined();
        for (const table of REGISTRY.tables) {
          expect(await t.storage.table(table).ofBusiness(t.one.business.id), table.name).toEqual(
            [],
          );
        }
        expect(await t.storage.table('notes').get(mine.note.id)).toBeUndefined();
        expect(await t.storage.events.ofBusiness(t.one.business.id)).toEqual([]);
        expect(await t.storage.files.ofBusiness(t.one.business.id)).toEqual([]);
        expect(await t.storage.files.get(mine.file.id)).toBeUndefined();
        expect(await t.storage.commands.find(mine.command.commandId)).toBeUndefined();

        // The other business: every row, event and file as before, and its commands still known.
        expect(await snapshot(t.storage, t.two.business.id)).toEqual(before);
        expect(await t.storage.commands.find(theirs.command.commandId)).toEqual(theirs.command);
        expect(await t.storage.files.verify(theirs.file.id)).toBe(true);
        expect(await t.storage.businesses.all()).toEqual([t.two.business]);
      });

      it('purges nothing for a business that is not on the device', async () => {
        const t = await createTestStorage(make);
        await fill(t, t.one.business.id, t.one.personId);
        const before = await snapshot(t.storage, t.one.business.id);
        await t.storage.purge(t.ids.next());
        expect(await snapshot(t.storage, t.one.business.id)).toEqual(before);
      });

      it('lets the ids of a purged business be used again', async () => {
        const t = await createTestStorage(make);
        const mine = await fill(t, t.one.business.id, t.one.personId);
        await t.storage.purge(t.one.business.id);
        await t.storage.businesses.add(t.one.business);
        await t.storage.table('notes').add(mine.note);
        await t.storage.table('time_entries').add(mine.entry);
        await t.storage.commands.record(mine.command);
        expect(await t.storage.table('notes').ofBusiness(t.one.business.id)).toEqual([mine.note]);
      });
    });

    describe('events', () => {
      it('returns the events of a business in the order they were appended', async () => {
        const t = await createTestStorage(make);
        const types = ['note.added', 'note.changed', 'time.booked', 'note.removed'];
        // Ids that count down, so the order cannot come from the ids.
        const ids = [4, 3, 2, 1].map((start) => sequentialIds(9000 + start).next());
        for (const [index, type] of types.entries()) {
          await t.storage.events.append({
            ...event(t, t.one.business.id, type),
            id: ids[index] ?? t.ids.next(),
          });
          await t.storage.events.append(event(t, t.two.business.id, 'other.happened'));
        }
        const events = await t.storage.events.ofBusiness(t.one.business.id);
        expect(events.map((row) => row.type)).toEqual(types);
      });

      it('refuses an event twice and hands out copies', async () => {
        const t = await createTestStorage(make);
        const first = event(t, t.one.business.id, 'note.added');
        await t.storage.events.append(first);
        expect(await codeOf(t.storage.events.append({ ...first, type: 'note.changed' }))).toBe(
          'exists',
        );
        first.payload.step = 'changed after append';
        const read = await t.storage.events.ofBusiness(t.one.business.id);
        if (read[0] !== undefined) {
          read[0].payload.step = 'changed after read';
        }
        expect(await t.storage.events.ofBusiness(t.one.business.id)).toEqual([
          { ...first, payload: { step: 'note.added' } },
        ]);
      });
    });

    describe('what the logs refuse', () => {
      it('refuses an event without its id or its business: no purge would ever remove it', async () => {
        const t = await createTestStorage(make);
        const good = event(t, t.one.business.id, 'note.added');
        for (const change of [{ id: undefined }, { id: '' }, { businessId: undefined }]) {
          expect(await codeOf(t.storage.events.append({ ...good, ...change } as DomainEvent))).toBe(
            'invalid_id',
          );
        }
        expect(await t.storage.events.ofBusiness(t.one.business.id)).toEqual([]);
      });

      it('refuses an entry of the command log without its command or its business', async () => {
        const t = await createTestStorage(make);
        const good = commandEntry(t, t.one.business.id, {});
        for (const change of [
          { commandId: undefined },
          { businessId: undefined },
          { businessId: '' },
        ]) {
          expect(
            await codeOf(t.storage.commands.record({ ...good, ...change } as CommandLogEntry)),
          ).toBe('invalid_id');
        }
        expect(await t.storage.commands.find(good.commandId)).toBeUndefined();
      });

      it('refuses an event or a result that is not plain data', async () => {
        const t = await createTestStorage(make);
        const withDate = {
          ...event(t, t.one.business.id, 'note.added'),
          payload: { on: new Date(0) },
        };
        expect(await codeOf(t.storage.events.append(withDate))).toBe('not_plain');
        expect(
          await codeOf(t.storage.commands.record(commandEntry(t, t.one.business.id, new Map()))),
        ).toBe('not_plain');
      });
    });

    describe('command log', () => {
      it('finds the whole entry of a command: operation, business, result and time', async () => {
        const t = await createTestStorage(make);
        const entry = commandEntry(t, t.one.business.id, { noteId: t.ids.next(), tags: ['a'] });
        await t.storage.commands.record(entry);
        expect(await t.storage.commands.find(entry.commandId)).toEqual(entry);
        expect(await t.storage.commands.find(t.ids.next())).toBeUndefined();
      });

      it('refuses a second entry for the same command, also of another business', async () => {
        const t = await createTestStorage(make);
        const entry = commandEntry(t, t.one.business.id, { ok: true });
        await t.storage.commands.record(entry);
        expect(await codeOf(t.storage.commands.record({ ...entry, result: { ok: false } }))).toBe(
          'exists',
        );
        expect(
          await codeOf(t.storage.commands.record({ ...entry, businessId: t.two.business.id })),
        ).toBe('exists');
        expect(await t.storage.commands.find(entry.commandId)).toEqual(entry);
      });

      it('hands out copies and keeps a copy', async () => {
        const t = await createTestStorage(make);
        const result = { tags: ['a'] };
        const entry = commandEntry(t, t.one.business.id, result);
        await t.storage.commands.record(entry);
        result.tags.push('changed after record');
        const read = await t.storage.commands.find(entry.commandId);
        (read?.result as typeof result | undefined)?.tags.push('changed after find');
        expect((await t.storage.commands.find(entry.commandId))?.result).toEqual({ tags: ['a'] });
      });
    });

    describe('files', () => {
      it('stores bytes with checksum, size, media type, name, time and a fresh id', async () => {
        const t = await createTestStorage(make);
        const bytes = bytesOf('Rapport vom 14.11.2026, unterschrieben');
        const meta = await t.storage.files.put({
          businessId: t.one.business.id,
          bytes,
          mediaType: 'application/pdf',
          name: 'rapport.pdf',
        });
        expect(meta).toEqual({
          id: meta.id,
          businessId: t.one.business.id,
          sha256: createHash('sha256').update(bytes).digest('hex'),
          size: bytes.length,
          mediaType: 'application/pdf',
          name: 'rapport.pdf',
          createdAt: '2026-11-14T10:00:00.000Z',
        });
        expect(await t.storage.files.get(meta.id)).toEqual({ meta, bytes });
        expect(await t.storage.files.ofBusiness(t.one.business.id)).toEqual([meta]);
        expect(await t.storage.files.verify(meta.id)).toBe(true);
      });

      it('stores a file without a name, and an empty one', async () => {
        const t = await createTestStorage(make);
        const meta = await t.storage.files.put({
          businessId: t.one.business.id,
          bytes: new Uint8Array(),
          mediaType: 'application/octet-stream',
        });
        expect(meta).not.toHaveProperty('name');
        expect(meta.size).toBe(0);
        expect(meta.sha256).toBe(
          'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        );
        expect((await t.storage.files.get(meta.id))?.bytes).toEqual(new Uint8Array());
      });

      it('copies the bytes in and out', async () => {
        const t = await createTestStorage(make);
        const bytes = Uint8Array.of(1, 2, 3);
        const meta = await t.storage.files.put({
          businessId: t.one.business.id,
          bytes,
          mediaType: 'image/png',
        });
        bytes[0] = 99;
        const read = await t.storage.files.get(meta.id);
        read?.bytes.fill(7);
        if (read !== undefined) {
          read.meta.name = 'changed after get';
        }
        expect(await t.storage.files.get(meta.id)).toEqual({ meta, bytes: Uint8Array.of(1, 2, 3) });
        expect(await t.storage.files.verify(meta.id)).toBe(true);
      });

      it('stores only the part of a buffer the bytes cover', async () => {
        const t = await createTestStorage(make);
        const view = Uint8Array.of(0, 1, 2, 3, 4, 5).subarray(2, 4);
        const meta = await t.storage.files.put({
          businessId: t.one.business.id,
          bytes: view,
          mediaType: 'image/png',
        });
        expect((await t.storage.files.get(meta.id))?.bytes).toEqual(Uint8Array.of(2, 3));
        expect(meta.sha256).toBe(createHash('sha256').update(Uint8Array.of(2, 3)).digest('hex'));
      });

      it.each(['', 'IMAGE/PNG', 'image', 'image/', 'image/png; q=1', ' image/png'])(
        'refuses the media type %j and stores nothing',
        async (mediaType) => {
          const t = await createTestStorage(make);
          const put = t.storage.files.put({
            businessId: t.one.business.id,
            bytes: bytesOf('x'),
            mediaType,
          });
          expect(await codeOf(put)).toBe('invalid_file');
          await expect(put).rejects.toThrow('The meta data of a file does not fit: mediaType');
          expect(await t.storage.files.ofBusiness(t.one.business.id)).toEqual([]);
        },
      );

      it('refuses a file without a business, with a name of spaces, and names every field', async () => {
        const t = await createTestStorage(make);
        const put = t.storage.files.put({
          businessId: 'no id' as Id,
          bytes: bytesOf('x'),
          mediaType: 'text/plain',
          name: '   ',
        });
        expect(await codeOf(put)).toBe('invalid_file');
        await expect(put).rejects.toThrow('The meta data of a file does not fit: businessId, name');
      });

      it.each([
        ['a text', 'Foto'],
        ['a number', 3],
        ['a list of numbers', [1, 2, 3]],
        ['a buffer without a view', new ArrayBuffer(3)],
        ['nothing', undefined],
      ])('refuses %s as the bytes of a file instead of storing zeros', async (_what, bytes) => {
        const t = await createTestStorage(make);
        const put = t.storage.files.put({
          businessId: t.one.business.id,
          bytes: bytes as unknown as Uint8Array,
          mediaType: 'text/plain',
        });
        expect(await codeOf(put)).toBe('invalid_file');
        expect(await t.storage.files.ofBusiness(t.one.business.id)).toEqual([]);
      });

      it('trims the name of a file as it trims every name', async () => {
        const t = await createTestStorage(make);
        const meta = await t.storage.files.put({
          businessId: t.one.business.id,
          bytes: bytesOf('x'),
          mediaType: 'text/plain',
          name: '  rapport.txt ',
        });
        expect(meta.name).toBe('rapport.txt');
        expect((await t.storage.files.get(meta.id))?.meta.name).toBe('rapport.txt');
      });

      it('answers nothing for a file it does not have, and does not verify it', async () => {
        const t = await createTestStorage(make);
        expect(await t.storage.files.get(t.ids.next())).toBeUndefined();
        expect(await t.storage.files.verify(t.ids.next())).toBe(false);
      });

      it('notices bytes that no longer match their checksum', async () => {
        // A hasher that answers differently later stands in for bytes that changed on the disk.
        let damaged = false;
        const flaky: Hasher = {
          sha256: async (data) => hasher.sha256(damaged ? Uint8Array.of(...data, 0) : data),
        };
        const { storage } = await createTestStorage(make, { hasher: flaky });
        const businessId = sequentialIds(500).next();
        const meta = await storage.files.put({
          businessId,
          bytes: bytesOf('x'),
          mediaType: 'text/plain',
        });
        expect(await storage.files.verify(meta.id)).toBe(true);
        damaged = true;
        expect(await storage.files.verify(meta.id)).toBe(false);
      });

      it('fails at the first file if the hasher does not answer with a checksum', async () => {
        const { storage } = await createTestStorage(make, {
          hasher: { sha256: () => Promise.resolve('ABCDEF') },
        });
        await expect(
          storage.files.put({
            businessId: sequentialIds(500).next(),
            bytes: bytesOf('x'),
            mediaType: 'text/plain',
          }),
        ).rejects.toThrow(TypeError);
      });

      describe('restore', () => {
        async function stored(t: TestStorage): Promise<StoredFile> {
          const meta = await t.storage.files.put({
            businessId: t.one.business.id,
            bytes: bytesOf('Foto vorher'),
            mediaType: 'image/jpeg',
            name: 'vorher.jpg',
          });
          const file = await t.storage.files.get(meta.id);
          if (file === undefined) {
            throw new Error('The file was just stored');
          }
          return file;
        }

        it('brings a file back with the id and the time it had', async () => {
          const t = await createTestStorage(make);
          const file = await stored(t);
          await t.storage.purge(t.one.business.id);
          t.clock.setToday('2027-01-01');
          await t.storage.files.restore(file);
          expect(await t.storage.files.get(file.meta.id)).toEqual(file);
          expect(await t.storage.files.verify(file.meta.id)).toBe(true);
        });

        it('keeps meta data a newer version added', async () => {
          const t = await createTestStorage(make);
          const file = await stored(t);
          await t.storage.purge(t.one.business.id);
          const newer = { ...file, meta: { ...file.meta, takenAt: '2026-11-13T08:00:00.000Z' } };
          await t.storage.files.restore(newer);
          expect((await t.storage.files.get(file.meta.id))?.meta).toEqual(newer.meta);
          expect(await t.storage.files.ofBusiness(t.one.business.id)).toEqual([newer.meta]);
        });

        it('refuses a file that is there already', async () => {
          const t = await createTestStorage(make);
          const file = await stored(t);
          expect(await codeOf(t.storage.files.restore(file))).toBe('exists');
        });

        it('refuses bytes that do not match the checksum or the size', async () => {
          const t = await createTestStorage(make);
          const file = await stored(t);
          await t.storage.purge(t.one.business.id);
          const otherBytes = { ...file, bytes: bytesOf('Foto nachher') };
          expect(await codeOf(t.storage.files.restore(otherBytes))).toBe('checksum');
          const otherSize = { ...file, meta: { ...file.meta, size: file.meta.size + 1 } };
          expect(await codeOf(t.storage.files.restore(otherSize))).toBe('checksum');
          expect(await t.storage.files.ofBusiness(t.one.business.id)).toEqual([]);
        });

        it('refuses meta data that is malformed', async () => {
          const t = await createTestStorage(make);
          const file = await stored(t);
          await t.storage.purge(t.one.business.id);
          const malformed = { ...file, meta: { ...file.meta, mediaType: 'JPEG' } };
          expect(await codeOf(t.storage.files.restore(malformed))).toBe('invalid_file');
          const noBytes = { ...file, bytes: 'Foto vorher' as unknown as StoredFile['bytes'] };
          expect(await codeOf(t.storage.files.restore(noBytes))).toBe('invalid_file');
          expect(await t.storage.files.ofBusiness(t.one.business.id)).toEqual([]);
        });

        it('keeps a copy of the bytes it was given', async () => {
          const t = await createTestStorage(make);
          const file = await stored(t);
          await t.storage.purge(t.one.business.id);
          const bytes = new Uint8Array(file.bytes);
          await t.storage.files.restore({ meta: file.meta, bytes });
          bytes.fill(0);
          expect(await t.storage.files.verify(file.meta.id)).toBe(true);
        });
      });
    });

    describe('transactions', () => {
      it('returns what the work returns and keeps what it wrote', async () => {
        const t = await createTestStorage(make);
        const note = t.note(t.one.business.id, 'Notiz');
        const result = await t.storage.transaction(async () => {
          await t.storage.table('notes').add(note);
          return 'done';
        });
        expect(result).toBe('done');
        expect(await t.storage.table('notes').get(note.id)).toEqual(note);
      });

      it('rolls a failed transaction back: tables, businesses, events, command log and files', async () => {
        const t = await createTestStorage(make);
        const kept = await fill(t, t.one.business.id, t.one.personId);
        const before = {
          one: await snapshot(t.storage, t.one.business.id),
          two: await snapshot(t.storage, t.two.business.id),
          businesses: await t.storage.businesses.all(),
        };
        const command = commandEntry(t, t.one.business.id, { ok: true });
        let fileId: Id | undefined;

        await expect(
          t.storage.transaction(async () => {
            await t.storage.table('notes').put({ ...kept.note, text: 'Geändert' });
            await t.storage.table('notes').add(t.note(t.one.business.id, 'Neu'));
            await t.storage
              .table('time_entries')
              .add(t.timeEntry(t.one.business.id, t.one.personId, 5));
            await t.storage.businesses.put({ ...t.one.business, name: 'Umbenannt' });
            await t.storage.businesses.add({ ...t.one.business, id: t.ids.next(), name: 'Neu' });
            await t.storage.events.append(event(t, t.one.business.id, 'note.changed'));
            await t.storage.commands.record(command);
            fileId = (
              await t.storage.files.put({
                businessId: t.one.business.id,
                bytes: bytesOf('neu'),
                mediaType: 'text/plain',
              })
            ).id;
            throw new Error('stop');
          }),
        ).rejects.toThrow('stop');

        expect(await snapshot(t.storage, t.one.business.id)).toEqual(before.one);
        expect(await snapshot(t.storage, t.two.business.id)).toEqual(before.two);
        expect(await t.storage.businesses.all()).toEqual(before.businesses);
        expect(await t.storage.commands.find(command.commandId)).toBeUndefined();
        expect(await t.storage.commands.find(kept.command.commandId)).toEqual(kept.command);
        expect(fileId).toBeDefined();
        expect(
          fileId === undefined ? undefined : await t.storage.files.get(fileId),
        ).toBeUndefined();
      });

      it('brings a purged business back if the transaction fails', async () => {
        const t = await createTestStorage(make);
        const kept = await fill(t, t.one.business.id, t.one.personId);
        const before = await snapshot(t.storage, t.one.business.id);
        await expect(
          t.storage.transaction(async () => {
            await t.storage.purge(t.one.business.id);
            expect(await t.storage.businesses.get(t.one.business.id)).toBeUndefined();
            throw new Error('stop');
          }),
        ).rejects.toThrow('stop');
        expect(await snapshot(t.storage, t.one.business.id)).toEqual(before);
        expect(await t.storage.commands.find(kept.command.commandId)).toEqual(kept.command);
      });

      it('joins a transaction inside another: all of it happens or none', async () => {
        const t = await createTestStorage(make);
        const outer = t.note(t.one.business.id, 'Aussen');
        const inner = t.note(t.one.business.id, 'Innen');
        await expect(
          t.storage.transaction(async () => {
            await t.storage.table('notes').add(outer);
            await t.storage.transaction(async () => {
              await t.storage.table('notes').add(inner);
            });
            throw new Error('stop');
          }),
        ).rejects.toThrow('stop');
        expect(await t.storage.table('notes').ofBusiness(t.one.business.id)).toEqual([]);

        await t.storage.transaction(async () => {
          await t.storage.table('notes').add(outer);
          await t.storage.transaction(async () => {
            await t.storage.table('notes').add(inner);
          });
        });
        expect(await t.storage.table('notes').ofBusiness(t.one.business.id)).toEqual([
          outer,
          inner,
        ]);
      });

      it('fails the outer transaction if one inside it failed, even if the error was caught', async () => {
        const t = await createTestStorage(make);
        const before = t.note(t.one.business.id, 'Vorher');
        const inner = t.note(t.one.business.id, 'Innen');
        const after = t.note(t.one.business.id, 'Nachher');
        const outer = t.storage.transaction(async () => {
          await t.storage.table('notes').add(before);
          await t.storage
            .transaction(async () => {
              await t.storage.table('notes').add(inner);
              throw new Error('inner stop');
            })
            .catch(() => undefined);
          // The outer work goes on as if nothing had happened, and ends well.
          await t.storage.table('notes').add(after);
          return 'done';
        });
        // The inner one wrote half of its work. Keeping that would break «all or nothing», so the
        // whole transaction fails with the error of the inner one, as the database of the browser
        // does it.
        await expect(outer).rejects.toThrow('inner stop');
        expect(await t.storage.table('notes').ofBusiness(t.one.business.id)).toEqual([]);
      });

      it('keeps the first error if several transactions inside failed', async () => {
        const t = await createTestStorage(make);
        const failing = (message: string) =>
          t.storage.transaction(() => Promise.reject(new Error(message))).catch(() => undefined);
        await expect(
          t.storage.transaction(async () => {
            await failing('first');
            await failing('second');
          }),
        ).rejects.toThrow('first');
      });

      it('forgets a failure inside once the outer transaction is over', async () => {
        const t = await createTestStorage(make);
        await expect(
          t.storage.transaction(async () => {
            await t.storage
              .transaction(() => Promise.reject(new Error('inner stop')))
              .catch(() => 0);
          }),
        ).rejects.toThrow('inner stop');
        const note = t.note(t.one.business.id, 'Danach');
        await t.storage.transaction(async () => {
          await t.storage.transaction(async () => {
            await t.storage.table('notes').add(note);
          });
        });
        expect(await t.storage.table('notes').get(note.id)).toEqual(note);
      });

      it('keeps a late failure of an overlapping transaction away from the next one', async () => {
        const t = await createTestStorage(make);
        let fail: (error: Error) => void = () => undefined;
        const gate = new Promise<never>((_resolve, reject) => {
          fail = reject;
        });
        let late: Promise<never> | undefined;
        await t.storage.transaction(() => {
          // Started while the first one runs, so it joins it; it fails when that one is long over.
          late = t.storage.transaction(() => gate);
          return Promise.resolve();
        });
        fail(new Error('late'));
        await expect(late).rejects.toThrow('late');

        const note = t.note(t.one.business.id, 'Danach');
        await t.storage.transaction(async () => {
          await t.storage.table('notes').add(note);
        });
        expect(await t.storage.table('notes').get(note.id)).toEqual(note);
      });

      it('does not fail a transaction for a refused call that the work caught', async () => {
        const t = await createTestStorage(make);
        const note = t.note(t.one.business.id, 'Notiz');
        await t.storage.transaction(async () => {
          await t.storage.table('notes').add(note);
          // A single call of the storage that fails is no transaction: the work may go on.
          expect(await codeOf(t.storage.table('notes').add(note))).toBe('exists');
        });
        expect(await t.storage.table('notes').get(note.id)).toEqual(note);
      });

      it('starts afresh after a failed transaction', async () => {
        const t = await createTestStorage(make);
        await expect(
          t.storage.transaction(() => Promise.reject(new Error('stop'))),
        ).rejects.toThrow();
        const note = t.note(t.one.business.id, 'Danach');
        await expect(
          t.storage.transaction(async () => {
            await t.storage.table('notes').add(note);
            throw new Error('again');
          }),
        ).rejects.toThrow('again');
        expect(await t.storage.table('notes').get(note.id)).toBeUndefined();
        await t.storage.table('notes').add(note);
        expect(await t.storage.table('notes').get(note.id)).toEqual(note);
      });

      it(
        'restores everything after any sequence of writes that ends in a failure',
        async () => {
          type Step =
            | { kind: 'add' | 'put' | 'entry' | 'event' | 'command' | 'file'; business: 0 | 1 }
            | { kind: 'purge'; business: 0 | 1 };
          const step = fc.record({
            kind: fc.constantFrom('add', 'put', 'entry', 'event', 'command', 'file', 'purge'),
            business: fc.constantFrom(0, 1),
          }) as fc.Arbitrary<Step>;

          await fc.assert(
            fc.asyncProperty(fc.array(step, { maxLength: 12 }), async (steps) => {
              const t = await createTestStorage(make);
              const both = [t.one, t.two];
              const seeded = [
                await fill(t, t.one.business.id, t.one.personId),
                await fill(t, t.two.business.id, t.two.personId),
              ];
              const state = async () => ({
                one: await snapshot(t.storage, t.one.business.id),
                two: await snapshot(t.storage, t.two.business.id),
                businesses: await t.storage.businesses.all(),
                commands: await Promise.all(
                  seeded.map((seed) => t.storage.commands.find(seed.command.commandId)),
                ),
              });
              const before = await state();

              await expect(
                t.storage.transaction(async () => {
                  for (const { kind, business } of steps) {
                    const owner = both[business];
                    const seed = seeded[business];
                    if (owner === undefined || seed === undefined) {
                      continue;
                    }
                    const businessId = owner.business.id;
                    // A step may be refused (a row of a purged business, say): the next one goes on.
                    await {
                      add: () => t.storage.table('notes').add(t.note(businessId, 'Neu')),
                      put: () => t.storage.table('notes').put({ ...seed.note, text: 'Geändert' }),
                      entry: () =>
                        t.storage
                          .table('time_entries')
                          .add(t.timeEntry(businessId, owner.personId, 1)),
                      event: () => t.storage.events.append(event(t, businessId, 'note.changed')),
                      command: () => t.storage.commands.record(commandEntry(t, businessId, {})),
                      file: () =>
                        t.storage.files.put({
                          businessId,
                          bytes: bytesOf('x'),
                          mediaType: 'text/plain',
                        }),
                      purge: () => t.storage.purge(businessId),
                    }[kind]();
                  }
                  throw new Error('stop');
                }),
              ).rejects.toThrow('stop');

              expect(await state()).toEqual(before);
            }),
            { numRuns: runs },
          );
        },
        PROPERTY_TIMEOUT,
      );
    });

    describe('the command kit', () => {
      it('runs a command once: the row, the event and the entry of the log in one transaction', async () => {
        const { t, mine, run } = await setup(make);
        const commandId = t.ids.next();
        const input = {
          commandId,
          businessId: t.one.business.id,
          noteId: mine.id,
          text: 'Neuer Text',
        };
        const first = await run.rename(input);
        expect(first).toEqual({ noteId: mine.id, text: 'Neuer Text' });
        expect((await t.storage.table('notes').get(mine.id))?.text).toBe('Neuer Text');
        expect(await t.storage.commands.find(commandId)).toEqual({
          commandId,
          businessId: t.one.business.id,
          operation: 'notes.rename',
          result: first,
          at: '2026-11-14T10:00:00.000Z',
        });

        // Repeating the same command is harmless and returns the same result.
        expect(await run.rename({ ...input, text: 'Nochmals anders' })).toEqual(first);
        expect(run.runs()).toBe(1);
        const events = await t.storage.events.ofBusiness(t.one.business.id);
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
          type: 'note.renamed',
          actor: t.one.personId,
          businessId: t.one.business.id,
          payload: { noteId: mine.id },
        });
      });

      it('undoes everything of a command that fails', async () => {
        const { t, theirs, run } = await setup(make);
        const commandId = t.ids.next();
        // A note of the other business: the use case refuses it after the kit opened the transaction.
        const error = await run
          .rename({
            commandId,
            businessId: t.one.business.id,
            noteId: theirs.id,
            text: 'Übernommen',
          })
          .catch((caught: unknown) => caught);
        expect(error).toBeInstanceOf(CommandError);
        expect((error as CommandError).code).toBe('not_found');
        expect(await t.storage.table('notes').get(theirs.id)).toEqual(theirs);
        expect(await t.storage.commands.find(commandId)).toBeUndefined();
        expect(await t.storage.events.ofBusiness(t.one.business.id)).toEqual([]);
        expect(await t.storage.events.ofBusiness(t.two.business.id)).toEqual([]);
      });

      it('refuses a command id that another business has used', async () => {
        const { t, mine, theirs, run } = await setup(make);
        const commandId = t.ids.next();
        await run.rename({
          commandId,
          businessId: t.one.business.id,
          noteId: mine.id,
          text: 'Eins',
        });
        const error = await run
          .rename({ commandId, businessId: t.two.business.id, noteId: theirs.id, text: 'Zwei' })
          .catch((caught: unknown) => caught);
        expect((error as CommandError).code).toBe('invalid');
        expect(await t.storage.table('notes').get(theirs.id)).toEqual(theirs);
      });
    });

    describe('a reset of a business removes its entries of the command log, and only its own', () => {
      it('forgets the results of its commands, so no name of the business stays on the device', async () => {
        const { t, mine, theirs, run } = await setup(make);
        const mineId = t.ids.next();
        const theirsId = t.ids.next();
        await run.rename({
          commandId: mineId,
          businessId: t.one.business.id,
          noteId: mine.id,
          text: 'Betrieb Muster, Schlüssel beim Hauswart',
        });
        await run.rename({
          commandId: theirsId,
          businessId: t.two.business.id,
          noteId: theirs.id,
          text: 'Betrieb Beispiel, Lieferung am Montag',
        });
        // The results of the commands are in the log: they carry the new texts.
        expect(await t.storage.commands.find(mineId)).toBeDefined();
        expect(await t.storage.commands.find(theirsId)).toBeDefined();

        await t.storage.purge(t.one.business.id);

        expect(await t.storage.commands.find(mineId)).toBeUndefined();
        expect(await t.storage.businesses.get(t.one.business.id)).toBeUndefined();
        // The other business was not reset: its command is still known and still harmless to repeat.
        expect((await t.storage.commands.find(theirsId))?.businessId).toBe(t.two.business.id);
        const before = run.runs();
        expect(
          await run.rename({
            commandId: theirsId,
            businessId: t.two.business.id,
            noteId: theirs.id,
            text: 'Ein dritter Text',
          }),
        ).toEqual({ noteId: theirs.id, text: 'Betrieb Beispiel, Lieferung am Montag' });
        expect(run.runs()).toBe(before);
      });
    });
  });
}

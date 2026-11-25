// Origin: BanioX/Randen packages/core/src/testing/index.ts @ e0f0907 — adapted: only the counting ids and the fixed clock; the test context is a memory storage over a sample register with two made-up businesses
import {
  IdSchema,
  IsoDateTimeSchema,
  localDate,
  nameSchema,
  syncFields,
  uuidV7,
  type Id,
  type LocalDate,
} from '@onestrand/core';
import fc from 'fast-check';
import { z } from 'zod';
import {
  createMemoryStorage,
  createTableRegistry,
  createWebCryptoHasher,
  defineTable,
  type BusinessBase,
  type Clock,
  type IdGenerator,
  type Storage,
} from '../src';

/**
 * Helpers for the tests of this package only. `@onestrand/testing` offers the same clock and
 * ids to everyone else, but sits above this package and cannot be imported here.
 */

/** UUIDv7s that count up: the same test gives the same ids every time. */
export function sequentialIds(start = 1): IdGenerator {
  let counter = start;
  return {
    next: () => {
      const bytes = new Uint8Array(10);
      let rest = counter;
      for (let i = 9; i >= 0 && rest > 0; i -= 1) {
        bytes[i] = rest % 256;
        rest = Math.floor(rest / 256);
      }
      counter += 1;
      return uuidV7(1_800_000_000_000, bytes);
    },
  };
}

/** A clock that stands still until the test moves it. */
export interface TestClock extends Clock {
  setToday: (day: LocalDate | string) => void;
}

export function fixedClock(day = '2026-11-14'): TestClock {
  let today = localDate(day);
  return {
    now: () => IsoDateTimeSchema.parse(`${today}T10:00:00.000Z`),
    today: () => today,
    setToday: (next) => {
      today = localDate(next);
    },
  };
}

/** SHA-256 of the runtime the tests run on. */
export const hasher = createWebCryptoHasher(globalThis.crypto);

/**
 * The time limit of a test that derives a key from a password. The key comes from 600 000 rounds
 * of PBKDF2, on purpose slow: one derivation takes about a quarter of a second on an idle
 * machine, a test makes up to a dozen of them, and under load (a full run with coverage next to
 * other work) they take ten times as long. The usual 5 s then ends a correct test. Only the
 * tests that derive a key carry this limit; every other test keeps the default.
 */
export const KEY_DERIVATION_TIMEOUT = 60_000;

/** A note with everything loose reading has to cope with: a record, a list, a list of records. */
export const NoteSchema = z.object({
  ...syncFields,
  text: nameSchema(200),
  tags: z.array(z.string()).optional(),
  place: z.object({ room: z.string(), floor: z.int() }).optional(),
  lines: z.array(z.object({ label: z.string(), minutes: z.int().min(0) })).optional(),
  fileId: IdSchema.optional(),
});
export type Note = z.infer<typeof NoteSchema>;

/** A booking of minutes: rows are added, never replaced. */
export const TimeEntrySchema = z.object({
  id: IdSchema,
  businessId: IdSchema,
  personId: IdSchema,
  minutes: z.int(),
  at: IsoDateTimeSchema,
});
export type TimeEntry = z.infer<typeof TimeEntrySchema>;

/** Something a device keeps for itself. */
export const DeviceSettingSchema = z.object({
  id: IdSchema,
  businessId: IdSchema,
  key: nameSchema(60),
  value: z.string(),
});
export type DeviceSetting = z.infer<typeof DeviceSettingSchema>;

export const notesTable = defineTable({
  name: 'notes',
  schema: NoteSchema,
  indexes: ['text'],
  sensitivity: 'normal',
  sync: 'single_writer',
});

export const timeEntriesTable = defineTable({
  name: 'time_entries',
  schema: TimeEntrySchema,
  indexes: [['personId', 'at']],
  sensitivity: 'internal',
  fields: { minutes: 'sensitive' },
  sync: 'ledger',
  appendOnly: true,
});

export const deviceSettingsTable = defineTable({
  name: 'device_settings',
  schema: DeviceSettingSchema,
  indexes: ['key'],
  sensitivity: 'normal',
  sync: 'device',
  backup: false,
});

/** The register of the tests: an ordinary table, an append-only one, one outside the backup. */
export const REGISTRY = createTableRegistry([notesTable, timeEntriesTable, deviceSettingsTable]);
export type Registry = typeof REGISTRY;

export interface TestBusiness {
  business: BusinessBase;
  /** The person acting in this business. */
  personId: Id;
}

export interface TestStorage {
  storage: Storage<Registry>;
  clock: TestClock;
  ids: IdGenerator;
  /** «Betrieb Muster». */
  one: TestBusiness;
  /** «Betrieb Beispiel», a second business on the same device. */
  two: TestBusiness;
  note: (businessId: Id, text: string, more?: Partial<Note>) => Note;
  timeEntry: (businessId: Id, personId: Id, minutes: number) => TimeEntry;
}

/** A fresh memory storage with two made-up businesses and nothing else. */
export async function createTestStorage(): Promise<TestStorage> {
  const clock = fixedClock();
  const ids = sequentialIds();
  const storage = createMemoryStorage(REGISTRY, { hasher, clock, ids });
  const business = async (name: string): Promise<TestBusiness> => {
    const row: BusinessBase = { id: ids.next(), name, ...stamps(clock) };
    await storage.businesses.add(row);
    return { business: row, personId: ids.next() };
  };
  return {
    storage,
    clock,
    ids,
    one: await business('Betrieb Muster'),
    two: await business('Betrieb Beispiel'),
    note: (businessId, text, more = {}) => ({
      id: ids.next(),
      businessId,
      text,
      ...stamps(clock),
      ...more,
    }),
    timeEntry: (businessId, personId, minutes) => ({
      id: ids.next(),
      businessId,
      personId,
      minutes,
      at: clock.now(),
    }),
  };
}

function stamps(clock: Clock) {
  const now = clock.now();
  return { createdAt: now, updatedAt: now };
}

/** Everything a storage holds for one business, sorted, as a comparable snapshot. */
export async function snapshot(storage: Storage<Registry>, businessId: Id) {
  const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const tables: Record<string, unknown[]> = {};
  for (const table of REGISTRY.tables) {
    tables[table.name] = (await storage.table(table).ofBusiness(businessId)).sort(byId);
  }
  const files = [];
  for (const meta of (await storage.files.ofBusiness(businessId)).sort(byId)) {
    const file = await storage.files.get(meta.id);
    files.push({ meta, bytes: Array.from(file?.bytes ?? []) });
  }
  return {
    business: await storage.businesses.get(businessId),
    tables,
    files,
    events: await storage.events.ofBusiness(businessId),
  };
}

/** The bytes of a text, for files of the tests. */
export function bytesOf(text: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(text);
}

/**
 * Any value a file can hold, as the generator makes it (with -0, which a file does not keep).
 * Without the one key the storage refuses: the generator likes it, a business has no use for it.
 */
export const anyJson = fc
  .jsonValue()
  .filter((value) => !JSON.stringify(value).includes('"__proto__"'));

/** The same, as `JSON.parse` gives it back. */
export const plainJson = anyJson.map((value): unknown => JSON.parse(JSON.stringify(value)));

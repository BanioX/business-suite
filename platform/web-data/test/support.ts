// Origin: BanioX/Randen packages/core/src/testing/index.ts @ e0f0907 — adapted: only the counting ids and the fixed clock; the storage under test is built by a function the caller gives, so the same helpers serve the storage in memory and the one on IndexedDB; a sample register with two made-up businesses
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
import {
  createTableRegistry,
  createWebCryptoHasher,
  defineTable,
  type BusinessBase,
  type Clock,
  type Hasher,
  type IdGenerator,
  type Storage,
} from '@onestrand/storage';
import fc from 'fast-check';
import { z } from 'zod';
import type { SchemaStep } from '../src';

/**
 * Helpers for the tests of this package. `@onestrand/testing` offers the same clock and ids, and
 * a seed on a storage in memory; the helpers here build the same world on any storage, so one
 * set of cases (`conformance.ts`) runs against the reference and against the adapter.
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

/** SHA-256 of the runtime the tests run on, through WebCrypto: it answers after a pause. */
export const hasher: Hasher = createWebCryptoHasher(globalThis.crypto);

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

/** A table the sample register gains in its second release. */
export const extraTable = defineTable({
  name: 'extra_things',
  schema: z.object({ ...syncFields, label: z.string() }),
  indexes: ['label'],
  sensitivity: 'normal',
  sync: 'device',
});

/** The register of the second release: one table more, and one index more on `notes`. */
export const EXTENDED = createTableRegistry([
  { ...notesTable, indexes: ['text', 'updatedAt'] },
  timeEntriesTable,
  deviceSettingsTable,
  extraTable,
]);

/** The first step of the schema ledger of the sample register: all three tables, with their indexes. */
export const FIRST_STEP: SchemaStep = {
  tables: [
    { name: 'notes', indexes: ['text'] },
    { name: 'time_entries', indexes: [['personId', 'at']] },
    { name: 'device_settings', indexes: ['key'] },
  ],
};

/** The second step: the table and the index the second release brings. */
export const SECOND_STEP: SchemaStep = {
  tables: [{ name: 'extra_things', indexes: ['label'] }],
  indexes: [{ table: 'notes', index: 'updatedAt' }],
};

/** What a storage under test is built from. */
export interface StoragePorts {
  registry: Registry;
  hasher: Hasher;
  clock: Clock;
  ids: IdGenerator;
}

/** Builds a fresh, empty storage for the sample register: the storage under test. */
export type MakeStorage = (ports: StoragePorts) => Promise<Storage<Registry>>;

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

/** A fresh storage with two made-up businesses and nothing else. */
export async function createTestStorage(
  make: MakeStorage,
  overrides: { hasher?: Hasher } = {},
): Promise<TestStorage> {
  const clock = fixedClock();
  const ids = sequentialIds();
  const storage = await make({
    registry: REGISTRY,
    hasher: overrides.hasher ?? hasher,
    clock,
    ids,
  });
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

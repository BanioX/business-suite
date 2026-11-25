import { createHash } from 'node:crypto';
import { CommandError } from '@onestrand/contract';
import {
  IdSchema,
  IsoDateTimeSchema,
  nameSchema,
  rappen,
  RappenSchema,
  syncFields,
  toLocalDate,
  uuidV7,
  type Id,
  type IsoDateTime,
  type Rappen,
} from '@onestrand/core';
import {
  createMemoryStorage,
  createTableRegistry,
  defineTable,
  type Clock,
  type Hasher,
  type IdGenerator,
  type Storage,
} from '@onestrand/storage';
import { z } from 'zod';
import { createLedger, defineLedger, ledgerFields, type Ledger } from '../src';

/**
 * Helpers for the tests of this package only: a clock, counting ids, a hasher on Node, and two
 * small ledgers (an account in Rappen, the status of a job). `@onestrand/testing` offers clock
 * and ids to everyone else; it is built beside this package and is not imported here.
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
  /** Moves the clock forward by whole minutes. */
  advance: (minutes: number) => void;
}

export function fixedClock(start = '2026-11-16T08:00:00.000Z'): TestClock {
  let now = Date.parse(start);
  const instant = (): IsoDateTime => IsoDateTimeSchema.parse(new Date(now).toISOString());
  return {
    now: instant,
    today: () => toLocalDate(instant()),
    advance: (minutes) => {
      now += minutes * 60_000;
    },
  };
}

/** SHA-256 of Node, independent of the WebCrypto adapter of the storage. */
export const hasher: Hasher = {
  sha256: (data) => Promise.resolve(createHash('sha256').update(data).digest('hex')),
};

/** SHA-256 of a text as UTF-8, computed by Node alone: the reference for the kit's checksums. */
export function sha256OfText(text: string): string {
  return createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
}

/** A booking on an account: Rappen in (positive) or out (negative). */
export const AccountEntrySchema = z.object({
  ...ledgerFields,
  amount: RappenSchema,
  text: nameSchema(200).optional(),
  /** What the booking is about, to have a record and a list inside the payload. */
  ref: z.object({ kind: z.string(), id: IdSchema }).optional(),
  tags: z.array(z.string()).optional(),
});
export type AccountEntry = z.infer<typeof AccountEntrySchema>;

export const accountEntriesTable = defineTable({
  name: 'account_entries',
  schema: AccountEntrySchema,
  indexes: [['stream', 'seq']],
  sensitivity: 'internal',
  sync: 'ledger',
  appendOnly: true,
});

export interface AccountState {
  balance: Rappen;
  bookings: number;
}

/** The code the sample account refuses a booking with. */
export const OVERDRAWN = 'account.overdrawn';

/** An account that never goes below zero: its `reduce` refuses the booking that would. */
export const accountLedger = defineLedger<AccountEntry, AccountState>({
  table: accountEntriesTable,
  initial: { balance: rappen(0), bookings: 0 },
  reduce: (state, entry) => {
    const balance = rappen(state.balance + entry.amount);
    if (balance < 0) {
      throw new CommandError(OVERDRAWN, `Booking ${entry.id} would take the account below zero`);
    }
    return { balance, bookings: state.bookings + 1 };
  },
});

export const STATUSES = ['planned', 'started', 'done'] as const;

/** A change of status: the order of the entries matters, the last one counts. */
export const StatusEntrySchema = z.object({
  ...ledgerFields,
  status: z.enum(STATUSES),
  note: nameSchema(200).optional(),
});
export type StatusEntry = z.infer<typeof StatusEntrySchema>;

export const statusEntriesTable = defineTable({
  name: 'status_entries',
  schema: StatusEntrySchema,
  indexes: [['stream', 'seq']],
  sensitivity: 'normal',
  sync: 'single_writer',
  appendOnly: true,
});

export interface StatusState {
  status: (typeof STATUSES)[number] | null;
  history: string[];
}

export const statusLedger = defineLedger<StatusEntry, StatusState>({
  table: statusEntriesTable,
  initial: { status: null, history: [] },
  reduce: (state, entry) => ({
    status: entry.status,
    history: [...state.history, entry.note ?? entry.status],
  }),
});

/** An ordinary table whose rows may be replaced: no place for a ledger. */
export const NoteSchema = z.object({ ...syncFields, text: nameSchema(200) });
export const notesTable = defineTable({
  name: 'notes',
  schema: NoteSchema,
  indexes: [],
  sensitivity: 'normal',
  sync: 'single_writer',
});

export const REGISTRY = createTableRegistry([accountEntriesTable, statusEntriesTable, notesTable]);
export type Registry = typeof REGISTRY;

export interface TestBusiness {
  businessId: Id;
  /** The person acting in this business. */
  personId: Id;
}

export interface TestLedgers {
  storage: Storage<Registry>;
  clock: TestClock;
  ids: IdGenerator;
  /** «Betrieb Muster» with «Person Eins». */
  one: TestBusiness;
  /** «Betrieb Beispiel», a second business on the same device. */
  two: TestBusiness;
  /** The account ledger, written by the person of the first business. */
  account: Ledger<AccountEntry, AccountState>;
  status: Ledger<StatusEntry, StatusState>;
}

/** A fresh memory storage with two made-up businesses and both sample ledgers on it. */
export async function createTestLedgers(): Promise<TestLedgers> {
  const clock = fixedClock();
  const ids = sequentialIds();
  const storage = createMemoryStorage(REGISTRY, { hasher, clock, ids });
  const business = async (name: string): Promise<TestBusiness> => {
    const businessId = ids.next();
    const now = clock.now();
    await storage.businesses.add({ id: businessId, name, createdAt: now, updatedAt: now });
    return { businessId, personId: ids.next() };
  };
  const one = await business('Betrieb Muster');
  const two = await business('Betrieb Beispiel');
  const context = { storage, hasher, clock, ids, actor: one.personId };
  return {
    storage,
    clock,
    ids,
    one,
    two,
    account: createLedger(accountLedger, context),
    status: createLedger(statusLedger, context),
  };
}

/** Every row of the account table, of both businesses, as stored. */
export async function accountRows(t: TestLedgers): Promise<AccountEntry[]> {
  const table = t.storage.table('account_entries');
  return [
    ...(await table.ofBusiness(t.one.businessId)),
    ...(await table.ofBusiness(t.two.businessId)),
  ];
}

/**
 * A device that holds exactly these rows in its account table: what a table looks like after
 * somebody changed it behind the back of the ledger. Rows the storage cannot hold (no id, no
 * business, an id twice) make this throw.
 */
export async function deviceHolding(rows: readonly unknown[]) {
  const storage = createMemoryStorage(REGISTRY, {
    hasher,
    clock: fixedClock(),
    ids: sequentialIds(900_000),
  });
  const table = storage.table('account_entries');
  for (const row of rows) {
    // The storage checks no schema; the rows are whatever the test made of them.
    await table.add(row as AccountEntry);
  }
  return { storage, account: createLedger(accountLedger, { ...contextOf(storage), hasher }) };
}

function contextOf(storage: Storage<Registry>) {
  const ids = sequentialIds(950_000);
  return { storage, clock: fixedClock(), ids, actor: ids.next() };
}

/** A copy of a row with one field set, or removed if the value is `undefined`. */
export function withField<TRow extends object>(row: TRow, key: string, value: unknown): TRow {
  const kept = Object.entries(row).filter(([name]) => name !== key);
  // The tests change rows in ways their type forbids; that is what they are for.
  return Object.fromEntries(value === undefined ? kept : [...kept, [key, value]]) as TRow;
}

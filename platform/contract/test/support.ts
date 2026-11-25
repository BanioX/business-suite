// Origin: BanioX/Randen packages/core/src/testing/index.ts @ e0f0907 — adapted: the counting ids and the fixed clock as they are; the test context without a business row, a person row and use cases; import paths
// Origin: BanioX/Randen packages/core/src/ports/memory-storage.ts @ e0f0907 — adapted: only the event log, the command log and the transaction, behind the ports of a command; entries by business; counters for the tests
import { IsoDateTimeSchema, localDate, uuidV7, type Id, type LocalDate } from '@onestrand/core';
import type {
  Clock,
  CommandContext,
  CommandLogEntry,
  CommandStorage,
  DomainEvent,
  IdGenerator,
} from '../src';

/**
 * A small fake of the ports of a command, for the tests of this package only. The memory storage
 * with tables and files lives in `@onestrand/storage`, which sits above this package and cannot
 * be imported here.
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

export interface FakeStorage extends CommandStorage {
  /** Every event of every business, in the order appended. */
  allEvents: () => DomainEvent[];
  /** Every entry of the command log, in the order recorded. */
  allCommands: () => CommandLogEntry[];
  /** How many outermost transactions were started. */
  transactions: () => number;
}

/**
 * Event log, command log and transaction in plain memory. Values are copied in and out, a failing
 * transaction restores both logs, a transaction inside another joins it.
 */
export function createFakeStorage(): FakeStorage {
  let events: DomainEvent[] = [];
  let commands: CommandLogEntry[] = [];
  let depth = 0;
  let started = 0;

  return {
    events: {
      append: (event) => {
        events.push(structuredClone(event));
        return Promise.resolve();
      },
      ofBusiness: (businessId) =>
        Promise.resolve(
          events
            .filter((event) => event.businessId === businessId)
            .map((event) => structuredClone(event)),
        ),
    },
    commands: {
      find: (commandId) => {
        const entry = commands.find((row) => row.commandId === commandId);
        return Promise.resolve(entry === undefined ? undefined : structuredClone(entry));
      },
      record: (entry) => {
        if (commands.some((row) => row.commandId === entry.commandId)) {
          return Promise.reject(new Error(`Command ${entry.commandId} is recorded already`));
        }
        commands.push(structuredClone(entry));
        return Promise.resolve();
      },
    },
    transaction: async (work) => {
      if (depth > 0) {
        return work();
      }
      const snapshot = { events: [...events], commands: [...commands] };
      started += 1;
      depth += 1;
      try {
        return await work();
      } catch (error) {
        ({ events, commands } = snapshot);
        throw error;
      } finally {
        depth -= 1;
      }
    },
    allEvents: () => structuredClone(events),
    allCommands: () => structuredClone(commands),
    transactions: () => started,
  };
}

export interface TestContext {
  ctx: CommandContext;
  storage: FakeStorage;
  clock: TestClock;
  ids: IdGenerator;
  /** A made-up business («Betrieb Muster») and a second one on the same storage. */
  businessId: Id;
  otherBusinessId: Id;
  /** The person acting («Person Eins»). */
  actor: Id;
  /** A fresh command id. */
  cmd: () => Id;
}

/** A context on a fresh fake storage, with a fixed clock and counting ids. */
export function createTestContext(): TestContext {
  const storage = createFakeStorage();
  const clock = fixedClock();
  const ids = sequentialIds();
  const businessId = ids.next();
  const otherBusinessId = ids.next();
  const actor = ids.next();
  return {
    ctx: { storage, clock, ids, actor },
    storage,
    clock,
    ids,
    businessId,
    otherBusinessId,
    actor,
    cmd: () => ids.next(),
  };
}

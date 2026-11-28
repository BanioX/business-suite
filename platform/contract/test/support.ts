// Origin: BanioX/Randen packages/core/src/testing/index.ts @ e0f0907 — adapted: the counting ids and the fixed clock as they are; the test context without a business row, a person row and use cases; import paths
// Origin: BanioX/Randen packages/core/src/ports/memory-storage.ts @ e0f0907 — adapted: only the event log, the command log and the transaction, behind the ports of a command; entries by business; a second entry of a command is refused; a failed transaction inside another fails the outer one; counters for the tests
import { IsoDateTimeSchema, localDate, uuidV7, type Id, type LocalDate } from '@onestrand/core';
import { AsyncLocalStorage } from 'node:async_hooks';
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
 * Event log, command log and transaction in plain memory, with the behaviour the ports ask for
 * and the memory storage of `@onestrand/storage` has: values are copied in and out, a failing
 * transaction restores both logs, and a transaction inside another joins it and shares its fate
 * (if the inner one fails, the outer one fails at its end with the same error, even if it caught
 * that error).
 *
 * Like every storage in memory it cannot tell a nested transaction from one that overlaps, and
 * joins both: await a command before starting the next, or put it behind `takingTurns`.
 */
export function createFakeStorage(): FakeStorage {
  let events: DomainEvent[] = [];
  let commands: CommandLogEntry[] = [];
  /** The transaction that is running, with the first error of one that had joined it. */
  let running: { failedInside?: { error: unknown } } | undefined;
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
      const outer = running;
      if (outer !== undefined) {
        try {
          return await work();
        } catch (error) {
          // Noted on the transaction it joined, which may be over by now: a late failure never
          // reaches a transaction that started afterwards.
          outer.failedInside ??= { error };
          throw error;
        }
      }
      const own: { failedInside?: { error: unknown } } = {};
      const snapshot = { events: [...events], commands: [...commands] };
      started += 1;
      running = own;
      try {
        const result = await work();
        if (own.failedInside !== undefined) {
          // The inner one promised «all or none» and is part of this one: whoever caught its
          // error, the only way to keep that promise is to undo everything.
          throw own.failedInside.error;
        }
        return result;
      } catch (error) {
        ({ events, commands } = snapshot);
        throw error;
      } finally {
        running = undefined;
      }
    },
    allEvents: () => structuredClone(events),
    allCommands: () => structuredClone(commands),
    transactions: () => started,
  };
}

/**
 * The same storage behind a door that lets one transaction in at a time, as the adapter of a
 * database does: a transaction that is not inside another waits until every one started before
 * it is over. Inside, the storage behind decides (a nested transaction joins).
 *
 * It tells a nested call from an overlapping one by the asynchronous context of Node, which the
 * pure code of the platform must not use; so this is a helper for tests, not a way to build a
 * storage. Calls outside a transaction are answered at once.
 */
export function takingTurns(storage: FakeStorage): FakeStorage {
  const inside = new AsyncLocalStorage<true>();
  let lastOver: Promise<void> = Promise.resolve();
  const over = (): void => undefined;
  return {
    ...storage,
    transaction: (work) => {
      if (inside.getStore() === true) {
        return storage.transaction(work);
      }
      const mine = lastOver.then(() => inside.run(true, () => storage.transaction(work)));
      lastOver = mine.then(over, over);
      return mine;
    },
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

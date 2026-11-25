// Origin: BanioX/Randen packages/core/src/ports/index.ts @ e0f0907 — adapted: only the clock and the id generator; import paths, comments
// Origin: BanioX/Randen packages/core/src/ports/storage.ts @ e0f0907 — adapted: only the command log, the event log and the transaction; an entry of the command log carries its business and is read back whole
// Origin: BanioX/Randen packages/core/src/application/command.ts @ e0f0907 — adapted: only the context, narrowed to what a command needs from the storage
import type { Id, IsoDateTime, LocalDate } from '@onestrand/core';
import type { DomainEvent } from './events';

/**
 * Ports of a command: the only way the pure logic reaches the outside world (suite ADR-0009;
 * ADR-0003 of the origin). They are defined here once, because the command kit needs them and
 * sits below the storage; `@onestrand/storage` re-exports them and adds the tables. The app
 * provides adapters (the database of the browser, its clock), tests use a memory storage and a
 * fixed clock.
 */

export interface Clock {
  /** Current instant, ISO 8601 UTC. */
  now: () => IsoDateTime;
  /** Current calendar day in Europe/Zurich. */
  today: () => LocalDate;
}

export interface IdGenerator {
  next: () => Id;
}

/** What the command log keeps of a command that ran. */
export interface CommandLogEntry {
  commandId: Id;
  /** A device holds several businesses; deleting one removes only its entries. */
  businessId: Id;
  /** Name of the operation the command ran. */
  operation: string;
  /** What the command returned: plain data that fits the output schema of the operation. */
  result: unknown;
  at: IsoDateTime;
}

/** Results of commands already executed: a repeated commandId returns the stored result. */
export interface CommandLog {
  /**
   * The entry of a command, whole: the kit compares operation and business before it hands a
   * stored result out, so a commandId can never return the result of something else.
   */
  find: (commandId: Id) => Promise<CommandLogEntry | undefined>;
  /** Adds the entry of a command; fails if the commandId is recorded already. */
  record: (entry: CommandLogEntry) => Promise<void>;
}

export interface EventLog {
  append: (event: DomainEvent) => Promise<void>;
  /** Every event of one business, in the order they were appended. */
  ofBusiness: (businessId: Id) => Promise<DomainEvent[]>;
}

export interface Transactional {
  /**
   * Runs `work` atomically: all its writes happen or none. A transaction started inside another
   * joins it. Only storage calls may be awaited inside (no network, no timers), because the
   * database of the browser ends a transaction at the first foreign await.
   *
   * Transactions that do not nest must not overlap: an adapter of a real database lets the
   * second wait for the first, so a command sent twice at the same moment still runs once. A
   * storage in memory cannot tell a nested call from an overlapping one and joins both; whoever
   * uses one (tests) awaits a command before starting the next.
   */
  transaction: <T>(work: () => Promise<T>) => Promise<T>;
}

/** What a command needs from the storage, whatever tables the storage holds. */
export interface CommandStorage extends Transactional {
  commands: CommandLog;
  events: EventLog;
}

/**
 * What every command gets: storage and the outside world only through ports, so the same code
 * runs in the browser, in tests and later on a server.
 */
export interface CommandContext {
  storage: CommandStorage;
  clock: Clock;
  ids: IdGenerator;
  /** The person acting: author of events and of everything the command writes. */
  actor: Id;
}

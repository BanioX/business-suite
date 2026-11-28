import { CommandError } from '@onestrand/contract';
import type { Id } from '@onestrand/core';
import {
  isPlainRecord,
  keepUnknownFields,
  plainCopy,
  type Clock,
  type Hasher,
  type IdGenerator,
  type ModuleStorage,
} from '@onestrand/storage';
import { canonicalText } from './canonical';
import { allChainProblems, chainProblems, type LedgerAnchor, type LedgerProblem } from './chain';
import type { LedgerDefinition } from './definition';
import {
  entryHash,
  inSequence,
  LEDGER_FIELD_NAMES,
  LEDGER_STREAM_PATTERN,
  readBackProblem,
  type LedgerEntry,
  type LedgerPayload,
} from './entry';
import { LedgerError } from './errors';
import { foldLedger } from './fold';
import { compareText, deepFreeze, fieldOf } from './internal';

/**
 * The ledger kit on a storage: adding entries, correcting them with a new entry, reading the
 * entries, computing the state and checking the chain. Adding and correcting belong inside a
 * command (`runCommand` of the contract): the command gives them its transaction, makes them
 * safe to repeat and writes the event.
 *
 * A chain has one writer: the device that runs the commands. Two devices that both add to one
 * stream each write the next place, and `verify` reports the second entry of that place.
 */

/** What reading a ledger needs. */
export interface LedgerReaderContext {
  storage: Pick<ModuleStorage, 'table'>;
  /** Computes the checksums of the chain. */
  hasher: Hasher;
}

/**
 * What writing a ledger needs: the context of a command plus the hasher.
 *
 * The checksum of a new entry is computed inside the transaction, after the entry before it was
 * read, and a booking that finds another one at work on the same table waits for it there. The
 * database of the browser ends a transaction when something else than the database is awaited
 * (see `Transactional`), so whoever puts an edition together passes a storage and a hasher that
 * keep the transaction open across these two waits, or a hasher that answers without a pause.
 */
export interface LedgerContext {
  storage: Pick<ModuleStorage, 'table' | 'transaction'>;
  hasher: Hasher;
  clock: Clock;
  ids: IdGenerator;
  /** The person acting: written into every entry. */
  actor: Id;
}

/** What `verify` says about one chain. */
export type LedgerVerification =
  | {
      ok: true;
      /** Number of entries in the chain. */
      entries: number;
      /** The last entry, to note as an anchor; absent for a chain without entries. */
      head?: LedgerAnchor;
    }
  | {
      ok: false;
      entries: number;
      /** Where and why the chain breaks, the first place first. */
      problems: LedgerProblem[];
    };

/** What `verifyAll` says about every chain of a business in this ledger. */
export type LedgerBusinessVerification =
  | {
      ok: true;
      entries: number;
      /** The last entry of every stream, by stream. */
      heads: Record<string, LedgerAnchor>;
    }
  | { ok: false; entries: number; problems: LedgerProblem[] };

/** What a new entry leaves behind. */
export interface LedgerBooking<TEntry extends LedgerEntry, TState> {
  /** The entry as it is stored. */
  entry: TEntry;
  /** The state of its stream with it. */
  state: TState;
}

/** Reading a ledger: for queries, reports and checks. Nothing here writes. */
export interface LedgerReader<TEntry extends LedgerEntry, TState> {
  /** The streams of a business that have entries, sorted. */
  streams: (businessId: Id) => Promise<string[]>;
  /**
   * Every entry of a stream in the order of its chain, as written: corrected entries and their
   * corrections are both there. `effectiveEntries` picks the ones that count.
   */
  entries: (businessId: Id, stream: string) => Promise<TEntry[]>;
  /**
   * The state of a stream, computed from its entries at every call and stored nowhere. A stream
   * without entries has the initial state. The chain is not checked here; `verify` does that.
   */
  state: (businessId: Id, stream: string) => Promise<TState>;
  /**
   * Checks the chain of one stream: ok, or where and why it breaks. With an `anchor` noted
   * earlier it also shows entries cut off at the end and a chain written anew.
   */
  verify: (businessId: Id, stream: string, anchor?: LedgerAnchor) => Promise<LedgerVerification>;
  /**
   * Checks every row of a business in this ledger: each must be an entry of a chain that holds
   * together. This also finds a row that names no stream at all.
   */
  verifyAll: (businessId: Id) => Promise<LedgerBusinessVerification>;
}

/** A ledger on a storage, for the use cases of a module. */
export interface Ledger<TEntry extends LedgerEntry, TState> extends LedgerReader<TEntry, TState> {
  /**
   * Adds an entry at the end of a stream. One transaction: the last entry is read, the new one
   * is checked with the schema of the table, chained, folded and written. If `reduce` refuses
   * it, nothing is written and its error comes out. A payload that does not fit the schema is a
   * `ZodError`; one that carries a field the schema does not know, at any depth, is a
   * `LedgerError` `invalid_payload`: nothing is dropped without a word.
   *
   * Bookings on one table take turns, also when they are started together: no two of them get
   * the same place in a chain.
   */
  append: (
    businessId: Id,
    stream: string,
    payload: LedgerPayload<TEntry>,
  ) => Promise<LedgerBooking<TEntry, TState>>;
  /**
   * Corrects an entry with a new one at the end of the same stream. The payload is the whole
   * fact as it should have been, not a difference; the old entry stays as it is. For the state
   * the new entry takes the place of the old one.
   *
   * An entry is corrected once. To change it again, correct the correction: so nobody
   * overwrites a correction without having seen it. A `CommandError`: `not_found` if the
   * business has no such entry, `not_allowed` if it was corrected already.
   */
  correct: (
    businessId: Id,
    entryId: Id,
    payload: LedgerPayload<TEntry>,
  ) => Promise<LedgerBooking<TEntry, TState>>;
}

/** Stands in for the checksum while the schema checks a new entry; never stored. */
const UNHASHED = '0'.repeat(64);

/** The fields of a new entry the kit decides and the schema must leave alone. */
const WRITTEN_FIELDS = LEDGER_FIELD_NAMES.filter((field) => field !== 'hash');

function headOf(entries: readonly LedgerEntry[]): { head?: LedgerAnchor } {
  const last = inSequence(entries).at(-1);
  return last === undefined ? {} : { head: { seq: last.seq, hash: last.hash } };
}

/**
 * Reading a ledger. Throws a `StorageError` with the code `unknown_table` right away if the
 * storage does not hold the table of the ledger.
 *
 * Reading does not check the key of a stream: a key nobody wrote to, well-formed or not, has no
 * entries and the initial state. So a damaged row that stands under a malformed key can still
 * be looked at and is reported by `verify` under that key.
 */
export function createLedgerReader<TEntry extends LedgerEntry, TState>(
  definition: LedgerDefinition<TEntry, TState>,
  { storage, hasher }: LedgerReaderContext,
): LedgerReader<TEntry, TState> {
  const store = storage.table(definition.table);

  async function rowsOf(businessId: Id, stream: string): Promise<TEntry[]> {
    return (await store.ofBusiness(businessId)).filter((row) => row.stream === stream);
  }

  return {
    streams: async (businessId) => {
      const streams = (await store.ofBusiness(businessId)).map((row): unknown => row.stream);
      return [...new Set(streams.filter((stream) => typeof stream === 'string'))].sort(compareText);
    },
    entries: async (businessId, stream) => inSequence(await rowsOf(businessId, stream)),
    state: async (businessId, stream) => foldLedger(definition, await rowsOf(businessId, stream)),
    verify: async (businessId, stream, anchor) => {
      const rows = await rowsOf(businessId, stream);
      const problems = await chainProblems(hasher, rows, {
        businessId,
        stream,
        ...(anchor === undefined ? {} : { anchor }),
      });
      return problems.length > 0
        ? { ok: false, entries: rows.length, problems }
        : { ok: true, entries: rows.length, ...headOf(rows) };
    },
    verifyAll: async (businessId) => {
      const rows = await store.ofBusiness(businessId);
      const problems = await allChainProblems(hasher, rows);
      if (problems.length > 0) {
        return { ok: false, entries: rows.length, problems };
      }
      const heads: Record<string, LedgerAnchor> = {};
      for (const row of inSequence(rows)) {
        // Every later entry of a stream replaces the one before it: the last one stays.
        heads[row.stream] = { seq: row.seq, hash: row.hash };
      }
      return { ok: true, entries: rows.length, heads };
    },
  };
}

function checkedStream(stream: unknown): string {
  if (typeof stream !== 'string' || !LEDGER_STREAM_PATTERN.test(stream)) {
    throw new LedgerError(
      'invalid_stream',
      `The key of a stream must match ${String(LEDGER_STREAM_PATTERN)}, got ${JSON.stringify(stream)}`,
    );
  }
  return stream;
}

/** The payload as a record of its own fields, or a `LedgerError` `invalid_payload`. */
function checkedPayload(payload: unknown): Record<string, unknown> {
  if (!isPlainRecord(payload)) {
    throw new LedgerError('invalid_payload', 'The payload of an entry must be a plain record');
  }
  const taken = LEDGER_FIELD_NAMES.filter((field) => fieldOf(payload, field) !== undefined);
  if (taken.length > 0) {
    throw new LedgerError(
      'invalid_payload',
      `The payload must not carry ${taken.join(', ')}: the ledger writes these fields itself`,
    );
  }
  return payload;
}

/**
 * The fields of a draft in which the schema dropped something it does not know: the field
 * itself, or a field somewhere inside it. What the schema changed (a text it trimmed) or added
 * (a default) is none of these.
 */
function droppedFields(draft: Record<string, unknown>, checked: object): string[] {
  // The draft with what the schema read laid over it keeps exactly what the schema left out.
  const kept = keepUnknownFields(draft, checked);
  return Object.keys(kept).filter(
    (field) => canonicalText(fieldOf(kept, field)) !== canonicalText(fieldOf(checked, field)),
  );
}

const over = (): void => undefined;

/**
 * The end of the line of bookings on a table, by the store of the table.
 *
 * Between reading the end of a chain and writing the next entry a booking waits (for the
 * checksum, for the storage). A second booking started meanwhile would read the same end and
 * write the same place a second time. So the bookings on one table take turns, whoever started
 * them: two calls in one command that are not awaited one after the other, or two ledgers set
 * up on the same storage.
 */
const turns = new WeakMap<object, Promise<void>>();

/** Runs `work` when every booking that asked before it on this store is over. */
function inTurn<TResult>(store: object, work: () => Promise<TResult>): Promise<TResult> {
  const result = (turns.get(store) ?? Promise.resolve()).then(work);
  // The next one starts when this one is over, however it ended.
  turns.set(store, result.then(over, over));
  return result;
}

/**
 * A ledger on a storage. Throws a `StorageError` with the code `unknown_table` right away if
 * the storage does not hold the table of the ledger.
 */
export function createLedger<TEntry extends LedgerEntry, TState>(
  definition: LedgerDefinition<TEntry, TState>,
  { storage, hasher, clock, ids, actor }: LedgerContext,
): Ledger<TEntry, TState> {
  const { table } = definition;
  const store = storage.table(table);

  /**
   * One booking: inside a transaction, and there in its turn among the bookings on this table.
   *
   * The turn is asked for only after the storage has answered once. A database that lets a
   * transaction wait for the one before it answers when this transaction is the one at work;
   * a booking that took its turn earlier would hold it while it waits for the database, and a
   * booking of the transaction at work would wait for that turn: neither would ever go on.
   */
  function booking<TResult>(work: (id: Id) => Promise<TResult>): Promise<TResult> {
    return storage.transaction(async () => {
      const id = ids.next();
      // What comes back does not matter: an id that is taken is refused when the entry is added.
      await store.get(id);
      return inTurn(store, () => work(id));
    });
  }

  /**
   * Writes one entry at the end of `chain`, the entries of the stream as just read inside the
   * running transaction.
   */
  async function book(
    id: Id,
    businessId: Id,
    stream: string,
    payload: Record<string, unknown>,
    chain: readonly TEntry[],
    corrects?: Id,
  ): Promise<LedgerBooking<TEntry, TState>> {
    const last = inSequence(chain).at(-1);
    const draft = {
      ...payload,
      id,
      businessId,
      stream,
      seq: (last?.seq ?? 0) + 1,
      ...(last === undefined ? {} : { prevHash: last.hash }),
      hash: UNHASHED,
      at: clock.now(),
      actor,
      ...(corrects === undefined ? {} : { corrects }),
    };
    // Stored as the schema reads it and as the storage keeps it, so the checksum is computed
    // over exactly what a later read returns.
    const checked = plainCopy(table.schema.parse(draft));
    for (const field of WRITTEN_FIELDS) {
      if (fieldOf(checked, field) !== fieldOf(draft, field)) {
        // A chain whose schema rewrites `stream` or `seq` would be read back as another chain.
        throw new LedgerError(
          'invalid_definition',
          `The schema of table "${table.name}" changes the field "${field}" the ledger writes`,
        );
      }
    }
    const dropped = droppedFields(draft, checked);
    if (dropped.length > 0) {
      // An entry is for good: a field lost on the way in could never be added to it again.
      throw new LedgerError(
        'invalid_payload',
        `The schema of table "${table.name}" does not know what the payload carries in ${dropped.join(', ')}; it would be dropped`,
      );
    }
    const entry = { ...checked, hash: await entryHash(hasher, checked) };
    const problem = readBackProblem(table.schema, entry);
    if (problem !== undefined) {
      // Refused at the first booking instead of found after the first backup.
      throw new LedgerError(
        'invalid_definition',
        `The schema of table "${table.name}" cannot read back the entry it wrote: ${problem}`,
      );
    }
    // Folded before anything is written: what the rules of the ledger refuse is never stored.
    // The rule gets a frozen copy of the new entry: what is stored is what the checksum was
    // computed over, whatever a `reduce` does with the entry it is given.
    const state = foldLedger(definition, [...chain, deepFreeze(plainCopy(entry))]);
    await store.add(entry);
    return { entry, state };
  }

  return {
    ...createLedgerReader(definition, { storage, hasher }),
    append: async (businessId, stream, payload) => {
      const key = checkedStream(stream);
      const fields = checkedPayload(payload);
      return booking(async (id) => {
        const rows = await store.ofBusiness(businessId);
        return book(
          id,
          businessId,
          key,
          fields,
          rows.filter((row) => row.stream === key),
        );
      });
    },
    correct: async (businessId, entryId, payload) => {
      const fields = checkedPayload(payload);
      return booking(async (id) => {
        const rows = await store.ofBusiness(businessId);
        const target = rows.find((row) => row.id === entryId);
        if (target === undefined) {
          throw new CommandError('not_found', `Entry ${entryId} not found`);
        }
        const chain = rows.filter((row) => row.stream === target.stream);
        const correction = chain.find((row) => row.corrects === entryId);
        if (correction !== undefined) {
          throw new CommandError(
            'not_allowed',
            `Entry ${entryId} was corrected already, by ${correction.id}; correct that one`,
          );
        }
        return book(id, businessId, target.stream, fields, chain, entryId);
      });
    },
  };
}

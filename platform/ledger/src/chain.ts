import { isPlainRecord, StorageError, type Hasher } from '@onestrand/storage';
import {
  contentHash,
  hashedContent,
  inSequence,
  LedgerEntrySchema,
  type LedgerEntry,
} from './entry';
import { compareText, fieldOf } from './internal';

/**
 * Checking a chain. Every entry carries its place (`seq`), the checksum of the entry before it
 * (`prevHash`) and its own (`hash`, over everything else it holds). So these are found: a field
 * that was changed, an entry that was removed from the middle or put in, entries in a changed
 * order, a changed `seq` or `prevHash`, and an entry moved to another stream or business.
 *
 * What a chain cannot show by itself: that entries were cut off at its end, or that everything
 * from one entry on was written anew with fresh checksums. Both show against an anchor: the
 * place and checksum of an entry, noted outside the table at an earlier time (on a printed
 * closing, in a backup, on another device).
 *
 * Problems are data, never thrown.
 */

/** What can be wrong with a chain, by kind. */
export const LEDGER_PROBLEM_KINDS = [
  'entry',
  'business',
  'stream',
  'seq',
  'prev_hash',
  'hash',
  'corrects',
  'anchor',
] as const;
/**
 * - `entry`: the row is no entry (a field of the kit is missing or malformed, or it is not
 *   plain data), it names no chain, or its id occurs twice in the chain.
 * - `business`, `stream`: the entry says it belongs to another business or stream than the
 *   chain it was found in.
 * - `seq`: the entry is not the next in the chain (a gap, a number used twice, a start that is
 *   not 1).
 * - `prev_hash`: the entry does not name the checksum of the entry before it; the first entry
 *   names one.
 * - `hash`: the checksum of the entry does not match what the entry holds.
 * - `corrects`: the entry corrects one that is not before it in this chain, or one that was
 *   corrected already.
 * - `anchor`: the chain does not hold the entry it held when the anchor was noted.
 */
export type LedgerProblemKind = (typeof LEDGER_PROBLEM_KINDS)[number];

/** One thing that is wrong with a chain: where, and why. */
export interface LedgerProblem {
  kind: LedgerProblemKind;
  /** The chain the problem is in, where the row says which. */
  businessId?: string;
  stream?: string;
  /**
   * The place in the chain, counted from 1 over the entries as they are stored now. Absent for
   * a row that could not be read as an entry.
   */
  position?: number;
  /** The id of the entry, if it has one. */
  id?: string;
  /** For logs and tests, in English; never shown to a person. */
  message: string;
}

/** The place and the checksum of an entry, noted to check a chain against later. */
export interface LedgerAnchor {
  seq: number;
  hash: string;
}

/** Which chain a list of rows is meant to be. */
export interface LedgerChain {
  businessId: string;
  stream: string;
  /** If given, the chain must still hold the entry with this place and checksum. */
  anchor?: LedgerAnchor;
}

/** A row read as an entry, with what `inSequence` orders by. */
interface ReadEntry {
  id: string;
  seq: number;
  entry: LedgerEntry;
  /** The text the checksum of the entry is computed over. */
  content: string;
}

/** The id of a row that may be anything, for the place of a problem. */
function idOf(row: unknown): { id?: string } {
  const id = isPlainRecord(row) ? fieldOf(row, 'id') : undefined;
  return typeof id === 'string' ? { id } : {};
}

/** Reads a row as an entry, or says in a few words why it is none. */
function readEntry(row: unknown): ReadEntry | string {
  if (!isPlainRecord(row)) {
    return 'it is no record';
  }
  const parsed = LedgerEntrySchema.safeParse(row);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.map(String).join('.') || 'row');
    return `these fields do not fit: ${[...new Set(fields)].join(', ')}`;
  }
  try {
    const entry: LedgerEntry = parsed.data;
    return { id: entry.id, seq: entry.seq, entry, content: hashedContent(row) };
  } catch (error) {
    if (error instanceof StorageError) {
      return 'it is not plain data';
    }
    throw error;
  }
}

/**
 * Everything that is wrong with one chain. `rows` are the rows that are meant to be this chain,
 * in any order, as they are stored: the checksum is computed over the row as it is, with every
 * field, also those a schema does not know. An empty list means the chain holds together.
 *
 * Each entry is compared with the one stored before it, so a single change shows where it was
 * made and not on every entry after it.
 */
export async function chainProblems(
  hasher: Hasher,
  rows: readonly unknown[],
  chain: LedgerChain,
): Promise<LedgerProblem[]> {
  const here = { businessId: chain.businessId, stream: chain.stream };
  const problems: LedgerProblem[] = [];
  const read: ReadEntry[] = [];
  for (const row of rows) {
    const result = readEntry(row);
    if (typeof result === 'string') {
      problems.push({ kind: 'entry', ...here, ...idOf(row), message: `No entry: ${result}` });
    } else {
      read.push(result);
    }
  }
  const entries = inSequence(read);

  /** The place of every entry seen so far, by id. */
  const placeOf = new Map<string, number>();
  /** Which entry corrected the entry with this id. */
  const correctedBy = new Map<string, string>();
  let previous: LedgerEntry | undefined;
  for (const [index, { entry, content }] of entries.entries()) {
    const position = index + 1;
    const report = (kind: LedgerProblem['kind'], message: string) =>
      problems.push({ kind, ...here, position, id: entry.id, message });

    if (placeOf.has(entry.id)) {
      report('entry', `The id ${entry.id} occurs twice in the chain`);
    }
    if (entry.businessId !== chain.businessId) {
      report('business', `The entry belongs to business ${entry.businessId}`);
    }
    if (entry.stream !== chain.stream) {
      report('stream', `The entry belongs to stream ${JSON.stringify(entry.stream)}`);
    }
    const expectedSeq = previous === undefined ? 1 : previous.seq + 1;
    if (entry.seq !== expectedSeq) {
      report('seq', `Expected seq ${expectedSeq}, found ${entry.seq}`);
    }
    if (entry.prevHash !== previous?.hash) {
      report(
        'prev_hash',
        previous === undefined
          ? 'The first entry of a chain names no entry before it'
          : `prevHash is not the hash of the entry before it (${previous.id})`,
      );
    }
    if ((await contentHash(hasher, content)) !== entry.hash) {
      report('hash', 'The hash does not match what the entry holds');
    }
    if (entry.corrects !== undefined) {
      const earlier = correctedBy.get(entry.corrects);
      if (!placeOf.has(entry.corrects)) {
        report('corrects', `Entry ${entry.corrects} is not before this one in the chain`);
      } else if (earlier !== undefined) {
        report('corrects', `Entry ${entry.corrects} was corrected already, by ${earlier}`);
      }
      correctedBy.set(entry.corrects, entry.id);
    }
    placeOf.set(entry.id, position);
    previous = entry;
  }

  const { anchor } = chain;
  if (
    anchor !== undefined &&
    !entries.some(({ entry }) => entry.seq === anchor.seq && entry.hash === anchor.hash)
  ) {
    problems.push({
      kind: 'anchor',
      ...here,
      position: anchor.seq,
      message: `The chain no longer holds the entry noted as seq ${anchor.seq}`,
    });
  }
  return problems;
}

/**
 * Everything that is wrong with the rows of a ledger table: every row must be an entry of a
 * chain, and every chain must hold together. `rows` may be the rows of one business or of
 * several; chains are told apart by business and stream. For a check of a whole business, and
 * for the rows of a table in a backup before it comes back.
 */
export async function allChainProblems(
  hasher: Hasher,
  rows: readonly unknown[],
): Promise<LedgerProblem[]> {
  const problems: LedgerProblem[] = [];
  const chains = new Map<string, { businessId: string; stream: string; rows: unknown[] }>();
  for (const row of rows) {
    const businessId = isPlainRecord(row) ? fieldOf(row, 'businessId') : undefined;
    const stream = isPlainRecord(row) ? fieldOf(row, 'stream') : undefined;
    if (typeof businessId !== 'string' || typeof stream !== 'string') {
      problems.push({
        kind: 'entry',
        ...idOf(row),
        message: 'No entry: it names no business and stream, so it belongs to no chain',
      });
      continue;
    }
    const key = JSON.stringify([businessId, stream]);
    const chain = chains.get(key) ?? { businessId, stream, rows: [] };
    chain.rows.push(row);
    chains.set(key, chain);
  }
  const ordered = [...chains.values()].sort(
    (a, b) => compareText(a.businessId, b.businessId) || compareText(a.stream, b.stream),
  );
  for (const chain of ordered) {
    problems.push(
      ...(await chainProblems(hasher, chain.rows, {
        businessId: chain.businessId,
        stream: chain.stream,
      })),
    );
  }
  return problems;
}

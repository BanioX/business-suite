import { IdSchema, IsoDateTimeSchema, type Id, type IsoDateTime } from '@onestrand/core';
import {
  keepUnknownFields,
  SHA256_PATTERN,
  sha256Of,
  utf8Encode,
  type Hasher,
} from '@onestrand/storage';
import { z } from 'zod';
import { canonicalJson, canonicalText } from './canonical';
import { compareText } from './internal';

/**
 * An entry of a ledger (suite ADR-0005, 2): a row that is added once and never changed. Where
 * money, time or a status comes from, the entries are the truth; whatever else is shown (a
 * balance, a total, the status of today) is computed from them.
 *
 * Entries form chains. A chain is one stream of one business: every entry carries its place in
 * the chain (`seq`), the checksum of the entry before it (`prevHash`) and its own (`hash`), so
 * an entry that was changed, removed or put somewhere else can be found (`chainProblems`).
 */

/**
 * The key of a stream: which chain inside a business an entry belongs to. Usually the id of
 * what the chain is about (an account, a person, an object), or a fixed technical word. Lower
 * case, digits and `_ . : -`, at most 120 characters; never a text typed by a person.
 */
export const LEDGER_STREAM_PATTERN = /^[a-z0-9][a-z0-9_.:-]{0,119}$/;

export const LedgerStreamSchema = z
  .string()
  .regex(LEDGER_STREAM_PATTERN, 'Expected the key of a stream');

const ChecksumSchema = z.string().regex(SHA256_PATTERN, 'Expected 64 lower-case hex digits');

/**
 * The fields the kit writes into every entry. The schema of a ledger table is these plus the
 * payload of the ledger: `z.object({ ...ledgerFields, minutes: z.int() })`.
 */
export const ledgerFields = {
  id: IdSchema,
  businessId: IdSchema,
  /** Which chain inside the business, see `LEDGER_STREAM_PATTERN`. */
  stream: LedgerStreamSchema,
  /** The place in the chain: 1, 2, 3 … per business and stream, without a gap. */
  seq: z.int().min(1),
  /** The `hash` of the entry before this one; the first entry of a chain has none. */
  prevHash: ChecksumSchema.optional(),
  /** SHA-256 over the canonical JSON of the whole entry without this field. */
  hash: ChecksumSchema,
  /** When the entry was written. The day a fact belongs to is a field of the payload. */
  at: IsoDateTimeSchema,
  /** The person who wrote it. */
  actor: IdSchema,
  /** The id of the entry this one corrects, in the same chain. */
  corrects: IdSchema.optional(),
};

/** The names of the fields the kit writes; a payload carries none of them. */
export const LEDGER_FIELD_NAMES = [
  'id',
  'businessId',
  'stream',
  'seq',
  'prevHash',
  'hash',
  'at',
  'actor',
  'corrects',
] as const;
export type LedgerFieldName = (typeof LEDGER_FIELD_NAMES)[number];

/**
 * An entry of any ledger: the fields of the kit, checked, with whatever a ledger added left as
 * it is. For code that reads entries without knowing their ledger (checking a chain).
 */
export const LedgerEntrySchema = z.looseObject(ledgerFields);

/** What every entry carries, whatever its ledger. The type of `z.object(ledgerFields)`. */
export interface LedgerEntry {
  id: Id;
  businessId: Id;
  stream: string;
  seq: number;
  prevHash?: string | undefined;
  hash: string;
  at: IsoDateTime;
  actor: Id;
  corrects?: Id | undefined;
}

/**
 * What a ledger adds to an entry: the row without the fields of the kit. For a ledger whose
 * rows are a union of kinds, the payload is the union of their payloads.
 */
export type LedgerPayload<TEntry extends LedgerEntry> = TEntry extends unknown
  ? Omit<TEntry, LedgerFieldName>
  : never;

/**
 * The text a checksum is computed over: the canonical JSON of the entry without its `hash`.
 * Everything else is part of it, also a field the schema of the ledger does not know (a newer
 * version wrote it), so no part of an entry can change without the checksum noticing.
 */
export function hashedContent(entry: object): string {
  const content: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entry)) {
    if (key !== 'hash') {
      content[key] = value;
    }
  }
  return canonicalJson(content);
}

/**
 * The checksum of a text that `hashedContent` returned. For code of this package that has the
 * text at hand already; everyone else calls `entryHash`.
 */
export async function contentHash(hasher: Hasher, content: string): Promise<string> {
  return sha256Of(hasher, utf8Encode(content));
}

/** The checksum an entry must carry in `hash`: SHA-256 over `hashedContent`, as UTF-8. */
export async function entryHash(hasher: Hasher, entry: object): Promise<string> {
  return contentHash(hasher, hashedContent(entry));
}

/**
 * Why a row is not one the schema of its table accepts and leaves exactly as it is, or nothing.
 *
 * A backup brings a row back as its schema reads it, with the fields the schema does not know
 * put back (`keepUnknownFields`). An entry must come through that unchanged, or its checksum no
 * longer fits: so a schema must read what it wrote as it wrote it. A transform that is applied
 * again on every reading (an amount multiplied, a text with something added) does not.
 *
 * For code of this package: the kit asks before it writes an entry, the invariants ask for
 * every stored row.
 */
export function readBackProblem(schema: z.ZodType, row: unknown): string | undefined {
  const stored = canonicalText(row);
  if (stored === undefined) {
    return 'it is not plain data';
  }
  const read = schema.safeParse(row);
  if (!read.success) {
    const fields = read.error.issues.map((issue) => issue.path.map(String).join('.') || 'row');
    return `the schema refuses it: ${[...new Set(fields)].join(', ')}`;
  }
  if (canonicalText(read.data) === undefined) {
    return 'the schema reads it as something that is not plain data';
  }
  return canonicalText(keepUnknownFields(row, read.data)) === stored
    ? undefined
    : 'the schema reads it differently from how it is stored, so brought back from a backup it would no longer match its hash';
}

/**
 * The entries in the order of their chain: by `seq`, lowest first. Two entries with the same
 * `seq` (a damaged chain) are ordered by their id, so the order is the same on every read.
 */
export function inSequence<TEntry extends { id: string; seq: number }>(
  entries: readonly TEntry[],
): TEntry[] {
  return [...entries].sort((a, b) => a.seq - b.seq || compareText(a.id, b.id));
}

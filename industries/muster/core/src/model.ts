import type { TableAccess } from '@onestrand/access';
import { LocalDateSchema, nameSchema, syncFields } from '@onestrand/core';
import { defineTable } from '@onestrand/storage';
import { z } from 'zod';
import { ENTRIES_FEATURE, RIGHT_JOURNAL_READ } from './entries';

/**
 * The one table of `muster` (suite ADR-0004, 5): its own, with the prefix of the industry, and
 * pointing at the platform only through `businessId`. It adds no field to a table of the
 * platform. A name of a table is never renamed once an edition has shipped it.
 */

/** An entry of the journal: what happened in the business on a calendar day, in a few words. */
export const EntrySchema = z.object({
  ...syncFields,
  /** The calendar day the entry belongs to (Europe/Zurich), not the moment it was written. */
  on: LocalDateSchema,
  /** What the person wrote; typed data, never translated. */
  title: nameSchema(200),
});
export type Entry = z.infer<typeof EntrySchema>;

/**
 * The entries hold what people write about their work and about others, so the table as a whole
 * is `sensitive`: on another device, only a person with the right `muster.journal_read` gets it
 * (`filterRowsForDevice` of `@onestrand/access`). Written by one device at a time.
 */
export const entriesTable = defineTable({
  name: 'muster_entries',
  schema: EntrySchema,
  indexes: ['on'],
  sensitivity: 'sensitive',
  sync: 'single_writer',
});

export const musterTables = [entriesTable] as const;

/**
 * Which function every table belongs to and which delicate right opens its sensitive parts: what
 * `filterRowsForDevice` asks of the caller before rows go to another device. A table does not say
 * it itself (debt TD-70), and the manifest has no field for it yet, so the industry declares it
 * here, beside its tables, for every table it has.
 */
export const musterTableAccess = {
  [entriesTable.name]: { feature: ENTRIES_FEATURE, right: RIGHT_JOURNAL_READ },
} as const satisfies Readonly<Record<string, TableAccess>>;

import { command, commandBase, query, queryBase, type ContractFragment } from '@onestrand/contract';
import { LocalDateSchema, nameSchema } from '@onestrand/core';
import { z } from 'zod';
import { ENTRIES_FEATURE, RIGHT_JOURNAL_READ } from './entries';
import { EntrySchema } from './model';

/**
 * The fragment of the contract that `muster` owns (suite ADR-0004, 4 and 6): two operations, a
 * command and a query, both named `muster.<area>.<verb>`. Each declares its function, its level
 * and, where it needs one, a delicate right; the guard of the platform enforces it, the use cases
 * never ask for a right themselves. Summaries are English and technical; the words of the app
 * live in the catalogue.
 *
 * - `muster.entries.add`: whoever operates the journal records an entry.
 * - `muster.entries.list`: reading the whole journal shows what the others wrote, so beside the
 *   level `view` it needs the delicate right `muster.journal_read`.
 */

/** The events the commands of `muster` append: `muster_<thing>.<what_happened>`. */
export const MUSTER_EVENT_TYPES = ['muster_entry.added'] as const;
export type MusterEventType = (typeof MUSTER_EVENT_TYPES)[number];

export const musterContract = {
  'muster.entries.add': command({
    name: 'muster.entries.add',
    summary: 'Records an entry in the journal of the business for a calendar day.',
    access: { feature: ENTRIES_FEATURE, level: 'operate' },
    input: z.object({ ...commandBase, on: LocalDateSchema, title: nameSchema(200) }),
    output: z.object({ entry: EntrySchema }),
  }),
  'muster.entries.list': query({
    name: 'muster.entries.list',
    summary:
      'Lists the entries of the journal that are not deleted, by calendar day in the order the option of the function says (newest first by default). Reading the whole journal is a delicate right.',
    access: { feature: ENTRIES_FEATURE, level: 'view', rights: [RIGHT_JOURNAL_READ] },
    input: z.object({ ...queryBase }),
    output: z.object({ entries: z.array(EntrySchema) }),
  }),
} as const satisfies ContractFragment;

import type { RightEntries } from '@onestrand/access';
import type { FeatureEntries } from '@onestrand/features';

/**
 * What `muster` enters in the registers of the edition (suite ADR-0004, 1 and 4). Every id lies
 * in the namespace of the industry (`muster.<name>`); the industry itself is entered by
 * `defineIndustry`, so it is not listed here. Ids are for ever: they stand in
 * `registry/names.json`, in the row of every business that switched the function on, in stored
 * profiles and in the keys of the catalogues. No text stands here: names and sentences live in
 * the catalogue of the industry under the same ids.
 *
 * One of each level, so every part of the register is used once:
 *
 * - module `muster.journal`, with one function `muster.entries` and its one option
 *   `newestFirst` (the order of the list);
 * - kind of business `muster.standard`, which starts with the function on;
 * - setup question `muster.keeps_journal`, whose answers switch the function on or off;
 * - device mode `muster.capture`, a shared device that only records entries;
 * - delicate right `muster.journal_read`: whoever holds it reads the whole journal, the entries
 *   of the others included.
 */

/** The id of the industry: the prefix of its tables, operations and events. */
export const MUSTER = 'muster';

/** The module of the industry. */
export const JOURNAL_MODULE = 'muster.journal';

/** The one function: entries in the journal. Every operation of the industry names it. */
export const ENTRIES_FEATURE = 'muster.entries';

/** The key of the one option of the function: the list shows the newest calendar day first. */
export const NEWEST_FIRST_OPTION = 'newestFirst';

/** The kind of business the demo has. */
export const STANDARD_KIND = 'muster.standard';

/** The question of the setup: does the business keep a journal. */
export const KEEPS_JOURNAL_QUESTION = 'muster.keeps_journal';

/** The device mode: a shared device that only records entries. */
export const CAPTURE_MODE = 'muster.capture';

/** The delicate right: reading the whole journal, the entries of the others included. */
export const RIGHT_JOURNAL_READ = 'muster.journal_read';

export const musterCatalog = {
  groups: [{ id: JOURNAL_MODULE }],
  features: [
    {
      id: ENTRIES_FEATURE,
      group: JOURNAL_MODULE,
      options: [{ key: NEWEST_FIRST_OPTION, type: 'boolean', default: true }],
    },
  ],
  kinds: [{ id: STANDARD_KIND, on: [ENTRIES_FEATURE] }],
  questions: [
    {
      id: KEEPS_JOURNAL_QUESTION,
      answers: [
        { id: 'yes', enable: [ENTRIES_FEATURE] },
        { id: 'no', disable: [ENTRIES_FEATURE] },
      ],
    },
  ],
  deviceModes: [{ id: CAPTURE_MODE, feature: ENTRIES_FEATURE }],
} as const satisfies FeatureEntries;

export const musterRights = {
  rights: [{ id: RIGHT_JOURNAL_READ }],
} as const satisfies RightEntries;

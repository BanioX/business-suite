import { decideAccess, type AccessContext } from '@onestrand/access';
import type { AccessLevel } from '@onestrand/contract';

/**
 * The slots (suite ADR-0004, 3; architecture, section 4): the only places where an industry
 * appears on a page of the platform. This is the part of them that pure TypeScript knows: their
 * ids, the pages that take sections, and what every entry in a slot says about itself. What an
 * entry looks like on the screen (a route with a component, a card, a button) is the business of
 * `defineIndustryWeb` in W0-03, which adds its own fields to `SlotEntry` and fills the slots;
 * nothing here knows React.
 *
 * Every entry names the function it belongs to and the level it needs, the same data as the
 * `access` of an operation. That is what makes «a function that is switched off has no way in»
 * true on the screen as well: the shell shows an entry only while `availableSlotEntries` lets it
 * through.
 *
 * The questions of the setup and the demo are slots in the architecture, and are data: they are
 * entered in the manifest of the industry itself (`catalog.questions`, `demo`).
 */

/**
 * The slots of the shell, by id:
 *
 * - `routes`: pages of the industry;
 * - `navigation`: entries of the navigation;
 * - `capture`: entries of «＋ Erfassen»;
 * - `today`: cards in «Heute»;
 * - `sections`: sections on a page of the platform (`SlotPage`);
 * - `lines`: lines on the report and the invoice;
 * - `documents`: styles of documents;
 * - `workplaces`: the workplace of a role;
 * - `reminders`: reminders;
 * - `monthly_package`: parts of the monthly package.
 */
export const SLOT_IDS = [
  'routes',
  'navigation',
  'capture',
  'today',
  'sections',
  'lines',
  'documents',
  'workplaces',
  'reminders',
  'monthly_package',
] as const;
export type SlotId = (typeof SLOT_IDS)[number];

/**
 * The pages of the platform that take sections from an industry: customers, sites (the object
 * of the customer), jobs, visits, reports, invoices, «Heute», the setup and the monthly package.
 * The ids are provisional until the modules that own the pages enter theirs.
 */
export const SLOT_PAGES = [
  'customers',
  'sites',
  'jobs',
  'visits',
  'reports',
  'invoices',
  'today',
  'setup',
  'monthly_package',
] as const;
export type SlotPage = (typeof SLOT_PAGES)[number];

/** What every entry in a slot says. `defineIndustryWeb` adds the fields the screen needs. */
export interface SlotEntry {
  /** The id of the entry, in the namespace of the industry: `<industry>.<name>`. */
  readonly id: string;
  /** The function it belongs to; the entry is there only while the function is switched on. */
  readonly feature: string;
  /** The level it needs in that function; default `view`. */
  readonly level?: AccessLevel;
}

/** A section on a page of the platform. */
export interface SectionSlotEntry extends SlotEntry {
  readonly page: SlotPage;
}

/** The entries an industry puts in the slots: every slot is optional. */
export type SlotEntries = {
  readonly [TSlot in SlotId]?: readonly (TSlot extends 'sections' ? SectionSlotEntry : SlotEntry)[];
};

/**
 * The entries a person may see: the function is switched on and the profile reaches the level.
 * A function that is switched off has no way in, for anybody, the owner included; its data
 * stays. Entries come back in their order.
 */
export function availableSlotEntries<TEntry extends SlotEntry>(
  entries: readonly TEntry[],
  context: AccessContext,
): TEntry[] {
  return entries.filter(
    (entry) =>
      decideAccess({ feature: entry.feature, level: entry.level ?? 'view' }, context).allowed,
  );
}

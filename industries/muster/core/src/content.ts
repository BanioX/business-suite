import type { CustomProfile } from '@onestrand/access';
import type { DemoInput, RuleSetInput, TemplateInput } from '@onestrand/manifest';
import { ENTRIES_FEATURE, STANDARD_KIND } from './entries';

/**
 * What `muster` brings besides tables, operations and register entries, one of each: a template,
 * a rule set and a demo business. None of them carries a text of the app; their names live in the
 * catalogue under the same ids, and the names in the demo are made up.
 */

/**
 * The profile of a person who records entries and reads nothing of the others: level `operate`
 * in the function, no delicate right. It is the starting point a business copies for its staff
 * and then owns (a template of kind `profile`, read by the page of the people in W1).
 */
export const STAFF_PROFILE = {
  type: 'custom',
  levels: { [ENTRIES_FEATURE]: 'operate' },
  rights: [],
} as const satisfies CustomProfile;

export const musterTemplates = [
  { id: 'muster.staff', kind: 'profile', data: STAFF_PROFILE },
] as const satisfies readonly TemplateInput[];

/**
 * A rule set is law only with a source (CLAUDE.md, «Recht nur mit Quelle»). This one holds a fact
 * that stands with its source in `docs/fakten/geld-steuern.md`, section 3 (checked on 24.11.2026):
 * books and vouchers are kept for 10 years from the end of the business year (OR 958f para. 1).
 * The app never judges by it; it reminds, documents and points to the source.
 */
export const RETENTION_SOURCE = 'docs/fakten/geld-steuern.md';

export const musterRuleSets = [
  {
    id: 'muster.retention',
    source: RETENTION_SOURCE,
    data: { article: 'OR 958f Abs. 1', years: 10, countedFrom: 'end_of_business_year' },
  },
] as const satisfies readonly RuleSetInput[];

/**
 * The invented business that shows the industry: «Betrieb Muster» with its owner «Person Muster»
 * and one more person. What it holds beyond that, `layOutMusterDemo` makes through the operations.
 */
export const musterDemo = {
  businessName: 'Betrieb Muster',
  ownerName: 'Person Muster',
  kinds: [STANDARD_KIND],
  people: ['Person Beispiel'],
} as const satisfies DemoInput;

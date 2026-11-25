/**
 * What an industry brings besides tables, operations and register entries: templates, rule
 * sets, a demo business and migrations. None of them has a package of its own yet, so each has
 * the smallest honest form: enough to be declared once, named in the register of names, checked
 * for its namespace and handed on. The packages that use them (checklists, wages, the setup)
 * refine the content; they add to these types, they do not replace them.
 *
 * Everything here is data without a text: names and sentences live in the language catalogues
 * under the same ids.
 */

/** A record of plain data, as a file can carry it: what the checks below accept as content. */
export type PlainRecord = Readonly<Record<string, unknown>>;

/**
 * A template of an industry: a starting point a business copies and then owns (a service list
 * without prices, a checklist, a profile of rights). `kind` says which package reads it
 * (`checklist`, `service_list`); `data` is its content, in the form that package defines.
 */
export interface TemplateInput {
  /** `<industry>.<name>`. */
  id: string;
  /** What reads it: one word in lower case with single underscores. */
  kind: string;
  data: PlainRecord;
}

export interface TemplateDefinition {
  readonly id: string;
  readonly kind: string;
  readonly data: PlainRecord;
}

/**
 * A set of rules as data (a collective agreement, a limit, a deadline). Law only with a source
 * (`CLAUDE.md`, rule «Recht nur mit Quelle»): `source` is required and names where the rule
 * stands (a file under `docs/fakten/`, or the authority and the article). The app never judges
 * by it: it reminds, documents and points to the source; a business may change a guideline.
 */
export interface RuleSetInput {
  /** `<industry>.<name>`. */
  id: string;
  /** Where the rules stand; not empty. */
  source: string;
  data: PlainRecord;
}

export interface RuleSetDefinition {
  readonly id: string;
  readonly source: string;
  readonly data: PlainRecord;
}

/**
 * An invented business to show the industry with: a name for the business, one for the person
 * who owns it, and the kinds of business and further people it has. What it holds beyond that
 * (customers, jobs) is made by the industry from its own operations when the demo is created.
 * The names are made up (`Betrieb Muster`, `Person Muster`): no real firm and no real person.
 */
export interface DemoInput {
  businessName: string;
  ownerName: string;
  /** Kinds of business of this industry, as in `catalog.kinds`. */
  kinds?: readonly string[];
  /** Names of further people. */
  people?: readonly string[];
}

export interface DemoDefinition {
  readonly businessName: string;
  readonly ownerName: string;
  readonly kinds: readonly string[];
  readonly people: readonly string[];
}

/**
 * The change of one table of an industry from the form an older version wrote to the form the
 * current one reads. Migrations are applied in the order of the list, each once: the schema
 * ledger of the database of the edition (`@onestrand/web-data`) records the ids it has applied.
 * `upgrade` is pure: a row in, a row out, no storage, no clock.
 */
export interface MigrationInput {
  /** `<industry>.<name>`, never reused. */
  id: string;
  /** A table of this industry. */
  table: string;
  upgrade: (row: PlainRecord) => PlainRecord;
}

export interface MigrationDefinition {
  readonly id: string;
  readonly table: string;
  readonly upgrade: (row: PlainRecord) => PlainRecord;
}

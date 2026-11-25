import type { RightEntries, RightRegistry } from '@onestrand/access';
import type { BusinessContext } from '@onestrand/business';
import {
  DomainEventSchema,
  fragmentProblems,
  type ContractFragment,
  type UseCasesOf,
} from '@onestrand/contract';
import {
  FEATURE_SEGMENT_PATTERN,
  namespaceOf,
  type FeatureEntries,
  type FeatureRegistry,
} from '@onestrand/features';
import { createTableRegistry, type TableDefinition } from '@onestrand/storage';
import type {
  DemoDefinition,
  DemoInput,
  MigrationDefinition,
  MigrationInput,
  RuleSetDefinition,
  RuleSetInput,
  TemplateDefinition,
  TemplateInput,
} from './entries';
import { markMade } from './made';
import { ManifestError, type ManifestPart, type ManifestProblem } from './errors';
import {
  describe,
  frozenPlain,
  isList,
  isPlainData,
  isPlainDataRecord,
  isRecord,
  report,
  reportUnknownFields,
  type Sink,
} from './shape';

/**
 * The manifest of a part of an edition (suite ADR-0004, 1): what a module of the platform or an
 * industry brings, as data and in pure TypeScript. A part declares its tables, its fragment of
 * the contract, the use cases of that fragment, its entries in the register of functions and in
 * the register of rights, and the types of the events it appends. The edition puts the parts
 * together (`composeEdition`); nobody lists them anywhere else, and no file of the platform
 * names an industry.
 *
 * An industry lives in its own namespace and claims nothing outside it; a module of the platform
 * claims nothing inside the namespace of an industry. `defineModule` and `defineIndustry` check
 * the form and the namespace and freeze the result; the problems come as data first
 * (`moduleProblems`, `industryProblems`).
 */

/** What the use cases of a part get from the edition when it starts. */
export interface UseCaseEnvironment {
  /** The context of a command: the whole storage of the device, the clock, the ids, the person acting. */
  readonly ctx: BusinessContext;
  /** The register of functions of the edition. */
  readonly features: FeatureRegistry;
  /** The register of delicate rights of the edition. */
  readonly rights: RightRegistry;
}

/** Builds the use cases of one fragment. Modules do not call each other; what joins them is a port the edition plugs in. */
export type UseCaseFactory<TContract extends ContractFragment> = (
  env: UseCaseEnvironment,
) => UseCasesOf<TContract>;

/** The use cases of a part once its contract is no longer known by type: the form the edition holds. */
export type AnyUseCases = UseCasesOf<ContractFragment>;

/** What a module of the platform declares. */
export interface ModuleInput<TContract extends ContractFragment> {
  /** The id of the module: lower-case words joined by single underscores. */
  id: string;
  /** Its tables, by the same definitions the storage and the backup read. */
  tables: readonly TableDefinition[];
  /** Its fragment of the contract: every operation says its function, level and rights. */
  contract: TContract;
  /** One use case for every operation of `contract`: an operation without one does not compile. */
  useCases: UseCaseFactory<NoInfer<TContract>>;
  /** Its modules, functions, options, kinds, questions and device modes in the register of functions. */
  catalog: FeatureEntries;
  /** The delicate rights it enters. */
  rights?: RightEntries;
  /** The types of the events its commands append, `<thing>.<what_happened>`. */
  events?: readonly string[];
}

/** What an industry declares: everything of a module, bound to its namespace, and more. */
export interface IndustryInput<TContract extends ContractFragment> extends ModuleInput<TContract> {
  /** Starting points a business copies: service lists, checklists, profiles of rights. */
  templates?: readonly TemplateInput[];
  /** Rules as data, each with its source. */
  ruleSets?: readonly RuleSetInput[];
  /** An invented business to show the industry with. */
  demo?: DemoInput;
  /** Changes of the form of its tables, in the order they apply. */
  migrations?: readonly MigrationInput[];
}

/** A module as the edition holds it: checked, every default filled in, frozen. */
export interface Module {
  readonly kind: 'module';
  readonly id: string;
  readonly tables: readonly TableDefinition[];
  readonly contract: ContractFragment;
  readonly useCases: UseCaseFactory<ContractFragment>;
  readonly catalog: FeatureEntries;
  readonly rights: RightEntries;
  readonly events: readonly string[];
}

/** An industry as the edition holds it: checked, every default filled in, frozen. */
export interface Industry extends Omit<Module, 'kind'> {
  readonly kind: 'industry';
  readonly templates: readonly TemplateDefinition[];
  readonly ruleSets: readonly RuleSetDefinition[];
  readonly demo?: DemoDefinition;
  readonly migrations: readonly MigrationDefinition[];
}

/** The id of an industry: lower-case letters and digits, so it is also a prefix of tables, operations and events. */
export const INDUSTRY_ID_PATTERN = /^[a-z][a-z0-9]*$/;

type Role = 'module' | 'industry';

const MODULE_FIELDS = ['id', 'tables', 'contract', 'useCases', 'catalog', 'rights', 'events'];
const INDUSTRY_FIELDS = [...MODULE_FIELDS, 'templates', 'ruleSets', 'demo', 'migrations'];
const CATALOG_FIELDS = ['industries', 'groups', 'features', 'kinds', 'questions', 'deviceModes'];
const CATALOG_ID_LISTS = ['groups', 'features', 'kinds', 'questions', 'deviceModes'] as const;
const RIGHT_FIELDS = ['industry', 'rights'];

/** Where an id belongs, in words for a message. */
function ownerOf(role: Role, id: string | undefined): string {
  return role === 'industry' ? `the industry "${id ?? '?'}"` : 'a module of the platform';
}

/**
 * The namespace rule for ids written with a dot (functions, modules, kinds, questions, device
 * modes, rights): an industry enters only ids that start with its own name and a dot, a module of
 * the platform only ids without a dot.
 */
function checkDotted(
  sink: Sink,
  part: ManifestPart,
  role: Role,
  id: string | undefined,
  entry: string,
): void {
  const namespace = namespaceOf(entry);
  if (role === 'industry' ? namespace !== id : namespace !== undefined) {
    const rule =
      role === 'industry'
        ? `every id of an industry starts with "${id ?? '?'}."`
        : 'a module of the platform enters ids without a namespace; an id with a dot belongs to an industry';
    report(
      sink,
      'wrong_namespace',
      part,
      entry,
      `"${entry}" is not in the namespace of ${ownerOf(role, id)}: ${rule}`,
    );
  }
}

function checkId(sink: Sink, role: Role, value: unknown): string | undefined {
  const pattern = role === 'industry' ? INDUSTRY_ID_PATTERN : FEATURE_SEGMENT_PATTERN;
  if (typeof value !== 'string' || !pattern.test(value)) {
    report(
      sink,
      'invalid_entry',
      'id',
      typeof value === 'string' ? value : '?',
      role === 'industry'
        ? `the id of an industry is lower-case letters and digits starting with a letter, such as "facility"; got ${describe(value)}`
        : `the id of a module is lower-case words joined by single underscores, such as "team_time"; got ${describe(value)}`,
    );
    return undefined;
  }
  return value;
}

function checkTables(sink: Sink, role: Role, id: string | undefined, tables: unknown): void {
  if (!isList(tables)) {
    report(
      sink,
      'invalid_entry',
      'tables',
      '?',
      `tables must be a list (empty if there are none), got ${describe(tables)}`,
    );
    return;
  }
  const seen = new Set<string>();
  for (const table of tables) {
    if (!isRecord(table) || typeof table.name !== 'string') {
      report(
        sink,
        'invalid_entry',
        'tables',
        '?',
        `a table is made with defineTable, got ${describe(table)}`,
      );
      continue;
    }
    const { name } = table;
    try {
      createTableRegistry([table as unknown as TableDefinition]);
    } catch (error) {
      report(
        sink,
        'invalid_entry',
        'tables',
        name,
        error instanceof Error ? error.message : String(error),
      );
    }
    if (seen.has(name)) {
      report(sink, 'duplicate_id', 'tables', name, `the table "${name}" is listed twice`);
    }
    seen.add(name);
    if (role === 'industry' && id !== undefined && !name.startsWith(`${id}_`)) {
      report(
        sink,
        'wrong_namespace',
        'tables',
        name,
        `the table "${name}" is not in the namespace of ${ownerOf(role, id)}: its tables start with "${id}_"`,
      );
    }
  }
}

function checkContract(sink: Sink, role: Role, id: string | undefined, contract: unknown): void {
  const problems = fragmentProblems(contract);
  for (const problem of problems) {
    report(
      sink,
      'invalid_entry',
      'contract',
      problem.operation,
      `${problem.part}: ${problem.message}`,
    );
  }
  if (role !== 'industry' || id === undefined || problems.some((p) => p.part === 'fragment')) {
    return;
  }
  for (const name of Object.keys(contract as ContractFragment)) {
    if (!name.startsWith(`${id}.`)) {
      report(
        sink,
        'wrong_namespace',
        'contract',
        name,
        `the operation "${name}" is not in the namespace of ${ownerOf(role, id)}: its operations start with "${id}."`,
      );
    }
  }
}

function checkEvents(sink: Sink, role: Role, id: string | undefined, events: unknown): void {
  if (events === undefined) {
    return;
  }
  if (!isList(events)) {
    report(
      sink,
      'invalid_entry',
      'events',
      '?',
      `events must be a list of types, got ${describe(events)}`,
    );
    return;
  }
  const seen = new Set<unknown>();
  for (const type of events) {
    if (!DomainEventSchema.shape.type.safeParse(type).success) {
      report(
        sink,
        'invalid_entry',
        'events',
        typeof type === 'string' ? type : '?',
        `an event type is "<thing>.<what_happened>" in lower case with underscores, got ${describe(type)}`,
      );
      continue;
    }
    if (seen.has(type)) {
      report(
        sink,
        'duplicate_id',
        'events',
        String(type),
        `the event "${String(type)}" is listed twice`,
      );
    }
    seen.add(type);
    if (role === 'industry' && id !== undefined && !String(type).startsWith(`${id}_`)) {
      report(
        sink,
        'wrong_namespace',
        'events',
        String(type),
        `the event "${String(type)}" is not in the namespace of ${ownerOf(role, id)}: its events start with "${id}_", as in "${id}_thing.created"`,
      );
    }
  }
}

/** The ids a list of entries has, reporting entries that have none. */
function idsOfEntries(sink: Sink, part: ManifestPart, list: unknown, label: string): string[] {
  if (list === undefined) {
    return [];
  }
  if (!isList(list)) {
    report(sink, 'invalid_entry', part, '?', `${label} must be a list, got ${describe(list)}`);
    return [];
  }
  const ids: string[] = [];
  for (const entry of list) {
    if (isRecord(entry) && typeof entry.id === 'string') {
      ids.push(entry.id);
    } else {
      report(
        sink,
        'invalid_entry',
        part,
        '?',
        `an entry of ${label} needs an id, got ${describe(entry)}`,
      );
    }
  }
  return ids;
}

/** Checks the catalog and returns the ids of the kinds it enters. */
function checkCatalog(sink: Sink, role: Role, id: string | undefined, catalog: unknown): string[] {
  if (!isRecord(catalog)) {
    report(
      sink,
      'invalid_entry',
      'catalog',
      '?',
      `catalog is a bag of entries for the register of functions, got ${describe(catalog)}`,
    );
    return [];
  }
  reportUnknownFields(sink, 'catalog', catalog, CATALOG_FIELDS, 'the catalog');
  if (!isPlainData(catalog)) {
    report(
      sink,
      'invalid_entry',
      'catalog',
      '?',
      'the catalog is plain data: no function, date or class instance',
    );
  }
  const industries = idsOfEntries(sink, 'catalog', catalog.industries, 'industries');
  for (const entry of industries) {
    if (role === 'module' || entry !== id) {
      report(
        sink,
        'wrong_namespace',
        'catalog',
        entry,
        role === 'module'
          ? `a module of the platform names no industry, got "${entry}"`
          : `an industry enters only itself in the register of functions; "${entry}" is not "${id ?? '?'}", and the industry is entered for you`,
      );
    }
  }
  let kinds: string[] = [];
  for (const field of CATALOG_ID_LISTS) {
    const ids = idsOfEntries(sink, 'catalog', catalog[field], field);
    for (const entry of ids) {
      checkDotted(sink, 'catalog', role, id, entry);
    }
    if (field === 'kinds') {
      kinds = ids;
    }
  }
  return kinds;
}

function checkRights(sink: Sink, role: Role, id: string | undefined, rights: unknown): void {
  if (rights === undefined) {
    return;
  }
  if (!isRecord(rights)) {
    report(
      sink,
      'invalid_entry',
      'rights',
      '?',
      `rights is a bag of entries for the register of rights, got ${describe(rights)}`,
    );
    return;
  }
  reportUnknownFields(sink, 'rights', rights, RIGHT_FIELDS, 'the rights');
  if (!isPlainData(rights)) {
    report(
      sink,
      'invalid_entry',
      'rights',
      '?',
      'the rights are plain data: no function, date or class instance',
    );
  }
  if (rights.industry !== undefined && (role === 'module' || rights.industry !== id)) {
    report(
      sink,
      'wrong_namespace',
      'rights',
      String(rights.industry),
      role === 'module'
        ? 'a module of the platform enters rights of the platform; it names no industry'
        : `an industry enters only its own rights; "${String(rights.industry)}" is not "${id ?? '?'}", and the industry is entered for you`,
    );
  }
  for (const entry of idsOfEntries(sink, 'rights', rights.rights, 'rights')) {
    checkDotted(sink, 'rights', role, id, entry);
  }
}

/** A name `<industry>.<segment>`, for templates, rule sets and migrations. */
function checkQualifiedId(
  sink: Sink,
  part: ManifestPart,
  industry: string | undefined,
  value: unknown,
  what: string,
): string | undefined {
  if (typeof value !== 'string' || !value.includes('.')) {
    report(
      sink,
      'invalid_entry',
      part,
      typeof value === 'string' ? value : '?',
      `the id of ${what} is "<industry>.<name>", got ${describe(value)}`,
    );
    return undefined;
  }
  const segment = value.slice(value.indexOf('.') + 1);
  if (industry !== undefined && namespaceOf(value) !== industry) {
    report(
      sink,
      'wrong_namespace',
      part,
      value,
      `the id "${value}" of ${what} is not in the namespace of the industry "${industry}"`,
    );
  } else if (!FEATURE_SEGMENT_PATTERN.test(segment)) {
    report(
      sink,
      'invalid_entry',
      part,
      value,
      `the name of ${what} is lower-case words joined by single underscores, got "${segment}"`,
    );
  }
  return value;
}

/** Checks a list of entries, each a record with known fields; returns the records that are. */
function entryRecords(
  sink: Sink,
  part: ManifestPart,
  list: unknown,
  known: readonly string[],
  what: string,
): Record<string, unknown>[] {
  if (list === undefined) {
    return [];
  }
  if (!isList(list)) {
    report(sink, 'invalid_entry', part, '?', `${part} is a list, got ${describe(list)}`);
    return [];
  }
  const records: Record<string, unknown>[] = [];
  for (const entry of list) {
    if (!isRecord(entry)) {
      report(sink, 'invalid_entry', part, '?', `${what} is a record, got ${describe(entry)}`);
      continue;
    }
    const label = typeof entry.id === 'string' ? entry.id : '?';
    reportUnknownFields(sink, part, entry, known, what, label);
    records.push(entry);
  }
  return records;
}

function checkUnique(sink: Sink, part: ManifestPart, ids: readonly (string | undefined)[]): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (id === undefined) {
      continue;
    }
    if (seen.has(id)) {
      report(sink, 'duplicate_id', part, id, `"${id}" is listed twice`);
    }
    seen.add(id);
  }
}

function checkTemplates(sink: Sink, id: string | undefined, list: unknown): void {
  const ids = entryRecords(sink, 'templates', list, ['id', 'kind', 'data'], 'a template').map(
    (entry) => {
      const qualified = checkQualifiedId(sink, 'templates', id, entry.id, 'a template');
      if (typeof entry.kind !== 'string' || !FEATURE_SEGMENT_PATTERN.test(entry.kind)) {
        report(
          sink,
          'invalid_entry',
          'templates',
          qualified ?? '?',
          `the kind of a template says what reads it, one lower-case word, got ${describe(entry.kind)}`,
        );
      }
      if (!isPlainDataRecord(entry.data)) {
        report(
          sink,
          'invalid_entry',
          'templates',
          qualified ?? '?',
          `the data of a template is a record of plain data, got ${describe(entry.data)}`,
        );
      }
      return qualified;
    },
  );
  checkUnique(sink, 'templates', ids);
}

function checkRuleSets(sink: Sink, id: string | undefined, list: unknown): void {
  const ids = entryRecords(sink, 'rule_sets', list, ['id', 'source', 'data'], 'a rule set').map(
    (entry) => {
      const qualified = checkQualifiedId(sink, 'rule_sets', id, entry.id, 'a rule set');
      if (typeof entry.source !== 'string' || entry.source.trim() === '') {
        report(
          sink,
          'missing_source',
          'rule_sets',
          qualified ?? '?',
          'a rule set names its source (a file under docs/fakten/, or the authority and the article): law only with a source',
        );
      }
      if (!isPlainDataRecord(entry.data)) {
        report(
          sink,
          'invalid_entry',
          'rule_sets',
          qualified ?? '?',
          `the data of a rule set is a record of plain data, got ${describe(entry.data)}`,
        );
      }
      return qualified;
    },
  );
  checkUnique(sink, 'rule_sets', ids);
}

function checkNames(sink: Sink, value: unknown, what: string): void {
  if (typeof value !== 'string' || value.trim() === '') {
    report(sink, 'invalid_entry', 'demo', '?', `${what} is a name, got ${describe(value)}`);
  }
}

function checkDemo(sink: Sink, kinds: readonly string[], demo: unknown): void {
  if (demo === undefined) {
    return;
  }
  if (!isRecord(demo)) {
    report(sink, 'invalid_entry', 'demo', '?', `the demo is a record, got ${describe(demo)}`);
    return;
  }
  reportUnknownFields(
    sink,
    'demo',
    demo,
    ['businessName', 'ownerName', 'kinds', 'people'],
    'the demo',
  );
  checkNames(sink, demo.businessName, 'the name of the demo business');
  checkNames(sink, demo.ownerName, 'the name of the owner of the demo business');
  for (const field of ['kinds', 'people'] as const) {
    const list = demo[field];
    if (list !== undefined && (!isList(list) || list.some((item) => typeof item !== 'string'))) {
      report(
        sink,
        'invalid_entry',
        'demo',
        '?',
        `${field} of the demo is a list of texts, got ${describe(list)}`,
      );
    }
  }
  if (isList(demo.people)) {
    demo.people.forEach((person) => checkNames(sink, person, 'the name of a person of the demo'));
  }
  if (isList(demo.kinds)) {
    for (const kind of demo.kinds) {
      if (typeof kind === 'string' && !kinds.includes(kind)) {
        report(
          sink,
          'unknown_reference',
          'demo',
          kind,
          `the demo names the kind "${kind}", which the catalog of the industry does not enter`,
        );
      }
    }
  }
}

function checkMigrations(
  sink: Sink,
  id: string | undefined,
  tables: readonly string[],
  list: unknown,
): void {
  const ids = entryRecords(sink, 'migrations', list, ['id', 'table', 'upgrade'], 'a migration').map(
    (entry) => {
      const qualified = checkQualifiedId(sink, 'migrations', id, entry.id, 'a migration');
      if (typeof entry.table !== 'string' || !tables.includes(entry.table)) {
        report(
          sink,
          'unknown_reference',
          'migrations',
          qualified ?? '?',
          `a migration changes a table of its own industry, got ${describe(entry.table)}`,
        );
      }
      if (typeof entry.upgrade !== 'function') {
        report(
          sink,
          'invalid_entry',
          'migrations',
          qualified ?? '?',
          `a migration has an upgrade function (a row in, a row out), got ${describe(entry.upgrade)}`,
        );
      }
      return qualified;
    },
  );
  checkUnique(sink, 'migrations', ids);
}

function partProblems(role: Role, input: unknown): ManifestProblem[] {
  const sink: Sink = [];
  if (!isRecord(input)) {
    report(
      sink,
      'invalid_entry',
      'manifest',
      '?',
      `a ${role} is declared with an object, got ${describe(input)}`,
    );
    return sink;
  }
  reportUnknownFields(
    sink,
    'manifest',
    input,
    role === 'industry' ? INDUSTRY_FIELDS : MODULE_FIELDS,
    `a ${role}`,
  );
  const id = checkId(sink, role, input.id);
  checkTables(sink, role, id, input.tables);
  checkContract(sink, role, id, input.contract);
  if (typeof input.useCases !== 'function') {
    report(
      sink,
      'invalid_entry',
      'use_cases',
      '?',
      `useCases is a function that builds the use cases of the contract, got ${describe(input.useCases)}`,
    );
  }
  checkEvents(sink, role, id, input.events);
  const kinds = checkCatalog(sink, role, id, input.catalog);
  checkRights(sink, role, id, input.rights);
  if (role === 'industry') {
    const tables = isList(input.tables)
      ? input.tables.flatMap((table) =>
          isRecord(table) && typeof table.name === 'string' ? [table.name] : [],
        )
      : [];
    checkTemplates(sink, id, input.templates);
    checkRuleSets(sink, id, input.ruleSets);
    checkDemo(sink, kinds, input.demo);
    checkMigrations(sink, id, tables, input.migrations);
  }
  return sink;
}

/**
 * Everything that is wrong with the declaration of a module, as data; nothing is thrown. An
 * empty list means `defineModule` takes it. It works on values of any shape (a manifest written
 * without types, a cast): an operation without `access` is found here.
 */
export function moduleProblems(input: unknown): ManifestProblem[] {
  return partProblems('module', input);
}

/**
 * Everything that is wrong with the declaration of an industry, as data; nothing is thrown. An
 * empty list means `defineIndustry` takes it. Besides the form it checks the namespace rules of
 * suite ADR-0004, 4: tables `<industry>_<name>`, operations `<industry>.…`, events
 * `<industry>_<thing>.<what>`, functions, modules, kinds, questions, device modes and rights
 * `<industry>.<name>`; and that a rule set names its source.
 */
export function industryProblems(input: unknown): ManifestProblem[] {
  return partProblems('industry', input);
}

function refuse(what: string, problems: readonly ManifestProblem[]): void {
  const [first] = problems;
  if (first !== undefined) {
    throw new ManifestError(
      first.code,
      `The ${what} is refused: ${problems.map((problem) => `${problem.part} ${problem.id}: ${problem.message}`).join('; ')}`,
      problems,
    );
  }
}

/** The parts both manifests share, copied and frozen. */
function common(input: ModuleInput<ContractFragment>) {
  return {
    id: input.id,
    tables: Object.freeze([...input.tables]),
    contract: Object.freeze({ ...input.contract }),
    // The type of the use cases followed the contract of the input; the edition holds both as they are.
    useCases: input.useCases as UseCaseFactory<ContractFragment>,
    events: Object.freeze([...(input.events ?? [])]),
  };
}

/**
 * Declares a module of the platform. Throws a `ManifestError` with the code of the first problem
 * (`moduleProblems` lists them all); the result is checked and frozen. An operation of the
 * contract without a use case does not compile.
 */
export function defineModule<const TContract extends ContractFragment>(
  input: ModuleInput<TContract>,
): Module {
  refuse('module', moduleProblems(input));
  return markMade(
    Object.freeze({
      kind: 'module' as const,
      ...common(input),
      catalog: frozenPlain(input.catalog),
      rights: frozenPlain(input.rights ?? {}),
    }),
  );
}

/**
 * Declares an industry. Throws a `ManifestError` with the code of the first problem
 * (`industryProblems` lists them all); the result is checked and frozen. The industry is entered
 * in the register of functions and in the register of rights under its own id: do not list it
 * yourself. An operation of the contract without a use case does not compile.
 */
export function defineIndustry<const TContract extends ContractFragment>(
  input: IndustryInput<TContract>,
): Industry {
  refuse('industry', industryProblems(input));
  const demo = input.demo;
  return markMade(
    Object.freeze({
      kind: 'industry' as const,
      ...common(input),
      catalog: frozenPlain({ ...input.catalog, industries: [{ id: input.id }] }),
      rights: frozenPlain({ ...input.rights, industry: input.id }),
      templates: frozenPlain([...(input.templates ?? [])]),
      ruleSets: frozenPlain([...(input.ruleSets ?? [])]),
      ...(demo === undefined
        ? {}
        : {
            demo: frozenPlain({
              businessName: demo.businessName,
              ownerName: demo.ownerName,
              kinds: demo.kinds ?? [],
              people: demo.people ?? [],
            }),
          }),
      migrations: Object.freeze(
        (input.migrations ?? []).map((migration) => Object.freeze({ ...migration })),
      ),
    }),
  );
}

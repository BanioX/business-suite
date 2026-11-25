import {
  contractAccessProblems,
  createRightRegistry,
  guardUseCases,
  rightEntryProblems,
  type RightRegistry,
} from '@onestrand/access';
import { BusinessSchema, createAccessSource, type Business } from '@onestrand/business';
import {
  composeContract,
  composeProblems,
  operationSchemaProblems,
  type Clock,
  type ContractFragment,
  type IdGenerator,
  type UseCase,
} from '@onestrand/contract';
import { IdSchema, type Id } from '@onestrand/core';
import {
  createFeatureRegistry,
  featureEntryProblems,
  namespaceOf,
  type FeatureEntries,
  type FeatureRegistry,
} from '@onestrand/features';
import {
  createCatalogueSet,
  createLexicon,
  lexiconProblems,
  mergeCatalogues,
  messages,
  missingTexts,
  platformTerms,
  registerTexts,
  type CatalogueSet,
  type Lexicon,
  type MessageTree,
  type Translation,
} from '@onestrand/i18n';
import {
  createBackupKit,
  createMemoryStorage,
  createTableRegistry,
  type AnyTableRegistry,
  type BackupKit,
  type Hasher,
  type Storage,
} from '@onestrand/storage';
import { businessModule } from './business-module';
import type { Edition } from './edition';
import { EditionError, type EditionProblem } from './errors';
import type { AnyUseCases, Industry, Module, UseCaseEnvironment } from './part';

/**
 * Putting an edition together (suite ADR-0004, 2): from the parts of an edition, which are data,
 * everything that would otherwise be wired by hand: the register of tables, the registers of
 * functions and of rights, the contract, the catalogue of texts and the lexicon. What needs a
 * storage only when it runs (the use cases behind the guard, the backup) comes with
 * `startEdition`, which takes the storage, the clock, the ids and the hasher as parameters: in a
 * test the storage in memory, in the browser the database.
 *
 * `editionProblems` lists everything that is wrong with an edition as data; the test of every
 * edition and `pnpm check:industry` call it and expect `[]`. `composeEdition` refuses what
 * cannot be put together and tolerates what only the conformity tests mind (a missing text).
 */

/** An edition put together: the registers, the contract and the texts, ready to be started on a storage. */
export interface ComposedEdition {
  readonly edition: Edition;
  /** The business module first, then the modules of the edition, then its industries. */
  readonly parts: readonly (Module | Industry)[];
  /** The tables of every part, as one register: what the storage and the database are built from. */
  readonly tables: AnyTableRegistry;
  readonly features: FeatureRegistry;
  readonly rights: RightRegistry;
  /** The sum of the fragments of every part, by operation name. */
  readonly contract: ContractFragment;
  /** The id of the part that owns each operation, by operation name. */
  readonly owners: Readonly<Record<string, string>>;
  /** The catalogue of the app in de-CH: the platform's, with the catalogues of the edition laid over it. */
  readonly catalogue: MessageTree;
  /** The catalogue in every language of the edition, with the fall-back to de-CH. */
  readonly catalogues: CatalogueSet<MessageTree>;
  readonly lexicon: Lexicon;
}

/** What the edition needs from the outside world to run. */
export interface EditionRuntime {
  /** The storage of the device, built from `composed.tables`; the business row has the full model. */
  readonly storage: Storage<AnyTableRegistry, Business>;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  /** Verifies the checksums of files in a backup. */
  readonly hasher: Hasher;
  /** The person acting on this device: the author of every event, and the guard asks for their profile. */
  readonly actor: Id;
}

/** An edition that runs on a storage. */
export interface RunningEdition {
  readonly composed: ComposedEdition;
  /** Every operation of the contract, each checked by the guard before it runs. */
  readonly useCases: AnyUseCases;
  /** Writing, checking and restoring the backups of the edition, in its format and version. */
  readonly backups: BackupKit<AnyTableRegistry, Business>;
}

interface Assembled {
  composed?: ComposedEdition;
  /** What stops the edition from being put together. */
  blocking: EditionProblem[];
  /** What only the conformity tests mind. */
  conformity: EditionProblem[];
}

function groupBy<TValue>(entries: readonly (readonly [string, TValue])[]): Map<string, TValue[]> {
  const grouped = new Map<string, TValue[]>();
  for (const [key, value] of entries) {
    grouped.set(key, [...(grouped.get(key) ?? []), value]);
  }
  return grouped;
}

/** The entries of every part for the register of functions, as one bag: the register finds the references itself. */
function mergedEntries(parts: readonly (Module | Industry)[]): FeatureEntries {
  return {
    industries: parts.flatMap((part) => part.catalog.industries ?? []),
    groups: parts.flatMap((part) => part.catalog.groups ?? []),
    features: parts.flatMap((part) => part.catalog.features ?? []),
    kinds: parts.flatMap((part) => part.catalog.kinds ?? []),
    questions: parts.flatMap((part) => part.catalog.questions ?? []),
    deviceModes: parts.flatMap((part) => part.catalog.deviceModes ?? []),
  };
}
function partsProblems(parts: readonly (Module | Industry)[], sink: EditionProblem[]): void {
  for (const [id, same] of groupBy(parts.map((part) => [part.id, part.kind] as const))) {
    if (same.length > 1) {
      sink.push({
        part: 'parts',
        code: 'duplicate_part',
        id,
        message: `the id "${id}" belongs to ${same.length} parts of the edition (${same.join(', ')}): every part has its own id`,
      });
    }
  }
}

/** A module of the platform must not use the namespace of an industry of the edition. */
function namespaceProblems(parts: readonly (Module | Industry)[], sink: EditionProblem[]): void {
  const industries = parts.filter((part) => part.kind === 'industry').map((part) => part.id);
  const taken = (id: string, what: string, owner: string, industry: string) =>
    sink.push({
      part: 'namespaces',
      code: 'namespace_taken',
      id,
      message: `${what} "${id}" of the module "${owner}" lies in the namespace of the industry "${industry}"`,
    });
  for (const part of parts.filter((one) => one.kind === 'module')) {
    for (const industry of industries) {
      for (const table of part.tables.filter((one) => one.name.startsWith(`${industry}_`))) {
        taken(table.name, 'the table', part.id, industry);
      }
      for (const name of Object.keys(part.contract).filter((one) =>
        one.startsWith(`${industry}.`),
      )) {
        taken(name, 'the operation', part.id, industry);
      }
      for (const type of part.events.filter((one) => one.startsWith(`${industry}_`))) {
        taken(type, 'the event', part.id, industry);
      }
    }
  }
}

/** An operation of an industry names functions and rights of the platform and of its own industry, never of another. */
function foreignProblems(parts: readonly (Module | Industry)[], sink: EditionProblem[]): void {
  for (const part of parts.filter((one) => one.kind === 'industry')) {
    for (const operation of Object.values(part.contract)) {
      const { feature, rights = [] } = operation.access;
      for (const id of [feature, ...rights]) {
        const namespace = namespaceOf(id);
        if (namespace !== undefined && namespace !== part.id) {
          sink.push({
            part: 'access',
            code: 'foreign_dependency',
            id: operation.name,
            message: `the operation ${operation.name} of the industry "${part.id}" asks for "${id}" of the industry "${namespace}": an industry names only the platform and itself`,
          });
        }
      }
    }
  }
}

function tablesOf(
  parts: readonly (Module | Industry)[],
  sink: EditionProblem[],
): AnyTableRegistry | undefined {
  const named = groupBy(
    parts.flatMap((part) => part.tables.map((table) => [table.name, part.id] as const)),
  );
  let clash = false;
  for (const [name, owners] of named) {
    if (owners.length > 1) {
      clash = true;
      sink.push({
        part: 'tables',
        code: 'duplicate_table',
        id: name,
        message: `the table ${name} comes from ${owners.map((owner) => `"${owner}"`).join(' and from ')}: every table has one owner`,
      });
    }
  }
  if (clash) {
    return undefined;
  }
  try {
    return createTableRegistry(parts.flatMap((part) => part.tables));
  } catch (error) {
    sink.push({
      part: 'tables',
      code: error instanceof Error && 'code' in error ? String(error.code) : 'invalid_table',
      id: '?',
      message: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

function featuresOf(
  parts: readonly (Module | Industry)[],
  sink: EditionProblem[],
): FeatureRegistry | undefined {
  const entries = mergedEntries(parts);
  const problems = featureEntryProblems(entries);
  for (const problem of problems) {
    sink.push({ part: 'features', code: problem.code, id: problem.id, message: problem.message });
  }
  return problems.length === 0 ? createFeatureRegistry(entries) : undefined;
}

function rightsOf(
  parts: readonly (Module | Industry)[],
  features: FeatureRegistry,
  sink: EditionProblem[],
): RightRegistry | undefined {
  let rights = createRightRegistry(features, {});
  let clean = true;
  for (const part of parts) {
    const problems = rightEntryProblems(features, part.rights, rights);
    for (const problem of problems) {
      sink.push({ part: 'rights', code: problem.code, id: problem.id, message: problem.message });
    }
    if (problems.length === 0) {
      rights = rights.extend(part.rights);
    } else {
      clean = false;
    }
  }
  return clean ? rights : undefined;
}

function contractOf(
  parts: readonly (Module | Industry)[],
  sink: EditionProblem[],
): ContractFragment | undefined {
  const contractParts = parts.map((part) => ({ source: part.id, fragment: part.contract }));
  const problems = composeProblems(contractParts);
  for (const problem of problems) {
    sink.push({
      part: 'contract',
      code: problem.code,
      id: problem.operation,
      message: problem.message,
    });
  }
  return problems.length === 0 ? composeContract(contractParts) : undefined;
}

/** What an edition's languages and words are: the catalogue, its set and the lexicon. */
function textsOf(edition: Edition, sink: EditionProblem[]) {
  const catalogue = mergeCatalogues(messages, ...edition.texts);
  const catalogues = createCatalogueSet(
    catalogue,
    // A partial catalogue by tag is a translation against the merged source.
    edition.translations as Readonly<Record<string, Translation<MessageTree>>>,
  );
  const lexiconInput = { base: platformTerms, ...edition.lexicon };
  const problems = lexiconProblems(lexiconInput);
  for (const problem of problems) {
    sink.push({
      part: 'lexicon',
      code: problem.code,
      id: `${problem.from}:${problem.term}`,
      message: problem.message,
    });
  }
  return {
    catalogue,
    catalogues,
    lexicon: problems.length === 0 ? createLexicon(lexiconInput) : undefined,
  };
}

function assemble(edition: Edition): Assembled {
  const blocking: EditionProblem[] = [];
  const conformity: EditionProblem[] = [];
  const parts: readonly (Module | Industry)[] = [
    businessModule,
    ...edition.modules,
    ...edition.industries,
  ];
  partsProblems(parts, blocking);
  namespaceProblems(parts, blocking);
  foreignProblems(parts, blocking);
  const tables = tablesOf(parts, blocking);
  const features = featuresOf(parts, blocking);
  const rights = features === undefined ? undefined : rightsOf(parts, features, blocking);
  const contract = contractOf(parts, blocking);
  if (contract !== undefined && features !== undefined && rights !== undefined) {
    for (const problem of contractAccessProblems(contract, { features, rights })) {
      blocking.push({
        part: 'access',
        code: problem.part,
        id: problem.operation,
        message: `${problem.message}: an operation that asks for it is refused for everyone`,
      });
    }
  }
  const { catalogue, catalogues, lexicon } = textsOf(edition, blocking);
  if (features !== undefined && rights !== undefined) {
    for (const missing of missingTexts(catalogue, registerTexts({ features, rights }))) {
      conformity.push({
        part: 'texts',
        code: 'missing_text',
        id: missing.path,
        message: missing.message,
      });
    }
  }
  if (
    blocking.length > 0 ||
    tables === undefined ||
    features === undefined ||
    rights === undefined ||
    contract === undefined ||
    lexicon === undefined
  ) {
    return { blocking, conformity };
  }
  const owners: Record<string, string> = {};
  for (const part of parts) {
    for (const name of Object.keys(part.contract)) {
      owners[name] = part.id;
    }
  }
  return {
    blocking,
    conformity,
    composed: Object.freeze({
      edition,
      parts: Object.freeze(parts),
      tables,
      features,
      rights,
      contract,
      owners: Object.freeze(owners),
      catalogue,
      catalogues,
      lexicon,
    }),
  };
}

/**
 * Puts an edition together: the register of tables, the registers of functions and of rights,
 * the contract, the catalogue and the lexicon, from its parts. Throws an `EditionError` with the
 * code of the first problem if the parts do not fit (an operation or a table twice, an id outside
 * its namespace, an `access` that names a function or a right nobody entered, a reference
 * nothing answers); `problems` lists them all. A missing text does not stop it: the catalogue
 * falls back to de-CH, and `editionProblems` names the gap.
 */
export function composeEdition(edition: Edition): ComposedEdition {
  const { composed, blocking } = assemble(edition);
  if (composed === undefined) {
    throw new EditionError(
      `The edition "${edition.id}" cannot be put together: ${blocking.map((problem) => problem.message).join('; ')}`,
      blocking,
    );
  }
  return composed;
}

/**
 * The environment the parts get while the edition is only checked: a storage in memory with the
 * tables of the edition, and ports that refuse to be used. Building the use cases must not need
 * the world; if it does, that is a problem the check names.
 */
function inertEnvironment(
  tables: AnyTableRegistry,
  features: FeatureRegistry,
  rights: RightRegistry,
): UseCaseEnvironment {
  const refused = (what: string) => (): never => {
    throw new Error(`The ${what} is not there while the use cases are only built for a check`);
  };
  const storage = createMemoryStorage<AnyTableRegistry, Business>(tables, {
    hasher: { sha256: () => Promise.reject(new Error('The hasher is not there for a check')) },
    clock: { now: refused('clock'), today: refused('clock') },
    ids: { next: refused('id generator') },
  });
  return {
    ctx: {
      storage,
      clock: { now: refused('clock'), today: refused('clock') },
      ids: { next: refused('id generator') },
      actor: IdSchema.parse('00000000-0000-7000-8000-000000000000'),
    },
    features,
    rights,
  };
}

/** The names of what a part's use cases implement, against its contract: one each, none too many. */
function useCaseProblems(
  part: Module | Industry,
  build: () => AnyUseCases,
  sink: EditionProblem[],
): AnyUseCases | undefined {
  let cases: AnyUseCases;
  try {
    cases = build();
  } catch (error) {
    sink.push({
      part: 'use_cases',
      code: 'use_cases_failed',
      id: part.id,
      message: `building the use cases of "${part.id}" threw: ${error instanceof Error ? error.message : String(error)}`,
    });
    return undefined;
  }
  const have = new Set(Object.keys(cases));
  const want = Object.keys(part.contract);
  for (const name of want.filter((one) => !have.has(one))) {
    sink.push({
      part: 'use_cases',
      code: 'missing_use_case',
      id: name,
      message: `"${part.id}" has no use case for the operation ${name}`,
    });
  }
  for (const name of [...have].filter((one) => !Object.hasOwn(part.contract, one))) {
    sink.push({
      part: 'use_cases',
      code: 'extra_use_case',
      id: name,
      message: `"${part.id}" has a use case for ${name}, which is not an operation of its contract`,
    });
  }
  return cases;
}

/**
 * Everything that is wrong with an edition, as data; nothing is thrown. This is what the test of
 * every edition and `pnpm check:industry` expect to be `[]`:
 *
 * - parts: an id twice, a module in the namespace of an industry;
 * - tables: a table twice, a table the storage refuses;
 * - features: everything `featureEntryProblems` finds across all parts (an id twice, a reference
 *   nothing answers, a cycle, a wrong namespace, a core function that needs a switchable one);
 * - rights: everything `rightEntryProblems` finds;
 * - contract: an operation twice (naming both owners), an operation that is not well formed (no
 *   `access` among them), and the schemas of every operation (`operationSchemaProblems`);
 * - access: every `access.feature` and `access.rights` that is not entered
 *   (`contractAccessProblems`), and an industry that asks for what belongs to another industry;
 * - use cases: one for each operation of each part and none too many;
 * - texts: every text the registers ask for (`missingTexts`), in de-CH;
 * - lexicon: a conflict between two industries over a word.
 *
 * It does not check a language other than de-CH for completeness: which language must be complete
 * is the decision of the test of the edition (`catalogueGaps`).
 */
export function editionProblems(edition: Edition): EditionProblem[] {
  const { composed, blocking, conformity } = assemble(edition);
  const problems = [...blocking, ...conformity];
  const parts: readonly (Module | Industry)[] = [
    businessModule,
    ...edition.modules,
    ...edition.industries,
  ];
  for (const part of parts) {
    for (const operation of Object.values(part.contract)) {
      for (const problem of operationSchemaProblems(operation)) {
        problems.push({
          part: 'schemas',
          code: 'invalid_schema',
          id: operation.name,
          message: `${problem.part}: ${problem.message}`,
        });
      }
    }
  }
  if (composed !== undefined) {
    const env = inertEnvironment(composed.tables, composed.features, composed.rights);
    for (const part of composed.parts) {
      useCaseProblems(part, () => part.useCases(env), problems);
    }
  }
  return problems;
}

/**
 * Starts a composed edition on a storage: builds the use cases of every part, puts them behind
 * the guard of `@onestrand/access` (each operation checked against the function and level it
 * declares, with the profile of `runtime.actor` and the functions the business has switched on),
 * and builds the backup kit in the format and version of the edition. A function that is
 * switched off has no way in: its operations are refused, its rows stay in the storage and in the
 * backup. Throws an `EditionError` if a part lacks a use case or has one too many.
 *
 * The edition itself is data; this is the only place where it meets a storage, a clock, ids and a
 * hasher, so the same edition runs on the storage in memory in a test and on the database of the
 * browser in the app.
 */
export function startEdition(composed: ComposedEdition, runtime: EditionRuntime): RunningEdition {
  const { storage, clock, ids, hasher, actor } = runtime;
  const { edition, features, rights } = composed;
  const env: UseCaseEnvironment = { ctx: { storage, clock, ids, actor }, features, rights };
  const problems: EditionProblem[] = [];
  const all: Record<string, UseCase<ContractFragment[string]>> = {};
  for (const part of composed.parts) {
    Object.assign(
      all,
      useCaseProblems(part, () => part.useCases(env), problems),
    );
  }
  if (problems.length > 0) {
    throw new EditionError(
      `The edition "${edition.id}" cannot be started: ${problems.map((problem) => problem.message).join('; ')}`,
      problems,
    );
  }
  const useCases = guardUseCases(
    composed.contract,
    all,
    createAccessSource({ storage, features, actor }),
  );
  const backups = createBackupKit({
    format: edition.backupFormat,
    version: edition.backupVersion,
    registry: composed.tables,
    hasher,
    businessSchema: BusinessSchema,
    readers: edition.backupReaders,
  });
  return Object.freeze({ composed, useCases, backups });
}

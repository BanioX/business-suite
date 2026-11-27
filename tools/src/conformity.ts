// The conformity of one industry, as data (suite ADR-0004, 8; docs/architektur.md, section 4;
// rule 10 of platform/manifest/api.md): what `pnpm check:industry <id>` asks of an industry
// beyond its own tests. Every check returns a `Finding`: the problems (the test that calls it
// expects none) and notes for the person (what was read, what could not be judged).
//
// This module runs under Vitest only: it loads the manifest of the industry, which is TypeScript
// that imports the platform (tools/src/industry-check.ts says why plain Node cannot). The test
// files under tools/conformity/ call it for the industry named in the environment, and
// tools/test/conformity.test.ts calls it for `muster` and for broken copies of it.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { filterRowsForDevice, OWNER_PROFILE, type Profile } from '@onestrand/access';
import type { Business } from '@onestrand/business';
import { CommandError } from '@onestrand/contract';
import type { Id } from '@onestrand/core';
import {
  composeEdition,
  defineEdition,
  editionProblems,
  industryProblems,
  ManifestError,
  startEdition,
  type ComposedEdition,
  type EditionInput,
  type Industry,
  type IndustryInput,
  type RunningEdition,
} from '@onestrand/manifest';
import { createMemoryStorage, type AnyTableRegistry, type Storage } from '@onestrand/storage';
import {
  businessSnapshot,
  catalogueTexts,
  DE_CH_TEXT_RULES,
  fixedClock,
  sequentialIds,
  sideEffectRegisterProblems,
  testHasher,
  textProblems,
} from '@onestrand/testing';
import { vitestProject } from './affected.ts';
import { INDUSTRY_ENV } from './industry-check.ts';
import { industryFolders, INDUSTRIES_DIR, manifestOf, type IndustryFolder } from './industries.ts';
import { NAMES_DOCUMENT, namingOf, proposedNames } from './industry-new.ts';
import { industryNames, NAME_KINDS, NAMES_PATH, packageNames, readNames } from './names.ts';
import { namesIn } from './public-repo.ts';
import { readTextFiles, REPO_ROOT } from './repo-files.ts';
import { SIDE_EFFECTS_DOCUMENT, shippedSources } from './side-effects.ts';
import { PRODUCT_NAMES } from './words/products.ts';

/** What a check found: problems turn the step red, notes only tell. */
export interface Finding {
  readonly problems: readonly string[];
  readonly notes: readonly string[];
}

/** The industry under check, as far as it could be loaded. */
export interface Subject {
  readonly root: string;
  readonly id: string;
  readonly folder: IndustryFolder;
  /** What its entry exports; empty when the entry cannot be loaded. */
  readonly exports: Readonly<Record<string, unknown>>;
  /** Its manifest; undefined when it cannot be loaded (then `loadProblems` says why). */
  readonly manifest: Industry | undefined;
  readonly loadProblems: readonly string[];
  /** Its catalogue in de-CH; undefined when there is none (then `catalogueProblems` says why). */
  readonly catalogue: Readonly<Record<string, unknown>> | undefined;
  /** Where the catalogue was found, or where it was looked for, from the root. */
  readonly catalogueFrom: string;
  readonly catalogueProblems: readonly string[];
}

/**
 * Where the catalogue of an industry stands: in its React part once W0-03 brings
 * `defineIndustryWeb` (`industries/<id>/web/messages.ts`), until then among the tests of its pure
 * part (`industries/<id>/core/test/messages.ts`, debt TD-111). The first that exists counts.
 */
export function cataloguePlaces(id: string): string[] {
  return [
    `${INDUSTRIES_DIR}/${id}/web/messages.ts`,
    `${INDUSTRIES_DIR}/${id}/core/test/messages.ts`,
  ];
}

/** The name of the export that holds the catalogue: `musterMessages`. */
export function catalogueExport(id: string): string {
  return `${id}Messages`;
}

/**
 * The name of the export that lays out the demo business through the operations:
 * `layOutMusterDemo`. The manifest has no field for it yet (debt TD-112), so the check finds it by
 * this convention of the pattern.
 */
export function demoExport(id: string): string {
  return `layOut${namingOf(id).pascal}Demo`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `1 table`, `2 tables`: a count for a note. */
function counted(count: number, noun: string): string {
  return `${String(count)} ${noun}${count === 1 ? '' : 's'}`;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** An error of a manifest as lines: the code and every problem, or the message. */
function describeError(error: unknown): string[] {
  if (error instanceof ManifestError) {
    return [
      `refused with ${error.code}: ${error.message}`,
      ...error.problems.map(
        (problem) => `${problem.code} ${problem.part} ${problem.id}: ${problem.message}`,
      ),
    ];
  }
  return [messageOf(error)];
}

async function importFile(root: string, path: string): Promise<unknown> {
  return import(pathToFileURL(join(root, path)).href) as Promise<unknown>;
}

/** Loads the industry `id` of the repository at `root`: its entry, its manifest, its catalogue. */
export async function loadSubject(root: string, id: string): Promise<Subject> {
  const folder = industryFolders(root).find((candidate) => candidate.id === id);
  if (folder === undefined) {
    throw new Error(
      `There is no industry "${id}": ${INDUSTRIES_DIR}/${id}/core/package.json is missing`,
    );
  }
  let exports: Readonly<Record<string, unknown>> = {};
  let manifest: Industry | undefined;
  const loadProblems: string[] = [];
  try {
    const loaded = await importFile(root, folder.entry);
    exports = isRecord(loaded) ? loaded : {};
    // The guards read the same shape; here the whole manifest is used, as made by defineIndustry.
    manifest = manifestOf(loaded, folder) as unknown as Industry;
  } catch (error) {
    loadProblems.push(
      ...describeError(error).map((line) => `${folder.entry} cannot be loaded: ${line}`),
    );
  }
  const places = cataloguePlaces(id);
  const found = places.find((place) => existsSync(join(root, place)));
  let catalogue: Readonly<Record<string, unknown>> | undefined;
  const catalogueProblems: string[] = [];
  if (found === undefined) {
    catalogueProblems.push(
      `the industry has no catalogue: neither ${places.join(' nor ')} is there (export ${catalogueExport(id)})`,
    );
  } else {
    try {
      const loaded = await importFile(root, found);
      const value = isRecord(loaded) ? loaded[catalogueExport(id)] : undefined;
      if (isRecord(value)) {
        catalogue = value;
      } else {
        catalogueProblems.push(`${found} exports no catalogue ${catalogueExport(id)}`);
      }
    } catch (error) {
      catalogueProblems.push(`${found} cannot be loaded: ${messageOf(error)}`);
    }
  }
  return {
    root,
    id,
    folder,
    exports,
    manifest,
    loadProblems,
    catalogue,
    catalogueFrom: found ?? places.join(' or '),
    catalogueProblems,
  };
}

/** The industry that `pnpm check:industry` names in the environment, in this repository. */
export function subjectFromEnvironment(root: string = REPO_ROOT): Promise<Subject> {
  const id = process.env[INDUSTRY_ENV];
  if (id === undefined || id === '') {
    throw new Error(
      `${INDUSTRY_ENV} names no industry: run the conformity through pnpm check:industry <id>`,
    );
  }
  return loadSubject(root, id);
}

const NO_MANIFEST =
  'the manifest cannot be loaded, so this cannot be judged (see the step manifest)';

/** The declaration as `defineIndustry` takes it, read back from a manifest. */
export function inputOf(industry: Industry): IndustryInput<Industry['contract']> {
  return {
    id: industry.id,
    tables: industry.tables,
    contract: industry.contract,
    useCases: industry.useCases,
    catalog: industry.catalog,
    rights: industry.rights,
    events: industry.events,
    templates: industry.templates,
    ruleSets: industry.ruleSets,
    ...(industry.demo === undefined ? {} : { demo: industry.demo }),
    migrations: industry.migrations,
  };
}

/**
 * The edition `pnpm check:industry` builds: the business module of the platform and the
 * industry, nothing else, under the frozen names an edition of that id would have (`<id>`,
 * `<id>:`, `<id>-backup`, version 1; ADR-0008). It exists for the check only.
 */
export function checkEditionInput(industry: Industry, catalogue: unknown): EditionInput {
  const { id, pascal } = namingOf(industry.id);
  return {
    id,
    database: id,
    storagePrefix: `${id}:`,
    backupFormat: `${id}-backup`,
    backupVersion: 1,
    title: pascal,
    industries: [industry],
    texts: isRecord(catalogue) ? [catalogue as NonNullable<EditionInput['texts']>[number]] : [],
  };
}

/** The manifest: loaded without a problem, under the names of its directory, with real sources. */
export async function manifestConformity(subject: Subject): Promise<Finding> {
  const { root, folder, manifest } = subject;
  const naming = namingOf(subject.id);
  const problems = [...subject.loadProblems];
  const notes: string[] = [];
  if (manifest !== undefined) {
    problems.push(
      ...industryProblems(inputOf(manifest)).map(
        (problem) => `${problem.code} ${problem.part} ${problem.id}: ${problem.message}`,
      ),
    );
    for (const ruleSet of manifest.ruleSets) {
      const file = ruleSet.source.split('#')[0] ?? '';
      if (!file.startsWith('docs/fakten/') || !existsSync(join(root, file))) {
        problems.push(
          `the rule set ${ruleSet.id} names the source ${ruleSet.source}, which is no file under docs/fakten/ (law only with a source)`,
        );
      }
    }
    notes.push(
      [
        counted(manifest.tables.length, 'table'),
        counted(Object.keys(manifest.contract).length, 'operation'),
        counted(manifest.catalog.features?.length ?? 0, 'function'),
        counted(manifest.ruleSets.length, 'rule set'),
      ].join(', '),
    );
  }
  const packageFile = join(root, folder.core, 'package.json');
  const name: unknown = (JSON.parse(readFileSync(packageFile, 'utf8')) as Record<string, unknown>)
    .name;
  if (name !== naming.packageName) {
    problems.push(
      `${folder.core}/package.json is called ${JSON.stringify(name)}: an industry is the package ${naming.packageName}`,
    );
  }
  const project = vitestProject(folder.core);
  const configPath = `${folder.core}/vitest.config.ts`;
  if (!existsSync(join(root, configPath))) {
    problems.push(`${configPath} is missing: the tests of the industry are the project ${project}`);
  } else {
    try {
      const config = await importFile(root, configPath);
      const test = isRecord(config) && isRecord(config.default) ? config.default.test : undefined;
      const named = isRecord(test) ? test.name : undefined;
      if (named !== project) {
        problems.push(
          `${configPath} names the project ${JSON.stringify(named)}: it must be ${project}, or pnpm check --affected tests nothing (tools/src/affected.ts, vitestProject)`,
        );
      }
    } catch (error) {
      problems.push(`${configPath} cannot be loaded: ${messageOf(error)}`);
    }
  }
  return { problems, notes };
}

/** An edition of the business module and the industry composes, and `editionProblems` is `[]`. */
export function editionConformity(subject: Subject): Finding {
  if (subject.manifest === undefined) {
    return { problems: [NO_MANIFEST], notes: [] };
  }
  const problems = [...subject.catalogueProblems];
  let edition;
  try {
    edition = defineEdition(checkEditionInput(subject.manifest, subject.catalogue));
  } catch (error) {
    return { problems: [...problems, ...describeError(error)], notes: [] };
  }
  const found = editionProblems(edition).map(
    (problem) => `${problem.part}: ${problem.code} ${problem.id}: ${problem.message}`,
  );
  problems.push(...found);
  if (found.length === 0) {
    try {
      composeEdition(edition);
    } catch (error) {
      problems.push(...describeError(error));
    }
  }
  return { problems, notes: [`catalogue from ${subject.catalogueFrom}`] };
}

/** The names of the products of the suite that no text names (tools/src/words/products.ts). */
const PRODUCT_WORDS = [...PRODUCT_NAMES.words, ...(PRODUCT_NAMES.parts ?? [])];

/**
 * The catalogue in de-CH follows the rules of the language (du, ss, no exclamation mark, no
 * slogan, no emoji; `DE_CH_TEXT_RULES` of `@onestrand/testing`), names no product of the suite
 * and none of the listed names (tools/src/words/forbidden-names.ts), and holds texts for the
 * ids of the industry only: a text of the platform stays the platform's.
 */
export function textConformity(subject: Subject): Finding {
  const { catalogue, id } = subject;
  if (catalogue === undefined) {
    return { problems: subject.catalogueProblems, notes: [] };
  }
  const problems = textProblems(catalogue, {
    rules: DE_CH_TEXT_RULES,
    productNames: PRODUCT_WORDS,
  }).map((problem) => `${problem.path}: ${problem.rule}: «${problem.text}»: ${problem.message}`);
  const texts = catalogueTexts(catalogue);
  for (const { path, text } of texts) {
    if (namesIn(text).length > 0) {
      problems.push(
        `${path}: «${text}» holds a listed name (another product, a real company or person), which never stands in this repository`,
      );
    }
  }
  for (const [section, entries] of Object.entries(catalogue)) {
    if (!isRecord(entries)) {
      problems.push(
        `${section}: a section of the catalogue holds texts by id, not ${typeof entries}`,
      );
      continue;
    }
    for (const key of Object.keys(entries).filter((key) => !key.startsWith(`${id}.`))) {
      problems.push(
        `${section}.${key}: the catalogue of an industry holds texts for its own ids (${id}.…) only; this one belongs to the platform or to another industry`,
      );
    }
  }
  return { problems, notes: [`${counted(texts.length, 'text')} from ${subject.catalogueFrom}`] };
}

/** An empty device of the edition, and the edition started on it by a person not known yet. */
function emptyDevice(composed: ComposedEdition, idStart: number) {
  const clock = fixedClock();
  const ids = sequentialIds(idStart);
  const storage: Storage<AnyTableRegistry, Business> = createMemoryStorage<
    AnyTableRegistry,
    Business
  >(composed.tables, { hasher: testHasher, clock, ids });
  const actor: Id = ids.next();
  const running = startEdition(composed, { storage, clock, ids, hasher: testHasher, actor });
  return { clock, ids, storage, actor, running };
}

type Device = ReturnType<typeof emptyDevice>;

function call(running: RunningEdition, name: string, input: unknown): Promise<unknown> {
  const useCase = running.useCases[name];
  return useCase === undefined
    ? Promise.reject(new Error(`the edition has no operation ${name}`))
    : useCase(input);
}

/** The code a call is refused with (`forbidden`, `invalid` …); undefined when it went through. */
async function codeOf(pending: Promise<unknown>): Promise<string | undefined> {
  try {
    await pending;
    return undefined;
  } catch (error) {
    return error instanceof CommandError ? error.code : `error (${messageOf(error)})`;
  }
}

/**
 * Lays out the demo business on a device: with the function of the industry that does it through
 * the operations (`layOut<Id>Demo`), or, without one, a business from the demo of the manifest
 * (`business.create` with every function of the edition, then its people).
 */
async function layOutDemo(
  subject: Subject,
  composed: ComposedEdition,
  device: Device,
): Promise<{ businessId: Id; how: string }> {
  const manifest = subject.manifest;
  const layOut = subject.exports[demoExport(subject.id)];
  if (typeof layOut === 'function') {
    const result: unknown = await (layOut as (useCases: unknown, ports: unknown) => unknown)(
      device.running.useCases,
      { ids: device.ids, clock: device.clock, features: composed.features },
    );
    const businessId = isRecord(result) ? result.businessId : undefined;
    if (typeof businessId !== 'string') {
      throw new Error(`${demoExport(subject.id)} must give { businessId } back`);
    }
    // The id the demo made with the ids of this device, given back as it is.
    return { businessId: businessId as Id, how: `laid out by ${demoExport(subject.id)}` };
  }
  const demo = manifest?.demo;
  const kinds = demo?.kinds ?? [];
  const businessId = device.ids.next();
  await call(device.running, 'business.create', {
    commandId: device.ids.next(),
    businessId,
    name: demo?.businessName ?? 'Betrieb Muster',
    ownerName: demo?.ownerName ?? 'Person Muster',
    industries: [subject.id],
    kinds,
    features: composed.features.propose({ kinds }).all,
  });
  for (const name of demo?.people ?? []) {
    await call(device.running, 'business.people.add', {
      commandId: device.ids.next(),
      businessId,
      name,
      profile: { type: 'custom', levels: {}, rights: [] },
    });
  }
  return {
    businessId,
    how: `made from the demo of the manifest: the industry exports no ${demoExport(subject.id)}, so its tables start empty`,
  };
}

/** Two lists of rows hold the same data, as far as a file carries it. */
function sameData(left: unknown, right: unknown): boolean {
  return isDeepStrictEqual(
    JSON.parse(JSON.stringify(left ?? null)),
    JSON.parse(JSON.stringify(right ?? null)),
  );
}

function idsOf(rows: unknown): string[] {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => (isRecord(row) && typeof row.id === 'string' ? row.id : ''))
    .sort();
}

/** The edition of the check, put together, or why it cannot be. */
function composedOf(subject: Subject): { composed?: ComposedEdition; problems: string[] } {
  if (subject.manifest === undefined) {
    return { problems: [NO_MANIFEST] };
  }
  try {
    return {
      composed: composeEdition(
        defineEdition(checkEditionInput(subject.manifest, subject.catalogue)),
      ),
      problems: [],
    };
  } catch (error) {
    return {
      problems: describeError(error).map((line) => `the edition cannot be put together: ${line}`),
    };
  }
}

/**
 * «Switched off leaves no trace» (rule 9 of platform/manifest/api.md): for every function of the
 * industry that can be switched, on the demo business, switched off by the owner: every
 * operation of the functions it takes along is refused with `forbidden`, the rest of the edition
 * goes on, the rows stay as they were, in the storage and in a backup; switched on again, the
 * rows are the same and the operations are no longer refused. The entries of the slots come with
 * `defineIndustryWeb` (W0-03); `availableSlotEntries` is the rule for them.
 */
export async function switchedOffConformity(subject: Subject): Promise<Finding> {
  const { composed, problems } = composedOf(subject);
  const manifest = subject.manifest;
  if (composed === undefined || manifest === undefined) {
    return { problems, notes: [] };
  }
  const notes: string[] = [];
  try {
    const device = emptyDevice(composed, 1);
    const { businessId, how } = await layOutDemo(subject, composed, device);
    notes.push(`demo business ${how}`);
    const switchable = (manifest.catalog.features ?? [])
      .map(({ id }) => id)
      .filter((id) => !composed.features.get(id).core);
    if (switchable.length === 0) {
      return { problems: ['the industry has no function that can be switched off'], notes };
    }
    const owner = device.running;
    const command = () => ({ commandId: device.ids.next(), businessId });
    const switchTo = (featureId: string, on: boolean) =>
      call(owner, 'business.features.switch', { ...command(), featureId, on }) as Promise<{
        turnedOff: string[];
      }>;
    const enabled = composed.features.resolve(
      (await device.storage.businesses.get(businessId))?.features ?? [],
    ).features;
    for (const featureId of switchable.filter((id) => !enabled.includes(id))) {
      await switchTo(featureId, true);
    }
    const rows = async () =>
      (await businessSnapshot(device.storage, composed.tables, businessId)).tables;
    const operations = Object.entries(manifest.contract);
    const inputOfOperation = (kind: string) => (kind === 'command' ? command() : { businessId });
    for (const featureId of switchable) {
      const before = await rows();
      const { turnedOff } = await switchTo(featureId, false);
      if (!turnedOff.includes(featureId)) {
        // Without it nothing below would be asked of a function that is off: never a pass for nothing.
        problems.push(
          `switching ${featureId} off turned off ${turnedOff.length === 0 ? 'nothing' : turnedOff.join(', ')}, not ${featureId}`,
        );
      }
      const closed = operations.filter(([, operation]) =>
        turnedOff.includes(operation.access.feature),
      );
      let refused = 0;
      for (const [name, operation] of closed) {
        const code = await codeOf(call(owner, name, inputOfOperation(operation.kind)));
        if (code === 'forbidden') {
          refused += 1;
        } else {
          problems.push(
            `${name} answered ${code ?? 'without an error'} while ${featureId} was off: an operation of a function that is off is refused with forbidden, also for the owner`,
          );
        }
      }
      const rest = await codeOf(call(owner, 'business.get', { businessId }));
      if (rest !== undefined) {
        problems.push(
          `business.get answered ${rest} while ${featureId} was off: the rest of the edition goes on`,
        );
      }
      const during = await rows();
      const document = await owner.backups.exportBackup(device.storage, businessId, {
        clock: device.clock,
      });
      for (const table of manifest.tables) {
        if (!sameData(during[table.name], before[table.name])) {
          problems.push(
            `switching ${featureId} off changed the rows of ${table.name}: the data of a function that is off stays`,
          );
        }
        if (
          table.backup &&
          !isDeepStrictEqual(idsOf(document.tables[table.name]), idsOf(before[table.name]))
        ) {
          problems.push(`a backup taken while ${featureId} was off lacks rows of ${table.name}`);
        }
      }
      for (const again of turnedOff) {
        await switchTo(again, true);
      }
      const after = await rows();
      for (const table of manifest.tables) {
        if (!sameData(after[table.name], before[table.name])) {
          problems.push(
            `switched on again, ${table.name} does not hold the rows it had before ${featureId} was switched off`,
          );
        }
      }
      for (const [name, operation] of closed) {
        if ((await codeOf(call(owner, name, inputOfOperation(operation.kind)))) === 'forbidden') {
          problems.push(`${name} is still refused after ${featureId} was switched on again`);
        }
      }
      notes.push(
        `${featureId} off: ${String(refused)} of ${counted(closed.length, 'operation')} refused, ${counted(manifest.tables.length, 'table')} kept`,
      );
    }
  } catch (error) {
    problems.push(`the check could not run to its end: ${messageOf(error)}`);
  }
  notes.push('the slots of the React part are checked with defineIndustryWeb (W0-03)');
  return { problems, notes };
}

/**
 * The backup there and back: the demo business is written to a file in the format of the
 * edition, the file is checked, restored on an empty device, and the business and every table
 * come back as they were. Every table of the industry that is not a table of the device is in
 * the backup.
 */
export async function backupConformity(subject: Subject): Promise<Finding> {
  const { composed, problems } = composedOf(subject);
  const manifest = subject.manifest;
  if (composed === undefined || manifest === undefined) {
    return { problems, notes: [] };
  }
  const notes: string[] = [];
  try {
    const device = emptyDevice(composed, 1);
    const { businessId, how } = await layOutDemo(subject, composed, device);
    notes.push(`demo business ${how}`);
    const { backups } = device.running;
    if (backups.format !== `${subject.id}-backup` || backups.version !== 1) {
      problems.push(
        `the backup is ${backups.format} version ${String(backups.version)}, not ${subject.id}-backup version 1`,
      );
    }
    for (const table of manifest.tables.filter(({ backup }) => backup)) {
      if (!backups.tables.includes(table.name)) {
        problems.push(`${table.name} is not in the backup`);
      }
    }
    const before = await businessSnapshot(device.storage, composed.tables, businessId);
    const document = await backups.exportBackup(device.storage, businessId, {
      clock: device.clock,
    });
    const checked = await backups.checkBackup(JSON.parse(JSON.stringify(document)) as unknown);
    problems.push(
      ...checked.preview.problems.map(
        (problem) => `the file is refused: ${JSON.stringify(problem)}`,
      ),
    );
    if (checked.backup === undefined) {
      return {
        problems: [...problems, 'the backup of the demo business cannot be read back'],
        notes,
      };
    }
    const other = emptyDevice(composed, 50_000);
    await backups.restoreBackup(other.storage, checked.backup);
    const after = await businessSnapshot(other.storage, composed.tables, businessId);
    if (!sameData(after.business, before.business)) {
      problems.push('the business comes back changed');
    }
    for (const table of composed.tables.tables.filter(({ backup }) => backup)) {
      if (!sameData(after.tables[table.name], before.tables[table.name])) {
        problems.push(`the rows of ${table.name} come back changed`);
      }
    }
    for (const table of manifest.tables) {
      const count = before.tables[table.name]?.length ?? 0;
      notes.push(`${table.name}: ${counted(count, 'row')} there and back`);
    }
  } catch (error) {
    problems.push(`the check could not run to its end: ${messageOf(error)}`);
  }
  return { problems, notes };
}

/**
 * The name of the export that says, for every table, which function it belongs to and which
 * delicate right opens its sensitive parts: `musterTableAccess`. A table does not say it itself
 * and the manifest has no field for it yet (debt TD-70), so the check finds it by this convention.
 */
export function tableAccessExport(id: string): string {
  return `${id}TableAccess`;
}

/** A profile with some levels and rights, no owner. */
function custom(levels: Readonly<Record<string, 'view'>>, rights: readonly string[] = []): Profile {
  return { type: 'custom', levels: { ...levels }, rights: [...rights] };
}

/**
 * The filter for other devices («Filter fürs Handy», docs/architektur.md, section 4): the
 * industry names a registered function, and where it has one a registered right, for every
 * table; on the rows of the demo business `filterRowsForDevice` then gives the owner everything,
 * nothing while the function is off or to a person without a level in it, a sensitive table only
 * with the right, and sensitive fields of another table only with the right.
 */
export async function deviceFilterConformity(subject: Subject): Promise<Finding> {
  const { composed, problems } = composedOf(subject);
  const manifest = subject.manifest;
  if (composed === undefined || manifest === undefined) {
    return { problems, notes: [] };
  }
  const name = tableAccessExport(subject.id);
  const declared = subject.exports[name];
  if (!isRecord(declared)) {
    return {
      problems: [
        `the industry exports no ${name}: the filter for other devices needs the function and the right of every table (filterRowsForDevice of @onestrand/access; debt TD-70)`,
      ],
      notes: [],
    };
  }
  for (const table of Object.keys(declared)) {
    if (!manifest.tables.some((known) => known.name === table)) {
      problems.push(`${name} names ${table}, which is no table of the industry`);
    }
  }
  const notes: string[] = [];
  try {
    const device = emptyDevice(composed, 1);
    const { businessId, how } = await layOutDemo(subject, composed, device);
    notes.push(`demo business ${how}`);
    const on = composed.features.resolve(composed.features.ids).features;
    const off = composed.features.resolve([]).features;
    for (const table of manifest.tables) {
      const access = declared[table.name];
      const feature = isRecord(access) ? access.feature : undefined;
      const right = isRecord(access) ? access.right : undefined;
      if (typeof feature !== 'string' || (right !== undefined && typeof right !== 'string')) {
        problems.push(
          `${name} names no function (and, if any, no right as a text) for ${table.name}`,
        );
        continue;
      }
      // `ids.includes`, not `has`: the type guard would narrow the id to never in this branch.
      if (!composed.features.ids.includes(feature)) {
        problems.push(
          `${name} gives ${table.name} the function ${feature}, which nobody registered`,
        );
        continue;
      }
      if (right !== undefined && !composed.rights.ids.includes(right)) {
        problems.push(`${name} gives ${table.name} the right ${right}, which nobody registered`);
        continue;
      }
      const sensitiveFields = Object.entries(table.fields)
        .filter(([, sensitivity]) => sensitivity === 'sensitive')
        .map(([field]) => field);
      if (
        (table.sensitivity === 'sensitive' || sensitiveFields.length > 0) &&
        right === undefined
      ) {
        notes.push(
          `${table.name} is sensitive and names no right: on another device only the owner gets it`,
        );
      }
      const rows = await device.storage.table(table).ofBusiness(businessId);
      const filter = (profile: Profile, features: readonly string[]) =>
        filterRowsForDevice(table, right === undefined ? { feature } : { feature, right }, rows, {
          profile,
          features,
        });
      const owner = filter(OWNER_PROFILE, on);
      if (!owner.allowed || !sameData(owner.rows, rows)) {
        problems.push(`${table.name} does not go whole to the owner`);
      }
      if (!composed.features.get(feature).core && filter(OWNER_PROFILE, off).allowed) {
        problems.push(`${table.name} goes to another device while ${feature} is off`);
      }
      if (filter(custom({}), on).allowed) {
        problems.push(`${table.name} goes to a person without a level in ${feature}`);
      }
      const viewer = filter(custom({ [feature]: 'view' }), on);
      if (table.sensitivity === 'sensitive' && viewer.allowed) {
        problems.push(`${table.name} is sensitive and goes to a person without the right`);
      }
      if (
        table.sensitivity !== 'sensitive' &&
        (!viewer.allowed ||
          viewer.rows.some((row) => sensitiveFields.some((field) => Object.hasOwn(row, field))))
      ) {
        problems.push(
          `${table.name} does not go to a person with view without its sensitive fields`,
        );
      }
      if (right !== undefined) {
        const holder = filter(custom({ [feature]: 'view' }, [right]), on);
        if (!holder.allowed || !sameData(holder.rows, rows)) {
          problems.push(
            `${table.name} does not go whole to a person with view and the right ${right}`,
          );
        }
      }
      notes.push(
        `${table.name}: ${counted(rows.length, 'row')}, function ${feature}${right === undefined ? '' : `, right ${right}`}`,
      );
    }
  } catch (error) {
    problems.push(`the check could not run to its end: ${messageOf(error)}`);
  }
  return { problems, notes };
}

/**
 * No side effect without a row in the register (CLAUDE.md, «Daten bleiben auf dem Gerät»):
 * every kind of side effect in the shipped code of the industry stands in
 * docs/nebenwirkungen.md, and every storage key with its prefix (`<id>:…`) too. The same rules
 * as the guard over the whole repository (tools/src/side-effects.ts), for this industry.
 */
export function sideEffectConformity(subject: Subject): Finding {
  const sources = shippedSources(readTextFiles(subject.root, `${INDUSTRIES_DIR}/${subject.id}`));
  const registerFile = join(subject.root, SIDE_EFFECTS_DOCUMENT);
  if (!existsSync(registerFile)) {
    return { problems: [`${SIDE_EFFECTS_DOCUMENT} is missing`], notes: [] };
  }
  const problems = sideEffectRegisterProblems(sources, readFileSync(registerFile, 'utf8'), {
    storagePrefixes: [subject.id],
  }).map(
    (problem) =>
      `${problem.rule}: ${problem.message}${problem.paths.length > 0 ? ` (${problem.paths.join(', ')})` : ''}`,
  );
  return { problems, notes: [`${counted(sources.length, 'shipped file')} read`] };
}

/** Where every identifier of the industry stands. */
export interface NamesFinding extends Finding {
  /** In registry/names.json, under the industry. */
  readonly registered: readonly string[];
  /** Only proposed in industries/<id>/NAMES.md. */
  readonly proposed: readonly string[];
}

/**
 * Every identifier the industry sets for good (its package, and what its manifest names:
 * tables, operations, events, functions, modules, rights; `industryNames`) is either in
 * registry/names.json under `industry:<id>` or proposed in its NAMES.md; NAMES.md proposes
 * nothing the industry does not use. The repository-wide guard (`pnpm names`) still wants every
 * one in the register before the industry lands.
 */
export function namesConformity(subject: Subject): NamesFinding {
  const { root, folder, id, manifest } = subject;
  const empty = { registered: [], proposed: [] };
  if (manifest === undefined) {
    return { ...empty, problems: [NO_MANIFEST], notes: [] };
  }
  const registerFile = join(root, NAMES_PATH);
  const { entries, problems: unreadable } = readNames(
    existsSync(registerFile) ? readFileSync(registerFile, 'utf8') : undefined,
  );
  if (entries === undefined) {
    return {
      ...empty,
      problems: unreadable.map(({ message }) => `${NAMES_PATH}: ${message}`),
      notes: [],
    };
  }
  const proposalPath = `${INDUSTRIES_DIR}/${id}/${NAMES_DOCUMENT}`;
  const proposals = existsSync(join(root, proposalPath))
    ? proposedNames(readFileSync(join(root, proposalPath), 'utf8'))
    : [];
  const packagePath = `${folder.core}/package.json`;
  const used = [
    ...packageNames([{ path: packagePath, text: readFileSync(join(root, packagePath), 'utf8') }]),
    ...industryNames(manifest, folder.entry),
  ];
  const problems: string[] = [];
  const registered: string[] = [];
  const proposed: string[] = [];
  const owner = `industry:${id}`;
  for (const { kind, name } of used) {
    const label = `${kind} ${name}`;
    const entry = entries.find((candidate) => candidate.kind === kind && candidate.name === name);
    if (entry !== undefined) {
      if (entry.owner === owner) {
        registered.push(label);
      } else {
        problems.push(`the ${label} belongs to ${entry.owner} in ${NAMES_PATH}, not to ${owner}`);
      }
    } else if (proposals.some((candidate) => candidate.kind === kind && candidate.name === name)) {
      proposed.push(label);
    } else {
      problems.push(
        `the ${label} is neither in ${NAMES_PATH} nor proposed in ${proposalPath}: propose it there, the head enters it`,
      );
    }
  }
  for (const { kind, name } of proposals) {
    if (!(NAME_KINDS as readonly string[]).includes(kind)) {
      problems.push(
        `${proposalPath} proposes a ${kind}, which is no kind of the register (${NAME_KINDS.join(', ')})`,
      );
    } else if (!used.some((candidate) => candidate.kind === kind && candidate.name === name)) {
      problems.push(
        `${proposalPath} proposes the ${kind} ${name}, which the industry does not use`,
      );
    }
  }
  const notes = [
    `in ${NAMES_PATH}: ${String(registered.length)}${registered.length > 0 ? ` (${registered.join(', ')})` : ''}`,
    `proposed in ${proposalPath}: ${String(proposed.length)}${proposed.length > 0 ? ` (${proposed.join(', ')})` : ''}`,
    ...(proposed.length > 0
      ? [
          `before the industry lands, the head enters the proposed names in ${NAMES_PATH}: until then pnpm names is red`,
        ]
      : []),
  ];
  return { problems, notes, registered, proposed };
}

import { languageProblems, type LexiconInput, type MessageTree } from '@onestrand/i18n';
import type { BackupReader } from '@onestrand/storage';
import { ManifestError, type ManifestPart, type ManifestProblem } from './errors';
import { isMade, markMade } from './made';
import { INDUSTRY_ID_PATTERN, type Industry, type Module } from './part';
import { describe, isList, isRecord, report, reportUnknownFields, type Sink } from './shape';

/**
 * The manifest of an edition (suite ADR-0004, 2; ADR-0008): the installable app, as data. It
 * names what must never change once a business has data in it (the technical id, the name of the
 * database, the prefix of the storage on the device, the format of the backup and its version),
 * and what it puts together (its industries and modules, its languages and its words). The
 * brand, the theme and the address belong to the edition in `editions/`, not here.
 *
 * The technical names follow the purpose, never the brand (ADR-0008, 2): database `field`,
 * prefix `field:`, backup format `field-backup`. The edition says them out loud, so they stand in
 * one file where they are frozen and where the register of names can read them; `defineEdition`
 * checks that they carry the id.
 */

export interface EditionInput {
  /** The technical id: lower-case letters and digits, never renamed, not the brand. */
  id: string;
  /** The name of the database on the device; the id. Never renamed. */
  database: string;
  /** The prefix of every key the edition keeps on the device outside the database; the id and a colon. Never renamed. */
  storagePrefix: string;
  /** The format name in a backup file; the id and `-backup`. Never renamed. */
  backupFormat: string;
  /** The version of the backup this edition writes: a whole number from 1. Raised when a reader of the old one is added. */
  backupVersion: number;
  /** Readers of older versions, `readers[n]` turns version `n` into `n + 1`; every version below `backupVersion` needs one. */
  backupReaders?: Readonly<Record<number, BackupReader>>;
  /** A working title for lists and logs. The brand is not here (W0-03). */
  title: string;
  /** The industries of the edition, each made by `defineIndustry`. The only list that grows by hand. */
  industries: readonly Industry[];
  /** Modules of the platform besides the business, each made by `defineModule`. */
  modules?: readonly Module[];
  /** The catalogues of the industries (and the edition) in de-CH, laid over the catalogue of the platform in this order. */
  texts?: readonly MessageTree[];
  /** The other languages of the edition by tag; each holds the keys it has translated, `{}` a language entered without text. */
  translations?: Readonly<Record<string, MessageTree>>;
  /** The words of the industries and of the edition for the terms of the platform. */
  lexicon?: Omit<LexiconInput, 'base'>;
}

/** An edition as the platform holds it: checked, every default filled in, frozen. */
export interface Edition {
  readonly kind: 'edition';
  readonly id: string;
  readonly database: string;
  readonly storagePrefix: string;
  readonly backupFormat: string;
  readonly backupVersion: number;
  readonly backupReaders: Readonly<Record<number, BackupReader>>;
  readonly title: string;
  readonly industries: readonly Industry[];
  readonly modules: readonly Module[];
  readonly texts: readonly MessageTree[];
  readonly translations: Readonly<Record<string, MessageTree>>;
  readonly lexicon: Omit<LexiconInput, 'base'>;
}

const EDITION_FIELDS = [
  'id',
  'database',
  'storagePrefix',
  'backupFormat',
  'backupVersion',
  'backupReaders',
  'title',
  'industries',
  'modules',
  'texts',
  'translations',
  'lexicon',
];

/** The form of a technical name the edition freezes: it carries the id, so brand and technology stay apart. */
function checkName(
  sink: Sink,
  part: ManifestPart,
  what: string,
  value: unknown,
  expected: string | undefined,
): void {
  if (typeof value !== 'string' || value.trim() === '' || value !== value.trim()) {
    report(
      sink,
      'invalid_entry',
      part,
      '?',
      `${what} is a name without surrounding spaces, got ${describe(value)}`,
    );
  } else if (expected !== undefined && value !== expected) {
    report(
      sink,
      'invalid_entry',
      part,
      value,
      `${what} carries the id of the edition and is "${expected}" (suite ADR-0008, 2); got "${value}". A name that was shipped is never renamed`,
    );
  }
}

function checkParts(
  sink: Sink,
  part: 'industries' | 'modules',
  kind: 'industry' | 'module',
  list: unknown,
): string[] {
  if (list === undefined && part === 'modules') {
    return [];
  }
  if (!isList(list)) {
    report(
      sink,
      'invalid_entry',
      part,
      '?',
      `${part} is a list of manifests, got ${describe(list)}`,
    );
    return [];
  }
  const ids: string[] = [];
  for (const entry of list) {
    if (!isMade(entry, kind)) {
      report(
        sink,
        'invalid_entry',
        part,
        '?',
        kind === 'industry'
          ? `an industry of an edition is made with defineIndustry, got ${describe(entry)}`
          : `a module of an edition is made with defineModule, got ${describe(entry)}`,
      );
      continue;
    }
    const { id } = entry as Industry | Module;
    if (ids.includes(id)) {
      report(sink, 'duplicate_id', part, id, `"${id}" is listed twice`);
    }
    ids.push(id);
  }
  return ids;
}

function checkTexts(sink: Sink, input: Record<string, unknown>): void {
  const { texts, translations } = input;
  if (texts !== undefined && (!isList(texts) || texts.some((tree) => !isRecord(tree)))) {
    report(
      sink,
      'invalid_entry',
      'texts',
      '?',
      `texts is a list of catalogues, got ${describe(texts)}`,
    );
  }
  if (translations === undefined) {
    return;
  }
  if (!isRecord(translations) || Object.values(translations).some((tree) => !isRecord(tree))) {
    report(
      sink,
      'invalid_entry',
      'languages',
      '?',
      `translations is a record of catalogues by language tag, got ${describe(translations)}`,
    );
    return;
  }
  const tags = Object.keys(translations);
  for (const problem of languageProblems(tags)) {
    report(sink, 'invalid_entry', 'languages', problem.tag, problem.message);
  }
  if (tags.includes('de-CH')) {
    report(
      sink,
      'invalid_entry',
      'languages',
      'de-CH',
      'de-CH is the source of every catalogue, not a translation: its texts are `texts`',
    );
  }
}

/**
 * Everything that is wrong with the declaration of an edition, as data; nothing is thrown. An
 * empty list means `defineEdition` takes it. It checks the form and what can be seen without
 * putting the parts together; whether the parts fit together (an operation twice, a text
 * missing) is `editionProblems`.
 */
export function editionInputProblems(input: unknown): ManifestProblem[] {
  const sink: Sink = [];
  if (!isRecord(input)) {
    report(
      sink,
      'invalid_entry',
      'manifest',
      '?',
      `an edition is declared with an object, got ${describe(input)}`,
    );
    return sink;
  }
  reportUnknownFields(sink, 'manifest', input, EDITION_FIELDS, 'an edition');
  const { id } = input;
  const validId = typeof id === 'string' && INDUSTRY_ID_PATTERN.test(id);
  if (!validId) {
    report(
      sink,
      'invalid_entry',
      'id',
      typeof id === 'string' ? id : '?',
      `the id of an edition is lower-case letters and digits starting with a letter, such as "field"; got ${describe(id)}`,
    );
  }
  const own = validId ? id : undefined;
  checkName(sink, 'database', 'the name of the database', input.database, own);
  checkName(
    sink,
    'storage_prefix',
    'the prefix of the storage',
    input.storagePrefix,
    own === undefined ? undefined : `${own}:`,
  );
  checkName(
    sink,
    'backup',
    'the format of the backup',
    input.backupFormat,
    own === undefined ? undefined : `${own}-backup`,
  );
  const { backupVersion } = input;
  if (
    typeof backupVersion !== 'number' ||
    !Number.isSafeInteger(backupVersion) ||
    backupVersion < 1
  ) {
    report(
      sink,
      'invalid_entry',
      'backup',
      '?',
      `the version of the backup is a whole number from 1, got ${describe(backupVersion)}`,
    );
  } else if (backupVersion > 1) {
    for (let from = 1; from < backupVersion; from += 1) {
      const readers = input.backupReaders;
      if (!isRecord(readers) || typeof readers[from] !== 'function') {
        report(
          sink,
          'invalid_entry',
          'backup',
          String(from),
          `version ${String(backupVersion)} of the backup needs a reader of version ${String(from)}: no file ever written stays unread`,
        );
      }
    }
  }
  if (typeof input.title !== 'string' || input.title.trim() === '') {
    report(
      sink,
      'invalid_entry',
      'title',
      '?',
      `the title is a working title, got ${describe(input.title)}`,
    );
  }
  const industries = checkParts(sink, 'industries', 'industry', input.industries);
  const modules = checkParts(sink, 'modules', 'module', input.modules);
  for (const industry of industries.filter((one) => modules.includes(one))) {
    report(
      sink,
      'duplicate_id',
      'industries',
      industry,
      `"${industry}" is the id of an industry and of a module`,
    );
  }
  checkTexts(sink, input);
  return sink;
}

/**
 * Declares an edition. Throws a `ManifestError` with the code of the first problem
 * (`editionInputProblems` lists them all); the result is checked and frozen. It is only data:
 * `composeEdition` puts the parts together and `startEdition` runs them on a storage.
 */
export function defineEdition(input: EditionInput): Edition {
  const problems = editionInputProblems(input);
  const [first] = problems;
  if (first !== undefined) {
    throw new ManifestError(
      first.code,
      `The edition is refused: ${problems.map((problem) => `${problem.part} ${problem.id}: ${problem.message}`).join('; ')}`,
      problems,
    );
  }
  return markMade(
    Object.freeze({
      kind: 'edition' as const,
      id: input.id,
      database: input.database,
      storagePrefix: input.storagePrefix,
      backupFormat: input.backupFormat,
      backupVersion: input.backupVersion,
      backupReaders: Object.freeze({ ...input.backupReaders }),
      title: input.title,
      industries: Object.freeze([...input.industries]),
      modules: Object.freeze([...(input.modules ?? [])]),
      texts: Object.freeze([...(input.texts ?? [])]),
      translations: Object.freeze({ ...input.translations }),
      lexicon: Object.freeze({ ...input.lexicon }),
    }),
  );
}

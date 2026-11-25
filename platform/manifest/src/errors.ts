/**
 * What is wrong with a manifest, as a code. A check returns these as data (`ManifestProblem`);
 * `defineModule`, `defineIndustry` and `defineEdition` throw a `ManifestError` with the code of
 * the first.
 *
 * - `invalid_entry`: something is not well formed: a field of the wrong type, a field the
 *   manifest does not have (a typo would drop a setting without a sound), a bad id, a table, an
 *   operation or an entry of a register that its own package refuses.
 * - `duplicate_id`: two entries of one list share an id.
 * - `wrong_namespace`: an id lies outside the namespace of its owner. An industry enters only
 *   what carries its own name (`<industry>_` for tables and events, `<industry>.` for the rest);
 *   a module of the platform enters nothing in the namespace of an industry.
 * - `unknown_reference`: an entry names a table or a kind its owner does not have.
 * - `missing_source`: a rule set without its source: law and guideline values come with a source
 *   or not at all.
 */
export const MANIFEST_PROBLEM_CODES = [
  'invalid_entry',
  'duplicate_id',
  'wrong_namespace',
  'unknown_reference',
  'missing_source',
] as const;
export type ManifestProblemCode = (typeof MANIFEST_PROBLEM_CODES)[number];

/** Which part of a manifest a problem is in. */
export type ManifestPart =
  | 'manifest'
  | 'id'
  | 'tables'
  | 'contract'
  | 'use_cases'
  | 'events'
  | 'catalog'
  | 'rights'
  | 'templates'
  | 'rule_sets'
  | 'demo'
  | 'migrations'
  | 'database'
  | 'storage_prefix'
  | 'backup'
  | 'title'
  | 'industries'
  | 'modules'
  | 'texts'
  | 'languages'
  | 'lexicon';

/** One thing that is wrong with a manifest. */
export interface ManifestProblem {
  code: ManifestProblemCode;
  part: ManifestPart;
  /** The id of the entry concerned; `?` where there is none. */
  id: string;
  /** For the person who fixes it: what is wrong and what is expected, in English. */
  message: string;
}

/**
 * Every error of a manifest carries a code, so callers never read the message. It is a mistake
 * of the program, not of the person: a manifest that was refused.
 */
export class ManifestError extends Error {
  readonly code: ManifestProblemCode;
  /** Every problem found: the first decides the code. */
  readonly problems: readonly ManifestProblem[];

  constructor(code: ManifestProblemCode, message: string, problems: readonly ManifestProblem[]) {
    super(message);
    this.name = 'ManifestError';
    this.code = code;
    this.problems = problems;
  }
}

/** The areas an edition is checked in, one per kind of thing that is put together. */
export const EDITION_PARTS = [
  'parts',
  'tables',
  'features',
  'rights',
  'contract',
  'access',
  'namespaces',
  'use_cases',
  'schemas',
  'texts',
  'lexicon',
] as const;
export type EditionPart = (typeof EDITION_PARTS)[number];

/**
 * One thing that is wrong with an edition that was put together. `code` is the code of the
 * package that found it (`duplicate_id` of the register of tables, `duplicate_operation` of the
 * contract, `unknown_reference` of the register of functions) or one of the codes of the
 * edition itself:
 *
 * - `duplicate_part`: two modules, two industries or a module and an industry share an id.
 * - `namespace_taken`: a module of the platform uses the namespace of an industry.
 * - `missing_use_case`, `extra_use_case`: a part has no use case for an operation of its contract,
 *   or one for an operation it does not have.
 * - `use_cases_failed`: building the use cases of a part threw.
 * - `missing_text`: a catalogue lacks a text the registers ask for.
 */
export interface EditionProblem {
  part: EditionPart;
  code: string;
  /** The id of the thing concerned: a part, an operation, a table, a key of a text. */
  id: string;
  /** For the person who fixes it, in English. */
  message: string;
}

/**
 * An edition that cannot be put together or started. The code is the code of the first problem
 * (see `EditionProblem`); `problems` lists them all.
 */
export class EditionError extends Error {
  readonly code: string;
  readonly problems: readonly EditionProblem[];

  constructor(message: string, problems: readonly EditionProblem[]) {
    super(message);
    this.name = 'EditionError';
    this.code = problems[0]?.code ?? 'invalid';
    this.problems = problems;
  }
}

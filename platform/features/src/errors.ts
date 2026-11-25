/**
 * What is wrong with the entries of a register, as a code. A check of entries returns these as
 * data (`FeatureProblem`); building a register throws a `FeatureError` with the code of the first.
 *
 * - `invalid_entry`: an entry is not well formed: a bad id, a field of the wrong type, a field the
 *   entry does not have, a list with a repeat, a mode that takes the reserved id.
 * - `duplicate_id`: two entries of one level share an id (levels: industry, group, feature, kind,
 *   question, device mode).
 * - `unknown_reference`: an entry names an industry, group, feature or kind that is not registered.
 * - `requires_cycle`: a feature needs itself, directly or through others.
 * - `wrong_namespace`: a feature does not carry the namespace of its group.
 * - `foreign_dependency`: an entry of an industry names something of another industry, or an entry
 *   of the platform names something of an industry.
 * - `invalid_core`: a core feature needs a feature that can be switched off, or an answer would
 *   switch off a core feature.
 * - `invalid_availability`: a feature carries a value of `availability` the register does not know.
 * - `invalid_option`: an option is malformed, or its default does not fit its type.
 */
export const FEATURE_PROBLEM_CODES = [
  'invalid_entry',
  'duplicate_id',
  'unknown_reference',
  'requires_cycle',
  'wrong_namespace',
  'foreign_dependency',
  'invalid_core',
  'invalid_availability',
  'invalid_option',
] as const;
export type FeatureProblemCode = (typeof FEATURE_PROBLEM_CODES)[number];

/** The levels of the register an entry can be on. */
export type EntryLevel = 'industry' | 'group' | 'feature' | 'kind' | 'question' | 'device_mode';

/** One thing that is wrong with the entries of a register. */
export interface FeatureProblem {
  code: FeatureProblemCode;
  level: EntryLevel;
  /** The id of the entry; `?` for an entry that has none. */
  id: string;
  /** For the person who fixes it: what is wrong and what is expected. */
  message: string;
}

/**
 * Every code of an error of the register: the problems above, and two that come when a register
 * is asked for something it must refuse.
 *
 * - `unknown_feature`: the register has no feature of this id.
 * - `core_feature`: a core feature was asked to be switched off; it is never switchable.
 */
export type FeatureErrorCode = FeatureProblemCode | 'unknown_feature' | 'core_feature';

/**
 * Every error of the register carries a code, so callers never read the message. These are
 * mistakes of the program, not of the person.
 */
export class FeatureError extends Error {
  readonly code: FeatureErrorCode;
  /** Every problem found, when entries were refused; empty for the other codes. */
  readonly problems: readonly FeatureProblem[];

  constructor(code: FeatureErrorCode, message: string, problems: readonly FeatureProblem[] = []) {
    super(message);
    this.name = 'FeatureError';
    this.code = code;
    this.problems = problems;
  }
}

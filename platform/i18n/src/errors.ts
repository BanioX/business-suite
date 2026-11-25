/**
 * What the program throws when a register of languages or a lexicon cannot be built, or a term
 * is asked for that no lexicon holds. Findings that a test wants to list come as data from the
 * `*Problems` functions instead; the build throws the first of them.
 */

export const I18N_ERROR_CODES = [
  'invalid_language',
  'duplicate_language',
  'invalid_term',
  'invalid_forms',
  'unknown_term',
  'missing_source',
  'conflict',
] as const;
export type I18nErrorCode = (typeof I18N_ERROR_CODES)[number];

export class I18nError extends Error {
  readonly code: I18nErrorCode;

  constructor(code: I18nErrorCode, message: string) {
    super(message);
    this.name = 'I18nError';
    this.code = code;
  }
}

import { I18nError } from './errors';

/**
 * The languages of an edition (suite ADR-0007). A language is a BCP 47 tag; the platform fixes
 * one, `de-CH`, the language every text is written in first and the one a missing text falls
 * back to. Which others an edition ships is the edition's decision, so the platform holds no
 * list of languages: `createLanguageRegistry` takes the tags the edition ships.
 *
 * The register is a value; it holds no «current language». Whoever needs a language (a person's
 * device, a document for a customer) asks with the language it has.
 */

/** The source language: it fixes the keys of every catalogue and stands in for every gap. */
export const SOURCE_LANGUAGE = 'de-CH';

/**
 * A tag in its written form: the language in lower case (`pt`), then optionally a script (`Latn`)
 * and a region (`CH`, `BR`, or three digits), joined by a hyphen. Longer tags are not needed for
 * the languages of the suite.
 */
export const LANGUAGE_TAG_PATTERN = /^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?$/;

export function isLanguageTag(value: unknown): value is string {
  return typeof value === 'string' && LANGUAGE_TAG_PATTERN.test(value);
}

/**
 * The tags a tag stands for, the closest first: `pt-BR` is `pt-BR`, then `pt`. The source language
 * is not part of the chain; it is where every chain ends (see `resolve` of the register).
 */
export function languageChain(tag: string): readonly string[] {
  const chain: string[] = [];
  for (let rest = tag; rest !== ''; rest = rest.slice(0, Math.max(rest.lastIndexOf('-'), 0))) {
    chain.push(rest);
  }
  return chain;
}

export const LANGUAGE_PROBLEM_CODES = ['invalid_language', 'duplicate_language'] as const;
export type LanguageProblemCode = (typeof LANGUAGE_PROBLEM_CODES)[number];

export interface LanguageProblem {
  code: LanguageProblemCode;
  /** The tag as it was given. */
  tag: string;
  message: string;
}

/**
 * What is wrong with a list of tags: one that is not in the written form, one that stands twice.
 * `de-CH` may be given or left out; it is in every register once.
 */
export function languageProblems(tags: readonly unknown[]): LanguageProblem[] {
  const problems: LanguageProblem[] = [];
  const seen = new Set<string>();
  for (const tag of tags) {
    if (!isLanguageTag(tag)) {
      problems.push({
        code: 'invalid_language',
        tag: String(tag),
        message: `${JSON.stringify(tag)} is not a language tag in the form of ${String(LANGUAGE_TAG_PATTERN)}.`,
      });
    } else if (seen.has(tag)) {
      problems.push({
        code: 'duplicate_language',
        tag,
        message: `The language ${tag} is entered twice.`,
      });
    } else {
      seen.add(tag);
    }
  }
  return problems;
}

export interface LanguageRegistry {
  /** The languages in order: `de-CH` first, then the others as they were given. */
  readonly tags: readonly string[];
  has(tag: string): boolean;
  /** The language of the register that stands for a tag, the closest one (`pt-BR` for `pt`); `undefined` if there is none. */
  match(tag: string): string | undefined;
  /** Like `match`, but `de-CH` where none fits: the language to use for a tag. */
  resolve(tag: string): string;
  /**
   * The first of the preferences that the register has a language for (a customer's language,
   * then the business's), `de-CH` if none. Preferences that are missing are skipped.
   */
  pick(preferences: readonly (string | undefined)[]): string;
}

/** The register of the languages an edition ships. Throws an `I18nError` with the code of the first problem. */
export function createLanguageRegistry(tags: readonly string[] = []): LanguageRegistry {
  const problem = languageProblems(tags)[0];
  if (problem !== undefined) {
    throw new I18nError(problem.code, problem.message);
  }
  const all = Object.freeze([SOURCE_LANGUAGE, ...tags.filter((tag) => tag !== SOURCE_LANGUAGE)]);
  const known: ReadonlySet<string> = new Set(all);
  const match = (tag: string) => languageChain(tag).find((candidate) => known.has(candidate));
  return Object.freeze({
    tags: all,
    has: (tag: string) => known.has(tag),
    match,
    resolve: (tag: string) => match(tag) ?? SOURCE_LANGUAGE,
    pick: (preferences: readonly (string | undefined)[]) => {
      for (const preference of preferences) {
        const found = preference === undefined ? undefined : match(preference);
        if (found !== undefined) {
          return found;
        }
      }
      return SOURCE_LANGUAGE;
    },
  });
}

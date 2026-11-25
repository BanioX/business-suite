import { I18nError, type I18nErrorCode } from './errors';
import { isLanguageTag, languageChain, SOURCE_LANGUAGE } from './languages';

/**
 * The lexicon of an edition (suite ADR-0007, 3): the words an industry calls a thing of the
 * platform by. The platform's texts say «Objekt»; an industry may call the same thing something
 * else in its own trade, and the edition puts the words of its industries together. Texts that
 * name the thing take the word from the lexicon.
 *
 * It is small on purpose, for words in headings and on buttons. A term has an id (`object`),
 * and for each language the two forms a sentence needs: one and many. Whole sentences, with
 * their articles and cases, an industry writes in its own catalogue.
 *
 * Which word counts, from the strongest: the edition's own, an industry's, the platform's. For a
 * language the lexicon looks in that order for a word in this language (`pt-BR`, then `pt`), and
 * only then for the German one: a word of an industry in German is a better answer in a language
 * without a word of its own than the platform's general word. Two industries that name the same
 * term differently in the same language have no right answer; the edition says which, with its
 * own entry.
 */

/** The forms of a word in one language. */
export interface TermForms {
  /** For one thing: «Objekt». */
  readonly one: string;
  /** For several: «Objekte». */
  readonly many: string;
}

/** Terms with their words: `{ <term>: { <language>: { one, many } } }`. */
export type TermEntries = Readonly<Record<string, Readonly<Record<string, TermForms>>>>;

/** The words an industry gives to terms of the platform. */
export interface IndustryTerms {
  /** The id of the industry, for the problems. */
  readonly industry: string;
  readonly terms: TermEntries;
}

export interface LexiconInput<TBase extends TermEntries = TermEntries> {
  /** The platform's terms. Each has a word in de-CH. */
  readonly base: TBase;
  /** The words of the industries of the edition; only terms of `base` can be renamed. */
  readonly industries?: readonly IndustryTerms[];
  /** The edition's own words: the strongest, and the answer to a conflict between industries. */
  readonly edition?: TermEntries;
}

/** The form of the id of a term: lower-case words joined by single underscores. */
export const TERM_ID_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

export const LEXICON_PROBLEM_CODES = [
  'invalid_term',
  'invalid_language',
  'invalid_forms',
  'unknown_term',
  'missing_source',
  'conflict',
] as const;
export type LexiconProblemCode = (typeof LEXICON_PROBLEM_CODES)[number];

export interface LexiconProblem {
  code: LexiconProblemCode;
  /** Whose entry it is: `base`, `edition` or the id of an industry. */
  from: string;
  term: string;
  language?: string;
  message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFilled(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * What is wrong with the entries, without building anything: every problem as data, and none
 * thrown. An id that is not well formed, a tag that is not a language, forms that are not two
 * texts that say something, a term of the base without a word in de-CH, a term of an industry
 * or of the edition that the base does not have, and two industries that give the same term
 * different words in the same language (unless the edition names it itself).
 */
export function lexiconProblems(input: LexiconInput): LexiconProblem[] {
  const problems: LexiconProblem[] = [];
  const report = (
    code: LexiconProblemCode,
    from: string,
    term: string,
    message: string,
    language?: string,
  ) =>
    problems.push({ code, from, term, message, ...(language === undefined ? {} : { language }) });

  const checkEntries = (from: string, entries: unknown, isBase: boolean) => {
    if (!isRecord(entries)) {
      report('invalid_term', from, '', 'The terms are not a record of terms.');
      return;
    }
    for (const [term, languages] of Object.entries(entries)) {
      if (!TERM_ID_PATTERN.test(term)) {
        report('invalid_term', from, term, `${JSON.stringify(term)} is not the id of a term.`);
        continue;
      }
      if (!isBase && !Object.hasOwn(input.base, term)) {
        report('unknown_term', from, term, `The platform has no term ${term} to rename.`);
        continue;
      }
      if (!isRecord(languages)) {
        report('invalid_forms', from, term, `The words of ${term} are not a record by language.`);
        continue;
      }
      if (isBase && !Object.hasOwn(languages, SOURCE_LANGUAGE)) {
        report('missing_source', from, term, `${term} has no word in ${SOURCE_LANGUAGE}.`);
      }
      for (const [language, forms] of Object.entries(languages)) {
        if (!isLanguageTag(language)) {
          report(
            'invalid_language',
            from,
            term,
            `${JSON.stringify(language)} is no language tag.`,
            language,
          );
        } else if (!isRecord(forms) || !isFilled(forms.one) || !isFilled(forms.many)) {
          report(
            'invalid_forms',
            from,
            term,
            `${term} in ${language} needs the forms one and many, both with a text.`,
            language,
          );
        }
      }
    }
  };

  checkEntries('base', input.base, true);
  for (const { industry, terms } of input.industries ?? []) {
    checkEntries(industry, terms, false);
  }
  if (input.edition !== undefined) {
    checkEntries('edition', input.edition, false);
  }

  // Conflicts: two industries, one term, one language, different words, and no word of the edition.
  const wording = new Map<string, { from: string; forms: string }>();
  const reported = new Set<string>();
  for (const { industry, terms } of input.industries ?? []) {
    if (!isRecord(terms)) {
      continue;
    }
    for (const [term, languages] of Object.entries(terms)) {
      if (!isRecord(languages)) {
        continue;
      }
      for (const [language, forms] of Object.entries(languages)) {
        if (!isRecord(forms) || !isFilled(forms.one) || !isFilled(forms.many)) {
          continue;
        }
        const key = `${term} ${language}`;
        const text = `${forms.one}|${forms.many}`;
        const before = wording.get(key);
        const answered =
          input.edition !== undefined &&
          Object.hasOwn(input.edition, term) &&
          Object.hasOwn(input.edition[term] ?? {}, language);
        if (before === undefined) {
          wording.set(key, { from: industry, forms: text });
        } else if (before.forms !== text && !answered && !reported.has(key)) {
          reported.add(key);
          report(
            'conflict',
            industry,
            term,
            `${before.from} and ${industry} give ${term} different words in ${language}: the edition names the word itself.`,
            language,
          );
        }
      }
    }
  }
  return problems;
}

/** The words of a language, for the texts that name things. */
export interface Terms<TTerm extends string = string> {
  one(term: TTerm): string;
  many(term: TTerm): string;
}

export interface Lexicon<TTerm extends string = string> {
  /** The ids of the terms of the platform. */
  readonly terms: readonly TTerm[];
  /** The forms of a term in a language, with the fall-back described above. Throws `unknown_term`. */
  forms(term: TTerm, language: string): TermForms;
  /** The words of one language, so a text takes `terms.one('object')` and need not repeat the language. */
  forLanguage(language: string): Terms<TTerm>;
}

function frozenTerms(entries: TermEntries): TermEntries {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(entries).map(([term, languages]) => [
        term,
        Object.freeze(
          Object.fromEntries(
            Object.entries(languages).map(([language, forms]) => [
              language,
              Object.freeze({ one: forms.one, many: forms.many }),
            ]),
          ),
        ),
      ]),
    ),
  );
}
/**
 * The lexicon of an edition. Throws an `I18nError` with the code of the first problem of
 * `lexiconProblems`. It is a value: the language is always an argument, and nothing is global.
 */
export function createLexicon<const TBase extends TermEntries>(
  input: LexiconInput<TBase>,
): Lexicon<Extract<keyof TBase, string>> {
  const problem = lexiconProblems(input)[0];
  if (problem !== undefined) {
    throw new I18nError(problem.code as I18nErrorCode, problem.message);
  }
  // A copy that nobody can change afterwards; the strongest layer first.
  const base = frozenTerms(input.base);
  const layers: TermEntries[] = [
    ...(input.edition === undefined ? [] : [frozenTerms(input.edition)]),
    ...(input.industries ?? []).map((entry) => frozenTerms(entry.terms)),
    base,
  ];
  const terms = Object.freeze(Object.keys(base) as Extract<keyof TBase, string>[]);

  const forms = (term: string, language: string): TermForms => {
    if (!Object.hasOwn(base, term)) {
      throw new I18nError('unknown_term', `The lexicon has no term ${JSON.stringify(term)}.`);
    }
    for (const tag of [...languageChain(language), SOURCE_LANGUAGE]) {
      for (const layer of layers) {
        const found = Object.hasOwn(layer, term) ? layer[term]?.[tag] : undefined;
        if (found !== undefined) {
          return { one: found.one, many: found.many };
        }
      }
    }
    // The base has a word in de-CH for every term: checked above.
    throw new I18nError('missing_source', `${term} has no word in ${SOURCE_LANGUAGE}.`);
  };

  return Object.freeze({
    terms,
    forms,
    forLanguage: (language: string) =>
      Object.freeze({
        one: (term: string) => forms(term, language).one,
        many: (term: string) => forms(term, language).many,
      }),
  });
}

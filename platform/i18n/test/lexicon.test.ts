import { describe, expect, it } from 'vitest';
import {
  createLexicon,
  I18nError,
  lexiconProblems,
  LEXICON_PROBLEM_CODES,
  platformTerms,
  TERM_ID_PATTERN,
  type LexiconInput,
  type TermEntries,
} from '../src';

/** Made-up industries and words: the platform names no trade. */
const BASE = {
  object: { 'de-CH': { one: 'Objekt', many: 'Objekte' }, pt: { one: 'Objeto', many: 'Objetos' } },
  contact: { 'de-CH': { one: 'Kontakt', many: 'Kontakte' } },
} as const satisfies TermEntries;

const SITE = {
  industry: 'alpha',
  terms: { object: { 'de-CH': { one: 'Standort', many: 'Standorte' } } },
};
const PLACE = {
  industry: 'beta',
  terms: { object: { 'de-CH': { one: 'Einsatzort', many: 'Einsatzorte' } } },
};

const codes = (input: LexiconInput) => lexiconProblems(input).map((problem) => problem.code);

describe('createLexicon', () => {
  it('gives the word of the platform where nobody renames the term', () => {
    const lexicon = createLexicon({ base: BASE });
    expect(lexicon.forms('object', 'de-CH')).toEqual({ one: 'Objekt', many: 'Objekte' });
    expect(lexicon.terms).toEqual(['object', 'contact']);
  });

  it('gives the word of the industry where it renames the term', () => {
    const lexicon = createLexicon({ base: BASE, industries: [SITE] });
    expect(lexicon.forms('object', 'de-CH')).toEqual({ one: 'Standort', many: 'Standorte' });
    expect(lexicon.forms('contact', 'de-CH')).toEqual({ one: 'Kontakt', many: 'Kontakte' });
  });

  it('puts the words of the edition over those of the industries, and the industries over the platform', () => {
    const edition = { object: { 'de-CH': { one: 'Platz', many: 'Plätze' } } };
    expect(
      createLexicon({ base: BASE, industries: [SITE], edition }).forms('object', 'de-CH').one,
    ).toBe('Platz');
    expect(createLexicon({ base: BASE, industries: [SITE] }).forms('object', 'de-CH').one).toBe(
      'Standort',
    );
  });

  it('lets the edition answer a conflict between two industries', () => {
    const edition = { object: { 'de-CH': { one: 'Ort', many: 'Orte' } } };
    const lexicon = createLexicon({ base: BASE, industries: [SITE, PLACE], edition });
    expect(lexicon.forms('object', 'de-CH').one).toBe('Ort');
  });

  it('looks for a word in the language first, then in German: the platform word in the language before the industry word in German is not used', () => {
    const lexicon = createLexicon({ base: BASE, industries: [SITE] });
    // The platform has a Portuguese word, the industry only a German one: the Portuguese stays.
    expect(lexicon.forms('object', 'pt')).toEqual({ one: 'Objeto', many: 'Objetos' });
    // A language nobody has a word in gets the German word of the strongest layer.
    expect(lexicon.forms('object', 'es')).toEqual({ one: 'Standort', many: 'Standorte' });
  });

  it('finds a word for a region through its language', () => {
    const lexicon = createLexicon({ base: BASE });
    expect(lexicon.forms('object', 'pt-BR').one).toBe('Objeto');
  });

  it('prefers the strongest layer inside one language', () => {
    const edition = { object: { pt: { one: 'Local', many: 'Locais' } } };
    expect(createLexicon({ base: BASE, edition }).forms('object', 'pt').one).toBe('Local');
  });

  it('binds a language, so a text takes the word and not the language', () => {
    const terms = createLexicon({ base: BASE, industries: [SITE] }).forLanguage('de-CH');
    const empty = (many: string) => `Noch keine ${many} angelegt.`;
    expect(empty(terms.many('object'))).toBe('Noch keine Standorte angelegt.');
    expect(terms.one('object')).toBe('Standort');
  });

  it('holds no current language: two languages at the same time answer each their own', () => {
    const lexicon = createLexicon({ base: BASE });
    const german = lexicon.forLanguage('de-CH');
    const portuguese = lexicon.forLanguage('pt');
    expect([german.one('object'), portuguese.one('object'), german.one('object')]).toEqual([
      'Objekt',
      'Objeto',
      'Objekt',
    ]);
  });

  it('throws unknown_term for a term the platform does not have', () => {
    const lexicon = createLexicon({ base: BASE });
    expect(() => lexicon.forms('nothing' as 'object', 'de-CH')).toThrow(I18nError);
    expect(() => lexicon.forLanguage('de-CH').one('nothing' as 'object')).toThrow(
      'The lexicon has no term "nothing".',
    );
    try {
      lexicon.forms('toString' as 'object', 'de-CH');
      expect.unreachable();
    } catch (error) {
      expect((error as I18nError).code).toBe('unknown_term');
    }
  });

  it('throws with the code of the first problem', () => {
    try {
      createLexicon({ base: BASE, industries: [{ industry: 'x', terms: { unknown: {} } }] });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(I18nError);
      expect((error as I18nError).code).toBe('unknown_term');
    }
    expect(() => createLexicon({ base: BASE, industries: [SITE, PLACE] })).toThrow(
      /different words/,
    );
  });

  it('is frozen, and a copy: changing the entries afterwards changes nothing', () => {
    const base = structuredClone(BASE) as unknown as Record<
      string,
      Record<string, { one: string; many: string }>
    >;
    const lexicon = createLexicon({ base });
    expect(Object.isFrozen(lexicon)).toBe(true);
    expect(Object.isFrozen(lexicon.terms)).toBe(true);
    const forms = base.object?.['de-CH'];
    if (forms !== undefined) {
      forms.one = 'Geändert';
    }
    delete base.contact;
    expect(lexicon.forms('object', 'de-CH').one).toBe('Objekt');
    expect(lexicon.terms).toEqual(['object', 'contact']);
  });

  it('returns a copy of the forms: changing it changes nothing in the lexicon', () => {
    const lexicon = createLexicon({ base: BASE });
    const forms = lexicon.forms('object', 'de-CH') as { one: string; many: string };
    forms.one = 'x';
    expect(lexicon.forms('object', 'de-CH').one).toBe('Objekt');
  });

  it('knows the term of the platform in the catalogue file', () => {
    const lexicon = createLexicon({ base: platformTerms });
    expect(lexicon.terms).toEqual(['object']);
    expect(lexicon.forms('object', 'de-CH')).toEqual({ one: 'Objekt', many: 'Objekte' });
  });
});

describe('lexiconProblems', () => {
  it('finds nothing in good entries, and none in the entries of the platform', () => {
    expect(lexiconProblems({ base: BASE, industries: [SITE] })).toEqual([]);
    expect(lexiconProblems({ base: platformTerms })).toEqual([]);
  });

  it('knows exactly the problems it names', () => {
    expect([...LEXICON_PROBLEM_CODES]).toEqual([
      'invalid_term',
      'invalid_language',
      'invalid_forms',
      'unknown_term',
      'missing_source',
      'conflict',
    ]);
  });

  it('finds an id that is no id of a term', () => {
    expect(codes({ base: { Object: { 'de-CH': { one: 'a', many: 'b' } } } })).toEqual([
      'invalid_term',
    ]);
    expect(TERM_ID_PATTERN.test('object')).toBe(true);
    expect(TERM_ID_PATTERN.test('first_name')).toBe(true);
    expect(TERM_ID_PATTERN.test('first__name')).toBe(false);
    expect(TERM_ID_PATTERN.test('_x')).toBe(false);
  });

  it('finds a term of the platform without a German word', () => {
    const problems = lexiconProblems({
      base: { object: { pt: { one: 'Objeto', many: 'Objetos' } } },
    });
    expect(problems).toEqual([
      expect.objectContaining({ code: 'missing_source', from: 'base', term: 'object' }),
    ]);
  });

  it('finds a tag that is no language', () => {
    expect(
      lexiconProblems({
        base: { object: { 'de-CH': { one: 'a', many: 'b' }, PT: { one: 'a', many: 'b' } } },
      }),
    ).toEqual([expect.objectContaining({ code: 'invalid_language', language: 'PT' })]);
  });

  it('finds forms that are not two filled texts', () => {
    for (const forms of [
      { one: 'a' },
      { one: 'a', many: '' },
      { one: ' ', many: 'b' },
      'a',
      null,
      { one: 1, many: 'b' },
    ]) {
      const problems = lexiconProblems({
        base: { object: { 'de-CH': forms as never } },
      });
      expect(
        problems.map((problem) => problem.code),
        JSON.stringify(forms),
      ).toEqual(['invalid_forms']);
    }
  });

  it('finds words of a term that is no record by language', () => {
    expect(codes({ base: { object: 'Objekt' as never } })).toEqual(['invalid_forms']);
  });

  it('finds terms that are no record of terms, for the platform, an industry and the edition', () => {
    expect(codes({ base: 5 as never })).toEqual(['invalid_term']);
    expect(codes({ base: BASE, industries: [{ industry: 'x', terms: 'no' as never }] })).toEqual([
      'invalid_term',
    ]);
    expect(codes({ base: BASE, edition: [] as never })).toEqual(['invalid_term']);
  });

  it('finds a term that the platform does not have, for an industry and for the edition', () => {
    const problems = lexiconProblems({
      base: BASE,
      industries: [
        { industry: 'alpha', terms: { room: { 'de-CH': { one: 'Zimmer', many: 'Zimmer' } } } },
      ],
      edition: { place: { 'de-CH': { one: 'Platz', many: 'Plätze' } } },
    });
    expect(problems.map(({ code, from, term }) => [code, from, term])).toEqual([
      ['unknown_term', 'alpha', 'room'],
      ['unknown_term', 'edition', 'place'],
    ]);
  });

  it('does not ask an industry for a German word: it may rename a term in one language only', () => {
    expect(
      lexiconProblems({
        base: BASE,
        industries: [
          { industry: 'alpha', terms: { object: { pt: { one: 'Local', many: 'Locais' } } } },
        ],
      }),
    ).toEqual([]);
  });

  it('finds two industries that name a term differently in one language', () => {
    expect(lexiconProblems({ base: BASE, industries: [SITE, PLACE] })).toEqual([
      expect.objectContaining({
        code: 'conflict',
        from: 'beta',
        term: 'object',
        language: 'de-CH',
        message:
          'alpha and beta give object different words in de-CH: the edition names the word itself.',
      }),
    ]);
  });

  it('finds no conflict where two industries agree, or speak of different languages or terms', () => {
    expect(
      lexiconProblems({ base: BASE, industries: [SITE, { industry: 'beta', terms: SITE.terms }] }),
    ).toEqual([]);
    expect(
      lexiconProblems({
        base: BASE,
        industries: [
          SITE,
          { industry: 'beta', terms: { object: { pt: { one: 'Local', many: 'Locais' } } } },
          {
            industry: 'gamma',
            terms: { contact: { 'de-CH': { one: 'Ansprechperson', many: 'Ansprechpersonen' } } },
          },
        ],
      }),
    ).toEqual([]);
  });

  it('finds no conflict where the edition names the word in that language, and one where it names another', () => {
    const edition = { object: { 'de-CH': { one: 'Ort', many: 'Orte' } } };
    expect(lexiconProblems({ base: BASE, industries: [SITE, PLACE], edition })).toEqual([]);
    const other = { object: { pt: { one: 'Local', many: 'Locais' } } };
    expect(codes({ base: BASE, industries: [SITE, PLACE], edition: other })).toEqual(['conflict']);
  });

  it('names a conflict once, however many industries take part', () => {
    const third = {
      industry: 'gamma',
      terms: { object: { 'de-CH': { one: 'Platz', many: 'Plätze' } } },
    };
    expect(codes({ base: BASE, industries: [SITE, PLACE, third] })).toEqual(['conflict']);
  });

  it('does not take malformed words for a conflict: they are their own problem', () => {
    const broken = { industry: 'beta', terms: { object: { 'de-CH': { one: '', many: '' } } } };
    expect(codes({ base: BASE, industries: [SITE, broken] })).toEqual(['invalid_forms']);
    const noRecord = { industry: 'gamma', terms: { object: 'x' as never } };
    expect(codes({ base: BASE, industries: [SITE, noRecord] })).toEqual(['invalid_forms']);
  });

  it('changes nothing it is given', () => {
    const input = structuredClone({ base: BASE, industries: [SITE, PLACE] });
    lexiconProblems(input);
    expect(input).toEqual(structuredClone({ base: BASE, industries: [SITE, PLACE] }));
  });
});

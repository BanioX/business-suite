import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  createLanguageRegistry,
  I18nError,
  isLanguageTag,
  languageChain,
  languageProblems,
  LANGUAGE_TAG_PATTERN,
  SOURCE_LANGUAGE,
} from '../src';

describe('language tags', () => {
  it('knows de-CH as the source', () => {
    expect(SOURCE_LANGUAGE).toBe('de-CH');
  });

  it.each([
    'de-CH',
    'pt',
    'pt-BR',
    'fr-CH',
    'it-CH',
    'ta',
    'es-419',
    'zh-Hant',
    'zh-Hant-TW',
    'fil',
  ])('accepts %s', (tag) => {
    expect(isLanguageTag(tag)).toBe(true);
  });

  it.each([
    '',
    'de_CH',
    'DE-ch',
    'de-ch',
    'de-',
    '-CH',
    'portuguese',
    'p',
    'de-CH-1996',
    'de CH',
    'de-CH\n',
  ])('rejects %j', (tag) => {
    expect(isLanguageTag(tag)).toBe(false);
  });

  it('rejects what is no text', () => {
    for (const value of [undefined, null, 1, {}, ['de-CH']]) {
      expect(isLanguageTag(value)).toBe(false);
    }
  });

  it('has no flag that makes the pattern remember between calls', () => {
    expect(LANGUAGE_TAG_PATTERN.global).toBe(false);
    expect(LANGUAGE_TAG_PATTERN.sticky).toBe(false);
  });

  it('gives the chain from the closest tag to the language alone', () => {
    expect(languageChain('pt-BR')).toEqual(['pt-BR', 'pt']);
    expect(languageChain('zh-Hant-TW')).toEqual(['zh-Hant-TW', 'zh-Hant', 'zh']);
    expect(languageChain('pt')).toEqual(['pt']);
    expect(languageChain('')).toEqual([]);
  });

  it('ends every chain of a well-formed tag in its language, and has no more than three tags', () => {
    const tag = fc
      .tuple(
        fc.stringMatching(/^[a-z]{2,3}$/),
        fc.option(fc.stringMatching(/^[A-Z][a-z]{3}$/), { nil: undefined }),
        fc.option(fc.stringMatching(/^[A-Z]{2}$/), { nil: undefined }),
      )
      .map((parts) => parts.filter((part) => part !== undefined).join('-'));
    fc.assert(
      fc.property(tag, (value) => {
        const chain = languageChain(value);
        expect(isLanguageTag(value)).toBe(true);
        expect(chain[0]).toBe(value);
        expect(chain.length).toBeLessThanOrEqual(3);
        expect(chain.at(-1)).toBe(value.split('-')[0]);
      }),
    );
  });
});

describe('languageProblems', () => {
  it('finds nothing in a good list, with or without de-CH', () => {
    expect(languageProblems([])).toEqual([]);
    expect(languageProblems(['de-CH', 'pt', 'fr-CH'])).toEqual([]);
  });

  it('finds a tag that is no tag and a tag that stands twice, all at once', () => {
    const problems = languageProblems(['pt', 'PT', 'pt', 7]);
    expect(problems.map(({ code, tag }) => [code, tag])).toEqual([
      ['invalid_language', 'PT'],
      ['duplicate_language', 'pt'],
      ['invalid_language', '7'],
    ]);
    expect(problems[0]?.message).toContain('"PT"');
    expect(problems[1]?.message).toBe('The language pt is entered twice.');
  });
});

describe('createLanguageRegistry', () => {
  it('always has de-CH, first, once', () => {
    expect(createLanguageRegistry().tags).toEqual(['de-CH']);
    expect(createLanguageRegistry(['pt', 'de-CH', 'it-CH']).tags).toEqual(['de-CH', 'pt', 'it-CH']);
  });

  it('is frozen', () => {
    const registry = createLanguageRegistry(['pt']);
    expect(Object.isFrozen(registry)).toBe(true);
    expect(Object.isFrozen(registry.tags)).toBe(true);
  });

  it('holds no list of languages of its own: only what the edition enters', () => {
    expect(createLanguageRegistry().has('pt')).toBe(false);
    expect(createLanguageRegistry(['pt']).has('pt')).toBe(true);
  });

  it('throws with the code of the first problem', () => {
    expect(() => createLanguageRegistry(['pt_BR'])).toThrow(I18nError);
    try {
      createLanguageRegistry(['pt', 'pt']);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(I18nError);
      expect((error as I18nError).code).toBe('duplicate_language');
      expect((error as I18nError).name).toBe('I18nError');
    }
  });

  it('does not change the list it is given', () => {
    const tags = ['pt', 'it-CH'];
    createLanguageRegistry(tags);
    expect(tags).toEqual(['pt', 'it-CH']);
  });

  describe('match and resolve', () => {
    const registry = createLanguageRegistry(['pt', 'fr-CH']);

    it('finds the closest language the register has', () => {
      expect(registry.match('pt')).toBe('pt');
      expect(registry.match('pt-BR')).toBe('pt');
      expect(registry.match('fr-CH')).toBe('fr-CH');
      expect(registry.match('de-CH')).toBe('de-CH');
    });

    it('does not find a language that is not there, and does not guess across regions', () => {
      expect(registry.match('it')).toBeUndefined();
      expect(registry.match('fr')).toBeUndefined();
      expect(registry.match('fr-FR')).toBeUndefined();
      expect(registry.match('de-DE')).toBeUndefined();
      expect(registry.match('nonsense_tag')).toBeUndefined();
    });

    it('falls back to de-CH where nothing fits', () => {
      expect(registry.resolve('it')).toBe('de-CH');
      expect(registry.resolve('')).toBe('de-CH');
      expect(registry.resolve('pt-BR')).toBe('pt');
    });
  });

  describe('pick', () => {
    const registry = createLanguageRegistry(['pt', 'it-CH']);

    it('takes the first preference the register has a language for', () => {
      expect(registry.pick(['pt', 'it-CH'])).toBe('pt');
      expect(registry.pick(['es', 'it-CH'])).toBe('it-CH');
      expect(registry.pick([undefined, 'pt-BR'])).toBe('pt');
    });

    it('takes de-CH where no preference fits, or none is given', () => {
      expect(registry.pick(['es', 'tr'])).toBe('de-CH');
      expect(registry.pick([])).toBe('de-CH');
      expect(registry.pick([undefined])).toBe('de-CH');
    });

    it('honours a preference for de-CH itself', () => {
      expect(registry.pick(['de-CH', 'pt'])).toBe('de-CH');
    });
  });
});

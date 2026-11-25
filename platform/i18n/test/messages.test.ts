import { ACCESS_LEVELS, PLATFORM_ERROR_CODES } from '@onestrand/contract';
import { createRightRegistry, PROFILE_TYPES } from '@onestrand/access';
import {
  BUSINESS_ERROR_CODES,
  businessFeatureEntries,
  businessRightEntries,
  CANTONS,
  VAT_METHODS,
} from '@onestrand/business';
import { createFeatureRegistry, EXTENTS } from '@onestrand/features';
import { catalogueTexts, DE_CH_TEXT_RULES, textProblems, type TextRule } from '@onestrand/testing';
import { describe, expect, it } from 'vitest';
import {
  catalogueGaps,
  codeTexts,
  createCatalogueSet,
  createLexicon,
  defineTranslation,
  lexiconProblems,
  messages,
  missingTexts,
  platformTerms,
  registerTexts,
  resolveCatalogue,
} from '../src';

/**
 * The standard test of the texts of the platform. It stands here, with the catalogue it reads.
 * The platform names no product: a name of an edition is found by the guard over `platform/`
 * (it reads this catalogue too); the list below only shows the rule at work.
 */
const FEATURES = createFeatureRegistry(businessFeatureEntries);
const RIGHTS = createRightRegistry(FEATURES, businessRightEntries);

/** The rules of each language. A language without an entry has none yet, and no test may pass for it. */
const TEXT_RULES: Readonly<Record<string, readonly TextRule[]>> = { 'de-CH': DE_CH_TEXT_RULES };

/** The translations of the platform: the files `messages.<language>.ts`, once there are some. */
const TRANSLATIONS: Readonly<Record<string, unknown>> = {};

/** The languages whose catalogue must have no gap; the others are listed, and the test stays green. */
const COMPLETE: readonly string[] = [];

const everyText = { messages, platformTerms };

describe('the texts of the platform in de-CH', () => {
  it('follow the rules of the language: du, ss, no exclamation marks, no slogans, no emoji', () => {
    expect(textProblems(everyText, { rules: DE_CH_TEXT_RULES })).toEqual([]);
  });

  it('name no product', () => {
    expect(textProblems(everyText, { productNames: ['Beispielprodukt', 'Muster-App'] })).toEqual(
      [],
    );
  });

  it('are read as many as there are texts, so the test is not blind', () => {
    const leaves = (value: unknown): number =>
      typeof value === 'string'
        ? 1
        : Object.values(value as object).reduce<number>((sum, child) => sum + leaves(child), 0);
    expect(catalogueTexts(everyText)).toHaveLength(leaves(everyText));
    expect(catalogueTexts(everyText).length).toBeGreaterThan(50);
    expect(catalogueTexts(everyText).every((text) => text.from === 'string')).toBe(true);
  });

  it('would be caught by the rules: a text that breaks them is found', () => {
    const broken = { a: 'Speichern!', b: 'Ihr Betrieb', c: 'Straße', d: '' };
    expect(
      textProblems(broken)
        .map((problem) => problem.rule)
        .sort(),
    ).toEqual(['empty', 'eszett', 'exclamation', 'plural_address']);
  });

  it('have no empty text and no text of only spaces', () => {
    expect(catalogueTexts(everyText).filter((text) => text.text.trim() === '')).toEqual([]);
  });

  it('write «Inhaber:in» with the inclusive spelling of the suite', () => {
    expect(messages.profiles.owner).toBe('Inhaber:in');
  });
});

describe('the texts of the platform for the packages that have none', () => {
  it('has a name and a sentence for each function, module and delicate right of the registers', () => {
    const required = registerTexts({ features: FEATURES, rights: RIGHTS });
    expect(required.map(({ keys }) => keys.join('/'))).toEqual([
      'modules/business/name',
      'modules/business/summary',
      'features/business/name',
      'features/business/summary',
      'deviceModes/normal',
      'rights/people_roles/name',
      'rights/people_roles/summary',
      'rights/settings/name',
      'rights/settings/summary',
    ]);
    expect(missingTexts(messages, required)).toEqual([]);
  });

  it('has a word for each extent and for the choice of the person, a word for each level and for none', () => {
    expect(missingTexts(messages, codeTexts('extents', [...EXTENTS, 'custom']))).toEqual([]);
    expect(missingTexts(messages, codeTexts('levels', ['none', ...ACCESS_LEVELS]))).toEqual([]);
    expect(Object.keys(messages.extents)).toEqual([...EXTENTS, 'custom']);
    expect(Object.keys(messages.levels)).toEqual(['none', ...ACCESS_LEVELS]);
  });

  it('has the word «Inhaber:in» for the one fixed profile', () => {
    expect(PROFILE_TYPES).toContain('owner');
    expect(missingTexts(messages, codeTexts('profiles', ['owner']))).toEqual([]);
    expect(Object.keys(messages.profiles)).toEqual(['owner']);
  });

  it('has a word for each method of VAT and each canton, and no number in them', () => {
    expect(missingTexts(messages, codeTexts('vatMethods', VAT_METHODS))).toEqual([]);
    expect(missingTexts(messages, codeTexts('cantons', CANTONS))).toEqual([]);
    expect(Object.keys(messages.vatMethods)).toEqual([...VAT_METHODS]);
    expect(Object.keys(messages.cantons).sort()).toEqual([...CANTONS].sort());
    expect(Object.keys(messages.cantons)).toHaveLength(26);
    for (const word of [
      ...Object.values(messages.vatMethods),
      ...Object.values(messages.cantons),
    ]) {
      expect(word).not.toMatch(/\d/);
    }
  });

  it('has a sentence for each code of an error of the platform and of the business', () => {
    const codes = [...PLATFORM_ERROR_CODES, ...BUSINESS_ERROR_CODES];
    expect(missingTexts(messages, codeTexts('errors', codes))).toEqual([]);
    expect(Object.keys(messages.errors).sort()).toEqual([...codes].sort());
    expect(messages.errors.forbidden).not.toBe('');
  });

  it('has the one word of the lexicon of the platform, valid, with the forms one and many', () => {
    expect(lexiconProblems({ base: platformTerms })).toEqual([]);
    expect(createLexicon({ base: platformTerms }).forms('object', 'de-CH')).toEqual({
      one: 'Objekt',
      many: 'Objekte',
    });
  });

  it('say nothing in the text of a section for options, kinds or questions: the platform has none', () => {
    expect(Object.keys(messages)).not.toContain('options');
    expect(Object.keys(messages)).not.toContain('kinds');
    expect(Object.keys(messages)).not.toContain('questions');
  });
});

describe('the translations of the platform', () => {
  it('have rules for their language, or no test passes for them', () => {
    for (const language of Object.keys(TRANSLATIONS)) {
      expect(TEXT_RULES[language], `no rules for ${language}`).toBeDefined();
    }
  });

  it('are listed with every gap, and are complete where the test says so', () => {
    for (const language of Object.keys(TRANSLATIONS)) {
      const gaps = catalogueGaps(messages, TRANSLATIONS[language], language);
      if (COMPLETE.includes(language)) {
        expect(gaps).toEqual([]);
      }
    }
  });
});

describe('the acceptance of the order: a catalogue with a missing key of a language', () => {
  const missingOne = defineTranslation(messages, {
    levels: { view: '[pt] view', operate: '[pt] operate', manage: '[pt] manage' },
    profiles: { owner: '[pt] owner' },
  });

  it('falls back to German, and the text test lists the gap', () => {
    const portuguese = resolveCatalogue(messages, missingOne);
    expect(portuguese.levels.view).toBe('[pt] view');
    expect(portuguese.levels.none).toBe('Kein Zugriff');

    const gaps = catalogueGaps(messages, missingOne, 'pt');
    expect(gaps).toContainEqual(
      expect.objectContaining({ rule: 'missing', path: 'levels.none', language: 'pt' }),
    );
    expect(gaps.filter((gap) => gap.path.startsWith('levels'))).toHaveLength(1);
  });

  it('is the whole catalogue in every key, from the platform catalogue', () => {
    const resolved = resolveCatalogue(messages, missingOne);
    expect(catalogueGaps(messages, resolved, 'pt')).toEqual([]);
    expect(missingTexts(resolved, registerTexts({ features: FEATURES, rights: RIGHTS }))).toEqual(
      [],
    );
  });

  it('can be offered through a set of catalogues, in the language asked for', () => {
    const set = createCatalogueSet(messages, { pt: missingOne });
    expect(set.forLanguage('pt').levels.none).toBe('Kein Zugriff');
    expect(set.forLanguage('pt').levels.view).toBe('[pt] view');
    expect(set.forLanguage('de-CH').levels.view).toBe('Sehen');
  });

  it('lists every key of the platform for a language without a file', () => {
    const gaps = catalogueGaps(messages, undefined, 'pt');
    expect(gaps.length).toBe(catalogueTexts(messages).length);
    expect(gaps.every((gap) => gap.rule === 'missing')).toBe(true);
  });
});

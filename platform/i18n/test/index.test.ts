import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as i18n from '../src';

/**
 * The public surface, name by name. Every edition and every package with a screen builds on it:
 * a name that disappears or appears here is a decision, not an accident. Types are not listed;
 * `tsc` guards them where they are used.
 */
describe('@onestrand/i18n', () => {
  it('exports exactly these values', () => {
    expect(Object.keys(i18n).sort()).toEqual(
      [
        // errors
        'I18N_ERROR_CODES',
        'I18nError',
        // languages
        'SOURCE_LANGUAGE',
        'LANGUAGE_TAG_PATTERN',
        'LANGUAGE_PROBLEM_CODES',
        'isLanguageTag',
        'languageChain',
        'languageProblems',
        'createLanguageRegistry',
        // catalogues
        'GAP_RULES',
        'defineTranslation',
        'resolveCatalogue',
        'catalogueGaps',
        'mergeCatalogues',
        'createCatalogueSet',
        // keys of the registers
        'DEVICE_MODE_NORMAL',
        'MISSING_TEXT_RULE',
        'registerTexts',
        'codeTexts',
        'missingTexts',
        // lexicon
        'TERM_ID_PATTERN',
        'LEXICON_PROBLEM_CODES',
        'lexiconProblems',
        'createLexicon',
        // the texts
        'messages',
        'platformTerms',
      ].sort(),
    );
  });

  it('keeps its helpers inside', () => {
    for (const name of ['resolveTree', 'frozenTerms', 'mergeTwo', 'kindOf']) {
      expect(Object.keys(i18n), name).not.toContain(name);
    }
  });

  it('holds no list of languages and no translation: only de-CH, the source', () => {
    expect(Object.keys(i18n).filter((name) => /^(?:pt|fr|it|es|en|sq|tr|ta)/i.test(name))).toEqual(
      [],
    );
    expect(i18n.createLanguageRegistry().tags).toEqual(['de-CH']);
  });
});

describe('the sources of the package', () => {
  const dir = new URL('../src/', import.meta.url);
  const files = readdirSync(dir).filter((name) => name.endsWith('.ts'));
  const read = (name: string) =>
    readFileSync(new URL(name, dir), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

  it('import no other package: the texts of the pure packages come in as ids and lists', () => {
    expect(files.length).toBeGreaterThan(5);
    for (const name of files) {
      expect(read(name), name).not.toMatch(/from\s+['"](?:@|node:)/);
    }
  });

  it('hold no state of their own: no variable at the top of a file, no clock, no storage', () => {
    for (const name of files) {
      const code = read(name);
      expect(code, name).not.toMatch(/^(?:export\s+)?(?:let|var)\s/m);
      expect(code, name).not.toMatch(
        /\b(?:localStorage|sessionStorage|navigator|document|Intl|Date)\b(?!\s*\*)/,
      );
    }
  });

  it('put texts in one file, messages.ts', () => {
    const withTexts = files.filter((name) => /Speichern|Einstellungen|Inhaber/.test(read(name)));
    expect(withTexts).toEqual(['messages.ts']);
  });
});

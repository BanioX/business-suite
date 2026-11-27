import {
  catalogueGaps,
  createCatalogueSet,
  defineTranslation,
  messages,
  missingTexts,
  registerTexts,
  resolveCatalogue,
} from '@onestrand/i18n';
import { composeEdition, defineEdition, editionProblems } from '@onestrand/manifest';
import { catalogueTexts, DE_CH_TEXT_RULES, textProblems } from '@onestrand/testing';
import { describe, expect, it } from 'vitest';
import { musterMessages } from './messages';
import { composed, musterEditionInput } from './support';

/** The catalogue of `muster` with one leaf left out, on a copy. */
function withoutLeaf(path: readonly string[]): unknown {
  const copy = structuredClone(musterMessages) as Record<string, unknown>;
  let node = copy;
  for (const key of path.slice(0, -1)) {
    node = node[key] as Record<string, unknown>;
  }
  Reflect.deleteProperty(node, path.at(-1) ?? '');
  return copy;
}

describe('an edition of the business module and muster', () => {
  it('has no problem at all: editionProblems is []', () => {
    expect(editionProblems(defineEdition(musterEditionInput()))).toEqual([]);
  });

  it('misses every text of muster without its catalogue, and names each key', () => {
    const problems = editionProblems(defineEdition(musterEditionInput({ texts: [] })));
    expect(problems.every((problem) => problem.code === 'missing_text')).toBe(true);
    expect(problems.map((problem) => problem.id)).toEqual([
      'modules.muster.journal.name',
      'modules.muster.journal.summary',
      'features.muster.entries.name',
      'features.muster.entries.summary',
      'options.muster.entries.newestFirst',
      'kinds.muster.standard',
      'questions.muster.keeps_journal.text',
      'questions.muster.keeps_journal.answers.yes',
      'questions.muster.keeps_journal.answers.no',
      'deviceModes.muster.capture',
      'rights.muster.journal_read.name',
      'rights.muster.journal_read.summary',
    ]);
    // The edition can still be put together: a missing text falls back, it does not stop it.
    expect(() => composeEdition(defineEdition(musterEditionInput({ texts: [] })))).not.toThrow();
  });

  it('misses the one text that is left out of a copy of the catalogue', () => {
    const copy = withoutLeaf(['options', 'muster.entries', 'newestFirst']);
    const problems = editionProblems(
      defineEdition(musterEditionInput({ texts: [copy as typeof musterMessages] })),
    );
    expect(problems.map((problem) => `${problem.code} ${problem.id}`)).toEqual([
      'missing_text options.muster.entries.newestFirst',
    ]);
  });
});

describe('the texts of muster in de-CH', () => {
  it('have every text the registers ask for, under their ids', () => {
    expect(missingTexts(composed.catalogue, registerTexts(composed))).toEqual([]);
  });

  it('follow the rules of the language: du, ss, no exclamation marks, no slogans, no emoji', () => {
    expect(textProblems(musterMessages, { rules: DE_CH_TEXT_RULES })).toEqual([]);
    expect(catalogueTexts(musterMessages)).toHaveLength(12);
  });

  it('would be caught: a text that breaks a rule is found', () => {
    const broken = structuredClone(musterMessages);
    broken.questions['muster.keeps_journal'].text = 'Führt ihr ein Journal?';
    broken.deviceModes['muster.capture'] = 'Nur erfassen!';
    expect(
      textProblems(broken, { rules: DE_CH_TEXT_RULES })
        .map((problem) => problem.rule)
        .sort(),
    ).toEqual(['exclamation', 'plural_address']);
  });

  it('name no product', () => {
    expect(
      textProblems(musterMessages, { productNames: ['Beispielprodukt', 'Muster-App'] }),
    ).toEqual([]);
  });

  it('lie over the catalogue of the platform and change none of its texts', () => {
    const catalogue = composed.catalogue as Record<string, Record<string, unknown>>;
    const platform: Record<string, unknown> = messages;
    for (const [section, entries] of Object.entries(platform)) {
      for (const [key, text] of Object.entries(entries as Record<string, unknown>)) {
        expect(catalogue[section]?.[key], `${section}.${key}`).toEqual(text);
      }
    }
  });
});

describe('a catalogue with a Portuguese key missing', () => {
  // No translation: placeholders stand for the texts a person with this mother tongue writes
  // before a pilot (ADR-0007, 5). One key of muster is there, every other is not.
  const pt = defineTranslation(musterMessages, {
    features: { 'muster.entries': { name: '[pt] Einträge' } },
  });

  it('falls back to German where the key is missing', () => {
    const resolved = resolveCatalogue(musterMessages, pt);
    expect(resolved.features['muster.entries'].name).toBe('[pt] Einträge');
    expect(resolved.features['muster.entries'].summary).toBe(
      musterMessages.features['muster.entries'].summary,
    );
    expect(resolved.rights['muster.journal_read'].name).toBe('Journal einsehen');
  });

  it('lists the gap, key by key, and not the key that is there', () => {
    const gaps = catalogueGaps(musterMessages, pt, 'pt');
    expect(gaps.every((gap) => gap.rule === 'missing' && gap.language === 'pt')).toBe(true);
    const paths = gaps.map((gap) => gap.path);
    expect(paths).toContain('features.muster.entries.summary');
    expect(paths).toContain('options.muster.entries.newestFirst');
    expect(paths).not.toContain('features.muster.entries.name');
    expect(paths).toHaveLength(catalogueTexts(musterMessages).length - 1);
  });

  it('falls back in the edition too: the app in pt shows German where pt has no text', () => {
    const edition = composeEdition(defineEdition(musterEditionInput({ translations: { pt } })));
    expect(edition.catalogues.languages.tags).toEqual(['de-CH', 'pt']);
    const inPt = edition.catalogues.forLanguage('pt') as typeof edition.catalogue &
      Record<string, Record<string, Record<string, unknown>>>;
    expect(inPt.features?.['muster.entries']?.name).toBe('[pt] Einträge');
    expect(inPt.features?.['muster.entries']?.summary).toBe(
      musterMessages.features['muster.entries'].summary,
    );
    // A language of the edition that is not complete is the edition's decision, not a problem.
    expect(editionProblems(defineEdition(musterEditionInput({ translations: { pt } })))).toEqual(
      [],
    );
    // The gaps of the whole app in pt: the platform's and muster's, muster's listed among them.
    const gaps = catalogueGaps(edition.catalogue, pt, 'pt').map((gap) => gap.path);
    expect(gaps).toContain('rights.muster.journal_read.summary');
    expect(gaps).not.toContain('features.muster.entries.name');
  });

  it('is a set like any other: a language the set does not have answers in German', () => {
    const set = createCatalogueSet(musterMessages, { pt });
    expect(set.forLanguage('fr-CH').features['muster.entries'].name).toBe('Einträge');
    expect(set.forLanguage('pt-BR').features['muster.entries'].name).toBe('[pt] Einträge');
  });
});

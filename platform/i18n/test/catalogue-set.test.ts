import { describe, expect, it } from 'vitest';
import { createCatalogueSet, defineTranslation, I18nError, type MessageTree } from '../src';

/** The texts of a document to a third party: its own catalogue, its own source. */
const OFFER = {
  title: 'Offerte',
  total: (amount: string) => `Total ${amount}`,
  closing: 'Wir freuen uns auf den Auftrag.',
} satisfies MessageTree;

const PT = defineTranslation(OFFER, {
  title: 'Proposta',
  total: (amount) => `Total ${amount} (pt)`,
});
const FR = defineTranslation(OFFER, { title: 'Offre' });

describe('createCatalogueSet', () => {
  const set = createCatalogueSet(OFFER, { pt: PT, 'fr-CH': FR });

  it('lists its languages: de-CH first, then the ones it was given', () => {
    expect(set.languages.tags).toEqual(['de-CH', 'pt', 'fr-CH']);
  });

  it('answers for a language with the whole catalogue, falling back to German key by key', () => {
    const pt = set.forLanguage('pt');
    expect(pt.title).toBe('Proposta');
    expect(pt.total('CHF 10.00')).toBe('Total CHF 10.00 (pt)');
    expect(pt.closing).toBe('Wir freuen uns auf den Auftrag.');
    expect(set.forLanguage('fr-CH').total('CHF 10.00')).toBe('Total CHF 10.00');
  });

  it('answers for de-CH with the source', () => {
    expect(set.forLanguage('de-CH')).toEqual(OFFER);
  });

  it('answers for a region through its language, and for a language it does not have with German', () => {
    expect(set.forLanguage('pt-BR').title).toBe('Proposta');
    expect(set.forLanguage('es').title).toBe('Offerte');
    expect(set.forLanguage('').title).toBe('Offerte');
  });

  it('answers for the first preference it has a language for: the customer, then the business', () => {
    expect(set.forPreferences(['pt', 'fr-CH']).title).toBe('Proposta');
    expect(set.forPreferences(['es', 'fr-CH']).title).toBe('Offre');
    expect(set.forPreferences([undefined, 'fr-CH']).title).toBe('Offre');
    expect(set.forPreferences(['es']).title).toBe('Offerte');
    expect(set.forPreferences([]).title).toBe('Offerte');
  });

  it('is independent of any other set: two catalogues, two languages, at the same time', () => {
    const app = createCatalogueSet({ save: 'Speichern' }, { pt: { save: 'Guardar' } });
    const onlyGerman = createCatalogueSet(OFFER);
    expect(app.forLanguage('pt').save).toBe('Guardar');
    expect(onlyGerman.forLanguage('pt').title).toBe('Offerte');
    expect(set.forLanguage('pt').title).toBe('Proposta');
    expect(app.languages.tags).toEqual(['de-CH', 'pt']);
    expect(onlyGerman.languages.tags).toEqual(['de-CH']);
  });

  it('holds a language that has been entered and has no text yet, and shows German', () => {
    const empty = createCatalogueSet(OFFER, { es: {} });
    expect(empty.languages.has('es')).toBe(true);
    expect(empty.forLanguage('es')).toEqual(OFFER);
  });

  it('is frozen, and gives the same catalogue each time', () => {
    expect(Object.isFrozen(set)).toBe(true);
    expect(set.forLanguage('pt')).toBe(set.forLanguage('pt'));
    expect(Object.isFrozen(set.forLanguage('pt'))).toBe(true);
  });

  it('holds no state: a set built again from the same input answers the same', () => {
    const again = createCatalogueSet(OFFER, { pt: PT, 'fr-CH': FR });
    expect(again.forLanguage('pt')).toEqual(set.forLanguage('pt'));
    set.forLanguage('es');
    expect(set.forLanguage('pt').title).toBe('Proposta');
  });

  it('throws for a key that is no tag', () => {
    expect(() => createCatalogueSet(OFFER, { portuguese: PT })).toThrow(I18nError);
  });

  it('throws for de-CH as a translation: it is the source', () => {
    try {
      createCatalogueSet(OFFER, { 'de-CH': {} });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(I18nError);
      expect((error as I18nError).code).toBe('invalid_language');
      expect((error as I18nError).message).toBe(
        'de-CH is the source of the catalogue, not a translation.',
      );
    }
  });
});

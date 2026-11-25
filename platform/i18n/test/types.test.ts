import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  createCatalogueSet,
  createLexicon,
  defineTranslation,
  messages,
  platformTerms,
  resolveCatalogue,
  type MessageTree,
  type Translation,
} from '../src';

/**
 * Tests on the level of types: `tsc` checks them (`pnpm typecheck`), Vitest runs them empty
 * (Lernbuch L-S22). Every `@ts-expect-error` must find an error, or `tsc` says the directive is
 * unused. They use a value of a fixed type, so the call is not read from its own argument (L-S23).
 */
const SOURCE = {
  save: 'Speichern',
  people: (count: number) => `${count} Personen`,
  group: { title: 'Titel', deep: { label: 'Tief' } },
} satisfies MessageTree;

describe('the type of a translation', () => {
  it('allows a part of the source, and none of it', () => {
    defineTranslation(SOURCE, {});
    defineTranslation(SOURCE, { save: 'Guardar' });
    defineTranslation(SOURCE, { group: { deep: { label: 'x' } } });
    defineTranslation(SOURCE, { people: (count) => `${count}` });
    const full: Translation<typeof SOURCE> = {
      save: 'a',
      people: (count: number) => `${count}`,
      group: { title: 'b', deep: { label: 'c' } },
    };
    expect(full).toBeDefined();
  });

  it('does not allow a key that the source does not know', () => {
    // @ts-expect-error a key the source does not know
    defineTranslation(SOURCE, { unknown: 'x' });
    // @ts-expect-error a key the source does not know, inside a record
    defineTranslation(SOURCE, { group: { nope: 'x' } });
    // @ts-expect-error a key the source does not know, two levels down
    defineTranslation(SOURCE, { group: { deep: { other: 'x' } } });
    // @ts-expect-error the same for a catalogue written without the helper
    const loose: Translation<typeof SOURCE> = { unknown: 'x' };
    expect(loose).toBeDefined();
  });

  it('does not allow the wrong kind', () => {
    // @ts-expect-error a text where the source has a message function
    defineTranslation(SOURCE, { people: 'pessoas' });
    // @ts-expect-error a message function where the source has a text
    defineTranslation(SOURCE, { save: () => 'Guardar' });
    // @ts-expect-error a text where the source has a record
    defineTranslation(SOURCE, { group: 'x' });
    // @ts-expect-error a number where the source has a text
    defineTranslation(SOURCE, { save: 5 });
  });

  it('holds a message function to the arguments of the source', () => {
    // @ts-expect-error another type of argument
    defineTranslation(SOURCE, { people: (count: string) => count });
    // @ts-expect-error one argument more than the source gives
    defineTranslation(SOURCE, { people: (count: number, more: number) => `${count}${more}` });
    expectTypeOf<Translation<typeof SOURCE>['people']>().toEqualTypeOf<
      ((count: number) => string) | undefined
    >();
  });

  it('is the type of the catalogue of the platform for the platform catalogue', () => {
    defineTranslation(messages, { errors: { forbidden: 'x' } });
    defineTranslation(messages, { errors: { 'business.last_owner': 'x' } });
    // @ts-expect-error a code of an error that the platform does not know
    defineTranslation(messages, { errors: { teapot: 'x' } });
    // @ts-expect-error a section that the platform does not have
    defineTranslation(messages, { shelves: {} });
  });
});

describe('the type of what is resolved', () => {
  it('is the type of the source: every key is there', () => {
    const resolved = resolveCatalogue(SOURCE, { save: 'Guardar' });
    expectTypeOf(resolved).toEqualTypeOf<typeof SOURCE>();
    expectTypeOf(resolved.people).toEqualTypeOf<(count: number) => string>();
    expectTypeOf(resolved.group.deep.label).toEqualTypeOf<string>();
  });

  it('is the type of the source for a set, for every language', () => {
    const set = createCatalogueSet(SOURCE, { pt: { save: 'Guardar' } });
    expectTypeOf(set.forLanguage('pt')).toEqualTypeOf<typeof SOURCE>();
    expectTypeOf(set.forPreferences(['pt'])).toEqualTypeOf<typeof SOURCE>();
  });

  it('does not take a translation that does not fit', () => {
    // @ts-expect-error a key the source does not know
    createCatalogueSet(SOURCE, { pt: { stranger: 'x' } });
    // @ts-expect-error a text where the source has a message function
    resolveCatalogue(SOURCE, { people: 'x' });
  });
});

describe('the type of the lexicon', () => {
  it('knows the terms of the platform, and asks only for those', () => {
    const lexicon = createLexicon({ base: platformTerms });
    expectTypeOf(lexicon.terms).toEqualTypeOf<readonly 'object'[]>();
    lexicon.forms('object', 'de-CH');
    // Not run: the calls below throw, they are only there for 	sc.
    const never = () => {
      // @ts-expect-error a term that the platform does not have
      lexicon.forms('room', 'de-CH');
      // @ts-expect-error a term that the platform does not have
      lexicon.forLanguage('de-CH').one('room');
    };
    expect(never).toBeTypeOf('function');
  });
});

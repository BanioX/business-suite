import { resolveCatalogue, type MessageTree, type Translation } from './catalogue';
import { I18nError } from './errors';
import { createLanguageRegistry, SOURCE_LANGUAGE, type LanguageRegistry } from './languages';

/**
 * A catalogue in all the languages an edition ships for it, each resolved with the fall-back to
 * de-CH. One set is one catalogue: the texts of the app are a set, and the texts of a document
 * to a third party (offer, invoice, report) are another, with their own source, their own
 * languages and their own tests (suite ADR-0007, 8). So the language of a document is
 * independent of the language of the app on the device: the document's language comes from the
 * customer or the business, and the set only answers for the language it is asked for.
 *
 * Nothing here is global. There is no «current language»: the caller always names the language,
 * and a set built twice from the same input answers the same.
 *
 * How a document is addressed («du», «Sie» or none) is not decided here: the source of a set
 * holds the texts as the catalogue's authors wrote them (S-07 in `docs/entscheide.md`).
 */
export interface CatalogueSet<TSource extends MessageTree> {
  /** The languages this catalogue is shipped in: de-CH, then the others. */
  readonly languages: LanguageRegistry;
  /**
   * The complete catalogue of a language: the closest language the set has (`pt-BR` finds `pt`),
   * de-CH where it has none. Always a full catalogue, never a partial one.
   */
  forLanguage(language: string): TSource;
  /** The catalogue for the first of the preferences the set has a language for, e.g. a customer's, then the business's. */
  forPreferences(preferences: readonly (string | undefined)[]): TSource;
}

/**
 * Builds the set of a catalogue. `translations` holds one entry per language other than de-CH,
 * keyed by its tag; an empty translation is a language that has been entered and has no text yet.
 * Throws an `I18nError` for a key that is no tag, and for `de-CH` itself, which is the source.
 */
export function createCatalogueSet<TSource extends MessageTree>(
  source: TSource,
  translations: Readonly<Record<string, Translation<TSource>>> = {},
): CatalogueSet<TSource> {
  const tags = Object.keys(translations);
  const languages = createLanguageRegistry(tags);
  if (tags.includes(SOURCE_LANGUAGE)) {
    throw new I18nError(
      'invalid_language',
      `${SOURCE_LANGUAGE} is the source of the catalogue, not a translation.`,
    );
  }
  const resolved = new Map<string, TSource>([[SOURCE_LANGUAGE, resolveCatalogue(source)]]);
  for (const tag of tags) {
    resolved.set(tag, resolveCatalogue(source, translations[tag]));
  }
  // `resolve` always names a language of the register, and the map holds each of them.
  const forLanguage = (language: string) => resolved.get(languages.resolve(language)) as TSource;
  return Object.freeze({
    languages,
    forLanguage,
    forPreferences: (preferences: readonly (string | undefined)[]) =>
      forLanguage(languages.pick(preferences)),
  });
}

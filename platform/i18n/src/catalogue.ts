/**
 * Catalogues of texts (suite ADR-0007). The catalogue in de-CH is the source: it fixes the keys.
 * A catalogue of another language has the same form, with the keys it has translated; where a
 * key is missing, the text of the source stands. All of it is plain data and pure functions:
 * nothing here remembers a language, and nothing changes what it is given.
 *
 * A catalogue is a nested record. Its leaves are texts (`'Speichern'`) and message functions
 * (`(n: number) => `${n} Personen``): a message function returns a text and takes what it needs
 * to build it, in the same order in every language.
 */

/** A leaf of a catalogue: a text, or a function that builds one. */
export type Message = string | ((...args: never[]) => string);

/** A catalogue: records of records, ending in messages. */
export interface MessageTree {
  readonly [key: string]: Message | MessageTree;
}

/**
 * What a catalogue of another language may hold, given the source: the same form, every key
 * optional. A key the source does not know does not compile; a text where the source has a
 * message function (and the reverse) does not compile either; a missing key is allowed and
 * falls back to the source.
 */
export type Translation<TSource> = {
  readonly [K in keyof TSource]?: TSource[K] extends string
    ? string
    : TSource[K] extends (...args: infer TArgs) => string
      ? (...args: TArgs) => string
      : Translation<TSource[K]>;
};

/** The kinds of what a catalogue holds. */
type Kind = 'text' | 'function' | 'tree' | 'other';

function kindOf(value: unknown): Kind {
  if (typeof value === 'string') {
    return 'text';
  }
  if (typeof value === 'function') {
    return 'function';
  }
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? 'tree' : 'other';
}

function asTree(value: unknown): Readonly<Record<string, unknown>> {
  return kindOf(value) === 'tree' ? (value as Readonly<Record<string, unknown>>) : {};
}

/** A text that says something: not empty, not only spaces. */
function isFilled(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Writes a translation against its source, so the compiler holds it to the source's keys. It
 * returns the translation as it is: `defineTranslation(messages, { save: 'Guardar' })`.
 */
export function defineTranslation<TSource extends MessageTree>(
  _source: TSource,
  translation: NoInfer<Translation<TSource>>,
): Translation<TSource> {
  return translation;
}

function resolveTree(source: Readonly<Record<string, unknown>>, translation: unknown) {
  const own = asTree(translation);
  const entries = Object.entries(source).map(([key, value]): [string, unknown] => {
    const mine = Object.hasOwn(own, key) ? own[key] : undefined;
    switch (kindOf(value)) {
      case 'tree':
        return [key, resolveTree(asTree(value), mine)];
      case 'text':
        return [key, isFilled(mine) ? mine : value];
      case 'function':
        return [key, kindOf(mine) === 'function' ? mine : value];
      case 'other':
        return [key, value];
    }
  });
  return Object.freeze(Object.fromEntries(entries));
}

/**
 * The whole catalogue of a language: the source, with the translation's text wherever it has
 * one. Where the translation has no key, an empty text, a text for a message function or a
 * function for a text, the text of the source stands. Keys the source does not know are left
 * out. What it returns is a new, frozen record of the shape of the source; neither argument is
 * changed. Without a translation it is a frozen copy of the source.
 */
export function resolveCatalogue<TSource extends MessageTree>(
  source: TSource,
  translation?: Translation<TSource>,
): TSource {
  return resolveTree(source, translation) as TSource;
}

export const GAP_RULES = ['missing', 'wrong_kind', 'unknown_key'] as const;
/**
 * - `missing`: the source has a text or a message function here and the translation has none (or
 *   an empty text). The source's text is used.
 * - `wrong_kind`: the translation holds another kind than the source: a text for a message
 *   function, a function for a text, a record for a text, or a text for a record. The source's
 *   text is used.
 * - `unknown_key`: the translation has a key the source does not know. It is not used.
 */
export type GapRule = (typeof GAP_RULES)[number];

/** One difference between a translation and its source, as data in the style of the standard tests. */
export interface CatalogueGap {
  rule: GapRule;
  /** What is wrong and what happens instead, in English. */
  message: string;
  /** The language of the translation, as given. */
  language: string;
  /** The keys from the top, joined by dots. A key that holds a dot itself (`facility.keys`) shows as part of it. */
  path: string;
}

const KIND_WORDS: Record<Kind, string> = {
  text: 'a text',
  function: 'a message function',
  tree: 'a record',
  other: 'something else',
};

/**
 * Every difference between a translation and its source, one entry per key, in the order of the
 * source (keys the source does not know come last in their record). A test chooses which
 * language has to be complete and expects `[]` for that one; for the others it lists what is
 * still to do. Nothing here fails on its own: a gap is no error, the source stands in for it.
 *
 * A translation that is not a record is one `wrong_kind` at the top. A missing translation
 * (`undefined`) is a language without a file yet: every key is `missing`.
 */
export function catalogueGaps(
  source: MessageTree,
  translation: unknown,
  language: string,
): CatalogueGap[] {
  const gaps: CatalogueGap[] = [];
  const add = (rule: GapRule, path: string, message: string) =>
    gaps.push({ rule, message, language, path });

  const walkMissing = (value: unknown, path: string) => {
    if (kindOf(value) === 'tree') {
      for (const [key, child] of Object.entries(asTree(value))) {
        walkMissing(child, path === '' ? key : `${path}.${key}`);
      }
    } else if (kindOf(value) !== 'other') {
      add('missing', path, `${language} has no text here: the text of de-CH is used.`);
    }
  };

  const walk = (sourceTree: Readonly<Record<string, unknown>>, mine: unknown, base: string) => {
    const own = asTree(mine);
    for (const [key, value] of Object.entries(sourceTree)) {
      const path = base === '' ? key : `${base}.${key}`;
      const present = Object.hasOwn(own, key) ? own[key] : undefined;
      const kind = kindOf(value);
      if (kind === 'other') {
        continue;
      }
      if (present === undefined) {
        walkMissing(value, path);
      } else if (kindOf(present) !== kind) {
        add(
          'wrong_kind',
          path,
          `${language} has ${KIND_WORDS[kindOf(present)]} here, the source has ${KIND_WORDS[kind]}: the text of de-CH is used.`,
        );
      } else if (kind === 'tree') {
        walk(asTree(value), present, path);
      } else if (kind === 'text' && !isFilled(present)) {
        add('missing', path, `${language} has an empty text here: the text of de-CH is used.`);
      }
    }
    for (const key of Object.keys(own)) {
      if (!Object.hasOwn(sourceTree, key)) {
        add(
          'unknown_key',
          base === '' ? key : `${base}.${key}`,
          `The source has no key ${JSON.stringify(key)} here: it is not used.`,
        );
      }
    }
  };

  if (translation !== undefined && kindOf(translation) !== 'tree') {
    add(
      'wrong_kind',
      '',
      `A catalogue is a record, not ${KIND_WORDS[kindOf(translation)]}: the source is used.`,
    );
    return gaps;
  }
  walk(source, translation, '');
  return gaps;
}

function copyOf(value: Message | MessageTree): Message | MessageTree {
  return kindOf(value) === 'tree' ? mergeTwo({}, value as MessageTree) : value;
}

function mergeTwo(a: MessageTree, b: MessageTree): MessageTree {
  const entries = new Map<string, Message | MessageTree>();
  for (const [key, value] of Object.entries(a)) {
    entries.set(key, copyOf(value));
  }
  for (const [key, value] of Object.entries(b)) {
    const before = entries.get(key);
    entries.set(
      key,
      kindOf(before) === 'tree' && kindOf(value) === 'tree'
        ? mergeTwo(before as MessageTree, value as MessageTree)
        : copyOf(value),
    );
  }
  return Object.freeze(Object.fromEntries(entries));
}

/**
 * Puts catalogues together, the later over the earlier: the way an edition adds the catalogue of
 * an industry to the one of the platform, and the way an industry writes a whole sentence over
 * the platform's (ADR-0007, 3). Records are merged key by key; a leaf of a later catalogue
 * replaces whatever stood there. The arguments are not changed; the result is new and frozen.
 */
export function mergeCatalogues(...catalogues: readonly MessageTree[]): MessageTree {
  return catalogues.reduce<MessageTree>((merged, next) => mergeTwo(merged, next), {});
}

// Origin: BanioX/Randen apps/web/src/app/messages.test.ts @ e0f0907 — adapted: the walk over a catalogue and the rules of the language as functions and data over a given catalogue; a message function is read by its literals, not by its source; an exclamation mark at the end of a text is found; rules for empty texts, names of products and pictographs are new; a catalogue without a text is a finding
import { frozenList } from './frozen';
import type { StandardProblem } from './problem';
import { EXPRESSION_PLACEHOLDER, literalsOf } from './source';

/**
 * The standard test of texts: what the app says to a person follows the rules of the suite
 * (CLAUDE.md, «Sprache»). The rules of a language are data, so a later language brings its own
 * list and the walk over the catalogue stays the same.
 */

/** One rule of a language: a pattern that must not occur in any text. */
export interface TextRule {
  /** Short id that never changes, e.g. `eszett`; it stands in every problem the rule finds. */
  id: string;
  /** Every match in a text breaks the rule. */
  pattern: RegExp;
  /** What is wrong and what to write instead, in English. */
  message: string;
}

/** A text of a catalogue. */
export interface CatalogueText {
  /** Where it stands: the keys from the top of the catalogue, joined by dots. */
  path: string;
  /** The text; for a message function one of its literals, with `{}` for each inserted value. */
  text: string;
  /** Whether the catalogue holds it as a text or inside a message function. */
  from: 'string' | 'function';
}

/** A text that breaks a rule. */
export interface TextProblem extends StandardProblem {
  /** Where the text stands in the catalogue. */
  path: string;
  /** The whole text. */
  text: string;
  /** The part of it that breaks the rule. */
  found: string;
}

/**
 * Every text of a catalogue: a nested record (or list, `Map` or `Set`) of texts and message
 * functions. Of a message function the literals are read (`(n) => `${n} Zeilen`` gives
 * «{} Zeilen»), never its code, so a `!` that negates or a variable called `ihr` breaks no rule.
 * A literal that says nothing (an empty fallback, the space between two values) is left out;
 * one that holds only a sign (`', '`, `'!'`) is a text like any other. Numbers, booleans and
 * missing values are no texts.
 *
 * What it cannot see: a text that is put together outside the catalogue, and the text behind a
 * regular expression that holds a quote.
 */
export function catalogueTexts(catalogue: unknown): CatalogueText[] {
  const texts: CatalogueText[] = [];
  const seen = new WeakSet<object>();
  const walk = (value: unknown, path: string) => {
    const under = (key: string) => (path === '' ? key : `${path}.${key}`);
    if (typeof value === 'string') {
      texts.push({ path, text: value, from: 'string' });
    } else if (typeof value === 'function') {
      for (const literal of literalsOf(Function.prototype.toString.call(value))) {
        if (literal.replaceAll(EXPRESSION_PLACEHOLDER, '').trim() !== '') {
          texts.push({ path, text: literal, from: 'function' });
        }
      }
    } else if (typeof value === 'object' && value !== null && !seen.has(value)) {
      // A catalogue that holds itself is read once, not for ever.
      seen.add(value);
      if (value instanceof Map) {
        // A catalogue kept in a map has entries no `Object.entries` shows.
        let index = 0;
        for (const [key, child] of value) {
          walk(child, under(typeof key === 'string' ? key : String(index)));
          index += 1;
        }
      } else if (value instanceof Set) {
        let index = 0;
        for (const child of value) {
          walk(child, under(String(index)));
          index += 1;
        }
      } else {
        for (const [key, child] of Object.entries(value)) {
          walk(child, under(key));
        }
      }
    }
  };
  walk(catalogue, '');
  return texts;
}

/** Not part of a longer word: no letter, digit or underscore before or after. */
const WORD_START = '(?<![\\p{L}\\p{N}_])';
const WORD_END = '(?![\\p{L}\\p{N}_])';

const wholeWords = (words: string, flags: string) =>
  new RegExp(`${WORD_START}(?:${words})${WORD_END}`, flags);

/** Variation selector 16: it turns the sign before it into an emoji. */
const EMOJI_VARIATION = String.fromCharCode(0xfe0f);

/**
 * The rules for texts in German (Switzerland), from CLAUDE.md, «Sprache»:
 *
 * - `empty`: a text says something.
 * - `eszett`: «ss», never «ß».
 * - `exclamation`: no exclamation mark.
 * - `plural_address`: one person is addressed with «du», never several with «ihr», «euch» or
 *   «euer». The possessive «ihr» (her, their) and the formal «Ihr» are found as well; such a
 *   sentence is reworded. «ihre» and its forms in lower case are not: they are «her» and «their».
 * - `formal_address`: never «Sie»: «Ihnen», «Ihre» and its forms with a capital letter, and
 *   «Sie» inside a sentence, where the capital letter can only be the formal address.
 * - `buzzword`: calm names, no words of advertising.
 * - `pictograph`: no emoji.
 *
 * «Sie» at the start of a sentence is not in this list, because there it is also «she», «it»
 * and «they»; see `DE_CH_OPENING_SIE_RULE`.
 */
export const DE_CH_TEXT_RULES: readonly TextRule[] = frozenList<TextRule>([
  {
    id: 'empty',
    pattern: /^\s*$/u,
    message: 'The text is empty: write the text, or remove the entry.',
  },
  {
    id: 'eszett',
    pattern: /[ßẞ]/u,
    message: 'Swiss German writes «ss», never «ß».',
  },
  {
    id: 'exclamation',
    pattern: /!/u,
    message: 'No exclamation marks: the app speaks calmly.',
  },
  {
    id: 'plural_address',
    pattern: wholeWords('ihr|euch|euer|eure[mnrs]?', 'iu'),
    message:
      'The app talks to one person with «du», never to several («ihr», «euch», «euer») and never formally («Ihr»). If the word means «her» or «their», reword the sentence.',
  },
  {
    id: 'formal_address',
    pattern: new RegExp(
      `${WORD_START}(?:Ihnen|Ihre[mnrs]?)${WORD_END}|(?<=[\\p{L}\\p{N},;]\\s+)Sie${WORD_END}`,
      'u',
    ),
    message: 'The app talks to one person with «du», never with «Sie», «Ihnen» or «Ihr».',
  },
  {
    id: 'buzzword',
    pattern: wholeWords('smart|insights?|hub|magic|journey|gamechanger', 'iu'),
    message: 'No buzzwords: name the thing with the word of the trade.',
  },
  {
    id: 'pictograph',
    pattern: new RegExp(`\\p{Emoji_Presentation}|${EMOJI_VARIATION}`, 'u'),
    message: 'No emoji in texts.',
  },
]);

/**
 * «Sie» at the start of a text or a sentence, after a colon or after an opening quote. It
 * reads as the formal address where the app tells a person what they can do (saving, sharing,
 * printing), but it is also the ordinary «she», «it» and «they». So it is no rule for every
 * catalogue: add it for the catalogues in which no sentence should open that way.
 */
export const DE_CH_OPENING_SIE_RULE: Readonly<TextRule> = Object.freeze({
  id: 'formal_address_opening',
  pattern: new RegExp(`(?:^|[.:?]\\s+|[\`'"«]\\s*)Sie${WORD_END}`, 'u'),
  message:
    'A sentence that opens with «Sie» reads as the formal address: reword it, or name what «sie» stands for.',
});

/**
 * A rule that finds the given names as whole words, in any case: names of products that must
 * not stand in the texts (in the platform the names of the editions, in an edition the names of
 * other products). The list comes from the caller; this package holds no names.
 */
export function productNameRule(names: readonly string[]): TextRule {
  const words = names
    .map((name) => name.trim())
    .filter((name) => name !== '')
    // The longest first, so a name that starts with another one is found whole.
    .sort((a, b) => b.length - a.length)
    .map((name) =>
      name
        .split(/\s+/u)
        .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('\\s+'),
    );
  return {
    id: 'product_name',
    // Without a name the rule finds nothing: `(?!)` matches nowhere.
    pattern: words.length === 0 ? /(?!)/u : wholeWords(words.join('|'), 'iu'),
    message: 'The name of a product has no place in this text.',
  };
}

/** What `textProblems` checks against. */
export interface TextCheckOptions {
  /** The rules of the language. Default: `DE_CH_TEXT_RULES`. */
  rules?: readonly TextRule[];
  /** Names of products that must not occur (`productNameRule`). Default: none. */
  productNames?: readonly string[];
}

/** The pattern of a rule for one search: without the flags that make a pattern remember. */
function searchPattern(pattern: RegExp): RegExp {
  return new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ''));
}

/** The rule that is broken when a catalogue holds no text at all. It is no rule of a language. */
const NO_TEXTS_RULE = 'no_texts';

/**
 * Every text of a catalogue that breaks a rule: one problem per text and rule, in the order of
 * the catalogue, with the first place the rule is broken. A test expects `[]`. Pass every
 * catalogue of the package in one record, keyed by where it comes from, so the path of a
 * problem says which file to open.
 *
 * A catalogue without a single text is a problem of its own (`no_texts`): a test that was
 * handed the wrong object would otherwise pass for the wrong reason.
 */
export function textProblems(catalogue: unknown, options: TextCheckOptions = {}): TextProblem[] {
  const { rules = DE_CH_TEXT_RULES, productNames = [] } = options;
  const all = (productNames.length === 0 ? rules : [...rules, productNameRule(productNames)]).map(
    (rule) => ({ ...rule, pattern: searchPattern(rule.pattern) }),
  );
  const texts = catalogueTexts(catalogue);
  if (texts.length === 0) {
    return [
      {
        rule: NO_TEXTS_RULE,
        message: 'The catalogue holds no text: is it the catalogue of the package?',
        path: '',
        text: '',
        found: '',
      },
    ];
  }
  return texts.flatMap(({ path, text }) =>
    all.flatMap((rule) => {
      const match = rule.pattern.exec(text);
      return match === null
        ? []
        : [{ rule: rule.id, message: rule.message, path, text, found: match[0] }];
    }),
  );
}

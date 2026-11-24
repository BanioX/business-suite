// Origin: BanioX/Rettich apps/web/src/private-ideas.test.ts @ 0ac1fd2 — adapted: the check of names as a function over given files that reports place and hash, never the word; the check of prices is new
import { createHash } from 'node:crypto';
import { linesOf, type Problem, type RepoFile } from './repo-files.ts';
import { FORBIDDEN_FIRST_WORDS, FORBIDDEN_NAMES } from './words/forbidden-names.ts';
import { PRICE_RULES, PRICE_WINDOW, type PriceRuleData } from './words/prices.ts';

/**
 * What must not stand in this public repository (ADR-0011): names of other software products,
 * of real companies and persons, and prices of the suite. Two checks over the text of every
 * file, both as functions over given files, so they are tested on made-up fixtures.
 *
 * **Names** are kept as hashes (`words/forbidden-names.ts`), so the list gives nothing away. A
 * finding names the place and the hash, never the word: the logs of the CI are public too.
 *
 * **Prices** are found by rules kept as data (`words/prices.ts`): an amount of money with a
 * currency, and near it words that make it a price of the suite or of one of its apps.
 *
 * What these checks cannot see, and what therefore stays the job of whoever writes:
 * - a name that is not on the list yet, or one written with digits, a hyphen inside a word or
 *   letters outside a to z and äöüàéèç in a way the list does not hold;
 * - an amount without a currency next to it («29 pro Monat»), a price written in words, a
 *   currency other than CHF, Fr., EUR and €, a constant in code (`2900`);
 * - an amount that stands apart from its words: in another line or another table cell, unless a
 *   heading above names the price of the suite; more than `PRICE_WINDOW` characters away;
 * - a business model, a market share as a goal or a comparison told without an amount;
 * - pictures, PDF and other binary files;
 * - commit messages, branch names and PR texts, and everything already in the history.
 * A false alarm is settled by clearer wording or by the head tuning the rules in
 * `words/prices.ts`, never by leaving a file out.
 */

// --- Names ---

/** The letters a name is made of; everything else separates words (as in the source). */
const NAME_WORD = /[a-zäöüàéèç]+/g;

/** How many words of a name written in several words are joined, counted from its first word. */
const JOINED_LENGTHS = [2, 3, 4] as const;

const hashes = new Map<string, string>();

/** First 16 hex digits of the SHA-256 of a lower-case word. */
export function hashName(word: string): string {
  const known = hashes.get(word);
  if (known !== undefined) {
    return known;
  }
  const digest = createHash('sha256').update(word).digest('hex').slice(0, 16);
  hashes.set(word, digest);
  return digest;
}

/** A text in the form the names are compared in: composed characters, lower case. */
function comparable(text: string): string {
  return text.normalize('NFC').toLowerCase();
}

/** A listed name found in a text. */
export interface NameHit {
  /** 1 for the first line. */
  line: number;
  /** 1 for the first character of the line. */
  column: number;
  /** The hash that matched: of the word, or of the joined words of a name in several words. */
  hash: string;
}

/** Every listed name in a text, whether written in one word or in several, in any case. */
export function namesIn(
  text: string,
  names: ReadonlySet<string> = FORBIDDEN_NAMES,
  firstWords: ReadonlySet<string> = FORBIDDEN_FIRST_WORDS,
): NameHit[] {
  const lower = comparable(text);
  const words = [...lower.matchAll(NAME_WORD)];
  return words.flatMap((match, index) => {
    const word = match[0];
    const joined = firstWords.has(hashName(word))
      ? JOINED_LENGTHS.map((length) =>
          words
            .slice(index, index + length)
            .map((next) => next[0])
            .join(''),
        )
      : [];
    const hash = [word, ...joined].map(hashName).find((candidate) => names.has(candidate));
    if (hash === undefined) {
      return [];
    }
    const before = lower.slice(0, match.index);
    const lineStart = before.lastIndexOf('\n') + 1;
    return [
      {
        line: before.split('\n').length,
        column: match.index - lineStart + 1,
        hash,
      },
    ];
  });
}

/** The hashes to put on the list for a name, as `tools/hash-name.mjs` prints them. */
export interface NameHashes {
  /** For `FORBIDDEN_NAMES`. */
  name: string;
  /** For `FORBIDDEN_FIRST_WORDS`; only a name written in several words has one. */
  firstWord?: string;
}

/**
 * The hashes for a name, split into words exactly as the check splits a text. Fails for a name
 * the check could never find: one without a letter, or one longer than four words.
 */
export function nameHashes(name: string): NameHashes {
  const words = [...comparable(name).matchAll(NAME_WORD)].map((match) => match[0]);
  const [first] = words;
  if (first === undefined) {
    throw new Error('A name needs at least one letter (a to z, äöüàéèç).');
  }
  const longest = Math.max(...JOINED_LENGTHS);
  if (words.length > longest) {
    throw new Error(
      `The check joins at most ${longest} words, this name has ${words.length}: ` +
        `give its first ${longest} words, or the one word that tells it apart.`,
    );
  }
  return words.length === 1
    ? { name: hashName(first) }
    : { name: hashName(words.join('')), firstWord: hashName(first) };
}

/** Every listed name in the text or in the path of the given files. Line 0 is the path. */
export function forbiddenNameProblems(
  files: readonly RepoFile[],
  names: ReadonlySet<string> = FORBIDDEN_NAMES,
  firstWords: ReadonlySet<string> = FORBIDDEN_FIRST_WORDS,
): Problem[] {
  return files.flatMap((file) => [
    ...namesIn(file.path, names, firstWords).map((hit) => ({
      path: file.path,
      line: 0,
      message: `the path holds a listed name (hash ${hit.hash}, column ${hit.column})`,
    })),
    ...namesIn(file.text, names, firstWords).map((hit) => ({
      path: file.path,
      line: hit.line,
      message: `a listed name (hash ${hit.hash}, column ${hit.column})`,
    })),
  ]);
}

// --- Prices ---

const SPACE = '[ \\u00a0\\u202f]';
/**
 * Digits with the usual separators: 29, 29.90, 4'160, 100 000. The length is bounded, so a long
 * line of numbers (a data file) is read in linear time.
 */
const NUMBER = `\\d(?:[\\d'’.,\\u00a0\\u202f ]{0,18}\\d)?`;

/**
 * An amount of money: a currency (CHF, Fr., SFr., EUR, €, and after a number also «Franken» and
 * «Euro») directly before or after a number. A currency without a number («nur CHF oder EUR»)
 * is no amount, and neither is a number without a currency.
 */
const AMOUNT = new RegExp(
  [
    `(?<![\\p{L}])(?:CHF|EUR|S?Fr\\.|SFr)${SPACE}{0,2}\\**\\d[\\d'’.,]*`,
    `€${SPACE}?\\**\\d[\\d'’.,]*`,
    `${NUMBER}(?:\\.?[–—-]{1,2})?\\**${SPACE}?(?:(?:CHF|EUR|SFr|Euros?|Franken)(?![\\p{L}])|S?Fr\\.|€)`,
  ].join('|'),
  'giu',
);

function escaped(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

/**
 * A pattern for «one of these words or phrases»: whole words, any case, a space standing for
 * any white space. An entry that starts or ends with a sign (`/monat`) is not held to a word
 * border on that side.
 */
function anyOf(words: readonly string[]): RegExp {
  const alternatives = words.map((word) => {
    const start = /^[\p{L}\p{N}]/u.test(word) ? '(?<![\\p{L}\\p{N}])' : '';
    const end = /[\p{L}\p{N}]$/u.test(word) ? '(?![\\p{L}\\p{N}])' : '';
    return `${start}${word.split(' ').map(escaped).join('\\s+')}${end}`;
  });
  return new RegExp(alternatives.join('|'), 'iu');
}

/**
 * The text around an amount that a rule reads: up to `window` characters to each side, never
 * past the border of a table cell, and never starting or ending inside a word.
 */
function around(line: string, start: number, end: number, window: number): string {
  const cellStart = line.lastIndexOf('|', start) + 1;
  const cellEnd = line.indexOf('|', end);
  const from = Math.max(cellStart, line.lastIndexOf(' ', Math.max(0, start - window)) + 1);
  const farthest = line.indexOf(' ', end + window);
  const to = Math.min(
    cellEnd === -1 ? line.length : cellEnd,
    farthest === -1 ? line.length : farthest,
  );
  return line.slice(from, to);
}

const MARKDOWN = /\.(?:md|markdown)$/i;
const HEADING = /^ {0,3}(#{1,6})\s+(.*)$/;
const FENCE = /^ {0,3}(?:```|~~~)/;

/**
 * Reads a file line by line and hands every line to `visit` with the headings above it (only a
 * Markdown file has headings; a `#` inside a code block is a comment, not a heading).
 */
function eachLine(file: RepoFile, visit: (line: string, index: number, above: string[]) => void) {
  const markdown = MARKDOWN.test(file.path);
  // One entry per level; a level that was skipped (a `###` right under a `#`) stays undefined.
  const trail: (string | undefined)[] = [];
  let fenced = false;
  linesOf(file.text).forEach((line, index) => {
    if (markdown && FENCE.test(line)) {
      fenced = !fenced;
    }
    const heading = markdown && !fenced ? HEADING.exec(line) : null;
    if (heading?.[1] !== undefined && heading[2] !== undefined) {
      // A heading ends every heading of its own level and below.
      trail.length = heading[1].length - 1;
      trail[heading[1].length - 1] = heading[2];
    }
    visit(
      line,
      index,
      trail.filter((entry) => entry !== undefined),
    );
  });
}

/**
 * Every line that states a price of the suite or of one of its apps, by the given rules: an
 * amount whose surroundings fulfil a rule, or an amount under a heading that fulfils it (a
 * table of prices under «Preise der Suite» has its words in the heading, not in the rows).
 */
export function priceProblems(
  files: readonly RepoFile[],
  rules: readonly PriceRuleData[] = PRICE_RULES,
  window: number = PRICE_WINDOW,
): Problem[] {
  const compiled = rules.map((rule) => ({ ...rule, patterns: rule.all.map(anyOf) }));
  const problems: Problem[] = [];
  for (const file of files) {
    eachLine(file, (line, index, above) => {
      const seen = new Set<string>();
      for (const amount of line.matchAll(AMOUNT)) {
        const text = around(line, amount.index, amount.index + amount[0].length, window);
        for (const rule of compiled) {
          const fulfilledBy = (where: string) =>
            rule.patterns.every((pattern) => pattern.test(where));
          if (!seen.has(rule.id) && (fulfilledBy(text) || above.some(fulfilledBy))) {
            seen.add(rule.id);
            problems.push({
              path: file.path,
              line: index + 1,
              message: `looks like a price of the suite (rule «${rule.id}»: ${rule.finds}): «${amount[0].trim()}»`,
            });
          }
        }
      }
    });
  }
  return problems;
}

/** Everything the public repository must not hold, in the given files. */
export function publicRepoProblems(files: readonly RepoFile[]): Problem[] {
  return [...forbiddenNameProblems(files), ...priceProblems(files)];
}

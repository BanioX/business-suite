import { canCarryHeader, isOriginHeader } from './provenance.ts';
import { linesOf, type Problem, type RepoFile } from './repo-files.ts';
import { PLATFORM_WORD_LISTS } from './words/platform.ts';

/**
 * No word of an industry and no product name in the platform (docs/zusammenarbeit.md, 10.3;
 * acceptance of W0-01). The platform is what all industries share; a word of one trade in it is
 * the first sign that something of that trade has slipped in.
 *
 * Every text file under `platform/` is split into words, also inside identifiers, and every
 * word is checked against lists kept as data (`words/`). The path of a file is checked like a
 * line of it.
 *
 * The one exception is a line that is exactly a provenance header (`// Origin: BanioX/<Repo>
 * <path> @ <commit> — …`) in a file that can carry one: it must name where a file comes from.
 * The provenance guard reads the same files and holds every such line to the start of its file,
 * so the exception is the few lines at the top of a copied source file and nothing else. What
 * stands after «adapted:» there is free text and stays with the review.
 *
 * What this cannot see: a word of a trade that is not on a list, a compound whose fragment is
 * not listed («Tagesgericht»), and an idea of a trade behind a neutral word (a field `lot` that
 * only one trade needs). That stays the job of the review.
 */

/** The words of one industry (or the product names), as data. */
export interface WordList {
  id: string;
  /** Whose words these are, for the message: «word of <label>». */
  label: string;
  /** Whole words, lower case. Every form that should be found is listed (plural, case endings). */
  words: readonly string[];
  /** Fragments, lower case: a word that holds one is found. Only for fragments no neutral word holds. */
  parts?: readonly string[];
  /** Words that follow each other directly, for a name written in several words. */
  sequences?: readonly (readonly string[])[];
}

const LETTERS = /\p{L}+/gu;
/** The pieces of an identifier: `HACCPPlan` is HACCP and Plan, `guestList` is guest and List. */
const PIECE = /\p{Lu}+(?!\p{Ll})|\p{Lu}?\p{Ll}+/gu;

/**
 * The words of a text in lower case, in their order. Everything that is not a letter separates
 * words (so `snake_case`, `kebab-case` and digits do), and so does a change of case inside a
 * word (`camelCase`, `PascalCase`, `HTTPServer`).
 */
export function splitWords(text: string): string[] {
  return (text.normalize('NFC').match(LETTERS) ?? []).flatMap((run) =>
    (run.match(PIECE) ?? []).map((piece) => piece.toLowerCase()),
  );
}

/** A listed word found in a line. */
export interface WordHit {
  /** The word as found, lower case; for a sequence its words with a space between. */
  word: string;
  /** The id of the list it is on. */
  list: string;
}

/** Every listed word in a line of text, each once per list. */
export function wordHits(
  line: string,
  lists: readonly WordList[] = PLATFORM_WORD_LISTS,
): WordHit[] {
  const words = splitWords(line);
  const hits = new Map<string, WordHit>();
  for (const list of lists) {
    const found = (word: string) => hits.set(`${list.id} ${word}`, { word, list: list.id });
    words.forEach((word, index) => {
      if (list.words.includes(word) || list.parts?.some((part) => word.includes(part)) === true) {
        found(word);
      }
      for (const sequence of list.sequences ?? []) {
        if (sequence.every((next, offset) => words[index + offset] === next)) {
          found(sequence.join(' '));
        }
      }
    });
  }
  return [...hits.values()];
}

/**
 * Every word of an industry and every product name in the given files (the files of
 * `platform/`), by line. Line 0 is the path of the file. Lines that are exactly a provenance
 * header are not read, in the files that can carry one (source files); in a document or a JSON
 * file the same line is read like any other.
 */
export function platformWordProblems(
  files: readonly RepoFile[],
  lists: readonly WordList[] = PLATFORM_WORD_LISTS,
): Problem[] {
  const label = new Map(lists.map((list) => [list.id, list.label]));
  const problems = (path: string, line: number, text: string): Problem[] =>
    wordHits(text, lists).map((hit) => ({
      path,
      line,
      message: `«${hit.word}» is a word of ${label.get(hit.list) ?? hit.list} and has no place in the platform`,
    }));
  return files.flatMap((file) => {
    const carriesHeaders = canCarryHeader(file.path);
    return [
      ...problems(file.path, 0, file.path),
      ...linesOf(file.text).flatMap((line, index) =>
        carriesHeaders && isOriginHeader(line) ? [] : problems(file.path, index + 1, line),
      ),
    ];
  });
}

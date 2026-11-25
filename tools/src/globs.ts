// A small glob matcher for the registers of the suite (registry/owners.json): which paths a
// pattern stands for. Written here, without a dependency, because the registers need three things
// only and must read the same on every machine.
//
// A pattern is a path from the root of the repository, with forward slashes:
//
//   **    as a whole segment: any number of segments. At the end it is everything inside a
//         directory (`tools/**` is every file below `tools`, at any depth); at the start and in
//         the middle it also stands for no segment at all (`**/api.md` is every `api.md`, the
//         one at the root included; `platform/**/index.ts` is `platform/index.ts` too); alone,
//         `**` is every path.
//   *     inside a segment: any number of characters, also none, but never a slash.
//         `tsconfig*.json` is `tsconfig.json` and `tsconfig.base.json`; `platform/*/api.md` is the
//         `api.md` of every package; `*` alone is every file directly at the root.
//   else  a character stands for itself. Upper and lower case differ.
//
// A name that starts with a dot is a name like any other: `*` matches `.gitignore`, `**` reaches
// into `.github`. (A shell hides such names; a register that fences paths must not.)
//
// What other glob dialects know and this one does not (`?`, `[a-z]`, `{a,b}`, a leading `!`, a
// backslash) is refused as a malformed pattern, never read as a literal character: whoever writes
// `*.{js,ts}` expects it to mean something. `<` and `>` are refused as well: they mark a
// placeholder that was not filled in (tools/src/ownership.ts).

/** A compiled pattern. */
export interface Glob {
  /** The pattern as it was written. */
  readonly pattern: string;
  /** True if the path (from the root, with forward slashes) matches. */
  matches(path: string): boolean;
  /**
   * What every `*` of the pattern stands for in this path, in the order of the pattern; undefined
   * if the path does not match. `**` is not part of the list.
   */
  captures(path: string): string[] | undefined;
}

/** Characters with a meaning in other glob dialects, or reserved for placeholders. */
const NOT_UNDERSTOOD = /[?[\]{}\\<>]/u;

/** A text as a piece of a regular expression that matches exactly this text. */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

/**
 * What is wrong with a pattern, as short phrases that follow its name («… is empty»); an empty
 * list for a pattern this matcher understands.
 */
export function globProblems(pattern: string): string[] {
  if (pattern === '') {
    return ['is empty'];
  }
  const problems: string[] = [];
  const odd = NOT_UNDERSTOOD.exec(pattern)?.[0];
  if (odd !== undefined) {
    problems.push(`uses «${odd}», which this matcher does not understand (only «*» and «**»)`);
  }
  if (pattern.startsWith('!')) {
    problems.push('starts with «!»: a pattern says what matches, never what does not');
  }
  if (pattern !== pattern.trim()) {
    problems.push('starts or ends with white space');
  }
  if (pattern.startsWith('/')) {
    problems.push('starts with a slash: a pattern is a path from the root of the repository');
  }
  if (pattern.endsWith('/')) {
    problems.push('ends with a slash: a pattern names files, write «<directory>/**»');
  }
  const segments = pattern.replace(/^\/+|\/+$/g, '').split('/');
  if (segments.includes('')) {
    problems.push('has an empty segment («//»)');
  }
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    problems.push('has a segment «.» or «..»: a pattern is a plain path from the root');
  }
  if (segments.some((segment) => segment.includes('**') && segment !== '**')) {
    problems.push('uses «**» inside a segment: «**» stands alone between two slashes');
  }
  if (segments.some((segment, index) => segment === '**' && segments[index + 1] === '**')) {
    problems.push('repeats «**»: once is enough');
  }
  return problems;
}

/** A whole segment of a path: never empty. */
const SEGMENT = '[^/]+';

/**
 * The regular expression of one segment that is not `**`: every `*` becomes a capture. A `*`
 * that is the whole segment stands for a whole name, so it never matches an empty one.
 */
function segmentSource(segment: string): string {
  return segment === '*' ? `(${SEGMENT})` : segment.split('*').map(escapeRegExp).join('([^/]*)');
}

// The regular expression of a whole pattern. `**` takes the slash next to it along, so that in
// the middle it can stand for no segment at all: `a/**/b` is `a/b` as well as `a/x/y/b`.
function source(segments: readonly string[]): string {
  return segments
    .map((segment, index) => {
      const last = index === segments.length - 1;
      if (segment === '**') {
        // Before a segment: any number of segments, each with the slash after it. At the end:
        // at least one, each with the slash before it (what is inside, not the directory
        // itself). Alone: any path.
        if (!last) {
          return `(?:${SEGMENT}/)*`;
        }
        return index === 0 ? `${SEGMENT}(?:/${SEGMENT})*` : `(?:/${SEGMENT})+`;
      }
      const beforeClosingStars = index === segments.length - 2 && segments[index + 1] === '**';
      return segmentSource(segment) + (last || beforeClosingStars ? '' : '/');
    })
    .join('');
}

/** Compiles a pattern. Throws for a pattern `globProblems` finds fault with. */
export function compileGlob(pattern: string): Glob {
  const problems = globProblems(pattern);
  if (problems.length > 0) {
    throw new Error(`The pattern «${pattern}» ${problems.join('; ')}.`);
  }
  const matcher = new RegExp(`^${source(pattern.split('/'))}$`, 'u');
  const captures = (path: string): string[] | undefined => {
    const match = matcher.exec(path);
    return match === null ? undefined : match.slice(1);
  };
  return { pattern, matches: (path) => matcher.test(path), captures };
}

/** True if the path matches the pattern. For many paths, compile the pattern once instead. */
export function matchesGlob(pattern: string, path: string): boolean {
  return compileGlob(pattern).matches(path);
}

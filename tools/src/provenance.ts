import { compileGlob, globProblems } from './globs.ts';
import { byCodeUnit, linesOf, type Problem, type RepoFile } from './repo-files.ts';

/**
 * Provenance (Herkunft): where the copied files of the suite come from.
 *
 * A source file that was copied or adapted from another repository starts with one line per
 * file it comes from:
 *
 *     // Origin: BanioX/<Repo> <path> @ <commit> — unchanged
 *     // Origin: BanioX/<Repo> <path> @ <commit> — adapted: <short what>
 *
 * `docs/herkunft.md` holds two tables: one generated from these lines (`node
 * tools/provenance.mjs` rewrites it between two marker comments) and one kept by hand for copied
 * files that cannot carry such a line (JSON and dot files) or were set up after a pattern. The
 * guard fails when the generated table is out of date, a header is malformed or misplaced, a
 * table does not start with its head, a row names a file that does not exist, or a row does not
 * say «unchanged» or «adapted».
 *
 * What this cannot check: that a file marked «unchanged» really equals its source, and that a
 * copied file without a header is listed at all. The source repositories are not part of this
 * one, so both stay with whoever copies.
 */

/** The document the tables live in, from the root of the repository. */
export const PROVENANCE_DOCUMENT = 'docs/herkunft.md';

export const GENERATED_START = '<!-- provenance:generated:start -->';
export const GENERATED_END = '<!-- provenance:generated:end -->';
export const MANUAL_START = '<!-- provenance:manual:start -->';
export const MANUAL_END = '<!-- provenance:manual:end -->';

/** Files that can start with a `//` comment and therefore carry their own header. */
const SOURCE_FILE = /\.(?:[cm]?[jt]s|[jt]sx)$/;

/** The header, exactly: one space between the parts, an em dash, nothing after the end. */
const ORIGIN_HEADER =
  /^\/\/ Origin: (BanioX\/[A-Za-z0-9][A-Za-z0-9._-]*) (\S+) @ ([0-9a-f]{7,40}) — (?:(unchanged)|adapted: (\S(?:.*\S)?))$/u;

/**
 * A line that is meant as a header, whether it is well formed or not. A line comment that starts
 * with «Origin:» is always read as one, so a sloppy header is reported instead of overlooked;
 * a comment about another kind of origin is worded differently.
 */
const HEADER_LIKE = /^\s*\/\/\s*origin\s*:/i;

/** Where a file comes from, as its header says. */
export interface Origin {
  /** `BanioX/<Repo>`. */
  repo: string;
  /** Path of the source file in that repository. */
  path: string;
  /** Commit of the source repository the file was taken at, 7 to 40 hex digits. */
  commit: string;
  kind: 'unchanged' | 'adapted';
  /** What was changed; empty for an unchanged file. */
  what: string;
}

/** A row of the generated table: a file of the suite and one of its sources. */
export interface ProvenanceRow extends Origin {
  /** Path of the file in the suite. */
  file: string;
}

/** The origin a line states, or undefined if the line is not exactly a provenance header. */
export function parseOriginHeader(line: string): Origin | undefined {
  const match = ORIGIN_HEADER.exec(line);
  const [, repo, path, commit, unchanged, what] = match ?? [];
  if (repo === undefined || path === undefined || commit === undefined) {
    return undefined;
  }
  return unchanged === undefined
    ? { repo, path, commit, kind: 'adapted', what: what ?? '' }
    : { repo, path, commit, kind: 'unchanged', what: '' };
}

/** True if the line is exactly a provenance header. */
export function isOriginHeader(line: string): boolean {
  return ORIGIN_HEADER.test(line);
}

/** True if a file of this name can carry a provenance header. */
export function canCarryHeader(path: string): boolean {
  return SOURCE_FILE.test(path);
}

/**
 * The headers of one source file. They stand at the very start (after a `#!` line, if there is
 * one), one below the other. A header that is malformed, stands anywhere else or names the same
 * source twice is a problem.
 */
export function readOrigins(file: RepoFile): { rows: ProvenanceRow[]; problems: Problem[] } {
  const rows: ProvenanceRow[] = [];
  const problems: Problem[] = [];
  const lines = linesOf(file.text);
  const first = lines[0]?.startsWith('#!') === true ? 1 : 0;
  let leading = true;
  lines.forEach((line, index) => {
    if (index < first) {
      return;
    }
    if (!HEADER_LIKE.test(line)) {
      leading = false;
      return;
    }
    const origin = parseOriginHeader(line);
    if (origin === undefined) {
      problems.push({
        path: file.path,
        line: index + 1,
        message:
          'malformed provenance header: write «// Origin: BanioX/<Repo> <path> @ <commit> — unchanged» or «… — adapted: <what>»',
      });
    } else if (!leading) {
      problems.push({
        path: file.path,
        line: index + 1,
        message: 'provenance header is not at the start of the file',
      });
    } else if (rows.some((row) => row.repo === origin.repo && row.path === origin.path)) {
      problems.push({
        path: file.path,
        line: index + 1,
        message: `provenance header names ${origin.repo} ${origin.path} twice`,
      });
    } else {
      rows.push({ file: file.path, ...origin });
    }
  });
  return { rows, problems };
}

/**
 * The rows of the generated table for the given files, sorted (by file, then by source), and
 * the problems of their headers. Files that cannot carry a header are not read.
 */
export function provenanceRows(files: readonly RepoFile[]): {
  rows: ProvenanceRow[];
  problems: Problem[];
} {
  const read = files.filter((file) => canCarryHeader(file.path)).map(readOrigins);
  return {
    rows: read
      .flatMap((result) => result.rows)
      .sort(
        (a, b) =>
          byCodeUnit(a.file, b.file) || byCodeUnit(a.repo, b.repo) || byCodeUnit(a.path, b.path),
      ),
    problems: read.flatMap((result) => result.problems),
  };
}

// --- The document ---

const KIND_LABEL = { unchanged: 'unverändert', adapted: 'angepasst' } as const;
const TABLE_TITLES = '| Datei der Suite | Quelle | Commit | Art | Was geändert wurde |';
const TABLE_HEAD = [TABLE_TITLES, '| --- | --- | --- | --- | --- |'];
const NO_ROWS = '_Noch trägt keine Datei einen Herkunftsvermerk._';

/** A text as the content of a table cell. */
function cell(text: string): string {
  return text.replaceAll('|', '\\|');
}

/** The generated table, without the markers around it. */
export function renderGenerated(rows: readonly ProvenanceRow[]): string {
  if (rows.length === 0) {
    return NO_ROWS;
  }
  return [
    ...TABLE_HEAD,
    ...rows.map(
      (row) =>
        `| \`${row.file}\` | ${row.repo} \`${row.path}\` | \`${row.commit}\` | ${KIND_LABEL[row.kind]} | ${row.kind === 'adapted' ? cell(row.what) : '–'} |`,
    ),
  ].join('\n');
}

/** Where two markers stand in a document, each on a line of its own, the first above the second. */
function markers(
  lines: readonly string[],
  start: string,
  end: string,
): { from: number; to: number } | undefined {
  const from = lines.findIndex((line) => line.trim() === start);
  const to = lines.findIndex((line) => line.trim() === end);
  return from === -1 || to <= from ? undefined : { from, to };
}

/**
 * The document with its generated table replaced by the given rows. Everything outside the two
 * markers stays as it is, and running it twice gives the same text. Fails if the markers are
 * missing.
 */
export function updateGenerated(document: string, rows: readonly ProvenanceRow[]): string {
  const lines = document.split('\n');
  const block = markers(lines, GENERATED_START, GENERATED_END);
  if (block === undefined) {
    throw new Error(
      `${PROVENANCE_DOCUMENT} needs the lines ${GENERATED_START} and ${GENERATED_END}, in this order.`,
    );
  }
  return [
    ...lines.slice(0, block.from + 1),
    ...renderGenerated(rows).split('\n'),
    ...lines.slice(block.to),
  ].join('\n');
}

const CODE = /^`([^`]+)`$/;
const SOURCE_CELL = /^BanioX\/[A-Za-z0-9][A-Za-z0-9._-]* `[^`]+`$/;
const COMMIT_CELL = /^`[0-9a-f]{7,40}`$/;

/**
 * The problems of one table of the document. The table starts with its head, so that no row is
 * taken for a head and passed over. Every row names a file of the suite that exists (a path as
 * in tools/src/globs.ts: a `*` stands for one part of a path, for «the same file in every
 * package»), a source, a commit and «unverändert» or «angepasst» with what was changed. In the
 * table kept by hand, a file that carries its own header is a problem too: it belongs to the
 * generated table.
 */
function rowProblems(
  lines: readonly string[],
  block: { from: number; to: number },
  paths: readonly string[],
  withHeader: ReadonlySet<string>,
): Problem[] {
  const table = lines
    .map((line, index) => ({ text: line.trim(), line: index + 1 }))
    .slice(block.from + 1, block.to)
    .filter((row) => row.text.startsWith('|'));
  const [first] = table;
  if (first === undefined) {
    return [];
  }
  const headed = TABLE_HEAD.every((head, index) => table[index]?.text === head);
  const problem = (line: number, message: string): Problem => ({
    path: PROVENANCE_DOCUMENT,
    line,
    message,
  });
  return [
    // Without its head, every line of the table is read as a row: nothing is skipped unseen.
    ...(headed ? [] : [problem(first.line, `the table starts with its head: ${TABLE_TITLES}`)]),
    ...table.slice(headed ? TABLE_HEAD.length : 0).flatMap(({ text, line }) => {
      const cells = text
        .replace(/^\||\|$/g, '')
        .split(/(?<!\\)\|/)
        .map((part) => part.trim());
      const [file, source, commit, kind, what] = cells;
      const pattern = CODE.exec(file ?? '')?.[1];
      if (cells.length !== 5 || pattern === undefined) {
        return [problem(line, 'a row has five cells, the first a path in backticks')];
      }
      const flaws = globProblems(pattern);
      if (flaws.length > 0) {
        return [problem(line, `the path «${pattern}» ${flaws.join('; ')}`)];
      }
      const names = compileGlob(pattern);
      const found = paths.filter((path) => names.matches(path));
      return [
        ...(found.length === 0 ? [`names a file that does not exist: ${pattern}`] : []),
        ...found
          .filter((path) => withHeader.has(path))
          .map((path) => `${path} carries its own header and is listed by hand as well`),
        ...(SOURCE_CELL.test(source ?? '')
          ? []
          : [`${pattern}: the source is written «BanioX/<Repo> \`<path>\`»`]),
        ...(COMMIT_CELL.test(commit ?? '')
          ? []
          : [`${pattern}: the commit is 7 to 40 hex digits in backticks`]),
        ...(kind === KIND_LABEL.unchanged || kind === KIND_LABEL.adapted
          ? []
          : [`${pattern}: says neither «${KIND_LABEL.unchanged}» nor «${KIND_LABEL.adapted}»`]),
        ...(kind === KIND_LABEL.adapted && (what === undefined || what === '' || what === '–')
          ? [`${pattern}: an adapted file says what was changed`]
          : []),
      ].map((message) => problem(line, message));
    }),
  ];
}

/** What the provenance guard looks at. */
export interface ProvenanceInput {
  /** The text files of the repository. */
  files: readonly RepoFile[];
  /** Every path of the repository, to tell whether a listed file exists. */
  paths: readonly string[];
  /** The text of `docs/herkunft.md`, or undefined if the file is missing. */
  document: string | undefined;
}

/** Everything that is wrong with the provenance of the repository. */
export function provenanceProblems({ files, paths, document }: ProvenanceInput): Problem[] {
  const { rows, problems } = provenanceRows(files);
  const inDocument = (message: string): Problem => ({
    path: PROVENANCE_DOCUMENT,
    line: 0,
    message,
  });
  if (document === undefined) {
    return [...problems, inDocument('the file is missing')];
  }
  const lines = document.split('\n');
  const generated = markers(lines, GENERATED_START, GENERATED_END);
  const manual = markers(lines, MANUAL_START, MANUAL_END);
  const none: ReadonlySet<string> = new Set();
  return [
    ...problems,
    ...(generated === undefined
      ? [inDocument(`the lines ${GENERATED_START} and ${GENERATED_END} are missing`)]
      : [
          ...(lines.slice(generated.from + 1, generated.to).join('\n') === renderGenerated(rows)
            ? []
            : [inDocument('the generated table is out of date: run «node tools/provenance.mjs»')]),
          ...rowProblems(lines, generated, paths, none),
        ]),
    ...(manual === undefined
      ? [inDocument(`the lines ${MANUAL_START} and ${MANUAL_END} are missing`)]
      : rowProblems(lines, manual, paths, new Set(rows.map((row) => row.file)))),
  ];
}

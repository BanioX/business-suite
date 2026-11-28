// `pnpm industry:new <id>`: a new industry from the pattern of the reference industry (suite
// ADR-0004, 9; order W0-02, step 9).
//
// How the pattern is kept: there is no template of its own. The generator reads
// `industries/muster/core` as it stands on disk and renames every identifier of `muster` into the
// namespace of the new id. `muster` is the living contract test of the platform and `pnpm check`
// keeps it green, so the pattern is always a working industry; a template beside it would be a
// second copy that has to be kept in step by hand. What keeps the renaming honest:
//
// - `leftoverProblems`: after renaming, every `muster` that is left, in any case, must be part of
//   a made-up name (`MADE_UP_NAMES`, «Betrieb Muster»). A new form of the id in the pattern that
//   the rules below do not rename stops the generator before it writes anything, and turns the
//   test of the tools red (tools/test/industry-new.test.ts renames the real pattern).
// - The renamed industry is checked like any other: tools/test/industry-acceptance.test.ts makes
//   `probe` in a copy of the repository and runs `pnpm check:industry probe` on it.
//
// The pure part is here; reading the repository and writing the files is in
// tools/industry-new.mjs. Node runs this file as it is (type stripping), so it uses erasable
// syntax only and imports no package of the workspace.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { WorkspacePackage } from './affected.ts';
import { INDUSTRIES_DIR } from './industries.ts';
import { byCodeUnit, readFiles } from './repo-files.ts';

/** The id of the reference industry, the pattern of every new one. */
export const TEMPLATE_ID = 'muster';

/** Where the pattern lives, from the root of the repository. */
export const TEMPLATE_DIR = `${INDUSTRIES_DIR}/${TEMPLATE_ID}/core`;

/**
 * The form of the id of an industry: `INDUSTRY_ID_PATTERN` of `@onestrand/manifest`, written down
 * here because plain Node cannot load the package (tools/test/industry-new.test.ts holds both
 * together). Lower-case letters and digits: the id is the prefix of tables (`<id>_…`),
 * operations (`<id>.…`) and events (`<id>_…`), so it holds neither a dot nor an underscore.
 */
export const INDUSTRY_ID_FORM = /^[a-z][a-z0-9]*$/;

/** Where an industry proposes its names (docs/zusammenarbeit.md, section 3). */
export const NAMES_DOCUMENT = 'NAMES.md';

/**
 * Words that are no industry: the roles and owners of the suite (registry/owners.json), the
 * directories of the repository and the parts of a package. An industry called like one of them
 * would read as something else in every owner, path and message.
 */
export const RESERVED_INDUSTRY_IDS: ReadonlySet<string> = new Set([
  'head',
  'platform',
  'industry',
  'industries',
  'edition',
  'editions',
  'facts',
  'onestrand',
  'tools',
  'tooling',
  'registry',
  'docs',
  'services',
  'core',
  'web',
  'src',
  'test',
]);

/**
 * The reserved words of JavaScript and TypeScript in the form of an id: the manifest of the
 * pattern is `export const muster = defineIndustry(…)`, so the id becomes the name of a constant,
 * and `export const new = …` does not parse.
 */
export const SCRIPT_WORDS: ReadonlySet<string> = new Set([
  'arguments',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'eval',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

/**
 * The made-up names of the pattern that hold the word «Muster» and stay as they are in a new
 * industry: they are typed data and texts of an invented business («Betrieb Muster»), never an
 * identifier (CLAUDE.md, rule 6), and the test of the exports allows exactly them
 * (`industries/muster/core/test/index.test.ts`). Every other `muster` is renamed.
 */
export const MADE_UP_NAMES: readonly string[] = [
  'Betrieb Muster',
  'Person Muster',
  'Eintrag Muster',
  'Musterweg',
  'Musterbetrieb',
  'Muster-App',
  '(?:Muster|Beispiel)',
];

/** A file of the pattern or of the new industry: a path from the root and its text. */
export interface IndustryFile {
  readonly path: string;
  readonly text: string;
}

/** The names a new industry takes from its id. */
export interface IndustryNaming {
  /** `probe`: the id, the prefix of tables, operations, events and every id of the registers. */
  readonly id: string;
  /** `Probe`: in the names of exports (`createProbeUseCases`) and as the title of its test edition. */
  readonly pascal: string;
  /** `PROBE`: in the names of constants (`PROBE_EVENT_TYPES`). */
  readonly upper: string;
  /** `industries/probe`. */
  readonly dir: string;
  /** `industries/probe/core`: the pure part. */
  readonly core: string;
  /** `@onestrand-industry/probe`. */
  readonly packageName: string;
  /** `probe-core`: its Vitest project (`vitestProject` in tools/src/affected.ts). */
  readonly project: string;
}

export function namingOf(id: string): IndustryNaming {
  const dir = `${INDUSTRIES_DIR}/${id}`;
  return {
    id,
    pascal: `${id.charAt(0).toUpperCase()}${id.slice(1)}`,
    upper: id.toUpperCase(),
    dir,
    core: `${dir}/core`,
    packageName: `@onestrand-industry/${id}`,
    project: `${id}-core`,
  };
}

/**
 * The text of a file of the pattern with every identifier of `muster` in the namespace of `id`:
 *
 * - `muster` in lower case, wherever it stands: the id, its prefixes (`muster.`, `muster_`,
 *   `muster:`, `muster-backup`, `muster-core`), the package name and the names of exports that
 *   begin with it (`musterContract`);
 * - `MUSTER` in upper case: the constants (`MUSTER`, `MUSTER_EVENT_TYPES`);
 * - `Muster` inside a name in camel case (`createMusterUseCases`, `MusterEventType`), and the
 *   one-word text `'Muster'` (the title of the test edition).
 *
 * `Muster` as a word of a made-up name stays («Betrieb Muster», «Musterweg 12»).
 */
export function renameText(text: string, id: string): string {
  const { pascal, upper } = namingOf(id);
  return text
    .replace(/muster/g, () => id)
    .replace(/MUSTER/g, () => upper)
    .replace(/(?<=[a-z0-9])Muster|Muster(?=[A-Z])/g, () => pascal)
    .replace(/(['"`])Muster\1/g, (_match, quote: string) => `${quote}${pascal}${quote}`);
}

/** A `muster` that the renaming left in a file and that is no made-up name. */
export interface Leftover {
  readonly path: string;
  /** 1 for the first line. */
  readonly line: number;
  /** The line it stands in, trimmed. */
  readonly text: string;
}

/** The ranges of a text that one of the made-up names covers. */
function madeUpRanges(text: string): [number, number][] {
  const ranges: [number, number][] = [];
  for (const name of MADE_UP_NAMES) {
    let at = text.indexOf(name);
    while (at !== -1) {
      ranges.push([at, at + name.length]);
      at = text.indexOf(name, at + 1);
    }
  }
  return ranges;
}

/**
 * Every `muster`, in any case, that is not part of a made-up name. After `renameText` there must
 * be none: one that is left is a form of the id the renaming does not know, and the new industry
 * would still carry a name of `muster`.
 */
export function leftoverProblems(files: readonly IndustryFile[]): Leftover[] {
  return files.flatMap((file) => {
    const covered = madeUpRanges(file.text);
    return [...file.text.matchAll(/muster/gi)]
      .filter(({ index }) => !covered.some(([from, to]) => index >= from && index < to))
      .map(({ index }) => {
        const before = file.text.slice(0, index);
        const start = before.lastIndexOf('\n') + 1;
        const end = file.text.indexOf('\n', index);
        return {
          path: file.path,
          line: before.split('\n').length,
          text: file.text.slice(start, end === -1 ? undefined : end).trim(),
        };
      });
  });
}

/**
 * The words the pattern itself uses as an id or a value: every text in quotes in its TypeScript
 * that is such a word, or begins with one before `-`, `:`, `.`, `_` or `/` (`'zwilling'`,
 * `'sample-backup'`, `'view'`). Renamed into one of them, a copy would meet a name of its own
 * tests: with the id `zwilling`, the test «two industries with the same operation» would declare
 * the industry twice. Mapped to the first file that uses the word.
 */
export function patternWords(files: readonly IndustryFile[]): Map<string, string> {
  const words = new Map<string, string>();
  for (const file of files.filter(({ path }) => path.endsWith('.ts'))) {
    for (const match of file.text.matchAll(/(['"`])((?:(?!\1)[^\\\n])*)\1/g)) {
      const word = /^([a-z][a-z0-9]*)(?:[-:._/]|$)/.exec(match[2] ?? '')?.[1];
      if (word !== undefined && !words.has(word)) {
        words.set(word, file.path);
      }
    }
  }
  return words;
}

/** An entry of `registry/names.json`, as far as the generator reads it. */
export interface RegisterName {
  readonly kind: string;
  readonly name: string;
  readonly owner: string;
  readonly status?: string;
}

/** What the id of a new industry must not meet. */
export interface IdContext {
  /** The directories under `industries/`. */
  readonly industries: readonly string[];
  /** The directories under `platform/`: the names of the platform packages. */
  readonly platformPackages: readonly string[];
  /** The packages of the workspace, with the names of their Vitest projects. */
  readonly workspace: readonly WorkspacePackage[];
  /** The entries of `registry/names.json`. */
  readonly register: readonly RegisterName[];
  /** The words the pattern uses itself (`patternWords`). */
  readonly patternWords: ReadonlyMap<string, string>;
}

/** True if the name lies in the namespace of the industry `id`. */
function inNamespace(name: string, id: string): boolean {
  return (
    name === id ||
    name.startsWith(`${id}.`) ||
    name.startsWith(`${id}_`) ||
    name === namingOf(id).packageName
  );
}

/** Why `id` cannot be the id of a new industry; empty when it can. */
export function industryIdProblems(id: string, context: IdContext): string[] {
  if (!INDUSTRY_ID_FORM.test(id)) {
    return [
      `"${id}" is no id of an industry: lower-case letters and digits, starting with a letter (${String(INDUSTRY_ID_FORM)}), because it is the prefix of tables (<id>_…), operations (<id>.…) and events`,
    ];
  }
  const naming = namingOf(id);
  const problems: string[] = [];
  if (context.industries.includes(id)) {
    problems.push(`${naming.dir} exists already: an industry is made once`);
  }
  if (context.platformPackages.includes(id)) {
    problems.push(
      `"${id}" is a package of the platform (platform/${id}): its ids and its industry would share one name`,
    );
  }
  if (RESERVED_INDUSTRY_IDS.has(id)) {
    problems.push(
      `"${id}" is reserved: it names a role, a directory or a part of a package of the suite`,
    );
  }
  if (SCRIPT_WORDS.has(id)) {
    problems.push(
      `"${id}" is a reserved word of JavaScript: the manifest of the industry is the constant of that name (export const ${id} = defineIndustry(…))`,
    );
  }
  if (id !== TEMPLATE_ID && id.includes(TEMPLATE_ID)) {
    problems.push(
      `"${id}" holds the id of the pattern "${TEMPLATE_ID}": what the renaming leaves could not be told from a name of the pattern`,
    );
  }
  const usedBy = context.patternWords.get(id);
  if (usedBy !== undefined && id !== TEMPLATE_ID) {
    problems.push(
      `"${id}" is a word the pattern uses itself (${usedBy}): renamed into it, the copy would clash with its own tests`,
    );
  }
  // A package in the directory of the new industry is the industry that exists (said above).
  for (const known of context.workspace.filter(({ dir }) => dir !== naming.core)) {
    if (known.name === naming.packageName) {
      problems.push(`the package ${naming.packageName} exists already (${known.dir})`);
    }
    if (known.project === naming.project) {
      problems.push(
        `the Vitest project ${naming.project} exists already (${known.dir}): pnpm check --affected would test the wrong package`,
      );
    }
  }
  const taken = new Map<string, string[]>();
  for (const entry of context.register) {
    if (inNamespace(entry.name, id) && entry.owner !== `industry:${id}`) {
      taken.set(entry.owner, [...(taken.get(entry.owner) ?? []), entry.name]);
    }
  }
  for (const [owner, names] of taken) {
    const shown = names.slice(0, 3).join(', ');
    const more = names.length > 3 ? ` and ${String(names.length - 3)} more` : '';
    problems.push(
      `registry/names.json gives names in the namespace of "${id}" to ${owner} (${shown}${more}): the namespace is taken`,
    );
  }
  return problems;
}

/** A name the new industry proposes for the register: a kind and an identifier. */
export interface ProposedName {
  readonly kind: string;
  readonly name: string;
}

/**
 * The names of the pattern in the register (`owner: "industry:muster"`, active), renamed into the
 * namespace of `id`, in the order of the register. The names guard keeps the active names of
 * `muster` and its code in step, so these are exactly the names the new industry uses.
 */
export function nameProposal(register: readonly RegisterName[], id: string): ProposedName[] {
  return register
    .filter((entry) => entry.owner === `industry:${TEMPLATE_ID}` && entry.status !== 'reserved')
    .map((entry) => ({ kind: entry.kind, name: renameText(entry.name, id) }));
}

/** The lines the head enters in `registry/names.json` for the proposal. */
export function registerLines(proposal: readonly ProposedName[], id: string): string[] {
  return proposal.map(({ kind, name }) =>
    JSON.stringify({ kind, name, owner: `industry:${id}`, status: 'active' }),
  );
}

/** One row of the table in NAMES.md: `| \`kind\` | \`name\` | …`. */
const PROPOSAL_ROW = /^\|\s*`([a-z]+)`\s*\|\s*`([^`]+)`\s*\|/;

/**
 * The proposal of an industry for the register, in `industries/<id>/NAMES.md` (docs/zusammenarbeit.md,
 * section 3): German like every document, one table that `proposedNames` reads back.
 */
export function namesDocument(id: string, proposal: readonly ProposedName[]): string {
  const rows = proposal.map(({ kind, name }) => `| \`${kind}\` | \`${name}\` |`);
  return [
    `# Namen der Branche \`${id}\``,
    '',
    `Vorschlag für das Namensregister ([\`registry/names.json\`](../../registry/names.json)), jede Zeile mit \`owner: "industry:${id}"\` und \`status: "active"\`. Nur der Kopf schreibt das Register ([\`docs/zusammenarbeit.md\`](../../docs/zusammenarbeit.md), Abschnitt 3); bis er die Zeilen eingetragen hat, ist \`pnpm names\` rot, und das ist Absicht.`,
    '',
    `Angelegt mit \`pnpm industry:new ${id}\` nach dem Muster von \`${TEMPLATE_DIR}\`. Wer eine Kennung anlegt, ändert oder entfernt, führt diese Tabelle im selben Schritt nach. \`pnpm check:industry ${id}\` liest sie und sagt für jede Kennung der Branche, ob sie im Register steht oder hier vorgeschlagen ist. Betriebsarten, Fragen, Gerätemodi, Optionen, Vorlagen und Regelwerke haben im Register noch keine Art (Schuld TD-52) und stehen darum nicht hier.`,
    '',
    '| Art | Kennung |',
    '| --- | --- |',
    ...rows,
    '',
  ].join('\n');
}

/** The names a NAMES.md proposes, in the order of its table. */
export function proposedNames(markdown: string): ProposedName[] {
  return markdown.split(/\r?\n/).flatMap((line) => {
    const row = PROPOSAL_ROW.exec(line.trim());
    return row === null ? [] : [{ kind: row[1] ?? '', name: row[2] ?? '' }];
  });
}

/** What the person does after the generator, in order. */
export function nextSteps(id: string): string[] {
  const { dir, core } = namingOf(id);
  return [
    `pnpm install: links ${core} into the workspace (pnpm-lock.yaml gets the importer; the lockfile is the head's, docs/zusammenarbeit.md, section 3)`,
    `pnpm check:industry ${id}: the new industry passes before anything is changed`,
    `replace the journal of the pattern with the domain of the industry: tables, contract, use cases, register entries, template, rule sets with a source under docs/fakten/, demo, the texts in ${core}/test/messages.ts and the comments`,
    `keep ${dir}/${NAMES_DOCUMENT} in step with the identifiers; the head enters them in registry/names.json (pnpm names is red until then, on purpose)`,
    `the head adds the words that give the industry away to tools/src/words/${id}.ts, before its first code`,
    `pnpm check:industry ${id}, then pnpm check, until ALL=GREEN`,
  ];
}

/** A new industry, ready to be written: nothing of it is on disk yet. */
export interface IndustryPlan {
  readonly naming: IndustryNaming;
  /** Every file of the new industry, by path from the root, sorted; the pattern renamed and its NAMES.md. */
  readonly files: readonly IndustryFile[];
  readonly proposal: readonly ProposedName[];
}

/** The repository as far as a new industry depends on it. */
export interface Repository {
  /** The files of the pattern, by path from the root, sorted. */
  readonly template: readonly IndustryFile[];
  /** Files of the pattern whose content is binary: the generator copies text only. */
  readonly binary: readonly string[];
  readonly context: IdContext;
}

function directories(root: string, under: string): string[] {
  const at = join(root, under);
  return existsSync(at)
    ? readdirSync(at, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort(byCodeUnit)
    : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The entries of the register; an unreadable register is an error, never an empty one. */
export function registerNames(text: string): RegisterName[] {
  const data: unknown = JSON.parse(text);
  const names = isRecord(data) ? data.names : undefined;
  if (!Array.isArray(names)) {
    throw new Error('registry/names.json has no list «names»');
  }
  return names.flatMap((entry: unknown) =>
    isRecord(entry) &&
    typeof entry.kind === 'string' &&
    typeof entry.name === 'string' &&
    typeof entry.owner === 'string'
      ? [
          {
            kind: entry.kind,
            name: entry.name,
            owner: entry.owner,
            ...(typeof entry.status === 'string' ? { status: entry.status } : {}),
          },
        ]
      : [],
  );
}

/** Reads what the generator needs from the repository at `root`. */
export function readRepository(root: string, workspace: readonly WorkspacePackage[]): Repository {
  const { text, binary } = readFiles(root, TEMPLATE_DIR);
  return {
    template: text,
    binary,
    context: {
      industries: directories(root, INDUSTRIES_DIR),
      platformPackages: directories(root, 'platform'),
      workspace,
      register: registerNames(readFileSync(join(root, 'registry/names.json'), 'utf8')),
      patternWords: patternWords(text),
    },
  };
}

/**
 * The new industry `id` from the pattern, or why there is none. Deterministic: the same pattern,
 * register and id give the same files, byte for byte (before the formatter of the repository,
 * which the script runs, and which is deterministic as well).
 */
export function planIndustry(
  repository: Repository,
  id: string,
): { problems: string[]; plan?: IndustryPlan } {
  const problems = industryIdProblems(id, repository.context);
  if (problems.length > 0) {
    return { problems };
  }
  const naming = namingOf(id);
  if (repository.template.length === 0) {
    return { problems: [`the pattern ${TEMPLATE_DIR} has no files`] };
  }
  if (repository.binary.length > 0) {
    return {
      problems: repository.binary.map(
        (path) =>
          `${path} is binary: the pattern holds text only, so nothing in it escapes the renaming`,
      ),
    };
  }
  const renamed = repository.template.map((file) => ({
    path: `${naming.core}${file.path.slice(TEMPLATE_DIR.length)}`,
    text: renameText(file.text, id),
  }));
  const leftovers = leftoverProblems(renamed).map(
    (left) =>
      `${left.path}:${String(left.line)}: «${left.text}» still says muster: rename this form of the id in tools/src/industry-new.ts (renameText), or add the made-up name to MADE_UP_NAMES`,
  );
  if (leftovers.length > 0) {
    return { problems: leftovers };
  }
  const proposal = nameProposal(repository.context.register, id);
  if (proposal.length === 0) {
    return {
      problems: [
        `registry/names.json has no active name of "industry:${TEMPLATE_ID}", so there is nothing to propose`,
      ],
    };
  }
  const files = [
    ...renamed,
    { path: `${naming.dir}/${NAMES_DOCUMENT}`, text: namesDocument(id, proposal) },
  ].sort((a, b) => byCodeUnit(a.path, b.path));
  return { problems: [], plan: { naming, files, proposal } };
}

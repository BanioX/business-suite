// The name register (docs/architektur.md, 3.4; ADR-0004, 4; order W0-01, step 3): an identifier
// that reaches a device or a backup is never renamed and never used twice, so each one stands in
// `registry/names.json` before it is used. Only the head writes the register; an industry proposes
// its names in its pull request. `pnpm names` compares the register with the code.
//
// The register:
//
//   {
//     "about": "<one line for whoever opens the file>",
//     "version": 1,
//     "names": [
//       { "kind": "package", "name": "@onestrand/core", "owner": "platform", "status": "active" },
//       { "kind": "table", "name": "businesses", "owner": "platform", "status": "active" },
//       { "kind": "unit", "name": "m2", "owner": "platform", "status": "reserved", "note": "…" }
//     ]
//   }
//
// - `kind`: what the identifier names. The guard reads these kinds from the code: `package` (the
//   name in every package.json of the workspace), `table` (the tables the storage keeps for
//   itself) and `unit` (the units of the platform). Operations, events, features, tables of
//   modules and the frozen names of an edition get their kinds with the packages that carry them.
// - `name`: the identifier, in the form of its kind.
// - `owner`: `head`, `platform` or `industry:<id>`: who may use the name.
// - `status`: `active` (the code uses it) or `reserved` (held for later, so nobody else takes it).
// - `note`: free text, optional.
//
// The checks, each a problem that names the kind and the identifier:
//
// 1. The register is well formed: known fields only, a known kind, a name in the form of its kind.
// 2. No identifier stands twice under one kind.
// 3. Every identifier the code uses stands in the register (a missing one).
// 4. Every `active` identifier is used by the code (one that is gone: a name that was shipped is
//    not removed from the register, it is marked `reserved` with a note).
//
// What this cannot check: identifiers of kinds it does not read yet, and a name built at run time.
import type { Problem } from './repo-files.ts';

/** The register, from the root of the repository. */
export const NAMES_PATH = 'registry/names.json';

/** The kinds of identifiers the register holds. */
export const NAME_KINDS = ['package', 'table', 'unit'] as const;

export type NameKind = (typeof NAME_KINDS)[number];

/** Whether the code uses a name, or the head holds it for later. */
export const NAME_STATUSES = ['active', 'reserved'] as const;

export type NameStatus = (typeof NAME_STATUSES)[number];

/** The form of an identifier, by kind. */
const NAME_FORM: Readonly<Record<NameKind, RegExp>> = {
  package: /^@onestrand\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
  table: /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/,
  unit: /^[a-z][a-z0-9_]*$/,
};

const OWNER = /^(?:head|platform|industry:[a-z][a-z0-9]*(?:-[a-z0-9]+)*)$/;

const TOP_LEVEL = ['about', 'version', 'names'];
const ENTRY_FIELDS = ['kind', 'name', 'owner', 'status', 'note'];

/** One identifier of the register. */
export interface NameEntry {
  readonly kind: NameKind;
  readonly name: string;
  readonly owner: string;
  readonly status: NameStatus;
  readonly note?: string;
}

/** An identifier the code uses, and the file that says so. */
export interface UsedName {
  readonly kind: NameKind;
  readonly name: string;
  /** Path from the root of the repository, with forward slashes. */
  readonly path: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isKind(value: unknown): value is NameKind {
  return NAME_KINDS.some((kind) => kind === value);
}

function isStatus(value: unknown): value is NameStatus {
  return NAME_STATUSES.some((status) => status === value);
}

function problem(message: string): Problem {
  return { path: NAMES_PATH, line: 0, message };
}

/** Keys of an object that the format does not know: a typo must not go unnoticed. */
function unknownKeys(value: Record<string, unknown>, known: readonly string[]): string[] {
  return Object.keys(value).filter((key) => !known.includes(key));
}

/** One entry as it was read, or the reasons why it is none. */
function readEntry(value: unknown, where: string): NameEntry | string[] {
  if (!isRecord(value)) {
    return [`${where}: an entry is an object with kind, name, owner and status`];
  }
  const reasons = unknownKeys(value, ENTRY_FIELDS).map((key) => `${where}: unknown field "${key}"`);
  const { kind, name, owner, status, note } = value;
  if (!isKind(kind)) {
    reasons.push(`${where}: kind must be one of ${NAME_KINDS.join(', ')}`);
  }
  if (typeof name !== 'string') {
    reasons.push(`${where}: name must be a text`);
  } else if (isKind(kind) && !NAME_FORM[kind].test(name)) {
    reasons.push(`${where}: "${name}" has not the form of a ${kind} (${String(NAME_FORM[kind])})`);
  }
  if (typeof owner !== 'string' || !OWNER.test(owner)) {
    reasons.push(`${where}: owner must be head, platform or industry:<id>`);
  }
  if (!isStatus(status)) {
    reasons.push(`${where}: status must be one of ${NAME_STATUSES.join(', ')}`);
  }
  if (note !== undefined && typeof note !== 'string') {
    reasons.push(`${where}: note must be a text`);
  }
  if (
    reasons.length > 0 ||
    !isKind(kind) ||
    typeof name !== 'string' ||
    typeof owner !== 'string' ||
    !isStatus(status)
  ) {
    return reasons;
  }
  return { kind, name, owner, status, ...(typeof note === 'string' ? { note } : {}) };
}

/**
 * Reads the register. `text` is the content of `registry/names.json`, or undefined if the file is
 * missing. Without problems the entries are returned; with problems there are none, so nothing is
 * compared with a register that is half read.
 */
export function readNames(text: string | undefined): {
  entries: readonly NameEntry[] | undefined;
  problems: Problem[];
} {
  if (text === undefined) {
    return { entries: undefined, problems: [problem('The name register is missing')] };
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { entries: undefined, problems: [problem(`The register is no JSON: ${reason}`)] };
  }
  if (!isRecord(data)) {
    return { entries: undefined, problems: [problem('The register must be a JSON object')] };
  }
  const reasons = unknownKeys(data, TOP_LEVEL).map((key) => `unknown field "${key}"`);
  if (data.version !== 1) {
    reasons.push('version must be 1');
  }
  const entries: NameEntry[] = [];
  if (!Array.isArray(data.names)) {
    reasons.push('names must be a list');
  } else {
    data.names.forEach((value: unknown, index) => {
      const entry = readEntry(value, `names[${String(index)}]`);
      if (Array.isArray(entry)) {
        reasons.push(...entry);
      } else {
        entries.push(entry);
      }
    });
  }
  const seen = new Set<string>();
  for (const entry of entries) {
    const key = `${entry.kind} ${entry.name}`;
    if (seen.has(key)) {
      reasons.push(`the ${entry.kind} "${entry.name}" stands twice`);
    }
    seen.add(key);
  }
  return reasons.length > 0
    ? { entries: undefined, problems: reasons.map(problem) }
    : { entries, problems: [] };
}

/**
 * The names of the packages of the workspace: the `name` of every package.json given, as far as
 * it belongs to the namespace of the suite. The root of the workspace has a name of its own kind
 * (it is no package anyone imports) and is left out.
 */
export function packageNames(files: readonly { path: string; text: string }[]): UsedName[] {
  return files
    .filter((file) => file.path.endsWith('/package.json'))
    .flatMap((file) => {
      let data: unknown;
      try {
        data = JSON.parse(file.text);
      } catch {
        // Not ours to report: the installer and the type check fail on such a file.
        return [];
      }
      const name = isRecord(data) ? data.name : undefined;
      return typeof name === 'string' && name.startsWith('@onestrand/')
        ? [{ kind: 'package' as const, name, path: file.path }]
        : [];
    });
}

/**
 * Everything that is wrong between the register and the code: an identifier the code uses twice
 * under one kind or without an entry, and an `active` entry the code does not use. `used` is what
 * the guard read from the code.
 */
export function namesProblems(entries: readonly NameEntry[], used: readonly UsedName[]): Problem[] {
  const problems: Problem[] = [];
  const registered = new Set(entries.map((entry) => `${entry.kind} ${entry.name}`));
  const usedAt = new Map<string, string>();
  for (const { kind, name, path } of used) {
    const key = `${kind} ${name}`;
    const first = usedAt.get(key);
    if (first !== undefined && first !== path) {
      problems.push({
        path,
        line: 0,
        message: `The ${kind} "${name}" is used twice: here and in ${first}`,
      });
    }
    usedAt.set(key, first ?? path);
    if (!registered.has(key) && first === undefined) {
      problems.push({
        path,
        line: 0,
        message: `The ${kind} "${name}" is not in the name register: the head enters it in ${NAMES_PATH} before it is used`,
      });
    }
  }
  for (const entry of entries) {
    if (entry.status === 'active' && !usedAt.has(`${entry.kind} ${entry.name}`)) {
      problems.push(
        problem(
          `The ${entry.kind} "${entry.name}" is active in the register, but the code does not use it: a name that was shipped stays, as reserved with a note`,
        ),
      );
    }
  }
  return problems;
}

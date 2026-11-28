// Path ownership (docs/zusammenarbeit.md, 2 and 10.12; order W0-01, step 3): many agents work in
// this repository at the same time, and each changes only the paths of its order. The register
// `registry/owners.json` says who owns which path and which order may write where; every commit
// says in its trailers for which order and in which role it was made; `pnpm ownership` checks
// that every commit changes only paths its order may write.
//
// The register (patterns as in tools/src/globs.ts: `**`, `*`, literal names):
//
//   {
//     "about": "<one line for whoever opens the file>",
//     "version": 1,
//     "owners": [
//       { "pattern": "platform/*/**", "owner": "platform:*" },
//       { "pattern": "industries/*/**", "owner": "industry:*" },
//       { "pattern": "**", "owner": "head" }
//     ],
//     "orders": {
//       "W0-01": { "role": "platform", "write": ["tools/**", "platform/core/**"] }
//     },
//     "orderRules": [
//       {
//         "order": "branche-*",
//         "role": "industry",
//         "write": ["industries/<id>/**", "docs/branchen/<name>*", "docs/branchen/<name>/**"]
//       }
//     ]
//   }
//
// - `owners`: the first pattern that matches a path names its owner: `head`, `facts`,
//   `platform:<package>` or `industry:<id>`. A `*` in the owner stands for what the first `*` of
//   the pattern matched (`industries/painting/core/x.ts` belongs to `industry:painting`); where
//   the pattern has none, it stays: `industry:*` is «an industry; the path does not say which».
//   The last pattern is `**`, so every path has an owner.
// - `orders`: what an order may write, and the role that works on it. The head enters an order
//   when it hands it out, with the paths of its document in docs/auftraege/.
// - `orderRules`: a family of orders that follow one pattern, so they need no entry each. `<name>`
//   is what the `*` of the order stands for, `<id>` the detail of the role trailer, or the name
//   where the trailer has none: `Order: branche-maler` with `Role: industry:painting` may write
//   `industries/painting/**`, `docs/branchen/maler*` and `docs/branchen/maler/**`. (Two names,
//   because the docs of an industry are German and its code is English.) An entry in `orders`
//   comes before a rule.
//
// A commit ends with a block of trailers, among them (upper and lower case of the key are equal):
//
//     Order: W0-01
//     Role: platform
//
// The roles are `head`, `platform`, `industry` (also `industry:<id>`) and `facts`. The checks,
// each a problem with the commit, the path and the reason:
//
// 1. Exactly one `Order` and one `Role` trailer, in the last paragraph of the message.
// 2. The register knows the order.
// 3. The role is the role of the order. The head may work on every order (it lands the work of
//    the others and repairs it); the standing order `HEAD` is for the head alone. `Role` names
//    the role a commit is made in: whoever repairs the code of an industry under a family of
//    orders writes `industry:<id>`, because only that trailer says which industry it is.
// 4. Every changed path matches a `write` pattern of the order. A moved file counts with both
//    paths.
// 5. Whatever an order lists, a role writes only what belongs to its kind of owner: `industry`
//    only what an industry owns, `facts` only what `facts` owns, `platform` what a platform
//    package or the head owns. This second fence holds when the register itself is wrong.
//
// A merge that went through cleanly is skipped: what it brings was changed by the commits it
// merges, and those are checked. A merge that changes paths itself (a conflict settled, an edit
// made on the way: the paths that differ from every parent, tools/src/git.ts) is a commit like
// any other, with its own trailers and only the paths of its order.
//
// Which commits are read (everything after `OWNERSHIP_BASE`, else after `origin/main`; on the CI
// the variable must be set) is written down in tools/src/git.ts and in the guard,
// tools/guards/ownership.guard.test.ts. All of them are judged by the register as it stands in
// the working tree.
//
// What this cannot check: that the trailers tell the truth (all agents use one account, so a
// trailer is a statement, not a proof); that a commit stays inside the one section of a file its
// order names (`CLAUDE.md`, section «Befehle»); and changes that are not committed yet. The guard
// catches the honest mistake, a file changed in passing; the rest stays with whoever writes and
// with the review.
import type { GitCommit } from './git.ts';
import { compileGlob, type Glob, globProblems } from './globs.ts';
import type { Problem } from './repo-files.ts';

/** The register, from the root of the repository. */
export const REGISTER_PATH = 'registry/owners.json';

/** The environment variable that names the commit the checked range starts after. */
export const BASE_VARIABLE = 'OWNERSHIP_BASE';

/** The environment variable a runner of the CI sets to `true` (GitHub Actions). */
export const CI_VARIABLE = 'GITHUB_ACTIONS';

/**
 * The base the environment names, or undefined where it names none (the range then starts after
 * `origin/main`, tools/src/git.ts).
 *
 * On the CI the base must be named, so this throws there without one. After a push to main,
 * `origin/main` is HEAD itself: the range would be empty and the guard would pass without having
 * read a commit, in every run from then on. A workflow that lost the variable must be red.
 */
export function baseFromEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
): string | undefined {
  const base = environment[BASE_VARIABLE]?.trim() ?? '';
  if (base !== '') {
    return base;
  }
  if (environment[CI_VARIABLE] === 'true') {
    throw new Error(
      `${BASE_VARIABLE} is not set, and this is the CI (${CI_VARIABLE}=true): the workflow names the commit the range starts after (.github/workflows/ci.yml).`,
    );
  }
  return undefined;
}

/** The roles a commit is made in (docs/zusammenarbeit.md, 1). */
export const ROLES = ['head', 'platform', 'industry', 'facts'] as const;

export type Role = (typeof ROLES)[number];

/**
 * The second fence: the kinds of owner a role may write, whatever its order lists. The kind of
 * an owner is the part before the colon (`platform:core` is of the kind `platform`).
 */
const MAY_WRITE: Readonly<Record<Role, readonly Role[]>> = {
  head: ['head', 'platform', 'industry', 'facts'],
  platform: ['head', 'platform'],
  industry: ['industry'],
  facts: ['facts'],
};

/** One line of `owners`: the paths of a pattern belong to an owner. */
export interface OwnerRule {
  readonly pattern: string;
  readonly owner: string;
}

/** What an order may write, and the role that works on it. */
export interface Order {
  readonly role: Role;
  readonly write: readonly string[];
}

/** A family of orders: `order` holds one `*`, `write` may hold `<name>` and `<id>`. */
export interface OrderRule extends Order {
  readonly order: string;
}

/** The register, read and found well formed. */
export interface Register {
  readonly owners: readonly OwnerRule[];
  readonly orders: ReadonlyMap<string, Order>;
  readonly orderRules: readonly OrderRule[];
}

// --- Reading the register ------------------------------------------------------------------

/** An id of a package or an industry: lower case, digits, single dashes. */
const ID_SHAPE = '[a-z][a-z0-9]*(?:-[a-z0-9]+)*';
const ID = new RegExp(`^${ID_SHAPE}$`);

/** An owner: `head`, `facts`, `platform:<package>`, `industry:<id>`; `*` for «the path says». */
const OWNER = new RegExp(`^(?:head|facts|(?:platform|industry):(?:\\*|${ID_SHAPE}))$`);

/** The name of an order: `W0-01`, `HEAD`, `branche-maler`. */
const ORDER_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** The name of a family of orders: as an order, with exactly one `*` and something beside it. */
const ORDER_FAMILY = /^(?=.*[A-Za-z0-9])[A-Za-z0-9._-]*\*[A-Za-z0-9._-]*$/;

const PLACEHOLDER = /<(?:name|id)>/g;

const TOP_LEVEL = ['about', 'version', 'owners', 'orders', 'orderRules'];

/** A part of the register as it was read: the value, or the reasons why there is none. */
export interface Parsed<T> {
  readonly value: T | undefined;
  readonly problems: readonly string[];
}

/** The value, if nothing is wrong with it. */
function parsed<T>(value: T, problems: readonly string[]): Parsed<T> {
  return { value: problems.length === 0 ? value : undefined, problems };
}

function failed<T>(problems: readonly string[]): Parsed<T> {
  return { value: undefined, problems };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRole(value: unknown): value is Role {
  return ROLES.some((role) => role === value);
}

/** Keys of an object that the format does not know: a typo must not go unnoticed. */
function unknownKeys(
  value: Record<string, unknown>,
  known: readonly string[],
  where: string,
): string[] {
  return Object.keys(value)
    .filter((key) => !known.includes(key))
    .map((key) => `${where} has an unknown field «${key}» (known: ${known.join(', ')})`);
}

/** Entries of a list that stand in it a second time. */
function repeated<T>(values: readonly T[]): T[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

/** A list of write patterns. `fill` turns a template into a pattern before it is checked. */
function parseWrite(
  value: unknown,
  where: string,
  fill: (template: string) => string,
): Parsed<string[]> {
  if (!Array.isArray(value) || value.length === 0) {
    return failed([`${where}: «write» is a list with at least one pattern`]);
  }
  const entries: unknown[] = value;
  const patterns = entries.filter((entry) => typeof entry === 'string');
  return parsed(patterns, [
    ...(patterns.length === entries.length ? [] : [`${where}: a write pattern is a text`]),
    ...patterns.flatMap((pattern) =>
      globProblems(fill(pattern)).map(
        (problem) => `${where}: the write pattern «${pattern}» ${problem}`,
      ),
    ),
    ...repeated(patterns).map((pattern) => `${where}: «${pattern}» is listed twice`),
  ]);
}

/** The role and the write patterns of an order or of a family of orders. */
function parseOrder(
  entry: Record<string, unknown>,
  where: string,
  fill: (template: string) => string = (template) => template,
): Parsed<Order> {
  const { role } = entry;
  const write = parseWrite(entry.write, where, fill);
  if (!isRole(role)) {
    return failed([`${where}: «role» is one of ${ROLES.join(', ')}`, ...write.problems]);
  }
  return parsed({ role, write: write.value ?? [] }, write.problems);
}

function parseOwners(value: unknown): Parsed<OwnerRule[]> {
  if (!Array.isArray(value) || value.length === 0) {
    return failed(['«owners» is a list with at least one entry']);
  }
  const entries: unknown[] = value;
  const owners: OwnerRule[] = [];
  const problems = entries.flatMap((entry, index) => {
    const where = `owners[${index}]`;
    if (!isRecord(entry)) {
      return [`${where} is an object with the texts «pattern» and «owner»`];
    }
    const { pattern, owner } = entry;
    if (typeof pattern !== 'string' || typeof owner !== 'string') {
      return [`${where} is an object with the texts «pattern» and «owner»`];
    }
    owners.push({ pattern, owner });
    return [
      ...unknownKeys(entry, ['pattern', 'owner'], where),
      ...globProblems(pattern).map((problem) => `${where}: the pattern «${pattern}» ${problem}`),
      ...(OWNER.test(owner)
        ? []
        : [
            `${where}: the owner «${owner}» is none of head, facts, platform:<package>, industry:<id>`,
          ]),
    ];
  });
  const patterns = owners.map(({ pattern }) => pattern);
  return parsed(owners, [
    ...problems,
    ...repeated(patterns).map(
      (pattern) => `owners: the pattern «${pattern}» is listed twice; the first one wins`,
    ),
    ...(patterns.at(-1) === '**'
      ? []
      : ['the last pattern of «owners» is «**», so that every path has an owner']),
  ]);
}

function parseOrders(value: unknown): Parsed<Map<string, Order>> {
  if (!isRecord(value)) {
    return failed([
      '«orders» is an object: the name of an order, then its role and its write patterns',
    ]);
  }
  // A map, not the object: the name of an order comes from a commit message, and an object
  // would answer to «constructor» as well.
  const orders = new Map<string, Order>();
  const problems = Object.entries(value).flatMap(([id, entry]) => {
    const where = `orders.${id}`;
    if (!ORDER_ID.test(id)) {
      return [`${where}: the name of an order is letters, digits, «.», «_» and «-»`];
    }
    if (!isRecord(entry)) {
      return [`${where} is an object with «role» and «write»`];
    }
    const order = parseOrder(entry, where);
    if (order.value !== undefined) {
      orders.set(id, order.value);
    }
    return [...unknownKeys(entry, ['role', 'write'], where), ...order.problems];
  });
  return parsed(orders, problems);
}

function parseOrderRules(value: unknown): Parsed<OrderRule[]> {
  if (!Array.isArray(value)) {
    return failed(['«orderRules» is a list']);
  }
  const entries: unknown[] = value;
  const rules: OrderRule[] = [];
  const problems = entries.flatMap((entry, index) => {
    const where = `orderRules[${index}]`;
    if (!isRecord(entry)) {
      return [`${where} is an object with «order», «role» and «write»`];
    }
    const family = entry.order;
    if (typeof family !== 'string' || !ORDER_FAMILY.test(family)) {
      return [`${where}: «order» names a family of orders with exactly one «*», as in «branche-*»`];
    }
    // The placeholders stand for an id; with one filled in, a template is a pattern.
    const order = parseOrder(entry, where, (template) => template.replace(PLACEHOLDER, 'x'));
    if (order.value !== undefined) {
      rules.push({ order: family, ...order.value });
    }
    return [...unknownKeys(entry, ['order', 'role', 'write'], where), ...order.problems];
  });
  return parsed(rules, [
    ...problems,
    ...repeated(rules.map(({ order }) => order)).map(
      (family) => `orderRules: the family «${family}» is listed twice; the first one wins`,
    ),
  ]);
}

/**
 * Reads the register from what its JSON holds. With a problem there is no register: a guard must
 * not judge commits by a register it only half understood.
 */
export function parseRegister(value: unknown): Parsed<Register> {
  if (!isRecord(value)) {
    return failed(['the register is an object']);
  }
  const owners = parseOwners(value.owners);
  const orders = parseOrders(value.orders);
  const orderRules = parseOrderRules(value.orderRules ?? []);
  const problems = [
    ...unknownKeys(value, TOP_LEVEL, 'the register'),
    ...(value.about === undefined || typeof value.about === 'string' ? [] : ['«about» is a text']),
    ...(value.version === 1 ? [] : ['«version» is 1: this tool reads no other format']),
    ...owners.problems,
    ...orders.problems,
    ...orderRules.problems,
  ];
  if (
    problems.length > 0 ||
    owners.value === undefined ||
    orders.value === undefined ||
    orderRules.value === undefined
  ) {
    return failed(problems);
  }
  return parsed({ owners: owners.value, orders: orders.value, orderRules: orderRules.value }, []);
}

/** Reads the register from the text of `registry/owners.json`; undefined if the file is missing. */
export function readRegister(text: string | undefined): {
  register: Register | undefined;
  problems: Problem[];
} {
  const problem = (message: string): Problem => ({ path: REGISTER_PATH, line: 0, message });
  if (text === undefined) {
    return { register: undefined, problems: [problem('the file is missing')] };
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { register: undefined, problems: [problem(`is not JSON: ${reason}`)] };
  }
  const register = parseRegister(value);
  return { register: register.value, problems: register.problems.map(problem) };
}

// --- Owners and orders ---------------------------------------------------------------------

/** Compiled patterns: the same few patterns are asked for every path of every commit. */
const compiled = new Map<string, Glob>();

function glob(pattern: string): Glob {
  let found = compiled.get(pattern);
  if (found === undefined) {
    found = compileGlob(pattern);
    compiled.set(pattern, found);
  }
  return found;
}

/**
 * Who owns a path: the owner of the first pattern that matches, with its `*` filled in from the
 * path where the pattern says which package or industry it is.
 */
export function ownerOf(register: Register, path: string): string {
  for (const { pattern, owner } of register.owners) {
    const captures = glob(pattern).captures(path);
    if (captures !== undefined) {
      const [first] = captures;
      return first !== undefined && ID.test(first) ? owner.replace('*', first) : owner;
    }
  }
  throw new Error(`No pattern of «owners» matches ${path}: the list must end with «**».`);
}

/** The kind of an owner: the role that owns it. */
function kindOf(owner: string): string {
  return owner.split(':')[0] ?? owner;
}

/**
 * The order a commit names: an entry of `orders`, or the first family of `orderRules` its name
 * belongs to, with the placeholders of that family filled in. `detail` is the detail of the role
 * trailer (`industry:<detail>`). Undefined for an order the register does not know.
 */
export function findOrder(register: Register, id: string, detail?: string): Order | undefined {
  const listed = register.orders.get(id);
  if (listed !== undefined) {
    return listed;
  }
  // The name of an order comes from a commit message: only a plain name is looked up at all.
  if (!ORDER_ID.test(id)) {
    return undefined;
  }
  for (const rule of register.orderRules) {
    const [name] = glob(rule.order).captures(id) ?? [];
    // Only a plain id is filled into a pattern, never a star or a slash.
    if (name !== undefined && ID.test(name) && (detail === undefined || ID.test(detail))) {
      const fill = (template: string): string =>
        template.replaceAll('<name>', name).replaceAll('<id>', detail ?? name);
      return { role: rule.role, write: rule.write.map(fill) };
    }
  }
  return undefined;
}

/** The orders the register knows, for a message: the listed ones, then the families. */
function knownOrders(register: Register): string {
  return [...register.orders.keys(), ...register.orderRules.map((rule) => rule.order)].join(', ');
}

// --- Trailers ------------------------------------------------------------------------------

/** One trailer of a commit message. */
export interface Trailer {
  /** The key in lower case: upper and lower case of a key are equal. */
  readonly key: string;
  readonly value: string;
}

const TRAILER = /^([A-Za-z0-9][A-Za-z0-9-]*)[ \t]*:[ \t]*(.*)$/;

/**
 * The trailers of a commit message: the `Key: value` lines of its last paragraph. A message of
 * one paragraph has none (its only paragraph is the subject), and a line of the last paragraph
 * that is no trailer is passed over.
 */
export function parseTrailers(message: string): Trailer[] {
  const lines = message.replace(/\r\n?/g, '\n').trimEnd().split('\n');
  const gap = lines.findLastIndex((line) => line.trim() === '');
  if (gap === -1) {
    return [];
  }
  return lines.slice(gap + 1).flatMap((line) => {
    const [, key, value] = TRAILER.exec(line) ?? [];
    return key === undefined || value === undefined
      ? []
      : [{ key: key.toLowerCase(), value: value.trim() }];
  });
}

/** The first line of a commit message. */
export function subjectOf(message: string): string {
  return (
    message
      .split(/\r?\n/)
      .find((line) => line.trim() !== '')
      ?.trim() ?? ''
  );
}

/** What a commit says about itself, or why that cannot be read. */
type Declaration =
  | {
      readonly ok: true;
      readonly order: string;
      readonly role: Role;
      readonly detail: string | undefined;
    }
  | { readonly ok: false; readonly reasons: readonly string[] };

/** The one value of a trailer, or the reason why there is not exactly one. */
function single(
  trailers: readonly Trailer[],
  key: 'Order' | 'Role',
): { readonly value: string } | { readonly reason: string } {
  const values = trailers.filter((trailer) => trailer.key === key.toLowerCase());
  const [only] = values;
  if (only === undefined) {
    const example = `${key}: <${key.toLowerCase()}>`;
    return { reason: `the message has no trailer «${example}» in its last paragraph` };
  }
  if (values.length > 1) {
    const listed = values.map(({ value }) => value).join(', ');
    return {
      reason: `the message has ${values.length} «${key}» trailers (${listed}): a commit has one`,
    };
  }
  return only.value === '' ? { reason: `the trailer «${key}» is empty` } : { value: only.value };
}

/** Reads the order and the role a commit states in its trailers. */
function declarationOf(message: string): Declaration {
  const trailers = parseTrailers(message);
  const order = single(trailers, 'Order');
  const stated = single(trailers, 'Role');
  if ('reason' in order || 'reason' in stated) {
    return {
      ok: false,
      reasons: [order, stated].flatMap((one) => ('reason' in one ? [one.reason] : [])),
    };
  }
  // `industry:painting`: the role, and behind the colon which industry.
  const colon = stated.value.indexOf(':');
  const role = colon === -1 ? stated.value : stated.value.slice(0, colon);
  const detail = colon === -1 ? undefined : stated.value.slice(colon + 1);
  if (!isRole(role)) {
    return {
      ok: false,
      reasons: [
        `unknown role «${stated.value}»: the roles are ${ROLES.join(', ')} (an industry also as «industry:<id>»)`,
      ],
    };
  }
  if (detail !== undefined && (role !== 'industry' || !ID.test(detail))) {
    return {
      ok: false,
      reasons: [
        `the role «${stated.value}» is not understood: only «industry:<id>» carries a detail, and an id is lower case with digits and single dashes`,
      ],
    };
  }
  return { ok: true, order: order.value, role, detail };
}

// --- The check -----------------------------------------------------------------------------

/** One finding: a commit, the path concerned, and why it is a problem. */
export interface OwnershipProblem {
  /** The full hash of the commit. */
  readonly commit: string;
  /** The first line of its message, to recognise it. */
  readonly subject: string;
  /** The path concerned; empty when the finding is about the commit as a whole (its trailers). */
  readonly path: string;
  readonly reason: string;
}

/** A commit that was not checked, and why. */
export interface SkippedCommit {
  readonly commit: string;
  readonly subject: string;
  readonly reason: string;
}

/** What the check did: how many commits it judged, which it passed over, and what it found. */
export interface OwnershipReport {
  /** The number of commits whose trailers and paths were checked. */
  readonly checked: number;
  readonly skipped: readonly SkippedCommit[];
  readonly problems: readonly OwnershipProblem[];
}

/** The reasons why one commit breaks the rules, each with the path it is about ('' for none). */
function commitFindings(commit: GitCommit, register: Register): { path: string; reason: string }[] {
  const declared = declarationOf(commit.message);
  if (!declared.ok) {
    return declared.reasons.map((reason) => ({ path: '', reason }));
  }
  const { role, detail } = declared;
  const order = findOrder(register, declared.order, detail);
  if (order === undefined) {
    return [
      {
        path: '',
        reason: `unknown order «${declared.order}»: ${REGISTER_PATH} knows ${knownOrders(register)}`,
      },
    ];
  }
  if (role !== order.role && role !== 'head') {
    const meant = order.role === 'head' ? 'the role head' : `the role ${order.role} (or head)`;
    return [
      {
        path: '',
        reason: `the order ${declared.order} is worked on in ${meant}, not in the role ${role}`,
      },
    ];
  }
  const write = order.write.map(glob);
  return commit.paths.flatMap((path) => {
    const owner = ownerOf(register, path);
    if (!write.some((pattern) => pattern.matches(path))) {
      return [
        {
          path,
          reason: `not among the write paths of the order ${declared.order} (belongs to ${owner})`,
        },
      ];
    }
    if (!MAY_WRITE[role].some((kind) => kind === kindOf(owner))) {
      return [
        {
          path,
          reason: `belongs to ${owner}: the role ${role} never writes there, whatever the order ${declared.order} lists`,
        },
      ];
    }
    return [];
  });
}

/**
 * Checks every commit on its own against the register: commits + register → what was checked,
 * what was passed over, and the problems. Pure: no git, no file system.
 */
export function checkOwnership(commits: readonly GitCommit[], register: Register): OwnershipReport {
  const skipped: SkippedCommit[] = [];
  const problems: OwnershipProblem[] = [];
  let checked = 0;
  for (const commit of commits) {
    const subject = subjectOf(commit.message);
    // A merge is passed over only when it changes nothing itself. With paths of its own it is
    // judged like every commit: otherwise a file changed inside a merge would never be seen.
    if (commit.parents.length > 1 && commit.paths.length === 0) {
      skipped.push({
        commit: commit.hash,
        subject,
        reason: 'a clean merge: the commits it merges are checked on their own',
      });
      continue;
    }
    checked += 1;
    for (const finding of commitFindings(commit, register)) {
      problems.push({ commit: commit.hash, subject, ...finding });
    }
  }
  return { checked, skipped, problems };
}

/** The problems of the commits: every commit changes only paths its order may write. */
export function ownershipProblems(
  commits: readonly GitCommit[],
  register: Register,
): OwnershipProblem[] {
  return [...checkOwnership(commits, register).problems];
}

/** A problem as one line: `<short hash> «<subject>»: <path>: <reason>`. */
export function formatOwnershipProblem(problem: OwnershipProblem): string {
  const where = problem.path === '' ? '' : `${problem.path}: `;
  return `${problem.commit.slice(0, 7)} «${problem.subject}»: ${where}${problem.reason}`;
}

/** The summary of a run as one line for the log; `range` says which commits were read. */
export function formatOwnershipSummary(report: OwnershipReport, range: string): string {
  const skipped = report.skipped
    .map(({ commit, reason }) => `, skipped ${commit.slice(0, 7)} (${reason})`)
    .join('');
  const found =
    report.problems.length === 0
      ? 'no problem'
      : `${report.problems.length} ${report.problems.length === 1 ? 'problem' : 'problems'}`;
  return `ownership: ${range}: checked ${report.checked}${skipped}, ${found}`;
}

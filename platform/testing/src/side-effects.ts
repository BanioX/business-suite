// Origin: BanioX/Randen apps/web/src/side-effects.test.ts @ e0f0907 — adapted: the kinds, the reading of the register and the comparison as functions over given sources and a given register text, without the file system; problems as data with English messages; comments are removed by a reader that knows strings; the rules for a well-formed register and for storage keys take the kinds and the prefix as parameters
import type { StandardProblem } from './problem';
import { withoutComments } from './source';

export { withoutComments };

/**
 * The standard test of side effects: the register (`docs/nebenwirkungen.md`) against the code.
 * Whatever an app does outside itself (network, storage of the device, camera, printing,
 * sharing, files) is a kind below. A kind that occurs in the code must stand in the register,
 * in the column «Im Code». So a new kind of side effect breaks the test until it is written
 * down, and anything that talks to a server breaks it until the product owner has decided
 * (CLAUDE.md, «Freigabe»; «Daten bleiben auf dem Gerät»).
 *
 * Everything here works on texts the caller read: the sources as `{ path, code }` and the
 * register as one text. Which files ship is the caller's knowledge. The sources of this very
 * package are not among them: they name every kind in order to find it.
 */

/** One kind of side effect. */
export interface SideEffectKind {
  /** How the register names it in «Im Code», in backticks. */
  key: string;
  /** How the code gives it away (comments are removed first). */
  pattern: RegExp;
  /** Sends something to a server: never without an explicit decision by the product owner. */
  network?: true;
}

/** The kinds the standard test knows. An edition that needs another passes its own list. */
export const SIDE_EFFECT_KINDS: readonly SideEffectKind[] = [
  // Network
  { key: 'fetch(', pattern: /\bfetch\s*\(/, network: true },
  { key: 'XMLHttpRequest', pattern: /\bXMLHttpRequest\b/, network: true },
  { key: 'WebSocket', pattern: /\b(WebSocket|WebTransport|RTCPeerConnection)\b/, network: true },
  { key: 'EventSource', pattern: /\bEventSource\b/, network: true },
  { key: 'sendBeacon', pattern: /\bsendBeacon\b/, network: true },
  // Storage of the device
  { key: 'indexedDB', pattern: /\bindexedDB\b|\bDexie\b|from\s+['"]dexie/ },
  { key: 'localStorage', pattern: /\blocalStorage\b/ },
  { key: 'sessionStorage', pattern: /\bsessionStorage\b/ },
  { key: 'document.cookie', pattern: /\bdocument\s*\.\s*cookie\b/ },
  { key: 'storage.persist', pattern: /\.\s*persist\s*\(/ },
  { key: 'serviceWorker', pattern: /\bserviceWorker\b|\bVitePWA\s*\(|virtual:pwa-register/ },
  // Functions of the device
  { key: 'getUserMedia', pattern: /\bgetUserMedia\b|\bmediaDevices\b/ },
  { key: 'capture=', pattern: /\bcapture\s*=/ },
  { key: 'type="file"', pattern: /\btype\s*=\s*\{?\s*['"]file['"]/ },
  { key: 'geolocation', pattern: /\bgeolocation\b/ },
  {
    key: 'Notification',
    pattern:
      /\bnew\s+Notification\s*\(|\bNotification\s*\.\s*(requestPermission|permission)\b|\.\s*showNotification\s*\(/,
  },
  // What a person carries out of the app
  { key: 'window.print', pattern: /\bwindow\s*\.\s*print\b|(?<![.\w])print\s*\(\s*\)/ },
  { key: 'navigator.share', pattern: /\bnavigator\s*\.\s*(share|canShare)\b/ },
  {
    key: 'navigator.clipboard',
    pattern: /\bnavigator\s*\.\s*clipboard\b|\bexecCommand\s*\(\s*['"](copy|cut)['"]/,
  },
  { key: 'window.open', pattern: /\bwindow\s*\.\s*open\s*\(/ },
  { key: 'download', pattern: /<a\b[^>]*\bdownload\b|\bdownload\s*=(?!=)/ },
  { key: 'createObjectURL', pattern: /\bcreateObjectURL\b/ },
];

/** A file of shipped code, as the caller read it. */
export interface SourceFile {
  /** Path from the root of the repository, with forward slashes. */
  path: string;
  code: string;
}

/** A pattern for one test: without the flags that make a pattern remember where it was. */
function testPattern(pattern: RegExp): RegExp {
  return new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ''));
}

/** Which kinds occur, and in which files: the key of the kind and the paths, in given order. */
export function occurrences(
  sources: readonly SourceFile[],
  kinds: readonly SideEffectKind[] = SIDE_EFFECT_KINDS,
): Map<string, string[]> {
  const patterns = kinds.map((kind) => ({ key: kind.key, pattern: testPattern(kind.pattern) }));
  const found = new Map<string, string[]>();
  for (const { path, code } of sources) {
    const bare = withoutComments(code);
    for (const { key, pattern } of patterns) {
      if (pattern.test(bare)) {
        found.set(key, [...(found.get(key) ?? []), path]);
      }
    }
  }
  return found;
}

/** The columns of every table of the register, in this order. */
export const REGISTER_COLUMNS = [
  'Kennung',
  'Nebenwirkung',
  'Im Code',
  'Wo',
  'Daten verlassen das Gerät?',
  'Entscheid',
  'Seit',
] as const;

/** A row of the register. */
export interface RegisterRow {
  /** `SE-nn`. */
  id: string;
  /** The whole line, for storage keys and for messages. */
  line: string;
  /** The kinds the row covers: what stands in backticks in «Im Code». */
  keys: string[];
  /** «Daten verlassen das Gerät?»: starts with «ja» or «nein». */
  leaves: string;
  /** «Entscheid»: the ADR that carries the row, and who decided. */
  decision: string;
  /** «Seit»: a date `TT.MM.JJJJ`, or «geplant». */
  since: string;
}

/** The cells of a table row; a `\|` inside a cell is part of the cell. */
function cells(line: string): string[] {
  return line
    .split(/(?<!\\)\|/)
    .slice(1, -1)
    .map((cell) => cell.trim());
}

const lines = (text: string) => text.split(/\r?\n/);

/** Every row `| SE-nn | … |` of every table in the register. */
export function parseRegister(markdown: string): RegisterRow[] {
  return lines(markdown)
    .filter((line) => /^\|\s*SE-/.test(line))
    .map((line) => {
      const [id = '', , inCode = '', , leaves = '', decision = '', since = ''] = cells(line);
      return {
        id,
        line,
        keys: [...inCode.matchAll(/`([^`]+)`/g)].map((match) => match[1] ?? ''),
        leaves,
        decision,
        since,
      };
    });
}

/** What the side effects test reports. */
export interface SideEffectProblem extends StandardProblem {
  /** What the finding is about: the key of a kind, the id of a row, or a storage key. */
  subject: string;
  /** The files of the code the finding comes from; empty for a finding in the register itself. */
  paths: string[];
}

const DECIDED_BY_OWNER = /\bAlban, \d{1,2}\.\d{1,2}\.\d{4}\b/;
const ADR = /\bADR-\d{4}\b/;
const YES = /^ja(?![a-zäöü])/;
const YES_OR_NO = /^(ja|nein)(?![a-zäöü])/;
const ROW_ID = /^SE-\d{2,}$/;
const SINCE = /^(\d{1,2}\.\d{1,2}\.\d{4}|geplant)$/;

/** A row that carries the decision a request to a server needs. */
function isDecidedRequest(row: RegisterRow): boolean {
  return YES.test(row.leaves) && DECIDED_BY_OWNER.test(row.decision) && ADR.test(row.decision);
}

function networkKeys(kinds: readonly SideEffectKind[]): ReadonlySet<string> {
  return new Set(kinds.filter((kind) => kind.network === true).map((kind) => kind.key));
}

/**
 * What is wrong with the register itself, whatever the code does:
 *
 * - `register.table`: it holds no table, or a table with other columns than `REGISTER_COLUMNS`;
 * - `register.row`: a row has another number of cells, an id that is not `SE-nn` or occurs
 *   twice, no clear «ja» or «nein», no ADR, or neither a date nor «geplant» in «Seit»;
 * - `register.kind`: a row names a kind the test does not know, so a typo cannot hide a side
 *   effect;
 * - `register.request`: a row for a request to a server lacks «ja» or the decision of the
 *   product owner («Alban, TT.MM.JJJJ»).
 */
export function registerProblems(
  markdown: string,
  kinds: readonly SideEffectKind[] = SIDE_EFFECT_KINDS,
): SideEffectProblem[] {
  const problems: SideEffectProblem[] = [];
  const report = (rule: string, subject: string, message: string) => {
    problems.push({ rule, subject, paths: [], message });
  };

  const headers = lines(markdown).filter((line) => /^\|\s*Kennung\s*\|/.test(line));
  if (headers.length === 0) {
    report('register.table', 'register', 'The register holds no table that starts with «Kennung».');
  }
  for (const header of headers) {
    if (cells(header).join(' | ') !== REGISTER_COLUMNS.join(' | ')) {
      report(
        'register.table',
        'register',
        `A table has the columns «${cells(header).join(' | ')}»; expected «${REGISTER_COLUMNS.join(' | ')}».`,
      );
    }
  }

  const known = new Set(kinds.map((kind) => kind.key));
  const network = networkKeys(kinds);
  const seen = new Set<string>();
  for (const row of parseRegister(markdown)) {
    const reportRow = (message: string) => {
      report('register.row', row.id, `${row.id}: ${message}`);
    };
    if (cells(row.line).length !== REGISTER_COLUMNS.length) {
      reportRow(
        `the row has ${cells(row.line).length} cells, the table ${REGISTER_COLUMNS.length}.`,
      );
    }
    if (!ROW_ID.test(row.id)) {
      reportRow('the id must have the form SE-nn.');
    }
    if (seen.has(row.id)) {
      reportRow('the id occurs twice.');
    }
    seen.add(row.id);
    if (!YES_OR_NO.test(row.leaves)) {
      reportRow('«Daten verlassen das Gerät?» must start with «ja» or «nein».');
    }
    if (!SINCE.test(row.since)) {
      reportRow('«Seit» must be a date TT.MM.JJJJ or «geplant».');
    }
    if (!ADR.test(row.decision)) {
      reportRow('«Entscheid» must name the ADR that carries the row (ADR-NNNN).');
    }
    for (const key of row.keys) {
      if (!known.has(key)) {
        report(
          'register.kind',
          row.id,
          `${row.id}: «Im Code» names \`${key}\`, which is no kind the test knows: ${[...known].join(', ')}.`,
        );
      }
    }
    if (
      row.keys.some((key) => network.has(key)) &&
      !(YES.test(row.leaves) && DECIDED_BY_OWNER.test(row.decision))
    ) {
      report(
        'register.request',
        row.id,
        `${row.id}: a row for a request to a server needs «ja» and «Alban, TT.MM.JJJJ» in «Entscheid».`,
      );
    }
  }
  return problems;
}

/**
 * What is wrong between the code and the register; empty when all is in order.
 *
 * - `side_effect.unregistered`: a kind occurs in the code and in no row of the register.
 * - `side_effect.request`: the code sends a request to a server, and no row carries the
 *   decision for it: «ja» in «Daten verlassen das Gerät?» and «Alban, TT.MM.JJJJ» together
 *   with an ADR in «Entscheid». An ordinary row is not enough.
 *
 * `found` is what `occurrences` returned, `rows` what `parseRegister` returned.
 */
export function sideEffectProblems(
  found: ReadonlyMap<string, readonly string[]>,
  rows: readonly RegisterRow[],
  kinds: readonly SideEffectKind[] = SIDE_EFFECT_KINDS,
): SideEffectProblem[] {
  const network = networkKeys(kinds);
  const problems: SideEffectProblem[] = [];
  for (const [key, paths] of found) {
    const where = paths.join(', ');
    const registered = rows.filter((row) => row.keys.includes(key));
    if (network.has(key)) {
      if (!registered.some(isDecidedRequest)) {
        problems.push({
          rule: 'side_effect.request',
          subject: key,
          paths: [...paths],
          message:
            `\`${key}\` in ${where}: a request to a server needs a decision by the product owner. ` +
            'Its row of the register needs «ja» in «Daten verlassen das Gerät?» and «Alban, TT.MM.JJJJ, ADR-NNNN» in «Entscheid».',
        });
      }
    } else if (registered.length === 0) {
      problems.push({
        rule: 'side_effect.unregistered',
        subject: key,
        paths: [...paths],
        message:
          `\`${key}\` in ${where}: not in the register of side effects. ` +
          'Add a row with the next id and this kind in «Im Code».',
      });
    }
  }
  return problems;
}

/** The form of a storage prefix: the technical name of an edition, e.g. `sample`. */
const STORAGE_PREFIX = /^[a-z][a-z0-9-]*$/;

/**
 * Every key the code keeps in the storage of the browser under the prefix of its edition
 * (`'<prefix>:<name>'` as a text in the code), with the files it stands in.
 */
export function storageKeys(sources: readonly SourceFile[], prefix: string): Map<string, string[]> {
  if (!STORAGE_PREFIX.test(prefix)) {
    throw new RangeError(
      `A storage prefix is a lower-case technical name, got ${JSON.stringify(prefix)}`,
    );
  }
  const key = new RegExp(`['"\`](${prefix}:[a-z0-9][a-z0-9:._-]*)['"\`]`, 'g');
  const found = new Map<string, string[]>();
  for (const { path, code } of sources) {
    for (const match of withoutComments(code).matchAll(key)) {
      const name = match[1] ?? '';
      const paths = found.get(name) ?? [];
      if (!paths.includes(path)) {
        found.set(name, [...paths, path]);
      }
    }
  }
  return found;
}

/**
 * `side_effect.storage_key`: a key of the browser's storage that no row of the register lists
 * in backticks. The register says what an app keeps on the device, key by key.
 */
export function storageKeyProblems(
  sources: readonly SourceFile[],
  rows: readonly RegisterRow[],
  prefix: string,
): SideEffectProblem[] {
  return [...storageKeys(sources, prefix)]
    .filter(([key]) => !rows.some((row) => row.line.includes(`\`${key}\``)))
    .map(([key, paths]) => ({
      rule: 'side_effect.storage_key',
      subject: key,
      paths,
      message: `The storage key \`${key}\` in ${paths.join(', ')} is not in the register of side effects: list it in the row of its storage.`,
    }));
}

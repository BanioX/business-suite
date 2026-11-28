// Origin: BanioX/Randen apps/web/src/security.test.ts @ e0f0907 — adapted: the rules as functions over the two given texts that return problems; the page is read by a small scanner instead of a DOM; the policy headers must come from the one rule for every path instead of being sampled on paths of the app; language and title are parameters; a repeated directive, an inline handler and an address written with character references are found as well
// Origin: BanioX/Randen apps/web/scripts/static-headers.ts @ e0f0907 — adapted: only the parser of the headers file; a rule keeps its path as written and a bad line is reported with its number; the plug-in for the preview server stays with the edition
import type { StandardProblem } from './problem';

/**
 * The standard test of security: «Daten bleiben auf dem Gerät» and «nie in Suchmaschinen»
 * (CLAUDE.md, «Harte Regeln»), proven on the two files the host serves as they are: the
 * `_headers` file (response headers) and `index.html`. An end-to-end test checks the same
 * headers on the running app; this test fails earlier and without a browser.
 */

/** A finding in one of the two files. */
export interface SecurityProblem extends StandardProblem {
  file: 'headers' | 'html';
}

// --- The headers file ---

/** One rule of a `_headers` file: a path pattern and the headers it sets. */
export interface HeaderRule {
  /** The path pattern as written: `/*`, `/assets/*`, `/sw.js`. */
  path: string;
  /** The same as a pattern over a whole path; `*` matches anything. */
  pattern: RegExp;
  headers: [name: string, value: string][];
}

interface BadLine {
  /** 1 for the first line. */
  line: number;
  text: string;
}

const escapeRegExp = (text: string) => text.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

/**
 * Reads a `_headers` file: an unindented line is a path pattern, the indented `Name: value`
 * lines below it are its headers, comments start with `#`. Lines that are neither are returned
 * apart: a header before any path, a line without a colon, and a line that removes a header
 * (`! Name`), which no rule of the suite allows.
 */
function readHeadersFile(text: string): { rules: HeaderRule[]; bad: BadLine[] } {
  const rules: HeaderRule[] = [];
  const bad: BadLine[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      return;
    }
    if (!/^\s/.test(line)) {
      const source = trimmed.split('*').map(escapeRegExp).join('.*');
      rules.push({ path: trimmed, pattern: new RegExp(`^${source}$`), headers: [] });
      return;
    }
    const rule = rules.at(-1);
    const separator = trimmed.indexOf(':');
    // A line that starts with `!` takes a header away from its paths, with or without a value.
    if (rule === undefined || separator <= 0 || trimmed.startsWith('!')) {
      bad.push({ line: index + 1, text: line });
      return;
    }
    rule.headers.push([trimmed.slice(0, separator).trim(), trimmed.slice(separator + 1).trim()]);
  });
  return { rules, bad };
}

/**
 * Parses a `_headers` file as the host reads it (path patterns with their headers). Throws an
 * `Error` that names the first line it cannot read. For a preview server that applies the same
 * file as the host; the standard test itself uses `headerProblems`, which reports such lines.
 */
export function parseHeadersFile(text: string): HeaderRule[] {
  const { rules, bad } = readHeadersFile(text);
  const [first] = bad;
  if (first !== undefined) {
    throw new Error(`Invalid _headers line ${first.line}: ${first.text}`);
  }
  return rules;
}

/** The headers the rules below are about. Every path gets them, from one place. */
const POLICY_HEADERS = [
  'content-security-policy',
  'x-robots-tag',
  'x-frame-options',
  'permissions-policy',
] as const;
type PolicyHeader = (typeof POLICY_HEADERS)[number];

const isPolicyHeader = (name: string): name is PolicyHeader =>
  (POLICY_HEADERS as readonly string[]).includes(name);

/** The one path pattern that covers every path. */
const EVERY_PATH = '/*';

/** Directives that must read exactly so: everything from the app's own origin, nothing else. */
const REQUIRED_DIRECTIVES: readonly (readonly [name: string, source: string])[] = [
  ['default-src', "'self'"],
  ['script-src', "'self'"],
  ['font-src', "'self'"],
  // The app talks to no server but its own.
  ['connect-src', "'self'"],
  ['object-src', "'none'"],
  ['base-uri', "'self'"],
  ['form-action', "'self'"],
  // No other site can frame the app.
  ['frame-ancestors', "'none'"],
];

/** What any other directive may name. `data:` and `blob:` are photos and files of the device. */
const LOCAL_SOURCES: ReadonlySet<string> = new Set(["'self'", "'none'", 'data:', 'blob:']);

/**
 * Directives that stand in for `script-src` and `style-src` on elements and attributes: for
 * code and styles not even local data, or one of them would undo the directive it refines.
 */
const NO_LOCAL_DATA: ReadonlySet<string> = new Set([
  'style-src',
  'style-src-elem',
  'style-src-attr',
  'script-src-elem',
  'script-src-attr',
]);

function cspProblems(policy: string): SecurityProblem[] {
  const problems: SecurityProblem[] = [];
  const report = (rule: string, message: string) => {
    problems.push({ file: 'headers', rule, message });
  };
  const directives = new Map<string, string[]>();
  for (const part of policy.split(';')) {
    const [name = '', ...sources] = part.trim().toLowerCase().split(/\s+/);
    if (name === '') {
      continue;
    }
    if (directives.has(name)) {
      // A browser takes the first and ignores the rest; a reader takes the one they see.
      report('csp.repeated', `Content-Security-Policy names ${name} twice.`);
      continue;
    }
    directives.set(name, sources);
  }

  const required = new Set<string>();
  for (const [name, source] of REQUIRED_DIRECTIVES) {
    required.add(name);
    const found = directives.get(name);
    if (found?.length !== 1 || found[0] !== source) {
      report(
        'csp.directive',
        `Content-Security-Policy: ${name} must be ${source} and nothing else, found ${
          found === undefined ? 'no such directive' : `«${found.join(' ')}»`
        }.`,
      );
    }
  }
  for (const [name, sources] of directives) {
    if (required.has(name)) {
      continue;
    }
    if (sources.length === 0) {
      report('csp.source', `Content-Security-Policy: ${name} names no source.`);
    }
    for (const source of sources) {
      if (!LOCAL_SOURCES.has(source)) {
        report(
          'csp.source',
          `Content-Security-Policy: ${name} names ${source}; only 'self', 'none', data: and blob: are allowed (no other origin, no wildcard, no unsafe source).`,
        );
      } else if (NO_LOCAL_DATA.has(name) && source !== "'self'" && source !== "'none'") {
        report(
          'csp.source',
          `Content-Security-Policy: ${name} names ${source}; code and styles come from the app's own origin only.`,
        );
      }
    }
  }
  return problems;
}

/** A Permissions-Policy as `feature → allowlist`, the allowlist without white space. */
function permissions(policy: string): Map<string, string> {
  const features = new Map<string, string>();
  for (const part of policy.split(',')) {
    const separator = part.indexOf('=');
    if (separator > 0) {
      features.set(
        part.slice(0, separator).trim().toLowerCase(),
        part
          .slice(separator + 1)
          .replace(/\s+/g, '')
          .toLowerCase(),
      );
    }
  }
  return features;
}

/**
 * What is wrong with a `_headers` file against the rules of the suite:
 *
 * - `headers.line`: a line that cannot be read, or one that removes a header;
 * - `headers.path`: a policy header set by a rule for some paths only; every path gets the same
 *   policy from the rule for `/*`;
 * - `headers.repeated`: a policy header set twice (the host would join the values);
 * - `csp.missing`, `csp.repeated`, `csp.directive`, `csp.source`: the Content-Security-Policy
 *   loads everything from the app's own origin, talks to no other server, cannot be framed and
 *   names no foreign origin, no wildcard and no unsafe source;
 * - `frame.options`: `X-Frame-Options: DENY`;
 * - `robots.header`: `X-Robots-Tag` with `noindex` and `nofollow`;
 * - `permissions.camera`, `permissions.microphone`, `permissions.geolocation`: the camera for
 *   the app itself at most, no microphone, no location.
 */
export function headerProblems(headersFile: string): SecurityProblem[] {
  const problems: SecurityProblem[] = [];
  const report = (rule: string, message: string) => {
    problems.push({ file: 'headers', rule, message });
  };
  const { rules, bad } = readHeadersFile(headersFile);
  for (const { line, text } of bad) {
    report(
      'headers.line',
      `Line ${line} is no path and no «Name: value» below a path: ${text.trim()}`,
    );
  }

  const everywhere = new Map<PolicyHeader, string>();
  for (const rule of rules) {
    for (const [name, value] of rule.headers) {
      const header = name.toLowerCase();
      if (!isPolicyHeader(header)) {
        continue;
      }
      if (rule.path !== EVERY_PATH) {
        report(
          'headers.path',
          `${name} is set for ${rule.path}: every path gets the same policy, from the rule for ${EVERY_PATH}.`,
        );
      } else if (everywhere.has(header)) {
        report('headers.repeated', `${name} is set twice for ${EVERY_PATH}.`);
      } else {
        everywhere.set(header, value);
      }
    }
  }

  const policy = everywhere.get('content-security-policy');
  if (policy === undefined) {
    report('csp.missing', `No Content-Security-Policy for ${EVERY_PATH}.`);
  } else {
    problems.push(...cspProblems(policy));
  }

  if (everywhere.get('x-frame-options')?.toUpperCase() !== 'DENY') {
    report('frame.options', 'X-Frame-Options must be DENY: no other site frames the app.');
  }

  const robots = everywhere.get('x-robots-tag') ?? '';
  if (!/\bnoindex\b/i.test(robots) || !/\bnofollow\b/i.test(robots)) {
    report(
      'robots.header',
      'X-Robots-Tag must say «noindex, nofollow»: the app stays out of search engines.',
    );
  }

  const features = permissions(everywhere.get('permissions-policy') ?? '');
  if (!['(self)', 'self', '()'].includes(features.get('camera') ?? '')) {
    report(
      'permissions.camera',
      'Permissions-Policy must say camera=(self) or camera=(): the camera for the app itself at most.',
    );
  }
  for (const feature of ['microphone', 'geolocation']) {
    if (features.get(feature) !== '()') {
      report(`permissions.${feature}`, `Permissions-Policy must say ${feature}=().`);
    }
  }
  return problems;
}

// --- The page ---

/** A start tag of a page with its attributes, names in lower case. */
interface HtmlTag {
  name: string;
  /** The first value of each attribute, as a browser keeps it. Without a value: empty. */
  attributes: ReadonlyMap<string, string>;
  /** What stands inside, for the elements whose content is text and no markup. */
  text: string;
}

const TEXT_ELEMENTS: ReadonlySet<string> = new Set(['script', 'style', 'title', 'textarea']);

/**
 * The start tags of a page in their order. It reads what a browser would make elements of:
 * comments are skipped, and the content of `script`, `style`, `title` and `textarea` is text.
 * It is no parser of HTML: it serves a small static page, which is all an app shell is.
 */
function tagsOf(html: string): HtmlTag[] {
  const tagName = /<([a-zA-Z][^\s/>]*)/y;
  const attribute = /[\s/]*([^\s/>=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*)))?/y;
  const tags: HtmlTag[] = [];
  let index = 0;
  while (index < html.length) {
    const open = html.indexOf('<', index);
    if (open < 0) {
      break;
    }
    if (html.startsWith('<!--', open)) {
      const end = html.indexOf('-->', open + 4);
      index = end < 0 ? html.length : end + 3;
      continue;
    }
    tagName.lastIndex = open;
    const tag = tagName.exec(html);
    if (tag === null) {
      // An end tag, the doctype or a stray «<».
      index = open + 1;
      continue;
    }
    const name = (tag[1] ?? '').toLowerCase();
    const attributes = new Map<string, string>();
    let position = tagName.lastIndex;
    for (;;) {
      attribute.lastIndex = position;
      const match = attribute.exec(html);
      if (match === null) {
        break;
      }
      position = attribute.lastIndex;
      const key = (match[1] ?? '').toLowerCase();
      if (!attributes.has(key)) {
        attributes.set(key, match[2] ?? match[3] ?? match[4] ?? '');
      }
    }
    const close = html.indexOf('>', position);
    index = close < 0 ? html.length : close + 1;
    let text = '';
    if (TEXT_ELEMENTS.has(name)) {
      const end = html.slice(index).search(new RegExp(`</${name}[\\s/>]`, 'i'));
      const stop = end < 0 ? html.length : index + end;
      text = html.slice(index, stop);
      index = stop;
    }
    tags.push({ name, attributes, text });
  }
  return tags;
}

/** Attributes that hold one address a browser loads or sends to. */
const ADDRESS_ATTRIBUTES = [
  'src',
  'href',
  'xlink:href',
  'action',
  'formaction',
  'data',
  'poster',
  'background',
  'manifest',
] as const;
/** Attributes that hold several addresses, each with a size after a space, separated by commas. */
const ADDRESS_LIST_ATTRIBUTES = ['srcset', 'imagesrcset'] as const;
/** `ping` holds several addresses separated by spaces. */
const ADDRESS_WORDS_ATTRIBUTES = ['ping'] as const;

/** Every address a tag refers to, as written. */
function addressesOf(tag: HtmlTag): string[] {
  const value = (name: string) => {
    const found = tag.attributes.get(name);
    return found === undefined ? [] : [found];
  };
  return [
    ...ADDRESS_ATTRIBUTES.flatMap(value),
    ...ADDRESS_LIST_ATTRIBUTES.flatMap(value).flatMap((list) =>
      list.split(',').map((part) => part.trim().split(/\s+/)[0] ?? ''),
    ),
    ...ADDRESS_WORDS_ATTRIBUTES.flatMap(value).flatMap((list) =>
      list.split(/\s+/).filter((part) => part !== ''),
    ),
  ];
}

/** A character reference other than `&amp;`: `&#47;`, `&#x2f;`, `&sol;`. */
const CHARACTER_REFERENCE = /&(?!amp;)(?:#[0-9]+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*)/;

/**
 * True if an address stays at the app's own origin: `/icon.svg` and `icon.svg` do; `https://…`,
 * `//host/…`, `data:` and every other address with a scheme do not. The address is read as a
 * browser reads it: tabs and line breaks are dropped, white space around it too, and a
 * backslash counts as a slash.
 */
function isLocalAddress(address: string): boolean {
  let text = address.replace(/[\t\n\r]/g, '');
  while (text !== '' && text.charCodeAt(0) <= 0x20) {
    text = text.slice(1);
  }
  return !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(text) && !/^[/\\]{2}/.test(text);
}

/** What a page is expected to say about itself. */
export interface PageExpectations {
  /** The language of the page. Default `de-CH`. */
  lang?: string;
  /** The title of the page, usually the name of the edition. Not checked unless given. */
  title?: string;
}

/** The namespaces of an inline drawing are names, not addresses that get loaded. */
const XML_NAMESPACE = /http:\/\/www\.w3\.org\/[\w/.#-]*/g;
/** An address of another origin anywhere in the text of the file. */
const FOREIGN_ADDRESS =
  /\b(?:https?|wss?):\/\/[^\s"'<>]*|\b(?:src|href)\s*=\s*["']?\/\/[^\s"'<>]*/gi;

/**
 * What is wrong with an `index.html` against the rules of the suite:
 *
 * - `robots.meta`: `<meta name="robots">` with `noindex` and `nofollow`;
 * - `html.address`: a script, style sheet, font, image or form that points to another origin,
 *   or an address of another origin anywhere in the text of the file (a preconnect, an
 *   `@import`, a comment);
 * - `html.encoded_address`: an address written with character references, which this test
 *   does not resolve;
 * - `html.no_address`: the page refers to nothing at all, so it is hardly the page of an app;
 * - `html.inline_script`, `html.inline_style`, `html.inline_handler`: inline code and styles,
 *   which the policy would block;
 * - `html.refresh`: a `<meta http-equiv="refresh">`;
 * - `html.lang`, `html.title`: the language (default `de-CH`) and, if given, the title.
 */
export function htmlProblems(html: string, expected: PageExpectations = {}): SecurityProblem[] {
  const problems: SecurityProblem[] = [];
  const report = (rule: string, message: string) => {
    problems.push({ file: 'html', rule, message });
  };
  const tags = tagsOf(html);
  const attribute = (tag: HtmlTag | undefined, name: string) => tag?.attributes.get(name) ?? '';

  const robots = attribute(
    tags.find((tag) => tag.name === 'meta' && attribute(tag, 'name').toLowerCase() === 'robots'),
    'content',
  );
  if (!/\bnoindex\b/i.test(robots) || !/\bnofollow\b/i.test(robots)) {
    report(
      'robots.meta',
      '<meta name="robots"> must say «noindex, nofollow»: the app stays out of search engines.',
    );
  }

  const addresses = tags.flatMap(addressesOf);
  if (addresses.length === 0) {
    report(
      'html.no_address',
      'The page refers to no script, style sheet or icon: is it the page of the app?',
    );
  }
  const foreign: string[] = [];
  for (const address of addresses) {
    if (CHARACTER_REFERENCE.test(address)) {
      foreign.push(address);
      report(
        'html.encoded_address',
        `The address «${address}» is written with character references: write it plainly (only &amp; is read).`,
      );
    } else if (!isLocalAddress(address.replaceAll('&amp;', '&'))) {
      foreign.push(address);
      report(
        'html.address',
        `«${address}» points to another origin: the page loads everything from its own.`,
      );
    }
  }
  // Nothing hides in the text of the file either. What was reported above is not said twice.
  for (const [found] of html.replaceAll(XML_NAMESPACE, '').matchAll(FOREIGN_ADDRESS)) {
    if (!foreign.some((address) => address.includes(found) || found.includes(address))) {
      report('html.address', `The text of the file holds an address of another origin: ${found}`);
    }
  }

  for (const tag of tags) {
    if (tag.name === 'script' && (!tag.attributes.has('src') || tag.text.trim() !== '')) {
      report(
        'html.inline_script',
        'A <script> must load a file of the app and hold no code itself.',
      );
    }
    if (tag.name === 'style') {
      report('html.inline_style', 'A <style> element: styles come from a file of the app.');
    }
    if (tag.attributes.has('style')) {
      report(
        'html.inline_style',
        `<${tag.name}> has a style attribute: styles come from a file of the app.`,
      );
    }
    for (const name of tag.attributes.keys()) {
      // A handler is `on` and the name of an event, in letters: `onclick`, not `one-time`.
      if (/^on[a-z]+$/.test(name)) {
        report(
          'html.inline_handler',
          `<${tag.name}> has the handler ${name}: code comes from a file of the app.`,
        );
      }
    }
    if (tag.name === 'meta' && attribute(tag, 'http-equiv').toLowerCase() === 'refresh') {
      report(
        'html.refresh',
        'A <meta http-equiv="refresh"> can send the person to another address.',
      );
    }
  }

  const lang = expected.lang ?? 'de-CH';
  const found = attribute(
    tags.find((tag) => tag.name === 'html'),
    'lang',
  );
  if (found !== lang) {
    report('html.lang', `<html lang> must be «${lang}», found «${found}».`);
  }
  if (expected.title !== undefined) {
    const title = (tags.find((tag) => tag.name === 'title')?.text ?? '')
      .trim()
      .replace(/\s+/g, ' ');
    if (title !== expected.title) {
      report('html.title', `<title> must be «${expected.title}», found «${title}».`);
    }
  }
  return problems;
}

/** The standard test of security over both files: `headerProblems` and `htmlProblems`. */
export function securityProblems(
  files: { headers: string; html: string },
  expected: PageExpectations = {},
): SecurityProblem[] {
  return [...headerProblems(files.headers), ...htmlProblems(files.html, expected)];
}

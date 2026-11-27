// Origin: BanioX/Randen apps/web/public/_headers @ e0f0907 — adapted: as the fixture of a headers file that passes; comments neutral
// Origin: BanioX/Randen apps/web/index.html @ e0f0907 — adapted: as the fixture of a page that passes; a made-up name, an inline drawing added
import { describe, expect, it } from 'vitest';
import {
  headerProblems,
  htmlProblems,
  parseHeadersFile,
  securityProblems,
  type SecurityProblem,
} from '../src';

const POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
];

/** A headers file as an edition ships it; single lines can be replaced or left out. */
function headersFile(
  changes: {
    policy?: readonly string[] | null;
    frame?: string | null;
    permissions?: string | null;
    robots?: string | null;
    everyPath?: readonly string[];
    after?: readonly string[];
  } = {},
): string {
  const {
    policy = POLICY,
    frame = 'DENY',
    permissions = 'camera=(self), microphone=(), geolocation=(), payment=()',
    robots = 'noindex, nofollow',
    everyPath = [],
    after = [],
  } = changes;
  const line = (name: string, value: string | null) =>
    value === null ? [] : [`  ${name}: ${value}`];
  return [
    '# Response headers on the host. The preview server applies the same file.',
    "# connect-src 'self': the app talks to no other server; nothing leaves the device.",
    '/*',
    ...line('Content-Security-Policy', policy === null ? null : policy.join('; ')),
    '  X-Content-Type-Options: nosniff',
    ...line('X-Frame-Options', frame),
    '  Referrer-Policy: strict-origin-when-cross-origin',
    ...line('Permissions-Policy', permissions),
    '  Cross-Origin-Opener-Policy: same-origin',
    '  # Never in search engines; also on preview links.',
    ...line('X-Robots-Tag', robots),
    ...everyPath,
    '',
    '# Hashed build output never changes under the same name.',
    '/assets/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '# The service worker must always be revalidated, otherwise updates get stuck.',
    '/sw.js',
    '  Cache-Control: no-cache',
    ...after,
    '',
  ].join('\n');
}

/** The policy with one directive replaced (or added, or left out with `null`). */
function policyWith(name: string, sources: string | null): string[] {
  const rest = POLICY.filter((directive) => !directive.startsWith(`${name} `));
  return sources === null ? rest : [...rest, `${name} ${sources}`.trim()];
}

/** A page as an edition ships it; `head` and `body` add markup. */
function page(
  changes: { lang?: string | null; robots?: string | null; head?: string; body?: string } = {},
): string {
  const { lang = 'de-CH', robots = 'noindex, nofollow', head = '', body = '' } = changes;
  return [
    '<!doctype html>',
    lang === null ? '<html>' : `<html lang="${lang}">`,
    '  <head>',
    '    <meta charset="UTF-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />',
    '    <meta name="theme-color" content="#f9f5f0" media="(prefers-color-scheme: light)" />',
    '    <meta name="color-scheme" content="light dark" />',
    robots === null ? '' : `    <meta name="robots" content="${robots}" />`,
    '    <!-- Installed on the home screen: full screen, own name, readable status bar. -->',
    '    <meta name="mobile-web-app-capable" content="yes" />',
    '    <meta name="apple-mobile-web-app-title" content="Muster" />',
    '    <!-- Phone numbers in notes are not links unless the app makes them one. -->',
    '    <meta name="format-detection" content="telephone=no" />',
    '    <link rel="icon" href="/icon.svg" type="image/svg+xml" />',
    '    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
    '    <title>Muster</title>',
    head,
    '  </head>',
    '  <body>',
    '    <div id="root"></div>',
    // The namespace of an inline drawing is a name, not an address that gets loaded.
    '    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><path d="M0 0h8v8z" /></svg>',
    body,
    '    <script type="module" src="/src/main.tsx"></script>',
    '  </body>',
    '</html>',
    '',
  ].join('\n');
}

const rulesOf = (problems: readonly SecurityProblem[]) => problems.map((problem) => problem.rule);
const headerRules = (changes?: Parameters<typeof headersFile>[0]) =>
  rulesOf(headerProblems(headersFile(changes)));
const pageRules = (changes?: Parameters<typeof page>[0]) => rulesOf(htmlProblems(page(changes)));

describe('headerProblems', () => {
  it('finds nothing in a headers file that follows the rules', () => {
    expect(headerProblems(headersFile())).toEqual([]);
    expect(headerProblems(headersFile().replaceAll('\n', '\r\n'))).toEqual([]);
    // Names of headers and keywords of the policy in any case.
    expect(
      headerProblems(
        headersFile()
          .replace('Content-Security-Policy', 'content-security-policy')
          .replace('X-Robots-Tag', 'X-ROBOTS-TAG')
          .replace('DENY', 'deny')
          .replace("default-src 'self'", "Default-Src 'SELF'"),
      ),
    ).toEqual([]);
    // A camera the app never asks for.
    expect(headerRules({ permissions: 'camera=(), microphone=(), geolocation=()' })).toEqual([]);
    expect(headerRules({ permissions: 'geolocation=(),microphone=( ),camera=self' })).toEqual([]);
  });

  it('marks every finding as one of the headers file', () => {
    const problems = headerProblems('');
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.every((problem) => problem.file === 'headers')).toBe(true);
    expect(rulesOf(problems)).toEqual([
      'csp.missing',
      'frame.options',
      'robots.header',
      'permissions.camera',
      'permissions.microphone',
      'permissions.geolocation',
    ]);
  });

  describe('the file itself', () => {
    it('headers.line: a header before any path, and a line that is no «Name: value»', () => {
      expect(rulesOf(headerProblems(`  X-Frame-Options: DENY\n${headersFile()}`))).toEqual([
        'headers.line',
      ]);
      const problems = headerProblems(headersFile({ everyPath: ['  no colon here'] }));
      expect(problems).toEqual([
        {
          file: 'headers',
          rule: 'headers.line',
          message: 'Line 12 is no path and no «Name: value» below a path: no colon here',
        },
      ]);
      expect(headerRules({ everyPath: ['  : value without a name'] })).toEqual(['headers.line']);
    });

    it('headers.line: a line that removes a header', () => {
      expect(headerRules({ after: ['  ! Content-Security-Policy'] })).toEqual(['headers.line']);
      expect(headerRules({ after: ['  ! X-Robots-Tag'] })).toEqual(['headers.line']);
      expect(headerRules({ after: ['  !X-Frame-Options: DENY'] })).toEqual(['headers.line']);
    });

    it('headers.path: every path gets the same policy, from the rule for every path', () => {
      for (const header of [
        "Content-Security-Policy: default-src 'self' https://cdn.example.invalid",
        'X-Robots-Tag: all',
        'X-Frame-Options: SAMEORIGIN',
        'Permissions-Policy: camera=*',
        'x-robots-tag: noindex, nofollow',
      ]) {
        const problems = headerProblems(headersFile({ after: [`  ${header}`] }));
        expect(rulesOf(problems), header).toEqual(['headers.path']);
        expect(problems[0]?.message, header).toContain('/sw.js');
      }
      // Other headers may differ by path.
      expect(headerRules({ after: ['  X-Content-Type-Options: nosniff'] })).toEqual([]);
    });

    it('headers.path: a policy for some paths only is no policy for every path', () => {
      const onlyPages = headersFile().replace('/*\n', '/index.html\n');
      expect(rulesOf(headerProblems(onlyPages))).toEqual([
        'headers.path',
        'headers.path',
        'headers.path',
        'headers.path',
        'csp.missing',
        'frame.options',
        'robots.header',
        'permissions.camera',
        'permissions.microphone',
        'permissions.geolocation',
      ]);
    });

    it('headers.repeated: a policy header is set once', () => {
      expect(headerRules({ everyPath: ["  Content-Security-Policy: default-src 'self'"] })).toEqual(
        ['headers.repeated'],
      );
      expect(headerRules({ everyPath: ['  X-Robots-Tag: all'] })).toEqual(['headers.repeated']);
      // Also in a second rule for every path.
      expect(headerRules({ after: ['/*', '  x-frame-options: SAMEORIGIN'] })).toEqual([
        'headers.repeated',
      ]);
    });
  });

  describe('Content-Security-Policy', () => {
    it('csp.missing: there is a policy', () => {
      expect(headerRules({ policy: null })).toEqual(['csp.missing']);
    });

    it("csp.directive: everything comes from the app's own origin", () => {
      const required: [name: string, source: string][] = [
        ['default-src', "'self'"],
        ['script-src', "'self'"],
        ['font-src', "'self'"],
        ['connect-src', "'self'"],
        ['object-src', "'none'"],
        ['base-uri', "'self'"],
        ['form-action', "'self'"],
        ['frame-ancestors', "'none'"],
      ];
      for (const [name, source] of required) {
        // Left out.
        const missing = headerProblems(headersFile({ policy: policyWith(name, null) }));
        expect(rulesOf(missing), name).toEqual(['csp.directive']);
        expect(missing[0]?.message, name).toBe(
          `Content-Security-Policy: ${name} must be ${source} and nothing else, found no such directive.`,
        );
        // Another source, a further source, no source.
        for (const sources of [
          source === "'self'" ? "'none'" : "'self'",
          `${source} https://cdn.example.invalid`,
          `${source} data:`,
          `${source} blob:`,
          `${source} 'unsafe-inline'`,
          `${source} ${source}`,
          '*',
          'https:',
          '',
        ]) {
          expect(headerRules({ policy: policyWith(name, sources) }), `${name} ${sources}`).toEqual([
            'csp.directive',
          ]);
        }
        expect(headerRules({ policy: policyWith(name, source) }), name).toEqual([]);
      }
    });

    it("csp.directive: connect-src is 'self', so the app talks to no server but its own", () => {
      const problems = headerProblems(
        headersFile({ policy: policyWith('connect-src', "'self' https://api.example.invalid") }),
      );
      expect(problems).toEqual([
        {
          file: 'headers',
          rule: 'csp.directive',
          message:
            "Content-Security-Policy: connect-src must be 'self' and nothing else, found «'self' https://api.example.invalid».",
        },
      ]);
      expect(
        headerRules({ policy: policyWith('connect-src', "'self' wss://example.invalid") }),
      ).toEqual(['csp.directive']);
    });

    it('csp.source: no foreign origin, no wildcard and no unsafe source in any directive', () => {
      for (const sources of [
        "'self' https://fonts.example.invalid",
        "'self' http://example.invalid",
        "'self' wss://example.invalid",
        "'self' example.invalid",
        "'self' *.example.invalid",
        "'self' https:",
        '*',
        "'self' 'unsafe-inline'",
        "'self' 'unsafe-eval'",
        "'self' 'nonce-abc123'",
        "'self' 'strict-dynamic'",
        "'self' filesystem:",
        "'self' mediastream:",
      ]) {
        for (const name of ['img-src', 'style-src', 'worker-src', 'media-src', 'frame-src']) {
          expect(headerRules({ policy: policyWith(name, sources) }), `${name} ${sources}`).toEqual([
            'csp.source',
          ]);
        }
      }
      // Each foreign source is a finding of its own.
      expect(
        headerRules({
          policy: policyWith('img-src', 'https://a.example.invalid https://b.example.invalid'),
        }),
      ).toEqual(['csp.source', 'csp.source']);
    });

    it('csp.source: a directive names a source', () => {
      expect(headerRules({ policy: policyWith('img-src', '') })).toEqual(['csp.source']);
      expect(headerRules({ policy: [...POLICY, 'upgrade-insecure-requests'] })).toEqual([
        'csp.source',
      ]);
    });

    it('csp.source: photos and files of the device are local, but never code or styles', () => {
      for (const name of ['img-src', 'media-src', 'worker-src', 'manifest-src']) {
        expect(headerRules({ policy: policyWith(name, "'self' data: blob:") }), name).toEqual([]);
        expect(headerRules({ policy: policyWith(name, "'none'") }), name).toEqual([]);
      }
      for (const name of [
        'style-src',
        'style-src-elem',
        'style-src-attr',
        'script-src-elem',
        'script-src-attr',
      ]) {
        expect(headerRules({ policy: policyWith(name, "'self' data:") }), name).toEqual([
          'csp.source',
        ]);
        expect(headerRules({ policy: policyWith(name, "'self' blob:") }), name).toEqual([
          'csp.source',
        ]);
        expect(headerRules({ policy: policyWith(name, "'self'") }), name).toEqual([]);
        expect(headerRules({ policy: policyWith(name, "'none'") }), name).toEqual([]);
      }
    });

    it('csp.repeated: a directive stands once, or the second one fools the reader', () => {
      // A browser takes the first `script-src`; whoever reads the file sees the strict one.
      const policy = ["script-src 'self' https://cdn.example.invalid", ...POLICY];
      expect(headerRules({ policy })).toEqual(['csp.repeated', 'csp.directive']);
      expect(headerRules({ policy: [...POLICY, "img-src 'self'"] })).toEqual(['csp.repeated']);
    });

    it('reads a policy with spare semicolons and spaces', () => {
      const policy = [`  ${POLICY.join(' ;  ')} ; ; `];
      expect(headerRules({ policy })).toEqual([]);
    });
  });

  it('frame.options: no other site frames the app', () => {
    expect(headerRules({ frame: null })).toEqual(['frame.options']);
    expect(headerRules({ frame: 'SAMEORIGIN' })).toEqual(['frame.options']);
    expect(headerRules({ frame: 'ALLOW-FROM https://example.invalid' })).toEqual(['frame.options']);
    expect(headerRules({ frame: 'deny' })).toEqual([]);
  });

  it('robots.header: the app stays out of search engines', () => {
    for (const robots of [null, 'all', 'noindex', 'nofollow', 'index, nofollow', 'none', '']) {
      expect(headerRules({ robots }), String(robots)).toEqual(['robots.header']);
    }
    for (const robots of [
      'noindex, nofollow',
      'nofollow,noindex',
      'NOINDEX, NOFOLLOW, noarchive',
    ]) {
      expect(headerRules({ robots }), robots).toEqual([]);
    }
  });

  it('permissions.camera: the camera for the app itself at most', () => {
    for (const permissions of [
      'microphone=(), geolocation=()',
      'camera=*, microphone=(), geolocation=()',
      'camera=(self "https://example.invalid"), microphone=(), geolocation=()',
      'camera=(*), microphone=(), geolocation=()',
      // The last one counts, as in a browser.
      'camera=(), microphone=(), geolocation=(), camera=*',
    ]) {
      expect(headerRules({ permissions }), permissions).toEqual(['permissions.camera']);
    }
    expect(
      headerRules({ permissions: 'camera=*, camera=(self), microphone=(), geolocation=()' }),
    ).toEqual([]);
  });

  it('permissions.microphone, permissions.geolocation: neither is ever asked for', () => {
    expect(headerRules({ permissions: null })).toEqual([
      'permissions.camera',
      'permissions.microphone',
      'permissions.geolocation',
    ]);
    expect(headerRules({ permissions: 'camera=(self), geolocation=()' })).toEqual([
      'permissions.microphone',
    ]);
    expect(
      headerRules({ permissions: 'camera=(self), microphone=(self), geolocation=()' }),
    ).toEqual(['permissions.microphone']);
    expect(headerRules({ permissions: 'camera=(self), microphone=()' })).toEqual([
      'permissions.geolocation',
    ]);
    expect(headerRules({ permissions: 'camera=(self), microphone=(), geolocation=*' })).toEqual([
      'permissions.geolocation',
    ]);
    expect(
      headerRules({ permissions: 'camera=(self), microphone=(), geolocation=(self)' }),
    ).toEqual(['permissions.geolocation']);
  });
});

describe('parseHeadersFile', () => {
  it('reads the paths with their headers, as the host does', () => {
    const rules = parseHeadersFile(headersFile());
    expect(rules.map((rule) => rule.path)).toEqual(['/*', '/assets/*', '/sw.js']);
    expect(rules[0]?.headers.map(([name]) => name)).toEqual([
      'Content-Security-Policy',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Cross-Origin-Opener-Policy',
      'X-Robots-Tag',
    ]);
    expect(rules[1]?.headers).toEqual([['Cache-Control', 'public, max-age=31536000, immutable']]);
    expect(rules[2]?.headers).toEqual([['Cache-Control', 'no-cache']]);
    expect(parseHeadersFile('')).toEqual([]);
    expect(parseHeadersFile('# only a comment\n\n')).toEqual([]);
  });

  it('gives each path a pattern over a whole path: a star matches anything', () => {
    const [every, assets, worker] = parseHeadersFile(headersFile());
    for (const path of ['/', '/customers', '/customers/1', '/assets/index-abc.js', '/sw.js']) {
      expect(every?.pattern.test(path), path).toBe(true);
    }
    expect(assets?.pattern.test('/assets/index-abc.js')).toBe(true);
    expect(assets?.pattern.test('/assets/')).toBe(true);
    expect(assets?.pattern.test('/other/assets/x.js')).toBe(false);
    expect(assets?.pattern.test('/assets')).toBe(false);
    expect(worker?.pattern.test('/sw.js')).toBe(true);
    // A dot of a path is a dot, not any sign.
    expect(worker?.pattern.test('/swxjs')).toBe(false);
    expect(worker?.pattern.test('/sw.js.map')).toBe(false);
    const [odd] = parseHeadersFile('/a+b(c)/*.js\n  Cache-Control: no-cache');
    expect(odd?.pattern.test('/a+b(c)/x.js')).toBe(true);
    expect(odd?.pattern.test('/aab(c)/x.js')).toBe(false);
  });

  it('keeps a colon in the value of a header', () => {
    const [rule] = parseHeadersFile('/*\n  Link: </icon.svg>; rel=preload; as=image');
    expect(rule?.headers).toEqual([['Link', '</icon.svg>; rel=preload; as=image']]);
  });

  it('fails with the number of the first line it cannot read', () => {
    expect(() => parseHeadersFile('  X-Frame-Options: DENY')).toThrow(
      'Invalid _headers line 1:   X-Frame-Options: DENY',
    );
    expect(() => parseHeadersFile('/*\n  X-Frame-Options: DENY\n\n  ! X-Robots-Tag')).toThrow(
      'Invalid _headers line 4',
    );
    expect(() => parseHeadersFile('/*\n  nothing\n  more nothing')).toThrow('line 2');
  });
});

describe('htmlProblems', () => {
  it('finds nothing in a page that follows the rules', () => {
    expect(htmlProblems(page())).toEqual([]);
    expect(htmlProblems(page(), { title: 'Muster' })).toEqual([]);
    expect(
      htmlProblems(page().replaceAll('\n', '\r\n'), { lang: 'de-CH', title: 'Muster' }),
    ).toEqual([]);
  });

  it('reads markup however it is written: capitals, single quotes, no quotes', () => {
    const shouting = [
      '<!DOCTYPE HTML>',
      '<HTML LANG=de-CH>',
      "<HEAD><META NAME='ROBOTS' CONTENT='NOINDEX, NOFOLLOW'><TITLE>Muster</TITLE>",
      '<LINK REL=icon HREF=/icon.svg></HEAD>',
      '<BODY><SCRIPT TYPE=module SRC=/src/main.tsx></SCRIPT></BODY></HTML>',
    ].join('\n');
    expect(htmlProblems(shouting, { title: 'Muster' })).toEqual([]);
  });

  it('marks every finding as one of the page', () => {
    const problems = htmlProblems('');
    expect(problems.every((problem) => problem.file === 'html')).toBe(true);
    expect(rulesOf(problems)).toEqual(['robots.meta', 'html.no_address', 'html.lang']);
  });

  it('robots.meta: the page tells search engines not to index the app', () => {
    for (const robots of [null, 'index, follow', 'noindex', 'nofollow', 'all', '']) {
      expect(pageRules({ robots }), String(robots)).toEqual(['robots.meta']);
    }
    expect(pageRules({ robots: 'NOINDEX,NOFOLLOW' })).toEqual([]);
    // A tag that is commented out, or written inside a script, is no tag of the page.
    expect(
      pageRules({
        robots: null,
        head: '<!-- <meta name="robots" content="noindex, nofollow"> -->',
      }),
    ).toEqual(['robots.meta']);
    expect(
      pageRules({
        robots: null,
        body: `<script src="/a.js">'<meta name="robots" content="noindex, nofollow">'</script>`,
      }),
    ).toEqual(['robots.meta', 'html.inline_script']);
    // Another meta tag with the same words does not count.
    expect(
      pageRules({ robots: null, head: '<meta name="description" content="noindex, nofollow">' }),
    ).toEqual(['robots.meta']);
  });

  describe('html.address: nothing is loaded from another origin', () => {
    it('finds a script, a style sheet, a font, an image and a form of another origin', () => {
      for (const markup of [
        '<script src="https://cdn.example.invalid/app.js"></script>',
        '<script src="//cdn.example.invalid/app.js"></script>',
        '<link rel="stylesheet" href="https://fonts.example.invalid/css">',
        '<link rel="preconnect" href="//fonts.example.invalid">',
        '<link rel="preload" as="font" href="http://example.invalid/font.woff2">',
        '<img src="https://example.invalid/logo.png">',
        '<img src="/logo.png" srcset="/logo.png 1x, https://example.invalid/logo@2x.png 2x">',
        '<link rel="preload" as="image" imagesrcset="//example.invalid/a.png 2x">',
        '<form action="https://example.invalid/send"></form>',
        '<button formaction="https://example.invalid/send"></button>',
        '<a href="/x" ping="/log https://example.invalid/log">x</a>',
        '<base href="https://example.invalid/">',
        '<object data="https://example.invalid/x.pdf"></object>',
        '<video poster="https://example.invalid/x.png"></video>',
        '<iframe src="https://example.invalid/"></iframe>',
        '<svg><use xlink:href="https://example.invalid/sprite.svg#a" /></svg>',
        '<link rel="manifest" href="wss://example.invalid/manifest">',
      ]) {
        const problems = htmlProblems(page({ body: markup }));
        expect(rulesOf(problems), markup).toEqual(['html.address']);
        expect(problems[0]?.message, markup).toContain('points to another origin');
      }
    });

    it('finds an address with a scheme, whatever the scheme is', () => {
      for (const address of [
        'data:image/svg+xml,%3Csvg/%3E',
        'javascript:alert(1)',
        'mailto:muster@example.invalid',
        'blob:abc',
        'file:///etc/x',
        'HTTPS://example.invalid/x',
      ]) {
        expect(pageRules({ head: `<link rel="icon" href="${address}">` }), address).toEqual([
          'html.address',
        ]);
      }
    });

    it('reads an address as a browser does: white space, line breaks and backslashes', () => {
      for (const address of [
        ' https://example.invalid/x',
        '\thttps://example.invalid/x',
        'ht\ntps://example.invalid/x',
        '\\\\example.invalid\\x',
        '/\\example.invalid/x',
        ' //example.invalid/x',
      ]) {
        expect(pageRules({ head: `<link rel="icon" href="${address}">` }), address).toContain(
          'html.address',
        );
      }
    });

    it('lets every address of the own origin pass', () => {
      for (const address of [
        '/icon.svg',
        'icon.svg',
        './icon.svg',
        '../icon.svg',
        '/icons/a.svg?v=2&amp;size=64',
        '#top',
        '?page=2',
        '',
        '/a:b',
      ]) {
        expect(pageRules({ head: `<link rel="icon" href="${address}">` }), address).toEqual([]);
      }
      expect(
        pageRules({ body: '<img src="/a.png" srcset="/a.png 1x, /a@2x.png 2x" alt="">' }),
      ).toEqual([]);
    });

    it('finds an address in the text of the file: a comment, an import, a meta tag', () => {
      for (const markup of [
        '<!-- <script src="https://cdn.example.invalid/app.js"></script> -->',
        '<!-- see https://example.invalid/docs -->',
        '<meta property="og:image" content="https://example.invalid/a.png">',
        '<p>wss://example.invalid/socket</p>',
        '<p>HTTP://EXAMPLE.INVALID</p>',
      ]) {
        const problems = htmlProblems(page({ body: markup }));
        expect(rulesOf(problems), markup).toEqual(['html.address']);
        expect(problems[0]?.message, markup).toContain('The text of the file holds an address');
      }
      // Reported once, where the tag was already found.
      expect(pageRules({ body: '<img src="https://example.invalid/a.png">' })).toEqual([
        'html.address',
      ]);
      // The namespace of a drawing is no address, but only as a name.
      expect(pageRules({ body: '<img src="http://www.w3.org/2000/svg">' })).toEqual([
        'html.address',
      ]);
    });

    it('html.encoded_address: an address written with character references', () => {
      for (const address of [
        '&#104;ttps://example.invalid/x',
        '&#x68;ttps://example.invalid/x',
        '&sol;&sol;example.invalid/x',
        '&#47;&#47;example.invalid',
        '/icon.svg?a=1&b=2',
        '&ampx;',
      ]) {
        expect(pageRules({ head: `<link rel="icon" href="${address}">` }), address).toContain(
          'html.encoded_address',
        );
      }
    });

    it('html.no_address: a page that refers to nothing is hardly the page of an app', () => {
      const bare =
        '<html lang="de-CH"><head><meta name="robots" content="noindex, nofollow"></head></html>';
      expect(rulesOf(htmlProblems(bare))).toEqual(['html.no_address']);
    });
  });

  it('html.inline_script: a script loads a file of the app and holds no code', () => {
    for (const markup of [
      '<script>window.x = 1;</script>',
      '<script type="module">import "/a.js";</script>',
      '<script src="/a.js">window.x = 1;</script>',
      '<script type="application/json">{}</script>',
      '<SCRIPT>x()</SCRIPT>',
      '<script></script>',
    ]) {
      expect(pageRules({ body: markup }), markup).toEqual(['html.inline_script']);
    }
    expect(
      pageRules({ body: '<script src="/a.js"></script><script src="/b.js">\n</script>' }),
    ).toEqual([]);
    // What stands in a script is text: a tag written there is none.
    expect(
      pageRules({ body: `<script src="/a.js">'<style>x</style><p onclick="x()">'</script>` }),
    ).toEqual(['html.inline_script']);
  });

  it('html.inline_style: styles come from a file of the app', () => {
    expect(pageRules({ head: '<style>body { margin: 0 }</style>' })).toEqual(['html.inline_style']);
    expect(pageRules({ body: '<div style="color: red"></div>' })).toEqual(['html.inline_style']);
    expect(pageRules({ body: '<div STYLE></div>' })).toEqual(['html.inline_style']);
    expect(
      pageRules({ head: '<style>@import url(https://example.invalid/a.css);</style>' }),
    ).toEqual(['html.address', 'html.inline_style']);
    expect(pageRules({ body: '<div data-style="x" class="style"></div>' })).toEqual([]);
  });

  it('html.inline_handler: code comes from a file of the app', () => {
    expect(pageRules({ body: '<button onclick="go()">x</button>' })).toEqual([
      'html.inline_handler',
    ]);
    expect(pageRules({ body: '<img src="/a.png" onerror=go() ONLOAD="go()">' })).toEqual([
      'html.inline_handler',
      'html.inline_handler',
    ]);
    expect(pageRules({ body: '<div data-onclick="x" one-time></div>' })).toEqual([]);
  });

  it('html.refresh: no tag sends the person to another address', () => {
    expect(pageRules({ head: '<meta http-equiv="refresh" content="0; url=/other">' })).toEqual([
      'html.refresh',
    ]);
    expect(pageRules({ head: '<meta HTTP-EQUIV="Refresh" content="5">' })).toEqual([
      'html.refresh',
    ]);
    expect(
      pageRules({ head: '<meta http-equiv="refresh" content="0; url=https://example.invalid/">' }),
    ).toEqual(['html.address', 'html.refresh']);
    expect(pageRules({ head: '<meta http-equiv="content-language" content="de-CH">' })).toEqual([]);
  });

  it('html.lang: the page says its language', () => {
    for (const lang of [null, 'de', 'en', 'de-ch', 'de-DE', '']) {
      const problems = htmlProblems(page({ lang }));
      expect(rulesOf(problems), String(lang)).toEqual(['html.lang']);
      expect(problems[0]?.message).toBe(`<html lang> must be «de-CH», found «${lang ?? ''}».`);
    }
    expect(rulesOf(htmlProblems(page({ lang: 'fr-CH' }), { lang: 'fr-CH' }))).toEqual([]);
    expect(rulesOf(htmlProblems(page(), { lang: 'fr-CH' }))).toEqual(['html.lang']);
  });

  it('html.title: the page carries the name it is given, if one is expected', () => {
    expect(htmlProblems(page(), { title: 'Beispiel' })).toEqual([
      { file: 'html', rule: 'html.title', message: '<title> must be «Beispiel», found «Muster».' },
    ]);
    const untitled = page().replace('<title>Muster</title>', '');
    expect(rulesOf(htmlProblems(untitled, { title: 'Muster' }))).toEqual(['html.title']);
    expect(htmlProblems(untitled)).toEqual([]);
    const spaced = page().replace('<title>Muster</title>', '<title>\n  Betrieb   Muster\n</title>');
    expect(htmlProblems(spaced, { title: 'Betrieb Muster' })).toEqual([]);
    // The title is text: a tag written in it is none.
    const tagged = page().replace(
      '<title>Muster</title>',
      '<title><b style="x">Muster</b></title>',
    );
    expect(rulesOf(htmlProblems(tagged, { title: 'Muster' }))).toEqual(['html.title']);
  });

  it('copes with markup that is cut off or odd, without failing', () => {
    for (const html of [
      '<',
      '<html',
      '<html lang="de-CH',
      '<!-- never closed',
      '<script src="/a.js">never closed',
      '<a href=>x</a>',
      '< p>a < b</p>',
      '<p ="x">',
      '<img src="/a.png" alt="a > b">',
      '</html>',
    ]) {
      expect(() => htmlProblems(html), html).not.toThrow();
    }
    // A «>» inside a value does not end the tag: the handler after it is still found.
    expect(
      rulesOf(htmlProblems(page({ body: '<img src="/a.png" alt="a > b" onerror="x()">' }))),
    ).toEqual(['html.inline_handler']);
    // The first of two equal attributes counts, as in a browser.
    const twice = page().replace('<html lang="de-CH">', '<html lang="de-CH" lang="en">');
    expect(htmlProblems(twice)).toEqual([]);
    expect(
      rulesOf(htmlProblems(twice.replace('lang="de-CH" lang="en"', 'lang="en" lang="de-CH"'))),
    ).toEqual(['html.lang']);
    expect(pageRules({ body: '<img src="/a.png" src="https://example.invalid/a.png">' })).toEqual([
      'html.address',
    ]);
  });
});

describe('securityProblems', () => {
  it('finds nothing in the two files of an edition that follows the rules', () => {
    expect(securityProblems({ headers: headersFile(), html: page() })).toEqual([]);
    expect(securityProblems({ headers: headersFile(), html: page() }, { title: 'Muster' })).toEqual(
      [],
    );
  });

  it('reports the findings of both files, the headers first', () => {
    const problems = securityProblems(
      {
        headers: headersFile({ robots: 'all', policy: policyWith('connect-src', '*') }),
        html: page({ robots: 'all', lang: 'en' }),
      },
      { title: 'Beispiel' },
    );
    expect(problems.map(({ file, rule }) => `${file} ${rule}`)).toEqual([
      'headers csp.directive',
      'headers robots.header',
      'html robots.meta',
      'html html.lang',
      'html html.title',
    ]);
    for (const problem of problems) {
      expect(problem.message).toMatch(/\S/);
    }
  });

  it('fails for two empty files with every rule that needs something to be there', () => {
    expect(rulesOf(securityProblems({ headers: '', html: '' }))).toEqual([
      'csp.missing',
      'frame.options',
      'robots.header',
      'permissions.camera',
      'permissions.microphone',
      'permissions.geolocation',
      'robots.meta',
      'html.no_address',
      'html.lang',
    ]);
  });
});

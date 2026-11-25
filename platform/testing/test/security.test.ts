import { describe, expect, it } from 'vitest';
import { headerProblems, htmlProblems, parseHeadersFile, securityProblems } from '../src';

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const HEADERS = [
  '# The headers of the app shell',
  '/*',
  `  Content-Security-Policy: ${CSP}`,
  '  X-Frame-Options: DENY',
  '  X-Robots-Tag: noindex, nofollow',
  '  Permissions-Policy: camera=(self), microphone=(), geolocation=()',
  '  Referrer-Policy: no-referrer',
  '',
  '/assets/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '',
].join('\n');

const HTML = [
  '<!doctype html>',
  '<html lang="de-CH">',
  '  <head>',
  '    <meta charset="utf-8" />',
  '    <meta name="robots" content="noindex, nofollow" />',
  '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
  '    <title>Muster</title>',
  '    <link rel="icon" href="/icon.svg" />',
  '    <link rel="manifest" href="/manifest.webmanifest" />',
  '    <link rel="stylesheet" href="/assets/app.css" />',
  '  </head>',
  '  <body>',
  '    <!-- The app mounts here. -->',
  '    <div id="root"></div>',
  '    <script type="module" src="/assets/app.js"></script>',
  '  </body>',
  '</html>',
  '',
].join('\n');

const rulesOf = (problems: readonly { rule: string }[]) => problems.map((problem) => problem.rule);

/** The text with one part replaced; fails if the part is not there, so no case tests nothing. */
function swap(text: string, part: string, replacement: string): string {
  if (!text.includes(part)) {
    throw new Error(`The sample does not hold «${part}»`);
  }
  return text.replace(part, () => replacement);
}

const headersWith = (part: string, replacement: string) => swap(HEADERS, part, replacement);
const htmlWith = (part: string, replacement: string) => swap(HTML, part, replacement);
/** The page with something more in its body. */
const htmlAnd = (more: string) => htmlWith('<div id="root"></div>', `<div id="root"></div>${more}`);

describe('parseHeadersFile', () => {
  it('reads path patterns with their headers, without comments and empty lines', () => {
    const rules = parseHeadersFile(HEADERS);
    expect(rules.map((rule) => rule.path)).toEqual(['/*', '/assets/*']);
    expect(rules[0]?.headers.map(([name]) => name)).toEqual([
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Robots-Tag',
      'Permissions-Policy',
      'Referrer-Policy',
    ]);
    expect(rules[1]?.headers).toEqual([['Cache-Control', 'public, max-age=31536000, immutable']]);
  });

  it('turns a path into a pattern over a whole path', () => {
    const [every, assets, worker] = parseHeadersFile('/*\n/assets/*\n/sw.js\n');
    expect(every?.pattern.test('/')).toBe(true);
    expect(every?.pattern.test('/assets/app.js')).toBe(true);
    expect(assets?.pattern.test('/assets/app.js')).toBe(true);
    expect(assets?.pattern.test('/index.html')).toBe(false);
    expect(assets?.pattern.test('/other/assets/app.js')).toBe(false);
    expect(worker?.pattern.test('/sw.js')).toBe(true);
    // The dot is a dot, not any character.
    expect(worker?.pattern.test('/swxjs')).toBe(false);
    expect(worker?.pattern.test('/sw.js.map')).toBe(false);
  });

  it('reads a file with Windows line ends and a value that holds a colon', () => {
    const [rule] = parseHeadersFile('/*\r\n  Link: </icon.svg>; rel=icon\r\n');
    expect(rule?.headers).toEqual([['Link', '</icon.svg>; rel=icon']]);
  });

  it.each([
    ['a header before any path', '  X-Frame-Options: DENY\n/*\n', 1],
    ['a line without a colon', '/*\n  X-Frame-Options DENY\n', 2],
    ['a line that removes a header', '/*\n  X-Robots-Tag: noindex\n\n  ! X-Robots-Tag\n', 4],
    ['a line that starts with a colon', '/*\n  : DENY\n', 2],
  ])('throws for %s and names the line', (_what, text, line) => {
    expect(() => parseHeadersFile(text)).toThrow(`Invalid _headers line ${String(line)}:`);
  });

  it('reads an empty file as no rules', () => {
    expect(parseHeadersFile('')).toEqual([]);
    expect(parseHeadersFile('# nothing yet\n\n')).toEqual([]);
  });
});

describe('headerProblems', () => {
  it('finds nothing in a headers file that follows the rules', () => {
    expect(headerProblems(HEADERS)).toEqual([]);
  });

  it('reads the names of headers and directives in any case', () => {
    const shouted = HEADERS.replace('X-Frame-Options: DENY', 'x-frame-options: deny')
      .replace('X-Robots-Tag: noindex, nofollow', 'X-ROBOTS-TAG: NoIndex, NoFollow')
      .replace("default-src 'self'", "Default-Src 'SELF'")
      .replace('camera=(self), microphone=()', 'Camera=( self ), MICROPHONE=()');
    expect(headerProblems(shouted)).toEqual([]);
  });

  it('names every rule a file without headers breaks', () => {
    expect(rulesOf(headerProblems(''))).toEqual([
      'csp.missing',
      'frame.options',
      'robots.header',
      'permissions.camera',
      'permissions.microphone',
      'permissions.geolocation',
    ]);
    expect(headerProblems('').every((problem) => problem.file === 'headers')).toBe(true);
  });

  it('reports a line it cannot read with its number, instead of throwing', () => {
    expect(headerProblems(`  X-Early: 1\n${HEADERS}`)).toEqual([
      {
        file: 'headers',
        rule: 'headers.line',
        message: 'Line 1 is no path and no «Name: value» below a path: X-Early: 1',
      },
    ]);
    const removing = headersWith(
      '  X-Frame-Options: DENY',
      '  X-Frame-Options: DENY\n  ! X-Robots-Tag',
    );
    expect(rulesOf(headerProblems(removing))).toEqual(['headers.line']);
  });

  it('wants every policy header from the rule for every path', () => {
    const some = headersWith('/assets/*', '/assets/*\n  X-Frame-Options: SAMEORIGIN');
    expect(headerProblems(some)).toEqual([
      {
        file: 'headers',
        rule: 'headers.path',
        message:
          'X-Frame-Options is set for /assets/*: every path gets the same policy, from the rule for /*.',
      },
    ]);

    const only = HEADERS.replace('/*', '/index.html');
    expect(rulesOf(headerProblems(only))).toContain('headers.path');
    expect(rulesOf(headerProblems(only))).toContain('csp.missing');
  });

  it('names a policy header that is set twice', () => {
    const twice = headersWith(
      '  X-Robots-Tag: noindex, nofollow',
      '  X-Robots-Tag: noindex, nofollow\n  x-robots-tag: all',
    );
    expect(headerProblems(twice)).toEqual([
      { file: 'headers', rule: 'headers.repeated', message: 'x-robots-tag is set twice for /*.' },
    ]);
  });

  describe('Content-Security-Policy', () => {
    it('must be there', () => {
      const without = HEADERS.split('\n')
        .filter((line) => !line.includes('Content-Security-Policy'))
        .join('\n');
      expect(headerProblems(without)).toEqual([
        { file: 'headers', rule: 'csp.missing', message: 'No Content-Security-Policy for /*.' },
      ]);
    });

    it('names a directive that stands twice', () => {
      const twice = headersWith(
        "frame-ancestors 'none'",
        "frame-ancestors 'none'; script-src 'self' https://cdn.example.org;",
      );
      expect(headerProblems(twice)).toEqual([
        {
          file: 'headers',
          rule: 'csp.repeated',
          message: 'Content-Security-Policy names script-src twice.',
        },
      ]);
    });

    it.each([
      ["script-src 'self'", "script-src 'self' 'unsafe-inline'", "«'self' 'unsafe-inline'»"],
      ["script-src 'self'", "script-src 'unsafe-eval'", "«'unsafe-eval'»"],
      ["connect-src 'self'; ", '', 'no such directive'],
      [
        "connect-src 'self'",
        "connect-src 'self' https://api.example.org",
        'https://api.example.org',
      ],
      ["frame-ancestors 'none'", "frame-ancestors 'self'", "«'self'»"],
      ["object-src 'none'", 'object-src', '«»'],
      ["default-src 'self'", 'default-src *', '«*»'],
    ])('wants «%s» exactly, not «%s»', (part, replacement, found) => {
      const problems = headerProblems(headersWith(part, replacement));
      expect(rulesOf(problems)).toEqual(['csp.directive']);
      expect(problems[0]?.message).toContain(
        `must be ${part.trim().split(' ')[1]?.replace(';', '')}`,
      );
      expect(problems[0]?.message).toContain(found);
    });

    it.each([
      [
        "img-src 'self' data: blob:",
        "img-src 'self' https://images.example.org",
        'https://images.example.org',
      ],
      ["img-src 'self' data: blob:", 'img-src *', '*'],
      ["style-src 'self'", "style-src 'self' 'unsafe-inline'", "'unsafe-inline'"],
      ["worker-src 'self'", "worker-src 'self' 'wasm-unsafe-eval'", "'wasm-unsafe-eval'"],
    ])('allows no other origin and no unsafe source: «%s» as «%s»', (part, replacement, source) => {
      const problems = headerProblems(headersWith(part, replacement));
      expect(rulesOf(problems)).toEqual(['csp.source']);
      expect(problems[0]?.message).toContain(`names ${source};`);
      expect(problems[0]?.message).toContain('only');
    });

    it('allows photos and files of the device for images, but not for code and styles', () => {
      const problems = headerProblems(headersWith("style-src 'self'", "style-src 'self' data:"));
      expect(problems).toEqual([
        {
          file: 'headers',
          rule: 'csp.source',
          message:
            "Content-Security-Policy: style-src names data:; code and styles come from the app's own origin only.",
        },
      ]);
      const elements = headersWith(
        "style-src 'self'",
        "style-src 'self'; script-src-elem 'self' blob:",
      );
      expect(rulesOf(headerProblems(elements))).toEqual(['csp.source']);
    });

    it('names a directive without a source', () => {
      const problems = headerProblems(headersWith("worker-src 'self'", 'worker-src'));
      expect(problems).toEqual([
        {
          file: 'headers',
          rule: 'csp.source',
          message: 'Content-Security-Policy: worker-src names no source.',
        },
      ]);
    });
  });

  it('wants X-Frame-Options to deny', () => {
    expect(
      rulesOf(headerProblems(headersWith('X-Frame-Options: DENY', 'X-Frame-Options: SAMEORIGIN'))),
    ).toEqual(['frame.options']);
  });

  it('wants both words for search engines', () => {
    for (const value of ['noindex', 'nofollow', 'all', 'noindexing, nofollow']) {
      const file = headersWith('X-Robots-Tag: noindex, nofollow', `X-Robots-Tag: ${value}`);
      expect(rulesOf(headerProblems(file)), value).toEqual(['robots.header']);
    }
  });

  it('allows the camera for the app itself at most, no microphone and no location', () => {
    const policy = 'camera=(self), microphone=(), geolocation=()';
    const withPolicy = (value: string) => rulesOf(headerProblems(headersWith(policy, value)));
    expect(withPolicy('camera=(), microphone=(), geolocation=()')).toEqual([]);
    expect(withPolicy('camera=self, microphone=(), geolocation=()')).toEqual([]);
    expect(withPolicy('camera=*, microphone=(), geolocation=()')).toEqual(['permissions.camera']);
    expect(
      withPolicy('camera=(self "https://example.org"), microphone=(), geolocation=()'),
    ).toEqual(['permissions.camera']);
    expect(withPolicy('camera=(self), microphone=(self), geolocation=()')).toEqual([
      'permissions.microphone',
    ]);
    expect(withPolicy('camera=(self), microphone=()')).toEqual(['permissions.geolocation']);
    expect(withPolicy('camera, =(), microphone=(), geolocation=()')).toEqual([
      'permissions.camera',
    ]);
  });
});

describe('htmlProblems', () => {
  it('finds nothing in a page that follows the rules', () => {
    expect(htmlProblems(HTML)).toEqual([]);
    expect(htmlProblems(HTML, { lang: 'de-CH', title: 'Muster' })).toEqual([]);
  });

  it('wants the page out of search engines', () => {
    const without = htmlWith('    <meta name="robots" content="noindex, nofollow" />\n', '');
    expect(htmlProblems(without)).toEqual([
      {
        file: 'html',
        rule: 'robots.meta',
        message:
          '<meta name="robots"> must say «noindex, nofollow»: the app stays out of search engines.',
      },
    ]);
    const half = htmlWith('content="noindex, nofollow"', 'content="noindex"');
    expect(rulesOf(htmlProblems(half))).toEqual(['robots.meta']);
    const shouted = htmlWith(
      '<meta name="robots" content="noindex, nofollow" />',
      '<META NAME="ROBOTS" CONTENT="NOINDEX,NOFOLLOW">',
    );
    expect(htmlProblems(shouted)).toEqual([]);
  });

  describe('addresses', () => {
    it.each([
      [
        'a script of another origin',
        htmlWith('src="/assets/app.js"', 'src="https://cdn.example.org/app.js"'),
      ],
      [
        'a style sheet without a scheme',
        htmlWith('href="/assets/app.css"', 'href="//fonts.example.org/app.css"'),
      ],
      ['an image as data', htmlAnd('<img src="data:image/png;base64,AAAA" alt="" />')],
      [
        'one of several sizes of an image',
        htmlAnd('<img srcset="/a.png 1x, https://example.org/b.png 2x" alt="" />'),
      ],
      [
        'an address that is pinged',
        htmlAnd('<a href="/hilfe" ping="/zaehler https://example.org/ping">Hilfe</a>'),
      ],
      ['a form', htmlAnd('<form action="https://example.org/send"></form>')],
      ['an address with backslashes', htmlAnd('<img src="\\\\host\\bild.png" alt="" />')],
      ['a scheme behind white space', htmlAnd('<a href="  javascript:start()">Start</a>')],
      ['a scheme with a tab in it', htmlAnd('<a href="java\tscript:start()">Start</a>')],
      ['an address in a comment', htmlAnd('<!-- see https://example.org/docs -->')],
      [
        'a preconnect',
        htmlWith(
          '<link rel="icon" href="/icon.svg" />',
          '<link rel="icon" href="/icon.svg" /><link rel="preconnect" href="https://fonts.example.org" />',
        ),
      ],
    ])('names %s, once', (_what, html) => {
      const problems = htmlProblems(html);
      expect(rulesOf(problems)).toEqual(['html.address']);
      expect(problems[0]?.file).toBe('html');
    });

    it('says where the text of the file holds an address', () => {
      expect(htmlProblems(htmlAnd('<!-- see https://example.org/docs -->'))[0]?.message).toBe(
        'The text of the file holds an address of another origin: https://example.org/docs',
      );
    });

    it.each([
      ['a path from the root', htmlAnd('<img src="/bild.png" alt="" />')],
      ['a path beside the page', htmlAnd('<img src="bild.png" alt="" />')],
      ['a query with an ampersand', htmlAnd('<a href="/suche?a=1&amp;b=2">Suche</a>')],
      [
        'the namespace of an inline drawing',
        htmlAnd(
          '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="#zeichen" /></svg>',
        ),
      ],
      ['several sizes of an own image', htmlAnd('<img srcset="/a.png 1x, /b.png 2x" alt="" />')],
    ])('passes %s', (_what, html) => {
      expect(htmlProblems(html)).toEqual([]);
    });

    it('does not resolve character references: an address written with them is named', () => {
      const encoded = htmlWith('src="/assets/app.js"', 'src="&#x2f;&#x2f;cdn.example.org/app.js"');
      const problems = htmlProblems(encoded);
      expect(rulesOf(problems)).toEqual(['html.encoded_address']);
      expect(problems[0]?.message).toContain('&#x2f;&#x2f;cdn.example.org/app.js');
      expect(rulesOf(htmlProblems(htmlAnd('<a href="&sol;&sol;example.org">x</a>')))).toEqual([
        'html.encoded_address',
      ]);
    });

    it('doubts a page that refers to nothing at all', () => {
      const bare =
        '<html lang="de-CH"><head><meta name="robots" content="noindex, nofollow"></head><body></body></html>';
      expect(rulesOf(htmlProblems(bare))).toEqual(['html.no_address']);
    });
  });

  describe('inline code and styles', () => {
    it.each([
      ['html.inline_script', htmlAnd('<script>start();</script>')],
      [
        'html.inline_script',
        htmlWith('src="/assets/app.js"></script>', 'src="/assets/app.js">start();</script>'),
      ],
      ['html.inline_style', htmlAnd('<style>body { margin: 0; }</style>')],
      ['html.inline_style', htmlWith('<div id="root">', '<div id="root" style="display: none">')],
      ['html.inline_handler', htmlWith('<body>', '<body onload="start()">')],
      [
        'html.refresh',
        htmlWith(
          '<meta charset="utf-8" />',
          '<meta charset="utf-8" /><meta http-equiv="Refresh" content="0; url=/neu" />',
        ),
      ],
    ])('names %s', (rule, html) => {
      expect(rulesOf(htmlProblems(html))).toEqual([rule]);
    });

    it('says which element carries a style or a handler', () => {
      const styled = htmlWith('<div id="root">', '<div id="root" style="display: none">');
      expect(htmlProblems(styled)[0]?.message).toBe(
        '<div> has a style attribute: styles come from a file of the app.',
      );
      const handled = htmlWith('<body>', '<body onload="start()">');
      expect(htmlProblems(handled)[0]?.message).toBe(
        '<body> has the handler onload: code comes from a file of the app.',
      );
    });
  });

  describe('language and title', () => {
    it('wants de-CH unless another language is expected', () => {
      expect(htmlProblems(htmlWith('<html lang="de-CH">', '<html lang="de">'))).toEqual([
        { file: 'html', rule: 'html.lang', message: '<html lang> must be «de-CH», found «de».' },
      ]);
      expect(htmlProblems(htmlWith('<html lang="de-CH">', '<html>'))[0]?.message).toBe(
        '<html lang> must be «de-CH», found «».',
      );
      expect(rulesOf(htmlProblems(HTML, { lang: 'fr-CH' }))).toEqual(['html.lang']);
      expect(
        htmlProblems(htmlWith('<html lang="de-CH">', '<html lang="fr-CH">'), { lang: 'fr-CH' }),
      ).toEqual([]);
    });

    it('checks the title only where one is expected', () => {
      expect(htmlProblems(HTML, { title: 'Beispiel' })).toEqual([
        {
          file: 'html',
          rule: 'html.title',
          message: '<title> must be «Beispiel», found «Muster».',
        },
      ]);
      const spaced = htmlWith('<title>Muster</title>', '<title>\n  Betrieb   Muster\n</title>');
      expect(htmlProblems(spaced, { title: 'Betrieb Muster' })).toEqual([]);
      const none = htmlWith('    <title>Muster</title>\n', '');
      expect(htmlProblems(none)).toEqual([]);
      expect(rulesOf(htmlProblems(none, { title: 'Muster' }))).toEqual(['html.title']);
    });
  });

  describe('reads the page as a browser makes elements of it', () => {
    it.each([
      ['code inside a comment', htmlAnd('<!-- <script>start();</script> -->')],
      ['markup inside a text field', htmlAnd('<textarea><script>start();</script></textarea>')],
      ['a comment that never ends', `${HTML}<!-- offen <script>start();</script>`],
      ['a tag that is cut off', `${HTML}<div`],
      ['a script at the very end that is never closed', `${HTML}<script src="/assets/late.js">`],
      ['a stray «<»', htmlAnd('<p>1 < 2</p>')],
      [
        'attributes without quotes',
        htmlWith(
          '<script type="module" src="/assets/app.js">',
          '<script type=module src=/assets/app.js defer>',
        ),
      ],
      ['attributes in single quotes', htmlWith('<html lang="de-CH">', "<html lang='de-CH'>")],
      [
        'tags and attributes in capitals',
        htmlWith(
          '<script type="module" src="/assets/app.js"></script>',
          '<SCRIPT TYPE="module" SRC="/assets/app.js"></SCRIPT >',
        ),
      ],
      [
        'an attribute that stands twice: the first counts',
        htmlWith('<html lang="de-CH">', '<html lang="de-CH" lang="en">'),
      ],
    ])('passes %s', (_what, html) => {
      expect(htmlProblems(html)).toEqual([]);
    });

    it('takes the first value of an attribute that stands twice, also where it is the wrong one', () => {
      const twice = htmlWith('<html lang="de-CH">', '<html lang="en" lang="de-CH">');
      expect(rulesOf(htmlProblems(twice))).toEqual(['html.lang']);
    });
  });
});

describe('securityProblems', () => {
  it('checks both files and says which one a finding is in', () => {
    expect(securityProblems({ headers: HEADERS, html: HTML }, { title: 'Muster' })).toEqual([]);

    const problems = securityProblems(
      {
        headers: headersWith('X-Frame-Options: DENY', 'X-Frame-Options: SAMEORIGIN'),
        html: htmlWith('<html lang="de-CH">', '<html lang="de">'),
      },
      { title: 'Beispiel' },
    );
    expect(problems.map(({ file, rule }) => [file, rule])).toEqual([
      ['headers', 'frame.options'],
      ['html', 'html.lang'],
      ['html', 'html.title'],
    ]);
  });
});

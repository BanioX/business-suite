import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  catalogueTexts,
  headerProblems,
  htmlProblems,
  occurrences,
  parseRegister,
  registerProblems,
  securityProblems,
  sideEffectRegisterProblems,
  storageKeys,
  textProblems,
  withoutComments,
} from '../src';

/**
 * The standard tests report and never throw (`StandardProblem`): whatever text they are handed,
 * a file that is cut off or is no such file at all, the answer is a list. A factory that threw
 * would end a guard at its first odd file and hide every finding after it.
 */

/** Text made of the pieces the readers look for, so the odd cases come up often. */
const pieces = (...parts: string[]) =>
  fc
    .array(fc.oneof(fc.constantFrom(...parts), fc.string({ unit: 'binary', maxLength: 6 })), {
      maxLength: 40,
    })
    .map((list) => list.join(''));

const markup = pieces(
  '<',
  '>',
  '</',
  '<!--',
  '-->',
  '<script',
  '</script>',
  '<style>',
  '<title>',
  '<meta name="robots" content="noindex, nofollow">',
  '<html lang="de-CH">',
  ' src=',
  ' href="',
  '"',
  "'",
  '=',
  '/',
  ' ',
  '\n',
  'https://example.invalid/',
  '//',
  '&#47;',
  '&amp;',
  ' onclick=',
  ' style',
  ',',
);

const headers = pieces(
  '/*',
  '/assets/*',
  '\n',
  '\r\n',
  '  ',
  '\t',
  ':',
  ';',
  ',',
  '=',
  '#',
  '!',
  'Content-Security-Policy',
  'X-Robots-Tag',
  'Permissions-Policy',
  'X-Frame-Options',
  "default-src 'self'",
  'camera=(self)',
  'noindex',
  '(',
  ')',
  '*',
  '[',
  '\\',
);

const register = pieces(
  '|',
  '\\|',
  '\n',
  '\r\n',
  ' ',
  'Kennung',
  '| Kennung | Nebenwirkung | Im Code | Wo | Daten verlassen das Gerät? | Entscheid | Seit |',
  '---',
  'SE-',
  'SE-01',
  '`',
  '`fetch(`',
  '`download`',
  'ja',
  'nein',
  'Alban, 14.11.2026',
  'Alban, 31.02.2026',
  'ADR-0006',
  'geplant',
  '30.02.2026',
  '.',
);

const code = pieces(
  'fetch(',
  'window.print()',
  "'sample:key'",
  '//',
  '/*',
  '*/',
  '`',
  '${',
  '}',
  '{',
  "'",
  '"',
  '\\',
  '\n',
  '/',
  ' ',
  'return',
  '=',
);

describe('the standard tests never throw', () => {
  it('security: any two texts give a list of findings of the two files', () => {
    fc.assert(
      fc.property(headers, markup, (headersFile, html) => {
        const problems = securityProblems({ headers: headersFile, html }, { title: 'Muster' });
        expect(problems).toEqual([
          ...headerProblems(headersFile),
          ...htmlProblems(html, { title: 'Muster' }),
        ]);
        for (const problem of problems) {
          expect(['headers', 'html']).toContain(problem.file);
          expect(problem.rule).toMatch(/^[a-z]+\.[a-z_]+$/);
          expect(problem.message).not.toBe('');
        }
      }),
      { numRuns: 400 },
    );
  });

  it('side effects: any sources and any register give a list of findings', () => {
    fc.assert(
      fc.property(fc.array(code, { maxLength: 4 }), register, (codes, markdown) => {
        const sources = codes.map((text, index) => ({
          path: `src/${String(index)}.ts`,
          code: text,
        }));
        const problems = sideEffectRegisterProblems(sources, markdown, {
          storagePrefixes: ['sample'],
        });
        for (const problem of problems) {
          expect(problem.rule).toMatch(/^(register|side_effect)\.[a-z_]+$/);
          expect(problem.message).not.toBe('');
          expect(problem.paths.every((path) => path.startsWith('src/'))).toBe(true);
        }
        // The parts agree with the whole.
        expect(problems).toEqual(expect.arrayContaining(registerProblems(markdown)));
        expect(parseRegister(markdown).every((row) => row.line.includes('SE-'))).toBe(true);
        expect(occurrences(sources).size).toBeLessThanOrEqual(22);
        expect(
          [...storageKeys(sources, 'sample').keys()].every((key) => key.startsWith('sample:')),
        ).toBe(true);
      }),
      { numRuns: 400 },
    );
  });

  it('side effects: removing comments never adds text, whatever the code', () => {
    fc.assert(
      fc.property(code, (text) => {
        expect(withoutComments(text).length).toBeLessThanOrEqual(text.length);
      }),
      { numRuns: 400 },
    );
  });

  it('texts: any catalogue gives a list of findings, each for a text of the catalogue', () => {
    const leaf = fc.oneof(
      fc.string({ unit: 'binary', maxLength: 12 }),
      fc.constantFrom('Sichern', '', ' ', 'Gesichert!', 'Wie ihr wollt', 'Bitte prüfen Sie'),
      fc.integer(),
      fc.boolean(),
      fc.constant(null),
      fc.constant(undefined),
      fc.constant((n: number) => `${n} Zeilen`),
    );
    const { catalogue } = fc.letrec<{ catalogue: unknown }>((tie) => ({
      catalogue: fc.oneof(
        { depthSize: 'small' },
        leaf,
        fc.dictionary(fc.string({ maxLength: 4 }), tie('catalogue'), { maxKeys: 4 }),
        fc.array(tie('catalogue'), { maxLength: 4 }),
      ),
    }));
    fc.assert(
      fc.property(catalogue, (value) => {
        const texts = catalogueTexts(value);
        const problems = textProblems(value, { productNames: ['Musterprodukt', 'A+B'] });
        if (texts.length === 0) {
          expect(problems.map((problem) => problem.rule)).toEqual(['no_texts']);
          return;
        }
        for (const problem of problems) {
          expect(
            texts.some((each) => each.path === problem.path && each.text === problem.text),
          ).toBe(true);
          expect(problem.text).toContain(problem.found);
        }
      }),
      { numRuns: 400 },
    );
  });
});

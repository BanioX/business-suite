import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { EXPRESSION_PLACEHOLDER, literalsOf, withoutComments } from '../src/source';

/** A backslash, so no escape of this file is mistaken for one of the fixtures. */
const BACKSLASH = String.fromCharCode(92);

describe('withoutComments', () => {
  it('removes line comments and block comments', () => {
    expect(withoutComments('const a = 1; // the first\nconst b = 2;')).toBe(
      'const a = 1; \nconst b = 2;',
    );
    expect(withoutComments('/** A doc. */\nconst a = 1;')).toBe(' \nconst a = 1;');
    expect(withoutComments('call(/* inline */ 1)')).toBe('call(  1)');
    expect(withoutComments('// only a comment')).toBe('');
  });

  it('leaves one space for a block comment, so the words around it stay apart', () => {
    expect(withoutComments('return/* why */value;')).toBe('return/* why */value;');
    expect(withoutComments('return /* why */value;')).toBe('return  value;');
    expect(withoutComments('a = b +/* c */d')).toBe('a = b + d');
  });

  it('keeps a text as it is, also where it holds the signs of a comment', () => {
    for (const code of [
      `const base = 'https://example.invalid'; go(base);`,
      `const text = "a // b"; go();`,
      `const text = 'a /* b'; go(); const more = 'c */ d';`,
      'const text = `a // b ${value} /* c */`; go();',
      `const quote = 'it${BACKSLASH}'s // not a comment'; go();`,
    ]) {
      expect(withoutComments(code), code).toBe(code);
    }
  });

  it('keeps the code between two path patterns, which a simple search would drop', () => {
    const code = `const all = ['src/**/*.ts'];\ncall();\nconst more = ['**/*.test.ts'];`;
    expect(withoutComments(code)).toBe(code);
    expect(withoutComments(code)).toContain('call();');
  });

  it('removes a comment after a text on the same line', () => {
    expect(withoutComments(`const base = 'https://example.invalid'; // the host`)).toBe(
      `const base = 'https://example.invalid'; `,
    );
  });

  it('removes comments inside the expression of a template literal, not in its text', () => {
    expect(withoutComments('const text = `a ${/* why */ value} // b`;')).toBe(
      'const text = `a ${  value} // b`;',
    );
    expect(withoutComments('const text = `a ${ { b: `c ${d /* e */}` }.b } f`; // g')).toBe(
      'const text = `a ${ { b: `c ${d  }` }.b } f`; ',
    );
  });

  it('reads a regular expression as code: its slashes and quotes open nothing', () => {
    for (const code of [
      `const address = /https?:${BACKSLASH}/${BACKSLASH}//; go();`,
      `const quote = /'/; go();`,
      `const slash = /[/*]/; go(); const other = /[*/]/;`,
      `if (/a${BACKSLASH}/b/.test(text)) go();`,
      `return /"/.test(text);`,
    ]) {
      expect(withoutComments(code), code).toBe(code);
    }
    expect(withoutComments(`const quote = /'/; // why`)).toBe(`const quote = /'/; `);
    expect(withoutComments(`const flags = /a/g; // why`)).toBe(`const flags = /a/g; `);
  });

  it('knows the words after which a slash starts a regular expression', () => {
    for (const word of [
      'return',
      'typeof',
      'case',
      'do',
      'else',
      'in',
      'of',
      'void',
      'delete',
      'throw',
      'new',
      'instanceof',
      'yield',
      'await',
    ]) {
      // Read as a division, the `/*` of the class would open a comment and hide `go()`.
      expect(withoutComments(`${word} /[/*]/.test(a); go(); /* why */`), word).toBe(
        `${word} /[/*]/.test(a); go();  `,
      );
    }
    // A name that ends like such a word, or a member called like one, is a value.
    expect(withoutComments('const half = preturn / 2; // why')).toBe('const half = preturn / 2; ');
    expect(withoutComments('const half = range.in / 2; // why')).toBe(
      'const half = range.in / 2; ',
    );
    expect(withoutComments('const half = $of / 2; // why')).toBe('const half = $of / 2; ');
  });

  it('reads a division as a division', () => {
    expect(withoutComments('const half = total / 2; // why')).toBe('const half = total / 2; ');
    expect(withoutComments('const part = (a + b) / c / d; // why')).toBe(
      'const part = (a + b) / c / d; ',
    );
    expect(withoutComments('const a = b / c; const d = e / f; // why')).toBe(
      'const a = b / c; const d = e / f; ',
    );
  });

  it('keeps an address in the text of markup: a «//» right after a colon is no comment', () => {
    const code = '<p>See https://example.invalid/help for more</p>; go();';
    expect(withoutComments(code)).toBe(code);
  });

  it('keeps what it cannot be sure about', () => {
    // Never closed: dropping the rest of the file would hide whatever it holds.
    expect(withoutComments('const a = 1; /* open\ngo();')).toBe('const a = 1; /* open\ngo();');
    // The end of a path in the text of markup.
    expect(withoutComments('<code>src/*</code>; go(); /* real */')).toBe(
      '<code>src/*</code>; go();  ',
    );
    // An apostrophe in the text of markup opens no text: the rest of the line stays.
    expect(withoutComments(`<p>Don't</p> // kept\nconst a = 1; // dropped`)).toBe(
      `<p>Don't</p> // kept\nconst a = 1; `,
    );
  });

  it('ends a line comment at every kind of line end', () => {
    for (const end of [
      '\n',
      '\r',
      '\r\n',
      String.fromCharCode(0x2028),
      String.fromCharCode(0x2029),
    ]) {
      expect(withoutComments(`a(); // one${end}b(); // two`), JSON.stringify(end)).toBe(
        `a(); ${end}b(); `,
      );
    }
  });

  it('changes nothing in a text without a slash, and never throws', () => {
    const noSlash = fc.string({ unit: 'binary' }).map((text) => text.replaceAll('/', ''));
    fc.assert(
      fc.property(noSlash, (text) => {
        expect(withoutComments(text)).toBe(text);
      }),
    );
    const sourceLike = fc
      .array(
        fc.constantFrom(
          '/',
          '*',
          '//',
          '/*',
          '*/',
          "'",
          '"',
          '`',
          '${',
          '{',
          '}',
          BACKSLASH,
          '\n',
          ' ',
          'a',
          '=',
          '(',
          ')',
          'return',
          '[',
          ']',
        ),
        { maxLength: 40 },
      )
      .map((parts) => parts.join(''));
    fc.assert(
      fc.property(sourceLike, (text) => {
        const bare = withoutComments(text);
        expect(bare.length).toBeLessThanOrEqual(text.length);
        // Nothing but comments goes: every literal the text holds is still there.
        expect(literalsOf(bare)).toEqual(literalsOf(text));
      }),
      { numRuns: 500 },
    );
  });
});

describe('literalsOf', () => {
  it('finds quoted strings and resolves their escapes', () => {
    expect(literalsOf(`const a = 'eins'; const b = "zwei";`)).toEqual(['eins', 'zwei']);
    expect(literalsOf(`'it${BACKSLASH}'s' + "say ${BACKSLASH}"hi${BACKSLASH}""`)).toEqual([
      "it's",
      'say "hi"',
    ]);
    expect(literalsOf(`'a${BACKSLASH}nb${BACKSLASH}tc${BACKSLASH}${BACKSLASH}d'`)).toEqual([
      'a\nb\tc\\d',
    ]);
    expect(
      literalsOf(
        `'${BACKSLASH}r${BACKSLASH}b${BACKSLASH}f${BACKSLASH}v${BACKSLASH}0${BACKSLASH}$${BACKSLASH}q'`,
      ),
    ).toEqual(['\r\b\f\v\0$q']);
  });

  it('resolves escapes of characters, so a letter written as a number is still found', () => {
    const eszett = String.fromCharCode(0xdf);
    expect(literalsOf(`'Stra${BACKSLASH}xdfe'`)).toEqual([`Stra${eszett}e`]);
    expect(literalsOf(`'Stra${BACKSLASH}u00dfe'`)).toEqual([`Stra${eszett}e`]);
    expect(literalsOf(`'Stra${BACKSLASH}u{df}e'`)).toEqual([`Stra${eszett}e`]);
    expect(literalsOf(`'${BACKSLASH}u{1F600}'`)).toEqual([String.fromCodePoint(0x1f600)]);
    expect(literalsOf(`'${BACKSLASH}uD83D${BACKSLASH}uDE00'`)).toEqual([
      String.fromCodePoint(0x1f600),
    ]);
  });

  it('lets a malformed escape stand for itself', () => {
    expect(literalsOf(`'${BACKSLASH}xZZ'`)).toEqual(['xZZ']);
    expect(literalsOf(`'${BACKSLASH}u12'`)).toEqual(['u12']);
    expect(literalsOf(`'${BACKSLASH}u{110000}'`)).toEqual(['u{110000}']);
    expect(literalsOf(`'${BACKSLASH}u{12'`)).toEqual(['u{12']);
    expect(literalsOf(`'${BACKSLASH}u{}'`)).toEqual(['u{}']);
  });

  it('joins a text that goes on after a backslash at the end of a line', () => {
    expect(literalsOf(`'eins ${BACKSLASH}\nzwei'`)).toEqual(['eins zwei']);
    expect(literalsOf(`'eins ${BACKSLASH}\r\nzwei'`)).toEqual(['eins zwei']);
    expect(literalsOf(`'eins ${BACKSLASH}${String.fromCharCode(0x2028)}zwei'`)).toEqual([
      'eins zwei',
    ]);
  });

  it('reads a template literal as one text, with a placeholder for each expression', () => {
    expect(EXPRESSION_PLACEHOLDER).toBe('{}');
    expect(literalsOf('(n) => `${n} Zeilen fehlen`')).toEqual(['{} Zeilen fehlen']);
    expect(literalsOf('`Von ${from} bis ${to}`')).toEqual(['Von {} bis {}']);
    expect(literalsOf('`ohne Wert`')).toEqual(['ohne Wert']);
    expect(literalsOf('``')).toEqual(['']);
    expect(literalsOf(`\`a${BACKSLASH}\`b${BACKSLASH}\${c}\``)).toEqual(['a`b${c}']);
  });

  it('reads the literals inside an expression as texts of their own', () => {
    expect(literalsOf("`${n === 1 ? 'eine Zeile' : `${n} Zeilen`} fehlen`")).toEqual([
      'eine Zeile',
      '{} Zeilen',
      '{} fehlen',
    ]);
    expect(literalsOf('`a ${ { b: `c` }.b } d`')).toEqual(['c', 'a {} d']);
  });

  it('reads no comment and no code', () => {
    expect(literalsOf(`// 'not this'\n/* "nor this" */ const a = 'this'; const ihr = !a;`)).toEqual(
      ['this'],
    );
    expect(literalsOf('const re = /"x"/; const a = 1 / 2;')).toEqual([]);
    expect(literalsOf(`return /"/.test(a) ? 'ja' : "nein";`)).toEqual(['ja', 'nein']);
  });

  it('copes with a text that is cut off', () => {
    expect(literalsOf(`const a = 'open\nconst b = 'closed';`)).toEqual(['closed']);
    expect(literalsOf('const a = `open ${b} and')).toEqual(['open {} and']);
    expect(literalsOf('const a = `open ${b')).toEqual(['open ']);
    expect(literalsOf(`'ends with a backslash${BACKSLASH}`)).toEqual([]);
    expect(literalsOf(`\`ends with a backslash${BACKSLASH}`)).toEqual(['ends with a backslash']);
  });
});

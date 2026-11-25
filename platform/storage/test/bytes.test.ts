import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { base64Decode, base64Encode, hexEncode, utf8Decode, utf8Encode } from '../src';

/**
 * The pure helpers against the implementations of the runtime (Node): what they write must be
 * the same byte for byte, and what they refuse must be what a strict reader refuses.
 */

const nodeEncode = (text: string) => Array.from(new TextEncoder().encode(text));

/** Strict and without touching a byte order mark, as `utf8Decode` promises. */
function nodeDecode(bytes: Uint8Array): string | 'invalid' {
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    return 'invalid';
  }
}

function ownDecode(bytes: Uint8Array): string | 'invalid' {
  try {
    return utf8Decode(bytes);
  } catch (error) {
    expect(error).toBeInstanceOf(TypeError);
    return 'invalid';
  }
}

/** Any sequence of UTF-16 code units, so surrogates without a partner occur. */
const anyCodeUnits = fc
  .array(fc.integer({ min: 0, max: 0xffff }), { maxLength: 40 })
  .map((units) => String.fromCharCode(...units));

/** Bytes that are often almost UTF-8: valid text with single bytes changed, cut or added. */
const nearlyUtf8 = fc
  .tuple(
    fc.string({ unit: 'binary', maxLength: 20 }),
    fc.array(fc.tuple(fc.nat(), fc.integer({ min: 0, max: 255 })), { maxLength: 3 }),
    fc.nat({ max: 3 }),
  )
  .map(([text, changes, cut]) => {
    const bytes = Array.from(new TextEncoder().encode(text));
    for (const [at, value] of changes) {
      if (bytes.length > 0) {
        bytes[at % bytes.length] = value;
      }
    }
    return Uint8Array.from(bytes.slice(0, Math.max(0, bytes.length - cut)));
  });

describe('utf8Encode', () => {
  it('writes one to four bytes per character', () => {
    expect(Array.from(utf8Encode(''))).toEqual([]);
    expect(Array.from(utf8Encode('A'))).toEqual([0x41]);
    expect(Array.from(utf8Encode('ä'))).toEqual([0xc3, 0xa4]);
    expect(Array.from(utf8Encode('€'))).toEqual([0xe2, 0x82, 0xac]);
    // An astral character: two code units in the string, four bytes in UTF-8.
    expect(Array.from(utf8Encode('😀'))).toEqual([0xf0, 0x9f, 0x98, 0x80]);
  });

  it('writes the first and the last character of every length as the runtime does', () => {
    for (const point of [0, 0x7f, 0x80, 0x7ff, 0x800, 0xd7ff, 0xe000, 0xffff, 0x10000, 0x10ffff]) {
      const text = String.fromCodePoint(point);
      expect(Array.from(utf8Encode(text)), point.toString(16)).toEqual(nodeEncode(text));
    }
  });

  it('writes U+FFFD for a surrogate without its partner', () => {
    const replacement = [0xef, 0xbf, 0xbd];
    expect(Array.from(utf8Encode('\ud83d'))).toEqual(replacement);
    expect(Array.from(utf8Encode('\ude00'))).toEqual(replacement);
    // The wrong way round: two lone surrogates, not a pair.
    expect(Array.from(utf8Encode('\ude00\ud83d'))).toEqual([...replacement, ...replacement]);
    expect(Array.from(utf8Encode('a\ud83db'))).toEqual([0x61, ...replacement, 0x62]);
  });

  it('agrees with the runtime for any text', () => {
    fc.assert(
      fc.property(fc.oneof(anyCodeUnits, fc.string({ unit: 'binary' })), (text) => {
        expect(Array.from(utf8Encode(text))).toEqual(nodeEncode(text));
      }),
    );
  });
});

describe('utf8Decode', () => {
  it('reads what utf8Encode wrote', () => {
    for (const text of ['', 'Betrieb Muster', 'Zürich, Genève, Sørensen', '日本語', 'a😀b', '\u0000']) {
      expect(utf8Decode(utf8Encode(text))).toBe(text);
    }
  });

  it('keeps a byte order mark as part of the text', () => {
    expect(utf8Decode(Uint8Array.of(0xef, 0xbb, 0xbf, 0x41))).toBe('﻿A');
  });

  it.each([
    ['a continuation byte without a start', [0x80]],
    ['a start byte without its continuation', [0xc3]],
    ['a sequence cut at the end', [0xe2, 0x82]],
    ['a sequence cut by a new character', [0xe2, 0x82, 0x41]],
    ['an overlong form of two bytes', [0xc0, 0xaf]],
    ['an overlong form of three bytes', [0xe0, 0x80, 0xaf]],
    ['an overlong form of four bytes', [0xf0, 0x80, 0x80, 0xaf]],
    ['a surrogate', [0xed, 0xa0, 0x80]],
    ['a value above U+10FFFF', [0xf4, 0x90, 0x80, 0x80]],
    ['a start byte that never occurs', [0xf5, 0x80, 0x80, 0x80]],
    ['the byte 0xFF', [0xff]],
  ])('refuses %s', (_what, bytes) => {
    expect(() => utf8Decode(Uint8Array.from(bytes))).toThrow(TypeError);
    expect(nodeDecode(Uint8Array.from(bytes))).toBe('invalid');
  });

  it('reads a long text in pieces', () => {
    const text = 'Zeile mit Umlaut ä und Zeichen 😀\n'.repeat(5000);
    expect(utf8Decode(utf8Encode(text))).toBe(text);
  });

  it('agrees with the strict decoder of the runtime for any bytes', () => {
    fc.assert(
      fc.property(fc.oneof(fc.uint8Array({ maxLength: 12 }), nearlyUtf8), (bytes) => {
        expect(ownDecode(bytes)).toBe(nodeDecode(bytes));
      }),
      { numRuns: 2000 },
    );
  });

  it('gives any text back that has no lone surrogate', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary' }), (text) => {
        expect(utf8Decode(utf8Encode(text))).toBe(text);
      }),
    );
  });
});

describe('base64Encode', () => {
  it('writes the examples of RFC 4648', () => {
    const cases: [string, string][] = [
      ['', ''],
      ['f', 'Zg=='],
      ['fo', 'Zm8='],
      ['foo', 'Zm9v'],
      ['foob', 'Zm9vYg=='],
      ['fooba', 'Zm9vYmE='],
      ['foobar', 'Zm9vYmFy'],
    ];
    for (const [text, encoded] of cases) {
      expect(base64Encode(new TextEncoder().encode(text))).toBe(encoded);
      expect(new TextDecoder().decode(base64Decode(encoded))).toBe(text);
    }
  });

  it('uses the standard alphabet with + and /', () => {
    expect(base64Encode(Uint8Array.of(0xfb, 0xff, 0xfe))).toBe('+//+');
  });

  it('agrees with the runtime for any bytes', () => {
    fc.assert(
      fc.property(fc.uint8Array({ maxLength: 200 }), (bytes) => {
        expect(base64Encode(bytes)).toBe(Buffer.from(bytes).toString('base64'));
      }),
    );
  });

  it('writes a large file', () => {
    const bytes = Uint8Array.from({ length: 300_001 }, (_, index) => (index * 31) % 256);
    const encoded = base64Encode(bytes);
    expect(encoded).toBe(Buffer.from(bytes).toString('base64'));
    expect(Array.from(base64Decode(encoded))).toEqual(Array.from(bytes));
  });
});

describe('base64Decode', () => {
  it('gives any bytes back', () => {
    fc.assert(
      fc.property(fc.uint8Array({ maxLength: 200 }), (bytes) => {
        expect(Array.from(base64Decode(base64Encode(bytes)))).toEqual(Array.from(bytes));
      }),
    );
  });

  it.each([
    ['a length that is no multiple of four', 'Zm9'],
    ['a single character', 'Z'],
    ['missing padding', 'Zg'],
    ['too much padding', 'Z==='],
    ['padding only', '===='],
    ['padding in the middle', 'Zg==Zg=='],
    ['a padding character before the end', 'Zm=v'],
    ['a character outside the alphabet', 'Zm9*'],
    ['the alphabet for addresses', 'Zm9-'],
    ['white space', 'Zm9v\n'],
    ['a space inside', 'Zm 9'],
    ['a character beyond ASCII', 'Zm9é'],
    ['unused bits that are not zero after one byte', 'Zh=='],
    ['unused bits that are not zero after two bytes', 'Zm9='],
  ])('refuses %s', (_what, text) => {
    expect(() => base64Decode(text)).toThrow(TypeError);
  });

  it('reads exactly one text per sequence of bytes', () => {
    // Every text it accepts is the one base64Encode writes for the bytes it returns.
    const alphabet = fc.constantFrom(...'ABab01+/='.split(''));
    fc.assert(
      fc.property(fc.array(alphabet, { maxLength: 8 }), (chars) => {
        const text = chars.join('');
        let bytes: Uint8Array;
        try {
          bytes = base64Decode(text);
        } catch {
          return;
        }
        expect(base64Encode(bytes)).toBe(text);
      }),
      { numRuns: 2000 },
    );
  });
});

describe('hexEncode', () => {
  it('writes two lower-case digits per byte', () => {
    expect(hexEncode(Uint8Array.of())).toBe('');
    expect(hexEncode(Uint8Array.of(0, 1, 0x0f, 0x10, 0xab, 0xff))).toBe('00010f10abff');
  });

  it('agrees with the runtime for any bytes', () => {
    fc.assert(
      fc.property(fc.uint8Array({ maxLength: 64 }), (bytes) => {
        expect(hexEncode(bytes)).toBe(Buffer.from(bytes).toString('hex'));
      }),
    );
  });
});

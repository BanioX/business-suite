import { StorageError } from '@onestrand/storage';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { canonicalJson } from '../src';

/** Characters by code, so that no escape in this file can be read in two ways. */
const char = (code: number) => String.fromCharCode(code);
const BACKSLASH = char(0x5c);
const QUOTE = '"';

/**
 * The reference, written a second time: the text is put together piece by piece, with the
 * built-in order of strings. (A sorted copy handed to `JSON.stringify` is no reference: a record
 * lists keys that look like whole numbers first, whatever order they were written in.)
 */
function reference(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(reference).join(',')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    const parts: string[] = [];
    // The default order of `sort` is by UTF-16 code units, which is the rule.
    for (const key of Object.keys(record).sort()) {
      parts.push(`${JSON.stringify(key)}:${reference(record[key])}`);
    }
    return `{${parts.join(',')}}`;
  }
  return JSON.stringify(value);
}

/** Any value a file can hold, without the one key the storage refuses as data. */
const anyJson = fc.jsonValue().filter((value) => !JSON.stringify(value).includes('"__proto__"'));

/** The same value with the keys of every record put in another order. */
function reordered(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(reordered);
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>).reverse();
    return Object.fromEntries(entries.map(([key, field]) => [key, reordered(field)]));
  }
  return value;
}

describe('canonical JSON', () => {
  it('sorts the keys at every depth and writes no whitespace', () => {
    const value = { b: 1, a: { d: [{ z: null, y: true }], c: 'x' } };
    expect(canonicalJson(value)).toBe('{"a":{"c":"x","d":[{"y":true,"z":null}]},"b":1}');
  });

  it('sorts keys that look like numbers as text, not as numbers', () => {
    // A record itself lists such keys first and by value; the canonical text must not.
    expect(canonicalJson({ '10': 1, '9': 2, b: 3, '': 4 })).toBe('{"":4,"10":1,"9":2,"b":3}');
  });

  it('keeps the order of a list', () => {
    expect(canonicalJson([3, 1, 2, [], {}])).toBe('[3,1,2,[],{}]');
  });

  it('writes the sample of RFC 8785 as the standard does', () => {
    const value = {
      // The first number has more digits than a number holds; the standard writes it as read.
      numbers: [Number('333333333.33333329'), 1e30, 4.5, 2e-3, 1e-27],
      string: `€$${char(0x0f)}${char(0x0a)}A'B${QUOTE}${BACKSLASH}${BACKSLASH}${QUOTE}/`,
      literals: [null, true, false],
    };
    const text =
      '{"literals":[null,true,false],' +
      '"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],' +
      `"string":"€$${BACKSLASH}u000f${BACKSLASH}nA'B${BACKSLASH}${QUOTE}` +
      `${BACKSLASH}${BACKSLASH}${BACKSLASH}${BACKSLASH}${BACKSLASH}${QUOTE}/"}`;
    expect(canonicalJson(value)).toBe(text);
  });

  it('sorts keys by their UTF-16 code units, as RFC 8785 does', () => {
    const grinning = char(0xd83d) + char(0xde00);
    const keys = ['€', char(0x0d), char(0xfb33), '1', grinning, char(0x80), 'ö'];
    const value = Object.fromEntries(keys.map((key, index) => [key, index]));
    expect(canonicalJson(value)).toBe(
      `{"${BACKSLASH}r":1,"1":3,"${char(0x80)}":5,"ö":6,"€":0,"${grinning}":4,"${char(0xfb33)}":2}`,
    );
  });

  it('writes numbers as JSON prints them', () => {
    expect(canonicalJson([1, -1, 1.5, 1e21, 1e-7, 0.1 + 0.2, 123456789012345680000])).toBe(
      '[1,-1,1.5,1e+21,1e-7,0.30000000000000004,123456789012345680000]',
    );
    expect(canonicalJson(Number.MAX_SAFE_INTEGER)).toBe('9007199254740991');
  });

  it('writes -0 as 0, as a file reads it back', () => {
    expect(canonicalJson(-0)).toBe('0');
    expect(canonicalJson({ amount: -0 })).toBe(canonicalJson({ amount: 0 }));
  });

  it('writes text with the escapes of JSON, a lone surrogate included', () => {
    expect(canonicalJson(`a${QUOTE}b`)).toBe(`"a${BACKSLASH}${QUOTE}b"`);
    expect(canonicalJson('Zürich 😀 日本語')).toBe('"Zürich 😀 日本語"');
    expect(canonicalJson(char(0xd800))).toBe(`"${BACKSLASH}ud800"`);
  });

  it('reads a field without a value as no field', () => {
    expect(canonicalJson({ a: 1, b: undefined })).toBe('{"a":1}');
  });

  it('has no text for undefined itself', () => {
    expect(() => canonicalJson(undefined)).toThrow(TypeError);
  });

  it.each([
    ['NaN', Number.NaN],
    ['Infinity', { amount: Number.POSITIVE_INFINITY }],
    ['a date object', { at: new Date(0) }],
    ['a map', new Map([['a', 1]])],
    ['bytes', { data: new Uint8Array(2) }],
    ['a function', { run: () => 1 }],
    ['a big integer', { amount: 1n }],
    ['a missing value in a list', [1, undefined, 3]],
    ['a record with a prototype of its own', Object.create({ inherited: 1 }) as unknown],
  ])('refuses %s, which a file could not carry', (_what, value) => {
    expect(() => canonicalJson(value)).toThrow(StorageError);
    expect(() => canonicalJson(value)).toThrow(expect.objectContaining({ code: 'not_plain' }));
  });

  it('refuses a value that contains itself', () => {
    const loop: Record<string, unknown> = {};
    loop.self = loop;
    expect(() => canonicalJson(loop)).toThrow(expect.objectContaining({ code: 'not_plain' }));
  });

  it('equals the reference for any value', () => {
    fc.assert(
      fc.property(anyJson, (value) => {
        expect(canonicalJson(value)).toBe(reference(value));
      }),
    );
  });

  it('does not depend on the order in which the keys were written', () => {
    fc.assert(
      fc.property(anyJson, (value) => {
        expect(canonicalJson(reordered(value))).toBe(canonicalJson(value));
      }),
    );
  });

  it('is JSON: reading it gives the value back, and writing that gives the same text', () => {
    fc.assert(
      fc.property(anyJson, (value) => {
        const text = canonicalJson(value);
        const read: unknown = JSON.parse(text);
        expect(read).toEqual(JSON.parse(JSON.stringify(value)));
        expect(canonicalJson(read)).toBe(text);
      }),
    );
  });
});

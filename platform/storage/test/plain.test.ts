import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { isPlainRecord, keepUnknownFields, plainCopy, StorageError } from '../src';
import { anyJson, plainJson } from './support';

function refusal(work: () => unknown): StorageError {
  try {
    work();
  } catch (error) {
    if (error instanceof StorageError) {
      return error;
    }
    throw error;
  }
  throw new Error('Expected the value to be refused');
}

describe('isPlainRecord', () => {
  it('is true for an object literal and for a record without a prototype', () => {
    expect(isPlainRecord({})).toBe(true);
    expect(isPlainRecord({ a: 1 })).toBe(true);
    expect(isPlainRecord(Object.create(null))).toBe(true);
    expect(isPlainRecord(JSON.parse('{"a":{"b":1}}'))).toBe(true);
  });

  it('is false for everything else', () => {
    class Row {
      id = 'x';
    }
    for (const value of [null, undefined, 'a', 1, true, [], [{}], new Date(0), new Map(), new Row(), () => 1]) {
      expect(isPlainRecord(value)).toBe(false);
    }
  });
});

describe('plainCopy', () => {
  it('copies records and lists at every depth', () => {
    const value = { a: [1, { b: ['x', null, true] }], c: { d: { e: 0.125 } }, f: '' };
    const copy = plainCopy(value);
    expect(copy).toStrictEqual(value);
    expect(copy).not.toBe(value);
    expect(copy.a).not.toBe(value.a);
    expect(copy.a[1]).not.toBe(value.a[1]);
    expect(copy.c.d).not.toBe(value.c.d);
  });

  it('returns values that are not containers as they are', () => {
    for (const value of [null, 'text', '', 0, 1.5, -3, true, false]) {
      expect(plainCopy(value)).toBe(value);
    }
    const nothing: unknown = undefined;
    expect(plainCopy(nothing)).toBeUndefined();
  });

  it('leaves out fields without a value, as a file does', () => {
    const copy = plainCopy({ a: 1, b: undefined, c: { d: undefined } });
    expect(copy).toStrictEqual({ a: 1, c: {} });
    expect(Object.keys(copy)).toEqual(['a', 'c']);
  });

  it('turns -0 into 0, as a file does', () => {
    expect(Object.is(plainCopy(-0), 0)).toBe(true);
    expect(Object.is(plainCopy({ n: [-0] }).n[0], 0)).toBe(true);
  });

  it('copies a record without a prototype into an ordinary one', () => {
    const bare = Object.assign(Object.create(null) as Record<string, unknown>, { a: 1 });
    const copy = plainCopy(bare);
    expect(copy).toStrictEqual({ a: 1 });
    expect(Object.getPrototypeOf(copy)).toBe(Object.prototype);
  });

  class Row {
    id = 'x';
  }
  const refused: [string, unknown, string][] = [
    ['NaN', Number.NaN, 'NaN is not a number a file can carry'],
    ['infinity', Number.NEGATIVE_INFINITY, '-Infinity is not a number a file can carry'],
    ['a date object', new Date(0), 'a object'],
    ['a map', new Map(), 'a object'],
    ['a set', new Set(), 'a object'],
    ['bytes', Uint8Array.of(1), 'a object'],
    ['an instance of a class', new Row(), 'a object'],
    ['a function', () => 1, 'a function'],
    ['a big integer', 1n, 'a bigint'],
    ['a symbol', Symbol('x'), 'a symbol'],
  ];
  it.each(refused)('refuses %s', (_what, value, problem) => {
    const error = refusal(() => plainCopy({ rows: [{ value }] }));
    expect(error.code).toBe('not_plain');
    expect(error.message).toBe(`The value at $.rows[0].value is not plain data: ${problem}`);
    expect(refusal(() => plainCopy(value)).message).toContain('The value at $ is not plain data');
  });

  it('refuses a missing value in a list, also a hole', () => {
    expect(refusal(() => plainCopy(['a', undefined])).message).toBe(
      'The value at $[1] is not plain data: a list with a missing value',
    );
    // eslint-disable-next-line no-sparse-arrays -- the hole is what the test is about
    expect(refusal(() => plainCopy([1, , 3])).code).toBe('not_plain');
  });

  it('refuses a record with a symbol as a key', () => {
    expect(refusal(() => plainCopy({ [Symbol('hidden')]: 1 })).code).toBe('not_plain');
  });

  it('refuses the key that would replace the prototype of the copy', () => {
    const fromFile: unknown = JSON.parse('{"a":{"__proto__":{"admin":true}}}');
    const error = refusal(() => plainCopy(fromFile));
    expect(error.message).toBe(
      'The value at $.a is not plain data: a record with the key "__proto__"',
    );
    expect(({} as { admin?: boolean }).admin).toBeUndefined();
  });

  it('refuses a value that contains itself instead of running out of stack', () => {
    const circle: Record<string, unknown> = { name: 'a' };
    circle.self = circle;
    const error = refusal(() => plainCopy(circle));
    expect(error.code).toBe('not_plain');
    expect(error.message).toContain('nested too deeply, or it contains itself');
    const list: unknown[] = [];
    list.push(list);
    expect(refusal(() => plainCopy(list)).code).toBe('not_plain');
  });

  it('copies what is nested a hundred deep and refuses what goes deeper', () => {
    const nested = (depth: number): unknown => {
      let value: unknown = 'leaf';
      for (let level = 0; level < depth; level += 1) {
        value = level % 2 === 0 ? { next: value } : [value];
      }
      return value;
    };
    expect(plainCopy(nested(100))).toStrictEqual(nested(100));
    expect(refusal(() => plainCopy(nested(101))).code).toBe('not_plain');
  });

  it('gives back what a file would give back, for any plain data', () => {
    fc.assert(
      fc.property(anyJson, (value) => {
        expect(plainCopy(value)).toStrictEqual(JSON.parse(JSON.stringify(value)));
      }),
    );
  });

  it('shares nothing with what it copied', () => {
    fc.assert(
      fc.property(plainJson, (value) => {
        const copy = plainCopy(value);
        const before = JSON.stringify(copy);
        const scramble = (item: unknown): void => {
          if (Array.isArray(item)) {
            item.forEach(scramble);
            item.push('changed');
          } else if (isPlainRecord(item)) {
            Object.values(item).forEach(scramble);
            item.changed = true;
          }
        };
        scramble(value);
        expect(JSON.stringify(copy)).toBe(before);
      }),
    );
  });
});

describe('keepUnknownFields', () => {
  const LineSchema = z.object({ label: z.string(), minutes: z.int() });
  const RowSchema = z.object({
    id: z.string(),
    text: z.string().trim(),
    place: z.object({ room: z.string() }).optional(),
    lines: z.array(LineSchema).optional(),
    tags: z.array(z.string()).optional(),
  });

  /** Reads a row the way the backup does: checked with the schema, written with all it had. */
  const read = (raw: unknown) => keepUnknownFields(raw, RowSchema.parse(raw));

  it('keeps an unknown field of the row', () => {
    expect(read({ id: 'a', text: 'x', colour: 'blue' })).toStrictEqual({
      id: 'a',
      text: 'x',
      colour: 'blue',
    });
  });

  it('keeps an unknown field of a record inside the row', () => {
    expect(read({ id: 'a', text: 'x', place: { room: 'Lager', door: 'B' } })).toStrictEqual({
      id: 'a',
      text: 'x',
      place: { room: 'Lager', door: 'B' },
    });
  });

  it('keeps an unknown field of the records inside a list', () => {
    const raw = {
      id: 'a',
      text: 'x',
      lines: [
        { label: 'eins', minutes: 30, rate: 8500 },
        { label: 'zwei', minutes: 15 },
        { label: 'drei', minutes: 5, note: { by: 'Person Eins' } },
      ],
    };
    expect(read(raw)).toStrictEqual(raw);
  });

  it('keeps unknown values whatever they are: lists, records, null', () => {
    const raw = { id: 'a', text: 'x', extra: [1, { deep: [null, { deeper: true }] }], gone: null };
    expect(read(raw)).toStrictEqual(raw);
  });

  it('lets what the schema knows win over what was read', () => {
    expect(read({ id: 'a', text: '  trimmed  ', colour: 'blue' })).toStrictEqual({
      id: 'a',
      text: 'trimmed',
      colour: 'blue',
    });
  });

  it('adds nothing to a row that has no unknown fields', () => {
    const raw = { id: 'a', text: 'x', tags: ['a', 'b'], place: { room: 'Lager' } };
    expect(read(raw)).toStrictEqual(raw);
  });

  it('takes a list as parsed if the schema changed its length', () => {
    const Deduplicated = z.object({
      lines: z.array(LineSchema).transform((lines) => lines.slice(0, 1)),
    });
    const raw = {
      lines: [
        { label: 'eins', minutes: 1, rate: 1 },
        { label: 'zwei', minutes: 2, rate: 2 },
      ],
    };
    expect(keepUnknownFields(raw, Deduplicated.parse(raw))).toStrictEqual({
      lines: [{ label: 'eins', minutes: 1 }],
    });
  });

  it('brings a field back that a schema dropped with a transform', () => {
    const Renaming = z
      .object({ old: z.string() })
      .transform(({ old }) => ({ renamed: old }));
    expect(keepUnknownFields({ old: 'x' }, Renaming.parse({ old: 'x' }))).toStrictEqual({
      old: 'x',
      renamed: 'x',
    });
  });

  it('takes the parsed value where the two do not have the same form', () => {
    expect(keepUnknownFields('7', 7)).toBe(7);
    expect(keepUnknownFields({ a: 1 }, [1])).toStrictEqual([1]);
    expect(keepUnknownFields([1], { a: 1 })).toStrictEqual({ a: 1 });
    expect(keepUnknownFields(null, { a: 1 })).toStrictEqual({ a: 1 });
    const nothing: unknown = undefined;
    expect(keepUnknownFields({ a: 1 }, nothing)).toBeUndefined();
  });

  it('leaves out fields without a value on both sides', () => {
    expect(keepUnknownFields({ a: undefined, b: 1 }, { c: undefined, d: 2 })).toStrictEqual({
      b: 1,
      d: 2,
    });
  });

  it('returns a fresh copy: neither what was read nor what was parsed is shared', () => {
    const raw = { id: 'a', text: 'x', extra: { list: [1] }, tags: ['a'] };
    const parsed = RowSchema.parse(raw);
    const kept = keepUnknownFields(raw, parsed) as typeof raw;
    raw.extra.list.push(2);
    parsed.tags?.push('b');
    expect(kept).toStrictEqual({ id: 'a', text: 'x', extra: { list: [1] }, tags: ['a'] });
  });

  it('refuses what is not plain data, in what was read and in what was parsed', () => {
    expect(refusal(() => keepUnknownFields({ a: 1, when: new Date(0) }, { a: 1 })).code).toBe(
      'not_plain',
    );
    expect(refusal(() => keepUnknownFields({ a: 1 }, { a: Number.NaN })).code).toBe('not_plain');
    const fromFile: unknown = JSON.parse('{"a":1,"__proto__":{"admin":true}}');
    expect(refusal(() => keepUnknownFields(fromFile, { a: 1 })).code).toBe('not_plain');
  });

  it('refuses what is nested too deeply instead of running out of stack', () => {
    let deep: unknown = 'leaf';
    for (let level = 0; level < 5000; level += 1) {
      deep = { next: deep };
    }
    expect(refusal(() => keepUnknownFields(deep, deep)).code).toBe('not_plain');
  });

  it('loses no field of any plain record, whatever a schema of some of its fields accepts', () => {
    const known = z.object({ id: z.string(), text: z.string() });
    fc.assert(
      fc.property(
        fc.dictionary(fc.string(), plainJson),
        fc.string(),
        fc.string(),
        (extra, id, text) => {
          fc.pre(!Object.hasOwn(extra, '__proto__'));
          const raw = { ...extra, id, text };
          expect(keepUnknownFields(raw, known.parse(raw))).toStrictEqual(
            JSON.parse(JSON.stringify(raw)),
          );
        },
      ),
    );
  });

  it('gives back any plain value overlaid on itself', () => {
    fc.assert(
      fc.property(plainJson, (value) => {
        expect(keepUnknownFields(value, value)).toStrictEqual(value);
      }),
    );
  });
});

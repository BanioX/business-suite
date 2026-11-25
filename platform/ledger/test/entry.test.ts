import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  entryHash,
  hashedContent,
  inSequence,
  LEDGER_FIELD_NAMES,
  LEDGER_STREAM_PATTERN,
  LedgerEntrySchema,
  ledgerFields,
  LedgerStreamSchema,
} from '../src';
import { hasher, sequentialIds, sha256OfText, withField } from './support';

const ids = sequentialIds();
const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);

function entry() {
  return {
    id: ids.next(),
    businessId: ids.next(),
    stream: 'cash',
    seq: 2,
    prevHash: HASH_A,
    hash: HASH_B,
    at: '2026-11-16T08:00:00.000Z',
    actor: ids.next(),
  };
}

const StrictSchema = z.object(ledgerFields);

describe('the fields of an entry', () => {
  it('accepts an entry as the kit writes it', () => {
    const row = entry();
    expect(StrictSchema.parse(row)).toEqual(row);
    expect(StrictSchema.parse({ ...row, corrects: ids.next() })).toHaveProperty('corrects');
  });

  it('accepts the first entry of a chain, which names no entry before it', () => {
    const first = withField({ ...entry(), seq: 1 }, 'prevHash', undefined);
    expect(StrictSchema.parse(first)).toEqual(first);
  });

  it('lists exactly the fields of the kit', () => {
    expect([...LEDGER_FIELD_NAMES].sort()).toEqual(Object.keys(ledgerFields).sort());
  });

  it.each([
    ['id', 'no-id'],
    ['id', undefined],
    ['businessId', ''],
    ['stream', 'With Space'],
    ['stream', undefined],
    ['seq', 0],
    ['seq', 1.5],
    ['seq', '2'],
    ['seq', undefined],
    ['prevHash', 'A'.repeat(64)],
    ['prevHash', 'abc'],
    ['hash', undefined],
    ['hash', 'g'.repeat(64)],
    ['hash', 'a'.repeat(63)],
    ['at', '2026-11-16'],
    ['at', undefined],
    ['actor', 7],
    ['corrects', 'someone'],
  ])('refuses an entry whose %s is %j', (field, value) => {
    expect(StrictSchema.safeParse(withField(entry(), field, value)).success).toBe(false);
    expect(LedgerEntrySchema.safeParse(withField(entry(), field, value)).success).toBe(false);
  });

  it('reads an entry of any ledger and leaves what the ledger added', () => {
    const row = { ...entry(), amount: 500, ref: { kind: 'receipt' }, later: [1, 2] };
    expect(LedgerEntrySchema.parse(row)).toEqual(row);
  });
});

describe('the key of a stream', () => {
  it.each([
    'cash',
    'main',
    '0',
    'person:018f2e7a-0000-7000-8000-000000000001',
    'a.b_c-d:e',
    'x'.repeat(120),
  ])('accepts %j', (key) => {
    expect(LEDGER_STREAM_PATTERN.test(key)).toBe(true);
    expect(LedgerStreamSchema.parse(key)).toBe(key);
  });

  it.each(['', ' ', 'Cash', 'cash book', '-cash', '_x', 'käse', 'a/b', 'x'.repeat(121), 'a\n'])(
    'refuses %j',
    (key) => {
      expect(LEDGER_STREAM_PATTERN.test(key)).toBe(false);
      expect(LedgerStreamSchema.safeParse(key).success).toBe(false);
    },
  );

  it('accepts an id as it is', () => {
    expect(LedgerStreamSchema.parse(ids.next())).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('the checksum of an entry', () => {
  it('covers every field except the checksum itself', () => {
    const row = { ...entry(), amount: 500 };
    const content = JSON.parse(hashedContent(row)) as Record<string, unknown>;
    expect(content).toEqual(withField(row, 'hash', undefined));
    expect(hashedContent({ ...row, hash: HASH_A })).toBe(hashedContent(row));
  });

  it('is written with sorted keys, whatever the order of the fields', () => {
    const row = { ...entry(), amount: 500 };
    const backwards = Object.fromEntries(Object.entries(row).reverse());
    expect(hashedContent(backwards)).toBe(hashedContent(row));
    expect(hashedContent(row).startsWith('{"actor":')).toBe(true);
  });

  it('covers fields no schema knows, at every depth', () => {
    const row = { ...entry(), amount: 500, ref: { kind: 'receipt' } };
    expect(hashedContent({ ...row, later: 1 })).not.toBe(hashedContent(row));
    expect(hashedContent({ ...row, ref: { kind: 'receipt', page: 2 } })).not.toBe(
      hashedContent(row),
    );
  });

  it('is SHA-256 over that text as UTF-8', async () => {
    const row = { ...entry(), text: 'Zürich 😀 日本語' };
    expect(await entryHash(hasher, row)).toBe(sha256OfText(hashedContent(row)));
    expect(await entryHash(hasher, row)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('changes with every field', async () => {
    const row = { ...entry(), amount: 500 };
    const before = await entryHash(hasher, row);
    for (const [field, value] of [
      ['id', ids.next()],
      ['businessId', ids.next()],
      ['stream', 'bank'],
      ['seq', 3],
      ['prevHash', HASH_B],
      ['prevHash', undefined],
      ['at', '2026-11-16T08:00:00.001Z'],
      ['actor', ids.next()],
      ['corrects', ids.next()],
      ['amount', 501],
    ] as const) {
      expect(await entryHash(hasher, withField(row, field, value)), field).not.toBe(before);
    }
  });

  it('fails with a hasher that answers anything but a checksum', async () => {
    const broken = { sha256: () => Promise.resolve('ABC') };
    await expect(entryHash(broken, entry())).rejects.toThrow(TypeError);
  });

  it('refuses an entry that is not plain data', () => {
    expect(() => hashedContent({ ...entry(), on: new Date(0) })).toThrow(
      expect.objectContaining({ code: 'not_plain' }),
    );
  });
});

describe('the order of a chain', () => {
  it('is by seq, lowest first, and leaves the list it was given alone', () => {
    const rows = [3, 1, 2].map((seq) => ({ id: ids.next(), seq }));
    const given = [...rows];
    expect(inSequence(rows).map((row) => row.seq)).toEqual([1, 2, 3]);
    expect(rows).toEqual(given);
  });

  it('orders two entries with the same seq by their id, on every read the same', () => {
    const first = { id: 'a', seq: 2 };
    const second = { id: 'b', seq: 2 };
    expect(inSequence([second, first])).toEqual([first, second]);
    expect(inSequence([first, second])).toEqual([first, second]);
    expect(inSequence([first, first])).toEqual([first, first]);
  });
});

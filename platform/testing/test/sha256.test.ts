import { createHash } from 'node:crypto';
import {
  createWebCryptoHasher,
  matchesChecksum,
  SHA256_PATTERN,
  sha256Of,
} from '@onestrand/storage';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { sha256Hex, testHasher } from '../src';
import { bytesOf } from './support';

const node = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

describe('sha256Hex', () => {
  it('computes the known checksums of SHA-256', () => {
    expect(sha256Hex(new Uint8Array())).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(sha256Hex(bytesOf('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(sha256Hex(bytesOf('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'))).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('computes the checksum of a long message: a million times «a»', () => {
    expect(sha256Hex(new Uint8Array(1_000_000).fill(0x61))).toBe(
      'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0',
    );
  });

  it('agrees with the runtime at every length around the edges of a block', () => {
    // 55 bytes still fit one block with the padding, 56 need a second; the same at 119 and 120.
    for (let length = 0; length <= 130; length += 1) {
      for (const fill of [0x00, 0xff, 0x80]) {
        const bytes = new Uint8Array(length).fill(fill);
        expect(sha256Hex(bytes), `${length} bytes of ${fill}`).toBe(node(bytes));
      }
    }
  });

  it('agrees with the runtime for any bytes', () => {
    fc.assert(
      fc.property(fc.uint8Array({ maxLength: 400 }), (bytes) => {
        const checksum = sha256Hex(bytes);
        expect(checksum).toBe(node(bytes));
        expect(checksum).toMatch(SHA256_PATTERN);
      }),
      { numRuns: 300 },
    );
  });

  it('hashes only the part of a buffer the bytes cover, and leaves the bytes as they are', () => {
    const whole = bytesOf('xxabcxx');
    const view = whole.subarray(2, 5);
    expect(sha256Hex(view)).toBe(sha256Hex(bytesOf('abc')));
    expect(Array.from(whole)).toEqual(Array.from(bytesOf('xxabcxx')));
  });

  it('refuses what is no Uint8Array instead of hashing nothing', () => {
    const wrong: [what: string, value: unknown][] = [
      ['a text', 'abc'],
      ['a list of numbers', [1, 2, 3]],
      ['another typed array', new Uint16Array(2)],
      ['a buffer', new ArrayBuffer(4)],
      ['undefined', undefined],
      ['null', null],
    ];
    for (const [what, value] of wrong) {
      expect(() => sha256Hex(value as Uint8Array), what).toThrow(TypeError);
    }
  });
});

describe('sha256Hex, at its limit', () => {
  it('refuses 512 MB or more instead of computing a wrong checksum', () => {
    // The length is all that is read before the refusal: no such message is built here.
    const huge = (length: number) =>
      Object.defineProperty(new Uint8Array(1), 'length', { value: length });
    expect(() => sha256Hex(huge(2 ** 29))).toThrow(RangeError);
    expect(() => sha256Hex(huge(2 ** 32))).toThrow('512 MB');
  });

  it('writes the length of a message of several megabytes into the padding', () => {
    // 3 MB are 25’165’824 bits: more than three bytes of length.
    const bytes = new Uint8Array(3 * 1024 * 1024).fill(0x5a);
    expect(sha256Hex(bytes)).toBe(node(bytes));
  });
});

describe('testHasher', () => {
  const webCrypto = createWebCryptoHasher(globalThis.crypto);

  it('is a hasher of the storage: the same checksums as WebCrypto', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uint8Array({ maxLength: 300 }), async (bytes) => {
        expect(await testHasher.sha256(bytes)).toBe(await webCrypto.sha256(bytes));
      }),
      { numRuns: 50 },
    );
  });

  it('passes the checks the storage puts on a hasher', async () => {
    const bytes = bytesOf('Rapport vom 14.11.2026');
    const sha256 = await sha256Of(testHasher, bytes);
    expect(sha256).toBe(node(bytes));
    expect(await matchesChecksum(testHasher, { sha256, size: bytes.length }, bytes)).toBe(true);
    expect(await matchesChecksum(webCrypto, { sha256, size: bytes.length }, bytes)).toBe(true);
    expect(await matchesChecksum(testHasher, { sha256, size: bytes.length }, bytesOf('x'))).toBe(
      false,
    );
  });

  it('reports a wrong input through its promise, never as an exception of the call', async () => {
    const pending = testHasher.sha256('abc' as unknown as Uint8Array);
    await expect(pending).rejects.toThrow(TypeError);
  });
});

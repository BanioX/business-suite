import { createHash } from 'node:crypto';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createWebCryptoHasher, SHA256_PATTERN, type DigestCrypto } from '../src';
import { bytesOf } from './support';

const hasher = createWebCryptoHasher(globalThis.crypto);

describe('createWebCryptoHasher', () => {
  it('computes the known checksums of SHA-256', async () => {
    expect(await hasher.sha256(new Uint8Array())).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(await hasher.sha256(bytesOf('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('agrees with the runtime for any bytes', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uint8Array({ maxLength: 300 }), async (bytes) => {
        const checksum = await hasher.sha256(bytes);
        expect(checksum).toBe(createHash('sha256').update(bytes).digest('hex'));
        expect(checksum).toMatch(SHA256_PATTERN);
      }),
      { numRuns: 50 },
    );
  });

  it('hashes only the part of a buffer the bytes cover', async () => {
    const view = bytesOf('xxabcxx').subarray(2, 5);
    expect(await hasher.sha256(view)).toBe(await hasher.sha256(bytesOf('abc')));
  });

  it('takes any object with the one call it needs, and hands it a copy of the bytes', async () => {
    const seen: Uint8Array[] = [];
    const fake: DigestCrypto = {
      subtle: {
        digest: (algorithm, data) => {
          expect(algorithm).toBe('SHA-256');
          seen.push(data);
          return Promise.resolve(Uint8Array.of(0, 1, 0xab, 0xff).buffer);
        },
      },
    };
    const bytes = Uint8Array.of(1, 2, 3);
    expect(await createWebCryptoHasher(fake).sha256(bytes)).toBe('0001abff');
    expect(seen[0]).toEqual(bytes);
    expect(seen[0]).not.toBe(bytes);
  });
});

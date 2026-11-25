import { createHash } from 'node:crypto';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  assertChecksum,
  createWebCryptoHasher,
  FileMetaSchema,
  matchesChecksum,
  MEDIA_TYPE_PATTERN,
  SHA256_PATTERN,
  sha256Of,
  StorageError,
  type DigestCrypto,
} from '../src';
import { bytesOf, sequentialIds } from './support';

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

describe('sha256Of', () => {
  it('returns the checksum of a hasher that answers properly', async () => {
    expect(await sha256Of(hasher, bytesOf('abc'))).toBe(await hasher.sha256(bytesOf('abc')));
  });

  it.each([
    ['upper case', 'BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD'],
    ['too short', 'ba7816bf'],
    ['a prefix', 'sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
    ['Base64', 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0='],
    ['nothing', ''],
  ])('refuses a hasher that answers with %s', async (_what, answer) => {
    await expect(
      sha256Of({ sha256: () => Promise.resolve(answer) }, bytesOf('abc')),
    ).rejects.toThrow(TypeError);
  });
});

describe('matchesChecksum and assertChecksum', () => {
  const bytes = bytesOf('Rapport');
  const id = sequentialIds().next();
  const meta = async () => ({ id, sha256: await hasher.sha256(bytes), size: bytes.length });

  it('accept the bytes the meta data describes', async () => {
    expect(await matchesChecksum(hasher, await meta(), bytes)).toBe(true);
    await expect(assertChecksum(hasher, await meta(), bytes)).resolves.toBeUndefined();
  });

  it('refuse other bytes, a wrong size and a wrong checksum', async () => {
    const good = await meta();
    const cases = [
      { meta: good, bytes: bytesOf('Rapport!') },
      { meta: good, bytes: bytesOf('rapport') },
      { meta: { ...good, size: good.size + 1 }, bytes },
      { meta: { ...good, sha256: await hasher.sha256(bytesOf('anders')) }, bytes },
    ];
    for (const entry of cases) {
      expect(await matchesChecksum(hasher, entry.meta, entry.bytes)).toBe(false);
      const error = await assertChecksum(hasher, entry.meta, entry.bytes).catch(
        (caught: unknown) => caught,
      );
      expect(error).toBeInstanceOf(StorageError);
      expect((error as StorageError).code).toBe('checksum');
      expect((error as StorageError).message).toBe(
        `The bytes of file ${id} do not match its checksum`,
      );
    }
  });
});

describe('FileMetaSchema', () => {
  const ids = sequentialIds();
  const meta = {
    id: ids.next(),
    businessId: ids.next(),
    sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    size: 3,
    mediaType: 'image/jpeg',
    createdAt: '2026-11-14T10:00:00.000Z',
  };

  it('accepts meta data with and without a name', () => {
    expect(FileMetaSchema.parse(meta)).toEqual(meta);
    expect(FileMetaSchema.parse({ ...meta, name: ' foto.jpg ' }).name).toBe('foto.jpg');
  });

  it.each([
    'image/jpeg',
    'application/pdf',
    'image/svg+xml',
    'text/plain',
    'application/vnd.ms-excel',
    'application/octet-stream',
  ])('accepts the media type %s', (mediaType) => {
    expect(MEDIA_TYPE_PATTERN.test(mediaType)).toBe(true);
    expect(FileMetaSchema.safeParse({ ...meta, mediaType }).success).toBe(true);
  });

  it.each([
    ['a size that is no whole number', { size: 1.5 }],
    ['a negative size', { size: -1 }],
    ['a checksum in upper case', { sha256: meta.sha256.toUpperCase() }],
    ['a checksum that is too short', { sha256: 'abc' }],
    ['a media type in upper case', { mediaType: 'Image/JPEG' }],
    ['a media type with a parameter', { mediaType: 'text/plain; charset=utf-8' }],
    ['a media type without a subtype', { mediaType: 'image' }],
    ['an empty name', { name: '   ' }],
    ['an id that is none', { id: 'file-1' }],
    ['a time that is none', { createdAt: '14.11.2026' }],
  ])('refuses %s', (_what, change) => {
    expect(FileMetaSchema.safeParse({ ...meta, ...change }).success).toBe(false);
  });
});

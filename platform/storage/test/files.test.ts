import { describe, expect, it } from 'vitest';
import {
  assertChecksum,
  copyOfBytes,
  FileMetaSchema,
  matchesChecksum,
  MEDIA_TYPE_PATTERN,
  parseFileMeta,
  sha256Of,
  StorageError,
} from '../src';
import { bytesOf, hasher, sequentialIds } from './support';

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

describe('parseFileMeta', () => {
  const ids = sequentialIds();
  const meta = {
    id: ids.next(),
    businessId: ids.next(),
    sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    size: 3,
    mediaType: 'image/jpeg',
    createdAt: '2026-11-14T10:00:00.000Z',
  };

  function refusal(value: unknown): StorageError {
    try {
      parseFileMeta(value);
    } catch (error) {
      if (error instanceof StorageError) {
        return error;
      }
      throw error;
    }
    throw new Error('Expected the meta data to be refused');
  }

  it('returns meta data as the schema reads it: the name trimmed, unknown fields left out', () => {
    expect(parseFileMeta(meta)).toEqual(meta);
    expect(parseFileMeta({ ...meta, name: ' foto.jpg ', takenAt: 'gestern' })).toEqual({
      ...meta,
      name: 'foto.jpg',
    });
  });

  it('refuses malformed meta data with the code invalid_file and names every field', () => {
    const error = refusal({ ...meta, mediaType: 'JPEG', size: -1, sha256: 'abc' });
    expect(error.code).toBe('invalid_file');
    expect(error.message).toBe('The meta data of a file does not fit: sha256, size, mediaType');
    expect(refusal({ ...meta, id: undefined }).message).toBe(
      'The meta data of a file does not fit: id',
    );
  });

  it('refuses what is no meta data at all', () => {
    for (const value of [undefined, null, 'foto.jpg', 7, [meta]]) {
      const error = refusal(value);
      expect(error.code).toBe('invalid_file');
      expect(error.message).toBe('The meta data of a file does not fit: meta');
    }
  });
});

describe('copyOfBytes', () => {
  it('returns a copy of its own, of the part of the buffer the bytes cover', () => {
    const bytes = Uint8Array.of(1, 2, 3);
    const copy = copyOfBytes(bytes);
    expect(copy).toEqual(bytes);
    expect(copy).not.toBe(bytes);
    expect(copy.buffer).not.toBe(bytes.buffer);
    expect(copyOfBytes(Uint8Array.of(0, 1, 2, 3, 4).subarray(1, 3))).toEqual(Uint8Array.of(1, 2));
    expect(copyOfBytes(new Uint8Array())).toEqual(new Uint8Array());
  });

  it('takes the bytes of the runtime as they are', () => {
    expect(copyOfBytes(Buffer.from('abc'))).toEqual(bytesOf('abc'));
  });

  it.each([
    ['a text', 'abc'],
    ['a number', 3],
    ['a list of numbers', [1, 2, 3]],
    ['a buffer without a view', new ArrayBuffer(3)],
    ['a view of wider numbers', Uint16Array.of(1, 2)],
    ['nothing', undefined],
    ['null', null],
  ])('refuses %s', (_what, value) => {
    expect(() => copyOfBytes(value)).toThrow(StorageError);
    expect(() => copyOfBytes(value)).toThrow('The bytes of a file must be a Uint8Array');
  });
});

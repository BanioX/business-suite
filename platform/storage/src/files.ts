import { IdSchema, IsoDateTimeSchema, nameSchema, type Id } from '@onestrand/core';
import { z } from 'zod';
import { StorageError } from './errors';

/**
 * Files (suite ADR-0005, 7): photos, receipts, signatures and documents are bytes with a
 * checksum, kept apart from the rows. A row refers to a file by its id; it never holds the
 * bytes, not as text either.
 */

/** A SHA-256 checksum: 64 hex digits, lower case. */
export const SHA256_PATTERN = /^[0-9a-f]{64}$/;

/** A media type without parameters, lower case: `image/jpeg`, `application/pdf`. */
export const MEDIA_TYPE_PATTERN = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/;

/** What the storage knows about a file. */
export const FileMetaSchema = z.object({
  id: IdSchema,
  businessId: IdSchema,
  /** SHA-256 of the bytes, see `SHA256_PATTERN`. */
  sha256: z.string().regex(SHA256_PATTERN, 'Expected 64 lower-case hex digits'),
  /** Number of bytes. */
  size: z.int().min(0),
  mediaType: z.string().max(255).regex(MEDIA_TYPE_PATTERN, 'Expected a media type'),
  /** The name the file had where it came from, if it had one. */
  name: nameSchema(255).optional(),
  createdAt: IsoDateTimeSchema,
});
export type FileMeta = z.infer<typeof FileMetaSchema>;

/** A file to store: the storage adds id, checksum, size and time. */
export interface NewFile {
  businessId: Id;
  bytes: Uint8Array;
  mediaType: string;
  name?: string;
}

/** A file as it is stored. */
export interface StoredFile {
  meta: FileMeta;
  bytes: Uint8Array<ArrayBuffer>;
}

/**
 * The meta data of a file, checked for its form and returned as the schema reads it (the name
 * trimmed). Throws a `StorageError` with the code `invalid_file` that says which field does not
 * fit; every implementation of the file store refuses malformed meta data this way.
 */
export function parseFileMeta(value: unknown): FileMeta {
  const parsed = FileMetaSchema.safeParse(value);
  if (!parsed.success) {
    const fields = parsed.error.issues
      .map((issue) => issue.path.map(String).join('.') || 'meta')
      .join(', ');
    throw new StorageError('invalid_file', `The meta data of a file does not fit: ${fields}`);
  }
  return parsed.data;
}

/**
 * The bytes of a file as a copy of its own, so nobody changes a stored file through the array
 * that was handed in. Throws a `StorageError` with the code `invalid_file` for anything that is
 * no `Uint8Array`: a text or a number would become a file of zeros without a word.
 */
export function copyOfBytes(bytes: unknown): Uint8Array<ArrayBuffer> {
  if (!(bytes instanceof Uint8Array)) {
    throw new StorageError('invalid_file', 'The bytes of a file must be a Uint8Array');
  }
  return new Uint8Array(bytes);
}

/** Computes checksums. The browser and the tests implement it with WebCrypto. */
export interface Hasher {
  /** SHA-256 of the bytes as 64 hex digits, lower case. */
  sha256: (data: Uint8Array) => Promise<string>;
}

/**
 * The checksum of bytes, checked for its form: a hasher that answers anything else would spoil
 * every checksum written with it, so it fails here, at the first use.
 */
export async function sha256Of(hasher: Hasher, bytes: Uint8Array): Promise<string> {
  const checksum = await hasher.sha256(bytes);
  if (typeof checksum !== 'string' || !SHA256_PATTERN.test(checksum)) {
    throw new TypeError('The hasher must return SHA-256 as 64 lower-case hex digits');
  }
  return checksum;
}

/** True if the bytes are the ones the meta data describes: same size, same checksum. */
export async function matchesChecksum(
  hasher: Hasher,
  meta: Pick<FileMeta, 'sha256' | 'size'>,
  bytes: Uint8Array,
): Promise<boolean> {
  return bytes.length === meta.size && (await sha256Of(hasher, bytes)) === meta.sha256;
}

/** Throws a `StorageError` with the code `checksum` unless the bytes match the meta data. */
export async function assertChecksum(
  hasher: Hasher,
  meta: Pick<FileMeta, 'id' | 'sha256' | 'size'>,
  bytes: Uint8Array,
): Promise<void> {
  if (!(await matchesChecksum(hasher, meta, bytes))) {
    throw new StorageError('checksum', `The bytes of file ${meta.id} do not match its checksum`);
  }
}

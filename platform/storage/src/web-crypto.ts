import { hexEncode } from './bytes';
import type { Hasher } from './files';

/**
 * WebCrypto as a parameter. The pure part of the platform reaches no global, so whoever has the
 * WebCrypto object passes it in: the browser its `crypto`, a test on Node `globalThis.crypto`.
 * The interfaces below name only what this package calls; the real object fits them as it is.
 */

/** The part of `crypto.subtle` a checksum needs. */
export interface DigestCrypto {
  subtle: {
    digest(algorithm: 'SHA-256', data: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer>;
  };
}

/** How the password of a backup becomes a key: PBKDF2 with SHA-256. */
export interface Pbkdf2Params {
  name: 'PBKDF2';
  hash: 'SHA-256';
  salt: Uint8Array<ArrayBuffer>;
  iterations: number;
}

/** How a backup is encrypted: AES-GCM, with the initialisation vector of this file. */
export interface AesGcmParams {
  name: 'AES-GCM';
  iv: Uint8Array<ArrayBuffer>;
}

/**
 * The part of `crypto` the password protection of a backup needs. `TKey` is the key object of
 * the runtime (`CryptoKey`); this package only hands it from one call to the next.
 */
export interface CipherCrypto<TKey> {
  getRandomValues(array: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer>;
  subtle: {
    importKey(
      format: 'raw',
      keyData: Uint8Array<ArrayBuffer>,
      algorithm: 'PBKDF2',
      extractable: false,
      keyUsages: ['deriveKey'],
    ): Promise<TKey>;
    deriveKey(
      algorithm: Pbkdf2Params,
      baseKey: TKey,
      derivedKeyType: { name: 'AES-GCM'; length: 256 },
      extractable: false,
      keyUsages: ['encrypt', 'decrypt'],
    ): Promise<TKey>;
    encrypt(
      algorithm: AesGcmParams,
      key: TKey,
      data: Uint8Array<ArrayBuffer>,
    ): Promise<ArrayBuffer>;
    decrypt(
      algorithm: AesGcmParams,
      key: TKey,
      data: Uint8Array<ArrayBuffer>,
    ): Promise<ArrayBuffer>;
  };
}

/** A `Hasher` on WebCrypto: `createWebCryptoHasher(crypto)`. */
export function createWebCryptoHasher(crypto: DigestCrypto): Hasher {
  return {
    sha256: async (data) =>
      // A copy: the bytes must not change under the digest, and WebCrypto wants its own buffer.
      hexEncode(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(data)))),
  };
}

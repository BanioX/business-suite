// Origin: BanioX/Randen apps/web/src/features/settings/backup-crypto.ts @ e0f0907 — adapted: WebCrypto and the name of the envelope format are parameters; UTF-8 and Base64 are the pure helpers of this package (Base64 is read strictly); decrypting checks the envelope again
import { base64Decode, base64Encode, utf8Decode, utf8Encode } from './bytes';
import type { CipherCrypto } from './web-crypto';

/**
 * Password protection for a backup file. WebCrypto only, nothing leaves the device:
 * PBKDF2-SHA-256 (600000 rounds, random 16-byte salt) turns the password into an AES-GCM 256-bit
 * key; every file gets a fresh 12-byte IV. The result is a small JSON envelope around the Base64
 * ciphertext.
 *
 * Every edition has its own name for the envelope format, frozen like the format of its backup;
 * nothing here knows one.
 */

/** The shortest password the form of an app should accept. Not enforced here. */
export const MIN_PASSWORD_LENGTH = 8;
const ITERATIONS = 600_000;
/** Upper bound for files from elsewhere: a huge count would freeze the tab. */
const MAX_ITERATIONS = 5_000_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

/** The envelope of an encrypted backup, as it stands in the file. */
export interface EncryptedBackup {
  /** The name of the envelope format of the edition. */
  format: string;
  version: 1;
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
  cipher: { name: 'AES-GCM'; iv: string };
  data: string;
}

/** Wrong password, or the file was changed: AES-GCM cannot tell the two apart. */
export class WrongPasswordError extends Error {
  constructor() {
    super('wrong password or damaged backup');
    this.name = 'WrongPasswordError';
  }
}

/** The envelope itself is malformed (not the password). */
export class InvalidEnvelopeError extends Error {
  constructor() {
    super('invalid encrypted backup');
    this.name = 'InvalidEnvelopeError';
  }
}

/** What `createBackupCipher` takes. */
export interface BackupCipherOptions<TKey> {
  /** The WebCrypto object: `crypto` in the browser, `globalThis.crypto` in a test on Node. */
  crypto: CipherCrypto<TKey>;
  /** The name of the envelope format of the edition, e.g. `field-encrypted`. Never renamed. */
  format: string;
}

/** Password protection for the backups of one edition. */
export interface BackupCipher {
  /** The name of the envelope format. */
  readonly format: string;
  /** Encrypts the backup text and returns the envelope as JSON text. */
  encryptBackup: (plain: string, password: string) => Promise<string>;
  /**
   * What a parsed file is: a valid envelope, a damaged one (it says it is encrypted but is not
   * usable), or something else (an ordinary backup, read as before).
   */
  readEnvelope: (json: unknown) => EncryptedBackup | 'invalid' | 'plain';
  /**
   * Returns the original backup text. Throws `WrongPasswordError` if it does not open and
   * `InvalidEnvelopeError` if the envelope is not one `readEnvelope` accepts.
   */
  decryptBackup: (envelope: EncryptedBackup, password: string) => Promise<string>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const fromBase64 = (text: string): Uint8Array<ArrayBuffer> => {
  try {
    return base64Decode(text);
  } catch {
    throw new InvalidEnvelopeError();
  }
};

/**
 * Builds the password protection of an edition. The envelope has the same fields and the same
 * algorithm for every edition; only the name of its format differs.
 */
export function createBackupCipher<TKey>(options: BackupCipherOptions<TKey>): BackupCipher {
  const { crypto, format } = options;
  if (typeof format !== 'string' || format.trim() === '' || format !== format.trim()) {
    throw new TypeError('The envelope format needs a name without surrounding spaces');
  }

  async function deriveKey(
    password: string,
    salt: Uint8Array<ArrayBuffer>,
    iterations: number,
  ): Promise<TKey> {
    // NFC: the same password typed on another device must give the same bytes.
    const material = await crypto.subtle.importKey(
      'raw',
      utf8Encode(password.normalize('NFC')),
      'PBKDF2',
      false,
      ['deriveKey'],
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  async function encryptBackup(plain: string, password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const key = await deriveKey(password, salt, ITERATIONS);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, utf8Encode(plain));
    const envelope: EncryptedBackup = {
      format,
      version: 1,
      kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS, salt: base64Encode(salt) },
      cipher: { name: 'AES-GCM', iv: base64Encode(iv) },
      data: base64Encode(new Uint8Array(encrypted)),
    };
    return `${JSON.stringify(envelope, null, 2)}\n`;
  }

  function readEnvelope(json: unknown): EncryptedBackup | 'invalid' | 'plain' {
    if (!isRecord(json) || json.format !== format) {
      return 'plain';
    }
    const { kdf, cipher, data } = json;
    if (
      json.version !== 1 ||
      !isRecord(kdf) ||
      !isRecord(cipher) ||
      kdf.name !== 'PBKDF2' ||
      kdf.hash !== 'SHA-256' ||
      typeof kdf.iterations !== 'number' ||
      !Number.isInteger(kdf.iterations) ||
      kdf.iterations < 1 ||
      kdf.iterations > MAX_ITERATIONS ||
      typeof kdf.salt !== 'string' ||
      cipher.name !== 'AES-GCM' ||
      typeof cipher.iv !== 'string' ||
      typeof data !== 'string'
    ) {
      return 'invalid';
    }
    try {
      if (fromBase64(kdf.salt).length !== SALT_BYTES || fromBase64(cipher.iv).length !== IV_BYTES) {
        return 'invalid';
      }
      fromBase64(data);
    } catch {
      return 'invalid';
    }
    return {
      format,
      version: 1,
      kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: kdf.iterations, salt: kdf.salt },
      cipher: { name: 'AES-GCM', iv: cipher.iv },
      data,
    };
  }

  async function decryptBackup(envelope: EncryptedBackup, password: string): Promise<string> {
    // Checked again: an envelope put together by hand must not get past the bound for the
    // rounds, and one of another edition is not ours to open.
    const checked = readEnvelope(envelope);
    if (typeof checked === 'string') {
      throw new InvalidEnvelopeError();
    }
    const salt = fromBase64(checked.kdf.salt);
    const iv = fromBase64(checked.cipher.iv);
    const data = fromBase64(checked.data);
    const key = await deriveKey(password, salt, checked.kdf.iterations);
    try {
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
      return utf8Decode(new Uint8Array(plain));
    } catch {
      throw new WrongPasswordError();
    }
  }

  return { format, encryptBackup, readEnvelope, decryptBackup };
}

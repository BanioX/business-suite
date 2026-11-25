// Origin: BanioX/Randen apps/web/src/features/settings/backup-crypto.test.ts @ e0f0907 — adapted: the cipher is built with WebCrypto of the runtime and a made-up format name; checked against a second implementation; tests for the strict envelope, composed and decomposed passwords and other formats added
import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createBackupCipher,
  InvalidEnvelopeError,
  MIN_PASSWORD_LENGTH,
  WrongPasswordError,
  type EncryptedBackup,
} from '../src';

const FORMAT = 'sample-encrypted';
const cipher = createBackupCipher({ crypto: globalThis.crypto, format: FORMAT });

const plain = JSON.stringify({ format: 'sample-backup', items: [{ name: 'Betrieb Muster, Zürich' }] });

const open = (text: string): EncryptedBackup => {
  const envelope = cipher.readEnvelope(JSON.parse(text));
  if (typeof envelope === 'string') {
    throw new Error(`not an envelope: ${envelope}`);
  }
  return envelope;
};

const bytesOf = (base64: string) => Buffer.from(base64, 'base64');

/** The same envelope written by a second implementation (the crypto module of Node). */
function writtenElsewhere(
  data: Uint8Array,
  password: string,
  iterations: number,
): EncryptedBackup {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = pbkdf2Sync(Buffer.from(password.normalize('NFC'), 'utf8'), salt, iterations, 32, 'sha256');
  const aes = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([aes.update(data), aes.final(), aes.getAuthTag()]);
  return {
    format: FORMAT,
    version: 1,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations, salt: salt.toString('base64') },
    cipher: { name: 'AES-GCM', iv: iv.toString('base64') },
    data: encrypted.toString('base64'),
  };
}

/** Opens an envelope with the second implementation. */
function readElsewhere(envelope: EncryptedBackup, password: string): string {
  const key = pbkdf2Sync(
    Buffer.from(password.normalize('NFC'), 'utf8'),
    bytesOf(envelope.kdf.salt),
    envelope.kdf.iterations,
    32,
    'sha256',
  );
  const data = bytesOf(envelope.data);
  const aes = createDecipheriv('aes-256-gcm', key, bytesOf(envelope.cipher.iv));
  aes.setAuthTag(data.subarray(data.length - 16));
  return Buffer.concat([aes.update(data.subarray(0, data.length - 16)), aes.final()]).toString(
    'utf8',
  );
}

describe('createBackupCipher', () => {
  it('carries the format name it was given', () => {
    expect(cipher.format).toBe(FORMAT);
    expect(MIN_PASSWORD_LENGTH).toBe(8);
  });

  it.each(['', '   ', ' padded', 'padded '])('refuses the format name %j', (format) => {
    expect(() => createBackupCipher({ crypto: globalThis.crypto, format })).toThrow(TypeError);
  });
});

describe('backup cipher', () => {
  it('writes the documented envelope', async () => {
    const text = await cipher.encryptBackup(plain, 'correct horse');
    expect(text.endsWith('}\n')).toBe(true);
    const envelope = JSON.parse(text) as EncryptedBackup;
    expect(envelope).toEqual({
      format: FORMAT,
      version: 1,
      kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: 600_000, salt: envelope.kdf.salt },
      cipher: { name: 'AES-GCM', iv: envelope.cipher.iv },
      data: envelope.data,
    });
    expect(bytesOf(envelope.kdf.salt)).toHaveLength(16);
    expect(bytesOf(envelope.cipher.iv)).toHaveLength(12);
    // The ciphertext with its 16 bytes of authentication, and none of the text.
    expect(bytesOf(envelope.data)).toHaveLength(Buffer.byteLength(plain, 'utf8') + 16);
    expect(text).not.toContain('Zürich');
    expect(text).not.toContain(Buffer.from('Zürich').toString('base64'));
  });

  it('gives the same text back after a round trip', async () => {
    const text = await cipher.encryptBackup(plain, 'correct horse');
    expect(await cipher.decryptBackup(open(text), 'correct horse')).toBe(plain);
  });

  it('writes what a second implementation opens', async () => {
    const envelope = open(await cipher.encryptBackup(plain, 'pässwörd-日本語'));
    expect(readElsewhere(envelope, 'pässwörd-日本語')).toBe(plain);
  });

  it('opens what a second implementation wrote, with the rounds the envelope names', async () => {
    const envelope = writtenElsewhere(Buffer.from(plain, 'utf8'), 'correct horse', 1000);
    expect(cipher.readEnvelope(envelope)).toEqual(envelope);
    expect(await cipher.decryptBackup(envelope, 'correct horse')).toBe(plain);
    await expect(cipher.decryptBackup(envelope, 'wrong horse')).rejects.toBeInstanceOf(
      WrongPasswordError,
    );
  });

  it('survives unicode in the data and the password', async () => {
    const data = '{"name":"Zürcher Strasse 12, Genève, œ ñ 日本語 😀"}';
    const text = await cipher.encryptBackup(data, 'pässwörd-日本語-😀');
    expect(await cipher.decryptBackup(open(text), 'pässwörd-日本語-😀')).toBe(data);
  });

  it('opens with the same letters typed composed or decomposed', async () => {
    const composed = 'pässwörd'.normalize('NFC');
    const decomposed = 'pässwörd'.normalize('NFD');
    expect(composed).not.toBe(decomposed);
    const text = await cipher.encryptBackup(plain, decomposed);
    expect(await cipher.decryptBackup(open(text), composed)).toBe(plain);
  });

  it('gives the text back exactly, a byte order mark at the start included', async () => {
    const data = '\uFEFF{"a":1}';
    const envelope = writtenElsewhere(Buffer.from(data, 'utf8'), 'correct horse', 1000);
    expect(await cipher.decryptBackup(envelope, 'correct horse')).toBe(data);
  });

  it('survives a large backup', async () => {
    const big = JSON.stringify({ blob: 'x'.repeat(300_000) });
    const text = await cipher.encryptBackup(big, 'long enough');
    expect(await cipher.decryptBackup(open(text), 'long enough')).toBe(big);
  });

  it('uses a fresh salt and IV every time', async () => {
    const a = open(await cipher.encryptBackup(plain, 'correct horse'));
    const b = open(await cipher.encryptBackup(plain, 'correct horse'));
    expect(a.kdf.salt).not.toBe(b.kdf.salt);
    expect(a.cipher.iv).not.toBe(b.cipher.iv);
    expect(a.data).not.toBe(b.data);
  });

  it('refuses a wrong password', async () => {
    const envelope = open(await cipher.encryptBackup(plain, 'correct horse'));
    await expect(cipher.decryptBackup(envelope, 'wrong horse')).rejects.toBeInstanceOf(
      WrongPasswordError,
    );
    await expect(cipher.decryptBackup(envelope, '')).rejects.toBeInstanceOf(WrongPasswordError);
    await expect(cipher.decryptBackup(envelope, 'Correct horse')).rejects.toBeInstanceOf(
      WrongPasswordError,
    );
  });

  it('refuses tampered ciphertext, salt and IV', async () => {
    const envelope = writtenElsewhere(Buffer.from(plain, 'utf8'), 'correct horse', 1000);
    const flipped = (base64: string, at: number) => {
      const bytes = bytesOf(base64);
      bytes[at] = (bytes[at] ?? 0) ^ 1;
      return bytes.toString('base64');
    };
    const last = bytesOf(envelope.data).length - 1;
    const tampered: EncryptedBackup[] = [
      { ...envelope, data: flipped(envelope.data, 0) },
      // The last byte belongs to the authentication tag.
      { ...envelope, data: flipped(envelope.data, last) },
      { ...envelope, kdf: { ...envelope.kdf, salt: flipped(envelope.kdf.salt, 0) } },
      { ...envelope, cipher: { ...envelope.cipher, iv: flipped(envelope.cipher.iv, 0) } },
      { ...envelope, kdf: { ...envelope.kdf, iterations: 1001 } },
    ];
    for (const entry of tampered) {
      await expect(cipher.decryptBackup(entry, 'correct horse')).rejects.toBeInstanceOf(
        WrongPasswordError,
      );
    }
    expect(await cipher.decryptBackup(envelope, 'correct horse')).toBe(plain);
  });

  it('refuses what opens but is no text', async () => {
    // Encrypted properly, but the bytes inside are not UTF-8.
    const envelope = writtenElsewhere(Uint8Array.of(0x7b, 0xff, 0xfe, 0x7d), 'correct horse', 1000);
    await expect(cipher.decryptBackup(envelope, 'correct horse')).rejects.toBeInstanceOf(
      WrongPasswordError,
    );
  });

  it('throws InvalidEnvelopeError for broken base64 at decrypt time', async () => {
    const envelope = writtenElsewhere(Buffer.from(plain, 'utf8'), 'correct horse', 1000);
    await expect(
      cipher.decryptBackup({ ...envelope, data: '***' }, 'correct horse'),
    ).rejects.toBeInstanceOf(InvalidEnvelopeError);
  });

  it('checks the envelope again when it decrypts', async () => {
    const envelope = writtenElsewhere(Buffer.from(plain, 'utf8'), 'correct horse', 1000);
    const refused: EncryptedBackup[] = [
      // Rounds that would freeze the app.
      { ...envelope, kdf: { ...envelope.kdf, iterations: 5_000_001 } },
      { ...envelope, kdf: { ...envelope.kdf, iterations: 0 } },
      // An envelope of another edition is not ours to open.
      { ...envelope, format: 'other-encrypted' },
      { ...envelope, version: 2 as 1 },
    ];
    for (const entry of refused) {
      await expect(cipher.decryptBackup(entry, 'correct horse')).rejects.toBeInstanceOf(
        InvalidEnvelopeError,
      );
    }
  });
});

describe('readEnvelope', () => {
  const valid = () => writtenElsewhere(Buffer.from(plain, 'utf8'), 'correct horse', 1000);

  it('recognises a valid envelope and returns only its own fields', () => {
    const envelope = valid();
    expect(cipher.readEnvelope(envelope)).toEqual(envelope);
    expect(cipher.readEnvelope({ ...envelope, extra: true, kdf: { ...envelope.kdf, x: 1 } })).toEqual(
      envelope,
    );
  });

  it('accepts the bounds of the rounds', () => {
    const envelope = valid();
    for (const iterations of [1, 600_000, 5_000_000]) {
      expect(cipher.readEnvelope({ ...envelope, kdf: { ...envelope.kdf, iterations } })).toMatchObject({
        kdf: { iterations },
      });
    }
  });

  it('leaves ordinary backups and other JSON alone', () => {
    expect(cipher.readEnvelope(JSON.parse(plain))).toBe('plain');
    expect(cipher.readEnvelope({ format: 'other' })).toBe('plain');
    expect(cipher.readEnvelope({ ...valid(), format: 'other-encrypted' })).toBe('plain');
    expect(cipher.readEnvelope({})).toBe('plain');
    expect(cipher.readEnvelope(null)).toBe('plain');
    expect(cipher.readEnvelope(undefined)).toBe('plain');
    expect(cipher.readEnvelope([])).toBe('plain');
    expect(cipher.readEnvelope('text')).toBe('plain');
    expect(cipher.readEnvelope(7)).toBe('plain');
  });

  it('flags a damaged envelope as invalid', () => {
    const good = valid();
    const withKdf = (patch: Record<string, unknown>) => ({
      ...good,
      kdf: { ...good.kdf, ...patch },
    });
    const short = Buffer.from('short').toString('base64');
    expect(cipher.readEnvelope({ ...good, version: 2 })).toBe('invalid');
    expect(cipher.readEnvelope({ ...good, version: '1' })).toBe('invalid');
    expect(cipher.readEnvelope({ ...good, data: 42 })).toBe('invalid');
    expect(cipher.readEnvelope({ ...good, data: '***' })).toBe('invalid');
    expect(cipher.readEnvelope({ ...good, kdf: 'PBKDF2' })).toBe('invalid');
    expect(cipher.readEnvelope({ ...good, cipher: null })).toBe('invalid');
    expect(cipher.readEnvelope({ ...good, cipher: { name: 'AES-CBC', iv: 'AAAA' } })).toBe(
      'invalid',
    );
    expect(cipher.readEnvelope({ ...good, cipher: { name: 'AES-GCM', iv: short } })).toBe(
      'invalid',
    );
    expect(cipher.readEnvelope({ ...good, cipher: { name: 'AES-GCM', iv: 12 } })).toBe('invalid');
    expect(cipher.readEnvelope({ ...good, cipher: { name: 'AES-GCM', iv: '***' } })).toBe(
      'invalid',
    );
    expect(cipher.readEnvelope(withKdf({ name: 'scrypt' }))).toBe('invalid');
    expect(cipher.readEnvelope(withKdf({ iterations: 1e12 }))).toBe('invalid');
    expect(cipher.readEnvelope(withKdf({ iterations: 5_000_001 }))).toBe('invalid');
    expect(cipher.readEnvelope(withKdf({ iterations: 0 }))).toBe('invalid');
    expect(cipher.readEnvelope(withKdf({ iterations: 1000.5 }))).toBe('invalid');
    expect(cipher.readEnvelope(withKdf({ iterations: '1000' }))).toBe('invalid');
    expect(cipher.readEnvelope(withKdf({ hash: 'SHA-1' }))).toBe('invalid');
    expect(cipher.readEnvelope(withKdf({ salt: short }))).toBe('invalid');
    expect(cipher.readEnvelope(withKdf({ salt: 7 }))).toBe('invalid');
    expect(cipher.readEnvelope({ format: FORMAT })).toBe('invalid');
  });

  it('reads Base64 strictly: white space or missing padding make the envelope invalid', () => {
    const good = valid();
    expect(cipher.readEnvelope({ ...good, data: `${good.data}\n` })).toBe('invalid');
    expect(cipher.readEnvelope({ ...good, data: ` ${good.data}` })).toBe('invalid');
    const salt = good.kdf.salt.replace(/=+$/, '');
    expect(salt).not.toBe(good.kdf.salt);
    expect(cipher.readEnvelope({ ...good, kdf: { ...good.kdf, salt } })).toBe('invalid');
  });
});

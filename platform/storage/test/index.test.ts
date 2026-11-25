import { describe, expect, it } from 'vitest';
import * as storage from '../src';

/**
 * The public surface, name by name. The ledger, the test helpers and every module build on it:
 * a name that disappears or appears here is a decision, not an accident. Types are not listed;
 * `tsc` guards them where they are used.
 */
describe('@onestrand/storage', () => {
  it('exports exactly these values', () => {
    expect(Object.keys(storage).sort()).toEqual(
      [
        // errors
        'StorageError',
        // text and bytes without the runtime
        'utf8Encode',
        'utf8Decode',
        'base64Encode',
        'base64Decode',
        'hexEncode',
        // plain data
        'isPlainRecord',
        'plainCopy',
        'keepUnknownFields',
        // table register
        'TABLE_NAME_PATTERN',
        'RESERVED_TABLE_NAMES',
        'SENSITIVITIES',
        'SYNC_KINDS',
        'defineTable',
        'fieldSensitivity',
        'createTableRegistry',
        // business
        'BusinessBaseSchema',
        // files
        'SHA256_PATTERN',
        'MEDIA_TYPE_PATTERN',
        'FileMetaSchema',
        'sha256Of',
        'matchesChecksum',
        'assertChecksum',
        // ports
        'alive',
        'requireRow',
        // storage in memory
        'createMemoryStorage',
        // WebCrypto as a parameter
        'createWebCryptoHasher',
        // password protection of a backup
        'MIN_PASSWORD_LENGTH',
        'WrongPasswordError',
        'InvalidEnvelopeError',
        'createBackupCipher',
        // backup
        'BACKUP_PROBLEM_KINDS',
        'createBackupKit',
      ].sort(),
    );
  });

  it('holds no fixed list of tables: every edition brings its register', () => {
    const registers = Object.values(storage).filter(
      (value) => typeof value === 'object' && 'tables' in value && 'names' in value,
    );
    expect(registers).toEqual([]);
  });

  it('names no format of an edition: backup and envelope get theirs as a parameter', () => {
    const texts = Object.values(storage).filter((value) => typeof value === 'string');
    expect(texts).toEqual([]);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBackupCipher, createBackupKit, createMemoryStorage } from '../src';
import {
  createTestStorage,
  fixedClock,
  hasher,
  KEY_DERIVATION_TIMEOUT,
  REGISTRY,
  sequentialIds,
  snapshot,
} from './support';

/**
 * The pure part reaches no global of a runtime: the typecheck of `src` proves it by type (no DOM
 * and no Node types), this test by running the package where those globals do not exist.
 * WebCrypto comes in as a parameter and nowhere else.
 */

/** Taken before the globals go: the one object the package is handed. */
const webCrypto = globalThis.crypto;

const RUNTIME_GLOBALS = [
  'crypto',
  'TextEncoder',
  'TextDecoder',
  'btoa',
  'atob',
  'structuredClone',
  'Buffer',
  'process',
] as const;

describe('the package without the globals of a runtime', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it(
    'writes, encrypts, opens, checks and restores a backup',
    { timeout: KEY_DERIVATION_TIMEOUT },
    async () => {
      const t = await createTestStorage();
      const kit = createBackupKit({
        format: 'sample-backup',
        version: 1,
        registry: REGISTRY,
        hasher,
      });
      const cipher = createBackupCipher({ crypto: webCrypto, format: 'sample-encrypted' });
      const device = createMemoryStorage(REGISTRY, {
        hasher,
        clock: fixedClock(),
        ids: sequentialIds(500_000),
      });
      const businessId = t.one.business.id;
      await t.storage.table('notes').add(t.note(businessId, 'Zürich 😀 日本語', { tags: ['ä'] }));
      const bytes = Uint8Array.of(0, 255, 128, 7, 195, 164);

      for (const name of RUNTIME_GLOBALS) {
        vi.stubGlobal(name, undefined);
      }
      // Nothing is asserted in here: the test runner itself may need what was taken away.
      const run = async () => {
        const file = await t.storage.files.put({ businessId, bytes, mediaType: 'image/png' });
        const document = await kit.exportBackup(t.storage, businessId, { clock: t.clock });
        const text = await cipher.encryptBackup(JSON.stringify(document), 'pässwörd 😀');
        const envelope = cipher.readEnvelope(JSON.parse(text));
        if (typeof envelope === 'string') {
          return { problem: envelope };
        }
        const opened: unknown = JSON.parse(await cipher.decryptBackup(envelope, 'pässwörd 😀'));
        const check = await kit.checkBackup(opened);
        if (check.backup === undefined) {
          return { problem: check.preview.problems };
        }
        await kit.restoreBackup(device, check.backup);
        return { verified: await device.files.verify(file.id) };
      };
      const result = await run().catch((error: unknown) => ({ problem: String(error) }));
      vi.unstubAllGlobals();

      expect(result).toEqual({ verified: true });
      const before = await snapshot(t.storage, businessId);
      const after = await snapshot(device, businessId);
      expect(after.business).toEqual(before.business);
      expect(after.tables.notes).toEqual(before.tables.notes);
      expect(after.files).toEqual(before.files);
    },
  );

  it('really runs without them: the runtime has none of these globals while it works', () => {
    for (const name of RUNTIME_GLOBALS) {
      vi.stubGlobal(name, undefined);
    }
    const missing = RUNTIME_GLOBALS.filter(
      (name) => (globalThis as Record<string, unknown>)[name] === undefined,
    );
    vi.unstubAllGlobals();
    expect(missing).toEqual([...RUNTIME_GLOBALS]);
    expect(globalThis.crypto).toBe(webCrypto);
  });
});

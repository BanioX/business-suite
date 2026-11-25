import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { IdSchema, syncFields } from '@onestrand/core';
import {
  createBackupCipher,
  createBackupKit,
  createMemoryStorage,
  createTableRegistry,
  defineTable,
  keepUnknownFields,
  type CheckedBackup,
} from '../src';
import { bytesOf, createTestStorage, fixedClock, hasher, REGISTRY, sequentialIds, type Registry, type Note } from './support';

const out: string[] = [];
const log = (label: string, value: unknown) => out.push(`${label}: ${JSON.stringify(value, (_k, v) => (v === undefined ? '<undefined>' : v))}`);
const kit = createBackupKit({ format: 'sample-backup', version: 1, registry: REGISTRY, hasher });

describe('scratch', () => {
  it('probes', async () => {
    // 1. mutation after check
    {
      const t = await createTestStorage();
      await t.storage.table('notes').add(t.note(t.one.business.id, 'A'));
      const doc = JSON.parse(JSON.stringify(await kit.exportBackup(t.storage, t.one.business.id, { clock: t.clock })));
      const check = await kit.checkBackup(doc);
      const backup = check.backup as CheckedBackup<Registry>;
      try {
        (backup.tables.notes as Note[])[0]!.businessId = t.two.business.id;
        (backup.tables.notes as Note[])[0]!.text = 42 as unknown as string;
        await kit.restoreBackup(t.storage, backup);
        log('1 mutated restore: notes of two', await t.storage.table('notes').ofBusiness(t.two.business.id));
      } catch (error) {
        log('1 mutated restore failed', String(error));
      }
    }
    // 2. row without id
    {
      const t = await createTestStorage();
      try {
        await t.storage.table('notes').put({ text: 'x' } as unknown as Note);
        await t.storage.table('notes').put({ text: 'y' } as unknown as Note);
        log('2 get(undefined)', await t.storage.table('notes').get(undefined as never));
      } catch (error) {
        log('2 failed', String(error));
      }
    }
    // 3. empty text, empty password
    {
      const cipher = createBackupCipher({ crypto: globalThis.crypto, format: 'sample-encrypted' });
      try {
        const text = await cipher.encryptBackup('', 'correct horse');
        const env = cipher.readEnvelope(JSON.parse(text));
        log('3 empty text envelope', typeof env === 'string' ? env : env.data.length);
        if (typeof env !== 'string') log('3 empty text back', await cipher.decryptBackup(env, 'correct horse'));
      } catch (error) {
        log('3 empty text failed', String(error));
      }
      try {
        const text = await cipher.encryptBackup('x', '');
        const env = cipher.readEnvelope(JSON.parse(text));
        if (typeof env !== 'string') log('3 empty password back', await cipher.decryptBackup(env, ''));
      } catch (error) {
        log('3 empty password failed', String(error));
      }
    }
    // 4. key order after loose reading
    log('4 order', Object.keys(keepUnknownFields({ a: 1, x: 2, b: 3 }, { a: 1, b: 3 }) as object));
    // 5. a table named constructor
    {
      const odd = defineTable({ name: 'constructor', schema: z.object({ id: IdSchema, businessId: IdSchema }), indexes: [], sensitivity: 'normal', sync: 'device' });
      const reg = createTableRegistry([odd]);
      const ids = sequentialIds();
      const clock = fixedClock();
      const storage = createMemoryStorage(reg, { hasher, clock, ids });
      const b = { id: ids.next(), name: 'Betrieb Muster', createdAt: clock.now(), updatedAt: clock.now() };
      await storage.businesses.add(b);
      await storage.table('constructor').add({ id: ids.next(), businessId: b.id });
      const k = createBackupKit({ format: 'odd', version: 1, registry: reg, hasher });
      const doc = JSON.parse(JSON.stringify(await k.exportBackup(storage, b.id, { clock })));
      const check = await k.checkBackup(doc);
      log('5 constructor table', check.preview);
      const { tables, counts, ...rest } = doc;
      log('5 missing constructor table', (await k.checkBackup({ ...rest, tables: {}, counts: {} })).preview.problems);
    }
    // 6. zero-length file round trip
    {
      const t = await createTestStorage();
      const meta = await t.storage.files.put({ businessId: t.one.business.id, bytes: new Uint8Array(), mediaType: 'text/plain' });
      const doc = JSON.parse(JSON.stringify(await kit.exportBackup(t.storage, t.one.business.id, { clock: t.clock })));
      log('6 empty file data', doc.files[0].data);
      const check = await kit.checkBackup(doc);
      log('6 empty file problems', check.preview.problems);
      const device = createMemoryStorage(REGISTRY, { hasher, clock: fixedClock(), ids: sequentialIds(5000) });
      if (check.backup) await kit.restoreBackup(device, check.backup);
      log('6 verify', await device.files.verify(meta.id));
    }
    // 7. lone surrogate in a row survives the file
    {
      const t = await createTestStorage();
      const note = t.note(t.one.business.id, 'cut \ud83d here 😀 ä');
      await t.storage.table('notes').add(note);
      const text = JSON.stringify(await kit.exportBackup(t.storage, t.one.business.id, { clock: t.clock }));
      const cipher = createBackupCipher({ crypto: globalThis.crypto, format: 'sample-encrypted' });
      const env = cipher.readEnvelope(JSON.parse(await cipher.encryptBackup(text, 'pw pw pw pw')));
      if (typeof env !== 'string') {
        const back = await cipher.decryptBackup(env, 'pw pw pw pw');
        log('7 same text', back === text);
        const check = await kit.checkBackup(JSON.parse(back));
        log('7 problems', check.preview.problems);
        log('7 same row', JSON.stringify(check.backup?.tables.notes?.[0]) === JSON.stringify(note));
      }
    }
    // 8. device rows on restore
    {
      const t = await createTestStorage();
      await t.storage.table('device_settings').add({ id: t.ids.next(), businessId: t.one.business.id, key: 'printer', value: 'A4' });
      const doc = JSON.parse(JSON.stringify(await kit.exportBackup(t.storage, t.one.business.id, { clock: t.clock })));
      const check = await kit.checkBackup(doc);
      if (check.backup) await kit.restoreBackup(t.storage, check.backup);
      log('8 device rows after restore', await t.storage.table('device_settings').ofBusiness(t.one.business.id));
    }
    // 9. a version-1 file with __proto__ in a row, read by a kit of version 2
    {
      const k2 = createBackupKit({ format: 'sample-backup', version: 2, registry: REGISTRY, hasher, readers: { 1: (d) => d } });
      const t = await createTestStorage();
      await t.storage.table('notes').add(t.note(t.one.business.id, 'A', { tags: ['x'] }));
      const text = JSON.stringify(await kit.exportBackup(t.storage, t.one.business.id, { clock: t.clock })).replace('"tags":', '"__proto__":{"a":1},"tags":');
      log('9 v1 with proto under v2', (await k2.checkBackup(JSON.parse(text))).preview);
    }
    // 10. syncFields has deletedAt?
    log('10 syncFields', Object.keys(syncFields));
    writeFileSync('/tmp/claude-0/-home-user/b9e7b8bd-4bc1-5915-8b9c-6963a51e6c01/scratchpad/storage/probe.txt', out.join('\n'));
    expect(true).toBe(true);
  });
});

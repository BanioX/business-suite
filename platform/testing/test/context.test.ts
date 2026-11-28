import { createMemoryStorage, type BusinessBase } from '@onestrand/storage';
import { describe, expect, it } from 'vitest';
import { businessSnapshot, createTestContext, fixedClock, sequentialIds, testHasher } from '../src';
import { bytesOf, REGISTRY } from './support';

describe('createTestContext', () => {
  it('seeds one made-up business with an owner and a second person, as ids only', async () => {
    const t = await createTestContext({ registry: REGISTRY });
    expect(t.businessId).toBe('01a3185c-5000-7000-8000-000000000001');
    expect(t.ownerId).toBe('01a3185c-5000-7000-8000-000000000002');
    expect(t.secondPersonId).toBe('01a3185c-5000-7000-8000-000000000003');
    expect(t.business).toEqual({
      id: t.businessId,
      name: 'Betrieb Muster',
      createdAt: '2026-11-14T10:00:00.000Z',
      updatedAt: '2026-11-14T10:00:00.000Z',
    });
    expect(await t.storage.businesses.get(t.businessId)).toEqual(t.business);
    expect(t.registry).toBe(REGISTRY);
    expect(t.hasher).toBe(testHasher);

    // No row of a person, and nothing else: the seed is lean.
    const snapshot = await t.snapshot();
    expect(snapshot).toEqual({
      business: t.business,
      tables: { notes: [], time_entries: [], device_settings: [] },
      files: [],
      events: [],
    });
  });

  it('gives a use case its context: storage, clock, ids, and the owner as the person acting', async () => {
    const t = await createTestContext({ registry: REGISTRY });
    expect(t.ctx).toEqual({ storage: t.storage, clock: t.clock, ids: t.ids, actor: t.ownerId });
    expect(t.actor).toBe(t.ownerId);
    expect(t.ctx.clock.today()).toBe('2026-11-14');
    // The ids go on after the seed, and a command id is one of them.
    expect(t.cmd()).toBe('01a3185c-5000-7000-8000-000000000004');
    expect(t.ids.next()).toBe('01a3185c-5000-7000-8000-000000000005');
  });

  it('lets another person act without changing the context of the owner', async () => {
    const t = await createTestContext({ registry: REGISTRY });
    const other = t.actingAs(t.secondPersonId);
    expect(other.actor).toBe(t.secondPersonId);
    expect(other.storage).toBe(t.storage);
    expect(other.clock).toBe(t.clock);
    expect(other.ids).toBe(t.ids);
    expect(t.ctx.actor).toBe(t.ownerId);
  });

  it('takes the day, the first id and the name it is given', async () => {
    const t = await createTestContext({
      registry: REGISTRY,
      today: '2027-03-01',
      idStart: 500,
      name: 'Betrieb Probe',
    });
    expect(t.clock.today()).toBe('2027-03-01');
    expect(t.businessId).toBe(sequentialIds(500).next());
    expect(t.business.name).toBe('Betrieb Probe');
    expect(t.business.createdAt).toBe('2027-03-01T10:00:00.000Z');
  });

  it('takes a clock, and refuses a clock together with a day', async () => {
    const clock = fixedClock('2026-12-24');
    const t = await createTestContext({ registry: REGISTRY, clock });
    expect(t.clock).toBe(clock);
    expect(t.business.createdAt).toBe(clock.now());

    await expect(
      createTestContext({ registry: REGISTRY, clock, today: '2026-12-24' }),
    ).rejects.toThrow(TypeError);
  });

  it('seeds a storage it is given, with the hasher it is given', async () => {
    const clock = fixedClock();
    const hasher = { sha256: () => Promise.resolve('0'.repeat(64)) };
    const storage = createMemoryStorage(REGISTRY, { hasher, clock, ids: sequentialIds(9000) });
    const t = await createTestContext({ registry: REGISTRY, storage, clock, hasher });
    expect(t.storage).toBe(storage);
    expect(t.hasher).toBe(hasher);
    expect(await storage.businesses.get(t.businessId)).toEqual(t.business);
  });

  it('completes the row of the business where the storage holds a fuller model', async () => {
    type FullBusiness = BusinessBase & { currency: 'CHF' };
    const seen: BusinessBase[] = [];
    const t = await createTestContext({
      registry: REGISTRY,
      business: (base: BusinessBase): FullBusiness => {
        seen.push(base);
        return { ...base, currency: 'CHF' };
      },
    });
    expect(t.business.currency).toBe('CHF');
    expect(seen).toEqual([
      {
        id: t.businessId,
        name: 'Betrieb Muster',
        createdAt: '2026-11-14T10:00:00.000Z',
        updatedAt: '2026-11-14T10:00:00.000Z',
      },
    ]);
    expect(await t.storage.businesses.get(t.businessId)).toEqual(t.business);

    // A further business is completed the same way.
    const second = await t.addBusiness();
    expect(second.business.currency).toBe('CHF');
  });

  it('refuses a name that is no name', async () => {
    await expect(createTestContext({ registry: REGISTRY, name: '   ' })).rejects.toThrow();
  });
});

describe('a further business on the same storage', () => {
  it('is «Betrieb Beispiel», with its own persons and its own range of ids', async () => {
    const one = await createTestContext({ registry: REGISTRY });
    const two = await one.addBusiness();
    expect(two.business.name).toBe('Betrieb Beispiel');
    expect(two.storage).toBe(one.storage);
    expect(two.clock).toBe(one.clock);
    expect(two.registry).toBe(one.registry);
    expect(two.businessId).toBe(sequentialIds(1_000_001).next());
    expect(new Set([one.businessId, one.ownerId, one.secondPersonId]).size).toBe(3);
    expect([two.businessId, two.ownerId, two.secondPersonId]).not.toContain(one.businessId);
    expect(two.ctx.actor).toBe(two.ownerId);
    expect(two.cmd()).not.toBe(one.cmd());
  });

  it('gets a name of its own from the third on, or the name it is given', async () => {
    const one = await createTestContext({ registry: REGISTRY, idStart: 10 });
    await one.addBusiness();
    const three = await one.addBusiness();
    const four = await one.addBusiness({ name: 'Betrieb Probe' });
    expect(three.business.name).toBe('Betrieb 3');
    expect(three.businessId).toBe(sequentialIds(2_000_010).next());
    expect(four.business.name).toBe('Betrieb Probe');
    // Added from any of them, the next one still gets a fresh range.
    const five = await three.addBusiness();
    expect(five.businessId).toBe(sequentialIds(4_000_010).next());
  });

  it('never shares a range of ids when two are added side by side', async () => {
    const one = await createTestContext({ registry: REGISTRY });
    const [two, three] = await Promise.all([one.addBusiness(), one.addBusiness()]);
    expect(two.businessId).not.toBe(three.businessId);
    expect(new Set([two.business.name, three.business.name]).size).toBe(2);
  });

  it('stays untouched by what the first business does, and the other way round', async () => {
    const one = await createTestContext({ registry: REGISTRY });
    const two = await one.addBusiness();
    const before = await two.snapshot();

    const file = await one.storage.files.put({
      businessId: one.businessId,
      bytes: bytesOf('Notiz'),
      mediaType: 'text/plain',
    });
    await one.storage.table('notes').put({
      id: one.ids.next(),
      businessId: one.businessId,
      text: 'Schlüssel beim Empfang',
      fileId: file.id,
      createdAt: one.clock.now(),
      updatedAt: one.clock.now(),
    });
    await one.storage.events.append({
      id: one.ids.next(),
      businessId: one.businessId,
      type: 'note.added',
      version: 1,
      at: one.clock.now(),
      actor: one.ownerId,
      payload: {},
    });

    expect(await two.snapshot()).toEqual(before);
    const after = await one.snapshot();
    expect(after.tables.notes).toHaveLength(1);
    expect(after.files).toEqual([{ meta: file, bytes: Array.from(bytesOf('Notiz')) }]);
    expect(after.events.map((event) => event.type)).toEqual(['note.added']);

    await one.storage.purge(one.businessId);
    expect(await two.snapshot()).toEqual(before);
    expect((await one.snapshot()).business).toBeUndefined();
  });
});

describe('businessSnapshot', () => {
  it('lists the rows of every table sorted by id, soft-deleted ones included', async () => {
    const t = await createTestContext({ registry: REGISTRY });
    const stamps = { createdAt: t.clock.now(), updatedAt: t.clock.now() };
    const [first, second, third] = [t.ids.next(), t.ids.next(), t.ids.next()];
    const notes = t.storage.table('notes');
    await notes.put({ id: third, businessId: t.businessId, text: 'c', ...stamps });
    await notes.put({ id: first, businessId: t.businessId, text: 'a', ...stamps });
    await notes.put({
      id: second,
      businessId: t.businessId,
      text: 'b',
      ...stamps,
      deletedAt: t.clock.now(),
    });

    const snapshot = await businessSnapshot(t.storage, REGISTRY, t.businessId);
    expect(snapshot.tables.notes.map((row) => row.id)).toEqual([first, second, third]);
    expect(snapshot).toEqual(await t.snapshot());
  });

  it('has no business and nothing else for an id the storage does not hold', async () => {
    const t = await createTestContext({ registry: REGISTRY });
    expect(await businessSnapshot(t.storage, REGISTRY, t.ids.next())).toEqual({
      business: undefined,
      tables: { notes: [], time_entries: [], device_settings: [] },
      files: [],
      events: [],
    });
  });
});

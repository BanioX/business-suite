import type { Id } from '@onestrand/core';
import { StorageError, type Hasher } from '@onestrand/storage';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import {
  openIndexedDbStorage,
  WebDataError,
  type IndexedDbStorage,
  type IndexedDbStorageOptions,
  type RowMigration,
  type SchemaLedger,
} from '../src';
import { asSuiteError } from '../src/idb';
import {
  bytesOf,
  EXTENDED,
  FIRST_STEP,
  fixedClock,
  hasher,
  type Note,
  REGISTRY,
  SECOND_STEP,
  sequentialIds,
} from './support';

/** Settles after the requests that are pending have had their turn. */
const turn = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 5));

const codeOf = async (call: Promise<unknown>): Promise<string | undefined> => {
  try {
    await call;
    return undefined;
  } catch (error) {
    return error instanceof StorageError || error instanceof WebDataError
      ? error.code
      : String(error);
  }
};

interface Opened {
  /** Typed for the register of the second release, which holds the first one's tables too. */
  storage: IndexedDbStorage<typeof EXTENDED>;
  ids: ReturnType<typeof sequentialIds>;
  clock: ReturnType<typeof fixedClock>;
}

/** Opens the sample database on a factory; `ledger` and the register default to the first release. */
async function open(
  factory: IDBFactory,
  more: Partial<IndexedDbStorageOptions<typeof REGISTRY | typeof EXTENDED>> & {
    hasher?: Hasher;
    /** Where the counting ids start: two storages that must not meet need two ranges. */
    idStart?: number;
  } = {},
): Promise<Opened> {
  const { hasher: given, idStart = 1, ...options } = more;
  const ids = sequentialIds(idStart);
  const clock = fixedClock();
  const storage = (await openIndexedDbStorage({
    name: 'sample',
    tables: REGISTRY,
    ledger: [FIRST_STEP],
    ports: { hasher: given ?? hasher, clock, ids },
    indexedDB: factory,
    ...options,
  })) as unknown as IndexedDbStorage<typeof EXTENDED>;
  return { storage, ids, clock };
}

const SECOND_RELEASE = { tables: EXTENDED, ledger: [FIRST_STEP, SECOND_STEP] } as const;

function note(o: Opened, businessId: Id, text: string, more: Record<string, unknown> = {}): Note {
  const now = o.clock.now();
  return { id: o.ids.next(), businessId, text, createdAt: now, updatedAt: now, ...more };
}

async function business(o: Opened, name: string): Promise<Id> {
  const now = o.clock.now();
  const id = o.ids.next();
  await o.storage.businesses.add({ id, name, createdAt: now, updatedAt: now });
  return id;
}

/** The database as the browser sees it, for what the storage cannot tell. */
function rawOpen(factory: IDBFactory, name = 'sample'): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(name);
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('open failed'));
    };
  });
}

function rawAll(db: IDBDatabase, store: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, 'readonly').objectStore(store).getAll();
    request.onsuccess = () => {
      resolve(request.result as unknown[]);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('read failed'));
    };
  });
}

function rawPut(db: IDBDatabase, store: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, 'readwrite');
    transaction.objectStore(store).put(value);
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onerror = () => {
      reject(transaction.error ?? new Error('write failed'));
    };
  });
}

describe('the database', () => {
  it('has a store for every table and for what the storage keeps, with the indexes of the register', async () => {
    const factory = new IDBFactory();
    const { storage } = await open(factory);
    storage.close();
    const db = await rawOpen(factory);
    expect(db.version).toBe(1);
    expect([...db.objectStoreNames].sort()).toEqual(
      [
        'businesses',
        'commands',
        'device_settings',
        'events',
        'files',
        'files.bytes',
        'notes',
        'time_entries',
      ].sort(),
    );
    const transaction = db.transaction([...db.objectStoreNames], 'readonly');
    const indexes = (store: string) => [...transaction.objectStore(store).indexNames].sort();
    expect(indexes('notes')).toEqual(['businessId', 'text']);
    expect(indexes('time_entries')).toEqual(['businessId', 'personId,at']);
    expect(indexes('device_settings')).toEqual(['businessId', 'key']);
    expect(indexes('events')).toEqual(['businessId', 'id']);
    expect(indexes('files')).toEqual(['businessId']);
    expect(transaction.objectStore('time_entries').index('personId,at').keyPath).toEqual([
      'personId',
      'at',
    ]);
    expect(transaction.objectStore('notes').keyPath).toBe('id');
    db.close();
  });

  it('is named by the caller and the name is the only thing that tells two apart', async () => {
    const factory = new IDBFactory();
    const one = await open(factory, { name: 'first' });
    const two = await open(factory, { name: 'second', idStart: 100_000 });
    const mine = await business(one, 'Betrieb Muster');
    const theirs = await business(two, 'Betrieb Beispiel');
    await one.storage.table('notes').add(note(one, mine, 'Notiz Eins'));
    await two.storage.table('notes').add(note(two, theirs, 'Notiz Zwei'));

    expect((await one.storage.businesses.all()).map((row) => row.name)).toEqual(['Betrieb Muster']);
    expect((await two.storage.businesses.all()).map((row) => row.name)).toEqual([
      'Betrieb Beispiel',
    ]);
    expect(await one.storage.table('notes').ofBusiness(theirs)).toEqual([]);
    expect((await factory.databases()).map((entry) => entry.name).sort()).toEqual([
      'first',
      'second',
    ]);
    expect(one.storage.name).toBe('first');
    expect(one.storage.version).toBe(1);
    // Purging in one never reaches the other.
    await one.storage.purge(mine);
    expect(await two.storage.businesses.all()).toHaveLength(1);
    expect(await two.storage.table('notes').ofBusiness(theirs)).toHaveLength(1);
  });

  it('keeps everything over closing and opening again', async () => {
    const factory = new IDBFactory();
    const first = await open(factory);
    const id = await business(first, 'Betrieb Muster');
    const row = note(first, id, 'Bleibt', { place: { room: 'Lager', floor: 2 }, extra: [1, null] });
    await first.storage.table('notes').add(row);
    await first.storage.table('time_entries').add({
      id: first.ids.next(),
      businessId: id,
      personId: first.ids.next(),
      minutes: 30,
      at: first.clock.now(),
    });
    await first.storage.events.append({
      id: first.ids.next(),
      type: 'note.added',
      version: 1,
      businessId: id,
      actor: first.ids.next(),
      at: first.clock.now(),
      payload: { noteId: row.id },
    });
    const commandId = first.ids.next();
    await first.storage.commands.record({
      commandId,
      businessId: id,
      operation: 'notes.add',
      result: { ok: true },
      at: first.clock.now(),
    });
    const meta = await first.storage.files.put({
      businessId: id,
      bytes: Uint8Array.of(0, 1, 2, 254, 255),
      mediaType: 'application/octet-stream',
      name: 'bytes.bin',
    });
    first.storage.close();

    const again = await open(factory);
    expect(await again.storage.table('notes').ofBusiness(id)).toEqual([row]);
    expect(await again.storage.table('time_entries').ofBusiness(id)).toHaveLength(1);
    expect(await again.storage.events.ofBusiness(id)).toHaveLength(1);
    expect((await again.storage.commands.find(commandId))?.result).toEqual({ ok: true });
    expect(await again.storage.files.get(meta.id)).toEqual({
      meta,
      bytes: Uint8Array.of(0, 1, 2, 254, 255),
    });
    expect(await again.storage.files.verify(meta.id)).toBe(true);
    expect((await again.storage.businesses.get(id))?.name).toBe('Betrieb Muster');
  });

  it('keeps the order of the events over closing and opening again, whatever their ids', async () => {
    const factory = new IDBFactory();
    const first = await open(factory);
    const id = await business(first, 'Betrieb Muster');
    const types = ['a.one', 'a.two', 'a.three', 'a.four'];
    const ids = [4, 3, 2, 1].map((start) => sequentialIds(7000 + start).next());
    for (const [index, type] of types.entries()) {
      await first.storage.events.append({
        id: ids[index] ?? first.ids.next(),
        type,
        version: 1,
        businessId: id,
        actor: id,
        at: first.clock.now(),
        payload: {},
      });
    }
    first.storage.close();
    const again = await open(factory);
    expect((await again.storage.events.ofBusiness(id)).map((event) => event.type)).toEqual(types);
  });
});

describe('files', () => {
  it('lie as bytes with their meta data apart, never as text in a row', async () => {
    const factory = new IDBFactory();
    const o = await open(factory);
    const id = await business(o, 'Betrieb Muster');
    const bytes = new Uint8Array(1000).map((_, index) => index % 256);
    const meta = await o.storage.files.put({ businessId: id, bytes, mediaType: 'image/png' });
    o.storage.close();

    const db = await rawOpen(factory);
    const metas = await rawAll(db, 'files');
    const stored = await rawAll(db, 'files.bytes');
    expect(metas).toEqual([meta]);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(stored[0] as ArrayBuffer)).toEqual(bytes);
    // No row of any table carries the bytes, in any form.
    for (const store of ['notes', 'time_entries', 'device_settings', 'events', 'commands']) {
      expect(await rawAll(db, store), store).toEqual([]);
    }
    db.close();
  });

  it('are listed without their bytes being read: the meta data lies in a store of its own', async () => {
    const o = await open(new IDBFactory());
    const id = await business(o, 'Betrieb Muster');
    const meta = await o.storage.files.put({
      businessId: id,
      bytes: new Uint8Array(100_000),
      mediaType: 'application/pdf',
    });
    expect(await o.storage.files.ofBusiness(id)).toEqual([meta]);
  });

  it('go with their business when it is purged, bytes and all', async () => {
    const factory = new IDBFactory();
    const o = await open(factory);
    const mine = await business(o, 'Betrieb Muster');
    const theirs = await business(o, 'Betrieb Beispiel');
    await o.storage.files.put({
      businessId: mine,
      bytes: bytesOf('Eins'),
      mediaType: 'text/plain',
    });
    const kept = await o.storage.files.put({
      businessId: theirs,
      bytes: bytesOf('Zwei'),
      mediaType: 'text/plain',
    });
    await o.storage.purge(mine);
    o.storage.close();
    const db = await rawOpen(factory);
    expect(await rawAll(db, 'files')).toEqual([kept]);
    expect(await rawAll(db, 'files.bytes')).toHaveLength(1);
    expect(await rawAll(db, 'businesses')).toHaveLength(1);
    db.close();
  });

  it('are stored whole when they are large, and whatever bytes they hold', async () => {
    const o = await open(new IDBFactory());
    const id = await business(o, 'Betrieb Muster');
    const bytes = new Uint8Array(2_000_000).map((_, index) => (index * 7) % 256);
    const meta = await o.storage.files.put({ businessId: id, bytes, mediaType: 'image/jpeg' });
    const read = await o.storage.files.get(meta.id);
    expect(read?.bytes.length).toBe(2_000_000);
    expect(read?.bytes.every((byte, index) => byte === (index * 7) % 256)).toBe(true);
    expect(await o.storage.files.verify(meta.id)).toBe(true);
  });
});

describe('rows', () => {
  it('are stored when a field the register indexes holds no key the database can index', async () => {
    const o = await open(new IDBFactory());
    const id = await business(o, 'Betrieb Muster');
    // `text` is indexed; none of these is a key. The row is stored, only the index skips it.
    const rows = [true, null, { a: 1 }, [[]], undefined].map((text) => note(o, id, 'x', { text }));
    for (const row of rows) {
      await o.storage.table('notes').put(row);
    }
    const read = await o.storage.table('notes').ofBusiness(id);
    expect(read).toHaveLength(rows.length);
    for (const row of rows) {
      expect(await o.storage.table('notes').get(row.id)).toEqual(JSON.parse(JSON.stringify(row)));
    }
  });

  it('read back as plain data, whatever the database made of them', async () => {
    const o = await open(new IDBFactory());
    const id = await business(o, 'Betrieb Muster');
    const row = note(o, id, 'Notiz', { tags: ['a', 'b'] });
    await o.storage.table('notes').add(row);
    const read = await o.storage.table('notes').get(row.id);
    expect(Object.getPrototypeOf(read)).toBe(Object.prototype);
    expect(read).toStrictEqual(row);
  });
});

describe('opening', () => {
  it('upgrades by the steps the device has not seen: the new table comes, the old data stays', async () => {
    const factory = new IDBFactory();
    const first = await open(factory);
    const id = await business(first, 'Betrieb Muster');
    const row = note(first, id, 'Bleibt');
    await first.storage.table('notes').add(row);
    first.storage.close();

    const second = await open(factory, SECOND_RELEASE);
    expect(second.storage.version).toBe(2);
    expect(await second.storage.table('notes').ofBusiness(id)).toEqual([row]);
    const extra = {
      id: second.ids.next(),
      businessId: id,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      label: 'Neu',
    };
    await second.storage.table('extra_things').add(extra);
    expect(await second.storage.table('extra_things').ofBusiness(id)).toEqual([extra]);
    second.storage.close();

    const db = await rawOpen(factory);
    expect(db.version).toBe(2);
    const transaction = db.transaction(['notes', 'extra_things'], 'readonly');
    expect([...transaction.objectStore('notes').indexNames].sort()).toEqual([
      'businessId',
      'text',
      'updatedAt',
    ]);
    expect([...transaction.objectStore('extra_things').indexNames].sort()).toEqual([
      'businessId',
      'label',
    ]);
    db.close();
  });

  it('creates the whole schema in one go on a device that has none, whatever the number of steps', async () => {
    const o = await open(new IDBFactory(), SECOND_RELEASE);
    expect(o.storage.version).toBe(2);
    expect(await o.storage.table('extra_things').ofBusiness(o.ids.next())).toEqual([]);
  });

  it('opens the same database again without running a step twice', async () => {
    const factory = new IDBFactory();
    let runs = 0;
    const migration: RowMigration = {
      id: 'sample.shout',
      table: 'notes',
      upgrade: (row) => {
        runs += 1;
        return { ...row, text: String(row.text).toUpperCase() };
      },
    };
    const ledger: SchemaLedger = [FIRST_STEP];
    const first = await open(factory, { ledger, migrations: [migration] });
    const id = await business(first, 'Betrieb Muster');
    await first.storage.table('notes').add(note(first, id, 'leise'));
    first.storage.close();

    const withMigration: SchemaLedger = [FIRST_STEP, { migrations: ['sample.shout'] }];
    const second = await open(factory, { ledger: withMigration, migrations: [migration] });
    expect((await second.storage.table('notes').ofBusiness(id)).map((row) => row.text)).toEqual([
      'LEISE',
    ]);
    expect(runs).toBe(1);
    second.storage.close();
    const third = await open(factory, { ledger: withMigration, migrations: [migration] });
    expect(runs).toBe(1);
    expect((await third.storage.table('notes').ofBusiness(id)).map((row) => row.text)).toEqual([
      'LEISE',
    ]);
  });

  it('runs the migrations in the order of the ledger, each over every row of every business', async () => {
    const factory = new IDBFactory();
    const order: string[] = [];
    const append =
      (id: string, suffix: string): RowMigration['upgrade'] =>
      (row) => {
        order.push(`${id}:${String(row.id).slice(-2)}`);
        return { ...row, text: `${String(row.text)}${suffix}` };
      };
    const migrations: RowMigration[] = [
      { id: 'sample.b', table: 'notes', upgrade: append('b', '-b') },
      { id: 'sample.a', table: 'notes', upgrade: append('a', '-a') },
    ];
    const first = await open(factory);
    const one = await business(first, 'Betrieb Muster');
    const two = await business(first, 'Betrieb Beispiel');
    const rows = [note(first, one, 'x'), note(first, two, 'y')];
    for (const row of rows) {
      await first.storage.table('notes').add(row);
    }
    first.storage.close();

    // The ledger says a before b, and in the list of migrations b stands first: the ledger rules.
    const ledger: SchemaLedger = [
      FIRST_STEP,
      { migrations: ['sample.a'] },
      { migrations: ['sample.b'] },
    ];
    const second = await open(factory, { ledger, migrations });
    expect(order.map((entry) => entry.split(':')[0])).toEqual(['a', 'a', 'b', 'b']);
    expect((await second.storage.table('notes').ofBusiness(one))[0]?.text).toBe('x-a-b');
    expect((await second.storage.table('notes').ofBusiness(two))[0]?.text).toBe('y-a-b');
  });

  it('runs the migrations of a fresh device over no row at all', async () => {
    let runs = 0;
    const migration: RowMigration = {
      id: 'sample.never',
      table: 'notes',
      upgrade: (row) => {
        runs += 1;
        return row;
      },
    };
    const o = await open(new IDBFactory(), {
      ledger: [FIRST_STEP, { migrations: ['sample.never'] }],
      migrations: [migration],
    });
    expect(runs).toBe(0);
    expect(o.storage.version).toBe(2);
  });

  it('leaves the database as it was when a migration throws, and says why', async () => {
    const factory = new IDBFactory();
    const first = await open(factory);
    const id = await business(first, 'Betrieb Muster');
    const row = note(first, id, 'Bleibt');
    await first.storage.table('notes').add(row);
    first.storage.close();

    const broken: RowMigration = {
      id: 'sample.broken',
      table: 'notes',
      upgrade: () => {
        throw new Error('cannot be upgraded');
      },
    };
    // The step also brings a table: it must not be there afterwards either.
    const ledger: SchemaLedger = [FIRST_STEP, { ...SECOND_STEP, migrations: ['sample.broken'] }];
    const failure: unknown = await open(factory, {
      tables: EXTENDED,
      ledger,
      migrations: [broken],
    }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(WebDataError);
    expect(failure).toMatchObject({ code: 'migration' });
    expect((failure as Error).message).toContain('cannot be upgraded');

    const db = await rawOpen(factory);
    expect(db.version).toBe(1);
    expect([...db.objectStoreNames]).not.toContain('extra_things');
    db.close();
    const again = await open(factory);
    expect(await again.storage.table('notes').ofBusiness(id)).toEqual([row]);
  });

  it.each([
    ['another id', (row: Record<string, unknown>) => ({ ...row, id: 'other' })],
    ['another business', (row: Record<string, unknown>) => ({ ...row, businessId: 'other' })],
    ['no row at all', () => undefined as unknown as Record<string, unknown>],
  ])(
    'refuses a migration that returns %s, and leaves the database as it was',
    async (_what, upgrade) => {
      const factory = new IDBFactory();
      const first = await open(factory);
      const id = await business(first, 'Betrieb Muster');
      await first.storage.table('notes').add(note(first, id, 'Bleibt'));
      first.storage.close();
      const migration: RowMigration = { id: 'sample.bad', table: 'notes', upgrade };
      await expect(
        open(factory, {
          ledger: [FIRST_STEP, { migrations: ['sample.bad'] }],
          migrations: [migration],
        }),
      ).rejects.toMatchObject({ code: 'migration' });
      const db = await rawOpen(factory);
      expect(db.version).toBe(1);
      expect(((await rawAll(db, 'notes')) as Note[]).map((row) => row.text)).toEqual(['Bleibt']);
      db.close();
    },
  );

  it('refuses a database that a newer ledger wrote', async () => {
    const factory = new IDBFactory();
    const newer = await open(factory, SECOND_RELEASE);
    newer.storage.close();
    expect(await codeOf(open(factory))).toBe('downgrade');
  });

  it('refuses a ledger that does not lead to the register, and creates nothing', async () => {
    const factory = new IDBFactory();
    const failure: unknown = await open(factory, {
      ledger: [{ tables: [{ name: 'notes' }] }],
    }).catch((error: unknown) => error);
    expect(failure).toMatchObject({ code: 'invalid_ledger' });
    expect((failure as WebDataError).problems.map((problem) => problem.code)).toEqual([
      'index_missing',
      'table_missing',
      'table_missing',
    ]);
    expect((failure as Error).message).toContain('table_missing (time_entries)');
    expect(await factory.databases()).toEqual([]);
    expect(await codeOf(open(factory, { ledger: [] }))).toBe('invalid_ledger');
  });

  it('refuses a migration the ledger names and nobody gave', async () => {
    const failure = await codeOf(
      open(new IDBFactory(), { ledger: [FIRST_STEP, { migrations: ['sample.nobody'] }] }),
    );
    expect(failure).toBe('invalid_ledger');
  });

  it('says so when the browser gives no IndexedDB', async () => {
    const failure: unknown = await openIndexedDbStorage({
      name: 'sample',
      tables: REGISTRY,
      ledger: [FIRST_STEP],
      ports: { hasher, clock: fixedClock(), ids: sequentialIds() },
    }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(WebDataError);
    expect(failure).toMatchObject({ code: 'unavailable' });
  });

  it('uses the IndexedDB of the page when none is given', async () => {
    const factory = new IDBFactory();
    Object.defineProperty(globalThis, 'indexedDB', { value: factory, configurable: true });
    try {
      const storage = await openIndexedDbStorage({
        name: 'sample',
        tables: REGISTRY,
        ledger: [FIRST_STEP],
        ports: { hasher, clock: fixedClock(), ids: sequentialIds() },
      });
      expect((await factory.databases()).map((entry) => entry.name)).toEqual(['sample']);
      storage.close();
    } finally {
      Reflect.deleteProperty(globalThis, 'indexedDB');
    }
  });
});

describe('the connection', () => {
  it('fails every call after it is closed, and opens again', async () => {
    const factory = new IDBFactory();
    const o = await open(factory);
    const id = await business(o, 'Betrieb Muster');
    o.storage.close();
    for (const call of [
      o.storage.businesses.all(),
      o.storage.table('notes').ofBusiness(id),
      o.storage.table('notes').put(note(o, id, 'x')),
      o.storage.events.ofBusiness(id),
      o.storage.files.ofBusiness(id),
      o.storage.purge(id),
      o.storage.transaction(() => o.storage.businesses.all()),
    ]) {
      expect(await codeOf(call)).toBe('closed');
    }
    const again = await open(factory);
    expect(await again.storage.businesses.get(id)).toBeDefined();
  });

  it('closes itself when another tab upgrades the database, and tells the app', async () => {
    const factory = new IDBFactory();
    let told = 0;
    const old = await open(factory, {
      onVersionChange: () => {
        told += 1;
      },
    });
    const id = await business(old, 'Betrieb Muster');
    const upgraded = await open(factory, SECOND_RELEASE);
    expect(told).toBe(1);
    expect(await codeOf(old.storage.businesses.get(id))).toBe('closed');
    expect(await upgraded.storage.businesses.get(id)).toBeDefined();
  });

  it('tells the app while an older connection of another tab holds the upgrade up', async () => {
    const factory = new IDBFactory();
    const old = await open(factory);
    old.storage.close();
    // A connection that never closes: it does not know the storage, it only holds the database.
    const holder = await rawOpen(factory);
    let blocked = 0;
    let opened = false;
    const upgrading = open(factory, {
      ...SECOND_RELEASE,
      onBlocked: () => {
        blocked += 1;
      },
    }).then((result) => {
      opened = true;
      return result;
    });
    await turn();
    await turn();
    expect(blocked).toBe(1);
    expect(opened).toBe(false);
    holder.close();
    const result = await upgrading;
    expect(result.storage.version).toBe(2);
  });
});

describe('what the database refuses, as errors of the suite', () => {
  it('turns a row that exists already into `exists`, a full device into `quota`', () => {
    expect(asSuiteError(new DOMException('twice', 'ConstraintError'))).toMatchObject({
      code: 'exists',
    });
    expect(asSuiteError(new DOMException('twice', 'ConstraintError'))).toBeInstanceOf(StorageError);
    expect(asSuiteError(new DOMException('full', 'QuotaExceededError'))).toMatchObject({
      code: 'quota',
    });
    expect(asSuiteError(new DOMException('closing', 'InvalidStateError'))).toMatchObject({
      code: 'closed',
    });
  });

  it('keeps the original as the cause of anything else, and leaves its own errors alone', () => {
    const original = new DOMException('odd', 'DataError');
    const wrapped = asSuiteError(original);
    expect(wrapped).toBeInstanceOf(WebDataError);
    expect(wrapped).toMatchObject({ code: 'failed', cause: original });
    expect(asSuiteError('just a text')).toMatchObject({ code: 'failed' });
    expect(asSuiteError({ name: 'ConstraintError' })).toMatchObject({ code: 'exists' });
    const own = new StorageError('exists', 'again');
    expect(asSuiteError(own)).toBe(own);
    const closed = new WebDataError('closed', 'shut');
    expect(asSuiteError(closed)).toBe(closed);
  });
});

describe('two tabs on one database', () => {
  it('lets one of two writers that add the same row at the same time win, and refuses the other', async () => {
    const factory = new IDBFactory();
    const a = await open(factory);
    const b = await open(factory);
    const id = await business(a, 'Betrieb Muster');
    const row = note(a, id, 'Zweimal');
    // Both look, both find nothing, both write: only the database can tell who was first.
    const results = await Promise.allSettled([
      a.storage.table('notes').add(row),
      b.storage.table('notes').add({ ...row, text: 'Andere' }),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual(['fulfilled', 'rejected']);
    const refused = results.find((result) => result.status === 'rejected');
    expect(refused?.status === 'rejected' && refused.reason).toMatchObject({ code: 'exists' });
    expect(await a.storage.table('notes').ofBusiness(id)).toHaveLength(1);
  });

  it('writes nothing of a transaction when another tab took one of its rows in the meantime', async () => {
    const factory = new IDBFactory();
    const a = await open(factory);
    const b = await open(factory);
    const id = await business(a, 'Betrieb Muster');
    const mine = note(a, id, 'Meine');
    const contested = note(a, id, 'Umstritten');
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transaction = a.storage.transaction(async () => {
      await a.storage.table('notes').add(mine);
      await a.storage.table('notes').add(contested);
      await gate;
    });
    await turn();
    await b.storage.table('notes').add({ ...contested, text: 'Der andere war schneller' });
    release();
    expect(await codeOf(transaction)).toBe('exists');
    const rows = await a.storage.table('notes').ofBusiness(id);
    expect(rows.map((row) => row.text)).toEqual(['Der andere war schneller']);
  });
});

describe('a write that comes after its transaction', () => {
  it('is refused: the work of a transaction waits for every call it makes', async () => {
    const o = await open(new IDBFactory());
    const id = await business(o, 'Betrieb Muster');
    let late: Promise<void> | undefined;
    await o.storage.transaction(() => {
      // Started and not awaited: it will want to write when the transaction is over.
      late = o.storage.table('notes').add(note(o, id, 'Zu spät'));
      return Promise.resolve();
    });
    expect(await codeOf(late ?? Promise.resolve())).toBe('failed');
    expect(await o.storage.table('notes').ofBusiness(id)).toEqual([]);
  });

  it('is refused for an event as well', async () => {
    const o = await open(new IDBFactory());
    const id = await business(o, 'Betrieb Muster');
    let late: Promise<void> | undefined;
    await o.storage.transaction(() => {
      late = o.storage.events.append({
        id: o.ids.next(),
        type: 'note.added',
        version: 1,
        businessId: id,
        actor: id,
        at: o.clock.now(),
        payload: {},
      });
      return Promise.resolve();
    });
    expect(await codeOf(late ?? Promise.resolve())).toBe('failed');
    expect(await o.storage.events.ofBusiness(id)).toEqual([]);
  });
});

describe('writing and reading at the same time', () => {
  it('does not mix up the calls of a transaction that run side by side', async () => {
    const o = await open(new IDBFactory());
    const id = await business(o, 'Betrieb Muster');
    const rows = Array.from({ length: 20 }, (_, index) => note(o, id, `Notiz ${String(index)}`));
    await o.storage.transaction(async () => {
      await Promise.all(rows.map((row) => o.storage.table('notes').add(row)));
      expect(await o.storage.table('notes').ofBusiness(id)).toHaveLength(20);
    });
    expect(await o.storage.table('notes').ofBusiness(id)).toHaveLength(20);
  });

  it('refuses the same row added twice at once inside a transaction', async () => {
    const o = await open(new IDBFactory());
    const id = await business(o, 'Betrieb Muster');
    const row = note(o, id, 'Doppelt');
    const results = await o.storage.transaction(() =>
      Promise.allSettled([o.storage.table('notes').add(row), o.storage.table('notes').add(row)]),
    );
    expect(results.map((result) => result.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(await o.storage.table('notes').ofBusiness(id)).toEqual([row]);
  });

  it('starts the next transaction after the write of the one before it', async () => {
    const factory = new IDBFactory();
    const a = await open(factory);
    const b = await open(factory);
    const id = await business(a, 'Betrieb Muster');
    const row = note(a, id, 'Eins');
    // Not awaited one by one: the second must see what the first wrote.
    const first = a.storage.transaction(() => a.storage.table('notes').add(row));
    const second = a.storage.transaction(async () => {
      const seen = await a.storage.table('notes').get(row.id);
      await a.storage.table('notes').put({ ...row, text: seen === undefined ? 'blind' : 'sah es' });
    });
    await Promise.all([first, second]);
    expect((await b.storage.table('notes').get(row.id))?.text).toBe('sah es');
  });
});

describe('purge', () => {
  it('removes one business with everything of it, in the same step as the rows it was just given', async () => {
    const o = await open(new IDBFactory());
    const mine = await business(o, 'Betrieb Muster');
    const theirs = await business(o, 'Betrieb Beispiel');
    const keep = note(o, theirs, 'Bleibt');
    await o.storage.table('notes').add(keep);
    await o.storage.table('notes').add(note(o, mine, 'Alt'));
    await o.storage.transaction(async () => {
      // Written and purged in one transaction: nothing of it may reach the database.
      await o.storage.table('notes').add(note(o, mine, 'Neu'));
      await o.storage.files.put({
        businessId: mine,
        bytes: bytesOf('Neu'),
        mediaType: 'text/plain',
      });
      await o.storage.purge(mine);
      expect(await o.storage.table('notes').ofBusiness(mine)).toEqual([]);
      expect(await o.storage.files.ofBusiness(mine)).toEqual([]);
      // And the business can be put back right after, with the same ids.
      await o.storage.businesses.add({
        id: mine,
        name: 'Betrieb Muster neu',
        createdAt: o.clock.now(),
        updatedAt: o.clock.now(),
      });
    });
    expect((await o.storage.businesses.get(mine))?.name).toBe('Betrieb Muster neu');
    expect(await o.storage.table('notes').ofBusiness(mine)).toEqual([]);
    expect(await o.storage.table('notes').ofBusiness(theirs)).toEqual([keep]);
    expect(await o.storage.files.ofBusiness(mine)).toEqual([]);
  });

  it('refuses nothing for what is no business', async () => {
    const o = await open(new IDBFactory());
    await o.storage.purge(undefined as unknown as Id);
    await o.storage.purge('no business' as Id);
    expect(await o.storage.businesses.all()).toEqual([]);
  });
});

describe('what only the browser can tell', () => {
  it('reads a row a second connection wrote into the database behind the storage', async () => {
    const factory = new IDBFactory();
    const o = await open(factory);
    const id = await business(o, 'Betrieb Muster');
    const holder = await rawOpen(factory);
    const row = note(o, id, 'Von aussen');
    await rawPut(holder, 'notes', row);
    holder.close();
    expect(await o.storage.table('notes').get(row.id)).toEqual(row);
  });
});

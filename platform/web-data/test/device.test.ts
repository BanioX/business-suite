import { IdSchema, type Id } from '@onestrand/core';
import { storageKeys, storageKeyProblems, parseRegister } from '@onestrand/testing';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  createBrowserClock,
  createBrowserDeviceStore,
  createBrowserIds,
  createMemoryDeviceStore,
  DEVICE_NAMES,
  deviceKey,
  requestPersistentStorage,
  WebDataError,
  type DeviceStore,
  type KeyValueStore,
} from '../src';
import { sequentialIds } from './support';

/** A storage of the browser that is a map, and a way to see what it holds. */
function fakeStore(): KeyValueStore & { entries: Map<string, string> } {
  const entries = new Map<string, string>();
  return {
    entries,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
    removeItem: (key) => {
      entries.delete(key);
    },
  };
}

describe('the key of a name on the device', () => {
  it('is the prefix of the edition and the name', () => {
    expect(deviceKey('sample:', 'business')).toBe('sample:business');
    expect(deviceKey('field-work:', 'mode:abc.def_1-2')).toBe('field-work:mode:abc.def_1-2');
  });

  it.each(['sample', 'Sample:', ':', 'sa mple:', '1sample:', 'sample::', ''])(
    'refuses the prefix %j: it is the id of an edition and a colon',
    (prefix) => {
      expect(() => deviceKey(prefix, 'business')).toThrow(RangeError);
    },
  );

  it.each(['', 'Business', 'a b', ':x', '-x', 'ä', 'a/b'])('refuses the name %j', (name) => {
    expect(() => deviceKey('sample:', name)).toThrow(RangeError);
  });

  it('is a key the test of the keys of an edition finds in the code and reads', () => {
    for (const [name, key] of [
      ['business', deviceKey('sample:', 'business')],
      ['mode:x', deviceKey('sample:', 'mode:x')],
    ] as const) {
      const code = `const key = '${deviceKey('sample:', name)}';`;
      expect([...storageKeys([{ path: 'a.ts', code }], 'sample').keys()]).toEqual([key]);
    }
  });

  it('is a key the register of side effects can list and the test of the keys then accepts', () => {
    const sources = [{ path: 'a.ts', code: `const key = '${deviceKey('sample:', 'business')}';` }];
    const register = [
      '| Kennung | Nebenwirkung | Im Code | Wo | Daten verlassen das Gerät? | Entscheid | Seit |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      '| SE-01 | Schlüssel des Geräts | `localStorage`, `sample:business` | Gerät | nein | ADR-0008 | geplant |',
    ].join('\n');
    expect(storageKeyProblems(sources, parseRegister(register), 'sample')).toEqual([]);
    expect(storageKeyProblems(sources, [], 'sample')).toHaveLength(1);
  });

  it('is a key for any name of the right form, and no other', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[a-z0-9][a-z0-9:._-]{0,30}$/), (name) => {
        expect(deviceKey('sample:', name)).toBe(`sample:${name}`);
      }),
    );
    fc.assert(
      fc.property(fc.string(), (name) => {
        fc.pre(!/^[a-z0-9][a-z0-9:._-]*$/.test(name));
        expect(() => deviceKey('sample:', name)).toThrow(RangeError);
      }),
    );
  });
});

describe('the names the platform keeps on a device', () => {
  const id: Id = IdSchema.parse(sequentialIds().next());

  it('are keys of the right form, one per business or person where it matters', () => {
    expect(deviceKey('sample:', DEVICE_NAMES.openBusiness)).toBe('sample:business');
    for (const name of [
      DEVICE_NAMES.actor(id),
      DEVICE_NAMES.deviceMode(id),
      DEVICE_NAMES.language(id),
    ]) {
      expect(() => deviceKey('sample:', name)).not.toThrow();
    }
    expect(
      new Set([DEVICE_NAMES.actor(id), DEVICE_NAMES.deviceMode(id), DEVICE_NAMES.language(id)])
        .size,
    ).toBe(3);
  });
});

describe.each<[string, () => { store: DeviceStore; entries?: Map<string, string> }]>([
  ['in memory', () => ({ store: createMemoryDeviceStore('sample:') })],
  [
    'on the storage of the browser',
    () => {
      const fake = fakeStore();
      return { store: createBrowserDeviceStore('sample:', fake), entries: fake.entries };
    },
  ],
])('the storage of the device %s', (_where, make) => {
  it('keeps text under names, in the namespace of the edition', () => {
    const { store, entries } = make();
    expect(store.prefix).toBe('sample:');
    expect(store.get('business')).toBeUndefined();
    store.set('business', 'abc');
    store.set('mode:x', 'counter');
    expect(store.get('business')).toBe('abc');
    expect(store.get('mode:x')).toBe('counter');
    expect(store.key('business')).toBe('sample:business');
    if (entries !== undefined) {
      expect([...entries].sort()).toEqual([
        ['sample:business', 'abc'],
        ['sample:mode:x', 'counter'],
      ]);
    }
  });

  it('replaces, and removes', () => {
    const { store } = make();
    store.set('business', 'one');
    store.set('business', 'two');
    expect(store.get('business')).toBe('two');
    store.remove('business');
    expect(store.get('business')).toBeUndefined();
    store.remove('business');
    expect(store.get('business')).toBeUndefined();
  });

  it('keeps the empty text: it is a value and not nothing', () => {
    const { store } = make();
    store.set('language:x', '');
    expect(store.get('language:x')).toBe('');
  });

  it('refuses a name of the wrong form, whatever it is asked to do', () => {
    const { store } = make();
    expect(() => store.get('Business')).toThrow(RangeError);
    expect(() => {
      store.set('a b', 'x');
    }).toThrow(RangeError);
    expect(() => {
      store.remove('');
    }).toThrow(RangeError);
    expect(() => store.key(':x')).toThrow(RangeError);
  });
});

describe('two editions on one storage of the browser', () => {
  it('never read each other', () => {
    const shared = fakeStore();
    const one = createBrowserDeviceStore('sample:', shared);
    const two = createBrowserDeviceStore('other:', shared);
    one.set('business', 'eins');
    expect(two.get('business')).toBeUndefined();
    two.set('business', 'zwei');
    expect(one.get('business')).toBe('eins');
    expect([...shared.entries.keys()].sort()).toEqual(['other:business', 'sample:business']);
  });
});

describe('the storage of the browser of the page', () => {
  it('is `localStorage` when none is given', () => {
    const shared = fakeStore();
    Object.defineProperty(globalThis, 'localStorage', { value: shared, configurable: true });
    try {
      createBrowserDeviceStore('sample:').set('business', 'abc');
      expect(shared.entries.get('sample:business')).toBe('abc');
    } finally {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });

  it('is said to be unavailable when the page has none, or may not reach it', () => {
    Object.defineProperty(globalThis, 'localStorage', { value: undefined, configurable: true });
    expect(() => createBrowserDeviceStore('sample:')).toThrow(WebDataError);
    expect(() => createBrowserDeviceStore('sample:')).toThrow(
      expect.objectContaining({ code: 'unavailable' }) as Error,
    );
    Object.defineProperty(globalThis, 'localStorage', {
      get: () => {
        throw new DOMException('denied', 'SecurityError');
      },
      configurable: true,
    });
    try {
      const failure: unknown = (() => {
        try {
          return createBrowserDeviceStore('sample:');
        } catch (error) {
          return error;
        }
      })();
      expect(failure).toMatchObject({ code: 'unavailable', cause: { name: 'SecurityError' } });
    } finally {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });
});

describe('the clock and the ids of the browser', () => {
  it('give the time as an ISO instant and the Swiss day as a calendar day', () => {
    const clock = createBrowserClock();
    expect(clock.now()).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
    expect(clock.today()).toMatch(/^\d{4}-\d\d-\d\d$/);
    expect(Math.abs(Date.parse(clock.now()) - Date.now())).toBeLessThan(5000);
  });

  it('make UUIDv7 from the random source they are given, and from the global one otherwise', () => {
    let calls = 0;
    const ids = createBrowserIds({
      getRandomValues: ((array: Uint8Array<ArrayBuffer>) => {
        calls += 1;
        return array.fill(7);
      }) as Crypto['getRandomValues'],
    });
    const first = ids.next();
    const second = ids.next();
    expect(IdSchema.safeParse(first).success).toBe(true);
    expect(calls).toBe(2);
    expect(first).not.toBe('');
    expect(second >= first).toBe(true);
    expect(IdSchema.safeParse(createBrowserIds().next()).success).toBe(true);
  });
});

describe('persistent storage', () => {
  const manager = (persisted: boolean | Error, persist: boolean | Error) => {
    const calls: string[] = [];
    return {
      calls,
      manager: {
        persisted: () => {
          calls.push('persisted');
          return persisted instanceof Error
            ? Promise.reject(persisted)
            : Promise.resolve(persisted);
        },
        persist: () => {
          calls.push('persist');
          return persist instanceof Error ? Promise.reject(persist) : Promise.resolve(persist);
        },
      },
    };
  };

  it('is not asked for again when the browser already keeps the data', async () => {
    const { manager: storage, calls } = manager(true, true);
    expect(await requestPersistentStorage(storage)).toBe(true);
    expect(calls).toEqual(['persisted']);
  });

  it('asks the browser, and tells what it answered', async () => {
    const granted = manager(false, true);
    expect(await requestPersistentStorage(granted.manager)).toBe(true);
    expect(granted.calls).toEqual(['persisted', 'persist']);
    expect(await requestPersistentStorage(manager(false, false).manager)).toBe(false);
  });

  it('never throws: without it the app still works', async () => {
    expect(await requestPersistentStorage(manager(new Error('no'), true).manager)).toBe(false);
    expect(await requestPersistentStorage(manager(false, new Error('no')).manager)).toBe(false);
    expect(await requestPersistentStorage(undefined)).toBe(false);
  });

  it('asks the storage manager of the page when none is given', async () => {
    const { manager: storage, calls } = manager(false, true);
    Object.defineProperty(globalThis, 'navigator', { value: { storage }, configurable: true });
    try {
      expect(await requestPersistentStorage()).toBe(true);
      expect(calls).toEqual(['persisted', 'persist']);
    } finally {
      Reflect.deleteProperty(globalThis, 'navigator');
    }
  });
});

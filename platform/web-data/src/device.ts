import type { Id } from '@onestrand/core';
import { WebDataError } from './errors';

/**
 * The storage of the device (suite debt TD-28): what belongs to this device and not to a
 * business, and never goes into a backup: which business is open, who acts on this device, the
 * mode of the device, the language of the app. It is a port with two implementations, one in
 * memory for tests and one on the storage of the browser.
 *
 * Every key starts with the prefix of the edition (`storagePrefix`, `<id>:`, ADR-0008, 2), so
 * two editions on one origin never read each other's keys, and so the test of side effects finds
 * every key an edition keeps (`storageKeys` of `@onestrand/testing`).
 */

/** `<id>:` with the id of an edition: lower-case letters and digits, hyphens allowed after the first. */
const PREFIX_PATTERN = /^[a-z][a-z0-9-]*:$/;

/** What follows the prefix: the form `storageKeys` of `@onestrand/testing` looks for. */
const NAME_PATTERN = /^[a-z0-9][a-z0-9:._-]*$/;

/**
 * The key of a name on the device: the prefix of the edition, then the name. Throws a
 * `RangeError` for a prefix or a name of another form, because a key that a test of the keys
 * cannot find is a key nobody has written down.
 */
export function deviceKey(prefix: string, name: string): string {
  if (!PREFIX_PATTERN.test(prefix)) {
    throw new RangeError(
      `The prefix of an edition is its id and a colon, in lower case: got ${JSON.stringify(prefix)}`,
    );
  }
  if (!NAME_PATTERN.test(name)) {
    throw new RangeError(
      `A name on the device is lower-case letters, digits and : . _ -, starting with a letter or a digit: got ${JSON.stringify(name)}`,
    );
  }
  return `${prefix}${name}`;
}

/** The names the platform keeps on a device. An edition may keep more, under names of its own. */
export const DEVICE_NAMES = {
  /** The business that is open on this device. */
  openBusiness: 'business',
  /** The person who acts on this device in a business. */
  actor: (businessId: Id): string => `actor:${businessId}`,
  /** The mode of this device in a business (the register of device modes decides what exists). */
  deviceMode: (businessId: Id): string => `mode:${businessId}`,
  /** The language of the app for a person on this device. */
  language: (personId: Id): string => `language:${personId}`,
} as const;

/** The port: text under names, on this device, in the namespace of one edition. */
export interface DeviceStore {
  /** The prefix of the edition, `<id>:`. */
  readonly prefix: string;
  /** The full key of a name (`deviceKey` with the prefix of this store). */
  key: (name: string) => string;
  get: (name: string) => string | undefined;
  set: (name: string, value: string) => void;
  remove: (name: string) => void;
}

/** The part of the storage of the browser this package uses; `localStorage` fits as it is. */
export interface KeyValueStore {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

function deviceStoreOn(prefix: string, store: KeyValueStore): DeviceStore {
  const key = (name: string): string => deviceKey(prefix, name);
  return {
    prefix,
    key,
    get: (name) => store.getItem(key(name)) ?? undefined,
    set: (name, value) => {
      store.setItem(key(name), value);
    },
    remove: (name) => {
      store.removeItem(key(name));
    },
  };
}

/** The storage of the device in memory: for tests, and for an app that is run without a browser. */
export function createMemoryDeviceStore(prefix: string): DeviceStore {
  const entries = new Map<string, string>();
  return deviceStoreOn(prefix, {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
    removeItem: (key) => {
      entries.delete(key);
    },
  });
}

/**
 * The storage of the device on the storage of the browser. `storage` is `localStorage` of the
 * page by default; it is a parameter so a test, a worker or another store can stand in. Throws a
 * `WebDataError` (`unavailable`) if the browser gives no such storage.
 *
 * What the browser throws when it is full or switched off is not caught here: the app decides
 * what to tell the person.
 */
export function createBrowserDeviceStore(prefix: string, storage?: KeyValueStore): DeviceStore {
  let store = storage;
  if (store === undefined) {
    try {
      store = typeof localStorage === 'undefined' ? undefined : localStorage;
    } catch (error) {
      // A page without the right to the storage of the browser throws when it is only named.
      throw new WebDataError('unavailable', 'The browser gives no storage for the device', {
        cause: error,
      });
    }
  }
  if (store === undefined) {
    throw new WebDataError('unavailable', 'The browser gives no storage for the device');
  }
  return deviceStoreOn(prefix, store);
}

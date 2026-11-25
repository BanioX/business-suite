import type { Business } from '@onestrand/business';
import {
  createWebCryptoHasher,
  type AnyTableRegistry,
  type Clock,
  type DigestCrypto,
  type Hasher,
  type IdGenerator,
} from '@onestrand/storage';
import type { ComposedEdition } from '@onestrand/manifest';
import { createBrowserClock, createBrowserIds } from './browser-ports';
import { createBrowserDeviceStore, type DeviceStore } from './device';
import {
  openIndexedDbStorage,
  type IndexedDbStorage,
  type RowMigration,
} from './indexeddb-storage';
import type { SchemaLedger } from './schema-ledger';

/** What `openEditionData` takes besides the edition. */
export interface OpenEditionOptions {
  /**
   * The schema ledger of the edition (its file in `editions/<id>/`). Its length is the version of
   * the database; it must lead exactly to the tables of the edition.
   */
  ledger: SchemaLedger;
  /** The storage of the device. Default: `localStorage` of the page, under the prefix of the edition. */
  device?: DeviceStore;
  /** Real time. Default: the clock of the browser. */
  clock?: Clock;
  /** New ids. Default: UUIDv7 from `crypto`. */
  ids?: IdGenerator;
  /** Checksums. Default: SHA-256 of `crypto`. */
  hasher?: Hasher;
  /** The WebCrypto object for the defaults above. Default: the global `crypto`. */
  crypto?: DigestCrypto & Pick<Crypto, 'getRandomValues'>;
  /** The factory of the browser. Default: the global `indexedDB`. */
  indexedDB?: IDBFactory;
  /** See `IndexedDbStorageOptions`. */
  onBlocked?: () => void;
  /** See `IndexedDbStorageOptions`. */
  onVersionChange?: () => void;
}

/**
 * What the app has once the data of an edition is open: the storage and, beside it, the ports
 * `startEdition` of `@onestrand/manifest` takes. Only `actor` is missing: who acts on this
 * device is a question of the business that is open (`DEVICE_NAMES.actor`).
 */
export interface EditionData {
  storage: IndexedDbStorage<AnyTableRegistry, Business>;
  device: DeviceStore;
  clock: Clock;
  ids: IdGenerator;
  hasher: Hasher;
}

/**
 * Opens the data of a composed edition on the device: the database is named by the edition
 * (`database`), holds the tables of `composed.tables`, follows the ledger, and runs the
 * migrations of the industries (each once, in the step of the ledger that names it). The keys on
 * the device carry the prefix of the edition (`storagePrefix`).
 *
 * ```ts
 * const data = await openEditionData(composed, { ledger });
 * const running = startEdition(composed, { ...data, actor });
 * ```
 */
export async function openEditionData(
  composed: ComposedEdition,
  options: OpenEditionOptions,
): Promise<EditionData> {
  const { edition } = composed;
  const webCrypto = options.crypto ?? crypto;
  const clock = options.clock ?? createBrowserClock();
  const ids = options.ids ?? createBrowserIds(webCrypto);
  const hasher = options.hasher ?? createWebCryptoHasher(webCrypto);
  const device = options.device ?? createBrowserDeviceStore(edition.storagePrefix);
  const migrations: RowMigration[] = composed.parts.flatMap((part) =>
    part.kind === 'industry' ? [...part.migrations] : [],
  );
  const storage = await openIndexedDbStorage<AnyTableRegistry, Business>({
    name: edition.database,
    tables: composed.tables,
    ledger: options.ledger,
    migrations,
    ports: { hasher, clock, ids },
    ...(options.indexedDB === undefined ? {} : { indexedDB: options.indexedDB }),
    ...(options.onBlocked === undefined ? {} : { onBlocked: options.onBlocked }),
    ...(options.onVersionChange === undefined ? {} : { onVersionChange: options.onVersionChange }),
  });
  return { storage, device, clock, ids, hasher };
}

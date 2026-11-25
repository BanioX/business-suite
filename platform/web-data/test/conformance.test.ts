import { createMemoryStorage } from '@onestrand/storage';
import { IDBFactory } from 'fake-indexeddb';
import { openIndexedDbStorage, proposeSchemaStep } from '../src';
import { storageConformance } from './conformance';
import type { MakeStorage } from './support';

/**
 * The cases the storage in memory is held to, run against the storage in memory itself (so the
 * suite is known to describe the reference) and against the adapter for IndexedDB. A case that
 * passes for one and fails for the other is a difference in behaviour, and the adapter is the one
 * that is wrong.
 */

const memory: MakeStorage = ({ registry, hasher, clock, ids }) =>
  Promise.resolve(createMemoryStorage(registry, { hasher, clock, ids }));

/** A database of its own for every storage: a new factory knows no database yet. */
const indexedDb: MakeStorage = async ({ registry, hasher, clock, ids }) => {
  const step = proposeSchemaStep({ ledger: [], tables: registry });
  return openIndexedDbStorage({
    name: 'conformance',
    tables: registry,
    ledger: step === undefined ? [] : [step],
    ports: { hasher, clock, ids },
    indexedDB: new IDBFactory(),
  });
};

storageConformance('storage in memory (the reference)', memory, { runs: 100 });
storageConformance('storage on IndexedDB', indexedDb, { runs: 15 });

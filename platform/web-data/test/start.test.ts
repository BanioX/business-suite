import { listBusinesses } from '@onestrand/business';
import {
  command,
  commandBase,
  createCommandKit,
  query,
  queryBase,
  type ContractFragment,
} from '@onestrand/contract';
import { nameSchema, syncFields } from '@onestrand/core';
import { alive, defineTable, type BusinessBase, type DigestCrypto } from '@onestrand/storage';
import { defineEdition, defineIndustry, composeEdition, startEdition } from '@onestrand/manifest';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  createMemoryDeviceStore,
  DEVICE_NAMES,
  openEditionData,
  proposeSchemaStep,
  schemaLedgerProblems,
  WebDataError,
  type SchemaLedger,
} from '../src';
import { fixedClock, hasher, sequentialIds } from './support';

/**
 * A made-up edition `sample` with one industry `alpha`, opened on the database of a fake browser:
 * the name and the prefix come from the edition, the tables from the composed register, the
 * migrations from the industry.
 */

const VisitSchema = z.object({
  ...syncFields,
  place: nameSchema(200),
  migrated: z.boolean().optional(),
});

const visitsTable = defineTable({
  name: 'alpha_visits',
  schema: VisitSchema,
  indexes: ['updatedAt'],
  sensitivity: 'normal',
  sync: 'single_writer',
});

const contract = {
  'alpha.visits.add': command({
    name: 'alpha.visits.add',
    summary: 'Records a visit at a place.',
    access: { feature: 'alpha.visits', level: 'operate' },
    input: z.object({ ...commandBase, place: nameSchema(200) }),
    output: z.object({ visit: VisitSchema }),
  }),
  'alpha.visits.list': query({
    name: 'alpha.visits.list',
    summary: 'Lists the visits of the business.',
    access: { feature: 'alpha.visits', level: 'view' },
    input: z.object({ ...queryBase }),
    output: z.object({ visits: z.array(VisitSchema) }),
  }),
} as const satisfies ContractFragment;

const alpha = defineIndustry({
  id: 'alpha',
  tables: [visitsTable],
  contract,
  useCases: ({ ctx }) => {
    const { emit, runCommand, stamps } = createCommandKit(ctx);
    const visits = ctx.storage.table(visitsTable);
    return {
      'alpha.visits.add': async (raw) => {
        const input = contract['alpha.visits.add'].input.parse(raw);
        return runCommand(contract['alpha.visits.add'], input, async () => {
          const visit = {
            id: ctx.ids.next(),
            businessId: input.businessId,
            place: input.place,
            ...stamps(),
          };
          await visits.add(visit);
          await emit(input.businessId, 'alpha_visit.recorded', { visitId: visit.id });
          return { visit };
        });
      },
      'alpha.visits.list': async (raw) => {
        const input = contract['alpha.visits.list'].input.parse(raw);
        return { visits: alive(await visits.ofBusiness(input.businessId)) };
      },
    };
  },
  catalog: {
    groups: [{ id: 'alpha.visits' }],
    features: [{ id: 'alpha.visits', group: 'alpha.visits' }],
  },
  events: ['alpha_visit.recorded'],
  migrations: [
    {
      id: 'alpha.visits_migrated',
      table: 'alpha_visits',
      upgrade: (row) => ({ ...row, migrated: true }),
    },
  ],
});

const edition = (id: string) =>
  composeEdition(
    defineEdition({
      id,
      database: id,
      storagePrefix: `${id}:`,
      backupFormat: `${id}-backup`,
      backupVersion: 1,
      title: 'Beispiel',
      industries: [alpha],
    }),
  );

const sample = edition('sample');

/** The ledger a device that never saw a migration has, and the one with the migration. */
const migrations = [{ id: 'alpha.visits_migrated', table: 'alpha_visits' }];
const tablesStep = proposeSchemaStep({ ledger: [], tables: sample.tables });
const LEDGER: SchemaLedger = [{ tables: tablesStep?.tables ?? [] }];
const MIGRATED: SchemaLedger = [...LEDGER, { migrations: ['alpha.visits_migrated'] }];

function ports() {
  return { clock: fixedClock(), ids: sequentialIds(5000), hasher };
}

describe('the ledger of the sample edition', () => {
  it('is what the register and the migrations of the edition lead to', () => {
    const next = proposeSchemaStep({ ledger: LEDGER, tables: sample.tables, migrations });
    expect(next).toEqual({ migrations: ['alpha.visits_migrated'] });
    expect(schemaLedgerProblems({ ledger: MIGRATED, tables: sample.tables, migrations })).toEqual(
      [],
    );
    expect(LEDGER[0]?.tables?.map((table) => table.name)).toEqual(['people', 'alpha_visits']);
  });
});

describe('opening the data of an edition', () => {
  it('names the database and the keys by the edition and holds the tables of the composed register', async () => {
    const factory = new IDBFactory();
    const device = createMemoryDeviceStore(sample.edition.storagePrefix);
    const data = await openEditionData(sample, {
      ledger: MIGRATED,
      indexedDB: factory,
      device,
      ...ports(),
    });
    expect((await factory.databases()).map((entry) => entry.name)).toEqual(['sample']);
    expect(data.storage.name).toBe('sample');
    expect(data.storage.version).toBe(2);
    expect(data.device.key('business')).toBe('sample:business');
    expect(() => data.storage.table('people')).not.toThrow();
    expect(() => data.storage.table('alpha_visits')).not.toThrow();
    expect(() => (data.storage.table as (name: string) => unknown)('notes')).toThrow(
      /Unknown table/,
    );
  });

  it('gives startEdition what it needs, and the edition runs on the database', async () => {
    const factory = new IDBFactory();
    const data = await openEditionData(sample, {
      ledger: MIGRATED,
      indexedDB: factory,
      device: createMemoryDeviceStore('sample:'),
      ...ports(),
    });
    const owner = data.ids.next();
    const running = startEdition(sample, { ...data, actor: owner });
    const call = (name: string, input: unknown) => {
      const useCase = running.useCases[name];
      if (useCase === undefined) {
        throw new Error(`No operation ${name}`);
      }
      return useCase(input);
    };
    const businessId = data.ids.next();
    await call('business.create', {
      commandId: data.ids.next(),
      businessId,
      name: 'Betrieb Muster',
      ownerName: 'Person Muster',
      features: [...sample.features.propose({ kinds: [] }).usual, 'alpha.visits'],
    });
    data.device.set(DEVICE_NAMES.openBusiness, businessId);
    data.device.set(DEVICE_NAMES.actor(businessId), owner);
    await call('alpha.visits.add', {
      commandId: data.ids.next(),
      businessId,
      place: 'Ort A',
    });
    data.storage.close();

    // The next start of the app: the same database, the same keys.
    const again = await openEditionData(sample, {
      ledger: MIGRATED,
      indexedDB: factory,
      device: data.device,
      ...ports(),
    });
    expect(await listBusinesses(again.storage)).toEqual([
      { id: businessId, name: 'Betrieb Muster' },
    ]);
    const openBusiness = again.device.get(DEVICE_NAMES.openBusiness);
    expect(openBusiness).toBe(businessId);
    const actor = again.device.get(DEVICE_NAMES.actor(businessId));
    const restarted = startEdition(sample, { ...again, actor: actor as typeof owner });
    const listed = (await restarted.useCases['alpha.visits.list']?.({ businessId })) as {
      visits: { place: string; migrated?: boolean }[];
    };
    expect(listed.visits.map((visit) => visit.place)).toEqual(['Ort A']);

    // The backup of the running edition goes through the database as well.
    const document = await restarted.backups.exportBackup(again.storage, businessId, {
      clock: again.clock,
    });
    expect(document.format).toBe('sample-backup');
    expect(document.counts).toMatchObject({ people: 1, alpha_visits: 1 });
  });

  it('runs the migrations of the industries once, in the step of the ledger that names them', async () => {
    const factory = new IDBFactory();
    const first = await openEditionData(sample, {
      ledger: LEDGER,
      indexedDB: factory,
      device: createMemoryDeviceStore('sample:'),
      ...ports(),
    });
    const businessId = first.ids.next();
    const now = first.clock.now();
    await first.storage.businesses.add({
      id: businessId,
      name: 'Betrieb Muster',
      createdAt: now,
      updatedAt: now,
    } as BusinessBase as never);
    await first.storage.table('alpha_visits').add({
      id: first.ids.next(),
      businessId,
      place: 'Ort A',
      createdAt: now,
      updatedAt: now,
    } as never);
    first.storage.close();

    const second = await openEditionData(sample, {
      ledger: MIGRATED,
      indexedDB: factory,
      device: createMemoryDeviceStore('sample:'),
      ...ports(),
    });
    const rows = await second.storage.table('alpha_visits').ofBusiness(businessId);
    expect(rows).toEqual([expect.objectContaining({ place: 'Ort A', migrated: true })]);
    expect(second.storage.version).toBe(2);
  });

  it('keeps two editions on one origin apart: each has its database and its keys', async () => {
    const factory = new IDBFactory();
    const other = edition('other');
    const one = await openEditionData(sample, {
      ledger: LEDGER,
      indexedDB: factory,
      device: createMemoryDeviceStore('sample:'),
      ...ports(),
    });
    const two = await openEditionData(other, {
      ledger: LEDGER,
      indexedDB: factory,
      device: createMemoryDeviceStore('other:'),
      ...ports(),
    });
    expect((await factory.databases()).map((entry) => entry.name).sort()).toEqual([
      'other',
      'sample',
    ]);
    expect(one.device.key('business')).toBe('sample:business');
    expect(two.device.key('business')).toBe('other:business');
  });

  it('refuses a ledger that does not lead to the tables of the edition, and opens nothing', async () => {
    const factory = new IDBFactory();
    const failure: unknown = await openEditionData(sample, {
      ledger: [{ tables: [{ name: 'people' }] }],
      indexedDB: factory,
      device: createMemoryDeviceStore('sample:'),
      ...ports(),
    }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(WebDataError);
    expect(failure).toMatchObject({ code: 'invalid_ledger' });
    expect(await factory.databases()).toEqual([]);
  });

  it('takes the browser for everything it is not given: its storage, its WebCrypto, its clock and ids', async () => {
    const factory = new IDBFactory();
    const kept = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => kept.get(key) ?? null,
        setItem: (key: string, value: string) => {
          kept.set(key, value);
        },
        removeItem: (key: string) => {
          kept.delete(key);
        },
      },
      configurable: true,
    });
    try {
      const data = await openEditionData(sample, { ledger: LEDGER, indexedDB: factory });
      data.device.set('business', 'x');
      expect([...kept.keys()]).toEqual(['sample:business']);
      expect(data.clock.now()).toMatch(/^\d{4}-\d\d-\d\dT/);
      expect(data.ids.next()).toMatch(/^[0-9a-f-]{36}$/);
      expect(await data.hasher.sha256(new Uint8Array())).toHaveLength(64);
      data.storage.close();
    } finally {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });

  it('takes a WebCrypto object that is handed in', async () => {
    const calls: string[] = [];
    const crypto: DigestCrypto & Pick<Crypto, 'getRandomValues'> = {
      subtle: {
        digest: (algorithm: 'SHA-256', data: Uint8Array<ArrayBuffer>) => {
          calls.push(`digest ${String(data.length)}`);
          return globalThis.crypto.subtle.digest(algorithm, data);
        },
      },
      getRandomValues: ((array: Uint8Array<ArrayBuffer>) => {
        calls.push('random');
        return globalThis.crypto.getRandomValues(array);
      }) as Crypto['getRandomValues'],
    };
    const data = await openEditionData(sample, {
      ledger: LEDGER,
      indexedDB: new IDBFactory(),
      device: createMemoryDeviceStore('sample:'),
      crypto,
    });
    data.ids.next();
    await data.hasher.sha256(Uint8Array.of(1, 2, 3));
    expect(calls).toEqual(['random', 'digest 3']);
  });
});

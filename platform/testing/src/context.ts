// Origin: BanioX/Randen packages/core/src/testing/index.ts @ e0f0907 — adapted: only the test context, without the sample data of the trade and without use cases; the storage is built for a table register; the seed is one business and two person ids; further businesses on the same storage get their own range of ids
import type { CommandContext, DomainEvent, IdGenerator } from '@onestrand/contract';
import type { Id } from '@onestrand/core';
import {
  BusinessBaseSchema,
  createMemoryStorage,
  type AnyTableRegistry,
  type BusinessBase,
  type FileMeta,
  type Hasher,
  type ModuleStorage,
  type Storage,
  type StoredRow,
} from '@onestrand/storage';
import { fixedClock, type TestClock } from './clock';
import { sequentialIds } from './ids';
import { testHasher } from './sha256';

/** The made-up businesses of the seed, in the order they are added to a storage. */
const BUSINESS_NAMES = ['Betrieb Muster', 'Betrieb Beispiel'] as const;

/**
 * How far apart the ids of two businesses on one storage start. A test never makes that many
 * ids, so the ranges of two businesses never meet.
 */
const ID_RANGE = 1_000_000;

/** What a storage holds for one business, in a form two snapshots can be compared in. */
export interface BusinessSnapshot {
  /** The row of the business, or undefined if the storage does not hold it. */
  business: unknown;
  /** The rows of every table of the register, soft-deleted ones included, sorted by id. */
  tables: Record<string, StoredRow[]>;
  /** Every file with its bytes as plain numbers, sorted by id. */
  files: { meta: FileMeta; bytes: number[] }[];
  /** The events in the order they were appended. */
  events: DomainEvent[];
}

const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * Everything a storage holds for one business: its row, the rows of every table of the
 * register, its files and its events. Two snapshots compare with `toEqual`, so «the other
 * business is untouched» and «the restored business equals the saved one» are one line each.
 *
 * The command log is not part of it: its port finds an entry by the id of its command and
 * cannot list the entries of a business.
 */
export async function businessSnapshot(
  storage: ModuleStorage & { businesses: { get: (id: Id) => Promise<unknown> } },
  registry: AnyTableRegistry,
  businessId: Id,
): Promise<BusinessSnapshot> {
  const tables: Record<string, StoredRow[]> = {};
  for (const table of registry.tables) {
    tables[table.name] = (await storage.table(table).ofBusiness(businessId)).sort(byId);
  }
  const files: BusinessSnapshot['files'] = [];
  for (const meta of (await storage.files.ofBusiness(businessId)).sort(byId)) {
    const file = await storage.files.get(meta.id);
    files.push({ meta, bytes: Array.from(file?.bytes ?? []) });
  }
  return {
    business: await storage.businesses.get(businessId),
    tables,
    files,
    events: await storage.events.ofBusiness(businessId),
  };
}

/** What `createTestContext` takes. Only the register is required. */
export interface TestContextOptions<
  TRegistry extends AnyTableRegistry,
  TBusiness extends BusinessBase = BusinessBase,
> {
  /** The tables the storage holds: the register of the package, industry or edition under test. */
  registry: TRegistry;
  /**
   * The storage to seed. Default: a fresh storage in memory. Pass an adapter under test here to
   * run the same tests against it; its files get their ids and times from its own ports.
   */
  storage?: Storage<TRegistry, TBusiness>;
  /** The clock of the device. Default: a fixed clock at `today`. */
  clock?: TestClock;
  /** The calendar day a new clock starts at, `YYYY-MM-DD`. Default 14.11.2026. Not with `clock`. */
  today?: string;
  /** The number of the first id. Default 1; the business gets it. */
  idStart?: number;
  /** The name of the business. Default «Betrieb Muster». */
  name?: string;
  /** Computes the checksums of a new storage in memory. Default `testHasher`. */
  hasher?: Hasher;
  /**
   * Completes the row of the business where the storage holds a fuller model than the base
   * (name and time stamps): `(base) => ({ ...base, currency: 'CHF' })`.
   */
  business?: (base: BusinessBase) => TBusiness;
}

/** A seeded business on a storage, with everything a test of use cases needs. */
export interface TestContext<
  TRegistry extends AnyTableRegistry = AnyTableRegistry,
  TBusiness extends BusinessBase = BusinessBase,
> {
  /** What a use case gets: storage, clock, ids, and the owner as the person acting. */
  ctx: CommandContext;
  storage: Storage<TRegistry, TBusiness>;
  registry: TRegistry;
  /** The clock of the device; every business on the same storage shares it. */
  clock: TestClock;
  /** The counting ids of this business. */
  ids: IdGenerator;
  hasher: Hasher;
  /** The row of the business as it was stored. */
  business: TBusiness;
  businessId: Id;
  /** The id of the person who owns the business. Only the id: no row of a person is stored. */
  ownerId: Id;
  /** The id of a second person of the business, for tests of who may do what. */
  secondPersonId: Id;
  /** The person acting in `ctx`: the owner. */
  actor: Id;
  /** A fresh command id. */
  cmd: () => Id;
  /** The same context with another person acting. */
  actingAs: (personId: Id) => CommandContext;
  /** Everything the storage holds for this business (`businessSnapshot`). */
  snapshot: () => Promise<BusinessSnapshot>;
  /**
   * A further business on the same storage and the same clock, with its own two persons and
   * its own range of ids: the second is «Betrieb Beispiel». For tests of separation: what one
   * business does must never show in the other.
   */
  addBusiness: (options?: { name?: string }) => Promise<TestContext<TRegistry, TBusiness>>;
}

/** What the businesses of one storage share. */
interface Device<TRegistry extends AnyTableRegistry, TBusiness extends BusinessBase> {
  registry: TRegistry;
  storage: Storage<TRegistry, TBusiness>;
  clock: TestClock;
  hasher: Hasher;
  idStart: number;
  complete: (base: BusinessBase) => TBusiness;
  /** The number of the next business: 0 for the first. Taken before anything is awaited. */
  next: number;
}

async function seedBusiness<TRegistry extends AnyTableRegistry, TBusiness extends BusinessBase>(
  device: Device<TRegistry, TBusiness>,
  ids: IdGenerator,
  name: string,
): Promise<TestContext<TRegistry, TBusiness>> {
  const { registry, storage, clock, hasher } = device;
  const now = clock.now();
  const businessId = ids.next();
  const ownerId = ids.next();
  const secondPersonId = ids.next();
  const business = device.complete(
    BusinessBaseSchema.parse({ id: businessId, name, createdAt: now, updatedAt: now }),
  );
  await storage.businesses.add(business);

  const ctx: CommandContext = { storage, clock, ids, actor: ownerId };
  return {
    ctx,
    storage,
    registry,
    clock,
    ids,
    hasher,
    business,
    businessId,
    ownerId,
    secondPersonId,
    actor: ownerId,
    cmd: () => ids.next(),
    actingAs: (personId) => ({ ...ctx, actor: personId }),
    snapshot: () => businessSnapshot(storage, registry, businessId),
    addBusiness: (options = {}) => {
      // Taken at once, so two businesses added side by side never share a range of ids.
      const index = device.next;
      device.next += 1;
      return seedBusiness(
        device,
        sequentialIds(device.idStart + index * ID_RANGE),
        options.name ?? BUSINESS_NAMES[index] ?? `Betrieb ${String(index + 1)}`,
      );
    },
  };
}

/**
 * A storage with one made-up business, a fixed clock and counting ids: the lean seed every test
 * of use cases starts from. The business is «Betrieb Muster»; it has an owner and a second
 * person, both as ids only. The first three ids are the business, the owner and the second
 * person, in this order.
 *
 * The storage is a fresh one in memory for the given register, unless one is passed in. A
 * second business on the same storage comes from `addBusiness()` of the result.
 */
export function createTestContext<TRegistry extends AnyTableRegistry>(
  options: Omit<TestContextOptions<TRegistry>, 'business'>,
): Promise<TestContext<TRegistry>>;
/** The same for a storage whose businesses carry more than the base: `business` completes the row. */
export function createTestContext<
  TRegistry extends AnyTableRegistry,
  TBusiness extends BusinessBase,
>(
  options: TestContextOptions<TRegistry, TBusiness> & {
    business: (base: BusinessBase) => TBusiness;
  },
): Promise<TestContext<TRegistry, TBusiness>>;
export async function createTestContext<
  TRegistry extends AnyTableRegistry,
  TBusiness extends BusinessBase,
>(options: TestContextOptions<TRegistry, TBusiness>): Promise<TestContext<TRegistry, TBusiness>> {
  if (options.clock !== undefined && options.today !== undefined) {
    throw new TypeError('Pass either a clock or the day a new clock starts at, not both');
  }
  const clock = options.clock ?? fixedClock(options.today);
  const idStart = options.idStart ?? 1;
  const ids = sequentialIds(idStart);
  const hasher = options.hasher ?? testHasher;
  return seedBusiness(
    {
      registry: options.registry,
      storage: options.storage ?? createMemoryStorage(options.registry, { hasher, clock, ids }),
      clock,
      hasher,
      idStart,
      // Without `business` the first signature applies, and there the business is the base.
      complete: options.business ?? ((base) => base as TBusiness),
      next: 1,
    },
    ids,
    options.name ?? BUSINESS_NAMES[0],
  );
}

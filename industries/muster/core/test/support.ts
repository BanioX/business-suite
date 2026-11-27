import { OWNER_PROFILE, type Profile } from '@onestrand/access';
import { BusinessSchema, type Business, type Person } from '@onestrand/business';
import { CommandError } from '@onestrand/contract';
import type { Id } from '@onestrand/core';
import {
  composeEdition,
  defineEdition,
  startEdition,
  type ComposedEdition,
  type EditionInput,
  type Industry,
  type IndustryInput,
  type RunningEdition,
} from '@onestrand/manifest';
import type { BusinessBase } from '@onestrand/storage';
import { createTestContext, type TestContext } from '@onestrand/testing';
import { muster } from '../src';
import { musterMessages } from './messages';

/**
 * The edition every test of `muster` runs on: the business module of the platform and `muster`,
 * nothing else, under the names `pnpm check:industry` gives such an edition (`<id>`, `<id>:`,
 * `<id>-backup`, version 1). Nothing here is a real edition: it exists for the tests only.
 */
export function musterEditionInput(changes: Partial<EditionInput> = {}): EditionInput {
  return {
    id: 'muster',
    database: 'muster',
    storagePrefix: 'muster:',
    backupFormat: 'muster-backup',
    backupVersion: 1,
    title: 'Muster',
    industries: [muster],
    texts: [musterMessages],
    ...changes,
  };
}

export const composed: ComposedEdition = composeEdition(defineEdition(musterEditionInput()));

/**
 * The declaration of an industry as `defineIndustry` takes it, read back from a manifest: so a
 * test can change one part of `muster` on a copy and leave `muster` as it is.
 */
export function inputOf(industry: Industry): IndustryInput<Industry['contract']> {
  return {
    id: industry.id,
    tables: industry.tables,
    contract: industry.contract,
    useCases: industry.useCases,
    catalog: industry.catalog,
    rights: industry.rights,
    events: industry.events,
    templates: industry.templates,
    ruleSets: industry.ruleSets,
    ...(industry.demo === undefined ? {} : { demo: industry.demo }),
    migrations: industry.migrations,
  };
}

export type World = TestContext<ComposedEdition['tables'], Business>;

/** A profile with some levels and rights, no owner. */
export function custom(
  levels: Record<string, 'view' | 'operate' | 'manage'> = {},
  rights: string[] = [],
): Profile {
  return { type: 'custom', levels, rights };
}

/** Writes a person of the business with a profile (the page of the people comes with W1). */
export async function putPerson(
  world: World,
  id: Id,
  name: string,
  profile: Profile,
): Promise<void> {
  const now = world.clock.now();
  const person: Person = {
    id,
    businessId: world.businessId,
    name,
    profile,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  await world.storage.table('people').put(person);
}

/** Gives the second person of the business another profile. */
export function setProfile(world: World, personId: Id, profile: Profile): Promise<void> {
  return putPerson(world, personId, 'Person Beispiel', profile);
}

/**
 * A storage with «Betrieb Muster», its owner «Person Muster» and a second person with the
 * profile given, and the function of `muster` switched on by the owner.
 */
export async function seed(
  edition: ComposedEdition = composed,
  second: Profile = custom(),
): Promise<{ world: World; owner: RunningEdition }> {
  const world = await createTestContext({
    registry: edition.tables,
    business: (base: BusinessBase) => BusinessSchema.parse(base),
  });
  await putPerson(world, world.ownerId, 'Person Muster', OWNER_PROFILE);
  await setProfile(world, world.secondPersonId, second);
  const owner = startFor(world, world.ownerId, edition);
  await call(owner, 'business.features.switch', {
    commandId: world.cmd(),
    businessId: world.businessId,
    featureId: 'muster.entries',
    on: true,
  });
  return { world, owner };
}

/** The edition started on the storage of the world, for one person acting. */
export function startFor(world: World, actor: Id, edition: ComposedEdition = composed) {
  return startEdition(edition, {
    storage: world.storage,
    clock: world.clock,
    ids: world.ids,
    hasher: world.hasher,
    actor,
  });
}

/** Calls an operation of a started edition by its name. */
export function call(running: RunningEdition, name: string, input: unknown): Promise<unknown> {
  const useCase = running.useCases[name];
  if (useCase === undefined) {
    throw new Error(`The edition has no operation ${name}`);
  }
  return useCase(input);
}

/** The code of the `CommandError` a call is refused with; undefined if it went through. */
export async function codeOf(pending: Promise<unknown>): Promise<string | undefined> {
  try {
    await pending;
    return undefined;
  } catch (error) {
    return error instanceof CommandError ? error.code : String(error);
  }
}

/** Records an entry as the person of the running edition. */
export function addEntry(
  running: RunningEdition,
  world: World,
  title: string,
  on: string = world.clock.today(),
): Promise<unknown> {
  return call(running, 'muster.entries.add', {
    commandId: world.cmd(),
    businessId: world.businessId,
    on,
    title,
  });
}

/** The titles of the journal as the person of the running edition reads it. */
export async function titles(running: RunningEdition, world: World): Promise<string[]> {
  const listed = (await call(running, 'muster.entries.list', { businessId: world.businessId })) as {
    entries: { title: string }[];
  };
  return listed.entries.map((entry) => entry.title);
}

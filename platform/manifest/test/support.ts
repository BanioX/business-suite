import { OWNER_PROFILE, type Profile } from '@onestrand/access';
import { BusinessSchema, type Business, type Person } from '@onestrand/business';
import {
  CommandError,
  command,
  commandBase,
  createCommandKit,
  query,
  queryBase,
  type ContractFragment,
} from '@onestrand/contract';
import { IdSchema, nameSchema, syncFields, type Id } from '@onestrand/core';
import { alive, defineTable, requireRow, type BusinessBase } from '@onestrand/storage';
import { createTestContext, type TestContext } from '@onestrand/testing';
import { z } from 'zod';
import {
  defineEdition,
  defineIndustry,
  defineModule,
  startEdition,
  type ComposedEdition,
  type Edition,
  type EditionInput,
  type Industry,
  type Module,
  type RunningEdition,
  type UseCaseEnvironment,
} from '../src';

/**
 * A made-up world for the tests of this package: one module of the platform (`notes`) and two
 * industries (`alpha` and `beta`), none of them real. `alpha` has one table, two operations and
 * one function, which is all an industry needs to dock; `beta` exists to be a neighbour.
 */

/* ----------------------------------------------------------------------------------------- */
/* The module `notes`                                                                         */
/* ----------------------------------------------------------------------------------------- */

export const NoteSchema = z.object({
  ...syncFields,
  text: nameSchema(200),
});
export type Note = z.infer<typeof NoteSchema>;

export const notesTable = defineTable({
  name: 'notes',
  schema: NoteSchema,
  indexes: ['updatedAt'],
  sensitivity: 'internal',
  sync: 'single_writer',
});

export const notesContract = {
  'notes.add': command({
    name: 'notes.add',
    summary: 'Adds a note to the business.',
    access: { feature: 'notes', level: 'operate' },
    input: z.object({ ...commandBase, text: nameSchema(200) }),
    output: z.object({ note: NoteSchema }),
  }),
  'notes.list': query({
    name: 'notes.list',
    summary: 'Lists the notes of the business.',
    access: { feature: 'notes', level: 'view' },
    input: z.object({ ...queryBase }),
    output: z.object({ notes: z.array(NoteSchema) }),
  }),
  'notes.remove': command({
    name: 'notes.remove',
    summary: 'Removes a note of the business.',
    access: { feature: 'notes', level: 'manage', rights: ['export_delete'] },
    input: z.object({ ...commandBase, noteId: IdSchema }),
    output: z.object({}),
  }),
} as const satisfies ContractFragment;

export const notesModule = defineModule({
  id: 'notes',
  tables: [notesTable],
  contract: notesContract,
  useCases: ({ ctx }) => {
    const { emit, runCommand, stamps } = createCommandKit(ctx);
    const notes = ctx.storage.table(notesTable);
    return {
      'notes.add': async (raw) => {
        const input = notesContract['notes.add'].input.parse(raw);
        return runCommand(notesContract['notes.add'], input, async () => {
          const note = {
            id: ctx.ids.next(),
            businessId: input.businessId,
            text: input.text,
            ...stamps(),
          };
          await notes.add(note);
          await emit(input.businessId, 'note.added', { noteId: note.id });
          return { note };
        });
      },
      'notes.list': async (raw) => {
        const input = notesContract['notes.list'].input.parse(raw);
        return { notes: alive(await notes.ofBusiness(input.businessId)) };
      },
      'notes.remove': async (raw) => {
        const input = notesContract['notes.remove'].input.parse(raw);
        return runCommand(notesContract['notes.remove'], input, async () => {
          const note = await requireRow(notes, input.businessId, input.noteId, 'Note');
          await notes.put({ ...note, deletedAt: ctx.clock.now(), updatedAt: ctx.clock.now() });
          await emit(input.businessId, 'note.removed', { noteId: note.id });
          return {};
        });
      },
    };
  },
  catalog: {
    groups: [{ id: 'notes' }],
    features: [{ id: 'notes', group: 'notes' }],
  },
  rights: { rights: [{ id: 'export_delete' }] },
  events: ['note.added', 'note.removed'],
});

export const notesTexts = {
  modules: { notes: { name: 'Notizen', summary: 'Kurze Texte zum Betrieb festhalten.' } },
  features: { notes: { name: 'Notizen', summary: 'Du hältst Notizen zum Betrieb fest.' } },
  rights: {
    export_delete: {
      name: 'Exportieren und löschen',
      summary: 'Du darfst Daten ausgeben und entfernen.',
    },
  },
};

/* ----------------------------------------------------------------------------------------- */
/* The industry `alpha`                                                                       */
/* ----------------------------------------------------------------------------------------- */

export const VisitSchema = z.object({ ...syncFields, place: nameSchema(200) });
export type Visit = z.infer<typeof VisitSchema>;

export const alphaVisitsTable = defineTable({
  name: 'alpha_visits',
  schema: VisitSchema,
  indexes: ['updatedAt'],
  sensitivity: 'normal',
  sync: 'single_writer',
});

export const alphaContract = {
  'alpha.visits.add': command({
    name: 'alpha.visits.add',
    summary: 'Records a visit at a place.',
    access: { feature: 'alpha.visits', level: 'operate', rights: ['alpha.access_notes'] },
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

/** What `alpha` declares, so a test can change one part of it. */
export function alphaInput() {
  return {
    id: 'alpha',
    tables: [alphaVisitsTable],
    contract: alphaContract,
    useCases: ({ ctx }: UseCaseEnvironment) => {
      const { emit, runCommand, stamps } = createCommandKit(ctx);
      const visits = ctx.storage.table(alphaVisitsTable);
      return {
        'alpha.visits.add': async (raw: unknown) => {
          const input = alphaContract['alpha.visits.add'].input.parse(raw);
          return runCommand(alphaContract['alpha.visits.add'], input, async () => {
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
        'alpha.visits.list': async (raw: unknown) => {
          const input = alphaContract['alpha.visits.list'].input.parse(raw);
          return { visits: alive(await visits.ofBusiness(input.businessId)) };
        },
      };
    },
    catalog: {
      groups: [{ id: 'alpha.visits' }],
      features: [
        {
          id: 'alpha.visits',
          group: 'alpha.visits',
          requires: ['notes'],
          options: [{ key: 'pin', type: 'boolean', default: false }],
        },
      ],
      kinds: [{ id: 'alpha.standard', on: ['notes', 'alpha.visits'] }],
      questions: [
        {
          id: 'alpha.pass',
          answers: [{ id: 'yes', enable: ['alpha.visits'] }, { id: 'no' }],
        },
      ],
      deviceModes: [{ id: 'alpha.counter', feature: 'alpha.visits' }],
    },
    rights: { rights: [{ id: 'alpha.access_notes' }] },
    events: ['alpha_visit.recorded'],
    templates: [{ id: 'alpha.round', kind: 'checklist', data: { steps: ['door', 'window'] } }],
    ruleSets: [
      {
        id: 'alpha.limits',
        source: 'docs/fakten/alpha-limits.md',
        data: { maxVisitsPerDay: 8 },
      },
    ],
    demo: { businessName: 'Betrieb Muster', ownerName: 'Person Muster', kinds: ['alpha.standard'] },
    migrations: [
      {
        id: 'alpha.visits_place',
        table: 'alpha_visits',
        upgrade: (row: Readonly<Record<string, unknown>>) => ({ ...row }),
      },
    ],
  } as const;
}

export const alphaIndustry: Industry = defineIndustry(alphaInput());

export const alphaTexts = {
  modules: { 'alpha.visits': { name: 'Besuche', summary: 'Besuche an einem Ort festhalten.' } },
  features: {
    'alpha.visits': { name: 'Besuche', summary: 'Du hältst fest, wo ein Besuch stattfand.' },
  },
  options: { 'alpha.visits': { pin: 'PIN am gemeinsamen Gerät' } },
  kinds: { 'alpha.standard': 'Standard' },
  questions: {
    'alpha.pass': { text: 'Machst du Besuche?', answers: { yes: 'Ja', no: 'Nein' } },
  },
  deviceModes: { 'alpha.counter': 'Theke' },
  rights: {
    'alpha.access_notes': {
      name: 'Zugangshinweise',
      summary: 'Du siehst und schreibst Hinweise zum Zugang.',
    },
  },
};

/* ----------------------------------------------------------------------------------------- */
/* The industry `beta`, a neighbour with its own names                                        */
/* ----------------------------------------------------------------------------------------- */

export const betaContract = {
  'beta.rounds.list': query({
    name: 'beta.rounds.list',
    summary: 'Lists the rounds of the business.',
    access: { feature: 'beta.rounds', level: 'view' },
    input: z.object({ ...queryBase }),
    output: z.object({ rounds: z.array(z.string()) }),
  }),
} as const satisfies ContractFragment;

export const betaIndustry: Industry = defineIndustry({
  id: 'beta',
  tables: [],
  contract: betaContract,
  useCases: () => ({ 'beta.rounds.list': () => Promise.resolve({ rounds: [] }) }),
  catalog: {
    groups: [{ id: 'beta.rounds' }],
    features: [{ id: 'beta.rounds', group: 'beta.rounds' }],
  },
});

export const betaTexts = {
  modules: { 'beta.rounds': { name: 'Runden', summary: 'Runden planen.' } },
  features: { 'beta.rounds': { name: 'Runden', summary: 'Du planst Runden.' } },
};

/* ----------------------------------------------------------------------------------------- */
/* Editions                                                                                   */
/* ----------------------------------------------------------------------------------------- */

/** The input of an edition called `sample`, with the notes module and the industries given. */
export function sampleInput(
  industries: readonly Industry[] = [alphaIndustry],
  changes: Partial<EditionInput> = {},
): EditionInput {
  return {
    id: 'sample',
    database: 'sample',
    storagePrefix: 'sample:',
    backupFormat: 'sample-backup',
    backupVersion: 1,
    title: 'Beispiel',
    modules: [notesModule],
    industries,
    texts: [notesTexts, alphaTexts, betaTexts],
    ...changes,
  };
}

export function sampleEdition(
  industries: readonly Industry[] = [alphaIndustry],
  changes: Partial<EditionInput> = {},
): Edition {
  return defineEdition(sampleInput(industries, changes));
}

/** The edition with `modules` and `industries` replaced, for the tests that break something. */
export function editionOf(modules: readonly Module[], industries: readonly Industry[]): Edition {
  return defineEdition(sampleInput(industries, { modules }));
}

/* ----------------------------------------------------------------------------------------- */
/* A started edition on a storage in memory                                                   */
/* ----------------------------------------------------------------------------------------- */

export type World = TestContext<ComposedEdition['tables'], Business>;

export function personRow(
  world: Pick<World, 'businessId' | 'clock'>,
  id: Id,
  name: string,
  profile: Profile,
): Person {
  const now = world.clock.now();
  return {
    id,
    businessId: world.businessId,
    name,
    profile,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}

/** A profile with some levels and rights, no owner. */
export function custom(
  levels: Record<string, 'view' | 'operate' | 'manage'> = {},
  rights: string[] = [],
): Profile {
  return { type: 'custom', levels, rights };
}

/**
 * A storage for the edition with the business `Betrieb Muster` and two people: the owner, and a
 * second person with the profile given (default: may only look at notes).
 */
export async function seed(
  composed: ComposedEdition,
  second: Profile = custom({ notes: 'view' }),
): Promise<World> {
  const world = await createTestContext({
    registry: composed.tables,
    business: (base: BusinessBase) => BusinessSchema.parse(base),
  });
  await addPeople(world, second);
  return world;
}

export async function addPeople(world: World, second: Profile): Promise<void> {
  const people = world.storage.table('people');
  await people.put(personRow(world, world.ownerId, 'Person Muster', OWNER_PROFILE));
  await people.put(personRow(world, world.secondPersonId, 'Person Beispiel', second));
}

/** Gives a person of the business another profile. */
export async function setProfile(world: World, personId: Id, profile: Profile): Promise<void> {
  await world.storage.table('people').put(personRow(world, personId, 'Person Beispiel', profile));
}

/** The edition started on the storage of the world, for one person acting. */
export function startFor(composed: ComposedEdition, world: World, actor: Id = world.ownerId) {
  return startEdition(composed, {
    storage: world.storage,
    clock: world.clock,
    ids: world.ids,
    hasher: world.hasher,
    actor,
  });
}

/** A copy of a record without one field: what a manifest looks like when it was left out. */
export function without<TRecord extends object, TKey extends keyof TRecord>(
  record: TRecord,
  key: TKey,
): Omit<TRecord, TKey> {
  const copy = { ...record };
  Reflect.deleteProperty(copy, key);
  return copy;
}

/** Calls an operation of a started edition by its name. */
export function call(running: RunningEdition, name: string, input: unknown): Promise<unknown> {
  const useCase = running.useCases[name];
  if (useCase === undefined) {
    throw new Error(`The edition has no operation ${name}`);
  }
  return useCase(input);
}

/** What a refused call throws. */
export async function codeOf(call: Promise<unknown>): Promise<string | undefined> {
  try {
    await call;
    return undefined;
  } catch (error) {
    return error instanceof CommandError ? error.code : String(error);
  }
}

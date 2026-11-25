import { BusinessSchema, listBusinesses, type Business } from '@onestrand/business';
import {
  ComposeError,
  command,
  commandBase,
  composeContract,
  query,
  queryBase,
  type ContractFragment,
} from '@onestrand/contract';
import {
  createBackupKit,
  createMemoryStorage,
  type AnyTableRegistry,
  type BackupDocument,
} from '@onestrand/storage';
import { testHasher, fixedClock, sequentialIds, businessSnapshot } from '@onestrand/testing';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  EditionError,
  businessModule,
  composeEdition,
  defineIndustry,
  defineModule,
  editionProblems,
  startEdition,
  type EditionProblem,
  type Module,
} from '../src';
import {
  addPeople,
  alphaContract,
  alphaIndustry,
  alphaVisitsTable,
  betaContract,
  betaIndustry,
  call,
  codeOf,
  custom,
  editionOf,
  notesContract,
  notesModule,
  sampleEdition,
  sampleInput,
  seed,
  setProfile,
  startFor,
} from './support';

const brief = (problems: readonly EditionProblem[]) =>
  problems.map((problem) => `${problem.part} ${problem.code} ${problem.id}`);

/** A module of the platform for a test that breaks something: no use cases unless it is given some. */
function stubModule(
  id: string,
  parts: {
    tables?: Module['tables'];
    contract?: ContractFragment;
    catalog?: Module['catalog'];
    rights?: Module['rights'];
    events?: readonly string[];
    useCases?: Module['useCases'];
  } = {},
): Module {
  return defineModule({
    id,
    tables: parts.tables ?? [],
    contract: parts.contract ?? {},
    // The type of the use cases follows the contract; a stub brings none and the check says so.
    useCases: parts.useCases ?? (() => ({})),
    catalog: parts.catalog ?? {},
    ...(parts.rights === undefined ? {} : { rights: parts.rights }),
    ...(parts.events === undefined ? {} : { events: parts.events }),
  });
}

/** Use cases that answer every operation of a contract with nothing, so only the thing under test is wrong. */
const answersAll =
  (contract: ContractFragment): Module['useCases'] =>
  () =>
    Object.fromEntries(Object.keys(contract).map((name) => [name, () => Promise.resolve({})]));

describe('composeEdition', () => {
  const composed = composeEdition(sampleEdition([alphaIndustry, betaIndustry]));

  it('puts the business module first, then the modules, then the industries', () => {
    expect(composed.parts.map((part) => `${part.kind} ${part.id}`)).toEqual([
      'module business',
      'module notes',
      'industry alpha',
      'industry beta',
    ]);
  });

  it('builds the register of tables from every part', () => {
    expect(composed.tables.names).toEqual(['people', 'notes', 'alpha_visits']);
  });

  it('builds the register of functions with the industries as namespaces', () => {
    expect(composed.features.industries.map((industry) => industry.id)).toEqual(['alpha', 'beta']);
    expect(composed.features.ids).toEqual(['business', 'notes', 'alpha.visits', 'beta.rounds']);
    expect(composed.features.get('alpha.visits').requires).toEqual(['notes']);
    expect(composed.features.kinds.map((kind) => kind.id)).toEqual(['alpha.standard']);
    expect(composed.features.deviceModesFor(['alpha.visits'])).toEqual(['normal', 'alpha.counter']);
  });

  it('builds the register of delicate rights, each industry entering its own', () => {
    expect(composed.rights.ids).toEqual([
      'people_roles',
      'settings',
      'export_delete',
      'alpha.access_notes',
    ]);
  });

  it('builds the contract and knows who owns each operation', () => {
    expect(Object.keys(composed.contract)).toEqual([
      ...Object.keys(businessModule.contract),
      ...Object.keys(notesContract),
      ...Object.keys(alphaContract),
      ...Object.keys(betaContract),
    ]);
    expect(composed.owners['business.create']).toBe('business');
    expect(composed.owners['notes.add']).toBe('notes');
    expect(composed.owners['alpha.visits.add']).toBe('alpha');
    expect(composed.owners['beta.rounds.list']).toBe('beta');
    expect(composed.contract['alpha.visits.add']).toBe(alphaContract['alpha.visits.add']);
  });

  it('builds the catalogue of the app: the texts of the platform with those of the industries over them', () => {
    const catalogue = composed.catalogue as Record<string, Record<string, Record<string, unknown>>>;
    expect(catalogue.features?.['alpha.visits']?.name).toBe('Besuche');
    expect(catalogue.features?.business).toBeDefined();
    expect(composed.catalogues.forLanguage('de-CH')).toEqual(composed.catalogue);
  });

  it('answers in the languages of the edition and falls back to de-CH where a text is missing', () => {
    const portuguese = composeEdition(
      sampleEdition([alphaIndustry], {
        translations: { pt: { features: { 'alpha.visits': { name: 'Visitas' } } } },
      }),
    );
    const pt = portuguese.catalogues.forLanguage('pt') as typeof composed.catalogue &
      Record<string, Record<string, Record<string, unknown>>>;
    expect(pt.features?.['alpha.visits']?.name).toBe('Visitas');
    expect(pt.features?.['alpha.visits']?.summary).toBe('Du hältst fest, wo ein Besuch stattfand.');
    expect(portuguese.catalogues.languages.tags).toEqual(['de-CH', 'pt']);
  });

  it('builds the lexicon from the words of the industries', () => {
    const named = composeEdition(
      sampleEdition([alphaIndustry], {
        lexicon: {
          industries: [
            {
              industry: 'alpha',
              terms: { object: { 'de-CH': { one: 'Standort', many: 'Standorte' } } },
            },
          ],
        },
      }),
    );
    expect(named.lexicon.forLanguage('de-CH').many('object')).toBe('Standorte');
    expect(composed.lexicon.forLanguage('de-CH').many('object')).toBe('Objekte');
  });

  it('holds everything frozen', () => {
    expect(Object.isFrozen(composed)).toBe(true);
    expect(Object.isFrozen(composed.parts)).toBe(true);
    expect(Object.isFrozen(composed.contract)).toBe(true);
    expect(Object.isFrozen(composed.owners)).toBe(true);
  });

  it('is the same edition every time', () => {
    const again = composeEdition(sampleEdition([alphaIndustry, betaIndustry]));
    expect(Object.keys(again.contract)).toEqual(Object.keys(composed.contract));
    expect(again.tables.names).toEqual(composed.tables.names);
    expect(again.features.ids).toEqual(composed.features.ids);
  });
});

describe('an industry docks without a file of the platform naming it', () => {
  it('adds one table, two operations and one function by being listed, and nothing else changes', () => {
    const without = composeEdition(sampleEdition([]));
    const withAlpha = composeEdition(sampleEdition([alphaIndustry]));

    expect(withAlpha.tables.names.filter((name) => !without.tables.names.includes(name))).toEqual([
      'alpha_visits',
    ]);
    expect(
      Object.keys(withAlpha.contract).filter((name) => !Object.hasOwn(without.contract, name)),
    ).toEqual(['alpha.visits.add', 'alpha.visits.list']);
    expect(withAlpha.features.ids.filter((id) => !without.features.ids.includes(id))).toEqual([
      'alpha.visits',
    ]);
    expect(withAlpha.rights.ids.filter((id) => !without.rights.ids.includes(id))).toEqual([
      'alpha.access_notes',
    ]);
    // What was there stays as it was.
    for (const name of without.tables.names) {
      expect(withAlpha.tables.get(name).schema).toBe(without.tables.get(name).schema);
      expect(withAlpha.tables.get(name).indexes).toEqual(without.tables.get(name).indexes);
    }
    for (const name of Object.keys(without.contract)) {
      expect(withAlpha.contract[name]).toBe(without.contract[name]);
    }
    // Everything that came belongs to the industry.
    expect(withAlpha.owners['alpha.visits.add']).toBe('alpha');
    expect(editionProblems(sampleEdition([alphaIndustry]))).toEqual([]);
  });

  it('shows in the listing of the edition and nowhere else: the industry is the one list that grows', () => {
    const input = sampleInput([alphaIndustry]);
    expect(Object.keys(input).filter((key) => key !== 'texts')).toEqual([
      'id',
      'database',
      'storagePrefix',
      'backupFormat',
      'backupVersion',
      'title',
      'modules',
      'industries',
    ]);
    expect(input.industries).toEqual([alphaIndustry]);
  });
});

describe('editionProblems', () => {
  it('finds nothing in an edition that fits together', () => {
    expect(editionProblems(sampleEdition([alphaIndustry]))).toEqual([]);
    expect(editionProblems(sampleEdition([alphaIndustry, betaIndustry]))).toEqual([]);
    expect(editionProblems(sampleEdition([], { modules: [] }))).toEqual([]);
  });

  describe('operations', () => {
    const alsoAdd = {
      'notes.add': command({
        name: 'notes.add',
        summary: 'Adds a note, the other way.',
        access: { feature: 'dup', level: 'operate' },
        input: z.object({ ...commandBase }),
        output: z.object({}),
      }),
    } as const satisfies ContractFragment;
    const duplicate = stubModule('dup', {
      contract: alsoAdd,
      catalog: { groups: [{ id: 'dup' }], features: [{ id: 'dup', group: 'dup' }] },
      useCases: answersAll(alsoAdd),
    });

    it('fails when two parts bring the same operation, and names both owners', () => {
      const edition = editionOf([notesModule, duplicate], []);
      expect(brief(editionProblems(edition))).toContain('contract duplicate_operation notes.add');
      expect(() => composeEdition(edition)).toThrow(EditionError);
      try {
        composeEdition(edition);
        expect.unreachable('the edition was put together');
      } catch (error) {
        expect((error as EditionError).code).toBe('duplicate_operation');
        const problem = (error as EditionError).problems.find(
          (found) => found.code === 'duplicate_operation',
        );
        expect(problem?.message).toContain('"notes"');
        expect(problem?.message).toContain('"dup"');
      }
    });

    it('fails when two industries bring the same operation: the composer of the contract refuses', () => {
      // An industry cannot even declare it (its operations carry its own name), so two parts of
      // the contract that did would meet at the composer.
      expect(() =>
        composeContract([
          { source: 'alpha', fragment: alphaContract },
          { source: 'beta', fragment: alphaContract },
        ]),
      ).toThrow(ComposeError);
      expect(() =>
        defineIndustry({
          id: 'beta',
          tables: [],
          contract: alphaContract,
          useCases: answersAll(alphaContract) as never,
          catalog: {},
        }),
      ).toThrow(expect.objectContaining({ code: 'wrong_namespace' }));
    });

    it('fails when an industry brings an operation of a module of the platform', () => {
      expect(() =>
        defineIndustry({
          id: 'gamma',
          tables: [],
          contract: notesContract,
          useCases: answersAll(notesContract) as never,
          catalog: {},
        }),
      ).toThrow(expect.objectContaining({ code: 'wrong_namespace' }));
    });

    it('names the schemas of an operation that cannot be a JSON schema', () => {
      const bad = {
        'dated.stamp': command({
          name: 'dated.stamp',
          summary: 'Stamps.',
          access: { feature: 'dated', level: 'operate' },
          input: z.object({ ...commandBase, at: z.date() }),
          output: z.object({}),
        }),
      } as const satisfies ContractFragment;
      const dated = stubModule('dated', {
        contract: bad,
        catalog: { groups: [{ id: 'dated' }], features: [{ id: 'dated', group: 'dated' }] },
        useCases: answersAll(bad),
      });
      // The texts of the stub are not the point here.
      const problems = editionProblems(editionOf([dated], [])).filter(
        (problem) => problem.part !== 'texts',
      );
      expect(brief(problems)).toEqual(['schemas invalid_schema dated.stamp']);
      expect(problems[0]?.message).toContain('input');
      // It is a matter of the conformity tests: the edition can still be put together.
      expect(() => composeEdition(editionOf([dated], []))).not.toThrow();
    });
  });

  describe('access', () => {
    const asks = (feature: string, rights?: string[]) => ({
      'ask.run': query({
        name: 'ask.run',
        summary: 'Runs.',
        access: { feature, level: 'view', ...(rights === undefined ? {} : { rights }) },
        input: z.object({ ...queryBase }),
        output: z.object({}),
      }),
    });

    it('finds a function in access that nobody entered: the operation would be refused for everyone', () => {
      const contract = asks('ghost');
      const ask = stubModule('ask', { contract, useCases: answersAll(contract) });
      expect(brief(editionProblems(editionOf([ask], [])))).toEqual([
        'access access.feature ask.run',
      ]);
      expect(() => composeEdition(editionOf([ask], []))).toThrow(
        expect.objectContaining({ code: 'access.feature' }),
      );
    });

    it('finds a right in access that nobody entered', () => {
      const contract = asks('notes', ['wages']);
      const ask = stubModule('ask', { contract, useCases: answersAll(contract) });
      expect(brief(editionProblems(editionOf([notesModule, ask], [])))).toEqual([
        'access access.rights ask.run',
      ]);
    });

    it('finds an industry that asks for what belongs to another industry', () => {
      const contract = {
        'gamma.peek': query({
          name: 'gamma.peek',
          summary: 'Peeks.',
          access: { feature: 'alpha.visits', level: 'view', rights: ['alpha.access_notes'] },
          input: z.object({ ...queryBase }),
          output: z.object({}),
        }),
      } as const satisfies ContractFragment;
      const gamma = defineIndustry({
        id: 'gamma',
        tables: [],
        contract,
        useCases: answersAll(contract) as never,
        catalog: {},
      });
      const problems = editionProblems(editionOf([notesModule], [alphaIndustry, gamma]));
      expect(brief(problems)).toEqual([
        'access foreign_dependency gamma.peek',
        'access foreign_dependency gamma.peek',
      ]);
      expect(problems[0]?.message).toContain('"alpha"');
    });
  });

  describe('tables, functions and rights', () => {
    it('finds a table that two parts bring, and names both', () => {
      const same = stubModule('same', { tables: notesModule.tables });
      const problems = editionProblems(editionOf([notesModule, same], []));
      expect(brief(problems)).toEqual(['tables duplicate_table notes']);
      expect(problems[0]?.message).toContain('"notes" and from "same"');
    });

    it('finds a reference no function answers, and a function twice', () => {
      const lonely = stubModule('lonely', {
        catalog: {
          groups: [{ id: 'lonely' }],
          features: [{ id: 'lonely', group: 'lonely', requires: ['ghost'] }],
        },
      });
      expect(brief(editionProblems(editionOf([lonely], [])))).toEqual([
        'features unknown_reference lonely',
      ]);
      const twice = stubModule('twice', {
        catalog: { groups: [{ id: 'notes' }], features: [{ id: 'notes', group: 'notes' }] },
      });
      expect(brief(editionProblems(editionOf([notesModule, twice], [])))).toEqual([
        'features duplicate_id notes',
        'features duplicate_id notes',
      ]);
    });

    it('does not mind the order of the modules: a reference is answered by any part', () => {
      const needs = stubModule('needs', {
        catalog: {
          groups: [{ id: 'needs' }],
          features: [{ id: 'needs', group: 'needs', requires: ['notes'] }],
        },
      });
      const problems = editionProblems(editionOf([needs, notesModule], []));
      expect(problems.filter((problem) => problem.part !== 'texts')).toEqual([]);
    });

    it('finds a right twice, and an industry that is not entered', () => {
      const twice = stubModule('twice', { rights: { rights: [{ id: 'export_delete' }] } });
      expect(brief(editionProblems(editionOf([notesModule, twice], [])))).toEqual([
        'rights duplicate_id export_delete',
      ]);
    });
  });

  describe('namespaces', () => {
    it('finds a module that uses the namespace of an industry', () => {
      const contract = {
        'alpha.sneak': query({
          name: 'alpha.sneak',
          summary: 'Sneaks.',
          access: { feature: 'sneak', level: 'view' },
          input: z.object({ ...queryBase }),
          output: z.object({}),
        }),
      } as const satisfies ContractFragment;
      const sneak = stubModule('sneak', {
        contract,
        events: ['alpha_thing.done'],
        catalog: { groups: [{ id: 'sneak' }], features: [{ id: 'sneak', group: 'sneak' }] },
        useCases: answersAll(contract),
      });
      const problems = editionProblems(editionOf([sneak], [alphaIndustry]));
      expect(brief(problems.filter((problem) => problem.part === 'namespaces'))).toEqual([
        'namespaces namespace_taken alpha.sneak',
        'namespaces namespace_taken alpha_thing.done',
      ]);
    });

    it('finds a module with a table that starts with the name of an industry', () => {
      const [alphaTable] = alphaIndustry.tables;
      const sneak = stubModule('sneak', { tables: alphaTable === undefined ? [] : [alphaTable] });
      const problems = editionProblems(editionOf([sneak], [betaIndustry, alphaIndustry]));
      expect(brief(problems)).toContain('namespaces namespace_taken alpha_visits');
      expect(brief(problems)).toContain('tables duplicate_table alpha_visits');
    });
  });

  describe('use cases', () => {
    it('finds an operation without a use case, and a use case without an operation', () => {
      const partial = stubModule('partial', {
        contract: notesContract,
        tables: notesModule.tables,
        catalog: notesModule.catalog,
        rights: notesModule.rights,
        useCases: () => ({
          'notes.add': () => Promise.resolve({}),
          'notes.zap': () => Promise.resolve({}),
        }),
      });
      const problems = editionProblems(editionOf([partial], []));
      expect(brief(problems)).toEqual([
        'use_cases missing_use_case notes.list',
        'use_cases missing_use_case notes.remove',
        'use_cases extra_use_case notes.zap',
      ]);
    });

    it('finds a part that needs the world to build its use cases', () => {
      const eager = stubModule('eager', {
        useCases: ({ ctx }: { ctx: { ids: { next: () => unknown } } }) => {
          ctx.ids.next();
          return {};
        },
      });
      const problems = editionProblems(editionOf([eager], []));
      expect(brief(problems)).toEqual(['use_cases use_cases_failed eager']);
      expect(problems[0]?.message).toContain('id generator is not there');
    });

    it('does not run any use case while it checks', () => {
      const calls: string[] = [];
      const contract = {
        'spy.run': query({
          name: 'spy.run',
          summary: 'Runs.',
          access: { feature: 'spy', level: 'view' },
          input: z.object({ ...queryBase }),
          output: z.object({}),
        }),
      } as const satisfies ContractFragment;
      const spy = stubModule('spy', {
        contract,
        catalog: { groups: [{ id: 'spy' }], features: [{ id: 'spy', group: 'spy' }] },
        useCases: () => ({
          'spy.run': () => {
            calls.push('run');
            return Promise.resolve({});
          },
        }),
      });
      // Only the texts of the stub are missing; its use cases were built, never called.
      expect(editionProblems(editionOf([spy], [])).map((problem) => problem.part)).toEqual([
        'texts',
        'texts',
        'texts',
        'texts',
      ]);
      expect(calls).toEqual([]);
    });
  });

  describe('texts and words', () => {
    it('lists every text the registers ask for and the catalogue lacks', () => {
      const problems = editionProblems(sampleEdition([alphaIndustry], { texts: [notesTexts()] }));
      const paths = problems.map((problem) => problem.id);
      expect(problems.every((problem) => problem.code === 'missing_text')).toBe(true);
      expect(paths).toEqual(
        expect.arrayContaining([
          'modules.alpha.visits.name',
          'features.alpha.visits.summary',
          'options.alpha.visits.pin',
          'kinds.alpha.standard',
          'questions.alpha.pass.text',
          'questions.alpha.pass.answers.yes',
          'deviceModes.alpha.counter',
          'rights.alpha.access_notes.name',
        ]),
      );
      // The edition can be put together: the catalogue falls back to de-CH.
      expect(() =>
        composeEdition(sampleEdition([alphaIndustry], { texts: [notesTexts()] })),
      ).not.toThrow();
    });

    it('finds the texts of a module the catalogue does not carry', () => {
      const problems = editionProblems(sampleEdition([], { texts: [] }));
      expect(brief(problems)).toEqual([
        'texts missing_text modules.notes.name',
        'texts missing_text modules.notes.summary',
        'texts missing_text features.notes.name',
        'texts missing_text features.notes.summary',
        'texts missing_text rights.export_delete.name',
        'texts missing_text rights.export_delete.summary',
      ]);
    });

    it('finds two industries that call a term differently, and the edition resolves it', () => {
      const terms = (industry: string, one: string) => ({
        industry,
        terms: { object: { 'de-CH': { one, many: `${one}e` } } },
      });
      const conflict = sampleEdition([alphaIndustry, betaIndustry], {
        lexicon: { industries: [terms('alpha', 'Standort'), terms('beta', 'Anlage')] },
      });
      expect(brief(editionProblems(conflict))).toEqual(['lexicon conflict beta:object']);
      expect(() => composeEdition(conflict)).toThrow(expect.objectContaining({ code: 'conflict' }));
      const settled = sampleEdition([alphaIndustry, betaIndustry], {
        lexicon: {
          industries: [terms('alpha', 'Standort'), terms('beta', 'Anlage')],
          edition: { object: { 'de-CH': { one: 'Ort', many: 'Orte' } } },
        },
      });
      expect(editionProblems(settled)).toEqual([]);
    });
  });

  it('puts the business module twice as a duplicate part', () => {
    const edition = editionOf([businessModule], [alphaIndustry]);
    expect(brief(editionProblems(edition)).filter((line) => line.startsWith('parts'))).toEqual([
      'parts duplicate_part business',
    ]);
    expect(() => composeEdition(edition)).toThrow(
      expect.objectContaining({ code: 'duplicate_part' }),
    );
  });

  it('lists the problems of every area at once', () => {
    const lonely = stubModule('lonely', {
      catalog: {
        groups: [{ id: 'lonely' }],
        features: [{ id: 'lonely', group: 'lonely', requires: ['ghost'] }],
      },
    });
    const sameTable = stubModule('same_table', { tables: notesModule.tables });
    const problems = editionProblems(
      sampleEdition([alphaIndustry], { modules: [notesModule, lonely, sameTable] }),
    );
    expect(new Set(problems.map((problem) => problem.part))).toEqual(
      new Set(['tables', 'features']),
    );
  });
});

function notesTexts() {
  return {
    modules: { notes: { name: 'Notizen', summary: 'Kurze Texte zum Betrieb festhalten.' } },
    features: { notes: { name: 'Notizen', summary: 'Du hältst Notizen zum Betrieb fest.' } },
    rights: {
      export_delete: { name: 'Exportieren und löschen', summary: 'Du darfst Daten ausgeben.' },
    },
  };
}

/* ----------------------------------------------------------------------------------------- */
/* Started on a storage                                                                       */
/* ----------------------------------------------------------------------------------------- */

describe('startEdition', () => {
  const composed = composeEdition(sampleEdition([alphaIndustry]));

  /** The owner starts the edition and switches on the functions the test needs. */
  async function owned(second = custom({ notes: 'view' })) {
    const world = await seed(composed, second);
    const owner = startFor(composed, world);
    await call(owner, 'business.features.switch', {
      commandId: world.cmd(),
      businessId: world.businessId,
      featureId: 'alpha.visits',
      on: true,
    });
    return { world, owner };
  }

  const visit = (world: { cmd: () => string; businessId: string }, place = 'Ort A') => ({
    commandId: world.cmd(),
    businessId: world.businessId,
    place,
  });

  it('runs the operations of every part behind one guard', async () => {
    const { world, owner } = await owned();
    const added = (await call(owner, 'alpha.visits.add', visit(world))) as {
      visit: { place: string };
    };
    expect(added.visit.place).toBe('Ort A');
    const note = (await call(owner, 'notes.add', {
      commandId: world.cmd(),
      businessId: world.businessId,
      text: 'Schlüssel beim Empfang',
    })) as { note: { text: string } };
    expect(note.note.text).toBe('Schlüssel beim Empfang');
    const listed = (await call(owner, 'alpha.visits.list', {
      businessId: world.businessId,
    })) as { visits: unknown[] };
    expect(listed.visits).toHaveLength(1);
    const business = (await call(owner, 'business.get', { businessId: world.businessId })) as {
      business: { name: string; features: string[] };
    };
    expect(business.business.name).toBe('Betrieb Muster');
    expect(business.business.features).toEqual(['business', 'notes', 'alpha.visits']);
    expect(Object.keys(owner.useCases)).toEqual(Object.keys(composed.contract));
  });

  it('refuses an operation whose right the person lacks, and the use case does not run', async () => {
    const { world } = await owned();
    const clerk = custom({ notes: 'manage', 'alpha.visits': 'operate' }, []);
    await setProfile(world, world.secondPersonId, clerk);
    const second = startFor(composed, world, world.secondPersonId);
    const owner = startFor(composed, world);
    const note = (await call(owner, 'notes.add', {
      commandId: world.cmd(),
      businessId: world.businessId,
      text: 'Eine Notiz',
    })) as { note: { id: string } };

    // The level is there, the right is not.
    const refused = call(second, 'notes.remove', {
      commandId: world.cmd(),
      businessId: world.businessId,
      noteId: note.note.id,
    });
    expect(await codeOf(refused)).toBe('forbidden');
    await expect(refused).rejects.toThrow('export_delete');
    expect(
      (
        (await call(owner, 'notes.list', { businessId: world.businessId })) as {
          notes: unknown[];
        }
      ).notes,
    ).toHaveLength(1);
    // The right of an industry is asked the same way.
    expect(await codeOf(call(second, 'alpha.visits.add', visit(world)))).toBe('forbidden');

    // With the right the same call goes through.
    const withRight = custom({ notes: 'manage', 'alpha.visits': 'operate' }, [
      'export_delete',
      'alpha.access_notes',
    ]);
    await setProfile(world, world.secondPersonId, withRight);
    expect(
      await codeOf(
        call(second, 'notes.remove', {
          commandId: world.cmd(),
          businessId: world.businessId,
          noteId: note.note.id,
        }),
      ),
    ).toBeUndefined();
    expect(await codeOf(call(second, 'alpha.visits.add', visit(world)))).toBeUndefined();
  });

  it('refuses everything to a person the device does not know, and a business it does not know', async () => {
    const { world } = await owned();
    const stranger = startFor(composed, world, world.ids.next());
    expect(
      await codeOf(call(stranger, 'alpha.visits.list', { businessId: world.businessId })),
    ).toBe('forbidden');
    const owner = startFor(composed, world);
    expect(await codeOf(call(owner, 'alpha.visits.list', { businessId: world.ids.next() }))).toBe(
      'forbidden',
    );
    expect(await codeOf(call(owner, 'alpha.visits.list', {}))).toBe('invalid');
  });

  describe('a function that is switched off', () => {
    it('has no way in, and its data stays; switched on again, it is all there', async () => {
      const { world, owner } = await owned();
      await call(owner, 'alpha.visits.add', visit(world, 'Ort A'));
      await call(owner, 'alpha.visits.add', visit(world, 'Ort B'));
      const rows = () => world.storage.table(alphaVisitsTable).ofBusiness(world.businessId);
      expect(await rows()).toHaveLength(2);

      const off = (await call(owner, 'business.features.switch', {
        commandId: world.cmd(),
        businessId: world.businessId,
        featureId: 'alpha.visits',
        on: false,
      })) as { turnedOff: string[] };
      expect(off.turnedOff).toEqual(['alpha.visits']);

      // No way in: not even for the owner, not for a query, not for a command.
      expect(await codeOf(call(owner, 'alpha.visits.add', visit(world)))).toBe('forbidden');
      expect(await codeOf(call(owner, 'alpha.visits.list', { businessId: world.businessId }))).toBe(
        'forbidden',
      );
      await expect(
        call(owner, 'alpha.visits.list', { businessId: world.businessId }),
      ).rejects.toThrow('switched off');
      // The other functions go on.
      expect(
        await codeOf(call(owner, 'notes.list', { businessId: world.businessId })),
      ).toBeUndefined();

      // The data stays: in the storage and in the backup.
      expect(await rows()).toHaveLength(2);
      const document = await owner.backups.exportBackup(world.storage, world.businessId, {
        clock: world.clock,
      });
      expect(document.tables.alpha_visits).toHaveLength(2);
      const checked = await owner.backups.checkBackup(JSON.parse(JSON.stringify(document)));
      expect(checked.preview.problems).toEqual([]);

      await call(owner, 'business.features.switch', {
        commandId: world.cmd(),
        businessId: world.businessId,
        featureId: 'alpha.visits',
        on: true,
      });
      const back = (await call(owner, 'alpha.visits.list', {
        businessId: world.businessId,
      })) as { visits: { place: string }[] };
      expect(back.visits.map((row) => row.place).sort()).toEqual(['Ort A', 'Ort B']);
    });
  });

  describe('two businesses on one storage', () => {
    it('stay apart through the composed edition', async () => {
      const { world, owner } = await owned();
      const other = await world.addBusiness();
      await addPeople(other, custom());
      const otherOwner = startFor(composed, other, other.ownerId);
      await call(otherOwner, 'business.features.switch', {
        commandId: other.cmd(),
        businessId: other.businessId,
        featureId: 'alpha.visits',
        on: true,
      });
      const before = await businessSnapshot(other.storage, composed.tables, other.businessId);

      await call(owner, 'alpha.visits.add', visit(world, 'Ort A'));
      await call(owner, 'notes.add', {
        commandId: world.cmd(),
        businessId: world.businessId,
        text: 'Nur für Betrieb Muster',
      });

      // The other business is untouched: rows, files and events.
      expect(await businessSnapshot(other.storage, composed.tables, other.businessId)).toEqual(
        before,
      );
      expect(
        (
          (await call(otherOwner, 'alpha.visits.list', {
            businessId: other.businessId,
          })) as { visits: unknown[] }
        ).visits,
      ).toEqual([]);

      // The person of one business has no way into the other, whatever they ask for.
      expect(await codeOf(call(owner, 'alpha.visits.list', { businessId: other.businessId }))).toBe(
        'forbidden',
      );
      expect(
        await codeOf(call(otherOwner, 'alpha.visits.list', { businessId: world.businessId })),
      ).toBe('forbidden');
      expect(await listBusinesses(world.storage)).toEqual([
        { id: other.businessId, name: 'Betrieb Beispiel' },
        { id: world.businessId, name: 'Betrieb Muster' },
      ]);
    });
  });

  it('creates a business on an empty device and keeps it apart from the next', async () => {
    const ports = { hasher: testHasher, clock: fixedClock(), ids: sequentialIds(5000) };
    const storage = createMemoryStorage<AnyTableRegistry, Business>(composed.tables, ports);
    const start = (actor: ReturnType<typeof ports.ids.next>) =>
      startEdition(composed, { storage, ...ports, actor });
    const [firstOwner, secondOwner] = [ports.ids.next(), ports.ids.next()];
    const first = start(firstOwner);
    const businessId = ports.ids.next();
    await call(first, 'business.create', {
      commandId: ports.ids.next(),
      businessId,
      name: 'Betrieb Muster',
      ownerName: 'Person Muster',
      features: composed.features.propose({ kinds: [] }).usual,
    });
    const second = start(secondOwner);
    const otherId = ports.ids.next();
    await call(second, 'business.create', {
      commandId: ports.ids.next(),
      businessId: otherId,
      name: 'Betrieb Beispiel',
      ownerName: 'Person Beispiel',
    });
    expect((await listBusinesses(storage)).map((listing) => listing.name)).toEqual([
      'Betrieb Beispiel',
      'Betrieb Muster',
    ]);
    // The owner of the second business cannot touch the first.
    expect(await codeOf(call(second, 'business.get', { businessId }))).toBe('forbidden');
    expect(await codeOf(call(first, 'business.get', { businessId }))).toBeUndefined();
  });

  describe('the backup of the edition', () => {
    it('is written in the format and version of the edition and comes back whole', async () => {
      const { world, owner } = await owned();
      await call(owner, 'alpha.visits.add', visit(world, 'Ort A'));
      await call(owner, 'notes.add', {
        commandId: world.cmd(),
        businessId: world.businessId,
        text: 'Eine Notiz',
      });
      expect(owner.backups.format).toBe('sample-backup');
      expect(owner.backups.version).toBe(1);
      expect(owner.backups.tables).toEqual(['people', 'notes', 'alpha_visits']);

      const before = await businessSnapshot(world.storage, composed.tables, world.businessId);
      const document: BackupDocument = await owner.backups.exportBackup(
        world.storage,
        world.businessId,
        { clock: world.clock },
      );
      expect(document.format).toBe('sample-backup');
      expect(document.counts).toMatchObject({ people: 2, notes: 1, alpha_visits: 1 });
      const checked = await owner.backups.checkBackup(JSON.parse(JSON.stringify(document)));
      expect(checked.preview.problems).toEqual([]);

      const device = createMemoryStorage<AnyTableRegistry, Business>(composed.tables, {
        hasher: testHasher,
        clock: fixedClock(),
        ids: sequentialIds(9000),
      });
      if (checked.backup === undefined) {
        throw new Error('The backup fits');
      }
      await owner.backups.restoreBackup(device, checked.backup);
      const after = await businessSnapshot(device, composed.tables, world.businessId);
      expect(after.business).toEqual(before.business);
      expect(after.tables).toEqual(before.tables);
    });

    it('is a kit that reads the older versions the edition names', async () => {
      const readers = { 1: (document: Record<string, unknown>) => ({ ...document, version: 2 }) };
      const edition = composeEdition(
        sampleEdition([alphaIndustry], { backupVersion: 2, backupReaders: readers }),
      );
      const world = await seed(edition);
      const running = startFor(edition, world);
      expect(running.backups.version).toBe(2);
      const old = createBackupKit({
        format: 'sample-backup',
        version: 1,
        registry: edition.tables,
        hasher: testHasher,
        businessSchema: BusinessSchema,
      });
      const document = await old.exportBackup(world.storage, world.businessId, {
        clock: world.clock,
      });
      const checked = await running.backups.checkBackup(JSON.parse(JSON.stringify(document)));
      expect(checked.preview.problems).toEqual([]);
    });
  });

  it('does not start a part that lacks a use case, or has one too many', async () => {
    const partial = stubModule('partial', {
      contract: notesContract,
      tables: notesModule.tables,
      catalog: notesModule.catalog,
      rights: notesModule.rights,
      useCases: () => ({
        'notes.add': () => Promise.resolve({}),
        'notes.zap': () => Promise.resolve({}),
      }),
    });
    const edition = composeEdition(editionOf([partial], []));
    const world = await seed(edition);
    expect(() => startFor(edition, world)).toThrow(EditionError);
    try {
      startFor(edition, world);
      expect.unreachable('the edition was started');
    } catch (error) {
      expect((error as EditionError).problems.map((problem) => problem.code)).toEqual([
        'missing_use_case',
        'missing_use_case',
        'extra_use_case',
      ]);
      expect((error as EditionError).code).toBe('missing_use_case');
    }
  });

  it('gives the use cases the registers of the edition and the person acting', async () => {
    const seen: { features: readonly string[]; rights: readonly string[]; actor: string }[] = [];
    const probe = stubModule('probe', {
      useCases: ({ features, rights, ctx }) => {
        seen.push({ features: features.ids, rights: rights.ids, actor: ctx.actor });
        return {};
      },
    });
    const edition = composeEdition(editionOf([notesModule, probe], [alphaIndustry]));
    const world = await seed(edition);
    startFor(edition, world, world.secondPersonId);
    expect(seen).toEqual([
      {
        features: edition.features.ids,
        rights: edition.rights.ids,
        actor: world.secondPersonId,
      },
    ]);
  });
});

import {
  ProfileSchema,
  contractAccessProblems,
  profileProblems,
  rightEntryProblems,
} from '@onestrand/access';
import { businessFeatureEntries, businessRightEntries } from '@onestrand/business';
import {
  ComposeError,
  command,
  commandBase,
  composeContract,
  fragmentProblems,
  operationSchemaProblems,
  type ContractFragment,
} from '@onestrand/contract';
import { createFeatureRegistry, featureEntryProblems } from '@onestrand/features';
import {
  businessModule,
  composeEdition,
  defineEdition,
  defineIndustry,
  defineModule,
  editionProblems,
  industryProblems,
  type ManifestProblem,
} from '@onestrand/manifest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  ENTRIES_FEATURE,
  MUSTER,
  MUSTER_EVENT_TYPES,
  RETENTION_SOURCE,
  STAFF_PROFILE,
  muster,
  musterCatalog,
  musterContract,
  musterRights,
  musterTableAccess,
} from '../src';
import { composed, inputOf, musterEditionInput } from './support';

const brief = (problems: readonly { code: string; part: string; id: string }[]) =>
  problems.map((problem) => `${problem.code} ${problem.part} ${problem.id}`);

describe('the manifest of muster', () => {
  it('is taken as it is: no problem, and every part is there once', () => {
    expect(industryProblems(inputOf(muster))).toEqual([]);
    expect(muster.kind).toBe('industry');
    expect(muster.id).toBe(MUSTER);
    expect(muster.tables.map((table) => table.name)).toEqual(['muster_entries']);
    expect(Object.keys(muster.contract)).toEqual(['muster.entries.add', 'muster.entries.list']);
    expect(Object.values(muster.contract).map((operation) => operation.kind)).toEqual([
      'command',
      'query',
    ]);
    expect(muster.events).toEqual(['muster_entry.added']);
    expect(muster.catalog.industries).toEqual([{ id: MUSTER }]);
    expect(muster.catalog.groups?.map((group) => group.id)).toEqual(['muster.journal']);
    expect(muster.catalog.features?.map((feature) => feature.id)).toEqual([ENTRIES_FEATURE]);
    expect(muster.catalog.features?.[0]?.options?.map((option) => option.key)).toEqual([
      'newestFirst',
    ]);
    expect(muster.catalog.kinds?.map((kind) => kind.id)).toEqual(['muster.standard']);
    expect(muster.catalog.questions?.map((question) => question.id)).toEqual([
      'muster.keeps_journal',
    ]);
    expect(muster.catalog.deviceModes?.map((mode) => mode.id)).toEqual(['muster.capture']);
    expect(muster.rights).toEqual({ industry: MUSTER, rights: [{ id: 'muster.journal_read' }] });
    expect(muster.templates.map((template) => template.id)).toEqual(['muster.staff']);
    expect(muster.ruleSets.map((ruleSet) => ruleSet.id)).toEqual(['muster.retention']);
    expect(muster.demo?.businessName).toBe('Betrieb Muster');
    expect(muster.demo?.kinds).toEqual(['muster.standard']);
    expect(muster.migrations).toEqual([]);
    expect(Object.isFrozen(muster)).toBe(true);
  });

  it('enters itself: its catalog and its rights do not name the industry', () => {
    expect(Object.keys(musterCatalog)).not.toContain('industries');
    expect(Object.keys(musterRights)).not.toContain('industry');
  });

  it('has register entries without a problem, on top of those of the platform', () => {
    const platform = createFeatureRegistry(businessFeatureEntries);
    expect(featureEntryProblems(muster.catalog, platform)).toEqual([]);
    const features = platform.extend(muster.catalog);
    expect(rightEntryProblems(features, businessRightEntries)).toEqual([]);
    expect(rightEntryProblems(features, muster.rights)).toEqual([]);
  });

  it('has a contract of well-formed operations whose schemas are JSON schemas', () => {
    expect(fragmentProblems(musterContract)).toEqual([]);
    expect(Object.values(musterContract).flatMap(operationSchemaProblems)).toEqual([]);
    expect(contractAccessProblems(musterContract, composed)).toEqual([]);
  });

  it('declares the events its command appends in its own namespace', () => {
    for (const type of MUSTER_EVENT_TYPES) {
      expect(type.startsWith(`${MUSTER}_`)).toBe(true);
    }
  });

  it('has a template that is a profile the registers know', () => {
    const [template] = muster.templates;
    expect(template?.kind).toBe('profile');
    expect(ProfileSchema.parse(template?.data)).toEqual(STAFF_PROFILE);
    expect(profileProblems(STAFF_PROFILE, composed)).toEqual([]);
  });

  it('has a rule set with its source under docs/fakten/ and the fact as data', () => {
    const [ruleSet] = muster.ruleSets;
    expect(ruleSet?.source).toBe(RETENTION_SOURCE);
    expect(ruleSet?.source.startsWith('docs/fakten/')).toBe(true);
    // OR 958f para. 1, docs/fakten/geld-steuern.md, section 3: 10 years from the end of the
    // business year. The guard of the industries checks that the file is there.
    expect(ruleSet?.data).toEqual({ years: 10, countedFrom: 'end_of_business_year' });
  });

  it('names the function and the right of its table for the filter of other devices', () => {
    expect(Object.keys(musterTableAccess)).toEqual(muster.tables.map((table) => table.name));
    for (const access of Object.values(musterTableAccess)) {
      expect(composed.features.has(access.feature)).toBe(true);
      expect(composed.rights.has(access.right)).toBe(true);
    }
  });
});

describe('muster docks without a file of the platform naming it', () => {
  const without = composeEdition(defineEdition(musterEditionInput({ industries: [], texts: [] })));
  const added = <T>(more: readonly T[], less: readonly T[]) =>
    more.filter((item) => !less.includes(item));

  it('lays out its table, operations, function, module, kind, question, device mode and right by being listed', () => {
    expect(added(composed.tables.names, without.tables.names)).toEqual(['muster_entries']);
    expect(added(Object.keys(composed.contract), Object.keys(without.contract))).toEqual([
      'muster.entries.add',
      'muster.entries.list',
    ]);
    expect(added(composed.features.ids, without.features.ids)).toEqual(['muster.entries']);
    const ids = (list: readonly { id: string }[]) => list.map((entry) => entry.id);
    expect(added(ids(composed.features.groups), ids(without.features.groups))).toEqual([
      'muster.journal',
    ]);
    expect(ids(composed.features.industries)).toEqual(['muster']);
    expect(added(ids(composed.features.kinds), ids(without.features.kinds))).toEqual([
      'muster.standard',
    ]);
    expect(added(ids(composed.features.questions), ids(without.features.questions))).toEqual([
      'muster.keeps_journal',
    ]);
    expect(added(ids(composed.features.deviceModes), ids(without.features.deviceModes))).toEqual([
      'muster.capture',
    ]);
    expect(added(composed.rights.ids, without.rights.ids)).toEqual(['muster.journal_read']);
    expect(composed.owners['muster.entries.add']).toBe(MUSTER);
    expect(composed.owners['muster.entries.list']).toBe(MUSTER);
  });

  it('leaves everything of the platform as it was', () => {
    for (const name of without.tables.names) {
      expect(composed.tables.get(name).schema).toBe(without.tables.get(name).schema);
      expect(composed.tables.get(name)).toEqual(without.tables.get(name));
    }
    for (const name of Object.keys(without.contract)) {
      expect(composed.contract[name]).toBe(without.contract[name]);
    }
    expect(composed.parts.map((part) => `${part.kind} ${part.id}`)).toEqual([
      'module business',
      'industry muster',
    ]);
    expect(composed.parts[0]).toBe(businessModule);
  });

  it('is listed in the edition and nowhere else: the edition names it once', () => {
    const input = musterEditionInput();
    expect(input.industries).toEqual([muster]);
    expect(input.modules).toBeUndefined();
  });
});

/** The contract of muster with one operation stripped of its `access`, written without types. */
function withoutAccess(name: keyof typeof musterContract): ContractFragment {
  const rest: Record<string, unknown> = { ...musterContract[name] };
  Reflect.deleteProperty(rest, 'access');
  return { ...musterContract, [name]: rest };
}

describe('an operation without access', () => {
  it('turns the conformity red, on a copy of the contract: muster stays as it is', () => {
    const copy = withoutAccess('muster.entries.list');
    const problems: ManifestProblem[] = industryProblems({ ...inputOf(muster), contract: copy });
    expect(brief(problems)).toEqual(['invalid_entry contract muster.entries.list']);
    expect(problems[0]?.message).toContain('access');
    expect(() => defineIndustry({ ...inputOf(muster), contract: copy })).toThrow(
      expect.objectContaining({ code: 'invalid_entry' }),
    );
    expect(fragmentProblems(copy).map((problem) => `${problem.part} ${problem.operation}`)).toEqual(
      ['access muster.entries.list'],
    );
    // The original is untouched.
    expect(musterContract['muster.entries.list'].access.feature).toBe(ENTRIES_FEATURE);
    expect(industryProblems(inputOf(muster))).toEqual([]);
  });
});

describe('two industries with the same operation', () => {
  it('cannot even be declared: the operations of an industry carry its own name', () => {
    expect(() =>
      defineIndustry({ ...inputOf(muster), id: 'zwilling', tables: [], catalog: {}, rights: {} }),
    ).toThrow(expect.objectContaining({ code: 'wrong_namespace' }));
  });

  it('cannot be listed twice in an edition', () => {
    expect(() => defineEdition(musterEditionInput({ industries: [muster, muster] }))).toThrow(
      expect.objectContaining({ code: 'duplicate_id' }),
    );
  });

  it('meet at the composer of the contract, which refuses them and names both', () => {
    try {
      composeContract([
        { source: MUSTER, fragment: musterContract },
        { source: 'zwilling', fragment: musterContract },
      ]);
      expect.unreachable('the contract was put together');
    } catch (error) {
      expect(error).toBeInstanceOf(ComposeError);
      expect((error as ComposeError).code).toBe('duplicate_operation');
      expect((error as ComposeError).problems[0]?.sources).toEqual([MUSTER, 'zwilling']);
    }
  });

  it('make composeEdition fail when another part brings an operation of muster', () => {
    const contract = {
      'muster.entries.add': command({
        name: 'muster.entries.add',
        summary: 'Records an entry, a second time.',
        access: { feature: 'twin', level: 'operate' },
        input: z.object({ ...commandBase }),
        output: z.object({}),
      }),
    } as const satisfies ContractFragment;
    const twin = defineModule({
      id: 'twin',
      tables: [],
      contract,
      useCases: () => ({ 'muster.entries.add': () => Promise.resolve({}) }),
      catalog: { groups: [{ id: 'twin' }], features: [{ id: 'twin', group: 'twin' }] },
    });
    const edition = defineEdition(musterEditionInput({ modules: [twin] }));
    expect(() => composeEdition(edition)).toThrow(
      expect.objectContaining({ code: 'namespace_taken' }),
    );
    const codes = editionProblems(edition)
      .filter((problem) => problem.part !== 'texts')
      .map((problem) => `${problem.code} ${problem.id}`);
    expect(codes).toEqual([
      'namespace_taken muster.entries.add',
      'duplicate_operation muster.entries.add',
    ]);
  });
});

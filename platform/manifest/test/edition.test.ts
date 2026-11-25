import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  ManifestError,
  defineEdition,
  defineIndustry,
  defineModule,
  editionInputProblems,
  type ManifestProblem,
} from '../src';
import { alphaIndustry, betaIndustry, notesModule, sampleEdition, sampleInput } from './support';

const brief = (problems: readonly ManifestProblem[]) =>
  problems.map((problem) => `${problem.code} ${problem.part} ${problem.id}`);

/** The input of the sample edition as plain data with some fields replaced. */
function changed(changes: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries<unknown>({ ...sampleInput(), ...changes }).filter(
      ([, value]) => value !== undefined,
    ),
  );
}

describe('defineEdition', () => {
  it('takes an edition and holds it as data, frozen', () => {
    expect(editionInputProblems(sampleInput())).toEqual([]);
    const edition = sampleEdition();
    expect(edition).toMatchObject({
      kind: 'edition',
      id: 'sample',
      database: 'sample',
      storagePrefix: 'sample:',
      backupFormat: 'sample-backup',
      backupVersion: 1,
      title: 'Beispiel',
    });
    expect(edition.industries).toEqual([alphaIndustry]);
    expect(edition.modules).toEqual([notesModule]);
    expect(Object.isFrozen(edition)).toBe(true);
    expect(Object.isFrozen(edition.industries)).toBe(true);
    expect(Object.isFrozen(edition.modules)).toBe(true);
    expect(Object.isFrozen(edition.texts)).toBe(true);
    expect(Object.isFrozen(edition.translations)).toBe(true);
  });

  it('needs only what names it and the industries', () => {
    const edition = defineEdition({
      id: 'lean',
      database: 'lean',
      storagePrefix: 'lean:',
      backupFormat: 'lean-backup',
      backupVersion: 1,
      title: 'Schlank',
      industries: [],
    });
    expect(edition.modules).toEqual([]);
    expect(edition.texts).toEqual([]);
    expect(edition.translations).toEqual({});
    expect(edition.lexicon).toEqual({});
    expect(edition.backupReaders).toEqual({});
  });

  it('holds a copy of the lists it was given', () => {
    const industries = [alphaIndustry];
    const edition = defineEdition({ ...sampleInput(), industries });
    industries.push(betaIndustry);
    expect(edition.industries).toEqual([alphaIndustry]);
  });

  describe('the names that are frozen for ever', () => {
    it.each([
      ['no id', undefined],
      ['an id with capitals', 'Sample'],
      ['an id with an underscore', 'sam_ple'],
      ['an id that is no text', 4],
    ])('refuses %s', (_name, id) => {
      expect(editionInputProblems(changed({ id })).map((problem) => problem.part)).toContain('id');
    });

    it.each([
      ['database', 'brand', 'database'],
      ['storagePrefix', 'sample', 'storage_prefix'],
      ['storagePrefix', 'brand:', 'storage_prefix'],
      ['backupFormat', 'sample', 'backup'],
      ['backupFormat', 'brand-backup', 'backup'],
    ])('refuses %s "%s": it carries the id', (field, value, part) => {
      const problems = editionInputProblems(changed({ [field]: value }));
      expect(brief(problems)).toEqual([`invalid_entry ${part} ${value}`]);
      expect(problems[0]?.message).toContain('never renamed');
    });

    it.each([
      ['database', undefined],
      ['database', ' sample '],
      ['database', ''],
      ['storagePrefix', 7],
      ['backupFormat', null],
    ])('refuses %s that is %j', (field, value) => {
      expect(editionInputProblems(changed({ [field]: value }))).toHaveLength(1);
    });

    it('does not compare with the id where the id is wrong, so one mistake is one problem', () => {
      expect(
        brief(editionInputProblems(changed({ id: 'Sample', database: 'x', storagePrefix: 'x:' }))),
      ).toEqual(['invalid_entry id Sample']);
    });

    it('is the one place that fixes the format and the prefix of Randen, which it never renames', () => {
      expect(
        editionInputProblems({
          ...sampleInput(),
          id: 'randen',
          database: 'randen',
          storagePrefix: 'randen:',
          backupFormat: 'randen-backup',
        }),
      ).toEqual([]);
    });
  });

  describe('the version of the backup', () => {
    it.each([0, -1, 1.5, '1', undefined, Number.NaN, 2 ** 60])('refuses %j', (backupVersion) => {
      expect(brief(editionInputProblems(changed({ backupVersion })))).toEqual([
        'invalid_entry backup ?',
      ]);
    });

    it('wants a reader for every older version, so no file stays unread', () => {
      expect(brief(editionInputProblems(changed({ backupVersion: 3 })))).toEqual([
        'invalid_entry backup 1',
        'invalid_entry backup 2',
      ]);
      expect(
        brief(
          editionInputProblems(
            changed({ backupVersion: 3, backupReaders: { 1: (doc: unknown) => doc } }),
          ),
        ),
      ).toEqual(['invalid_entry backup 2']);
      const readers = {
        1: (doc: Record<string, unknown>) => doc,
        2: (doc: Record<string, unknown>) => doc,
      };
      expect(editionInputProblems(changed({ backupVersion: 3, backupReaders: readers }))).toEqual(
        [],
      );
      expect(
        defineEdition({ ...sampleInput(), backupVersion: 3, backupReaders: readers }).backupReaders,
      ).toEqual(readers);
    });
  });

  describe('the parts', () => {
    it('takes an industry only if defineIndustry made it', () => {
      expect(brief(editionInputProblems(changed({ industries: [{ ...alphaIndustry }] })))).toEqual([
        'invalid_entry industries ?',
      ]);
      expect(brief(editionInputProblems(changed({ industries: [notesModule] })))).toEqual([
        'invalid_entry industries ?',
      ]);
      expect(brief(editionInputProblems(changed({ industries: 'alpha' })))).toEqual([
        'invalid_entry industries ?',
      ]);
      expect(brief(editionInputProblems(changed({ industries: undefined })))).toEqual([
        'invalid_entry industries ?',
      ]);
    });

    it('takes a module only if defineModule made it', () => {
      expect(brief(editionInputProblems(changed({ modules: [alphaIndustry] })))).toEqual([
        'invalid_entry modules ?',
      ]);
      expect(brief(editionInputProblems(changed({ modules: [{ ...notesModule }] })))).toEqual([
        'invalid_entry modules ?',
      ]);
      expect(brief(editionInputProblems(changed({ modules: 7 })))).toEqual([
        'invalid_entry modules ?',
      ]);
    });

    it('refuses an id twice, among industries, among modules and between the two', () => {
      expect(
        brief(editionInputProblems(changed({ industries: [alphaIndustry, alphaIndustry] }))),
      ).toEqual(['duplicate_id industries alpha']);
      expect(brief(editionInputProblems(changed({ modules: [notesModule, notesModule] })))).toEqual(
        ['duplicate_id modules notes'],
      );
      const same = defineModule({
        id: 'alpha',
        tables: [],
        contract: {},
        useCases: () => ({}),
        catalog: {},
      });
      expect(brief(editionInputProblems(changed({ modules: [same] })))).toEqual([
        'duplicate_id industries alpha',
      ]);
    });

    it('does not take an industry made by hand, even if it looks like one', () => {
      const forged = {
        ...defineIndustry({
          id: 'gamma',
          tables: [],
          contract: {},
          useCases: () => ({}),
          catalog: {},
        }),
      };
      expect(() => defineEdition({ ...sampleInput(), industries: [forged] })).toThrow(
        ManifestError,
      );
    });
  });

  describe('the texts and the languages', () => {
    it('takes catalogues and other languages by tag', () => {
      expect(
        editionInputProblems(
          changed({ translations: { pt: {}, 'fr-CH': { levels: { view: 'Voir' } } } }),
        ),
      ).toEqual([]);
    });

    it.each([
      ['texts that are no list', { texts: {} }, 'invalid_entry texts ?'],
      ['a text that is no catalogue', { texts: ['x'] }, 'invalid_entry texts ?'],
      ['translations that are a list', { translations: [] }, 'invalid_entry languages ?'],
      [
        'a translation that is no catalogue',
        { translations: { pt: 'x' } },
        'invalid_entry languages ?',
      ],
      [
        'a tag that is no language',
        { translations: { 'PT-br': {} } },
        'invalid_entry languages PT-br',
      ],
      [
        'de-CH as a translation',
        { translations: { 'de-CH': {} } },
        'invalid_entry languages de-CH',
      ],
    ])('refuses %s', (_name, changes, expected) => {
      expect(brief(editionInputProblems(changed(changes)))).toContain(expected);
    });
  });

  describe('the form', () => {
    it('refuses what is no object, and a field it does not have', () => {
      expect(brief(editionInputProblems('sample'))).toEqual(['invalid_entry manifest ?']);
      expect(brief(editionInputProblems(null))).toEqual(['invalid_entry manifest ?']);
      expect(brief(editionInputProblems(changed({ brand: 'x' })))).toEqual([
        'invalid_entry manifest ?',
      ]);
    });

    it('wants a working title', () => {
      for (const title of [undefined, '', '  ', 3]) {
        expect(brief(editionInputProblems(changed({ title })))).toEqual(['invalid_entry title ?']);
      }
    });

    it('throws a ManifestError with the code of the first problem and every problem in it', () => {
      const input = changed({ database: 'brand', title: '' });
      try {
        defineEdition(input as never);
        expect.unreachable('the edition was taken');
      } catch (error) {
        expect(error).toBeInstanceOf(ManifestError);
        expect((error as ManifestError).code).toBe('invalid_entry');
        expect((error as ManifestError).problems.map((problem) => problem.part)).toEqual([
          'database',
          'title',
        ]);
      }
    });
  });

  it('does not compile without the names that are frozen, the title or the industries', () => {
    const typesOnly = (probe: () => void) => expectTypeOf(probe).toBeFunction();
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call -- the arguments are wrong on purpose */
    typesOnly(() => {
      // @ts-expect-error the name of the database is required
      defineEdition(without(sampleInput(), 'database'));
      // @ts-expect-error the version of the backup is required
      defineEdition(without(sampleInput(), 'backupVersion'));
      // @ts-expect-error the industries are required, even if there are none
      defineEdition(without(sampleInput(), 'industries'));
      // @ts-expect-error the working title is required
      defineEdition(without(sampleInput(), 'title'));
    });
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
  });
});

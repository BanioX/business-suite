import { describe, expect, it } from 'vitest';
import * as manifest from '../src';

/**
 * The public surface, name by name. The editions and the industries build on it: a name that
 * disappears or appears here is a decision, not an accident. Types are not listed; `tsc` guards
 * them where they are used.
 */
describe('@onestrand/manifest', () => {
  it('exports exactly these values', () => {
    expect(Object.keys(manifest).sort()).toEqual([
      'EDITION_PARTS',
      'EditionError',
      'INDUSTRY_ID_PATTERN',
      'MANIFEST_PROBLEM_CODES',
      'ManifestError',
      'SLOT_IDS',
      'SLOT_PAGES',
      'availableSlotEntries',
      'businessModule',
      'composeEdition',
      'defineEdition',
      'defineIndustry',
      'defineModule',
      'editionInputProblems',
      'editionProblems',
      'industryProblems',
      'moduleProblems',
      'startEdition',
    ]);
  });

  it('keeps the codes as documented', () => {
    expect(manifest.MANIFEST_PROBLEM_CODES).toEqual([
      'invalid_entry',
      'duplicate_id',
      'wrong_namespace',
      'unknown_reference',
      'missing_source',
    ]);
    expect(manifest.EDITION_PARTS).toEqual([
      'parts',
      'tables',
      'features',
      'rights',
      'contract',
      'access',
      'namespaces',
      'use_cases',
      'schemas',
      'texts',
      'lexicon',
    ]);
  });

  it('holds no industry and no fixed edition: the platform does not name one', () => {
    for (const [name, value] of Object.entries(manifest)) {
      if (typeof value === 'object' && Object.hasOwn(value, 'kind')) {
        expect(name).toBe('businessModule');
      }
    }
  });
});

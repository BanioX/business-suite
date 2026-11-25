import { FEATURE_ID_PATTERN, operationProblems } from '@onestrand/contract';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { featureEntryProblems } from '../src';
import { REGISTRY } from './support';

/**
 * `access.feature` of an operation names a feature of this register. The form of that id is
 * checked in the contract, which sits below this package, and the register builds on the same
 * pattern. These tests keep the two from drifting apart (debt TD-10).
 */

/** An operation that asks for this feature; the rest of it is well formed. */
function operationFor(feature: string) {
  return {
    name: 'customers.list',
    kind: 'query',
    summary: 'Lists the customers.',
    access: { feature, level: 'view' },
    input: z.object({}),
    output: z.object({}),
  };
}

const contractAccepts = (id: string) =>
  !operationProblems(operationFor(id)).some((problem) => problem.part === 'access.feature');

const registerAccepts = (id: string) =>
  !featureEntryProblems({ groups: [{ id: 'g' }], features: [{ id, group: 'g' }] }).some(
    (problem) => problem.code === 'invalid_entry',
  );

describe('the id of a feature', () => {
  it('is accepted as access.feature for every feature of the register', () => {
    for (const id of REGISTRY.ids) {
      expect(contractAccepts(id), id).toBe(true);
    }
  });

  it('is accepted by the register exactly where the contract accepts it, for any text', () => {
    const word = fc.constantFrom(...'abzAZ09_-. '.split(''));
    fc.assert(
      fc.property(fc.array(word, { maxLength: 12 }), (letters) => {
        const id = letters.join('');
        expect(registerAccepts(id)).toBe(contractAccepts(id));
        expect(registerAccepts(id)).toBe(FEATURE_ID_PATTERN.test(id));
      }),
      { numRuns: 1000 },
    );
  });

  it('takes the forms an industry and the platform use, and refuses the old looser ones', () => {
    for (const id of ['customers', 'team_time', 'facility.keys', 'facility.key_moves']) {
      expect(registerAccepts(id), id).toBe(true);
      expect(contractAccepts(id), id).toBe(true);
    }
    for (const id of ['teamTime', 'jobs.reports.sign', 'Jobs', 'a-b', 'a__b', '', 'a.']) {
      expect(registerAccepts(id), id).toBe(false);
      expect(contractAccepts(id), id).toBe(false);
    }
  });
});

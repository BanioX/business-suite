import { FEATURE_ID_PATTERN, RIGHT_ID_PATTERN, operationProblems } from '@onestrand/contract';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ProfileSchema, createRightRegistry, rightEntryProblems } from '../src';
import { FEATURES, RIGHTS } from './support';

/**
 * `access.rights` of an operation names rights of this register. The form of that id is checked
 * in the contract, which sits below this package, and the register builds on the same pattern.
 * These tests keep the two from drifting apart (debt TD-10).
 */

/** An operation that asks for this right; the rest of it is well formed. */
function operationFor(right: unknown) {
  return {
    name: 'customers.export',
    kind: 'query',
    summary: 'Exports the customers.',
    access: { feature: 'customers', level: 'view', rights: [right] },
    input: z.object({}),
    output: z.object({}),
  };
}

const contractAccepts = (id: unknown) =>
  !operationProblems(operationFor(id)).some((problem) => problem.part === 'access.rights');

const registerAccepts = (id: string) =>
  !rightEntryProblems(FEATURES, { rights: [{ id }] }).some(
    (problem) => problem.code === 'invalid_entry',
  );

const profileAccepts = (id: string) =>
  ProfileSchema.safeParse({ type: 'custom', levels: {}, rights: [id] }).success;

describe('the id of a right', () => {
  it('is accepted as access.rights for every right of the register', () => {
    for (const id of RIGHTS.ids) {
      expect(contractAccepts(id), id).toBe(true);
    }
  });

  it('is accepted by the register, the contract and a profile exactly alike, for any text', () => {
    const letter = fc.constantFrom(...'abzAZ09_-. '.split(''));
    fc.assert(
      fc.property(fc.array(letter, { maxLength: 14 }), (letters) => {
        const id = letters.join('');
        expect(registerAccepts(id)).toBe(contractAccepts(id));
        expect(profileAccepts(id)).toBe(contractAccepts(id));
        expect(registerAccepts(id)).toBe(RIGHT_ID_PATTERN.test(id));
      }),
      { numRuns: 1000 },
    );
  });

  it('takes the forms the platform and an industry use, and refuses the old looser ones', () => {
    for (const id of ['wages', 'export_delete', 'muster.access_notes', 'muster.keys.assign']) {
      expect(registerAccepts(id), id).toBe(true);
      expect(contractAccepts(id), id).toBe(true);
    }
    for (const id of ['exportDelete', 'Wages', 'a-b', 'a__b', '', 'a.', 'a.b.c.d', '_a', '1a']) {
      expect(registerAccepts(id), id).toBe(false);
      expect(contractAccepts(id), id).toBe(false);
    }
  });

  it('is not the form of a function by accident: a right may have a third segment, a function may not', () => {
    expect(RIGHT_ID_PATTERN.test('muster.keys.assign')).toBe(true);
    expect(FEATURE_ID_PATTERN.test('muster.keys.assign')).toBe(false);
    for (const id of ['wages', 'team_time', 'muster.visits']) {
      expect(RIGHT_ID_PATTERN.test(id), id).toBe(true);
      expect(FEATURE_ID_PATTERN.test(id), id).toBe(true);
    }
  });

  it('is what the register uses: a register refuses what the contract refuses', () => {
    expect(() => createRightRegistry(FEATURES, { rights: [{ id: 'exportDelete' }] })).toThrow();
  });
});

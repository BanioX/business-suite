import { createFeatureRegistry } from '@onestrand/features';
import { describe, expect, it } from 'vitest';
import { RIGHT_PROBLEM_CODES, RightError, createRightRegistry, rightEntryProblems } from '../src';
import { FEATURES, RIGHTS } from './support';

const codes = (entries: unknown, base = RIGHTS) =>
  rightEntryProblems(FEATURES, entries, base).map((problem) => problem.code);

describe('the register of rights', () => {
  it('holds the rights of the platform and of an industry in the order entered', () => {
    expect(RIGHTS.ids).toEqual([
      'wages',
      'export_delete',
      'correct_time',
      'muster.access_notes',
      'muster.visits.assign',
    ]);
    expect(RIGHTS.rights.map((right) => right.id)).toEqual(RIGHTS.ids);
    expect(RIGHTS.has('wages')).toBe(true);
    expect(RIGHTS.has('muster.visits.assign')).toBe(true);
    expect(RIGHTS.has('salary')).toBe(false);
    expect(RIGHTS.has('')).toBe(false);
  });

  it('is frozen, and extend leaves the old register as it was', () => {
    expect(Object.isFrozen(RIGHTS)).toBe(true);
    expect(Object.isFrozen(RIGHTS.ids)).toBe(true);
    expect(Object.isFrozen(RIGHTS.rights)).toBe(true);
    expect(Object.isFrozen(RIGHTS.rights[0])).toBe(true);
    const more = RIGHTS.extend({ rights: [{ id: 'settings' }] });
    expect(more.has('settings')).toBe(true);
    expect(RIGHTS.has('settings')).toBe(false);
    expect(more.ids).toEqual([...RIGHTS.ids, 'settings']);
  });

  it('can start empty and takes no entries at all', () => {
    expect(createRightRegistry(FEATURES, {}).ids).toEqual([]);
    expect(createRightRegistry(FEATURES, { rights: [] }).ids).toEqual([]);
    expect(RIGHTS.extend({}).ids).toEqual(RIGHTS.ids);
  });

  it('finds nothing in good entries', () => {
    expect(codes({ rights: [{ id: 'settings' }] })).toEqual([]);
    expect(codes({ industry: 'muster', rights: [{ id: 'muster.keys' }] })).toEqual([]);
    expect(codes({ industry: 'muster', rights: [{ id: 'muster.a.b' }] })).toEqual([]);
  });

  it.each([
    ['nothing', undefined],
    ['null', null],
    ['a list', []],
    ['a text', 'wages'],
  ])('refuses entries that are %s', (_what, entries) => {
    expect(codes(entries)).toEqual(['invalid_entry']);
  });

  it('refuses what is not shaped like an entry, all at once', () => {
    const problems = rightEntryProblems(FEATURES, {
      rights: [{ id: 'Wages' }, { id: 'a.b.c.d' }, 'x', null, { id: 7 }, { name: 'q' }],
      extra: 1,
    });
    expect(problems.map((problem) => problem.code)).toEqual([
      'invalid_entry',
      'invalid_entry',
      'invalid_entry',
      'invalid_entry',
      'invalid_entry',
      'invalid_entry',
      'invalid_entry',
      'invalid_entry',
    ]);
    expect(problems[0]?.message).toContain('"extra"');
    expect(problems.map((problem) => problem.message).join('\n')).toContain('an object, got "x"');
  });

  it('refuses rights that are not a list, and an industry that is no id', () => {
    expect(codes({ rights: 'wages' })).toEqual(['invalid_entry']);
    expect(codes({ industry: 4 })).toEqual(['invalid_entry']);
    expect(codes({ industry: 'Muster' })).toEqual(['invalid_entry']);
  });

  it('refuses a right with a field it does not have, naming the right', () => {
    const [problem] = rightEntryProblems(FEATURES, { rights: [{ id: 'settings', text: 'x' }] });
    expect(problem).toMatchObject({ code: 'invalid_entry', id: 'settings' });
  });

  it('refuses a right twice, in the entries and against the register', () => {
    expect(codes({ rights: [{ id: 'settings' }, { id: 'settings' }] })).toEqual(['duplicate_id']);
    expect(codes({ rights: [{ id: 'wages' }] })).toEqual(['duplicate_id']);
    expect(codes({ industry: 'muster', rights: [{ id: 'muster.access_notes' }] })).toEqual([
      'duplicate_id',
    ]);
  });

  it('refuses the rights of an industry that the register of features does not know', () => {
    const [problem, ...rest] = rightEntryProblems(FEATURES, {
      industry: 'facility',
      rights: [{ id: 'facility.keys' }],
    });
    expect(problem).toMatchObject({ code: 'unknown_namespace', id: 'facility' });
    expect(rest).toEqual([]);
  });

  it('keeps the namespaces apart: an industry enters its own, the platform none', () => {
    expect(codes({ industry: 'muster', rights: [{ id: 'settings' }] })).toEqual([
      'wrong_namespace',
    ]);
    expect(codes({ rights: [{ id: 'muster.keys' }] })).toEqual(['wrong_namespace']);
    expect(codes({ industry: 'muster', rights: [{ id: 'other.keys' }] })).toEqual([
      'wrong_namespace',
    ]);
    const foreign = createFeatureRegistry({ industries: [{ id: 'other' }] });
    expect(
      rightEntryProblems(foreign, { industry: 'other', rights: [{ id: 'muster.keys' }] }).map(
        (problem) => problem.code,
      ),
    ).toEqual(['wrong_namespace']);
  });

  it('takes the industries from the register of features it is given', () => {
    const features = createFeatureRegistry({ industries: [{ id: 'other' }] });
    const rights = createRightRegistry(features, {
      industry: 'other',
      rights: [{ id: 'other.keys' }],
    });
    expect(rights.ids).toEqual(['other.keys']);
    expect(() =>
      createRightRegistry(features, { industry: 'muster', rights: [{ id: 'muster.keys' }] }),
    ).toThrow(RightError);
  });

  it('throws a RightError with the code of the first problem and all problems in it', () => {
    const entries = { rights: [{ id: 'wages' }, { id: 'muster.x' }] };
    let caught: unknown;
    try {
      RIGHTS.extend(entries);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(RightError);
    const error = caught as RightError;
    expect(error.name).toBe('RightError');
    expect(error.code).toBe('duplicate_id');
    expect(error.problems.map((problem) => problem.code)).toEqual([
      'duplicate_id',
      'wrong_namespace',
    ]);
    expect(error.message).toContain('wages');
    expect(RIGHT_PROBLEM_CODES).toContain(error.code);
  });

  it('never throws from the check', () => {
    for (const value of [
      undefined,
      null,
      4,
      'x',
      [],
      {},
      { rights: [undefined] },
      { rights: {} },
    ]) {
      expect(() => rightEntryProblems(FEATURES, value)).not.toThrow();
    }
  });

  it('checks entries against a register given as the base', () => {
    expect(rightEntryProblems(FEATURES, { rights: [{ id: 'wages' }] })).toEqual([]);
    expect(rightEntryProblems(FEATURES, { rights: [{ id: 'wages' }] }, RIGHTS)).toHaveLength(1);
  });
});

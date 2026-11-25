import { ACCESS_LEVELS, type OperationAccess } from '@onestrand/contract';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  DENIAL_REASONS,
  NO_ACCESS_PROFILE,
  OWNER_PROFILE,
  decideAccess,
  levelRank,
  levelOf,
} from '../src';
import {
  ALL_FEATURES,
  contextOf,
  custom,
  customProfileArb,
  featuresOnArb,
  levelArb,
  notesContract,
} from './support';

const customers = (level: OperationAccess['level'], rights?: readonly string[]): OperationAccess =>
  rights === undefined ? { feature: 'customers', level } : { feature: 'customers', level, rights };

describe('decideAccess', () => {
  it('lets a profile with the level in the function do the operation', () => {
    const context = contextOf(custom({ customers: 'operate' }));
    expect(decideAccess(customers('operate'), context)).toEqual({ allowed: true });
    expect(decideAccess(customers('view'), context)).toEqual({ allowed: true });
  });

  it('refuses a profile with a lower level, and says which it has', () => {
    const context = contextOf(custom({ customers: 'view' }));
    expect(decideAccess(customers('operate'), context)).toEqual({
      allowed: false,
      reason: 'level_missing',
      feature: 'customers',
      needed: 'operate',
      held: 'view',
    });
  });

  it('refuses a profile without a level in the function: nothing is no operation', () => {
    for (const level of ACCESS_LEVELS) {
      expect(decideAccess(customers(level), contextOf(NO_ACCESS_PROFILE))).toEqual({
        allowed: false,
        reason: 'level_missing',
        feature: 'customers',
        needed: level,
        held: undefined,
      });
    }
    // A level in another function does not help.
    expect(decideAccess(customers('view'), contextOf(custom({ jobs: 'manage' }))).allowed).toBe(
      false,
    );
  });

  it('refuses a function that is switched off, for everybody, the owner too', () => {
    const off = ALL_FEATURES.filter((id) => id !== 'customers');
    for (const profile of [OWNER_PROFILE, custom({ customers: 'manage' })]) {
      expect(decideAccess(customers('view'), contextOf(profile, off))).toEqual({
        allowed: false,
        reason: 'feature_off',
        feature: 'customers',
      });
    }
    expect(decideAccess(customers('view'), contextOf(OWNER_PROFILE, [])).allowed).toBe(false);
  });

  it('asks for the function before the level and the level before the rights', () => {
    const access = customers('manage', ['wages']);
    expect(decideAccess(access, contextOf(NO_ACCESS_PROFILE, []))).toMatchObject({
      reason: 'feature_off',
    });
    expect(decideAccess(access, contextOf(NO_ACCESS_PROFILE))).toMatchObject({
      reason: 'level_missing',
    });
    expect(decideAccess(access, contextOf(custom({ customers: 'manage' })))).toMatchObject({
      reason: 'right_missing',
    });
  });

  it('wants every right the operation names and lists the ones that are missing', () => {
    const access = notesContract['notes.export'].access;
    const some = contextOf(custom({ customers: 'manage' }, ['export_delete']));
    expect(decideAccess(access, some)).toEqual({
      allowed: false,
      reason: 'right_missing',
      feature: 'customers',
      missing: ['correct_time'],
    });
    const none = contextOf(custom({ customers: 'manage' }));
    expect(decideAccess(access, none)).toMatchObject({
      missing: ['export_delete', 'correct_time'],
    });
    const all = contextOf(custom({ customers: 'manage' }, ['correct_time', 'export_delete']));
    expect(decideAccess(access, all)).toEqual({ allowed: true });
  });

  it('asks for no right where the operation names none or an empty list', () => {
    const context = contextOf(custom({ customers: 'view' }));
    expect(decideAccess(customers('view'), context).allowed).toBe(true);
    expect(decideAccess(customers('view', []), context).allowed).toBe(true);
  });

  it('knows the reasons it gives', () => {
    expect(DENIAL_REASONS).toEqual(['feature_off', 'level_missing', 'right_missing']);
  });
});

describe('the rules that hold for any profile and any operation', () => {
  const accessArb = fc.record({
    feature: fc.constantFrom('customers', 'jobs', 'team', 'muster.visits', 'today'),
    level: levelArb,
    rights: fc.uniqueArray(fc.constantFrom('wages', 'export_delete', 'correct_time')),
  });

  it('lets the owner do every operation of a function that is on', () => {
    fc.assert(
      fc.property(accessArb, featuresOnArb, (access, on) => {
        const decision = decideAccess(access, contextOf(OWNER_PROFILE, on));
        expect(decision.allowed).toBe(on.includes(access.feature));
      }),
    );
  });

  it('lets the owner do an operation of a function and a right that only a later version adds', () => {
    const access = { feature: 'later_function', level: 'manage', rights: ['later_right'] } as const;
    expect(decideAccess(access, contextOf(OWNER_PROFILE, ['later_function'])).allowed).toBe(true);
  });

  it('never lets an operation run without a level in its function', () => {
    fc.assert(
      fc.property(customProfileArb, accessArb, (profile, access) => {
        const decision = decideAccess(access, contextOf(profile));
        if (levelOf(profile, access.feature) === undefined) {
          expect(decision.allowed).toBe(false);
        }
      }),
    );
  });

  it('never lets an operation run for a function that is off', () => {
    fc.assert(
      fc.property(customProfileArb, accessArb, featuresOnArb, (profile, access, on) => {
        if (!on.includes(access.feature)) {
          expect(decideAccess(access, contextOf(profile, on)).allowed).toBe(false);
        }
      }),
    );
  });

  it('allows exactly when function, level and every right are there', () => {
    fc.assert(
      fc.property(customProfileArb, accessArb, featuresOnArb, (profile, access, on) => {
        const expected =
          on.includes(access.feature) &&
          levelRank(levelOf(profile, access.feature)) >= levelRank(access.level) &&
          access.rights.every((right) => profile.rights.includes(right));
        expect(decideAccess(access, contextOf(profile, on)).allowed).toBe(expected);
      }),
    );
  });

  it('does not allow more when the profile gets less: fewer rights never turn a no into a yes', () => {
    fc.assert(
      fc.property(customProfileArb, accessArb, (profile, access) => {
        const poorer = { ...profile, rights: profile.rights.slice(1) };
        if (!decideAccess(access, contextOf(profile)).allowed) {
          expect(decideAccess(access, contextOf(poorer)).allowed).toBe(false);
        }
      }),
    );
  });
});

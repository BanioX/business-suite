import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  NO_ACCESS_PROFILE,
  OWNER_PROFILE,
  TRANSFER_PROBLEM_CODES,
  levelOf,
  levelRank,
  holdsRight,
  profileChangeProblems,
  type CustomProfile,
} from '../src';
import { custom, customProfileArb, profileArb } from './support';

const codes = (...args: Parameters<typeof profileChangeProblems>) =>
  profileChangeProblems(...args).map((problem) => `${problem.code}:${problem.id}`);

describe('profileChangeProblems', () => {
  it('lets a person give a level up to their own', () => {
    const actor = custom({ customers: 'operate', jobs: 'view' }, ['wages']);
    const next = custom({ customers: 'operate', jobs: 'view' }, ['wages']);
    expect(codes(actor, NO_ACCESS_PROFILE, next)).toEqual([]);
    expect(codes(actor, NO_ACCESS_PROFILE, custom({ customers: 'view' }))).toEqual([]);
  });

  it('refuses a level above the level of the person who gives it', () => {
    const actor = custom({ customers: 'operate' });
    expect(codes(actor, NO_ACCESS_PROFILE, custom({ customers: 'manage' }))).toEqual([
      'level_beyond_actor:customers',
    ]);
    expect(codes(actor, NO_ACCESS_PROFILE, custom({ jobs: 'view' }))).toEqual([
      'level_beyond_actor:jobs',
    ]);
  });

  it('refuses a right the person who gives it does not hold', () => {
    const actor = custom({}, ['wages']);
    expect(codes(actor, NO_ACCESS_PROFILE, custom({}, ['wages', 'export_delete']))).toEqual([
      'right_beyond_actor:export_delete',
    ]);
  });

  it('names every problem at once, functions before rights', () => {
    const actor = custom({ customers: 'view' });
    const next = custom({ customers: 'manage', jobs: 'view' }, ['wages', 'correct_time']);
    expect(codes(actor, NO_ACCESS_PROFILE, next)).toEqual([
      'level_beyond_actor:customers',
      'level_beyond_actor:jobs',
      'right_beyond_actor:wages',
      'right_beyond_actor:correct_time',
    ]);
  });

  it('does not count what stays as it is: the person need not hold what is not touched', () => {
    const current = custom({ customers: 'manage', jobs: 'view' }, ['wages']);
    const next = custom({ customers: 'manage', jobs: 'operate' }, ['wages']);
    expect(codes(custom({ jobs: 'operate' }), current, next)).toEqual([]);
  });

  it('refuses to lower what the person does not hold: the person never had it to take', () => {
    const current = custom({ customers: 'manage' }, ['wages']);
    expect(
      codes(custom({ customers: 'operate' }), current, custom({ customers: 'view' }, [])),
    ).toEqual(['level_beyond_actor:customers', 'right_beyond_actor:wages']);
    // Lowering to or from a level the person holds is fine.
    expect(codes(custom({ customers: 'manage' }, ['wages']), current, custom({}, []))).toEqual([]);
  });

  it('treats removing a level as lowering it to nothing', () => {
    const current = custom({ customers: 'operate' });
    expect(codes(custom({ customers: 'view' }), current, NO_ACCESS_PROFILE)).toEqual([
      'level_beyond_actor:customers',
    ]);
    expect(codes(custom({ customers: 'operate' }), current, NO_ACCESS_PROFILE)).toEqual([]);
  });

  it('lets an owner give anything', () => {
    const next = custom({ customers: 'manage', future: 'manage' }, ['wages', 'later_right']);
    expect(codes(OWNER_PROFILE, NO_ACCESS_PROFILE, next)).toEqual([]);
    expect(codes(OWNER_PROFILE, next, NO_ACCESS_PROFILE)).toEqual([]);
  });

  it('keeps the owner profile fixed: it can be neither changed nor taken away', () => {
    for (const actor of [OWNER_PROFILE, custom({ customers: 'manage' }, ['wages'])]) {
      expect(codes(actor, OWNER_PROFILE, NO_ACCESS_PROFILE)).toEqual(['owner_fixed:owner']);
      expect(codes(actor, OWNER_PROFILE, custom({ customers: 'manage' }))).toEqual([
        'owner_fixed:owner',
      ]);
    }
    // Setting it to what it already is changes nothing.
    expect(codes(OWNER_PROFILE, OWNER_PROFILE, OWNER_PROFILE)).toEqual([]);
    expect(codes(NO_ACCESS_PROFILE, OWNER_PROFILE, OWNER_PROFILE)).toEqual([]);
  });

  it('lets only an owner give the owner profile', () => {
    expect(codes(OWNER_PROFILE, NO_ACCESS_PROFILE, OWNER_PROFILE)).toEqual([]);
    const everything = custom({ customers: 'manage', jobs: 'manage' }, ['wages', 'export_delete']);
    expect(codes(everything, NO_ACCESS_PROFILE, OWNER_PROFILE)).toEqual([
      'owner_beyond_actor:owner',
    ]);
  });

  it('knows the codes it gives', () => {
    expect(TRANSFER_PROBLEM_CODES).toEqual([
      'owner_fixed',
      'owner_beyond_actor',
      'level_beyond_actor',
      'right_beyond_actor',
    ]);
  });
});

describe('the rules that hold for any three profiles', () => {
  it('never gives more than the person has: a change that is allowed raises nothing above the actor', () => {
    fc.assert(
      fc.property(profileArb, customProfileArb, customProfileArb, (actor, current, next) => {
        if (profileChangeProblems(actor, current, next).length > 0) {
          return;
        }
        for (const feature of Object.keys(next.levels)) {
          expect(levelRank(levelOf(next, feature))).toBeLessThanOrEqual(
            Math.max(levelRank(levelOf(current, feature)), levelRank(levelOf(actor, feature))),
          );
        }
        for (const right of next.rights) {
          expect(current.rights.includes(right) || holdsRight(actor, right)).toBe(true);
        }
      }),
    );
  });

  it('refuses every raise above the actor, and says so', () => {
    fc.assert(
      fc.property(customProfileArb, customProfileArb, customProfileArb, (actor, current, next) => {
        const raised = Object.keys(next.levels).filter(
          (feature) =>
            levelRank(levelOf(next, feature)) >
            Math.max(levelRank(levelOf(current, feature)), levelRank(levelOf(actor, feature))),
        );
        const given = next.rights.filter(
          (right) => !current.rights.includes(right) && !actor.rights.includes(right),
        );
        const problems = profileChangeProblems(actor, current, next);
        for (const feature of raised) {
          expect(problems).toContainEqual(
            expect.objectContaining({ code: 'level_beyond_actor', id: feature }),
          );
        }
        for (const right of given) {
          expect(problems).toContainEqual(
            expect.objectContaining({ code: 'right_beyond_actor', id: right }),
          );
        }
      }),
    );
  });

  it('allows a change to what the person already has and to nothing', () => {
    fc.assert(
      fc.property(customProfileArb, (actor) => {
        expect(profileChangeProblems(actor, NO_ACCESS_PROFILE, actor)).toEqual([]);
        expect(profileChangeProblems(actor, NO_ACCESS_PROFILE, NO_ACCESS_PROFILE)).toEqual([]);
      }),
    );
  });

  it('allows a change to nothing only to somebody who holds all that is taken', () => {
    fc.assert(
      fc.property(customProfileArb, customProfileArb, (actor, current: CustomProfile) => {
        const problems = profileChangeProblems(actor, current, NO_ACCESS_PROFILE);
        const holdsAll =
          Object.keys(current.levels).every(
            (feature) => levelRank(levelOf(actor, feature)) >= levelRank(levelOf(current, feature)),
          ) && current.rights.every((right) => holdsRight(actor, right));
        expect(problems.length === 0).toBe(holdsAll);
      }),
    );
  });

  it('never lets an owner profile be taken away by anybody', () => {
    fc.assert(
      fc.property(profileArb, customProfileArb, (actor, next) => {
        expect(profileChangeProblems(actor, OWNER_PROFILE, next).map((p) => p.code)).toEqual([
          'owner_fixed',
        ]);
      }),
    );
  });
});

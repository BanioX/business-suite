import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  NO_ACCESS_PROFILE,
  OWNER_PROFILE,
  PROFILE_TYPES,
  ProfileSchema,
  holdsRight,
  isOwner,
  levelOf,
  profileProblems,
} from '../src';
import { FEATURES, RIGHTS, custom, customProfileArb } from './support';

describe('ProfileSchema', () => {
  it('takes the owner and a custom profile', () => {
    expect(ProfileSchema.parse({ type: 'owner' })).toEqual({ type: 'owner' });
    const profile = { type: 'custom', levels: { customers: 'operate' }, rights: ['wages'] };
    expect(ProfileSchema.parse(profile)).toEqual(profile);
    expect(ProfileSchema.parse(NO_ACCESS_PROFILE)).toEqual(NO_ACCESS_PROFILE);
  });

  it('holds exactly the types that exist', () => {
    expect(PROFILE_TYPES).toEqual(['owner', 'custom']);
  });

  it.each([
    ['a field it does not know on the owner', { type: 'owner', levels: {} }],
    ['a field it does not know on a custom profile', custom_({ extra: 1 })],
    ['a level that does not exist', custom_({ levels: { customers: 'nothing' } })],
    ['a level that is none', custom_({ levels: { customers: 'none' } })],
    ['a feature id in camel case', custom_({ levels: { teamTime: 'view' } })],
    ['a feature id with four segments', custom_({ levels: { 'a.b.c': 'view' } })],
    ['a right in camel case', custom_({ rights: ['exportDelete'] })],
    ['a right twice', custom_({ rights: ['wages', 'wages'] })],
    ['rights that are no list', custom_({ rights: 'wages' })],
    ['no rights', { type: 'custom', levels: {} }],
    ['no levels', { type: 'custom', rights: [] }],
    ['an unknown type', { type: 'stranger' }],
    ['no type', {}],
    ['nothing', undefined],
  ])('refuses %s', (_what, value) => {
    expect(ProfileSchema.safeParse(value).success).toBe(false);
  });

  it('accepts a profile of a newer version that names functions and rights it does not know', () => {
    const profile = custom({ 'future.thing': 'manage', brand_new: 'view' }, ['future.right']);
    expect(ProfileSchema.safeParse(profile).success).toBe(true);
  });

  it('round-trips through JSON for any profile', () => {
    fc.assert(
      fc.property(customProfileArb, (profile) => {
        const stored: unknown = JSON.parse(JSON.stringify(profile));
        expect(ProfileSchema.parse(stored)).toEqual(profile);
      }),
    );
  });
});

function custom_(changes: Record<string, unknown>): Record<string, unknown> {
  return { type: 'custom', levels: {}, rights: [], ...changes };
}

describe('the owner profile', () => {
  it('is fixed: one frozen value, no list that could be edited', () => {
    expect(OWNER_PROFILE).toEqual({ type: 'owner' });
    expect(Object.isFrozen(OWNER_PROFILE)).toBe(true);
    expect(isOwner(OWNER_PROFILE)).toBe(true);
    expect(isOwner(NO_ACCESS_PROFILE)).toBe(false);
  });

  it('may manage every function, also one that does not exist yet, and holds every right', () => {
    for (const feature of [...FEATURES.ids, 'later', 'future.thing']) {
      expect(levelOf(OWNER_PROFILE, feature), feature).toBe('manage');
    }
    for (const right of [...RIGHTS.ids, 'later_right', 'future.right']) {
      expect(holdsRight(OWNER_PROFILE, right), right).toBe(true);
    }
  });

  it('knows no unknown ids: nothing to check', () => {
    expect(profileProblems(OWNER_PROFILE, { features: FEATURES, rights: RIGHTS })).toEqual([]);
  });
});

describe('a custom profile', () => {
  const profile = custom({ customers: 'operate', jobs: 'view' }, ['wages']);

  it('has the level it lists and nothing elsewhere', () => {
    expect(levelOf(profile, 'customers')).toBe('operate');
    expect(levelOf(profile, 'jobs')).toBe('view');
    expect(levelOf(profile, 'team')).toBeUndefined();
    expect(levelOf(NO_ACCESS_PROFILE, 'customers')).toBeUndefined();
  });

  it('holds the rights it lists and no others', () => {
    expect(holdsRight(profile, 'wages')).toBe(true);
    expect(holdsRight(profile, 'export_delete')).toBe(false);
    expect(holdsRight(NO_ACCESS_PROFILE, 'wages')).toBe(false);
  });

  it('does not read a level from the prototype', () => {
    for (const key of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
      expect(levelOf(NO_ACCESS_PROFILE, key), key).toBeUndefined();
      expect(levelOf(custom({}), key), key).toBeUndefined();
    }
  });

  it('is the profile of a person who may nothing: frozen, no level and no right', () => {
    expect(Object.isFrozen(NO_ACCESS_PROFILE)).toBe(true);
    expect(Object.isFrozen(NO_ACCESS_PROFILE.levels)).toBe(true);
    expect(Object.isFrozen(NO_ACCESS_PROFILE.rights)).toBe(true);
    expect(NO_ACCESS_PROFILE).toEqual({ type: 'custom', levels: {}, rights: [] });
  });
});

describe('profileProblems', () => {
  it('finds nothing where every function and right is registered', () => {
    const profile = custom({ customers: 'view', 'muster.visits': 'manage' }, [
      'wages',
      'muster.access_notes',
    ]);
    expect(profileProblems(profile, { features: FEATURES, rights: RIGHTS })).toEqual([]);
  });

  it('names the ids it does not know as data, functions first', () => {
    const profile = custom({ customers: 'view', future: 'manage' }, ['salary', 'wages']);
    const problems = profileProblems(profile, { features: FEATURES, rights: RIGHTS });
    expect(problems.map(({ code, id }) => [code, id])).toEqual([
      ['unknown_feature', 'future'],
      ['unknown_right', 'salary'],
    ]);
    expect(problems[0]?.message).toContain('"future"');
  });
});

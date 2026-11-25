import { describe, expect, it } from 'vitest';
import * as access from '../src';

/**
 * The public surface, name by name. The guard, the pages for profiles and the reconciliation
 * between devices build on it: a name that disappears or appears here is a decision, not an
 * accident. Types are not listed; `tsc` guards them where they are used.
 */
describe('@onestrand/access', () => {
  it('exports exactly these values', () => {
    expect(Object.keys(access).sort()).toEqual(
      [
        // levels
        'levelRank',
        'levelReaches',
        'higherLevel',
        // the register of rights
        'RIGHT_PROBLEM_CODES',
        'RightError',
        'createRightRegistry',
        'rightEntryProblems',
        // profiles
        'PROFILE_TYPES',
        'ProfileSchema',
        'OWNER_PROFILE',
        'NO_ACCESS_PROFILE',
        'isOwner',
        'levelOf',
        'holdsRight',
        'profileProblems',
        // the decision, passing on, the guard, the filter
        'DENIAL_REASONS',
        'decideAccess',
        'TRANSFER_PROBLEM_CODES',
        'profileChangeProblems',
        'guardUseCases',
        'contractAccessProblems',
        'filterRowsForDevice',
      ].sort(),
    );
  });

  it('holds no fixed list of rights and no template but the owner: every package and industry enters its own', () => {
    const registers = Object.values(access).filter(
      (value) => typeof value === 'object' && 'ids' in value && 'has' in value,
    );
    expect(registers).toEqual([]);
    expect(access.PROFILE_TYPES).toEqual(['owner', 'custom']);
  });

  it('keeps its helpers inside', () => {
    for (const name of ['check', 'build', 'describeDenial', 'businessIdOf', 'STRUCTURAL_FIELDS']) {
      expect(Object.keys(access), name).not.toContain(name);
    }
  });
});

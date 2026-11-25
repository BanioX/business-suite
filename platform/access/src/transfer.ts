import { higherLevel, levelReaches } from './levels';
import { holdsRight, isOwner, levelOf, type Profile } from './profile';

/**
 * The rules of passing on (rule R-4): nobody gives more than they have. Whether a person may
 * change the profile of another at all is a right of its own, which the operation that does it
 * names in `access`; here only the question is answered what the change may contain.
 *
 * - `owner_fixed`: the profile to change is the owner profile and the new one is not. The owner
 *   can be neither changed nor taken away.
 * - `owner_beyond_actor`: the new profile is the owner profile, the actor is not an owner.
 * - `level_beyond_actor`: the change touches a function in which the actor has a lower level than
 *   the higher of the old and the new level. Raising a level above the actor's own gives more
 *   than the actor has; lowering one above the actor's own takes away what the actor never had.
 * - `right_beyond_actor`: the change adds or removes a right the actor does not hold.
 */
export const TRANSFER_PROBLEM_CODES = [
  'owner_fixed',
  'owner_beyond_actor',
  'level_beyond_actor',
  'right_beyond_actor',
] as const;
export type TransferProblemCode = (typeof TRANSFER_PROBLEM_CODES)[number];

/** One reason why a change of a profile is not allowed. */
export interface TransferProblem {
  code: TransferProblemCode;
  /** The id of the function or right concerned; `owner` for the owner profile. */
  id: string;
  /** For the log and the tests, in English; the app writes its own sentence to the code. */
  message: string;
}

/**
 * Everything that stands in the way of `actor` setting the profile `current` to `next`. An empty
 * list means the change is allowed (given that the actor may change profiles at all). A change
 * keeps what it leaves as it is: a function or right that is the same in both is not touched, so
 * the actor need not hold it. Pure: it asks nothing of anyone and changes nothing.
 */
export function profileChangeProblems(
  actor: Profile,
  current: Profile,
  next: Profile,
): readonly TransferProblem[] {
  if (isOwner(current)) {
    return isOwner(next)
      ? []
      : [
          {
            code: 'owner_fixed',
            id: 'owner',
            message: 'the owner profile cannot be changed or taken away',
          },
        ];
  }
  if (isOwner(next)) {
    return isOwner(actor)
      ? []
      : [
          {
            code: 'owner_beyond_actor',
            id: 'owner',
            message: 'only an owner can give the owner profile',
          },
        ];
  }
  const problems: TransferProblem[] = [];
  const features = new Set([...Object.keys(current.levels), ...Object.keys(next.levels)]);
  for (const feature of features) {
    const before = levelOf(current, feature);
    const after = levelOf(next, feature);
    if (before === after) {
      continue;
    }
    if (!levelReaches(levelOf(actor, feature), higherLevel(before, after))) {
      problems.push({
        code: 'level_beyond_actor',
        id: feature,
        message: `the actor does not have the level in "${feature}" that the change touches`,
      });
    }
  }
  const touched = [
    ...current.rights.filter((right) => !next.rights.includes(right)),
    ...next.rights.filter((right) => !current.rights.includes(right)),
  ];
  for (const right of touched) {
    if (!holdsRight(actor, right)) {
      problems.push({
        code: 'right_beyond_actor',
        id: right,
        message: `the actor does not hold the right "${right}" that the change touches`,
      });
    }
  }
  return problems;
}

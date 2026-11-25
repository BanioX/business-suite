import { ACCESS_LEVELS, type AccessLevel } from '@onestrand/contract';

/**
 * The levels of access, in order: nothing, `view`, `operate`, `manage` (suite ADR-0004, 6). Nothing
 * is not a value of its own: a person who has no level in a function has `undefined` there, which
 * is also what an operation never asks for. One order everywhere, so a rule such as "at least
 * operate" reads the same in the guard, in the rules of passing on and in the filter.
 */

/** The place of a level in the order; nothing is 0, `view` 1, `operate` 2, `manage` 3. */
export function levelRank(level: AccessLevel | undefined): number {
  return level === undefined ? 0 : ACCESS_LEVELS.indexOf(level) + 1;
}

/** Whether `have` reaches `need`; every level reaches nothing, nothing reaches only nothing. */
export function levelReaches(
  have: AccessLevel | undefined,
  need: AccessLevel | undefined,
): boolean {
  return levelRank(have) >= levelRank(need);
}

/** The higher of two levels. */
export function higherLevel(
  a: AccessLevel | undefined,
  b: AccessLevel | undefined,
): AccessLevel | undefined {
  return levelRank(a) >= levelRank(b) ? a : b;
}

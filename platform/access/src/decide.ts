import type { AccessLevel, OperationAccess } from '@onestrand/contract';
import { holdsRight, levelOf, type Profile } from './profile';
import { levelReaches } from './levels';

/**
 * Who asks, and what is on: the profile of the person and the functions the business has
 * switched on. Both come from outside (a port, see `AccessSource`); this package knows neither
 * the business nor its people. Take `features` from `registry.resolve(...).features` of the
 * register of features, so the core is always among them.
 */
export interface AccessContext {
  readonly profile: Profile;
  /** The ids of the functions that are on. */
  readonly features: readonly string[];
}

/**
 * Why an operation is refused, as a code:
 *
 * - `feature_off`: the function is switched off. For nobody is there an entry into it, not even
 *   for the owner; its data stays.
 * - `level_missing`: the profile has no level in the function, or a lower one than the operation asks for.
 * - `right_missing`: the profile lacks a delicate right the operation names.
 */
export const DENIAL_REASONS = ['feature_off', 'level_missing', 'right_missing'] as const;
export type DenialReason = (typeof DENIAL_REASONS)[number];

export type AccessDecision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: 'feature_off'; readonly feature: string }
  | {
      readonly allowed: false;
      readonly reason: 'level_missing';
      readonly feature: string;
      /** What the operation asks for. */
      readonly needed: AccessLevel;
      /** What the profile has; `undefined` is nothing. */
      readonly held: AccessLevel | undefined;
    }
  | {
      readonly allowed: false;
      readonly reason: 'right_missing';
      readonly feature: string;
      /** Every right the profile lacks, in the order the operation names them. */
      readonly missing: readonly string[];
    };

/**
 * Whether a profile may do what an operation asks (`operation.access`): the function is on, the
 * profile has the level in it, and holds every delicate right named. A pure function of its three
 * inputs; the first thing that fails decides the reason, in the order function, level, rights.
 * Without a level there is no operation, and the owner is no exception to a function that is off.
 */
export function decideAccess(access: OperationAccess, context: AccessContext): AccessDecision {
  const { feature, level, rights = [] } = access;
  if (!context.features.includes(feature)) {
    return { allowed: false, reason: 'feature_off', feature };
  }
  const held = levelOf(context.profile, feature);
  if (!levelReaches(held, level)) {
    return { allowed: false, reason: 'level_missing', feature, needed: level, held };
  }
  const missing = rights.filter((right) => !holdsRight(context.profile, right));
  if (missing.length > 0) {
    return { allowed: false, reason: 'right_missing', feature, missing };
  }
  return { allowed: true };
}

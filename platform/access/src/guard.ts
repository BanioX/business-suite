import {
  CommandError,
  fragmentProblems,
  type ContractFragment,
  type Operation,
  type UseCasesOf,
} from '@onestrand/contract';
import { decideAccess, type AccessContext, type AccessDecision } from './decide';
import type { KnownIds } from './profile';

/**
 * The guard around the use cases (suite ADR-0004, 6; rule R-4): rights are enforced in one place,
 * before an operation runs, not in the pages. It reads what the operation declares in `access`,
 * so a module cannot forget it: an operation without `access` does not compile, and one with a
 * badly formed `access` stops `guardUseCases` before anything runs.
 */

/** What the port is asked: which operation of which business is about to run. */
export interface AccessRequest {
  readonly operation: Operation;
  readonly businessId: string;
}

/**
 * Where the profile of the acting person and the functions that are on come from. The guard
 * knows neither the business nor its people: the app passes a function that does (the person
 * who is signed in on this device, the profile of that person in the business, the functions the
 * business has switched on). It may be asynchronous. If it throws, the operation does not run.
 */
export type AccessSource = (request: AccessRequest) => AccessContext | Promise<AccessContext>;

function describeDenial(
  name: string,
  decision: Exclude<AccessDecision, { allowed: true }>,
): string {
  switch (decision.reason) {
    case 'feature_off':
      return `Operation ${name} is refused: the function "${decision.feature}" is switched off`;
    case 'level_missing':
      return `Operation ${name} is refused: it needs the level "${decision.needed}" in "${decision.feature}", the profile has ${decision.held === undefined ? 'none' : `"${decision.held}"`}`;
    case 'right_missing':
      return `Operation ${name} is refused: the profile lacks the rights ${decision.missing.map((right) => `"${right}"`).join(', ')}`;
  }
}

function businessIdOf(input: unknown): string | undefined {
  if (typeof input !== 'object' || input === null) {
    return undefined;
  }
  const { businessId } = input as { businessId?: unknown };
  return typeof businessId === 'string' ? businessId : undefined;
}

/**
 * The same use cases, each checked before it runs: the guard asks the source for the context of
 * the business named in the input, decides by the `access` of the operation (`decideAccess`) and
 * throws `CommandError('forbidden', ...)` where it says no. The use case then does not run and
 * nothing is written. Commands and queries are both checked.
 *
 * Throws a `TypeError` at once, not when an operation is called, if the contract has an operation
 * that is not well formed (`fragmentProblems`) or without a use case. An input without a
 * `businessId` is refused with `CommandError('invalid')`: no business, no profile.
 */
export function guardUseCases<TContract extends ContractFragment>(
  contract: TContract,
  useCases: UseCasesOf<TContract>,
  source: AccessSource,
): UseCasesOf<TContract> {
  const problems = fragmentProblems(contract);
  if (problems.length > 0) {
    throw new TypeError(
      `The contract cannot be guarded: ${problems.map((p) => `${p.operation} (${p.part}): ${p.message}`).join('; ')}`,
    );
  }
  const guarded: Record<string, (input: unknown) => Promise<unknown>> = {};
  const implemented = useCases as Readonly<
    Record<string, ((input: unknown) => Promise<unknown>) | undefined>
  >;
  for (const [name, operation] of Object.entries(contract)) {
    const run = implemented[name];
    if (typeof run !== 'function') {
      throw new TypeError(`The operation ${name} has no use case to guard`);
    }
    guarded[name] = async (input) => {
      const businessId = businessIdOf(input);
      if (businessId === undefined) {
        throw new CommandError(
          'invalid',
          `Operation ${name} needs a businessId to check the rights`,
        );
      }
      const decision = decideAccess(operation.access, await source({ operation, businessId }));
      if (!decision.allowed) {
        throw new CommandError('forbidden', describeDenial(name, decision));
      }
      return run(input);
    };
  }
  return Object.freeze(guarded) as UseCasesOf<TContract>;
}

/** One operation whose `access` names something the registers do not know. */
export interface ContractAccessProblem {
  operation: string;
  part: 'access.feature' | 'access.rights';
  /** The function or right that is not registered. */
  id: string;
  message: string;
}

/**
 * Every operation of a contract whose `access` names a function or a right that the registers
 * do not know, as data. `fragmentProblems` of the contract checks the form of these ids; this
 * checks that they exist, so an operation cannot ask for a function nobody can switch on (it
 * would be refused for everyone) or for a right nobody can give. The composer of the contract of
 * an edition and the conformity test of an industry call it and expect `[]`.
 */
export function contractAccessProblems(
  contract: ContractFragment,
  registered: KnownIds,
): readonly ContractAccessProblem[] {
  return Object.values(contract).flatMap((operation) => {
    const { feature, rights = [] } = operation.access;
    const problems: ContractAccessProblem[] = [];
    if (!registered.features.has(feature)) {
      problems.push({
        operation: operation.name,
        part: 'access.feature',
        id: feature,
        message: `the register of features has no function "${feature}"`,
      });
    }
    for (const right of rights.filter((id) => !registered.rights.has(id))) {
      problems.push({
        operation: operation.name,
        part: 'access.rights',
        id: right,
        message: `the register of rights has no right "${right}"`,
      });
    }
    return problems;
  });
}

// Origin: BanioX/Randen packages/core/src/contract/index.ts @ e0f0907 — adapted: only the types, as functions of any contract instead of the fixed sum
// Origin: BanioX/Randen packages/core/src/application/command.ts @ e0f0907 — adapted: only the types of a use case, as functions of an operation and of any contract
import type { z } from 'zod';
import type { ContractFragment, Operation } from './operation';

/**
 * Types over a contract. A contract is the sum of the fragments of an edition; these types work
 * on a single fragment just as well, so a module can type its own use cases before any sum
 * exists.
 */

/** What a caller passes to an operation: the input before parsing (ids are plain strings). */
export type OperationInput<TOperation extends Operation> = z.input<TOperation['input']>;

/** What an operation returns: the output after parsing. */
export type OperationOutput<TOperation extends Operation> = z.output<TOperation['output']>;

/** One operation, implemented. */
export type UseCase<TOperation extends Operation> = (
  input: OperationInput<TOperation>,
) => Promise<OperationOutput<TOperation>>;

/**
 * Every operation of a contract, implemented. The type makes sure nothing is missing: an
 * operation without a use case does not compile.
 */
export type UseCasesOf<TContract extends ContractFragment> = {
  [TName in keyof TContract]: UseCase<TContract[TName]>;
};

/** The names of the commands of a contract. */
export type CommandNames<TContract extends ContractFragment> = {
  [TName in keyof TContract & string]: TContract[TName]['kind'] extends 'command' ? TName : never;
}[keyof TContract & string];

/** The names of the queries of a contract. */
export type QueryNames<TContract extends ContractFragment> = {
  [TName in keyof TContract & string]: TContract[TName]['kind'] extends 'query' ? TName : never;
}[keyof TContract & string];

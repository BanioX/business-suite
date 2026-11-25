// Origin: BanioX/Randen packages/core/src/application/command.ts @ e0f0907 — adapted: the kit takes the operation itself instead of a name in a fixed contract; a commandId of another operation or business is refused; the result is checked against the output schema and recorded with its business; error, context and row helper live elsewhere
import type { Id, IsoDateTime } from '@onestrand/core';
import type { z } from 'zod';
import { CommandError } from './errors';
import { DomainEventSchema, type DomainEvent } from './events';
import type { CommandBase, CommandOperation } from './operation';
import type { CommandContext } from './ports';

/** What `createCommandKit` hands to the use cases of a module. */
export interface CommandKit {
  /**
   * Builds a domain event with a fresh id, the actor and the time of the context, and checks
   * it. Nothing is stored; `emit` is the usual way.
   */
  event: (businessId: Id, type: string, payload: Record<string, unknown>) => DomainEvent;
  /** Appends one event; a command calls this at least once. */
  emit: (businessId: Id, type: string, payload?: Record<string, unknown>) => Promise<void>;
  /**
   * Runs a command once. Everything `execute` writes, its events and the entry in the command
   * log happen in one transaction or not at all. A repeated `commandId` does not run `execute`
   * again and returns the stored result.
   *
   * The result is parsed with `operation.output` before it is recorded and returned: fields the
   * schema does not know are dropped, and a result that does not fit fails with a `ZodError` and
   * undoes the command. A `commandId` already recorded for another operation or another business
   * is a `CommandError` with the code `invalid`. A query is refused with a `TypeError`. Pass the
   * parsed input as `command`; it carries both ids.
   */
  runCommand: <TOutput extends z.ZodType>(
    operation: CommandOperation<z.ZodType, TOutput>,
    command: CommandBase,
    execute: () => Promise<z.output<TOutput>>,
  ) => Promise<z.output<TOutput>>;
  /** `createdAt` and `updatedAt` of a new row. */
  stamps: () => { createdAt: IsoDateTime; updatedAt: IsoDateTime };
}

/**
 * What every command needs (suite ADR-0009; ADR-0005 of the origin): one transaction,
 * idempotency by commandId (a repeated command returns the stored result) and domain events
 * with actor and time.
 */
export function createCommandKit({ storage, clock, ids, actor }: CommandContext): CommandKit {
  function event(businessId: Id, type: string, payload: Record<string, unknown>): DomainEvent {
    return DomainEventSchema.parse({
      id: ids.next(),
      type,
      version: 1,
      businessId,
      actor,
      at: clock.now(),
      payload,
    });
  }

  async function emit(
    businessId: Id,
    type: string,
    payload: Record<string, unknown> = {},
  ): Promise<void> {
    await storage.events.append(event(businessId, type, payload));
  }

  async function runCommand<TOutput extends z.ZodType>(
    operation: CommandOperation<z.ZodType, TOutput>,
    { commandId, businessId }: CommandBase,
    execute: () => Promise<z.output<TOutput>>,
  ): Promise<z.output<TOutput>> {
    // The type forbids it; a contract put together without types can still get here.
    const kind: string = operation.kind;
    if (kind !== 'command') {
      throw new TypeError(`runCommand takes a command, but ${operation.name} is a ${kind}`);
    }
    return storage.transaction(async () => {
      const done = await storage.commands.find(commandId);
      if (done !== undefined) {
        // The id was spent on something else. Handing that result out would be a wrong answer
        // that looks right, and across businesses a leak.
        if (done.operation !== operation.name || done.businessId !== businessId) {
          throw new CommandError(
            'invalid',
            `Command ${commandId} was already used for another operation or business`,
          );
        }
        return operation.output.parse(done.result);
      }
      // Checked before it is recorded, so the first answer and every repeated one are the same
      // and a result that breaks the contract undoes the command instead of being stored.
      const result = operation.output.parse(await execute());
      await storage.commands.record({
        commandId,
        businessId,
        operation: operation.name,
        result,
        at: clock.now(),
      });
      return result;
    });
  }

  function stamps(): { createdAt: IsoDateTime; updatedAt: IsoDateTime } {
    const now = clock.now();
    return { createdAt: now, updatedAt: now };
  }

  return { event, emit, runCommand, stamps };
}

import { BusinessSchema, type Business } from '@onestrand/business';
import { createCommandKit, type UseCasesOf } from '@onestrand/contract';
import type { UseCaseEnvironment } from '@onestrand/manifest';
import { alive } from '@onestrand/storage';
import { musterContract } from './contract';
import { ENTRIES_FEATURE, NEWEST_FIRST_OPTION } from './entries';
import { entriesTable, type Entry } from './model';

/**
 * The use cases of `muster`: one for each operation of its fragment, built from what the edition
 * hands every part (`UseCaseEnvironment`: the context of a command with the whole storage, and
 * the registers of the edition). The type asks for exactly the operations of the contract: one
 * left out does not compile.
 *
 * What they do not do, because the platform does it: check the function, the level and the right
 * of the person acting (the guard around them), keep a business apart from another (every row
 * carries its `businessId`), write the backup. A command runs through `runCommand`, so it is one
 * transaction with its event and its entry in the log of commands, and a repeated `commandId`
 * gives the stored result back.
 */

/** The values of the options of the function as the business stored them, read loosely. */
function storedOptions(business: Business | undefined): unknown {
  const parsed = BusinessSchema.safeParse(business);
  return parsed.success ? parsed.data.options[ENTRIES_FEATURE] : undefined;
}

/** By calendar day, then by the moment of writing, then by id: the same order every time. */
function byDay(a: Entry, b: Entry): number {
  for (const [left, right] of [
    [a.on, b.on],
    [a.createdAt, b.createdAt],
    [a.id, b.id],
  ] as const) {
    if (left !== right) {
      return left < right ? -1 : 1;
    }
  }
  return 0;
}

export function createMusterUseCases({
  ctx,
  features,
}: UseCaseEnvironment): UseCasesOf<typeof musterContract> {
  const { emit, runCommand, stamps } = createCommandKit(ctx);
  const entries = ctx.storage.table(entriesTable);
  return {
    'muster.entries.add': async (raw) => {
      const operation = musterContract['muster.entries.add'];
      const input = operation.input.parse(raw);
      return runCommand(operation, input, async () => {
        const entry: Entry = {
          id: ctx.ids.next(),
          businessId: input.businessId,
          on: input.on,
          title: input.title,
          ...stamps(),
        };
        await entries.add(entry);
        await emit(input.businessId, 'muster_entry.added', { entryId: entry.id });
        return { entry };
      });
    },
    'muster.entries.list': async (raw) => {
      const input = musterContract['muster.entries.list'].input.parse(raw);
      // The option is read from the business as the register resolves it: a stored value that
      // fits, the default otherwise.
      const business = await ctx.storage.businesses.get(input.businessId);
      const { values } = features.resolveOptions(ENTRIES_FEATURE, storedOptions(business));
      const sorted = alive(await entries.ofBusiness(input.businessId)).sort(byDay);
      return { entries: values[NEWEST_FIRST_OPTION] === false ? sorted : sorted.reverse() };
    },
  };
}

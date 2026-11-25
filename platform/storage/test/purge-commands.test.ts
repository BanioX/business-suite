// Origin: BanioX/Randen packages/core/test/purge-commands.test.ts @ e0f0907 — adapted: commands of a sample operation run through the command kit on the memory storage; a reset removes the entries of one business and leaves those of the other
import {
  command,
  commandBase,
  CommandError,
  createCommandKit,
  type CommandContext,
} from '@onestrand/contract';
import { IdSchema, nameSchema, type Id } from '@onestrand/core';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { requireRow } from '../src';
import { createTestStorage, type TestStorage } from './support';

const renameNote = command({
  name: 'notes.rename',
  summary: 'Changes the text of a note.',
  access: { feature: 'notes', level: 'operate' },
  input: z.object({ ...commandBase, noteId: IdSchema, text: nameSchema(200) }),
  output: z.object({ noteId: IdSchema, text: z.string() }),
});

/** The sample operation as a use case: the command kit of the contract on the memory storage. */
function useCases(t: TestStorage, actor: Id) {
  const ctx: CommandContext = { storage: t.storage, clock: t.clock, ids: t.ids, actor };
  const { emit, runCommand } = createCommandKit(ctx);
  let runs = 0;
  return {
    runs: () => runs,
    rename: (raw: z.input<typeof renameNote.input>) => {
      const input = renameNote.input.parse(raw);
      return runCommand(renameNote, input, async () => {
        runs += 1;
        const notes = t.storage.table('notes');
        const note = await requireRow(notes, input.businessId, input.noteId, 'Note');
        await notes.put({ ...note, text: input.text, updatedAt: t.clock.now() });
        await emit(input.businessId, 'note.renamed', { noteId: note.id });
        return { noteId: note.id, text: input.text };
      });
    },
  };
}

async function setup() {
  const t = await createTestStorage();
  const mine = t.note(t.one.business.id, 'Notiz von Betrieb Muster');
  const theirs = t.note(t.two.business.id, 'Notiz von Betrieb Beispiel');
  await t.storage.table('notes').add(mine);
  await t.storage.table('notes').add(theirs);
  return { t, mine, theirs, run: useCases(t, t.one.personId) };
}

describe('the command kit on the memory storage', () => {
  it('runs a command once: the row, the event and the entry of the log in one transaction', async () => {
    const { t, mine, run } = await setup();
    const commandId = t.ids.next();
    const input = { commandId, businessId: t.one.business.id, noteId: mine.id, text: 'Neuer Text' };
    const first = await run.rename(input);
    expect(first).toEqual({ noteId: mine.id, text: 'Neuer Text' });
    expect((await t.storage.table('notes').get(mine.id))?.text).toBe('Neuer Text');
    expect(await t.storage.commands.find(commandId)).toEqual({
      commandId,
      businessId: t.one.business.id,
      operation: 'notes.rename',
      result: first,
      at: '2026-11-14T10:00:00.000Z',
    });

    // Repeating the same command is harmless and returns the same result.
    expect(await run.rename({ ...input, text: 'Nochmals anders' })).toEqual(first);
    expect(run.runs()).toBe(1);
    const events = await t.storage.events.ofBusiness(t.one.business.id);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'note.renamed',
      actor: t.one.personId,
      businessId: t.one.business.id,
      payload: { noteId: mine.id },
    });
  });

  it('undoes everything of a command that fails', async () => {
    const { t, theirs, run } = await setup();
    const commandId = t.ids.next();
    // A note of the other business: the use case refuses it after the kit opened the transaction.
    const error = await run
      .rename({ commandId, businessId: t.one.business.id, noteId: theirs.id, text: 'Übernommen' })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(CommandError);
    expect((error as CommandError).code).toBe('not_found');
    expect(await t.storage.table('notes').get(theirs.id)).toEqual(theirs);
    expect(await t.storage.commands.find(commandId)).toBeUndefined();
    expect(await t.storage.events.ofBusiness(t.one.business.id)).toEqual([]);
    expect(await t.storage.events.ofBusiness(t.two.business.id)).toEqual([]);
  });

  it('refuses a command id that another business has used', async () => {
    const { t, mine, theirs, run } = await setup();
    const commandId = t.ids.next();
    await run.rename({ commandId, businessId: t.one.business.id, noteId: mine.id, text: 'Eins' });
    const error = await run
      .rename({ commandId, businessId: t.two.business.id, noteId: theirs.id, text: 'Zwei' })
      .catch((caught: unknown) => caught);
    expect((error as CommandError).code).toBe('invalid');
    expect(await t.storage.table('notes').get(theirs.id)).toEqual(theirs);
  });
});

describe('a reset of a business removes its entries of the command log, and only its own', () => {
  it('forgets the results of its commands, so no name of the business stays on the device', async () => {
    const { t, mine, theirs, run } = await setup();
    const mineId = t.ids.next();
    const theirsId = t.ids.next();
    await run.rename({
      commandId: mineId,
      businessId: t.one.business.id,
      noteId: mine.id,
      text: 'Betrieb Muster, Schlüssel beim Hauswart',
    });
    await run.rename({
      commandId: theirsId,
      businessId: t.two.business.id,
      noteId: theirs.id,
      text: 'Betrieb Beispiel, Lieferung am Montag',
    });
    // The results of the commands are in the log: they carry the new texts.
    expect(await t.storage.commands.find(mineId)).toBeDefined();
    expect(await t.storage.commands.find(theirsId)).toBeDefined();

    await t.storage.purge(t.one.business.id);

    expect(await t.storage.commands.find(mineId)).toBeUndefined();
    expect(await t.storage.businesses.get(t.one.business.id)).toBeUndefined();
    // The other business was not reset: its command is still known and still harmless to repeat.
    expect((await t.storage.commands.find(theirsId))?.businessId).toBe(t.two.business.id);
    const before = run.runs();
    expect(
      await run.rename({
        commandId: theirsId,
        businessId: t.two.business.id,
        noteId: theirs.id,
        text: 'Ein dritter Text',
      }),
    ).toEqual({ noteId: theirs.id, text: 'Betrieb Beispiel, Lieferung am Montag' });
    expect(run.runs()).toBe(before);
  });
});

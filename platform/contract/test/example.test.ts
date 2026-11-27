import { IdSchema, nameSchema, syncFields, type Id } from '@onestrand/core';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  command,
  commandBase,
  CommandError,
  createCommandKit,
  fragmentProblems,
  operationSchemaProblems,
  query,
  queryBase,
  type CommandContext,
  type ContractFragment,
  type UseCasesOf,
} from '../src';
import { createTestContext } from './support';

/**
 * The example of `api.md`, as a test: what the document shows to the agents of the industries
 * compiles and runs. Change both together.
 */

const NoteSchema = z.object({ ...syncFields, text: nameSchema(500) });
type Note = z.infer<typeof NoteSchema>;

// The fragment of a module: key and name are the same.
const notesContract = {
  'notes.add': command({
    name: 'notes.add',
    summary: 'Adds a note to the business.',
    access: { feature: 'notes', level: 'operate' },
    input: z.object({ ...commandBase, text: nameSchema(500) }),
    output: z.object({ note: NoteSchema }),
  }),
  'notes.get': query({
    name: 'notes.get',
    summary: 'Reads one note of the business.',
    access: { feature: 'notes', level: 'view' },
    input: z.object({ ...queryBase, noteId: IdSchema }),
    output: z.object({ note: NoteSchema }),
  }),
} as const satisfies ContractFragment;

// The use cases: the type asks for one per operation of the fragment.
function createNotesUseCases(
  ctx: CommandContext,
  // In a module this is a table of @onestrand/storage.
  notes: { get: (id: Id) => Promise<Note | undefined>; put: (note: Note) => Promise<void> },
): UseCasesOf<typeof notesContract> {
  const { emit, runCommand, stamps } = createCommandKit(ctx);
  return {
    'notes.add': async (raw) => {
      const input = notesContract['notes.add'].input.parse(raw);
      return runCommand(notesContract['notes.add'], input, async () => {
        const { businessId, text } = input;
        const note = { id: ctx.ids.next(), businessId, text, ...stamps() };
        await notes.put(note);
        await emit(businessId, 'note.added', { noteId: note.id });
        return { note };
      });
    },
    'notes.get': async (raw) => {
      const input = notesContract['notes.get'].input.parse(raw);
      const note = await notes.get(input.noteId);
      if (note?.businessId !== input.businessId) {
        throw new CommandError('not_found', `Note ${input.noteId} not found`);
      }
      return { note };
    },
  };
}

describe('the example of api.md', () => {
  function setup() {
    const t = createTestContext();
    const rows = new Map<Id, Note>();
    const useCases = createNotesUseCases(t.ctx, {
      get: (id) => Promise.resolve(rows.get(id)),
      put: (note) => {
        rows.set(note.id, note);
        return Promise.resolve();
      },
    });
    return { t, rows, useCases };
  }

  it('adds a note in a command and reads it in a query', async () => {
    const { t, rows, useCases } = setup();
    const commandId = t.cmd();
    const { note } = await useCases['notes.add']({
      commandId,
      businessId: t.businessId,
      text: ' Schlüssel beim Hauswart ',
    });
    expect(note).toMatchObject({ businessId: t.businessId, text: 'Schlüssel beim Hauswart' });
    expect(await useCases['notes.get']({ businessId: t.businessId, noteId: note.id })).toEqual({
      note,
    });
    expect(t.storage.allEvents()).toMatchObject([
      { type: 'note.added', actor: t.actor, payload: { noteId: note.id } },
    ]);

    // The same command again: the stored answer, no second note.
    expect(
      await useCases['notes.add']({ commandId, businessId: t.businessId, text: 'Anderer Text' }),
    ).toEqual({ note });
    expect(rows.size).toBe(1);

    // Another business does not see it.
    await expect(
      useCases['notes.get']({ businessId: t.otherBusinessId, noteId: note.id }),
    ).rejects.toMatchObject({ name: 'CommandError', code: 'not_found' });
  });

  it('passes the conformity checks a module runs on its fragment', () => {
    expect(fragmentProblems(notesContract)).toEqual([]);
    expect(Object.values(notesContract).flatMap(operationSchemaProblems)).toEqual([]);
  });
});

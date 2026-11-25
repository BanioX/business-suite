import { CommandError } from '@onestrand/contract';
import { describe, expect, it } from 'vitest';
import { alive, requireRow } from '../src';
import { createTestStorage } from './support';

async function refusal(promise: Promise<unknown>): Promise<CommandError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof CommandError) {
      return error;
    }
    throw error;
  }
  throw new Error('Expected the row to be refused');
}

describe('alive', () => {
  it('keeps the rows that are not soft-deleted, in their order', () => {
    const rows = [
      { id: 'a' },
      { id: 'b', deletedAt: '2026-11-14T10:00:00.000Z' },
      { id: 'c', deletedAt: undefined },
      { id: 'd', deletedAt: null },
    ];
    // Only a missing `deletedAt` means alive: null is a value, and it is not ours.
    expect(alive(rows).map((row) => row.id)).toEqual(['a', 'c']);
  });

  it('returns a new list and leaves the given one alone', () => {
    const rows = Object.freeze([{ id: 'a' }]);
    const result = alive(rows);
    expect(result).toEqual(rows);
    expect(result).not.toBe(rows);
    expect(alive([])).toEqual([]);
  });
});

describe('requireRow', () => {
  it('returns the live row of this business', async () => {
    const t = await createTestStorage();
    const note = t.note(t.one.business.id, 'Notiz');
    await t.storage.table('notes').add(note);
    expect(await requireRow(t.storage.table('notes'), t.one.business.id, note.id, 'Note')).toEqual(
      note,
    );
  });

  it('fails with not_found for an id that does not exist, and names what was asked for', async () => {
    const t = await createTestStorage();
    const id = t.ids.next();
    const error = await refusal(requireRow(t.storage.table('notes'), t.one.business.id, id, 'Note'));
    expect(error.code).toBe('not_found');
    expect(error.message).toBe(`Note ${id} not found`);
  });

  it('fails with not_found for a row of another business', async () => {
    const t = await createTestStorage();
    const note = t.note(t.two.business.id, 'Notiz von Betrieb Beispiel');
    await t.storage.table('notes').add(note);
    const error = await refusal(
      requireRow(t.storage.table('notes'), t.one.business.id, note.id, 'Note'),
    );
    // The same answer as for a row that does not exist: nothing tells that it is there.
    expect(error.code).toBe('not_found');
    expect(error.message).toBe(`Note ${note.id} not found`);
  });

  it('fails with not_found for a soft-deleted row', async () => {
    const t = await createTestStorage();
    const note = t.note(t.one.business.id, 'Entfernt', { deletedAt: t.clock.now() });
    await t.storage.table('notes').add(note);
    const error = await refusal(
      requireRow(t.storage.table('notes'), t.one.business.id, note.id, 'Note'),
    );
    expect(error.code).toBe('not_found');
  });

  it('works on a table without soft delete', async () => {
    const t = await createTestStorage();
    const entry = t.timeEntry(t.one.business.id, t.one.personId, 30);
    await t.storage.table('time_entries').add(entry);
    expect(
      await requireRow(t.storage.table('time_entries'), t.one.business.id, entry.id, 'Time entry'),
    ).toEqual(entry);
  });
});

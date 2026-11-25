import { IdSchema, syncFields } from '@onestrand/core';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  createTableRegistry,
  defineTable,
  fieldSensitivity,
  RESERVED_TABLE_NAMES,
  SENSITIVITIES,
  StorageError,
  SYNC_KINDS,
  TABLE_NAME_PATTERN,
  type AnyTableRegistry,
  type StorageErrorCode,
  type TableDefinition,
} from '../src';
import {
  deviceSettingsTable,
  NoteSchema,
  notesTable,
  REGISTRY,
  timeEntriesTable,
  TimeEntrySchema,
} from './support';

/** The code of the `StorageError` a call throws, or what else happened. */
function codeOf(work: () => unknown): StorageErrorCode | 'no error' | 'another error' {
  try {
    work();
  } catch (error) {
    return error instanceof StorageError ? error.code : 'another error';
  }
  return 'no error';
}

/** A definition as somebody without types would write it: whatever is passed goes through. */
function loosely(options: Record<string, unknown>): () => unknown {
  const base = {
    name: 'probe',
    schema: NoteSchema,
    indexes: [],
    sensitivity: 'normal',
    sync: 'device',
  };
  return () => createTableRegistry([{ ...base, ...options } as unknown as TableDefinition]);
}

describe('defineTable', () => {
  it('fills in the defaults: part of the backup, rows may be replaced, no field of its own', () => {
    expect(notesTable).toEqual({
      name: 'notes',
      schema: NoteSchema,
      indexes: ['text'],
      sensitivity: 'normal',
      fields: {},
      sync: 'single_writer',
      backup: true,
      appendOnly: false,
    });
  });

  it('keeps what was declared: compound index, field sensitivity, append-only, no backup', () => {
    expect(timeEntriesTable).toMatchObject({
      name: 'time_entries',
      indexes: [['personId', 'at']],
      sensitivity: 'internal',
      fields: { minutes: 'sensitive' },
      sync: 'ledger',
      backup: true,
      appendOnly: true,
    });
    expect(deviceSettingsTable).toMatchObject({ sync: 'device', backup: false, appendOnly: false });
  });

  it('returns a definition nobody can change afterwards', () => {
    expect(Object.isFrozen(timeEntriesTable)).toBe(true);
    expect(Object.isFrozen(timeEntriesTable.indexes)).toBe(true);
    expect(Object.isFrozen(timeEntriesTable.indexes[0])).toBe(true);
    expect(Object.isFrozen(timeEntriesTable.fields)).toBe(true);
  });

  it('copies indexes and fields, so the lists of the caller stay the caller’s', () => {
    const indexes: ('text' | ['businessId', 'text'])[] = ['text', ['businessId', 'text']];
    const fields: { text?: 'internal' } = { text: 'internal' };
    const table = defineTable({
      name: 'probe',
      schema: NoteSchema,
      indexes,
      sensitivity: 'normal',
      fields,
      sync: 'device',
    });
    indexes.push('text');
    delete fields.text;
    expect(Object.isFrozen(indexes)).toBe(false);
    expect(table.indexes).toEqual(['text', ['businessId', 'text']]);
    expect(table.fields).toEqual({ text: 'internal' });
  });

  it.each(['notes', 'time_entries', 'facility_keys', 'a', 'a1', 'a_1', 'x2_y3'])(
    'accepts the name %s',
    (name) => {
      expect(TABLE_NAME_PATTERN.test(name)).toBe(true);
      expect(codeOf(loosely({ name }))).toBe('no error');
    },
  );

  it.each([
    '',
    'Notes',
    'timeEntries',
    'time-entries',
    'time entries',
    '_notes',
    'notes_',
    'time__entries',
    '1notes',
    'notes.archive',
    'nötes',
  ])('refuses the name %j', (name) => {
    expect(TABLE_NAME_PATTERN.test(name)).toBe(false);
    expect(codeOf(loosely({ name }))).toBe('invalid_table');
  });

  it('refuses a name that is no text', () => {
    expect(codeOf(loosely({ name: 7 }))).toBe('invalid_table');
    expect(codeOf(loosely({ name: undefined }))).toBe('invalid_table');
  });

  it('refuses the names the storage keeps for itself', () => {
    expect(RESERVED_TABLE_NAMES).toEqual(['businesses', 'events', 'commands', 'files']);
    for (const name of RESERVED_TABLE_NAMES) {
      expect(codeOf(loosely({ name })), name).toBe('invalid_table');
    }
  });

  it('refuses a schema that is none, and one whose rows lack an id or a business', () => {
    expect(codeOf(loosely({ schema: undefined }))).toBe('invalid_table');
    expect(codeOf(loosely({ schema: { parse: () => undefined } }))).toBe('invalid_table');
    expect(codeOf(loosely({ schema: z.object({ id: IdSchema }) }))).toBe('invalid_table');
    expect(codeOf(loosely({ schema: z.object({ businessId: IdSchema }) }))).toBe('invalid_table');
    expect(codeOf(loosely({ schema: z.object({ id: IdSchema, businessId: IdSchema }) }))).toBe(
      'no error',
    );
  });

  it('refuses an index on a field the schema does not know', () => {
    expect(codeOf(loosely({ indexes: ['title'] }))).toBe('invalid_table');
    expect(codeOf(loosely({ indexes: [['text', 'title']] }))).toBe('invalid_table');
    expect(() => loosely({ indexes: ['title'] })()).toThrow(
      'Table "probe": the index on "title" names a field the schema does not know',
    );
  });

  it.each([
    ['no list', 'text'],
    ['an empty compound index', [[]]],
    ['a field that is no text', [7]],
    ['a path instead of a field', ['place.room']],
    ['an empty field name', ['']],
    ['the same field twice in one index', [['text', 'text']]],
    ['the same index twice', ['text', 'text']],
    [
      'the same compound index twice',
      [
        ['text', 'id'],
        ['text', 'id'],
      ],
    ],
  ])('refuses indexes with %s', (_what, indexes) => {
    expect(codeOf(loosely({ indexes }))).toBe('invalid_table');
  });

  it('tells a single index from a compound index on the same field', () => {
    expect(codeOf(loosely({ indexes: ['text', ['text', 'id'], ['id', 'text']] }))).toBe('no error');
  });

  it('refuses a sensitivity or a kind of reconciliation that does not exist', () => {
    expect(SENSITIVITIES).toEqual(['normal', 'internal', 'sensitive']);
    expect(SYNC_KINDS).toEqual(['ledger', 'single_writer', 'device', 'computed']);
    expect(codeOf(loosely({ sensitivity: 'secret' }))).toBe('invalid_table');
    expect(codeOf(loosely({ sensitivity: undefined }))).toBe('invalid_table');
    expect(codeOf(loosely({ sync: 'server' }))).toBe('invalid_table');
    expect(codeOf(loosely({ sync: undefined }))).toBe('invalid_table');
  });

  it('refuses field sensitivities that name no field of the schema or no sensitivity', () => {
    expect(codeOf(loosely({ fields: { text: 'sensitive' } }))).toBe('no error');
    expect(codeOf(loosely({ fields: { title: 'sensitive' } }))).toBe('invalid_table');
    expect(codeOf(loosely({ fields: { text: 'secret' } }))).toBe('invalid_table');
    expect(codeOf(loosely({ fields: { 'place.room': 'internal' } }))).toBe('invalid_table');
    expect(codeOf(loosely({ fields: ['text'] }))).toBe('invalid_table');
    expect(codeOf(loosely({ fields: 'text' }))).toBe('invalid_table');
  });

  it('refuses flags that are not true or false', () => {
    expect(codeOf(loosely({ backup: 'no' }))).toBe('invalid_table');
    expect(codeOf(loosely({ appendOnly: 1 }))).toBe('invalid_table');
  });

  it('refuses a ledger whose rows could be replaced', () => {
    const ledger = { schema: TimeEntrySchema, sync: 'ledger' };
    expect(codeOf(loosely(ledger))).toBe('invalid_table');
    expect(codeOf(loosely({ ...ledger, appendOnly: false }))).toBe('invalid_table');
    expect(codeOf(loosely({ ...ledger, appendOnly: true }))).toBe('no error');
    // Append-only without being a ledger is fine: numbers one device hands out.
    expect(codeOf(loosely({ sync: 'single_writer', appendOnly: true }))).toBe('no error');
  });

  it('names the table and the rule in the message', () => {
    expect(() => loosely({ name: 'Notes' })()).toThrow(/^Table "Notes": the name must match/);
    expect(() => loosely({ sync: 'ledger' })()).toThrow(
      'Table "probe": a table reconciled as a ledger must be appendOnly',
    );
  });

  it('cannot look into a schema that is no object schema, and trusts the types there', () => {
    const NoteOrEntry = z.union([NoteSchema, z.object({ ...syncFields, minutes: z.int() })]);
    const table = defineTable({
      name: 'mixed',
      schema: NoteOrEntry,
      indexes: ['text', 'minutes'],
      sensitivity: 'normal',
      fields: { minutes: 'internal' },
      sync: 'device',
    });
    expect(table.indexes).toEqual(['text', 'minutes']);
    // Without types nothing guards the field names of such a schema.
    expect(codeOf(loosely({ schema: NoteOrEntry, indexes: ['title'] }))).toBe('no error');
  });

  it('looks into an object schema with a rule on top', () => {
    const schema = NoteSchema.refine((note) => note.text !== 'x');
    expect(codeOf(loosely({ schema, indexes: ['text'] }))).toBe('no error');
    expect(codeOf(loosely({ schema, indexes: ['title'] }))).toBe('invalid_table');
  });
});

describe('fieldSensitivity', () => {
  it('is the entry of the field, otherwise the sensitivity of the table', () => {
    expect(fieldSensitivity(timeEntriesTable, 'minutes')).toBe('sensitive');
    expect(fieldSensitivity(timeEntriesTable, 'personId')).toBe('internal');
    expect(fieldSensitivity(notesTable, 'text')).toBe('normal');
  });

  it('lets a field be less delicate than its table', () => {
    const table = defineTable({
      name: 'probe',
      schema: NoteSchema,
      indexes: [],
      sensitivity: 'sensitive',
      fields: { text: 'normal' },
      sync: 'device',
    });
    expect(fieldSensitivity(table, 'text')).toBe('normal');
    expect(fieldSensitivity(table, 'tags')).toBe('sensitive');
  });

  it('does not mistake what every object inherits for a field', () => {
    expect(fieldSensitivity(notesTable, 'constructor')).toBe('normal');
    expect(fieldSensitivity(notesTable, 'toString')).toBe('normal');
  });
});

describe('createTableRegistry', () => {
  it('holds the tables in the order of registration', () => {
    expect(REGISTRY.names).toEqual(['notes', 'time_entries', 'device_settings']);
    expect(REGISTRY.tables).toEqual([notesTable, timeEntriesTable, deviceSettingsTable]);
    expect(REGISTRY.get('time_entries')).toEqual(timeEntriesTable);
  });

  it('knows which tables it has', () => {
    expect(REGISTRY.has('notes')).toBe(true);
    expect(REGISTRY.has('customers')).toBe(false);
    expect(REGISTRY.has('constructor')).toBe(false);
  });

  it('fails for a table it does not have, and says which ones it has', () => {
    // As code sees it that works for every register and knows no table by name.
    const anyRegistry: AnyTableRegistry = REGISTRY;
    expect(codeOf(() => anyRegistry.get('customers'))).toBe('unknown_table');
    expect(() => anyRegistry.get('customers')).toThrow(
      'Unknown table "customers"; registered: notes, time_entries, device_settings',
    );
  });

  it('refuses the same name twice', () => {
    expect(codeOf(() => createTableRegistry([notesTable, notesTable]))).toBe('duplicate_table');
    expect(codeOf(() => REGISTRY.extend([timeEntriesTable]))).toBe('duplicate_table');
    expect(() => createTableRegistry([notesTable, notesTable])).toThrow(
      'Table "notes" is registered twice',
    );
  });

  it('can be empty', () => {
    const empty = createTableRegistry([]);
    expect(empty.names).toEqual([]);
    expect(empty.tables).toEqual([]);
    expect(empty.has('notes')).toBe(false);
  });

  it('is frozen, and so are its lists', () => {
    expect(Object.isFrozen(REGISTRY)).toBe(true);
    expect(Object.isFrozen(REGISTRY.names)).toBe(true);
    expect(Object.isFrozen(REGISTRY.tables)).toBe(true);
  });

  it('gives a new register from extend and stays as it is', () => {
    const small = createTableRegistry([notesTable]);
    const extended = small.extend([timeEntriesTable]);
    expect(small.names).toEqual(['notes']);
    expect(extended.names).toEqual(['notes', 'time_entries']);
    expect(extended.get('time_entries')).toEqual(timeEntriesTable);
    expect(extended.extend([deviceSettingsTable]).names).toEqual(REGISTRY.names);
  });

  it('holds a definition written by hand to the rules of defineTable', () => {
    expect(codeOf(loosely({ name: 'Bad Name' }))).toBe('invalid_table');
    const byHand = createTableRegistry([
      {
        name: 'by_hand',
        schema: NoteSchema,
        indexes: [],
        sensitivity: 'normal',
        sync: 'device',
      } as unknown as TableDefinition,
    ]);
    // The defaults are filled in for it as well.
    expect(byHand.tables[0]).toMatchObject({ backup: true, appendOnly: false, fields: {} });
  });
});

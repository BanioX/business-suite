import { IdSchema, IsoDateTimeSchema, nameSchema, syncFields } from '@onestrand/core';
import { createTableRegistry, defineTable } from '@onestrand/storage';
import { z } from 'zod';

/**
 * A made-up register for the tests of this package: an ordinary table, an append-only one and
 * one that stays out of the backup. No module of the suite owns these tables.
 */

export const NoteSchema = z.object({
  ...syncFields,
  text: nameSchema(200),
  fileId: IdSchema.optional(),
});
export type Note = z.infer<typeof NoteSchema>;

/** A booking of minutes: rows are added, never replaced. */
export const TimeEntrySchema = z.object({
  id: IdSchema,
  businessId: IdSchema,
  personId: IdSchema,
  minutes: z.int(),
  at: IsoDateTimeSchema,
});
export type TimeEntry = z.infer<typeof TimeEntrySchema>;

export const DeviceSettingSchema = z.object({
  id: IdSchema,
  businessId: IdSchema,
  key: nameSchema(60),
  value: z.string(),
});

export const notesTable = defineTable({
  name: 'notes',
  schema: NoteSchema,
  indexes: ['text'],
  sensitivity: 'normal',
  sync: 'single_writer',
});

export const timeEntriesTable = defineTable({
  name: 'time_entries',
  schema: TimeEntrySchema,
  indexes: [['personId', 'at']],
  sensitivity: 'internal',
  sync: 'ledger',
  appendOnly: true,
});

export const deviceSettingsTable = defineTable({
  name: 'device_settings',
  schema: DeviceSettingSchema,
  indexes: ['key'],
  sensitivity: 'normal',
  sync: 'device',
  backup: false,
});

export const REGISTRY = createTableRegistry([notesTable, timeEntriesTable, deviceSettingsTable]);
export type Registry = typeof REGISTRY;

/** The bytes of a text, for files of the tests. */
export function bytesOf(text: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(text);
}

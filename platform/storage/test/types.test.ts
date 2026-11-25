import type { CommandContext, CommandLogEntry, CommandStorage } from '@onestrand/contract';
import { IdSchema, type Id } from '@onestrand/core';
import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import {
  BusinessBaseSchema,
  createBackupCipher,
  createBackupKit,
  createMemoryStorage,
  createTableRegistry,
  createWebCryptoHasher,
  defineTable,
  type AnyTableRegistry,
  type BackupCheck,
  type BackupDocument,
  type BusinessBase,
  type CheckedBackup,
  type FileMeta,
  type Hasher,
  type ModuleStorage,
  type RecordStore,
  type Rows,
  type RowsOf,
  type Storage,
  type StoredRow,
  type TableDefinition,
  type TableName,
  type TableRegistry,
} from '../src';
import {
  fixedClock,
  hasher,
  NoteSchema,
  notesTable,
  REGISTRY,
  sequentialIds,
  timeEntriesTable,
  type DeviceSetting,
  type Note,
  type Registry,
  type TimeEntry,
} from './support';

/**
 * The types the next layers build on: what must compile and what must not. Vitest runs these as
 * no-ops; the typecheck of the package (`tsc -p tsconfig.json`) is what gives them teeth.
 */

const ports = { hasher, clock: fixedClock(), ids: sequentialIds() };

/** Takes code that is only compiled and never run: calls that would fail if they happened. */
function typesOnly(probe: () => void): void {
  expectTypeOf(probe).toBeFunction();
}

describe('types of the table register', () => {
  it('knows the name and the row type of a table', () => {
    expectTypeOf(notesTable).toEqualTypeOf<TableDefinition<'notes', Note>>();
    expectTypeOf<Rows<Registry>['notes']>().toEqualTypeOf<Note>();
    expectTypeOf<Rows<Registry>['time_entries']>().toEqualTypeOf<TimeEntry>();
    expectTypeOf<Rows<Registry>['device_settings']>().toEqualTypeOf<DeviceSetting>();
    expectTypeOf<TableName<Registry>>().toEqualTypeOf<
      'notes' | 'time_entries' | 'device_settings'
    >();
    expectTypeOf(REGISTRY.get('notes')).toEqualTypeOf<TableDefinition<'notes', Note>>();
    expectTypeOf(REGISTRY.names).toEqualTypeOf<
      readonly ('notes' | 'time_entries' | 'device_settings')[]
    >();
    typesOnly(() => {
      // @ts-expect-error a table the register does not have
      REGISTRY.get('customers');
    });
  });

  it('narrows a name with has', () => {
    const narrowed = (name: string) => {
      if (REGISTRY.has(name)) {
        expectTypeOf(name).toEqualTypeOf<'notes' | 'time_entries' | 'device_settings'>();
      } else {
        expectTypeOf(name).toEqualTypeOf<string>();
      }
    };
    narrowed('notes');
  });

  it('adds the tables of extend to the type', () => {
    const small = createTableRegistry([notesTable]);
    expectTypeOf<TableName<typeof small>>().toEqualTypeOf<'notes'>();
    const extended = small.extend([timeEntriesTable]);
    expectTypeOf(extended.names).toEqualTypeOf<readonly ('notes' | 'time_entries')[]>();
    expectTypeOf(extended.get('time_entries')).toEqualTypeOf<
      TableDefinition<'time_entries', TimeEntry>
    >();
    expectTypeOf<Rows<typeof extended>['time_entries']>().toEqualTypeOf<TimeEntry>();
    expectTypeOf<Rows<typeof extended>['notes']>().toEqualTypeOf<Note>();
    expectTypeOf<RowsOf<readonly [typeof notesTable]>>().toEqualTypeOf<{ notes: Note }>();
    typesOnly(() => {
      // @ts-expect-error a table that was not added
      extended.get('device_settings');
    });
  });

  it('infers the row type from the schema, whatever the schema is made of', () => {
    const Loose = z.looseObject({ id: IdSchema, businessId: IdSchema, minutes: z.int() });
    const loose = defineTable({
      name: 'loose_rows',
      schema: Loose,
      indexes: ['minutes'],
      sensitivity: 'normal',
      sync: 'device',
    });
    expectTypeOf(loose).toEqualTypeOf<TableDefinition<'loose_rows', z.infer<typeof Loose>>>();
    const registry = createTableRegistry([loose, notesTable]);
    expectTypeOf(registry.get('loose_rows')).toEqualTypeOf(loose);
    expectTypeOf<Rows<typeof registry>['loose_rows']['minutes']>().toBeNumber();
    expectTypeOf<Rows<typeof registry>['loose_rows']['id']>().toEqualTypeOf<Id>();
    expectTypeOf<Rows<typeof registry>['notes']>().toEqualTypeOf<Note>();
  });

  it('is a register of any tables for code that works for every register', () => {
    expectTypeOf(REGISTRY).toExtend<AnyTableRegistry>();
    expectTypeOf(notesTable).toExtend<TableDefinition>();
    expectTypeOf<TableName<AnyTableRegistry>>().toEqualTypeOf<string>();
    expectTypeOf<Rows<AnyTableRegistry>['whatever']>().toEqualTypeOf<StoredRow>();
    expectTypeOf<TableRegistry<{ notes: Note }>['names']>().toEqualTypeOf<readonly 'notes'[]>();
  });

  it('checks the field names of indexes and fields against the row type', () => {
    const base = {
      name: 'probe',
      schema: NoteSchema,
      sensitivity: 'normal',
      sync: 'device',
    } as const;
    defineTable({ ...base, indexes: ['text', ['businessId', 'updatedAt']] });
    typesOnly(() => {
      // @ts-expect-error an index on a field the row does not have
      defineTable({ ...base, indexes: ['title'] });
      // @ts-expect-error a compound index with a field the row does not have
      defineTable({ ...base, indexes: [['text', 'title']] });
      // @ts-expect-error a sensitivity for a field the row does not have
      defineTable({ ...base, indexes: [], fields: { title: 'sensitive' } });
      // @ts-expect-error a sensitivity that does not exist
      defineTable({ ...base, indexes: [], fields: { text: 'secret' } });
      // @ts-expect-error a schema whose rows carry no ids
      defineTable({ ...base, indexes: [], schema: z.object({ text: z.string() }) });
      // @ts-expect-error a kind of reconciliation that does not exist
      defineTable({ ...base, indexes: [], sync: 'server' });
    });
  });
});

describe('types of the storage', () => {
  const storage = createMemoryStorage(REGISTRY, ports);

  it('hands out a table by name with the row type of the register', () => {
    expectTypeOf(storage).toEqualTypeOf<Storage<Registry>>();
    expectTypeOf(storage.table('notes')).toEqualTypeOf<RecordStore<Note>>();
    expectTypeOf(storage.table('time_entries')).toEqualTypeOf<RecordStore<TimeEntry>>();
    typesOnly(() => {
      // @ts-expect-error a table the register does not have
      storage.table('customers');
    });
  });

  it('hands out a table by definition with the row type of the definition', () => {
    expectTypeOf(storage.table(notesTable)).toEqualTypeOf<RecordStore<Note>>();
    expectTypeOf(storage.table(REGISTRY.get('time_entries'))).toEqualTypeOf<
      RecordStore<TimeEntry>
    >();
    const anyTable: TableDefinition = notesTable;
    expectTypeOf(storage.table(anyTable)).toEqualTypeOf<RecordStore<StoredRow>>();
  });

  it('fits everywhere a module, a kit or a command asks for less', () => {
    expectTypeOf(storage).toExtend<ModuleStorage>();
    expectTypeOf(storage).toExtend<CommandStorage>();
    const forModule: ModuleStorage = storage;
    expectTypeOf(forModule.table(notesTable)).toEqualTypeOf<RecordStore<Note>>();
    const context: CommandContext = { ...ports, storage, actor: ports.ids.next() };
    expectTypeOf(context.storage).toEqualTypeOf<CommandStorage>();
  });

  it('fits a module whatever the business row of the edition is', () => {
    const FullBusinessSchema = BusinessBaseSchema.extend({ currency: z.literal('CHF') });
    type FullBusiness = z.infer<typeof FullBusinessSchema>;
    const full = createMemoryStorage<Registry, FullBusiness>(REGISTRY, ports);
    expectTypeOf(full.businesses.get).returns.resolves.toEqualTypeOf<FullBusiness | undefined>();
    expectTypeOf(full).toExtend<ModuleStorage>();
    // The business row is part of the type: a storage of one edition is not that of another.
    expectTypeOf(full).not.toExtend<Storage<Registry>>();
    expectTypeOf<FullBusiness>().toExtend<BusinessBase>();

    // The backup of that edition carries the same row, checked with the schema of the edition.
    const kit = createBackupKit({
      format: 'sample-backup',
      version: 1,
      registry: REGISTRY,
      hasher,
      businessSchema: FullBusinessSchema,
    });
    expectTypeOf(kit.checkBackup).returns.resolves.toEqualTypeOf<
      BackupCheck<Registry, FullBusiness>
    >();
    expectTypeOf<
      CheckedBackup<Registry, FullBusiness>['business']['currency']
    >().toEqualTypeOf<'CHF'>();
    typesOnly(() => {
      // @ts-expect-error the storage of an edition with another business row
      void kit.exportBackup(storage, ports.ids.next(), ports);
      void kit.exportBackup(full, ports.ids.next(), ports);
    });
  });

  it('is what the ports of the storage ask for, and nothing wider', () => {
    expectTypeOf(storage.files.put).returns.resolves.toEqualTypeOf<FileMeta>();
    expectTypeOf(storage.files.verify).returns.resolves.toBeBoolean();
    expectTypeOf(storage.purge).parameter(0).toEqualTypeOf<Id>();
    expectTypeOf(storage.commands.find).returns.resolves.toEqualTypeOf<
      CommandLogEntry | undefined
    >();
    expectTypeOf(hasher).toEqualTypeOf<Hasher>();
    // Tables are reached through `table`, never as properties of the storage.
    expectTypeOf(storage).not.toHaveProperty('notes');
  });

  it('does not let a row of one table into another', () => {
    typesOnly(() => {
      const entry = null as unknown as TimeEntry;
      // @ts-expect-error a booking is not a note
      void storage.table('notes').add(entry);
      // @ts-expect-error a row needs the business it belongs to
      void storage.table('notes').add({ id: null as unknown as Id, text: 'x' });
    });
  });
});

describe('types of the backup', () => {
  it('carries the register and the business row through the kit', () => {
    const kit = createBackupKit({
      format: 'sample-backup',
      version: 1,
      registry: REGISTRY,
      hasher,
    });
    expectTypeOf(kit.exportBackup).returns.resolves.toEqualTypeOf<BackupDocument<Registry>>();
    expectTypeOf<BackupDocument<Registry>['tables']['notes']>().toEqualTypeOf<Note[] | undefined>();
    expectTypeOf<CheckedBackup<Registry>['business']>().toEqualTypeOf<Readonly<BusinessBase>>();
    // The rows of a checked backup are lists nobody adds to.
    expectTypeOf<CheckedBackup<Registry>['tables']['notes']>().toEqualTypeOf<
      readonly Note[] | undefined
    >();
    typesOnly(() => {
      const backup = null as unknown as CheckedBackup<Registry>;
      // @ts-expect-error a checked backup is not put together or changed by hand
      backup.tables = {};
    });
    expectTypeOf(kit.checkBackup).parameter(0).toBeUnknown();
    typesOnly(() => {
      // @ts-expect-error restoreBackup takes the checked backup, not what was read from a file
      void kit.restoreBackup(createMemoryStorage(REGISTRY, ports), { business: {}, tables: {} });
    });
  });

  it('takes WebCrypto of the runtime as it is', () => {
    expectTypeOf(createWebCryptoHasher).toBeCallableWith(globalThis.crypto);
    const cipher = createBackupCipher({ crypto: globalThis.crypto, format: 'sample-encrypted' });
    expectTypeOf(cipher.encryptBackup).returns.resolves.toBeString();
  });
});

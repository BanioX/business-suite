# @onestrand/storage (P-03, P-05)

Der Speicher der Suite: Ports, das Tabellen-Register, der Speicher im Arbeitsspeicher, Dateien mit Prüfsumme, die Sicherung und ihr Passwortschutz. Reines TypeScript ohne Browser und ohne Node; baut auf `@onestrand/core`, `@onestrand/contract` und `zod`. Die Plattform kennt keine feste Liste von Tabellen und keinen Formatnamen: Beides bringt die Ausgabe mit.

```ts
import { createMemoryStorage, createTableRegistry, defineTable, requireRow } from '@onestrand/storage';
```

## Was das Paket exportiert

| Bereich | Exporte | Wozu |
| --- | --- | --- |
| Ports eines Befehls | `Clock`, `IdGenerator`, `CommandLog`, `CommandLogEntry`, `EventLog`, `Transactional`, `CommandStorage`, `CommandContext` | aus `@onestrand/contract` weitergereicht |
| Speicher-Ports | `Storage`, `ModuleStorage`, `TableAccess`, `RecordStore`, `BusinessStore`, `FileStore`, `alive`, `requireRow` | was ein Use Case vom Speicher sieht |
| Tabellen-Register | `defineTable`, `createTableRegistry`, `fieldSensitivity`, `TableDefinition`, `TableOptions`, `TableRegistry`, `AnyTableRegistry`, `Rows`, `RowsOf`, `RowTypes`, `TableName`, `TableIndex`, `StoredRow`, `Sensitivity`, `SyncKind`, `SENSITIVITIES`, `SYNC_KINDS`, `TABLE_NAME_PATTERN`, `RESERVED_TABLE_NAMES` | Tabellen melden sich an: Schema, Indizes, Heikelkeit, Abgleich-Art |
| Betrieb | `BusinessBaseSchema`, `BusinessBase` | das Mindeste eines Betriebs; das volle Modell kommt mit `@onestrand/business` |
| Arbeitsspeicher | `createMemoryStorage`, `MemoryStoragePorts` | für Tests und als Referenz für jeden Adapter |
| Dateien | `FileMetaSchema`, `FileMeta`, `NewFile`, `StoredFile`, `Hasher`, `sha256Of`, `matchesChecksum`, `assertChecksum`, `parseFileMeta`, `copyOfBytes`, `SHA256_PATTERN`, `MEDIA_TYPE_PATTERN` | Bytes mit Prüfsumme; die Helfer braucht, wer `FileStore` selbst umsetzt |
| WebCrypto | `createWebCryptoHasher`, `DigestCrypto`, `CipherCrypto`, `Pbkdf2Params`, `AesGcmParams` | `crypto` kommt als Parameter herein |
| Sicherung | `createBackupKit`, `BackupKit`, `BackupKitOptions`, `BackupDocument`, `BackupRows`, `BackupFile`, `BackupCheck`, `BackupPreview`, `BackupProblem`, `BackupProblemKind`, `CustomBackupProblemKind`, `BACKUP_PROBLEM_KINDS`, `CheckedBackup`, `CheckedRows`, `RestoreResult`, `BackupReader` | schreiben, prüfen, zurückholen |
| Passwort | `createBackupCipher`, `BackupCipher`, `BackupCipherOptions`, `EncryptedBackup`, `WrongPasswordError`, `InvalidEnvelopeError`, `MIN_PASSWORD_LENGTH` | Umschlag um die Sicherung |
| Reine Daten | `plainCopy`, `keepUnknownFields`, `isPlainRecord` | Kopie wie durch eine Datei; lockeres Lesen |
| Text und Bytes | `utf8Encode`, `utf8Decode`, `base64Encode`, `base64Decode`, `hexEncode` | ohne `TextEncoder` und `btoa`; streng beim Lesen |
| Fehler | `StorageError`, `StorageErrorCode` | Fehler des Programms, mit Code |

## Regeln, die du kennen musst

1. **Tabelle anmelden:** `defineTable({ name, schema, indexes, sensitivity, fields?, sync, backup?, appendOnly? })`. Der Name ist klein mit Unterstrich (`time_entries`); Tabellen einer Branche tragen ihr Präfix (`facility_keys`). `businesses`, `events`, `commands` und `files` gehören dem Speicher. Jede Zeile hat `id` und `businessId` (`syncFields` aus dem Kern). `indexes` nennt Felder der Zeile, ein zusammengesetzter Index ist eine Liste. `sync: 'ledger'` verlangt `appendOnly: true`. `backup: false` hält eine Tabelle aus der Sicherung (Gerät, berechnet). Ein Name wird nie umbenannt, sobald eine Ausgabe damit ausgeliefert ist.
2. **Register:** Die Ausgabe baut es mit `createTableRegistry([...])`; `extend` gibt ein neues zurück. `Rows<typeof REGISTER>['notes']` ist der Zeilentyp.
3. **Tabelle holen:** Die Ausgabe nimmt `storage.table('notes')`. Ein Modul oder ein Kit kennt das Register nicht: Es verlangt `ModuleStorage` und nimmt `storage.table(notesTable)`. Passt die Definition nicht zur angemeldeten Tabelle (anderes Schema, anderes `appendOnly`), kommt `unknown_table`.
4. **Der Speicher prüft kein Schema und kürzt nichts:** Felder, die kein Schema kennt, bleiben stehen. Eine Zeile ist reine Daten, wie JSON sie trägt: kein `Date`, keine `Map`, keine Bytes, kein `NaN`, kein fehlender Wert in einer Liste (`not_plain`). Ein Feld ohne Wert fällt weg, `-0` wird `0`. Ohne `id` oder `businessId` kommt `invalid_id`. Prüfe Eingaben im Use Case mit dem Schema, bevor du schreibst.
5. **Mehrere Betriebe je Gerät:** Jede Zeile, jedes Ereignis, jede Datei und jeder Eintrag im Befehlsprotokoll gehört einem Betrieb. `get(id)` kennt den Betrieb nicht: Nimm `requireRow(store, businessId, id, 'Note')` oder vergleiche `businessId` selbst, auch bei `files.get`. `put` übernimmt keine Zeile eines anderen Betriebs (`other_business`). `purge(businessId)` entfernt genau diesen Betrieb mit allem und keinen anderen.
6. **Löschen ist weich:** `deletedAt` setzen; `ofBusiness` liefert auch gelöschte Zeilen, `alive(rows)` filtert sie. In einer Tabelle mit `appendOnly` scheitert `put` auf eine bestehende `id` (`append_only`): Korrektur ist eine neue Zeile.
7. **Transaktion:** alles oder nichts, auch Dateien, Ereignisse und Befehlsprotokoll. Eine Transaktion in einer anderen schliesst sich an und teilt ihr Schicksal: Scheitert die innere, scheitert die äussere am Ende mit demselben Fehler, auch wenn du ihn gefangen hast. Ein einzelner abgelehnter Aufruf (etwa `exists`), den du fängst, hält die Transaktion nicht auf. Überlappen dürfen sich Transaktionen nicht (siehe `@onestrand/contract`, Regel 7).
8. **Dateien:** `storage.files.put({ businessId, bytes, mediaType, name? })` gibt `FileMeta` mit `id`, `sha256` und `size` zurück; die Zeile merkt sich nur die `id`, nie die Bytes und nie eine Data-URL. `mediaType` ist klein und ohne Parameter; meldet der Browser keinen Typ, nimm `application/octet-stream`. Eine Datei wird nie geändert und nicht einzeln gelöscht; `verify(id)` rechnet die Prüfsumme nach.
9. **WebCrypto als Parameter:** `createWebCryptoHasher(crypto)` und `createBackupCipher({ crypto, format })`. Im Browser ist das `crypto`, im Test `globalThis.crypto`.
10. **Sicherung:** `createBackupKit({ format, version, registry, hasher, businessSchema?, readers?, validate? })`. Formatname und Version gehören der Ausgabe und sind für immer eingefroren. Das Dokument: `{ format, version, exportedAt, business, tables, counts, files }`, weich gelöschte Zeilen inbegriffen. Ereignisse, das Befehlsprotokoll und Tabellen mit `backup: false` stehen nicht darin. `exportBackup` schreibt, was gespeichert ist, ungeprüft: Prüfe das Dokument gleich danach mit `checkBackup`, bevor die Datei als Sicherung gilt.
11. **Prüfen:** `checkBackup(data)` ändert nichts und gibt `{ preview, backup? }` zurück. Befunde sind Daten (`kind`: `format`, `version`, `field`, `business`, `table`, `row`, `count`, `file`), nie geworfen. Eine neuere Version, eine unbekannte Tabelle und ein unbekanntes Feld des Dokuments weisen die Datei ab, weil sie sich nicht halten liessen. Ein unbekanntes Feld in einer Zeile, im Betrieb oder in den Angaben einer Datei bleibt in jeder Tiefe erhalten. Was das Schema kennt, gewinnt: Ein Name kommt gekürzt zurück, Vorgabewerte werden gesetzt. Ältere Versionen liest `readers[n]` (von `n` nach `n + 1`). Eigene Regeln kommen mit `validate` und tragen die Art `<namensraum>.<was>`.
12. **Zurückholen:** `restoreBackup(storage, backup)` nimmt nur, was `checkBackup` desselben Kits zurückgab; es ist in jeder Tiefe eingefroren. Der Betrieb der Datei ersetzt den mit derselben `id` (samt dessen Ereignissen, Befehlsprotokoll und Geräte-Tabellen); kein anderer Betrieb wird berührt, alles in einer Transaktion. Frag die Person vorher, wenn `preview.businessId` schon auf dem Gerät ist. Das Ereignis danach schreibt der Aufrufer.
13. **Passwort:** `encryptBackup(text, password)` gibt den Umschlag als JSON-Text. Beim Lesen sagt `readEnvelope(json)`: Umschlag, `'invalid'` (beschädigt) oder `'plain'` (gewöhnliche Sicherung). `decryptBackup` wirft `WrongPasswordError` (falsches Passwort oder veränderte Datei) oder `InvalidEnvelopeError`. Der Formatname des Umschlags gehört der Ausgabe wie der der Sicherung. `MIN_PASSWORD_LENGTH` prüft das Formular, nicht der Schutz.
14. **Fehler:** `StorageError` trägt einen `code` (`invalid_table`, `duplicate_table`, `unknown_table`, `exists`, `append_only`, `other_business`, `invalid_id`, `invalid_file`, `not_plain`, `checksum`) und meint einen Fehler des Programms. Was die Person beheben kann, wirft der Use Case als `CommandError`.

## Beispiel

```ts
import { nameSchema, syncFields, type Id } from '@onestrand/core';
import {
  alive, createBackupKit, createMemoryStorage, createTableRegistry, createWebCryptoHasher,
  defineTable, requireRow, type ModuleStorage,
} from '@onestrand/storage';
import { z } from 'zod';

// Ein Modul meldet seine Tabelle an.
const NoteSchema = z.object({ ...syncFields, text: nameSchema(500) });
export const notesTable = defineTable({
  name: 'notes',
  schema: NoteSchema,
  indexes: ['updatedAt'],
  sensitivity: 'internal',
  sync: 'single_writer',
});

// Im Modul: nur die eigene Tabelle, über ihre Definition.
export async function noteOf(storage: ModuleStorage, businessId: Id, noteId: Id) {
  return requireRow(storage.table(notesTable), businessId, noteId, 'Note'); // CommandError not_found
}

// In der Ausgabe (oder im Test): Register, Speicher, Sicherung. `clock`, `ids` und `businessId`
// kommen aus dem Kontext, im Test aus `@onestrand/testing`.
const REGISTER = createTableRegistry([notesTable]);
const hasher = createWebCryptoHasher(globalThis.crypto);
const storage = createMemoryStorage(REGISTER, { hasher, clock, ids });
const notes = alive(await storage.table('notes').ofBusiness(businessId));

const backups = createBackupKit({ format: 'sample-backup', version: 1, registry: REGISTER, hasher });
const document = await backups.exportBackup(storage, businessId, { clock });
const { preview, backup } = await backups.checkBackup(JSON.parse(JSON.stringify(document)));
if (backup !== undefined) {
  await backups.restoreBackup(storage, backup); // ersetzt genau diesen Betrieb
} else {
  console.warn(preview.problems); // [{ kind: 'row', table: 'notes', id: '…' }, …]
}
```

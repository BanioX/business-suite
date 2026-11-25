# @onestrand/web-data (P-03)

Die Daten auf dem Gerät: die Speicher-Ports von `@onestrand/storage` auf IndexedDB, das Schema-Ledger der Datenbank, der Speicher des Geräts (`deviceKey`) und der Start einer zusammengesetzten Ausgabe. Das Paket gehört zur Schicht «Browser» ([`docs/architektur.md`](../../docs/architektur.md), 3.2): Es darf `indexedDB`, `localStorage`, `navigator` und `crypto` anfassen, aber kein React, keine Branche und kein Node. Es baut auf `@onestrand/core`, `@onestrand/contract`, `@onestrand/storage`, `@onestrand/business`, `@onestrand/manifest` und `zod`; eine Bibliothek für IndexedDB (Dexie) braucht es nicht. Die Plattform kennt keine feste Liste von Tabellen und keinen Datenbanknamen: Beides bringt die Ausgabe mit.

```ts
import { openEditionData, proposeSchemaStep, schemaLedgerProblems } from '@onestrand/web-data';
```

## Was das Paket exportiert

| Bereich | Exporte | Wozu |
| --- | --- | --- |
| Speicher auf IndexedDB | `openIndexedDbStorage`, `IndexedDbStorage`, `IndexedDbStorageOptions`, `IndexedDbStoragePorts`, `RowMigration` | der ganze Port `Storage` auf einer Datenbank des Browsers; Tabellen und Indizes aus dem Register |
| Schema-Ledger | `SchemaLedger`, `SchemaStep`, `SchemaTable`, `SchemaIndexAddition`, `schemaLedgerProblems`, `proposeSchemaStep`, `schemaOf`, `indexName`, `indexKeyPath`, `SchemaProblem`, `SchemaProblemCode`, `SCHEMA_PROBLEM_CODES`, `SchemaLedgerInput`, `MigrationReference` | die Geschichte des Schemas als Daten, die Prüfung gegen das Register, der nächste Schritt |
| Speicher des Geräts | `deviceKey`, `DEVICE_NAMES`, `DeviceStore`, `KeyValueStore`, `createMemoryDeviceStore`, `createBrowserDeviceStore` | was zum Gerät und nicht zum Betrieb gehört, unter dem Präfix der Ausgabe |
| Browser | `createBrowserClock`, `createBrowserIds`, `requestPersistentStorage` | Uhr, IDs und dauerhafter Speicher des Browsers |
| Start | `openEditionData`, `OpenEditionOptions`, `EditionData` | aus einer zusammengesetzten Ausgabe den Speicher öffnen und das liefern, was `startEdition` braucht |
| Fehler | `WebDataError`, `WebDataErrorCode` | Fehler der Datenbank auf dem Gerät, mit Code |

## Regeln, die du kennen musst

1. **Alles kommt aus der Ausgabe.** Der Name der Datenbank ist `edition.database`, das Präfix der Schlüssel auf dem Gerät `edition.storagePrefix`, die Tabellen sind `composed.tables`, die Migrationen sind die der Branchen. Beides ist für immer eingefroren ([ADR-0008](../../docs/adr/0008-herkunft-namen-und-adressen.md)): Wer den Namen ändert, öffnet eine leere Datenbank. `openEditionData(composed, { ledger })` ist der eine Aufruf; es gibt zurück, was `startEdition` braucht (`storage`, `clock`, `ids`, `hasher`), dazu `device`. Nur `actor` fehlt: Wer auf diesem Gerät handelt, liegt je Betrieb im Speicher des Geräts.
2. **Der Speicher verhält sich wie die Referenz.** `openIndexedDbStorage` ist der ganze Port `Storage`, und er weist ab, was `createMemoryStorage` abweist, mit denselben `StorageError`-Codes (`exists`, `append_only`, `other_business`, `invalid_id`, `invalid_file`, `not_plain`, `checksum`, `unknown_table`). Dieselben Fälle laufen gegen beide (`test/conformance.ts`): Wo der Adapter anders antwortet, ist der Adapter falsch. `get(id)` kennt den Betrieb auch hier nicht: `requireRow` vergleicht ihn (Schuld TD-23).
3. **Daten liegen so:** ein Object Store je Tabelle des Registers (Schlüssel `id`, Index `businessId`, dazu die Indizes des Registers; ein zusammengesetzter Index heisst `feld1,feld2`), dazu `businesses`, `events` (in der Reihenfolge des Anfügens, mit fortlaufendem Schlüssel), `commands`, `files` (die Angaben einer Datei) und `files.bytes` (die Bytes). Eine Datei ist ihre Bytes, ohne Umweg über Text und nie eine Data-URL; ihre Angaben liegen daneben, damit die Liste der Dateien eines Betriebs kein Foto liest. `files.bytes` kann keine Tabelle heissen, weil der Punkt in `TABLE_NAME_PATTERN` fehlt. `ofBusiness` liest über den Index `businessId` nur die Zeilen des Betriebs (Schuld TD-24, Teil).
4. **Die Transaktion ist keine Transaktion der Datenbank, solange die Arbeit läuft.** Die Datenbank des Browsers beendet eine Transaktion, sobald etwas anderes als die Datenbank abgewartet wird, und eine Prüfsumme ist so etwas (WebCrypto antwortet nach einer Pause; das Ledger rechnet sie zwischen dem Lesen und dem Schreiben, `files.put` und `verify` ebenso). Darum arbeitet `transaction(work)` über eine Schicht im Arbeitsspeicher: Lesen sieht die Schreibungen der Transaktion, Schreiben wird nur gesammelt. Endet die Arbeit gut, wird alles in **einer** Transaktion der Datenbank geschrieben, ohne Pause darin, ganz oder gar nicht (Tabellen, Dateien samt Bytes, Ereignisse, Befehlsprotokoll, `purge`). Scheitert die Arbeit, wurde nichts geschrieben. Der Hasher darf in der Transaktion beliebig lang antworten; die Regel 8 des Ledger-Kits («ein Hasher, der ohne Pause antwortet») gilt für diesen Adapter nicht.
5. **Was darum gilt:** Warte jeden Aufruf des Speichers in der Arbeit ab. Ein Aufruf, der erst nach dem Ende der Transaktion schreibt, hat keinen Ort mehr und scheitert mit `failed`. Eine Transaktion in einer anderen schliesst sich an und teilt ihr Schicksal, wie im Speicher im Arbeitsspeicher; eine zweite, die nicht ineinander liegt, beginnt erst nach dem Schreiben der ersten. Ein Schreiben, das die Datenbank ablehnt, weil eine andere Verbindung (ein zweiter Tab) die Zeile inzwischen angelegt hat, bricht die ganze Transaktion ab (`exists`). **Was das nicht leistet:** Zwei Tabs, die gleichzeitig in dasselbe ersetzbare Zeile oder an dieselbe Kette schreiben, sperren einander nicht (Schuld TD-104).
6. **Schema-Ledger** (`SchemaLedger`): eine Liste von Schritten. Jeder Schritt nennt `tables` (neue Tabellen mit ihren Indizes), `indexes` (neue Indizes an Tabellen, die es gibt) und `migrations` (Kennungen von Migrationen der Zeilen, die mit ihm laufen). **Die Version der Datenbank ist die Zahl der Schritte**, sie fällt nie; ein Schritt, der geschrieben ist, wird nie geändert und nie entfernt, eine Korrektur ist ein neuer Schritt. Das Ledger gehört der Ausgabe (der Kopf führt es neben ihrem Manifest); dieses Paket ist die Mechanik. `businessId` steht in keinem Schritt: Jede Tabelle hat den Index von Anfang an.
7. **Prüfen und vorschlagen.** `schemaLedgerProblems({ ledger, tables, migrations?, previous? })` gibt jeden Befund als Daten zurück (`empty`, `invalid_step`, `step_changed`, `step_removed`, `table_twice`, `table_missing`, `unknown_table`, `index_twice`, `index_missing`, `index_misplaced`, `unknown_index`, `migration_twice`, `unknown_migration`, `migration_misplaced`) und wirft nie. `previous` ist das Ledger, wie es zuletzt eingefroren wurde: Jeder Schritt darin muss unverändert da sein. `proposeSchemaStep({ ledger, tables, migrations? })` schlägt aus Register und bisherigem Ledger den nächsten Schritt vor (neue Tabellen mit allen Indizes, neue Indizes bekannter Tabellen, Migrationen, die noch kein Schritt nennt) oder gibt `undefined`, wenn das Ledger auf dem Stand ist. Der Vorschlag ändert nie einen Schritt, der besteht.
8. **Öffnen.** `openIndexedDbStorage` prüft das Ledger zuerst gegen das Register; passt es nicht, kommt `WebDataError` `invalid_ledger` mit den Befunden in `problems`, und nichts wird geöffnet. Dann öffnet es die Datenbank in der Version `ledger.length` und führt die Schritte aus, die das Gerät noch nicht kennt, **in einer Transaktion**: Tabellen, Indizes und Migrationen in der Reihenfolge des Ledgers, jede Migration einmal, in dem Schritt, der sie nennt. Wirft eine Migration oder gibt sie eine Zeile ohne ihre `id` oder ihren Betrieb zurück, bleibt die Datenbank, wie sie war (`migration`). Eine Datenbank, die ein neueres Ledger schrieb, ist `downgrade`; ohne IndexedDB gibt es `unavailable`.
9. **Migrationen** (`RowMigration`, die Form der Manifeste: `id`, `table`, `upgrade`): `upgrade` ist rein, eine Zeile hinein, eine heraus. `openEditionData` nimmt sie aus den Branchen der Ausgabe (`composed.parts`). Auf einem Gerät ohne Datenbank laufen alle Schritte über keine Zeile. Neue Schritte schreibt, wer die Branche ändert; das Ledger nennt, wann sie laufen.
10. **Die Verbindung.** `close()` schliesst sie; danach scheitert jeder Aufruf mit `closed`. Hebt ein anderer Tab die Datenbank auf eine neuere Version, schliesst sich diese Verbindung selbst, ruft `onVersionChange`, und die App sagt, dass neu geladen werden muss. Hält ein älterer Tab das eigene Öffnen auf, ruft das Öffnen `onBlocked` und wartet.
11. **Fehler.** Was die Datenbank ablehnt, ist ein Fehler dieser Suite: eine Zeile, die es schon gibt, ist `StorageError` `exists`; ein volles Gerät `WebDataError` `quota`; eine geschlossene Verbindung `closed`; alles andere `failed` mit dem Original als `cause`. Fehler des Hashers und der Uhr gehen unverändert durch.
12. **Speicher des Geräts** (Schuld TD-28): `DeviceStore` ist ein Port mit `get`, `set`, `remove` und `key`; Text unter Namen, synchron. `createMemoryDeviceStore(prefix)` für Tests, `createBrowserDeviceStore(prefix, storage?)` auf `localStorage` (der Speicher ist ein Parameter, `localStorage` die Vorgabe). Jeder Schlüssel ist `deviceKey(prefix, name)`: das Präfix der Ausgabe (`<id>:`) und ein Name aus Kleinbuchstaben, Ziffern und `: . _ -`, in der Form, die `storageKeys` aus `@onestrand/testing` im Code findet. `DEVICE_NAMES` nennt, was die Plattform dort ablegt: `openBusiness`, `actor(businessId)`, `deviceMode(businessId)`, `language(personId)`. Nichts davon geht in eine Sicherung; der Browser kann es löschen, dann fragt die App neu.
13. **Uhr, IDs, dauerhafter Speicher.** `createBrowserClock()` (Zeitpunkt in ISO, Tag in Europe/Zurich), `createBrowserIds(random?)` (UUIDv7 aus `crypto`, die Quelle ist ein Parameter). `requestPersistentStorage(storage?)` bittet den Browser, die Daten auch bei knappem Platz zu behalten (Safari löscht sonst Websites, die sieben Tage nicht geöffnet wurden); es wirft nie. `openEditionData` ruft es **nicht**: Firefox fragt dabei die Person, die App entscheidet, wann.
14. **Grenzen.** Kein React, kein Dexie, kein Node, keine Branche. Die erlaubten Globalen stehen in `BROWSER_PACKAGES` von `eslint.config.js` (`indexedDB`, `localStorage`, `navigator`, `crypto`) und in `tools/test/lint-boundaries.test.ts`; `tsconfig.src.json` hat die DOM-Typen, die anderen Pakete nicht. Wo es geht, kommt das Globale als Parameter herein und ist nur die Vorgabe.
15. **Was die Tests nicht sehen.** Sie laufen in Node mit `fake-indexeddb`. Das Verhalten echter Browser bei Transaktionen, beim Blockieren, bei knappem Platz und auf dem iPhone prüft der Test von Ende zu Ende (W0-03, Schuld TD-105).

## Beispiel

```ts
import { composeEdition, startEdition } from '@onestrand/manifest';
import { DEVICE_NAMES, openEditionData, proposeSchemaStep } from '@onestrand/web-data';
import { edition } from './edition';
import ledger from './schema-ledger.json'; // gehört der Ausgabe, nur angefügt

const composed = composeEdition(edition);

// Was noch fehlt, schlägt die Funktion vor; die Person, die das Ledger führt, hängt es an.
const next = proposeSchemaStep({ ledger, tables: composed.tables });

// Die Datenbank heisst wie die Ausgabe, ihre Tabellen sind die des Registers.
const data = await openEditionData(composed, { ledger });
const businessId = data.device.get(DEVICE_NAMES.openBusiness);
const actor = businessId === undefined ? undefined : data.device.get(DEVICE_NAMES.actor(businessId));
if (actor !== undefined) {
  const running = startEdition(composed, { ...data, actor });
  // running.useCases, running.backups
}
```

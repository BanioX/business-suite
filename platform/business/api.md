# @onestrand/business (P-20)

Der Betrieb und seine Personen: das volle Modell des Betriebs (Branchen, Betriebsarten, Kanton, MWST-Art, Briefkopf, Bankverbindung, eingeschaltete Funktionen und Werte ihrer Optionen), die Person mit dem Minimum, die Operationen dazu mit ihren Use Cases, die Quelle für die Hülle von `@onestrand/access` und die Liste der Betriebe auf dem Gerät. Reines TypeScript ohne Browser und ohne Node; baut auf `@onestrand/core`, `@onestrand/contract`, `@onestrand/storage`, `@onestrand/features`, `@onestrand/access` und `zod`. Kein Text steht im Paket: Namen, Sätze und Fehlertexte kommen aus den Sprachkatalogen von `@onestrand/i18n` unter denselben Kennungen.

```ts
import { businessContract, createAccessSource, createBusinessUseCases, listBusinesses } from '@onestrand/business';
```

## Was das Paket exportiert

| Bereich | Exporte | Wozu |
| --- | --- | --- |
| Betrieb | `BusinessSchema`, `Business`, `LetterheadSchema`, `Letterhead`, `BankAccountSchema`, `BankAccount`, `OptionValuesSchema`, `CANTONS`, `Canton`, `VAT_METHODS`, `VatMethod` | das volle Modell über `BusinessBaseSchema` aus `@onestrand/storage`; die Sicherung nimmt es als `businessSchema` |
| Person | `PersonSchema`, `Person`, `peopleTable`, `businessTables` | die Person mit dem Minimum und ihre Tabelle `people`; die Ausgabe nimmt `businessTables` in ihr Tabellen-Register |
| IBAN | `ibanProblem`, `isValidIban`, `normalizeIban`, `IBAN_PATTERN`, `IBAN_PROBLEMS`, `IbanProblem` | Form und Prüfziffer als reine Funktionen |
| Register | `businessFeatureEntries`, `businessRightEntries`, `BUSINESS_FEATURE`, `RIGHT_PEOPLE_ROLES`, `RIGHT_SETTINGS` | was das Paket im Register der Funktionen und im Register der heiklen Rechte anmeldet |
| Schnittstelle | `businessContract`, `BUSINESS_EVENT_TYPES`, `BusinessEventType`, `BUSINESS_ERROR_CODES` | das Fragment mit neun Operationen, die Ereignisse und die Fehlercodes |
| Use Cases | `createBusinessUseCases`, `BusinessContext`, `BusinessStorage`, `BusinessRegisters` | die Umsetzung des Fragments |
| Hülle | `createAccessSource`, `AccessSourceStorage` | Profil und eingeschaltete Funktionen aus dem Speicher, für `guardUseCases` |
| Personen | `profileOfActor`, `activeOwners`, `leavesNoOwner` | das Profil einer Person, die handeln darf; die Regel «ein Betrieb behält eine Inhaber:in» |
| Gerät | `listBusinesses`, `BusinessListing` | die Betriebe auf dem Gerät: Kennung und Name |

## Der Betrieb

Eine Zeile in `businesses`, die `BusinessBaseSchema` (Kennung, Name, zwei Zeitstempel) erweitert. Alles ist Wahl, nie Regel:

| Feld | Inhalt |
| --- | --- |
| `industries`, `kinds` | Kennungen der Branchen und der Betriebsarten (`<branche>.<art>`) aus dem Register der Funktionen; leer, wenn nichts gewählt ist |
| `canton` | eine der 26 Abkürzungen in `CANTONS`; fehlt, wenn nicht angegeben |
| `vatMethod` | `effective` oder `flat_rate` (Saldosteuersatz); fehlt, wenn nicht angegeben. Kein Satz und keine Schwelle steht im Paket |
| `letterhead` | `name` und optional Adresse (`street`, `postalCode`, `city`, `country`), Kontakt (`phone`, `email`) und `logoFileId`, die Kennung einer Datei aus `storage.files`, nie die Bytes |
| `bank` | `iban` in der schlichten Form (Grossbuchstaben, ohne Leerzeichen, mit richtiger Prüfziffer) |
| `features` | die eingeschalteten Funktionen, vollständig (`resolve` des Registers); der Umfang wird nie gespeichert |
| `options` | `{ <funktion>: { <schlüssel>: <wert> } }`, die Werte der Optionen |

1. **Lockeres Lesen:** Was eine neuere Version geschrieben hat, bleibt. Felder, die das Schema nicht kennt, bleiben auf dem Betrieb, im Briefkopf und in der Bankverbindung (`looseObject`); Kennungen in `industries`, `kinds` und `features` werden als schlichter Text gelesen, nicht nach der Form geprüft; unter `options` steht, was dort steht, und das Register entscheidet über die Gültigkeit (`resolveOptions`). Die Use Cases schreiben die Zeile aus dem, was gespeichert ist, zurück und ändern nur, was verlangt wurde.
2. **Fehlt ein Feld**, gelten Vorgaben: leere Listen und keine Optionen. Eine Zeile aus dem Speicher, die nur die Basis hat (Test-Seed), ist ein gültiger Betrieb ohne Funktionen ausser dem Kern.
3. **Recht nur mit Quelle:** Kanton und MWST-Art sind Auswahllisten. Die Sätze und Schwellen kommen mit der Rechnung und den Fakten, nicht in dieses Paket.
4. **Die IBAN** wird gegen die Norm geprüft (zwei Buchstaben, zwei Ziffern, 11 bis 30 Zeichen, Prüfziffer modulo 97). Welche Länder und Längen ein QR-Zahlteil annimmt, ist eine Regel der Rechnung und hier nicht entschieden (Schuld TD-81). `normalizeIban(text)` macht aus der Eingabe der Person die gespeicherte Form; das Formular zeigt mit `ibanProblem(text)` (`form` oder `check_digits`) den passenden Satz.

## Die Person

`PersonSchema` hat nur: die Syncfelder (`id`, `businessId` als Zugehörigkeit zum Betrieb, `createdAt`, `updatedAt`, `deletedAt`), `name` (Anzeigename), `profile` (`ProfileSchema` aus `@onestrand/access`) und `active`. Keine Adresse, kein Geburtsdatum, keine Lohnangaben: Das bringt das Modul, das es braucht, in einer eigenen Tabelle.

- **Tabelle `people`:** `sensitivity: 'internal'` für die Tabelle und jedes Feld, `sync: 'single_writer'`, in der Sicherung. Das Profil ist nicht heikler als der Rest: Das Gerät einer Person muss ihr eigenes Profil lesen, um es durchzusetzen, und ein heikles Feld käme dort nie an.
- **Weich gelöscht** über `deletedAt` wie jede Zeile; `active: false` hält nur vom Handeln ab.
- **Das Profil der handelnden Person** liest `profileOfActor(storage, businessId, actor)`: das Profil der Zeile, wenn sie zu diesem Betrieb gehört, nicht gelöscht und aktiv ist und das Profil lesbar ist. Eine Person eines anderen Betriebs, eine deaktivierte, eine gelöschte, eine unbekannte und eine mit einem Profil, das diese Version nicht lesen kann, bekommen `NO_ACCESS_PROFILE`: im Zweifel nichts.
- **Mindestens eine Inhaber:in bleibt (TD-72):** `leavesNoOwner(personen, danach)` sagt, ob eine Änderung den Betrieb ohne aktive Inhaber:in liesse, wo er vorher eine hatte. `business.people.setActive` ruft es. «Herabstufen» geschieht gar nicht: `profileChangeProblems` kennt `owner_fixed`, ein Profil «Inhaber:in» lässt sich nie ändern, auch nicht durch eine Inhaber:in.

## Funktion und Rechte

- **Funktion `business`** (Modul `business`), Kern: nie schaltbar, immer an. Jede Operation des Paketes nennt sie.
- **Heikle Rechte** der Plattform (P-21): `people_roles` (Personen anlegen, Profile ändern, Personen aus dem Dienst nehmen) und `settings` (den Betrieb und seine Funktionen ändern). Die Ausgabe ruft `createFeatureRegistry(businessFeatureEntries)` und `createRightRegistry(features, businessRightEntries)`.

## Die Schnittstelle

`businessContract` ist ein Fragment. Jede Operation sagt Funktion, Stufe und Recht; die Hülle setzt es durch.

| Operation | Art | Stufe, Recht | Was sie tut |
| --- | --- | --- | --- |
| `business.create` | Befehl | `manage` | legt den Betrieb und die erste Person als Inhaber:in an, in einer Transaktion; die Person bekommt die Kennung der handelnden Person (`ctx.actor`) |
| `business.get` | Abfrage | `view` | liest den Betrieb |
| `business.update` | Befehl | `manage`, `settings` | ändert Name, Kanton, MWST-Art, Briefkopf, Bankverbindung, Branchen, Betriebsarten; ein fehlendes Feld bleibt, `null` nimmt Kanton, MWST-Art, Briefkopf oder Bankverbindung weg |
| `business.features.switch` | Befehl | `manage`, `settings` | schaltet eine Funktion ein oder aus; das Ergebnis nennt `turnedOn` und `turnedOff` |
| `business.features.setOption` | Befehl | `manage`, `settings` | setzt den Wert einer Option; er muss zum Typ passen |
| `business.people.add` | Befehl | `manage`, `people_roles` | legt eine Person mit einem Profil an |
| `business.people.update` | Befehl | `manage`, `people_roles` | ändert Name oder Profil |
| `business.people.setActive` | Befehl | `manage`, `people_roles` | nimmt eine Person aus dem Dienst oder holt sie zurück |
| `business.people.list` | Abfrage | `view` | die Personen, die nicht gelöscht sind, auch die nicht aktiven |

**Ereignisse** (`BUSINESS_EVENT_TYPES`): `business.created`, `business.updated`, `feature.switched`, `feature.option_set`, `person.created`, `person.updated`, `person.deactivated`, `person.reactivated`. Die Nutzlast trägt Kennungen und kleine Fakten, nie einen Namen, nie eine Adresse, nie eine IBAN.

**Fehlercodes** (`BUSINESS_ERROR_CODES`): `business.last_owner` (die Änderung liesse den Betrieb ohne aktive Inhaber:in), `business.profile_refused` (das Profil gibt oder nimmt mehr, als die handelnde Person hält, oder nennt eine Funktion oder ein Recht, das niemand angemeldet hat). Dazu die Codes der Plattform: `not_found`, `invalid` (unbekannte Kennung, Option passt nicht, Betrieb existiert schon), `not_allowed` (Kern-Funktion ausschalten), `forbidden` (setzt die Hülle).

## Die Use Cases

`createBusinessUseCases(ctx, { features, rights })` gibt `UseCasesOf<typeof businessContract>` zurück.

1. **Kontext:** `ctx` ist ein `CommandContext` mit einem Speicher, der `businesses` (das volle Modell) und die Tabelle `people` hält, wie ihn `createMemoryStorage(register, ports)` aus `@onestrand/storage` baut (`BusinessStorage`). `features` ist das Register der Funktionen, `rights` das der Rechte. Im Test: `{ ...t.ctx, storage: t.storage }`.
2. **Betrieb anlegen:** Die Person bekommt die Kennung von `ctx.actor`; eine neue Person im neuen Betrieb braucht darum eine frische Kennung (ein Mensch, der zwei Betriebe führt, ist je Betrieb eine Zeile). Branchen und Betriebsarten müssen im Register stehen; `features` wird vom Register ergänzt (Kern und alles, was verlangt wird); eine unbekannte Kennung ist `invalid`. Ist die Kennung des Betriebs vergeben oder gehört die handelnde Person schon zu einem Betrieb, ist es `invalid`. Scheitert ein Schritt, bleibt nichts.
3. **Funktionen:** `business.features.switch` nimmt `switchFeature` des Registers. Was das Register nicht kennt (eine neuere Version schrieb es), bleibt in der Liste; die Daten einer ausgeschalteten Funktion und die Werte ihrer Optionen bleiben.
4. **Optionen:** Der Typ der Option kommt aus dem Register (`optionAccepts`). Optionen und Funktionen einer neueren Version bleiben, auch wenn die Option einer bekannten Funktion neu geschrieben wird.
5. **Weitergabe:** Beim Anlegen und beim Ändern eines Profils prüft `profileChangeProblems` aus `@onestrand/access` (niemand vergibt mehr, als er hat; «Inhaber:in» nur eine Inhaber:in). Eine Person aus dem Dienst nehmen oder zurückholen folgt denselben Regeln, denn sie nimmt oder gibt das ganze Profil. Neue unbekannte Funktionen oder Rechte in einem Profil werden abgewiesen; was das alte Profil schon nannte, bleibt (ein Profil einer neueren Version).
6. **Wiederholung:** Dieselbe `commandId` gibt das gespeicherte Ergebnis zurück und schreibt nichts neu.
7. **Geschrieben wird aus dem Gespeicherten:** Eine Person, deren Zeile Felder einer neueren Version trägt, behält sie.

## Die Hülle: Quelle für `guardUseCases`

`createAccessSource({ storage, features, actor })` gibt die Quelle, die `guardUseCases(businessContract, useCases, quelle)` aus `@onestrand/access` braucht. Sie liest für `{ operation, businessId }`:

- das Profil der Person `actor` im Betrieb (`profileOfActor`) und
- die eingeschalteten Funktionen des Betriebs, vom Register vervollständigt (`resolve`), also immer mit dem Kern.

`actor` ist dieselbe Kennung wie `ctx.actor` der Befehle. Ein Betrieb, den das Gerät nicht kennt, bekommt nur den Kern und für niemanden ein Recht, **ausser** für `business.create`: Wer das Gerät hält, darf einen neuen Betrieb anlegen, denn es gibt noch keine Person, die man fragen könnte; die Quelle gibt dann das Profil «Inhaber:in» und nur für diese eine Operation. Ein Betrieb, der schon da ist, wird wie jeder andere gefragt.

## Die Liste der Betriebe auf dem Gerät

`listBusinesses(storage)` gibt `[{ id, name }]` nach Name, sonst nichts. Das ist **keine Operation des Vertrags** (Schuld TD-11, entschieden): Jede Operation nennt in der Eingabe einen Betrieb und wird nach dem Profil in diesem Betrieb geprüft; die Frage «welche Betriebe sind auf diesem Gerät» hat weder das eine noch das andere, und ein Betrieb ist erst gewählt, wenn die Person ihn aus dieser Liste nimmt. Eine eigene Art «Abfrage des Geräts» im Vertrag hätte `query`, die Hülle, die JSON-Schemas und die Konformitätsprüfung berührt; die schmale Funktion ändert keine Zeile von `@onestrand/contract`. Sie gibt nichts preis, was nicht schon im Auswahlmenü steht.

## Die Sicherung

Ein Betrieb geht mit `createBackupKit({ format, version, registry, hasher, businessSchema: BusinessSchema })` aus `@onestrand/storage` hin und zurück: die Zeile des Betriebs (mit allen Feldern, die dieses Schema nicht kennt, in jeder Tiefe), die Personen und die Dateien (das Logo). Ereignisse und Befehlsprotokoll gehören nicht dazu. Das Tabellen-Register der Ausgabe enthält `businessTables`.

## Beispiel

```ts
import { createRightRegistry, guardUseCases } from '@onestrand/access';
import { createFeatureRegistry } from '@onestrand/features';
import { createMemoryStorage, createTableRegistry } from '@onestrand/storage';
import {
  BusinessSchema, businessContract, businessFeatureEntries, businessRightEntries, businessTables,
  createAccessSource, createBusinessUseCases, listBusinesses, type Business,
} from '@onestrand/business';

// Die Register der Ausgabe.
const FEATURES = createFeatureRegistry(businessFeatureEntries);
const RIGHTS = createRightRegistry(FEATURES, businessRightEntries);
const TABLES = createTableRegistry(businessTables);
const storage = createMemoryStorage<typeof TABLES, Business>(TABLES, { hasher, clock, ids });

// Die erste Person legt den Betrieb an; ihre Kennung ist `actor`.
const actor = ids.next();
const ctx = { storage, clock, ids, actor };
const useCases = guardUseCases(
  businessContract,
  createBusinessUseCases(ctx, { features: FEATURES, rights: RIGHTS }),
  createAccessSource({ storage, features: FEATURES, actor }),
);
const businessId = ids.next();
await useCases['business.create']({ commandId: ids.next(), businessId, name: 'Betrieb Muster', ownerName: 'Person Muster' });

// Funktion einschalten; das Ergebnis sagt, was mitging.
const { turnedOn } = await useCases['business.features.switch']({
  commandId: ids.next(), businessId, featureId: 'customers', on: true,
});

// Die Liste für das Wechseln des Betriebs.
await listBusinesses(storage); // [{ id: businessId, name: 'Betrieb Muster' }]
```

## Was dazugehört, aber nicht hier steht

- **Texte** (Name und Satz zu Funktion, Modul und Rechten; die Wörter für `effective` und `flat_rate`; die Namen der Kantone; die Sätze zu `business.last_owner` und `business.profile_refused`) gehören in die Kataloge von `@onestrand/i18n`.
- **Seiten** (Betrieb einrichten, Einstellungen, Personen) kommen mit den Ausgaben und mit W1.
- **Der Gerätemodus** liegt auf dem Gerät, nicht am Betrieb (`@onestrand/web-data`, `deviceKey`).
- **Profile verwalten** (Vorlagen, mehrere Profile je Person, PIN am gemeinsamen Gerät) ist W1-01.
- **Der QR-Zahlteil** liest `bank.iban` und `letterhead`; seine Regeln (Länder, Längen, Referenzen) gehören zur Rechnung.

# Plattform-Karte: Was aus Randen in die Onestrand-Plattform gehört

Stand 24.11.2026. Für den Kopf der Business Suite (Repo `business-suite`) und für jede Sitzung, die an Randen oder an einer neuen Branche baut.

**Grundlage:** Randen auf Commit `a8d8e63` vom 24.11.2026. Von den Arbeitspaketen AP-0 bis AP-32 ist noch keines gebaut; Teil A (Plan und ADR-Entwürfe) ist in Arbeit (`docs/intern/ausbau.md:1087-1116`). Gelesen wurden dazu die Wünsche W1 bis W17 (`docs/intern/auftraege/wuensche-2026-11.md`), der Masterplan (Abschnitte 0 bis 3, 5, 7, 8), `docs/intern/suite.md`, die ADRs 0003, 0005 bis 0008, 0013, 0015, 0017, 0019, 0020, 0022 bis 0030 und Rettich (nur gelesen). Pfade ohne Präfix liegen in `/home/user/Randen`, Rettich-Pfade beginnen mit `Rettich/`. Zeilen gelten für den genannten Commit. Der Product Owner heisst hier «PO».

**Wörter in diesem Dokument**

| Wort | Bedeutung |
| --- | --- |
| Plattform | Was jede Branche braucht, ohne Wissen über ein Fach. Künftig Pakete `@onestrand/…` |
| Branche | Wissen, Modelle, Regeln und Seiten eines Fachs: Gastro (Randen), Reinigung, Malerei, Hauswartung … |
| Produkt | Eine installierbare App mit Marke, Adresse (Herkunft) und eigenem Speicher. Heute nur Randen. Ein Produkt = Plattform + eine oder mehrere Branchen + Marke |
| Herauslösen | Code aus Randen in ein Plattform-Paket bringen, sodass Randen ihn danach von dort bezieht |
| Aufwand | **S** ein PR · **M** zwei bis vier PRs · **L** mehrere PRs mit Migration und Tests · **XL** eigenes Arbeitspaket mit ADR, neu zu bauen |

---

## 0. Kurzfassung

1. **Randen ist sauber geschichtet, und das ist die halbe Plattform.** Kern ohne Browser (ESLint, `eslint.config.js:47-62`), Ports, Contract-first, Befehle mit `commandId` und Ereignissen. Die Module der Logik importieren einander nicht: Die 14 `use-cases.ts` beziehen nur `application/`, `contract`, `ports`, `model/`, `domain/` und eigene Dateien.
2. **Branchenneutral ist heute grob ein Sechstel des Produktivcodes**, rund 12'000 von 73'500 Zeilen ohne Tests (Kern 29'079, Web 44'435): Geld, Datum, IDs, Schnittstelle, Befehls-Kit, Ports, Datenschicht, App-Rahmen, das meiste UI-Kit, PDF und Teilen, Sicherung, Prüfwerkzeuge. Fast alles, was der Ausbau neu bringt (Register, Rollen, Team und Zeit, Kasse und Belege, Dokument-Ansicht, Erinnerungen, Kalender, Kopplung, Checklisten), ist von Natur aus neutral, wenn es jetzt richtig gebaut wird.
3. **Die Gastro-Kopplung sitzt an wenigen Sammelstellen:** die feste Liste aller Tabellen (`TABLE_SCHEMAS`), die feste Summe der Schnittstelle (`CONTRACT_V1`), das Modell `Business` mit Küchenfeldern, die feste Navigation, Farben mit Namen der Marke, Texte mit dem Namen «Randen» und die Selbstkontrolle als fester Kern. Jede dieser Stellen wird ein Register, in das die Branche einträgt.
4. **Der grösste Hebel liegt jetzt bei der Randen-Sitzung.** Baut sie AP-1, AP-2, AP-3 bis AP-6, AP-15, AP-16 und AP-19 nach den zwölf Regeln in Abschnitt 4 (eigener Ordner, Importgrenze, Ports statt Querbuchungen, Rechte nach W16, neutrale Namen), kostet das Herauslösen einen Umzug statt eines Umbaus.
5. **Die zweite Branche (Reinigung, Facility, Hauswartung) braucht zuerst:** die Checklisten-Engine (heute als Reinigungsplan in der Selbstkontrolle), Rollen, Team und Zeit, Kasse und Belege, und Neues, das Randen nicht hat: Kundschaft und Objekte, Aufträge und Einsätze, Rapport mit Unterschrift, Offerte und Rechnung mit QR-Rechnung (Abschnitt 2.3).
6. **Drei Grundsatzfragen für den PO** (Abschnitt 8): eine App je Branche oder Produkte aus mehreren Branchen (ein Hotel mit Küche hätte sonst Team und Zeit doppelt); ein Monorepo oder getrennte Repos mit Paketen; Rechnungen stellen ja oder nein (Randen ist heute bewusst «keine Buchhaltung», ADR-0029 Punkt 1).

---

## 1. Ausgangslage im Code

| Schicht | Ort | Zeilen ohne Tests | Für die Plattform |
| --- | --- | --- | --- |
| Logik | `packages/core/src` | 29'079 | Grundbausteine neutral, Modelle und Regeln überwiegend Gastro |
| Daten | `apps/web/src/data` | 200 | neutral bis auf Tabellenliste und Namen der Datenbank |
| Präsentation | `apps/web/src/app`, `ui`, `features` | rund 44'200 | Rahmen und Kit grösstenteils neutral, Seiten Gastro |
| Tests | `packages/core/test`, `apps/web/src/**/*.test.*`, `apps/web/e2e` | 38'534 | Werkzeuge neutral, Testküche und Demo Gastro |

**Was trägt (behalten, so wie es ist):**

- Drei Schichten mit ESLint-Grenzen (`eslint.config.js:47-62` Reinheit des Kerns, `:69-80` und folgende Blöcke für Features, UI-Kit und Datenschicht).
- Befehls-Kit mit Transaktion, Idempotenz über `commandId` und Domain Event (`packages/core/src/application/command.ts:75-122`).
- Ports für Uhr, IDs und Speicher; Speicher im Arbeitsspeicher als Referenz (`packages/core/src/ports/index.ts`, `ports/memory-storage.ts`).
- UUIDv7 auf dem Gerät, `syncFields` mit Soft-Delete (`packages/core/src/model/primitives.ts:107-113`).
- Geld als Ganzzahl, Währung je Betrieb, Verteilen ohne Rundungsrest (`packages/core/src/money.ts:100-160`).
- Ledger-Muster mit Eigenschaftstest (ADR-0007, `application/stock-ledger.ts:78`).
- Register der Nebenwirkungen mit Test (`apps/web/src/side-effects.test.ts:24-58`), Sprachtest (`apps/web/src/app/messages.test.ts`), Sicherheitstest der Kopfzeilen (`apps/web/src/security.test.ts`), `pnpm check` mit `ALL=` (`scripts/check.mjs:18`).

**Wo Gastro festsitzt (Sammelstellen):**

| Stelle | Beleg |
| --- | --- |
| Alle Tabellen in einer festen Liste aus Gastro-Modellen | `packages/core/src/ports/storage.ts:36-60` |
| Schnittstelle als feste Summe von 14 Teilen | `packages/core/src/contract/index.ts:1-15`, `:24-39`; Use Cases `application/index.ts:1-14`, `:25-42` |
| Befehls-Kit liest das Ausgabe-Schema aus der ganzen Schnittstelle | `application/command.ts:105` |
| Betrieb mit Küchenfeldern und geschlossenen Listen | `model/business.ts:6-23`, `:29-42`, `:56-58`, `:63`, `:73` |
| Start legt ein Restaurant mit drei Kühlbereichen an | `application/bootstrap.ts:54`, `:64-66` |
| Navigation, Tab-Leiste, Routen als feste Listen | `apps/web/src/app/nav.ts:50-97`, `:117-132`; `app/routes.tsx:26-50` |
| Farben mit Namen der Marke | `apps/web/src/index.css:15-30`; `ui/tones.ts:9-20`; `ui/pdf/kit.ts:17-34` |
| Name «Randen» in Texten, Test, PDF, Manifest | `app/messages.ts:7`; `ui/messages.files.ts:16`, `:20`; `app/messages.test.ts:73`; `ui/pdf/create.ts:31`; `apps/web/vite.config.ts:47-48`; `apps/web/index.html:13`, `:19` |
| Selbstkontrolle als fester Kern, Aufgaben an Lagerbereichen | ADR-0022 Punkt 5; `model/haccp.ts:58-68`; `modules/cockpit/contract.ts:45-55` |

---

## 2. Bausteine

### 2.1 Übersicht

«Neutral»: **ja** = gehört so in die Plattform; **teilweise** = Kern neutral, mit Gastro-Teilen, die getrennt werden; **nein** = bleibt Branche. «Schritt» = Reihenfolge des Herauslösens (Abschnitt 7); gleiche Zahl heisst gleicher Schritt.

| Nr. | Baustein | Heute (Pfad, Zeilen) | Neutral | Bindung an Gastro, kurz | Aufwand | Schritt |
| --- | --- | --- | --- | --- | --- | --- |
| B1 | Grundtypen: IDs, Geld, Währung, Datum, Format | `packages/core/src/{ids,money,currency,dates,format}.ts`, 544 | ja | keine fachliche; Kopie aus Rettich | S | 1 |
| B2 | Primitive Feld-Schemas | `model/primitives.ts`, 113 | teilweise | `DeciCelsius`, Datumsart MHD/Verbrauch, Einheiten nur g, ml, Stück, Foto als Data-URL | S | 1 |
| B3 | Schnittstelle: Operation, Befehl, Ereignis, Fehler, Befehls-Kit | `contract/*.ts` 159, `application/command.ts` 122 | teilweise | feste Summe `CONTRACT_V1`, Kit liest sie, Scopes nur Gastro, Fehlercode `insufficient_stock` | M | 2 |
| B4 | Ports und Speicher | `ports/*.ts` 285, `apps/web/src/data/*.ts` 200 | teilweise | feste Liste der 23 Gastro-Tabellen, `RandenDb` mit festen Indizes, Datenbankname `randen` | M | 2 |
| B5 | Ledger «nur anfügen» | `application/stock-ledger.ts` 397 (einzige Umsetzung) | teilweise | Muster neutral, Umsetzung an Artikel, Charge, FEFO, Verbrauchsdatum | M | 3 |
| B6 | Start und Migrationen | `application/bootstrap.ts` 93, Dexie-Versionen in `data/db.ts` | teilweise | legt Restaurant mit Kühl-, Tief- und Trockenbereich an | S | 3 |
| B7 | Modell Betrieb und Person | `model/business.ts` 83 | teilweise | Wareneinsatz-Ziel, MWST-Satz für Gerichte, Gastro-Arten, Rollen Koch und Service, «ein Betrieb ist eine Küche» | M | 2 |
| B8 | Funktionen-Register, Umfang, Ansicht | `domain/business-profiles.ts` 308, `app/modules.ts` 26, `app/view.ts` 90, `features/settings/FeaturesPage.tsx` 104; geplant AP-1 | teilweise | Einträge und Vorschläge Gastro, deutsche Bezeichnungen im Kern, Abhängigkeiten nur eine Stufe | M | 4 |
| B9 | Betriebsarten und Einrichten | `domain/business-profiles.ts` (`proposeSetup` :265), `features/settings/SetupPage.tsx`; geplant AP-17 | teilweise | Fragen nach Ware und Gästen, 23 Gastro-Arten | M | 6 |
| B10 | Rollen und Rechte | heute `StaffRoleSchema` (`model/business.ts:73`), ungeprüfte Scopes; geplant AP-2, W14, W16 | teilweise | Entwurf ADR-0022 mit festen Rollen; W16-Modell neutral, Vorlagen Branche | L | 5 |
| B11 | Gerätemodus und PIN | geplant AP-1, AP-2, AP-3, AP-13 | teilweise | Modus «Pass» ist Küchenmonitor, Schlüssel `randen:device-mode` | S | 5 |
| B12 | Team und Zeit (Person, Stempeln, Dienstplan, Abwesenheiten, Lohn-Export) | geplant AP-2 bis AP-6, ADR-0023, ADR-0030 | ja, Regelwerke teilweise | L-GAV, GAV Bäckerei und Fleisch, Trinkgeld, «Küchenleitung» | L | 7 |
| B13 | Kasse und Belege (Kassenbuch, Tagesabschluss, Belege, Monatspaket) | geplant AP-16, ADR-0029 | teilweise | schreibt in `sales`, bucht ins Lager, Fahrerkasse, Pauschale für Imbisse | L | 8 |
| B14 | Checklisten-Engine (heute Reinigungsplan der Selbstkontrolle) | `model/haccp.ts` 79, `modules/haccp` 1390, `features/haccp` 2376; geplant AP-7 | teilweise | Aufgaben an Lagerbereichen, Messarten nur Lebensmittel, Grenzwerte der Branchenleitlinie, Kern nie schaltbar | L | 6 |
| B15 | Erinnerungen | geplant AP-8, ADR-0024; Vorlage `Rettich/packages/core/src/calendar.ts` 124 | ja | nur die Inhalte | S | 9 |
| B16 | Betriebskalender, Saison, Feiertage | geplant AP-17 und AP-5 | ja | Geschäftstag bis 04:00 als Gastro-Standard | M | 9 |
| B17 | Dokumente: PDF-Kit, Drucken, Teilen, Dokument-Ansicht | `ui/pdf` 726, `ui/print.ts` 148, `ui/PrintButton.tsx` 92, `ui/share-file.ts` 147; geplant AP-15 | ja | Farben fest im Kit, `creator: 'Randen'`, Texte nennen Randen | S | 3 |
| B18 | Sicherung und Verschlüsselung | `modules/settings` 606, `features/settings/backup-crypto.ts` 157 und Seiten | teilweise | Format `randen-backup` v1, Umschlag `randen-encrypted`, liest alle Gastro-Tabellen | M | 4 |
| B19 | Kopplung im WLAN und Vermittler | geplant AP-19, ADR-0028, W14, W15 | teilweise | nur Befehle der Bons, Nachholen nach Geschäftstag, Hauptgerät bucht Verkäufe | L | 11 |
| B20 | Demo-Betriebe und Testküche | `modules/demo` 5864, `features/demo` 551, `testing/index.ts` 456 | teilweise | Inhalt ganz Gastro; Werkzeuge (Speicher zum Bauen, Zufall, Tage) neutral | M | 12 |
| B21 | App-Rahmen: Shell, Navigation, Pfade, Daten-Provider, Hooks | `apps/web/src/app`, 2027 | teilweise | feste Gruppen «Küche, Lager, Kontrolle», vierter Tab nach Einkauf, feste Routen, `RandenDb` | L | 7 |
| B22 | UI-Kit, Diagramme, Design-Tokens | `ui` 6162 in 47 Dateien, `ui/charts` 1351, `index.css`, `ui/tones.ts` 105 | teilweise | Tokens `wine`, `grape`, `cork` in 135 Klassen in 56 Dateien; Allergen-, Temperatur-, Artikel- und Rezept-Bausteine im Kit | L | 5 |
| B23 | Texte und Sprachtest | `app/messages.ts` 80, `features/*/messages.ts`, `ui/messages*.ts`, `app/messages.test.ts` | teilweise | Test verlangt «Randen» und 11 Kataloge; 60 deutsche Bezeichnungen im Kern; nur de-CH | S | 2 |
| B24 | Fakten mit Quelle | `docs/fakten.md`, 660 | teilweise | Verfahren und MWST neutral, Allergene, HACCP, Food Waste Gastro | S | 2 |
| B25 | Prüfwerkzeuge: check, Lizenzen, Kontrast, Vorschaubilder, E2E | `scripts/*.mjs` 268, `apps/web/scripts/*.ts` 330, `apps/web/e2e` 673 | ja | Kontrastprüfung liest Randen-Farben; Testküche | S | 1 |
| B26 | CI, Auslieferung, Kopfzeilen | `.github/workflows/ci.yml` 130, `wrangler.jsonc` 17, `apps/web/public/_headers` 20 | ja | Projektname `randen` ist die Herkunft, nie umbenennen | S | 1 |
| B27 | Regel-Tests: Nebenwirkungen, Sicherheit, Schichten | `apps/web/src/side-effects.test.ts`, `security.test.ts`, `eslint.config.js` 160 | ja | Pfade auf Randen-Doku; WebRTC zählt mit WebSocket | S | 1 |
| B28 | Kontakte: Lieferanten und Kundschaft | `model/article.ts:28-46` (`SupplierSchema`) | teilweise | Markt mit Gang durch die Hallen, Bestell- und Liefertage | M | 10 |
| B29 | Aufträge, Einsätze, Objekte, Rapport | neu | ja | Randen kennt nur Auslieferung (Platzhalter) und Anlässe beim Catering | XL | 13 |
| B30 | Offerte und Rechnung mit QR-Rechnung | neu | ja | Randen ist bewusst keine Buchhaltung (ADR-0029 Punkt 1) | XL | 14 |

### 2.2 Je Baustein: Bindung und was zu tun ist

**B1 Grundtypen** · `packages/core/src/ids.ts` 63, `money.ts` 160, `currency.ts` 128, `dates.ts` 168, `format.ts` 25
- Bindung: keine fachliche. Der Typ heisst `Rappen` (`money.ts:8-9`), gilt aber für die kleinste Einheit jeder Währung (`currency.ts:4-6`). `HOME_TIME_ZONE` ist `Europe/Zurich` (`dates.ts:4`), richtig für die Schweiz. `parseChf` liest Schreibweisen von Kassenzetteln (`money.ts:40`), für Belege jeder Branche nützlich.
- Die fünf Dateien sind Kopien aus Rettich (`docs/rettich.md`, «Gemeinsamer Kern»). Eine Plattform wäre die dritte Kopie.
- Tun: unverändert nach `@onestrand/core`, mit Herkunftsvermerk im Dateikopf. Rettich behält seine Kopie und bleibt unberührt.

**B2 Primitive Feld-Schemas** · `model/primitives.ts` 113
- Neutral: `LocalDate`, `IsoDateTime`, `YearMonth`, `Bps`, `Quantity` mit drei Nachkommastellen, `nameSchema`, `textSchema`, `syncFields` (`:107-113`), `Weekday`, `CountryCode`, GTIN.
- Gastro: `DeciCelsiusSchema` (`:53`), `DateKindSchema` MHD und Verbrauchsdatum (`:60`), `UnitSchema` nur `g`, `ml`, `pcs` (`:20`), Foto als Data-URL bis 700'000 Zeichen (`:67-70`, TD-03).
- Tun: Neutrales nach `@onestrand/core`. Temperatur und Datumsart bleiben bei Gastro oder werden ein allgemeiner Messwert mit Einheit (B14). Einheiten als erweiterbares Register: Handwerk und Reinigung rechnen in m, m², m³ und Stunden. Die Regel «Preis pro 1000 Basiseinheiten» (ADR-0004) bleibt.

**B3 Schnittstelle** · `contract/operation.ts` 57, `contract/events.ts` 19, `contract/index.ts` 83, `application/command.ts` 122
- Neutral: `Operation`, `command`, `query`, `commandBase`, `DomainEvent`, `CommandError`, `createCommandKit` (Transaktion, Idempotenz, Ereignis), `contractJsonSchemas`.
- Bindung: `CONTRACT_V1` importiert 14 Teile fest (`contract/index.ts:1-15`, `:24-39`); `runCommand` holt das Ausgabe-Schema aus `CONTRACT_V1[name]` (`command.ts:105`), das Kit kennt also die ganze Gastro-Schnittstelle, und 12 der 14 Use-Case-Dateien importieren `../../contract`. `SCOPES` kennt nur Lager, Rezepte, Karte, Zahlen, HACCP (`operation.ts:5-18`) und wird nirgends geprüft. Der Fehlercode `insufficient_stock` steht im allgemeinen Kit (`command.ts:42`).
- Tun: `composeContract(fragments)` je Produkt; das Kit bekommt die Operation selbst statt eines Namens; Zugriff als Daten an der Operation (`access`, Regel R-4); Scopes als Zeichenketten, die ein Modul anmeldet; Fehlercodes erweiterbar.

**B4 Ports und Speicher** · `ports/storage.ts` 126, `ports/memory-storage.ts` 139, `apps/web/src/data/db.ts`, `dexie-storage.ts`, `adapters.ts`, `persistence.ts` (zusammen 200)
- Neutral: `RecordStore`, `BusinessStore`, `CommandLog`, `EventLog`, `transaction`, `purge`, `alive`, der Speicher im Arbeitsspeicher, das Muster des Dexie-Adapters (`dexie-storage.ts`), Uhr und IDs des Browsers, «dauerhaften Speicher erbitten».
- Bindung: `TABLE_SCHEMAS` (`storage.ts:36-60`) ist eine feste Liste von 23 Gastro-Tabellen und bestimmt den Typ `Storage`, den Speicher im Arbeitsspeicher, die Sicherung und Dexie. `RandenDb` hat feste Indizes und Versionen (`db.ts:25-55`) und den Namen `randen` (`db.ts:71`). `MetaEntry` kennt nur `currentStaffId` (`db.ts:19-22`). Kommentar und `purge` gehen davon aus, dass ein Gerät einen Betrieb hält (`storage.ts:103-109`).
- Tun: Tabellen-Register `defineTables` je Modul mit Name, Schema, Indizes, Bereich (`business` oder `device`), «in der Sicherung», «nur anfügen». `Storage<TTables>` generisch. Die Dexie-Versionen bleiben je Produkt eine von Hand geführte Liste; eine bestehende Version wird nie geändert, neue Tabellen eines Plattform-Pakets kommen mit der nächsten Version des Produkts. Name der Datenbank aus der Konfiguration des Produkts; Randen bleibt `randen`.

**B5 Ledger «nur anfügen»** · `application/stock-ledger.ts` 397
- Neutral: das Muster aus ADR-0007 (Bewegung nur anfügen, Bestand berechnet, Eigenschaftstest über beliebige Folgen, Korrektur als Gegenbuchung). ADR-0023 (Zeit), ADR-0027 (Bons) und ADR-0029 (Kassenbuch mit Prüfkette) wiederholen es.
- Bindung: Die einzige Umsetzung ist das Lager mit Artikel, Charge, FEFO, Verbrauchsdatum, Abschreibgrund, Produktion und Verkauf (`stock-ledger.ts:1-17`, `:78`).
- Tun: Plattform-Helfer «nur anfügen» mit Prüfkette (SHA-256 über einen Port) und Testhelfern für Eigenschaftstests. Das Lager-Ledger bleibt Gastro. Ein Material-Lager ohne Ablaufdatum (Farbe, Reinigungsmittel, Ersatzteile) entsteht später aus demselben Muster, nicht aus dem Code des Lebensmittel-Lagers.

**B6 Start und Migrationen** · `application/bootstrap.ts` 93
- Bindung: Der erste Start legt still einen Betrieb der Art `restaurant` an (`bootstrap.ts:54`), mit Wareneinsatz-Ziel und drei Lagerbereichen Kühl, Tief, Trocken samt Grenzwerten (`:64-66`); die Namen kommen aus `messages.defaults` (`apps/web/src/app/AppData.tsx:83-85`). Gibt es schon Betriebe, nimmt er den ältesten (`bootstrap.ts:36-38`).
- Tun: Der Plattform-Start legt Betrieb und erste Person an und ruft einen Haken des Produkts (Randen legt dort die Lagerbereiche an). Die Wahl zwischen mehreren Betrieben auf einem Gerät (W16 Punkt 4) wird hier vorbereitet, nicht gebaut.

**B7 Modell Betrieb und Person** · `model/business.ts` 83
- Neutral: `id`, `name`, `currency`, `setupAt`, `demo`, Zeitstempel; an der Person `name`, `active`; die neuen Felder aus dem Masterplan `featureOptions`, `businessDayEndsAt`, `canton`, `vatMethod`.
- Bindung: `BusinessKindSchema` nur Gastro-Arten (`:6-23`); `targetFoodCostBps` und `defaultVatBps` (`:56-58`); `ModuleIdSchema` geschlossen (`:29-42`) mit `max(20)` (`:63`); Kommentar «One kitchen» (`:47-50`) und ADR-0003 Punkt 4 «Ein Betrieb ist eine Küche»; `StaffRoleSchema` mit `chef`, `cook`, `service` (`:73`).
- Tun: `BusinessBase` in der Plattform, `kind` als Zeichenkette, die das Produkt prüft. Randen erweitert mit `.extend({ targetFoodCostBps, defaultVatBps, … })` und behält jeden Feldnamen, weil Sicherungen ihn tragen. Neuer Grundsatz im ADR der Plattform: «Ein Betrieb ist ein Ort, an dem ein Team arbeitet; bei Randen eine Küche.»

**B8 Funktionen-Register** · `domain/business-profiles.ts` 308 (`PROFILES` :87, `MODULE_REQUIRES` :195, `withRequirements` :221, `switchModule` :235, `modulesInUse` :298, `hasModule` :306), `app/modules.ts`, `app/view.ts`; geplant `domain/feature-catalog.ts` (ADR-0022 Punkt 3)
- Neutral: die Ebenen (Modul, Funktion, Option, Umfang, Ansicht), die Felder `requires`, `uses`, `options`, `roles`, `detailed`, `stage`, `availability`, die Auflösung über alle Stufen, «Ausschalten blendet nur aus», `useModule` und `useDetailed`.
- Bindung: Einträge und Vorschläge sind Gastro; die Bezeichnungen der Arten stehen deutsch im Kern (`business-profiles.ts:89` und folgende, TD-04); Abhängigkeiten wirken nur eine Stufe (`:221-248`); die Ansicht liegt unter `randen:extras` (`app/view.ts:10`).
- Tun: Engine und Typen in die Plattform, Einträge in die Branche (Regel R-3).

**B9 Betriebsarten und Einrichten** · `proposeSetup` (`business-profiles.ts:265`), `features/settings/SetupPage.tsx`; ADR-0015, ADR-0031, Masterplan 2.11 bis 2.13
- Neutral: der Ablauf «Fragen, Antworten, Vorschlag», höchstens elf Bildschirme, Antworten nicht gespeichert, Umfang «Schlank, Üblich, Alles».
- Bindung: Fragen nach der Ware, nach den Gästen, nach der Küche; alle 23 Arten sind Gastro.
- Tun: Fragen als Daten (Bildschirm, Kennung, Antworten, Wirkung auf Funktionen und Optionen); die Plattform bringt die Engine und die neutralen Fragen (Teamgrösse, Zahlarten, Name, Kanton bei Bedarf); jede Branche bringt ihre Arten und Fachfragen.

**B10 Rollen und Rechte** · heute `StaffRoleSchema` (`model/business.ts:73`) und die ungenutzten `scopes` (`contract/operation.ts:5-18`); geplant AP-2
- Bindung: ADR-0022 Punkt 10 (23.11.2026) sieht feste Rollen (`chef`, `cook`, `service` …) mit `all`, `work`, `none` vor. W16 (24.11.2026) verlangt Profile aus Rechten: je Funktion «nichts», «sehen», «bedienen», «verwalten»; heikle Rechte als eigene Schalter (Löhne, Zahlen und Margen, Kasse, Arbeitszeit anderer korrigieren, Personen und Rollen verwalten, Einstellungen, Exportieren und Löschen); Vorlagen; Regeln der Weitergabe; Rechte je Betrieb. Das W16-Modell ist neutral, nur die Vorlagen sind Branche. W14 ergänzt Arbeitsplätze je Rolle und den Filter beim Senden an private Handys.
- Tun: Regel R-4. ADR-0022 Punkt 10 wird mit W16 nachgeführt, bevor AP-2 baut.

**B11 Gerätemodus und PIN** · geplant (ADR-0022 Punkt 11, ADR-0030 Punkt 6)
- Neutral: Rahmen ohne `AppShell`, Verlassen mit langem Druck und PIN, Modus `clock` (Stempeluhr), PIN als Hash in einer Tabelle des Geräts, nie in der Sicherung.
- Bindung: Modus `pass` (Küchenmonitor), Schlüssel `randen:device-mode`.
- Tun: Modi als Register (Plattform `normal`, `clock`; Randen meldet `pass` an); Schlüssel über einen Präfix des Produkts (R-7).

**B12 Team und Zeit** · geplant AP-2 bis AP-6, ADR-0023, ADR-0030
- Neutral: Person mit Pensum, Vertrag, Ein- und Austritt; Zeit-Ledger mit Kommen, Pause, Weiter, Gehen, Korrektur; Minuten als Ganzzahl; Arbeitstag als Kalendertag des Beginns; Monatsblatt; Saldi; Abwesenheiten nur mit Art, Datum, Grad; Feiertage je Kanton; Lohn-Export für die Treuhand; Datenblatt und Löschplan; keine Vergleiche zwischen Personen. Das gilt für jeden Kleinbetrieb in der Schweiz.
- Bindung: Regelwerke `l_gav`, `gav_bakery`, `gav_meat` (ADR-0023 Punkt 7) und ihre Vorschläge je Betriebsart; Trinkgeld (`payroll_export.tips`); «Küchenleitung» als Korrekturberechtigte (ADR-0023 Punkt 6); geteilter Dienst mit Zimmerstunde als Vorlage.
- Tun: Regelwerke als Register (R-9): Plattform `arg` und Feiertage, Gastro meldet L-GAV und die zwei Handwerks-GAV an, weitere Branchen ihre Verträge mit Quelle. Zeitbuchung mit optionalem neutralem Bezug (`ref`) für Stunden je Auftrag (B29); Randen nutzt ihn nicht.

**B13 Kasse und Belege** · geplant AP-16, ADR-0029
- Neutral: Kassenbuch als Ledger mit Prüfkette und ohne Minussaldo, Tagesabschluss mit Zählen und ruhiger Differenz, Belege mit Original als Blob und SHA-256, `vouchers.book` als ein Befehl, Monatspaket als ZIP mit CSV und `LIESMICH.txt`, MWST nur als Vorschau, «Vorsystem, keine Buchhaltung». Für Maler, Hauswart oder Coiffeur gleich nützlich.
- Bindung: Der Abschluss schreibt `Sale`-Zeilen ohne Rezept in die Gastro-Tabelle `sales` (ADR-0029 Punkt 4); `vouchers.book` bucht den Wareneingang ins Lager-Ledger und setzt Artikelpreise (Punkt 7, Schritte 2 und 4); Fahrerkasse und Zahlart «Plattform» kommen vom Lieferdienst; MWST-Methode `imbiss_flat`; die Zeilen in «Heute» stehen im Gastro-Cockpit (Punkt 11).
- Tun: Regel R-6 (Ports statt Querbuchungen); Fahrerkasse und `imbiss_flat` als Option, die eine Branche anmeldet.

**B14 Checklisten-Engine** · `model/haccp.ts` 79, `modules/haccp` 1390 (`rules.ts` 151, `standard-plan.ts` 80, `limits.ts` 59, `use-cases.ts` 714, `contract.ts` 384), `features/haccp` 2376; geplant AP-7 (Checklisten, Übergabe, Schulungen) und AP-17 (Umfang je Art)
- Neutral: wiederkehrende Aufgabe mit Häufigkeit und Wochentag, erledigt mit Person und Zeit, «was heute fällig ist» (`modules/haccp/rules.ts:8`, `:30`), Standardplan als Vorlage, Bericht für die Kontrolle, Messung mit Grenzwert, Quelle und Massnahme (`model/haccp.ts:36-52`), Schulungsnachweise.
- Bindung: `HygieneTask.areaId` zeigt auf einen Lagerbereich (`model/haccp.ts:58-68`); Messarten nur für Lebensmittel (`:13-19`) mit deutschen Bezeichnungen im Kern (`:22-30`); Grenzwerte aus der Branchenleitlinie (`modules/haccp/limits.ts:21` und folgende); Selbstkontrolle ist Kern und nie schaltbar (ADR-0022 Punkt 5); Cockpit-Zeilen `temperature` und `hygiene` fest (`modules/cockpit/contract.ts:45-55`).
- Warum früh: Für Reinigung, Facility, Hauswartung und Hotel-Housekeeping ist der Putzplan das Produkt selbst. Der PO nennt ihn ausdrücklich (W17).
- Tun: Plattform-Modul «Aufgaben und Checklisten»: Vorlage, Aufgabe an einem allgemeinen Ort (Raum, Objekt, Gerät, Fahrzeug), Wiederkehr (täglich, wöchentlich, monatlich, alle N Tage, an Öffnungstagen), Liste (Öffnen, Schliessen, Übergabe), Abhaken mit Person, Foto als Nachweis, Messpunkt mit Einheit, Grenzwert und Quelle, Bericht. Gastro hängt die HACCP-Messarten und Grenzwerte an und erklärt seine Pflicht-Teile zum Kern; Reinigung hängt Objekte und Räume an.

**B15 Erinnerungen** · geplant AP-8, ADR-0024; Vorlage `Rettich/packages/core/src/calendar.ts` 124 und `Rettich/apps/web/src/app/app-badge.ts` 47
- Neutral: Kalenderdatei nach RFC 5545 mit Zeitzone Zürich, Zahl am App-Symbol, keine Mitteilung ohne Server.
- Tun: ICS-Schreiber und Zahl am Symbol in die Plattform; die Quellen der Erinnerungen meldet jedes Modul an.

**B16 Betriebskalender, Saison, Feiertage** · geplant AP-17 (Kalender, Saisons, Ruhetage) und AP-5 (Feiertage je Kanton)
- Neutral bis auf das Beispiel «Marroni» und den Geschäftstag bis 04:00 (ADR-0027), der für Gastro und Hotel passt, für Handwerk nicht.
- Tun: Kalender, Saisons und Feiertage in die Plattform; Ende des Geschäftstags als Option mit Standard je Branche.

**B17 Dokumente** · `ui/pdf/kit.ts` 623, `ui/pdf/create.ts`, `ui/print.ts` 148, `ui/PrintButton.tsx` 92, `ui/share-file.ts` 147; geplant AP-15 (Dokument-Ansicht mit pdf.js, Stile «Übersicht», «Streifen», «Formular», ADR-0026)
- Neutral: der Weg über ein PDF in der installierten iOS-App (ADR-0019), Teilen mit Download als Rückfall, Kit mit Titelblock, Tabelle, Fusszeile, Seitenzahl.
- Bindung: Farben fest als `PDF_COLOR` mit `wine`, `grape`, `cork` (`kit.ts:17-34`); `creator: 'Randen'` (`create.ts:31`); Texte nennen Randen (`ui/messages.files.ts:16`, `:20`).
- Tun: Thema als Parameter, Name der App eingesetzt; die drei Stile und die Dokument-Ansicht gleich in der Plattform-Form bauen (R-11).

**B18 Sicherung und Verschlüsselung** · `modules/settings` 606 (`backup.ts`, `contract.ts`, `use-cases.ts`), `features/settings/backup-crypto.ts` 157, `BackupSection.tsx`, `RestoreSection.tsx`, `DeleteSection.tsx`, `last-backup.ts`
- Neutral: Prüfung vor dem Schreiben, ganze Datei oder nichts, PBKDF2 mit 600'000 Runden und AES-GCM, zwei Tipps in der installierten iOS-App, Erinnerung, «Alles löschen».
- Bindung: Format `randen-backup` Version 1 (`modules/settings/contract.ts:15-16`), Umschlag `randen-encrypted` (`backup-crypto.ts:8`), liest alle `TABLE_NAMES` (`backup.ts:35-41`), Schlüssel `randen:last-backup` (`last-backup.ts:4`).
- Tun: Name des Formats je Produkt (Randen bleibt `randen-backup`), Tabellen aus dem Register (nur `backup: true`), die Datei nennt ihr Produkt; eine Datei eines anderen Produkts wird abgelehnt; fehlende neue Tabellen gelten als leer (AP-0).

**B19 Kopplung und Vermittler** · geplant AP-19, ADR-0028, W14, W15
- Neutral: Handschlag per QR mit Fingerabdruck, `iceServers: []`, nur Kandidaten vom Typ `host`, Befehle mit `commandId` statt Zeilen, Nachholen, Port `PeerLink`, Tabelle `pairings` ausserhalb der Sicherung, Profil mit Ablauf und Sperrliste (W14), Vermittler nur für den Handschlag (W15).
- Bindung: erlaubt sind nur Befehle der Bons (ADR-0028 Punkte 1 und 4); Nachholen nach Geschäftstag; das Hauptgerät bucht Verkäufe (Punkt 5); Option `kitchen_display.pairing`; Gerätemodus «Pass».
- Tun: Regel R-10.

**B20 Demo-Betriebe und Testküche** · `modules/demo` 5864 (`catalogue.ts` 1906, `build.ts` 1005, `engine.ts` 834, `photos.ts` 650, `plan.ts` 492 …), `features/demo` 551, `testing/index.ts` 456 (`seedKitchen` :184)
- Neutral: `createScratchStorage` (`modules/demo/scratch-storage.ts:14`), Zufall und Tage (`support.ts`), der Grundsatz «die Demo bucht über dieselben Befehle», «die Demo löscht nur eigene Daten», «jede Demo nennt ihre Funktionen». Aus `testing/index.ts`: `sequentialIds` und die feste Uhr.
- Tun: `@onestrand/demo-kit` und `@onestrand/testing`; Inhalte und Testküche bleiben je Branche.

**B21 App-Rahmen** · `apps/web/src/app` 2027 (`AppShell.tsx` 175, `nav.ts` 158, `paths.ts` 98, `routes.tsx` 54, `AppData.tsx` 176, `hooks.ts` 129, `page-transition.ts` 158, `edge-swipe.ts` 50, `use-edge-swipe-back.ts` 132, `new-version.ts` 61)
- Neutral: drei Rahmen (Tab-Leiste, schmale Leiste, Seitenleiste, ADR-0013), Übergänge, Zurückwischen (ADR-0021), neue Version, `useQuery`, `useCommand`, `useMoney`, der Ablauf von `AppDataProvider`.
- Bindung: Gruppen «Küche», «Lager», «Kontrolle» fest (`nav.ts:50-97`); vierter Tab nach `market` und `ordering` (`:117-132`); Routen als feste Liste (`routes.tsx:26-50`); `paths` nur Gastro; `new RandenDb()` und Standardnamen (`AppData.tsx:78`, `:83-85`); Kurzbefehle «Wareneingang», «Abschreiben», «Temperatur» und Farben im Manifest (`apps/web/vite.config.ts:47-65`).
- Tun: Register für Navigation (Gruppe, Reihenfolge, Funktionen, Rechte, Anspruch auf einen Tab) und für Routen je Modul; Arbeitsplatz je Rolle (W14); eine Konfiguration des Produkts (Name, Farben, Symbol, Name der Datenbank, Präfix der Schlüssel, Format der Sicherung, Kurzbefehle).

**B22 UI-Kit und Tokens** · `apps/web/src/ui` 6162 in 47 Dateien, `ui/charts` 1351, `index.css` (87 Farbvariablen), `ui/tones.ts` 105; `docs/design.md`, `docs/ui-kit.md`, Styleguide
- Neutral: Button, Field, Sheet, Toast, DataTable, GroupedList, StatTile, Diagramme, Datum, Geld, Prozent, Foto, Druckknopf und die Kit-Regeln (`busy` statt `disabled`, eine Bedeutung je Farbe). Rund 7'500 Zeilen.
- Bindung: Tokens tragen die Namen der Marke, `wine`, `grape`, `cork` (`index.css:15-30`), in 135 Klassen in 56 Dateien; Töne `cold`, `frozen`, `dry`, `bar`, `grape`, `wine` (`tones.ts:9-20`); Gastro-Bausteine im Kit: `AllergenPicker`, `DishPhoto`, `TemperatureField`, `UnitPriceField`, `QuantityField` (g, ml, Stück), `ArticlePicker` und `RecipePicker`, die `lookup.articles` und `lookup.recipes` abfragen (`ui/pickers.tsx:354`, `:362`, `:390`).
- Tun: semantische Tokens (`accent`, `accent-strong`, `surface-dark`, `band`, `ink`, Statustöne); die Marke setzt die Werte. Das Umbenennen der Klassen ist mechanisch und optisch ohne Wirkung (Vorschaubilder vorher und nachher). Gastro-Bausteine ziehen aus dem Kit in Randen.

**B23 Texte und Sprachtest** · `app/messages.ts` 80, `features/*/messages.ts`, `ui/messages*.ts`, `app/messages.test.ts`
- Neutral: Texte nur in Katalogen; Prüfung auf «du», «ss», keine Ausrufezeichen, keine Schlagworte.
- Bindung: Der Test verlangt «Randen» mit grossem R (`messages.test.ts:73`) und mindestens 11 Feature-Kataloge (`:35`). Im Kern stehen 60 deutsche Bezeichnungen (`label: '…'`) (etwa `model/haccp.ts:22-30`, `domain/vat.ts:9-18` mit «Vor Ort konsumiert», `domain/business-profiles.ts:89` und folgende; TD-04). Nur de-CH (E-25).
- Tun: Sprachtest als Plattform-Funktion mit dem Namen des Produkts als Parameter; Kern ohne Texte; Kataloge so, dass später `fr-CH` und `it-CH` danebenpassen.

**B24 Fakten mit Quelle** · `docs/fakten.md` 660
- Neutral: das Verfahren (Quelle, gelesen am, gültig ab, Marke nach L-17, «Richtwert»), Abschnitt 3 Mehrwertsteuer, die Aufbewahrung; künftig Arbeit und Zeit, Buchführung, Datenschutz, Feiertage.
- Gastro: Allergene, Herkunft im Offenverkauf, HACCP, Kennzahlen der Küche, Food Waste, Haltbarkeit, Rüstverluste.
- Bindung im Code: Die MWST-Sätze tragen Gastro-Bezeichnungen (`domain/vat.ts:9-18`), und das Wareneinsatz-Ziel steht in derselben Datei (`:22`). Die Sätze sind Daten mit `validFrom`; die Abstimmung vom 29.11.2026 (Kommentar `vat.ts:6-7`) zeigt, dass die Plattform Satzwechsel tragen muss.
- Tun: `fakten` der Plattform im Repo `business-suite`; jede Branche führt ihre eigenen.

**B25 Prüfwerkzeuge** · `scripts/check.mjs` 68, `check-licenses.mjs` 62, `check-contrast.mjs` 131, `build-cf.mjs` 7; `apps/web/scripts/preview.ts` 156, `icons.ts` 120, `static-headers.ts` 54; `apps/web/e2e` 673 (vier Ansichten, axe, keine Anfrage verlässt die Herkunft)
- Tun: `@onestrand/tooling`; die Kontrastprüfung liest die Farben aus der Konfiguration des Produkts.

**B26 CI, Auslieferung, Kopfzeilen** · `.github/workflows/ci.yml` 130, `wrangler.jsonc` 17 (`name: "randen"` :5), `apps/web/public/_headers` 20 (CSP :5)
- Bindung: Der Projektname ist die Herkunft und wird nie umbenannt (ADR-0020 Punkt 4).
- Tun: Vorlage je Produkt; der Vermittler bekommt ein eigenes Projekt.

**B27 Regel-Tests** · `apps/web/src/side-effects.test.ts` (Register `docs/nebenwirkungen.md` :13, Arten :24-58, `RTCPeerConnection` zusammen mit `WebSocket` :28), `apps/web/src/security.test.ts`, `eslint.config.js`
- Tun: als Fabrik-Funktionen mit Pfaden in `@onestrand/testing`; WebRTC als eigene Art (ADR-0028 Punkt 8); eine ESLint-Grenze Plattform–Branche (R-2).

**B28 Kontakte** · `SupplierSchema` (`model/article.ts:28-46`)
- Neutral: Name, Kundennummer, Telefon, E-Mail, Notiz.
- Gastro: `kind: 'market'`, `categoryOrder` für den Gang durch die Hallen, Bestell- und Liefertage, Mindestbestellwert.
- Tun: Plattform «Kontakte» für Lieferanten, Kundschaft und Eigentümer:innen von Objekten; Belege und Aufträge verweisen darauf; Gastro-Felder als Erweiterung.

**B29 Aufträge, Einsätze, Objekte, Rapport** und **B30 Offerte und Rechnung** · neu, siehe 2.3.

### 2.3 Was Randen nicht hat, andere Branchen aber brauchen

Gesucht für Reinigung und Facility, Hauswartung, Malerei, Dachdeckerei, Umzug, Haustechnik, Garten, Hotel und Coiffeur. Alles Stufe 1 (auf dem Gerät), ohne Anbindung.

| Baustein | Wer es braucht | Was es ist | Baut auf | Aufwand |
| --- | --- | --- | --- | --- |
| Kundschaft und Objekte | alle ausser Hotel | Kontakt, Adresse des Objekts, Räume oder Flächen, Zugang und Schlüssel als Notiz; nur nötige Daten, Löschfrist (DSG) | B28 | M |
| Aufträge und Einsätze | Reinigung, Handwerk, Umzug, Garten, Haustechnik | Auftrag mit Einsätzen (Tag, Team, Objekt), Woche planen, Status als Ledger, Stunden je Auftrag aus dem Zeit-Ledger (Bezug `ref`) | B12, B5 | L |
| Rapport und Leistungsnachweis | alle Branchen mit Kundschaft | erledigte Arbeit, Stunden, Material, Fotos vorher und nachher, Mängel, Unterschrift der Kundschaft auf dem Gerät, PDF im Stil «Formular» | B14, B17 | L |
| Offerte und Rechnung | Handwerk, Umzug, Reinigung, Garten | Positionen mit Einheit, Menge, Preis, Rabatt, MWST; Rechnung mit Swiss QR Code; Zahlungseingang von Hand; Erinnerung bei Verzug; keine Buchhaltung und keine Anbindung an Banken | B13, B17 | XL |
| Termine | Coiffeur, Umzug (Besichtigung), Haustechnik | eigener Kalender des Betriebs, Kalenderdatei für die Kundschaft auf Wunsch | B15, B16 | M |
| Aufmass und Einheiten | Malerei, Dachdeckerei, Reinigung, Umzug | m, m², m³, Stunden als Einheiten; Flächen je Raum | B2 | M |
| Material-Lager ohne Ablauf | Malerei, Reinigung, Haustechnik | Bestand und Verbrauch je Auftrag, ohne FEFO und Verbrauchsdatum | B5 | L |
| Fahrzeuge und Geräte | Handwerk, Umzug, Garten | Wartung und Prüfung mit Intervall als Checkliste, Fahrtenbuch später | B14 | M |

Fachliches je Branche (Zimmerstatus im Housekeeping, Volumenrechnung beim Umzug, Normpositionen im Bau) bleibt Branche. Normpositionen und branchenübliche Kataloge sind oft lizenziert; vor jeder Übernahme die Lizenz klären.

### 2.4 Was Gastro bleibt

Artikel mit Allergenen und Herkunft · Rezepte mit Kalkulation, Marge, Preisänderung und Varianten · Lager mit Chargen, FEFO und Verbrauchsdatum · Produktion, Etiketten, Rückverfolgung · Menüplan, Menülinien, Mahlzeiten, Tellerrücklauf · Speisekarte und Gästeansicht · Küchenmonitor, Bons, Lieferung an Gäste · HACCP-Messarten und Grenzwerte · Food-Waste-Kennzahlen, Menu-Engineering · Einkauf im Markt und Bestellvorschlag · Laden und Theke, Standplätze · die 23 Betriebsarten · L-GAV und die Handwerks-GAV der Lebensmittelbranche · Demo-Küchen und Testküche.

---

## 3. Blocker der Verallgemeinerung

1. **Feste Liste der Tabellen.** `TABLE_SCHEMAS` (`ports/storage.ts:36-60`) bestimmt den Typ `Storage`, den Speicher im Arbeitsspeicher, die Sicherung (`modules/settings/backup.ts:35-41`) und die Dexie-Indizes (`data/db.ts:25-55`). Ohne Tabellen-Register kann kein Paket eigene Tabellen mitbringen.
2. **Feste Summe der Schnittstelle.** `CONTRACT_V1` und `createUseCases` importieren 14 Gastro-Module fest (`contract/index.ts:1-39`, `application/index.ts:25-42`); das Befehls-Kit liest `CONTRACT_V1` (`application/command.ts:105`).
3. **Betrieb als Küche, ein Betrieb je Gerät.** `Business` mit Küchenfeldern und geschlossenen Listen (`model/business.ts:6-73`); ADR-0003 Punkt 4; `purge` und Kommentar gehen von einem Betrieb je Gerät aus (`ports/storage.ts:103-109`), der Start nimmt den ältesten (`bootstrap.ts:36-38`). W16 Punkt 4 verlangt den Wechsel zwischen Betrieben auf einem Gerät.
4. **Speicherschlüssel, Datenbank und Sicherungsformat mit `randen`.** Datenbank `randen` (`data/db.ts:71`), `randen:extras` (`app/view.ts:10`), `randen:reloaded-for-update` (`app/new-version.ts:18`), `randen:last-backup` (`features/settings/last-backup.ts:4`), geplant `randen:device-mode` und `randen:app-lock`; Format `randen-backup` v1 (`modules/settings/contract.ts:15`) und `randen-encrypted` (`features/settings/backup-crypto.ts:8`). Für Randen dürfen sie sich nie ändern, weil Daten auf Geräten daran hängen; die Plattform braucht sie als Parameter.
5. **Farben im Code mit Namen der Marke.** Tokens `wine`, `grape`, `cork` (`index.css:15-30`, 87 Farbvariablen) in 135 Klassen in 56 Dateien, `PDF_COLOR` (`ui/pdf/kit.ts:17-34`), Manifest (`vite.config.ts:64-65`), Kontrastprüfung (`scripts/check-contrast.mjs`).
6. **Texte nur Deutsch, mit Namen «Randen».** `app/messages.ts:7`, `ui/messages.files.ts:16`, `:20`, Sprachtest `messages.test.ts:73`; 60 deutsche Bezeichnungen im Kern (TD-04).
7. **HACCP fest verdrahtet.** Selbstkontrolle ist Kern und nie schaltbar (ADR-0022 Punkt 5); Aufgaben hängen an Lagerbereichen (`model/haccp.ts:58-68`); Messarten nur Lebensmittel (`:13-19`); feste Cockpit-Zeilen (`modules/cockpit/contract.ts:45-55`); feste Gruppe «Kontrolle» in der Navigation (`nav.ts:84-96`). Für Reinigung ist der Putzplan das Produkt, nicht ein Pflicht-Anhang.
8. **Navigation, Tab-Leiste und Routen als feste Listen** (`nav.ts:50-132`, `routes.tsx:26-50`). Arbeitsplätze je Rolle (W14) und Einstiege anderer Branchen gehen so nicht.
9. **Einheiten und Fotos.** Nur g, ml, Stück (`model/primitives.ts:20`); Fotos als Data-URL in Zeilen bis 700'000 Zeichen (`:67-70`, TD-03). Belege, Rapporte und Vorher-Nachher-Fotos brauchen Blobs in eigenen Tabellen.
10. **Rollen im Entwurf widersprechen W16.** ADR-0022 Punkt 10 mit festen Rollen gegen W16 mit Profilen aus Rechten; `scopes` sind gastro und ungeprüft (`contract/operation.ts:5-18`).
11. **Querbuchungen im Entwurf.** Kasse schreibt in `sales` (ADR-0029 Punkt 4), Beleg bucht ins Lager und setzt Artikelpreise (Punkt 7), die Kopplung kennt nur Bons (ADR-0028 Punkte 1 und 4).
12. **Eine Herkunft je Produkt gegen Mischbetriebe.** ADR-0020 trennt Produkte nach Herkunft und Speicher. Ein Hotel mit Küche oder eine Firma für Reinigung und Hauswartung hätte Team, Zeit und Kasse in zwei Apps doppelt. ADR-0020 Punkt 9 sagt zudem heute «Kein gemeinsames Code-Paket».
13. **Verteilung des Codes ungeklärt.** Kopieren wie bei Rettich läuft auseinander (`docs/rettich.md`); Pakete brauchen ein Repo-Modell und Versionen (Abschnitt 6.4).
14. **Lücken in der Doku.** ADR-0032 steht in `docs/adr/README.md:38` und wird von ADR-0028 und ADR-0029 zitiert, die Datei fehlt. Sie entscheidet über `'wasm-unsafe-eval'` (E-17), also über Texterkennung und QR-Leser für jede Branche.
15. **Demo und Testküche im Kern.** `modules/demo` (5864 Zeilen) ist Teil der Schnittstelle (`contract/index.ts:5`), `seedKitchen` (`testing/index.ts:184`) ist die Grundlage fast aller Logik-Tests.

---

## 4. Regeln für die Randen-Sitzung jetzt

Ziel: Was Randen in AP-1, AP-2, AP-3 bis AP-6, AP-7, AP-8, AP-15, AP-16, AP-17 und AP-19 baut, wandert später ohne Umbau in die Plattform. Die Regeln ändern keine harte Regel aus CLAUDE.md und kein NEIN aus Abschnitt 0.1 des Masterplans. Sie kosten nichts und brauchen keinen Entscheid des PO; R-6 und R-4 ändern Entwürfe (ADR-0029, ADR-0022), die Claude als kleine Entscheide nachführen kann.

**R-1 Eigener Ordner.** Plattform-Teile kommen nach `packages/core/src/platform/<baustein>/` (eigene `model.ts`, `contract.ts`, `use-cases.ts`, `rules.ts`; Tests in `packages/core/test/platform/`) und `apps/web/src/platform/<baustein>/` (Seiten, `messages.ts`). Bausteine: `features` (Engine des Registers), `access` (Rechte), `team`, `time`, `absences`, `payroll`, `books`, `checks`, `calendar`, `reminders`, `pairing`, `documents`. Ihre Modelle stehen nicht in `model/`. Was Gastro ist (Einträge des Registers, Rollen-Vorlagen der Küche, L-GAV, erlaubte Bon-Befehle, Fahrerkasse, HACCP-Messarten), bleibt in `domain/` und `modules/`.

**R-2 Importgrenze, geprüft.** Code unter `platform/` importiert nur `ids`, `money`, `currency`, `dates`, `format`, `model/primitives`, `contract/operation`, `contract/events`, `application/command` (das Kit), `ports` und andere `platform/`-Ordner; nie `model/{article,recipe,menu,haccp,stock,storage-area,sales}`, `domain/*`, `modules/*` oder `features/*`. Ein neuer Block in `eslint.config.js` (Muster wie `:69-80`) und ein Test erzwingen das. Braucht ein Plattform-Teil etwas aus Gastro, geht es über einen Port (R-6).

**R-3 Register getrennt in Engine und Einträge (AP-1).** Typen und Engine (`FeatureDef`, Auflösung von `requires` über alle Stufen, `switchFeature`, Umfang, Optionstypen, `stage`, `availability`, Gerätemodus als Register) nach `platform/features/`. Die Einträge und Vorschläge in `domain/feature-catalog.ts`. `group`, `suggest` und `roles` sind Zeichenketten-Kennungen, die das Produkt festlegt; die Engine kennt keine Gastro-Kennung. Texte in `messages.ts` (ADR-0022 Punkt 4).

**R-4 Rechte nach W16, an der Operation (AP-2).** Je Funktion `none`, `view`, `operate`, `manage`; heikle Rechte als Schlüssel (`wages`, `figures`, `cash`, `correct_time`, `people`, `settings`, `export_delete`). Profile sind Zeilen je Betrieb (Vorschlag Tabelle `accessProfiles`), Vorlagen sind Daten; fest in der Plattform ist nur «Inhaber:in», Küchenchef:in, Köch:in, Service und Fahrer:in sind Gastro-Vorlagen. `StaffMember.role` bleibt lesbar und wird beim Lesen auf ein Profil abgebildet. Jede neue Operation trägt `access: { feature, level, rights? }`; durchgesetzt in einer Hülle um `createUseCases` (Nahtstelle aus ADR-0022 Punkt 10), nicht in den Seiten. Der Filter beim Senden an fremde Geräte (W14) liest dieselben Rechte. ADR-0022 Punkt 10 wird vor AP-2 mit W16 nachgeführt.

**R-5 Neutrale Namen.** Kennungen, Tabellen, Ereignisse und Texte der Plattform: `Business`, `StaffMember`, `TimeEntry`, `CashEntry`, `Closing`, `Voucher`, `VoucherFile`, `MonthPackage`, `Pairing`, `ChecklistTask`; nie `kitchen`, `chef`, `cook`, `guest`, `dish`, `menu`, `pass`, `haccp`, `food`. Texte sagen «Betrieb», «Team», «Arbeitsplatz», nie «Küche», «Gäste», «Koch»; den Namen der App setzt der Katalog als Platzhalter ein, nie «Randen» im Text. «Küchenleitung» (ADR-0023 Punkt 6) heisst in der Plattform «wer das Recht `correct_time` hat».

**R-6 Querbuchungen nur über Ports, die das Produkt einsteckt (AP-13, AP-16).** Der Tagesabschluss schreibt seinen Umsatz je MWST-Satz in die eigene Tabelle `closings`; Randens Zahlen lesen ihn über eine Umsatzquelle, statt dass die Kasse `Sale`-Zeilen in `sales` schreibt (Nachtrag zu ADR-0029 Punkt 4, «jeder Franken zählt einmal» bleibt). `vouchers.book` ruft für Zeilen «an Lager» einen Port `GoodsReceipt`, den Randen mit `createStockLedger` umsetzt; Artikelpreise setzt diese Umsetzung, nicht die Kasse. Der Port läuft in derselben Transaktion (`runCommand`). Gleiches Muster, wo der Küchenmonitor Kasse oder Verkäufe berührt.

**R-7 Speicher neutral und nie umbenannt.** Neue Tabellen heissen neutral (`timeEntries`, `accessProfiles`, `staffPins`, `cashEntries`, `closings`, `vouchers`, `voucherFiles`, `monthPackages`, `pairings`, `checklistTasks`) und stehen mit Schema, Indizes und Kennzeichen (Betrieb oder Gerät, Sicherung ja oder nein, nur anfügen) an einer Stelle je Baustein. Tabellen des Geräts (`meta`, `staffPins`, `pairings`) bleiben ausserhalb von `TABLE_NAMES`. Neue `localStorage`-Schlüssel nur über eine Funktion `deviceKey(name)`, die heute `randen:` voranstellt; die bestehenden `randen:*` bleiben. Dateien liegen als Blob in eigenen Tabellen, nie als Data-URL in einer Zeile (TD-03).

**R-8 Ein Ledger-Muster (AP-3, AP-13, AP-16).** Zeit-Ledger, Bon-Ledger und Kassenbuch nutzen einen Helfer «nur anfügen» mit Korrektur als neuer Zeile und Prüfkette über einen Port `Hasher` (WebCrypto im Browser, Node im Test). Minuten und Rappen als Ganzzahl, Zustand berechnet, ein Eigenschaftstest je Ledger. Zeitbuchungen bekommen ein optionales, neutrales Feld `ref` für einen späteren Bezug auf Aufträge; Randen nutzt es nicht.

**R-9 Regelwerke als Daten mit Quelle (AP-3 bis AP-6, AP-17).** Arbeitsgesetz, Feiertage je Kanton und MWST-Sätze mit `validFrom` gehören der Plattform; L-GAV, GAV Bäckerei, GAV Fleisch und HACCP-Grenzwerte gehören Randen. Alle stehen als Einträge in einem Register `ruleSets` mit Kennung, Quelle und «gültig ab». Das Ende des Geschäftstags ist eine Option mit Standard je Branche (Gastro 04:00), keine feste Zahl. Neutrale Bezeichnungen der MWST-Sätze («Normalsatz», «reduzierter Satz», «Sondersatz Beherbergung») in der Plattform, die Gastro-Sätze «vor Ort» und «zum Mitnehmen» als Vorschlag in Randen.

**R-10 Kopplung und Vermittler produktneutral (AP-19, W15).** Protokoll (`hello`, `have`, `command`, `ack`, Version, Filter der Kandidaten, Nachholen, Profil mit Ablauf, Sperrliste) in `platform/pairing/` mit Port `PeerLink`; die Liste der erlaubten Befehle und den Zeitraum fürs Nachholen gibt das Produkt hinein (Randen: Befehle der Bons, Geschäftstag). Der Vermittler ist ein eigenes, kleines Projekt in eigenem Ordner (`apps/vermittler/`), mit der Kennung des Produkts als Feld in jeder Nachricht, verschlüsselt mit dem Schlüssel der Kopplung, ohne «randen» in Pfaden und Nachrichtentypen; die CSP erhält in `connect-src` nur seine Adresse; Zeile in `docs/nebenwirkungen.md`; vor einem bezahlten Plan fragt Claude den PO.

**R-11 Dokumente und Marke als Parameter (AP-15, AP-3, AP-16).** Die Dokument-Ansicht und die Stile «Übersicht», «Streifen», «Formular» bekommen ein Thema als Parameter statt `PDF_COLOR`; `creator` und Texte nehmen den Namen der App aus der Konfiguration. Plattform-Seiten nutzen Farben nur über `tones.ts` oder künftige semantische Tokens, keine neuen `wine-*`-, `grape-*`- oder `cork-*`-Klassen. PDF-Bauer der Plattform (Monatsblatt, Tagesabschluss, Monatspaket, Lohn-Export) importieren nichts aus Gastro.

**R-12 Tests ohne Testküche.** Tests der Plattform-Ordner laufen auf `createMemoryStorage` mit einem schlanken Seed (Betrieb, zwei Personen), nicht auf `seedKitchen` (`testing/index.ts:184`). Je ein Test prüft die Importgrenze (R-2) und dass Plattform-Texte weder «Randen» noch Gastro-Wörter tragen. Sprachtest und Nebenwirkungen-Test decken `platform/` mit ab.

**Was das je Paket heisst**

| Paket | In die Plattform | Bleibt Gastro |
| --- | --- | --- |
| AP-1 Funktionen 2.0 | Engine des Registers, Umfang, Optionstypen, `availability`, Rahmen des Gerätemodus, `deviceKey` | Einträge, Vorschläge je Art, Allergene im Kern, Modus `pass` |
| AP-2 Team und Rollen | Person, Rechte und Profile nach W16, Weitergabe-Regeln, PIN in Gerätetabelle, Datenblatt, Löschplan | Rollen-Vorlagen der Küche, Regelwerk-Vorschläge je Art |
| AP-3 bis AP-6 Zeit, Dienstplan, Abwesenheiten, Lohn-Export | Zeit-Ledger, Stempeluhr, Monatsblatt, Saldi, Feiertage, Arbeitsgesetz, Lohn-Export, `ref` an Zeitbuchungen | L-GAV und GAV, Trinkgeld als Option, Vorlage «geteilter Dienst» |
| AP-7 Checklisten | Engine: Vorlage, Wiederkehr, Liste, Abhaken, Übergabe, Schulungen, Messpunkt mit Einheit | HACCP-Messarten, Grenzwerte, Vorlagen «Restspiess», «Gebäck vom Tag» |
| AP-8 und AP-17 Erinnerungen, Kalender | ICS, Zahl am Symbol, Kalender, Saisons, Ruhetage | Saison-Beispiele, Bewilligungen für Stände |
| AP-15 Dokument-Ansicht | Ansicht mit pdf.js, drei Stile, Thema | die elf Gastro-PDF-Bauer |
| AP-16 Kasse und Belege | Kassenbuch, Abschluss, Belege, Monatspaket, ZIP, CSV, MWST-Vorschau, Ports `GoodsReceipt` und Umsatzquelle | Umsetzung der Ports, Fahrerkasse, `imbiss_flat`, Zahlart «Plattform» |
| AP-19 Kopplung | Protokoll, Port `PeerLink`, Tabelle `pairings`, Profil mit Ablauf, Vermittler | Liste der Bon-Befehle, Hauptgerät bucht Verkäufe |

---

## 5. Was aus Rettich für die Plattform taugt (nur gelesen)

Rettich bleibt unberührt. Übernommen wird als Kopie mit Herkunftsvermerk ins Repo `business-suite`; nichts fliesst zurück.

| Was | Wo in Rettich | Für die Plattform |
| --- | --- | --- |
| Texterkennung auf dem Gerät | `Rettich/apps/web/src/features/receipts/read-image.ts` 63 (tesseract.js selbst gehostet, Bild aufrecht und vergrössert), `read-pdf.ts` 39 (Text aus PDF), `Rettich/packages/core/src/receipt/parse-receipt.ts` 761 und `pdf-lines.ts` 46 | Belege jeder Branche lesen (AP-9). Der Parser ist für Kassenzettel von Haushalten gebaut und braucht für Rechnungen von Lieferanten eine Anpassung. Rettich speichert das Bild nicht; die Plattform behält es (ADR-0029, E-08). Braucht `'wasm-unsafe-eval'` in der CSP, wie bei Rettich (`Rettich/apps/web/public/_headers:4`), also E-17 und das fehlende ADR-0032 |
| Dokument-Ansicht mit pdf.js | `Rettich/apps/web/src/features/reports/render-pdf.ts` 31, `ReportViewPage.tsx` 100, `pdf-kit.ts` 642, Stil «Quittung» in `receipt-pdf.ts` 311 und `receipt-spec.ts` 295 | Dokument-Ansicht und Stile «Übersicht» und «Streifen» (ADR-0026) |
| Codes lesen | `Rettich/apps/web/src/features/scan/BarcodeScanner.tsx` 275, `camera.ts` 121 (zxing-wasm, Kamera nur nach Tipp), `Rettich/packages/core/src/scan/gs1.ts` 295 | QR-Rechnung lesen, Kopplung per QR, Strichcode an Material und Artikeln |
| App-Sperre ohne Server | `Rettich/apps/web/src/app/lock/` (rund 490 Zeilen ohne Tests; WebAuthn, Face ID oder Gerätecode) | Gerät der Inhaberin oder des Inhabers (ADR-0030 Punkt 7) |
| Kalenderdatei und Zahl am Symbol | `Rettich/packages/core/src/calendar.ts` 124 (RFC 5545, Zeitzone Zürich), `Rettich/apps/web/src/app/app-badge.ts` 47 | Erinnerungen (B15) |
| Release und Pflege | `Rettich/scripts/release.mjs` 102 (Version aus Conventional Commits, CHANGELOG auf Deutsch, `--count`), `.github/workflows/release.yml`, Rhythmus nach Rettich-ADR-0017 | Versionen der Plattform-Pakete und der Produkte; ohne Versionen kann kein Produkt eine Plattform-Version festhalten |
| Wächter für ein öffentliches Repo | `Rettich/apps/web/src/private-ideas.test.ts` (verbotene Namen nur als Hash-Präfixe, verbotene Pfade), `security-txt.test.ts`, `SECURITY.md` | `business-suite` ist öffentlich: Strategie, Preise und Namen anderer Produkte bleiben draussen |
| Kleines | `Rettich/packages/core/src/export/csv.ts` 35, Mengen-Rad (Rettich-ADR-0083), Feedback-Frage nach einer Woche (0089), Ferien-Check (0069), Datum von Etiketten lesen (`scan/label-reading.ts` 162) | CSV im Monatspaket, Inventur und Material am iPhone, Pilot, Betriebsferien |

---

## 6. Paketstruktur der Plattform

### 6.1 Pakete

| Paket | Art | Inhalt | Hängt ab von |
| --- | --- | --- | --- |
| `@onestrand/core` | rein TS | IDs, Geld, Währung, Datum, Format, Primitive, Einheiten-Register | `zod` |
| `@onestrand/contract` | rein TS | Operation, Befehl, Abfrage, Ereignis, Fehler, `composeContract`, Befehls-Kit, JSON Schema, Zugriffs-Daten an der Operation | core |
| `@onestrand/storage` | rein TS | Ports (Uhr, IDs, Speicher, Hasher), Tabellen-Register, Speicher im Arbeitsspeicher, Start (Bootstrap), Sicherung (Format, Prüfung, Lesen, Schreiben) | core, contract |
| `@onestrand/ledger` | rein TS | Helfer «nur anfügen», Prüfkette, Testhelfer für Eigenschaftstests | core, storage |
| `@onestrand/features` | rein TS | Register-Engine, Umfang, Einrichten-Engine, Gerätemodus-Register, `availability` | core |
| `@onestrand/access` | rein TS | Rechte, Profile, Vorlagen-Typ, Weitergabe-Regeln, Hülle um Use Cases, Filter beim Senden | core, contract, features |
| `@onestrand/files` | rein TS | ZIP ohne Kompression, CSV, ICS, Prüfsummen über Port | core |
| `@onestrand/calendar` | Modul | Betriebskalender, Saisons, Feiertage je Kanton, Erinnerungen | core, contract, storage, features |
| `@onestrand/team-time` | Modul | Person, Zeit-Ledger, Stempeluhr, Dienstplan, Abwesenheiten, Saldi, Monatsblatt, Lohn-Export, Regelwerk-Register | contract, storage, ledger, access, calendar, files |
| `@onestrand/books` | Modul | Kassenbuch, Tagesabschluss, Belege, Monatspaket, MWST-Vorschau, Ports `GoodsReceipt` und Umsatzquelle | contract, storage, ledger, access, files |
| `@onestrand/checks` | Modul | Aufgaben, Checklisten, Wiederkehr, Messpunkte, Übergabe, Schulungen, Bericht | contract, storage, access, calendar |
| `@onestrand/contacts` | Modul | Lieferanten, Kundschaft, Objekte | contract, storage, access |
| `@onestrand/pairing` | Modul | Protokoll der Kopplung, Port `PeerLink`, Profil mit Ablauf, Sperrliste | contract, storage, access |
| `@onestrand/demo-kit` | rein TS | Speicher zum Bauen, Zufall, Tage, «Demo löscht nur eigene Daten» | storage |
| `@onestrand/testing` | rein TS, nur Tests | feste Uhr, fortlaufende IDs, schlanker Seed, Sprachtest, Nebenwirkungen-Test, Sicherheitstest, Importgrenze als Fabriken | core, storage |
| `@onestrand/web-data` | Browser | Dexie-Adapter aus dem Tabellen-Register, Uhr und IDs des Browsers, dauerhafter Speicher, `deviceKey` | storage, `dexie` |
| `@onestrand/web-device` | Browser | Teilen, Drucken, Kamera, Wake Lock, Zahl am Symbol, WebCrypto (Sicherung, PIN), Texterkennung, pdf.js, QR, WebRTC für `PeerLink` | core |
| `@onestrand/pdf` | Browser | PDF-Kit mit Thema, drei Stile | core, `jspdf` |
| `@onestrand/ui` | React | Kit, Diagramme, semantische Tokens (CSS), Kit-Texte de-CH | core |
| `@onestrand/shell` | React | AppShell, Register für Navigation und Routen, Arbeitsplatz je Rolle, `AppDataProvider`, `useQuery`, `useCommand`, `useFeature`, `useRight`, `useDetailed`, Rahmen des Gerätemodus, Dokument-Ansicht, Seiten Betrieb, Funktionen, Team, Daten, Über | ui, web-data, web-device, pdf, contract, features, access |
| `@onestrand/tooling` | Node, nur Entwicklung | `check`, Lizenzen, Kontrast, Vorschaubilder, Kopfzeilen, ESLint- und TS-Vorlagen, Release | – |
| `apps/vermittler` | Worker | Handschlag der Kopplung (W15) | contract (nur Nachrichtentypen) |

**Module mit zwei Einstiegen:** `@onestrand/team-time`, `books`, `checks`, `contacts`, `calendar` und `pairing` haben je `.` (rein TS: Modell, Schnittstelle, Use Cases, Regeln) und `./web` (React: Seiten, Texte, Einträge für Navigation und Routen). So bleibt ein Modul eine Einheit, wie heute in Randen (`modules/<name>` und `features/<name>`, ADR-0005), und der reine Teil läuft später auch auf einem Server.

**Branche und Produkt:** `@randen/gastro` (rein TS: Artikel, Rezepte, Allergene, Lager, Produktion, Menüplan, Speisekarte, Küchenmonitor, HACCP-Teile, Gastro-Regelwerke, Betriebsarten, Demo-Küche) und `@randen/web` (Seiten, Marke, Konfiguration des Produkts, Dexie-Versionen). Eine neue Branche ebenso: `@<produkt>/<branche>` und `@<produkt>/web`.

### 6.2 Abhängigkeiten

```
                     @onestrand/core
                           │
                   @onestrand/contract
                           │
                   @onestrand/storage ──────────── @onestrand/files
                    │          │                          │
        @onestrand/ledger  @onestrand/features            │
                    │          │                          │
                    │   @onestrand/access                 │
                    │          │                          │
   Module: calendar · checks · contacts · pairing · team-time · books
                           │
          Branche: @randen/gastro, @<produkt>/<branche> (rein TS)
                           │
   Browser:  web-data · web-device · pdf        React:  ui ─ shell ─ Module/web
                           │
          Produkt: @randen/web, @<produkt>/web (Marke, Konfiguration)
```

Regeln, durch ESLint und einen Test erzwungen:

1. Rein-TS-Pakete importieren nie React, DOM oder Dexie (wie heute `eslint.config.js:47-62`).
2. Die Plattform importiert nie eine Branche. Branchen importieren einander nicht; was zwei Branchen teilen, gehört in die Plattform. So kann ein Produkt zwei Branchen tragen (Abschnitt 8, E-P1).
3. Module der Plattform rufen einander nicht auf (ADR-0005); was sie verbindet, ist ein Port, den das Produkt beim Zusammensetzen einsteckt.
4. `./web` darf `@onestrand/ui` und die Hooks aus `@onestrand/shell` nutzen, nie `web-data` direkt (wie heute ADR-0003 für `features/`).
5. Jede Operation trägt `access`; ein Test prüft, dass keine Operation ohne steht.

### 6.3 Was ein Produkt beim Start zusammensetzt

```ts
// Skizze, Namen sind Vorschläge
const product = defineProduct({
  id: 'randen',                       // Präfix der Schlüssel, nie ändern
  name: 'Randen',
  database: 'randen',                 // nie ändern
  backupFormat: 'randen-backup',      // nie ändern
  theme: randenTheme,                 // Leitfarbe und Töne
  modules: [teamTime, books, checks, calendar, pairing, gastro],
  ports: { goodsReceipt: stockLedgerReceipt, revenue: closingsRevenue },
  dbVersions: RANDEN_DB_VERSIONS,     // von Hand geführt, nur angehängt
});
```

`defineProduct` setzt Schnittstelle, Tabellen, Navigation, Routen, Rechte und Register zusammen; die Typen prüfen, dass jede Operation eine Umsetzung hat (wie heute `UseCases` in `application/command.ts:30`).

### 6.4 Wo der Code liegt

| | (a) Monorepo `business-suite` mit `packages/*` und `apps/<produkt>` | (b) Plattform-Pakete in `business-suite`, Produkte in eigenen Repos |
| --- | --- | --- |
| Eine Version überall | ja, ein Commit für Plattform und Branche | nein, jedes Produkt hält eine Plattform-Version fest |
| Parallele Agenten | je Agent ein Ordner, gemeinsamer `main` | je Agent ein Repo |
| Änderung an der Plattform | ein PR, alle Produkte gleich geprüft | Release der Plattform, dann ein PR je Produkt |
| CI | eine Pipeline mit Filtern je Ordner; öffentliches Repo | je Repo |
| Randen | zieht um; das Cloudflare-Projekt `randen` behält Namen und Herkunft, nur seine Verbindung zum Repo ändert sich (vor dem Umzug prüfen) | bleibt, wo es ist |
| Verteilung | keine | Git-Abhängigkeit auf einen Tag oder ein Paketregister; beides vorher prüfen |

**Empfehlung:** (a) als Ziel. Randen bleibt bis zum Ende von Schritt 5 (Abschnitt 7) in seinem Repo und baut nach Abschnitt 4; neue Branchen beginnen gleich als `apps/<produkt>` im Monorepo; Randen zieht ein, sobald die Grundpakete stehen. Rettich bleibt in jedem Fall getrennt. Entscheid des PO (E-P2).

---

## 7. Herauslösen in Schritten

**Besitz:** Jeder Plattform-Baustein hat zu jeder Zeit genau eine Sitzung, die ihn baut. Solange Randen einen Baustein baut (Team und Zeit, Kasse, Kopplung), baut keine andere Branche ihn parallel; sie wartet auf das Paket oder nimmt den Stand aus `platform/`.

| Schritt | Bausteine | Wer | Ergebnis |
| --- | --- | --- | --- |
| 0, jetzt | Regeln R-1 bis R-12 | Randen-Sitzung | Neues entsteht in `platform/` |
| 1 | B1, B2, B25, B26, B27 | Kopf | `business-suite` mit `core`, `tooling`, `testing`, CI, Wächter für ein öffentliches Repo |
| 2 | B3, B4, B7, B23, B24 | Kopf | `contract`, `storage`, `BusinessBase`, Sprachtest, Fakten der Plattform |
| 3 | B5, B6, B17 | Kopf | `ledger`, Start, `pdf` mit Thema |
| 4 | B8, B18 | Kopf, nach AP-1 | `features`, Sicherung je Produkt |
| 5 | B10, B11, B22 | Kopf, nach AP-2 | `access`, Gerätemodus, `ui` mit semantischen Tokens |
| 6 | B9, B14 | Kopf (Checklisten-Engine aus dem Reinigungsplan, gebraucht für Reinigung) | `features` mit Einrichten, `checks` |
| 7 | B21, B12 | Kopf, nach AP-3 | `shell`, `team-time` |
| 8 | B13 | nach AP-16 | `books` |
| 9 | B15, B16 | nach AP-8 und AP-17 | `calendar` |
| 10 | B28 | Kopf oder erste Nicht-Gastro-Branche | `contacts` |
| 11 | B19 | nach AP-19 und Abnahme des Versuchs | `pairing`, `apps/vermittler` |
| 12 | B20 | Kopf | `demo-kit` |
| 13, 14 | B29, B30 | erste Branche mit Kundschaft | Aufträge, Rapport, Offerte und Rechnung |

Je Schritt: Paket bauen, Randen auf das Paket umstellen (Imports, keine Logik), `pnpm check` grün in beiden, eine Sicherung vom 23.11.2026 lässt sich in Randen weiter zurückholen (Regel 3 aus Masterplan 1.3).

---

## 8. Entscheide für den PO

| Nr. | Frage | (a) | (b) | Empfehlung |
| --- | --- | --- | --- | --- |
| E-P1 | Produkte | eine App je Branche, wie W17 und ADR-0020 | Produkte als Bündel von Branchen, etwa Hotel mit Küche in einer App | die Architektur hält beides offen (Branche als Paket, R-2); zuerst (a); Mischbetriebe später als ein Produkt mit zwei Branchen, statt Team und Zeit doppelt zu führen |
| E-P2 | Wo der Code liegt | Monorepo `business-suite` | getrennte Repos mit Paketen | (a), Randen zieht nach Schritt 5 ein (Abschnitt 6.4) |
| E-P3 | Rechnungen stellen | ja: Offerte, Rechnung mit QR-Rechnung, Zahlungseingang von Hand; weiterhin keine Buchhaltung und keine Anbindung an Banken | nein, nur Belege wie in Randen | (a): für Handwerk, Umzug und Reinigung zentral; braucht Fakten mit Quelle (OR, MWST, Standard der QR-Rechnung) |
| E-P4 | Lizenz der Plattform-Pakete im öffentlichen Repo | proprietär wie Randen (`UNLICENSED`) | offen | (a) bis zum Entscheid E-22 aus dem Masterplan |
| E-P5 | Vermittler (W15) | ein Dienst für alle Produkte | ein Dienst je Produkt | ein Code, ein Projekt je Produkt: getrennte Adresse in jeder CSP, getrennte Daten; die Grenzen des Gratis-Plans vorher mit Quelle prüfen (gelten vermutlich je Konto) |
| E-P6 | Mehrere Betriebe auf einem Gerät (W16 Punkt 4) | in der Plattform vorbereiten, in Stufe 1 bauen | erst mit Server | (a) vorbereiten (B6), bauen nach dem ersten Pilot |

Keine dieser Fragen hält Schritt 0 oder Schritt 1 auf.

---

## 9. Gelesen

- Randen: `CLAUDE.md`, `AGENTS.md`, `docs/intern/auftraege/wuensche-2026-11.md`, `docs/intern/ausbau.md` (0 bis 3, AP-0 bis AP-24, 5, 7, 8, 9), `docs/intern/suite.md`, `docs/intern/README.md`, `docs/intern/firmenname.md`, `docs/rettich.md`, `docs/design.md` (Abschnitt «Gemeinsam mit Rettich»), `docs/fakten.md` (Gliederung), ADR 0003, 0005, 0006, 0007, 0008, 0013, 0015, 0017, 0019, 0020, 0022, 0023, 0025 (Auszug), 0027 (Kontext, Gliederung), 0028, 0029, 0030 (Entscheid).
- Randen-Code: `packages/core/src` (Grundtypen, `contract`, `application`, `ports`, `model/business.ts`, `model/primitives.ts`, `model/haccp.ts`, `model/article.ts`, `domain/business-profiles.ts`, `domain/vat.ts`, `modules/haccp`, `modules/cockpit/contract.ts`, `modules/settings`, `modules/demo`, `testing`), `apps/web/src` (`app`, `data`, `ui`, `ui/pdf`, `features/settings`, Tests), `scripts`, `eslint.config.js`, `wrangler.jsonc`, `apps/web/public/_headers`, `apps/web/vite.config.ts`, `package.json`.
- Rettich (nur gelesen): `CLAUDE.md`, `packages/core/src/{receipt,scan,export,calendar.ts}`, `apps/web/src/features/{receipts,reports,scan}`, `apps/web/src/app/lock`, `app-badge.ts`, `private-ideas.test.ts`, `scripts/release.mjs`, `apps/web/public/_headers`, `docs/adr` (Titel).
- `onestrand`: `README.md` (nur die Website).

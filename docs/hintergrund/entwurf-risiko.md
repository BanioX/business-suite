# Architektur der Onestrand Business Suite, Linse «Risiko und Migration»

Für Alban und für den Kopf im Repo `BanioX/business-suite`. Stand 24.11.2026. Ein Vorschlag aus einer Linse, unabhängig von anderen Vorschlägen. Keine Preise, keine Namen anderer Produkte, keine echten Firmen- oder Personennamen. Belege zum Code stehen als `Pfad:Zeile` (Randen, Stand Branch `claude/jolly-cannon-mgpxef`, Commit `a8d8e63`).

**Die Frage dieser Linse:** Was darf nicht schiefgehen, während Randen mitten im Ausbau steckt und bald mehrere Branchen-Agenten parallel arbeiten sollen? Gesucht ist der Weg mit dem kleinsten Risiko, der trotzdem früh Arbeit für Branchen erlaubt.

---

## 0. Kurzfassung

1. **Eine Plattform, eine App je Branchenfamilie, eine Herkunft je App.** Nicht eine App für alle, nicht getrennte Produkte ohne gemeinsamen Code. Gastro (Randen), Facility, Handwerk, Umzug, Beherbergung und Salon werden je eine installierbare App mit eigener Adresse, eigenem Speicher und eigener Marke, gebaut aus denselben Plattform-Paketen. Gemischte Betriebe innerhalb einer Familie (Hauswart mit Reinigung und Umgebung) laufen in einer App; über Familien hinweg nimmt eine App die Module der anderen Familie mit, statt Daten zwischen Apps zu teilen.
2. **Der Hostname trägt die Branche, nie die Marke.** Alban will «Randen» vielleicht umbenennen. Eine Herkunft lässt sich nie umbenennen, ein Anzeigename schon. Darum `gastro.onestrand.ch`, `facility.onestrand.ch` und so weiter, technische Namen klein und neutral, die Marke nur in der Konfiguration der App.
3. **Randen wird jetzt nicht umgebaut.** Die Plattform-Teile, die gerade in Randen entstehen (Register, Rollen, Team und Zeit, Kasse und Belege, Dokumente, Kopplung), werden dort fertig gebaut und erst danach in die Suite **geerntet**. Die Suite schreibt nie in `BanioX/Randen`. Bis zur Ernte bauen Branchen-Agenten keine eigene Infrastruktur, sondern nur ihre Domäne, hinter Ports, die den ADR-Entwürfen von Randen folgen.
4. **Ein Entscheid ist zeitkritisch:** die endgültige Adresse von Randen vor dem ersten Pilotbetrieb (Randen E-19). Mit `onestrand.ch` gibt es jetzt eine Domain. Vor dem Pilot kostet ein Wechsel nichts; danach muss jede Küche mit ihrer Sicherung umziehen.
5. **Code teilen:** In `business-suite` ein pnpm-Workspace (Plattform und neue Familien atomar in einem PR). Nach Randen kommt Plattform-Code später als **gestempelte Kopie** (Quelle, Commit, Prüfsumme je Datei, Test gegen Änderungen von Hand), nicht als Git-Abhängigkeit und nicht über ein Paket-Register.
6. **Daten auf den Geräten sind heilig:** Datenbank `randen`, Schlüssel `randen:*`, Format `randen-backup` v1, Projekt `randen`, `start_url` `/` bleiben für immer. Ein Namensregister der Suite hält jede Kennung fest, bevor sie entsteht.
7. **Parallele Agenten** schreiben nur in ihren Pfaden (Prüfung im CI nach Branch-Präfix), der Kopf allein ändert die Plattform und führt zusammen.

---

## 1. Ausgangslage, belegt

### 1.1 Randen heute

- Rund 112'000 Zeilen TypeScript (`packages/core/src` rund 29'000, `apps/web/src` rund 62'000), React-PWA, Dexie, Zod, jsPDF; nur statische Dateien auf Cloudflare (`wrangler.jsonc:5` `"name": "randen"`, keine Bindings).
- **Drei Schichten** (ADR-0003): Logik in `packages/core` nur mit `zod`, Daten in `apps/web/src/data`, Seiten in `apps/web/src/features`. Ein Betrieb ist eine Küche; alles gehört zu genau einem Betrieb (ADR-0003, Punkt 4).
- **Schnittstelle:** `CONTRACT_V1` als Summe der Modul-Teile (`packages/core/src/contract/index.ts:24-39`), Teile je Modul (`:42-57`), Umsetzung in `createUseCases` (`packages/core/src/application/index.ts:25-41`). Befehle tragen `commandId` und `businessId` (`packages/core/src/contract/operation.ts:40`), Ereignisse `actor`, `at`, Typ `ding.was_geschah` und `version: 1` (`packages/core/src/contract/events.ts:10-18`). Die `scopes` (`operation.ts:5-18`) prüft heute niemand (ADR-0022, Punkt 10).
- **Tabellen:** eine einzige Liste `TABLE_SCHEMAS` für Speicher, Dexie, Export und Import (`packages/core/src/ports/storage.ts:36-60`, `TABLE_NAMES` `:63`). Jede Zeile trägt `syncFields` (UUIDv7, `businessId`, `createdAt`, `updatedAt`, `deletedAt`; `packages/core/src/model/primitives.ts:107-113`).
- **Datenbank im Browser:** `RandenDb` mit dem Namen `randen` (`apps/web/src/data/db.ts:71`), Versionen 1 und 2 (`:73-80`), neue Tabellen nur als neue Version (`:25-33`). Geöffnet in `apps/web/src/app/AppData.tsx:78`.
- **Schlüssel im Gerät:** `randen:extras` (`apps/web/src/app/view.ts:10`), `randen:last-backup` (`apps/web/src/features/settings/last-backup.ts:4`), `randen:reloaded-for-update` (`apps/web/src/app/new-version.ts:18`); geplant `randen:device-mode` (ADR-0022, Punkt 11).
- **Sicherung:** Format `randen-backup`, Version 1 (`packages/core/src/modules/settings/contract.ts:15-16`). `checkBackup` verwirft eine Datei mit fehlender oder unbekannter Tabelle (`packages/core/src/modules/settings/backup.ts:115-119`, `:134-138`) und liest Betrieb und Zeilen mit den Zod-Schemas (`:99`, `:124`) und schreibt danach die **geprüften** Werte (`:130`). Ein `z.object` entfernt dabei unbekannte Felder. Das ist heute richtig, wird aber zur Falle, sobald eine ältere App eine Sicherung einer neueren mit zusätzlichen optionalen Feldern liest (Abschnitt 8).
- **Manifest:** Name «Randen», `start_url` und `scope` `/`, kein `id` (`apps/web/vite.config.ts:46-77`, `:62-63`). Ohne `id` gilt die `start_url` als Identität der installierten App; sie darf sich nie ändern.
- **Sicherheit:** CSP nur `'self'`, `connect-src 'self'` (`apps/web/public/_headers:5`), Standort gesperrt (`:9`), `noindex` (`:12`). Der Test der Nebenwirkungen zählt `fetch(`, `WebSocket` und `RTCPeerConnection` als Netz (`apps/web/src/side-effects.test.ts:26-28`).
- **Marke im Code:** Das Wort «Randen» steht 54-mal in den Textkatalogen (`messages*.ts`), die Leitfarbe heisst im Code `wine` (`apps/web/src/index.css:18-28`) und steht in 55 Seiten und Bausteinen, davon 29 im UI-Kit `apps/web/src/ui`. Das UI-Kit importiert an 15 Stellen `@randen/core`. Ein Kit für mehrere Marken braucht neutrale Namen (`accent` statt `wine`), das ist ein Umbau mit vielen Dateien.
- **Funktionen:** elf Kennungen (`packages/core/src/model/business.ts:30-42`), `Business.modules` höchstens 20 (`:63`), Fallback «ohne Liste» (`packages/core/src/domain/business-profiles.ts:298-308`). Betriebsarten nur Gastronomie (`business.ts:7-23`). Am Betrieb hängen Pflichtfelder der Küche: `targetFoodCostBps`, `defaultVatBps` (`business.ts:55-58`).
- **Lizenz:** `"license": "UNLICENSED"` (`package.json:5`), nur permissive Abhängigkeiten (`scripts/check-licenses.mjs`), neue Versionen erst nach drei Tagen (`pnpm-workspace.yaml`, `minimumReleaseAge`).

### 1.2 Was gerade in Randen entsteht

Der Masterplan (`docs/intern/ausbau.md`, Abschnitt 4 und 9.1) baut genau die Teile, die eine Suite gemeinsam braucht. Alle stehen auf «offen» oder «in Arbeit».

| Plattform-Kandidat | Paket in Randen | Entwurf | Gefahr bei Parallelbau in der Suite |
| --- | --- | --- | --- |
| Register der Funktionen (`FEATURE_CATALOG`, Optionen, Umfang, `availability`, Gerätemodus) | AP-1 | ADR-0022 | Zwei Register mit verschiedenen Feldern; Migration alter Betriebe doppelt |
| Rollen und Rechteprofile mit Stufen (W14, W16) | AP-2 | ADR-0022 Punkt 10, ADR-0030 | Zwei Rechtemodelle; Durchsetzung an `createUseCases` nur einmal richtig |
| Team, Stempeln, Zeit-Ledger, Abwesenheiten, Lohn-Export | AP-2 bis AP-6 | ADR-0023, ADR-0030 | Arbeitsrecht doppelt recherchiert, Eigenschaftstests doppelt |
| Checklisten, Übergabe, Schulungen | AP-7 | – | Facility baute sonst eine zweite Checklisten-Maschine |
| Erinnerungen ohne Server | AP-8 | ADR-0024 | – |
| Texterkennung, QR, Import | AP-9 | ADR-0032 | CSP-Ausnahme `'wasm-unsafe-eval'` zweimal entschieden |
| Dokument-Ansicht, Stile, PDF-Kit | AP-15 | ADR-0026 | Zwei PDF-Kits |
| Kasse, Belege, Monatspaket, Dateien mit Prüfsumme | AP-16 | ADR-0029 | Zwei Kassenbücher mit Prüfkette |
| Betriebskalender | AP-17 | ADR-0031 | – |
| Kopplung im WLAN, Vermittler für den Handschlag (W13, W15) | AP-19 und Folge | ADR-0028 | Zwei Kopplungen, zwei Vermittler, zwei Ausnahmen von ADR-0006 |

**Folgerung:** Wer jetzt eine Plattform aus Randen herausschneidet, schneidet in Code, den eine andere Sitzung gerade umbaut. Das ist das grösste Risiko dieser Linse. Die Suite wartet bei diesen Teilen und erntet nach.

### 1.3 Rettich, Website und Kopf

- **Rettich** bleibt eigenständig und öffentlich, technisch `fridgeai` (Rettich-CLAUDE.md). Fünf Dateien in `packages/core/src` stammen aus Rettich (`ids.ts`, `format.ts`, `money.ts`, `currency.ts`, `dates.ts`) und laufen ohne Automatik auseinander; der gemessene Stand steht nur in `docs/rettich.md:39-54`. Von Randen fliesst nichts zurück (Randen-CLAUDE.md, Arbeitsweise 5 und 7).
- **`onestrand.ch`**: nur die Website (`/home/user/onestrand`), ausgeliefert über GitHub Pages; die Nameserver und die E-Mail-Einträge liegen bei Hostpoint (onestrand-README, Abschnitt «DNS bei Hostpoint setzen»). Impressum und Postfach fehlen noch (Abschnitt «Offen»).
- **`business-suite`**: leer, ein `README.md`, öffentlich, ohne `LICENSE`.

### 1.4 Rote Linien: was nie geschehen darf

1. **Eine Herkunft wird verschoben, ohne dass die Daten mitkommen.** Herkunft ist Schema, Host und Port; an ihr hängen Speicher, Service Worker und die installierte App (`docs/intern/suite.md`, Abschnitt «Eine Herkunft pro Produkt»). Auslöser: Umbenennen des Cloudflare-Projekts oder des Kontos, ein anderer Hostname, zwei Apps unter Pfaden einer Adresse, eine neue `start_url`.
2. **Eine Kennung wird umbenannt**, die auf Geräten oder in Sicherungen steht: Datenbankname, Tabellen, Felder, Funktionen, Ereignistypen, Namen von Operationen (sie stehen im Befehlsprotokoll, `apps/web/src/data/db.ts:11-16`), Schlüssel im Gerät, Format der Sicherung.
3. **Eine Sicherung lässt sich nach einem Update nicht mehr zurückholen,** oder sie kommt zurück und verliert still Felder.
4. **Betriebsdaten verlassen neu das Gerät** ohne Albans JA (ADR-0006; Ausnahmen nur W13, W14, W15).
5. **Strategie, Preise, Namen anderer Produkte oder echte Namen** landen in einem der öffentlichen Repos.
6. **Etwas von Randen oder der Suite** landet im Rettich-Repo.
7. **Der Pilot von Randen verzögert sich** wegen eines Umbaus für andere Branchen.
8. **Eine Zahl aus Recht oder Sicherheit** erscheint in einer App ohne Quelle.

---

## 2. Produktmodell

### 2.1 Die drei Wege

| Weg | Was es heisst | Für das Risiko |
| --- | --- | --- |
| (A) Eine App für alle | Eine Adresse, ein Symbol, die Branche wird beim Einrichten gewählt | Randen müsste seine Herkunft und seinen Namen aufgeben oder alle anderen Branchen erben die Adresse der Küche. Jede Änderung für Facility geht auch an die Küchen im Pilot. Die CSP und die Berechtigungen sind die Vereinigung aller Branchen. Hunderte Funktionen in einem Einrichten widersprechen «Jede Küche wählt ihre Komplexität» (ADR-0015). Keine Marke je Branche auf dem Home-Bildschirm. **Verworfen.** |
| (B) Getrennte Produkte ohne gemeinsamen Code | Je Branche ein Repo, je eines kopiert von Randen | Recht (MWST, Aufbewahrung, Arbeitszeit), Sicherung, Rollen und Kopplung laufen auseinander wie heute die Rettich-Kopie (`docs/rettich.md:53-54`). Jeder Fehler wird sechsmal behoben. **Verworfen.** |
| (C) Eine Plattform, eine App je Branchenfamilie | Gemeinsame Pakete; je Familie eine eigene App mit eigener Herkunft, Marke, Auswahl der Module und Vorschlägen | Der Fehler einer Familie trifft nicht die anderen; Randen behält seine Daten; jede App bleibt schlank; Recht und Sicherung gibt es einmal. **Empfohlen.** |

### 2.2 Branchenfamilien statt einzelner Branchen

Eine App je einzelner Branche wäre zu fein: Wer Hauswartung macht, reinigt oft auch und pflegt die Umgebung; Maler und Gipser sind oft derselbe Betrieb. Eine Familie ist eine Gruppe von Branchen mit demselben Gegenstand der Arbeit.

| Familie | Kennung (Hostname, technischer Name) | Branchen | Gegenstand | Reihenfolge |
| --- | --- | --- | --- | --- |
| Gastro | `gastro` (technisch weiter `randen`) | alles aus ADR-0031, vom Marronistand bis zur Produktionsküche | Ware, Rezepte, Gäste, Hygiene | besteht |
| Facility | `facility` | Unterhaltsreinigung, Spezialreinigung, Hauswartung, Unterhalt der Umgebung, Winterdienst | Objekte, Flächen, wiederkehrende Leistungen (Putzplan), Kontrollgänge | erste neue Familie |
| Handwerk | `handwerk` | Maler, Gipser, Dachdecker, Spengler, Haustechnik, Schreiner, Bodenleger, Gartenbau (Neuanlage) | Offerte nach Ausmass, Auftrag, Rapport mit Stunden und Material, Rechnung | zweite |
| Umzug | `umzug` | Umzug, Räumung, Entsorgung, Möbellift | Besichtigung, Volumen, Einsatztag mit Equipe und Fahrzeug, Schadenprotokoll | dritte |
| Beherbergung | `hotel` | Hotel, Gasthof, B&B, Ferienwohnungen | Zimmer, Housekeeping (Module aus Facility), Küche (Module aus Gastro) | nach der Ernte von Gastro |
| Salon | `salon` | Coiffeur, Kosmetik, Nagelstudio | Termine, Kasse, Produkte, Kundschaft | zuletzt (heikle Notizen zur Kundschaft) |

Elektroinstallationen lasse ich bewusst aussen vor, bis die Fakten zu Bewilligung und Kontrolle geprüft sind (Vermutung: eigene Bewilligungspflicht, nicht geprüft).

### 2.3 Marke, Name und Herkunft getrennt

| Ebene | Beispiel Gastro | Beispiel Facility | Darf sich ändern? |
| --- | --- | --- | --- |
| Dachmarke | Onestrand, nur unter «Über …», auf `onestrand.ch` und in rechtlichen Texten (ADR-0020, Punkt 2) | dieselbe | ja, sie steht nicht im Kopf einer App |
| Produktname (Anzeige, Manifest, Texte) | «Randen» | offen | ja; iOS zeigt bis zum neuen Hinzufügen den alten Namen (Rettich-Lernbuch L-11), die Daten bleiben |
| Hostname (Herkunft) | `gastro.onestrand.ch` | `facility.onestrand.ch` | **nie**, nach dem ersten Pilot |
| Technischer Name (Datenbank, Schlüssel, Format, Cloudflare-Projekt) | `randen`, `randen:*`, `randen-backup`, Projekt `randen` (eingefroren) | `facility`, `facility:*`, `facility-backup`, Projekt `facility` | **nie** |

Die Hostnamen sind Branchenwörter, die auch in der Romandie und im Tessin verstanden werden (`gastro`, `facility`, `hotel`, `salon`); bei `handwerk` und `umzug` ist das nicht so, darum gehören sie vor dem ersten Pilot der Familie noch einmal auf den Tisch.

**Warum Unteradressen von `onestrand.ch`:** Jede ist eine eigene Herkunft (getrennter Speicher), und ein Passkey für `onestrand.ch` gilt später auf allen (`docs/intern/suite.md`, Abschnitt «Warum Unteradressen einer Domain»). Ein späteres Konto der Firma (Stufe 2) kann so alle Apps eines Betriebs verbinden, ohne dass ihre Speicher je zusammenfallen.

### 2.4 Gemischte Betriebe

1. **Innerhalb einer Familie:** eine App, die Funktionen der Branchen nach Antworten im Einrichten (wie ADR-0015 und ADR-0031 für die Küche).
2. **Über Familien hinweg, wenn es oft vorkommt** (Hotel mit Küche und Housekeeping, Umzug mit Endreinigung): Die App der Hauptfamilie nimmt Module der anderen Familie in ihren Build auf. Das geht, weil Module Pakete sind (Abschnitt 5). Die Daten bleiben in einer App.
3. **Selten** (Hauswart, der auch malt): Hauptfamilie wählen; was fehlt, in einer zweiten App. Austausch nur über Dateien, die die Person trägt (Kundschaft als CSV). Kein geteilter Speicher zwischen Herkünften in Stufe 1.
4. **Nie:** ein Link, der direkt in die andere App führt (auf iOS öffnet er Safari mit leerem Speicher; ADR-0020, Punkt 6). Wege führen über `onestrand.ch`.

---

## 3. Repo-Topologie

### 3.1 Die drei Wege

| Weg | Dafür | Dagegen | Urteil |
| --- | --- | --- | --- |
| Alles in ein Monorepo, Randen zieht jetzt ein | ein CI, atomare Änderungen | unterbricht die Randen-Sitzung mitten in AP-0 bis AP-19; Geschichte, Cloudflare-Anbindung und `main` als Production (Randen-CLAUDE.md, Arbeitsweise 10) wechseln gleichzeitig | jetzt nein |
| Ein Repo je Familie und eines für die Plattform | klare Grenzen | jede Plattform-Änderung braucht Veröffentlichung oder Kopie in viele Repos; Fehler zeigen sich erst später; viele CI-Konfigurationen | nein |
| **Hybrid:** `business-suite` als Monorepo für Kopf, Plattform und neue Familien; Randen bleibt in seinem Repo, bis sein Pilot stabil läuft | neue Familien und Plattform ändern atomar und mit einem CI; Randen bleibt unberührt | zwei Repos, bis Randen später einzieht oder gestempelte Kopien nimmt | **empfohlen** |

### 3.2 Ordnerplan von `business-suite`

```
business-suite/
├── README.md, LICENSE (proprietär, wie Randen), CLAUDE.md, AGENTS.md
├── package.json, pnpm-workspace.yaml (apps/*, branchen/*/*, packages/*), tsconfig.base.json,
│   eslint.config.js, vitest.config.ts, .prettierrc.json, .nvmrc
├── docs/
│   ├── plan.md                      Stand der Suite und der Wellen
│   ├── adr/                         Entscheide der Suite (zitiert als SADR-0001 …), eigene Nummern
│   ├── herkunft.md                  Tabelle aller Kopien mit Stempel (wie docs/rettich.md in Randen)
│   ├── namen.md                     lesbare Fassung des Namensregisters
│   ├── fakten/                      gemeinsame Fakten mit Marke nach L-17: mwst.md, aufbewahrung.md,
│   │                                arbeit-und-zeit.md, datenschutz.md, qr-rechnung.md
│   ├── branchen/<familie>.md        Steckbrief: was gebaut wird und wie (keine Marktdaten)
│   ├── glossar.md, schulden.md, nebenwirkungen.md, lernbuch.md, regeln.md
├── registry/
│   ├── names.json                   jede Kennung der Suite, mit Besitzer und Status
│   └── owners.json                  Branch-Präfix → erlaubte Pfade
├── packages/                        Plattform, nur der Kopf schreibt hier
│   ├── kern/                        @onestrand/kern: ids, money, currency, dates, format, primitives,
│   │                                Schnittstelle (operation, events), Command-Kit, Ports, Test-Speicher
│   ├── register/                    Register der Funktionen (nach Ernte AP-1)
│   ├── rechte/                      Rollen und Rechteprofile (nach Ernte AP-2)
│   ├── team-zeit/                   Personen, Zeit-Ledger (nach Ernte AP-3 bis AP-6)
│   ├── listen/                      Checklisten und Übergabe (nach Ernte AP-7)
│   ├── kasse-belege/                (nach Ernte AP-16)
│   ├── dokumente/                   PDF-Kit, Dokument-Ansicht, Teilen (nach Ernte AP-15)
│   ├── kopplung/                    Kopplung und Vermittler-Client (nach Ernte AP-19, W15)
│   ├── kundschaft/, objekte/, auftraege/, rechnungen/   neu in der Suite (Abschnitt 6)
│   ├── ui/                          @onestrand/ui: UI-Kit mit neutralen Farbnamen
│   ├── shell/                       Rahmen, Navigation aus dem Register, Einrichten, Sichern, Gerätemodus
│   └── daten-web/                   Dexie-Adapter, setzt die Tabellen aller Pakete einer App zusammen
├── branchen/                        je Familie, nur ihr Agent schreibt hier
│   └── facility/
│       ├── core/                    @onestrand/facility-core: Modell, Regeln, Module (contract, use-cases)
│       ├── web/                     @onestrand/facility-web: Seiten, routes.tsx, messages
│       └── docs/                    fakten.md (Marke L-17), glossar.md
├── apps/                            dünne Apps, je eine Herkunft
│   └── facility/                    app.config.ts (Marke, Speichernamen, Pakete), vite.config.ts,
│                                    public/_headers, public/icon*, wrangler.jsonc, e2e/, test/sicherungen/
├── dienste/                         nur mit Albans JA: der Vermittler (W15) als Worker, je App eigenes Projekt
└── scripts/                         check.mjs, check-licenses.mjs, check-paths.mjs, check-names.mjs,
                                     stamp.mjs (Kopie mit Stempel), check-stamps.mjs
```

**Nicht hier:** Marktdaten, Grössen von Branchen, Preise, Vergleiche mit anderen Produkten, Geschäftsmodell. Die gehören in die private Ablage (`rettich-intern` in `BanioX/SWELPER`, Branch `claude/rettich-intern`; Randen `docs/intern/README.md`, letzter Absatz). Ein Wächter-Test wie in Rettich (`apps/web/src/private-ideas.test.ts`, Namen nur als Prüfsummen) gehört von Anfang an in die Suite.

**Keine Git-Submodule:** Sie verwirren Agenten, und der Build auf Cloudflare müsste sie mitziehen.

**Cloudflare:** Ein Projekt je App, verbunden mit demselben Repo, je mit eigenem Root-Verzeichnis (`apps/<familie>`) und eigenen «Build watch paths» (`apps/<familie>/*`, `branchen/<familie>/*`, `packages/*`). Das unterstützt Workers Builds laut Doku für Monorepos (developers.cloudflare.com/workers/ci-cd/builds/advanced-setups, gelesen 24.11.2026). Ein Push mit 20 oder mehr Commits baut alle Projekte (Doku «Build watch paths»); das ist gewollt, weil `main` Production ist.

---

## 4. Wie Plattform-Code in die Apps kommt

### 4.1 Vier Wege, alle kostenlos

| Weg | Wie | Für das Risiko |
| --- | --- | --- |
| **Workspace** | `"@onestrand/kern": "workspace:*"` innerhalb von `business-suite` | Atomare Änderung: Bricht eine Plattform-Änderung eine Familie, ist der PR rot. Bester Weg innerhalb des Monorepos. |
| **Gestempelte Kopie** (Vendoring) | `scripts/stamp.mjs` kopiert ein Plattform-Paket in ein fremdes Repo nach `vendor/onestrand/<paket>/`, mit `STEMPEL.json` (Quelle, Commit, Pfad, SHA-256 je Datei); `check-stamps.mjs` bricht, wenn eine Datei von Hand geändert wurde | Kein Netz beim Build, kein Token, Build auf Cloudflare unverändert, jede Übernahme ist ein eigener PR mit Tests. Aufwand: Updates sind bewusste Schritte. **Für Randen empfohlen.** |
| Git-Abhängigkeit | pnpm installiert aus einem Unterordner eines Git-Repos auf einen Commit | Jeder Build braucht GitHub; wird `business-suite` privat, bricht der Build ohne Token. TypeScript-Quellen in `node_modules` fallen aus Lint und Typprüfung heraus. `minimumReleaseAge` greift nicht. Nein. |
| Paket-Register | npm-Paket öffentlich oder auf GitHub Packages | Öffentlich veröffentlichter proprietärer Code; GitHub Packages verlangt für npm auch beim Installieren eine Anmeldung, also ein Secret im Build. Nein. |

### 4.2 Eine Quelle der Wahrheit je Datei

- **Heute** ist Randen die Quelle für alles, was es schon gibt. Die Suite kopiert mit Stempel **aus** Randen (Commit von Randen im Stempel) und ändert nur, was für mehrere Marken nötig ist (`wine` → `accent`, «Randen» → Name aus der Konfiguration). Jede Abweichung steht in `docs/herkunft.md`.
- **Nach der Ernte** eines Pakets wird die Suite die Quelle. Randen übernimmt es nach seinem Pilot als gestempelte Kopie. Der Wechsel der Quelle geschieht je Paket einmal und steht mit Datum in `docs/herkunft.md`.
- **Nie** in zwei Richtungen zugleich. Weil der Stempel den Commit von Randen trägt, zeigt `git diff <stempel>..HEAD -- <pfad>` im Randen-Repo genau, was Randen seit der Kopie geändert hat; die Ernte wird damit mechanisch statt geraten.
- **Rettich** nimmt nie etwas aus der Suite und die Suite schreibt nie in Rettich. Die fünf Dateien aus Rettich kommen über Randen in `packages/kern`; ihre Herkunft aus Rettich bleibt im Kopfkommentar und in `docs/herkunft.md` vermerkt.

### 4.3 Versionen

- Innerhalb des Monorepos gibt es keine Versionen zwischen Paketen; es gilt der Commit.
- Für Kopien nach aussen (Randen) trägt die Plattform als Ganzes eine Version (`plattform-v0.1.0` als Git-Tag) und ein `CHANGELOG.md` mit «bricht» und «ergänzt». Eine Kopie nimmt immer einen getaggten Stand, nie einen beliebigen Commit.
- **Ergänzen statt brechen:** Felder, Tabellen, Funktionen, Ereignisse und Operationen werden nur angehängt (wie Randen `docs/intern/ausbau.md:99`, Regel 3). Ein Bruch braucht ein SADR, eine Migration und den Test gegen alle eingefrorenen Sicherungen jeder App.

### 4.4 Stempel, Beispiel

```json
{
  "quelle": "BanioX/Randen",
  "commit": "a8d8e63",
  "kopiert": "2026-11-25",
  "ziel": "packages/kern/src",
  "dateien": {
    "money.ts": { "von": "packages/core/src/money.ts", "sha256": "…", "geaendert": false },
    "dates.ts": { "von": "packages/core/src/dates.ts", "sha256": "…", "geaendert": false },
    "operation.ts": { "von": "packages/core/src/contract/operation.ts", "sha256": "…", "geaendert": true,
                      "warum": "SCOPES als Typ, Liste je App" }
  }
}
```

---

## 5. Wie eine Familie andockt

### 5.1 Ein Paket je Familie mit festem Rumpf

Eine Familie liefert zwei Pakete (`core` ohne Browser, `web` mit Seiten). Die App setzt sie mit den Plattform-Paketen zusammen. Der Rumpf folgt dem, was Randen pro Modul schon hat (AGENTS.md, «Ein Modul»).

```ts
// branchen/<familie>/core: rein, nur @onestrand/kern und zod
export interface FamilienKern {
  id: FamilieId;                       // 'facility', im Namensregister
  tables: TableSpec[];                 // Name, Zod-Schema, Indizes, «seit»; Namen im Register
  contract: ContractFragment;          // Operationen «<modul>.<tun>», Präfixe im Register
  useCases: (ctx: AppContext) => Partial<UseCases>;
  catalog: FeatureEntry[];             // Einträge für FEATURE_CATALOG (Felder nach ADR-0022, Punkt 3)
  kinds: BusinessKindSpec[];           // Betriebsarten mit Vorschlägen (wie ADR-0031)
  demo?: DemoBuilder;                  // erfundene Namen, keine echten Firmen
}
// branchen/<familie>/web
export interface FamilienWeb {
  routes: RouteObject[];               // lazy, unter eigenen Pfaden
  nav: NavItem[];                      // mit features, wie NavItem.modules heute
  capture: CaptureEntry[];             // Einträge für «＋ Erfassen»
  cockpit: CockpitTile[];              // Kacheln und Zeilen für «Heute»
  setup: SetupStep[];                  // Fragen beim Einrichten
  messages: Messages<'de-CH'>;         // alle Texte, typisiert je Sprache (Abschnitt 9)
}
```

```ts
// apps/facility/app.config.ts: die einzige Stelle mit Marke und Speichernamen
export default defineApp({
  slug: 'facility',
  storage: { db: 'facility', keyPrefix: 'facility:' },   // nie ändern, im Register
  backup: { format: 'facility-backup', container: 'zip' },
  brand: { name: '…', shortName: '…', accent: '#…', icon: '/icon.svg' },
  locales: ['de-CH'],
  packages: [plattform.kern, plattform.register, plattform.listen, facilityKern],
});
// Gastro später, nach seinem Pilot: storage { db: 'randen', keyPrefix: 'randen:' },
// backup { format: 'randen-backup' } — eingefroren, nie «gastro».
```

### 5.2 Was die Shell daraus macht

- **Register:** `FEATURE_CATALOG` einer App ist die Summe aus Plattform und Familien. Ein Test prüft: jede Kennung genau einmal, jede im Namensregister, `requires` abgeschlossen, Kern nie an `availability` gebunden (ADR-0022, Punkt 5 und 13).
- **Schnittstelle:** `CONTRACT` einer App ist die Summe ihrer Teile, mit demselben Test wie heute (keine Operation in zwei Teilen, jede umgesetzt; ADR-0005, Punkt 2).
- **Tabellen und Dexie:** Die App besitzt ihre Dexie-Versionen. Bringt ein Paket eine neue Tabelle, hängt die App eine neue Version an. Ein Test bricht, wenn eine Tabelle eines Pakets in keiner Version der App steht. So kollidieren Versionsnummern zwischen Plattform und Familie nie.
- **Routen:** Reserviert für die Plattform: `/`, `/setup`, `/settings`, `/document`, `/pass`, `/clock` (ADR-0022, Punkt 11). Familien nur unter eigenen Pfaden aus dem Register. Links nur über `paths` (AGENTS.md).
- **Texte:** Plattform-Texte nennen nie einen Produktnamen; sie bekommen ihn aus der Konfiguration. Test: Kein Plattform-Katalog enthält einen Produktnamen aus dem Register.
- **Marke:** Das UI-Kit kennt nur neutrale Farbnamen (`accent`, `accent-dark`, `surface`, `ink`); die App setzt die Werte. Gemeinsame Werte (Schrift `#14161A`, Radien, 44 px, Systemschrift) aus `docs/intern/suite.md`, Abschnitt «Was alle Apps teilen».
- **Vorschläge beim Einrichten:** je Familie Betriebsarten mit «an», «Antwort», «aus», wie Randen-ADR-0031; Umfang «Schlank», «Üblich», «Alles» aus ADR-0022, Punkt 9. Die kleinste Einrichtung (eine Person, ein Gerät) muss in jeder Familie ohne Team, Rollen und Kopplung gehen.
- **Kopfzeilen:** jede App mit eigener `_headers`, aus einer Vorlage des Kopfes erzeugt; `security.test.ts` und `side-effects.test.ts` laufen in jeder App.

### 5.3 Regeln für das Andocken

1. **Port statt Eigenbau.** Braucht eine Familie vor der Ernte etwas, das in Randen entsteht (Rollen, Zeit, Checklisten, PDF, Kopplung), definiert der Kopf einen Port nach dem ADR-Entwurf von Randen (zum Beispiel `TimeEntry` nach ADR-0023, Punkt 1), und die Familie programmiert dagegen. Eine eigene Umsetzung dieser Infrastruktur in einer Familie ist verboten.
2. **Zweimal gebraucht, dann Plattform.** Ein Teil zieht erst in `packages/`, wenn mindestens zwei Familien ihn brauchen und eine Umsetzung schon in einem Pilot läuft. Bis dahin bleibt er in seiner Familie. Das verhindert eine Plattform, die auf dem Papier entworfen wurde.
3. **Module rufen einander nicht auf** (ADR-0005, Punkt 3): auch nicht über Familien hinweg. Gemeinsames liegt in Plattform-Paketen oder geht über Ports.

---

## 6. Gemeinsames Datenmodell

### 6.1 Grundsätze

- **Plattform-Tabellen sind geschlossen.** Eine Familie hängt keine Felder an eine Plattform-Tabelle, sondern legt eigene Tabellen an, die auf Plattform-Kennungen zeigen. Keine «eigenen Felder» als freies JSON: Sie entgehen Zod, Sicherung und Tests.
- **Ausnahme Betrieb und Person:** Die App darf die Basis mit `.extend()` um Felder ihrer Familie erweitern, nur in `apps/<familie>` oder im Familien-Kern, nie in der Plattform. Die Basis ist **genau die Schnittmenge, die Randen heute speichert** (`id`, `name`, `currency`, `modules`, `setupAt`, `demo`, `createdAt`, `updatedAt` aus `business.ts:49-70`); `kind`, `targetFoodCostBps` und `defaultVatBps` gehören zur Erweiterung von Gastro.
- **Nie mit der Basis schreiben.** Weil `z.object` unbekannte Felder entfernt, darf Plattform-Code eine Zeile nie mit dem Basis-Schema lesen und dann zurückschreiben: Die Felder der Familie gingen still verloren. Plattform-Code liest Basis-Zeilen mit einem lockeren Schema (Zod 4 `z.looseObject`) oder ändert über eine Funktion, die nur seine Felder setzt (`patch`). Ein Test schreibt eine Gastro-Zeile durch jeden Plattform-Befehl und vergleicht die Felder davor und danach.
- **Ein Betrieb bleibt ein Betrieb** (ADR-0003, Punkt 4), auch in Facility: ein zweiter Standort ist ein zweiter Betrieb; Organisationen über Betrieben erst in Stufe 2 (ADR-0025, Punkt 5).
- **Ledger statt Zustand** für alles, was sich über die Zeit ändert (Zeit, Status eines Auftrags, Rapporte nach der Unterschrift, Rechnungen nach der Ausgabe), wie ADR-0007 und ADR-0023. Das macht Stufe 2 später konfliktarm (ADR-0025, Punkt 4).
- **Berechnet statt gespeichert** (ADR-0008): Saldi, offene Beträge, Soll und Ist eines Putzplans, Marge eines Auftrags.

### 6.2 Die Entitäten

| Entität | Kennung (Vorschlag) | Gehört | Kommt aus | Regel in Stufe 1 | Wie Familien erweitern |
| --- | --- | --- | --- | --- | --- |
| Betrieb | `Business` | Plattform (Basis) | Randen, besteht | ein Gerät hält den Betrieb | `.extend()` in der App: Betriebsart der Familie, Regelwerk (GAV), Kanton |
| Person | `StaffMember` | Plattform | Randen AP-2 | Löhne nur für Berechtigte (E-11, W16) | Qualifikationen je Familie als eigene Tabelle |
| Rechteprofil | `RoleProfile` | Plattform | Randen AP-2 (W16) | heikle Rechte als eigene Schalter | Vorlagen je Familie (Equipenleitung, Objektleitung) |
| Zeitbuchung | `TimeEntry` | Plattform | Randen AP-3 | nur anfügen, harte Regel (ADR-0023, Punkt 2) | – |
| Checkliste, Übergabe | `Checklist`, `Handover` | Plattform | Randen AP-7 | Pflichtteile nie an `availability` | Vorlagen je Familie (Kontrollgang, Endreinigung) |
| Kalender, Erinnerung | `calendar`, `reminders` | Plattform | Randen AP-8, AP-17 | ohne Server (ADR-0024) | – |
| Dokument | – | Plattform | Randen AP-15 | Ansicht vor dem Drucken (ADR-0026) | eigene Vorlagen je Familie |
| Kassenbuch, Beleg | `CashEntry`, `Voucher` | Plattform | Randen AP-16 | ein Gerät führt die Prüfkette (ADR-0025, Punkt 4) | Ausgabearten je Familie |
| **Kundschaft** | `Customer` | Plattform, neu | Suite | nur auf Geräten des Betriebs; Aufbewahrung nach Rechnungsbezug, sonst löschbar; eigenes SADR | Notizen je Familie als eigene Tabelle |
| **Objekt** | `Site` | Plattform, neu | Suite | Adresse, Zugang nur als Hinweis (Abschnitt 7.4) | Facility: Flächen und Räume; Handwerk: Baustelle; Umzug: von und nach |
| **Auftrag** | `Job` | Plattform, neu (Welle 3) | Suite, nach Prototypen in Facility und Handwerk | Status als Ledger | Facility: Vertrag mit Intervallen; Handwerk: Offerte, Ausmass, Regie oder Pauschal |
| **Offerte** | `Quote` | Plattform, neu (Welle 3) | Suite | Fassungen, nie überschrieben | Positionen je Familie |
| **Einsatz** | `Visit` | Plattform, neu (Welle 3) | Suite, verwandt mit dem Dienstplan (AP-4) | Status als Ledger, nur angefügt | wiederkehrend (Facility), einmalig (Umzug) |
| **Rapport** | `WorkReport` | Plattform, neu (Welle 3) | Suite | nach der Unterschrift nur Nachtrag; Fotos als Dateien mit Prüfsumme wie AP-16 | Material, Mängel, Schäden je Familie |
| **Rechnung** | `Invoice` | Plattform, neu (Welle 3) | Suite | ein Gerät vergibt die Nummern; nach der Ausgabe unveränderlich, Korrektur nur als Gutschrift; QR-Rechnung | Positionen je Familie |
| Material und Lager | – | erst Familie | Randen-Ledger nach «Zweimal gebraucht» | Bestand nur über ein Ledger, wie ADR-0007 | Lebensmittel-Felder (Allergene, Verbrauchsdatum) bleiben bei Gastro |

**Wörter, die heute schon belegt sind** (Randen-Glossar und Masterplan 2.1): «Bestellung» ist dort die Bestellung beim Lieferanten, «Lieferung» der Wareneingang, «Beleg» eine Ausgabe, «Auftrag» ein Anlass in der Auslieferung (`dispatch`). Das Glossar der Suite trennt das vor der ersten Zeile Code: «Auftrag» (`Job`) für Kundschaft und Objekt, «Beleg» bleibt die Ausgabe, «Rechnung» ist, was der Betrieb ausstellt.

### 6.3 Kennungen und Namen

`registry/names.json` hält jede Kennung, die auf ein Gerät oder in eine Sicherung gelangt: Funktionen, Module, Tabellen, Präfixe der Operationen und Ereignisse, Schlüssel im Gerät, Datenbanknamen, Formate der Sicherung, Cloudflare-Projekte, Hostnamen. Die Namen von Randen stehen dort ab Welle 0 als «eingefroren, Besitzer Randen», gelesen aus dem Code, ohne Randen zu ändern. Ein Test der Suite liest jede App und jedes Paket und bricht bei einer Kennung, die nicht im Register steht oder zweimal vorkommt.

```json
{ "kennung": "kitchen_display", "art": "feature", "besitzer": "gastro", "status": "eingefroren" }
{ "kennung": "randen", "art": "indexeddb", "besitzer": "gastro", "status": "eingefroren" }
{ "kennung": "facility.onestrand.ch", "art": "hostname", "besitzer": "facility", "status": "reserviert" }
```

---

## 7. Geräte und Abgleich Büro ↔ Aussendienst

### 7.1 Die Lage

Die Küche arbeitet an einem Ort; Facility, Handwerk und Umzug arbeiten draussen bei der Kundschaft. In Stufe 1 gibt es keinen Server (ADR-0006, ADR-0025 Weg (a)); erlaubt sind Dateien, die die Person trägt, die Kopplung im WLAN des Betriebs (W13, ADR-0028, heute nur für Gästebestellungen) und für den Handschlag der Vermittler auf Cloudflare (W15). Daten nach Rolle gefiltert auf private Handys erlaubt W14, mit Ablauf nach 30 Tagen und ohne Löhne und Kasse. Die Kopplung hält nur, solange beide Apps offen sind; iOS hält WebRTC beim Sperren an (ADR-0028, Kontext).

### 7.2 Vorschlag für Stufe 1: Morgen und Abend im Betrieb

| Wann | Was geht über die Kopplung im WLAN des Betriebs | Richtung |
| --- | --- | --- |
| Morgen im Werkhof oder Büro | Einsätze des Tages oder der Woche für diese Person, das Nötige zum Objekt (Adresse, Zugangshinweis ohne Code, Leistungen, Checkliste) | Büro → Handy |
| Abend | Rapporte, Zeitbuchungen, Fotos, erledigte Checklisten, Notizen | Handy → Büro |
| Unterwegs | nichts; alles offline auf dem Handy | – |

- **Ein Schreiber je Stammdatum:** Kundschaft, Objekte, Aufträge, Preise und Rechnungen ändert in Stufe 1 nur das Gerät des Betriebs. Handys fügen nur an (Rapporte, Zeit, Status eines Einsatzes, Fotos, Notizen). Angefügtes vereinigt sich ohne Konflikt nach Kennung; die `commandId` macht ein Wiederholen harmlos (ADR-0025, Punkt 4). Damit gibt es in Stufe 1 keine Regel für Konflikte zu erfinden.
- **Ohne gemeinsames WLAN:** eine Datei, die die Person trägt (ADR-0006, Punkt 4), **verschlüsselt mit dem Schlüssel der Kopplung** (AES-GCM wie die Sicherung, ADR-0017, Punkt 3). Geht sie über einen Messenger, sieht dieser nur einen Umschlag. Ohne Kopplung keine Datei.
- **Ein einzelner Einsatz** passt als QR-Code von Bildschirm zu Bildschirm (Text, keine Fotos).
- **Das braucht einen Entscheid von Alban** (Datenfluss): ADR-0028 erlaubt heute nur Gästebestellungen (Punkt 1). Ein SADR legt je Datentyp eine Liste fest, was über die Kopplung darf, gefiltert beim Senden nach Rolle (W14, Punkt 1; W16, Punkt 6).

### 7.3 Stufe 2

Erst mit Albans JA (E-24): Relais mit Ende-zu-Ende-Verschlüsselung (ADR-0025, Weg (b)), Einsätze live auf dem Handy, Mitteilungen, Fernlöschung. Aussendienst-Familien werden früher danach fragen als die Küche. **Gefahr:** Ein Agent einer Familie baut «nur schnell» einen Abgleich. Darum laufen `side-effects.test.ts` und die CSP-Prüfung in jeder App, und `fetch(`, `WebSocket` und `RTCPeerConnection` brauchen weiter eine Zeile mit «Alban, TT.MM.JJJJ».

### 7.4 Zugang zu Objekten

Hauswartung und Reinigung kennen Schlüssel, Tür- und Alarmcodes der Kundschaft. Ein verlorenes Handy mit Alarmcodes ist ein Schaden bei Dritten. Vorschlag: In Stufe 1 speichert keine App Codes, nur Hinweise («Schlüssel Nr. 14 im Kasten», «Code beim Büro»), und Handys bekommen nur den Hinweis. Entscheid für Alban (Abschnitt 16, E-S7).

### 7.5 Der Vermittler (W15)

Er wird einmal gebaut (heute in Randen geplant) und je App als eigenes Cloudflare-Projekt ausgeliefert, damit die CSP einer App nur ihren Vermittler nennt und ein Fehler bei einer Familie keine andere trifft. Das Gratis-Kontingent für Worker-Aufrufe gilt je Konto, also für alle zusammen. Sobald er läuft, sieht er Internet-Adressen der Geräte; das gehört in die Datenschutzerklärung auf `onestrand.ch` (die es noch nicht gibt).

---

## 8. Sicherung über Versionen und Apps

1. **Format je App, für immer:** `randen-backup` bleibt für Gastro (`settings/contract.ts:15-16`), neue Apps bekommen `<familie>-backup`. Eine App liest nie die Sicherung einer anderen; `checkBackup` verwirft schon heute ein fremdes Format (`backup.ts:87-89`). Austausch zwischen Apps nur über eigene, beschriebene Dateien (Kundschaft als CSV).
2. **Eingefrorene Sicherungen je App:** `apps/<familie>/test/sicherungen/<datum>.json`, je Release eine neue; das CI liest jede bei jedem Lauf zurück. Randen baut das mit AP-0 (Masterplan AP-0, Umfang 5); die Suite übernimmt das Muster.
3. **Ältere App, neuere Sicherung:** Weil `checkBackup` mit `z.object` liest und die geprüften Werte schreibt (`backup.ts:99`, `:124`, `:130`), verliert eine ältere App still neue optionale Felder einer neueren Sicherung (Beispiel: `Business.featureOptions` aus AP-1). Vorschlag für jede App: Die Sicherung trägt den Stand des Schemas (die höchste Dexie-Version), und eine App verweigert eine Datei mit höherem Stand mit dem Satz, dass zuerst die App neu geladen werden muss. Für Randen gehört das zu U-05 (`docs/fehler.md`) und ist eine Bitte an die Randen-Sitzung, kein Eingriff.
4. **Plattform-Tabellen in der Sicherung:** gehören zur App wie alle anderen; ihre Namen stehen im Register und sind in einer App einmalig. Fehlt eine Tabelle in einer alten Datei, gilt sie als leer (Randen AP-0).
5. **Fotos und Dateien:** Rapporte, Belege und Bewilligungen bringen viele Fotos. Eine JSON-Datei mit Bildern als Data-URL (TD-03) wird auf einem iPhone zu gross. Neue Apps beginnen darum gleich mit einem ZIP-Behälter (`daten.json` und `dateien/<sha256>`), ohne neue Abhängigkeit, wie das Monatspaket von AP-16. Randen bleibt bei Format v1, bis Alban E-10 entscheidet.
6. **Daten nur des Geräts** (PIN, Kopplung, Gerätemodus, Ansicht) stehen in keiner Sicherung (ADR-0025, Punkt 1; ADR-0028, Punkt 2).

---

## 9. Sprachen

- **Heute:** nur de-CH mit «du» und «ss», geprüft von `apps/web/src/app/messages.test.ts:39-41`. Texte als deutsche Objekte in `messages.ts`. Nachrüsten mehrerer Sprachen in 62'000 Zeilen Seiten ist ein grosser Umbau; Randen-E-25 sieht Sprachen erst nach dem Pilot vor.
- **Neue Familien von Anfang an sprachfähig, aber deutsch:** Kataloge mit Sprache als Schlüssel und Typ (`Messages<'de-CH'>`), damit eine zweite Sprache eine Datei mit demselben Typ ist und TypeScript fehlende Texte meldet. Übersetzt wird erst nach dem ersten Pilot einer Familie. Randen bleibt, wie es ist, bis E-25 fällt.
- **Zwei Achsen:** die Sprache der Oberfläche je Person oder Gerät (Mitarbeitende mit anderer Muttersprache, in Reinigung und Umzug häufig) und die Sprache der Dokumente je Kundschaft oder Betrieb (Rechnung und Rapport in der Romandie auf Französisch). Beides getrennt speichern.
- **Einfache Sprache vor Übersetzung:** Für Aushilfen hilft eine Checkliste mit Symbol und Foto des Raums («so soll es aussehen») oft mehr als eine Übersetzung. Das ist eine Eigenschaft des Checklisten-Pakets.
- **Keine Übersetzung zur Laufzeit:** Kein Sprachmodell und kein fremder Dienst (Randen-Masterplan 0.1, ADR-0011). Übersetzungen entstehen beim Bauen, gelten als «Entwurf», bis eine Person mit dieser Muttersprache sie geprüft hat.
- **Recht je Sprache:** Allergene, Pflichtangaben und Sicherheitshinweise nur aus der amtlichen Fassung in dieser Sprache, mit Quelle.
- **Anrede je Sprache** ist ein eigener Entscheid (wie ADR-0010 für «du»); ein Sprachtest je Sprache.

---

## 10. Recht, Fakten und Haftung je Familie

- **Gemeinsame Fakten einmal:** MWST, Aufbewahrung (OR Art. 958f), Arbeitszeit (ArG, ArGV 1), Datenschutz (DSG), QR-Rechnung in `docs/fakten/` der Suite, mit Marke nach L-17 (`docs/fakten.md:7-16` in Randen). Bis zur Ernte ist Randen die Quelle für MWST (Abschnitt 3) und Aufbewahrung (4.4); die Suite kopiert mit Stempel.
- **Fakten je Familie:** `branchen/<familie>/docs/fakten.md`. Zu prüfen, ausdrücklich ohne Zahlen und als Vermutung: Gesamtarbeitsverträge je Branche und ob sie allgemeinverbindlich sind, Saldosteuersätze je Branche, Sicherheit auf dem Bau (Absturz, Asbest bei Renovationen, Leitern; Bauarbeitenverordnung, Regeln der Suva und der EKAS), Chemikalien in der Reinigung (Sicherheitsdatenblatt), Personalverleih, wenn ein Betrieb Personal ausleiht (AVG), Werkvertrag und Mängelrüge (OR), Meldepflicht von Gästen in der Beherbergung, kantonale Unterschiede (Feiertage, Romandie mit eigenen GAV). Ohne Quelle keine Zahl; in der App «Richtwert», vom Betrieb änderbar (ADR-0012).
- **Eigene Rolle für Fakten:** Recherche schreibt nur in die Fakten-Dateien, Code nur mit Verweis darauf. So bringt kein Agent eine Zahl aus dem Gedächtnis in die App.
- **Normen mit Urheberrecht** (etwa SIA-Normen) werden genannt, nie abgeschrieben.
- **Haftung klein halten:** Randen ist «ein Vorsystem, keine Buchhaltung» (Masterplan W8) und der Lohn ein «Export für die Treuhand» (E-15). Dasselbe gilt für jede Familie: keine Lohnabrechnung, keine Steuererklärung, keine Vorlagen für Verträge oder AGB der Betriebe, keine Wörter wie «rechtssicher», «konform», «geprüft». Sicherheits-Checklisten heissen «Hilfe» und ersetzen keine Instruktion. Rechnungen sind das heikelste Stück (MWST-Angaben, Nummern, QR-Teil); sie kommen erst in Welle 3 mit Fakten und Tests.
- **Datenschutz:** Solange nichts das Gerät verlässt, bearbeitet Onestrand keine Daten der Betriebe (ADR-0025, Abschnitt «Datenschutz»). Das ist ein grosser Vorteil bei der Haftung und bleibt so lange wie möglich. Neu sind Kundschaft mit Adressen und Fotos aus Wohnungen: verantwortlich bleibt der Betrieb; die App hilft mit Löschfristen und einem Datenblatt.
- **Vor dem ersten zahlenden Betrieb** braucht Onestrand Impressum, Datenschutzerklärung und Bedingungen; eine Fachperson prüft sie. Das kostet Geld und ist Albans Entscheid.

---

## 11. Öffentliches Repo, Lizenzen und Kosten

- **Öffentlich heisst:** Was in `business-suite` steht, liest jede Person. Hier steht, was gebaut ist und wie. Welche Familie wann, Marktgrössen, Preise, Vergleiche: nur in der privaten Ablage. Ein Wächter-Test nach Rettich-Muster (Namen als Prüfsummen) ab Welle 0; Demo-Daten mit erfundenen Namen («Liegenschaft Musterweg 12, 8000 Beispielstadt», «Allzweckreiniger», «Dispersion weiss»), nie Markennamen von Reinigungsmitteln, Farben oder Verwaltungen.
- **`LICENSE`** proprietär, alle Rechte bei Alban, wie Randen, vor der ersten Zeile Code; `"license": "UNLICENSED"` in jedem `package.json`.
- **Abhängigkeiten** nur kostenlos, gut gepflegt, schlank und im ausgelieferten Code permissiv (`check-licenses.mjs` aus Randen, mit Stempel). Neue Kandidaten der Suite (QR-Code erzeugen, ZIP) zuerst ohne Bibliothek prüfen.
- **Lizenzhinweise der Abhängigkeiten** fehlen in Randen im ausgelieferten Code (`docs/intern/ausbau.md:913`). Die Shell erzeugt die Seite «Lizenzen von Drittanbietern» beim Build für jede App; einmal gelöst, für alle.
- **Kosten:** GitHub Actions ist für öffentliche Repos frei; wird `business-suite` privat, zählen die Minuten (W12 bei Randen). Cloudflare im Gratis-Plan: statische Aufrufe frei, Worker-Aufrufe (Vermittler) mit Kontingent je Konto. Domain `onestrand.ch` besteht. Eine Marke eintragen, Rechtsprüfung, Stores, Hosting in der Schweiz kosten Geld und bleiben Albans Entscheid.

---

## 12. Governance für parallele Agenten

### 12.1 Rollen

| Rolle | Wer | Darf schreiben | Darf nicht |
| --- | --- | --- | --- |
| Kopf | eine Sitzung für `business-suite` | `docs/`, `registry/`, `packages/`, `scripts/`, Wurzel-Konfiguration, Vorlagen der Apps; führt als Einziger in `main` zusammen | in `BanioX/Randen` oder `BanioX/Rettich` schreiben |
| Familie | eine Sitzung je Familie | `branchen/<familie>/**`, `apps/<familie>/**`, `docs/branchen/<familie>.md` | Plattform, Register, andere Familien, CI |
| Fakten | eine Sitzung je Familie bei Bedarf | `branchen/<familie>/docs/fakten.md`, `docs/fakten/**` nach Auftrag | Code |
| Randen | die bestehende Sitzung | nur `BanioX/Randen` | `business-suite` |

Das entspricht dem Muster des SWELPER in Rettich (Dispatcher plant, reviewt jedes Ergebnis und merged als Einziger; Umsetzende arbeiten nur in den Pfaden ihres Auftrags; Rettich-CLAUDE.md, «Agent-Orchestrierung»). Nutzt Alban den SWELPER, wird `business-suite` ein eigener Kontext mit eigener `.swelper.json`; erzeugte Dateien dort nie von Hand.

### 12.2 Was die Grenzen durchsetzt

- **Pfad-Wächter:** `scripts/check-paths.mjs` vergleicht `git diff --name-only origin/main...HEAD` mit `registry/owners.json` nach dem Präfix des Branches; läuft in `pnpm check` und im CI. Alle Agenten nutzen dasselbe GitHub-Konto, darum hilft `CODEOWNERS` nicht; der Wächter schon.

```json
{
  "kopf/":               ["**"],
  "familie/facility/":   ["branchen/facility/**", "apps/facility/**", "docs/branchen/facility.md"],
  "fakten/facility/":    ["branchen/facility/docs/fakten.md"]
}
```

- **Namensregister** (Abschnitt 6.3): Eine neue Kennung braucht vorher eine Zeile im Register, und die schreibt nur der Kopf. So wählen zwei Agenten nie denselben Namen.
- **Schnittstelle der Plattform eingefroren:** Ein Test hält die Exporte jedes Plattform-Pakets fest. Eine Familie kann sie nicht ändern (Pfad-Wächter); der Kopf nur mit SADR.
- **Plattform-Wunsch:** Braucht eine Familie mehr, schreibt sie ein Issue mit Label `plattform-wunsch` (Ziel, welche Familien es brauchen, Vorschlag der Schnittstelle) und baut bis dahin hinter einem Port weiter.
- **Atomar:** Eine Plattform-Änderung ist erst grün, wenn jede App grün ist (Workspace). Der Kopf ändert die Plattform und passt die Familien im selben PR an; die Familien-Agenten ziehen danach `main` nach.

### 12.3 Branches, Prüfung, Zusammenführen

- Je Auftrag ein Branch `familie/<familie>/<thema>`, ein Thema je PR, unter 400 geänderten Zeilen (Rettich-CLAUDE.md, Arbeitsweise 2), PR mit Was, Warum, Wie getestet; Previews bei sichtbaren Änderungen.
- `pnpm check` mit `ALL=GREEN` vor jedem Push: Format, Lint, Typen, Tests, Build, E2E der betroffenen Apps, Pfad-Wächter, Namensregister, Stempel, Lizenzen, Wächter für private Inhalte.
- Nur der Kopf führt zusammen, nach Rebase auf `main`. Kein Force-Push auf `main`. `main` ist Production aller Apps; eine App ohne Pilot ist eine Demo.
- **Anders als in Randen** («jeder grüne Push auf Arbeits-Branch und `main`», Randen-CLAUDE.md, Arbeitsweise 10): Mit mehreren Agenten geht nichts direkt auf `main`, sonst überschreiben sie sich. Der eine Schreiber auf `main` ist der Kopf.
- CI-Zeit wächst mit jeder Familie: Jobs nach geänderten Pfaden, jede Nacht alles.

---

## 13. Der Weg für Randen

### 13.1 Jetzt bis zum Pilot-Kit (AP-12): nichts ändern

- Randen baut AP-0 bis AP-19 wie geplant. Die Suite liest Randen nur und kopiert mit Stempel, was fertig ist.
- **Zwei Bitten an die Randen-Sitzung** (über Alban, keine Pflicht, kaum Aufwand): (1) In den Modulen, die Plattform werden (Register, Team und Zeit, Kasse und Belege, Dokumente, Kopplung), keine harten Abhängigkeiten auf Küchen-Module wie Rezepte, Lager oder Speisekarte, sondern Ports oder `uses`; das verlangt ADR-0005 ohnehin. (2) Die Prüfung «Sicherung aus einer neueren Version» (Abschnitt 8, Punkt 3) zu U-05 dazunehmen.

### 13.2 Vor dem ersten Pilotbetrieb: die Adresse

Das ist der einzige zeitkritische Schritt. Heute ist `randen.<konto>.workers.dev` eine Demo (`docs/previews.md`, «Kosten und Grenzen»). Cloudflare selbst empfiehlt `workers.dev` nicht für geschäftskritische Anwendungen (developers.cloudflare.com/workers/configuration/routing, gelesen 24.11.2026).

1. `onestrand.ch` als Zone zu Cloudflare (Gratis-Plan): Eine eigene Domain an einem Worker setzt eine aktive Zone bei Cloudflare voraus (Doku «Custom Domains», gelesen 24.11.2026). Dafür bei Hostpoint die Nameserver umstellen und vorher alle Einträge übernehmen: Website auf GitHub Pages, MX, SPF und `autoconfig`/`autodiscover` für E-Mail; DNSSEC vorher aus (onestrand-README, Abschnitt «Alternative: Cloudflare Workers»). Kostet nichts, berührt aber E-Mail und Website: Albans Entscheid, am besten von ihm oder mit ihm am Bildschirm.
2. Am bestehenden Projekt `randen` die eigene Domain `gastro.onestrand.ch` hinzufügen. Das Projekt wird **nicht** umbenannt; `randen.<konto>.workers.dev` antwortet weiter.
3. Der Pilot startet nur auf `gastro.onestrand.ch`. Testgeräte mit Daten an der alten Adresse ziehen nach der Umzugsregel um (`docs/intern/suite.md`, Abschnitt 5: sichern, neue Adresse installieren, zurückholen, prüfen, erst dann alte App löschen).
4. Die Randen-Sitzung führt ADR-0020 (Punkt 3 und 5) und E-19 nach.

Will Alban die DNS jetzt nicht anfassen, bleibt `randen.<konto>.workers.dev` bewusst die Adresse der Pilotküchen. Ein späterer Wechsel geht dann nur mit Sicherung je Küche.

### 13.3 Nach dem Pilot: Plattform übernehmen, Paket für Paket

- Bedingung: Der Pilot läuft einige Wochen ohne Datenfehler, und das Paket ist in der Suite geerntet.
- Je Paket ein PR in Randen: gestempelte Kopie nach `vendor/onestrand/<paket>/`, Importe umstellen, alle eingefrorenen Sicherungen zurückholen, E2E. Zuerst `kern` (die Dateien sind ohnehin dieselben), zuletzt Register und Rechte.
- Für die Daten ändert sich nichts: Die geernteten Pakete kamen aus Randen und tragen dieselben Kennungen; `storage.db` bleibt `randen`, `backup.format` bleibt `randen-backup`.

### 13.4 Später, eigener Entscheid: Randen zieht ins Monorepo

- `apps/gastro` und `branchen/gastro` in `business-suite`, Geschichte mitgenommen. Das Cloudflare-Projekt `randen` wird auf das neue Repo und den Ordner `apps/gastro` umgestellt; die App hängt am Projektnamen, nicht am Repo (`docs/intern/ausbau.md:997`). Ob ein bestehendes Projekt das Repo wechseln kann, vorher in der Doku von Workers Builds prüfen.
- Danach wird `BanioX/Randen` archiviert. Nicht nötig für Wellen 1 bis 4.

### 13.5 Was beim Umbenennen der Marke gilt

Alban will «Randen» vielleicht umbenennen. Dann ändern sich Manifest-Name, Symbol und Texte (54 Stellen), nicht Hostname, Projekt, Datenbank, Schlüssel oder Format. Bestehende Installationen zeigen bis zum neuen Hinzufügen den alten Namen und das alte Symbol (L-11); die Daten bleiben. Am wenigsten stört es vor dem Pilot.

---

## 14. Wellen

1. **Welle 0, Kopf, jetzt, ohne Code aus Randen:** `LICENSE`, `CLAUDE.md`, `AGENTS.md`, Ordner und Werkzeuge (Prüfskripte aus Randen mit Stempel), Wächter für private Inhalte, Pfad-Wächter, Namensregister mit allen eingefrorenen Namen von Randen, SADR-0001 bis 0006 (Produktmodell, Adressen und Herkunft, Repo und Code-Teilen, Namensregister, Governance, Grundsätze des Datenmodells), Steckbriefe der Familien, Gerüst der Fakten. Entscheide 1 bis 4 aus Abschnitt 16 an Alban.
2. **Welle 1, parallel zu Randen AP-0, AP-1, AP-13:** «Plattform 0» als gestempelte Kopie der fertigen Teile von Randen: `ids`, `money`, `currency`, `dates`, `format`, `primitives`, `contract/operation`, `contract/events`, `application/command`, Ports und Test-Speicher, UI-Kit mit neutralen Farbnamen, PDF-Kit, `share-file`. Facility-Agent baut die Domäne (Objekte, Flächen, Leistungen, Intervalle, Putzplan als reine Funktionen mit Eigenschaftstests) und erste Seiten für eine Person auf einem Gerät; Rollen, Zeit und Checklisten nur als Ports. Fakten-Agent für Facility und Handwerk recherchiert. Keine Adresse, nur Vorschau.
3. **Welle 2, nach Randen AP-1 und AP-2 auf `main` und stabil:** Ernte von Register und Rechten nach `packages/register` und `packages/rechte`, Shell aus dem Rahmen von Randen. Facility mit Einrichten, Katalog und Rollen; Hauswartung kommt zur Familie Facility.
4. **Welle 3, nach Randen AP-3, AP-7, AP-15, AP-16:** Ernte von Team und Zeit, Listen, Dokumenten, Kasse und Belegen. Neu in der Suite, ohne Vorlage in Randen: Kundschaft, Objekt, Auftrag, Offerte, Einsatz, Rapport, Rechnung mit QR-Rechnung, je mit SADR und Fakten. Familie Handwerk beginnt. Pilot Facility nach Albans Freigabe der Adresse.
5. **Welle 4, nach dem stabilen Pilot von Randen und nach AP-19 und W15:** Ernte der Kopplung, SADR «Aussendienst über die Kopplung» nach Albans Entscheid; Randen übernimmt die Plattform Paket für Paket (Abschnitt 13.3). Familien Umzug und Beherbergung (mit Modulen aus Gastro und Facility).
6. **Welle 5:** Sprachen nach E-25 (Mitarbeitende zuerst, dann Romandie und Tessin), Familie Salon, Entscheid zu Stufe 2 (E-24) mit den Zeichen aus dem Aussendienst.

Jede Welle beginnt erst, wenn die vorherige auf `main` grün ist und ihre Entscheide gefallen sind; was auf einen Entscheid wartet, baut den Teil, der nicht davon abhängt (wie Randen-Masterplan 8, «So geht eine Session mit offenen Entscheiden um»).

---

## 15. Risiken

| Nr. | Risiko | Folge | Was dagegen hilft |
| --- | --- | --- | --- |
| R1 | Die Suite baut Teile, die Randen gerade baut, oder greift in Randen ein | doppelte Arbeit, Konflikte, Verzögerung des Pilots | Ernte nach dem Paket; Port statt Eigenbau; die Suite schreibt nie in `BanioX/Randen`; Abschnitt 1.2 als Liste der gesperrten Themen |
| R2 | Herkunft verschiebt sich (Projekt, Konto, Hostname, `start_url`) oder Randen startet den Pilot auf einer Adresse, die später wechselt | Daten bleiben auf jedem Gerät an der alten Adresse | Hostname mit Branchenwort, Entscheid vor dem Pilot, Namensregister, Umzugsregel |
| R3 | Plattform-Code liest Zeilen einer Familie mit dem Basis-Schema und schreibt zurück | Felder gehen still verloren (`z.object` entfernt unbekannte Schlüssel) | lockeres Lesen, Schreiben nur mit dem Schema der App, Test mit Zeilen jeder Familie |
| R4 | Eine Sicherung kommt nach einem Update nicht zurück, oder eine ältere App verliert Felder einer neueren Sicherung (`backup.ts:99`, `:130`) | Datenverlust beim Gerätewechsel | eingefrorene Sicherungen je App im CI, Stand des Schemas in der Datei, Format je App, nur anhängen |
| R5 | Kopien laufen auseinander wie die Rettich-Kopie (`docs/rettich.md:53-54`) | Geld, Datum oder Recht rechnen je App anders | Stempel mit Prüfsumme, eine Quelle je Datei, Ernte mit `git diff` ab Stempel |
| R6 | Parallele Agenten ändern die Plattform oder wählen dieselben Kennungen | rote Apps anderer Familien, kaputte Sicherungen | Pfad-Wächter, Namensregister, nur der Kopf merged, Workspace macht Brüche sofort sichtbar |
| R7 | Strategie, Preise, Namen anderer Produkte oder echte Namen im öffentlichen Repo | dauerhaft lesbar, auch nach Löschen in der Geschichte (`docs/intern/ausbau.md:997`) | Wächter-Test mit Prüfsummen, private Ablage, Review des Kopfes |
| R8 | Recht und Sicherheit je Branche ohne Quelle (MWST auf Rechnungen, Lohn, Absturz, Asbest, Chemikalien, Gästemeldung) | Schaden bei Betrieben und Dritten, Haftung | Fakten-Rolle, L-17, «Richtwert», «Vorsystem», Rechnungen erst in Welle 3, Fachprüfung vor dem Verkauf |
| R9 | Druck aus dem Aussendienst führt zu einem Abgleich über das Netz ohne Entscheid | ADR-0006 gebrochen, Daten bei Dritten | Morgen-und-Abend-Kopplung als SADR, verschlüsselte Dateien, Wächter-Tests in jeder App |
| R10 | DNS-Umzug von `onestrand.ch` bricht E-Mail oder Website; Gratis-Pläne ändern sich; Lizenzhinweise fehlen | Ausfall, unerwartete Kosten, Lizenzverstoss | Umzug mit Liste und Alban, Kontingente beobachten, Seite «Lizenzen von Drittanbietern» in der Shell |

---

## 16. Entscheide für Alban

| Nr. | Frage | Optionen | Empfehlung |
| --- | --- | --- | --- |
| E-S1 | Produktmodell | (a) eine Plattform, eine App je Branchenfamilie mit eigener Adresse und Marke; (b) eine App für alle Branchen; (c) getrennte Produkte ohne gemeinsamen Code | (a): trennt die Daten und die Fehler, Randen behält seine Herkunft, Recht und Sicherung gibt es einmal |
| E-S2 | Adresse von Randen vor dem Pilot | (a) `gastro.onestrand.ch`, dafür `onestrand.ch` als Zone zu Cloudflare (gratis, betrifft E-Mail und Website); (b) `randen.onestrand.ch`; (c) `randen.<konto>.workers.dev` bleibt bewusst | (a): Branchenwort statt Marke, weil du den Namen ändern willst; Umzug der DNS mit dir am Bildschirm. Muss vor dem ersten Pilotbetrieb fallen |
| E-S3 | Repo und Code-Teilen | (a) Hybrid: `business-suite` als Monorepo für Plattform und neue Familien, Randen bleibt im eigenen Repo und nimmt später gestempelte Kopien; (b) Randen zieht jetzt ins Monorepo; (c) ein Repo je Familie mit Paket-Register | (a): stört Randen nicht, Plattform und Familien ändern atomar, kein Token im Build |
| E-S4 | Zeitpunkt der Ernte | (a) ein Plattform-Teil wird erst nach seinem Paket in Randen geerntet, Randen übernimmt erst nach seinem Pilot; (b) jetzt aus Randen herausschneiden | (a): kein Eingriff in laufende Arbeit; Familien bauen bis dahin ihre Domäne hinter Ports |
| E-S5 | Marken | (a) eine Marke je Familie, nach dem Muster aus ADR-0020 oder frei, erst kurz vor dem ersten Pilot der Familie; (b) beschreibend unter der Dachmarke («Onestrand» plus Branche); (c) später | (b) bis zum Pilot einer Familie, dann (a) oder (b) neu entscheiden; Onestrand als Marke eintragen lassen (kostet). Technische Namen nie nach Marke |
| E-S6 | Aussendienst in Stufe 1 **[Datenfluss]** | (a) Kopplung im WLAN des Betriebs auch für Einsätze, Rapporte, Zeit und Fotos, gefiltert nach Rolle, am Morgen und am Abend, dazu verschlüsselte Dateien; (b) alles nur auf dem Gerät des Betriebs; (c) warten auf Stufe 2 | (a) mit eigenem SADR; erweitert W14 und ADR-0028 nur um eine feste Liste von Datentypen |
| E-S7 | Kundschaft und Zugang zu Objekten **[Datenfluss]** | (a) Kundschaft nur auf Geräten des Betriebs, Handys nur das Nötige je Einsatz mit Ablauf, keine Tür- und Alarmcodes in der App; (b) Codes verschlüsselt speichern; (c) Codes wie andere Daten | (a): ein verlorenes Handy darf keinem Haus der Kundschaft schaden |
| E-S8 | Sprachen | (a) de-CH bis zum ersten Pilot einer Familie, neue Familien von Anfang an sprachfähig, danach zuerst Sprachen der Mitarbeitenden, später Romandie und Tessin; Übersetzung beim Bauen, geprüft von einer Person mit dieser Muttersprache; (b) gleich mehrere Sprachen; (c) nur Deutsch | (a), wie Randen E-25 |

Bestehende Entscheide gelten für die ganze Suite weiter: Server, Konten, Sync und Push nur mit JA (Randen-Masterplan 0.1, E-24); Dienste mit Kosten nur mit JA; keine Sprachmodelle und fremden KI-Dienste; die Ausnahmen W13, W14 und W15 nur in ihren Grenzen.

---

## 17. Was der Kopf als Nächstes tut (Welle 0, ohne Entscheid möglich)

1. `LICENSE` (proprietär), `CLAUDE.md` mit den harten Regeln aus Randen und den Regeln der Suite (Herkunft, Namensregister, Pfade, Ernte, Stempel, Port statt Eigenbau, Zweimal gebraucht), `AGENTS.md` mit Karte und Lesereihenfolge.
2. Werkzeuge: pnpm 10 und Node 24 wie Randen; `check.mjs`, `check-licenses.mjs` mit Stempel aus Randen; neu `check-paths.mjs`, `check-names.mjs`, `stamp.mjs`, `check-stamps.mjs`; Wächter für private Inhalte nach Rettich-Muster.
3. `registry/names.json` mit allen Kennungen von Randen, gelesen aus `business.ts`, `storage.ts`, `db.ts`, den `contract.ts` aller Module, den Ereignistypen und den Schlüsseln im Gerät; reserviert die Hostnamen der Familien.
4. SADR-0001 bis 0006 als Entwurf zur Bestätigung durch Alban; `docs/herkunft.md` leer mit Kopf der Tabelle.
5. Steckbriefe der Familien in `docs/branchen/` (was gebaut wird und wie), ohne Marktdaten.
6. Eine Notiz für Alban mit E-S1 bis E-S4 und dem Hinweis, dass E-S2 vor dem Pilot von Randen fallen muss.

---

## Anhang: Belege

| Aussage | Beleg |
| --- | --- |
| Datenbank heisst `randen` | `apps/web/src/data/db.ts:71`, geöffnet in `apps/web/src/app/AppData.tsx:78` |
| Neue Tabellen nur als neue Dexie-Version | `apps/web/src/data/db.ts:25-33`, `:73-80` |
| Schlüssel im Gerät | `apps/web/src/app/view.ts:10`, `apps/web/src/features/settings/last-backup.ts:4`, `apps/web/src/app/new-version.ts:18` |
| Format der Sicherung | `packages/core/src/modules/settings/contract.ts:15-16` |
| Sicherung verwirft fehlende oder unbekannte Tabellen, schreibt geprüfte Werte | `packages/core/src/modules/settings/backup.ts:87-89`, `:99`, `:115-119`, `:124-130`, `:134-138` |
| Tabellen als eine Liste | `packages/core/src/ports/storage.ts:36-60`, `:63` |
| Felder jeder Zeile | `packages/core/src/model/primitives.ts:107-113` |
| Betrieb mit Küchen-Feldern, Funktionen, Grenze 20 | `packages/core/src/model/business.ts:7-23`, `:30-42`, `:49-70`, `:63` |
| Eine Rolle je Person heute | `packages/core/src/model/business.ts:73-82` |
| Fallback ohne Liste der Funktionen | `packages/core/src/domain/business-profiles.ts:298-308` |
| Schnittstelle als Summe der Teile | `packages/core/src/contract/index.ts:24-57` |
| `commandId`, Scopes, Ereignisse | `packages/core/src/contract/operation.ts:5-18`, `:40`; `packages/core/src/contract/events.ts:10-18` |
| Use Cases als Summe | `packages/core/src/application/index.ts:25-41` |
| Routen der Bereiche | `apps/web/src/app/routes.tsx:26-50` |
| Funktionen in den Seiten | `apps/web/src/app/modules.ts:11-21` |
| Manifest ohne `id`, `start_url` `/` | `apps/web/vite.config.ts:46-77`, `:62-63` |
| CSP, Standort gesperrt, `noindex` | `apps/web/public/_headers:5`, `:9`, `:12` |
| Netz im Test der Nebenwirkungen | `apps/web/src/side-effects.test.ts:26-28` |
| Sprachtest «du» | `apps/web/src/app/messages.test.ts:39-41` |
| Leitfarbe als `wine` | `apps/web/src/index.css:18-28`; 55 Dateien mit `wine-`, 29 davon in `apps/web/src/ui` |
| Projektname `randen` | `wrangler.jsonc:5` |
| Lizenz | `package.json:5`, `scripts/check-licenses.mjs` |
| Kopie aus Rettich ohne Automatik | `docs/rettich.md:39-54` |
| Umbau schrittweise, Kennungen nur anhängen | `docs/intern/ausbau.md:99` |
| Lizenzhinweise fehlen | `docs/intern/ausbau.md:913` |
| App hängt am Projektnamen, Geschichte bleibt öffentlich | `docs/intern/ausbau.md:997` |
| Herkunft, Nie umbenennen, Umzugsregel | `docs/intern/suite.md`, Abschnitte 4 und 5; ADR-0020, Punkte 3 bis 6 |
| Wächter für private Inhalte in Rettich | `/home/user/Rettich/apps/web/src/private-ideas.test.ts` |
| Nameserver und E-Mail von `onestrand.ch` bei Hostpoint, DNSSEC-Hinweis | `/home/user/onestrand/README.md`, Abschnitte «DNS bei Hostpoint setzen» und «Alternative: Cloudflare Workers» |
| Eigene Domain am Worker braucht Zone bei Cloudflare; `workers.dev` nicht für Geschäftskritisches; Monorepo mit Root-Verzeichnis und Build watch paths | Cloudflare-Doku «Custom Domains», «Routes and domains», «Advanced setups», «Build watch paths», gelesen 24.11.2026 |

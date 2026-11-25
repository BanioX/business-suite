# W0-02: Zusammensetzen

- **Rolle:** Plattform-Agent
- **Voraussetzung:** W0-01
- **Welle:** W0

## Ziel

Branchen und Ausgaben erklären sich mit Manifesten, und die Plattform setzt daraus Schnittstelle, Use Cases mit Rechteprüfung, Tabellen, IndexedDB, Register und Texte zusammen. Danach legt eine Branche eine Tabelle, eine Operation und eine Funktion an, ohne eine Datei der Plattform zu ändern.

## Lesestoff

1. `CLAUDE.md`, `AGENTS.md`, [`../zusammenarbeit.md`](../zusammenarbeit.md)
2. ADRs [0002](../adr/0002-plattform-branchen-ausgaben.md), [0004](../adr/0004-andocken-einer-branche.md), [0005](../adr/0005-gemeinsames-datenmodell.md), [0007](../adr/0007-sprachen.md), [0008](../adr/0008-herkunft-namen-und-adressen.md)
3. [`../plattform.md`](../plattform.md), P-03, P-06, P-07, P-20; [`../randen.md`](../randen.md), Regeln R-3 und R-4
4. In `BanioX/Randen` (nur lesen): `docs/adr/0022-funktionen-2-0-module-optionen-rollen-und-geraetemodus.md`, `docs/intern/ausbau.md` Abschnitte 2 und 9.1 (Stand von AP-1 und AP-2), `packages/core/src/domain/business-profiles.ts`, `packages/core/src/model/business.ts`, `apps/web/src/data/`

## Pfade

- **Schreiben:** `platform/contract/`, `platform/storage/`, `platform/features/`, `platform/access/` (nur Typen und Hülle, die Seiten kommen in W1), `platform/i18n/`, `platform/business/`, `platform/web-data/`, `industries/muster/core/`, `registry/`, `tools/`, Doku wie in W0-01
- **Nur lesen:** `BanioX/Randen`
- **Tabu:** `editions/` (kommt in W0-03), Randen, Rettich

## Schritte

1. **Stand von Randen prüfen:** Ist AP-1 (Register) in Randen plattformfähig fertig (Masterplan 9.1, Ordner `platform/features/`)? Dann die Mechanik ernten (Kopie mit Stempel des Randen-Commits). Sonst die Mechanik nach Randen-ADR-0022 und Regel R-3 selbst bauen und im Bericht festhalten, dass Randen sie später aus der Suite übernimmt. Gleich für AP-2 (Rechte nach W16).
2. **Manifeste:** `defineIndustry`, `defineEdition` (rein TS; `defineIndustryWeb` folgt in W0-03) nach [ADR-0004](../adr/0004-andocken-einer-branche.md); `composeContract` mit Prüfung auf doppelte Operationen; Use Cases mit Hülle für `access`; Steckplätze als Typen.
3. **`@onestrand/features`** (P-06): Register mit Ebenen Branche, Modul, Funktion, Option; Abhängigkeiten über alle Stufen; Umfang («Schlank», «Üblich», «Alles», «Eigene Auswahl»); Einrichten aus Fragen und Vorschlägen; Gerätemodus-Register; Feld `availability` mit nur einem Wert, neutral benannt; Kern-Funktionen nie an `availability`.
4. **`@onestrand/access`** (P-21, Grundlage): Rechte-Stufen, heikle Rechte, Profile, Vorlage «Inhaber:in» fest, Weitergabe-Regeln (niemand vergibt mehr, als er hat), Hülle um Use Cases, Filter-Funktion für das Senden an fremde Geräte.
5. **`@onestrand/business`** (P-20): Betrieb mit Branchen, Kanton, MWST-Art, Briefkopf, Bankverbindung; Person mit Minimum; mehrere Betriebe je Gerät.
6. **`@onestrand/i18n`** (P-07): typisierte Kataloge je Sprache, Rückfall auf de-CH, Regeldatei je Sprache, Lexikon der Branche, Sprache der Dokumente; Texttest (du, ss, keine Ausrufezeichen, keine Produktnamen in Plattform-Texten).
7. **`@onestrand/web-data`**: IndexedDB aus dem Tabellen-Register; Datenbankname und Präfix aus der Ausgabe; Schema-Ledger je Datenbank (nur angefügt); `deviceKey(name)` mit Präfix der Ausgabe.
8. **Referenz-Branche `industries/muster/core`:** eine Tabelle, zwei Operationen, eine Funktion mit Option, eine Betriebsart, eine Frage beim Einrichten, eine Vorlage, ein Regelwerk mit Quelle, Demo.
9. **Generator** `pnpm industry:new <id>` nach dem Muster von `muster`; `pnpm check:industry <id>`.

## Abnahme

- [ ] `muster` legt Tabelle, Operationen, Funktion und Betriebsart an, ohne eine Datei unter `platform/` zu ändern.
- [ ] Eine Operation ohne `access` lässt den Test rot werden; eine Operation mit fehlendem Recht wird abgewiesen.
- [ ] Zwei Branchen mit derselben Operation lassen `composeContract` scheitern.
- [ ] Eine ausgeschaltete Funktion hat keine Einstiege; ihre Daten bleiben.
- [ ] Ein Katalog mit fehlendem portugiesischem Schlüssel fällt auf Deutsch zurück; der Texttest listet die Lücke.
- [ ] `pnpm industry:new probe` erzeugt eine Branche, die `pnpm check:industry probe` besteht; danach wieder entfernt.
- [ ] `pnpm check`: `ALL=GREEN`.

## Testweg

`pnpm check`, `pnpm check:industry muster`.

## Stopp-Regeln

Wie W0-01; dazu: wenn die Ernte aus Randen eine Änderung in Randen bräuchte (nie selbst ändern, an Alban melden).

## Bericht

Was gebaut, was geerntet (mit Randen-Commit), was selbst gebaut und von Randen später zu übernehmen ist; Schulden; was W0-03 wissen muss.

## Stand

Schritt 1 (Stand von Randen) und Schritt 3 (`@onestrand/features`) erledigt am 25.11.2026; die übrigen Schritte sind offen.

**Schritt 1, Stand von Randen** (gelesen aus `BanioX/Randen` @ `5d016f1`, nur lesen):

- **AP-1 (Register) ist in Randen nicht gebaut.** Der Masterplan (`docs/intern/ausbau.md`, 9.1) führt AP-1 als «offen», ADR-0022 als «Gebaut in: noch nicht». Es gibt keinen Ordner `platform/features/` und kein `feature-catalog.ts`. Vorhanden ist nur der Stand von ADR-0015 in `packages/core/src/domain/business-profiles.ts` (feste Liste `MODULE_IDS`, `MODULE_REQUIRES` mit einer Stufe, `proposeSetup`). Daraus wurde **nichts kopiert**: Das Paket ist nach ADR-0022 (Punkte 1, 3, 7, 9, 11, 13) und Regel R-3 selbst geschrieben und trägt keinen Herkunftsvermerk. Randen übernimmt die Mechanik später aus der Suite (Stempel nach R-3).
- **AP-2 (Rechte) ist in Randen ebenfalls offen** (Schritt 9 der Reihenfolge, nach AP-1, AP-13, AP-15, AP-14, AP-16, AP-17). Es gibt nichts zu ernten; `@onestrand/access` (Schritt 4) wird nach ADR-0022 Punkt 10 und Regel R-4 selbst gebaut. Verwertbar als Vorlage nur der Text: Rollen-Standard je Modul (Tabelle in ADR-0022, Punkt 10, die Küchenrollen gehören nach Randen), Zeile «Inhaber:in» fest, Person wechseln mit PIN.

**Schritt 3, `@onestrand/features`:** Register mit Branche, Modul, Funktion und Option; `requires` über alle Stufen, abgeschlossen geprüft; Umfang `lean` / `usual` / `all` als Daten (`custom` wird erkannt, nie gespeichert); Einrichten aus Fragen, Antworten und Betriebsarten; Gerätemodi; `availability` mit dem einen Wert `available`; Kern nie schaltbar. Aufbau wie `createTableRegistry`: `createFeatureRegistry(entries)`, `extend`, eingefroren. Siehe `platform/features/api.md`.

Entscheide (klein, selbst getroffen):

1. **Kennung der Funktion:** ein oder zwei Teile (`<name>` Plattform, `<branche>.<name>`), Kleinbuchstaben, Ziffern und einzelne Unterstriche, kein camelCase. `FEATURE_ID_PATTERN` steht in `@onestrand/contract` (`operation.ts`), `conformity.ts` prüft `access.feature` damit, das Register baut darauf; ein Eigenschaftstest vergleicht beide. Das schliesst TD-10 für die Funktion. Für Rechte (`access.rights`) bleibt das private Muster in `conformity.ts`.
2. **Umfang ohne Text:** Kennungen `lean`, `usual`, `all`; die vier Wörter stehen später in den Katalogen von `@onestrand/i18n`. «Aus» gewinnt vor «an», wenn eine Antwort etwas ausschaltet, samt allem, was darauf baut.
3. **Betriebsart** (`kinds`, `<branche>.<art>`, Feld `on`) ist eigener Eintrag; Fragen können auf Betriebsarten beschränkt sein. Eine Branche meldet `industries`, `groups`, `features`, `kinds`, `questions`, `deviceModes` als ein `FeatureEntries` an.
4. **Namensräume werden geprüft:** Eine Funktion trägt den Namensraum ihres Moduls; ein Eintrag einer Branche nennt nur die Plattform und sich selbst; die Plattform nennt nie eine Branche; der Namensraum muss als Branche angemeldet sein.
5. **Befunde sind Daten** (`featureEntryProblems`, Codes `FEATURE_PROBLEM_CODES`); Bauen und `extend` werfen einen `FeatureError` mit dem Code des ersten Befunds. Fehler im Input des Einrichtens sind Daten in `proposal.problems`.
6. **Nicht gebaut** (niemand verlangt es heute): `stage`, weiche Abhängigkeiten `uses`, Rollen-Standards `roles` und Teile «Erweitert» (`detailed`) aus Randen-ADR-0022 (TD-30). Rollen gehören nach `@onestrand/access`.
7. **Namensregister:** Eintrag für das Paket. `NAME_KINDS` und der Wächter sind nicht erweitert, weil das Paket selbst keine Kennung einer Funktion festlegt (TD-52, Text ergänzt).

Was die folgenden Schritte wissen müssen:

- **Manifeste (Schritt 2):** `defineIndustry` nimmt `catalog` als `FeatureEntries` (Branche, Module, Funktionen, Betriebsarten, Fragen, Gerätemodi); `composeContract` und die Ausgabe rufen `createFeatureRegistry(...).extend(...)`. Prüfen, dass jede `access.feature` im Register steht, gibt es noch nicht (TD-31); es gehört in `composeContract` oder in `check:industry`.
- **Rechte (Schritt 4):** nimmt die Kennungen aus dem Register. Das Muster für `access.rights` ist noch das private in `conformity.ts` (TD-10, Rest); beim Festlegen dort ersetzen. Das Paket darf `@onestrand/features` importieren (Zeile in `PLATFORM_LAYERS` für `access` selbst anlegen).
- **Sprachen (Schritt 6):** Der Texttest verlangt Name und Satz für jede Funktion und jedes Modul, Name je Option, Text je Frage und Antwort, Name je Betriebsart und Gerätemodus, unter den Kennungen des Registers.
- **Betrieb (Schritt 5):** speichert die Liste der Funktionen und die Werte der Optionen; `resolve` ergänzt eine unvollständige Liste und gibt unbekannte Kennungen in `unknown` zurück, die beim Speichern wieder mitgeschrieben werden müssen. Der Gerätemodus liegt auf dem Gerät (`deviceKey`, Schritt 7; neue Zeile in `docs/nebenwirkungen.md`, wenn er geschrieben wird).
- **`muster` (Schritt 8):** eine Funktion mit Option, eine Betriebsart, eine Frage; `featureEntryProblems(...)` muss `[]` sein.
- Neue Schulden: TD-30, TD-31, TD-32. Neue Lektionen: L-S29, L-S41.

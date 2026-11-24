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

offen

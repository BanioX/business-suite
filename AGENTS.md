# AGENTS.md – Einstieg für KI-Agenten und neue Entwickler:innen

Die Onestrand Business Suite ist eine local-first Plattform für Schweizer Kleinbetriebe, aus der installierbare Apps (Ausgaben) für Branchen entstehen. Dieses Repo ist der **Kopf**: Plan, Plattform, Branchen-Pakete und Ausgaben. Diese Datei ist die Karte; die Regeln stehen in [`CLAUDE.md`](CLAUDE.md) und gelten für jedes Werkzeug.

## Stand

Stand 27.11.2026: **Fundament und Zusammensetzen gebaut, noch keine Oberfläche.** Fertig sind W0-01 (Werkzeuge, `pnpm check`, Wächter, Kern, Schnittstelle, Speicher mit Sicherung, Ledger, Test-Kit) und W0-02 (Register der Funktionen, Rechte, Betrieb und Personen, Sprachen, Manifeste und Zusammensetzen, Speicher im Browser, Referenz-Branche `industries/muster`, Generator `pnpm industry:new` und Prüfung `pnpm check:industry`). W0-03 (UI-Kit, Rahmen, erste Ausgabe «Vor Ort») läuft seit dem 27.11.2026. Den Weg zeigt der [Fahrplan](docs/fahrplan.md).

**Eine neue Branche** beginnt mit `pnpm industry:new <id>`, wird mit `pnpm check:industry <id>` geprüft und folgt [`industries/muster/README.md`](industries/muster/README.md). Ihre Kennungen schlägt sie in `industries/<id>/NAMES.md` vor; der Kopf trägt sie ins Namensregister ein.

## Lesereihenfolge

1. [`CLAUDE.md`](CLAUDE.md): Sprache, Arbeitsweise, harte Regeln, Definition of Done.
2. **Dein Auftrag** in [`docs/auftraege/`](docs/auftraege/README.md): Ziel, Pfade, Abnahme, Tabu, Testweg. Ohne Auftrag kein Code.
3. [`docs/zusammenarbeit.md`](docs/zusammenarbeit.md): Rollen, Eigentum an Pfaden, Sammelstellen, Plattform-Antrag, Landen, Stopp-Regeln.
4. [`docs/architektur.md`](docs/architektur.md) und [`docs/plattform.md`](docs/plattform.md): Plattform, Branche, Ausgabe; Pakete; Datenmodell; Abgleich; Sprachen.
5. Als Branchen-Agent: der **Steckbrief deiner Branche** in [`docs/branchen/`](docs/branchen/README.md) und die Fakten in [`docs/fakten/`](docs/fakten/README.md).
6. Die ADRs deines Bereichs in [`docs/adr/`](docs/adr/README.md), offene Fragen in [`docs/entscheide.md`](docs/entscheide.md).
7. Für Muster und Lektionen: Randen (`BanioX/Randen`, nur lesen): `AGENTS.md`, `docs/regeln.md`, `docs/design.md`, `docs/lernbuch.md`.

## Karte (Ziel nach Welle 0)

| Ort | Wem es gehört | Inhalt |
| --- | --- | --- |
| `docs/` | Kopf (Branchen: `docs/branchen/<id>*`, Fakten-Agenten: `docs/fakten/`) | Plan, ADRs, Branchen, Fakten, Aufträge |
| `registry/` | Kopf | `names.json` (Kennungen), `owners.json` (Pfade) |
| `platform/<paket>/` | Kopf, Plattform-Agent mit Auftrag | `@onestrand/<paket>`: `src/` rein TS, `web/` React, `test/`, `api.md` |
| `industries/<id>/` | Branchen-Agent | `core/` (rein TS: Tabellen, Schnittstelle, Use Cases, Register, Vorlagen, Regelwerke, Demo) und `web/` (Seiten, Texte, Lexikon) |
| `industries/muster/` | Kopf | Referenz-Branche, nutzt jeden Steckplatz einmal |
| `editions/<id>/` | Kopf | dünne App: `edition.ts`, Marke, `public/`, `_headers`, `wrangler.jsonc`, Schema-Ledger, eingefrorene Sicherungen, E2E |
| `services/vermittler/` | Kopf | Handschlag der Kopplung (nur mit Albans JA) |
| `tools/` | Kopf | `check`, `ownership`, `names`, `industry:new`, `check:industry`, Wächter (`guards/`), Prüfschritte einer Branche (`conformity/`) |

## Eine Branche in fünf Sätzen

1. Sie liegt ganz in `industries/<id>/` und importiert nur öffentliche Einstiege der Plattform.
2. Sie erklärt sich mit `defineIndustry` und `defineIndustryWeb` ([ADR-0004](docs/adr/0004-andocken-einer-branche.md)) und erscheint nur über Steckplätze.
3. Ihre Kennungen tragen ihr Präfix und stehen im Namensregister; ihre Tabellen zeigen auf Plattform-Kennungen, ohne Plattform-Tabellen zu ändern.
4. Rechte, Speicher, Abgleich, PDF, Sprachen und Sicherung kommen aus der Plattform; fehlt etwas, stellt sie einen Plattform-Antrag.
5. `pnpm check:industry <id>` ist grün, bevor sie landet.

## Was eine Änderung immer mitbringt

- **Eine neue Nebenwirkung** (Netz, Speicher, Kamera, Teilen, Drucken): Eintrag in `docs/nebenwirkungen.md` im selben Schritt. Verlassen Daten neu das Gerät: vorher Albans Entscheid.
- **Eine Rechtsregel:** nur mit Quelle in `docs/fakten/`, in der App als Richtwert.
- **Eine bewusste Abkürzung:** `docs/schulden.md`. **Eine Lektion:** `docs/lernbuch.md`. **Ein neuer Begriff:** [Glossar](docs/glossar.md).
- **Eine sichtbare Änderung:** Vorschaubilder in vier Ansichten, hell und dunkel.

# W0-01: Werkzeuge und Fundament

- **Rolle:** Plattform-Agent
- **Voraussetzung:** keine
- **Welle:** W0

## Ziel

Ein leeres, grünes pnpm-Monorepo mit allen Werkzeugen von Randen und den Fundament-Paketen der Plattform, aus Randen herausgelöst und ins Neutrale gebracht: Kern, Schnittstelle, Speicher, Ledger, Sicherung, Testen. Danach kann W0-02 das Zusammensetzen bauen, ohne an Werkzeugen oder Grundtypen zu arbeiten.

## Lesestoff

1. `CLAUDE.md`, `AGENTS.md`, [`../zusammenarbeit.md`](../zusammenarbeit.md)
2. [`../architektur.md`](../architektur.md), Abschnitte 3 und 5; [`../plattform.md`](../plattform.md), P-01 bis P-05, P-12, P-13
3. [`../hintergrund/plattform-karte.md`](../hintergrund/plattform-karte.md), Abschnitte 2 und 6; [`../randen.md`](../randen.md)
4. ADRs [0003](../adr/0003-monorepo-und-gestempelte-kopie.md), [0005](../adr/0005-gemeinsames-datenmodell.md), [0009](../adr/0009-grundsaetze-aus-randen.md), [0011](../adr/0011-oeffentliches-repo.md)
5. In `BanioX/Randen` (nur lesen): `package.json`, `pnpm-workspace.yaml`, `tsconfig*.json`, `eslint.config.js`, `vitest.config.ts`, `.prettierrc*`, `scripts/*.mjs`, `.github/workflows/ci.yml`; `packages/core/src/{ids,money,currency,dates,format}.ts`, `model/primitives.ts`, `contract/`, `application/command.ts`, `application/stock-ledger.ts` (nur als Muster), `ports/`, `testing/`, `modules/settings/` (Sicherung), `apps/web/src/features/settings/backup-crypto.ts`; die zugehörigen Tests in `packages/core/test/`

## Pfade

- **Schreiben:** Wurzel-Konfiguration (`package.json`, `pnpm-workspace.yaml`, `tsconfig*.json`, `eslint.config.js`, `vitest.config.ts`, Prettier), `.github/workflows/`, `tools/`, `registry/`, `platform/core/`, `platform/contract/`, `platform/storage/`, `platform/ledger/`, `platform/testing/`, `docs/herkunft.md`, `docs/schulden.md`, `docs/nebenwirkungen.md`, `docs/lernbuch.md`, Abschnitt «Befehle» in `CLAUDE.md`
- **Nur lesen:** `BanioX/Randen`, `BanioX/Rettich` (Wächter-Test für private Namen, Release-Skript)
- **Tabu:** `industries/`, `editions/`, alles in Randen und Rettich, jeder Dienst, der Geld kostet

## Schritte

1. **Werkzeuge wie Randen:** Node 24 und pnpm 10 über `packageManager`, TypeScript strict ohne `any`, ESLint (flat) mit Importgrenzen nach [`../architektur.md`](../architektur.md), Abschnitt 3.2, Prettier, Vitest mit Abdeckung. `"private": true`, `"license": "UNLICENSED"` in jeder `package.json`.
2. **`pnpm check`** nach dem Muster von Randen (`scripts/check.mjs`): Format, Lint, Typecheck, Tests, Build, Lizenzen, Wächter; Zeile `ALL=GREEN|RED` und `exit=` je Schritt.
3. **Wächter** (`tools/`): öffentliches Repo (verbotene Namen als Prüfsummen nach dem Muster aus Rettich, keine Preise der Suite), Register der Nebenwirkungen (`docs/nebenwirkungen.md` gegen `fetch`, `WebSocket`, `RTCPeerConnection`, Teilen, Kamera), **Pfad-Eigentum** (`registry/owners.json`, Trailer `Order:` und `Role:` im Commit), **Namensregister** (`registry/names.json`, ein Test findet doppelte und fehlende Kennungen), Lizenzen (nur permissiv).
4. **`@onestrand/core`** (P-01): `ids`, `money`, `currency`, `dates`, `format` und die Feld-Schemas aus Randen mit Herkunftsvermerk (Randen-Commit und Pfad im Kopf jeder Datei und in `docs/herkunft.md`); Tests mitnehmen. Neu: Register der Einheiten mit `h`, `min`, `m`, `m2`, `m3`, `km`, `pcs`, `flat` neben `g` und `ml`; Temperatur und Datumsart der Lebensmittel bleiben draussen.
5. **`@onestrand/contract`** (P-02): Operation, Befehl, Abfrage, Ereignis, Fehler, Befehls-Kit mit `commandId` und Transaktion; jede Operation trägt `access: { feature, level, rights? }`; neutrale Fehlercodes. Die Summe der Schnittstelle bleibt hier offen (`composeContract` kommt in W0-02).
6. **`@onestrand/storage`** (P-03, P-05): Ports (Uhr, IDs, Speicher, Hasher, Dateien), **Tabellen-Register** (Tabellen melden sich mit Schema, Indizes, Heikelkeit und Abgleich-Art an), Speicher im Arbeitsspeicher, **mehrere Betriebe je Gerät**, Dateien als Blob mit Prüfsumme über einen Port, Sicherung mit Format als Parameter, Verschlüsselung mit Passwort aus Randen, Zurückholen mit Prüfung und **lockerem Lesen** (keine stillen Feldverluste; Befund aus [`../randen.md`](../randen.md), Abschnitt 3).
7. **`@onestrand/ledger`** (P-04): Helfer «nur anfügen» mit Prüfkette über den Hasher, Korrektur als neue Zeile, Zustand berechnet, Eigenschaftstest über beliebige Buchungsfolgen.
8. **`@onestrand/testing`** (P-13): feste Uhr, fortlaufende IDs, schlanker Seed (ein Betrieb, zwei Personen), Fabriken für Sprach-, Nebenwirkungs- und Sicherheitstests.
9. **CI** (`.github/workflows/ci.yml`): `pnpm check` auf PRs und `main`; nur betroffene Pakete; reine Doku-Änderungen überspringen Tests. Vorher nachsehen, ob Actions für öffentliche Repos weiter ohne Kontingent laufen; sonst anhalten.
10. **Doku:** `docs/herkunft.md` (jede kopierte Datei mit Quelle und Commit), `docs/schulden.md`, `docs/nebenwirkungen.md`, `docs/lernbuch.md` anlegen; «Befehle» in `CLAUDE.md` nachführen; Stand in [`../fahrplan.md`](../fahrplan.md).

## Abnahme

- [ ] `pnpm check` lokal und in der CI: `ALL=GREEN`.
- [ ] Ein absichtlich falscher Import (Plattform importiert React im rein-TS-Teil; Plattform importiert `industries/`) macht Lint rot (Test oder dokumentierter Probelauf).
- [ ] Kein Wort «randen», keine Wörter der Gastronomie und kein Produktname in `platform/` (Test).
- [ ] Zwei Betriebe im Speicher sind getrennt; Löschen eines Betriebs lässt den anderen stehen.
- [ ] Sicherung hin und zurück mit und ohne Passwort; eine Sicherung mit unbekanntem Zusatzfeld verliert das Feld nicht still.
- [ ] Eigenschaftstest des Ledgers grün; eine veränderte Zeile bricht die Prüfkette.
- [ ] `docs/herkunft.md` nennt jede kopierte Datei mit Randen-Commit.

## Testweg

`pnpm install && pnpm check`; CI auf dem Arbeits-Branch.

## Stopp-Regeln

Anhalten und melden bei: Geld (auch bezahlte CI-Minuten), neuen Datenflüssen, Änderungen ausserhalb der Pfade, einer Abhängigkeit mit unklarer oder nicht permissiver Lizenz, einem Konflikt mit einer Regel aus `CLAUDE.md`.

## Bericht

Was gebaut ist (Pakete, Werkzeuge, Tests), was bewusst offen ist (mit Eintrag in `docs/schulden.md`), welche Dateien aus Randen kopiert wurden, was W0-02 wissen muss.

## Stand

offen

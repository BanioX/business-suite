# Herkunft: was die Suite übernommen hat

Die Plattform ist aus der Ausgabe für die Gastronomie herausgelöst (`BanioX/Randen`), einzelne Werkzeuge kommen aus `BanioX/Rettich`. Dieses Dokument nennt jede übernommene Datei mit Quelle und Commit. So bleibt nachvollziehbar, was woher kommt und was die Suite daran geändert hat ([ADR-0003](adr/0003-monorepo-und-gestempelte-kopie.md), [`randen.md`](randen.md)).

Übernommen wird nur in eine Richtung: Die Suite liest die beiden Repos und schreibt nie hinein. Nach der Übernahme ist die Suite die Quelle.

## Regeln

- **Vermerk im Kopf der Datei.** Eine Quelldatei (`.ts`, `.tsx`, `.js`, `.mjs`), die kopiert oder angepasst wurde, beginnt mit einer Zeile je Quelle, genau in dieser Form:

  ```ts
  // Origin: BanioX/<Repo> <Pfad> @ <Commit> — unchanged
  // Origin: BanioX/<Repo> <Pfad> @ <Commit> — adapted: <kurz, was geändert wurde>
  ```

  «unchanged» steht nur, wenn der Rest der Datei Zeichen für Zeichen der Quelle entspricht. Sind nur die Importpfade anders, heisst es «adapted: import paths».
- **Kein Vermerk für Neues.** Eine Datei, die neu geschrieben ist und die Quelle nur als Muster nimmt, trägt keinen Vermerk.
- **Tabelle 1 wird erzeugt.** `node tools/provenance.mjs` liest die Vermerke aller Quelldateien und schreibt die Tabelle zwischen den beiden Markierungen neu, sortiert nach Datei. Niemand ändert sie von Hand.
- **Tabelle 2 wird von Hand geführt.** Sie nennt übernommene Dateien, die keinen Vermerk tragen können (JSON, YAML, Dateien mit Punkt am Anfang), und Konfiguration, die nach dem Muster der Quelle eingerichtet ist. Ein `*` im Pfad steht für einen Teil des Pfads, also für «dieselbe Datei in jedem Paket».
- **Ein Wächter prüft** (`tools/guards/provenance.guard.test.ts`, läuft mit `pnpm guards`): Tabelle 1 ist auf dem Stand der Vermerke, jeder Vermerk hat die verlangte Form und steht am Anfang der Datei, jede Zeile beider Tabellen nennt eine Datei, die es gibt, mit Quelle, Commit und «unverändert» oder «angepasst».
- **Was der Wächter nicht sieht:** ob eine Datei mit «unverändert» der Quelle wirklich entspricht, und ob eine kopierte Datei ohne Vermerk in Tabelle 2 fehlt. Die Quell-Repos gehören nicht zu diesem Repo; das prüft, wer kopiert.

## 1. Dateien mit Herkunftsvermerk (erzeugt)

<!-- provenance:generated:start -->
| Datei der Suite | Quelle | Commit | Art | Was geändert wurde |
| --- | --- | --- | --- | --- |
| `platform/core/src/currency.ts` | BanioX/Randen `packages/core/src/currency.ts` | `e0f0907` | unverändert | – |
| `platform/core/src/dates.ts` | BanioX/Randen `packages/core/src/dates.ts` | `e0f0907` | angepasst | import path, comments |
| `platform/core/src/format.ts` | BanioX/Randen `packages/core/src/format.ts` | `e0f0907` | unverändert | – |
| `platform/core/src/ids.ts` | BanioX/Randen `packages/core/src/ids.ts` | `e0f0907` | unverändert | – |
| `platform/core/src/money.ts` | BanioX/Randen `packages/core/src/money.ts` | `e0f0907` | angepasst | comments |
| `platform/core/src/primitives.ts` | BanioX/Randen `packages/core/src/model/primitives.ts` | `e0f0907` | angepasst | closed unit enum, temperature, date kind and photo left out; three-decimals rule shared with the arithmetic and exact for large quantities; import paths, comments |
| `platform/core/src/quantities.ts` | BanioX/Randen `packages/core/src/domain/units.ts` | `e0f0907` | angepasst | generalised over the unit register; exact whole-number arithmetic with one rounding; temperature, the decilitre style and the words of a language left out |
| `platform/core/test/currency.test.ts` | BanioX/Randen `packages/core/test/currency.test.ts` | `e0f0907` | unverändert | – |
| `platform/core/test/dates.test.ts` | BanioX/Randen `packages/core/test/dates.test.ts` | `e0f0907` | unverändert | – |
| `platform/core/test/format.test.ts` | BanioX/Randen `packages/core/test/format.test.ts` | `e0f0907` | unverändert | – |
| `platform/core/test/ids.test.ts` | BanioX/Randen `packages/core/test/ids.test.ts` | `e0f0907` | unverändert | – |
| `platform/core/test/money.test.ts` | BanioX/Randen `packages/core/test/money.test.ts` | `e0f0907` | unverändert | – |
| `platform/core/test/quantities.test.ts` | BanioX/Randen `packages/core/test/units.test.ts` | `e0f0907` | angepasst | units come from the register, cases for time, length and area added, temperature left out |
| `platform/core/test/small-rules.test.ts` | BanioX/Randen `packages/core/test/small-rules.test.ts` | `e0f0907` | angepasst | months and years only; expiry and unit labels left out |
| `tools/check-licenses.mjs` | BanioX/Randen `scripts/check-licenses.mjs` | `e0f0907` | angepasst | SPDX expressions with nesting, judgement exported for tests, loud failure when the list cannot be read |
| `tools/check.mjs` | BanioX/Randen `scripts/check.mjs` | `e0f0907` | angepasst | steps of the suite, affected mode with skipped and narrowed steps |
| `tools/src/public-repo.ts` | BanioX/Rettich `apps/web/src/private-ideas.test.ts` | `0ac1fd2` | angepasst | the check of names as a function over given files that reports place and hash, never the word; the check of prices is new |
| `tools/src/words/forbidden-names.ts` | BanioX/Rettich `apps/web/src/private-ideas.test.ts` | `0ac1fd2` | angepasst | only the two lists of hashes, as the seed of the suite's own list |
| `tools/test/public-repo.test.ts` | BanioX/Rettich `apps/web/src/private-ideas.test.ts` | `0ac1fd2` | angepasst | only the test with made-up names, on the function taken out of the test; the other tests are new |
<!-- provenance:generated:end -->

## 2. Dateien ohne Herkunftsvermerk (von Hand geführt)

Stand der Quelle: `BanioX/Randen` bei Commit `e0f0907`, verglichen am 24.11.2026.

<!-- provenance:manual:start -->
| Datei der Suite | Quelle | Commit | Art | Was geändert wurde |
| --- | --- | --- | --- | --- |
| `.editorconfig` | BanioX/Randen `.editorconfig` | `e0f0907` | unverändert | – |
| `.gitignore` | BanioX/Randen `.gitignore` | `e0f0907` | unverändert | – |
| `.nvmrc` | BanioX/Randen `.nvmrc` | `e0f0907` | unverändert | – |
| `.prettierignore` | BanioX/Randen `.prettierignore` | `e0f0907` | unverändert | – |
| `.prettierrc.json` | BanioX/Randen `.prettierrc.json` | `e0f0907` | unverändert | – |
| `tsconfig.base.json` | BanioX/Randen `tsconfig.base.json` | `e0f0907` | unverändert | – |
| `tsconfig.json` | BanioX/Randen `tsconfig.json` | `e0f0907` | unverändert | – |
| `package.json` | BanioX/Randen `package.json` | `e0f0907` | angepasst | Name der Suite; Skripte zeigen auf `tools/`; Wächter, Pfad-Eigentum und Namensregister als eigene Skripte; ohne die Skripte und Abhängigkeiten der Web-App |
| `pnpm-workspace.yaml` | BanioX/Randen `pnpm-workspace.yaml` | `e0f0907` | angepasst | Pakete `platform/*` und `tools` statt `apps/*` und `packages/*` |
| `eslint.config.js` | BanioX/Randen `eslint.config.js` | `e0f0907` | angepasst | Schichten der Plattform und Importgrenzen je Paket; Regeln für `tools/`; ohne die Regeln der Web-App |
| `vitest.config.ts` | BanioX/Randen `vitest.config.ts` | `e0f0907` | angepasst | Projekte `platform/*` und `tools`; Abdeckung für jedes Paket der Plattform; ohne die Ausnahmen der Web-App |
| `platform/*/tsconfig.json` | BanioX/Randen `packages/core/tsconfig.json` | `e0f0907` | angepasst | Node-Typen für die Tests |
| `platform/*/tsconfig.src.json` | BanioX/Randen `packages/core/tsconfig.src.json` | `e0f0907` | unverändert | – |
| `platform/*/vitest.config.ts` | BanioX/Randen `packages/core/vitest.config.ts` | `e0f0907` | angepasst | Name des Projekts je Paket |
<!-- provenance:manual:end -->

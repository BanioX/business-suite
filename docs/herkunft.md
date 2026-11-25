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
- **Tabelle 2 wird von Hand geführt.** Sie nennt übernommene Dateien, die keinen Vermerk tragen können (JSON, YAML, Dateien mit Punkt am Anfang), und Konfiguration, die nach dem Muster der Quelle eingerichtet ist. Ein `*` im Pfad steht für einen Teil des Pfads, also für «dieselbe Datei in jedem Paket» (Muster wie in `registry/owners.json`, Regeln in `tools/src/globs.ts`).
- **Ein Wächter prüft** (`tools/guards/provenance.guard.test.ts`, läuft mit `pnpm guards`): Tabelle 1 ist auf dem Stand der Vermerke, jeder Vermerk hat die verlangte Form und steht am Anfang der Datei, jede Tabelle beginnt mit ihrem Kopf, und jede Zeile beider Tabellen nennt eine Datei, die es gibt, mit Quelle, Commit und «unverändert» oder «angepasst».
- **Was der Wächter nicht sieht:** ob eine Datei mit «unverändert» der Quelle wirklich entspricht, und ob eine kopierte Datei ohne Vermerk in Tabelle 2 fehlt. Die Quell-Repos gehören nicht zu diesem Repo; das prüft, wer kopiert.

## 1. Dateien mit Herkunftsvermerk (erzeugt)

<!-- provenance:generated:start -->
| Datei der Suite | Quelle | Commit | Art | Was geändert wurde |
| --- | --- | --- | --- | --- |
| `platform/business/src/model.ts` | BanioX/Randen `packages/core/src/model/business.ts` | `5d016f1` | angepasst | the business keeps branches, kinds, canton, VAT method, letterhead, bank account, the switched-on functions and the values of their options as plain identifiers instead of a fixed trade, kind and module list; the person has a profile of the access package instead of a trade role; no target costs, no default VAT rate, no demo flag |
| `platform/contract/src/command.ts` | BanioX/Randen `packages/core/src/application/command.ts` | `e0f0907` | angepasst | the kit takes the operation itself instead of a name in a fixed contract; a commandId of another operation or business is refused; the result is checked against the output schema and recorded with its business; error, context and row helper live elsewhere |
| `platform/contract/src/contract.ts` | BanioX/Randen `packages/core/src/application/command.ts` | `e0f0907` | angepasst | only the types of a use case, as functions of an operation and of any contract |
| `platform/contract/src/contract.ts` | BanioX/Randen `packages/core/src/contract/index.ts` | `e0f0907` | angepasst | only the types, as functions of any contract instead of the fixed sum |
| `platform/contract/src/errors.ts` | BanioX/Randen `packages/core/src/application/command.ts` | `e0f0907` | angepasst | only the error of a command; neutral codes of the platform plus namespaced codes of modules and industries, checked at runtime |
| `platform/contract/src/events.ts` | BanioX/Randen `packages/core/src/contract/events.ts` | `e0f0907` | angepasst | import paths, comments |
| `platform/contract/src/json-schema.ts` | BanioX/Randen `packages/core/src/contract/index.ts` | `e0f0907` | angepasst | only the JSON Schemas, as a function of any contract instead of the fixed sum; access instead of scopes; a schema JSON cannot carry is named with its operation; the check of the schemas of an operation is new |
| `platform/contract/src/operation.ts` | BanioX/Randen `packages/core/src/contract/operation.ts` | `e0f0907` | angepasst | access (feature, level, rights) instead of scopes; one technical summary instead of two languages; base fields required by type; name pattern; feature id pattern; import paths |
| `platform/contract/src/ports.ts` | BanioX/Randen `packages/core/src/application/command.ts` | `e0f0907` | angepasst | only the context, narrowed to what a command needs from the storage |
| `platform/contract/src/ports.ts` | BanioX/Randen `packages/core/src/ports/index.ts` | `e0f0907` | angepasst | only the clock and the id generator; import paths, comments |
| `platform/contract/src/ports.ts` | BanioX/Randen `packages/core/src/ports/storage.ts` | `e0f0907` | angepasst | only the command log, the event log and the transaction; an entry of the command log carries its business and is read back whole |
| `platform/contract/test/support.ts` | BanioX/Randen `packages/core/src/ports/memory-storage.ts` | `e0f0907` | angepasst | only the event log, the command log and the transaction, behind the ports of a command; entries by business; counters for the tests |
| `platform/contract/test/support.ts` | BanioX/Randen `packages/core/src/testing/index.ts` | `e0f0907` | angepasst | the counting ids and the fixed clock as they are; the test context without a business row, a person row and use cases; import paths |
| `platform/core/src/currency.ts` | BanioX/Randen `packages/core/src/currency.ts` | `e0f0907` | angepasst | an amount with misplaced thousands marks is refused; comments |
| `platform/core/src/dates.ts` | BanioX/Randen `packages/core/src/dates.ts` | `e0f0907` | angepasst | the years 0 to 99 are no longer counted as 1900 to 1999; import path, comments |
| `platform/core/src/format.ts` | BanioX/Randen `packages/core/src/format.ts` | `e0f0907` | angepasst | comments |
| `platform/core/src/ids.ts` | BanioX/Randen `packages/core/src/ids.ts` | `e0f0907` | angepasst | comments |
| `platform/core/src/money.ts` | BanioX/Randen `packages/core/src/money.ts` | `e0f0907` | angepasst | comments |
| `platform/core/src/primitives.ts` | BanioX/Randen `packages/core/src/model/primitives.ts` | `e0f0907` | angepasst | closed unit enum, temperature, date kind and photo left out; three-decimals rule shared with the arithmetic and exact for large quantities; zero stored without a sign; import paths, comments |
| `platform/core/src/quantities.ts` | BanioX/Randen `packages/core/src/domain/units.ts` | `e0f0907` | angepasst | generalised over the unit register; exact whole-number arithmetic with one rounding; temperature, the decilitre style and the words of a language left out |
| `platform/core/test/currency.test.ts` | BanioX/Randen `packages/core/test/currency.test.ts` | `e0f0907` | unverändert | – |
| `platform/core/test/dates.test.ts` | BanioX/Randen `packages/core/test/dates.test.ts` | `e0f0907` | unverändert | – |
| `platform/core/test/format.test.ts` | BanioX/Randen `packages/core/test/format.test.ts` | `e0f0907` | unverändert | – |
| `platform/core/test/ids.test.ts` | BanioX/Randen `packages/core/test/ids.test.ts` | `e0f0907` | unverändert | – |
| `platform/core/test/money.test.ts` | BanioX/Randen `packages/core/test/money.test.ts` | `e0f0907` | unverändert | – |
| `platform/core/test/quantities.test.ts` | BanioX/Randen `packages/core/test/units.test.ts` | `e0f0907` | angepasst | units come from the register, cases for time, length and area added, temperature left out |
| `platform/core/test/small-rules.test.ts` | BanioX/Randen `packages/core/test/small-rules.test.ts` | `e0f0907` | angepasst | months and years only; expiry and unit labels left out |
| `platform/storage/src/backup-cipher.ts` | BanioX/Randen `apps/web/src/features/settings/backup-crypto.ts` | `e0f0907` | angepasst | WebCrypto and the name of the envelope format are parameters; UTF-8 and Base64 are the pure helpers of this package (Base64 is read strictly, a byte order mark at the start of the text is kept); decrypting checks the envelope again |
| `platform/storage/src/backup.ts` | BanioX/Randen `packages/core/src/modules/settings/backup.ts` | `e0f0907` | angepasst | a kit over a table register with format and version as parameters; loose reading keeps unknown fields; older versions through readers, newer ones refused; unknown top-level fields, counts and files with checksums are checked; rules of the caller instead of the team rule; the result of the check is frozen |
| `platform/storage/src/backup.ts` | BanioX/Randen `packages/core/src/modules/settings/contract.ts` | `e0f0907` | angepasst | only the backup document, its problems and its preview, as types over a register; files added; no name of an app in the document |
| `platform/storage/src/backup.ts` | BanioX/Randen `packages/core/src/modules/settings/use-cases.ts` | `e0f0907` | angepasst | only export and restore, as functions over a storage; restore replaces the business of the file and no other; the event is left to the caller |
| `platform/storage/src/memory-storage.ts` | BanioX/Randen `packages/core/src/ports/memory-storage.ts` | `e0f0907` | angepasst | tables from a register; several businesses per device (purge removes one business and only its entries of the command log); files with a checksum; append-only tables; a row never changes its business; the command log keeps whole entries and refuses a second one; events keep their order; copies refuse what is not plain data; nothing is stored without its id and its business; a failed transaction inside another fails the outer one |
| `platform/storage/src/ports.ts` | BanioX/Randen `packages/core/src/application/command.ts` | `e0f0907` | angepasst | only the row helper, on the error of the contract package |
| `platform/storage/src/ports.ts` | BanioX/Randen `packages/core/src/ports/storage.ts` | `e0f0907` | angepasst | tables come from a register instead of a fixed list and are reached through `table`; several businesses per device; files as their own store; the business row is generic; clock, ids, logs and transaction are the ports of the contract package |
| `platform/storage/test/backup-cipher.test.ts` | BanioX/Randen `apps/web/src/features/settings/backup-crypto.test.ts` | `e0f0907` | angepasst | the cipher is built with WebCrypto of the runtime and a made-up format name; checked against a second implementation; tests for the strict envelope, composed and decomposed passwords, empty inputs and other formats added |
| `platform/storage/test/backup.test.ts` | BanioX/Randen `packages/core/test/settings-backup.test.ts` | `e0f0907` | angepasst | the backup kit on a sample register with two made-up businesses instead of use cases on a fixed list of tables; tests for files, the password, loose reading, versions and readers, counts, unknown fields, the frozen result of the check and the rules of a caller added |
| `platform/storage/test/memory-storage.test.ts` | BanioX/Randen `packages/core/test/application.test.ts` | `e0f0907` | angepasst | only the tests of the memory storage, on a sample register with two made-up businesses; tests for files, append-only tables, the logs, plain data, missing ids and transactions inside transactions added |
| `platform/storage/test/purge-commands.test.ts` | BanioX/Randen `packages/core/test/purge-commands.test.ts` | `e0f0907` | angepasst | commands of a sample operation run through the command kit on the memory storage; a reset removes the entries of one business and leaves those of the other |
| `platform/storage/test/support.ts` | BanioX/Randen `packages/core/src/testing/index.ts` | `e0f0907` | angepasst | only the counting ids and the fixed clock; the test context is a memory storage over a sample register with two made-up businesses |
| `platform/testing/src/clock.ts` | BanioX/Randen `packages/core/src/testing/index.ts` | `e0f0907` | angepasst | only the fixed clock; it holds one instant and the calendar day follows from it, so the two never disagree; the time of day can be set and moved forward |
| `platform/testing/src/context.ts` | BanioX/Randen `packages/core/src/testing/index.ts` | `e0f0907` | angepasst | only the test context, without the sample data of the trade and without use cases; the storage is built for a table register; the seed is one business and two person ids; further businesses on the same storage get their own range of ids |
| `platform/testing/src/ids.ts` | BanioX/Randen `packages/core/src/testing/index.ts` | `e0f0907` | angepasst | only the counting ids; the start is checked, and a counter that has run out fails instead of repeating an id |
| `platform/testing/src/security.ts` | BanioX/Randen `apps/web/scripts/static-headers.ts` | `e0f0907` | angepasst | only the parser of the headers file; a rule keeps its path as written and a bad line is reported with its number; the plug-in for the preview server stays with the edition |
| `platform/testing/src/security.ts` | BanioX/Randen `apps/web/src/security.test.ts` | `e0f0907` | angepasst | the rules as functions over the two given texts that return problems; the page is read by a small scanner instead of a DOM; the policy headers must come from the one rule for every path instead of being sampled on paths of the app; language and title are parameters; a repeated directive, an inline handler and an address written with character references are found as well |
| `platform/testing/src/side-effects.ts` | BanioX/Randen `apps/web/src/side-effects.test.ts` | `e0f0907` | angepasst | the kinds, the reading of the register and the comparison as functions over given sources and a given register text, without the file system; problems as data with English messages; comments are removed by a reader that knows strings; the rules for a well-formed register and for storage keys take the kinds and the prefix as parameters |
| `platform/testing/src/texts.ts` | BanioX/Randen `apps/web/src/app/messages.test.ts` | `e0f0907` | angepasst | the walk over a catalogue and the rules of the language as functions and data over a given catalogue; a message function is read by its literals, not by its source; an exclamation mark at the end of a text is found; rules for empty texts, names of products and pictographs are new |
| `platform/testing/test/clock.test.ts` | BanioX/Randen `packages/core/src/testing/index.ts` | `e0f0907` | angepasst | the origin has no test of its own for the fixed clock; the first two tests pin what its clock gives |
| `platform/testing/test/ids.test.ts` | BanioX/Randen `packages/core/src/testing/index.ts` | `e0f0907` | angepasst | the origin has no test of its own for the counting ids; the first test pins the ids its generator gives |
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
| `.github/workflows/ci.yml` | BanioX/Randen `.github/workflows/ci.yml` | `e0f0907` | angepasst | ein Job mit `pnpm check` statt einzelner Schritte; bei Pull Requests nur das Betroffene; ganze Geschichte für den Vergleich und das Pfad-Eigentum; ohne Artefakte und ohne E2E |
| `platform/*/tsconfig.json` | BanioX/Randen `packages/core/tsconfig.json` | `e0f0907` | angepasst | Node-Typen für die Tests |
| `platform/*/tsconfig.src.json` | BanioX/Randen `packages/core/tsconfig.src.json` | `e0f0907` | unverändert | – |
| `platform/*/vitest.config.ts` | BanioX/Randen `packages/core/vitest.config.ts` | `e0f0907` | angepasst | Name des Projekts je Paket |
<!-- provenance:manual:end -->

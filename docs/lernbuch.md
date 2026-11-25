# Lernbuch

Was wir aus Fehlern gelernt haben, mit Beleg. Neue Arbeit liest zuerst diese Liste. Die Lektionen aus der Ausgabe für die Gastronomie und aus dem Haushalts-Projekt gelten hier vom ersten Tag an (dort `docs/lernbuch.md`, Kennungen L-… und L-R…); eigene Lektionen der Suite beginnen bei L-S01.

## Rechnen und Daten

| Kennung | Lektion | Regel daraus |
| --- | --- | --- |
| L-S01 | Runden für die Anzeige ist auch Runden: `Math.round(wert * 10 ** stellen)` verliert Hälften wie 1.005 | Wo eine Menge eine ganze Zahl von Tausendsteln ist, auf den Tausendsteln runden, nie auf einem Gleitkomma-Produkt |
| L-S02 | Ein Schema, das Gleitkomma-Rauschen entfernt, kann −0 erzeugen. −0 übersteht eine Datenbank, aber kein JSON, und `toEqual` unterscheidet die zwei | Dort normalisieren, wo geschrieben wird; in Rundreise-Tests kein −0 erzeugen |
| L-S03 | `Date.UTC(jahr, …)` liest die Jahre 0 bis 99 als 1900 bis 1999 | Kalenderrechnung über `setUTCFullYear`; gegen eine Referenz prüfen, die unabhängig vom geprüften Code geschrieben ist |
| L-S04 | Ein Wächter, der früh zurückkehrt (`menge <= 0`), versteckt eine falsche Einrichtung, solange die Daten zufällig null sind | Erst die Einrichtung prüfen, dann die Abkürzung nehmen |
| L-S05 | Ein Leser darf nicht enger sein als das Register: das Muster für eine getippte Einheit wies Kennungen ab, die `defineUnit` annimmt | Das Muster nimmt den Rest des Textes, die gemeldeten Schreibweisen entscheiden |
| L-S06 | Ein flaches `Object.freeze` schützt nichts: ein Tor, das «nur Geprüftes» durchlässt, ist hohl, wenn sich das Geprüfte in der Tiefe noch ändern lässt | In jeder Tiefe einfrieren und nachprüfen, was sich nicht einfrieren lässt (Bytes) |
| L-S07 | Ein Speicher im Arbeitsspeicher, der mehr erlaubt als die echte Datenbank (Zeile ohne Schlüssel, gescheiterte innere Transaktion), lässt Tests Code durchwinken, der im Browser halb schreibt | Die Referenz weist ab, was die Datenbank abweist |
| L-S08 | Ein Protokoll der Befehle, dessen Suche nur das Ergebnis liefert, kann Operationen und Betriebe nicht unterscheiden | Wiederholbarkeit über die Kennung braucht den ganzen Eintrag |
| L-S09 | Wo ein fehlendes Feld «weniger Schutz» heisst (Rechte einer Operation), lässt eine Prüfung, die unbekannte Felder duldet, einen Tippfehler als «kein Recht nötig» durch | Solche Prüfungen weisen unbekannte Felder ab |
| L-S10 | `String.prototype.trim` entfernt auch U+FEFF; ein Text mit Byte-Reihenfolge-Marke am Anfang wird von einem kürzenden Schema verändert | Rundreise-Tests nehmen Werte, die schon in der Form sind, die ihr Schema schreibt |
| L-S11 | Ein Schema-Fehler, der durch einen Port nach aussen fällt, bricht das Versprechen «jeder Fehler trägt einen Code» | Am Rand des Pakets einpacken und die Felder nennen |

## Tests

| Kennung | Lektion | Regel daraus |
| --- | --- | --- |
| L-S20 | Vitest 5.1 liest `coverage.include` mit `--project` relativ zum Ordner jedes gewählten Projekts. `--project core --coverage.include='platform/core/src/**'` misst nichts, und die Schwellen gelten als erreicht | Mit `--project` immer `--coverage.include='src/**'`; ohne `--project` gelten die Muster der Konfiguration |
| L-S21 | Ein Eigenschaftstest über Zufallszahlen bewacht keine Regel über Hälften: eine von einigen tausend Zahlen trifft eine | Den Erzeuger gewichten oder die Hälften erschöpfend prüfen; einen neuen Test einmal gegen den alten Code laufen lassen und rot sehen |
| L-S22 | Tests auf Typ-Ebene (`expectTypeOf`, `@ts-expect-error`) prüft nur `tsc`, Vitest führt sie leer aus | Einmal den Typ lockern und sehen, dass `tsc` «unused directive» meldet |
| L-S23 | Ein generischer Aufruf direkt als Argument wird vom erwarteten Typ her erschlossen; ein `@ts-expect-error` darauf findet keinen Fehler | Einen Wert nehmen, dessen Typ schon feststeht |
| L-S24 | Mutationen von Hand im Arbeitsbaum, während jemand Zwischenstände committet, landen im Commit: ein Zwischenstand enthielt eine absichtlich kaputte Datei | Eine Kopie mutieren oder die Zwischenstände anhalten; nach jeder Mutation prüfen, dass sie zurückgenommen ist |
| L-S25 | Vitest zeigt `console.log` eines bestandenen Tests in der Umgebung eines Agenten nicht | Was sichtbar sein muss, geht über `process.stdout.write` |
| L-S26 | Reinheit lässt sich auch zur Laufzeit prüfen: die Globalen der Laufzeit auf `undefined` setzen, den Ablauf fahren, zurücksetzen | Neben der Reinheits-Typprüfung ein Laufzeit-Test je Paket mit Verschlüsselung oder Kodierung |
| L-S27 | Neue Tests für ein fertiges Paket waren beim ersten Lauf grün. Sechs gezielte Änderungen am geprüften Code zeigten eine Lücke: «ja» ohne Wortgrenze blieb grün, weil der Fall nur für gewöhnliche Zeilen stand, nicht für eine Anfrage an einen Server | Nach neuen Tests einige Regeln im geprüften Code von Hand brechen und rot sehen; was grün bleibt, bekommt seinen Fall |
| L-S28 | `'reduce' in wert` gilt für jede Liste, weil Listen die Methode erben: ein Test, der damit «ist ein Ledger» fragte, hielt drei Listen von Kennungen für Ledger | Fremde Werte an einem Feld erkennen, das nur die gesuchte Form hat, und den Test einmal rot sehen |
| L-S29 | Die Form einer Kennung stand zweimal: privat im Vertrag (`access.feature`) und im Register der Funktionen. Zwei Muster hätten beim ersten Sonderfall verschieden entschieden, und kein Test hätte es gemerkt | Die Form liegt einmal im unteren Paket (`FEATURE_ID_PATTERN`), das obere baut darauf; ein Eigenschaftstest über beliebigen Text vergleicht beide Wege |

## Werkzeuge und Wächter

| Kennung | Lektion | Regel daraus |
| --- | --- | --- |
| L-S30 | Das Lizenz-Skript der Quelle nahm «die äusseren Klammern» mit einem Muster weg und trennte bei OR: `(MIT OR GPL-3.0-only) AND (GPL-2.0-only)` galt als erlaubt | Eine Lizenzschranke braucht einen Leser für SPDX, der bei Unverständlichem abweist |
| L-S31 | `no-restricted-imports` mit `paths` trifft nur den genauen Namen: `react` deckt weder `react-dom/client` noch `react/jsx-runtime` | Unterpfade über ein `group`-Muster |
| L-S32 | Ein Muster `platform/*/src/**/*.ts` lässt eine `.tsx` unter `src/` ohne jede Grenze durch | Alle Endungen nennen: `{ts,tsx,mts,cts}` |
| L-S33 | Ein Muster wie `industries/*/**` in einem Block-Kommentar beendet den Kommentar bei `*/` | Wo Muster stehen, Zeilen-Kommentare |
| L-S34 | Ein `/**` am Ende, das auch null Ordner trifft, lässt `industries/*/**` auf `industries/README.md` passen | Bedeutung wie in `.gitignore`: innerhalb des Ordners |
| L-S35 | Auftragsnamen kommen aus Commit-Nachrichten: in einem gewöhnlichen Objekt findet `Order: constructor` etwas | Solche Namen in einer `Map` halten |
| L-S36 | `git show` und `git log` hängen von lokalen Einstellungen ab; `git diff --name-only` zeigt bei einer verschobenen Datei nur den neuen Namen | `cat-file`, `diff-tree --no-renames -z`, `rev-list`, `rev-parse`; Tests mit eigenen Repos entfernen `GIT_*` aus der Umgebung |
| L-S37 | «unchanged» im Herkunftsvermerk friert auch Kommentare ein, die auf ADR-Nummern eines anderen Repos zeigen | Korrigieren kostet das Wort «unchanged» und lohnt sich; Vermerk und Commit sagen weiter genau, woher die Datei kommt |
| L-S38 | Ein Wächter, der nichts zu prüfen findet, einen Fehler schluckt oder die falschen Dateien liest, meldet grün | Jeder Wächter hat einen Test mit einem erfundenen Verstoss, der rot wird, und einen sauberen Fall, der grün bleibt |
| L-S39 | Ohne `.gitattributes` holt Git unter Windows jede Textdatei mit CRLF, und `prettier --check` meldet 166 Dateien, obwohl nichts geändert wurde | Zeilenenden im Repo festlegen (`* text=auto eol=lf`); bis dahin vor dem Checkout `core.autocrlf false` setzen |
| L-S40 | `pnpm` nur über `corepack pnpm …` aufzurufen reicht nicht: Skripte, die selbst `pnpm` starten (`typecheck`, `build`), finden es dann nicht | `corepack enable`, wo nötig mit `--install-directory` in einen Ordner im Pfad |
| L-S41 | Ein Text mit `${…}` über eine Ersetzung in PowerShell in eine Quelldatei geschrieben: pwsh füllte die Ausdrücke aus, die Meldung eines Fehlers wurde `: ` ohne Inhalt. Lint, Typprüfung und alle anderen Tests blieben grün; nur der Test, der die Meldung wörtlich las, wurde rot | Quelltext mit Vorlagen-Zeichenfolgen nie durch Ersetzen in der Shell ändern, sondern mit dem Bearbeiten-Werkzeug; Meldungen wörtlich testen |

## Arbeit mit Agenten

| Kennung | Lektion | Regel daraus |
| --- | --- | --- |
| L-S50 | Agenten wurden mehrmals vom Nutzungslimit und einmal von einem Neustart des Containers mitten in der Arbeit beendet; ihr Bericht fehlte, die Dateien lagen da | Zwischenstände als gekennzeichnete Commits sichern (`wip(...)`), auch wenn sie nicht grün sind; den fertigen Stand als eigenen Commit darüber |
| L-S51 | Ein zweiter Agent, der ein Paket fertigstellt und prüft, ohne es gebaut zu haben, fand im Kern sechs und im Speicher vier echte Fehler, obwohl alle Tests grün waren | Jedes Paket der Plattform bekommt vor dem nächsten eine Prüfung durch jemanden, der es nicht geschrieben hat |
| L-S52 | Mehr Agenten gleichzeitig heisst früher am Limit, nicht früher fertig | Den kritischen Pfad zuerst, Nebenspuren danach |

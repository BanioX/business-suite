# Technische Schulden

Schulden lassen sich nicht ganz vermeiden, aber sie dürfen nicht still wachsen. Jede bekannte Schuld steht hier, mit Grund, Risiko und Plan. Ein PR, der eine Schuld schafft, trägt sie ein; ein PR, der eine abbaut, markiert sie als erledigt. Offene Entscheide stehen nicht hier, sondern in [`entscheide.md`](entscheide.md).

**Risiko:** hoch = kann Daten oder Vertrauen kosten · mittel = bremst die nächsten Schritte · tief = Schönheitsfehler.

## Kern (`@onestrand/core`)

| Kennung | Schuld | Warum sie besteht | Risiko | Plan | Status |
| --- | --- | --- | --- | --- | --- |
| TD-01 | Stückpreise in einer anderen Währung als CHF lassen sich nicht zurücklesen: geschrieben wird «EUR 0.012 / pcs», gelesen wird weder «0,45 €» noch «1.234,50» | aus der Quelle übernommen; es fehlt eine Regel, wie «1.234» gelesen wird, wenn ein Stückpreis mehr Stellen hat als die Währung | tief | Regel festlegen, bevor eine zweite Währung angeboten wird | offen |
| TD-02 | Der Faktor einer Einheit ist eine ganze Zahl, und die Plattform zählt in m, min, g, ml, m²: eine kleinere Einheit (mm, cm, s, mg) passt in keine dieser Dimensionen | einfachste exakte Rechnung | mittel | Faktoren der Dimension anheben, sobald die erste Branche eine kleinere Einheit beantragt; gespeicherte Daten ändern sich dabei nicht | offen |
| TD-03 | `IsoDateTimeSchema` nimmt jede Genauigkeit der Sekunden; Zeitpunkte verschiedener Genauigkeit sortieren als Text nicht nach Zeit | aus der Quelle übernommen | mittel | Jede Uhr schreibt Millisekunden; das Schema wird auf drei Stellen festgelegt, bevor Sicherungen von anderswo gelesen werden | offen |
| TD-04 | Es gibt keinen exakten Helfer für einen Anteil in Basispunkten (Mehrwertsteuer, Rabatt, Zuschlag) | in W0-01 braucht ihn noch niemand | mittel | mit Offerten und Rechnungen (P-29) auf der internen Division mit einer Rundung bauen | offen |
| TD-05 | `rappen()` und `RappenSchema` lassen −0 durch; Mengen speichern die Null inzwischen ohne Vorzeichen | aus der Quelle übernommen | tief | in einem Schritt in `rappen()` und im Schema angleichen | offen |
| TD-06 | Die Typen heissen `Rappen` und `pricePer1000`, meinen aber die kleinste Einheit jeder Währung | Pilot in Franken; die Rechnung stimmt für jede Währung | tief | Umbenennen mit einer neuen Fassung der Schnittstelle | akzeptiert |
| TD-07 | Die Zeichen für `pcs` und `flat` sind neutrale Platzhalter, keine Wörter einer Sprache | kein Text im rein-TS-Teil | tief | Wörter je Sprache aus dem Katalog (`@onestrand/i18n`, W0-02) | offen |

## Schnittstelle (`@onestrand/contract`)

| Kennung | Schuld | Warum sie besteht | Risiko | Plan | Status |
| --- | --- | --- | --- | --- | --- |
| TD-10 | Die Form der Kennungen von Funktion und Recht in `access` prüft ein privates Muster in `conformity.ts` | das Register der Funktionen und die Rechte gibt es noch nicht | mittel | mit `@onestrand/features` und `@onestrand/access` (W0-02) abgleichen oder ersetzen | offen |
| TD-11 | Jede Abfrage verlangt per Typ einen Betrieb; eine Abfrage über das Gerät (Liste der Betriebe) geht nicht durch `query()` | strenger als die Quelle, damit keine Abfrage ohne Betrieb durchrutscht | mittel | W0-02 entscheidet: eigene Art «Abfrage des Geräts» oder lockern | offen |
| TD-12 | `runCommand` erzwingt nicht, dass ein Befehl mindestens ein Ereignis schreibt | Konvention wie in der Quelle | tief | Konformitätstest je Modul, sobald es Module gibt | offen |
| TD-13 | Ein gespeichertes Ergebnis, das nicht mehr zum Ausgabe-Schema passt, lässt einen wiederholten Befehl mit einem Schema-Fehler scheitern; es gibt keinen Weg für alte Einträge | wie in der Quelle | tief | Ausgaben nur anfügen; ein Bruch braucht ein ADR | offen |
| TD-14 | Das Muster der Ereignistypen kennt keine Ziffern und ist nicht als Konstante exportiert | aus der Quelle übernommen | tief | beim ersten Namensraum mit Ziffer | offen |

## Speicher und Sicherung (`@onestrand/storage`)

| Kennung | Schuld | Warum sie besteht | Risiko | Plan | Status |
| --- | --- | --- | --- | --- | --- |
| TD-20 | Eine beschädigte Datei oder eine gespeicherte Zeile, die nicht mehr zu ihrem Schema passt, macht jede Sicherung des Betriebs unbrauchbar; eine einzelne Datei lässt sich nicht entfernen | jede Prüfsumme wird geprüft, und ein Befund weist die ganze Datei ab | **hoch** | Entscheid des Kopfs: entfernen oder reparieren, oder Zurückholen ohne beschädigte Dateien mit Einwilligung. Bis dahin prüft die App jede Sicherung gleich nach dem Schreiben und sagt es sofort | offen |
| TD-21 | Eine Sicherung hält alle Dateien als Base64 in einem JSON-Dokument im Arbeitsspeicher | Form des Dokuments aus der Quelle, dort mit Fotos als Text in der Zeile | mittel | gestreamtes oder geteiltes Format als neue Version mit Leser, bevor eine Branche mit vielen Fotos ausliefert (P-33) | offen |
| TD-22 | Ereignisse und das Protokoll der Befehle sind nicht Teil der Sicherung: nach dem Zurückholen ist die Geschichte leer, und ein wiederholter Befehl läuft noch einmal | wie in der Quelle | mittel | Entscheid des Kopfs vor dem Abgleich zwischen Geräten (Welle 3) | offen |
| TD-23 | `get(id)` einer Tabelle und der Dateien antwortet für jeden Betrieb auf dem Gerät; der Use Case muss den Betrieb vergleichen (`requireRow`) | einfachster Port, wie in der Quelle, die nur einen Betrieb je Gerät kannte | mittel | Konformitätstest oder ein `get` mit Betrieb in W0-02 | offen |
| TD-24 | Abfragen lesen alle Zeilen eines Betriebs (`ofBusiness`) und filtern im Speicher; die gemeldeten Indizes nutzt erst der Datenbank-Adapter | einfachster Port, der im Arbeitsspeicher, im Browser und später auf einem Server gleich aussieht | mittel | gezielte Abfragen am Port, sobald ein Modul sie braucht | offen |
| TD-25 | Der Speicher im Arbeitsspeicher unterscheidet eine verschachtelte nicht von einer überlappenden Transaktion; beide teilen ein Schicksal | Einfachheit der Referenz | tief | Tests warten einen Befehl ab, bevor der nächste beginnt | akzeptiert |
| TD-26 | Die Mindestlänge des Passworts ist nur eine Konstante für das Formular; die Zahl der Runden ist fest | Format der Quelle bleibt lesbar | tief | Änderung als Umschlag der Version 2 | offen |
| TD-27 | Ein Befehl, der einen Betrieb löscht und sich danach protokolliert, lässt einen Eintrag des gelöschten Betriebs zurück | `runCommand` protokolliert nach der Arbeit | tief | Löschen eines Betriebs läuft ausserhalb von `runCommand` | offen |
| TD-28 | Es gibt keinen Speicher des Geräts (welcher Betrieb ist offen, Ansicht) | gehört zum Adapter für den Browser | mittel | `@onestrand/web-data` mit `deviceKey(name)` in W0-02 | offen |

## Werkzeuge und Wächter (`tools/`, CI)

| Kennung | Schuld | Warum sie besteht | Risiko | Plan | Status |
| --- | --- | --- | --- | --- | --- |
| TD-40 | Der Wächter für verbotene Namen kennt nur die Prüfsummen, die aus dem Haushalts-Projekt übernommen sind; die Liste für die Branchen der Suite fehlt | die Klarliste liegt in Albans privater Ablage | mittel | Alban oder der Kopf ergänzt Prüfsummen mit `node tools/hash-name.mjs <wort>` | offen |
| TD-41 | Der Wächter für Preise der Suite ist eine vorsichtige Regel und sieht nicht jede Formulierung | Fakten mit Beträgen (Mindestlöhne, Gebühren) müssen durchgehen | tief | den Rest prüft, wer schreibt | akzeptiert |
| TD-42 | Die Trailer `Order` und `Role` sind Aussagen, kein Beweis: alle Agenten nutzen ein Konto; Merge-Commits werden übersprungen | Branch-Namen helfen nicht, Sitzungen bekommen ihren Branch zugewiesen | mittel | Review der Plattform-PRs durch den Kopf | akzeptiert |
| TD-43 | Das Register der Eigentümer zäunt Pfade, keine Abschnitte: `CLAUDE.md` (Abschnitt «Befehle») und der Abschnitt «Stand» eines Auftrags sind als ganze Dateien freigegeben | ein Abschnitt lässt sich aus einem Commit nicht sicher lesen | tief | Review | akzeptiert |
| TD-44 | Die Schwellen der Abdeckung sind Summen über alle Pakete; ein Lauf nur über betroffene Pakete misst darum etwas strenger oder lockerer als der volle Lauf | eine Schwelle für alles ist am einfachsten | tief | Schwellen je Paket, wenn es stört; der Push auf `main` prüft alles | offen |
| TD-45 | Die CI hat keinen nächtlichen vollen Lauf und keinen E2E-Schritt | es gibt noch keine App | tief | mit der ersten Ausgabe (W0-03); ein Bericht als Artefakt braucht vorher einen Blick auf die Kosten | offen |
| TD-46 | Actions sind über die Hauptversion eingebunden, nicht über einen Commit | wie in der Quelle | tief | beim ersten Gesundheits-Check festnageln | offen |
| TD-47 | `pnpm check` und `pnpm licenses:check` laufen nicht unter Windows | pnpm wird ohne Shell gestartet | tief | – | akzeptiert |
| TD-48 | Feste Uhr und fortlaufende IDs gibt es in den Tests von `contract`, `storage` und `ledger` je einmal neben `@onestrand/testing` | `testing` liegt über diesen Paketen und darf von ihnen nicht importiert werden | tief | – | akzeptiert |
| TD-49 | Lint sieht kein dynamisches `import()`, keine Node-Module ohne `node:` und keine Globalen ausserhalb der Liste | Grenzen der Regel `no-restricted-imports` | tief | die Reinheits-Typprüfung fängt Globale und Node-Typen; für `platform/*/web/**` kommen die Grenzen mit W0-03 | offen |
| TD-50 | Der Wächter der Nebenwirkungen prüft die Schlüssel im Speicher des Browsers nicht (`storageKeyProblems`) | er braucht das Präfix jeder Ausgabe, und es gibt noch keine | mittel | mit der ersten Ausgabe (W0-03) je Ausgabe aufrufen | offen |
| TD-51 | Was «ausgelieferter Code» ist, entscheidet der Wächter der Nebenwirkungen nach dem Pfad (`platform/`, `industries/`, `editions/`, `services/`, ohne `test/`, `e2e/`, `scripts/` und Konfiguration) | es gibt noch keinen Build, der sagt, was im Bündel landet | tief | mit der ersten Ausgabe gegen ihr Bündel abgleichen | offen |
| TD-52 | Das Namensregister liest erst drei Arten aus dem Code: Pakete, die Tabellen des Speichers und die Einheiten der Plattform. Operationen, Ereignisse, Funktionen, Tabellen der Module, Namensräume der Branchen und die eingefrorenen Namen einer Ausgabe fehlen | diese Kennungen entstehen erst mit W0-02 und W0-03 | mittel | je Art eine Zeile in `NAME_KINDS` und im Wächter, im selben PR wie das Paket, das sie einführt | offen |
| TD-53 | Unter Windows scheitern zwei Tests der Werkzeuge (ein symbolischer Link ohne Rechte, ein Dateiname mit Anführungszeichen), und ein Checkout mit CRLF lässt `format:check` für jede Datei rot werden | dem Repo fehlt `.gitattributes`; entwickelt wurde unter Linux | tief | der Kopf legt `.gitattributes` mit `* text=auto eol=lf` an; bis dahin lokal `git config core.autocrlf false` vor dem Checkout. Massgebend ist der Lauf der CI | offen |
| TD-54 | Die CI lief nicht, solange das Repo privat war: GitHub startete den Lauf nicht (Kontingent und Abrechnung des Kontos). Der Workflow nimmt ein öffentliches Repo an | Regeln und Workflow sind für ein öffentliches Repo geschrieben (ADR-0011) | **hoch** | Erledigt am 25.11.2026: Alban hat das Repo öffentlich gestellt, die CI lief grün. Wird das Repo wieder privat, gilt vor jedem Push `pnpm check` unter Linux (Container) mit der Zeile `ALL=` im Bericht | erledigt |

## Stand der Prüfung

| Kennung | Schuld | Warum sie besteht | Risiko | Plan | Status |
| --- | --- | --- | --- | --- | --- |
| TD-60 | `@onestrand/ledger` und `@onestrand/testing` hatten keine getrennte Prüfung wie Kern und Speicher (Lernbuch L-S51): Eine zweite Sitzung hat beide gelesen, die fehlenden Tests und `api.md` geschrieben und dabei keinen Fehler gefunden, aber nicht gezielt nach Fehlern gesucht | Abbruch am Nutzungslimit; der Abschluss von W0-01 hatte Vorrang | mittel | Prüfung beider Pakete durch einen Agenten, der sie nicht gebaut hat, vor dem ersten Ledger eines Moduls (W1) | offen |

# CLAUDE.md – Onestrand Business Suite

Dieses Repo ist der **Kopf** der Suite: Hier wird geplant und gebaut, was alle Branchen gemeinsam haben, und hier docken die Branchen an. Kurzfassung der Regeln. Karte: [`AGENTS.md`](AGENTS.md) · Zielbild: [`docs/zielbild.md`](docs/zielbild.md) · Architektur: [`docs/architektur.md`](docs/architektur.md) · Plattform-Module: [`docs/plattform.md`](docs/plattform.md) · Branchen: [`docs/branchen/`](docs/branchen/README.md) · Fahrplan: [`docs/fahrplan.md`](docs/fahrplan.md) · Zusammenarbeit: [`docs/zusammenarbeit.md`](docs/zusammenarbeit.md) · Entscheide für Alban: [`docs/entscheide.md`](docs/entscheide.md) · ADRs: [`docs/adr/`](docs/adr/README.md) · Aufträge: [`docs/auftraege/`](docs/auftraege/README.md) · Fakten: [`docs/fakten/`](docs/fakten/README.md) · Glossar: [`docs/glossar.md`](docs/glossar.md).

**Name:** Onestrand ist Firma und Dachmarke (Alban, 24.11.2026; Website onestrand.ch, Repo `BanioX/onestrand`). Die Suite heisst im Text «Onestrand Business Suite» oder kurz «die Suite»; technisch `@onestrand/*`. Die Produkte für die Betriebe heissen **Ausgaben** (installierbare Apps). Randen ist die Ausgabe für die Gastronomie (Repo `BanioX/Randen`, Name kann noch ändern). Rettich (Haushalte, `BanioX/Rettich`) gehört nicht zur Suite und bleibt getrennt.

**Produkt:** Eine local-first Plattform, aus der installierbare PWAs für iPhone, iPad und Web entstehen. Zielgruppe sind **Schweizer Kleinbetriebe mit 1 bis 20 Personen, die bei der Digitalisierung zurückliegen**: Reinigung, Hauswartung, Maler, Dachdecker, Umzug, Haustechnik, Garten, kleine Hotels, Coiffeur, kleine Fitnesscenter und Kursbetriebe, Gastronomie und mehr. Ziel (Alban): «Für den kleinen Mann Betrieb digital stemmbar, weil es Onestrand gibt.» Product Owner: Alban Hyseni.

## Sprache
- UI-Texte und Doku: Deutsch (Schweiz), «ss» statt «ß», inklusive Schreibweise (Mitarbeitende, Maler:innen).
- Die Apps sprechen **eine Person mit «du»** an, nie «ihr» oder «Sie» (Randen-ADR-0010). Dokumente an Dritte (Offerte, Rechnung, Rapport, Mängelmeldung) sind ein offener Entscheid ([S-07](docs/entscheide.md)).
- Code, Bezeichner, Commit-Messages: Englisch. Branchen-Kennungen im Code englisch (`facility`, `painting`), in der Doku deutsch.
- Namen ruhig und genau wie bei einer Schweizer Privatbank, Fachwort der Branche vor Kunstwort. Keine Schlagworte, keine Ausrufezeichen, keine Emojis.

## Arbeitsweise
1. **Erst Plan, dann Code.** Jeder Auftrag steht vorher in [`docs/auftraege/`](docs/auftraege/README.md) mit Ziel, Pfaden, Abnahme, Tabu und Testweg. Kleine Entscheide selbst treffen und als ADR festhalten; grosse stehen in [`docs/entscheide.md`](docs/entscheide.md) und warten auf Alban.
2. **Eigentum an Pfaden** ([`docs/zusammenarbeit.md`](docs/zusammenarbeit.md)): Ein Branchen-Agent ändert nur `industries/<id>/` und `docs/branchen/<id>*`. Plattform (`platform/`), Ausgaben (`editions/`), Werkzeuge, Register und Wurzel-Konfiguration ändert nur der Kopf oder ein Plattform-Agent mit Auftrag. Fehlt einer Branche etwas aus der Plattform, stellt sie einen **Plattform-Antrag** und arbeitet bis dahin hinter einem Port.
3. **Regel der zwei:** Was zwei Branchen brauchen, gehört in die Plattform. Keine Branche importiert eine andere.
4. **Ein PR = ein Thema**, mit Tests und grüner Prüfung. Bei sichtbaren UI-Änderungen Vorschaubilder für Alban (iPhone, iPad hochkant, iPad quer, Web; hell und dunkel).
5. **Freigabe:** Was kostenlos ist, darf Claude ohne Rückfrage nutzen. **Alban fragen vor:** allem, was Geld kostet, Preisen, allem, was Betriebsdaten das Gerät neu verlassen lässt, und grösseren Abweichungen vom Plan.
6. **Das Repo ist öffentlich.** Keine Preise, kein Geschäftsmodell, keine Namen oder Vergleiche anderer Software-Produkte, keine echten Firmen- oder Personennamen in Code, Doku, Demo-Daten, Fixtures, Commits, Branch-Namen und PR-Texten. Erlaubt sind Behörden, Verbände und Sozialpartner als Quelle. Strategie und Geld liegen in einer privaten Ablage, nie hier.
7. **Randen und Rettich:** Die Suite schreibt nie in `BanioX/Randen` oder `BanioX/Rettich`. Randen baut seine Teile nach den Regeln in [`docs/randen.md`](docs/randen.md) plattformfähig; die Suite übernimmt sie einmal und ist danach die Quelle. Von Randen und der Suite fliesst nichts in Rettich.
8. **Lokal zuerst prüfen:** `pnpm check` vor jedem Push, die Zeile `ALL=` lesen (sobald das Fundament steht, Auftrag [W0-01](docs/auftraege/w0-01-fundament.md)).
9. **Main zieht mit** (Alban, 17.11.2026, für Randen): Ein grüner Stand geht nach `git fetch` und Rebase auf den Arbeits-Branch der Sitzung und auf `main` (`git push origin HEAD:<branch> HEAD:main`; ein abgelehnter Push heisst: neu holen, neu prüfen). Ausnahme: Änderungen unter `platform/` landen über einen PR mit der CI aller Ausgaben ([S-10](docs/entscheide.md)).
10. **Wenig technische Schulden:** Abkürzungen in `docs/schulden.md`, Nebenwirkungen in `docs/nebenwirkungen.md`, Lektionen in `docs/lernbuch.md`, Begriffe im Glossar. Lieber eine Schuld eintragen als verschweigen.

## Harte Regeln (für jede Branche und jede Ausgabe)
- **Geld immer als Ganzzahl** in Rappen, nie Float. Stückpreise in Rappen pro 1000 Basiseinheiten. Mengen bis drei Nachkommastellen.
- **Daten bleiben auf dem Gerät** (Stufe 1): kein Konto, kein Server, keine Analytics, keine fremden Schriften oder Skripte, CSP nur `'self'`. Ausnahmen gibt es nur mit Albans JA und eigenem ADR (Kopplung im WLAN des Betriebs und Vermittler für den Handschlag, Randen W13 und W15). Ein Server ist Stufe 2.
- **Keine Anbindungen an Partner** (Banken, Buchhaltung, Plattformen, Lieferanten, Zutrittssysteme, Krankenkassen): nur von Hand, Foto mit Texterkennung auf dem Gerät oder Datei. Eine Datei zu lesen, die die Person selbst geladen hat (etwa eine Bankdatei), ist keine Anbindung.
- **Contract-first:** Die UI ruft nur Befehle und Abfragen der Schnittstelle; jede Änderung erzeugt ein Ereignis; jede Operation erklärt ihr Recht.
- **Ledger statt Zustand**, wo Geld, Zeit, Bestand oder Nachweise entstehen: nur anfügen, Korrektur als neue Zeile.
- **Was Dritte unterschrieben oder erhalten haben, ist gesperrt:** Rapport nach Unterschrift, ausgestellte Offerte und Rechnung. Korrektur nur als Nachtrag, neue Fassung oder Gutschrift.
- **Berechnet, nie gespeichert:** Summen, Saldi, Margen, Restguthaben. Fehlt ein Preis, sagt die App das.
- Kalendertage als `YYYY-MM-DD` (Europe/Zurich), Zeitpunkte als ISO-UTC.
- **Recht nur mit Quelle** ([`docs/fakten/`](docs/fakten/README.md)); Richtwerte heissen «Richtwert», und der Betrieb kann sie ändern. Die App beurteilt nie (Asbest, Absturz, Lohn): Sie erinnert, dokumentiert und verweist auf die Quelle.
- Rein-TS-Pakete ohne Browser-Abhängigkeit; Äusseres nur über Ports.
- **Herkunft ist heilig:** Datenbankname, Speicher-Präfix, Sicherungsformat, Cloudflare-Projekt und Adresse einer Ausgabe werden nie umbenannt.
- Keine Secrets im Repo. TypeScript `strict`, kein `any`. Neue Dependencies nur kostenlos, gut gepflegt, schlank, mit permissiver Lizenz (`pnpm licenses:check`).
- Lizenz: proprietär, alle Rechte bei Alban ([`LICENSE`](LICENSE)).
- Die Apps nie in Suchmaschinen: `X-Robots-Tag` und `meta robots` auf `noindex`.
- Kamera nur nach Nutzeraktion, mit Fallback auf Datei-Upload. Kein Standort-Tracking von Mitarbeitenden.

## Befehle
Node 24 und pnpm 10 (über `packageManager`/Corepack). Vor jedem Push `pnpm check` und die Zeile `ALL=` lesen; bei `RED` jede Zeile mit `exit=` ungleich 0.

```
pnpm install
pnpm check                      # alles unten, mit exit= je Schritt und der Zeile ALL=GREEN|RED
pnpm check --affected=<ref>     # nur was sich gegen <ref> geändert hat (CI auf PRs); Exit 2 = konnte nicht starten
pnpm licenses:check             # nur permissive Lizenzen im ausgelieferten Code, nirgends starkes Copyleft
pnpm format:check               # pnpm format zum Korrigieren
pnpm lint                       # mit den Importgrenzen der Plattform
pnpm typecheck                  # inkl. Reinheits-Check von platform/*/src
pnpm test                       # pnpm test:coverage für Abdeckung mit Schwellen
pnpm build
pnpm guards                     # Wächter: öffentliches Repo, Wörter in der Plattform, Herkunft, Nebenwirkungen, Namen, Pfad-Eigentum, Kontrast
pnpm ownership                  # nur Pfad-Eigentum; OWNERSHIP_BASE=<ref> setzt den Anfang (sonst origin/main)
pnpm names                      # nur das Namensregister
pnpm contrast                   # nur der Kontrast jedes Themas (Kit und Ausgaben), mit jedem Paar
pnpm --filter @onestrand/ui gallery  # Galerie des UI-Kits im Beispiel-Thema (nur zur Entwicklung)
pnpm --filter @onestrand/web-device gallery  # Galerie des Geräts (Drucken, Foto, QR, Unterschrift; nur zur Entwicklung)
pnpm industry:new <id>          # neue Branche nach dem Muster von muster; Namen als Vorschlag in industries/<id>/NAMES.md
pnpm check:industry <id>        # alles, was eine Branche vor dem Landen besteht, mit exit= je Schritt und ALL=; Exit 2 = konnte nicht starten
node tools/provenance.mjs       # docs/herkunft.md aus den Herkunftsvermerken neu schreiben
node tools/hash-name.mjs <wort> # Prüfsumme für die Liste der verbotenen Namen
```

Jeder Commit endet mit `Order: <Auftrag>` und `Role: <head|platform|industry:<id>|facts>`; `registry/owners.json` sagt, welcher Auftrag wo schreiben darf. Ein einzelnes Paket prüfen: `pnpm exec vitest run --project <ordner>` und `pnpm --filter @onestrand/<paket> typecheck`; eine Branche: `pnpm check:industry <id>`, oder einzeln `pnpm exec vitest run --project <id>-core` und `pnpm --filter @onestrand-industry/<id> typecheck` (mit `--coverage --coverage.include='src/**'` für die Abdeckung).

## Definition of Done
- [ ] Abnahme des Auftrags erfüllt, nur in den eigenen Pfaden geändert
- [ ] Format, Lint, Typecheck, Unit-Tests, Build, E2E und Wächter grün (`ALL=GREEN`)
- [ ] Offline-Verhalten, Kamera-Fallback und Papier-Weg (PDF) bedacht
- [ ] Keine echten Namen, keine Preise, keine fremden Produkte
- [ ] Texte de-CH mit «du» und «ss», a11y-Basics (Labels, Kontrast, Fokus, 44 px), Felder mindestens 16 px
- [ ] iPhone, iPad hochkant, iPad quer und Web angeschaut, hell und dunkel
- [ ] Recht nur mit Quelle, Richtwerte als Richtwert
- [ ] Doku, ADR, Glossar, Schulden und Nebenwirkungen nachgeführt

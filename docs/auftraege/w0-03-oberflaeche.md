# W0-03: Oberfläche und erste Ausgabe

- **Rolle:** Plattform-Agent
- **Voraussetzung:** W0-02
- **Welle:** W0

## Ziel

UI-Kit, Rahmen, Gerät und PDF der Plattform stehen neutral und mit Marke als Thema; die Ausgabe «Vor Ort» (`editions/field`) läuft als leerer Rahmen mit der Referenz-Branche und einem Demo-Betrieb, nur als Vorschau. Danach kann eine Branche Seiten, Navigation, «Heute» und Dokumente beitragen.

## Lesestoff

1. `CLAUDE.md`, `AGENTS.md`, [`../architektur.md`](../architektur.md) Abschnitte 2.4, 3, 4, 7; [`../entscheide.md`](../entscheide.md), S-26 (Bedienmuster) und S-27 (Farben); der Klickentwurf, den Alban dazu angeschaut hat, als Bild der Abläufe
2. [`../plattform.md`](../plattform.md), P-08 bis P-11, P-32; ADR [0008](../adr/0008-herkunft-namen-und-adressen.md)
3. In `BanioX/Randen` (nur lesen): `apps/web/src/ui/`, `apps/web/src/app/`, `apps/web/src/index.css`, `apps/web/src/ui/pdf/`, `ui/print.ts`, `ui/share-file.ts`, `apps/web/vite.config.ts`, `apps/web/public/_headers`, `apps/web/e2e/`, `scripts/` (Vorschaubilder, Kontrast), `docs/design.md`, `docs/regeln.md`, `docs/ui-kit.md`
4. In `BanioX/Rettich` (nur lesen): Scanner und Kamera (`features/scan/`), App-Sperre (`app/lock/`), Zahl am Symbol, Dokument-Ansicht mit pdf.js (`features/reports/`)

## Pfade

- **Schreiben:** `platform/ui/`, `platform/shell/`, `platform/web-device/`, `platform/pdf/`, `platform/today/`, `industries/muster/web/`, `editions/field/`, `tools/` (Vorschaubilder, Kontrast), Doku
- **Tabu:** Randen, Rettich; jede Adresse ausser einer Vorschau unter `workers.dev`; Name und Symbol einer Ausgabe festlegen (Albans Entscheid S-05)

## Schritte

1. **`@onestrand/ui`** (P-08): Kit aus Randen mit neutralen Farb-Tokens (`accent`, `accent-strong`, `surface` statt `wine`, `grape`, `cork`), Marke als Thema der Ausgabe, Kontrastprüfung je Thema, hell und dunkel; Gastro-Bausteine (Allergene, Temperatur, Artikel-Auswahl) bleiben draussen; Kit-Texte de-CH im Katalog.
2. **`@onestrand/shell`** (P-09): Rahmen für iPhone, iPad hochkant, iPad quer und Web nach Randen-ADR-0013; Navigation und Routen aus Steckplätzen; **Arbeitsplatz je Rolle** (Tab-Leiste und Startseite aus den Rechten); **Bedienmuster nach [S-26](../entscheide.md):** auf dem iPhone eine Leiste unten mit genau fünf Punkten und «＋ Erfassen» in der Mitte, Einstellungen oben rechts, auf iPad und Web dieselben fünf Ziele als Leiste an der Seite; eine Branche füllt Steckplätze und fügt nie einen sechsten Punkt an; Hooks `useQuery`, `useCommand`, `useFeature`, `useRight`, `useDetailed`; Gerätemodus-Rahmen; Seiten Betrieb, Funktionen, Team (Grundgerüst), Daten (Sichern, Zurückholen, Export, Löschen), Über (mit «von Onestrand»), Lizenzen von Drittanbietern; Wechsel zwischen Betrieben.
3. **`@onestrand/web-device`** (P-10): Teilen und Drucken aus Randen (iOS-Weg über PDF), Kamera nur nach Tipp mit Datei-Fallback, Fotos verkleinern, QR lesen (aus Rettich), **Unterschrift auf dem Gerät**, WebCrypto, Wake Lock, Zahl am Symbol.
4. **`@onestrand/pdf`** (P-11): PDF-Kit mit Thema, Stile Übersicht, Streifen, Formular; Briefkopf mit Logo; Dokument-Ansicht vor dem Drucken; Dokument-Sprache.
5. **`@onestrand/today`** (P-32): «Heute» aus Steckplätzen.
6. **`industries/muster/web`:** eine Seite, ein Navigationseintrag, eine Karte in «Heute», ein Abschnitt auf einer Plattform-Seite, ein Dokument.
7. **`editions/field`:** `edition.ts` mit Datenbank `field`, Präfix `field:`, Format `field-backup` (nie umbenennen), Arbeitstitel «Vor Ort», Thema nach [S-27](../entscheide.md) (der helle Ton von Onestrand: Weiss und Silber, das Blau von Onestrand eine Stufe heller; dunkel wie Onestrand selbst), geprüft mit der Kontrastprüfung hell und dunkel; `_headers` mit CSP `'self'` und `noindex`; Manifest; `wrangler.jsonc` für eine Vorschau; E2E mit Playwright und axe in vier Ansichten, hell und dunkel; Vorschaubilder (`pnpm preview:shots`).

## Abnahme

- [ ] Die Ausgabe startet, richtet einen Demo-Betrieb ein, zeigt «Heute» mit der Karte von `muster`, sichert und holt zurück.
- [ ] Eine Rolle ohne Recht sieht den Eintrag von `muster` nicht, weder in der Navigation noch in «Heute».
- [ ] Auf dem iPhone hat die Leiste unten in jeder Rolle genau fünf Punkte mit «＋ Erfassen» in der Mitte; die Einstellungen sind oben rechts erreichbar; ein sechster Eintrag einer Branche landet unter «Mehr» (Test).
- [ ] Jede Seite der Shell ist gegen die Prüfliste aus [S-26](../entscheide.md), Punkt 5, durchgesehen; Abweichungen stehen im Bericht.
- [ ] E2E mit axe grün in iPhone 390 px, iPad 820 px, iPad 1180 px, Web 1440 px, hell und dunkel; kein seitliches Scrollen, kein Feld unter 16 px.
- [ ] Ein PDF mit Briefkopf geht in der installierten App über das Teilen-Menü.
- [ ] Kein `wine`, `grape`, `cork` und kein «Randen» unter `platform/` (Test).
- [ ] Vorschaubilder für Alban liegen bei.

## Testweg

`pnpm check`, `pnpm e2e`, `pnpm preview:shots`, auf einem echten iPhone die Vorschau-Adresse öffnen.

## Stopp-Regeln

Wie W0-01; dazu: Name, Symbol oder Adresse einer Ausgabe festlegen (Albans Entscheid).

## Bericht

Bilder, was gebaut ist, was für die Branchen bereitsteht (Steckplätze), Schulden.

## Stand

Schritt 1 (`@onestrand/ui`, P-08) gebaut, 28.11.2026; Schritte 2 bis 7 offen. Geerntet aus `BanioX/Randen` @ `e0f0907` (`apps/web/src/ui`, `index.css`, `test-setup.ts`, `scripts/check-contrast.mjs`), jede Datei mit Herkunftsvermerk ([`../herkunft.md`](../herkunft.md)).

**Schritt 1, `@onestrand/ui`:** Werkzeuge für React-Pakete (React 19, jsdom, Testing Library, Regeln der Hooks; Tailwind 4 im Kit, Vite nur für die Galerie), das Kit mit neutralen Tokens, Thema als Parameter der Ausgabe, Kontrastprüfung je Thema, Kit-Texte in de-CH, Galerie mit Vorschaubildern. Beschreibung: [`platform/ui/api.md`](../../platform/ui/api.md).

Entscheide (klein, selbst getroffen):

1. **Schicht «React»:** Das ganze `src/` eines React-Pakets ist React (`REACT_PACKAGES` in `eslint.config.js`). Es gilt alles, was für ein reines Paket gilt, mit drei Unterschieden: `react` und `lucide-react` sind erlaubt, die Globalen `window` und `document` (Fokus, Zeitgeber, modaler Dialog) und keine weiteren, und die Regeln der Hooks. `react-dom` bleibt zu: Die App einhängen tut die Ausgabe. Ein reines Paket importiert weiterhin kein React (neu auch `lucide-react` nicht). Belegt in `tools/test/lint-boundaries.test.ts`.
2. **Schichten des Kits:** `ui` importiert nur `core` (Geld, Datum, Zahlen) und `i18n` (der eigene Katalog in anderen Sprachen über `resolveCatalogue`). Kein Speicher, keine Rechte, kein Register, kein Gerät: Was eine Seite davon braucht, kommt über die Hooks der Shell. Heute, die Währung, die Sprache und der Link des Routers kommen über `UiProvider`; das Kit liest nie die Uhr und kennt keinen Router.
3. **Tailwind wie in der Quelle**, aber ohne Palette: `kit.css` schaltet die Farben von Tailwind aus und bildet die 21 Tokens auf Variablen ab (`@theme inline`). Eine Klasse mit fester Farbe zeichnet nichts, und ein Test findet sie. Kein Plugin für React: Vite übersetzt JSX selbst (L-S86).
4. **Tokens** nach Rollen, nicht nach Farben: `ground`, `app`, `surface`, `surface-muted`, `calm-start`, `calm-end`, `fg`, `muted`, `line`, `line-strong`, `accent`, `on-accent`, `accent-strong`, `accent-edge`, `accent-soft`, `ok`, `warn`, `bad` mit `-soft`. `accent-edge` ist neu gegenüber S-27: Der helle Akzent hebt sich als angehakter Kasten, gewähltes Segment oder eingeschalteter Schalter nur mit 1.9 zu 1 von der Karte ab; ein Rand in `accent-edge` gibt die 3 zu 1 von WCAG 1.4.11 (L-S88).
5. **Kontrastprüfung als Wächter**, kein eigener Schritt von `pnpm check`: `tools/guards/contrast.guard.test.ts` läuft in `pnpm guards` und allein mit `pnpm contrast`. Die Paare nennt das Kit (`CONTRAST_PAIRS`), die Messung macht `tools/src/contrast.ts` (WCAG 2.2, auf zwei Stellen abgerundet). Gemessen werden `neutralTheme` und das Thema jeder Ausgabe in `editions/<id>/theme.ts` (TD-127).
6. **Keine feste Farbe, kein Text, keine Nebenwirkung in einer Komponente**, je mit einem Test im Paket (`test/rules.test.tsx`), der an einem falschen Beispiel rot wird; dazu ein Wächter für die Farbwörter einer Marke unter `platform/` (`tools/src/words/brand-tones.ts`).
7. **Ausgelassen:** die Bausteine der Gastronomie, alles mit Speicher oder Register, und vorerst Suchfeld, Tabelle, Diagramme, Auswahl mit Suche, Foto (TD-125). `ConfirmDialog` zeigt die gefährliche Tat als Umriss (TD-132).

Prüfung: siehe den Bericht von Schritt 1; Schulden TD-125 bis TD-133, Lektionen L-S86 bis L-S91.

**Befunde der unabhängigen Prüfung von Schritt 1, behoben (28.11.2026):** Der Kontrast misst die Bedeutungsfarben als Schrift auf jedem Grund (auch auf der ruhigen Fläche der Kennzahlen) und ruhige Schrift auf jeder hellen Fläche eines Hinweises; beide Themen bestehen, keine Farbe geändert. Meldungen stehen in einer Reihe und gehen nicht verloren, eine Meldung über Falsches steht ihre ganze Zeit, und ein offenes Blatt zeigt die Meldung in sich (in Chromium gemessen, L-S90). `NumberField` liest «1.000» nicht als 1. Neu `QuantityField` (Tausendstel als ganze Zahl) und `TimeField` (`HH:MM`). Das Datumsfeld schaltet Schnellwahlen ausserhalb von `min` und `max` aus, behält ein ISO-Datum von der Tastatur und nimmt einen Monat ohne Tag nicht als Monatsende. `Sheet` trägt `aria-modal="true"`, und der Weg über `cancel` hat eigene Tests.

Was die folgenden Schritte wissen müssen:

- **Shell (Schritt 2):** `UiProvider` einmal oben einhängen (`today` aus der Uhr der App, `currency` des Betriebs, `link` des Routers, `translation` der Sprache der Person), dazu `ToastProvider`. Das Zahnrad oben rechts ist `PageHeader corner={<IconButton icon={Settings} label=… />}`. Die Wahl hell oder dunkel setzt die Shell als `data-scheme` auf `<html>` (`SCHEME_ATTRIBUTE`). Braucht die Shell `react-dom` (Portal) oder weitere Globale, ist das eine Zeile in `REACT_PACKAGES` und im Test der Grenzen, mit Begründung. Die Shell als React-Paket bekommt ihre Zeile in `PLATFORM_LAYERS` und `REACT_PACKAGES`.
- **Ausgabe (Schritt 7):** Thema in `editions/field/theme.ts` mit `defineTheme` (die Werte des Beispiels in `platform/ui/test/example-theme.ts` und `api.md`); beim Bauen `themeCss(theme)` in eine CSS-Datei schreiben (TD-128), dann `@import '@onestrand/ui/kit.css'` und `@source` für Shell und Branchen. Playwright mit axe und `pnpm preview:shots` kommen dort dazu (TD-126); das Skript der Vorschaubilder von Schritt 1 misst schon seitliches Scrollen, Felder ab 16 px und Ziele ab 44 px. `pnpm --filter @onestrand/ui gallery` zeigt das Kit.
- **Branchen (`industries/<id>/web`):** Seiten nehmen das Kit über `@onestrand/ui` und schreiben nur Tokens (`bg-surface`, `text-muted`), nie eine Farbe; ihre Texte stehen in ihrem Katalog.

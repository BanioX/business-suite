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
7. **`editions/field`:** `edition.ts` mit Datenbank `field`, Präfix `field:`, Format `field-backup` (nie umbenennen), Arbeitstitel «Vor Ort», Thema nach [S-27](../entscheide.md) (Silber, Weiss, hellblaue Akzente; Hellblau als Schrift in der tieferen Stufe), geprüft mit der Kontrastprüfung hell und dunkel; `_headers` mit CSP `'self'` und `noindex`; Manifest; `wrangler.jsonc` für eine Vorschau; E2E mit Playwright und axe in vier Ansichten, hell und dunkel; Vorschaubilder (`pnpm preview:shots`).

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

offen

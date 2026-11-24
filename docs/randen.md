# Randen und die Suite

Randen (`BanioX/Randen`) ist die Ausgabe für die Gastronomie und die erste Branche der Suite. Es ist mitten im Ausbau (Masterplan `docs/intern/ausbau.md` dort, AP-0 bis AP-32, Albans Wünsche W1 bis W17). Diese Seite sagt, wie Randen und die Suite zusammenfinden, ohne dass Randen aufgehalten wird. Grundlage ist die Karte des Randen-Codes in [`hintergrund/plattform-karte.md`](hintergrund/plattform-karte.md) (Stand Randen-Commit `a8d8e63`, 24.11.2026).

## 1. Grundsätze

1. **Randen geht vor.** Kein Schritt der Suite hält AP-0 (Fundament und Fehler), AP-13 (Küchenmonitor) oder den ersten Pilot auf.
2. **Die Suite schreibt nie in Randen.** Was Randen tun soll, geht als Bitte über Alban an die Randen-Sitzung.
3. **Eine Quelle je Stück.** Was Randen plattformfähig baut, übernimmt die Suite einmal (Ernte) und ist danach die Quelle; Randen bekommt es als gestempelte Kopie zurück. Nie zwei Fassungen.
4. **Herkunft ist heilig.** Datenbank `randen`, Präfix `randen:`, Sicherungsformat `randen-backup`, Cloudflare-Projekt `randen` und die Adresse werden nie umbenannt, auch wenn die Marke «Randen» ändert.

## 2. Was in Randen schon plattformtauglich ist

| Stück | Ort in Randen | Bindung an die Gastronomie |
| --- | --- | --- |
| IDs, Geld, Währung, Datum, Format | `packages/core/src/{ids,money,currency,dates,format}.ts` | keine (Kopien aus Rettich) |
| Feld-Schemas | `packages/core/src/model/primitives.ts` | Einheiten nur g, ml, Stück; Temperatur; Foto als Data-URL |
| Schnittstelle und Befehls-Kit | `packages/core/src/contract/`, `application/command.ts` | feste Summe `CONTRACT_V1` aus 14 Gastro-Modulen |
| Ports und Speicher | `packages/core/src/ports/`, `apps/web/src/data/` | feste Tabellenliste, Datenbankname `randen`, ein Betrieb je Gerät |
| Lager-Ledger | `application/stock-ledger.ts` | Muster neutral, Umsetzung an Artikel und Charge gebunden |
| Sicherung | `modules/settings`, `features/settings/backup-crypto.ts` | Format `randen-backup` |
| PDF-Kit, Drucken, Teilen | `apps/web/src/ui/pdf`, `ui/print.ts`, `ui/share-file.ts` | Farben und Name fest |
| UI-Kit, Rahmen | `apps/web/src/ui`, `apps/web/src/app` | Farb-Tokens `wine`, `grape`, `cork`; Navigation und Routen fest |
| Selbstkontrolle | `modules/haccp`, `features/haccp` | Muster für Checklisten; Messarten und Grenzwerte Gastro |
| Werkzeuge | `scripts/`, `.github/workflows/ci.yml`, `apps/web/e2e` | keine |

## 3. Bauregeln für Randen jetzt

Damit was Randen gerade baut (AP-1 Register, AP-2 Rollen, AP-3 bis AP-6 Team und Zeit, AP-8 Erinnerungen, AP-15 Dokument-Ansicht, AP-16 Kasse und Belege, AP-19 Kopplung, Vermittler nach W15) später ohne Umbau in die Plattform wandern kann:

| Nr. | Regel |
| --- | --- |
| R-1 | **Eigener Ordner:** Allgemeine Teile in `packages/core/src/platform/<baustein>/` (eigene `model.ts`, `contract.ts`, `use-cases.ts`, `rules.ts`; Tests in `packages/core/test/platform/`) und `apps/web/src/platform/<baustein>/` (Seiten, `messages.ts`). Bausteine: `features`, `access`, `team`, `time`, `absences`, `payroll`, `books`, `checks`, `calendar`, `reminders`, `pairing`, `documents`. Gastro-Teile (Einträge im Register, Rollenvorlagen der Küche, L-GAV, Bon-Befehle, Fahrerkasse, HACCP-Messarten) bleiben in `domain/` und `modules/`. |
| R-2 | **Importgrenze** per ESLint und Test: `platform/` importiert nur `ids`, `money`, `currency`, `dates`, `format`, `model/primitives`, `contract/operation`, `contract/events`, `application/command`, `ports` und andere `platform/`-Ordner; nie Artikel, Rezepte, Speisekarte, HACCP, Lager, Verkäufe, `domain/*`, `modules/*`, `features/*`. |
| R-3 | **AP-1:** Register trennen in die Mechanik (Funktion, Abhängigkeiten über alle Stufen, Umfang, Optionen, `stage`, `availability`, Gerätemodus) unter `platform/features/` und die Einträge der Gastronomie in `domain/feature-catalog.ts`. Gruppen, Vorschläge und Rollen sind Kennungen; Texte nur in `messages.ts`. |
| R-4 | **AP-2:** Rechte nach W16 statt fester Rollen: je Funktion nichts, sehen, bedienen, verwalten, dazu heikle Rechte; Profile als Zeilen je Betrieb; nur «Inhaber:in» fest, Küchenrollen sind Vorlagen der Gastronomie; jede neue Operation trägt `access`; derselbe Filter beim Senden an fremde Geräte. |
| R-5 | **Neutrale Namen** in Kennungen, Tabellen, Ereignissen und Texten der Plattform-Teile: Betrieb, Team, Arbeitsplatz; nie Küche, Koch, Gast, Gericht, Pass, HACCP. Der App-Name als Platzhalter statt «Randen». |
| R-6 | **Querbuchungen über Ports:** Der Tagesabschluss schreibt Umsatz je MWST-Satz in eine eigene Tabelle, die Zahlen lesen ihn über eine Umsatzquelle; ein Beleg bucht den Wareneingang über einen Port, den Randen mit dem Lager-Ledger umsetzt. |
| R-7 | **Speicher neutral und nie umbenannt:** neue Tabellen mit neutralen Namen, an einer Stelle mit Schema, Indizes und Kennzeichen; neue Speicherschlüssel nur über eine Hilfsfunktion mit Präfix; bestehende `randen:*` bleiben; Dateien als Blob in eigener Tabelle, nie als Data-URL in Zeilen. |
| R-8 | **Ein Ledger-Helfer** «nur anfügen» für Zeit, Bons und Kassenbuch mit Prüfkette über einen Port, Minuten und Rappen als Ganzzahl; eine Zeitbuchung hat einen optionalen neutralen Verweis (für Einsätze anderer Branchen). |
| R-9 | **Regelwerke als Daten mit Quelle:** Arbeitsgesetz, Feiertage je Kanton, MWST-Sätze mit Gültigkeit neutral; L-GAV, GAV Bäckerei und Fleisch, HACCP-Grenzen in Randen; Ende des Geschäftstags als Option (Gastro 04:00). |
| R-10 | **Kopplung:** Protokoll und Profil mit Ablauf in `platform/pairing/` mit einem Port für den Transport; die erlaubten Befehle gibt Randen hinein; der Vermittler als eigenes Projekt ohne «randen» in Pfaden und Nachrichten. |
| R-11 | **Dokumente:** Dokument-Ansicht und Stile mit Thema als Parameter statt fester Farben, Name aus der App; Plattform-Seiten nutzen Farben nur über semantische Tokens. |
| R-12 | **Tests** der Plattform-Ordner auf dem Speicher im Arbeitsspeicher mit schlankem Seed (Betrieb, zwei Personen), nicht auf der Testküche; je ein Test für die Importgrenze und für Plattform-Texte ohne «Randen» und ohne Gastro-Wörter. |

Zwei Befunde aus der Karte, die Randen unabhängig davon helfen:

- **Sicherung aus einer neueren Version:** Das Zurückholen liest mit `z.object` und schreibt die geprüften Werte; eine ältere App verliert so still neue optionale Felder. Vorschlag: locker lesen oder neuere Sicherungen ablehnen.
- **ADR-0032** steht im Verzeichnis der ADRs und wird zitiert, die Datei fehlt.

## 4. Nachricht an die Randen-Sitzung (zum Weitergeben)

> Die Suite (`BanioX/business-suite`) plant Onestrand als Plattform für viele Branchen; Randen bleibt die Ausgabe für die Gastronomie und baut ungestört weiter. Bitte baue ab jetzt die allgemeinen Teile aus deinem Masterplan (AP-1 Register, AP-2 Rollen und Rechte, AP-3 bis AP-6 Team und Zeit, AP-8 Erinnerungen, AP-15 Dokument-Ansicht, AP-16 Kasse und Belege, AP-19 Kopplung und Vermittler) **plattformfähig** nach den Regeln R-1 bis R-12 in `docs/randen.md` des Repos business-suite: eigener Ordner `platform/`, Importgrenze, neutrale Namen, Rechte nach W16, Querbuchungen über Ports, Regelwerke als Daten. Datenbank, Präfixe, Sicherungsformat und Projekt `randen` bleiben unverändert. Trag in deinen Masterplan ein, dass die Suite diese Teile nach ihrer Fertigstellung einmal übernimmt und Randen sie danach als gestempelte Kopie zurückbekommt. Halte AP-0 und AP-13 dafür nicht auf.

## 5. Ernte und Umzug

| Schritt | Wann | Was | Sicherheit |
| --- | --- | --- | --- |
| R0 | jetzt | nur lesen | – |
| R1 | nach W0 | `vendor/onestrand/core` mit Stempel; die fünf Kerndateien zeigen darauf | keine Datenänderung |
| R2 | an Stelle von AP-1 oder direkt danach | Mechanik des Registers aus `@onestrand/features` | Migration der Funktionen mit Test |
| R3 | je Paket nach seiner Fertigstellung in Randen | Die Suite übernimmt es mit Stempel des Randen-Commits (Ernte per `git diff` ab Stempel); danach ist die Suite die Quelle | eingefrorene Sicherungen, E2E in vier Ansichten |
| R4 | nach dem ersten Gastro-Pilot | UI-Kit und Shell aus der Plattform; Rotwein, Traube, Kork als Thema | Vorschaubilder vorher und nachher |
| R5 | auf Albans Wort, nach einem stabilen Pilot | Code mit Geschichte nach `industries/gastro` und `editions/gastro`; das Cloudflare-Projekt `randen` baut danach aus business-suite | vorher Probelauf unter einer Vorschau-Adresse: alte Datenbank öffnen, Sicherungen jeder Version zurückholen; Datenbank-Version der Suite liegt über der höchsten ausgelieferten Version von Randen |

Beim Umzug des Codes ändert sich keine Adresse; eine Umzugsregel für Betriebe braucht es nur, wenn sich die Adresse ändert (Randen-ADR-0020, Abschnitt 5). Die endgültige Adresse von Randen steht vor seinem ersten Pilot fest ([S-04](entscheide.md)).

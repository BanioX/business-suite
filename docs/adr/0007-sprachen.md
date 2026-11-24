# ADR-0007: Sprachen

- **Status:** Entwurf; Punkte 10 bis 14 und Welle 2 für den Arbeitsplatz der Mitarbeitenden nach Albans Wunsch vom 24.11.2026; Anrede in fr und it offen ([S-07](../entscheide.md))
- **Datum:** 2026-11-24
- **Entscheid von:** Kopf

## Kontext

Randen kennt nur Deutsch (Schweiz) und prüft «du» und «ss» in jedem Textkatalog. In Reinigung, Bau, Umzug und Gastgewerbe sprechen viele Mitarbeitende eine andere Muttersprache; die Sozialpartner der Reinigung geben ihre Unterlagen auf Deutsch, Französisch, Italienisch, Portugiesisch, Spanisch und Tamil heraus (Recherche Facility). Mehrere Sprachen später in zehntausende Zeilen nachzurüsten, wäre ein grosser Umbau.

## Entscheid

1. **Struktur ab dem Fundament:** Je Paket ist `messages.ts` in de-CH die Quelle und legt die Schlüssel fest; Übersetzungen liegen daneben als `messages.<sprache>.ts` mit demselben Typ. Fehlt ein Schlüssel, gilt de-CH, und der Texttest listet die Lücke, ohne rot zu werden.
2. **Drei Achsen, getrennt gespeichert:** Sprache der Bedienung je Person auf dem Gerät; Sprache der Dokumente je Kundschaft (sonst die des Betriebs); getippte Daten werden nie übersetzt.
3. **Lexikon der Branche** nur für Wörter in Überschriften und Knöpfen (das Objekt heisst Liegenschaft, Baustelle, Garten oder Zimmer); ganze Sätze überschreibt die Branche in ihrem eigenen Katalog, wegen Artikeln und Fällen.
4. **Reihenfolge:** zuerst der Arbeitsplatz der Mitarbeitenden, schon vor dem ersten Pilot (Welle 2, Albans Wunsch vom 24.11.2026); das Büro bleibt de-CH bis nach dem Pilot; Romandie und Tessin später als ganze Sprache.
5. **Keine Übersetzung zur Laufzeit** über fremde Dienste. Übersetzt wird beim Bauen; eine Übersetzung gilt als Vorschau, bis eine Person mit dieser Muttersprache sie geprüft hat.
6. **Sicherheitshinweise nie nur übersetzt:** immer mit Bild oder Symbol; einfache Sprache vor Übersetzung.
7. **Regeln je Sprache:** de-CH wie heute (du, ss, keine Ausrufezeichen); für jede weitere Sprache eine Regeldatei, die der Texttest liest.
8. **Dokumente an Dritte** haben eigene Kataloge mit eigener Anrede (Vorschlag «Sie» oder ohne Anrede) und eigenem Test; die App selbst bleibt beim «du».
9. Formate (Geld, Datum, Zahlen) je Sprache aus `@onestrand/i18n` mit Region `-CH`; die Schreibweise in Romandie und Tessin wird vorher mit Quelle geprüft. Das Kit nutzt logische Abstände.

### Sprache ohne Zuschreibung (ergänzt am 24.11.2026)

Anlass: Der Klickentwurf zeigte für die Mitarbeiterin nur Portugiesisch. Alban, 24.11.2026: «Warum steht da Portugues ich finde es zwar bisschen rasistisch weil Viele portugiesen in dieser Branche arbeiten aber such gut weil ich an die Sprachen gar nicht gedacht habe … Ich würde gerne das sprachen Thema mitziehen». Eine einzelne Sprache im Bild einer Branche schreibt einer Gruppe eine Rolle zu. Darum:

10. **Die Person wählt.** Die Sprache der Bedienung stellt jede Person selbst ein, jederzeit, in jeder Ansicht erreichbar. Beim ersten Start schlägt die App die Sprache des Geräts vor. Die App schliesst nie aus Name, Herkunft, Nationalität, Ausweis, Rolle oder Branche auf eine Sprache; ein Test prüft, dass die Sprache nur aus der Einstellung der Person kommt.
11. **Keine Sprache gehört zu einer Branche.** Vorlagen, Demo-Daten und Bilder zeigen nie eine Sprache als «die Sprache» einer Branche oder Rolle. Demo-Personen haben keine zugeschriebene Herkunft; wer die Demo anschaut, wählt die Sprache selbst.
12. **Welche Sprachen, entscheiden Daten:** der Grundsatz Deutsch, Französisch, Italienisch, Englisch und Albanisch (Albanisch nach Albans Angabe vom 24.11.2026: «Albanisch ist auch ganz gross in diesem Bereich»); dazu die Sprachen, die Pilot-Teams angeben, und die Sprachen, in denen Behörden und Sozialpartner informieren (mit Quelle in [`../fakten/`](../fakten/README.md)). Nie eine Annahme über Gruppen als Grund.
13. **Gleiche Sorgfalt in jeder Sprache:** dieselben Funktionen, keine gekürzten Texte, ein Glossar der Fachwörter je Sprache; jede Übersetzung trägt bis zur Prüfung durch eine Person mit dieser Muttersprache den Vermerk «Vorschau».
14. **Einfache Sprache und Symbole** auf dem Arbeitsplatz der Mitarbeitenden für alle, auch auf Deutsch.

## Folgen

- Jeder Text, auch der Plattform, steht in einem Katalog; kein Text im rein-TS-Teil.
- Übersetzungen sind je Paket und Sprache eigene Dateien; viele Agenten können parallel übersetzen.

# ADR-0007: Sprachen

- **Status:** Entwurf; Inhalte und Anrede nach Albans Entscheid ([S-07](../entscheide.md))
- **Datum:** 2026-11-24
- **Entscheid von:** Kopf

## Kontext

Randen kennt nur Deutsch (Schweiz) und prüft «du» und «ss» in jedem Textkatalog. In Reinigung, Bau, Umzug und Gastgewerbe sprechen viele Mitarbeitende eine andere Muttersprache; die Sozialpartner der Reinigung geben ihre Unterlagen auf Deutsch, Französisch, Italienisch, Portugiesisch, Spanisch und Tamil heraus (Recherche Facility). Mehrere Sprachen später in zehntausende Zeilen nachzurüsten, wäre ein grosser Umbau.

## Entscheid

1. **Struktur ab dem Fundament:** Je Paket ist `messages.ts` in de-CH die Quelle und legt die Schlüssel fest; Übersetzungen liegen daneben als `messages.<sprache>.ts` mit demselben Typ. Fehlt ein Schlüssel, gilt de-CH, und der Texttest listet die Lücke, ohne rot zu werden.
2. **Drei Achsen, getrennt gespeichert:** Sprache der Bedienung je Person auf dem Gerät; Sprache der Dokumente je Kundschaft (sonst die des Betriebs); getippte Daten werden nie übersetzt.
3. **Lexikon der Branche** nur für Wörter in Überschriften und Knöpfen (das Objekt heisst Liegenschaft, Baustelle, Garten oder Zimmer); ganze Sätze überschreibt die Branche in ihrem eigenen Katalog, wegen Artikeln und Fällen.
4. **Reihenfolge:** zuerst der Arbeitsplatz der Mitarbeitenden in den Sprachen der Pilot-Teams; das Büro bleibt de-CH bis nach dem Pilot; Romandie und Tessin später als ganze Sprache.
5. **Keine Übersetzung zur Laufzeit** über fremde Dienste. Übersetzt wird beim Bauen; eine Übersetzung gilt als Vorschau, bis eine Person mit dieser Muttersprache sie geprüft hat.
6. **Sicherheitshinweise nie nur übersetzt:** immer mit Bild oder Symbol; einfache Sprache vor Übersetzung.
7. **Regeln je Sprache:** de-CH wie heute (du, ss, keine Ausrufezeichen); für jede weitere Sprache eine Regeldatei, die der Texttest liest.
8. **Dokumente an Dritte** haben eigene Kataloge mit eigener Anrede (Vorschlag «Sie» oder ohne Anrede) und eigenem Test; die App selbst bleibt beim «du».
9. Formate (Geld, Datum, Zahlen) je Sprache aus `@onestrand/i18n` mit Region `-CH`; die Schreibweise in Romandie und Tessin wird vorher mit Quelle geprüft. Das Kit nutzt logische Abstände.

## Folgen

- Jeder Text, auch der Plattform, steht in einem Katalog; kein Text im rein-TS-Teil.
- Übersetzungen sind je Paket und Sprache eigene Dateien; viele Agenten können parallel übersetzen.

# ADR-0004: Wie eine Branche andockt

- **Status:** Entwurf (wird mit Auftrag W0-02 gebaut und dann angenommen)
- **Datum:** 2026-11-24
- **Entscheid von:** Kopf

## Kontext

In Randen sind Schnittstelle, Use Cases, Tabellen, Routen und Navigation von Hand aufgezählt (`CONTRACT_V1`, `createUseCases`, `TABLE_SCHEMAS`, `routes.tsx`, `nav.ts`). Mit vielen Branchen und parallelen Agenten würden diese Listen zu Stellen, an denen alle kollidieren.

## Entscheid

1. **Zwei Manifeste je Branche:** `defineIndustry` im rein-TS-Teil (Tabellen, Schnittstelle, Use Cases, Register-Einträge, Betriebsarten, Fragen beim Einrichten, Vorlagen, Regelwerke, Migrationen, Demo) und `defineIndustryWeb` im React-Teil (Routen, Navigation, «＋ Erfassen», Karten in «Heute», Abschnitte auf Plattform-Seiten, Dokument-Stile, Arbeitsplätze je Rolle, Texte, Lexikon).
2. **Eine Ausgabe setzt zusammen:** `defineEdition` nennt Datenbankname, Präfix, Sicherungsformat, Marke, Haupt-Branchen und Module; die Plattform bildet daraus Schnittstelle (mit Prüfung auf Doppel), Use Cases mit Rechteprüfung, Tabellen, Dexie-Schema, Router, Navigation, Texte und Register. Die einzige Liste, die von Hand wächst, ist die Liste der Branchen einer Ausgabe; sie gehört dem Kopf.
3. **Steckplätze statt Eingriffe:** Eine Branche erscheint auf Plattform-Seiten (Kundschaft, Objekt, Auftrag, Einsatz, Rapport, Rechnung, Heute, Einrichten, Monatspaket) nur über Steckplätze.
4. **Namensräume:** Operationen `<branche>.<bereich>.<verb>`, Tabellen `<branche>_<name>`, Ereignisse `<branche>_<ding>.<was>`, Funktionen `<branche>.<name>`, Betriebsarten `<branche>.<art>`, Speicherschlüssel und Rechte mit Präfix. Neue Kennungen trägt nur der Kopf in `registry/names.json` ein.
5. **Erweitern ohne fremde Felder:** Eine Branche legt eigene Tabellen an, die auf Plattform-Kennungen zeigen. Sie fügt nie Felder in Tabellen der Plattform ein und nutzt kein freies Zusatzfeld. Plattform-Code liest locker und ändert nur seine eigenen Felder.
6. **Rechte prüft nur die Plattform:** Jede Operation erklärt Funktion und Stufe (nichts, sehen, bedienen, verwalten) und heikle Rechte; die Hülle um die Use Cases setzt sie durch.
7. **Regel der zwei:** Was eine zweite Branche braucht, wandert in die Plattform; die erste Branche markiert es als Kandidat, die zweite baut keine eigene Fassung.
8. **Konformität:** `pnpm check:industry <id>` prüft Vollständigkeit, Sprache, «ausgeschaltet ohne Spur», Sicherung hin und zurück, Filter fürs Handy, Importgrenzen und Nebenwirkungen.
9. **Referenz-Branche `muster`** nutzt jeden Steckplatz einmal und ist der lebende Vertragstest der Plattform; ein Generator (`pnpm industry:new <id>`) legt eine neue Branche nach ihrem Muster an.

## Was eine Branche nicht darf

- eine andere Branche importieren oder tiefe Pfade der Plattform;
- eigene Infrastruktur bauen (Speicher, Abgleich, Rechte, PDF-Kit, Sprachen);
- Kennungen ohne Eintrag im Namensregister verwenden;
- Text in den rein-TS-Teil schreiben.

## Folgen

- Parallele Branchen-Agenten berühren keine gemeinsame Datei ausser über den Kopf.
- Randen dockt nach seinem Umzug (R5) genauso an wie jede andere Branche.

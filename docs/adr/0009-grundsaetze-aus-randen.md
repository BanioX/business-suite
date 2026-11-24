# ADR-0009: Die Grundsätze von Randen gelten für jede Branche

- **Status:** angenommen
- **Datum:** 2026-11-24
- **Entscheid von:** Kopf, nach Albans Vorgaben für Randen

## Kontext

Randen hat über rund 30 ADRs und die Lektionen aus Rettich Grundsätze gefunden, die nicht an die Küche gebunden sind. Neue Branchen sollen sie nicht neu verhandeln.

## Entscheid

Für jede Branche und jede Ausgabe der Suite gelten, mit Verweis auf das ADR von Randen:

| Grundsatz | Randen-ADR |
| --- | --- |
| Drei Schichten: Logik ohne Browser, Daten, Präsentation; Äusseres nur über Ports | 0003 |
| Geld als Ganzzahl in Rappen, Stückpreise pro 1000 Basiseinheiten | 0004 |
| Contract-first: UI nur über Befehle und Abfragen, jede Änderung ein Ereignis | 0005 |
| Daten bleiben auf dem Gerät; Ausnahmen nur mit Albans JA und eigenem ADR | 0006 |
| Ledger für Mengen; berechnet statt gespeichert | 0007, 0008 |
| «du» in der App | 0010 |
| Keine Anbindungen an Partner; Datei-Import ist keine Anbindung | 0011 |
| Rechtliche Angaben nur mit Quelle, Richtwerte heissen Richtwerte | 0012 |
| Eine App für iPhone, iPad und Web, vier Ansichten | 0013 |
| Jeder Betrieb wählt seine Komplexität: Funktionen, Optionen, Umfang, Ansicht «Erweitert» | 0015, 0022 |
| Sicherung mit optionalem Passwort, Zurückholen mit Prüfung | 0017 |
| Drucken und Sichern über PDF und Teilen; Dokument-Ansicht vor dem Drucken | 0019, 0026 |
| Zurück durch das System, ohne zweite Bewegung | 0021 |
| Daten der Mitarbeitenden: Minimierung, Sichtbarkeit, Aufbewahrung, Verschlüsselung | 0030 |

Dazu die Regeln für Texte und Screens aus Randens `docs/regeln.md` (Abschnitte A bis C): Fachwort vor Kunstwort, Knöpfe als Verb, Titel als Sache, ehrlich bei Lücken, eine Bedeutung pro Farbe, eine Hauptaktion pro Seite, Ziele 44 px, Felder mindestens 16 px.

## Folgen

- Branchen-ADRs dürfen diese Grundsätze nur mit Albans Entscheid aufweichen.
- Wo ein Grundsatz für eine Branche ein eigenes Wort braucht (Farben der Ausgabe, Wörter der Branche), steht das im Steckbrief der Branche.

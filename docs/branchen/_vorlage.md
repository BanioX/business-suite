# Vorlage: Steckbrief einer Branche

Jeder Steckbrief hat diese Abschnitte in dieser Reihenfolge. Er ist die verbindliche Grundlage für den Branchen-Agenten; die ausführliche Recherche liegt daneben in `<id>-recherche.md`. Ruhig und genau, Tabellen statt Fliesstext, Recht nur mit Quelle, keine echten Namen, keine Preise der Suite, keine Software-Produkte.

```markdown
# <Branche>

- **Kennung im Code:** `<id>` (Präfix für Tabellen, Operationen, Funktionen; ADR-Präfix `<XXX>`)
- **Ausgabe:** <Gastro | Vor Ort | Haus | Studio> ([S-01](../entscheide.md))
- **Welle:** <W1 …> ([Fahrplan](../fahrplan.md))
- **Eignung:** <Note 1 bis 5> – <ein Satz>
- **Recherche:** [`<id>-recherche.md`](<id>-recherche.md) · **Auftrag:** [`../auftraege/branche-<id>.md`](../auftraege/branche-<id>.md)

## 1. Kurzbild
Wer, wie viele Betriebe und Beschäftigte (mit Quelle oder «nicht belegt»), typische Grösse, wer im Betrieb arbeitet, Sprachen, Anteil Aussendienst, Saison.

## 2. Teilbranchen und Betriebsarten
Tabelle: Betriebsart (Text), Kennung `<id>.<art>`, was sie tut, Startfunktionen beim Einrichten.

## 3. Alltag
Ein Tag, eine Woche, ein Monat, ein Jahr in Stichworten: vom ersten Kontakt bis zur bezahlten Rechnung, und die Verwaltung dahinter. Was heute auf Papier und im Chat läuft.

## 4. Schmerzen
Höchstens acht, nach Gewicht. Warum heute keine Software, was zum Wechsel bewegt.

## 5. Plattform-Module
Tabelle: P-Nummer und Modul (aus [`../plattform.md`](../plattform.md)), wofür, Einstellungen der Branche (Optionen, Vorlagen, Wörter), Muss/Soll/Kann.

## 6. Eigene Module der Branche
Je Modul: Name und Kennung, Zweck, Datenobjekte mit den wichtigsten Feldern (Tabellen `<id>_<name>`, Verweise auf Plattform-Kennungen), Abläufe, Rechenregeln mit Formel, Dokumente, Kennzahlen. Kandidaten für die Plattform (Regel der zwei) markiert.

## 7. Vorlagen
Leistungen mit Einheit (ohne Ansätze), Checklisten, Dokumente, Fragen beim Einrichten mit Vorschlag.

## 8. Rollen und Arbeitsplätze
Tabelle: Rollen-Vorlage, sieht und tut, sieht nie, Gerät, Startseite und Tab-Leiste.

## 9. Recht und Pflichten
Tabelle: Fakt, Wert (als Richtwert, wo änderbar), Quelle (URL), geprüft am. Was die App daraus macht (Erinnerung, Nachweis, Hinweis) und was sie nie tut (beurteilen).

## 10. Geräte und Abgleich
Wo gearbeitet wird, Netz, Geräte; Weg in Stufe 1 ohne JA (Papier, PDF), Weg nach JA (Kopplung, Päckli, [S-06](../entscheide.md)); was erst Stufe 2 löst. Was nie aufs Handy geht.

## 11. Wörter
Lexikon (Objekt heisst …, Einsatz heisst …) und Fachwörter der Branche für das Glossar.

## 12. MVP und Pakete
MVP in höchstens acht Punkten. Pakete B-1, B-2 … mit Ziel und Abnahme (sie stehen auch im Auftrag). Danach Welle 2 und 3. Bewusst nie.

## 13. Demo-Betrieb
Erfunden: Name «… Muster», Team mit Rollen, Kundschaft, Objekte, Aufträge, ein typischer Tag.

## 14. Risiken und offene Fragen
Tabelle: Risiko oder Frage, Folge, was hilft oder wer entscheidet (Verweis auf S-Nummer, falls Alban).

## 15. Absehbare Plattform-Anträge
Was die Branche von der Plattform braucht und dort noch fehlt.

## 16. Stand
Vom Branchen-Agenten nachgeführt: Paket, Stand, Datum.
```

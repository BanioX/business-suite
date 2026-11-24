# ADR-0005: Gemeinsames Datenmodell der Betriebe

- **Status:** Entwurf (Verträge entstehen in Welle 1 als «alpha»)
- **Datum:** 2026-11-24
- **Entscheid von:** Kopf

## Kontext

Neun der zehn untersuchten Branchengruppen arbeiten mit Kundschaft, Objekten, Aufträgen, Einsätzen, Rapporten und Rechnungen ([`../plattform.md`](../plattform.md), Übersicht). Randen hat davon nichts; es kennt Artikel, Rezepte und Lager. Ohne gemeinsames Modell baut jede Branche ihre eigene Kundschaft und Rechnung.

## Entscheid

1. **Die Plattform besitzt:** Betrieb, Person, Rollenprofil, Kundschaft mit Kontakten, Objekt (hierarchisch, mit Bereichen, Anlagen und Zugangshinweisen), Leistung und Material, Auftrag, Offerte, Nachtrag, Einsatz, Rapport, Abnahme mit Mängeln, Leistungsplan, Checkliste mit Durchgang, Rechnung, Zahlungseingang, Mahnung, Vertrag und Abo, Termin, Kurs und Teilnahme, Zeitbuchung, Abwesenheit, Beleg, Kassenbuch, Monatspaket, Material und Lagerbewegung, Fahrzeug und Gerät, Datei.
2. **Ledger statt Zustand** für Geld, Zeit, Bestand, Status von Aufträgen, Schlüssel und Mehrfachkarten: nur anfügen, Korrektur als neue Zeile, Zustand berechnet.
3. **Gesperrt, was Dritte unterschrieben oder erhalten haben:** Rapport nach Unterschrift, ausgestellte Offerte, ausgestellte Rechnung. Korrektur nur als Nachtrag, neue Fassung oder Gutschrift.
4. **Ein Schreiber je Nummernkreis:** Rechnungs- und Offertennummern und die Kasse vergibt genau ein Gerät, das Hauptgerät des Betriebs.
5. **Preisarten** eines Auftrags: Pauschal, Einheitspreis nach Ausmass, Regie (nach Aufwand), Kostendach. Die App zeigt, welche Regel des Obligationenrechts dazu gehört (nur mit Quelle), und beurteilt nie.
6. **Leistungswerte und Ansätze sind Daten des Betriebs:** Die Suite liefert Vorlagen ohne Ansätze und ohne lizenzierte Normtexte; jeder Wert ist ein Richtwert.
7. **Dateien** (Fotos, Belege, Unterschriften, PDF) liegen als Blob mit Prüfsumme in einer eigenen Tabelle, nie als Data-URL in einer Zeile.
8. **Mehrere Betriebe je Gerät:** Jede Zeile gehört einem Betrieb; das Gerät wechselt zwischen Betrieben (Randen W16, Punkt 4).
9. **Heikelkeit je Tabelle und Feld** (normal, intern, heikel) steuert Rechte, Filter beim Senden und was nie aufs Handy geht.
10. **Abgleich-Art je Tabelle** ab dem ersten Tag: Ledger, ein Schreiber, Gerät, berechnet ([ADR-0006](0006-geraete-und-abgleich.md)).

## Begründung

Die Grundsätze stammen aus Randen (ADR-0004, 0007, 0008) und haben sich dort bewährt; neu sind die Sperre nach Unterschrift und der eine Schreiber je Nummernkreis, weil Rechnungen und Rapporte Beweiswert haben und ohne Server kein zweites Gerät Nummern vergeben darf.

## Folgen

- Welle 1 beginnt mit einem PR nur aus Schemas und Namen (Vertrag «alpha») für Kundschaft, Objekt, Auftrag, Einsatz, Rapport und Checkliste.
- Randens Modell (Artikel, Charge, Rezept) bleibt Gastro; ein schlankes Material und Lager ohne Lebensmittel-Felder kommt als P-41.

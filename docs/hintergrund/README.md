# Hintergrund

Arbeitsgrundlagen vom 24.11.2026. **Nicht verbindlich:** Verbindlich sind [`../architektur.md`](../architektur.md), die [ADRs](../adr/README.md) und die [Entscheide](../entscheide.md). Wo diese Dateien davon abweichen, gilt die verbindliche Fassung.

| Datei | Was es ist |
| --- | --- |
| [`plattform-karte.md`](plattform-karte.md) | Karte des Randen-Codes (Stand Commit `a8d8e63`): welche Bausteine branchenneutral sind, was sie an die Gastronomie bindet, Aufwand der Herauslösung, Bauregeln R-1 bis R-12 für Randen, was aus Rettich taugt, Vorschlag der Paketstruktur. Grundlage für die Ernte ([`../randen.md`](../randen.md)) und für W0-01 bis W0-03 |
| [`entwurf-parallel.md`](entwurf-parallel.md) | Architektur-Entwurf aus der Linse «viele Agenten parallel»: Sammelstellen, Manifeste, Namensräume, Eigentum, Landen, Architekturtests |
| [`entwurf-risiko.md`](entwurf-risiko.md) | Architektur-Entwurf aus der Linse «Risiko und Migration»: rote Linien, Herkunft, Sicherung über Versionen, Weg für Randen, Familien von Branchen |
| [`entwurf-produkt.md`](entwurf-produkt.md) | Architektur-Entwurf aus der Linse «Produkt und Kundschaft»: neun Prüfsteine, Rückgrat, Ausgaben nach Arbeitsweise, Papier-Brücke, Einrichten in wenigen Minuten |

Die drei Entwürfe entstanden unabhängig voneinander und kamen im Kern zum selben Ergebnis: Monorepo für Plattform und neue Branchen, Randen vorerst eigenständig mit gestempelter Kopie, eine Plattform mit installierbaren Ausgaben, Abgleich als «Mappe runter, Befehle rauf». Sie unterschieden sich vor allem beim Schnitt der Ausgaben (je Branche, je Familie, je Arbeitsweise); die Empfehlung steht in [S-01](../entscheide.md).

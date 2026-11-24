# ADR-0002: Eine Plattform, Branchen als Pakete, Ausgaben als installierbare Apps

- **Status:** Entwurf, zur Bestätigung durch Alban ([S-01](../entscheide.md))
- **Datum:** 2026-11-24
- **Entscheid von:** Kopf, nach drei unabhängigen Entwürfen ([`../hintergrund/`](../hintergrund/README.md))
- **Ergänzt:** Randen-ADR-0020 (Suite der Firma), dessen Punkt 9 («kein gemeinsames Code-Paket») mit diesem ADR für die Suite aufgehoben wird

## Kontext

Alban, 24.11.2026: «Wir entwickeln die Business Suite als Dach Kopf wo sich dann die Branchen Anhängen. randen ist aktuell für Gastronomie. Andere werden für Facility etc.» Dazu W17 in Randen: Onestrand ist Firma und Dachmarke; Randen bleibt Gastro; weitere Branchen wie Facility und Hotels sollen folgen, auf einem gemeinsamen Technik-Stack. Zielgruppe sind Schweizer Kleinbetriebe, die bei der Digitalisierung zurückliegen.

Randen-ADR-0020 ging von getrennten Apps ohne gemeinsamen Code aus. Mit vielen Branchen hiesse das: jede Branche erfindet Kern, Rechte, Zeit, Rechnung und Abgleich neu, und die Kopien laufen auseinander (wie die Kopie aus Rettich, die heute niemand gleich hält).

Daten einer PWA hängen an ihrer Herkunft. Ein Betrieb kann darum nur in einer App leben. Gemischte Betriebe sind häufig: Hauswartung mit Reinigung und Garten, Umzug mit Endreinigung, Maler mit Gipser, Hotel mit Restaurant.

## Entscheid

1. **Plattform:** Alles, was mehr als eine Branche braucht, liegt in gemeinsamen Paketen `@onestrand/*` ohne ein Wort einer Branche ([`../plattform.md`](../plattform.md)).
2. **Branche:** Jede Branche ist ein Paket mit eigenen Abläufen, Tabellen, Vorlagen, Wörtern, Regelwerken und Demo, das an die Plattform andockt ([ADR-0004](0004-andocken-einer-branche.md)). Branchen kennen einander nicht.
3. **Ausgabe:** Eine installierbare App ist eine Ausgabe: Marke, Adresse, Datenbankname, Sicherungsformat, Haupt-Branchen und Vorschläge beim Einrichten. Sie ist Konfiguration, kein eigener Code.
4. **Jede Ausgabe kann jede Branche einschalten.** Die Haupt-Branche bestimmt Wörter, Vorschläge und Marke; Nachbar-Branchen sind beim Einrichten ausgeschaltet und lassen sich einschalten.
5. **Vorschlag: vier Ausgaben nach Arbeitsweise** (Arbeitstitel): Gastro (Randen), «Vor Ort», «Haus», «Studio» ([`../architektur.md`](../architektur.md), Abschnitt 2.3). Die Zahl der Ausgaben entscheidet Alban (S-01); die Architektur trägt jede Zahl.
6. **Onestrand ist Absender, die Ausgabe führt** (übernommen aus Randen-ADR-0020, Punkt 2 und 6): Die Firma steht unter «Über …», auf onestrand.ch und in rechtlichen Texten; nie direkte Links von einer Ausgabe in eine andere.
7. **Rettich gehört nicht zur Suite** und bekommt nichts aus ihr.

## Begründung

- Eine App für alle macht das Einrichten schwer, zwingt Randen zum Wechsel der Herkunft und lässt jeden Fehler alle Branchen zugleich treffen.
- Eine App je Branche zerreisst gemischte Betriebe in zwei Datenhaltungen.
- Ausgaben nach Arbeitsweise bündeln, was im Alltag zusammengehört (am Objekt arbeiten, Zimmer führen, Termine und Kurse, Küche), und halten die Zahl der Adressen klein, die vor einem Pilot feststehen müssen.

## Folgen

- Die Arbeit an Branchen hängt nicht vom Entscheid S-01 ab: Branchen-Pakete sind dieselben, egal wie viele Ausgaben es gibt.
- Randens Ausbau baut seine allgemeinen Teile plattformfähig ([`../randen.md`](../randen.md)).
- Die Plattform muss mehrere Branchen je Betrieb und mehrere Betriebe je Gerät tragen; Randen trägt heute einen Betrieb je Gerät.

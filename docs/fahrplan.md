# Fahrplan

In welcher Reihenfolge die Suite entsteht, was parallel geht und woran jede Welle gemessen wird. Stand 24.11.2026. Nichts davon ist gebaut. Die Pakete stehen in [`plattform.md`](plattform.md), die Branchen in [`branchen/`](branchen/README.md), die Aufträge zum Weitergeben in [`auftraege/`](auftraege/README.md).

## Grundsätze der Reihenfolge

1. **Rückgrat vor Breite.** Lieber eine Branche, die im Pilot hält, als sechs halbe. Was fast jede Branche als Muss braucht, kommt zuerst.
2. **Randen nicht stören.** Der Ausbau von Randen (Küchenmonitor, erste Kunden Imbiss, Dönerstand, Pizza, Kaffeebar) geht vor. Die Suite liest Randen nur und übernimmt fertige Teile einmal ([`randen.md`](randen.md)).
3. **Vertrag zuerst.** Ein Plattform-Paket beginnt mit Schemas und Namen als «alpha»; danach bauen Plattform und Branche parallel dagegen.
4. **Erste Kunden setzen die Reihenfolge der Branchen** (wie W7 bei Randen). Solange Alban keine nennt, gilt die Empfehlung unten ([S-09](entscheide.md)).
5. **Jede Welle endet mit einer Abnahme**, die ein Mensch am Gerät prüft, und mit Vorschaubildern für Alban.

## Überblick

```
          Plattform                                  Branchen (parallel)                 Randen-Spur
W0  ───── Fundament (1 Agent, nacheinander) ─────── Steckbriefe fertig (heute)         R0 nur lesen
W1  ───── Rechte · Kundschaft · Objekte · Katalog ─ Facility (Reinigung, Hauswartung)  R1 Kern als Kopie
          Aufträge · Pläne · Checklisten · Heute                                         R2 Register aus der Suite
W2  ───── Offerten und Rechnungen · Kasse und ───── Maler und Gipser · Umzug           R3 Zeit, Kasse, Dokumente
          Belege · Team und Zeit · Dokument-Ansicht  Pilot Facility                      als Plattform-Pakete
W3  ───── Kopplung und Abgleich · Material ──────── Gebäudehülle · Haustechnik, Holz   R3 Kopplung
          Fahrzeuge · Sprachen der Mitarbeitenden    Garten, Kaminfeger
W4  ───── Termine · Verträge und Abos · Kurse ───── Termine (Coiffeur …) · Fitness,    R4 UI-Kit, Shell, Marke
                                                     Kurse; Ausgabe «Studio»
W5  ───── (Steckplätze für Nachbar-Module) ──────── Beherbergung; Ausgabe «Haus»       R5 Umzug ins Monorepo
W6  ───── Dokumente fr-CH, it-CH ────────────────── Romandie, Tessin                   –
W7  ───── Stufe 2 nur nach Albans JA ────────────── Relais, Konten, Portale            –
```

## Welle 0: Fundament

**Ziel:** Ein leeres, grünes Monorepo, in dem eine Branche andocken kann, ohne einen eigenen Kern zu erfinden.

- **W0-00 Kopf (erledigt mit diesem Stand):** Plan, Architektur, ADR-Entwürfe, Steckbriefe aller Branchen, Fakten, Aufträge, Entscheide für Alban.
- **W0-01 Werkzeuge und Fundament** ([Auftrag](auftraege/w0-01-fundament.md)): pnpm-Monorepo, TypeScript strict, ESLint mit Importgrenzen, Vitest, Vite, Playwright mit axe, `pnpm check` mit `ALL=`, CI, Lizenzprüfung, Wächter für das öffentliche Repo, `LICENSE`; P-01 bis P-05, P-12, P-13 aus Randen herausgelöst (Kopie mit Herkunftsvermerk, Stand des Randen-Commits).
- **W0-02 Zusammensetzen** ([Auftrag](auftraege/w0-02-zusammensetzen.md)): `defineIndustry`, `defineIndustryWeb`, `defineEdition`, Tabellen-Register, `composeContract`, Steckplätze der Shell, Namensregister, Pfad-Eigentum, P-06 Register, P-07 Sprachen, P-08 UI-Kit neutral, P-09 Shell, P-10, P-11; Referenz-Branche `muster`; Ausgabe «Vor Ort» als leerer Rahmen mit Demo, nur als Vorschau.

**Abnahme:** `pnpm check` ist grün; die Referenz-Branche `muster` legt eine Tabelle, eine Operation, eine Seite, einen Eintrag in «Heute» und eine Funktion im Register an, ohne eine Datei der Plattform zu ändern; die Sicherung geht hin und zurück; zwei Betriebe auf einem Gerät sind getrennt; ein Text auf Portugiesisch erscheint, wo der Schlüssel übersetzt ist, sonst Deutsch.

**Parallel möglich:** Nein, W0-01 vor W0-02. Ein Agent nach dem andern. Daneben dürfen Fakten-Agenten Quellen nachprüfen (nur `docs/fakten/`).

## Welle 1: Auftragskern

**Ziel:** Eine Reinigung mit drei Objekten plant eine Woche, hakt ab, schreibt Rapporte mit Fotos und druckt den Reinigungsplan, auf einem Gerät.

- Plattform, parallel je ein Agent sobald die Verträge «alpha» sind: P-21 Rechte (Ernte aus Randen AP-2 oder Vertrag zuerst, je nach Stand), P-22 Kundschaft, P-23 Objekte, P-24 Katalog, P-25 Aufträge, Einsätze, Rapporte, P-26 Pläne, P-27 Checklisten, P-28 Kalender, P-32 Heute.
- Branche **Facility** ([Steckbrief](branchen/facility.md), [Auftrag](auftraege/branche-facility.md)): Leistungsverzeichnis, Reinigungsplan als Aushang, Schlüssel, Mängel, Wohnungsabnahme, Qualitätskontrolle.

**Abnahme:** wie oben; dazu ein Rapport ist nach der Unterschrift gesperrt, und ein Nachtrag bleibt sichtbar.

## Welle 2: Geld und Papier

**Ziel:** Von der Offerte bis zur bezahlten Rechnung ohne Anbindung: Offerte als PDF, Annahme, Rapporte, Rechnung mit QR-Zahlteil, Zahlungseingang aus der Bankdatei, Mahnung.

- Plattform: P-29 Offerten und Rechnungen, P-30 Kasse und Belege (Ernte Randen AP-16), P-31 Team und Zeit (Ernte Randen AP-3 bis AP-6), P-11 Dokument-Ansicht (Ernte Randen AP-15).
- Branchen parallel: **Maler und Gipser** (Besichtigung mit Ausmass, Offerte nach Positionen, Regie, Farbbuch, Abnahme) und **Umzug und Räumung** (Umzugsgutliste mit Volumen, Einsatzplan mit Fahrzeugen und Halteverbot, Schäden, Entsorgung).
- **Pilot Facility** mit einem Betrieb von 1 bis 10 Personen, sobald Rechnung und Zeit stehen, nach Albans Freigabe von Adresse und Name ([S-04](entscheide.md), [S-05](entscheide.md)).

**Abnahme:** Eine Rechnung mit QR-Zahlteil wird von einer Banking-App gelesen (Test durch den Betrieb mit kleinem Betrag); eine Bankdatei mit drei Zahlungen ordnet drei Rechnungen zu; ein Monatspaket geht als ZIP an die Treuhand.

## Welle 3: Team im Feld

**Ziel:** Ein Handy holt morgens im Werkhof die Mappe und bringt abends Rapporte, Stunden und Fotos zurück; doppelt senden ändert nichts.

- Plattform: P-40 Kopplung und Abgleich (Ernte Randen AP-19 und Vermittler W15; Ausweitung nur nach Albans JA, [S-06](entscheide.md)), P-41 Material und Lager, P-42 Fahrzeuge und Geräte, Arbeitsplatz der Mitarbeitenden in den Pilot-Sprachen ([S-07](entscheide.md)).
- Branchen parallel: **Gebäudehülle** (Dachaufnahme, Ausmass mit Neigung, Wetterentscheid, Sicherheit in der Höhe, Asbest-Ablauf), **Haustechnik und Holz** (Service- und Wartungsaufträge, Anlagen beim Objekt, Pikett, Werkstatt), **Garten, Kaminfeger, Schädlingsbekämpfung** (Pflegeabo, Touren, Pflicht-Dokumentation).

## Welle 4: Termine und Kurse

**Ziel:** Ein Coiffeur und ein kleines Fitnesscenter arbeiten einen Tag mit Terminen, Check-in, Theke und Tagesabschluss auf dem iPad am Empfang.

- Plattform: P-50 Termine, P-51 Verträge und Abos (auch für Hauswartung, Wartungsverträge, Gartenpflege), P-52 Kurse mit Plätzen.
- Branchen parallel: **Termine** (Coiffeur, Kosmetik, Fusspflege, Massage, Hundesalon) und **Kurse und Fitness** (Mitgliedschaften, Mehrfachkarten, Kursplan, Check-in); Ausgabe «Studio».

## Welle 5: Haus

**Ziel:** Ein kleines Hotel führt Zimmerstatus, Housekeeping, Gästemeldung und Abgaben; mit Restaurant nimmt die Ausgabe «Haus» Module der Gastro mit, ohne sie zu kopieren.

- Branche **Beherbergung** ([Steckbrief](branchen/beherbergung.md)); Housekeeping nutzt Pläne und Checklisten aus Facility-Mustern über die Plattform.
- Voraussetzung für das Hotel mit Restaurant: Randen ist ins Monorepo gezogen (R5) oder seine Module sind als Paket verfügbar. Ein Hotel ohne Restaurant geht früher.

## Welle 6 und 7

- **W6 Romandie und Tessin:** Dokumente und Bedienung in fr-CH und it-CH, Fakten je Kanton, Regelwerke der Westschweiz (etwa GAV der Romandie).
- **W7 Stufe 2** nur nach Albans JA: Relais, Konten mit Passkeys, Mitteilungen, Seiten für Kundschaft und Mitglieder, mehrere Standorte.

## Randen-Spur (quer über alle Wellen)

| Schritt | Wann | Was |
| --- | --- | --- |
| R0 | jetzt | In Randen ändert sich nichts. Die Randen-Sitzung bekommt über Alban die Bauregeln aus [`randen.md`](randen.md), damit ihre nächsten Pakete plattformfähig entstehen |
| R1 | nach W0 | Randen bekommt `@onestrand/core` als gestempelte Kopie; seine fünf aus Rettich kopierten Kerndateien zeigen darauf, ohne Datenänderung |
| R2 | an Stelle von AP-1 oder direkt danach | Die Mechanik des Registers kommt aus `@onestrand/features`; Katalog-Einträge bleiben in Randen |
| R3 | entlang von Randens Plan | AP-2 Rechte, AP-3 bis AP-6 Zeit, AP-8 Erinnerungen, AP-15 Dokument-Ansicht, AP-16 Kasse, AP-19 Kopplung entstehen plattformfähig; die Suite übernimmt jedes Paket einmal und ist danach die Quelle |
| R4 | nach dem ersten Gastro-Pilot | UI-Kit und Shell aus der Plattform, Rotwein, Traube und Kork als Thema |
| R5 | auf Albans Wort, nach einem stabilen Pilot | Randen zieht mit Geschichte nach `industries/gastro` und `editions/gastro`; Projekt, Datenbank, Präfix und Sicherungsformat bleiben `randen` |

## Wie viele Agenten gleichzeitig

| Welle | Plattform-Agenten | Branchen-Agenten | Hinweis |
| --- | --- | --- | --- |
| W0 | 1 | 0 | nacheinander; die Grundlage muss aus einem Guss sein |
| W1 | bis 4 | 1 (Facility) | Verträge zuerst, dann parallel |
| W2 | bis 3 | 2 | Pilot Facility läuft daneben |
| W3 | bis 3 | 3 | |
| W4 | bis 3 | 2 | |
| W5 | 1 | 1 | |

Mehr Agenten machen es nicht schneller, wenn sie dieselben Dateien brauchen. Der Kopf führt die Sammelstellen (Namensregister, Schema-Ledger, ADR-Nummern) und führt Plattform-PRs zusammen.

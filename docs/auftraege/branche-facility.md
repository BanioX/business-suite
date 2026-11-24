# Branche Facility: Gebäudereinigung, Hauswartung und Facility

- **Rolle:** Branchen-Agent
- **Voraussetzung:** [W0-01](w0-01-fundament.md), [W0-02](w0-02-zusammensetzen.md), [W0-03](w0-03-oberflaeche.md) und [W1-00](w1-auftragskern.md#w1-00) fertig (Verträge des Auftragskerns «alpha»); je Paket die Plattform-Pakete aus der Tabelle unten
- **Welle:** W1 (B-1 bis B-6), W2 (B-7 bis B-12; Pilot nach B-8)
- **Kennung:** `facility`, Betriebsarten `facility.cleaning`, `facility.special_cleaning`, `facility.caretaking`, `facility.grounds_winter`; ADR-Präfix `FAC`

## Ziel

Ein Reinigungs- und Hauswartungsbetrieb mit 3 bis 10 Personen führt seine Objekte, Leistungsverzeichnisse, Einsätze, Rapporte, Schlüssel und Mängelmeldungen auf einem Gerät ohne Netz, druckt Aushang, Wochenplan und Rapporte, bereitet den Lohn nach GAV für die Treuhand vor und stellt die Monatsrechnung mit QR-Zahlteil aus. Damit ist der Pilot der ersten Aussendienst-Branche möglich, und die Plattform ist an einem echten Betrieb geprüft. Verbindlich ist der [Steckbrief](../branchen/facility.md).

## Lesestoff

1. `CLAUDE.md`, `AGENTS.md`, [`../zusammenarbeit.md`](../zusammenarbeit.md) (Rollen, Pfade, Plattform-Antrag, Landen, Stopp-Regeln).
2. **Steckbrief** [`../branchen/facility.md`](../branchen/facility.md), ganz. Er ist verbindlich.
3. Recherche [`../branchen/facility-recherche.md`](../branchen/facility-recherche.md): Hintergrund, Wortlaut der Vorlagen, Quellen; nicht verbindlich.
4. Fakten: [`../fakten/README.md`](../fakten/README.md) und die Dateien dort, sobald vorhanden; Abschnitt 9 des Steckbriefs.
5. [`../architektur.md`](../architektur.md), Abschnitte 4 bis 7; [`../plattform.md`](../plattform.md); [`../entscheide.md`](../entscheide.md), vor allem S-06, S-07, S-09, S-11, S-15, S-17.
6. ADRs [0004](../adr/0004-andocken-einer-branche.md), [0005](../adr/0005-gemeinsames-datenmodell.md), [0006](../adr/0006-geraete-und-abgleich.md), [0007](../adr/0007-sprachen.md), [0009](../adr/0009-grundsaetze-aus-randen.md), [0010](../adr/0010-rechnungen-als-vorsystem.md), [0011](../adr/0011-oeffentliches-repo.md).
7. Je genutztes Plattform-Paket `platform/<paket>/api.md`; die Referenz-Branche `industries/muster/` als Vorbild für jeden Steckplatz.
8. Randen (`BanioX/Randen`, nur lesen, nur als Muster): `AGENTS.md`, `docs/regeln.md`, `docs/design.md`, `docs/lernbuch.md`; Selbstkontrolle (Muster für Checklisten), «Wo ist was?», `createStockLedger` (Muster für das Schlüssel-Ledger). Nichts kopieren, was die Plattform schon hat oder gerade baut.

## Pfade

- **Schreiben:** `industries/facility/` (`core/` rein TS, `web/` React, `NAMES.md`); `docs/branchen/facility.md` (Abschnitt 9 Spalte «Stand», Abschnitt 16 «Stand», Details innerhalb des Steckbriefs mit FAC-ADR); `docs/branchen/facility/adr/FAC-NNNN-<titel>.md`; `docs/branchen/facility/antraege.md` (Plattform-Anträge); `docs/branchen/facility/fakten.md` (Wortlaut und Prüfdatum der Fakten, falls Abschnitt 9 zu eng wird); `docs/branchen/facility/schulden.md` und `lernbuch.md` der Branche.
- **Nur lesen:** `platform/`, `editions/`, `registry/`, `tools/`, `industries/muster/`, der Rest von `docs/`, `BanioX/Randen`.
- **Tabu:** `platform/`, `editions/`, `registry/` (neue Kennungen nur als Vorschlag in `industries/facility/NAMES.md`; der Kopf trägt ein), `tools/`, Wurzel-Konfiguration, `pnpm-lock.yaml` und neue fremde Abhängigkeiten (nur per Plattform-Antrag), andere `industries/<id>/`, `docs/` ausserhalb von `docs/branchen/facility*`, `BanioX/Randen`, `BanioX/Rettich`. Einträge für Glossar, Nebenwirkungen und Schulden der Suite gehen als Vorschlag in den Bericht.

## Plattform je Paket

B-1 bis B-6 beginnen, sobald W1-00 die Verträge «alpha» geliefert hat. Was ein Plattform-Paket noch nicht liefert, läuft hinter einem Port mit einfacher Umsetzung in der Branche, die ersetzt wird, sobald das Paket landet ([Zusammenarbeit](../zusammenarbeit.md), Abschnitt 5). Abgenommen ist ein Paket erst gegen das echte Plattform-Paket.

| Paket | Braucht (Auftrag, Welle) |
| --- | --- |
| B-1 Gerüst und Einrichten | P-06, P-07, P-20 (W0-02); P-08, P-09, P-32 (W0-03); P-21 (W1-01) |
| B-2 Objekte und Leistungsverzeichnis | P-22, P-23 (W1-02); P-24 (W1-03); P-26 (W1-05); P-33 (W1-06); P-11 (W0-03) |
| B-3 Einsatzplan und Ersatz | P-25 (W1-04); P-26 (W1-05); P-28 (W1-06); P-11 |
| B-4 Rapport und Monatsrapport | P-25 (W1-04); P-27 (W1-05); P-33 (W1-06); P-10 Unterschrift und Kamera, P-11 (W0-03) |
| B-5 Schlüssel | P-04 (W0-01); P-21 (W1-01); P-28, P-33 (W1-06); P-10 |
| B-6 Mängelmeldungen und Hauswartung | P-22, P-23 (W1-02); P-25 (W1-04); P-26, P-27 (W1-05); P-28, P-33 (W1-06); P-10 Teilen |
| B-7 Zeit, Soll gegen Ist, Lohn-Vorbereitung | P-31 (W2); P-11 Dokument-Ansicht (W2); Antrag 6 |
| B-8 Monatsrechnung | P-29 (W2); P-51 Kern (W4, Antrag 1) oder Port `RecurringBillingSource` |
| B-9 Endreinigung und Wohnungsabnahme | P-25, P-27 (W1); P-29 (W2) |
| B-10 Qualitätskontrolle | P-25, P-27 (W1); P-11 |
| B-11 Winterdienst | P-25, P-26, P-28, P-33 (W1); P-31 (W2) |
| B-12 Offerte mit Deckungsbeitrag | P-24 (W1); P-29, P-31 (W2); Regelwerk aus B-7 |

## Schritte

Für jedes Paket: `api.md` der Plattform lesen › fehlt etwas, Plattform-Antrag in `docs/branchen/facility/antraege.md` und Port › bauen in `industries/facility/` › Tests › `pnpm check` und `pnpm check:industry facility` › landen nach [Zusammenarbeit](../zusammenarbeit.md), Abschnitt 6, mit den Trailern `Order: branche-facility` und `Role: industry:facility` › Stand im Steckbrief (Abschnitt 16) und hier nachführen › Bericht. Ein Paket, ein Thema, wenige Pushes.

### B-1 Gerüst und Einrichten (W1)

- **Ziel:** Die Branche dockt an, lässt sich einrichten und schalten, ohne eine Datei der Plattform zu ändern.
- **Umfang:** Gerüst mit `pnpm industry:new facility`; `defineIndustry` und `defineIndustryWeb`; vier Betriebsarten mit Mehrfachwahl; Fragen beim Einrichten (Steckbrief, Abschnitt 7); Funktionen `facility.specs`, `facility.keys`, `facility.defects`, `facility.handovers`, `facility.quality`, `facility.winter`, `facility.costing` mit Abhängigkeiten; Rollen-Vorlage Hauswart:in und Ergänzungen der Plattform-Vorlagen (Abschnitt 8); Lexikon (Abschnitt 11); Texte de-CH; Demo-Grundgerüst (Betrieb, Team, Kundschaft, Objekte; Abschnitt 13); `NAMES.md` mit allen Kennungen; FAC-0001 «Was Plattform ist und was Branche» nach Abschnitt 6.
- **Abnahme:**
  - [ ] `pnpm check` mit `ALL=GREEN`, `pnpm check:industry facility` grün.
  - [ ] Einrichten mit «Hauswartung im Auftrag» und «allein» schaltet `facility.defects` und `facility.keys` ein und Team und Zeit aus; mit «Unterhaltsreinigung» und «6 bis 9» schaltet es `facility.specs` und Team und Zeit ein (Test).
  - [ ] Eine ausgeschaltete Funktion hat keine Einstiege; ihre Daten bleiben (Konformitätstest).
  - [ ] Die Vorschau der Rolle «Mitarbeitende» zeigt keine Ansätze, Löhne, Rechnungen und keine Kundschaft.
  - [ ] Texttest: «du», «ss», keine Ausrufezeichen; bei Hauswartung heisst das Objekt «Liegenschaft».
  - [ ] Demo lädt mit 9 Personen mit Vogelnamen und der Adresse Musterweg 12, 8000 Beispielstadt; der Wächter findet keinen echten Namen.

### B-2 Objekte und Leistungsverzeichnis (W1)

- **Ziel:** Je Objekt Bereiche, Flächen und ein Leistungsverzeichnis mit Intervallen, das Soll-Zeit rechnet und als Vertragsbeilage und Aushang gedruckt wird.
- **Umfang:** Tabellen `facility_area_details`, `facility_spec_versions`, `facility_service_pictograms` (Steckbrief 6.1); Leistungsvorlagen ohne Ansätze; Rechenregeln Soll-Zeit; Fassung ausstellen und sperren; Leistungsverzeichnis und Aushang als PDF; Piktogramme als eigene SVG; Abschnitte auf der Objekt-Seite über Steckplätze.
- **Abnahme:**
  - [ ] Unit-Test: das Beispiel aus 6.1 ergibt 887 Minuten pro Monat; «300 m² pro Stunde» wird als `secondsPer1000 = 12000` gespeichert.
  - [ ] Ohne Leistungswert zeigt die App «Leistungswert fehlt», nie 0.
  - [ ] Eine ausgestellte Fassung lässt sich nicht ändern; eine Änderung erzeugt Fassung 2 mit `validFrom`, Fassung 1 bleibt lesbar (Test).
  - [ ] Aushang als PDF A4 mit Piktogrammen und Wochentagen je Bereich; das Leistungsverzeichnis zeigt Fassung und Gültigkeit.
  - [ ] Kein Feld in einer Plattform-Tabelle (Konformität); Sicherung hin und zurück mit den drei Tabellen.

### B-3 Einsatzplan und Ersatz (W1)

- **Ziel:** Aus den Intervallen entsteht der Plan einer Woche je Person; bei Absenz schlägt die App Ersatz vor.
- **Umfang:** `facility_staff_skills`; Fälligkeit, Ersatz-Vorschlag und Hinweise (Steckbrief 6.2); Wochenplan je Person als Streifen-PDF mit QR je Einsatz; Tagesplan der Equipe; Kalenderdatei; Karte in «Heute» für Einsätze ohne Person. QR im PDF aus der Plattform; fehlt das, Plattform-Antrag.
- **Abnahme:**
  - [ ] Ein Plan «Treppenhaus jeden Mittwoch, Fenster quartalsweise» erzeugt über vier Wochen die richtigen Einsätze; ein kantonaler Feiertag am Mittwoch folgt der Regel aus P-26 und ist im Plan sichtbar (Test mit fester Uhr).
  - [ ] Die Quartalsleistung erscheint im Fenster «diese Woche».
  - [ ] Bei Absenz von Star nennt der Vorschlag zuerst die verfügbare Person mit passender Fähigkeit und Objektkenntnis (Demo-Daten); zuteilen tut die Person.
  - [ ] Ein Einsatz von 22:30 bis 23:30 zeigt den Hinweis zur Nachtarbeit mit Quelle und wird nicht verhindert.
  - [ ] Der QR im Wochenplan enthält weder Adresse noch Namen der Kundschaft (Test).

### B-4 Rapport und Monatsrapport (W1)

- **Ziel:** Nachweis je Einsatz mit Fotos und Unterschrift, auch vom Papier nacherfasst, und ein Monatsrapport je Objekt für die Kundschaft. Erfüllt die Abnahme der Welle 1.
- **Umfang:** Schritte aus dem Leistungsverzeichnis, Überspringen mit Grund, Fotos mit Hinweis «nur den Auftrag fotografieren», Zusatzaufwand mit «angeordnet von» als Regie, Unterschrift und Sperre (P-25); Papier-Rapport als PDF mit Objekt-QR; Nacherfassen mit Foto des Blatts; Monatsrapport, Regierapport, Hauswartrapport (Steckbrief 6.3); Checkliste «Sicherheit beim Einsatzbeginn».
- **Abnahme:**
  - [ ] Eine Reinigung mit drei Objekten plant eine Woche, hakt ab, schreibt Rapporte mit Fotos und Unterschrift und druckt den Aushang, auf einem Gerät ohne Netz (E2E).
  - [ ] Nach der Unterschrift lehnt der Rapport jede Änderung ab; ein Nachtrag bleibt sichtbar (Test).
  - [ ] Eine übersprungene Leistung ohne Grund lässt sich nicht abschliessen.
  - [ ] Zusatzaufwand steht getrennt als Regie mit «angeordnet von».
  - [ ] Kamera nur nach Tipp; bei verweigerter Kamera geht der Datei-Upload (E2E).
  - [ ] Ein nacherfasster Rapport trägt das Foto des Blatts und die Markierung «nacherfasst»; Monatsrapport je Objekt als PDF mit Fotos.

### B-5 Schlüssel (W1)

- **Ziel:** Jeder Schlüssel ist erfasst; Ausgabe und Rückgabe sind lückenlos und quittiert.
- **Umfang:** `facility_keys`, `facility_key_moves` (Steckbrief 6.4); Operationen `facility.keys.register`, `facility.keys.issue`, `facility.keys.return`, `facility.keys.report_lost`, `facility.keys.return_to_customer`, `facility.keys.correct`; heikles Recht `facility.keys.assign`; Schlüsselquittung und Schlüsselliste als PDF; Erinnerung «überfällig»; Karte «Schlüssel ausser Haus».
- **Abnahme:**
  - [ ] Demo: 23 Schlüssel und 4 Badges, 6 ausser Haus, einer überfällig; die Liste stimmt.
  - [ ] Eigenschaftstest: beliebige Folgen von Bewegungen ergeben nie einen negativen Bestand; eine Korrektur ist eine neue Zeile.
  - [ ] Schema-Test: keine Tabelle der Branche hat ein Feld für Tür- oder Alarmcodes.
  - [ ] Ohne `facility.keys.assign` zeigt die App Nummer und Fach, nie das Objekt.
  - [ ] Ausgabe mit Unterschrift erzeugt eine Schlüsselquittung; ein Verlust erzeugt eine Erinnerung und den Entwurf einer Meldung, ohne etwas zu senden.

### B-6 Mängelmeldungen und Hauswartung (W1)

- **Ziel:** Befunde am Gebäude gehen mit Foto an die Verwaltung und werden bis «erledigt» verfolgt; Kontrollgang und Aufgabenkalender der Hauswartung laufen nach Plan.
- **Umfang:** `facility_defect_reports`, `facility_defect_events`, `facility_site_terms` (Steckbrief 6.5); Vorlagen Kontrollgang und Aufgabenkalender (Kontrollgang wöchentlich, Abfallkalender von Hand, Saisonarbeiten); Mängelmeldung als PDF über das Teilen-Menü; Liste offener Mängel; Kompetenzlimite; Kleinreparatur als Einsatz mit Regie.
- **Abnahme:**
  - [ ] Ein Kontrollgang mit zwei Befunden «nicht in Ordnung» erzeugt zwei Mängelmeldungen mit Foto und Ort.
  - [ ] Senden über das Teilen-Menü legt `sent` mit dem PDF an; ohne Tipp der Person verlässt nichts das Gerät.
  - [ ] Eine Kleinreparatur über der Kompetenzlimite verlangt zuerst `ordered` (Test).
  - [ ] Die Regieminuten der Kleinreparatur erscheinen im Rapport des Einsatzes.
  - [ ] Ein Abfallkalender mit von Hand eingetragenen Dienstagen erzeugt Aufgaben; die Liste offener Mängel zeigt das Alter in Tagen.

### B-7 Zeit, Soll gegen Ist, Lohn-Vorbereitung (W2)

- **Ziel:** Stunden je Objekt, Wegzeit, Abweichung von der Offerte und eine Lohn-Vorbereitung nach GAV Reinigung Deutschschweiz als Datei für die Treuhand.
- **Vorher:** Feiertagssatz je Kategorie, Vollzugskostenbeitrag, Nacht- und Sonntagszuschlag und Dauer der AVE im GAV-Text belegen und in Abschnitt 9 des Steckbriefs mit Datum eintragen. Was nicht belegt ist, bleibt im Regelwerk leer.
- **Umfang:** Regelwerke `facility.gav_cleaning_dch` (2026 und 2028) und `facility.labour_law_only` als Daten mit Quelle und Gültigkeit (Steckbrief 6.9); Option `facility.travel_time`; Soll gegen Ist (6.3); Hinweise Nichtberufsunfall und Quellensteuer; Monatsblatt; Lohn-Vorbereitung als CSV und PDF; Erinnerung zum Jahreswechsel.
- **Abnahme:**
  - [ ] Stempeln am Hauptgerät per Objekt-QR; der Wächter findet keinen Zugriff auf den Standort.
  - [ ] Wegzeit zwischen zwei Objekten steht als eigene Zeile; die Option `none` blendet sie aus, ohne Daten zu löschen.
  - [ ] Demo Büro Muster AG: Soll 887, Ist 1'020 Minuten, Abweichung +15,0 %, rot (Test).
  - [ ] Lohn-Vollkosten Unterhalt I 2026 = 2546 Rappen brutto (Test), sobald der Feiertagssatz für Unterhalt belegt ist; bis dahin «Satz fehlt».
  - [ ] Ein Satz ohne Quelle erscheint als «Satz fehlt», nie als Zahl; jeder Satz zeigt Quelle und «Richtwert».
  - [ ] Das Monatsblatt einer Person mit Wochen unter 8 Stunden zeigt den Hinweis zum Nichtberufsunfall mit Quelle.
  - [ ] Kein Lohnbetrag in einer Ansicht ohne das Recht «Löhne».

### B-8 Monatsrechnung (W2)

- **Ziel:** Monatsrechnung je Objekt oder Kundschaft mit Pauschale und Regie, mit QR-Zahlteil. Danach ist das MVP fertig und der Pilot möglich.
- **Umfang:** Pauschale je Objekt über P-51 oder den Port `RecurringBillingSource`; Regie aus gesperrten Rapporten; Sammelrechnung oder je Objekt; Einzelrechnung Endreinigung; MWST nach Methode des Betriebs; Textbausteine; Karte «Regie noch nicht verrechnet».
- **Abnahme:**
  - [ ] Rechnung November für Büro Muster AG: Pauschale 980.00 plus 30 Minuten Regie zum Ansatz des Betriebs, QR-Zahlteil aus P-29 (Test).
  - [ ] Jede Regiezeile wird genau einmal verrechnet; ein zweiter Lauf findet sie nicht mehr.
  - [ ] Fehlt ein Ansatz, sagt die App «Ansatz fehlt» und stellt nicht aus.
  - [ ] Eine ausgestellte Rechnung ist gesperrt; Korrektur nur als Gutschrift.
  - [ ] Ein Demo-Monat vom Plan bis zur Rechnung läuft als E2E in vier Ansichten; Vorschaubilder gehen an Alban.

### B-9 Endreinigung und Wohnungsabnahme (W2)

- **Ziel:** Offerte für Endreinigungen in Minuten und ein Abnahmeprotokoll, das als Mängelrüge taugt, ohne dass die App Haftung zuordnet.
- **Umfang:** `facility_handovers`, `facility_handover_findings` (Steckbrief 6.6); Vorlagen je Zimmerzahl; Offerte Endreinigung; Abnahmeprotokoll und Übergabebestätigung als PDF; Nachreinigung über P-25.
- **Abnahme:**
  - [ ] Offerte 4½ Zimmer mit Zusätzen aus dem Katalog; fehlt ein Preis, nennt die App ihn.
  - [ ] Protokoll Raum für Raum mit Zählerständen, Schlüsselanzahl und Unterschriften; danach gesperrt, Nachtrag als neue Zeile.
  - [ ] Ein Befund ohne Beschreibung lässt sich nicht speichern; für die Zuordnung zu Mieter- oder Vermieterschaft gibt es keinen Vorschlag.
  - [ ] Nachreinigung als Mangel mit Frist am selben Tag.

### B-10 Qualitätskontrolle (W2)

- **Ziel:** Kontrolle mit Stichprobe, Nachbesserung und Bericht für die Kundschaft.
- **Umfang:** `facility_quality_audits` (Steckbrief 6.7), Vorlage «Qualität je Raum», Kontrollbericht, Nachbesserungsauftrag.
- **Abnahme:**
  - [ ] 24 Elemente mit 2 Mängeln ergeben 916 ‰ (Test); der Wert ist nirgends gespeichert.
  - [ ] Unter der Grenze des Betriebs entsteht ein Nachbesserungsauftrag als Einsatz.
  - [ ] `sharedOn` wird erst nach dem Tipp «Mit Kundschaft teilen» gesetzt.

### B-11 Winterdienst (W2)

- **Ziel:** Pikett und ein Journal, das zeigt, wann wo geräumt und gestreut wurde.
- **Umfang:** `facility_winter_duties`, `facility_winter_runs`, `facility_winter_entries` (Steckbrief 6.8); Saison im Betriebskalender; Journal je Liegenschaft und Saison; Pikettplan.
- **Abnahme:**
  - [ ] Ein Einsatz mit drei Liegenschaften, je Zeit, Handlung, Streumittel in Gramm und Foto, ergibt das Journal als PDF.
  - [ ] Die Saison ist ein änderbarer Richtwert; es gibt keine Wetterdaten aus dem Netz.
  - [ ] Stunden zwischen 23 und 6 Uhr und am Sonntag sind markiert; ein Zuschlag erscheint nur mit belegtem Satz.

### B-12 Offerte mit Deckungsbeitrag (W2)

- **Ziel:** Nach der Besichtigung eine nachvollziehbare Offerte aus dem Leistungsverzeichnis, mit Deckungsbeitrag für die Inhaber:in und Nachkalkulation nach drei Monaten.
- **Umfang:** Rechenregeln Steckbrief 6.9; Offerte mit Leistungsverzeichnis als Beilage; Nachkalkulation offeriert gegen Ist.
- **Abnahme:**
  - [ ] Preis und Deckungsbeitrag nach den Formeln 6.9 mit festen Werten (Test).
  - [ ] Den Deckungsbeitrag sieht nur, wer das Recht «Zahlen und Margen» hat; er erscheint auf keinem Aussendienst-Gerät und in keinem Dokument an Dritte.
  - [ ] Fehlt ein Wert, nennt die App ihn; die ausgestellte Offerte ist gesperrt.

## Abnahme

- [ ] Alle Pakete B-1 bis B-12 mit ihrer Abnahme erfüllt, je nur in den eigenen Pfaden geändert.
- [ ] `pnpm check` mit `ALL=GREEN` und `pnpm check:industry facility` grün auf `main`.
- [ ] Keine Rechtsregel ohne bestätigte Quelle in der App; jeder Satz als «Richtwert» sichtbar.
- [ ] Keine Ortung, keine Codes, keine Ausweisdaten; nichts verlässt das Gerät ohne Tipp der Person.
- [ ] Steckbrief, Abschnitte 9 und 16, nachgeführt; Plattform-Anträge in `docs/branchen/facility/antraege.md`.

## Testweg

- `pnpm install && pnpm check` bis `ALL=GREEN`; `pnpm check:industry facility`.
- Unit-Tests für jede Rechenregel mit den Beispielen des Steckbriefs (887 Minuten, 916 ‰, 2546 Rappen, +15,0 %); Eigenschaftstests für die Ledger (Schlüssel, Mängelmeldungen, Winterdienst).
- E2E mit Playwright und axe in vier Ansichten (iPhone, iPad hochkant, iPad quer, Web), hell und dunkel, offline, mit verweigerter Kamera.
- Demo-Betrieb laden und den Tag aus Abschnitt 13 des Steckbriefs durchspielen.
- Vorschaubilder mit dem Werkzeug der Suite (Muster `pnpm preview:shots <route …>` aus Randen) für jede sichtbare Änderung, mit `sheet.png` an Alban; jedes neue Dokument einmal als PDF erzeugen und im Bericht zeigen.

## Stopp-Regeln

Anhalten und melden, statt weiterzumachen, wenn:

- ein Schritt Geld kosten würde (Dienste, Übersetzung, Prüfung durch eine Fachperson);
- Daten neu das Gerät verlassen würden: Mappe, Kopplung oder Päckli vor [S-06](../entscheide.md), Wetter, Karten, Übersetzung zur Laufzeit, oder eine neue Nebenwirkung, die nicht schon über die Plattform registriert ist;
- eine Datei ausserhalb der Pfade geändert werden müsste (Plattform, Register, Ausgabe, Lockfile): stattdessen Plattform-Antrag;
- eine Rechtsregel oder ein Satz ohne bestätigte Quelle nötig wäre (vor allem Feiertagssatz je Kategorie, Vollzugskostenbeitrag, Saldosteuersatz, Höchstarbeitszeit);
- eine Kennung, ein Tabellenname, ein Präfix, ein Datenbankname oder eine Adresse umbenannt werden müsste;
- die App beurteilen statt erinnern müsste: Asbest, Absturz, ob ein Lohn stimmt, Haftung, Zuordnung von Mängeln, Werkvertrag oder Auftrag;
- Standort, Tür- oder Alarmcodes oder Ausweisdaten gespeichert werden müssten;
- `main` nach dem Push rot ist.

## Bericht

Je Paket kurz an Alban: was gebaut ist (Tabellen, Operationen, Seiten, Dokumente), Prüfung (`ALL=`, `check:industry`, E2E), Vorschaubilder, Plattform-Anträge mit Stand, neue FAC-ADRs, Fakten mit neuem Prüfdatum, Vorschläge an den Kopf (Namensregister, Glossar, Schulden, Nebenwirkungen) und was du von Alban brauchst, mit S-Nummer.

## Stand

offen

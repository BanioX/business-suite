# Gebäudereinigung, Hauswartung und Facility

- **Kennung im Code:** `facility` (Tabellen `facility_*`, Operationen `facility.<bereich>.<verb>`, Ereignisse `facility_<ding>.<was>`, Funktionen `facility.<name>`; ADR-Präfix `FAC`)
- **Ausgabe:** Vor Ort ([S-01](../entscheide.md))
- **Welle:** W1, erste Branche nach dem Fundament; Pilot in W2, sobald Rechnung und Zeit stehen ([Fahrplan](../fahrplan.md))
- **Eignung:** 4 von 5 – viele kleine Betriebe mit täglichen Schmerzen (Stunden je Objekt, Lohn nach GAV, Nachweis, Schlüssel, Mängel), die genau das Rückgrat der Plattform prüfen; Abzug für das bewegliche Lohnrecht und den Mehrgeräte-Betrieb, der ohne Albans JA nur mit Papier geht.
- **Recherche:** [`facility-recherche.md`](facility-recherche.md) · **Auftrag:** [`../auftraege/branche-facility.md`](../auftraege/branche-facility.md)

## 1. Kurzbild

- **Wer:** Unterhaltsreinigung (Büros, Praxen, Treppenhäuser, Schulen), Spezial- und Endreinigung (Umzug, Bau, Fenster), Hauswartung im Auftrag von Verwaltungen und Eigentümerschaften, kleine Facility-Dienstleister mit Reinigung, Hauswartung, Umgebung und Winterdienst.
- **Wie viele:** Schweiz nicht belegt (STATENT, NOGA 81.10 bis 81.30, nachtragen). Beispiel Aargau, Abteilung 81 mit Gartenbau: 1'664 Arbeitsstätten, 11'113 Beschäftigte ([Jahrbuch Aargau 2025](https://www.ag.ch/app/staag/statistisches_jahrbuch/chapters/06_industrie.html)).
- **Grösse (Annahme):** Reinigung 1 bis 9 Personen, Hauswartung 1 bis 5, Facility klein 5 bis 20; viele Hauswart:innen im Nebenamt.
- **Im Betrieb:** Inhaber:in (arbeitet mit), Büro in Teilzeit, Objektleitung, Mitarbeitende meist in Teilzeit und Randzeiten, Springer:innen, Hauswart:innen, Lernende. Teams mit vier bis sechs Sprachen; der GAV-Flyer erscheint auch auf Portugiesisch, Spanisch und Tamil.
- **Aussendienst:** fast alle Arbeit am Objekt, oft allein, mehrere Objekte pro Tag, oft ohne Netz (Annahme über 90 % der Stunden).
- **Saison:** Endreinigungen an Monatsenden, Grundreinigung von Schulen im Sommer, Fenster 2- bis 4-mal pro Jahr, Winterdienst (Richtwert 1. November bis 31. März).
- **Nicht dabei:** Haushaltshilfen bei Privaten (Normalarbeitsvertrag Hauswirtschaft), Personalverleih.

## 2. Teilbranchen und Betriebsarten

Mehrfachwahl beim Einrichten; «Reinigung und Hauswartung aus einer Hand» wählt `facility.cleaning` und `facility.caretaking`, auf Wunsch mit `facility.grounds_winter`.

| Betriebsart | Kennung | Was sie tut | Startfunktionen |
| --- | --- | --- | --- |
| Unterhaltsreinigung | `facility.cleaning` | Büros, Praxen, Treppenhäuser regelmässig nach Leistungsverzeichnis | Kundschaft, Objekte, Katalog, Aufträge, Pläne, `facility.specs`, Team und Zeit, Rechnungen; nach Antwort `facility.keys`, `facility.quality` |
| Spezial- und Endreinigung | `facility.special_cleaning` | Umzugs-, End-, Bau-, Grundreinigung, Fenster und Storen, oft mit Abnahmegarantie | Kundschaft, Objekte, Katalog, Aufträge, Offerten und Rechnungen, Kasse, `facility.handovers`; nach Antwort Team und Zeit |
| Hauswartung im Auftrag | `facility.caretaking` | Liegenschaften: Kontrollgang, Treppenhaus, Abfall, Kleinreparaturen, Wohnungsabnahmen | Objekte, Pläne, Checklisten, `facility.defects`, `facility.keys`, Aufträge, Rechnungen; nach Antwort `facility.handovers`, `facility.winter`, Team und Zeit |
| Umgebung und Winterdienst | `facility.grounds_winter` | Rasen, Hecken, Laub, Wege, Schneeräumung, Streuen | Objekte, Pläne, `facility.winter`, Aufträge, Rechnungen; nach Antwort Team und Zeit |

Hauswart:in im Nebenamt ist `facility.caretaking` mit der Antwort «allein» und ohne Rechnungen.

## 3. Alltag

- **Unterhaltsreinigung:** Anfrage einer Firma oder Verwaltung › Besichtigung (Räume, Böden, Flächen, Zugang) › Offerte mit Leistungsverzeichnis und Monatspauschale › Vertrag mit Kündigungsfrist › Einsätze in Randzeiten, allein oder zu zweit › Stundenzettel, Regie mit Unterschrift › Monatsrechnung, Zusatzarbeiten oft vergessen.
- **Endreinigung:** Mieter:in ruft 2 bis 6 Wochen vor der Abgabe an › Pauschale nach Zimmerzahl mit Abnahmegarantie › Equipe am Tag vor der Abgabe › Abnahme mit der Verwaltung, Nachreinigung › Rechnung, Private oft bar oder spät.
- **Hauswartung:** Rundgang mit der Verwaltung › Pauschale, Kleinreparaturen in Regie, Pflichtenheft mit Kompetenzlimite › Wochenplan, Abfallkalender, Pikett › Hauswartrapport für die Nebenkosten, Wohnungsabnahmen › Rechnung je Liegenschaft, Regie separat.

**Rhythmus:** Tag: Krankmeldungen, Ersatz, Schlüssel, Fotos von Mängeln. Woche: Plan, Treppenhaus, Abfalltage, Kontrollgang. Monat: Stunden zusammentragen, Lohn vorbereiten, Rechnungen, Endreinigungen, Belege. Jahr: Ferien, Grundreinigungen, Fenster, Winterdienst, neue Mindestlöhne (2026, 2028), Instruktion Sicherheit.

**Heute auf Papier und im Chat:** Stundenzettel, Schlüsselquittungen, Abnahmeprotokolle, Reinigungsplan an der Putzraumtüre; Einsatzplan und Kalkulation in Tabellen; Krankmeldungen und Mängel per Telefon; Fotos und Sprachnachrichten im Gruppenchat.

## 4. Schmerzen

1. **Rentiert das Objekt?** Monatspauschale, aber Ist-Stunden je Objekt werden nicht ausgewertet; 20 % mehr Zeit frisst den Gewinn.
2. **Lohn nach GAV:** Zuschläge, 13. Monatslohn, Lohnstufen, Vollzugskostenbeitrag, Quellensteuer, Wegzeit; Fehler kosten Nachzahlungen bei Kontrollen.
3. **Planung und Ersatz** bei Teilzeit, Absenzen und Randzeiten; der Plan liegt im Kopf der Inhaberin.
4. **Stunden einsammeln** von Zetteln und Nachrichten: ein bis zwei Abende pro Monat.
5. **Kein Nachweis** («Wurde am Dienstag gereinigt?»): Rechnungen werden gekürzt.
6. **Sprache:** Plan auf Deutsch, Team in mehreren Sprachen; Instruktion nicht nachweisbar.
7. **Schlüssel:** wer hat welchen, Quittungen auf Papier, Haftung bei Verlust.
8. **Mängel und Regie gehen unter:** Meldung ohne Foto, Kleinreparaturen und Zusatzarbeiten nicht verrechnet.

**Warum keine Software:** keine Zeit zur Einführung; Angebote für grosse Firmen; nur Deutsch und viel Text; private Handys mit wenig Speicher; Abrechnung pro Kopf passt nicht zu kleinen Pensen; Angst vor Ortung und vor Schlüsseldaten in fremder Cloud.

## 5. Plattform-Module

M = Muss für den Pilot, S = Soll, K = Kann, – = nicht nötig. Aus dem Fundament dazu P-06 (Register, Fragen), P-07 (Lexikon), P-10 (Unterschrift, QR, Teilen, Kamera mit Fallback), P-11 (PDF mit Briefkopf).

| Modul | Wofür, Einstellungen der Branche | Bedarf | Welle |
| --- | --- | --- | --- |
| P-20 Betrieb und Personen | Kanton wählt Regelwerk und Feiertage; MWST-Art; Person mit Name, Sprache, Pensum | M | W0 |
| P-21 Rollen und Rechte | Vorlagen Abschnitt 8; heikles Recht `facility.keys.assign` | M | W1 |
| P-22 Kundschaft | Verwaltung, Stockwerkeigentümergemeinschaft, Firma, Praxis, Private, öffentliche Hand; Rechnung je Objekt oder gesammelt | M | W1 |
| P-23 Objekte und Standorte | Liegenschaft › Haus › Wohnung › Bereich; Flächen, Zugangshinweis ohne Code, «Wo ist was?» (Putzraum, Wasser, Abfallplatz), Objekt-QR | M | W1 |
| P-24 Leistungen und Material | Katalog Abschnitt 7, Leistungswert als Richtwert | M | W1 |
| P-25 Aufträge, Einsätze, Rapporte | Dauer- und Einzelauftrag, Rapport mit Fotos, Regie getrennt, Unterschrift; Abnahme der Endreinigung | M | W1 |
| P-26 Pläne und Wiederkehr | Leistungsverzeichnis mit Intervallen, Aufgabenkalender, Abfallkalender von Hand, Aushang | M | W1 |
| P-27 Checklisten und Nachweise | Sicherheit, Kontrollgang, Qualität, Wohnungsabnahme, Winterdienst, Instruktion | M | W1 |
| P-28 Kalender und Erinnerungen | Feiertage je Kanton, Absenzen, Saison; Erinnerungen (Quartalsleistung, Schlüssel, Mangel offen) | M | W1 |
| P-29 Offerten und Rechnungen | Monatsrechnung Pauschale plus Regie, Endreinigung, QR-Zahlteil, Mahnung | M | W2 |
| P-30 Kasse und Belege | Belege, Spesen, Barzahlung von Privaten, Monatspaket | S | W2 |
| P-31 Team und Zeit | Stempeln per Objekt-QR, Wegzeit, Monatsblatt, Lohn-Vorbereitung mit Regelwerk | M | W2 |
| P-32 Heute | Einsätze, offene Mängelmeldungen, Schlüssel ausser Haus, Objekte über Soll | M | W0 |
| P-33 Fotos und Dateien | Vorher und Nachher, Mängel, Abnahme, Winterdienst; Hinweis «nur den Mangel fotografieren» | M | W0 |
| P-40 Kopplung und Abgleich | Mappe runter, Befehle rauf (Abschnitt 10); Muss, sobald der Pilot Handys der Mitarbeitenden nutzt ([S-06](../entscheide.md)) | S | W3 |
| P-41 Material und Lager | Objektlager im Putzraum, Streusalz, Sicherheitsdatenblätter | S | W3 |
| P-42 Fahrzeuge und Geräte | Lieferwagen, Maschinen, Leitern mit Kontrollen | K | W3 |
| P-50 Termine | Besichtigungen | K | W4 |
| P-51 Verträge und Abos | Reinigungs- und Hauswartvertrag mit Monatspauschale, Kündigungsfrist; Antrag: Kern vor W4 | M | W4 |
| P-52 Kurse mit Plätzen | – | – | – |

## 6. Eigene Module der Branche

**Zuordnung für den Vertrag W1-00.** Eigene Tabellen zeigen auf Plattform-Kennungen und fügen nie Felder in Plattform-Tabellen ein ([ADR-0004](../adr/0004-andocken-einer-branche.md)). Heikelkeit und Abgleich-Art nach [ADR-0005](../adr/0005-gemeinsames-datenmodell.md) und [ADR-0006](../adr/0006-geraete-und-abgleich.md); K = Kandidat für die Plattform (Abschnitt 15).

| Datenobjekt | Plattform oder Tabelle | Heikel, Abgleich |
| --- | --- | --- |
| Objekt, Bereich, Fläche, Zugangshinweis, Objekt-QR (P-23); Leistung, Leistungswert (P-24); Zeile im Leistungsverzeichnis (P-26); Einsatz, Rapport, Regie, Unterschrift, Abnahme der Endreinigung (P-25); Durchgänge (P-27); Stempelung, Absenz (P-31, P-28) | Plattform | – |
| Belag und Zählgrössen je Bereich (K) | `facility_area_details` | normal, ein Schreiber |
| Fassung des Leistungsverzeichnisses | `facility_spec_versions` | intern, ein Schreiber, nach Ausstellung gesperrt |
| Piktogramm je Leistung (K) | `facility_service_pictograms` | normal, ein Schreiber |
| Fähigkeiten je Person (K) | `facility_staff_skills` | intern, ein Schreiber |
| Schlüssel, Bewegungen (K) | `facility_keys`, `facility_key_moves` | Objekt heikel, sonst intern; ein Schreiber, Ledger |
| Mängelmeldung an die Verwaltung (K) | `facility_defect_reports`, `facility_defect_events` | intern; Ledger |
| Kompetenzlimite je Liegenschaft | `facility_site_terms` | intern, ein Schreiber |
| Wohnungsabnahme (K) | `facility_handovers`, `facility_handover_findings` | intern; Gerät, nach Unterschrift gesperrt |
| Qualitätskontrolle | `facility_quality_audits` | intern; Gerät |
| Pikett, Winterdienst (K) | `facility_winter_duties`, `facility_winter_runs`, `facility_winter_entries` | intern; ein Schreiber, Gerät, Ledger |
| Regelwerk GAV Reinigung | Daten in `ruleSets`, keine Tabelle | – |

### 6.1 Leistungsverzeichnis und Reinigungsplan (`facility.specs`)

- `facility_area_details`: `areaId` (P-23), `floorCovering` (`tiles`, `linoleum`, `parquet`, `carpet`, `natural_stone`, `coated`, `other`), Ganzzahlen `toilets`, `basins`, `showers`, `workstations`, `windowLeaves`, `blinds`, `note`.
- `facility_spec_versions`: `id`, `siteId`, `planId` (P-26), `version` (fortlaufend je Objekt), `validFrom` (Kalendertag), `issuedAt`, `fileId` (PDF, P-33), `supersedesId`. Ausgestellt heisst gesperrt; Änderung ist eine neue Fassung.
- `facility_service_pictograms`: `catalogItemId` (P-24), `pictogram` (feste Liste der Branche).

**Rechenregeln** (Ganzzahlen, kaufmännisch gerundet erst am Ende):

- Menge in Tausendsteln (`quantityMilli`); Leistungswert als Sekunden je 1000 Einheiten (`secondsPer1000`). Eingabe «m² pro Stunde»: `3'600'000 / Wert`; «Minuten je Stück»: `Wert × 60'000`.
- Soll-Sekunden je Einsatz = Σ `quantityMilli × secondsPer1000 / 1'000'000`.
- Einsätze pro Jahr: Wochentage × 52; n-mal pro Monat × 12; quartalsweise 4; jährlich 1; nach Bedarf 0.
- Soll-Minuten pro Monat = Σ (Soll-Sekunden × Einsätze pro Jahr) / 12 / 60 (Durchschnitt ohne Feiertage).
- Fehlt ein Leistungswert: «Leistungswert fehlt», nie 0. Leistungswerte sind nicht belegt und heissen «Richtwert des Betriebs».
- Testbeispiel: 380.000 m² Boden feucht wischen zu 300 m²/h, 4 WC zu 6 Minuten, je Di und Fr; 24 Fensterflügel zu 5 Minuten, 2-mal pro Jahr: (4'560 × 104 + 1'440 × 104 + 7'200 × 2) / 12 = 53'200 s = **887 Minuten** pro Monat.

**Dokumente:** Leistungsverzeichnis (Formular, Vertragsbeilage, mit Fassung); Reinigungsplan als Aushang (Übersicht A4, je Bereich Piktogramme und Wochentage; weitere Sprachen nach [S-07](../entscheide.md)). **Kennzahlen:** Fläche, Soll-Stunden pro Monat, Soll-Minuten je 100 m².

### 6.2 Einsatzplan und Ersatz

Einsatz, Tour und Absenz sind Plattform; die Branche liefert Regeln und Vorschlag. `facility_staff_skills`: `personId`, `skills[]` (`maintenance`, `special`, `windows`, `caretaking`, `winter`, `machines`).

- Fällig ist eine Leistung, wenn ihr Intervall auf den Tag fällt; quartalsweise und jährliche Leistungen erscheinen im Fenster «diese Woche» (Richtwert 7 Tage).
- Ersatz-Vorschlag, sortiert: verfügbar › Fähigkeit passt › in den letzten 90 Tagen am Objekt (berechnet) › spricht eine Sprache des Aushangs › wenigste Wochenstunden. Die Person entscheidet.
- Hinweise, nie Verbote: Überlappung; Einsatz zwischen 23 und 6 Uhr «Nachtarbeit braucht eine Bewilligung» mit Quelle; Pause bei langen Tagen; Wochenstunden über der Grenze, die der Betrieb einträgt (ohne Vorschlag, bis die Einordnung belegt ist).

**Dokumente:** Wochenplan je Person (Streifen, QR je Einsatz ohne Adresse), Tagesplan der Equipe, Kalenderdatei. **Kennzahlen:** geplante gegen verfügbare Stunden, Einsätze ohne Person.

### 6.3 Rapport und Soll gegen Ist (`facility.costing`)

Der Rapport ist P-25; die Branche liefert Schritte aus dem Leistungsverzeichnis, Gründe fürs Überspringen (kein Zugang, Raum besetzt, Material fehlt) und die Auswertung. Keine eigene Tabelle.

- Ist-Minuten je Objekt und Monat = Σ Zeitbuchungen mit Verweis auf Einsätze des Objekts, ohne Pausen (P-31); bis P-31 steht Σ Stunden der Rapporte.
- Wegzeit = Ende an Objekt A bis Beginn an Objekt B am selben Tag, eigene Zeile. Option `facility.travel_time`: `between_sites` (Standard), `none`, `all`; Quelle ArGV 1 Art. 13, Hinweis «Fachperson fragen».
- Abweichung in Promille = (Ist − Soll) × 1000 / Soll, kaufmännisch gerundet, gezeigt als Prozent; über der Grenze des Betriebs (Richtwert +10 %) rot; ohne Soll «Soll fehlt».
- Regie = Minuten × Ansatz / 60 + Material, berechnet auf der Rechnung.

**Dokumente:** Rapport je Einsatz (Streifen), Papier-Rapport mit Objekt-QR, Monatsrapport je Objekt mit Fotos (Übersicht), Regierapport (Formular), Hauswartrapport je Liegenschaft (für die Nebenkostenabrechnung der Verwaltung). **Kennzahlen** nur mit heiklem Recht «Zahlen und Margen».

### 6.4 Schlüssel (`facility.keys`)

- `facility_keys`: `id`, `number` (neutral), `kind` (`key`, `badge`, `remote`), `count`, `customerId`, `siteId` (heikel), `storage` (Fach), `receivedOn`, `receiptFileId`.
- `facility_key_moves` (Ledger): `id`, `keyId`, `kind` (`received`, `issued`, `returned`, `returned_to_customer`, `lost`, `found`, `correction`), `personId`, `at`, `signatureFileId`, `commandId`, `note`.

Kein Feld für Tür- oder Alarmcodes ([S-11](../entscheide.md)), ein Schema-Test hält das fest. Die Zuordnung zum Objekt sieht nur, wer `facility.keys.assign` hat. Bestand = Σ Bewegungen, nie negativ; ausser Haus = letzte Bewegung `issued`; überfällig = ausgegeben und kein Einsatz der Person am Objekt in den nächsten 14 Tagen (Richtwert). **Dokumente:** Schlüsselquittung mit Unterschrift, Schlüsselliste je Kundschaft, Entwurf der Verlustmeldung. **Kennzahlen:** ausser Haus, überfällig, Verluste pro Jahr.

### 6.5 Mängelmeldungen und Hauswartung (`facility.defects`)

Befund am Gebäude für die Verwaltung; der Mangel an der eigenen Arbeit bleibt P-25. Aufgabenkalender und Kontrollgang sind P-26 und P-27; ein Befund «nicht in Ordnung» wird eine Mängelmeldung.

- `facility_defect_reports`: `id`, `siteId`, `areaId?`, `location`, `category` (`plumbing`, `electrical`, `heating`, `lift`, `envelope`, `grounds`, `safety`, `cleanliness`, `vandalism`, `other`), `urgency` (`now`, `this_week`, `later`), `description`, `photoFileIds[]`, `reportedBy`, `reportedAt`, `checkRunId?`, `selfFixVisitId?`.
- `facility_defect_events` (Ledger): `defectId`, `kind` (`recorded`, `sent`, `ordered`, `self_fix_done`, `fixed`, `billed`, `closed`, `reopened`), `at`, `personId`, `fileId?`, `commandId`.
- `facility_site_terms`: `siteId`, `costLimitRappen` (Kompetenzlimite), `reportRhythm` (`monthly`, `quarterly`), `defectRecipientContactId` (P-22), `validFrom`.

Status = letztes Ereignis; Alter = Tage seit `recorded`. Selbst beheben nur bis zur Kompetenzlimite, darüber verlangt die App zuerst `ordered`. Die Kleinreparatur ist ein Einsatz mit Regie (P-25). Der Katalog nennt keine Elektroinstallationen ([NIV](https://www.esti.admin.ch/de/themen/bewilligungen-niv-uebersicht/bewilligung-fuer-installationsarbeiten-an-besonderen-anlagen-art-14-niv)). **Dokumente:** Mängelmeldung (Formular mit Fotos, über das Teilen-Menü, keine Anbindung an Systeme der Verwaltung), Liste offener Mängel, Kontrollgangprotokoll.

### 6.6 Wohnungsabnahme und Endreinigung (`facility.handovers`)

(a) Abnahme oder Übergabe einer Wohnung im Auftrag der Verwaltung; (b) Endreinigung mit Abnahmegarantie, deren Abnahme und Nachreinigung P-25 trägt.

- `facility_handovers`: `id`, `siteId` (Wohnung), `kind` (`move_out`, `move_in`, `final_cleaning`), `date`, `jobId?`, `checkRunId` (P-27, Vorlage je Zimmerzahl), `participants[]` (Rolle, Name als Text, keine Ausweisdaten), `keysCount`, `meterReadings[]` (Zähler, Stand in Tausendsteln, Einheit), `result` (`accepted`, `rework`), `reworkDueOn?`, `signatureFileIds[]`.
- `facility_handover_findings`: `handoverId`, `areaId`, `element`, `description` (Pflicht), `responsibility` (`tenant`, `landlord`, `open`), `photoFileIds[]`.

Die Zuordnung zu Mieter- oder Vermieterschaft wählt die Person, die App schlägt sie nie vor; ohne Beschreibung kein Befund (Mängelrüge muss konkret sein, Abschnitt 9). Ob Werkvertrag oder Auftrag, sagt die App nicht. **Offerte Endreinigung** = Pauschale je Zimmerzahl + Σ Zusätze (Fensterflügel, Storen, Backofen, Balkon, Keller, Estrich) aus dem Katalog; Soll-Minuten je Position als Richtwert für die Nachkalkulation. **Dokumente:** Abnahmeprotokoll Raum für Raum, Übergabebestätigung Endreinigung, Nachreinigungsauftrag.

### 6.7 Qualitätskontrolle (`facility.quality`)

`facility_quality_audits`: `id`, `siteId`, `date`, `auditorId`, `checkRunId` (P-27: Boden, Oberflächen, Sanitär, Glas, Abfall, Verbrauchsmaterial je «in Ordnung» oder «Mangel» mit Foto), `sampleAreaIds[]`, `followUpVisitId?`, `sharedOn?`. Qualitätswert in Promille = (geprüfte Elemente − Mängel) × 1000 / geprüfte Elemente, abgerundet, nie gespeichert (24 Elemente, 2 Mängel → 916 ‰). Grenze «nachbessern» und Stichprobe sind Richtwerte des Betriebs; Vorbild Stichprobe nach EN 13549 (nur genannt). **Dokumente:** Kontrollbericht für die Kundschaft, Nachbesserungsauftrag.

### 6.8 Winterdienst (`facility.winter`)

- `facility_winter_duties` (Pikett): `personId`, `from`, `to`.
- `facility_winter_runs`: `id`, `date`, `startedAt`, `endedAt`, `personIds[]`, `conditionsNote` (von Hand; keine Wetterdaten aus dem Netz, [S-15](../entscheide.md)).
- `facility_winter_entries` (Ledger): `runId`, `siteId`, `at`, `actions[]` (`cleared`, `gritted`), `gritGrams?`, `photoFileIds[]`, `commandId`.

Saison aus dem Betriebskalender (Richtwert). Stunden über P-31; Nacht- und Sonntagsstunden markiert, Zuschlag aus dem Regelwerk nur mit bestätigtem Satz. **Dokument:** Winterdienst-Journal je Liegenschaft und Saison. Die App dokumentiert; sie sagt nie, ob genug geräumt wurde oder wer haftet.

### 6.9 Regelwerk und Offerte mit Deckungsbeitrag

**Regelwerke** (Daten mit Quelle, Gültigkeit, Prüfdatum): `facility.gav_cleaning_dch` (Kategorien Unterhalt, Spezial, Spital; Lohnstufen I und II; Mindestlöhne 2026 und 2028; Ferien, Feiertage, 13. Monatslohn, Nacht und Sonntag; Vollzugskostenbeitrag nach Betriebsgrösse) und `facility.labour_law_only`. Westschweiz, Genf, Neuenburg, Tessin erst mit belegten Werten. Ein Satz ohne bestätigte Quelle bleibt leer; die App sagt «Satz fehlt».

1. Lohn-Vollkosten pro Stunde (Rappen, Rundung je Position): Beispiel Unterhalt I 2026 mit Feiertagssatz 1,5 % (Zuordnung noch zu belegen): 2140 + 178 (Ferien 8,33 %) + 32 (Feiertage 1,5 %) = 2350; + 196 (13. Monatslohn 8,33 %) = **2546 brutto**; + 135 AHV/IV/EO (5,3 %) + 28 ALV (1,1 %); übrige Beiträge Richtwert des Betriebs.
2. Preis pro Monat = Soll-Stunden × Verrechnungsansatz + Material + Fahrt.
3. Deckungsbeitrag = Preis − Soll-Stunden × Lohn-Vollkosten − Material − Fahrt; berechnet, nur mit Recht «Zahlen und Margen»; fehlt ein Wert, nennt die App ihn.
4. MWST nach Methode des Betriebs (P-20); den Saldosteuersatz trägt der Betrieb aus seiner Bewilligung der ESTV ein.

## 7. Vorlagen

**Leistungen mit Einheit** (ohne Ansätze und Leistungswerte; vollständige Liste in der Recherche, Abschnitt 6.1): Unterhalt in m² (Boden, Teppich), Stück (Arbeitsplatz, Papierkorb, WC, Lavabo, Teeküche, Lift, Glastüre), Geschoss (Treppenhaus), Besuch (Verbrauchsmaterial, Abfall); Spezial in Fensterflügel, Stück (Storen), m² (Sprühextraktion, Grund-, Bau-, Fassadenreinigung), pauschal je Zimmerzahl (Endreinigung); Hauswartung je Besuch (Kontrollgang, Container, Zählerstände, Sichtkontrolle Heizung), m² oder m (Rasen, Hecken), h (Laub, Regie), Einsatz und kg (Winterdienst), Stück (Wohnungsabnahme), Woche (Pikett).

**Checklisten** (P-27):

- **Sicherheit beim Einsatzbeginn** (Suva-Checklisten 67045, 67189, 67035): Schutzausrüstung; Sicherheitsdatenblätter greifbar; Mittel dosiert, nie mischen; Warnschild bei Nässe; Leiter geprüft und nur ohne besseres Arbeitsmittel; über 2 m nur mit Absturzsicherung; Gebäude vor 1990 und Verdacht auf Asbest: stoppen und melden; elektrische Anlagen nicht öffnen.
- **Qualität je Raum:** Boden, Oberflächen, Sanitär, Glas, Abfall, Verbrauchsmaterial, Geruch, Gesamteindruck.
- **Kontrollgang:** Beleuchtung, Fluchtwege, Brandschutztüren, Waschküche, Heizung, Lecks, Lift, Dachrinnen, Umgebung, Abfallplatz, Briefkästen (Warmwassertemperatur erst mit belegtem Richtwert).
- **Wohnungsabnahme:** je Raum Wände, Böden, Fenster, Storen, Schränke, Türen; Küche, Bad, Balkon, Keller, Estrich; Zählerstände; Schlüssel; Unterschriften.
- **Einarbeitung** (Branchenlösung Nr. 54): Instruktion Sicherheit mit Datum, Sprache, Unterschrift; Hautschutz; Schlüsselregeln; Datenschutz in Wohnungen und Praxen; Notfallnummern.
- **Winterdienst:** Pikett erreicht, Räumgerät, Streumittel, je Liegenschaft Zeit und Foto.

**Dokumente:** wie in Abschnitt 6, dazu Offerte mit Leistungsverzeichnis, Auftragsbestätigung, Monatsrechnung mit QR-Zahlteil, Mahnung (P-29), Monatsblatt (P-31), Lohn-Vorbereitung als CSV und PDF, Instruktionsnachweis. Dokumente an Dritte folgen [S-07](../entscheide.md).

**Fragen beim Einrichten** (mit «du»): «Was machst du vor allem?» (Betriebsarten) · «Für wen arbeitest du?» (Verwaltungen, Firmen und Praxen, Private, öffentliche Hand › Mängelmeldungen, Wohnungsabnahme, Kasse) · «Wie viele Personen arbeiten mit, mit Aushilfen?» (allein, 2 bis 5, 6 bis 9, 10 oder mehr › Team, Zeit, Betriebsgrösse fürs Regelwerk) · «In welchem Kanton liegt dein Betrieb?» (Regelwerk, Feiertage) · «Hast du Schlüssel von Kundschaft?» (`facility.keys`) · «Verrechnest du pauschal oder nach Stunden?» (Rechnungsvorlage) · «Machst du Winterdienst?» (`facility.winter`). Später: Sprachen des Teams, MWST, wer die Lohnabrechnung macht.

## 8. Rollen und Arbeitsplätze

| Rollen-Vorlage | Sieht und tut | Sieht nie | Gerät | Tab-Leiste |
| --- | --- | --- | --- | --- |
| Inhaber:in | alles: Ansätze, Deckungsbeitrag, Löhne, Schlüsselzuordnung, Einstellungen | – | Hauptgerät | Heute · Plan · Objekte · Kundschaft · Mehr |
| Büro und Disposition | Planung, Kundschaft, Rechnungen, Schlüssel, Rapporte, Lohn-Vorbereitung ohne Beträge | Löhne, Deckungsbeitrag (Option der Inhaber:in) | Laptop, iPad | Heute · Plan · Objekte · Rechnungen · Mehr |
| Objektleitung | Einsätze der Equipe, Qualität, Mängelmeldungen, Schlüssel ausgeben | Ansätze, Löhne anderer, Rechnungen | Handy, iPad | Heute · Plan · Kontrolle · Schlüssel |
| Mitarbeitende (Reinigung, Spezialreinigung) | eigene Einsätze, Reinigungsplan, Abhaken, Fotos, Mangel melden, eigene Stunden | andere Objekte, Schlüsselzuordnung, Ansätze, Kundschaft | eigenes Handy nach [S-06](../entscheide.md) und [S-11](../entscheide.md), sonst Papier | Heute · Meine Woche · Meine Stunden · Melden |
| Hauswart:in | eigene Liegenschaften, Aufgaben, Kontrollgang, Mängel, Abnahmen, Winterdienst | Ansätze, Löhne anderer | Handy, iPad | Heute · Liegenschaften · Mängel · Winterdienst · Meine Stunden |
| Aushilfe | Einsätze des Tages, Stempeln | alles andere | eigenes Handy oder Papier | Heute |
| Lernende | wie Mitarbeitende, Lernziele ab Welle 3 | wie Mitarbeitende | Handy | wie Mitarbeitende |

Treuhand, Kundschaft und Verwaltung haben keinen Zugang; sie bekommen Dateien. In Stufe 1 ist eine Rolle auf einem Gerät nur eine Ansicht; echte Trennung bringt erst die gefilterte Mappe (Abschnitt 10).

## 9. Recht und Pflichten

**geprüft am 24.11.2026:** vom Kopf an der Quelle oder ihrer Zusammenfassung durch Sozialpartner oder Amt bestätigt (Websuche; amtliche Seiten direkt nicht erreichbar). **Auszug:** aus der Recherche, nicht erneut geprüft; kommt erst in die App, wenn der Branchen-Agent den Wortlaut gelesen und das Datum eingetragen hat. **nicht bestätigt:** kommt nicht in die App. Weitere Fakten mit Quelle: [Recherche](facility-recherche.md), Abschnitt 8.

| Fakt | Wert | Quelle | Stand |
| --- | --- | --- | --- |
| GAV Reinigung Deutschschweiz 2026–2029 | Allpura, Unia, Syna, VPOD; Unterhalts- und Spezialreinigung | [GAV-Broschüre](https://unia.ch/fileadmin/user_upload/Beruf-Branchen/Reinigung/gav_broschure_de_web-1763457929.pdf) | geprüft am 24.11.2026 |
| Geltung und AVE | 19 Kantone der Deutschschweiz; ordentliche AVE ab 6 Arbeitnehmenden, erleichterte für Lohnregeln auch unter 6; Dauer widersprüchlich (31.12.2029 oder Ende 2028) | [ZPK Reinigung](https://zpk-reinigung.ch/recht-lohn/gav), [GAV-Portal](https://www.gav-service.ch/gav/185006) | Auszug, Widerspruch |
| Mindestlöhne pro Stunde ab 2026 (ab 2028) | Unterhalt I 21.40 (21.95), II 22.90; Spezial I 23.40 (23.95), II 24.90; Spital I 21.85 (22.40) | [Flyer der Sozialpartner](https://unia.ch/fileadmin/user_upload/Beruf-Branchen/Reinigung/PB32813_Falzflyer_DE_GAV_Reinigung_def.pdf) | geprüft am 24.11.2026 |
| Übrige Mindestlöhne | II ab 2028, Spital II, Fahrzeugreinigung, EBA, EFZ; 182 Stunden pro Monat | [GAV-Text](https://allpura.ch/pdf/GAV_2026-2029.pdf) | Auszug |
| Inhalt des Mindestlohns | Basislohn **ohne** Ferien, Feiertage und 13. Monatslohn (korrigiert: Widerspruch der Recherche nach dem Flyer geklärt) | Flyer | geprüft am 24.11.2026 |
| Ferienentschädigung | 8,33 % bei 4 Wochen; 10,64 % bei 5 Wochen (bis 20, ab 50 mit 5 Dienstjahren) | Flyer; GAV-Portal, ältere Fassung | 8,33 % geprüft am 24.11.2026; Rest Auszug |
| Feiertagsentschädigung | **1,5 % bis 3,1 % je nach Kategorie** (korrigiert: 3,6 % der älteren Fassung gilt nicht mehr); Zuordnung je Kategorie offen | Flyer | Spanne geprüft am 24.11.2026; Zuordnung nicht bestätigt |
| 13. Monatslohn | 8,33 % bei Stundenlohn; voll ab mehr als 3 Monaten, sonst pro rata | Flyer; GAV-Text | Satz geprüft am 24.11.2026; Regel Auszug |
| Nacht und Sonntag | je 25 %, nicht kumulierbar | [GAV 2022–2025](https://allpura.ch/pdf/GAV_ZPKR_2022_2025.pdf) | Auszug (ältere Fassung) |
| Vollzugskostenbeitrag | Recherche: 0,6 % ab 6, 0,4 % unter 6 Mitarbeitenden; AG-Anteil ab 1.5.2026 reduziert, Wert unbekannt | [ZPK Reinigung](https://zpk-reinigung.ch/recht-lohn) | nicht bestätigt |
| Nachtarbeit | 23 bis 6 Uhr bewilligungspflichtig | [SECO](https://www.seco.admin.ch/de/arbeits-und-ruhezeiten) | Auszug |
| Erfassung, Pausen, Wegzeit | Beginn, Ende, Pausen; 15, 30, 60 Minuten ab 5½, 7, 9 Stunden; zusätzliche Wegzeit ausserhalb des üblichen Arbeitsorts ist Arbeitszeit | [SECO](https://www.seco.admin.ch/de/arbeitszeiterfassung), ArG Art. 15, ArGV 1 Art. 13 und 73 | Auszug |
| Überwachung | Verhaltensüberwachung verboten, auch Ortung | [SECO, ArGV 3](https://www.seco.admin.ch/de/wegleitung-argv-3) | Auszug |
| AHV/IV/EO, ALV 2026 | je 5,3 %; ALV je 1,1 % bis 148'200 Franken | [BSV, Beitragssätze 2026](https://www.bsv.admin.ch/dam/de/sd-web/p1k1Z4DTI902/Entwicklung_Beitragss%C3%A4tze_2026.pdf) | geprüft am 24.11.2026 |
| Nichtberufsunfall | versichert ab durchschnittlich 8 Stunden pro Woche beim gleichen Arbeitgeber | [Suva](https://www.suva.ch/de-ch/versicherung/unfallversicherung/unfallversicherung-uvg/unfallversicherung-wer-ist-versichert), UVV Art. 13 | geprüft am 24.11.2026 |
| Quellensteuer | Arbeitgeber zieht ab und meldet | [ESTV](https://www.estv.admin.ch/de/quellensteuer) | Auszug |
| Arbeitssicherheit | Branchenlösung Nr. 54; Absturzsicherung ab 2 m; Gebäude vor 1990: Asbest annehmen, bei Fund Arbeit einstellen (BauAV Art. 32) | [EKAS](https://ekas.admin.ch/fileadmin/Dokumente/Kurzbeschriebe_ueBL_ASA-Loesungen/Branchenloesungen/DE/BL_54_KB_2021_d.pdf), Suva (Recherche 8.4) | Auszug |
| Rückgabe der Mietsache | sofort und konkret rügen, sonst Verlust ausser versteckte Mängel | OR Art. 267a, [Obergericht ZH](https://www.gerichte-zh.ch/de/themen/miete/kuendigung-rueckgabe/rueckgabe-und-ausweisung/maengelruege) | Auszug |
| Werkeigentümerhaftung | Grundlage des Winterdienstes | OR Art. 58 | Auszug |
| MWST | Pflicht ab 100'000 Franken; Normalsatz 8,1 % | [ESTV](https://www.estv.admin.ch/de/mwst-steuersaetze-schweiz) | Auszug |
| Saldosteuersatz Gebäudereinigung | Recherche: 6,2 %; in der Prüfung keiner Branche zugeordnet gefunden | SR 641.202.62 | nicht bestätigt |
| Datenschutz | Verhältnismässigkeit, Datensicherheit, Information, Meldung von Verletzungen | DSG Art. 6, 8, 19, 24 | Auszug |

**Was die App daraus macht:** Regelwerk mit Quelle und Gültigkeit, jeder Satz als «Richtwert» sichtbar und änderbar; Hinweise im Plan (Nachtarbeit, Pause), auf dem Monatsblatt («unter 8 Stunden pro Woche: Nichtberufsunfall prüfen», Quellensteuer) und in den Checklisten; Erinnerung zum Jahreswechsel «Mindestlöhne und Sätze prüfen»; konkrete Protokolle mit Unterschrift; Journal. **Was sie nie tut:** Lohn abrechnen oder für richtig erklären, Asbest oder Absturz beurteilen, Haftung oder Mängel zuordnen, Werkvertrag oder Auftrag bestimmen, einen Satz ohne bestätigte Quelle einsetzen. Vor dem Pilot prüft eine Fachperson ([S-17](../entscheide.md)).

## 10. Geräte und Abgleich

Lagen L1 (Hauswart:in allein), L3 (Team im Magazin) und L4 (verstreute Objekte) nach [Architektur](../architektur.md), Abschnitt 6.

- **Stufe 1 ohne JA** (W1 und Pilot W2, [ADR-0006](../adr/0006-geraete-und-abgleich.md), Punkt 5): Ein Hauptgerät trägt alles. Mitarbeitende bekommen den Wochenplan als Streifen-PDF mit QR je Einsatz und den Papier-Rapport; das Büro erfasst nach und legt ein Foto des Blatts zum Rapport. Wer mit dem Hauptgerät unterwegs ist, stempelt per Objekt-QR. PDF gehen nur durch eine Handlung der Person über das Teilen-Menü.
- **Nach Albans JA** ([S-06](../entscheide.md) (b) und (c), ab W3, eigenes ADR): Mappe runter (eigene Einsätze der Woche, Objektname, Reinigungsplan, Checklisten; Adresse und Zugangshinweis ohne Code nur für die Einsätze des Tages; Schlüsselnummern ohne Objekt). Befehle rauf mit `commandId`: Stempelungen, Abhaken, Überspringen, Fotos, Zusatzaufwand, Unterschriften, Mängelmeldungen, Schlüsselbewegungen, Winterdienst-Einträge, Kontroll-Durchgänge.
- **Erst Stufe 2** ([S-14](../entscheide.md)): Planänderungen sofort, eigener Zugang je Person, mehrere Büro-Geräte, Seiten für Verwaltungen.
- **Nie aufs Handy der Mitarbeitenden:** Löhne, Ansätze, Pauschalen, Deckungsbeitrag, Rechnungen, Kundschaftsdaten ausser dem Objektnamen, Zuordnung Schlüssel › Objekt, Zahlen anderer, Protokolle anderer Objekte. Codes speichert die Ausgabe gar nicht. Keine Ortung; Anwesenheit nur per Objekt-QR.

## 11. Wörter

| Plattform | Reinigung | Hauswartung |
| --- | --- | --- |
| Objekt | Objekt | Liegenschaft |
| Leistungsplan | Leistungsverzeichnis | Pflichtenheft |
| Rapport | Rapport | Hauswartrapport |
| Kundschaft | Kundschaft | Verwaltung, Eigentümerschaft |
| Checkliste-Durchgang | Kontrolle | Kontrollgang |
| Abnahme | Abnahme | Wohnungsabnahme |
| Vertrag | Reinigungsvertrag | Hauswartvertrag |

**Fürs Glossar:** Unterhaltsreinigung, Spezialreinigung, Endreinigung, Abnahmegarantie, Nachreinigung, Leistungsverzeichnis, Pflichtenheft, Putzraum, Objektleitung, Springer:in, Equipe, Objekt-QR, Wegzeit, Kontrollgang, Kompetenzlimite, Mängelmeldung, Schlüsselquittung, Wohnungsabnahme, Mängelrüge, Pikett, Winterdienst-Journal, Lohnstufe, GAV-Lehrgang, Vollzugskostenbeitrag, Monatspauschale.

## 12. MVP und Pakete

**MVP für den Pilot** (Reinigung mit Hauswartung, 3 bis 10 Personen, Deutschschweiz, ein Hauptgerät und Papier):

1. Objekte mit Bereichen, Flächen, «Wo ist was?» und Leistungsverzeichnis mit Intervallen und Fassungen; Soll-Zeit.
2. Reinigungsplan als Aushang mit Piktogrammen; Wochenplan je Person als PDF mit QR.
3. Einsatzplan einer Woche, Ersatz bei Absenz mit Vorschlag, Hinweise zu Nachtarbeit und Überlappung.
4. Rapport je Einsatz mit Abhaken, Fotos, Regie und Unterschrift, danach gesperrt; Papier-Rapport nacherfasst; Monatsrapport je Objekt.
5. Mängelmeldungen mit Foto und Status bis erledigt; Kontrollgang als Checkliste.
6. Schlüsselregister als Ledger mit Quittung und Liste ausser Haus.
7. Zeit je Objekt, Wegzeit, Soll gegen Ist, Monatsblatt und Lohn-Vorbereitung nach GAV mit bestätigten Sätzen.
8. Monatsrechnung mit QR-Zahlteil: Pauschale je Objekt plus Regie aus den Rapporten.

**Pakete** (Abnahme im [Auftrag](../auftraege/branche-facility.md)): B-1 Gerüst und Einrichten (W1) · B-2 Objekte und Leistungsverzeichnis (W1) · B-3 Einsatzplan und Ersatz (W1) · B-4 Rapport und Monatsrapport (W1) · B-5 Schlüssel (W1) · B-6 Mängelmeldungen und Hauswartung (W1) · B-7 Zeit, Soll gegen Ist, Lohn-Vorbereitung (W2) · B-8 Monatsrechnung, danach Pilot (W2) · B-9 Endreinigung und Wohnungsabnahme (W2) · B-10 Qualitätskontrolle (W2) · B-11 Winterdienst (W2) · B-12 Offerte mit Deckungsbeitrag (W2).

**Welle 3 und später:** Mappe und Befehle nach S-06; Material und Chemie (P-41); Fahrzeuge, Maschinen, Leitern (P-42); Arbeitsplatz in den Pilot-Sprachen (S-07); Lernende; Instruktionsnachweise; Regelwerke Westschweiz, Genf, Neuenburg, Tessin (W6); Stufe 2.

**Bewusst nie:** Ortung von Personen oder Fahrzeugen, Kamera-Überwachung; Lohnzahlung, Hauptbuch, Anbindung an Banken, Verwaltungs-Systeme oder Lohnprogramme (nur Dateien); Personalverleih, Marktplatz, Ausschreibungs-Plattformen; Mieterportal; Haushaltshilfen bei Privaten als Arbeitgeber; Elektro- und Gasinstallationen im Katalog; Tür- und Alarmcodes.

## 13. Demo-Betrieb

**«Reinigung und Hauswartung Muster GmbH»**, Musterweg 12, 8000 Beispielstadt (Kanton Zürich), 9 Personen (ordentliche AVE ab 6), MWST mit Saldosteuersatz (vom Betrieb eingetragen). Alles erfunden; Personen mit Vogelnamen.

**Team:** Amsel (Inhaberin, reinigt mit, 100 %, Deutsch, Italienisch) · Fink (Büro, 40 %, Deutsch) · Meise (Objektleiterin, 80 %, Portugiesisch) · Specht (Hauswart mit Fachausweis, 80 %, Albanisch) · Lerche (Reinigung, Lohnstufe II, 50 %, Tamil) · Star (Reinigung, 30 %, manche Wochen unter 8 Stunden, Spanisch) · Zeisig (Spezialreinigung, 60 %, Tigrinya) · Dohle (Aushilfe, Winterdienst, auf Abruf, Albanisch) · Elster (Lernende Reinigungstechnik EFZ, Türkisch).

**Kundschaft:** Liegenschaftsverwaltung Muster AG (Wohnhäuser Musterweg 14, 16, 18 mit Hauswartung und Winterdienst; 9 Treppenhäuser nur Reinigung); Stockwerkeigentümergemeinschaft Musterweg 20; Büro Muster AG und vier weitere Büros; Arztpraxis Muster (täglich ab 18 Uhr); Schulhaus Muster (Grundreinigung im Sommer); Private mit Endreinigungen.

**Aufträge:** Büro Muster AG, 380 m², wie Beispiel 6.1: Soll 887 Minuten, Pauschale 980.00 pro Monat, Ist im Oktober 1'020 Minuten (+15,0 %, rot). Musterweg 14: Treppenhaus und Kontrollgang wöchentlich, Abfall dienstags, 3 offene Mängelmeldungen, eine als Kleinreparatur in Regie erledigt. Endreinigung 4½ Zimmer mit Nachreinigung Backofen. 23 Schlüssel und 4 Badges, 6 ausser Haus, einer überfällig.

**Ein Tag:** 06:30 Star meldet sich krank, die App schlägt Dohle vor; 09:00 Kontrollgang mit zwei Mängelmeldungen, eine als PDF an die Verwaltung; 13:00 Endreinigung mit Nachreinigung; abends Schlüssel zurück, zwei Papier-Rapporte nacherfasst, Büro Muster AG über Soll.

## 14. Risiken und offene Fragen

| Risiko oder Frage | Folge | Was hilft, wer entscheidet |
| --- | --- | --- |
| Abgleich der Mitarbeitenden-Handys | ohne JA arbeitet ein Team nur mit Papier | Alban, [S-06](../entscheide.md) |
| Private Handys der Mitarbeitenden | Akzeptanz, Datenschutz, Kosten | Alban, [S-11](../entscheide.md) |
| Pilotbetrieb fehlt | Annahmen in Abschnitt 3 und 4 ungeprüft | Alban, [S-09](../entscheide.md); Name und Adresse [S-04](../entscheide.md), [S-05](../entscheide.md) |
| Lohnregeln falsch oder veraltet (Feiertag je Kategorie, Vollzugskostenbeitrag, Dauer der AVE) | Nachzahlungen beim Betrieb | nur bestätigte Sätze, Jahreswechsel als Aufgabe; Fachperson vor dem Pilot, Alban, [S-17](../entscheide.md) [Geld] |
| Sprachen der Mitarbeitenden, Anrede in Dokumenten an Verwaltungen | Plan nicht verstanden; «du» im Brief | Alban, [S-07](../entscheide.md); bis dahin Piktogramme und de-CH |
| Monatspauschale braucht P-51 (erst W4) | Pilot ohne wiederkehrende Rechnung | Plattform-Antrag 1, Kopf |
| Vorrang GAV vor kantonalem Mindestlohn (Abstimmung offen) | Regelwerk je Kanton ändert | Option «höherer Mindestlohn gilt» mit Datum, sobald belegt |
| Geräteverlust, Fotos aus Wohnungen, Angst vor Überwachung | Einbruch, Persönlichkeitsverletzung, Ablehnung im Team | Daten-Minimum je Rolle, keine Codes, App-Sperre; Hinweis beim Fotografieren, Löschfrist als Option; keine Ortung, Objekt-QR |
| Gilt der Reinigungs-GAV für Hauswartungsfirmen | falsches Regelwerk | nicht belegt; Betrieb wählt, Hinweis auf die Paritätische Kommission |

## 15. Absehbare Plattform-Anträge

| Nr. | Antrag | Zweite Branche | Bis dahin |
| --- | --- | --- | --- |
| 1 | P-51 Kern vor W4: Vertrag je Kundschaft und Objekt mit Monatspauschale, Laufzeit, Kündigungsfrist, Preisänderung, erzeugt Rechnungsposition je Monat | Garten, Haustechnik, Fitness | Port `RecurringBillingSource` in der Branche |
| 2 | «Befund am Objekt» neben dem Mangel der Abnahme (P-23 oder P-25): Ort, Kategorie, Dringlichkeit, Fotos, Status-Ledger, Empfänger | Haustechnik, Gebäudehülle, Garten | `facility_defect_reports` |
| 3 | Schlüssel-Register mit Ledger und Quittung (P-23) | Haustechnik, Garten, Umzug, Beherbergung | `facility_keys` auf P-04 |
| 4 | Belag und Zählgrössen je Bereich (P-23) | Maler, Beherbergung | `facility_area_details` |
| 5 | Piktogramme je Leistung, Aushang in mehreren Sprachen (P-24, P-26) | Beherbergung, Garten | `facility_service_pictograms` |
| 6 | P-31: Zeitbuchung mit Objekt und Lohnkategorie, Wegzeit als Option, Regelwerk mit Betriebsgrösse, Lohnstufe, Gültigkeit | Maler, Gebäudehülle, Garten | – |
| 7 | Soll gegen Ist je Objekt und Auftrag (P-25, P-32) | Maler, Garten, Haustechnik | Berechnung in der Branche |
| 8 | Fähigkeiten und Sprachen je Person für Ersatz-Vorschläge (P-20, P-31) | jede Branche mit Team | `facility_staff_skills` |

Anträge stehen in `docs/branchen/facility/antraege.md`; der Kopf entscheidet ([Zusammenarbeit](../zusammenarbeit.md), Abschnitt 5).

## 16. Stand

Steckbrief vom 24.11.2026, noch nichts gebaut.

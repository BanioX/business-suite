# Umzug, Räumung, Entsorgung und Kleintransport

- **Kennung im Code:** `moving` (Tabellen `moving_*`, Operationen `moving.<bereich>.<verb>`, Ereignisse `moving_<ding>.<was>`, Funktionen `moving.<name>`; ADR-Präfix `MOV`); Betriebsarten `moving.relocation`, `moving.clearance`, `moving.courier`, `moving.storage`
- **Ausgabe:** Vor Ort ([S-01](../entscheide.md))
- **Welle:** W2 ([Fahrplan](../fahrplan.md)); Pilot vor der Saison (Winter, Frühling), nie kurz vor einem Quartalsende
- **Eignung:** 4 – Offerte aus der Umzugsgutliste, Rapport mit Unterschrift, Rechnung am selben Abend und die Stunden der Aushilfen sind tägliche Lücken, und fast alles kommt aus der Plattform; Abzug für Fahrzeugpflichten über 3,5 t, Haftung für Umzugsgut, Aushilfen mit Bargeld und Datenschutz in Wohnungen.
- **Recherche:** [`umzug-recherche.md`](umzug-recherche.md) · **Auftrag:** [`../auftraege/branche-umzug.md`](../auftraege/branche-umzug.md)

## 1. Kurzbild

| Frage | Antwort |
| --- | --- |
| Wie viele | nicht belegt; NOGA 49.42 Umzugstransporte ([BFS KUBB](https://www.kubb-tool.bfs.admin.ch/en/noga/2025/494100)), dazu 52.10, 53.20, 38.11, 38.12; STATENT nachtragen. Der Nutzfahrzeugverband ASTAG zählt rund 3750 Mitglieder und Partner, mit Fachgruppe Möbeltransporte |
| Grösse (Annahme) | Umzug 1 bis 15 Personen und Aushilfen an Spitzentagen; Räumung 1 bis 10; Kurier 1 bis 5, oft allein; Entsorgung mit Mulden bis 20 |
| Wer arbeitet | Inhaber:in (Besichtigung, Offerte, oft Teamleitung), Büro in Teilzeit, Teamleitung, Chauffeur:in, Umzugsmitarbeitende, Aushilfen im Stundenlohn, Kurier:in, selten Lernende; extern Treuhand, Partnerbetriebe |
| Sprachen | nicht belegt; Annahme neben Deutsch Albanisch, Portugiesisch, Italienisch, Bosnisch-Kroatisch-Serbisch, Türkisch, Spanisch, Tamil, Tigrinya ([S-07](../entscheide.md)) |
| Aussendienst | Annahme: alles ausser Offerte, Planung, Rechnung; Equipe 9 bis 11 Stunden unterwegs |
| Saison | Monats- und Quartalsenden (Kündigung auf ortsübliche Termine, OR Art. 266c), Frühling, Sommerferien; ruhig Dezember bis Februar (Annahme) |

## 2. Teilbranchen und Betriebsarten

Mehrfach wählbar. Möbellift mit Bedienung ist eine Option von `moving.relocation`. Umzug mit Endreinigung schaltet in derselben Ausgabe die Branche Facility dazu (`facility.special_cleaning`); `moving` importiert `facility` nie.

| Betriebsart | Kennung | Was sie tut | Startfunktionen |
| --- | --- | --- | --- |
| Umzug | `moving.relocation` | Privat- und Firmenumzug, Einpacken, Montage, Möbellift, Klavier, Tresor | `moving.survey`, `moving.quoting`, `moving.dispatch`, `moving.reports`, `moving.damages`, `moving.disposal`; Rechnung, Kasse, Zeit |
| Räumung und Entsorgung | `moving.clearance` | Wohnungsauflösung, Keller, Estrich, Räumung für Verwaltung oder Behörde; Fraktionen, Mulden | `moving.clearout`, `moving.disposal`, `moving.quoting`, `moving.dispatch`, `moving.reports` |
| Kleintransport und Kurier | `moving.courier` | Einzelstücke, Lieferfahrten, Touren, Velokurier | `moving.deliveries`; Sammelrechnung, Kasse |
| Einlagerung | `moving.storage` | Umzugsgut im eigenen Lager, Abteil, Container | `moving.stored_goods`, `moving.reports`; Lagervertrag über P-51 |

## 3. Alltag

- **Ablauf:** Anfrage (Telefon, E-Mail, Formular, Chat, Offertenplattform, Verwaltung) › Besichtigung vor Ort, per Video oder nach Fotos › abends Volumen und Zeit schätzen, Offerte › nachfassen › Annahme › Halteverbot, Möbellift, Kartons, Aushilfen › Plan › Einsatz an zwei Adressen › Rapport, Unterschrift, oft Bargeld › Entsorgung › Rechnung › Mahnung an die neue Adresse › später gemeldeter Schaden.
- **Tag:** 06:30 Magazin › Ladeort, Rundgang, Vorschäden, Schutz › Laden › Entladen, Montage › Abnahme › Sammelstelle › 17:30 Magazin, Rapport und Bargeld › abends Besichtigungen und Offerten. Räumung: sortieren, Fundsachen an einen Ort, mehrere Annahmestellen. Kurier: 5 bis 30 Stopps, Zustellnachweis.
- **Woche:** Plan, Halteverbote mit Vorlauf je Gemeinde, Kartons liefern und holen, Rechnungen. **Monat:** Spitze am Monatsende, Stunden und Lohn-Vorbereitung, Belege, Lagerrechnungen, LSVA und Fahrtschreiber. **Jahr:** Fahrzeugprüfung, Fähigkeitsausweis, Abschluss, MWST, Richtwerte anpassen.
- **Heute:** Notizblock, Fotos auf privaten Handys, Vorlage in der Textverarbeitung, Wandtafel, Gruppenchat mit Adressen und Codes, Rapportblock, Couvert für Bargeld, Wiegescheine im Handschuhfach.

## 4. Schmerzen

1. **Volumen und Zeit falsch geschätzt;** ohne Rückmeldung aus dem Rapport lernt der Betrieb nichts.
2. **Streit um Stunden und Zusatzleistungen:** Rapport ohne Zeiten je Schritt und ohne Unterschrift.
3. **Schäden ohne Nachweis:** keine Vorschaden-Fotos, Frist für versteckte Schäden nicht im Blick.
4. **Spitzentage:** Doppelbuchung, Aushilfe sagt ab, Halteverbot vergessen, Lastwagen am Sonntag, Fahrer:in ohne passenden Ausweis.
5. **Aushilfen im Stundenlohn:** Stunden auf Zetteln; Ferienlohn, AHV, Unfall, Quellensteuer falsch.
6. **Bargeld und Belege:** Couvert statt Kassenbuch; Treibstoff, Parkuhr, Entsorgung gehen verloren.
7. **Offene Rechnungen:** Rechnung Tage später, Private unter der alten Adresse nicht erreichbar.
8. **Entsorgung und Räumung:** Gebühren nicht weiterverrechnet; unklar, wer den Auftrag geben darf; Fundsachen ohne Protokoll.

**Warum keine Software:** keine Zeit, Programme für Speditionen, viel Text, private Handys, Abrechnung pro Kopf passt nicht zu Aushilfen, Angst vor fremden Rechenzentren und Ortung. **Was bewegt:** Offerte in Minuten, Rechnung am selben Abend, Vorschäden mit Fotos, Stunden der Aushilfen fertig, ein Plan mit Warnungen, keine Konten für Aushilfen, keine Ortung, alles ohne Netz.

## 5. Plattform-Module

M = Muss für den Pilot, S = Soll, K = Kann. Dazu P-06 (Betriebsarten, Fragen), P-07 (Lexikon), P-10 (Kamera mit Fallback, Unterschrift, Teilen), P-11 (Formular, Streifen).

| Modul | Wofür, Einstellungen der Branche | Bedarf | Welle |
| --- | --- | --- | --- |
| P-20 Betrieb und Personen | Kanton und Gemeinde des Magazins, Rechtsform, MWST-Art; Saldosteuersätze trägt der Betrieb ein, auch mehrere | M | W0 |
| P-21 Rollen und Rechte | Vorlagen Abschnitt 8; heikel: Preise und Margen, Löhne, Kasse, Schadenkosten, Zugangshinweise, Fundsachen | M | W1 |
| P-22 Kundschaft | Privat, Firma, Verwaltung, Erbengemeinschaft, Behörde; «vertreten durch», Adresse nach dem Umzug (Antrag) | M | W1 |
| P-23 Objekte und Standorte | Ladeort und Entladeort mit Räumen; Magazin und Lager; Zugangshinweis ohne Code ([S-11](../entscheide.md)) | M | W1 |
| P-24 Leistungen und Material | Vorlage Abschnitt 7 ohne Ansätze; Einheiten Personenstunde, Fahrzeugstunde, Tag, Monat (Antrag) | M | W1 |
| P-25 Aufträge, Einsätze, Rapporte | mehrere Einsatztage je Auftrag; Pauschal, nach Aufwand (Regie), Kostendach, ungefährer Kostenansatz (Antrag); Rapport gesperrt nach Unterschrift | M | W1 |
| P-26 Pläne und Wiederkehr | – | – | – |
| P-27 Checklisten und Nachweise | Vorlagen Abschnitt 7; Stopp-Meldung; Unterweisung «Möbellift» | M | W1 |
| P-28 Kalender und Erinnerungen | Feiertage je Kanton, Halteverbot-Vorlauf, Kartons, Nachfassen, Schadenfrist, Fahrzeugfristen | M | W1 |
| P-29 Offerten und Rechnungen | Optionen, Varianten, Anzahlung, Durchlaufposten, Rechnung aus Rapport, Barquittung, 5-Rappen-Rundung, Sammelrechnung | M | W2 |
| P-30 Kasse und Belege | Fahrerkasse; Treibstoff, Entsorgung, Parkgebühr, Kartons, Fahrzeug, Mittagessen Equipe; Monatspaket | M | W2 |
| P-31 Team und Zeit | Zeit aus dem Rapport, Aushilfen im Stundenlohn, Regelwerk 6.8 | M | W2 |
| P-32 Heute | Einsätze, fehlende Halteverbote, offene Rapporte und Posten, Schadenfristen | M | W0 |
| P-33 Fotos und Dateien | Besichtigung, Vorschaden, Schaden, Signale, Wiegeschein, Fundsache; «Fotografiere den Gegenstand, nicht die Menschen.» | M | W0 |
| P-40 Kopplung und Abgleich | Mappe ohne Preise und Werte; Muss, sobald zwei Teamleitungen rapportieren ([S-06](../entscheide.md)) | S | W3 |
| P-41 Material und Lager | Kartons: verkauft, ausgeliehen, zurück, abgeschrieben | S | W3 |
| P-42 Fahrzeuge und Geräte | Gesamtgewicht, Nutzlast, Nutzvolumen; Ausweise je Person; Belegung; Fristen. Kern schon in W2 nötig (Antrag) | M | W3 |
| P-50 Termine | Besichtigungstermine; bis dahin Einsatz der Art «Besichtigung» | K | W4 |
| P-51 Verträge und Mitgliedschaften | Lagervertrag mit Monatsrechnung | K | W4 |
| P-52 Kurse mit Plätzen | – | – | – |

## 6. Eigene Module der Branche

Alle Tabellen tragen `businessId`. Volumen in Litern, Gewicht in Gramm, Längen in Millimeter, Dauern in Minuten, Geld in Rappen, Sätze in Basispunkten (bp), alles Ganzzahlen; Tage `YYYY-MM-DD`, Zeitpunkte ISO-UTC; je Zeile einmal kaufmännisch gerundet. «H, A»: Heikelkeit (n, i, h) und Abgleich-Art ([ADR-0005](../adr/0005-gemeinsames-datenmodell.md)). **K** = Kandidat für die Plattform. Richtwerte starten leer; ohne Wert zeigt die App «Wert fehlt».

### 6.1 Besichtigung und Umzugsgutliste (`moving.survey`)

Die Anfrage ist ein Auftrag von P-25 im Status «Anfrage», Räume sind Objekte der Ebene «Raum» (P-23). Videoanrufe laufen ausserhalb der App.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `moving_job_profiles` | jobId, moveKind, channel, wishDate, flexDays, roomHalves (4½ = 9), lostReason | n, ein Schreiber |
| `moving_surveys` | jobId, mode (`on_site`, `video`, `photos`, `phone`), date, personId, status | n, ein Schreiber |
| `moving_access` | surveyId, siteId, floor, lift, stairs, carryM, parking (`available`, `blue_zone`, `permit_needed`), furnitureLift, openingWidthMm, approachNote; **nie ein Code** | i, ein Schreiber |
| `moving_inventory_items` | surveyId, roomSiteId, catalogEntryId oder label, count, volumeLEach, weightGEach, dismantle, fragile, heavy, target (`move`, `store`, `dispose`, `sell_donate`, `stays`), fileIds; **kein Wert** | i, ein Schreiber |
| `moving_item_catalog` | name, category, volumeL, weightG, assemblyMin (Richtwerte), symbol | n, ein Schreiber |
| `moving_estimating_values` | key (Stauzuschlag, Leistung je Person und Stunde, Zugangsfaktoren, Geschwindigkeit, Puffer, kg je m³ je Fraktion), value, source (`business`, `learned`), validFrom | i, Ledger |
| `moving_estimates` | surveyId, version, rawVolumeL, volumeL, weightG, assetIds, trips, persons, loadMin, unloadMin, driveMin, assemblyMin | i, Ledger |

**Formeln:** Volumen je Stück = L × B × H (mm, in Liter) oder Katalog. V_roh = Σ (Anzahl × Volumen). V = round(V_roh × (10 000 + Stauzuschlag) ÷ 10 000). Fahrten = aufrunden(V ÷ Σ Nutzvolumen). Gewicht über der Nutzlast (P-42) einer Fahrt: Warnung. Laden und Entladen je Adresse = round(V × 60 × Zugangsfaktor ÷ (Leistung in l je Person und Stunde × Personen × 10 000)). Fahrt = (round(Distanz in m × 60 ÷ (km/h × 1000)) + Puffer) × Fahrten. Montage = Σ Anzahl × Montageminuten.
**Prüfbeispiel** (Testwerte): Schrank 1000 × 600 × 2000 mm = 1200 l, Karton 600 × 400 × 400 mm = 96 l; 2 Schränke, 40 Kartons, Sofa 2000 l, Bett 1500 l, übrige 20 260 l: V_roh 30 000 l; Stauzuschlag 1300 bp: V 33 900 l; Fahrzeuge 38 000 und 16 000 l: 1 Fahrt, nur 16 000 l: 3 Fahrten. 4 Personen, 3000 l je Person und Stunde; Ladeort ohne Lift 12 500 bp: Laden 212 min (211,875); Entladen 10 000 bp: 170 min (169,5); 12 000 m bei 30 km/h, Puffer 15: 39 min; Montage 80 min; Summe 501 min (8 h 21 min).
**Lernen:** Nach dem Rapport «geschätzt 33,900 m³ und 8 h 21 min, tatsächlich 1 Fahrt und 8 h 45 min»; ab drei Einsätzen ein Vorschlag (Mittel der letzten fünf), den der Betrieb übernimmt oder nicht. **Dokumente:** Besichtigungsprotokoll, Umzugsgutliste für die Kundschaft (ohne Preise und Werte), Etikettenbogen.

### 6.2 Offerte und Abrechnungsart (`moving.quoting`)

Offerte, Anzahlung und Rechnung sind P-29; die Branche liefert Annahmen, Preisart und Regeln.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `moving_pricing_terms` | jobId, pricing (`fixed`, `hourly`, `hourly_cap`, `estimate`), billable (`depot_to_depot`, `site_to_site`), breaksBillable, waitingBillable, minimumMin, roundingMin, roundingMode, capRappen, capScope (`all`, `labour_vehicles`), capMin, estimateToleranceBp, payment (`invoice`, `cash_on_day`, `prepayment`) | i, ein Schreiber |
| `moving_quote_assumptions` | quoteId, estimateId, volumeL, persons, assetIds, accessSummary, exclusions | n, ein Schreiber |

**Regeln:** Nach Aufwand = Σ Personen round(Minuten × Ansatz ÷ 60) + Σ Fahrzeuge round(Minuten × Ansatz ÷ 60) + Pauschalen + Material + Durchlaufposten + Zuschläge. Kostendach = min(Summe im Umfang `capScope`, Dach) + übrige Positionen. capMin = abrunden(Dach × 60 ÷ Σ Ansätze je Stunde); die Teamleitung sieht nur Minuten. Ungefährer Kostenansatz: Hinweis, wenn Aufwand > Ansatz × (10 000 + Toleranz) ÷ 10 000, mit Quelle OR Art. 375, ohne Urteil. Pauschale intern: Preis = Kosten × (10 000 + Zuschlag) ÷ 10 000; Marge berechnet, nur mit «Preise und Margen». MWST je Satz nach P-29; Rundung auf 5 Rappen als Option.
**Prüfbeispiel** (Testwerte, 525 min): 4 × round(525 × 7000 ÷ 60) = 245 000; Lastwagen 52 500; Lieferwagen 35 000; Summe 332 500; Dach 320 000 auf `labour_vehicles`; dazu 2 Lampen 5000, Halteverbot 8000: netto 333 000; Testsatz 8,1 Prozent 26 973; Total 359 973, auf 5 Rappen 359 975. capMin = 320 000 × 60 ÷ 38 000 = 505.
**Dokumente:** Offerte mit Varianten («nur Transport», «mit Einpacken», «mit Reinigung»), Auftragsbestätigung, Hinweisblatt (Text des Betriebs), Anzahlungsrechnung. Die Person teilt das PDF selbst.

### 6.3 Einsatzplan, Halteverbot und Bewilligungen (`moving.dispatch`)

Einsatz und Equipe sind P-25, Belegung von Fahrzeug und Möbellift P-42, Abwesenheiten P-28.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `moving_visit_roles` | visitId, personId, dayRole (`crew_lead`, `driver`, `crew`, `helper`), driverOfAssetId | n, ein Schreiber |
| `moving_load_lists` | visitId, lines, note | n, ein Schreiber |
| `moving_street_permits` **K** | jobId, siteId, municipalityId, kind (`parking_block`, `no_stopping`, `lift_public_ground`, `access`, `sunday_night`), fromDate, toDate, requestedOn, status (`needed`, `requested`, `granted`, `signs_placed`, `removed`, `refused`), fileIds, feeRappen, passOn | n, Ledger |
| `moving_municipalities` **K** | name, authority, contactNote, leadDays (Richtwert), feeNote | n, ein Schreiber |
| `moving_helper_answers` | personId, date, answer, recordedBy | i, Ledger |

**Warnungen** (Bestätigen nur mit Begründung): Person oder Fahrzeug doppelt; Kapazität je Tag als Ampel; Fahrzeug über 3500 kg mit Fahrer:in ohne passende Kategorie oder ohne gültigen Fähigkeitsausweis; Fahrzeug über 3,5 t am Sonntag, am kantonalen Feiertag oder 22 bis 5 Uhr («Sonntags- und Nachtfahrverbot», Feld für die Sonderbewilligung); Halteverbot nötig, aber nicht beantragt, und Vorlauf unterschritten; Möbellift ohne Person mit Unterweisung (P-27); Kartons liefern und holen nach Richtwert. Ruhezeit nach ARV 1 erst, wenn der Wert in Abschnitt 9 geprüft ist. Jede Warnung nennt ihre Quelle aus Abschnitt 9 und erscheint nur mit «geprüft am».
**Dokumente:** Tagesblatt (keine Preise, Werte, Codes), Wochen- und Fahrzeugplan, Gesuchsdaten für die Gemeinde. Auf dem iPad quer als Plantafel.

### 6.4 Einsatzrapport und Übergabe (`moving.reports`)

Ergänzt den Rapport von P-25 (Stunden, Material, Fotos, Unterschrift, danach gesperrt). Zusatzleistungen sind Rapportzeilen «Zusatz» mit «von Kundschaft bestätigt» (Antrag), Bargeld ist ein Eintrag der Fahrerkasse (P-30) mit Barquittung (P-29), Stunden gehen ins Zeit-Ledger (P-31).

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `moving_report_stamps` | reportId, kind (`depart_depot`, `arrive_pickup`, `load_start`, `load_end`, `arrive_dropoff`, `unload_end`, `assembly_end`, `return_depot`, `break_start`, `break_end`, `waiting_start`, `waiting_end`), at, recordedBy, correctsId, reason | n, Ledger |
| `moving_vehicle_uses` | reportId, assetId, odometerStartKm, odometerEndKm, driverPersonId | n, Ledger |
| `moving_damage_marks` | reportId, phase (`pre`, `post`), place, inventoryItemId, note, fileIds, seenByCustomer | i, Ledger |
| `moving_key_handovers` **K** | reportId, count, fromName, toName, at, signatureFileId | i, Ledger |

**Regeln:** Verrechenbar bei `depot_to_depot` von `depart_depot` bis `return_depot`, bei `site_to_site` von `arrive_pickup` bis `assembly_end` mit Anfahrtspauschale; minus Pausen (ausser Option), Wartezeit nach Option, dann Mindestdauer und Rundung. Arbeitszeit je Person = Ende − Beginn − Pausen, unabhängig davon; Wegzeit ab Magazin zählt. Ablieferung = Kalendertag von `unload_end`. Abschluss ohne Vorschaden-Rundgang oder Unterschrift verlangt eine Begründung.
**Prüfbeispiel** (Demo-Tag): Abfahrt 06:55, Ladeort 07:20, Pausen 11:05 bis 11:35 und 14:15 bis 14:45, Montage fertig 16:05, Rückkehr 16:40: `depot_to_depot` 525 min, `site_to_site` 465 min; Teamleitung 06:30 bis 17:00 mit 60 min Pause: Arbeitszeit 570 min; Dach bei 505 min als Hinweis ohne Betrag.
**Dokumente:** Einsatzrapport (Formular), Übergabeprotokoll Schlüssel (Nummer, nie Adresse), Lieferliste beim Firmenumzug, Barquittung.

### 6.5 Schäden und Fristen (`moving.damages`)

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `moving_damage_cases` | jobId, kind (`goods`, `building`, `third_party_vehicle`, `own_vehicle`, `injury`), reportedOn, discoveredOn, deliveredOn, visibleAtDelivery, markIds, fileIds, description, estimateRappen, insurerNotifiedOn, insurerRef, status (Ledger: `open`, `checking`, `accepted`, `declined`, `paid`, `closed`), costRappen | i (Beträge h), ein Schreiber |
| `moving_claim_deadlines` | caseId, kind (`hidden_damage_notice`, `insurer_notice`, `limitation`), date, sourceRef | i, ein Schreiber |

Tage bis zur Meldung = reportedOn − deliveredOn. Die App zeigt «Ablieferung am 12.03.2026, gemeldet nach 5 Tagen; OR Art. 452 Abs. 3 nennt 8 Tage, falls ein Frachtvertrag vorliegt», nie «Anspruch verloren» oder «berechtigt». Verjährung nur mit Quelle. Personenschaden nur mit Datum der Meldung an den Unfallversicherer, keine Gesundheitsangaben ([S-12](../entscheide.md)). Schadenquote = Fälle × 10 000 ÷ abgeschlossene Einsätze (bp), keine Rangliste von Personen. **Dokumente:** Schadenprotokoll, Meldung an die Versicherung als PDF, Antwortbrief (Text des Betriebs).

### 6.6 Räumung, Inventar und Fundsachen (`moving.clearout`)

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `moving_clearout_mandates` | jobId, principal (`tenant`, `owner`, `management`, `heirs`, `executor`, `deputy`, `authority`), representedBy, proofKind, proofFileId, checkedBy, checkedOn, scope (`broom_clean`, `cleaning_ready`, `with_cleaning`), handoverDate | h, ein Schreiber |
| `moving_clearout_items` | jobId, roomSiteId, label, count, target (`client_keeps`, `sell`, `donate`, `reuse`, `dispose`), proceedsRappen, fileIds | i, ein Schreiber |
| `moving_found_items` | jobId, kind (`cash`, `jewellery`, `documents`, `photos_keepsakes`, `keys`, `weapons`, `medicines`, `other`), foundBy, foundAt, roomSiteId, fileId, cashRappen, countedBy (zwei bei «Vier Augen»), handedToName, signatureFileId, handedOverAt | h, Ledger |

Planen erst mit vermerkter Berechtigung. Das Fundprotokoll hält Art, Ort, Zählung und Übergabe fest, nie den Inhalt von Dokumenten; «besenrein» fragt nach, solange eine Fundsache offen ist. Preis mit Anrechnung = Aufwand + Entsorgung − Erlös; Steuer auf Wiederverkauf klärt die Treuhand. Gebäude vor 1990 (Richtwert): «keine festen Bauteile entfernen», Stopp-Meldung (P-27). **Dokumente:** Räumungsofferte, Inventar mit Zielen, Fundprotokoll, Abgabeprotokoll.

### 6.7 Entsorgung (`moving.disposal`)

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `moving_disposal_batches` **K** | jobId, fraction (Sperrgut, Holz, Metall, Elektro, Kühlgeräte, Sonderabfall, Bauschutt, Textilien, Papier, Glas, Grüngut), quantity, unit, disposalSiteId, ticketNo, ticketFileId, feeRappen, paidFrom, passOn (`no`, `at_cost`, `surcharge`), surchargeBp, hazardousDocRef, date | n, Ledger |
| `moving_disposal_sites` | name, fractions, tariffs (Richtwert), openingNote | n, ein Schreiber |

Kosten = Σ Gebühren; verrechnet = Σ round(Gebühr × (10 000 + Zuschlag) ÷ 10 000) oder Pauschale je m³; Ergebnis nur mit «Preise und Margen». Hinweis bei Wiegeschein ohne Auftrag, Auftrag mit Entsorgung ohne Posten, Sonderabfall ohne Begleitschein-Nummer. **Prüfbeispiel** (1000 bp): 18 600 › 20 460; 6150 › 6765; 0; 0; 2400 › 2640; Kosten 27 150, verrechnet 29 865, Ergebnis 2715. **Dokument:** Entsorgungsnachweis (Fraktionen, Mengen, Annahmestellen, Wiegescheine; Preise auf Wunsch weg).

### 6.8 Regelwerk, Einlagerung und Kurier

**Regelwerk** (`moving.labor_rules`) als Daten für P-31, je mit Quelle und Gültigkeit: «Arbeitsgesetz allein», Mindestlöhne nach Arbeitsort, Hinweise für Aushilfen (geringfügiger Lohn, Nichtberufsunfall unter 8 Stunden, Quellensteuer), Ferienlohn = round(Bruttolohn × Satz ÷ 10 000) (112 000 bei 833 bp › 9330), Hinweise ARV 1. Tabelle `moving_time_confirmations` **K** (reportId, personId, minutes, signatureFileId; i, Ledger): die Aushilfe bestätigt auf dem Gerät der Teamleitung.

**Einlagerung** (`moving.stored_goods`, W4): Vertrag über P-51; `moving_storage_units` (label, capacityL), `moving_storage_terms` (contractId, unit `m3` | `compartment` | `container`, quantity, declaredValueRappen nur für die Versicherung, h), `moving_storage_moves` (Ledger: `in`, `out`, `relocate`, Positionen, Unterschrift). Erster Monat anteilig = round(Monatsbetrag × Tage ÷ Tage des Monats): 12 m³ × 2500 = 30 000, ab 11. März 30 000 × 21 ÷ 31 = 20 323. Offene Lagerrechnung vor Auslagerung: Hinweis, nie Sperre.

**Kurier** (`moving.deliveries`, W3): `moving_deliveries` (Abholung, Zustellung, Zeitfenster, Empfänger:in, Art, Dienst, Zone, Wartezeit, Status als Ledger, Zustellnachweis), `moving_tours` (Datum, Person, Fahrzeug oder Velo, Reihenfolge, km), `moving_tariff_zones`. Preis = Grundtarif + Gewichtsstufe + Express + aufrunden(Wartezeit ÷ 15) × Ansatz: 3500 + 1500 + 2 × 800 = 6600 bei 20 min. Sammelrechnung über P-29. Meldepflichten für Kurierdienste nicht belegt: vor dem Bau klären.

## 7. Vorlagen

**Leistungen** (eigene Worte, ohne Ansätze; ganze Liste in der Recherche, 6.1): Personal je Personenstunde (Mitarbeiter:in, Teamleitung, Einpacken, Auspacken); Lieferwagen, Lastwagen je Fahrzeugstunde oder Tag; Anhänger; Anfahrt; Möbellift mit Bedienung; Klavier, Tresor; Möbel de- und montieren, Lampe an bestehender Klemme, Vorhangstange; Karton, Kleiderbox, Packmaterial; Zuschläge Samstag, Abend, Stockwerk ohne Lift, Tragweg, Wartezeit; Durchlaufposten Halteverbot, Entsorgungsgebühr; Entsorgung Sperrgut (m³), Elektrogerät (Stk.), Sonderabfall (kg); Räumung, besenrein; Endreinigung nur mit Facility oder als Fremdleistung; Einlagerung (m³ und Monat); Kurier Zone, Express, Wartezeit. Keine Elektroinstallation.

**Gegenstandskatalog:** rund 30 Einträge (Sofa, Bett, Schrank je Türe, Kommode, Tisch, Stuhl, Pult, Geräte, Velo, Klavier, Tresor, Aquarium, Karton, Kleiderbox) mit Symbol; Volumen, Gewicht und Montageminuten leer.

**Checklisten** (Punkte in der Recherche, 6.2): Abfahrt (Ausweise, über 3,5 t Fahrerkarte und Fahrverbot, Ladung, Nutzlast, Radkeile); Einsatzort (Halteverbot, Vorschaden-Rundgang, Schutz, schwer zu zweit, Absturz); Möbellift (instruierte Person, Abstützung, Absperrung, Wind als Richtwert); Räumung (Berechtigung, vor 1990 keine festen Bauteile, Sonderabfall, Fundsachen); Übergabe (leer, Schadenrundgang, Schlüssel, Mietkartons, Unterschrift); Kurier (Nachweis). Jede Person darf «Stopp» sagen.

**Dokumente:** die aus Abschnitt 6, dazu Hinweisblatt, Rechnung mit QR, Mahnung, Monatsblatt. Anrede an Dritte nach [S-07](../entscheide.md).

**Fragen beim Einrichten** (Vorschlag): Betriebsarten; Personen und Aushilfen (1 Person: «Schlank»); Kanton und Gemeinde des Magazins; Fahrzeug über 3,5 t (Prüfungen an); Möbellift, Lager; übliche Preisart; Bargeld am Einsatzort (Fahrerkasse); MWST und Methode (Sätze trägst du ein); Sprachen der Equipe; wer rapportiert (ab zwei Teamleitungen Papier bis zur Kopplung). «Schlank»: Offerte, Plan, Rapport, Rechnung, Kasse; «Üblich»: dazu Besichtigung, Schäden, Zeit, Belege, Fahrzeuge; «Alles»: dazu Räumung, Lager, Kurier, Material, Kopplung.

## 8. Rollen und Arbeitsplätze

| Rolle | Sieht und tut | Sieht nie | Gerät | Tab-Leiste |
| --- | --- | --- | --- | --- |
| Inhaber:in | alles | – | iPad, Handy, Computer | Heute · Anfragen · Plan · Rechnungen · Mehr |
| Büro und Disposition | Anfragen, Offerten, Plan, Halteverbote, Rechnungen, Belege, Stunden aller | Margen, Löhne (Option), Rechte | Computer, iPad | Heute · Plan · Rechnungen · Kundschaft · Mehr |
| Besichtigung und Offerte | Anfragen, Besichtigung, Offerte mit Preisen | Löhne, Kasse, Margen (Option) | iPad, Handy | Heute · Besichtigung · Offerten · Mehr |
| Teamleitung | eigene Einsätze mit Zugangshinweis, Umzugsgutliste, Ladeliste; Rapport, Fotos, Schäden, Schlüssel, Unterschrift, Fahrerkasse; Stunden der Equipe | Preise (Dach nur in Minuten), Löhne anderer, fremde Kundschaft | Handy, ohne Netz | Heute · Rapport · Fotos · Kasse |
| Chauffeur:in | eigene Einsätze, Fahrzeug, Abfahrtskontrolle, km, Entsorgung | Preise, Löhne anderer | Handy | Heute · Fahrzeug · Entsorgung · Meine Stunden |
| Umzugsmitarbeitende, Lernende | eigene Einsätze, eigene Stunden; Lernende Checklisten | Kundschaft ausser heute, Preise, andere Personen | eigenes Handy (Option) | Heute · Meine Stunden |
| Aushilfe | kein Gerät; bestätigt Stunden bei der Teamleitung oder auf dem Monatsblatt | alles andere | – | – |
| Kurier:in | eigene Touren, Sendungen, Zustellnachweis | Preise ausser Zonentarif (Option) | Handy | Heute · Tour · Meine Stunden |

Reinigung am Abgabetag ist eine Rolle der Branche Facility. Externe bekommen Dateien, keine Rolle. Zugangshinweise sieht nur, wer den Einsatz hat, am Einsatztag ([S-11](../entscheide.md)).

## 9. Recht und Pflichten

**24.11.2026:** vom Kopf nachgeprüft. **Recherche:** der Branchen-Agent liest den Volltext (Quelle in der Recherche, Abschnitt 8) und trägt das Datum ein, bevor der Wert in die App kommt. **nicht bestätigt:** nicht in die App, auch nicht als Richtwert.

| Fakt | Wert | Quelle | geprüft am |
| --- | --- | --- | --- |
| GAV | kein allgemeinverbindlicher GAV für Umzug, Räumung oder Kurier gefunden; die SECO-Liste (Oktober 2026) war nicht abrufbar | [SECO](https://www.seco.admin.ch/de/gesamtarbeitsvertraege-bund) | nicht bestätigt |
| Mindestlohn Genf | 24.59 Franken pro Stunde (2026) | [ge.ch](https://www.ge.ch/actualite/salaire-minimum-genevois-2026-etablira-2459-fr-heure-1-10-2025) | 24.11.2026 |
| Mindestlohn Basel-Stadt | 22.20 Franken (2026), 22.50 (2027); nicht in Branchen mit AVE-GAV | [bs.ch](https://www.bs.ch/wsu/awa/arbeitsbeziehungen/loehne/mindestlohn/haeufige-fragen-zum-kantonalen-mindestlohn-faq) | 24.11.2026 |
| Weitere Mindestlöhne | Neuenburg 21.35; Tessin 20.00 bis 20.50; Stadt Zürich 23.90 ab 1.1.2027; Jura nur Sekundärquellen; weitere Städte offen | Recherche 8.1 | Recherche |
| Ferienlohn | 8,33 Prozent (4 Wochen), 10,64 Prozent (5 Wochen), separat ausweisen | Recherche 8.1 | Recherche |
| Arbeitszeit | Erfassung, 5 Jahre (ArG Art. 46, ArGV 1 Art. 73, 73b); Pausen (ArG Art. 15); Wegzeit (ArGV 1 Art. 13) | Recherche 8.2 | Recherche |
| Aushilfen | geringfügiger Lohn bis 2500 Franken (AHVV Art. 34d); Nichtberufsunfall ab 8 Stunden pro Woche (UVV Art. 13); Quellensteuer | Recherche 8.3 | Recherche |
| Ortung | Verhaltensüberwachung verboten, auch im Fahrzeug (ArGV 3 Art. 26) | Recherche 8.2 | Recherche; die App ortet nie |
| Sonntags- und Nachtfahrverbot | 22 bis 5 Uhr und Sonn- und Feiertage für Fahrzeuge über 3,5 t, Sattelmotorfahrzeuge über 5 t und Kombinationen mit Anhänger nach VRV Art. 91 (Wortlaut lesen); Sonderbewilligung beim Kanton | [ASTRA](https://www.astra.admin.ch/astra/de/home/fachleute/fahrzeuge/sonderbewilligungen/sonntags-nachtfahrten.html) | 24.11.2026 (Sattel und Anhänger ergänzt); Feiertage je Kanton: Recherche |
| Fähigkeitsausweis CZV | Kategorie C1, C berufsmässig; 5 Jahre gültig; Verlängerung mit 5 Tagen (35 Stunden) Weiterbildung | [berufsberatung.ch](https://www.berufsberatung.ch/de/aus-weiterbildungen/die-fahrermacher/berufsfahrer-in-czv-weiterbildungskurse) | 24.11.2026 |
| Führerausweis | B bis 3500 kg, C1 bis 7500 kg (VZV Art. 3) | Recherche 8.4 | Recherche |
| ARV 1, Fahrtschreiber | über 3,5 t Lenk- und Ruhezeit, Daten herunterladen (Art. 16a); Ruhezeit 9 oder 11 Stunden | Recherche 8.2 | Recherche |
| Lizenz, LSVA | Gütertransport über 3,5 t mit Zulassung des BAV (grenzüberschreitend ab 2,5 t); LSVA nach Gewicht und km, Tarife nicht in die App | Recherche 8.4 | Recherche |
| Sicherheit | sieben lebenswichtige Regeln Strassentransport; Heben gelegentlich 25 kg Männer, 15 kg Frauen (Richtwert); Hebezeuge nur nach Schulung; Branchenlösung (EKAS 6508), Zuordnung offen | Recherche 8.5 | Recherche |
| Asbest bei Räumung | bei Verdacht abklären (BauAV Art. 3); Fund: einstellen, benachrichtigen (Art. 32 Abs. 3) | [Suva](https://www.suva.ch/de-ch/praevention/nach-gefahren/gefaehrliche-materialien-strahlungen-und-situationen/asbest/rechtsgrundlage-und-arbeitnehmerschutz) | 24.11.2026 (Steckbrief Maler); Jahr 1990: Recherche |
| Halteverbot, Allmend | je Gemeinde Stelle, Frist, Gebühr; keine Gemeindewerte in der App | Recherche 8.6 | Recherche |
| Frachtvertrag | vorbehaltlose Annahme und Bezahlung löschen Ansprüche (OR Art. 452 Abs. 1); äusserlich nicht erkennbarer Schaden: Anzeige spätestens 8 Tage nach Ablieferung (Abs. 3) | [OR](https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de) | 24.11.2026 (über Zweitquelle) |
| Vertragsart | Fracht-, Werk- oder gemischter Vertrag: nicht belegt; OR Art. 373 bis 375 nur beim Werkvertrag | Recherche 8.7 | Recherche |
| Erben, Rückgabe, Verzug | Erben gemeinsam (ZGB Art. 602); Rückgabe mit Mängelrüge (OR Art. 267a); Verzugszins 5 Prozent (OR Art. 104); Belege 10 Jahre | Recherche 8.7 | Recherche |
| MWST | 8,1 Prozent; ab 100 000 Franken; Saldosteuersatz halbjährlich; seit 2025 mehrere Sätze ab 10 Prozent Umsatzanteil | Recherche 8.8 | Recherche |
| Saldosteuersatz | Recherche: Umzug 5,3, Velo- und Motorradtransport 6,2, Entsorgung 3,0 Prozent; die Prüfung fand nur ältere Fassungen mit anderen Werten | [ESTV](https://www.estv.admin.ch/de/mwst-saldosteuersatzmethode-2025) | nicht bestätigt; der Betrieb trägt ein |
| Datenschutz | DSG Art. 6, 8, 19; Gesundheitsdaten (Art. 5); Meldung bei Verletzung (Art. 24) | Recherche 8.9 | Recherche |
| Sonderabfall | nur über berechtigte Entsorger mit Begleitschein; VeVA und VREG nicht belegt | Recherche 8.10 | Recherche |

**Die App** erinnert, weist nach und zeigt Hinweise mit Quelle. Sie speichert keine Zugangscodes, keine Werte von Gegenständen (ausser einem deklarierten Lagerwert), keine Ortsdaten in Fotos und ortet niemanden. **Sie tut nie:** Schaden oder Haftung beurteilen, die Vertragsart bestimmen, Fahrtschreiber-Daten auswerten, Lohn als korrekt bestätigen, Asbest beurteilen, bei Gemeinde, Kanton, Versicherung oder Behörde melden.

## 10. Geräte und Abgleich

| Lage | Typisch | Stufe 1 ohne JA | Nach JA ([S-06](../entscheide.md)) |
| --- | --- | --- | --- |
| L1 allein | Kurier, kleine Räumung | ein Gerät; Sicherung als Datei | – |
| L2 Handy und Laptop | Inhaber:in leitet die Equipe | Hauptgerät fährt mit | Kopplung zu Hause im WLAN |
| L3 Equipen im Magazin | zwei Equipen und mehr | Tagesblatt und Rapport als PDF mit QR, Papier, Foto zurück | morgens Mappe, abends Stempel, Stunden, Fotos, Schäden, Unterschriften, Kasse als Befehle; Päckli |

Alles geht ohne Netz (Treppenhaus, Keller, Tiefgarage). Fotos verkleinert, ohne Ortsdaten, auf dem Aussendienst-Gerät nach dem Abgleich gelöscht (Antrag). **Nie aufs Handy:** Ansätze, Offertsummen, Margen, Löhne, Rechnungen, Stunden und Kasse anderer, Codes, Werte; Umzugsgutliste und Zugangshinweis nur für die eigenen Einsätze des Tages ([S-11](../entscheide.md)). **Erst Stufe 2** ([S-14](../entscheide.md)): Live-Plan, Umzugsgutliste und Offerte über einen Link der Kundschaft (P-63), Zusagen von Aushilfen per Link.

## 11. Wörter

Objekt heisst Adresse (Ladeort, Entladeort); Werkhof heisst Magazin; Team heisst Equipe; Einsatz heisst Einsatz oder Umzugstag; Rapport heisst Einsatzrapport; Kasse der Teamleitung heisst Fahrerkasse; Regie heisst «nach Aufwand». **Fürs Glossar:** Umzugsgutliste, Ladevolumen, Stauzuschlag, Nutzvolumen, Nutzlast, Zugangsfaktor, Tragweg, Möbellift, Halteverbot, Allmend, Durchlaufposten, ungefährer Kostenansatz, Fahrerkasse, Vorschaden, Ablieferung, Wiegeschein, Fraktion, Begleitschein, Fundprotokoll, besenrein, Zustellnachweis, Fähigkeitsausweis, Fahrtschreiber, LSVA.

## 12. MVP und Pakete

**MVP** (Pilot 4 bis 8 Wochen, ein Hauptgerät; weitere Teamleitungen mit Papier bis [S-06](../entscheide.md)):

1. Einrichten mit Betriebsart, Vorlagen, Rollen; Kundschaft mit Adresse nach dem Umzug; Lade- und Entladeort mit Zugang.
2. Besichtigung mit Umzugsgutliste, Fotos, Volumen und Zeit aus Richtwerten des Betriebs, ohne Netz.
3. Offerte als PDF mit Preisart, Optionen und Annahmen; Annahme; Auftrag mit Einsatztagen.
4. Einsatzplan mit Equipe, Fahrzeugen, Möbellift, Halteverbot und Warnungen; Tagesblatt.
5. Einsatzrapport ohne Netz: Zeitstempel, Personen, Fahrzeuge, Zusatzleistungen, Vorschäden und Schäden, Schlüssel, Unterschrift.
6. Rechnung aus dem Rapport mit QR, Kostendach, Anzahlung; Barquittung, Fahrerkasse; Mahnung an die neue Adresse.
7. Entsorgung am Auftrag mit Wiegeschein und Weiterverrechnung.
8. Stunden der Equipe und der Aushilfen aus dem Rapport, Monatsblatt, Lohn-Vorbereitung; Belege und Monatspaket.

| Paket | Ziel | Abnahme (ganz im Auftrag) |
| --- | --- | --- |
| B-1 Gerüst und Einrichten | Betrieb richtet sich als Umzug, Räumung, Kurier oder Lager ein | `pnpm check:industry moving` grün; Antworten schalten die richtigen Funktionen |
| B-2 Besichtigung und Umzugsgutliste | Volumen und Zeit ohne Netz | Prüfbeispiel 6.1 exakt; leerer Richtwert zeigt «Wert fehlt» |
| B-3 Offerte und Abrechnungsart | Offerte ohne Abtippen | Annahmen aus der Schätzung; capMin exakt |
| B-4 Einsatzplan und Halteverbot | Konflikte vor dem Umzugstag | Warnungen aus 6.3; Tagesblatt ohne Preise und Codes |
| B-5 Einsatzrapport und Übergabe | Rapport mit Unterschrift vor Ort | Prüfbeispiel 6.4 exakt; gesperrt nach Unterschrift |
| B-6 Abrechnung und Fahrerkasse | Rechnung am selben Abend | Prüfbeispiel 6.2 exakt |
| B-7 Entsorgung | jede Gebühr am Auftrag | Prüfbeispiel 6.7 exakt; Nachweis als PDF |
| B-8 Stunden und Regelwerk | Stunden der Aushilfen für die Treuhand | nur geprüfte Werte; Ferienlohn exakt |
| B-9 Schäden und Fristen | Schaden mit Vorschaden und Frist | Tage ohne Urteil |
| B-10 Räumung und Fundsachen | Berechtigung und Fundprotokoll | Planen erst mit Berechtigung |
| B-11 Fahrzeuge, Material, Mappe (W3) | Fristen, Mietkartons, Mappe | Mappe ohne Preise |
| B-12 Einlagerung und Kurier (W3, W4) | Lager und Touren | Prüfbeispiele 6.8 exakt |

**Vor dem Pilot:** B-9, B-10 (wenn der Pilot räumt). **Welle 3:** B-11, Kurier, Kopplung ([S-06](../entscheide.md)), Sprachen im Aussendienst ([S-07](../entscheide.md)), Lernen aus Rapporten. **Welle 4:** Einlagerung. **Bewusst nie:** Ortung; Anbindung an Offertenplattformen, Banken, Versicherungen, Gemeindeportale, Zoll, LSVA-Erfassung oder Fahrtschreiber-Programme; Auswertung von Fahrtschreiber-Daten; Tourenoptimierung mit Kartendienst; Vermittlung von Aufträgen oder Aushilfen; Vertragsbedingungen der App oder Kopien von Verbandsbedingungen; Video mit Aufzeichnung; Versicherungen vermitteln; Lohnabrechnung mit Auszahlung; Zugangscodes.

## 13. Demo-Betrieb

**Zügelei Muster GmbH**, Musterweg 12, 8000 Beispielstadt; Kanton der Demo ohne Mindestlohn; 7 Festangestellte, 6 Aushilfen; Saldosteuersätze als Demo-Eingabe; Endreinigung über einen Partnerbetrieb. Team: A. Muster (Inhaberin), B. Muster (Büro 50 Prozent), C. Muster (Teamleiter und Chauffeur, C1, Fähigkeitsausweis bis 2028, Albanisch), D. Muster (Teamleiterin, Möbellift instruiert), E. Muster (Chauffeur, C, Fähigkeitsausweis läuft in 3 Monaten ab, Portugiesisch), F. und G. Muster (Umzugsmitarbeitende), Aushilfen 1 bis 6 (zwei unter 8 Stunden pro Woche). Fahrzeuge: MU 1 Lieferwagen 16 000 l, 1000 kg Nutzlast; MU 2 Lieferwagen 18 000 l, 900 kg; MU 3 Lastwagen 7500 kg, 38 000 l, 2800 kg, Fahrtschreiber; Lift 1. Kundschaft: Familie Muster, Privatkunde Muster, Verwaltung Muster AG, Erbengemeinschaft Muster (vertreten durch die Willensvollstreckerin), Praxis Muster, Möbelladen Muster.

| Auftrag | Preisart | Stand | Zeigt |
| --- | --- | --- | --- |
| A-2026-101 Familie Muster, 4½ Zimmer, 3. Stock ohne Lift | nach Aufwand mit Kostendach | ausgeführt | Prüfbeispiele 6.1, 6.2, 6.4; Halteverbot an zwei Adressen; Vorschaden Esstisch; Schaden nach 5 Tagen |
| A-2026-102 Privatkunde Muster, 2 Zimmer | Pauschal | geplant | MU 2, 20 Kartons ausgeliehen, 18 zurück |
| A-2026-103 Erbengemeinschaft Muster | nach Aufwand | in Arbeit | Berechtigung, Bargeld zu zweit gezählt, Prüfbeispiel 6.7 |
| A-2026-104 Praxis Muster, Samstag | Pauschal | Offerte ausgestellt | Etiketten je Arbeitsplatz, Samstagszuschlag, Nachfassen |
| A-2026-105 Verwaltung Muster AG, Keller | Pauschal | angefragt | Räumung besenrein, Abgabeprotokoll |
| K-2026-0311 Möbelladen Muster | Zonentarif | Monat offen | 14 Sendungen, Sammelrechnung |

**Ein Tag:** A-2026-101 mit C. Muster, D. Muster, F. Muster und Aushilfe 1, MU 3 und MU 1, Zeiten aus 6.4; geschätzt 8 h 21 min, verrechenbar 8 h 45 min, Dach bei 8 h 25 min; 2 Lampen montiert. Ansätze sind Testwerte (Person 7000, Lieferwagen 4000, Lastwagen 6000 Rappen je Stunde).

## 14. Risiken und offene Fragen

| Risiko oder Frage | Folge | Was hilft, wer entscheidet |
| --- | --- | --- |
| Vertragsart des Umzugs offen | falsche Frist | Tatsache mit Quelle, nie Urteil; Fachperson vor dem Pilot ([S-17](../entscheide.md)) |
| Lohn für Aushilfen, Mindestlöhne in Bewegung | Fehler bei Kontrollen | nur geprüfte Werte, Prüfung jeden Januar; Fachperson ([S-17](../entscheide.md)) |
| Aushilfen und Bargeld | App als Werkzeug für ungemeldete Löhne | jede Stunde ins Ledger; keine Funktion «bar ohne Abrechnung» |
| Fahrzeugpflichten über 3,5 t | falsche Sicherheit | Hinweise mit Quelle, keine Auswertung von Fahrtschreibern |
| Zugangscodes (die Recherche wollte sie speichern) | verlorenes Handy öffnet eine Wohnung | keine Codes ([S-11](../entscheide.md)) |
| Mehrere Teamleitungen ohne Kopplung | Rapport auf Papier | ein Hauptgerät im MVP; [S-06](../entscheide.md) |
| Umzugsgutliste und Offerte per Link der Kundschaft | braucht einen Server | Stufe 2 ([S-14](../entscheide.md)) |
| Endreinigung: Facility einschalten oder Partner; GAV Reinigung? | Umfang, Regelwerk | Facility in derselben Ausgabe ([S-01](../entscheide.md)); Unterstellung: Fachperson ([S-17](../entscheide.md)) |
| Kurier als Betriebsart oder eigene Branche; Meldepflicht offen | Umfang | Kopf als ADR nach dem Pilot |
| Pilotbetrieb und Sprachen der Equipe | Reihenfolge, Übersetzung | Alban ([S-09](../entscheide.md), [S-07](../entscheide.md)) |
| Saldosteuersatz nicht bestätigt | falscher Hinweis | Betrieb trägt seine Sätze ein |
| Personenschaden | Gesundheitsdaten | nur Datum der Meldung ([S-12](../entscheide.md)) |
| Adresse an die Karten-App, Bankdatei | Datenfluss, Kern des Nutzens | [S-16](../entscheide.md), [S-08](../entscheide.md) |

## 15. Absehbare Plattform-Anträge

| Antrag | An | Zweite Branche |
| --- | --- | --- |
| Kern der Fahrzeuge als «alpha» in W2: Gesamtgewicht, Nutzlast, Nutzvolumen, Fahrtschreiber; Ausweise und Fähigkeitsausweis je Person; Belegung | P-42 | Gebäudehülle, Garten |
| Einheiten Personenstunde, Fahrzeugstunde, Tag, Monat; Volumen in Litern | P-01, P-24 | Garten, Facility |
| Preisart «ungefährer Kostenansatz»; Kostendach mit Umfang; verrechenbare Zeit aus Zeitstempeln; Status «verloren» mit Grund | P-25 | Maler, Haustechnik |
| Offerte mit Optionen, Varianten, Durchlaufposten; Anzahlung; 5-Rappen-Rundung; Sammelrechnung | P-29 | Maler, Gebäudehülle |
| Adresse ab Datum (nach dem Umzug), «vertreten durch» | P-22 | Facility, Beherbergung |
| Rapportzeile «Zusatz» mit Bestätigung; Bestätigung der Stunden auf fremdem Gerät | P-25, P-31 | Facility, Maler |
| Schlüsselübergabe als Ledger | P-23 oder P-25 | Facility |
| Entsorgungsnachweis | P-27 oder P-41 | Maler, Garten |
| Bewilligung auf öffentlichem Grund mit Gemeinde-Vorlage | P-23, P-28 | Gebäudehülle, Maler |
| Fotos ohne Ortsdaten, Löschfrist auf dem Aussendienst-Gerät | P-10, P-33, P-40 | alle Aussendienst-Branchen |
| Unterweisung je Gerät als Bedingung im Plan | P-27, P-42 | Gebäudehülle, Garten |
| Schadstoffhinweis am Objekt | P-23 oder P-27 | Maler, Gebäudehülle |

## 16. Stand

Steckbrief vom 24.11.2026, noch nichts gebaut.

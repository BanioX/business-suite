# Dachdecker, Spengler, Fassade und Gerüst (Gebäudehülle)

- **Kennung im Code:** `envelope` (Präfix für Tabellen, Operationen, Funktionen; ADR-Präfix `ENV`); Betriebsarten `envelope.roofing`, `envelope.sheet_metal`, `envelope.facade`, `envelope.scaffolding`
- **Ausgabe:** Vor Ort ([S-01](../entscheide.md))
- **Welle:** W3 ([Fahrplan](../fahrplan.md)); die Recherche empfiehlt W2, der Fahrplan setzt W3, weil Equipen ohne Kopplung (P-40) nur halb versorgt sind
- **Eignung:** 4 – Dachaufnahme mit Ausmass, Regie mit Unterschrift, Wetterentscheid und Sicherheit in der Höhe lösen tägliche, teure Schmerzen und nutzen fast jedes Plattform-Modul; Absturz, Asbest und drei Gesamtarbeitsverträge verlangen sorgfältige Texte mit Quelle.
- **Recherche:** [`gebaeudehuelle-recherche.md`](gebaeudehuelle-recherche.md) · **Auftrag:** [`../auftraege/branche-gebaeudehuelle.md`](../auftraege/branche-gebaeudehuelle.md)

## 1. Kurzbild

| Frage | Antwort |
| --- | --- |
| Wie viele | Gebäudehüllengewerbe rund 1000 Betriebe, rund 8500 Beschäftigte; Gerüstbau 359 Betriebe, 3124 Beschäftigte (EKAS, Branchenlösung 12, 2022; Lesart der Spalten zu prüfen). Spenglereien zählen zur Gebäudetechnik. BFS STATENT je NOGA-Art: nicht belegt |
| Grösse | Spenglerei 1 bis 10, Steildach 2 bis 15, Flachdach und Fassade 3 bis 20, Gerüstbau 3 bis 30 Personen; fast alle unter 50 |
| Wer arbeitet | Inhaber:in (Meister:in, oft auf dem Dach, abends Büro), Büro 20 bis 60 Prozent, ab etwa 10 Personen Projektleitung, je Equipe ein:e Vorarbeiter:in, Facharbeitende, Angelernte, Bauarbeitende, Temporäre, Lernende (EFZ 3 Jahre, Spengler:in 4, EBA 2), ab etwa 8 Personen Magazin; extern Treuhand, Gerüstbau, Kran |
| Sprachen | nicht belegt; Annahme: neben Deutsch Portugiesisch, Italienisch, Albanisch, Bosnisch-Kroatisch-Serbisch, Spanisch, Türkisch ([S-07](../entscheide.md)) |
| Aussendienst | Einschätzung über 80 Prozent der Stunden auf Dach, Gerüst, Fassade; mit Handschuhen, oft ohne Netz |
| Saison | Winter Reparaturen, Werkstatt, Offerten, Lohnanpassung per 1. März; Frühling Sturmschäden; Sommer Hauptsaison, Hagel, Hitze; Herbst Dächer schliessen, Rinnenreinigung; Dezember Schlussrechnungen |

## 2. Teilbranchen und Betriebsarten

Mehrfach wählbar; ein Allrounder wählt Dach und Spenglerei. Blitzschutz, Solar-Montage, Unterhalt und Reparaturdienst sind Funktionen. Bei einer Person: Umfang «Schlank», Regie als Standard-Preisart.

| Betriebsart | Kennung | Was sie tut | Startfunktionen |
| --- | --- | --- | --- |
| Steildach und Flachdach | `envelope.roofing` | Deckungen, Lattung, Unterdach, Dämmung, Dachfenster; Abdichtung, Abläufe, Begrünung | Aufnahme, Ausmass, Offerte, Wetter, Rapport, Sicherheit, Schadstoffe, Abnahme, Schadenfall; Option «Flachdach» |
| Spenglerei | `envelope.sheet_metal` | Rinnen, Ablaufrohre, Anschluss- und Abdeckbleche, Blechdächer, Werkstatt | wie Dach, Abwicklung im Ausmass |
| Fassadenbau | `envelope.facade` | hinterlüftete Fassaden, Unterkonstruktion, Bekleidung, Leibungen | Aufnahme mit Fassadenflächen, Ausmass, Offerte, Baustelleneinrichtung, Sicherheit, Schadstoffe |
| Gerüstbau | `envelope.scaffolding` | Fassaden-, Dachfang-, Roll-, Treppengerüste, Notdächer, Vermietung mit Montage | Gerüstaufträge mit Übergabe und Standzeit, Ausmass Gerüst, Offerte, Sicherheit, Rapport |

## 3. Alltag

- **Aufträge:** Reparatur (Regie), Unterhalt (Pauschale plus Regie), Sanierung (Einheitspreis oder Pauschal, Nachträge), Neubau (Einheitspreis, Akonto, Schlussausmass), Schadenfall (Notmassnahme in Regie, dann Offerte), Gerüst (m² und Standzeit).
- **Ablauf:** Anfrage mit Fotos › Triage (undicht oder planbar) › Dachaufnahme mit Leiter, Laser, Fotos, Baujahr › abends Ausmass und Offerte › nachfassen › planen (Equipe, Gerüst, Kran, Mulde, Bewilligung, Asbest-Abklärung) › Einsatz mit Wetter › Zusatz mündlich › Abnahme oft ohne Protokoll › Rechnung › mahnen › Garantie und Unterhalt aus dem Kopf.
- **Tag:** 06:30 Magazin, laden, Wetter; Gerüst und Zugang prüfen; Überraschung (morsche Latten, Asbestverdacht); Gewitter: Dach schliessen; 16:30 «Dach dicht», Rapport auf Papier, oft erst am Freitag. Inhaber:in abends: Ausmass, Offerten, Rechnungen, Fotos aus dem Messenger.
- **Woche, Monat, Jahr:** Montag Wochenplan, täglich umplanen, Freitag Rapporte und Standzeiten; monatlich Stunden, Akonto, Belege, Prüftermine; jährlich Lohnanpassung, MWST, Unterhalt im Herbst.
- **Heute:** Notizzettel, Tabellenkalkulation, Wandtafel, Papier-Rapport, Messenger-Gruppe mit Kundendaten auf Privathandys.

## 4. Schmerzen

Gewichtung aus der Recherche, im Pilot zu messen.

1. Wetter wirft den Plan um; Gerüst, Kran, Mulde und Kundschaft müssen mit.
2. Offerte mit Ausmass kostet Abende; Neigung und Längen werden falsch gerechnet.
3. Rapporte und Stunden kommen spät und unvollständig ins Büro.
4. Regie und Nachträge ohne Unterschrift werden nicht verrechnet.
5. Sicherheit in der Höhe: bei Kontrolle oder Unfall fehlen Nachweise.
6. Asbest bei Gebäuden vor 1990: Stillstand, unklare Kosten, falsche Entsorgung.
7. Rechnung spät, Pfandrechtsfrist verpasst, Unterhalt vergessen.
8. Drei GAV mit Kategorien, Stufen und jährlicher Anpassung.

**Warum keine Software:** Einführung am Abend, Programme für Betriebe mit Büro, Bedienung mit Handschuhen, viel Text auf Deutsch, kein Netz, Misstrauen gegenüber fremden Servern. **Was bewegt:** Offerte am selben Abend, Rapport in zwei Minuten mit Unterschrift, Umplanen in Minuten, Sicherheit zum Vorzeigen, kein Konto, läuft ohne Netz.

## 5. Plattform-Module

| Modul | Wofür, Einstellungen der Branche | M/S/K |
| --- | --- | --- |
| P-20 Betrieb und Personen | Rechtsform, Kanton, MWST-Art, Bank für QR; Saldosteuersatz trägt der Betrieb ein | M |
| P-21 Rollen und Rechte | Rollen aus 8; heikel: Löhne, Preise und Deckungsbeitrag, Sicherheitsplan freigeben, Schadstoff-Verdacht aufheben, Zugangshinweise | M |
| P-22 Kundschaft | Private, Stockwerkeigentum, Verwaltung, Architekturbüro, Generalunternehmen, öffentliche Hand; Kontakt vor Ort | M |
| P-23 Objekte und Standorte | Gebäude; Anlagen mit Intervall (Anschlageinrichtung, Sicherheitshaken, Blitzschutz, Solar, Schneefang); Zugang ohne Codes ([S-11](../entscheide.md)) | M |
| P-24 Leistungen und Material | Vorlage aus 7 ohne Ansätze; Einheiten m², m, m³, Stk., h, pauschal, t, Tag, m²·Woche (Antrag 6) | M |
| P-25 Aufträge, Einsätze, Rapporte | Preisarten, Ausmass mit Formelsatz der Branche, Einsatz, Rapport, Nachtrag, Abnahme | M |
| P-26 Pläne und Wiederkehr | Kontrollgänge, Rinnenreinigung, Prüfintervalle | S |
| P-27 Checklisten und Nachweise | Vorlagen aus 7, Ergebnis «Stopp», Stopp-Meldung, Ausbildungsnachweise | M |
| P-28 Kalender und Erinnerungen | Wochenplan, Nachfassen, Prüfdaten, Standzeit, Bewilligung, Garantie, Pfandrecht | M |
| P-29 Offerten und Rechnungen | Varianten, Akonto-, Schluss- und Regierechnung, QR, Mahnung | M |
| P-30 Kasse und Belege | Händler, Kran, Mulde, Entsorgung, Treibstoff | S |
| P-31 Team und Zeit | Stunden aus dem Rapport, Ausfall Wetter getrennt, Regelwerk je Person | M |
| P-32 Heute | Einsätze mit Wetterstatus, offene Stopps und Rapporte, fällige Prüfungen | M |
| P-33 Fotos und Dateien | Fotos am Objekt, an der Fläche, am Einsatz; vorher, nachher, Schaden, Schadstoff | M |
| P-40 Kopplung und Abgleich | Mappe ohne Preise, Befehle abends im Magazin; bis zum JA Papier ([S-06](../entscheide.md)) | M |
| P-41 Material und Lager | Ziegel, Bahnen, Blech in Tafeln und Coils, Reststücke | S |
| P-42 Fahrzeuge und Geräte | Kranwagen, Aufzug, Hubarbeitsbühne, Leitern, PSAgA, Kranbuch, Ausweise | S |
| P-50 Termine | Besichtigungen | K |
| P-51 Verträge und Mitgliedschaften | Unterhaltsverträge | S |
| P-52 Kurse mit Plätzen | – | – |

Dazu P-06 (Einrichten, Gerätemodus «Equipe»), P-07 (Lexikon), P-10 (Kamera mit Fallback, Unterschrift), P-11 (Stile «Übersicht», «Formular»).

## 6. Eigene Module der Branche

Alle Tabellen tragen `businessId`. Längen in Millimeter, Flächen, Volumen und Mengen in Tausendstel, Winkel und Temperaturen in Zehntelgrad, Geld in Rappen, Sätze in Basispunkten, alles Ganzzahlen. «H, A»: Heikelkeit (n, i, h) und Abgleich-Art ([ADR-0005](../adr/0005-gemeinsames-datenmodell.md)). **K** = Kandidat für die Plattform (Abschnitt 15). Funktionen: `envelope.survey`, `envelope.measurement`, `envelope.quoting`, `envelope.weather_plan`, `envelope.reports`, `envelope.height_safety`, `envelope.hazmat`, `envelope.billing`, `envelope.warranty`, `envelope.site_logistics`, `envelope.maintenance`, `envelope.damage_claims`, `envelope.labor_rules`; später `envelope.workshop`, `envelope.scaffold_rental`, `envelope.lightning`, `envelope.solar_mounting`. Sicherheit in der Höhe lässt sich nur mit Recht «Einstellungen» und Hinweis ausschalten.

### 6.1 Dachaufnahme (`envelope.survey`)

Einmal aufnehmen, über Jahre nutzen. Gebäude, Anlagen und Zugangshinweise sind P-23.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `envelope_building_profiles` | siteId, buildYear (leer = unbekannt), roofRenovationYear, facadeRenovationYear, roofAccess | n, ein Schreiber |
| `envelope_surveys` | jobId, siteId, date, personId, status (`draft`, `measured`, `closed`), openQuestions | n, ein Schreiber |
| `envelope_surfaces` | surveyId, kind (`roof`, `facade`), name, shape, planLengthMm, planWidthMm, heightMm, pitchDeciDeg, eaveOverhangMm, vergeOverhangMm, covering (u. a. `fibre_cement`), insulationMm, condition, fileIds | n, ein Schreiber |
| `envelope_edge_lines` | surfaceIds, kind (`eave`, `ridge`, `hip`, `valley`, `verge`, `abutment`), planLengthMm, riseMm | n, ein Schreiber |
| `envelope_openings` | surfaceId, kind (Dachfenster, Kamin, Ablauf, Notüberlauf, Fenster …), widthMm, heightMm, count, fragile (`yes`, `no`, `unknown`) | n, ein Schreiber |

Geführte Folge: Baujahr › Flächen › Linien › Öffnungen › Zugang und Sicherheitsausstattung › Zustand › Fotos › Fragen; ohne Netz, Kamera nur nach Tipp, keine Koordinaten ([S-16](../entscheide.md)). Dokumente: Dachaufnahme, Objektblatt fürs Team (Zugang ohne Code, Anschlageinrichtungen mit Prüfdatum, nicht durchbruchsichere Flächen).

### 6.2 Ausmass und Materialauszug (`envelope.measurement`)

Das Ausmass ist P-25; die Branche liefert Formelsatz, Verknüpfung zur Aufnahme und Materialauszug, für Offerte und Schlussrechnung gleich.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `envelope_measure_links` | measurementLineId (P-25), source (`surface`, `edge_line`, `opening`, `scaffold`), sourceId, formulaKey | n, ein Schreiber |
| `envelope_material_rules` **K** | catalogItemId, materialId (P-41), perUnitMilli, wasteBp, overlapBp, packSizeMilli | i, ein Schreiber |
| `envelope_sheet_profiles` | legsMm, seamAllowanceMm, material, thicknessHundredthMm, sheetWidthMm | n, ein Schreiber |

| Grösse | Formel |
| --- | --- |
| Neigung, Fläche | Prozent = tan α × 100; geneigte Fläche = Grundriss ÷ cos α |
| Satteldach | Sparren s = (Tiefe ÷ 2 + Vorsprung Traufe) ÷ cos α; Trauflänge L = Länge + 2 × Vorsprung Ortgang; Fläche = 2 × L × s |
| Grat, Kehle | √(Grundrisslänge² + Höhenunterschied²) |
| Abzüge, Fassade | Σ (B × H) − Öffnungen über `openingDeductionThresholdM2` (leer = alle; kein Standard, SIA-Regel nicht geprüft); Leibung 2h + b |
| Gerüst | (Länge + Eckzuschläge) × Höhe; Standzeit = ⌈Tage ÷ 7⌉ Wochen (Option anteilig) |
| Material | Ziegel ⌈F × Stück je m² × (1 + V)⌉; Bahnen ⌈F × Lagen × (1 + Ü + V) ÷ Rolle⌉; Lattung F ÷ Lattweite × (1 + V); Sparren je Seite ⌈L ÷ Abstand⌉ + 1; Halter ⌈Rinne ÷ Abstand⌉ + 1 |
| Blech | Zuschnitt = Σ Schenkel + Falzzugaben; Streifen = ⌊Tafelbreite ÷ Zuschnitt⌋; Tafeln = ⌈Teile ÷ Streifen⌉; Gewicht = F × Dicke × Dichte |
| Zeit | Stunden = Σ Menge × Leistungswert × (1 + Zuschläge); Personenarbeitstage = Stunden ÷ Tagessoll, eine Stelle |

Jede Grösse wird aus den Eingaben gerechnet, nie aus gerundeten Zwischenzeilen; nur Winkelfunktion, Wurzel und Division rechnen mit Gleitkomma; das Ergebnis wird einmal kaufmännisch auf 1 mm oder 0,001 gerundet, Stück, Rollen, Tafeln aufgerundet; die Formel steht mit den eingesetzten Werten daneben. Fehlt ein Wert: «Mass fehlt», «Verbrauch fehlt», «Leistungswert fehlt».

**Prüfbeispiel** (Testwerte, keine Empfehlung): Satteldach 12,000 × 10,000 m, 35,0 Grad, Vorsprung Traufe 0,600, Ortgang 0,400: s 6,836 m; L 12,800 m; Fläche 175,010 m²; Ziegel (13,5 je m², 5 Prozent) 2481; Lattung (0,340 m, 5 Prozent) 540,473 m; Konterlattung (0,800 m) 2 × 17 Sparren, 232,435 m; Unterdach (75 m², 10 und 5 Prozent) 3 Rollen; Halter (0,600 m, zwei Rinnen) 46; Gerüst (Eckzuschlag 1,000, Höhe 7,500, beidseits) 222,000 m²; Stunden (0,65 h je m² × 1,10, Rinne 25,600 m × 0,35 h) 134,092 h; Tagessoll 8,5 h: 15,8 Personenarbeitstage. Flachdach 24 × 16 m, zweilagig, Rolle 10 m², Zuschlag 10 Prozent: 85 Rollen. Fassade Umfang 46,000 × 8,500 m minus 18 Fenster 1,200 × 1,400: 360,760 m². Mauerabdeckung 415 mm Zuschnitt, Tafel 1000 mm: 2 Streifen, 9 Teile zu 2 m, 5 Tafeln, 0,70 mm bei 7,2 kg/dm³: 37,649 kg.

### 6.3 Offerte und Nachtrag (`envelope.quoting`)

Offerte P-29, Nachtrag P-25; Ansätze für Regie, Kran, Mulde, Entsorgung sind Leistungen in P-24. `envelope_item_mappings` (catalogItemId, sourceKind, match; i, ein Schreiber) ordnet Deckungen, Linien und Öffnungen Positionen zu; `envelope.quote.fromMeasurement` füllt die Offerte. Zeilentotal = round(Menge in Tausendstel × Einheitspreis in Rappen ÷ 1000), kaufmännisch; Varianten nicht im Total (Antrag 5). Deckungsbeitrag = Preis netto − (Stunden × interner Satz + Material + Fremdleistungen), berechnet, nur mit Recht. Die Offerte nennt ihre Preisart mit Quelle (OR Art. 373 bis 375); Nachfassen nach Frist des Betriebs (Vorschlag 10 Tage).

### 6.4 Wetterentscheid und Wochenplan (`envelope.weather_plan`)

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `envelope_weather_rules` | workKind (offene Dachfläche, Bahnen schweissen, Kran, grosse Platten, Gerüst …), condition (Regen, Wind, Temperatur, Frost, Gewitter, Schnee), threshold, outcome (`go`, `doubtful`, `no_go`) | i, ein Schreiber |
| `envelope_weather_decisions` | visitId (P-25), status (`go`, `doubtful`, `postponed`), decidedBy, decidedAt, reason, observedWeather | n, Ledger |
| `envelope_visit_dependencies` **K** | visitId, dependsOnVisitId, kind | n, ein Schreiber |
| `envelope_lost_time` **K** | visitId, personId, minutes, reason (`weather`, `material`, `third_party`), basisNote | i, Ledger |

Grenzwerte starten leer (Richtwerte des Betriebs, nicht belegt). Am Vorabend oder um 6 Uhr setzt Inhaber:in oder Vorarbeit den Status; das Wetter trägt die Person von Hand ein ([S-15](../entscheide.md)). «verschoben» schlägt vor: abhängige Einsätze und Reservationen (6.5) mitziehen, Ersatzeinsatz, Textvorlagen an Kundschaft, Gerüstbau, Kran, Mulde zum Teilen. Ob eine Kasse oder der GAV Ausfall entschädigt, entscheidet nie die App. Dokumente: Wochenplan je Equipe, Einsatzblatt mit QR.

### 6.5 Baustelleneinrichtung (`envelope.site_logistics`)

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `envelope_scaffold_orders` | jobId, supplierContactId (leer = eigener Betrieb), kind, areaMilli, heightMm, erectOn, dismantleOn | n, ein Schreiber |
| `envelope_scaffold_handovers` | scaffoldOrderId, date, takenOverBy, checklistRunId (P-27), restrictions, signatureFileIds | n, Ledger, gesperrt nach Unterschrift |
| `envelope_crane_bookings` | jobId, visitId, kind, providerContactId, date, from, to, permitId | n, ein Schreiber |
| `envelope_skip_orders` | jobId, sizeMilliM3, content (Asbest getrennt), placedOn, collectedOn, wasteRecordId | n, ein Schreiber |
| `envelope_public_space_permits` **K** | jobId, municipality, from, to, appliedOn, grantedOn, feeRappen, fileId | i, ein Schreiber |

Tägliche Sichtkontrolle: Durchgang von P-27 am Gerüst. Gerüstkosten = Fläche × Ansatz + Standzeit × Fläche × Mietansatz; Kran = Anfahrt + Stunden × Ansatz. Erinnerungen: Standzeit-Ende, Bewilligungsende, Mulde abholen. Das Gesuch stellt die Person selbst; die App liefert die Beilage.

### 6.6 Sicherheit in der Höhe (`envelope.height_safety`)

Prüfung vor dem Aufstieg, Sichtkontrolle, Hitze und PSAgA sind Checklisten von P-27, Stopp ist die Stopp-Meldung von P-27, Ausbildungen Nachweise von P-27, PSAgA und Kranbuch Geräte von P-42. Die Branche bringt `envelope_safety_plans` (jobId, siteId, fallHeightMm, pitchDeciDeg, collectiveMeasures, individualMeasure mit Anlage der Anschlageinrichtung, fragileSurfaces, access, rescuePlan, responsiblePersonId, approvedBy, approvedAt; i, ein Schreiber, nach Freigabe nur neue Fassung).

Hinweise mit Quelle (Abschnitt 9): Absturzsicherung an Dachrändern ab mehr als 2 m, bei Arbeiten von geringem Umfang ab mehr als 3 m; Kollektivschutz vor Anseilschutz; Anseilschutz nur bei Dacharbeiten bis zwei Personenarbeitstage. Der Plan zeigt die Personenarbeitstage aus dem Ausmass neben diesem Hinweis; wählt die Person nur Anseilschutz bei mehr als 2, steht der Hinweis vor der Freigabe, die Freigabe bleibt ihre. «Stopp» meldet sich bei Vorarbeit und Inhaber:in; der Einsatz zeigt «gestoppt» bis «gelöst durch … am …»; gesperrt wird nichts. Lernende im Einsatz: Hinweis ArGV 5 Art. 4. Nie «sicher» oder «gesichert» als Urteil der App; sie zeigt nur «geprüft von … am …» und «freigegeben von … am …». Keine Rangliste von Personen.

### 6.7 Schadstoffe und Entsorgung (`envelope.hazmat`)

Der Schadstoff-Fall am Objekt ist nach Maler die zweite Nutzung (Antrag 1); bis zur Antwort hinter dem Port `HazardRegister`.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `envelope_hazard_cases` **K** | siteId, component, material, reason (`build_year`, `material`, `finding`), status (`suspected`, `sampled`, `positive`, `negative`, `remediated`), reportFileId, liftedBy, liftReason | i, Ledger |
| `envelope_asbestos_works` | hazardCaseId, jobId, kind, guidanceRef (Suva-Factsheet als Text), instructedPersonIds, outsourced | i, ein Schreiber |
| `envelope_waste_records` **K** | jobId, fraction (u. a. `asbestos`), quantityMilli, unit, disposerName, documentFileId | n, Ledger |
| `envelope_disposal_concepts` | jobId, expectedWasteMilliM3, hazardsExpected, submittedOn | n, ein Schreiber |

Verdacht entsteht von selbst bei Baujahr vor 1990 oder leer und Faserzement, Kitt, Kleber oder Pappe (Jahr als Richtwert mit Quelle); aufheben nur mit Befund oder Begründung und Recht. Unerwarteter Fund: Stopp, Meldung an die Bauherrschaft als PDF (BauAV Art. 32 Abs. 3). Für erhebliche Faserfreisetzung bietet die App nur «Fremdvergabe an eine anerkannte Firma»; ob das zutrifft, entscheidet der Betrieb. Hinweis Entsorgungskonzept bei mehr als 200 m³ oder Schadstoffen (VVEA Art. 16), kantonale Schwelle als Option. Nie «asbestfrei», «unbedenklich», «Entwarnung».

### 6.8 Rapport, Abnahme, Abrechnung

- **Rapport** (`envelope.reports`, ergänzt P-25): `envelope_report_lines` (reportId, surfaceId oder edgeLineId, catalogItemId, quantityDoneMilli; n, Ledger), `envelope_report_conditions` (reportId, weather, temperatureDeciC; n, Ledger). Arbeitszeit = bis − von − Pause; Ausfall getrennt; Fortschritt = erledigt ÷ Offertmenge in Basispunkten; Regie = Σ Stunden × Ansatz + Material + Geräte.
- **Abnahme und Garantie** (`envelope.warranty`, Protokoll und Mängel in P-25): `envelope_job_terms` **K** (jobId, contractBasis `or`, `sia118`, `other`), `envelope_warranties` (jobId, component, startOn, manufacturerWarrantyEndsOn), `envelope_tightness_tests` (Flachdach). Erinnerungen mit Quelle und dem Satz «Im Streitfall entscheidet der Vertrag; frag deine Rechtsberatung.»: Verjährung = Abnahme + 5 Jahre, Hinweis Mängelrüge 60 Tage, SIA 118 nur wenn vereinbart, Garantiekontrolle 3 Monate vor Ablauf (Option).
- **Abrechnung** (`envelope.billing`, Port `InvoiceSource` an P-29): Pauschal + Nachträge; Schlussmenge × Einheitspreis mit Differenz zur Offerte; Regie aus unterschriebenen Rapporten; Gerüst nach 6.5; Schluss = Σ Positionen − Σ Akonto (netto) + MWST auf dem Rest. Pfandrecht: Erinnerung 4 Wochen vor Ablauf von 4 Monaten nach dem letzten pfandberechtigten Rapport, solange offen.

### 6.9 Unterhalt, Schadenfall, Regelwerk, Zusätze

- **Unterhalt** (`envelope.maintenance`): Wiederkehr über P-26, Vertrag über P-51 (W4, Antrag 13); Tour = Einsätze eines Tages in Reihenfolge von Hand (Antrag 12). `envelope_inspection_reports` (visitId, ratings je Bauteil `ok`, `watch`, `act`, findings, followUpQuoteId; n, Ledger). Fällig = letzter Besuch + Intervall oder fester Monat.
- **Schadenfall** (`envelope.damage_claims`): `envelope_damage_cases` (siteId, event `storm`, `hail`, `snow_load`, `water`, eventOn, urgency `leaking`, `danger_to_others`, `plannable`, insurerName als Text, claimRef, status), `envelope_damage_findings` (Bauteil, Fotos, Hagelwiderstand als Feld). Liste nach Dringlichkeit, dann Eingang; Notmassnahme als Regierapport; Schadenbericht schickt die Person.
- **Regelwerk** (`envelope.labor_rules`): Regelwerke für P-31 je Person: GAV Gebäudehülle, GAV Gebäudetechnik, GAV Gerüstbau, kantonal (Wallis), Arbeitsgesetz allein. `envelope_wage_classes` **K** (personId, ruleSetId, category `skilled`, `semi_skilled`, `construction_worker`, industryExperienceSince; h, ein Schreiber); Stufe aus Monaten Branchenerfahrung (bis 12, über 12, über 24). Mindestlohn nur mit «geprüft am», sonst «Wert fehlt».
- **Später:** Werkstatt Spenglerei mit Abwicklungsskizze, Gerüstvermietung mit Material-Pool (P-41), Blitzschutz-Kontrollen mit Messwerten, Solar-Montage mit Übergabe an den Elektro-Betrieb.

## 7. Vorlagen

**Leistungen** (eigene Worte, ohne Ansätze und Leistungswerte; ganze Liste in der Recherche, Abschnitt 6.1): Allgemein (Einrichtung, Aufzug, Kran, Hubarbeitsbühne, Mulde und Entsorgung je Fraktion, Regie je Kategorie); Steildach (abdecken, Lattung, Unterdach, Dämmung, Deckung in m²; First, Grat, Kehle, Ortgang, Schneefang in m; Dachfenster, Anschlüsse, Anschlageinrichtung in Stk.); Flachdach (Rückbau, Dampfbremse, Dämmung, Abdichtung, Schutzschicht; Aufbordung; Abläufe; Dichtheitsprüfung); Spenglerei (Rinne, Ablaufrohr, Abdeckung in m; Halter, Kamineinfassung, Abkantteil in Stk.; Stehfalz in m²); Fassade (Unterkonstruktion, Dämmung, Bekleidung; Leibung, Fensterbank); Gerüst (stellen in m², Standzeit in m²·Woche, Dachfang, Treppenturm, Umbau); Unterhalt (Dachkontrolle, Rinnenreinigung, Notabdichtung). NPK nur als Verweisfeld.

**Checklisten** («in Ordnung», «Mangel» mit Foto und Frist, «Stopp»): Vor dem Aufstieg (die neun lebenswichtigen Regeln der Suva für Dächer und Fassaden, dazu Wetter, Hitze, Schutz Dritter), Gerüst-Sichtkontrolle täglich, Gerüst-Übernahme, Asbest vor Rückbau oder Bohren, Kraneinsatz, Tagesende «Dach dicht», Hitze, PSAgA, Abnahme je Teilbranche, Unterhaltskontrolle Steil- und Flachdach, Schadenfall.

**Dokumente:** Dachaufnahme, Objektblatt, Offerte mit Ausmassblatt, Auftragsbestätigung, Nachtrag, Material- und Bestellliste, Wochenplan, Einsatzblatt mit QR, Tages- und Regierapport, Sicherheitsplan, Gerüst-Übernahmeprotokoll, Asbest-Information an die Kundschaft, Entsorgungsnachweise, Abnahmeprotokoll, Rechnungen mit QR, Mahnungen, Kontrollbericht, Schadenbericht, Monatsblatt. Anrede an Dritte nach [S-07](../entscheide.md).

**Fragen beim Einrichten** (an «du»): Betriebsarten; Personen draussen (allein, 2 bis 5, 6 bis 20); Gerüste selbst, bestellt oder beides; Material aufs Dach (Aufzug, eigener Kran, gemieteter Kran, von Hand); Kundschaft; meistens Ausmass, Pauschal oder Regie; welcher GAV; MWST-Methode (Satz trägst du selbst ein); Lernende; Unterhaltsverträge; Blitzschutz oder Solar; Kanton.

## 8. Rollen und Arbeitsplätze

| Rolle | Sieht und tut | Sieht nie | Gerät | Tab-Leiste |
| --- | --- | --- | --- | --- |
| Inhaber:in | alles, Sicherheitsplan freigeben | – | Handy, iPad, Computer | Heute · Aufträge · Dachaufnahme · Rechnungen · Mehr |
| Büro | Kundschaft, Offerten, Rechnungen, Belege, Monatspaket, Plan | Löhne anderer, Deckungsbeitrag ohne Recht | Computer | Heute · Rechnungen · Kundschaft · Plan · Mehr |
| Projektleitung | Aufnahme, Ausmass, Offerten, Nachträge, Plan, Abnahme, Sicherheitspläne | Löhne, Einstellungen | iPad, Handy | Heute · Dachaufnahme · Aufträge · Plan · Mehr |
| Vorarbeiter:in | Equipe, Objektblatt, Prüfung vor dem Aufstieg, Stopp, Gerüst, Rapporte, Unterschrift einholen, Wetter vorschlagen | Preise, Löhne anderer, Kundschaft ausserhalb der Einsätze | Gruppengerät | Heute · Rapport · Sicherheit · Fotos |
| Facharbeiter:in, Lernende:r | eigene Einsätze, Checklisten, Fotos, Stopp, eigene Stunden; Lernende mit Hinweis bei gefährlichen Arbeiten | Preise, Offerten, Rechnungen, Löhne anderer | Handy (freiwillig), Gruppengerät | Heute · Checklisten · Fotos · Meine Stunden |
| Angelernte, Hilfskraft | wie oben, Ansicht mit Symbolen | wie oben | Gruppengerät | Heute · Meine Stunden |
| Gerüst-Equipenchef:in | Gerüstaufträge, Übergaben, Standzeiten, Rapporte | Preise, Löhne | Handy, Tablet | Heute · Gerüste · Rapport · Fotos |
| Magazin | Material, Fahrzeuge, Geräte, Mulden, PSAgA-Register | Preise ohne Recht, Löhne | iPad im Magazin | Heute · Material · Geräte |

Externe bekommen Dateien, keine Rolle. **Gerätemodus «Equipe»** für das Gruppengerät im Fahrzeug: nur der Tag, grössere Ziele für Handschuhe, Verlassen mit PIN.

## 9. Recht und Pflichten

**geprüft am 24.11.2026:** vom Kopf an der Quelle oder ihrer Wiedergabe durch Amt, Suva oder Sozialpartner bestätigt (Websuche; amtliche Seiten direkt nicht erreichbar). **Auszug:** aus der Recherche; kommt erst in die App, wenn der Branchen-Agent den Wortlaut gelesen und das Datum eingetragen hat. **nicht bestätigt:** nicht in die App, auch nicht als Richtwert. Alle Quellen: [Recherche](gebaeudehuelle-recherche.md), Abschnitt 8.

| Fakt | Wert | Quelle | Stand |
| --- | --- | --- | --- |
| GAV Gebäudehüllengewerbe | allgemeinverbindlich ohne BS, BL, GE, VD, VS; 1.1.2024 bis 31.12.2027; Lohnanpassungen per 1.3.2024, 1.3.2025, 1.3.2026 | [SECO](https://www.seco.admin.ch/dam/de/sd-web/h7cqLISavynZ/ave_bund_Oktober_2026_d.pdf) | geprüft am 24.11.2026 |
| Mindestlöhne Gebäudehülle | Beträge 2025 und 2026 nicht gefunden; Werte ab 1.3.2024 (Recherche 8.1) sind überholt | Bundesblatt 2024 | nicht bestätigt |
| Lohnkategorien | Facharbeitende, Angelernte, Bauarbeitende; Stufen bis 12, über 12, über 24 Monate Branchenerfahrung | Bundesblatt 2024 | Auszug |
| GAV Gebäudetechnik | 40 Stunden; Mindestlöhne 2026 unverändert; Geltung für Spenglereien nicht geprüft; Wallis eigener GAV | Verband, SECO (Recherche 8.1) | Auszug |
| GAV Gerüstbau | in Kraft 1.4.2025 bis 31.3.2029, ganze Schweiz, nicht kursive Bestimmungen allgemeinverbindlich; Kaution 20 000 Franken vor Arbeitsaufnahme | [GAV](https://syna.ch/images/GAV/GAV-Geruestbau_2025-2029.pdf) | geprüft am 24.11.2026; Mindestlöhne nicht belegt |
| Arbeitszeit, Schlechtwetter | Verzeichnisse (ArG Art. 46, ArGV 1 Art. 73), 5 Jahre; Lernende: gefährliche Arbeiten nur nach Bildungsverordnung (ArGV 5 Art. 4); Schlechtwetterentschädigung nur für genannte Erwerbszweige (AVIV Art. 65), Dach, Spenglerei, Gerüst dort nicht ausdrücklich | [SECO](https://www.seco.admin.ch/de/arbeitszeiterfassung), SECO-ALV | Auszug; über Entschädigung entscheidet nie die App |
| Absturz | Dachränder ab mehr als 2 m, geringer Umfang ab mehr als 3 m; Kollektivschutz vor Anseilschutz; Anseilschutz nur bis zwei Personenarbeitstage; Ausbildung für PSAgA | [Suva](https://www.suva.ch/dach) | geprüft am 24.11.2026 |
| Gerüst, PSAgA, Krane | Fassadengerüst ab 3 m; tägliche Sichtkontrolle; PSAgA vor jedem Einsatz prüfen, jährlich warten; Kranführerausweis A und B, Kranbuch | Suva (Recherche 8.3) | Auszug |
| Asbest | vor 1990 vor Arbeitsbeginn ermitteln; unerwarteter Fund: einstellen, Bauherrschaft benachrichtigen (BauAV Art. 32 Abs. 3); erhebliche Faserfreisetzung nur anerkannte Firmen (Art. 82) | [Suva](https://www.suva.ch/de-ch/praevention/nach-gefahren/gefaehrliche-materialien-strahlungen-und-situationen/asbest/rechtsgrundlage-und-arbeitnehmerschutz) | geprüft am 24.11.2026 |
| Entsorgungskonzept | mit dem Baugesuch bei mehr als 200 m³ Bauabfällen oder Schadstoffen (VVEA Art. 16); Basel-Stadt ab 100 m³ | [Kanton AG](https://www.ag.ch/media/kanton-aargau/bvu/umwelt-natur/aus-und-weiterbildung/2025-gemeindeseminar/6-entsorgungskonzepte.pdf) | 200 m³ geprüft am 24.11.2026; BS Auszug |
| Weitere | Gerüst, Kran, Mulde auf öffentlichem Grund nur mit Bewilligung der Gemeinde; Blitzschutz nach VKF-Richtlinie 22-15; Solar-Elektrik bewilligungspflichtig (NIV); SIA 118 nur wenn vereinbart (Rügefrist 2 Jahre); SIA 232/1, 232/2, 271 und NPK nur nennen | Recherche 8.5 | Auszug |
| Mängelrüge | unbewegliches Werk 60 Tage (OR Art. 367 Abs. 1bis, 370 Abs. 4), seit 1.1.2026 | [Parlament](https://www.parlament.ch/centers/eparl/curia/2022/20220066/Schlussabstimmungstext%201%20NS%20D.pdf) | geprüft am 24.11.2026 (Steckbrief Maler) |
| Werkvertrag | Verjährung 5 Jahre ab Abnahme (OR Art. 371 Abs. 2); Preisarten (Art. 373 bis 375); Aufbewahrung 10 Jahre | [OR](https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de) | Auszug |
| Bauhandwerkerpfandrecht | Eintragung spätestens 4 Monate nach Vollendung (ZGB Art. 839 Abs. 2) | [Gerichte ZH](https://www.gerichte-zh.ch/themen/bau-werk/bauhandwerkerpfandrecht) | geprüft am 24.11.2026 (Steckbrief Maler) |
| MWST | 8,1 Prozent, Pflicht ab 100 000 Franken, halbjährlich mit Saldosteuersatz; seit 2025 ein Satz je Tätigkeit über 10 Prozent | [MWSTG](https://www.fedlex.admin.ch/eli/cc/2009/615/de) | Auszug |
| Saldosteuersatz | Recherche: Dach und Spenglerei 3,7, Gerüstbau 5,3 Prozent; die Prüfung fand für das Dachdeckergeschäft 3,5 und 3,7 Prozent in verschiedenen Fassungen, keine geltende Liste | SR 641.202.62 | nicht bestätigt; der Betrieb trägt seinen Satz ein |

**Die App** erinnert, weist nach und zeigt Hinweise mit Quelle; nach DSG (Art. 6 und 8) fotografiert sie Bauteile, entfernt Standortangaben beim Teilen, speichert keine Codes und zeigt Kontakte von Mieter:innen nur am Einsatz. **Sie tut nie:** Absturz, Gerüst, Asbest oder Wetter beurteilen, Lohn für richtig erklären, Haftung oder Frist im Einzelfall einschätzen, bei Gemeinde, Suva, Kommission oder Versicherung melden. Vor dem Pilot prüft eine Fachperson ([S-17](../entscheide.md)).

## 10. Geräte und Abgleich

| Lage | Stufe 1 ohne JA | Nach JA ([S-06](../entscheide.md)) |
| --- | --- | --- |
| L1 allein, Reparaturdienst | ein Gerät, Sicherung als Datei | – |
| L2 Inhaber:in und Büro | ein Hauptgerät | Kopplung im WLAN zu Hause |
| L3 Equipen im Magazin | Wochenplan und Einsatzblatt als PDF mit QR; Rapport auf Papier, als Foto zurück | morgens Mappe aufs Gruppengerät, abends Rapporte, Stunden, Fotos, Unterschriften, Stopps als Befehle; Päckli untertags |

Alles läuft ohne Netz; das WLAN der Kundschaft wird nie genutzt. Fotos reisen verkleinert; die Sicherung erinnert nach zwei Tagen ohne Abgleich. **Nie aufs Handy:** Ansätze, Offertsummen, Deckungsbeitrag, Löhne, Rechnungen, Stunden anderer, Codes ([S-11](../entscheide.md)); Objektangaben nur für die Einsätze des Tages. **Erst Stufe 2** ([S-14](../entscheide.md)): Echtzeit-Plan, Wetterwarnungen, Seiten für Verwaltungen.

## 11. Wörter

Objekt heisst Objekt (Gebäude), darunter Dachfläche und Fassadenfläche; Team heisst Equipe; Werkhof heisst Magazin; Vertrag heisst Unterhaltsvertrag; Stopp-Meldung heisst Stopp. Ausmass, nie Aufmass; Neigung in Grad, Gefälle nur bei Flachdach und Rinne; nie Abo, Abbruch, Entwarnung, Job. Kundschaft heisst in Dokumenten Bauherrschaft, wo der Vertrag es so nennt. **Fürs Glossar:** Traufe, First, Grat, Kehle, Ortgang, Sparrenlänge, Lattung, Konterlattung, Unterdach, Aufbordung, Notüberlauf, Abwicklung, Zuschnitt, Dachfangwand, Absturzhöhe, Kollektivschutz, Anseilschutz, PSAgA, Anschlageinrichtung, durchbruchsicher, Personenarbeitstag, Wetterentscheid, Ausfallstunden, Gerüst-Übernahme, Standzeit, Verdacht, Befund, Entsorgungskonzept, Schadenfall, Branchenerfahrung.

## 12. MVP und Pakete

**MVP** (Pilot 4 bis 8 Wochen, Allrounder Dach und Spenglerei mit 4 bis 10 Personen, ein Hauptgerät):

1. Einrichten mit Betriebsarten, Leistungs-Vorlage und Rollen; Kundschaft, Objekte, Aufträge.
2. Dachaufnahme mit Flächen, Linien, Öffnungen, Baujahr, Zugang und Fotos, ohne Netz.
3. Ausmass mit Neigung und Materialauszug, Formeln sichtbar.
4. Offerte aus dem Ausmass mit Varianten, Annahme, Nachfassen, Nachtrag.
5. Wochenplan mit Wetterentscheid und Textvorlagen; Einsatzblatt mit QR, nach [S-06](../entscheide.md) als Mappe.
6. Tages- und Regierapport mit Fotos und Unterschrift; Stunden im Zeit-Ledger.
7. Sicherheit am Objekt (Prüfung vor dem Aufstieg, Stopp, Gerüst, Sicherheitsplan) und Schadstoff-Ablauf von Verdacht bis Befund.
8. Rechnung mit QR aus Offerte, Schlussausmass oder Regie, Akonto, Mahnung; Pfandrecht und Garantie als Erinnerung.

| Paket | Ziel | Abnahme (ganz im Auftrag) |
| --- | --- | --- |
| B-1 Gerüst, Einrichten, Vorlagen | Betrieb richtet sich ein | `pnpm check:industry envelope` grün; 1 und 8 Personen schalten richtig |
| B-2 Dachaufnahme | Gebäude einmal aufnehmen, ohne Netz | offline; Verdacht aus Baujahr 1974 |
| B-3 Ausmass und Material | Mengen aus der Aufnahme | Prüfbeispiel 6.2 exakt |
| B-4 Offerte und Nachtrag | Offerte am selben Abend | Positionen aus dem Ausmass; Variante nicht im Total |
| B-5 Wetter und Wochenplan | Umplanen in Minuten | «verschoben» zieht Abhängiges als Vorschlag mit |
| B-6 Rapport und Regie | Regie nie vergessen | Regierapport gesperrt; Ausfall getrennt |
| B-7 Sicherheit in der Höhe | nachweisen, nie beurteilen | Suva-Hinweis bei 15,8 Personenarbeitstagen; Texttest |
| B-8 Schadstoffe und Entsorgung | Verdacht bis Befund | aufheben nur mit Recht; Konzept-Hinweis über 200 m³ |
| B-9 Abrechnung, Abnahme, Garantie | Rechnung am Tag der Abnahme | Akonto und Schluss exakt; Fristen mit Quelle |
| B-10 Baustelleneinrichtung | Gerüst, Kran, Mulde, Bewilligung | Übergabe gesperrt; Standzeit 6 Wochen |
| B-11 Unterhalt und Schadenfall | Wiederkehr und Unwetter | Rinnen im November; Liste nach Dringlichkeit |
| B-12 Regelwerk und Lohnkategorie | Stunden nach drei GAV vorbereiten | Regelwerk je Person; «Wert fehlt» ohne Prüfung |

**MVP:** B-1 bis B-9. **Vor dem Pilot:** B-10, B-12, Kasse (P-30). **Danach:** B-11, Material (P-41), Fahrzeuge und PSAgA (P-42), Sprachen ([S-07](../entscheide.md)), Werkstatt, Gerüstvermietung, Blitzschutz, Solar, Nachkalkulation. **Welle 6:** fr-CH, it-CH. **Bewusst nie:** Statik, Bauphysik, Brandschutznachweis; Schadstoff-Diagnose; Elektro-Installation; Lohn- und Finanzbuchhaltung; Anbindung an Händler, Banken, Versicherungen, Gemeinden; NPK- oder SIA-Texte; Ortung, Ranglisten; Steuerung von Drohnen; Vermittlung von Aufträgen.

## 13. Demo-Betrieb

**Dach und Spenglerei Muster GmbH**, Musterweg 12, 8000 Beispielstadt (Kanton Zürich), 8 Personen, Steildach, Spenglerei, kleine Flachdächer, Unterhalt; Gerüste bestellt, Kran gemietet; Saldosteuersatz als Demo-Eingabe ohne Richtwert; Ansätze sind Testwerte. **Team:** A. Muster (Inhaberin) · B. Muster (Büro 40 Prozent) · C. Muster (Vorarbeiter Dach, Italienisch) · D. Muster (Dachdeckerin EFZ, Portugiesisch) · E. Muster (Vorarbeiter Spenglerei, GAV Gebäudetechnik, Albanisch) · F. Muster (Angelernter, Portugiesisch) · G. Muster (Lernende, Serbisch) · H. Muster (Lernender Spengler, Italienisch). **Kundschaft:** Familie Muster (Musterweg 4, Baujahr 1974, Faserzement-Schiefer), Verwaltung Muster AG (Stockwerkeigentum Musterhof, 3 Häuser), Gemeinde Beispielstadt (Schulhaus, Flachdach), Hof Muster (Wellplatten, 1968), Gewerbe Muster AG (Blechdach, Hagelschaden).

| Auftrag | Stand | Zeigt |
| --- | --- | --- |
| Musterweg 4, Dach neu decken | angenommen, Probe positiv, Gerüst bestellt | Prüfbeispiel 6.2, Sicherheitsplan, Asbest, Entsorgung |
| Musterhof, Rinnenreinigung | 3 Objekte fällig im November | Tour, Kontrollbericht |
| Schulhaus, Flachdach-Kontrolle | 2 Befunde | Folgeofferte |
| Gewerbe Muster AG, Hagel | Notabdichtung erledigt | Schadenbericht |
| Hof Muster, Wellplatten | Besichtigung geplant | Stopp-Hinweis «nicht durchbruchsicher» |
| Musterhof Haus A, Fassade | in Arbeit, Akonto | Fassadenausmass, Gerüst 6 Wochen |

**Ein Tag:** 06:00 Gewitter gemeldet: Musterweg 4 «fraglich», Spenglerei «geht». 07:30 Prüfung vor dem Aufstieg und Sichtkontrolle. 10:00 alter Anschluss mit Kitt: Stopp, Foto, PDF an die Bauherrschaft. 15:00 «Dach dicht», Rapport mit 2 Stunden Ausfall Wetter; Regie «Lattenersatz 1,5 h» unterschrieben.

## 14. Risiken und offene Fragen

| Risiko oder Frage | Folge | Was hilft, wer entscheidet |
| --- | --- | --- |
| Checklisten gelten als Freigabe | Haftungsgefühl nach Unfall | Hilfe-Texte mit Quelle, nie «sicher»; Fachperson ([S-17](../entscheide.md)) |
| Asbest: falsche Entwarnung | Gesundheit, Haftung | Verdacht nur mit Befund und Recht aufheben |
| Mindestlöhne, Saldosteuersatz nicht bestätigt | falsche Hinweise | «Wert fehlt»; Prüfung mit Zugang zu seco, fedlex, estv, suva; [S-17](../entscheide.md) |
| Abgleich der Equipen | Rapporte bleiben Papier | [S-06](../entscheide.md); Stufe 2 [S-14](../entscheide.md) |
| Private Handys, Codes für Dachausstiege | Schaden bei Verlust | Gruppengerät, keine Codes ([S-11](../entscheide.md)) |
| Wetter aus dem Netz, Adresse an die Karten-App | Datenfluss | [S-15](../entscheide.md), [S-16](../entscheide.md) |
| Sprachen im Team, Anrede an Verwaltungen | Rapporte leer, «du» im Brief | [S-07](../entscheide.md) |
| Pilot, erste Teilbranche, Welle | Reihenfolge | Alban nach ersten Kunden ([S-09](../entscheide.md)) |
| Beweiswert der Unterschrift; Import von Ausschreibungen | Streit, Lizenzkosten | [S-17](../entscheide.md) [Geld] |
| Gerüstbau als eigene Branche | Umfang | Kopf als ADR nach dem Pilot |

## 15. Absehbare Plattform-Anträge

| Nr. | Antrag | An | Zweite Branche | Bis dahin |
| --- | --- | --- | --- | --- |
| 1 | Schadstoff-Fall am Objekt (Verdacht, Befund, Ledger, Aufheben mit Recht) | P-23, P-27 | Maler, Haustechnik | `envelope_hazard_cases` |
| 2 | Entsorgungsnachweis je Auftrag | P-27, P-41 | Maler, Umzug | `envelope_waste_records` |
| 3 | Ausmass: Formelsatz als Steckplatz, Art, Vergleich zur Offerte | P-25 | Maler, Facility | Formelsatz in der Branche |
| 4 | Materialbedarf je Leistung (Verbrauch, Verschnitt, Gebinde) | P-24 | Maler | `envelope_material_rules` |
| 5 | Varianten und Eventualpositionen in der Offerte | P-29 | Maler, Umzug | – |
| 6 | Einheiten t, Tag, Woche, m²·Woche | P-01, P-24 | Umzug, Garten | Einheit als Text |
| 7 | Ausfallstunden als Buchungsart; Regelwerk je Person; Kategorie und Stufe | P-31 | Maler, Facility | `envelope_lost_time`, `envelope_wage_classes` |
| 8 | Abhängigkeiten und Reservationen am Einsatz, die beim Verschieben mitziehen | P-25, P-42 | Umzug, Maler | Tabellen in 6.4 und 6.5 |
| 9 | Bewilligung für öffentlichen Grund mit Frist | P-28 | Umzug | `envelope_public_space_permits` |
| 10 | Fristen-Regelwerk Werkvertrag, Vertragsgrundlage | P-28, P-29 | Maler | `envelope_job_terms` |
| 11 | Markierung auf Fotos, Standort beim Teilen entfernen | P-33, P-10 | Maler, Facility | – |
| 12 | Reihenfolge der Einsätze eines Tages | P-25 | Facility, Garten | Sortierfeld |
| 13 | P-51 vor W4 für Unterhaltsverträge | P-51 | Facility | P-26, Rechnung je Kontrollgang |
| 14 | Gerätemodus «Equipe» mit grösseren Zielen | P-06, P-09 | Umzug, Garten | – |

Anträge stehen in `docs/branchen/gebaeudehuelle/antraege.md`; der Kopf entscheidet ([Zusammenarbeit](../zusammenarbeit.md), Abschnitt 5).

## 16. Stand

Steckbrief vom 24.11.2026, noch nichts gebaut.

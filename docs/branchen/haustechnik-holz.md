# Haustechnik und Holz: Elektro, Sanitär, Heizung, Lüftung, Schreiner, Zimmerei

- **Kennung im Code:** `building-services` (ADR-Präfix `BSV`; Betriebsarten `building-services.electrical`, `building-services.plumbing_heating`, `building-services.ventilation`) und `carpentry` (ADR-Präfix `CRP`; Betriebsarten `carpentry.joinery`, `carpentry.timber`). In Tabellen- und Ereignisnamen steht für den Bindestrich ein Unterstrich (`building_services_`); Vorschlag an den Kopf in `NAMES.md`
- **Ausgabe:** Vor Ort ([S-01](../entscheide.md))
- **Welle:** W3 ([Fahrplan](../fahrplan.md)), zuerst Sanitär, Heizung, Elektro, danach Schreinerei und Zimmerei; die Recherche empfiehlt den Service-Teil in W2, der Fahrplan setzt W3, weil Lager (P-41) und Kopplung (P-40) dann kommen
- **Eignung:** 4 – Regierapport mit Material aus dem Fahrzeug, Anlagen mit Wartung und Rechnung am selben Tag holen verlorenes Geld, fast nur mit Plattform-Modulen; Abzug für Notfälle ohne Server, viele amtliche Nachweise und vier Gesamtarbeitsverträge.
- **Recherche:** [`haustechnik-holz-recherche.md`](haustechnik-holz-recherche.md) · **Auftrag:** [`../auftraege/branche-haustechnik-holz.md`](../auftraege/branche-haustechnik-holz.md)

## 1. Kurzbild

| Frage | Antwort |
| --- | --- |
| Wie viele | Gebäudetechnik rund 8000 Betriebe, 70 000 Beschäftigte (EKAS, Branchenlösung 80, 2022); Elektrobranche 52 385 Beschäftigte (Verband, 2022); Schreinereien 2542 Betriebe, 18 684 Beschäftigte (EKAS, Branchenlösung 3); Holzbau 2870 Arbeitsstätten, 22 642 Beschäftigte (BFS nach Verband, 2023); nicht addieren |
| Grösse | Elektro 2 bis 20, Sanitär und Heizung 2 bis 15 (viele allein im Service), Schreinerei 2 bis 15, Zimmerei 5 bis 30; Anteil unter 20 nicht belegt |
| Wer arbeitet | Inhaber:in (Disposition, abends Büro), Büro Teilzeit, Projektleitung ab etwa 8 Personen, Chefmonteur:in, Servicetechniker:in allein im Wagen, Monteur:innen, Lernende, Werkstatt, Magazin; im Elektro eine **fachkundige Person** für die Bewilligung |
| Sprachen | nicht belegt; Annahme wie Gebäudehülle ([S-07](../entscheide.md)) |
| Aussendienst | Service 80 bis 90 Prozent beim Kunden, Keller ohne Netz; Holz 30 bis 70 Prozent in Werkstatt oder Halle (Annahme) |
| Saison | Winter Störungen und Pikett; Frühling Wartungsrunden; Sommer Heizungsersatz; Herbst Inbetriebnahme; Jahresende Inventur, Jahresrechnungen |

## 2. Teilbranchen und Betriebsarten

Mehrfach wählbar; Sanitär mit Spenglerei schaltet `envelope.sheet_metal` ([Gebäudehülle](gebaeudehuelle.md)) dazu. Elektrokontrolle ist eine Option von `electrical`. Bei einer Person: Umfang «Schlank», Regie als Standard.

| Betriebsart | Kennung | Was sie tut | Startfunktionen |
| --- | --- | --- | --- |
| Elektro | `building-services.electrical` | Installation, Störungen, Verteilungen, Photovoltaik- und Ladestation-Anschluss | Anlagen, Störung, Rapport, Fahrzeuglager, Rechnung, Nachweise Elektro |
| Sanitär und Heizung | `building-services.plumbing_heating` | Wasser, Apparate, Boiler, Wärmeerzeuger, Service | dazu Wartung, Verträge, Pikett, Nachweise Gebäudetechnik |
| Lüftung, Klima, Kälte | `building-services.ventilation` | Komfortlüftung, Klima, Kälte | wie Sanitär und Heizung, Kältemittel an |
| Schreinerei, Küchenbau | `carpentry.joinery` | Möbel nach Mass, Küchen, Türen, Fenster, Werkstatt | Massaufnahme, Stückliste, Restplatten, Projekt, Rechnung |
| Zimmerei, Holzbau | `carpentry.timber` | Dachstühle, Aufstockungen, Elemente | Holzliste, Kran, Wetter, Projekt, Rapport, Rechnung |

## 3. Alltag

- **Zwei Grundformen, eine Auftragsart** (P-25, Art `service` oder `project`): Serviceauftrag (Anruf, 30 Minuten bis 1 Tag, eine Person, Regie, Material aus dem Wagen, Unterschrift vor Ort) und Projekt (Offerte nach Positionen, Etappen, Nachträge, Akonto, Abnahme, Schluss mit Rückbehalt). Ein Projekt hinterlässt Anlagen und oft einen Wartungsvertrag.
- **Service heute:** Störung per Telefon, Sprachbox oder Nachricht › klären (Zugang, Gerät, wer zahlt) › Wandtafel und Gruppenchat › Einsatz › Rapport im Durchschreibeblock oder gar nicht › Zettel am Freitag › Rechnung abgetippt › Anlage nachführen: niemand (Kleber auf dem Kessel, Ordner im Auto).
- **Elektro nach NIV:** Installationsanzeige › Schlusskontrolle vor der Übergabe, Sicherheitsnachweis › Meldung an die Netzbetreiberin › Abnahmekontrolle bei Kontrollperiode unter 20 Jahren › periodische Kontrolle.
- **Woche, Monat, Jahr:** Montag Wochenplan, Pikett-Übergabe; Freitag Rapporte, Wagen nachfüllen; monatlich Rapporte in Rechnungen (grösster Rückstau), Stunden, Belege; jährlich Inventur, Jahresrechnungen, Ausweise.

## 4. Schmerzen

1. Rapporte kommen spät oder gar nicht ins Büro; Regie geht verloren.
2. Material aus dem Fahrzeug wird nicht verrechnet.
3. Rechnung zu spät, Mahnung vergessen.
4. Wartungen vergessen; Anlagewissen im Kopf einer Person.
5. Notfälle werfen den Plan um; Pikett unklar.
6. Nachweise in Ordnern im Auto; Ausweise laufen ab.
7. Nachträge nur mündlich, Nachkalkulation fehlt.
8. Werkstatt und Holzliste auf Papier, Restplatten unbekannt.

**Warum keine Software:** Einführung braucht Abende, tausende Artikel, Handschuhe, kein Netz, nur Deutsch, Misstrauen gegenüber Servern und Ortung. **Was bewegt:** Rapport mit Unterschrift in zwei Minuten offline, Rechnung am selben Abend, Liste der fälligen Wartungen, 50 bis 200 eigene Artikel aus einer Datei, kein Konto.

## 5. Plattform-Module

| Modul | Wofür, Einstellungen der Branche | M/S/K |
| --- | --- | --- |
| P-20 Betrieb und Personen | MWST-Art, Saldosteuersatz als Eingabe, Bank für QR, Bewilligungen im Briefkopf | M |
| P-21 Rollen und Rechte | Rollen aus 8; heikel: Löhne, Einkaufspreise, Marge, Rechnung stellen, Zugangshinweise | M |
| P-22 Kundschaft | Private, Verwaltung, Genossenschaft; bestellt, zahlt, Kontakt vor Ort | M |
| P-23 Objekte und Standorte | **Anlagen** mit Intervall; Zugang ohne Codes ([S-11](../entscheide.md)); Baujahr | M |
| P-24 Leistungen und Material | Vorlage ohne Ansätze; h, Stk., m, m², m³, km, pauschal, Prozent | M |
| P-25 Aufträge, Einsätze, Rapporte | Service und Projekt, Priorität, Regierapport, Nachtrag, Abnahme | M |
| P-26 Pläne und Wiederkehr | Wartungsrunden je Anlage und Monat | M |
| P-27 Checklisten und Nachweise | lebenswichtige Regeln, Serviceprotokoll je Anlagetyp, «Stopp» | M |
| P-28 Kalender und Erinnerungen | Wartung, Kontrollperiode, Kältemittel, Ausweise, Pikett, Fristen | M |
| P-29 Offerten und Rechnungen | Rechnung aus Rapporten, Akonto, Jahresrechnung, QR, Mahnung | M |
| P-30 Kasse und Belege | Grosshandel, Tankstelle, Monatspaket | S |
| P-31 Team und Zeit | Stunden aus dem Rapport, Wegzeit, Pikett, Regelwerk je Person | M |
| P-32 Heute | Tagesliste, fällige Wartungen, nicht verrechnet, Nachfüllliste | M |
| P-33 Fotos und Dateien | Typenschild, Leitungen vor dem Zumauern, Messprotokolle | M |
| P-40 Kopplung und Abgleich | Mappe runter, Rapporte und Entnahmen rauf; bis zum JA Papier ([S-06](../entscheide.md)) | S |
| P-41 Material und Lager | jedes Fahrzeug ein Lagerort, Entnahme aus dem Rapport, Inventur | M |
| P-42 Fahrzeuge und Geräte | Servicewagen, Messgeräte mit Kalibrierung, Kran; keine Ortung | S |
| P-50 Termine | Wartungstermine mit Zeitfenster | S |
| P-51 Verträge und Mitgliedschaften | Wartungsvertrag mit Jahresrechnung (vor W4: Antrag 3) | M |
| P-52 Kurse mit Plätzen | – | – |

Dazu P-06 (Gerätemodus «Werkstatt»), P-07 (Lexikon), P-10 (Kamera mit Fallback, Unterschrift), P-11 (Stil «Formular»).

## 6. Eigene Module der Branche

Alle Tabellen tragen `businessId`; Längen in mm, Mengen in Tausendstel, Leistung in Watt, Füllmengen in Gramm, Druck in Millibar, Geld in Rappen, Sätze in Basispunkten, alles Ganzzahlen. «H, A»: Heikelkeit (n, i, h) und Abgleich-Art ([ADR-0005](../adr/0005-gemeinsames-datenmodell.md)); **K** = Kandidat für die Plattform (Abschnitt 15). `building-services` und `carpentry` importieren einander nie; was beide brauchen, ist Plattform-Antrag. Funktionen: `building-services.assets`, `.maintenance`, `.service_calls`, `.reports`, `.vehicle_stock`, `.contracts`, `.on_call`, `.electrical_proofs`, `.mechanical_proofs`, `.projects`, `.labor_rules`, `.safety`; `carpentry.survey`, `.parts_lists`, `.offcuts`, `.workshop`, `.timber_lists`, `.lifting`, `.safety`. `safety` schaltet nur das Recht «Einstellungen» aus.

### 6.1 Anlagen und Wartung

Die Anlage ist P-23, der Vertrag P-51, das Fahrzeuglager P-41; die Branche bringt Typen, Felder und Historie.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `building_services_asset_details` **K** | assetId (P-23), assetKind (`heat_pump`, `oil_boiler`, `gas_boiler`, `water_heater`, `ventilation_unit`, `air_conditioner`, `distribution_board`, `charging_station`, `kitchen` …), manufacturerText, modelText, serialNo, commissionedOn, powerW, nameplateFileId, status (`active`, `replaced`), replacedByAssetId | n, ein Schreiber |
| `building_services_asset_events` **K** | assetId, date, kind (`maintenance`, `fault`, `repair`, `measurement`, `replacement`), reportId, partsText, readingsText | n, Ledger |
| `building_services_maintenance_rules` | assetId, intervalMonths (Richtwert), preferredMonth, checklistTemplateId | n, ein Schreiber |

Fällig = (letzte Wartung, sonst `commissionedOn`) + `intervalMonths`, am Monatsende gekürzt (31.8. + 6 = 28.2.); «überfällig» = fällig vor heute; Wartungsrunde = fällige Anlagen des Monats je Objekt als Einsätze über P-26. Ersetzen legt eine neue Anlage an, die alte bleibt. Dokumente: Serviceprotokoll, Anlageliste je Objekt, Ankündigung für Mieter:innen.

### 6.2 Störung und Regierapport

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `building_services_service_requests` **K** | channel, reporterContactId, siteId, assetId, problem, priority (`emergency`, `urgent`, `normal`, `maintenance`), timeWindow, onSiteContactId, payer (`owner`, `management`, `tenant`, `warranty`, `contract`), jobId | i, ein Schreiber |
| `building_services_report_extras` **K** | reportId (P-25), travelMode (`flat`, `zone`, `km`), distanceKmMilli, smallMaterialMode, textBlockKeys, followUpJobId, signatureRefusedReason | n, Ledger, gesperrt mit dem Rapport |

Tagesliste nach Priorität, dann Zeitfenster; Umplanen schlägt einen Text vor, den die Person selbst teilt; Adresse an die Karten-App nur auf Tipp ([S-16](../entscheide.md)). Arbeitszeit = Ende − Beginn − Pause, Wegzeit getrennt, Rundung als Option (5, 10, 15 Minuten), Rohwert bleibt im Ledger; Zeile = round(Menge in Tausendstel × Preis ÷ 1000); Kleinmaterial = round(Arbeit × Satz ÷ 10 000) oder Pauschale; Summe nie gespeichert; ohne Preis «Preis fehlt», keine Rechnung. Lernende schreiben Entwürfe. **Prüfbeispiel** (Testwerte): 07:40 bis 09:10, Regie 11 500 je h, Fahrt 4500, 2 Stk. zu 1250, 2,500 m zu 1800, Kleinmaterial 300 Basispunkte: 17 250 + 4500 + 7000 + 518 = 29 268 Rappen netto.

### 6.3 Fahrzeuglager und Wartungsvertrag

- `building_services_stock_targets` **K** (locationId P-41, itemId, targetMilli, responsiblePersonId; n, ein Schreiber), bis P-41 hinter dem Port `StockSource`. Bestand = Σ Bewegungen; Nachfüllen = max(0, Soll − Bestand); Inventurdifferenz als Bewegung; «entnommen, nicht verrechnet» = Entnahmen, deren Rapport in keiner Rechnung steht. **Prüfbeispiel:** Soll 20; +20, −3, −4, Inventur −1: Bestand 12, Nachfüllen 8.
- `building_services_contract_assets` (contractId, assetId, scope `maintenance`, `on_call`, `material_included`; n, ein Schreiber), bis P-51 hinter dem Port `ContractRegister`. Jahresrechnung im Rechnungsmonat, anteilig = round(Jahrespreis × Monate ÷ 12); letzter Kündigungstag = Ende − Frist. **Prüfbeispiel:** 48 000, Beginn 1.4.: 36 000.

### 6.4 Pikettdienst

Zweite Nutzung nach Facility (`facility_winter_duties`): Antrag 6, bis dahin Port `OnCallRoster`. `building_services_on_call_shifts` **K** (personId, deputyPersonId, startsAt, endsAt, place `on_site` oder `off_site`, responseMinutes; i, ein Schreiber); `building_services_on_call_calls` **K** (shiftId, calledAt, problem, decision `visit`, `phone`, `next_day`, visitId, workMinutes, travelMinutes; n, Ledger).

Ausserhalb des Betriebs zählen nur Einsatz und Weg, im Betrieb die ganze Dienstzeit (ArGV 1 Art. 15, Auszug). Hinweis mit Quelle bei mehr als 7 Pikett-Tagen in 28 Tagen oder erneutem Dienst innert 14 Tagen (Art. 14 Abs. 2); Option «kleiner Betrieb» bis 14 Tage, wenn Einsätze der letzten 12 Monate ÷ 12 höchstens 5 (Abs. 3). Die App verbietet nichts; Zuschläge erfasst der Betrieb. **Prüfbeispiel:** Fr 18:00 bis Mo 07:00 ausserhalb, Einsätze 50 und 90 Minuten, Weg 2 × 20 und 2 × 25: 230 Minuten.

### 6.5 Nachweise Elektro und Gebäudetechnik

Die App misst nicht, beurteilt keine Messwerte, gibt keinen Nachweis als geprüft aus und baut keine amtlichen Formulare nach.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `building_services_installation_notices` | siteId, gridOperatorContactId, workKind, submittedOn, fileId | n, ein Schreiber |
| `building_services_safety_certificates` | siteId, kind (`final`, `acceptance`, `periodic`), inspectorContactId, date, periodYears, testReportFileId, handedOverOn, reportedToGridOn | n, Ledger, gesperrt nach Übergabe |
| `building_services_inspection_defects` | certificateId, text, dueOn, fixedOn, jobId | n, Ledger |
| `building_services_pressure_tests` | jobId, section, medium, testPressureMbar, durationMin (Eingabe, keine Vorgabe), result, signatureFileId | n, Ledger, gesperrt nach Unterschrift |
| `building_services_commissionings` | assetId, settingsText, briefedOn, signatureFileId | n, Ledger |
| `building_services_refrigerant_logs` | assetId, refrigerantName, group (`hfc`, `natural`, `other`), chargeG, co2EquivalentKg, event (`fill`, `top_up`, `recovery`, `leak_check`), personId | n, Ledger |
| `building_services_combustion_checks` | assetId, date, authorityText, resultText, fileId | n, Ledger |

Abnahmekontrolle fällig = Übernahme + 6 Monate, nur bei Kontrollperiode unter 20 Jahren; nächste periodische = Datum des Nachweises + Periode. Kältemittel über 3000 g, stationär: Hinweis Meldung an das BAFU bis Inbetriebnahme + 3 Monate und Wartungsheft; Dichtigkeitskontrolle nur bei `hfc` und über 3000 g oder 5000 kg CO2-Äquivalent; ohne gültige Fachbewilligung: Hinweis. **Prüfbeispiele:** Übernahme 10.3.2027, Periode 5 Jahre: bis 10.9.2027, nächste 10.3.2032; 20 Jahre: keine Abnahmekontrolle. 2400 g `natural`: kein Hinweis; 3600 g `hfc`, Inbetriebnahme 15.5.2027: Meldung bis 15.8.2027, Wartungsheft, Dichtigkeitskontrolle.

### 6.6 Projekt, Regelwerk, Ausweise

- **Projekt:** Offerte, Nachtrag, Ausmass, Abnahme sind P-25 und P-29. Etappen mit Soll-Stunden brauchen beide Kennungen (Antrag 10), bis dahin nur `building-services` hinter dem Port `JobStages`. Nachkalkulation = Ist gegen Soll je Etappe in Basispunkten, ohne Ampel; Schluss = Σ Positionen + bestätigte Nachträge + Regie − Σ Akonto (netto), MWST aus P-29; Rückbehalt als Option ohne Vorgabe; Fristen mit Quelle und «Im Streitfall entscheidet der Vertrag; frag deine Rechtsberatung.» **Prüfbeispiel:** 3 200 000 + 180 000 + 96 000 − 2 × 1 000 000 = 1 476 000 netto.
- **Regelwerk** für P-31 je Person: GAV Gebäudetechnik, Elektro, Holzbau, Schreinergewerbe, kantonal (VS, GE, VD), nur Arbeitsgesetz; `building_services_wage_classes` **K** (personId, ruleSetId, category, since; h, ein Schreiber). Mindestlohn nur mit «geprüft am», sonst «Wert fehlt».
- **Bewilligungen und Ausweise:** `building_services_licences` **K** (scope `business` oder `person`, kind `niv_general`, `refrigerant`, `gas_water`, `crane` …, number, holderPersonId, workloadBp, validUntil, fileId; i, ein Schreiber); Erinnerung vor Ablauf, Hinweis bei Einteilung ohne gültigen Ausweis.

### 6.7 Holz: Werkstatt, Stückliste, Holzliste

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `carpentry_surveys` | jobId, siteId, roomName, date, connectionsText, lines (label, lengthMm, angleDeviationDeciDeg), fileIds | n, ein Schreiber |
| `carpentry_parts` | jobId, name, materialKind (`board`, `solid`, `hardware`), itemId (P-41), lengthMm, widthMm, thicknessMm, count, edges, surface | n, ein Schreiber |
| `carpentry_offcuts` | itemId, lengthMm, widthMm, thicknessMm, place, fileId, usedOn | n, Ledger |
| `carpentry_workshop_slots` | placeOrMachine, jobId, date, plannedMinutes | n, ein Schreiber |
| `carpentry_timber_items` | jobId, component, widthMm, heightMm, lengthMm, count, species, densityKgM3 (Richtwert) | n, ein Schreiber |
| `carpentry_lifts` **K** | jobId, visitId, craneKind (`own`, `rented`), operatorPersonId, loadsText, date | n, ein Schreiber |

Fläche in Tausendstel m² = round(Σ L × B × Anzahl ÷ 1000), mit Verschnitt × (1 + Zuschlag ÷ 10 000), aus den Eingaben, einmal gerundet; Volumen in Tausendstel m³ = round(b × h × L × Anzahl ÷ 1 000 000); Gewicht = Volumen × Dichte. Werkstattstunden über P-31 mit Auftrag; Kran und Wetter nach Gebäudehülle (Anträge 12, 13). **Prüfbeispiele:** 2 × 720 × 560 und 1 × 764 × 560 mm: 1,234 m², mit 1500 Basispunkten 1,419 m²; 120 × 200 × 6500 mm, 24 Stück: 3,744 m³, bei 470 kg/m³ (Testwert) 1760 kg. Dokumente: Stückliste, Zuschnittliste als CSV (die Person lädt sie selbst), Holzliste, Übergabe mit Pflegeanleitung.

## 7. Vorlagen

**Leistungen** ohne Ansätze, Liste der Recherche 6.1 je Teilbranche: Regie, Fahrt (Pauschale, Zone, km), Kleinmaterial (Prozent), Pikett-Zuschlag, Service je Anlagetyp, Werkstatt- und CNC-Stunde, Holz in m³. NPK nur als Verweis.

**Checklisten** («in Ordnung», «Mangel», «Stopp»): 5 + 5 lebenswichtige Regeln Elektro, 10 Regeln Gebäudetechnik und Holzbau (Wortlaut erst nach Lesen der Faltprospekte), Asbest vor Bohren bei Gebäuden vor 1990, Serviceprotokoll je Anlagetyp (leer mit Beispielen), Übergabe, Fahrzeug (Richtwert wöchentlich).

**Dokumente:** Regierapport, Serviceprotokoll, Offerte, Nachtrag, Akonto-, Regie-, Schluss- und Jahresrechnung mit QR, Mahnung, Wartungsvertrag, Anlageliste, Pikettplan, Druckprobe-, Inbetriebnahme-, Abnahmeprotokoll, Stückliste, Holzliste; Kopf mit Bewilligungsnummern; Anrede an Dritte nach [S-07](../entscheide.md).

**Fragen beim Einrichten** (an «du»): Was macht dein Betrieb? Service, Projekte oder beides? Wartungsverträge? Pikett? Wie viele Fahrzeuge? Welcher GAV, je Person? Lernende? MWST-Methode (Satz trägst du ein)? Kanton? Artikeldatei vorhanden?

## 8. Rollen und Arbeitsplätze

| Rolle | Sieht und tut | Sieht nie | Gerät | Tab-Leiste |
| --- | --- | --- | --- | --- |
| Inhaber:in | alles | – | iPad, Computer, Handy | Heute · Aufträge · Anlagen · Rechnungen · Mehr |
| Büro | Störungen, Disposition, Rechnungen, Verträge, Belege | Löhne, Margen ohne Schalter | Computer | Heute · Störungen · Rechnungen · Mehr |
| Projektleitung | Offerten, Nachträge, Etappen, Abnahme | Löhne | iPad | Heute · Projekte · Plan · Mehr |
| Chefmonteur:in | Equipe, Rapporte freigeben, Material bestellen | Löhne, Einkaufspreise | Handy, iPad | Heute · Rapport · Material |
| Servicetechniker:in, Monteur:in | eigene Einsätze, Anlagen am Einsatz, Rapport, Entnahme, Nachweise, Pikettplan | Preise ausser Verkaufspreis (Option), Löhne anderer, Codes | Handy | Heute · Rapport · Anlagen · Meine Stunden |
| Lernende | eigene Einsätze, Rapport als Entwurf | Preise | Handy | Heute · Rapport · Meine Stunden |
| Werkstatt, Abbund | Stücklisten, Restplatten, Holzlisten | Preise, Kundschaft | iPad «Werkstatt» | Heute · Stückliste · Restplatten |
| Magazin | Lager, Nachfüllen, Inventur | Preise ohne Recht | iPad | Heute · Material · Fahrzeuge |

Die Treuhand bekommt das Monatspaket als Datei, keine Rolle.

## 9. Recht und Pflichten

**geprüft am 24.11.2026:** vom Kopf per Websuche an der Wiedergabe durch Amt oder Sozialpartner bestätigt (die Seiten selbst waren gesperrt). **Auszug:** aus der Recherche, Abschnitt 8; in die App erst, wenn der Branchen-Agent den Wortlaut gelesen hat. **nicht bestätigt:** nicht in die App, auch nicht als Richtwert.

| Fakt | Wert | Quelle | Stand |
| --- | --- | --- | --- |
| GAV Elektro- und Telekommunikations-Installationsgewerbe | allgemeinverbindlich bis 31.12.2029, ohne GE und VS (Beschluss 2020); Wallis eigener GAV bis 31.12.2028 | [SECO](https://www.seco.admin.ch/de/gesamtarbeitsvertraege) | geprüft am 24.11.2026 |
| GAV Gebäudetechnik | Mindestlöhne 2026 unverändert (Lohnvereinbarung 2026, Art. 39); nicht für Planungsunternehmen und GE, VD, VS; Lohnrunde im September (Art. 41.1) | [Sozialpartner](https://suissetec.ch/files/PDFs/Recht/GAV_Salaer/Deutsch/GT_Lohnvereinbarung_2026_D_final.pdf) | geprüft am 24.11.2026; Beträge nicht gelesen |
| GAV Gebäudetechnik, Holzbau | 40 Stunden, Stundenlohn = Monatslohn ÷ 173,3; Wallis eigener GAV; Holzbau allgemeinverbindlich, Löhne 2025 gelten 2026 | Recherche 8 | Auszug |
| Mindestlöhne Elektro 2026, GAV Schreinergewerbe 2026 | nicht gefunden | Recherche 8 | nicht bestätigt |
| Arbeitszeit | Verzeichnisse (ArG Art. 46, ArGV 1 Art. 73), 5 Jahre; Lernende (ArGV 5 Art. 4) | [SECO](https://www.seco.admin.ch/de/arbeitszeiterfassung) | Auszug |
| Pikett | höchstens 7 Tage in 4 Wochen, danach 2 Wochen ohne (ArGV 1 Art. 14 Abs. 2); bei zu wenig Personal bis 14 Tage, wenn im Jahr durchschnittlich höchstens 5 Einsätze pro Monat (Abs. 3); Anrechnung (Art. 15) | [SECO](https://www.seco.admin.ch/de/pikettdienst) | Art. 14 geprüft am 24.11.2026 (Merkblätter nach der Wegleitung); Art. 15 Auszug |
| NIV, Kontrollen | Schlusskontrolle vor Übergabe (Art. 24 Abs. 2), Sicherheitsnachweis (Art. 37); Periode unter 20 Jahren: Abnahmekontrolle innert 6 Monaten durch ein unabhängiges Kontrollorgan; bei 20 Jahren nur Schlusskontrolle | [ESTI](https://www.esti.admin.ch/inhalte/pdf/NIV_I/Deutsch/Publikationen/2016_2015/2017-03_schlusskontrolle_d.pdf) | geprüft am 24.11.2026 |
| NIV, Perioden, Bewilligung | 1, 5, 10, 20 Jahre; Aufforderung 6 Monate vor Ablauf; Bewilligung mit fachkundiger Person (Art. 7, 9) | ESTI (Recherche 8) | Auszug |
| Kältemittel | Meldung an das BAFU bei stationären Anlagen über 3 kg (ChemRRV Anhang 2.10 Ziff. 5.1), neue innert 3 Monaten; Wartungsheft und Dichtigkeitskontrolle je nach Kältemittel: FKW und HFKW ab 3 kg oder 5 t CO2-Äquivalent, natürliche wie R-290 ohne Dichtigkeitskontrolle | [BAFU, UV-0615](https://www.bafu.admin.ch/kaeltemittel) | korrigiert, geprüft am 24.11.2026 (Recherche: Kontrolle für alle über 3 kg) |
| Fachbewilligung Kältemittel, Feuerung, Wasser und Gas | Fachbewilligung für Installieren und Warten; Feuerungskontrolle je Kanton (Aargau 2 Jahre); Berechtigung der Versorgung | Recherche 8 | Auszug |
| Arbeitssicherheit | Suva: 5 + 5 Regeln Elektro (84042), 10 Regeln Gebäudetechnik (84073), Holzbau (84046) | Recherche 8 | Auszug |
| Asbest | vor 1990 ermitteln; unerwarteter Fund: einstellen, Bauherrschaft benachrichtigen (BauAV Art. 32 Abs. 3) | [Suva](https://www.suva.ch/de-ch/praevention/nach-gefahren/gefaehrliche-materialien-strahlungen-und-situationen/asbest/rechtsgrundlage-und-arbeitnehmerschutz) | geprüft am 24.11.2026 (Gebäudehülle) |
| Werkvertrag | Mängelrüge 60 Tage (OR Art. 367 Abs. 1bis, seit 1.1.2026); Verjährung 5 Jahre ab Abnahme (Art. 371 Abs. 2); SIA 118 nur wenn vereinbart | [Parlament](https://www.parlament.ch/centers/eparl/curia/2022/20220066/Schlussabstimmungstext%201%20NS%20D.pdf) | Rüge geprüft am 24.11.2026 (Maler); Rest Auszug |
| Bauhandwerkerpfandrecht | spätestens 4 Monate nach Vollendung (ZGB Art. 839 Abs. 2) | [Gerichte ZH](https://www.gerichte-zh.ch/themen/bau-werk/bauhandwerkerpfandrecht) | geprüft am 24.11.2026 (Maler) |
| MWST | 8,1 Prozent, Pflicht ab 100 000 Franken; ein Saldosteuersatz je Tätigkeit über 10 Prozent | [MWSTG](https://www.fedlex.admin.ch/eli/cc/2009/615/de) | Auszug |
| Saldosteuersatz | Sekundärquellen: 4,5 Prozent für Elektro, Sanitär, Schreinerei; Heizung, Zimmerei nicht gefunden | [ESTV](https://www.estv.admin.ch/de/mwst-saldosteuersatzmethode-2025) | nicht bestätigt; der Betrieb trägt seinen Satz ein |
| Datenschutz | DSG Art. 6, 8, 19, 24; Fotos in Wohnungen nur von Anlage und Arbeit | Recherche 8 | Auszug |

**Die App** erinnert, legt ab, zeigt Fristen und Hinweise mit Quelle. **Sie tut nie:** Messwerte, Anlagen, Asbest oder Sicherheit beurteilen; einen Nachweis als geprüft ausgeben; an Netzbetreiberin, ESTI, BAFU oder Feuerungskontrolle melden; einen Lohn für richtig erklären; Haftung oder Frist im Einzelfall einschätzen. Vor dem Pilot prüft eine Fachperson ([S-17](../entscheide.md)).

## 10. Geräte und Abgleich

| Lage | Stufe 1 ohne JA | Nach JA ([S-06](../entscheide.md)) |
| --- | --- | --- |
| L1 allein im Servicewagen | ein Gerät, Sicherung als Datei | – |
| L3 Team trifft sich im Magazin | Tagesliste als PDF mit QR; Rapport auf Papier, als Foto zurück | morgens Mappe, abends Rapporte, Entnahmen, Fotos, Nachweise als Befehle |
| L4 Notfall im Pikett | Rapport auf dem Handy als PDF | Päckli über das Teilen-Menü |

Alles läuft ohne Netz. **Nie aufs Handy:** Löhne, Einkaufspreise, Margen, Rechnungen, Stunden anderer, Codes ([S-11](../entscheide.md)); Objekt- und Anlagenangaben nur für die Einsätze des Tages. **Erst Stufe 2** ([S-14](../entscheide.md)): Live-Plan bei Notfällen, Pikett-Anrufe aufs Handy.

## 11. Wörter

Objekt heisst Objekt (Liegenschaft, Wohnung), Gerät beim Kunden heisst Anlage, Team heisst Equipe, Werkhof heisst Magazin, Vertrag heisst Wartungsvertrag, Meldung heisst Störung. Massaufnahme vor Ort, Ausmass für die Abrechnung, nie «Aufmass»; nie Abo, Ticket, Job. **Fürs Glossar:** Serviceauftrag, Regierapport, Serviceprotokoll, Typenschild, Wartungsrunde, Pikett, Interventionszeit, Fahrzeuglager, Sollbestand, Nachfüllliste, Kleinmaterial, Installationsanzeige, Schlusskontrolle, Sicherheitsnachweis, Abnahmekontrolle, Kontrollperiode, Kontrollorgan, fachkundige Person, Druckprobe, Inbetriebnahme, Wartungsheft, Dichtigkeitskontrolle, Füllmenge, Fachbewilligung, Etappe, Rückbehalt, Nachkalkulation, Stückliste, Zuschnittliste, Restplatte, Holzliste, Abbund, Aufrichte.

## 12. MVP und Pakete

**MVP** (Pilot 4 bis 8 Wochen, Sanitär-Heizung- oder Elektro-Servicebetrieb mit 2 bis 8 Personen, ein Hauptgerät):

1. Einrichten mit Betriebsarten, Vorlagen und Rollen; Kundschaft, Objekte mit Zugang ohne Codes.
2. Anlagen mit Typenschild-Foto, Historie und Intervall; «fällig» und «überfällig».
3. Störung aufnehmen, Priorität, Tagesliste je Person.
4. Regierapport offline mit Arbeits- und Wegzeit, Fahrt, Material, Unterschrift, PDF, gesperrt.
5. Fahrzeuglager: Entnahme im Rapport, Nachfüllliste, «entnommen, nicht verrechnet».
6. Rechnung aus Rapporten mit QR-Zahlteil und Mahnstufen; Artikel aus eigener Datei.
7. Wartungsrunde und Wartungsvertrag mit Jahresrechnung.
8. Sicherung, Monatspaket für die Treuhand; Papierweg fürs Team bis [S-06](../entscheide.md).

| Paket | Ziel | Abnahme (ganz im Auftrag) |
| --- | --- | --- |
| B-1 Gerüst Haustechnik, Einrichten | Betrieb richtet sich ein | `pnpm check:industry building-services` grün; 1 und 7 Personen |
| B-2 Anlagen und Wartungsplan | jedes Gerät kennen | fällig nach 6.1, Monatsende gekürzt |
| B-3 Störung und Tagesliste | vom Anruf zum Einsatz | Notfall zuerst; kein Code |
| B-4 Regierapport und Fahrzeuglager | Regie und Material nie vergessen | 29 268 Rappen; Bestand 12; gesperrt |
| B-5 Rechnung und Artikel-Import | Rechnung am selben Abend | drei Rapporte, eine Rechnung; «Preis fehlt» |
| B-6 Wartungsverträge | wiederkehrender Umsatz | anteilig 36 000; Kündigungstag |
| B-7 Pikett, Stunden, Regelwerk | Stunden für die Treuhand | 230 Minuten; Hinweis Art. 14; «Wert fehlt» |
| B-8 Nachweise Elektro | NIV-Ablauf lückenlos | Abnahmekontrolle 10.9.2027 |
| B-9 Nachweise Gebäudetechnik | Druckprobe, Kältemittel | Hinweise nach 6.5 |
| B-10 Projekt und Abrechnung | bis Schlussrechnung | 1 476 000 netto; Fristen mit Quelle |
| B-11 Holz: Werkstatt, Stückliste | Schreinerei ohne Abtippen | `pnpm check:industry carpentry` grün; 1,419 m² |
| B-12 Holz: Holzliste, Aufrichte | Zimmerei mit Volumen | 3,744 m³, 1760 kg |

**MVP:** B-1 bis B-6. **Vor dem Pilot:** B-7, B-8 oder B-9 je Betriebsart. **Danach:** B-10, Kopplung (nach S-06), Fahrzeuge und Messgeräte (P-42), Sprachen ([S-07](../entscheide.md)), dann B-11 und B-12. **Welle 6:** fr-CH, it-CH. **Bewusst nie:** Anbindung an Grosshandel, Netzbetreiberinnen, Behörden, Buchhaltung; CAD und Abbund-Programm; Messwerte beurteilen; Heizlast, Statik, Leitungsquerschnitt; Ortung; amtliche Formulare oder Normtexte nachbauen.

## 13. Demo-Betrieb

**Haustechnik Muster GmbH**, Musterweg 12, 8000 Beispielstadt (ZH), Sanitär, Heizung, Lüftung, 7 Personen, 4 Servicewagen; Ansätze und Saldosteuersatz sind Testwerte. **Team:** A. Muster (Inhaber) · B. Muster (Büro 50 Prozent) · C. Muster (Servicetechnikerin Heizung, Fachbewilligung Kältemittel, Pikett, Italienisch) · D. Muster (Servicetechniker Sanitär, Pikett, Portugiesisch) · E. Muster (Monteur, Albanisch) · F. Muster (Lernende) · G. Muster (Aushilfe Magazin). **Kundschaft:** Verwaltung Muster AG (24 Objekte, 41 Anlagen), Genossenschaft Muster (6 Häuser), Familie Muster (Musterweg 4); 38 Wartungsverträge.

| Auftrag | Stand | Zeigt |
| --- | --- | --- |
| Wartungsrunde Juni | 22 fällig, 3 überfällig | Wartungsplan, Serviceprotokoll |
| Rohrbruch Samstag | im Pikett erledigt | Anruf, 230 Minuten |
| Boiler Genossenschaft | unterschrieben, nicht verrechnet | Prüfbeispiel 6.2, Entnahme Wagen 2 |
| Musterweg 4, Öl auf Wärmepumpe | Montage, Nachtrag offen | Projekt, Akonto, Inbetriebnahme |
| Klimagerät Gewerbe Muster AG | Inbetriebnahme geplant | Kältemittel-Hinweis |

**Ein Tag:** 07:00 Wagen 2 nach Nachfüllliste; 09:10 Rapport Boiler unterschrieben; 11:00 Notfall, Wartung verschoben, Text über das Teilen-Menü; 16:30 drei Rapporte zu einer Rechnung. **Für B-11 und B-12:** Holzbau Muster AG, gleiche Adresse, 9 Personen, Küche Familie Muster, Aufstockung Genossenschaft Muster.

## 14. Risiken und offene Fragen

| Risiko oder Frage | Folge | Was hilft, wer entscheidet |
| --- | --- | --- |
| Nachweise wirken wie eine Prüfung | Haftung | nie Urteil, Texttest; Fachperson ([S-17](../entscheide.md)) [Geld] |
| Mindestlöhne Elektro und Holz, Saldosteuersatz nicht bestätigt | falsche Hinweise | «Wert fehlt»; Prüfung im Wortlaut, sobald Alban amtliche und Verbandsseiten im Netz der Sitzung freigibt |
| Servicebetrieb ohne Kopplung | Rapporte bleiben Papier | Alban: Kopplung im Magazin schon zum MVP ([S-06](../entscheide.md)) |
| Notfälle ohne Server | Pikett nur per Anruf | Stufe 2 ([S-14](../entscheide.md)) |
| Recherche W2, Fahrplan W3; erster Pilot | Reihenfolge | Alban nach ersten Kunden ([S-09](../entscheide.md)) |
| Schlüssel, private Handys | Schaden bei Verlust | keine Codes ([S-11](../entscheide.md)) |
| Sprachen, Anrede an Verwaltungen | «du» im Brief | [S-07](../entscheide.md) |
| P-51 erst W4; Artikeldateien unbekannt | Verträge, Import fehlen | Anträge 3 und 5; Kopf |

## 15. Absehbare Plattform-Anträge

`_` steht für `building_services_`.

| Nr. | Antrag | An | Zweite Branche | Bis dahin |
| --- | --- | --- | --- | --- |
| 1 | Anlage: Felder je Typ, Status, Ersatz-Kette, Historie als Ledger | P-23 | Facility, Gebäudehülle, Gastro | `_asset_details`, `_asset_events` |
| 2 | Wiederkehr je Anlage ab letzter Durchführung | P-26 | Gebäudehülle, Facility | in der Branche |
| 3 | P-51 vor W4 (wie Facility 1, Gebäudehülle 13) | P-51 | Facility, Gebäudehülle | Port `ContractRegister` |
| 4 | Sollbestand je Lagerort, Nachfüllliste, Entnahme aus dem Rapport | P-41, P-25 | Gebäudehülle, Umzug | Port `StockSource` |
| 5 | Artikel und Leistungen aus Datei einlesen | P-24, P-41 | Maler, Gebäudehülle | von Hand |
| 6 | Pikett mit Anrufprotokoll und Hinweis ArGV 1 | P-31 | Facility | Port `OnCallRoster` |
| 7 | Störung: Priorität, Zeitfenster, wer zahlt | P-25 | Facility, Garten | `_service_requests` |
| 8 | Rapport: Wegzeit, Fahrt, Kleinmaterial (wie Facility 6) | P-25, P-31 | Facility, Maler | `_report_extras` |
| 9 | Bewilligungen und Ausweise mit Ablauf | P-20, P-27, P-42 | Gebäudehülle, Umzug | `_licences` |
| 10 | Etappen, Nachkalkulation (wie Facility 7) | P-25, P-32 | `carpentry`, Maler | Port `JobStages` |
| 11 | Fristen Werkvertrag (wie Gebäudehülle 10) | P-28, P-29 | `carpentry`, Maler | von Hand |
| 12 | Kran-Reservation (nach `envelope_crane_bookings`) | P-42 | Gebäudehülle | `carpentry_lifts` |
| 13 | Wetterentscheid (nach `envelope_weather_*`) | P-25, P-28 | Gebäudehülle | wartet |
| 14 | Messgeräte mit Kalibrierung; Texterkennung Typenschild | P-42, P-10 | Gebäudehülle, Gastro | Foto |

Mitgetragen: Schadstoff-Fall (Gebäudehülle 1), Befund am Objekt (Facility 2), Schlüssel-Register (Facility 3), Lohnkategorie (Gebäudehülle 7). Anträge in `docs/branchen/haustechnik-holz/antraege.md`; der Kopf entscheidet ([Zusammenarbeit](../zusammenarbeit.md), Abschnitt 5).

## 16. Stand

Steckbrief vom 24.11.2026, noch nichts gebaut.

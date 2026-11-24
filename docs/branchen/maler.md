# Maler, Gipser und Innenausbau

- **Kennung im Code:** `painting` (Präfix für Tabellen, Operationen, Funktionen; ADR-Präfix `PNT`); Betriebsarten `painting.painter`, `painting.plasterer`, `painting.floor_tiles`
- **Ausgabe:** Vor Ort ([S-01](../entscheide.md))
- **Welle:** W2 ([Fahrplan](../fahrplan.md))
- **Eignung:** 4,5 – Offerte aus dem Ausmass, Regie mit Unterschrift und Rechnung am Tag der Abnahme sparen vom ersten Tag an Abende; was hier entsteht, tragen Gebäudehülle, Haustechnik und Holz mit.
- **Recherche:** [`maler-recherche.md`](maler-recherche.md) · **Auftrag:** [`../auftraege/branche-maler.md`](../auftraege/branche-maler.md)

## 1. Kurzbild

| Frage | Antwort |
| --- | --- |
| Wie viele | Maler und Gipser (Suva-Tarif 44D): 6789 Betriebe, 35 613 Beschäftigte, rund 6459 mit 0 bis 19 Mitarbeitenden (EKAS, Branchenlösung 19; Lesart zu prüfen); Boden rund 1505, Platten rund 1557 Betriebe (EKAS 62, 55); BFS STATENT nicht belegt |
| Grösse | 1 bis 10 Personen, fast alle unter 20 |
| Wer arbeitet | Inhaber:in (draussen, abends Büro), Büro in Teilzeit, ab etwa 8 Personen Bauführer:in, Vorarbeiter:in, Berufsleute, Hilfskräfte, Lernende; extern Treuhand, Gerüstbau |
| Sprachen | nicht belegt; Annahme: neben Deutsch Portugiesisch, Italienisch, Albanisch, Bosnisch-Kroatisch-Serbisch, Spanisch, Türkisch ([S-07](../entscheide.md)) |
| Aussendienst | Einschätzung: alle ausser dem Büro fast ganz auf Objekten |
| Saison | Winter innen und Offerten; März bis April und Herbst Mieterwechsel; Mai bis September Fassaden; August Lehrbeginn |

## 2. Teilbranchen und Betriebsarten

Mehrfach wählbar; Maler-Gipser wählt die ersten beiden.

| Betriebsart | Kennung | Was sie tut | Startfunktionen |
| --- | --- | --- | --- |
| Malerei | `painting.painter` | Streichen, Spachteln, Tapezieren, Lackieren, innen und Fassade; auch Renovationsservice allein | Besichtigung, Offerte, Rapport, Farbbuch, Abnahme, Abrechnung; bei 1 Person Umfang «Schlank», Regie als Standard |
| Gipserei und Trockenbau | `painting.plasterer` | Putz, Abrieb, Stuck, Trockenbau, abgehängte Decken, Aussenwärmedämmung | wie Malerei; Farbbuch als Option, Gerüst-Checkliste an |
| Boden- und Plattenbeläge | `painting.floor_tiles` | Altbelag entfernen, ausgleichen, Beläge, Parkett, Platten, Abdichtung, Fugen | «Material- und Fugenbuch» statt Farbbuch, Verschnitt an, Abdichtungs-Checkliste |

## 3. Alltag

- **Ablauf:** Anfrage › Besichtigung mit Massband, Fotos, Baujahr › abends Ausmass abtippen, Offerte aus der Vorlage vom Vorjahr › nachfassen › Annahme › planen › Einsatz › Rapport › Zusatzwünsche mündlich › Abnahme ohne Protokoll › Rechnung aus drei Quellen › mahnen › Garantie mit unbekanntem Farbton.
- **Tag:** 06:30 Magazin, bis 16:30 Objekt, Rapport, abends Offerten. **Woche:** Montag planen, Freitag Rapporte und Rechnungen. **Monat:** Stunden, Spesen, Belege, offene Posten. **Jahr:** Abschluss, MWST, Prüfung von Leitern und Geräten.
- **Heute:** Rapportblock und Skizze, Tabellenkalkulation, Gruppenchat für Fotos (Kundendaten auf privaten Handys), Magnettafel, Gedächtnis der Inhaberin.

## 4. Schmerzen

Gewichtung nach der Recherche, im Pilot zu prüfen.

1. Offerten kosten die Abende; sie kommen spät, Aufträge gehen verloren.
2. Regie und Zusatzarbeiten werden nicht verrechnet.
3. Rapporte kommen spät oder unvollständig; Lohn und Rechnung beruhen auf Schätzungen.
4. Die Rechnung ist ein eigener Arbeitsgang und geht Wochen nach Abschluss hinaus.
5. Zahlungen kommen spät; die Frist für das Bauhandwerkerpfandrecht wird verpasst.
6. Farbton und Material von damals sind unbekannt.
7. Abnahme ohne Protokoll; Fristen hat niemand im Blick.
8. Stunden nach GAV (Reisezeit, Samstag, Mittagsentschädigung, Ferien nach Alter) sind aufwendig.

**Warum keine Software:** keine Zeit, Programme für Betriebe mit Büro, Computer statt Handy, kein Netz, Formulare in Deutsch, Misstrauen. **Was bewegt:** Offerte in 15 Minuten, ein Weg ohne Doppeltippen, Rapport in zwei Minuten ohne Netz, Rechnung am Tag der Abnahme, keine Daten bei Fremden.

## 5. Plattform-Module

| Modul | Wofür, Einstellungen der Branche | M/S/K |
| --- | --- | --- |
| P-20 Betrieb und Personen | UID, MWST-Art, Bank für QR; Saldosteuersatz als Eingabe des Betriebs | M |
| P-21 Rollen und Rechte | Rollen aus Abschnitt 8 | M |
| P-22 Kundschaft | Privat, Verwaltung, Stockwerkeigentum, Generalunternehmen; Mieter:innen nur im Auftrag | M |
| P-23 Objekte und Standorte | Gebäude › Wohnung › Raum; Fassade; Raumvorlagen; Schlüssel nur mit Nummer | M |
| P-24 Leistungen und Material | Vorlage aus 7 ohne Ansätze; m², m, Stk., h, pauschal, l, kg | M |
| P-25 Aufträge, Einsätze, Rapporte | Preisarten Pauschal, Einheitspreis, Regie; Ausmass mit Formelsatz; Nachtrag; Abnahme | M |
| P-26 Pläne und Wiederkehr | wiederkehrende Unterhaltsanstriche einer Verwaltung | K |
| P-27 Checklisten und Nachweise | Vorlagen 7.2, Stopp-Meldung, Unterweisung | S |
| P-28 Kalender und Erinnerungen | Wochenplan, Nachfassen, Samstagsmeldung, Fristen, Akonto | M |
| P-29 Offerten und Rechnungen | Offerte nach Raum, Akonto, Schluss- und Regierechnung, QR, Mahnung | M |
| P-30 Kasse und Belege | Ausgabenarten Material, Gerüst, Fahrzeug, Werkzeug, Entsorgung, Magazin | S |
| P-31 Team und Zeit | Stunden aus dem Rapport, Monatsblatt, Regelwerk aus 6.8 | M |
| P-32 Heute | Einsätze, offene Rapporte, Nachfassen, offene Posten, Fristen | M |
| P-33 Fotos und Dateien | Vorher, Mangel, Nachher, Farbmuster, Schadstoffbericht; «Fotografiere das Bauteil, nicht die Einrichtung.» | M |
| P-40 Kopplung und Abgleich | Mappe ohne Preise ([S-06](../entscheide.md)) | S |
| P-41 Material und Lager | Gebinde im Magazin, Verbrauch aus Rapport, Restfarbe | S |
| P-42 Fahrzeuge und Geräte | Lieferwagen, Spritzgeräte, Leitern, Rollgerüst | K |
| P-50 Termine | Besichtigungstermine | K |
| P-51 Verträge und Abos | – | – |
| P-52 Kurse mit Plätzen | – | – |

Dazu aus dem Fundament P-06 (Einrichten), P-07 (Lexikon), P-10 (Kamera mit Fallback, Unterschrift), P-11 (Stil «Formular»).

## 6. Eigene Module der Branche

Alle Tabellen tragen `businessId`. Längen in Millimeter, Mengen in Tausendstel der Einheit, Geld in Rappen, Sätze in Basispunkten, alles Ganzzahlen; Tage als `YYYY-MM-DD`. Spalte «H, A»: Heikelkeit (n, i, h) und Abgleich-Art nach [ADR-0005](../adr/0005-gemeinsames-datenmodell.md). **K** = Kandidat für die Plattform (Abschnitt 15).

### 6.1 Besichtigung und Raumbuch (`painting.survey`)

Der Raum ist ein Objekt der Ebene «Raum» (P-23), Mengen und Formeln liegen im Ausmass (P-25); die Branche liefert Bauteil-Befund und Formelsatz.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `painting_surveys` | jobId, siteId, date, personId, buildYear (leer = unbekannt), occupied, status (`draft`, `measured`, `quoted`) | n, ein Schreiber |
| `painting_surfaces` | surveyId, roomSiteId, kind (`wall`, `ceiling`, `floor`, `facade`, `gable`, `soffit`, `reveal`, `skirting`, `door`, `window`, `radiator`, `other`), unit, lengthMm, widthMm, heightMm, measurementLineId, substrate, condition, fileIds | n, ein Schreiber |
| `painting_openings` | surfaceId, kind (`door`, `window`, `passage`), widthMm, heightMm, count, deduct, revealSides (0, 3, 4) | n, ein Schreiber |
| `painting_hazard_flags` **K** | surveyId, siteId, kind (`asbestos_suspect`, `lead_suspect`, `other`), reason, status (`open`, `report_on_file`, `assessment_ordered`, `customer_informed`, `stop`) | i, Ledger |

| Grösse | Formel (in mm gerechnet, je Zeile einmal kaufmännisch auf 0,001 gerundet, Formel sichtbar) |
| --- | --- |
| Umfang U | 2 × (L + B), oder von Hand |
| Wand netto | U × H − Σ (b × h × Anzahl) der Öffnungen, die grösser sind als die Schwelle `openingDeductionThresholdM2`; Schwelle leer = alles abziehen; den Wert setzt der Betrieb nach seinem Vertrag |
| Decke, Boden | L × B; Boden mit Verschnitt × (1 + Verschnitt), Richtwert des Betriebs |
| Fassade | Σ (B × H) + Σ Giebel (B × Giebelhöhe ÷ 2) − Abzüge |
| Leibung | 2h + b (drei Seiten) oder 2h + 2b (vier Seiten), × Anzahl |
| Sockel | U − Σ Türbreiten |

**Prüfbeispiel:** Raum 4,200 × 3,600 × 2,500 m, Tür 0,900 × 2,000, Fenster 1,200 × 1,400: U 15,600 m; Wand brutto 39,000 m²; netto 35,520 m² (Schwelle leer) oder 39,000 m² (Schwelle 2,000 m²); Decke 15,120 m²; Leibung Fenster 4,000 m; Sockel 14,700 m. Fassade 10,000 × 6,000 mit Giebel 3,000 hoch: 75,000 m².
**Operationen:** `painting.survey.start`, `painting.surface.add`, `painting.opening.add`, `painting.hazard.flag`, `painting.survey.complete` (bei Baujahr vor 1990 oder unbekannt nur mit Vermerk: Bericht vorhanden, Abklärung veranlasst, Kundschaft informiert). **Dokument:** Ausmassblatt.

### 6.2 Offerte aus dem Ausmass (`painting.quoting`)

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `painting_item_mappings` | catalogItemId, surfaceKinds, coats, active | i, ein Schreiber |

Die Offerte ist P-29. Zeilentotal = round(Menge in Tausendstel × Einheitspreis in Rappen ÷ 1000); Eventualpositionen nicht im Total; der Saldosteuersatz ändert nie den Satz auf der Offerte. Die Offerte nennt ihre Preisart mit Quelle (OR Art. 373 bis 375); Regie auf Pauschal fragt «Ist dafür ein Nachtrag vereinbart?». `painting.quote.fromSurvey` › P-29 stellt aus, die Person teilt das PDF › Nachfassen nach Frist des Betriebs (Vorschlag 10 Tage) › Annahme mit Unterschrift oder «per E-Mail bestätigt».

### 6.3 Rapport der Branche (`painting.reports`)

Ergänzt den Tagesrapport von P-25 (Stunden, Reisezeit, Material, Fotos, Regie getrennt, Unterschrift, danach gesperrt).

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `painting_report_lines` | reportId, roomSiteId, surfaceKind, catalogItemId, quantityDone | n, Ledger |
| `painting_report_conditions` | reportId, weather (`dry`, `rain`, `wind`, `frost`), temperatureTenthC; nur mit Option «Fassade» | n, Ledger |

Arbeitszeit = bis − von − Pause; Reisezeit getrennt, den bezahlten Teil rechnet P-31. Regie = Σ (Regiestunden × Ansatz der Regie-Position) + Regiematerial × (1 + Materialzuschlag). Dokumente: Tages- und Regierapport.

### 6.4 Farb- und Raumbuch (`painting.color_book`)

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `painting_finishes` | siteId (Raum), surfaceKind, colorSystem, colorCode, sheen (`matt`, `semi_matt`, `satin`, `gloss`, `other`), product (Text des Betriebs), batch, coats, appliedOn, jobId, sampleFileId, replacesId | n, Ledger |
| `painting_color_approvals` | finishId, sampleFileId, approvedByName, signatureFileId, approvedAt | n, Ledger, gesperrt |
| `painting_leftovers` | finishId, quantity, unit, containers, location («Keller Abteil 3») | n, Ledger |

Suche über Objekt, Raum und Farbcode; Korrektur als neue Zeile. Dokumente: Farbtonliste, Musterfreigabe.

### 6.5 Abnahme und Garantie (`painting.warranty`)

Abnahmeprotokoll und Mängel sind P-25.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `painting_job_terms` | jobId, contractBasis (`or`, `sia118`, `other`) | n, ein Schreiber |
| `painting_warranty_cases` | jobId, siteId, reportedOn, description, fileIds, finishIds, status (`open`, `fixed`, `closed`) | n, ein Schreiber |

Fristen als Erinnerung (P-28) nach Vertragsgrundlage, mit Quelle und dem Satz «Im Streitfall entscheidet der Vertrag; frag deine Rechtsberatung.»: Mängelrüge 60 Tage, Verjährung 5 Jahre, SIA 118 nur wenn vereinbart, Pfandrecht 4 Monate. Kosten eines Garantiefalls aus Rapporten der Art Garantie, berechnet, nur mit Recht. Dokument: Garantieschein mit Farbtonliste.

### 6.6 Abrechnung (`painting.billing`)

Keine Tabelle; Positionen an P-29 über den Port `InvoiceSource`. Pauschal: Offerttotal + Σ Nachträge. Einheitspreis: Σ (Schlussmenge × Einheitspreis), Differenz Ist − Offerte als Spalte. Regie: Σ unterschriebene Regierapporte. Schlussrechnung = Σ Positionen − Σ Akonto (netto) + MWST auf dem Rest. Pfandrecht: Erinnerung 4 Wochen vor Ablauf von 4 Monaten nach dem letzten Rapport mit pfandberechtigter Arbeit, solange die Rechnung offen ist. Deckungsbeitrag = Rechnung netto − Σ Stunden × interner Stundensatz − Material, berechnet, nur mit Recht.

### 6.7 Schadstoffe, Sicherheit, Entsorgung (`painting.site_safety`)

Checklisten, Stopp-Meldung und Unterweisung sind P-27.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `painting_hazard_reports` **K** | siteId, present, reportDate, fileId (PDF), summary | i, ein Schreiber |
| `painting_waste_records` **K** | jobId, kind (`solvent_paint`, `water_paint`, `sludge`, `other`), quantity, unit, disposer, documentRef, date | n, Ledger |

Hinweise mit Quelle: Baujahr vor 1990 oder unbekannt verlangt einen Vermerk (Jahr als Richtwert); «Arbeit stoppen» erzeugt die Stopp-Meldung und eine Meldung an die Bauherrschaft als PDF zum Weitergeben; Altanstrich vor 2005: Blei; über 2 m Seitenschutz, über 3 m Fassadengerüst. Nie «asbestfrei», «unbedenklich» oder «sicher».

### 6.8 Regelwerk und Samstagsarbeit (`painting.labor_rules`)

Regelwerke als Daten für P-31 mit Quelle, Gültigkeit und Stand: «GAV Maler- und Gipsergewerbe 2026–2029» und «Arbeitsgesetz allein». Bausteine aus Abschnitt 9; ein Wert ohne «geprüft» erscheint als «Wert fehlt» mit Quelle.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `painting_saturday_notices` | date, jobId, personIds, reportedAt (von Hand), reference | i, Ledger |

Ein Einsatz am Samstag erzeugt eine Erinnerung am Freitag vor der Meldefrist; die Person meldet selbst und vermerkt «gemeldet». Die App meldet nie selbst.

### 6.9 Kalkulation (`painting.costing`, Welle 3)

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `painting_material_uses` **K** | catalogItemId, materialId (P-41), quantityPerUnit, coats, wasteBp | i, ein Schreiber |

Einheitspreis = Zeit je Einheit × Kalkulationsansatz + Σ (Menge je Einheit × Anstriche × (1 + Verlust) × Materialpreis) × (1 + Materialzuschlag); Materialpreise in Rappen pro 1000 Basiseinheiten. Bedarf aufgerundet auf ganze Gebinde; ohne Wert «Verbrauch fehlt». Leistungswerte starten leer; nach drei Aufträgen schlägt die App den Ist-Wert vor.

## 7. Vorlagen

**Leistungen** (eigene Worte, ohne Ansätze; ganze Liste mit Nummern in der Recherche, Abschnitt 6.1): Baustelle einrichten, Abdecken, Abkleben; Untergrund vorbereiten, spachteln nach Qualitätsstufe des Vertrags, grundieren; Wand und Decke Dispersion (m²); Tapete entfernen und tapezieren (m²); Türe, Fensterrahmen, Heizkörper, Fensterladen (Stk.); Sockel, Leibung (m); Fassade reinigen, grundieren, streichen, Dachuntersicht (m²); Grund- und Deckputz, Trockenbauwand, abgehängte Decke, Aussenwärmedämmung (m²); Altbelag, Ausgleich, Belag, Parkett, Abdichtung, Platten, Fugen (m²), Sockelleiste, Silikonfuge (m); Regiestunde Berufsperson und Hilfskraft (h); Kleinmaterial, Fahrzeug, Entsorgung, Gerüst als Fremdleistung (pauschal).

**Checklisten:** *Vor Arbeitsbeginn:* Baujahr und Bericht; Altanstriche vor 2005; Seitenschutz ab 2 m; Gerüst über 3 m abgenommen; Leitern; Lösemittel und Lüftung; Fehlerstromschutz; Schutzausrüstung; Zugang und Schlüssel; Unterweisung. *Qualität:* Untergrund mit Foto; Temperatur nach Merkblatt (Wert des Betriebs); Farbton freigegeben; Zwischenkontrolle. *Übergabe:* Abnahmeprotokoll; Mängel mit Frist; Restfarbe mit Ort; Farbtonliste; Schlüssel mit Quittung; Sonderabfall mit Beleg. *Mieterwechsel:* Schäden vorher fotografiert; Arbeiten zu Lasten Mieter:in getrennt.

**Dokumente:** Offerte, Ausmassblatt, Auftragsbestätigung, Nachtrag, Farbtonliste, Musterfreigabe, Tages- und Regierapport, Abnahmeprotokoll, Garantieschein, Rechnungen mit QR, Mahnungen, Schlüsselquittung (Nummer, nie Adresse), Kontrollblatt, Meldung Arbeitsstopp, Entsorgungsnachweis. Anrede an Dritte nach [S-07](../entscheide.md).

**Fragen beim Einrichten:** Betriebsarten; Personen (1: «Schlank»; ab 2: Rollen, Wochenplan, Zeit); Kanton (Regelwerk als Vorschlag); Kundschaft meistens (Vorlagen Mieterwechsel, Regie, Schlussausmass); Fassaden (Gerüst, Wetter); Lernende; MWST und Methode (Saldosteuersatz trägst du selbst ein); Standard-Preisart; Sprache der Dokumente.

## 8. Rollen und Arbeitsplätze

| Rolle | Sieht und tut | Sieht nie | Gerät | Tab-Leiste |
| --- | --- | --- | --- | --- |
| Inhaber:in | alles | – | Handy, iPad, Computer | Heute · Aufträge · Besichtigung · Rechnungen · Mehr |
| Büro | Kundschaft, Offerten, Rechnungen, Belege, Monatspaket, Stunden aller | Margen (Option), Rechte | Computer | Heute · Rechnungen · Kundschaft · Stunden · Mehr |
| Bauführer:in | Besichtigung, Offerte, Planung, Abnahme, Rapporte, Margen je Auftrag (Option) | Löhne | iPad, Handy | Heute · Besichtigung · Aufträge · Plan · Mehr |
| Vorarbeiter:in | Einsätze der Equipe, Mappe ohne Preise, Rapporte schreiben und unterschreiben lassen, Material-Liste, Mängel | Preise, Margen, Löhne anderer | Handy | Heute · Rapport · Farbbuch · Fotos |
| Berufsperson, Lernende:r | eigene Einsätze, Mappe ohne Preise, eigene Stunden, Fotos, Checklisten | Preise, Kundschaft ausser Objektkontakt, Löhne anderer | Handy | Heute · Rapport · Fotos · Meine Stunden |
| Hilfskraft | eigene Einsätze, Adresse, Zugangshinweis des Tages, eigene Stunden | alles andere | Handy, grosse Knöpfe | Heute · Meine Stunden |

Externe bekommen Dateien, keine Rolle. Heikle Rechte: «Preise und Margen», «Löhne», «Rechnung ausstellen», «Rapport ergänzen», «Kundschaft exportieren», «Zugangshinweise».

## 9. Recht und Pflichten

**24.11.2026:** vom Kopf nachgeprüft. **Recherche:** der Branchen-Agent liest den Volltext und trägt das Datum ein, bevor der Wert in die App kommt. **nicht bestätigt:** nicht in die App, auch nicht als Richtwert. Weitere Fakten: Recherche, Abschnitt 8.

| Fakt | Wert | Quelle | geprüft am |
| --- | --- | --- | --- |
| GAV Maler- und Gipsergewerbe | allgemeinverbindlich; Änderung vom 5.3.2026, in Kraft 1.4.2026, gültig bis 31.3.2029; Ausnahmen (Gipser Stadt Zürich, eigene GAV BS und BL) | [SECO](https://www.seco.admin.ch/seco/de/home/Arbeit/Personenfreizugigkeit_Arbeitsbeziehungen/Gesamtarbeitsvertraege_Normalarbeitsvertraege/Gesamtarbeitsvertraege_Bund/Allgemeinverbindlich_erklaerte_Gesamtarbeitsvertraege/Maler_Gipsergewerbe.html) | 24.11.2026 (Laufzeit); Ausnahmen: Recherche |
| Mindestlöhne ab 1.4.2026 | Recherche: Vorarbeiter:in Maler 5744, Gipser 5956; Kategorie A 5051, 5267; C 4429, 4590 Franken im Monat; Zusatzvereinbarung nicht lesbar | [Zusatzvereinbarung](https://syna.ch/images/GAV/ZV_für_das_Maler-_und_Gipsergewerbe_2026_D.pdf) | nicht bestätigt |
| Samstagsarbeit | Fünftagewoche; ab 1.4.2026 Meldepflicht (GAV Art. 8.12) bis Freitag 15.00 Uhr bei der Zentralen Paritätischen Berufskommission; keine Bewilligung; Konventionalstrafe möglich | [Anleitung](https://www.smgv.ch/download-center/de/02_service/02_rechtliches/03_gav/anleitung-fuer-die-meldung-von-samstagsarbeit.pdf) | 24.11.2026 |
| Zuschlag Samstag | Recherche: 25 Prozent ab dem vierten Samstag; GAV Art. 8.4.3 lesen | [Unia](https://unia.ch/de/berufe-branchen/maler-gipsergewerbe) | nicht bestätigt |
| GAV-Bausteine | 40 Stunden pro Woche, höchstens 48; unbezahlte Reisezeit bis 2029 auf 15 Minuten pro Tag; Ferien 27, 22, ab 50 wieder 27 Tage; Mittagsentschädigung 275 Franken im Monat oder 23 je Mahlzeit | [Unia](https://unia.ch/de/berufe-branchen/maler-gipsergewerbe), [GAV](https://www.gav-service.ch/gav/355001) | Recherche |
| Arbeitszeit | Verzeichnisse (ArG Art. 46, ArGV 1 Art. 73, 73b), 5 Jahre; Jugendliche (ArGV 5 Art. 4) | [SECO](https://www.seco.admin.ch/de/arbeitszeiterfassung) | Recherche |
| Asbest | bei Verdacht Gefahren vor Arbeitsbeginn ermitteln (BauAV Art. 3); unerwarteter Fund: einstellen, Bauherrschaft benachrichtigen (Art. 32 Abs. 3); erhebliche Freisetzung nur anerkannte Unternehmen (Art. 82) | [Suva](https://www.suva.ch/de-ch/praevention/nach-gefahren/gefaehrliche-materialien-strahlungen-und-situationen/asbest/rechtsgrundlage-und-arbeitnehmerschutz) | 24.11.2026; Jahr 1990: Recherche |
| Blei, Absturz, Abfall | Bleifarben seit 2005 verboten; Seitenschutz ab 2 m, Fassadengerüst über 3 m; Branchenlösung (EKAS 6508); Malereiabfall als Sonderabfall mit Beleg | [Suva](https://www.suva.ch/gerueste), [EKAS](https://ekas.admin.ch/fileadmin/Dokumente/Kurzbeschriebe_ueBL_ASA-Loesungen/Branchenloesungen/DE/BL_19_Maler-_und_Gipsergewerbe.pdf) | Recherche |
| Mängelrüge | unbewegliches Werk 60 Tage, kürzere Frist ungültig (OR Art. 367 Abs. 1bis, 370 Abs. 4), seit 1.1.2026; Fristbeginn und Übergang im Wortlaut lesen | [Parlament](https://www.parlament.ch/centers/eparl/curia/2022/20220066/Schlussabstimmungstext%201%20NS%20D.pdf), [Uni Freiburg](https://www.unifr.ch/ius/baurecht/assets/public/uploads/BRDC_5_25_SIA.pdf) | 24.11.2026 |
| Werkvertrag | Verjährung 5 Jahre ab Abnahme (OR Art. 371 Abs. 2); Preisarten (Art. 373 bis 375); Aufbewahrung 10 Jahre (Art. 958f) | [OR](https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de) | Recherche |
| Bauhandwerkerpfandrecht | Eintragung spätestens 4 Monate nach Vollendung (ZGB Art. 839 Abs. 2), Verwirkungsfrist; massgebend die letzte pfandberechtigte Leistung, nicht Material; vorläufige Eintragung möglich | [Gerichte ZH](https://www.gerichte-zh.ch/themen/bau-werk/bauhandwerkerpfandrecht) | 24.11.2026 |
| SIA 118, Normen | SIA 118 nur wenn vereinbart, Rügefrist 2 Jahre; SIA 257, 242, 248 und NPK nur nennen | [Uni Freiburg](https://www.unifr.ch/ius/baurecht/assets/public/uploads/BRDC_5_25_SIA.pdf) | Recherche |
| MWST | 8,1 Prozent (MWSTG Art. 25), ab 100 000 Franken (Art. 10), halbjährlich mit Saldosteuersatz (Art. 35) | [MWSTG](https://www.fedlex.admin.ch/eli/cc/2009/615/de) | Recherche |
| Saldosteuersatz | Recherche: Malerei und Gipserei 5,3, Platten 4,5 und 6,8 Prozent; kein Beleg; Grenzen widersprüchlich | [ESTV](https://www.estv.admin.ch/de/mwst-saldosteuersatzmethode-2025) | nicht bestätigt; der Betrieb trägt seinen Satz ein |

**Die App** erinnert, weist nach und zeigt Hinweise mit Quelle; nach DSG (Art. 6 und 8, Recherche) fotografiert sie das Bauteil, nennt Schlüssel nur mit Nummer und hält Daten von Mieter:innen nur im Auftrag. **Sie tut nie:** Schadstoffe oder Absturz beurteilen, die Frist im Einzelfall nennen, Lohn als korrekt bestätigen, Haftung einschätzen, bei Behörden oder Kommissionen melden.

## 10. Geräte und Abgleich

| Lage | Typisch | Stufe 1 ohne JA | Nach JA ([S-06](../entscheide.md)) |
| --- | --- | --- | --- |
| L1 allein | Renovationsservice | ein Gerät; Sicherung als Datei | – |
| L2 Handy und Laptop | Inhaberin und Büro | ein Hauptgerät | Kopplung zu Hause im WLAN |
| L3 Equipe im Magazin | 3 bis 10 Personen | Hauptgerät bei Inhaber:in; Einsatzblatt und Rapportformular als PDF mit QR; Rapport auf Papier und als Foto zurück | morgens Mappe, abends Rapporte, Stunden, Fotos, Mängel, Unterschriften als Befehle; Päckli |

Alles geht ohne Netz (Keller, Tiefgarage, Rohbau); das WLAN der Kundschaft wird nicht genutzt. **Nie aufs Handy:** Ansätze, Offertsummen, Margen, Löhne, Rechnungen, Stunden anderer, Codes ([S-11](../entscheide.md)). **Erst Stufe 2** ([S-14](../entscheide.md)): Live-Abgleich, Planung, die sich sofort ändert, Annahme über einen Link.

## 11. Wörter

Objekt heisst Objekt (Wohnung, Haus, Treppenhaus, Fassade), darunter Raum; Werkhof heisst Magazin; Team heisst Equipe; Rapport heisst Tagesrapport oder Regierapport; Kundschaft heisst in Dokumenten Bauherrschaft, wo der Vertrag es so nennt. **Fürs Glossar:** Abrieb, Schlussausmass, Übermessen, Leibung, Untersicht, Glanzgrad, Charge, Gebinde, Musterfreigabe, Restfarbe, Farbbuch, Akonto, Rückbehalt, Eventualposition, Verschnitt, Bauhandwerkerpfandrecht.

## 12. MVP und Pakete

**MVP** (Pilot von 4 bis 8 Wochen, ein Gerät):

1. Einrichten mit Betriebsart, Leistungs-Vorlage und Rollen; Kundschaft, Objekte mit Räumen, Aufträge mit Preisart.
2. Besichtigung mit Raumbuch und Ausmass, Fotos, Baujahr-Hinweis, ohne Netz.
3. Offerte aus dem Ausmass mit Gruppen nach Raum und Eventualpositionen, PDF, Annahme mit Unterschrift, Nachfassen.
4. Wochenplan der Einsätze.
5. Tagesrapport mit Stunden, Reisezeit, Material, Fotos, Regie getrennt, Unterschrift; Nachtrag.
6. Farbbuch je Raum mit Musterfreigabe und Restfarbe.
7. Abnahmeprotokoll mit Mängeln und Fristen als Erinnerung.
8. Rechnung mit QR aus Offerte, Schlussausmass oder Regie; Akonto; offene Posten; Mahnung.

| Paket | Ziel | Abnahme (ganz im Auftrag) |
| --- | --- | --- |
| B-1 Gerüst und Einrichten | Ein Betrieb richtet sich als Maler, Gipser oder Boden und Platten ein | `pnpm check:industry painting` grün; 1 und 6 Personen schalten die richtigen Funktionen |
| B-2 Besichtigung und Raumbuch | Ausmass auf dem Handy, ohne Netz | Prüfbeispiel aus 6.1 exakt; Baujahr 1972 verlangt Vermerk |
| B-3 Offerte aus dem Ausmass | Offerte ohne Mengen abzutippen | Mengen aus dem Ausmass; Eventualposition nicht im Total |
| B-4 Rapport, Regie, Nachtrag | Regie nie vergessen | Regierapport mit Unterschrift gesperrt; Frage bei Regie unter Pauschal |
| B-5 Farbbuch | Farbton je Raum auf Jahre | Suche nach Farbcode; Farbtonliste als PDF |
| B-6 Abnahme und Garantie | Protokoll und Fristen | nur Fristen mit «geprüft»; Garantiefall zeigt Farbton von damals |
| B-7 Abrechnung | Rechnung am Tag der Abnahme | drei Preisarten, Akonto und Schluss exakt; Pfandrecht-Erinnerung |
| B-8 Schadstoffe, Sicherheit, Entsorgung | festhalten, nie beurteilen | Kontrollblatt, Arbeitsstopp; Texttest ohne beurteilende Wörter |
| B-9 Regelwerk und Samstag | Stunden nach GAV vorbereiten | nur geprüfte Werte; Erinnerung vor der Samstagsmeldung |
| B-10 Kalkulation und Kennzahlen | Preise aus Zeit und Material | Bedarf auf Gebinde; Vorschlag des Leistungswerts |

**Vor dem Pilot:** B-8, B-9, Kasse (P-30). **Welle 3:** B-10, Kopplung ([S-06](../entscheide.md)), Sprachen im Aussendienst ([S-07](../entscheide.md)), Fahrzeuge. **Welle 6:** fr-CH, it-CH, Westschweizer GAV. **Bewusst nie:** Gerüstplanung, Statik, CAD; Lohn- und Finanzbuchhaltung; Anbindung an Bank, Händler, Meldeplattformen, Behörden, Messgeräte; Schadstoffe beurteilen; NPK- oder SIA-Texte; Herstellernamen; Seiten für Kundschaft ohne Albans JA.

## 13. Demo-Betrieb

**Malerei Muster GmbH**, Musterweg 12, 8000 Beispielstadt; 6 Personen, GAV, Saldosteuersatz (Demo-Eingabe). Team: A. Muster (Inhaberin), B. Muster (Büro 40 Prozent), C. Muster (Vorarbeiter, Italienisch), D. Muster (Malerin EFZ), E. Muster (Gipser EFZ, Portugiesisch), F. Muster (Lernende, Albanisch). Kundschaft: Verwaltung Muster AG, Stockwerkeigentum Musterweg 3, Familie Muster (Haus von 1972), Generalbau Muster AG, Privatkundin Muster.

| Auftrag | Preisart | Stand | Zeigt |
| --- | --- | --- | --- |
| 3½-Zimmer-Wohnung, Mieterwechsel, Musterweg 7 | Pauschal | Tag 2 von 4 | Ausmass, Offerte, Rapport, Farbbuch |
| Treppenhaus Musterweg 3 | Einheitspreis | Offerte ausgestellt | Nachfassen, Eventualposition Geländer |
| Fassade Familie Muster | Einheitspreis | besichtigt | Schadstoffhinweis offen, Gerüst-Checkliste |
| Kleinreparaturen Privatkundin Muster | Regie | abgeschlossen | Regierapport, Regierechnung |
| Neubau, Weissputz und Anstrich | Einheitspreis, Akonto | in Arbeit | Akonto, Schlussausmass |
| Garantiefall Bad 2024 | Garantie | gemeldet | Farbton von damals |

**Ein Tag:** Wohnzimmer Musterweg 7 mit dem Prüfbeispiel aus 6.1. C. und D. Muster 07:00 bis 16:30, Pause 60, Reisezeit 20 Minuten (je 8 h 30); F. Muster 07:00 bis 16:00, Pause 60 (8 h). Regie «Kellerabteil streichen», 1,5 h, unterschrieben vom Hauswart. Ansätze sind Testwerte.

## 14. Risiken und offene Fragen

| Risiko oder Frage | Folge | Was hilft, wer entscheidet |
| --- | --- | --- |
| Falsche GAV-Werte | Fehler bei Kontrollen | nur geprüfte Werte, Stand sichtbar, Prüfung jeden April; Fachperson vor dem Pilot ([S-17](../entscheide.md)) |
| Fristen im Einzelfall anders (OR oder SIA 118, neues Recht seit 1.1.2026) | Haftungsgefühl | Erinnerung mit Quelle, nie Auskunft ([S-17](../entscheide.md)) |
| Lizenzierten Normkatalog importieren | Urheberrecht | eigene Vorlage; Import nach Prüfung durch Fachperson ([S-17](../entscheide.md)) |
| Abgleich ohne Server | Rapporte bleiben auf Papier | Papier bis zum JA ([S-06](../entscheide.md)); Stufe 2 nach dem Pilot ([S-14](../entscheide.md)) |
| Sprachen und Anrede | Formulare bleiben leer; «du» an Verwaltungen | [S-07](../entscheide.md) |
| Pilot: Maler innen mit Mieterwechsel oder Maler-Gipser mit Fassade | Reihenfolge der Pakete | Alban nach ersten Kunden ([S-09](../entscheide.md)) |
| Boden und Platten als eigene Branche | Umfang | Kopf als ADR nach dem Pilot; bis dahin Betriebsart |
| Wetter aus dem Netz, Adresse an die Karten-App | Datenfluss | [S-15](../entscheide.md), [S-16](../entscheide.md) |
| Zahlungseingang aus der Bankdatei | Kern des Nutzens | [S-08](../entscheide.md) |

## 15. Absehbare Plattform-Anträge

| Antrag | An | Zweite Branche |
| --- | --- | --- |
| Eventualpositionen, Varianten und Gruppen in der Offerte; Rückbehalt und Skonto in der Rechnung | P-29 | Gebäudehülle, Umzug |
| Ausmass mit Art (Besichtigung, Schluss) und Vergleich zur Offerte; Raum mit L × B × H und Öffnungen als Formelsatz | P-25 | Facility, Gebäudehülle |
| Kostenträger je Rapportzeile (Mieter:in, Verwaltung, Garantie) | P-25 | Facility |
| Schadstoffhinweis und -bericht am Objekt | P-23 oder P-27 | Gebäudehülle, Haustechnik |
| Entsorgungsnachweis | P-27 oder P-41 | Umzug, Garten |
| Materialbedarf je Leistung, Vorschlag des Leistungswerts aus Rapporten | P-24 | Gebäudehülle, Holz |
| Regelwerk-Bausteine: Samstagsmeldung, Reisezeit-Anteil, Mittagsentschädigung, Ferien nach Alter | P-31 | Gebäudehülle, Umzug |
| Fristen-Regelwerk Werkvertrag (Mängelrüge, Verjährung, Pfandrecht) | P-28, P-29 | Gebäudehülle, Haustechnik |

## 16. Stand

Steckbrief vom 24.11.2026, noch nichts gebaut.

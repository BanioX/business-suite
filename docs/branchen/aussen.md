# Grün und wiederkehrende Aussendienste: Gartenbau, Kaminfeger, Schädlingsbekämpfung

- **Kennung im Code:** drei Branchen mit einem Steckbrief: `garden` (Betriebsarten `garden.maintenance`, `garden.landscaping`), `pest-control` (`pest-control.service`), `chimney` (`chimney.sweep`). Tabellen mit Präfix `garden_`, `pest_control_`, `chimney_` (Bindestrich wird im Tabellennamen zum Unterstrich; Vorschlag, der Kopf bestätigt im Namensregister). ADR-Präfix `OUT` für alle drei
- **Ausgabe:** Vor Ort ([S-01](../entscheide.md))
- **Welle:** W3 ([Fahrplan](../fahrplan.md)): Gartenunterhalt zuerst, dann Schädlingsbekämpfung, Kaminfeger zuletzt. Die Recherche empfiehlt die Welle direkt nach Facility; der Fahrplan setzt W3, weil Equipen ohne Kopplung (P-40) nur halb versorgt sind
- **Eignung:** 4 – Nicht verrechnete Einsätze, vergessene Fälligkeiten und Nachweise für Dritte sind täglich spürbar, und Objekte, Pläne, Rapporte und Rechnungen sind dieselben wie bei Facility; Fachbewilligungen, Verbote und kantonal verschiedene Kaminfeger-Regeln verlangen sorgfältige Quellen.
- **Recherche:** [`aussen-recherche.md`](aussen-recherche.md) · **Auftrag:** [`../auftraege/branche-aussen.md`](../auftraege/branche-aussen.md)

## 1. Kurzbild

| Frage | Antwort |
| --- | --- |
| Wie viele | Grüne Branche (Gartenbau und Produktion) rund 4500 Betriebe und 25 000 Beschäftigte, davon rund 4365 Betriebe mit 1 bis 49 Personen (EKAS, Branchenlösung 41, 2023); im Verband über 1700 Betriebe. Kaminfeger rund 382 Betriebe, 3100 Beschäftigte (EKAS, Branchenlösung 68; Lesart der Spalten unsicher). Gartenunterhalt getrennt, Landschaftspflege, Schädlingsbekämpfung: nicht belegt. NOGA 81.30 für Garten- und Landschaftsbau; Klasse für Kaminfeger und Schädlingsbekämpfung nicht belegt |
| Grösse | Gartenbau 3 bis 15, Gartenunterhalt 1 bis 8, Schädlingsbekämpfung 1 bis 10 Personen (Annahme); Kaminfeger Meister:in mit durchschnittlich 2 bis 5 Mitarbeitenden (Berufsberatung) |
| Wer arbeitet | Inhaber:in (arbeitet mit, abends Büro; beim Kaminfeger Meister:in, in der Schädlingsbekämpfung mit Fachbewilligung), Büro 20 bis 50 Prozent, Vorarbeiter:in je Equipe von 2 bis 4 Personen, Gärtner:innen EFZ und EBA, Gartenarbeiter:innen, Kaminfeger:innen EFZ, Saison-Aushilfen, Lernende (Gärtner:in, Kaminfeger:in); extern Treuhand |
| Sprachen | nicht belegt; Annahme: im Gartenbau neben Deutsch, Französisch und Italienisch auch Portugiesisch, Albanisch, Bosnisch-Kroatisch-Serbisch, Spanisch, Tamil; Kaminfeger und Schädlingsbekämpfung überwiegend Landessprachen ([S-07](../entscheide.md)) |
| Aussendienst | Einschätzung: Gartenbau 85 bis 95, Kaminfeger 80 bis 90, Schädlingsbekämpfung 70 bis 85 Prozent der Arbeitszeit draussen; Keller, Heizräume, Dachböden, Kühlräume ohne Netz; Handschuhe, Nässe, Russ, Sonne auf dem Bildschirm |
| Saison | Garten: März bis November mit Aushilfen, Winter Gehölzschnitt, Winterdienst, Offerten, Verträge erneuern. Kaminfeger: Heizperiode als Hochsaison, Sammelrechnung im Herbst. Schädlingsbekämpfung: Sommer Wespen, Schaben, Bettwanzen; Herbst Nager; Audits der Kundschaft laufend |

## 2. Teilbranchen und Betriebsarten

Mehrfach wählbar, auch über die drei Branchen hinweg (Gartenunterhalt mit Schädlingskontrolle, [ADR-0002](../adr/0002-plattform-branchen-ausgaben.md)). Landschaftspflege (Böschungen, Neophyten, Naturflächen für Gemeinden) ist eine Option von `garden.maintenance`. Bei einer Person: Umfang «Schlank».

| Betriebsart | Kennung | Was sie tut | Startfunktionen |
| --- | --- | --- | --- |
| Gartenunterhalt | `garden.maintenance` | Rasen, Hecken, Bäume, Stauden, Laub, Neophyten; Pflege für Private, Verwaltungen, Stockwerkeigentum, Gemeinden | Aufnahme, Pflegeplan, Wochenplan, Rapport, Grüngut, Abrechnung, Sicherheit; Option «Landschaftspflege» |
| Garten- und Landschaftsbau | `garden.landscaping` | Neuanlagen, Umgestaltung, Mauern, Wege, Plätze, Teiche, Bepflanzung, Bewässerung | wie oben, dazu Neuanlage mit Ausmass, Pflanzenliste und Abnahme |
| Schädlingsbekämpfung | `pest-control.service` | Kontrollverträge mit Stationsplan in Lebensmittelbetrieben, Hotels, Wohnbauten; Einzelbekämpfung (Wespen, Nager, Schaben, Bettwanzen, Tauben) | Kontrollvertrag, Stationsplan, Kontrollgang, Kontrollbericht, Behandlungsjournal, Notfall-Einsatz |
| Kaminfeger | `chimney.sweep` | Reinigung von Feuerungs- und Abgasanlagen, Feuerungskontrolle mit Messung, Brandschutzberatung; je nach Kanton mit Konzession oder frei | Anlagenregister, Intervalle, Tour mit Voranmeldung, Rapport je Anlage, Mängelmeldung, Sammelrechnung |

## 3. Alltag

- **Zwei Muster:** Projekt (Neuanlage, einmalige Bekämpfung, Sanierung einer Abgasanlage) und Wiederkehr (Pflege nach Plan, Reinigung je Anlage nach Intervall, Kontrollvertrag mit Stationsplan). Die Wiederkehr prägt die Branche.
- **Garten:** Anfrage (Telefon, Messenger, Objektliste einer Verwaltung) › Besichtigung (Rasen in m², Hecke in Laufmetern, Bäume, Zugang, Wasser, Entsorgung, Fotos) › Offerte (Neuanlage nach Positionen und Ausmass, Pflege als Jahrespauschale oder nach Aufwand) › Vertrag läuft jährlich weiter › Wochenplan je Equipe nach Wetter › Einsatz mit Fahrzeug, Anhänger, Maschinen › Rapport (Stunden je Person, Maschinen, Material, Grüngut in m³ oder Fuhren) › Rechnung monatlich, quartalsweise oder jährlich, Neuanlage nach Abnahme.
- **Kaminfeger:** Objekt zugeteilt (Konzession) oder gewählt (frei) › Anlage aufnehmen (Brennstoff, Leistung, Baujahr, Abgasanlage, Dachzugang) › Intervall nach kantonaler oder kommunaler Regel › Tour nach Gemeinde und Strasse, Voranmeldung per Brief oder Aushang › Reinigung, Kontrolle, Messung › Rapport je Anlage, Messwerte vom Ausdruck, Mängel › Mängelmeldung an Eigentümer:in, je nach Kanton an eine Behörde › Sammelrechnung.
- **Schädlingsbekämpfung:** Notruf oder Anfrage vor einem Audit › Befallsaufnahme mit Plan › Kontrollvertrag mit Anzahl Kontrollen › Stationen setzen und nummerieren › Kontrollgang: jede Station prüfen, Befund, Köder ersetzt, Produkt, Menge › Kontrollbericht für den Hygiene-Ordner der Kundschaft › Folgekontrolle bei Befall › Rechnung jährlich oder quartalsweise, Notfall sofort.
- **Tag:** 6:45 Magazin, Fahrzeug laden, Tagesauftrag am Brett; Kaminfeger 8 bis 15 Anlagen, nicht Angetroffene neu einplanen; Schädlingsbekämpfung 6 bis 12 Objekte, Notfälle dazwischen; Regen: umplanen auf Magazin, Werkstatt, Büro; abends Rapport (oft vergessen); Inhaber:in abends Offerten, Planung nach Wetter, Briefe.
- **Woche, Monat, Jahr:** Montag Wochenplan nach Wetterbericht, Freitag Rapporte, Stunden, Grüngut-Quittungen und Belege einsammeln; Kaminfeger verschickt Voranmeldungen für die nächste Woche. Monatlich Stunden mit Überzeit, Ferien, Regentagen; Rechnungen Unterhalt; offene Posten; Service der Maschinen. Jährlich Saisonstart mit Aushilfen, Saisonende mit Inventar, MWST halbjährlich, Verträge erneuern, Weiterbildung für die Fachbewilligung.
- **Heute:** Tabellenkalkulation und Kartei für Objekte und Intervalle, Wandkalender, Durchschreibeblock, Fotos im Messenger auf privaten Handys, Schlüssel und Codes auf Zetteln, Rechnung aus der Textverarbeitung.

## 4. Schmerzen

Gewichtung aus der Recherche (abgeleitet, keine Umfrage), im Pilot zu messen.

1. Nicht verrechnete Leistung: Rapporte fehlen, Material und Grüngut gehen vergessen, am stärksten im Unterhalt mit vielen kleinen Einsätzen.
2. Fälligkeiten je Objekt (Intervall, Saison, Vertrag) im Kopf oder an der Wand; bei Kaminfeger und Schädlingsbekämpfung mit Haftungs- und Auditrisiko.
3. Wetter und Notfälle werfen den Wochenplan um; täglich Telefon, Umplanen am Abend.
4. Stunden und Lohn mit Saison, Aushilfen, Regentagen und Überzeit.
5. Nachweise für Dritte (Kontrollbericht, Stationsplan, Messprotokoll, Mängelmeldung): Papier, Doppelerfassung, Suche vor dem Audit.
6. Objektwissen (Zugang, Schlüssel, Hund, Wasseranschluss, Leitungen) im Kopf; Rückfragen und Schäden.
7. Offerten für Pflege und Neuanlage kosten Abende.
8. Nachweis von Pflanzenschutzmitteln und Bioziden lückenhaft; Maschinen fallen in der Saison aus.

**Warum keine Software:** Einführung nur im Winter möglich, Programme für grössere Betriebe mit Pflichtfeldern, wenig Deutsch im Team, Handschuhe und Nässe, kein Netz im Keller, laufende Gebühren je Aushilfe, Misstrauen gegenüber Servern und Ortung. **Was bewegt:** Objektliste mit Fälligkeiten am ersten Tag aus einer Tabelle, Rapport schneller als auf Papier, Rechnung direkt aus Rapporten, Nachweise als sauberes PDF, ohne Netz und ohne Konto, Vorlagen der Branche schon da.

## 5. Plattform-Module

| Modul | Wofür, Einstellungen der Branche | M/S/K |
| --- | --- | --- |
| P-20 Betrieb und Personen | Rechtsform, Kanton, MWST-Art (Saldosteuersatz trägt der Betrieb ein), Bank für QR; Saison im Betriebsjahr | M |
| P-21 Rollen und Rechte | Rollen aus 8; heikel: Löhne, Preise und Ansätze, Zugangshinweise und Schlüssel, Kontrollbericht abschliessen, Intervall-Regeln ändern | M |
| P-22 Kundschaft | Private, Verwaltung mit vielen Objekten, Stockwerkeigentum, Gemeinde, Lebensmittelbetrieb, Hotel; Rechnungsadresse getrennt vom Objekt; Import aus CSV | M |
| P-23 Objekte und Standorte | Herzstück: Garten mit Bereichen und Flächen; Liegenschaft › Feuerungsanlage als Anlage mit Intervall; Lebensmittelbetrieb › Raum; Unterobjekte statt eigener Objektlisten; Zugangshinweise ohne Code ([S-11](../entscheide.md)); Fotos «Wo ist was?» | M |
| P-24 Leistungen und Material | Vorlage aus 7 ohne Ansätze; Leistungswert leer, aus Rapporten nachkalkuliert; Einheiten m², m, m³, Stk., h, pauschal, kg, dazu Fuhre, Sack, t, Kontrolle, Einsatz (Antrag 11); MWST-Satz je Leistung (Pflanzen reduziert) | M |
| P-25 Aufträge, Einsätze, Rapporte | Projekt und Einzeleinsatz aus dem Plan; Preisarten Pauschal, Einheitspreis, Regie; Ausmass der Neuanlage; Rapport mit Branchenzeilen über Steckplätze; Abnahme | M |
| P-26 Pläne und Wiederkehr | Pflegeplan mit Häufigkeit im Saisonfenster, Reinigungsintervall je Anlage, Kontrollen je Vertrag; erzeugt Einsätze, Soll-Zeit, Liste «fällig», Jahresplan als PDF | M |
| P-27 Checklisten und Nachweise | Vorlagen aus 7; Unterweisungs- und Ausbildungsnachweise (Motorsäge); Stopp-Meldung | M |
| P-28 Kalender und Erinnerungen | Saison, Feiertage, Fälligkeiten, Vertragserneuerung, Folgekontrolle, Mängelfrist, Ablauf der Fachbewilligung, Maschinen-Service | M |
| P-29 Offerten und Rechnungen | Offerte Neuanlage, Rechnung aus Rapporten oder Pauschale, Pflanzen als eigene Position zum reduzierten Satz, Sammelrechnung je Verwaltung und je Kaminfeger-Saison, QR, Mahnung | M |
| P-30 Kasse und Belege | Treibstoff, Pflanzen, Schüttgut, Entsorgung, Maschinen, Werkstatt; Monatspaket | S |
| P-31 Team und Zeit | Stunden aus dem Rapport, Stempeln mit QR am Objekt, Equipe als Einheit der Planung (Antrag 3), Ausfall Wetter getrennt, Aushilfen, Monatsblatt, Regelwerk ohne ungeprüften Lohnwert | M |
| P-32 Heute | Einsätze der Equipe mit Wetterstatus, fällig in 30 Tagen, offene Rapporte, Folgekontrollen, offene Mängel | M |
| P-33 Fotos und Dateien | vorher, nachher, Befund, Station, Anlage, Mangel; Stationsplan als Datei; Hinweis «keine Personen, keine Codes» | M |
| P-40 Kopplung und Abgleich | Mappe ohne Preise aufs Equipen-Handy, Befehle abends im Magazin; bis zum JA Papier ([S-06](../entscheide.md)) | S, ab zwei Equipen M |
| P-41 Material und Lager | Dünger, Saatgut, Köder, Fallen, Biozide, Ersatzteile; Fahrzeug als Lagerort; Verbrauch aus Rapport | S |
| P-42 Fahrzeuge und Geräte | Fahrzeuge, Anhänger mit Volumen, Mäher, Motorsägen, Häcksler, Sprühgeräte, Messgeräte; Service nach Betriebsstunden | S (Übersicht in [`../plattform.md`](../plattform.md): M; das MVP kommt mit Erinnerungen aus P-28 aus) |
| P-50 Termine | Voranmeldung mit Zeitfenster beim Kaminfeger | K |
| P-51 Verträge und Mitgliedschaften | Pflegevertrag mit Pauschale, Kontrollvertrag mit Anzahl Kontrollen, Erneuerung, Kündigung; erzeugt Rechnungen und Einsätze | M (kommt in W4; bis dahin Port, Antrag 2) |
| P-52 Kurse mit Plätzen | – | – |

Dazu P-06 (Einrichten, Gerätemodus «Equipe»), P-07 (Lexikon, Sprachen der Mitarbeitenden), P-10 (Kamera mit Fallback, Unterschrift, QR), P-11 (Stile «Übersicht», «Formular», «Streifen»).

## 6. Eigene Module der Branche

Drei Pakete: `industries/garden/`, `industries/pest-control/`, `industries/chimney/`. Keines importiert ein anderes; was zwei davon brauchen (Behandlungsjournal, Ausweise der Personen, Tour), ist Plattform-Antrag (Abschnitt 15) und läuft bis zur Antwort hinter einem Port. Alle Tabellen tragen `businessId` und zeigen auf Plattform-Kennungen, ohne Plattform-Tabellen zu ändern ([ADR-0004](../adr/0004-andocken-einer-branche.md), Punkt 5). Längen in Millimeter, Flächen, Volumen und Mengen in Tausendstel, Leistung in Zehntel-kW, Anteile in Basispunkten, Geld in Rappen, alles Ganzzahlen; Kalendertage `YYYY-MM-DD`. «H, A»: Heikelkeit (n, i, h) und Abgleich-Art ([ADR-0005](../adr/0005-gemeinsames-datenmodell.md)). **K** = Kandidat für die Plattform.

**Funktionen:** `garden.survey`, `garden.care_plan`, `garden.week_plan`, `garden.reports`, `garden.green_waste`, `garden.billing`, `garden.safety`, `garden.treatments`, `garden.new_build`; `pest-control.contracts`, `pest-control.monitoring`, `pest-control.callouts`, `pest-control.treatments`; `chimney.appliances`, `chimney.rounds`, `chimney.reports`, `chimney.defects`, `chimney.billing`. `garden.safety` lässt sich nur mit dem Recht «Einstellungen» und einem Hinweis ausschalten. Winterdienst baut die Branche nicht selbst (Antrag 8).

### 6.1 Gartenaufnahme (`garden.survey`)

Einmal aufnehmen; Offerte, Pflegeplan und Rapport nutzen dieselben Flächen. Objekt, Bereich, Fläche, Zugangshinweis und Fotos sind P-23 und P-33.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `garden_site_profiles` | siteId, waterTap (`yes`, `no`, `unknown`), power, parking, dog, wasteDropNote, lastSurveyOn | n, ein Schreiber |
| `garden_area_profiles` | areaId (Bereich P-23), kind (`lawn`, `meadow`, `bed`, `hedge`, `shrubs`, `tree`, `path`, `square`, `roof_terrace`, `pond`, `slope`), lengthMm, widthMm, measuredAreaMilli, hedgeHeightMm, hedgeSides (1, 2), hedgeTopWidthMm, treeCount, treeHeightClass (Klassen des Betriebs), difficulty (`none`, `slope`, `foot_only`) | n, ein Schreiber |
| `garden_plants` | areaId, name (Text), count, invasiveRef (Eintrag der Vorlagenliste nach FrSV Anhang 2.2 mit Quelle, sonst leer) | n, ein Schreiber |

| Grösse | Formel |
| --- | --- |
| Fläche | m² = Länge × Breite oder Σ Teilflächen; eine direkt gemessene Fläche geht vor |
| Hecke | Schnittfläche m² = Laufmeter × Höhe × Seiten + Laufmeter × Kronenbreite |
| Baum | Stück je Höhenklasse; Klassen (bis 5 m, 5 bis 10 m, über 10 m) sind Richtwerte des Betriebs |
| Grüngut | m³ lose = Menge × Grüngut je Einheit (Richtwert des Betriebs, leer ausgeliefert) |
| Zeit | Stunden = Menge ÷ Leistung je Stunde (Leistungswert aus P-24, leer, aus Rapporten nachkalkuliert); fehlt er: «Leistungswert fehlt» |

Gerechnet wird in Tausendstel-Ganzzahlen aus den Eingaben; das Ergebnis wird einmal kaufmännisch auf 0,001 gerundet, und die Formel steht mit den eingesetzten Werten daneben. **Prüfbeispiel** (Testwerte): Rasen 25,000 × 18,000 m = 450,000 m²; Hecke 40,000 m, Höhe 1,800 m, beidseitig, Krone 0,600 m: 144,000 + 24,000 = 168,000 m²; Hecke 120,000 m, 2,000 m, beidseitig, Krone 0,800 m: 576,000 m²; Leistungswerte 600 m² und 25 m² je Stunde: 0,750 h und 6,720 h.

**Import:** Objektliste aus einer Tabelle (CSV) über den Import von P-22 und P-23; die Branche liefert die Spaltenvorlage (Objekt, Adresse, Rasen m², Hecke m, Bäume). **Dokumente:** Aufnahmeblatt mit Flächen und Fotos; Objektblatt fürs Team (Zugang ohne Code, Hund, Wasser, Leitungen, keine Preise).

### 6.2 Pflegeplan und Saison (`garden.care_plan`)

Wiederkehr ist P-26, der Vertrag P-51 (W4; bis dahin Port `CareAgreementSource`, Antrag 2). Die Branche liefert Saisonfenster, Häufigkeit je Saison, Soll-Stunden aus den Flächen und den Vorschlag der Pauschale.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `garden_plan_lines` **K** | planLineId (Zeile des Leistungsplans P-26), areaId, catalogItemId, timesPerSeason, windowStartWeek, windowEndWeek (ISO-Kalenderwoche, Richtwert des Betriebs), materialIncluded, greenWasteIncluded | i, ein Schreiber |
| `garden_care_agreements` (Port bis P-51) | customerId, siteIds, validFrom, validTo, autoRenew, billingMode (`flat_year`, `flat_quarter`, `flat_month`, `time_and_material`), flatRappen, noticeDays, signedFileId | h, ein Schreiber; gesperrt nach Unterschrift |

| Grösse | Formel |
| --- | --- |
| Besuchswochen | Woche_i = Start + ⌊i × (Ende − Start + 1) ÷ n⌋ für i = 0 … n − 1; Wochentag und Feiertage verschiebt P-26 |
| Soll-Stunden je Jahr | Σ (Menge ÷ Leistung je Stunde × Häufigkeit) |
| Pauschale (Vorschlag, nur mit Recht «Preise sehen») | Soll-Stunden × Stundenansatz + Material + Grüngut; gespeichert wird nur der Betrag, den der Betrieb setzt |
| Rate | Pauschale ÷ Anzahl Raten, ganzzahlig; der Rest geht auf die letzte Rate |
| Soll gegen Ist | Ist-Stunden aus Rapporten ÷ Soll-Stunden, in Basispunkten je Objekt; berechnet, nie gespeichert (Facility, Antrag 7) |
| Fällig | geplante Einsätze der nächsten 30 Tage (Vorlauf als Option) ohne Rapport; nicht ausgeführte Besuche der Saison |

**Prüfbeispiel:** Rasen 18-mal in KW 14 bis 44: Wochen 14, 15, 17, 19, 20, 22, 24, 26, 27, 29, 31, 32, 34, 36, 38, 39, 41, 43; Hecke 2-mal in KW 24 bis 40: 24 und 32; Laub 3-mal in KW 41 bis 47: 41, 43, 45. Soll Familie Muster: 0,750 h × 18 + 6,720 h × 2 + 1,500 h × 3 = 31,440 h; Testansatz 9500 Rappen: Vorschlag 298 680 Rappen. Pauschale 360 100 Rappen in 12 Raten: 11 × 30 008 und 1 × 30 012.

**Dokumente:** Pflegevertrag mit Leistungsliste (Formular, gesperrt nach Unterschrift), Jahresplan für die Kundschaft (Besuche je Monat, Preise als Option), Soll gegen Ist (intern, «Erweitert»).

### 6.3 Wochenplan, Wetter und Tour (`garden.week_plan`)

Einsatz ist P-25, Equipe und Einsatzplan P-31 (Antrag 3), Reihenfolge eines Tages Antrag 4. Die Branche liefert Ausfalltag und Verschieben im Saisonfenster.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `garden_weather_days` **K** | date, crewId (P-31, sonst personIds), extent (`full`, `half`), replacementWork (`yard`, `workshop`, `office`, `none`), affectedVisitIds, decidedBy, decidedAt, note | n, Ledger |

Verschieben schlägt den nächsten Arbeitstag mit freier Soll-Zeit der Equipe im Saisonfenster der Planzeile vor; liegt keiner im Fenster, steht «ausserhalb des Fensters», und die Person entscheidet. Nichts verschiebt sich ohne Bestätigung. Tour: Einsätze eines Tages nach Gemeinde, Strasse, Hausnummer, von Hand umstellbar; keine Karte, kein Routing-Dienst, keine Ortung. Das Wetter trägt die Person von Hand ein ([S-15](../entscheide.md)); Ausfall wird als Buchungsart in P-31 getrennt geführt (Antrag 7). **Dokumente:** Wochenplan je Equipe (Streifen), Einsatzblatt mit QR (Adresse und Zugangshinweis ohne Code, keine Preise), Textvorlage «Verschiebung» an Kundschaft zum Teilen. **Kennzahlen:** Ausfalltage je Monat, verschobene Einsätze.

### 6.4 Gartenrapport und Grüngut (`garden.reports`, `garden.green_waste`)

Rapport mit Unterschrift, Sperre und Nachtrag ist P-25, Stunden gehen ins Zeit-Ledger von P-31, Fotos in P-33. Die Branche liefert Zeilen über Steckplätze:

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `garden_report_lines` | reportId, areaId, catalogItemId, quantityDoneMilli | n, Ledger |
| `garden_machine_uses` | reportId, assetId (P-42, sonst Text), minutes, billable | n, Ledger |
| `garden_waste_entries` **K** | reportId, kind (`green`, `wood`, `stumps`, `soil`, `neophytes_incineration`, `residual`), quantityMilli, unit (`m3_loose`, `load`, `kg`, `t`), loads, trailerVolumeMilliM3, dropOff (Text), voucherFileId | n, Ledger |

Arbeitszeit = bis − von − Pause je Person, Ausfall getrennt; m³ aus Fuhren = Fuhren × Volumen des Anhängers (Feld von P-42, sonst am Eintrag); Weiterverrechnung = Menge × Ansatz der Entsorgungsleistung; Maschine = Minuten ÷ 60 × Ansatz; Regie = Σ Stunden × Ansatz + Material + Maschinen + Entsorgung. «Wie letztes Mal» übernimmt die Zeilen des letzten Rapports am selben Objekt. **Prüfbeispiel:** zwei Personen 07:00 bis 12:00 ohne Pause, Testansatz 9500: 95 000 Rappen; Häcksler 45 Minuten zu 12 000 je Stunde: 9000; 3 Fuhren × 2,500 m³ = 7,500 m³ zu 4000 je m³: 30 000; Regie 134 000 Rappen. **Dokument:** Arbeitsrapport Garten (Formular, gesperrt nach Unterschrift). **Kennzahlen:** Grüngut je Monat, Entsorgung nicht weiterverrechnet, Rapporte ohne Rechnung.

### 6.5 Abrechnung (`garden.billing`)

Port `InvoiceSource` an P-29: Regie aus unterschriebenen Rapporten; Pauschale nach `billingMode`; Neuanlage aus Offerte und Schlussausmass (6.7); Sammelrechnung je Verwaltung mit einer Gruppe je Objekt. Option «Pflanzen getrennt»: Pflanzen und Sämereien als eigene Position mit dem reduzierten Satz; die Sätze kommen aus dem Regelwerk von P-29, nie aus der Branche. Hinweis mit Quelle: Der reduzierte Satz setzt eine gesonderte Rechnungsstellung voraus (MWSTG Art. 25 Abs. 2 lit. a); ob er im Einzelfall gilt, klärt der Betrieb mit seiner Treuhand. Soll gegen Ist und Deckung je Pflegevertrag stehen in «Erweitert», nur mit Recht. **Prüfbeispiel** (Sätze aus P-29): Pflanzen 30 Stk. × 2400 = 72 000 Rappen, Steuer 2,6 Prozent 1872; Arbeit 120 000, Steuer 8,1 Prozent 9720.

### 6.6 Sicherheit, Pflanzenschutz und Neophyten (`garden.safety`, `garden.treatments`)

Checklisten, Ausbildungsnachweise und Stopp sind P-27. Das Behandlungsjournal ist Antrag 1 (zusammen mit `pest-control`), bis dahin hinter dem Port `TreatmentLog`:

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `garden_products` **K** | name (vom Betrieb erfasst), authorisationNo, activeIngredient, kind (`herbicide`, `fungicide`, `insecticide`, `algae_moss_biocide`, `fertiliser`, `other`), safetyDataSheetFileId | n, ein Schreiber |
| `garden_treatments` **K** | date, siteId, areaId, productId, quantityMilli, unit, concentrationBp, personId, permitRef (Antrag 5), weatherNote | i, Ledger |

Hinweise mit Quelle, nie ein Urteil:

- Herbizid oder Biozid gegen Algen und Moose auf einer Fläche `path`, `square` oder `roof_terrace`: Hinweis auf das Verwendungsverbot (ChemRRV Anhang 2.5 Ziff. 1.1, Anhang 2.4 Ziff. 4bis) vor dem Speichern; die Person bestätigt, dass sie ihn gelesen hat; der Eintrag bleibt möglich, damit das Journal die Wahrheit festhält.
- Person ohne erfasste Fachbewilligung bei einem Pflanzenschutzmittel: «Für diese Person ist keine Fachbewilligung erfasst.»
- Pflanze aus FrSV Anhang 2.2 in einer Pflanzenliste: «Inverkehrbringen seit 1.9.2024 verboten; bestehende Pflanzen müssen nicht entfernt werden.»
- Lernende:r mit Motorsäge im Einsatz: Hinweis auf ArGV 5 Art. 4; Motorsäge ohne Ausbildungsnachweis: Hinweis aus P-27.
- April bis September: Checkliste «Sonne und Hitze» als Vorschlag in «Heute» (Zeitraum als Richtwert).

Nie «erlaubt», «zulässig», «sicher» oder «unbedenklich» als Urteil der App. **Dokumente:** Behandlungsjournal je Objekt und Jahr (Formular, nach Jahresabschluss gesperrt), Unterweisungsnachweis. **Kennzahl:** Menge je Wirkstoff und Jahr.

### 6.7 Neuanlage (`garden.new_build`)

Offerte P-29, Ausmass P-25 (Formelsatz der Branche als Steckplatz, Antrag 3 der Gebäudehülle), Abnahme mit Mängeln P-25. Eigene Tabellen: `garden_planting_lists` (jobId, plantName, count, size als Text, invasiveRef; n, ein Schreiber) und `garden_handover_notes` (jobId, irrigationExplained, careGuideFileId, checklistRunId; n, ein Schreiber). Formeln: Belag m² = Länge × Breite − Aussparungen; Aushub und Kies m³ = Fläche × Tiefe; Mauer Ansichtsfläche = Länge × Höhe; Pflanzen Stück. Prüfbeispiel: Sitzplatz 6,000 × 4,000 m = 24,000 m², Aushub 0,300 m: 7,200 m³. Fristen über das Fristen-Regelwerk Werkvertrag (Antrag der Maler und der Gebäudehülle) nur als Option des Betriebs und mit dem Satz «Im Streitfall entscheidet der Vertrag; frag deine Rechtsberatung.», weil nicht belegt ist, ob eine Gartenanlage als unbewegliches Werk gilt.

### 6.8 Kontrollvertrag und Stationsplan (`pest-control.contracts`)

Vertrag P-51 (Port bis W4, Antrag 2), Objekt und Räume P-23, Plan als Datei P-33.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `pest_control_agreements` (Port bis P-51) | customerId, siteId, targetPests (`rodents`, `cockroaches`, `stored_product_insects`, `flies`, `ants`, `wasps`, `bed_bugs`, `birds`), inspectionsPerYear, validFrom, validTo, autoRenew, responsiblePersonId | i, ein Schreiber |
| `pest_control_site_plans` | siteId, fileId, version, validFrom, supersedesId | i, ein Schreiber; Änderung als neue Fassung |
| `pest_control_stations` | siteId, areaId (Raum P-23), number (eindeutig je Objekt), kind (`bait_box`, `snap_trap`, `live_trap`, `glue_trap`, `insect_monitor`, `light_trap`), location (Text), sitePlanId, posXBp, posYBp (Position auf dem Plan, Antrag 10), active | i, ein Schreiber |

Eine Station wird nie gelöscht, nur inaktiv; ihr Verlauf bleibt. Kontrollen planen: Tag_i = Vertragsbeginn + ⌊i × 365 ÷ n⌋ Tage, Wochenende auf den nächsten Arbeitstag (P-26, P-28). Prüfbeispiel: 8 Kontrollen ab 6.1.2027: 6.1., 22.2., 7.4., 24.5., 7.7., 23.8., 6.10., 22.11.2027. Stationspläne sind Geschäftsgeheimnis der Kundschaft: heikel «i», teilen nur als PDF durch die Person. **Dokument:** Stationsplan mit nummerierten Stationen und Legende (Formular, neue Fassung bei Änderung).

### 6.9 Kontrollgang und Kontrollbericht (`pest-control.monitoring`, `pest-control.callouts`)

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `pest_control_inspections` | visitId (P-25), agreementId, personId, responsiblePersonId, closedAt, closedBy | i, Ledger; gesperrt nach Abschluss |
| `pest_control_station_findings` | inspectionId, stationId, finding (`none`, `feeding`, `droppings`, `caught`, `damaged`, `not_accessible`, `missing`), baitReplaced, productId, quantityMilli, photoFileId, note | i, Ledger |
| `pest_control_measures` | inspectionId, kind (`bait`, `trap`, `structural_advice`, `hygiene_advice`, `fumigation_by_permit_holder`), text, dueOn, responsibility (`customer`, `business`), doneOn | i, Ledger |
| `pest_control_treatments` **K** | wie `garden_treatments`, dazu stationId (Antrag 1) | i, Ledger |

Befallsquote = Stationen mit `feeding`, `droppings` oder `caught` ÷ geprüfte aktive Stationen, in Basispunkten, berechnet; `not_accessible` zählt nicht im Nenner und steht getrennt. Trend über die letzten fünf Kontrollen. Bei Befund schlägt die App eine Folgekontrolle nach dem Abstand des Betriebs vor (Richtwert, leer ausgeliefert). Prüfbeispiel: 14 Stationen, 2 mit Frass, 1 nicht zugänglich: 2 ÷ 13 = 1538 Basispunkte. Der Kontrollbericht nennt die verantwortliche Person mit Fachbewilligung (Nummer, gültig bis); fehlt sie, steht ein Hinweis, und das Recht «Kontrollbericht abschliessen» liegt bei der Rolle Fachperson. Einzelbekämpfung (Notfall) ist ein Einsatz mit Rapport, Behandlungsjournal und sofortiger Rechnung. Die App sagt nie, ob ein Lebensmittelbetrieb seine Pflichten erfüllt; nie «befallsfrei», «einwandfrei», «konform». **Dokumente:** Kontrollbericht (Stationen mit Befund, Plan mit Markierungen, Produkte, Massnahmen, Person mit Fachbewilligung; gesperrt nach Abschluss), Jahresübersicht, Liste der eingesetzten Produkte. **Kennzahlen:** Befallsquote, Stationen nicht zugänglich, offene Massnahmen.

### 6.10 Anlagenregister (`chimney.appliances`)

Die Feuerungsanlage ist eine Anlage am Objekt (P-23) mit Intervall; die Branche ergänzt:

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `chimney_appliance_profiles` | assetId (P-23), fuel (`log_wood`, `pellets`, `wood_chips`, `oil`, `gas`), kind (`central_heating`, `fireplace`, `stove`, `cooker`), ratedPowerDeciKw, buildYear (leer = unbekannt), makerType (Text), flueMaterial, flueHeightMm, roofAccess, operation (`all_year`, `winter`, `occasional`) | n, ein Schreiber |
| `chimney_interval_rules` | canton, municipality (leer = ganzer Kanton), kind (`cleaning`, `combustion_check`), fuel, operation, timesPerYear oder everyMonths, sourceUrl, checkedOn | n, ein Schreiber; leer ausgeliefert |
| `chimney_measurements` | visitId, assetId, label, value, unit (alle Text, Abschrift), printoutFileId | n, Ledger |

Nächste Fälligkeit = letzte Ausführung + 12 ÷ timesPerYear Monate (oder everyMonths); bei Winterbetrieb in die Heizperiode des Betriebs gelegt (Richtwert). Ohne Regel mit Quelle steht «Intervall fehlt», nie eine Zahl. Prüfbeispiel (Testwerte, keine Vorgabe): Regel des Betriebs Öl ganzjährig 2-mal, Gas 1-mal; letzte Reinigung 15.10.2026: Öl fällig 15.4.2027, Gas 15.10.2027. Messwerte sind Abschriften des Ausdrucks; die App speichert keine Grenzwerte und beurteilt nie, ob einer eingehalten ist.

### 6.11 Tour, Voranmeldung, Rapport und Mängel (`chimney.rounds`, `chimney.reports`, `chimney.defects`, `chimney.billing`)

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `chimney_notices` **K** | visitId, channel (`letter`, `notice_board`, `sms_by_hand`, `email_by_hand`), templateKey, windowFrom, windowTo, sentOn | n, Ledger |
| `chimney_not_home` | visitId, attemptNo, followUpVisitId | n, Ledger |
| `chimney_visit_works` | visitId, assetId, works (`cleaning`, `inspection`, `measurement`, `advice`), result, ownerNote | n, Ledger |
| `chimney_defects` **K** | assetId, kind (Vorlage), photoFileIds, dueOn, reportedTo (`owner`, `authority`), authorityName (Text), reportedOn, closedOn | i, Ledger |

Tourvorschlag = fällige Anlagen eines Gebiets (Gemeinde, Quartier) in den nächsten n Tagen, sortiert nach Gemeinde, Strasse, Hausnummer (Antrag 4). Voranmeldung als Serienbrief (PDF), Aushang fürs Mehrfamilienhaus oder Text zum Kopieren (Antrag 13); die App versendet nichts. «Nicht angetroffen» erzeugt einen Vorschlag für einen neuen Einsatz; Quote = nicht angetroffen ÷ angemeldete Einsätze in Basispunkten. Sammelrechnung: alle abgeschlossenen Rapporte einer Kundschaft im gewählten Zeitraum als eine Rechnung (P-29). Kantonale Tarife werden nie mitgeliefert; der Betrieb erfasst sie als eigene Leistungen. Mängelmeldung an eine Behörde entsteht als PDF, die Person schickt sie selbst. Dach mit Faserzement und Baujahr vor 1990 oder leer: Checkliste «Dach und Asbest» vorgeschlagen; unerwarteter Fund: Stopp und Meldung an die Bauherrschaft als PDF (BauAV Art. 32 Abs. 3); der Schadstoff-Fall am Objekt ist Antrag 1 der Gebäudehülle. **Dokumente:** Voranmeldung, Arbeitsrapport je Anlage (gesperrt nach Abschluss), Messprotokoll als Abschrift, Mängelmeldung (gesperrt nach Ausstellen). **Kennzahlen:** fällige Anlagen je Monat, offene Mängel, Quote nicht angetroffen.

## 7. Vorlagen

**Leistungen** (eigene Worte, ohne Ansätze und Leistungswerte; ganze Liste in der Recherche, Abschnitt 6.1): Garten: Rasen mähen mit Abführen (m², Durchgang), vertikutieren, düngen, nachsäen (m²); Hecke schneiden (m² Schnittfläche oder m); Form- und Rückschnitt (Stk., h); Kronenpflege, Fällung je Klasse (Stk.); Beet jäten, mulchen, bepflanzen (m²); Laub (h, m²); Neophyten (h); Bewässerung in Betrieb nehmen, winterfest machen (pauschal); Aushub (m³), Belag, Kiesweg, Mauer (m², m), Pflanzung (Stk.); Material Pflanzen, Erde, Kies, Dünger (Stk., m³, Sack, kg); Entsorgung Grüngut, Holz, Aushub (m³, Fuhre, t); Maschinen (h); Winterdienst (Einsatz, h). Schädlingsbekämpfung: Kontrollgang (Kontrolle), Station setzen oder ersetzen (Stk.), Einzelbekämpfung (Einsatz), Taubenabwehr (m, m²). Kaminfeger: Reinigung je Anlagenart (Stk.), Abgasanlage (Stk., m), Feuerungskontrolle mit Messung (Stk.), Beratung, Abnahme neue Anlage (h), Anfahrt (Stk.). Allgemein: Regie Fachperson, Hilfskraft, Lernende (h); Fahrzeug, Anhänger (Fahrt, km, h).

**Checklisten** (Ergebnis «in Ordnung», «Mangel» mit Foto, «Stopp»; Wortlaut der Suva nur nennen und verlinken, nicht abschreiben): Lebenswichtige Regeln Garten- und Landschaftsbau (Instruktion bestätigen, bei Eintritt und jährlich), Motorsäge (vor dem Einsatz), Sonne und Hitze (April bis September), Fahrzeug und Anhänger täglich, Herbizid vor jedem Einsatz, Einsatz Schädlingsbekämpfung (Fachbewilligung erfasst, Produkt, Stationen beschriftet und gesichert, Schutz von Kindern und Haustieren), Kaminfeger Dach und Asbest, Übergabe Neuanlage, Saisonende.

**Dokumente:** Aufnahmeblatt, Objektblatt, Pflegevertrag, Jahresplan, Wochenplan, Einsatzblatt mit QR, Arbeitsrapport Garten, Offerte Neuanlage mit Pflanzenliste, Abnahmeprotokoll, Behandlungsjournal, Stationsplan, Kontrollbericht, Jahresübersicht, Voranmeldung, Arbeitsrapport Kaminfeger, Messprotokoll, Mängelmeldung, Rechnung und Sammelrechnung mit QR, Monatsblatt. Anrede an Dritte nach [S-07](../entscheide.md).

**Fragen beim Einrichten** (an «du»): Was machst du? (Betriebsarten, mehrfach) · Wie viele Personen arbeiten draussen? (allein › «Schlank»; 2 bis 5; 6 bis 20 › Equipen und Rollen; ab zwei Equipen Hinweis auf den Abgleich nach [S-06](../entscheide.md)) · Arbeitest du mit Aushilfen in der Saison? · Rechnest du Pflege pauschal oder nach Aufwand ab? · Stellst du Pflanzen separat in Rechnung? · Setzt du Pflanzenschutzmittel oder Biozide ein? (Journal, Fachbewilligung je Person) · Machst du Winterdienst? (nach Antrag 8) · In welchem Kanton arbeitest du? (Feiertage; beim Kaminfeger Intervall-Regeln leer zum Erfassen) · Hast du Kundschaft mit Audits? (Kontrollbericht-Vorlage «Audit») · Rechnest du die MWST effektiv oder mit Saldosteuersatz ab? (den Satz trägst du selbst ein).

## 8. Rollen und Arbeitsplätze

| Rolle | Sieht und tut | Sieht nie | Gerät | Tab-Leiste |
| --- | --- | --- | --- | --- |
| Inhaber:in | alles | – | iPad, Computer, Handy | Heute · Objekte · Plan · Rechnungen · Mehr |
| Büro | Kundschaft, Objekte, Plan, Offerten, Rechnungen, Mahnungen, Belege, Monatspaket | Löhne und Zugangshinweise ohne Recht | Computer, iPad | Heute · Rechnungen · Kundschaft · Plan · Mehr |
| Vorarbeiter:in | Wochenplan der Equipe, Objektblatt, Rapporte der Equipe, Unterschrift einholen, Ausfall vorschlagen, Material, Maschinen-Mängel, Stopp | Preise und Ansätze (schaltbar), Löhne, Rechnungen | Equipen-Handy, Tablet im Fahrzeug | Heute · Rapport · Objekte · Fotos |
| Gärtner:in, Lernende:r | eigene Einsätze heute und morgen, Objekt-Hinweise, Checklisten, Fotos, eigene Stunden, eigener Teil des Rapports | Preise, Löhne, andere Personen, Kundschaft ausser dem Objekt | Equipen-Handy, eigenes Handy freiwillig | Heute · Checklisten · Fotos · Meine Stunden |
| Aushilfe | zugeteilter Einsatz, Stempeln, Fotos; Ansicht mit Symbolen | alles andere, Zugangshinweise | Equipen-Handy | Heute · Meine Stunden |
| Fachperson Schädlingsbekämpfung | Verträge, Stationspläne, Kontrollen, Journal, Kontrollbericht abschliessen | Löhne | Handy, Tablet | Heute · Kontrollen · Stationen · Journal |
| Kaminfeger:in | Tour, Anlagen, Messwerte als Abschrift, Mängel, Rapport | Preise (schaltbar), Löhne | Handy | Heute · Tour · Anlagen · Mängel |

Die Treuhand hat keine Rolle und bekommt das Monatspaket als Datei. **Heikle Rechte:** Löhne sehen, Preise und Ansätze sehen, Zugangshinweise und Schlüssel sehen, Rechnungen ausstellen, Rapport nach Unterschrift ergänzen (nur als Nachtrag), Kontrollbericht abschliessen, Intervall-Regeln ändern. **Gerätemodus «Equipe»** fürs Handy im Fahrzeug: nur der Tag, grössere Ziele für Handschuhe, Verlassen mit PIN (Antrag 12).

## 9. Recht und Pflichten

**geprüft am 24.11.2026:** vom Kopf an der Quelle oder an ihrer Wiedergabe durch Amt, Kanton oder Sozialpartner bestätigt (Websuche; die amtlichen Seiten waren direkt nicht erreichbar). **Auszug:** aus der Recherche; kommt erst in die App, wenn der Branchen-Agent den Wortlaut gelesen und das Datum eingetragen hat. **nicht bestätigt:** nicht in die App, auch nicht als Richtwert. Alle Quellen: [Recherche](aussen-recherche.md), Abschnitt 8.

| Fakt | Wert | Quelle | Stand |
| --- | --- | --- | --- |
| GAV Grüne Branche | GAV 2025 bis 2026 zwischen dem Unternehmerverband Gärtner Schweiz und Grüne Berufe Schweiz, ab 1.1.2025, mit Lohnregulativ Garten-, Landschafts- und Sportplatzbau | [GAV 2025](https://jardinsuisse.ch/documents/8586/Web_A5_Gesamtarbeitsvertrag2025_d_ES_u2nE0w2.pdf), [GAV-Register ZH 2026](https://www.zh.ch/content/dam/zhweb/bilder-dokumente/themen/wirtschaft-arbeit/arbeitsbedingungen/lohn-arbeitsbedingungen/GAV-Register_2026.pdf) | geprüft am 24.11.2026 |
| Geltung | eigene kantonale Verträge in BL, BS, GE, TI, VD; Allgemeinverbindlichkeit nicht belegt | GAV, [SECO](https://www.seco.admin.ch/de/gesamtarbeitsvertraege-bund) | Auszug; Allgemeinverbindlichkeit nicht bestätigt |
| Mindestlöhne Gartenbau 2025 | Gärtner:in EFZ 4800 Franken im Monat, gültig 1.1. bis 31.12.2025 (abgelaufen); EBA 4200, Gartenarbeiter:in 4000 (Art. 46 und 47) | [Lohnregulativ 2025](https://jardinsuisse.ch/documents/8810/2d2_I_PE_Lohnregulativ_Galabau_2025_d_fUKEETQ.pdf) | EFZ geprüft am 24.11.2026 (nur 2025); EBA, Gartenarbeiter:in Auszug |
| Mindestlöhne Gartenbau 2026 | kein Lohnregulativ 2026 gefunden | – | nicht bestätigt; die App zeigt «Wert fehlt» |
| GAV Kaminfeger, Schädlingsbekämpfung | keine Fundstelle | – | nicht bestätigt; Regelwerk «Arbeitsgesetz allein» |
| Arbeitsgesetz | gilt für Gartenbau und Landschaftsgärtnerei; ausgenommen sind Betriebe, die überwiegend der gärtnerischen Pflanzenproduktion dienen | [SECO, ArGV 1 Art. 6](https://www.seco.admin.ch/dam/de/sd-web/NUajGDLLNvo6/ArGV1_art06_de.pdf) | Auszug |
| Arbeitszeit | Verzeichnisse (ArG Art. 46, ArGV 1 Art. 73), 5 Jahre; Pikett ausserhalb des Betriebs: Einsatz und Wegzeit zählen (ArGV 1 Art. 15), höchstens 7 Tage in 4 Wochen (Art. 14 Abs. 2); Jugendliche: gefährliche Arbeiten nur nach Bildungsverordnung (ArGV 5 Art. 4) | [SECO](https://www.seco.admin.ch/de/arbeitszeiterfassung), [ArGV 1](https://www.fedlex.admin.ch/eli/cc/2000/243/de), [ArGV 5](https://www.fedlex.admin.ch/eli/cc/2007/582/de) | Auszug |
| Sonne und Hitze | Arbeitgebende treffen UV-Schutzmassnahmen; Schutz vor direkter Sonne April bis September | [Suva 67135](https://www.suva.ch/67135.d), [SECO](https://www.seco.admin.ch/de/arbeiten-im-sommer-massnahmen) | Auszug |
| Sicherheit Garten | Lebenswichtige Regeln Garten- und Landschaftsbau (9 Regeln, Suva 84076, Instruktionshilfe 88835), u. a. Absturzkanten ab 2 m sichern; Motorsäge: Ausbildung und Schutzausrüstung obligatorisch (Checkliste 67033); EKAS Branchenlösung 41 | [Suva](https://www.suva.ch/de-ch/praevention/lebenswichtige-regeln-und-bestimmungen/lebenswichtige-regeln-am-arbeitsplatz/regeln-fuer-den-garten-und-landschaftsbau) | Auszug |
| Sicherheit Kaminfeger | Absturz (Suva 44092); Lebenswichtige Regeln Asbest für Kaminfeger (84055), bei Gebäuden vor 1990 mit Asbest im Faserzement rechnen; Faserzement-Wellplatten nicht durchbruchsicher; EKAS Branchenlösung 68 | [Suva 84055](https://www.suva.ch/de-ch/download/regeln-und-tipps/lebenswichtige-regeln-asbest--kaminfeger--84055.d) | Auszug |
| Asbest, unerwarteter Fund | Arbeit einstellen, Bauherrschaft benachrichtigen (BauAV Art. 32 Abs. 3) | [Suva](https://www.suva.ch/de-ch/praevention/nach-gefahren/gefaehrliche-materialien-strahlungen-und-situationen/asbest/asbest-erkennen-und-richtig-handeln/bei-asbestverdacht-richtig-handeln) | geprüft am 24.11.2026 (Steckbrief Gebäudehülle) |
| Fachbewilligung Schädlingsbekämpfung | VFB-S, Verordnung des EDI vom 28.6.2005, SR 814.812.32; Schädlingsbekämpfung im Auftrag Dritter nur durch oder unter Anleitung von Personen mit Fachbewilligung; Begasung: VFB-B, SR 814.812.33 | [VFB-S](https://www.lexfind.ch/tolv/198554/de), [Kantone, Kontrollkampagne](https://www.anmeldestelle.admin.ch/dam/chem/de/dokumente/download-listen/chemikalien-kampagnen/kontrolle-der-schaedlingsbekaempfungsbetriebe-und-ausbildungsstand.pdf.download.pdf/kontrolle-der-schaedlingsbekaempfungsbetriebe-und-ausbildungsstand.pdf) | Verordnung, Datum und SR-Nummer geprüft am 24.11.2026; «unter Anleitung» Auszug |
| Revision der Fachbewilligungen | Totalrevision VFB-S, VFB-B, VFB-DB; Vernehmlassung 4.2. bis 12.5.2025; Weiterbildungspflicht und Anleitung nur vor Ort vorgesehen; Inkrafttreten nicht gefunden | [Kanton AG](https://www.ag.ch/media/kanton-aargau/portal/aktuell/anhoerungen/bund/2025-000496-inkl-beilage.pdf) | Vernehmlassung geprüft am 24.11.2026; Inhalt und Inkrafttreten nicht bestätigt |
| Fachbewilligung Pflanzenschutzmittel, spezielle Bereiche | Lehrmittel des Bundes (19.8.2025) mit Vegetationskontrolle an Strassen, Wegen, Plätzen; Weiterbildungspflicht ab 2027 erwähnt | [Bund](https://www.permis-pph.admin.ch/dam/de/sd-web/303P0NmwejNl/DE_Lehrmittel_FaBe_Sezielle%20Bereiche_250819.pdf) | nicht bestätigt |
| Herbizid-Verbot | Herbizide (ChemRRV Anhang 2.5 Ziff. 1.1) und Biozide gegen Algen und Moose (Anhang 2.4 Ziff. 4bis) auf und an Strassen, Wegen, Plätzen, auf Dächern und Terrassen verboten, auch auf privaten Flächen (seit 2001); nicht betroffen sind bewachsene Böden wie Beet und Rasen | [BAFU](https://www.bafu.admin.ch/de/pflanzenschutzmittel-im-hausgarten-und-liegenschaftsunterhalt), [BAFU Algen und Moose](https://www.bafu.admin.ch/de/biozidprodukte-gegen-algen-und-moose), kantonale Merkblätter | geprüft am 24.11.2026 |
| Invasive Neophyten | FrSV, Änderung vom 1.3.2024, in Kraft 1.9.2024: Inverkehrbringen der Pflanzen aus Anhang 2.2 verboten (u. a. Kirschlorbeer, Schmetterlingsstrauch, Chinesische Hanfpalme, Blauglockenbaum); bestehende Pflanzen müssen nicht entfernt werden; Gemeinden können mehr verlangen | [BAFU](https://www.bafu.admin.ch/de/anderung-im-umgang-mit-invasiven-gebietsfremden-pflanzen) | geprüft am 24.11.2026 |
| Kaminfeger, Markt | kantonal: Bern und Thurgau ohne Monopol seit 2021, Luzern seit 1.7.2019 mit Bewilligung der Gebäudeversicherung, Freiburg mit Konzessionen (Stand 2023); Gesamtübersicht nicht belegt | [Kanton FR](https://www.parlinfo.fr.ch/dl.php/de/ax-65a951afd872d/de_RCE_2023-GC-31_ramonage.pdf), Recherche 8.4 | Auszug |
| Reinigungsintervalle, Feuerungskontrolle | kantonal oder kommunal je Brennstoff und Betrieb (Beispiel einer Zürcher Gemeinde: flüssige Brennstoffe 2-mal, gasförmige 1-mal im Jahr); Feuerungskontrolle nach LRV Anhang 3, Beispiel Aargau alle 2 Jahre | [Gemeinde-Weisung](https://www.rueti.ch/public/upload/assets/448/WeisungReinigungFeuerungsanlagen.pdf?fp=1), [Kanton AG](https://www.ag.ch/de/themen/umwelt-natur/licht-luft-strahlung/luft/feuerungen-und-heizungen/feuerungskontrolle/feuerungskontrollen-durch-kanton) | Auszug; die App liefert keine Intervalle, der Betrieb erfasst sie mit Quelle |
| Lebensmittelbetriebe | Selbstkontrolle ist Pflicht des Betriebs (Hygieneverordnung EDI); Artikel zur Schädlingsbekämpfung nicht belegt | [HyV](https://www.fedlex.admin.ch/filestore/fedlex.data.admin.ch/eli/oe/2023/121/de/pdf/fedlex-data-admin-ch-eli-oe-2023-121-de-pdf.pdf) | nicht bestätigt |
| Werkvertrag | Mängelrüge 60 Tage (OR Art. 367 Abs. 1bis, seit 1.1.2026); Verjährung 5 Jahre bei unbeweglichen Werken (OR Art. 371 Abs. 2); ob eine Gartenanlage ein unbewegliches Werk ist, nicht belegt | [OR](https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de) | Rügefrist geprüft am 24.11.2026 (Steckbrief Maler); Rest Auszug |
| MWST-Sätze | reduzierter Satz 2,6 Prozent u. a. für Sämereien, lebende Pflanzen, Stecklinge, Schnittblumen, bei gesonderter Rechnungsstellung (MWSTG Art. 25 Abs. 2 lit. a); Normalsatz 8,1 Prozent | [MWSTG](https://www.fedlex.admin.ch/eli/cc/2009/615/de), [ESTV](https://www.estv.admin.ch/de/mwst-steuersaetze-schweiz) | 2,6 Prozent geprüft am 24.11.2026; 8,1 Prozent Auszug |
| Saldosteuersatz | Fassung 2017: Gartenbau ohne separat fakturierte Pflanzen 4,3, separat fakturierte Pflanzenlieferungen 0,6, Gartenunterhalt 4,3 Prozent; Fassung ab 1.1.2025 nicht gefunden; Kaminfeger, Schädlingsbekämpfung nicht belegt; Methode: halbjährlich, eigener Satz je Tätigkeit über 10 Prozent des Umsatzes | SR 641.202.62, [ESTV](https://www.estv.admin.ch/de/mwst-saldosteuersatzmethode-2025) | nicht bestätigt; der Betrieb trägt seinen Satz ein |
| QR-Rechnung | Einzahlungsscheine seit 30.9.2022 abgelöst | [KMU-Portal](https://www.kmu.admin.ch/de/abloesung-einzahlungsscheine-am-30092022-haben-sie-schon-auf-die-qr-rechnung-oder-ebill-umgestellt) | Auszug |
| Datenschutz | Verhältnismässigkeit, Datensicherheit, Information, Meldung von Verletzungen (DSG Art. 6, 8, 19, 24) | [DSG](https://www.fedlex.admin.ch/eli/cc/2022/491/de) | Auszug |
| Grüngut, Lärm, Ruhezeiten | kommunal geregelt | – | nicht bestätigt |

**Die App** erinnert, weist nach und zeigt Hinweise mit Quelle: Fälligkeiten, Verbote auf befestigten Flächen, Fachbewilligung fehlt, Neophyten in Pflanzenlisten, Lernende mit Maschinen, Hitze. Nach DSG fotografiert sie Flächen, Stationen und Anlagen, keine Personen und keine Codes, und entfernt Standortangaben beim Teilen. **Sie tut nie:** Messwerte, Grenzwerte, Befall, Hygiene, Absturz, Asbest oder Lohn beurteilen; eine Frist im Einzelfall einschätzen; einer Gemeinde, Gebäudeversicherung, Behörde oder Kommission etwas melden; Pflanzenschutz beraten oder Pflanzen bestimmen. Vor dem Pilot prüft eine Fachperson ([S-17](../entscheide.md)).

## 10. Geräte und Abgleich

| Lage | Stufe 1 ohne JA | Nach JA ([S-06](../entscheide.md)) |
| --- | --- | --- |
| L1 allein (Kleinst-Unterhalt, Kaminfeger:in allein) | ein Handy als Hauptgerät, Sicherung als Datei mit Erinnerung | iPad als Zweitgerät über Kopplung |
| L2 Inhaber:in und Büro | ein Hauptgerät | Kopplung im WLAN |
| L3 Equipen im Magazin | Wochenplan und Einsatzblatt als PDF mit QR; Rapport auf Papier, als Foto zurück; Kontrollbericht auf dem Hauptgerät | morgens Mappe aufs Equipen-Handy, abends Befehle (Rapporte, Stunden, Fotos, Befunde, Behandlungen, Unterschriften, Stopps) |
| L4 allein auf Tour, selten im Magazin (Schädlingsbekämpfung) | eigenes Handy als Hauptgerät | Päckli über das Teilen-Menü |

Das Gerät der Equipe muss den Tag ohne Netz können: Einsätze, Objektblatt, Fotos, Rapport, Stempeln. Das Büro besitzt Planung, Kundschaft, Preise; die Equipe fügt Rapporte, Stunden, Fotos und Befunde an. **Nie aufs Handy:** Ansätze, Pauschalen, Löhne, Rechnungen, Stunden anderer, Codes ([S-11](../entscheide.md)); Objektangaben und Stationspläne nur für die Einsätze des Tages. Keine Ortung, keine Bewegungsprofile. **Erst Stufe 2** ([S-14](../entscheide.md)): Umplanen untertags mit Mitteilung, Equipen in verschiedenen Regionen ohne Magazin, Seiten mit Kontrollberichten für Lebensmittelbetriebe und Verwaltungen, Terminwahl für Kaminfeger-Kundschaft, laufende Sicherung.

## 11. Wörter

Objekt heisst Objekt (Garten, Liegenschaft, Betriebsräume der Kundschaft); beim Kaminfeger heisst die Anlage Feuerungsanlage; Team heisst Equipe; Werkhof heisst Magazin; der Leistungsplan heisst Pflegeplan; Verträge heissen Pflegevertrag und Kontrollvertrag, nie Abo; Einsatz der Schädlingsbekämpfung heisst Kontrolle; der Plan der Stationen heisst Stationsplan. Ausmass, nie Aufmass; Hecke in Metern (Laufmeter im Gespräch). Nie: Abo, Job, befallsfrei, unbedenklich, konform, gesichert als Urteil. **Fürs Glossar:** Pflegeplan, Saisonfenster, Schnittfläche, Grüngut, Fuhre, Ausfalltag, Neophyten, Behandlungsjournal, Fachbewilligung, Kontrollvertrag, Station, Stationsplan, Befund, Befallsquote, Folgekontrolle, Feuerungsanlage, Abgasanlage, Reinigungsintervall, Feuerungskontrolle, Heizperiode, Voranmeldung, nicht angetroffen, Mängelmeldung, Sammelrechnung.

## 12. MVP und Pakete

**MVP** (Pilot 4 bis 8 Wochen, Gartenunterhalt mit 3 bis 8 Personen, ein Hauptgerät, Equipen nach [S-06](../entscheide.md)):

1. Einrichten mit Betriebsart, Leistungs-Vorlage ohne Ansätze und Rollen; Objektliste aus einer Tabelle einlesen.
2. Gartenaufnahme mit Flächen, Hecken, Bäumen, Zugang ohne Code und Fotos, ohne Netz.
3. Pflegeplan mit Häufigkeit im Saisonfenster, Soll-Stunden, Liste «fällig in 30 Tagen», Jahresplan für die Kundschaft.
4. Wochenplan je Equipe mit Ausfalltag und Verschieben im Fenster; Einsatzblatt mit QR, nach JA als Mappe.
5. Gartenrapport in einer Minute: Stunden, Maschinen, Material, Grüngut, Fotos, Unterschrift; Stunden ins Zeit-Ledger.
6. Rechnung mit QR aus Rapporten oder Pauschale, Pflanzen getrennt, Sammelrechnung je Verwaltung.
7. Sicherheit und Pflanzenschutz als Nachweis: Checklisten, Behandlungsjournal mit Hinweisen.
8. Monatsblatt der Stunden mit Ausfall getrennt für die Treuhand, ohne ungeprüften Lohnwert.

| Paket | Ziel | Abnahme (ganz im Auftrag) |
| --- | --- | --- |
| B-1 Gerüst `garden`, Einrichten, Vorlagen | Gartenbetrieb richtet sich ein | `pnpm check:industry garden` grün; 1 und 8 Personen schalten richtig |
| B-2 Gartenaufnahme | Garten einmal aufnehmen, ohne Netz | Prüfbeispiel 6.1 exakt; Import von 6 Objekten |
| B-3 Pflegeplan und Saison | Fälligkeiten nie vergessen | Wochen aus 6.2 exakt; Soll 31,440 h; Raten mit Rest |
| B-4 Wochenplan, Wetter, Tour | Umplanen in Minuten | Ausfalltag schlägt Verschieben im Fenster vor; nichts ohne Bestätigung |
| B-5 Gartenrapport und Grüngut | keine Leistung bleibt unverrechnet | Regie 134 000 Rappen; gesperrt nach Unterschrift |
| B-6 Abrechnung Garten | Rechnung aus Rapporten und Pauschale | Sammelrechnung je Verwaltung; Pflanzen eigene Position |
| B-7 Sicherheit, Pflanzenschutz, Neophyten | nachweisen und erinnern, nie beurteilen | Herbizid-Hinweis auf Weg, nicht auf Rasen; Texttest |
| B-8 Neuanlage | Offerte mit Ausmass bis Abnahme | Prüfbeispiel 6.7; Abnahmeprotokoll gesperrt |
| B-9 Gerüst `pest-control`, Kontrollvertrag, Stationsplan | Vertrag mit Stationen führen | 8 Kontrolltage aus 6.8 exakt; Station nie gelöscht |
| B-10 Kontrollgang und Kontrollbericht | Audit-fester Bericht | Befallsquote 1538; Bericht gesperrt nach Abschluss |
| B-11 Gerüst `chimney`, Anlagenregister | Anlagen mit Intervall | «Intervall fehlt» ohne Regel; Fälligkeit aus Testregel |
| B-12 Tour, Voranmeldung, Rapport, Mängel | Kaminfeger-Saison ohne Papier | Serienbrief; nicht angetroffen; Sammelrechnung |

**MVP:** B-1 bis B-7, mit dem Monatsblatt aus P-31. **Vor dem Pilot:** B-8, wenn der Pilotbetrieb Neuanlagen macht. **Danach:** B-9 und B-10 (Schädlingsbekämpfung, zweite Betriebsart im selben Betrieb möglich), B-11 und B-12 (Kaminfeger), Material (P-41), Fahrzeuge und Maschinen (P-42), Kasse (P-30), Winterdienst nach Antrag 8, Sprachen ([S-07](../entscheide.md)). **Welle 6:** fr-CH, it-CH. **Bewusst nie:** Ortung oder Fahrtenbuch per GPS; Routenoptimierung über fremde Kartendienste; Anbindung an Behörden, Gebäudeversicherungen, Lieferanten, Entsorger oder Messgeräte; Beurteilung von Messwerten, Befall, Hygiene oder Lohn; Pflanzen-Bestimmung und Pflanzenschutz-Beratung; Verkauf von Pflanzen mit Kasse (Gartencenter ist eine andere Branche); kantonale Tarife als Lieferung der Suite.

## 13. Demo-Betrieb

**Gartenpflege Muster GmbH**, Musterweg 12, 8000 Beispielstadt (Kanton Zürich), 6 Personen, Gartenunterhalt mit kleinen Neuanlagen und einem Zweig Schädlingskontrolle für Lebensmittelbetriebe (zwei Branchen in einem Betrieb). Saldosteuersatz als Demo-Eingabe ohne Richtwert; alle Ansätze sind Testwerte mit dem Hinweis «Beispiel, kein Richtwert». **Team:** A. Muster (Inhaberin, Fachbewilligung Schädlingsbekämpfung, 100 Prozent) · B. Muster (Vorarbeiter Equipe 1, Portugiesisch) · C. Muster (Gärtnerin EFZ, 80 Prozent, eigenes Handy, Albanisch) · D. Muster (Lernender Gärtner EFZ, 2. Lehrjahr) · E. Muster (Aushilfe März bis November, im Stundenlohn, Spanisch) · F. Muster (Büro, 30 Prozent). **Kundschaft:** Verwaltung Muster AG (sechs Mehrfamilienhäuser Musterweg 1 bis 6 mit Umgebung), Stockwerkeigentum Musterhang 4 (Hecke 120 m), Familie Muster (Rasen 450 m², Hecke 40 m, 3 Bäume), Gemeinde Beispielstadt (Schulhausareal, Neophyten-Flächen), Backstube Muster (Produktionsraum, 14 Stationen), Gasthaus Muster (Küche und Keller, 9 Stationen).

| Auftrag | Art | Zeigt |
| --- | --- | --- |
| Verwaltung Muster AG, Haus 1 bis 6 | Pflegevertrag, Pauschale pro Jahr | Rasen 18-mal, Hecke 2-mal, Laub 3-mal; Sammelrechnung |
| Familie Muster | Pflege nach Aufwand, monatlich verrechnet | Prüfbeispiele 6.1 und 6.2 |
| Musterhang 4, Sitzplatz | Neuanlage | 24 m² Belag, 30 Pflanzen, Abnahmeprotokoll |
| Schulhausareal | Projekt mit Journal | Neophyten, getrennte Entsorgung |
| Backstube Muster | Kontrollvertrag, 8 Kontrollen pro Jahr | Stationsplan, Kontrollbericht für das Audit, Befallsquote |
| Gasthaus Muster | Notfall Wespennest | Einzelbekämpfung mit Behandlungsjournal |

**Kaminfeger Muster GmbH** als zweiter Demo-Betrieb auf demselben Gerät, gleiche Adresse: G. Muster (Meisterin), H. Muster (Kaminfeger EFZ), I. Muster (Lernende); 40 Anlagen in Beispielstadt (Öl, Gas, Stückholz, Pellets); Intervall-Regeln als Testwerte mit Hinweis «Beispiel, kein Richtwert»; eine Tour mit 12 Anlagen, zwei nicht angetroffen, ein offener Mangel.

**Ein Tag:** 06:45 Regen gemeldet, B. Muster setzt einen halben Ausfalltag für Equipe 1; die App schlägt vor, Rasen Haus 3 und 4 auf Donnerstag zu legen (im Fenster). 10:30 Familie Muster: Rapport mit Hecke 168 m², 3 Fuhren Grüngut, Unterschrift am Gartentor. 14:00 A. Muster in der Backstube: 14 Stationen, 2 mit Frass, 1 nicht zugänglich; Kontrollbericht als PDF an die Kundschaft geteilt. Abends Rechnung Familie Muster aus zwei Rapporten.

## 14. Risiken und offene Fragen

| Risiko oder Frage | Folge | Was hilft, wer entscheidet |
| --- | --- | --- |
| Drei Teilbranchen mit verschiedener Pflicht-Dokumentation | Umfang wächst | drei Pakete auf gemeinsamer Plattform-Basis; Reihenfolge Garten, Schädling, Kaminfeger |
| Pilot mit welcher Teilbranche und welchem Betrieb | Reihenfolge | Alban nach ersten Kunden ([S-09](../entscheide.md)); Empfehlung Gartenunterhalt mit Schädlings-Zweig |
| Kaminfeger als eigene Ausgabe statt «Vor Ort» | Marke, Adresse | Alban ([S-01](../entscheide.md)); Empfehlung: in «Vor Ort» |
| Abgleich der Equipen ohne Server | Rapporte bleiben Papier | Alban ([S-06](../entscheide.md)); Stufe 2 ([S-14](../entscheide.md)) |
| Private Handys, Schlüssel und Codes der Kundschaft | Schaden bei Verlust | keine Codes, Mappe nur für den Tag ([S-11](../entscheide.md)) |
| Haftung bei verpasster Reinigung oder Kontrolle | Vorwurf an die App | Liste «fällig» gut sichtbar, Texte erinnern nur; Fachperson ([S-17](../entscheide.md)) |
| Intervall-Vorlagen je Kanton für Kaminfeger pflegen oder leer ausliefern | Aufwand für Quellen, Fehler | Empfehlung: leer, der Betrieb erfasst mit Quelle; Pflege je Kanton nur nach Prüfung ([S-17](../entscheide.md)) [Geld] |
| Mindestlöhne 2026, Saldosteuersätze, Weiterbildungspflicht nicht bestätigt | falsche Hinweise | «Wert fehlt»; Prüfung mit Zugang zu seco, fedlex, estv, bafu ([S-17](../entscheide.md)) |
| Revision der Fachbewilligungen | Pflichtfelder ändern sich | Bewilligung als Nachweis mit Ablauf, keine harte Regel |
| Anrede in Kontrollbericht, Rapport, Voranmeldung | «du» im Brief an Dritte | [S-07](../entscheide.md) |
| Wetter aus dem Netz, Adresse an die Karten-App | Datenfluss | [S-15](../entscheide.md), [S-16](../entscheide.md) |
| Stationspläne sind Geschäftsgeheimnis der Kundschaft | Vertrauen | heikel, nur PDF durch die Person, aufs Handy nur für die Kontrolle des Tages |
| Bindestrich in `pest-control` für Tabellen und Ereignisse | uneinheitliche Namen | Kopf im Namensregister |

## 15. Absehbare Plattform-Anträge

| Nr. | Antrag | An | Zweite Branche | Bis dahin |
| --- | --- | --- | --- | --- |
| 1 | Behandlungsjournal: Produkt mit Zulassungsnummer, Wirkstoff, Sicherheitsdatenblatt; Einsatz mit Menge, Ort oder Station, Person, Bewilligung; Hinweis-Regeln mit Quelle | P-27 oder P-41 | `garden` und `pest-control` (beide hier) | Port `TreatmentLog`; zuerst `garden_treatments`, `pest-control` wartet auf den Entscheid |
| 2 | P-51 Kern vor W4 (Facility, Antrag 1; Gebäudehülle, Antrag 13): Pflegevertrag mit Pauschale und Raten, Kontrollvertrag mit Anzahl Kontrollen, Erneuerung, Kündigung | P-51 | Facility, Gebäudehülle | Port `CareAgreementSource`, Tabellen in 6.2 und 6.8 |
| 3 | Equipe als Einheit der Planung: Personen, Vorarbeit, Fahrzeug; Einsatz an Equipe; Stunden je Mitglied | P-31, P-25 | Gebäudehülle, Umzug, Facility | Einsatz mit mehreren Personen |
| 4 | Reihenfolge der Einsätze eines Tages, Sortierung nach Gemeinde, Strasse, Hausnummer (Gebäudehülle, Antrag 12) | P-25 | Gebäudehülle, Facility | Sortierfeld |
| 5 | Ausweise und Bewilligungen je Person: Art, Nummer, Ausstellerin, gültig bis, Weiterbildung (Fachbewilligung, Motorsäge, Feuerungskontrolle) | P-27 oder P-20 | Umzug (Fähigkeitsausweis), Gebäudehülle (PSAgA, Kran) | Port `PersonPermits` in `garden` |
| 6 | Wiederkehr im Saisonfenster: n-mal je Fenster, Verschieben innerhalb, Hinweis ausserhalb; Intervall ab letzter Ausführung | P-26 | Facility (Fenster, Grundreinigung), Haustechnik (Wartung) | `garden_plan_lines` |
| 7 | Ausfalltag und Ausfallstunden als Buchungsart (Gebäudehülle, Antrag 7) | P-25, P-31 | Gebäudehülle | `garden_weather_days` |
| 8 | Winterdienst-Journal und Pikett (in Facility als Kandidat markiert) | P-26, P-27, P-31 | Facility | Funktion wartet; kein eigener Winterdienst |
| 9 | Befund am Objekt mit Frist und Empfänger (Facility, Antrag 2) | P-23 oder P-25 | Facility, Gebäudehülle | `chimney_defects` |
| 10 | Plan mit Markierungen (Position, Legende, Fassung; Gebäudehülle, Antrag 11) | P-33, P-11 | Gebäudehülle, Facility | Position in `pest_control_stations` |
| 11 | Einheiten Fuhre, Sack, t, Kontrolle, Einsatz, m³ lose (Gebäudehülle, Antrag 6; Umzug) | P-01, P-24 | Gebäudehülle, Umzug | Einheit als Text |
| 12 | Gerätemodus «Equipe» (Gebäudehülle, Antrag 14) | P-06, P-09 | Gebäudehülle, Umzug | – |
| 13 | Serienbrief aus einer Liste von Einsätzen (PDF je Empfänger, Aushang, Text zum Kopieren) | P-11, P-25 | Facility (Ankündigung an Mieter:innen) | `chimney_notices` |
| 14 | Entsorgungsnachweis (Maler, Umzug, Gebäudehülle) mit Fuhren und Volumen | P-27 oder P-41 | Maler, Umzug, Gebäudehülle | `garden_waste_entries` |

Dazu, was andere schon beantragt haben und Garten mitnutzt: Soll gegen Ist (Facility, Antrag 7), Regelwerk und Zeitbuchung mit Objekt (Facility, Antrag 6), Schlüssel-Register (Facility, Antrag 3), Kern der Fahrzeuge mit Nutzvolumen (Umzug), Unterweisung je Gerät (Umzug), Schadstoff-Fall am Objekt (Gebäudehülle, Antrag 1). Anträge stehen in `docs/branchen/aussen/antraege.md`; der Kopf entscheidet ([Zusammenarbeit](../zusammenarbeit.md), Abschnitt 5).

## 16. Stand

Steckbrief vom 24.11.2026, noch nichts gebaut.

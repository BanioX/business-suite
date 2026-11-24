# Branche Dachdecker, Spengler, Fassade und Gerüst (`envelope`)

- **Rolle:** Branchen-Agent
- **Voraussetzung:** W0-01, W0-02, W0-03 und W1-00 fertig; dazu je Paket die Plattform-Pakete in der Tabelle unten, mindestens mit Vertrag «alpha»: P-21 (W1-01), P-22 und P-23 (W1-02), P-24 (W1-03), P-25 (W1-04), P-26 und P-27 (W1-05), P-28 und P-33 (W1-06), P-29 und P-31 (W2); für die Mappe P-40 (W3, nach Albans JA zu [S-06](../entscheide.md))
- **Welle:** W3

## Ziel

Ein Betrieb der Gebäudehülle mit 1 bis 20 Personen (Steildach, Flachdach, Spenglerei, Fassade, Gerüst) arbeitet in der Ausgabe «Vor Ort» von der Dachaufnahme bis zur bezahlten Rechnung auf einem Hauptgerät und ohne Netz: Aufnahme des Gebäudes, Ausmass mit Neigung und Materialauszug, Offerte aus dem Ausmass, Wochenplan mit Wetterentscheid, Tages- und Regierapport mit Unterschrift, Sicherheit in der Höhe und Schadstoff-Ablauf als Nachweis, Rechnung mit QR-Zahlteil und Fristen als Erinnerung. Die Branche liegt ganz in `industries/envelope/`, dockt nur über Steckplätze an ([ADR-0004](../adr/0004-andocken-einer-branche.md)), baut nichts, was die Plattform hat oder baut, und beurteilt nie (Absturz, Gerüst, Asbest, Wetter, Lohn, Haftung).

## Lesestoff

1. `CLAUDE.md`, `AGENTS.md`, [`../zusammenarbeit.md`](../zusammenarbeit.md)
2. Steckbrief [`../branchen/gebaeudehuelle.md`](../branchen/gebaeudehuelle.md), verbindlich, ganz
3. Recherche [`../branchen/gebaeudehuelle-recherche.md`](../branchen/gebaeudehuelle-recherche.md), nicht verbindlich; für Einzelheiten (ganze Leistungsliste 6.1, Checklisten 6.2, Quellen in Abschnitt 8, Rechenbeispiele 11.4)
4. [`../plattform.md`](../plattform.md), [`../architektur.md`](../architektur.md), Abschnitte 4 bis 7
5. ADRs [0004](../adr/0004-andocken-einer-branche.md), [0005](../adr/0005-gemeinsames-datenmodell.md), [0006](../adr/0006-geraete-und-abgleich.md), [0007](../adr/0007-sprachen.md), [0009](../adr/0009-grundsaetze-aus-randen.md), [0010](../adr/0010-rechnungen-als-vorsystem.md), [0011](../adr/0011-oeffentliches-repo.md); offene Fragen in [`../entscheide.md`](../entscheide.md)
6. [`../fakten/`](../fakten/README.md) und die `api.md` jedes Plattform-Pakets, das ein Paket braucht
7. Steckbrief [Maler](../branchen/maler.md), Abschnitte 6 und 15, und `docs/branchen/maler/antraege.md`, falls vorhanden: Schadstoffhinweis, Entsorgung, Materialbedarf, Ausmass und Fristen sind dort als Kandidat markiert; als zweite Branche baust du keine eigene Fassung, sondern stellst den Antrag (Regel der zwei)
8. `industries/muster/` als Vorbild für Manifeste und Steckplätze
9. Nur als Muster für Texte, Screens und Lektionen: Randen (`BanioX/Randen`, nur lesen) `docs/regeln.md`, `docs/design.md`, `docs/lernbuch.md`

## Pfade

- **Schreiben:** `industries/envelope/` (`core/`, `web/`, `NAMES.md`); `docs/branchen/gebaeudehuelle.md` (nur Abschnitt 9, Spalte «Stand», und Abschnitt 16 «Stand»); `docs/branchen/gebaeudehuelle/adr/ENV-NNNN-<titel>.md` (eigene ADRs mit Präfix `ENV`); `docs/branchen/gebaeudehuelle/antraege.md` (Plattform-Anträge); `docs/branchen/gebaeudehuelle/schulden.md`, `docs/branchen/gebaeudehuelle/lernbuch.md`
- **Nur lesen:** `docs/branchen/gebaeudehuelle-recherche.md`, `platform/`, `editions/`, `registry/`, `industries/muster/`, übriges `docs/`, `BanioX/Randen`
- **Tabu:** `platform/`, `editions/`, `registry/` (neue Kennungen als Vorschlag in `industries/envelope/NAMES.md`, der Kopf trägt ein), `tools/`, Wurzel-Konfiguration, `pnpm-lock.yaml` und neue Abhängigkeiten (nur per Plattform-Antrag), andere Branchen unter `industries/` (nie schreiben, nie importieren), `docs/` ausserhalb `docs/branchen/gebaeudehuelle*`, `BanioX/Randen` und `BanioX/Rettich` (nie schreiben)

Jeder Commit trägt die Trailer `Order: branche-gebaeudehuelle` und `Role: industry:envelope`.

## Pakete in dieser Reihenfolge

Ein Paket ist fertig, wenn seine Abnahme erfüllt ist und `pnpm check` sowie `pnpm check:industry envelope` grün sind. Fehlt einem Paket ein Plattform-Paket, wartet es oder arbeitet hinter einem Port in `industries/envelope/` mit einfacher Umsetzung und Plattform-Antrag ([`../zusammenarbeit.md`](../zusammenarbeit.md), Abschnitt 5). Alle Zahlen unten sind Testwerte aus dem Steckbrief, keine Empfehlungen.

| Paket | Braucht (Welle) |
| --- | --- |
| B-1 | W0-02, W0-03, P-21 (W1-01), P-22 und P-23 (W1-02), P-24 (W1-03) |
| B-2 | P-23 (W1-02), P-33 (W1-06), P-10, P-11 (W0-03) |
| B-3 | P-25 Ausmass (W1-04), P-24 (W1-03); P-41 (W3) weich |
| B-4 | P-29 (W2), P-25 Nachtrag (W1-04), P-28 (W1-06), P-10 Unterschrift |
| B-5 | P-25 Einsatz (W1-04), P-28 (W1-06), P-32, P-11 (W0-03); P-40 (W3) für die Mappe nach S-06 |
| B-6 | P-25 Rapport (W1-04), P-31 Zeit-Ledger (W2), P-33 (W1-06), P-10 |
| B-7 | P-27 (W1-05), P-28 (W1-06), P-11; P-42 (W3) weich für PSAgA und Kranbuch |
| B-8 | P-23 (W1-02), P-27 (W1-05), P-33, P-11 |
| B-9 | P-29 (W2), P-25 Abnahme (W1-04), P-28 |
| B-10 | P-22 Kontakte, P-25, P-27, P-28 |
| B-11 | P-26 (W1-05), P-27, P-29 (W2); P-51 (W4 oder früher nach Antrag 13) |
| B-12 | P-31 Regelwerke (W2), P-28 |

### B-1 Gerüst, Einrichten und Vorlagen

- **Ziel:** Die Branche erscheint in «Vor Ort»; ein Betrieb richtet sich als Dach, Spenglerei, Fassade oder Gerüst ein.
- **Umfang:** `defineIndustry` und `defineIndustryWeb` nach `industries/muster`; Betriebsarten `envelope.roofing`, `envelope.sheet_metal`, `envelope.facade`, `envelope.scaffolding` (mehrfach wählbar); Funktionen aus Steckbrief Abschnitt 6 im Register mit Abhängigkeiten; Fragen beim Einrichten (Abschnitt 7); Lexikon und Texte (Abschnitt 11); Rollen-Vorlagen (Abschnitt 8) auf Basis der Plattform-Vorlagen; Gerätemodus «Equipe» als Eintrag im Register; Leistungs-Vorlage ohne Ansätze und Leistungswerte; Checklisten-Vorlagen; Demo-Grundgerüst (Abschnitt 13); `NAMES.md` mit allen Kennungen.
- **Abnahme:**
  - [ ] `pnpm check:industry envelope` grün; jede Kennung steht in `NAMES.md` mit Präfix `envelope`.
  - [ ] «Steildach, allein, meistens Regie» schaltet Umfang «Schlank» (keine Rollen, kein Equipenplan) und Regie als Standard-Preisart; «Steildach und Spenglerei, 8 Personen, Gerüste bestellt, gemieteter Kran, Unterhalt ja» schaltet Rollen, Equipenplan, Gerüst-Übernahme, Kran-Reservation und Unterhalt; «Gerüstbau» schaltet Gerüstaufträge und Ausmass Gerüst; Sicherheit in der Höhe ist in jeder Kombination an.
  - [ ] Die Leistungs-Vorlage legt alle Positionen der Recherche, Abschnitt 6.1, ohne Ansatz an; eine Position ohne Ansatz zeigt «Ansatz fehlt»; NPK steht nur als Verweisfeld.
  - [ ] Eine ausgeschaltete Funktion hinterlässt keinen Einstieg; ihre Daten bleiben.
  - [ ] Texttest: «du», «ss», kein Ausrufezeichen, keine Produkt-, Hersteller- oder Markennamen.

### B-2 Dachaufnahme und Objektblatt

- **Ziel:** Ein Gebäude wird einmal aufgenommen und über Jahre genutzt, ohne Netz.
- **Umfang:** Tabellen `envelope_building_profiles`, `envelope_surveys`, `envelope_surfaces`, `envelope_edge_lines`, `envelope_openings`; geführte Folge aus Steckbrief 6.1; Anlagen (Anschlageinrichtung, Sicherheitshaken, Blitzschutz, Solar, Schneefang) als Vorlagen für die Anlagen von P-23; Fotos je Fläche über P-33; Dokumente Dachaufnahme und Objektblatt.
- **Abnahme:**
  - [ ] E2E im Offline-Modus: Aufnahme Musterweg 4 mit 2 Dachflächen, 5 Linien, 3 Öffnungen und 4 Fotos anlegen und abschliessen.
  - [ ] Baujahr leer bleibt «unbekannt» und wird nie als Zahl angezeigt; Deckung und Baujahr stehen für B-8 bereit.
  - [ ] Das Objektblatt als PDF zeigt Zugang ohne Code, Anschlageinrichtungen mit Prüfdatum und markiert Flächen mit «nicht durchbruchsicher»; es enthält keine Preise.
  - [ ] Kamera nur nach Tippen, Fallback auf Datei; Fotos als Blob mit Prüfsumme; keine Koordinaten gespeichert.

### B-3 Ausmass und Materialauszug

- **Ziel:** Aus der Aufnahme entstehen Flächen, Längen, Stück, Material und Stunden mit sichtbarer Formel.
- **Umfang:** Formelsatz aus Steckbrief 6.2 als Steckplatz im Ausmass von P-25 (sonst hinter einem Port mit Antrag 3); Tabellen `envelope_measure_links`, `envelope_material_rules` (Port bis Antrag 4), `envelope_sheet_profiles`; Option `openingDeductionThresholdM2`; Abfragen `envelope.material.takeoff` und `envelope.material.orderList`; Ausmassblatt, Material- und Bestellliste als PDF oder Datei.
- **Abnahme:**
  - [ ] Unit-Tests rechnen das Prüfbeispiel exakt: Neigung 35,0 Grad = 70,02 Prozent; s 6,836 m; L 12,800 m; Fläche 175,010 m² (aus den Eingaben, nicht 175,002 aus der gerundeten Sparrenlänge); Ziegel 2481; Lattung 540,473 m; Konterlattung 34 Sparren, 232,435 m; Unterdach 3 Rollen; Halter 46; Gerüst 222,000 m²; Stunden 134,092 h; 15,8 Personenarbeitstage.
  - [ ] Flachdach 384,000 m², Aufbordung 24,000 m², Dämmung 76,800 m³, 85 Rollen; Fassade 391,000 − 30,240 = 360,760 m², Leibungen 72,000 m, Fensterbänke 21,600 m, Gerüst 475,000 m²; Mauerabdeckung 415 mm, 2 Streifen, Verschnitt 170 mm (1700 Basispunkte), 5 Tafeln, 7,470 m², 37,649 kg.
  - [ ] Gespeicherte Eingaben und eingefrorene Mengen sind Ganzzahlen (mm, Tausendstel, Zehntelgrad); keine Gleitkommazahl verlässt die Rechenfunktion.
  - [ ] Jede Menge zeigt ihre Formel mit den eingesetzten Werten; ohne Verbrauch steht «Verbrauch fehlt», ohne Leistungswert «Leistungswert fehlt».
  - [ ] E2E offline: Ausmass aus der Aufnahme von B-2 erzeugen und als Ausmassblatt drucken.

### B-4 Offerte und Nachtrag

- **Ziel:** Die Offerte entsteht am selben Abend aus dem Ausmass, ohne eine Menge abzutippen.
- **Umfang:** Tabelle `envelope_item_mappings`; `envelope.quote.fromMeasurement` füllt die Offerte von P-29; Varianten (Antrag 5, bis dahin Gruppe «Variante» ausserhalb des Totals); Preisart mit Quelle; Nachfassen; Nachtrag mit Fotos und Unterschrift über P-25.
- **Abnahme:**
  - [ ] Aus dem Ausmass Musterweg 4 entstehen ohne Eingabe einer Menge die Positionen Ziegeldeckung 175,010 m², Lattung 540,473 m, Rinne 25,600 m, Halter 46 Stk. und Gerüst 222,000 m².
  - [ ] Zeilentotal ganzzahlig: 175,010 m² × Testwert 4550 Rappen = 796 296 Rappen (796 295,5 kaufmännisch gerundet); eine Variante zählt nicht zum Total.
  - [ ] Eine ausgestellte Offerte ist gesperrt; eine Änderung entsteht als neue Fassung.
  - [ ] Nach 10 Tagen ohne Antwort erscheint «Nachfassen» in «Heute»; nach Annahme verschwindet es.
  - [ ] Der Nachtrag «Lattenersatz» mit zwei Fotos und Unterschrift ist danach gesperrt; das PDF teilt die Person selbst, die App verschickt nichts.

### B-5 Wetterentscheid und Wochenplan

- **Ziel:** Umplanen bei Regen dauert Minuten, und niemand vergisst Gerüst, Kran, Mulde oder Kundschaft.
- **Umfang:** Tabellen `envelope_weather_rules` (Grenzwerte leer), `envelope_weather_decisions`, `envelope_visit_dependencies`, `envelope_lost_time` (Port bis Antrag 7); Status je Einsatz in Plan und «Heute»; Vorschläge beim Verschieben; Textvorlagen; Wochenplan je Equipe und Einsatzblatt mit QR als PDF.
- **Abnahme:**
  - [ ] «verschoben» auf dem Dach-Einsatz Musterweg 4 schlägt vor, den abhängigen Spengler-Einsatz mitzuverschieben, und zeigt die Kran-Reservation desselben Tages als «umbuchen»; nichts verschiebt sich ohne Bestätigung.
  - [ ] Die Textvorlagen an Kundschaft, Gerüstbau und Kran gehen nur über das Teilen-Menü; die App sendet nichts.
  - [ ] Der Nebenwirkungs-Wächter findet keinen Netzaufruf; das Wetter trägt die Person von Hand ein ([S-15](../entscheide.md)).
  - [ ] Ein Entscheid ist eine neue Zeile im Ledger; der Verlauf zeigt, wer wann was entschieden hat.
  - [ ] Einsatzblatt und Wochenplan enthalten Adresse und Zugangshinweis ohne Code und keine Preise.

### B-6 Tagesrapport und Regie

- **Ziel:** Der Rapport ist in zwei Minuten geschrieben; Regie und Ausfall gehen nie verloren.
- **Umfang:** Tabellen `envelope_report_lines`, `envelope_report_conditions`; Steckplätze auf dem Rapport von P-25 (erledigte Mengen je Fläche oder Linie, Wetter); Regierapport mit Geräten (Kran, Aufzug); Ausfall getrennt; Textbausteine; «Wie gestern».
- **Abnahme:**
  - [ ] Demo-Tag: C. Muster 07:00 bis 16:30, Pause 60, davon 120 Minuten Ausfall Wetter ergibt 6 h 30 Arbeitszeit und 2 h Ausfall getrennt; beides landet im Zeit-Ledger von P-31.
  - [ ] Regie «Lattenersatz 1,5 h» Facharbeitende zum Testansatz 9800 Rappen ergibt 14 700 Rappen plus Material; unterschrieben ist der Regierapport gesperrt; eine Korrektur erscheint als Nachtrag mit Grund.
  - [ ] Fortschritt: 60,000 m² erledigt von 175,010 m² ergibt 3428 Basispunkte.
  - [ ] Ein Rapport für vier Personen braucht keine Tastatur ausser für Notizen; vollständig offline.

### B-7 Sicherheit in der Höhe

- **Ziel:** Vor jedem Aufstieg wird geprüft und nachgewiesen; die App beurteilt nie.
- **Umfang:** Tabelle `envelope_safety_plans`; Checklisten «Vor dem Aufstieg», «Gerüst-Sichtkontrolle», «Hitze», «PSAgA», «Tagesende Dach dicht» über P-27 mit Ergebnis «Stopp»; Stopp-Meldung; Ausbildungsnachweise; Hinweise mit Quelle aus Steckbrief 6.6 und 9; Sicherheitsplan und Stopp-Protokoll als PDF.
- **Abnahme:**
  - [ ] Sicherheitsplan Musterweg 4 (Absturzhöhe 7,500 m, 35,0 Grad, 15,8 Personenarbeitstage): Mit nur Anseilschutz erscheint vor der Freigabe der Hinweis «Anseilschutz statt Kollektivschutz nur bei Dacharbeiten von höchstens zwei Personenarbeitstagen» mit Quelle; mit Gerüst und Dachfangwand erscheint er nicht; die Freigabe bleibt möglich und braucht das Recht «Sicherheitsplan freigeben».
  - [ ] Ein freigegebener Plan ändert sich nur als neue Fassung; die alte bleibt sichtbar.
  - [ ] «Stopp» in der Prüfung vor dem Aufstieg erscheint in «Heute» bei Vorarbeit und Inhaberin; der Einsatz zeigt «gestoppt» bis «gelöst durch … am …»; nichts wird gesperrt.
  - [ ] Ist eine Lernende im Einsatz, zeigt der Einsatz den Hinweis auf ArGV 5 Art. 4.
  - [ ] Nur Hinweise, deren Fakt in Steckbrief Abschnitt 9 «geprüft am» trägt, erscheinen mit Schwelle; die übrigen erst nach deiner Prüfung.
  - [ ] Texttest mit verbotenen Wörtern («sicher» und «gesichert» als Urteil, «gefahrlos», «unbedenklich») ist grün.

### B-8 Schadstoffe und Entsorgung

- **Ziel:** Verdacht, Probe, Befund und Entsorgung sind festgehalten; Entwarnung gibt es nie ohne Befund.
- **Umfang:** Tabellen `envelope_hazard_cases` (hinter dem Port `HazardRegister`, Antrag 1), `envelope_asbestos_works`, `envelope_waste_records` (Antrag 2), `envelope_disposal_concepts`; Checkliste «Asbest»; Information an die Kundschaft und Entsorgungsnachweis als PDF.
- **Abnahme:**
  - [ ] Verdacht entsteht von selbst bei Baujahr 1974 mit Faserzement und bei leerem Baujahr mit Faserzement; nicht bei 1995 mit Faserzement und nicht bei 1974 mit Ziegeln.
  - [ ] Aufheben braucht ein Befund-Dokument oder eine Begründung und das Recht «Schadstoff-Verdacht aufheben»; ohne Recht ist die Operation abgelehnt; der Verlauf bleibt im Ledger.
  - [ ] Unerwarteter Fund erzeugt Stopp und die Meldung an die Bauherrschaft als PDF mit Verweis auf BauAV Art. 32 Abs. 3.
  - [ ] Entsorgungskonzept-Hinweis bei 220 m³; keiner bei 150 m³ ohne Schadstoffe; einer bei 150 m³ mit Verdacht; mit Option Schwelle 100 m³ auch bei 150 m³ ohne Schadstoffe.
  - [ ] Texttest: kein «asbestfrei», «unbedenklich», «Entwarnung».

### B-9 Abrechnung, Abnahme und Garantie

- **Ziel:** Die Rechnung geht am Tag der Abnahme hinaus; jede Frist hat eine Erinnerung mit Quelle.
- **Umfang:** `InvoiceSource` für P-29 nach Steckbrief 6.8 (Pauschal, Einheitspreis mit Schlussausmass, Regie, Gerüst, Akonto, Schluss); Tabellen `envelope_job_terms` (Antrag 10), `envelope_warranties`, `envelope_tightness_tests`; Fristen als Regelwerk mit Quelle für P-28; Deckungsbeitrag in «Erweitert».
- **Abnahme:**
  - [ ] Unit-Tests: Pauschal mit einem Nachtrag; Einheitspreis mit Schlussausmass und Differenz zur Offerte je Position; Regie aus zwei Regierapporten; Positionen 4 800 000 Rappen, zwei Akonto zu 1 500 000 Rappen netto: Rest 1 800 000 plus MWST 8,1 Prozent aus P-29 = 1 945 800 Rappen; Gerüst 222,000 m² × 1200 + 6 Wochen × 222,000 m² × 150 = 466 200 Rappen.
  - [ ] Die Rechnung trägt den QR-Zahlteil von P-29; die Branche baut keinen eigenen.
  - [ ] Letzter pfandberechtigter Rapport 15.6.2027: Erinnerung am 17.9.2027, Ablauf 15.10.2027; nur solange die Rechnung offen ist.
  - [ ] Abnahme 30.6.2027: Ende Verjährung 30.6.2032, Garantiekontrolle als Erinnerung am 30.3.2032; jede Frist mit Quelle und dem Satz «Im Streitfall entscheidet der Vertrag; frag deine Rechtsberatung.»; ohne Vertragsgrundlage SIA 118 erscheint keine SIA-Frist.
  - [ ] Deckungsbeitrag ist berechnet, nie gespeichert, und ohne Recht unsichtbar.

### B-10 Baustelleneinrichtung

- **Ziel:** Gerüst, Kran, Mulde und Bewilligung gehören zum Auftrag und laufen bei Verschiebung nicht weiter.
- **Umfang:** Tabellen `envelope_scaffold_orders`, `envelope_scaffold_handovers`, `envelope_crane_bookings`, `envelope_skip_orders`, `envelope_public_space_permits` (Antrag 9); Sichtkontrolle als Durchgang von P-27; Erinnerungen; Dokumente aus Steckbrief 7.
- **Abnahme:**
  - [ ] Gerüst Musterhof Haus A, 475,000 m², Aufbau 2.3.2027, Abbau 10.4.2027: 39 Tage, Standzeit 6 Wochen; mit Option «anteilig» 5,571 Wochen.
  - [ ] Das Übernahmeprotokoll mit Checkliste und Unterschrift ist danach gesperrt; eine Einschränkung erscheint auf dem Objektblatt.
  - [ ] Endet die Bewilligung am 31.3.2027 vor dem Abbau, zeigt «Heute» einen Hinweis mit Datum.
  - [ ] Eine Mulde mit Inhalt «Asbest getrennt» verweist auf einen Entsorgungsnachweis aus B-8.

### B-11 Unterhalt und Schadenfall

- **Ziel:** Wiederkehrende Kontrollen werden nie vergessen; nach einem Unwetter bleibt die Liste geordnet.
- **Umfang:** Unterhalt über Pläne von P-26 und Rechnung je Kontrollgang über P-29, Verträge über P-51 sobald da (Antrag 13); Tabellen `envelope_inspection_reports`, `envelope_damage_cases`, `envelope_damage_findings`; Tour als Reihenfolge von Hand (Antrag 12); Kontrollbericht und Schadenbericht als PDF.
- **Abnahme:**
  - [ ] Plan «Rinnenreinigung jährlich im November» für drei Häuser Musterhof erzeugt drei Einsätze im November; die Tour zeigt sie in der von Hand gesetzten Reihenfolge, ohne Kartendienst.
  - [ ] Ein Kontrollbericht mit zwei Befunden erzeugt eine Folgeofferte mit den Positionen des Befunds.
  - [ ] Drei Schadenfälle sortieren nach Dringlichkeit (Gefahr für Dritte vor undicht vor planbar), dann nach Eingang; die Notmassnahme ist ein Regierapport.
  - [ ] Versicherung steht nur als Text; die App schickt keinen Bericht selbst.

### B-12 Regelwerk und Lohnkategorie

- **Ziel:** Stunden nach drei Gesamtarbeitsverträgen sind für die Treuhand vorbereitet, ohne einen ungeprüften Lohnwert.
- **Umfang:** Regelwerke als Daten für P-31 mit Quelle, Gültigkeit und Stand: GAV Gebäudehülle, GAV Gebäudetechnik, GAV Gerüstbau, kantonaler GAV Wallis, Arbeitsgesetz allein; Tabelle `envelope_wage_classes` (Antrag 7); Erinnerung Ende Februar «Lohnanpassung per 1. März prüfen»; Monatsblatt mit Ausfall getrennt.
- **Abnahme:**
  - [ ] Regelwerk je Person: C. Muster GAV Gebäudehülle, E. Muster GAV Gebäudetechnik im selben Betrieb.
  - [ ] Branchenerfahrung seit 1.1.2026 ergibt am 1.3.2027 die Stufe «über 12 Monate»; seit 1.6.2024 «über 24 Monate».
  - [ ] Jeder Wert trägt Quelle und Prüfdatum aus Steckbrief Abschnitt 9; ein Mindestlohn ohne «geprüft am» erscheint als «Wert fehlt» mit Link, nie als Zahl.
  - [ ] Das Monatsblatt zeigt Arbeitszeit und Ausfall Wetter getrennt und geht als Datei an die Treuhand (P-31); die App sagt nie, ob ein Lohn stimmt.

## Abnahme des Auftrags

- [ ] B-1 bis B-9 erfüllt (MVP aus Steckbrief Abschnitt 12); B-10 und B-12 vor dem Pilot; B-11 danach.
- [ ] Der Demo-Betrieb «Dach und Spenglerei Muster GmbH» zeigt jeden Auftrag aus Steckbrief Abschnitt 13 in seinem Stand.
- [ ] Keine Datei ausserhalb der eigenen Pfade geändert; jeder Commit trägt die Trailer.
- [ ] Jeder Plattform-Bedarf steht in `docs/branchen/gebaeudehuelle/antraege.md`; keine eigene Fassung eines Plattform-Pakets.
- [ ] Abschnitt 9 (Spalte «Stand») und Abschnitt 16 des Steckbriefs nachgeführt.

## Testweg

- `pnpm install`, `pnpm check` bis `ALL=GREEN`, `pnpm check:industry envelope`.
- Unit-Tests für jede Rechenregel mit den Zahlen aus Steckbrief und Auftrag; Mengen in Tausendstel, Geld in Rappen, Ergebnisse als Ganzzahlen.
- E2E mit Playwright in der Ausgabe «Vor Ort» mit dem Demo-Betrieb, je Paket der Hauptablauf, in vier Ansichten (iPhone, iPad hochkant, iPad quer, Web), hell und dunkel, einmal im Offline-Modus und einmal im Gerätemodus «Equipe»; kein seitliches Scrollen, kein Feld unter 16 px, Ziele mindestens 44 px, im Gerätemodus grösser.
- Wächter für Nebenwirkungen: kein `fetch`, `WebSocket` oder `RTCPeerConnection` aus der Branche; Kamera und Teilen nur im Register.
- Vorschaubilder der neuen Seiten mit dem Vorschau-Werkzeug der Suite für Alban, vier Ansichten, hell und dunkel.
- Landen nach [`../zusammenarbeit.md`](../zusammenarbeit.md), Abschnitt 6: `git fetch`, Rebase auf `origin/main`, prüfen, `git push origin HEAD:<arbeits-branch> HEAD:main`.

## Stopp-Regeln

Anhalten und melden, wenn:

- ein Schritt Geld kosten würde (auch Lizenzen für Normen oder Ausschreibungsformate);
- Daten neu das Gerät verlassen würden (Kopplung, Päckli, Wetterprognose, Karten-App, Übersetzung, Meldung an Gemeinde, Suva, Kommission oder Versicherung), auch «nur zum Testen» ([S-06](../entscheide.md), [S-15](../entscheide.md), [S-16](../entscheide.md));
- eine Datei ausserhalb der eigenen Pfade geändert werden müsste, auch eine Kleinigkeit in `platform/`;
- eine Rechtsregel, eine Schwelle, eine Frist, ein Satz oder ein Lohnwert ohne Quelle mit «geprüft am» in die App käme;
- eine Kennung, ein Tabellenname, ein Präfix oder eine Betriebsart umbenannt werden müsste;
- ein Text beurteilen statt erinnern würde (Absturz, Gerüst, Asbest, Wetter, Lohn, Haftung, Frist im Einzelfall);
- ein Code für Tür, Alarm oder Dachausstieg gespeichert werden müsste ([S-11](../entscheide.md)) oder eine Person geortet würde;
- ein Text aus einer SIA-Norm oder einem NPK-Kapitel nötig scheint;
- eine neue Abhängigkeit nötig scheint;
- `main` nach dem Push rot ist.

## Bericht

Je Paket an Alban: was gebaut ist und wie es geprüft wurde; Vorschaubilder; neue Plattform-Anträge; Fakten, die noch «Auszug» oder «nicht bestätigt» tragen; Einträge in Schulden und Lernbuch; was nur Alban entscheiden kann (mit S-Nummer).

## Stand

offen

# Branche Umzug, Räumung, Entsorgung und Kleintransport (`moving`)

- **Rolle:** Branchen-Agent
- **Voraussetzung:** W0-01, W0-02, W0-03 und W1-00 fertig; P-21 bis P-28, P-32 und P-33 aus Welle 1 mindestens «alpha»; P-29, P-30 und P-31 aus Welle 2 mindestens «alpha»; der Kern von P-42 als «alpha» in Welle 2 (Plattform-Antrag, sonst hinter einem Port). Je Paket gilt die Tabelle unten.
- **Welle:** W2

## Ziel

Ein Umzugs-, Räumungs-, Kurier- oder Lagerbetrieb mit 1 bis 20 Personen arbeitet in der Ausgabe «Vor Ort» von der Anfrage bis zur bezahlten Rechnung auf einem Hauptgerät und ohne Netz: Besichtigung mit Umzugsgutliste, Volumen und Zeit, Offerte mit klarer Preisart, Einsatzplan mit Fahrzeugen und Halteverbot, Einsatzrapport mit Zeitstempeln, Vorschäden und Unterschrift, Rechnung mit QR-Zahlteil am selben Abend, Entsorgung am Auftrag und die Stunden der Aushilfen fertig für die Treuhand. Die Branche liegt ganz in `industries/moving/`, dockt nur über Steckplätze an ([ADR-0004](../adr/0004-andocken-einer-branche.md)) und baut nichts, was die Plattform hat oder baut.

## Lesestoff

1. `CLAUDE.md`, `AGENTS.md`, [`../zusammenarbeit.md`](../zusammenarbeit.md)
2. Steckbrief [`../branchen/umzug.md`](../branchen/umzug.md), verbindlich, ganz
3. Recherche [`../branchen/umzug-recherche.md`](../branchen/umzug-recherche.md), nicht verbindlich; für Einzelheiten (ganze Leistungsliste in 6.1, Checklisten in 6.2, Quellen in Abschnitt 8)
4. [`../plattform.md`](../plattform.md), [`../architektur.md`](../architektur.md), Abschnitte 4 bis 7
5. ADRs [0004](../adr/0004-andocken-einer-branche.md), [0005](../adr/0005-gemeinsames-datenmodell.md), [0006](../adr/0006-geraete-und-abgleich.md), [0009](../adr/0009-grundsaetze-aus-randen.md), [0010](../adr/0010-rechnungen-als-vorsystem.md), [0011](../adr/0011-oeffentliches-repo.md); offene Fragen in [`../entscheide.md`](../entscheide.md), besonders S-06, S-07, S-11, S-12, S-14, S-16, S-17
6. [`../fakten/`](../fakten/README.md) und die `api.md` jedes Plattform-Pakets, das ein Paket braucht
7. `industries/muster/` als Vorbild für Manifeste und Steckplätze
8. Nur als Muster für Texte, Screens und Lektionen: Randen (`BanioX/Randen`, nur lesen) `docs/regeln.md`, `docs/design.md`, `docs/lernbuch.md`

## Pfade

- **Schreiben:** `industries/moving/` (`core/`, `web/`, `NAMES.md`); `docs/branchen/umzug.md` (nur Abschnitt 9 «geprüft am» und Abschnitt 16 «Stand»); `docs/branchen/umzug/adr/MOV-NNNN-<titel>.md` (eigene ADRs mit Präfix `MOV`); `docs/branchen/umzug/antraege.md` (Plattform-Anträge); `docs/branchen/umzug/schulden.md`, `docs/branchen/umzug/lernbuch.md`
- **Nur lesen:** `docs/branchen/umzug-recherche.md`, `platform/`, `editions/`, `registry/`, `industries/muster/`, übriges `docs/`, `BanioX/Randen`
- **Tabu:** `platform/`, `editions/`, `registry/` (neue Kennungen als Vorschlag in `industries/moving/NAMES.md`, der Kopf trägt ein), `tools/`, Wurzel-Konfiguration, `pnpm-lock.yaml` und neue Abhängigkeiten (nur per Plattform-Antrag), andere Branchen unter `industries/` (auch `industries/facility/`: Endreinigung kommt, indem der Betrieb Facility einschaltet, nie über einen Import), `docs/` ausserhalb `docs/branchen/umzug*`, `BanioX/Randen` und `BanioX/Rettich` (nie schreiben)

## Pakete in dieser Reihenfolge

Ein Paket ist fertig, wenn seine Abnahme erfüllt ist und `pnpm check` sowie `pnpm check:industry moving` grün sind. Fehlt einem Paket ein Plattform-Paket, wartet es oder arbeitet hinter einem Port in `industries/moving/` mit einfacher Umsetzung und Plattform-Antrag ([`../zusammenarbeit.md`](../zusammenarbeit.md), Abschnitt 5). Alle Prüfbeispiele stehen im Steckbrief; gerechnet wird in Ganzzahlen (Liter, Gramm, Millimeter, Minuten, Rappen, Basispunkte), je Zeile einmal kaufmännisch gerundet.

| Paket | Braucht (Welle) |
| --- | --- |
| B-1 | W0-02, W0-03, P-21 (W1-01), P-22, P-23 (W1-02), P-24 (W1-03) |
| B-2 | P-23 (W1-02), P-25 (W1-04), P-33 (W1-06), P-10, P-11 (W0-03); P-42 Nutzvolumen und Nutzlast (Antrag, W2 «alpha») |
| B-3 | P-24, P-25, P-28 (W1-06), P-29 (W2, «alpha»), P-10 Unterschrift |
| B-4 | P-25 Einsatz (W1-04), P-27 Unterweisung (W1-05), P-28, P-42 Belegung und Ausweise (Antrag, W2 «alpha»), P-11 |
| B-5 | P-25 Rapport (W1-04), P-31 Zeit-Ledger (W2, «alpha»), P-33, P-10 |
| B-6 | P-29 (W2), P-30 (W2), P-25 |
| B-7 | P-30, P-29, P-33, P-11; Antrag Entsorgungsnachweis (P-27 oder P-41) |
| B-8 | P-31 (W2), P-28, P-30 Monatspaket |
| B-9 | P-25, P-28, P-33, P-11 |
| B-10 | P-27 (W1-05), P-23, P-33, P-11, B-7 |
| B-11 | P-42 (W3), P-41 (W3), P-28; P-40 (W3, nach S-06) |
| B-12 | P-51 (W4) für Einlagerung; P-29 Sammelrechnung für Kurier |

### B-1 Gerüst, Einrichten und Vorlagen

- **Ziel:** Die Branche erscheint in der Ausgabe «Vor Ort»; ein Betrieb richtet sich als Umzug, Räumung, Kurier oder Lager ein.
- **Umfang:** `defineIndustry` und `defineIndustryWeb` nach `industries/muster`; Betriebsarten `moving.relocation`, `moving.clearance`, `moving.courier`, `moving.storage` (mehrfach wählbar); Funktionen aus Steckbrief Abschnitt 6 im Register mit Abhängigkeiten (`moving.survey`, `moving.quoting`, `moving.dispatch`, `moving.reports`, `moving.damages`, `moving.clearout`, `moving.disposal`, `moving.labor_rules`, `moving.stored_goods`, `moving.deliveries`); Option «Möbellift» an `moving.relocation`; Fragen beim Einrichten (Abschnitt 7); Lexikon und Texte (Abschnitt 11); Rollen-Vorlagen (Abschnitt 8) auf Basis der Plattform-Vorlagen; Leistungs-Vorlage und Gegenstandskatalog ohne Ansätze und ohne Richtwerte; Checklisten-Vorlagen; Tabelle `moving_job_profiles`; Demo-Grundgerüst (Betrieb, Team, Fahrzeuge, Kundschaft aus Abschnitt 13); `NAMES.md` mit allen Kennungen.
- **Abnahme:**
  - [ ] `pnpm check:industry moving` grün; jede Kennung steht in `NAMES.md` mit Präfix `moving`; keine Funktion trägt denselben Namen wie eine Betriebsart.
  - [ ] Einrichten mit «Kurier, 1 Person» schaltet Umfang «Schlank» und `moving.deliveries` ohne `moving.survey`; «Umzug und Räumung, 8 Personen, Lastwagen 7,5 t, Möbellift, Bargeld ja» schaltet Rollen, Plan, Fahrzeugprüfungen, Unterweisung «Möbellift» und Fahrerkasse.
  - [ ] Die Leistungs-Vorlage legt alle Positionen der Recherche, Abschnitt 6.1, ohne Ansatz an; eine Position ohne Ansatz zeigt «Ansatz fehlt». Der Gegenstandskatalog hat Symbole und leere Richtwerte.
  - [ ] Eine ausgeschaltete Funktion hinterlässt keinen Einstieg; ihre Daten bleiben.
  - [ ] Texttest: «du», «ss», kein Ausrufezeichen, keine Produkt-, Fahrzeug- oder Herstellernamen.

### B-2 Besichtigung und Umzugsgutliste

- **Ziel:** Bei der Besichtigung entstehen Umzugsgutliste, Volumen und Zeit auf dem Handy, ohne Netz.
- **Umfang:** Tabellen `moving_surveys`, `moving_access`, `moving_inventory_items`, `moving_item_catalog`, `moving_estimating_values`, `moving_estimates`; Räume als Objekte der Ebene «Raum» (P-23); Erfassung mit Symbolen, Plus und Minus; Formeln aus Steckbrief 6.1; Vergleich Schätzung und Rapport; Besichtigungsprotokoll, Umzugsgutliste für die Kundschaft und Etikettenbogen als PDF.
- **Abnahme:**
  - [ ] Unit-Tests rechnen das Prüfbeispiel aus 6.1 exakt: Schrank 1200 l, Karton 96 l, V_roh 30 000 l, V 33 900 l, 1 Fahrt mit 38 000 und 16 000 l, 3 Fahrten mit 16 000 l, Laden 212 min, Entladen 170 min, Fahrt 39 min, Montage 80 min, Summe 501 min; keine Gleitkommazahl im Ergebnis.
  - [ ] Ein leerer Richtwert (etwa Stauzuschlag) zeigt «Wert fehlt» und keine Zahl; ein Gewicht über der Nutzlast zeigt eine Warnung.
  - [ ] `moving_access` hat kein Feld für einen Code; ein Texttest findet in Formularen und PDF weder «Code» als Eingabefeld noch einen Wert je Gegenstand.
  - [ ] E2E im Offline-Modus: Besichtigung mit drei Räumen, zwölf Positionen und zwei Fotos anlegen, schätzen und abschliessen.
  - [ ] Nach drei Demo-Rapporten schlägt die App neue Richtwerte vor; ohne Tipp des Betriebs ändert sich keiner.

### B-3 Offerte und Abrechnungsart

- **Ziel:** Aus der Schätzung entsteht die Offerte mit klarer Preisart, ohne Abtippen.
- **Umfang:** Tabellen `moving_pricing_terms`, `moving_quote_assumptions`; `moving.quote.fromEstimate` füllt die Offerte von P-29 mit Positionen, Annahmen und Varianten; Preisarten Pauschal, nach Aufwand, Kostendach, ungefährer Kostenansatz (Plattform-Antrag, falls P-25 oder P-29 sie nicht tragen); capMin; Nachfassen; Annahme mit Unterschrift, «per E-Mail bestätigt» oder «mündlich» mit Notiz; Auftrag mit Einsatztagen.
- **Abnahme:**
  - [ ] Die Offerte für A-2026-101 übernimmt Volumen, Personen, Fahrzeuge und Zugang aus der Schätzung ohne Eingabe.
  - [ ] capMin aus Steckbrief 6.2 exakt: 320 000 × 60 ÷ 38 000 = 505 min, abgerundet.
  - [ ] Ein ungefährer Kostenansatz mit leerer Toleranz zeigt nie einen Hinweis; mit Toleranz zeigt er ihn mit Quelle OR Art. 375 und ohne Urteil.
  - [ ] Eine ausgestellte Offerte ist gesperrt; eine Änderung ist eine neue Fassung. Die Person teilt das PDF selbst; die App verschickt nichts.
  - [ ] Die interne Kalkulation der Pauschale und die Marge sind nur mit dem Recht «Preise und Margen» sichtbar und werden nie gespeichert.

### B-4 Einsatzplan, Halteverbot und Tagesblatt

- **Ziel:** Konflikte sind vor dem Umzugstag sichtbar, und die Equipe hat ein Tagesblatt ohne Preise.
- **Umfang:** Tabellen `moving_visit_roles`, `moving_load_lists`, `moving_street_permits`, `moving_municipalities`, `moving_helper_answers`; Woche und Tag, auf dem iPad quer als Plantafel; Warnungen aus Steckbrief 6.3; Erinnerungen für Halteverbot und Kartons über P-28; Tagesblatt, Wochen- und Fahrzeugplan als PDF.
- **Abnahme:**
  - [ ] Unit-Tests je Warnung: Doppelbelegung; Lastwagen 7500 kg mit Fahrer:in nur Kategorie B; Fähigkeitsausweis am Einsatztag abgelaufen; Lastwagen an einem Sonntag und um 22:30 Uhr; Halteverbot nötig, nicht beantragt, Vorlauf unterschritten; Möbellift ohne Unterweisung. Jede Warnung lässt sich nur mit Begründung bestätigen.
  - [ ] Eine Warnung erscheint nur, wenn ihre Regel in Steckbrief Abschnitt 9 «geprüft am» trägt; sonst steht «Wert fehlt» mit Quelle. Die Kategorien nach VZV prüft der Agent zuerst im Volltext und trägt das Datum ein.
  - [ ] Das Tagesblatt enthält keine Preise, keine Werte, keine Codes; ein Test prüft das PDF.
  - [ ] Ein Halteverbot durchläuft «nötig › beantragt › bewilligt › Signale gestellt (Foto) › entfernt» als Ledger.

### B-5 Einsatzrapport und Übergabe

- **Ziel:** Der Rapport entsteht am Einsatzort mit Zeitstempeln, Vorschäden und Unterschrift, ohne Netz.
- **Umfang:** Tabellen `moving_report_stamps`, `moving_vehicle_uses`, `moving_damage_marks`, `moving_key_handovers`; Steckplätze auf dem Rapport von P-25; grosse Knöpfe je Schritt; Personen mit Haken; Zusatzleistungen als Rapportzeile «Zusatz» mit Bestätigung (Plattform-Antrag, falls P-25 sie nicht hat); Hinweis «Dach erreicht» in Minuten; Einsatzrapport und Schlüsselprotokoll als PDF.
- **Abnahme:**
  - [ ] Unit-Tests mit dem Demo-Tag aus Steckbrief 6.4: `depot_to_depot` 525 min, `site_to_site` 465 min, Arbeitszeit der Teamleitung 570 min; eine korrigierte Zeit ist eine neue Zeile mit Grund, die alte bleibt sichtbar.
  - [ ] Abschluss ohne Vorschaden-Rundgang oder ohne Unterschrift geht nur mit Begründung; ein unterschriebener Rapport ist gesperrt, eine Korrektur ist ein Nachtrag.
  - [ ] Bei 505 min zeigt das Handy «Dach erreicht» ohne Betrag.
  - [ ] Ein Schlüssel wird gezählt und mit Unterschrift übergeben; kein Feld nimmt eine Adresse am Schlüssel auf.
  - [ ] E2E im Offline-Modus: Rapport für vier Personen mit Stempeln, zwei Fotos und Unterschrift; die Stunden landen im Zeit-Ledger von P-31.

### B-6 Abrechnung und Fahrerkasse

- **Ziel:** Die Rechnung geht am Abend des Umzugstags hinaus; Bargeld ist sauber gebucht.
- **Umfang:** `InvoiceSource` für P-29 nach Steckbrief 6.2 (Pauschal, nach Aufwand, Kostendach mit Umfang, Anzahlung, Durchlaufposten, Rundung auf 5 Rappen); Barzahlung als Eintrag der Fahrerkasse (P-30) mit Barquittung (P-29); Rechnung an die Adresse nach dem Umzug (Antrag an P-22, falls nötig).
- **Abnahme:**
  - [ ] Unit-Test mit dem Prüfbeispiel aus 6.2 exakt: 245 000 + 52 500 + 35 000 = 332 500, Dach 320 000, netto 333 000, MWST 26 973 zum Testsatz, Total 359 973, auf 5 Rappen 359 975.
  - [ ] Eine Anzahlung wird in der Schlussrechnung abgezogen; eine Pauschale mit einem Nachtrag ergibt Offerttotal plus Nachtrag.
  - [ ] Die Rechnung trägt den QR-Zahlteil aus P-29; die Branche baut keinen eigenen.
  - [ ] Bargeld der Teamleitung erscheint in der Fahrerkasse und in den offenen Posten als bezahlt; ohne Recht «Kasse» sieht niemand den Kassenstand anderer.

### B-7 Entsorgung am Auftrag

- **Ziel:** Jede Gebühr hängt am Auftrag und wird weiterverrechnet, wie der Betrieb es will.
- **Umfang:** Tabellen `moving_disposal_batches`, `moving_disposal_sites`; Foto des Wiegescheins; Hinweise aus Steckbrief 6.7; Entsorgungsnachweis als PDF; Plattform-Antrag Entsorgungsnachweis (zweite Branche nach Maler).
- **Abnahme:**
  - [ ] Unit-Test mit dem Prüfbeispiel aus 6.7 exakt: Kosten 27 150, verrechnet 29 865, Ergebnis 2715; das Ergebnis ist nur mit «Preise und Margen» sichtbar.
  - [ ] Ein Wiegeschein ohne Auftrag und ein Auftrag mit Entsorgung ohne Posten erscheinen als Hinweis in «Heute»; Sonderabfall ohne Begleitschein-Nummer zeigt einen Hinweis, kein Urteil.
  - [ ] Der Entsorgungsnachweis lässt Preise auf Wunsch weg.

### B-8 Stunden der Equipe und Regelwerk

- **Ziel:** Die Stunden der Festangestellten und der Aushilfen sind aus den Rapporten fertig für die Treuhand.
- **Umfang:** Regelwerk «Arbeitsgesetz allein» mit Mindestlöhnen nach Arbeitsort, Ferienlohn und Hinweisen für Aushilfen als Daten für P-31, je mit Quelle, Gültigkeit und Stand; Tabelle `moving_time_confirmations`; Monatsblatt je Person.
- **Abnahme:**
  - [ ] Vor dem Bau liest der Agent die SECO-Liste der allgemeinverbindlichen GAV und trägt das Ergebnis in Steckbrief Abschnitt 9 ein; findet er einen GAV für diese Tätigkeiten, hält er an und meldet.
  - [ ] Jeder Wert trägt Quelle und Prüfdatum aus Abschnitt 9; Werte mit «Recherche» oder «nicht bestätigt» erscheinen als «Wert fehlt» mit Link, nie als Zahl.
  - [ ] Ferienlohn exakt: 112 000 bei 833 bp ergibt 9330.
  - [ ] Eine Aushilfe ohne Gerät bestätigt ihre Stunden mit Unterschrift auf dem Gerät der Teamleitung; die Bestätigung ist gesperrt.
  - [ ] Das Monatsblatt geht als Datei an die Treuhand (P-31); die App rechnet keinen Lohn mit Gewähr.

### B-9 Schäden und Fristen

- **Ziel:** Jeder Schaden hat Vorschaden, Fotos und Frist, ohne dass die App urteilt.
- **Umfang:** Tabellen `moving_damage_cases`, `moving_claim_deadlines`; Fall aus dem Rapport oder im Büro eröffnet; Erinnerungen über P-28; Schadenprotokoll und Meldung an die Versicherung als PDF.
- **Abnahme:**
  - [ ] Der Demo-Fall zeigt «Ablieferung am 12.03.2026, gemeldet nach 5 Tagen» mit Quelle OR Art. 452 Abs. 3; ein Texttest findet weder «Anspruch verloren» noch «berechtigt» noch «haftet».
  - [ ] Ein Personenschaden nimmt nur Art und Datum der Meldung an den Unfallversicherer auf, keine Gesundheitsangaben.
  - [ ] Schadenkosten und Schadenquote sind nur mit dem Recht «Schadenkosten» sichtbar; es gibt keine Rangliste von Personen.

### B-10 Räumung und Fundsachen

- **Ziel:** Eine Räumung hat eine vermerkte Berechtigung, ein Inventar mit Zielen und ein Fundprotokoll.
- **Umfang:** Tabellen `moving_clearout_mandates`, `moving_clearout_items`, `moving_found_items`; Checkliste Räumung mit Stopp-Meldung über P-27; Räumungsinventar, Fundprotokoll und Abgabeprotokoll als PDF; Entsorgung aus B-7.
- **Abnahme:**
  - [ ] Eine Räumung lässt sich erst planen, wenn Auftraggeber:in, Vertretung und Nachweis vermerkt sind.
  - [ ] Bargeld als Fundsache verlangt mit Option «Vier Augen» zwei Personen; jede Fundsache braucht eine Übergabe mit Unterschrift, sonst fragt «besenrein» nach.
  - [ ] Das Fundprotokoll enthält keinen Inhalt von Dokumenten; die Tabelle `moving_found_items` ist heikel und geht nie aufs Handy anderer Rollen.
  - [ ] Ein Gebäude vor 1990 (Richtwert) blendet «keine festen Bauteile entfernen» ein; «Arbeit stoppen» erzeugt die Stopp-Meldung; kein Text sagt «asbestfrei» oder «unbedenklich».

### B-11 Fahrzeuge, Mietmaterial, Mappe und Lernen (Welle 3)

- **Ziel:** Fahrzeugfristen, Mietkartons und die Mappe für das Handy der Teamleitung.
- **Umfang:** Fristen aus P-42 (Prüfung, Fähigkeitsausweis, Fahrerkarte, Fahrtschreiber-Download) als Erinnerung; Kartons als Bewegungen in P-41 (verkauft, ausgeliehen, zurück, abgeschrieben); Filter der Mappe für P-40 (eigene Einsätze des Tages, Zugangshinweis, Umzugsgutliste ohne Werte, Ladeliste, Tagesblatt), erst nach Albans JA zu S-06; Lernen aus Rapporten ausbauen.
- **Abnahme:**
  - [ ] Die Erinnerung zum Fähigkeitsausweis nutzt das Datum auf dem Ausweis; E. Muster erscheint drei Monate vorher in «Heute».
  - [ ] A-2026-102 zeigt 20 Kartons ausgeliehen, 18 zurück, 2 offen.
  - [ ] Ein Test der Mappe findet keine Preise, Löhne, Margen, Codes und keine Einsätze anderer Tage.
  - [ ] Die App wertet keine Fahrtschreiber-Daten aus und ortet niemanden.

### B-12 Einlagerung und Kurier (Welle 3 und 4)

- **Ziel:** Lagerplätze mit Monatsrechnung und Touren mit Zustellnachweis.
- **Umfang:** Einlagerung mit Tabellen `moving_storage_units`, `moving_storage_terms`, `moving_storage_moves` und Vertrag über P-51; Kurier mit `moving_deliveries`, `moving_tours`, `moving_tariff_zones` und Sammelrechnung über P-29. Vor dem Kurier klärt der Agent die Meldepflichten für Kurierdienste mit Quelle.
- **Abnahme:**
  - [ ] Erster Monat anteilig exakt: 30 000 × 21 ÷ 31 = 20 323; eine offene Lagerrechnung vor einer Auslagerung zeigt einen Hinweis, sperrt nie.
  - [ ] Kurierpreis exakt: 3500 + 1500 + 2 × 800 = 6600 bei 20 min Wartezeit; 14 Demo-Sendungen ergeben eine Sammelrechnung.
  - [ ] Ein Zustellnachweis mit Name und Unterschrift oder Foto ist gesperrt; eine fehlgeschlagene Zustellung braucht einen Grund.

## Abnahme des Auftrags

- [ ] B-1 bis B-8 erfüllt (MVP aus Steckbrief Abschnitt 12); B-9 und B-10 vor dem Pilot; B-11 in Welle 3; B-12 in Welle 3 und 4.
- [ ] Der Demo-Betrieb «Zügelei Muster GmbH» zeigt jeden Auftrag aus Steckbrief Abschnitt 13 in seinem Stand.
- [ ] Keine Datei ausserhalb der eigenen Pfade geändert; jeder Commit trägt `Order: branche-umzug` und `Role: industry:moving`.
- [ ] Jeder Plattform-Bedarf steht in `docs/branchen/umzug/antraege.md`; keine eigene Fassung eines Plattform-Pakets.
- [ ] Abschnitte 9 und 16 des Steckbriefs nachgeführt.

## Testweg

- `pnpm install`, `pnpm check` bis `ALL=GREEN`, `pnpm check:industry moving`.
- Unit-Tests für jede Rechenregel mit den Zahlen aus dem Steckbrief, in Ganzzahlen.
- E2E mit Playwright in der Ausgabe «Vor Ort» mit dem Demo-Betrieb, je Paket der Hauptablauf, in vier Ansichten (iPhone, iPad hochkant, iPad quer, Web), hell und dunkel, Besichtigung und Rapport im Offline-Modus; kein seitliches Scrollen, kein Feld unter 16 px, Ziele mindestens 44 px.
- Vorschaubilder der neuen Seiten mit dem Vorschau-Werkzeug der Suite für Alban, vier Ansichten, hell und dunkel; dazu je ein PDF von Tagesblatt, Einsatzrapport und Offerte.
- Landen nach [`../zusammenarbeit.md`](../zusammenarbeit.md), Abschnitt 6: `git fetch`, Rebase auf `origin/main`, prüfen, `git push origin HEAD:<arbeits-branch> HEAD:main`.

## Stopp-Regeln

Anhalten und melden, wenn:

- ein Schritt Geld kosten würde;
- Daten neu das Gerät verlassen würden (Kopplung, Päckli, Karten-App, Link für die Kundschaft, Übersetzung, Meldung an Gemeinde, Kanton oder Versicherung), auch «nur zum Testen» ([S-06](../entscheide.md), [S-14](../entscheide.md), [S-16](../entscheide.md));
- eine Datei ausserhalb der eigenen Pfade geändert werden müsste, auch eine Kleinigkeit in `platform/` oder `industries/facility/`;
- eine Rechtsregel, eine Frist, ein Lohnwert oder ein Steuersatz ohne Quelle mit «geprüft am» in die App käme;
- eine Kennung, ein Tabellenname, ein Präfix oder eine Betriebsart umbenannt werden müsste;
- ein Text beurteilen statt erinnern würde (Haftung, Schaden, Vertragsart, Asbest, Absturz, Lohn, Ausweis);
- ein Zugangscode, ein Wert eines Gegenstands (ausser dem deklarierten Lagerwert), eine Gesundheitsangabe oder ein Standort gespeichert würde ([S-11](../entscheide.md), [S-12](../entscheide.md));
- Verbandsbedingungen, Normtexte oder Tarife einer Gemeinde oder Annahmestelle als Vorgabe ausgeliefert würden;
- eine neue Abhängigkeit nötig scheint;
- `main` nach dem Push rot ist.

## Bericht

Je Paket an Alban: was gebaut ist und wie es geprüft wurde; Vorschaubilder; neue Plattform-Anträge; Fakten, die noch «Recherche» oder «nicht bestätigt» tragen; Einträge in Schulden und Lernbuch; was nur Alban entscheiden kann (mit S-Nummer).

## Stand

offen

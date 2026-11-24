# Branche Maler, Gipser und Innenausbau (`painting`)

- **Rolle:** Branchen-Agent
- **Voraussetzung:** W0-01, W0-02, W0-03 und W1-00 fertig; dazu je Paket die Plattform-Pakete in der Tabelle unten, mindestens mit Vertrag «alpha»
- **Welle:** W2

## Ziel

Ein Maler-, Gipser- oder Boden- und Plattenbetrieb mit 1 bis 20 Personen arbeitet in der Ausgabe «Vor Ort» von der Besichtigung bis zur bezahlten Rechnung auf einem Gerät und ohne Netz: Ausmass auf dem Handy, Offerte aus dem Ausmass, Tagesrapport mit Regie und Unterschrift, Farbbuch je Raum, Abnahmeprotokoll mit Fristen als Erinnerung und Rechnung mit QR-Zahlteil. Die Branche liegt ganz in `industries/painting/`, dockt nur über Steckplätze an ([ADR-0004](../adr/0004-andocken-einer-branche.md)) und baut nichts, was die Plattform hat oder baut.

## Lesestoff

1. `CLAUDE.md`, `AGENTS.md`, [`../zusammenarbeit.md`](../zusammenarbeit.md)
2. Steckbrief [`../branchen/maler.md`](../branchen/maler.md), verbindlich, ganz
3. Recherche [`../branchen/maler-recherche.md`](../branchen/maler-recherche.md), nicht verbindlich; für Einzelheiten (ganze Leistungsliste, Quellen in Abschnitt 8)
4. [`../plattform.md`](../plattform.md), [`../architektur.md`](../architektur.md), Abschnitte 4 bis 7
5. ADRs [0004](../adr/0004-andocken-einer-branche.md), [0005](../adr/0005-gemeinsames-datenmodell.md), [0006](../adr/0006-geraete-und-abgleich.md), [0009](../adr/0009-grundsaetze-aus-randen.md), [0010](../adr/0010-rechnungen-als-vorsystem.md), [0011](../adr/0011-oeffentliches-repo.md); offene Fragen in [`../entscheide.md`](../entscheide.md)
6. [`../fakten/`](../fakten/README.md) und die `api.md` jedes Plattform-Pakets, das ein Paket braucht
7. `industries/muster/` als Vorbild für Manifeste und Steckplätze
8. Nur als Muster für Texte, Screens und Lektionen: Randen (`BanioX/Randen`, nur lesen) `docs/regeln.md`, `docs/design.md`, `docs/lernbuch.md`

## Pfade

- **Schreiben:** `industries/painting/` (`core/`, `web/`, `NAMES.md`); `docs/branchen/maler.md` (nur Abschnitt 9 «geprüft am» und Abschnitt 16 «Stand»); `docs/branchen/maler/adr/PNT-NNNN-<titel>.md` (eigene ADRs mit Präfix `PNT`); `docs/branchen/maler/antraege.md` (Plattform-Anträge); `docs/branchen/maler/schulden.md`, `docs/branchen/maler/lernbuch.md`
- **Nur lesen:** `docs/branchen/maler-recherche.md`, `platform/`, `editions/`, `registry/`, `industries/muster/`, übriges `docs/`, `BanioX/Randen`
- **Tabu:** `platform/`, `editions/`, `registry/` (neue Kennungen als Vorschlag in `industries/painting/NAMES.md`, der Kopf trägt ein), `tools/`, Wurzel-Konfiguration, `pnpm-lock.yaml` und neue Abhängigkeiten (nur per Plattform-Antrag), andere Branchen unter `industries/`, `docs/` ausserhalb `docs/branchen/maler*`, `BanioX/Randen` und `BanioX/Rettich` (nie schreiben)

## Pakete in dieser Reihenfolge

Ein Paket ist fertig, wenn seine Abnahme erfüllt ist und `pnpm check` sowie `pnpm check:industry painting` grün sind. Fehlt einem Paket ein Plattform-Paket, wartet es oder arbeitet hinter einem Port in `industries/painting/` mit einfacher Umsetzung und Plattform-Antrag ([`../zusammenarbeit.md`](../zusammenarbeit.md), Abschnitt 5).

| Paket | Braucht (Welle) |
| --- | --- |
| B-1 | W0-02, W0-03, P-21 (W1-01), P-24 (W1-03) |
| B-2 | P-23 (W1-02), P-25 Ausmass (W1-04), P-33 (W1-06), P-10, P-11 (W0-03) |
| B-3 | P-24, P-25, P-28 (W1-06), P-29 (W2, «alpha»), P-10 Unterschrift |
| B-4 | P-25 Rapport und Nachtrag (W1-04), P-31 Zeit-Ledger (W2, «alpha»), P-33 |
| B-5 | P-23, P-33, P-10, P-11 |
| B-6 | P-25 Abnahme (W1-04), P-28 |
| B-7 | P-29 (W2), P-25, P-28 |
| B-8 | P-27 (W1-05), P-33, P-11 |
| B-9 | P-31 (W2), P-28 |
| B-10 | P-41 (W3), P-24, P-25 |

### B-1 Gerüst, Einrichten und Vorlagen

- **Ziel:** Die Branche erscheint in der Ausgabe «Vor Ort»; ein Betrieb richtet sich als Malerei, Gipserei oder Boden und Platten ein.
- **Umfang:** `defineIndustry` und `defineIndustryWeb` nach `industries/muster`; Betriebsarten `painting.painter`, `painting.plasterer`, `painting.floor_tiles` (mehrfach wählbar); Funktionen aus Steckbrief Abschnitt 6 im Register mit Abhängigkeiten; Fragen beim Einrichten (Abschnitt 7); Lexikon und Texte (Abschnitt 11); Rollen-Vorlagen (Abschnitt 8) auf Basis der Plattform-Vorlagen; Leistungs-Vorlage ohne Ansätze und Zeitwerte; Checklisten-Vorlagen; Demo-Grundgerüst (Betrieb, Team, Kundschaft, Objekte aus Abschnitt 13); `NAMES.md` mit allen Kennungen.
- **Abnahme:**
  - [ ] `pnpm check:industry painting` grün; jede Kennung steht in `NAMES.md` mit Präfix `painting`.
  - [ ] Einrichten mit «Malerei, 1 Person» schaltet Umfang «Schlank» (keine Rollen, kein Wochenplan) und Regie als Standard-Preisart; «Malerei und Gipserei, 6 Personen, Fassaden ja» schaltet Rollen, Wochenplan, Gerüst-Checkliste und Wetter im Rapport.
  - [ ] Die Leistungs-Vorlage legt alle Positionen der Recherche, Abschnitt 6.1, ohne Ansatz an; eine Position ohne Ansatz zeigt «Ansatz fehlt».
  - [ ] Eine ausgeschaltete Funktion hinterlässt keinen Einstieg; ihre Daten bleiben.
  - [ ] Texttest: «du», «ss», kein Ausrufezeichen, keine Produkt- oder Herstellernamen.

### B-2 Besichtigung und Raumbuch

- **Ziel:** Bei der Besichtigung entsteht das Ausmass auf dem Handy, ohne Netz.
- **Umfang:** Tabellen `painting_surveys`, `painting_surfaces`, `painting_openings`, `painting_hazard_flags`; Räume als Objekte der Ebene «Raum» (P-23); Mengen und Formeln im Ausmass von P-25; Formelsatz aus Steckbrief 6.1 mit Option `openingDeductionThresholdM2`; Raumvorlagen; Fotos je Raum und Bauteil; Baujahr-Hinweis; Ausmassblatt als PDF.
- **Abnahme:**
  - [ ] Unit-Tests rechnen das Prüfbeispiel aus 6.1 exakt: U 15,600 m; Wand brutto 39,000 m²; netto 35,520 m² mit Schwelle leer und 39,000 m² mit Schwelle 2,000 m²; Decke 15,120 m²; Leibung 4,000 m; Sockel 14,700 m; Fassade mit Giebel 75,000 m². Gerechnet in Millimeter-Ganzzahlen, keine Gleitkommazahl im Ergebnis.
  - [ ] Jede Menge zeigt ihre Formel mit den eingesetzten Werten.
  - [ ] E2E im Offline-Modus: Besichtigung mit zwei Räumen, Öffnungen und drei Fotos anlegen und abschliessen.
  - [ ] Baujahr 1972 oder leer: «Besichtigung abschliessen» geht erst mit Vermerk (Bericht vorhanden, Abklärung veranlasst, Kundschaft informiert); kein Text sagt «asbestfrei» oder «unbedenklich».
  - [ ] Kamera nur nach Tippen, Fallback auf Datei; beim ersten Foto der Hinweis «Fotografiere das Bauteil, nicht die Einrichtung.»; Fotos als Blob mit Prüfsumme.

### B-3 Offerte aus dem Ausmass

- **Ziel:** Aus der Besichtigung entsteht die Offerte, ohne eine Menge abzutippen.
- **Umfang:** Tabelle `painting_item_mappings`; `painting.quote.fromSurvey` füllt die Offerte von P-29 mit Positionen je Raum; Eventualpositionen und Gruppen (Plattform-Antrag, falls P-29 sie nicht hat); Preisart mit Hinweis und Quelle; Nachfassen-Erinnerung; Annahme mit Unterschrift oder «per E-Mail bestätigt».
- **Abnahme:**
  - [ ] Aus dem Wohnzimmer des Prüfbeispiels entstehen die Positionen Wand zwei Anstriche 35,520 m², Decke 15,120 m², Leibung 4,000 m, Sockel 14,700 m ohne Eingabe einer Menge.
  - [ ] Zeilentotal ganzzahlig: 35,520 m² × Testwert 1234 Rappen = 43 832 Rappen (kaufmännisch gerundet); eine Eventualposition zählt nicht zum Total.
  - [ ] Eine ausgestellte Offerte ist gesperrt; eine Änderung entsteht als neue Fassung.
  - [ ] Nach der Frist des Betriebs erscheint «Nachfassen» in «Heute»; nach Annahme verschwindet sie.
  - [ ] Das PDF nennt die Preisart; die Person teilt es selbst, die App verschickt nichts.

### B-4 Tagesrapport, Regie und Nachtrag

- **Ziel:** Der Rapport ist in zwei Minuten geschrieben, Regie wird nie vergessen.
- **Umfang:** Tabellen `painting_report_lines`, `painting_report_conditions` (Option «Fassade»); Steckplätze auf dem Rapport von P-25 (Arbeiten je Raum und Bauteil, Wetter); Regierapport als Dokument; Frage bei Regie unter Pauschal; Nachtrag mit Betrag und Unterschrift über P-25.
- **Abnahme:**
  - [ ] Demo-Tag aus Steckbrief 13: Vorarbeiter 07:00 bis 16:30, Pause 60, Reisezeit 20 ergibt 8 h 30 Arbeitszeit und 20 Minuten Reisezeit getrennt; Lernende 07:00 bis 16:00, Pause 60 ergibt 8 h.
  - [ ] «Wie gestern» übernimmt Personen und Zeiten; ein Rapport für drei Personen braucht keine Tastatur ausser für Notizen.
  - [ ] Regie steht als eigene Zeile; der Regierapport «Kellerabteil streichen, 1,5 h» wird unterschrieben, als PDF geteilt und ist danach gesperrt; eine Korrektur erscheint als Nachtrag mit Grund.
  - [ ] Regie auf einem Pauschalauftrag fragt «Ist dafür ein Nachtrag vereinbart?» und lässt beides zu.
  - [ ] Offline vollständig; die Stunden landen im Zeit-Ledger von P-31.

### B-5 Farb- und Raumbuch

- **Ziel:** Der Farbton jedes Raums ist nach Jahren auffindbar.
- **Umfang:** Tabellen `painting_finishes`, `painting_color_approvals`, `painting_leftovers`; Erfassung aus dem Rapport heraus; Musterfreigabe mit Unterschrift; Restfarbe mit Ort; Farbtonliste als PDF; bei `painting.floor_tiles` heisst das Modul «Material- und Fugenbuch».
- **Abnahme:**
  - [ ] Die Suche nach einem Farbcode findet Objekt und Raum über alle Aufträge.
  - [ ] Eine unterschriebene Musterfreigabe ist gesperrt; eine Korrektur eines Eintrags ist eine neue Zeile mit Verweis, die alte bleibt sichtbar.
  - [ ] Die Farbtonliste geht als PDF und hängt an Schlussrechnung und Garantieschein.
  - [ ] Der Demo-Garantiefall «Bad 2024» zeigt den Farbton von damals mit einem Tipp.

### B-6 Abnahme, Mängel und Garantie

- **Ziel:** Jede Abnahme hat ein Protokoll, jede Frist eine Erinnerung mit Quelle.
- **Umfang:** Tabellen `painting_job_terms`, `painting_warranty_cases`; Vertragsgrundlage am Auftrag (OR, SIA 118 wenn vereinbart); Fristen-Vorlagen als Regelwerk mit Quelle für P-28; Garantieschein mit Farbtonliste und Pflegehinweis des Betriebs.
- **Abnahme:**
  - [ ] Abnahmeprotokoll mit zwei Mängeln, Fotos, Fristen und Unterschriften; danach gesperrt; ein behobener Mangel trägt ein Nachher-Foto.
  - [ ] Nur Fristen, die in Steckbrief Abschnitt 9 «geprüft am» tragen, erscheinen mit Datum; jede mit Quelle und dem Satz «Im Streitfall entscheidet der Vertrag; frag deine Rechtsberatung.»
  - [ ] Ohne Vertragsgrundlage SIA 118 erscheint keine SIA-Frist.
  - [ ] Kosten eines Garantiefalls sind aus Rapporten der Art Garantie berechnet und nur mit Recht «Preise und Margen» sichtbar.

### B-7 Abrechnung nach Ausmass

- **Ziel:** Die Rechnung geht am Tag der Abnahme hinaus.
- **Umfang:** `InvoiceSource` für P-29 nach Steckbrief 6.6 (Pauschal, Einheitspreis mit Schlussausmass, Regie, Akonto, Schluss); Differenz-Spalte; Erinnerung Pfandrecht; Deckungsbeitrag in «Erweitert».
- **Abnahme:**
  - [ ] Unit-Tests: Pauschal mit einem Nachtrag; Einheitspreis mit Schlussausmass (Differenz Ist − Offerte je Position); Regie aus zwei Regierapporten; zwei Akonto und Schlussrechnung = Σ Positionen − Σ Akonto (netto) + MWST auf dem Rest, alles in Rappen exakt.
  - [ ] Die Rechnung trägt den QR-Zahlteil aus P-29; die Branche baut keinen eigenen.
  - [ ] Die Pfandrecht-Erinnerung erscheint 4 Wochen vor Ablauf von 4 Monaten nach dem letzten Rapport mit pfandberechtigter Arbeit, nur solange die Rechnung offen ist, und verschwindet bei Zahlung.
  - [ ] Deckungsbeitrag ist berechnet, nie gespeichert, und ohne Recht unsichtbar.

### B-8 Schadstoffe, Sicherheit und Entsorgung

- **Ziel:** Vor Arbeitsbeginn wird abgeklärt und festgehalten, nie beurteilt.
- **Umfang:** Tabellen `painting_hazard_reports`, `painting_waste_records`; Checklisten-Vorlagen und Stopp-Meldung über P-27; Meldung Arbeitsstopp an die Bauherrschaft als PDF; Unterweisungsnachweis über P-27.
- **Abnahme:**
  - [ ] Kontrollblatt vor Arbeitsbeginn als Durchgang mit Foto und Unterschrift; Absturzhöhe über 2 m und über 3 m blenden die passenden Punkte ein.
  - [ ] «Arbeit stoppen» erzeugt die Stopp-Meldung und ein PDF für die Bauherrschaft; die Arbeit geht erst mit Vermerk weiter.
  - [ ] Schadstoffbericht als PDF am Objekt; Entsorgungsnachweis mit Beleg.
  - [ ] Texttest mit einer Liste verbotener Wörter («asbestfrei», «unbedenklich», «sicher» als Urteil) ist grün.

### B-9 Regelwerk GAV und Samstagsarbeit

- **Ziel:** Stunden nach GAV sind für die Treuhand vorbereitet, Samstagsarbeit wird nie ungemeldet geplant.
- **Umfang:** Regelwerk «GAV Maler- und Gipsergewerbe 2026–2029» und «Arbeitsgesetz allein» als Daten für P-31 mit Quelle, Gültigkeit und Stand; Tabelle `painting_saturday_notices`; Erinnerung vor der Meldefrist; Monatsblatt mit Reisezeit getrennt.
- **Abnahme:**
  - [ ] Jeder Wert im Regelwerk trägt Quelle und Prüfdatum aus Steckbrief Abschnitt 9; Werte mit «nicht bestätigt» oder «Recherche» erscheinen als «Wert fehlt» mit Link, nie als Zahl.
  - [ ] Ein Einsatz an einem Samstag erzeugt am Freitag davor eine Erinnerung «Samstagsarbeit melden» vor der Frist; die Person vermerkt «gemeldet» mit Nummer; die App meldet nie selbst.
  - [ ] Das Monatsblatt zeigt Arbeitszeit und Reisezeit getrennt und geht als Datei an die Treuhand (P-31).

### B-10 Kalkulation, Material und Kennzahlen (Welle 3)

- **Ziel:** Einheitspreise aus Zeit und Material; die Nachkalkulation zeigt, ob sie stimmen.
- **Umfang:** Tabelle `painting_material_uses`; berechneter Einheitspreis; Materialbedarf einer Offerte auf Gebinde; Vorschlag des Leistungswerts aus Rapporten; Kennzahlen in «Erweitert»; Vorlagen für Boden und Platten ausbauen.
- **Abnahme:**
  - [ ] 35,520 m² × 0,150 l je m² (Testwert) × 2 Anstriche × (1 + 10 Prozent Verlust) = 11,722 l ergibt bei 5-l-Gebinden 3 Gebinde; ohne Verbrauchswert zeigt die App «Verbrauch fehlt».
  - [ ] Nach drei abgeschlossenen Aufträgen mit Rapporten schlägt die App einen Leistungswert vor; der Betrieb übernimmt ihn oder nicht.
  - [ ] Annahmequote, Tage bis zur Offerte, Regieanteil, Debitorentage und Deckungsbeitrag stehen nur in «Erweitert» und nur mit Recht.

## Abnahme des Auftrags

- [ ] B-1 bis B-7 erfüllt (MVP aus Steckbrief Abschnitt 12); B-8 und B-9 vor dem Pilot; B-10 in Welle 3.
- [ ] Der Demo-Betrieb «Malerei Muster GmbH» zeigt jeden Auftrag aus Steckbrief Abschnitt 13 in seinem Stand.
- [ ] Keine Datei ausserhalb der eigenen Pfade geändert; jeder Commit trägt `Order: branche-maler` und `Role: industry:painting`.
- [ ] Jeder Plattform-Bedarf steht in `docs/branchen/maler/antraege.md`; keine eigene Fassung eines Plattform-Pakets.
- [ ] Abschnitt 9 und 16 des Steckbriefs nachgeführt.

## Testweg

- `pnpm install`, `pnpm check` bis `ALL=GREEN`, `pnpm check:industry painting`.
- Unit-Tests für jede Rechenregel mit den Zahlen aus dem Steckbrief, in Ganzzahlen.
- E2E mit Playwright in der Ausgabe «Vor Ort» mit dem Demo-Betrieb, je Paket der Hauptablauf, in vier Ansichten (iPhone, iPad hochkant, iPad quer, Web), hell und dunkel, einmal im Offline-Modus; kein seitliches Scrollen, kein Feld unter 16 px, Ziele mindestens 44 px.
- Vorschaubilder der neuen Seiten mit dem Vorschau-Werkzeug der Suite für Alban, vier Ansichten, hell und dunkel.
- Landen nach [`../zusammenarbeit.md`](../zusammenarbeit.md), Abschnitt 6: `git fetch`, Rebase auf `origin/main`, prüfen, `git push origin HEAD:<arbeits-branch> HEAD:main`.

## Stopp-Regeln

Anhalten und melden, wenn:

- ein Schritt Geld kosten würde;
- Daten neu das Gerät verlassen würden (Kopplung, Päckli, Wetter, Karten-App, Übersetzung, Meldung an eine Plattform), auch «nur zum Testen» ([S-06](../entscheide.md), [S-15](../entscheide.md), [S-16](../entscheide.md));
- eine Datei ausserhalb der eigenen Pfade geändert werden müsste, auch eine Kleinigkeit in `platform/`;
- eine Rechtsregel, eine Frist oder ein Lohnwert ohne Quelle mit «geprüft am» in die App käme;
- eine Kennung, ein Tabellenname, ein Präfix oder eine Betriebsart umbenannt werden müsste;
- ein Text beurteilen statt erinnern würde (Asbest, Blei, Absturz, Lohn, Haftung, Frist im Einzelfall);
- ein Text aus einer SIA-Norm oder einem NPK-Kapitel nötig scheint;
- eine neue Abhängigkeit nötig scheint;
- `main` nach dem Push rot ist.

## Bericht

Je Paket an Alban: was gebaut ist und wie es geprüft wurde; Vorschaubilder; neue Plattform-Anträge; Fakten, die noch «Recherche» oder «nicht bestätigt» tragen; Einträge in Schulden und Lernbuch; was nur Alban entscheiden kann (mit S-Nummer).

## Stand

offen

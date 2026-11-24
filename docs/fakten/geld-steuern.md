# Geld, Steuern, Rechnung und Buchführung

Fakten für alle Branchen, Grundlage für P-20 bis P-30 ([`../plattform.md`](../plattform.md)) und [ADR-0010](../adr/0010-rechnungen-als-vorsystem.md).

- **Stand:** 24.11.2026, aus der Querschnitt-Recherche «Geld und Steuern»; acht folgenreiche Werte am selben Tag ein zweites Mal gegen die Quelle gehalten.
- **Kein Rechts- und kein Steuerrat.** Die App erinnert, rechnet nach offenen Regeln, dokumentiert und zeigt die Quelle. Sie beurteilt nie, ob ein Anspruch, eine Frist oder eine Steuerpflicht besteht. Vor einem Pilot prüft eine Fachperson ([S-17](../entscheide.md)).
- **Richtwert:** Was in die App kommt, heisst dort «Richtwert» und ist vom Betrieb änderbar. Was hier «nicht belegt» oder «nicht bestätigt» heisst, kommt nicht in die App.
- **Datiert:** Sätze, Grenzbeträge und Fassungen tragen «gültig ab» und, wo bekannt, «gültig bis». Der Kopf prüft sie jeden Januar und zu den Terminen in [Abschnitt 9](#9-folgen-für-die-plattform).
- **Öffentliches Repo:** Quellen von Banken, Kanzleien, Treuhand, Fachverlagen, Fachpresse und Software-Anbietern sind nicht verlinkt; vor dem Einbau gilt die amtliche Quelle oder die Herausgeberin des Standards.
- **Erreichbarkeit:** fedlex, ESTV, BJ und SIX liessen sich aus der Arbeitsumgebung nicht öffnen; belegt wurde über Suchauszüge dieser Seiten.

| Marke | Bedeutung |
| --- | --- |
| A | amtliche Quelle oder Gesetz (Bund, Kanton, Gericht, Nationalbank) |
| A* | Gesetzesartikel zitiert, Wortlaut in diesem Anlauf nicht gelesen |
| H | Herausgeberin des Standards (SIX, verlinkt) oder Finanzinstitut, das ihn umsetzt (ohne Link) |
| V | Verband, Sozialpartner, Hochschule |
| S | Sekundärquelle, nicht verlinkt; nur Hinweis, vor dem Einbau gegen A oder H prüfen |
| R | Paketregister npm |

**Spalte «geprüft am»:** «24.11.2026» heisst belegt in der Recherche (Seite oder Suchauszug); «24.11.2026, nachgeprüft» heisst ein zweites Mal gegen die Quelle gehalten und bestätigt; «nicht bestätigt» heisst, die Nachprüfung fand den Wert nicht an der Quelle.

Inhalt: [1. QR-Rechnung](#1-qr-rechnung) · [2. MWST](#2-mwst) · [3. Buchführung und Aufbewahrung](#3-buchführung-und-aufbewahrung) · [4. Offerte, Werkvertrag und Fristen](#4-offerte-werkvertrag-und-fristen) · [5. Verzug, Mahnung, Betreibung](#5-verzug-mahnung-betreibung) · [6. Zahlungen](#6-zahlungen) · [7. Digitalisierung der KMU](#7-digitalisierung-der-kmu) · [8. Quellen](#8-quellen) · [9. Folgen für die Plattform](#9-folgen-für-die-plattform)

---

## 1. QR-Rechnung

| Fakt | Wert | Quelle | geprüft am |
| --- | --- | --- | --- |
| Standard | SIX Interbank Clearing: «Swiss Implementation Guidelines QR-Rechnung» (IG) und «Style Guide QR-Rechnung» | [SIX][six-std] · [Style Guide][six-style] · H | 24.11.2026 |
| Fassung 2.3 | in Kraft seit 21.11.2025, löst 2.2 ab (eine Seite der Herausgeberin nennt den 22.11.2025) | [IG 2.3][six-ig23] · [Factsheet KMU][six-fs-kmu] · H | 24.11.2026, nachgeprüft |
| Fassung 2.4 | Dokument vom 24.02.2026, **gültig ab 14.11.2026** | [IG 2.4][six-ig24] · H | 24.11.2026, nachgeprüft |
| 2.3 neben 2.4 | bleibt **bis November 2027** gültig | [Downloadcenter][six-dl] · H | 24.11.2026, nachgeprüft |
| Inhalt von 2.4 | Änderungsverzeichnis (de): Präzisierungen in Kapitel 3.5.5 zur Verwendung alternativer Verfahren (en, fr: 3.5.4 und 3.6.2); keine technische Anpassung für CHF, vor allem für EUR von Bedeutung | [IG 2.4][six-ig24] (Suchauszug) · H, S | 24.11.2026, nachgeprüft (Kapitel nicht gelesen) |
| Nur strukturierte Adressen | seit 21.11.2025 im Swiss QR Code nur Adresstyp «S» (Strasse, Hausnummer, PLZ, Ort, Land je eigenes Feld); Typ «K» wird nicht mehr erzeugt; gilt für Empfänger und Zahlungspflichtige | [Factsheet KMU][six-fs-kmu] · H | 24.11.2026, nachgeprüft |
| Pflicht in der Adresse | Name, PLZ, Ort und Land; Strasse und Hausnummer empfohlen | H | 24.11.2026 |
| Typ «K» bei der Verarbeitung | Finanzinstitute verarbeiten ihn noch **bis 21.11.2026** (Kulanz, keine Verlängerung der Vorschrift); am Stand dieser Datei abgelaufen. Eine Sekundärquelle nennt den 30.09.2026, nicht übernommen | H | 24.11.2026, nachgeprüft |
| Hybride Adresse | nur für Zahlungsaufträge nach ISO 20022, **nicht** für die QR-Rechnung | [Factsheet ERP][six-fs-erp] · H | 24.11.2026 |
| Währung, Konto | nur CHF oder EUR; Konto in der Schweiz oder in Liechtenstein | [FAQ][six-faq] · H | 24.11.2026 |
| Zahlteil, Empfangsschein | Zahlteil A6 quer 148 × 105 mm, Empfangsschein links daneben, zusammen 210 × 105 mm unten auf A4; Perforation bei Papier | [Style Guide][six-style] · H | 24.11.2026 |
| Swiss QR Code | QR-Code mit Schweizer Kreuz in der Mitte; Daten beginnen mit «SPC», Version «0200», Schluss «EPD» | [FAQ][six-faq] · H; Kennungen: S, in der IG prüfen | 24.11.2026 |
| Pflichtfelder | Konto, Zahlbar an (Name, strukturierte Adresse), Währung; Referenz je nach Konto | [IG 2.3][six-ig23] · H | 24.11.2026 |
| Freie Felder | Betrag und Zahlbar durch dürfen leer bleiben; unstrukturierte Mitteilung (etwa Rechnungsnummer); Rechnungsinformationen nach der Syntax des Verbands Swico («//S1/…»); höchstens zwei alternative Verfahren | [IG 2.3][six-ig23] · [Alternative Verfahren][six-alt] · H | 24.11.2026 |
| QR-IBAN mit QR-Referenz (QRR) | Kontonummer, die die Bank mitteilt; Referenz 26 Ziffern plus Prüfziffer = 27 Stellen; Bank meldet Eingänge mit Referenz zurück (camt.054) | H | 24.11.2026 |
| IBAN mit Creditor Reference (SCOR) | ISO 11649: «RF», zwei Prüfziffern, alphanumerisch, auch international | H | 24.11.2026 |
| IBAN ohne Referenz (NON) | Rechnungsnummer in der Mitteilung; Abgleich von Hand | H | 24.11.2026 |
| Kombinationen | QRR **nur** mit QR-IBAN, SCOR **nur** mit IBAN; eine falsche Kombination weist die Bank zurück | H | 24.11.2026 |
| Prüfziffern | QRR «Modulo 10 rekursiv», SCOR «Modulo 97» nach ISO 7064 | S; in [IG 2.4][six-ig24] prüfen | 24.11.2026 |
| Rechnung ins E-Banking | verlangt Netzwerkpartner und Anbindung: in Stufe 1 ausgeschlossen; der Zahlteil kann im Feld «Alternative Verfahren» darauf hinweisen | [Alternative Verfahren][six-alt] · H | 24.11.2026 |

**Freie Bibliotheken als Kandidaten.** npm-Register, abgefragt am 24.11.2026. Nur Fakten, keine Wertung, keine Wahl.

| Paket | Zweck laut Beschreibung | Lizenz | Letzte Version |
| --- | --- | --- | --- |
| [`swissqrbill`][npm-swissqrbill] | QR-Rechnung als PDF (über `pdfkit`) oder SVG, Node und Browser; Texte de, en, it, fr, rm; Typen enthalten; Abhängigkeit `svg-engine` | MIT | 4.4.4 vom 03.11.2026 |
| [`@qr-bill/core`][npm-qrbill-core] | Prüfen, Swiss QR Code, Rechnung | MIT | 0.1.2 vom 24.11.2026 (angelegt 20.11.2026) |
| [`swiss-qr-bill-decoder`][npm-decoder] | QR-Rechnung aus PDF oder Bild lesen und prüfen | MIT | 1.0.0 vom 02.11.2026 |
| [`@nexys/qrbill`][npm-nexys] | Erzeugen und Prüfen | MIT | 1.2.12 vom 19.05.2022 |
| [`@zimatech/swiss-qr-bill`][npm-zimatech] | PDF oder SVG im Browser | ISC | 2.0.2 vom 26.06.2023 |
| [`qrcode`][npm-qrcode], [`qrcode-generator`][npm-qrgen], [`qr`][npm-qr] | QR-Bausteine | MIT; `qr`: MIT oder Apache-2.0 | 1.5.4 (2024); 2.0.4 (08/2025); 0.7.2 (09/2026) |
| [`pdfkit`][npm-pdfkit], [`pdf-lib`][npm-pdflib] | PDF erzeugen | MIT | 0.21.0 (11/2026); 1.17.1 (05/2022) |

Nicht aufgenommen: ein Paket, dessen Lizenz nicht abgefragt wurde, und eines mit eigener, nicht permissiver Lizenzdatei.

### Was die Plattform daraus macht

- **P-20 Betrieb:** Bankverbindung mit Kontoart (IBAN oder QR-IBAN) und daraus die erlaubte Referenzart; eine falsche Kombination lässt die App nicht zu. Adresse des Betriebs strukturiert.
- **P-22 Kundschaft:** Rechnungsadresse nur strukturiert, je Teil ein Feld; der Import aus vCard und CSV trennt die Teile und zeigt, was fehlt.
- **P-29 Rechnung:** Swiss QR Code und Zahlteil nach der geltenden IG; die **Fassung der IG ist ein Stammdatum** mit «gültig ab», nie eine Konstante. Prüfziffern von QRR, SCOR und IBAN als reine Funktionen, getestet gegen die Beispiele der IG.
- **P-11 PDF:** A4 mit Zahlteil und Empfangsschein unten, Trennlinie, Schriften selbst ausgeliefert (CSP `'self'`), Texte in der Sprache des Dokuments (P-07).
- **P-10 und P-12:** eigene Rechnung zur Kontrolle zurücklesen; eine Bibliothek nur nach `pnpm licenses:check` und ADR.
- Vor dem ersten Pilot liest der Betrieb eine Rechnung mit kleinem Betrag mit seiner Banking-App (ADR-0010).

### Nicht belegt

- Masse von QR-Code (46 × 46 mm) und Kreuz (7 × 7 mm), Höchstbetrag, Feldlängen, leeres Betragsfeld mit Eckmarken.
- Hinweis «Vor der Einzahlung abzutrennen» oder Scheren-Symbol beim Versand als PDF.
- Bereich der Institutskennung einer QR-IBAN (30000 bis 31999), Länge der SCOR (bis 25 Zeichen), Prüfziffer-Verfahren an der IG, Syntax der Rechnungsinformationen.
- Änderungen von IG 2.4 im Wortlaut.

---

## 2. MWST

### 2.1 Sätze, Abstimmung, Pflicht und Methoden

| Fakt | Wert | Quelle | geprüft am |
| --- | --- | --- | --- |
| Normalsatz | **8,1 %** seit 1.1.2024 (vorher 7,7 %): Handwerk, Reinigung, Umzug, Coiffeur, Restaurant vor Ort, Fitness | [ESTV, Sätze][estv-saetze] · [ESTV, Satzerhöhung 2024][estv-2024] · A | 24.11.2026, nachgeprüft |
| Reduzierter Satz | **2,6 %** seit 1.1.2024 (vorher 2,5 %): u. a. Nahrungsmittel auch zum Mitnehmen, alkoholfreie Getränke im Detailhandel, Bücher, Medikamente, Pflanzen | wie oben · A | 24.11.2026, nachgeprüft |
| Sondersatz Beherbergung | **3,8 %** seit 1.1.2024 (vorher 3,7 %): Übernachtung mit Frühstück; übrige Hotelleistungen zum Normalsatz; **befristet bis 31.12.2027** | [ESTV, Sätze][estv-saetze] · A | 24.11.2026, nachgeprüft (korrigiert: Befristung belegt) |
| Sondersatz nach 2027 | Vernehmlassung zur Fortführung; laut Sekundärquellen 2026 Botschaft und gegensätzliche Beschlüsse der Räte (bis 2031, bis 2035 oder Streichung); offen | [admin.ch][admin-sondersatz] · A, S | 24.11.2026 |
| Ausgenommen | ohne Steuer und ohne Vorsteuerabzug, u. a. Vermietung von Wohnraum, Heilbehandlungen, Bildung je nach Art | [MWSTG][mwstg] Art. 21 · A* | 24.11.2026 |
| Massgebender Zeitpunkt | Satz nach Datum oder Zeitraum der Leistung; ein Zeitraum über einen Satzwechsel wird aufgeteilt | [MWSTG][mwstg] · [ESTV, Satzerhöhung 2024][estv-2024] · A* | 24.11.2026 |
| **Abstimmung vom 29.11.2026** | Verfassungsänderung zur Zusatzfinanzierung der 13. AHV-Rente: Normalsatz +0,4 Prozentpunkte **von 8,1 % auf 8,5 %**; reduzierter Satz unverändert; Inkrafttreten frühestens Anfang 2028. Sondersatz bei Annahme nicht belegt. **Ausgang am Stand dieser Datei offen** | [admin.ch][admin-ahv] (Suchauszug) · [BSV][bsv-ahv] · A | 24.11.2026, nachgeprüft (korrigiert: Normalsatz vorher «nicht belegt») |
| Pflicht ab Umsatz | befreit, wer im Inland weniger als **100'000 Franken** Umsatz aus steuerbaren Leistungen im Jahr erzielt (Art. 10 Abs. 2 Bst. a); Verzicht auf die Befreiung möglich | [MWSTG][mwstg] · A | 24.11.2026 |
| Effektive Methode | Umsatzsteuer minus Vorsteuer aus Belegen; Abrechnung vierteljährlich (Art. 35 Abs. 1 Bst. a) | [MWSTG][mwstg] · A | 24.11.2026 |
| Saldosteuersatzmethode | Steuer = Bruttoumsatz inkl. MWST × bewilligter Satz; kein Vorsteuerabzug; halbjährlich (Art. 35 Abs. 1 Bst. b, Art. 37) | [MWSTG][mwstg] · [ESTV, SSS ab 2025][estv-sss] · A | 24.11.2026 |
| Grenzen der Saldosteuersatzmethode | Umsatz höchstens 5'024'000, Steuerschuld höchstens 108'000 Franken im Jahr (seit 2024). Die Nachprüfung fand die Umsatzgrenze nur in einer Sekundärquelle, die Steuerschuld gar nicht | [ESTV, Formular 2024][estv-form] · A, S | nicht bestätigt |
| Mehrere Tätigkeiten | seit 1.1.2025 mehr als zwei Saldosteuersätze; jede Tätigkeit über **10 %** des steuerbaren Umsatzes zu ihrem eigenen Satz | [ESTV, SSS ab 2025][estv-sss] · A | 24.11.2026 |
| Überprüfung der Saldosteuersätze | periodisch; per 1.1.2025 für rund 15 % der Branchen angepasst, bewilligte Sätze von Amtes wegen | [ESTV, SSS ab 2025][estv-sss] · A | 24.11.2026 |
| Wechsel der Methode | seit 2025 freiwillig auf Jahresende, Mitteilung innert 60 Tagen nach Beginn der Periode | S | 24.11.2026 |
| Jährliche Abrechnung | seit 2025 auf Antrag bis **5'005'000 Franken** Jahresumsatz, mit Akontozahlungen (effektiv drei, Saldosteuersatz eine Rate) | [ESTV, jährliche Abrechnung][estv-jahr] · A; Raten: S | 24.11.2026 |
| Frist | Abrechnung und Zahlung innert **60 Tagen** nach Ende der Periode (Art. 71, 86) | [MWSTG][mwstg] · A* | 24.11.2026 |
| Rechnung bei Saldosteuersatz | weist den gesetzlichen Satz aus, nie den Saldosteuersatz | S | 24.11.2026 |
| Teilrevision | MWSTG und MWSTV, in Kraft seit 1.1.2025 | [ESTV, Teilrevision][estv-rev] · A | 24.11.2026 |

### 2.2 Saldosteuersätze je Branche der Suite

Verordnung der ESTV, SR 641.202.62, Fassung ab 1.1.2025 ([fedlex, PDF][sss-2025]). **Nachprüfung am 24.11.2026: nicht bestätigt** (Anhang nicht erreichbar, Suche ohne Wert). «A (Auszug)» heisst Suchauszug der Verordnung, «S» nur Sekundärquellen. Kein Wert kommt in die App, bevor er im Anhang gelesen ist; bis dahin trägt der Betrieb seinen bewilligten Satz ein, wie in den Steckbriefen.

| Fakt (Branche: Tätigkeit) | Wert ab 1.1.2025 (vorher) | Quelle | geprüft am |
| --- | --- | --- | --- |
| Facility: Gebäudereinigung | 6,2 % (6,2 %) | [Verordnung][sss-2025] · [lexfind][lexfind-sss] · A (Auszug) | nicht bestätigt |
| Facility: Hauswartung | 6,2 % (6,2 %) | wie oben · A (Auszug) | nicht bestätigt |
| Maler: Malerei, Tapeziererei | 5,3 % (nicht belegt) | [Verordnung][sss-2025] · A (Auszug), S | nicht bestätigt |
| Maler: Gipserei | 5,3 % (nicht belegt) | [Verordnung][sss-2025] · A (Auszug), S | nicht bestätigt |
| Gebäudehülle: Dachdeckergeschäft, Spenglerei | 3,7 % (3,7 % seit 2024; Dach vorher 3,5 %) | S | nicht bestätigt |
| Umzug: Umzugsunternehmen | 5,3 % (nicht belegt); Gütertransport ohne Umzug nicht belegt | S | nicht bestätigt |
| Haustechnik: Elektroinstallation | 4,5 % (nicht belegt) | S | nicht bestätigt |
| Haustechnik: Sanitär, Heizung, Lüftung mit Montage | 3,7 % (3,0 %) | S | nicht bestätigt |
| Holz: Schreinerei, auch Zimmerei | 3,7 % (nicht belegt) | S | nicht bestätigt |
| Garten: Gartenbau ohne gesondert fakturierte Pflanzen | 5,3 % (4,5 %) | [Verordnung][sss-2025] · A (Auszug), S | nicht bestätigt |
| Garten: gesondert fakturierte Pflanzen | eigener, tieferer Satz; 2017: 0,6 %; ab 2025 nicht belegt | [lexfind, Fassung 2017][lexfind-2017] · A (alt) | 24.11.2026 |
| Kaminfeger | 6,2 % (eine ältere Sekundärquelle: 5,9 %) | [Verordnung][sss-2025] · A (Auszug), S | nicht bestätigt |
| Termine: Coiffeursalon | 5,3 % (nicht belegt) | S | nicht bestätigt |
| Termine: Kosmetikinstitut | 5,3 % (nicht belegt) | [Verordnung][sss-2025] · A (Auszug) | nicht bestätigt |
| Beherbergung: Hotel, Leistungen zum Sondersatz | 2,1 % (nicht belegt) | [Verordnung][sss-2025] · A (Auszug) | nicht bestätigt |
| Beherbergung: Hotel, Leistungen zum Normalsatz | 5,3 % (nicht belegt) | [Verordnung][sss-2025] · A (Auszug) | nicht bestätigt |
| Kurse, Fitness: Fitnesscenter | 5,3 % (4,5 %) | S | nicht bestätigt |
| Gastro: Restaurant, Leistungen zum Normalsatz | 5,3 % (nicht belegt) | [Verordnung][sss-2025] · A (Auszug) | nicht bestätigt |

Widersprüche aus Sekundärquellen, nicht übernommen: Coiffeur und Kosmetik 3,7 % oder 2,9 %, Restaurant 5,1 % (vor 2024).

### 2.3 Pflichtangaben auf Rechnungen

| Fakt | Wert | Quelle | geprüft am |
| --- | --- | --- | --- |
| Leistungserbringer | Name und Ort wie im Geschäftsverkehr, MWST-Nummer (CHE-…MWST) | [MWSTG][mwstg] Art. 26 · [KMU-Portal][kmu-rechnung] · A | 24.11.2026 |
| Leistungsempfänger | Name und Ort; entfällt bei Kassenzetteln bis **400 Franken** inkl. MWST (MWSTV Art. 57, über einen Gesetzesspiegel gelesen) | [MWSTG][mwstg] · [KMU-Portal][kmu-rechnung] · A | 24.11.2026 |
| Leistung | Datum oder Zeitraum; Art, Gegenstand und Umfang | [MWSTG][mwstg] Art. 26 · A | 24.11.2026 |
| Entgelt und Steuer | Entgelt, Steuersatz und Steuerbetrag; schliesst das Entgelt die Steuer ein, genügt der Satz | [MWSTG][mwstg] Art. 26 · A | 24.11.2026 |

### Was die Plattform daraus macht

- **Datierter Satzkatalog als Regelwerk** (Daten, kein Code): Kennung (`normal`, `reduced`, `accommodation`, `exempt`, `none`), Satz als Ganzzahl in Hundertstelprozent (8,1 % = 810), gültig ab, gültig bis, Quelle. Gelesen von P-24 (Satz-Kennung je Leistung, nie ein Prozentwert), P-29 und P-30.
- **P-20 Betrieb:** MWST-Art (nicht pflichtig, effektiv, Saldosteuersatz mit einem oder mehreren Sätzen je Tätigkeit), jährliche Abrechnung ja oder nein, MWST-Nummer; der Saldosteuersatz ist **ein Feld des Betriebs** aus seiner Bewilligung.
- **P-29 Rechnung:** Satz nach dem Datum der Leistung, Aufteilung über einen Wechsel; Pflichtangaben nach Art. 26 als Pflichtfelder, sobald der Betrieb steuerpflichtig ist; immer der gesetzliche Satz; Kassenzettel bis 400 Franken ohne Empfänger.
- **P-30 Belege:** MWST-Vorschau je Periode (Umsatz und Vorsteuer je Satz; bei Saldosteuersatz Umsatz je Tätigkeit) für die Treuhand, nie als Abrechnung (ADR-0010, Punkt 3 und 6).
- **P-32 Heute:** Hinweis, wenn der Umsatz der letzten zwölf Monate sich 100'000 Franken nähert (Schwelle als Richtwert) oder eine Tätigkeit 10 % übersteigt; nie eine Aussage, ob der Betrieb pflichtig ist.
- **P-28 Kalender:** Ende der Periode und Frist von 60 Tagen.
- **Rechenregeln:** MWST aus Netto = Summe netto je Satz × Satz, je Satz einmal gerundet; aus Brutto = Brutto × Satz ÷ (100 % + Satz); Saldosteuersatz = Bruttoumsatz je Tätigkeit × bewilligter Satz. Die Rundungsart ist nicht belegt und bleibt Richtwert.

### Nicht belegt

- Ausgang der Abstimmung; Sondersatz bei Annahme und nach 2027.
- Alle Saldosteuersätze in 2.2 im Anhang von SR 641.202.62; Gütertransport ohne Umzug.
- Grenzen der Saldosteuersatzmethode an der amtlichen Quelle.
- Ziffern des Abrechnungsformulars; Rundungsregeln; Wortlaut von MWSTG Art. 21, 70, 71, 86.

---

## 3. Buchführung und Aufbewahrung

| Fakt | Wert | Quelle | geprüft am |
| --- | --- | --- | --- |
| Einnahmen-Ausgaben-Rechnung | Einzelunternehmen und Personengesellschaften unter **500'000 Franken** Umsatzerlös im letzten Geschäftsjahr: nur Einnahmen, Ausgaben und Vermögenslage (OR 957 Abs. 2 Ziff. 1); Grundsätze gelten sinngemäss (Abs. 3) | [OR][or] · A, S | 24.11.2026 |
| Doppelte Buchhaltung | ab 500'000 Franken (OR 957 Abs. 1); GmbH, AG und Genossenschaft immer; freiwillig jederzeit (S) | [OR][or] · A | 24.11.2026 |
| Steuererklärung ohne Buchführungspflicht | Aufstellungen über Aktiven und Passiven, Einnahmen und Ausgaben, Privatentnahmen und -einlagen (DBG Art. 125 Abs. 2) | [Kanton Aargau, Merkblatt][ag-buchf] · A* | 24.11.2026 |
| Grundsätze (OR 957a Abs. 2) | vollständig, wahrheitsgetreu, systematisch; **Beleg für jeden Buchungsvorgang**; klar, zweckmässig, nachprüfbar | [OR][or] · A | 24.11.2026 |
| Buchungsbeleg (OR 957a Abs. 3) | Aufzeichnung auf Papier **oder elektronisch** oder in vergleichbarer Form | [OR][or] · A | 24.11.2026 |
| Währung, Sprache (OR 957a Abs. 4, 5) | Landeswährung oder wesentliche Währung; Landessprache oder Englisch | [OR][or] · A* | 24.11.2026 |
| Aufbewahrung (OR 958f Abs. 1) | Bücher, Belege, Geschäfts- und Revisionsbericht **10 Jahre** ab Ende des Geschäftsjahres | [OR][or] · A | 24.11.2026 |
| Form (OR 958f Abs. 3) | Papier, elektronisch oder vergleichbar, wenn die Übereinstimmung mit den Geschäftsvorfällen gewährleistet ist und alles jederzeit lesbar gemacht werden kann | [OR][or] · [KMU-Portal][kmu-aufbew] · A | 24.11.2026 |
| MWST | Unterlagen 10 Jahre (MWSTG Art. 70 Abs. 2); zu unbeweglichen Gegenständen 26 Jahre (Abs. 3) | [MWSTG][mwstg] · A* | 24.11.2026 |
| GeBüV Art. 2 und 3 | Unterlagen dürfen sich nicht ändern lassen, **ohne dass sich dies feststellen lässt** | [GeBüV][gebuev] · [KMU-Portal][kmu-aufbew] · A | 24.11.2026 |
| GeBüV Art. 4 bis 8 | Abläufe dokumentieren; systematisch ordnen, innert angemessener Frist einsehbar; Archiv getrennt von laufenden Daten; Zugriffe protokollieren | [GeBüV][gebuev] · A* | 24.11.2026 |
| GeBüV Art. 9 | veränderbare Träger nur, wenn technische Verfahren die Integrität sichern (etwa Signatur), der Zeitpunkt der Speicherung nachweisbar und die Abläufe dokumentiert sind | S; gegen [GeBüV][gebuev] prüfen | 24.11.2026 |
| GeBüV Art. 10 | Träger regelmässig prüfen; Migration zulässig, wenn Vollständigkeit, Richtigkeit, Verfügbarkeit und Lesbarkeit bleiben; protokollieren | S; gegen [GeBüV][gebuev] prüfen | 24.11.2026 |
| Beleg als Foto oder PDF | gesetzlich zulässig (OR 957a Abs. 3, 958f Abs. 3); laut Sekundärquellen gleiche Beweiskraft wie Papier bei der MWST, wenn die GeBüV eingehalten ist | [OR][or] · A, S | 24.11.2026 |
| Kassenbuch | täglich und chronologisch; Einträge dürfen sich nicht unbemerkt ändern lassen, frei änderbare Tabellen gelten als nicht manipulationssicher; Korrektur als Gegenbuchung; jede Bewegung mit Beleg (OR 957a) | S; Beleg: [OR][or] · A | 24.11.2026 |

### Was die Plattform daraus macht

- **P-04 Ledger:** Belege, Kassenbuch, ausgestellte Dokumente und Zahlungen nur anfügen, mit Prüfkette (jede Zeile trägt den Hash der vorherigen und der Datei); Korrektur als neue Zeile mit Grund. Das folgt dem Gedanken von GeBüV Art. 3 und 9; ob es im Einzelfall genügt, sagt die App nicht.
- **P-33 Dateien:** Foto oder PDF als Blob mit Prüfsumme und Erfassungszeit (ISO-UTC); nie überschrieben.
- **P-30 Kasse und Belege:** Kassenbuch je Kasse (Laden, Fahrzeug, Person), Tagesabschluss mit Zählung, Differenz als eigene Zeile, Saldo berechnet; ein negativer Saldo zeigt eine fehlende Buchung und wird gemeldet. Monatspaket für die Treuhand (PDF, CSV, ZIP), das die Person selbst weitergibt.
- **P-05 Sicherung:** für Belege Pflicht; Prüfkette beim Zurückholen prüfen; jede Formatumstellung protokolliert (GeBüV Art. 10); Löschsperre für Belege und ausgestellte Dokumente während 10 Jahren ab Ende des Geschäftsjahres.
- **P-21 Rechte:** Kasse, Export und Löschen sind heikel; jede Änderung ist ein Ereignis und damit nachvollziehbar.
- **Papierbelege:** Hinweis «Originale aufbewahren, bis deine Treuhand oder die ESTV etwas anderes sagt» mit Verweis auf OR 958f und GeBüV; nie die Aussage, Papier dürfe weg.
- **Herkunft:** Nummernkreise, Prüfkette und Archivformat werden nie umbenannt.

### Nicht belegt

- Vernichten des Papieroriginals nach dem Scannen (MWST-Info 16 der ESTV nicht gelesen).
- Kassensturz, negativer Kassenbestand und Schätzung durch die ESTV nach Schweizer Recht.
- Grenze von 100'000 Franken für die reine Ist-Methode (eine Sekundärquelle, nicht übernommen); Zuordnung zu einem Kontenrahmen.

---

## 4. Offerte, Werkvertrag und Fristen

| Fakt | Wert | Quelle | geprüft am |
| --- | --- | --- | --- |
| Offerte mit Frist (OR 3) | wer einen Antrag mit Annahmefrist stellt, bleibt bis zu deren Ablauf gebunden | [OR][or] · A* | 24.11.2026 |
| Werkvertrag (OR 363) | Herstellung eines Werkes gegen Vergütung: Malen, Dach decken, Installieren, Garten anlegen, Endreinigung mit geschuldetem Ergebnis | [OR][or] · A | 24.11.2026 |
| Fälligkeit (OR 372) | bei Ablieferung; Teilzahlungen, wenn vereinbart | [OR][or] · A* | 24.11.2026 |
| Preisarten (OR 373, 374) | fester Preis: Werk um diese Summe, Anpassung durch das Gericht nur bei ausserordentlichen Umständen; ohne festen Preis nach Wert der Arbeit und Aufwendungen (Grundlage der Regie); Einheitspreis nach Ausmass ist Vertragssache | [OR][or] · A* | 24.11.2026 |
| Kostenvoranschlag (OR 375) | ohne Zutun des Bestellers **unverhältnismässig überschritten**: Rücktritt, bei Bauten auf seinem Grund angemessene Herabsetzung. Eine feste Toleranz steht nicht im Gesetz | [OR][or] · A | 24.11.2026 |
| Rücktritt (OR 377) | solange das Werk unvollendet ist, gegen Vergütung und volle Schadloshaltung | [OR][or] · A* | 24.11.2026 |
| Prüfung, Rüge, Mängelrechte (OR 367, 368, 370) | prüfen und Mängel rügen, sonst gilt das Werk als genehmigt, ausser verdeckte Mängel; Wandelung, Minderung oder Nachbesserung | [OR][or] · A | 24.11.2026 |
| Verjährung (OR 371) | 2 Jahre ab Abnahme; **5 Jahre** für unbewegliche Werke und darin eingebaute bewegliche | [OR][or] · A | 24.11.2026 |
| Baumängelrecht: Inkrafttreten | Änderung von Kauf- und Werkvertragsrecht, vom Bundesrat am 30.04.2025 auf den **1.1.2026** in Kraft gesetzt | [BJ][bj-bau] (nicht erreichbar) · A; Sekundärquellen übereinstimmend · S | nicht bestätigt (amtlich) |
| Baumängelrecht: Rügefrist | bei Bauwerken **60 Tage** ab Entdeckung statt «sofort»; vertraglich nicht verkürzbar | S, übereinstimmend; im [OR][or] prüfen | nicht bestätigt (amtlich) |
| Baumängelrecht: weitere Punkte | Nachbesserung bei Bauwerken nicht abdingbar (OR 368 Abs. 2bis, beim Kauf OR 219a); 5 Jahre Verjährung nicht zum Nachteil des Bestellers verkürzbar; gilt für Verträge ab 1.1.2026 | S | 24.11.2026, nachgeprüft (sekundär) |
| SIA-Norm 118 | gilt nur, wenn vereinbart; nur genannt, nie abgeschrieben. Abnahme mit gemeinsamer Prüfung und Protokoll (Art. 157 ff.); Rügefrist **2 Jahre** ab Abnahme; Verjährung 5 Jahre (Art. 180). Die zwingenden 60 Tage gehen ungünstigeren Regeln vor; Korrektur «SIA 118-C1:2026» | [Universität Freiburg][unifr-sia] · V, S | 24.11.2026, nachgeprüft (Korrektur nicht gelesen) |
| Bauhandwerkerpfandrecht: wer | wer zu Bauten auf einem Grundstück Material und Arbeit oder Arbeit allein geliefert hat, auch Subunternehmer (ZGB 837 Abs. 1 Ziff. 3) | [ZGB][zgb] · A | 24.11.2026 |
| Bauhandwerkerpfandrecht: Frist | Eintragung **spätestens vier Monate nach Vollendung der Arbeit** (ZGB 839 Abs. 2); Verwirkung; eine vorläufige Eintragung innert der Frist wahrt sie | [Obergericht Zürich][ogzh-bhp] · [ZGB][zgb] · A | 24.11.2026, nachgeprüft |
| Bauhandwerkerpfandrecht: Beginn und Abwendung | vollendet, wenn alle Arbeiten des Vertrags abgeschlossen sind («letzter Hammerschlag»), Abgrenzung durch die Rechtsprechung; keine Eintragung bei hinreichender Sicherheit (Abs. 3). Ein älterer Bundesgerichtsentscheid nennt drei Monate (frühere Fassung, nicht geprüft) | [Obergericht Zürich][ogzh-bhp] · [ZGB][zgb] · A | 24.11.2026, nachgeprüft |
| Auftrag (OR 394, 398, 404) | Dienste gegen Vergütung, wenn verabredet oder üblich (Unterhaltsreinigung, Hauswartung, Gartenunterhalt, Kurse); geschuldet ist Sorgfalt, nicht ein Erfolg; jederzeit kündbar, zur Unzeit mit Schadenersatz | [OR][or] · A* | 24.11.2026 |

### Was die Plattform daraus macht

- **P-25 Aufträge:** Preisart (Pauschal, Einheitspreis nach Ausmass, Regie, Kostendach); **Vertragsdatum** entscheidet, welches Recht die Erinnerung zeigt (vor oder ab 1.1.2026); Vertragsgrundlage «OR» oder «SIA 118 vereinbart»; «Arbeit an einem Bauwerk» ja oder nein. Rapport und Abnahmeprotokoll mit Datum und Unterschrift sind die Anker der Fristen und danach gesperrt.
- **P-29 Offerte:** Nummer, Datum, gültig bis, Preisart, Bedingungen (Zahlungsfrist, Anzahlung, Mahngebühr, Verzugszins), Vertragsgrundlage, Annahme mit Unterschrift; ausgestellt heisst gesperrt, Änderung als Nachtrag. Beim Kostenvoranschlag «offeriert» neben «bisher angefallen» als Hinweis, nie als Urteil.
- **P-28 Kalender:** Fristen als Erinnerung mit Quelle; die App rechnet aus und zeigt, sagt aber nie, ob ein Anspruch besteht oder eine Frist gewahrt ist.

| Frist | Anker | Dauer | Stand |
| --- | --- | --- | --- |
| Mängelrüge Bauwerk (Verträge ab 1.1.2026) | Entdeckung im Mängelprotokoll | 60 Tage | S, amtlich nicht bestätigt |
| Rüge nach SIA 118, wenn vereinbart | Abnahme | 2 Jahre | S |
| Verjährung Mängelrechte | Abnahme | 2 Jahre, Bauwerk 5 Jahre | A |
| Bauhandwerkerpfandrecht | «Arbeit vollendet» im Rapport, nur Arbeit an einem Grundstück, solange die Rechnung offen ist | 4 Monate | A |
| Offerte | Ausstellung | «gültig bis» des Betriebs | A* |

### Nicht belegt

- Toleranz beim Kostenvoranschlag (oft 10 % genannt).
- Artikel der SIA 118 zu Preisarten und Regie; Wortlaut von SIA 118-C1:2026.
- Abgrenzung von Werkvertrag, Auftrag und Frachtvertrag (OR 440 ff.) bei Reinigung und Umzug.
- Neues Baumängelrecht im Wortlaut (OR 367, 368, 371, 219a ab 1.1.2026).
- Fristende an Samstag, Sonntag oder Feiertag (OR 78), Wortlaut nicht geprüft.

---

## 5. Verzug, Mahnung, Betreibung

| Fakt | Wert | Quelle | geprüft am |
| --- | --- | --- | --- |
| Verzug ohne Mahnung (OR 102 Abs. 2) | ist ein bestimmter Verfalltag vereinbart oder auf der Rechnung als festes Datum genannt, Verzug mit Ablauf dieses Tages; eine blosse Frist («30 Tage netto») genügt nach herrschender Lehre nicht | [OR][or] · A; Lehre: S | 24.11.2026 |
| Verzug durch Mahnung (OR 102 Abs. 1) | sonst erst mit der Mahnung | [OR][or] · A | 24.11.2026 |
| Verzugszins (OR 104) | **5 % pro Jahr** ab Verzug; ein höherer vereinbarter Satz geht vor | [OR][or] · A | 24.11.2026 |
| Mahngebühren | nur durchsetzbar, wenn vereinbart (etwa in den Bedingungen der Offerte) | S | 24.11.2026 |
| Anzahl Mahnungen | keine gesetzliche Zahl; üblich Erinnerung, erste und zweite Mahnung mit Hinweis auf Betreibung | [KMU-Portal][kmu-betr] · A (Praxis) | 24.11.2026 |
| Betreibungsbegehren | beim Betreibungsamt am Wohnsitz oder Sitz der Schuldnerin; Gebühr wird vorgeschossen | [KMU-Portal][kmu-betr] · A | 24.11.2026 |
| Zahlungsbefehl | **20 Tage** zum Zahlen, **10 Tage** für den Rechtsvorschlag | [Kanton Aargau][ag-schkg] · A | 24.11.2026 |
| Rechtsvorschlag, Fortsetzung | Rechtsvorschlag ohne Begründung; danach Gericht oder Rechtsöffnung (etwa mit unterschriebener Schuldanerkennung); ohne Rechtsvorschlag Pfändung, bei Eintrag im Handelsregister Konkurs | [Kanton Aargau][ag-schkg] · A | 24.11.2026 |
| Verjährung von Forderungen | allgemein 10 Jahre (OR 127); 5 Jahre u. a. für Handwerksarbeit, Kleinverkauf, ärztliche Besorgung, Gastwirtschaft (OR 128); Unterbrechung u. a. durch Schuldanerkennung oder Betreibung (OR 135) | [OR][or] · A* (Ziffern nicht gelesen) | 24.11.2026 |

### Was die Plattform daraus macht

- **P-29 Rechnung:** Fälligkeit immer als **fester Kalendertag** (`YYYY-MM-DD`, Europe/Zurich); offener Posten = Betrag − Zahlungen − Gutschriften, berechnet, nie gespeichert.
- **Mahnstufen** als Vorlage des Betriebs, Abstände als Richtwert; Mahngebühr nur, wenn sie in den Bedingungen steht.
- **Verzugszins** offen gelegt: offener Betrag × 5 % × Tage seit Verzug ÷ Tage im Jahr; Zählweise der Tage nicht belegt, als Richtwert änderbar; ein vereinbarter höherer Satz geht vor.
- **Mappe für die Betreibung** als PDF (Rechnung, Mahnungen, Zahlungsverlauf, Angaben zur Schuldnerin) mit Hinweis auf das Betreibungsamt; das Begehren stellt die Person selbst. Eine elektronische Einreichung wäre eine Anbindung und ist in Stufe 1 ausgeschlossen.
- **P-32 und P-28:** überfällige Rechnungen unter «Heute»; Erinnerung an die Verjährung offener Forderungen.
- **Anrede** in Erinnerung und Mahnung: offener Entscheid [S-07](../entscheide.md).

### Nicht belegt

- Zählweise der Tage beim Verzugszins (360 oder 365); Gebühren nach der Gebührenverordnung SchKG; Ziffern von OR 128.

---

## 6. Zahlungen

| Fakt | Wert | Quelle | geprüft am |
| --- | --- | --- | --- |
| Bargeld | Anteil an allen Transaktionen 70 % (2017), 30 % (2024) | [SNB, Zahlungsmittelumfrage 2024][snb-2024] · A (Methodik nicht gelesen) | 24.11.2026 |
| Debitkarte | bleibt das meistgenutzte Zahlungsmittel; vor Ort 2025 gegenüber 2024 wenig verändert | [SNB, 30.03.2026][snb-2026] · A | 24.11.2026 |
| Bezahl-App | die verbreitete Schweizer Bezahl-App ist die klar führende mobile Lösung und wächst; in der App heisst die Zahlart «Bezahl-App» | [ZHAW und Universität St. Gallen, Swiss Payment Monitor 2026][spm-2026] · V | 24.11.2026 |
| Quittung (OR 88) | wer bezahlt, darf eine Quittung verlangen | [OR][or] · A* | 24.11.2026 |
| Kassenzettel | bis 400 Franken ohne Empfänger (MWSTV Art. 57) | Abschnitt 2.3 · A | 24.11.2026 |
| Bankdatei | die Bank meldet Eingänge mit Referenz in einer Datei (camt.054), die die Person selbst aus dem E-Banking lädt | H; Regel der Suite: [S-08](../entscheide.md) | 24.11.2026 |

### Was die Plattform daraus macht

- **Zahlart** als Feld jeder Zahlung: bar, Karte, Bezahl-App, Überweisung mit Referenz, Überweisung ohne Referenz; keine Anbindung an Terminal oder App.
- **P-29 Zahlungseingang** von Hand, bar oder aus der Bankdatei; Zuordnung über QRR oder SCOR, sonst Vorschlag über Betrag und Rechnungsnummer, den die Person bestätigt.
- **P-30 Kasse:** Tagesabrechnung von Kartenterminal oder Bezahl-App als Foto, PDF oder Datei ist Beleg für Umsatz und Gebühren; Barzahlung unterwegs als Zeile im Kassenbuch der Person oder des Fahrzeugs, Abgabe in die Hauptkasse als eigene Buchung.
- **P-10 und P-11:** Barquittung mit Unterschrift auf dem Bildschirm, als PDF über das Teilen-Menü.

### Nicht belegt

- Schwelle für Sorgfaltspflichten bei Barzahlungen (GwG Art. 8a) und ihre Geltung für Dienstleister; Rundung auf 5 Rappen bei Bargeld; Praxis der Barzahlung bei Umzug und Räumung.

---

## 7. Digitalisierung der KMU

| Fakt | Wert | Quelle | geprüft am |
| --- | --- | --- | --- |
| Anteil KMU | 99,7 % aller Unternehmen (provisorisch) | [KMU-Studie 2024][kmu-studie] · [KMU in Zahlen][kmu-zahlen] · A | 24.11.2026 |
| Mikrounternehmen | 547'074 Unternehmen unter 10 Beschäftigten = 89,8 %, mit 25,5 % der Beschäftigten (2021); Anteil 2011 bis 2022 gestiegen | [KMU in Zahlen][kmu-zahlen] · A | 24.11.2026 |
| Website | 36 % der KMU, 33 % der Mikrounternehmen; 82 % der Bevölkerung erwarten wichtige Angaben online (Studie 2025 der Hochschule Luzern mit einem Partner) | Fachpresse · V, S | 24.11.2026 |
| Hürden | Zeitmangel der Führung und fehlendes Wissen; Digitalisierungsgrad Mikrounternehmen 63 %, Grossunternehmen 88 % (FHNW, 2018) | Fachpresse · V, S (alt) | 24.11.2026 |
| Treiber | schnellere und bessere Abläufe (82 % der KMU; Befragung der FHNW, über 2'500 Unternehmen; Jahr nicht geprüft); die Seite des Bundes stützt sich sonst auf eine SECO-Umfrage von 2018 | [KMU-Portal, Digitalisierung][kmu-digi] · A, V | 24.11.2026 |
| Externe Hilfe | Befragung von 503 Geschäftsführenden kleiner Unternehmen (2020): Treuhand und IT für viele Aufgaben beigezogen | [Kanton Zug, Beilage][zg-befr] · A (Wiedergabe) | 24.11.2026 |

### Was die Plattform daraus macht

Abgeleitet, nicht belegt: Neun von zehn Betrieben sind Mikrounternehmen, Zeit und Wissen fehlen eher als Geld, die Treuhand ist fast immer beteiligt. Darum Einrichten aus wenigen Fragen und Umfang «Schlank» (P-06), Vorlagen statt leerer Felder (P-24, P-29), Fachwort der Branche und Erklärung mit Quelle (P-07), Paket für die Treuhand statt Buchhaltung (P-30), höchstens fünf Zahlen unter «Heute» (P-32).

### Nicht belegt

- Aktuelle amtliche Zahl (2024 bis 2026) zu Hürden der Kleinstbetriebe, zu Papier bei Belegen und Rechnungen und zur Nutzung der QR-Rechnung.

---

## 8. Quellen

Amtlich: OR, ZGB, MWSTG und GeBüV auf fedlex; SR 641.202.62; ESTV, BJ, BSV, KMU-Portal, SNB, BFS, Kantone, Obergericht Zürich. Standard: SIX. Hochschulen: Universität Freiburg, ZHAW, Universität St. Gallen. Register: npm. Merkblätter von Firmen liegen in der Recherche und sind hier nicht verlinkt.

[six-std]: https://www.six-group.com/de/products-services/banking-services/payment-standardization/standards/qr-bill.html
[six-style]: https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/style-guide-qr-bill-de.pdf
[six-ig23]: https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/ig-qr-bill-v2.3-de.pdf
[six-ig24]: https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/ig-qr-bill-v2.4-de.pdf
[six-dl]: https://www.six-group.com/de/products-services/banking-services/payment-standardization/downloads-faq/download-center.html
[six-faq]: https://www.six-group.com/en/products-services/banking-services/payment-standardization/downloads-faq/faq.html
[six-fs-kmu]: https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/factsheet-qr-bill-transition-period-sme-de.pdf
[six-fs-erp]: https://six-group.com/dam/download/banking-services/standardization/qr-bill/factsheet-qr-bill-transition-period-erp-de.pdf
[six-alt]: https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/alternative-procedures-en.pdf
[npm-swissqrbill]: https://www.npmjs.com/package/swissqrbill
[npm-qrbill-core]: https://www.npmjs.com/package/@qr-bill/core
[npm-decoder]: https://www.npmjs.com/package/swiss-qr-bill-decoder
[npm-nexys]: https://www.npmjs.com/package/@nexys/qrbill
[npm-zimatech]: https://www.npmjs.com/package/@zimatech/swiss-qr-bill
[npm-qrcode]: https://www.npmjs.com/package/qrcode
[npm-qrgen]: https://www.npmjs.com/package/qrcode-generator
[npm-qr]: https://www.npmjs.com/package/qr
[npm-pdfkit]: https://www.npmjs.com/package/pdfkit
[npm-pdflib]: https://www.npmjs.com/package/pdf-lib
[estv-saetze]: https://www.estv.admin.ch/de/mwst-steuersaetze-schweiz
[estv-2024]: https://www.estv.admin.ch/dam/estv/de/dokumente/mwst/mwst-deklarationsanleitung-steuersatzerhoehung-2024-de.pdf.download.pdf/mwst-deklarationsanleitung-steuersatzerhoehung-2024-de.pdf
[admin-sondersatz]: https://www.admin.ch/de/newnsb/bLVsLrxIasazCB0djV-is
[admin-ahv]: https://www.admin.ch/de/ahv-zusatzfinanzierung
[bsv-ahv]: https://www.bsv.admin.ch/de/abstimmung-13-ahv-rente
[estv-sss]: https://www.estv.admin.ch/de/mwst-saldosteuersatzmethode-2025
[estv-form]: https://www.estv.admin.ch/dam/estv/de/dokumente/mwst/formulare/mwst-form-abr-muster-2024-1198-03-de.pdf.download.pdf/mwst-form-abr-muster-2024-1198-03-de.pdf
[estv-jahr]: https://www.estv.admin.ch/de/mwst-jaehrliche-abrechnung-2025
[estv-rev]: https://www.estv.admin.ch/de/teilrevision-mwstg-mwstv
[sss-2025]: https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2024/500/20250101/de/pdf-a/fedlex-data-admin-ch-eli-cc-2024-500-20250101-de-pdf-a.pdf
[lexfind-sss]: https://www.lexfind.ch/tolv/165182/de
[lexfind-2017]: https://www.lexfind.ch/tolv/165184/de
[kmu-rechnung]: https://www.kmu.admin.ch/dam/kmu/en/dokumente/savoir-pratique/Financement/buchfuehrung-und-rechnungsstellung.pdf.download.pdf/605-525-16_d.pdf
[ag-buchf]: https://ag.ch/media/kanton-aargau/dfr/dokumente/steuern/natuerliche-personen/merkblaetter-zu-steuern-natuerliche-personen/buchf-hrungs-und-aufbewahrungspflicht.pdf
[kmu-aufbew]: https://www.kmu.admin.ch/kmu/de/home/praktisches-wissen/finanzielles/buchhaltung-und-revision/elektronische-aufbewahrung-der-geschaeftsbuecher.html
[bj-bau]: https://www.bj.admin.ch/de/haftung-fuer-baumaengel
[unifr-sia]: https://www.unifr.ch/ius/baurecht/assets/public/uploads/BRDC_5_25_SIA.pdf
[ogzh-bhp]: https://www.gerichte-zh.ch/fileadmin/user_upload/entscheide/oeffentlich/HE200021-O2.pdf
[kmu-betr]: https://www.kmu.admin.ch/kmu/de/home/praktisches-wissen/finanzielles/buchhaltung-und-revision/was-tun-bei-drohendem-zahlungsausfall/betreibungsbegehren.html
[ag-schkg]: https://www.ag.ch/media/kanton-aargau/dgs/dokumente/gesellschaft/soziales/handbuch-soziales/kapitel-22/merkblatt-fuer-glaeubiger-schkg.pdf
[snb-2024]: https://www.snb.ch/de/the-snb/mandates-goals/cash/payment-methods-surveys/payment-methods-survey-2024
[snb-2026]: https://www.snb.ch/de/publications/communication/press-releases/2026/pre_20260330
[spm-2026]: https://www.zhaw.ch/storage/hochschule/medien/news/2026/Bericht_Swiss_Payment_Monitor_2026.pdf
[kmu-studie]: https://www.kmu.admin.ch/dam/kmu/en/dokumente/Publications/KMUStudie_2024.pdf.download.pdf/KMUStudie_2024.pdf
[kmu-zahlen]: https://www.kmu.admin.ch/kmu/de/home/praktisches-wissen/zahlen-und-fakten%20/kmu-in-zahlen/firmen-und-beschaeftigte.html
[kmu-digi]: https://www.kmu.admin.ch/kmu/de/home/fakten-trends/digitalisierung.html
[zg-befr]: https://kr-geschaefte.zug.ch/dokumente/9842/3285-1-16689_Beilage1.pdf
[or]: https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de
[zgb]: https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de
[mwstg]: https://www.fedlex.admin.ch/eli/cc/2009/615/de
[gebuev]: https://www.fedlex.admin.ch/eli/cc/2002/248/de

---

## 9. Folgen für die Plattform

- **Kataloge statt Konstanten:** MWST-Sätze, Fassung der IG QR-Rechnung, Grenzbeträge (100'000 und 500'000 Franken) und Fristen sind datierte Regelwerke mit Quelle, «gültig ab» und «gültig bis»; ein Update führt sie nach, und die App zeigt, nach welcher Fassung sie rechnet.
- **Termine der Nachprüfung:** nach dem 29.11.2026 (Ausgang der Abstimmung, Sätze ab 2028); vor dem Bau von P-29 (IG 2.4 im Wortlaut, Anhang SR 641.202.62); vor dem 31.12.2027 (Sondersatz Beherbergung); jeden Januar (Grenzbeträge).
- **P-01 Geld:** Rappen als Ganzzahl, Satz als Ganzzahl in Hundertstelprozent, Rundung als eigene Funktion mit Regel und Test; eine Rundung je Position, MWST einmal je Satz und Dokument; Rundungsart bis zur Prüfung ein Richtwert.
- **P-20 Betrieb:** Rechtsform, MWST-Art, MWST-Nummer, Saldosteuersätze je Tätigkeit aus der Bewilligung, Bankverbindung mit Kontoart, strukturierte Adresse.
- **P-22 Kundschaft:** nur strukturierte Adressen; der Import trennt und zeigt Lücken.
- **P-24 Katalog:** Satz-Kennung je Leistung und Material, nie ein Prozentwert.
- **P-25 Aufträge:** Preisart, Vertragsdatum (Recht vor oder ab 1.1.2026), Vertragsgrundlage OR oder SIA 118, «Arbeit an einem Bauwerk», «Arbeit vollendet» im Rapport; Rapport und Abnahmeprotokoll mit Unterschrift als Anker der Fristen.
- **P-28 Kalender:** Mängelrüge, SIA-Rüge, Verjährung, Bauhandwerkerpfandrecht, MWST-Abrechnung und Aufbewahrung als Erinnerung mit Quelle, nie als Aussage über einen Anspruch.
- **P-29 Offerten und Rechnungen:** Pflichtangaben nach MWSTG Art. 26, gesetzlicher Satz, Fälligkeit als fester Tag, ausgestellt heisst gesperrt (Korrektur als Gutschrift oder neue Fassung), QR-Zahlteil nach der geltenden IG mit erlaubter Kombination von Konto und Referenz, Mahnstufen, Verzugszins, Mappe für die Betreibung, Zahlungseingang von Hand, bar oder aus der Bankdatei.
- **P-30 Kasse und Belege:** Belege mit Prüfkette, Kassenbuch als Ledger mit Tagesabschluss, MWST-Vorschau je Periode, Monatspaket für die Treuhand.
- **P-04, P-05, P-33:** Prüfkette, Löschsperre während der Aufbewahrung, Sicherung als Pflicht für Belege, protokollierte Migration. Zehn Jahre Fotos sind eine Grenze des Speichers auf dem Gerät und gehören als Schuld in `docs/schulden.md`, sobald die Datei steht.
- **P-11 PDF:** Formular-Stil für Offerte, Rechnung mit Zahlteil, Gutschrift, Erinnerung, Mahnung, Quittung, Kassen-Tagesabschluss, Abnahmeprotokoll und Mappe für die Betreibung.
- **Grenzen der Stufe 1:** keine Rechnung ins E-Banking, keine Einreichung bei der ESTV, keine Schnittstelle zur Bank, keine elektronische Betreibung, kein Zahlungsterminal. Eine Bankdatei, die die Person selbst lädt, darf gelesen werden ([S-08](../entscheide.md)).
- **Kein Steuer- und kein Rechtsrat:** Die App wählt weder Methode noch Satz, erstellt keine MWST-Abrechnung und sagt nie, ob Papierbelege weg dürfen.
- **Offene Entscheide:**
  - ADR des Kopfs: Bibliothek für den Swiss QR Code übernehmen oder aus einem QR-Baustein selbst bauen (Kandidaten in Abschnitt 1).
  - ADR: Bankdatei (camt.054 und camt.053) in Stufe 1 lesen, gestützt auf S-08 und ADR-0010.
  - ADR, vorsichtig: Hinweis zu Papierbelegen nur als Verweis oder als Prüfliste nach GeBüV.
  - Alban: Einnahmen-Ausgaben-Rechnung für Einzelunternehmen unter 500'000 Franken, also mehr als Vorsystem (Abweichung von ADR-0010, Punkt 6).
  - Alban: Anrede in Dokumenten an Dritte ([S-07](../entscheide.md)).
- **Vor dem Einbau lesen:** jede Zeile mit «S», «A*», «Auszug» oder «nicht bestätigt», sobald fedlex, ESTV, BJ und SIX erreichbar sind; vor dem Pilot prüft eine Fachperson ([S-17](../entscheide.md)).

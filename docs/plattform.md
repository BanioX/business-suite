# Plattform-Module

Katalog aller gemeinsamen Pakete der Suite: was jedes tut, woher es kommt, wer es braucht und in welcher Welle es entsteht. Jede Branche baut auf diesem Katalog; was hier fehlt und zwei Branchen brauchen, kommt als Plattform-Antrag hierher ([`zusammenarbeit.md`](zusammenarbeit.md)). Stand 24.11.2026.

**Herkunft:** «Randen gebaut» heisst, der Code liegt in `BanioX/Randen` und wird mit Herkunftsvermerk übernommen (Pfade in [`hintergrund/plattform-karte.md`](hintergrund/plattform-karte.md)). «Randen AP-n» heisst, Randen baut es gerade nach seinem Masterplan, plattformfähig nach [`randen.md`](randen.md), und die Suite übernimmt es einmal. «Neu» entsteht direkt in der Suite.

**Wellen** wie im [Fahrplan](fahrplan.md): W0 Fundament, W1 Auftragskern, W2 Geld und Papier, W3 Team im Feld, W4 Termine und Kurse, W5 Haus, W7 Stufe 2.

## Übersicht: welche Branche braucht was

M = Muss für das MVP der Branche, S = Soll, K = Kann, – = nicht nötig. Quelle: Steckbriefe der Branchen ([`branchen/`](branchen/README.md)), Abschnitt 5; Gastro, Beherbergung und Termine aus der Recherche. Stand 24.11.2026.

| Modul | Gastro | Facility | Maler | Gebäudehülle | Umzug | Haustechnik, Holz | Garten, Kaminfeger | Beherbergung | Termine | Kurse, Fitness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P-20 Betrieb und Personen | M | M | M | M | M | M | M | M | M | M |
| P-21 Rollen und Rechte | M | M | M | M | M | M | M | M | M | M |
| P-22 Kundschaft | K | M | M | M | M | M | M | S | M | M |
| P-23 Objekte und Standorte | – | M | M | M | M | M | M | M | – | K |
| P-24 Leistungen und Material | – | M | M | M | M | M | M | K | S | M |
| P-25 Aufträge, Einsätze, Rapporte | K | M | M | M | M | M | M | S | – | – |
| P-26 Pläne und Wiederkehr | S | M | K | S | – | M | M | M | – | K |
| P-27 Checklisten und Nachweise | M | M | S | M | M | M | M | M | S | M |
| P-28 Kalender und Erinnerungen | M | M | M | M | M | M | M | M | M | M |
| P-29 Offerten und Rechnungen | K | M | M | M | M | M | M | S | S | M |
| P-30 Kasse und Belege | M | S | S | S | M | S | S | M | M | M |
| P-31 Team und Zeit | M | M | M | M | M | M | M | M | S | M |
| P-32 Heute | M | M | M | M | M | M | M | M | M | M |
| P-33 Fotos und Dateien | M | M | M | M | M | M | M | S | S | S |
| P-40 Kopplung und Abgleich | S | S | S | M | S | S | S | M | S | S |
| P-41 Material und Lager | M | S | S | S | S | M | S | S | S | S |
| P-42 Fahrzeuge und Geräte | K | K | K | S | M | S | S | K | – | S |
| P-50 Termine | – | K | K | K | K | S | K | K | M | M |
| P-51 Verträge und Mitgliedschaften | – | M | – | S | K | M | M | – | K | M |
| P-52 Kurse mit Plätzen | – | – | – | – | – | – | – | – | K | M |

Die Tabelle ist die Grundlage für die Reihenfolge: Was fast jede Spalte als M hat, kommt zuerst.

## Fundament (Welle 0)

Ohne diese Pakete beginnt keine Branche. Grösstenteils in Randen gebaut und branchenneutral; die Arbeit ist Herauslösen, Umbenennen ins Neutrale und Zusammensetzen statt Aufzählen.

| ID | Paket | Inhalt | Herkunft | Was neu ist |
| --- | --- | --- | --- | --- |
| P-01 | `@onestrand/core` | IDs (UUIDv7), Geld in Rappen, Währung, Kalendertag Zürich, Zahlen lesen und zeigen, Feld-Schemas, **Register der Einheiten** | Randen gebaut (`ids`, `money`, `currency`, `dates`, `format`, `model/primitives`) | Einheiten h, min, m, m², m³, km, Stk., pauschal neben g, ml; Temperatur und Datumsart bleiben Gastro |
| P-02 | `@onestrand/contract` | Operation, Befehl, Abfrage, Ereignis, Fehler, Befehls-Kit mit `commandId` und Transaktion, JSON Schema, **`composeContract`** aus Manifesten, `access` an jeder Operation | Randen gebaut (`contract/`, `application/command.ts`) | Zusammensetzen statt fester Liste `CONTRACT_V1`; Fehlercodes neutral |
| P-03 | `@onestrand/storage`, `@onestrand/web-data` | Ports (Uhr, IDs, Speicher, Hasher), **Tabellen-Register**, Speicher im Arbeitsspeicher, IndexedDB aus dem Register, Schema-Ledger je Datenbank, Migrationen je Modul, Start, **mehrere Betriebe je Gerät**, Dateien als Blob | Randen gebaut (`ports/`, `apps/web/src/data/`) | Tabellen melden sich an statt fester `TABLE_SCHEMAS`; Datenbankname und Präfix als Parameter der Ausgabe |
| P-04 | `@onestrand/ledger` | Helfer «nur anfügen» mit Prüfkette, Korrektur als neue Zeile, Eigenschaftstests | Muster aus Randen (`createStockLedger`, ADR-0007, 0023, 0029) | ein Kit für Zeit, Kasse, Status, Schlüssel, Mehrfachkarten |
| P-05 | Sicherung (in `storage`) | Format je Ausgabe, Verschlüsselung mit Passwort, Prüfung beim Zurückholen, alte Fassungen lesbar, locker lesen | Randen gebaut (`modules/settings`, `backup-crypto.ts`) | Format aus dem Tabellen-Register; Test gegen eingefrorene Sicherungen |
| P-06 | `@onestrand/features` | Register der Branchen, Module, Funktionen und Optionen, Umfang, Abhängigkeiten über alle Stufen, Einrichten aus Fragen, Gerätemodus-Register, Feld `availability` (heute immer verfügbar) | Randen AP-1 (ADR-0022) | Branche als Ebene über dem Modul; Einträge kommen aus den Manifesten |
| P-07 | `@onestrand/i18n` | typisierte Kataloge je Sprache, Rückfall auf de-CH, Regeln je Sprache (du, ss), Lexikon der Branche (Objekt heisst Liegenschaft, Baustelle, Zimmer), Sprache der Dokumente | neu (Randen hat nur de-CH) | ganz neu, ab dem ersten Tag |
| P-08 | `@onestrand/ui` | UI-Kit, Diagramme, semantische Farb-Tokens (`accent` statt `wine`), Marke als Thema der Ausgabe, Kontrastprüfung | Randen gebaut (`apps/web/src/ui`, 47 Dateien) | neutrale Namen; Gastro-Bausteine (Allergene, Temperatur) bleiben in Gastro |
| P-09 | `@onestrand/shell` | Rahmen für iPhone, iPad und Web, Navigation und Routen aus Steckplätzen, Arbeitsplatz je Rolle, Hooks (`useQuery`, `useCommand`, `useFeature`, `useRight`, `useDetailed`), Gerätemodus, Seiten Betrieb, Funktionen, Team, Daten, Über, Lizenzen von Drittanbietern | Randen gebaut (`apps/web/src/app`) | aus Steckplätzen zusammengesetzt statt fester Listen |
| P-10 | `@onestrand/web-device` | Teilen, Drucken, Kamera mit Fallback, Fotos verkleinern, QR und Strichcode lesen, **Unterschrift auf dem Gerät**, WebCrypto, Wake Lock, Zahl am App-Symbol, App-Sperre mit Face ID | Randen gebaut (Teilen, Drucken), Rettich gebaut (Scanner, App-Sperre, Badge) | Unterschrift neu |
| P-11 | `@onestrand/pdf` | PDF-Kit mit Thema, **Dokument-Ansicht** vor dem Drucken, Stile Übersicht, Streifen und Formular, **Briefkopf mit Logo**, Dokument-Sprache | Randen gebaut (`ui/pdf`), Randen AP-15 (ADR-0026), Rettich (pdf.js-Ansicht) | Briefkopf, Formular-Stil für Offerte und Rechnung |
| P-12 | `@onestrand/tooling` | `pnpm check` mit `ALL=`, Lizenzen, Kontrast, Vorschaubilder, Wächter (öffentliches Repo, Nebenwirkungen, Sicherheit, Kopfzeilen), **Pfad-Eigentum**, **Namensregister**, **Stempel** für Kopien, Generator für neue Branchen | Randen gebaut (`scripts/`), Rettich (Wächter für private Ideen, Release) | Eigentum, Namen, Stempel, Generator |
| P-13 | `@onestrand/testing`, `@onestrand/demo-kit` | feste Uhr, fortlaufende IDs, schlanker Seed (Betrieb, zwei Personen), Fabriken für Sprach-, Nebenwirkungs- und Sicherheitstests, Demo-Bausteine | Randen gebaut (`testing/`, `modules/demo`) | ohne Testküche |

## Rückgrat der Betriebe (Welle 1 bis 3)

| ID | Paket | Inhalt | Herkunft | Welle |
| --- | --- | --- | --- | --- |
| P-20 | `@onestrand/business` | Betrieb mit Branchen, Kanton, MWST-Art (effektiv oder Saldosteuersatz), Briefkopf, Logo, Bankverbindung für den QR-Zahlteil; Person mit Minimum nach DSG | Randen gebaut (`model/business.ts`), neutral gemacht | W0 |
| P-21 | `@onestrand/access` | Rechte nach W16: je Funktion nichts, sehen, bedienen, verwalten; heikle Rechte (Löhne, Zahlen und Margen, Kasse, Zeit anderer korrigieren, Personen und Rollen, Einstellungen, Export und Löschen, **Gesundheitsdaten**, **Zugangshinweise**); Vorlagen; Weitergabe-Regeln; Hülle um Use Cases; Filter beim Senden an fremde Geräte | Randen AP-2 | W1 |
| P-22 | `@onestrand/customers` | Kundschaft: privat, Firma, Verwaltung, öffentlich; Kontakte; Rechnungsadresse; Sprache der Dokumente; Import aus vCard und CSV | neu | W1 |
| P-23 | `@onestrand/sites` | Objekte hierarchisch (Liegenschaft › Wohnung › Raum, Hotel › Etage › Zimmer, Garten, Dach); Bereiche und Flächen; Anlagen beim Objekt (Heizung, Lift, Feuerung) mit Intervallen; Zugangshinweise (heikel, nie Codes); Fotos «Wo ist was?»; QR-Etikett am Objekt | neu, Muster aus Randen «Wo ist was?» | W1 |
| P-24 | `@onestrand/catalog` | Leistungen und Material mit Einheit, Ansatz in Rappen, Leistungswert als Richtwert, MWST-Satz; eigene Vorlagen in eigenen Worten (keine lizenzierten Normtexte) | neu | W1 |
| P-25 | `@onestrand/jobs` | Auftrag (Anfrage, Besichtigung, Offerte, erteilt, geplant, ausgeführt, abgenommen, verrechnet; als Ledger), Preisart (Pauschal, Einheitspreis nach Ausmass, Regie, Kostendach); **Ausmass** (Räume, Flächen, Längen, Stück mit sichtbaren Formeln); Einsatz (wer, wann, wo, Schritte); Rapport (Stunden, Reisezeit, Material, Fotos, Regie getrennt, Unterschrift, danach gesperrt); Nachtrag; Abnahme mit Mängeln und Fristen | neu | W1 |
| P-26 | `@onestrand/plans` | Leistungspläne und Wiederkehr: Leistungsverzeichnis mit Intervallen je Objekt, Rhythmus (täglich, wöchentlich, n pro Monat, quartalsweise, jährlich), **Saisonfenster** (Garten, Winterdienst, Kaminfeger), Verschieben bei Wetter, erzeugt Einsätze, Soll-Zeit, Liste «fällig», Aushang als PDF | neu, Muster aus Randens Reinigungsplan | W1 |
| P-27 | `@onestrand/checks` | Checklisten und Nachweise: Vorlage, Wiederkehr, Durchgang mit Nachweis (abgehakt, Foto, Messwert mit Grenzen, Unterschrift), Übergabe, Schulungs- und Unterweisungsnachweise, Stopp-Meldung, Bericht | Randen gebaut (Selbstkontrolle), Randen AP-7 | W1 |
| P-28 | `@onestrand/calendar` | Betriebskalender, Saison, Feiertage je Kanton, Abwesenheiten, Erinnerungen ohne Server (Liste, Kalenderdatei, Zahl am Symbol), Fristen | Randen AP-8, AP-17; Rettich (Kalenderdatei) | W1 |
| P-29 | `@onestrand/invoicing` | Offerte und Rechnung: Nummernkreis auf einem Gerät, Positionen aus Katalog, Ausmass, Rapport oder Vertrag; MWST je Satz nach dem Datum der Leistung aus einem **datierten Katalog der Sätze** (nie als Konstante; Abstimmung vom 29.11.2026 beachten); Saldosteuersatz als Feld des Betriebs, Katalogwert nur als Richtwert; Pflichtangaben nach MWSTG; Akonto und Schlussrechnung; **QR-Zahlteil** nach den Swiss Implementation Guidelines (seit November 2025 nur strukturierte Adressen); Gutschrift; offene Posten berechnet; Erinnerung, Mahnstufen, Verzugszins als Richtwert, Mappe für die Betreibung als PDF; Zahlungseingang von Hand, bar oder **aus einer Bankdatei** (camt.054) mit Referenz; Barquittung mit Unterschrift | neu ([`fakten/geld-steuern.md`](fakten/geld-steuern.md)) | W2 |
| P-30 | `@onestrand/books` | Kassenbuch und Tagesabschluss, Belege per Foto mit Texterkennung auf dem Gerät, Ausgaben, MWST-Vorschau, **Monatspaket für die Treuhand** (PDF, CSV, Belege als ZIP), Fahrer- und Equipenkasse; Verkauf an der Theke als Option | Randen AP-16 (ADR-0029), Rettich (Texterkennung) | W2 |
| P-31 | `@onestrand/team-time` | Personenakte mit Minimum (Pensum, Lohnart, Regelwerk je Person, normaler Arbeitsweg, Sprache, Ausweis mit Ablauf), **Equipen**; Zeit-Ledger mit Arten (Arbeit, Pause, Pikett, Weg «ab Magazin» oder «direkt», Ausgleich, Abwesenheit); Erfassungsmodus je Person (vollständig, vereinfacht, Verzicht nur mit GAV); Stempeln (Gerät des Betriebs, eigenes Handy als Option, **QR am Objekt statt Standort**, nie Ortung); Einsatz- und Dienstplan; Saldi und Warnungen berechnet (Höchstarbeitszeit, Ruhezeit, Pikett, Nacht); Monatsblatt zum Unterschreiben; **Lohn-Vorbereitung** mit Regelwerken und Jahrespaketen der Sozialversicherungen als Daten mit Quelle; **Kontrollpaket** je Person und Zeitraum für Arbeitsinspektorat und paritätische Kommission | Randen AP-3 bis AP-6 (ADR-0023, ADR-0030); [`fakten/arbeit-personal.md`](fakten/arbeit-personal.md) | W2 |
| P-32 | `@onestrand/today` | Startseite «Heute» aus Steckplätzen: Einsätze, fällige Aufgaben, offene Rechnungen, Fristen, Erinnerungen, «Wie steht es» mit höchstens fünf Zahlen | Randen gebaut (Cockpit) | W1 |
| P-33 | `@onestrand/files` | Fotos und Dateien: Blob mit Prüfsumme, Vorher und Nachher, Datum, Ort als Text; ZIP, CSV, ICS | Randen AP-16 (Blob), Rettich (CSV, ICS) | W0 |

## Aussendienst und Geräte (Welle 3)

| ID | Paket | Inhalt | Herkunft |
| --- | --- | --- | --- |
| P-40 | `@onestrand/pairing`, `services/vermittler` | Kopplung per QR, Vermittler nur für den Handschlag, **Mappe runter, Befehle rauf**, Transport als Port (WLAN, verschlüsselte Datei, später Relais), Profil mit Ablauf, Sperrliste, Filter nach Rolle. Ausweitung über Bons hinaus nur nach Albans JA ([S-06](entscheide.md)) | Randen AP-19, W14, W15 (ADR-0028) |
| P-41 | `@onestrand/stock` | Material und Lager ohne Lebensmittel-Felder: Artikel, Lagerort (auch Fahrzeug), Bewegungen als Ledger, Mindestbestand, Verbrauch aus Rapport, Weiterverrechnung | Muster aus Randen (`createStockLedger`) |
| P-42 | `@onestrand/assets` (Kern in W2) | Fahrzeuge und Geräte: Fristen (Prüfung, Service, Versicherung), Ausweise der Personen je Fahrzeugklasse, Belegung im Einsatzplan, Geräte-Kontrollen; Maschinen im Garten, Möbellift, Leiter, Gerüst | neu |

## Termine und Kurse (Welle 4)

| ID | Paket | Inhalt | Herkunft |
| --- | --- | --- | --- |
| P-50 | `@onestrand/scheduling` | Termine mit Ressourcen (Person, Raum, Stuhl, Fahrzeug), Dauer je Leistung, Pausen, Erinnerung zum Weitergeben, Ausfall und Verschieben | neu |
| P-51 | `@onestrand/contracts` (Kern in W2) | **Verträge und Mitgliedschaften** (in der App nie «Abo»), für jede Branche: Laufzeit, Verlängerung, Kündigungsfrist, Pause, Preisänderung, erzeugt wiederkehrende Rechnungen (Hauswartung pauschal, Wartungsvertrag, Gartenpflege, Mitgliedschaft) und Einsätze; **Mehrfachkarten und Wertgutscheine** als Ledger (Restguthaben berechnet) | neu |
| P-52 | `@onestrand/classes` | Kurse mit Plätzen (Paketname `classes`, damit er nicht mit der Branche `courses` kollidiert): Kursreihen und Lektionen, Kapazität, Warteliste, Nachrücken, Anwesenheit, Auslastung, Semester | neu |
| P-53 | `@onestrand/intake` (Kandidat) | **Annahme und Werkstatt:** Gegenstand der Kundschaft annehmen (Fahrzeug, Velo, Textil, Gerät) mit Pflichtfotos, Status bis abgeholt, Kostenvoranschlag mit Freigabegrenze, Abholung; Regel der zwei aus dem Screening ([`branchen/weitere.md`](branchen/weitere.md)) | neu, erst mit einer zweiten Branche |

## Anträge aus den Steckbriefen

Was mehrere Branchen in ihrem Steckbrief (Abschnitt 15) von der Plattform verlangen. Nach der Regel der zwei gehört es in das genannte Paket; die Verträge in W1-00 und die Aufträge der Welle 2 nehmen es auf. Stand 24.11.2026.

| Antrag | Paket | Branchen |
| --- | --- | --- |
| **Verträge früher:** wiederkehrende Rechnung je Kundschaft und Objekt (Monatspauschale, Laufzeit, Kündigungsfrist, Preisänderung) schon für den ersten Pilot | P-51, Kern in **W2** statt W4 | Facility, Gebäudehülle, Haustechnik, Garten |
| Fahrzeuge als «alpha» schon in W2: Gesamtgewicht, Nutzlast, Volumen, Ausweise je Person, Belegung im Einsatzplan | P-42, Kern in **W2** | Umzug, Gebäudehülle, Garten |
| Befund oder Mangel am Objekt neben dem Mangel der Abnahme: Ort, Kategorie, Dringlichkeit, Fotos, Status als Ledger, Empfänger | P-23, P-25 | Facility, Haustechnik, Gebäudehülle, Garten |
| Schlüssel-Register als Ledger mit Quittung und Liste «ausser Haus», nie Codes | P-23 | Facility, Haustechnik, Garten, Umzug, Beherbergung |
| Baujahr und **Schadstoffhinweis** am Objekt (Verdacht, Probe, Befund, Datei; Aufheben nur mit Recht); die App beurteilt nie | P-23, P-27 | Maler, Gebäudehülle, Haustechnik |
| **Entsorgungsnachweis** je Auftrag: Fraktion, Menge, Annahmestelle, Beleg, Gebühr, Weiterverrechnung | P-27 | Maler, Gebäudehülle, Umzug, Garten |
| Ausmass mit Formelsatz der Branche als Steckplatz (Winkel, Wurzel, Runden), Art (Besichtigung, Schluss), Vergleich zur Offerte; Raum mit L × B × H und Öffnungen | P-25 | Maler, Gebäudehülle, Facility |
| Materialbedarf je Leistung (Menge je Einheit, Verschnitt, Gebinde); Leistungswert aus Rapporten vorschlagen | P-24 | Maler, Gebäudehülle, Holz |
| Offerte mit Varianten, Eventualpositionen, Optionen und Gruppen; Rückbehalt, Skonto, Anzahlung, Sammelrechnung, Rundung auf 5 Rappen, Ratenplan | P-29 | Maler, Gebäudehülle, Umzug, Kurse |
| Kostenträger je Rapportzeile (Mieterschaft, Verwaltung, Garantie); Zusatz «von Kundschaft bestätigt» | P-25 | Maler, Facility, Umzug |
| Soll gegen Ist je Objekt und Auftrag als Nachkalkulation | P-25, P-32 | Facility, Maler, Garten, Haustechnik |
| Zeitbuchung mit Objekt und Lohnkategorie, Wegzeit zwischen Objekten, Ausfallstunden, Fähigkeiten und Sprachen je Person für Ersatz-Vorschläge, Regelwerk-Bausteine (Meldung von Samstagsarbeit, unbezahlte Reisezeit, Mittagsentschädigung) | P-31 | Facility, Maler, Gebäudehülle, Umzug |
| Abhängigkeiten zwischen Einsätzen und Reservationen fremder Mittel (Gerüst, Kran, Mulde), die beim Verschieben mitziehen | P-25, P-42 | Gebäudehülle, Umzug, Maler |
| Fristen-Regelwerk zum Werkvertrag (Mängelrüge, Verjährung, Bauhandwerkerpfandrecht) mit Quelle, als Erinnerung | P-28, P-29 | Maler, Gebäudehülle, Haustechnik |
| Einheiten Personenstunde, Fahrzeugstunde, Tag, Monat, t, m² × Woche | P-01, P-24 | Umzug, Gebäudehülle, Garten |
| Adresse mit Gültigkeit ab Datum, «vertreten durch» | P-22 | Umzug, Facility, Beherbergung |
| Piktogramme je Leistung und Aushang in mehreren Sprachen | P-24, P-26 | Facility, Beherbergung, Garten |
| Gerätemodi «Theke» und «Selbst-Check-in» mit PIN | P-06, P-09 | Kurse, Termine, Beherbergung |
| Mehrfachkarte und Wertgutschein mit Käufer:in ungleich Inhaber:in; Einheit abbuchen aus dem Kurs | P-51, P-52 | Kurse, Termine |

## Stufe 2 (Welle 7, nur nach Albans JA)

| ID | Was | Warum ein Server |
| --- | --- | --- |
| P-60 | Konten mit Passkeys auf `konto.onestrand.ch` | Anmeldung und Schlüssel für alle Ausgaben |
| P-61 | Relais mit Ende-zu-Ende-Verschlüsselung | Abgleich über Netze, Büro ↔ Baustelle ohne Werkhof |
| P-62 | Mitteilungen | Push braucht einen Dienst |
| P-63 | Seiten für Kundschaft und Mitglieder | Offerte online annehmen, Kurs buchen, Umzugsgutliste selbst ausfüllen |
| P-64 | Mehrere Standorte | gemeinsame Daten über Geräte und Orte |

## Was Branche bleibt

- **Gastro:** Artikel mit Allergenen und Ablauf, Chargen, Rezepte und Kalkulation, Speisekarte, Küchenmonitor und Bons, HACCP-Messarten, L-GAV, Betriebsarten der Gastronomie.
- **Jede andere Branche:** ihre Abläufe (Leistungsverzeichnis, Umzugsgutliste, Dachaufnahme, Farbbuch, Zimmerstatus, Mitgliedschafts-Regeln), ihre Wörter, Vorlagen, Regelwerke und Demo. Wird etwas davon ein zweites Mal gebraucht, wandert es in die Plattform.

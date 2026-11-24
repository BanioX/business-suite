> Recherche vom 24.11.2026, Grundlage von [weitere.md](weitere.md). Nicht verbindlich; verbindlich ist der Steckbrief. Für das öffentliche Repo geprüft: Adressen privater Anbieter entfernt, Beispielnamen erfunden. Die Kennungen in dieser Recherche sind Arbeitstitel; verbindlich sind die Kennungen im Steckbrief.

# Weitere Branchen (Screening) und Abgrenzung (id: `longtail`)

Stand: 24.11.2026. Grundlage für den Auftrag der Branchen-Agenten der Onestrand Business Suite. Diese Datei ersetzt die Abschnitte 1 bis 13 der übrigen Branchendateien durch ein **Screening**: eine Tabelle aller geprüften Branchen, die fünf besten Kandidaten, die Abgrenzung (was bewusst ausser Scope bleibt) und die Rechtsfakten mit Quelle.

**Wie geprüft wurde.** Direkte Abrufe von fedlex.admin.ch, fedlex.data.admin.ch und der STAT-TAB des BFS (PxWeb) waren aus dieser Umgebung gesperrt (Hosts nicht erlaubt). Fakten stammen darum aus Suchergebnissen vom 24.11.2026, die den Inhalt der genannten Quelle wiedergeben, oder sind aus den Schwesterdateien derselben Recherche übernommen (markiert mit «übernommen»). Vor dem Bau einer Funktion, die einen Wert in die App schreibt (Mindestlohn, Frist, Satz), liest die umsetzende Person den Volltext und trägt ihn in `docs/fakten/` ein. Was nicht belegt ist, heisst «nicht belegt».

**Zahlen der Betriebe.** Die amtliche Zahl je Branche liefert die STATENT des BFS nach NOGA 2008, Tabelle «Arbeitsstätten und Beschäftigte nach Jahr, Kanton, Wirtschaftsart und Beobachtungseinheit» (`px-x-0602010000_103`). Der Abruf war gesperrt (Host `www.pxweb.bfs.admin.ch` nicht erlaubt). Wo ein Verband, die EKAS oder eine Behörde eine Zahl nennt, steht sie mit Quelle; sonst «nicht belegt». Die NOGA-Klasse ist als Hilfe für den Nachtrag angegeben; ihre Zuordnung ist **Annahme**, bis sie in der NOGA-Systematik geprüft ist.

**Bewertung.** Eignung 1 bis 5 = Nutzen für den Betrieb × Wiederverwendung der Plattform × geringe Rechtsrisiken (5 = sehr gut). Welle: «W2» = gleich nach den ersten Branchen der Suite, «W3» = später, «W4+» = nur auf Nachfrage, «ausser Scope» = bewusst nie (oder nur mit Albans neuem Entscheid).

**Abkürzungen der Quellenart:** A = amtliche Quelle, V = Verband oder Sozialpartner, S = Suchauszug (Volltext nicht geöffnet), Ü = übernommen aus einer Schwesterdatei.

## 1. Screening aller geprüften Branchen

Quellen in eckigen Klammern stehen in Abschnitt 14. «Annahme» bei NOGA heisst: Zuordnung nicht geprüft. Abläufe und Betriebsgrössen ohne Quelle sind Branchenbeschreibung und im Gespräch mit einem Pilotbetrieb zu prüfen.

### 1.1 Kandidaten

| # | Branche (NOGA, Annahme) | Betriebe CH | Kern-Abläufe | Passende Plattform-Module | Eigene Module nötig | Recht und Risiko | Eignung | Welle |
|---|---|---|---|---|---|---|---|---|
| 1 | **Autogarage** (45.20) | Auto-, Carrosserie- und Zweiradgewerbe zusammen: EKAS-Branchenlösung 16 nennt 5583 und 2916 Betriebe sowie 48 310 und 28 912 Beschäftigte, Lesart (Branche gesamt oder Teilnehmende) zu prüfen [Q1]. Garagegewerbe rund 5200 Betriebe, 38 250 Mitarbeitende (Daten 2015, Tabellenlayout unsicher) [Q2]. STATENT: nicht belegt | Anruf, Termin, Annahme des Fahrzeugs (km-Stand, Schäden, Wunsch), Diagnose, Kostenvoranschlag, Freigabe, Teile bestellen (Telefon, von Hand), Arbeit mit Zeit je Auftrag, Probefahrt, Rechnung, Abholung und Zahlung, Erinnerung an Service und Prüfung; zweimal im Jahr Radwechsel mit Einlagerung | Kundschaft, Aufträge und Einsätze, Team und Zeit, Material und Lager, Offerten und Rechnungen (QR), Kasse und Belege, Erinnerungen, Fotos, Fahrzeuge und Geräte (Ersatzwagen), Checklisten (Übergabe, Umwelt) | Werkstattauftrag mit Annahme; Fahrzeugakte der Kundschaft; Einlagerung fremder Ware (Räder) | Regionaler GAV Autogewerbe in AI, AR, SG, TG (Stand und Inhalt zu prüfen) [Q5]; Umwelt: Abwasser, Ölabscheider, Altöl als Sonderabfall [Q7][Q8]; Haftung für Fahrzeuge der Kundschaft; Teilekataloge und Diagnosegeräte sind Partner, also nur von Hand | **4** | W2 |
| 2 | **Carrosserie und Autolackiererei** (45.20) | in Zeile 1 enthalten (EKAS-Branchenlösung 16) [Q1]; eigene Zahl nicht belegt | Schadenaufnahme mit Fotoserie, Kostenvoranschlag (oft für eine Versicherung), Freigabe, Teile und Lack, Spengler- und Lackierarbeit, Qualitätskontrolle, Rechnung an Kundschaft oder Versicherung, Ersatzwagen | wie Zeile 1, Fotos und Dokumente stärker | Werkstattauftrag (geteilt mit 1); Schadenprotokoll mit Fotoserie | **GAV Carrosseriegewerbe allgemeinverbindlich**, Mindestlöhne in Anhang 8 neu ab 1.9.2026 [Q3][Q4]; Lösemittel und Lackierkabine (Umwelt, nicht belegt); Abwicklung mit Versicherungen nur als PDF, keine Plattform-Anbindung | **4** | W2 |
| 3 | **Velowerkstatt und Velohandel** (95.29, 47.64) | im Zweiradgewerbe der EKAS-Branchenlösung 16 enthalten [Q1]; eigene Zahl nicht belegt | Annahme am Ladentisch (Velo, Rahmennummer, Wunsch, Abholtag), Service nach Paket, Teile aus dem Lager, Anruf bei Mehrarbeit, fertig melden, Abholung an der Kasse; Verkauf neuer Velos mit Garantie; Hochsaison im Frühling | Kundschaft, Aufträge, Material und Lager, Kasse, Rechnungen, Erinnerungen (nächster Service), Fotos, Team und Zeit | Werkstattauftrag (geteilt mit 1); Leistungskatalog mit Service-Paketen | kein GAV belegt (nur Arbeitsgesetz und kantonale Mindestlöhne); Entsorgung von Akkus nicht belegt; geringes Risiko | **4** | W2 |
| 4 | **Schlüssel- und Schuhservice** (95.23, 95.29) | nicht belegt | Laufkundschaft, Sofortarbeit (Schlüssel kopieren, Absätze), Annahme mit Abholschein, Notöffnung (Pikett, Aussendienst), Schliessanlagen für Liegenschaften | Kasse, Kundschaft, Aufträge, Lager (Rohlinge), Rechnungen, Erinnerungen | Annahmeschein (geteilt mit 1); Verwaltung von Schliessplänen | Schliesspläne und Sicherungskarten sind sicherheitskritisch (Verlust = Haftung); Nachweis der Berechtigung bei Notöffnung nicht belegt | 3 | W3 (Annahme); Schliesspläne W4+ |
| 5 | **Textilpflege, Wäscherei, chemische Reinigung** (96.01) | nicht belegt | Annahme mit Nummer und Ticket, Flecken und Mängel notieren, Bearbeitung, Abholung; Firmenkundschaft (Gastro-Wäsche, Arbeitskleider) mit Tour und Monatsrechnung | Kasse, Kundschaft, Aufträge, Rechnungen, Erinnerungen (nicht abgeholt), Touren | Annahmeschein (geteilt); Stück-Nummer; Bestand an Mietwäsche mit Eigentum (Ledger) | Haftung für Ware der Kundschaft; Lösemittel der Chemischreinigung (Umwelt, nicht belegt) | 3 | W3 |
| 6 | **Schneiderei und Änderungsatelier** (14.13, 95.29) | nicht belegt | Anprobe, Abstecken, Masse notieren, Ticket, Abholung; Massanfertigung mit mehreren Anproben | Kasse, Kundschaft, Termine, Aufträge, Fotos | Annahmeschein (geteilt); Massblatt der Kundschaft | gering | 3 | W3 |
| 7 | **Floristik** (47.76) | nicht belegt (STATENT); laut Medienbericht ist über die Hälfte der Blumengeschäfte ein Einpersonenbetrieb [Q10]; Lehre Florist:in EFZ 3 Jahre [Q11] | Laden-Verkauf, Bestellungen (Trauer, Hochzeit, Firmen) mit Liefertermin und Kartentext, Lieferungen, wöchentliche Abos bei Firmen und Restaurants, Einkauf frühmorgens, Verderb, Spitzen an Fest- und Gedenktagen | Kasse, Material und Lager mit Ablauf und Abschreiber, Kundschaft, Aufträge, Objekte (Abo-Standorte), Rechnungen, Erinnerungen, Fotos | Bestellung mit Liefertermin und Kartentext; Arrangement als Stückliste mit Kalkulation; Touren | reduzierter MWST-Satz für Blumen und Pflanzen (Wortlaut prüfen) [Ü-MWSTG]; gering | **4** | W3 |
| 8 | **Fotografie** (74.20) | nicht belegt | Anfrage, Offerte (Hochzeit, Firma, Porträt), Termin, Aufnahme, Auswahl, Bearbeitung, Lieferung als Datei, Rechnung, Nutzungsrechte | Kundschaft, Offerten und Rechnungen, Termine, Aufträge, Erinnerungen | Nutzungsrechte je Auftrag; Einwilligung abgebildeter Personen | Recht am eigenen Bild, Urheberrecht, Personendaten auf Bildern; Bilddaten gehören nicht in die App (Grösse) | 3 | W3 |
| 9 | **Eventtechnik** (90.02, 77.39) | nicht belegt | Anfrage, Besichtigung, Offerte mit Material- und Personalliste, Disposition des Materials, Aufbau, Betrieb, Abbau mit Freelancer:innen, Transport, Rücknahme mit Zählung, Rechnung | Kundschaft, Offerten, Aufträge und Einsätze, Team und Zeit, Fahrzeuge und Geräte, Lager, Checklisten | Mietpark mit Verfügbarkeit nach Datum (Reservation, Packliste, Rücknahme) | Schall über 93 dB(A) und Laser: Meldung 14 Tage vorher (Pflicht der Veranstaltenden) [Q27]; Arbeit in der Höhe und mit Lasten (nicht spezifisch belegt); lange Arbeitstage | 3 | W3 |
| 10 | **Sicherheitsdienst** (80.10) | nicht belegt; GAV gilt ab 10 Arbeitnehmenden [Q25] | Objekt- und Anlass-Aufträge, Dienstplan rund um die Uhr, Bewilligung je Person prüfen, Kontrollgänge mit Nachweis, Vorfallrapport, Schlüssel der Kundschaft, Rechnung nach Stunden | Team und Zeit (Dienstplan), Objekte, Einsätze, Rapporte, Checklisten, Rollen | Wachbuch und Vorfallrapport; Kontrollgang mit Kontrollpunkten; Register der Bewilligungen | **GAV allgemeinverbindlich seit 2014** [Q6]; kantonale Bewilligungen (Konkordate) [Q23][Q24]; Vorfalldaten über Dritte, Haftung | 2 | W4+ |
| 11 | **Taxi und Fahrdienst** (49.32) | nicht belegt | Fahrten annehmen, disponieren, fahren, kassieren, Schichtabrechnung, Aufzeichnung der Arbeits-, Lenk- und Ruhezeit, Fahrzeugunterhalt | Team und Zeit, Kasse, Fahrzeuge, Kundschaft (Firmen), Rechnungen | Fahrtenbuch und Schichtabrechnung; ARV-2-Aufzeichnung | Bewilligung für berufsmässigen Personentransport, medizinische Mindestanforderungen, Fahrtschreiber; **Revision der ARV 2 in der Vernehmlassung** [Q21][Q22]; Vermittlungsplattformen sind Partner; Live-Disposition braucht Server | 2 | W4+ |
| 12 | **Fahrschule** (85.53) | nicht belegt; Fahrlehrer:innen arbeiten meist selbständig (Berufsinformation, S) [Q28] | Anfrage, erste Lektion, Lektionen-Termine, Abo und Guthaben, Ausbildungsstand, Prüfung (Strassenverkehrsamt, von Hand), Kurse (Verkehrskunde, Nothilfe), Fahrzeugkosten | Termine, Kundschaft, Kasse und Guthaben, Rechnungen, Fahrzeuge, Erinnerungen, Kurse | Ausbildungskarte (Lernziele, Stand je Lektion) | Fahrlehrerbewilligung des Wohnsitzkantons, unbefristet, schweizweit [Q28]; Personendaten Jugendlicher | 3 | W3 |
| 13 | **Kurierdienst** (53.20) | nicht belegt; bei der PostCom gemeldet sind 198 Postdienstanbieterinnen (Mai 2026), nur Meldepflichtige [Q20] | Auftrag, Abholung, Zustellung mit Nachweis (Unterschrift, Foto), Touren, Monatsrechnung an Firmen | Kundschaft, Aufträge und Einsätze, Rapporte (Zustellnachweis), Rechnungen, Team und Zeit, Fahrzeuge | Sendung mit Zustellnachweis; Touren | Meldepflicht bei der PostCom je nach Leistung, ordentlich ab 500 000 Franken Umsatz [Q19]; Scheinselbständigkeit (nicht belegt); Echtzeit-Disposition braucht Server | 3 | W3 |
| 14 | **Hofladen und Direktvermarktung** (01, 47, Annahme) | 46 270 Landwirtschaftsbetriebe 2025 (BFS, Zuordnung der Mitteilung prüfen) [Q12]; davon mit Direktvermarktung: nicht belegt | Ernte und Verarbeitung (Konfitüre, Fleischpakete), Etikettieren, Hofladen oft mit Selbstbedienung, Marktstand, Abo-Kisten, Bestellungen, Selbstkontrolle der Kühlung, Kasse | Kasse, Material und Lager mit Ablaufdaten, Checklisten und Kontrollen (aus der Selbstkontrolle), Kundschaft (Abos), Aufträge, Dokumente (Etiketten) | Etikette mit Zutaten, Allergenen und Haltbarkeit; Abo-Kisten | Meldepflicht als Lebensmittelbetrieb kantonal verschieden vollzogen [Q13][Q14][Q15]; Bewilligung bei tierischen Produkten [Q15]; Selbstkontrolle [Q16]; MWST-Ausnahme für eigene Erzeugnisse (Wortlaut prüfen) [Ü-MWSTG] | **4** | W3 |
| 15 | **Kleiner Detailhandel und Kiosk** (47.11, 47.26, 47.62) | nicht belegt | Verkauf an der Kasse mit Scanner, Ware einräumen, Bestellungen beim Grosshandel, Rücknahme von Zeitungen, Lotto und Guthabenkarten, Jugendschutz, Schichten der Aushilfen, Kassenabschluss | Kasse (Kern), Lager, Team und Zeit (Schichten), Checklisten (Jugendschutz), Belege | Registrierkasse mit Artikelstamm und Scanner; Remission | **Abgabeverbot von Tabak und E-Zigaretten unter 18 seit 1.10.2024**, Hinweis an der Verkaufsstelle, Testkäufe [Q17]; Alkohol nach Alter [Q18]; Lotto und Zahlterminals sind Partner; Kassen-Hardware | 2 | W4+ |
| 16 | **Bestattung** (96.03) | nicht belegt | Anruf Tag und Nacht, Überführung, Gespräch mit Angehörigen, Formalitäten bei Zivilstandsamt, Gemeinde, Friedhof, Krematorium und Pfarramt, Trauerfeier, Drucksachen, Offerte und Rechnung | Kundschaft (Auftraggebende), Aufträge, Checklisten, Dokumente, Offerten und Rechnungen, Team und Zeit (Pikett), Fahrzeuge | Todesfall-Akte mit Fristen und Beteiligten | Bestattungsrecht ist kantonal (Beispiele SZ, BS) [Q29]; sensible Daten über Verstorbene und Angehörige; Pietät | 3 | W4+ |
| 17 | **Tierbetreuung, Tierpension, Hundeschule** (96.09, 85.51, Annahme) | nicht belegt | Kennenlernen, Kurse und Einzellektionen, Belegung der Pension in den Ferien, Gassi-Dienst mit Schlüssel der Halter:innen, Tierakte (Impfungen, Futter, Medikamente, Tierarzt), Abos, Rechnungen | Termine, Kurse, Kundschaft, Belegung (aus der Beherbergung), Checklisten (Fütterung, Rundgang), Erinnerungen, Kasse, Rechnungen, Fotos | Tierakte; Belegungsplan der Plätze | **Bewilligung für Tierheime und gewerbsmässige Betreuung von mehr als fünf Tieren** (TSchV Art. 101), Ausbildungspflicht [Q26]; Hundeschule allein: nicht belegt; Haftung | **4** | W3 |
| 18 | **Nachhilfe und Musikschule** (85.59, 85.52) | nicht belegt | Anmeldung, Stundenplan, Lektionen, Absenzen, Semesterrechnung, Lehrpersonen im Stundenlohn, Vorspiel | alles aus der Branche Kurse | keine | Unterricht ist von der MWST ausgenommen (MWSTG Art. 21 Abs. 2 Ziff. 11) [Ü-MWSTG]; Daten Minderjähriger; Beiträge der Gemeinden (nicht belegt) | 3 | W3 (in der Ausgabe für Kurse) |
| 19 | **Fahrzeugreinigung und Aufbereitung** (45.20, 81.29, Annahme) | nicht belegt | Termin oder Laufkundschaft, Paket (aussen, innen, Aufbereitung), Waschkarten und Abos, Flotten mit Monatsrechnung, mobile Reinigung bei der Kundschaft | Termine, Kasse und Guthaben, Kundschaft, Rechnungen, Fotos (vorher, nachher, Schäden) | Werkstattauftrag (geteilt, einfach) | Abwasser des Waschplatzes vorbehandeln, Anlagen bewilligungspflichtig [Q7][Q8]; mobile Reinigung beim Abwasser heikel; Haftung für Fahrzeuge | 3 | W3 |

### 1.2 Abgrenzung (bewusst ausser Scope)

| # | Branche (NOGA, Annahme) | Betriebe CH | Kern-Abläufe | Passende Plattform-Module | Eigene Module nötig | Recht und Risiko | Eignung | Welle |
|---|---|---|---|---|---|---|---|---|
| 20 | **Gesundheit: Physiotherapie, Spitex, Arzt- und Therapiepraxen** (86, 88.10) | nicht belegt | Verordnung, Behandlung, Patientendokumentation, Abrechnung mit Kranken- und Unfallversicherern nach Tarif | Termine, Team und Zeit | Patientendossier, Tarif-Abrechnung | Berufsausübungsbewilligung (GesBG Art. 11) [Q30]; Gesundheitsdaten sind besonders schützenswert [Ü-DSG]; Berufsgeheimnis; Tarifsystem seit 1.1.2026 neu [Q31]; Abrechnung mit Versicherern wäre eine Anbindung an Partner | 1 | **ausser Scope** |
| 21 | **Kinderbetreuung: Kita, Hort, Tagesfamilien** (88.91) | nicht belegt | Belegung, Anwesenheit, Betreuungsschlüssel, Elternkommunikation, Abrechnung mit Gemeinden (Betreuungsgutscheine) | Team und Zeit, Kasse | Kinderakte, Belegung nach Betreuungsschlüssel | Bewilligung und Aufsicht nach PAVO, Tagesfamilien meldepflichtig [Q32]; Daten von Kindern; Haftung; Gemeinde-Abrechnung als Schnittstelle | 1 | **ausser Scope** |
| 22 | **Treuhand** (69.20) | nicht belegt | Buchhaltung, Abschluss, Steuern, Lohn für viele Mandant:innen | – | volle Finanzbuchhaltung | Treuhand ist **Empfängerin** des Monatspakets der Suite, nicht Zielbetrieb; Daten vieler fremder Betriebe; Berufshaftung; Buchführungsrecht (OR Art. 957 ff.) [Ü-OR] | 1 | **ausser Scope** |
| 23 | **Bauhauptgewerbe ab etwa 20 Personen** (41, 42, 43.99) | nicht belegt | Baustellen mit Polier:in, Maschinenpark, Ausmass, Subunternehmen, Regie und Akkord | Team und Zeit, Fahrzeuge und Geräte | Baustellen-Logistik, Ausmass nach Norm, Subunternehmer-Kette | Landesmantelvertrag (in der Liste der allgemeinverbindlichen GAV, Stand und Laufzeit 2026 nicht belegt) [Q4][Q33]; Bauarbeitenverordnung; Grösse ausserhalb der Zielgruppe | 1 | **ausser Scope** (Kleinbaugeschäft W4+) |

## 2. Muster über die Branchen hinweg

Das Screening zeigt wenige wiederkehrende Abläufe. Nach der Regel der zwei gehören sie in die Plattform, sobald zwei Branchen sie brauchen.

| Muster | Branchen im Screening | Kern | Folge für die Plattform |
|---|---|---|---|
| **Annahme und Werkstatt** | Garage, Carrosserie, Velo, Schlüssel und Schuh, Textilpflege, Schneiderei, Fahrzeugreinigung (7) | Gegenstand der Kundschaft annehmen, Zustand festhalten (Fotos, Notiz), Nummer und Abholschein, Status bis zur Abholung, Arbeit und Teile darauf buchen, Rechnung | **Plattform-Antrag**: Modul «Annahme und Werkstatt» als Erweiterung von «Aufträge und Einsätze» (Auftrag am Ort statt beim Objekt) |
| **Laden und Verkauf** | Floristik, Hofladen, Kiosk, Velohandel, Textilpflege (5) | Verkauf an der Theke mit Artikeln, Barzahlung, Tagesabschluss, Verderb | Kasse und Belege erweitern um Artikelverkauf mit Tagesabschluss; Hardware (Belegdrucker, Scanner) ist eigener Entscheid |
| **Fremde Ware im eigenen Lager** | Räder in der Garage, Mietwäsche, Tiere in der Pension (als Belegung) (3) | Bestand gehört der Kundschaft, nicht dem Betrieb | Material und Lager: Eigentum je Bewegung (Betrieb oder Kundschaft) |
| **Termine, Abos und Guthaben** | Fahrschule, Hundeschule, Nachhilfe, Fahrzeugreinigung, Floristik-Abos (5) | Lektionen oder Leistungen im Voraus bezahlt, verbraucht je Termin | aus den Branchen Termine und Kurse übernehmen (Guthaben als Ledger) |
| **Touren und Zustellnachweis** | Kurier, Floristik, Textilpflege, Hofladen-Abos (4) | Reihenfolge der Stopps, Übergabe mit Unterschrift oder Foto | Aufträge und Einsätze um Tour und Nachweis erweitern; Live-Ortung ausser Scope (kein Standort-Tracking von Mitarbeitenden) |
| **Mietpark und Verleih** | Eventtechnik, Ersatzwagen der Garage (2) | Gerät ist an Daten reserviert, geht hinaus und kommt zurück | Fahrzeuge und Geräte um Reservation nach Datum erweitern |
| **Akte mit sensiblen Angaben** | Tierakte, Todesfall-Akte, Massblatt (3) | Freitext und Fristen zu einer Sache oder Person | allgemeine «Akte» mit Feldvorlagen; heikle Felder hinter Rollenrecht |

## 3. Die fünf besten Kandidaten

### 3.1 Autogarage und Carrosserie (Eignung 4, Welle 2)
Die Garage ist der typische Kleinbetrieb mit 2 bis 15 Personen (Annahme): Inhaber:in, oft selbst in der Werkstatt, Werkstattchef:in, Mechatroniker:innen, Lernende, eine Person am Empfang oder im Büro (oft Teilzeit). Die Branche ist gross (EKAS-Branchenlösung 16: Auto-, Carrosserie- und Zweiradgewerbe mit mehreren Tausend Betrieben [Q1]) und vom Ablauf her klar: Jeder Arbeitstag besteht aus Werkstattaufträgen mit Annahme, Arbeitszeit, Teilen und Rechnung. Die Schmerzen sind handfest: Aufträge auf Papier, vergessene Teile und Minuten auf der Rechnung, Fotos von Vorschäden auf privaten Handys, Radwechsel-Saison mit Hunderten eingelagerten Rädern, die im Gestell gesucht werden. Die Plattform deckt den grössten Teil ab (Kundschaft, Aufträge, Zeit, Lager, QR-Rechnung, Erinnerungen, Fotos); neu ist der Werkstattauftrag mit Fahrzeugakte und die Einlagerung fremder Ware. Die Carrosserie nutzt dieselben Teile und braucht zusätzlich Schadenprotokolle mit Fotoserien; ihr GAV ist allgemeinverbindlich [Q3]. Grenzen: Teilekataloge, Diagnosegeräte, Fahrzeugdaten-Abfragen und Versicherungs-Plattformen sind Partner und bleiben draussen; die App nimmt Nummern und Werte von Hand oder per Foto mit Texterkennung auf.

### 3.2 Velowerkstatt (Eignung 4, Welle 2)
Velowerkstätten sind meist Laden und Werkstatt in einem, mit 1 bis 8 Personen und Lernenden (Fahrradmechaniker:in EFZ, Annahme). Der Ablauf ist derselbe Werkstattauftrag wie in der Garage, nur kürzer: Annahme am Ladentisch, Service-Paket, Teile, «fertig» melden, Abholung an der Kasse. Daneben läuft der Verkauf neuer Velos und von Zubehör. Die Velowerkstatt ist der ideale **zweite Nutzer** des Moduls «Annahme und Werkstatt» und erfüllt damit die Regel der zwei. Das Rechtsrisiko ist gering (kein GAV belegt, keine Bewilligung). Eigene Zahlen sind nicht belegt; das Zweiradgewerbe steckt in der EKAS-Branchenlösung 16 [Q1].

### 3.3 Floristik (Eignung 4, Welle 3)
Über die Hälfte der Blumengeschäfte sind laut einem Medienbericht Einpersonenbetriebe [Q10]; dazu kommen Geschäfte mit 2 bis 8 Personen, Lernenden und Aushilfen an Festtagen. Floristik verbindet Laden, Bestellung mit Liefertermin (Trauer, Hochzeit, Firmen), Lieferung und Abos bei Firmen. Sie profitiert stark von dem, was aus Randen in die Plattform kommt: Lager mit Ablauf und Abschreiber (Schnittblumen verderben in Tagen), das Arrangement als Stückliste mit Kalkulation und Marge (wie ein Rezept), Einkauf nach Bedarf. Neu sind die Bestellung mit Kartentext und Lieferadresse und der Tagesabschluss an der Kasse. Das Rechtsrisiko ist gering; zu prüfen ist der reduzierte MWST-Satz für Blumen und Pflanzen.

### 3.4 Tierbetreuung, Tierpension und Hundeschule (Eignung 4, Welle 3)
Kleine Betriebe, oft Inhaber:in allein oder mit 1 bis 5 Personen in Teilzeit. Die Branche setzt Bausteine zusammen, die andere Branchen ohnehin bauen: Kurse und Einzellektionen (Branche Kurse), Belegung von Plätzen (Branche Beherbergung, Plätze statt Zimmer), Gassi-Einsätze mit Schlüsseln der Halter:innen (Schlüsselverwaltung aus der Branche Facility), Abos und Guthaben (Branche Termine). Neu ist nur die Tierakte (Impfungen, Futter, Medikamente, Notfallkontakt, Verträglichkeit). Wer Tiere gewerbsmässig betreut, braucht ab mehr als fünf Tieren eine kantonale Bewilligung und eine Ausbildung [Q26]; die App erinnert an die Bewilligung und an Impfdaten, beurteilt aber nichts. Fotos als Tagesbericht an die Halter:innen gehen über das Teilen-Menü des Geräts, nicht über einen Server.

### 3.5 Hofladen und Direktvermarktung (Eignung 4, Welle 3)
Die Branche mit der grössten Nähe zu Randen: Lager mit Ablaufdaten, Etiketten mit Zutaten und Allergenen, Selbstkontrolle der Kühlung, Kalkulation verarbeiteter Produkte (Konfitüre, Fleischpakete). Dazu kommen Laden-Kasse (oft Selbstbedienung mit Kässeli), Marktstand und Abo-Kisten. Der Betrieb ist ein Bauernhof; die Suite bedient nur den Laden und die Vermarktung, **nicht** die Landwirtschaft (Direktzahlungen, Tierverkehr, Feldkalender: Anbindungen an Behörden-Plattformen und eigene Fachwelt, ausser Scope). Die Meldepflicht als Lebensmittelbetrieb wird kantonal verschieden vollzogen: Zürich nimmt den direkten Verkauf von Primärprodukten ab Hof aus [Q13], Aargau verlangt die Meldung aller Lebensmittelbetriebe [Q14]; wer tierische Lebensmittel verarbeitet, braucht zusätzlich eine Bewilligung [Q15]. Offene Frage für Alban: gehört die Direktvermarktung als Option zu Randen (Lebensmittel) oder in eine eigene Ausgabe?

**Gute Mitnahmen** (Eignung 3, sobald «Annahme und Werkstatt» und «Laden und Verkauf» stehen): Textilpflege, Schneiderei, Schlüssel- und Schuhservice, Fahrzeugreinigung. Die Fahrschule und die Nachhilfe kommen über die Branchen Termine und Kurse ohne eigenes Modul.

## 4. Abgrenzung: was bewusst ausser Scope bleibt

| Bereich | Warum ausser Scope | Recht | Haftung | Daten | Grenzfall, der drin bleiben darf |
|---|---|---|---|---|---|
| **Gesundheit** (Physiotherapie, Spitex, Praxen) | Die Arbeit hängt an Bewilligung, Dokumentationspflicht und Abrechnung mit Versicherern; ohne diese Abrechnung ist eine App für die Praxis wertlos, mit ihr wäre sie eine Anbindung an Partner (Krankenkassen, Stufe 1 verboten) | Berufsausübungsbewilligung (GesBG Art. 11) [Q30]; Tarifsystem TARDOC und ambulante Pauschalen seit 1.1.2026 [Q31]; Berufsgeheimnis (Merkblatt Physiotherapie Zürich, Abschnitt «Wahrung des Berufsgeheimnisses») [Q30] | Fehler in Dokumentation oder Abrechnung haben rechtliche Folgen für die Fachperson | Gesundheitsdaten sind besonders schützenswert (DSG Art. 5 Bst. c), Einwilligung muss ausdrücklich sein (Art. 6 Abs. 7) [Ü-DSG] | Massage, Kosmetik und Fusspflege **ohne** Abrechnung mit Versicherern (Branche Termine), ohne Anamnese-Akte |
| **Kinderbetreuung** (Kita, Hort, Tagesfamilien) | Bewilligung und Aufsicht durch Behörden, Abrechnung mit Gemeinden (Betreuungsgutscheine) und Eltern, Betreuungsschlüssel als Auflage | Kitas und private Horte bewilligungspflichtig, Tagesfamilien meldepflichtig, Aufsicht (PAVO; Umsetzung kantonal) [Q32] | Aufsichtspflicht über Kinder | Daten von Kindern und Familien, teils Gesundheitsangaben (Allergien, Medikamente) | Kurse für Kinder (Musik, Nachhilfe, Sport) in der Branche Kurse, mit Einwilligung der Eltern |
| **Treuhand** | Treuhand ist die **Empfängerin** des Monatspakets und damit Partnerin jedes Pilotbetriebs; eine Treuhand-App hiesse volle Finanzbuchhaltung, Abschluss und Steuern für viele Mandant:innen | Buchführungsrecht (OR Art. 957 ff.) [Ü-OR]; kantonale Berufsregeln für Treuhänder:innen nicht belegt | Berufshaftung für Abschlüsse und Steuern | Daten vieler fremder Betriebe auf einem Gerät | Export in einem Format, das die Treuhand lesen kann (Monatspaket), ohne Anbindung |
| **Bauhauptgewerbe gross** | Betriebe über der Zielgruppe (ab etwa 20 Personen), Baustellen-Logistik, Maschinenpark, Ausmass nach Norm, Ketten von Subunternehmen | Landesmantelvertrag (allgemeinverbindlich; Laufzeit 2026 nicht belegt) [Q4][Q33]; Bauarbeitenverordnung; Norm-Verträge | Bauhandwerkerpfandrecht, Garantie, Solidarhaftung in der Kette (nicht belegt in dieser Sitzung) | Pläne und Daten der Bauherrschaft | Kleinbaugeschäft (Maurer:in mit 1 bis 10 Personen) später über die Bausteine von Maler und Gebäudehülle, W4+ |

**Grundsatz für die Abgrenzung:** Eine Branche bleibt draussen, wenn (a) ihr Kernablauf eine Anbindung an Partner oder Behörden-Plattformen verlangt, (b) eine Bewilligung an die Dokumentation in der App gebunden wäre (Patientendossier, Kinderakte), (c) die App Daten besonders schützenswerter Art in der Breite hielte oder (d) die Betriebe über der Zielgruppe liegen. Die App beurteilt nie (Gesundheit, Sicherheit, Recht); sie erinnert, dokumentiert und verweist auf die Quelle.

## 5. Bedarf an Plattform-Modulen (für die fünf Kandidaten)

| Plattform-Modul | Wofür (Garage, Velo, Floristik, Tierbetreuung, Hofladen) | Branchen-Einstellungen (Optionen, Vorlagen, Wörter) | Priorität |
|---|---|---|---|
| Kern (Betrieb, Personen, Geld, Datum) | Betrieb, Standort, Öffnungszeiten, Rappen, Kalendertage | Betriebsart beim Einrichten: Werkstatt, Laden, Betreuung, Hof | Muss |
| Funktionen-Register | Werkstatt ohne Laden, Laden ohne Werkstatt, Pension ohne Kurse | Module schaltbar: Einlagerung, Abos, Touren, Etiketten | Muss |
| Rollen und Rechte | Werkstatt sieht Aufträge, nicht Löhne; Aushilfe nur Kasse | Vorlagen aus Abschnitt 7 | Muss |
| Kundschaft | Halter:innen von Fahrzeugen, Velos, Tieren; Abo-Kundschaft | Wort: «Kundschaft», «Halter:in», «Abonnent:in» | Muss |
| Aufträge und Einsätze | Werkstattauftrag, Bestellung, Gassi-Einsatz, Lieferung | Status-Vorlagen je Branche | Muss |
| Team und Zeit | Stempeln auf Auftrag (Werkstatt), Schichten (Laden), Lernende | Rundung auf 6 oder 15 Minuten als Option des Betriebs | Muss |
| Material und Lager (Ledger) | Teile, Reifen, Blumen, Hofprodukte; fremde Ware (Räder) | Ablaufdaten (Floristik, Hof), Eigentum je Bewegung, Abschreiber | Muss |
| Offerten und Rechnungen (QR-Rechnung) | Kostenvoranschlag, Rechnung, Monatsrechnung für Abos und Firmen | Arbeitswert in Minuten, Pauschalen, Pakete | Muss |
| Kasse und Belege | Barzahlung bei Abholung, Tagesabschluss im Laden, Belege per Foto, MWST, Monatspaket | Saldosteuersatz der Branche als Eintrag des Betriebs (Satz nicht belegt) | Muss |
| Erinnerungen | Abholung, nächster Service, Radwechsel, Impfungen, Abo-Lieferung | Vorlagen je Branche, alle änderbar | Soll |
| Fotos-Dokumentation | Vorschäden bei Annahme, Schadenserie, Arrangement, Tagesbericht Tier | Pflichtfotos bei Annahme als Option | Muss (Garage), Soll (übrige) |
| Dokumente und PDF | Annahmeschein, Kostenvoranschlag, Rechnung, Etikette, Belegungsbestätigung | Vorlagen je Branche | Muss |
| Checklisten und Kontrollen | Übergabe Fahrzeug, Umwelt-Journal, Kühlung Hofladen, Fütterung | aus der Selbstkontrolle verallgemeinert | Soll |
| Fahrzeuge und Geräte | Ersatzwagen, Lieferwagen, Hebebühnen-Prüfung | Reservation nach Datum (Mietpark) | Kann |
| Objekte und Standorte | Abo-Standorte der Floristik, Gassi-Adressen | Schlüssel der Kundschaft (aus Facility) | Kann |
| Kopplung und Sicherung | Werkstatt-iPad, Handy der Inhaber:in, Büro-Computer | Abgleich im WLAN des Betriebs | Muss |

## 6. Branchen-eigene Module

### 6.1 Annahme und Werkstatt (Plattform-Antrag, Regel der zwei: Garage, Velo, Textil, Schneiderei, Schuh, Fahrzeugreinigung)
- **Zweck:** Gegenstand der Kundschaft von der Annahme bis zur Abholung führen.
- **Datenobjekte:** `ServiceItem` (Art: Fahrzeug, Velo, Kleidungsstück, Schuh; Kennung wie Kontrollschild, Fahrgestell- oder Rahmennummer; km-Stand; Fotos; Zustand bei Annahme), `WorkOrder` (Nummer, Kundschaft, Gegenstand, Wunsch, Abholtermin, Status, Freigabegrenze in Rappen, Unterschrift bei Annahme), `WorkOrderLine` (Leistung aus Katalog oder frei, Arbeitszeit in Minuten, Teil aus dem Lager mit Menge), `Approval` (Kostenvoranschlag, Freigabe ja/nein, Weg: Unterschrift, Telefonnotiz, Datum).
- **Befehle:** `acceptItem`, `addFinding`, `requestApproval`, `recordApproval`, `bookTime`, `bookPart`, `markReady`, `handOver`, `invoice`.
- **Status:** angenommen → in Arbeit → wartet auf Freigabe → wartet auf Teile → fertig → abgeholt → verrechnet.
- **Rechenregeln:** Arbeitswert = Minuten × Stundenansatz des Betriebs (Rappen pro Stunde, gerundet auf ganze Rappen); Freigabegrenze: Überschreitet die Summe die Grenze, verlangt die App eine neue Freigabe; Summe berechnet, nie gespeichert.
- **Dokumente:** Annahmeschein (mit Fotos und Unterschrift), Kostenvoranschlag, Arbeitsrapport, Rechnung, Abholschein.
- **Kennzahlen:** Aufträge pro Status, Durchlaufzeit, verrechnete gegen gestempelte Stunden, nicht abgeholte Gegenstände.

### 6.2 Fahrzeugakte und Einlagerung (Garage)
- **Datenobjekte:** `Vehicle` (Kontrollschild, Marke, Modell, Fahrgestellnummer, erste Inverkehrsetzung, nächste Prüfung als Kalendertag, Halter:in), `StoredSet` (Räder oder Reifen, Grösse, Profiltiefe in Zehntelmillimetern, Lagerplatz, Foto, Eigentum Kundschaft).
- **Befehle:** `storeSet`, `moveSet`, `releaseSet`; Ledger mit Eigentum.
- **Dokumente:** Einlagerungsbeleg; Liste «Radwechsel diese Woche» mit Lagerplatz.

### 6.3 Bestellung mit Liefertermin (Floristik, Hofladen)
- **Datenobjekte:** `Order` (Anlass: Trauer, Hochzeit, Geburtstag, Firma; Liefertag, Zeitfenster, Lieferadresse, Kartentext, Empfänger:in, Preisrahmen), `Arrangement` (Stückliste aus Lagerartikeln, Arbeitszeit, Kalkulation wie ein Rezept).
- **Rechenregeln:** Wareneinsatz aus Stückliste, Marge berechnet, fehlender Preis wird angezeigt.
- **Dokumente:** Auftragszettel für die Werkstatt, Lieferschein, Karte.

### 6.4 Tierakte und Belegung (Tierbetreuung)
- **Datenobjekte:** `Animal` (Art, Rasse, Name, Geburtsjahr, Halter:in, Tierarzt, Impfungen als Kalendertage, Futter, Medikamente, Verträglichkeit), `Stay` (Platz, von, bis, Leistungen).
- **Rechenregeln:** Belegung je Tag ≤ Plätze; Hinweis ab mehr als fünf betreuten Tieren auf die Bewilligung (Quelle [Q26]), ohne Beurteilung.

### 6.5 Etikette und Abo-Kiste (Hofladen)
- **Datenobjekte:** `Label` (Produkt, Zutaten, Allergene aus der Zutatenliste berechnet, Haltbarkeit, Los, Herkunft), `BoxSubscription` (Kundschaft, Rhythmus, Abholort oder Tour).
- **Dokumente:** Etikettenbogen, Lieferliste.

### 6.6 Mietpark (Eventtechnik, später Ersatzwagen)
- **Datenobjekte:** `RentalItem` (Gerät oder Satz, Anzahl), `Reservation` (von, bis, Auftrag), `PackList`, `ReturnCheck` (gezählt, Schaden, Foto).
- **Rechenregel:** Verfügbarkeit = Bestand − Reservationen im Zeitraum.

## 7. Rollen-Vorlagen

| Rolle | Sieht und tut | Sieht nicht | Gerät |
|---|---|---|---|
| Inhaber:in | alles, Preise, Margen, Löhne, Rechnungen, Monatspaket | – | Handy, iPad, Computer |
| Werkstattchef:in, Filialleitung | Aufträge, Planung, Freigaben, Teile, Stunden des Teams | Löhne, Margen (Option) | iPad in der Werkstatt, Handy |
| Mitarbeitende Werkstatt (Mechaniker:in, Florist:in, Betreuer:in) | eigene Aufträge, Stempeln, Fotos, Teile buchen, Annahme | Einkaufspreise (Option), Löhne, andere Stundenkonten | iPad an der Werkbank, eigenes Handy |
| Empfang, Laden, Kasse | Annahme, Abholung, Kasse, Tagesabschluss, Termine | Löhne, Margen | iPad am Ladentisch |
| Büro (Teilzeit, oft Familie) | Rechnungen, Mahnungen, Belege, Monatspaket, Lohn-Vorbereitung mit Recht | – (Löhne nur mit Recht) | Computer im Büro |
| Lernende | eigene Aufträge und Zeiten, Lernziele | Preise, Löhne anderer | iPad, Handy |
| Aushilfe | Kasse, Stempeln, Aufgabenliste | alles Übrige | Laden-iPad |
| Ausläufer:in, Fahrer:in | Tour, Lieferschein, Zustellnachweis | Preise, Löhne | Handy |

## 8. Recht und Pflichten mit Quelle

Art: A = amtlich, V = Verband oder Sozialpartner, S = Suchauszug, Volltext nicht geöffnet, Ü = übernommen aus einer Schwesterdatei. Alle Einträge geprüft am 24.11.2026.

| # | Fakt | Wert | Quelle (URL) | Art |
|---|---|---|---|---|
| R1 | GAV Carrosseriegewerbe | allgemeinverbindlich; Bundesratsbeschluss vom 11.8.2026 ändert Lohnanpassung und Mindestlöhne (Anhang 8), gültig 1.9. bis 31.12.2026; Geltung ganze Schweiz ohne JU und Berner Jura, Genf je nach Dokument (zu prüfen); Dellendrücker:innen wie Facharbeitende mit EFZ | https://syna.ch/images/gav_carrosserie_Änderung_Änderung_GB_11_08_2026_DE.pdf ; https://www.seco.admin.ch/dam/de/sd-web/h7cqLISavynZ/ave_bund_Oktober_2026_d.pdf | V·A·S |
| R2 | GAV Autogewerbe Ostschweiz | in der SECO-Tabelle für AI, AR, SG, TG geführt; Laufzeit (gelesen 31.12.2026) und Inhalt zu prüfen | https://seco.admin.ch/dam/seco/de/dokumente/Arbeit/Personenfreizuegigkeit/Gesamtarbeitsvertr%C3%A4ge%20und%20Normalarbeitsvertr%C3%A4ge/artikel_gav_tabelle_2024.pdf.download.pdf/Tabellen%203%20Sprachen%20f%C3%BCr%202024.pdf | A·S |
| R3 | Autogewerbe als Fokusbranche der Kontrollen | im Tätigkeitsbericht der tripartiten Kommission des Bundes 2025 für 2026 bis 2027 genannt | https://www.seco.admin.ch/dam/fr/sd-web/V9G9XkLEzegN/T%C3%A4tigkeitsbericht-TPK-Bund-SECO-2025-DE.pdf | A·S |
| R4 | Umwelt im Autogewerbe | massgebend ist das interkantonale Merkblatt «Auto- und Transportgewerbe» (2021); Abwasser aus Waschplätzen und Spritzkabinen vorbehandeln; Ölabscheider und Vorbehandlungsanlagen kantonal bewilligungspflichtig; Altöl und Abscheiderschlamm sind Sonderabfall (VeVA) | https://www.sz.ch/public/upload/assets/59237/Umweltschutz_im_Auto-_und_Transportgewerbe_Interkantonales_Merkblatt.pdf?fp=5 ; https://ar.ch/fileadmin/user_upload/Departement_Bau_Volkswirtschaft/Amt_fuer_Umwelt/Umwelt/Publikationen/Merkblaetter/Bau/Merkblatt-Auto-und-Transportgewerbe_2021.pdf | A·S |
| R5 | Saldosteuersatz Autoreparatur | Auto-Reparaturwerkstätte, Karosserie- und Automalerarbeiten, Pneuhandel: 2,8 % (Fassung Stand 1.1.2018); **ab 1.1.2025 nicht belegt** | https://lexfind.ch/tolv/165184/de ; https://www.estv.admin.ch/de/mwst-saldosteuersatzmethode-2025 | A·S |
| R6 | Saldosteuersätze der übrigen Branchen | **nicht belegt**; aus der Verordnung der ESTV über die Höhe der Saldosteuersätze (SR 641.202.62, Stand 1.1.2025) nachtragen | https://www.estv.admin.ch/de/mwst-saldosteuersaetze-pauschalsteuersaetze | – |
| R7 | Saldosteuersatzmethode seit 2025 | mehr als zwei Sätze wählbar; eigener Satz für jede Tätigkeit über 10 % des steuerbaren Umsatzes; Mischbranchen- und 50-%-Regel entfallen | https://www.estv.admin.ch/de/mwst-saldosteuersatzmethode-2025 | A·S |
| R8 | MWST-Pflicht | ab 100 000 Franken Umsatz aus steuerbaren Leistungen; Normalsatz 8,1 % | https://www.estv.admin.ch/de/fragen-und-antworten-mwst ; https://www.estv.admin.ch/de/mwst-steuersaetze-schweiz | Ü |
| R9 | MWST: Unterricht | von der Steuer ausgenommen (MWSTG Art. 21 Abs. 2 Ziff. 11) | https://www.fedlex.admin.ch/eli/cc/2009/615/de | Ü |
| R10 | MWST: eigene Erzeugnisse der Landwirtschaft, reduzierter Satz für Blumen und Pflanzen | Ausnahme für die Veräusserung eigener Erzeugnisse durch Landwirt:innen und Gärtner:innen (MWSTG Art. 21 Abs. 2 Ziff. 26) und reduzierter Satz für lebende Pflanzen und Schnittblumen (Art. 25): **Artikel nicht im Wortlaut geprüft** | https://www.fedlex.admin.ch/eli/cc/2009/615/de | A, Volltext nicht geöffnet |
| R11 | Tabak und E-Zigaretten | Abgabeverbot an Personen unter 18 seit 1.10.2024 für alle erfassten Produkte und alle Verkaufskanäle; Verkaufsstellen weisen das Verbot sichtbar aus; Testkäufe nach Entscheid der Kantone | https://www.bag.admin.ch/de/tabakproduktegesetz ; https://www.bag.admin.ch/de/faq-zur-umsetzung-des-tabakproduktegesetzes | A·S |
| R12 | Alkohol | Abgabealter nach Getränk (Bier und Wein, Spirituosen) im Merkblatt Jugendschutz; Werte im Wortlaut prüfen | https://so.ch/fileadmin/internet/ddi/ddi-gesa/PDF/Sucht/Merkblatt_Jugendschutzbestimmungen_Tabak_Alkohol.pdf | A·S |
| R13 | Lebensmittelbetrieb melden | Meldepflicht nach LGV Art. 20; Vollzug kantonal: Zürich nimmt Primärproduktion und direkten Verkauf von Primärprodukten ab Hof aus, Aargau verlangt Meldung aller Lebensmittelbetriebe; Bewilligung bei Verarbeitung tierischer Lebensmittel | https://www.fr.ch/de/articles/18945 ; https://internet.zh.ch/content/dam/zhweb/bilder-dokumente/themen/gesundheit/lebensmittelkontrollen/md_00121.pdf ; https://www.ag.ch/de/verwaltung/dgs/verbraucherschutz/lebensmittel/melde-bewilligungspflicht | A·S |
| R14 | Selbstkontrolle Direktvermarktung | Kantonslabor Thurgau nennt minimale Elemente der Selbstkontrolle für kleine Direktvermarkter; Vorlagen für Hofläden | https://kantlab.tg.ch/public/upload/assets/156842/Direktvermarktung_von_Lebensmitteln.pdf?fp=3 | A·S |
| R15 | Gewerbsmässige Tierbetreuung | Bewilligung für Tierheime und Tierbetreuungsdienste mit mehr als fünf Tieren (TSchV Art. 101); Ausbildungspflicht der verantwortlichen Person (Art. 102); Vollzug durch kantonale Veterinärdienste; Hundeschule allein: nicht belegt | https://www.blv.admin.ch/dam/de/sd-web/8JlYBZ6JjEhb/fachinformation-12.4-de.pdf ; https://so.ch/verwaltung/volkswirtschaftsdepartement/amt-fuer-landwirtschaft/tiere-und-lebensmittel/tierschutz/gewerbsmaessiger-umgang-mit-tieren/ | A·S |
| R16 | Schall und Laser an Veranstaltungen | V-NISSG seit 1.6.2019; über 93 dB(A): Meldung spätestens 14 Tage vorher, Pegel überwachen, Gehörschutz gratis; Grenzwerte 93, 96 oder 100 dB(A) je Art und Dauer; Laser der Klassen 1M, 2M, 3R, 3B und 4: Meldung 14 Tage vorher, Vollzug beim BAG | https://www.bag.admin.ch/de/schall-informationen-fuer-veranstalter ; https://www.bag.admin.ch/de/veranstaltungen-mit-laserstrahlung | A·S |
| R17 | Private Sicherheitsdienste: Bewilligung | Westschweizer Konkordat (FR, GE, JU, NE, VD, VS); Konkordat über private Sicherheitsdienstleistungen (KKJPD 2010) mit Betriebsbewilligung und persönlichen Bewilligungen für Leitung und Sicherheitsangestellte; nicht in allen Kantonen gleich | https://kr-geschaefte.zug.ch/dokumente/1285/13993_2116_1_Sicherheitsdienstleistungen.pdf ; https://www.ne.ch/autorites/DESC/PONE/securite-privee/Documents/BasesLegalesAllemand/1._konkordat_ueber_die_sicherheitsunternehmen.pdf | A·S |
| R18 | GAV private Sicherheitsdienstleistungen | allgemeinverbindlich seit 2014; gilt für Betriebe mit mindestens 10 Arbeitnehmenden (Wortlaut prüfen); Mindestlöhne 2026 nicht belegt | https://www.seco.admin.ch/dam/fr/sd-web/V9G9XkLEzegN/T%C3%A4tigkeitsbericht-TPK-Bund-SECO-2025-DE.pdf ; https://syna.ch/images/GAV/D_Kommentar_Stand_10.05.2023.pdf | A·V·S |
| R19 | Taxi (ARV 2) | heute: Bewilligung für berufsmässigen Personentransport, erhöhte medizinische Mindestanforderungen, Fahrtschreiber; Revision in der Vernehmlassung (App statt Fahrtschreiber oder engerer Geltungsbereich), Ausgang offen | https://www.astra.admin.ch/de/arv-2 ; https://www.zh.ch/bin/zhweb/publish/regierungsratsbeschluss-unterlagen./2026/279/RRB-2026-0279.pdf | A·S |
| R20 | Fahrlehrer:innen | Fahrlehrerbewilligung vom Wohnsitzkanton, unbefristet, für die ganze Schweiz (Fahrlehrerverordnung) | https://lexfind.ch/tolv/163442/de ; https://so.ch/services/berufsbewilligung-fuer-fahrlehrpersonen-beantragen/ | A·S |
| R21 | Postdienste (Kurier) | Meldepflicht bei der PostCom: ordentlich ab 500 000 Franken Jahresumsatz, sonst vereinfacht; Meldung innert zwei Monaten nach Geschäftsbeginn; Abgrenzung Kurier und Postdienst im Leitfaden 2025 | https://www.postcom.admin.ch/inhalte/PDF/Allgemeine_Informationen/Leitfaden_Meldepflicht_2025_DE_11_2025.pdf | A·S |
| R22 | Bestattung | kantonal geregelt; Beispiel Schwyz: Bestattung und Kremation bewilligungspflichtig, Bewilligung durch eine von der Gemeinde bezeichnete Amtsstelle; Basel-Stadt: Bestattungsverordnung 2021 | https://www.sz.ch/public/upload/assets/6160/575_111.pdf?fp=3 ; https://www.gesetzessammlung.bs.ch/frontend/versions/510/download_pdf_file?locale=de | A·S |
| R23 | Gesundheitsberufe | Berufsausübungsbewilligung für Tätigkeit in eigener fachlicher Verantwortung (GesBG Art. 11); Kantone dürfen strengere Regeln erlassen | https://www.bag.admin.ch/de/haeufige-fragen-faq-zum-gesundheitsberufegesetz-gesbg ; https://www.ag.ch/de/themen/gesundheit/gesundheitsberufe/berufsausuebungsbewilligungen/physiotherapeut-physiotherapeutin | A·S |
| R24 | Ambulante Tarife | TARDOC und ambulante Pauschalen seit 1.1.2026 in Kraft | https://www.bag.admin.ch/de/tardoc-und-ambulante-pauschalen | A·S |
| R25 | Gesundheitsdaten | besonders schützenswert (DSG Art. 5 Bst. c); Einwilligung ausdrücklich (Art. 6 Abs. 7) | https://www.fedlex.admin.ch/eli/cc/2022/491/de | Ü |
| R26 | Kinderbetreuung | Kindertagesstätten und private Horte bewilligungspflichtig, übrige entgeltliche Tagesbetreuung meldepflichtig, Aufsicht (PAVO, SR 211.222.338; Umsetzung kantonal) | https://stadtluzern.ch/_rte/publikation/102879 ; https://www.ag.ch/media/kanton-aargau/dgs/dokumente/gesellschaft/familie-gleichstellung/leitfaden/2023-01-19-fachunterlage-kibeg-bewilligung-und-aufsicht.pdf | A·S |
| R27 | Arbeitszeiterfassung | Verzeichnisse nach ArG Art. 46 und ArGV 1 Art. 73, Aufbewahrung 5 Jahre; vereinfachte Erfassung nach Art. 73b | https://www.seco.admin.ch/de/arbeitszeiterfassung ; https://www.seco.admin.ch/dam/de/sd-web/eusH7p61bF8V/ArGV1-Artikel-73b-SECO-AB-2016-DE.pdf | Ü |
| R28 | Kantonale Mindestlöhne 2026 | Genf 24.59 Fr./h; Neuenburg 21.35 Fr./h; Basel-Stadt 22.20 Fr./h (2027: 22.50; gilt nicht in Branchen mit allgemeinverbindlichem GAV); Tessin 20.00 bis 20.50 Fr./h je Wirtschaftszweig | https://www.ge.ch/actualite/salaire-minimum-genevois-2026-etablira-2459-fr-heure-1-10-2025 ; https://www.ne.ch/sites/default/files/2026-06/26612_com.pdf ; https://www.bs.ch/wsu/awa/arbeitsbeziehungen/loehne/mindestlohn/haeufige-fragen-zum-kantonalen-mindestlohn-faq ; https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/pdfatto/atto/11921 | Ü |
| R29 | Landesmantelvertrag Bauhauptgewerbe | in der SECO-Liste der allgemeinverbindlichen GAV geführt; Vorschlag für einen neuen LMV vom August 2025; Stand und Laufzeit 2026 **nicht belegt** | https://www.seco.admin.ch/dam/de/sd-web/h7cqLISavynZ/ave_bund_Oktober_2026_d.pdf ; https://unia.ch/fileadmin/user_upload/2025-08-29-Vorschlag_SBV_22._August_2025__neuer_LMV__%C3%84nderungen_sichtbar.pdf | A·V·S |
| R30 | Buchführung | Buchführungspflicht und Erleichterung für kleine Einzelunternehmen (OR Art. 957 ff.); Schwelle im Wortlaut prüfen | https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de | Ü, Volltext nicht geöffnet |

**Datenschutz-Besonderheiten im Screening:** Fahrzeug- und Rahmennummern mit Halter:in sind Personendaten; Schliesspläne und Schlüssel der Kundschaft sind sicherheitskritisch (eigenes Recht «Schlüssel sehen»); Tierakten enthalten Adressen und Abwesenheiten der Halter:innen (Ferien = leere Wohnung); Fotos von Personen (Fotografie) und Vorfallrapporte (Sicherheitsdienst) betreffen Dritte; Todesfall-Akten betreffen Verstorbene und Angehörige. Alles bleibt auf dem Gerät; geteilt wird nur, was die Person selbst als PDF teilt.

## 9. Schmerzen, Gründe gegen Software, Wechselgründe

Gilt für die fünf Kandidaten und die Mitnahmen; nach Gewicht geordnet. Ohne Statistik, im Pilot zu prüfen.

| # | Schmerz | Wo am stärksten |
|---|---|---|
| 1 | Aufträge auf Zetteln und im Kopf; Status unklar, Kundschaft ruft an («Ist mein Auto, mein Velo fertig?») | Garage, Velo, Textil, Schneiderei |
| 2 | Arbeitszeit und Teile je Auftrag nicht erfasst; die Rechnung fällt zu tief aus | Garage, Carrosserie, Velo |
| 3 | Rechnungen am Abend von Hand, Mahnungen vergessen, QR-Rechnung mühsam | alle |
| 4 | Vorschäden nicht dokumentiert; Fotos auf privaten Handys und im Messenger, Streit bei Abholung | Garage, Carrosserie, Fahrzeugreinigung |
| 5 | Lager unklar: Teile und eingelagerte Räder werden gesucht, Verderb wird nicht gemessen | Garage, Floristik, Hofladen |
| 6 | Erinnerungen an Service, Radwechsel, Impfungen, Abholung laufen über Papieragenda | Garage, Velo, Tierbetreuung |
| 7 | Bestellungen mit Liefertermin und Kartentext auf Notizzetteln; Fehler an Spitzentagen | Floristik, Hofladen |
| 8 | Belege und Kassenbuch für die Treuhand in der Schachtel; Tagesabschluss im Laden von Hand | alle mit Laden |
| 9 | Selbstkontrolle und Umwelt-Journal fehlen oder liegen als Papier im Ordner | Hofladen, Garage |
| 10 | Stempelzeiten und Absenzen der Mitarbeitenden auf Papier, Lohn-Vorbereitung am Monatsende | Garage, Laden mit Aushilfen |

**Warum heute keine Software:** zu wenig Zeit für Einführung; Programme für grössere Betriebe mit zu vielen Feldern; Pflicht zu Konto und Cloud weckt Misstrauen; Abos mit laufenden Kosten; Sprache (Mitarbeitende mit anderer Erstsprache); Angst, dass bei Netzausfall nichts mehr geht. **Was zum Wechsel bewegt:** ein Ablauf, der am ersten Tag Zeit spart (Annahme mit Foto und Abholschein in einer Minute), Rechnung direkt nach der Arbeit, kein Konto, alles auf dem eigenen Gerät, Papier-Weg (PDF) immer möglich, Empfehlung aus dem Verband oder von der Treuhand.

## 10. Aussendienst, Geräte, Sprachen und Saison

**Aussendienst:** Die fünf Kandidaten arbeiten überwiegend **am Ort** (Werkstatt, Laden, Hof, Pension). Draussen sind nur Lieferungen (Floristik, Hofladen), Gassi-Einsätze (Tierbetreuung), Pannenhilfe und Probefahrten (Garage). Stark draussen sind Kurier, Taxi, Sicherheitsdienst, Eventtechnik und Bestattung (alle W3 oder später).

**Folge für «Daten bleiben auf dem Gerät» (Stufe 1):**
- Ein **Betriebs-iPad** an Werkbank oder Ladentisch ist das Hauptgerät; Handy der Inhaber:in und Büro-Computer koppeln im WLAN des Betriebs (Kopplung der Geräte nach Albans Entscheid zu Randen W13).
- Annahmeschein, Kostenvoranschlag und Rechnung gehen als PDF über das Teilen-Menü des Geräts an die Kundschaft (Mail oder Messenger, den die Person selbst wählt).
- Lieferungen und Gassi-Einsätze: Tagesliste am Morgen auf das Handy, Nachweis offline (Unterschrift, Foto), Abgleich bei Rückkehr im WLAN.
- Freigabe eines Kostenvoranschlags am Telefon als Notiz mit Zeitpunkt; Unterschrift auf dem Gerät bei Abholung.

**Erst Stufe 2 (Server, braucht Albans JA):** Statusabfrage durch die Kundschaft im Web («fertig?»), Online-Buchung von Lektionen und Pensionsplätzen, Live-Disposition für Kurier und Taxi, Abgleich zwischen mehreren Filialen ohne gemeinsames WLAN.

**Sprachen:** Kundschaft und Dokumente in Deutsch, Französisch und Italienisch je nach Landesteil. Die Sprachen der Mitarbeitenden sind für diese Branchen **nicht belegt**; Annahme: in Garagen, Textilpflege und Kurierdiensten arbeiten viele Personen mit anderer Erstsprache, darum kurze Texte, Symbole, Fotos statt Freitext.

**Saison (Branchenbeschreibung, Annahme):** Garage mit zwei Spitzen beim Radwechsel (Frühling, Herbst); Velo mit Hochsaison im Frühling und Sommer; Floristik mit Spitzen an Valentinstag, Muttertag, Allerheiligen, Advent und in der Hochzeitszeit; Hofladen nach Ernte; Tierpension in den Schulferien; Fahrzeugreinigung nach Winter und Pollenzeit.

## 11. MVP und Wellen

**MVP für den ersten Pilot (Garage oder Velowerkstatt, 4 bis 8 Wochen, höchstens 8 Punkte):**
1. Annahme mit Gegenstand der Kundschaft (Kontrollschild oder Rahmennummer), Pflichtfotos, Wunsch, Abholtermin; Annahmeschein als PDF.
2. Arbeitsliste der Werkstatt nach Status (angenommen, in Arbeit, wartet auf Freigabe oder Teile, fertig, abgeholt).
3. Stempeln auf den Auftrag und Teile aus dem Lager buchen (Ledger).
4. Kostenvoranschlag mit Freigabegrenze; Freigabe als Unterschrift oder Telefonnotiz.
5. Rechnung mit QR-Rechnung aus dem Auftrag; Barzahlung bei Abholung im Kassenbuch.
6. Leistungskatalog mit Arbeitswerten und Service-Paketen (Richtwerte, vom Betrieb änderbar).
7. Erinnerungen: Abholung, nächster Service, Radwechsel.
8. Monatspaket für die Treuhand (Rechnungen, Belege, Kasse) und Sicherung.

**Welle 2:** Einlagerung fremder Ware (Räder) mit Lagerplatz; Carrosserie-Schadenprotokoll; Mahnungen; Ersatzwagen mit Reservation; Umwelt-Journal (Altöl, Abscheider-Kontrolle) als Checkliste; Velowerkstatt als zweite Branche auf demselben Modul.
**Welle 3:** Laden und Verkauf mit Tagesabschluss (Floristik, Hofladen); Bestellung mit Liefertermin; Etiketten aus Randen; Tierakte und Belegung; Mitnahmen Textilpflege, Schneiderei, Schuh- und Schlüsselservice, Fahrzeugreinigung; Fahrschule und Nachhilfe über Termine und Kurse; Kurier, Eventtechnik, Fotografie.
**W4+ (nur auf Nachfrage):** Kiosk mit Kassen-Hardware, Sicherheitsdienst, Taxi (nach der Revision der ARV 2), Bestattung, Schliesspläne, Kleinbaugeschäft.
**Nie (ausser Scope):** Gesundheit mit Abrechnung an Versicherer, Kinderbetreuung, Treuhand als Branche, Bauhauptgewerbe gross; Anbindungen an Teilekataloge, Diagnosegeräte, Versicherungs-Plattformen, Fahrten-Vermittlung, Lotto, Behörden-Plattformen der Landwirtschaft; Ortung von Mitarbeitenden.

## 12. Demo-Betrieb (erfunden)

**«Garage Muster GmbH»**, Musterwil, 6 Personen, MWST mit Saldosteuersatz (Satz vom Betrieb eingetragen).
- Team: Inhaber (Werkstattchef), eine Automobil-Mechatronikerin, ein Automobil-Fachmann, ein Lernender im 2. Lehrjahr, eine Büro-Mitarbeiterin (50 %), eine Aushilfe in der Radwechsel-Saison.
- Kundschaft: 40 Privatkund:innen (erfundene Namen wie «Muster Anna», «Beispiel Marco»), eine Flotte von 5 Lieferwagen einer «Bäckerei Beispiel».
- Aufträge der Demo: Service mit Bremsen (Freigabe am Telefon), Radwechsel mit Einlagerung von 4 Rädern auf Platz «R-12», Vorschaden-Fotos bei Annahme, Kostenvoranschlag über der Freigabegrenze, Rechnung mit QR-Rechnung, ein nicht abgeholtes Fahrzeug mit Erinnerung.
- Lager: Öl in Litern (drei Nachkommastellen), Filter, Bremsbeläge, Wischerblätter; Altöl im Umwelt-Journal.

**Zweiter Demo-Betrieb «Velowerkstatt Beispiel»**, 3 Personen mit Lernender, Laden und Werkstatt, Service-Pakete «Basis» und «Gross», Annahme am Ladentisch.

## 13. Risiken, offene Fragen und Eignung

**Risiken:**
| Risiko | Folge | Gegenmassnahme |
|---|---|---|
| Garagen erwarten Anbindungen an Teilekataloge und Diagnose | App wirkt unvollständig | klar sagen: von Hand oder Foto mit Texterkennung; Teile-Favoriten im Lager |
| Haftung bei Vorschäden und eingelagerter Ware | Streit mit Kundschaft | Pflichtfotos bei Annahme, Annahmeschein mit Unterschrift, gesperrt nach Unterschrift |
| Kassen-Hardware (Drucker, Scanner, Schublade) | Aufwand, Gerätevielfalt | Laden-Kasse ohne Hardware im MVP; Hardware als eigener Entscheid |
| Rechtswerte (GAV, Saldosteuersätze) ändern jährlich, viele nicht belegt | falsche Hinweise | nur mit Quelle und Stand, Richtwert, Betrieb trägt Satz ein |
| Hofladen zwischen Randen und eigener Ausgabe | doppelte Arbeit | Entscheid Alban (Frage 3) |
| Zu viele kleine Branchen | Zersplitterung | Muster in die Plattform (Abschnitt 2), Branchen nur als Vorlagen |

**Offene Fragen für Alban:**
1. Soll «Annahme und Werkstatt» als Plattform-Modul gebaut werden, und erscheint es in einer eigenen Ausgabe für Werkstätten (Garage, Velo) oder als Funktion bestehender Ausgaben?
2. Wie weit geht die Laden-Kasse: nur Kassenbuch mit Artikeln oder später Registrierkasse mit Belegdrucker und Scanner?
3. Gehört die Direktvermarktung (Hofladen) als Funktion zu Randen oder in eine eigene Ausgabe?
4. Bestätigst du «ausser Scope» für Gesundheit mit Versicherer-Abrechnung, Kinderbetreuung, Treuhand und grosses Bauhauptgewerbe, und die Grenzfälle (Massage ohne Versicherer, Kurse für Kinder)?
5. Wann kommt Stufe 2 für Statusabfrage und Online-Buchung, die Werkstätten und Hundeschulen am meisten wünschen dürften?
6. Taxi und Sicherheitsdienst: bis zur Revision der ARV 2 und bis zu einer Nachfrage zurückstellen?

**Eignung:**
| Gruppe | Note | Begründung | Welle |
|---|---|---|---|
| Garage, Carrosserie, Velowerkstatt | 4 | grosser täglicher Nutzen, hohe Wiederverwendung (Aufträge, Zeit, Lager, Rechnung), ein neues Modul trägt drei Branchen, Recht überschaubar | W2 |
| Floristik, Hofladen, Tierbetreuung | 4 | hohe Wiederverwendung aus Randen, Kurse, Beherbergung; brauchen Laden-Kasse oder Belegung zuerst | W3 |
| Textil, Schneiderei, Schuh und Schlüssel, Fahrzeugreinigung, Fahrschule, Nachhilfe, Kurier, Fotografie, Eventtechnik | 3 | Nutzen da, aber kleine Betriebe oder Spezialmodul nötig | W3 |
| Kiosk, Sicherheitsdienst, Taxi, Bestattung | 2 bis 3 | Hardware, Recht in Bewegung, sensible Daten oder Server nötig | W4+ |
| Gesundheit, Kinderbetreuung, Treuhand, Bauhauptgewerbe gross | 1 | Recht, Haftung, Daten, Partner-Anbindung oder Grösse | ausser Scope |

## 14. Quellen (geprüft am 24.11.2026, über Suchauszüge)

| Kürzel | Quelle | URL |
|---|---|---|
| Q1 | EKAS, Kurzbeschrieb Branchenlösung 16 (Auto-, Carrosserie- und Zweiradgewerbe), 2023 | https://ekas.admin.ch/fileadmin/Dokumente/Kurzbeschriebe_ueBL_ASA-Loesungen/Branchenloesungen/DE/BL_16_KB_2023_d.pdf |
| Q2 | Auto Gewerbe Verband Schweiz, Vademecum 2017 | https://www.agvs-upsa.ch/sites/default/files/global_files/vademecum2017_de_fuer_internet.pdf |
| Q3 | Syna, GAV Carrosseriegewerbe, Änderung Bundesratsbeschluss 11.8.2026 | https://syna.ch/images/gav_carrosserie_Änderung_Änderung_GB_11_08_2026_DE.pdf |
| Q4 | SECO, allgemeinverbindlich erklärte GAV, Stand Oktober 2026 | https://www.seco.admin.ch/dam/de/sd-web/h7cqLISavynZ/ave_bund_Oktober_2026_d.pdf |
| Q5 | SECO, Tabelle allgemeinverbindlich erklärter GAV 2024 | https://seco.admin.ch/dam/seco/de/dokumente/Arbeit/Personenfreizuegigkeit/Gesamtarbeitsvertr%C3%A4ge%20und%20Normalarbeitsvertr%C3%A4ge/artikel_gav_tabelle_2024.pdf.download.pdf/Tabellen%203%20Sprachen%20f%C3%BCr%202024.pdf |
| Q6 | SECO, Tätigkeitsbericht TPK Bund 2025 | https://www.seco.admin.ch/dam/fr/sd-web/V9G9XkLEzegN/T%C3%A4tigkeitsbericht-TPK-Bund-SECO-2025-DE.pdf |
| Q7 | Kanton Schwyz, Interkantonales Merkblatt Umweltschutz im Auto- und Transportgewerbe | https://www.sz.ch/public/upload/assets/59237/Umweltschutz_im_Auto-_und_Transportgewerbe_Interkantonales_Merkblatt.pdf?fp=5 |
| Q8 | Kanton Appenzell Ausserrhoden, Merkblatt Auto- und Transportgewerbe 2021 | https://ar.ch/fileadmin/user_upload/Departement_Bau_Volkswirtschaft/Amt_fuer_Umwelt/Umwelt/Publikationen/Merkblaetter/Bau/Merkblatt-Auto-und-Transportgewerbe_2021.pdf |
| Q9 | Saldosteuersätze: Fassung 2018 (lexfind) und ESTV Saldosteuersatzmethode 2025 | https://lexfind.ch/tolv/165184/de ; https://www.estv.admin.ch/de/mwst-saldosteuersatzmethode-2025 |
| Q10 | Medienbericht zur Floristik (Einpersonenbetriebe, weniger Lernende) | https://www.blick.ch/wirtschaft/immer-weniger-floristik-lehrlinge-das-geschaeft-blueht-die-branche-kriselt-id17467587.html |
| Q11 | Berufsberatung, Florist:in EFZ | https://www.berufsberatung.ch/de/berufe/florist-in-efz |
| Q12 | Bund, Mitteilung zur landwirtschaftlichen Strukturerhebung 2025 (Zuordnung prüfen) | https://www.admin.ch/de/newnsb/6m_yy2w_Wc17KvKg7BCtK |
| Q13 | Kantonales Labor Zürich, Merkblatt Meldepflicht | https://internet.zh.ch/content/dam/zhweb/bilder-dokumente/themen/gesundheit/lebensmittelkontrollen/md_00121.pdf |
| Q14 | Kanton Aargau, Melde- und Bewilligungspflicht für Lebensmittelbetriebe | https://www.ag.ch/de/verwaltung/dgs/verbraucherschutz/lebensmittel/melde-bewilligungspflicht |
| Q15 | Kanton Freiburg, Meldepflicht (Art. 20 LGV) | https://www.fr.ch/de/articles/18945 |
| Q16 | Kantonales Laboratorium Thurgau, Direktvermarktung von Lebensmitteln | https://kantlab.tg.ch/public/upload/assets/156842/Direktvermarktung_von_Lebensmitteln.pdf?fp=3 |
| Q17 | BAG, Tabakproduktegesetz und FAQ | https://www.bag.admin.ch/de/tabakproduktegesetz ; https://www.bag.admin.ch/de/faq-zur-umsetzung-des-tabakproduktegesetzes |
| Q18 | Kanton Solothurn, Merkblatt Jugendschutzbestimmungen Tabak und Alkohol | https://so.ch/fileadmin/internet/ddi/ddi-gesa/PDF/Sucht/Merkblatt_Jugendschutzbestimmungen_Tabak_Alkohol.pdf |
| Q19 | PostCom, Leitfaden Meldepflicht 2025 | https://www.postcom.admin.ch/inhalte/PDF/Allgemeine_Informationen/Leitfaden_Meldepflicht_2025_DE_11_2025.pdf |
| Q20 | PostCom, Jahresbericht 2025 | https://www.postcom.admin.ch/dam/de/sd-web/-RHTxJt5CVB6/PostCom%20Jahresbericht%202025.pdf |
| Q21 | ASTRA, ARV 2 | https://www.astra.admin.ch/de/arv-2 |
| Q22 | Kanton Zürich, Regierungsratsbeschluss 2026/279 (Vernehmlassung ARV 2) | https://www.zh.ch/bin/zhweb/publish/regierungsratsbeschluss-unterlagen./2026/279/RRB-2026-0279.pdf |
| Q23 | Kanton Zug, Vorlage Sicherheitsdienstleistungen (Konkordat KKJPD) | https://kr-geschaefte.zug.ch/dokumente/1285/13993_2116_1_Sicherheitsdienstleistungen.pdf |
| Q24 | Kanton Neuenburg, Konkordat über die Sicherheitsunternehmen (deutsche Fassung) | https://www.ne.ch/autorites/DESC/PONE/securite-privee/Documents/BasesLegalesAllemand/1._konkordat_ueber_die_sicherheitsunternehmen.pdf |
| Q25 | Syna, GAV private Sicherheitsdienstleistungen: Kommentar 2023 und Text ab 1.1.2024 | https://syna.ch/images/GAV/D_Kommentar_Stand_10.05.2023.pdf ; https://syna.ch/images/GAV/GAV_d-Version-ab-1_1_2024.pdf |
| Q26 | BLV, Fachinformation 12.4; Kanton Solothurn, gewerbsmässiger Umgang mit Tieren | https://www.blv.admin.ch/dam/de/sd-web/8JlYBZ6JjEhb/fachinformation-12.4-de.pdf ; https://so.ch/verwaltung/volkswirtschaftsdepartement/amt-fuer-landwirtschaft/tiere-und-lebensmittel/tierschutz/gewerbsmaessiger-umgang-mit-tieren/ |
| Q27 | BAG, Schall: Informationen für Veranstalter; Veranstaltungen mit Laserstrahlung | https://www.bag.admin.ch/de/schall-informationen-fuer-veranstalter ; https://www.bag.admin.ch/de/veranstaltungen-mit-laserstrahlung |
| Q28 | Fahrlehrerverordnung (lexfind); Kanton Solothurn, Berufsbewilligung Fahrlehrpersonen | https://lexfind.ch/tolv/163442/de ; https://so.ch/services/berufsbewilligung-fuer-fahrlehrpersonen-beantragen/ |
| Q29 | Kanton Schwyz, Bestattungsrecht; Basel-Stadt, Bestattungsverordnung 2021; ch.ch, Checkliste Todesfall | https://www.sz.ch/public/upload/assets/6160/575_111.pdf?fp=3 ; https://www.gesetzessammlung.bs.ch/frontend/versions/510/download_pdf_file?locale=de ; https://ch.ch/de/familie-und-partnerschaft/todesfall/todesfall:-checkliste |
| Q30 | BAG, FAQ Gesundheitsberufegesetz; Kanton Aargau, Bewilligung Physiotherapie; Kanton Zürich, Merkblatt Physiotherapie | https://www.bag.admin.ch/de/haeufige-fragen-faq-zum-gesundheitsberufegesetz-gesbg ; https://www.ag.ch/de/themen/gesundheit/gesundheitsberufe/berufsausuebungsbewilligungen/physiotherapeut-physiotherapeutin ; https://www.zh.ch/content/dam/zhweb/bilder-dokumente/themen/gesundheit/gesundheitsberufe/merkblaetter_neu/merkblatt_physiotherapie_nov_2023.pdf |
| Q31 | BAG, TARDOC und ambulante Pauschalen | https://www.bag.admin.ch/de/tardoc-und-ambulante-pauschalen |
| Q32 | Stadt Luzern, Publikation zur PAVO; Kanton Aargau, Fachunterlage Bewilligung und Aufsicht Kinderbetreuung | https://stadtluzern.ch/_rte/publikation/102879 ; https://www.ag.ch/media/kanton-aargau/dgs/dokumente/gesellschaft/familie-gleichstellung/leitfaden/2023-01-19-fachunterlage-kibeg-bewilligung-und-aufsicht.pdf |
| Q33 | Unia, Vorschlag neuer LMV (August 2025) | https://unia.ch/fileadmin/user_upload/2025-08-29-Vorschlag_SBV_22._August_2025__neuer_LMV__%C3%84nderungen_sichtbar.pdf |
| Ü-MWSTG | Mehrwertsteuergesetz (fedlex) | https://www.fedlex.admin.ch/eli/cc/2009/615/de |
| Ü-DSG | Datenschutzgesetz (fedlex) | https://www.fedlex.admin.ch/eli/cc/2022/491/de |
| Ü-OR | Obligationenrecht (fedlex) | https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de |

**Nachtrag für die umsetzende Person:** Die Zahlen der Arbeitsstätten und Beschäftigten je NOGA-Klasse (45.20, 47.76, 53.20, 74.20, 80.10, 85.53, 95.23, 95.29, 96.01, 96.03, 96.09) stehen in STAT-TAB, Tabelle `px-x-0602010000_103`. Der Host `www.pxweb.bfs.admin.ch` war in dieser Sitzung nicht erlaubt; ebenso `fedlex.data.admin.ch` (Saldosteuersätze SR 641.202.62). Wer Zugang hat, trägt die Werte mit Stand nach.

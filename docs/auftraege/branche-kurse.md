# Branche Fitness, Studios und Kursbetriebe (`courses`)

- **Rolle:** Branchen-Agent
- **Voraussetzung:** W0-01, W0-02, W0-03 und W1-00 fertig; P-21, P-22, P-24, P-27, P-28, P-32 und P-33 aus Welle 1 mindestens «alpha»; P-29, P-30 und P-31 aus Welle 2 mindestens «alpha»; P-41 und P-42 aus Welle 3 «alpha» für B-8 und B-11; P-50, P-51 und P-52 aus Welle 4 als Verträge «alpha» (Schemas, Namen, Ports). Die Ausgabe «Studio» steht als Rahmen (Kopf), und der Kopf hat im Namensregister die Namensräume der Branche `courses` und des Pakets `@onestrand/courses` (P-52) getrennt. Je Paket gilt die Tabelle unten.
- **Welle:** W4

## Ziel

Ein Fitnessstudio, ein Kursstudio oder eine Kurs-, Tanz-, Kampfsport-, Musik- oder Hundeschule mit 1 bis 20 Personen arbeitet in der Ausgabe «Studio» auf einem iPad an der Theke und ohne Netz: Mitglieder mit Mitgliedschaften, deren Fristen die App kennt, Mehrfachkarten mit Restguthaben, Check-in mit Ampel, Kursplan mit Plätzen und Warteliste, Rechnungen und Raten mit QR-Zahlteil und Mahnung, Verkauf an der Theke und ein Monatspaket für die Treuhand. Die Branche liegt ganz in `industries/courses/`, dockt nur über Steckplätze an ([ADR-0004](../adr/0004-andocken-einer-branche.md)) und baut nichts, was die Plattform hat oder baut: Mitgliedschaften und Mehrfachkarten sind P-51, Kurse mit Plätzen P-52, Termine P-50.

## Lesestoff

1. `CLAUDE.md`, `AGENTS.md`, [`../zusammenarbeit.md`](../zusammenarbeit.md)
2. Steckbrief [`../branchen/kurse.md`](../branchen/kurse.md), verbindlich, ganz
3. Recherche [`../branchen/kurse-recherche.md`](../branchen/kurse-recherche.md), nicht verbindlich; für Einzelheiten (Tarife in 6.1, Kursarten in 6.2, Checklisten in 6.3, Quellen in Abschnitt 8)
4. [`../plattform.md`](../plattform.md), [`../architektur.md`](../architektur.md), Abschnitte 4 bis 7
5. ADRs [0004](../adr/0004-andocken-einer-branche.md), [0005](../adr/0005-gemeinsames-datenmodell.md), [0006](../adr/0006-geraete-und-abgleich.md), [0007](../adr/0007-sprachen.md), [0009](../adr/0009-grundsaetze-aus-randen.md), [0010](../adr/0010-rechnungen-als-vorsystem.md), [0011](../adr/0011-oeffentliches-repo.md); offene Fragen in [`../entscheide.md`](../entscheide.md), besonders S-06, S-07, S-08, S-09, S-12, S-14, S-17, S-18
6. [`../fakten/`](../fakten/README.md) und die `api.md` jedes Plattform-Pakets, das ein Paket braucht, besonders P-50, P-51 und P-52
7. `industries/muster/` als Vorbild für Manifeste und Steckplätze
8. Nur als Muster für Texte, Screens, Gerätemodi und Lektionen: Randen (`BanioX/Randen`, nur lesen) `docs/regeln.md`, `docs/design.md`, `docs/lernbuch.md`

## Pfade

- **Schreiben:** `industries/courses/` (`core/`, `web/`, `NAMES.md`); `docs/branchen/kurse.md` (nur Abschnitt 9 «geprüft am» und Abschnitt 16 «Stand»); `docs/branchen/kurse/adr/CRS-NNNN-<titel>.md` (eigene ADRs mit Präfix `CRS`); `docs/branchen/kurse/antraege.md` (Plattform-Anträge); `docs/branchen/kurse/schulden.md`, `docs/branchen/kurse/lernbuch.md`
- **Nur lesen:** `docs/branchen/kurse-recherche.md`, `platform/`, `editions/`, `registry/`, `industries/muster/`, übriges `docs/`, `BanioX/Randen`
- **Tabu:** `platform/` (auch `platform/courses`, `platform/contracts`, `platform/scheduling`), `editions/`, `registry/` (neue Kennungen als Vorschlag in `industries/courses/NAMES.md`, der Kopf trägt ein), `tools/`, Wurzel-Konfiguration, `pnpm-lock.yaml` und neue Abhängigkeiten (nur per Plattform-Antrag), andere Branchen unter `industries/` (auch `industries/salon/`: Massage oder Kosmetik im Studio kommt, indem der Betrieb «Termine» einschaltet, nie über einen Import), `docs/` ausserhalb `docs/branchen/kurse*`, `BanioX/Randen` und `BanioX/Rettich` (nie schreiben)

## Pakete in dieser Reihenfolge

Ein Paket ist fertig, wenn seine Abnahme erfüllt ist und `pnpm check` sowie `pnpm check:industry courses` grün sind. Fehlt einem Paket ein Plattform-Paket, wartet es oder arbeitet hinter einem Port in `industries/courses/` mit einfacher Umsetzung und Plattform-Antrag ([`../zusammenarbeit.md`](../zusammenarbeit.md), Abschnitt 5); eine eigene Fassung von P-50, P-51 oder P-52 baut die Branche nie. Regeln mit (P) im Steckbrief gehören der Plattform: Die Branche schreibt dafür Tests mit den Zahlen des Steckbriefs gegen den Vertrag und meldet Abweichungen als Antrag. Gerechnet wird in Ganzzahlen (Rappen, Basispunkte, Minuten, Einheiten), je Zeile einmal gerundet; Tage als `YYYY-MM-DD` (Europe/Zurich).

| Paket | Braucht (Welle) |
| --- | --- |
| B-1 | W0-02, W0-03 (P-06, P-07, P-09), P-21 (W1-01), P-22 (W1-02), P-24 (W1-03); Ausgabe «Studio» und Namensregister (Kopf) |
| B-2 | P-22 (W1-02), P-33 (W1-06), P-28 (W1-06), P-10, P-11 (W0-03), P-50 (W4 «alpha») für Probetrainings |
| B-3 | P-51 (W4 «alpha»), P-24, P-28, P-10 Unterschrift, P-11 |
| B-4 | P-51 Mehrfachkarten (W4 «alpha»), P-30 Verkauf (W2) |
| B-5 | B-3, B-4; Gerätemodi in P-06 und P-09 (Antrag), P-10 QR lesen, P-11 Karte drucken |
| B-6 | P-52 (W4 «alpha»), P-50 Ressourcen (W4), P-28, P-11; Port «Einheit abbuchen» zu P-51 (Antrag) |
| B-7 | P-29 (W2), P-51 (W4), P-28; Bankdatei nach [S-08](../entscheide.md) |
| B-8 | P-30 (W2), P-24, P-41 (W3) mit Ablaufdatum je Charge (Antrag) |
| B-9 | P-32 (W0-03), P-30 Monatspaket (W2), P-31 (W2) |
| B-10 | P-31 (W2), P-52, P-21 heikle Rechte, P-11 |
| B-11 | P-42 (W3), P-27 (W1-05), P-22, P-33, P-11 |
| B-12 | P-29 Zahlungsbestätigung (W2); Tarif 595 erst nach [S-18](../entscheide.md) |

### B-1 Gerüst, Einrichten und Vorlagen

- **Ziel:** Die Branche erscheint in der Ausgabe «Studio»; ein Betrieb richtet sich nach seiner Betriebsart ein.
- **Umfang:** `defineIndustry` und `defineIndustryWeb` nach `industries/muster`; Betriebsarten `courses.fitness`, `courses.functional`, `courses.yoga_pilates`, `courses.martial_arts`, `courses.dance`, `courses.personal_training`, `courses.climbing`, `courses.swimming`, `courses.music_school`, `courses.dog_school` (mehrfach wählbar); Funktionen aus Steckbrief Abschnitt 2 und 6 im Register mit Abhängigkeiten (`courses.members`, `courses.trials`, `courses.memberships`, `courses.punch_cards`, `courses.check_in`, `courses.classes`, `courses.venues`, `courses.billing`, `courses.instructors`, `courses.safety`, `courses.kids`, `courses.grades`, `courses.rentals`, `courses.appointments`, `courses.insurer_receipts`); Option «Theke mit Verkauf»; Fragen beim Einrichten und Umfang «Schlank», «Üblich», «Alles» (Abschnitt 7); Lexikon und Texte (Abschnitt 11); Rollen-Vorlagen (Abschnitt 8) auf Basis der Plattform-Vorlagen; Vorlagen für Tarife, Kursarten und Checklisten ohne Preise und mit leeren Fristen; Demo-Grundgerüst (Betrieb, Team, Tarife aus Abschnitt 13); `NAMES.md` mit allen Kennungen.
- **Abnahme:**
  - [ ] `pnpm check:industry courses` grün; jede Kennung steht in `NAMES.md` mit Präfix `courses`; keine Funktion trägt den Namen einer Betriebsart, und keine Kennung kollidiert mit den Kennungen von P-52 im Namensregister.
  - [ ] Einrichten mit «Personal Training, 1 Person» schaltet «Schlank» mit `courses.punch_cards` und `courses.appointments` ohne `courses.check_in`; «Fitness mit Theke und Kursen, 6 Personen, Kinder ja» schaltet Check-in, Kursplan, Kasse, Lager, Kinder und die Rollen aus Abschnitt 8.
  - [ ] Die Frage nach dem Kündigungsstichtag zeigt das Beispiel aus Steckbrief 6.2 mit beiden Regeln und hat keine Vorbelegung.
  - [ ] Die Tarif-Vorlage legt alle Tarife aus Steckbrief Abschnitt 7 ohne Preis und mit leerer Frist an; ein Tarif ohne Preis zeigt «Preis fehlt».
  - [ ] Eine ausgeschaltete Funktion hinterlässt keinen Einstieg; ihre Daten bleiben.
  - [ ] Texttest: «du», «ss», kein Ausrufezeichen, nie «Abo», «Paket» oder «freischalten», keine Namen von Labels, Geräteherstellern oder Software-Produkten.

### B-2 Mitglieder, Interessent:innen und Import

- **Ziel:** Die bestehende Mitgliederliste ist in Minuten in der App, und aus Probetrainings werden Mitglieder.
- **Umfang:** Tabellen `courses_member_profiles`, `courses_member_cards`, `courses_leads`, `courses_trial_visits`; Mitglied als Kundschaft von P-22 mit Eltern, Firma und Notfallkontakt; Mitgliednummer nur vom Hauptgerät; Import aus der Tabellenkalkulation als CSV mit Zuordnung der Spalten (Mitglieder und laufende Mitgliedschaften); Probetraining als Termin (P-50) oder Lektion (P-52); Nachfassen über P-28; Einwilligungen; Löschfristen; Auskunft nach DSG als PDF.
- **Abnahme:**
  - [ ] Ein CSV mit 250 Zeilen (Demo) legt Mitglieder und Mitgliedschaften an; Zeilen mit Fehlern erscheinen in einer Liste mit Grund, nichts wird still verworfen.
  - [ ] `courses_member_profiles` hat kein Feld für Gesundheitsangaben; ein Texttest findet in Formularen, PDF und Export weder Fragen zur Gesundheit noch eine Diagnose; gespeichert wird nur «Einschränkungen besprochen am» ([S-12](../entscheide.md)).
  - [ ] «Minderjährig» rechnet die App erst aus dem Geburtsdatum, wenn die Altersgrenze in Steckbrief Abschnitt 9 «geprüft am» trägt; bis dahin fragt sie.
  - [ ] Ein Foto am Mitglied geht nur mit Einwilligung; ohne Einwilligung bietet das Formular kein Foto an.
  - [ ] Eine Interessentin ohne Abschluss erscheint nach Ablauf der Frist des Betriebs in «Löschen vorgeschlagen»; gelöscht wird erst auf Bestätigung.

### B-3 Tarife und Mitgliedschaften

- **Ziel:** Jede Mitgliedschaft kennt Ende, Stichtag und Verlängerung, ohne Kopfrechnen.
- **Umfang:** Tabellen `courses_tariffs`, `courses_membership_terms`, `courses_pause_notes`; Mitgliedschaft als Vertrag von P-51 aus der Tarif-Vorlage; Pause, Kündigung mit Eingang und Kanal, Verlängerung, Preisänderung, Ersatzmitglied, Kulanz als Befehl mit Grund; Erinnerungen über P-28; Vertrag mit Kasten «Verlängerung und Kündigung», Bestätigung der Pause, Kündigungsbestätigung und Mitteilung einer Preisänderung als PDF; Tests gegen P-51 mit den Zahlen aus Steckbrief 6.2.
- **Abnahme:**
  - [ ] Unit-Tests exakt nach Steckbrief 6.2: Beginn 2026-03-01, 12 Monate, Ende 2027-02-28; mit Pause 2026-07-01 bis 2026-07-21 Ende 2027-03-21; Stichtag `day_for_day` 2026-12-28, `month_end` 2026-12-31, mit Pause beide 2027-01-21; Verlängerung 2027-03-01 bis 2028-02-29.
  - [ ] Eine Kündigung mit Eingang 2026-12-30 zeigt den Text aus 6.2 mit beiden Daten und ohne Urteil; Kulanz verlangt einen Grund und bleibt als Zeile sichtbar.
  - [ ] Ein Texttest findet weder «gültig», «ungültig», «zulässig» noch «unzulässig» in Texten zu Kündigung, Verlängerung und Ablauf.
  - [ ] Eine Preisänderung trifft nur die nächste Laufzeit und nur, wenn sie vor dem Stichtag mitgeteilt wurde; während einer Laufzeit bleibt der Preis.
  - [ ] Ein Pausengrund hat nur `certificate_seen`, `service`, `travel`, `other`; kein Feld für eine Diagnose oder eine Datei.
  - [ ] Der Vertrag einer minderjährigen Person verlangt die Unterschrift der gesetzlichen Vertretung; der Kasten «Verlängerung und Kündigung» steht getrennt und wird eigens bestätigt.

### B-4 Mehrfachkarten und Eintritte

- **Ziel:** Restguthaben und Ablauf sind ohne Streit klar.
- **Umfang:** Tabellen `courses_card_details`, `courses_day_passes`; Mehrfachkarte als Ledger von P-51; Einheiten je Angebot; Geschenk (Käufer:in ungleich Inhaber:in); Tageseintritt über den Verkauf von P-30; Ablaufhinweis; Kaufbeleg, Geschenkkarte und Bestätigung des Restguthabens als PDF.
- **Abnahme:**
  - [ ] Unit-Test exakt nach 6.3: 22 000, 10 Einheiten, 4 benutzt: Rest 6, Restwert 13 200; eine Lektion mit 2 Einheiten: Rest 4; kein gespeichertes Feld für den Rest.
  - [ ] Nach `validUntil` verfällt nichts von selbst; «abgelaufen» bucht nur eine Person mit Recht, nach dem Hinweis mit Quelle aus Abschnitt 9; eine Korrektur ist eine neue Zeile.
  - [ ] Das offene Guthaben aller Karten erscheint als Summe der Restwerte.

### B-5 Check-in an der Theke

- **Ziel:** An der Theke zeigt die App in einer Sekunde, ob alles in Ordnung ist und warum nicht.
- **Umfang:** Tabelle `courses_visits` als Ledger; Gerätemodi «Theke» und «Selbst-Check-in» (Antrag an P-06 und P-09, sonst hinter einem Port), verlassen mit PIN; Suche nach Name oder Nummer; Karte mit QR drucken und nach Tipp lesen, Fallback Nummer; Warnungen aus Steckbrief 6.4; Einheit abbuchen; Kennzahlen der Besuche.
- **Abnahme:**
  - [ ] Unit-Test je Warnung: abgelaufen, gekündigt und Ende vorbei, Pause aktiv, Karte leer, Karte gesperrt, ausserhalb des Zeitfensters, Zahlung überfällig; jede Warnung ist ein Satz in Worten, keine Farbe allein.
  - [ ] Die App sperrt niemanden; ein Check-in mit Warnung braucht eine Bestätigung an der Theke und hält sie fest.
  - [ ] Im Gerätemodus «Selbst-Check-in» zeigt die App keinen Namen anderer, keinen Zahlungsstand und keine Liste; bei jeder Warnung nur «Bitte melde dich an der Theke». Die Kamera startet nur nach Tipp.
  - [ ] Eine Rolle ohne Recht «Rechnungen» sieht statt «Zahlung überfällig» nur «bitte an die Leitung».
  - [ ] E2E im Offline-Modus: 20 Check-ins mit Name, Nummer und QR-Karte, davon 3 mit Warnung.

### B-6 Kursplan mit Plätzen und Warteliste

- **Ziel:** Buchen, Warteliste und Anwesenheit laufen ohne Messenger-Gruppe.
- **Umfang:** Tabellen `courses_class_types`, `courses_class_policies`, `courses_venue_rentals`; Kurse, Reihen, Lektionen, Buchungen und Warteliste aus P-52; Wochenraster, auf dem iPad quer als Plantafel; Abmeldefrist, `late_cancel`, `no_show` mit Port «Einheit abbuchen» zu P-51 (Antrag); Mindestteilnehmende mit Frage in «Heute»; Einstieg in laufende Reihe; Vertretung; Nachricht zum Nachrücken vorbereiten und über das Teilen-Menü senden; Wochenplan, Teilnehmendenliste und Teilnahmebestätigung als PDF.
- **Abnahme:**
  - [ ] Unit-Tests exakt nach 6.5: Einstieg 25 000 × 7 ÷ 12 = 14 583, mit `five_down` 14 580; Auslastung 14 von 16 = 8750 bp; No-Show-Quote 2 von 16 = 1250 bp.
  - [ ] Eine Abmeldung in der vollen Demo-Lektion am Dienstag schlägt die erste Person der Warteliste vor; die Nachricht verlässt das Gerät nur auf Tipp über das Teilen-Menü (Nebenwirkung eingetragen).
  - [ ] Eine Lektion unter den Mindestteilnehmenden wird nie automatisch abgesagt.
  - [ ] Die Teilnehmendenliste enthält kein Geburtsdatum und keinen Zahlungsstand; ein Test prüft das PDF.
  - [ ] E2E im Offline-Modus: Wochenplan mit fünf Lektionen, zwei Buchungen auf die Warteliste, Nachrücken und Anwesenheit.

### B-7 Rechnungen, Raten und Mahnungen

- **Ziel:** Jede Mitgliedschaft erzeugt ihre Rechnungen und Raten, und offene Posten sind sichtbar.
- **Umfang:** Tabelle `courses_billing_plans`; `InvoiceSource` für P-29 aus P-51 (Vorauszahlung, Raten, monatlich, Anteil im ersten Monat); Rechnung an Mitglied, Eltern oder Firma; Sammelrechnung für Firmenmitgliedschaften (Antrag); Mahnstufen mit Tagen des Betriebs; Ansicht «Erweitert» mit verteilter Vorauszahlung.
- **Abnahme:**
  - [ ] Unit-Tests exakt nach 6.6: 89 000 in 12 Raten ergibt 7424 und 11 × 7416, Summe 89 000; Anteil 9900 × 21 ÷ 30 = 6930; März 89 000 × 31 ÷ 365 = 7559; keine Gleitkommazahl im Ergebnis.
  - [ ] Die Rechnung trägt den QR-Zahlteil aus P-29; die Branche baut keinen eigenen; die Rundung auf 5 Rappen gilt nur bei Barzahlung.
  - [ ] Eine Mahngebühr erscheint nur, wenn der Betrieb sie eingetragen hat.
  - [ ] Die App verschickt nichts und zieht nichts ein; die Person teilt das PDF selbst.

### B-8 Theke, Kasse und Lager

- **Ziel:** Verkauf an der Theke mit richtigem Satz, Tagesabschluss und Ablauf der Riegel im Blick.
- **Umfang:** Theke-Artikel als Katalog (P-24) mit dem Satz, den der Betrieb wählt; Verkauf vor Ort oder zum Mitnehmen, Mehrfachkarten und Tageseintritte über P-30; Lager mit Mindestbestand und Ablaufdatum über P-41 (Antrag Ablaufdatum je Charge); Checkliste Theke.
- **Abnahme:**
  - [ ] Jeder Artikel trägt einen vom Betrieb gewählten Satz; die App ordnet keinen Satz selbst zu, und ein Artikel ohne Satz zeigt «Satz fehlt».
  - [ ] Der Tagesabschluss zeigt Bargeld, Karte und mobile Zahlung getrennt (P-30).
  - [ ] Ein Riegel mit Ablauf in 7 Tagen erscheint in «Heute»; Bestand ändert nur über Bewegungen.

### B-9 Heute, Zahlen und Monatspaket

- **Ziel:** Die Inhaberin sieht jeden Morgen, was fällig ist, und die Treuhand bekommt am Monatsende alles.
- **Umfang:** Karten in «Heute» (Stichtage, Verlängerungen, Pausenende, Kartenablauf, Probetrainings, volle Lektionen, offene Posten, Geräte-Fristen); höchstens fünf Zahlen; Kennzahlen aus Steckbrief 6.1 bis 6.6 in «Erweitert»; Beiträge zum Monatspaket von P-30 (Rechnungen, offene Posten, Stunden der Angestellten aus P-31) ohne Anwesenheiten und ohne Gesundheitsangaben.
- **Abnahme:**
  - [ ] Mit dem Demo-Betrieb zeigt «Heute» genau den Tag aus Steckbrief Abschnitt 13; Kündigungsquote 3 von 238 = 126 bp.
  - [ ] Jede Zahl wird berechnet, keine gespeichert; es gibt keine Rangliste von Personen.
  - [ ] Das Monatspaket enthält keine Anwesenheiten, keine Notfallkontakte und keine Daten von Kindern ausser Rechnungsempfänger:innen.

### B-10 Lektionen, Stunden und Honorare

- **Ziel:** Präsenz, Stunden und Honorare der Trainer:innen ohne Zettel.
- **Umfang:** Tabellen `courses_instructor_terms`, `courses_fee_statements`, `courses_staff_checks`; gehaltene Lektion als Zeitbuchung in P-31; Lohnart je Lektion (Antrag); Honorarabrechnung für Selbständige als PDF, gesperrt nach Ausgabe; Hinweise auf dem Monatsblatt mit Quelle; Sonderprivatauszug nur «gesehen am».
- **Abnahme:**
  - [ ] Unit-Test nach 6.7: E. Muster 4 Lektionen und 1 Vertretung zu 9000 ergibt 45 000; Ferienlohn mit Testwert 112 000 × 833 ÷ 10 000 = 9330.
  - [ ] Der Ferienlohn-Satz erscheint erst, wenn er in Steckbrief Abschnitt 9 «geprüft am» trägt; sonst «Wert fehlt» mit Quelle.
  - [ ] Kein Text stuft jemanden als selbständig oder angestellt ein; ohne Bestätigung der Ausgleichskasse steht ein Hinweis mit Quelle.
  - [ ] Ansätze und Honorare sieht nur, wer das heikle Recht «Honorare» hat; `courses_staff_checks` speichert keine Datei.

### B-11 Sicherheit, Geräte, Kinder und Prüfungen

- **Ziel:** Nachweise für Geräte und Notfall, sichere Abholung bei Kinderkursen, Urkunden für Prüfungen.
- **Umfang:** Geräte, AED und Kletterwand in P-42 mit Fristen nach Herstellerangabe; Checklisten aus Steckbrief Abschnitt 7 in P-27 mit Stopp-Meldung «Gerät ausser Betrieb»; Tabellen `courses_pickup_permissions`, `courses_incident_notes`, `courses_grade_ladders`, `courses_grade_results`; Kinderkurs-Liste mit Notfallkontakt; Vorfallmeldung, Abholberechtigung und Urkunde als PDF.
- **Abnahme:**
  - [ ] Die AED-Elektroden der Demo erscheinen 6 Wochen vor Ablauf in «Heute»; ein Gerät «ausser Betrieb» bleibt markiert, bis eine Person es freigibt.
  - [ ] Die Abholung eines Kindes zeigt nur Personen mit gültiger Berechtigung; jede Änderung ist eine neue Zeile mit Unterschrift der Eltern.
  - [ ] Eine Vorfallmeldung hat kein Feld für Verletzung oder Diagnose; ein Texttest prüft das PDF.
  - [ ] Eine Gurtprüfung erzeugt eine Urkunde; das Ergebnis ist ein Ledger.

### B-12 Bestätigungen für Zusatzversicherungen

- **Ziel:** Mitglieder bekommen eine Bestätigung ihrer Zahlungen; das Formular nach Tarif 595 kommt erst nach Albans Entscheid.
- **Umfang:** Tabellen `courses_quality_labels`, `courses_insurer_documents`; Zahlungsbestätigung aus P-29 mit Label-Nummer und Leistungszeitraum, gesperrt nach Ausgabe; Feld `insurerEligible` am Tarif. Das Formular nach Tarif 595 nur, wenn [S-18](../entscheide.md) entschieden ist und die Pflicht in Steckbrief Abschnitt 9 «geprüft am» trägt; vorher liest der Agent die Quelle und meldet das Ergebnis.
- **Abnahme:**
  - [ ] Ohne Entscheid zu S-18 gibt es keinen Einstieg zum Formular nach Tarif 595 und keinen Text, der behauptet, eine Bestätigung genüge einer Versicherung.
  - [ ] Eine Zahlungsbestätigung summiert nur Zahlungen aus P-29 im Leistungszeitraum; eine Korrektur ist eine neue Fassung.
  - [ ] Nichts geht an eine Versicherung oder ein Label; die Person gibt das PDF dem Mitglied.

## Abnahme des Auftrags

- [ ] B-1 bis B-9 erfüllt (MVP aus Steckbrief Abschnitt 12); B-10 und B-11 vor dem Pilot, wenn der Pilot Angestellte, Selbständige oder Kinderkurse hat; B-12 nach S-18.
- [ ] Der Demo-Betrieb «Studio Muster GmbH» zeigt den Tag aus Steckbrief Abschnitt 13.
- [ ] Keine Datei ausserhalb der eigenen Pfade geändert; jeder Commit trägt `Order: branche-kurse` und `Role: industry:courses`.
- [ ] Jeder Plattform-Bedarf steht in `docs/branchen/kurse/antraege.md`; keine eigene Fassung von P-50, P-51, P-52 oder eines anderen Plattform-Pakets.
- [ ] Abschnitte 9 und 16 des Steckbriefs nachgeführt; Werte mit «Recherche» oder «nicht bestätigt» erscheinen in der App als «Wert fehlt» mit Quelle, nie als Zahl.

## Testweg

- `pnpm install`, `pnpm check` bis `ALL=GREEN`, `pnpm check:industry courses`.
- Unit-Tests für jede Rechenregel mit den Zahlen aus dem Steckbrief, in Ganzzahlen; Datumsregeln auch über Monatsenden und Schaltjahre.
- E2E mit Playwright in der Ausgabe «Studio» mit dem Demo-Betrieb, je Paket der Hauptablauf, in vier Ansichten (iPhone, iPad hochkant, iPad quer, Web), hell und dunkel; Check-in, Kursplan und Verkauf im Offline-Modus und im Gerätemodus «Theke»; kein seitliches Scrollen, kein Feld unter 16 px, Ziele mindestens 44 px.
- Vorschaubilder der neuen Seiten mit dem Vorschau-Werkzeug der Suite für Alban, vier Ansichten, hell und dunkel; dazu je ein PDF von Mitgliedschaftsvertrag, Rechnung mit Raten, Teilnehmendenliste und Wochenplan.
- Landen nach [`../zusammenarbeit.md`](../zusammenarbeit.md), Abschnitt 6: `git fetch`, Rebase auf `origin/main`, prüfen, `git push origin HEAD:<arbeits-branch> HEAD:main`.

## Stopp-Regeln

Anhalten und melden, wenn:

- ein Schritt Geld kosten würde (Eintrag als Software-Anbieter, Entwicklerkonto für die Wallet, Prüfung durch eine Fachperson);
- Daten neu das Gerät verlassen würden (Kopplung für Kursliste oder zweites iPad, Online-Buchung, Mitteilungen, Versand an Versicherer, Labels oder Behörden, Übersetzung), auch «nur zum Testen» ([S-06](../entscheide.md), [S-14](../entscheide.md), [S-18](../entscheide.md));
- eine Datei ausserhalb der eigenen Pfade geändert werden müsste, auch eine Kleinigkeit in `platform/courses` oder `industries/salon/`;
- eine Rechtsregel, eine Frist, ein Lohnwert oder ein Steuersatz ohne Quelle mit «geprüft am» in die App käme;
- eine Kennung, ein Tabellenname, ein Präfix oder eine Betriebsart umbenannt werden müsste, oder eine Kennung mit P-52 kollidiert;
- ein Text beurteilen statt erinnern würde (Gültigkeit einer Kündigung, Verlängerungsklausel oder eines Ablaufs, Selbständigkeit, Lohn, MWST-Satz, Eignung fürs Training);
- eine Gesundheitsangabe, eine Diagnose, eine Kopie eines Strafregisterauszugs, ein biometrisches Merkmal oder ein Standort gespeichert würde ([S-12](../entscheide.md));
- eine Anbindung an Zutrittssystem, Tür, Zahlungsdienst, Kartenterminal, Trainingsgerät oder Versicherung nötig scheint;
- Normtexte, Verbandsbedingungen oder Vertragsvorlagen Dritter als Vorgabe ausgeliefert würden;
- eine neue Abhängigkeit nötig scheint;
- `main` nach dem Push rot ist.

## Bericht

Je Paket an Alban: was gebaut ist und wie es geprüft wurde; Vorschaubilder; neue Plattform-Anträge; Fakten, die noch «Recherche» oder «nicht bestätigt» tragen; Einträge in Schulden und Lernbuch; was nur Alban entscheiden kann (mit S-Nummer, besonders S-12, S-14 und S-18).

## Stand

offen

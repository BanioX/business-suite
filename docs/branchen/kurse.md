# Fitness, Studios und Kursbetriebe

- **Kennung im Code:** `courses` (Tabellen `courses_*`, Operationen `courses.<bereich>.<verb>`, Ereignisse `courses_<ding>.<was>`, Funktionen `courses.<name>`; ADR-Präfix `CRS`); Betriebsarten `courses.fitness`, `courses.functional`, `courses.yoga_pilates`, `courses.martial_arts`, `courses.dance`, `courses.personal_training`, `courses.climbing`, `courses.swimming`, `courses.music_school`, `courses.dog_school`. Gleiches Wort wie das Paket `@onestrand/courses` (P-52): Namensräume trennt der Kopf (Abschnitt 14).
- **Ausgabe:** Studio ([S-01](../entscheide.md))
- **Welle:** W4 ([Fahrplan](../fahrplan.md)) mit P-50 bis P-52; die Recherche empfahl W2, der Fahrplan geht vor. Pilot nicht Januar bis März und nicht zum Semesterstart (Annahme).
- **Eignung:** 4 – Fristen der Mitgliedschaften, offene Rechnungen, Kursplätze und Mehrfachkarten sind tägliche Lücken, ein iPad an der Theke trägt den Alltag in Stufe 1, und die Branche baut mit «Termine» P-50 bis P-52; Abzug für Gesundheitsdaten, automatische Verlängerung, MWST-Abgrenzung, die offene Frage Tarif 595 und fehlende Online-Buchung für Kursstudios.
- **Recherche:** [`kurse-recherche.md`](kurse-recherche.md) · **Auftrag:** [`../auftraege/branche-kurse.md`](../auftraege/branche-kurse.md)

## 1. Kurzbild

| Frage | Antwort |
| --- | --- |
| Wie viele | 1441 Fitnesscenter, 1,45 Mio. Mitgliedschaften, 27 667 Beschäftigte Ende 2025, über 700 Einzelanlagen (Ende 2023); Zahlen des Verbands Swiss Active, nicht amtlich. NOGA 93.13, 85.51, 85.52 ([BFS KUBB](https://www.kubb-tool.bfs.admin.ch/en/code/855100)); Kulturunterricht 4502 Arbeitsstätten, 20 914 Beschäftigte (2022, BFS); Yoga, Kampfsport, Tanz, Schwimmen einzeln nicht belegt |
| Grösse (Annahme) | Kraftstudio 150 bis 800 Mitglieder, 3 bis 15 Personen; Yoga, Pilates, Tanz 3 bis 15 Lehrpersonen; Kampfsport 50 bis 300 Mitglieder, viele Kinder; Personal Training 1 bis 2; Kletterhalle 10 bis 40; Musikschule 5 bis 30 Lehrpersonen |
| Wer arbeitet | Inhaber:in an Theke und im Unterricht, Leitung Theke, Trainer:innen im Stunden- oder Monatslohn, selbständige Kursleitende mit Honorar, Aushilfen, Reinigung; Kampfsport oft als Verein; extern Treuhand |
| Sprachen | nicht belegt; Landessprache, in Städten Englisch; Dokumente de, fr, it, en ([S-07](../entscheide.md)) |
| Aussendienst | kaum; Personal Training draussen, Kurse in gemieteten Hallen und Becken |
| Saison (Annahme) | Januar bis März Spitze; Sommerloch mit Kurspause; August und September Semesterstart; Dezember Geschenkkarten und Bestätigungen für Zusatzversicherungen |

## 2. Teilbranchen und Betriebsarten

Mehrfach wählbar. «Theke mit Verkauf» ist eine Option jeder Art (Kasse, Lager). Massage oder Kosmetik im Studio: die Branche «Termine» (`salon`) dazuschalten; `courses` importiert sie nie. Kürzel der Funktionen ohne Präfix `courses.`.

| Betriebsart | Kennung | Was sie tut | Startfunktionen |
| --- | --- | --- | --- |
| Fitness- und Kraftstudio | `courses.fitness` | Geräte, Betreuung, einige Kurse, Theke | members, memberships, punch_cards, check_in, billing, trials, safety |
| Functional-Training | `courses.functional` | Kleingruppen nach Stundenplan | members, memberships, classes, check_in, billing, trials |
| Yoga und Pilates | `courses.yoga_pilates` | Kurse mit Plätzen, Einzellektionen, Geräte mit wenigen Plätzen | members, punch_cards, classes, billing, instructors |
| Kampfsport | `courses.martial_arts` | Training nach Alter und Gurt, Prüfungen | members, memberships, classes, kids, grades, billing |
| Tanzschule | `courses.dance` | Semesterkurse, Paare, Kinder | members, classes, kids, billing, instructors |
| Personal Training | `courses.personal_training` | Einzeltermine, Karten mit Terminen | members, punch_cards, appointments, billing; «Schlank» |
| Kletterhalle | `courses.climbing` | Eintritte, Karten, Kurse, Materialmiete, Theke | members, memberships, punch_cards, check_in, classes, rentals, safety |
| Schwimm- und Kinderkurse | `courses.swimming` | Kursreihen in gemieteten Becken, Eltern als Vertragspartner | members, classes, kids, venues, billing, instructors |
| Musikschule | `courses.music_school` | Einzel- und Gruppenunterricht nach Semester | members, classes, appointments, kids, billing, instructors |
| Hundeschule | `courses.dog_school` | Gruppenkurse, Einzelstunden, Karten | members, classes, punch_cards, appointments, billing |

Dazu `courses.insurer_receipts` (erst nach [S-18](../entscheide.md)). Keine Funktion heisst wie eine Betriebsart.

## 3. Alltag

- **Mitglied:** Anfrage › Probetraining mit Gespräch über Einschränkungen › Vertrag (Tarif, Laufzeit, Verlängerung, Frist, Zahlungsart, Unterschrift, bei Minderjährigen die Eltern) › Karte › Check-in › Kurse buchen, abmelden, Warteliste › Pause › Kündigung bis zum Stichtag › Rechnung oder Raten, Mahnung › Bestätigung für die Zusatzversicherung.
- **Tag:** Öffnen (Notausgänge, AED-Anzeige, Wechselgeld) › Theke: Check-ins, Verkauf, Probetrainings, Verträge › Kurse: Liste, Anwesenheit, Abholung bei Kindern › Anrufe zu Plätzen und Nachrücken › Schliessen: Kasse, Tagesabschluss, Alarm. **Woche:** Kursplan, Vertretungen, Absagen; Stunden; Geräte-Sichtkontrolle; Probetrainings nachfassen; Einkauf Theke. **Monat:** Raten, Abgleich, Mahnungen; Verlängerungen, Kündigungen, Pausenenden; Lohn, Honorare, Monatspaket. **Jahr:** Preisänderung für die nächste Laufzeit; Sommerpause und Geräte-Service; Semesterstart; MWST.
- **Heute:** Vertragsblock und Gesundheitsbogen im Ordner, Stempelkarten, Tabellenkalkulation, Messenger-Gruppen, QR-Rechnungen einzeln im E-Banking.

## 4. Schmerzen

1. **Fristen der Mitgliedschaften** im Kopf: verpasste Kündigungen, Streit, vergessene Verlängerungen.
2. **Offene Rechnungen und Raten:** Abgleich von Hand, Mahnungen vergessen.
3. **Kursplätze und Warteliste** über Messenger: Doppelbuchungen, leere Plätze trotz Warteliste.
4. **Mehrfachkarten auf Papier:** verloren, Streit um Rest und Ablauf.
5. **Zusatzversicherungen:** ab 2027 nach der Recherche ein vorgegebenes Formular (Tarif 595, nicht bestätigt, [S-18](../entscheide.md)).
6. **Stunden, Ferienlohn, Honorare;** angestellt oder selbständig oft unklar.
7. **Gesundheitsbogen im Ordner:** besonders schützenswerte Daten ohne Schutz und Löschfrist.
8. **Theke ohne Kasse und Lager, keine Zahlen** zu Mitgliedern, Kündigungen, Auslastung.

**Warum keine Software** (Annahmen der Recherche): Kosten je Mitglied oder Buchung, Bindung an Zutrittshardware und Zahlungsdienste, Konto- und Netzzwang, gebaut für Ketten, Mitglieder-App als Pflicht, schwieriger Ausstieg. **Was bewegt:** Fristen und offene Posten ab Tag eins, ein iPad ohne Hardware und Netz, Import und Export, QR-Rechnung und Monatspaket ohne Zusatzdienst, Kursliste ohne Messenger.

## 5. Plattform-Module

Dazu P-05 (Sicherung mit Passwort, tägliche Erinnerung), P-06 (Betriebsarten, Fragen, Gerätemodi «Theke» und «Selbst-Check-in»), P-07 (Lexikon), P-10 (Unterschrift, QR nach Tipp, Teilen), P-11 (Vertrag, Listen, Karte mit QR). Abweichend von [`../plattform.md`](../plattform.md): P-24 M statt S, P-26 K statt S, P-33 S statt K (Antrag).

| Modul | Wofür, Einstellungen der Branche | Bedarf | Welle |
| --- | --- | --- | --- |
| P-20 Betrieb und Personen | Standort, Rechtsform (auch Verein), MWST-Art; Saldosteuersatz trägt der Betrieb ein | M | W0 |
| P-21 Rollen und Rechte | Vorlagen Abschnitt 8; heikel: Löhne und Honorare, Rabatte, Kasse, Zahlen, Löschen, Sonderprivatauszug | M | W1 |
| P-22 Kundschaft | heisst «Mitglieder»; Kinder mit Eltern, Firmen mit Mitarbeitenden, Notfallkontakt, Import CSV | M | W1 |
| P-23 Objekte und Standorte | Räume, gemietete Hallen und Becken | K | W1 |
| P-24 Leistungen und Material | Tarife und Theke-Artikel mit Ansatz und MWST-Satz, den der Betrieb wählt | M | W1 |
| P-25 Aufträge, Einsätze, Rapporte | – (Personal Training über P-50) | – | – |
| P-26 Pläne und Wiederkehr | Reinigungsplan bei eigenem Personal; sonst Wiederkehr der Checklisten | K | W1 |
| P-27 Checklisten und Nachweise | Öffnen, Schliessen, Geräte, AED, Kletterwand, Kinderkurs, Theke; «Gerät ausser Betrieb» | M | W1 |
| P-28 Kalender und Erinnerungen | Stichtage, Verlängerung, Pausenende, Kartenablauf, Nachfassen, Semester, Feiertage | M | W1 |
| P-29 Offerten und Rechnungen | wiederkehrend, Raten, an Eltern oder Firma, Sammelrechnung, Mahnung, Bankdatei, Zahlungsbestätigung | M | W2 |
| P-30 Kasse und Belege | Theke mit Satz vor Ort und zum Mitnehmen, Tageseintritt, Tagesabschluss, Monatspaket | M | W2 |
| P-31 Team und Zeit | Stempeln, Lektion als Zeitbuchung, Lohnart je Lektion, Honorar getrennt | M | W2 |
| P-32 Heute | Fristen, Probetrainings, volle Kurse, offene Posten | M | W0 |
| P-33 Fotos und Dateien | Unterschriften, Foto am Mitglied mit Einwilligung, Urkunden, Belege | S | W0 |
| P-40 Kopplung und Abgleich | Kursliste aufs Handy, zweites iPad; nur nach [S-06](../entscheide.md) | S | W3 |
| P-41 Material und Lager | Getränke, Riegel, Pulver mit Ablaufdatum (Antrag); Leihmaterial | S | W3 |
| P-42 Fahrzeuge und Geräte | Trainingsgeräte, AED, Kletterwand: Fristen nach Herstellerangabe | S | W3 |
| P-50 Termine | Probetraining, Personal Training, Einzelunterricht; Raum und Person als Ressource | M | W4 |
| P-51 Verträge und Mitgliedschaften | Mitgliedschaft mit Fristen und Pause; Mehrfachkarten als Ledger; erzeugt Rechnungen | M | W4 |
| P-52 Kurse mit Plätzen | Reihen, Lektionen, Plätze, Warteliste, Anwesenheit, Semester | M | W4 |

## 6. Eigene Module der Branche

Alle Tabellen tragen `businessId`. Geld in Rappen, Quoten in bp, Dauern in Minuten, Einheiten ganzzahlig; Tage `YYYY-MM-DD` (Europe/Zurich), Zeitpunkte ISO-UTC; je Zeile einmal gerundet, kaufmännisch ausser bei «abgerundet». «H, A»: Heikelkeit (n, i, h) und Abgleich-Art ([ADR-0005](../adr/0005-gemeinsames-datenmodell.md)). **K** = Kandidat für die Plattform. **(P)** = Regel von P-51 oder P-52; die Branche liefert Prüfbeispiel und Test. Erinnerungstage sind «Vorschlag»; Werte mit Rechtsbezug starten leer («Wert fehlt»).

### 6.1 Mitglieder und Interessent:innen (`courses.members`, `courses.trials`)

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `courses_member_profiles` | customerId (P-22), memberNo (`M-0042`, nur Hauptgerät), birthDate, guardianCustomerIds, emergencyContact, photoFileId mit photoConsentAt, marketingConsentAt, healthTalkOn, paperFormNote, joinedOn, leftOn, deleteAfter | i, ein Schreiber |
| `courses_member_cards` | customerId, token (zufällig), printedOn, revokedOn | n, Ledger |
| `courses_leads` | name, contact, source, interest, consentToContactAt, status (`new`, `trial_booked`, `trial_done`, `won`, `lost`), lostReason, convertedCustomerId, deleteAfter | i, Ledger |
| `courses_trial_visits` | leadId, appointmentId (P-50) oder sessionId (P-52), personId, outcome | n, ein Schreiber |

Status berechnet (`trial`, `active`, `paused`, `notice_given`, `ended`, dazu `overdue`). Minderjährig aus birthDate erst mit geprüfter Altersgrenze (Abschnitt 9), sonst fragt die App; dann unterschreibt die gesetzliche Vertretung. Nachfassen 2 Tage nach dem Probetraining; Löschen nach Frist des Betriebs (Vorschlag 6 Monate ohne Abschluss, 12 nach Austritt), nur auf Bestätigung. Import als CSV über P-22 mit laufenden Mitgliedschaften. **Gesundheit ([S-12](../entscheide.md)):** keine Angaben, Antworten, Diagnosen oder Dateien; nur «Einschränkungen besprochen am» und wo ein Papierbogen liegt. Abschlussquote = gewonnen × 10 000 ÷ durchgeführte Probetrainings.

### 6.2 Tarife und Mitgliedschaften (`courses.memberships`)

Vertrag, Pause, Kündigung, Preisänderung und Rechnungen gehören P-51; die Branche liefert Tarife, Vorlagen und Prüfbeispiele.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `courses_tariffs` | name, kind (`membership`, `punch_card`, `course_series`, `day_pass`, `trial`, `personal_training`), contractTemplateId (P-51), catalogItemId (P-24), access (`equipment`, `classes`, `both`), timeWindows, ageGroup, discountKind, unitsPerVisit, insurerEligible | i, ein Schreiber |
| `courses_membership_terms` | contractId (P-51), tariffId, signedBy (`member`, `guardian`), guardianCustomerId, termsBoxSignedAt, transferredFromContractId, companyCustomerId | i, ein Schreiber |
| `courses_pause_notes` | pauseId (P-51), reason (`certificate_seen`, `service`, `travel`, `other`), clauseLabel, evidenceSeenOn; **kein Gesundheitsgrund, keine Datei** | i, ein Schreiber |

**Rechenregeln (P):**
- **Ende** = Beginn + Monate (gleicher Kalendertag, sonst Monatsletzter) − 1 Tag + Pausentage (Grenztage zählen): 2026-03-01, 12 Monate: 2027-02-28; Pause 2026-07-01 bis 2026-07-21: 2027-03-21. Beginn am 29. bis 31.: ADR und Fachperson ([S-17](../entscheide.md)).
- **Stichtag** = Ende − Frist nach den Bedingungen des Betriebs: `day_for_day` (fehlt der Tag: Monatsletzter) oder `month_end` (Ende am Monatsletzten: Stichtag am Monatsletzten). Ende 2027-02-28, 2 Monate: 2026-12-28 oder 2026-12-31; Ende 2027-03-21: beide 2027-01-21. Keine Vorbelegung; massgebend ist der Eingang (`receivedOn`, Kanal).
- **Verlängerung** ohne Kündigung: Beginn = Ende + 1 Tag: 2027-03-01 bis 2028-02-29 (Schaltjahr). Neuer Preis nur, wenn bis zum Stichtag mitgeteilt; während einer Laufzeit nie.
- **Späte Kündigung:** «Eingetroffen am 2026-12-30, nach dem Stichtag 2026-12-28 deiner Bedingungen; Ende ohne Kulanz 2028-02-29.» Kulanz ist ein Befehl mit Grund; die App sagt nie, ob eine Kündigung gilt. Erinnerung 30 Tage vor jedem Stichtag.

Kündigungsquote = Kündigungen mit Eingang im Zeitraum × 10 000 ÷ aktive am ersten Tag (3 von 238: 126 bp); Verlängerungsquote; Anteil pausiert. **Dokumente:** Vertrag mit separatem Kasten «Verlängerung und Kündigung» (Text des Betriebs, «von einer Fachperson prüfen lassen»), Bestätigung von Pause und Kündigung, Mitteilung einer Preisänderung.

### 6.3 Mehrfachkarten und Eintritte (`courses.punch_cards`)

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `courses_card_details` | punchCardId (P-51), tariffId, holderCustomerId, buyerCustomerId (Geschenk), validUntil | n, ein Schreiber |
| `courses_day_passes` | soldAt, tariffId, saleId (P-30), customerId | n, Ledger |

Rest = Σ Bewegungen (P). Restwert = abgerundet(Preis × Rest ÷ Einheiten): 22 000, 10 Einheiten, 4 benutzt: Rest 6, 13 200; eine Lektion zu 2 Einheiten: Rest 4. Hinweis 30 Tage vor Ablauf; nichts verfällt von selbst, «abgelaufen» bucht eine Person mit Recht nach dem Hinweis auf die Verjährung. Offenes Guthaben = Σ Restwert. **Dokumente:** Kaufbeleg, Geschenkkarte, Bestätigung des Restguthabens.

### 6.4 Check-in an der Theke (`courses.check_in`)

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `courses_visits` | customerId, at, deviceId, method (`name_search`, `number`, `qr_card`, `self`), result (`ok`, `warning`), warnings, acknowledgedBy, punchCardMoveId | n, Ledger |

**Warnungen**, im Besuch festgehalten: abgelaufen; gekündigt und Ende vorbei; Pause aktiv; Karte leer, abgelaufen, gesperrt; ausserhalb des Zeitfensters; Zahlung überfällig (ohne Recht «Rechnungen»: «bitte an die Leitung»). Die App sperrt nie und steuert keine Tür. **Gerätemodi:** «Theke» (Suche, Foto nur mit Einwilligung, Ampel mit Grund in Worten) und «Selbst-Check-in» (dasselbe iPad, nach [S-06](../entscheide.md) ein zweites; Nummer oder Karte, Kamera erst nach Tipp; nie fremde Namen oder Zahlungsstand, bei Warnung nur «Bitte melde dich an der Theke»); verlassen mit PIN. Keine Gesichtserkennung, kein Fingerabdruck. Kennzahlen: Besuche je Stunde, aktive Nutzende (Besuch in 30 Tagen), «lange nicht gesehen» nach 21 Tagen.

### 6.5 Kursplan mit Plätzen (`courses.classes`, `courses.venues`)

Reihen, Lektionen, Buchungen, Warteliste und Anwesenheit gehören P-52; Räume und Personen sind Ressourcen in P-50.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `courses_class_types` | name, discipline, level, ageGroup, defaultCapacity, unitsPerSession | n, ein Schreiber |
| `courses_class_policies` | courseId (P-52), bookingMode (`series`, `drop_in`, `both`), cancelDeadlineMin, lateCancelCharges, noShowCharges, minParticipants, decideBeforeMin, tariffIds, entryRounding (`rappen`, `five_down`) | n, ein Schreiber |
| `courses_venue_rentals` | siteId (P-23), weekday, from, to, validFrom, validTo, costRappen | i, ein Schreiber |

Freie Plätze = Kapazität − `booked`; Nachrücken in Reihenfolge (P); die Nachricht sendet die Person auf Tipp. Nach der Frist `late_cancel`, sonst `no_show`; Einheit nur mit Option. Unter den Mindestteilnehmenden fragt «Heute» «Lektion absagen?»; nie automatisch. Einstieg = abgerundet(Preis × verbleibende ÷ alle Lektionen): 25 000, 12, 7 verbleibend: 14 583; `five_down` 14 580. Vertretung: Buchungen bleiben, Honorar an die Vertretung. Auslastung = Σ Anwesende × 10 000 ÷ Σ Kapazität (14 von 16: 8750 bp); No-Show-Quote = no_show × 10 000 ÷ (attended + no_show) (2 von 16: 1250 bp); keine Rangliste von Personen. **Dokumente:** Wochenplan, Teilnehmendenliste ohne Geburtsdatum und Zahlungsstand, Teilnahmebestätigung, Präsenzliste.

### 6.6 Rechnungen aus Mitgliedschaften (`courses.billing`)

P-51 erzeugt, P-29 stellt aus (QR-Zahlteil, Mahnung, Bankdatei nach [S-08](../entscheide.md)); die Branche liefert `InvoiceSource`.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `courses_billing_plans` | contractId (P-51), mode (`prepaid`, `instalments`, `monthly`), instalments (2, 4, 12), payerCustomerId (Eltern, Firma), firstDueOn | i, ein Schreiber |

Rate = abgerundet(Jahrespreis ÷ n), Rest auf die erste: 89 000 in 12: 7424 und 11 × 7416. Anteil erster Monat = abgerundet(Monatspreis × Resttage ÷ Tage des Monats): 9900 ab dem 10. eines 30-Tage-Monats: 6930. 5-Rappen-Rundung nur bar. Mahnstufen nach Tagen des Betriebs (Vorschlag 10, 30, 30), Gebühr nur, wenn vereinbart. MWST je Position aus dem Tarif. Firmenmitgliedschaft als Sammelrechnung. **Erweitert:** Leistung im Monat = Jahrespreis × Tage des Monats ÷ Tage der Laufzeit: 89 000 × 31 ÷ 365 = 7559; berechnet. **Nie:** Lastschrift, Zahlungsdienst, Kartenterminal.

### 6.7 Lektionen, Stunden und Honorare (`courses.instructors`)

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `courses_instructor_terms` | personId, engagement (`employed_hourly`, `employed_monthly`, `self_employed`), ratePerSessionRappen, prepMin, compensationOfficeConfirmedOn, validFrom | h, Ledger |
| `courses_fee_statements` | personId, month, lines (sessionId, `lead` oder `substitute`, Betrag), issuedAt; gesperrt | h, ein Schreiber |
| `courses_staff_checks` **K** | personId, kind (`special_extract_seen`), seenOn, recheckOn; keine Kopie | h, ein Schreiber |

Gehaltene Lektion = Zeitbuchung in P-31 (Dauer + prepMin). Ferienlohn = round(Bruttolohn × Satz ÷ 10 000): 112 000 × 833 ÷ 10 000 = 9330 (Testwert; Satz erst mit «geprüft am»). Honorar = Σ gehaltene Lektionen × Ansatz: E. Muster 4 und 1 Vertretung zu 9000 = 45 000; Abrechnung, kein Lohn. Ob jemand selbständig ist, entscheidet die Ausgleichskasse; ohne Bestätigung ein Hinweis mit Quelle.

### 6.8 Sicherheit, Kinder und Prüfungen (`courses.safety`, `courses.kids`, `courses.grades`)

Geräte, AED und Kletterwand in P-42 (Fristen nach Herstellerangabe, «ausser Betrieb»), Checklisten in P-27.

| Tabelle | Wichtigste Felder | H, A |
| --- | --- | --- |
| `courses_pickup_permissions` | childCustomerId, personName, relation, validFrom, validTo, guardianSignatureFileId, revokedOn | h, Ledger |
| `courses_incident_notes` | at, siteId, assetId, kind, whatHappened (ohne Diagnose), emergencyCalled, guardianInformedAt, insurerNotifiedOn | h, ein Schreiber |
| `courses_grade_ladders` | discipline, steps (Name, Farbe, Reihenfolge) | n, ein Schreiber |
| `courses_grade_results` | customerId, stepId, examOn, examinerPersonId, result, certificateFileId | n, Ledger |

Abholung nur durch Berechtigte; Notfallkontakt auf der Kinderliste; Fotos von Kindern nur mit Einwilligung der Eltern. AED-Elektroden: Erinnerung 6 Wochen vorher. Ein Vorfall nennt, was geschah und wer wann informiert wurde, nie Verletzung oder Diagnose. **Dokumente:** Vorfallmeldung, Abholberechtigung, Urkunde.

### 6.9 Einzeltermine, Materialmiete, Zusatzversicherungen

- **Einzeltermine** (`courses.appointments`): Personal Training, Einzelunterricht, Einzelstunde mit Hund über P-50; verrechnet über Mehrfachkarte oder je Termin.
- **Materialmiete** (`courses.rentals`): Ausgabe und Rückgabe als Bewegung in P-41, Depot über P-30.
- **Zusatzversicherungen** (`courses.insurer_receipts`, nach [S-18](../entscheide.md)): `courses_quality_labels` (labelName, providerNo, validUntil, certificateFileId; n), `courses_insurer_documents` (customerId, contractId, periodFrom, periodTo, paidRappen aus P-29, kind `payment_confirmation` oder `tariff_595`, issuedAt; gesperrt; i). Bis zum Entscheid und einer geprüften Quelle nur die Zahlungsbestätigung von P-29; nie ein Versand an Versicherer.

## 7. Vorlagen

**Tarife** (ohne Preise, Fristen leer): Monatsmitgliedschaft (auf Ende Monat), 6-Monats- und Jahresmitgliedschaft (Verlängerung keine oder automatisch; voraus oder 2, 4, 12 Raten), Mehrfachkarte 10 Einheiten, Kursreihe oder Semester (10 bis 20 Lektionen), Tageseintritt, Probetraining, Personal Training 5 oder 10 Termine (als Mehrfachkarte, nie «Paket»), Ermässigungen (Jugend, Studierende, AHV, Familie), Firmenmitgliedschaft, Tarif mit Zeitfenster. **Kursarten** je Betriebsart wie Recherche 6.2, Plätze trägst du ein.

**Checklisten** (Takt als Vorschlag): Öffnen und Schliessen täglich (Notausgänge, AED-Anzeige, Erste Hilfe, Wechselgeld, Kühlschrank; Geräte desinfiziert, Kasse, Alarm); Geräte-Sichtkontrolle wöchentlich (Seile, Kabel, Polster, Schrauben, Not-Aus am Laufband); Geräte-Service nach Hersteller; Reinigung; Notfall und AED monatlich (Ablauf Elektroden und Batterie, Notfallnummer 144, Notfallplan, Erste Hilfe heute); Kletterwand (Griffe, Matten, Seile, Sicherungsgeräte); Kinderkurs je Lektion; Theke (Kühlschrank, Ablauf, Mixer). Normen (SN EN ISO 20957, EN 17229) nur nennen.

**Dokumente:** die aus Abschnitt 6, dazu Hausordnung (Text des Betriebs), Anmeldung Kinderkurs, Rechnung mit QR, Mahnung, Monatsblatt. In der App nie «Abo»; Wörter und Anrede in Dokumenten an Mitglieder nach [S-07](../entscheide.md).

**Fragen beim Einrichten:** Betriebsarten; Theke mit Verkauf; Kurse mit Plätzen, als Reihe oder einzeln; Tarife abhaken; Zahlungsarten; automatische Verlängerung und Stichtagsregel (Beispiel 6.2); MWST und Methode (Sätze trägst du ein, sonst «Treuhand fragen»); Qualitätslabel; Kinder; Trainer:innen angestellt oder selbständig; Räume, Plätze, gemietete Hallen; Sprachen der Verträge. «Schlank» (1 Person): Mitglieder, Karten, Termine, Rechnungen; «Üblich»: dazu Mitgliedschaften, Kursplan, Check-in, Theke, Zahlen; «Alles»: dazu Honorare, Kinder, Prüfungen, Miete, Geräte.

## 8. Rollen und Arbeitsplätze

| Rolle | Sieht und tut | Sieht nie | Gerät | Tab-Leiste |
| --- | --- | --- | --- | --- |
| Inhaber:in | alles | – | Theke-iPad, Computer, Handy | Heute · Mitglieder · Kurse · Rechnungen · Mehr |
| Leitung Theke und Büro | Mitglieder, Verträge, Pausen, Kündigungen, Rechnungen, Kasse, Lager, Kursplan | Löhne und Honorare, Einstellungen, Löschen | Theke-iPad, Computer | Heute · Check-in · Mitglieder · Kurse · Mehr |
| Theke und Aushilfe | Check-in, Verkauf, Karten, Probetraining empfangen, Buchungen, Checklisten | Preise ändern, Rabatte über Vorschlag, Rechnungen, Zahlen, Lohn | Theke-iPad im Modus «Theke» | Check-in · Verkauf · Kurse · Checklisten |
| Kursleitung | Kursplan, Vertretungen, alle Teilnehmendenlisten, Auslastung | Lohn, Rechnungen, Kasse | Theke-iPad | Heute · Kurse · Vertretungen · Mehr |
| Trainer:in angestellt | eigene Lektionen, Teilnehmende, Anwesenheit, Notfallkontakt, Vertretung melden, eigene Stunden | andere Kurse bearbeiten, Rechnungen, Kasse, Adressen, Geburtsdaten | Stempeluhr am iPad; Handy nach S-06 | Heute · Meine Lektionen · Meine Stunden |
| Kursleiter:in selbständig | eigene Lektionen, Teilnehmende, Anwesenheit, eigenes Honorar | Mitglieder ausserhalb der eigenen Lektionen | wie oben | Heute · Meine Lektionen · Honorar |
| Reinigung | Checklisten, Störung melden, Stempeln | Mitglieder, Kasse | Theke-iPad | Checklisten · Stempeln |

Die Treuhand bekommt Dateien, keine Rolle. Was Mitglieder selbst sehen, gibt es erst in Stufe 2 ([S-14](../entscheide.md)).

## 9. Recht und Pflichten

**24.11.2026:** an der Quelle bestätigt. **Recherche:** aus der Recherche (Abschnitt 8); der Agent liest den Volltext und trägt das Datum ein, bevor der Wert in die App kommt. **nicht bestätigt:** Der Kopf konnte die Quelle am 24.11.2026 nicht öffnen (Netz der Sitzung); nicht in die App, auch nicht als Richtwert.

| Fakt | Wert | Quelle | geprüft am |
| --- | --- | --- | --- |
| Tarif 595 | ab 1.1.2027 Pflicht für Anbieter des grössten Labels: Formular im Standard XML 5.0 aus «professioneller Software», Abo-Bestätigung gilt nicht mehr; nur Form, nicht Anerkennung und Preise | [SFGV](https://www.sfgv.ch/zertifizierung/tarif-595), [Forum Datenaustausch](https://www.forum-datenaustausch.ch/news), Recherche R15 bis R17 | nicht bestätigt ([S-18](../entscheide.md)) |
| Automatische Verlängerung | in AGB eines Fitnessvertrags nicht per se unlauter, wenn klar gestaltet (BGE 140 III 404); Inhaltskontrolle Art. 8 UWG | [BGE](https://servat.unibe.ch/dfr/bge/c3140404.html), [UWG](https://www.fedlex.admin.ch/eli/cc/1988/223_223_223/de) | nicht bestätigt |
| Preisänderung, Widerruf | Erhöhung während fester Laufzeit heikel (Art. 8 UWG); Widerruf nur bei Haustürgeschäften (OR Art. 40a ff.), nicht an der Theke | Recherche R6, R7 | Recherche |
| Preisbekanntgabe | Fitnessinstitute geben den Preis in Franken inklusive MWST bekannt (PBV Art. 10 Abs. 1 Bst. e) | Recherche R8 | Recherche |
| Mehrfachkarten | Verjährung 10 Jahre (OR Art. 127), teils 5 (Art. 128), nicht abänderbar (Art. 129); kürzerer Ablauf umstritten | Recherche R9 | Recherche |
| Minderjährige | Verpflichtung nur mit Zustimmung der gesetzlichen Vertretung (ZGB Art. 19); Altersgrenze (Art. 14) nicht in der Recherche | Recherche R10 | Recherche; Art. 14 nachlesen |
| Gesundheitsdaten | besonders schützenswert (DSG Art. 5 Bst. c); Einwilligung ausdrücklich (Art. 6 Abs. 7) | [DSG](https://www.fedlex.admin.ch/eli/cc/2022/491/de) | nicht bestätigt; App erfasst keine ([S-12](../entscheide.md)) |
| Datenschutz, Video, Biometrie | Information (DSG Art. 19), Folgenabschätzung (Art. 22); Videoüberwachung verhältnismässig; Empfehlung zu biometrischem Zutritt | Recherche R20 bis R23 | Recherche; App macht weder Video noch Biometrie |
| Sonderprivatauszug | bei Kontakt mit Minderjährigen erhältlich (StGB Art. 371a); Pflicht für Studios nicht belegt | Recherche R24, R25 | Recherche |
| Selbständig oder angestellt | wirtschaftliche Verhältnisse massgebend; Ausgleichskasse entscheidet | Recherche R27 | Recherche |
| Geringfügiger Lohn | bis 2500 Franken nur auf Verlangen (AHVV Art. 34d); Ausnahme Schulen im künstlerischen Bereich, Zuordnung nicht belegt | Recherche R28, R29 | Recherche |
| BVG | Eintrittsschwelle 22 680, Koordinationsabzug 26 460 Franken (2025, 2026) | Recherche R30 | Recherche |
| Nichtberufsunfall | über den Arbeitgeber ab 8 Stunden pro Woche | [Suva](https://www.suva.ch/de-ch/versicherung/unfallversicherung/unfallversicherung-uvg/unfallversicherung-wer-ist-versichert) | 24.11.2026 (Steckbrief Facility) |
| Ferienlohn | 8,33 Prozent (4 Wochen), 10,64 Prozent (5 Wochen), separat ausweisen | [bs.ch](https://www.bs.ch/wsu/awa/arbeitsbeziehungen/arbeitsverhaeltnisse/rechtsberatung/ferien) | nicht bestätigt |
| MWST | 8,1 und 2,6 Prozent; 8,5 frühestens 2028 bei Ja am 29.11.2026 (nachführen); Pflicht ab 100 000 Franken, ehrenamtliche Sportvereine ab 250 000 (MWSTG Art. 10) | Recherche R33 bis R35 | Recherche |
| Abgrenzung Fitness und Unterricht | Unterricht ausgenommen (MWSTG Art. 21 Abs. 2 Ziff. 11); Fitness, Kondition, Gesundheit und Fitnesscenter steuerbar; Erlernen einer Sportart ausgenommen; Yoga-Workshops im Einzelfall | [ESTV Branchen-Info 24](https://www.estv.admin.ch/dam/de/sd-web/Z-CRCjVVlLeU/mwst-mbi24-sport-info1-de.pdf) | nicht bestätigt; Betrieb wählt den Satz |
| Theke | vor Ort Normalsatz (MWSTG Art. 25 Abs. 3, MWSTV Art. 54), zum Mitnehmen 2,6 mit Abgrenzung (MWSTV Art. 56); Selbstkontrolle (LMG Art. 26) | Recherche R40, R46 | Recherche |
| Saldosteuersatz Fitness-Center | 4,5 Prozent (Fassung 2024); seit 2025 nicht belegt | [ESTV](https://www.estv.admin.ch/de/mwst-saldosteuersatzmethode-2025) | nicht bestätigt; Betrieb trägt ein |
| QR-Rechnung, Aufbewahrung | QR seit 1.10.2022; Belege 10 Jahre (OR Art. 958f) | Recherche R11, R12 | Recherche |
| Geräte, AED, Bouldern | Normen SN EN ISO 20957, EN 17229 nur nennen; AED-Pflicht nicht belegt, Empfehlung der Suva; Hinweise der bfu | Recherche R42 bis R45 | Recherche |
| Hundeschule | Umgang mit fremden Tieren bewilligungspflichtig (TSchV Art. 101, 102); Zuordnung klärt der Kanton | Recherche R47 | Recherche |

**Die App** erinnert an Fristen, hält Eingang, Unterschrift und Kulanz fest und zeigt Hinweise mit Quelle; jeder Satz, jede Frist und jeder Vorschlag ist änderbar. Sie speichert keine Gesundheitsangaben, keine Kopie eines Strafregisterauszugs, keine Biometrie, keinen Standort. **Sie tut nie:** beurteilen, ob Kündigung, Verlängerungsklausel oder Ablauf gilt; jemanden als selbständig einstufen; Lohn bestätigen; einen MWST-Satz zuordnen; Trainings- oder Ernährungsempfehlungen geben; an Versicherer, Labels oder Behörden melden. Vor dem Pilot prüft eine Fachperson Vorlagen und Lohnregeln ([S-17](../entscheide.md)).

## 10. Geräte und Abgleich

| Lage | Typisch | Stufe 1 ohne JA | Nach JA ([S-06](../entscheide.md)) |
| --- | --- | --- | --- |
| L1 allein | Personal Training, Hundeschule | ein Gerät; Sicherung als Datei | – |
| L5 ein Ort, mehrere Geräte | Studio mit Theke und Kursen | Theke-iPad als Hauptgerät, Selbst-Check-in im Gerätemodus darauf; Kursliste als PDF, Anwesenheit abends nachtragen | Kopplung im WLAN: Kursliste und Anwesenheit auf dem Handy, zweites iPad am Eingang; das Hauptgerät entscheidet (Ankunft zählt, sonst Warteliste) |
| L2 Theke und Büro | Rechnungen am Computer | Sicherung als Datei | Kopplung im WLAN |

Alles geht ohne Netz; die Sicherung erinnert täglich, mit Passwort. **Nie aufs Handy:** Rechnungen, Zahlungsstand, Kasse, Löhne und Honorare anderer, Adressen, Geburtsdaten, Sonderprivatauszug; nur eigene Lektionen mit Vornamen, Anwesenheit, Notfallkontakt. Nachrichten an Mitglieder sendet die Person selbst über das Teilen-Menü (Nebenwirkung). **Erst Stufe 2** ([S-14](../entscheide.md)): Online-Buchung und Mitglieder-Ansicht (P-63), Mitteilungen (P-62), mehrere Standorte (P-64). Karte in der Wallet des Handys: kostenpflichtiges Entwicklerkonto, nur auf Albans Wort.

## 11. Wörter

Kundschaft heisst Mitglied (Kurse: Teilnehmende, Musikschule: Schüler:innen); Vertrag heisst Mitgliedschaft; Abo-Art heisst Tarif; 10er-Karte heisst Mehrfachkarte; Drop-in heisst Einzellektion; Objekt heisst Raum; Einsatz heisst Lektion; Empfang heisst Theke. Nie «Abo», «Paket», «freischalten» ([Glossar](../glossar.md)). **Fürs Glossar:** Tarif, Kursreihe, Lektion, Einzellektion, Warteliste, Nachrücken, Abmeldefrist, späte Abmeldung, Auslastung, Kündigungsstichtag, Pause, Ersatzmitglied, Restguthaben, Restwert, Probetraining, Check-in, Selbst-Check-in, Theke, Qualitätslabel, Tarif 595, Zahlungsbestätigung, Honorarabrechnung, Vertretung, Sonderprivatauszug, Abholberechtigung, Gurtprüfung.

## 12. MVP und Pakete

**MVP** (Pilot 4 bis 8 Wochen, kleines Kraftstudio mit Theke und einigen Kursen, 100 bis 400 Mitglieder, ein Theke-iPad):

1. Einrichten mit Betriebsart, Tarifen und Rollen; Mitglieder und Mitgliedschaften aus der Tabellenkalkulation importieren.
2. Mitgliedschaften mit Laufzeit, Verlängerung, Stichtag, Pause, Kündigung; Vertrag als PDF mit Kasten und Unterschrift.
3. Mehrfachkarten und Tageseintritte mit Restguthaben, ohne automatischen Verfall.
4. Check-in an der Theke mit Suche, Nummer oder QR-Karte und Ampel mit Grund.
5. Kursplan mit Plätzen, Warteliste, Nachrücken, Anwesenheit; Listen als PDF.
6. Rechnungen aus Mitgliedschaften mit QR-Zahlteil, Raten, offenen Posten, Mahnung, Zahlungseingang von Hand oder aus der Bankdatei.
7. Theke mit Kasse, Satz vor Ort und zum Mitnehmen, Tagesabschluss, Lager mit Mindestbestand.
8. «Heute» mit Fristen, Probetrainings, offenen Posten; Monatspaket mit Stunden der Angestellten und Grundzahlen.

| Paket | Ziel | Abnahme (ganz im Auftrag) |
| --- | --- | --- |
| B-1 Gerüst und Einrichten | Studio richtet sich nach Betriebsart ein | `pnpm check:industry courses` grün; Antworten schalten die richtigen Funktionen |
| B-2 Mitglieder und Interessent:innen | Liste aus der Tabelle, Probetrainings | Import mit Fehlerliste; kein Feld für Gesundheit |
| B-3 Tarife und Mitgliedschaften | Fristen ohne Kopfrechnen | Prüfbeispiele 6.2 exakt |
| B-4 Mehrfachkarten und Eintritte | Restguthaben ohne Streit | 6.3 exakt; nichts verfällt von selbst |
| B-5 Check-in an der Theke | Ampel in einer Sekunde | Warnungen 6.4; Selbst-Check-in ohne fremde Daten |
| B-6 Kursplan mit Plätzen | Warteliste ohne Messenger | 6.5 exakt |
| B-7 Rechnungen und Mahnungen | jede Rate am richtigen Tag | 6.6 exakt; QR aus P-29 |
| B-8 Theke, Kasse und Lager | Verkauf mit richtigem Satz | Satz vom Betrieb; Tagesabschluss |
| B-9 Heute, Zahlen und Monatspaket | Überblick und Treuhand | Demo-Tag aus Abschnitt 13 |
| B-10 Lektionen, Stunden, Honorare | Präsenz und Honorar ohne Zettel | 6.7 exakt; kein Urteil zur Selbständigkeit |
| B-11 Sicherheit, Geräte, Kinder, Prüfungen | Nachweise und Abholung | Fristen aus P-42; Abholung nur Berechtigte |
| B-12 Zusatzversicherungen | Zahlungsbestätigung; Tarif 595 nach S-18 | kein Formular ohne Entscheid und Quelle |

**Danach:** Kopplung für Kursliste und zweites iPad ([S-06](../entscheide.md)); Semester mit Einzelunterricht, Eintritte in Spitzenzeiten, Hund mit Impfnachweis «gesehen am», gemietete Hallen; Wertgutscheine; digitaler Gesundheitsbogen nur nach [S-12](../entscheide.md) und Prüfung. **Stufe 2** ([S-14](../entscheide.md)): Online-Buchung, Mitglieder-Ansicht, Mitteilungen, Standorte. **Bewusst nie:** Zutrittssysteme, Drehkreuze, Türsteuerung, Chip-Badges, Zugang ohne Personal; Lastschrift, Zahlungsdienste, Kartenterminal; Biometrie, Videoanalyse; Anbindung an Trainingsgeräte, Wearables, Körperwaagen; Versand an Versicherer; Buchungsplattformen; Trainings- oder Ernährungsempfehlungen; Ranglisten von Personen.

## 13. Demo-Betrieb

**Studio Muster GmbH**, Kraft und Kurse, Musterweg 12, 8000 Beispielstadt; `courses.fitness` mit Kursen; Trainingsfläche, Kursraum mit 16 Plätzen, Theke; MWST-pflichtig, Saldosteuersatz als Demo-Eingabe; Label mit erfundener Nummer QL-0000. Team: A. Muster (Inhaberin, unterrichtet Rücken), B. Muster (Trainer, Stundenlohn, 12 Stunden pro Woche), C. Muster (Leitung Theke und Trainerin, 60 Prozent), D. Muster (Yoga, selbständig), E. Muster (Pilates und Mobility, selbständig), F. Muster (Aushilfe Theke am Samstag, 6 Stunden pro Woche); Reinigung durch die Reinigung Muster GmbH.

**Tarife** (Testwerte in Rappen): Jahresmitgliedschaft 89 000 (automatisch um 12 Monate, Frist 2 Monate, `day_for_day`, voraus oder 12 Raten); Monat 9900; Mehrfachkarte 10 Einheiten 22 000 (12 Monate); Tageseintritt 2500; Probetraining 0; Kinderkurs Selbstverteidigung 24 000 (12 Lektionen, Eltern unterschreiben); Honorar 9000 je Lektion. **Mitglieder:** 238 aktiv (131 Jahr, davon 47 in Raten; 58 Monat; 36 Karten; 13 Kinder), 6 pausiert, 4 gekündigt; Firmenmitgliedschaft der Firma Muster AG für 5 Personen; «Mitglied 0042».

| Lektion | Leitung | Plätze, gebucht, Warteliste | Zeigt |
| --- | --- | --- | --- |
| Montag 18:30 Rücken | A. Muster | 14, 12, 0 | freie Plätze |
| Dienstag 12:15 Functional Circuit | B. Muster | 12, 12, 2 | Nachrücken |
| Mittwoch 19:00 Yoga Vinyasa | D. Muster | 16, 16, 3 | «zusätzliche Lektion prüfen», 8750 bp |
| Donnerstag 18:00 Pilates Matte | E. Muster | 16, 9, 0 | Mindestteilnehmende; E. Muster vertritt einmal D. Muster: 45 000 |
| Samstag 09:30 Kinder Selbstverteidigung | B. Muster | 14, 13, 0 | Abholung, Eltern als Empfänger |

**Ein Tag in «Heute»:** 3 Stichtage in 30 Tagen; Pause von Mitglied 0117 endet morgen; Karte von Mitglied 0203 mit 1 Einheit; 5 Rechnungen überfällig, 2 in der 2. Mahnung, 41 300; Yoga voll; Laufband 1 Service fällig; AED-Elektroden in 6 Wochen; Monat: 7 Eintritte, 3 Kündigungen (126 bp), Auslastung 8400 bp, 2310 Besuche. Theke: Wasser 300, Shake 600, Riegel 350 mit Ablauf, Kaffee 350.

## 14. Risiken und offene Fragen

| Risiko oder Frage | Folge | Was hilft, wer entscheidet |
| --- | --- | --- |
| Tarif 595: genügt eine App ohne Server, braucht es Anbieter-Eintrag, Kosten oder Vertrag; Pflicht nicht bestätigt | Mitglieder verlieren Beiträge, Studios mit Label wechseln nicht | Alban ([S-18](../entscheide.md)) [Geld]; Quelle vor W4 lesen; bis dahin Zahlungsbestätigung |
| Gesundheitsfragen: weglassen, «besprochen am» oder digitaler Bogen | besonders schützenswerte Daten | Alban ([S-12](../entscheide.md)); bis dahin nur Datum |
| Online-Buchung erst in Stufe 2 | weniger Nutzen für Kursstudios | Alban ([S-14](../entscheide.md)) |
| Kursliste aufs Handy, zweites iPad | ohne Kopplung Papier | Alban ([S-06](../entscheide.md)) |
| «du» oder «Sie» und «Abo» in Dokumenten an Mitglieder | Verträge wirken fremd | Alban ([S-07](../entscheide.md)) |
| Pilot Kraftstudio oder Kursstudio; Recherche empfahl W2 | Reihenfolge | Alban ([S-09](../entscheide.md)); Empfehlung Kraftstudio |
| Vertragsvorlagen, Stichtagsregel, Pausen, Lohn, Selbständigkeit | Streit, Nachzahlungen | Text des Betriebs, Hinweise ohne Urteil; Fachperson ([S-17](../entscheide.md)) [Geld] |
| MWST-Abgrenzung, Saldosteuersatz nicht bestätigt | falscher Satz | Betrieb wählt, «Treuhand fragen» |
| Kennung `courses` und `@onestrand/courses` | doppelte Kennungen | Kopf trennt die Namensräume, bevor P-52 «alpha» wird |
| Karte in der Wallet | Entwicklerkonto kostet | Alban [Geld], keine S-Nummer |
| Kinder: Fotos, Abholung, Sonderprivatauszug | Vertrauen der Eltern | Einwilligung als Daten, nur «gesehen am» |
| Datenverlust mit einem iPad | Fristen weg | tägliche Erinnerung an die Sicherung |
| Bankdatei | Kern des Nutzens | Alban ([S-08](../entscheide.md)) |

## 15. Absehbare Plattform-Anträge

| Antrag | An | Zweite Branche |
| --- | --- | --- |
| Getrennte Namensräume für Branche `courses` und Paket `@onestrand/courses` | Kopf | – |
| Mitgliedschaft: Vorlage mit Laufzeit, Verlängerung, Frist, Regel `day_for_day` oder `month_end`, Pause verlängert, Kündigung mit Eingang und Kanal, Preisänderung nur für die nächste Laufzeit, Ersatzmitglied, Unterschrift der Vertretung | P-51 | Termine, Facility |
| Mehrfachkarte: Einheiten je Besuch, Käufer:in ungleich Inhaber:in, Ablauf nur nach Bestätigung, Restwert | P-51 | Termine |
| Ratenplan mit Rest auf der ersten Rate, Anteil erster Monat, Rechnung an Eltern oder Firma, Sammelrechnung, Zahlungsbestätigung | P-29, P-51 | Termine, Umzug |
| Kurse: Abmeldefrist, `late_cancel`, `no_show` mit Port «Einheit abbuchen», Einstieg anteilig, Vertretung, Mindestteilnehmende, Teilnehmende ungleich Vertragspartner:in | P-52 | Termine |
| Gerätemodi «Theke» und «Selbst-Check-in» mit PIN | P-06, P-09 | Termine, Beherbergung |
| Gesetzliche Vertretung, Notfallkontakt, Mitgliednummer, Firma mit Mitarbeitenden | P-22 | Termine, Beherbergung |
| Ablaufdatum je Charge ohne Gastro-Felder; Ausleihe und Rückgabe | P-41 | Beherbergung, Umzug |
| Wertgutschein als Ledger; Tageseintritt | P-30 | Termine, Beherbergung |
| Lohnart je Lektion; Honorar für Selbständige getrennt vom Lohn | P-31 | Termine |
| Heikle Rechte «Honorare», «Rabatte»; Nachweis «gesehen am» ohne Kopie | P-21, P-27 | Beherbergung, Termine |
| Nachricht vorbereiten und über das Teilen-Menü senden | P-28, P-50 | Termine |
| Karte mit QR drucken und lesen | P-10, P-11 | Beherbergung |
| Übersicht in `plattform.md`: P-24 M, P-26 K, P-33 S | Kopf | – |

## 16. Stand

Steckbrief vom 24.11.2026, noch nichts gebaut.

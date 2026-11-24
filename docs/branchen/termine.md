# Termin-Dienstleister: Coiffeur, Kosmetik, Fusspflege, Massage, Hundesalon

- **Kennung im Code:** `salon` (Tabellen `salon_*`, Operationen `salon.<bereich>.<verb>`, Funktionen `salon.<name>`; ADR-Präfix `SAL`)
- **Ausgabe:** Studio ([S-01](../entscheide.md))
- **Welle:** W4 ([Fahrplan](../fahrplan.md)), mit P-50 Termine
- **Eignung:** 4 von 5 – sehr viele Kleinstbetriebe mit täglichem Bedarf an Terminbuch, Kartei, Theke und Tagesabschluss, alles an einem Ort und darum gut in Stufe 1; Abzug, weil der grösste Wechselgrund (Online-Buchung der Kundschaft) einen Server braucht und Gesundheitsangaben heikel sind.
- **Recherche:** [`termine-recherche.md`](termine-recherche.md) · **Auftrag:** [`../auftraege/branche-termine.md`](../auftraege/branche-termine.md)

## 1. Kurzbild

- **Wer:** Coiffeursalons und Barbershops, Kosmetik- und Nagelstudios, kosmetische Fusspflege, nicht-medizinische Massage, Hundesalons.
- **Wie viele:** rund 16'500 bis 16'800 Coiffeursalons mit 24'000 bis 30'000 Beschäftigten; im Schnitt weniger als zwei Personen je Salon; rund 6'000 Kosmetik- und Nagelstudios (Drittquelle). Fusspflege, Massage und Hundesalons ohne getrennte amtliche Zahl ([Recherche](termine-recherche.md), Abschnitt 1 und Quellen Q1 bis Q3).
- **Im Betrieb:** Inhaber:in an der Theke und am Platz, Fachkräfte, Lernende, Aushilfen; oft Personen mit Stuhl- oder Platzmiete. Barber- und Nagelstudios oft mit anderer Muttersprache (Annahme).
- **Ort:** fast alles im Salon an einem Ort; ein iPad an der Theke ist das Hauptgerät. Wenig Aussendienst (Hausbesuche in Heimen).
- **Saison:** Spitzen vor Festtagen und Hochzeiten, Sommerloch.

## 2. Teilbranchen und Betriebsarten

| Betriebsart | Kennung | Was sie tut | Startfunktionen |
| --- | --- | --- | --- |
| Coiffeur | `salon.hair` | Schneiden, Färben, Pflege; Farbrezepturen | Terminbuch, Kartei mit Rezepturen, Theke, Gutscheine |
| Barber | `salon.barber` | Bart und Haar, viel Laufkundschaft | Terminbuch mit Warteliste, Theke |
| Kosmetik | `salon.cosmetics` | Gesicht, Körper, Geräte | Terminbuch, Kartei, Einwilligungen, Geräte-Nachweise |
| Nagelstudio | `salon.nails` | Manicure, Gel, Nail Art | Terminbuch, Theke, Lager |
| Kosmetische Fusspflege | `salon.foot_care` | am gesunden Fuss, nie medizinisch | Terminbuch, Kartei mit Kennzeichen, Hygiene |
| Massage (nicht-medizinisch) | `salon.massage` | Wellness, Entspannung | Terminbuch, Mehrfachkarten |
| Hundesalon | `salon.dog_grooming` | Pflege und Schur | Terminbuch, Tierkartei, Theke |

## 3. Alltag

- **Kundin:** ruft an, schreibt oder kommt vorbei, bekommt einen Termin, erscheint (oder nicht), wird behandelt, zahlt an der Theke, bucht den nächsten Termin.
- **Tag:** Terminbuch prüfen, Lücken füllen, Bestätigungen am Vortag, Einwirkzeiten parallel nutzen, Theke, Tagesabschluss mit Bargeld, Karte und mobiler Zahlung.
- **Woche und Monat:** Produkte nachbestellen, Dienstplan, Stunden der Lernenden, Gutscheine, Monatspaket an die Treuhand.
- **Jahr:** Preisliste neu aushängen, Festtagsspitzen, Ferien.
- **Heute:** Terminbuch auf Papier oder im Handy-Kalender, Kartei im Kopf oder auf Karteikarten, Bestätigungen per Messenger von Hand, Tagesabschluss mit Zettel.

## 4. Schmerzen

1. Terminbuch auf Papier: Doppelbuchungen, Lücken, nicht erschienene Kundschaft ohne Nachweis.
2. Bestätigungen und Erinnerungen von Hand kosten jeden Abend Zeit.
3. Farbrezepturen und Vorlieben im Kopf einer Person; fällt sie aus, ist das Wissen weg.
4. Tagesabschluss mit Bargeld, Karte, mobiler Zahlung und Trinkgeld von Hand.
5. Gutscheine auf Papier: Restwert und Einlösung unklar.
6. Preisliste muss angeschrieben sein; Kontrollen durch das SECO.
7. Stuhlmiete und Provision ohne klare Abrechnung.
8. Gesundheitsangaben (Allergien) auf Papier an der Theke.

Warum heute keine Software: Kosten pro Monat, Bindung an Zahlungsterminals oder Buchungsplattformen, Komplexität, Angst um die Kundenkartei (Annahme aus der Recherche).

## 5. Plattform-Module

| Modul | Wofür | Einstellungen der Branche | Prio |
| --- | --- | --- | --- |
| P-20 Betrieb und Personen | Salon, Team, Plätze | Plätze und Stühle als Ressourcen | M |
| P-21 Rollen und Rechte | Theke ohne Rezeptur-Details und Gesundheitsdetails | Vorlagen in Abschnitt 8; heikle Rechte Gesundheit, Provisionen, Kartei exportieren | M |
| P-22 Kundschaft | Kartei mit Kontakt, Vorlieben, Verlauf | Tierkartei beim Hundesalon (Halter:in ist Kundschaft) | M |
| P-24 Leistungen und Material | Leistungen mit Dauer, Phasen und Preis; Produkte | Preisliste als Aushang (PBV) | S |
| P-27 Checklisten und Nachweise | Hygiene, Sterilisator, Geräte mit Sachkundenachweis | Vorlagen je Betriebsart | S |
| P-28 Kalender und Erinnerungen | Öffnungszeiten, Ferien, «Morgen bestätigen» | Nachrichten zum Teilen | M |
| P-29 Offerten und Rechnungen | Rechnung an Heime und Firmen (Hausbesuche) | selten | S |
| P-30 Kasse und Belege | Theke, Tagesabschluss, Trinkgeld getrennt, Monatspaket | Zahlarten bar, Karte, mobil, Gutschein | M |
| P-31 Team und Zeit | Stunden, Lernende, GAV Coiffeur als Vorlage | Provision nie als Ersatz für den Mindestlohn | S |
| P-32 Heute | Termine des Tages, Lücken, Bestätigungen offen | – | M |
| P-33 Fotos und Dateien | Vorher und nachher, Einwilligungen | Fotos nur mit Einwilligung | S |
| P-40 Kopplung und Abgleich | Theke-iPad und Handy im Salon-WLAN | nur nach Albans JA ([S-06](../entscheide.md)) | S |
| P-41 Material und Lager | Produkte, Verbrauch je Rezeptur, Mindestbestand | – | S |
| P-50 Termine | Terminbuch mit Ressourcen (Person, Platz), Phasen, Warteliste | Herzstück | M |
| P-51 Verträge und Mitgliedschaften | Wertgutscheine und Mehrfachkarten als Ledger | Restwert berechnet | K |

## 6. Eigene Module der Branche

| Modul | Kennung | Zweck | Datenobjekte (Auszug) | Rechenregeln, Dokumente |
| --- | --- | --- | --- | --- |
| Terminbuch des Salons | `salon_book` | Spalten je Person und Platz, Behandlung in Phasen (Arbeit, Einwirkzeit, Arbeit), Folgetermin aus der Theke | `salon_appointments` (Verweis auf P-50-Termin: Leistung, Person, Platz, Phasen, Status geplant, bestätigt, erschienen, nicht erschienen, abgesagt) | parallele Termine während der Einwirkzeit; Tagesplan als PDF |
| Kartei und Rezepturen | `salon_client_record` | Vorlieben, Farbrezepturen, Verlauf; Tierkartei | `salon_formulas` (Kundschaft, Datum, Produkte, Mengen in g, Einwirkzeit, Ergebnis-Notiz), `salon_pets` (Name, Rasse, Grösse, Hinweise) | Rezeptur wiederholen mit einem Tipp |
| Theke | `salon_front_desk` | Leistungen und Produkte verkaufen, Folgetermin | nutzt P-30; `salon_tips` getrennt je Person | Tagesabschluss; Trinkgeld je Person für die Treuhand |
| Provision | `salon_commission` | Umsatzbeteiligung je Person | Regel je Person (Prozent auf Leistungen, Produkte) | nur Vorbereitung für die Treuhand; Hinweis, dass Provision den Mindestlohn nicht ersetzt |
| Stuhl- und Platzmiete | `salon_chair_rental` | Mietperson führt einen **eigenen Betrieb** auf eigenem Gerät; im Salon nur die Belegung ihres Platzes | `salon_chair_bookings` | Monatsrechnung der Miete über P-29; Hinweis auf den AHV-Status (die App beurteilt nie) |
| Hygiene, Geräte, Einwilligungen | `salon_hygiene` | Sterilisator, Geräte mit Sachkundenachweis (Laser, IPL), Einwilligungen für Fotos | Checklisten über P-27, Nachweis je Person | Hinweis bei Buchung, wenn der Nachweis fehlt |

Plattform-Kandidaten: Gutscheine und Mehrfachkarten (P-51, auch Kurse), Einwilligungen (P-27 oder P-22, auch Kurse, Beherbergung).

## 7. Vorlagen

- **Leistungen** mit Dauer und Phasen, ohne Preise: Damenschnitt, Herrenschnitt, Färben Ansatz, Strähnen, Bart, Manicure, Gel-Modellage, Gesichtsbehandlung, kosmetische Fusspflege, Rückenmassage 30 und 60 Minuten, Hundeschur nach Grösse.
- **Checklisten:** Öffnen und Schliessen, Sterilisator, Geräte, Handschuhe und Hautschutz (Hinweis auf die Branchenlösung), Wochenreinigung.
- **Dokumente:** Preisliste zum Aushängen, Tagesplan, Gutschein mit Nummer, Beleg, Tagesabschluss, Monatspaket, Einwilligung für Fotos.
- **Fragen beim Einrichten:** Was machst du? (Betriebsart) · Wie viele Plätze? · Arbeiten Personen mit Stuhlmiete bei dir? · Verkaufst du Produkte? · Gibst du Gutscheine aus?

## 8. Rollen und Arbeitsplätze

| Rolle | Sieht und tut | Sieht nie | Gerät |
| --- | --- | --- | --- |
| Inhaber:in | alles | – | iPad an der Theke, iPhone |
| Salonleitung | Terminbuch aller, Kartei, Kasse, Tagesabschluss, Lager, Dienstplan | Löhne, Provisionen anderer (schaltbar) | iPad, iPhone |
| Fachkraft | eigene Termine, Kartei, Kasse für eigene Kundschaft, eigene Provision und Stunden | Umsatz anderer, Löhne, Gesundheitsdetails ohne Recht | iPad am Platz |
| Lernende | eigene Termine, Kartei lesen, Rezeptur vorschlagen | Kasse ohne Freigabe, Umsatz, Löhne | iPad |
| Theke | Terminbuch, Kasse, Gutscheine, Kundschaft anlegen | Rezepturen, Gesundheitsdetails (nur Kennzeichen), Löhne | iPad an der Theke |
| Mietperson | eigener Betrieb in der App | alles vom Salon | eigenes Gerät |

Gerätemodus «Theke» mit PIN je Person (Plattform-Antrag P-06, P-09).

## 9. Recht und Pflichten

Quellen und Güte in der [Recherche](termine-recherche.md), Abschnitt 8 und Quellen. Prüfdatum 24.11.2026; Werte aus Suchauszügen vor dem Einbau am Original prüfen.

| Fakt | Wert | Quelle | Was die App tut |
| --- | --- | --- | --- |
| GAV Coiffeurgewerbe | allgemeinverbindlich bis 31.12.2027; Lernende nicht erfasst | SECO-Liste der AVE-GAV (Recherche Q5), Auszug | Regelwerk als Vorlage mit Quelle |
| Mindestlohn Coiffeur mit EFZ 2026 | 4'160 Franken (1. und 2. Berufsjahr), 4'360 Franken ab 3. Jahr | Drittquelle (Q7), **nicht bestätigt** | erst nach Prüfung als Richtwert |
| Kosmetik, Nagel, Fusspflege, Massage, Hundesalon | kein allgemeinverbindlicher GAV gefunden | SECO-Liste (Q5), Annahme | Regelwerk «nur Arbeitsgesetz» |
| Preisbekanntgabe | Coiffeur und kosmetische Institute im Katalog von Art. 10 PBV; Kontrollen 2025 | SECO (Q14) | Preisliste als Aushang |
| Trinkgeld | kann zum massgebenden Lohn gehören (AHVV Art. 7 Bst. e) | Wegleitung (Q25), **nicht am Original geprüft** | getrennt je Person erfassen; die Treuhand entscheidet |
| Stuhlmiete | Status entscheidet die AHV nach den tatsächlichen Verhältnissen | Recherche R12 | getrennter Betrieb, Hinweis; die App beurteilt nie |
| Laser, IPL, Ultraschall, Kälte | seit 1.6.2024 Sachkundenachweis | BAG (Q9) | Nachweis je Person, Hinweis bei Buchung |
| Gesundheitsdaten | besonders schützenswert (DSG Art. 5 Bst. c) | Q17 | nur Kennzeichen ohne Diagnose, heikles Recht ([S-12](../entscheide.md)) |
| Podologie, medizinische Massage | kantonal bewilligungspflichtig | Q10, Q11 | **ausserhalb** der Branche ([S-21](../entscheide.md)) |
| Gutscheine | Verjährung in der Regel 10 Jahre (OR 127); kürzerer Ablauf umstritten | Q16 | Gültigkeit nur als Richtwert mit Hinweis |
| Arbeitszeit | Erfassung nach ArGV 1 Art. 73, Aufbewahrung 5 Jahre | [`../fakten/arbeit-personal.md`](../fakten/arbeit-personal.md) | P-31 |
| MWST | Pflicht ab 100'000 Franken Umsatz; Normalsatz 8,1 % | [`../fakten/geld-steuern.md`](../fakten/geld-steuern.md) | Hinweis an der Schwelle |

## 10. Geräte und Abgleich

Fast alles geschieht an einem Ort: ein iPad an der Theke als Hauptgerät, dazu iPads an Plätzen oder Handys. Stufe 1: ein Gerät reicht; mehrere Geräte im Salon-WLAN nach Albans JA ([S-06](../entscheide.md)). Was erst Stufe 2 löst: Online-Buchung durch die Kundschaft, automatische Erinnerungen per SMS oder Mail, Terminbuch von unterwegs ([S-14](../entscheide.md)). Nie auf fremde Geräte: Rezepturen und Gesundheitsangaben.

## 11. Wörter

Kundin, Kunde (nicht «Klient»); Termin; Platz; Behandlung; Einwirkzeit; Rezeptur; Folgetermin; Nicht erschienen; Wertgutschein, Leistungsgutschein; Mehrfachkarte; Stuhlmiete; Tagesabschluss. Beim Hundesalon: Halter:in, Hund, Schur.

## 12. MVP und Pakete

**MVP** (Pilot: Coiffeursalon mit 1 bis 4 Personen, ohne Stuhlmiete): Terminbuch mit Phasen; Kartei mit Rezepturen und Kennzeichen; Leistungen und Preisliste als Aushang; Theke mit Tagesabschluss und Trinkgeld getrennt; Wertgutscheine; «Morgen bestätigen» als Nachrichten zum Teilen; Rollen Inhaber:in, Fachkraft, Theke; Sicherung und Monatspaket.

| Paket | Ziel | Abnahme |
| --- | --- | --- |
| B-1 Gerüst und Einrichten | Salon richtet sich in fünf Minuten ein | `pnpm check:industry salon` grün; Demo «Coiffure Muster» |
| B-2 Terminbuch | Termine mit Phasen je Person und Platz | Färben mit 30 Minuten Einwirkzeit erlaubt einen zweiten Termin am selben Platz; keine Doppelbuchung |
| B-3 Kartei und Rezepturen | Wissen bleibt im Salon | Rezeptur mit einem Tipp wiederholen; Theke sieht nur das Kennzeichen |
| B-4 Theke und Tagesabschluss | Abend in fünf Minuten | Bar, Karte, mobil und Gutschein ergeben den Abschluss; Trinkgeld je Person getrennt |
| B-5 Gutscheine | Restwert jederzeit klar | Wertgutschein über 100 Franken, zwei Einlösungen, Restwert berechnet |
| B-6 Bestätigungen | Lücken und Ausfälle sinken | Liste «Morgen bestätigen», Nachricht mit einem Tipp ins Teilen-Menü |
| B-7 Preisliste | Pflicht nebenbei | Aushang als PDF mit allen Leistungen und Preisen |
| B-8 Monatspaket | Treuhand ohne Zusammensuchen | ZIP mit Kassenbuch, Abschlüssen, offenen Gutscheinen, Belegen |

**Danach:** Lager mit Verbrauch je Rezeptur, Provision, Team und Zeit mit GAV-Vorlage, Hygiene und Geräte, Einwilligungen, Fotos vorher und nachher, Mehrfachkarten, Stuhlmiete, Warteliste; später Hausbesuche mit Rechnung, Auswertungen, Sprachen. **Stufe 2:** Online-Buchung, automatische Erinnerungen. **Nie:** Anbindung an Zahlungsterminals, Buchungs- oder Bewertungsplattformen und Versicherer; Tarif 590; Beurteilung von Hauttests, Allergien oder AHV-Status; Lohnbuchhaltung; Marketing-Versand.

## 13. Demo-Betrieb

«Coiffure Muster», Musterweg 12, 8000 Beispielstadt: Inhaberin A. Muster, Fachkraft B. Muster, Lernende C. Muster; zwei Plätze und ein Waschplatz; 40 Kundinnen und Kunden mit Rezepturen; ein Dienstag mit acht Terminen, einer Färbung mit Einwirkzeit, einem «Nicht erschienen» und einem Gutschein.

## 14. Risiken und offene Fragen

| Frage oder Risiko | Folge | Wer entscheidet, was hilft |
| --- | --- | --- |
| Online-Buchung und automatische Erinnerungen | ohne sie fehlt der grösste Wechselgrund | Alban, [S-14](../entscheide.md) |
| Gesundheitsangaben auf dem Theke-iPad | heikle Daten offen sichtbar | Kennzeichen statt Details, Rechte, PIN; Alban [S-12](../entscheide.md) |
| Stuhlmiete als eigener Betrieb auf eigenem Gerät | Abbildung nah an der Wirklichkeit, kein Risiko der Eingliederung | Alban bestätigt |
| Anrede in Dokumenten (Gutschein, Rechnung an Heime) | «du» wirkt falsch bei älterer Kundschaft | Alban, [S-07](../entscheide.md) |
| Medizinische Leistungen | Bewilligungen, Versicherer | ausserhalb, [S-21](../entscheide.md) |
| Ausfallgebühr | keine Rechtsgrundlage belegt | nur Text in der Bestätigung, vom Betrieb formuliert |
| Hundesalon hier oder in einer späteren Branche «Tiere» | Tierkartei doppelt | Kopf entscheidet nach dem Screening ([`weitere.md`](weitere.md)) |

## 15. Absehbare Plattform-Anträge

- P-50: Termine mit Phasen (Arbeit, Einwirkzeit, Arbeit) und parallelen Belegungen eines Platzes.
- P-51: Wertgutschein und Leistungsgutschein als Ledger mit Käufer:in ungleich Inhaber:in (auch Kurse).
- P-06, P-09: Gerätemodus «Theke» mit PIN je Person (auch Kurse, Beherbergung).
- P-27 oder P-22: Einwilligungen mit Unterschrift auf dem Gerät und Ablauf (auch Kurse, Beherbergung).
- P-30: Trinkgeld getrennt je Person im Tagesabschluss.

## 16. Stand

Steckbrief vom 24.11.2026, vom Kopf aus der Recherche verdichtet (die Prüfung der Rechtsangaben an der Quelle steht noch aus); noch nichts gebaut.

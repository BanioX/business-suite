# Hotellerie und kleine Beherbergung

- **Kennung im Code:** `lodging` (Tabellen `lodging_*`, Operationen `lodging.<bereich>.<verb>`, Funktionen `lodging.<name>`; ADR-Präfix `LDG`)
- **Ausgabe:** Haus ([S-01](../entscheide.md)); mit Restaurant zusammen mit den Modulen der Gastronomie
- **Welle:** W5 ([Fahrplan](../fahrplan.md)); ein Hotel ohne Restaurant geht früher, sobald P-50, P-26, P-27 und P-29 stehen
- **Eignung:** 4 von 5 – Belegungsplan, Gästemeldung, Kurtaxe, Statistik, Hauswirtschaft und Gästerechnung sind tägliche Pflichtarbeit in vielen kleinen Häusern; ohne Netz zu arbeiten ist beim Check-in ein Vorteil; Abzug für die kantonale Vielfalt (Meldewege, Kurtaxen) und den Wunsch nach Online-Buchung.
- **Recherche:** [`beherbergung-recherche.md`](beherbergung-recherche.md) · **Auftrag:** [`../auftraege/branche-beherbergung.md`](../auftraege/branche-beherbergung.md)

## 1. Kurzbild

- **Wer:** kleines Hotel mit Restaurant, Hotel garni und Pension, Gasthof mit Zimmern, B&B, eigene Ferienwohnungen, Vermietung für Eigentümer:innen, Apartments, Gruppenunterkunft und kleines Hostel. Campingplätze nicht.
- **Wie viele:** je Teilbranche nicht belegt (STATENT des BFS, NOGA 55.10, 55.20, 55.90, im Bau nachtragen); belegte Auszüge in der [Recherche](beherbergung-recherche.md), Tabelle 1.1a.
- **Grösse:** B&B 1 bis 5 Zimmer und 1 bis 2 Personen; Hotel garni 8 bis 30 Zimmer und 2 bis 8 Personen; Hotel mit Restaurant 15 bis 50 Zimmer und 8 bis 20 Personen in der Saison.
- **Im Betrieb:** Gastgeber:in (oft ein Paar), Rezeption, Hauswirtschaft mit Zimmerreinigung im Stundenlohn, Frühstück und Küche, Hauswartung, Saisonhilfen. Die Hauswirtschaft spricht oft nicht Deutsch.
- **Ort:** im Haus; Ferienwohnungen verstreut im Dorf.
- **Saison:** Winter- und Sommersaison in Bergregionen, Ruhezeiten mit Unterhalt; in Städten ganzjährig.

## 2. Teilbranchen und Betriebsarten

| Betriebsart | Kennung | Startfunktionen |
| --- | --- | --- |
| Hotel garni, Pension | `lodging.hotel_garni` | Belegungsplan, Gästeregister, Gästerechnung, Hauswirtschaft, Kurtaxe, Statistik |
| Gasthof, Hotel mit Restaurant | `lodging.inn` | wie oben; dazu Module der Gastronomie (nach R5, [`../randen.md`](../randen.md)) |
| B&B, Gästezimmer | `lodging.bnb` | Belegungsplan, Gästeregister, Gästerechnung, Kurtaxe |
| Ferienwohnungen | `lodging.holiday_flat` | Belegungsplan, Wechseltag, Übergabe, Kaution, Eigentümer-Abrechnung |
| Gruppenunterkunft, Hostel | `lodging.hostel` | Betten statt Zimmer, Gruppen, Halbpension |

## 3. Alltag

- **Vom Kontakt bis zur Rechnung:** Anfrage (Telefon, Mail, eigene Website, Buchungsplattform), Option oder Reservation, Anzahlung, Anreise mit Meldeschein, Aufenthalt mit Konsumationen, Abreise mit Rechnung und Kurtaxe, Zahlung.
- **Tag:** Anreisen und Abreisen prüfen, Tagesliste der Hauswirtschaft (Abreise, Bleibe, Kontrolle, Freigabe), Frühstückszahl an die Küche, Meldescheine, Rechnungen, Mängel und Fundsachen.
- **Monat:** Kurtaxe abrechnen, Beherbergungsstatistik melden, Dienstplan, Monatspaket an die Treuhand.
- **Jahr:** Saison öffnen und schliessen, Preise, Unterhalt, Personal anstellen.
- **Heute:** Belegungsplan auf Papier oder in einer Tabelle, Meldescheine auf Papier, Kurtaxe und Statistik von Hand zusammengezählt, Tagesliste als Zettel.

## 4. Schmerzen

1. Doppelbuchungen zwischen Telefon, Website und Plattformen.
2. Meldescheine, Kurtaxe und Statistik kosten am Monatsende Abende.
3. Zimmerstatus zwischen Etage und Rezeption über Zuruf.
4. Rechnungen mit verschiedenen MWST-Sätzen (Beherbergung, Essen, Alkohol) und Kurtaxe von Hand.
5. Arbeitszeit nach L-GAV mit zwei Ruhetagen, geteiltem Dienst und Überzeit.
6. Mängel und Fundsachen gehen unter.
7. Wäsche und Minibar ohne Überblick.
8. Ferienwohnungen: Wechseltag, Schlüssel, Kaution und Abrechnung an Eigentümer:innen.

## 5. Plattform-Module

| Modul | Wofür | Einstellungen der Branche | Prio |
| --- | --- | --- | --- |
| P-20, P-21 Betrieb, Personen, Rechte | Haus, Team; «Wer putzt, braucht keine Namen» | Rollen in Abschnitt 8 | M |
| P-22 Kundschaft | Gäste und Firmen | Gästedaten heikel; Löschfrist | S |
| P-23 Objekte und Standorte | Haus › Etage › Zimmer, Betten, Kategorien; Ferienwohnungen | Zimmer als Einheit | M |
| P-24 Leistungen und Material | Zimmerpreise, Frühstück, Konsumationen mit MWST-Kennung | Sätze Beherbergung, Normalsatz, reduziert | K |
| P-25 Aufträge | selten (Gruppen, Anlässe) | – | S |
| P-26 Pläne und Wiederkehr | Hauswirtschaft, Kontrollen mit Intervallen | Abreise, Bleibe, Grundreinigung | M |
| P-27 Checklisten und Nachweise | Zimmerkontrolle, Legionellen, Brandschutz, Geräte | Vorlagen | M |
| P-28 Kalender und Erinnerungen | Saison, Fristen für Kurtaxe und Statistik | – | M |
| P-29 Offerten und Rechnungen | Gästerechnung, Anzahlung, Gutschrift, Rechnung an Firmen mit QR | Sondersatz Beherbergung | S |
| P-30 Kasse und Belege | Rezeption, Konsumationen, Tagesabschluss, Monatspaket | – | M |
| P-31 Team und Zeit | Stempeln, Dienstplan mit zwei Ruhetagen und geteiltem Dienst, Überzeit | Regelwerk L-GAV (aus Randen) | M |
| P-40 Kopplung | Rezeption, Office, Küche im Haus-WLAN | nach Albans JA ([S-06](../entscheide.md)) | M |
| P-41 Material und Lager | Minibar, Wäsche als Bestand | – | S |
| P-50 Termine | Belegungsplan als Termine mit Ressource «Zimmer» (Plattform-Antrag) | Nächte statt Stunden | M |

## 6. Eigene Module der Branche

| Modul | Kennung | Zweck und Datenobjekte | Regeln und Dokumente |
| --- | --- | --- | --- |
| Belegungsplan und Reservation | `lodging_reservations` | Reservation, Option mit Ablauf, Sperre, Kanal als Etikett (keine Anbindung), Zimmer, Nächte, Personen, Anzahlung | Warnung bei Überschneidung; Sperrliste je Kanal zum Abtippen |
| Gästeregister und Meldeschein | `lodging_guest_register` | Gast, Ausweisart und Nummer, Herkunft, Anreise, Abreise, Unterschrift auf dem iPad | Tagesliste und Datei für den kantonalen Meldeweg; Löschfrist als Einstellung; Ausweisbild nie als Standard |
| Kurtaxe und Abgaben | `lodging_tourist_tax` | Reglement der Gemeinde als Regelwerk (Ansatz je Person und Nacht, Befreiungen, Altersgrenzen) | Abrechnung je Monat; auf der Rechnung getrennt ausgewiesen |
| Beherbergungsstatistik | `lodging_statistics` | Ankünfte und Logiernächte nach Herkunft, Zimmer, Betten, geöffnete Tage | Übersicht für die monatliche Meldung mit Erinnerung |
| Hauswirtschaft | `lodging_housekeeping` | Zimmerstatus (Abreise, Bleibe, geputzt, kontrolliert, frei, gesperrt), Zuteilung, Mängel, Fundsachen | Tagesliste mit Symbolen, ohne Gästenamen; Ausdruck |
| Gästerechnung | `lodging_folio` | Positionen mit MWST-Satz, Kurtaxe, Konsumationen, Anzahlung, Gutschrift | über P-29; Sondersatz Beherbergung inkl. Frühstück |
| Wäsche, Minibar | `lodging_linen`, `lodging_minibar` | Bestand als Ledger, Nachfüllliste | Welle 2 |
| Ferienwohnungen | `lodging_holiday_flats` | Wechseltag, Übergabeprotokoll, Kaution, Eigentümer-Abrechnung | Welle 3 |

## 7. Vorlagen

- **Leistungen:** Zimmer je Kategorie und Nacht, Frühstück, Halbpension, Kinderbett, Hund, Parkplatz, Minibar-Artikel (ohne Preise, mit MWST-Kennung).
- **Checklisten:** Zimmerkontrolle, Abreise und Bleibe, Grundreinigung, Legionellen (Hinweis), Brandschutz (Hinweis), Saison öffnen und schliessen.
- **Dokumente:** Reservationsbestätigung, Meldeschein, Gästerechnung, Kurtaxe-Abrechnung, Statistik-Übersicht, Tagesliste, Übergabeprotokoll.
- **Fragen beim Einrichten:** Was für ein Haus? · Wie viele Zimmer und Betten? · Mit Restaurant? · Welche Gemeinde (Kurtaxe)? · Welche Kanäle für Buchungen?

## 8. Rollen und Arbeitsplätze

| Rolle | Sieht und tut | Sieht nie | Gerät |
| --- | --- | --- | --- |
| Gastgeber:in | alles | – | iPad an der Rezeption, Computer, Handy |
| Rezeption, Büro | Plan, Reservationen, Gästeregister, Rechnungen, Kasse, Mängel | Löhne, Einstellungen; ausgestellte Rechnungen nur per Gutschrift | iPad, Computer |
| Leitung Hauswirtschaft | Tagesliste aller, Zuteilung, Kontrolle, Wäsche, Minibar, Mängel | Gästenamen (nur Zimmernummer und Hinweise wie «Hund»), Preise, Rechnungen, Löhne | Tablet im Office |
| Zimmerreinigung | eigene Tagesliste mit Symbolen, Status, Minibar zählen, Mangel und Fundsache mit Foto, eigene Zeit | Gästedaten, Preise, Löhne | gemeinsames Tablet, Ausdruck |
| Hauswartung | Mängel, Kontrollen, Schlüssel nach Nummer | Gästedaten, Rechnungen, Löhne | Handy |
| Frühstück, Küche | Gästezahl und Hinweise zu Unverträglichkeiten nur für heute | Namen über den Tag hinaus | Tablet in der Küche |

## 9. Recht und Pflichten

Quellen in der [Recherche](beherbergung-recherche.md), Abschnitt 8. Prüfdatum 24.11.2026; «Auszug» heisst vor dem Einbau am Original prüfen.

| Fakt | Wert | Quelle, Güte | Was die App tut |
| --- | --- | --- | --- |
| MWST-Sätze | Normalsatz 8,1 %, reduziert 2,6 %, Sondersatz Beherbergung 3,8 % inkl. Frühstück | MWSTG Art. 25, belegt | Sätze als datierter Katalog ([`../fakten/geld-steuern.md`](../fakten/geld-steuern.md)) |
| Dauer des Sondersatzes | bis 31.12.2027; Verlängerung bis 2031 vom Parlament beschlossen | Parlament, Geschäft 26.026 | Gültigkeit im Katalog |
| Abstimmung 29.11.2026 | bei Ja ab frühestens 2028 Normalsatz 8,5 %, Sondersatz 4,0 % | Erläuterungen des Bundesrates | nach dem Ergebnis nachführen |
| Meldepflicht ausländischer Gäste | AIG Art. 16, Verfahren VZAE Art. 18; Pflichtfelder und Löschfristen kantonal | Auszug | Meldeschein, Datei für den Meldeweg; direkte Übermittlung nur nach [S-20](../entscheide.md) |
| Elektronische Meldung | Vernehmlassung der VZAE bis 27.11.2026, Plattform des Bundes | Bundesrat, Auszug | beobachten; keine Anbindung |
| Beherbergungsstatistik HESTA | monatlich, obligatorisch für Hotels und Kurbetriebe | BFS, Auszug | Übersicht und Erinnerung |
| Kurtaxe | kommunal, je Reglement; auf der Rechnung getrennt | Gemeindereglemente, Auszug | Regelwerk je Gemeinde mit Quelle |
| L-GAV Gastgewerbe | Mindestlöhne ab 1.1.2026 (Ia 3'713 Franken, IIIa 4'528 Franken), zwei Ruhetage, 13. Monatslohn, Arbeitszeitkontrolle Pflicht | Sozialpartner, Auszug | Regelwerk aus Randen (P-31) |
| Gastbetriebe im Arbeitsgesetz | Nacht- und Sonntagsarbeit ohne Bewilligung (ArGV 2 Art. 23) | SECO, Auszug | Hinweis im Dienstplan |
| Preisbekanntgabe | überwälzte Abgaben gehören in den Detailpreis (PBV Art. 4) | belegt | Preise inklusive MWST und Kurtaxe zeigen |

## 10. Geräte und Abgleich

Alles im Haus: iPad an der Rezeption als Hauptgerät, Tablet im Office der Hauswirtschaft, Tablet in der Küche. Stufe 1: ein Gerät mit Ausdruck der Tagesliste; mehrere Geräte im Haus-WLAN nach Albans JA ([S-06](../entscheide.md)). Kalenderdateien von Buchungsplattformen nur als Datei, die die Person selbst lädt ([S-19](../entscheide.md)). Stufe 2: Online-Buchung von der eigenen Website ([S-14](../entscheide.md)). Nie auf Geräte der Hauswirtschaft: Gästenamen, Ausweisdaten, Preise.

## 11. Wörter

Zimmer, Kategorie, Belegung, Option, Reservation, Anreise, Abreise, Bleibe, Logiernacht, Meldeschein, Kurtaxe, Hauswirtschaft, Zimmerstatus, Fundsache, Gästerechnung, Wechseltag.

## 12. MVP und Pakete

**MVP** (Hotel garni, Gasthof mit Zimmern oder B&B bis 20 Zimmer): Haus einrichten; Belegungsplan; Gästeregister mit Meldeschein; Gästerechnung mit Kurtaxe; Tagesliste der Hauswirtschaft; Kurtaxe und Statistik am Monatsende; Team und Zeit nach L-GAV; Kasse, Belege, Monatspaket, Sicherung.

| Paket | Ziel | Abnahme |
| --- | --- | --- |
| B-1 Gerüst und Haus | Haus mit Zimmern und Kategorien in fünf Minuten | `pnpm check:industry lodging` grün; Import aus einer Tabelle |
| B-2 Belegungsplan | keine Doppelbuchung | Überschneidung wird gewarnt; Option läuft ab |
| B-3 Gästeregister | Meldung nebenbei | Meldeschein mit Unterschrift, Tagesliste, Datei; Löschfrist wirkt |
| B-4 Gästerechnung | richtige Sätze ohne Rechnen | Zimmer mit Frühstück zum Sondersatz, Wein zum Normalsatz, Kurtaxe getrennt ohne MWST |
| B-5 Hauswirtschaft | Zimmerstatus ohne Zuruf | Tagesliste ohne Gästenamen, Status bis «frei», Ausdruck mit Symbolen |
| B-6 Monatsabschluss Behörden | Abende sparen | Kurtaxe-Abrechnung und Statistik-Übersicht stimmen mit dem Register |
| B-7 Team und Zeit | L-GAV einhalten | zwei Ruhetage geprüft, Überzeitsaldo monatlich |
| B-8 Kasse und Monatspaket | Treuhand ohne Zusammensuchen | ZIP mit Rechnungen, Kasse, Belegen |

**Danach:** Wäsche und Minibar, Kontrollen mit Intervallen, Kennzahlen in «Erweitert», Gruppen und Arrangements, Frühstücksliste an die Gastronomie, Tagesliste in weiteren Sprachen; dann Ferienwohnungen, Saisonpersonal, Kalenderdatei. **Nie:** Anbindung an Buchungsplattformen, Kartenterminals oder Schliesssysteme; automatische Preissteuerung; Ausweisbilder als Standard; Beurteilung von Befunden; Campingplätze.

## 13. Demo-Betrieb

«Hotel garni Muster», Musterweg 12, 8000 Beispielstadt: 14 Zimmer in drei Kategorien, Gastgeberin A. Muster, Rezeption B. Muster, zwei Personen in der Zimmerreinigung (C. und D. Muster); eine Woche im Februar mit Anreisen, einer Gruppe, zwei Fundsachen und einem Mangel; Kurtaxe nach einem erfundenen Reglement der Gemeinde Beispielstadt.

## 14. Risiken und offene Fragen

| Frage oder Risiko | Folge | Wer entscheidet, was hilft |
| --- | --- | --- |
| Kalenderdatei von Buchungsplattformen | ohne sie bleibt das Risiko der Doppelbuchung | Alban, [S-19](../entscheide.md) |
| Meldeschein elektronisch | Gästedaten verlassen das Gerät | Alban, [S-20](../entscheide.md) |
| Hotel mit Restaurant | braucht die Module der Gastronomie | Ausgabe «Haus» mit Gastro-Modulen nach R5, [S-01](../entscheide.md) |
| Anrede in Dokumenten an Gäste | Höflichkeitsform erwartet | Alban, [S-07](../entscheide.md) |
| MWST-Aufteilung (Arrangement, Minibar, Parkplatz, Hund) | falsche Rechnung | Branchen-Info der ESTV lesen, Treuhand im Pilot |
| Kantonale Vielfalt | Meldewege, Kurtaxen je Gemeinde | Pilot in einem Kanton, Vorlagen als Daten mit Quelle |
| Online-Buchung | grösster Wunsch | Stufe 2, [S-14](../entscheide.md) |

## 15. Absehbare Plattform-Anträge

- P-50: Ressource «Zimmer» mit Nächten statt Stunden, Option mit Ablauf.
- P-23: Haus › Etage › Zimmer mit Betten und Kategorien; Schlüssel nach Nummer (gemeinsam mit Facility).
- P-26, P-27: Tagesliste aus Belegung (Abreise, Bleibe) mit Symbolen in mehreren Sprachen (gemeinsam mit Facility).
- P-29: Rechnung mit mehreren MWST-Sätzen und durchlaufenden Abgaben ohne MWST.
- P-06, P-09: Gerätemodus «Rezeption» und «Office» mit PIN.

## 16. Stand

Steckbrief vom 24.11.2026, vom Kopf aus der Recherche verdichtet (die Prüfung der Rechtsangaben an der Quelle steht noch aus); noch nichts gebaut.

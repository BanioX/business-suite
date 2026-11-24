# Onestrand Business Suite: Architektur aus der Linse «Produkt und Kundschaft»

Stand 24.11.2026 · Entwurf für Alban und den Kopf im Repo `business-suite` · Linse: **Was macht den Betrieb eines digitalisierungsträgen Kleinunternehmens wirklich stemmbar?**

**Öffentlich lesbar.** `business-suite` ist öffentlich, `Randen` ebenso. Diese Fassung enthält darum keine Preise, kein Geschäftsmodell, keine Namen anderer Produkte und keine echten Firmen- oder Personennamen. Was Geld verdienen soll, gehört nach `rettich-intern` (Randen CLAUDE.md, Arbeitsweise 5). Rechtliche Angaben stehen hier nur als Hinweis, wo sie hingehören; jede Zahl kommt vor dem Bau mit Quelle in die Fakten (Randen ADR-0012, Regel L-17).

Inhalt: [0 Kurzfassung](#0-kurzfassung) · [1 Für wen](#1-für-wen-wir-bauen) · [2 Rückgrat](#2-das-rückgrat-was-jede-branche-vom-ersten-tag-hat) · [3 Produktmodell](#3-produktmodell) · [4 Repo](#4-repo-topologie) · [5 Code teilen](#5-wie-plattform-code-in-die-branchen-kommt) · [6 Andocken](#6-wie-eine-branche-andockt) · [7 Datenmodell](#7-gemeinsames-datenmodell) · [8 Geräte und Abgleich](#8-geräte-und-abgleich-büro--baustelle) · [9 Papier](#9-papier-brücke) · [10 Sprachen](#10-sprachen) · [11 Einrichten](#11-einrichten-in-wenigen-minuten) · [12 Governance](#12-governance-für-parallele-agenten) · [13 Randen](#13-der-weg-für-randen) · [14 Wellen](#14-wellen) · [15 Risiken](#15-risiken) · [16 Entscheide](#16-entscheide-für-alban) · [17 Annahmen](#17-annahmen-und-bewusst-ausgelassenes) · [18 Belege](#18-belege-im-code)

---

## 0. Kurzfassung

1. **Eine Plattform, wenige Ausgaben, jede Ausgabe kann jede Branche.** Der Code ist eine Plattform mit Branchen als Bausteinen. Ausgeliefert wird er als wenige «Ausgaben» (die Tür, durch die ein Betrieb hereinkommt): heute «Gastro» (Randen), als Nächstes eine Ausgabe für Betriebe, die bei der Kundschaft arbeiten (Arbeitstitel «Vor Ort»: Reinigung, Hauswartung, Garten, Maler, Dachdecker, Umzug, Haustechnik). Jede Ausgabe hat Namen, Symbol, Farbe und Adresse, kann aber jede Branche einschalten.
2. **Ein Betrieb lebt in genau einer Ausgabe.** Daten hängen an der Herkunft (Origin) einer Adresse (Randen ADR-0020). Ein Hauswart mit Garten und Reinigung, ein Umzugsbetrieb mit Umzugsreinigung, ein Hotel mit Restaurant: Sie schalten ihre Branchen in **einer** Ausgabe ein und haben eine Kundschaft, ein Team, eine Zeit, eine Rechnung. Getrennte Apps je Branche würden genau diese Betriebe zerreissen.
3. **Adressen nach Zweck, nicht nach Produktname.** `gastro.onestrand.ch`, `vor-ort.onestrand.ch` (Arbeitstitel). Namen dürfen sich ändern, Adressen nie. Alban hat angekündigt, den Namen Randen anzupassen (W17); eine Adresse `randen.…` würde das teuer machen. Die Domain gibt es schon (`onestrand.ch`), Unteradressen kosten nichts zusätzlich, und ein späterer Passkey für `onestrand.ch` gilt auf allen.
4. **Das Rückgrat jeder Branche** vom ersten Tag: Betrieb und Register, Personen mit Rollen und Rechten, Kundschaft, Objekte, Leistungen, Aufträge, Einsätze, Rapporte mit Unterschrift, Offerten und Rechnungen mit QR-Zahlteil, Zahlungseingang aus der Bankdatei, Aufgaben und Checklisten mit Nachweis, Zeit-Ledger mit Stempeln, Belege und Kasse, Dokumente als PDF, Erinnerungen, Sichern und Löschen, Kopplung. Die Hälfte davon hat Randen schon gebaut oder in ADRs entschieden; die andere Hälfte (Kundschaft bis Rechnung) ist neu und gehört von Anfang an der Plattform.
5. **Repo:** `business-suite` wird das Monorepo mit `platform/`, `verticals/<branche>/` und `editions/<ausgabe>/`. Neue Branchen leben dort von Tag 1 (Workspace). Randen bleibt bis nach seinem Pilot-Kit in seinem Repo und bekommt Plattform-Stücke als erzeugte Kopie mit Stempel; danach zieht sein Code um, seine Adresse und seine Daten nicht.
6. **Andocken** heisst: Eine Branche liefert eine Definition (Schnittstelle, Tabellen, Register-Einträge, Fragen beim Einrichten, Vorlagen, Lexikon, Texte je Sprache, Seiten, Kacheln je Rolle, Demo) und besteht die Konformitätsprüfung. Die Plattform kennt keine Branche, keine Branche kennt eine andere.
7. **Abgleich Büro ↔ Baustelle ohne Server ist ein Rhythmus**, keine Echtzeit: Allein braucht es keinen; im WLAN von Werkhof, Büro oder Zuhause koppeln sich die Geräte von selbst (W13, W15); unterwegs gehen verschlüsselte «Päckli» über das Teilen-Menü; Papier und Fotos von Papier bleiben ein vollwertiger Weg. Echtzeit über Netze bleibt Stufe 2 nach Albans JA.
8. **Sprache je Person:** Das Büro spricht de-CH, der Arbeitsplatz der Mitarbeitenden (Heute, Stempeln, Einsatz, Checkliste, Meine Stunden, Datenblatt) kommt zuerst in die Sprachen der Pilot-Teams. Vorlagen haben Kennungen und reisen übersetzt; Freitext bleibt, wie er getippt wurde. Keine Übersetzung durch fremde Dienste.
9. **Papier ist eine Schnittstelle:** Offerte, Auftragsbestätigung, Einsatzblatt, Rapport zum Unterschreiben, Rechnung mit QR-Zahlteil, Mahnung, Etiketten mit QR für Objekte, Monatspaket. Dokumente an Dritte sprechen die Empfänger:innen mit «Sie» an; die App spricht weiter mit «du».
10. **Erste neue Branche:** Reinigung und Hauswartung. Sie prüfen das Rückgrat am härtesten (Objekte, wiederkehrende Arbeit, Putzplan, Teams im Feld, Monatsrechnungen) bei kleinem rechtlichem Risiko und vielen Ein-Personen-Betrieben.

---

## 1. Für wen wir bauen

### 1.1 Acht typische Betriebe (erfunden, aus dem Alltag der Branchen)

| Betrieb | Leute | Geräte | So sieht der Tag aus | Was heute weh tut |
| --- | --- | --- | --- | --- |
| Hauswartung, allein | 1 | iPhone, abends ein Laptop | Runde durch 20 bis 30 Liegenschaften von zwei, drei Verwaltungen: Treppenhaus, Umgebung, Heizung ablesen, Mängel aufnehmen, Wohnungsabnahmen | Rapport an die Verwaltung, Stunden je Objekt, Monatsrechnung je Verwaltung, Schlüssel und Codes, Fotos von Mängeln wiederfinden |
| Reinigung | Chefin und 6 bis 8 Teilzeit, viele mit anderer Muttersprache | Handy der Chefin, iPad im Büro, private Handys der Mitarbeitenden | Unterhaltsreinigung am Abend in Büros, tagsüber Umzugsreinigungen mit Abgabe | Wer ist wann wo, Stunden für den Lohn, Checklisten je Objekt, Abgabeprotokoll, Material |
| Malerbetrieb | Chef, 3 Leute, Partnerin halbtags im Büro | iPhone des Chefs, PC im Büro | Besichtigung, Ausmass, Offerte; auf der Baustelle Regiearbeiten und Zusatzwünsche | Offerte aus dem Ausmass, Regierapporte auf Papier, Rechnungen kommen spät, Material vergessen zu verrechnen |
| Dachdecker und Spengler | 8, ein Vorarbeiter | Handys, Werkhof mit PC | Morgens im Werkhof laden, Baustelle, Abends zurück | Rapporte, Fotos von Schäden vorher und nachher, Sicherheit auf dem Dach, Nachkalkulation |
| Umzug | 3 fest, Aushilfen tageweise | Handys, Laptop | Besichtigung, Volumen in m³, Offerte; Umzugstag mit zwei Adressen, oft mit Reinigung und Entsorgung | Offerte schnell genug, Stunden der Aushilfen, Schäden dokumentieren, Bewilligung für Halteverbot |
| Hotel mit Restaurant | 15 | PC an der Rezeption, iPad in der Küche, Handys im Housekeeping | Abreisen und Bleiben, Zimmer reinigen und freigeben, Küche für Frühstück und Abend | Zimmerstatus zwischen Etage und Rezeption, Stunden, Küche (Randen) |
| Coiffeur | 2 | iPad am Empfang | Termine, Behandlung, Kasse | Termine, Kundenkartei, Tagesabschluss |
| Imbiss (Randen) | 2 bis 5 | iPad an der Theke | Bons, Kasse, Hygiene | siehe Randen-Masterplan W7 bis W10 |

Annahme aus der Branchenkenntnis, im Pilot zu prüfen: Die meisten dieser Betriebe haben weniger als zehn Personen, die Chefin oder der Chef arbeitet selbst mit, und das Büro ist ein Handy, ein Laptop am Küchentisch oder eine Person halbtags. Die amtliche Zahl zum Anteil der Kleinstbetriebe kommt mit Quelle und Datum in die Fakten, bevor sie irgendwo steht.

### 1.2 Was «stemmbar» heisst: neun Prüfsteine

Jede Welle wird an diesen Sätzen gemessen, im Pilot neben der Person, nie über das Netz (keine Analytics, ADR-0006).

1. **Installiert und eingerichtet in fünf Minuten,** ohne Konto, ohne Schulung, mit einem Beispiel zum Anschauen vorher.
2. **Jede tägliche Handlung unter zehn Sekunden** (Randen-Masterplan, Leitsatz 1.2.1): Einsatz beginnen, Foto mit Satz, Aufgabe abhaken, Stunden stempeln.
3. **Am Monatsende nichts zusammensuchen:** Rapporte werden Rechnungen, Belege werden das Monatspaket, Stunden werden der Lohn-Export.
4. **Das Geld kommt herein:** offene Rechnungen sichtbar, Mahnung mit einem Tipp, Zahlungseingang aus der Bankdatei statt von Hand abhaken.
5. **Es geht im Keller, im Estrich und auf dem Dach:** offline, mit Handschuhen (grosse Ziele), im Sonnenlicht (Kontrast), mit einer Hand.
6. **Mitarbeitende verstehen ihren Bildschirm,** in ihrer Sprache, und sehen nur ihre Arbeit, nie Löhne, Margen oder Kasse (W14, W16).
7. **Papier bleibt möglich:** Jede Sache hat ihr Papier, und Papier kommt als Foto zurück.
8. **Nichts geht verloren, wenn ein Handy vom Gerüst fällt:** Abgleich am Abend, Sicherung mit Erinnerung, Päckli unterwegs.
9. **Pflichten erfüllen sich nebenbei:** Arbeitszeit, Aufbewahrung von Belegen, Selbstkontrolle in der Gastronomie, Datenblatt für Mitarbeitende. Pflichten hängen nie an einem Schalter für ein Abo (Randen E-02, Masterplan 7.6).

### 1.3 Was daraus für die Architektur folgt

- **Ein Betrieb, eine Datenhaltung,** auch mit mehreren Branchen. Das entscheidet das Produktmodell (Abschnitt 3).
- **Das Handy ist das Büro des Kleinsten.** Offerte und Rechnung müssen am iPhone gehen, nicht nur am PC.
- **Abgleich ist Rhythmus.** Handwerk und Unterhalt treffen sich am Morgen und am Abend im Werkhof, im Büro oder zu Hause. Das trägt Stufe 1 (Abschnitt 8).
- **Papier ist eine Schnittstelle,** keine Notlösung (Abschnitt 9).
- **Sprache gehört der Person,** nicht dem Betrieb (Abschnitt 10).
- **Wörter gehören der Branche:** Baustelle, Objekt, Garten, Zimmer sind dieselbe Sache der Plattform und heissen je Branche anders (Abschnitt 6.4).

---

## 2. Das Rückgrat: was jede Branche vom ersten Tag hat

Leitfrage: Was muss eine Malerin, ein Hauswart und eine Hotelière am ersten Tag haben, damit sie nicht zurück zum Papier gehen? Die Spalte «Stand» sagt, ob Randen es gebaut, nur entschieden oder noch gar nicht hat.

| Stück | Was es tut | Kennung (Vorschlag) | Stand bei Randen | Warum am ersten Tag |
| --- | --- | --- | --- | --- |
| Geld, Datum, Kennungen, Formate | Rappen als Ganzzahl, Kalendertag Zürich, UUIDv7, Zahlen lesen und zeigen | `platform/core` | gebaut: `ids.ts`, `money.ts`, `currency.ts`, `dates.ts`, `format.ts` (Randen `docs/rettich.md`, «Gemeinsamer Kern») | Grundlage jeder Zahl |
| Befehle, Abfragen, Ereignisse | Contract-first mit `commandId`, Transaktion, Domain Event | `platform/core/contract` | gebaut: `packages/core/src/application/command.ts:97`, `contract/operation.ts:40`, `contract/events.ts:10` | Abgleich in Stufe 1 und 2 baut auf Befehlen mit `commandId` (ADR-0028, Punkt 4) |
| Betrieb, Register, Einrichten | Branchen, Module, Funktionen, Optionen, Umfang, Fragen | `business` | entschieden: ADR-0022 (Register `FEATURE_CATALOG`), AP-1 offen | Jede Branche wählt ihre Komplexität |
| Personen, Rollen, Rechte | Profile aus Rechten, Vorlagen, Stufen, PIN | `people` | entschieden: W14, W16, ADR-0022 Punkt 10, ADR-0030; AP-2 offen | Wer im Feld arbeitet, sieht nur seine Arbeit |
| Kundschaft | Privat, Firma, Verwaltung; Kontakte, Adressen, Sprache für Dokumente | `customers` | neu | Ohne Kundschaft keine Offerte und keine Rechnung |
| Objekte und Standorte | Liegenschaft, Wohnung, Garten, Dach, Zimmer; Zugang, Fotos, Hinweise | `sites` | neu | Arbeit geschieht an einem Ort |
| Leistungen und Material | Katalog mit Einheit (h, m², m, m³, Stk, pauschal, km) und Ansatz des Betriebs | `catalog` | neu (Randen hat Artikel für Lebensmittel) | Offerte und Rechnung brauchen Positionen |
| Aufträge | Anfrage bis verrechnet, Regie, Pauschal oder nach Ausmass | `jobs` | neu (Randen `dispatch` ist ein Platzhalter) | Klammer um alles, was für eine Kundschaft geschieht |
| Leistungspläne | Wiederkehrende Arbeit: Putzplan, Hauswartung, Gartenpflege | `plans` | Muster gebaut: `HygieneTask` und `HygieneCheck` (`packages/core/src/model/haccp.ts:58`, `:71`) | Unterhalt ist wiederkehrend |
| Einsätze | Wer, wann, wo; Beginn und Ende, Aufgaben, Fotos, Material, Notizen | `visits` | neu | Der Tag im Feld |
| Rapporte | Gesperrter Stand eines Einsatzes oder Tages mit Unterschrift der Kundschaft | `reports` | neu | Nachweis und Grundlage der Rechnung |
| Aufgaben und Checklisten | Vorlage, Wiederholung, Nachweis (abgehakt, Foto, Messwert mit Grenzen) | `tasks` | Muster gebaut (Reinigungsplan und Messungen der Selbstkontrolle) | Putzplan, Abgabe, Sicherheit, HACCP sind dieselbe Form |
| Zeit | Zeit-Ledger, Stempeln, Monatsblatt, Lohn-Export | `time` | entschieden: ADR-0023; AP-3 bis AP-6 offen | Arbeitszeit erfassen ist für Arbeitgebende Pflicht (Quelle vor dem Bau in die Fakten) |
| Offerten und Rechnungen | Nummernkreise, MWST je Satz, QR-Zahlteil, Gutschrift, Mahnung | `invoicing` | neu | Geld hereinholen ist die grösste Sorge kleiner Dienstleister |
| Zahlungseingang | von Hand, bar, oder aus einer Bankdatei mit Referenz | `invoicing` | neu; Datei-Import ist keine Anbindung (Randen ADR-0029, Punkt 9; E-18) | «Wer hat bezahlt?» ohne Abtippen |
| Belege und Kasse | Belege mit Bild, Kassenbuch, Tagesabschluss, Monatspaket | `books` | entschieden: ADR-0029; AP-16 offen | Vorsystem für die Treuhand, für jede Branche gleich |
| Kalender | Betriebskalender, Feiertage je Kanton, Abwesenheiten | `calendar` | entschieden: ADR-0031, AP-5 und AP-17 offen | Planung und Saldi |
| Dokumente | PDF auf dem Gerät, Dokument-Ansicht, Briefkopf mit Logo, Teilen, Drucken | `documents` | gebaut: ADR-0019 (`apps/web/src/ui/pdf/`, `ui/share-file.ts`); Dokument-Ansicht ADR-0026, AP-15 offen | Papier-Brücke |
| Heute | Was steht an: Einsätze, fällige Aufgaben, offene Rechnungen, Erinnerungen | `today` | gebaut als Cockpit für die Küche | Ein Blick am Morgen |
| Erinnerungen | ohne Server: Liste, Kalenderdatei, Zahl am Symbol | `reminders` | entschieden: ADR-0024 | Nichts vergessen ohne Push |
| Daten | Sichern, Zurückholen, Export, Löschen, Import (vCard, CSV) | `data` | gebaut: ADR-0017 (`packages/core/src/modules/settings/`) | Recht der Person, einzige Kopie in Stufe 1 |
| Kopplung | Geräte des Betriebs koppeln, Vermittler für den Handschlag, Päckli | `pairing` | entschieden: ADR-0028, W14, W15; AP-19 offen | Büro ↔ Feld ohne Server |
| UI-Kit, Shell, Texte | Bausteine, Rahmen für iPhone, iPad, Web, Texte je Sprache | `platform/web` | gebaut: `apps/web/src/ui/`, `app/AppShell.tsx`, `ADR-0013` | Gleiche Ruhe in jeder Branche |

**Nie an einem Schalter für ein Abo** (erweitert Randen E-02 auf die Suite): Arbeitszeit, Aufbewahrung und Lesbarkeit von Rapporten, Rechnungen und Belegen, Sichern, Zurückholen, Exportieren, Löschen, das Datenblatt für Mitarbeitende und jede Selbstkontrolle einer Branche. Im Register heissen sie `core: true` und haben nur `available`.

**Was nicht ins Rückgrat gehört:** Lager mit Ablaufdaten, Rezepte, Allergene, Speisekarte, Küchenmonitor. Sie bleiben Branche Gastro. Ein schlankes «Material und Lager» für Handwerk (Farben, Schrauben, Reinigungsmittel) kommt später als Plattform-Modul nach dem Muster von `createStockLedger` (ADR-0007), ohne Lebensmittel-Felder.

---

## 3. Produktmodell

### 3.1 Drei Wege

| Kriterium | (a) Eine App «Onestrand» für alle | (b) Eine eigene App je Branche, getrennt gebaut | (c) Eine Plattform, wenige Ausgaben, jede kann jede Branche |
| --- | --- | --- | --- |
| Gemischte Betriebe (Hauswart mit Garten und Reinigung, Umzug mit Reinigung, Hotel mit Restaurant) | gut: eine Datenhaltung | schlecht: Kundschaft, Team, Zeit und Rechnung in zwei Apps mit getrenntem Speicher (ADR-0020, Punkt 3) | gut: eine Ausgabe, mehrere Branchen eingeschaltet |
| Wiedererkennen («die App für meinen Beruf») | schwach: ein Name für alles | stark | mittel bis stark: Ausgabe nach Arbeitsweise, Wörter und Einrichten nach Branche, Branchen-Seiten auf `onestrand.ch` |
| Home-Bildschirm | ein Symbol für alle | ein Symbol je Branche | ein Symbol je Ausgabe |
| Pflege | eine Ausgabe | eine Codebasis je Branche oder eine Plattform mit vielen Ausgaben | eine Plattform, wenige Ausgaben |
| Feste Entscheide vor dem Pilot (Adresse, Name, Symbol; L-11) | einer | je Branche einer | je Ausgabe einer |
| Randen | müsste in «Onestrand» aufgehen | bleibt, aber teilt nichts | bleibt Ausgabe «Gastro» mit eigener Adresse |
| Stufe 2 (Konto, Abgleich) | einfach | je App getrennt | ein Konto für alle Unteradressen von `onestrand.ch` |

**(a)** ist technisch am einfachsten, verschenkt aber den Wiedererkennungswert, den Alban mit «Randen bleibt für Branche Gastro» will, und lässt einen Imbiss dieselbe Tür nehmen wie einen Dachdecker. **(b)** ist das Gegenteil des Ziels: Gerade die kleinen Betriebe haben selten genau eine Tätigkeit. **(c)** verbindet beides.

### 3.2 Empfehlung: (c) Eine Plattform, wenige Ausgaben

- **Ausgabe** heisst: derselbe Code mit eigener Konfiguration (Name, Kurzname, Symbol, Leitfarbe, Adresse, Name der Datenbank, Format der Sicherung, Haupt-Branchen, erster Vorschlag beim Einrichten). Gebaut aus demselben Quelltext, je Ausgabe ein Build und ein Cloudflare-Projekt.
- **Jede Ausgabe kann jede Branche einschalten.** Die Branchen einer Ausgabe liegen im Vorab-Cache; jede andere wird beim Einschalten einmal aus dem Netz geladen und danach offline gehalten. Einschalten geschieht selten, beim Einrichten oder später unter «Betrieb › Funktionen».
- **Ein Betrieb lebt in genau einer Ausgabe.** Das Einrichten fragt: «Hast du für diesen Betrieb schon eine App von Onestrand? Dann schalte die Branche dort ein.» Die App kann andere Herkünfte nicht sehen; der Satz genügt, und die Startseite der Firma sagt dasselbe.
- **Mitarbeitende installieren dieselbe Ausgabe wie der Betrieb.** Die Einladung nennt ihre Adresse.

### 3.3 Welche Ausgaben

| Ausgabe | Arbeitsweise | Branchen im Vorab-Cache | Wann |
| --- | --- | --- | --- |
| «Gastro» (heute Randen) | ortsfest, Ware mit Ablauf, Gäste | Gastro | besteht; Adresse vor dem ersten Pilot festlegen |
| «Vor Ort» (Arbeitstitel) | bei der Kundschaft, Aufträge und Einsätze, Teams im Feld | Reinigung, Hauswartung, Garten, Maler und Gipser, Dachdecker und Spengler, Haustechnik, Umzug | ab Welle 2 |
| später prüfen: «Haus» (Arbeitstitel) | Zimmer, Gäste über Nacht, Housekeeping | Beherbergung | nach dem ersten Pilot von «Vor Ort»; bis dahin schaltet ein Hotel mit Restaurant «Beherbergung» in «Gastro» ein |
| später prüfen: «Termine» (Arbeitstitel) | Termine am eigenen Ort, Kasse, Kundenkartei | Coiffeur, Kosmetik | später; braucht eine Kundenkartei mit Einwilligung (vergleiche Randen E-05) |

Warum nicht eine Ausgabe je Branche: Jede Ausgabe ist eine Herkunft, deren Adresse, Name und Symbol vor dem ersten Pilot feststehen müssen (ADR-0020, Punkt 5; Rettich L-11), und jede trennt Daten. Zehn Ausgaben hiessen zehn solche Entscheide und mehr getrennte Daten bei gemischten Betrieben. Die Sprache der Branche leisten Einrichten, Wörter und Vorlagen innerhalb der Ausgabe (Abschnitt 6.4), das Wiedererkennen leisten die Branchen-Seiten auf `onestrand.ch`.

### 3.4 Gemischte Betriebe

| Fall | So geht es |
| --- | --- |
| Hauswartung mit Gartenpflege und Reinigung | Ausgabe «Vor Ort», Branchen `caretaking` (Haupt), `garden`, `cleaning`. Ein Objekt hat Leistungspläne aus allen drei; eine Monatsrechnung je Verwaltung fasst sie zusammen. Allgemeine Wörter («Objekt») kommen von der Haupt-Branche |
| Umzug mit Umzugsreinigung und Entsorgung | «Vor Ort», `moving` (Haupt), `cleaning`. Ein Auftrag mit zwei Adressen (Auszug, Einzug) und der Reinigung am alten Ort; eine Offerte, eine Rechnung |
| Maler mit Gipserarbeiten | eine Branche `painting` («Maler und Gipser»), weil Arbeit und Wörter nahe sind |
| Hotel mit Restaurant | «Gastro» mit `lodging` eingeschaltet, oder später «Haus» mit `gastro`. Ein Team, eine Zeit, ein Monatspaket; Rollen trennen Küche und Etage |
| Eine Person mit zwei Firmen (Maler und ein Imbiss) | zwei Betriebe. W16, Punkt 4: Wechsel zwischen Betrieben auf dem Gerät, je Betrieb getrennte Daten. Wenn beide in verschiedenen Ausgaben leben, sind es zwei Apps auf dem Home-Bildschirm. Die Plattform muss mehrere Betriebe in einer Herkunft tragen; heute hält ein Gerät einen Betrieb (`packages/core/src/ports/storage.ts:104-112`, ADR-0003 Punkt 4) |

**Regel für Wörter bei mehreren Branchen:** Seiten der Plattform (Kundschaft, Rechnungen, Heute) nehmen die Wörter der Haupt-Branche. Seiten einer Branche nehmen ihre eigenen.

### 3.5 Marken, Namen und Herkunft

1. **Adressen nach Zweck.** `gastro.onestrand.ch` und `vor-ort.onestrand.ch` (Arbeitstitel), die Startseite auf `onestrand.ch`, später `konto.onestrand.ch`. So kann Alban Randen umbenennen, ohne dass eine Küche umziehen muss. Ein Name auf dem Home-Bildschirm bleibt nach der Installation, wie er war (Rettich L-11); ein neuer Name heisst für bestehende Geräte: alter Name bis zur Neuinstallation, und eine Neuinstallation geht nur mit Sicherung und Zurückholen. Darum steht **der Name einer Ausgabe vor ihrem ersten Pilot fest**, genau wie die Adresse.
2. **Die Domain gibt es.** `onestrand.ch` gehört Alban (`/home/user/onestrand/site/CNAME`). Unteradressen kosten nichts zusätzlich. Ob die Zone bei Cloudflare liegt (nötig für eine eigene Adresse eines Workers), ist vor dem Entscheid zu prüfen. Damit ist Randen E-19 («Domain vor dem Pilot kostet Geld») ohne neue Kosten lösbar.
3. **Unteradressen einer Domain** halten die Herkünfte getrennt und lassen einen späteren Passkey für `onestrand.ch` auf allen gelten (ADR-0020, Punkt 3).
4. **Die Firma ist Absender** (ADR-0020, Punkt 2): «… · von Onestrand» unter «Über», auf der Startseite und in rechtlichen Texten. Ob die Ausgaben selbst «Onestrand Gastro» heissen oder einen eigenen Namen tragen, ist Entscheid 3 in Abschnitt 16.
5. **Erst installieren, dann einrichten.** Auf iOS haben Safari und die installierte App getrennten Speicher; Safari löscht den Speicher einer Website nach sieben Tagen ohne Besuch, installierte Web-Apps nicht (ADR-0020, Abschnitt 3 von `suite.md`). Wer in Safari einrichtet und dann installiert, sieht eine leere App. Jede Ausgabe erkennt auf iPhone und iPad, dass sie nicht installiert läuft (Erkennung wie `isInstalledIos` in `apps/web/src/ui/share-file.ts:58`), und zeigt dann zuerst «So installierst du», bevor sie Daten annimmt. Heute fehlt diese Sperre in Randen.
6. **Einladung in zwei QR-Codes.** Ein QR-Code, den das Handy mit der Kamera-App liest, öffnet Safari, nicht die installierte App. Darum zeigt die Chefin zuerst «App installieren» (Adresse der Ausgabe) und, wenn die App auf dem Handy läuft, «Einladung» (Person, Rollenprofil, Unterschrift des Betriebs nach W14), die die App mit «Einladung lesen» selbst liest. Dasselbe gilt für QR-Etiketten an Objekten (Abschnitt 8.3): Gelesen wird in der App; öffnet jemand das Etikett mit der Kamera, zeigt eine ruhige Seite «Öffne die App und lies den Code dort».
7. **Kein Weg direkt von einer Ausgabe in eine andere** (ADR-0020, Punkt 6). Die Startseite der Firma führt zu den Ausgaben.
8. **Stores** bleiben Albans Entscheid (ADR-0020, Frage 5). Die Plattform ändert daran nichts.

---

## 4. Repo-Topologie

### 4.1 Drei Wege

| Weg | Wie | Dafür | Dagegen |
| --- | --- | --- | --- |
| (a) Monorepo jetzt, mit Randen | `business-suite` nimmt Randen sofort auf | eine Quelle, eine Prüfung | stört Randens laufenden Ausbau (AP-0 bis AP-19) und den Weg zum ersten Gastro-Pilot; Randens Regel «Main muss immer mitziehen» und sein Branch laufen in einer anderen Sitzung |
| (b) Monorepo für Plattform und neue Branchen, Randen später | `business-suite` mit `platform/`, `verticals/`, `editions/`; Randen bekommt Plattform-Stücke als Kopie mit Stempel und zieht nach seinem Pilot-Kit um | neue Branchen starten ohne Umweg; Randen bleibt ruhig; ein Umzug des Codes verschiebt weder Adresse noch Daten | eine Zeit lang zwei Repos; Kopie braucht Disziplin (Stempel, Abschnitt 5.3) |
| (c) Ein Repo je Branche, Plattform als Paket | Plattform veröffentlicht, Branchen beziehen Versionen | starke Trennung | jede Änderung über drei Repos; Veröffentlichen kostet Arbeit oder eine Anmeldung; gemischte Betriebe brauchen ohnehin alle Branchen in jeder Ausgabe |

**Empfehlung: (b).** Gemischte Betriebe verlangen, dass jede Ausgabe jede Branche enthält. Das spricht für ein Monorepo, in dem eine Änderung an der Plattform im selben PR alle Branchen grün halten muss. Randen kommt hinein, sobald es ohne Störung des Pilots geht (Abschnitt 13).

### 4.2 Ordnerplan

Code-Namen auf Englisch (CLAUDE.md), Erklärungen auf Deutsch.

```
business-suite/
  CLAUDE.md                  Regeln der Suite (aus Randen übernommen, Abschnitt 12)
  AGENTS.md                  Karte für jedes KI-Werkzeug
  docs/
    plan.md                  Stand der Wellen
    adr/                     Entscheide der Suite (S-0001 …)
    plattform-karte.md       jedes Stück: Quelle (Suite oder Randen), Stand, Besitzer
    namen.md                 vergebene Kennungen: Branchen, Module, Präfixe, Ereignisse
    fakten/                  Quellen je Thema (Rechnung, Arbeit, MWST, je Branche)
    verticals/<id>/steckbrief.md  Alltag, Wörter, Rollen, Pflichten, erste Kunden, Tabu
    glossar.md, regeln.md, design.md, lernbuch.md, schulden.md, nebenwirkungen.md
  platform/
    core/                    @onestrand/platform-core: rein TypeScript, nur zod
      src/kernel/            ids, money, currency, dates, format (Herkunft Randen/Rettich)
      src/contract/          Operation, Ereignis, Komposition der Schnittstelle
      src/application/       Command-Kit, Ledger-Kits (Zeit, Einsatz, Dokument, Kasse)
      src/register/          Register, Branchen, Umfang, Rechte (ADR-0022 verallgemeinert)
      src/modules/<id>/      business, people, customers, sites, catalog, jobs, plans,
                             visits, reports, tasks, time, invoicing, books, calendar,
                             documents, reminders, data, pairing, today
      src/ports/             Speicher, Uhr, IDs, Prüfsumme, Kanal (PeerLink)
      test/                  Tests auf dem Speicher im Arbeitsspeicher
    data/                    @onestrand/platform-data: IndexedDB, Schema-Ledger je Datenbank
    web/                     @onestrand/platform-web: UI-Kit, Shell, Hooks, PDF-Kit,
                             Teilen, Drucken, Texte und Sprachen, Seiten der Plattform
  verticals/
    cleaning/   core/ web/   Reinigung
    caretaking/ core/ web/   Hauswartung
    garden/     core/ web/   Garten
    painting/   core/ web/   Maler und Gipser
    roofing/    core/ web/   Dachdecker und Spengler
    building_services/ …     Haustechnik
    moving/     core/ web/   Umzug
    lodging/    core/ web/   Beherbergung
    salon/      core/ web/   Coiffeur und Kosmetik
    gastro/                  (später: Randens Küche, nach dem Umzug)
  suite/                     @onestrand/suite: setzt Plattform und alle Branchen zusammen
  editions/
    field/                   Ausgabe «Vor Ort»: edition.config.ts, public/, wrangler.jsonc
    gastro/                  (später: Ausgabe von Randen, Projekt `randen` bleibt)
  tools/
    vendor-randen/           erzeugt die Kopie für Randen mit Stempel
    checks/                  Grenzen, Konformität, Namen, Schema, Texte
```

### 4.3 Grenzen, die Werkzeuge prüfen

- `platform/**` importiert nie aus `verticals/**`, `suite/` oder `editions/**` (ESLint `no-restricted-imports`, wie heute für `features/` gegen `data/` in `eslint.config.js`).
- `verticals/a/**` importiert nie aus `verticals/b/**`. Was zwei Branchen brauchen, gehört in die Plattform.
- `platform/core` und `verticals/*/core` bleiben ohne Browser (wie `packages/core`, `eslint.config.js`, Abschnitt «packages/core must stay free of browser and Node APIs»).
- Nur `editions/**` kennen Adresse, Name und Farbe.
- Ein PR einer Branche ändert nur `verticals/<id>/**`, `docs/verticals/<id>/**` und genau eine Zeile in `suite/` (Abschnitt 12).

---

## 5. Wie Plattform-Code in die Branchen kommt

### 5.1 Vier Wege, alle kostenlos

| Weg | Wie | Dafür | Dagegen | Für |
| --- | --- | --- | --- | --- |
| Workspace | `workspace:*` im selben Monorepo (wie `@randen/core` heute in `apps/web/package.json`) | eine Quelle, eine Prüfung, Änderungen atomar | nur innerhalb eines Repos | alle Branchen in `business-suite` |
| Erzeugte Kopie mit Stempel | Skript kopiert `platform/*` nach `Randen/vendor/onestrand/`, dazu `STAMP.json` mit Quelle, Commit und Prüfsumme je Datei; ein Test in Randen bricht, wenn eine Datei vom Stempel abweicht | kein Netz beim Bauen, keine Anmeldung, nachvollziehbar, passt zur heutigen Praxis (`docs/rettich.md`) und zu den erzeugten Dateien von SWELPER | zwei Kopien, Aktualisieren ist ein eigener Schritt | Randen bis zum Umzug |
| Git-Abhängigkeit | pnpm installiert ein Unterverzeichnis eines Git-Repos zu einem Commit (laut Doku von pnpm möglich, nicht geprüft) | keine Kopie im Repo | Build braucht GitHub; `minimumReleaseAge` greift nicht; Fehler schwerer zu finden | nicht empfohlen |
| Paket-Register | npm öffentlich oder GitHub Packages | Versionen klar | GitHub Packages verlangt auch für öffentliche Pakete eine Anmeldung; npm öffentlich veröffentlicht proprietären Code für alle; Arbeit für jede Version | nicht jetzt |

### 5.2 Empfehlung

- **Im Monorepo: Workspace.** Jede Branche, `suite/` und jede Ausgabe beziehen `@onestrand/platform-*` mit `workspace:*`.
- **Für Randen bis zum Umzug: erzeugte Kopie mit Stempel,** nur für Stücke, die Randen wirklich braucht. Randen liest die Kopie wie einen eigenen Ordner; seine Tests laufen wie heute.
- **Kein Paket-Register,** bis es ein Repo ausserhalb der Suite gibt, das die Plattform braucht.

### 5.3 Stempel

```
Randen/vendor/onestrand/
  STAMP.json      { "source": "BanioX/business-suite", "commit": "<sha>",
                    "paths": ["platform/core/src/kernel", …],
                    "files": { "<pfad>": "<sha256>" }, "generated": "tools/vendor-randen" }
  platform-core/  … die kopierten Dateien, jede mit Kopfzeile «generated from business-suite@<sha>»
```

- `pnpm vendor:check` in Randens `pnpm check`: jede Datei passt zum Stempel, keine fehlt, keine ist dazugekommen.
- `pnpm vendor:pull <sha>` holt einen neuen Stand; der PR heisst `chore(vendor): platform <sha>`.
- Von Hand ändert niemand die Kopie. Braucht Randen etwas anderes, entsteht es in der Suite.

### 5.4 Versionen

| Was | Regel |
| --- | --- |
| Plattform | Eine Version `PLATFORM_VERSION` (semver) für `platform/*`; Bruch nur mit Hochzählen der Hauptnummer und im selben PR alle Branchen nachgezogen |
| Schnittstelle | Operationen werden nur angefügt, nie umbenannt (ADR-0005); eine geänderte Bedeutung ist eine neue Operation |
| Ereignisse | `type` nur angefügt; Präfix je Modul oder Branche aus `docs/namen.md` |
| Schema | Je Datenbankname ein Schema-Ledger (Abschnitt 6.2), nur angefügt, veröffentlichte Schritte eingefroren |
| Register | Kennungen nur angefügt (ADR-0022, Punkt 3) |
| Sicherung | Format je Ausgabe (`randen-backup` bleibt für Gastro, `packages/core/src/modules/settings/contract.ts:15`); jede Ausgabe liest jede ältere Fassung ihres Formats; neue Tabellen gelten in alten Dateien als leer (Randen E-10) |
| Kopplung | Versionsnummer des Protokolls im `hello` (ADR-0028, Punkt 4); ungleiche Versionen übertragen nichts |

### 5.5 Eine Quelle je Stück, Ernte aus Randen

Randen baut in seinem Ausbau Stücke, die zur Plattform gehören: Register (AP-1), Rollen (AP-2), Stempeln (AP-3), Dokument-Ansicht (AP-15), Kasse und Belege (AP-16), Kopplung (AP-19). Zwei Fassungen desselben Stücks wären die teuerste Schuld der Suite.

- **`docs/plattform-karte.md`** nennt je Stück die eine Quelle: «Suite» oder «Randen, Ernte geplant».
- **Baut Randen ein Stück zuerst,** legt es Randen in einen eigenen Ordner (Vorschlag `packages/core/src/platform/` und `apps/web/src/platform/`) ohne Import aus den Küchen-Modulen, mit einer Lint-Regel. Die Suite erntet es einmal (Kopie in `platform/`, Vermerk der Herkunft), und ab dann ist die Suite die Quelle und Randen bekommt es zurück als Kopie mit Stempel.
- **Baut die Suite ein Stück zuerst** (Kundschaft, Objekte, Aufträge, Einsätze, Rapporte, Rechnungen), bekommt Randen es als Kopie, sobald Gastro es braucht (Catering, Vorbestellungen der Metzgerei).
- Diese Bitte an Randens Sitzung geht über Alban; die Suite ändert nichts in Randen ohne dessen Sitzung.

---

## 6. Wie eine Branche andockt

### 6.1 Die Definition einer Branche

Eine Branche ist ein Paar Pakete (`verticals/<id>/core`, `verticals/<id>/web`), das je eine Definition exportiert. Vorschlag, die erste Welle legt die genauen Typen fest:

```ts
// verticals/<id>/core/src/index.ts
export const cleaning = defineVertical({
  id: 'cleaning',                 // nie umbenannt, steht in docs/namen.md
  family: 'field',
  contract: cleaningContract,     // Operationen mit eigenem Präfix: 'cleaning.zones.list'
  useCases: (ctx, kits) => createCleaningUseCases(ctx, kits), // kits: Einsatz, Zeit, Aufgaben, Dokumente
  tables: { cleaningZones: CleaningZoneSchema },              // jede Zeile mit syncFields
  features: CLEANING_FEATURES,    // Register-Einträge (ADR-0022) mit vertical: 'cleaning'
  setup: cleaningSetup,           // Fragen und Vorschläge
  siteKinds, catalogTemplates, checklistTemplates, roleTemplates,
  positionSources,                // Positionen für Rapport und Rechnung
  todayContributions, demo, ruleSets,
});

// verticals/<id>/web/src/index.ts
export const cleaningWeb = defineVerticalWeb({
  id: 'cleaning',
  routes,                         // lazy geladen
  nav, workplaces,                // Einträge und Kacheln je Rolle, mit features
  messages: { 'de-CH': () => import('./messages/de-CH'), 'pt': () => import('./messages/pt') },
  lexicon,                        // Wörter der Branche für Seiten der Plattform
  documentSections,               // Blöcke im PDF, etwa die Zonen im Rapport
});
```

`suite/` setzt alles zusammen: die Schnittstelle als Summe (heute fest in `packages/core/src/contract/index.ts:24` und `:42`), die Use Cases (heute fest in `packages/core/src/application/index.ts:25`), die Tabellen (heute fest in `packages/core/src/ports/storage.ts:36`), die Routen (heute fest in `apps/web/src/app/routes.tsx:26`) und die Navigation (heute fest in `apps/web/src/app/nav.ts:50`). Ein Test prüft wie heute, dass keine Operation zwei Besitzer hat (ADR-0005, Punkt 2) und jede umgesetzt ist.

### 6.2 Andockpunkte

| Punkt | Was die Branche liefert | Wer prüft |
| --- | --- | --- |
| Schnittstelle | Operationen mit Präfix aus `docs/namen.md` | Test: eindeutige Namen, jede umgesetzt, JSON Schema erzeugbar (ADR-0005, Punkt 5) |
| Use Cases | rufen Kits der Plattform (wie heute `createStockLedger`) und eigene Tabellen; nie eine andere Branche | ESLint, Konformität |
| Tabellen | eigene Tabellen mit `syncFields` (`packages/core/src/model/primitives.ts:107`), Verweise nur auf Kennungen der Plattform oder eigene | Test: `businessId`, kein Verweis über einen Betrieb hinaus (ADR-0025, Punkt 8) |
| Schema-Ledger | die Branche meldet Tabellen; die Nummer des Schritts vergibt der Kopf beim Mergen | Test: Schritte lückenlos, veröffentlichte eingefroren (Prüfsumme) |
| Register | Funktionen, Module, Optionen, Rollen-Standard, `suggest`, `detailed`, `stage`, `availability` (ADR-0022, Punkt 3) | Test des Registers, «keine Spur, wenn aus» (ADR-0022, Punkt 16) |
| Einrichten | Fragen, die nur für diese Branche erscheinen, und Vorschläge | Test: höchstens zwei eigene Bildschirme, alle mit «du» |
| Vorlagen | Arten von Objekten, Leistungen (ohne Ansätze), Checklisten, Rollen-Vorlagen | Test: jede Vorlage hat eine Kennung und Texte in jeder freigegebenen Sprache |
| Positionsquellen | wie aus Daten der Branche Positionen für Rapport und Rechnung werden (Zonen × Fläche, Ausmass in m², Volumen in m³) | Test: jede Position hat Einheit, Menge mit höchstens drei Nachkommastellen und Ansatz in Rappen (ADR-0004) |
| Heute | Karten für die Liste «Heute» mit Rolle | Test: eine Rolle ohne Recht sieht keine |
| Seiten und Navigation | Routen lazy, Einträge mit `features` | Test: jede Kennung im Register (ADR-0022, Punkt 3) |
| Arbeitsplätze | Kacheln und Tabs je Rolle (W14) | Vorschau «So sieht es für diese Rolle aus» (W16, Punkt 5) |
| Texte | je Sprache, Lexikon | Sprachtests (Abschnitt 10) |
| Dokumente | Blöcke für PDF | Bild im `preview:shots` |
| Demo | ein Beispielbetrieb mit erfundenen Daten | Test: keine echten Namen |
| Regelwerke und Fakten | nur mit Quelle in `docs/fakten/` | Test: jede Zahl einer Regel trägt eine Marke L-17 |

### 6.3 Shell und Arbeitsplätze

- **Die Shell gehört der Plattform:** die drei Rahmen von ADR-0013 (Tab-Leiste am iPhone, schmale Leiste am iPad hochkant, Seitenleiste ab 1024 px), «＋ Erfassen», Suche, Gerätemodus.
- **Der Arbeitsplatz gehört der Rolle** (W14): Die Plattform setzt die fünf Tabs am iPhone aus den Kacheln zusammen, die Plattform und Branchen je Rolle anbieten, nach einer festen Rangfolge. Beispiel Reinigung: Mitarbeitende sehen «Heute · Einsätze · ＋ · Stunden · Mehr», die Chefin «Heute · Plan · ＋ · Rechnungen · Mehr».
- **«＋ Erfassen» im Feld heisst zuerst Foto:** Foto, ein Satz, Objekt vorgeschlagen aus dem laufenden Einsatz. Daraus wird je nach Branche ein Mangel, ein Schaden, ein Vorher-Bild oder eine Notiz.
- **Neue Gerätemodi:** zu `normal`, `pass`, `clock` (ADR-0022, Punkt 11) kommt `board` für eine Tafel (Zimmerstatus im Hotel, Wochenplan an der Wand im Werkhof). Die Stempeluhr im Werkhof ist `clock` wie in der Küche.

### 6.4 Texte, Lexikon und Sprache der Branche

- **Seiten der Plattform** brauchen Wörter für ihre Dinge. Die Branche liefert sie im Lexikon:

| Ding der Plattform | Reinigung | Hauswartung | Garten | Maler | Dachdecker | Umzug | Beherbergung |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `site` | Objekt | Liegenschaft | Garten | Baustelle | Baustelle | Adresse | Zimmer |
| `job` | Auftrag | Auftrag | Auftrag | Auftrag | Auftrag | Umzug | – |
| `plan` | Reinigungsplan | Pflichtenheft | Pflegeplan | – | Wartung | – | Reinigungsplan |
| `visit` | Einsatz | Rundgang | Einsatz | Arbeitstag | Arbeitstag | Umzugstag | Reinigung |
| `report` | Rapport | Rapport | Rapport | Regierapport | Rapport | Abnahmeprotokoll | – |

- **Nur Überschriften und Knöpfe** nehmen Wörter aus dem Lexikon. Ganze Sätze überschreibt die Branche, weil Artikel und Fälle wechseln («das Objekt», «die Baustelle», «am Umzugstag»). Zusammengesetzte Sätze mit eingesetzten Wörtern gibt es nicht.
- **Keine Texte im Kern:** Bezeichnungen stehen nur in `messages` (Randen TD-04; heute verletzt in `packages/core/src/domain/business-profiles.ts:87-89` und `packages/core/src/model/haccp.ts:22`). Für mehrere Sprachen wird das zur harten Regel: Der Kern liefert Kennungen, die Oberfläche macht daraus Text.
- **Ruhige Wörter wie bei einer Privatbank** gelten weiter (Randen CLAUDE.md): «Offerte», «Rechnung», «Zahlungseingang», «Mahnung», «Rapport», «Ausmass», «Regie», nie Schlagworte.

### 6.5 Marke einer Ausgabe

```ts
// editions/field/edition.config.ts
export default defineEdition({
  id: 'field',
  origin: 'https://vor-ort.onestrand.ch',   // Arbeitstitel, Entscheid 2
  dbName: 'onestrand',                       // nie umbenannt
  storagePrefix: 'onestrand:',               // Gerätedaten: Ansicht, Gerätemodus
  backupFormat: 'onestrand-backup',
  brand: { accent: '<Leitfarbe>', rail: '<Farbe der Leiste>', icon: 'public/icon.svg' },
  mainVerticals: ['cleaning', 'caretaking', 'garden', 'painting', 'roofing',
                  'building_services', 'moving'],
});
```

Die Ausgabe «Gastro» bekommt beim Umzug `dbName: 'randen'` (`apps/web/src/data/db.ts:71`), `storagePrefix: 'randen:'` (`apps/web/src/app/view.ts:10`, `features/settings/last-backup.ts:4`), `backupFormat: 'randen-backup'` und das Cloudflare-Projekt `randen` (`wrangler.jsonc`). Was heute fest im Code steht (`apps/web/vite.config.ts:47-48`, rund 50 Stellen «Randen» in den Textkatalogen), kommt aus der Konfiguration der Ausgabe.

Gemeinsame Werte (Schrift, Ziele 44 px, Radien, Raster, Lucide, Bewegung, eine Bedeutung pro Farbe, Dunkelmodus) gelten für jede Ausgabe (`docs/design.md`, «Gemeinsam mit Rettich»). Für das Feld kommt dazu: Kontrast geprüft auch für helles Sonnenlicht, Ziele für Arbeitsseiten 56 px statt 44 px (Annahme, mit Handschuhen auf einem echten Gerät messen).

### 6.6 Vorschläge beim Einrichten

Wie in Randen ADR-0015 und ADR-0022: Antworten schlagen Funktionen vor, alles bleibt einzeln schaltbar, Umfang «Schlank», «Üblich», «Alles». Neu: Die Antworten wirken über alle eingeschalteten Branchen, und jede Branche darf höchstens zwei eigene Fragen stellen (Abschnitt 11).

### 6.7 Konformitätsprüfung je Branche

`pnpm check:vertical <id>` läuft in jedem PR einer Branche und im Hauptlauf:

1. Definition vollständig: Schnittstelle, Use Cases, Tabellen, Register, Texte für jede Kennung in jeder freigegebenen Sprache.
2. Texte: «du» und «ss» in de-CH, keine Ausrufezeichen, verbotene Wörter (Randen ADR-0022, Punkt 4; ADR-0029, Punkt 1), keine Namen anderer Produkte, keine echten Namen in Demo und Vorlagen.
3. «Keine Spur, wenn aus»: ausgeschaltet oder für die Rolle verborgen erscheint nichts in Navigation, Heute, ＋, Suche, Listen.
4. Sicherung: Hin und zurück mit allen Tabellen der Branche; eine eingefrorene Sicherung der Vorversion lässt sich zurückholen.
5. Filter fürs Handy: Ein Profil ohne Recht bekommt beim Senden nie Ansätze, Löhne, Margen, Kasse, Zugangscodes anderer Tage (W14).
6. Grenzen: keine Importe aus anderen Branchen, kein Browser im Kern.
7. Nebenwirkungen: jede neue Art steht in `docs/nebenwirkungen.md` der Suite.

---

## 7. Gemeinsames Datenmodell

### 7.1 Grundsätze aus Randen, für die ganze Suite

- Jede Zeile hat eine UUIDv7 vom Gerät, `businessId`, `createdAt`, `updatedAt`, `deletedAt` (ADR-0003, Punkt 3; `syncFields`).
- Geld als Ganzzahl in Rappen (ADR-0004). Mengen mit höchstens drei Nachkommastellen. Ansätze in Rappen je Einheit (je Stunde, je m², je m³); die Plattform legt mit der ersten Welle fest, ob die Regel «Rappen pro 1000 Basiseinheiten» aus Randen für Flächen und Zeit gilt oder ob Ansätze je ganze Einheit stehen, und schreibt Rundung und Rappenrundung mit Quelle fest.
- Was sich über die Zeit ändert, wird angefügt (Ledger); Zustand und Summen werden berechnet (ADR-0007, ADR-0008).
- **Was jemand unterschrieben oder an Dritte gegeben hat, wird gesperrt:** Rapport mit Unterschrift, ausgestellte Offerte und Rechnung, Tagesabschluss. Ein gesperrter Stand ist eine eigene Zeile mit dem Inhalt, wie er war, und einer Prüfsumme. Korrigiert wird mit einem neuen Stand (Rapport) oder einer Gutschrift (Rechnung), nie durch Überschreiben. Das ist kein Widerspruch zu «berechnet, nie gespeichert»: Der Entwurf rechnet; das Papier, das die Kundschaft hat, bleibt, wie es war.
- Kein Verweis über einen Betrieb hinaus (ADR-0025, Punkt 8).
- Daten nur des Geräts (wer gerade arbeitet, PIN, Gerätemodus, Kopplungen) liegen getrennt und reisen nie (ADR-0025, Punkt 1).
- Personendaten so wenig wie möglich, mit Löschplan (ADR-0030); für Kundschaft neu zu entscheiden (Abschnitt 7.2, `customers`).

### 7.2 Die Dinge der Plattform

| Ding | Tabelle (Vorschlag) | Wichtigste Felder | Ledger oder Zustand | Berechnet |
| --- | --- | --- | --- | --- |
| Betrieb | `businesses` | Name, Adresse für den Briefkopf, Logo, Währung, `verticals` (erste = Haupt-Branche), Funktionen, Optionen, Kanton, MWST-Nummer und Methode, Konto für den QR-Zahlteil | Zustand | – |
| Person | `staff` | Name (Vorname genügt), Rollenprofil je Betrieb (W16), **Sprache der Oberfläche**, aktiv | Zustand | Rechte aus Profil |
| Rollenprofil | `roleProfiles` | Rechte je Funktion: nichts, sehen, bedienen, verwalten; heikle Rechte als Schalter (W16) | Zustand | – |
| Kundschaft | `customers` | Art (privat, Firma, Verwaltung, öffentlich), Name, Kontaktpersonen, Rechnungsadresse, Telefon, E-Mail, **Sprache der Dokumente**, Zahlungsfrist | Zustand | offener Betrag, Umsatz |
| Objekt | `sites` | Kundschaft (optional), Art (aus der Branche), Name, Adresse, übergeordnetes Objekt (Liegenschaft → Wohnung → Raum; Hotel → Etage → Zimmer), Kontakt vor Ort, Fotos, Hinweise | Zustand | – |
| Zugang | `siteAccess` | Schlüssel-Nummer, Code, Hinweis; **heikel**: nur für eingeteilte Personen am Tag des Einsatzes, nie im Päckli lesbar, nie im Export ohne Rückfrage | Zustand | – |
| Leistung und Material | `catalogItems` | Kennung einer Vorlage (für Übersetzung) oder eigener Name, Art (Arbeit, Material, Pauschale, Fahrt), Einheit, Ansatz des Betriebs, MWST-Satz | Zustand mit Preisverlauf | – |
| Auftrag | `jobs` und `jobEvents` | Kundschaft, Objekte mit Rolle (Arbeitsort; beim Umzug Auszug und Einzug), Titel, Art der Abrechnung (Regie, Pauschal, Ausmass), geplante Positionen | Status als Ledger: angefragt, offeriert, erteilt, geplant, in Arbeit, abgeschlossen, verrechnet, storniert | Status, Nachkalkulation |
| Leistungsplan | `plans` | Kundschaft, Objekt, Leistungen mit Regel (wöchentlich am Dienstag, monatlich am ersten Montag, nach Abreise), Checkliste, Team, Abrechnung (je Einsatz, Monatspauschale) | Zustand | Termine aus der Regel, nie gespeichert |
| Einsatz | `visits` und `visitEvents` | Auftrag oder Plan, Objekt, Tag, Zeitfenster, eingeteilte Personen | Ledger: eingeteilt, begonnen, Pause, Aufgabe erledigt, Foto, Material, Notiz, beendet, bestätigt | Dauer, Stand der Checkliste |
| Rapport | `reports` | Einsatz oder Auftrag und Zeitraum, gesperrter Inhalt (Stunden je Person, Leistungen, Material, Fotos, Bemerkungen), Unterschrift (Bild, Name, Zeit), Prüfsumme | gesperrter Stand, neue Fassung statt Änderung | – |
| Aufgabe und Checkliste | `taskTemplates`, `tasks`, `taskChecks` | Vorlage, Ziel (Objekt, Raum, Gerät), Wiederholung, Nachweis (abgehakt, Foto, Messwert mit Grenzen) | Nachweise nur angefügt | fällig, erledigt, Lücken |
| Zeitbuchung | `timeEntries` | wie ADR-0023, dazu optional Einsatz | Ledger, nie geändert, nie weich gelöscht (ADR-0023, Punkt 11) | Dauern, Saldi |
| Offerte, Rechnung, Gutschrift, Mahnung | `documents` und `documentEvents` | Art, Nummer aus einem Nummernkreis, Kundschaft, Auftrag, Datum, Fälligkeit, Positionen, MWST je Satz, Sprache, Referenz des QR-Zahlteils | Entwurf rechnet; ausgestellt gesperrt; Status als Ledger: ausgestellt, versandt (von der Person vermerkt), teilweise bezahlt, bezahlt, gemahnt, storniert | offener Betrag, Alter |
| Zahlungseingang | `payments` | Betrag, Tag, Quelle (von Hand, bar, Bankdatei), Referenz, Dokument | Ledger | – |
| Beleg, Kassenbuch, Tagesabschluss | wie ADR-0029 | – | Ledger mit Prüfkette | Kassenbestand |
| Datei | `files` | Blob, Art, Prüfsumme, Besitzer (Ding und Kennung), Zeitpunkt | Zustand | – |

Kundschaft ist neu für die Suite. Randen hält heute keine Kundenkartei (Randen E-05). Für Dienstleister ist sie unvermeidlich, weil Rechnungen Name und Adresse brauchen und Rechnungen aufzubewahren sind (Frist mit Quelle in die Fakten). Daraus folgt: Kundschaft wird nur so weit geführt, wie Auftrag und Rechnung es brauchen; Löschen einer Kundin entfernt Kontaktdaten, behält aber ausgestellte Dokumente bis zum Ende der Frist; Geburtstage, Vorlieben und Ähnliches gibt es nicht. Ein Coiffeur mit Kundenkartei braucht einen eigenen Entscheid mit Einwilligung (später, Ausgabe «Termine»).

### 7.3 Beziehungen

```
Betrieb ─┬─ Person ── Rollenprofil
         ├─ Kundschaft ──┬─ Objekt ── (Unterobjekt …) ── Zugang
         │               │
         │               ├─ Auftrag ──┬─ Einsatz ──┬─ Zeitbuchung
         │               │            │            ├─ Aufgabe, Nachweis
         │               │            │            ├─ Foto, Datei
         │               │            │            └─ Material
         │               │            └─ Rapport (gesperrt)
         │               ├─ Leistungsplan ── (Termine berechnet) ── Einsatz …
         │               └─ Offerte, Rechnung (gesperrt) ── Zahlungseingang
         ├─ Leistung und Material (Katalog)
         └─ Beleg, Kassenbuch, Tagesabschluss
Branche ─── eigene Tabellen mit Verweis auf Kennungen der Plattform (nie umgekehrt)
```

### 7.4 Ledger, die nur anfügen

Lager (Gastro, ADR-0007), Zeit (ADR-0023), Bons (ADR-0027), Kassenbuch (ADR-0029), neu: Status der Aufträge, Schritte der Einsätze, Nachweise der Aufgaben, Status der Dokumente, Zahlungseingänge. Diese Wahl macht den Abgleich in Stufe 1 und 2 fast konfliktfrei (ADR-0025, Punkt 4): Zwei Geräte fügen an, keines überschreibt.

### 7.5 Wie Branchen erweitern

1. **Vorlagen (nur Daten):** Arten von Objekten, Leistungen ohne Ansätze, Checklisten, Rollen-Vorlagen, Einheiten. Jede mit Kennung, damit sie übersetzt reist.
2. **Eigene Tabellen mit Verweis auf die Plattform:** `cleaningZones` (Objekt, Fläche, Bodenart, Intervall), `paintingMeasurements` (Auftrag, Raum, Wandflächen, Abzüge), `movingInventory` (Auftrag, Gegenstände, Volumen), `roofingInspections` (Objekt, Befund, Fotos), `lodgingRoomStates` (Zimmer, Status als Ledger). Die Plattform kennt sie nicht.
3. **Andockpunkte, die die Plattform aufruft:** Positionsquellen, Karten für «Heute», Blöcke im PDF, Fragen beim Einrichten (Abschnitt 6.2).
4. **Merkmale des Betriebs** (später, eine Funktion der Plattform): eigene Felder an Kundschaft und Objekt (Text, Zahl, ja oder nein), etwa «Nummer des Schlüsselkastens». Ohne Code, ohne Branche. Mit Warnung, keine Gesundheits- oder heiklen Personendaten einzutragen.

Nicht erlaubt: ein freies Feld `ext` an Zeilen der Plattform, in das jede Branche schreibt. Es entzöge sich der Prüfung, und zwei Branchen würden sich darin begegnen.

### 7.6 Beispiele je Branche

| Branche | Arten von Objekten | Eigene Tabellen | Positionsquelle | Besondere Papiere |
| --- | --- | --- | --- | --- |
| Reinigung | Büro, Treppenhaus, Wohnung, Praxis | Zonen mit Fläche und Intervall | Zonen × Einsätze oder Monatspauschale; Stunden in Regie | Abgabeprotokoll der Umzugsreinigung, Reinigungsplan zum Aushängen |
| Hauswartung | Liegenschaft, Wohnung, Umgebung, Technikraum | Ablesungen (Zählerstände), Mängel mit Foto und Status | Pauschale je Objekt und Monat, Regie für Zusätzliches | Rapport je Verwaltung und Monat, Mängelliste |
| Garten | Garten, Rasen, Hecke, Baum | Pflegeflächen | Fläche, Laufmeter Hecke, Stunden, Grüngut | Pflegeplan |
| Maler und Gipser | Baustelle, Raum | Ausmass je Raum mit Abzügen | m² aus dem Ausmass, Regie, Material | Offerte mit Ausmass, Regierapport |
| Dachdecker und Spengler | Dach, Fassade | Befunde mit Fotos vorher und nachher | Ausmass, Regie, Material | Zustandsbericht, Sicherheits-Checkliste (nur mit Quelle) |
| Haustechnik | Anlage, Gerät | Anlagen mit Wartungsintervall | Wartungspauschale, Regie, Material | Wartungsprotokoll |
| Umzug | Auszug, Einzug | Umzugsgut mit Volumen | m³, Stunden je Person, Fahrzeug, Zuschläge | Offerte nach Besichtigung, Schadenprotokoll |
| Beherbergung | Etage, Zimmer | Zimmerstatus (Abreise, Bleibe, frei, gesperrt) | – (Abrechnung der Gäste ist nicht Teil; Hinweis) | Zimmerliste für die Etage |

### 7.7 Was mit Randens Modell geschieht

- **Bleibt Branche Gastro:** Artikel mit Allergenen, Chargen, Lager-Ledger, Rezepte, Speisekarte, Selbstkontrolle der Küche, Bons.
- **Wird Plattform:** Betrieb und Register (Randen `packages/core/src/model/business.ts:49`, mit `modules` bis heute `max(20)` in `:63`), Person (heute eine Rolle je Person in `business.ts:80`; W16 verlangt Profile), Command-Kit, Sicherung, Zeit, Kasse und Belege, Dokumente, Kopplung.
- **Wird Plattform-Muster:** Reinigungsplan und Messungen der Selbstkontrolle sind dieselbe Form wie Aufgaben mit Nachweis. Die Plattform baut `tasks` neu und allgemein; Gastro stellt seine Tabellen `hygieneTasks` und `hygieneChecks` nicht um, solange es sie nicht braucht. Kennungen und Tabellen werden nie umbenannt (Masterplan 1.3, Regel 3).

---

## 8. Geräte und Abgleich Büro ↔ Baustelle

### 8.1 Geräte und Arbeitsplätze

| Gerät | Wer | Arbeitsplatz | Rahmen |
| --- | --- | --- | --- |
| iPhone im Feld | Mitarbeitende, Vorarbeiter:in, Chef:in unterwegs | Heute, Einsätze, Stempeln, ＋ Foto, Checkliste, Rapport mit Unterschrift, Meine Stunden | Tab-Leiste, grosse Ziele, offline |
| iPhone der Chefin | Chef:in allein | alles, auch Offerte und Rechnung in einer Spalte | Tab-Leiste |
| iPad oder Laptop im Büro | Chef:in, Büro | Wochenplan (wer wo), Kundschaft, Offerten, Rechnungen, Zahlungseingänge, Belege, Monatspaket, Zahlen | Seitenleiste ab 1024 px (ADR-0013) |
| iPad im Werkhof | alle | Stempeluhr (`clock`), Wochenplan an der Wand (`board`) | Gerätemodus |
| Kein Smartphone | ältere Mitarbeitende, Aushilfen | Stempeln am Gerät im Werkhof, Einsatzblatt auf Papier, Rapport auf Papier, als Foto zurück | Papier-Brücke |

**Niemand muss ein eigenes Handy haben.** Die Suite rechnet damit, dass ein Teil des Teams kein Smartphone nutzen will oder kann. Stempeln am Gerät des Betriebs bleibt immer möglich (wie ADR-0025, Punkt 6).

### 8.2 Fünf Lagen

| Lage | Wer | Stufe 1 | Stufe 2 |
| --- | --- | --- | --- |
| L1 Allein mit einem Handy | Hauswart, Einzelreinigung, Maler allein | kein Abgleich nötig; Sicherung mit Erinnerung | Sicherung im Netz, verschlüsselt |
| L2 Allein mit Handy und Laptop | Chef:in, die abends am Laptop schreibt | Kopplung im WLAN zu Hause; beide Geräte gehören dem Betrieb | Abgleich überall |
| L3 Team trifft sich morgens und abends | Dachdecker, Maler, Gartenbau mit Werkhof | Kopplung im WLAN des Werkhofs, mit dem Vermittler von W15 von selbst, sobald beide Apps offen sind: morgens gehen die Einsätze des Tages hinaus, abends kommen Zeit, Rapporte, Fotos, Material zurück | Abgleich überall, Mitteilungen |
| L4 Team trifft sich selten | Reinigung am Abend in Büros, Hauswart mit Aushilfe | Päckli über das Teilen-Menü (Abschnitt 8.3), Papier, einmal pro Woche Kopplung bei der Chefin | Abgleich überall |
| L5 Ein Ort, mehrere Geräte | Hotel (Etage und Rezeption), Küche | Kopplung im WLAN des Hauses wie ADR-0028 | Abgleich überall |

### 8.3 Wege in Stufe 1

1. **Kopplung im WLAN des Betriebs** (ADR-0028, erweitert durch W14 und W15): einmal koppeln per QR-Code, danach verbinden sich die Geräte über den Vermittler, sobald beide Apps offen sind und im selben WLAN stehen. Betriebsdaten laufen direkt im WLAN, nur lokale Kandidaten, kein STUN, kein TURN (W15, Punkt 3). Übertragen werden Befehle mit `commandId`, nicht Zeilen (ADR-0028, Punkt 4). Für die Suite heisst «WLAN des Betriebs» auch das WLAN des Werkhofs und, bei L1 und L2, das WLAN zu Hause, wenn beide Geräte dem Betrieb gehören. Was über die Kopplung darf, ist eine geschlossene Liste je Profil (Abschnitt 8.4); heute erlaubt ADR-0028 nur Gästebestellungen, und W14 erweitert auf gefilterte Daten fürs Handy. Für Einsätze, Rapporte und Zeit braucht es ein Suite-ADR, das diese Liste festhält (Zeitbuchungen über die Kopplung sind Randen E-14, offen).
2. **Päckli über das Teilen-Menü** (neu, Entscheid 6): Das Büro gibt einer Person die Einsätze der Woche als Datei, verschlüsselt mit dem Schlüssel der Kopplung; die Person holt sie in der App. Am Abend schickt das Handy Zeit, Rapporte und Fotos als Päckli zurück, über einen Weg, den die Person wählt (Nachricht, E-Mail, Datei). Wer die Datei unterwegs abfängt, liest nichts; nur das gekoppelte Gerät öffnet sie. Ein Päckli enthält Befehle mit `commandId`; doppelt einlesen schadet nicht. Das ist dieselbe Form wie das Zusammenführen von Zeitbuchungen per Datei (ADR-0023, Punkt 10), nur verschlüsselt und für mehr Dinge. Es ist ein neuer Datenfluss: Betriebsdaten verlassen das Gerät über einen Weg, den die Person wählt, verschlüsselt. Darum Albans Entscheid ([Datenfluss]).
3. **Papier:** Das Büro druckt das Einsatzblatt mit QR-Code des Einsatzes; auf der Baustelle wird von Hand rapportiert und unterschrieben; zurück im Büro öffnet der QR-Code den Einsatz, das Papier kommt als Foto dazu, Stunden werden getippt. Das ist auch der Weg für Mitarbeitende ohne Smartphone.
4. **QR-Etikett am Objekt** statt Standort: Ein Etikett im Technikraum oder Putzraum; «Einsatz beginnen» liest es in der App und schreibt «am Objekt bestätigt» an die Buchung. Kein Standort, keine Koordinaten, kein Verlauf (ADR-0025, «Offen», letzter Punkt; ADR-0030, Punkt 8). Kamera nur nach Tipp, Ausweg «Objekt aus der Liste wählen». Der Leser hängt an Randen E-17 (`'wasm-unsafe-eval'`) oder einem Leser in reinem JavaScript.
5. **Sicherung** bleibt der Weg, den ganzen Betrieb auf ein neues Gerät zu bringen (ADR-0017).

### 8.4 Was aufs Handy der Mitarbeitenden geht

Gefiltert beim Senden auf dem Gerät der Chefin, nach dem Rollenprofil (W14, Punkt 1):

| Geht | Geht nie |
| --- | --- |
| eigene Einsätze der nächsten Tage mit Objekt, Adresse, Aufgaben, Checkliste, Hinweisen | Ansätze, Preise, Margen, Rechnungen, Kasse |
| Zugang (Code, Schlüssel-Nummer) nur für Einsätze des Tages, danach gelöscht | Zugänge anderer Tage und anderer Personen |
| Name und Telefon der Kontaktperson vor Ort für den Einsatz | Kundenkartei, Rechnungsadressen, offene Beträge |
| eigene Stunden, Saldi, eigener Plan; vom Team Vornamen und Schichten | Löhne und Stunden anderer, Gesundheitsdaten |
| Vorlagen und Leistungen ohne Ansätze, übersetzt | Notizen der Chefin zu Personen |

Das Profil auf dem Handy läuft ohne Verlängerung nach der Frist ab und löscht die Daten des Betriebs selbst (W14, korrigiert, Punkte a bis d; Vorschlag 30 Tage). Fernlöschung bleibt Stufe 2.

### 8.5 Wer schreibt was

| Daten | Wer schreibt | Bei zwei Geräten |
| --- | --- | --- |
| Einsätze im Feld (Schritte, Fotos, Material, Nachweise) | das Handy im Einsatz | nur angefügt; nichts geht verloren |
| Zeitbuchungen | wer stempelt | nur angefügt; zwei «Kommen» derselben Person sind ein Hinweis (ADR-0025, Punkt 4) |
| Planung (wer wann wo) | das Büro | zuletzt geschriebenes Feld gewinnt, mit Hybrid Logical Clock (TD-06) |
| Stammdaten (Kundschaft, Objekte, Katalog) | Büro, mit Recht auch das Feld | wie Planung |
| Nummernkreise von Offerten und Rechnungen | **ein** Gerät je Nummernkreis, das Hauptgerät des Büros | ein zweites Gerät bekommt einen eigenen Kreis mit Präfix; nie zwei gleiche Nummern |
| Kasse | ein Gerät je Kasse (ADR-0029, Punkt 5; ADR-0025, Punkt 4) | eigene Kette je Gerät |
| Rapport sperren und unterschreiben | das Gerät im Einsatz | gesperrter Stand reist als Ganzes; eine zweite Fassung ist eine neue Zeile |

### 8.6 Stufe 2

Nach Albans JA zu E-24 (ADR-0025, Weg (b)): Relais mit Ende-zu-Ende-Verschlüsselung in der Schweiz, Konten mit Passkeys auf `konto.onestrand.ch` (gültig für alle Ausgaben auf Unteradressen), Schlüssel des Betriebs per QR, Mitteilungen, Abgleich über Netze, mehrere Standorte. Die Ledger und Befehle mit `commandId` aus Stufe 1 tragen das ohne Umbau. Für die Suite kommt ein Punkt dazu: Der Betreiber des Relais wird Auftragsbearbeiter jedes Betriebs (ADR-0025, Punkt 7), auch für Kundendaten der Dienstleister.

### 8.7 Feldtauglich

- Offline zuerst, alles im Vorab-Cache der Ausgabe; Fotos auf dem Gerät verkleinert, als Datei, nicht als Data-URL in der Zeile (TD-03; Randen ADR-0029, Punkt 6).
- **Navigation zur Baustelle** öffnet auf Tipp die Karten-App mit der Adresse. Dabei geht die Adresse an den Anbieter der Karten-App. Das ist eine Nebenwirkung wie Teilen, ausgelöst von der Person; sie kommt in `nebenwirkungen.md` und vor dem Bau zu Alban, weil es ein neuer Datenfluss von Kundendaten ist. Anrufen (`tel:`) ebenso, aber ohne Daten an Dritte ausser dem Telefonnetz.
- Akku: kein Dauerbetrieb im Feld, kein Wake Lock ausser im Gerätemodus.
- Ein Daumen, Handschuhe, Licht: grosse Ziele, hoher Kontrast, Foto mit einem Tipp.

---

## 9. Papier-Brücke

| Papier | Für wen | Woher | Stil (Randen E-06) |
| --- | --- | --- | --- |
| Offerte | Kundschaft | Auftrag, Positionen, Ausmass | Formular mit Briefkopf |
| Auftragsbestätigung | Kundschaft | Auftrag | Formular |
| Einsatzblatt mit QR-Code | Mitarbeitende | Einsatz | Formular, gross lesbar |
| Rapport zum Unterschreiben | Kundschaft, Verwaltung | Einsatz, gesperrt | Formular |
| Rechnung mit QR-Zahlteil | Kundschaft | Rapport, Auftrag, Plan | Formular mit Zahlteil |
| Mahnung | Kundschaft | Rechnung | Formular |
| Abgabeprotokoll, Mängelliste, Schadenprotokoll | Kundschaft, Verwaltung | Branche | Formular |
| QR-Etiketten für Objekte | Betrieb | Objekte | Etikettenbogen A4 |
| Reinigungsplan oder Pflichtenheft zum Aushängen | Objekt | Leistungsplan | Übersicht |
| Wochenplan | Team | Planung | Übersicht |
| Monatsblatt der Arbeitszeit | Mitarbeitende | Zeit (ADR-0023, Punkt 14) | Formular |
| Monatspaket | Treuhand | Belege, Kasse, Rechnungen, Zahlungen, Lohn-Export | Übersicht und Dateien (ADR-0029, Punkt 8) |

- **PDF auf dem Gerät** mit dem Kit aus Randen (ADR-0019, `apps/web/src/ui/pdf/`), Dokument-Ansicht vor dem Drucken (ADR-0026), Weitergabe nur über das Teilen-Menü (`ui/share-file.ts`). Die Person verschickt selbst, per E-Mail oder Nachricht. Keine Anbindung an E-Rechnungsnetze (Randen ADR-0011).
- **QR-Zahlteil** nach den Swiss Payment Standards (Implementation Guidelines der QR-Rechnung): Konto, Referenz, Betrag, strukturierte Adressen. Die geltende Fassung und ihre Regeln kommen vor dem Bau mit Quelle in die Fakten; ein Test erzeugt Rechnungen aus erfundenen Daten und prüft sie gegen die Regeln. Der QR-Code entsteht auf dem Gerät mit einer schlanken, permissiv lizenzierten Abhängigkeit (`pnpm licenses:check`).
- **Zahlungseingang aus der Bankdatei:** Die Person lädt bei ihrer Bank die Gutschriftsanzeige als Datei herunter und gibt sie der App; die App liest Referenz und Betrag und ordnet zu. Das ist Datei-Import, keine Anbindung (Randen ADR-0029, Punkt 9; E-18). Das Format kommt mit Quelle in die Fakten.
- **Unterschrift auf dem Glas:** Bild mit Name und Zeitpunkt im gesperrten Rapport. In der App heisst sie «Bestätigung der Kundschaft». Kein Versprechen, sie ersetze eine qualifizierte elektronische Signatur.
- **Papier kommt als Foto zurück:** Jeder Einsatz, jeder Auftrag und jeder Beleg nimmt Fotos von Papier an.
- **Vorsystem, keine Buchhaltung:** Rechnungen und Zahlungen sind wie Kasse und Belege ein Vorsystem für die Treuhand (Randen ADR-0029, Punkt 1). Die verbotenen Wörter dort gelten auch hier.
- **Dokumente an Dritte sprechen mit «Sie»** oder neutral («Wir danken für den Auftrag.»). Die App spricht die Person mit «du» an (ADR-0010). Texte für Dokumente an Dritte stehen in eigenen Katalogen (`documents.<sprache>.ts`), die der Test für «du» auslässt und stattdessen auf ein einheitliches «Sie» prüft. Der heutige Test (`apps/web/src/app/messages.test.ts:39-45`) würde ein «Sie» in jedem Katalog ablehnen. Das ist ein kleiner Entscheid mit ADR; Alban kann ihn ändern.
- **Sprache des Dokuments** folgt der Kundschaft (`customers.language`): Eine Verwaltung in der Romandie bekommt ihre Rechnung auf Französisch, auch wenn der Betrieb auf Deutsch arbeitet. Bis die Kataloge geprüft sind, nur de-CH.

---

## 10. Sprachen

### 10.1 Grundsätze

- **Sprache der Oberfläche je Person,** gespeichert an der Person und auf dem Gerät, nicht am Betrieb. Die Chefin arbeitet auf Deutsch, die Mitarbeiterin auf Portugiesisch, am selben Betrieb.
- **Zuerst der Arbeitsplatz der Mitarbeitenden:** Heute, Einsätze, Stempeln, Einsatz mit Checkliste und Fotos, Meine Stunden, Meine Daten und das Datenblatt nach DSG (ADR-0030, Punkt 10). Gerade das Datenblatt muss die Person verstehen. Das Büro bleibt bis nach dem Pilot de-CH.
- **Welche Sprachen:** die der Pilot-Teams. Annahme aus den Branchen, im Pilot zu fragen: Portugiesisch, Albanisch, Italienisch, Serbisch, Kroatisch und Bosnisch, Spanisch, Türkisch, Englisch. Je Sprache eine Freigabe.
- **Vorlagen reisen übersetzt,** Freitext nicht: Leistungen, Checklisten, Arten von Objekten, Rollen-Vorlagen haben Kennungen und Texte je Sprache. Was die Chefin selbst tippt, bleibt, wie sie es tippt; dazu Bilder und Symbole, und ein optionales Feld «auch auf …», in das jemand im Betrieb eine Übersetzung schreibt.
- **Keine Übersetzung durch fremde Dienste** zur Laufzeit: Sie wäre ein KI- oder Netzdienst (Randen Masterplan 0.1: NEIN) und schickte Betriebsdaten weg. Übersetzt wird beim Bauen; vor der Freigabe prüft eine Person mit dieser Muttersprache. Bis dahin heisst die Sprache in der Auswahl «Vorschau». Eine Prüfung kann Geld kosten; dann fragt Claude Alban.
- **Sicherheit nie nur in Übersetzung:** Hinweise zur Arbeitssicherheit stehen zusätzlich auf Deutsch und mit Symbol, bis die Übersetzung geprüft ist.

### 10.2 Technik

- Texte je Sprache in `messages/<sprache>.ts`, Typ `satisfies Messages` der de-CH-Fassung: Ein fehlender Schlüssel bricht den Typecheck. Fehlt eine Sprache für einen Teil, zeigt die App de-CH, nie eine leere Stelle.
- Laden je Sprache bei Bedarf; im Vorab-Cache nur die Sprachen, die eine Person des Betriebs gewählt hat (Annahme, mit der Grösse messen).
- Zahlen, Beträge und Daten mit `Intl` und der Schweizer Region der Sprache (`de-CH`, `fr-CH`, `it-CH`); CHF bleibt. Randen formatiert heute fest für de-CH (`packages/core/src/format.ts`, `money.ts`).
- Tests je Sprache: kein leerer Text, keine Platzhalter übrig, für de-CH «du», «ss», keine Ausrufezeichen; für jede Sprache die verbotenen Wörter in ihrer Übersetzung.
- Kein Text im Kern (Abschnitt 6.4).

### 10.3 Romandie und Tessin

Später, als ganze Ausgabe in `fr-CH` und `it-CH`, mit Fakten je Kanton (Feiertage) und rechtlichen Texten. Offen ist die Anrede: Die Regel «du» (ADR-0010, Randen E-26) wäre auf Französisch «tu»; in Geschäftssoftware der Romandie ist «vous» üblich (Annahme, nicht belegt). Das entscheidet Alban mit E-26, wenn die Romandie kommt.

---

## 11. Einrichten in wenigen Minuten

### 11.1 Fragen (für «Vor Ort»; jede unter 20 Sekunden, zusammen unter drei Minuten)

| Bildschirm | Frage | Antworten | Wirkung |
| --- | --- | --- | --- |
| Start | – | «Einrichten», «Erst ein Beispiel ansehen» | Demo der gewählten Branche |
| Branche | «Was machst du?» (mehrfach, eine als Haupt-Branche) | Reinigung, Hauswartung, Garten, Maler und Gipser, Dachdecker und Spengler, Haustechnik, Umzug, Anderes | Branchen, Lexikon, Vorlagen |
| Team | «Wie viele Personen arbeiten mit, mit Aushilfen?» | «Ich allein», «2 bis 5», «6 bis 20» | Team, Rollen, Stempeln, Plan, Kopplung |
| Wiederkehrend | «Hast du Kundschaft, bei der du regelmässig arbeitest?» | ja, nein | Leistungspläne |
| Rechnen | «Wie schreibst du heute Offerten und Rechnungen?» | «Von Hand», «Mit einer Vorlage am Computer», «Mit einem anderen Programm», «Das macht meine Treuhand» | Rechnungen an oder nur Rapport-Export |
| Branche (höchstens zwei) | z. B. Maler: «Rechnest du meist nach Ausmass oder nach Stunden?»; Reinigung: «Machst du auch Umzugsreinigungen mit Abgabe?» | je Branche | Optionen |
| Name | «Wie heisst dein Betrieb?» | Text | – |
| Zusammenfassung | «Das richtet die App für dich ein» | nach Modulen, Umfang wählbar | speichern mit «Fertig» |

### 11.2 Später gefragt, beim ersten Bedarf

- Konto für den QR-Zahlteil, Adresse für den Briefkopf, Logo: bei der ersten Offerte oder Rechnung.
- MWST-pflichtig und Methode: bei der ersten Rechnung, mit dem Hinweis auf die Schwelle aus den Fakten.
- Kanton: beim ersten Feiertag oder Plan.
- Regelwerk (Gesamtarbeitsvertrag der Branche, wo allgemeinverbindlich): beim ersten Stempeln, vorgeschlagen nach Branche, nur mit Quelle.

### 11.3 Erster Tag in «Heute»

Karten, die verschwinden, wenn erledigt: «Lege deine erste Kundin oder deinen ersten Kunden an» (mit «Aus Kontakten holen» über eine vCard-Datei), «Trage deine Ansätze ein» (Leistungen der Branche vorbelegt, Ansätze leer), «Schreibe deine erste Offerte». Die Suite schlägt **keine Preise oder Ansätze** vor: Sie wären Zahlen ohne Quelle, und jeder Betrieb rechnet anders.

### 11.4 Ziele zum Messen im Pilot

- Installieren und einrichten: unter fünf Minuten.
- Erste Rechnung mit QR-Zahlteil ab Null (Kundin, Leistung, Rechnung): unter zehn Minuten.
- Einsatz beginnen, Checkliste, Foto, beenden: unter einer Minute für einen kurzen Einsatz.

---

## 12. Governance für parallele Agenten

### 12.1 Rollen

| Rolle | Besitzt | Darf nicht |
| --- | --- | --- |
| Kopf (Dispatcher, diese Sitzung) | `docs/`, `docs/namen.md`, `docs/plattform-karte.md`, Schema-Ledger, `suite/`, `editions/`, Merge, Freigabe der Ausgaben | Code einer Branche schreiben |
| Plattform-Agent | `platform/**` | Branchen-Code ändern; Plattform-Stücke ohne Antrag bauen |
| Branchen-Agent je Branche | `verticals/<id>/**`, `docs/verticals/<id>/**` | `platform/**`, andere Branchen, `editions/**` ändern |
| Prüfer:in (lesend) | Reviews, Konformität | schreiben |

Wie bei Rettich und SWELPER (Rettich CLAUDE.md, «Agent-Orchestrierung»): Jeder Auftrag nennt Ziel, Dateien, Akzeptanzkriterien, Tabu-Bereiche und Testweg; der Kopf reviewt jedes Ergebnis und merged als Einziger. Die Suite kann ein eigener Kontext im SWELPER werden (`ctx:onestrand`), wenn Alban das will.

### 12.2 Vor dem Code: der Steckbrief

Jede Branche beginnt mit `docs/verticals/<id>/steckbrief.md`, geschrieben und vom Kopf abgenommen, bevor eine Zeile Code entsteht: Alltag in drei Betrieben (allein, klein, grösser), Wörter (Lexikon), Rollen, Pflichten mit Quelle (Arbeitszeit, Gesamtarbeitsvertrag, Arbeitssicherheit, Entsorgung, Bewilligungen), erste Kunden, kleinste Einrichtung, Startfunktionen je Antwort, Papiere, Demo, was die Plattform liefern muss, was ausdrücklich nicht gebaut wird.

### 12.3 Verträge zwischen Plattform und Branchen

- **Plattform-Antrag:** Braucht eine Branche etwas von der Plattform, schreibt sie einen Antrag (Issue oder Datei in `docs/antraege/`) mit Fall und Vorschlag. Der Kopf entscheidet, der Plattform-Agent baut. Bis dahin baut die Branche, was nicht davon abhängt.
- **Andockpunkte sind die einzige Tür** (Abschnitt 6.2). Was keiner ist, gibt es für Branchen nicht.
- **Eingefroren** sind veröffentlichte Operationen, Ereignisse, Kennungen im Register und Schema-Schritte. Ein Test hält Prüfsummen fest.

### 12.4 Geteilte Dateien, die nur der Kopf ändert

- **Schema-Ledger je Datenbankname:** Eine Branche meldet ihre Tabellen im PR ohne Nummer; der Kopf vergibt den nächsten Schritt beim Mergen. So entstehen keine zwei Fassungen «Version 7» auf Geräten, wenn zwei Agenten gleichzeitig Tabellen anlegen. Eine Datenbank je Branche wäre keine Lösung: IndexedDB hält eine Transaktion nur innerhalb einer Datenbank, und «Einsatz beenden» schreibt Einsatz, Zeit und Nachweise der Branche zusammen (ADR-0003, Punkt 6).
- **`docs/namen.md`:** Kennungen der Branchen, Präfixe der Operationen und Ereignisse, Tabellennamen. Wer einen Namen braucht, reserviert ihn im Steckbrief.
- **`suite/`:** eine Zeile je Branche.

### 12.5 Branches, Prüfung, Auslieferung

- Ein PR = ein Thema, ein Auftrag = ein Branch (`claude/<branche>-<thema>`), mit Tests und grüner Prüfung (Randen CLAUDE.md, Arbeitsweise 2 und 6).
- `pnpm check` im ganzen Repo mit `ALL=GREEN`, dazu `pnpm check:vertical <id>`. Das Repo ist öffentlich, die Minuten der CI sind damit kostenlos; trotzdem nur geänderte Pakete und ihre Abhängigen testen, wo es sicher ist.
- **`main` ist Integration, nicht Production.** Anders als Randen heute (Arbeitsweise 10) liefert die Suite jede Ausgabe aus einem eigenen Branch aus (`live/<ausgabe>`), den nur der Kopf nach grüner Prüfung und einem Rundgang durch die Vorschau nachzieht. Grund: Eine installierte PWA aktualisiert sich von selbst; ein Fehler einer Branche träfe sonst jeden Betrieb jeder Ausgabe am selben Morgen. Vorschauen laufen je Branch unter eigenen Adressen ohne echte Daten (ADR-0020, Abschnitt 4 von `suite.md`).
- Previews für Alban bei jeder sichtbaren Änderung (`preview:shots`, `sheet.png`), wie in Randen.

### 12.6 Was immer gilt

- Öffentliches Repo: keine Preise, kein Geschäftsmodell, keine Namen anderer Produkte, keine echten Namen in Fixtures, Demo, Commits.
- Harte Regeln aus Randen gelten für jede Branche (Kurzfassung in der `CLAUDE.md` der Suite): Daten bleiben auf dem Gerät, Ausnahmen nur mit Albans JA und eigenem ADR; keine Partner-Anbindungen; Geld als Ganzzahl; Contract-first; Ledger; berechnet statt gespeichert, gesperrt, was Dritte haben; Fakten mit Quelle; de-CH mit «du» und «ss»; nur kostenlose, permissive Abhängigkeiten; Alban fragen vor Geld, Preisen, neuen Datenflüssen und grösseren Abweichungen.
- Nebenwirkungen, Schulden, Lernbuch, Glossar je PR nachführen; der Test der Nebenwirkungen läuft je Ausgabe.

---

## 13. Der Weg für Randen

### 13.1 Jetzt (ohne Störung)

1. Randens Sitzung baut ihren Ausbau weiter, in ihrer Reihenfolge (Masterplan, Abschnitt 5).
2. Über Alban eine Bitte an Randens Sitzung: Register (AP-1), Rollen (AP-2), Stempeln (AP-3), Dokument-Ansicht (AP-15), Kasse und Belege (AP-16) und Kopplung (AP-19) «plattformfähig» bauen: in einem eigenen Ordner, ohne Import aus Küchen-Modulen, mit Kennungen ohne Küchenwort, Texte nur in `messages` (Abschnitt 5.5). Kosten für Randen: ein Ordner und eine Lint-Regel.
3. **Vor dem ersten Gastro-Pilot** fallen drei Entscheide, die sich danach nur mit Umzug jeder Küche ändern lassen: die endgültige Adresse (Empfehlung `gastro.onestrand.ch`; ADR-0020, Punkt 5; Randen E-19), der Name auf dem Home-Bildschirm und das Symbol (Rettich L-11). Heute gibt es keine echten Betriebsdaten auf `randen.<konto>.workers.dev`; ein Wechsel kostet jetzt nichts.

### 13.2 Ernte (während Welle 1 bis 3)

- Die Suite erntet die plattformfähigen Stücke aus Randen einmal (Kopie mit Vermerk der Herkunft), führt sie in `docs/plattform-karte.md` und ist ab dann die Quelle.
- Randen bekommt Plattform-Stücke zurück als Kopie mit Stempel (Abschnitt 5.3), sobald es sie braucht.

### 13.3 Umzug des Codes (nach AP-12, in einer ruhigen Woche)

Zeitpunkt: nach dem Pilot-Kit (AP-12), wenn die ersten Küchen stabil laufen, nicht während eine Küche eingerichtet wird; spätestens bevor Gastro Kundschaft und Rechnungen der Plattform braucht (Catering, Vorbestellungen).

1. Randen friert ein: keine offenen PRs, `pnpm check` grün, `main` gleich Arbeits-Branch.
2. Import mit Geschichte (Subtree oder Zusammenführen ohne gemeinsame Vorfahren) nach `verticals/gastro/` (Küche) und `editions/gastro/` (Rahmen, `public/`, `wrangler.jsonc`), Plattform-Stücke aus `vendor/` entfallen.
3. Ausgabe «Gastro» behält: Cloudflare-Projekt `randen`, `dbName: 'randen'`, Präfix `randen:`, Format `randen-backup`, Dexie-Versionen 1 bis n als erste Schritte ihres Schema-Ledgers. Kennungen und Tabellen bleiben, wie sie sind.
4. Prüfen vor dem Umschalten: eingefrorene Sicherungen aller Fassungen seit 23.11.2026 zurückholen (Masterplan 1.3, Regel 3), E2E in vier Ansichten, ein echtes iPad mit Daten aktualisiert sich ohne Verlust.
5. Cloudflare baut `randen` ab jetzt aus `business-suite`, Branch `live/gastro`. Adresse und Herkunft ändern sich nicht; die installierten Apps merken nichts ausser einem gewöhnlichen Update.
6. `BanioX/Randen` wird archiviert (lesbar) oder privat; `docs/intern` zieht nach `rettich-intern` (Randen E-23).

### 13.4 Datensicherheit in jedem Schritt

- Nie umbenennen: Projekt, Datenbank, Präfixe, Format, Kennungen.
- Jede Änderung an Daten mit Migration und Test; Sicherung vor jedem Update empfohlen, wie heute nach 14 Tagen erinnert.
- Ein Umzug der **Adresse** folgt der Umzugsregel (ADR-0020, Abschnitt 5 von `suite.md`); ein Umzug des **Codes** braucht sie nicht.

---

## 14. Wellen

| Welle | Inhalt | Ergebnis | Braucht |
| --- | --- | --- | --- |
| 0 Kopf | Plan, ADRs der Suite, `CLAUDE.md` und `AGENTS.md` der Suite, Datenmodell, Lexikon, Governance, Steckbriefe Reinigung, Hauswartung, Maler; Entscheide 1 bis 8 | Alban entscheidet; Agenten haben Aufträge | – |
| 1 Fundament | `platform/core` mit Kern aus Randen (Kopie mit Vermerk), Komposition von Schnittstelle, Tabellen, Routen; Schema-Ledger; Register mit Branchen; Texte und Sprachen; UI-Kit, Shell, PDF-Kit aus Randen; Ausgabe «Vor Ort» als Rahmen mit Demo, nur Vorschau | Eine leere Branche dockt an und besteht die Konformität | Entscheid 1, 4 |
| 2 Kundschaft bis Rechnung | Kundschaft, Objekte, Katalog, Aufträge, Leistungspläne, Einsätze, Aufgaben mit Nachweis, Rapport mit Unterschrift, Offerte, Rechnung mit QR-Zahlteil, Zahlungseingang aus Datei, Mahnung, Heute; Branchen Reinigung und Hauswartung | Pilot mit einem Ein-Personen-Betrieb (L1) | Entscheid 2, 3, 5, 8; Fakten zu QR-Rechnung, MWST, Aufbewahrung |
| 3 Team im Feld | Rollenprofile (W16), Zeit-Ledger und Stempeln mit QR am Objekt, Wochenplan, Kopplung mit Vermittler, Päckli, Arbeitsplatz der Mitarbeitenden in den Pilot-Sprachen, Monatsblatt, Lohn-Export; abgestimmt mit Randen AP-2, AP-3, AP-19 | Pilot mit einer Reinigung mit Team (L4) | Entscheid 6, 7; Randen E-14, E-17 |
| 4 Handwerk | Maler und Gipser (Ausmass), Dachdecker und Spengler, Garten, Umzug, Haustechnik; Material und Lager schlank | je Branche ein Pilot | Steckbriefe, Fakten je Branche |
| 5 Haus und Termine | Beherbergung (Zimmerstatus als Tafel), danach prüfen: Coiffeur und Kosmetik | Entscheid über weitere Ausgaben | Pilot «Vor Ort» abgeschlossen |
| 6 Randen zieht um | Code von Randen ins Monorepo, Ausgabe «Gastro», Kundschaft und Rechnung für Catering und Vorbestellungen | eine Quelle für alles | AP-12 von Randen fertig |
| 7 Stufe 2 | Relais, Konten mit Passkeys, Mitteilungen, Abgleich über Netze, mehrere Standorte | nur nach Albans JA (E-24) | Geld, Server, neues ADR anstelle von ADR-0006 Punkt 1 |

Eine Branche nach der anderen. Welle 4 beginnt erst, wenn Welle 2 im Pilot läuft: Das Rückgrat muss bei einem echten Betrieb halten, bevor fünf Branchen darauf bauen.

---

## 15. Risiken

| Risiko | Folge | Was dagegen hilft |
| --- | --- | --- |
| Zu breit: viele Branchen zugleich | nichts ist pilotreif, Plattform-Fehler in allen Branchen | Rückgrat zuerst, eine Branche nach der anderen, Welle 4 erst nach Pilot von Welle 2 |
| Randens Ausbau wird gestört | Gastro-Pilot verzögert sich | Randen bleibt in seinem Repo bis nach AP-12; nur die Bitte «plattformfähig bauen»; Umzug in einer ruhigen Woche |
| Zwei Fassungen desselben Plattform-Stücks (Randen und Suite) | doppelte Arbeit, verschiedene Regeln für Zeit oder Kasse | Plattform-Karte mit einer Quelle je Stück, Ernte einmal, Kopie mit Stempel |
| Adresse oder Name ändern sich nach dem Pilot | jede Küche oder jeder Betrieb zieht mit Sicherung um; alte Namen bleiben auf dem Home-Bildschirm | Adressen nach Zweck, Name und Adresse jeder Ausgabe vor ihrem ersten Pilot |
| Ein Handy fällt vom Gerüst, bevor es abgeglichen hat | Rapporte, Fotos, Stunden des Tages weg | Abgleich am Abend, Päckli, Erinnerung an Sicherung, Papier als zweiter Weg; Stufe 2 |
| Erwartung «wie ein Messenger» an den Abgleich ohne Server | Enttäuschung, falsche Annahme, alles sei überall | ehrliche Sätze in der App («zuletzt abgeglichen …»), Rhythmus Werkhof, Zustand immer sichtbar |
| Falsche Rechnung oder falscher QR-Zahlteil | Zahlungen kommen nicht an, Ruf und Geld des Betriebs | Regeln mit Quelle, Tests gegen die Implementation Guidelines, Pilot mit echter Bank und kleinem Betrag durch den Betrieb selbst |
| Falsche Regeln je Branche (Gesamtarbeitsvertrag, Arbeitssicherheit, Entsorgung) | Betrieb verlässt sich auf eine falsche Zahl | nur mit Quelle, «Richtwert», änderbar; ohne Quelle keine Regel |
| Parallele Agenten kollidieren im Schema oder in den Grenzen | Datenverlust auf Geräten, gebrochene Builds | Schema-Ledger beim Kopf, eingefrorene Schritte, Pfadprüfung, `live/<ausgabe>` statt `main` als Production |
| Kundendaten auf privaten Handys (Adressen, Zugangscodes) | Missbrauch, Verlust, Pflichten nach DSG | Filter nach Rolle beim Senden, Zugang nur für den Tag, Ablauf des Profils, Datenblatt in der Sprache der Person |

Dazu, ohne eigene Zeile: Strategie im öffentlichen Repo (gegen: Regel 12.6, `rettich-intern`); schlechte Übersetzungen (gegen: Prüfung durch Muttersprachler:innen, «Vorschau»); Grösse des Vorab-Caches mit vielen Branchen (gegen: Branchen ausserhalb der Ausgabe erst beim Einschalten laden, messen).

---

## 16. Entscheide für Alban

Markierung wie im Randen-Masterplan: **[Geld]**, **[Server]**, **[Datenfluss]**, **[harte Regel]**.

| Nr. | Frage | Optionen | Empfehlung |
| --- | --- | --- | --- |
| S-1 | Produktmodell | (a) eine App «Onestrand» für alle; (b) eine eigene App je Branche; (c) eine Plattform, wenige Ausgaben nach Arbeitsweise, jede kann jede Branche, ein Betrieb lebt in einer Ausgabe | (c): Gemischte Betriebe behalten eine Kundschaft, ein Team, eine Rechnung; Branchen sprechen ihre Sprache im Einrichten und in den Wörtern |
| S-2 | Adressen der Ausgaben | (a) nach Produktname (`randen.onestrand.ch`); (b) nach Zweck (`gastro.onestrand.ch`, `vor-ort.onestrand.ch`); (c) Randen bleibt auf `workers.dev` | (b), und Randen bekommt seine Adresse vor dem ersten Pilot; Namen dürfen sich dann ändern, Adressen nie. Vorher prüfen, ob die Zone `onestrand.ch` bei Cloudflare liegt (sonst **[Geld]** nein, aber Arbeit) |
| S-3 | Namen der Ausgaben | (a) je Ausgabe ein Gemüse wie Rettich und Randen (ADR-0020, Frage 2); (b) Dachmarke und Arbeitsweise («Onestrand Gastro», «Onestrand Vor Ort»); (c) Randen bleibt, neue Ausgaben nach (b) | (b) für neue Ausgaben: Wer sich mit Digitalem schwer tut, erkennt am Wort, wofür die App ist. Randen nach Albans Wahl, aber vor dem ersten Pilot |
| S-4 | Repo und Code teilen | (a) Monorepo jetzt mit Randen; (b) Monorepo für Plattform und neue Branchen, Randen bekommt Kopien mit Stempel und zieht nach AP-12 um; (c) Repo je Branche mit Paket-Register | (b): neue Branchen starten sofort, Randens Pilot bleibt ungestört, Umzug des Codes ändert keine Adresse |
| S-5 | Erste neue Branche | (a) Reinigung und Hauswartung; (b) Maler und Gipser; (c) Umzug | (a): wiederkehrende Arbeit und Putzplan (Albans Beispiel), viele Ein-Personen-Betriebe, kleines rechtliches Risiko, prüft Objekte, Pläne, Teams und Monatsrechnungen; danach (b) |
| S-6 | Abgleich Büro ↔ Feld in Stufe 1 | (a) nur Kopplung im WLAN mit Vermittler (W15) und Papier; (b) dazu verschlüsselte Päckli über das Teilen-Menü; (c) gleich das Relais aus Stufe 2 | (b) **[Datenfluss]**: Die Person wählt den Weg, der Inhalt ist verschlüsselt, kein Server. (c) erst nach Pilot und E-24 **[Server]** **[Geld]** |
| S-7 | Sprachen | (a) nur de-CH bis nach dem Pilot (Randen E-25); (b) Arbeitsplatz der Mitarbeitenden ab Welle 3 in den Sprachen der Pilot-Teams, geprüft von Muttersprachler:innen, Büro de-CH; (c) alles mehrsprachig von Anfang an | (b): Der Arbeitsplatz ist klein, das Datenblatt muss verstanden werden. Prüfung durch Muttersprachler:innen kann **[Geld]** kosten |
| S-8 | Rechnungen und Zahlungen im Rückgrat | (a) Offerte und Rechnung mit QR-Zahlteil, Zahlungseingang aus der Bankdatei, Mahnung; (b) nur Rapport-Export, Rechnung macht ein anderes Programm oder die Treuhand; (c) Rechnung ohne Zahlungsabgleich | (a) als Vorsystem, nicht Buchhaltung: Geld hereinholen ist für kleine Dienstleister der wichtigste Nutzen; Datei-Import ist keine Anbindung (Randen E-18). Neue Abhängigkeit für den QR-Code nur permissiv |

Kleinere Entscheide trifft Claude selbst mit ADR (Alban kann jeden ändern): «Sie» in Dokumenten an Dritte (Abschnitt 9), `main` als Integration und `live/<ausgabe>` als Production (Abschnitt 12.5), Schema-Ledger beim Kopf (12.4), Ziele 56 px auf Arbeitsseiten im Feld (6.5), keine Preisvorschläge (11.3), Kundschaft nur so weit wie Auftrag und Rechnung (7.2). Offen bleiben aus Randen und gelten für die Suite mit: E-17 (`'wasm-unsafe-eval'` für den QR-Leser), E-22 (Lizenz und Modell, nicht hier), E-24 (Server), E-26 («du» oder «Sie»).

---

## 17. Annahmen und bewusst Ausgelassenes

**Annahmen (im Pilot zu prüfen):**

- Die meisten Zielbetriebe haben weniger als zehn Personen; die Chefin arbeitet mit; das Büro ist ein Handy oder ein Laptop.
- Teams in Handwerk und Unterhalt treffen sich oft morgens oder abends am selben Ort; Reinigungsteams am Abend seltener.
- Die Sprachen der Teams wie in Abschnitt 10.1.
- Ein Hotel bis 20 Personen kommt mit «Gastro» plus «Beherbergung» aus, bis eine eigene Ausgabe nötig ist.
- Safari hält die Kopplung im WLAN nur, solange beide Apps offen sind (ADR-0028, Punkt 3); im Feld ist das die Regel, nicht die Ausnahme. Darum Päckli und Papier.

**Bewusst nicht vorgeschlagen:**

- Kein Kundenportal, keine Online-Buchung, keine E-Rechnung über Netze: Daten gingen zu Dritten oder bräuchten einen Server und Anbindungen.
- Kein Standort beim Stempeln (ADR-0030, Punkt 8); QR am Objekt statt dessen.
- Kein Fotozwang beim Stempeln (Randen E-13).
- Keine Wetterdaten, keine Routenplanung aus dem Netz.
- Keine Lohnabrechnung, keine Buchhaltung, keine MWST-Abrechnung (Randen ADR-0023, Punkt 12; ADR-0029, Punkt 1).
- Keine Preise, kein Abo, keine Pakete in dieser Datei und in der App.

---

## 18. Belege im Code

| Aussage | Ort |
| --- | --- |
| Die Schnittstelle ist eine feste Summe der Module | `Randen/packages/core/src/contract/index.ts:24` (`CONTRACT_V1`), `:42` (`CONTRACT_FRAGMENTS`) |
| Use Cases fest zusammengesetzt | `Randen/packages/core/src/application/index.ts:25` |
| Command-Kit mit `commandId` und Transaktion | `Randen/packages/core/src/application/command.ts:97` (`runCommand`) |
| `commandId` an jedem Befehl | `Randen/packages/core/src/contract/operation.ts:40` |
| Scopes, die heute niemand prüft | `Randen/packages/core/src/contract/operation.ts:5` |
| Domain Event mit `actor` und `at` | `Randen/packages/core/src/contract/events.ts:10` |
| Alle Tabellen in einer festen Liste | `Randen/packages/core/src/ports/storage.ts:36` (`TABLE_SCHEMAS`) |
| Ein Gerät hält einen Betrieb, `purge` löscht alles | `Randen/packages/core/src/ports/storage.ts:104-112` |
| `syncFields` | `Randen/packages/core/src/model/primitives.ts:107` |
| Basiseinheiten nur g, ml, Stück | `Randen/packages/core/src/model/primitives.ts:20` |
| Betriebsarten, Funktionen, `modules` bis 20 | `Randen/packages/core/src/model/business.ts:7`, `:30`, `:49`, `:63` |
| Eine Rolle je Person | `Randen/packages/core/src/model/business.ts:80` |
| Bezeichnungen im Kern (TD-04) | `Randen/packages/core/src/domain/business-profiles.ts:87-89`, `Randen/packages/core/src/model/haccp.ts:22` |
| Reinigungsplan und Nachweis als Muster für Aufgaben | `Randen/packages/core/src/model/haccp.ts:58` (`HygieneTaskSchema`), `:71` (`HygieneCheckSchema`) |
| Format der Sicherung | `Randen/packages/core/src/modules/settings/contract.ts:15-16` |
| Routen fest zusammengesetzt | `Randen/apps/web/src/app/routes.tsx:26` |
| Navigation fest, mit `modules` je Eintrag | `Randen/apps/web/src/app/nav.ts:34`, `:50` |
| Funktionen auf dem Gerät | `Randen/apps/web/src/app/modules.ts:11` |
| Name der Datenbank `randen`, Dexie-Versionen | `Randen/apps/web/src/data/db.ts:25`, `:71`, `:80` |
| Gerätedaten mit Präfix `randen:` | `Randen/apps/web/src/app/view.ts:10`, `Randen/apps/web/src/features/settings/last-backup.ts:4` |
| Name im Manifest fest | `Randen/apps/web/vite.config.ts:47-48` |
| Erkennung der installierten iOS-App | `Randen/apps/web/src/ui/share-file.ts:58` |
| Test für «du» lehnt jedes «Sie» ab | `Randen/apps/web/src/app/messages.test.ts:39-45` |
| CSP nur `'self'`, Standort gesperrt | `Randen/apps/web/public/_headers:5`, `:9` |
| Cloudflare-Projekt `randen`, nur statische Dateien | `Randen/wrangler.jsonc` |
| Domain der Firma | `onestrand/site/CNAME` (`onestrand.ch`) |
| Grenzen der Schichten in ESLint | `Randen/eslint.config.js` (Abschnitte «packages/core must stay free of browser and Node APIs» und «Three layers») |

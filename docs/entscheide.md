# Entscheide für Alban

Was nur Alban entscheiden kann, mit Optionen und Empfehlung des Kopfs. Stand 24.11.2026. Bis zu einem Entscheid gilt die Empfehlung als Arbeitsannahme, ausser wo [Geld] oder [Datenfluss] steht: Dort geschieht nichts ohne Albans JA. Ein Entscheid wird hier mit Datum und Wortlaut eingetragen und in das betroffene ADR übernommen.

## Jetzt, vor Welle 0 und 1

### S-01 Wie viele Apps hat die Suite?

- (a) **Vier Ausgaben nach Arbeitsweise:** Gastro (Randen), «Vor Ort» (Reinigung, Hauswartung, Maler, Dach, Umzug, Haustechnik, Garten), «Haus» (Hotels, Ferienwohnungen), «Studio» (Coiffeur, Kosmetik, Fitness, Kurse). Jede Ausgabe kann jede Branche einschalten.
- (b) Eine App je Branche, jede mit eigener Marke.
- (c) Eine App «Onestrand» für alle.

**Empfehlung: (a).** Gemischte Betriebe sind häufig (Hauswartung mit Reinigung und Garten, Umzug mit Endreinigung, Hotel mit Restaurant), und ein Betrieb kann nur in einer App leben, weil die Daten an der Adresse hängen. Werbung darf trotzdem je Branche sprechen. Ob es später mehr Ausgaben werden, kostet wenig, solange keine Adresse im Pilot steht. Details: [`architektur.md`](architektur.md), Abschnitt 2.

### S-02 Wo liegt der Code?

- (a) **Monorepo `business-suite`** für Plattform, neue Branchen und Ausgaben; Randen bleibt vorerst in seinem Repo und bekommt die Plattform als gestempelte Kopie; Umzug von Randen später.
- (b) Ein Repo je Branche, Plattform als Kopie in jedem.
- (c) Randen zieht sofort ins Monorepo.

**Empfehlung: (a).** Plattform und Branchen ändern sich in einem Schritt, ein Bruch wird sofort rot, und Randens laufender Ausbau bleibt ungestört. (b) lädt jede Branche ein, ihre Kopie anzupassen; (c) hält den Küchenmonitor auf.

### S-03 Wer baut die allgemeinen Teile, die in Randens Masterplan stehen?

Gemeint sind Register (AP-1), Rollen und Rechte (AP-2), Zeit (AP-3 bis AP-6), Erinnerungen (AP-8), Dokument-Ansicht (AP-15), Kasse und Belege (AP-16) und Kopplung (AP-19).

- (a) **Randen baut sie plattformfähig** nach den Bauregeln in [`randen.md`](randen.md) (eigener Ordner, keine Gastro-Wörter, keine Importe aus Küchen-Modulen); die Suite übernimmt jedes Teil einmal und ist danach die Quelle.
- (b) Die Suite baut sie zuerst mit Vertrag; Randen übernimmt sie als Kopie.
- (c) Randen baut sie für die Küche; die Suite baut sie später neu.

**Empfehlung: (a)** für alles, woran Randen schon arbeitet oder als Nächstes arbeitet. Was nicht in Randens Plan steht (Kundschaft, Objekte, Aufträge, Rapporte, Rechnungen, Verträge, Termine, Kurse), baut die Suite. (c) gäbe zwei Kerne. Dafür bitte die Nachricht aus [`randen.md`](randen.md), Abschnitt 4, an die Randen-Sitzung weitergeben.

### S-04 Adressen unter onestrand.ch [vor dem ersten Pilot von Randen]

- (a) **Die DNS-Zone von onestrand.ch zu Cloudflare** (Gratis-Plan): bei Hostpoint die Nameserver umstellen, vorher E-Mail-Einträge (MX, SPF, autoconfig) und die Einträge für die Website übernehmen, DNSSEC vorher aus. Danach Unteradressen nach Zweck: `gastro.onestrand.ch` für Randen, später `vorort.`, `haus.`, `studio.onestrand.ch`.
- (b) Alles bleibt auf `<projekt>.<konto>.workers.dev`.
- (c) Unteradressen mit Markennamen (`randen.onestrand.ch`).

**Empfehlung: (a), mit Wörtern nach Zweck.** Eine Adresse lässt sich nach dem Pilot nicht mehr ändern, ohne dass jeder Betrieb mit seiner Sicherung umzieht; eine Marke schon. Laut Cloudflare-Doku braucht eine eigene Domain an einem Worker eine aktive Zone; vor dem Umzug prüft der Kopf das noch einmal und macht ihn mit dir am Bildschirm. Kostet nichts. Muss vor dem ersten Pilot von Randen fallen.

### S-05 Namen der Ausgaben und Marke [Geld bei der Marke]

- Bis zum Pilot einer Ausgabe gelten **Arbeitstitel** (Gastro, Vor Ort, Haus, Studio). Name und Symbol stehen vor ihrem ersten Pilot fest; die technischen Namen folgen nie der Marke.
- Muster: (a) beschreibende Namen unter der Dachmarke («Onestrand Vor Ort»), (b) ein Gemüse je Ausgabe wie Rettich und Randen, (c) frei je Ausgabe.
- **Empfehlung: (a)** für neue Ausgaben, weil das Wort sagt, wofür die App ist; Randen nach deiner Wahl, aber vor seinem ersten Pilot.
- **Onestrand als Marke** prüfen und anmelden lassen, bevor die Suite öffentlich auftritt: kostet Geld, nur auf dein Wort.

## Vor Welle 2 und 3

### S-06 Abgleich zwischen Büro und Aussendienst ohne Server [Datenfluss]

- (a) **Papier und PDF:** Einsatzblatt mit QR, Rapport auf Papier und als Foto zurück; jedes Gerät für sich; Sicherung als Datei.
- (b) **Kopplung im WLAN des Betriebs** auch für Einsätze, Rapporte, Zeit und Fotos: morgens im Werkhof die Mappe aufs Handy, abends die Befehle zurück. Erweitert W13 und W15 (heute nur Bons der Gastronomie).
- (c) dazu ein **verschlüsseltes Päckli** über das Teilen-Menü, wenn sich das Team selten trifft.
- (d) Relais über einen Server (Stufe 2) [Geld].

**Empfehlung: (a) ab Welle 1, (b) und (c) ab Welle 3 mit eigenem ADR und fester Liste der Datentypen, (d) nach den Zeichen aus dem Pilot.** Ohne (b) oder (c) ist ein Betrieb mit Team im Feld nur halb versorgt; das zeigt die Recherche bei Reinigung, Dach und Umzug übereinstimmend.

### S-07 Sprachen und Anrede [Geld bei der Prüfung]

- Struktur für mehrere Sprachen ab dem Fundament, Inhalte zuerst de-CH.
- **Arbeitsplatz der Mitarbeitenden** (Heute, Einsätze, Stempeln, Checkliste, Fotos, Meine Stunden, Datenblatt) in den Sprachen der Pilot-Teams ab Welle 3; Büro bleibt de-CH bis nach dem Pilot. Vorschlag: Portugiesisch, Italienisch, Albanisch, Bosnisch-Kroatisch-Serbisch, Spanisch, Türkisch, Tamil, Englisch; je Pilot die Sprachen, die das Team wirklich spricht.
- Übersetzungen beim Bauen; vor einem Pilot prüft eine Person mit dieser Muttersprache. Das kann Geld kosten.
- **Dokumente an Dritte** (Offerte, Rechnung, Rapport, Mängelmeldung an Verwaltungen): Die App sagt «du» zu dir; ein Brief an eine Verwaltung mit «du» wirkt falsch. Vorschlag: eigene Textkataloge für Dokumente an Dritte mit «Sie» oder ohne Anrede, mit eigenem Test.
- Anrede in Französisch und Italienisch (tu oder vous) vor der ersten Übersetzung.

**Empfehlung:** wie oben; «Sie» nur in Dokumenten an Dritte.

### S-08 Rechnungen als Vorsystem

- (a) **Offerten, Rechnungen mit QR-Zahlteil, Zahlungseingang von Hand oder aus einer Bankdatei, Mahnung**, ohne Buchhaltung und ohne Anbindung an eine Bank. Die Bankdatei lädt die Person selbst aus ihrem E-Banking.
- (b) Nur Offerten und Rechnungen als PDF, ohne Zahlungseingang.

**Empfehlung: (a).** Geld hereinholen ist für kleine Dienstleister der grösste Nutzen. Eine Datei zu lesen, die die Person selbst lädt, ist keine Anbindung (wie Randen E-18).

### S-09 Reihenfolge der Branchen

- (a) **Facility** (Reinigung, Hauswartung) zuerst, dann **Maler und Umzug**, dann **Gebäudehülle, Haustechnik und Holz, Garten**, dann **Termine und Fitness**, dann **Beherbergung**.
- (b) Nach deinen ersten Kunden ausserhalb der Gastronomie, wie bei Randen (W7).

**Empfehlung: (a), solange du keine ersten Kunden nennst.** Facility hat wiederkehrende Arbeit und Putzplan, viele kleine Betriebe, ein kleines Rechtsrisiko und prüft Objekte, Pläne, Teams und Monatsrechnungen. **Frage an dich:** Kennst du schon Betriebe ausserhalb der Gastronomie, die mitmachen würden? Dann richten wir die Reihenfolge nach ihnen.

### S-10 «Main zieht mit» in der Suite

- (a) Wie in Randen: Jeder grüne Stand geht direkt auf `main`, auch für die Plattform.
- (b) **Direkt auf `main` für Branchen und Doku; Plattform nur über PR** mit der CI aller Ausgaben; Production je Ausgabe aus `live/<ausgabe>`, erst ab ihrem Pilot.

**Empfehlung: (b).** `main` zieht weiter immer mit; nur was alle Ausgaben gleichzeitig trifft, bekommt einen Schritt mehr.

### S-11 Handys der Mitarbeitenden und Zugang zu Objekten der Kundschaft [Datenfluss]

Übernimmt deinen Entscheid W14 aus Randen für die Suite: private Handys ja, aber nur gefilterte Daten, mit Ablauf und Sperrliste. Neu für die Aussendienst-Branchen:

- **Tür- und Alarmcodes speichert keine Ausgabe**, nur Hinweise («Schlüssel 14, Kasten im Keller»).
- Schlüssel tragen auf dem Handy eine Nummer, nie eine Adresse.
- Angaben zum Objekt kommen nur für die eigenen Einsätze des Tages aufs Handy.

**Empfehlung:** so übernehmen. Ein verlorenes Handy darf keinem Haus der Kundschaft schaden.

## Später

| Nr. | Frage | Empfehlung |
| --- | --- | --- |
| S-12 | **Gesundheitsdaten** (Anamnese im Fitness, Kosmetik, Fusspflege) sind besonders schützenswert nach DSG [Datenfluss] | In Stufe 1 nicht erfassen, nur «Einschränkungen besprochen» mit Datum; erfassen erst nach einer Prüfung durch eine Fachperson |
| S-13 | **Lizenz** der Suite | proprietär wie Randen und Rettich; offen bleibt der Weg für später (Randen Masterplan, Abschnitt 7) |
| S-14 | **Stufe 2** für die Suite [Geld, Datenfluss] | erst nach dem Pilot einer Aussendienst-Branche entscheiden; Konten und Relais dann für alle Ausgaben gemeinsam auf `konto.onestrand.ch` |
| S-15 | **Wetterprognose** für Dach und Garten aus dem Netz [Datenfluss] | Stufe 1: Eintrag von Hand und Link auf eine Wetter-App; kein Standort verlässt das Gerät |
| S-16 | **Adresse an die Karten-App** übergeben für den Weg zur Baustelle [Datenfluss] | nur auf Tipp der Person, als Nebenwirkung eingetragen |
| S-17 | **Rechtliche Prüfung je Branche** vor dem Pilot (Lohn nach GAV, Vertragsrecht, Fristen) [Geld] | je Pilot einmal durch eine Fachperson; bis dahin «Vorbereitung für die Treuhand» und Richtwerte mit Quelle |
| S-18 | **Rechnungsformular für Zusatzversicherungen** in Fitness und Kursen (Hinweis aus der Recherche: ab 2027 ein vorgegebenes Format) | vor Welle 4 mit Quelle prüfen; keine Anbindung an Versicherungen |
| S-19 | **Kalenderdatei von Buchungsplattformen** in der Beherbergung: die Person lädt eine Datei selbst und lädt sie selbst hoch [Datenfluss nur beim Hochladen] | ja, ab Welle 5, nie automatisch abgeglichen; Hochladen tut die Person selbst |
| S-20 | **Gästemeldung elektronisch** an die Behörde (Beherbergung; der Bund plant eine elektronische Meldung) [Datenfluss] | in Stufe 1 nur Datei oder Druck, die der Betrieb selbst weitergibt; direkte Übermittlung erst nach eigenem Entscheid |
| S-21 | **Abgrenzung bestätigen:** Gesundheit mit Abrechnung an Versicherer, Kinderbetreuung, Treuhand selbst und grosses Bauhauptgewerbe bleiben ausserhalb der Suite | bestätigen; Grenzfälle (kosmetische Fusspflege, nicht-medizinische Massage) nur ohne Gesundheitsdaten ([`branchen/weitere.md`](branchen/weitere.md)) |
| S-22 | **Mitgliedskarte im Wallet des Handys** (Fitness, Kurse) braucht ein kostenpflichtiges Entwicklerkonto [Geld] | gedruckte oder geteilte Karte mit QR-Code genügt; Wallet erst mit S-05 (Stores) |

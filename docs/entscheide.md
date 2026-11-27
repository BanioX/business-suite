# Entscheide für Alban

Was nur Alban entscheiden kann, mit Optionen und Empfehlung des Kopfs. Stand 24.11.2026. Bis zu einem Entscheid gilt die Empfehlung als Arbeitsannahme, ausser wo [Geld] oder [Datenfluss] steht: Dort geschieht nichts ohne Albans JA. Ein Entscheid wird hier mit Datum und Wortlaut eingetragen und in das betroffene ADR übernommen.

## Jetzt, vor Welle 0 und 1

### S-01 Wie viele Apps hat die Suite?

- (a) **Vier Ausgaben nach Arbeitsweise:** Gastro (Randen), «Vor Ort» (Reinigung, Hauswartung, Maler, Dach, Umzug, Haustechnik, Garten), «Haus» (Hotels, Ferienwohnungen), «Studio» (Coiffeur, Kosmetik, Fitness, Kurse). Jede Ausgabe kann jede Branche einschalten.
- (b) Eine App je Branche, jede mit eigener Marke.
- (c) Eine App «Onestrand» für alle.

**Empfehlung: (a).** Gemischte Betriebe sind häufig (Hauswartung mit Reinigung und Garten, Umzug mit Endreinigung, Hotel mit Restaurant), und ein Betrieb kann nur in einer App leben, weil die Daten an der Adresse hängen. Werbung darf trotzdem je Branche sprechen. Ob es später mehr Ausgaben werden, kostet wenig, solange keine Adresse im Pilot steht. Details: [`architektur.md`](architektur.md), Abschnitt 2.

**Rückfrage Albans, 24.11.2026, wörtlich:** «Was empfiehlst du bezüglich Wartung Abgrenzung und monetarisierung orientiere dich an grosse wie microsoft suite / adobe / sap etc». Die Antwort zu Wartung und Abgrenzung steht in [`architektur.md`](architektur.md), Abschnitt 10; was Geld betrifft, steht nach [ADR-0011](adr/0011-oeffentliches-repo.md) nicht hier, sondern in Albans privater Ablage. S-01 bleibt offen bis zu Albans Antwort.

**Entscheid Claude nach Albans Freigabe, 24.11.2026** («Tu was du für richtig hältst»): (a), vier Ausgaben nach Arbeitsweise; Arbeitstitel bis zum Pilot jeder Ausgabe (S-05). Ob später eine Ausgabe für Werkstätten dazukommt, entscheidet sich mit dem Screening ([`branchen/weitere.md`](branchen/weitere.md)).

### S-02 Wo liegt der Code?

- (a) **Monorepo `business-suite`** für Plattform, neue Branchen und Ausgaben; Randen bleibt vorerst in seinem Repo und bekommt die Plattform als gestempelte Kopie; Umzug von Randen später.
- (b) Ein Repo je Branche, Plattform als Kopie in jedem.
- (c) Randen zieht sofort ins Monorepo.

**Empfehlung: (a).** Plattform und Branchen ändern sich in einem Schritt, ein Bruch wird sofort rot, und Randens laufender Ausbau bleibt ungestört.

**Entscheid Claude nach Albans Freigabe, 24.11.2026** («Tu was du für richtig hältst»): (a). Alban hat W0-01 im Repo business-suite gestartet. (b) lädt jede Branche ein, ihre Kopie anzupassen; (c) hält den Küchenmonitor auf.

### S-03 Wer baut die allgemeinen Teile, die in Randens Masterplan stehen?

Gemeint sind Register (AP-1), Rollen und Rechte (AP-2), Zeit (AP-3 bis AP-6), Erinnerungen (AP-8), Dokument-Ansicht (AP-15), Kasse und Belege (AP-16) und Kopplung (AP-19).

- (a) **Randen baut sie plattformfähig** nach den Bauregeln in [`randen.md`](randen.md) (eigener Ordner, keine Gastro-Wörter, keine Importe aus Küchen-Modulen); die Suite übernimmt jedes Teil einmal und ist danach die Quelle.
- (b) Die Suite baut sie zuerst mit Vertrag; Randen übernimmt sie als Kopie.
- (c) Randen baut sie für die Küche; die Suite baut sie später neu.

**Empfehlung: (a)** für alles, woran Randen schon arbeitet oder als Nächstes arbeitet. Was nicht in Randens Plan steht (Kundschaft, Objekte, Aufträge, Rapporte, Rechnungen, Verträge, Termine, Kurse), baut die Suite. (c) gäbe zwei Kerne. Dafür bitte die Nachricht aus [`randen.md`](randen.md), Abschnitt 4, an die Randen-Sitzung weitergeben.

**Entscheid Claude nach Albans Freigabe, 24.11.2026** («Tu was du für richtig hältst»): (a). Der Kopf hat die Nachricht am 24.11.2026 an die Randen-Sitzung geschickt.

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

### S-23 Erweiterbar von Haus aus: Werkzeug-Schnittstelle für Assistenten, Kommandozeile, Baukasten, Editor [Datenfluss beim Assistenten]

**Wunsch Albans, 25.11.2026, wörtlich:** «Ich hätte gerne von haus aus Mcp und CLI und SDK und IDE Anbindungen das es erweiterbar ist modular».

Was das Fundament dafür schon trägt (W0-01): Jede Operation der Schnittstelle hat einen Namen, eine technische Beschreibung, ihr Recht (`access`) und Schemas für Ein- und Ausgabe; `contractJsonSchemas` liefert daraus JSON Schema. Befehle sind über `commandId` gefahrlos wiederholbar. Der Speicher ist ein Port, dieselbe Logik läuft also auch ausserhalb des Browsers. Branchen, Tabellen, Einheiten und Fehlercodes melden sich in Registern an.

Was «von Haus aus» heisst, je Teil:

| Teil | Bedeutung | Stufe 1 möglich? |
| --- | --- | --- |
| **Baukasten (SDK)** | Ein typisierter Client, erzeugt aus der zusammengesetzten Schnittstelle (`client.customers.create(…)`), dazu die öffentlichen Einstiege der Plattform-Pakete (`defineIndustry`, `defineTable`, `command`) | ja, rein TypeScript |
| **Kommandozeile (CLI)** | Für den Bau: neue Branche anlegen, prüfen, stempeln. Für Daten: eine Sicherungsdatei prüfen, abfragen und als CSV oder JSON ausgeben, auf dem eigenen Rechner | ja; liest nur Dateien, die die Person selbst geladen hat |
| **Werkzeug-Schnittstelle für Assistenten (MCP)** | Aus jeder Operation entsteht ein Werkzeug mit Schema und Recht; ein lokaler Dienst stellt sie einem KI-Assistenten bereit | der Erzeuger ja; mit **echten Betriebsdaten** verlassen Daten das Gerät an den Anbieter des Assistenten |
| **Editor (IDE)** | Schemas für Manifeste und Register, damit der Editor prüft und ergänzt; Vorlagen und Generator; `api.md` je Paket | ja |

Optionen:

- (a) **Erzeugt statt gebaut:** Client, Kommandozeile und Werkzeug-Definitionen entstehen aus der zusammengesetzten Schnittstelle. Jede Branche bekommt sie ohne eigenen Code, sobald sie ihre Operationen anmeldet. Der Erzeuger kommt mit W0-02, die Kommandozeile für Sicherungsdateien mit Welle 1; der Assistent arbeitet zuerst nur mit dem Demo-Betrieb.
- (b) Wie (a), dazu der Assistent mit echten Betriebsdaten: nur lesen, je Betrieb ausdrücklich eingeschaltet und widerrufbar, heikle Tabellen ausgenommen, mit eigenem ADR und Eintrag im Register der Nebenwirkungen.
- (c) Später, nach dem ersten Pilot.

**Empfehlung: (a) jetzt, (b) als eigener Entscheid vor dem ersten Pilot.** (a) kostet wenig, weil die Schnittstelle schon alles trägt, und hält die Suite offen für Werkzeuge, ohne dass Daten das Gerät verlassen. (b) ist ein neuer Datenfluss und braucht dein JA mit Wortlaut.

**Nachfrage Albans, 25.11.2026, wörtlich:** «Respektive was davon realistisch ist da ich mich nicht auskenne». Einschätzung des Kopfs:

| Teil | Realistisch? | Begründung |
| --- | --- | --- |
| Modular und erweiterbar | ja, ist der Kern des Plans | Plattform, Branchen als Pakete, Register und Steckplätze |
| Baukasten | ja, fast ohne Mehraufwand | Die Agenten bauen jede Branche ohnehin damit |
| Kommandozeile | ja, klein | Anlegen und Prüfen einer Branche stehen schon in W0-02; das Lesen einer Sicherungsdatei ist ein kleiner Zusatz |
| Editor | nur der günstige Teil | Typen, Schemas und `api.md` genügen, solange Agenten bauen; eine eigene Erweiterung für einen Editor bringt wenig |
| Werkzeug-Schnittstelle für Assistenten | vorbereiten ja, als Funktion für Betriebe noch nicht | Die Daten liegen in der App auf dem Gerät, ein Assistent erreicht sie ohne Server nur über eine Sicherungsdatei; dazu gehen die Daten an den Anbieter des Assistenten. Sinnvoll erst mit Stufe 2 und eigenem Entscheid |

Grenzen, die bleiben: Erweiterungen sind Pakete, die mitgebaut werden, keine Plug-ins, die eine installierte App zur Laufzeit nachlädt (CSP nur `'self'`). Die Suite selbst baut weiterhin keine Anbindungen an Partner; die offene Schnittstelle ist die Tür, durch die ein Betrieb seine eigenen Werkzeuge anschliesst.

**Stand, 25.11.2026:** (a) ist nach [S-25](#s-25-freigabe-und-geld-was-ohne-rückfrage-geht) eingeplant: Auftrag [W0-04](auftraege/w0-04-offene-schnittstelle.md), Pakete P-14 bis P-17 in [`plattform.md`](plattform.md). (b) bleibt ein eigener Entscheid vor dem ersten Pilot.

### S-24 Sagen statt klicken: ein Assistent in der App [Geld, Datenfluss]

**Albans Bild, 25.11.2026, im Wortlaut gekürzt:** «Stell dir vor diese Leute haben wenig zeit alles durchzuklicken sondern sagen der KI oder sprechen mit ihr oder nehmen ein video auf […] wäre mein produkt mit AI enhanced in der lage, die betriebe zu entlasten […] oder nicht zeit haben alles selber zusammenzuklicken. Ein AI agent kann das in sekunden».

**Was das heisst:** Die Person sagt, tippt oder fotografiert, was war («Rapport Musterweg 12, drei Stunden zu zweit, Fenster, zwei Liter Reiniger»). Ein Assistent macht daraus Befehle der Schnittstelle und zeigt sie als Vorschlag; ein Tipp bestätigt. Er klickt nicht durch die Oberfläche, er ruft dieselben benannten Befehle wie die Oberfläche, mit Schema, Recht und `commandId`. Das ist schneller und prüfbarer als Durchklicken, und dafür ist das Fundament gebaut.

**Grundsätze, die für jeden Weg gelten:**

1. Der Assistent **schlägt vor, die Person bestätigt.** Was Dritte erhalten oder unterschreiben (Rechnung ausstellen, Rapport abschliessen), geschieht nie ohne ausdrückliche Bestätigung.
2. Er hat **die Rechte der Person**, die ihn nutzt, nie mehr; jede Handlung ist ein gewöhnlicher Befehl mit Ereignis und bleibt im Ledger nachvollziehbar und korrigierbar.
3. **Heikle Daten** (Löhne, Gesundheit, Zugangshinweise) sieht er nie; er bekommt nur, was die Aufgabe braucht.
4. Die App bleibt **ohne Assistent voll bedienbar** und klein: im Keller und auf dem Dach gibt es kein Netz. Eine Sprachnotiz darf warten, bis wieder Netz da ist.
5. Er **beurteilt nie** (Asbest, Lohn, Recht) und sagt, wenn er unsicher ist.

**Die Hürde:** Ein Modell, das Sprache, Text und Bilder zuverlässig in Befehle übersetzt, läuft heute nicht auf dem Gerät in einer installierten Web-App. Es braucht einen Dienst. Das kostet je Nutzung, und Betriebsdaten verlassen das Gerät an den Anbieter des Modells. Beides ändert Grundsätze der Stufe 1.

Optionen:

- (a) **Assistent über einen Dienst von Onestrand** (Stufe 2 vorgezogen): Text, Sprache und Foto; Video später. Braucht einen Server, einen Vertrag mit dem Anbieter (keine Nutzung der Daten zum Trainieren, Region), Einwilligung je Betrieb, eigenes ADR und Einträge im Register der Nebenwirkungen.
- (b) **Jetzt vorbereiten, ohne Kosten und ohne Datenfluss:** Werkzeug-Definitionen aus der Schnittstelle (S-23), ein Port für das Modell, die Vorschlags-Ansicht als Baustein der Oberfläche, Diktat über die Tastatur des Geräts; der Assistent wird zuerst nur am Demo-Betrieb vorgeführt.
- (c) Der Betrieb schliesst seinen eigenen Assistenten an (S-23, Option b).

**Empfehlung: (b) jetzt, (a) als Entscheid am Ende von Welle 1,** wenn die erste Branche steht und sich an echten Abläufen zeigen lässt, was der Assistent abnimmt. Was (a) kostet und wie es verrechnet wird, steht nach [ADR-0011](adr/0011-oeffentliches-repo.md) nicht hier, sondern in Albans privater Ablage. (c) ist für Betriebe, die sich auskennen, und kein Ersatz für (a).

**Stand, 25.11.2026:** (b) ist nach [S-25](#s-25-freigabe-und-geld-was-ohne-rückfrage-geht) eingeplant (Auftrag [W0-04](auftraege/w0-04-offene-schnittstelle.md)). (a) ist gewollt, sobald das Geschäft den Dienst trägt; der Kopf kommt dann mit Zweck und Betrag.

### S-25 Freigabe und Geld: was ohne Rückfrage geht

**Albans Wort, 25.11.2026:** «Also ich erlaube alles sofern zweckdienlich wenn ich ein scalable Business habe investiere ich gerne in server struktur usw. Weisst wie ich meine? Ich bin aktuell einfach noch Indie Entwickler».

**Albans Antwort auf die Lesart, 25.11.2026:** «Also du hast mein Ja praktisch zu allem habe aktuell einfach nicht die Möglichkeit die Kosten zu tragen aber so bauen das es geht kann man doch schon im voraus?»

**Lesart des Kopfs.** Die Regel «Freigabe» in `CLAUDE.md` (Arbeitsweise 5) bleibt im Wortlaut stehen; ändern kann sie nur Alban selbst. Bis dahin gilt bei einem Widerspruch die Regel in `CLAUDE.md`.

1. **Zweckdienlich und kostenlos:** wird ohne Rückfrage geplant und gebaut, auch grössere Ergänzungen des Plans. Darum sind S-23 (a) und S-24 (b) jetzt eingeplant: Auftrag [W0-04](auftraege/w0-04-offene-schnittstelle.md), Pakete P-14 bis P-17 in [`plattform.md`](plattform.md).
2. **Geld:** heute keine laufenden Kosten. Alles wird so gebaut, dass es ohne Server läuft und ein Server später nur eingesteckt wird (Ports für das Modell, das Relais, die Konten). Lohnt sich eine Ausgabe, kommt der Kopf mit Zweck und Betrag; der Betrag steht in Albans privater Ablage, nicht hier.
3. **Stufe 2** (Server, Konten, Relais, Assistent über einen Dienst) ist gewollt, sobald das Geschäft sie trägt. Sie ist eine Frage des Zeitpunkts, kein Tabu.
4. **Echte Betriebsdaten** verlassen ein Gerät weiterhin nur mit eigenem ADR, Eintrag im Register der Nebenwirkungen und einer Meldung an Alban vor dem Einschalten. Vor dem ersten Pilot gibt es keine echten Betriebsdaten.
5. **Im Voraus bauen:** Was später Geld kostet, wird jetzt als Anschluss gebaut und mit Platzhaltern getestet (Modell, Relais, Konten). Code kostet nichts, erst der Betrieb eines Dienstes. Nicht im Voraus beweisbar sind die Güte eines echten Modells bei echter Sprache, das Verhalten unter Last und die Kosten je Betrieb; das zeigt sich erst mit dem Dienst und wird dann gemessen.

### S-26 Bedienmuster: fünf Punkte unten, Einstellungen oben rechts

**Albans Vorgabe, 25.11.2026, gekürzt um Namen:** «[…] UI/UX. 5 Punkte unten. Einstellungen oben Rechts. Sie müssen für Nutzer die täglich […] nutzen einfach bedienbar sein weil sie dem bekannten muster folgen.» Gemeint sind die verbreiteten Heuristiken der Gebrauchstauglichkeit und das Muster der meistgenutzten Apps auf dem Handy.

**Was gilt, ab der ersten Oberfläche (W0-03):**

1. **Auf dem iPhone eine Leiste unten mit genau fünf Punkten**, mit dem Daumen erreichbar. Die Mitte ist «＋ Erfassen»: Foto, Rapport, Zeit, später auch Sagen ([S-24](#s-24-sagen-statt-klicken-ein-assistent-in-der-app-geld-datenfluss)). Vorschlag für die fünf: im Büro **Heute · Aufträge · ＋ · Kundschaft · Mehr**, für Mitarbeitende **Heute · Einsätze · ＋ · Stunden · Ich**. Die Rolle bestimmt die fünf; eine Branche füllt Steckplätze, fügt aber nie einen sechsten Punkt an. Was nicht in die fünf passt, liegt unter «Mehr».
2. **Einstellungen oben rechts**, als Zahnrad, auf «Heute» und auf «Mehr» oder «Ich».
3. **iPad und Web:** dieselben fünf Ziele, als Leiste an der Seite; Einstellungen ebenfalls oben rechts.
4. **Bekannte Muster ja, Sog nein.** Übernommen wird, was Leute schon können: Leiste unten, Mitte zum Erfassen, Zurück durch das System, Ziehen zum Aktualisieren nur wo es etwas zu holen gibt. Nicht übernommen wird, was Aufmerksamkeit bindet: endlose Listen ohne Ende, Zähler als Lockmittel, Lob und Serien. Das Zielbild bleibt «ruhig».
5. **Prüfliste für jeden Bildschirm** (die zehn Heuristiken, in eigenen Worten): Der Stand ist sichtbar. Die Wörter sind die der Branche. Jede Handlung lässt sich zurücknehmen oder abbrechen. Gleiches sieht gleich aus und folgt dem Gerät. Fehler werden verhindert, bevor sie gemeldet werden. Erkennen statt erinnern. Geübte kommen schneller ans Ziel. Nichts Überflüssiges auf dem Bildschirm. Eine Fehlermeldung sagt, was war und was jetzt geht. Hilfe steht dort, wo man sie braucht.

Passt zu den Grundsätzen aus Randen ([ADR-0009](adr/0009-grundsaetze-aus-randen.md): eine App für iPhone, iPad und Web, eine Hauptaktion pro Seite, Ziele 44 px) und zu den Prüfsteinen 2 und 5 im [Zielbild](zielbild.md) (unter zehn Sekunden, mit einer Hand). Eingetragen in den Auftrag [W0-03](auftraege/w0-03-oberflaeche.md).

### S-27 Farben der Ausgaben: der helle Ton von Onestrand

**Albans Vorgaben, 27.11.2026, wörtlich:** «Ich möchte vom UI Silber Weiss und helblaue akzente» und «Onestrand ist dagegen Premium Schwarz und blau es muss einen ton heller sein..».

**Lesart:** Die Dachmarke Onestrand ist Schwarz, Silber und Blau (Website, `BanioX/onestrand`, `site/assets/css/main.css`: Schwarz der Raum, Silber der Mensch, Blau die Maschine; Blau `#0a6cff`, Verlauf `#8dbdff` bis `#0a5bea`). Eine Ausgabe ist ihr heller Ton: Weiss und Silber statt Schwarz, dasselbe Blau eine Stufe heller. Der dunkle Modus einer Ausgabe ist Onestrand selbst.

**Was gilt** (Thema einer Ausgabe; die Plattform kennt nur neutrale Tokens wie `accent`, `surface`, W0-03 Schritt 1):

| Rolle | Hell | Dunkel |
| --- | --- | --- |
| Grund hinter der App | Silber `#e6e9ee` | Schwarz `#000000` |
| Grund der App | Silber, beleuchtet `#f4f6f9` | Nacht `#05070b` |
| Listen, Karten, Felder | Weiss `#ffffff` | `#10141b` |
| Flächen, die handeln oder markieren (Hauptknopf, «＋ Erfassen», abgehakt, gewählt) | helles Blau `#8dbdff`, Schrift Nachtblau `#061633` (9.3 zu 1) | Blau `#5aa2ff`, Schrift `#061633` (6.9 zu 1) |
| Blau als Schrift (Links, «Zurück», aktiver Punkt) | `#0a5bea` (5.7 zu 1 auf Weiss, 5.3 auf Silber) | `#8dbdff` (9.5 zu 1) |
| Ruhige Flächen (Kennzahlen in «Heute») | Verlauf Silber `#ffffff` bis `#e6e9ee` | `#161b23` bis `#0b0f15` |

Dazu: Bedeutungsfarben bleiben getrennt (Grün «in Ordnung», Bernstein «bald», Rot «falsch»; Blau heisst nie «gut» oder «schlecht»); Systemschrift wie bei Onestrand, keine fremden Schriften. Die Kontraste sind nach WCAG 2.2 gerechnet; die Kontrastprüfung von W0-03 bestätigt sie für jede Ausgabe. Angeschaut am Klickentwurf, Stand 27.11.2026. Eine andere Ausgabe (Gastro, Haus, Studio) darf ihr Blau verschieben, bleibt aber im hellen Ton von Onestrand, bis Alban anders entscheidet.

### S-28 Zeitstempeln gehört zum ersten Pilot

**Albans Vorgabe, 27.11.2026, wörtlich:** «Es muss auch Zeitstempeln drin haben.»

Steht im Plan: P-31 Team und Zeit ist für Facility ein **Muss** ([Steckbrief](branchen/facility.md), Abschnitt 5) und kommt mit Welle 2, vor dem Pilot. Was gilt:

1. **Kommen, Pause, Weiter, Gehen** mit einem Tipp, auf «Heute» für jede Rolle sichtbar, dazu unter «＋ Erfassen». Am Objekt geht es mit dem QR-Code schneller. **Nie ein Standort** (CLAUDE.md, harte Regeln).
2. **Zeit als Ledger:** Einträge werden nur angefügt; eine Korrektur ist eine neue Zeile mit Grund, die alte bleibt sichtbar (Kit `@onestrand/ledger`).
3. **Pflicht mit Quelle:** erfasst werden Beginn, Ende und Pausen ab 30 Minuten, aufbewahrt mindestens 5 Jahre (Art. 73 ArGV 1, [`fakten/arbeit-personal.md`](fakten/arbeit-personal.md), Abschnitt 1.3). Den Erfassungsmodus je Person (vollständig, vereinfacht, Verzicht) wählt der Betrieb; ob die Voraussetzungen erfüllt sind, beurteilt die App nicht.
4. Mitarbeitende sehen nur ihre eigenen Stunden, nie Löhne oder Stunden anderer.

Angeschaut am Klickentwurf, Stand 27.11.2026. Ob das Stempeln schon in Welle 1 vorgezogen wird, entscheidet der Kopf mit dem Auftrag W1-00; heute steht es in Welle 2.

## Vor Welle 2 und 3

### S-06 Abgleich zwischen Büro und Aussendienst ohne Server [Datenfluss]

- (a) **Papier und PDF:** Einsatzblatt mit QR, Rapport auf Papier und als Foto zurück; jedes Gerät für sich; Sicherung als Datei.
- (b) **Kopplung im WLAN des Betriebs** auch für Einsätze, Rapporte, Zeit und Fotos: morgens im Werkhof die Mappe aufs Handy, abends die Befehle zurück. Erweitert W13 und W15 (heute nur Bons der Gastronomie).
- (c) dazu ein **verschlüsseltes Päckli** über das Teilen-Menü, wenn sich das Team selten trifft.
- (d) Relais über einen Server (Stufe 2) [Geld].

**Empfehlung: (a) ab Welle 1, (b) und (c) ab Welle 3 mit eigenem ADR und fester Liste der Datentypen, (d) nach den Zeichen aus dem Pilot.**

**Entscheid Albans, 24.11.2026:** «Ja, ab Welle 3 mit ADR (Recommended)»: Kopplung im WLAN des Betriebs und verschlüsseltes Päckli für Einsätze, Rapporte, Stunden, Fotos und Mängel ab Welle 3, mit eigenem ADR und fester Liste der Datentypen; bis dahin Papier und PDF. Ein Relais über einen Server (d) bleibt offen. Ohne (b) oder (c) ist ein Betrieb mit Team im Feld nur halb versorgt; das zeigt die Recherche bei Reinigung, Dach und Umzug übereinstimmend.

### S-07 Sprachen und Anrede [Geld bei der Prüfung]

**Alban, 24.11.2026, wörtlich:** «Warum steht da Portugues ich finde es zwar bisschen rasistisch weil Viele portugiesen in dieser Branche arbeiten aber such gut weil ich an die Sprachen gar nicht gedacht habe … Ich würde gerne das sprachen Thema mitziehen». **Folge (Kopf):** Sprache ohne Zuschreibung ([ADR-0007](adr/0007-sprachen.md), Punkte 10 bis 14); der Arbeitsplatz der Mitarbeitenden kommt schon in Welle 2, vor dem ersten Pilot, in Deutsch, Französisch, Italienisch, Englisch und den Sprachen, die das Pilot-Team angibt. **Alban, 24.11.2026:** «Albanisch ist auch ganz gross in diesem Bereich»; Albanisch gehört darum zum Grundsatz. Offen bleiben: wer Übersetzungen prüft (kann Geld kosten), Anrede in Französisch und Italienisch, Anrede in Dokumenten an Dritte.

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

**Entscheid Albans, 24.11.2026:** «Facility zuerst (Recommended)». Die Reihenfolge danach gilt als Arbeitsannahme, bis Alban erste Kunden ausserhalb der Gastronomie nennt.

**Empfehlung: (a), solange du keine ersten Kunden nennst.** Facility hat wiederkehrende Arbeit und Putzplan, viele kleine Betriebe, ein kleines Rechtsrisiko und prüft Objekte, Pläne, Teams und Monatsrechnungen. **Frage an dich:** Kennst du schon Betriebe ausserhalb der Gastronomie, die mitmachen würden? Dann richten wir die Reihenfolge nach ihnen.

### S-10 «Main zieht mit» in der Suite

**Teilentscheid Albans, 24.11.2026:** Der Plan liegt auch auf `main` («Ja, auch auf main»); `main` und Arbeits-Branch stehen auf demselben Commit. Ob Plattform-Änderungen später über PR landen (b), bleibt offen.


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

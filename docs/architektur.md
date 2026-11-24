# Architektur der Onestrand Business Suite

Stand 24.11.2026, Entwurf des Kopfs, zur Bestätigung durch Alban. Die verbindlichen Einzelentscheide stehen in den [ADRs](adr/README.md), offene Fragen in [`entscheide.md`](entscheide.md). Drei unabhängige Entwürfe aus verschiedenen Blickwinkeln (viele Agenten parallel, Risiko und Migration, Produkt und Kundschaft) und eine Karte des Randen-Codes liegen als Hintergrund in [`hintergrund/`](hintergrund/README.md). Alle drei Entwürfe kamen im Kern zum selben Ergebnis; dieses Dokument hält es fest.

## 1. In einem Satz

**Eine Plattform, viele Branchen, wenige Ausgaben:** Die Plattform trägt alles, was jeder Betrieb hat (Betrieb, Personen, Rechte, Kundschaft, Objekte, Aufträge, Rapporte, Rechnungen, Zeit, Belege, Dokumente, Abgleich). Jede Branche ist ein Paket, das daran andockt (eigene Abläufe, Wörter, Vorlagen, Regeln). Eine **Ausgabe** ist eine installierbare App mit eigener Marke und eigener Adresse, zusammengesetzt aus Plattform und Branchen.

```
                ┌──────────────────────────────────────────────────────────────┐
 Ausgaben       │  Gastro (Randen)   Vor Ort        Haus          Studio        │  je eine Adresse,
 (installiert)  │  gastro.…          vorort.…       haus.…        studio.…      │  eine Datenbank,
                └───────┬───────────────┬──────────────┬──────────────┬────────┘  eine Marke
                        │               │              │              │
 Branchen       gastro  │  facility · painting · envelope · moving ·  lodging · salon · courses
 (Pakete)               │  building-services · carpentry · garden · chimney · pest-control
                        │               │              │              │
                ┌───────┴───────────────┴──────────────┴──────────────┴────────┐
 Plattform      │ Rückgrat: Betrieb · Personen · Rechte · Kundschaft · Objekte   │
 (@onestrand/*) │ Aufträge · Einsätze · Rapporte · Checklisten · Pläne · Zeit    │
                │ Offerten und Rechnungen · Kasse und Belege · Verträge und Mitgliedschaften │
                │ Termine · Kurse · Material · Fahrzeuge · Kopplung · Dokumente  │
                │ Fundament: Kern · Schnittstelle · Speicher · Ledger · Register │
                │ Sprachen · Sicherung · UI-Kit · Rahmen · Gerät · Werkzeuge     │
                └───────────────────────────────────────────────────────────────┘
```

## 2. Produktmodell: Plattform, Branche, Ausgabe

### 2.1 Begriffe

| Begriff | Was es ist | Beispiel |
| --- | --- | --- |
| **Plattform** | Gemeinsame Pakete `@onestrand/*` in `platform/`, ohne ein Wort einer Branche | Kundschaft, Rechnung mit QR-Zahlteil, Zeit-Ledger |
| **Branche** | Paket in `industries/<id>/` mit eigenen Abläufen, Tabellen, Vorlagen, Wörtern und Regeln, das an die Plattform andockt | `facility`: Leistungsverzeichnis, Schlüssel, Wohnungsabnahme |
| **Ausgabe** | Dünne App in `editions/<id>/`: Marke, Adresse, Datenbankname, Sicherungsformat, Haupt-Branchen, Vorschläge beim Einrichten | «Vor Ort» mit Reinigung, Hauswartung, Maler, Dach, Umzug, Garten |
| **Betrieb** | Die Firma, die eine Ausgabe nutzt; wählt beim Einrichten ihre Branche(n) und Funktionen | «Reinigung Muster GmbH» mit Reinigung und Hauswartung |

### 2.2 Warum Ausgaben und nicht eine App für alle oder eine App je Branche

- **Daten hängen an der Herkunft** (Schema, Host, Port; Randen-ADR-0020). Eine installierte PWA hat ihren eigenen Speicher; ein Betrieb lebt darum in genau einer Ausgabe. Zwei Apps für einen Betrieb hiessen zwei Kundenlisten, zwei Teams, zwei Rechnungsnummernkreise.
- **Gemischte Betriebe sind die Regel, nicht die Ausnahme:** Hauswartung mit Reinigung und Garten, Umzug mit Endreinigung und Räumung, Maler mit Gipser und Boden, Hotel mit Restaurant. Darum kann **jede Ausgabe jede Branche einschalten**; die Haupt-Branche bestimmt nur Wörter, Vorschläge und Marke.
- **Eine App für alle** würde das Einrichten für alle schwer machen, Randen müsste seine Herkunft wechseln, und jeder Fehler träfe jede Branche am selben Morgen.
- **Eine App je Branche** zerreisst gemischte Betriebe und vervielfacht Adressen, die vor jedem Pilot feststehen müssen.

### 2.3 Vorschlag: vier Ausgaben nach Arbeitsweise (Entscheid [S-01](entscheide.md))

| Ausgabe (Arbeitstitel) | Kennung | Haupt-Branchen | Arbeitsweise |
| --- | --- | --- | --- |
| **Gastro** (heute Randen) | `gastro` | Gastronomie, Lebensmittelhandwerk | Theke, Küche, Lager mit Ablauf, Hygiene |
| **Vor Ort** | `field` | Reinigung und Hauswartung, Maler und Gipser, Gebäudehülle, Umzug und Räumung, Haustechnik, Schreiner, Garten, Kaminfeger, Schädlingsbekämpfung | Arbeit am Objekt der Kundschaft, Büro am Abend, Aufträge, Rapporte, Rechnungen |
| **Haus** | `house` | Kleine Hotels, B&B, Ferienwohnungen, Gasthof mit Zimmern | Zimmer, Housekeeping, Gäste, Abgaben; Küche aus Gastro |
| **Studio** | `studio` | Coiffeur, Kosmetik, Fusspflege, Massage, Hundesalon, Fitness, Yoga, Kampfsport, Tanz, Musik- und Hundeschulen | Termine, Kurse, Mitgliedschaften, Theke |

Werbung und Website dürfen je Branche sprechen («die App für Malerbetriebe»); die Installation führt in die passende Ausgabe, und das Einrichten fragt nach der Branche. Ob es mehr Ausgaben werden (eine je Branche), entscheidet Alban; technisch kostet eine Ausgabe wenig, weil sie nur Konfiguration ist. Teuer ist nur das Ändern einer Adresse nach dem Pilot.

### 2.4 Marke, Name und Technik getrennt

- **Technische Namen folgen dem Zweck, nie der Marke:** Datenbank `field`, Speicher-Präfix `field:`, Sicherungsformat `field-backup`, Cloudflare-Projekt `field`. So kann Alban Marken ändern, ohne dass Betriebe umziehen.
- **Randen behält alles Technische, wie es ist:** Datenbank `randen`, Präfix `randen:`, Format `randen-backup`, Projekt `randen`. Nie umbenennen.
- **Adressen** nach Zweck unter `onestrand.ch` (Vorschlag `gastro.onestrand.ch`, `vorort.onestrand.ch`, `haus.onestrand.ch`, `studio.onestrand.ch`); jede Unteradresse ist eine eigene Herkunft. Ein späterer Passkey für `onestrand.ch` gilt auf allen Unteradressen ([ADR-0008](adr/0008-herkunft-namen-und-adressen.md), Entscheid [S-04](entscheide.md)).
- **Die Firma ist Absender, die Ausgabe führt:** «Vor Ort · von Onestrand» nur unter «Über …», auf onestrand.ch und in rechtlichen Texten. Nie direkte Links von einer Ausgabe in eine andere (iOS öffnet Safari mit leerem Speicher; Randen-ADR-0020).

## 3. Repo und Code

### 3.1 Ein Monorepo für Plattform, Branchen und Ausgaben ([ADR-0003](adr/0003-monorepo-und-gestempelte-kopie.md))

```
business-suite/
├── CLAUDE.md · AGENTS.md · README.md · LICENSE
├── docs/                 Plan, ADRs, Branchen, Fakten, Aufträge, Glossar        (Kopf)
├── registry/             names.json (Kennungen, Präfixe, Namensräume)          (Kopf)
│                         owners.json (Eigentum an Pfaden)
├── platform/             @onestrand/<paket>, je Paket rein TS und ./web          (Kopf, Plattform-Agenten)
├── industries/<id>/      core/ (rein TS) und web/ (React) je Branche           (Branchen-Agent)
│   └── muster/           Referenz-Branche: lebender Vertragstest der Plattform  (Kopf)
├── editions/<id>/        edition.ts, brand, public/, _headers, wrangler.jsonc,  (Kopf)
│                         schema-ledger, eingefrorene Sicherungen, e2e
├── services/vermittler/  Handschlag der Kopplung (nur mit Albans JA)            (Kopf)
└── tools/                check, ownership, names, stamp, new-industry           (Kopf)
```

- **Workspace (`workspace:*`)**: Jede Branche nutzt die Plattform von `main`; jede Plattform-Änderung läuft gegen alle Branchen und Ausgaben. Ein Bruch wird sofort rot.
- **Randen bleibt vorerst in seinem Repo** und baut ungestört weiter. Es bekommt Plattform-Pakete als **gestempelte Kopie** (`vendor/onestrand/<paket>` mit `STEMPEL.json`: Quelle, Commit, SHA-256 je Datei; ein Test bricht bei Änderung von Hand) nach dem erprobten Muster «erzeugt, nie von Hand ändern» aus Rettich. Der Umzug von Randen ins Monorepo ist ein späterer Entscheid ([S-03](entscheide.md), [`randen.md`](randen.md)).
- **Keine Git-Abhängigkeit und kein Paket-Register:** Ein Register würde proprietären Code veröffentlichen oder ein Token verlangen; eine Git-Abhängigkeit macht den Build von GitHub abhängig.
- **Rettich bekommt nie etwas** aus der Suite.

### 3.2 Pakete der Plattform

Den ganzen Katalog mit Inhalt, Herkunft und Welle führt [`plattform.md`](plattform.md). Die Schichten:

```
@onestrand/core ─ contract ─ storage ─ ledger ─ features ─ access ─ i18n        (rein TS, Fundament)
        │
Module (je «.» rein TS und «./web» React):
  business · customers · sites · catalog · jobs · plans · checks · calendar
  invoicing · books · team-time · contracts · scheduling · classes · stock · assets · pairing · today
        │
Browser: web-data (IndexedDB) · web-device (Teilen, Drucken, Kamera, QR, Unterschrift) · pdf
React:   ui (Kit, Tokens) ─ shell (Rahmen, Navigation, Arbeitsplätze, Hooks)
```

Regeln, durch ESLint und Tests erzwungen:

1. Rein-TS-Pakete importieren nie React, DOM oder Dexie.
2. Die Plattform importiert nie eine Branche; Branchen importieren einander nie.
3. Module der Plattform rufen einander nicht direkt auf; was sie verbindet, ist ein Port, den die Ausgabe einsteckt (Beispiel: Rapport liefert Positionen an die Rechnung über `InvoiceSource`).
4. `./web` nutzt `@onestrand/ui` und die Hooks der Shell, nie den Speicher direkt.
5. Jede Operation erklärt `access` (Funktion und Stufe); ein Test findet Operationen ohne.
6. Kein Text im rein-TS-Teil: Bezeichnungen leben in den Sprachkatalogen.

## 4. Wie eine Branche andockt ([ADR-0004](adr/0004-andocken-einer-branche.md))

Eine Branche liefert zwei Manifeste; die Ausgabe setzt daraus alles zusammen, was in Randen heute von Hand verdrahtet ist (Schnittstelle, Use Cases, Tabellen, Routen, Navigation).

```ts
// industries/facility/core: rein TypeScript, Skizze
export const facility = defineIndustry({
  id: 'facility',
  tables: [serviceSpecs, keys, keyMoves, defects, moveOuts],   // eigene Tabellen mit Präfix facility_
  contract: facilityContract,                                  // Operationen facility.<bereich>.<verb>
  useCases: (ctx, kits) => createFacilityUseCases(ctx, kits),  // nutzt Plattform-Kits, nie andere Branchen
  catalog: facilityFeatures,                                   // Einträge ins Register: Funktionen, Optionen, Rollen-Standard
  kinds: facilityKinds,                                        // Betriebsarten: facility.cleaning, facility.caretaking …
  setup: facilitySetupQuestions,                               // Fragen und Vorschläge beim Einrichten
  templates: facilityTemplates,                                // Leistungen ohne Ansätze, Checklisten, Rollen-Vorlagen
  ruleSets: facilityRuleSets,                                  // Regelwerke als Daten mit Quelle (z. B. GAV Reinigung)
  demo: facilityDemo,                                          // erfundener Demo-Betrieb
});

// industries/facility/web: React
export const facilityWeb = defineIndustryWeb({
  routes, nav, capture, today, sections, documents, workplaces, messages, lexicon,
});
```

- **Steckplätze** der Shell: Routen, Navigation, «＋ Erfassen», Karten in «Heute», Abschnitte auf Kundschaft, Objekt, Auftrag, Einsatz und Rapport, Zeilen auf Rapport und Rechnung, Dokument-Stile, Fragen beim Einrichten, Arbeitsplätze je Rolle, Erinnerungen, Monatspaket, Demo.
- **Namensräume:** Operationen `facility.keys.issue`, Tabellen `facility_keys`, Ereignisse `facility_key.issued`, Funktionen `facility.keys`, Speicherschlüssel und Rechte mit Präfix. Neue Kennungen trägt nur der Kopf in `registry/names.json` ein; ein Test findet doppelte oder fehlende.
- **Erweitern ohne fremde Felder:** Eine Branche legt eigene Tabellen an, die auf Plattform-Kennungen zeigen (`facility_service_specs.siteId`). Sie fügt nie Felder in Plattform-Tabellen ein. Plattform-Code liest Zeilen locker und ändert nur seine eigenen Felder, damit Zod keine fremden Felder still entfernt.
- **Konformität:** `pnpm check:industry <id>` prüft Vollständigkeit, Sprachtests, «ausgeschaltet heisst ohne Spur», Sicherung hin und zurück, Filter fürs Handy, Importgrenzen, Nebenwirkungen.

## 5. Gemeinsames Datenmodell ([ADR-0005](adr/0005-gemeinsames-datenmodell.md))

```
Betrieb ─┬─ Person ── Rollenprofil (je Betrieb, W16)
         ├─ Kundschaft ── Kontakt
         │      └─ Objekt (hierarchisch: Liegenschaft › Wohnung › Raum; Hotel › Etage › Zimmer)
         │             ├─ Bereich/Fläche · Anlage (Heizung, Dach, Lift) · Zugangshinweis (heikel)
         │             └─ Leistungsplan (Rhythmus) ──► Einsatz
         ├─ Leistung/Material (Katalog: Einheit, Ansatz in Rappen, Leistungswert als Richtwert)
         ├─ Auftrag (Status als Ledger; Preisart: Pauschal, Einheitspreis, Regie, Kostendach)
         │      ├─ Offerte ── Nachtrag
         │      ├─ Einsatz ── Rapport (gesperrt nach Unterschrift) ── Foto · Checkliste · Mangel
         │      └─ Abnahme ── Mangel ── Frist
         ├─ Rechnung (Nummernkreis, MWST je Satz, QR-Zahlteil) ── Zahlungseingang (Ledger) ── Mahnung
         ├─ Vertrag, Mitgliedschaft (Laufzeit, Verlängerung, Kündigung, Pause; erzeugt Rechnungen und Einsätze)
         ├─ Termin · Kurs ── Teilnahme
         ├─ Zeitbuchung (Ledger; optional Verweis auf Einsatz) · Abwesenheit · Monatsblatt
         ├─ Beleg (Bild als Datei mit Prüfsumme) · Kassenbuch (Ledger) · Monatspaket
         ├─ Checkliste (Vorlage, Wiederkehr, Durchgang mit Nachweis)
         └─ Material/Lager (Ledger) · Fahrzeug/Gerät (Fristen)
```

Grundsätze: Ledger für Geld, Zeit, Bestand und Status; gesperrt, was Dritte erhalten haben; eine Nummer vergibt immer nur ein Gerät (Rechnungen, Offerten, Kasse); Dateien als Blob mit Prüfsumme, nie als Data-URL in Zeilen; mehrere Betriebe je Gerät (W16, Punkt 4) ab dem Fundament.

## 6. Geräte und Abgleich Büro ↔ Aussendienst ([ADR-0006](adr/0006-geraete-und-abgleich.md))

Die neuen Branchen arbeiten draussen: im Keller, auf dem Dach, in der Wohnung der Kundschaft, oft ohne Netz. Das ist die grösste Spannung zu «Daten bleiben auf dem Gerät».

| Lage | Beispiel | Weg in Stufe 1 (ohne Server) |
| --- | --- | --- |
| L1 allein, ein Handy | Hauswart allein | kein Abgleich; Sicherung als Datei |
| L2 Handy und Laptop | Maler, Büro am Küchentisch | Kopplung zu Hause im WLAN |
| L3 Team trifft sich im Werkhof | Dachdecker, Reinigung mit Equipen | morgens Mappe aufs Handy, abends Befehle zurück, über die Kopplung im WLAN des Betriebs |
| L4 Team trifft sich selten | Reinigung mit verstreuten Objekten | verschlüsseltes Päckli über das Teilen-Menü; Papier mit QR |
| L5 ein Ort, mehrere Geräte | Coiffeur, Hotel, Imbiss | Kopplung im WLAN (Randen ADR-0028) |

- **Runter geht eine Mappe, rauf gehen Befehle:** Aufs Handy kommt eine nach Rolle gefilterte, nur lesbare Mappe (eigene Einsätze, nötige Angaben zu Objekt und Kundschaft, Checklisten) mit Ablaufdatum (W14). Zurück kommen Befehle mit `commandId` (Rapport, Zeit, Foto, Unterschrift), die das Hauptgerät prüft und idempotent ausführt. Stammdaten, Preise, Rechnungen und Nummernkreise schreibt nur das Hauptgerät; Handys fügen nur an. So gibt es keine Konfliktregel zu erfinden.
- **Ein Abgleich für alle:** Die Plattform baut genau einen Abgleich (`@onestrand/pairing`) mit dem Transport als Port (Kopplung im WLAN, verschlüsselte Datei, später Relais). Keine Branche baut einen eigenen.
- **Nie aufs Handy:** Löhne, Ansätze und Margen, Rechnungen anderer, Kasse, Tür- und Alarmcodes (nur Hinweise wie «Schlüssel 14, Kasten Keller»), Gesundheitsdaten.
- **Datenfluss braucht Albans JA:** Die Kopplung ist heute nur für Bons der Gastronomie erlaubt (Randen ADR-0028). Ihre Ausweitung auf Einsätze, Rapporte und Zeit sowie das verschlüsselte Päckli sind Entscheid [S-06](entscheide.md). Bis dahin trägt Papier: Einsatzblatt als PDF mit QR, Rapport auf Papier und als Foto zurück.
- **Stufe 2** (Relais mit Ende-zu-Ende-Verschlüsselung, Konten mit Passkeys auf `konto.onestrand.ch`, Mitteilungen) nur nach Albans JA (Randen ADR-0025). Die Aussendienst-Branchen werden das früher brauchen als die Gastronomie; der Pilot liefert die Zeichen.

## 7. Sprachen ([ADR-0007](adr/0007-sprachen.md))

- **Drei Achsen, getrennt gespeichert:** Sprache der Bedienung je Person (auf dem Gerät), Sprache der Dokumente je Kundschaft (sonst die des Betriebs), getippte Daten werden nie übersetzt.
- **Struktur ab dem Fundament, Inhalte später:** Je Paket ist `messages.ts` in de-CH die Quelle; Übersetzungen liegen als `messages.<sprache>.ts` mit gleichem Typ daneben. Fehlt ein Schlüssel, gilt de-CH, und der Texttest listet die Lücke.
- **Zuerst der Arbeitsplatz der Mitarbeitenden** (Heute, Einsätze, Stempeln, Checkliste, Fotos, Meine Stunden, Datenblatt nach DSG) in den Sprachen der Pilot-Teams. Typisch in Reinigung und Bau sind neben Deutsch Portugiesisch, Italienisch, Albanisch, Bosnisch-Kroatisch-Serbisch, Spanisch, Türkisch und Tamil (Annahme aus der Recherche, im Pilot zu prüfen). Das Büro bleibt de-CH bis nach dem Pilot.
- **Einfache Sprache und Symbole vor Übersetzung**; Sicherheitshinweise nie nur übersetzt, immer mit Bild.
- **Keine Übersetzung zur Laufzeit** über fremde Dienste. Übersetzt wird beim Bauen; vor einem Pilot prüft eine Person mit dieser Muttersprache (kann Geld kosten, [S-07](entscheide.md)).
- Romandie und Tessin später als ganze Sprache (fr-CH, it-CH) mit Fakten je Kanton.

## 8. Sicherung und Versionen

- Jede Ausgabe hat ihr Sicherungsformat (`randen-backup` bleibt); alte Fassungen bleiben immer lesbar. Die Sicherung trägt den Stand des Schemas je Modul.
- Je Ausgabe ein **Schema-Ledger** (nur anfügen): Branchen melden Tabellen, der Kopf vergibt beim Zusammenführen den Schritt. Eingefrorene Sicherungen jeder Version laufen in der CI.
- Plattform-Version als eine Nummer (lockstep, semver ab dem ersten Pilot einer Suite-Ausgabe); Operationen, Ereignisse und Register-Kennungen werden nur angefügt. Ein Bruch braucht ein ADR, eine Migration und den Test gegen alle eingefrorenen Sicherungen.

## 9. Was bewusst nicht gebaut wird

- Keine Buchhaltung: Die Suite ist **Vorsystem** für die Treuhand (Belege, Kassenbuch, Rechnungen, Zahlungen, Lohn-Vorbereitung als Dateien).
- Keine Lohnabrechnung mit Gewähr: Lohn-**Vorbereitung** mit Richtwerten und Quelle.
- Keine Anbindungen: kein E-Banking, keine Lastschrift, keine Buchungsplattformen, keine Zutrittssysteme, keine Krankenkassen-Schnittstellen.
- Keine Beurteilung von Gefahren (Asbest, Absturz) und keine Rechtsberatung: Die App erinnert und dokumentiert.
- Keine Gesundheitsberufe (Physio, Spitex, Praxen) und keine Kinderbetreuung ([`branchen/weitere.md`](branchen/weitere.md)).

## 10. Wartung und Abgrenzung

Antwort auf Albans Rückfrage vom 24.11.2026 ([S-01](entscheide.md)), soweit sie Technik betrifft; was Geld betrifft, steht nach [ADR-0011](adr/0011-oeffentliches-repo.md) nicht im öffentlichen Repo.

### 10.1 Wartung: ein Produkt, das gepflegt wird, nicht zehn

1. **Ausgaben sind Konfiguration, nicht Code.** Alle Ausgaben bauen aus demselben Stand von `main`: eine Version der Plattform, eine Testmatrix, ein Weg für Fehlerbehebungen. Eine neue Ausgabe kostet eine Adresse, einen Namen und eine Zeile in der CI, keinen eigenen Code.
2. **Wenige Ausgaben, viele Branchen.** Jede Ausgabe ist eine Adresse, die nie mehr ändern darf, und eine Zeile mehr in jeder Prüfung. Darum Ausgaben nach Arbeitsweise; Branchen dürfen dagegen zahlreich sein, weil sie Pakete auf derselben Plattform sind.
3. **Kanäle für Updates:** `main` ist Vorschau; jede Ausgabe mit Pilot bekommt `live/<ausgabe>`, den der Kopf nach dem Anschauen der Vorschau nachzieht. Installierte Apps aktualisieren sich selbst; ein Fehler darf nie alle Betriebe am selben Morgen treffen ([S-10](entscheide.md)).
4. **Jahrespflege der Regelwerke:** Der grösste laufende Aufwand liegt nicht im Code, sondern in Daten mit Gültigkeit: MWST-Sätze (Abstimmung vom 29.11.2026), Jahrespaket der Sozialversicherungen, Mindestlöhne der GAV, Feiertage je Kanton, Kurtaxen, Intervalle der Kaminfeger. Jeden Januar und nach jeder Abstimmung prüft ein Fakten-Agent die Liste in [`fakten/`](fakten/README.md) und führt die Regelwerke nach; die App zeigt, ab wann ein Wert gilt.
5. **Rückwärts lesbar:** Schemas werden nur angefügt; jede Sicherung jeder Version lässt sich zurückholen (eingefrorene Sicherungen in der CI).
6. **Plattform vor Branche:** Die Regel der zwei verhindert, dass zehn Branchen zehn Rechnungen, zehn Zeiterfassungen und zehn Abgleiche bauen. Ein Fehler in der Rechnung wird einmal behoben.
7. **Wenige, freie Abhängigkeiten:** nur permissive Lizenzen, wöchentliche Updates mit grüner CI, Lizenzhinweise in der App.

### 10.2 Abgrenzung: wo die Suite aufhört

| Grenze | Diesseits (Suite) | Jenseits |
| --- | --- | --- |
| Zwischen Ausgaben | ein Betrieb lebt in einer Ausgabe; Nachbar-Branchen einschaltbar | zwei Firmen einer Person nutzen zwei Betriebe auf demselben Gerät oder zwei Ausgaben |
| Zwischen Rückgrat und Branche | Rückgrat in jeder Ausgabe: Betrieb, Personen, Rechte, Kundschaft, Objekte, Aufträge, Rechnungen, Zeit, Belege, Dokumente, Sichern | Abläufe, Wörter, Vorlagen und Regeln einer Branche |
| Zwischen Suite und Partnern | Vorsystem: erfassen, vorbereiten, als Datei weitergeben (Monatspaket, Bankdatei, Kalenderdatei, Meldedatei) | Buchhaltung und Lohnabrechnung (Treuhand), Banken, Buchungsplattformen, Versicherer, Behörden-Schnittstellen |
| Zwischen Stufe 1 und Stufe 2 | alles, was auf dem Gerät und im WLAN des Betriebs läuft | was einen Server braucht: Abgleich über Netze, Konten, Online-Buchung und Seiten für Kundschaft, Mitteilungen, Sicherung im Netz, mehrere Standorte; die neutrale Nahtstelle ist das Feld `availability` im Register (Randen-ADR-0022) |
| Zwischen Erinnern und Beurteilen | Fristen, Richtwerte, Nachweise, Hinweise mit Quelle | Rechtsberatung, Beurteilung von Asbest, Absturz, Lohn, AHV-Status |
| Pflichten | Arbeitszeit, Aufbewahrung, Selbstkontrolle, Sicherheit, Sichern, Exportieren und Löschen sind immer und überall verfügbar | nie hinter einer Schranke |

# Branche Haustechnik und Holz: Elektro, Sanitär, Heizung, Schreiner, Zimmerei (`building-services`, `carpentry`)

- **Rolle:** Branchen-Agent
- **Voraussetzung:** W0-01, W0-02, W0-03 und W1-00 fertig; dazu je Paket die Plattform-Pakete in der Tabelle unten, mindestens mit Vertrag «alpha»
- **Welle:** W3 (Service-Teil Sanitär, Heizung, Elektro zuerst; Schreinerei und Zimmerei danach)

## Ziel

Ein Haustechnik-Betrieb (Sanitär, Heizung, Elektro) mit 1 bis 20 Personen arbeitet in der Ausgabe «Vor Ort» vom Anruf bis zur bezahlten Rechnung: Anlagen beim Objekt mit Wartungsintervall, Störung und Tagesliste, Regierapport mit Material aus dem Fahrzeuglager und Unterschrift, Rechnung mit QR-Zahlteil am selben Abend, Wartungsverträge mit wiederkehrender Rechnung, Nachweise nach NIV oder für die Gebäudetechnik. Danach folgen Schreinerei und Zimmerei mit Werkstatt, Stückliste und Holzliste.

## Lesestoff

1. `CLAUDE.md`, `AGENTS.md`, [`../zusammenarbeit.md`](../zusammenarbeit.md)
2. Steckbrief [`../branchen/haustechnik-holz.md`](../branchen/haustechnik-holz.md), verbindlich, ganz; Abschnitt 12 enthält Ziel und Abnahme jedes Pakets
3. Recherche [`../branchen/haustechnik-holz-recherche.md`](../branchen/haustechnik-holz-recherche.md), nicht verbindlich; für Einzelheiten und Quellen
4. [`../plattform.md`](../plattform.md) (auch «Anträge aus den Steckbriefen»), [`../architektur.md`](../architektur.md), Abschnitte 4 bis 7
5. ADRs [0004](../adr/0004-andocken-einer-branche.md), [0005](../adr/0005-gemeinsames-datenmodell.md), [0006](../adr/0006-geraete-und-abgleich.md), [0007](../adr/0007-sprachen.md), [0009](../adr/0009-grundsaetze-aus-randen.md), [0010](../adr/0010-rechnungen-als-vorsystem.md), [0011](../adr/0011-oeffentliches-repo.md); offene Fragen in [`../entscheide.md`](../entscheide.md)
6. [`../fakten/`](../fakten/README.md) und die `api.md` jedes Plattform-Pakets, das ein Paket braucht
7. `industries/muster/` als Vorbild für Manifeste und Steckplätze
8. Nur als Muster für Texte, Screens und Lektionen: Randen (`BanioX/Randen`, nur lesen) `docs/regeln.md`, `docs/design.md`, `docs/lernbuch.md`

## Pfade

- **Schreiben:** `industries/building-services/` und später `industries/carpentry/` (je `core/`, `web/`, `NAMES.md`); `docs/branchen/haustechnik-holz.md` (nur Abschnitt 9 «geprüft am» und Abschnitt 16 «Stand»); `docs/branchen/haustechnik-holz/adr/BSV oder CRP-NNNN-<titel>.md` (eigene ADRs); `docs/branchen/haustechnik-holz/antraege.md` (Plattform-Anträge)
- **Nur lesen:** `docs/branchen/haustechnik-holz-recherche.md`, `platform/`, `editions/`, `registry/`, `industries/muster/`, übriges `docs/`, `BanioX/Randen`
- **Tabu:** `platform/`, `editions/`, `registry/` (neue Kennungen als Vorschlag in `NAMES.md` der eigenen Branche; der Kopf trägt ein), `tools/`, Wurzel-Konfiguration, `pnpm-lock.yaml` und neue Abhängigkeiten (nur per Plattform-Antrag), andere Branchen unter `industries/`, Randen, Rettich

## Pakete in dieser Reihenfolge

Ein Paket ist fertig, wenn seine Abnahme aus dem Steckbrief, Abschnitt 12, erfüllt ist und `pnpm check` sowie `pnpm check:industry <kennung>` grün sind. Fehlt ein Plattform-Paket, wartet das Paket oder arbeitet hinter einem Port mit einfacher Umsetzung und Plattform-Antrag ([`../zusammenarbeit.md`](../zusammenarbeit.md), Abschnitt 5). Nie eine eigene Fassung von etwas bauen, das die Plattform hat oder gerade baut.

| Paket | Braucht (Welle) |
| --- | --- |
| B-1 Gerüst Haustechnik, Einrichten | W0-02, W0-03, P-21 (W1-01), P-24 (W1-03) |
| B-2 Anlagen und Wartungsplan | P-23 Anlagen (W1-02), P-26 (W1-05), P-28 (W1-06) |
| B-3 Störung und Tagesliste | P-22, P-23 (W1-02), P-25 Einsatz (W1-04) |
| B-4 Regierapport und Fahrzeuglager | P-25 Rapport (W1-04), P-41 Material und Lager (W3), P-10 Unterschrift |
| B-5 Rechnung und Artikel-Import | P-29 (W2), P-24 |
| B-6 Wartungsverträge | P-51 Kern (W2), P-29 |
| B-7 Pikett, Stunden, Regelwerk | P-31 (W2) |
| B-8 Nachweise Elektro | P-27 (W1-05), P-28 |
| B-9 Nachweise Gebäudetechnik | P-27, P-28 |
| B-10 Projekt und Abrechnung | P-25 Nachtrag und Abnahme, P-29 Akonto |
| B-11 Holz: Werkstatt, Stückliste | P-24, P-25, P-41 |
| B-12 Holz: Holzliste, Aufrichte | P-24, P-25 |

**MVP:** B-1 bis B-6. **Vor dem Pilot:** B-7 und je Betriebsart B-8 oder B-9. **Danach:** B-10; Kopplung nach [S-06](../entscheide.md); Sprachen nach [S-07](../entscheide.md); dann B-11 und B-12 für `carpentry` (eigener Generator-Lauf `pnpm industry:new carpentry`, ADR-Präfix `CRP`).

## Testweg

`pnpm check` bis `ALL=GREEN`; `pnpm check:industry <kennung>`; E2E mit axe in iPhone 390 px, iPad 820 px, iPad 1180 px und Web 1440 px, hell und dunkel; der Demo-Betrieb aus Abschnitt 13 des Steckbriefs zeigt jedes Paket; Vorschaubilder (`pnpm preview:shots`) für Alban bei jeder sichtbaren Änderung; mindestens ein Durchgang ohne Netz.

## Stopp-Regeln

Anhalten und melden, statt weiterzumachen, wenn ein Schritt Geld kostet, Daten neu das Gerät verlassen würden (auch Kopplung und Päckli vor Albans JA zu [S-06](../entscheide.md)), eine Datei ausserhalb der eigenen Pfade geändert werden müsste, eine Rechts- oder Geldregel ohne Quelle nötig wäre, eine Kennung, ein Datenbankname oder eine Adresse umbenannt werden müsste, die App etwas beurteilen statt erinnern und dokumentieren müsste, oder `main` nach dem Push rot ist.

## Bericht

Je Paket: was gebaut ist, Abnahme erfüllt (mit Testnamen), Vorschaubilder, Plattform-Anträge, eigene ADRs, Schulden, offene Fragen an Alban mit S-Nummer.

## Stand

offen

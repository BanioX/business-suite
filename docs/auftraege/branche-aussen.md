# Branche Garten, Kaminfeger und Schädlingsbekämpfung (`garden`, `pest-control`, `chimney`)

- **Rolle:** Branchen-Agent
- **Voraussetzung:** W0-01, W0-02, W0-03 und W1-00 fertig; dazu je Paket die Plattform-Pakete in der Tabelle unten, mindestens mit Vertrag «alpha»
- **Welle:** W3 (Gartenunterhalt zuerst, dann Schädlingsbekämpfung, Kaminfeger zuletzt)

## Ziel

Ein Gartenbaubetrieb mit 1 bis 20 Personen führt in der Ausgabe «Vor Ort» seinen Gartenunterhalt: Gartenaufnahme ohne Netz, Pflegeplan mit Saisonfenstern, Wochenplan mit Verschieben bei Wetter, Gartenrapport mit Grüngut und Unterschrift, Rechnung aus Rapporten und Pauschale mit QR-Zahlteil, Nachweise zu Sicherheit und Pflanzenschutz. Danach führen Schädlingsbekämpfung (Kontrollvertrag, Stationsplan, Kontrollbericht) und Kaminfeger (Anlagenregister, Tour, Voranmeldung) dieselben Plattform-Module weiter.

## Lesestoff

1. `CLAUDE.md`, `AGENTS.md`, [`../zusammenarbeit.md`](../zusammenarbeit.md)
2. Steckbrief [`../branchen/aussen.md`](../branchen/aussen.md), verbindlich, ganz; Abschnitt 12 enthält Ziel und Abnahme jedes Pakets
3. Recherche [`../branchen/aussen-recherche.md`](../branchen/aussen-recherche.md), nicht verbindlich; für Einzelheiten und Quellen
4. [`../plattform.md`](../plattform.md) (auch «Anträge aus den Steckbriefen»), [`../architektur.md`](../architektur.md), Abschnitte 4 bis 7
5. ADRs [0004](../adr/0004-andocken-einer-branche.md), [0005](../adr/0005-gemeinsames-datenmodell.md), [0006](../adr/0006-geraete-und-abgleich.md), [0007](../adr/0007-sprachen.md), [0009](../adr/0009-grundsaetze-aus-randen.md), [0010](../adr/0010-rechnungen-als-vorsystem.md), [0011](../adr/0011-oeffentliches-repo.md); offene Fragen in [`../entscheide.md`](../entscheide.md)
6. [`../fakten/`](../fakten/README.md) und die `api.md` jedes Plattform-Pakets, das ein Paket braucht
7. `industries/muster/` als Vorbild für Manifeste und Steckplätze
8. Nur als Muster für Texte, Screens und Lektionen: Randen (`BanioX/Randen`, nur lesen) `docs/regeln.md`, `docs/design.md`, `docs/lernbuch.md`

## Pfade

- **Schreiben:** `industries/garden/`, später `industries/pest-control/` und `industries/chimney/` (je `core/`, `web/`, `NAMES.md`); `docs/branchen/aussen.md` (nur Abschnitt 9 «geprüft am» und Abschnitt 16 «Stand»); `docs/branchen/aussen/adr/OUT-NNNN-<titel>.md` (eigene ADRs); `docs/branchen/aussen/antraege.md` (Plattform-Anträge)
- **Nur lesen:** `docs/branchen/aussen-recherche.md`, `platform/`, `editions/`, `registry/`, `industries/muster/`, übriges `docs/`, `BanioX/Randen`
- **Tabu:** `platform/`, `editions/`, `registry/` (neue Kennungen als Vorschlag in `NAMES.md` der eigenen Branche; der Kopf trägt ein), `tools/`, Wurzel-Konfiguration, `pnpm-lock.yaml` und neue Abhängigkeiten (nur per Plattform-Antrag), andere Branchen unter `industries/`, Randen, Rettich

## Pakete in dieser Reihenfolge

Ein Paket ist fertig, wenn seine Abnahme aus dem Steckbrief, Abschnitt 12, erfüllt ist und `pnpm check` sowie `pnpm check:industry <kennung>` grün sind. Fehlt ein Plattform-Paket, wartet das Paket oder arbeitet hinter einem Port mit einfacher Umsetzung und Plattform-Antrag ([`../zusammenarbeit.md`](../zusammenarbeit.md), Abschnitt 5). Nie eine eigene Fassung von etwas bauen, das die Plattform hat oder gerade baut.

| Paket | Braucht (Welle) |
| --- | --- |
| B-1 Gerüst `garden`, Einrichten, Vorlagen | W0-02, W0-03, P-21 (W1-01), P-24 (W1-03) |
| B-2 Gartenaufnahme | P-23 (W1-02), P-25 Ausmass (W1-04), P-33 (W1-06) |
| B-3 Pflegeplan und Saison | P-26 Saisonfenster (W1-05), P-51 Kern (W2) |
| B-4 Wochenplan, Wetter, Tour | P-25 Einsatz, P-26, P-28 (W1-06) |
| B-5 Gartenrapport und Grüngut | P-25 Rapport, P-27 Entsorgungsnachweis, P-10 Unterschrift |
| B-6 Abrechnung Garten | P-29 (W2), P-51 |
| B-7 Sicherheit, Pflanzenschutz, Neophyten | P-27 (W1-05) |
| B-8 Neuanlage | P-25 Ausmass, Nachtrag und Abnahme, P-29 |
| B-9 Gerüst `pest-control`, Kontrollvertrag, Stationsplan | P-23, P-51 |
| B-10 Kontrollgang und Kontrollbericht | P-27, P-11 |
| B-11 Gerüst `chimney`, Anlagenregister | P-23 Anlagen, P-26, P-28 |

**MVP:** B-1 bis B-6 (Gartenunterhalt). **Vor dem Pilot:** B-7. **Danach:** B-8; dann B-9 und B-10 für `pest-control` und B-11 für `chimney` mit eigenem Generator-Lauf; Wetterprognose aus dem Netz nur nach [S-15](../entscheide.md); Kopplung nach [S-06](../entscheide.md). Kantonale Intervall-Vorlagen der Kaminfeger nur mit Quelle je Kanton; sonst leer ausliefern («Intervall fehlt»).

## Testweg

`pnpm check` bis `ALL=GREEN`; `pnpm check:industry <kennung>`; E2E mit axe in iPhone 390 px, iPad 820 px, iPad 1180 px und Web 1440 px, hell und dunkel; der Demo-Betrieb aus Abschnitt 13 des Steckbriefs zeigt jedes Paket; Vorschaubilder (`pnpm preview:shots`) für Alban bei jeder sichtbaren Änderung; mindestens ein Durchgang ohne Netz.

## Stopp-Regeln

Anhalten und melden, statt weiterzumachen, wenn ein Schritt Geld kostet, Daten neu das Gerät verlassen würden (auch Kopplung und Päckli vor Albans JA zu [S-06](../entscheide.md)), eine Datei ausserhalb der eigenen Pfade geändert werden müsste, eine Rechts- oder Geldregel ohne Quelle nötig wäre, eine Kennung, ein Datenbankname oder eine Adresse umbenannt werden müsste, die App etwas beurteilen statt erinnern und dokumentieren müsste, oder `main` nach dem Push rot ist.

## Bericht

Je Paket: was gebaut ist, Abnahme erfüllt (mit Testnamen), Vorschaubilder, Plattform-Anträge, eigene ADRs, Schulden, offene Fragen an Alban mit S-Nummer.

## Stand

offen

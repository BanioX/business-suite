# Branche Hotellerie und kleine Beherbergung (`lodging`)

- **Rolle:** Branchen-Agent
- **Voraussetzung:** W0-01, W0-02, W0-03 und W1-00 fertig; dazu je Paket die Plattform-Pakete in der Tabelle unten, mindestens mit Vertrag «alpha»
- **Welle:** W5 (Hotel ohne Restaurant früher möglich)

## Ziel

Ein Hotel garni, ein Gasthof mit Zimmern oder ein B&B bis 20 Zimmer führt in der Ausgabe «Haus» seinen Betrieb ohne Netz: Belegungsplan ohne Doppelbuchung, Gästeregister mit Meldeschein und Datei für den kantonalen Meldeweg, Gästerechnung mit den richtigen MWST-Sätzen und getrennter Kurtaxe, Tagesliste der Hauswirtschaft ohne Gästenamen, Kurtaxe und Statistik am Monatsende, Team und Zeit nach L-GAV, Kasse und Monatspaket.

## Lesestoff

1. `CLAUDE.md`, `AGENTS.md`, [`../zusammenarbeit.md`](../zusammenarbeit.md)
2. Steckbrief [`../branchen/beherbergung.md`](../branchen/beherbergung.md), verbindlich, ganz; Abschnitt 12 enthält Ziel und Abnahme jedes Pakets
3. Recherche [`../branchen/beherbergung-recherche.md`](../branchen/beherbergung-recherche.md), nicht verbindlich; für Einzelheiten und Quellen
4. [`../plattform.md`](../plattform.md) (auch «Anträge aus den Steckbriefen»), [`../architektur.md`](../architektur.md), Abschnitte 4 bis 7
5. ADRs [0004](../adr/0004-andocken-einer-branche.md), [0005](../adr/0005-gemeinsames-datenmodell.md), [0006](../adr/0006-geraete-und-abgleich.md), [0007](../adr/0007-sprachen.md), [0009](../adr/0009-grundsaetze-aus-randen.md), [0010](../adr/0010-rechnungen-als-vorsystem.md), [0011](../adr/0011-oeffentliches-repo.md); offene Fragen in [`../entscheide.md`](../entscheide.md)
6. [`../fakten/`](../fakten/README.md) und die `api.md` jedes Plattform-Pakets, das ein Paket braucht
7. `industries/muster/` als Vorbild für Manifeste und Steckplätze
8. Nur als Muster für Texte, Screens und Lektionen: Randen (`BanioX/Randen`, nur lesen) `docs/regeln.md`, `docs/design.md`, `docs/lernbuch.md`

## Pfade

- **Schreiben:** `industries/lodging/` (`core/`, `web/`, `NAMES.md`); `docs/branchen/beherbergung.md` (nur Abschnitt 9 «geprüft am» und Abschnitt 16 «Stand»); `docs/branchen/beherbergung/adr/LDG-NNNN-<titel>.md` (eigene ADRs); `docs/branchen/beherbergung/antraege.md` (Plattform-Anträge)
- **Nur lesen:** `docs/branchen/beherbergung-recherche.md`, `platform/`, `editions/`, `registry/`, `industries/muster/`, übriges `docs/`, `BanioX/Randen`
- **Tabu:** `platform/`, `editions/`, `registry/` (neue Kennungen als Vorschlag in `NAMES.md` der eigenen Branche; der Kopf trägt ein), `tools/`, Wurzel-Konfiguration, `pnpm-lock.yaml` und neue Abhängigkeiten (nur per Plattform-Antrag), andere Branchen unter `industries/`, Randen, Rettich

## Pakete in dieser Reihenfolge

Ein Paket ist fertig, wenn seine Abnahme aus dem Steckbrief, Abschnitt 12, erfüllt ist und `pnpm check` sowie `pnpm check:industry <kennung>` grün sind. Fehlt ein Plattform-Paket, wartet das Paket oder arbeitet hinter einem Port mit einfacher Umsetzung und Plattform-Antrag ([`../zusammenarbeit.md`](../zusammenarbeit.md), Abschnitt 5). Nie eine eigene Fassung von etwas bauen, das die Plattform hat oder gerade baut.

| Paket | Braucht (Welle) |
| --- | --- |
| B-1 Gerüst und Haus | W0-02, W0-03, P-21 (W1-01), P-23 (W1-02) |
| B-2 Belegungsplan | P-50 Ressource «Zimmer» (W4, Plattform-Antrag) |
| B-3 Gästeregister | P-22 (W1-02), P-21 heikle Rechte, P-10 Unterschrift |
| B-4 Gästerechnung | P-29 mehrere Sätze und Abgaben (W2) |
| B-5 Hauswirtschaft | P-26, P-27 (W1-05) |
| B-6 Monatsabschluss Behörden | P-28 (W1-06), P-11 |
| B-7 Team und Zeit | P-31 mit Regelwerk L-GAV (W2, aus Randen) |
| B-8 Kasse und Monatspaket | P-30 (W2) |

**MVP:** B-1 bis B-8. **Danach:** Wäsche und Minibar, Kontrollen mit Intervallen, Kennzahlen in «Erweitert», Gruppen und Arrangements, Frühstücksliste an die Gastronomie, Tagesliste in weiteren Sprachen; dann Ferienwohnungen. Kalenderdatei nur nach [S-19](../entscheide.md); elektronische Gästemeldung nur nach [S-20](../entscheide.md); Hotel mit Restaurant erst mit den Modulen der Gastronomie (Schritt R5 in [`../randen.md`](../randen.md)). Pilot in einem Kanton, damit Meldeweg und Kurtaxe als Daten mit Quelle erfasst werden.

## Testweg

`pnpm check` bis `ALL=GREEN`; `pnpm check:industry <kennung>`; E2E mit axe in iPhone 390 px, iPad 820 px, iPad 1180 px und Web 1440 px, hell und dunkel; der Demo-Betrieb aus Abschnitt 13 des Steckbriefs zeigt jedes Paket; Vorschaubilder (`pnpm preview:shots`) für Alban bei jeder sichtbaren Änderung; mindestens ein Durchgang ohne Netz.

## Stopp-Regeln

Anhalten und melden, statt weiterzumachen, wenn ein Schritt Geld kostet, Daten neu das Gerät verlassen würden (auch Kopplung und Päckli vor Albans JA zu [S-06](../entscheide.md)), eine Datei ausserhalb der eigenen Pfade geändert werden müsste, eine Rechts- oder Geldregel ohne Quelle nötig wäre, eine Kennung, ein Datenbankname oder eine Adresse umbenannt werden müsste, die App etwas beurteilen statt erinnern und dokumentieren müsste, oder `main` nach dem Push rot ist.

## Bericht

Je Paket: was gebaut ist, Abnahme erfüllt (mit Testnamen), Vorschaubilder, Plattform-Anträge, eigene ADRs, Schulden, offene Fragen an Alban mit S-Nummer.

## Stand

offen

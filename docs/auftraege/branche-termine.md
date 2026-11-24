# Branche Termin-Dienstleister: Coiffeur, Kosmetik, Fusspflege, Massage, Hundesalon (`salon`)

- **Rolle:** Branchen-Agent
- **Voraussetzung:** W0-01, W0-02, W0-03 und W1-00 fertig; dazu je Paket die Plattform-Pakete in der Tabelle unten, mindestens mit Vertrag «alpha»
- **Welle:** W4

## Ziel

Ein kleiner Coiffeursalon mit 1 bis 4 Personen arbeitet in der Ausgabe «Studio» einen ganzen Tag auf dem iPad an der Theke: Terminbuch mit Phasen je Person und Platz, Kartei mit Rezepturen, Theke mit Tagesabschluss und Trinkgeld getrennt, Wertgutscheine, Bestätigungen zum Teilen, Preisliste als Aushang und Monatspaket für die Treuhand. Danach folgen Kosmetik, Nagel, Fusspflege, Massage und Hundesalon als Betriebsarten derselben Branche.

## Lesestoff

1. `CLAUDE.md`, `AGENTS.md`, [`../zusammenarbeit.md`](../zusammenarbeit.md)
2. Steckbrief [`../branchen/termine.md`](../branchen/termine.md), verbindlich, ganz; Abschnitt 12 enthält Ziel und Abnahme jedes Pakets
3. Recherche [`../branchen/termine-recherche.md`](../branchen/termine-recherche.md), nicht verbindlich; für Einzelheiten und Quellen
4. [`../plattform.md`](../plattform.md) (auch «Anträge aus den Steckbriefen»), [`../architektur.md`](../architektur.md), Abschnitte 4 bis 7
5. ADRs [0004](../adr/0004-andocken-einer-branche.md), [0005](../adr/0005-gemeinsames-datenmodell.md), [0006](../adr/0006-geraete-und-abgleich.md), [0007](../adr/0007-sprachen.md), [0009](../adr/0009-grundsaetze-aus-randen.md), [0010](../adr/0010-rechnungen-als-vorsystem.md), [0011](../adr/0011-oeffentliches-repo.md); offene Fragen in [`../entscheide.md`](../entscheide.md)
6. [`../fakten/`](../fakten/README.md) und die `api.md` jedes Plattform-Pakets, das ein Paket braucht
7. `industries/muster/` als Vorbild für Manifeste und Steckplätze
8. Nur als Muster für Texte, Screens und Lektionen: Randen (`BanioX/Randen`, nur lesen) `docs/regeln.md`, `docs/design.md`, `docs/lernbuch.md`

## Pfade

- **Schreiben:** `industries/salon/` (`core/`, `web/`, `NAMES.md`); `docs/branchen/termine.md` (nur Abschnitt 9 «geprüft am» und Abschnitt 16 «Stand»); `docs/branchen/termine/adr/SAL-NNNN-<titel>.md` (eigene ADRs); `docs/branchen/termine/antraege.md` (Plattform-Anträge)
- **Nur lesen:** `docs/branchen/termine-recherche.md`, `platform/`, `editions/`, `registry/`, `industries/muster/`, übriges `docs/`, `BanioX/Randen`
- **Tabu:** `platform/`, `editions/`, `registry/` (neue Kennungen als Vorschlag in `NAMES.md` der eigenen Branche; der Kopf trägt ein), `tools/`, Wurzel-Konfiguration, `pnpm-lock.yaml` und neue Abhängigkeiten (nur per Plattform-Antrag), andere Branchen unter `industries/`, Randen, Rettich

## Pakete in dieser Reihenfolge

Ein Paket ist fertig, wenn seine Abnahme aus dem Steckbrief, Abschnitt 12, erfüllt ist und `pnpm check` sowie `pnpm check:industry <kennung>` grün sind. Fehlt ein Plattform-Paket, wartet das Paket oder arbeitet hinter einem Port mit einfacher Umsetzung und Plattform-Antrag ([`../zusammenarbeit.md`](../zusammenarbeit.md), Abschnitt 5). Nie eine eigene Fassung von etwas bauen, das die Plattform hat oder gerade baut.

| Paket | Braucht (Welle) |
| --- | --- |
| B-1 Gerüst und Einrichten | W0-02, W0-03, P-21 (W1-01), P-24 (W1-03) |
| B-2 Terminbuch | P-50 Termine (W4) |
| B-3 Kartei und Rezepturen | P-22 (W1-02), P-21 heikle Rechte |
| B-4 Theke und Tagesabschluss | P-30 (W2) |
| B-5 Gutscheine | P-51 Wertgutschein (W4) |
| B-6 Bestätigungen | P-28 (W1-06), P-10 Teilen |
| B-7 Preisliste | P-24, P-11 |
| B-8 Monatspaket | P-30 |

**MVP:** B-1 bis B-8 (Coiffeur ohne Stuhlmiete). **Danach:** Lager mit Verbrauch je Rezeptur, Provision, Team und Zeit mit GAV-Vorlage, Hygiene und Geräte, Einwilligungen, Fotos, Mehrfachkarten, Stuhlmiete als eigener Betrieb (nach Albans Bestätigung), Warteliste. Gesundheitsangaben nur als Kennzeichen nach [S-12](../entscheide.md). Online-Buchung erst mit Stufe 2 ([S-14](../entscheide.md)). Nie: Tarif 590, medizinische Leistungen, Anbindung an Terminals oder Plattformen.

## Testweg

`pnpm check` bis `ALL=GREEN`; `pnpm check:industry <kennung>`; E2E mit axe in iPhone 390 px, iPad 820 px, iPad 1180 px und Web 1440 px, hell und dunkel; der Demo-Betrieb aus Abschnitt 13 des Steckbriefs zeigt jedes Paket; Vorschaubilder (`pnpm preview:shots`) für Alban bei jeder sichtbaren Änderung; mindestens ein Durchgang ohne Netz.

## Stopp-Regeln

Anhalten und melden, statt weiterzumachen, wenn ein Schritt Geld kostet, Daten neu das Gerät verlassen würden (auch Kopplung und Päckli vor Albans JA zu [S-06](../entscheide.md)), eine Datei ausserhalb der eigenen Pfade geändert werden müsste, eine Rechts- oder Geldregel ohne Quelle nötig wäre, eine Kennung, ein Datenbankname oder eine Adresse umbenannt werden müsste, die App etwas beurteilen statt erinnern und dokumentieren müsste, oder `main` nach dem Push rot ist.

## Bericht

Je Paket: was gebaut ist, Abnahme erfüllt (mit Testnamen), Vorschaubilder, Plattform-Anträge, eigene ADRs, Schulden, offene Fragen an Alban mit S-Nummer.

## Stand

offen

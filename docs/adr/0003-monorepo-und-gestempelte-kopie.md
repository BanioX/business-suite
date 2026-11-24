# ADR-0003: Monorepo für Plattform, Branchen und Ausgaben; Randen mit gestempelter Kopie

- **Status:** Entwurf, zur Bestätigung durch Alban ([S-02](../entscheide.md))
- **Datum:** 2026-11-24
- **Entscheid von:** Kopf

## Kontext

Plattform-Code muss in jede Branche kommen, kostenlos, ohne Token und ohne dass Kopien auseinanderlaufen. Randen ist in einem eigenen Repo mitten im Ausbau. Viele Agenten sollen parallel arbeiten. Verglichen wurden: Workspace im Monorepo, erzeugte Kopie mit Stempel, Git-Abhängigkeit, Paket-Register.

## Entscheid

1. **`business-suite` ist ein pnpm-Monorepo** mit `platform/` (Pakete `@onestrand/*`), `industries/<id>/` (je `core/` rein TS und `web/` React), `editions/<id>/` (dünne Apps), `services/`, `tools/`, `registry/` und `docs/` ([`../architektur.md`](../architektur.md), Abschnitt 3.1).
2. Im Monorepo nutzen Branchen und Ausgaben die Plattform als **Workspace (`workspace:*`)** von `main`. Jede Plattform-Änderung läuft gegen alle Branchen und Ausgaben.
3. **Randen bleibt vorerst in seinem Repo.** Es bekommt Plattform-Pakete als **gestempelte Kopie** in `vendor/onestrand/<paket>/`, als Workspace-Paket mit demselben Namen, damit sich beim späteren Umzug kein Import ändert. `STEMPEL.json` hält Quelle, Commit und SHA-256 je Datei fest; jede Datei trägt einen Kopfvermerk; ein Test beim Empfänger bricht bei einer Änderung von Hand; `pnpm onestrand:pull <commit>` holt eine neue Fassung.
4. **Eine Quelle je Datei:** Was Randen plattformfähig baut, ist bis zur Ernte in Randen die Quelle; danach ist die Suite die Quelle ([`../randen.md`](../randen.md)). Die Herkunft jeder Datei steht in `docs/herkunft.md` (ab Welle 0).
5. **Keine Git-Abhängigkeit, kein Paket-Register**, solange niemand ausserhalb die Pakete braucht.
6. Der Umzug von Randen ins Monorepo ist ein eigener Entscheid von Alban nach einem stabilen Pilot (Schritt R5).

## Begründung

- Workspace macht Brüche sofort sichtbar und ändert Plattform und Branche in einem Commit.
- Die gestempelte Kopie ist in Rettich erprobt («erzeugt, nie von Hand ändern»), braucht kein Netz beim Bauen und hält Randens Cloudflare-Build unverändert.
- Ein Paket-Register würde proprietären Code veröffentlichen oder zum Installieren ein Token verlangen; eine Git-Abhängigkeit macht den Build von GitHub abhängig und fällt aus Lint und Typprüfung.
- Ein Repo je Branche lädt jede Branche ein, ihre Kopie anzupassen; niemand sieht Brüche.

## Folgen

- Sammelstellen (Lockfile, Namensregister, Schema-Ledger, ADR-Nummern) schreibt nur der Kopf ([`../zusammenarbeit.md`](../zusammenarbeit.md)).
- Die CI baut nur, was ein PR betrifft, und nachts alles.
- Jede Ausgabe ist ein eigenes Cloudflare-Projekt mit eigenem Wurzelordner.

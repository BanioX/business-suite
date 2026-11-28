# W0-04: Offene Schnittstelle und Vorbereitung für den Assistenten

- **Rolle:** Plattform-Agent
- **Voraussetzung:** W0-02
- **Welle:** W0 (parallel zu W0-03 möglich, die Pfade überlappen nicht)

## Ziel

Was die App kann, können auch Werkzeuge: Aus der zusammengesetzten Schnittstelle entstehen ein typisierter Client, Werkzeug-Definitionen für einen Assistenten und eine Kommandozeile für Sicherungsdateien. Ein Assistent schlägt Befehle vor, die eine Person bestätigt; das Modell dahinter ist ein Port, hinter dem in Stufe 1 nichts im Netz steht. Danach bekommt jede Branche Client, Werkzeuge und Kommandozeile, sobald sie ihre Operationen anmeldet, ohne eigenen Code. Grundlage: [S-23](../entscheide.md), [S-24](../entscheide.md), [S-25](../entscheide.md), Abschnitt «Anspruch» im [Zielbild](../zielbild.md).

## Lesestoff

1. `CLAUDE.md`, `AGENTS.md`, [`../zusammenarbeit.md`](../zusammenarbeit.md)
2. [`../entscheide.md`](../entscheide.md), S-23 bis S-25; [`../zielbild.md`](../zielbild.md), «Anspruch»; [`../plattform.md`](../plattform.md), P-14 bis P-17
3. `platform/contract/api.md` (Operation, `access`, `contractJsonSchemas`, Befehls-Kit), `platform/storage/api.md` (Tabellen-Register mit Heikelkeit, Sicherung), das Ergebnis von W0-02 (`composeContract`, Hülle für Rechte, Referenz-Branche `muster`)
4. ADRs [0005](../adr/0005-gemeinsames-datenmodell.md) (Heikelkeit je Tabelle und Feld), [0006](../adr/0006-geraete-und-abgleich.md) (was nie aufs Handy geht), [0009](../adr/0009-grundsaetze-aus-randen.md)

## Pfade

- **Schreiben:** `platform/client/`, `platform/assistant/`, `platform/cli/`, `registry/` (Schemas der Register für den Editor), `tools/` (nur das Einhängen in `pnpm check`), Doku wie in W0-01
- **Nur lesen:** alle anderen Pakete der Plattform, `industries/muster/`
- **Tabu:** `editions/`, `platform/ui/`, `platform/shell/` (W0-03), jeder Aufruf ins Netz, jeder Dienst, der Geld kostet, echte Betriebsdaten

## Schritte

1. **`@onestrand/client`** (P-14, rein TS): `createClient(contract, transport)` mit einem Aufruf je Operation (`client.customers.create(input)`), Typen aus der Schnittstelle; Transport als Port, hier nur «im Prozess» gegen die Use Cases. Eine Operation, die es nicht gibt, lässt sich nicht aufrufen (Typ und Laufzeit).
2. **Werkzeug-Definitionen** in `@onestrand/assistant` (P-15, rein TS): aus jeder Operation ein Werkzeug mit stabilem Namen, Beschreibung, JSON Schema und Recht. Je Person nur die Werkzeuge, die ihr Recht erlaubt. Was einem Modell gezeigt werden darf, bestimmt die Heikelkeit aus dem Tabellen-Register: heikle Tabellen und Felder nie, interne nur mit ausdrücklicher Angabe.
   **Werkzeuge auch als Code-Schnittstelle** (Nachtrag 28.11.2026): Neben dem einzelnen Werkzeug je Operation erzeugt das Paket aus derselben Schnittstelle eine typisierte TypeScript-Beschreibung, gegen die ein Modell mehrere Schritte als ein Stück Code schreibt («erfasse diese fünf Einsätze»), statt je Schritt eine Runde mit dem Modell zu drehen. Das spart Runden und Tokens, je mehr Schritte eine Bitte hat. Der Code führt nichts selbst aus: Er wird in einer abgeschotteten Umgebung ohne Netz und ohne Speicherzugriff zu einem **Vorschlag** (Schritt 3), den die Person bestätigt. Ob das in W0-04 oder später kommt, entscheidet der Bericht nach Aufwand.
3. **Vorschlag:** ein Vorschlag ist eine Liste von Befehlen mit Eingaben, die auf Bestätigung warten. Bestätigen führt sie mit den Rechten der Person aus (über die Hülle aus W0-02, mit `commandId`, also gefahrlos wiederholbar); Ablehnen ändert nichts. Operationen, nach denen etwas gesperrt ist oder Dritte etwas erhalten, tragen ein Kennzeichen «braucht ausdrückliche Bestätigung» und werden nie zusammen mit anderen in einem Tipp bestätigt.
4. **Port für das Modell** (`AssistantModel`): Eingabe sind Text und die erlaubten Werkzeuge, Ausgabe ist ein Vorschlag oder eine Rückfrage. In diesem Auftrag gibt es nur eine Umsetzung für Tests mit festen Antworten; kein Netz. Der Dienst hinter dem Port ist [S-24](../entscheide.md), Option (a).
5. **`@onestrand/cli`** (P-16, Node): `onestrand backup check <datei>`, `backup query <operation>` (nur Abfragen) und `backup export --csv|--json`, gegen eine Sicherungsdatei, die die Person selbst geladen hat; schreibt nie in die Datei, kein Netz, verschlüsselte Sicherungen mit Passwort über die Standardeingabe. Die Befehle des Baus (`industry:new`, `check:industry`) bleiben `pnpm`-Skripte aus W0-02 und werden hier nur aufgelistet.
6. **Schemas für den Editor:** JSON Schema für `registry/names.json`, `registry/owners.json` und die Manifeste, damit ein Editor prüft und ergänzt.
7. **Wächter:** Der Wächter der Nebenwirkungen bleibt für diese Pakete ohne Netz-Eintrag grün; die Importgrenzen bekommen ihre Zeilen (`client` und `assistant` rein TS, `cli` darf Node); neue Kennungen ins Namensregister.
8. **Doku:** `api.md` je Paket; Schulden, Lernbuch, Stand im [Fahrplan](../fahrplan.md).

## Abnahme

- [ ] Der Client der Referenz-Branche `muster` ruft ihre zwei Operationen typisiert auf; ein falscher Name oder eine falsche Eingabe wird vom Typ und zur Laufzeit abgewiesen.
- [ ] Zu jeder Operation der zusammengesetzten Schnittstelle gibt es genau eine Werkzeug-Definition; eine Person ohne das Recht bekommt das Werkzeug nicht angeboten.
- [ ] Ein Feld mit Heikelkeit «heikel» erscheint in nichts, was an den Port des Modells geht (Test).
- [ ] Ein bestätigter Vorschlag aus zwei Befehlen wirkt wie zwei Befehle der Oberfläche, mit Ereignissen; zweimal bestätigen ändert nichts; ein abgelehnter Vorschlag hinterlässt keine Spur in den Daten.
- [ ] Eine Operation mit dem Kennzeichen «braucht ausdrückliche Bestätigung» lässt sich nicht im Sammel-Tipp bestätigen.
- [ ] Die Kommandozeile prüft eine Sicherung des Demo-Betriebs, beantwortet eine Abfrage und gibt CSV aus; die Datei ist danach Byte für Byte gleich; kein Netz (Test).
- [ ] `pnpm check`: `ALL=GREEN`.

## Testweg

`pnpm check`; die Kommandozeile gegen eine Sicherung des Demo-Betriebs von `muster`.

## Stopp-Regeln

Wie W0-01; dazu: Anhalten und melden, wenn ein Schritt einen Aufruf ins Netz, ein Modell bei einem Anbieter, einen Schlüssel oder echte Betriebsdaten bräuchte.

## Bericht

Was gebaut ist, was die Oberfläche (W0-03, Welle 1) für die Vorschlags-Ansicht braucht, was für den Dienst hinter dem Port des Modells offen ist (für [S-24](../entscheide.md)).

## Stand

offen

# Aufträge

Fertige Aufträge zum Weitergeben an Agenten. Jeder Auftrag nennt Ziel, Lesestoff, Pfade (schreiben, nur lesen, tabu), Abnahme, Testweg, Stopp-Regeln und Bericht ([`../zusammenarbeit.md`](../zusammenarbeit.md), Abschnitt 7). Ein Agent arbeitet nur in seinem Auftrag; was er unterwegs findet, kommt in seinen Bericht oder als Plattform-Antrag.

## Reihenfolge

| Nr. | Auftrag | Wer | Voraussetzung | Stand |
| --- | --- | --- | --- | --- |
| W0-01 | [Werkzeuge und Fundament](w0-01-fundament.md) | Plattform-Agent | – | offen, **als Nächstes** |
| W0-02 | [Zusammensetzen](w0-02-zusammensetzen.md) | Plattform-Agent | W0-01 | offen |
| W0-03 | [Oberfläche und erste Ausgabe](w0-03-oberflaeche.md) | Plattform-Agent | W0-02 | offen |
| W1-00 | [Verträge des Auftragskerns (alpha)](w1-auftragskern.md#w1-00) | Kopf oder Plattform-Agent | W0-03 | offen |
| W1-01 bis W1-06 | [Pakete des Auftragskerns](w1-auftragskern.md) | je ein Plattform-Agent, parallel | W1-00 | offen |
| Facility | [Branche Facility](branche-facility.md) | Branchen-Agent | W1-00 | offen |
| Maler | [Branche Maler und Gipser](branche-maler.md) | Branchen-Agent | Welle 2 | offen |
| Umzug | [Branche Umzug und Räumung](branche-umzug.md) | Branchen-Agent | Welle 2 | offen |
| weitere | je Branche `branche-<id>.md` | Branchen-Agent | Welle nach [Fahrplan](../fahrplan.md) | offen |

Aufträge für Welle 2 und später schreibt der Kopf, wenn die Welle beginnt, damit sie zum gebauten Stand passen. Die Branchen-Aufträge stehen schon, weil sie vom Steckbrief abhängen, nicht vom Code.

## So startest du einen Agenten

Neue Claude-Code-Sitzung mit dem Repo `BanioX/business-suite` (für die Ernte aus Randen zusätzlich `BanioX/Randen`, nur lesen). Dann diesen Text, mit dem passenden Auftrag:

**Plattform-Agent:**

> Lies `CLAUDE.md` und `AGENTS.md` im Repo business-suite. Dein Auftrag steht in `docs/auftraege/<auftrag>.md`. Bau genau das, nur in den Pfaden des Auftrags, prüf mit `pnpm check` bis `ALL=GREEN`, führe Doku, Schulden und Nebenwirkungen nach, lande nach den Regeln in `docs/zusammenarbeit.md` und berichte mir kurz: was gebaut ist, was offen ist, was du von mir brauchst. Es gelten Albans Entscheide in `docs/entscheide.md`.

**Branchen-Agent:**

> Lies `CLAUDE.md` und `AGENTS.md` im Repo business-suite. Du bist der Branchen-Agent für **<Branche>**. Lies den Steckbrief `docs/branchen/<id>.md` und deinen Auftrag `docs/auftraege/branche-<id>.md`. Nimm das nächste offene Paket, bau es nur in `industries/<id>/` und `docs/branchen/<id>*`, prüf mit `pnpm check` und `pnpm check:industry <id>`, führe den Stand im Steckbrief nach, stell Plattform-Anträge statt die Plattform zu ändern, und berichte mir kurz. Es gelten Albans Entscheide in `docs/entscheide.md`.

**Folge-Sitzung** (wenn eine Sitzung voll ist):

> Lies `CLAUDE.md`, `AGENTS.md` und `docs/auftraege/<auftrag>.md` im Repo business-suite. Lies den Abschnitt «Stand» deines Auftrags und den letzten Bericht. Mach beim nächsten offenen Schritt weiter, nach denselben Regeln.

## Vorlage für einen Auftrag

```markdown
# <Nr.>: <Titel>

- **Rolle:** Plattform-Agent | Branchen-Agent | Fakten-Agent
- **Voraussetzung:** <Aufträge, die fertig sein müssen>
- **Welle:** <W0 … W7>

## Ziel
<ein Absatz: was danach geht, das vorher nicht ging>

## Lesestoff
<Dateien in dieser Reihenfolge>

## Pfade
- **Schreiben:** <Pfade>
- **Nur lesen:** <Pfade, auch in anderen Repos>
- **Tabu:** <Pfade und Dinge>

## Schritte
1. …

## Abnahme
- [ ] …

## Testweg
<Befehle, Geräte, Ansichten>

## Stopp-Regeln
Anhalten und melden, wenn <…> (immer auch: Geld, neuer Datenfluss, fremde Pfade, Recht ohne Quelle, Umbenennen).

## Bericht
<was am Ende an Alban geht>

## Stand
<vom Agenten nachgeführt: erledigt, offen, nächster Schritt>
```

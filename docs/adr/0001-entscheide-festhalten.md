# ADR-0001: Entscheide festhalten

- **Status:** angenommen
- **Datum:** 2026-11-24
- **Entscheid von:** Kopf

## Kontext

Viele Agenten arbeiten parallel an Plattform und Branchen. Was einmal entschieden ist, muss jede neue Sitzung finden, ohne den Verlauf eines Chats zu kennen.

## Entscheid

1. Jeder Entscheid mit Folgen steht als eigene Datei `docs/adr/NNNN-titel.md` mit Status, Datum, wer entschieden hat, Kontext, Entscheid, Begründung und Folgen. Wer ein ADR anlegt oder dessen Status ändert, führt [`README.md`](README.md) im selben Schritt nach.
2. **Nummern der Suite vergibt nur der Kopf.** Branchen führen eigene ADRs mit Präfix in `docs/branchen/<id>/adr/` (Facility `FAC-0001`, Maler `PNT-0001`, Gebäudehülle `ENV-0001`, Umzug `MOV-0001`, Beherbergung `LDG-0001`, Haustechnik `BSV-0001`, Holz `CRP-0001`, Garten und Aussendienste `OUT-0001`, Termine `SAL-0001`, Kurse `CRS-0001`).
3. Entscheide, die nur Alban treffen kann, stehen zuerst in [`../entscheide.md`](../entscheide.md); das ADR heisst bis dahin «Entwurf, zur Bestätigung durch Alban».
4. ADRs von Randen werden als «Randen-ADR-00nn» zitiert; sie gelten in der Suite nur, soweit ein ADR der Suite sie übernimmt.
5. Ein ADR wird nie still geändert: Ein neuer Entscheid ersetzt oder ergänzt ein altes ADR und sagt das im Kopf beider Dateien.

## Folgen

- Eine neue Sitzung liest `CLAUDE.md`, `AGENTS.md` und die ADRs ihres Bereichs und kennt den Stand.

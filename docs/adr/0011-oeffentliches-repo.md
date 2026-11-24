# ADR-0011: Was im öffentlichen Repo stehen darf

- **Status:** angenommen
- **Datum:** 2026-11-24
- **Entscheid von:** Kopf, nach Albans Regeln für Rettich (Rettich-ADR-0065) und Randen (Arbeitsweise 5)

## Kontext

`BanioX/business-suite` ist öffentlich. Was einmal in der Geschichte eines öffentlichen Repos steht, lässt sich nicht zuverlässig zurückholen.

## Entscheid

1. **Hier steht, was gebaut wird und wie:** Plan, Architektur, Steckbriefe der Branchen, Fakten mit Quelle, Aufträge, Code.
2. **Nie hier:** Preise der Suite, Abo- und Geschäftsmodelle, Marktanteile als Ziel, Namen oder Vergleiche anderer Software-Produkte, Strategie gegen Mitbewerber, echte Namen von Firmen, Kundinnen und Kunden, Mitarbeitenden oder Pilotbetrieben; nicht in Dateien, Kommentaren, Tests, Demo-Daten, Commits, Branch-Namen oder PR-Texten.
3. **Erlaubt als Quelle:** Behörden, Verbände, Sozialpartner, paritätische Kommissionen, Normen-Herausgeber und Hochschulen, mit Link.
4. **Demo-Daten** sind erfunden: «Reinigung Muster», «Musterweg 12, 8000 Beispielstadt», keine Marken von Farben, Reinigungsmitteln, Geräten oder Fahrzeugen.
5. **Strategie und Geld** liegen in einer privaten Ablage, die Alban bestimmt.
6. Ein **Wächter-Test** nach dem Muster von Rettich (verbotene Namen nur als Prüfsummen hinterlegt) kommt mit dem Fundament (W0-01).

## Folgen

- Jeder Agent prüft vor dem Commit Texte, Demo-Daten und Commit-Nachricht auf echte Namen und Preise.

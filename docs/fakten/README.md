# Fakten mit Quelle

Rechtliche und amtliche Angaben, auf die sich die Suite stützt. Regel (Randen-ADR-0012, [ADR-0009](../adr/0009-grundsaetze-aus-randen.md)): **Was hier nicht mit Quelle steht, kommt nicht in die App.** In der App heissen solche Werte «Richtwert», und der Betrieb kann sie ändern. Die App beurteilt nie; sie erinnert, dokumentiert und verweist auf die Quelle.

## Dateien

| Datei | Inhalt |
| --- | --- |
| [`geld-steuern.md`](geld-steuern.md) | QR-Rechnung, MWST und Saldosteuersätze, Buchführung und Aufbewahrung, Offerte und Werkvertrag, Fristen, Zahlungen |
| [`arbeit-personal.md`](arbeit-personal.md) | Arbeitszeit und Erfassung, Lohn und Sozialversicherungen, GAV-Übersicht, Arbeitssicherheit, Datenschutz, Bewilligungen, Sprachen |
| Steckbriefe in [`../branchen/`](../branchen/README.md) | die Fakten je Branche, Abschnitt «Recht und Pflichten», mit Quelle und Prüfdatum |

## Regeln für diese Dateien

- Jede Zeile: Fakt, Wert, Quelle (URL), geprüft am. Bevorzugt amtliche Quellen (fedlex.admin.ch, seco.admin.ch, estv.admin.ch, suva.ch, ekas.ch, bfs.admin.ch, edoeb.admin.ch, kantonale Seiten), dazu Sozialpartner und Verbände für GAV.
- Was nicht belegt werden konnte, heisst «nicht belegt» und kommt nicht in die App.
- Jährlich ändernde Werte (Mindestlöhne, Beitragssätze, Grenzbeträge) tragen ihr Gültigkeitsjahr; der Kopf prüft sie jeden Januar.
- Normen mit Urheberrecht (etwa SIA-Normen, Normpositionen) werden nur genannt, nie abgeschrieben.
- Keine Rechtsberatung: Vor einem Pilot prüft eine Fachperson, was die App zu Lohn, Fristen und Verträgen sagt ([S-17](../entscheide.md)).
- Nur Fakten-Agenten und Branchen-Agenten (für ihre Branche) schreiben hier.

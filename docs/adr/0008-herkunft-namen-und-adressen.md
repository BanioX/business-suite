# ADR-0008: Herkunft, Namen und Adressen der Ausgaben

- **Status:** Entwurf; Adressen und Namen nach Albans Entscheid ([S-04](../entscheide.md), [S-05](../entscheide.md))
- **Datum:** 2026-11-24
- **Entscheid von:** Kopf
- **Übernimmt:** Randen-ADR-0020, Punkte 3 bis 6, und die Umzugsregel aus Randens `docs/intern/suite.md`, Abschnitt 5

## Kontext

Speicher, Service Worker, CSP und die Identität einer installierten App hängen an der Herkunft (Schema, Host, Port). Eine neue Adresse ist für den Browser eine neue App mit leerem Speicher; iOS fixiert Symbol und Speicher beim Hinzufügen zum Home-Bildschirm (Rettich L-11). Alban will «Randen» vielleicht umbenennen. Die Domain onestrand.ch gehört Alban.

## Entscheid

1. **Eine Herkunft je Ausgabe**, nie zwei Ausgaben unter Pfaden einer Adresse.
2. **Technische Namen nach Zweck, nie nach Marke:** Datenbank, Speicher-Präfix, Sicherungsformat, Cloudflare-Projekt und Unteradresse tragen die Kennung der Ausgabe (`field`, `house`, `studio`). Für Randen bleiben `randen`, `randen:`, `randen-backup` und das Projekt `randen` für immer.
3. **Adressen unter onestrand.ch** nach Zweck (Vorschlag `gastro.`, `vorort.`, `haus.`, `studio.onestrand.ch`), sobald die Zone bei Cloudflare liegt; bis dahin `<projekt>.<konto>.workers.dev` nur für Demos und Vorschauen.
4. **Die Adresse einer Ausgabe steht vor ihrem ersten Pilot fest** und ändert danach nie. Eine Marke darf sich ändern; dann ändern nur Manifest, Symbol und Texte.
5. **Nie umbenennen:** Projekte, Datenbanken, Präfixe, Formate, Kennungen.
6. **Umzugsregel**, falls eine Adresse doch wechseln muss: an der alten Adresse sichern, die neue öffnen und installieren, zurückholen und prüfen, erst dann die alte App entfernen. Eine Weiterleitung nimmt keine Daten mit.
7. **Startseite der Firma** auf onestrand.ch (Repo `BanioX/onestrand`), nie unter der Adresse einer Ausgabe; nur von dort führen Wege zu den Ausgaben.
8. **Konten** später auf `konto.onestrand.ch` (Stufe 2); ein Passkey für onestrand.ch gilt auf allen Unteradressen.

## Folgen

- Der Kopf führt in `registry/names.json` die eingefrorenen Namen jeder Ausgabe.
- Vor dem ersten Pilot von Randen braucht es Albans Entscheid S-04.

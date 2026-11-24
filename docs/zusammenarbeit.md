# Zusammenarbeit: Kopf, Plattform-Agenten, Branchen-Agenten

Wie viele KI-Agenten gleichzeitig an der Suite arbeiten, ohne einander zu stören und ohne dass die Plattform zerfällt. Gilt ab Welle 0. Kurzform in [`CLAUDE.md`](../CLAUDE.md), Arbeitsweise 2, 3 und 9.

## 1. Rollen

| Rolle | Wer | Schreibt | Entscheidet |
| --- | --- | --- | --- |
| **Alban** | Product Owner | – | alles, was Geld kostet, neue Datenflüsse, Namen, Adressen, Reihenfolge der Branchen, Freigabe von Piloten ([`entscheide.md`](entscheide.md)) |
| **Kopf** | eine Claude-Sitzung im Repo `business-suite` | `docs/`, `registry/`, `editions/`, `tools/`, Wurzel-Konfiguration, CI; führt Plattform-PRs zusammen | Architektur, Aufträge, Plattform-Anträge, kleine Entscheide als ADR |
| **Plattform-Agent** | eine Sitzung je Auftrag | genau die Pakete unter `platform/<paket>/`, die sein Auftrag nennt, und ihre Doku | nichts über den Auftrag hinaus |
| **Branchen-Agent** | eine Sitzung je Branche | `industries/<id>/`, `docs/branchen/<id>*`, `docs/fakten/<id>*` | Details seiner Branche innerhalb des Steckbriefs, als ADR der Branche |
| **Fakten-Agent** | bei Bedarf | nur `docs/fakten/` | nichts; prüft Quellen |
| **Prüfer:in** | bei Bedarf | nichts | liest, prüft, meldet |
| **Randen-Sitzung** | wie heute | nur `BanioX/Randen` | nach Randens Masterplan; folgt den Bauregeln in [`randen.md`](randen.md) |

Die Suite schreibt nie in `BanioX/Randen` oder `BanioX/Rettich`.

## 2. Eigentum an Pfaden

- `registry/owners.json` ordnet jeden Pfad einem Eigentümer zu: `head`, `platform:<paket>`, `industry:<id>`. Ein Werkzeug (`pnpm ownership`) prüft in `pnpm check` und in der CI, dass ein Commit nur Pfade seines Auftrags ändert.
- Jeder Commit trägt die Trailer `Order: <Auftrag>` und `Role: <Rolle>`. (Branch-Namen helfen nicht: Sitzungen bekommen ihren Branch zugewiesen, und alle Agenten nutzen dasselbe Konto.)
- Offene Aufträge überlappen nie in ihren Pfaden. Der Kopf prüft das, bevor er einen Auftrag freigibt.

## 3. Sammelstellen: nur der Kopf

Dateien, an denen alle hängen, schreibt nur der Kopf:

| Sammelstelle | Warum | Wie Agenten etwas anmelden |
| --- | --- | --- |
| `registry/names.json` (Kennungen, Präfixe, Namensräume) | doppelte Kennungen zerstören Daten | im PR als Vorschlag in `industries/<id>/NAMES.md`; der Kopf trägt ein |
| Schema-Ledger je Ausgabe | die Version der Datenbank fällt nie | Branche meldet Tabellen ohne Nummer; der Kopf vergibt den Schritt beim Zusammenführen |
| ADR-Nummern der Suite | ein Nummernkreis, ein Schreiber | Branchen führen eigene ADRs mit Präfix (`FAC-0001`) in `docs/branchen/<id>/adr/` |
| `pnpm-lock.yaml`, neue fremde Abhängigkeiten | Lizenz, Grösse, Sicherheit | Plattform-Antrag mit Begründung |
| `editions/*` | Herkunft ist heilig | nur der Kopf |

## 4. Verträge zwischen Plattform und Branche

- Was eine Branche nutzen darf, ist der öffentliche Einstieg eines Pakets (`@onestrand/<paket>` und `@onestrand/<paket>/web`). Tiefe Importe sind verboten (ESLint).
- Je Paket hält `api.md` die Exporte fest; ändert sich der Schnappschuss, verlangt die CI einen Eintrag im Changelog.
- **Vertrag zuerst:** Ein neues Plattform-Paket beginnt mit einem PR, der nur Schemas, Namen und Ports enthält (Stufe «alpha»). Danach bauen Plattform und Branche parallel dagegen. «stable» wird ein Vertrag erst, wenn zwei Branchen oder eine Branche im Pilot ihn nutzen.
- Die Referenz-Branche `industries/muster` nutzt jeden Steckplatz einmal und ist der lebende Vertragstest.

## 5. Plattform-Antrag

Fehlt einer Branche etwas aus der Plattform:

1. Die Branche schreibt den Antrag in `docs/branchen/<id>/antraege.md`: was, wofür, welche Felder und Operationen, welche andere Branche es auch brauchen wird (Regel der zwei).
2. Bis zur Antwort arbeitet die Branche hinter einem **Port** in ihrem eigenen Paket, mit einer einfachen Umsetzung, die später ersetzt wird.
3. Der Kopf entscheidet: in die Plattform (neuer Auftrag für einen Plattform-Agenten), in die Branche (bleibt dort) oder später.
4. Eine Branche baut nie eine eigene Fassung von etwas, das die Plattform schon hat oder gerade baut.

## 6. Landen

- **Branchen und Doku:** `git fetch`, Rebase auf `origin/main`, `pnpm install`, `pnpm check` bis `ALL=GREEN`, dann `git push origin HEAD:<arbeits-branch> HEAD:main`. Lehnt Git den Push ab, weil `main` weiter ist: von vorn ab `git fetch`. So bleibt `main` die eine Version (Alban, 17.11.2026).
- **Plattform:** über einen PR mit der CI aller Ausgaben und Branchen, E2E der Ausgaben mit Pilot und einem Review; der Kopf führt zusammen. Ist `main` danach rot: zuerst zurücknehmen, dann reparieren.
- **Production** einer Ausgabe kommt aus `live/<ausgabe>`, erst ab ihrem ersten Pilot. Der Kopf zieht `live/<ausgabe>` nach, nachdem die Vorschau angeschaut ist; installierte Apps aktualisieren sich selbst, und ein Fehler träfe sonst alle Betriebe am selben Morgen ([S-10](entscheide.md)).
- Ein Thema je PR, unter 400 geänderten Zeilen ohne Lockfile, wenige Pushes.

## 7. Aufträge

Jeder Auftrag in [`auftraege/`](auftraege/README.md) nennt: Ziel, Lesestoff, Pfade (schreiben, nur lesen, tabu), Abnahme, Testweg, Stopp-Regeln und was am Ende zu berichten ist. Ein Agent erweitert seinen Auftrag nie selbst; was er unterwegs findet, schreibt er in seinen Bericht oder als Plattform-Antrag.

## 8. Stopp-Regeln

Ein Agent hält an und meldet sich, statt weiterzumachen, wenn:

- ein Schritt Geld kosten würde oder Daten neu das Gerät verlassen würden;
- er eine Datei ausserhalb seiner Pfade ändern müsste;
- eine Rechtsregel ohne Quelle nötig wäre;
- eine Kennung, ein Datenbankname, ein Präfix oder eine Adresse umbenannt werden müsste;
- `main` nach seinem Push rot ist.

## 9. CI und Kosten

- Das Repo ist öffentlich; GitHub Actions sind für öffentliche Repos ohne Minuten-Kontingent (Stand Randen, 23.11.2026; vor dem Fundament nachsehen). Die CI baut nur, was ein PR betrifft; nachts alles. Reine Doku-Änderungen überspringen Tests und E2E.
- Cloudflare im Gratis-Plan: ein Projekt je Ausgabe, Vorschauen nur für Ausgaben mit Pilot. Vor jedem bezahlten Plan fragt der Kopf Alban.

## 10. Architekturtests (ab Welle 0)

1. Rein-TS-Pakete ohne React, DOM, Dexie.
2. Plattform importiert keine Branche; keine Branche importiert eine andere.
3. Keine Wörter einer Branche im Plattform-Code (Liste je Branche, etwa «Küche», «Gast», «Baustelle»).
4. Jede Operation hat `access`.
5. Jede Kennung steht im Namensregister, keine doppelt.
6. Jede Tabelle steht im Schema-Ledger jeder Ausgabe, die sie nutzt.
7. Sicherung hin und zurück je Ausgabe, gegen alle eingefrorenen Sicherungen.
8. Ausgeschaltete Funktion: keine Einstiege, Daten bleiben.
9. Texte: «du», «ss», kein Ausrufezeichen, keine Produktnamen in Plattform-Texten.
10. Nebenwirkungen: jedes `fetch`, `WebSocket`, `RTCPeerConnection`, Teilen, Kamera steht im Register.
11. Öffentliches Repo: keine verbotenen Namen (als Prüfsummen hinterlegt), keine Preise der Suite.
12. Pfad-Eigentum je Commit.

# Nebenwirkungen

Was eine App der Suite ausserhalb ihrer selbst tut: Netz, Speicher des Geräts, Kamera, Drucken, Teilen, Dateien. Jede Art steht hier, bevor sie im Code steht. Der Wächter `pnpm guards` vergleicht dieses Register mit dem ausgelieferten Code (`platform/`, `industries/`, `editions/`, `services/`, ohne Tests) und bricht bei einer Art ohne Zeile ab.

**Regeln**

- Eine neue Nebenwirkung bekommt ihre Zeile im selben Schritt wie der Code ([`../AGENTS.md`](../AGENTS.md), «Was eine Änderung immer mitbringt»).
- Verlassen Daten neu das Gerät, entscheidet vorher Alban ([`../CLAUDE.md`](../CLAUDE.md), «Freigabe»). Eine Anfrage an einen Server braucht darum «ja» in «Daten verlassen das Gerät?» und im Entscheid «Alban, TT.MM.JJJJ» mit dem ADR.
- «Im Code» nennt die Art in Backticks, genau wie der Wächter sie kennt (`SIDE_EFFECT_KINDS` in `@onestrand/testing`). «Seit» ist ein Datum `TT.MM.JJJJ` oder «geplant».
- Kennungen `SE-nn` werden fortlaufend vergeben und nie neu verwendet.

## Register

| Kennung | Nebenwirkung | Im Code | Wo | Daten verlassen das Gerät? | Entscheid | Seit |
| --- | --- | --- | --- | --- | --- | --- |
| SE-01 | Datenbank des Geräts (IndexedDB): Zeilen, Ereignisse, Befehlsprotokoll und Dateien aller Betriebe auf dem Gerät, unter dem Datenbanknamen der Ausgabe | `indexedDB` | `platform/web-data/src/indexeddb-storage.ts` | nein | ADR-0009 (Daten bleiben auf dem Gerät), ADR-0005 (Dateien als Bytes, mehrere Betriebe je Gerät), ADR-0008 (Name je Ausgabe) | 25.11.2026 |
| SE-02 | Speicher des Browsers für das, was zum Gerät gehört und in keine Sicherung geht: offener Betrieb, handelnde Person, Gerätemodus, Sprache der Bedienung; jeder Schlüssel trägt das Präfix der Ausgabe | `localStorage` | `platform/web-data/src/device.ts` | nein | ADR-0008 (Präfix je Ausgabe), ADR-0009 | 25.11.2026 |
| SE-03 | Bitte an den Browser, die Daten auch bei knappem Platz zu behalten (die App entscheidet, wann sie fragt) | `storage.persist` | `platform/web-data/src/persistence.ts` | nein | ADR-0009 (Daten bleiben auf dem Gerät) | 25.11.2026 |

Stand 25.11.2026: Das Fundament (Auftrag [W0-01](auftraege/w0-01-fundament.md)) ist reines TypeScript hinter Ports. Die ersten Zeilen kamen mit dem Speicher im Browser (`@onestrand/web-data`, W0-02, Schritt 7); weitere kommen mit der ersten Ausgabe (W0-03).

## Was der Wächter nicht sieht

- Eine Art, die er nicht kennt, und Code, der eine Funktion des Browsers über einen Umweg erreicht (ein Name aus Teilen zusammengesetzt).
- Die Schlüssel im Speicher des Browsers: Sie werden je Ausgabe geprüft, sobald es eine gibt ([Schulden](schulden.md), TD-50).
- Was eine Abhängigkeit tut. Neue Abhängigkeiten prüft, wer sie einführt.

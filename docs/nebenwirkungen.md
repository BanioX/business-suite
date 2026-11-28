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
| SE-04 | Teilen-Menü des Geräts: eine Datei (PDF, Sicherung) an ein Ziel geben, das die Person im Menü wählt; ohne Text, nach einem Tipp | `navigator.share` | `platform/web-device/src/browser.ts`, `platform/web-device/src/share.ts` | nein (die Person gibt die Datei selbst weiter, die App sendet nichts) | ADR-0009 (Drucken und Sichern über PDF und Teilen, Randen-ADR-0019) | 28.11.2026 |
| SE-05 | Datei herunterladen: ein Link mit `download`, einmal geklickt, auf eine Adresse im Speicher, die eine Sekunde danach frei wird; der letzte Weg, wenn es kein Teilen-Menü gibt | `download`, `createObjectURL` | `platform/web-device/src/browser.ts` | nein | ADR-0009 (Randen-ADR-0019) | 28.11.2026 |
| SE-06 | Druckdialog des Browsers; in der installierten App auf iPhone und iPad das PDF der Seite über das Teilen-Menü (SE-04) | `window.print` | `platform/web-device/src/browser.ts` | nein | ADR-0009 (Randen-ADR-0019) | 28.11.2026 |
| SE-07 | Kamera: die hintere Kamera ohne Ton, erst nach einem Tipp, zum Lesen eines QR-Codes; das Bild bleibt im Speicher und wird nie gesichert; jeder Zustand der Erlaubnis hat einen Weg zur Datei | `getUserMedia` | `platform/web-device/src/browser.ts`, `platform/web-device/src/camera.ts` (geöffnet von `platform/web-device/src/web/QrReader.tsx`) | nein | ADR-0009; CLAUDE.md (Kamera nur nach Nutzeraktion, mit Fallback auf Datei-Upload) | 28.11.2026 |
| SE-08 | Auswahl einer Datei oder eines Fotos: die Kamera-App des Geräts («Foto aufnehmen», `capture`) oder die Bilder und Dateien; ein Foto wird auf dem Gerät verkleinert und ohne Metadaten (auch ohne Ort) neu geschrieben | `type="file"`, `capture=` | `platform/web-device/src/web/FilePickButton.tsx`, `platform/web-device/src/web/PhotoField.tsx` (Kamera-App), `platform/web-device/src/web/QrReader.tsx` (Bilder und Dateien) | nein | ADR-0009; CLAUDE.md (Kamera nur nach Nutzeraktion, mit Fallback auf Datei-Upload) | 28.11.2026 |
| SE-09 | Bildschirm wach halten, solange eine Aufgabe läuft; frei, sobald die Seite verborgen ist oder die Aufgabe endet | `wakeLock` | `platform/web-device/src/browser.ts`, `platform/web-device/src/screen.ts` | nein | ADR-0009 | 28.11.2026 |
| SE-10 | Zahl am Symbol der installierten App: nur, was die Person tun muss, nie ein Zähler als Lockmittel; still ohne Schnittstelle | `setAppBadge` | `platform/web-device/src/browser.ts` | nein | ADR-0009; S-26 (keine Zähler als Lockmittel) | 28.11.2026 |
| SE-11 | Text in die Zwischenablage, nach einem Tipp (ein gelesener Code, eine Referenz) | `navigator.clipboard` | `platform/web-device/src/browser.ts`, `platform/web-device/src/screen.ts` | nein | ADR-0009 | 28.11.2026 |

Stand 28.11.2026: Das Gerät (`@onestrand/web-device`, W0-03, Schritt 3) bringt SE-04 bis SE-11; `wakeLock` und `setAppBadge` kennt vorerst nur der Wächter des Repos (`tools/src/side-effects.ts`), noch nicht `SIDE_EFFECT_KINDS` von `@onestrand/testing` ([Schulden](schulden.md)). Stand 25.11.2026: Das Fundament (Auftrag [W0-01](auftraege/w0-01-fundament.md)) ist reines TypeScript hinter Ports. Die ersten Zeilen kamen mit dem Speicher im Browser (`@onestrand/web-data`, W0-02, Schritt 7); weitere kommen mit der ersten Ausgabe (W0-03).

## Was der Wächter nicht sieht

- Eine Art, die er nicht kennt, und Code, der eine Funktion des Browsers über einen Umweg erreicht (ein Name aus Teilen zusammengesetzt).
- Die Schlüssel im Speicher des Browsers: Sie werden je Ausgabe geprüft, sobald es eine gibt ([Schulden](schulden.md), TD-50).
- Was eine Abhängigkeit tut. Neue Abhängigkeiten prüft, wer sie einführt.

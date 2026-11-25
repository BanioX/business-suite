# @onestrand/testing (P-13)

Das Test-Kit der Suite: feste Uhr, fortlaufende IDs, ein schlanker Seed und drei Standardtests (Sprache, Nebenwirkungen, Sicherheit). Reines TypeScript ohne Browser und ohne Node; baut auf `@onestrand/core`, `@onestrand/contract` und `@onestrand/storage`. Das Paket ist nur für Tests und Wächter da und wird nie mit einer App ausgeliefert.

```ts
import { createTestContext, fixedClock, sequentialIds, textProblems } from '@onestrand/testing';
```

## Was das Paket exportiert

| Bereich | Exporte | Wozu |
| --- | --- | --- |
| Uhr | `fixedClock`, `TestClock`, `ClockStep` | eine Uhr, die steht, bis der Test sie stellt |
| IDs | `sequentialIds` | UUIDv7, die zählen: derselbe Test gibt immer dieselben IDs |
| Prüfsumme | `testHasher`, `sha256Hex` | SHA-256 ohne WebCrypto, für Speicher, Sicherung und Ledger im Test |
| Seed | `createTestContext`, `TestContext`, `TestContextOptions`, `businessSnapshot`, `BusinessSnapshot` | ein erfundener Betrieb mit zwei Personen auf einem Speicher |
| Befund | `StandardProblem` | was jeder Standardtest zurückgibt: `rule` und `message` |
| Sprache | `textProblems`, `catalogueTexts`, `DE_CH_TEXT_RULES`, `DE_CH_OPENING_SIE_RULE`, `productNameRule`, `TextRule`, `TextProblem`, `CatalogueText`, `TextCheckOptions` | die Texte eines Katalogs gegen die Regeln der Sprache |
| Nebenwirkungen | `occurrences`, `parseRegister`, `registerProblems`, `sideEffectProblems`, `storageKeys`, `storageKeyProblems`, `withoutComments`, `SIDE_EFFECT_KINDS`, `REGISTER_COLUMNS`, `SideEffectKind`, `SideEffectProblem`, `SourceFile`, `RegisterRow` | der Code gegen `docs/nebenwirkungen.md` |
| Sicherheit | `securityProblems`, `headerProblems`, `htmlProblems`, `parseHeadersFile`, `SecurityProblem`, `HeaderRule`, `PageExpectations` | `_headers` und `index.html` gegen die Regeln der Suite |

## Regeln, die du kennen musst

1. **Befunde sind Daten:** Kein Standardtest wirft für das, was er findet, und keiner prüft selbst. Jeder gibt eine Liste zurück, der Test erwartet `[]`. So zeigt ein roter Lauf alle Befunde auf einmal. `message` ist englisch und für die Person, die den roten Test liest.
2. **Uhr:** `fixedClock('2026-11-14')` steht auf 10:00 UTC dieses Tages, also am späten Vormittag in der Schweiz. Sie hält einen Zeitpunkt; `today()` folgt daraus, auch um Mitternacht und bei der Zeitumstellung. `advance({ hours, minutes, seconds, milliseconds })` geht nur vorwärts, `setNow` und `setToday` springen. Jeder Zeitpunkt trägt Millisekunden.
3. **IDs:** `sequentialIds(start = 1)` zählt hoch; die IDs sortieren in der Reihenfolge, in der sie entstanden sind. Zwei Erzeuger, die sich nicht treffen dürfen, bekommen weit entfernte Anfänge.
4. **Seed:** `createTestContext({ registry })` gibt einen frischen Speicher im Arbeitsspeicher mit dem Betrieb «Betrieb Muster», einer Inhaberin und einer zweiten Person. Die ersten drei IDs sind Betrieb, Inhaberin und zweite Person. Personen sind nur IDs: Zeilen für Personen schreibt das Modul, das sie besitzt. `ctx` ist der Kontext eines Befehls mit der Inhaberin als handelnder Person, `actingAs(personId)` derselbe für eine andere Person, `cmd()` eine frische `commandId`.
5. **Zweiter Betrieb:** `addBusiness()` legt auf demselben Speicher und derselben Uhr «Betrieb Beispiel» an, mit eigenen Personen und einem eigenen Bereich von IDs. `snapshot()` gibt alles, was der Speicher für einen Betrieb hält (Zeile, Tabellen, Dateien, Ereignisse), und vergleicht sich mit `toEqual`: «der andere Betrieb ist unberührt» ist eine Zeile. Das Befehlsprotokoll ist nicht dabei.
6. **Eigener Speicher:** Mit `storage` läuft derselbe Test gegen einen Adapter. Hält der Speicher ein volleres Modell des Betriebs, ergänzt `business: (base) => ({ ...base, … })` die Zeile.
7. **Namen im Test:** Die Betriebe heissen «Betrieb Muster» und «Betrieb Beispiel», ein dritter «Betrieb 3». Keine echten Namen von Firmen oder Personen, auch nicht in Fixtures.
8. **Sprache:** `textProblems({ quelle: katalog, … })` prüft jeden Text und die Literale jeder Meldungsfunktion gegen `DE_CH_TEXT_RULES`: kein leerer Text, «ss» statt «ß», kein Ausrufezeichen, «du» statt «ihr» oder «Sie», keine Schlagworte, keine Emojis. `productNames` nennt Namen, die im Text nicht stehen dürfen; die Liste bringt der Aufrufer mit. «Sie» am Satzanfang ist auch «sie»: `DE_CH_OPENING_SIE_RULE` gibst du nur dort dazu, wo kein Satz so beginnen soll. Eine weitere Sprache bringt ihre eigene Liste von Regeln.
9. **Nebenwirkungen:** Der Aufrufer liest die ausgelieferten Quellen (`{ path, code }`) und das Register als Text. `registerProblems(markdown)` prüft die Form des Registers, `sideEffectProblems(occurrences(sources), parseRegister(markdown))` den Code dagegen, `storageKeyProblems(sources, rows, prefix)` die Schlüssel im Speicher des Browsers. Eine Art, die im Code vorkommt, braucht eine Zeile; eine Anfrage an einen Server braucht dazu «ja» und «Alban, TT.MM.JJJJ, ADR-NNNN» im Entscheid. Kommentare zählen nicht, Texte in Anführungszeichen schon. Die Quellen dieses Pakets gehören nicht dazu: Sie nennen jede Art, um sie zu finden.
10. **Sicherheit:** `securityProblems({ headers, html }, { title })` prüft die zwei Dateien, die der Host unverändert ausliefert: Content-Security-Policy nur mit `'self'` (Bilder auch `data:` und `blob:`), `X-Frame-Options: DENY`, `noindex, nofollow` als Kopfzeile und als `meta`, Kamera höchstens für die App selbst, kein Mikrofon, kein Standort, keine Adresse einer anderen Herkunft, kein Inline-Code, Sprache `de-CH`. Jede Richtlinie kommt aus der Regel für `/*`. `parseHeadersFile` liest dieselbe Datei für einen Vorschau-Server.
11. **Grenzen der Leser:** Der Leser für Quelltext ist kein Parser und der für die Seite kein HTML-Parser. Wo sie nicht sicher sind, behalten sie den Text, statt ihn fallen zu lassen: lieber ein Befund zu viel als ein blinder Wächter.

## Beispiel

```ts
import { nameSchema, syncFields } from '@onestrand/core';
import { createTableRegistry, defineTable } from '@onestrand/storage';
import { createTestContext, textProblems } from '@onestrand/testing';
import { expect, it } from 'vitest';
import { z } from 'zod';

const notesTable = defineTable({
  name: 'notes',
  schema: z.object({ ...syncFields, text: nameSchema(500) }),
  indexes: [],
  sensitivity: 'normal',
  sync: 'single_writer',
});
const REGISTER = createTableRegistry([notesTable]);

it('keeps two businesses apart', async () => {
  const one = await createTestContext({ registry: REGISTER });
  const two = await one.addBusiness();
  const before = await two.snapshot();

  const now = one.clock.now();
  await one.storage.table('notes').put({
    id: one.ids.next(),
    businessId: one.businessId,
    text: 'Schlüssel beim Empfang',
    createdAt: now,
    updatedAt: now,
  });

  expect(await two.snapshot()).toEqual(before);
});

it('speaks calmly, to one person', () => {
  const catalogue = { notes: { saved: 'Gesichert.', count: (n: number) => `${n} Notizen` } };
  expect(textProblems({ notes: catalogue })).toEqual([]);
});
```

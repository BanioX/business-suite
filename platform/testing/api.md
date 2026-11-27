# @onestrand/testing (P-13)

Was jedes Paket, jede Branche und jede Ausgabe im Test braucht: feste Uhr, fortlaufende Kennungen, ein schlanker Seed und die drei Standardtests (Texte, Nebenwirkungen, Sicherheit). Reines TypeScript ohne Browser und ohne Node; baut auf `@onestrand/core`, `@onestrand/contract` und `@onestrand/storage`, nie auf `@onestrand/ledger`. Das Paket gehört in Tests und Wächter, nie in ausgelieferten Code.

```ts
import { createTestContext, securityProblems, sideEffectRegisterProblems, textProblems } from '@onestrand/testing';
```

## Was das Paket exportiert

| Bereich | Exporte | Wozu |
| --- | --- | --- |
| Kennungen | `sequentialIds` | UUIDv7, die zählen: derselbe Test gibt immer dieselben Kennungen |
| Uhr | `fixedClock`, `TestClock`, `ClockStep` | steht still, bis der Test sie stellt: `setToday`, `setNow`, `advance` |
| Hasher | `testHasher`, `sha256Hex` | SHA-256 ohne Laufzeit, für Speicher, Sicherung und Prüfkette im Test |
| Seed | `createTestContext`, `TestContext`, `TestContextOptions`, `businessSnapshot`, `BusinessSnapshot` | ein Betrieb auf einem Speicher, weitere mit `addBusiness` |
| Befund | `StandardProblem` | `{ rule, message }`: was jeder Standardtest meldet |
| Texte | `textProblems`, `catalogueTexts`, `DE_CH_TEXT_RULES`, `DE_CH_OPENING_SIE_RULE`, `productNameRule`, `TextRule`, `TextProblem`, `CatalogueText`, `TextCheckOptions` | Sprachregeln über einen Textkatalog |
| Nebenwirkungen | `sideEffectRegisterProblems`, `SIDE_EFFECT_KINDS`, `REGISTER_COLUMNS`, `occurrences`, `parseRegister`, `registerProblems`, `sideEffectProblems`, `storageKeys`, `storageKeyProblems`, `withoutComments`, `SideEffectKind`, `SourceFile`, `RegisterRow`, `SideEffectProblem`, `SideEffectCheckOptions` | Code gegen `docs/nebenwirkungen.md` |
| Sicherheit | `securityProblems`, `headerProblems`, `htmlProblems`, `parseHeadersFile`, `SecurityProblem`, `PageExpectations`, `HeaderRule` | `_headers` und `index.html` gegen die Regeln der Suite |

## Regeln, die du kennen musst

1. **Seed:** `await createTestContext({ registry })` baut einen Speicher im Arbeitsspeicher für dein Tabellen-Register und legt genau einen Betrieb an: «Betrieb Muster». Die ersten drei Kennungen sind der Betrieb (`businessId`), die Inhaber:in (`ownerId`) und eine zweite Person (`secondPersonId`). **Die Personen sind nur Kennungen:** Die Personen-Tabelle kommt mit `@onestrand/business` (Auftrag W0-02); bis dahin speichert der Seed keine Zeile einer Person. `ctx` ist der `CommandContext` mit der Inhaber:in als `actor`, `actingAs(personId)` derselbe mit einer anderen Person, `cmd()` eine frische `commandId`.
2. **Optionen:** `today` (Starttag) oder `clock`, nie beide; `idStart` (Vorgabe 1); `name`; `hasher`; `storage` (ein Adapter im Test; seine Dateien bekommen Kennung und Zeit von seinen eigenen Ports, also gib ihm einen eigenen Kennungsbereich); `business: (base) => ({ ...base, currency: 'CHF' })`, wenn der Speicher mehr als `BusinessBase` hält. Ohne `business` kompiliert ein solcher Speicher nicht.
3. **Zweiter Betrieb:** `const other = await t.addBusiness()` legt «Betrieb Beispiel» auf **denselben** Speicher und dieselbe Uhr, mit eigenen zwei Personen und eigenem Kennungsbereich (je Betrieb 1’000’000 Kennungen Abstand). Für Trennungstests: `const before = await other.snapshot()`, im ersten Betrieb arbeiten oder ihn löschen, dann `expect(await other.snapshot()).toEqual(before)`.
4. **`snapshot()`** liefert alles, was der Speicher für einen Betrieb hält: `business`, `tables` (nach Register typisiert, weich gelöschte Zeilen inbegriffen, nach Kennung sortiert), `files` (mit Bytes) und `events` (in ihrer Reihenfolge). Das Befehlsprotokoll ist nicht dabei: Sein Port kann die Einträge eines Betriebs nicht auflisten.
5. **Uhr:** `fixedClock()` steht auf 14.11.2026, 10:00 UTC. Sie hält einen Zeitpunkt; `today()` ist dessen Kalendertag in der Schweiz, auch um Mitternacht und bei der Zeitumstellung. `setToday('2026-12-01')` springt auf 10:00 UTC des Tages, `setNow('2026-11-14T22:30:00.000Z')` auf einen Zeitpunkt, `advance({ hours, minutes, seconds, milliseconds })` geht vorwärts (zurück nur mit `setNow`).
6. **Hasher, ein Weg:** Tests nehmen `testHasher` (oder `t.hasher`). Er rechnet echtes SHA-256 in reinem TypeScript, ist gegen Node und gegen WebCrypto geprüft und braucht keine Laufzeit; `sha256Hex(bytes)` ist dasselbe ohne Promise. `createWebCryptoHasher(globalThis.crypto)` aus `@onestrand/storage` nimmt ein Test nur, wenn er den WebCrypto-Weg selbst prüft. Beide geben dieselben Prüfsummen.
7. **Ein Befehl nach dem anderen:** Der Speicher im Arbeitsspeicher kann überlappende Transaktionen nicht trennen (`@onestrand/storage`, Regel 7). Warte jeden Befehl ab, bevor du den nächsten startest.
8. **Standardtests geben Befunde zurück und werfen nie:** eine Liste von `{ rule, message, … }`; dein Test erwartet `toEqual([])`. `rule` ist eine Kennung, die sich nicht ändert; `message` ist englisch und sagt, was zu tun ist. Ein Test, der nichts liest (leerer Katalog, keine Quellen, leere Seite), meldet das als Befund und besteht nicht.
9. **Texte:** `textProblems(katalog, { rules?, productNames? })`. Der Katalog ist ein verschachtelter Record (auch Liste, `Map`, `Set`) aus Texten und Textfunktionen; von einer Funktion werden die Literale gelesen (`${n} Zeilen` wird «{} Zeilen»). Regeln für de-CH (`DE_CH_TEXT_RULES`): `empty` (leerer Text), `eszett`, `exclamation`, `plural_address` (ihr, euch, euer, eure…, auch «Ihr»), `formal_address` (Ihnen, Ihre…, «Sie» im Satz), `buzzword`, `pictograph` (Emoji). `product_name` meldet die Namen aus `productNames` als ganze Wörter; das Paket selbst kennt keinen Namen. `no_texts` meldet einen Katalog ohne Text. `DE_CH_OPENING_SIE_RULE` («Sie» am Satzanfang) nimmst du für Kataloge dazu, in denen kein Satz so beginnen soll. Regeln sind Daten (`{ id, pattern, message }`): Eine andere Sprache übergibt ihre Liste in `rules`. Nicht gesehen wird ein Text, der ausserhalb des Katalogs zusammengesetzt wird.
10. **Nebenwirkungen:** `sideEffectRegisterProblems(sources, registerText, { kinds?, storagePrefixes? })` mit `sources` als `{ path, code }[]`. Gib den Code, der ausgeliefert wird (`src` der Plattform, der Branchen und der Ausgaben, dazu die Build-Konfiguration), ohne Tests und **ohne `platform/testing`**: Dieses Paket nennt jede Art, um sie zu finden. Kommentare zählen nicht, Texte im Code zählen. Mit `storagePrefixes: ['sample']` muss jeder Schlüssel `'sample:…'` im Register stehen. Die Einzelteile (`occurrences`, `parseRegister`, `registerProblems`, `sideEffectProblems`, `storageKeyProblems`) gibt es für eigene Zusammenstellungen.
11. **Sicherheit:** `securityProblems({ headers, html }, { lang?, title? })`. Kopfzeilen: Die vier Richtlinien-Kopfzeilen stehen genau einmal, im Block für `/*`, und keine Zeile nimmt eine weg (`headers.path`, `headers.repeated`, `headers.line`); `Content-Security-Policy` mit `default-src`, `script-src`, `font-src`, `connect-src`, `base-uri`, `form-action` genau `'self'`, `object-src` und `frame-ancestors` genau `'none'`, sonst nur `'self'`, `'none'`, `data:`, `blob:` (für Stile und Skripte nie `data:` oder `blob:`), keine Direktive doppelt (`csp.*`); `X-Frame-Options: DENY`; `X-Robots-Tag` mit `noindex` und `nofollow`; `Permissions-Policy` mit `camera=(self)` oder `camera=()`, `microphone=()`, `geolocation=()`. Seite: `meta robots` mit `noindex, nofollow`, keine Adresse eines anderen Ursprungs (auch nicht im Text der Datei), kein Inline-Skript, -Stil oder -Handler, kein `meta refresh`, `lang` (Vorgabe `de-CH`) und, falls verlangt, der Titel. `parseHeadersFile` liest dieselbe Datei für den Vorschau-Server einer Ausgabe. Befunde der Seite: `robots.meta`, `html.address`, `html.encoded_address` (Adresse mit Zeichenreferenzen), `html.no_address` (die Seite lädt nichts), `html.inline_script`, `html.inline_style`, `html.inline_handler`, `html.refresh`, `html.lang`, `html.title`; der Kopfzeilen dazu `frame.options`, `robots.header`, `permissions.camera`, `permissions.microphone`, `permissions.geolocation`.

## Format des Registers (`docs/nebenwirkungen.md`)

Text und Überschriften sind frei; gelesen werden nur Tabellenzeilen. Das Register hat mindestens eine Tabelle, und jede beginnt mit genau diesem Kopf (`REGISTER_COLUMNS`):

```md
| Kennung | Nebenwirkung | Im Code | Wo | Daten verlassen das Gerät? | Entscheid | Seit |
| --- | --- | --- | --- | --- | --- | --- |
| SE-01 | Abruf der App-Dateien von der eigenen Adresse | – (macht der Browser) | `_headers` | nein, keine Betriebsdaten | ADR-0009 | geplant |
| SE-02 | localStorage `sample:last-backup`: Tag der letzten Sicherung | `localStorage` | `editions/sample/src/backup.ts` | nein | ADR-0009 | 02.12.2026 |
```

- **Zeile:** eine Nebenwirkung je Zeile, sieben Zellen; ein `|` in einer Zelle schreibst du `\|`. Jede Zeile einer solchen Tabelle beginnt mit ihrer Kennung. Eine Tabelle mit anderem Kopf gehört nicht zum Register; eine Zeile `SE-nn` darin ist ein Befund.
- **Kennung:** `SE-` und mindestens zwei Ziffern, im ganzen Dokument einmal.
- **Nebenwirkung, Wo:** freier Text. Speicher-Schlüssel stehen in Backticks irgendwo in der Zeile ihres Speichers.
- **Im Code:** die Arten, die die Zeile deckt, jede genau wie ihr Schlüssel und in Backticks; ohne Art ein Strich. Was hier in Backticks steht und kein Schlüssel ist, ist ein Befund (`register.kind`). Schlüssel: `fetch(`, `XMLHttpRequest`, `WebSocket` (auch WebTransport und RTCPeerConnection), `EventSource`, `sendBeacon`, `indexedDB`, `localStorage`, `sessionStorage`, `document.cookie`, `storage.persist`, `serviceWorker`, `getUserMedia`, `capture=`, `type="file"`, `geolocation`, `Notification`, `window.print`, `navigator.share`, `navigator.clipboard`, `window.open`, `download`, `createObjectURL`.
- **Daten verlassen das Gerät?:** beginnt klein mit `ja` oder `nein`, danach frei («nein, nur auf Tipp der Person»).
- **Entscheid:** nennt das ADR, das die Zeile trägt, als `ADR-NNNN` (vier Ziffern).
- **Seit:** ein Kalendertag `TT.MM.JJJJ`, den es gibt, oder `geplant`. **«geplant»** heisst: Die Zeile ist im Voraus eingetragen; ihre Arten dürfen im Code auftauchen, ohne dass das Register ändert. Der Test behandelt sie wie eine datierte Zeile und prüft nicht, ob die Art schon vorkommt; wer die Funktion baut, setzt das Datum.
- **Netz-Arten** (`fetch(`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`) sind nie mit einer gewöhnlichen Zeile freigegeben. Eine Zeile, die eine davon nennt, braucht `ja` und in «Entscheid» den Wortlaut `Alban, TT.MM.JJJJ` (ein Tag, den es gibt) samt `ADR-NNNN`, zum Beispiel `Alban, 02.12.2026, ADR-0012`. Kommt die Art im Code vor und fehlt eine solche Zeile, ist das `side_effect.request`. Ohne Albans Entscheid steht keine solche Zeile im Register.
- **Befunde:** `register.table` (keine Tabelle, falscher Kopf, Zeile `SE-nn` ausserhalb einer solchen Tabelle), `register.row` (Zeile ohne Kennung, falsche Zellenzahl, Kennung falsch oder doppelt, kein `ja`/`nein`, kein ADR, «Seit» falsch), `register.kind`, `register.request` (Netz-Zeile ohne `ja` oder ohne «Alban, TT.MM.JJJJ»), `side_effect.unregistered` (Art im Code, in keiner Zeile), `side_effect.request`, `side_effect.storage_key`, `side_effect.no_sources`.

## Beispiel

```ts
import { createCommandKit } from '@onestrand/contract';
import { createTableRegistry } from '@onestrand/storage';
import { createTestContext, securityProblems, sideEffectRegisterProblems, textProblems } from '@onestrand/testing';
import { expect, it } from 'vitest';
import { messages } from '../src/messages';
import { notesTable } from '../src/tables';

const REGISTER = createTableRegistry([notesTable]);

it('keeps two businesses apart', async () => {
  const t = await createTestContext({ registry: REGISTER });
  const other = await t.addBusiness(); // «Betrieb Beispiel», eigener Kennungsbereich
  const before = await other.snapshot();

  const now = t.clock.now();
  await t.storage
    .table('notes')
    .add({ id: t.ids.next(), businessId: t.businessId, text: 'Schlüssel abgeholt', createdAt: now, updatedAt: now });
  t.clock.advance({ minutes: 90 });
  await createCommandKit(t.actingAs(t.secondPersonId)).emit(t.businessId, 'note.added', {});

  expect((await t.snapshot()).tables.notes).toHaveLength(1);
  expect(await other.snapshot()).toEqual(before);
});

it('follows the rules of the suite', () => {
  expect(textProblems({ messages }, { productNames: FORBIDDEN_NAMES })).toEqual([]);
  // sources: { path, code }[] des ausgelieferten Codes; die Texte liest der Test oder der Wächter.
  expect(sideEffectRegisterProblems(sources, registerText, { storagePrefixes: ['sample'] })).toEqual([]);
  expect(securityProblems({ headers: headersText, html: indexHtml }, { title: 'Muster' })).toEqual([]);
});
```

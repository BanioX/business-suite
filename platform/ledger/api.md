# @onestrand/ledger (P-04)

Der Helfer «nur anfügen»: Einträge in einer Tabelle, die nie ersetzt werden, je Strang eine Prüfkette, Korrektur als neue Zeile, Zustand berechnet. Ein Kit für Zeit, Kassenbuch, Status eines Auftrags, Schlüssel und Mehrfachkarten. Reines TypeScript ohne Browser und ohne Node; baut auf `@onestrand/core`, `@onestrand/contract`, `@onestrand/storage` und `zod`.

```ts
import { createLedger, defineLedger, ledgerFields } from '@onestrand/ledger';
```

## Was das Paket exportiert

| Bereich | Exporte | Wozu |
| --- | --- | --- |
| Eintrag | `ledgerFields`, `LedgerEntrySchema`, `LedgerEntry`, `LedgerPayload`, `LEDGER_FIELD_NAMES`, `LedgerFieldName`, `LedgerStreamSchema`, `LEDGER_STREAM_PATTERN` | die Felder, die das Kit in jede Zeile schreibt; der Schlüssel eines Strangs |
| Ledger anmelden | `defineLedger`, `LedgerDefinition`, `LedgerOptions` | Tabelle, Anfangszustand und Regel |
| Ledger auf dem Speicher | `createLedger`, `createLedgerReader`, `Ledger`, `LedgerReader`, `LedgerContext`, `LedgerReaderContext`, `LedgerBooking`, `LedgerVerification`, `LedgerBusinessVerification` | buchen, korrigieren, lesen, Zustand rechnen, Kette prüfen |
| Zustand ohne Speicher | `foldLedger`, `effectiveEntries`, `inSequence` | aus Einträgen rechnen, die du schon hast |
| Prüfkette | `chainProblems`, `allChainProblems`, `LedgerProblem`, `LedgerProblemKind`, `LEDGER_PROBLEM_KINDS`, `LedgerChain`, `LedgerAnchor`, `entryHash`, `hashedContent`, `canonicalJson` | Zeilen prüfen, auch die einer Sicherung; Befunde sind Daten |
| Für den Test eigener Ledger | `ledgerInvariantProblems`, `LEDGER_INVARIANTS`, `LedgerInvariant`, `LedgerInvariantProblem`, `LedgerInvariantOptions` | dieselben Invarianten im eigenen Eigenschaftstest |
| Fehler | `LedgerError`, `LedgerErrorCode` | Fehler des Programms, mit Code |

## Regeln, die du kennen musst

1. **Tabelle:** `defineTable({ name, schema: z.object({ ...ledgerFields, <Nutzlast> }), indexes: [['stream', 'seq']], sensitivity, sync: 'ledger', appendOnly: true })`. Ohne `appendOnly` weist `defineLedger` die Tabelle ab. Das Kit schreibt `id`, `businessId`, `stream`, `seq`, `prevHash`, `hash`, `at`, `actor` und `corrects`; die Nutzlast trägt keines davon. `at` ist der Zeitpunkt des Schreibens; der Tag, zu dem eine Tatsache gehört, ist ein Feld der Nutzlast.
2. **Strang (`stream`):** welche Kette im Betrieb gemeint ist: die Kennung dessen, worum es geht (Konto, Person, Auftrag), oder ein festes technisches Wort (`main`). Klein, Ziffern und `_ . : -`, höchstens 120 Zeichen, nie ein Text einer Person. `seq` zählt je Betrieb und Strang ab 1, ohne Lücke.
3. **Buchen gehört in einen Befehl:** `append` und `correct` laufen in einer Transaktion und lesen darin das Ende der Kette; in `runCommand` schliessen sie sich der Transaktion des Befehls an. Das Ereignis schreibt der Befehl. Buchungen auf dieselbe Tabelle warten aufeinander, auch wenn du sie zusammen startest (`Promise.all`): Nie bekommen zwei denselben Platz.
4. **Nutzlast:** `LedgerPayload<Eintrag>` ist die Zeile ohne die Felder des Kits, so wie das Schema sie zurückgibt (ein Feld mit Vorgabewert verlangt der Typ trotzdem). Gespeichert wird, was das Schema liest (Text gekürzt), und darüber läuft die Prüfsumme. Ein Feld, das das Schema nicht kennt, wird abgewiesen statt still weggelassen, in jeder Tiefe (`invalid_payload`). Passt die Nutzlast nicht zum Schema, kommt ein `ZodError`: Prüfe die Eingabe schon im Befehl.
5. **Das Schema liest wieder, was es schrieb:** Ein `transform`, der beim zweiten Lesen nochmals wirkt (Franken zu Rappen), wird bei der ersten Buchung abgewiesen (`invalid_definition`). Sonst käme der Eintrag aus einer Sicherung verändert zurück und passte nicht mehr zu seiner Prüfsumme.
6. **Regel (`reduce`):** eine reine Funktion `(state, entry) => state`. Sie ändert weder den Zustand noch den Eintrag (beim Buchen kommt der neue Eintrag eingefroren; `initial` ist eingefroren). Sie darf ablehnen: `throw new CommandError('<namensraum>.<code>', …)`, dann ist nichts geschrieben. In einem Befehl scheitert damit der ganze Befehl, auch wenn du den Fehler fängst; frag vorher `state`, wenn du nur wissen willst, ob es ginge.
7. **Korrektur:** `correct(businessId, entryId, payload)` schreibt einen neuen Eintrag ans Ende desselben Strangs, mit `corrects`. Die Nutzlast ist die ganze Tatsache, kein Unterschied. Der alte Eintrag bleibt, wie er ist. Für den Zustand steht die Korrektur am Platz des alten Eintrags (`effectiveEntries`), als wäre von Anfang an richtig gebucht worden. Ein Eintrag wird einmal korrigiert; danach korrigierst du die Korrektur (`not_allowed`), damit niemand eine Korrektur überschreibt, ohne sie gesehen zu haben. `not_found` gilt auch für den Eintrag eines anderen Betriebs. Stornieren ist eine Korrektur mit einer Nutzlast, die für die Regel nichts zählt.
8. **Zustand:** `state(businessId, stream)` rechnet bei jedem Aufruf aus den Einträgen und speichert nichts. Ein Strang ohne Einträge hat `initial`. `state` prüft die Kette nicht, und Lesen prüft den Schlüssel des Strangs nicht.
9. **Prüfkette:** `hash` ist SHA-256 über das kanonische JSON des Eintrags ohne `hash`: Schlüssel in jeder Tiefe sortiert, keine Leerzeichen, Zahlen wie JSON sie schreibt (RFC 8785). Darin stehen `seq`, `prevHash`, `businessId`, `stream` und jedes Feld, auch eines, das kein Schema kennt. `verify(businessId, stream)` gibt `{ ok: true, entries, head }` oder `{ ok: false, entries, problems }`; `verifyAll(businessId)` prüft jede Zeile der Tabelle und findet auch eine Zeile ohne Strang. Gefunden wird: ein geändertes Feld (auch unbekannt, auch verschachtelt), ein entfernter Eintrag am Anfang oder mitten in der Kette, vertauschte Reihenfolge, ein eingefügter Eintrag, ein geändertes `seq` oder `prevHash`, ein Eintrag in fremdem Strang oder Betrieb, eine zweite Korrektur.
10. **Was die Kette allein nicht sieht:** dass am Ende Einträge fehlen (auch der letzte), dass ein ganzer Strang fehlt, und dass jemand die Kette ab einem Eintrag mit neuen Prüfsummen neu geschrieben hat; beim letzten Eintrag genügt dafür eine einzige Zeile. Die Kette hat kein Geheimnis: Sie zeigt Versehen und Schäden, sie beweist nichts gegen jemanden, der die Tabelle schreiben kann und die Regel kennt. Dafür braucht es einen **Anker**: `head` (`{ seq, hash }`) ausserhalb der Tabelle festhalten (Abschluss auf Papier, Sicherung, anderes Gerät) und später `verify(businessId, stream, anchor)` rufen. Das Kit speichert keinen Anker; ein Anker sagt nichts über Einträge nach ihm.
11. **Ein Schreiber je Strang:** Schreiben zwei Geräte in denselben Strang, entsteht derselbe Platz zweimal, und `verify` meldet es. Einträge reisen darum als Befehle zum Gerät, das die Kette führt, nicht als Zeilen (ADR-0006).
12. **Sicherung:** Ledger-Tabellen sind Tabellen und kommen mit. Ein Eintrag einer neueren Fassung behält sein unbekanntes Feld und seine Prüfsumme. Prüfe nach dem Zurückholen mit `verifyAll`, oder vorher die Zeilen der Datei mit `allChainProblems(hasher, rows)`.
13. **Hasher und Transaktion:** Die Prüfsumme wird in der Transaktion gerechnet, nach dem Lesen des Kettenendes. Die Ausgabe übergibt einen Speicher und einen Hasher, die die Transaktion der Datenbank dabei offen halten, oder einen Hasher, der ohne Pause antwortet.
14. **Nur lesen:** `createLedgerReader(ledger, { storage, hasher })` für Abfragen und Berichte. `entries` kommt in der Reihenfolge der Kette, mit korrigierten Einträgen und ihren Korrekturen; `effectiveEntries` nimmt die, die zählen.
15. **Fehler:** `LedgerError` trägt einen `code` (`invalid_definition`, `invalid_stream`, `invalid_payload`) und meint einen Fehler des Programms. `CommandError` kommt aus `correct` und aus deiner Regel.
16. **Im Test deines Ledgers:** beliebige Buchungsfolgen buchen (fast-check im eigenen Test), dann `expect(await ledgerInvariantProblems(ledger, hasher, rows, { before })).toEqual([])`. Geprüft wird: Jede Zeile passt zum Schema und kommt unverändert aus einer Sicherung zurück (`schema`), jede Kette hält (`chain`), die Regel nimmt jede gespeicherte Kette an, ändert weder Zustand noch Eintrag und rechnet zweimal dasselbe (`fold`), und was vorher da war, ist unverändert da (`history`).

## Beispiel

```ts
import { command, commandBase, CommandError, createCommandKit, type CommandContext } from '@onestrand/contract';
import { IdSchema, LocalDateSchema, rappen, RappenSchema, type Rappen } from '@onestrand/core';
import { defineTable, type Hasher, type ModuleStorage } from '@onestrand/storage';
import { createLedger, defineLedger, ledgerFields, LedgerStreamSchema } from '@onestrand/ledger';
import { z } from 'zod';

// Die Zeile: die Felder des Kits und die Nutzlast.
const CashEntrySchema = z.object({ ...ledgerFields, on: LocalDateSchema, amount: RappenSchema });
type CashEntry = z.infer<typeof CashEntrySchema>;

export const cashEntriesTable = defineTable({
  name: 'cash_entries',
  schema: CashEntrySchema,
  indexes: [['stream', 'seq']],
  sensitivity: 'internal',
  sync: 'ledger',
  appendOnly: true,
});

// Das Ledger: Der Zustand ist der Saldo, und die Regel lässt ihn nie unter null fallen.
export const cashLedger = defineLedger<CashEntry, { balance: Rappen }>({
  table: cashEntriesTable,
  initial: { balance: rappen(0) },
  reduce: (state, entry) => {
    const balance = rappen(state.balance + entry.amount);
    if (balance < 0) {
      throw new CommandError('cash.overdrawn', `Entry ${entry.id} takes the cash below zero`);
    }
    return { balance };
  },
});

const book = command({
  name: 'cash.book',
  summary: 'Books an amount into or out of a cash book.',
  access: { feature: 'cash', level: 'operate' },
  input: z.object({ ...commandBase, stream: LedgerStreamSchema, on: LocalDateSchema, amount: RappenSchema }),
  output: z.object({ entryId: IdSchema, balance: RappenSchema }),
});

interface CashContext extends CommandContext {
  storage: ModuleStorage;
  hasher: Hasher;
}

// Im Use Case: Buchen gehört in einen Befehl.
export function createCashUseCases(ctx: CashContext) {
  const { emit, runCommand } = createCommandKit(ctx);
  const cash = createLedger(cashLedger, ctx);
  return {
    cash,
    'cash.book': async (raw: unknown) => {
      const input = book.input.parse(raw);
      return runCommand(book, input, async () => {
        const { businessId, stream, on, amount } = input;
        const { entry, state } = await cash.append(businessId, stream, { on, amount });
        await emit(businessId, 'cash_entry.booked', { entryId: entry.id });
        return { entryId: entry.id, balance: state.balance };
      });
    },
  };
}

// Lesen und prüfen (Abfrage, Bericht, Seite «Daten»).
const { cash } = createCashUseCases(ctx);
const { balance } = await cash.state(businessId, 'main'); // gerechnet, nie gespeichert
const check = await cash.verify(businessId, 'main'); // { ok: true, entries, head } oder { ok: false, entries, problems }
```

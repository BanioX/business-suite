# @onestrand/ledger (P-04)

Das Ledger-Kit der Suite: Einträge nur anfügen, mit Prüfkette, Korrektur als neue Zeile und einem Zustand, der berechnet und nie gespeichert wird. Reines TypeScript ohne Browser und ohne Node; baut auf `@onestrand/core`, `@onestrand/contract`, `@onestrand/storage` und `zod`. Die Plattform kennt kein einzelnes Ledger: Zeit, Kassenbuch, Status eines Auftrags oder ausgegebene Schlüssel bringt das Modul oder die Branche mit.

```ts
import { createLedger, defineLedger, ledgerFields, ledgerInvariantProblems } from '@onestrand/ledger';
```

## Was das Paket exportiert

| Bereich | Exporte | Wozu |
| --- | --- | --- |
| Eintrag | `ledgerFields`, `LedgerEntrySchema`, `LedgerEntry`, `LedgerPayload`, `LEDGER_FIELD_NAMES`, `LedgerFieldName`, `LedgerStreamSchema`, `LEDGER_STREAM_PATTERN` | die Felder, die das Kit in jede Zeile schreibt; die Nutzlast ist der Rest |
| Prüfsumme | `canonicalJson`, `hashedContent`, `entryHash`, `inSequence` | die eine Schreibweise eines Werts (RFC 8785) und die Prüfsumme darüber |
| Ledger | `defineLedger`, `LedgerDefinition`, `LedgerOptions` | Tabelle, Anfangszustand und Regel `reduce` |
| Zustand | `effectiveEntries`, `foldLedger` | die Einträge, die zählen, und der Zustand daraus |
| Kette prüfen | `chainProblems`, `allChainProblems`, `LedgerProblem`, `LedgerProblemKind`, `LEDGER_PROBLEM_KINDS`, `LedgerChain`, `LedgerAnchor` | wo und warum eine Kette bricht; Befunde sind Daten |
| Kit auf dem Speicher | `createLedger`, `createLedgerReader`, `Ledger`, `LedgerReader`, `LedgerBooking`, `LedgerContext`, `LedgerReaderContext`, `LedgerVerification`, `LedgerBusinessVerification` | anfügen, korrigieren, lesen, Zustand, prüfen |
| Eigenschaftstest | `ledgerInvariantProblems`, `LEDGER_INVARIANTS`, `LedgerInvariant`, `LedgerInvariantProblem`, `LedgerInvariantOptions` | was für jedes Ledger gelten muss, als Prüfung für den Test des Moduls |
| Fehler | `LedgerError`, `LedgerErrorCode` | Fehler des Programms, mit Code |

## Regeln, die du kennen musst

1. **Tabelle:** `defineTable({ …, appendOnly: true })` mit dem Schema `z.object({ ...ledgerFields, <Nutzlast> })`. In der Regel `sync: 'ledger'`. Ohne `appendOnly` oder ohne ein Feld aus `ledgerFields` wirft `defineLedger` (`invalid_definition`).
2. **Kette:** Eine Kette ist ein Strang (`stream`) eines Betriebs. Jeder Eintrag trägt seinen Platz (`seq`, ab 1 ohne Lücke), die Prüfsumme des Eintrags davor (`prevHash`) und die eigene (`hash`, SHA-256 über das kanonische JSON der ganzen Zeile ohne `hash`). Auch ein Feld, das das Schema nicht kennt, gehört zur Prüfsumme.
3. **Strang:** klein, Ziffern und `_ . : -`, höchstens 120 Zeichen (`LEDGER_STREAM_PATTERN`): meist die Kennung dessen, worum es geht (Konto, Person, Objekt), oder ein festes technisches Wort. Nie ein Text, den eine Person tippt.
4. **Nutzlast:** `append` und `correct` nehmen nur die Felder des Ledgers. Trägt die Nutzlast ein Feld des Kits (`id`, `seq`, `hash` …), kommt `invalid_payload`. `at` ist der Zeitpunkt des Schreibens; der Tag, zu dem ein Fakt gehört, ist ein Feld der Nutzlast.
5. **Das Schema lässt gespeicherte Zeilen, wie sie sind:** kein Vorgabewert und kein Umschreiben in der Tabelle eines Ledgers, sonst stimmt die Prüfsumme nach dem Zurückholen einer Sicherung nicht mehr. Ändert das Schema ein Feld des Kits, wirft `append` (`invalid_definition`); den Rest findet die Invariante `schema`.
6. **`reduce` ist rein:** Es gibt einen neuen Zustand zurück und ändert weder den Zustand noch den Eintrag. Es darf einen Eintrag abweisen, indem es einen `CommandError` mit einem Code seines Moduls wirft; dann wird nichts geschrieben. Der Anfangszustand wird in jeder Tiefe eingefroren.
7. **Korrektur:** `correct(businessId, entryId, payload)` schreibt einen neuen Eintrag ans Ende desselben Strangs; die Nutzlast ist der ganze Fakt, wie er hätte sein sollen, kein Unterschied. Für den Zustand steht die Korrektur am Platz des korrigierten Eintrags (`effectiveEntries`), der alte bleibt sichtbar. Ein Eintrag wird einmal korrigiert; wer nochmals ändert, korrigiert die Korrektur (`not_allowed` sonst, `not_found` für einen fremden oder fehlenden Eintrag).
8. **Schreiben gehört in einen Befehl:** `append` und `correct` laufen in `runCommand` der Schnittstelle. Der Befehl gibt die Transaktion, macht die Buchung wiederholbar und schreibt das Ereignis. Der `hasher` wird in der Transaktion abgewartet: Wer eine Ausgabe zusammensetzt, gibt einen Hasher mit, der die Transaktion offen hält oder ohne Pause antwortet.
9. **Ein Gerät schreibt eine Kette:** Fügen zwei Geräte demselben Strang an, tragen zwei Einträge dieselbe `seq`; `verify` meldet das. Der Abgleich zwischen Geräten kommt mit Welle 3.
10. **Zustand:** `state(businessId, stream)` rechnet bei jedem Aufruf aus den Einträgen und speichert nichts. Die Kette wird dabei nicht geprüft.
11. **Prüfen:** `verify(businessId, stream, anchor?)` prüft eine Kette, `verifyAll(businessId)` jede Zeile eines Betriebs in diesem Ledger. Gefunden werden ein geändertes Feld, ein entfernter oder eingeschobener Eintrag, eine geänderte Reihenfolge und ein Eintrag in einem anderen Strang oder Betrieb. Befunde tragen eine Art (`entry`, `business`, `stream`, `seq`, `prev_hash`, `hash`, `corrects`, `anchor`) und den Platz.
12. **Anker:** Eine Kette allein zeigt nicht, dass am Ende Einträge fehlen oder dass sie von einer Stelle an neu geschrieben wurde. Beides zeigt sich gegen einen Anker: `head` aus einem früheren `verify`, ausserhalb der Tabelle notiert (auf einem gedruckten Abschluss, in einer Sicherung, auf einem anderen Gerät).
13. **Sicherung:** Die Zeilen einer Ledger-Tabelle prüft `allChainProblems(hasher, rows)`, bevor eine Sicherung zurückkommt, etwa in `validate` des Sicherungs-Kits.
14. **Eigenschaftstest des Moduls:** Buche beliebige Folgen und erwarte `ledgerInvariantProblems(definition, hasher, rows, { before })` als `[]`. Geprüft wird: jede Zeile passt zum Schema und bleibt dabei unverändert (`schema`), jede Kette hält (`chain`), `reduce` nimmt jede gespeicherte Kette an, ändert nichts und gibt für dieselben Einträge denselben Zustand (`fold`), und jeder frühere Eintrag ist unverändert noch da (`history`). Ist der Zustand keine reinen Daten, gib `sameState` mit.
15. **Fehler:** `LedgerError` trägt einen `code` (`invalid_definition`, `invalid_stream`, `invalid_payload`) und meint einen Fehler des Programms. Was die Person beheben kann, ist ein `CommandError`; eine Nutzlast, die nicht zum Schema passt, ist ein `ZodError`: Prüfe Eingaben im Use Case.

## Beispiel

```ts
import { CommandError } from '@onestrand/contract';
import { rappen, RappenSchema, type Id, type Rappen } from '@onestrand/core';
import { createLedger, defineLedger, ledgerFields, type LedgerContext } from '@onestrand/ledger';
import { defineTable } from '@onestrand/storage';
import { z } from 'zod';

// Ein Modul meldet die Tabelle und das Ledger an.
const CashEntrySchema = z.object({ ...ledgerFields, amount: RappenSchema });
type CashEntry = z.infer<typeof CashEntrySchema>;

export const cashEntriesTable = defineTable({
  name: 'cash_entries',
  schema: CashEntrySchema,
  indexes: [['stream', 'seq']],
  sensitivity: 'internal',
  sync: 'ledger',
  appendOnly: true,
});

export const cashLedger = defineLedger<CashEntry, { balance: Rappen }>({
  table: cashEntriesTable,
  initial: { balance: rappen(0) },
  reduce: (state, entry) => {
    const balance = rappen(state.balance + entry.amount);
    if (balance < 0) {
      throw new CommandError('cash.overdrawn', `Booking ${entry.id} would take the cash below zero`);
    }
    return { balance };
  },
});

// Im Use Case, innerhalb von runCommand: `ctx` ist der Kontext des Befehls samt Hasher.
export async function bookCash(ctx: LedgerContext, businessId: Id, amount: Rappen) {
  const cash = createLedger(cashLedger, ctx);
  const { entry, state } = await cash.append(businessId, 'cash', { amount });
  return { entryId: entry.id, balance: state.balance }; // berechnet, nie gespeichert
}

// Für einen Abschluss: prüfen und den Anker notieren.
export async function closeCash(ctx: LedgerContext, businessId: Id) {
  const result = await createLedger(cashLedger, ctx).verify(businessId, 'cash');
  return result.ok ? result.head : result.problems; // { seq, hash } oder die Befunde
}
```

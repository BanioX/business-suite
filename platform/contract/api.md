# @onestrand/contract (P-02)

Die Schnittstelle der Suite: Operation (Befehl oder Abfrage), Ereignis, Fehler und das Befehls-Kit. Reines TypeScript ohne Browser und ohne Node; baut auf `@onestrand/core` und `zod`. Die Oberfläche ruft nur Operationen auf, jede Änderung erzeugt ein Ereignis, jede Operation erklärt ihr Recht.

```ts
import { command, commandBase, CommandError, createCommandKit } from '@onestrand/contract';
```

Immer über den Paketnamen importieren. Die **Summe** der Schnittstelle steht nicht hier: Jedes Modul und jede Branche besitzt ihr Fragment, die Ausgabe setzt sie zusammen (`composeContract`, Auftrag W0-02).

## Was das Paket exportiert

| Bereich | Exporte | Wozu |
| --- | --- | --- |
| Operation | `command`, `query`, `commandBase`, `queryBase`, `Operation`, `CommandOperation`, `QueryOperation`, `CommandBase`, `QueryBase`, `ContractFragment`, `OPERATION_NAME_PATTERN` | eine Operation anmelden: Name, Art, Beschreibung, Recht, Schemas |
| Recht | `OperationAccess`, `AccessLevel`, `ACCESS_LEVELS` | Funktion, Stufe und heikle Rechte als Daten an der Operation |
| Typen über ein Fragment | `OperationInput`, `OperationOutput`, `UseCase`, `UseCasesOf`, `CommandNames`, `QueryNames` | Use Cases typisieren; fehlt einer, kompiliert es nicht |
| Prüfen | `operationProblems`, `assertOperation`, `fragmentProblems`, `operationSchemaProblems`, `OperationProblem`, `OperationProblemPart` | Konformität zur Laufzeit; Befunde sind Daten |
| JSON Schema | `contractJsonSchemas`, `operationJsonSchema`, `OperationJsonSchema`, `JsonSchema` | die Schnittstelle als Daten, für eine spätere API und für Werkzeuge |
| Ereignis | `DomainEventSchema`, `DomainEvent` | `ding.was_geschah`, mit Person und Zeit |
| Fehler | `CommandError`, `PLATFORM_ERROR_CODES`, `isCommandErrorCode`, `NAMESPACED_ERROR_CODE_PATTERN`, `CommandErrorCode`, `PlatformErrorCode`, `NamespacedErrorCode` | Fehler mit Code; die Oberfläche macht daraus einen Satz |
| Ports | `Clock`, `IdGenerator`, `CommandLog`, `CommandLogEntry`, `EventLog`, `Transactional`, `CommandStorage`, `CommandContext` | was ein Befehl von aussen braucht; `@onestrand/storage` reicht sie weiter und ergänzt die Tabellen |
| Befehls-Kit | `createCommandKit`, `CommandKit` | Transaktion, `commandId`, Ereignisse, Zeitstempel |

## Regeln, die du kennen musst

1. **Name:** `<namensraum>.<verb>` oder `<namensraum>.<bereich>.<verb>`, zwei bis vier Teile aus Buchstaben und Ziffern, jeder beginnt klein: `customers.create`, `facility.keys.issue`. Der Schlüssel im Fragment ist der Name. Namensräume vergibt der Kopf im Namensregister.
2. **`access` ist Pflicht:** `{ feature, level, rights? }`. `feature` ist die Kennung der Funktion im Register, `level` eine von `view` (sehen), `operate` (bedienen), `manage` (verwalten), `rights` nennt heikle Rechte. Ohne `access` kompiliert die Operation nicht. Ein Befehl braucht mindestens `operate`. Ein unbekanntes Feld in `access` ist ein Befund, damit ein Tippfehler kein Recht still fallen lässt.
3. **Basisfelder:** Jeder Befehl trägt `commandId` und `businessId` (`...commandBase`), jede Abfrage `businessId` (`...queryBase`). `command` und `query` verlangen das schon im Typ.
4. **`summary`** ist englisch und technisch: Daraus wird später die Beschreibung einer API oder eines Werkzeugs. Es ist nie ein Text der App; Texte leben in den Sprachkatalogen.
5. **Schemas bleiben als JSON Schema darstellbar:** kein `z.date()`, kein `bigint`, keine `Map`; in der Ausgabe kein `transform` und kein `z.void()`. Ein Befehl ohne Ergebnis gibt `z.object({})` zurück.
6. **Ein Befehl läuft durch `runCommand(operation, input, execute)`:** eine Transaktion für alles, was `execute` schreibt, für die Ereignisse und für den Eintrag im Befehlsprotokoll. Kommt dieselbe `commandId` nochmals, läuft `execute` nicht mehr, und das gespeicherte Ergebnis kommt zurück. Eine `commandId`, die schon für eine andere Operation oder einen anderen Betrieb steht, ergibt `CommandError('invalid')`. Das Ergebnis wird mit dem Ausgabe-Schema geprüft, bevor es gespeichert wird; passt es nicht, ist der ganze Befehl ungeschehen. Eine Abfrage weist `runCommand` ab.
7. **In der Transaktion nur Aufrufe des Speichers abwarten**, kein Netz und keine Timer: Die Datenbank des Browsers beendet die Transaktion sonst. Transaktionen, die nicht ineinander liegen, überlappen sich nicht: Die Datenbank lässt die zweite warten. Der Speicher im Arbeitsspeicher kann das nicht unterscheiden; im Test wartest du einen Befehl ab, bevor du den nächsten startest.
8. **Ereignis:** Jeder Befehl ruft mindestens einmal `emit(businessId, 'ding.was_geschah', payload)`. Der Typ steht in der Vergangenheit, klein und mit Unterstrich (`customer.created`, `facility_key.issued`). Die Nutzlast trägt Kennungen und kleine Fakten, nie ganze Zeilen und nie Dateien.
9. **Fehler:** `throw new CommandError(code, message)`. Codes der Plattform: `not_found`, `invalid`, `duplicate_name`, `in_use`, `not_allowed`, `forbidden` (kein Recht; setzt die Hülle für `access`). Eigene Codes tragen den Namensraum: `'<namensraum>.<code>'`, zum Beispiel `stock.insufficient` (Namensraum wie bei den Operationen, ein Punkt, Code klein mit Unterstrich). Alles andere wird abgewiesen: Der Typ verlangt den Punkt, die genaue Form prüft die Laufzeit, und ein falscher Code wirft dort einen `TypeError` statt des gemeinten Fehlers. Halte die Codes eines Moduls darum in einer Liste und prüfe sie im Test mit `isCommandErrorCode`. `message` ist englisch, für Protokoll und Tests; den Satz für die Person schreibt der Sprachkatalog zum Code.
10. **Konformität im Test:** `fragmentProblems(fragment)` prüft Name, Art, Beschreibung, `access` und Schemas jeder Operation und dass der Schlüssel der Name ist; `operationSchemaProblems(operation)` prüft, dass beide Schemas als JSON Schema gehen und die Basisfelder verlangt sind. Beide geben eine Liste zurück und werfen nie; der Test erwartet `[]`. Stimmt die Form einer Operation nicht, meldet `operationSchemaProblems` diese Befunde und schaut die Schemas erst an, wenn die Form stimmt.

## Beispiel

```ts
import { IdSchema, nameSchema, syncFields, type Id } from '@onestrand/core';
import {
  command, commandBase, CommandError, createCommandKit, fragmentProblems, query, queryBase,
  type CommandContext, type ContractFragment, type UseCasesOf,
} from '@onestrand/contract';
import { z } from 'zod';

const NoteSchema = z.object({ ...syncFields, text: nameSchema(500) });
type Note = z.infer<typeof NoteSchema>;

// Fragment eines Moduls: Schlüssel und Name sind gleich.
export const notesContract = {
  'notes.add': command({
    name: 'notes.add',
    summary: 'Adds a note to the business.',
    access: { feature: 'notes', level: 'operate' },
    input: z.object({ ...commandBase, text: nameSchema(500) }),
    output: z.object({ note: NoteSchema }),
  }),
  'notes.get': query({
    name: 'notes.get',
    summary: 'Reads one note of the business.',
    access: { feature: 'notes', level: 'view' },
    input: z.object({ ...queryBase, noteId: IdSchema }),
    output: z.object({ note: NoteSchema }),
  }),
} as const satisfies ContractFragment;

// Use Cases: Der Typ verlangt eine Umsetzung für jede Operation des Fragments.
export function createNotesUseCases(
  ctx: CommandContext,
  // Im Modul ist das eine Tabelle aus @onestrand/storage.
  notes: { get: (id: Id) => Promise<Note | undefined>; put: (note: Note) => Promise<void> },
): UseCasesOf<typeof notesContract> {
  const { emit, runCommand, stamps } = createCommandKit(ctx);
  return {
    'notes.add': async (raw) => {
      const input = notesContract['notes.add'].input.parse(raw);
      return runCommand(notesContract['notes.add'], input, async () => {
        const { businessId, text } = input;
        const note = { id: ctx.ids.next(), businessId, text, ...stamps() };
        await notes.put(note);
        await emit(input.businessId, 'note.added', { noteId: note.id });
        return { note };
      });
    },
    'notes.get': async (raw) => {
      const input = notesContract['notes.get'].input.parse(raw);
      const note = await notes.get(input.noteId);
      if (note?.businessId !== input.businessId) {
        throw new CommandError('not_found', `Note ${input.noteId} not found`);
      }
      return { note };
    },
  };
}

// Im Test des Moduls:
fragmentProblems(notesContract); // []
```

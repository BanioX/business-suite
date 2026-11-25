# @onestrand/manifest (P-02, P-12)

Die Manifeste und das Zusammensetzen: Eine Branche, ein Modul der Plattform und eine Ausgabe erklären sich als Daten, die Plattform setzt daraus zusammen, was sonst von Hand verdrahtet wäre (Tabellen, Register der Funktionen und der Rechte, Schnittstelle, Use Cases hinter der Hülle für die Rechte, Sicherung, Texte, Lexikon). Reines TypeScript ohne Browser und ohne Node; baut auf `@onestrand/core`, `@onestrand/contract`, `@onestrand/storage`, `@onestrand/features`, `@onestrand/access`, `@onestrand/business` und `@onestrand/i18n`. Grundlage sind [ADR-0004](../../docs/adr/0004-andocken-einer-branche.md) und [ADR-0008](../../docs/adr/0008-herkunft-namen-und-adressen.md). Die React-Hälfte (`defineIndustryWeb`: Routen, Navigation, Seiten) kommt mit W0-03; hier stehen nur die Typen der Steckplätze.

```ts
import { composeEdition, defineEdition, defineIndustry, editionProblems, startEdition } from '@onestrand/manifest';
```

## Was das Paket exportiert

| Bereich | Exporte | Wozu |
| --- | --- | --- |
| Branche | `defineIndustry`, `industryProblems`, `Industry`, `IndustryInput`, `INDUSTRY_ID_PATTERN` | eine Branche erklären: Tabellen, Schnittstelle, Use Cases, Register-Einträge, Rechte, Ereignisse, Vorlagen, Regelwerke, Demo, Migrationen |
| Modul | `defineModule`, `moduleProblems`, `Module`, `ModuleInput`, `businessModule` | ein Modul der Plattform erklären; `businessModule` ist das Modul `@onestrand/business`, das jede Ausgabe hat |
| Use Cases | `UseCaseFactory`, `UseCaseEnvironment`, `AnyUseCases` | wie ein Teil seine Use Cases baut und was er dafür bekommt |
| Inhalt einer Branche | `TemplateInput`, `TemplateDefinition`, `RuleSetInput`, `RuleSetDefinition`, `DemoInput`, `DemoDefinition`, `MigrationInput`, `MigrationDefinition`, `PlainRecord` | die kleinste Form für Vorlage, Regelwerk (mit Pflichtquelle), Demo-Betrieb und Migration |
| Ausgabe | `defineEdition`, `editionInputProblems`, `Edition`, `EditionInput` | die Ausgabe als Daten: eingefrorene Namen, Branchen, Module, Sprachen, Lexikon |
| Zusammensetzen | `composeEdition`, `ComposedEdition` | aus der Ausgabe: Tabellen-Register, Register der Funktionen und der Rechte, Schnittstelle, Katalog, Lexikon |
| Starten | `startEdition`, `EditionRuntime`, `RunningEdition` | die Ausgabe auf einem Speicher mit Uhr, IDs und Hasher: geschützte Use Cases und Sicherungs-Kit |
| Konformität | `editionProblems`, `EditionProblem`, `EditionPart`, `EDITION_PARTS` | alles, was an einer Ausgabe nicht stimmt, als Daten |
| Fehler | `ManifestError`, `ManifestProblem`, `ManifestPart`, `ManifestProblemCode`, `MANIFEST_PROBLEM_CODES`, `EditionError` | Fehler des Programms, mit Code |
| Steckplätze | `SLOT_IDS`, `SLOT_PAGES`, `SlotId`, `SlotPage`, `SlotEntry`, `SectionSlotEntry`, `SlotEntries`, `availableSlotEntries` | die Typen der Steckplätze und die Regel «keine Einstiege für eine ausgeschaltete Funktion» |

## Regeln, die du kennen musst

1. **Drei Manifeste, alle nur Daten.** `defineModule` (Plattform), `defineIndustry` (Branche) und `defineEdition` (Ausgabe) prüfen, was sie bekommen, und geben es eingefroren zurück. Sie werfen einen `ManifestError` mit dem Code des ersten Befunds; `moduleProblems`, `industryProblems` und `editionInputProblems` geben jeden Befund als Daten zurück und werfen nie. Ein Objekt, das so aussieht wie ein Manifest, aber nicht von `defineX` stammt, nimmt die Ausgabe nicht (`invalid_entry`). Ein Feld, das das Manifest nicht hat, ist ein Befund: ein Tippfehler lässt keine Einstellung still fallen.
2. **Was eine Branche erklärt** (`defineIndustry`; Pflicht: `id`, `tables`, `contract`, `useCases`, `catalog`):
   - `id`: Kleinbuchstaben und Ziffern (`INDUSTRY_ID_PATTERN`), denn sie ist Präfix von Tabellen, Operationen und Ereignissen.
   - `tables`: eigene Tabellen (`defineTable` aus `@onestrand/storage`).
   - `contract`: ihr Fragment der Schnittstelle. Jede Operation sagt Funktion, Stufe und Rechte (`access`); ohne `access` ist es ein Befund (`invalid_entry`, Teil `contract`).
   - `useCases`: `(env) => UseCasesOf<typeof contract>`. **Fehlt für eine Operation ein Use Case, kompiliert es nicht**; ein Use Case zu viel meldet `editionProblems` (`extra_use_case`), denn der Typ sieht ihn nicht. `env` ist `{ ctx, features, rights }`: `ctx` ist der Kontext eines Befehls mit dem ganzen Speicher (`BusinessContext`), `features` und `rights` sind die Register der Ausgabe. Module rufen einander nicht auf (Architektur 3.2, Regel 3): Was sie verbindet, ist ein Port, den die Ausgabe einsteckt.
   - `catalog`: `FeatureEntries` für das Register der Funktionen: Module (`groups`), Funktionen, Betriebsarten (`kinds`), Fragen beim Einrichten (`questions`) und Gerätemodi (`deviceModes`). Die Skizze in `docs/architektur.md` nennt `kinds` und `setup` einzeln; das Register nimmt sie in einem Stück, also steht es hier in einem Stück (`setup` heisst dort `questions`). **Die Branche trägt sich selbst ein**: `defineIndustry` setzt `industries: [{ id }]`; eine andere Branche in `catalog.industries` ist ein Befund.
   - `rights` (optional): `RightEntries` für das Register der heiklen Rechte; `industry` setzt `defineIndustry`.
   - `events` (optional): die Typen der Ereignisse, die ihre Befehle anhängen. Ein Typ ist `<ding>.<was_geschah>`; bei einer Branche beginnt das Ding mit `<branche>_`.
   - `templates`, `ruleSets`, `demo`, `migrations` (optional): siehe Regel 4.
3. **Namensräume** (ADR-0004, 4): Eine Branche legt **nur** an, was ihren Namen trägt, und nichts in der Plattform oder bei einer anderen Branche. Tabellen `<branche>_<name>`, Operationen `<branche>.…`, Ereignisse `<branche>_<ding>.<was>`, Funktionen, Module, Betriebsarten, Fragen, Gerätemodi und Rechte `<branche>.<name>`; Vorlagen, Regelwerke und Migrationen `<branche>.<name>`. Ein Verstoss ist `wrong_namespace`. Ein Modul der Plattform legt nichts mit Punkt an (die Kennungen mit Punkt gehören einer Branche). Die Ausgabe prüft dazu über Grenzen hinweg: Ein Modul mit einer Tabelle, Operation oder einem Ereignis im Namensraum einer Branche der Ausgabe ist `namespace_taken`; eine Operation einer Branche, die Funktion oder Recht einer anderen Branche verlangt, ist `foreign_dependency`. Neue Kennungen trägt nur der Kopf in `registry/names.json` ein.
4. **Die kleinste ehrliche Form** für das, was es noch nicht als Paket gibt. Jede trägt keinen Text (Namen und Sätze liegen im Katalog unter derselben Kennung); die Pakete, die sie brauchen, verfeinern den Inhalt (`data`), sie ersetzen die Typen nicht:
   - **Vorlage** `{ id, kind, data }`: ein Ausgangspunkt, den ein Betrieb kopiert und dann besitzt; `kind` sagt, welches Paket sie liest (`checklist`), `data` ist schlichte Daten.
   - **Regelwerk** `{ id, source, data }`: Regeln als Daten. **`source` ist Pflicht** («Recht nur mit Quelle»): ein Pfad unter `docs/fakten/` oder Behörde und Artikel; fehlt sie, ist es `missing_source`. Ob ein Wert Recht oder Richtwert ist, steht noch nicht in der Form (Schuld TD-98).
   - **Demo** `{ businessName, ownerName, kinds?, people? }`: ein erfundener Betrieb («Betrieb Muster», «Person Muster»); `kinds` müssen im `catalog` der Branche stehen (`unknown_reference`). Was der Demo-Betrieb sonst enthält, macht die Branche aus ihren Operationen.
   - **Migration** `{ id, table, upgrade }`: Änderung der Form einer Tabelle der Branche; `upgrade` ist rein (eine Zeile hinein, eine heraus). Angewendet wird in der Reihenfolge der Liste, je einmal; welche schon angewendet sind, hält das Schema-Ledger der Datenbank der Ausgabe (`@onestrand/web-data`, Schritt 7).
5. **Modul der Plattform** (`defineModule`): dasselbe ohne `templates`, `ruleSets`, `demo`, `migrations`. Die Kennung ist ein Wort mit einzelnen Unterstrichen (`team_time`). `businessModule` (`@onestrand/business`) ist immer dabei und steht an erster Stelle: Die Hülle braucht seine Tabellen (`createAccessSource` liest Betriebe und Personen) und die Sicherung sein Schema. Wer es nochmals in `modules` nennt, bekommt `duplicate_part`. Ein weiteres Modul der Plattform (Kundschaft, Aufträge, …) liegt in seinem Paket, importiert `defineModule` von hier und steht in `modules` der Ausgabe; dieses Paket kennt es nicht.
6. **Die Ausgabe** (`defineEdition`): `id` (Kleinbuchstaben und Ziffern), `database`, `storagePrefix`, `backupFormat`, `backupVersion` und `backupReaders` sind **für immer eingefroren** (ADR-0008, 2): Datenbank `<id>`, Präfix `<id>:`, Format `<id>-backup`; `defineEdition` prüft, dass sie die Kennung tragen, und dass für jede ältere Version ein Leser da ist (`readers[n]` macht aus Version `n` die Version `n + 1`). Dazu `title` (Arbeitstitel; die Marke ist Sache von W0-03), `industries` (die einzige Liste, die von Hand wächst), `modules`, `texts` (die Kataloge der Branchen in de-CH, über den der Plattform in dieser Reihenfolge), `translations` (weitere Sprachen nach Kennung; `{}` ist eine Sprache ohne Text; `de-CH` ist die Quelle und kein Eintrag) und `lexicon` (`industries` und `edition` wie bei `createLexicon` von `@onestrand/i18n`). Wer die Branche nennt, nennt nichts in `registry/`: Die Kennungen der Ausgabe trägt der Kopf dort ein.
7. **Zusammensetzen** (`composeEdition(edition)`): Reihenfolge der Teile ist Betrieb, Module, Branchen. Daraus entstehen `tables` (`createTableRegistry`), `features` (ein Register aus allen Einträgen auf einmal: die Reihenfolge der Module spielt keine Rolle), `rights` (`extend` je Teil), `contract` (`composeContract` aus `@onestrand/contract`), `owners` (welcher Teil welche Operation besitzt), `catalogue` (`mergeCatalogues(messages, …texts)`), `catalogues` (ein Satz je Sprache mit Rückfall auf de-CH) und `lexicon`. Es wirft einen `EditionError` mit dem Code des ersten Befunds und allen Befunden in `problems`, wenn die Teile nicht zusammenpassen: eine Operation oder Tabelle zweimal (mit beiden Herkünften), eine Kennung ausserhalb ihres Namensraums, ein `access`, das Funktion oder Recht nennt, die niemand angemeldet hat (**das schliesst Schuld TD-31**), ein Bezug, auf den nichts antwortet, ein Wortkonflikt im Lexikon. Ein fehlender Text hält es nicht auf: Der Katalog fällt auf de-CH zurück; ihn nennt `editionProblems`.
8. **Starten** (`startEdition(composed, { storage, clock, ids, hasher, actor })`): Die Ausgabe ist Daten; hier trifft sie zum ersten Mal einen Speicher. `storage` baust du aus `composed.tables` (im Test `createMemoryStorage<AnyTableRegistry, Business>(composed.tables, …)`, im Browser die Datenbank aus `@onestrand/web-data`). Das Ergebnis `RunningEdition` hat `useCases` (alle Operationen der Schnittstelle, jede vor dem Aufruf von `guardUseCases` geprüft, mit der Quelle `createAccessSource({ storage, features, actor })`) und `backups` (`createBackupKit` mit Format und Version der Ausgabe und `BusinessSchema`). `actor` ist die Person, die auf diesem Gerät handelt; für einen zweiten Betrieb auf demselben Speicher startest du mit dem `actor` seiner Person. `useCases` ist ein Record nach Operationsname: Wer die Typen einer Operation will, typisiert mit `UseCasesOf<typeof fragment>` (aus `@onestrand/contract`). Fehlt einem Teil ein Use Case oder hat er einen zu viel, wirft es einen `EditionError` (`missing_use_case`, `extra_use_case`).
9. **Eine ausgeschaltete Funktion hat keine Einstiege, ihre Daten bleiben.** Die Hülle weist jede Operation einer ausgeschalteten Funktion ab (`forbidden`, auch für die Inhaber:in), `availableSlotEntries` lässt keinen Eintrag eines Steckplatzes durch, und die Zeilen stehen weiter im Speicher und in der Sicherung; nach dem Einschalten ist alles wieder da. Zwei Betriebe auf einem Speicher bleiben getrennt: Das Profil der Person gilt nur im eigenen Betrieb.
10. **Konformität als Daten:** `editionProblems(edition)` gibt jeden Befund als `{ part, code, id, message }` zurück und wirft nie. `part` ist einer von `parts` (Kennung doppelt), `tables`, `features`, `rights` (die Befunde von `featureEntryProblems` und `rightEntryProblems` über alle Teile), `contract` (`composeProblems`), `access` (`contractAccessProblems` und `foreign_dependency`), `namespaces`, `use_cases` (ein Use Case je Operation und keiner zu viel; die Use Cases werden mit einer Umgebung gebaut, deren Uhr, IDs und Hasher sich weigern, und nie aufgerufen), `schemas` (`operationSchemaProblems` jeder Operation), `texts` (`missingTexts` gegen `registerTexts`, in de-CH) und `lexicon`. Der Test jeder Ausgabe und `pnpm check:industry` rufen es und erwarten `[]`. Es prüft keine Sprache ausser de-CH auf Vollständigkeit: Welche Sprache vollständig sein muss, entscheidet der Test der Ausgabe (`catalogueGaps`).
11. **Steckplätze als Typen** (ADR-0004, 3): `SLOT_IDS` (Routen, Navigation, «＋ Erfassen», Karten in «Heute», Abschnitte, Zeilen auf Rapport und Rechnung, Dokument-Stile, Arbeitsplätze, Erinnerungen, Monatspaket) und `SLOT_PAGES` (die Seiten der Plattform, die Abschnitte nehmen) sind Kennungen. Ein `SlotEntry` sagt nur `id` (im Namensraum der Branche), `feature` und `level` (Vorgabe `view`); `defineIndustryWeb` fügt hinzu, was der Bildschirm braucht. Die Fragen beim Einrichten und die Demo stehen als Daten in `catalog.questions` und `demo`. `availableSlotEntries(einträge, { profile, features })` lässt nur durch, was die Person sehen darf. Die Seiten-Kennungen sind vorläufig, bis die Module, denen die Seiten gehören, ihre eigenen anmelden (Schuld TD-97).

## Beispiel

```ts
import { command, commandBase, createCommandKit } from '@onestrand/contract';
import { nameSchema, syncFields } from '@onestrand/core';
import { alive, createMemoryStorage, defineTable, createWebCryptoHasher } from '@onestrand/storage';
import { z } from 'zod';
import { composeEdition, defineEdition, defineIndustry, editionProblems, startEdition } from '@onestrand/manifest';

// Eine Branche: eine Tabelle, eine Operation, eine Funktion. Keine Datei der Plattform nennt sie.
const visits = defineTable({
  name: 'alpha_visits',
  schema: z.object({ ...syncFields, place: nameSchema(200) }),
  indexes: [],
  sensitivity: 'normal',
  sync: 'single_writer',
});
const contract = {
  'alpha.visits.add': command({
    name: 'alpha.visits.add',
    summary: 'Records a visit at a place.',
    access: { feature: 'alpha.visits', level: 'operate' },
    input: z.object({ ...commandBase, place: nameSchema(200) }),
    output: z.object({}),
  }),
};
export const alpha = defineIndustry({
  id: 'alpha',
  tables: [visits],
  contract,
  useCases: ({ ctx }) => {
    const { emit, runCommand, stamps } = createCommandKit(ctx);
    return {
      'alpha.visits.add': async (raw) => {
        const input = contract['alpha.visits.add'].input.parse(raw);
        return runCommand(contract['alpha.visits.add'], input, async () => {
          await ctx.storage.table(visits).add({ id: ctx.ids.next(), businessId: input.businessId, place: input.place, ...stamps() });
          await emit(input.businessId, 'alpha_visit.recorded');
          return {};
        });
      },
    };
  },
  catalog: { groups: [{ id: 'alpha.visits' }], features: [{ id: 'alpha.visits', group: 'alpha.visits' }] },
  events: ['alpha_visit.recorded'],
});

// Die Ausgabe nennt ihre Branchen; das ist die einzige Liste, die von Hand wächst.
const edition = defineEdition({
  id: 'sample', database: 'sample', storagePrefix: 'sample:', backupFormat: 'sample-backup', backupVersion: 1,
  title: 'Beispiel', industries: [alpha],
});
editionProblems(edition); // [] sobald auch die Texte stehen: sonst `missing_text`, einer je Schlüssel

// Zusammensetzen und starten: Speicher, Uhr, IDs und Hasher kommen von aussen.
const composed = composeEdition(edition);
const storage = createMemoryStorage(composed.tables, { hasher: createWebCryptoHasher(globalThis.crypto), clock, ids });
const running = startEdition(composed, { storage, clock, ids, hasher, actor });
await running.useCases['alpha.visits.add']?.({ commandId, businessId, place: 'Ort A' });
```

## Was dazugehört, aber nicht hier steht

- **Die Web-Hälfte** (`defineIndustryWeb`: Routen, Navigation, Seiten, Dokument-Stile, Texte, Lexikon der Branche) und das Thema der Ausgabe kommen mit W0-03. Die Texte einer Branche (`texts`) und ihre Wörter (`lexicon.industries`) gibt die Ausgabe heute von Hand hierher; mit W0-03 holt sie sie aus `defineIndustryWeb`.
- **Die Datenbank des Browsers** (`@onestrand/web-data`, Schritt 7): baut ihre Stores aus `composed.tables`, nimmt Namen und Präfix aus der Ausgabe und die Migrationen aus `industry.migrations`.
- **`pnpm check:industry <id>` und der Generator** (Schritt 9): bauen eine Ausgabe aus dem Betrieb und der einen Branche und rufen `editionProblems`.
- **Die Referenz-Branche `muster`** (Schritt 8) ist die erste echte Branche, die so andockt.
- **Namensregister:** Die eingefrorenen Namen einer Ausgabe bekommen ihre Art mit W0-03.
- **Weitere Module der Plattform** (Kundschaft, Aufträge, Rechnungen, …) bringen ihr eigenes `defineModule`.

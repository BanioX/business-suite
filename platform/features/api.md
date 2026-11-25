# @onestrand/features (P-06)

Das Register der Funktionen: Branche, Modul, Funktion und Option als Daten, dazu Abhängigkeiten über alle Stufen, der Umfang, das Einrichten aus Fragen und der Gerätemodus. Reines TypeScript ohne Browser und ohne Node; baut auf `@onestrand/contract` (die Form der Kennung). Die Plattform kennt keine feste Liste von Funktionen: Jedes Paket und jede Branche meldet seine an, die Ausgabe setzt das Register zusammen. Kein Text steht im Register; Namen und Sätze liegen in den Sprachkatalogen unter denselben Kennungen.

```ts
import { createFeatureRegistry, featureEntryProblems } from '@onestrand/features';
```

## Was das Paket exportiert

| Bereich | Exporte | Wozu |
| --- | --- | --- |
| Register | `createFeatureRegistry`, `FeatureRegistry`, `FeatureEntries` | aus Einträgen ein eingefrorenes Register bauen; `extend` gibt ein neues zurück |
| Prüfen | `featureEntryProblems`, `FeatureProblem`, `FeatureProblemCode`, `FEATURE_PROBLEM_CODES`, `EntryLevel` | Einträge prüfen, ohne zu bauen: alle Befunde als Daten |
| Einträge | `FeatureInput`, `FeatureOptionInput`, `KindInput`, `SetupQuestionInput`, `SetupAnswerInput`, `DeviceModeInput`, `IndustryDefinition`, `FeatureGroupDefinition` | was eine Branche oder ein Paket anmeldet |
| Gebaute Einträge | `FeatureDefinition`, `FeatureOptionDefinition`, `KindDefinition`, `SetupQuestionDefinition`, `SetupAnswerDefinition`, `DeviceModeDefinition` | wie das Register sie hält: geprüft, mit allen Vorgaben, eingefroren |
| Auflösen | `ResolvedFeatures`, `SwitchResult` | Ergebnis von `resolve` und `switchFeature` |
| Einrichten | `SetupInput`, `SetupProposal`, `AnswerProblem`, `AnswerProblemKind`, `ANSWER_PROBLEM_KINDS`, `Extent`, `EXTENTS` | Fragen, Vorschlag und Umfang |
| Optionen | `optionAccepts`, `ResolvedOptions`, `OptionType`, `OptionValue`, `OPTION_TYPES`, `OPTION_KEY_PATTERN` | Typ einer Option prüfen, gespeicherte Werte lesen |
| Kennungen | `namespaceOf`, `FEATURE_SEGMENT_PATTERN` | der Namensraum einer Kennung; ein Wort einer Kennung |
| Feld `availability` | `AVAILABILITIES`, `Availability` | nur ein Wert: `available` |
| Gerätemodus | `DEFAULT_DEVICE_MODE` | `normal`, hat jedes Register |
| Fehler | `FeatureError`, `FeatureErrorCode` | Fehler des Programms, mit Code |

## Die vier Ebenen

| Ebene | Eintrag | Kennung | Wer meldet sie an |
| --- | --- | --- | --- |
| Branche | `industries: [{ id }]` | ein Wort: `facility` | die Branche; sie ist der Namensraum für alles, was sie anmeldet |
| Modul | `groups: [{ id }]` | `<modul>` oder `<branche>.<modul>` | Plattform-Paket oder Branche |
| Funktion | `features: [{ id, group, core?, requires?, options?, availability? }]` | `<name>` (Plattform) oder `<branche>.<name>` | Plattform-Paket oder Branche |
| Option | `options: [{ key, type, default, values? }]` an der Funktion | `camelCase`, nur in der Funktion | die Funktion |

Dazu: `kinds` (Betriebsarten: `<branche>.<art>`, mit `on`, den Funktionen, mit denen eine Art startet), `questions` (Fragen beim Einrichten mit ihren Antworten) und `deviceModes` (Gerätemodi, die eine Funktion voraussetzen). Alles zusammen ist ein `FeatureEntries`.

## Regeln, die du kennen musst

1. **Anmelden:** Ein Paket oder eine Branche gibt ein `FeatureEntries` ab; die Ausgabe ruft `createFeatureRegistry(entries)` oder `registry.extend(entries)`. Die Branche meldet `catalog` (Branche, Module, Funktionen), `kinds` und `setup` (Fragen) in einem Stück an. Schreibe die Einträge mit `as const satisfies FeatureEntries`, dann kennt der Typ jede Kennung.
2. **Form der Kennung:** Funktion, Modul, Frage, Betriebsart und Gerätemodus haben ein oder zwei Teile aus Kleinbuchstaben, Ziffern und einzelnen Unterstrichen, getrennt durch einen Punkt (`customers`, `team_time`, `facility.keys`). Es ist dieselbe Form wie `access.feature` an einer Operation (`FEATURE_ID_PATTERN` aus `@onestrand/contract`, Schuld TD-10); ein Test hält beide beisammen. Ein Teil vor dem Punkt ist der Namensraum der Branche.
3. **Namensraum:** Eine Kennung mit Punkt gehört der Branche dieses Namens, und die Branche muss angemeldet sein. Eine Funktion trägt den Namensraum ihres Moduls (`wrong_namespace`). Ein Eintrag einer Branche darf die Plattform und die eigene Branche nennen, nie eine andere; ein Eintrag der Plattform nennt nie eine Branche (`foreign_dependency`).
4. **Abhängigkeiten:** `requires` gilt über alle Stufen. Eine Abhängigkeit, die es nicht gibt, ist `unknown_reference`; eine Funktion, die sich selbst braucht, auch über andere, ist `requires_cycle`. Doppelte Kennungen sind `duplicate_id`; gezählt wird je Ebene, ein Modul und eine Funktion dürfen also gleich heissen.
5. **Kern:** `core: true` heisst: nie schaltbar, immer an, immer verfügbar. Eine Kern-Funktion braucht nur Kern-Funktionen (`invalid_core`), und `resolve` hat den Kern immer dabei. `switchFeature` auf eine Kern-Funktion wirft `core_feature`.
6. **Auflösen:** `registry.resolve(liste)` gibt den Kern, alles Verlangte und alles, was es braucht, zurück, in der Reihenfolge des Registers. Wiederholt angewendet ändert sich nichts. Kennungen, die das Register nicht kennt (eine neuere Version hat sie geschrieben), kommen getrennt in `unknown` zurück: Schreibe sie beim Speichern wieder mit.
7. **Schalten:** `registry.switchFeature(liste, id, an)` löst zuerst die Liste auf. «An» bringt mit, was gebraucht wird; «aus» nimmt alles mit, was direkt oder über andere darauf baut. So bleibt nie eine Funktion ohne ihre Grundlage zurück. `turnedOn` und `turnedOff` sagen, was sich geändert hat; vorher fragt die App mit `requiredFor(id)` und `dependentsOf(id)`, was mitgeht. Gespeichert wird die Liste der Funktionen am Betrieb; das Register rechnet nur.
8. **Umfang:** `lean`, `usual`, `all` sind Kennungen (die Wörter «Schlank», «Üblich», «Alles» und «Eigene Auswahl» stehen in den Texten der App). `registry.propose({ kinds, answers })` gibt je Umfang eine vollständige Liste: `lean` ist, womit die gewählten Betriebsarten (`on`) starten; `usual` fügt hinzu, was die Antworten einschalten (`enable`); `all` ist jede Funktion. Was eine Antwort ausschaltet (`disable`), fehlt in `lean` und `usual`, samt allem, was darauf baut: **«aus» gewinnt vor «an»**. `lean` liegt in `usual`, `usual` in `all`. Gespeichert wird der Umfang nie: `registry.extentOf(vorschlag, liste)` erkennt ihn aus den Schaltern und sagt sonst `custom`; sind zwei Umfänge dieselbe Liste, nennt es `usual`, dann `lean`, dann `all`.
9. **Fragen:** `questionsFor(kinds)` liefert die Fragen, die für diese Betriebsarten gestellt werden (`kinds` an der Frage leer: für alle). Antworten sind Kennungen; `answers` ist `{ frageId: [antwortId, …] }`. Eine Frage mit einer Wahl nimmt eine Antwort (`multiple: true` mehrere). Fehler im Input sind Daten in `proposal.problems` (`unknown_kind`, `unknown_question`, `not_asked`, `unknown_answer`, `too_many_answers`); der Vorschlag entsteht trotzdem aus dem, was stimmt. Die Fragetexte schreibt der Sprachkatalog; sie sprechen eine Person mit «du» an.
10. **Optionen:** Typen `boolean`, `enum` (mit `values`), `number`, `minutes` (ganze Minuten ab 0), `rappen` (ganze Rappen), `time` (`HH:MM`), `list` (Liste von Texten). Der Standardwert muss zum Typ passen (`invalid_option`). `registry.resolveOptions(funktionId, gespeichert)` nimmt gespeicherte Werte, die passen, und sonst den Standard (`defaulted` nennt sie); Schlüssel, die die Funktion nicht kennt, kommen in `unknown` zurück und bleiben erhalten.
11. **Gerätemodus:** Jedes Register hat `normal`. Eine Branche meldet weitere an (`{ id, feature }`); `registry.deviceModesFor(liste)` nennt nur die, deren Funktion an ist. Wo der Modus liegt (auf dem Gerät, nicht in der Sicherung) und wie man ihn verlässt, regelt die Hülle (`shell`), nicht dieses Paket.
12. **`availability`:** Feld jeder Funktion mit genau einem Wert, `available`; ohne Angabe gilt er. Ein anderer Wert ist `invalid_availability`, auch an einer Kern-Funktion. Nichts in diesem Paket liest das Feld, um eine Funktion auszublenden. Ein weiterer Wert braucht ein eigenes ADR, das Alban entscheidet.
13. **Befunde sind Daten, Fehler haben Codes:** `featureEntryProblems(entries, register?)` liefert jeden Befund als `{ code, level, id, message }` und wirft nie; ein Konformitätstest erwartet `[]`. `createFeatureRegistry` und `extend` werfen einen `FeatureError` mit dem Code des ersten Befunds, in `problems` stehen alle. Dazu `unknown_feature` (das Register kennt die Funktion nicht) und `core_feature`.
14. **Eingefroren:** Das Register, alle Listen und alle Einträge sind eingefroren; `extend` ändert das alte Register nicht.

## Beispiel

```ts
import { createFeatureRegistry, type FeatureEntries } from '@onestrand/features';

// Ein Plattform-Paket meldet seine Funktionen an.
export const customersEntries = {
  groups: [{ id: 'work' }],
  features: [
    { id: 'customers', group: 'work' },
    { id: 'jobs', group: 'work', requires: ['customers'] },
  ],
} as const satisfies FeatureEntries;

// Eine Branche meldet ihre Ebene, Module, Funktionen, Betriebsarten, Fragen und Gerätemodi an.
export const musterEntries = {
  industries: [{ id: 'muster' }],
  groups: [{ id: 'muster.visits' }],
  features: [
    {
      id: 'muster.visits',
      group: 'muster.visits',
      requires: ['customers'],
      options: [{ key: 'pin', type: 'boolean', default: false }],
    },
  ],
  kinds: [{ id: 'muster.standard', on: ['customers', 'muster.visits'] }],
  questions: [
    { id: 'muster.pass', answers: [{ id: 'yes', enable: ['jobs'] }, { id: 'no' }] },
  ],
  deviceModes: [{ id: 'muster.counter', feature: 'muster.visits' }],
} as const satisfies FeatureEntries;

// In der Ausgabe: das Register.
const REGISTER = createFeatureRegistry(customersEntries).extend(musterEntries);

// Einschalten und Ausschalten.
const on = REGISTER.switchFeature([], 'jobs', true);        // customers und jobs
const off = REGISTER.switchFeature(on.features, 'customers', false); // jobs geht mit
off.turnedOff;                                              // ['customers', 'jobs']

// Einrichten: Betriebsart und Antworten gewählt, ein Vorschlag je Umfang.
const proposal = REGISTER.propose({ kinds: ['muster.standard'], answers: { 'muster.pass': ['yes'] } });
REGISTER.extentOf(proposal, proposal.usual);                // 'usual'
```

## Was dazugehört, aber nicht hier steht

- **Texte** (Name und Satz je Funktion, Modul und Option; Fragen und Antworten) gehören in die Kataloge von `@onestrand/i18n`, unter denselben Kennungen; der Texttest verlangt sie für jede Kennung des Registers.
- **Rechte** (`access.feature` und Stufe je Rolle) prüft `@onestrand/access`; es nimmt die Kennungen aus diesem Register.
- **Speichern** der Liste der Funktionen und der Optionen am Betrieb macht `@onestrand/business`; der Gerätemodus liegt auf dem Gerät.

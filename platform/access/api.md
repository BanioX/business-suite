# @onestrand/access (P-21, Grundlage)

Die Rechte der Suite: wer darf was, als Daten. Stufen je Funktion, heikle Rechte, Profile mit der festen Vorlage «Inhaber:in», die Regeln der Weitergabe, der Entscheid «darf dieses Profil diese Operation ausführen», die Hülle um die Use Cases und der Filter für das Senden an fremde Geräte. Reines TypeScript ohne Browser und ohne Node; baut auf `@onestrand/contract`, `@onestrand/features` und `@onestrand/storage`. Die Seiten (Rollen und Rechte verwalten, Vorlagen, PIN am gemeinsamen Gerät) und das Verwalten der Profile je Betrieb kommen in W1 (Auftrag W1-01); hier stehen nur die Typen, die Schemas und die Regeln.

```ts
import { decideAccess, guardUseCases, OWNER_PROFILE } from '@onestrand/access';
```

## Was das Paket exportiert

| Bereich | Exporte | Wozu |
| --- | --- | --- |
| Stufen | `levelRank`, `levelReaches`, `higherLevel` | die Ordnung nichts, sehen, bedienen, verwalten; «nichts» ist `undefined` |
| Heikle Rechte | `createRightRegistry`, `RightRegistry`, `RightEntries`, `RightInput`, `RightDefinition`, `KnownIndustries` | das Register, in das Pakete und Branchen ihre heiklen Rechte anmelden; `extend` gibt ein neues zurück |
| Prüfen | `rightEntryProblems`, `RightProblem`, `RightProblemCode`, `RIGHT_PROBLEM_CODES` | Einträge prüfen, ohne zu bauen: alle Befunde als Daten |
| Fehler | `RightError` | Fehler des Programms, mit Code |
| Profil | `ProfileSchema`, `Profile`, `OwnerProfile`, `CustomProfile`, `PROFILE_TYPES`, `ProfileType` | was eine Person darf, als Zod-Schema und Typ |
| Vorlage «Inhaber:in» | `OWNER_PROFILE`, `isOwner` | die feste Vorlage |
| Lesen | `levelOf`, `holdsRight`, `NO_ACCESS_PROFILE` | die Stufe in einer Funktion, ein Recht; das Profil einer Person, die nichts darf |
| Unbekanntes | `profileProblems`, `ProfileProblem`, `ProfileProblemCode`, `KnownIds` | Funktionen und Rechte in einem Profil, die die Register nicht kennen |
| Entscheid | `decideAccess`, `AccessContext`, `AccessDecision`, `DenialReason`, `DENIAL_REASONS` | darf dieses Profil diese Operation ausführen |
| Weitergabe | `profileChangeProblems`, `TransferProblem`, `TransferProblemCode`, `TRANSFER_PROBLEM_CODES` | darf A das Profil von B auf einen neuen Stand setzen |
| Hülle | `guardUseCases`, `AccessSource`, `AccessRequest` | die Use Cases eines Fragments, vor jedem Aufruf geprüft |
| Vertrag prüfen | `contractAccessProblems`, `ContractAccessProblem` | jede Funktion und jedes Recht in `access` einer Operation gibt es im Register |
| Filter | `filterRowsForDevice`, `TableAccess`, `DeviceRows` | Zeilen für ein fremdes Gerät: nur, was das Profil sehen darf |

## Regeln, die du kennen musst

1. **Stufen:** `view` (sehen), `operate` (bedienen), `manage` (verwalten), geordnet und je Funktion. `ACCESS_LEVELS` kommt aus `@onestrand/contract`. «Nichts» ist kein Wert: Wer in einer Funktion keine Stufe hat, hat dort `undefined`; auch eine Operation verlangt nie «nichts». Wer überhaupt eine Operation einer Funktion aufrufen darf, hat mindestens `view`.
2. **Kennung eines Rechts:** ein bis drei Teile aus Kleinbuchstaben, Ziffern und einzelnen Unterstrichen, getrennt durch einen Punkt (`RIGHT_ID_PATTERN` aus `@onestrand/contract`): `wages`, `export_delete` für die Plattform, `facility.access_notes`, `facility.keys.assign` für eine Branche, deren Namensraum der erste Teil ist. Kein camelCase. Das Muster steht im Vertrag, weil der Vertrag unter diesem Paket liegt; Register, Profil und `access.rights` einer Operation nehmen dieselbe Form, ein Test hält sie beisammen (Schuld TD-10, damit erledigt).
3. **Register der heiklen Rechte:** Die Plattform kennt keine feste Liste. Ein Paket oder eine Branche gibt ein `RightEntries` ab (`{ industry?, rights: [{ id }] }`), die Ausgabe ruft `createRightRegistry(features, entries)` und `extend`. Der Namensraum wird geprüft: Die Plattform meldet Kennungen ohne Punkt an; eine Branche (`industry`) meldet nur `<branche>.<name>` an, und die Branche muss im Register der Funktionen stehen (`features` ist dieses Register oder alles mit `industries`). Befunde sind Daten (`rightEntryProblems`, Codes `RIGHT_PROBLEM_CODES`); Bauen und `extend` werfen einen `RightError` mit dem Code des ersten Befunds, in `problems` stehen alle. Das Register ist eingefroren und hält keinen Text: Name und Satz eines Rechts stehen in den Sprachkatalogen unter derselben Kennung.
4. **Profil:** Reine Daten, in zwei Formen. `{ type: 'owner' }` ist die Vorlage «Inhaber:in»; das Wort ist ein Text der App, im Code gibt es nur die Kennung `owner`. `{ type: 'custom', levels: { <funktion>: <stufe> }, rights: [<recht>] }` ist alles andere; eine Funktion, die nicht in `levels` steht, ist «nichts». `ProfileSchema` ist streng: ein unbekanntes Feld wird abgewiesen, damit ein Tippfehler kein Recht still fallen lässt. Es prüft nur die Form der Kennungen, nicht, ob es sie gibt, denn ein Profil einer neueren Version darf lesbar bleiben; was die Register nicht kennen, nennt `profileProblems(profil, { features, rights })` als Daten (die Seite, die ein Profil bearbeitet, weist es ab, beim Speichern bleibt es erhalten). Je Betrieb liegen Profile als Zeilen in einer Tabelle von W1; die Zeile trägt `ProfileSchema`.
5. **Inhaber:in ist fest:** `OWNER_PROFILE` darf alles: `levelOf` ist immer `manage`, `holdsRight` immer wahr, auch für Funktionen und Rechte, die erst eine spätere Version anmeldet. Sie hat keine Liste, die man bearbeiten könnte. Sie lässt sich weder ändern noch entziehen (Regel 7).
6. **Entscheid:** `decideAccess(operation.access, { profile, features })` ist eine reine Funktion. `features` sind die eingeschalteten Funktionen des Betriebs, am besten `registry.resolve(liste).features`, dann ist der Kern dabei. Die Antwort ist `{ allowed: true }` oder `{ allowed: false, reason }` mit `reason` aus `DENIAL_REASONS`: `feature_off` (die Funktion ist ausgeschaltet), `level_missing` (keine oder eine zu tiefe Stufe; `needed` und `held` sagen welche), `right_missing` (`missing` nennt jedes fehlende Recht). Geprüft wird in dieser Reihenfolge. **Eine ausgeschaltete Funktion ist für niemanden da, auch nicht für die Inhaber:in**; ihre Daten bleiben. Ohne Stufe keine Operation.
7. **Weitergabe:** `profileChangeProblems(handelnde, aktuell, neu)` sagt, was dagegen spricht, dass die handelnde Person das Profil einer anderen von `aktuell` auf `neu` setzt; `[]` heisst erlaubt. Niemand vergibt mehr, als er hat: Wo sich eine Stufe oder ein Recht ändert, muss die handelnde Person es selbst halten, bei einer Stufe mindestens die höhere von alter und neuer (`level_beyond_actor`, `right_beyond_actor`). So kann niemand eine Stufe über der eigenen vergeben, und niemand nimmt einer Person etwas, das er selbst nie hatte. Was in beiden Profilen gleich ist, wird nicht angerührt und muss nicht gehalten werden. Das Profil «Inhaber:in» lässt sich nicht ändern und nicht entziehen (`owner_fixed`), und nur eine Inhaber:in gibt es weiter (`owner_beyond_actor`). **Ob** jemand Profile ändern darf, ist ein Recht der Operation, die es tut (W1); die Funktion beantwortet nur, was die Änderung enthalten darf.
8. **Hülle um die Use Cases:** `guardUseCases(vertrag, useCases, quelle)` gibt dieselben Use Cases zurück, jeder vor dem Aufruf geprüft. `quelle` ist ein Port: eine Funktion `({ operation, businessId }) => { profile, features }`, auch asynchron. Sie sagt, wer auf diesem Gerät handelt, welches Profil die Person im Betrieb hat und welche Funktionen eingeschaltet sind; das Paket kennt weder den Betrieb noch die Personen. Fehlt das Recht, wirft die Hülle `CommandError('forbidden', …)`, und der Use Case läuft nicht. Befehle und Abfragen werden gleich geprüft, bei jedem Aufruf neu. Eine Eingabe ohne `businessId` ergibt `CommandError('invalid')` (kein Betrieb, kein Profil). Wirft die Quelle, läuft nichts. Ein Vertrag mit einer Operation, die nicht wohlgeformt ist (`fragmentProblems`), oder ohne Use Case wirft sofort einen `TypeError`, nicht erst beim Aufruf. Die Hülle prüft das Recht, nicht die Eingabe: die Schemas prüft der Use Case.
9. **Vertrag und Register:** `fragmentProblems` des Vertrags prüft die Form von `access`; `contractAccessProblems(vertrag, { features, rights })` prüft, dass jede Funktion und jedes Recht in `access` angemeldet ist, als Daten. Wer den Vertrag einer Ausgabe zusammensetzt und der Test einer Branche rufen es auf und erwarten `[]` (Schuld TD-31).
10. **Filter für fremde Geräte:** `filterRowsForDevice(tabelle, { feature, right? }, zeilen, kontext)` nimmt aus Zeilen heraus, was das Profil nicht sehen darf, bevor sie an ein anderes Gerät gehen. Er liest `sensitivity` und `fields` der Tabelle über `fieldSensitivity` aus `@onestrand/storage` und das Profil. Ohne Stufe in der Funktion, mit ausgeschalteter Funktion, oder wenn die Tabelle als Ganzes `sensitive` ist und das Recht fehlt, geht nichts (`allowed: false`). Sonst geht jede Zeile ohne die Felder, die `sensitive` sind und für die das Recht fehlt; `id` und `businessId` bleiben. `normal` und `internal` gehen mit `view`: `internal` hält Daten von Dritten fern, nicht von den Leuten des Betriebs. Die Inhaber:in sieht alles, ausser bei einer ausgeschalteten Funktion. Eine Tabelle sagt nicht, zu welcher Funktion sie gehört und welches Recht ihre heiklen Teile öffnet; darum gibt der Aufrufer `{ feature, right }` mit (Schuld TD-70). Der Abgleich zwischen den Geräten selbst kommt in Welle 3 und ruft den Filter für jede Tabelle auf.
11. **Befunde sind Daten, Fehler haben Codes:** `rightEntryProblems`, `profileProblems`, `profileChangeProblems` und `contractAccessProblems` werfen nie und geben eine Liste zurück. `message` ist englisch, für Protokoll und Tests; den Satz für die Person schreibt der Sprachkatalog zum Code.

## Beispiel

```ts
import { command, commandBase, type UseCasesOf } from '@onestrand/contract';
import { createFeatureRegistry } from '@onestrand/features';
import {
  OWNER_PROFILE, createRightRegistry, decideAccess, guardUseCases, profileChangeProblems,
  type AccessContext,
} from '@onestrand/access';
import { z } from 'zod';

// Die Register der Ausgabe.
const FEATURES = createFeatureRegistry({
  groups: [{ id: 'work' }],
  features: [{ id: 'customers', group: 'work' }],
});
const RIGHTS = createRightRegistry(FEATURES, { rights: [{ id: 'export_delete' }] });

// Ein Fragment: jede Operation erklärt ihr Recht.
const customersContract = {
  'customers.remove': command({
    name: 'customers.remove',
    summary: 'Removes a customer.',
    access: { feature: 'customers', level: 'manage', rights: ['export_delete'] },
    input: z.object({ ...commandBase }),
    output: z.object({}),
  }),
};

// Der Entscheid, rein.
const context: AccessContext = {
  profile: { type: 'custom', levels: { customers: 'manage' }, rights: [] },
  features: FEATURES.resolve(['customers']).features,
};
decideAccess(customersContract['customers.remove'].access, context);
// { allowed: false, reason: 'right_missing', feature: 'customers', missing: ['export_delete'] }

// Die Hülle: die Use Cases wie sonst, dazu eine Quelle für Profil und eingeschaltete Funktionen.
declare const useCases: UseCasesOf<typeof customersContract>;
const guarded = guardUseCases(customersContract, useCases, ({ businessId }) => loadContext(businessId));
declare function loadContext(businessId: string): AccessContext;

// Die Weitergabe: darf diese Person das Profil einer anderen so setzen?
profileChangeProblems(
  context.profile,
  { type: 'custom', levels: {}, rights: [] },
  { type: 'custom', levels: { customers: 'manage' }, rights: ['export_delete'] },
);
// [{ code: 'right_beyond_actor', id: 'export_delete', … }]
```

## Was dazugehört, aber nicht hier steht

- **Texte** (Name und Satz je heiklem Recht, die Wörter «Inhaber:in», «Sehen», «Bedienen», «Verwalten», die Sätze zu `forbidden`) gehören in die Kataloge von `@onestrand/i18n` unter denselben Kennungen.
- **Die heiklen Rechte** der Plattform (Löhne, Zahlen und Margen, Kasse, Zeit anderer korrigieren, Personen und Rollen, Einstellungen, Export und Löschen, Gesundheitsdaten, Zugangshinweise) meldet jedes Paket an, das sie braucht, nicht dieses. Die Rechte einer Branche meldet die Branche an.
- **Vorlagen** (Büro, Objektleitung, Mitarbeitende, Aushilfe, Lernende) sind Daten der Branche oder des Pakets für Personen und kommen mit W1. Die Rollen einer Branche (Wörter, Arbeitsplätze) gehören ihr.
- **Profile verwalten** (Tabelle, Use Cases, Seiten, mehrere Profile je Person mit dem weitesten Zugriff, «mindestens eine Inhaber:in bleibt», PIN am gemeinsamen Gerät) ist W1-01.
- **Woher Profil und eingeschaltete Funktionen kommen** liefert die App an den Port der Hülle: das Profil aus den Zeilen des Betriebs, die Funktionen aus `@onestrand/business`.
- **Der Abgleich zwischen Geräten** (Welle 3) ruft `filterRowsForDevice` auf.

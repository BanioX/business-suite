# @onestrand/i18n (P-07)

Die Sprachen der Suite: Kataloge je Sprache mit Rückfall auf de-CH, Lücken als Daten, die Texte der Plattform in de-CH, das Lexikon der Branche, der Katalog einer Sprache für Dokumente an Dritte und die Regel, nach der Kennungen der Register zu Schlüsseln der Texte werden. Reines TypeScript ohne Browser und ohne Node; **das Paket importiert kein anderes Paket** der Plattform und hält keinen globalen Zustand: Die Sprache ist immer ein Parameter, nie «die aktuelle». Grundlage ist [ADR-0007](../../docs/adr/0007-sprachen.md).

```ts
import { createCatalogueSet, messages, resolveCatalogue, catalogueGaps } from '@onestrand/i18n';
```

## Was das Paket exportiert

| Bereich | Exporte | Wozu |
| --- | --- | --- |
| Sprachen | `SOURCE_LANGUAGE`, `isLanguageTag`, `LANGUAGE_TAG_PATTERN`, `languageChain`, `languageProblems`, `createLanguageRegistry`, `LanguageRegistry` | die Kennungen der Sprachen (BCP 47) und das Register der Sprachen einer Ausgabe |
| Kataloge | `MessageTree`, `Message`, `Translation`, `defineTranslation`, `resolveCatalogue`, `mergeCatalogues` | de-CH als Quelle, Übersetzung als Teil davon, vollständiger Katalog mit Rückfall, Kataloge übereinanderlegen |
| Lücken | `catalogueGaps`, `CatalogueGap`, `GAP_RULES`, `GapRule` | jede Differenz zwischen Übersetzung und Quelle, als Daten |
| Satz von Katalogen | `createCatalogueSet`, `CatalogueSet` | ein Katalog in allen Sprachen einer Ausgabe; die Sprache der App und die eines Dokuments sind je ein Satz |
| Register der Ausgabe | `registerTexts`, `codeTexts`, `missingTexts`, `RequiredText`, `MissingText`, `FeatureRegisterShape`, `RightRegisterShape`, `DEVICE_MODE_NORMAL`, `MISSING_TEXT_RULE` | welche Texte die Register verlangen und welche im Katalog fehlen |
| Lexikon | `createLexicon`, `lexiconProblems`, `Lexicon`, `Terms`, `TermForms`, `TermEntries`, `IndustryTerms`, `LexiconInput`, `LexiconProblem`, `LEXICON_PROBLEM_CODES`, `TERM_ID_PATTERN` | die Wörter, mit denen eine Branche ein Ding der Plattform nennt |
| Texte der Plattform | `messages`, `Messages`, `platformTerms` | de-CH: Wörter und Sätze der Pakete `features`, `access` und `business` |
| Fehler | `I18nError`, `I18nErrorCode`, `I18N_ERROR_CODES` | Fehler des Programms, mit Code |

## Regeln, die du kennen musst

1. **Eine Quelle, de-CH.** `messages` (Datei `src/messages.ts`) ist der Katalog der Plattform und legt die Schlüssel fest. Eine Übersetzung liegt daneben als `messages.<sprache>.ts` und hat denselben Typ. Der Katalog ist ein verschachtelter Record aus Texten und Meldungsfunktionen (`(n: number) => `${n} Personen``). Die Texte stehen an **einem Ort**: in `messages.ts` und den Dateien daneben. Sonst steht im rein-TS-Teil der Plattform kein Text (Architektur 3.2, Regel 6).
2. **Typisiert.** `Translation<typeof quelle>` ist die Quelle mit lauter optionalen Schlüsseln: ein Schlüssel, den de-CH nicht kennt, kompiliert nicht; ein Text an der Stelle einer Meldungsfunktion (und umgekehrt) kompiliert nicht; eine Meldungsfunktion hat die Parameter der Quelle; ein fehlender Schlüssel ist erlaubt. `defineTranslation(quelle, { … })` schreibt eine Übersetzung gegen die Quelle und gibt sie unverändert zurück.
3. **Rückfall.** `resolveCatalogue(quelle, übersetzung?)` gibt den **vollständigen** Katalog zurück: wo die Übersetzung nichts hat, steht der Text von de-CH. Ein leerer Text, ein Text mit nur Leerzeichen, ein Text anstelle einer Meldungsfunktion und umgekehrt gelten als fehlend. Schlüssel, die die Quelle nicht kennt, fallen weg. Rein: weder Quelle noch Übersetzung werden verändert, das Ergebnis ist neu und tief eingefroren. Ein Schlüssel `__proto__` bleibt ein Schlüssel.
4. **Lücken als Daten.** `catalogueGaps(quelle, übersetzung, sprache)` nennt jeden Unterschied als `{ rule, message, language, path }`: `missing` (die Quelle hat hier einen Text oder eine Meldungsfunktion, die Übersetzung nicht), `wrong_kind` (eine andere Art), `unknown_key` (die Quelle kennt den Schlüssel nicht). Es wirft nie. Ein fehlender Unterbaum ergibt einen Befund je Blatt; ein Text an der Stelle eines Records ergibt einen. `path` verbindet die Schlüssel mit Punkten (ein Schlüssel, der selbst einen Punkt hat wie `facility.keys`, steht ganz darin). Welche Sprache **vollständig** sein muss, entscheidet der Test einer Ausgabe: Er erwartet `[]` für diese und listet die Lücken der anderen, ohne rot zu werden.
5. **Sprachen sind ein Register, keine Liste.** Die Plattform legt nur `de-CH` fest (`SOURCE_LANGUAGE`): die Sprache, in der jeder Text zuerst steht und auf die jede Lücke zurückfällt. Welche weiteren Sprachen eine Ausgabe ausliefert, entscheidet die Ausgabe (offen: S-07 in `docs/entscheide.md`, dort stehen die Vorschläge). `createLanguageRegistry(['pt', 'fr-CH'])` hat de-CH immer als Erstes. Eine Kennung ist ein Tag in der geschriebenen Form (`de-CH`, `pt`, `pt-BR`, `zh-Hant`; Sprache klein, Schrift gross-klein, Region gross); `languageProblems` nennt, was nicht passt. `match(tag)` nimmt die nächste Sprache des Registers (`pt-BR` findet `pt`), nie eine andere Region (`fr-FR` findet `fr-CH` nicht); `resolve(tag)` fällt auf de-CH zurück; `pick([kunde, betrieb])` nimmt die erste Vorliebe, für die das Register eine Sprache hat.
6. **Sprache der Dokumente.** Ein Dokument an Dritte hat seine eigene Sprache, unabhängig von der Sprache der App auf dem Gerät. Dafür ist jeder Katalog ein **Satz**: `createCatalogueSet(quelle, { pt: …, 'fr-CH': … })` löst jede Sprache einmal auf. `set.forLanguage('pt-BR')` gibt den vollständigen Katalog der nächsten Sprache oder de-CH; `set.forPreferences([sprache der Kundschaft, sprache des Betriebs])` nimmt die erste, die der Satz hat. Die Texte der App sind ein Satz, die Texte der Offerte ein anderer mit eigener Quelle, eigenen Sprachen und eigenem Test (ADR-0007, 8). Es gibt keinen Zustand «aktuelle Sprache»: wer einen Text braucht, nennt die Sprache. **Die Anrede in Dokumenten ist nicht entschieden (S-07)** und steckt nirgends im Paket: Die Quelle eines Dokument-Katalogs ist so geschrieben, wie ihre Autorin es entscheidet, und ihre Regeln bringt der Test mit.
7. **Lexikon der Branche.** Eine Branche nennt ein Ding der Plattform anders; das Lexikon ist klein und nur für Wörter in Überschriften und Knöpfen, ganze Sätze überschreibt die Branche in ihrem Katalog (Regel 9). Ein Begriff hat eine Kennung (`object`) und je Sprache die zwei Formen, die ein Satz braucht: `{ one: 'Objekt', many: 'Objekte' }`. `platformTerms` hat die Wörter der Plattform (je mit einem Wort in de-CH). `createLexicon({ base, industries, edition })` setzt zusammen; die Branche darf nur Begriffe der Plattform umbenennen. Es gilt das Wort der Ausgabe, dann das einer Branche, dann das der Plattform; für eine Sprache wird zuerst in dieser Reihenfolge nach einem Wort **in dieser Sprache** gesucht (`pt-BR`, dann `pt`), erst dann nach dem deutschen. Nennen zwei Branchen denselben Begriff in derselben Sprache verschieden, ist das ein Befund (`conflict`), und die Ausgabe sagt mit einem eigenen Eintrag, welches Wort gilt. `lexicon.forLanguage('de-CH')` bindet die Sprache: `terms.many('object')`. Ein Text, der den Begriff nennt, nimmt das Wort als Parameter einer Meldungsfunktion: `empty: (objects: string) => `Noch keine ${objects} angelegt.``. Eine Grammatik gibt es nicht.
8. **Die Texte der Pakete ohne Bildschirm** (`features`, `access`, `business`) stehen in `messages`, denn diese Pakete haben keinen `./web`-Teil und kein Text gehört in ihren rein-TS-Teil. Ein Paket mit Bildschirm-Teil hat seine `messages.ts` in `./web`, eine Branche hat ihre in `industries/<id>/web`; beide folgen den Schlüsseln unten und dem Test unten.
9. **Schlüssel folgen den Kennungen** (die Regel steht in `keys.ts`; eine Kennung behält ihre Punkte, `facility.keys` ist ein Schlüssel):

   | Abschnitt | Schlüssel | Texte |
   | --- | --- | --- |
   | `modules` | `<modul>` | `name`, `summary` |
   | `features` | `<funktion>` | `name`, `summary` |
   | `options` | `<funktion>`, `<option>` | ein Text: der Name der Option |
   | `kinds` | `<betriebsart>` | ein Text: der Name |
   | `questions` | `<frage>` | `text`, und unter `answers` ein Text je `<antwort>` |
   | `deviceModes` | `<modus>` | ein Text; `normal` hat immer einen |
   | `rights` | `<recht>` | `name`, `summary` |

   Wörter fester Listen stehen unter dem Code: `extents` (`lean`, `usual`, `all`, `custom`), `levels` (`none`, `view`, `operate`, `manage`), `profiles` (`owner`: «Inhaber:in»), `vatMethods`, `cantons` (26 Abkürzungen), `errors` (die Codes der Plattform und `business.last_owner`, `business.profile_refused`). Aufzählungswerte (`values` einer Option vom Typ `enum`) haben noch keinen Schlüssel (Schuld TD-93).
10. **Vollständigkeit gegen die Register.** `registerTexts({ features, rights })` gibt jeden Text, den die Register verlangen, als `{ keys }`; `missingTexts(katalog, verlangt)` nennt, was im Katalog fehlt (Schlüssel fehlt, oder dort steht ein Record, eine Meldungsfunktion oder ein leerer Text). Die Register kommen als **schlichte Formen** (`FeatureRegisterShape`, `RightRegisterShape`): Ein `FeatureRegistry` und ein `RightRegistry` passen ohne Umweg, und `i18n` braucht weder `features` noch `access` (die Schichten bleiben schmal). `codeTexts('cantons', CANTONS)` verlangt je einen Text für die Werte einer festen Liste. Der Katalog der Ausgabe ist `mergeCatalogues(messages, katalogBranche, …)`; ein späterer Katalog überschreibt den früheren Blatt für Blatt (so schreibt eine Branche einen ganzen Satz neu).
11. **Befunde sind Daten, Fehler haben Codes:** `catalogueGaps`, `missingTexts`, `languageProblems` und `lexiconProblems` werfen nie und geben Listen zurück; `message` ist englisch, für die Person, die den roten Test liest. Bauen (`createLanguageRegistry`, `createLexicon`, `createCatalogueSet`) wirft einen `I18nError` mit dem Code des ersten Befunds.

## Der Texttest

Die Regeln einer Sprache sind Daten und stehen in `@onestrand/testing` (`DE_CH_TEXT_RULES`, `productNameRule`, `textProblems`); `testing` wird nie ausgeliefert, darum importiert `i18n` es nur in Tests (Entwicklungsabhängigkeit) und führt keine zweite Fassung der Regeln. Eine weitere Sprache bekommt ihre Regeln dort, wo de-CH sie hat (Schuld TD-92); bis dahin hat sie keine, und der Test eines Katalogs für diese Sprache lässt sich nicht grün schreiben, ohne dass jemand die Regeln der Sprache bringt. So prüft ein Test eine Ausgabe:

```ts
import { DE_CH_TEXT_RULES, textProblems } from '@onestrand/testing';
import { catalogueGaps, missingTexts, registerTexts, mergeCatalogues, messages, resolveCatalogue } from '@onestrand/i18n';

const catalogue = mergeCatalogues(messages, facilityMessages);   // der Katalog der Ausgabe in de-CH

// Regeln der Sprache: du, ss, keine Ausrufezeichen, keine Produktnamen.
expect(textProblems(catalogue, { rules: DE_CH_TEXT_RULES, productNames: PRODUCT_NAMES })).toEqual([]);

// Jede Kennung der Register hat ihre Texte.
expect(missingTexts(catalogue, registerTexts({ features: FEATURES, rights: RIGHTS }))).toEqual([]);

// Welche Sprache vollständig sein muss, entscheidet der Test; die anderen werden gelistet.
expect(catalogueGaps(messages, pt, 'pt')).toEqual([]);          // nur wenn pt vollständig sein muss
console.table(catalogueGaps(messages, pt, 'pt'));               // sonst: die Liste der Lücken
```

Der Test dieses Pakets (`test/messages.test.ts`) tut das für `messages` gegen die echten Register von `business` und die Listen von `features`, `access`, `contract` und `business`: Jeder Code hat einen Satz, und in den Abschnitten der festen Listen steht kein Schlüssel, den die Liste nicht kennt. Der Wächter für Wörter einer Branche und Produktnamen in `platform/` liest `messages.ts` mit; kein Wort einer Branche und kein Produktname steht darin.

## Beispiel

```ts
import {
  createCatalogueSet, createLexicon, defineTranslation, messages, platformTerms,
} from '@onestrand/i18n';

// Der Katalog eines Dokuments: eigene Quelle, eigene Sprachen.
const offer = { title: 'Offerte', total: (amount: string) => `Total ${amount}` };
const documents = createCatalogueSet(offer, {
  pt: defineTranslation(offer, { title: 'Proposta' }),   // total fehlt: fällt auf Deutsch zurück
});

// Sprache der Dokumente: die der Kundschaft, sonst die des Betriebs, sonst de-CH.
documents.forPreferences([customer.language, business.documentLanguage]).title;

// Der Katalog der App, ein Satz wie jeder andere.
const app = createCatalogueSet(messages);
app.forLanguage('de-CH').levels.manage;     // «Verwalten»

// Das Lexikon: ein Branchenwort für ein Ding der Plattform.
const lexicon = createLexicon({
  base: platformTerms,
  industries: [{ industry: 'alpha', terms: { object: { 'de-CH': { one: 'Standort', many: 'Standorte' } } } }],
});
lexicon.forLanguage('de-CH').many('object');   // «Standorte»
```

## Was dazugehört, aber nicht hier steht

- **Übersetzungen.** Keine Sprache ausser de-CH ist übersetzt, und kein Text einer anderen Sprache steht im Paket (ADR-0007, 5: Übersetzt wird beim Bauen, und eine Person mit dieser Muttersprache prüft, bevor ein Pilot sie sieht). Die Lücken zeigt der Test.
- **Formate** (Geld, Datum, Zahl je Sprache mit Region `-CH`, ADR-0007, 9): nicht in diesem Schritt; Geld und Datum haben schon eine Fassung in `@onestrand/core` (Schuld TD-94).
- **Wo die Sprache der Person liegt** (auf dem Gerät, nicht in der Sicherung) und wo die Sprache der Dokumente (an der Kundschaft, sonst am Betrieb) regeln `web-data`, `customers` und `business`; dieses Paket kennt nur die Kennung.
- **Namen der Sprachen** («Portugiesisch», «Português») für die Auswahl: kommen mit der Seite, die sie braucht.
- **Einfache Sprache und Symbole** für Sicherheitshinweise (ADR-0007, 6) sind eine Frage der Texte und der Bilder, nicht der Mechanik.

# Muster – die Referenz-Branche

`muster` ist eine erfundene Branche. Sie nutzt jeden Teil des Manifests einer Branche (`defineIndustry`, [ADR-0004](../../docs/adr/0004-andocken-einer-branche.md)) genau einmal, und sie dockt an, ohne dass eine Datei unter `platform/` sie nennt. Damit ist sie zweierlei:

- **der lebende Vertragstest der Plattform:** Bricht die Plattform etwas, das eine Branche braucht, werden die Tests von `muster` rot ([`docs/zusammenarbeit.md`](../../docs/zusammenarbeit.md), Abschnitt 4);
- **die Vorlage jeder neuen Branche:** Der Generator `pnpm industry:new <id>` (Auftrag W0-02, Schritt 9) kopiert sie, und wer eine Branche von Hand anlegt, geht nach den Schritten unten vor.

Fachlich ist `muster` klein: Ein Betrieb führt ein **Journal**. Wer im Betrieb arbeitet, hält in wenigen Worten fest, was an einem Tag geschah (ein Eintrag mit Kalendertag und Titel). Das ganze Journal einsehen, auch die Einträge der anderen, darf nur, wer das heikle Recht dazu hat. Mehr kann `muster` nicht, und mehr soll es nicht können.

Das Paket gehört dem Kopf (`registry/owners.json`); eine echte Branche gehört ihrem Branchen-Agenten.

## Aufbau

```
industries/muster/
├── README.md                diese Datei
└── core/                    @onestrand-industry/muster: reines TypeScript, kein Text
    ├── package.json         Name, Einstieg src/index.ts, Abhängigkeiten nur auf Plattform-Pakete
    ├── tsconfig.json        Typprüfung von src, test und Konfiguration (mit Node-Typen)
    ├── tsconfig.src.json    Reinheits-Prüfung: nur src, ohne DOM und ohne Node-Typen
    ├── vitest.config.ts     Projekt «muster-core»
    ├── src/
    │   ├── entries.ts       Kennungen und Einträge in die Register (Modul, Funktion, Option,
    │   │                    Betriebsart, Frage, Gerätemodus, heikles Recht)
    │   ├── model.ts         die Tabelle muster_entries, ihr Schema, Funktion und Recht der Tabelle
    │   ├── contract.ts      das Fragment der Schnittstelle (ein Befehl, eine Abfrage), Ereignisse
    │   ├── use-cases.ts     ein Use Case je Operation
    │   ├── content.ts       Vorlage, Regelwerk mit Quelle, Demo-Betrieb
    │   ├── demo.ts          legt den Demo-Betrieb über die Operationen an
    │   ├── industry.ts      das Manifest: defineIndustry({ … })
    │   └── index.ts         der öffentliche Einstieg
    └── test/
        ├── messages.ts      die Texte in de-CH (bis W0-03, siehe unten)
        ├── support.ts       eine Ausgabe aus Betrieb und muster, ein Betrieb im Speicher
        ├── industry.test.ts Manifest, Register, Andocken ohne Plattform-Datei, Namensräume
        ├── edition.test.ts  editionProblems, Texte, Rückfall auf Deutsch
        ├── use-cases.test.ts Operationen, Rechte, ausgeschaltete Funktion, Sicherung, Filter
        ├── demo.test.ts     Demo über die Operationen, Sicherung hin und zurück
        └── index.test.ts    die Liste der Exporte
```

## Jeder Teil des Manifests, einmal

| Teil | Kennung | Was es zeigt |
| --- | --- | --- |
| Branche | `muster` | trägt sich selbst ein (`defineIndustry` setzt `industries` und `rights.industry`); Präfix aller Kennungen |
| Tabelle | `muster_entries` | eigene Tabelle mit Präfix, zeigt nur über `businessId` auf die Plattform; als Ganzes `sensitive` |
| Befehl | `muster.entries.add` | Stufe `operate`; läuft durch `runCommand`, schreibt das Ereignis `muster_entry.added` |
| Abfrage | `muster.entries.list` | Stufe `view` und das heikle Recht `muster.journal_read`; liest die Option der Funktion |
| Modul | `muster.journal` | eine Gruppe im Register der Funktionen |
| Funktion | `muster.entries` | schaltbar; jede Operation und der Filter nennen sie |
| Option | `newestFirst` (an `muster.entries`) | `boolean`, Vorgabe `true`: die Liste zeigt den neuesten Tag zuerst |
| Betriebsart | `muster.standard` | startet mit der Funktion (`on`) |
| Frage beim Einrichten | `muster.keeps_journal` | «ja» schaltet die Funktion ein, «nein» aus («aus» gewinnt vor «an») |
| Gerätemodus | `muster.capture` | ein gemeinsames Gerät, das nur erfasst |
| Heikles Recht | `muster.journal_read` | das ganze Journal einsehen; öffnet auch die Tabelle für fremde Geräte |
| Ereignis | `muster_entry.added` | Nutzlast nur mit Kennung |
| Vorlage | `muster.staff` (Art `profile`) | ein Profil «erfassen, nichts der anderen sehen», das ein Betrieb kopiert |
| Regelwerk | `muster.retention` | Aufbewahrung 10 Jahre ab Ende des Geschäftsjahres (OR 958f Abs. 1), Quelle `docs/fakten/geld-steuern.md`, Abschnitt 3 |
| Demo | «Betrieb Muster», «Person Muster», «Person Beispiel» | erfundene Namen; den Inhalt legt `layOutMusterDemo` über die Operationen an |
| Migration | keine | die Tabelle hatte erst eine Form; siehe unten |

Was nicht im Manifest steht, aber zur Branche gehört: `musterTableAccess` nennt Funktion und Recht der Tabelle, die der Filter für fremde Geräte (`filterRowsForDevice`) braucht. Das Manifest hat dafür noch kein Feld (Schuld TD-70); bis dahin steht es neben den Tabellen.

## Wo Texte und Namen leben

- **Kein Text im reinen Teil.** `core/src` hält nur Kennungen, Schemas und Daten. Die Namen und Sätze der Branche stehen im Katalog unter denselben Kennungen (`modules`, `features`, `options`, `kinds`, `questions`, `deviceModes`, `rights`; die Regel steht in `platform/i18n/api.md`, Regel 9).
- **Der Katalog liegt bis W0-03 bei den Tests** (`core/test/messages.ts`). Seinen Platz hat er im React-Teil der Branche (`industries/<id>/web`, `@onestrand/i18n`, Regel 8), und diesen Teil bringt erst W0-03 mit `defineIndustryWeb`. Bis dahin liest ihn nur der Konformitätstest, also steht er bei ihm. W0-03 verschiebt die Datei unverändert (Schuld TD-111).
- **Getippte Daten sind kein Text der App.** Die Namen im Demo-Betrieb und die Titel seiner Einträge sind erfundene Namen im Stil von «Betrieb Muster»; sie werden nie übersetzt (ADR-0007).
- **Die Kennungen stehen im Namensregister** (`registry/names.json`): Paket, Tabelle, Operationen, Ereignis, Funktion, Modul und Recht. Der Wächter `pnpm names` liest sie aus dem Manifest jeder Branche unter `industries/`, eine neue Branche braucht dort keine Zeile. Betriebsart, Frage, Gerätemodus, Option, Vorlage und Regelwerk kennt das Register noch nicht als Art (Schuld TD-52).

## Eine neue Branche nach dem Muster

Am einfachsten mit dem Generator: `pnpm industry:new <id>` kopiert `core/` nach `industries/<id>/core`, benennt jede Kennung in den Namensraum von `<id>` um (die erfundenen Namen wie «Betrieb Muster» bleiben), formatiert die Dateien und schreibt den Vorschlag der Namen nach `industries/<id>/NAMES.md`; das Register, die Wortliste und `docs/branchen/` berührt er nicht. Er weist eine Kennung ab, die es schon gibt, die ein Plattform-Paket, ein reserviertes Wort der Suite oder von JavaScript (die Kennung wird der Name des Manifests, `export const <id> = defineIndustry(…)`) oder ein Wort ist, das dieses Muster selbst braucht (etwa `zwilling` aus dem Test zweier Branchen), und eine, die `muster` enthält. Danach `pnpm install` und `pnpm check:industry <id>`; die Kopie ist grün, bevor das Fach beginnt (Schritte 5 bis 10 unten). Wer hier eine neue Form der Kennung einführt, die der Generator nicht umbenennt, macht den Test der Werkzeuge rot (`tools/test/industry-new.test.ts`).

Von Hand, mit `<id>` für die Kennung der Branche (Kleinbuchstaben und Ziffern, etwa `facility`):

1. **Auftrag und Steckbrief lesen.** Ohne Auftrag in `docs/auftraege/` kein Code; die Fakten der Branche stehen im Steckbrief in `docs/branchen/`.
2. **Ordner kopieren:** `industries/muster/core` nach `industries/<id>/core`, ohne `node_modules`.
3. **Paket umbenennen:** in `package.json` der Name `@onestrand-industry/<id>`, in `vitest.config.ts` das Projekt `<id>-core`. Der Pfad in `pnpm-workspace.yaml`, die Projekte und die Schwellen der Abdeckung in der Wurzel-`vitest.config.ts` und die Regeln in `eslint.config.js` nehmen jede Branche unter `industries/*/core` schon mit.
4. **Kennungen umbenennen:** jedes `muster` als Präfix wird `<id>`: Tabellen `<id>_<name>`, Operationen `<id>.<bereich>.<verb>`, Ereignisse `<id>_<ding>.<was_geschah>`, Funktionen, Module, Betriebsarten, Fragen, Gerätemodi, Rechte, Vorlagen und Regelwerke `<id>.<name>`. Die Namen der Exporte (`muster`, `musterContract`, `createMusterUseCases` …) folgen der Kennung. `defineIndustry` weist alles ab, was nicht im eigenen Namensraum liegt.
5. **Fach einsetzen:** Tabellen, Schemas, Operationen und Use Cases der Branche statt des Journals. Jede Operation erklärt `access` (Funktion, Stufe, heikle Rechte); die Use Cases prüfen nie selbst ein Recht. Geld als Ganzzahl in Rappen, Kalendertage als `YYYY-MM-DD`, Ledger, wo Geld, Zeit, Bestand oder Nachweise entstehen.
6. **Regelwerke nur mit Quelle:** jede Regel aus `docs/fakten/` oder dem Steckbrief, mit dem Pfad in `source`; der Wächter prüft, dass die Datei dasteht. Richtwerte heissen in der App «Richtwert».
7. **Texte schreiben:** `test/messages.ts` mit einem Text für jede Kennung, de-CH, mit «du» und «ss», ohne Ausrufezeichen. Der Test `edition.test.ts` nennt jeden fehlenden Schlüssel.
8. **Namen anmelden:** die neuen Kennungen in `industries/<id>/NAMES.md` vorschlagen; der Kopf trägt sie in `registry/names.json` ein (`owner: "industry:<id>"`). Bis dahin ist `pnpm names` rot, und das ist Absicht.
9. **Wörter der Branche:** der Kopf legt die Liste der Wörter, die die Branche verraten, in `tools/src/words/<id>.ts` an, damit keines davon in die Plattform rutscht.
10. **Prüfen:** `pnpm install`, dann `pnpm --filter @onestrand-industry/<id> typecheck`, `pnpm exec vitest run --project <id>-core` dann `pnpm check:industry <id>` (alles, was eine Branche vor dem Landen besteht) und `pnpm check` bis `ALL=GREEN`.

Was die Tests jeder Branche zeigen, und woran sie rot werden: Das Manifest wird ohne Befund angenommen; die Ausgabe aus Betrieb und Branche hat `editionProblems` gleich `[]`; eine Operation ohne `access` wird abgewiesen (geprüft an einer Kopie); eine Operation ohne das Recht wird mit `forbidden` abgewiesen; zwei Teile mit derselben Operation scheitern; eine ausgeschaltete Funktion hat keine Einstiege, ihre Daten bleiben, auch in der Sicherung; ein fehlender Text einer anderen Sprache fällt auf Deutsch zurück und steht in der Liste der Lücken; der Demo-Betrieb entsteht über die Operationen; die Sicherung geht hin und zurück.

## Was noch fehlt

- **Der React-Teil** (`industries/<id>/web`, `defineIndustryWeb`: Routen, Navigation, Abschnitte, Texte, Lexikon) kommt mit W0-03. Die Tests zeigen heute schon mit `availableSlotEntries`, dass eine ausgeschaltete Funktion keinen Einstieg hat.
- **Eine Migration** braucht `muster` erst, wenn sich die Form von `muster_entries` ändert. Dann kommt sie ins Manifest (`migrations: [{ id: 'muster.<name>', table: 'muster_entries', upgrade }]`, `upgrade` rein: eine Zeile hinein, eine heraus), und jede Ausgabe mit `muster` bekommt einen Schritt im Schema-Ledger.
- **Der Demo-Betrieb** hat im Manifest nur Namen und Betriebsart; wie die App `layOutMusterDemo` aufruft, entscheidet W0-03.
- **Funktion und Recht einer Tabelle** gehören ins Manifest, sobald der Abgleich zwischen Geräten sie braucht (Schuld TD-70).

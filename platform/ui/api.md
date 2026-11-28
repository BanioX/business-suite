# @onestrand/ui (P-08)

Das UI-Kit der Suite: Knöpfe, Felder, Listen, Hinweise, Dialoge und Kennzahlen für iPhone, iPad und Web, in React 19 mit Tailwind 4. Das Kit zeichnet nur mit **Rollen** (`accent`, `surface`, `fg` …); die Farben bringt jede Ausgabe als **Thema** mit ([S-27](../../docs/entscheide.md)). Es hat keine Nebenwirkung, speichert nichts, kennt keine Daten, keine Rechte und kein Gerät; das kommt über die Shell. Schicht «React»: das Paket importiert nur `@onestrand/core` (Geld, Datum, Zahlen) und `@onestrand/i18n` (seinen Katalog in anderen Sprachen).

```ts
import { Button, MoneyField, UiProvider, defineTheme, themeCss } from '@onestrand/ui';
import '@onestrand/ui/kit.css'; // im CSS der Ausgabe: @import '@onestrand/ui/kit.css';
```

## Was das Paket exportiert

| Bereich | Exporte | Wozu |
| --- | --- | --- |
| Thema | `TOKENS`, `Token`, `Palette`, `ThemeInput`, `Theme`, `defineTheme`, `themeProblems`, `ThemeProblem`, `THEME_PROBLEM_CODES`, `ThemeError`, `themeCss`, `ThemeCssOptions`, `neutralTheme`, `SCHEMES`, `SCHEME_ATTRIBUTE`, `CONTRAST_PAIRS`, `ContrastPair` | Farben der Ausgabe, hell und dunkel, als CSS-Variablen; die Paare, die die Kontrastprüfung misst |
| Rahmen | `UiProvider`, `useUiTexts`, `useToday`, `useCurrency`, `KitLink`, `KitLinkProps`, `LinkComponent`, `uiMessages`, `UiMessages` | Sprache, heute, Währung und Link des Routers, von aussen gegeben |
| Knöpfe | `Button` (`primary`, `secondary`, `quiet`, `danger`; `busy`), `ButtonLink`, `IconButton`, `buttonClasses` | eine Hauptaktion je Seite; das Zahnrad oben rechts |
| Felder | `Field`, `FieldGroup`, `TextField`, `TextArea`, `NumberField`, `MoneyField`, `QuantityField`, `TimeField`, `DateField` (mit `CalendarButton`), `SelectField`, `Checkbox`, `Switch`, `SegmentedControl`; Bausteine `InputBox`, `ParsedField`, `useParsedText`, `useSubmitGuard`, `controlClass`, `BOXED_INPUT_CLASS`, `FIELD_LABEL_CLASS`, `FieldError`, `fieldLabelId`, `joinIds`, `firstError`, `withoutTrailingMark`, `readWholeNumber`, `readMilli`, `formatMilli`, `readTimeOfDay`, `TIME_OF_DAY_PATTERN`, `describeDate`, `describeRelative`, `nextDateText`, `isMonthOnly` | Beschriftung, Hinweis, Fehler, Pflicht; Geld in Rappen, Tage als `LocalDate` |
| Listen und Flächen | `GroupedList`, `GroupedListItem`, `ListRow`, `GROUPED_ROW_LINK`, `StatusChip`, `toneClasses`, `Tone`, `Card`, `Notice`, `EmptyState`, `PageHeader`, `BackLink`, `Section` | Liste wie in den Einstellungen von iOS, Stand in Worten, leere Liste mit Weg |
| Dialoge | `Sheet`, `ConfirmDialog`, `ToastProvider`, `useToast`, `TOAST_MS`, `TOAST_MIN_MS`, `ToastOutlet`, `useToastHost` | Blatt von unten auf dem Handy, Mitte ab Tablet; ruhige Meldungen in einer Reihe |
| Kennzahlen | `StatTile`, `KpiGrid`, `StatTone` | eine Zahl auf der ruhigen Fläche, zwei bis vier nebeneinander |

## Regeln, die du kennen musst

1. **Farben nur aus Tokens.** Komponenten schreiben `bg-accent`, `text-muted`, `border-line-strong`, nie eine feste Farbe. `kit.css` schaltet die Palette von Tailwind aus und bildet jedes Token auf eine Variable ab (`bg-accent` heisst `background-color: var(--accent)`). Ein Test des Pakets findet jede Farbe, die kein Token ist, ein Wächter jedes Farbwort einer Marke unter `platform/`.
2. **Die Tokens** (`TOKENS`): `ground` (Grund hinter der App), `app` (Grund der App), `surface`, `surface-muted`, `calm-start` und `calm-end` (ruhige Fläche der Kennzahlen), `fg`, `muted`, `line` (Haarlinie, ohne Kontrast), `line-strong` (Rand, der gesehen werden muss), `accent` (Fläche, die handelt oder markiert), `on-accent` (Schrift darauf), `accent-strong` (Akzent als Schrift), `accent-edge` (Rand von Gewähltem und Fokusring), `accent-soft`, dazu `ok`, `warn`, `bad` mit je `-soft`. Blau heisst nie «gut» oder «schlecht»: `accent` markiert, die Bedeutung tragen `ok`, `warn`, `bad`, immer mit Wort oder Symbol.
3. **Das Thema ist ein Parameter der Ausgabe.** `defineTheme({ id, light, dark })` prüft jedes Token (Form `#rrggbb`), senkt die Buchstaben und friert ein; `themeProblems` nennt die Befunde als Daten, `defineTheme` wirft `ThemeError` mit dem Code des ersten. Die Plattform liefert nur `neutralTheme` (Schiefer und Weiss, ohne Marke).
4. **`themeCss(theme)`** schreibt die Variablen für beide Modi: hell als Grundlage, dunkel, wenn das Gerät es will (`prefers-color-scheme`), und die Wahl der Person vor dem Gerät (`<html data-scheme="dark">` oder `"light"`, `SCHEME_ATTRIBUTE`). Schatten und der Schleier hinter einem Blatt entstehen aus den Tokens. Die CSP der Ausgaben erlaubt keinen Stil im Dokument: Die Ausgabe schreibt das CSS beim Bauen in eine Datei (die Galerie zeigt den Weg mit einem Modul `virtual:theme.css` in `gallery/vite.config.ts`).
5. **Kontrast je Thema.** `CONTRAST_PAIRS` nennt jedes Paar, das das Kit zeichnet, mit dem Mindestwert von WCAG 2.2 (4.5 für Schrift, 3 für Ränder). Der Wächter `pnpm contrast` (auch in `pnpm guards`) misst jedes Thema des Repos: `neutralTheme` und das Thema jeder Ausgabe in `editions/<id>/theme.ts`. Zeichnet eine Komponente ein neues Paar, kommt es im selben Schritt in die Liste.
6. **Texte nur aus dem Katalog.** `uiMessages` ist die Quelle in de-CH (du, ss, ohne Ausrufezeichen). Keine Komponente hält eigenen Text; ein Test findet Text im Markup. `UiProvider translation={…}` gibt eine andere Sprache, eine Lücke fällt Schlüssel für Schlüssel auf de-CH zurück. Texte der Seite (Beschriftungen, Titel) gibt die Seite aus ihrem eigenen Katalog.
7. **Von aussen, nie vom Gerät.** `UiProvider` gibt `today` (das Datumsfeld rechnet von dort, ohne `today` wirft es), `currency` (Vorgabe CHF) und `link`, die Link-Komponente des Routers. Ohne Provider ist ein Link ein schlichtes `<a>`. `ListRow`, `ButtonLink`, `BackLink`, `Section` und `StatTile` nehmen `href`.
8. **Geld, Mengen, Zeiten und Tage.** `MoneyField` liest «12.50», «12,50», «1’234.50» über `parseMoney` und gibt `Rappen` oder `null` zurück, nie ein Float. `DateField` nimmt `TT.MM.JJJJ`, setzt beim Tippen die Punkte, sagt darunter, was es verstanden hat («Di, 1. Dez. 2026 · in 3 Tagen»), und öffnet den Kalender des Geräts. `QuantityField` liest bis drei Nachkommastellen («2.5», «1’250,125») in **Tausendstel** als ganze Zahl (2.5 h sind 2500; die Menge des Kerns ist `value / 1000`), die Einheit steht dahinter (`unit`); mehr Stellen meldet es. `TimeField` nimmt eine Uhrzeit mit 24 Stunden als `HH:MM`: «745», «7.45», «7,45» und «7:45» sind 07:45. `NumberField` liest «1.000» und «1,000» nicht als 1, sondern fragt nach (ein Tausender oder eine Eins ist eine Vermutung); «-0» ist 0. Ein Tag als ISO von der Tastatur («2026-11-20») behält seine Form; ein Monat ohne Tag («11.2026») ist im Datumsfeld kein Tag (`isMonthOnly`). Eine Schnellwahl ausserhalb von `min` und `max` ist ausgeschaltet.
9. **Formulare.** Alle Felder sind gesteuert (`value`, `onChange`). Ein Feld, das Text nicht lesen kann, gibt `null` und meldet es, sobald die Person das Feld verlässt oder das Formular sendet; ein Formular mit `required`-Feldern geht nicht ab, und das erste Feld mit Befund bekommt den Fokus.
10. **Barrierefreiheit.** Jedes Feld hat eine Beschriftung (`hideLabel` behält sie für Screenreader), Fehler hängen über `aria-describedby` am Feld, Ziele haben mindestens 44 px, Felder mindestens 16 px Schrift (sonst zoomt iOS), der Fokus ist sichtbar (`accent-edge`), Bewegung folgt «Bewegung reduzieren». Ein Test misst Ziele und Schriften.
11. **Meldungen gehen nicht verloren.** `useToast()` reiht ein: Eine Meldung steht fünf Sekunden (`TOAST_MS`); wartet eine weitere, macht sie nach zwei Sekunden Platz (`TOAST_MIN_MS`). Eine Meldung über etwas Falsches (`tone: 'bad'`) steht immer ihre ganzen fünf Sekunden. Zeigt die Person auf sie oder hat sie den Fokus, wartet sie.
12. **Meldungen über einem Blatt.** Hinter einem modalen Dialog ist die Seite träge (`inert`): Eine Meldung dort wäre weder über dem Blatt zu sehen noch würde sie vorgelesen. Darum zeigt ein offenes `Sheet` die Meldung in sich, oben, über dem Blatt (in Chromium gemessen: zuoberst, im Baum der Barrierefreiheit, `aria-live="polite"`). **Regel:** Wer einen eigenen modalen Dialog baut, ruft `const host = useToastHost(open)` und setzt `<ToastOutlet host={host} />` in den Dialog. Jeder Dialog trägt `aria-modal="true"`.
13. **Keine Sogwirkung** ([S-26](../../docs/entscheide.md), Punkt 4): keine Zähler als Lockmittel, kein Lob. Eine Kennzahl sagt, wie es steht.

## Beispiel: das Thema einer Ausgabe

Die Werte aus S-27 (heller Ton von Onestrand; dunkel wie Onestrand selbst), wie sie die Tests und die Galerie nehmen (`test/example-theme.ts`):

```ts
export const theme = defineTheme({
  id: 'example',
  light: {
    ground: '#e6e9ee', app: '#f4f6f9', surface: '#ffffff', 'surface-muted': '#eceff3',
    'calm-start': '#ffffff', 'calm-end': '#e6e9ee', fg: '#10141b', muted: '#545c69',
    line: '#dde1e7', 'line-strong': '#7a8291', accent: '#8dbdff', 'on-accent': '#061633',
    'accent-strong': '#0a5bea', 'accent-edge': '#0a5bea', 'accent-soft': '#e6f0ff',
    ok: '#1d6b3f', 'ok-soft': '#e3f4e8', warn: '#8a5200', 'warn-soft': '#fcf0db',
    bad: '#b3261e', 'bad-soft': '#fdecea',
  },
  dark: {
    ground: '#000000', app: '#05070b', surface: '#10141b', 'surface-muted': '#1b212b',
    'calm-start': '#161b23', 'calm-end': '#0b0f15', fg: '#f4f6f9', muted: '#9aa1ac',
    line: '#232a35', 'line-strong': '#6b7484', accent: '#5aa2ff', 'on-accent': '#061633',
    'accent-strong': '#8dbdff', 'accent-edge': '#8dbdff', 'accent-soft': '#0f2142',
    ok: '#6fcf97', 'ok-soft': '#0f2a1b', warn: '#f2b56b', 'warn-soft': '#2e1f0a',
    bad: '#ff8a80', 'bad-soft': '#3a1513',
  },
});
// beim Bauen: writeFile('theme.css', themeCss(theme))
```

## Beispiel: eine Seite

```tsx
<UiProvider today={today} currency={business.currency} link={RouterLink} translation={pt}>
  <ToastProvider>
    <PageHeader title="Offerte" back={{ href: '/kundschaft', label: 'Kundschaft' }}
      corner={<IconButton icon={Settings} label={texts.settings} />} />
    <MoneyField label={texts.amount} value={amount} onChange={setAmount} required />
    <Button type="submit">{texts.save}</Button>
  </ToastProvider>
</UiProvider>
```

## Galerie

`pnpm --filter @onestrand/ui gallery` zeigt jede Komponente im Thema nach S-27 (`gallery/`, nur zur Entwicklung, nie ausgeliefert, nicht in der Abdeckung); `?scheme=dark` wählt den dunklen Modus von Hand.

## Was nicht hier steht

Bausteine einer Branche (Temperatur, Auswahl von Artikeln, Fotos einer Ware) bleiben in der Branche. Suchfeld, Tabelle, Diagramme, Auswahl mit Suche und Foto-Feld folgen mit der ersten Seite, die sie braucht (Schuld TD-125); Teilen, Drucken und Kamera sind `@onestrand/web-device`, das PDF `@onestrand/pdf`, Navigation und Hooks `@onestrand/shell`.

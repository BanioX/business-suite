// Origin: BanioX/Randen apps/web/src/ui/messages.forms.ts @ e0f0907 — adapted: only the texts of the fields this kit has; weekdays and months as named keys; no quantity, price, percent, temperature, picker and photo texts
// Origin: BanioX/Randen apps/web/src/ui/messages.display.ts @ e0f0907 — adapted: only close, cancel, confirm and the words of the tones; no texts of a trade
/**
 * The texts of the kit, in German (Switzerland): the source of every other language (suite
 * ADR-0007). «ss» instead of «ß», one person addressed with «du», no exclamation mark. An error
 * says what is and what to do, without blame and without technical words. No component holds a
 * text of its own: each reads this catalogue through `useUiTexts()`, so `UiProvider` can hand in
 * another language (`translation`, falling back to these texts key by key).
 */
export const uiMessages = {
  field: {
    /** Beside the label of a field that may stay empty. */
    optional: 'optional',
    /** Under a field that must be filled, once a form tried to send it empty. */
    required: 'Hier fehlt eine Angabe.',
  },
  number: {
    unreadable: 'Das ist keine ganze Zahl. Trag zum Beispiel 12 ein.',
    min: (min: string) => `Trag mindestens ${min} ein.`,
    max: (max: string) => `Trag höchstens ${max} ein.`,
  },
  money: {
    unreadable: (example: string) =>
      `Dieser Betrag lässt sich nicht lesen. Trag zum Beispiel ${example} ein.`,
    negative: 'Trag einen Betrag ab 0 ein.',
  },
  quantity: {
    unreadable: (example: string) =>
      `Diese Menge lässt sich nicht lesen. Trag zum Beispiel ${example} ein.`,
    digits: 'Trag höchstens drei Stellen nach dem Punkt ein.',
    negative: 'Trag eine Menge ab 0 ein.',
  },
  time: {
    placeholder: 'HH:MM',
    unreadable: 'Diese Uhrzeit lässt sich nicht lesen. Trag zum Beispiel 7:45 oder 745 ein.',
  },
  select: {
    /** The empty choice of a list. */
    placeholder: 'Bitte wählen',
  },
  date: {
    placeholder: 'TT.MM.JJJJ',
    openCalendar: 'Kalender öffnen',
    /** The name of the quick choices under a date. */
    presets: 'Schnellwahl',
    unreadable: 'Dieses Datum gibt es nicht. Trag zum Beispiel 20.11.2026 ein.',
    min: (date: string) => `Trag ein Datum ab dem ${date} ein.`,
    max: (date: string) => `Trag ein Datum bis zum ${date} ein.`,
    weekdays: {
      sun: 'So',
      mon: 'Mo',
      tue: 'Di',
      wed: 'Mi',
      thu: 'Do',
      fri: 'Fr',
      sat: 'Sa',
    },
    months: {
      jan: 'Jan.',
      feb: 'Feb.',
      mar: 'März',
      apr: 'Apr.',
      may: 'Mai',
      jun: 'Juni',
      jul: 'Juli',
      aug: 'Aug.',
      sep: 'Sept.',
      oct: 'Okt.',
      nov: 'Nov.',
      dec: 'Dez.',
    },
    relative: {
      today: 'heute',
      tomorrow: 'morgen',
      yesterday: 'gestern',
      days: (n: number) => `${String(n)} Tagen`,
      weeks: (n: number) => (n === 1 ? '1 Woche' : `${String(n)} Wochen`),
      months: (n: number) => (n === 1 ? '1 Monat' : `${String(n)} Monaten`),
      years: (n: number) => (n === 1 ? '1 Jahr' : `${String(n)} Jahren`),
      future: (amount: string) => `in ${amount}`,
      past: (amount: string) => `vor ${amount}`,
    },
  },
  dialog: {
    close: 'Schliessen',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
  },
  /** What a key figure says about its tone when the page gives no words of its own. */
  tone: {
    ok: 'In Ordnung',
    warn: 'Im Blick behalten',
    bad: 'Prüfen',
    neutral: 'Ohne Wertung',
  },
} as const;

export type UiMessages = typeof uiMessages;

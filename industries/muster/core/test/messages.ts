/**
 * The catalogue of `muster` in de-CH: a name and a sentence for its module and function, the name
 * of its option, kind and device mode, the text of its question and answers, a name and a
 * sentence for its delicate right (`registerTexts` of `@onestrand/i18n` asks for exactly these,
 * under the ids of the registers).
 *
 * Why it stands here, among the tests: the pure part of an industry holds no text (suite ADR-0004,
 * «Was eine Branche nicht darf»; architecture 3.2, rule 6), and an industry keeps its catalogue in
 * its React part, `industries/<id>/web` (`@onestrand/i18n`, rule 8), which comes with W0-03
 * (`defineIndustryWeb({ messages })`). Until then the only reader of these texts is the
 * conformity test of the industry, so they live with it. W0-03 moves the file to
 * `industries/muster/web` unchanged and the test imports it from there (debt TD-111).
 */
export const musterMessages = {
  modules: {
    'muster.journal': {
      name: 'Journal',
      summary: 'Kurze Einträge zu dem, was an einem Tag im Betrieb geschah.',
    },
  },
  features: {
    'muster.entries': {
      name: 'Einträge',
      summary: 'Du hältst in wenigen Worten fest, was an einem Tag geschah.',
    },
  },
  options: {
    'muster.entries': { newestFirst: 'Neueste Einträge zuerst' },
  },
  kinds: {
    'muster.standard': 'Musterbetrieb',
  },
  questions: {
    'muster.keeps_journal': {
      text: 'Führst du im Betrieb ein Journal?',
      answers: { yes: 'Ja', no: 'Nein' },
    },
  },
  deviceModes: {
    'muster.capture': 'Nur erfassen',
  },
  rights: {
    'muster.journal_read': {
      name: 'Journal einsehen',
      summary: 'Du siehst alle Einträge im Journal, auch die von anderen Personen.',
    },
  },
};

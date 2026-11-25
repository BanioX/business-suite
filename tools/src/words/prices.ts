/**
 * The rules of the price check, as data (ADR-0011: no prices of the suite in this repository).
 * The logic that applies them is `priceProblems` in `../public-repo.ts`.
 *
 * A rule looks at the text around an amount of money (see `PRICE_WINDOW`). It fires when every
 * one of its word lists has a word there. Words are whole words or phrases in lower case; a
 * space stands for any white space; upper and lower case are the same.
 *
 * The check is tuned against `docs/fakten/` and the industry briefs: minimum wages, fees, rates
 * and thresholds «pro Monat» or «im Jahr» are facts of the trades and must pass, and so must a
 * sentence in which an app shows a price of the trade. That is why a word such as «pro Monat» or
 * «Preis» alone is never enough: a rule also needs the suite or one of its apps as the subject,
 * and the more everyday the subject, the narrower the words that count with it.
 */

/** How the suite is called by name. Nothing of a trade is called so, so every price word counts. */
export const SUITE_NAMES = ['onestrand', 'onestrands', 'business suite'] as const;

/**
 * The names of the editions. A new edition gets its line here.
 * - An edition whose name is an everyday word is not listed bare (a «Studio» is also a gym with
 *   a monthly fee): list it the way it is written as a product, with the word before it.
 * - «Ausgabe» itself is not listed on purpose: the word also means an expense, and «Ausgaben von
 *   … Franken pro Monat» is everyday bookkeeping.
 */
export const EDITION_NAMES = ['randen', 'randens'] as const;

/**
 * Words that mean the suite or one of its apps without naming it. They are everyday words
 * («die App zeigt …»), so they only count together with the narrow lists below.
 * «Suite» is also a room of a hotel: a brief of the lodging trade that trips over it says
 * «Zimmer» instead.
 */
export const GENERIC_SUBJECTS = ['suite', 'app', 'apps', 'software'] as const;

/** Words for a paid plan. Some trades sell such plans themselves, so they need a subject. */
export const PLAN_WORDS = [
  'abo',
  'abos',
  'jahresabo',
  'monatsabo',
  'abopreis',
  'abopreise',
  'abomodell',
  'abonnement',
  'abonnements',
  'abonnemente',
  'lizenz',
  'lizenzen',
  'lizenzgebühr',
  'lizenzgebühren',
  'lizenzpreis',
  'lizenzkosten',
  'lizenzmodell',
  'subscription',
  'subscriptions',
  'licence',
  'licences',
  'license',
  'licenses',
] as const;

/** Words for a price that comes back every month or year. A wage does too, so: only by name. */
export const PERIOD_WORDS = [
  'pro monat',
  'je monat',
  'im monat',
  'monatlich',
  '/monat',
  '/ monat',
  'pro jahr',
  'je jahr',
  'im jahr',
  'jährlich',
  '/jahr',
  '/ jahr',
  'per month',
  'a month',
  'monthly',
  '/month',
  'per year',
  'a year',
  'yearly',
  'annually',
  '/year',
] as const;

/**
 * Words that turn an amount into a price in general. An edition has prices of its trade as its
 * subject matter (the price of a dish), so these count only next to the name of the suite.
 */
export const PRICE_WORDS = [
  ...PLAN_WORDS,
  ...PERIOD_WORDS,
  'preis',
  'preise',
  'preisen',
  'preises',
  'monatspreis',
  'jahrespreis',
  'preismodell',
  'tarif',
  'tarife',
  'tarifen',
  'kostet',
  'price',
  'prices',
  'pricing',
  'costs',
] as const;

/** Wording that only software pricing uses: no trade bills «pro Nutzer». Needs no subject. */
export const PER_USER_WORDS = [
  'pro nutzer',
  'pro nutzerin',
  'pro nutzer:in',
  'je nutzer',
  'je nutzer:in',
  'pro benutzer',
  'pro benutzerin',
  'pro benutzer:in',
  'pro user',
  'pro lizenz',
  '/nutzer',
  '/user',
  'per user',
  'per seat',
  'per licence',
  'per license',
] as const;

/**
 * Phrases that say «the price of the app» or «the app costs» in so many words. The article is
 * part of the phrase on purpose: «die App kostet» states a price of the app, «in der App kostet
 * die Mehrfachkarte …» a price of the trade.
 */
export const PRICE_OF_PHRASES = [
  ...GENERIC_SUBJECTS.flatMap((subject) => [
    `preis der ${subject}`,
    `preise der ${subject}`,
    `preis für die ${subject}`,
    `preise für die ${subject}`,
    `preis pro ${subject}`,
    `die ${subject} kostet`,
    `unsere ${subject} kostet`,
    `kostet die ${subject}`,
    `kostet unsere ${subject}`,
    `price of the ${subject}`,
    `prices of the ${subject}`,
    `pricing of the ${subject}`,
    `price for the ${subject}`,
    `cost of the ${subject}`,
    `the ${subject} costs`,
    `${subject} pricing`,
  ]),
  'die apps kosten',
  'kosten die apps',
  ...[...SUITE_NAMES, ...EDITION_NAMES].flatMap((name) => [
    `preis von ${name}`,
    `preise von ${name}`,
    `preis für ${name}`,
    `preise für ${name}`,
    `was ${name} kostet`,
    `was kostet ${name}`,
    `price of ${name}`,
    `prices of ${name}`,
    `${name} pricing`,
  ]),
];

/** One rule of the price check: every list needs a word near the amount. */
export interface PriceRuleData {
  id: string;
  /** What the rule finds, for the message. */
  finds: string;
  all: readonly (readonly string[])[];
}

export const PRICE_RULES: readonly PriceRuleData[] = [
  {
    id: 'by-name',
    finds: 'the suite by name, a price word and an amount',
    all: [SUITE_NAMES, PRICE_WORDS],
  },
  {
    id: 'edition',
    finds: 'an edition by name, a word for a paid plan or a price per month or year, and an amount',
    all: [EDITION_NAMES, [...PLAN_WORDS, ...PERIOD_WORDS]],
  },
  {
    id: 'plan',
    finds: 'the suite or an app, a word for a paid plan and an amount',
    all: [GENERIC_SUBJECTS, PLAN_WORDS],
  },
  {
    id: 'price-of',
    finds: 'a phrase such as «Preis der App» or «die App kostet» and an amount',
    all: [PRICE_OF_PHRASES],
  },
  {
    id: 'per-user',
    finds: 'an amount per user, which only software pricing uses',
    all: [PER_USER_WORDS],
  },
];

/**
 * How far from the amount a rule looks, in characters to each side. The text is also cut at the
 * borders of a table cell, so a long row of facts is not read as one sentence.
 */
export const PRICE_WINDOW = 120;

import type { MessageTree } from './catalogue';
import type { TermEntries } from './lexicon';

/**
 * The texts of the platform in de-CH: the source of every language (suite ADR-0007). This file
 * and the files `messages.<language>.ts` beside it are the one place in the pure part of the
 * platform where texts stand; everything else names things by id and takes the text from here
 * (architecture 3.2, rule 6).
 *
 * Why the texts of the pure packages stand here and not in the packages: `@onestrand/features`,
 * `@onestrand/access` and `@onestrand/business` have no part for the screen, and a text in them
 * would be a text in the pure part. A package with a screen part (`./web`) keeps its own
 * `messages.ts` there; an industry keeps its own in `industries/<id>/web`, under the keys of
 * `registerTexts` for its own ids.
 *
 * The keys follow the ids of the registers (`registerTexts` in `keys.ts`). The sections for options,
 * kinds and questions are not in this file, because no package of the platform enters any: an
 * industry brings its own. Words of fixed lists stand under the list's own code. The texts follow CLAUDE.md: «du», «ss», no exclamation marks,
 * no slogans, calm and exact, the trade's word before an invented one, inclusive spelling. No
 * word of an industry and no product name stands here.
 */
export const messages = {
  modules: {
    business: {
      name: 'Betrieb',
      summary: 'Angaben zum Betrieb, seine Personen und seine Funktionen.',
    },
  },
  features: {
    business: {
      name: 'Betrieb',
      summary: 'Name, Briefkopf, Bankverbindung, Personen und Funktionen des Betriebs.',
    },
  },
  deviceModes: {
    normal: 'Normal',
  },
  rights: {
    people_roles: {
      name: 'Personen und Rollen',
      summary: 'Personen anlegen, ihre Rolle ändern und sie aus dem Dienst nehmen.',
    },
    settings: {
      name: 'Einstellungen',
      summary: 'Den Betrieb und seine Funktionen ändern.',
    },
  },
  extents: {
    lean: 'Schlank',
    usual: 'Üblich',
    all: 'Alles',
    custom: 'Eigene Auswahl',
  },
  levels: {
    none: 'Kein Zugriff',
    view: 'Sehen',
    operate: 'Bedienen',
    manage: 'Verwalten',
  },
  profiles: {
    owner: 'Inhaber:in',
  },
  vatMethods: {
    effective: 'Effektive Methode',
    flat_rate: 'Saldosteuersatz',
  },
  cantons: {
    AG: 'Aargau',
    AI: 'Appenzell Innerrhoden',
    AR: 'Appenzell Ausserrhoden',
    BE: 'Bern',
    BL: 'Basel-Landschaft',
    BS: 'Basel-Stadt',
    FR: 'Freiburg',
    GE: 'Genf',
    GL: 'Glarus',
    GR: 'Graubünden',
    JU: 'Jura',
    LU: 'Luzern',
    NE: 'Neuenburg',
    NW: 'Nidwalden',
    OW: 'Obwalden',
    SG: 'St. Gallen',
    SH: 'Schaffhausen',
    SO: 'Solothurn',
    SZ: 'Schwyz',
    TG: 'Thurgau',
    TI: 'Tessin',
    UR: 'Uri',
    VD: 'Waadt',
    VS: 'Wallis',
    ZG: 'Zug',
    ZH: 'Zürich',
  },
  errors: {
    not_found: 'Dazu gibt es keinen Eintrag mehr.',
    invalid: 'Die Angabe passt hier nicht.',
    duplicate_name: 'Diesen Namen gibt es schon.',
    in_use: 'Das wird noch gebraucht und lässt sich nicht entfernen.',
    not_allowed: 'Das ist in diesem Zustand nicht möglich.',
    forbidden: 'Dafür fehlt dir das Recht.',
    'business.last_owner': 'Der Betrieb braucht mindestens eine aktive Inhaber:in.',
    'business.profile_refused':
      'Diese Rolle gibt oder nimmt mehr, als du selbst darfst, oder nennt etwas, das es nicht gibt.',
  },
} satisfies MessageTree;

/** The type of the source: what a translation is a part of. */
export type Messages = typeof messages;

/**
 * The words of the platform for things an industry may call by another name (the lexicon, see
 * `lexicon.ts`). The texts of the platform name a thing of the platform with these.
 */
export const platformTerms = {
  object: { 'de-CH': { one: 'Objekt', many: 'Objekte' } },
} satisfies TermEntries;

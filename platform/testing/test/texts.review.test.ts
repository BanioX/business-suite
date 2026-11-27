import { describe, expect, it } from 'vitest';
import {
  catalogueTexts,
  DE_CH_OPENING_SIE_RULE,
  DE_CH_TEXT_RULES,
  productNameRule,
  textProblems,
  type TextRule,
} from '../src';

/** The letter the rule `eszett` is about, by its number, so this file passes its own rule. */
const ESZETT = String.fromCharCode(0xdf);
const CAPITAL_ESZETT = String.fromCharCode(0x1e9e);
const GRINNING_FACE = String.fromCodePoint(0x1f600);
const VARIATION_16 = String.fromCharCode(0xfe0f);

/** The rules one text breaks, by id. */
const broken = (text: unknown, options?: Parameters<typeof textProblems>[1]) =>
  textProblems({ text }, options).map((problem) => problem.rule);

/** A catalogue as a package writes it: nested, with texts and message functions. */
const CLEAN = {
  common: {
    save: 'Sichern',
    cancel: 'Abbrechen',
    saved: 'Gesichert.',
  },
  customers: {
    title: 'Kundschaft',
    empty: 'Noch keine Kundschaft erfasst. Leg den ersten Eintrag an.',
    count: (n: number) => (n === 1 ? 'Ein Eintrag' : `${n} Einträge`),
    address: (street: string, place: string) => `${street}, ${place}`,
    hint: 'Trag hier die Strasse ein, wie sie auf der Rechnung steht.',
    owner: 'Die Inhaberin sieht ihre Aufgaben zuerst.',
  },
  time: {
    booked: (minutes: number, person: string) => `${minutes} Minuten für ${person} gebucht`,
    open: (done: boolean) => (!done ? 'offen' : 'erledigt'),
    steps: ['Start', 'Pause', 'Ende'],
  },
};

describe('catalogueTexts', () => {
  it('finds every text of a nested catalogue with the path of its keys', () => {
    expect(catalogueTexts({ a: 'eins', b: { c: 'zwei', d: { e: 'drei' } } })).toEqual([
      { path: 'a', text: 'eins', from: 'string' },
      { path: 'b.c', text: 'zwei', from: 'string' },
      { path: 'b.d.e', text: 'drei', from: 'string' },
    ]);
  });

  it('reads lists, maps and sets as well', () => {
    expect(
      catalogueTexts({
        steps: ['Start', 'Ende'],
        byKey: new Map<unknown, unknown>([
          ['save', 'Sichern'],
          [7, 'Sieben'],
          ['more', { deep: 'Tief' }],
        ]),
        words: new Set(['eins', 'zwei']),
      }),
    ).toEqual([
      { path: 'steps.0', text: 'Start', from: 'string' },
      { path: 'steps.1', text: 'Ende', from: 'string' },
      { path: 'byKey.save', text: 'Sichern', from: 'string' },
      { path: 'byKey.1', text: 'Sieben', from: 'string' },
      { path: 'byKey.more.deep', text: 'Tief', from: 'string' },
      { path: 'words.0', text: 'eins', from: 'string' },
      { path: 'words.1', text: 'zwei', from: 'string' },
    ]);
    expect(catalogueTexts(new Map([['a', 'eins']]))).toEqual([
      { path: 'a', text: 'eins', from: 'string' },
    ]);
    expect(catalogueTexts('nur ein Text')).toEqual([
      { path: '', text: 'nur ein Text', from: 'string' },
    ]);
  });

  it('reads the literals of a message function, with a placeholder for each inserted value', () => {
    const texts = catalogueTexts({
      count: (n: number) => `${n} Zeilen fehlen`,
      range: (from: string, to: string) => `Von ${from} bis ${to}`,
      either: (n: number) => (n === 1 ? 'eine Zeile' : `${n} Zeilen`),
      joined: (name: string) => 'Hallo ' + name + ', willkommen',
    });
    expect(texts).toEqual([
      { path: 'count', text: '{} Zeilen fehlen', from: 'function' },
      { path: 'range', text: 'Von {} bis {}', from: 'function' },
      { path: 'either', text: 'eine Zeile', from: 'function' },
      { path: 'either', text: '{} Zeilen', from: 'function' },
      { path: 'joined', text: 'Hallo ', from: 'function' },
      { path: 'joined', text: ', willkommen', from: 'function' },
    ]);
  });

  it('leaves out a literal that says nothing, but keeps one that is only a sign', () => {
    const texts = catalogueTexts({
      pair: (a: string, b: string) => `${a} ${b}`,
      fallback: (a?: string) => a ?? '',
      list: (parts: string[]) => parts.join(', '),
      loud: (name: string) => name + '!',
    });
    expect(texts).toEqual([
      { path: 'list', text: ', ', from: 'function' },
      { path: 'loud', text: '!', from: 'function' },
    ]);
  });

  it('reads the code of a function as code: no comment, no operator, no name is a text', () => {
    const texts = catalogueTexts({
      open: (done: boolean) => {
        // A comment about «ihr» and an exclamation mark! It is no text.
        const ihr = !done;
        return ihr ? 'offen' : 'erledigt';
      },
    });
    expect(texts.map((each) => each.text)).toEqual(['offen', 'erledigt']);
  });

  it('takes numbers, booleans and missing values for no text', () => {
    expect(
      catalogueTexts({ a: 1, b: true, c: null, d: undefined, e: 12n, f: Symbol('x') }),
    ).toEqual([]);
    expect(catalogueTexts(undefined)).toEqual([]);
    expect(catalogueTexts(null)).toEqual([]);
    expect(catalogueTexts(42)).toEqual([]);
  });

  it('reads a catalogue that holds itself once', () => {
    const catalogue: Record<string, unknown> = { a: 'eins' };
    catalogue.self = catalogue;
    catalogue.list = [catalogue, 'zwei'];
    expect(catalogueTexts(catalogue)).toEqual([
      { path: 'a', text: 'eins', from: 'string' },
      { path: 'list.1', text: 'zwei', from: 'string' },
    ]);
  });

  it('cannot see a text that is put together outside the catalogue', () => {
    // Known limit: the function holds no literal, so nothing of it is read.
    expect(catalogueTexts({ late: () => GRINNING_FACE })).toEqual([]);
  });

  it('keeps an empty text: it is a finding, not nothing', () => {
    expect(catalogueTexts({ a: '', b: '  ' })).toEqual([
      { path: 'a', text: '', from: 'string' },
      { path: 'b', text: '  ', from: 'string' },
    ]);
  });
});

describe('textProblems', () => {
  it('finds nothing in a catalogue that follows the rules', () => {
    expect(catalogueTexts(CLEAN).length).toBeGreaterThan(12);
    expect(textProblems(CLEAN)).toEqual([]);
    expect(textProblems(CLEAN, { productNames: ['Musterprodukt', 'Beispiel App'] })).toEqual([]);
  });

  it('reports a problem with the rule, the path, the whole text and what was found', () => {
    const problems = textProblems({
      common: { save: 'Sichern' },
      customers: { street: `Die Stra${ESZETT}e fehlt` },
    });
    expect(problems).toEqual([
      {
        rule: 'eszett',
        message: 'Swiss German writes «ss», never «ß».',
        path: 'customers.street',
        text: `Die Stra${ESZETT}e fehlt`,
        found: ESZETT,
      },
    ]);
  });

  it('reports each rule a text breaks, once, in the order of the catalogue', () => {
    const problems = textProblems({
      first: `Gr${ESZETT}e, wie ihr wollt! Wirklich!`,
      second: 'Alles gut',
      third: 'Danke!',
    });
    expect(problems.map(({ rule, path, found }) => [path, rule, found])).toEqual([
      ['first', 'eszett', ESZETT],
      ['first', 'exclamation', '!'],
      ['first', 'plural_address', 'ihr'],
      ['third', 'exclamation', '!'],
    ]);
  });

  it('says when a catalogue holds no text at all: the wrong object would pass otherwise', () => {
    for (const nothing of [{}, undefined, null, [], { a: 1, b: { c: false } }, new Map()]) {
      const problems = textProblems(nothing);
      expect(problems).toHaveLength(1);
      expect(problems[0]).toMatchObject({ rule: 'no_texts', path: '', text: '', found: '' });
    }
    // Also with rules of another language, and with none.
    expect(textProblems({}, { rules: [] }).map((problem) => problem.rule)).toEqual(['no_texts']);
    expect(textProblems({ a: 'Text' }, { rules: [] })).toEqual([]);
  });

  describe('the rules for German (Switzerland)', () => {
    it('are these, each with an id of its own', () => {
      expect(DE_CH_TEXT_RULES.map((rule) => rule.id)).toEqual([
        'empty',
        'eszett',
        'exclamation',
        'plural_address',
        'formal_address',
        'buzzword',
        'pictograph',
      ]);
      expect(DE_CH_OPENING_SIE_RULE.id).toBe('formal_address_opening');
      for (const rule of [...DE_CH_TEXT_RULES, DE_CH_OPENING_SIE_RULE]) {
        expect(rule.message, rule.id).toMatch(/\S/);
        // No pattern remembers where it was: the same rule serves every text.
        expect(rule.pattern.flags, rule.id).not.toMatch(/[gy]/);
      }
    });

    it('empty: a text says something', () => {
      expect(broken('')).toEqual(['empty']);
      expect(broken('   ')).toEqual(['empty']);
      expect(broken('\n\t')).toEqual(['empty']);
      expect(broken('.')).toEqual([]);
      expect(broken('Sichern')).toEqual([]);
    });

    it('eszett: «ss», never the sharp s, small or capital', () => {
      expect(broken(`Stra${ESZETT}e`)).toEqual(['eszett']);
      expect(broken(`STRA${CAPITAL_ESZETT}E`)).toEqual(['eszett']);
      expect(broken(`Schlie${ESZETT}en`)).toEqual(['eszett']);
      expect(broken('Strasse')).toEqual([]);
      expect(broken('Schliessen')).toEqual([]);
      // In a message function, also where the letter is written as an escape.
      expect(broken((street: string) => `${street}straße`)).toEqual(['eszett']);
      expect(broken((street: string) => 'stra\xdfe ' + street)).toEqual(['eszett']);
      expect(broken((street: string) => `${street}strasse`)).toEqual([]);
    });

    it('exclamation: no exclamation mark, wherever it stands', () => {
      expect(broken('Gesichert!')).toEqual(['exclamation']);
      expect(broken('Achtung! Die Frist läuft ab.')).toEqual(['exclamation']);
      expect(broken('!')).toEqual(['exclamation']);
      expect(broken((n: number) => `${n} Zeilen gesichert!`)).toEqual(['exclamation']);
      expect(broken((name: string) => 'Willkommen, ' + name + '!')).toEqual(['exclamation']);
      expect(broken('Gesichert.')).toEqual([]);
      // A `!` of the code is no text.
      expect(broken((done: boolean) => (!done ? 'offen' : 'erledigt'))).toEqual([]);
      expect(broken((a: number, b: number) => (a !== b ? 'anders' : 'gleich'))).toEqual([]);
    });

    it('plural_address: one person with «du», never several', () => {
      for (const text of [
        'Habt ihr alles erfasst?',
        'Ihr seid fertig.',
        'Das hilft euch weiter',
        'Euer Betrieb',
        'Wählt eure Mitarbeitenden',
        'In eurem Betrieb',
        'Mit euren Daten',
        'Wegen eurer Frist',
        'Der Name eures Betriebs',
        'IHR SEID FERTIG',
        // The formal possessive, and «her» or «their»: reworded as well.
        'Ihr Betrieb ist erfasst',
        'Die Person sieht ihr Guthaben',
      ]) {
        expect(broken(text), text).toEqual(['plural_address']);
      }
      for (const text of [
        'Du bist fertig.',
        'Die Inhaberin sieht ihre Aufgaben',
        'Mitarbeitende sehen ihren Plan',
        // Whole words only.
        'Die Gebühr ist bezahlt',
        'Eine Neuerung',
        'Die Steuer ist erfasst',
        'Feuerlöscher geprüft',
        'Teuer, aber gut',
        'Die Uhr läuft',
        'euch_intern',
      ]) {
        expect(broken(text), text).toEqual([]);
      }
    });

    it('formal_address: never «Sie», «Ihnen» or «Ihre»', () => {
      for (const text of [
        'Bitte wählen Sie eine Person',
        'Möchten Sie sichern?',
        'Hier können Sie drucken.',
        'Zuerst sichern, dann können Sie teilen',
        'Guten Tag, Sie haben drei offene Aufträge',
        'Fertig; Sie können schliessen',
        'Wir zeigen Ihnen den Stand',
        'Ihre Rechnung ist bereit',
        'Mit Ihrem Betrieb',
        'Für Ihren Plan',
        'Der Stand Ihrer Aufträge',
        'Der Name Ihres Betriebs',
        (n: number) => `Bitte prüfen Sie ${n} Zeilen`,
      ]) {
        expect(broken(text), String(text)).toEqual(['formal_address']);
      }
      for (const text of [
        'Bitte wähl eine Person',
        'Die Rechnung ist da, sie ist offen',
        'Die Inhaberin sieht ihre Aufgaben',
        // At the start of a sentence «Sie» is also she, it and they: not a rule for everyone.
        'Sie ist bezahlt.',
        'Die Rechnung ist offen. Sie wird morgen fällig.',
        // Whole words only.
        'Siegel geprüft',
        'Die Sieben',
        'Ihnenweg',
      ]) {
        expect(broken(text), text).toEqual([]);
      }
    });

    it('formal_address_opening: a rule to add where no sentence should open with «Sie»', () => {
      const rules = [...DE_CH_TEXT_RULES, DE_CH_OPENING_SIE_RULE];
      for (const text of [
        'Sie können die Datei teilen.',
        'Die Datei ist bereit. Sie können sie teilen.',
        'Hinweis: Sie können drucken',
        'Fertig? Sie können schliessen',
        '«Sie können sichern»',
      ]) {
        expect(broken(text, { rules }), text).toEqual(['formal_address_opening']);
        expect(broken(text), text).toEqual([]);
      }
      for (const text of ['Du kannst die Datei teilen.', 'Siegel geprüft', 'Die Sieben']) {
        expect(broken(text, { rules }), text).toEqual([]);
      }
    });

    it('buzzword: calm names, no words of advertising', () => {
      for (const text of [
        'Smart planen',
        'Deine Insights',
        'Ein Insight',
        'Der Hub für alles',
        'Wie Magic',
        'Deine Journey',
        'Ein Gamechanger',
        'SMART',
      ]) {
        expect(broken(text), text).toEqual(['buzzword']);
      }
      for (const text of ['Smartphone', 'Hubraum', 'Planung', 'Auswertung']) {
        expect(broken(text), text).toEqual([]);
      }
    });

    it('pictograph: no emoji', () => {
      expect(broken(`Gesichert ${GRINNING_FACE}`)).toEqual(['pictograph']);
      expect(broken(`Erledigt ${String.fromCharCode(0x2714)}${VARIATION_16}`)).toEqual([
        'pictograph',
      ]);
      expect(broken((name: string) => name + ' \u{1F600}')).toEqual(['pictograph']);
      // Signs of text are no emoji: a check mark, an arrow, the guillemets, a dash, digits.
      expect(broken(`Erledigt ${String.fromCharCode(0x2713)}`)).toEqual([]);
      expect(broken('Weiter → «Sichern» – 100 % in CHF 12.50, 2 × täglich')).toEqual([]);
    });
  });

  describe('names of products', () => {
    const productNames = ['Musterprodukt', 'Beispiel App', 'A+B (alt)'];

    it('finds a name the caller passes, in any case, as a whole word', () => {
      for (const [text, found] of [
        ['Öffne Musterprodukt', 'Musterprodukt'],
        ['Wie in musterprodukt', 'musterprodukt'],
        ['MUSTERPRODUKT kann das auch', 'MUSTERPRODUKT'],
        ['Die Beispiel App', 'Beispiel App'],
        ['Die Beispiel   App', 'Beispiel   App'],
        ['Früher A+B (alt)', 'A+B (alt)'],
      ] as const) {
        const problems = textProblems({ text }, { productNames });
        expect(problems, text).toHaveLength(1);
        expect(problems[0]).toMatchObject({ rule: 'product_name', path: 'text', found });
      }
      expect(
        broken((n: number) => `${n} Einträge aus Musterprodukt übernommen`, { productNames }),
      ).toEqual(['product_name']);
    });

    it('finds no name inside a longer word, and reads a sign of a name as a sign', () => {
      for (const text of [
        'Musterprodukte',
        'Das Beispiel',
        'Die App',
        'BeispielApp',
        // «A+B» is the three signs, not «AAB» and not «AB».
        'AAB (alt)',
        'AB alt',
      ]) {
        expect(broken(text, { productNames }), text).toEqual([]);
      }
    });

    it('finds the longer of two names that start alike', () => {
      const problems = textProblems(
        { text: 'Neu in Muster Plus' },
        { productNames: ['Muster', 'Muster Plus'] },
      );
      expect(problems.map((problem) => problem.found)).toEqual(['Muster Plus']);
    });

    it('holds no name itself: without a list nothing is a product name', () => {
      expect(broken('Musterprodukt')).toEqual([]);
      expect(broken('Musterprodukt', { productNames: [] })).toEqual([]);
      // Names that are empty are no names: they must not match everything.
      expect(broken('Musterprodukt', { productNames: ['', '   '] })).toEqual([]);
      expect(productNameRule([]).pattern.test('anything')).toBe(false);
      expect(productNameRule(['', ' ']).pattern.test('')).toBe(false);
      expect(productNameRule(['Musterprodukt']).id).toBe('product_name');
    });

    it('comes on top of the rules of the language, also of another one', () => {
      const rules: TextRule[] = [{ id: 'no_digit', pattern: /\d/, message: 'No digits.' }];
      expect(broken('Musterprodukt 2', { rules, productNames })).toEqual([
        'no_digit',
        'product_name',
      ]);
    });
  });

  describe('rules as data', () => {
    const rules: TextRule[] = [
      { id: 'no_digit', pattern: /\d+/g, message: 'Write numbers as words.' },
      { id: 'no_shout', pattern: /\p{Lu}{4,}/u, message: 'Do not shout.' },
    ];

    it('checks a catalogue against the rules of another language instead of the default', () => {
      const catalogue = { a: 'Total 12 lines', b: 'DONE', c: `Stra${ESZETT}e!` };
      expect(textProblems(catalogue, { rules })).toEqual([
        {
          rule: 'no_digit',
          message: 'Write numbers as words.',
          path: 'a',
          text: 'Total 12 lines',
          found: '12',
        },
        { rule: 'no_shout', message: 'Do not shout.', path: 'b', text: 'DONE', found: 'DONE' },
      ]);
    });

    it('finds the same with a pattern that remembers where it was', () => {
      // A global pattern keeps its place between two searches; every text must start afresh.
      const catalogue = { a: 'x 1', b: '2', c: '3 x', d: 'x 44' };
      const first = textProblems(catalogue, { rules }).map((problem) => problem.path);
      const second = textProblems(catalogue, { rules }).map((problem) => problem.path);
      expect(first).toEqual(['a', 'b', 'c', 'd']);
      expect(second).toEqual(first);
      expect(rules[0]?.pattern.lastIndex).toBe(0);
    });

    it('adds a rule to the default ones', () => {
      const withMore = [...DE_CH_TEXT_RULES, ...rules];
      expect(broken('LAUT gesagt!', { rules: withMore })).toEqual(['exclamation', 'no_shout']);
    });
  });
});

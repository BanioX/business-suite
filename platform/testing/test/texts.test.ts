import { describe, expect, it } from 'vitest';
import {
  catalogueTexts,
  DE_CH_OPENING_SIE_RULE,
  DE_CH_TEXT_RULES,
  productNameRule,
  textProblems,
  type TextRule,
} from '../src';

/** The ids of the rules a single text breaks. */
const broken = (text: string, options?: Parameters<typeof textProblems>[1]) =>
  textProblems({ text }, options).map((problem) => problem.rule);

describe('catalogueTexts', () => {
  it('walks a nested catalogue and names every text by its path', () => {
    const catalogue = {
      common: { save: 'Sichern', cancel: 'Abbrechen' },
      notes: { title: 'Notizen', hints: ['Erste Zeile', 'Zweite Zeile'] },
    };
    expect(catalogueTexts(catalogue)).toEqual([
      { path: 'common.save', text: 'Sichern', from: 'string' },
      { path: 'common.cancel', text: 'Abbrechen', from: 'string' },
      { path: 'notes.title', text: 'Notizen', from: 'string' },
      { path: 'notes.hints.0', text: 'Erste Zeile', from: 'string' },
      { path: 'notes.hints.1', text: 'Zweite Zeile', from: 'string' },
    ]);
  });

  it('reads the literals of a message function, with {} for each inserted value', () => {
    const catalogue = {
      rows: (count: number) => `${String(count)} Zeilen`,
      greeting: (name: string) => 'Guten Tag, ' + name,
      amount: (count: number) => (count === 1 ? 'Ein Eintrag' : `${String(count)} Einträge`),
    };
    expect(catalogueTexts(catalogue)).toEqual([
      { path: 'rows', text: '{} Zeilen', from: 'function' },
      { path: 'greeting', text: 'Guten Tag, ', from: 'function' },
      { path: 'amount', text: 'Ein Eintrag', from: 'function' },
      { path: 'amount', text: '{} Einträge', from: 'function' },
    ]);
  });

  it('keeps the literals of a function that hold only a sign, so a lone «!» is found', () => {
    const catalogue = {
      list: (parts: string[]) => parts.join(', '),
      pair: (a: string, b: string) => `${a} · ${b}`,
      shout: (name: string) => name + '!',
    };
    expect(catalogueTexts(catalogue).map((entry) => entry.text)).toEqual([', ', '{} · {}', '!']);
    expect(textProblems(catalogue).map((problem) => problem.rule)).toEqual(['exclamation']);
  });

  it('never reads the code of a function: a negation and a variable break no rule', () => {
    const catalogue = {
      state: (ihr: boolean) => (!ihr ? 'Offen' : 'Erledigt'),
    };
    expect(catalogueTexts(catalogue).map((entry) => entry.text)).toEqual(['Offen', 'Erledigt']);
    expect(textProblems(catalogue)).toEqual([]);
  });

  it('takes numbers, booleans and missing values as no texts', () => {
    expect(catalogueTexts({ a: 1, b: true, c: null, d: undefined, e: 'Text' })).toEqual([
      { path: 'e', text: 'Text', from: 'string' },
    ]);
    expect(catalogueTexts('Nur ein Text')).toEqual([
      { path: '', text: 'Nur ein Text', from: 'string' },
    ]);
    expect(catalogueTexts(undefined)).toEqual([]);
  });

  it('reads a catalogue that holds itself once', () => {
    const catalogue: Record<string, unknown> = { title: 'Notizen' };
    catalogue.self = catalogue;
    expect(catalogueTexts(catalogue)).toEqual([{ path: 'title', text: 'Notizen', from: 'string' }]);
  });
});

describe('the rules for texts in German (Switzerland)', () => {
  it('have ids that never change', () => {
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
  });

  it('pass calm texts that talk to one person', () => {
    const catalogue = {
      save: 'Sichern',
      hint: 'Du kannst die Sicherung jederzeit zurückholen.',
      question: 'Möchtest du den Eintrag löschen?',
      size: 'Grösse in m²',
      theirs: 'Die Person sieht nur, was sie selbst erfasst hat.',
      route: 'Strasse, Hausnummer',
      mark: 'Erledigt ✓',
    };
    expect(textProblems(catalogue)).toEqual([]);
  });

  it.each([
    ['empty', ''],
    ['empty', '   '],
    ['eszett', 'Strasse und Straße'],
    ['eszett', 'GROẞ'],
    ['exclamation', 'Gesichert!'],
    ['plural_address', 'Habt ihr schon gesichert?'],
    ['plural_address', 'Das ist für euch.'],
    ['plural_address', 'Euer Betrieb'],
    ['plural_address', 'In eurem Betrieb'],
    ['plural_address', 'Ihr Betrieb'],
    ['formal_address', 'Wir danken Ihnen.'],
    ['formal_address', 'Bitte prüfen Sie die Angaben.'],
    ['formal_address', 'Das sind Ihre Daten.'],
    ['buzzword', 'Smart planen'],
    ['buzzword', 'Deine Insights'],
    ['pictograph', 'Erledigt 🎉'],
    // A sign that only the variation selector after it turns into an emoji.
    ['pictograph', `Achtung ${String.fromCharCode(0x26a0, 0xfe0f)}`],
  ])('find %s in «%s»', (rule, text) => {
    expect(broken(text)).toContain(rule);
  });

  it.each([
    [
      'plural_address',
      'Ihre Arbeit ist erfasst: ihre Stunden stehen im Rapport.',
      'formal_address',
    ],
    ['buzzword', 'Schubladen und Hubwagen', undefined],
    ['plural_address', 'Gehirn und Geschirr', undefined],
    ['formal_address', 'Sie hat den Rapport unterschrieben.', undefined],
  ])('do not find %s in «%s»', (rule, text, instead) => {
    expect(broken(text)).not.toContain(rule);
    if (instead !== undefined) {
      expect(broken(text)).toContain(instead);
    }
  });

  it('report one problem per text and rule, with the first place and the whole text', () => {
    const problems = textProblems({ notes: { done: 'Fertig! Wirklich fertig!' } });
    expect(problems).toEqual([
      {
        rule: 'exclamation',
        message: 'No exclamation marks: the app speaks calmly.',
        path: 'notes.done',
        text: 'Fertig! Wirklich fertig!',
        found: '!',
      },
    ]);
  });

  it('report every rule a text breaks, in the order of the rules', () => {
    expect(broken('Ihr habt Spaß!')).toEqual(['eszett', 'exclamation', 'plural_address']);
  });

  it('check the literals of a message function like any text', () => {
    const catalogue = { saved: (count: number) => `${String(count)} Einträge gesichert!` };
    expect(textProblems(catalogue)).toEqual([
      expect.objectContaining({
        rule: 'exclamation',
        path: 'saved',
        text: '{} Einträge gesichert!',
      }),
    ]);
  });
});

describe('«Sie» at the start of a sentence', () => {
  const rules = [...DE_CH_TEXT_RULES, DE_CH_OPENING_SIE_RULE];

  it('is no rule for every catalogue', () => {
    expect(broken('Sie können die Datei teilen.')).toEqual([]);
  });

  it.each([
    'Sie können die Datei teilen.',
    'Gesichert. Sie können die Datei jetzt teilen.',
    'Hinweis: Sie finden die Datei unter «Dateien».',
    '«Sie können die Datei teilen»',
  ])('is found in «%s» where the catalogue asks for it', (text) => {
    expect(broken(text, { rules })).toEqual(['formal_address_opening']);
  });

  it('is not found inside a word or in lower case', () => {
    expect(broken('Siegel und Siebe', { rules })).toEqual([]);
    expect(broken('Die Person sieht, was sie erfasst hat.', { rules })).toEqual([]);
  });
});

describe('productNameRule', () => {
  it('finds a name as a whole word, in any case, also over several words', () => {
    const rule = productNameRule(['Beispiel App', 'Muster']);
    expect(rule.id).toBe('product_name');
    expect(rule.pattern.exec('Willkommen bei beispiel   app')?.[0]).toBe('beispiel   app');
    expect(rule.pattern.exec('Das MUSTER läuft')?.[0]).toBe('MUSTER');
    expect(rule.pattern.test('Mustermann und Schnittmuster')).toBe(false);
  });

  it('finds the longest name where one starts with another', () => {
    const rule = productNameRule(['Muster', 'Muster Plus']);
    expect(rule.pattern.exec('Neu in Muster Plus')?.[0]).toBe('Muster Plus');
  });

  it('reads a name with signs of a pattern as it is written', () => {
    const rule = productNameRule(['C++ (neu)']);
    expect(rule.pattern.test('Jetzt mit C++ (neu)')).toBe(true);
    expect(rule.pattern.test('Jetzt mit C (neu)')).toBe(false);
  });

  it('finds nothing without a name', () => {
    for (const names of [[], ['', '   ']]) {
      const rule = productNameRule(names);
      expect(rule.pattern.test('Irgendein Text')).toBe(false);
      expect(rule.pattern.test('')).toBe(false);
    }
  });
});

describe('textProblems', () => {
  it('adds the names of products to the rules it is given', () => {
    const catalogue = { welcome: 'Willkommen bei Muster' };
    expect(textProblems(catalogue)).toEqual([]);
    expect(textProblems(catalogue, { productNames: ['Muster'] })).toEqual([
      {
        rule: 'product_name',
        message: 'The name of a product has no place in this text.',
        path: 'welcome',
        text: 'Willkommen bei Muster',
        found: 'Muster',
      },
    ]);
  });

  it('takes the rules of another language', () => {
    const rules: TextRule[] = [
      { id: 'shouting', pattern: /\b[A-Z]{4,}\b/, message: 'Do not shout.' },
    ];
    expect(broken('Gesichert!', { rules })).toEqual([]);
    expect(broken('Bitte SOFORT sichern', { rules })).toEqual(['shouting']);
    expect(broken('Bitte sichern', { rules: [] })).toEqual([]);
  });

  it('finds a rule every time, also where its pattern remembers where it was', () => {
    const rules: TextRule[] = [{ id: 'mark', pattern: /!/g, message: 'No mark.' }];
    const catalogue = { a: 'Eins!', b: 'Zwei!', c: 'Drei!' };
    expect(textProblems(catalogue, { rules }).map((problem) => problem.path)).toEqual([
      'a',
      'b',
      'c',
    ]);
    // The pattern of the caller is not moved either.
    expect(rules[0]?.pattern.lastIndex).toBe(0);
  });
});

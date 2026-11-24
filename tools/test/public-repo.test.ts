// Origin: BanioX/Rettich apps/web/src/private-ideas.test.ts @ 0ac1fd2 — adapted: only the test with made-up names, on the function taken out of the test; the other tests are new
import { describe, expect, it } from 'vitest';
import {
  forbiddenNameProblems,
  hashName,
  nameHashes,
  namesIn,
  priceProblems,
  publicRepoProblems,
} from '../src/public-repo.ts';
import type { RepoFile } from '../src/repo-files.ts';
import { FORBIDDEN_FIRST_WORDS, FORBIDDEN_NAMES } from '../src/words/forbidden-names.ts';
import { PRICE_RULES, PRICE_WINDOW } from '../src/words/prices.ts';

// Made-up names, so the check is tested without naming anyone.
const names = new Set([hashName('beispielapp'), hashName('zweiworte')]);
const firstWords = new Set([hashName('zwei')]);

const file = (path: string, text: string): RepoFile => ({ path, text });

describe('names that never stand in the repository', () => {
  it('finds a name written in one word or in several, in any case', () => {
    expect(namesIn('Wie bei BeispielApp, nur ruhiger.', names, firstWords)).toHaveLength(1);
    expect(namesIn('Gelernt von Zwei Worte.', names, firstWords)).toHaveLength(1);
    expect(namesIn('Zwei Äpfel, drei Worte.', names, firstWords)).toEqual([]);
  });

  it('says where the name stands and which hash matched, never the word', () => {
    const hits = namesIn('Erste Zeile.\nWie bei BeispielApp.\n', names, firstWords);
    expect(hits).toEqual([{ line: 2, column: 9, hash: hashName('beispielapp') }]);
    expect(JSON.stringify(hits)).not.toContain('beispielapp');
  });

  it('finds a name in several words across a line break and across signs', () => {
    expect(namesIn('gelernt von Zwei\nWorte', names, firstWords)).toEqual([
      { line: 1, column: 13, hash: hashName('zweiworte') },
    ]);
    expect(namesIn('zwei-worte und ZWEI_WORTE', names, firstWords)).toHaveLength(2);
  });

  it('finds a name inside an identifier only where signs or digits set it apart', () => {
    expect(namesIn('import x from "beispielapp-sdk";', names, firstWords)).toHaveLength(1);
    expect(namesIn('beispielapp2', names, firstWords)).toHaveLength(1);
    expect(namesIn('Der Beispielapparat läuft.', names, firstWords)).toEqual([]);
  });

  it('reads composed and decomposed letters the same way', () => {
    const umlaut = new Set([hashName('müsterli')]);
    expect(namesIn('Mu\u0308sterli', umlaut, new Set())).toHaveLength(1);
  });

  it('reports the names in the text and in the path of a file', () => {
    const problems = forbiddenNameProblems(
      [
        file('docs/vergleich-beispielapp.md', 'Kein Wort davon.\n'),
        file('docs/plan.md', 'Ruhig.\nBesser als Zwei Worte.\n'),
        file('docs/ok.md', 'Betrieb Muster, Person Eins.\n'),
      ],
      names,
      firstWords,
    );
    expect(problems.map(({ path, line }) => ({ path, line }))).toEqual([
      { path: 'docs/vergleich-beispielapp.md', line: 0 },
      { path: 'docs/plan.md', line: 2 },
    ]);
    expect(problems[1]?.message).toContain(hashName('zweiworte'));
    expect(problems.map((problem) => problem.message).join(' ')).not.toMatch(/zwei|beispiel/i);
  });

  it('keeps the real list as hashes only', () => {
    for (const hash of [...FORBIDDEN_NAMES, ...FORBIDDEN_FIRST_WORDS]) {
      expect(hash).toMatch(/^[0-9a-f]{16}$/);
    }
    expect(FORBIDDEN_NAMES.size).toBeGreaterThanOrEqual(29);
    expect(FORBIDDEN_FIRST_WORDS.size).toBeGreaterThanOrEqual(4);
    expect(namesIn('Betrieb Muster in Beispielstadt, Person Eins und Person Zwei.')).toEqual([]);
  });
});

describe('hashes for a new name', () => {
  it('gives one hash for a name in one word, whatever its case', () => {
    expect(nameHashes('BeispielApp')).toEqual({ name: hashName('beispielapp') });
    expect(nameHashes('  beispielapp ')).toEqual({ name: hashName('beispielapp') });
  });

  it('gives the hash of the joined words and of the first word for a name in several words', () => {
    expect(nameHashes('Zwei Worte')).toEqual({
      name: hashName('zweiworte'),
      firstWord: hashName('zwei'),
    });
  });

  it('splits a name exactly as the check splits a text, so the hashes find it again', () => {
    for (const name of ['Beispielapp', 'Zwei Worte', 'app2go', 'Mu\u0308sterli AG', 'a-b c.d']) {
      const hashes = nameHashes(name);
      const found = namesIn(
        `Wie ${name} es macht.`,
        new Set([hashes.name]),
        new Set(hashes.firstWord === undefined ? [] : [hashes.firstWord]),
      );
      expect(found, name).toHaveLength(1);
    }
  });

  it('refuses a name the check could never find', () => {
    expect(() => nameHashes('2024')).toThrow(/at least one letter/);
    expect(() => nameHashes('eins zwei drei vier fünf')).toThrow(/at most 4 words/);
  });

  it('is the first 16 hex digits of the SHA-256 of the word', () => {
    // SHA-256 of the empty text, a known value.
    expect(hashName('')).toBe('e3b0c44298fc1c14');
  });
});

/**
 * The fixtures carry `§` where the number of an amount belongs, and it is put in here. So this
 * file states no price itself, and the guard over the repository needs no exception for it.
 */
const withAmounts = (text: string) => text.replaceAll('§', '29');
const priced = (path: string, text: string) => priceProblems([file(path, withAmounts(text))]);
const rulesOf = (path: string, text: string) =>
  priced(path, text).map((problem) => /rule «([a-z-]+)»/.exec(problem.message)?.[1]);

describe('prices of the suite', () => {
  it('finds a price next to the name of the suite', () => {
    expect(rulesOf('docs/plan.md', 'Onestrand kostet CHF § pro Monat.\n')).toEqual(['by-name']);
    expect(rulesOf('docs/plan.md', 'Der Tarif von Onestrand: § Franken.\n')).toEqual(['by-name']);
    expect(rulesOf('docs/plan.md', 'Die Onestrand Business Suite: Preis §.– CHF.\n')).toEqual([
      'by-name',
    ]);
  });

  it('finds a paid plan or a price per month next to the name of an edition', () => {
    expect(rulesOf('docs/plan.md', 'Randen: ein Abo für § Franken.\n')).toEqual(['edition']);
    expect(rulesOf('docs/plan.md', 'Randen kostet CHF § pro Monat.\n')).toEqual(['edition']);
    expect(rulesOf('docs/plan.md', 'Preis von Randen: CHF §.\n')).toEqual(['price-of']);
  });

  it('lets an edition speak of the prices of its trade', () => {
    const lines = [
      'In Randen kostet das Tagesangebot § Franken, der Preis steht auf der Karte.',
      'Randen rechnet den Preis je Einheit: § Franken; Tarif und Marge sind berechnet.',
    ];
    expect(priced('docs/branchen/muster.md', `${lines.join('\n')}\n`)).toEqual([]);
  });

  it('finds a paid plan of the suite or an app', () => {
    expect(rulesOf('docs/plan.md', 'Das Abo der Suite: § Fr. je Betrieb.\n')).toEqual(['plan']);
    expect(rulesOf('docs/plan.md', 'Die App gibt es als Lizenz für EUR §.\n')).toEqual(['plan']);
    expect(rulesOf('src/plan.ts', '// app subscription: € § for a business\n')).toEqual(['plan']);
  });

  it('finds «the price of the app» and «the app costs» in so many words', () => {
    expect(rulesOf('docs/plan.md', 'Preis der App: CHF §.\n')).toEqual(['price-of']);
    expect(rulesOf('docs/plan.md', 'Die Software kostet § € im ersten Jahr.\n')).toEqual([
      'price-of',
    ]);
    expect(rulesOf('src/plan.ts', '// The app costs CHF § for a small business.\n')).toEqual([
      'price-of',
    ]);
  });

  it('finds an amount per user without any subject', () => {
    expect(rulesOf('docs/plan.md', '§ CHF pro Nutzer:in und Monat.\n')).toEqual(['per-user']);
    expect(rulesOf('src/plan.ts', 'const note = "EUR § per user";\n')).toEqual(['per-user']);
  });

  it('reports the place, the rule and the amount, once per rule and line', () => {
    expect(
      priced('docs/plan.md', 'Ruhig.\n\nOnestrand: CHF § pro Monat, später CHF § pro Jahr.\n'),
    ).toEqual([
      {
        path: 'docs/plan.md',
        line: 3,
        message: withAmounts(
          'looks like a price of the suite (rule «by-name»: the suite by name, a price word and an amount): «CHF §»',
        ),
      },
    ]);
  });

  it('reads an amount in the usual ways of writing it', () => {
    for (const amount of [
      'CHF §',
      'CHF§',
      'chf §.90',
      '§ CHF',
      'Fr. §.90',
      '§.– Fr.',
      'SFr. §',
      'EUR §',
      '§ EUR',
      '€ §',
      '§€',
      '§ Euro',
      '§ Franken',
      "4'§ Franken",
      '100 0§ Franken',
      '**§ Franken**',
      'CHF **§**',
    ]) {
      expect(rulesOf('docs/plan.md', `${amount} pro Nutzer\n`), amount).toEqual(['per-user']);
    }
  });

  it('takes a currency without a number, or a number without a currency, for no amount', () => {
    for (const text of [
      '§ pro Nutzer',
      'nur CHF oder EUR pro Nutzer',
      'Europe/Zurich § pro Nutzer',
      'fr-CH § pro Nutzer',
      'Franken pro Nutzer',
    ]) {
      expect(priced('docs/plan.md', `${text}\n`), text).toEqual([]);
    }
  });

  it('lets the facts of the trades pass: wages, fees, rates and thresholds', () => {
    const facts = [
      '| Coiffeur | ganze Schweiz | mit EFZ § Franken pro Monat, 1. und 2. Berufsjahr | Quelle |',
      '| Pflicht ab Umsatz | befreit, wer weniger als **§ Franken** Umsatz im Jahr erzielt | MWSTG |',
      '| Vollzugskostenbeitrag | § Fr. pro Jahr vom Lohn (Stand 2024) | Quelle |',
      '| Durchschnittspreis Jahresmitgliedschaft | rund § CHF (Medienbericht) | nicht belegt |',
      'Stundenansatz je Person § Franken, Lieferwagen § Franken je Stunde, Anfahrt § Franken.',
      'Büro «Treuhand Beispiel»: Pauschale § Franken pro Monat (erfunden).',
      'Mittagsentschädigung § Franken im Monat oder § je Mahlzeit.',
      'Tarife (Testwerte): Jahresmitgliedschaft § Franken, Mehrfachkarte § Franken.',
    ];
    expect(priced('docs/fakten/arbeit.md', `${facts.join('\n')}\n`)).toEqual([]);
  });

  it('lets a sentence pass in which the app shows or checks an amount of the trade', () => {
    const lines = [
      'Die App zeigt den Hinweis ab § Franken Umsatz im Jahr (Richtwert).',
      'Die App zeigt den Preis § Franken inklusive MWST.',
      'Die Teamleitung erfasst in der App Kosten von § Franken pro Monat.',
      'In der App kostet die Mehrfachkarte § Franken, im Monat danach mehr.',
      'In der Suite steht die Offerte mit § Franken; die Preisart nennt ihre Quelle.',
    ];
    expect(priced('docs/branchen/muster.md', `${lines.join('\n')}\n`)).toEqual([]);
  });

  it('does not read a long table row as one sentence', () => {
    const row =
      '| Gastgewerbe | Stufe Ia § Franken pro Monat oder § pro Stunde | Regelwerk in Randen |';
    expect(priced('docs/fakten/arbeit.md', `${row}\n`)).toEqual([]);
    expect(rulesOf('docs/plan.md', '| Randen | § Franken pro Monat |\n')).toEqual([]);
    expect(rulesOf('docs/plan.md', '| Randen: § Franken pro Monat | Basis |\n')).toEqual([
      'edition',
    ]);
  });

  it('looks only as far as the window reaches', () => {
    const far = 'wort '.repeat(PRICE_WINDOW / 5 + 2);
    expect(rulesOf('docs/plan.md', `Onestrand ${far}CHF § pro Monat\n`)).toEqual([]);
    expect(rulesOf('docs/plan.md', `Onestrand wort wort CHF § ${far}pro Monat\n`)).toEqual([]);
    expect(rulesOf('docs/plan.md', 'Onestrand wort wort CHF § wort wort pro Monat\n')).toEqual([
      'by-name',
    ]);
  });

  it('needs words and names as whole words', () => {
    expect(rulesOf('docs/plan.md', 'Brandenburg zahlt CHF § pro Monat.\n')).toEqual([]);
    expect(rulesOf('src/plan.ts', '// The app: about CHF § were found.\n')).toEqual([]);
    expect(rulesOf('docs/plan.md', 'Der Apparat im Labor kostet § Franken.\n')).toEqual([]);
  });

  it('finds the rows of a table under a heading that names the price of the suite', () => {
    const text = [
      '# Plan',
      '',
      '## Preise der Suite',
      '',
      '| Stufe | Betrag |',
      '| --- | --- |',
      '| Klein | CHF § |',
      '| Gross | CHF § |',
      '',
      '### Hinweis',
      '',
      'Für Vereine § Franken.',
      '',
      '## Löhne',
      '',
      '| Stufe | § Franken |',
    ].join('\n');
    expect(priced('docs/plan.md', text).map((problem) => problem.line)).toEqual([7, 8, 12]);
    expect(rulesOf('docs/plan.md', text)).toEqual(['price-of', 'price-of', 'price-of']);
  });

  it('takes headings from Markdown only, and not from a code block', () => {
    const rows = ['', '| Klein | CHF § |', ''];
    expect(priced('docs/plan.md', ['## Onestrand: Preise', ...rows].join('\n'))).toHaveLength(1);
    expect(priced('src/plan.ts', ['## Onestrand: Preise', ...rows].join('\n'))).toEqual([]);
    expect(
      priced('docs/plan.md', ['```sh', '## Onestrand: Preise', '```', ...rows].join('\n')),
    ).toEqual([]);
  });

  it('lets a heading of the trade pass: prices and plans without the suite', () => {
    const text = ['### Tarife (Abo-Arten)', '', '| Jahr | § Franken |', '| Monat | CHF § |'];
    expect(priced('docs/branchen/muster.md', text.join('\n'))).toEqual([]);
  });

  it('applies the rules it is given', () => {
    const rules = [{ id: 'made-up', finds: 'a made-up word', all: [['muster'], ['wort']] }];
    const found = (text: string) =>
      priceProblems([file('docs/plan.md', withAmounts(text))], rules, 40);
    expect(found('Muster und Wort: CHF §')).toHaveLength(1);
    expect(found('Muster allein: CHF §')).toEqual([]);
    expect(found('Onestrand kostet CHF § pro Monat')).toEqual([]);
  });

  it('reads a very long line of numbers without stalling', () => {
    const line = '1 2 3 4 5 6 7 8 9 0, '.repeat(20_000);
    expect(priceProblems([file('data/zahlen.json', line)])).toEqual([]);
  });

  it('has rules that are complete: an id, a description and at least one list of words', () => {
    expect(PRICE_RULES.map((rule) => rule.id)).toEqual([
      'by-name',
      'edition',
      'plan',
      'price-of',
      'per-user',
    ]);
    for (const rule of PRICE_RULES) {
      expect(rule.finds).not.toBe('');
      expect(rule.all.length).toBeGreaterThan(0);
      for (const words of rule.all) {
        expect(words.length).toBeGreaterThan(0);
        expect(words.filter((word) => word !== word.toLowerCase().trim())).toEqual([]);
      }
    }
  });
});

describe('the public repository as a whole', () => {
  it('reports names and prices together', () => {
    const problems = publicRepoProblems([
      file('docs/plan.md', withAmounts('Onestrand kostet CHF § pro Monat.\n')),
      file('docs/ok.md', 'Betrieb Muster.\n'),
    ]);
    expect(problems.map((problem) => problem.path)).toEqual(['docs/plan.md']);
  });
});

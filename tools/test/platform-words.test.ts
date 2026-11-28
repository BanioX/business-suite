import { describe, expect, it } from 'vitest';
import {
  platformWordProblems,
  splitWords,
  wordHits,
  type WordList,
} from '../src/platform-words.ts';
import type { RepoFile } from '../src/repo-files.ts';
import { GASTRONOMY } from '../src/words/gastronomy.ts';
import { INDUSTRY_WORD_LISTS, PLATFORM_WORD_LISTS } from '../src/words/platform.ts';
import { PRODUCT_NAMES } from '../src/words/products.ts';

const file = (path: string, text: string): RepoFile => ({ path, text });
const words = (line: string) => wordHits(line).map((hit) => hit.word);

describe('splitWords', () => {
  it('takes identifiers apart at case changes, digits and signs', () => {
    expect(splitWords('guestList')).toEqual(['guest', 'list']);
    expect(splitWords('GuestList')).toEqual(['guest', 'list']);
    expect(splitWords('guest_list')).toEqual(['guest', 'list']);
    expect(splitWords('guest-list')).toEqual(['guest', 'list']);
    expect(splitWords('GUEST_LIST')).toEqual(['guest', 'list']);
    expect(splitWords('guest2list')).toEqual(['guest', 'list']);
    expect(splitWords('HACCPPlan')).toEqual(['haccp', 'plan']);
    expect(splitWords('parseHTTPResponse')).toEqual(['parse', 'http', 'response']);
  });

  it('keeps ordinary words whole, with umlauts, in lower case and in their order', () => {
    expect(splitWords('Die Küche des Betriebs, Müsterli & Söhne.')).toEqual([
      'die',
      'küche',
      'des',
      'betriebs',
      'müsterli',
      'söhne',
    ]);
    expect(splitWords('Ku\u0308che')).toEqual(['küche']);
    expect(splitWords('Köch:innen')).toEqual(['köch', 'innen']);
    expect(splitWords('42 + 7 = 49')).toEqual([]);
  });
});

describe('words of the gastronomy', () => {
  it('finds a word in an identifier', () => {
    expect(words('export function recipeCost(dishId: Id): Money {')).toEqual(['recipe', 'dish']);
    expect(words('const KITCHEN_STATIONS = [];')).toEqual(['kitchen']);
    expect(words("import { menuPlan } from './menu-plan';")).toEqual(['menu']);
    expect(words('type GuestCount = number;')).toEqual(['guest']);
  });

  it('finds a word in a comment', () => {
    expect(words('// Rounds like the kitchen does: half away from zero.')).toEqual(['kitchen']);
    expect(words(' * Used for allergens and other computed facts.')).toEqual(['allergens']);
  });

  it('finds a word in a string', () => {
    expect(words("const unit = 'meal';")).toEqual(['meal']);
    expect(words('throw new Error("unknown ingredient");')).toEqual(['ingredient']);
    expect(words("format: 'haccp-backup',")).toEqual(['haccp']);
  });

  it('finds German words, also in compounds and plurals', () => {
    expect(words('| `Menge` | Menge einer Zutat im Rezept |')).toEqual(['zutat', 'rezept']);
    expect(words('Der Küchenchef plant die Speisekarten.')).toEqual(['küchenchef', 'speisekarten']);
    expect(words('Gäste, Gerichte und Lebensmittelrecht')).toEqual([
      'gäste',
      'gerichte',
      'lebensmittelrecht',
    ]);
    expect(words('Köch:innen im Gastgewerbe')).toEqual(['köch', 'gastgewerbe']);
    expect(words('Betrieb der Gastronomie, kurz Gastro')).toEqual(['gastronomie', 'gastro']);
    expect(words('MHD, Mindesthaltbarkeitsdatum und Verbrauchsdatum')).toEqual([
      'mhd',
      'mindesthaltbarkeitsdatum',
      'verbrauchsdatum',
    ]);
  });

  it('names a word once per line, however often it stands there', () => {
    expect(words('recipe, Recipe and RECIPE')).toEqual(['recipe']);
  });

  it('raises no alarm for a neutral word that only holds a listed one', () => {
    for (const line of [
      'const password = readPassword();',
      'The test passes when every row passes the check.',
      'A lot of entries; the order of the rows; the service; the table register.',
      'guesthouse, guesswork and guestimate are one word each',
      'cookie, cookbook, dishwasher, foodstuff, mealtime, chefsache',
      'megastore, gastric, aghast',
      'Gerichtsstand ist der Sitz des Betriebs; die Rezeptur gehört dem Betrieb.',
      'Daten einspeisen, Kochfeld, Vorkoster',
      'stock, supplier, delivery, course, tip, plate, cover, station, temperature, expiry',
      "code: 'stock.insufficient'",
      'recipient, receipt, precipitation',
      'the fractional portion of a number; the cooked strings of a template literal',
      'menubar and submenu are one word each',
    ]) {
      expect(words(line), line).toEqual([]);
    }
  });

  it('holds every word and part in lower case, without duplicates', () => {
    for (const list of PLATFORM_WORD_LISTS) {
      const entries = [...list.words, ...(list.parts ?? []), ...(list.sequences ?? []).flat()];
      expect(entries.filter((entry) => entry !== entry.toLowerCase().normalize('NFC'))).toEqual([]);
      expect(entries.filter((entry) => !/^\p{Ll}+$/u.test(entry))).toEqual([]);
      expect(new Set(list.words).size).toBe(list.words.length);
    }
  });

  it('holds at least the words every build agent of the foundation was given', () => {
    const floor =
      'kitchen cook chef guest dish recipe menu restaurant food meal allergen HACCP ' +
      'Küche Koch Gast Gericht Rezept Speisekarte Lebensmittel';
    for (const word of floor.split(' ')) {
      expect(wordHits(word, [GASTRONOMY]), word).toHaveLength(1);
    }
  });
});

describe('product names', () => {
  it('finds the names of the editions and apps, in any case and inside identifiers', () => {
    expect(words("import { money } from '@randen/core';")).toEqual(['randen']);
    expect(words('const RANDEN_BACKUP = 1;')).toEqual(['randen']);
    expect(words('Wie in Randens Lager')).toEqual(['randens']);
    expect(words('Übernommen aus Rettich.')).toEqual(['rettich']);
    expect(words("const prefix = 'fridgeai:';")).toEqual(['fridgeai']);
  });

  it('finds the former name written in two words or with inner capitals', () => {
    expect(words('FridgeAI')).toEqual(['fridge ai']);
    expect(words('fridge_ai')).toEqual(['fridge ai']);
    expect(words('the Fridge AI app')).toEqual(['fridge ai']);
    expect(words('fridge and ai')).toEqual([]);
  });

  it('raises no alarm for the name of the suite or for words that hold a product name', () => {
    expect(words("import { money } from '@onestrand/core';")).toEqual([]);
    expect(words('Brandenburg; ein Feld umranden; am Strand')).toEqual([]);
  });

  it('says which list a word is on', () => {
    expect(wordHits('randen recipe')).toEqual([
      { word: 'recipe', list: 'gastronomy' },
      { word: 'randen', list: 'products' },
    ]);
  });
});

describe('platformWordProblems', () => {
  it('reports the place and the word, in code and in api.md', () => {
    const problems = platformWordProblems([
      file(
        'platform/core/src/units.ts',
        [
          'export const UNITS = [];',
          '',
          '// As in the kitchen: grams.',
          'const dishUnit = 1;',
        ].join('\n'),
      ),
      file('platform/core/api.md', '# Kern\n\n| `Menge` | Menge einer Zutat |\n'),
      file('platform/core/src/money.ts', 'export const zero = 0;\n'),
    ]);
    expect(problems).toEqual([
      {
        path: 'platform/core/src/units.ts',
        line: 3,
        message: '«kitchen» is a word of the gastronomy and has no place in the platform',
      },
      {
        path: 'platform/core/src/units.ts',
        line: 4,
        message: '«dish» is a word of the gastronomy and has no place in the platform',
      },
      {
        path: 'platform/core/api.md',
        line: 3,
        message: '«zutat» is a word of the gastronomy and has no place in the platform',
      },
    ]);
  });

  it('reads the path of a file like a line of it', () => {
    expect(
      platformWordProblems([file('platform/core/src/recipe-cost.ts', 'export {};\n')]),
    ).toEqual([
      {
        path: 'platform/core/src/recipe-cost.ts',
        line: 0,
        message: '«recipe» is a word of the gastronomy and has no place in the platform',
      },
    ]);
  });

  it('does not read a line that is exactly a provenance header', () => {
    const header =
      '// Origin: BanioX/Randen packages/core/src/domain/recipe-units.ts @ e0f0907 — adapted: food fields left out';
    const files = [file('platform/core/src/units.ts', `${header}\nexport {};\n`)];
    expect(platformWordProblems(files)).toEqual([]);
  });

  it('reads such a line in a file that carries no headers: nothing else would check it there', () => {
    // The provenance guard reads source files only. In a document or a JSON file the line
    // would be a place where anything could be written and nobody looks.
    const header =
      '// Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 — adapted: as in the kitchen';
    const lines = (path: string) =>
      platformWordProblems([file(path, `${header}\n`)]).map((problem) => problem.message);
    expect(lines('platform/core/src/money.ts')).toEqual([]);
    for (const path of ['platform/core/api.md', 'platform/core/package.json', 'platform/NOTES']) {
      expect(lines(path), path).toEqual([
        '«kitchen» is a word of the gastronomy and has no place in the platform',
        '«randen» is a word of a product (name of an edition or app) and has no place in the platform',
      ]);
    }
  });

  it('reads a line that only looks like a provenance header', () => {
    const lines = [
      '// Origin: Randen packages/core/src/money.ts',
      '// Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 — copied',
      '// from BanioX/Randen packages/core/src/money.ts @ e0f0907 — unchanged',
      '  // Origin: BanioX/Randen packages/core/src/money.ts @ e0f0907 — unchanged',
    ];
    const problems = platformWordProblems([file('platform/core/src/money.ts', lines.join('\n'))]);
    expect(problems.map((problem) => problem.line)).toEqual([1, 2, 3, 4]);
    expect(problems.every((problem) => problem.message.startsWith('«randen»'))).toBe(true);
  });

  it('checks against the lists it is given', () => {
    const construction: WordList = {
      id: 'construction',
      label: 'the construction trades',
      words: ['scaffold'],
      parts: ['baustelle'],
    };
    const files = [file('platform/core/src/a.ts', '// scaffold on the Grossbaustelle, recipe\n')];
    expect(platformWordProblems(files, [construction]).map((problem) => problem.message)).toEqual([
      '«scaffold» is a word of the construction trades and has no place in the platform',
      '«grossbaustelle» is a word of the construction trades and has no place in the platform',
    ]);
  });

  it('has one list per industry, one for the products and one for the tones of a brand', () => {
    expect(INDUSTRY_WORD_LISTS.map((list) => list.id)).toEqual(['gastronomy']);
    expect(PLATFORM_WORD_LISTS.map((list) => list.id)).toEqual([
      'gastronomy',
      'products',
      'brand-tones',
    ]);
    expect(PRODUCT_NAMES.words).toContain('randen');
  });

  it('finds a tone of a brand in a token, a class and a comment, not a role', () => {
    const file = {
      path: 'platform/ui/src/Probe.tsx',
      text: "const look = 'bg-wine-700 text-grape';\n// Kork on Traube\nconst role = 'bg-accent text-on-accent';\n",
    };
    expect(
      platformWordProblems([file]).map((problem) => `${String(problem.line)} ${problem.message}`),
    ).toEqual([
      '1 «wine» is a word of the colours of the brand of an edition and has no place in the platform',
      '1 «grape» is a word of the colours of the brand of an edition and has no place in the platform',
      '2 «kork» is a word of the colours of the brand of an edition and has no place in the platform',
      '2 «traube» is a word of the colours of the brand of an edition and has no place in the platform',
    ]);
  });
});

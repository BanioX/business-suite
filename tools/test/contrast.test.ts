import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  contrastProblems,
  contrastRatio,
  contrastReport,
  formatRow,
  KIT_THEME,
  luminance,
  pairsOf,
  themeFiles,
  themesOf,
  type PairShape,
  type ThemeShape,
} from '../src/contrast.ts';
import { REPO_ROOT } from '../src/repo-files.ts';

/** The example theme of the kit's tests: the colours of decision S-27. */
const EXAMPLE = 'platform/ui/test/example-theme.ts';

let pairs: PairShape[];
let example: ThemeShape;

beforeAll(async () => {
  pairs = pairsOf(await import(pathToFileURL(join(REPO_ROOT, KIT_THEME)).href));
  const [theme] = themesOf(await import(pathToFileURL(join(REPO_ROOT, EXAMPLE)).href));
  if (theme === undefined) {
    throw new Error(`${EXAMPLE} exports no theme`);
  }
  example = theme;
}, 60_000);

/** The example with one colour changed. */
function changed(scheme: 'light' | 'dark', token: string, colour: string): ThemeShape {
  return { ...example, id: 'changed', [scheme]: { ...example[scheme], [token]: colour } };
}

describe('the measure of WCAG 2.2', () => {
  it('gives the known values', () => {
    expect(luminance('#ffffff')).toBeCloseTo(1, 10);
    expect(luminance('#000000')).toBe(0);
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 10);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 10);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
    expect(contrastRatio('#123456', '#123456')).toBe(1);
  });

  it('refuses what is no colour of the form #rrggbb', () => {
    expect(() => luminance('#fff')).toThrow(/#rrggbb/);
    expect(() => luminance('white')).toThrow(/#rrggbb/);
  });

  it('confirms the contrasts of the table in S-27', () => {
    // docs/entscheide.md, S-27: «Schrift Nachtblau #061633 (9.3 zu 1)», «(6.9 zu 1)»,
    // «#0a5bea (5.7 zu 1 auf Weiss, 5.3 auf Silber)», «#8dbdff (9.5 zu 1)».
    expect(contrastRatio('#061633', '#8dbdff').toFixed(1)).toBe('9.3');
    expect(contrastRatio('#061633', '#5aa2ff').toFixed(1)).toBe('6.9');
    expect(contrastRatio('#0a5bea', '#ffffff').toFixed(1)).toBe('5.7');
    // S-27 rounds this one up to 5.3; it is 5.246, still well above 4.5 (reported to the head).
    expect(contrastRatio('#0a5bea', '#f4f6f9').toFixed(2)).toBe('5.25');
    expect(contrastRatio('#8dbdff', '#10141b').toFixed(1)).toBe('9.5');
  });
});

describe('the contrast of a theme', () => {
  it('reads the pairs of the kit', () => {
    expect(pairs.length).toBeGreaterThan(40);
    expect(pairs).toContainEqual(
      expect.objectContaining({ fg: 'on-accent', bg: 'accent', min: 4.5 }),
    );
    expect(pairs).toContainEqual(
      expect.objectContaining({ fg: 'accent-edge', bg: 'surface', min: 3 }),
    );
  });

  it('measures every pair in both schemes', () => {
    const rows = contrastReport(example, pairs);
    expect(rows).toHaveLength(pairs.length * 2);
    expect(rows.filter((row) => row.scheme === 'dark')).toHaveLength(pairs.length);
  });

  it('passes the example of S-27, light and dark', () => {
    expect(contrastProblems(EXAMPLE, example, pairs)).toEqual([]);
  });

  it('turns red for light blue text on white', () => {
    // The light blue of S-27 is for surfaces that act; as text on white it is 1.9:1.
    const problems = contrastProblems(EXAMPLE, changed('light', 'accent-strong', '#8dbdff'), pairs);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0]?.message).toContain('«accent-strong» #8dbdff on «ground» #e6e9ee');
    expect(problems.map((problem) => problem.message).join('\n')).toContain(
      '«accent-strong» #8dbdff on «surface» #ffffff is 1.93:1, WCAG 2.2 asks 4.5:1',
    );
  });

  it('turns red for an edge that cannot be seen, and only there', () => {
    const problems = contrastProblems(EXAMPLE, changed('dark', 'line-strong', '#2a303a'), pairs);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.every((problem) => problem.message.includes('dark: «line-strong»'))).toBe(true);
    expect(problems.every((problem) => problem.message.includes('asks 3:1'))).toBe(true);
  });

  it('rounds down, so a pair shown as 4.50 never passes on 4.499', () => {
    const [row] = contrastReport(
      {
        kind: 'theme',
        id: 'edge',
        light: { a: '#767676', b: '#ffffff' },
        dark: { a: '#767676', b: '#ffffff' },
      },
      [{ fg: 'a', bg: 'b', min: 4.5, use: 'probe' }],
    );
    expect(row?.ratio).toBe(4.54);
    expect(row?.pass).toBe(true);
    const [low] = contrastReport(
      {
        kind: 'theme',
        id: 'edge',
        light: { a: '#777777', b: '#ffffff' },
        dark: { a: '#777777', b: '#ffffff' },
      },
      [{ fg: 'a', bg: 'b', min: 4.5, use: 'probe' }],
    );
    expect(low?.ratio).toBe(4.47);
    expect(low?.pass).toBe(false);
    expect(formatRow(low ?? row ?? ({} as never))).toMatch(/^FAIL edge light a on b/);
  });

  it('fails a pair whose token has no colour', () => {
    const missing: ThemeShape = {
      ...example,
      id: 'missing',
      light: { ...example.light, accent: undefined as never },
    };
    const problems = contrastProblems('x.ts', missing, pairs);
    expect(problems.map((problem) => problem.message)).toContain(
      'theme «missing», light: «on-accent» on «accent» has no colour',
    );
  });
});

describe('the themes of the repository', () => {
  it('starts with the kit, and takes the theme of each edition that has one', () => {
    expect(themeFiles(REPO_ROOT)[0]).toBe(KIT_THEME);
    for (const path of themeFiles(REPO_ROOT).slice(1)) {
      expect(path).toMatch(/^editions\/[^/]+\/theme\.ts$/);
    }
  });

  it('finds the themes a module exports and nothing else', () => {
    expect(themesOf({ example, pairs, other: { kind: 'industry' } })).toEqual([example]);
    expect(themesOf(undefined)).toEqual([]);
  });

  it('refuses a kit without pairs', () => {
    expect(() => pairsOf({})).toThrow(/CONTRAST_PAIRS/);
    expect(() => pairsOf({ CONTRAST_PAIRS: [{ fg: 'a' }] })).toThrow(/CONTRAST_PAIRS/);
  });
});

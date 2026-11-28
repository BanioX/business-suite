import { describe, expect, it } from 'vitest';
import {
  CONTRAST_PAIRS,
  defineTheme,
  neutralTheme,
  SCHEME_ATTRIBUTE,
  ThemeError,
  themeCss,
  themeProblems,
  TOKENS,
  type Palette,
  type ThemeInput,
} from '../src/index';
import { exampleTheme } from './example-theme';

function input(
  change: (theme: {
    id: string;
    light: Record<string, unknown>;
    dark: Record<string, unknown>;
  }) => void,
): unknown {
  const copy = {
    id: exampleTheme.id,
    light: { ...exampleTheme.light } as Record<string, unknown>,
    dark: { ...exampleTheme.dark } as Record<string, unknown>,
  };
  change(copy);
  return copy;
}

/** The declarations of one block of the CSS, as a map. */
function block(css: string, opening: string): Map<string, string> {
  const start = css.indexOf(opening);
  expect(start, opening).toBeGreaterThanOrEqual(0);
  const end = css.indexOf('}', start);
  const body = css.slice(start + opening.length, end);
  return new Map(
    [...body.matchAll(/(--[a-z-]+|color-scheme):\s*([^;]+);/g)].map(([, name = '', value = '']) => [
      name,
      value,
    ]),
  );
}

describe('the tokens', () => {
  it('are the roles of the kit, never the name of a brand colour', () => {
    expect(TOKENS).toContain('accent');
    expect(TOKENS).toContain('on-accent');
    expect(TOKENS).toContain('surface');
    expect(new Set(TOKENS).size).toBe(TOKENS.length);
    for (const token of TOKENS) {
      expect(token).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it('are all used by some contrast pair, and every pair names tokens', () => {
    const used = new Set(CONTRAST_PAIRS.flatMap((pair) => [pair.fg, pair.bg]));
    // `line` is decoration: hairlines between rows need no contrast (WCAG 1.4.11 asks none).
    expect(TOKENS.filter((token) => !used.has(token))).toEqual(['line']);
    for (const pair of CONTRAST_PAIRS) {
      expect([4.5, 3]).toContain(pair.min);
      expect(pair.use).not.toBe('');
    }
  });
});

describe('defineTheme', () => {
  it('takes a complete theme, lowers its colours and freezes it', () => {
    const upper = defineTheme({
      id: 'upper',
      light: Object.fromEntries(
        TOKENS.map((token) => [token, exampleTheme.light[token].toUpperCase()]),
      ) as Palette,
      dark: exampleTheme.dark,
    });
    expect(upper.kind).toBe('theme');
    expect(upper.light.accent).toBe('#8dbdff');
    expect(Object.isFrozen(upper)).toBe(true);
    expect(Object.isFrozen(upper.light)).toBe(true);
  });

  it('ships a neutral theme and the example of S-27, both without a problem', () => {
    expect(themeProblems(neutralTheme)).toEqual([]);
    expect(themeProblems(exampleTheme)).toEqual([]);
    expect(neutralTheme.id).toBe('neutral');
  });

  it.each([
    ['a missing token', input((t) => delete t.light.accent), 'token_missing', 'light.accent'],
    ['an unknown token', input((t) => (t.dark.wrong = '#000000')), 'token_unknown', 'dark.wrong'],
    ['a short colour', input((t) => (t.light.fg = '#000')), 'colour', 'light.fg'],
    ['a colour with alpha', input((t) => (t.light.fg = '#00000080')), 'colour', 'light.fg'],
    ['a colour by name', input((t) => (t.dark.fg = 'white')), 'colour', 'dark.fg'],
    ['a colour that is no text', input((t) => (t.dark.fg = 12)), 'colour', 'dark.fg'],
    ['a missing scheme', input((t) => Reflect.deleteProperty(t, 'dark')), 'scheme_missing', 'dark'],
    ['a wrong id', input((t) => (t.id = 'Vor Ort')), 'id', 'id'],
  ])('refuses %s', (_what, wrong, code, path) => {
    expect(themeProblems(wrong)).toEqual([expect.objectContaining({ code, path })]);
    expect(() => defineTheme(wrong as ThemeInput)).toThrow(ThemeError);
    try {
      defineTheme(wrong as ThemeInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ThemeError);
      expect((error as ThemeError).code).toBe(code);
    }
  });

  it('says that something that is no object is no theme', () => {
    expect(themeProblems(null)).toEqual([expect.objectContaining({ code: 'not_a_theme' })]);
    expect(themeProblems([])).toEqual([expect.objectContaining({ code: 'not_a_theme' })]);
    expect(new ThemeError([]).code).toBe('not_a_theme');
  });
});

describe('themeCss', () => {
  const css = themeCss(exampleTheme);

  it('sets every token for light by default', () => {
    const light = block(css, ':root {');
    expect(light.get('color-scheme')).toBe('light');
    for (const token of TOKENS) {
      expect(light.get(`--${token}`), token).toBe(exampleTheme.light[token]);
    }
    expect(light.get('--accent')).toBe('#8dbdff');
    expect(light.get('--on-accent')).toBe('#061633');
  });

  it('sets every token for dark when the device asks and no choice says light', () => {
    const opening = `@media (prefers-color-scheme: dark) {\n  :root:not([${SCHEME_ATTRIBUTE}='light']) {`;
    const dark = block(css, opening);
    expect(dark.get('color-scheme')).toBe('dark');
    for (const token of TOKENS) {
      expect(dark.get(`--${token}`), token).toBe(exampleTheme.dark[token]);
    }
  });

  it('sets every token for dark when the person chose dark, whatever the device says', () => {
    const chosen = block(css, `:root[${SCHEME_ATTRIBUTE}='dark'] {`);
    expect(chosen.get('color-scheme')).toBe('dark');
    for (const token of TOKENS) {
      expect(chosen.get(`--${token}`), token).toBe(exampleTheme.dark[token]);
    }
  });

  it('derives shadows and the veil from the tokens, never from a colour of its own', () => {
    for (const opening of [':root {', `:root[${SCHEME_ATTRIBUTE}='dark'] {`]) {
      const declared = block(css, opening);
      for (const name of ['--card-shadow', '--float-shadow', '--scrim']) {
        const value = declared.get(name) ?? '';
        expect(value, name).toMatch(/var\(--(fg|ground)\)/);
        expect(value, name).not.toMatch(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
      }
    }
  });

  it('holds no colour but those of the theme', () => {
    const colours = new Set(css.match(/#[0-9a-f]{6}\b/gi));
    const theme = new Set([
      ...Object.values(exampleTheme.light),
      ...Object.values(exampleTheme.dark),
    ]);
    expect([...colours].filter((colour) => !theme.has(colour))).toEqual([]);
  });

  it('can set the tokens on another element', () => {
    const scoped = themeCss(neutralTheme, { selector: '.preview' });
    expect(scoped).toContain('.preview {');
    expect(scoped).toContain(`.preview:not([${SCHEME_ATTRIBUTE}='light'])`);
    expect(scoped).toContain(`.preview[${SCHEME_ATTRIBUTE}='dark'] {`);
    expect(scoped).not.toContain(':root');
  });

  it('gives the same text for the same theme', () => {
    expect(themeCss(exampleTheme)).toBe(css);
    expect(css).toContain('Theme «example»');
  });
});

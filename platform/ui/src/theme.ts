/**
 * The theme of an edition (P-08; decision S-27 in docs/entscheide.md): the kit draws with
 * semantic tokens only, and each edition hands in the colours of its brand as a theme, light and
 * dark. The platform ships a neutral theme; it names no brand and no product.
 *
 * Everything here is plain data and pure functions, without React and without the DOM: the
 * guard of the contrast (`pnpm contrast`, tools/src/contrast.ts) reads this file as it is.
 */

/**
 * The tokens of the kit, the smallest set it really draws with. Each is one role, in light and
 * in dark mode alike; the theme gives each a colour per scheme.
 */
export const TOKENS = [
  /** The ground behind the app (around the app on a wide screen, under the bar at the side). */
  'ground',
  /** The ground of the app itself: the page. */
  'app',
  /** Lists, cards, fields, sheets. */
  'surface',
  /** A quiet surface on a surface: the track of a segmented control, a tile, a pressed row. */
  'surface-muted',
  /** The calm surface of a key figure: a gradient from `calm-start` at the top to `calm-end`. */
  'calm-start',
  'calm-end',
  /** Text. */
  'fg',
  /** Quiet text: hints, labels, the second line of a row. */
  'muted',
  /** Hairlines between rows; decoration, no contrast asked for. */
  'line',
  /** Edges that must be seen: a field, an empty checkbox, the switch when off (3:1). */
  'line-strong',
  /** Surfaces that act or mark: the main button, «＋», what is ticked or chosen. */
  'accent',
  /** Text and symbols on `accent`. */
  'on-accent',
  /** The accent as text: a link, «Zurück», the active place of the navigation. */
  'accent-strong',
  /** The edge of what is ticked or chosen, and the focus ring (3:1). */
  'accent-edge',
  /** A soft tint of the accent: a hint, the chosen row. */
  'accent-soft',
  /** «In Ordnung», as text and as the tint behind it. */
  'ok',
  'ok-soft',
  /** «Bald», «im Blick behalten». */
  'warn',
  'warn-soft',
  /** «Falsch», «fehlt», «abgelaufen». Never the accent: blue never means good or bad (S-27). */
  'bad',
  'bad-soft',
] as const;

export type Token = (typeof TOKENS)[number];

/** The two schemes of a theme. */
export const SCHEMES = ['light', 'dark'] as const;
export type Scheme = (typeof SCHEMES)[number];

/** One colour per token, as `#rrggbb`: the contrast check needs exact colours, no alpha. */
export type Palette = Readonly<Record<Token, string>>;

/** What an edition writes: an id and a palette per scheme. */
export interface ThemeInput {
  /** Lower case letters, digits and `-`, e.g. `neutral`; names the theme in the contrast report. */
  readonly id: string;
  readonly light: Palette;
  readonly dark: Palette;
}

/** A theme made by `defineTheme`: checked, normalised to lower case, frozen. */
export interface Theme extends ThemeInput {
  readonly kind: 'theme';
}

/**
 * The attribute on the root element that holds the choice of the person: `light` or `dark`.
 * Without it the device decides (`prefers-color-scheme`).
 */
export const SCHEME_ATTRIBUTE = 'data-scheme';

/** What is wrong with a theme, as data. */
export interface ThemeProblem {
  readonly code: ThemeProblemCode;
  /** Where: `id`, `light`, `dark.accent`. */
  readonly path: string;
  /** English, for the person who reads the red test. */
  readonly message: string;
}

export const THEME_PROBLEM_CODES = [
  'not_a_theme',
  'id',
  'scheme_missing',
  'token_missing',
  'token_unknown',
  'colour',
] as const;
export type ThemeProblemCode = (typeof THEME_PROBLEM_CODES)[number];

/** A theme that cannot be built; the code is the one of the first problem. */
export class ThemeError extends Error {
  readonly code: ThemeProblemCode;
  readonly problems: readonly ThemeProblem[];

  constructor(problems: readonly ThemeProblem[]) {
    const [first] = problems;
    super(first === undefined ? 'invalid theme' : `${first.path}: ${first.message}`);
    this.name = 'ThemeError';
    this.code = first?.code ?? 'not_a_theme';
    this.problems = problems;
  }
}

const THEME_ID = /^[a-z][a-z0-9-]*$/;
const COLOUR = /^#[0-9a-fA-F]{6}$/;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function paletteProblems(scheme: Scheme, palette: unknown): ThemeProblem[] {
  if (!isRecord(palette)) {
    return [{ code: 'scheme_missing', path: scheme, message: `the ${scheme} palette is missing` }];
  }
  const known = new Set<string>(TOKENS);
  const problems: ThemeProblem[] = [];
  for (const token of TOKENS) {
    const value = palette[token];
    if (value === undefined) {
      problems.push({
        code: 'token_missing',
        path: `${scheme}.${token}`,
        message: `the token «${token}» has no colour`,
      });
    } else if (typeof value !== 'string' || !COLOUR.test(value)) {
      problems.push({
        code: 'colour',
        path: `${scheme}.${token}`,
        message: `«${typeof value === 'string' ? value : typeof value}» is not a colour of the form #rrggbb`,
      });
    }
  }
  for (const key of Object.keys(palette)) {
    if (!known.has(key)) {
      problems.push({
        code: 'token_unknown',
        path: `${scheme}.${key}`,
        message: `the kit has no token «${key}»`,
      });
    }
  }
  return problems;
}

/** Everything that is wrong with a theme; empty when `defineTheme` takes it. Never throws. */
export function themeProblems(input: unknown): ThemeProblem[] {
  if (!isRecord(input)) {
    return [{ code: 'not_a_theme', path: '', message: 'a theme is an object' }];
  }
  const problems: ThemeProblem[] = [];
  if (typeof input.id !== 'string' || !THEME_ID.test(input.id)) {
    problems.push({
      code: 'id',
      path: 'id',
      message: 'the id is lower case letters, digits and «-», starting with a letter',
    });
  }
  for (const scheme of SCHEMES) {
    problems.push(...paletteProblems(scheme, input[scheme]));
  }
  return problems;
}

function normalised(palette: Palette): Palette {
  const entries = TOKENS.map((token) => [token, palette[token].toLowerCase()] as const);
  return Object.freeze(Object.fromEntries(entries) as Record<Token, string>);
}

/** Checks a theme and freezes it. Throws a `ThemeError` with the code of the first problem. */
export function defineTheme(input: ThemeInput): Theme {
  const problems = themeProblems(input);
  if (problems.length > 0) {
    throw new ThemeError(problems);
  }
  return Object.freeze({
    kind: 'theme',
    id: input.id,
    light: normalised(input.light),
    dark: normalised(input.dark),
  });
}

/**
 * Colours the kit derives from the tokens in each scheme, never from a value of its own: the
 * soft shadow of a card, the shadow of what floats, the veil behind a sheet. In the dark a card
 * gets a fine edge instead of a shadow.
 */
const DERIVED: Readonly<Record<Scheme, readonly (readonly [string, string])[]>> = {
  light: [
    [
      'card-shadow',
      '0 1px 2px color-mix(in srgb, var(--fg) 6%, transparent), 0 2px 10px color-mix(in srgb, var(--fg) 6%, transparent)',
    ],
    ['float-shadow', '0 8px 24px color-mix(in srgb, var(--fg) 16%, transparent)'],
    ['scrim', 'color-mix(in srgb, var(--fg) 40%, transparent)'],
  ],
  dark: [
    ['card-shadow', '0 0 0 1px color-mix(in srgb, var(--fg) 10%, transparent)'],
    [
      'float-shadow',
      '0 0 0 1px color-mix(in srgb, var(--fg) 12%, transparent), 0 8px 24px color-mix(in srgb, var(--ground) 60%, transparent)',
    ],
    ['scrim', 'color-mix(in srgb, var(--ground) 70%, transparent)'],
  ],
};

function declarations(theme: Theme, scheme: Scheme, indent: string): string {
  const palette = theme[scheme];
  return [
    `${indent}color-scheme: ${scheme};`,
    ...TOKENS.map((token) => `${indent}--${token}: ${palette[token]};`),
    ...DERIVED[scheme].map(([name, value]) => `${indent}--${name}: ${value};`),
  ].join('\n');
}

export interface ThemeCssOptions {
  /** The element the tokens are set on. Default `:root`. */
  readonly selector?: string;
}

/**
 * The theme as CSS custom properties for both schemes: light by default, dark when the device
 * asks for it, and the choice of the person on the root element (`data-scheme="light"` or
 * `"dark"`) before the device. The CSP of an edition allows no inline style, so the edition
 * writes this into a file of its own when it builds.
 */
export function themeCss(theme: Theme, options: ThemeCssOptions = {}): string {
  const root = options.selector ?? ':root';
  const chosen = (scheme: Scheme) => `${root}[${SCHEME_ATTRIBUTE}='${scheme}']`;
  return [
    `/* Theme «${theme.id}», written by themeCss of @onestrand/ui. */`,
    `${root} {`,
    declarations(theme, 'light', '  '),
    '}',
    '@media (prefers-color-scheme: dark) {',
    `  ${root}:not([${SCHEME_ATTRIBUTE}='light']) {`,
    declarations(theme, 'dark', '    '),
    '  }',
    '}',
    `${chosen('dark')} {`,
    declarations(theme, 'dark', '  '),
    '}',
    '',
  ].join('\n');
}

/** A pair of colours the kit draws one on the other, and the contrast WCAG 2.2 asks of it. */
export interface ContrastPair {
  /** What is drawn: text, a symbol or an edge. */
  readonly fg: Token;
  /** What it is drawn on. */
  readonly bg: Token;
  /** 4.5 for text (WCAG 1.4.3), 3 for large text and the edges of controls (1.4.11). */
  readonly min: 4.5 | 3;
  /** Where the kit draws it, in English. */
  readonly use: string;
}

const GROUNDS = ['ground', 'app', 'surface', 'surface-muted', 'calm-start', 'calm-end'] as const;
const STATUS = ['ok', 'warn', 'bad'] as const;

/**
 * Every pair the kit draws, for the contrast check of each theme. A component that draws a new
 * pair adds it here in the same step.
 */
export const CONTRAST_PAIRS: readonly ContrastPair[] = Object.freeze([
  ...GROUNDS.flatMap((bg): ContrastPair[] => [
    { fg: 'fg', bg, min: 4.5, use: 'text' },
    { fg: 'muted', bg, min: 4.5, use: 'quiet text: hints, labels, second lines' },
    { fg: 'accent-strong', bg, min: 4.5, use: 'links, «back», the active place' },
    {
      fg: 'line-strong',
      bg,
      min: 3,
      use: 'edge of a field, an empty checkbox, a switch that is off',
    },
    { fg: 'accent-edge', bg, min: 3, use: 'focus ring, edge of what is ticked or chosen' },
  ]),
  { fg: 'on-accent', bg: 'accent', min: 4.5, use: 'the main button, the chosen segment, a tick' },
  { fg: 'fg', bg: 'accent-soft', min: 4.5, use: 'text of a hint' },
  { fg: 'accent-strong', bg: 'accent-soft', min: 4.5, use: 'symbol and chip of a hint' },
  { fg: 'accent-edge', bg: 'accent-soft', min: 3, use: 'focus ring on a hint' },
  { fg: 'app', bg: 'fg', min: 4.5, use: 'text of a toast' },
  ...STATUS.flatMap((tone): ContrastPair[] => [
    { fg: tone, bg: 'surface', min: 4.5, use: `${tone} as text on a card` },
    { fg: tone, bg: 'app', min: 4.5, use: `${tone} as text on the page` },
    { fg: tone, bg: `${tone}-soft`, min: 4.5, use: `${tone} chip and notice` },
    { fg: 'fg', bg: `${tone}-soft`, min: 4.5, use: `text of a ${tone} notice` },
  ]),
]);

/**
 * The neutral theme of the platform: slate and white, without a brand. An edition brings its
 * own; this one is for what has none yet (a test, a page of the kit on its own).
 */
export const neutralTheme: Theme = defineTheme({
  id: 'neutral',
  light: {
    ground: '#e9ebee',
    app: '#f5f6f8',
    surface: '#ffffff',
    'surface-muted': '#edeff2',
    'calm-start': '#ffffff',
    'calm-end': '#e9ebee',
    fg: '#14181f',
    muted: '#555d6a',
    line: '#dee1e6',
    'line-strong': '#7b8390',
    accent: '#3a4656',
    'on-accent': '#ffffff',
    'accent-strong': '#34507a',
    'accent-edge': '#34507a',
    'accent-soft': '#eaeef4',
    ok: '#1d6b3f',
    'ok-soft': '#e3f4e8',
    warn: '#8a5200',
    'warn-soft': '#fcf0db',
    bad: '#b3261e',
    'bad-soft': '#fdecea',
  },
  dark: {
    ground: '#000000',
    app: '#0a0b0d',
    surface: '#16181c',
    'surface-muted': '#1f2227',
    'calm-start': '#1a1d22',
    'calm-end': '#111317',
    fg: '#f2f3f5',
    muted: '#a0a6b0',
    line: '#2a2e35',
    'line-strong': '#6e7581',
    accent: '#c5ccd6',
    'on-accent': '#14181f',
    'accent-strong': '#b4c6e0',
    'accent-edge': '#b4c6e0',
    'accent-soft': '#1e2633',
    ok: '#6fcf97',
    'ok-soft': '#0f2a1b',
    warn: '#f2b56b',
    'warn-soft': '#2e1f0a',
    bad: '#ff8a80',
    'bad-soft': '#3a1513',
  },
});

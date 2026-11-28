// Origin: BanioX/Randen scripts/check-contrast.mjs @ e0f0907 — adapted: the pairs come from the kit (CONTRAST_PAIRS) and the colours from each theme made by defineTheme instead of being read out of a stylesheet; pure functions with findings as data; themes found in the repository
// The contrast of every theme (P-08, decision S-27): each pair the kit draws (`CONTRAST_PAIRS` in
// platform/ui/src/theme.ts) is measured in the light and in the dark palette of every theme of
// the repository, against the minimum of WCAG 2.2: 4.5:1 for text (1.4.3), 3:1 for large text and
// the edges of controls (1.4.11).
//
// The kit says which pairs it draws; this file measures them. Both are read as plain shapes, so
// the tools need neither React nor the kit to run. The guard (tools/guards/contrast.guard.test.ts)
// loads the themes, as the guard of the industries loads their manifests.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Problem } from './repo-files.ts';

/** A theme as far as this check reads it: an id and a palette of `#rrggbb` per scheme. */
export interface ThemeShape {
  readonly kind: 'theme';
  readonly id: string;
  readonly light: Readonly<Record<string, string>>;
  readonly dark: Readonly<Record<string, string>>;
}

/** A pair the kit draws: `fg` on `bg`, with its minimum. */
export interface PairShape {
  readonly fg: string;
  readonly bg: string;
  readonly min: number;
  readonly use: string;
}

export const SCHEMES = ['light', 'dark'] as const;
export type Scheme = (typeof SCHEMES)[number];

const HEX = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

/** The relative luminance of a colour `#rrggbb` (WCAG 2.2, «relative luminance»). */
export function luminance(colour: string): number {
  const match = HEX.exec(colour);
  if (match === null) {
    throw new Error(`«${colour}» is not a colour of the form #rrggbb`);
  }
  const [red = 0, green = 0, blue = 0] = match.slice(1).map((part) => {
    const value = Number.parseInt(part, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** The contrast ratio of two colours, from 1 to 21, whichever is lighter. */
export function contrastRatio(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (high + 0.05) / (low + 0.05);
}

/** One pair, measured in one scheme of one theme. */
export interface ContrastRow {
  readonly theme: string;
  readonly scheme: Scheme;
  readonly fg: string;
  readonly bg: string;
  /** The colours, or undefined when the theme has no colour for the token. */
  readonly fgColour: string | undefined;
  readonly bgColour: string | undefined;
  /** Rounded down to two places, so a pair shown as 4.50 never passes on a hidden 4.499. */
  readonly ratio: number;
  readonly min: number;
  readonly use: string;
  readonly pass: boolean;
}

/** Every pair in both schemes of the theme. A token without a colour fails its pairs. */
export function contrastReport(theme: ThemeShape, pairs: readonly PairShape[]): ContrastRow[] {
  return SCHEMES.flatMap((scheme) =>
    pairs.map((pair): ContrastRow => {
      const palette = theme[scheme];
      const fgColour = palette[pair.fg];
      const bgColour = palette[pair.bg];
      const exact =
        fgColour === undefined || bgColour === undefined ? 0 : contrastRatio(fgColour, bgColour);
      const ratio = Math.floor(exact * 100) / 100;
      return {
        theme: theme.id,
        scheme,
        fg: pair.fg,
        bg: pair.bg,
        fgColour,
        bgColour,
        ratio,
        min: pair.min,
        use: pair.use,
        pass: ratio >= pair.min,
      };
    }),
  );
}

/** A row as one line of the report: `ok   light  on-accent on accent  9.28 (min 4.5)  …`. */
export function formatRow(row: ContrastRow): string {
  const pair = `${row.fg} on ${row.bg}`;
  return `${row.pass ? 'ok  ' : 'FAIL'} ${row.theme} ${row.scheme.padEnd(5)} ${pair.padEnd(30)} ${row.ratio.toFixed(2).padStart(5)} (min ${String(row.min)})  ${row.use}`;
}

/** The pairs of a theme that fail, as problems of the file that holds the theme. */
export function contrastProblems(
  path: string,
  theme: ThemeShape,
  pairs: readonly PairShape[],
): Problem[] {
  return contrastReport(theme, pairs)
    .filter((row) => !row.pass)
    .map((row) => ({
      path,
      line: 0,
      message:
        row.fgColour === undefined || row.bgColour === undefined
          ? `theme «${row.theme}», ${row.scheme}: «${row.fg}» on «${row.bg}» has no colour`
          : `theme «${row.theme}», ${row.scheme}: «${row.fg}» ${row.fgColour} on «${row.bg}» ${row.bgColour} is ${row.ratio.toFixed(2)}:1, WCAG 2.2 asks ${String(row.min)}:1 (${row.use})`,
    }));
}

/** The file of the kit that holds the pairs and the neutral theme, from the root. */
export const KIT_THEME = 'platform/ui/src/theme.ts';

/**
 * Every file of the repository that holds themes: the kit, and the theme of each edition
 * (`editions/<id>/theme.ts`, which exports the theme made by `defineTheme`). A new edition is
 * read the moment its file is there, without a line here.
 */
export function themeFiles(root: string): string[] {
  const editions = join(root, 'editions');
  const found = existsSync(editions)
    ? readdirSync(editions, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
        .map((entry) => `editions/${entry.name}/theme.ts`)
        .filter((path) => existsSync(join(root, path)))
        .sort()
    : [];
  return [KIT_THEME, ...found];
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTheme(value: unknown): value is ThemeShape {
  return (
    isRecord(value) &&
    value.kind === 'theme' &&
    typeof value.id === 'string' &&
    isRecord(value.light) &&
    isRecord(value.dark)
  );
}

/** The themes a module exports (made by `defineTheme`), in the order of its exports. */
export function themesOf(exports: unknown): ThemeShape[] {
  return isRecord(exports) ? Object.values(exports).filter(isTheme) : [];
}

function isPair(value: unknown): value is PairShape {
  return (
    isRecord(value) &&
    typeof value.fg === 'string' &&
    typeof value.bg === 'string' &&
    typeof value.min === 'number' &&
    typeof value.use === 'string'
  );
}

/** The pairs the kit exports as `CONTRAST_PAIRS`; throws when they are missing or malformed. */
export function pairsOf(exports: unknown): PairShape[] {
  const pairs = isRecord(exports) ? exports.CONTRAST_PAIRS : undefined;
  if (!Array.isArray(pairs) || pairs.length === 0 || !pairs.every(isPair)) {
    throw new Error(`${KIT_THEME} must export CONTRAST_PAIRS, a list of { fg, bg, min, use }`);
  }
  return pairs;
}

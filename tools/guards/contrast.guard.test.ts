import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  contrastProblems,
  contrastReport,
  formatRow,
  KIT_THEME,
  pairsOf,
  themeFiles,
  themesOf,
} from '../src/contrast.ts';
import { formatProblem, REPO_ROOT } from '../src/repo-files.ts';

/**
 * Every theme of the repository can be read (P-08, decision S-27; WCAG 2.2): each pair the kit
 * draws (`CONTRAST_PAIRS`) reaches 4.5:1 for text and 3:1 for edges, light and dark, in the
 * neutral theme of the kit and in the theme of every edition (`editions/<id>/theme.ts`). Runs with
 * `pnpm guards` and alone with `pnpm contrast`, which also prints every pair.
 */
describe('contrast of every theme', async () => {
  const load = async (path: string): Promise<unknown> =>
    import(pathToFileURL(join(REPO_ROOT, path)).href);
  const pairs = pairsOf(await load(KIT_THEME));
  const files = themeFiles(REPO_ROOT);
  const themes = await Promise.all(
    files.map(async (path) => ({ path, themes: themesOf(await load(path)) })),
  );

  it('reads the themes of the kit and of the editions', () => {
    // A guard that reads nothing would pass for the wrong reason.
    expect(themes.map((entry) => entry.path)).toContain(KIT_THEME);
    expect(
      themes.find((entry) => entry.path === KIT_THEME)?.themes.map((theme) => theme.id),
    ).toEqual(['neutral']);
    for (const entry of themes) {
      expect(
        entry.themes.length,
        `${entry.path} exports no theme made by defineTheme`,
      ).toBeGreaterThan(0);
    }
  });

  it('reaches the contrast of WCAG 2.2 for every pair the kit draws, light and dark', () => {
    const rows = themes.flatMap((entry) =>
      entry.themes.flatMap((theme) => contrastReport(theme, pairs)),
    );
    process.stdout.write(
      `\n${rows.map(formatRow).join('\n')}\n${String(rows.length)} pairs measured\n`,
    );
    const problems = themes.flatMap((entry) =>
      entry.themes.flatMap((theme) => contrastProblems(entry.path, theme, pairs)),
    );
    expect(problems.map(formatProblem)).toEqual([]);
  });
});

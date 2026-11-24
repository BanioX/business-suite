import { describe, expect, it } from 'vitest';
import { platformWordProblems } from '../src/platform-words.ts';
import { formatProblem, readTextFiles, REPO_ROOT } from '../src/repo-files.ts';
import { PLATFORM_WORD_LISTS } from '../src/words/platform.ts';

/**
 * The platform speaks of no industry and of no product (docs/zusammenarbeit.md, 10.3; acceptance
 * of W0-01): no word of the gastronomy, no name of an edition or app in any text file under
 * `platform/`, except in a provenance header. The lists are `tools/src/words/`.
 */
describe('words of an industry in the platform', () => {
  const files = readTextFiles(REPO_ROOT, 'platform');

  it('reads the platform', () => {
    // A guard that reads nothing would pass for the wrong reason.
    const paths = files.map((file) => file.path);
    expect(paths).toContain('platform/core/package.json');
    expect(paths.filter((path) => !path.startsWith('platform/'))).toEqual([]);
    expect(paths.filter((path) => path.includes('node_modules/'))).toEqual([]);
    expect(PLATFORM_WORD_LISTS.length).toBeGreaterThanOrEqual(2);
  });

  it('holds no word of an industry and no product name', () => {
    expect(platformWordProblems(files).map(formatProblem)).toEqual([]);
  });
});

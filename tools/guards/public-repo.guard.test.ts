import { describe, expect, it } from 'vitest';
import { forbiddenNameProblems, priceProblems } from '../src/public-repo.ts';
import { formatProblem, readTextFiles, REPO_ROOT } from '../src/repo-files.ts';

/**
 * This repository is public (ADR-0011; docs/zusammenarbeit.md, 10.11): no name of another
 * software product, of a real company or person, and no price of the suite, in any text file.
 * What the check cannot see is written down in `tools/src/public-repo.ts`; that part stays with
 * whoever writes.
 */
describe('the public repository (ADR-0011)', () => {
  const files = readTextFiles(REPO_ROOT);

  it('reads the repository', () => {
    // A guard that reads nothing would pass for the wrong reason.
    const paths = files.map((file) => file.path);
    expect(paths).toContain('CLAUDE.md');
    expect(paths).toContain('docs/adr/0011-oeffentliches-repo.md');
    expect(paths).toContain('tools/src/words/forbidden-names.ts');
    // Dot files and dot directories are part of the repository like everything else.
    expect(paths).toContain('.github/workflows/ci.yml');
    expect(paths).toContain('.gitignore');
    expect(paths.filter((path) => path.includes('node_modules/'))).toEqual([]);
  });

  it('names no listed name, in no file and no path', () => {
    expect(forbiddenNameProblems(files).map(formatProblem)).toEqual([]);
  });

  it('states no price of the suite or of one of its apps', () => {
    expect(priceProblems(files).map(formatProblem)).toEqual([]);
  });
});

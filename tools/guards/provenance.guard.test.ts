import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PROVENANCE_DOCUMENT, provenanceProblems } from '../src/provenance.ts';
import { formatProblem, listFiles, readTextFiles, REPO_ROOT } from '../src/repo-files.ts';

/**
 * Every copied file names its source (acceptance of W0-01): the headers of the source files are
 * well formed, and `docs/herkunft.md` is on their state. After adding or changing a header, run
 * `node tools/provenance.mjs`.
 */
describe('provenance of copied files (docs/herkunft.md)', () => {
  const target = join(REPO_ROOT, PROVENANCE_DOCUMENT);
  const files = readTextFiles(REPO_ROOT);
  const problems = provenanceProblems({
    files,
    paths: listFiles(REPO_ROOT),
    document: existsSync(target) ? readFileSync(target, 'utf8') : undefined,
  });

  it('reads the repository', () => {
    // A guard that reads nothing would pass for the wrong reason.
    expect(files.map((file) => file.path)).toContain('tools/src/provenance.ts');
  });

  it('has well-formed headers and a document that is up to date', () => {
    expect(problems.map(formatProblem)).toEqual([]);
  });
});

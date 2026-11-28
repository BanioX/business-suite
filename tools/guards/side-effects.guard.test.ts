import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatProblem, readTextFiles, REPO_ROOT } from '../src/repo-files.ts';
import {
  shippedSources,
  SIDE_EFFECTS_DOCUMENT,
  sideEffectGuardProblems,
} from '../src/side-effects.ts';

/**
 * Whatever shipped code does outside itself stands in the register (CLAUDE.md, «Daten bleiben
 * auf dem Gerät»; acceptance of W0-01): `docs/nebenwirkungen.md` is well formed, every kind of
 * side effect in the code has its row, and a request to a server has the decision of the product
 * owner. After adding a side effect, add its row in the same step.
 */
describe('side effects of shipped code (docs/nebenwirkungen.md)', () => {
  const target = join(REPO_ROOT, SIDE_EFFECTS_DOCUMENT);
  const files = readTextFiles(REPO_ROOT);

  it('reads the shipped code of the repository', () => {
    // A guard that reads nothing would pass for the wrong reason.
    const paths = shippedSources(files).map((source) => source.path);
    expect(paths).toContain('platform/storage/src/memory-storage.ts');
    expect(paths.filter((path) => path.includes('/test/'))).toEqual([]);
    expect(paths.filter((path) => path.includes('node_modules/'))).toEqual([]);
  });

  it('has no row for the place of a device: no location, ever (CLAUDE.md), so shipped code that names it stays red', () => {
    const text = existsSync(target) ? readFileSync(target, 'utf8') : '';
    const rows = text.split('\n').filter((line) => /^\|\s*SE-/.test(line));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.filter((line) => /`geolocation`/.test(line))).toEqual([]);
    const found = sideEffectGuardProblems({
      files: [
        {
          path: 'platform/probe/src/where.ts',
          text: 'navigator.geolocation.getCurrentPosition(done);\n',
        },
      ],
      register: text,
    });
    expect(found.map((problem) => problem.message).join(' ')).toContain('`geolocation`');
  });

  it('has a well-formed register that names every side effect in the code', () => {
    const problems = sideEffectGuardProblems({
      files,
      register: existsSync(target) ? readFileSync(target, 'utf8') : undefined,
    });
    expect(problems.map(formatProblem)).toEqual([]);
  });
});

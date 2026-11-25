import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLATFORM_UNITS } from '@onestrand/core';
import { RESERVED_TABLE_NAMES } from '@onestrand/storage';
import { describe, expect, it } from 'vitest';
import { NAMES_PATH, namesProblems, packageNames, readNames, type UsedName } from '../src/names.ts';
import { formatProblem, readTextFiles, REPO_ROOT } from '../src/repo-files.ts';

/**
 * Every identifier stands in the name register, none twice (docs/architektur.md, 3.4; acceptance
 * of W0-01). The format and the rules are written down in `tools/src/names.ts`. A new identifier
 * is entered by the head in `registry/names.json` before the code uses it.
 */
describe('identifiers of the suite (registry/names.json)', () => {
  const file = join(REPO_ROOT, NAMES_PATH);
  const { entries, problems } = readNames(
    existsSync(file) ? readFileSync(file, 'utf8') : undefined,
  );
  const used: UsedName[] = [
    ...packageNames(readTextFiles(REPO_ROOT)),
    ...RESERVED_TABLE_NAMES.map((name) => ({
      kind: 'table' as const,
      name,
      path: 'platform/storage/src/tables.ts',
    })),
    ...PLATFORM_UNITS.ids.map((name) => ({
      kind: 'unit' as const,
      name,
      path: 'platform/core/src/units.ts',
    })),
  ];

  it('reads the identifiers the code uses', () => {
    // A guard that reads nothing would pass for the wrong reason.
    const names = used.map((entry) => `${entry.kind} ${entry.name}`);
    expect(names).toContain('package @onestrand/core');
    expect(names).toContain('table businesses');
    expect(names).toContain('unit m2');
  });

  it('has a register that is well formed', () => {
    expect(problems.map(formatProblem)).toEqual([]);
  });

  it('holds every identifier the code uses, and no active one the code has dropped', () => {
    if (entries === undefined) {
      throw new Error(`${NAMES_PATH} cannot be read, so no identifier can be judged.`);
    }
    expect(namesProblems(entries, used).map(formatProblem)).toEqual([]);
  });
});

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { industryFolders, loadIndustries } from '../src/industries.ts';
import { REPO_ROOT } from '../src/repo-files.ts';

/**
 * What the manifests of the industries promise and only the repository can show (suite ADR-0004;
 * CLAUDE.md, «Recht nur mit Quelle»). `defineIndustry` already refuses a rule set without a
 * source; whether the source stands where it says, it cannot see. Every industry of the
 * repository is read, so a new one is held to this the moment its directory is there.
 */
const FACTS = 'docs/fakten/';

const industries = await loadIndustries(REPO_ROOT);

describe('the industries of the repository', () => {
  it('are read, the reference industry among them, each with one manifest under its id', () => {
    // A guard that reads nothing would pass for the wrong reason.
    expect(industries.map(({ folder }) => folder.id)).toEqual(
      industryFolders(REPO_ROOT).map(({ id }) => id),
    );
    expect(industries.map(({ folder }) => folder.id)).toContain('muster');
    for (const { folder, manifest } of industries) {
      expect(manifest.id).toBe(folder.id);
    }
  });

  it('name for every rule set a source that stands under docs/fakten/', () => {
    const sources = industries.flatMap(({ folder, manifest }) =>
      manifest.ruleSets.map((ruleSet) => ({ industry: folder.id, ...ruleSet })),
    );
    expect(sources.length).toBeGreaterThan(0);
    for (const { industry, id, source } of sources) {
      const file = source.split('#')[0] ?? '';
      expect(file.startsWith(FACTS), `${industry}: ${id} names ${source}`).toBe(true);
      expect(existsSync(join(REPO_ROOT, file)), `${industry}: ${id} names ${source}`).toBe(true);
    }
  });
});

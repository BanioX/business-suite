import { describe, expect, it } from 'vitest';
import { manifestConformity, subjectFromEnvironment } from '../src/conformity.ts';

/**
 * The manifest of the industry: its entry exports exactly one manifest made by `defineIndustry`
 * under the id of its directory, `industryProblems` finds nothing, its package and its Vitest
 * project carry its names, and every rule set names a source that stands under docs/fakten/.
 * Run through `pnpm check:industry <id>` (tools/check-industry.mjs), which names the industry.
 */
const subject = await subjectFromEnvironment();

describe(`check:industry ${subject.id}: manifest`, () => {
  it('is made by defineIndustry under the id of its directory, without a problem, with real sources', async () => {
    const { problems, notes } = await manifestConformity(subject);
    for (const note of notes) {
      console.log(note);
    }
    expect(problems).toEqual([]);
  });
});

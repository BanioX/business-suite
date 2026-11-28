import { describe, expect, it } from 'vitest';
import { deviceFilterConformity, subjectFromEnvironment } from '../src/conformity.ts';

/**
 * The filter for other devices: every table of the industry names a registered function and,
 * where it has one, a registered right (`<id>TableAccess`, debt TD-70), and on the rows of the
 * demo business the filter of the platform gives each person only what the profile may see.
 * Run through `pnpm check:industry <id>` (tools/check-industry.mjs), which names the industry.
 */
const subject = await subjectFromEnvironment();

describe(`check:industry ${subject.id}: device-filter`, () => {
  it('names function and right of every table, and the rows go only where the profile may see them', async () => {
    const { problems, notes } = await deviceFilterConformity(subject);
    for (const note of notes) {
      console.log(note);
    }
    expect(problems).toEqual([]);
  });
});

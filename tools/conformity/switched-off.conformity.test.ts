import { describe, expect, it } from 'vitest';
import { switchedOffConformity, subjectFromEnvironment } from '../src/conformity.ts';

/**
 * «Switched off leaves no trace»: an operation of a function that is off is refused, also for the
 * owner, the rest goes on, and the rows stay, in the storage and in a backup; switched on again,
 * everything is there (rule 9 of platform/manifest/api.md).
 * Run through `pnpm check:industry <id>` (tools/check-industry.mjs), which names the industry.
 */
const subject = await subjectFromEnvironment();

describe(`check:industry ${subject.id}: switched-off`, () => {
  it('has no way in while a function is off, and its rows stay, in the backup too', async () => {
    const { problems, notes } = await switchedOffConformity(subject);
    for (const note of notes) {
      console.log(note);
    }
    expect(problems).toEqual([]);
  });
});

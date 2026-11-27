import { describe, expect, it } from 'vitest';
import { backupConformity, subjectFromEnvironment } from '../src/conformity.ts';

/**
 * The backup there and back: the demo business through a file in the format of the edition, onto
 * an empty device, and back as it was.
 * Run through `pnpm check:industry <id>` (tools/check-industry.mjs), which names the industry.
 */
const subject = await subjectFromEnvironment();

describe(`check:industry ${subject.id}: backup`, () => {
  it('brings the demo business there and back through a file, every table as it was', async () => {
    const { problems, notes } = await backupConformity(subject);
    for (const note of notes) {
      console.log(note);
    }
    expect(problems).toEqual([]);
  });
});

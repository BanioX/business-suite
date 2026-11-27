import { describe, expect, it } from 'vitest';
import { namesConformity, subjectFromEnvironment } from '../src/conformity.ts';

/**
 * Every identifier the industry sets for good stands in registry/names.json or is proposed in
 * industries/<id>/NAMES.md (the notes say which); `pnpm names` still wants the register before
 * the industry lands.
 * Run through `pnpm check:industry <id>` (tools/check-industry.mjs), which names the industry.
 */
const subject = await subjectFromEnvironment();

describe(`check:industry ${subject.id}: names`, () => {
  it('has every identifier in registry/names.json or proposed in its NAMES.md', () => {
    const { problems, notes } = namesConformity(subject);
    for (const note of notes) {
      console.log(note);
    }
    expect(problems).toEqual([]);
  });
});

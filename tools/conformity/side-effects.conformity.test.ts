import { describe, expect, it } from 'vitest';
import { sideEffectConformity, subjectFromEnvironment } from '../src/conformity.ts';

/**
 * No side effect without its row: every kind of side effect in the shipped code of the industry,
 * and every storage key with its prefix, stands in docs/nebenwirkungen.md.
 * Run through `pnpm check:industry <id>` (tools/check-industry.mjs), which names the industry.
 */
const subject = await subjectFromEnvironment();

describe(`check:industry ${subject.id}: side-effects`, () => {
  it('does nothing outside itself that docs/nebenwirkungen.md does not name', () => {
    const { problems, notes } = sideEffectConformity(subject);
    for (const note of notes) {
      console.log(note);
    }
    expect(problems).toEqual([]);
  });
});

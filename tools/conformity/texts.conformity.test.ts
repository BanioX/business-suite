import { describe, expect, it } from 'vitest';
import { textConformity, subjectFromEnvironment } from '../src/conformity.ts';

/**
 * The catalogue of the industry in de-CH: «du», «ss», no exclamation mark, no slogan, no emoji,
 * no name of a product of the suite and none of the listed names, and texts for its own ids only
 * (`DE_CH_TEXT_RULES` and `textProblems` of `@onestrand/testing`).
 * Run through `pnpm check:industry <id>` (tools/check-industry.mjs), which names the industry.
 */
const subject = await subjectFromEnvironment();

describe(`check:industry ${subject.id}: texts`, () => {
  it('follow the rules of de-CH, name no product and hold texts for the ids of the industry only', () => {
    const { problems, notes } = textConformity(subject);
    for (const note of notes) {
      console.log(note);
    }
    expect(problems).toEqual([]);
  });
});

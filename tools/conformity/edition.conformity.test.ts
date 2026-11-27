import { describe, expect, it } from 'vitest';
import { editionConformity, subjectFromEnvironment } from '../src/conformity.ts';

/**
 * An edition of the business module and the industry, under the frozen names of its id
 * (`<id>`, `<id>:`, `<id>-backup`, version 1), composes, and `editionProblems` finds nothing: no
 * missing text, no access without its function or right, a use case for every operation and
 * none too many, JSON schemas, namespaces (rule 10 of platform/manifest/api.md).
 * Run through `pnpm check:industry <id>` (tools/check-industry.mjs), which names the industry.
 */
const subject = await subjectFromEnvironment();

describe(`check:industry ${subject.id}: edition`, () => {
  it('composes with the business module of the platform, and editionProblems is []', () => {
    const { problems, notes } = editionConformity(subject);
    for (const note of notes) {
      console.log(note);
    }
    expect(problems).toEqual([]);
  });
});

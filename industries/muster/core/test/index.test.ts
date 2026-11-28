import { describe, expect, it } from 'vitest';
import * as muster from '../src';

/**
 * The public surface of the industry, name by name: what an edition and the generator of a new
 * industry (`pnpm industry:new`) read. A name that disappears or appears here is a decision, not
 * an accident. Types are not listed; `tsc` guards them where they are used.
 */
describe('@onestrand-industry/muster', () => {
  it('exports exactly these values', () => {
    // Both sides sorted: a new industry renames these names (`pnpm industry:new`), and the
    // renaming changes their alphabetical order, not the list.
    expect(Object.keys(muster).sort()).toEqual(
      [
        'CAPTURE_MODE',
        'ENTRIES_FEATURE',
        'EntrySchema',
        'JOURNAL_MODULE',
        'KEEPS_JOURNAL_QUESTION',
        'MUSTER',
        'MUSTER_DEMO_ENTRIES',
        'MUSTER_DEMO_LETTERHEAD',
        'MUSTER_EVENT_TYPES',
        'NEWEST_FIRST_OPTION',
        'RETENTION_SOURCE',
        'RIGHT_JOURNAL_READ',
        'STAFF_PROFILE',
        'STANDARD_KIND',
        'createMusterUseCases',
        'entriesTable',
        'layOutMusterDemo',
        'muster',
        'musterCatalog',
        'musterContract',
        'musterDemo',
        'musterRights',
        'musterRuleSets',
        'musterTableAccess',
        'musterTables',
        'musterTemplates',
      ].sort(),
    );
  });

  it('exports one manifest, made by defineIndustry under the id of the industry', () => {
    const manifests = Object.entries(muster).filter(
      ([, value]) => typeof value === 'object' && Object.hasOwn(value, 'kind'),
    );
    expect(manifests.map(([name]) => name)).toEqual(['muster']);
    expect(muster.muster.id).toBe(muster.MUSTER);
  });

  it('holds no text of the app: every text in its data is an id, a key, a path or a made-up name', () => {
    const texts: string[] = [];
    const collect = (value: unknown): void => {
      if (typeof value === 'string') {
        texts.push(value);
      } else if (Array.isArray(value)) {
        value.forEach(collect);
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, child]) => {
          texts.push(key);
          collect(child);
        });
      }
    };
    collect([
      muster.musterCatalog,
      muster.musterRights,
      muster.musterTemplates,
      muster.musterRuleSets,
      muster.musterDemo,
      muster.musterTableAccess,
      muster.MUSTER_EVENT_TYPES,
      muster.MUSTER_DEMO_ENTRIES,
      muster.MUSTER_DEMO_LETTERHEAD,
      muster.RETENTION_SOURCE,
    ]);
    expect(texts.length).toBeGreaterThan(40);
    const id = /^[a-z][a-zA-Z0-9]*(?:[._][a-z0-9]+)*$/;
    const path = /^docs\/fakten\/[a-z-]+\.md$/;
    // The demo has made-up names only, in the style of «Betrieb Muster», and a postcode.
    const madeUp =
      /^(?:Betrieb|Person|Eintrag) (?:Muster|Beispiel)$|^Musterweg \d+$|^Beispielstadt$|^\d{4}$|^CH$/;
    for (const text of texts) {
      expect(id.test(text) || path.test(text) || madeUp.test(text), text).toBe(true);
    }
  });
});

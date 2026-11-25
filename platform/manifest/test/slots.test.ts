import { OWNER_PROFILE } from '@onestrand/access';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  SLOT_IDS,
  SLOT_PAGES,
  availableSlotEntries,
  composeEdition,
  type SectionSlotEntry,
  type SlotEntries,
  type SlotEntry,
} from '../src';
import { alphaIndustry, custom, sampleEdition } from './support';

const composed = composeEdition(sampleEdition([alphaIndustry]));
const features = composed.features.resolve(['alpha.visits']).features;
const core = composed.features.resolve([]).features;

/** What a made-up industry would put in its slots. */
const slots = {
  routes: [{ id: 'alpha.visits_page', feature: 'alpha.visits' }],
  navigation: [
    { id: 'alpha.visits_nav', feature: 'alpha.visits' },
    { id: 'alpha.notes_nav', feature: 'notes', level: 'operate' },
  ],
  sections: [{ id: 'alpha.visits_section', feature: 'alpha.visits', page: 'customers' }],
} as const satisfies SlotEntries;

describe('the slots', () => {
  it('names every slot of the shell and the pages that take sections', () => {
    expect(SLOT_IDS).toEqual([
      'routes',
      'navigation',
      'capture',
      'today',
      'sections',
      'lines',
      'documents',
      'workplaces',
      'reminders',
      'monthly_package',
    ]);
    expect(SLOT_PAGES).toEqual([
      'customers',
      'sites',
      'jobs',
      'visits',
      'reports',
      'invoices',
      'today',
      'setup',
      'monthly_package',
    ]);
  });

  it('has entries that say their function and level, and sections that say their page', () => {
    expectTypeOf<SectionSlotEntry>().toExtend<SlotEntry>();
    expectTypeOf<SlotEntries['sections']>().toEqualTypeOf<
      readonly SectionSlotEntry[] | undefined
    >();
    expectTypeOf<SlotEntries['routes']>().toEqualTypeOf<readonly SlotEntry[] | undefined>();
    const probe = () => {
      // @ts-expect-error an unknown slot
      const wrong: SlotEntries = { menu: [] };
      // @ts-expect-error a section needs the page it belongs to
      const noPage: SlotEntries = { sections: [{ id: 'alpha.s', feature: 'alpha.visits' }] };
      // @ts-expect-error an entry needs the function it belongs to
      const noFeature: SlotEntries = { routes: [{ id: 'alpha.r' }] };
      // @ts-expect-error a page the platform does not have
      const wrongPage: SlotEntries = { sections: [{ id: 'alpha.s', feature: 'x', page: 'menu' }] };
      return [wrong, noPage, noFeature, wrongPage];
    };
    expectTypeOf(probe).toBeFunction();
  });
});

describe('availableSlotEntries', () => {
  const owner = { profile: OWNER_PROFILE, features };

  it('shows an entry while its function is on and the profile reaches the level', () => {
    expect(availableSlotEntries(slots.navigation, owner).map((entry) => entry.id)).toEqual([
      'alpha.visits_nav',
      'alpha.notes_nav',
    ]);
    const viewer = { profile: custom({ 'alpha.visits': 'view', notes: 'view' }), features };
    expect(availableSlotEntries(slots.navigation, viewer).map((entry) => entry.id)).toEqual([
      'alpha.visits_nav',
    ]);
  });

  it('has no entry for a function that is switched off, not even for the owner', () => {
    const off = { profile: OWNER_PROFILE, features: core };
    expect(availableSlotEntries(slots.routes, off)).toEqual([]);
    expect(availableSlotEntries(slots.navigation, off)).toEqual([]);
    expect(availableSlotEntries(slots.sections, off)).toEqual([]);
  });

  it('has no entry for a person without a level, and keeps the type of the entries', () => {
    const nobody = { profile: custom(), features };
    expect(availableSlotEntries(slots.routes, nobody)).toEqual([]);
    const sections = availableSlotEntries(slots.sections, owner);
    expectTypeOf(sections).toEqualTypeOf<
      {
        readonly id: 'alpha.visits_section';
        readonly feature: 'alpha.visits';
        readonly page: 'customers';
      }[]
    >();
    expect(sections.map((entry) => entry.page)).toEqual(['customers']);
    expect(availableSlotEntries([], owner)).toEqual([]);
  });
});

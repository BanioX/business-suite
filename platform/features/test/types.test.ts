import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  createFeatureRegistry,
  type Extent,
  type FeatureEntries,
  type FeatureRegistry,
  type SwitchResult,
} from '../src';
import { PLATFORM, REGISTRY } from './support';

/** Types are checked by `tsc`, not by Vitest: these lines fail the typecheck, not the run. */
describe('the types of the register', () => {
  it('know the ids of the features that were entered, and widen them on extend', () => {
    expectTypeOf(PLATFORM.ids[0]).toEqualTypeOf<
      | 'today'
      | 'data'
      | 'customers'
      | 'jobs'
      | 'invoicing'
      | 'team'
      | 'time_clock'
      | 'payroll_export'
      | 'roster'
      | undefined
    >();
    expectTypeOf<'muster.visits'>().toExtend<(typeof REGISTRY.ids)[number]>();
    expectTypeOf<'muster.visits'>().not.toExtend<(typeof PLATFORM.ids)[number]>();
    expect(REGISTRY.ids).toContain('muster.visits');
  });

  it('give results that carry the ids', () => {
    const result = REGISTRY.switchFeature([], 'jobs', true);
    expectTypeOf(result).toEqualTypeOf<SwitchResult<(typeof REGISTRY.ids)[number]>>();
    expectTypeOf(REGISTRY.extentOf).returns.toEqualTypeOf<Extent | 'custom'>();
    expectTypeOf(REGISTRY).toExtend<FeatureRegistry>();
  });

  it('refuse entries that are wrong by type', () => {
    // A core flag that is no boolean.
    // @ts-expect-error core must be a boolean
    const wrongCore: FeatureEntries = { features: [{ id: 'a', group: 'g', core: 'yes' }] };
    // An availability the register does not know.
    const wrongAvailability: FeatureEntries = {
      // @ts-expect-error availability knows one value
      features: [{ id: 'a', group: 'g', availability: 'later' }],
    };
    // An option type that does not exist.
    const wrongType: FeatureEntries = {
      // @ts-expect-error no such option type
      features: [{ id: 'a', group: 'g', options: [{ key: 'k', type: 'color', default: 'red' }] }],
    };
    expect([wrongCore, wrongAvailability, wrongType]).toHaveLength(3);
    expect(createFeatureRegistry({}).ids).toEqual([]);
  });
});

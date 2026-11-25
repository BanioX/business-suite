import { describe, expect, it } from 'vitest';
import { FeatureError, createFeatureRegistry } from '../src';
import { CORE, PLATFORM, REGISTRY, ids } from './support';

/** The code of the error a call throws. */
function codeOf(call: () => unknown): string | undefined {
  try {
    call();
  } catch (error) {
    return error instanceof FeatureError ? error.code : 'not a FeatureError';
  }
  return undefined;
}

describe('a register', () => {
  it('holds the entries in the order they were entered', () => {
    expect(PLATFORM.ids).toEqual([
      'today',
      'data',
      'customers',
      'jobs',
      'invoicing',
      'team',
      'time_clock',
      'payroll_export',
      'roster',
    ]);
    expect(REGISTRY.ids.slice(-2)).toEqual(['muster.visits', 'muster.passes']);
    expect(REGISTRY.industries.map((industry) => industry.id)).toEqual(['muster']);
    expect(REGISTRY.groups.map((group) => group.id)).toEqual([
      'core',
      'work',
      'time',
      'muster.counter',
    ]);
    expect(REGISTRY.kinds.map((kind) => kind.id)).toEqual(['muster.standard', 'muster.small']);
    expect(REGISTRY.questions.map((question) => question.id)).toEqual([
      'team_size',
      'time_tracking',
      'muster.passes_wanted',
    ]);
    expect(REGISTRY.deviceModes.map((mode) => mode.id)).toEqual(['muster.counter']);
  });

  it('holds no feature when it is built from nothing', () => {
    const empty = createFeatureRegistry({});
    expect(empty.ids).toEqual([]);
    expect(empty.resolve(['a'])).toEqual({ features: [], unknown: ['a'] });
  });

  it('fills in every default of a feature', () => {
    expect(PLATFORM.get('customers')).toEqual({
      id: 'customers',
      group: 'work',
      core: false,
      requires: [],
      options: [],
      availability: 'available',
    });
    expect(PLATFORM.get('today').core).toBe(true);
  });

  it('is frozen, down to its lists and its entries', () => {
    expect(Object.isFrozen(REGISTRY)).toBe(true);
    expect(Object.isFrozen(REGISTRY.ids)).toBe(true);
    expect(Object.isFrozen(REGISTRY.features)).toBe(true);
    expect(Object.isFrozen(REGISTRY.get('time_clock'))).toBe(true);
    expect(Object.isFrozen(REGISTRY.get('time_clock').requires)).toBe(true);
    expect(Object.isFrozen(REGISTRY.get('time_clock').options)).toBe(true);
    expect(Object.isFrozen(REGISTRY.get('time_clock').options[1]?.values)).toBe(true);
    expect(Object.isFrozen(REGISTRY.get('time_clock').options[7]?.default)).toBe(true);
    expect(Object.isFrozen(REGISTRY.questions[0]?.answers[0])).toBe(true);
    expect(Object.isFrozen(REGISTRY.deviceModes)).toBe(true);
  });

  it('does not change when entries are changed after the fact', () => {
    const features = [{ id: 'a', group: 'g' }];
    const kept = createFeatureRegistry({ groups: [{ id: 'g' }], features });
    features.push({ id: 'b', group: 'g' });
    expect(kept.ids).toEqual(['a']);
  });

  it('knows its features by id, and refuses to give one it does not know', () => {
    expect(REGISTRY.has('jobs')).toBe(true);
    expect(REGISTRY.has('muster.visits')).toBe(true);
    expect(REGISTRY.has('nowhere')).toBe(false);
    expect(REGISTRY.has('constructor')).toBe(false);
    expect(codeOf(() => REGISTRY.get('nowhere'))).toBe('unknown_feature');
    expect(codeOf(() => REGISTRY.get('constructor'))).toBe('unknown_feature');
  });

  it('lists the features of a group', () => {
    expect(REGISTRY.featuresOfGroup('time')).toEqual([
      'team',
      'time_clock',
      'payroll_export',
      'roster',
    ]);
    expect(REGISTRY.featuresOfGroup('muster.counter')).toEqual(['muster.visits', 'muster.passes']);
    expect(REGISTRY.featuresOfGroup('nowhere')).toEqual([]);
  });

  it('is extended into a new register and leaves the old one as it was', () => {
    expect(PLATFORM.has('muster.visits')).toBe(false);
    expect(REGISTRY.has('muster.visits')).toBe(true);
    expect(PLATFORM.ids).toHaveLength(9);
    const more = REGISTRY.extend({
      groups: [{ id: 'extra' }],
      features: [{ id: 'reports', group: 'extra', requires: ['jobs'] }],
    });
    expect(more.ids.at(-1)).toBe('reports');
    expect(REGISTRY.has('reports')).toBe(false);
  });

  it('counts a feature entered by an industry as that industry’s, never the platform’s', () => {
    expect(REGISTRY.ids.filter((id) => !id.includes('.'))).toEqual(PLATFORM.ids);
  });
});

describe('what a list of features means', () => {
  it('always has the core, also for an empty list', () => {
    expect(REGISTRY.resolve([]).features).toEqual(CORE);
  });

  it('adds what a feature needs through every step, in the order of the register', () => {
    expect(REGISTRY.resolve(['invoicing']).features).toEqual(
      ids('today data customers jobs invoicing'),
    );
    expect(REGISTRY.resolve(['payroll_export']).features).toEqual(
      ids('today data team time_clock payroll_export'),
    );
    expect(REGISTRY.resolve(['roster', 'muster.passes', 'customers']).features).toEqual(
      ids('today data customers team roster muster.visits muster.passes'),
    );
  });

  it('is the same for any order and any repeat of the list', () => {
    const one = REGISTRY.resolve(['roster', 'jobs', 'roster']);
    const other = REGISTRY.resolve(['jobs', 'roster']);
    expect(one).toEqual(other);
  });

  it('is idempotent: what it returns it returns again', () => {
    const first = REGISTRY.resolve(['invoicing', 'payroll_export']);
    expect(REGISTRY.resolve(first.features)).toEqual(first);
  });

  it('hands back ids it does not know, each once and in the order met', () => {
    const resolved = REGISTRY.resolve(['x.later', 'jobs', 'y', 'x.later']);
    expect(resolved.features).toEqual(ids('today data customers jobs'));
    expect(resolved.unknown).toEqual(['x.later', 'y']);
  });

  it('takes any iterable', () => {
    expect(REGISTRY.resolve(new Set(['jobs'])).features).toEqual(ids('today data customers jobs'));
  });

  it('says whether a feature is on; a core feature always is', () => {
    expect(REGISTRY.isOn([], 'today')).toBe(true);
    expect(REGISTRY.isOn(['invoicing'], 'jobs')).toBe(true);
    expect(REGISTRY.isOn(['jobs'], 'invoicing')).toBe(false);
    expect(REGISTRY.isOn(['jobs'], 'nowhere')).toBe(false);
  });
});

describe('what a feature needs and what needs it', () => {
  it('lists what switching a feature on brings along, through every step', () => {
    expect(REGISTRY.requiredFor('invoicing')).toEqual(['customers', 'jobs']);
    expect(REGISTRY.requiredFor('payroll_export')).toEqual(['team', 'time_clock']);
    expect(REGISTRY.requiredFor('customers')).toEqual([]);
    expect(REGISTRY.requiredFor('data')).toEqual(['today']);
    expect(REGISTRY.requiredFor('muster.passes')).toEqual(['customers', 'muster.visits']);
  });

  it('lists what switching a feature off takes along, through every step', () => {
    expect(REGISTRY.dependentsOf('customers')).toEqual([
      'jobs',
      'invoicing',
      'muster.visits',
      'muster.passes',
    ]);
    expect(REGISTRY.dependentsOf('team')).toEqual(['time_clock', 'payroll_export', 'roster']);
    expect(REGISTRY.dependentsOf('invoicing')).toEqual([]);
    expect(REGISTRY.dependentsOf('today')).toEqual(['data']);
  });

  it('refuses a feature it does not know', () => {
    expect(codeOf(() => REGISTRY.requiredFor('nowhere'))).toBe('unknown_feature');
    expect(codeOf(() => REGISTRY.dependentsOf('nowhere'))).toBe('unknown_feature');
  });
});

describe('switching one feature', () => {
  it('on brings what it needs and says what came on', () => {
    const result = REGISTRY.switchFeature(['customers'], 'invoicing', true);
    expect(result.features).toEqual(ids('today data customers jobs invoicing'));
    expect(result.turnedOn).toEqual(['jobs', 'invoicing']);
    expect(result.turnedOff).toEqual([]);
  });

  it('on for a feature that is on changes nothing', () => {
    const result = REGISTRY.switchFeature(['customers', 'jobs'], 'jobs', true);
    expect(result.features).toEqual(ids('today data customers jobs'));
    expect(result.turnedOn).toEqual([]);
    expect(result.turnedOff).toEqual([]);
  });

  it('off takes along everything that needs it, through every step, and nothing else', () => {
    const start = ['customers', 'jobs', 'invoicing', 'team', 'time_clock'];
    const result = REGISTRY.switchFeature(start, 'jobs', false);
    expect(result.features).toEqual(ids('today data customers team time_clock'));
    expect(result.turnedOff).toEqual(['jobs', 'invoicing']);
    expect(result.turnedOn).toEqual([]);
  });

  it('off for a feature that is off changes nothing', () => {
    const result = REGISTRY.switchFeature(['customers'], 'jobs', false);
    expect(result.features).toEqual(ids('today data customers'));
    expect(result.turnedOff).toEqual([]);
  });

  it('first completes a list that is not closed, so on and off work from the true state', () => {
    // `jobs` without `customers`, as an older version could have written it.
    const result = REGISTRY.switchFeature(['jobs'], 'team', true);
    expect(result.features).toEqual(ids('today data customers jobs team'));
    // What was missing is part of the state the switch starts from, so only 	eam is new.
    expect(result.turnedOn).toEqual(['team']);
  });

  it('keeps the ids it does not know in the result, for the person to write back', () => {
    const result = REGISTRY.switchFeature(['later.thing', 'jobs'], 'jobs', false);
    expect(result.features).toEqual(ids('today data customers'));
    expect(result.unknown).toEqual(['later.thing']);
  });

  it('refuses a feature of the core, and one it does not know', () => {
    expect(codeOf(() => REGISTRY.switchFeature([], 'today', false))).toBe('core_feature');
    expect(codeOf(() => REGISTRY.switchFeature([], 'data', true))).toBe('core_feature');
    expect(codeOf(() => REGISTRY.switchFeature([], 'nowhere', true))).toBe('unknown_feature');
  });

  it('gives frozen results', () => {
    const result = REGISTRY.switchFeature([], 'jobs', true);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.features)).toBe(true);
    expect(Object.isFrozen(result.turnedOn)).toBe(true);
    expect(Object.isFrozen(result.turnedOff)).toBe(true);
    expect(Object.isFrozen(result.unknown)).toBe(true);
  });
});

describe('device modes', () => {
  it('always offer «normal», first', () => {
    expect(REGISTRY.deviceModesFor([])).toEqual(['normal']);
  });

  it('offer a mode only while its feature is on', () => {
    expect(REGISTRY.deviceModesFor(['jobs'])).toEqual(['normal']);
    expect(REGISTRY.deviceModesFor(['muster.visits'])).toEqual(['normal', 'muster.counter']);
    expect(REGISTRY.deviceModesFor(['muster.passes'])).toEqual(['normal', 'muster.counter']);
  });

  it('are none beyond «normal» in a register that entered none', () => {
    expect(PLATFORM.deviceModesFor(['jobs', 'team'])).toEqual(['normal']);
  });
});

describe('the core and the feature field availability', () => {
  it('every core feature is available and needs only the core', () => {
    const core = REGISTRY.features.filter((feature) => feature.core);
    expect(core.map((feature) => feature.id)).toEqual(CORE);
    for (const feature of core) {
      expect(feature.availability).toBe('available');
      expect(feature.requires.every((id) => REGISTRY.get(id).core)).toBe(true);
    }
  });

  it('every feature of the register is available today', () => {
    expect(REGISTRY.features.map((feature) => feature.availability)).toEqual(
      REGISTRY.features.map(() => 'available'),
    );
  });

  it('is in every list of features, however the list was made', () => {
    for (const list of [[], ['jobs'], ['nowhere'], REGISTRY.ids]) {
      expect(REGISTRY.resolve(list).features).toEqual(expect.arrayContaining([...CORE]));
    }
  });
});

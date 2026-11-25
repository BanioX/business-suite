import { describe, expect, it } from 'vitest';
import {
  FEATURE_PROBLEM_CODES,
  FeatureError,
  createFeatureRegistry,
  featureEntryProblems,
  namespaceOf,
  type FeatureEntries,
  type FeatureProblem,
  type FeatureRegistry,
} from '../src';
import { INDUSTRY_ENTRIES, PLATFORM, PLATFORM_ENTRIES, REGISTRY } from './support';

/** The problems as `code level id`, in the order found. */
function found(entries: unknown, base: FeatureRegistry = PLATFORM): string[] {
  return featureEntryProblems(entries, base).map(
    (problem) => `${problem.code} ${problem.level} ${problem.id}`,
  );
}

/** An industry with its group and nothing else, plus what the test enters. */
function industry(change: Record<string, unknown>): unknown {
  return { industries: [{ id: 'muster' }], groups: [{ id: 'muster.counter' }], ...change };
}

describe('entries that are well formed', () => {
  it('have no problem', () => {
    expect(featureEntryProblems(PLATFORM_ENTRIES)).toEqual([]);
    expect(found(INDUSTRY_ENTRIES)).toEqual([]);
    expect(found({})).toEqual([]);
  });

  it('can be checked on their own against nothing', () => {
    expect(
      featureEntryProblems({ groups: [{ id: 'work' }], features: [{ id: 'jobs', group: 'work' }] }),
    ).toEqual([]);
  });

  it('know the namespace of an id', () => {
    expect(namespaceOf('facility.keys')).toBe('facility');
    expect(namespaceOf('customers')).toBeUndefined();
  });
});

describe('the form of the entries', () => {
  it.each([
    ['not an object', 3, 'invalid_entry feature ?'],
    ['null', null, 'invalid_entry feature ?'],
    ['a list', [], 'invalid_entry feature ?'],
    ['with an unknown part', { feature: [] }, 'invalid_entry feature ?'],
    ['with a part that is no list', { features: {} }, 'invalid_entry feature ?'],
  ])('refuses entries %s', (_what, entries, problem) => {
    expect(found(entries)).toEqual([problem]);
  });

  it.each([
    ['industry', 'industries', 3, 'invalid_entry industry ?'],
    ['group', 'groups', null, 'invalid_entry group ?'],
    ['feature', 'features', 'jobs', 'invalid_entry feature ?'],
    ['kind', 'kinds', [], 'invalid_entry kind ?'],
    ['question', 'questions', 1, 'invalid_entry question ?'],
    ['device mode', 'deviceModes', true, 'invalid_entry device_mode ?'],
  ])('refuses a %s that is no object', (_level, part, entry, problem) => {
    expect(found({ [part]: [entry] })).toEqual([problem]);
  });

  it.each([
    ['industry', 'industries', { id: 'muster', note: 1 }, 'invalid_entry industry muster'],
    ['group', 'groups', { id: 'work2', note: 1 }, 'invalid_entry group work2'],
    ['feature', 'features', { id: 'jobs2', group: 'work', note: 1 }, 'invalid_entry feature jobs2'],
    ['kind', 'kinds', { id: 'muster.k', note: 1 }, 'invalid_entry kind muster.k'],
    [
      'question',
      'questions',
      { id: 'q', answers: [{ id: 'a' }], note: 1 },
      'invalid_entry question q',
    ],
    [
      'device mode',
      'deviceModes',
      { id: 'mode', feature: 'jobs', note: 1 },
      'invalid_entry device_mode mode',
    ],
  ])('refuses a %s with a field it does not have', (_level, part, entry, problem) => {
    expect(found({ industries: [{ id: 'muster' }], [part]: [entry] })).toContain(problem);
  });

  it.each([
    ['', 'an empty id'],
    ['Jobs', 'an upper-case start'],
    ['job-list', 'a hyphen'],
    ['job_list_', 'an underscore at the end'],
    ['a.b.c', 'three segments'],
    ['jobs.', 'a dot at the end'],
  ])('refuses the feature id «%s» (%s)', (id) => {
    expect(found({ features: [{ id, group: 'work' }] })).toEqual(['invalid_entry feature ?']);
  });

  it('refuses an industry id that is not a word, and a missing id', () => {
    expect(found({ industries: [{ id: 'a.b' }] })).toEqual(['invalid_entry industry ?']);
    expect(found({ industries: [{}] })).toEqual(['invalid_entry industry ?']);
  });

  it('refuses a feature without a group of the right form, and a core that is no boolean', () => {
    expect(found({ features: [{ id: 'x' }] })).toEqual([
      'invalid_entry feature x',
      'unknown_reference feature x',
    ]);
    expect(found({ features: [{ id: 'x', group: 'work', core: 'yes' }] })).toEqual([
      'invalid_entry feature x',
    ]);
  });

  it('refuses requires that is no list, an id of the wrong form and a repeat', () => {
    expect(found({ features: [{ id: 'x', group: 'work', requires: 'jobs' }] })).toEqual([
      'invalid_entry feature x',
    ]);
    expect(found({ features: [{ id: 'x', group: 'work', requires: ['Jobs', 3] }] })).toEqual([
      'invalid_entry feature x',
      'invalid_entry feature x',
    ]);
    expect(found({ features: [{ id: 'x', group: 'work', requires: ['jobs', 'jobs'] }] })).toEqual([
      'invalid_entry feature x',
    ]);
  });

  it('refuses options that are no list', () => {
    expect(found({ features: [{ id: 'x', group: 'work', options: {} }] })).toEqual([
      'invalid_entry feature x',
    ]);
  });

  it('names what is wrong in words that tell the person what to do', () => {
    const [problem] = featureEntryProblems({ features: [{ id: 'Jobs', group: 'work' }] }, PLATFORM);
    expect(problem?.message).toBe(
      'the id must be one or two segments of lower-case words joined by a dot, got «Jobs»',
    );
  });

  it('describes a wrong value by its kind, not by its content', () => {
    const messages = (entries: unknown) =>
      featureEntryProblems(entries, PLATFORM).map((problem) => problem.message);
    expect(messages({ features: [{ id: 'x', group: 'work', core: 3 }] })).toEqual([
      'core must be true or false, got 3',
    ]);
    expect(messages({ features: [{ id: 'x', group: 'work', core: null }] })).toEqual([
      'core must be true or false, got null',
    ]);
    expect(messages({ features: [{ id: 'x', group: 'work', core: [] }] })).toEqual([
      'core must be true or false, got a list',
    ]);
    expect(messages({ features: [{ id: 'x', group: 'work', core: {} }] })).toEqual([
      'core must be true or false, got an object',
    ]);
    expect(messages({ features: [{ id: 'x', group: 'work', core: 'yes' }] })).toEqual([
      'core must be true or false, got «yes»',
    ]);
    expect(messages({ features: [{ id: 'x', group: 'work', core: Symbol('s') }] })).toEqual([
      'core must be true or false, got a symbol',
    ]);
  });
});

describe('duplicate ids', () => {
  it.each([
    [
      'industry',
      { industries: [{ id: 'muster' }, { id: 'muster' }] },
      'duplicate_id industry muster',
    ],
    ['group', { groups: [{ id: 'work' }] }, 'duplicate_id group work'],
    ['feature', { features: [{ id: 'jobs', group: 'work' }] }, 'duplicate_id feature jobs'],
    [
      'question',
      { questions: [{ id: 'team_size', answers: [{ id: 'a' }] }] },
      'duplicate_id question team_size',
    ],
  ])(
    'finds a %s entered twice, also against the register it is added to',
    (_level, entries, problem) => {
      expect(found(entries)).toEqual([problem]);
    },
  );

  it('finds a kind and a device mode entered twice', () => {
    expect(found(industry({ kinds: [{ id: 'muster.small' }, { id: 'muster.small' }] }))).toEqual([
      'duplicate_id kind muster.small',
    ]);
    expect(
      found(
        industry({
          deviceModes: [
            { id: 'muster.counter', feature: 'customers' },
            { id: 'muster.counter', feature: 'customers' },
          ],
        }),
      ),
    ).toEqual(['duplicate_id device_mode muster.counter']);
  });

  it('lets one id stand on different levels', () => {
    expect(
      found({
        groups: [{ id: 'customers' }],
        features: [{ id: 'customers_too', group: 'customers' }],
      }),
    ).toEqual([]);
  });

  it('refuses a feature of the same id as one of an earlier extension', () => {
    expect(() => REGISTRY.extend({ features: [{ id: 'muster.visits', group: 'work' }] })).toThrow(
      FeatureError,
    );
  });
});

describe('references', () => {
  it('refuses a group, a requirement, a kind, an answer and a mode that lead nowhere', () => {
    expect(found({ features: [{ id: 'x', group: 'nowhere' }] })).toEqual([
      'unknown_reference feature x',
    ]);
    expect(found({ features: [{ id: 'x', group: 'work', requires: ['nowhere'] }] })).toEqual([
      'unknown_reference feature x',
    ]);
    expect(found(industry({ kinds: [{ id: 'muster.k', on: ['nowhere'] }] }))).toEqual([
      'unknown_reference kind muster.k',
    ]);
    expect(
      found({ questions: [{ id: 'q', answers: [{ id: 'a', enable: ['nowhere'] }] }] }),
    ).toEqual(['unknown_reference question q']);
    expect(
      found({ questions: [{ id: 'q', answers: [{ id: 'a', disable: ['nowhere'] }] }] }),
    ).toEqual(['unknown_reference question q']);
    expect(found(industry({ deviceModes: [{ id: 'muster.m', feature: 'nowhere' }] }))).toEqual([
      'unknown_reference device_mode muster.m',
    ]);
  });

  it('refuses a question for a kind that is not registered', () => {
    expect(
      found(
        industry({
          questions: [{ id: 'muster.q', kinds: ['muster.nowhere'], answers: [{ id: 'a' }] }],
        }),
      ),
    ).toEqual(['unknown_reference question muster.q']);
  });

  it('refuses a namespace whose industry is not registered', () => {
    expect(found({ groups: [{ id: 'other.group' }] })).toEqual([
      'unknown_reference group other.group',
    ]);
    expect(found({ kinds: [{ id: 'other.kind' }] })).toEqual(['unknown_reference kind other.kind']);
    expect(found({ questions: [{ id: 'other.q', answers: [{ id: 'a' }] }] })).toEqual([
      'unknown_reference question other.q',
    ]);
    expect(found({ deviceModes: [{ id: 'other.m', feature: 'jobs' }] })).toEqual([
      'unknown_reference device_mode other.m',
    ]);
    expect(found({ groups: [{ id: 'x.g' }], features: [{ id: 'x.f', group: 'x.g' }] })).toEqual([
      'unknown_reference group x.g',
      'unknown_reference feature x.f',
    ]);
  });

  it('refuses a kind without a namespace', () => {
    expect(found({ kinds: [{ id: 'standard' }] })).toEqual(['invalid_entry kind standard']);
  });

  it('refuses the mode «normal»: every register has it', () => {
    expect(found({ deviceModes: [{ id: 'normal', feature: 'jobs' }] })).toEqual([
      'invalid_entry device_mode normal',
    ]);
  });
});

describe('cycles', () => {
  it('finds a feature that needs itself', () => {
    expect(found({ features: [{ id: 'x', group: 'work', requires: ['x'] }] })).toEqual([
      'requires_cycle feature x',
    ]);
  });

  it('finds every feature on a cycle and none that only leads to one', () => {
    expect(
      found({
        features: [
          { id: 'a', group: 'work', requires: ['b'] },
          { id: 'b', group: 'work', requires: ['c'] },
          { id: 'c', group: 'work', requires: ['a'] },
          { id: 'd', group: 'work', requires: ['a'] },
          { id: 'e', group: 'work', requires: ['d', 'jobs'] },
        ],
      }),
    ).toEqual(['requires_cycle feature a', 'requires_cycle feature b', 'requires_cycle feature c']);
  });

  it('accepts a diamond: two paths to one base are no cycle', () => {
    expect(
      found({
        features: [
          { id: 'a', group: 'work', requires: ['customers'] },
          { id: 'b', group: 'work', requires: ['customers'] },
          { id: 'c', group: 'work', requires: ['a', 'b'] },
        ],
      }),
    ).toEqual([]);
  });
});

describe('namespaces', () => {
  it('refuses a feature of an industry in a group of the platform, and the other way round', () => {
    expect(found(industry({ features: [{ id: 'muster.x', group: 'work' }] }))).toEqual([
      'wrong_namespace feature muster.x',
    ]);
    expect(found(industry({ features: [{ id: 'x', group: 'muster.counter' }] }))).toEqual([
      'wrong_namespace feature x',
    ]);
  });

  it('refuses a feature in the group of another industry', () => {
    expect(
      found({
        industries: [{ id: 'one' }, { id: 'two' }],
        groups: [{ id: 'one.g' }],
        features: [{ id: 'two.f', group: 'one.g' }],
      }),
    ).toEqual(['wrong_namespace feature two.f']);
  });

  it('refuses entries of an industry that name something of another industry', () => {
    const base = REGISTRY.extend({
      industries: [{ id: 'other' }],
      groups: [{ id: 'other.group' }],
      features: [{ id: 'other.thing', group: 'other.group' }],
      kinds: [{ id: 'other.kind' }],
    });
    expect(
      found(
        {
          features: [{ id: 'muster.x', group: 'muster.counter', requires: ['other.thing'] }],
          kinds: [{ id: 'muster.k', on: ['other.thing'] }],
          questions: [
            {
              id: 'muster.q',
              kinds: ['other.kind'],
              answers: [
                { id: 'a', enable: ['other.thing'] },
                { id: 'b', disable: ['other.thing'] },
              ],
            },
          ],
          deviceModes: [{ id: 'muster.m', feature: 'other.thing' }],
        },
        base,
      ),
    ).toEqual([
      'foreign_dependency feature muster.x',
      'foreign_dependency kind muster.k',
      'foreign_dependency question muster.q',
      'foreign_dependency question muster.q',
      'foreign_dependency question muster.q',
      'foreign_dependency device_mode muster.m',
    ]);
  });

  it('refuses entries of the platform that name something of an industry', () => {
    expect(
      found(
        {
          features: [{ id: 'x', group: 'work', requires: ['muster.visits'] }],
          questions: [{ id: 'q', kinds: ['muster.small'], answers: [{ id: 'a' }] }],
          deviceModes: [{ id: 'mode', feature: 'muster.visits' }],
        },
        REGISTRY,
      ),
    ).toEqual([
      'foreign_dependency feature x',
      'foreign_dependency question q',
      'foreign_dependency device_mode mode',
    ]);
  });

  it('lets an industry use the platform and itself', () => {
    expect(
      found({
        ...INDUSTRY_ENTRIES,
        features: [
          ...INDUSTRY_ENTRIES.features,
          { id: 'muster.a', group: 'muster.counter', requires: ['jobs', 'muster.visits'] },
        ],
      }),
    ).toEqual([]);
  });
});

describe('the core', () => {
  it('lets a core feature need core features only', () => {
    expect(
      found({ features: [{ id: 'x', group: 'work', core: true, requires: ['customers'] }] }),
    ).toEqual(['invalid_core feature x']);
    expect(
      found({ features: [{ id: 'x', group: 'core', core: true, requires: ['today'] }] }),
    ).toEqual([]);
  });

  it('refuses an answer that would switch off a core feature', () => {
    expect(found({ questions: [{ id: 'q', answers: [{ id: 'a', disable: ['today'] }] }] })).toEqual(
      ['invalid_core question q'],
    );
  });

  it('lets an answer or a kind name a core feature to switch on', () => {
    expect(found({ questions: [{ id: 'q', answers: [{ id: 'a', enable: ['today'] }] }] })).toEqual(
      [],
    );
  });
});

describe('availability', () => {
  it('knows one value, and takes it as the default', () => {
    expect(found({ features: [{ id: 'x', group: 'work', availability: 'available' }] })).toEqual(
      [],
    );
    expect(
      createFeatureRegistry({
        groups: [{ id: 'g' }],
        features: [{ id: 'x', group: 'g' }],
      }).get('x').availability,
    ).toBe('available');
  });

  it.each([['unavailable'], ['later'], [''], [true], [null]])(
    'refuses the value %s, for a core feature as well',
    (availability) => {
      expect(found({ features: [{ id: 'x', group: 'work', availability }] })).toEqual([
        'invalid_availability feature x',
      ]);
      expect(found({ features: [{ id: 'y', group: 'core', core: true, availability }] })).toEqual([
        'invalid_availability feature y',
      ]);
    },
  );
});

describe('options', () => {
  const withOption = (option: unknown) => ({
    features: [{ id: 'x', group: 'work', options: [option] }],
  });

  it('accept every type with a default that fits', () => {
    expect(
      found({
        features: [
          {
            id: 'x',
            group: 'work',
            options: [
              { key: 'a', type: 'boolean', default: true },
              { key: 'b', type: 'enum', values: ['one', 'two'], default: 'two' },
              { key: 'c', type: 'number', default: -1.5 },
              { key: 'd', type: 'minutes', default: 0 },
              { key: 'e', type: 'rappen', default: -500 },
              { key: 'f', type: 'time', default: '23:59' },
              { key: 'g', type: 'list', default: [] },
            ],
          },
        ],
      }),
    ).toEqual([]);
  });

  it.each([
    ['is no object', 3],
    ['has no key', { type: 'boolean', default: true }],
    ['has a key in snake case', { key: 'target_minutes', type: 'minutes', default: 1 }],
    ['has no type', { key: 'a', default: true }],
    ['has an unknown type', { key: 'a', type: 'color', default: 'red' }],
    ['has the wrong default for a boolean', { key: 'a', type: 'boolean', default: 'yes' }],
    ['has the wrong default for a number', { key: 'a', type: 'number', default: Number.NaN }],
    ['has fractions as minutes', { key: 'a', type: 'minutes', default: 1.5 }],
    ['has negative minutes', { key: 'a', type: 'minutes', default: -1 }],
    ['has fractions as Rappen', { key: 'a', type: 'rappen', default: 0.5 }],
    ['has a time that is no time', { key: 'a', type: 'time', default: '24:00' }],
    ['has a list of numbers', { key: 'a', type: 'list', default: [1] }],
    ['is an enum without values', { key: 'a', type: 'enum', default: 'x' }],
    ['is an enum with an empty list', { key: 'a', type: 'enum', values: [], default: 'x' }],
    [
      'is an enum with values that repeat',
      { key: 'a', type: 'enum', values: ['x', 'x'], default: 'x' },
    ],
    ['is an enum with an empty value', { key: 'a', type: 'enum', values: [''], default: '' }],
    [
      'is an enum with a default that is no value',
      { key: 'a', type: 'enum', values: ['x'], default: 'y' },
    ],
    [
      'has values without being an enum',
      { key: 'a', type: 'boolean', values: ['x'], default: true },
    ],
    ['has a field it does not know', { key: 'a', type: 'boolean', default: true, detailed: true }],
  ])('are refused: an option that %s', (_what, option) => {
    expect(found(withOption(option))).toContain('invalid_option feature x');
  });

  it('refuse a key declared twice', () => {
    expect(
      found({
        features: [
          {
            id: 'x',
            group: 'work',
            options: [
              { key: 'a', type: 'boolean', default: true },
              { key: 'a', type: 'boolean', default: false },
            ],
          },
        ],
      }),
    ).toEqual(['invalid_option feature x']);
  });

  it('name the option and the type that is wrong', () => {
    const [problem] = featureEntryProblems(
      withOption({ key: 'pin', type: 'boolean', default: 'yes' }),
      PLATFORM,
    );
    expect(problem?.message).toBe('the default of the option «pin» does not fit its type boolean');
  });
});

describe('kinds, questions, answers and modes that are not well formed', () => {
  it('refuses a kind with a bad id, no id or a list of features that is no list', () => {
    expect(found(industry({ kinds: [{ id: 'Muster.k' }] }))).toEqual(['invalid_entry kind ?']);
    expect(found(industry({ kinds: [{}] }))).toEqual(['invalid_entry kind ?']);
    expect(found(industry({ kinds: [{ id: 'muster.k', on: 'customers' }] }))).toEqual([
      'invalid_entry kind muster.k',
    ]);
  });

  it('refuses a question with a bad id, a multiple that is no boolean and no answers', () => {
    const answers = [{ id: 'a' }];
    expect(found({ questions: [{ id: 'Q', answers }] })).toEqual(['invalid_entry question ?']);
    expect(found({ questions: [{ id: 'q', multiple: 'yes', answers }] })).toEqual([
      'invalid_entry question q',
    ]);
    expect(found({ questions: [{ id: 'q' }] })).toEqual(['invalid_entry question q']);
    expect(found({ questions: [{ id: 'q', answers: [] }] })).toEqual(['invalid_entry question q']);
    expect(found({ questions: [{ id: 'q', answers: 'a' }] })).toEqual(['invalid_entry question q']);
    expect(found({ questions: [{ id: 'q', answers, kinds: 'muster.k' }] })).toEqual([
      'invalid_entry question q',
    ]);
  });

  it('refuses an answer that is no object, has a bad id, is listed twice or has bad lists', () => {
    const question = (answers: unknown) => ({ questions: [{ id: 'q', answers }] });
    expect(found(question([3]))).toEqual(['invalid_entry question ?']);
    expect(found(question([{ id: 'Yes' }]))).toEqual(['invalid_entry question q']);
    expect(found(question([{}]))).toEqual(['invalid_entry question q']);
    expect(found(question([{ id: 'a' }, { id: 'a' }]))).toEqual(['invalid_entry question q']);
    expect(found(question([{ id: 'a', enable: 'jobs' }]))).toEqual(['invalid_entry question q']);
    expect(found(question([{ id: 'a', disable: ['jobs', 'jobs'] }]))).toEqual([
      'invalid_entry question q',
    ]);
  });

  it('refuses a device mode with a bad id, no id, no feature or a feature that is no id', () => {
    expect(found({ deviceModes: [{ id: 'Mode', feature: 'jobs' }] })).toEqual([
      'invalid_entry device_mode ?',
    ]);
    expect(found({ deviceModes: [{ feature: 'jobs' }] })).toEqual(['invalid_entry device_mode ?']);
    expect(found({ deviceModes: [{ id: 'mode' }] })).toEqual(['invalid_entry device_mode mode']);
    expect(found({ deviceModes: [{ id: 'mode', feature: 3 }] })).toEqual([
      'invalid_entry device_mode mode',
    ]);
  });
});
describe('building a register from entries that are wrong', () => {
  const broken = {
    groups: [{ id: 'g' }],
    features: [
      { id: 'a', group: 'nowhere' },
      { id: 'b', group: 'g', requires: ['b'] },
    ],
  } satisfies FeatureEntries;

  it('throws a FeatureError with the code of the first problem and every problem', () => {
    let error: unknown;
    try {
      createFeatureRegistry(broken);
    } catch (thrown) {
      error = thrown;
    }
    expect(error).toBeInstanceOf(FeatureError);
    const failure = error as FeatureError;
    expect(failure.name).toBe('FeatureError');
    expect(failure.code).toBe('unknown_reference');
    expect(failure.problems.map((problem: FeatureProblem) => problem.code)).toEqual([
      'unknown_reference',
      'requires_cycle',
    ]);
    expect(failure.message).toBe(
      'The entries of the feature register are not well formed: feature a: the group «nowhere» is not registered; feature b: the feature «b» needs itself, directly or through others',
    );
  });

  it('throws the same when a register is extended, and leaves the register as it was', () => {
    const before = REGISTRY.ids;
    expect(() => REGISTRY.extend(broken)).toThrow(FeatureError);
    expect(REGISTRY.ids).toBe(before);
  });

  it('knows a code for every problem it can report', () => {
    expect([...FEATURE_PROBLEM_CODES].sort()).toEqual(
      [
        'duplicate_id',
        'foreign_dependency',
        'invalid_availability',
        'invalid_core',
        'invalid_entry',
        'invalid_option',
        'requires_cycle',
        'unknown_reference',
        'wrong_namespace',
      ].sort(),
    );
  });
});

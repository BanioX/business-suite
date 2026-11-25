import { createFeatureRegistry, DEFAULT_DEVICE_MODE } from '@onestrand/features';
import { createRightRegistry } from '@onestrand/access';
import { describe, expect, it } from 'vitest';
import {
  codeTexts,
  DEVICE_MODE_NORMAL,
  missingTexts,
  registerTexts,
  type RequiredText,
} from '../src';

const FEATURES = createFeatureRegistry({
  industries: [{ id: 'muster' }],
  groups: [{ id: 'work' }, { id: 'muster.visits' }],
  features: [
    { id: 'customers', group: 'work' },
    {
      id: 'muster.visits',
      group: 'muster.visits',
      requires: ['customers'],
      options: [
        { key: 'pin', type: 'boolean', default: false },
        { key: 'rounding', type: 'minutes', default: 15 },
      ],
    },
  ],
  kinds: [{ id: 'muster.standard', on: ['customers'] }],
  questions: [
    {
      id: 'muster.pass',
      answers: [{ id: 'yes', enable: ['customers'] }, { id: 'no' }],
    },
  ],
  deviceModes: [{ id: 'muster.counter', feature: 'muster.visits' }],
});
const RIGHTS = createRightRegistry(FEATURES, { rights: [{ id: 'wages' }] }).extend({
  industry: 'muster',
  rights: [{ id: 'muster.notes' }],
});

const paths = (required: readonly RequiredText[]) => required.map(({ keys }) => keys.join('/'));

describe('registerTexts: the key of every text follows from the id', () => {
  it('asks for a name and a sentence for each module, function and right', () => {
    const texts = paths(registerTexts({ features: FEATURES, rights: RIGHTS }));
    for (const id of ['work', 'muster.visits']) {
      expect(texts).toContain(`modules/${id}/name`);
      expect(texts).toContain(`modules/${id}/summary`);
    }
    for (const id of ['customers', 'muster.visits']) {
      expect(texts).toContain(`features/${id}/name`);
      expect(texts).toContain(`features/${id}/summary`);
    }
    for (const id of ['wages', 'muster.notes']) {
      expect(texts).toContain(`rights/${id}/name`);
      expect(texts).toContain(`rights/${id}/summary`);
    }
  });

  it('asks for a name for each option, kind and device mode', () => {
    const texts = paths(registerTexts({ features: FEATURES }));
    expect(texts).toContain('options/muster.visits/pin');
    expect(texts).toContain('options/muster.visits/rounding');
    expect(texts).toContain('kinds/muster.standard');
    expect(texts).toContain('deviceModes/muster.counter');
  });

  it('asks for a text for each question and each answer, under the question', () => {
    const texts = paths(registerTexts({ features: FEATURES }));
    expect(texts).toContain('questions/muster.pass/text');
    expect(texts).toContain('questions/muster.pass/answers/yes');
    expect(texts).toContain('questions/muster.pass/answers/no');
  });

  it('always asks for the mode normal, once, and first', () => {
    const modes = paths(registerTexts({ features: FEATURES })).filter((p) =>
      p.startsWith('deviceModes/'),
    );
    expect(modes).toEqual(['deviceModes/normal', 'deviceModes/muster.counter']);
    expect(paths(registerTexts({ features: createFeatureRegistry({}) }))).toEqual([
      'deviceModes/normal',
    ]);
  });

  it('asks for normal only once even if a register lists it', () => {
    const shape = { ...FEATURES, deviceModes: [{ id: 'normal' }] };
    expect(paths(registerTexts({ features: shape }))).toContain('deviceModes/normal');
    expect(
      paths(registerTexts({ features: shape })).filter((p) => p === 'deviceModes/normal'),
    ).toHaveLength(1);
  });

  it('is the same mode as the one the register of functions has', () => {
    expect(DEVICE_MODE_NORMAL).toBe(DEFAULT_DEVICE_MODE);
  });

  it('asks for nothing without registers, and for each register alone', () => {
    expect(registerTexts({})).toEqual([]);
    expect(paths(registerTexts({ rights: RIGHTS }))).toEqual([
      'rights/wages/name',
      'rights/wages/summary',
      'rights/muster.notes/name',
      'rights/muster.notes/summary',
    ]);
    expect(paths(registerTexts({ features: FEATURES })).some((p) => p.startsWith('rights/'))).toBe(
      false,
    );
  });

  it('asks once for each text, in the order of the registers', () => {
    const texts = paths(registerTexts({ features: FEATURES, rights: RIGHTS }));
    expect(new Set(texts).size).toBe(texts.length);
    expect(texts.indexOf('modules/work/name')).toBeLessThan(
      texts.indexOf('features/customers/name'),
    );
    expect(texts.indexOf('features/muster.visits/name')).toBeLessThan(
      texts.indexOf('kinds/muster.standard'),
    );
  });
});

describe('codeTexts', () => {
  it('asks for one text for each code of a fixed list', () => {
    expect(codeTexts('extents', ['lean', 'usual'])).toEqual([
      { keys: ['extents', 'lean'] },
      { keys: ['extents', 'usual'] },
    ]);
    expect(codeTexts('extents', [])).toEqual([]);
  });
});

describe('missingTexts', () => {
  const catalogue = {
    features: { customers: { name: 'Kundschaft', summary: 'Kontakte.' } },
    'dotted.section': { 'a.b': 'text' },
  };

  it('finds nothing where every text is there', () => {
    expect(
      missingTexts(catalogue, [
        { keys: ['features', 'customers', 'name'] },
        { keys: ['features', 'customers', 'summary'] },
        { keys: ['dotted.section', 'a.b'] },
      ]),
    ).toEqual([]);
  });

  it('lists a key that is missing, with the path and the keys', () => {
    expect(missingTexts(catalogue, [{ keys: ['features', 'jobs', 'name'] }])).toEqual([
      {
        rule: 'missing_text',
        message: 'The catalogue has no text at features.jobs.name.',
        path: 'features.jobs.name',
        keys: ['features', 'jobs', 'name'],
      },
    ]);
  });

  it('lists a record, a function, an empty text and a number where a text is wanted', () => {
    const odd = { a: { b: 'x' }, c: () => 'x', d: '', e: '  ', f: 3 };
    const found = missingTexts(
      odd,
      ['a', 'c', 'd', 'e', 'f'].map((key) => ({ keys: [key] })),
    );
    expect(found.map((problem) => problem.path)).toEqual(['a', 'c', 'd', 'e', 'f']);
  });

  it('lists everything for a catalogue that is no record', () => {
    for (const none of [undefined, null, 'text', 5]) {
      expect(missingTexts(none, [{ keys: ['a'] }])).toHaveLength(1);
    }
  });

  it('does not read what a record holds only on its prototype', () => {
    const inherited = Object.create({ features: { x: 'y' } }) as unknown;
    expect(missingTexts(inherited, [{ keys: ['features', 'x'] }])).toHaveLength(1);
  });

  it('lists a text that is missing at the top of the path as missing, not as an error', () => {
    expect(missingTexts({}, [{ keys: ['features', 'customers', 'name'] }])).toHaveLength(1);
    expect(missingTexts({ features: 'x' }, [{ keys: ['features', 'customers'] }])).toHaveLength(1);
  });
});

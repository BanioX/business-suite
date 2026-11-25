import { describe, expect, it } from 'vitest';
import * as features from '../src';

/**
 * The public surface, name by name. Every module, every industry and the shell build on it: a
 * name that disappears or appears here is a decision, not an accident. Types are not listed;
 * `tsc` guards them where they are used.
 */
describe('@onestrand/features', () => {
  it('exports exactly these values', () => {
    expect(Object.keys(features).sort()).toEqual(
      [
        // errors
        'FEATURE_PROBLEM_CODES',
        'FeatureError',
        // what is entered
        'AVAILABILITIES',
        'OPTION_TYPES',
        'EXTENTS',
        'DEFAULT_DEVICE_MODE',
        'FEATURE_SEGMENT_PATTERN',
        'OPTION_KEY_PATTERN',
        'namespaceOf',
        // options
        'optionAccepts',
        // the register
        'ANSWER_PROBLEM_KINDS',
        'createFeatureRegistry',
        'featureEntryProblems',
      ].sort(),
    );
  });

  it('keeps its helpers inside', () => {
    for (const name of ['checkEntries', 'resolveOptionValues', 'NO_ENTRIES']) {
      expect(Object.keys(features), name).not.toContain(name);
    }
  });

  it('holds no fixed list of features: every package and industry enters its own', () => {
    const registers = Object.values(features).filter(
      (value) => typeof value === 'object' && 'features' in value && 'ids' in value,
    );
    expect(registers).toEqual([]);
  });

  it('knows the extents and the one value of availability by their ids, not by a text', () => {
    expect(features.EXTENTS).toEqual(['lean', 'usual', 'all']);
    expect(features.AVAILABILITIES).toEqual(['available']);
    expect(features.DEFAULT_DEVICE_MODE).toBe('normal');
  });
});

import { describe, expect, it } from 'vitest';
import { FeatureError, optionAccepts } from '../src';
import { REGISTRY } from './support';

const ENUM = { type: 'enum', values: ['clock', 'none'] } as const;

describe('optionAccepts', () => {
  it.each([
    [{ type: 'boolean', values: [] }, true, true],
    [{ type: 'boolean', values: [] }, false, true],
    [{ type: 'boolean', values: [] }, 0, false],
    [{ type: 'boolean', values: [] }, 'true', false],
    [ENUM, 'clock', true],
    [ENUM, 'other', false],
    [ENUM, 3, false],
    [{ type: 'number', values: [] }, -2.5, true],
    [{ type: 'number', values: [] }, Number.NaN, false],
    [{ type: 'number', values: [] }, Number.POSITIVE_INFINITY, false],
    [{ type: 'number', values: [] }, '3', false],
    [{ type: 'minutes', values: [] }, 0, true],
    [{ type: 'minutes', values: [] }, 90, true],
    [{ type: 'minutes', values: [] }, -1, false],
    [{ type: 'minutes', values: [] }, 1.5, false],
    [{ type: 'minutes', values: [] }, Number.MAX_SAFE_INTEGER + 1, false],
    [{ type: 'rappen', values: [] }, 2000, true],
    [{ type: 'rappen', values: [] }, -50, true],
    [{ type: 'rappen', values: [] }, 0.5, false],
    [{ type: 'rappen', values: [] }, '20.00', false],
    [{ type: 'time', values: [] }, '00:00', true],
    [{ type: 'time', values: [] }, '23:59', true],
    [{ type: 'time', values: [] }, '24:00', false],
    [{ type: 'time', values: [] }, '9:30', false],
    [{ type: 'time', values: [] }, '09:60', false],
    [{ type: 'time', values: [] }, '09:30:00', false],
    [{ type: 'time', values: [] }, 930, false],
    [{ type: 'list', values: [] }, [], true],
    [{ type: 'list', values: [] }, ['a'], true],
    [{ type: 'list', values: [] }, ['a', 1], false],
    [{ type: 'list', values: [] }, 'a', false],
  ] as const)('%j takes %j: %s', (option, value, accepted) => {
    expect(optionAccepts(option, value)).toBe(accepted);
  });
});

describe('the settings of a feature as they apply', () => {
  it('give the default of every option where nothing is stored', () => {
    const resolved = REGISTRY.resolveOptions('time_clock');
    expect(resolved.values).toEqual({
      pin: false,
      breaks: 'clock',
      rounding: 'none',
      targetMinutes: 5,
      closingTime: '04:00',
      limit: 2000,
      ratio: 1.5,
      tags: ['a', 'b'],
    });
    expect(resolved.defaulted).toEqual(Object.keys(resolved.values));
    expect(resolved.unknown).toEqual({});
  });

  it('take a stored value that fits and say no more about it', () => {
    const resolved = REGISTRY.resolveOptions('time_clock', {
      pin: true,
      breaks: 'none',
      targetMinutes: 0,
      tags: [],
    });
    expect(resolved.values).toMatchObject({
      pin: true,
      breaks: 'none',
      targetMinutes: 0,
      tags: [],
    });
    expect(resolved.defaulted).toEqual(['rounding', 'closingTime', 'limit', 'ratio']);
  });

  it('fall back on the default for a value that does not fit, and list it', () => {
    const resolved = REGISTRY.resolveOptions('time_clock', {
      pin: 'yes',
      breaks: 'weekly',
      targetMinutes: -3,
      closingTime: '25:00',
    });
    expect(resolved.values).toMatchObject({
      pin: false,
      breaks: 'clock',
      targetMinutes: 5,
      closingTime: '04:00',
    });
    expect(resolved.defaulted).toEqual(
      expect.arrayContaining(['pin', 'breaks', 'targetMinutes', 'closingTime']),
    );
  });

  it('hand back a stored key the feature does not know, so a newer version loses nothing', () => {
    const resolved = REGISTRY.resolveOptions('time_clock', { pin: true, later: { a: 1 } });
    expect(resolved.unknown).toEqual({ later: { a: 1 } });
    expect(resolved.values).not.toHaveProperty('later');
  });

  it.each([[undefined], [null], ['text'], [3], [['pin']]])(
    'treat stored settings that are %j as none',
    (stored) => {
      const resolved = REGISTRY.resolveOptions('time_clock', stored);
      expect(resolved.defaulted).toHaveLength(8);
      expect(resolved.unknown).toEqual({});
    },
  );

  it('read only keys of the stored object itself, never of its prototype', () => {
    const stored = Object.create({ pin: true }) as Record<string, unknown>;
    expect(REGISTRY.resolveOptions('time_clock', stored).values).toMatchObject({ pin: false });
  });

  it('keep a stored key called __proto__ as plain data', () => {
    const stored: unknown = JSON.parse('{"__proto__": {"pin": true}}');
    const resolved = REGISTRY.resolveOptions('time_clock', stored);
    expect(Object.keys(resolved.unknown)).toEqual(['__proto__']);
    expect(resolved.values).toMatchObject({ pin: false });
  });

  it('are nothing for a feature without options', () => {
    const resolved = REGISTRY.resolveOptions('jobs', { anything: 1 });
    expect(resolved.values).toEqual({});
    expect(resolved.unknown).toEqual({ anything: 1 });
  });

  it('are frozen, and the stored settings are never changed', () => {
    const stored = { pin: true, later: 1 };
    const resolved = REGISTRY.resolveOptions('time_clock', stored);
    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(resolved.values)).toBe(true);
    expect(Object.isFrozen(resolved.defaulted)).toBe(true);
    expect(Object.isFrozen(resolved.unknown)).toBe(true);
    expect(stored).toEqual({ pin: true, later: 1 });
  });

  it('refuse a feature that is not registered', () => {
    expect(() => REGISTRY.resolveOptions('nowhere')).toThrow(FeatureError);
  });
});

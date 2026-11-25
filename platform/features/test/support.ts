import { createFeatureRegistry, type FeatureEntries } from '../src';

/**
 * A small register for the tests: a core, three chains of features (jobs and invoicing on
 * customers, the time tracking on the team), one industry with its own group, features, kinds,
 * questions and a device mode. Plain names, no industry of the real world.
 */
export const PLATFORM_ENTRIES = {
  groups: [{ id: 'core' }, { id: 'work' }, { id: 'time' }],
  features: [
    { id: 'today', group: 'core', core: true },
    { id: 'data', group: 'core', core: true, requires: ['today'] },
    { id: 'customers', group: 'work' },
    { id: 'jobs', group: 'work', requires: ['customers'] },
    { id: 'invoicing', group: 'work', requires: ['jobs'] },
    { id: 'team', group: 'time' },
    {
      id: 'time_clock',
      group: 'time',
      requires: ['team'],
      options: [
        { key: 'pin', type: 'boolean', default: false },
        { key: 'breaks', type: 'enum', values: ['clock', 'auto_rule', 'none'], default: 'clock' },
        { key: 'rounding', type: 'enum', values: ['none'], default: 'none' },
        { key: 'targetMinutes', type: 'minutes', default: 5 },
        { key: 'closingTime', type: 'time', default: '04:00' },
        { key: 'limit', type: 'rappen', default: 2000 },
        { key: 'ratio', type: 'number', default: 1.5 },
        { key: 'tags', type: 'list', default: ['a', 'b'] },
      ],
    },
    { id: 'payroll_export', group: 'time', requires: ['time_clock'] },
    { id: 'roster', group: 'time', requires: ['team'] },
  ],
  questions: [
    {
      id: 'team_size',
      answers: [
        { id: 'solo', disable: ['team'] },
        { id: 'small', enable: ['team'] },
        { id: 'large', enable: ['team', 'roster'] },
      ],
    },
    {
      id: 'time_tracking',
      multiple: true,
      answers: [
        { id: 'paper', enable: ['time_clock'] },
        { id: 'sheet', enable: ['time_clock', 'payroll_export'] },
        { id: 'other_program', disable: ['time_clock'] },
        { id: 'none' },
      ],
    },
  ],
} as const satisfies FeatureEntries;

export const INDUSTRY_ENTRIES = {
  industries: [{ id: 'muster' }],
  groups: [{ id: 'muster.counter' }],
  features: [
    { id: 'muster.visits', group: 'muster.counter', requires: ['customers'] },
    { id: 'muster.passes', group: 'muster.counter', requires: ['muster.visits'] },
  ],
  kinds: [
    { id: 'muster.standard', on: ['customers', 'muster.visits'] },
    { id: 'muster.small', on: ['customers'] },
  ],
  questions: [
    {
      id: 'muster.passes_wanted',
      kinds: ['muster.standard'],
      answers: [{ id: 'yes', enable: ['muster.passes'] }, { id: 'no' }],
    },
  ],
  deviceModes: [{ id: 'muster.counter', feature: 'muster.visits' }],
} as const satisfies FeatureEntries;

export const PLATFORM = createFeatureRegistry(PLATFORM_ENTRIES);
export const REGISTRY = PLATFORM.extend(INDUSTRY_ENTRIES);

/** The ids of the platform's core. */
export const CORE = ['today', 'data'] as const;

/** A list of ids from text such as `'a b c'`. */
export function ids(text: string): string[] {
  return text === '' ? [] : text.split(' ');
}

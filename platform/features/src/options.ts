import type { FeatureOptionDefinition } from './entries';

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/**
 * Whether a value fits the type of an option: a boolean, one of the `values` of an enum, a
 * finite number, whole minutes not below zero, a whole number of Rappen, a time of day `HH:MM`,
 * a list of texts. The register uses it for the default of every option, and whoever shows or
 * stores a setting uses it for the value that came back.
 */
export function optionAccepts(
  option: Pick<FeatureOptionDefinition, 'type' | 'values'>,
  value: unknown,
): boolean {
  switch (option.type) {
    case 'boolean':
      return typeof value === 'boolean';
    case 'enum':
      return typeof value === 'string' && option.values.includes(value);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'minutes':
      return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
    case 'rappen':
      return typeof value === 'number' && Number.isSafeInteger(value);
    case 'time':
      return typeof value === 'string' && TIME_PATTERN.test(value);
    case 'list':
      return Array.isArray(value) && value.every((item) => typeof item === 'string');
  }
}

/** The settings of one feature as they apply: stored values that fit, the default for the rest. */
export interface ResolvedOptions {
  /** One value per option of the feature, by key. */
  readonly values: Readonly<Record<string, OptionValueOf>>;
  /** Keys that have no stored value or one that does not fit; they apply with their default. */
  readonly defaulted: readonly string[];
  /** Stored keys the feature does not know, kept as they are so a newer version loses nothing. */
  readonly unknown: Readonly<Record<string, unknown>>;
}

type OptionValueOf = FeatureOptionDefinition['default'];

/**
 * Reads the stored settings of a feature. Nothing breaks on a stored value that does not fit or
 * on a key that is not known: the first applies with its default (and is listed in `defaulted`),
 * the second is handed back in `unknown`.
 */
export function resolveOptionValues(
  options: readonly FeatureOptionDefinition[],
  stored: unknown,
): ResolvedOptions {
  const record: Record<string, unknown> =
    typeof stored === 'object' && stored !== null && !Array.isArray(stored)
      ? { ...(stored as Record<string, unknown>) }
      : {};
  const values: Record<string, OptionValueOf> = {};
  const defaulted: string[] = [];
  const known = new Set<string>();
  for (const option of options) {
    known.add(option.key);
    const value = Object.hasOwn(record, option.key) ? record[option.key] : undefined;
    if (optionAccepts(option, value)) {
      values[option.key] = value as OptionValueOf;
    } else {
      values[option.key] = option.default;
      defaulted.push(option.key);
    }
  }
  // `fromEntries` defines each key as plain data, also a stored key such as `__proto__`.
  const unknown = Object.fromEntries(Object.entries(record).filter(([key]) => !known.has(key)));
  return Object.freeze({
    values: Object.freeze(values),
    defaulted: Object.freeze(defaulted),
    unknown: Object.freeze(unknown),
  });
}

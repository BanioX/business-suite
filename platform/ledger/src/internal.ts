import { isPlainRecord } from '@onestrand/storage';

/**
 * Small helpers of this package. Not part of the public surface: `index.ts` does not hand them
 * on, and a test pins the list of exports.
 */

export const isList = (value: unknown): value is readonly unknown[] => Array.isArray(value);

/**
 * Orders two texts by their UTF-16 code units: the same order on every device and in every
 * language setting, which a comparison by locale is not.
 */
export function compareText(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

/** The value of a field of an object that is not known by type, or nothing. */
export function fieldOf(value: object, key: string): unknown {
  return Object.hasOwn(value, key) ? (value as Readonly<Record<string, unknown>>)[key] : undefined;
}

/**
 * Freezes plain data at every depth and returns it. Whatever is not a list or a plain record (a
 * map, an instance of a class) is left as it is, with everything inside it.
 */
export function deepFreeze<TValue>(value: TValue): TValue {
  if (isList(value)) {
    value.forEach(deepFreeze);
    Object.freeze(value);
  } else if (isPlainRecord(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

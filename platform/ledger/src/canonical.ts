import { isPlainRecord, plainCopy, StorageError } from '@onestrand/storage';
import { compareText, isList } from './internal';

/**
 * Canonical JSON: the one spelling of a value, so that two devices that hold the same data
 * compute the same checksum over it.
 *
 * - The keys of a record are sorted by their UTF-16 code units, at every depth.
 * - No whitespace.
 * - Numbers and strings are written as `JSON.stringify` writes them (`1e+21`, `0.1`, `"\n"`).
 *
 * These are the rules of RFC 8785 (JSON Canonicalization Scheme), so the text can be checked
 * with any implementation of it.
 */

function write(value: unknown): string {
  if (isList(value)) {
    return `[${value.map(write).join(',')}]`;
  }
  if (isPlainRecord(value)) {
    const fields = Object.keys(value)
      .sort(compareText)
      .map((key) => `${JSON.stringify(key)}:${write(value[key])}`);
    return `{${fields.join(',')}}`;
  }
  // What is left of plain data: null, a boolean, a finite number or a string.
  return JSON.stringify(value);
}

/**
 * The canonical JSON text of plain data. The value is read as the storage keeps it
 * (`plainCopy`): a field without a value is no field, and -0 is 0.
 *
 * Throws a `StorageError` with the code `not_plain` for what a file could not carry (a number
 * that is not finite, a date object, a missing value in a list), and a `TypeError` for
 * `undefined` itself: there is no text for «no value».
 */
export function canonicalJson(value: unknown): string {
  if (value === undefined) {
    throw new TypeError('canonicalJson needs a value: undefined has no JSON text');
  }
  return write(plainCopy(value));
}

/**
 * The canonical JSON text of a value, or nothing if it has none: it is not plain data, or it is
 * `undefined`. For code of this package that compares values which may be anything.
 */
export function canonicalText(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  try {
    return canonicalJson(value);
  } catch (error) {
    if (error instanceof StorageError) {
      return undefined;
    }
    throw error;
  }
}

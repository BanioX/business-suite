import { StorageError } from './errors';

/**
 * Plain data: what a row, an event or the result of a command is made of, and exactly what a
 * backup file (JSON) can carry: null, booleans, finite numbers, strings, lists and records of
 * these. The storage copies every value on its way in and out, so nobody changes stored data by
 * accident, and it refuses what a backup would lose or change without a word.
 */

/** Deeper than any row; a value that refers to itself runs into this instead of the stack. */
const MAX_DEPTH = 100;

type Path = readonly (string | number)[];

const isList = (value: unknown): value is readonly unknown[] => Array.isArray(value);

/** True for an object literal: a record of values, not a list and not an instance of a class. */
export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || isList(value)) {
    return false;
  }
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function notPlain(path: Path, problem: string): StorageError {
  const where = path.map((step) => (typeof step === 'number' ? `[${step}]` : `.${step}`)).join('');
  return new StorageError('not_plain', `The value at $${where} is not plain data: ${problem}`);
}

/** The keys of a record that are copied; a record that holds anything else is refused. */
function plainKeys(record: Record<string, unknown>, path: Path): string[] {
  if (Object.getOwnPropertySymbols(record).length > 0) {
    throw notPlain(path, 'a record with a symbol as a key');
  }
  const keys = Object.keys(record);
  if (keys.includes('__proto__')) {
    // Written into a new record, this key would replace its prototype instead of being data.
    throw notPlain(path, 'a record with the key "__proto__"');
  }
  return keys;
}

function copy(value: unknown, path: Path): unknown {
  if (path.length > MAX_DEPTH) {
    throw notPlain(path, 'nested too deeply, or it contains itself');
  }
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw notPlain(path, `${String(value)} is not a number a file can carry`);
    }
    // A file reads -0 back as 0; stored the same way, a row equals itself after a backup.
    return value === 0 ? 0 : value;
  }
  if (isList(value)) {
    const list: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      // Read by index, so a hole in the list is seen as the missing value it is.
      list.push(copy(value[index], [...path, index]));
    }
    return list;
  }
  if (isPlainRecord(value)) {
    const record: Record<string, unknown> = {};
    for (const key of plainKeys(value, path)) {
      const field = value[key];
      // A field without a value is the same as no field, in a file and here.
      if (field !== undefined) {
        record[key] = copy(field, [...path, key]);
      }
    }
    return record;
  }
  throw notPlain(path, value === undefined ? 'a list with a missing value' : `a ${typeof value}`);
}

/**
 * A deep copy of plain data. Fields without a value are left out and -0 becomes 0, as in a
 * file. Everything a file could not carry faithfully throws a `StorageError` with the code
 * `not_plain` and the place of the value: a number that is not finite, a date object, a map,
 * bytes, a function, a missing value inside a list, a record that contains itself.
 *
 * `undefined` itself is returned as it is: «no value» is a valid answer of a lookup.
 */
export function plainCopy<TValue>(value: TValue): TValue {
  // A copy of plain data has the type of what it copies.
  return (value === undefined ? value : copy(value, [])) as TValue;
}

function overlay(raw: unknown, parsed: unknown, path: Path): unknown {
  if (path.length > MAX_DEPTH) {
    throw notPlain(path, 'nested too deeply, or it contains itself');
  }
  if (isPlainRecord(raw) && isPlainRecord(parsed)) {
    const record: Record<string, unknown> = {};
    for (const key of plainKeys(raw, path)) {
      if (!Object.hasOwn(parsed, key) && raw[key] !== undefined) {
        record[key] = copy(raw[key], [...path, key]);
      }
    }
    for (const key of plainKeys(parsed, path)) {
      if (parsed[key] !== undefined) {
        record[key] = overlay(raw[key], parsed[key], [...path, key]);
      }
    }
    return record;
  }
  if (isList(raw) && isList(parsed) && raw.length === parsed.length) {
    return parsed.map((item, index) => overlay(raw[index], item, [...path, index]));
  }
  return copy(parsed, path);
}

/**
 * Loose reading: the value a schema accepted (`parsed`), with every field put back that the
 * schema does not know (`raw` is what was read). A row written by a newer version of an app
 * keeps its new fields when an older version reads and writes it, at any depth: in the row, in
 * a record inside it, in the records of a list.
 *
 * What the schema knows always wins. Lists are matched item by item when the schema kept their
 * length; if it did not, the parsed list is taken as it is. A schema cannot remove a field with
 * a transform this way: the field it dropped comes back from `raw`.
 *
 * The result is a fresh copy of plain data; what is not plain data throws like `plainCopy`.
 */
export function keepUnknownFields<TParsed>(raw: unknown, parsed: TParsed): TParsed {
  // The fields put back are ones the type of the schema does not name.
  return (parsed === undefined ? parsed : overlay(raw, parsed, [])) as TParsed;
}

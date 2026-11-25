import { isPlainRecord, plainCopy } from '@onestrand/storage';
import type { ManifestPart, ManifestProblem, ManifestProblemCode } from './errors';

/** Small helpers the checks of the manifests share. They work on values of any shape. */

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isList = (value: unknown): value is readonly unknown[] => Array.isArray(value);

/** A value in a few words, for a message. */
export function describe(value: unknown): string {
  if (value === undefined) {
    return 'nothing';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (isList(value)) {
    return 'a list';
  }
  return typeof value === 'object' ? 'an object' : `a ${typeof value}`;
}

export type Sink = ManifestProblem[];

export function report(
  sink: Sink,
  code: ManifestProblemCode,
  part: ManifestPart,
  id: string,
  message: string,
): void {
  sink.push({ code, part, id, message });
}

/** Reports every field of a record that the manifest does not have. */
export function reportUnknownFields(
  sink: Sink,
  part: ManifestPart,
  record: Record<string, unknown>,
  known: readonly string[],
  where: string,
  id = '?',
): void {
  for (const field of Object.keys(record)) {
    if (!known.includes(field)) {
      report(
        sink,
        'invalid_entry',
        part,
        id,
        `${where} has no field "${field}"; its fields are ${known.join(', ')}`,
      );
    }
  }
}

/** Whether a value is plain data, as a backup file can carry it. */
export function isPlainData(value: unknown): boolean {
  try {
    plainCopy(value);
    return true;
  } catch {
    return false;
  }
}

export function isPlainDataRecord(value: unknown): value is Record<string, unknown> {
  return isPlainRecord(value) && isPlainData(value);
}

/** Freezes a value of plain data in every depth and returns it. */
export function deepFreeze<TValue>(value: TValue): TValue {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const inner of Object.values(value)) {
      deepFreeze(inner);
    }
  }
  return value;
}

/** A copy of plain data that nobody can change: what a manifest holds of what it was given. */
export function frozenPlain<TValue>(value: TValue): TValue {
  return deepFreeze(plainCopy(value));
}

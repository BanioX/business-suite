/**
 * Loose reading: what a newer version wrote and this one does not know stays when a row is
 * written back. Small helpers, used where a use case replaces part of a stored row.
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The fields of a stored object that `known` does not name: nothing for a value that is no object. */
export function unknownFields(stored: unknown, known: readonly string[]): Record<string, unknown> {
  return isRecord(stored)
    ? Object.fromEntries(Object.entries(stored).filter(([key]) => !known.includes(key)))
    : {};
}

/** A list of ids as it is to be stored: the new ones, then the stored ones `isKnown` does not know, each once. */
export function withUnknownIds(
  next: readonly string[],
  stored: readonly string[],
  isKnown: (id: string) => boolean,
): string[] {
  return [...new Set([...next, ...stored.filter((id) => !isKnown(id))])];
}

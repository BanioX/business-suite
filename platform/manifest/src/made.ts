/**
 * Manifests are made by `defineModule`, `defineIndustry` and `defineEdition` and by nothing else:
 * an object that looks like one is not taken for one. The check is a mark the defining functions
 * put on what they return, kept out of the object so it cannot be copied along or forged.
 */

const made = new WeakSet<object>();

/** Marks a manifest as made by a defining function and returns it. */
export function markMade<TManifest extends object>(manifest: TManifest): TManifest {
  made.add(manifest);
  return manifest;
}

/** Whether a value is a manifest made by a defining function, and of this kind. */
export function isMade(value: unknown, kind: 'module' | 'industry' | 'edition'): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    made.has(value) &&
    (value as { kind?: unknown }).kind === kind
  );
}

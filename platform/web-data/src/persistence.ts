// Origin: BanioX/Randen apps/web/src/data/persistence.ts @ 5d016f1 — adapted: neutral wording; the storage manager is a parameter that defaults to the one of the page
/**
 * Asks the browser to keep the data of the app even when space runs low (the data lives only on
 * the device). Chrome and Firefox decide by usage or ask; Safari keeps the data of installed
 * home-screen apps anyway, but may clear websites unused for 7 days, so installing is the safe
 * way on the iPhone. Never throws: without it the app still works.
 */
export async function requestPersistentStorage(
  storage: Pick<StorageManager, 'persisted' | 'persist'> | undefined = typeof navigator ===
  'undefined'
    ? undefined
    : navigator.storage,
): Promise<boolean> {
  if (storage === undefined) {
    return false;
  }
  try {
    return (await storage.persisted()) || (await storage.persist());
  } catch {
    return false;
  }
}

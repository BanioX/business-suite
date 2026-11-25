// Origin: BanioX/Randen apps/web/src/data/adapters.ts @ 5d016f1 — adapted: no fixed package names; the source of random bytes is a parameter that defaults to the one of the page
import { createIdGenerator, IsoDateTimeSchema, toLocalDate } from '@onestrand/core';
import type { Clock, IdGenerator } from '@onestrand/storage';

/** Real time in the browser; «today» is the Swiss calendar day. */
export function createBrowserClock(): Clock {
  return {
    now: () => IsoDateTimeSchema.parse(new Date().toISOString()),
    today: () => toLocalDate(new Date()),
  };
}

/** UUIDv7 with cryptographically secure randomness. */
export function createBrowserIds(random: Pick<Crypto, 'getRandomValues'> = crypto): IdGenerator {
  return {
    next: createIdGenerator(
      () => Date.now(),
      (length) => random.getRandomValues(new Uint8Array(length)),
    ),
  };
}

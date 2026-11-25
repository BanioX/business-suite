// Origin: BanioX/Randen packages/core/src/testing/index.ts @ e0f0907 — adapted: only the counting ids; the start is checked, and a counter that has run out fails instead of repeating an id
import type { IdGenerator } from '@onestrand/contract';
import { uuidV7 } from '@onestrand/core';

/** The instant every counting id carries (15.01.2027, 08:00 UTC); only the counter differs. */
const ID_TIMESTAMP_MS = 1_800_000_000_000;

/** A UUIDv7 has ten bytes besides its time; the counter is written into the last seven. */
const RANDOM_BYTES = 10;

/**
 * UUIDv7s that count up: the same test gives the same ids every time, and the ids sort in the
 * order they were made. `start` is the number of the first id (default 1).
 *
 * Two generators that must not collide (two businesses on one storage) get ranges far apart;
 * `createTestContext` does that for the businesses it seeds. Throws a `RangeError` for a start
 * that is no whole number from 0 on, and once the counter has left the safe integers.
 */
export function sequentialIds(start = 1): IdGenerator {
  if (!Number.isSafeInteger(start) || start < 0) {
    throw new RangeError(`start must be a whole number from 0 on, got ${String(start)}`);
  }
  let counter = start;
  return {
    next: () => {
      if (!Number.isSafeInteger(counter)) {
        // Beyond 2^53 a number no longer counts by one: two calls would return the same id.
        throw new RangeError('sequentialIds has run out of ids');
      }
      const bytes = new Uint8Array(RANDOM_BYTES);
      let rest = counter;
      for (let i = RANDOM_BYTES - 1; i >= 0 && rest > 0; i -= 1) {
        bytes[i] = rest % 256;
        rest = Math.floor(rest / 256);
      }
      counter += 1;
      return uuidV7(ID_TIMESTAMP_MS, bytes);
    },
  };
}

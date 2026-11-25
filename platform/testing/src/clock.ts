// Origin: BanioX/Randen packages/core/src/testing/index.ts @ e0f0907 — adapted: only the fixed clock; it holds one instant and the calendar day follows from it, so the two never disagree; the time of day can be set and moved forward
import type { Clock } from '@onestrand/contract';
import {
  IsoDateTimeSchema,
  localDate,
  toLocalDate,
  type IsoDateTime,
  type LocalDate,
} from '@onestrand/core';

/** How far `advance` moves the clock. Every part is a whole number from 0 on. */
export interface ClockStep {
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

/** A clock that stands still until the test moves it. */
export interface TestClock extends Clock {
  /**
   * Jumps to 10:00 UTC of a calendar day: late morning in Switzerland all year, so `today()`
   * is that day.
   */
  setToday: (day: LocalDate | string) => void;
  /**
   * Jumps to an instant, ISO 8601 in UTC (`2026-11-14T22:30:00.000Z`). `today()` follows as a
   * real clock would: 23:30 UTC is already the next day in Switzerland.
   */
  setNow: (instant: IsoDateTime | string) => void;
  /** Moves the clock forward: `advance({ hours: 4, minutes: 15 })`. To go back, use `setNow`. */
  advance: (by: ClockStep) => void;
}

/** The hour a day starts with for the clock: late morning in Switzerland, summer and winter. */
const TIME_OF_DAY = 'T10:00:00.000Z';

const STEP_UNITS = [
  ['hours', 3_600_000],
  ['minutes', 60_000],
  ['seconds', 1000],
  ['milliseconds', 1],
] as const satisfies readonly (readonly [keyof ClockStep, number])[];

/** The first and the last millisecond of the years 0000 to 9999, which a calendar day can name. */
const FIRST_MS = -62_167_219_200_000;
const LAST_MS = 253_402_300_799_999;

/** The instant as the clock hands it out: always with milliseconds, so instants sort as text. */
function instantOf(ms: number): IsoDateTime {
  if (!(ms >= FIRST_MS && ms <= LAST_MS)) {
    throw new RangeError('The clock cannot leave the years 0000 to 9999');
  }
  return IsoDateTimeSchema.parse(new Date(ms).toISOString());
}

function stepMs(by: ClockStep): number {
  let total = 0;
  for (const [unit, msPerUnit] of STEP_UNITS) {
    const amount = by[unit];
    if (amount === undefined) {
      continue;
    }
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new RangeError(
        `${unit} must be a whole number from 0 on, got ${String(amount)}; setNow moves a clock back`,
      );
    }
    total += amount * msPerUnit;
  }
  return total;
}

/**
 * A clock for tests. It starts at 10:00 UTC of `day` (default 14.11.2026) and stands still. It
 * holds one instant; `today()` is the calendar day of that instant in Switzerland, so `now()`
 * and `today()` never disagree, also around midnight and when the clocks change.
 *
 * Throws for a day or an instant that does not exist (`2026-02-30`), and for an instant that is
 * not written in UTC with `Z`.
 */
export function fixedClock(day: LocalDate | string = '2026-11-14'): TestClock {
  const startOf = (value: string) => Date.parse(`${localDate(value)}${TIME_OF_DAY}`);
  let ms = startOf(day);
  let now = instantOf(ms);
  const moveTo = (next: number) => {
    // Checked before it is kept: a clock that was moved out of range stays where it was.
    now = instantOf(next);
    ms = next;
  };
  return {
    now: () => now,
    today: () => toLocalDate(ms),
    setToday: (next) => {
      moveTo(startOf(next));
    },
    setNow: (instant) => {
      moveTo(Date.parse(IsoDateTimeSchema.parse(instant)));
    },
    advance: (by) => {
      moveTo(ms + stepMs(by));
    },
  };
}

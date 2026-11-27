import type { Clock } from '@onestrand/contract';
import { addDays, IsoDateTimeSchema, localDate, toLocalDate } from '@onestrand/core';
import fc from 'fast-check';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { fixedClock, type TestClock } from '../src';

describe('fixedClock', () => {
  it('starts at 10:00 UTC of 14.11.2026 and stands still', () => {
    const clock = fixedClock();
    expect(clock.now()).toBe('2026-11-14T10:00:00.000Z');
    expect(clock.today()).toBe('2026-11-14');
    expect(clock.now()).toBe('2026-11-14T10:00:00.000Z');
  });

  it('starts at the day it is given and jumps to another with setToday', () => {
    const clock = fixedClock('2027-03-01');
    expect(clock.today()).toBe('2027-03-01');
    expect(clock.now()).toBe('2027-03-01T10:00:00.000Z');

    clock.setToday(localDate('2026-11-20'));
    expect(clock.today()).toBe('2026-11-20');
    expect(clock.now()).toBe('2026-11-20T10:00:00.000Z');
  });

  it('is a clock of the contract', () => {
    expectTypeOf<TestClock>().toExtend<Clock>();
    const clock: Clock = fixedClock();
    expect(IsoDateTimeSchema.safeParse(clock.now()).success).toBe(true);
  });

  it('keeps day and instant together for every day of the calendar', () => {
    const day = fc
      .integer({ min: 0, max: 73_000 })
      .map((offset) => addDays(localDate('1970-01-01'), offset));
    fc.assert(
      fc.property(day, (date) => {
        const clock = fixedClock(date);
        expect(clock.today()).toBe(date);
        expect(toLocalDate(clock.now())).toBe(date);
        clock.setToday('2026-11-14');
        clock.setToday(date);
        expect(clock.today()).toBe(date);
      }),
    );
  });

  describe('setNow', () => {
    it('jumps to an instant and always writes it with milliseconds', () => {
      const clock = fixedClock();
      clock.setNow('2026-11-14T06:30:00Z');
      expect(clock.now()).toBe('2026-11-14T06:30:00.000Z');
      clock.setNow(IsoDateTimeSchema.parse('2026-11-14T06:30:15.5Z'));
      expect(clock.now()).toBe('2026-11-14T06:30:15.500Z');
      expect(clock.today()).toBe('2026-11-14');
    });

    it('gives the calendar day of Switzerland, not of UTC: late in the evening it is tomorrow', () => {
      const clock = fixedClock();
      // Winter, UTC+1: midnight in Switzerland is 23:00 UTC.
      clock.setNow('2026-11-14T22:59:59.999Z');
      expect(clock.today()).toBe('2026-11-14');
      clock.setNow('2026-11-14T23:00:00.000Z');
      expect(clock.today()).toBe('2026-11-15');
      // Summer, UTC+2: midnight in Switzerland is 22:00 UTC.
      clock.setNow('2026-07-01T21:59:59.999Z');
      expect(clock.today()).toBe('2026-07-01');
      clock.setNow('2026-07-01T22:00:00.000Z');
      expect(clock.today()).toBe('2026-07-02');
    });

    it('goes back in time as well', () => {
      const clock = fixedClock();
      clock.setNow('2020-01-01T00:00:00.000Z');
      expect(clock.now()).toBe('2020-01-01T00:00:00.000Z');
      expect(clock.today()).toBe('2020-01-01');
    });

    it('refuses what is no instant in UTC, and stays where it was', () => {
      const clock = fixedClock();
      for (const instant of [
        '2026-11-14T10:00:00+01:00',
        '2026-11-14 10:00:00Z',
        '2026-11-14',
        '2026-02-30T10:00:00.000Z',
        '2026-11-14T24:00:00.000Z',
        'morgen',
        '',
      ]) {
        expect(() => {
          clock.setNow(instant);
        }, instant).toThrow();
      }
      expect(clock.now()).toBe('2026-11-14T10:00:00.000Z');
    });
  });

  describe('advance', () => {
    it('moves the time of day forward', () => {
      const clock = fixedClock();
      clock.advance({ hours: 4, minutes: 15 });
      expect(clock.now()).toBe('2026-11-14T14:15:00.000Z');
      clock.advance({ seconds: 30, milliseconds: 250 });
      expect(clock.now()).toBe('2026-11-14T14:15:30.250Z');
      clock.advance({ minutes: 90 });
      expect(clock.now()).toBe('2026-11-14T15:45:30.250Z');
      expect(clock.today()).toBe('2026-11-14');
    });

    it('carries the calendar day along past midnight', () => {
      const clock = fixedClock();
      clock.advance({ hours: 13 });
      expect(clock.now()).toBe('2026-11-14T23:00:00.000Z');
      expect(clock.today()).toBe('2026-11-15');
    });

    it('counts real time when the clocks change', () => {
      const clock = fixedClock();
      // 29.03.2026: at 02:00 the clocks in Switzerland jump to 03:00.
      clock.setNow('2026-03-29T00:30:00.000Z');
      expect(clock.today()).toBe('2026-03-29');
      clock.advance({ hours: 1 });
      expect(clock.now()).toBe('2026-03-29T01:30:00.000Z');
      expect(clock.today()).toBe('2026-03-29');
      clock.advance({ hours: 21 });
      // 22:30 UTC is 00:30 of the next day in summer time.
      expect(clock.today()).toBe('2026-03-30');
    });

    it('stands still for a step of nothing', () => {
      const clock = fixedClock();
      clock.advance({});
      clock.advance({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
      expect(clock.now()).toBe('2026-11-14T10:00:00.000Z');
    });

    it('adds up exactly: any steps equal one step of their sum', () => {
      const step = fc.record(
        {
          hours: fc.integer({ min: 0, max: 48 }),
          minutes: fc.integer({ min: 0, max: 600 }),
          seconds: fc.integer({ min: 0, max: 600 }),
          milliseconds: fc.integer({ min: 0, max: 5000 }),
        },
        { requiredKeys: [] },
      );
      fc.assert(
        fc.property(fc.array(step, { maxLength: 8 }), (steps) => {
          const stepwise = fixedClock();
          let total = 0;
          for (const by of steps) {
            stepwise.advance(by);
            total +=
              (by.hours ?? 0) * 3_600_000 +
              (by.minutes ?? 0) * 60_000 +
              (by.seconds ?? 0) * 1000 +
              (by.milliseconds ?? 0);
          }
          const atOnce = fixedClock();
          atOnce.advance({ milliseconds: total });
          expect(stepwise.now()).toBe(atOnce.now());
          expect(stepwise.today()).toBe(toLocalDate(stepwise.now()));
          expect(Date.parse(stepwise.now()) - Date.parse('2026-11-14T10:00:00.000Z')).toBe(total);
        }),
      );
    });

    it('refuses a step back, a fraction and what is no number, and stays where it was', () => {
      const clock = fixedClock();
      for (const by of [
        { minutes: -1 },
        { hours: 0.5 },
        { seconds: Number.NaN },
        { milliseconds: Number.POSITIVE_INFINITY },
        { hours: 1, minutes: -30 },
      ]) {
        expect(() => {
          clock.advance(by);
        }, JSON.stringify(by)).toThrow(RangeError);
      }
      expect(clock.now()).toBe('2026-11-14T10:00:00.000Z');
    });

    it('refuses to leave the years a calendar day can have, and stays where it was', () => {
      const clock = fixedClock('9999-12-31');
      expect(() => {
        clock.advance({ hours: 14 });
      }).toThrow(RangeError);
      expect(() => {
        clock.advance({ hours: Number.MAX_SAFE_INTEGER });
      }).toThrow(RangeError);
      expect(clock.now()).toBe('9999-12-31T10:00:00.000Z');
      clock.advance({ hours: 13, minutes: 59, seconds: 59, milliseconds: 999 });
      expect(clock.now()).toBe('9999-12-31T23:59:59.999Z');
    });
  });

  it('refuses a day that does not exist, at the start and later', () => {
    for (const day of ['2026-02-30', '14.11.2026', '2026-11-14T10:00:00.000Z', '', 'heute']) {
      expect(() => fixedClock(day), day).toThrow();
    }
    const clock = fixedClock();
    expect(() => {
      clock.setToday('2026-13-01');
    }).toThrow();
    expect(clock.today()).toBe('2026-11-14');
  });

  it('keeps each clock to itself', () => {
    const one = fixedClock();
    const two = fixedClock();
    one.setToday('2027-01-01');
    expect(two.today()).toBe('2026-11-14');
  });
});

import type { Id, IsoDateTime } from '@onestrand/core';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { DomainEventSchema, type DomainEvent } from '../src';
import { fixedClock, sequentialIds } from './support';

const ids = sequentialIds();
const clock = fixedClock();

function sample(): Record<string, unknown> {
  return {
    id: ids.next(),
    type: 'customer.created',
    version: 1,
    businessId: ids.next(),
    actor: ids.next(),
    at: clock.now(),
    payload: { customerId: ids.next(), fields: ['name'] },
  };
}

describe('DomainEventSchema', () => {
  it('accepts an event with who, when and small facts', () => {
    const event = sample();
    expect(DomainEventSchema.parse(event)).toEqual(event);
    expect(DomainEventSchema.parse({ ...sample(), payload: {} }).payload).toEqual({});
  });

  it.each(['customer.created', 'facility_key.issued', 'time_entry.clocked_in', 'a.b'])(
    'accepts the type %s',
    (type) => {
      expect(DomainEventSchema.safeParse({ ...sample(), type }).success).toBe(true);
    },
  );

  it.each([
    ['one word', 'created'],
    ['three parts', 'customer.address.changed'],
    ['camel case', 'customer.wasCreated'],
    ['an upper-case start', 'Customer.created'],
    ['a digit', 'customer2.created'],
    ['an underscore at the start', '_customer.created'],
    ['an empty part', 'customer.'],
    ['a blank', 'customer. created'],
    ['the name of an operation', 'customers.create.now'],
    ['an empty text', ''],
  ])('refuses a type that is %s', (_what, type) => {
    const result = DomainEventSchema.safeParse({ ...sample(), type });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ['type'],
      message: 'Expected thing.what_happened',
    });
  });

  it.each([
    ['another version', { version: 2 }, 'version'],
    ['no version', { version: undefined }, 'version'],
    ['an id that is no UUIDv7', { id: 'abc' }, 'id'],
    ['no business', { businessId: undefined }, 'businessId'],
    ['an actor by name', { actor: 'Person Eins' }, 'actor'],
    ['a calendar day as the time', { at: '2026-11-14' }, 'at'],
    ['a time with an offset', { at: '2026-11-14T10:00:00+01:00' }, 'at'],
    ['no payload', { payload: undefined }, 'payload'],
    ['a list as payload', { payload: ['customerId'] }, 'payload'],
    ['a text as payload', { payload: 'created' }, 'payload'],
  ])('refuses %s', (_what, change, field) => {
    const result = DomainEventSchema.safeParse({ ...sample(), ...change });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual([field]);
  });

  it('drops what is not part of an event', () => {
    expect(
      DomainEventSchema.parse({ ...sample(), row: { name: 'Betrieb Muster' } }),
    ).not.toHaveProperty('row');
  });

  it('types an event with branded ids and time', () => {
    expectTypeOf<DomainEvent>().toEqualTypeOf<{
      id: Id;
      type: string;
      version: 1;
      businessId: Id;
      actor: Id;
      at: IsoDateTime;
      payload: Record<string, unknown>;
    }>();
  });
});

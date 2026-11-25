import { NO_ACCESS_PROFILE, OWNER_PROFILE } from '@onestrand/access';
import { describe, expect, it } from 'vitest';
import { activeOwners, leavesNoOwner } from '../src';
import { MANAGER, personRow, seed } from './support';

describe('the rule that a business keeps an owner', async () => {
  const world = await seed();
  const owner = (id: string, active = true) =>
    personRow(world, id as typeof world.ownerId, id, OWNER_PROFILE, active);
  const a = owner(world.ownerId);
  const b = owner(world.ids.next());
  const manager = personRow(world, world.secondPersonId, 'Person Beispiel', MANAGER);

  it('counts the people who are active and hold the owner profile, and nobody who is deleted', () => {
    expect(activeOwners([a, b, manager])).toEqual([a, b]);
    expect(activeOwners([{ ...a, active: false }, manager])).toEqual([]);
    expect(activeOwners([{ ...a, deletedAt: world.clock.now() }, manager])).toEqual([]);
    expect(activeOwners([])).toEqual([]);
  });

  it('says a change leaves no owner when it takes the last one out of action or lowers them', () => {
    expect(leavesNoOwner([a, manager], { ...a, active: false })).toBe(true);
    expect(leavesNoOwner([a, manager], { ...a, profile: NO_ACCESS_PROFILE })).toBe(true);
    expect(leavesNoOwner([a, manager], { ...a, deletedAt: world.clock.now() })).toBe(true);
  });

  it('says it does not where another owner stays, where the change is of someone else, or where there was none', () => {
    expect(leavesNoOwner([a, b], { ...a, active: false })).toBe(false);
    expect(leavesNoOwner([a, manager], { ...manager, active: false })).toBe(false);
    expect(leavesNoOwner([a, manager], { ...a, name: 'Person Neu' })).toBe(false);
    expect(leavesNoOwner([manager], { ...manager, active: false })).toBe(false);
    expect(leavesNoOwner([{ ...a, active: false }], { ...a, active: false })).toBe(false);
  });
});

import { fieldSensitivity } from '@onestrand/storage';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { NO_ACCESS_PROFILE, OWNER_PROFILE, filterRowsForDevice } from '../src';
import {
  ALL_FEATURES,
  BUSINESS_ID,
  HEALTH_TABLE,
  STAFF_TABLE,
  contextOf,
  custom,
  customProfileArb,
  featuresOnArb,
  staffRow,
  type HealthRow,
} from './support';

const access = { feature: 'team', right: 'wages' } as const;
const rows = [staffRow(1, 'late'), staffRow(2)];

describe('filterRowsForDevice', () => {
  it('sends a person with the level and the right every field', () => {
    const context = contextOf(custom({ team: 'view' }, ['wages']));
    const result = filterRowsForDevice(STAFF_TABLE, access, rows, context);
    expect(result).toEqual({ allowed: true, rows, hiddenFields: [] });
  });

  it('leaves out the sensitive field for a person without the right, and keeps the rest', () => {
    const context = contextOf(custom({ team: 'view' }));
    const result = filterRowsForDevice(STAFF_TABLE, access, rows, context);
    expect(result.allowed).toBe(true);
    expect(result.hiddenFields).toEqual(['wage']);
    const [first, second] = result.rows;
    expect(first).toEqual({
      id: rows[0]?.id,
      businessId: BUSINESS_ID,
      name: 'Person 1',
      createdAt: rows[0]?.createdAt,
      updatedAt: rows[0]?.updatedAt,
      note: 'late',
    });
    expect(second).not.toHaveProperty('wage');
    expect(second).toHaveProperty('name', 'Person 2');
  });

  it('sends internal fields with the level view: they are kept from third parties, not from the people of the business', () => {
    const result = filterRowsForDevice(
      STAFF_TABLE,
      access,
      rows,
      contextOf(custom({ team: 'view' })),
    );
    expect(result.rows[0]).toHaveProperty('note', 'late');
  });

  it('sends the owner everything, whatever right the table names', () => {
    for (const right of [undefined, 'wages', 'later_right']) {
      const tableAccess = right === undefined ? { feature: 'team' } : { feature: 'team', right };
      const result = filterRowsForDevice(STAFF_TABLE, tableAccess, rows, contextOf(OWNER_PROFILE));
      expect(result).toEqual({ allowed: true, rows, hiddenFields: [] });
    }
  });

  it('hides the sensitive field from everyone but the owner where the table names no right', () => {
    const context = contextOf(custom({ team: 'manage' }, ['wages']));
    const result = filterRowsForDevice(STAFF_TABLE, { feature: 'team' }, rows, context);
    expect(result.hiddenFields).toEqual(['wage']);
  });

  it('sends nothing at all of a table whose function the profile does not see', () => {
    const none = { allowed: false, rows: [], hiddenFields: [] };
    expect(filterRowsForDevice(STAFF_TABLE, access, rows, contextOf(NO_ACCESS_PROFILE))).toEqual(
      none,
    );
    expect(
      filterRowsForDevice(
        STAFF_TABLE,
        access,
        rows,
        contextOf(custom({ jobs: 'manage' }, ['wages'])),
      ),
    ).toEqual(none);
  });

  it('sends nothing of a function that is switched off, not even to the owner', () => {
    const off = ALL_FEATURES.filter((id) => id !== 'team');
    const result = filterRowsForDevice(STAFF_TABLE, access, rows, contextOf(OWNER_PROFILE, off));
    expect(result).toEqual({ allowed: false, rows: [], hiddenFields: [] });
  });

  it('sends nothing of a table that is sensitive as a whole to a person without the right', () => {
    const health: HealthRow[] = [{ id: staffRow(1).id, businessId: BUSINESS_ID, text: 'x' }];
    const tableAccess = { feature: 'team', right: 'muster.access_notes' };
    const without = contextOf(custom({ team: 'manage' }, ['wages']));
    expect(filterRowsForDevice(HEALTH_TABLE, tableAccess, health, without)).toEqual({
      allowed: false,
      rows: [],
      hiddenFields: [],
    });
    // A field that says it is less delicate does not open the table.
    expect(HEALTH_TABLE.fields.text).toBe('normal');
    const withRight = contextOf(custom({ team: 'view' }, ['muster.access_notes']));
    expect(filterRowsForDevice(HEALTH_TABLE, tableAccess, health, withRight)).toEqual({
      allowed: true,
      rows: health,
      hiddenFields: [],
    });
    expect(
      filterRowsForDevice(HEALTH_TABLE, tableAccess, health, contextOf(OWNER_PROFILE)).allowed,
    ).toBe(true);
  });

  it('does not change the rows it is given, and makes new ones', () => {
    const before = structuredClone(rows);
    const result = filterRowsForDevice(
      STAFF_TABLE,
      access,
      rows,
      contextOf(custom({ team: 'view' })),
    );
    expect(rows).toEqual(before);
    expect(result.rows[0]).not.toBe(rows[0]);
    const all = filterRowsForDevice(STAFF_TABLE, access, rows, contextOf(OWNER_PROFILE));
    expect(all.rows[0]).not.toBe(rows[0]);
  });

  it('sends no rows where there are none', () => {
    expect(
      filterRowsForDevice(STAFF_TABLE, access, [], contextOf(custom({ team: 'view' }))),
    ).toEqual({ allowed: true, rows: [], hiddenFields: [] });
  });

  it('names a hidden field once, in the order it was met', () => {
    const wide = [{ ...staffRow(1), extra: 1 }];
    const result = filterRowsForDevice(
      STAFF_TABLE,
      access,
      [...rows, ...wide],
      contextOf(custom({ team: 'view' })),
    );
    expect(result.hiddenFields).toEqual(['wage']);
  });
});

describe('the rules that hold for any profile, table access and rows', () => {
  const rowsArb = fc.array(
    fc.record({
      n: fc.integer({ min: 1, max: 9 }),
      note: fc.option(fc.string(), { nil: undefined }),
    }),
    { maxLength: 4 },
  );
  const rightArb = fc.option(fc.constantFrom('wages', 'export_delete'), { nil: undefined });

  it('never lets a sensitive field leave without the right', () => {
    fc.assert(
      fc.property(
        customProfileArb,
        rightArb,
        featuresOnArb,
        rowsArb,
        (profile, right, on, data) => {
          const tableAccess =
            right === undefined ? { feature: 'team' } : { feature: 'team', right };
          const sent = filterRowsForDevice(
            STAFF_TABLE,
            tableAccess,
            data.map(({ n, note }) => staffRow(n, note)),
            contextOf(profile, on),
          );
          const mayHave = right !== undefined && profile.rights.includes(right);
          for (const row of sent.rows) {
            for (const field of Object.keys(row)) {
              if (fieldSensitivity(STAFF_TABLE, field) === 'sensitive') {
                expect(mayHave, field).toBe(true);
              }
            }
          }
        },
      ),
    );
  });

  it('sends nothing where the profile has no level in the function or the function is off', () => {
    fc.assert(
      fc.property(customProfileArb, featuresOnArb, (profile, on) => {
        const sent = filterRowsForDevice(
          STAFF_TABLE,
          { feature: 'team' },
          rows,
          contextOf(profile, on),
        );
        if (profile.levels.team === undefined || !on.includes('team')) {
          expect(sent.allowed).toBe(false);
          expect(sent.rows).toEqual([]);
        } else {
          expect(sent.rows).toHaveLength(rows.length);
        }
      }),
    );
  });

  it('sends every row with its id and business, or no row at all', () => {
    fc.assert(
      fc.property(customProfileArb, featuresOnArb, (profile, on) => {
        const sent = filterRowsForDevice(STAFF_TABLE, access, rows, contextOf(profile, on));
        for (const [index, row] of sent.rows.entries()) {
          expect(row.id).toBe(rows[index]?.id);
          expect(row.businessId).toBe(BUSINESS_ID);
        }
      }),
    );
  });
});

import { fieldSensitivity, type StoredRow, type TableDefinition } from '@onestrand/storage';
import { decideAccess, type AccessContext } from './decide';
import { holdsRight, isOwner } from './profile';

/**
 * The filter for other devices (suite ADR-0005, 9; rule R-4): what a person may not see does not
 * leave this device either. It reads the same rights as the guard, so a person gets on another
 * device what the person could see here, never more. Only the function lives here; the
 * reconciliation between devices (suite ADR-0006) comes later and calls it for every table
 * before it sends.
 */

/**
 * What a table does not say about itself and the filter needs: the function it belongs to, and
 * the delicate right that opens its sensitive parts. The register of tables knows neither (debt
 * TD-70); the edition or the module that sends passes them.
 */
export interface TableAccess {
  /** The id of the function the table belongs to. */
  feature: string;
  /**
   * The delicate right that opens the sensitive parts of the table: the whole table where it is
   * `sensitive`, single fields where `fields` makes them so. Without one only the owner sees them.
   */
  right?: string;
}

/** What may be sent. */
export interface DeviceRows<TRow extends StoredRow> {
  /** False: nothing of this table may be sent, `rows` is empty. */
  readonly allowed: boolean;
  /** The rows, each with the fields that may be sent; `id` and `businessId` always stay. */
  readonly rows: readonly Partial<TRow>[];
  /** The fields left out of at least one row, in the order they were met. */
  readonly hiddenFields: readonly string[];
}

const STRUCTURAL_FIELDS: readonly string[] = ['id', 'businessId'];

/**
 * Takes out of the rows of a table what a profile may not see, before they go to another device.
 *
 * - The function is off, or the profile has no level in it: nothing is sent (`allowed: false`).
 * - The table is `sensitive` and the profile lacks the right: nothing is sent. A field that
 *   `fields` makes less delicate does not open a sensitive table.
 * - Otherwise each row goes without the fields that are `sensitive` (by `fieldSensitivity`) and
 *   the profile lacks the right for. `normal` and `internal` fields go with the level `view`:
 *   `internal` keeps data from third parties, not from the people of the business.
 *
 * The owner holds every right. The rows given are not changed.
 */
export function filterRowsForDevice<TRow extends StoredRow>(
  table: TableDefinition<string, TRow>,
  access: TableAccess,
  rows: readonly TRow[],
  context: AccessContext,
): DeviceRows<TRow> {
  const nothing: DeviceRows<TRow> = { allowed: false, rows: [], hiddenFields: [] };
  if (!decideAccess({ feature: access.feature, level: 'view' }, context).allowed) {
    return nothing;
  }
  const mayHaveSensitive =
    isOwner(context.profile) ||
    (access.right !== undefined && holdsRight(context.profile, access.right));
  if (table.sensitivity === 'sensitive' && !mayHaveSensitive) {
    return nothing;
  }
  const hidden = new Set<string>();
  const sent = rows.map((row) => {
    const kept: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(row)) {
      if (
        STRUCTURAL_FIELDS.includes(field) ||
        mayHaveSensitive ||
        fieldSensitivity(table, field) !== 'sensitive'
      ) {
        kept[field] = value;
      } else {
        hidden.add(field);
      }
    }
    return kept as Partial<TRow>;
  });
  return { allowed: true, rows: sent, hiddenFields: [...hidden] };
}

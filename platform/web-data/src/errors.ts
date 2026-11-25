import type { SchemaProblem } from './schema-ledger';

/**
 * What the database of the browser refuses, as a code. These are not the refusals of the storage
 * ports (`StorageError` of `@onestrand/storage`, which this adapter throws exactly where the
 * storage in memory does): they are what only a database on a device can run into.
 *
 * - `unavailable`: the browser gives no IndexedDB (or no storage for the device).
 * - `invalid_ledger`: the schema ledger does not fit the tables; `problems` says how.
 * - `downgrade`: the database on the device was written by a newer version of the app than the
 *   one that opens it (its version is higher than the number of steps of the ledger).
 * - `migration`: the upgrade of the database failed: a migration threw, or returned a row that
 *   lost its id or its business. The database stays as it was.
 * - `quota`: the device has no room left.
 * - `closed`: the connection was closed, by the app or because another tab upgraded the database.
 * - `failed`: any other refusal of the database; `cause` holds the original error.
 */
export type WebDataErrorCode =
  'unavailable' | 'invalid_ledger' | 'downgrade' | 'migration' | 'quota' | 'closed' | 'failed';

/** Every error of this package carries a code, so callers never read the message. */
export class WebDataError extends Error {
  readonly code: WebDataErrorCode;
  /** What is wrong with the schema ledger, for `invalid_ledger`. */
  readonly problems: readonly SchemaProblem[];

  constructor(
    code: WebDataErrorCode,
    message: string,
    options: { cause?: unknown; problems?: readonly SchemaProblem[] } = {},
  ) {
    super(message, 'cause' in options ? { cause: options.cause } : undefined);
    this.name = 'WebDataError';
    this.code = code;
    this.problems = options.problems ?? [];
  }
}

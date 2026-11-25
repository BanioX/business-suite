import { StorageError } from '@onestrand/storage';
import { WebDataError } from './errors';

/**
 * The small part of the IndexedDB API every other file of this package leans on: a request as a
 * promise, a transaction as a promise, and the refusals of the database as the errors of this
 * suite. Nothing here knows a table.
 */

/** The result of a request, as soon as the database has it. */
export function resultOf(request: IDBRequest): Promise<unknown> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('The request of the database failed'));
    };
  });
}

/**
 * Settles when the transaction is over: resolved if it committed, rejected with its error if it
 * was aborted, by a refused request or by the browser. Call it before the first request is
 * placed, so no event is missed.
 */
export function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error('The transaction of the database was aborted'));
    };
  });
}

/** What the database gives for a list: always a list, whatever the browser answers. */
export function listOf(value: unknown): unknown[] {
  return Array.isArray(value) ? (value as unknown[]) : [];
}

/** The name of an error of the database (`ConstraintError`, `QuotaExceededError`), if it has one. */
function nameOf(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'name' in error
    ? String(error.name)
    : undefined;
}

/**
 * An error of the database as an error of this suite: a row that exists already is what the
 * storage ports call `exists`, a full device is `quota`, a connection that is closed is
 * `closed`, anything else is `failed` with the original error as its cause. What already is an
 * error of this suite passes unchanged.
 */
export function asSuiteError(error: unknown): StorageError | WebDataError {
  if (error instanceof StorageError || error instanceof WebDataError) {
    return error;
  }
  switch (nameOf(error) ?? '') {
    case 'ConstraintError':
      return new StorageError(
        'exists',
        'A row, event, command or file with this id exists already',
      );
    case 'QuotaExceededError':
      return new WebDataError('quota', 'The device has no room left for the data', {
        cause: error,
      });
    case 'InvalidStateError':
      return new WebDataError('closed', 'The database is closed', { cause: error });
    default:
      return new WebDataError(
        'failed',
        `The database refused: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
  }
}

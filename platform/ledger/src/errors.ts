/**
 * What the ledger kit itself refuses, as a code. These are mistakes of the program, not of the
 * person: what a person can act on (an entry that is not there, one that was corrected already)
 * is a `CommandError` of the contract, and whatever the rules of a ledger refuse is thrown by
 * its own `reduce`.
 *
 * - `invalid_definition`: a ledger was defined on a table that cannot carry one, or its schema
 *   changes a field the kit writes.
 * - `invalid_stream`: the key of a stream is malformed (see `LEDGER_STREAM_PATTERN`).
 * - `invalid_payload`: the payload is no plain record, or it carries a field the kit writes.
 */
export type LedgerErrorCode = 'invalid_definition' | 'invalid_stream' | 'invalid_payload';

/** Every error of the kit carries a code, so callers never read the message. */
export class LedgerError extends Error {
  readonly code: LedgerErrorCode;

  constructor(code: LedgerErrorCode, message: string) {
    super(message);
    this.name = 'LedgerError';
    this.code = code;
  }
}

/**
 * What the storage itself refuses, as a code. These are mistakes of the program, not of the
 * person: a use case turns what a person can act on into a `CommandError` of the contract.
 *
 * - `invalid_table`: a table definition breaks a rule of the register.
 * - `duplicate_table`: two tables of one register share a name.
 * - `unknown_table`: the register has no table of this name.
 * - `exists`: a row, business, event, command or file with this id is stored already.
 * - `append_only`: a row of an append-only table would be replaced.
 * - `other_business`: a row would be taken over by another business.
 * - `not_plain`: the value is not plain data, so a backup could not carry it.
 * - `checksum`: the bytes of a file do not match its checksum or its size.
 */
export type StorageErrorCode =
  | 'invalid_table'
  | 'duplicate_table'
  | 'unknown_table'
  | 'exists'
  | 'append_only'
  | 'other_business'
  | 'not_plain'
  | 'checksum';

/** Every error of the storage carries a code, so callers never read the message. */
export class StorageError extends Error {
  readonly code: StorageErrorCode;

  constructor(code: StorageErrorCode, message: string) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
  }
}

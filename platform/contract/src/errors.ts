// Origin: BanioX/Randen packages/core/src/application/command.ts @ e0f0907 — adapted: only the error of a command; neutral codes of the platform plus namespaced codes of modules and industries, checked at runtime
/**
 * The codes every module and every industry shares. A code says what went wrong in a way a
 * person can act on; the app turns it into a sentence of its language catalogue.
 *
 * - `not_found`: the row does not exist, belongs to another business or was deleted.
 * - `invalid`: the input is well formed but makes no sense here (an end before its start).
 * - `duplicate_name`: another row already has this name.
 * - `in_use`: the row is still used elsewhere and cannot be removed.
 * - `not_allowed`: the row is in a state that does not allow the command (a signed document).
 * - `forbidden`: the person acting has no right to do this.
 */
export const PLATFORM_ERROR_CODES = [
  'not_found',
  'invalid',
  'duplicate_name',
  'in_use',
  'not_allowed',
  'forbidden',
] as const;
export type PlatformErrorCode = (typeof PLATFORM_ERROR_CODES)[number];

/**
 * A code of one module or one industry: `<namespace>.<code>`, e.g. `stock.insufficient`. The
 * namespace is the one of its operations, so two modules can never mean different things by
 * the same code.
 *
 * The type only asks for a dot. The exact form is `NAMESPACED_ERROR_CODE_PATTERN`, checked when
 * the error is made: a code such as `stock.notEnough` compiles and then throws a `TypeError`
 * instead of the error it was meant for. A module keeps its codes in one list and tests them
 * with `isCommandErrorCode`.
 */
export type NamespacedErrorCode = `${string}.${string}`;

/**
 * The form of a namespaced code: the namespace as in the name of an operation, one dot, the
 * code in lower-case words joined by underscores.
 */
export const NAMESPACED_ERROR_CODE_PATTERN = /^[a-z][a-zA-Z0-9]*\.[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

export type CommandErrorCode = PlatformErrorCode | NamespacedErrorCode;

const PLATFORM_CODES: ReadonlySet<string> = new Set(PLATFORM_ERROR_CODES);

/** True for a code of the platform and for a well-formed namespaced code, false for all else. */
export function isCommandErrorCode(value: unknown): value is CommandErrorCode {
  return (
    typeof value === 'string' &&
    (PLATFORM_CODES.has(value) || NAMESPACED_ERROR_CODE_PATTERN.test(value))
  );
}

/**
 * An error a person can do something about; the UI turns the code into a sentence. The message
 * is for logs and tests, in English, and is never shown.
 */
export class CommandError extends Error {
  readonly code: CommandErrorCode;

  constructor(code: CommandErrorCode, message: string) {
    if (!isCommandErrorCode(code)) {
      // A code nobody can translate would reach the person as a blank; fail where it is made.
      throw new TypeError(
        `Unknown error code ${JSON.stringify(code)}: use a code of the platform or <namespace>.<code>`,
      );
    }
    super(message);
    this.name = 'CommandError';
    this.code = code;
  }
}

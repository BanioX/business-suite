/**
 * The form and the check digits of an IBAN (ISO 13616), as pure functions. The business keeps
 * its account for the QR payment slip as an IBAN; a typo in it is a payment that goes astray, so
 * the form and the check digits are checked before it is stored.
 *
 * What is checked is the standard of every IBAN: two letters, two check digits, 11 to 30 letters
 * or digits, and the check digits themselves (modulo 97). Which countries and lengths a payment
 * slip takes is a rule of the invoice, not of the business; it is not decided here.
 */

/** What can be wrong with an IBAN. */
export const IBAN_PROBLEMS = ['form', 'check_digits'] as const;
export type IbanProblem = (typeof IBAN_PROBLEMS)[number];

/** The stored form: capitals, no spaces. */
export const IBAN_PATTERN = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;

/** The text of a person as the stored form: spaces (also non-breaking ones) taken out, capitals. */
export function normalizeIban(text: string): string {
  return text.replaceAll(/\s+/g, '').toUpperCase();
}

const LETTER_A = 'A'.charCodeAt(0);

/** The remainder of the IBAN modulo 97, with the first four characters moved to the end. */
function remainderOf(iban: string): number {
  let remainder = 0;
  for (const character of iban.slice(4) + iban.slice(0, 4)) {
    // Digits stand for themselves, letters for 10 (A) to 35 (Z); two digits for a letter.
    const value = character >= 'A' ? character.charCodeAt(0) - LETTER_A + 10 : Number(character);
    remainder = Number(`${String(remainder)}${String(value)}`) % 97;
  }
  return remainder;
}

/**
 * What is wrong with an IBAN as a person typed it, or nothing. Spaces and small letters are
 * accepted (`normalizeIban`). `form` is the shape of the text, `check_digits` a text of the right
 * shape whose check digits do not fit: a digit mistyped or two digits swapped.
 */
export function ibanProblem(text: string): IbanProblem | undefined {
  const iban = normalizeIban(text);
  if (!IBAN_PATTERN.test(iban)) {
    return 'form';
  }
  return remainderOf(iban) === 1 ? undefined : 'check_digits';
}

/** Whether the text is an IBAN with the right form and the right check digits. */
export function isValidIban(text: string): boolean {
  return ibanProblem(text) === undefined;
}

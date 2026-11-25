import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { IBAN_PATTERN, IBAN_PROBLEMS, ibanProblem, isValidIban, normalizeIban } from '../src';

/** Independent of the code under test: the check digits by BigInt, as the standard describes them. */
function withCheckDigits(country: string, basic: string): string {
  const digits = Array.from(`${basic}${country}00`)
    .map((character) => (character >= 'A' ? String(character.charCodeAt(0) - 55) : character))
    .join('');
  const check = 98n - (BigInt(digits) % 97n);
  return `${country}${String(check).padStart(2, '0')}${basic}`;
}

describe('ibanProblem', () => {
  it.each([
    'CH93 0076 2011 6238 5295 7',
    'CH9300762011623852957',
    'ch93 0076 2011 6238 5295 7',
    'DE89 3704 0044 0532 0130 00',
    'GB82 WEST 1234 5698 7654 32',
    'CH93\u00a00076\u00a02011\u00a06238\u00a05295\u00a07',
  ])('accepts the example %s', (text) => {
    expect(ibanProblem(text)).toBeUndefined();
    expect(isValidIban(text)).toBe(true);
  });

  it.each([
    ['', 'form'],
    ['CH93', 'form'],
    ['9300 7620 1162 3852 957', 'form'],
    ['CH93 0076 2011 6238 5295 7!', 'form'],
    ['CH93 0076 2011', 'form'],
    ['XX00 ' + 'A'.repeat(31), 'form'],
    ['CH93 0076 2011 6238 5295 8', 'check_digits'],
    ['CH94 0076 2011 6238 5295 7', 'check_digits'],
    ['CH93 0076 2011 6238 5925 7', 'check_digits'],
  ])('names what is wrong with %j: %s', (text, problem) => {
    expect(ibanProblem(text)).toBe(problem);
    expect(isValidIban(text)).toBe(false);
  });

  it('knows these problems', () => {
    expect(IBAN_PROBLEMS).toEqual(['form', 'check_digits']);
  });

  it('accepts every IBAN with check digits worked out by the standard', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Z]{2}$/),
        fc.stringMatching(/^[A-Z0-9]{11,30}$/),
        (country, basic) => {
          const iban = withCheckDigits(country, basic);
          expect(ibanProblem(iban)).toBeUndefined();
          expect(IBAN_PATTERN.test(iban)).toBe(true);
        },
      ),
    );
  });

  it('refuses an IBAN in which one character is changed, wherever it is', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Z0-9]{11,30}$/),
        fc.nat(),
        fc.integer({ min: 1, max: 9 }),
        (basic, at, shift) => {
          const iban = withCheckDigits('CH', basic);
          // A digit of the part after the country and check digits, moved by `shift` places.
          const position = 4 + (at % basic.length);
          const character = iban[position] ?? '0';
          const changed = /\d/.test(character)
            ? String((Number(character) + shift) % 10)
            : character === 'A'
              ? 'B'
              : 'A';
          const broken = iban.slice(0, position) + changed + iban.slice(position + 1);
          expect(ibanProblem(broken)).toBe('check_digits');
        },
      ),
    );
  });
});

describe('normalizeIban', () => {
  it('takes out every kind of space and writes capitals', () => {
    expect(normalizeIban(' ch93 0076\t2011\u00a06238 5295 7 ')).toBe('CH9300762011623852957');
    expect(normalizeIban('')).toBe('');
  });

  it('makes a stored form that the pattern takes', () => {
    expect(IBAN_PATTERN.test(normalizeIban('CH93 0076 2011 6238 5295 7'))).toBe(true);
    expect(IBAN_PATTERN.test('CH93 0076 2011 6238 5295 7')).toBe(false);
  });
});

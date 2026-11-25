import fc from 'fast-check';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  CommandError,
  isCommandErrorCode,
  NAMESPACED_ERROR_CODE_PATTERN,
  PLATFORM_ERROR_CODES,
  type CommandErrorCode,
  type NamespacedErrorCode,
  type PlatformErrorCode,
} from '../src';

describe('codes of the platform', () => {
  it('are these six, neutral for every industry', () => {
    expect(PLATFORM_ERROR_CODES).toEqual([
      'not_found',
      'invalid',
      'duplicate_name',
      'in_use',
      'not_allowed',
      'forbidden',
    ]);
    expectTypeOf<PlatformErrorCode>().toEqualTypeOf<
      'not_found' | 'invalid' | 'duplicate_name' | 'in_use' | 'not_allowed' | 'forbidden'
    >();
  });

  it.each(PLATFORM_ERROR_CODES)('accepts %s', (code) => {
    expect(isCommandErrorCode(code)).toBe(true);
    const error = new CommandError(code, 'Something is wrong');
    expect(error.code).toBe(code);
  });
});

describe('codes of a module or an industry', () => {
  it.each([
    'stock.insufficient',
    'facility.key_not_returned',
    'teamTime.day_closed',
    'invoicing.number_taken',
    'a.b',
    'jobs2.step_3_missing',
  ])('accepts %s', (code) => {
    expect(isCommandErrorCode(code)).toBe(true);
    expect(NAMESPACED_ERROR_CODE_PATTERN.test(code)).toBe(true);
    expect(new CommandError(code as NamespacedErrorCode, 'Something is wrong').code).toBe(code);
  });

  it.each([
    ['a code of one industry without its namespace', 'insufficient_stock'],
    ['a misspelt code of the platform', 'not_fond'],
    ['a code of the platform in upper case', 'NOT_FOUND'],
    ['a code of the platform with blanks', ' invalid '],
    ['an empty text', ''],
    ['a dot only', '.'],
    ['no namespace', '.insufficient'],
    ['no code', 'stock.'],
    ['two dots', 'facility.keys.not_returned'],
    ['a code in camel case', 'stock.notEnough'],
    ['a namespace in upper case', 'Stock.insufficient'],
    ['a namespace with an underscore', 'team_time.day_closed'],
    ['a code that starts with a digit', 'stock.2low'],
    ['a code that ends with an underscore', 'stock.insufficient_'],
    ['a double underscore', 'stock.not__enough'],
    ['a sentence', 'stock.not enough'],
    ['a line break at the end', 'stock.insufficient\n'],
    ['an accent', 'stock.insufficiént'],
  ])('refuses %s', (_what, code) => {
    expect(isCommandErrorCode(code)).toBe(false);
    expect(() => new CommandError(code as CommandErrorCode, 'Something is wrong')).toThrow(
      TypeError,
    );
    expect(() => new CommandError(code as CommandErrorCode, 'Something is wrong')).toThrow(
      `Unknown error code ${JSON.stringify(code)}: use a code of the platform or <namespace>.<code>`,
    );
  });

  it.each([[undefined], [null], [404], [true], [{ code: 'invalid' }], [['invalid']]])(
    'refuses %j, which is no text',
    (code) => {
      expect(isCommandErrorCode(code)).toBe(false);
      expect(() => new CommandError(code as unknown as CommandErrorCode, 'Wrong')).toThrow(
        TypeError,
      );
    },
  );

  it('agrees with the rule written out, for any text', () => {
    const platform: readonly string[] = PLATFORM_ERROR_CODES;
    const byRule = (code: string) => {
      const [namespace, name, ...rest] = code.split('.');
      return (
        platform.includes(code) ||
        (rest.length === 0 &&
          namespace !== undefined &&
          name !== undefined &&
          /^[a-z][a-zA-Z0-9]*$/.test(namespace) &&
          name.split('_').every((word) => /^[a-z0-9]+$/.test(word)) &&
          /^[a-z]/.test(name))
      );
    };
    const piece = fc.stringMatching(/^[a-zA-Z0-9_\n -]{0,8}$/);
    fc.assert(
      fc.property(fc.array(piece, { minLength: 0, maxLength: 3 }), (pieces) => {
        const code = pieces.join('.');
        expect(isCommandErrorCode(code)).toBe(byRule(code));
      }),
    );
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.constantFrom(...platform)), (code) => {
        expect(isCommandErrorCode(code)).toBe(byRule(code));
      }),
    );
  });

  it('are told apart by type', () => {
    expectTypeOf<'not_found'>().toExtend<CommandErrorCode>();
    expectTypeOf<'stock.insufficient'>().toExtend<CommandErrorCode>();
    expectTypeOf<'insufficient_stock'>().not.toExtend<CommandErrorCode>();
    expectTypeOf<'not_fond'>().not.toExtend<CommandErrorCode>();
    expectTypeOf<string>().not.toExtend<CommandErrorCode>();
    // @ts-expect-error -- a code of one industry needs its namespace
    expect(() => new CommandError('insufficient_stock', 'Not enough')).toThrow(TypeError);

    const value: unknown = 'stock.insufficient';
    if (isCommandErrorCode(value)) {
      expectTypeOf(value).toEqualTypeOf<CommandErrorCode>();
    }
  });
});

describe('CommandError', () => {
  it('is an error with a code, a name and a message for logs', () => {
    const error = new CommandError('not_found', 'Customer 123 not found');
    expect(error).toBeInstanceOf(CommandError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('CommandError');
    expect(error.code).toBe('not_found');
    expect(error.message).toBe('Customer 123 not found');
    expect(String(error)).toBe('CommandError: Customer 123 not found');
    expect(error.stack).toContain('errors.test.ts');
    expectTypeOf(error.code).toEqualTypeOf<CommandErrorCode>();
  });

  it('can be told from other errors where it is caught', async () => {
    const failing = () => Promise.reject(new CommandError('forbidden', 'No right to export'));
    await expect(failing()).rejects.toMatchObject({ name: 'CommandError', code: 'forbidden' });
    await expect(failing()).rejects.toBeInstanceOf(CommandError);
    expect(new Error('forbidden')).not.toBeInstanceOf(CommandError);
    expect(new TypeError('invalid')).not.toHaveProperty('code');
  });
});

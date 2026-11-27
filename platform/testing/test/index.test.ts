import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as testing from '../src';
import {
  createTestContext,
  securityProblems,
  sideEffectRegisterProblems,
  textProblems,
} from '../src';
import { REGISTRY } from './support';

/**
 * The public surface, name by name. Every later package, industry and edition proves the rules
 * of the suite with it: a name that disappears or appears here is a decision, not an accident.
 * Types are not listed; `tsc` guards them where they are used.
 */
describe('@onestrand/testing', () => {
  it('exports exactly these values', () => {
    expect(Object.keys(testing).sort()).toEqual(
      [
        // ids, clock and hasher for tests
        'sequentialIds',
        'fixedClock',
        'sha256Hex',
        'testHasher',
        // the lean seed
        'createTestContext',
        'businessSnapshot',
        // standard test of texts
        'DE_CH_TEXT_RULES',
        'DE_CH_OPENING_SIE_RULE',
        'productNameRule',
        'catalogueTexts',
        'textProblems',
        // standard test of side effects
        'SIDE_EFFECT_KINDS',
        'REGISTER_COLUMNS',
        'withoutComments',
        'occurrences',
        'parseRegister',
        'registerProblems',
        'sideEffectProblems',
        'storageKeys',
        'storageKeyProblems',
        'sideEffectRegisterProblems',
        // standard test of security
        'parseHeadersFile',
        'headerProblems',
        'htmlProblems',
        'securityProblems',
      ].sort(),
    );
  });

  it('holds no register of tables and no business of its own: the caller brings the register', () => {
    const registers = Object.values(testing).filter(
      (value) => typeof value === 'object' && 'tables' in value && 'names' in value,
    );
    expect(registers).toEqual([]);
  });

  it('shares its lists of rules and kinds frozen: no test changes the standard for the next', () => {
    const { DE_CH_TEXT_RULES, DE_CH_OPENING_SIE_RULE, SIDE_EFFECT_KINDS, REGISTER_COLUMNS } =
      testing;
    for (const list of [DE_CH_TEXT_RULES, SIDE_EFFECT_KINDS, REGISTER_COLUMNS]) {
      expect(Object.isFrozen(list)).toBe(true);
      expect(list.every((entry) => Object.isFrozen(entry))).toBe(true);
    }
    expect(Object.isFrozen(DE_CH_OPENING_SIE_RULE)).toBe(true);
    expect(() => {
      (DE_CH_TEXT_RULES as testing.TextRule[]).push(DE_CH_OPENING_SIE_RULE);
    }).toThrow(TypeError);
    const [first] = SIDE_EFFECT_KINDS as testing.SideEffectKind[];
    expect(() => {
      if (first !== undefined) {
        first.key = 'other';
      }
    }).toThrow(TypeError);
    expect(first?.key).toBe('fetch(');
  });

  it('names no product: the lists of names come from the caller', () => {
    const texts = Object.values(testing).filter((value) => typeof value === 'string');
    expect(texts).toEqual([]);
  });
});

/**
 * The package is pure like the layers below it: the typecheck of `src` proves it by type, this
 * test by running the seed and the three standard tests where the globals of a runtime are gone.
 */
describe('the package without the globals of a runtime', () => {
  const RUNTIME_GLOBALS = [
    'crypto',
    'TextEncoder',
    'TextDecoder',
    'btoa',
    'atob',
    'structuredClone',
    'Buffer',
    'process',
  ] as const;

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('seeds a business, stores a file with its checksum and runs the standard tests', async () => {
    const bytes = Uint8Array.of(0, 255, 128, 7);
    // Computed by the runtime before its globals go.
    const expected = createHash('sha256').update(bytes).digest('hex');
    for (const name of RUNTIME_GLOBALS) {
      vi.stubGlobal(name, undefined);
    }
    // Nothing is asserted in here: the test runner itself may need what was taken away.
    const run = async () => {
      const t = await createTestContext({ registry: REGISTRY });
      const other = await t.addBusiness();
      const file = await t.storage.files.put({
        businessId: t.businessId,
        bytes,
        mediaType: 'image/png',
      });
      t.clock.advance({ minutes: 5 });
      return {
        sha256: file.sha256,
        verified: await t.storage.files.verify(file.id),
        files: (await t.snapshot()).files.length,
        others: (await other.snapshot()).files.length,
        texts: textProblems({ a: 'Gesichert!' }).length,
        sideEffects: sideEffectRegisterProblems([{ path: 'a.ts', code: 'fetch(url);' }], '').length,
        security: securityProblems({ headers: '', html: '' }).length,
      };
    };
    const result = await run().catch((error: unknown) => ({ problem: String(error) }));
    vi.unstubAllGlobals();

    expect(result).toEqual({
      sha256: expected,
      verified: true,
      files: 1,
      others: 0,
      texts: 1,
      sideEffects: 2,
      security: 9,
    });
  });
});

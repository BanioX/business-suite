import type { ContractFragment, UseCasesOf } from '@onestrand/contract';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadSubject, switchedOffConformity } from '../src/conformity.ts';
import { REPO_ROOT } from '../src/repo-files.ts';

// The step switched-off asks the edition, not the industry: the guard of the platform refuses
// an operation of a function that is off, and `business.features.switch` turns it off. Neither
// can be broken from inside an industry, so these tests break them here, in this file only, and
// hold that the step goes red; a check that cannot fail would stay green. The guard of
// `@onestrand/access` is wrapped, for every package that imports it (`@onestrand/manifest`
// guards the use cases of an edition with it).

const breakage = vi.hoisted(() => ({ mode: 'none' as 'none' | 'open' | 'stuck' }));

vi.mock('@onestrand/access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@onestrand/access')>();
  function guardUseCases<TContract extends ContractFragment>(
    contract: TContract,
    useCases: UseCasesOf<TContract>,
    source: Parameters<typeof actual.guardUseCases>[2],
  ): UseCasesOf<TContract> {
    const guarded = actual.guardUseCases(contract, useCases, source) as Record<
      string,
      (input: unknown) => Promise<unknown>
    >;
    const raw = useCases as Readonly<Record<string, (input: unknown) => Promise<unknown>>>;
    const changed = Object.fromEntries(
      Object.entries(guarded).map(([name, run]): [string, (input: unknown) => Promise<unknown>] => {
        if (breakage.mode === 'open' && name.startsWith('muster.')) {
          // A guard that lets the operations of the industry through, whatever is switched off.
          return [name, (input) => raw[name]?.(input) ?? Promise.reject(new Error(name))];
        }
        if (breakage.mode === 'stuck' && name === 'business.features.switch') {
          // A switch that says it turned nothing off, and does nothing.
          return [name, () => Promise.resolve({ turnedOff: [] })];
        }
        return [name, run];
      }),
    );
    return changed as UseCasesOf<TContract>;
  }
  return { ...actual, guardUseCases };
});

const muster = await loadSubject(REPO_ROOT, 'muster');

describe('the step switched-off, with the edition broken on purpose', () => {
  afterEach(() => {
    breakage.mode = 'none';
  });

  it('is green with the guard as it is', async () => {
    expect((await switchedOffConformity(muster)).problems).toEqual([]);
  });

  it('is red when an operation of a function that is off goes through', async () => {
    breakage.mode = 'open';
    const { problems, notes } = await switchedOffConformity(muster);
    expect(problems).toEqual([
      expect.stringMatching(/^muster\.entries\.add answered [\s\S]* while muster\.entries was off/),
      expect.stringMatching(
        /^muster\.entries\.list answered without an error while muster\.entries was off/,
      ),
    ]);
    expect(notes).toContain('muster.entries off: 0 of 2 operations refused, 1 table kept');
  });

  it('is red when switching off turns nothing off: never a pass for nothing', async () => {
    breakage.mode = 'stuck';
    const { problems } = await switchedOffConformity(muster);
    expect(problems).toEqual([
      'switching muster.entries off turned off nothing, not muster.entries',
    ]);
  });
});

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createFeatureRegistry, type FeatureEntries } from '../src';

/**
 * Rules that hold for every register and every list of features, not for the few the other
 * tests write down: the list a switch returns is complete, the one thing that was asked for
 * happens, and nothing else does.
 */

interface Shape {
  core: boolean;
  /** Indexes into the features before this one, as numbers to reduce modulo the position. */
  needs: number[];
}

/** A register of up to nine features whose requirements point backwards, so it has no cycle. */
function entriesOf(shapes: readonly Shape[]): FeatureEntries {
  const coreIndexes = new Set<number>();
  const features = shapes.map((shape, index) => {
    const needs = index === 0 ? [] : [...new Set(shape.needs.map((need) => need % index))];
    // A core feature needs core features only.
    const requires = (shape.core ? needs.filter((need) => coreIndexes.has(need)) : needs).map(
      (need) => `f${String(need)}`,
    );
    if (shape.core) {
      coreIndexes.add(index);
    }
    return { id: `f${String(index)}`, group: 'g', core: shape.core, requires };
  });
  return { groups: [{ id: 'g' }], features };
}

const shapesArbitrary = fc.array(
  fc.record({ core: fc.boolean(), needs: fc.array(fc.nat(20), { maxLength: 4 }) }),
  { minLength: 1, maxLength: 9 },
);

/** A register, and ids to ask it about: its own and one that no register knows. */
const registerArbitrary = shapesArbitrary.chain((shapes) => {
  const registry = createFeatureRegistry(entriesOf(shapes));
  const id = fc.constantFrom(...registry.ids);
  return fc.record({
    registry: fc.constant(registry),
    list: fc.array(fc.oneof(id, fc.constant('unknown.id')), { maxLength: 12 }),
    id,
    on: fc.boolean(),
  });
});

/** The ids of the features that can be switched. */
function switchable(registry: ReturnType<typeof createFeatureRegistry>): string[] {
  return registry.features.filter((feature) => !feature.core).map((feature) => feature.id);
}

describe('what a list of features means, for any register', () => {
  it('is complete, in the order of the register, and holds the whole core', () => {
    fc.assert(
      fc.property(registerArbitrary, ({ registry, list }) => {
        const { features } = registry.resolve(list);
        for (const id of features) {
          for (const required of registry.get(id).requires) {
            expect(features).toContain(required);
          }
        }
        for (const feature of registry.features.filter((entry) => entry.core)) {
          expect(features).toContain(feature.id);
        }
        expect(features).toEqual(registry.ids.filter((id) => features.includes(id)));
      }),
    );
  });

  it('keeps every id that was asked for, or hands it back as unknown', () => {
    fc.assert(
      fc.property(registerArbitrary, ({ registry, list }) => {
        const { features, unknown } = registry.resolve(list);
        for (const id of list) {
          expect(features.includes(id) || unknown.includes(id)).toBe(true);
        }
        expect(unknown).toEqual(list.filter((id) => id === 'unknown.id').slice(0, 1));
      }),
    );
  });

  it('is idempotent', () => {
    fc.assert(
      fc.property(registerArbitrary, ({ registry, list }) => {
        const once = registry.resolve(list);
        expect(registry.resolve(once.features).features).toEqual(once.features);
      }),
    );
  });

  it('needs and is needed in the same pairs', () => {
    fc.assert(
      fc.property(registerArbitrary, ({ registry }) => {
        for (const a of registry.ids) {
          for (const b of registry.ids) {
            expect(registry.requiredFor(a).includes(b)).toBe(registry.dependentsOf(b).includes(a));
          }
        }
      }),
    );
  });
});

describe('switching, for any register', () => {
  const switchableRegister = registerArbitrary.filter(
    ({ registry }) => switchable(registry).length > 0,
  );

  it('on leaves no feature without its base, turns on the one asked for and what it needs', () => {
    fc.assert(
      fc.property(switchableRegister, ({ registry, list }) => {
        const id = switchable(registry)[list.length % switchable(registry).length] ?? '';
        const before = registry.resolve(list).features;
        const result = registry.switchFeature(list, id, true);
        expect(result.features).toEqual(registry.resolve(result.features).features);
        expect(result.features).toContain(id);
        for (const required of registry.requiredFor(id)) {
          expect(result.features).toContain(required);
        }
        // Nothing that was on goes off.
        expect(result.features).toEqual(expect.arrayContaining([...before]));
        expect(result.turnedOff).toEqual([]);
      }),
    );
  });

  it('off leaves no feature without its base, and takes exactly the feature and its dependents', () => {
    fc.assert(
      fc.property(switchableRegister, ({ registry, list }) => {
        const id = switchable(registry)[list.length % switchable(registry).length] ?? '';
        const before = registry.resolve(list).features;
        const result = registry.switchFeature(list, id, false);
        const gone = new Set([id, ...registry.dependentsOf(id)]);
        expect(result.features).toEqual(registry.resolve(result.features).features);
        expect(result.features).toEqual(before.filter((other) => !gone.has(other)));
        expect(result.turnedOn).toEqual([]);
        for (const feature of registry.features.filter((entry) => entry.core)) {
          expect(result.features).toContain(feature.id);
        }
      }),
    );
  });

  it('reports what changed, and nothing else', () => {
    fc.assert(
      fc.property(switchableRegister, ({ registry, list, on }) => {
        const id = switchable(registry)[list.length % switchable(registry).length] ?? '';
        const before = registry.resolve(list).features;
        const result = registry.switchFeature(list, id, on);
        for (const turned of [...result.turnedOn, ...result.turnedOff]) {
          expect(before.includes(turned)).toBe(result.turnedOff.includes(turned));
        }
        const after = before
          .filter((other) => !result.turnedOff.includes(other))
          .concat(result.turnedOn);
        expect([...after].sort()).toEqual([...result.features].sort());
        expect(result.turnedOn.filter((turned) => result.turnedOff.includes(turned))).toEqual([]);
      }),
    );
  });

  it('keeps the list complete through any run of switches', () => {
    fc.assert(
      fc.property(
        switchableRegister,
        fc.array(fc.tuple(fc.nat(50), fc.boolean()), { maxLength: 15 }),
        ({ registry, list }, switches) => {
          const ids = switchable(registry);
          let current: readonly string[] = registry.resolve(list).features;
          for (const [pick, on] of switches) {
            current = registry.switchFeature(current, ids[pick % ids.length] ?? '', on).features;
            expect(registry.resolve(current).features).toEqual(current);
          }
        },
      ),
    );
  });
});

describe('the proposal, for any register', () => {
  /** The same register with a kind and two questions that switch random features on and off. */
  const proposalArbitrary = shapesArbitrary.chain((shapes) => {
    const base = entriesOf(shapes);
    const ids = (base.features ?? []).map((feature) => feature.id);
    const free = (base.features ?? [])
      .filter((feature) => feature.core !== true)
      .map((feature) => feature.id);
    const some = (from: readonly string[]) =>
      fc.uniqueArray(fc.constantFrom(...from), { maxLength: 4 });
    const answer = fc.record({
      enable: some(ids),
      disable: free.length === 0 ? fc.constant([]) : some(free),
    });
    return fc.record({
      shapes: fc.constant(shapes),
      on: some(ids),
      answers: fc.array(answer, { minLength: 1, maxLength: 3 }),
      picks: fc.array(fc.boolean(), { minLength: 3, maxLength: 3 }),
    });
  });

  it('has lean within usual within all, every one complete with the whole core', () => {
    fc.assert(
      fc.property(proposalArbitrary, ({ shapes, on, answers, picks }) => {
        const base = entriesOf(shapes);
        const registry = createFeatureRegistry({
          ...base,
          industries: [{ id: 'muster' }],
          kinds: [{ id: 'muster.k', on }],
          questions: answers.map((entry, index) => ({
            id: `q${String(index)}`,
            multiple: true,
            answers: [{ id: 'a', enable: entry.enable, disable: entry.disable }],
          })),
        });
        const chosen = Object.fromEntries(
          answers.flatMap((_entry, index) =>
            picks[index] === true ? [[`q${String(index)}`, ['a']]] : [],
          ),
        );
        const proposal = registry.propose({ kinds: ['muster.k'], answers: chosen });
        expect(proposal.problems).toEqual([]);
        for (const extent of [proposal.lean, proposal.usual, proposal.all]) {
          expect(registry.resolve(extent).features).toEqual(extent);
        }
        expect(proposal.usual).toEqual(expect.arrayContaining([...proposal.lean]));
        expect(proposal.all).toEqual(expect.arrayContaining([...proposal.usual]));

        const off = answers
          .filter((_entry, index) => picks[index] === true)
          .flatMap((entry) => entry.disable);
        for (const id of off) {
          for (const gone of [id, ...registry.dependentsOf(id)]) {
            expect(proposal.lean).not.toContain(gone);
            expect(proposal.usual).not.toContain(gone);
          }
        }
      }),
    );
  });
});

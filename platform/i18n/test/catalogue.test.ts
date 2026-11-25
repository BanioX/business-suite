import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  catalogueGaps,
  defineTranslation,
  GAP_RULES,
  mergeCatalogues,
  resolveCatalogue,
  type MessageTree,
  type Translation,
} from '../src';

/** A small catalogue with texts, message functions and a nested record. */
const SOURCE = {
  save: 'Speichern',
  cancel: 'Abbrechen',
  people: (count: number) => `${count} Personen`,
  settings: {
    title: 'Einstellungen',
    hint: 'Ändere, was du brauchst.',
    deep: { label: 'Tief' },
  },
} satisfies MessageTree;

describe('resolveCatalogue', () => {
  it('is the source without a translation, as a copy', () => {
    const resolved = resolveCatalogue(SOURCE);
    expect(resolved).toEqual(SOURCE);
    expect(resolved).not.toBe(SOURCE);
    expect(resolved.settings).not.toBe(SOURCE.settings);
  });

  it('takes the translated text where there is one and the source text where there is none', () => {
    const pt = { save: 'Guardar', settings: { title: 'Definições' } };
    const resolved = resolveCatalogue(SOURCE, pt);
    expect(resolved.save).toBe('Guardar');
    expect(resolved.cancel).toBe('Abbrechen');
    expect(resolved.settings.title).toBe('Definições');
    expect(resolved.settings.hint).toBe('Ändere, was du brauchst.');
    expect(resolved.settings.deep.label).toBe('Tief');
  });

  it('takes a translated message function, and the source one where it is missing', () => {
    const resolved = resolveCatalogue(SOURCE, { people: (count: number) => `${count} pessoas` });
    expect(resolved.people(3)).toBe('3 pessoas');
    expect(resolveCatalogue(SOURCE, {}).people(3)).toBe('3 Personen');
  });

  it('is the acceptance of the order: a Portuguese catalogue without a key falls back to German', () => {
    const portuguese = defineTranslation(SOURCE, {
      save: 'Guardar',
      people: (count) => `${count} pessoas`,
      settings: { title: 'Definições', hint: 'Altera o que precisas.', deep: { label: 'Fundo' } },
    });
    const resolved = resolveCatalogue(SOURCE, portuguese);
    expect(resolved.save).toBe('Guardar');
    expect(resolved.cancel).toBe('Abbrechen');
    expect(catalogueGaps(SOURCE, portuguese, 'pt')).toEqual([
      expect.objectContaining({ rule: 'missing', path: 'cancel', language: 'pt' }),
    ]);
  });

  it('treats an empty text or a text of only spaces as missing', () => {
    const resolved = resolveCatalogue(SOURCE, { save: '', cancel: '   ' });
    expect(resolved.save).toBe('Speichern');
    expect(resolved.cancel).toBe('Abbrechen');
  });

  it('uses the source where the translation holds another kind', () => {
    const wrong = {
      save: () => 'Guardar',
      people: 'pessoas',
      settings: 'Definições',
      cancel: { not: 'a text' },
    } as unknown as Translation<typeof SOURCE>;
    const resolved = resolveCatalogue(SOURCE, wrong);
    expect(resolved).toEqual(SOURCE);
    expect(resolved.save).toBe('Speichern');
    expect(resolved.people(2)).toBe('2 Personen');
  });

  it('leaves out a key the source does not know', () => {
    const extra = { save: 'Guardar', stranger: 'Fremd' } as unknown as Translation<typeof SOURCE>;
    expect(Object.keys(resolveCatalogue(SOURCE, extra))).toEqual(Object.keys(SOURCE));
  });

  it('ignores what a translation holds only on its prototype', () => {
    const inherited = Object.create({ save: 'Guardar' }) as Translation<typeof SOURCE>;
    expect(resolveCatalogue(SOURCE, inherited).save).toBe('Speichern');
  });

  it('keeps a key called __proto__ as a key', () => {
    const source = JSON.parse('{"__proto__": {"a": "A"}, "b": "B"}') as MessageTree;
    const resolved = resolveCatalogue(source, JSON.parse('{"__proto__": {"a": "X"}}'));
    expect(Object.keys(resolved)).toEqual(['__proto__', 'b']);
    expect(Object.getPrototypeOf(resolved)).toBe(Object.prototype);
    expect(Object.getOwnPropertyDescriptor(resolved, '__proto__')?.value).toEqual({ a: 'X' });
  });

  it('keeps a leaf that is neither text, function nor record as it is', () => {
    const source = { n: 7, list: ['a'] } as unknown as MessageTree;
    expect(resolveCatalogue(source, { n: 'x' } as unknown as Translation<typeof source>)).toEqual(
      source,
    );
  });

  it('returns frozen records, all the way down', () => {
    const resolved = resolveCatalogue(SOURCE, { settings: { title: 'x' } });
    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(resolved.settings)).toBe(true);
    expect(Object.isFrozen(resolved.settings.deep)).toBe(true);
  });

  it('changes neither the source nor the translation', () => {
    const source = structuredClone({ a: 'A', b: { c: 'C' } });
    const translation = structuredClone({ a: 'X', b: { c: '', d: 'D' } });
    resolveCatalogue(source, translation as Translation<typeof source>);
    expect(source).toEqual({ a: 'A', b: { c: 'C' } });
    expect(translation).toEqual({ a: 'X', b: { c: '', d: 'D' } });
  });

  it('is complete again: resolving a resolved catalogue changes nothing', () => {
    const once = resolveCatalogue(SOURCE, { save: 'Guardar' });
    expect(resolveCatalogue(SOURCE, once)).toEqual(once);
  });
});

describe('catalogueGaps', () => {
  it('finds nothing in a complete translation', () => {
    expect(catalogueGaps(SOURCE, resolveCatalogue(SOURCE, { save: 'Guardar' }), 'pt')).toEqual([]);
    expect(catalogueGaps(SOURCE, SOURCE, 'de-CH')).toEqual([]);
  });

  it('lists every key that is missing, in the order of the source, with the language', () => {
    const gaps = catalogueGaps(SOURCE, { save: 'Guardar', settings: { title: 'x' } }, 'pt');
    expect(gaps.map(({ rule, path, language }) => [rule, path, language])).toEqual([
      ['missing', 'cancel', 'pt'],
      ['missing', 'people', 'pt'],
      ['missing', 'settings.hint', 'pt'],
      ['missing', 'settings.deep.label', 'pt'],
    ]);
    expect(gaps[0]?.message).toBe('pt has no text here: the text of de-CH is used.');
  });

  it('lists every key of a language without a file', () => {
    expect(catalogueGaps(SOURCE, undefined, 'es').map((gap) => gap.path)).toEqual([
      'save',
      'cancel',
      'people',
      'settings.title',
      'settings.hint',
      'settings.deep.label',
    ]);
  });

  it('lists every key of a record that is missing as a whole', () => {
    expect(catalogueGaps(SOURCE, { save: 'a', cancel: 'b', people: () => 'c' }, 'pt')).toHaveLength(
      3,
    );
  });

  it('names a key the source does not know', () => {
    const translation = {
      ...resolveCatalogue(SOURCE),
      stranger: 'x',
      settings: { ...SOURCE.settings, odd: 'y' },
    };
    expect(catalogueGaps(SOURCE, translation, 'pt')).toEqual([
      expect.objectContaining({ rule: 'unknown_key', path: 'settings.odd' }),
      expect.objectContaining({ rule: 'unknown_key', path: 'stranger' }),
    ]);
  });

  it('names a message function where the source has a text, and a text where it has a function', () => {
    const gaps = catalogueGaps(SOURCE, { save: () => 'Guardar', people: 'pessoas' }, 'pt');
    const wrong = gaps.filter((gap) => gap.rule === 'wrong_kind');
    expect(wrong.map((gap) => gap.path)).toEqual(['save', 'people']);
    expect(wrong[0]?.message).toBe(
      'pt has a message function here, the source has a text: the text of de-CH is used.',
    );
    expect(wrong[1]?.message).toContain('has a text here, the source has a message function');
  });

  it('names a record where the source has a text, and a text where it has a record', () => {
    const gaps = catalogueGaps(SOURCE, { cancel: { a: 'b' }, settings: 'x' }, 'pt');
    expect(gaps.filter((gap) => gap.rule === 'wrong_kind').map((gap) => gap.path)).toEqual([
      'cancel',
      'settings',
    ]);
    // The text for a whole record is one finding, not one per key below it.
    expect(gaps.filter((gap) => gap.path.startsWith('settings'))).toHaveLength(1);
  });

  it('names something that is neither text, function nor record', () => {
    const gaps = catalogueGaps(SOURCE, { save: 5, cancel: ['a'] }, 'pt');
    expect(gaps.filter((gap) => gap.rule === 'wrong_kind')).toEqual([
      expect.objectContaining({ path: 'save', message: expect.stringContaining('something else') }),
      expect.objectContaining({
        path: 'cancel',
        message: expect.stringContaining('something else'),
      }),
    ]);
  });

  it('names an empty text as missing, with its own message', () => {
    const gaps = catalogueGaps(SOURCE, { save: ' ' }, 'pt');
    expect(gaps[0]).toEqual({
      rule: 'missing',
      path: 'save',
      language: 'pt',
      message: 'pt has an empty text here: the text of de-CH is used.',
    });
  });

  it('says so when the catalogue is no record at all', () => {
    for (const translation of ['text', 5, null, [], () => 'x']) {
      const gaps = catalogueGaps(SOURCE, translation, 'pt');
      expect(gaps).toHaveLength(1);
      expect(gaps[0]?.rule).toBe('wrong_kind');
      expect(gaps[0]?.path).toBe('');
    }
  });

  it('knows exactly the rules it names', () => {
    expect([...GAP_RULES]).toEqual(['missing', 'wrong_kind', 'unknown_key']);
  });

  it('does not report leaves of the source that are no messages', () => {
    const source = { n: 7 } as unknown as MessageTree;
    expect(catalogueGaps(source, {}, 'pt')).toEqual([]);
  });

  it('reads a key with a dot in it as one key, and shows it in the path', () => {
    const source = { features: { 'facility.keys': { name: 'Schlüssel' } } };
    expect(catalogueGaps(source, { features: {} }, 'pt')[0]?.path).toBe(
      'features.facility.keys.name',
    );
  });

  it('ignores what a translation holds only on its prototype', () => {
    const inherited = Object.create({ save: 'Guardar' }) as unknown;
    expect(catalogueGaps({ save: 'Speichern' }, inherited, 'pt')[0]?.rule).toBe('missing');
  });
});

describe('mergeCatalogues', () => {
  it('puts catalogues over each other, record by record', () => {
    const platform = { a: 'A', group: { x: 'X', y: 'Y' } };
    const industry = { group: { y: 'Y2', z: 'Z' }, b: 'B' };
    expect(mergeCatalogues(platform, industry)).toEqual({
      a: 'A',
      b: 'B',
      group: { x: 'X', y: 'Y2', z: 'Z' },
    });
  });

  it('lets a later leaf replace whatever stood there', () => {
    const fn = () => 'f';
    expect(mergeCatalogues({ a: { b: 'B' } }, { a: 'A' })).toEqual({ a: 'A' });
    expect(mergeCatalogues({ a: 'A' }, { a: { b: 'B' } })).toEqual({ a: { b: 'B' } });
    expect(mergeCatalogues({ a: 'A' }, { a: fn })).toEqual({ a: fn });
  });

  it('is an empty catalogue without arguments, and a copy with one', () => {
    expect(mergeCatalogues()).toEqual({});
    const one = { a: { b: 'B' } };
    const merged = mergeCatalogues(one);
    expect(merged).toEqual(one);
    expect(merged.a).not.toBe(one.a);
  });

  it('copies what it does not merge, so the result shares no record with its arguments', () => {
    const first = { a: { b: 'B' } };
    const second = { c: { d: 'D' } };
    const merged = mergeCatalogues(first, second) as { a: object; c: object };
    expect(merged.a).not.toBe(first.a);
    expect(merged.c).not.toBe(second.c);
  });

  it('returns a frozen result and changes no argument', () => {
    const first = structuredClone({ a: { b: 'B' } });
    const second = structuredClone({ a: { b: 'C', c: 'D' } });
    const merged = mergeCatalogues(first, second);
    expect(Object.isFrozen(merged)).toBe(true);
    expect(Object.isFrozen((merged as { a: object }).a)).toBe(true);
    expect(first).toEqual({ a: { b: 'B' } });
    expect(second).toEqual({ a: { b: 'C', c: 'D' } });
  });

  it('keeps a key called __proto__ as a key', () => {
    const merged = mergeCatalogues(JSON.parse('{"__proto__": {"a": "A"}}'), { b: 'B' });
    expect(Object.keys(merged)).toEqual(['__proto__', 'b']);
    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
  });
});

/**
 * Properties. A catalogue here is a record of records ending in texts, with keys from a small
 * list (one of them holds a dot, as ids do).
 */
const KEYS = ['a', 'b', 'c', 'facility.keys', 'd_e'] as const;
type Tree = { [key: string]: string | Tree };

const treeOf = (leaf: fc.Arbitrary<string>): fc.Arbitrary<Tree> =>
  fc.letrec<{ tree: Tree }>((tie) => ({
    tree: fc.dictionary(
      fc.constantFrom(...KEYS),
      fc.oneof({ depthSize: 'small' }, leaf, tie('tree')),
      {
        minKeys: 1,
        maxKeys: 4,
      },
    ),
  })).tree;

/** The texts of a source say something; those of a translation may be empty or only spaces. */
const filled = fc
  .string({ minLength: 1, unit: 'grapheme-ascii' })
  .filter((text) => text.trim() !== '');
const tree = treeOf(filled);
const anyTree = treeOf(fc.oneof(filled, fc.constantFrom('', ' ')));

/** The shape of a tree: its paths, in order, with the leaves as `.`. */
function shapeOf(value: unknown, path = ''): string[] {
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([key, child]) => shapeOf(child, `${path}/${key}`));
  }
  return [path];
}

const isFilled = (value: unknown) => typeof value === 'string' && value.trim() !== '';

function leafAt(value: unknown, path: string): unknown {
  return path
    .split('/')
    .slice(1)
    .reduce<unknown>((at, key) => (at as Record<string, unknown> | undefined)?.[key], value);
}

/** The same tree with its leaves changed, so a translation differs from its source everywhere. */
function translated(source: Tree): Tree {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [
      key,
      typeof value === 'string' ? `${value}~` : translated(value),
    ]),
  );
}

/** A tree with the leaves left out where `keep` says so, in order; records that end up empty go too. */
function without(source: Tree, keep: () => boolean): Tree {
  const entries: [string, string | Tree][] = [];
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string') {
      if (keep()) {
        entries.push([key, value]);
      }
    } else {
      const inner = without(value, keep);
      if (Object.keys(inner).length > 0) {
        entries.push([key, inner]);
      }
    }
  }
  return Object.fromEntries(entries);
}

describe('properties of the fall-back', () => {
  it('has the keys of the source for every part of a translation, and the translated text where it is there', () => {
    fc.assert(
      fc.property(tree, fc.infiniteStream(fc.boolean()), (source, flips) => {
        const full = translated(source);
        const flipIterator = flips[Symbol.iterator]();
        const part = without(full, () => flipIterator.next().value === true);
        const resolved = resolveCatalogue(source, part);

        expect(shapeOf(resolved)).toEqual(shapeOf(source));
        for (const path of shapeOf(source)) {
          const mine = leafAt(part, path);
          expect(leafAt(resolved, path)).toBe(mine ?? leafAt(source, path));
        }
        // A part that is cut to nothing leaves the source; the whole translation gives the translation.
        expect(resolveCatalogue(source, {})).toEqual(source);
        expect(resolveCatalogue(source, full)).toEqual(full);
      }),
    );
  });

  it('has the keys of the source whatever the translation holds', () => {
    fc.assert(
      fc.property(tree, anyTree, (source, anything) => {
        const resolved = resolveCatalogue(source, anything);
        expect(shapeOf(resolved)).toEqual(shapeOf(source));
        for (const path of shapeOf(source)) {
          const mine = leafAt(anything, path);
          expect(leafAt(resolved, path)).toBe(isFilled(mine) ? mine : leafAt(source, path));
        }
      }),
    );
  });

  it('lists a gap for exactly the leaves where the source text stands in', () => {
    fc.assert(
      fc.property(tree, anyTree, (source, anything) => {
        const resolved = resolveCatalogue(source, anything);
        const gaps = catalogueGaps(source, anything, 'xx').filter(
          (gap) => gap.rule !== 'unknown_key',
        );
        for (const path of shapeOf(source)) {
          const dotted = path.split('/').slice(1).join('.');
          const mine = leafAt(anything, path);
          const stoodIn = !isFilled(mine);
          const listed = gaps.some(
            (gap) => dotted === gap.path || dotted.startsWith(`${gap.path}.`),
          );
          expect(listed, path).toBe(stoodIn);
          if (stoodIn) {
            expect(leafAt(resolved, path)).toBe(leafAt(source, path));
          }
        }
      }),
    );
  });

  it('finds no gap in what it resolved, and is the same when resolved again', () => {
    fc.assert(
      fc.property(tree, anyTree, (source, anything) => {
        const resolved = resolveCatalogue(source, anything);
        expect(catalogueGaps(source, resolved, 'xx')).toEqual([]);
        expect(resolveCatalogue(source, resolved)).toEqual(resolved);
      }),
    );
  });

  it('changes neither of its arguments', () => {
    fc.assert(
      fc.property(tree, anyTree, (source, anything) => {
        const before = [structuredClone(source), structuredClone(anything)];
        resolveCatalogue(source, anything);
        catalogueGaps(source, anything, 'xx');
        expect([source, anything]).toEqual(before);
      }),
    );
  });
});

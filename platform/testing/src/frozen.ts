/**
 * A list every test shares (the rules of a language, the kinds of side effects), frozen with its
 * entries: a test that added a rule or changed one would change the standard for every test
 * that runs after it in the same process.
 */
export function frozenList<TItem extends object>(items: TItem[]): readonly Readonly<TItem>[] {
  for (const item of items) {
    Object.freeze(item);
  }
  return Object.freeze(items);
}

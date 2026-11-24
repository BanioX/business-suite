import type { WordList } from '../platform-words.ts';

/**
 * The names of the products that must not stand in `platform/`: the gastronomy edition, the
 * household app and the name that app had before (the names are in CLAUDE.md of the three
 * repositories). The platform belongs to no edition, so it names none. The name of the suite
 * itself (`@onestrand/*`) is of course allowed.
 *
 * The first name is a whole word only: it is also the end of everyday words («umranden») and of
 * place names. The other two are found inside longer words as well, and the former name also
 * when it is written in two words (`fridge_ai`, «Fridge AI»).
 */
export const PRODUCT_NAMES: WordList = {
  id: 'products',
  label: 'a product (name of an edition or app)',
  words: ['randen', 'randens'],
  parts: ['rettich', 'fridgeai'],
  sequences: [['fridge', 'ai']],
};

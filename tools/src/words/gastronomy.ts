import type { WordList } from '../platform-words.ts';

/**
 * Words of the gastronomy that must not stand in `platform/` (docs/zusammenarbeit.md, 10.3). The
 * platform was taken out of the gastronomy edition, so these are the words most likely to come
 * along by accident.
 *
 * How the list was made, so the next industry does it the same way:
 * - The floor is the list every build agent of the foundation was given: kitchen, cook, chef,
 *   guest, dish, recipe, menu, restaurant, food, meal, allergen, HACCP, Küche, Koch, Gast,
 *   Gericht, Rezept, Speisekarte, Lebensmittel.
 * - Added are only words that are frequent in the source of the edition and belong to no other
 *   trade: ingredient, Zutat, Portionen, Mahlzeit, the dates of food law (MHD,
 *   Mindesthaltbarkeit, Verbrauchsdatum) and the name of the trade itself.
 * - `words` are whole words (after an identifier is taken apart), so «cook» does not find
 *   «cookie» and «Gast» does not find «megastore». `parts` are fragments that no neutral word
 *   holds; they find German compounds («Küchenchef», «Zutatenliste») and English plurals.
 *
 * Left out on purpose, although the edition uses them all the time, because they are neutral
 * everywhere else: lot («a lot of»), order (sort order; every trade has orders), service, pass
 * (password, a test passes), stock and supplier (every trade with material), table (the table
 * register of the storage), course (the trade of course providers), delivery, shelf, expiry
 * (documents expire too), waste, prep, tip, plate, cover, station, temperature. Measured on half
 * a million lines of general-purpose library code, «portion» («the fractional portion») and
 * «cooked» (the cooked strings of a template literal) turned out to be everyday words of
 * programming as well, so they are left out too.
 *
 * Decided with open eyes:
 * - «menu»/«Menü» is also a word of user interfaces (and an ARIA role). The platform has no UI
 *   yet and the menu plan is a core idea of the edition, so the word is on the list. If the
 *   shell of the platform needs it, the head takes it off here and says why.
 * - «meal»/«Mahlzeit» also appears in wage rules (an allowance per meal). When a payroll module
 *   needs it, the same applies.
 * - «Gericht» is also a court, «Chef» also a boss, «guest» also a visitor of a hotel. None of
 *   them is a word of the platform: it says «Kundschaft», «Inhaber:in», «customer».
 */
export const GASTRONOMY: WordList = {
  id: 'gastronomy',
  label: 'the gastronomy',
  words: [
    // English
    'cook',
    'cooks',
    'cooking',
    'chef',
    'chefs',
    'guest',
    'guests',
    'dish',
    'dishes',
    'recipe',
    'recipes',
    'menu',
    'menus',
    'food',
    'foods',
    'meal',
    'meals',
    'takeaway',
    'catering',
    'caterer',
    // German
    'koch',
    'köchin',
    'köchinnen',
    'köche',
    'köchen',
    'köch', // «Köch:innen»
    'kochen',
    'kocht',
    'gekocht',
    'verkocht',
    'gast',
    'gäste',
    'gästen',
    'gericht',
    'gerichte',
    'gerichten',
    'rezept',
    'rezepte',
    'rezepten',
    'menü',
    'menüs',
    'speise',
    'speisen',
    'portionen',
    'mahlzeit',
    'mahlzeiten',
    'mhd',
  ],
  parts: [
    'kitchen',
    'restaurant',
    'allergen',
    'haccp',
    'ingredient',
    'gastro',
    'gastgewerb',
    'küche',
    'speisekarte',
    'lebensmittel',
    'zutat',
    'menuplan',
    'menüplan',
    'tagesmenü',
    'mindesthaltbar',
    'verbrauchsdatum',
  ],
};

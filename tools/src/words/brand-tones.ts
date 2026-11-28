import type { WordList } from '../platform-words.ts';

/**
 * The names of the colours of an edition's brand, which must not stand in `platform/` (order
 * W0-03, acceptance: «Kein wine, grape, cork … unter platform/»). The kit draws with roles
 * (`accent`, `surface`, …) and each edition hands in its colours as a theme (decision S-27); a
 * brand colour by name in the platform is the first sign that a theme has slipped into the kit.
 *
 * The list holds the tones the gastronomy edition named its tokens after, in English as in its
 * code and in German as in its docs. A new edition whose tones have names adds them here.
 */
export const BRAND_TONES: WordList = {
  id: 'brand-tones',
  label: 'the colours of the brand of an edition',
  words: ['wine', 'wines', 'grape', 'grapes', 'cork', 'rotwein', 'traube', 'kork'],
};

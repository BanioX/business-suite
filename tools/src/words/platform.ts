import type { WordList } from '../platform-words.ts';
import { GASTRONOMY } from './gastronomy.ts';
import { PRODUCT_NAMES } from './products.ts';

/**
 * Every list the platform is checked against: one per industry, plus the product names. An
 * industry that docks on gets its list here (a file of its own beside `gastronomy.ts`) before
 * its first code lands, with the words that tell the trade apart («Baustelle», «Zimmer»).
 */
export const INDUSTRY_WORD_LISTS: readonly WordList[] = [GASTRONOMY];

export const PLATFORM_WORD_LISTS: readonly WordList[] = [...INDUSTRY_WORD_LISTS, PRODUCT_NAMES];

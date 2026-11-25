// Origin: BanioX/Rettich apps/web/src/private-ideas.test.ts @ 0ac1fd2 — adapted: only the two lists of hashes, as the seed of the suite's own list

/**
 * Names that never stand in this public repository (ADR-0011): other software products, real
 * companies and persons. The names are kept as hashes only, so the list itself gives nothing
 * away; the plain list lives in the private store.
 *
 * A hash is the first 16 hex digits of the SHA-256 of the lower-case word. To add a name:
 *
 *   node tools/hash-name.mjs <name>
 *
 * It prints the hash for `FORBIDDEN_NAMES` and, for a name written in several words, the hash of
 * its first word for `FORBIDDEN_FIRST_WORDS`. Never write the plain name here, in a comment, a
 * test or a commit message.
 */
export const FORBIDDEN_NAMES: ReadonlySet<string> = new Set([
  '061d2ba9d35da1f6',
  '06dc77b26f679aa8',
  '11436f69fe5416bc',
  '2b78da3dc866654e',
  '3315a07bf936dbb9',
  '34c61d931feaab26',
  '39a19163fc28888e',
  '3ff0963ab5caf67d',
  '453e137288f9c754',
  '480ad81f693bd59a',
  '4baee76569f1d86f',
  '50c206094f94fcd1',
  '76a14251ccf5962c',
  '7ee6c2ff3ad58dc2',
  '7fc1974d4e979bc0',
  '968e2d5b08687bf4',
  '96ce031df8a929aa',
  '98ef85bb4d7e4e05',
  '9972296da92a0e78',
  'ac92e3ef333ee87f',
  'b404beee516203b9',
  'b970d321fcb780fe',
  'be62d0c65842e819',
  'c86498a020401ced',
  'c9151e23cec8d6f6',
  'e3bbe09696bf3a66',
  'ebcb6eff8d06c995',
  'ed063a44fa00582e',
  'f92fcaea1526fc78',
]);

/**
 * First words of names written in several words. When a text holds one of them, the two, three
 * and four words from there on are joined and checked as one name.
 */
export const FORBIDDEN_FIRST_WORDS: ReadonlySet<string> = new Set([
  '038468518ad8122e',
  '9209526aaa61b070',
  '94c05f1c45a1d1a9',
  'c244bfeada914d36',
]);

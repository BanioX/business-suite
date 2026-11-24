// Prints the hashes of a name for the list of names that never stand in this public repository
// (ADR-0011; the list is tools/src/words/forbidden-names.ts, the check tools/src/public-repo.ts).
//
//   node tools/hash-name.mjs <name>            a name in one word
//   node tools/hash-name.mjs "<name in words>" a name in two to four words
//   node tools/hash-name.mjs <name> <name> …   several names, one after the other
//
// The plain names come from the private list and stay there: this script stores nothing and does
// not print the name back. Put the printed hashes into the two sets, never the name, and keep it
// out of the commit message too.
import { nameHashes } from './src/public-repo.ts';

const names = process.argv.slice(2);
if (names.length === 0) {
  console.error(
    'Usage: node tools/hash-name.mjs <name> [<name> …]   (quote a name in several words)',
  );
  process.exit(2);
}

let failed = false;
names.forEach((name, index) => {
  try {
    const hashes = nameHashes(name);
    console.log(`name ${String(index + 1)}:`);
    console.log(`  '${hashes.name}',   → FORBIDDEN_NAMES`);
    if (hashes.firstWord !== undefined) {
      console.log(`  '${hashes.firstWord}',   → FORBIDDEN_FIRST_WORDS (its first word)`);
    }
  } catch (error) {
    failed = true;
    console.error(
      `name ${String(index + 1)}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
});
process.exit(failed ? 1 : 0);

// Rewrites the generated table of docs/herkunft.md from the provenance headers of the source
// files (`// Origin: BanioX/<Repo> <path> @ <commit> — unchanged | adapted: <what>`; the rules are
// in tools/src/provenance.ts).
//
//   node tools/provenance.mjs           rewrite the table between the two marker comments
//   node tools/provenance.mjs --check   change nothing; exit 1 if the table is out of date
//
// The table is sorted, so the result does not depend on who runs it or how often. A malformed
// header stops the script before it writes: a table that silently leaves a file out would be
// worse than an old one. The table kept by hand in the same document is never touched.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROVENANCE_DOCUMENT, provenanceRows, updateGenerated } from './src/provenance.ts';
import { formatProblem, readTextFiles, REPO_ROOT } from './src/repo-files.ts';

const args = process.argv.slice(2);
const unknown = args.filter((arg) => arg !== '--check');
if (unknown.length > 0) {
  console.error(`Unknown option: ${unknown.join(' ')}. Known: --check`);
  process.exit(2);
}
const check = args.includes('--check');

const { rows, problems } = provenanceRows(readTextFiles(REPO_ROOT));
if (problems.length > 0) {
  for (const problem of problems) {
    console.error(formatProblem(problem));
  }
  console.error(`provenance: ${String(problems.length)} header(s) to repair, nothing written`);
  process.exit(1);
}

const target = join(REPO_ROOT, PROVENANCE_DOCUMENT);
let before;
let after;
try {
  before = readFileSync(target, 'utf8');
  after = updateGenerated(before, rows);
} catch (error) {
  console.error(`provenance: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const files = new Set(rows.map((row) => row.file)).size;
const summary = `${String(rows.length)} source(s) of ${String(files)} file(s)`;
if (after === before) {
  console.log(`provenance: ${PROVENANCE_DOCUMENT} is up to date (${summary})`);
} else if (check) {
  console.error(
    `provenance: ${PROVENANCE_DOCUMENT} is out of date: run «node tools/provenance.mjs»`,
  );
  process.exit(1);
} else {
  writeFileSync(target, after);
  console.log(`provenance: ${PROVENANCE_DOCUMENT} rewritten (${summary})`);
}

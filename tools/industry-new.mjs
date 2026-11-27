// «pnpm industry:new <id>»: a new industry `industries/<id>/` from the pattern of the reference
// industry `industries/muster/core`, every identifier in the namespace of `<id>` (suite ADR-0004,
// 9; order W0-02, step 9). The rules and why the pattern is not a template of its own:
// tools/src/industry-new.ts.
//
// What it writes: `industries/<id>/core/**` (the pattern renamed and run through the formatter of
// the repository) and `industries/<id>/NAMES.md` (the names it proposes for the register). What it
// never writes: `registry/names.json` (only the head writes it; the lines to enter are printed),
// `docs/branchen/`, the lockfile and any other file. It refuses an id that cannot be one, and
// writes nothing then. Exit code 0 when the industry is there, 1 when it was refused, 2 when it
// was called wrongly.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';
// TypeScript, run by Node as it is (Node 24 strips the types): no build step for the tools.
import { readWorkspace } from './src/affected.ts';
import {
  nextSteps,
  planIndustry,
  readRepository,
  registerLines,
  TEMPLATE_DIR,
} from './src/industry-new.ts';

const root = fileURLToPath(new URL('..', import.meta.url));

const USAGE =
  'Usage: pnpm industry:new <id>   (lower-case letters and digits, for example facility)';

/** The text as the repository formats it, or as it is for a file the formatter leaves alone. */
async function formatted(path, text) {
  const file = join(root, path);
  const { ignored, inferredParser } = await prettier.getFileInfo(file, {
    ignorePath: join(root, '.prettierignore'),
  });
  if (ignored || inferredParser === null) {
    return text;
  }
  const options = (await prettier.resolveConfig(file)) ?? {};
  return prettier.format(text, { ...options, filepath: file });
}

async function main(args) {
  if (args.length !== 1 || args[0].startsWith('-')) {
    console.error(USAGE);
    return 2;
  }
  const [id] = args;
  const { problems, plan } = planIndustry(readRepository(root, readWorkspace(root)), id);
  if (plan === undefined) {
    console.error(`industry:new: cannot make the industry "${id}":`);
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
    console.error('industry:new: nothing was written');
    return 1;
  }
  const { naming, files, proposal } = plan;
  const texts = await Promise.all(files.map(({ path, text }) => formatted(path, text)));
  try {
    files.forEach(({ path }, index) => {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), texts[index], { flag: 'wx' });
    });
  } catch (error) {
    // Half an industry is worse than none: the directory did not exist before (planIndustry).
    rmSync(join(root, naming.dir), { recursive: true, force: true });
    throw error;
  }

  const out = (line = '') => process.stdout.write(`${line}\n`);
  out(
    `industry:new: made ${naming.dir}/ from the pattern of ${TEMPLATE_DIR} (${files.length} files)`,
  );
  for (const { path } of files) {
    out(`  ${path}`);
  }
  out();
  out(`Package ${naming.packageName}, Vitest project ${naming.project}.`);
  out();
  out(
    `Names for registry/names.json: only the head writes the register. Proposed in ${naming.dir}/NAMES.md:`,
  );
  for (const line of registerLines(proposal, id)) {
    out(`  ${line},`);
  }
  out();
  out('Next steps:');
  nextSteps(id).forEach((step, index) => out(`  ${String(index + 1)}. ${step}`));
  return 0;
}

process.exitCode = await main(process.argv.slice(2));

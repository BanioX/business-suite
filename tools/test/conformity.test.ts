import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  backupConformity,
  cataloguePlaces,
  checkEditionInput,
  demoExport,
  deviceFilterConformity,
  editionConformity,
  loadSubject,
  manifestConformity,
  namesConformity,
  sideEffectConformity,
  subjectFromEnvironment,
  switchedOffConformity,
  tableAccessExport,
  textConformity,
  type Subject,
} from '../src/conformity.ts';
import { INDUSTRY_ENV } from '../src/industry-check.ts';
import { industryFolders } from '../src/industries.ts';
import { REPO_ROOT } from '../src/repo-files.ts';
import { PRODUCT_NAMES } from '../src/words/products.ts';

// What `pnpm check:industry` asks of an industry, run here for `muster` (it must pass) and for
// broken copies of it (each must be found). A broken manifest needs its own files on disk: those
// copies live in a temporary directory at the same depth as in the repository, with the
// installed packages linked from this checkout (lesson L-S78), so nothing here is ever changed.

const temporary: string[] = [];
afterAll(() => {
  for (const dir of temporary.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

/**
 * A copy of the pure part of `muster` and the files the checks read (the source of its rule set,
 * the registers), with `change` applied to the text of the files it names.
 */
function brokenCopy(changes: Readonly<Record<string, (text: string) => string>> = {}): string {
  const root = mkdtempSync(join(tmpdir(), 'onestrand-conformity-'));
  temporary.push(root);
  const core = 'industries/muster/core';
  for (const part of ['package.json', 'vitest.config.ts', 'src', 'test']) {
    cpSync(join(REPO_ROOT, core, part), join(root, core, part), { recursive: true });
  }
  symlinkSync(join(REPO_ROOT, core, 'node_modules'), join(root, core, 'node_modules'), 'dir');
  symlinkSync(join(REPO_ROOT, 'node_modules'), join(root, 'node_modules'), 'dir');
  for (const file of [
    'docs/fakten/geld-steuern.md',
    'docs/nebenwirkungen.md',
    'registry/names.json',
  ]) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    cpSync(join(REPO_ROOT, file), join(root, file));
  }
  for (const [path, change] of Object.entries(changes)) {
    const file = join(root, path);
    const text = readFileSync(file, 'utf8');
    const changed = change(text);
    expect(changed, `the change of ${path} applies`).not.toBe(text);
    writeFileSync(file, changed);
  }
  return root;
}

/** A file of a temporary root. */
function put(root: string, path: string, text: string): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

/** A copy of a catalogue with one leaf left out. */
function withoutLeaf(catalogue: unknown, path: readonly string[]): Record<string, unknown> {
  const copy = structuredClone(catalogue) as Record<string, unknown>;
  let node = copy;
  for (const key of path.slice(0, -1)) {
    node = node[key] as Record<string, unknown>;
  }
  Reflect.deleteProperty(node, path.at(-1) ?? '');
  return copy;
}

/** A copy of a catalogue with one more text. */
function withText(catalogue: unknown, section: string, key: string, text: unknown) {
  const copy = structuredClone(catalogue) as Record<string, Record<string, unknown>>;
  copy[section] = { ...copy[section], [key]: text };
  return copy;
}

const muster = await loadSubject(REPO_ROOT, 'muster');

describe('the conformity of muster', () => {
  it('loads the manifest, the exports and the catalogue of the industry', () => {
    expect(muster.loadProblems).toEqual([]);
    expect(muster.manifest?.id).toBe('muster');
    expect(typeof muster.exports[demoExport('muster')]).toBe('function');
    expect(muster.catalogueFrom).toBe('industries/muster/core/test/messages.ts');
    expect(muster.catalogueProblems).toEqual([]);
    expect(cataloguePlaces('muster')).toEqual([
      'industries/muster/web/messages.ts',
      'industries/muster/core/test/messages.ts',
    ]);
  });

  it.each([
    ['manifest', () => manifestConformity(muster)],
    ['edition', () => editionConformity(muster)],
    ['texts', () => textConformity(muster)],
    ['switched-off', () => switchedOffConformity(muster)],
    ['backup', () => backupConformity(muster)],
    ['device-filter', () => deviceFilterConformity(muster)],
    ['side-effects', () => sideEffectConformity(muster)],
    ['names', () => namesConformity(muster)],
  ])('passes the step %s, and says what it read', async (_step, check) => {
    const { problems, notes } = await check();
    expect(problems).toEqual([]);
    expect(notes.length).toBeGreaterThan(0);
  });

  it('is laid out by its own demo, and every row comes back', async () => {
    const backup = await backupConformity(muster);
    expect(backup.notes).toEqual([
      'demo business laid out by layOutMusterDemo',
      'muster_entries: 2 rows there and back',
    ]);
    const off = await switchedOffConformity(muster);
    expect(off.notes).toContain('muster.entries off: 2 operations refused, 1 table kept');
  });

  it('has all its names in the register', () => {
    const names = namesConformity(muster);
    expect(names.registered).toHaveLength(8);
    expect(names.registered).toContain('operation muster.entries.add');
    expect(names.proposed).toEqual([]);
  });

  it('is checked in the edition of check:industry: the frozen names of its id', () => {
    const { manifest } = muster;
    if (manifest === undefined) {
      throw new Error('muster loads');
    }
    expect(checkEditionInput(manifest, muster.catalogue)).toMatchObject({
      id: 'muster',
      database: 'muster',
      storagePrefix: 'muster:',
      backupFormat: 'muster-backup',
      backupVersion: 1,
      title: 'Muster',
      industries: [manifest],
      texts: [muster.catalogue],
    });
    expect(checkEditionInput(manifest, undefined).texts).toEqual([]);
  });
});

describe('a missing text', () => {
  it('turns the step edition red and names the key', () => {
    const catalogue = withoutLeaf(muster.catalogue, ['options', 'muster.entries', 'newestFirst']);
    const { problems } = editionConformity({ ...muster, catalogue });
    expect(problems).toEqual([
      expect.stringMatching(/^texts: missing_text options\.muster\.entries\.newestFirst: /),
    ]);
  });

  it('turns it red for every text when there is no catalogue, and says where it looked', () => {
    const problem = 'the industry has no catalogue';
    const { problems } = editionConformity({
      ...muster,
      catalogue: undefined,
      catalogueProblems: [problem],
    });
    expect(problems[0]).toBe(problem);
    expect(problems.filter((line) => line.includes('missing_text'))).toHaveLength(12);
    expect(
      textConformity({ ...muster, catalogue: undefined, catalogueProblems: [problem] }).problems,
    ).toEqual([problem]);
  });
});

describe('a text that breaks a rule', () => {
  it.each([
    ['an exclamation mark', 'Nur erfassen!', 'exclamation'],
    ['the plural address', 'Führt ihr ein Journal?', 'plural_address'],
    ['the formal address', 'Erfassen Sie einen Eintrag.', 'formal_address'],
    ['an eszett', 'Grösse und Maß', 'eszett'],
  ])('is found: %s', (_what, text, rule) => {
    const catalogue = withText(muster.catalogue, 'deviceModes', 'muster.capture', text);
    expect(textConformity({ ...muster, catalogue }).problems).toEqual([
      expect.stringContaining(`deviceModes.muster.capture: ${rule}: «${text}»`),
    ]);
  });

  it('is found when it names a product of the suite', () => {
    const product = PRODUCT_NAMES.words[0] ?? '';
    const name = `${product.charAt(0).toUpperCase()}${product.slice(1)}`;
    const catalogue = withText(
      muster.catalogue,
      'kinds',
      'muster.standard',
      `Betrieb wie in ${name}`,
    );
    expect(textConformity({ ...muster, catalogue }).problems).toEqual([
      expect.stringContaining('kinds.muster.standard: product_name:'),
    ]);
  });

  it('is found when the catalogue holds a text of the platform or of another industry', () => {
    const catalogue = withText(
      withText(muster.catalogue, 'features', 'business', {
        name: 'Betrieb',
        summary: 'Der Betrieb.',
      }),
      'kinds',
      'zwilling.standard',
      'Zwilling',
    );
    expect(textConformity({ ...muster, catalogue }).problems).toEqual([
      expect.stringMatching(
        /^features\.business: the catalogue of an industry holds texts for its own ids/,
      ),
      expect.stringMatching(/^kinds\.zwilling\.standard: /),
    ]);
    const odd = { ...(muster.catalogue ?? {}), kinds: 'Musterbetrieb' };
    expect(textConformity({ ...muster, catalogue: odd }).problems).toEqual([
      'kinds: a section of the catalogue holds texts by id, not string',
    ]);
  });
});

describe('an operation without access', () => {
  it('is refused by defineIndustry: the manifest cannot be loaded, and the step manifest says why', async () => {
    const root = brokenCopy({
      'industries/muster/core/src/contract.ts': (text) =>
        text.replace("    access: { feature: ENTRIES_FEATURE, level: 'operate' },\n", ''),
    });
    const broken = await loadSubject(root, 'muster');
    expect(broken.manifest).toBeUndefined();
    const { problems } = await manifestConformity(broken);
    expect(problems).toContainEqual(
      expect.stringContaining('cannot be loaded: invalid_entry contract muster.entries.add:'),
    );
    // What needs the manifest says so; what does not goes on.
    expect(editionConformity(broken).problems).toEqual([
      expect.stringContaining('the manifest cannot be loaded'),
    ]);
    expect((await switchedOffConformity(broken)).problems).toHaveLength(1);
    expect((await backupConformity(broken)).problems).toHaveLength(1);
    expect(namesConformity(broken).problems).toHaveLength(1);
    expect(textConformity(broken).problems).toEqual([]);
  });
});

describe('a manifest under the wrong names', () => {
  it('is found: package, Vitest project and a rule set without its source', async () => {
    const root = brokenCopy({
      'industries/muster/core/package.json': (text) =>
        text.replace('@onestrand-industry/muster', '@onestrand-industry/other'),
      'industries/muster/core/vitest.config.ts': (text) => text.replace("'muster-core'", "'core'"),
      'industries/muster/core/src/content.ts': (text) =>
        text.replace("'docs/fakten/geld-steuern.md'", "'docs/fakten/nowhere.md'"),
    });
    const { problems } = await manifestConformity(await loadSubject(root, 'muster'));
    expect(problems).toEqual([
      'the rule set muster.retention names the source docs/fakten/nowhere.md, which is no file under docs/fakten/ (law only with a source)',
      'industries/muster/core/package.json is called "@onestrand-industry/other": an industry is the package @onestrand-industry/muster',
      expect.stringContaining(
        'industries/muster/core/vitest.config.ts names the project "core": it must be muster-core',
      ),
    ]);
  });

  it('is found without a catalogue file and without the export of the catalogue', async () => {
    const root = brokenCopy({
      'industries/muster/core/test/messages.ts': (text) =>
        text.replace('export const musterMessages', 'export const otherMessages'),
    });
    const subject = await loadSubject(root, 'muster');
    expect(subject.catalogueProblems).toEqual([
      'industries/muster/core/test/messages.ts exports no catalogue musterMessages',
    ]);
    rmSync(join(root, 'industries/muster/core/test/messages.ts'));
    expect((await loadSubject(root, 'muster')).catalogueProblems).toEqual([
      'the industry has no catalogue: neither industries/muster/web/messages.ts nor industries/muster/core/test/messages.ts is there (export musterMessages)',
    ]);
  });
});

describe('the demo of an industry', () => {
  it('is made from the manifest when the industry has no function to lay it out', async () => {
    const exports = { ...muster.exports };
    Reflect.deleteProperty(exports, demoExport('muster'));
    const subject: Subject = { ...muster, exports };
    const backup = await backupConformity(subject);
    expect(backup.problems).toEqual([]);
    expect(backup.notes[0]).toContain('made from the demo of the manifest');
    expect(backup.notes).toContain('muster_entries: 0 rows there and back');
    expect((await switchedOffConformity(subject)).problems).toEqual([]);
  });

  it('turns the steps red when it cannot be laid out: a check that cannot run never passes', async () => {
    const subject: Subject = {
      ...muster,
      exports: { ...muster.exports, [demoExport('muster')]: () => Promise.resolve({}) },
    };
    for (const finding of [await backupConformity(subject), await switchedOffConformity(subject)]) {
      expect(finding.problems).toEqual([
        'the check could not run to its end: layOutMusterDemo must give { businessId } back',
      ]);
    }
  });
});

describe('the filter for other devices', () => {
  const declaring = (access: unknown): Subject => ({
    ...muster,
    exports: { ...muster.exports, [tableAccessExport('muster')]: access },
  });

  it('gives the rows of muster only with the function on, the level and the right', async () => {
    const { notes } = await deviceFilterConformity(muster);
    expect(notes).toContain(
      'muster_entries: 2 rows, function muster.entries, right muster.journal_read',
    );
  });

  it.each([
    [
      'no declaration at all',
      undefined,
      'the industry exports no musterTableAccess: the filter for other devices needs the function and the right of every table (filterRowsForDevice of @onestrand/access; debt TD-70)',
    ],
    [
      'a table without its function',
      {},
      'musterTableAccess names no function (and, if any, no right as a text) for muster_entries',
    ],
    [
      'a function nobody registered',
      { muster_entries: { feature: 'muster.other', right: 'muster.journal_read' } },
      'musterTableAccess gives muster_entries the function muster.other, which nobody registered',
    ],
    [
      'a right nobody registered',
      { muster_entries: { feature: 'muster.entries', right: 'muster.other' } },
      'musterTableAccess gives muster_entries the right muster.other, which nobody registered',
    ],
  ])('is red with %s', async (_what, access, problem) => {
    expect((await deviceFilterConformity(declaring(access))).problems).toEqual([problem]);
  });

  it('is red for a table it names that the industry does not have, and tells of a sensitive table without a right', async () => {
    const finding = await deviceFilterConformity(
      declaring({
        muster_entries: { feature: 'muster.entries' },
        muster_gone: { feature: 'muster.entries' },
      }),
    );
    expect(finding.problems).toEqual([
      'musterTableAccess names muster_gone, which is no table of the industry',
    ]);
    expect(finding.notes).toContain(
      'muster_entries is sensitive and names no right: on another device only the owner gets it',
    );
  });
});

describe('a side effect of the industry', () => {
  it('is found without its row in docs/nebenwirkungen.md, and a storage key with its prefix too', () => {
    const root = mkdtempSync(join(tmpdir(), 'onestrand-conformity-'));
    temporary.push(root);
    put(
      root,
      'docs/nebenwirkungen.md',
      readFileSync(join(REPO_ROOT, 'docs/nebenwirkungen.md'), 'utf8'),
    );
    put(root, 'industries/sample/core/package.json', '{}');
    put(
      root,
      'industries/sample/core/src/sync.ts',
      "export const send = () => fetch('/x');\nexport const key = 'sample:open';\n",
    );
    // Tests are not shipped: what they do is not a side effect of the app.
    put(root, 'industries/sample/core/test/sync.test.ts', "fetch('/y');\n");
    const [folder] = industryFolders(root);
    if (folder === undefined) {
      throw new Error('the industry is there');
    }
    const subject: Subject = {
      ...muster,
      root,
      id: 'sample',
      folder,
    };
    const { problems, notes } = sideEffectConformity(subject);
    expect(problems.map((problem) => problem.split(':')[0])).toEqual([
      // A request to a server: it needs its row and the decision of the product owner there.
      'side_effect.request',
      'side_effect.storage_key',
    ]);
    expect(problems[0]).toContain('industries/sample/core/src/sync.ts');
    expect(notes).toEqual(['1 shipped file read']);
  });
});

describe('the names of the industry', () => {
  /** A root with the files the step reads: the package, the register and NAMES.md. */
  function names(register: (text: string) => string, proposal?: string): Subject {
    const root = mkdtempSync(join(tmpdir(), 'onestrand-conformity-'));
    temporary.push(root);
    const real = (path: string) => readFileSync(join(REPO_ROOT, path), 'utf8');
    put(root, 'industries/muster/core/package.json', real('industries/muster/core/package.json'));
    put(root, 'registry/names.json', register(real('registry/names.json')));
    if (proposal !== undefined) {
      put(root, 'industries/muster/NAMES.md', proposal);
    }
    return { ...muster, root };
  }

  const ofMuster = (text: string) => {
    const data = JSON.parse(text) as { names: { owner: string }[] };
    return JSON.stringify({
      ...data,
      names: data.names.filter(({ owner }) => owner !== 'industry:muster'),
    });
  };

  const table = (rows: string[]) => ['| Art | Kennung |', '| --- | --- |', ...rows].join('\n');
  const ALL = [
    '| `package` | `@onestrand-industry/muster` |',
    '| `table` | `muster_entries` |',
    '| `operation` | `muster.entries.add` |',
    '| `operation` | `muster.entries.list` |',
    '| `event` | `muster_entry.added` |',
    '| `feature` | `muster.entries` |',
    '| `module` | `muster.journal` |',
    '| `right` | `muster.journal_read` |',
  ];

  it('are green when proposed in NAMES.md, and the notes say they are only proposed', () => {
    const finding = namesConformity(names(ofMuster, table(ALL)));
    expect(finding.problems).toEqual([]);
    expect(finding.registered).toEqual([]);
    expect(finding.proposed).toHaveLength(8);
    expect(finding.notes.join('\n')).toContain('until then pnpm names is red');
  });

  it('are red when one is neither registered nor proposed, or proposed but not used', () => {
    const finding = namesConformity(
      names(ofMuster, table([...ALL.slice(1), '| `table` | `muster_gone` |', '| `thing` | `x` |'])),
    );
    expect(finding.problems).toEqual([
      'the package @onestrand-industry/muster is neither in registry/names.json nor proposed in industries/muster/NAMES.md: propose it there, the head enters it',
      'industries/muster/NAMES.md proposes the table muster_gone, which the industry does not use',
      expect.stringContaining(
        'industries/muster/NAMES.md proposes a thing, which is no kind of the register',
      ),
    ]);
  });

  it('are red without NAMES.md when the register lacks them, and when another owner holds one', () => {
    expect(namesConformity(names(ofMuster)).problems).toHaveLength(8);
    const foreign = (text: string) =>
      text.replace(
        '"owner": "industry:muster", "status": "active" },',
        '"owner": "platform", "status": "active" },',
      );
    const finding = namesConformity(names(foreign));
    expect(finding.problems).toEqual([
      'the table muster_entries belongs to platform in registry/names.json, not to industry:muster',
    ]);
  });
});

describe('the industry under check', () => {
  it('comes from the environment, and nothing runs without it', async () => {
    const before = process.env[INDUSTRY_ENV];
    try {
      Reflect.deleteProperty(process.env, INDUSTRY_ENV);
      expect(() => subjectFromEnvironment()).toThrow(`${INDUSTRY_ENV} names no industry`);
      process.env[INDUSTRY_ENV] = 'muster';
      expect((await subjectFromEnvironment()).manifest?.id).toBe('muster');
      process.env[INDUSTRY_ENV] = 'nosuchindustry';
      await expect(subjectFromEnvironment()).rejects.toThrow(
        'There is no industry "nosuchindustry"',
      );
    } finally {
      if (before === undefined) {
        Reflect.deleteProperty(process.env, INDUSTRY_ENV);
      } else {
        process.env[INDUSTRY_ENV] = before;
      }
    }
  });
});

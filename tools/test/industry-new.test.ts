import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { INDUSTRY_ID_PATTERN } from '@onestrand/manifest';
import { describe, expect, it } from 'vitest';
import { readWorkspace, type WorkspacePackage } from '../src/affected.ts';
import {
  INDUSTRY_ID_FORM,
  industryIdProblems,
  leftoverProblems,
  MADE_UP_NAMES,
  nameProposal,
  namesDocument,
  namingOf,
  nextSteps,
  patternWords,
  planIndustry,
  proposedNames,
  readRepository,
  registerLines,
  registerNames,
  renameText,
  RESERVED_INDUSTRY_IDS,
  TEMPLATE_DIR,
  type IdContext,
  type Repository,
} from '../src/industry-new.ts';
import { readNames } from '../src/names.ts';
import { REPO_ROOT } from '../src/repo-files.ts';

const repository = readRepository(REPO_ROOT, readWorkspace(REPO_ROOT));

const EMPTY_CONTEXT: IdContext = {
  industries: [],
  platformPackages: [],
  workspace: [],
  register: [],
  patternWords: new Map(),
};

describe('the id of a new industry', () => {
  it('has the form of the manifest: INDUSTRY_ID_FORM is INDUSTRY_ID_PATTERN of @onestrand/manifest', () => {
    expect(INDUSTRY_ID_FORM.source).toBe(INDUSTRY_ID_PATTERN.source);
    expect(INDUSTRY_ID_FORM.flags).toBe(INDUSTRY_ID_PATTERN.flags);
  });

  it('gives the names of the package, the project and the exports', () => {
    expect(namingOf('probe')).toEqual({
      id: 'probe',
      pascal: 'Probe',
      upper: 'PROBE',
      dir: 'industries/probe',
      core: 'industries/probe/core',
      packageName: '@onestrand-industry/probe',
      project: 'probe-core',
    });
  });

  it('is taken when nothing stands in its way', () => {
    expect(industryIdProblems('facility', repository.context)).toEqual([]);
    expect(industryIdProblems('bau2', EMPTY_CONTEXT)).toEqual([]);
  });

  it.each(['Probe', 'probe_x', 'probe.x', 'probe-x', '2probe', '', 'über'])(
    'is refused in a form that is no id: %j',
    (id) => {
      expect(industryIdProblems(id, EMPTY_CONTEXT)).toEqual([
        expect.stringContaining('is no id of an industry'),
      ]);
    },
  );

  it('is refused when the industry exists, and for the pattern itself', () => {
    expect(industryIdProblems('muster', repository.context)).toEqual([
      'industries/muster exists already: an industry is made once',
    ]);
  });

  it('is refused for the name of a platform package and for a reserved word', () => {
    expect(industryIdProblems('storage', repository.context)).toContainEqual(
      expect.stringContaining('is a package of the platform (platform/storage)'),
    );
    for (const id of ['head', 'platform', 'web', 'core', 'tools']) {
      expect(RESERVED_INDUSTRY_IDS.has(id)).toBe(true);
      expect(industryIdProblems(id, EMPTY_CONTEXT)).toEqual([
        expect.stringContaining('is reserved'),
      ]);
    }
  });

  it('is refused for a word the pattern uses itself, which the copy would clash with', () => {
    // The test «two industries with the same operation» declares a second industry `zwilling`,
    // and the backup of «another edition» has the format `sample-backup`.
    for (const id of ['zwilling', 'twin', 'sample']) {
      expect(industryIdProblems(id, repository.context), id).toEqual([
        expect.stringContaining('is a word the pattern uses itself'),
      ]);
    }
  });

  it('is refused when its package or its Vitest project exists elsewhere', () => {
    const elsewhere: WorkspacePackage[] = [
      { name: '@onestrand-industry/probe', dir: 'somewhere/else', project: 'else', dependsOn: [] },
      {
        name: '@onestrand/other',
        dir: 'platform/probe-core',
        project: 'probe-core',
        dependsOn: [],
      },
    ];
    expect(industryIdProblems('probe', { ...EMPTY_CONTEXT, workspace: elsewhere })).toEqual([
      'the package @onestrand-industry/probe exists already (somewhere/else)',
      'the Vitest project probe-core exists already (platform/probe-core): pnpm check --affected would test the wrong package',
    ]);
  });

  it('is refused when the register gives its namespace to someone else, once per owner', () => {
    const register = [
      { kind: 'table', name: 'probe_entries', owner: 'industry:other' },
      { kind: 'operation', name: 'probe.a.add', owner: 'platform' },
      { kind: 'operation', name: 'probe.b.add', owner: 'platform' },
      { kind: 'operation', name: 'probe.c.add', owner: 'platform' },
      { kind: 'operation', name: 'probe.d.add', owner: 'platform' },
      // Its own names, and names that only begin with the same letters, are no clash.
      { kind: 'table', name: 'probe_kept', owner: 'industry:probe' },
      { kind: 'table', name: 'prober_entries', owner: 'platform' },
    ];
    expect(industryIdProblems('probe', { ...EMPTY_CONTEXT, register })).toEqual([
      'registry/names.json gives names in the namespace of "probe" to industry:other (probe_entries): the namespace is taken',
      'registry/names.json gives names in the namespace of "probe" to platform (probe.a.add, probe.b.add, probe.c.add and 1 more): the namespace is taken',
    ]);
  });
});

describe('renameText', () => {
  it.each([
    ['muster', 'probe'],
    ["id: 'muster.entries.add'", "id: 'probe.entries.add'"],
    ["name: 'muster_entries'", "name: 'probe_entries'"],
    ["storagePrefix: 'muster:'", "storagePrefix: 'probe:'"],
    ["backupFormat: 'muster-backup'", "backupFormat: 'probe-backup'"],
    ["name: 'muster-core'", "name: 'probe-core'"],
    ['"name": "@onestrand-industry/muster"', '"name": "@onestrand-industry/probe"'],
    ['export const musterContract = {', 'export const probeContract = {'],
    ['export const MUSTER_EVENT_TYPES', 'export const PROBE_EVENT_TYPES'],
    ['industries: [MUSTER],', 'industries: [PROBE],'],
    ['export function createMusterUseCases(', 'export function createProbeUseCases('],
    ['export type MusterEventType =', 'export type ProbeEventType ='],
    ["title: 'Muster',", "title: 'Probe',"],
    ['The manifest of `muster`.', 'The manifest of `probe`.'],
  ])('renames %j', (text, renamed) => {
    expect(renameText(text, 'probe')).toBe(renamed);
  });

  it.each(MADE_UP_NAMES.map((name) => [name]))('keeps the made-up name %j', (name) => {
    expect(renameText(`'${name} 12'`, 'probe')).toBe(`'${name} 12'`);
  });

  it('renames into an id with digits and an id that holds the word of the pattern', () => {
    expect(renameText('layOutMusterDemo MUSTER muster.x', 'bau2')).toBe(
      'layOutBau2Demo BAU2 bau2.x',
    );
    expect(renameText('musterContract layOutMusterDemo', 'mustermann')).toBe(
      'mustermannContract layOutMustermannDemo',
    );
  });
});

describe('the pattern, renamed', () => {
  const plan = planIndustry(repository, 'probe').plan;

  it('is the whole pattern under the new id, with its NAMES.md, and nothing else', () => {
    expect(plan).toBeDefined();
    const paths = plan?.files.map(({ path }) => path) ?? [];
    expect(paths).toContain('industries/probe/NAMES.md');
    expect(paths).toContain('industries/probe/core/src/index.ts');
    expect(paths).toContain('industries/probe/core/test/messages.ts');
    expect(paths.filter((path) => path !== 'industries/probe/NAMES.md')).toEqual(
      repository.template.map(({ path }) => path.replace(TEMPLATE_DIR, 'industries/probe/core')),
    );
    expect(paths.some((path) => path.includes('node_modules'))).toBe(false);
  });

  it('leaves no muster behind but the made-up names, in any case', () => {
    // NAMES.md says where the industry comes from; it is written, not renamed.
    const renamed = (plan?.files ?? []).filter(({ path }) => !path.endsWith('/NAMES.md'));
    expect(leftoverProblems(renamed)).toEqual([]);
    const all = renamed.map(({ text }) => text).join('\n');
    expect(all).not.toMatch(/muster(?!(?:weg|betrieb))/);
    expect(all).not.toContain('MUSTER');
  });

  it('still holds every made-up name the generator keeps: the list allows nothing stale', () => {
    const all = repository.template.map(({ text }) => text).join('\n');
    for (const name of MADE_UP_NAMES) {
      expect(all, name).toContain(name);
    }
  });

  it('is the same every time, byte for byte', () => {
    expect(planIndustry(repository, 'probe')).toEqual(planIndustry(repository, 'probe'));
  });

  it('proposes the names of muster in the register, renamed, in the order of the register', () => {
    expect(plan?.proposal).toEqual([
      { kind: 'package', name: '@onestrand-industry/probe' },
      { kind: 'table', name: 'probe_entries' },
      { kind: 'operation', name: 'probe.entries.add' },
      { kind: 'operation', name: 'probe.entries.list' },
      { kind: 'event', name: 'probe_entry.added' },
      { kind: 'feature', name: 'probe.entries' },
      { kind: 'module', name: 'probe.journal' },
      { kind: 'right', name: 'probe.journal_read' },
    ]);
  });
});

describe('a renaming that misses a place', () => {
  const template = (text: string): Repository => ({
    ...repository,
    template: [{ path: `${TEMPLATE_DIR}/src/index.ts`, text }],
  });

  it('is found: a form of the id the rules do not know stops the generator before it writes', () => {
    const missed = template('export const muster = 1;\n// Muster is the reference industry.\n');
    const { problems, plan } = planIndustry(missed, 'probe');
    expect(plan).toBeUndefined();
    expect(problems).toEqual([
      'industries/probe/core/src/index.ts:2: «// Muster is the reference industry.» still says muster: rename this form of the id in tools/src/industry-new.ts (renameText), or add the made-up name to MADE_UP_NAMES',
    ]);
  });

  it('names line and text of every leftover, and not the made-up names around it', () => {
    expect(
      leftoverProblems([
        { path: 'a.ts', text: "'Betrieb Muster'\nconst x = 'Muster AG';\nMUSTERx" },
        { path: 'b.ts', text: "title: '(?:Muster|Beispiel)'" },
      ]),
    ).toEqual([
      { path: 'a.ts', line: 2, text: "const x = 'Muster AG';" },
      { path: 'a.ts', line: 3, text: 'MUSTERx' },
    ]);
  });
});

describe('what the generator refuses besides the id', () => {
  it('a pattern without files, with a binary file, or without names in the register', () => {
    expect(planIndustry({ ...repository, template: [] }, 'probe').problems).toEqual([
      `the pattern ${TEMPLATE_DIR} has no files`,
    ]);
    expect(
      planIndustry({ ...repository, binary: [`${TEMPLATE_DIR}/demo.png`] }, 'probe').problems,
    ).toEqual([
      `${TEMPLATE_DIR}/demo.png is binary: the pattern holds text only, so nothing in it escapes the renaming`,
    ]);
    const withoutNames = { ...repository, context: { ...repository.context, register: [] } };
    expect(planIndustry(withoutNames, 'probe').problems).toEqual([
      'registry/names.json has no active name of "industry:muster", so there is nothing to propose',
    ]);
  });
});

describe('patternWords', () => {
  it('takes the words in quotes of the TypeScript of the pattern that are or begin an id', () => {
    const words = patternWords([
      {
        path: 'test/a.test.ts',
        text: "id: 'zwilling'; format: \"sample-backup\"; `view`; 'docs/fakten/x.md'; 'Betrieb Muster'; 'two words'",
      },
      { path: 'package.json', text: '"name": "ignored"' },
    ]);
    // A sentence in quotes is no word of the pattern.
    expect([...words.keys()]).toEqual(['zwilling', 'sample', 'view', 'docs']);
    expect(words.get('zwilling')).toBe('test/a.test.ts');
  });
});

describe('the proposal of names', () => {
  const proposal = [
    { kind: 'package', name: '@onestrand-industry/probe' },
    { kind: 'table', name: 'probe_entries' },
    { kind: 'operation', name: 'probe.entries.add' },
  ];

  it('takes only the active names of the pattern, renamed', () => {
    expect(
      nameProposal(
        [
          { kind: 'table', name: 'muster_entries', owner: 'industry:muster', status: 'active' },
          { kind: 'table', name: 'muster_old', owner: 'industry:muster', status: 'reserved' },
          { kind: 'table', name: 'people', owner: 'platform', status: 'active' },
        ],
        'probe',
      ),
    ).toEqual([{ kind: 'table', name: 'probe_entries' }]);
  });

  it('is written as a table in NAMES.md and read back from it, also as the formatter aligns it', () => {
    const document = namesDocument('probe', proposal);
    expect(document).toContain('# Namen der Branche `probe`');
    expect(document).toContain('`owner: "industry:probe"`');
    expect(proposedNames(document)).toEqual(proposal);
    const aligned = [
      '| Art         | Kennung                     |',
      '| ----------- | --------------------------- |',
      '| `package`   | `@onestrand-industry/probe` |',
      '|  `table` |`probe_entries`|',
    ].join('\r\n');
    expect(proposedNames(aligned)).toEqual(proposal.slice(0, 2));
  });

  it('gives the head lines the register takes as they are', () => {
    const lines = registerLines(proposal, 'probe');
    expect(lines[1]).toBe(
      '{"kind":"table","name":"probe_entries","owner":"industry:probe","status":"active"}',
    );
    const register = `{ "about": "x", "version": 1, "names": [${lines.join(',')}] }`;
    expect(readNames(register).problems).toEqual([]);
    expect(registerNames(register).map(({ name }) => name)).toEqual(
      proposal.map(({ name }) => name),
    );
  });

  it('reads the register of this repository, and refuses one without names', () => {
    expect(repository.context.register.length).toBeGreaterThan(10);
    expect(() => registerNames('{ "version": 1 }')).toThrow('registry/names.json has no list');
  });
});

describe('the next steps', () => {
  it('install first, then the check of the industry, and the register stays with the head', () => {
    const steps = nextSteps('probe');
    expect(steps[0]).toMatch(/^pnpm install/);
    expect(steps[1]).toMatch(/^pnpm check:industry probe/);
    expect(steps.join('\n')).toContain('industries/probe/NAMES.md');
    expect(steps.join('\n')).toContain('tools/src/words/probe.ts');
  });
});

describe('node tools/industry-new.mjs', () => {
  const script = join(REPO_ROOT, 'tools/industry-new.mjs');
  const runScript = (...args: string[]) =>
    spawnSync(process.execPath, [script, ...args], { cwd: REPO_ROOT, encoding: 'utf8' });

  it('is called wrongly without an id or with more than one: exit code 2', () => {
    for (const args of [[], ['a', 'b'], ['--help']]) {
      const result = runScript(...args);
      expect(result.status, args.join(' ')).toBe(2);
      expect(result.stderr).toContain('Usage: pnpm industry:new <id>');
    }
  });

  it('refuses an id that cannot be one and writes nothing: exit code 1', () => {
    for (const id of ['muster', 'Probe', 'zwilling']) {
      const result = runScript(id);
      expect(result.status, id).toBe(1);
      expect(result.stderr).toContain('nothing was written');
      expect(result.stdout).toBe('');
    }
  });
});

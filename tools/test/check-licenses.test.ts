import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

type LicenceList = Record<string, { name: string }[]>;

/** What tools/check-licenses.mjs exports. */
interface Judgement {
  permissive: (expression: string) => boolean;
  strongCopyleft: (expression: string) => boolean;
  licenceProblems: (lists: { runtime: LicenceList; all: LicenceList }) => string[];
  parseLicenceList: (output: string) => LicenceList;
}

const SCRIPT = fileURLToPath(new URL('../check-licenses.mjs', import.meta.url));
const EXPORTS = ['permissive', 'strongCopyleft', 'licenceProblems', 'parseLicenceList'] as const;

function isJudgement(loaded: unknown): loaded is Judgement {
  return (
    typeof loaded === 'object' &&
    loaded !== null &&
    EXPORTS.every((name) => typeof Reflect.get(loaded, name) === 'function')
  );
}

/** The script is plain JavaScript without types, so its exports are checked once, here. */
async function load(): Promise<Judgement> {
  const loaded: unknown = await import(/* @vite-ignore */ pathToFileURL(SCRIPT).href);
  if (!isJudgement(loaded)) {
    throw new Error(`tools/check-licenses.mjs must export ${EXPORTS.join(', ')}`);
  }
  return loaded;
}

const { permissive, strongCopyleft, licenceProblems, parseLicenceList } = await load();

describe('permissive', () => {
  it.each([
    'MIT',
    'Apache-2.0',
    'ISC',
    'BSD-2-Clause',
    'BSD-3-Clause',
    '0BSD',
    'BlueOak-1.0.0',
    'CC0-1.0',
    'Unlicense',
    'Zlib',
    'OFL-1.1',
  ])('accepts %s', (licence) => {
    expect(permissive(licence)).toBe(true);
  });

  it.each([
    'MPL-2.0',
    'GPL-3.0-only',
    'AGPL-3.0-or-later',
    'LGPL-2.1-only',
    'CC-BY-NC-4.0',
    'UNLICENSED',
    'Unknown',
    'SEE LICENSE IN LICENSE.md',
    'Apache 2.0',
    '',
  ])('refuses «%s»', (licence) => {
    expect(permissive(licence)).toBe(false);
  });

  it('compares identifiers without regard to case and accepts «or later»', () => {
    expect(permissive('mit')).toBe(true);
    expect(permissive('apache-2.0')).toBe(true);
    expect(permissive('Apache-2.0+')).toBe(true);
    expect(permissive('gpl-3.0-only')).toBe(false);
  });

  it('needs one permissive choice in an OR', () => {
    expect(permissive('(MIT OR CC0-1.0)')).toBe(true);
    expect(permissive('MIT OR GPL-3.0-only')).toBe(true);
    expect(permissive('(GPL-2.0-only OR MIT)')).toBe(true);
    expect(permissive('MPL-2.0 OR GPL-2.0-only')).toBe(false);
  });

  it('needs every part of an AND to be permissive', () => {
    expect(permissive('(MIT AND Zlib)')).toBe(true);
    expect(permissive('Apache-2.0 AND MIT AND ISC')).toBe(true);
    expect(permissive('MIT AND GPL-3.0-only')).toBe(false);
    expect(permissive('(GPL-3.0-only AND MIT)')).toBe(false);
  });

  it('binds AND tighter than OR', () => {
    expect(permissive('MIT AND GPL-3.0-only OR ISC')).toBe(true);
    expect(permissive('ISC OR MIT AND GPL-3.0-only')).toBe(true);
    expect(permissive('GPL-3.0-only OR MIT AND LGPL-2.1-only')).toBe(false);
  });

  it('follows parentheses, also several groups and nested ones', () => {
    expect(permissive('(ISC OR MIT) AND GPL-3.0-only')).toBe(false);
    // Two groups: stripping «the outer parentheses» and splitting at OR would call this permissive.
    expect(permissive('(MIT OR GPL-3.0-only) AND (GPL-2.0-only)')).toBe(false);
    expect(permissive('(MIT OR GPL-3.0-only) AND (ISC OR LGPL-2.1-only)')).toBe(true);
    expect(permissive('((MIT))')).toBe(true);
    expect(permissive('(MIT AND (ISC OR (GPL-3.0-only AND Zlib)))')).toBe(true);
    expect(permissive('(MIT AND (MPL-2.0 OR (GPL-3.0-only AND Zlib)))')).toBe(false);
  });

  it('lets the licence before WITH decide: an exception only adds permissions', () => {
    expect(permissive('Apache-2.0 WITH LLVM-exception')).toBe(true);
    expect(permissive('GPL-2.0-only WITH Classpath-exception-2.0')).toBe(false);
    expect(permissive('MIT OR GPL-2.0-only WITH Classpath-exception-2.0')).toBe(true);
  });

  it('reads the operators in lower case too', () => {
    expect(permissive('mit or gpl-3.0-only')).toBe(true);
    expect(permissive('mit and gpl-3.0-only')).toBe(false);
    expect(permissive('apache-2.0 with llvm-exception')).toBe(true);
  });

  it.each([
    'MIT OR',
    'OR MIT',
    'MIT AND AND ISC',
    'MIT ISC',
    '(MIT',
    'MIT)',
    '()',
    'MIT WITH',
    'MIT WITH (ISC)',
    'MIT/X11',
    'MIT, ISC',
    'MIT OR (ISC',
  ])('refuses «%s»: not a well-formed expression is never permissive', (text) => {
    expect(permissive(text)).toBe(false);
  });
});

describe('strongCopyleft', () => {
  it.each([
    'GPL-3.0-only',
    'GPL-2.0-or-later',
    'GPL-3.0+',
    'AGPL-3.0-only',
    'LGPL-2.1-or-later',
    'SSPL-1.0',
    'EUPL-1.2',
    'OSL-3.0',
    'CPAL-1.0',
    'gpl-3.0',
  ])('finds %s', (licence) => {
    expect(strongCopyleft(licence)).toBe(true);
  });

  // A package.json may hold anything as its licence. These are not SPDX, and they are the ways
  // the GNU licences are written most often: none of them may pass as «not strong copyleft».
  it.each(['GPLv3', 'GPL3', 'GPLv2+', 'gplv3', 'AGPLv3', 'LGPLv3', 'LGPLv2.1', 'GPL'])(
    'finds %s, a short name with its version written the old way',
    (licence) => {
      expect(strongCopyleft(licence)).toBe(true);
    },
  );

  it.each(['MIT', 'MPL-2.0', 'CC-BY-4.0', 'Python-2.0', 'Unknown', 'GPLX-1.0', 'OSLO-1.0', ''])(
    'leaves «%s» alone',
    (licence) => {
      expect(strongCopyleft(licence)).toBe(false);
    },
  );

  it('is avoided when an OR offers another choice, whatever that choice is', () => {
    expect(strongCopyleft('MIT OR GPL-3.0-only')).toBe(false);
    expect(strongCopyleft('(MPL-2.0 OR GPL-2.0-only)')).toBe(false);
    expect(strongCopyleft('GPL-2.0-only OR AGPL-3.0-only')).toBe(true);
  });

  it('applies as soon as one part of an AND has it', () => {
    expect(strongCopyleft('MIT AND GPL-3.0-only')).toBe(true);
    expect(strongCopyleft('(MIT OR GPL-3.0-only) AND LGPL-2.1-only')).toBe(true);
    expect(strongCopyleft('(MIT OR GPL-3.0-only) AND (ISC OR LGPL-2.1-only)')).toBe(false);
    expect(strongCopyleft('MIT AND MPL-2.0')).toBe(false);
  });

  it('stays with an exception: only a permissive list could clear it', () => {
    expect(strongCopyleft('GPL-2.0-only WITH Classpath-exception-2.0')).toBe(true);
  });

  it('judges text that is not an expression by the families it mentions', () => {
    expect(strongCopyleft('GNU GPL version 3')).toBe(true);
    expect(strongCopyleft('GNU General Public License v3 or later')).toBe(true);
    expect(strongCopyleft('GNU Affero General Public Licence')).toBe(true);
    expect(strongCopyleft('GNU Lesser General Public License')).toBe(true);
    expect(strongCopyleft('Mozilla Public License 2.0')).toBe(false);
    expect(strongCopyleft('MIT OR')).toBe(false);
    expect(strongCopyleft('GPL-3.0-only OR')).toBe(true);
    expect(strongCopyleft('SEE LICENSE IN LICENSE.md')).toBe(false);
  });
});

/** Made-up packages: the names stand for kinds, not for anything published. */
const CLEAN_RUNTIME: LicenceList = {
  MIT: [{ name: 'schema-sample' }],
  '(MIT OR GPL-3.0-only)': [{ name: 'dual-sample' }],
};
const CLEAN_TOOLING: LicenceList = {
  MIT: [{ name: 'schema-sample' }, { name: 'runner-sample' }],
  '(MIT OR GPL-3.0-only)': [{ name: 'dual-sample' }],
  'Apache-2.0': [{ name: 'compiler-sample' }],
  'MPL-2.0': [{ name: 'bundler-sample' }],
  'CC-BY-4.0': [{ name: 'data-sample' }],
};

describe('licenceProblems', () => {
  it('finds nothing when what ships is permissive and the tooling has no strong copyleft', () => {
    expect(licenceProblems({ runtime: CLEAN_RUNTIME, all: CLEAN_TOOLING })).toEqual([]);
    expect(licenceProblems({ runtime: {}, all: {} })).toEqual([]);
  });

  it('reports a made-up copyleft package that ships, once', () => {
    const copyleft = { 'GPL-3.0-only': [{ name: 'copyleft-sample' }] };
    expect(
      licenceProblems({
        runtime: { ...CLEAN_RUNTIME, ...copyleft },
        all: { ...CLEAN_TOOLING, ...copyleft },
      }),
    ).toEqual(['runtime  GPL-3.0-only: copyleft-sample']);
  });

  it('reports a made-up copyleft package among the tooling', () => {
    expect(
      licenceProblems({
        runtime: CLEAN_RUNTIME,
        all: { ...CLEAN_TOOLING, 'AGPL-3.0-or-later': [{ name: 'copyleft-tool-sample' }] },
      }),
    ).toEqual(['tooling  AGPL-3.0-or-later: copyleft-tool-sample']);
  });

  it('reports copyleft tooling whose licence is not written as SPDX', () => {
    expect(
      licenceProblems({
        runtime: CLEAN_RUNTIME,
        all: {
          ...CLEAN_TOOLING,
          GPLv3: [{ name: 'old-style-sample' }],
          'GNU General Public License v2': [{ name: 'long-name-sample' }],
        },
      }),
    ).toEqual([
      'tooling  GPLv3: old-style-sample',
      'tooling  GNU General Public License v2: long-name-sample',
    ]);
  });

  it('allows weak copyleft for tooling, but not in what ships', () => {
    const weak = { 'MPL-2.0': [{ name: 'bundler-sample' }] };
    expect(licenceProblems({ runtime: {}, all: weak })).toEqual([]);
    expect(licenceProblems({ runtime: weak, all: weak })).toEqual([
      'runtime  MPL-2.0: bundler-sample',
    ]);
  });

  it('reports what ships without a readable licence', () => {
    expect(
      licenceProblems({
        runtime: {
          Unknown: [{ name: 'nameless-sample' }],
          'SEE LICENSE IN LICENSE': [{ name: 'own-terms-sample' }],
        },
        all: {},
      }),
    ).toEqual([
      'runtime  Unknown: nameless-sample',
      'runtime  SEE LICENSE IN LICENSE: own-terms-sample',
    ]);
  });

  it('names every package of a licence, and a tooling package next to a shipped one', () => {
    expect(
      licenceProblems({
        runtime: { 'LGPL-3.0-only': [{ name: 'one-sample' }, { name: 'two-sample' }] },
        all: {
          'LGPL-3.0-only': [
            { name: 'one-sample' },
            { name: 'two-sample' },
            { name: 'tool-sample' },
          ],
        },
      }),
    ).toEqual([
      'runtime  LGPL-3.0-only: one-sample, two-sample',
      'tooling  LGPL-3.0-only: tool-sample',
    ]);
  });

  it('reports an AND that contains copyleft, in what ships and in tooling', () => {
    const mixed = { '(MIT AND GPL-2.0-only)': [{ name: 'mixed-sample' }] };
    expect(licenceProblems({ runtime: mixed, all: mixed })).toEqual([
      'runtime  (MIT AND GPL-2.0-only): mixed-sample',
    ]);
    expect(licenceProblems({ runtime: {}, all: mixed })).toEqual([
      'tooling  (MIT AND GPL-2.0-only): mixed-sample',
    ]);
  });
});

describe('parseLicenceList', () => {
  it('reads the list as pnpm prints it', () => {
    const output = JSON.stringify({
      MIT: [{ name: 'schema-sample', versions: ['1.0.0'], license: 'MIT', paths: ['/somewhere'] }],
    });
    expect(parseLicenceList(output)).toEqual({
      MIT: [{ name: 'schema-sample', versions: ['1.0.0'], license: 'MIT', paths: ['/somewhere'] }],
    });
    expect(parseLicenceList('{}')).toEqual({});
  });

  it('reads the sentence pnpm prints for a project without dependencies as an empty list', () => {
    expect(parseLicenceList('No licenses in packages found\n')).toEqual({});
  });

  it.each([
    ['text', 'Scope: all 7 workspace projects', 'is not JSON'],
    ['nothing', '', 'is not JSON'],
    ['an error object', '{"error":{"code":"ERR_SAMPLE","message":"no lockfile"}}', 'is not a list'],
    ['an array', '[{"name":"schema-sample"}]', 'is not a list'],
    ['null', 'null', 'is not a list'],
    ['packages without a name', '{"MIT":[{"versions":["1.0.0"]}]}', 'is not a list'],
    ['packages that are no objects', '{"MIT":["schema-sample"]}', 'is not a list'],
  ])(
    'refuses %s: an answer it does not understand is not «no problems»',
    (_what, output, message) => {
      expect(() => parseLicenceList(output)).toThrow(message);
    },
  );
});

// --- The script itself, with a made-up pnpm in front of the real one -------------------------

const temporary: string[] = [];
afterEach(() => {
  for (const dir of temporary.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

interface FakePnpm {
  /** What pnpm prints for `--prod` and for everything; `status` is its exit code. */
  runtime: string;
  all: string;
  status?: number;
}

/** Runs the script with a pnpm that answers from files; without `fake`, with no pnpm at all. */
function runScript(fake?: FakePnpm): {
  status: number | null;
  stdout: string;
  stderr: string;
  asked: string[];
} {
  const dir = mkdtempSync(join(tmpdir(), 'onestrand-licences-'));
  temporary.push(dir);
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  const log = join(dir, 'asked.log');
  if (fake !== undefined) {
    writeFileSync(join(dir, 'runtime.out'), fake.runtime);
    writeFileSync(join(dir, 'all.out'), fake.all);
    writeFileSync(
      join(bin, 'pnpm'),
      [
        '#!/bin/sh',
        `printf '%s\\n' "$*" >> '${log}'`,
        `case "$*" in *--prod*) cat '${join(dir, 'runtime.out')}' ;; *) cat '${join(dir, 'all.out')}' ;; esac`,
        `exit ${String(fake.status ?? 0)}`,
        '',
      ].join('\n'),
    );
    chmodSync(join(bin, 'pnpm'), 0o755);
  }
  const path = fake === undefined ? bin : `${bin}${delimiter}${process.env.PATH ?? ''}`;
  const result = spawnSync(process.execPath, [SCRIPT], {
    encoding: 'utf8',
    env: { ...process.env, PATH: path },
  });
  const asked = existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : [];
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, asked };
}

describe.skipIf(process.platform === 'win32')('node tools/check-licenses.mjs', () => {
  it('asks pnpm for what ships and for everything, and passes on clean lists', () => {
    const result = runScript({
      runtime: JSON.stringify(CLEAN_RUNTIME),
      all: JSON.stringify(CLEAN_TOOLING),
    });
    expect(result.asked).toEqual(['licenses list --json --prod', 'licenses list --json']);
    expect(result.stdout).toBe('Licences OK: runtime permissive, no strong copyleft anywhere.\n');
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  it('passes for a project without any dependency', () => {
    const result = runScript({
      runtime: 'No licenses in packages found\n',
      all: 'No licenses in packages found\n',
    });
    expect(result.status).toBe(0);
  });

  it('fails with exit code 1 and names the made-up copyleft package', () => {
    const result = runScript({
      runtime: JSON.stringify(CLEAN_RUNTIME),
      all: JSON.stringify({ ...CLEAN_TOOLING, 'GPL-3.0-only': [{ name: 'copyleft-sample' }] }),
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe(
      'Licences that could limit commercial use:\ntooling  GPL-3.0-only: copyleft-sample\n',
    );
  });

  it('fails with exit code 1 for weak copyleft in what ships', () => {
    const result = runScript({
      runtime: JSON.stringify({ 'MPL-2.0': [{ name: 'bundler-sample' }] }),
      all: JSON.stringify(CLEAN_TOOLING),
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('runtime  MPL-2.0: bundler-sample');
  });

  it('fails with exit code 2 when pnpm reports an error', () => {
    const answer = '{"error":{"code":"ERR_SAMPLE","message":"No lockfile found"}}';
    const result = runScript({ runtime: answer, all: answer, status: 1 });
    expect(result.status).toBe(2);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('licenses:check could not read the licences');
    expect(result.stderr).toContain('«pnpm licenses list --json --prod» failed (1)');
    expect(result.stderr).toContain('No lockfile found');
  });

  it('fails with exit code 2 when pnpm answers something else than a list', () => {
    const result = runScript({ runtime: 'Done in 1s\n', all: '{}' });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('the answer of pnpm is not JSON');
  });

  it('fails with exit code 2 when pnpm cannot be started: a missing tool is not a pass', () => {
    const result = runScript();
    expect(result.status).toBe(2);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('could not start «pnpm licenses list --json --prod»');
  });
});

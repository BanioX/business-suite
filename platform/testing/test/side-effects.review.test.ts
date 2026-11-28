// Origin: BanioX/Randen apps/web/src/side-effects.test.ts @ e0f0907 — adapted: only the tests of the guard itself, on made-up sources and a made-up register; one fixture that trips and one that passes for every kind and for every rule of the register
import { describe, expect, it } from 'vitest';
import {
  occurrences,
  parseRegister,
  REGISTER_COLUMNS,
  registerProblems,
  SIDE_EFFECT_KINDS,
  sideEffectProblems,
  sideEffectRegisterProblems,
  storageKeyProblems,
  storageKeys,
  withoutComments,
  type SideEffectKind,
  type SourceFile,
} from '../src';

const HEAD = [
  '| Kennung | Nebenwirkung | Im Code | Wo | Daten verlassen das Gerät? | Entscheid | Seit |',
  '| --- | --- | --- | --- | --- | --- | --- |',
];

/** A register with the head of its table and the given rows. */
const registerOf = (...rows: string[]) => ['# Nebenwirkungen', '', ...HEAD, ...rows, ''].join('\n');

/** One row; every cell can be replaced. */
function row(cells: {
  id?: string;
  effect?: string;
  code?: string;
  where?: string;
  leaves?: string;
  decision?: string;
  since?: string;
}): string {
  const {
    id = 'SE-01',
    effect = 'Etwas ausserhalb der App',
    code = '–',
    where = 'apps/sample/src/x.ts',
    leaves = 'nein',
    decision = 'ADR-0006',
    since = '14.11.2026',
  } = cells;
  return `| ${id} | ${effect} | ${code} | ${where} | ${leaves} | ${decision} | ${since} |`;
}

/** A made-up register as an edition keeps it: several tables, dated and planned rows. */
const REGISTER = [
  '# Nebenwirkungen',
  '',
  'Was die App ausserhalb ihrer selbst bewirkt.',
  '',
  '## Gerätespeicher',
  '',
  ...HEAD,
  row({ id: 'SE-01', effect: 'Abruf der App-Dateien', code: '– (macht der Browser)' }),
  row({ id: 'SE-02', effect: 'Datenbank `sample` im Browser', code: '`indexedDB`' }),
  row({ id: 'SE-03', effect: 'Dauerhafter Speicher', code: '`storage.persist`' }),
  row({ id: 'SE-04', effect: 'Dateien der App ohne Netz', code: '`serviceWorker`' }),
  row({
    id: 'SE-05',
    effect: 'sessionStorage `sample:reloaded-for-update`',
    code: '`sessionStorage`',
  }),
  row({ id: 'SE-06', effect: 'localStorage `sample:last-backup`', code: '`localStorage`' }),
  '',
  '## Funktionen des Geräts',
  '',
  ...HEAD,
  row({
    id: 'SE-07',
    effect: 'Foto aufnehmen oder wählen',
    code: '`capture=`, `type="file"`, `createObjectURL`',
  }),
  row({ id: 'SE-08', effect: 'Kamerabild in der App', code: '`getUserMedia`', since: 'geplant' }),
  '',
  '## Was die Person selbst hinausträgt',
  '',
  ...HEAD,
  row({ id: 'SE-09', effect: 'Drucken', code: '`window.print`' }),
  row({
    id: 'SE-10',
    effect: 'Teilen',
    code: '`navigator.share`',
    leaves: 'ja, nur auf Tipp der Person',
  }),
  row({
    id: 'SE-11',
    effect: 'Kopieren',
    code: '`navigator.clipboard`',
    leaves: 'ja, nur auf Tipp der Person',
    since: 'geplant',
  }),
  row({ id: 'SE-12', effect: 'Als Datei sichern', code: '`download`, `createObjectURL`' }),
  '',
].join('\n');

const at = (code: string, path = 'apps/sample/src/features/x/Page.tsx') =>
  occurrences([{ path, code }]);

/** Code that gives each kind away; the first sample of a kind is its plainest form. */
const SAMPLES: Record<string, readonly string[]> = {
  'fetch(': [`await fetch('/api/orders', { method: 'POST', body });`, 'window.fetch (url)'],
  XMLHttpRequest: ['const request = new XMLHttpRequest();'],
  WebSocket: [
    `const socket = new WebSocket('wss://example.invalid');`,
    `const transport = new WebTransport(url);`,
    'const peer = new RTCPeerConnection();',
  ],
  EventSource: [`const stream = new EventSource('/events');`],
  sendBeacon: [`navigator.sendBeacon('/log', data);`],
  indexedDB: [
    `const request = indexedDB.open('sample');`,
    'class SampleDb extends Dexie {}',
    `import { liveQuery } from 'dexie';`,
    `import x from "dexie-react-hooks";`,
  ],
  localStorage: [`localStorage.setItem('sample:last-backup', day);`],
  sessionStorage: [`sessionStorage.getItem('sample:reloaded-for-update');`],
  'document.cookie': [`document.cookie = 'a=1';`, 'const all = document . cookie;'],
  'storage.persist': ['await navigator.storage.persist();'],
  serviceWorker: [
    `navigator.serviceWorker.register('/sw.js');`,
    'plugins: [VitePWA({ registerType })]',
    `import { registerSW } from 'virtual:pwa-register';`,
  ],
  getUserMedia: [
    'await navigator.mediaDevices.getUserMedia({ video: true });',
    'const devices = navigator.mediaDevices;',
  ],
  'capture=': ['return <input capture="environment" />;', 'input.capture = "user";'],
  'type="file"': [
    'return <input type="file" accept="image/*" />;',
    `return <input type={'file'} />;`,
    `<input type='file'>`,
  ],
  geolocation: ['navigator.geolocation.getCurrentPosition(done);'],
  Notification: [
    `new Notification('Lieferung ist da');`,
    'await Notification.requestPermission();',
    `if (Notification.permission === 'granted') {}`,
    `registration.showNotification('Lieferung ist da');`,
  ],
  'window.print': ['window.print();', 'const run = window.print;', 'print();', ' print( );'],
  'navigator.share': ['await navigator.share({ text });', 'if (navigator.canShare(data)) {}'],
  'navigator.clipboard': [
    'await navigator.clipboard.writeText(text);',
    `document.execCommand('copy');`,
    `document.execCommand("cut");`,
  ],
  'window.open': [`window.open(url, '_blank');`],
  download: [
    'return <a href={url} download="sicherung.json">Sichern</a>;',
    'link.download = name;',
    'return <a\n  href={url}\n  download\n>Sichern</a>;',
  ],
  createObjectURL: ['const url = URL.createObjectURL(blob);'],
};

const NETWORK = ['fetch(', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'sendBeacon'];

describe('SIDE_EFFECT_KINDS', () => {
  it('are these kinds, each with a key of its own', () => {
    expect(SIDE_EFFECT_KINDS.map((kind) => kind.key)).toEqual([
      'fetch(',
      'XMLHttpRequest',
      'WebSocket',
      'EventSource',
      'sendBeacon',
      'indexedDB',
      'localStorage',
      'sessionStorage',
      'document.cookie',
      'storage.persist',
      'serviceWorker',
      'getUserMedia',
      'capture=',
      'type="file"',
      'geolocation',
      'Notification',
      'window.print',
      'navigator.share',
      'navigator.clipboard',
      'window.open',
      'download',
      'createObjectURL',
    ]);
    expect(Object.keys(SAMPLES)).toEqual(SIDE_EFFECT_KINDS.map((kind) => kind.key));
  });

  it('mark exactly the kinds that send something to a server', () => {
    expect(
      SIDE_EFFECT_KINDS.filter((kind) => kind.network === true).map((kind) => kind.key),
    ).toEqual(NETWORK);
  });

  it('can be named in a table: no key holds a backtick or a bar', () => {
    for (const { key } of SIDE_EFFECT_KINDS) {
      expect(key, key).not.toMatch(/[`|]/);
      expect(key.trim(), key).toBe(key);
    }
  });
});

describe('occurrences', () => {
  it('finds every kind in every form it is written in, and nothing else in that code', () => {
    for (const [key, samples] of Object.entries(SAMPLES)) {
      for (const sample of samples) {
        const found = at(sample);
        expect([...found.keys()], sample).toContain(key);
        expect(found.get(key), sample).toEqual(['apps/sample/src/features/x/Page.tsx']);
      }
      // The plainest form gives away its own kind only.
      expect([...at(samples[0] ?? '').keys()], key).toEqual([key]);
    }
  });

  it('tells similar words apart', () => {
    for (const code of [
      'refetch(); const printable = true; className="print:hidden"',
      'addEventListener("x", f, { capture: true });',
      'if (download === wanted) {}',
      'if (download == wanted) {}',
      'printer.print(); this.print(); sprint();',
      'const cookie = jar.cookie; const documents = []; documentCookie();',
      'const notification = { title }; type Notification = { title: string };',
      'windowOpen(); view.open(); const open = window.opened;',
      'const type = "filename"; const kind = type === "file";',
      'const persisted = true; persist; store.persistent();',
      'const fetched = 1; const fetch = undefined;',
      'myWebSocketUrl; EventSources; MyEventSource;',
      'const share = navigator.shared; const clip = navigator.clipboardless;',
      `document.execCommand('bold');`,
    ]) {
      expect([...at(code).keys()], code).toEqual([]);
    }
  });

  it('ignores comments, but not code that follows an address in a text', () => {
    expect(at('// later: fetch( the price list\n/* navigator.share */ const a = 1;').size).toBe(0);
    expect(at('/**\n * Never call window.print() here.\n */\nexport const a = 1;').size).toBe(0);
    expect(at(`const base = 'https://example.invalid'; fetch(base);`).has('fetch(')).toBe(true);
    expect(
      at(`const glob = 'src/**/*.ts';\nfetch(glob);\nconst more = '**/*.md';`).has('fetch('),
    ).toBe(true);
    // What stands in a text is code: a kind named in a string is found.
    expect(at('const hint = `Call fetch( later`;').has('fetch(')).toBe(true);
  });

  it('lists the files of each kind in the order they were given, each once', () => {
    const sources: SourceFile[] = [
      { path: 'b.ts', code: 'window.print(); window.print();' },
      { path: 'a.ts', code: 'window.print(); const url = URL.createObjectURL(blob);' },
      { path: 'c.ts', code: 'export const nothing = 1;' },
    ];
    const found = occurrences(sources);
    expect([...found]).toEqual([
      ['window.print', ['b.ts', 'a.ts']],
      ['createObjectURL', ['a.ts']],
    ]);
    expect(occurrences([]).size).toBe(0);
  });

  it('looks for the kinds it is given, also with a pattern that remembers where it was', () => {
    const kinds: SideEffectKind[] = [
      { key: 'bluetooth', pattern: /\bbluetooth\b/g },
      { key: 'beacon', pattern: /\bsendBeacon\b/y, network: true },
    ];
    const sources: SourceFile[] = [
      { path: 'one.ts', code: 'await navigator.bluetooth.requestDevice(); fetch(url);' },
      { path: 'two.ts', code: 'navigator.bluetooth;' },
      { path: 'three.ts', code: 'x; navigator.bluetooth; sendBeacon;' },
    ];
    expect([...occurrences(sources, kinds)]).toEqual([
      ['bluetooth', ['one.ts', 'two.ts', 'three.ts']],
      ['beacon', ['three.ts']],
    ]);
    expect(kinds[0]?.pattern.lastIndex).toBe(0);
  });

  it('exports the reader of comments it uses', () => {
    expect(withoutComments('a(); // fetch(\nb(); /* fetch( */')).toBe('a(); \nb();  ');
  });
});

describe('parseRegister', () => {
  it('reads every row of every table', () => {
    const rows = parseRegister(REGISTER);
    expect(rows.map((each) => each.id)).toEqual([
      'SE-01',
      'SE-02',
      'SE-03',
      'SE-04',
      'SE-05',
      'SE-06',
      'SE-07',
      'SE-08',
      'SE-09',
      'SE-10',
      'SE-11',
      'SE-12',
    ]);
    expect(rows[0]).toEqual({
      id: 'SE-01',
      line: '| SE-01 | Abruf der App-Dateien | – (macht der Browser) | apps/sample/src/x.ts | nein | ADR-0006 | 14.11.2026 |',
      keys: [],
      leaves: 'nein',
      decision: 'ADR-0006',
      since: '14.11.2026',
    });
    expect(rows[6]?.keys).toEqual(['capture=', 'type="file"', 'createObjectURL']);
    expect(rows[9]?.leaves).toBe('ja, nur auf Tipp der Person');
    expect(rows[10]?.since).toBe('geplant');
  });

  it('reads only what stands in backticks in «Im Code» as a kind', () => {
    const [found] = parseRegister(
      row({
        effect: 'Speicher `sample:key` mit `fetch(`',
        code: '`localStorage`',
        where: '`a.ts`',
      }),
    );
    expect(found?.keys).toEqual(['localStorage']);
  });

  it('keeps a bar that is escaped inside its cell', () => {
    const [found] = parseRegister(row({ effect: 'a \\| b', code: '`download`', since: 'geplant' }));
    expect(found?.keys).toEqual(['download']);
    expect(found?.since).toBe('geplant');
  });

  it('reads a register with the line ends of another system, and a table that is indented', () => {
    const rows = parseRegister(REGISTER.replaceAll('\n', '\r\n'));
    expect(rows).toHaveLength(12);
    expect(rows[11]?.since).toBe('14.11.2026');
    expect(parseRegister(`  ${row({ code: '`download`' })}`)[0]?.keys).toEqual(['download']);
  });

  it('takes a line without an id of the register for no row', () => {
    expect(parseRegister(HEAD.join('\n'))).toEqual([]);
    expect(parseRegister('| NW-01 | x | `download` | x | nein | ADR-0006 | geplant |')).toEqual([]);
    expect(parseRegister('SE-01 steht weiter unten.')).toEqual([]);
    expect(parseRegister('')).toEqual([]);
  });

  it('reads a row that is cut short without failing; its missing cells are empty', () => {
    expect(parseRegister('| SE-01 | x |')).toEqual([
      { id: 'SE-01', line: '| SE-01 | x |', keys: [], leaves: '', decision: '', since: '' },
    ]);
  });
});

describe('registerProblems', () => {
  const rules = (markdown: string) => registerProblems(markdown).map((problem) => problem.rule);

  it('finds nothing in a register that is well formed', () => {
    expect(registerProblems(REGISTER)).toEqual([]);
    expect(registerProblems(registerOf(row({})))).toEqual([]);
    expect(REGISTER_COLUMNS).toEqual([
      'Kennung',
      'Nebenwirkung',
      'Im Code',
      'Wo',
      'Daten verlassen das Gerät?',
      'Entscheid',
      'Seit',
    ]);
  });

  it('register.table: a register holds a table', () => {
    for (const markdown of ['', '# Nebenwirkungen\n\nNoch nichts.', row({})]) {
      const problems = registerProblems(markdown);
      expect(problems.filter((problem) => problem.subject === 'register')).toEqual([
        {
          rule: 'register.table',
          subject: 'register',
          paths: [],
          message: 'The register holds no table that starts with «Kennung».',
        },
      ]);
    }
  });

  it('register.table: a row stands in a table with the head of the register', () => {
    // Its cells are read by their place: under another head they would mean something else.
    const other = [
      '| Nr. | Was | Code | Ort | Verlässt das Gerät? | Entscheid | Seit |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      row({ id: 'SE-02', code: '`download`' }),
    ].join('\n');
    const problems = registerProblems(`${registerOf(row({}))}\n${other}`);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatchObject({ rule: 'register.table', subject: 'SE-02', paths: [] });
    // A row after the end of its table has left it.
    expect(rules(`${registerOf(row({}))}\nText dazwischen.\n${row({ id: 'SE-02' })}`)).toEqual([
      'register.table',
    ]);
    // Without any table, the row and the missing table are both said.
    expect(rules(row({}))).toEqual(['register.table', 'register.table']);
  });

  it('register.table: every table has the columns the test reads, in their order', () => {
    const swapped = [
      '| Kennung | Nebenwirkung | Wo | Im Code | Daten verlassen das Gerät? | Entscheid | Seit |',
      HEAD[1] ?? '',
      row({}),
    ].join('\n');
    expect(rules(swapped)).toEqual(['register.table']);
    const short = ['| Kennung | Nebenwirkung | Im Code |', '| --- | --- | --- |'].join('\n');
    expect(rules(short)).toEqual(['register.table']);
    // The second table is checked like the first.
    expect(rules(`${registerOf(row({}))}\n${short}`)).toEqual(['register.table']);
    // A table of another kind in the same document is none of the register.
    const legend = ['| Wort | Bedeutung |', '| --- | --- |', '| geplant | noch ohne Code |'];
    expect(rules(`${registerOf(row({}))}\n${legend.join('\n')}`)).toEqual([]);
  });

  it('register.row: every row of a table of the register starts with an id', () => {
    for (const id of ['S-01', 'SE 01', 'se-01', '01', '']) {
      const problems = registerProblems(registerOf(row({}), row({ id, code: '`download`' })));
      expect(problems, id).toHaveLength(1);
      expect(problems[0]).toMatchObject({ rule: 'register.row', subject: id, paths: [] });
    }
    // The line under the head is no row, however it aligns its columns.
    const aligned = [HEAD[0], '| :-- | --- | :-: | --: | --- | --- | - |', row({})].join('\n');
    expect(rules(aligned)).toEqual([]);
  });

  it('register.row: a row has as many cells as the table has columns', () => {
    expect(rules(registerOf('| SE-01 | x | – | x | nein | ADR-0006 |'))).toContain('register.row');
    const tooMany = registerProblems(registerOf(`${row({})} mehr |`));
    expect(tooMany.map((problem) => problem.message)).toEqual([
      'SE-01: the row has 8 cells, the table 7.',
    ]);
    // A bar inside a cell must be escaped, or it splits the cell.
    expect(rules(registerOf(row({ effect: 'a | b' })))).toContain('register.row');
    expect(rules(registerOf(row({ effect: 'a \\| b' })))).toEqual([]);
  });

  it('register.row: an id has the form SE-nn and occurs once', () => {
    for (const id of ['SE-1', 'SE-A1', 'SE-01a', 'SE-']) {
      expect(rules(registerOf(row({ id }))), id).toEqual(['register.row']);
    }
    expect(rules(registerOf(row({ id: 'SE-100' })))).toEqual([]);
    const twice = registerProblems(registerOf(row({ id: 'SE-02' }), row({}), row({ id: 'SE-02' })));
    expect(twice).toEqual([
      { rule: 'register.row', subject: 'SE-02', paths: [], message: 'SE-02: the id occurs twice.' },
    ]);
  });

  it('register.row: «Daten verlassen das Gerät?» is a clear yes or no', () => {
    for (const leaves of [
      '',
      'vielleicht',
      'jaein',
      'neinsager',
      'Ja',
      'NEIN',
      'kaum, nein',
      '–',
    ]) {
      expect(rules(registerOf(row({ leaves }))), leaves).toEqual(['register.row']);
    }
    for (const leaves of ['ja', 'nein', 'nein, keine Betriebsdaten', 'ja: nur auf Tipp', 'ja.']) {
      expect(rules(registerOf(row({ leaves }))), leaves).toEqual([]);
    }
  });

  it('register.row: «Seit» is a day of the calendar or «geplant»', () => {
    for (const since of [
      '',
      'bald',
      'Geplant',
      'geplant ab Frühling',
      '2026-11-14',
      '14.11.26',
      '14.11.2026 (Entwurf)',
      'seit 14.11.2026',
      '14/11/2026',
      // Days that do not exist.
      '30.02.2026',
      '31.04.2026',
      '00.01.2026',
      '14.13.2026',
      '99.99.2026',
      '29.02.2027',
    ]) {
      const problems = registerProblems(registerOf(row({ since })));
      expect(
        problems.map((problem) => problem.rule),
        since,
      ).toEqual(['register.row']);
      expect(problems[0]?.message, since).toContain('«Seit»');
    }
    for (const since of ['geplant', '14.11.2026', '1.2.2027', '01.02.2027', '29.02.2028']) {
      expect(rules(registerOf(row({ since }))), since).toEqual([]);
    }
  });

  it('register.row: «Entscheid» names the ADR that carries the row', () => {
    for (const decision of [
      '',
      'Alban, 14.11.2026',
      'ADR-6',
      'ADR 0006',
      'adr-0006',
      'ADR-00061',
    ]) {
      const problems = registerProblems(registerOf(row({ decision })));
      expect(
        problems.map((problem) => problem.rule),
        decision,
      ).toEqual(['register.row']);
      expect(problems[0]?.message, decision).toContain('«Entscheid»');
    }
    for (const decision of ['ADR-0006', 'ADR-0014, ADR-0015', '[ADR-0006](adr/0006-x.md)']) {
      expect(rules(registerOf(row({ decision }))), decision).toEqual([]);
    }
  });

  it('register.kind: a row names only kinds the test knows, so a typo hides nothing', () => {
    for (const code of ['`fetch`', '`localstorage`', '`window.print()`', '`type=file`', '` `']) {
      const problems = registerProblems(registerOf(row({ code })));
      expect(
        problems.map((problem) => problem.rule),
        code,
      ).toEqual(['register.kind']);
      expect(problems[0]).toMatchObject({ subject: 'SE-01', paths: [] });
    }
    const two = registerProblems(registerOf(row({ code: '`download`, `Download`, `drucken`' })));
    expect(two.map((problem) => problem.message.slice(0, 40))).toEqual([
      'SE-01: «Im Code» names `Download`, which',
      'SE-01: «Im Code» names `drucken`, which ',
    ]);
    // Every kind the test knows can be named.
    const every = SIDE_EFFECT_KINDS.filter((kind) => kind.network !== true)
      .map((kind) => `\`${kind.key}\``)
      .join(', ');
    expect(rules(registerOf(row({ code: every })))).toEqual([]);
    // With kinds of its own, an edition names those.
    const kinds: SideEffectKind[] = [{ key: 'bluetooth', pattern: /\bbluetooth\b/ }];
    expect(registerProblems(registerOf(row({ code: '`bluetooth`' })), kinds)).toEqual([]);
    expect(
      registerProblems(registerOf(row({ code: '`download`' })), kinds).map((each) => each.rule),
    ).toEqual(['register.kind']);
  });

  it('register.request: a row for a request to a server carries «ja» and the decision', () => {
    for (const key of NETWORK) {
      const code = `\`${key}\``;
      const decided = { code, leaves: 'ja', decision: 'Alban, 14.11.2026, ADR-0099' };
      expect(rules(registerOf(row(decided))), key).toEqual([]);
      expect(rules(registerOf(row({ ...decided, since: 'geplant' }))), key).toEqual([]);

      // Without «ja».
      expect(rules(registerOf(row({ ...decided, leaves: 'nein' }))), key).toEqual([
        'register.request',
      ]);
      // Without «Alban, TT.MM.JJJJ».
      for (const decision of [
        'ADR-0099',
        'Alban, ADR-0099',
        'Alban 14.11.2026, ADR-0099',
        'alban, 14.11.2026, ADR-0099',
        'Team, 14.11.2026, ADR-0099',
        'Alban, im November 2026, ADR-0099',
        // A day that does not exist is no day anyone decided on.
        'Alban, 31.11.2026, ADR-0099',
      ]) {
        expect(rules(registerOf(row({ ...decided, decision }))), decision).toEqual([
          'register.request',
        ]);
      }
      // Without an ADR: the rule of every row.
      expect(rules(registerOf(row({ ...decided, decision: 'Alban, 14.11.2026' }))), key).toEqual([
        'register.row',
      ]);
    }
    // One network kind among others is enough to need the decision.
    expect(rules(registerOf(row({ code: '`download`, `sendBeacon`', leaves: 'ja' })))).toEqual([
      'register.request',
    ]);
    // A later decision beside an earlier note counts.
    expect(
      rules(
        registerOf(
          row({
            code: '`fetch(`',
            leaves: 'ja',
            decision: 'Alban, 31.11.2026 (Entwurf); Alban, 2.12.2026, ADR-0099',
          }),
        ),
      ),
    ).toEqual([]);
  });

  it('reports every finding of a row, not only the first', () => {
    const problems = registerProblems(
      registerOf(
        row({ id: 'SE-1', code: '`fetch(`, `funk`', leaves: 'kaum', decision: '', since: 'bald' }),
      ),
    );
    expect(problems.map((problem) => problem.rule)).toEqual([
      'register.row',
      'register.row',
      'register.row',
      'register.row',
      'register.kind',
      'register.request',
    ]);
    expect(problems.every((problem) => problem.subject === 'SE-1')).toBe(true);
  });
});

describe('sideEffectProblems', () => {
  const rows = parseRegister(REGISTER);

  it('finds nothing when every kind in the code stands in the register', () => {
    const code = [
      `const request = indexedDB.open('sample');`,
      'await navigator.storage.persist();',
      'window.print();',
      'await navigator.share({ text });',
      'const url = URL.createObjectURL(blob);',
      'return <a href={url} download="sicherung.json">Sichern</a>;',
      'return <input type="file" accept="image/*" capture="environment" />;',
    ].join('\n');
    const found = at(code);
    expect(found.size).toBe(8);
    expect(sideEffectProblems(found, rows)).toEqual([]);
    expect(sideEffectProblems(new Map(), rows)).toEqual([]);
    expect(sideEffectProblems(new Map(), [])).toEqual([]);
  });

  it('side_effect.unregistered: every kind fails until the register lists it', () => {
    for (const kind of SIDE_EFFECT_KINDS.filter(({ network }) => network !== true)) {
      const found = at(SAMPLES[kind.key]?.[0] ?? '');
      const problems = sideEffectProblems(found, []);
      expect(problems, kind.key).toHaveLength(1);
      expect(problems[0]).toMatchObject({
        rule: 'side_effect.unregistered',
        subject: kind.key,
        paths: ['apps/sample/src/features/x/Page.tsx'],
      });
      expect(problems[0]?.message).toContain('apps/sample/src/features/x/Page.tsx');

      // A row for another kind does not help; a row for this one does.
      const other = kind.key === 'download' ? 'geolocation' : 'download';
      expect(
        sideEffectProblems(found, parseRegister(row({ code: `\`${other}\`` }))),
        kind.key,
      ).toHaveLength(1);
      const registered = parseRegister(row({ id: 'SE-90', code: `\`${kind.key}\`` }));
      expect(sideEffectProblems(found, registered), kind.key).toEqual([]);
    }
  });

  it('side_effect.unregistered: a new kind fails beside a register that knows the others', () => {
    const notification = at(`new Notification('Lieferung ist da');`);
    expect(sideEffectProblems(notification, rows).map((problem) => problem.subject)).toEqual([
      'Notification',
    ]);
    const registered = parseRegister(
      row({ id: 'SE-90', effect: 'Mitteilung des Geräts', code: '`Notification`' }),
    );
    expect(sideEffectProblems(notification, [...rows, ...registered])).toEqual([]);
  });

  it('lets a kind arrive whose row is marked «geplant»', () => {
    const arriving = at(
      'await navigator.clipboard.writeText(text);\nawait navigator.mediaDevices.getUserMedia({});',
    );
    expect([...arriving.keys()].sort()).toEqual(['getUserMedia', 'navigator.clipboard']);
    expect(sideEffectProblems(arriving, rows)).toEqual([]);
  });

  it('side_effect.request: a request to a server always fails, even with an ordinary row', () => {
    for (const key of NETWORK) {
      for (const sample of SAMPLES[key] ?? []) {
        const request = at(sample);
        expect([...request.keys()], sample).toContain(key);
        const failing = (register: string) =>
          sideEffectProblems(request, parseRegister(register)).map((problem) => problem.rule);
        const code = `\`${key}\``;

        // No row at all, and the made-up register that knows no request.
        expect(failing(''), sample).toEqual(['side_effect.request']);
        expect(sideEffectProblems(request, rows), sample).toHaveLength(1);
        // An ordinary row: «ja» and an ADR, but nobody decided.
        expect(failing(row({ code, leaves: 'ja', decision: 'ADR-0099' })), sample).toEqual([
          'side_effect.request',
        ]);
        // Decided, but marked «nein».
        expect(
          failing(row({ code, leaves: 'nein', decision: 'Alban, 14.11.2026, ADR-0099' })),
          sample,
        ).toEqual(['side_effect.request']);
        // Decided, but without an ADR.
        expect(failing(row({ code, leaves: 'ja', decision: 'Alban, 14.11.2026' })), sample).toEqual(
          ['side_effect.request'],
        );
        // Decided on a day that does not exist.
        expect(
          failing(row({ code, leaves: 'ja', decision: 'Alban, 30.02.2026, ADR-0099' })),
          sample,
        ).toEqual(['side_effect.request']);
        // The decision stands in the row of another kind.
        expect(
          failing(
            row({ code: '`download`', leaves: 'ja', decision: 'Alban, 14.11.2026, ADR-0099' }),
          ),
          sample,
        ).toEqual(['side_effect.request']);

        // «ja», «Alban, TT.MM.JJJJ» and the ADR in the row of the kind.
        const decided = row({ code, leaves: 'ja', decision: 'Alban, 14.11.2026, ADR-0099' });
        expect(failing(decided), sample).toEqual([]);
        // One decided row is enough beside an ordinary one for the same kind.
        expect(
          failing(`${row({ id: 'SE-02', code, leaves: 'ja', decision: 'ADR-0099' })}\n${decided}`),
          sample,
        ).toEqual([]);
      }
    }
  });

  it('side_effect.request: says where the request is and what its row needs', () => {
    const found = occurrences([
      { path: 'apps/sample/src/sync.ts', code: 'await fetch(url);' },
      { path: 'apps/sample/src/more.ts', code: 'fetch(other);' },
    ]);
    expect(sideEffectProblems(found, [])).toEqual([
      {
        rule: 'side_effect.request',
        subject: 'fetch(',
        paths: ['apps/sample/src/sync.ts', 'apps/sample/src/more.ts'],
        message:
          '`fetch(` in apps/sample/src/sync.ts, apps/sample/src/more.ts: a request to a server needs a decision by the product owner. ' +
          'Its row of the register needs «ja» in «Daten verlassen das Gerät?» and «Alban, TT.MM.JJJJ, ADR-NNNN» in «Entscheid».',
      },
    ]);
  });

  it('treats a kind of its own as the list of kinds says', () => {
    const kinds: SideEffectKind[] = [
      { key: 'bluetooth', pattern: /\bbluetooth\b/ },
      { key: 'upload', pattern: /\bupload\s*\(/, network: true },
    ];
    const found = occurrences(
      [{ path: 'a.ts', code: 'navigator.bluetooth; upload(file); fetch(url);' }],
      kinds,
    );
    expect([...found.keys()]).toEqual(['bluetooth', 'upload']);
    const ordinary = parseRegister(`${row({ code: '`bluetooth`' })}\n${row({ code: '`upload`' })}`);
    expect(sideEffectProblems(found, ordinary, kinds).map((problem) => problem.rule)).toEqual([
      'side_effect.request',
    ]);
    // Without the list, `upload` is a kind like any other.
    expect(sideEffectProblems(found, ordinary)).toEqual([]);
  });
});

describe('storage keys', () => {
  const sources: SourceFile[] = [
    {
      path: 'apps/sample/src/app/new-version.ts',
      code: `const KEY = 'sample:reloaded-for-update';\nsessionStorage.setItem(KEY, now);`,
    },
    {
      path: 'apps/sample/src/features/settings/last-backup.ts',
      code: 'localStorage.setItem("sample:last-backup", day); localStorage.getItem(`sample:last-backup`);',
    },
    {
      path: 'apps/sample/src/app/view.ts',
      code: `// 'sample:old-key' is gone\nconst KEY = 'sample:view.v2'; const OTHER = 'other:key';`,
    },
    { path: 'apps/sample/src/app/again.ts', code: `read('sample:last-backup');` },
  ];

  it('finds every key under the prefix of the edition, with the files it stands in', () => {
    expect([...storageKeys(sources, 'sample')]).toEqual([
      ['sample:reloaded-for-update', ['apps/sample/src/app/new-version.ts']],
      [
        'sample:last-backup',
        ['apps/sample/src/features/settings/last-backup.ts', 'apps/sample/src/app/again.ts'],
      ],
      ['sample:view.v2', ['apps/sample/src/app/view.ts']],
    ]);
    expect([...storageKeys(sources, 'other').keys()]).toEqual(['other:key']);
    expect(storageKeys(sources, 'none').size).toBe(0);
    expect(storageKeys([], 'sample').size).toBe(0);
  });

  it('reads no key out of a longer word or another prefix', () => {
    const code = `'mysample:key'; 'sample:'; 'sample'; 'Sample:Key'; "sample:key`;
    expect(storageKeys([{ path: 'a.ts', code }], 'sample').size).toBe(0);
  });

  it('refuses a prefix that is no technical name', () => {
    for (const prefix of ['', 'Sample', 'sample:', 'a b', '.*', '1st', 'sample|other']) {
      expect(() => storageKeys(sources, prefix), prefix).toThrow(RangeError);
      expect(() => storageKeyProblems(sources, [], prefix), prefix).toThrow(RangeError);
    }
    expect(() => storageKeys(sources, 'sample-two')).not.toThrow();
  });

  it('side_effect.storage_key: a key the register does not list', () => {
    const rows = parseRegister(REGISTER);
    expect(storageKeyProblems(sources, rows, 'sample')).toEqual([
      {
        rule: 'side_effect.storage_key',
        subject: 'sample:view.v2',
        paths: ['apps/sample/src/app/view.ts'],
        message:
          'The storage key `sample:view.v2` in apps/sample/src/app/view.ts is not in the register of side effects: list it in the row of its storage.',
      },
    ]);
    const listed = parseRegister(
      row({ id: 'SE-13', effect: 'localStorage `sample:view.v2`', code: '`localStorage`' }),
    );
    expect(storageKeyProblems(sources, [...rows, ...listed], 'sample')).toEqual([]);
    expect(storageKeyProblems(sources, [], 'sample').map((problem) => problem.subject)).toEqual([
      'sample:reloaded-for-update',
      'sample:last-backup',
      'sample:view.v2',
    ]);
  });

  it('side_effect.storage_key: the key stands in backticks and whole, not as part of another', () => {
    const one: SourceFile[] = [{ path: 'a.ts', code: `'sample:view'` }];
    const failing = (effect: string) =>
      storageKeyProblems(one, parseRegister(row({ effect, code: '`localStorage`' })), 'sample');
    expect(failing('localStorage sample:view')).toHaveLength(1);
    expect(failing('localStorage `sample:view.v2`')).toHaveLength(1);
    expect(failing('localStorage `sample:view`')).toEqual([]);
  });
});

describe('sideEffectRegisterProblems', () => {
  const sources: SourceFile[] = [
    {
      path: 'apps/sample/src/data/db.ts',
      code: `// Never fetch( anything here.\nexport const db = indexedDB.open('sample');`,
    },
    {
      path: 'apps/sample/src/ui/print.ts',
      code: 'export const print = () => { window.print(); };',
    },
    {
      path: 'apps/sample/src/features/settings/last-backup.ts',
      code: `localStorage.setItem('sample:last-backup', day);`,
    },
  ];

  it('finds nothing for code and a register that agree', () => {
    expect(sideEffectRegisterProblems(sources, REGISTER)).toEqual([]);
    expect(sideEffectRegisterProblems(sources, REGISTER, { storagePrefixes: ['sample'] })).toEqual(
      [],
    );
  });

  it('side_effect.no_sources: a test that reads no code does not pass', () => {
    expect(sideEffectRegisterProblems([], REGISTER)).toEqual([
      {
        rule: 'side_effect.no_sources',
        subject: 'sources',
        paths: [],
        message: 'No source was given: the test must read the code that ships.',
      },
    ]);
  });

  it('reports what is wrong in the register, in the code and in the storage keys together', () => {
    const more: SourceFile[] = [
      ...sources,
      { path: 'apps/sample/src/sync.ts', code: `await fetch('/api'); read('sample:sync-state');` },
      { path: 'apps/sample/src/where.ts', code: 'navigator.geolocation.watchPosition(done);' },
    ];
    const register = `${REGISTER}\n${HEAD.join('\n')}\n${row({ id: 'SE-12', since: 'bald' })}\n`;
    const problems = sideEffectRegisterProblems(more, register, { storagePrefixes: ['sample'] });
    expect(problems.map(({ rule, subject, paths }) => ({ rule, subject, paths }))).toEqual([
      { rule: 'register.row', subject: 'SE-12', paths: [] },
      { rule: 'register.row', subject: 'SE-12', paths: [] },
      { rule: 'side_effect.request', subject: 'fetch(', paths: ['apps/sample/src/sync.ts'] },
      {
        rule: 'side_effect.unregistered',
        subject: 'geolocation',
        paths: ['apps/sample/src/where.ts'],
      },
      {
        rule: 'side_effect.storage_key',
        subject: 'sample:sync-state',
        paths: ['apps/sample/src/sync.ts'],
      },
    ]);
    // Without a prefix no storage key is looked for.
    expect(sideEffectRegisterProblems(more, register).map((problem) => problem.rule)).not.toContain(
      'side_effect.storage_key',
    );
  });

  it('passes a request to a server once its row carries the decision', () => {
    const request: SourceFile[] = [
      { path: 'apps/sample/src/sync.ts', code: `await fetch('/api');` },
    ];
    expect(sideEffectRegisterProblems(request, REGISTER).map((problem) => problem.rule)).toEqual([
      'side_effect.request',
    ]);
    const decided = `${REGISTER}\n${HEAD.join('\n')}\n${row({
      id: 'SE-20',
      effect: 'Abgleich mit dem Server des Betriebs',
      code: '`fetch(`',
      leaves: 'ja',
      decision: 'Alban, 2.12.2026, ADR-0099',
      since: 'geplant',
    })}\n`;
    expect(sideEffectRegisterProblems(request, decided)).toEqual([]);
  });

  it('checks with the kinds and the prefixes it is given', () => {
    const kinds: SideEffectKind[] = [{ key: 'bluetooth', pattern: /\bbluetooth\b/ }];
    const code: SourceFile[] = [
      { path: 'a.ts', code: `navigator.bluetooth; fetch(url); 'one:key'; 'two:key';` },
    ];
    const register = registerOf(row({ effect: 'Funk, Speicher `one:key`', code: '`bluetooth`' }));
    expect(sideEffectRegisterProblems(code, register, { kinds })).toEqual([]);
    expect(
      sideEffectRegisterProblems(code, register, { kinds, storagePrefixes: ['one', 'two'] }).map(
        (problem) => problem.subject,
      ),
    ).toEqual(['two:key']);
    // A kind of the caller that sends something to a server needs the decision like any other.
    const sending: SideEffectKind[] = [{ key: 'upload', pattern: /\bupload\s*\(/, network: true }];
    const upload: SourceFile[] = [{ path: 'a.ts', code: 'upload(file);' }];
    const ordinary = registerOf(row({ code: '`upload`', leaves: 'ja' }));
    expect(
      sideEffectRegisterProblems(upload, ordinary, { kinds: sending }).map(({ rule }) => rule),
    ).toEqual(['register.request', 'side_effect.request']);
    const decided = registerOf(
      row({ code: '`upload`', leaves: 'ja', decision: 'Alban, 2.12.2026, ADR-0099' }),
    );
    expect(sideEffectRegisterProblems(upload, decided, { kinds: sending })).toEqual([]);
    // With the kinds of the standard test the same register names an unknown kind.
    expect(sideEffectRegisterProblems(code, register).map((problem) => problem.rule)).toEqual([
      'register.kind',
      'side_effect.request',
    ]);
  });
});

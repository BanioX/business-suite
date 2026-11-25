import { describe, expect, it } from 'vitest';
import {
  occurrences,
  parseRegister,
  REGISTER_COLUMNS,
  registerProblems,
  SIDE_EFFECT_KINDS,
  sideEffectProblems,
  storageKeyProblems,
  storageKeys,
  withoutComments,
  type SideEffectKind,
  type SourceFile,
} from '../src';

const HEADER = [
  `| ${REGISTER_COLUMNS.join(' | ')} |`,
  '| --- | --- | --- | --- | --- | --- | --- |',
];

/** A register with the given rows below one table header. */
const register = (...rows: string[]) => ['# Nebenwirkungen', '', ...HEADER, ...rows, ''].join('\n');

const DATABASE =
  '| SE-01 | Datenbank des Geräts | `indexedDB` | `platform/web-data` | nein | ADR-0009 | 24.11.2026 |';
const SETTINGS =
  '| SE-02 | Einstellungen des Geräts (`sample:theme`) | `localStorage` | `editions/sample` | nein, bleibt auf dem Gerät | ADR-0009 | geplant |';
const HANDSHAKE =
  '| SE-03 | Handschlag der Kopplung | `fetch(`, `WebSocket` | `services/vermittler` | ja, verschlüsselt | Alban, 17.11.2026, ADR-0012 | geplant |';

const file = (path: string, code: string): SourceFile => ({ path, code });

const rulesOf = (problems: readonly { rule: string }[]) => problems.map((problem) => problem.rule);

describe('the kinds of side effects', () => {
  it('have keys that occur once', () => {
    const keys = SIDE_EFFECT_KINDS.map((kind) => kind.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('mark everything that talks to a server as network', () => {
    expect(
      SIDE_EFFECT_KINDS.filter((kind) => kind.network === true).map((kind) => kind.key),
    ).toEqual(['fetch(', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'sendBeacon']);
  });

  it.each([
    ['fetch(', 'const response = await fetch(url);'],
    ['fetch(', 'fetch (url)'],
    ['XMLHttpRequest', 'const request = new XMLHttpRequest();'],
    ['WebSocket', 'const socket = new WebSocket(url);'],
    ['WebSocket', 'const peer = new RTCPeerConnection();'],
    ['WebSocket', 'const transport = new WebTransport(url);'],
    ['EventSource', 'const source = new EventSource(url);'],
    ['sendBeacon', 'navigator.sendBeacon(url, data);'],
    ['indexedDB', "const request = indexedDB.open('sample');"],
    ['indexedDB', "import { liveQuery } from 'dexie';"],
    ['localStorage', "localStorage.getItem('sample:theme');"],
    ['sessionStorage', "sessionStorage.setItem('sample:tab', id);"],
    ['document.cookie', "document.cookie = 'a=b';"],
    ['storage.persist', 'await navigator.storage.persist();'],
    ['serviceWorker', "navigator.serviceWorker.register('/sw.js');"],
    ['serviceWorker', "import { registerSW } from 'virtual:pwa-register';"],
    ['getUserMedia', 'navigator.mediaDevices.getUserMedia({ video: true });'],
    ['capture=', '<input accept="image/*" capture="environment" />'],
    ['type="file"', '<input type="file" />'],
    ['type="file"', "<input type={'file'} />"],
    ['geolocation', 'navigator.geolocation.getCurrentPosition(done);'],
    ['Notification', "new Notification('Erledigt');"],
    ['Notification', 'await Notification.requestPermission();'],
    ['Notification', "registration.showNotification('Erledigt');"],
    ['window.print', 'window.print();'],
    ['window.print', 'print();'],
    ['navigator.share', 'await navigator.share({ files });'],
    ['navigator.share', 'if (navigator.canShare(data)) {}'],
    ['navigator.clipboard', 'await navigator.clipboard.writeText(text);'],
    ['navigator.clipboard', "document.execCommand('copy');"],
    ['window.open', 'window.open(url);'],
    ['download', '<a href={url} download>Datei</a>'],
    ['download', 'link.download = name;'],
    ['createObjectURL', 'const url = URL.createObjectURL(blob);'],
  ])('find %s in «%s», and nothing else', (key, code) => {
    expect([...occurrences([file('a.ts', code)])]).toEqual([[key, ['a.ts']]]);
  });

  it.each([
    'const prefetch = refetch;',
    'printer.print();',
    'const printed = sprint();',
    'if (download === wanted) {}',
    'const types = ["file"];',
    'const notification = Notification;',
    'persisted(true);',
  ])('find nothing in «%s»', (code) => {
    expect([...occurrences([file('a.ts', code)])]).toEqual([]);
  });
});

describe('occurrences', () => {
  it('names the files of every kind, in the given order', () => {
    const sources = [
      file('b.ts', "localStorage.setItem('k', v);\nwindow.print();"),
      file('a.ts', 'window.print();'),
      file('c.ts', 'export const sum = (a: number, b: number) => a + b;'),
    ];
    expect([...occurrences(sources)]).toEqual([
      ['localStorage', ['b.ts']],
      ['window.print', ['b.ts', 'a.ts']],
    ]);
  });

  it('does not count what a comment says', () => {
    const code = [
      '// We never call fetch(url) here.',
      '/* localStorage is not used either */',
      'export const answer = 42; // window.print()',
    ].join('\n');
    expect([...occurrences([file('a.ts', code)])]).toEqual([]);
    expect(withoutComments('a /* b */ c // d')).toBe('a   c ');
  });

  it('counts what a string says: the reader cannot know what becomes of it', () => {
    expect([...occurrences([file('a.ts', "const code = 'fetch(url)';")]).keys()]).toEqual([
      'fetch(',
    ]);
  });

  it('takes the kinds it is given, also where a pattern remembers where it was', () => {
    const kinds: SideEffectKind[] = [{ key: 'beacon', pattern: /beacon/g }];
    const sources = [file('a.ts', 'beacon()'), file('b.ts', 'beacon()'), file('c.ts', 'fetch(x)')];
    expect([...occurrences(sources, kinds)]).toEqual([['beacon', ['a.ts', 'b.ts']]]);
  });
});

describe('parseRegister', () => {
  it('reads every row of every table', () => {
    const markdown = [register(DATABASE, SETTINGS), '## Geplant', '', ...HEADER, HANDSHAKE].join(
      '\n',
    );
    expect(parseRegister(markdown)).toEqual([
      {
        id: 'SE-01',
        line: DATABASE,
        keys: ['indexedDB'],
        leaves: 'nein',
        decision: 'ADR-0009',
        since: '24.11.2026',
      },
      {
        id: 'SE-02',
        line: SETTINGS,
        keys: ['localStorage'],
        leaves: 'nein, bleibt auf dem Gerät',
        decision: 'ADR-0009',
        since: 'geplant',
      },
      {
        id: 'SE-03',
        line: HANDSHAKE,
        keys: ['fetch(', 'WebSocket'],
        leaves: 'ja, verschlüsselt',
        decision: 'Alban, 17.11.2026, ADR-0012',
        since: 'geplant',
      },
    ]);
  });

  it('reads a register with Windows line ends, and keeps an escaped bar inside its cell', () => {
    const row =
      '| SE-04 | Datei sichern \\| teilen | `download` | `platform/web-ui` | nein | ADR-0009 | geplant |';
    const [parsed] = parseRegister(register(row).replaceAll('\n', '\r\n'));
    expect(parsed).toMatchObject({ id: 'SE-04', keys: ['download'], since: 'geplant' });
  });

  it('finds no row in a text without a table', () => {
    expect(parseRegister('# Nebenwirkungen\n\nNoch keine.\n')).toEqual([]);
    expect(parseRegister('')).toEqual([]);
  });
});

describe('registerProblems', () => {
  it('finds nothing in a well-formed register', () => {
    expect(registerProblems(register(DATABASE, SETTINGS, HANDSHAKE))).toEqual([]);
    // A register without a row yet is well formed too.
    expect(registerProblems(register())).toEqual([]);
  });

  it('asks for a table', () => {
    expect(registerProblems('# Nebenwirkungen\n\nNoch keine.\n')).toEqual([
      {
        rule: 'register.table',
        subject: 'register',
        paths: [],
        message: 'The register holds no table that starts with «Kennung».',
      },
    ]);
  });

  it('asks for the columns in their order', () => {
    const markdown = '| Kennung | Nebenwirkung | Wo |\n| --- | --- | --- |\n';
    const problems = registerProblems(markdown);
    expect(rulesOf(problems)).toEqual(['register.table']);
    expect(problems[0]?.message).toContain('«Kennung | Nebenwirkung | Wo»');
  });

  it.each([
    [
      'another number of cells',
      '| SE-01 | Datenbank | `indexedDB` | `platform/web-data` | nein | ADR-0009 | 24.11.2026 | mehr |',
      'SE-01: the row has 8 cells, the table 7.',
    ],
    [
      'an id of another form',
      '| SE-1 | Datenbank | `indexedDB` | `platform/web-data` | nein | ADR-0009 | 24.11.2026 |',
      'SE-1: the id must have the form SE-nn.',
    ],
    [
      'no clear yes or no',
      '| SE-01 | Datenbank | `indexedDB` | `platform/web-data` | vielleicht | ADR-0009 | 24.11.2026 |',
      'SE-01: «Daten verlassen das Gerät?» must start with «ja» or «nein».',
    ],
    [
      'a word that only starts like yes',
      '| SE-01 | Datenbank | `indexedDB` | `platform/web-data` | jahrelang | ADR-0009 | 24.11.2026 |',
      'SE-01: «Daten verlassen das Gerät?» must start with «ja» or «nein».',
    ],
    [
      'neither a date nor «geplant»',
      '| SE-01 | Datenbank | `indexedDB` | `platform/web-data` | nein | ADR-0009 | bald |',
      'SE-01: «Seit» must be a date TT.MM.JJJJ or «geplant».',
    ],
    [
      'no ADR',
      '| SE-01 | Datenbank | `indexedDB` | `platform/web-data` | nein | wie besprochen | 24.11.2026 |',
      'SE-01: «Entscheid» must name the ADR that carries the row (ADR-NNNN).',
    ],
  ])('names a row with %s', (_what, row, message) => {
    expect(registerProblems(register(row))).toEqual([
      { rule: 'register.row', subject: row.split('|')[1]?.trim(), paths: [], message },
    ]);
  });

  it('names an id that occurs twice', () => {
    const problems = registerProblems(register(DATABASE, DATABASE));
    expect(problems.map((problem) => problem.message)).toEqual(['SE-01: the id occurs twice.']);
  });

  it('names a kind the test does not know, so a typo cannot hide a side effect', () => {
    const row =
      '| SE-01 | Datenbank | `indexedDb` | `platform/web-data` | nein | ADR-0009 | 24.11.2026 |';
    const problems = registerProblems(register(row));
    expect(rulesOf(problems)).toEqual(['register.kind']);
    expect(problems[0]).toMatchObject({ subject: 'SE-01', paths: [] });
    expect(problems[0]?.message).toContain('`indexedDb`');
  });

  it.each([
    [
      'without «ja»',
      '| SE-03 | Handschlag | `fetch(` | `services/vermittler` | nein | Alban, 17.11.2026, ADR-0012 | geplant |',
    ],
    [
      'without the decision of the product owner',
      '| SE-03 | Handschlag | `WebSocket` | `services/vermittler` | ja | ADR-0012 | geplant |',
    ],
  ])('names a row for a request to a server %s', (_what, row) => {
    expect(registerProblems(register(row))).toEqual([
      expect.objectContaining({ rule: 'register.request', subject: 'SE-03' }),
    ]);
  });

  it('does not take a word that only starts like «ja» for the yes a request needs', () => {
    const row =
      '| SE-03 | Handschlag | `fetch(` | `services/vermittler` | jahrelang | Alban, 17.11.2026, ADR-0012 | geplant |';
    expect(rulesOf(registerProblems(register(row)))).toEqual(['register.row', 'register.request']);
    const found = occurrences([file('a.ts', 'await fetch(url);')]);
    expect(rulesOf(sideEffectProblems(found, parseRegister(register(row))))).toEqual([
      'side_effect.request',
    ]);
  });

  it('takes the kinds it is given', () => {
    const kinds: SideEffectKind[] = [{ key: 'beacon', pattern: /beacon/, network: true }];
    const row = '| SE-01 | Signal | `beacon` | `x` | nein | ADR-0009 | geplant |';
    expect(rulesOf(registerProblems(register(row), kinds))).toEqual(['register.request']);
    expect(rulesOf(registerProblems(register(DATABASE), kinds))).toEqual(['register.kind']);
  });
});

describe('sideEffectProblems', () => {
  const rows = parseRegister(register(DATABASE, SETTINGS, HANDSHAKE));

  it('finds nothing where every kind in the code has its row', () => {
    const found = occurrences([
      file('platform/web-data/src/db.ts', "indexedDB.open('sample');"),
      file('editions/sample/src/theme.ts', "localStorage.getItem('sample:theme');"),
      file('services/vermittler/src/client.ts', 'await fetch(url); new WebSocket(url);'),
    ]);
    expect(sideEffectProblems(found, rows)).toEqual([]);
    expect(sideEffectProblems(new Map(), [])).toEqual([]);
  });

  it('names a kind that is in the code and in no row', () => {
    const found = occurrences([
      file('a.ts', 'window.print();'),
      file('b.ts', 'window.print(); navigator.share(data);'),
    ]);
    expect(sideEffectProblems(found, rows)).toEqual([
      {
        rule: 'side_effect.unregistered',
        subject: 'window.print',
        paths: ['a.ts', 'b.ts'],
        message:
          '`window.print` in a.ts, b.ts: not in the register of side effects. Add a row with the next id and this kind in «Im Code».',
      },
      expect.objectContaining({
        rule: 'side_effect.unregistered',
        subject: 'navigator.share',
        paths: ['b.ts'],
      }),
    ]);
  });

  it('names a request to a server that no row carries the decision for', () => {
    const found = occurrences([file('a.ts', 'new EventSource(url);')]);
    expect(sideEffectProblems(found, rows)).toEqual([
      expect.objectContaining({
        rule: 'side_effect.request',
        subject: 'EventSource',
        paths: ['a.ts'],
      }),
    ]);
  });

  it.each([
    [
      'says «nein»',
      '| SE-03 | Abruf | `fetch(` | `x` | nein | Alban, 17.11.2026, ADR-0012 | geplant |',
    ],
    ['names no product owner', '| SE-03 | Abruf | `fetch(` | `x` | ja | ADR-0012 | geplant |'],
    ['names no ADR', '| SE-03 | Abruf | `fetch(` | `x` | ja | Alban, 17.11.2026 | geplant |'],
  ])('does not take an ordinary row for a request: one that %s', (_what, row) => {
    const found = occurrences([file('a.ts', 'await fetch(url);')]);
    expect(rulesOf(sideEffectProblems(found, parseRegister(register(row))))).toEqual([
      'side_effect.request',
    ]);
  });

  it('takes the kinds it is given', () => {
    const kinds: SideEffectKind[] = [{ key: 'beacon', pattern: /beacon/, network: true }];
    const found = occurrences([file('a.ts', 'beacon()')], kinds);
    expect(rulesOf(sideEffectProblems(found, rows, kinds))).toEqual(['side_effect.request']);
    // With the kinds of the standard test the same key is an ordinary kind without a row.
    expect(rulesOf(sideEffectProblems(found, rows))).toEqual(['side_effect.unregistered']);
  });
});

describe('storage keys', () => {
  const sources = [
    file(
      'editions/sample/src/theme.ts',
      [
        "const KEY = 'sample:theme';",
        "localStorage.setItem('sample:theme', 'dark');",
        "// 'sample:old' is gone",
        "const other = 'other:key';",
      ].join('\n'),
    ),
    file(
      'editions/sample/src/view.ts',
      'sessionStorage.getItem(`sample:view.last`); localStorage.getItem("sample:theme");',
    ),
  ];

  it('are every key under the prefix of the edition, with the files it stands in', () => {
    expect([...storageKeys(sources, 'sample')]).toEqual([
      ['sample:theme', ['editions/sample/src/theme.ts', 'editions/sample/src/view.ts']],
      ['sample:view.last', ['editions/sample/src/view.ts']],
    ]);
    expect([...storageKeys(sources, 'other')]).toEqual([
      ['other:key', ['editions/sample/src/theme.ts']],
    ]);
    expect([...storageKeys(sources, 'none')]).toEqual([]);
  });

  it('need a prefix that is a technical name', () => {
    for (const prefix of ['Sample', 'sample:', 'a.b', '', '1a', '.*']) {
      expect(() => storageKeys(sources, prefix), prefix).toThrow(RangeError);
    }
  });

  it('must each stand in a row of the register, in backticks', () => {
    const rows = parseRegister(register(DATABASE, SETTINGS));
    expect(storageKeyProblems(sources, rows, 'sample')).toEqual([
      {
        rule: 'side_effect.storage_key',
        subject: 'sample:view.last',
        paths: ['editions/sample/src/view.ts'],
        message:
          'The storage key `sample:view.last` in editions/sample/src/view.ts is not in the register of side effects: list it in the row of its storage.',
      },
    ]);
    expect(storageKeyProblems(sources.slice(0, 1), rows, 'sample')).toEqual([]);
    expect(rulesOf(storageKeyProblems(sources, [], 'sample'))).toEqual([
      'side_effect.storage_key',
      'side_effect.storage_key',
    ]);
  });
});

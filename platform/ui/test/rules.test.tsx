import { localDate, rappen } from '@onestrand/core';
import { occurrences, withoutComments } from '@onestrand/testing';
import { render } from '@testing-library/react';
import { Settings, Users } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import {
  BackLink,
  BOXED_INPUT_CLASS,
  Button,
  Checkbox,
  ConfirmDialog,
  controlClass,
  DateField,
  GroupedList,
  IconButton,
  ListRow,
  MoneyField,
  NumberField,
  QuantityField,
  Section,
  SegmentedControl,
  SelectField,
  Switch,
  TextArea,
  TextField,
  TimeField,
  TOKENS,
  UiProvider,
} from '../src/index';
import { packageFiles, type PackageFile } from './source';

/**
 * The rules every component of the kit keeps (P-08, decision S-27, CLAUDE.md «Definition of
 * Done»): colours only from tokens, texts only from the catalogue, no side effect, targets of at
 * least 44 px, fields of at least 16 px, no colour word of a brand. Each rule is a function over
 * the sources, run on the real files and on a wrong example, so a rule that finds nothing is seen.
 */

const SOURCES = packageFiles('src');
const CODE = SOURCES.filter((file) => /\.(ts|tsx)$/.test(file.path));
/** The one file that holds colours: the palettes of the themes. */
const PALETTES = 'src/theme.ts';
/** The one file that holds texts: the catalogue. */
const CATALOGUE = 'src/messages.ts';

// --- Colours -----------------------------------------------------------------------------------

/** What each colour utility may name besides a token: the parts that are no colour. */
const NOT_A_COLOUR: Readonly<Record<string, readonly string[]>> = {
  bg: ['linear-to-b', 'linear-to-r', 'transparent', 'none'],
  text: [
    ...['xs', 'sm', 'base', 'lg', 'xl', 'left', 'center', 'right', 'start', 'end', 'justify'],
    ...['ellipsis', 'clip', 'wrap', 'nowrap', 'balance', 'pretty', 'transparent', 'current'],
  ],
  border: ['t', 'b', 'l', 'r', 'x', 'y', 's', 'e', 'solid', 'dashed', 'none', 'transparent'],
  outline: ['none', 'hidden', 'solid', 'dashed', 'offset'],
  ring: ['inset', 'offset'],
  shadow: ['card', 'float', 'none', 'sm'],
  fill: ['none', 'current'],
  stroke: ['none', 'current'],
  from: [],
  via: [],
  to: [],
  placeholder: [],
  caret: [],
  decoration: [],
  divide: ['x', 'y'],
};
/** Tokens of the theme and the colours `themeCss` derives from them. */
const COLOURS: ReadonlySet<string> = new Set([...TOKENS, 'scrim']);

const LITERAL_COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/i;

/** Every colour in a file of code that is not a token: a literal, or a utility of no token. */
export function literalColours(file: PackageFile): string[] {
  const code = withoutComments(file.code);
  const found: string[] = [];
  const literal = LITERAL_COLOUR.exec(code);
  if (literal !== null) {
    found.push(literal[0]);
  }
  for (const raw of code.split(/[\s'"`{}()$,;]+/)) {
    // `hover:bg-surface-muted`, `peer-disabled:opacity-60`, `-outline-offset-2`, `bg-bad/40`.
    const word = raw
      .slice(raw.lastIndexOf(':') + 1)
      .replace(/^[-!]+/, '')
      .replace(/\/\d+$/, '');
    const dash = word.indexOf('-');
    const utility = dash === -1 ? '' : word.slice(0, dash);
    const name = word.slice(dash + 1);
    const allowed = NOT_A_COLOUR[utility];
    if (allowed === undefined || name === '' || /^[\d[]/.test(name)) {
      if (name.startsWith('[') && /#|rgb|hsl|color/i.test(name) && allowed !== undefined) {
        found.push(word);
      }
      continue;
    }
    const known =
      COLOURS.has(name) || allowed.some((part) => name === part || name.startsWith(`${part}-`));
    if (!known) {
      found.push(word);
    }
  }
  return found;
}

describe('colours come from the theme only', () => {
  it('finds no colour in a component that is not a token', () => {
    const found = CODE.filter((file) => file.path !== PALETTES).flatMap((file) =>
      literalColours(file).map((colour) => `${file.path}: ${colour}`),
    );
    expect(found).toEqual([]);
  });

  it('reads the components: a rule that finds nothing must have looked', () => {
    expect(CODE.map((file) => file.path)).toEqual(
      expect.arrayContaining([
        'src/Button.tsx',
        'src/Field.tsx',
        'src/Sheet.tsx',
        'src/StatTile.tsx',
      ]),
    );
    expect(CODE.length).toBeGreaterThan(20);
  });

  it.each([
    [
      'a colour of the palette of Tailwind',
      'bg-white text-gray-500',
      ['bg-white', 'text-gray-500'],
    ],
    [
      'a colour of a brand',
      "'hover:bg-blue-700 border-red-500/40'",
      ['bg-blue-700', 'border-red-500'],
    ],
    ['an arbitrary colour', '`text-[#8dbdff]`', ['#8dbdff', 'text-[#8dbdff]']],
    ['a colour as a value', "style={{ color: 'rgb(0 0 0)' }}", ['rgb(']],
  ])('turns red for %s', (_what, code, expected) => {
    expect(literalColours({ path: 'src/Probe.tsx', code })).toEqual(
      expect.arrayContaining(expected),
    );
  });

  it('lets tokens, sizes and edges through', () => {
    const code =
      "'bg-accent text-on-accent border-2 border-t border-accent-edge outline-2 outline-offset-2 text-[0.8125rem] text-sm text-center ring-1 ring-inset shadow-card bg-linear-to-b from-calm-start to-calm-end backdrop:bg-scrim hover:bg-bad/40'";
    expect(literalColours({ path: 'src/Probe.tsx', code })).toEqual([]);
  });

  it('keeps the styles free of colours: kit.css maps tokens, nothing else', () => {
    const css = SOURCES.find((file) => file.path === 'src/kit.css');
    expect(css).toBeDefined();
    const code = withoutComments(css?.code ?? '');
    expect(LITERAL_COLOUR.exec(code)).toBeNull();
    for (const token of TOKENS) {
      expect(code, token).toContain(`--color-${token}: var(--${token});`);
    }
    expect(code).toContain('--color-*: initial;');
  });
});

// --- Texts -------------------------------------------------------------------------------------

/** Text a person would read that stands in a component instead of the catalogue. */
export function textsInCode(file: PackageFile): string[] {
  const code = withoutComments(file.code);
  const found: string[] = [];
  // The text between two tags: `<p>Sichern</p>`.
  for (const match of code.matchAll(/>([^<>{}]*\p{L}[^<>{}]*)<\//gu)) {
    found.push((match[1] ?? '').trim());
  }
  // A name or a placeholder written into the markup: `aria-label="Schliessen"`.
  for (const match of code.matchAll(
    /\b(?:aria-label|title|placeholder|alt|label)="([^"]*\p{L}[^"]*)"/gu,
  )) {
    found.push(match[1] ?? '');
  }
  // German letters and quotes anywhere in a string of the code.
  for (const match of code.matchAll(/(['"`])([^'"`\n]*[äöüÄÖÜ«»][^'"`\n]*)\1/gu)) {
    found.push(match[2] ?? '');
  }
  return found;
}

describe('texts come from the catalogue only', () => {
  it('finds no text a person reads in a component', () => {
    // The theme speaks English to the person who reads a red test; the catalogue is the texts.
    const found = CODE.filter((file) => file.path !== CATALOGUE && file.path !== PALETTES).flatMap(
      (file) => textsInCode(file).map((text) => `${file.path}: ${text}`),
    );
    expect(found).toEqual([]);
  });

  it.each([
    ['text between tags', '<p>Sichern</p>', ['Sichern']],
    ['a name in the markup', '<button aria-label="Schliessen" />', ['Schliessen']],
    ['a German text in a string', "const x = 'Prüfen';", ['Prüfen']],
  ])('turns red for %s', (_what, code, expected) => {
    expect(textsInCode({ path: 'src/Probe.tsx', code })).toEqual(expect.arrayContaining(expected));
  });

  it('lets code and the texts of the catalogue through', () => {
    const code = '<p className="text-muted">{texts.dialog.close}</p>\n// «Schliessen»';
    expect(textsInCode({ path: 'src/Probe.tsx', code })).toEqual([]);
  });
});

// --- Side effects ------------------------------------------------------------------------------

describe('the kit has no side effect', () => {
  it('stores nothing, sends nothing, opens no camera, prints and shares nothing', () => {
    // The standard test of @onestrand/testing: every kind of docs/nebenwirkungen.md.
    expect([...occurrences(CODE).entries()]).toEqual([]);
  });

  it('would find one', () => {
    const probe = [{ path: 'src/Probe.tsx', code: "localStorage.setItem('x', '1');" }];
    expect([...occurrences(probe).keys()]).toEqual(['localStorage']);
  });
});

// --- Targets and fields ------------------------------------------------------------------------

/** Classes that give a target 44 px or more (Tailwind: 11 = 2.75 rem = 44 px). */
const TALL = /(?:^|\s)(?:min-h-1[1-4]|size-11|size-12|h-11|h-12)(?:\s|$)/;
/** A box of 24 px with a hit area 10 px larger on each side: 44 px. */
const WIDENED = /(?:^|\s)-inset-2\.5(?:\s|$)/;

/** The focusable elements of a rendered tree that are smaller than 44 px, by their name. */
function smallTargets(root: HTMLElement): string[] {
  const targets = root.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea');
  return [...targets].flatMap((target) => {
    const own = target.getAttribute('class') ?? '';
    const parent = target.parentElement?.getAttribute('class') ?? '';
    const grandparent = target.parentElement?.parentElement?.getAttribute('class') ?? '';
    const tall =
      TALL.test(own) ||
      WIDENED.test(own) ||
      (own.includes('absolute') && (TALL.test(parent) || TALL.test(grandparent)));
    return tall
      ? []
      : [
          `${target.tagName.toLowerCase()} ${target.getAttribute('aria-label') ?? target.textContent}`,
        ];
  });
}

function Panel() {
  return (
    <UiProvider today={localDate('2026-11-14')}>
      <Button>Sichern</Button>
      <Button size="sm" variant="quiet">
        Mehr
      </Button>
      <IconButton icon={Settings} label="Einstellungen" />
      <BackLink href="/heute" label="Heute" />
      <TextField label="Name" value="" onChange={vi.fn()} />
      <TextArea label="Notiz" value="" onChange={vi.fn()} />
      <NumberField label="Tage" value={null} onChange={vi.fn()} suffix="Tage" />
      <MoneyField label="Betrag" value={rappen(0)} onChange={vi.fn()} />
      <QuantityField label="Dauer" unit="h" value={null} onChange={vi.fn()} />
      <TimeField label="Beginn" value={null} onChange={vi.fn()} />
      <DateField
        label="Tag"
        value={null}
        onChange={vi.fn()}
        presets={[{ label: 'heute', days: 0 }]}
      />
      <SelectField
        label="Rhythmus"
        options={[{ value: 'week', label: 'Woche' }]}
        value={null}
        onChange={vi.fn()}
      />
      <Checkbox label="Kontrolliert" checked={false} onChange={vi.fn()} />
      <Switch label="Erinnerungen" checked onChange={vi.fn()} />
      <SegmentedControl
        label="Zeitraum"
        options={[
          { value: 'day', label: 'Tag' },
          { value: 'week', label: 'Woche' },
        ]}
        value="day"
        onChange={vi.fn()}
      />
      <GroupedList>
        <ListRow title="Kundschaft" icon={Users} href="/kundschaft" />
        <ListRow title="Sichern" onClick={vi.fn()} />
      </GroupedList>
      <Section title="Team" action={{ label: 'Alle', href: '/team' }}>
        <p />
      </Section>
      <ConfirmDialog
        open
        title="Löschen?"
        text="Weg."
        confirmLabel="Löschen"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    </UiProvider>
  );
}

describe('targets and fields', () => {
  it('gives every target at least 44 px', () => {
    const { container } = render(<Panel />);
    expect(
      container.querySelectorAll('button, a[href], input, select, textarea').length,
    ).toBeGreaterThan(20);
    expect(smallTargets(document.body)).toEqual([]);
  });

  it('would find a small one', () => {
    const { container } = render(
      <button type="button" className="h-6 px-2">
        klein
      </button>,
    );
    expect(smallTargets(container)).toEqual(['button klein']);
  });

  it('never sets the text of a field below 16 px (iOS would zoom in)', () => {
    const css = SOURCES.find((file) => file.path === 'src/kit.css')?.code ?? '';
    expect(css).toMatch(/input,\s*select,\s*textarea\s*\{\s*font-size: max\(16px, 1em\);/);
    const { container } = render(<Panel />);
    const small = /(?:^|\s)text-(?:xs|sm|\[0\.\d+rem\])(?:\s|$)/;
    expect(small.test(controlClass(false))).toBe(false);
    expect(small.test(BOXED_INPUT_CLASS)).toBe(false);
    const fields = [...container.querySelectorAll('input, select, textarea')];
    expect(
      fields
        .filter((field) => small.test(field.getAttribute('class') ?? ''))
        .map((field) => field.id),
    ).toEqual([]);
  });
});

// --- Words of a brand --------------------------------------------------------------------------

describe('no colour word of a brand', () => {
  it('names no brand colour in any file of the package: roles only', () => {
    const files = packageFiles('src', 'test', 'gallery');
    const brand = new RegExp(['w', 'ine|gr', 'ape|co', 'rk'].join(''), 'i');
    const found = files.filter((file) =>
      new RegExp(`\\b(?:${brand.source})\\b`, 'i').test(file.code),
    );
    expect(found.map((file) => file.path)).toEqual([]);
  });
});

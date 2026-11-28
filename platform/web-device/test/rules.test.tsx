import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { occurrences, withoutComments } from '@onestrand/testing';
import { TOKENS } from '@onestrand/ui';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  PhotoField,
  PrintButton,
  QrReaderPanel,
  ShareButton,
  SignaturePad,
} from '../src/web/index';
import { createFakeDevice } from './fake-device';
import { renderWithDevice } from './render';

/**
 * The rules every part of the device keeps (P-10, CLAUDE.md «Definition of Done»): colours only
 * from the tokens of the kit, texts only from the catalogue, the side effects of the device only
 * where the register says, targets of at least 44 px, and no location, ever. Each rule runs on the
 * real files and on a wrong example, so a rule that finds nothing is seen.
 */

const ROOT = join(import.meta.dirname, '..');

interface PackageFile {
  path: string;
  code: string;
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules') {
      return [];
    }
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function files(...dirs: string[]): PackageFile[] {
  return dirs
    .flatMap((dir) => walk(join(ROOT, dir)))
    .map((path) => ({
      path: relative(ROOT, path).split('\\').join('/'),
      code: readFileSync(path, 'utf8'),
    }))
    .sort((a, b) => (a.path < b.path ? -1 : 1));
}

const SOURCES = files('src');
const PARTS = SOURCES.filter((file) => file.path.startsWith('src/web/'));
const CATALOGUE = 'src/web/messages.ts';

// --- Colours -----------------------------------------------------------------------------------

const LITERAL_COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/i;
const COLOUR_UTILITY =
  /^(?:bg|text|border|outline|ring|fill|stroke|from|via|to|decoration|caret|accent|divide|placeholder|shadow|backdrop:bg)-(.+)$/;
/** What a colour utility may name besides a token: sizes, sides, styles. */
const NOT_A_COLOUR = new Set([
  ...['xs', 'sm', 'base', 'lg', 'xl', '2xl', 'left', 'center', 'right', 'start', 'end'],
  ...['t', 'b', 'l', 'r', 'x', 'y', '0', '2', 'solid', 'dashed', 'none', 'transparent', 'current'],
  ...['offset', 'offset-2', 'inset', 'card', 'float', 'ellipsis', 'wrap', 'nowrap', 'balance'],
  'scrim',
]);

/** Every colour in the parts of the device that is no token of the kit. */
export function foreignColours(file: PackageFile): string[] {
  const code = withoutComments(file.code);
  const found: string[] = [];
  const literal = LITERAL_COLOUR.exec(code);
  if (literal !== null) {
    found.push(literal[0]);
  }
  for (const raw of code.split(/[\s'"`{}()$,;]+/)) {
    const word = raw
      .slice(raw.lastIndexOf(':') + 1)
      .replace(/^[-!]+/, '')
      .replace(/\/\d+$/, '');
    const match = COLOUR_UTILITY.exec(raw.startsWith('backdrop:') ? raw : word);
    const name = match?.[1];
    if (name === undefined || /^[\d[]/.test(name) || NOT_A_COLOUR.has(name)) {
      continue;
    }
    if (!(TOKENS as readonly string[]).includes(name)) {
      found.push(word);
    }
  }
  return found;
}

describe('colours come from the theme only', () => {
  it('finds no colour in a visible part that is not a token', () => {
    expect(
      PARTS.flatMap((file) => foreignColours(file).map((colour) => `${file.path}: ${colour}`)),
    ).toEqual([]);
    expect(PARTS.length).toBeGreaterThan(6);
  });

  it('turns red for a colour of the palette, a literal and an arbitrary one', () => {
    const probe = {
      path: 'src/web/Probe.tsx',
      code: "'bg-black text-white border-gray-300 text-[#8dbdff]'",
    };
    expect(foreignColours(probe)).toEqual(
      expect.arrayContaining(['bg-black', 'text-white', 'border-gray-300', '#8dbdff']),
    );
    expect(
      foreignColours({ path: 'x', code: "'bg-surface text-fg border-line-strong text-sm'" }),
    ).toEqual([]);
  });

  it('keeps the two colours of a file the device writes in the logic, never in a part', () => {
    // The white ground of a JPEG and the ink of a signature are part of a file, not of the screen.
    const literal = SOURCES.filter((file) => LITERAL_COLOUR.test(withoutComments(file.code))).map(
      (file) => file.path,
    );
    expect(literal).toEqual(['src/photo.ts', 'src/signature.ts']);
  });
});

// --- Texts -------------------------------------------------------------------------------------

/** Text a person would read that stands in a part instead of the catalogue. */
export function textsInCode(file: PackageFile): string[] {
  const code = withoutComments(file.code);
  const found: string[] = [];
  for (const match of code.matchAll(/>([^<>{}]*\p{L}[^<>{}]*)<\//gu)) {
    found.push((match[1] ?? '').trim());
  }
  for (const match of code.matchAll(
    /\b(?:aria-label|title|placeholder|alt|label)="([^"]*\p{L}[^"]*)"/gu,
  )) {
    found.push(match[1] ?? '');
  }
  for (const match of code.matchAll(/(['"`])([^'"`\n]*[äöüÄÖÜ«»][^'"`\n]*)\1/gu)) {
    found.push(match[2] ?? '');
  }
  return found;
}

describe('texts come from the catalogue only', () => {
  it('finds no text a person reads in a part of the device', () => {
    const found = PARTS.filter((file) => file.path !== CATALOGUE).flatMap((file) =>
      textsInCode(file).map((text) => `${file.path}: ${text}`),
    );
    expect(found).toEqual([]);
  });

  it('turns red for a text in a part', () => {
    expect(textsInCode({ path: 'x', code: '<p>Drucken</p><b aria-label="Schliessen" />' })).toEqual(
      ['Drucken', 'Schliessen'],
    );
  });
});

// --- Side effects ------------------------------------------------------------------------------

describe('side effects only where the register says', () => {
  it('reaches the functions of the device in the adapter, and the file picker in the parts', () => {
    expect(Object.fromEntries(occurrences(SOURCES))).toEqual({
      getUserMedia: ['src/browser.ts', 'src/camera.ts', 'src/ports.ts'],
      'capture=': ['src/web/FilePickButton.tsx', 'src/web/PhotoField.tsx'],
      'type="file"': ['src/web/FilePickButton.tsx'],
      'window.print': ['src/browser.ts'],
      'navigator.share': ['src/browser.ts'],
      'navigator.clipboard': ['src/browser.ts'],
      download: ['src/browser.ts'],
      createObjectURL: ['src/browser.ts'],
    });
  });

  it('sends nothing anywhere', () => {
    const network = ['fetch(', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'sendBeacon'];
    expect(
      [...occurrences(files('src', 'gallery')).keys()].filter((key) => network.includes(key)),
    ).toEqual([]);
  });
});

// --- No location -------------------------------------------------------------------------------

/** The ways a page reaches the place of a device. Spelled in parts: this file names them to find them. */
const LOCATION = new RegExp(
  ['geo', 'location|getCurrent', 'Position|watch', 'Position'].join(''),
  'i',
);

/** The files of the package that name a way to the place of a device. */
export function locationIn(sources: readonly PackageFile[]): string[] {
  return sources.filter((file) => LOCATION.test(file.code)).map((file) => file.path);
}

describe('no location, ever', () => {
  it('finds no way to the place of the device in any file of the package', () => {
    const everything = files('src', 'test', 'gallery').filter(
      (file) => file.path !== 'test/rules.test.tsx',
    );
    expect(everything.length).toBeGreaterThan(20);
    expect(locationIn(everything)).toEqual([]);
  });

  it('would find one', () => {
    const probe = ['navigator.', 'geo', 'location.getCurrent', 'Position(done)'].join('');
    expect(locationIn([{ path: 'src/probe.ts', code: probe }])).toEqual(['src/probe.ts']);
  });

  it('has no part for it in the port', () => {
    const device = createFakeDevice() as unknown as Record<string, unknown>;
    expect(
      Object.keys(device).filter((key) => LOCATION.test(key) || /place|position/i.test(key)),
    ).toEqual([]);
  });
});

// --- Targets -----------------------------------------------------------------------------------

/** Classes that give a target 44 px or more (Tailwind: 11 = 2.75 rem = 44 px). */
const TALL = /(?:^|\s)(?:min-h-1[1-4]|size-11|size-12|h-11|h-12|h-40)(?:\s|$)/;

function smallTargets(root: HTMLElement): string[] {
  const targets = root.querySelectorAll<HTMLElement>(
    'button, a[href], input, select, textarea, canvas',
  );
  return [...targets].flatMap((target) => {
    const own = target.getAttribute('class') ?? '';
    const parent = target.parentElement?.getAttribute('class') ?? '';
    const tall = TALL.test(own) || (own.includes('absolute') && TALL.test(parent));
    return tall
      ? []
      : [
          `${target.tagName.toLowerCase()} ${target.getAttribute('aria-label') ?? target.textContent}`,
        ];
  });
}

describe('targets', () => {
  it('gives every control of every part at least 44 px', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
    renderWithDevice(
      <>
        <PrintButton pdf={{ buildPdf: undefined, fileName: 'a.pdf' }} />
        <ShareButton file={null} />
        <PhotoField label="Foto" value={null} onChange={vi.fn()} />
        <PhotoField
          label="Foto"
          value={{ bytes: new Uint8Array([1]), mediaType: 'image/jpeg' }}
          onChange={vi.fn()}
        />
        <QrReaderPanel onCode={vi.fn()} />
        <SignaturePad documentChecksum={'0'.repeat(64)} now={vi.fn()} onSign={vi.fn()} />
      </>,
    );
    expect(document.querySelectorAll('button, input, canvas').length).toBeGreaterThan(12);
    expect(smallTargets(document.body)).toEqual([]);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(8);
  });

  it('would find a small one', () => {
    const div = document.createElement('div');
    div.innerHTML = '<button class="h-6 px-2">klein</button>';
    expect(smallTargets(div)).toEqual(['button klein']);
  });
});

import { defineTheme } from '../src/theme';

/**
 * The colours of decision S-27 (docs/entscheide.md, Alban, 27.11.2026): the lighter tone of
 * Onestrand, silver and white with a light blue; dark like Onestrand itself. The table of S-27
 * fixes ground, app, surface, accent with its text, the accent as text and the calm surface; the
 * other tokens are chosen to fit and pass the contrast check. An edition keeps its own copy in
 * its own folder; here it is the example of the tests and of the gallery.
 */
export const exampleTheme = defineTheme({
  id: 'example',
  light: {
    ground: '#e6e9ee',
    app: '#f4f6f9',
    surface: '#ffffff',
    'surface-muted': '#eceff3',
    'calm-start': '#ffffff',
    'calm-end': '#e6e9ee',
    fg: '#10141b',
    muted: '#545c69',
    line: '#dde1e7',
    'line-strong': '#7a8291',
    accent: '#8dbdff',
    'on-accent': '#061633',
    'accent-strong': '#0a5bea',
    'accent-edge': '#0a5bea',
    'accent-soft': '#e6f0ff',
    ok: '#1d6b3f',
    'ok-soft': '#e3f4e8',
    warn: '#8a5200',
    'warn-soft': '#fcf0db',
    bad: '#b3261e',
    'bad-soft': '#fdecea',
  },
  dark: {
    ground: '#000000',
    app: '#05070b',
    surface: '#10141b',
    'surface-muted': '#1b212b',
    'calm-start': '#161b23',
    'calm-end': '#0b0f15',
    fg: '#f4f6f9',
    muted: '#9aa1ac',
    line: '#232a35',
    'line-strong': '#6b7484',
    accent: '#5aa2ff',
    'on-accent': '#061633',
    'accent-strong': '#8dbdff',
    'accent-edge': '#8dbdff',
    'accent-soft': '#0f2142',
    ok: '#6fcf97',
    'ok-soft': '#0f2a1b',
    warn: '#f2b56b',
    'warn-soft': '#2e1f0a',
    bad: '#ff8a80',
    'bad-soft': '#3a1513',
  },
});

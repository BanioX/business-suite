// The gallery of the kit: a page for the eyes of the product owner, never shipped (P-08, W0-03).
//   pnpm --filter @onestrand/ui gallery          serves it on http://localhost:5179
// It shows every component in the example theme of decision S-27. The theme reaches the page as
// a stylesheet written by `themeCss` (an edition does the same when it builds, because its CSP
// allows no inline style).
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { themeCss } from '../src/theme';
import { exampleTheme } from '../test/example-theme';

const THEME_MODULE = 'virtual:theme.css';
const RESOLVED = `\0${THEME_MODULE}`;

/** `import 'virtual:theme.css'`: the CSS of the example theme, light and dark. */
function theme(): Plugin {
  return {
    name: 'onestrand-gallery-theme',
    resolveId(id) {
      return id === THEME_MODULE ? RESOLVED : undefined;
    },
    load(id) {
      return id === RESOLVED ? themeCss(exampleTheme) : undefined;
    },
  };
}

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [tailwindcss(), theme()],
  server: { port: 5179, strictPort: true },
  build: { outDir: fileURLToPath(new URL('../dist', import.meta.url)), emptyOutDir: true },
});

// The gallery of the device: a page for the eyes of the product owner, never shipped (P-10, W0-03).
//   pnpm --filter @onestrand/web-device gallery    serves it on http://localhost:5181
// It shows every visible part on the real device of the browser, in the example theme of decision
// S-27 (`?scheme=dark` for the dark mode).
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [tailwindcss()],
  server: { port: 5181, strictPort: true },
  build: { outDir: fileURLToPath(new URL('../dist', import.meta.url)), emptyOutDir: true },
});

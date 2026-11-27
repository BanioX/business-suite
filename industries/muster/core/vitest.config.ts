import { defineProject } from 'vitest/config';

// The project of an industry is named `<id>-<part>`: every industry has a `core`, so the name of
// the directory alone would clash with `platform/core` (tools/src/affected.ts, `vitestProject`).
export default defineProject({
  test: {
    name: 'muster-core',
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});

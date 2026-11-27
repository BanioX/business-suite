import { defineConfig } from 'vitest/config';

// The conformity of one industry (`pnpm check:industry <id>`, tools/check-industry.mjs): one test
// file per step under tools/conformity/, for the industry named in ONESTRAND_INDUSTRY. Not part
// of `pnpm test` nor of the guards: it runs for one industry at a time, on request.
export default defineConfig({
  test: {
    name: 'conformity',
    root: import.meta.dirname,
    environment: 'node',
    include: ['conformity/**/*.conformity.test.ts'],
    // Laying out a demo business and a backup there and back take a moment under a loaded machine.
    testTimeout: 60_000,
  },
});

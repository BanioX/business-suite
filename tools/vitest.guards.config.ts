import { defineConfig } from 'vitest/config';

// The guards: checks over the whole repository (public repo, side effects, path ownership,
// name register, words of an industry in the platform, provenance). They run with `pnpm guards`
// and as their own step of `pnpm check`, not with the unit tests.
export default defineConfig({
  test: {
    name: 'guards',
    root: import.meta.dirname,
    environment: 'node',
    include: ['guards/**/*.guard.test.ts'],
  },
});

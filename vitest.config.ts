import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The guards over the whole repository have their own config (tools/vitest.guards.config.ts)
    // and their own step in `pnpm check`.
    projects: ['platform/*', 'tools'],
    coverage: {
      provider: 'v8',
      include: ['platform/*/src/**', 'tools/src/**'],
      exclude: ['**/*.d.ts'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: {
        // What ships: the pure logic of every platform package.
        'platform/*/src/**': { lines: 90, functions: 90, branches: 85, statements: 90 },
      },
    },
  },
});

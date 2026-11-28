import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'ui',
    // The kit is React: its tests render into the DOM of jsdom.
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['test/setup.ts'],
  },
});

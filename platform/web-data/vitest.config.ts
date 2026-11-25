import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'web-data',
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});

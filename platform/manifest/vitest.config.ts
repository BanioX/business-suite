import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'manifest',
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});

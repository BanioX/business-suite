import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'features',
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});

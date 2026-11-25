import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'access',
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});

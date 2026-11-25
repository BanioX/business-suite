import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'ledger',
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});

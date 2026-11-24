import { defineProject } from 'vitest/config';

// Unit tests of the tools themselves, on made-up fixtures. They run with `pnpm test`.
export default defineProject({
  test: {
    name: 'tooling',
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});

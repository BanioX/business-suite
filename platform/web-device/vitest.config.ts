import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'web-device',
    // The logic runs against a fake device and needs no DOM; the React part renders into jsdom.
    // One environment for both keeps the fakes the same: jsdom gives `File` and `Blob` to both.
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['test/setup.ts'],
  },
});

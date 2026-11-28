// Origin: BanioX/Randen apps/web/src/test-setup.ts @ e0f0907 — adapted: no database in the kit, so no fake IndexedDB
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// `findBy…` and `waitFor` give up after 1 s by default. Several test runs at once can make a
// correct component take longer to settle; 5 s keeps real failures visible and stops the noise.
configure({ asyncUtilTimeout: 5000 });

// Without Vitest globals the testing library does not clean up by itself: a component left over
// from the test before would answer the queries of the next one.
afterEach(() => {
  cleanup();
});

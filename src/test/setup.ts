import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Exercise date logic in a non-UTC zone with DST to prove it is timezone-independent.
process.env.TZ = 'America/Los_Angeles';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

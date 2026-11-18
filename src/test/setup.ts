import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Exercise date logic in a non-UTC zone with DST to prove it is timezone-independent.
process.env.TZ = 'America/Los_Angeles';

// "Today" is pinned for every test so the as-of date and the seed data are reproducible.
beforeEach(() => {
  // Fake only the clock's date; real timers keep user-event and React working.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 10, 12, 0, 0)); // local noon, Nov 10, 2026
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

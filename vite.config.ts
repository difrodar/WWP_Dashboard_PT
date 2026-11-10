/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// `base: './'` emits relative asset paths so the same build works on Netlify,
// Vercel, or a GitHub Pages project sub-path without extra configuration.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Run tests in a non-UTC zone to prove date logic is timezone-independent.
    env: { TZ: 'America/Los_Angeles' },
  },
});

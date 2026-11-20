/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' = relative Pfade. So funktioniert die App auf GitHub Pages
// (https://<name>.github.io/BugJagd/) und lokal, ohne den Pfad zu kennen.
export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});

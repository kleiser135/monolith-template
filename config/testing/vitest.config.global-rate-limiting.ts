import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/lib/api/global-rate-limiting.test.ts'],
    // Use no setup files to avoid prismaMock conflicts
    setupFiles: [],
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});

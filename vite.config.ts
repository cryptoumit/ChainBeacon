import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: 'popup.html',
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});

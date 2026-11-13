import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@project/components': path.resolve(__dirname, './src/shared'),
      'zitejs/api': path.resolve(__dirname, './src/backend/api.ts'),
      'zitejs/auth': path.resolve(__dirname, './src/backend/auth.tsx'),
      'zitejs/upload': path.resolve(__dirname, './src/backend/upload.ts'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});

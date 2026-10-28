import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/postings': 'http://localhost:3000',
      '/companies': 'http://localhost:3000',
    },
  },
});

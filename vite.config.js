import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'inga-report',
    rollupOptions: {
      input: 'index.html',
    },
  },
  server: {
    host: true,
  },
});

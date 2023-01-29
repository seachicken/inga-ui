import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'reports',
    rollupOptions: {
      input: 'index.html',
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    sourcemap: false, // Ensure original source code (.tsx/.ts) is never exposed in browser DevTools
    minify: 'esbuild',
    rollupOptions: {
      output: {
        compact: true,
      }
    }
  },
  esbuild: {
    // Strip all console and debuggers in production builds
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none',
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});

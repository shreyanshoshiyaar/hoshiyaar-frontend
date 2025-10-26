import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Single export with proxy to backend API
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Your local backend for development
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  // --- THIS LINE IS THE FIX ---
  base: '/', // Use root-relative paths for CloudFront/SPA routing
  // ---------------------------
  // Add SPA fallback for development
  preview: {
    port: 4173,
    host: true,
    // Ensure SPA routing works in preview
    historyApiFallback: true,
  },
});
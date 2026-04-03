import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy `/api` in dev: use VITE_API_BASE when set (hosted backend), else local Node on :5000
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = String(env.VITE_API_BASE || '').trim().replace(/\/+$/, '');
  const proxyTarget = apiBase || 'http://localhost:5000';

  return {
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: proxyTarget.startsWith('https'),
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
  };
});
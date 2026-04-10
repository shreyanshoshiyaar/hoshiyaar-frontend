import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Production backend URL (Railway)
const PRODUCTION_API = 'https://hoshiyaar-backend-production.up.railway.app';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isAndroid = mode === 'android';

  // For Android builds, bake in the absolute production URL
  // For web builds, use proxy as usual
  const apiBase = String(env.VITE_API_BASE || '').trim().replace(/\/+$/, '');
  const proxyTarget = apiBase || 'http://localhost:5000';

  return {
    plugins: [react()],

    // Define global constant so components can use absolute URL in Android builds
    define: {
      __API_BASE__: JSON.stringify(isAndroid ? PRODUCTION_API : ''),
    },

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

    // Capacitor requires './' base for file:// loading on Android
    // Web deployment still uses '/'
    base: isAndroid ? './' : '/',

    preview: {
      port: 4173,
      host: true,
      historyApiFallback: true,
    },
  };
});
/**
 * Public production API (Railway). Used when VITE_API_BASE is missing in the build
 * so the browser never requests same-origin /api/* on the SPA host (Vercel returns index.html).
 */
const DEFAULT_PRODUCTION_API_BASE = 'https://hoshiyaar-backend-production.up.railway.app';

/**
 * Backend origin without trailing slash. Empty string means use Vite dev proxy (same-origin).
 *
 * If VITE_API_BASE is set (e.g. in .env), it wins in dev and prod so you can run
 * the Vite app on localhost while calling a hosted API.
 */
export function getApiBase() {
  if (typeof window === 'undefined') return '';

  const env = import.meta.env.VITE_API_BASE;
  if (env != null && String(env).trim() !== '') {
    return String(env).replace(/\/+$/, '');
  }

  if (import.meta.env.DEV) return '';

  const hostname = window.location.hostname;
  if (/^(localhost|127\.0\.0\.1)/.test(hostname)) return '';
  if (hostname === '192.168.1.11') return 'http://192.168.1.11:5000';

  if (import.meta.env.PROD) return DEFAULT_PRODUCTION_API_BASE;
  return '';
}
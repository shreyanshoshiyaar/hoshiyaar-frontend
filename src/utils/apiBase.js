const DEFAULT_PRODUCTION_API_BASE = 'https://hoshiyaar-backend-production.up.railway.app';

export function getApiBase() {
  // If we are in the browser/phone
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // If it's local development on a laptop, return empty (uses Vite proxy)
    if (hostname === 'localhost' && !navigator.userAgent.includes('Android')) {
      // Check if we are in a production build even on localhost
      if (import.meta.env.PROD) return DEFAULT_PRODUCTION_API_BASE;
      return '';
    }

    // For ALL other cases (APK, Vercel, Production)
    return DEFAULT_PRODUCTION_API_BASE;
  }

  return '';
}

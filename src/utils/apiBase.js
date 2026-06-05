const DEFAULT_PRODUCTION_API_BASE = 'https://api.hoshiyaar.info';

export function getApiBase() {
  // If we are in the browser/phone
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    const isLocalNetwork = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.');

    // If it's local development on a laptop or local network, return empty (uses Vite proxy)
    if (isLocalNetwork && !navigator.userAgent.includes('Android')) {
      // Check if we are in a production build even on localhost
      if (import.meta.env.PROD) return DEFAULT_PRODUCTION_API_BASE;
      return '';
    }

    // For ALL other cases (APK, Vercel, Production)
    return DEFAULT_PRODUCTION_API_BASE;
  }

  return '';
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { StarsProvider } from './context/StarsContext.jsx'
import { CapacitorUpdater } from '@capgo/capacitor-updater';

CapacitorUpdater.notifyAppReady();

// Automatically recover from stale Vite deployment chunks (ChunkLoadError / dynamic import 404)
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

window.addEventListener('error', (event) => {
  const msg = String(event?.message || '');
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module')
  ) {
    const lastReload = sessionStorage.getItem('chunk_reload_ts');
    const now = Date.now();
    if (!lastReload || now - Number(lastReload) > 10000) {
      sessionStorage.setItem('chunk_reload_ts', String(now));
      window.location.reload();
    }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StarsProvider>
      <App />
    </StarsProvider>
  </StrictMode>,
)

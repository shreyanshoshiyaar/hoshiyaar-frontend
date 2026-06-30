import { build } from 'vite';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Build the application
await build();

// Copy _redirects file to dist if it exists
const redirectsSource = 'public/_redirects';
const redirectsDest = 'dist/_redirects';

if (existsSync(redirectsSource)) {
  copyFileSync(redirectsSource, redirectsDest);
  console.log('✅ Copied _redirects file to dist');
}

// Copy 404.html to dist if it exists
const notFoundSource = 'public/404.html';
const notFoundDest = 'dist/404.html';

if (existsSync(notFoundSource)) {
  copyFileSync(notFoundSource, notFoundDest);
  console.log('✅ Copied 404.html file to dist');
}

// Inject static App Shell for SEO and fast First Contentful Paint (FCP)
const indexHtmlPath = 'dist/index.html';
if (existsSync(indexHtmlPath)) {
  let html = readFileSync(indexHtmlPath, 'utf8');
  const prerenderedShell = `
    <style>
      .static-shell { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Nunito', sans-serif; padding: 2rem; text-align: center; background: #000; color: #fff; }
      @media (min-width: 768px) { .static-shell { background: #f8fafc; color: #0f172a; } }
      .static-shell h1 { font-size: 3rem; font-weight: 900; margin-bottom: 1rem; }
      .static-shell h2 { font-size: 1.5rem; font-weight: 700; max-width: 600px; margin-bottom: 1.5rem; }
      .static-shell p { font-size: 1.125rem; max-width: 500px; margin-bottom: 2rem; opacity: 0.8; }
      .static-shell .btn { background: #3b82f6; color: white; padding: 0.75rem 2rem; border-radius: 9999px; font-weight: bold; text-decoration: none; display: inline-block; }
    </style>
    <div class="static-shell">
      <h1>HoshiYaar</h1>
      <h2>Story-Based CBSE Science App for Class 6, 7 & 8</h2>
      <p>Turn CBSE Science chapters into detective mysteries. Master Science through interactive, gamified learning.</p>
      <a href="/login" class="btn">Try Free Now</a>
    </div>
  `;
  html = html.replace('<div id="root"></div>', `<div id="root">${prerenderedShell}</div>`);
  writeFileSync(indexHtmlPath, html);
  console.log('✅ Injected static pre-rendered SEO shell into index.html');
}

console.log('✅ SPA build completed with redirects and SSR shell');

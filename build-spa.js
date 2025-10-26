import { build } from 'vite';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
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

console.log('✅ SPA build completed with redirects');

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory with cache headers
app.use(express.static(join(__dirname, 'dist'), {
  setHeaders: (res, path) => {
    if (path.includes('/assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

import https from 'https';

const fetchBlogBySlug = (slug) => {
  return new Promise((resolve) => {
    https.get(`https://api.hoshiyaar.info/api/blogs/${slug}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
};

const injectMetaTags = (html, meta) => {
  let modified = html;
  if (meta.title) {
    modified = modified.replace(/<title>.*?<\/title>/i, `<title>${meta.title}</title>`);
    modified = modified.replace(/<meta property="og:title" content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${meta.title}" />`);
  }
  if (meta.description) {
    modified = modified.replace(/<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${meta.description}" />`);
    modified = modified.replace(/<meta property="og:description" content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${meta.description}" />`);
  }
  if (meta.canonicalUrl) {
    modified = modified.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${meta.canonicalUrl}" />`);
    modified = modified.replace(/<meta property="og:url" content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${meta.canonicalUrl}" />`);
  }
  return modified;
};

// Proxy sitemap.xml from the backend so it's served on the correct domain for Google Search Console
app.get('/sitemap.xml', (req, res) => {
  https.get('https://api.hoshiyaar.info/sitemap.xml', (apiRes) => {
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    apiRes.pipe(res);
  }).on('error', (err) => {
    res.status(500).send('Error generating sitemap');
  });
});

// Handle SPA routing - serve index.html for all routes with Dynamic HTML Injection for SEO
app.get('*', async (req, res) => {
  const indexPath = join(__dirname, 'dist', 'index.html');
  if (existsSync(indexPath)) {
    let html = readFileSync(indexPath, 'utf-8');
    
    let meta = {
      title: 'Hoshiyaar - Story-Based CBSE Science App for Class 6, 7 & 8',
      description: 'Turn CBSE Science chapters into detective mysteries. Every session ends with your child feeling smarter. Try free.',
      canonicalUrl: `https://hoshiyaar.info${req.originalUrl}`
    };

    if (req.path === '/blogs') {
      meta.title = 'CBSE Science Notes & Practice – Class 6, 7, 8 | Hoshiyaar';
      meta.description = 'Free CBSE Class 6–8 Science notes and MCQ practice — Temperature, Acids & Bases, Cell Structure, Nutrition in Plants and more.';
    } else if (req.path.startsWith('/blogs/')) {
      const parts = req.path.split('/');
      const slugOrId = parts[parts.length - 1];
      if (slugOrId) {
        const blogData = await fetchBlogBySlug(slugOrId);
        if (blogData && !blogData.error && blogData.title) {
          // Dynamic SEO tags based on Nidhi's pattern recommendation
          meta.title = `${blogData.title} – CBSE Notes & Examples`;
          meta.description = blogData.excerpt 
            ? `${blogData.excerpt} Free CBSE practice questions on Hoshiyaar.` 
            : `Learn about ${blogData.title} with simple CBSE notes. Practice free MCQs on the Hoshiyaar app.`;
        }
      }
    }

    html = injectMetaTags(html, meta);

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(html);
  } else {
    res.status(404).send('Build files not found. Please run npm run build:spa first.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access from mobile: http://192.168.1.11:${PORT}`);
});

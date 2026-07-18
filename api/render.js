import https from 'https';
import fs from 'fs';
import path from 'path';

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

export default async function handler(req, res) {
  try {
    let html = '';
    
    // Fetch the raw index.html from our own domain to avoid Vercel Lambda file inclusion issues
    try {
      const htmlRes = await fetch('https://hoshiyaar.info/index.html');
      html = await htmlRes.text();
    } catch (err) {
      return res.status(500).send('Error loading base HTML shell.');
    }
    
    let meta = {
      title: 'Hoshiyaar - Story-Based CBSE Science App for Class 6, 7 & 8',
      description: 'Turn CBSE Science chapters into detective mysteries. Every session ends with your child feeling smarter. Try free.',
      canonicalUrl: `https://hoshiyaar.info${req.url.split('?')[0]}`
    };

    if (req.url === '/blogs' || req.url === '/blogs/') {
      meta.title = 'CBSE Science Notes & Practice – Class 6, 7, 8 | Hoshiyaar';
      meta.description = 'Free CBSE Class 6–8 Science notes and MCQ practice — Temperature, Acids & Bases, Cell Structure, Nutrition in Plants and more.';
    } else if (req.url.includes('/blogs/')) {
      // Handle both /blogs/slug and /api/render?path=blogs/slug formats
      const urlToParse = req.url.includes('path=') ? decodeURIComponent(req.url.split('path=')[1].split('&')[0]) : req.url.split('?')[0];
      const parts = urlToParse.split('/').filter(Boolean);
      const slugOrId = parts[parts.length - 1];
      
      if (slugOrId && slugOrId !== 'blogs') {
        const responseData = await fetchBlogBySlug(slugOrId);
        // The backend wraps the response in a "data" object
        const blogData = responseData && responseData.data ? responseData.data : responseData;
        
        if (blogData && !blogData.error && blogData.title) {
          meta.title = blogData.metaTitle || blogData.seoTitle || blogData.title;
          meta.description = blogData.metaDescription || blogData.seoDescription || blogData.excerpt || `Learn about ${blogData.title} with simple CBSE notes. Practice free MCQs on the Hoshiyaar app.`;
        }
      }
    }

    html = injectMetaTags(html, meta);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error rendering page:', error);
    res.status(500).send('Internal Server Error');
  }
}

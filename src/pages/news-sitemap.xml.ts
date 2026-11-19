// Google News sitemap: articles published in the last 48 hours.
// https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
export const prerender = true;

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://laravelmail.com';
const PUBLICATION_NAME = 'Laravel Mail';
const PUBLICATION_LANGUAGE = 'en';
const WINDOW_MS = 48 * 60 * 60 * 1000;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const GET: APIRoute = async () => {
  const cutoff = Date.now() - WINDOW_MS;
  const posts = (await getCollection('blog'))
    .map((post) => ({ post, time: new Date(post.data.date).valueOf() }))
    .filter(({ time }) => !Number.isNaN(time) && time >= cutoff)
    .sort((a, b) => b.time - a.time);

  const urls = posts
    .map(
      ({ post, time }) => `  <url>
    <loc>${SITE}/blog/${post.id.replace(/\.json$/, '')}/</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(PUBLICATION_NAME)}</news:name>
        <news:language>${PUBLICATION_LANGUAGE}</news:language>
      </news:publication>
      <news:publication_date>${new Date(time).toISOString()}</news:publication_date>
      <news:title>${escapeXml(post.data.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

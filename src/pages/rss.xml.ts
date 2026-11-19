// RSS feed for the blog: latest 50 posts, summaries only.
export const prerender = true;

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://laravelmail.com';
const FEED_TITLE = 'Laravel Mail Blog';
const FEED_DESCRIPTION =
  'Email marketing, deliverability and Laravel articles from Laravel Mail.';
const MAX_ITEMS = 50;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const cleanExcerpt = (excerpt: string) =>
  excerpt
    .replace(/^Title:\s*/, '')
    .replace(/\s*Body:\s*/, ' ')
    .replace(/[#*`]/g, '')
    .trim();

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog'))
    .map((post) => ({ post, time: new Date(post.data.date).valueOf() }))
    .filter(({ time }) => !Number.isNaN(time))
    .sort((a, b) => b.time - a.time)
    .slice(0, MAX_ITEMS);

  const items = posts
    .map(
      ({ post, time }) => `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${SITE}/blog/${post.id.replace(/\.json$/, '')}/</link>
      <guid isPermaLink="true">${SITE}/blog/${post.id.replace(/\.json$/, '')}/</guid>
      <description>${escapeXml(cleanExcerpt(post.data.excerpt ?? ''))}</description>
      <pubDate>${new Date(time).toUTCString()}</pubDate>
    </item>`,
    )
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE}/blog/</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en-gb</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};

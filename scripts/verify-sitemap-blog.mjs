#!/usr/bin/env node
// Set-membership verification of the built sitemap's blog URLs against the
// expected set computed from actual content IDs, actual configured locales,
// and the actual pagination page size. Run after `astro build`:
//   node scripts/verify-sitemap-blog.mjs
// Exits non-zero on any missing or unexpected blog URL.
import { readFileSync, readdirSync } from 'node:fs';

const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
};

// Actual post IDs from the content collection filenames.
const postIds = readdirSync('src/content/blog')
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''));

// Actual locales from the i18n language map (excluding the unprefixed default).
const uiSrc = readFileSync('src/i18n/ui.ts', 'utf8');
const defaultLang = uiSrc.match(/export const defaultLang = '(\w+)'/)[1];
const langBlock = uiSrc.match(/export const languages = \{([^}]*)\}/s)[1];
const locales = [...langBlock.matchAll(/(\w+)\s*:/g)]
  .map((m) => m[1])
  .filter((l) => l !== defaultLang);

// Actual page size from the shared pagination helper used by the routes.
const bpSrc = readFileSync('src/scripts/blog-pagination.ts', 'utf8');
const pageSize = Number(bpSrc.match(/BLOG_PAGE_SIZE = (\d+)/)[1]);
const lastPage = Math.max(1, Math.ceil(postIds.length / pageSize));

const origin = 'https://laravelmail.com';
const expected = new Set();
// Root blog: index, pages 2..lastPage (paginate convention: page 1 is the index), posts.
expected.add(`${origin}/blog/`);
for (let p = 2; p <= lastPage; p++) expected.add(`${origin}/blog/${p}/`);
for (const id of postIds) expected.add(`${origin}/blog/${id}/`);
// Localized blog: index, pages 1..lastPage (customPages convention includes page 1), posts.
for (const l of locales) {
  expected.add(`${origin}/${l}/blog/`);
  for (let p = 1; p <= lastPage; p++) expected.add(`${origin}/${l}/blog/${p}/`);
  for (const id of postIds) expected.add(`${origin}/${l}/blog/${id}/`);
}

// Actual SEO-variation records x locales -> expected localized SEO page URLs.
const seoData = JSON.parse(readFileSync('src/data/seo-variations.json', 'utf8'));
const expectedSeo = new Set();
for (const l of locales) {
  for (const record of seoData) {
    expectedSeo.add(`${origin}/${l}/${record.slug}/`);
  }
}

// Optional argument: sitemap path (defaults to the built one). Used by the
// negative-fixture self-test and by reviewers verifying other builds.
const sitemapPath = process.argv[2] || 'dist/sitemap-0.xml';
const xml = readFileSync(sitemapPath, 'utf8');
const actual = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));

const blogNs = new RegExp(`^${origin}/(?:(?:${locales.join('|')})/)?blog/`);
const actualBlog = [...actual].filter((u) => blogNs.test(u));

const missing = [...expected].filter((u) => !actual.has(u));
const extra = actualBlog.filter((u) => !expected.has(u));

console.log(`posts=${postIds.length} locales=${locales.join(',')} pageSize=${pageSize} lastPage=${lastPage}`);
console.log(`expected blog URLs=${expected.size} | sitemap total URLs=${actual.size} | sitemap blog URLs=${actualBlog.length} | non-blog URLs=${actual.size - actualBlog.length}`);
if (missing.length) {
  console.log(`MISSING (${missing.length}):`, missing.slice(0, 10));
  fail(`${missing.length} expected blog URLs missing from sitemap`);
}
if (extra.length) {
  console.log(`EXTRA (${extra.length}):`, extra.slice(0, 10));
  fail(`${extra.length} unexpected blog URLs in sitemap`);
}
if (!missing.length && !extra.length) {
  console.log('SITEMAP BLOG SET: EXACT MATCH (membership, not counts)');
}

// SEO-variation set: exact membership comparison. The sitemap-side classifier
// is SHAPE-BASED and independent of seoData membership, so an unexpected slug
// is actually detectable as an extra. Known non-SEO localized single-segment
// pages are excluded from the shape using the actual source directory.
const knownLangPages = readdirSync('src/pages/[lang]')
  .filter((f) => f.endsWith('.astro') && !f.startsWith('['))
  .map((f) => f.replace(/\.astro$/, ''))
  .filter((seg) => seg !== 'index' && seg !== '404');
const seoShape = new RegExp(`^${origin}/(?:${locales.join('|')})/([^/]+)/$`);
const actualSeo = [...actual].filter((u) => {
  const m = u.match(seoShape);
  if (!m) return false;
  const seg = m[1];
  return seg !== 'blog' && seg !== 'databases' && !knownLangPages.includes(seg);
});
const missingSeo = [...expectedSeo].filter((u) => !actual.has(u));
const extraSeo = actualSeo.filter((u) => !expectedSeo.has(u));
console.log(`expected SEO URLs=${expectedSeo.size} (${seoData.length} records x ${locales.length} locales) | sitemap SEO URLs=${actualSeo.length}`);
if (missingSeo.length) {
  console.log(`MISSING SEO (${missingSeo.length}):`, missingSeo.slice(0, 10));
  fail(`${missingSeo.length} expected SEO URLs missing from sitemap`);
}
if (extraSeo.length) {
  console.log(`EXTRA SEO (${extraSeo.length}):`, extraSeo.slice(0, 10));
  fail(`${extraSeo.length} unexpected SEO URLs in sitemap`);
}
if (!missingSeo.length && !extraSeo.length) {
  console.log('SITEMAP SEO SET: EXACT MATCH (membership, not counts)');
}

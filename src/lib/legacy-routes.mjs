// Legacy URLs that Google still requests. Decide a precise answer instead of
// letting them fall through to the generic 404 page (or a server error).
//  - /databases/*, /buy: sections removed on purpose -> 410 Gone
//  - /<lang>/<lang2>/...: double locale prefix (never a real route) -> 301 to the last locale
//  - /<lang>/templates/<slug>: template detail pages are not localized -> 301 to /templates/<slug>/
const LOCALES = ['es', 'ru', 'zh'];

export function legacyRoute(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';

  if (/^\/(?:(?:es|ru|zh)\/)?(?:databases|buy)(?:\/|$)/.test(path)) {
    return { status: 410 };
  }

  const dbl = path.match(/^\/(es|ru|zh)\/(es|ru|zh)(\/.*)?$/);
  if (dbl) {
    const rest = dbl[3] || '';
    return { status: 301, location: `/${dbl[2]}${rest}/`.replace(/\/\/+$/, '/') };
  }

  const tpl = path.match(/^\/(es|ru|zh)\/templates\/([^/]+)$/);
  if (tpl) {
    return { status: 301, location: `/templates/${tpl[2]}/` };
  }

  return null;
}

export { LOCALES };

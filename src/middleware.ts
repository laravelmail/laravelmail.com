import {defineMiddleware} from 'astro:middleware';
import {legacyRoute} from './lib/legacy-routes.mjs';
/** Pricing is intentionally retired, including localized/trailing-slash URLs.
 * Do not let the dynamic SEO slug route turn these into a 200 or a 500. */
export const onRequest = defineMiddleware(async (context, next) => {
  if (/^\/(?:en\/|es\/|ru\/|zh\/)?pricing\/?$/.test(context.url.pathname)) {
    const response = await context.rewrite('/404');
    return new Response(response.body, {status: 404, headers: response.headers});
  }
  const legacy = legacyRoute(context.url.pathname);
  if (legacy) {
    if (legacy.location) {
      return new Response(null, {status: legacy.status, headers: {Location: legacy.location}});
    }
    const response = await context.rewrite('/404');
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex');
    return new Response(response.body, {status: legacy.status, headers});
  }
  return next();
});

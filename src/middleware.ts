import {defineMiddleware} from 'astro:middleware';
/** Pricing is intentionally retired, including localized/trailing-slash URLs.
 * Do not let the dynamic SEO slug route turn these into a 200 or a 500. */
export const onRequest = defineMiddleware(async (context, next) => {
  if (/^\/(?:en\/|es\/|ru\/|zh\/)?pricing\/?$/.test(context.url.pathname)) {
    const response = await context.rewrite('/404');
    return new Response(response.body, {status: 404, headers: response.headers});
  }
  return next();
});

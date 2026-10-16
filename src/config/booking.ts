export const DEFAULT_CALENDLY_URL = 'https://calendly.com/laravelagency/30min';
/** Restrict embeds to Calendly. The existing event remains the default. */
export function calendlyUrl(configured?: string): string {
  try {
    const url = new URL(configured?.trim() || DEFAULT_CALENDLY_URL);
    if (url.protocol !== 'https:' || url.hostname !== 'calendly.com' || url.username || url.password) return DEFAULT_CALENDLY_URL;
    return url.toString();
  } catch { return DEFAULT_CALENDLY_URL; }
}
export function calendlyEmbedUrl(configured?: string): string {
  const url = new URL(calendlyUrl(configured));
  url.searchParams.set('embed_domain', 'laravelmail.com');
  url.searchParams.set('embed_type', 'Inline');
  url.searchParams.set('hide_gdpr_banner', '0');
  url.searchParams.set('primary_color', '7c3aed');
  return url.toString();
}

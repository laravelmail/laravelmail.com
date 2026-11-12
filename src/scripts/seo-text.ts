/**
 * SEO text/link helpers shared by layouts, pages and components.
 */

/** Truncate at a word boundary, appending an ellipsis, so the result is at most `max` chars. */
export function truncateAtWord(text: string, max: number): string {
    if (text.length <= max) return text;
    const cut = text.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > Math.floor(max / 2) ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

/**
 * Blog post markdown bodies start with their own `# title`, duplicating the
 * template's <h1>. Demote every content <h1> to <h2> so each page has exactly one.
 */
export function demoteContentH1(html: string): string {
    return html.replace(/<h1(\s[^>]*)?>/g, '<h2$1>').replace(/<\/h1>/g, '</h2>');
}

/**
 * Canonical URLs on this site carry a trailing slash (slashless URLs 301 to them).
 * Point internal links at the final URL directly to avoid redirect hops and
 * orphan-page misdetection.
 */
export function withTrailingSlash(path: string): string {
    if (path === '/' || path.endsWith('/') || /\.[a-z0-9]+($|\?|#)/i.test(path)) return path;
    return path + '/';
}

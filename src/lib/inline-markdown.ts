/**
 * Render the small inline-markdown subset used by seo-variations.json content
 * (`**bold**` and `` `code` ``) into safe HTML. Input is escaped first so no
 * raw HTML can pass through.
 */
export function renderInlineMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

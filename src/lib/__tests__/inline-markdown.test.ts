import { describe, it, expect } from "vitest";
import { renderInlineMarkdown } from "../inline-markdown";
import seoData from "../../data/seo-variations.json";

describe("renderInlineMarkdown", () => {
  it("converts **bold** to <strong>", () => {
    expect(renderInlineMarkdown("a **bold** b")).toBe('a <strong>bold</strong> b');
  });
  it("converts `code` to <code>", () => {
    expect(renderInlineMarkdown("run `php artisan` now")).toBe("run <code>php artisan</code> now");
  });
  it("escapes raw HTML before transforming", () => {
    expect(renderInlineMarkdown("<b>x</b> **y**")).toBe("&lt;b&gt;x&lt;/b&gt; <strong>y</strong>");
  });
  it("leaves plain text untouched", () => {
    expect(renderInlineMarkdown("plain text here")).toBe("plain text here");
  });
  it("handles multiple bold spans in one string", () => {
    expect(renderInlineMarkdown("**a** and **b**")).toBe("<strong>a</strong> and <strong>b</strong>");
  });
  it("renders every seo-variations entry with no literal markdown markers left", () => {
    for (const page of seoData) {
      const html = renderInlineMarkdown(page.content);
      expect(html).not.toContain("**");
      expect(html).not.toContain("`");
      expect(html).not.toContain("<script");
    }
  });
});

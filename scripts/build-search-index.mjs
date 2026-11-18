// Builds the blog search index consumed by the /api/search backend.
// Run with: node scripts/build-search-index.mjs
// Writes public/search-index.json (gitignored, copied into dist by astro
// build; the backend fetches it once per isolate through the static
// assets binding). Own-corpus search: the DocSearch popup queries our
// own /api/search route instead of a third-party Algolia index.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const BLOG_DIR = join(root, "src", "content", "blog");
const outArg = process.argv.find((a) => a.startsWith("--out="));
const out = outArg
    ? outArg.slice("--out=".length)
    : join(root, "public", "search-index.json");
const outPath = isAbsolute(out) ? out : join(process.cwd(), out);

const EXCERPT_MAX = 180;

// Strip markdown so the popup shows plain text.
function plain(text) {
    return (text || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/^\s*#+\s*/gm, "")
        .replace(/[*_`>]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function excerptOf(post) {
    let text = plain(post.excerpt) || plain(post.content);
    if (text.length <= EXCERPT_MAX) return text;
    const cut = text.slice(0, EXCERPT_MAX);
    return cut.slice(0, cut.lastIndexOf(" ")).trimEnd() + "…";
}

// Posts are JSON data-collection entries ({ title, date, excerpt,
// content, tags[] }); the slug is the file basename and the public URL
// is /blog/<slug>/ (see the blog listing component).
const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".json"));
const index = files
    .map((file) => {
        let post;
        try {
            post = JSON.parse(readFileSync(join(BLOG_DIR, file), "utf8"));
        } catch {
            return null;
        }
        return {
            s: file.slice(0, -".json".length),
            t: post.title || "",
            e: excerptOf(post),
            c: "Blog",
            g: Array.isArray(post.tags) ? post.tags : [],
            d: String(post.date || "").slice(0, 10),
        };
    })
    .filter((p) => p && p.s && p.t);
index.sort((a, b) => a.s.localeCompare(b.s));

const json = JSON.stringify(index);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, json);
console.log(
    `search index: ${index.length} posts, ${(json.length / 1024 / 1024).toFixed(2)} MB -> ${outPath}`,
);

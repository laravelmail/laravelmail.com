import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prepareIndex, searchIndex } from "../src/search/rank.mjs";

const BACKEND = process.env.SEARCH_BACKEND || "src/pages/api/search.ts";
const CORPUS_EXT = ".json";

const read = (path) =>
    readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("ranker: title beats tags beats excerpt, all terms must match", () => {
    const prepared = prepareIndex([
        { s: "a", t: "How to install Composer", e: "Dependencies in PHP.", c: "Composer", g: ["composer"], d: "2024-01-01" },
        { s: "b", t: "PHP arrays", e: "Composer mentioned in passing.", c: "PHP", g: [], d: "2025-01-01" },
        { s: "c", t: "Unrelated post", e: "Nothing here.", c: "PHP", g: [], d: "2026-01-01" },
    ]);
    const hits = searchIndex(prepared, "composer");
    assert.deepEqual(hits.map((h) => h.s), ["a", "b"]);
    assert.equal(searchIndex(prepared, "composer arrays").length, 1); // AND semantics
    assert.deepEqual(searchIndex(prepared, ""), []);
    const tie = searchIndex(
        prepareIndex([
            { s: "old", t: "laravel old", e: "", c: "Blog", g: [], d: "2020-01-01" },
            { s: "new", t: "laravel new", e: "", c: "Blog", g: [], d: "2021-01-01" },
        ]),
        "laravel",
    );
    assert.deepEqual(tie.map((h) => h.s), ["new", "old"]);
    assert.deepEqual(Object.keys(tie[0]).sort(), ["c", "e", "s", "t"]);
});

test("builder indexes every blog post", () => {
    const dir = mkdtempSync(join(tmpdir(), "search-index-"));
    const out = join(dir, "index.json");
    execFileSync(
        process.execPath,
        ["scripts/build-search-index.mjs", `--out=${out}`],
        { cwd: new URL("..", import.meta.url).pathname, stdio: "pipe" },
    );
    const index = JSON.parse(readFileSync(out, "utf8"));
    const corpus = readdirSync(
        new URL("../src/content/blog", import.meta.url),
    ).filter((f) => f.endsWith(CORPUS_EXT));
    assert.equal(index.length, corpus.length);
    const slugs = new Set(index.map((p) => p.s));
    assert.equal(slugs.size, index.length, "slugs are unique");
    for (const p of index) {
        assert.ok(p.t && p.e && p.c, `entry ${p.s} has title, excerpt, category`);
    }
    const hits = searchIndex(prepareIndex(index), "the", 5);
    assert.ok(hits.length > 0, "a common query returns hits");
});

test("search popup queries the own /api/search route, not a third-party Algolia index", () => {
    const tsx = read("src/components/search/AlgoliaDocSearch.tsx");
    assert.match(tsx, /transformSearchClient/);
    const client = read("src/components/search/localSearchClient.ts");
    assert.match(client, /\/api\/search\?q=/);
    // DocSearch v3.9 calls search({ requests: [...] }) (Algolia v5 shape),
    // not search(requests): a bare-array client throws "map is not a
    // function" and the popup silently shows "No results".
    assert.match(client, /input\.requests/);
    assert.match(client, /request\.query/);
    const backend = read(BACKEND);
    assert.match(backend, /search-index\.json/);
    const css = read("src/components/search/AlgoliaDocSearch.css");
    assert.match(css, /\.DocSearch-Logo\s*\{\s*display:\s*none/);
});

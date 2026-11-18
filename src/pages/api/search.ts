// @ts-nocheck
/**
 * GET /api/search?q=...
 *
 * Same-origin blog search backing the DocSearch popup, ported from
 * laravelcompany.com. The index is built at deploy time into
 * /search-index.json by scripts/build-search-index.mjs and fetched once
 * per isolate through the static assets binding. No third-party search
 * service is involved; the popup's "Algolia" look is UI only.
 */
import { prepareIndex, searchIndex } from "../../search/rank.mjs";

export const prerender = false;

let preparedIndex; // undefined = not loaded yet, null = unavailable

export async function GET({ url, locals }) {
    if (preparedIndex === undefined) {
        try {
            const res = await locals.runtime.env.ASSETS.fetch(
                new Request(new URL("/search-index.json", url)),
            );
            if (!res.ok) throw new Error(`search-index asset ${res.status}`);
            preparedIndex = prepareIndex(await res.json());
        } catch {
            preparedIndex = null;
        }
    }
    const hits = preparedIndex
        ? searchIndex(preparedIndex, url.searchParams.get("q") || "")
        : [];
    return Response.json(
        { hits },
        { headers: { "cache-control": "public, max-age=300" } },
    );
}

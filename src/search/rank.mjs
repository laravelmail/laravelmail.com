// Shared blog search ranking for the /api/search Worker route (src/worker.js)
// and its tests. Pure JS, no imports, so the Worker bundles it directly and
// node --test can import it without a build step.
//
// Index entries (built by scripts/build-search-index.mjs):
//   { s: slug, t: title, e: excerpt, c: category title, g: tags[], d: date }
//
// prepareIndex() lowercases the searchable fields once; searchIndex() then
// scans the prepared array per query. ~10k entries scan in a few ms, fine
// for a per-keystroke endpoint cached in a Worker isolate.

const SPLIT = /[^\p{L}\p{N}#+.-]+/u;

const norm = (value) => (value || "").toLowerCase();

export function prepareIndex(index) {
    return index.map((p) => {
        const tl = norm(p.t);
        return {
            s: p.s,
            t: p.t,
            e: p.e,
            c: p.c,
            d: p.d || "",
            tl,
            tlw: new Set(tl.split(SPLIT).filter(Boolean)),
            gl: norm((p.g || []).join(" ")),
            cl: norm(p.c),
            xl: norm(p.e),
        };
    });
}

export function searchIndex(prepared, query, limit = 30) {
    const terms = norm(query).split(SPLIT).filter(Boolean);
    if (!terms.length) return [];
    const scored = [];
    for (const p of prepared) {
        let score = 0;
        let matchedAll = true;
        for (const term of terms) {
            let s = 0;
            if (p.tlw.has(term)) s = 12;
            else if (p.tl.includes(term)) s = 7;
            else if (p.gl.includes(term)) s = 4;
            else if (p.cl.includes(term)) s = 3;
            else if (p.xl.includes(term)) s = 1;
            if (!s) {
                matchedAll = false;
                break;
            }
            score += s;
        }
        if (!matchedAll) continue;
        if (p.tl.startsWith(terms[0])) score += 3;
        scored.push([score, p.d, p.s, p]);
    }
    scored.sort((a, b) => b[0] - a[0] || b[1].localeCompare(a[1]) || a[2].localeCompare(b[2]));
    return scored
        .slice(0, limit)
        .map(([, , , p]) => ({ s: p.s, t: p.t, e: p.e, c: p.c }));
}

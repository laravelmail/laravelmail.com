// Same-origin search client for the DocSearch popup, backed by the site's
// own corpus instead of a third-party Algolia index. The Pages Function
// route GET /api/search?q=... ranks the posts; this client shapes the
// response into the Algolia hit format DocSearch renders (hierarchy,
// content, highlight and snippet results with <mark> wrapped terms).
// Ported from laravelcompany.com (which ported it from phpteacher.com).

interface SearchApiHit {
    s: string // slug
    t: string // title
    e: string // excerpt
    c: string // category title
}

interface DocSearchRequest {
    indexName: string
    query?: string // DocSearch passes the v5 shape: top-level query
    params?: { query?: string } // older shape: params.query
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function markTerms(value: string, terms: string[]): string {
    let out = escapeHtml(value)
    for (const term of terms) {
        if (term.length < 2) {
            continue
        }
        out = out.replace(
            new RegExp(`(${escapeRegExp(term)})`, 'gi'),
            '<mark>$1</mark>',
        )
    }
    return out
}

let pending: AbortController | null = null

async function queryApi(query: string): Promise<SearchApiHit[]> {
    pending?.abort()
    pending = new AbortController()
    // Aborted or offline fetches reject: keep the popup quiet and empty.
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        signal: pending.signal,
    }).catch(() => null)
    if (!res?.ok) {
        return []
    }
    const data = (await res.json().catch(() => null)) as {
        hits?: SearchApiHit[]
    } | null
    return data?.hits ?? []
}

function toDocSearchHit(hit: SearchApiHit, terms: string[]) {
    return {
        objectID: hit.s,
        type: 'lvl1',
        url: `/blog/${hit.s}/`,
        hierarchy: { lvl0: hit.c, lvl1: hit.t },
        content: hit.e,
        _highlightResult: {
            hierarchy: {
                lvl0: {
                    value: escapeHtml(hit.c),
                    matchLevel: 'none',
                    matchedWords: [],
                },
                lvl1: {
                    value: markTerms(hit.t, terms),
                    matchLevel: 'full',
                    matchedWords: terms,
                },
            },
        },
        _snippetResult: {
            content: {
                value: markTerms(hit.e, terms),
                matchLevel: terms.length ? 'full' : 'none',
            },
        },
    }
}

export const siteSearchClient = {
    // DocSearch v3.9 calls search({ requests }) (Algolia client v5 shape);
    // older autocomplete code calls search(requests) with a bare array.
    async search(input: DocSearchRequest[] | { requests: DocSearchRequest[] }) {
        const requests = Array.isArray(input) ? input : input.requests
        const results = await Promise.all(
            requests.map(async (request) => {
                const query = request.params?.query ?? request.query ?? ''
                const terms = query
                    .toLowerCase()
                    .split(/[^\p{L}\p{N}#+.-]+/u)
                    .filter(Boolean)
                const hits = query.trim()
                    ? (await queryApi(query)).map(hit =>
                            toDocSearchHit(hit, terms),
                        )
                    : []
                return {
                    hits,
                    nbHits: hits.length,
                    page: 0,
                    nbPages: hits.length ? 1 : 0,
                    hitsPerPage: hits.length,
                    exhaustiveNbHits: true,
                    query,
                    params: '',
                    index: request.indexName,
                    processingTimeMS: 0,
                }
            }),
        )
        return { results }
    },
}

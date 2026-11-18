import { createElement } from 'react'
import { DocSearch } from '@docsearch/react'
import { siteSearchClient } from './localSearchClient'

import '@docsearch/css'
import './AlgoliaDocSearch.css'

// The popup keeps the DocSearch UI (and its theme overrides), but searches
// the site's own corpus via the /api/search backend instead of a
// third-party Algolia index. appId/apiKey are placeholders: the Algolia
// client is constructed but replaced by our client before any query.
// createElement (no JSX) so sites that also enable the preact integration
// never route this file through preact's JSX runtime.
function AlgoliaDocSearch() {
    return createElement(DocSearch as never, {
        appId: 'laravelmail',
        indexName: 'laravelmail-blog',
        apiKey: 'local-search',
        transformSearchClient: () => siteSearchClient as never,
    })
}

export default AlgoliaDocSearch

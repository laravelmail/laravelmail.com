import { useState, useEffect, useCallback } from "preact/hooks";
import {
  listTemplates,
  getIndustries,
  getMessageTypes,
  getThumbnailUrl,
} from "../../lib/api/client";
import type { Template } from "../../lib/api/types";

interface TemplateBrowserProps {
  initialTemplates?: Template[];
  initialTotal?: number;
  initialIndustries?: string[];
  initialMessageTypes?: string[];
}

export default function TemplateBrowser(props: TemplateBrowserProps) {
  const [templates, setTemplates] = useState<Template[]>(props.initialTemplates || []);
  const [total, setTotal] = useState(props.initialTotal || 0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [messageType, setMessageType] = useState("");
  const [industries, setIndustries] = useState<string[]>(props.initialIndustries || []);
  const [messageTypes, setMessageTypes] = useState<string[]>(props.initialMessageTypes || []);
  const [loading, setLoading] = useState(false);
  const [initialLoad] = useState(!props.initialTemplates);
  const [error, setError] = useState<string | null>(null);
  const [searchCommit, setSearchCommit] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTemplates({
        page,
        page_size: pageSize,
        search: search || null,
        industry: industry || null,
        message_type: messageType || null,
      });
      setTemplates(data.templates);
      setTotal(data.total);
    } catch (e: any) {
      setError(e.message || "Failed to load templates");
      if (templates.length === 0) {
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, industry, messageType]);

  useEffect(() => {
    if (initialLoad) {
      fetchTemplates();
    }
  }, [initialLoad, fetchTemplates]);

  useEffect(() => {
    if (!initialLoad) {
      fetchTemplates();
    }
  }, [page, industry, messageType, searchCommit]);

  useEffect(() => {
    if (!props.initialIndustries) {
      getIndustries().then(setIndustries).catch(() => {});
    }
    if (!props.initialMessageTypes) {
      getMessageTypes().then(setMessageTypes).catch(() => {});
    }
  }, []);

  useEffect(() => {
    setPage(1);
  }, [industry, messageType]);

  function formatName(name: string): string {
    return name
      .split(/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])|[\s_-]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")
      .trim();
  }

  return (
    <div>
      <div className="mb-10 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); setSearchCommit(c => c + 1); } }}
              placeholder="Search templates..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/30 transition-all"
            />
          </div>
          <select
            value={industry}
            onChange={(e) => setIndustry((e.target as HTMLSelectElement).value)}
            className="px-4 py-3 bg-brand-bg-card/80 border border-white/15 rounded-xl text-white shadow-lg shadow-black/10 focus:outline-none focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/20 transition-all min-w-[180px] appearance-none"
          >
            <option value="" className="bg-brand-bg-card text-white">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind} className="bg-brand-bg-card text-white">{ind}</option>
            ))}
          </select>
          <select
            value={messageType}
            onChange={(e) => setMessageType((e.target as HTMLSelectElement).value)}
            className="px-4 py-3 bg-brand-bg-card/80 border border-white/15 rounded-xl text-white shadow-lg shadow-black/10 focus:outline-none focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/20 transition-all min-w-[180px] appearance-none"
          >
            <option value="" className="bg-brand-bg-card text-white">All Types</option>
            {messageTypes.map((mt) => (
              <option key={mt} value={mt} className="bg-brand-bg-card text-white">{mt}</option>
            ))}
          </select>
        </div>
      </div>

      {!loading && !error && props.initialTemplates && (
        <p className="text-gray-400 text-sm mb-6">
          Showing {templates.length} of {total} templates
        </p>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
        </div>
      )}

      {error && templates.length === 0 && (
        <div className="max-w-2xl mx-auto p-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
          <p className="text-red-400 font-semibold">Error loading templates: {error}</p>
          <button
            onClick={fetchTemplates}
            className="mt-4 px-6 py-2 bg-brand-primary/20 text-brand-primary rounded-xl hover:bg-brand-primary/30 transition-all font-semibold"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && (
        <>
          {templates.length === 0 && !error ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No templates found matching your criteria.</p>
              <button
                onClick={() => { setSearch(""); setIndustry(""); setMessageType(""); setPage(1); setSearchCommit(c => c + 1); }}
                className="mt-4 text-brand-primary hover:underline font-semibold"
              >
                Clear filters
              </button>
            </div>
          ) : templates.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {templates.map((template) => (
                  <div className="group bg-brand-bg-card/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden hover:border-brand-primary/50 transition-all duration-500 hover:-translate-y-2">
                    <div className="aspect-video relative overflow-hidden bg-gray-900/50">
                      <img
                        src={getThumbnailUrl(template.slug)}
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder-template.png";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60" />
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors">
                          {formatName(template.name)}
                        </h3>
                        {template.industries.length > 0 && (
                          <span className="px-2 py-1 bg-brand-primary/20 text-brand-primary text-xs font-bold rounded uppercase tracking-wider whitespace-nowrap ml-2">
                            {template.industries[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {template.summary || "Professional email template."}
                      </p>
                      {template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {template.tags.slice(0, 3).map((tag) => (
                            <span className="px-2 py-0.5 bg-white/5 text-gray-400 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <a
                          href={`/templates/${template.slug}`}
                          className="inline-flex items-center text-brand-primary font-bold hover:underline group-hover:translate-x-1 transition-transform"
                        >
                          View Template
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                  >
                    Previous
                  </button>
                  <span className="text-gray-400 text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

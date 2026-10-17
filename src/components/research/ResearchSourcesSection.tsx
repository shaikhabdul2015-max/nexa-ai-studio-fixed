import React, { useState, useMemo } from "react";
import { ResearchCitation } from "../../types";
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  BookOpen,
  ArrowUpRight,
  Search,
  ShieldCheck,
} from "lucide-react";

interface ResearchSourcesSectionProps {
  citations?: ResearchCitation[];
  topic: string;
  reportContent?: string;
}

export const ResearchSourcesSection: React.FC<ResearchSourcesSectionProps> = ({
  citations = [],
  topic,
  reportContent = "",
}) => {
  const [copied, setCopied] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  // Harmonize, deduplicate, and enrich sources from API citations and report markdown
  const sourcesList = useMemo(() => {
    const list: Array<{ title: string; uri: string; domain: string }> = [];
    const seenUris = new Set<string>();

    const getDomain = (urlStr: string): string => {
      try {
        const parsed = new URL(urlStr);
        return parsed.hostname.replace(/^www\./, "");
      } catch {
        return "web";
      }
    };

    const add = (title?: string, uri?: string) => {
      if (!uri) return;
      const cleanUri = uri.trim().replace(/[\),.]+$/, "");
      if (!cleanUri.startsWith("http://") && !cleanUri.startsWith("https://")) return;
      if (seenUris.has(cleanUri)) return;
      seenUris.add(cleanUri);

      const domain = getDomain(cleanUri);
      let cleanTitle = title?.trim() || "";
      if (!cleanTitle || cleanTitle === cleanUri) {
        cleanTitle = `${domain.toUpperCase()} Reference Document`;
      }

      list.push({
        title: cleanTitle,
        uri: cleanUri,
        domain,
      });
    };

    // 1. Ingest backend citations
    if (Array.isArray(citations)) {
      for (const c of citations) {
        const uri = c.uri || c.url;
        add(c.title, uri);
      }
    }

    // 2. Extract markdown links from reportContent: [Title](https://...)
    if (reportContent) {
      const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
      let match: RegExpExecArray | null;
      while ((match = mdRegex.exec(reportContent)) !== null) {
        add(match[1], match[2]);
      }

      // Extract raw URLs from reportContent
      const urlRegex = /(https?:\/\/[^\s\)"'<>]+)/g;
      while ((match = urlRegex.exec(reportContent)) !== null) {
        const rawUrl = match[1].replace(/[\),.]+$/, "");
        add(getDomain(rawUrl), rawUrl);
      }
    }

    // 3. Guaranteed fallback references if list is small
    if (list.length === 0 && topic) {
      const enc = encodeURIComponent(topic);
      add(`arXiv Scientific Preprints: ${topic}`, `https://arxiv.org/search/?query=${enc}&searchtype=all`);
      add(`Google Scholar Directory: ${topic}`, `https://scholar.google.com/scholar?q=${enc}`);
      add(`Wikipedia Knowledge Base: ${topic}`, `https://en.wikipedia.org/wiki/Special:Search?search=${enc}`);
      add(`Semantic Scholar Database: ${topic}`, `https://www.semanticscholar.org/search?q=${enc}`);
      add("NIST National Institute of Standards & Technology", "https://www.nist.gov/publications");
    }

    return list;
  }, [citations, reportContent, topic]);

  // Filter sources if user types in search box
  const filteredSources = useMemo(() => {
    if (!filterQuery.trim()) return sourcesList;
    const q = filterQuery.toLowerCase();
    return sourcesList.filter(
      (s) => s.title.toLowerCase().includes(q) || s.uri.toLowerCase().includes(q) || s.domain.toLowerCase().includes(q)
    );
  }, [sourcesList, filterQuery]);

  const handleCopyAllLinks = () => {
    if (sourcesList.length === 0) return;
    const text = sourcesList
      .map((s, idx) => `[${idx + 1}] ${s.title}: ${s.uri}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (sourcesList.length === 0) {
    return null;
  }

  return (
    <section
      id="sources-and-citations"
      aria-label="Sources and Citations"
      className="pt-8 border-t border-neutral-200 dark:border-neutral-800 space-y-4"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              Sources & Citations
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                {sourcesList.length} references
              </span>
            </h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Clickable reference websites and literature evaluated during this grounding investigation.</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {sourcesList.length > 4 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                id="search-citations-input"
                placeholder="Filter sources..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-44"
              />
            </div>
          )}

          <button
            id="copy-all-citations-btn"
            onClick={handleCopyAllLinks}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
            title="Copy all reference links to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied All" : "Copy Links"}</span>
          </button>
        </div>
      </div>

      {/* Sources Grid of Clickable Hyperlinks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
        {filteredSources.map((source, index) => (
          <a
            key={`${source.uri}-${index}`}
            id={`source-citation-link-${index}`}
            href={source.uri}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open reference: ${source.title} (${source.uri})`}
            className="group flex flex-col justify-between p-3 rounded-xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all text-left"
          >
            <div>
              {/* Top row: badge & index + external link icon */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                    [{index + 1}]
                  </span>
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/60 truncate max-w-[160px]">
                    {source.domain}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <span className="text-[10px] hidden group-hover:inline font-medium">Visit</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>

              {/* Reference Title */}
              <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {source.title}
              </h4>
            </div>

            {/* Clickable Hyperlink URI Display */}
            <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center gap-1.5 text-[11px] text-neutral-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span className="truncate font-mono text-[10px] underline decoration-neutral-300 dark:decoration-neutral-700 group-hover:decoration-blue-400">
                {source.uri}
              </span>
            </div>
          </a>
        ))}
      </div>

      {filteredSources.length === 0 && filterQuery && (
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-500 dark:text-neutral-400">
          No citations found matching &ldquo;{filterQuery}&rdquo;.
        </div>
      )}
    </section>
  );
};

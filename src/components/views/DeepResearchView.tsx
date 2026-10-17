import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import {
  Compass,
  Search,
  BookOpen,
  Newspaper,
  GraduationCap,
  Download,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  Languages,
  BarChart3,
  AlertCircle,
  X,
} from "lucide-react";
import { runDeepResearch, translateReportText } from "../../services/api";
import { ResearchReport } from "../../types";
import { ResearchChartsSection } from "../research/ResearchChartsSection";
import { ResearchSourcesSection } from "../research/ResearchSourcesSection";
import { extractOrSynthesizeResearchCharts } from "../../utils/researchCharts";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const DeepResearchView: React.FC = () => {
  const { t, trackUsage, addNotification } = useApp();

  const [topic, setTopic] = useState("");
  const [researchMode, setResearchMode] = useState<
    "Quick Research" | "Deep Research" | "Academic Research" | "News Research"
  >("Deep Research");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationsCache, setTranslationsCache] = useState<Record<string, string>>({});
  const [originalContent, setOriginalContent] = useState<string>("");
  const [showCharts, setShowCharts] = useState(true);
  const [quotaExceededAlert, setQuotaExceededAlert] = useState<{
    message: string;
    limit?: number;
    used?: number;
    period?: string;
    resetDate?: string;
  } | null>(null);

  const translationLanguages = [
    { code: "en", name: "English", label: "English (Original)" },
    { code: "hi", name: "Hindi", label: "Hindi (हिंदी)" },
    { code: "es", name: "Spanish", label: "Spanish (Español)" },
    { code: "fr", name: "French", label: "French (Français)" },
    { code: "de", name: "German", label: "German (Deutsch)" },
    { code: "ja", name: "Japanese", label: "Japanese (日本語)" },
    { code: "mr", name: "Marathi", label: "Marathi (मराठी)" },
    { code: "ar", name: "Arabic", label: "Arabic (العربية)" },
    { code: "pt", name: "Portuguese", label: "Portuguese (Português)" },
    { code: "zh", name: "Chinese", label: "Chinese (中文)" },
    { code: "ru", name: "Russian", label: "Russian (Русский)" },
  ];

  const researchSteps = [
    "Vectorizing research hypothesis & identifying semantic domains...",
    "Querying Google Search Grounded indices for authoritative data...",
    "Corroborating citations, institutional studies & empirical data...",
    "Synthesizing comparative timeline, key findings & structured dossier...",
  ];

  const modes: Array<{
    id: "Quick Research" | "Deep Research" | "Academic Research" | "News Research";
    title: string;
    desc: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    {
      id: "Quick Research",
      title: "Quick Research",
      desc: "Fast executive summary with primary data points",
      icon: Compass,
    },
    {
      id: "Deep Research",
      title: "Deep Research",
      desc: "Exhaustive synthesis, timeline, tables & methodology",
      icon: BookOpen,
    },
    {
      id: "Academic Research",
      title: "Academic Research",
      desc: "Peer-reviewed emphasis, statistical checks & rigor",
      icon: GraduationCap,
    },
    {
      id: "News Research",
      title: "News Research",
      desc: "Recent event timelines, perspectives & verified reports",
      icon: Newspaper,
    },
  ];

  const handleStartResearch = async () => {
    if (!topic.trim() || isLoading) return;
    setQuotaExceededAlert(null);
    setIsLoading(true);
    setCurrentStepIndex(0);
    setReport(null);
    setSelectedLanguage("en");
    setTranslationsCache({});
    setOriginalContent("");

    // Step cycle animation
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < researchSteps.length - 1 ? prev + 1 : prev));
    }, 2500);

    try {
      const data = await runDeepResearch(topic, researchMode);
      setOriginalContent(data.report);
      setTranslationsCache({ en: data.report });
      setSelectedLanguage("en");

      setReport({
        id: "rep-" + Date.now(),
        topic,
        mode: researchMode,
        report: data.report,
        content: data.report,
        sources: data.sources || [],
        citations: data.sources || [],
        createdAt: new Date().toISOString(),
        quotaFallback: data.quotaFallback,
        visualizations: data.visualizations,
      });
      trackUsage("research", 1500);
      if (data.quotaFallback) {
        addNotification("Dossier Compiled", `Autonomous dossier compiled for: ${topic} (quota fallback active)`, "info");
      } else {
        addNotification("Research Complete", `Dossier compiled for: ${topic}`, "success");
      }
    } catch (err: any) {
      // Intercept 429 status code from server
      const is429 =
        err?.status === 429 ||
        err?.statusCode === 429 ||
        err?.data?.status === 429 ||
        err?.message?.includes("429") ||
        err?.message?.toLowerCase().includes("monthly") ||
        err?.message?.toLowerCase().includes("quota");

      if (is429) {
        setQuotaExceededAlert({
          message:
            err?.data?.error ||
            err?.data?.message ||
            err.message ||
            "Monthly research quota reached. Guest accounts are limited to 3 deep research reports per month.",
          limit: err?.data?.limit || 3,
          used: err?.data?.used || 3,
          period: err?.data?.period || "monthly",
          resetDate: err?.data?.resetDate || "1st of next month",
        });
        addNotification(
          "Monthly Quota Reached",
          "Guest limit of 3 deep research investigations per month reached.",
          "warning"
        );
      } else {
        addNotification("Research Error", err.message || "Deep research failed", "error");
      }
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  const charts = useMemo(() => {
    if (report?.visualizations && report.visualizations.length > 0) {
      return report.visualizations;
    }
    if (!report) return [];
    return extractOrSynthesizeResearchCharts(report.topic, report.content);
  }, [report?.topic, report?.content, report?.visualizations]);

  const handleTranslateLanguage = async (targetLangCode: string) => {
    if (!report || targetLangCode === selectedLanguage || isTranslating) return;

    if (targetLangCode === "en") {
      setSelectedLanguage("en");
      setReport((prev) => (prev ? { ...prev, content: originalContent, report: originalContent } : null));
      return;
    }

    // Check if translation is cached
    if (translationsCache[targetLangCode]) {
      const cached = translationsCache[targetLangCode];
      setSelectedLanguage(targetLangCode);
      setReport((prev) => (prev ? { ...prev, content: cached, report: cached } : null));
      const targetObj = translationLanguages.find((l) => l.code === targetLangCode);
      addNotification("Language Switched", `Showing report in ${targetObj?.name || targetLangCode}`, "info");
      return;
    }

    // Request translation via Gemini API
    setIsTranslating(true);
    const targetObj = translationLanguages.find((l) => l.code === targetLangCode);
    const targetName = targetObj ? targetObj.name : targetLangCode;

    try {
      const res = await translateReportText(originalContent, targetName);
      if (res.translatedText) {
        setTranslationsCache((prev) => ({ ...prev, [targetLangCode]: res.translatedText }));
        setSelectedLanguage(targetLangCode);
        setReport((prev) => (prev ? { ...prev, content: res.translatedText, report: res.translatedText } : null));
        addNotification("Report Translated", `Dossier translated to ${targetName} (${targetObj?.label.split(" ")[1] || ""})`, "success");
      }
    } catch (err: any) {
      addNotification("Translation Error", err.message || "Failed to translate report.", "error");
    } finally {
      setIsTranslating(false);
    }
  };

  const getDossierExportText = () => {
    if (!report) return "";
    let content = report.content;
    const citations = report.citations || [];
    if (citations.length > 0 && !content.toLowerCase().includes("sources & citations")) {
      const links = citations
        .map((c, i) => `${i + 1}. [${c.title || c.uri || "Reference Source"}](${c.uri || c.url || "#"})`)
        .join("\n");
      content = `${content}\n\n---\n## Sources & Citations\n${links}\n`;
    }
    return content;
  };

  const handleCopyReport = () => {
    if (!report) return;
    navigator.clipboard.writeText(getDossierExportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = (format: "markdown" | "txt") => {
    if (!report) return;
    const exportText = getDossierExportText();
    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const langSuffix = selectedLanguage !== "en" ? `_${selectedLanguage.toUpperCase()}` : "";
    a.download = `NEXA_Research_${report.topic.replace(/\s+/g, "_")}${langSuffix}.${format === "markdown" ? "md" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="deep-research-view" className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header section */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2 border border-blue-200 dark:border-blue-800">
          <Compass className="w-3.5 h-3.5" />
          <span>Autonomous Grounded Investigation</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          {t.research.title}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
          {t.research.subtitle}
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {modes.map((m) => {
          const Icon = m.icon;
          const isSelected = researchMode === m.id;
          return (
            <button
              key={m.id}
              id={`research-mode-${m.id}`}
              onClick={() => setResearchMode(m.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isSelected
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm"
                  : "bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white hover:border-neutral-300 dark:hover:border-neutral-700"
              }`}
            >
              <Icon className="w-5 h-5 mb-2" />
              <h3 className="font-semibold text-xs">{m.title}</h3>
              <p
                className={`text-[11px] mt-1 line-clamp-2 ${
                  isSelected
                    ? "text-neutral-300 dark:text-neutral-600"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {m.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* 429 Monthly Quota Exceeded Alert Banner */}
      {quotaExceededAlert && (
        <div
          id="research-quota-exceeded-alert"
          role="alert"
          className="p-5 rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 shadow-xs transition-all"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                    Monthly Research Quota Reached
                  </h3>
                  <span className="text-[10px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-800/70 text-amber-900 dark:text-amber-200">
                    3 / 3 Reports Used
                  </span>
                </div>
                <button
                  id="dismiss-quota-alert-btn"
                  onClick={() => setQuotaExceededAlert(null)}
                  className="p-1 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
                  title="Dismiss warning"
                  aria-label="Dismiss warning"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-1.5 leading-relaxed">
                {quotaExceededAlert.message}
              </p>

              <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <span>Cycle Reset:</span>
                  <span className="font-medium text-amber-900 dark:text-amber-200">
                    {quotaExceededAlert.resetDate || "1st of next month"}
                  </span>
                </div>
                <span className="text-[11px] text-amber-700/80 dark:text-amber-400">
                  Dynamic IP Tier: Guest Access (3 requests/month limit)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Box */}
      <div className="p-5 rounded-3xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <label
          htmlFor="research-topic-input"
          className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200"
        >
          Research Topic, Query or Thesis
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="research-topic-input"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStartResearch()}
            placeholder={t.research.topicPlaceholder}
            className="flex-1 px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
          />
          <button
            id="start-research-btn"
            onClick={handleStartResearch}
            disabled={!topic.trim() || isLoading}
            className="px-6 py-3 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2 shrink-0 shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Investigating...</span>
              </>
            ) : (
              <>
                <span>{t.research.generateReport}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Suggestion tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="text-[11px] font-medium mr-1">Trending Topics:</span>
          {[
            "Neuromorphic Computing Architectures",
            "State of Solid State Batteries 2026",
            "Post-Quantum Cryptography NIST Standards",
            "CRISPR-Cas9 Therapeutic Approvals",
          ].map((sug, i) => (
            <button
              key={i}
              onClick={() => setTopic(sug)}
              className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Progress State */}
      {isLoading && (
        <div
          id="research-loading-state"
          className="p-8 rounded-3xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-4 animate-in fade-in duration-300"
        >
          <div className="w-12 h-12 rounded-full border-3 border-neutral-900 dark:border-white border-t-transparent animate-spin mx-auto" />
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              Synthesizing Multi-Source Intelligence
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-1">
              {researchSteps[currentStepIndex]}
            </p>
          </div>
          <div className="max-w-md mx-auto bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-neutral-900 dark:bg-white h-full rounded-full transition-all duration-700"
              style={{
                width: `${((currentStepIndex + 1) / researchSteps.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Generated Report Display */}
      {report && (
        <article
          id="research-report-container"
          className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6 animate-in fade-in zoom-in-98 duration-200"
        >
          {/* Action header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                {report.mode} Dossier
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mt-1">
                {report.topic}
              </h2>
              <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(report.createdAt).toLocaleDateString([], {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span>·</span>
                <span className={report.quotaFallback ? "text-amber-600 dark:text-amber-400 font-medium" : ""}>
                  {report.quotaFallback ? "Autonomous Knowledge Synthesis (Quota Active)" : "Grounding: Google Search Engine"}
                </span>
              </div>
            </div>

            {/* Translation & Export Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Multi-language Translation Dropdown */}
              <div
                id="research-translation-control"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 text-xs text-neutral-700 dark:text-neutral-300 transition-colors"
                title="Translate report to another language before exporting"
              >
                {isTranslating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                ) : (
                  <Languages className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                )}
                <select
                  id="research-language-dropdown"
                  value={selectedLanguage}
                  onChange={(e) => handleTranslateLanguage(e.target.value)}
                  disabled={isTranslating}
                  aria-label="Select translation language"
                  className="bg-transparent border-none text-xs font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer pr-1 disabled:opacity-50"
                >
                  {translationLanguages.map((lang) => (
                    <option
                      key={lang.code}
                      value={lang.code}
                      className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 py-1"
                    >
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                id="toggle-charts-btn"
                onClick={() => setShowCharts((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                  showCharts
                    ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
                title="Toggle statistical data visualizations"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{showCharts ? "Charts Active" : "Show Charts"}</span>
              </button>

              <button
                id="copy-report-btn"
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Copy markdown text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              <button
                id="download-md-report-btn"
                onClick={() => handleDownloadReport("markdown")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Download Markdown (.md)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .MD</span>
              </button>

              <button
                id="print-report-btn"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-medium hover:opacity-90 transition-opacity shadow-2xs"
                title="Print or save as PDF"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>

          {/* Integrated Data Visualizations Section (Bar Charts / Line Graphs) */}
          {showCharts && charts && charts.length > 0 && (
            <ResearchChartsSection charts={charts} topic={report.topic} />
          )}

          {/* Report Body Markdown */}
          <div className="markdown-body prose prose-sm dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table(props) {
                  return (
                    <div className="overflow-x-auto my-4 border border-neutral-200 dark:border-neutral-700 rounded-xl">
                      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700 text-left text-xs" {...props} />
                    </div>
                  );
                },
                th(props) {
                  return (
                    <th className="px-3 py-2.5 bg-neutral-100 dark:bg-neutral-800/80 font-semibold text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700" {...props} />
                  );
                },
                td(props) {
                  return (
                    <td className="px-3 py-2.5 text-neutral-700 dark:text-neutral-300 border-b border-neutral-100 dark:border-neutral-800/60 align-top" {...props} />
                  );
                },
              }}
            >
              {report.content}
            </ReactMarkdown>
          </div>

          {/* Dedicated Sources & Citations Section */}
          <ResearchSourcesSection
            citations={report.citations}
            topic={report.topic}
            reportContent={report.content}
          />
        </article>
      )}
    </div>
  );
};

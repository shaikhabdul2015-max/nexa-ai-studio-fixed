import React, { useState, useEffect, useRef } from "react";
import { LiveArtifact } from "../../types";
import { generateSandboxHtml, ArtifactLogMessage } from "../../utils/sandboxRunner";
import { STARTER_ARTIFACTS } from "../../utils/artifactExtractor";
import {
  Eye,
  Code2,
  RotateCw,
  Copy,
  Check,
  Download,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  Minimize2,
  X,
  Terminal,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from "lucide-react";

interface LiveArtifactCanvasProps {
  artifact: LiveArtifact | null;
  artifactsList: LiveArtifact[];
  onSelectArtifact: (art: LiveArtifact) => void;
  onUpdateArtifactCode: (id: string, newCode: string) => void;
  onClose: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const LiveArtifactCanvas: React.FC<LiveArtifactCanvasProps> = ({
  artifact,
  artifactsList,
  onSelectArtifact,
  onUpdateArtifactCode,
  onClose,
  isExpanded = false,
  onToggleExpand,
}) => {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [sandboxTheme, setSandboxTheme] = useState<"dark" | "light">("dark");
  const [editedCode, setEditedCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<ArtifactLogMessage[]>([]);
  const [keyReload, setKeyReload] = useState(0);
  const [showArtifactDropdown, setShowArtifactDropdown] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync edited code when active artifact changes
  useEffect(() => {
    if (artifact) {
      setEditedCode(artifact.code);
      setConsoleLogs([]);
    }
  }, [artifact?.id, artifact?.code]);

  // Listen to postMessage logs from the sandboxed iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "NEXA_ARTIFACT_LOG") {
        setConsoleLogs((prev) => [
          ...prev.slice(-100), // keep latest 100 logs
          {
            id: "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
            level: event.data.level || "log",
            text: event.data.text || "",
            timestamp: event.data.timestamp || new Date().toLocaleTimeString(),
          },
        ]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleCopyCode = () => {
    if (!artifact) return;
    navigator.clipboard.writeText(editedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!artifact) return;
    const extMap: Record<string, string> = {
      react: "tsx",
      html: "html",
      svg: "svg",
      javascript: "js",
      css: "css",
    };
    const ext = extMap[artifact.type] || "txt";
    const blob = new Blob([editedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyChanges = () => {
    if (!artifact) return;
    onUpdateArtifactCode(artifact.id, editedCode);
    setKeyReload((prev) => prev + 1);
  };

  const handleResetOriginal = () => {
    if (!artifact) return;
    const orig = artifact.originalCode || artifact.code;
    setEditedCode(orig);
    onUpdateArtifactCode(artifact.id, orig);
    setKeyReload((prev) => prev + 1);
  };

  const errorCount = consoleLogs.filter((l) => l.level === "error").length;
  const isCodeModified = artifact && editedCode !== (artifact.originalCode || artifact.code);

  // If no artifact is open, show the Starter Canvas View
  if (!artifact) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 overflow-y-auto min-h-0">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Live Interactive Canvas
              </h2>
              <p className="text-[11px] text-neutral-500">
                Claude-like real-time workspace for React, HTML, and SVG artifacts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-auto py-8 max-w-md mx-auto text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-purple-500 shadow-sm border border-neutral-200 dark:border-neutral-700">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            No Active Live Artifact
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            When you ask NEXA in chat to create an interactive component, web application, or UI tool, the live working preview and code tabs will instantly render here in real-time.
          </p>

          <div className="pt-4 space-y-2.5 text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block text-center">
              Try a Starter Live Artifact:
            </span>
            {STARTER_ARTIFACTS.map((sample) => (
              <div
                key={sample.id}
                onClick={() => onSelectArtifact(sample)}
                className="group p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-purple-500 dark:hover:border-purple-500/80 bg-neutral-50 dark:bg-neutral-850 hover:bg-white dark:hover:bg-neutral-800 cursor-pointer transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                      {sample.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 uppercase">
                    {sample.type}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  Click to open live sandbox with working preview and editable code
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Generate HTML for sandboxed iframe
  const sandboxHtml = generateSandboxHtml(
    { ...artifact, code: editedCode },
    sandboxTheme
  );

  return (
    <div
      id="live-artifact-canvas-container"
      className="h-full flex flex-col bg-white dark:bg-neutral-900 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800 overflow-hidden min-h-0"
    >
      {/* Canvas Top Bar */}
      <div className="px-2 sm:px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-900/90 flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 select-none overflow-x-auto">
        {/* Left: Artifact info & selector */}
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowArtifactDropdown(!showArtifactDropdown)}
              className="flex items-center gap-1 p-1 px-2 rounded-lg bg-neutral-200/60 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold max-w-[130px] sm:max-w-[200px] truncate"
              title="Switch active artifact"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span className="truncate">{artifact.title}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
            </button>

            {/* Artifacts Switcher Dropdown */}
            {showArtifactDropdown && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-50 p-1.5 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 py-1">
                  Available Artifacts ({artifactsList.length})
                </div>
                {artifactsList.map((art) => (
                  <button
                    key={art.id}
                    onClick={() => {
                      onSelectArtifact(art);
                      setShowArtifactDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      art.id === artifact.id
                        ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    }`}
                  >
                    <span className="truncate max-w-[170px]">{art.title}</span>
                    <span className="text-[10px] font-mono uppercase text-neutral-400">
                      {art.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold">
            {artifact.type}
          </span>
        </div>

        {/* Center: Preview vs Code Tabs */}
        <div className="flex items-center p-0.5 sm:p-1 rounded-xl bg-neutral-200/70 dark:bg-neutral-800 border border-neutral-300/50 dark:border-neutral-700/60 shrink-0">
          <button
            id="artifact-preview-tab-btn"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "preview"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
          <button
            id="artifact-code-tab-btn"
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "code"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>
        </div>

        {/* Right: Viewport, Reload, Copy, Download, Close */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {activeTab === "preview" && (
            <>
              {/* Viewport switchers */}
              <div className="hidden sm:flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg p-0.5 bg-white dark:bg-neutral-800">
                <button
                  onClick={() => setViewport("desktop")}
                  title="Desktop (100%)"
                  className={`p-1 rounded ${
                    viewport === "desktop"
                      ? "bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white"
                      : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewport("tablet")}
                  title="Tablet (768px)"
                  className={`p-1 rounded ${
                    viewport === "tablet"
                      ? "bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white"
                      : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewport("mobile")}
                  title="Mobile (375px)"
                  className={`p-1 rounded ${
                    viewport === "mobile"
                      ? "bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white"
                      : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Theme toggle for sandbox */}
              <button
                onClick={() => setSandboxTheme(sandboxTheme === "dark" ? "light" : "dark")}
                title={`Toggle Preview Theme (${sandboxTheme})`}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-800"
              >
                {sandboxTheme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>

              {/* Reload preview */}
              <button
                onClick={() => setKeyReload((prev) => prev + 1)}
                title="Reload Preview Sandbox"
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-800"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Toggle Console drawer */}
              <button
                onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                title="Toggle Console Logs Drawer"
                className={`relative p-1.5 rounded-lg border transition-colors ${
                  isConsoleOpen
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white"
                    : "border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-800"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                {errorCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {errorCount}
                  </span>
                )}
              </button>
            </>
          )}

          {/* Copy code */}
          <button
            onClick={handleCopyCode}
            title="Copy Source Code"
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-800 flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Download file */}
          <button
            onClick={handleDownload}
            title="Download Artifact File"
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-800"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Expand / Collapse Fullscreen */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              title={isExpanded ? "Collapse Canvas" : "Expand Canvas"}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-800"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Close Canvas */}
          <button
            onClick={onClose}
            title="Close Canvas"
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-neutral-100 dark:bg-neutral-950">
        {activeTab === "preview" ? (
          /* Live Sandbox Preview */
          <div className="flex-1 w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-auto min-h-0">
            <div
              className={`h-full transition-all duration-300 rounded-xl sm:rounded-2xl overflow-hidden shadow-md border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col ${
                viewport === "mobile"
                  ? "w-full max-w-[375px] max-h-[700px] border-2 sm:border-4 border-neutral-800 dark:border-neutral-700 rounded-[24px] sm:rounded-[36px]"
                  : viewport === "tablet"
                  ? "w-full max-w-[768px] max-h-[880px] border-2 sm:border-4 border-neutral-800 dark:border-neutral-700 rounded-[20px] sm:rounded-[28px]"
                  : "w-full"
              }`}
            >
              {/* Optional Phone/Tablet notch bar */}
              {viewport !== "desktop" && (
                <div className="h-4 sm:h-5 bg-neutral-800 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                  <div className="w-12 sm:w-16 h-1 sm:h-1.5 bg-neutral-600 rounded-full" />
                </div>
              )}

              <iframe
                key={`${artifact.id}-${keyReload}-${sandboxTheme}`}
                ref={iframeRef}
                srcDoc={sandboxHtml}
                sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
                className="w-full flex-1 bg-white dark:bg-neutral-900 border-0 min-h-0"
                title={artifact.title}
              />
            </div>
          </div>
        ) : (
          /* Code Tab / Editor */
          <div className="flex-1 flex flex-col h-full bg-neutral-900 text-neutral-100 font-mono text-xs overflow-hidden min-h-0">
            {/* Editor Action Header */}
            <div className="px-3 sm:px-4 py-2 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-400">
                  {artifact.language.toUpperCase()} · {editedCode.split("\n").length} lines
                </span>
                {isCodeModified && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Modified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isCodeModified && (
                  <button
                    onClick={handleResetOriginal}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] transition-colors"
                    title="Reset to AI generated code"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
                <button
                  onClick={handleApplyChanges}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] transition-colors shadow-sm"
                  title="Run modified code in preview"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Run Changes</span>
                </button>
              </div>
            </div>

            {/* Code Textarea with Line Numbers */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Line numbers column */}
              <div className="py-3 px-2 bg-neutral-950/80 text-neutral-600 select-none text-right font-mono text-[11px] border-r border-neutral-800 overflow-hidden shrink-0 min-w-[36px] sm:min-w-[42px]">
                {editedCode.split("\n").map((_, i) => (
                  <div key={i} className="leading-5">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                value={editedCode}
                onChange={(e) => setEditedCode(e.target.value)}
                spellCheck={false}
                className="flex-1 p-2 sm:p-3 bg-neutral-900 text-neutral-200 font-mono text-xs leading-5 resize-none border-0 focus:outline-none focus:ring-0 overflow-auto whitespace-pre selection:bg-purple-600 selection:text-white min-h-0"
              />
            </div>
          </div>
        )}

        {/* Collapsible Console Logs Drawer */}
        {isConsoleOpen && (
          <div className="h-36 sm:h-44 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-neutral-200 flex flex-col text-xs font-mono shrink-0">
            <div className="px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-neutral-300 font-bold text-[11px]">
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                Live Sandbox Console Logs ({consoleLogs.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConsoleLogs([])}
                  className="text-[11px] text-neutral-400 hover:text-white"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsConsoleOpen(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {consoleLogs.length === 0 ? (
                <div className="text-neutral-500 italic py-4 text-center text-[11px]">
                  No console logs captured yet. Execute actions in the preview to inspect logs.
                </div>
              ) : (
                consoleLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 py-0.5 px-1.5 rounded text-[11px] ${
                      log.level === "error"
                        ? "bg-rose-950/40 text-rose-300 border-l-2 border-rose-500"
                        : log.level === "warn"
                        ? "bg-amber-950/40 text-amber-300 border-l-2 border-amber-500"
                        : "text-neutral-300"
                    }`}
                  >
                    <span className="text-neutral-500 text-[10px] shrink-0 font-mono">
                      {log.timestamp}
                    </span>
                    <span
                      className={`uppercase text-[9px] font-bold px-1 rounded shrink-0 ${
                        log.level === "error"
                          ? "bg-rose-600 text-white"
                          : log.level === "warn"
                          ? "bg-amber-600 text-black"
                          : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="break-all whitespace-pre-wrap">{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

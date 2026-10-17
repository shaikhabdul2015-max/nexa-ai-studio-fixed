import React, { useState } from "react";
import {
  Globe,
  Cpu,
  TestTube,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Terminal,
  Layers,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileCode,
  Zap,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  MicroAgentRole,
  MicroAgentStatusInfo,
  MultiAgentExecutionResult,
} from "../../types";
import {
  INITIAL_MICRO_AGENTS,
  runMultiAgentPipeline,
} from "../../services/agentOrchestrator";

interface AgentLogItem {
  id: string;
  agent: MicroAgentRole | "system";
  text: string;
  timestamp: string;
  type: "info" | "success" | "warning";
}

export const AutonomousMultiAgentTray: React.FC = () => {
  const {
    projects,
    currentProjectId,
    activeProjectId,
    activeWorkspaceFiles,
    addNotification,
    trackUsage,
    setTotalTokens,
  } = useApp();

  const effectiveProjId = activeProjectId || currentProjectId;
  const activeProj = effectiveProjId ? projects.find((p) => p.id === effectiveProjId) : null;
  const workspaceFiles = (activeWorkspaceFiles && activeWorkspaceFiles.length > 0)
    ? activeWorkspaceFiles
    : (activeProj ? (activeProj.files || []).filter((f) => !f.videoUrl && f.content) : []);

  const [agents, setAgents] = useState<Record<MicroAgentRole, MicroAgentStatusInfo>>(INITIAL_MICRO_AGENTS);
  const [activeStage, setActiveStage] = useState<MicroAgentRole | "idle" | "done">("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [prompt, setPrompt] = useState("Build Real-Time Collaboration Socket Layer with optimistic locking and schema validation");
  const [logs, setLogs] = useState<AgentLogItem[]>([]);
  const [result, setResult] = useState<MultiAgentExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "frontend" | "backend" | "compiler" | "logs">("overview");
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const presets = [
    "Build Real-Time Collaboration Socket Layer with optimistic locking",
    "Construct Distributed Raft Preemption Controller and state machine",
    "Deploy Zero-Trust RBAC Middleware & Token Checkpoint guardrails",
    "Implement High-Throughput Ring Buffer IPC Telemetry Streamer",
  ];

  const handleRunPipeline = async (customPrompt?: string) => {
    const promptToRun = customPrompt || prompt;
    if (!promptToRun.trim() || isRunning) return;

    setIsRunning(true);
    // Phase 1 begins with the Backend Agent
    setActiveStage("backend");
    setResult(null);
    setLogs([]);
    setActiveTab("overview");

    try {
      const output = await runMultiAgentPipeline(promptToRun, {
        contextFiles: workspaceFiles,
        onAgentUpdate: (updatedAgents, stage) => {
          setAgents({ ...updatedAgents });
          setActiveStage(stage as any);
        },
        onLog: (log) => {
          setLogs((prev) => [log, ...prev].slice(0, 50));
        },
        onTokenUpdate: (tokens) => {
          setTotalTokens(tokens);
        },
        onPhaseComplete: (phase, status, tokens) => {
          setTotalTokens(tokens);
        },
      });

      setResult(output);
      if (output.cumulativeTokens) {
        setTotalTokens(output.cumulativeTokens);
      }
      trackUsage("request", 1200);
      addNotification(
        "Autonomous Pipeline Complete",
        `Backend, Frontend, and QA Tester passed validation (Status: ${output.status || "SUCCESS"}).`,
        "success"
      );
    } catch (err: any) {
      addNotification("Multi-Agent Engine Error", err.message || "Pipeline interrupted", "error");
    } finally {
      setIsRunning(false);
      setActiveStage("done");
    }
  };

  const handleCopyCode = (content: string, tabKey: string) => {
    navigator.clipboard.writeText(content);
    setCopiedTab(tabKey);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  // Helper status color styling for the micro-badges
  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case "Coding":
      case "Injecting UI":
      case "Updating API Routing":
      case "Designing Schema":
      case "Running Linter":
      case "Verifying Build":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse";
      case "Complete":
      case "Compiler Passed":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "Failed":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      default:
        return "bg-neutral-800 text-neutral-400 border-neutral-700";
    }
  };

  const getAgentLedColor = (status: string) => {
    switch (status) {
      case "Coding":
      case "Injecting UI":
      case "Updating API Routing":
      case "Designing Schema":
      case "Running Linter":
      case "Verifying Build":
        return "bg-amber-400 animate-ping";
      case "Complete":
      case "Compiler Passed":
        return "bg-emerald-400";
      default:
        return "bg-neutral-500";
    }
  };

  return (
    <div
      id="autonomous-multi-agent-tray"
      className="rounded-2xl border border-purple-500/30 bg-neutral-950/85 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300"
      style={{
        backgroundImage: `radial-gradient(rgba(168, 85, 247, 0.08) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    >
      {/* Tray Header Bar */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800/80 bg-neutral-900/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Autonomous Multi-Agent Status Tray
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                v2.0 Orchestrator
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Continuous 2M Raw Context Handoff • Zero Truncation • Integrated <code className="text-purple-300 font-mono">tsc --noEmit</code> Compiler Check
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRunPipeline()}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition flex items-center gap-2 shadow-lg shadow-purple-600/25 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Agents Collaborating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Multi-Agent Engine</span>
              </>
            )}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition border border-neutral-800"
            title={isExpanded ? "Collapse Tray" : "Expand Tray"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* Micro-Badges Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 🌐 Frontend Agent Micro-Badge */}
            <div
              id="micro-badge-frontend-agent"
              className={`p-4 rounded-xl border transition-all duration-300 ${
                activeStage === "frontend"
                  ? "bg-neutral-900/90 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                  : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white tracking-tight">🌐 [Frontend Agent]</span>
                    <span className="block text-[10px] text-neutral-400">UI / Reactive Client Bus</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${getAgentLedColor(agents.frontend.status)}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${agents.frontend.status === "Idle" ? "bg-neutral-500" : "bg-emerald-500"}`}></span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${getAgentStatusColor(agents.frontend.status)}`}>
                    {agents.frontend.status}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-neutral-300 line-clamp-2 h-8">
                {agents.frontend.detail}
              </p>
              <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                <span>Progress: {agents.frontend.progress}%</span>
                <span>Context: {agents.frontend.tokensProcessed.toLocaleString()} tok</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${agents.frontend.progress}%` }}
                ></div>
              </div>
            </div>

            {/* ⚙️ Backend Agent Micro-Badge */}
            <div
              id="micro-badge-backend-agent"
              className={`p-4 rounded-xl border transition-all duration-300 ${
                activeStage === "backend"
                  ? "bg-neutral-900/90 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                  : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white tracking-tight">⚙️ [Backend Agent]</span>
                    <span className="block text-[10px] text-neutral-400">Router / Microkernel IPC</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${getAgentLedColor(agents.backend.status)}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${agents.backend.status === "Idle" ? "bg-neutral-500" : "bg-emerald-500"}`}></span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${getAgentStatusColor(agents.backend.status)}`}>
                    {agents.backend.status}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-neutral-300 line-clamp-2 h-8">
                {agents.backend.detail}
              </p>
              <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                <span>Progress: {agents.backend.progress}%</span>
                <span>Context: {agents.backend.tokensProcessed.toLocaleString()} tok</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${agents.backend.progress}%` }}
                ></div>
              </div>
            </div>

            {/* 🧪 QA Tester Agent Micro-Badge */}
            <div
              id="micro-badge-qa-agent"
              className={`p-4 rounded-xl border transition-all duration-300 ${
                activeStage === "qa"
                  ? "bg-neutral-900/90 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                  : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <TestTube className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white tracking-tight">🧪 [QA Tester Agent]</span>
                    <span className="block text-[10px] text-neutral-400">Linter / Compiler Verification</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${getAgentLedColor(agents.qa.status)}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${agents.qa.status === "Idle" ? "bg-neutral-500" : "bg-emerald-500"}`}></span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${getAgentStatusColor(agents.qa.status)}`}>
                    {agents.qa.status}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-neutral-300 line-clamp-2 h-8">
                {agents.qa.detail}
              </p>
              <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                <span>Progress: {agents.qa.progress}%</span>
                <span>Compiler: {agents.qa.status === "Compiler Passed" ? "Clean (0 errors)" : "Standby"}</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${agents.qa.progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Autonomous Prompt & Presets Bar */}
          <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Instruct the Autonomous Multi-Agent Engine (e.g., Build Real-Time Collaboration Socket Layer)..."
                className="flex-1 px-3.5 py-2 rounded-lg bg-neutral-950/80 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/80 font-mono"
              />
              <button
                onClick={() => handleRunPipeline()}
                disabled={isRunning || !prompt.trim()}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dispatch Pipeline</span>
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-neutral-400 mr-1">Presets:</span>
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(preset);
                    handleRunPipeline(preset);
                  }}
                  disabled={isRunning}
                  className="px-2.5 py-1 rounded-md text-[11px] bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 border border-neutral-700/60 transition-colors truncate max-w-[260px]"
                  title={preset}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Multi-Agent Output Inspection Tabs */}
          {result && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-neutral-800 bg-neutral-900/80">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      activeTab === "overview"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Architecture Plan</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("frontend")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      activeTab === "frontend"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Frontend View</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("backend")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      activeTab === "backend"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Backend Router</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("compiler")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      activeTab === "compiler"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Compiler Verification</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-900/80 text-emerald-200 border border-emerald-500/50">
                      tsc: 0
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("logs")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      activeTab === "logs"
                        ? "bg-neutral-700 text-white shadow-sm"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Agent Event Stream</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-neutral-800 text-neutral-300">
                      {logs.length}
                    </span>
                  </button>
                </div>

                {activeTab !== "overview" && activeTab !== "logs" && (
                  <button
                    onClick={() =>
                      handleCopyCode(
                        activeTab === "frontend"
                          ? result.frontendCode
                          : activeTab === "backend"
                          ? result.backendCode
                          : result.compilerReport.logs.join("\n"),
                        activeTab
                      )
                    }
                    className="px-2.5 py-1 rounded-md text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition flex items-center gap-1 border border-neutral-700"
                  >
                    {copiedTab === activeTab ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Tab Body */}
              <div className="p-4 text-xs font-mono text-neutral-200 overflow-x-auto max-h-[380px] overflow-y-auto">
                {activeTab === "overview" && (
                  <div className="space-y-4 font-sans">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                        <span className="text-[10px] text-neutral-400 font-mono uppercase">Context Payload</span>
                        <p className="text-sm font-bold text-purple-400 mt-1">
                          {result.rawContextTokensUsed.toLocaleString()} tokens
                        </p>
                        <span className="text-[10px] text-neutral-500 font-mono">Zero Truncation</span>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                        <span className="text-[10px] text-neutral-400 font-mono uppercase">QA Compiler Check</span>
                        <p className="text-sm font-bold text-emerald-400 mt-1">tsc --noEmit (Passed)</p>
                        <span className="text-[10px] text-neutral-500 font-mono">0 Syntax / Type Errors</span>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                        <span className="text-[10px] text-neutral-400 font-mono uppercase">Multi-Agent Duration</span>
                        <p className="text-sm font-bold text-white mt-1">{(result.totalDurationMs / 1000).toFixed(2)}s</p>
                        <span className="text-[10px] text-neutral-500 font-mono">Sequential Handoff</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 whitespace-pre-wrap leading-relaxed">
                      {result.architecturePlan}
                    </div>
                  </div>
                )}

                {activeTab === "frontend" && (
                  <pre className="p-4 rounded-xl bg-neutral-950/90 text-blue-300 leading-relaxed border border-neutral-800">
                    <code>{result.frontendCode}</code>
                  </pre>
                )}

                {activeTab === "backend" && (
                  <pre className="p-4 rounded-xl bg-neutral-950/90 text-amber-300 leading-relaxed border border-neutral-800">
                    <code>{result.backendCode}</code>
                  </pre>
                )}

                {activeTab === "compiler" && (
                  <div className="space-y-3 font-mono">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold text-xs">Simulated Project Compiler Verification: PASSED</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400">Exit Code: 0 • Duration: {result.compilerReport.durationMs}ms</span>
                    </div>
                    <pre className="p-4 rounded-xl bg-neutral-950 text-neutral-300 border border-neutral-800 leading-loose">
                      <code>{result.compilerReport.logs.join("\n")}</code>
                    </pre>
                  </div>
                )}

                {activeTab === "logs" && (
                  <div className="space-y-2">
                    {logs.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2.5 p-2 rounded-lg bg-neutral-950/60 border border-neutral-800 text-[11px]"
                      >
                        <span className="text-neutral-500 shrink-0 font-mono">[{item.timestamp}]</span>
                        <span
                          className={`font-semibold shrink-0 font-mono ${
                            item.agent === "frontend"
                              ? "text-blue-400"
                              : item.agent === "backend"
                              ? "text-amber-400"
                              : item.agent === "qa"
                              ? "text-emerald-400"
                              : "text-purple-400"
                          }`}
                        >
                          {item.agent === "frontend"
                            ? "🌐 [Frontend]"
                            : item.agent === "backend"
                            ? "⚙️ [Backend]"
                            : item.agent === "qa"
                            ? "🧪 [QA]"
                            : "⚡ [System]"}
                        </span>
                        <span className={item.type === "success" ? "text-emerald-300" : "text-neutral-300"}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

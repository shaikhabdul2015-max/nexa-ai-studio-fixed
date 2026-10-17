import React, { useState } from "react";
import { Cpu, Zap, Database, ShieldCheck, ChevronDown, Sparkles, Activity, FileText } from "lucide-react";

interface TokenUsageMeterProps {
  totalTokens: number;
  projectFilesCount?: number;
  variant?: "compact" | "banner" | "panel";
  className?: string;
  onInspect?: () => void;
}

export const TokenUsageMeter: React.FC<TokenUsageMeterProps> = ({
  totalTokens,
  projectFilesCount = 0,
  variant = "compact",
  className = "",
  onInspect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // 2M Infinite Context constants (powered by Gemini 2.5 Pro)
  const MAX_CAPACITY = 2_000_000;
  // Ensure formatted output matches e.g. "0.05M / 2.0M tokens used"
  const tokensInMillions = (totalTokens / 1_000_000).toFixed(2);
  const percentage = Math.min(100, Math.max(0.5, (totalTokens / MAX_CAPACITY) * 100));
  const remainingTokensM = Math.max(0, 2.0 - Number(tokensInMillions)).toFixed(2);

  if (variant === "compact") {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <button
          id="token-usage-meter-compact"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-purple-500/10 dark:bg-purple-950/40 border border-purple-500/25 text-purple-800 dark:text-purple-300 hover:bg-purple-500/15 transition-all text-xs font-mono shadow-2xs group cursor-pointer"
          title="2M Infinite Context Memory Engine Token Meter"
        >
          <div className="relative flex items-center justify-center">
            <Cpu className="w-3 h-3 text-purple-600 dark:text-purple-400 group-hover:rotate-45 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <span className="font-semibold">{tokensInMillions}M</span>
          <span className="text-purple-500/60 dark:text-purple-400/60">/ 2.0M</span>
          <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-0.5" />
        </button>

        {isOpen && (
          <div
            className="absolute left-0 top-full mt-2 w-72 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                <Zap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>2M Infinite Context Memory</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                Gemini 2.5 Pro
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-500 dark:text-neutral-400">Current Payload</span>
                <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                  {tokensInMillions}M / 2.0M tokens used
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(2, percentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400 pt-0.5">
                <span>{totalTokens.toLocaleString()} raw tokens</span>
                <span>{remainingTokensM}M available</span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 text-[11px] space-y-1 text-neutral-600 dark:text-neutral-300">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Zero Truncation / Full Ingestion</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span>Multi-file reasoning active ({projectFilesCount} files)</span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-1 text-center text-[10px] font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        id="token-usage-meter-banner"
        className={`flex items-center gap-2 px-2.5 py-1 rounded-xl bg-purple-500/10 dark:bg-purple-950/40 border border-purple-500/30 text-purple-900 dark:text-purple-200 text-xs font-mono select-none ${className}`}
        title="2M Infinite Context Memory Engine"
      >
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span className="font-bold text-neutral-900 dark:text-white hidden md:inline font-sans">
            Token Meter:
          </span>
          <span className="font-bold text-purple-700 dark:text-purple-300">
            {tokensInMillions}M / 2.0M tokens used
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 pl-1 border-l border-purple-500/20">
          <div className="w-16 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full"
              style={{ width: `${Math.max(3, percentage)}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-sans">
            ({percentage < 0.1 ? "<0.1" : percentage.toFixed(1)}%)
          </span>
        </div>

        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 uppercase tracking-wider hidden lg:inline">
          2M Infinite
        </span>
      </div>
    );
  }

  // Panel variant (for ProjectKnowledgeBasePanel)
  return (
    <div
      id="token-usage-meter-panel"
      className={`p-4 rounded-2xl bg-gradient-to-br from-purple-500/5 via-neutral-50 to-indigo-500/5 dark:from-purple-950/30 dark:via-neutral-850 dark:to-indigo-950/20 border border-purple-500/20 dark:border-purple-500/20 space-y-3 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-purple-600/10 dark:bg-purple-400/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-900 dark:text-white text-xs">
                2M Infinite Context Memory Engine
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-600 text-white uppercase tracking-wider">
                Gemini 2.5 Pro
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Uncut repository ingestion, deep multi-file reasoning, and zero document truncation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold text-purple-700 dark:text-purple-300">
            {tokensInMillions}M / 2.0M tokens used
          </span>
          <span className="text-neutral-400 text-[11px]">
            ({remainingTokensM}M available)
          </span>
        </div>
      </div>

      {/* Progress meter bar */}
      <div className="space-y-1">
        <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700/80 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-400 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(1, percentage)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
          <span>0.00M (Start)</span>
          <span className="text-purple-600 dark:text-purple-400 font-semibold">
            {totalTokens.toLocaleString()} Active Tokens ({percentage.toFixed(2)}% of 2.0M)
          </span>
          <span>2.00M (Infinite Capacity)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
        <div className="p-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <div className="text-[10px]">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">Zero Slicing</span>
            <span className="text-neutral-400">Raw document ingestion</span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <div className="text-[10px]">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">Codebase Analysis</span>
            <span className="text-neutral-400">Full repo cross-reference</span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <div className="text-[10px]">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">Multi-File Reasoning</span>
            <span className="text-neutral-400">{projectFilesCount} files synchronized</span>
          </div>
        </div>
      </div>
    </div>
  );
};

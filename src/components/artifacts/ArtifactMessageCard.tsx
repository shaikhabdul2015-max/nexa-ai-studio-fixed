import React, { useState } from "react";
import { LiveArtifact } from "../../types";
import {
  Sparkles,
  Eye,
  Code2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Play,
  Layers,
} from "lucide-react";

interface ArtifactMessageCardProps {
  artifact: LiveArtifact;
  isActive: boolean;
  onOpenInCanvas: (art: LiveArtifact, tab?: "preview" | "code") => void;
}

export const ArtifactMessageCard: React.FC<ArtifactMessageCardProps> = ({
  artifact,
  isActive,
  onOpenInCanvas,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(artifact.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = artifact.code.split("\n").length;

  return (
    <div
      onClick={() => onOpenInCanvas(artifact, "preview")}
      className={`my-3 rounded-2xl border transition-all cursor-pointer overflow-hidden group shadow-xs ${
        isActive
          ? "border-purple-500/80 bg-purple-500/5 dark:bg-purple-950/20 shadow-purple-500/10"
          : "border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-850 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md"
      }`}
    >
      {/* Top Banner */}
      <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isActive
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 group-hover:bg-purple-600 group-hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                {artifact.title}
              </span>
              {isActive && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                  Active in Canvas
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
              <span className="uppercase">{artifact.type}</span>
              <span>·</span>
              <span>{lineCount} lines</span>
              <span>·</span>
              <span className="text-purple-600 dark:text-purple-400 font-sans group-hover:underline">
                Click to open interactive preview →
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onOpenInCanvas(artifact, "preview")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition-colors"
            title="Open Live Preview in Canvas"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            onClick={() => onOpenInCanvas(artifact, "code")}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Inspect & Edit Code in Canvas"
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowCode(!showCode)}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={showCode ? "Hide raw code" : "View raw code"}
          >
            {showCode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Raw Code Preview inside message */}
      {showCode && (
        <div
          className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-900 text-neutral-200 p-3 text-xs font-mono max-h-56 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <pre className="whitespace-pre overflow-x-auto leading-relaxed">
            <code>{artifact.code}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

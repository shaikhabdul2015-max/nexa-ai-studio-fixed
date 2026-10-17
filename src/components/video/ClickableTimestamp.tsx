import React from "react";
import { useApp } from "../../context/AppContext";
import { Play, Film } from "lucide-react";

export function parseTimestampToSeconds(ts: string): number {
  const clean = ts.replace(/[\[\]]/g, "").trim();
  const parts = clean.split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => isNaN(n))) return 0;

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

interface ClickableTimestampProps {
  timestamp: string; // e.g. "04:12" or "[04:12]"
  label?: string;
  className?: string;
}

export const ClickableTimestamp: React.FC<ClickableTimestampProps> = ({
  timestamp,
  label,
  className = "",
}) => {
  const { jumpToTimestamp, isVideoPlayerOpen, setIsVideoPlayerOpen } = useApp();
  const rawTs = timestamp.replace(/[\[\]]/g, "").trim();
  const seconds = parseTimestampToSeconds(rawTs);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    jumpToTimestamp(seconds, `[${rawTs}] ${label || ""}`);
    if (!isVideoPlayerOpen) {
      setIsVideoPlayerOpen(true);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Jump to frame ${rawTs} in video player`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-lg bg-purple-600/15 hover:bg-purple-600 text-purple-700 dark:text-purple-300 hover:text-white border border-purple-500/30 hover:border-purple-600 font-mono text-xs font-bold transition-all shadow-2xs cursor-pointer group/ts align-baseline ${className}`}
    >
      <Play className="w-2.5 h-2.5 fill-current text-purple-600 dark:text-purple-400 group-hover/ts:text-white transition-colors" />
      <span>[{rawTs}]</span>
    </button>
  );
};

/**
 * Helper to scan a text node or string and replace [MM:SS], [HH:MM:SS], or timestamp patterns with ClickableTimestamp elements.
 */
export function renderTextWithClickableTimestamps(text: string): React.ReactNode[] {
  // Matches [MM:SS], [HH:MM:SS], or (MM:SS) or isolated MM:SS timestamps like 04:12
  const regex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]|(?:\b(\d{1,2}:\d{2}(?::\d{2})?)\b)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }
    const ts = match[1] || match[2];
    parts.push(
      <ClickableTimestamp key={`ts-${matchIndex}-${ts}`} timestamp={ts} />
    );
    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "../../context/AppContext";
import { VideoTimelineMarker } from "../../types";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  X,
  Film,
  Sparkles,
  Clock,
  List,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Bookmark,
  Share2,
  Check,
} from "lucide-react";

function formatSeconds(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

interface InteractiveTimelinePlayerProps {
  onClose?: () => void;
  onAskAboutFrame?: (timestamp: string, time: number) => void;
  compact?: boolean;
}

export const InteractiveTimelinePlayer: React.FC<InteractiveTimelinePlayerProps> = ({
  onClose,
  onAskAboutFrame,
  compact = false,
}) => {
  const {
    activeVideo,
    videoSeekRequest,
    setIsVideoPlayerOpen,
    setCurrentSection,
    addNotification,
  } = useApp();

  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(activeVideo?.duration || 360);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showChapters, setShowChapters] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [copiedTimestamp, setCopiedTimestamp] = useState<string | null>(null);
  const [activeMarkerHover, setActiveMarkerHover] = useState<VideoTimelineMarker | null>(null);

  // Handle external seek requests (e.g. from clicking [04:12] in chat)
  useEffect(() => {
    if (videoSeekRequest && videoRef.current) {
      videoRef.current.currentTime = videoSeekRequest.seconds;
      setCurrentTime(videoSeekRequest.seconds);
      if (videoSeekRequest.autoPlay) {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay might be muted in some browsers
          });
      }
    }
  }, [videoSeekRequest]);

  // Update duration when metadata loads
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const vidDuration = videoRef.current.duration;
      if (!isNaN(vidDuration) && vidDuration > 0) {
        setDuration(vidDuration);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn("Playback error:", err));
    }
  }, [isPlaying]);

  const seekRelative = (deltaSeconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + deltaSeconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const seekTo = (seconds: number, autoPlay: boolean = true) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    setCurrentTime(seconds);
    if (autoPlay) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !videoRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = ratio * duration;
    seekTo(targetSeconds);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
    setHoverPosition(ratio * 100);
    setHoverTime(ratio * duration);
  };

  const handleTimelineMouseLeave = () => {
    setHoverTime(null);
    setActiveMarkerHover(null);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMute = !isMuted;
    setIsMuted(newMute);
    videoRef.current.muted = newMute;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const cyclePlaybackSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
  };

  const handleCopyCurrentTimestamp = () => {
    const ts = formatSeconds(currentTime);
    navigator.clipboard.writeText(`[${ts}]`);
    setCopiedTimestamp(ts);
    addNotification("Timestamp Copied", `Copied [${ts}] to clipboard`, "system");
    setTimeout(() => setCopiedTimestamp(null), 2000);
  };

  const handleAskAboutCurrentFrame = () => {
    const ts = formatSeconds(currentTime);
    if (onAskAboutFrame) {
      onAskAboutFrame(ts, currentTime);
    } else {
      setCurrentSection("chat");
      addNotification("Video Frame", `Ask about [${ts}] in the chat prompt`, "system");
    }
  };

  if (!activeVideo) {
    return null;
  }

  const markers = activeVideo.markers || [];
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Find currently active chapter
  const currentChapter = [...markers]
    .reverse()
    .find((m) => currentTime >= m.time) || markers[0];

  return (
    <div className="bg-neutral-900 text-white rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col h-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-950 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
            <Film className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-semibold text-white truncate max-w-xs md:max-w-md">
                {activeVideo.name}
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold uppercase border border-purple-500/30 shrink-0">
                MP4 Video
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 truncate mt-0.5">
              Current Scene: <span className="text-purple-300 font-medium">{currentChapter?.label || "Playback"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Ask AI about this frame button */}
          <button
            onClick={handleAskAboutCurrentFrame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            title="Ask AI in Chat about what happens at this frame"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI at</span>
            <span className="font-mono">[{formatSeconds(currentTime)}]</span>
          </button>

          {/* Toggle chapters list */}
          <button
            onClick={() => setShowChapters(!showChapters)}
            className={`p-2 rounded-xl transition-colors ${
              showChapters ? "bg-neutral-800 text-purple-400" : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
            }`}
            title="Toggle Scene / Chapter Index"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Close Player */}
          {onClose ? (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
              title="Close Video Player"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setIsVideoPlayerOpen(false)}
              className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
              title="Close Video Player"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Video Screen + Chapter Sidebar */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden bg-black">
        {/* Video Canvas Container */}
        <div className="relative flex-1 min-h-[260px] md:min-h-0 flex items-center justify-center bg-neutral-950 overflow-hidden group">
          <video
            ref={videoRef}
            src={activeVideo.url}
            className="w-full h-full object-contain max-h-[55vh] md:max-h-full"
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
            playsInline
          />

          {/* Big Center Play Overlay when paused */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/60 backdrop-blur-xs text-white flex items-center justify-center hover:scale-110 hover:bg-purple-600 transition-all shadow-xl cursor-pointer"
            >
              <Play className="w-7 h-7 fill-current ml-1" />
            </button>
          )}

          {/* Current Frame Timestamp HUD Badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs border border-white/10 font-mono text-xs text-white font-bold flex items-center gap-1.5 shadow-md pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{formatSeconds(currentTime)}</span>
            <span className="text-neutral-500">/</span>
            <span className="text-neutral-400">{formatSeconds(duration)}</span>
          </div>

          {/* Copy timestamp HUD */}
          <button
            onClick={handleCopyCurrentTimestamp}
            className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/70 hover:bg-neutral-800 backdrop-blur-xs border border-white/10 font-mono text-[11px] text-neutral-300 hover:text-white flex items-center gap-1 transition-colors"
            title="Copy frame timestamp tag"
          >
            {copiedTimestamp ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3 h-3 text-purple-400" />
                <span>Copy Frame</span>
              </>
            )}
          </button>
        </div>

        {/* Scene / Chapter Index Drawer (Split Panel) */}
        {showChapters && markers.length > 0 && (
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-neutral-800 bg-neutral-900/95 flex flex-col shrink-0 max-h-48 md:max-h-full overflow-hidden">
            <div className="px-3.5 py-2.5 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Timeline Chapters ({markers.length})</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">
                Click to jump
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
              {markers.map((marker, idx) => {
                const isCurrent = currentChapter?.time === marker.time;
                const isHighlight = marker.timestamp === "04:12";

                return (
                  <button
                    key={idx}
                    onClick={() => seekTo(marker.time, true)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                      isCurrent
                        ? "bg-purple-950/40 border-purple-500/60 text-white shadow-sm ring-1 ring-purple-500/30"
                        : "bg-neutral-850/60 hover:bg-neutral-800 border-neutral-800/80 text-neutral-300 hover:text-white"
                    } ${isHighlight ? "border-amber-500/40" : ""}`}
                  >
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        isCurrent
                          ? "bg-purple-600 text-white"
                          : isHighlight
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-neutral-800 text-purple-400"
                      }`}
                    >
                      {marker.timestamp}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-xs text-white truncate">
                          {marker.label}
                        </p>
                        {isHighlight && (
                          <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1 rounded uppercase font-bold">
                            Key Demo
                          </span>
                        )}
                      </div>
                      {marker.description && (
                        <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5 leading-snug">
                          {marker.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Interactive Visual Timeline Scrubber & Playback Controls */}
      <div className="p-3 sm:p-4 bg-neutral-950 border-t border-neutral-800 space-y-3 shrink-0">
        {/* Timeline Visual Track with Keyframe Pins & Waveform Simulation */}
        <div className="space-y-1.5">
          <div
            ref={timelineRef}
            onClick={handleTimelineClick}
            onMouseMove={handleTimelineMouseMove}
            onMouseLeave={handleTimelineMouseLeave}
            className="relative w-full h-8 flex items-center cursor-pointer group select-none"
          >
            {/* Background Track with Waveform Simulation */}
            <div className="absolute inset-x-0 h-4 bg-neutral-800 rounded-lg overflow-hidden flex items-center justify-between px-1 pointer-events-none">
              {/* Simulated visual audio/scene waveform ticks */}
              {Array.from({ length: 48 }).map((_, i) => {
                const heightPercent = 20 + Math.sin(i * 0.8) * 35 + ((i % 5 === 0) ? 35 : 10);
                return (
                  <div
                    key={i}
                    className="w-0.5 bg-neutral-700/60 rounded-full"
                    style={{ height: `${heightPercent}%` }}
                  />
                );
              })}
            </div>

            {/* Played Progress Bar */}
            <div
              className="absolute left-0 top-2 h-4 bg-gradient-to-r from-purple-600 to-indigo-500 rounded-l-lg pointer-events-none transition-all duration-75"
              style={{ width: `${progressPercent}%` }}
            />

            {/* Scrubber Thumb Knob */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-purple-600 pointer-events-none transition-all duration-75 scale-90 group-hover:scale-125"
              style={{ left: `calc(${progressPercent}% - 8px)` }}
            />

            {/* Marker Pins along the timeline */}
            {markers.map((marker, idx) => {
              const markerPos = duration > 0 ? (marker.time / duration) * 100 : 0;
              const isPast = currentTime >= marker.time;
              const isSelected = currentChapter?.time === marker.time;
              const isHighlight = marker.timestamp === "04:12";

              return (
                <div
                  key={idx}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 group/pin"
                  style={{ left: `${markerPos}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    seekTo(marker.time, true);
                  }}
                  onMouseEnter={() => setActiveMarkerHover(marker)}
                >
                  <div
                    className={`w-3 h-3 rounded-full border-2 transition-all transform hover:scale-150 ${
                      isHighlight
                        ? "bg-amber-400 border-white shadow-amber-500/50 shadow-md"
                        : isSelected
                        ? "bg-purple-400 border-white shadow-sm"
                        : isPast
                        ? "bg-purple-300 border-neutral-900"
                        : "bg-neutral-400 border-neutral-900"
                    }`}
                  />

                  {/* Marker hover tooltip popup */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/pin:flex flex-col items-center pointer-events-none z-30 min-w-[140px]">
                    <div className="bg-neutral-900 border border-neutral-700 text-white rounded-xl p-2 shadow-2xl text-center space-y-0.5">
                      <span className="font-mono text-[11px] font-bold text-purple-400">
                        [{marker.timestamp}]
                      </span>
                      <p className="text-xs font-semibold text-white leading-tight">
                        {marker.label}
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-neutral-900 border-r border-b border-neutral-700 rotate-45 -mt-1" />
                  </div>
                </div>
              );
            })}

            {/* Hover Tooltip showing timestamp on hover */}
            {hoverTime !== null && (
              <div
                className="absolute bottom-full mb-1 pointer-events-none -translate-x-1/2 z-20"
                style={{ left: `${hoverPosition}%` }}
              >
                <div className="px-2 py-1 rounded-md bg-neutral-800 text-white font-mono text-[11px] font-bold shadow-lg border border-neutral-700 whitespace-nowrap">
                  {formatSeconds(hoverTime)}
                </div>
              </div>
            )}
          </div>

          {/* Timeline labels under the scrubber */}
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 px-0.5">
            <span>00:00</span>
            <div className="flex items-center gap-1.5 text-purple-300">
              <span className="font-bold">{formatSeconds(currentTime)}</span>
              <span className="text-neutral-500">/</span>
              <span>{formatSeconds(duration)}</span>
            </div>
            <span>{formatSeconds(duration)}</span>
          </div>
        </div>

        {/* Playback Control Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Left: Playback controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => seekRelative(-5)}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
              title="Rewind 5 seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="p-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-md flex items-center justify-center cursor-pointer"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => seekRelative(5)}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
              title="Forward 5 seconds"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume slider */}
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1.5 accent-purple-500 rounded-lg cursor-pointer bg-neutral-800"
              />
            </div>
          </div>

          {/* Right: Quick actions & Speed */}
          <div className="flex items-center gap-2">
            {/* Direct jump to 04:12 shortcut button */}
            <button
              onClick={() => seekTo(252, true)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-mono font-semibold transition-all cursor-pointer"
              title="Jump to frame 04:12"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Jump [04:12]</span>
            </button>

            {/* Playback speed toggle */}
            <button
              onClick={cyclePlaybackSpeed}
              className="px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-medium transition-colors"
              title="Playback speed"
            >
              {playbackSpeed}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

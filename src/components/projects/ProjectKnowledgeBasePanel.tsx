import React, { useState, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { Project, ProjectFile } from "../../types";
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  Check,
  X,
  Eye,
  BookOpen,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Copy,
  Brain,
  MessageSquare,
  AlertCircle,
  FileCode,
  Loader2,
  ChevronRight,
  Maximize2,
  Film,
  Play,
  Clock,
  Video,
} from "lucide-react";
import { InteractiveTimelinePlayer } from "../video/InteractiveTimelinePlayer";
import { TokenUsageMeter } from "./TokenUsageMeter";

interface ProjectKnowledgeBasePanelProps {
  project: Project;
  onClose?: () => void;
  compact?: boolean;
}

export const ProjectKnowledgeBasePanel: React.FC<ProjectKnowledgeBasePanelProps> = ({
  project,
  onClose,
  compact = false,
}) => {
  const {
    uploadProjectFiles,
    addProjectTextDocument,
    updateProjectGuidelines,
    toggleProjectFile,
    deleteProjectFile,
    createNewConversation,
    selectProject,
    setCurrentSection,
    addNotification,
    activeVideo,
    setActiveVideo,
    setIsVideoPlayerOpen,
    seekVideoTo,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingGuidelines, setIsEditingGuidelines] = useState(false);
  const [showEmbeddedPlayer, setShowEmbeddedPlayer] = useState(true);
  const [guidelinesInput, setGuidelinesInput] = useState(
    project.instructions || project.guidelines || ""
  );

  // Add custom text document modal state
  const [isAddTextModalOpen, setIsAddTextModalOpen] = useState(false);
  const [textDocTitle, setTextDocTitle] = useState("");
  const [textDocContent, setTextDocContent] = useState("");
  const [textDocCategory, setTextDocCategory] = useState("Custom Guideline");

  // Inspect document modal state
  const [inspectedFile, setInspectedFile] = useState<ProjectFile | null>(null);
  const [copiedInspected, setCopiedInspected] = useState(false);

  // Calculate active knowledge metrics
  const activeFiles = (project.files || []).filter((f) => f.enabled !== false);
  const totalWords = (project.files || []).reduce(
    (acc, f) => acc + (f.wordCount || (f.content ? (f.content.match(/\S+/g) || []).length : 0)),
    0
  );
  const totalEstimatedTokens = (project.files || []).reduce(
    (acc, f) => acc + (f.tokenEstimate || (f.content ? Math.ceil(f.content.length / 4) : 0)),
    0
  );

  // 2M Infinite Context window budget (Gemini 2.5 Pro Engine)
  const MAX_TOKEN_BUDGET = 2000000;
  const budgetPercentage = Math.min(
    100,
    parseFloat(((totalEstimatedTokens / MAX_TOKEN_BUDGET) * 100).toFixed(2))
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const fileArray = Array.from(files);
      await uploadProjectFiles(project.id, fileArray);
      addNotification(
        "Knowledge Base Updated",
        `Successfully indexed ${fileArray.length} document(s) into ${project.name}.`,
        "success"
      );
    } catch (err: any) {
      addNotification("Upload Failed", err.message || "Failed to process files", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveGuidelines = async () => {
    try {
      await updateProjectGuidelines(project.id, guidelinesInput.trim());
      setIsEditingGuidelines(false);
      addNotification(
        "Guidelines Saved",
        "Project system instructions have been updated for all future chat sessions.",
        "success"
      );
    } catch (err: any) {
      addNotification("Failed to Save", err.message, "error");
    }
  };

  const handleAddTextDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textDocTitle.trim() || !textDocContent.trim()) return;

    try {
      await addProjectTextDocument(
        project.id,
        textDocTitle.trim(),
        textDocContent.trim(),
        textDocCategory
      );
      setIsAddTextModalOpen(false);
      setTextDocTitle("");
      setTextDocContent("");
      addNotification(
        "Document Added",
        `Created and indexed "${textDocTitle}" in project knowledge base.`,
        "success"
      );
    } catch (err: any) {
      addNotification("Error", err.message, "error");
    }
  };

  const handleToggleFile = async (fileId: string, currentEnabled: boolean = true) => {
    await toggleProjectFile(project.id, fileId, !currentEnabled);
  };

  const handleDeleteFile = async (file: ProjectFile) => {
    if (confirm(`Remove "${file.name}" from ${project.name}'s knowledge base?`)) {
      await deleteProjectFile(project.id, file.id);
      addNotification("File Removed", `Removed ${file.name} from project context.`, "info");
    }
  };

  const handleStartChatInProject = () => {
    selectProject(project.id);
    createNewConversation("gemini-3.8-flash", project.id);
    setCurrentSection("chat");
    if (onClose) onClose();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const fileArray = Array.from(files);
      await uploadProjectFiles(project.id, fileArray);
      addNotification(
        "Knowledge Base Updated",
        `Successfully indexed ${fileArray.length} file(s) including video/documents into ${project.name}.`,
        "success"
      );
    } catch (err: any) {
      addNotification("Upload Failed", err.message || "Failed to process files", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const getFileBadgeColor = (type: string, name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (type.includes("video") || ext === "mp4") return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
    if (type.includes("pdf") || ext === "pdf") return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    if (type.includes("markdown") || ext === "md") return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    if (type.includes("typescript") || ext === "ts" || ext === "tsx") return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
    if (type.includes("javascript") || ext === "js" || ext === "jsx") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    if (type.includes("python") || ext === "py") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    return "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20";
  };

  const handleLaunchVideoPlayer = (file: ProjectFile) => {
    setActiveVideo({
      id: file.id,
      name: file.name,
      url: file.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      duration: file.duration || 360,
      currentTime: 0,
      isPlaying: true,
      markers: file.timelineMarkers || [
        { time: 0, timestamp: "00:00", label: "Runtime Overview", description: "Scene opening" },
        { time: 45, timestamp: "00:45", label: "State Checkpoints", description: "Memory engine" },
        { time: 90, timestamp: "01:30", label: "Streaming SSE", description: "Event stream" },
        { time: 165, timestamp: "02:45", label: "Tool Permission Guardrails", description: "Security prompt" },
        { time: 252, timestamp: "04:12", label: "Live Artifact Canvas Demo", description: "Compilation & live execution" },
        { time: 330, timestamp: "05:30", label: "Performance Telemetry", description: "Workflow completion" },
      ],
      fileId: file.id,
      projectId: project.id,
    });
    setIsVideoPlayerOpen(true);
    setShowEmbeddedPlayer(true);
    addNotification("Video Loaded", `Opened interactive timeline player for ${file.name}`, "system");
  };

  return (
    <div
      id={`project-kb-panel-${project.id}`}
      className={`flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-xs ${
        compact ? "p-4 space-y-4" : "p-6 md:p-8 space-y-6"
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white">
                {project.name}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                {project.category}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Claude-style Project Knowledge Base & Persistent Guidelines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleStartChatInProject}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat in Project</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2M Infinite Context Memory Engine Token Meter */}
      <TokenUsageMeter
        totalTokens={totalEstimatedTokens}
        projectFilesCount={activeFiles.length}
        variant="panel"
      />

      {/* Section 1: Project Custom Guidelines / System Instructions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Custom Instructions & Guidelines
            </h3>
          </div>
          {!isEditingGuidelines ? (
            <button
              onClick={() => {
                setGuidelinesInput(project.instructions || project.guidelines || "");
                setIsEditingGuidelines(true);
              }}
              className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
            >
              Edit Guidelines
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingGuidelines(false)}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGuidelines}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold"
              >
                <Check className="w-3 h-3" />
                <span>Save</span>
              </button>
            </div>
          )}
        </div>

        {isEditingGuidelines ? (
          <div className="space-y-2">
            <textarea
              value={guidelinesInput}
              onChange={(e) => setGuidelinesInput(e.target.value)}
              placeholder="Define project tone, coding standards, architecture rules, domain terminology, or step-by-step procedures for the AI to enforce across all chat sessions..."
              rows={5}
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            <p className="text-[11px] text-neutral-400">
              These guidelines will be strictly injected into the system prompt for every message in this project.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 text-xs text-neutral-700 dark:text-neutral-300 font-mono leading-relaxed whitespace-pre-wrap">
            {project.instructions || project.guidelines || (
              <span className="text-neutral-400 italic">
                No custom guidelines specified yet. Click "Edit Guidelines" to define project-specific instructions, coding rules, or constraints.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Uploaded Knowledge Files */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Knowledge Base Documents ({project.files.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Add raw text document button */}
            <button
              onClick={() => setIsAddTextModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700/80 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Text Note</span>
            </button>

            {/* Upload file button */}
            <label
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity ${
                isUploading ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Indexing Video & Docs...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Files (PDF / Docs / MP4 Video)</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.md,.markdown,.ts,.tsx,.js,.jsx,.py,.json,.csv,.html,.css,.mp4,video/mp4"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        {/* Embedded Interactive Visual Timeline Player if a video is active for this project */}
        {activeVideo && (activeVideo.projectId === project.id || project.files.some(f => f.id === activeVideo.fileId)) && showEmbeddedPlayer && (
          <div className="rounded-3xl border border-purple-500/30 overflow-hidden shadow-xl">
            <div className="bg-purple-950/40 border-b border-purple-500/30 px-4 py-2 flex items-center justify-between text-xs text-purple-300">
              <div className="flex items-center gap-2 font-semibold">
                <Film className="w-4 h-4 text-purple-400" />
                <span>Interactive Workspace Timeline Player</span>
              </div>
              <button
                onClick={() => setShowEmbeddedPlayer(false)}
                className="text-neutral-400 hover:text-white text-[11px]"
              >
                Hide Embedded
              </button>
            </div>
            <div className="h-[420px]">
              <InteractiveTimelinePlayer
                onClose={() => setShowEmbeddedPlayer(false)}
                onAskAboutFrame={(ts) => {
                  selectProject(project.id);
                  createNewConversation("gemini-3.8-flash", project.id);
                  setCurrentSection("chat");
                  addNotification("Chat Prompt", `Frame [${ts}] ready to query in Chat`, "system");
                }}
              />
            </div>
          </div>
        )}

        {/* File Drag & Drop / Empty State */}
        {project.files.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`p-8 rounded-3xl border-2 border-dashed transition-all text-center cursor-pointer space-y-2 ${
              isDragOver
                ? "border-purple-500 bg-purple-500/10 scale-[1.01]"
                : "border-neutral-300 dark:border-neutral-700 hover:border-purple-500/50 bg-neutral-50/50 dark:bg-neutral-800/30"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-purple-500 mx-auto flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Drop documents or MP4 video recordings here
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
              Accepts <strong>MP4 videos</strong>, PDF whitepapers, markdown guidelines, source code, specifications, and data.
              Videos are indexed with interactive visual timeline markers and clickable frame timestamps.
            </p>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`grid grid-cols-1 gap-2.5 p-1 rounded-2xl transition-colors ${
              isDragOver ? "ring-2 ring-purple-500 bg-purple-500/5" : ""
            }`}
          >
            {project.files.map((file) => {
              const isEnabled = file.enabled !== false;
              const isVideo = file.type.includes("video") || file.name.toLowerCase().endsWith(".mp4") || !!file.videoUrl;
              const badgeClass = getFileBadgeColor(file.type, file.name);

              return (
                <div
                  key={file.id}
                  id={`kb-file-${file.id}`}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isEnabled
                      ? "bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 shadow-2xs"
                      : "bg-neutral-50/50 dark:bg-neutral-900/40 border-neutral-200/50 dark:border-neutral-800/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleFile(file.id, isEnabled)}
                      title={isEnabled ? "Included in chat context (Click to disable)" : "Excluded from chat context (Click to enable)"}
                      className="text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors shrink-0"
                    >
                      {isEnabled ? (
                        <ToggleRight className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-neutral-400" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {isVideo && <Film className="w-4 h-4 text-purple-500 shrink-0" />}
                        <p className="font-semibold text-xs md:text-sm text-neutral-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md border shrink-0 ${badgeClass}`}
                        >
                          {file.category || (isVideo ? "MP4 Video" : file.name.endsWith(".pdf") ? "PDF" : "Doc")}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400 font-mono mt-0.5">
                        <span>{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                        {isVideo && file.duration && (
                          <>
                            <span>•</span>
                            <span className="text-purple-400 font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              06:00 (360s)
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{file.wordCount || (file.content ? (file.content.match(/\S+/g) || []).length : 0)} words</span>
                        <span>•</span>
                        <span>~{file.tokenEstimate || (file.content ? Math.ceil(file.content.length / 4) : 0)} tokens</span>
                        <span>•</span>
                        <span>Indexed {new Date(file.uploadedAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* If Video, show launch player button */}
                    {isVideo && (
                      <button
                        onClick={() => handleLaunchVideoPlayer(file)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        title="Open interactive visual timeline player"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span className="hidden sm:inline">Timeline Player</span>
                      </button>
                    )}

                    {/* View/Inspect Content button */}
                    <button
                      onClick={() => setInspectedFile(file)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Inspect Extracted Content & Timestamps"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteFile(file)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete from Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Text Guideline / Snippet Modal */}
      {isAddTextModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-600" />
                <span>Add Text Guideline / Knowledge Note</span>
              </h3>
              <button
                onClick={() => setIsAddTextModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTextDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Coding Convention Standards, API Auth Specs"
                  value={textDocTitle}
                  onChange={(e) => setTextDocTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Category / Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g., Architecture, Legal, Policy, Data Dictionary"
                  value={textDocCategory}
                  onChange={(e) => setTextDocCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Content (Markdown / Plain Text / Code)
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder="Paste rules, design guidelines, code snippets, or notes..."
                  value={textDocContent}
                  onChange={(e) => setTextDocContent(e.target.value)}
                  className="w-full p-3 text-xs font-mono rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddTextModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
                >
                  Index into Knowledge Base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Document Content Modal */}
      {inspectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                    {inspectedFile.name}
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    {(inspectedFile.size / 1024).toFixed(1)} KB • {inspectedFile.wordCount || 0} words • ~{inspectedFile.tokenEstimate || 0} tokens
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inspectedFile.content || "");
                    setCopiedInspected(true);
                    setTimeout(() => setCopiedInspected(false), 2000);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
                >
                  {copiedInspected ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setInspectedFile(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
              {inspectedFile.content || "[No extracted text found for this document.]"}
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-xs text-neutral-400 shrink-0">
              <span>This document text is automatically injected into the AI context for this project.</span>
              <button
                onClick={() => setInspectedFile(null)}
                className="px-4 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

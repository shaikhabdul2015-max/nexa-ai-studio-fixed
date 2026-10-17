import React, { useState, useRef, useEffect, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import {
  Send,
  Square,
  Sparkles,
  Paperclip,
  Image as ImageIcon,
  Mic,
  Copy,
  Check,
  RotateCw,
  Edit2,
  Trash2,
  Pin,
  Archive,
  Share2,
  ChevronDown,
  Brain,
  X,
  FileText,
  Search,
  ExternalLink,
  Code,
  Terminal,
  Columns,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeft,
  Eye,
  Layers,
  Sparkle,
  FolderKanban,
  BookOpen,
  Film,
  Play,
  Clock,
  Video,
} from "lucide-react";
import { ChatAttachment, ChatMessage, AIModel, LiveArtifact } from "../../types";
import { sendChatStream, sendReasoningRequest } from "../../services/api";
import { extractArtifactsFromText, STARTER_ARTIFACTS } from "../../utils/artifactExtractor";
import { LiveArtifactCanvas } from "../artifacts/LiveArtifactCanvas";
import { ArtifactMessageCard } from "../artifacts/ArtifactMessageCard";
import { ProjectKnowledgeBasePanel } from "../projects/ProjectKnowledgeBasePanel";
import { TokenUsageMeter } from "../projects/TokenUsageMeter";
import { ClickableTimestamp, renderTextWithClickableTimestamps } from "../video/ClickableTimestamp";
import { InteractiveTimelinePlayer } from "../video/InteractiveTimelinePlayer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const ChatView: React.FC = () => {
  const {
    t,
    conversations,
    currentConversationId,
    currentConversation,
    createNewConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
    pinConversation,
    archiveConversation,
    addMessageToConversation,
    updateLastMessageContent,
    trackUsage,
    addNotification,
    currentProjectId,
    selectProject,
    projects,
    memories,
    memoryEnabled,
    activeVideo,
    setActiveVideo,
    isVideoPlayerOpen,
    setIsVideoPlayerOpen,
    seekVideoTo,
    jumpToTimestamp,
  } = useApp();

  const [inputPrompt, setInputPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-pro");
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Project Knowledge Base State
  const [isProjectKnowledgeModalOpen, setIsProjectKnowledgeModalOpen] = useState(false);
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);

  // Active project resolution
  const activeProjectId = currentConversation?.projectId || currentProjectId;
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const activeProjectFiles = (activeProject?.files || []).filter((f) => f.enabled !== false);
  const projectVideoFiles = (activeProject?.files || []).filter(
    (f) => f.type.includes("video") || f.name.toLowerCase().endsWith(".mp4") || !!f.videoUrl
  );

  // 2M Infinite Context Memory Engine token calculations (Gemini 2.5 Pro)
  const conversationTokens = (currentConversation?.messages || []).reduce(
    (acc, m) => acc + Math.ceil((m.content || "").length / 3.8),
    0
  );
  const projectTokens = (activeProjectFiles || []).reduce(
    (acc, f) => acc + (f.tokenEstimate || (f.content ? Math.ceil(f.content.length / 3.8) : 0)),
    0
  );
  // Total in-memory tokens: base system instructions + conversation + active files
  const totalMemoryTokens = conversationTokens + projectTokens + (activeProject ? 2500 : 800);

  // Helper to parse timestamps within ReactMarkdown text
  const transformChildrenWithTimestamps = (children: React.ReactNode): React.ReactNode => {
    if (typeof children === "string") {
      return renderTextWithClickableTimestamps(children);
    }
    if (Array.isArray(children)) {
      return children.map((child, idx) => {
        if (typeof child === "string") {
          return <React.Fragment key={idx}>{renderTextWithClickableTimestamps(child)}</React.Fragment>;
        }
        return child;
      });
    }
    return children;
  };

  // Live Artifacts Split-Screen Canvas State
  const [isCanvasOpen, setIsCanvasOpen] = useState(true);
  const [canvasWidthRatio, setCanvasWidthRatio] = useState<number>(50); // percentage for canvas (40, 50, 60)
  const [activeArtifact, setActiveArtifact] = useState<LiveArtifact | null>(null);
  const [isCanvasExpanded, setIsCanvasExpanded] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "canvas" | "stacked">("chat");
  const [customArtifacts, setCustomArtifacts] = useState<Record<string, LiveArtifact>>({});

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const prevArtifactIdsRef = useRef<Set<string>>(new Set());

  const availableModels: AIModel[] = [
    {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      category: "Infinite Context",
      description: "2.0M token infinite context memory engine for raw multi-file reasoning & repo analysis",
      badge: "2M Context",
    },
    {
      id: "gemini-3.8-flash",
      name: "Gemini 3.8 Flash",
      category: "Vision",
      description: "Advanced multimodal vision and context synthesis",
      badge: "Fastest",
    },
    {
      id: "gemini-3.1-pro-preview",
      name: "Gemini 3.1 Pro",
      category: "Reasoning",
      description: "Deep cognitive reasoning, math, and STEM architecture",
      badge: "Deep Think",
    },
    {
      id: "gemini-3.1-flash-lite",
      name: "Gemini 3.1 Flash Lite",
      category: "Fast",
      description: "Ultra-fast response with high throughput",
    },
  ];

  // Extract all artifacts from messages in the current conversation
  const extractedArtifacts = useMemo(() => {
    if (!currentConversation?.messages) return [];
    const arts: LiveArtifact[] = [];

    for (const msg of currentConversation.messages) {
      if (msg.role === "model" && msg.content) {
        const found = extractArtifactsFromText(msg.content, currentConversation.id, msg.id);
        arts.push(...found);
      }
    }

    // Merge any user custom modified artifacts
    return arts.map((a) => (customArtifacts[a.id] ? { ...customArtifacts[a.id] } : a));
  }, [currentConversation?.messages, currentConversation?.id, customArtifacts]);

  // Combine extracted artifacts with starter samples so user always has artifacts available
  const allAvailableArtifacts = useMemo(() => {
    const combined = [...extractedArtifacts];
    for (const starter of STARTER_ARTIFACTS) {
      if (!combined.some((a) => a.id === starter.id)) {
        combined.push(customArtifacts[starter.id] || starter);
      }
    }
    return combined;
  }, [extractedArtifacts, customArtifacts]);

  // Auto-detect new artifacts and select them into the Canvas
  useEffect(() => {
    if (extractedArtifacts.length > 0) {
      const currentIds = new Set(extractedArtifacts.map((a) => a.id));
      const newItems = extractedArtifacts.filter((a) => !prevArtifactIdsRef.current.has(a.id));

      if (newItems.length > 0) {
        const latest = newItems[newItems.length - 1];
        setActiveArtifact(latest);
        setIsCanvasOpen(true);
        // On smaller screens, configure responsive mode
        if (window.innerWidth < 1024) {
          if (window.innerWidth < 768) {
            setMobileTab("canvas");
          } else {
            setMobileTab("stacked");
          }
          addNotification("Live Artifact Ready", `"${latest.title}" is ready on the Canvas`, "info");
        }
      }

      prevArtifactIdsRef.current = currentIds;
    }
  }, [extractedArtifacts, addNotification]);

  // If no active artifact is chosen yet, choose the first available or starter
  useEffect(() => {
    if (!activeArtifact && allAvailableArtifacts.length > 0) {
      setActiveArtifact(allAvailableArtifacts[0]);
    }
  }, [allAvailableArtifacts, activeArtifact]);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, isGenerating]);

  // File uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 20 * 1024 * 1024) {
        addNotification("File Too Large", "Maximum file upload size is 20MB", "error");
        continue;
      }

      const reader = new FileReader();
      if (isImage || file.type.startsWith("image/")) {
        reader.readAsDataURL(file);
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              id: "att-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
              name: file.name,
              type: file.type || "image/png",
              size: file.size,
              base64: reader.result as string,
            },
          ]);
        };
      } else {
        reader.readAsText(file);
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              id: "att-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
              name: file.name,
              type: file.type || "text/plain",
              size: file.size,
              content: reader.result as string,
            },
          ]);
        };
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Voice Input via Web Speech API
  const handleVoiceToggle = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      addNotification("Voice Unavailable", "Web Speech API is not supported in this browser.", "warning");
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (isVoiceRecording) {
      setIsVoiceRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsVoiceRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputPrompt((prev) => (prev ? prev + " " + transcript : transcript));
      };
      recognition.onerror = () => setIsVoiceRecording(false);
      recognition.onend = () => setIsVoiceRecording(false);
      recognition.start();
    } catch {
      setIsVoiceRecording(false);
    }
  };

  // Send message
  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt !== undefined ? customPrompt : inputPrompt;
    if ((!promptToSend.trim() && attachments.length === 0) || isGenerating) return;

    const userMessageId = "msg-" + Date.now();
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: promptToSend,
      timestamp: new Date().toISOString(),
      attachments: [...attachments],
      model: selectedModel,
    };

    const effectiveProjectId = currentConversation?.projectId || currentProjectId || undefined;
    const targetConvId = currentConversationId || createNewConversation(selectedModel, effectiveProjectId);
    addMessageToConversation(targetConvId, userMessage);
    setInputPrompt("");
    const sentAttachments = [...attachments];
    setAttachments([]);
    setIsGenerating(true);
    trackUsage("message");

    // Construct enhanced system instruction empowering Claude-like Live Artifacts
    let systemInstruction = `You are NEXA AI, an advanced multimodal AI workspace assistant equipped with Claude-like Live Artifacts capabilities.
When the user asks you to build, create, or modify an interactive application, widget, web page, simulation, game, or component (React, HTML/CSS/JS, or SVG):
1. Create a complete, self-contained, high-quality, working artifact inside markdown code blocks (e.g., \`\`\`tsx title="Interactive Component Title"\`\`\` or \`\`\`html title="Application Title"\`\`\`).
2. Always make sure React components are completely functional, use standard hooks (useState, useEffect, useRef), and use Tailwind CSS for modern aesthetics.
3. For HTML/JS apps, include complete CSS and script logic.
4. Your code is extracted and rendered automatically in real time in the split-screen Interactive Canvas panel on the right with Code and Preview tabs. Avoid placeholders, truncated stubs, or TODO comments.`;

    if (effectiveProjectId) {
      const p = projects.find((proj) => proj.id === effectiveProjectId);
      if (p) {
        systemInstruction += `\n[Active Project Knowledge Base: ${p.name}]`;
        if (p.instructions || p.guidelines) {
          systemInstruction += `\n[Project Guidelines & Directives: ${p.instructions || p.guidelines}]`;
        }
      }
    }

    if (memoryEnabled && memories.length > 0) {
      const memContext = memories
        .filter((m) => m.enabled)
        .map((m) => `${m.key}: ${m.value}`)
        .join("; ");
      systemInstruction += `\n[Saved User Preferences/Memory: ${memContext}]`;
    }

    const modelToUse = reasoningEnabled ? "gemini-3.1-pro-preview" : selectedModel;

    const botMessageId = "msg-bot-" + Date.now();
    addMessageToConversation(targetConvId, {
      id: botMessageId,
      role: "model",
      content: "",
      timestamp: new Date().toISOString(),
      model: modelToUse,
      isStreaming: true,
    });

    if (reasoningEnabled) {
      try {
        const reasoningData = await sendReasoningRequest(
          promptToSend,
          sentAttachments.map((a) => a.content || a.name).join("\n")
        );
        updateLastMessageContent(targetConvId, reasoningData.reasoning || "", false);
        trackUsage("request", 800);
      } catch (err: any) {
        updateLastMessageContent(targetConvId, `\n\n**Error**: ${err.message || "Failed to complete reasoning."}`, false);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // Standard streaming chat
    abortControllerRef.current = new AbortController();
    const historyMessages = currentConversation ? [...currentConversation.messages, userMessage] : [userMessage];

    sendChatStream(
      historyMessages,
      modelToUse,
      systemInstruction,
      sentAttachments,
      {
        onChunk: (chunk: string) => {
          updateLastMessageContent(targetConvId, chunk, true);
        },
        onError: (err: string) => {
          updateLastMessageContent(targetConvId, `\n\n**Error**: ${err}`, false);
          setIsGenerating(false);
        },
        onDone: () => {
          updateLastMessageContent(targetConvId, "", false);
          setIsGenerating(false);
          trackUsage("request", 400);
        },
      },
      abortControllerRef.current.signal,
      effectiveProjectId
    );
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      updateLastMessageContent(currentConversationId, " *(Generation stopped)*", false);
    }
  };

  const handleRegenerate = () => {
    if (!currentConversation || currentConversation.messages.length === 0 || isGenerating) return;
    const lastUserMsg = [...currentConversation.messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = (msg: ChatMessage) => {
    if (navigator.share) {
      navigator.share({
        title: "NEXA AI Conversation",
        text: msg.content,
      }).catch(() => {});
    } else {
      handleCopyText(msg.id, msg.content);
      addNotification("Shared", "Conversation snippet copied to clipboard", "success");
    }
  };

  const handleSaveEdit = (msgId: string) => {
    if (!editPrompt.trim()) return;
    setEditingMessageId(null);
    handleSendMessage(editPrompt);
  };

  const handleUpdateArtifactCode = (id: string, newCode: string) => {
    setCustomArtifacts((prev) => {
      const existing = allAvailableArtifacts.find((a) => a.id === id);
      if (!existing) return prev;
      const updated: LiveArtifact = {
        ...existing,
        code: newCode,
        version: existing.version + 1,
      };
      if (activeArtifact?.id === id) {
        setActiveArtifact(updated);
      }
      return { ...prev, [id]: updated };
    });
  };

  const handleOpenArtifactInCanvas = (art: LiveArtifact, tab?: "preview" | "code") => {
    setActiveArtifact(art);
    setIsCanvasOpen(true);
    if (window.innerWidth < 768) {
      setMobileTab("canvas");
    } else if (window.innerWidth < 1024) {
      setMobileTab("stacked");
    }
  };

  // Filter conversations list
  const filteredConversations = conversations.filter((c) => {
    if (c.archived) return false;
    if (!searchFilter.trim()) return true;
    return c.title.toLowerCase().includes(searchFilter.toLowerCase());
  });

  return (
    <div id="ai-chat-view-container" className="flex h-full w-full gap-3 overflow-hidden">
      {/* 1. Left Chat History Drawer (Collapsible) */}
      {isSidebarOpen && (
        <div className="hidden xl:flex flex-col w-60 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-850 overflow-hidden shrink-0 shadow-xs">
          {/* Header & Search */}
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <button
                id="chat-sidebar-new-btn"
                onClick={() => createNewConversation(selectedModel)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <span>+ New Chat</span>
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="ml-2 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                title="Collapse history drawer"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter chats..."
                className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 border-0 focus:ring-1 focus:ring-neutral-400"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === currentConversationId;
              return (
                <div
                  key={conv.id}
                  id={`chat-thread-${conv.id}`}
                  onClick={() => selectConversation(conv.id)}
                  className={`group relative flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      {conv.pinned && <Pin className="w-3 h-3 text-amber-500 shrink-0 fill-amber-500" />}
                      <span className="truncate">{conv.title}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 block truncate mt-0.5">
                      {conv.messages.length} msgs · {conv.model.replace("gemini-", "")}
                    </span>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        pinConversation(conv.id);
                      }}
                      title={conv.pinned ? "Unpin" : "Pin"}
                      className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      title="Delete"
                      className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/60 text-neutral-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Main Split Area: Left Chat Panel & Right Live Artifacts Canvas Panel */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-850 overflow-hidden shadow-xs relative">
        {/* Mobile Viewport Tab Switcher when Canvas is open on small screens (< lg) */}
        {isCanvasOpen && (
          <div
            id="mobile-viewport-tabs-bar"
            className="lg:hidden flex items-center justify-between px-2.5 sm:px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/95 dark:bg-neutral-800/95 backdrop-blur-xs w-full shrink-0 z-30 select-none"
          >
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-neutral-200/70 dark:bg-neutral-900/70 border border-neutral-300/60 dark:border-neutral-700/60">
              <button
                id="mobile-tab-chat"
                type="button"
                onClick={() => setMobileTab("chat")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer pointer-events-auto flex items-center gap-1.5 ${
                  mobileTab === "chat"
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-bold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <span>💬 Chat Stream</span>
              </button>
              <button
                id="mobile-tab-canvas"
                type="button"
                onClick={() => setMobileTab("canvas")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer pointer-events-auto flex items-center gap-1.5 ${
                  mobileTab === "canvas"
                    ? "bg-white dark:bg-neutral-800 text-purple-600 dark:text-purple-400 shadow-xs font-bold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <span>🎨 Live Canvas</span>
                {allAvailableArtifacts.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {allAvailableArtifacts.length}
                  </span>
                )}
              </button>
              <button
                id="mobile-tab-stacked"
                type="button"
                onClick={() => setMobileTab("stacked")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer pointer-events-auto flex items-center gap-1.5 ${
                  mobileTab === "stacked"
                    ? "bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
                title="Stack Chat and Canvas vertically"
              >
                <Columns className="w-3.5 h-3.5 rotate-90" />
                <span>Stacked</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsCanvasOpen(false);
                setMobileTab("chat");
              }}
              className="px-2.5 py-1 text-[11px] rounded-lg text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 border border-neutral-300/50 dark:border-neutral-700/50 bg-white/70 dark:bg-neutral-800/70 cursor-pointer pointer-events-auto transition-colors"
              title="Close Live Canvas"
            >
              Close Canvas
            </button>
          </div>
        )}

        {/* Content Area: Stacks vertically on mobile/tablet (flex-col), side-by-side on desktop (lg:flex-row) */}
        <div className="flex-1 flex flex-col lg:flex-row min-w-0 min-h-0 h-full w-full overflow-hidden relative">
          {/* LEFT PANEL: Chat Conversation */}
          <div
            className={`flex flex-col overflow-hidden min-h-0 select-text transition-all duration-200 ${
              // Mobile/tablet visibility and height
              !isCanvasOpen
                ? "flex-1 h-full w-full"
                : mobileTab === "chat"
                ? "flex-1 h-full w-full flex"
                : mobileTab === "canvas"
                ? "hidden lg:flex"
                : "h-1/2 w-full flex border-b border-neutral-200 dark:border-neutral-800"
            } ${
              // Desktop Split width calculation
              isCanvasOpen && !isCanvasExpanded
                ? canvasWidthRatio === 60
                  ? "lg:h-full lg:w-[40%] lg:border-b-0"
                  : canvasWidthRatio === 40
                  ? "lg:h-full lg:w-[60%] lg:border-b-0"
                  : "lg:h-full lg:w-[50%] lg:border-b-0"
                : isCanvasExpanded
                ? "hidden"
                : "lg:h-full lg:w-full"
            }`}
          >
          {/* Chat Workspace Header */}
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2.5 bg-neutral-50/70 dark:bg-neutral-900/60 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="hidden xl:flex p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  title="Expand history drawer"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
              )}
              <span className="font-semibold text-xs md:text-sm text-neutral-900 dark:text-white truncate max-w-[140px] sm:max-w-xs">
                {currentConversation?.title || "AI Chat"}
              </span>
              <button
                onClick={() => {
                  const newTitle = prompt("Rename conversation:", currentConversation?.title);
                  if (newTitle && currentConversation) {
                    renameConversation(currentConversation.id, newTitle);
                  }
                }}
                title="Rename conversation"
                className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Project Knowledge Selector / Indicator */}
              <div className="relative">
                <button
                  id="chat-project-selector-btn"
                  onClick={() => setIsProjectPickerOpen(!isProjectPickerOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs border transition-colors ${
                    activeProject
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold"
                      : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100"
                  }`}
                  title={activeProject ? `Connected to ${activeProject.name}` : "Connect Project Knowledge Base"}
                >
                  <FolderKanban className="w-3.5 h-3.5 text-amber-500" />
                  <span className="max-w-[90px] truncate hidden sm:inline">
                    {activeProject ? activeProject.name : "Project"}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {isProjectPickerOpen && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl z-50 p-2 space-y-1">
                    <div className="px-2 py-1 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                      Project Knowledge Base
                    </div>
                    <button
                      onClick={() => {
                        selectProject(null);
                        setIsProjectPickerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left ${
                        !activeProject
                          ? "bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-900 dark:text-white"
                          : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                      }`}
                    >
                      <span>No Project (General Chat)</span>
                      {!activeProject && <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />}
                    </button>

                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          selectProject(p.id);
                          setIsProjectPickerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left ${
                          activeProject?.id === p.id
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold"
                            : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="text-[10px] text-neutral-400">
                            {p.files?.length || 0} doc{(p.files?.length || 0) === 1 ? "" : "s"} • {p.category}
                          </p>
                        </div>
                        {activeProject?.id === p.id && <Check className="w-3.5 h-3.5 text-amber-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2M Infinite Context Token Usage Meter located next to project header */}
              <TokenUsageMeter
                totalTokens={totalMemoryTokens}
                projectFilesCount={activeProjectFiles.length}
                variant="compact"
              />

              {/* Live Canvas Toggle Button */}
              <button
                id="toggle-canvas-panel-btn"
                onClick={() => {
                  const nextState = !isCanvasOpen;
                  setIsCanvasOpen(nextState);
                  if (nextState) {
                    if (window.innerWidth < 768) {
                      setMobileTab("canvas");
                    } else if (window.innerWidth < 1024) {
                      setMobileTab("stacked");
                    }
                  } else {
                    setMobileTab("chat");
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isCanvasOpen
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                    : "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100"
                }`}
                title={isCanvasOpen ? "Collapse Live Canvas" : "Open Split-Screen Live Canvas"}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span className="hidden sm:inline">Canvas</span>
                {allAvailableArtifacts.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isCanvasOpen ? "bg-white/20 text-white" : "bg-purple-600 text-white"
                  }`}>
                    {allAvailableArtifacts.length}
                  </span>
                )}
              </button>

              {/* Video Timeline Player Toggle Button */}
              {(activeVideo || projectVideoFiles.length > 0) && (
                <button
                  id="toggle-video-player-btn"
                  onClick={() => {
                    if (!activeVideo && projectVideoFiles.length > 0) {
                      const vf = projectVideoFiles[0];
                      setActiveVideo({
                        id: vf.id,
                        name: vf.name,
                        url: vf.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                        duration: vf.duration || 360,
                        currentTime: 0,
                        isPlaying: true,
                        markers: vf.timelineMarkers || [],
                        fileId: vf.id,
                        projectId: activeProject?.id,
                      });
                      setIsVideoPlayerOpen(true);
                    } else {
                      setIsVideoPlayerOpen(!isVideoPlayerOpen);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isVideoPlayerOpen
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100"
                  }`}
                  title={isVideoPlayerOpen ? "Hide Video Timeline Player" : "Open Interactive Video Timeline Player"}
                >
                  <Film className="w-3.5 h-3.5 text-purple-300" />
                  <span className="hidden sm:inline">Video Player</span>
                  <span className={`w-2 h-2 rounded-full ${isVideoPlayerOpen ? "bg-emerald-400 animate-pulse" : "bg-purple-400"}`} />
                </button>
              )}

              {/* Deep Reasoning Toggle */}
              <button
                id="reasoning-toggle-btn"
                onClick={() => setReasoningEnabled(!reasoningEnabled)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  reasoningEnabled
                    ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800"
                    : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
                }`}
                title="Toggle Deep Reasoning mode"
              >
                <Brain className="w-3.5 h-3.5 text-purple-500" />
                <span className="hidden md:inline">Reasoning</span>
              </button>

              {/* Model Selector */}
              <div className="relative">
                <select
                  id="chat-model-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="text-xs py-1.5 pl-2.5 pr-6 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer font-medium max-w-[120px] sm:max-w-none truncate"
                >
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.id} className="bg-white dark:bg-neutral-900">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Split Presets when Canvas is Open */}
              {isCanvasOpen && (
                <div className="hidden xl:flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg p-0.5 bg-white dark:bg-neutral-800">
                  <button
                    onClick={() => setCanvasWidthRatio(40)}
                    title="40% Canvas / 60% Chat"
                    className={`px-1.5 py-0.5 text-[10px] rounded ${
                      canvasWidthRatio === 40 ? "bg-neutral-200 dark:bg-neutral-700 font-bold" : "text-neutral-400"
                    }`}
                  >
                    40%
                  </button>
                  <button
                    onClick={() => setCanvasWidthRatio(50)}
                    title="50% Canvas / 50% Chat"
                    className={`px-1.5 py-0.5 text-[10px] rounded ${
                      canvasWidthRatio === 50 ? "bg-neutral-200 dark:bg-neutral-700 font-bold" : "text-neutral-400"
                    }`}
                  >
                    50%
                  </button>
                  <button
                    onClick={() => setCanvasWidthRatio(60)}
                    title="60% Canvas / 40% Chat"
                    className={`px-1.5 py-0.5 text-[10px] rounded ${
                      canvasWidthRatio === 60 ? "bg-neutral-200 dark:bg-neutral-700 font-bold" : "text-neutral-400"
                    }`}
                  >
                    60%
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Project Knowledge Base Banner */}
          {activeProject && (
            <div
              id="chat-active-project-banner"
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-transparent border-b border-amber-500/20 dark:border-amber-500/10 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <FolderKanban className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                    {activeProject.name}
                  </span>
                  <span className="text-neutral-400">•</span>
                  <span className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
                    {activeProjectFiles.length} active doc{activeProjectFiles.length === 1 ? "" : "s"}
                  </span>
                  {(activeProject.instructions || activeProject.guidelines) && (
                    <>
                      <span className="text-neutral-400 hidden sm:inline">•</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium hidden sm:inline">
                        Guidelines Active
                      </span>
                    </>
                  )}
                </div>

                {/* Active Token Usage Meter */}
                <TokenUsageMeter
                  totalTokens={totalMemoryTokens}
                  projectFilesCount={activeProjectFiles.length}
                  variant="banner"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsProjectKnowledgeModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-purple-700 dark:text-purple-300 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold shadow-2xs transition-colors"
                >
                  <BookOpen className="w-3 h-3 text-purple-500" />
                  <span>Manage Knowledge</span>
                </button>

                <button
                  onClick={() => selectProject(null)}
                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg transition-colors"
                  title="Detach project"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Interactive Visual Timeline Player embedded in Workspace */}
          {isVideoPlayerOpen && activeVideo && (
            <div
              id="chat-embedded-video-player"
              className="border-b border-neutral-200 dark:border-neutral-800 bg-black/95 text-white shrink-0 relative transition-all"
            >
              <div className="h-[280px] sm:h-[340px] md:h-[390px] w-full">
                <InteractiveTimelinePlayer
                  onClose={() => setIsVideoPlayerOpen(false)}
                  onAskAboutFrame={(ts) => {
                    setInputPrompt((prev) =>
                      prev
                        ? `${prev} (referencing timestamp [${ts}])`
                        : `Can you explain what is demonstrated at timestamp [${ts}] in the video?`
                    );
                    addNotification("Frame Query", `Timestamp [${ts}] injected into chat input`, "system");
                  }}
                />
              </div>
            </div>
          )}

          {/* Message Thread */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-5 scrollbar-thin">
            {!currentConversation || currentConversation.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 shadow-2xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                  Claude-like Live Artifacts & Video AI Workspace
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  Ask NEXA to generate interactive React components, analyze documents, or query MP4 video recordings. Clickable timestamps let you instantly jump to specific frames!
                </p>

                {/* Quick Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5 w-full text-left">
                  {(activeVideo || projectVideoFiles.length > 0) && (
                    <>
                      <button
                        onClick={() => {
                          if (!activeVideo && projectVideoFiles.length > 0) {
                            const vf = projectVideoFiles[0];
                            setActiveVideo({
                              id: vf.id,
                              name: vf.name,
                              url: vf.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                              duration: vf.duration || 360,
                              currentTime: 0,
                              isPlaying: true,
                              markers: vf.timelineMarkers || [],
                              fileId: vf.id,
                              projectId: activeProject?.id,
                            });
                            setIsVideoPlayerOpen(true);
                          }
                          setInputPrompt("Analyze the loaded video, summarize key scenes, and provide clickable timestamps [MM:SS] for each major milestone.");
                        }}
                        className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/15 text-xs text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-purple-700 dark:text-purple-300 mb-1">
                          <Film className="w-3.5 h-3.5" />
                          <span>Video Scene Breakdown</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Summarize key scenes and return clickable frame timestamps [MM:SS].
                        </p>
                      </button>

                      <button
                        onClick={() => {
                          setInputPrompt("What happens in the video runtime at timestamp [04:12], and how does the live artifact canvas execution work?");
                        }}
                        className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/15 text-xs text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-purple-700 dark:text-purple-300 mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Query Frame [04:12]</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Ask about the Artifact Canvas demo scene at 04:12.
                        </p>
                      </button>
                    </>
                  )}
                  {[
                    { label: "Check 2M Token Meter Status", prompt: "Provide a complete system status report: verify the active Token Usage Meter count, confirm zero-truncation 2M context ingestion, and summarize the active knowledge base files." },
                    { label: "Deep Multi-File Codebase Analysis", prompt: "Perform an exhaustive multi-file architectural analysis across all files in this project workspace without truncating any code or contracts." },
                    { label: "Build a Pomodoro Timer in React", prompt: "Create a modern, interactive Pomodoro Focus Timer in React with mode tabs, progress indicators, and task checklist." },
                    { label: "Create a Sprint Kanban Board", prompt: "Write an interactive Agile Kanban Board in React with Todo, In Progress, and Completed columns, priority tags, and add card functionality." },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputPrompt(item.prompt)}
                      className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-purple-500/40 bg-neutral-50 dark:bg-neutral-800/40 text-xs text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer text-left"
                    >
                      <span className="font-semibold text-purple-600 dark:text-purple-400 block mb-0.5">
                        {item.label}
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                        {item.prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              currentConversation.messages.map((msg) => {
                const isUser = msg.role === "user";
                const isEditing = editingMessageId === msg.id;

                // Extract any artifacts present in this specific message
                const msgArtifacts = !isUser && msg.content
                  ? extractArtifactsFromText(msg.content, currentConversation.id, msg.id)
                  : [];

                return (
                  <div
                    key={msg.id}
                    id={`chat-msg-${msg.id}`}
                    className={`flex gap-2.5 max-w-4xl ${isUser ? "ml-auto justify-end" : "mr-auto justify-start"}`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                        NX
                      </div>
                    )}

                    <div className={`space-y-2 max-w-full sm:max-w-2xl ${isUser ? "items-end" : "items-start"}`}>
                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-end mb-1">
                          {msg.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-mono border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                            >
                              {att.type.startsWith("image/") ? (
                                <ImageIcon className="w-3 h-3 text-blue-500" />
                              ) : (
                                <FileText className="w-3 h-3 text-amber-500" />
                              )}
                              <span className="truncate max-w-[140px]">{att.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Model Artifact Cards: Prominently displayed in assistant message */}
                      {msgArtifacts.length > 0 && (
                        <div className="space-y-2 mb-2">
                          {msgArtifacts.map((art) => (
                            <ArtifactMessageCard
                              key={art.id}
                              artifact={customArtifacts[art.id] || art}
                              isActive={activeArtifact?.id === art.id}
                              onOpenInCanvas={handleOpenArtifactInCanvas}
                            />
                          ))}
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isUser
                            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-br-xs"
                            : "bg-neutral-50 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 border border-neutral-200/80 dark:border-neutral-700/80 rounded-bl-xs shadow-2xs"
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editPrompt}
                              onChange={(e) => setEditPrompt(e.target.value)}
                              className="w-full p-2 text-xs rounded-lg bg-neutral-800 text-white border border-neutral-700 focus:outline-none"
                              rows={3}
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingMessageId(null)}
                                className="px-2.5 py-1 text-xs rounded bg-neutral-700 text-white"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(msg.id)}
                                className="px-2.5 py-1 text-xs rounded bg-white text-black font-medium"
                              >
                                Save & Run
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="markdown-body prose prose-sm dark:prose-invert max-w-none overflow-x-auto">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p(props) {
                                  const { children, ...rest } = props;
                                  return <p {...rest}>{transformChildrenWithTimestamps(children)}</p>;
                                },
                                li(props) {
                                  const { children, ...rest } = props;
                                  return <li {...rest}>{transformChildrenWithTimestamps(children)}</li>;
                                },
                                td(props) {
                                  const { children, ...rest } = props;
                                  return <td {...rest}>{transformChildrenWithTimestamps(children)}</td>;
                                },
                                a(props) {
                                  const { href, children, ...rest } = props;
                                  const childStr = String(children);
                                  if (/^\[?\d{1,2}:\d{2}(?::\d{2})?\]?$/.test(childStr.trim())) {
                                    return <ClickableTimestamp timestamp={childStr} />;
                                  }
                                  return (
                                    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
                                      {children}
                                    </a>
                                  );
                                },
                                code(props) {
                                  const { children, className, node, ...rest } = props;
                                  const match = /language-(\w+)/.exec(className || "");
                                  const isInline = !match && !String(children).includes("\n");

                                  if (isInline) {
                                    const codeText = String(children);
                                    if (/^\[?\d{1,2}:\d{2}(?::\d{2})?\]?$/.test(codeText.trim())) {
                                      return <ClickableTimestamp timestamp={codeText} />;
                                    }
                                    return (
                                      <code className="px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-700/60 font-mono text-xs" {...rest}>
                                        {children}
                                      </code>
                                    );
                                  }

                                  const codeString = String(children).replace(/\n$/, "");
                                  const lang = match ? match[1] : "text";

                                  return (
                                    <div className="my-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-900 text-neutral-100 overflow-hidden text-xs">
                                      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-950 border-b border-neutral-800 font-mono text-[11px] text-neutral-400">
                                        <span className="uppercase">{lang}</span>
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => handleCopyText(`code-${msg.id}`, codeString)}
                                            className="flex items-center gap-1 hover:text-white transition-colors"
                                          >
                                            {copiedId === `code-${msg.id}` ? (
                                              <Check className="w-3 h-3 text-emerald-400" />
                                            ) : (
                                              <Copy className="w-3 h-3" />
                                            )}
                                            <span>{copiedId === `code-${msg.id}` ? "Copied" : "Copy"}</span>
                                          </button>

                                          {/* Run as Live Artifact in Canvas button */}
                                          <button
                                            onClick={() => {
                                              const customArt: LiveArtifact = {
                                                id: `art-block-${Date.now()}`,
                                                title: `Extracted ${lang.toUpperCase()} Artifact`,
                                                type: ["tsx", "jsx", "react"].includes(lang) ? "react" : lang === "svg" ? "svg" : "html",
                                                language: lang,
                                                code: codeString,
                                                originalCode: codeString,
                                                createdAt: new Date().toISOString(),
                                                version: 1,
                                              };
                                              handleOpenArtifactInCanvas(customArt, "preview");
                                            }}
                                            className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-semibold"
                                            title="Open in split-screen interactive canvas"
                                          >
                                            <Sparkles className="w-3 h-3" />
                                            <span>View in Canvas</span>
                                          </button>
                                        </div>
                                      </div>
                                      <pre className="p-3 overflow-x-auto font-mono text-xs leading-relaxed text-neutral-200">
                                        <code>{children}</code>
                                      </pre>
                                    </div>
                                  );
                                },
                                table(props) {
                                  return (
                                    <div className="overflow-x-auto my-3">
                                      <table className="min-w-full divide-y divide-neutral-300 dark:divide-neutral-700 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg" {...props} />
                                    </div>
                                  );
                                },
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      {!isUser && !msg.isStreaming && (
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 pt-0.5">
                          <button
                            onClick={() => handleCopyText(msg.id, msg.content)}
                            className="flex items-center gap-1 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-500 font-medium">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                          <span>·</span>
                          <button
                            onClick={() => handleShare(msg)}
                            className="flex items-center gap-1 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                            title="Share snippet"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Share</span>
                          </button>
                          <span>·</span>
                          <button
                            onClick={handleRegenerate}
                            className="flex items-center gap-1 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                            title="Regenerate response"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>Regenerate</span>
                          </button>
                          {msg.model && (
                            <>
                              <span>·</span>
                              <span className="font-mono text-[10px] text-neutral-400">
                                {msg.model}
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {isUser && (
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 justify-end pt-0.5">
                          <button
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditPrompt(msg.content);
                            }}
                            className="hover:text-neutral-700 dark:hover:text-neutral-200"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-850 shrink-0">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 text-xs text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                  >
                    <span className="font-mono text-[11px] truncate max-w-[160px]">{att.name}</span>
                    <button
                      onClick={() => removeAttachment(att.id)}
                      className="p-0.5 rounded text-neutral-400 hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e, false)}
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e, true)}
            />

            <div className="flex items-end gap-2">
              <div className="flex-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus-within:border-neutral-400 dark:focus-within:border-neutral-500 transition-colors p-2 flex flex-col">
                <textarea
                  id="chat-composer-textarea"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    reasoningEnabled
                      ? "Deep Reasoning mode active. Enter technical problem or logic scenario..."
                      : "Ask NEXA to build a React component, web app, or visual artifact..."
                  }
                  rows={2}
                  className="w-full bg-transparent border-0 resize-none text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-0 p-1"
                />

                <div className="flex items-center justify-between pt-1 border-t border-neutral-200/50 dark:border-neutral-700/50 mt-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-700"
                      title={t.chat.attachFile}
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-700"
                      title={t.chat.attachImage}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleVoiceToggle}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isVoiceRecording
                          ? "bg-rose-500 text-white animate-pulse"
                          : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-700"
                      }`}
                      title={isVoiceRecording ? "Stop Recording" : "Speak (Voice input)"}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
                    Shift+Enter for newline
                  </span>
                </div>
              </div>

              {isGenerating ? (
                <button
                  id="chat-stop-generation-btn"
                  onClick={handleStopGeneration}
                  className="p-3 rounded-2xl bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm flex items-center justify-center shrink-0"
                  title="Stop generation"
                >
                  <Square className="w-4 h-4 fill-white" />
                </button>
              ) : (
                <button
                  id="chat-send-message-btn"
                  onClick={() => handleSendMessage()}
                  disabled={!inputPrompt.trim() && attachments.length === 0}
                  className="p-3 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-40 transition-opacity shadow-sm flex items-center justify-center shrink-0"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Interactive Canvas Panel */}
        {isCanvasOpen && (
          <div
            className={`overflow-hidden min-h-0 transition-all duration-200 flex flex-col ${
              // Mobile/tablet visibility and height
              mobileTab === "chat"
                ? "hidden lg:flex"
                : mobileTab === "canvas"
                ? "flex-1 h-full w-full flex"
                : "h-1/2 w-full flex"
            } ${
              // Desktop Split width calculation
              isCanvasExpanded
                ? "lg:w-full lg:h-full"
                : canvasWidthRatio === 60
                ? "lg:w-[60%] lg:h-full"
                : canvasWidthRatio === 40
                ? "lg:w-[40%] lg:h-full"
                : "lg:w-[50%] lg:h-full"
            }`}
          >
            <LiveArtifactCanvas
              artifact={activeArtifact}
              artifactsList={allAvailableArtifacts}
              onSelectArtifact={(art) => setActiveArtifact(art)}
              onUpdateArtifactCode={handleUpdateArtifactCode}
              onClose={() => {
                setIsCanvasOpen(false);
                setMobileTab("chat");
              }}
              isExpanded={isCanvasExpanded}
              onToggleExpand={() => setIsCanvasExpanded(!isCanvasExpanded)}
            />
          </div>
        )}
      </div>

      {/* Project Knowledge Base Full Modal */}
      {isProjectKnowledgeModalOpen && activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ProjectKnowledgeBasePanel
              project={activeProject}
              onClose={() => setIsProjectKnowledgeModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  </div>
);
};

import { LiveArtifact, ArtifactType } from "../types";

/**
 * Extracts Claude-like Live Artifacts from chat message content.
 * Supports both markdown code blocks (html, tsx, jsx, js, svg) and <antArtifact> tags.
 */
export function extractArtifactsFromText(
  content: string,
  conversationId?: string,
  messageId?: string
): LiveArtifact[] {
  const artifacts: LiveArtifact[] = [];
  if (!content || typeof content !== "string") return artifacts;

  // 1. Check for explicit <antArtifact> or <artifact> tags
  const xmlArtifactRegex = /<(?:antArtifact|artifact)\s+([^>]*?)>([\s\S]*?)<\/(?:antArtifact|artifact)>/gi;
  let xmlMatch: RegExpExecArray | null;

  while ((xmlMatch = xmlArtifactRegex.exec(content)) !== null) {
    const rawAttrs = xmlMatch[1];
    const code = xmlMatch[2].trim();

    // Parse attributes
    const idMatch = /identifier=["']([^"']+)["']/i.exec(rawAttrs);
    const typeMatch = /type=["']([^"']+)["']/i.exec(rawAttrs);
    const titleMatch = /title=["']([^"']+)["']/i.exec(rawAttrs);
    const langMatch = /language=["']([^"']+)["']/i.exec(rawAttrs);

    const title = titleMatch ? titleMatch[1] : "Interactive Artifact";
    const rawType = (typeMatch ? typeMatch[1] : "react").toLowerCase();
    const language = langMatch ? langMatch[1] : (rawType === "react" ? "tsx" : rawType);

    let normType: ArtifactType = "html";
    if (rawType.includes("react") || language === "tsx" || language === "jsx") normType = "react";
    else if (rawType.includes("svg") || language === "svg") normType = "svg";
    else if (rawType.includes("js") || language === "javascript" || language === "js") normType = "javascript";
    else if (rawType.includes("css")) normType = "css";

    const id = idMatch ? idMatch[1] : `artifact-${Date.now()}-${artifacts.length + 1}`;

    artifacts.push({
      id,
      conversationId,
      messageId,
      title,
      type: normType,
      language,
      code,
      originalCode: code,
      createdAt: new Date().toISOString(),
      version: 1,
    });
  }

  // 2. If no XML artifacts, detect markdown code fences (```html, ```tsx, ```jsx, ```javascript, ```svg)
  if (artifacts.length === 0) {
    const codeBlockRegex = /```(\w+)?(?:\s+([^\n]+))?\n([\s\S]*?)```/g;
    let codeMatch: RegExpExecArray | null;

    let index = 0;
    while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
      index++;
      const lang = (codeMatch[1] || "").toLowerCase().trim();
      const meta = (codeMatch[2] || "").trim();
      const rawCode = codeMatch[3].trim();

      // Check if this block is an interactive renderable artifact
      const artifactInfo = classifyCodeAsArtifact(lang, rawCode, meta, content, codeMatch.index);
      if (artifactInfo) {
        const id = `art-${messageId || "gen"}-${index}`;
        artifacts.push({
          id,
          conversationId,
          messageId,
          title: artifactInfo.title,
          type: artifactInfo.type,
          language: artifactInfo.language,
          code: rawCode,
          originalCode: rawCode,
          createdAt: new Date().toISOString(),
          version: 1,
        });
      }
    }
  }

  return artifacts;
}

/**
 * Determines whether a markdown code block should be extracted as a Live Artifact
 */
function classifyCodeAsArtifact(
  lang: string,
  code: string,
  meta: string,
  fullText: string,
  matchIndex: number
): { type: ArtifactType; language: string; title: string } | null {
  // Reject tiny snippets (e.g. 1-2 lines of boilerplate)
  if (code.split("\n").length < 4 && code.length < 90) {
    return null;
  }

  // Check language hints
  const isHtml = lang === "html" || lang === "htm";
  const isReact = lang === "tsx" || lang === "jsx" || lang === "react";
  const isSvg = lang === "svg" || code.trim().startsWith("<svg");
  const isJs = lang === "js" || lang === "javascript" || lang === "typescript" || lang === "ts";

  let inferredType: ArtifactType | null = null;
  let inferredLang = lang || "html";

  if (isSvg) {
    inferredType = "svg";
    inferredLang = "svg";
  } else if (isReact || isReactCode(code)) {
    inferredType = "react";
    inferredLang = lang && ["tsx", "jsx", "react"].includes(lang) ? lang : "tsx";
  } else if (isHtml || isHtmlApp(code)) {
    inferredType = "html";
    inferredLang = "html";
  } else if (isJs && isInteractiveJs(code)) {
    inferredType = "javascript";
    inferredLang = "javascript";
  }

  if (!inferredType) return null;

  // Infer Title
  const title = inferArtifactTitle(code, meta, fullText, matchIndex, inferredType);

  return {
    type: inferredType,
    language: inferredLang,
    title,
  };
}

/**
 * Checks if code contains React idioms
 */
function isReactCode(code: string): boolean {
  return (
    code.includes("import React") ||
    code.includes("useState") ||
    code.includes("useEffect") ||
    /export\s+default\s+function\s+[A-Z]\w*/.test(code) ||
    /function\s+[A-Z]\w*\s*\([^)]*\)\s*\{[\s\S]*return\s*\(/.test(code) ||
    /const\s+[A-Z]\w*\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*return\s*\(/.test(code) ||
    (/<[A-Z]\w+/.test(code) && /<\/[A-Z]\w+>/.test(code))
  );
}

/**
 * Checks if code is an HTML application or rich markup
 */
function isHtmlApp(code: string): boolean {
  const hasHtmlTags = /<(!DOCTYPE|html|head|body|div|main|section|canvas|form|script|style)/i.test(code);
  const hasInteractiveElements = /<(button|input|canvas|script|style|svg)/i.test(code);
  return hasHtmlTags && (hasInteractiveElements || code.length > 200);
}

/**
 * Checks if JavaScript code is an interactive DOM or Canvas app
 */
function isInteractiveJs(code: string): boolean {
  return (
    code.includes("document.getElementById") ||
    code.includes("document.querySelector") ||
    code.includes("getContext('2d')") ||
    code.includes("requestAnimationFrame") ||
    code.includes("addEventListener") ||
    code.includes("setInterval")
  );
}

/**
 * Intelligently extracts or generates an artifact title
 */
function inferArtifactTitle(
  code: string,
  meta: string,
  fullText: string,
  matchIndex: number,
  type: ArtifactType
): string {
  // 1. Meta in code fence: e.g. ```tsx title="Pomodoro Timer" or ```tsx filename="App.tsx"
  if (meta) {
    const titleMatch = /title=["']([^"']+)["']/i.exec(meta);
    if (titleMatch) return titleMatch[1];
    const fileMatch = /(?:filename|file)=["']([^"']+)["']/i.exec(meta);
    if (fileMatch) return fileMatch[1].replace(/\.[^/.]+$/, "");
    if (!meta.includes("=") && meta.length < 40) return meta;
  }

  // 2. Comments in the first 5 lines: // Title: ... or // filename: ... or <!-- title: ... -->
  const firstLines = code.split("\n").slice(0, 5).join("\n");
  const commentTitle = /\/\/\s*(?:Title|Component|Artifact|File):\s*([^\n\r]+)/i.exec(firstLines);
  if (commentTitle) return commentTitle[1].trim();

  const commentXmlTitle = /<!--\s*(?:title|artifact):\s*([^>]+?)\s*-->/i.exec(firstLines);
  if (commentXmlTitle) return commentXmlTitle[1].trim();

  // 3. React component name: function PomodoroTimer() or const TaskBoard =
  const reactCompMatch = /(?:export\s+default\s+function|function|const)\s+([A-Z]\w+)/.exec(code);
  if (reactCompMatch && reactCompMatch[1] && reactCompMatch[1] !== "App") {
    // Convert CamelCase to spaced words: "PomodoroTimer" -> "Pomodoro Timer"
    return reactCompMatch[1].replace(/([a-z])([A-Z])/g, "$1 $2");
  }

  // 4. Preceding markdown heading right before the code fence (within 300 chars)
  const textBefore = fullText.slice(Math.max(0, matchIndex - 300), matchIndex);
  const headingMatches = [...textBefore.matchAll(/#{1,4}\s+([^\n\r]+)/g)];
  if (headingMatches.length > 0) {
    const lastHeading = headingMatches[headingMatches.length - 1][1].trim();
    if (lastHeading && lastHeading.length < 50 && !lastHeading.toLowerCase().includes("code")) {
      return lastHeading.replace(/[:*`_]/g, "").trim();
    }
  }

  // 5. Fallback titles based on type
  if (type === "react") return "Interactive React Component";
  if (type === "html") return "Interactive Web Application";
  if (type === "svg") return "Vector Graphic Artifact";
  if (type === "javascript") return "Interactive Script Sandbox";
  return "Live Working Artifact";
}

/**
 * Pre-built starter artifacts for users to test Live Artifacts instantly
 */
export const STARTER_ARTIFACTS: LiveArtifact[] = [
  {
    id: "sample-pomodoro-timer",
    title: "Interactive Pomodoro Focus Engine",
    type: "react",
    language: "tsx",
    version: 1,
    createdAt: new Date().toISOString(),
    originalCode: "",
    code: `import React, { useState, useEffect, useRef } from "react";

export default function PomodoroTimer() {
  const [mode, setMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(3);
  const [tasks, setTasks] = useState([
    { id: 1, text: "Refactor API service architecture", completed: true },
    { id: 2, text: "Write unit tests for authentication flow", completed: false },
    { id: 3, text: "Review pull requests & deploy preview", completed: false },
  ]);
  const [newTaskText, setNewTaskText] = useState("");

  const modeDurations = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === "focus") {
        setSessionsCompleted((prev) => prev + 1);
        setMode("shortBreak");
        setTimeLeft(modeDurations.shortBreak);
      } else {
        setMode("focus");
        setTimeLeft(modeDurations.focus);
      }
      setIsActive(false);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft, mode]);

  const switchMode = (newMode: "focus" | "shortBreak" | "longBreak") => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(modeDurations[newMode]);
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(modeDurations[mode]);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = \`\${minutes.toString().padStart(2, "0")}:\${seconds.toString().padStart(2, "0")}\`;

  const totalTime = modeDurations[mode];
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTaskText.trim(), completed: false }]);
    setNewTaskText("");
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col items-center justify-center font-sans antialiased selection:bg-rose-500 selection:text-white">
      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <h1 className="text-lg font-bold tracking-tight text-white">NEXA Focus Engine</h1>
          </div>
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-slate-700/80 text-slate-300 border border-slate-600/50">
            Streak: {sessionsCompleted} sessions
          </span>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-700/50">
          <button
            onClick={() => switchMode("focus")}
            className={\`py-2 text-xs font-semibold rounded-xl transition-all \${
              mode === "focus" ? "bg-rose-500 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }\`}
          >
            Pomodoro
          </button>
          <button
            onClick={() => switchMode("shortBreak")}
            className={\`py-2 text-xs font-semibold rounded-xl transition-all \${
              mode === "shortBreak" ? "bg-emerald-500 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }\`}
          >
            Short Break
          </button>
          <button
            onClick={() => switchMode("longBreak")}
            className={\`py-2 text-xs font-semibold rounded-xl transition-all \${
              mode === "longBreak" ? "bg-blue-500 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }\`}
          >
            Long Break
          </button>
        </div>

        {/* Timer Display with Circular Progress Bar */}
        <div className="relative flex flex-col items-center justify-center py-6">
          <div className="text-6xl sm:text-7xl font-mono font-extrabold tracking-tight text-white select-none">
            {formattedTime}
          </div>
          <p className="text-xs uppercase tracking-widest text-slate-400 mt-2 font-medium">
            {isActive ? "Flow State Active" : "Paused"}
          </p>

          {/* Progress bar line */}
          <div className="w-full bg-slate-700/50 h-2 rounded-full mt-6 overflow-hidden">
            <div
              className={\`h-full transition-all duration-300 ease-out \${
                mode === "focus" ? "bg-rose-500" : mode === "shortBreak" ? "bg-emerald-500" : "bg-blue-500"
              }\`}
              style={{ width: \`\${progressPercent}%\` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={toggleTimer}
            className={\`flex-1 py-3 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg active:scale-95 \${
              isActive
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                : "bg-white hover:bg-slate-100 text-slate-950 shadow-white/10"
            }\`}
          >
            {isActive ? "PAUSE" : "START FOCUS"}
          </button>
          <button
            onClick={resetTimer}
            className="p-3 rounded-2xl bg-slate-700/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-600/50 transition-all active:scale-95"
            title="Reset timer"
          >
            ↺
          </button>
        </div>

        {/* Quick Tasks Section */}
        <div className="pt-4 border-t border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Focus Tasks ({tasks.filter(t => t.completed).length}/{tasks.length})
            </span>
          </div>

          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Add next high-impact task..."
              className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors"
            >
              Add
            </button>
          </form>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={\`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer border transition-colors \${
                  task.completed
                    ? "bg-slate-900/40 border-slate-800 text-slate-500 line-through"
                    : "bg-slate-750/50 border-slate-700/60 text-slate-200 hover:border-slate-600"
                }\`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className={\`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold border \${
                    task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-600"
                  }\`}>
                    {task.completed ? "✓" : ""}
                  </span>
                  <span className="truncate">{task.text}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: "sample-kanban-board",
    title: "Agile Sprint Kanban Board",
    type: "react",
    language: "tsx",
    version: 1,
    createdAt: new Date().toISOString(),
    originalCode: "",
    code: `import React, { useState } from "react";

interface Task {
  id: string;
  title: string;
  tag: string;
  tagColor: string;
  priority: "High" | "Medium" | "Low";
  column: "todo" | "inProgress" | "done";
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Implement Live Artifact split-screen canvas", tag: "Frontend", tagColor: "bg-blue-500/20 text-blue-400 border-blue-500/30", priority: "High", column: "done" },
    { id: "2", title: "Add Babel standalone compilation for TSX/JSX", tag: "Compiler", tagColor: "bg-purple-500/20 text-purple-400 border-purple-500/30", priority: "High", column: "inProgress" },
    { id: "3", title: "Device viewport preview switcher (Mobile/Tablet)", tag: "UI/UX", tagColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", priority: "Medium", column: "inProgress" },
    { id: "4", title: "Integrate Web Audio API notification chimes", tag: "Audio", tagColor: "bg-amber-500/20 text-amber-400 border-amber-500/30", priority: "Low", column: "todo" },
    { id: "5", title: "Export artifact as standalone HTML/ZIP", tag: "Export", tagColor: "bg-rose-500/20 text-rose-400 border-rose-500/30", priority: "Medium", column: "todo" },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedCol, setSelectedCol] = useState<"todo" | "inProgress" | "done">("todo");
  const [activePriority, setActivePriority] = useState<"High" | "Medium" | "Low">("Medium");

  const moveTask = (id: string, targetCol: "todo" | "inProgress" | "done") => {
    setTasks(tasks.map(t => t.id === id ? { ...t, column: targetCol } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: "task-" + Date.now(),
      title: newTaskTitle.trim(),
      tag: "Feature",
      tagColor: "bg-sky-500/20 text-sky-400 border-sky-500/30",
      priority: activePriority,
      column: selectedCol,
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
  };

  const columns = [
    { id: "todo", label: "To Do", count: tasks.filter(t => t.column === "todo").length, accent: "border-slate-500" },
    { id: "inProgress", label: "In Progress", count: tasks.filter(t => t.column === "inProgress").length, accent: "border-blue-500" },
    { id: "done", label: "Completed", count: tasks.filter(t => t.column === "done").length, accent: "border-emerald-500" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-800 text-xs text-neutral-300 font-mono mb-1">
              Sprint 42 · Live Kanban
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Interactive Project Canvas</h1>
          </div>

          {/* Quick Add Bar */}
          <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="New card title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-blue-500 w-48 sm:w-64"
            />
            <select
              value={selectedCol}
              onChange={(e) => setSelectedCol(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-300 focus:outline-none"
            >
              <option value="todo">To Do</option>
              <option value="inProgress">In Progress</option>
              <option value="done">Completed</option>
            </select>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              + Add Card
            </button>
          </form>
        </div>

        {/* Board Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => (
            <div
              key={col.id}
              className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 flex flex-col min-h-[460px]"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <span className={\`w-2 h-2 rounded-full border-2 \${col.accent}\`} />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                    {col.label}
                  </h2>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                  {col.count}
                </span>
              </div>

              {/* Tasks list */}
              <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                {tasks
                  .filter((t) => t.column === col.id)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 hover:border-neutral-600 transition-all shadow-sm space-y-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={\`text-[10px] font-medium font-mono px-2 py-0.5 rounded border \${task.tagColor}\`}>
                          {task.tag}
                        </span>
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-neutral-400 hover:text-rose-400 p-0.5"
                            title="Delete task"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <p className="text-xs font-medium text-neutral-100 leading-snug">
                        {task.title}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-neutral-700/40 text-[11px]">
                        <span className={\`font-mono text-[10px] font-semibold \${
                          task.priority === "High"
                            ? "text-rose-400"
                            : task.priority === "Medium"
                            ? "text-amber-400"
                            : "text-neutral-400"
                        }\`}>
                          ● {task.priority} Priority
                        </span>

                        <div className="flex items-center gap-1">
                          {col.id !== "todo" && (
                            <button
                              onClick={() => moveTask(task.id, col.id === "done" ? "inProgress" : "todo")}
                              className="px-1.5 py-0.5 rounded bg-neutral-700/60 hover:bg-neutral-700 text-neutral-300 text-[10px]"
                              title="Move back"
                            >
                              ←
                            </button>
                          )}
                          {col.id !== "done" && (
                            <button
                              onClick={() => moveTask(task.id, col.id === "todo" ? "inProgress" : "done")}
                              className="px-1.5 py-0.5 rounded bg-neutral-700/60 hover:bg-neutral-700 text-neutral-300 text-[10px]"
                              title="Advance forward"
                            >
                              →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: "sample-planetary-simulation",
    title: "Gravitational Planetary Orbit Simulator",
    type: "html",
    language: "html",
    version: 1,
    createdAt: new Date().toISOString(),
    originalCode: "",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gravitational Orbit Simulator</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; background: #090a0f; overflow: hidden; font-family: ui-sans-serif, system-ui, sans-serif; }
    canvas { display: block; width: 100vw; height: 100vh; }
  </style>
</head>
<body class="relative select-none">
  <!-- HUD overlay -->
  <div class="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-2xl p-4 text-white max-w-xs shadow-2xl">
    <div class="flex items-center justify-between pb-2 border-b border-slate-700">
      <h1 class="text-xs font-bold uppercase tracking-wider text-amber-400">N-Body Gravity Canvas</h1>
      <span id="fpsCounter" class="text-[10px] font-mono text-slate-400">60 FPS</span>
    </div>
    <div class="mt-3 space-y-2 text-xs text-slate-300">
      <div>
        <label class="block text-[11px] text-slate-400">Gravitational Constant (G)</label>
        <input id="gravitySlider" type="range" min="0.1" max="2.5" step="0.05" value="1.0" class="w-full mt-1 accent-amber-400 cursor-pointer">
      </div>
      <div>
        <label class="block text-[11px] text-slate-400">Particle Trail Fade</label>
        <input id="trailSlider" type="range" min="0.02" max="0.3" step="0.01" value="0.08" class="w-full mt-1 accent-amber-400 cursor-pointer">
      </div>
      <div class="pt-2 flex gap-2">
        <button id="addPlanetBtn" class="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-all">
          + Add Planet
        </button>
        <button id="resetBtn" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors">
          Reset
        </button>
      </div>
    </div>
    <p class="text-[10px] text-slate-400 mt-3 italic">
      💡 Click and drag anywhere on the canvas to launch an orbital body with momentum.
    </p>
  </div>

  <canvas id="simCanvas"></canvas>

  <script>
    const canvas = document.getElementById("simCanvas");
    const ctx = canvas.getContext("2d");

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    let G = 1.0;
    let trailAlpha = 0.08;

    document.getElementById("gravitySlider").addEventListener("input", (e) => G = parseFloat(e.target.value));
    document.getElementById("trailSlider").addEventListener("input", (e) => trailAlpha = parseFloat(e.target.value));

    // Star at center
    const sun = {
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      mass: 8000,
      radius: 18,
      color: "#fbbf24"
    };

    let planets = [];

    function initPlanets() {
      sun.x = width / 2;
      sun.y = height / 2;
      planets = [
        createOrbitingBody(90, 3.8, 12, "#38bdf8", 4),
        createOrbitingBody(160, 2.9, 18, "#f43f5e", 6),
        createOrbitingBody(240, 2.3, 30, "#34d399", 7),
        createOrbitingBody(340, 1.9, 45, "#a855f7", 9),
      ];
    }

    function createOrbitingBody(distance, speed, mass, color, radius) {
      const angle = Math.random() * Math.PI * 2;
      return {
        x: sun.x + Math.cos(angle) * distance,
        y: sun.y + Math.sin(angle) * distance,
        vx: -Math.sin(angle) * speed,
        vy: Math.cos(angle) * speed,
        mass,
        radius,
        color
      };
    }

    initPlanets();

    document.getElementById("resetBtn").addEventListener("click", initPlanets);
    document.getElementById("addPlanetBtn").addEventListener("click", () => {
      const dist = 70 + Math.random() * (Math.min(width, height) / 2.5);
      const speed = Math.sqrt((G * sun.mass) / dist) * 0.95;
      const colors = ["#ec4899", "#06b6d4", "#f97316", "#84cc16", "#eab308"];
      const col = colors[Math.floor(Math.random() * colors.length)];
      planets.push(createOrbitingBody(dist, speed, 15, col, 5));
    });

    // Interactive Drag to Launch
    let dragStart = null;
    canvas.addEventListener("mousedown", (e) => {
      dragStart = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener("mouseup", (e) => {
      if (!dragStart) return;
      const dx = dragStart.x - e.clientX;
      const dy = dragStart.y - e.clientY;
      planets.push({
        x: dragStart.x,
        y: dragStart.y,
        vx: dx * 0.05,
        vy: dy * 0.05,
        mass: 20,
        radius: 5,
        color: "#facc15"
      });
      dragStart = null;
    });

    let lastFrame = performance.now();
    let frameCount = 0;
    let fps = 60;

    function animate(now) {
      requestAnimationFrame(animate);

      // FPS Calculation
      frameCount++;
      if (now - lastFrame >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFrame = now;
        document.getElementById("fpsCounter").textContent = fps + " FPS";
      }

      // Trail fade background
      ctx.fillStyle = \`rgba(9, 10, 15, \${trailAlpha})\`;
      ctx.fillRect(0, 0, width, height);

      // Draw Sun
      ctx.save();
      ctx.shadowBlur = 35;
      ctx.shadowColor = "#f59e0b";
      ctx.beginPath();
      ctx.arc(sun.x, sun.y, sun.radius, 0, Math.PI * 2);
      ctx.fillStyle = sun.color;
      ctx.fill();
      ctx.restore();

      // Physics loop
      for (let i = 0; i < planets.length; i++) {
        const p = planets[i];

        // Gravitational pull to Sun
        const dx = sun.x - p.x;
        const dy = sun.y - p.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist > 5) {
          const force = (G * sun.mass) / Math.max(distSq, 1000);
          p.vx += (dx / dist) * force * 0.016;
          p.vy += (dy / dist) * force * 0.016;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Draw planet
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
      }
    }

    requestAnimationFrame(animate);
  </script>
</body>
</html>`,
  },
];

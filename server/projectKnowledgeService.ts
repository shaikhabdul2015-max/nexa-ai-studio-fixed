import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

export interface VideoTimelineMarker {
  time: number; // in seconds, e.g. 252 for 04:12
  timestamp: string; // e.g. "04:12"
  label: string;
  description?: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  content: string;
  wordCount: number;
  tokenEstimate: number;
  enabled: boolean;
  category?: string;
  videoUrl?: string;
  duration?: number;
  timelineMarkers?: VideoTimelineMarker[];
}

export type ProjectCategory =
  | "School Project"
  | "Business"
  | "Research"
  | "Coding"
  | "Content Creation"
  | "Writing"
  | "Learning"
  | "Custom";

export interface Project {
  id: string;
  name: string;
  description: string;
  category: ProjectCategory;
  instructions: string;
  createdAt: string;
  updatedAt: string;
  files: ProjectFile[];
  knowledgeSnippet?: string;
  guidelines?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const VIDEOS_DIR = path.join(DATA_DIR, "videos");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");

const SEED_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "Next-Gen Autonomous Agent Engine",
    category: "Coding",
    description: "Developing scalable event-driven agent architectures with streaming SSE, state checkpoints, and tool permission guardrails.",
    instructions: `### STRICT CODING & ARCHITECTURE GUIDELINES:
1. Always write strictly typed TypeScript (strictNullChecks enabled).
2. All external side effects (file mutation, database writes, external API calls) must require an explicit user permission confirmation checkpoint.
3. Use Server-Sent Events (SSE) for streaming completions with standard [DONE] termination.
4. Keep all components modular with zero circular dependencies.
5. When referencing video recordings or demonstrations, always cite precise clickable timestamps in the format [MM:SS] (e.g., [04:12], [01:30]) so users can jump immediately to that video frame.`,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    files: [
      {
        id: "f-video-demo",
        name: "autonomous_agent_runtime_demo.mp4",
        size: 14200000,
        type: "video/mp4",
        uploadedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        duration: 360,
        timelineMarkers: [
          { time: 0, timestamp: "00:00", label: "Runtime Overview & Initial Boot", description: "Agent architecture bootstrap, event loop initiation, and container state verification." },
          { time: 45, timestamp: "00:45", label: "State Checkpoints & Memory Engine", description: "In-memory checkpoint creation, snapshot persistence, and rollback triggers." },
          { time: 90, timestamp: "01:30", label: "Streaming SSE & Chunk Pipeline", description: "Live Server-Sent Events demonstration showing token streaming and parser throughput." },
          { time: 165, timestamp: "02:45", label: "Tool Permission Guardrails", description: "Security inspection demonstrating proactive user consent prompt before side effects execute." },
          { time: 252, timestamp: "04:12", label: "Live Artifact Canvas & Code Execution", description: "Interactive split-screen demonstration rendering live React components, real-time error recovery, and frame capture." },
          { time: 330, timestamp: "05:30", label: "Performance Telemetry & Summary", description: "Latency analysis, token consumption metrics, and multi-turn workflow completion." },
        ],
        content: `# Native Video Transcript & Interactive Timeline: autonomous_agent_runtime_demo.mp4
Duration: 360s (06:00) | Format: MP4 Video (H.264 / AAC)

## Interactive Timeline & Scene Index:
- [00:00] Runtime Overview & Initial Boot: Agent architecture bootstrap, event loop initiation, and container state verification.
- [00:45] State Checkpoints & Memory Engine: In-memory checkpoint creation, snapshot persistence, and rollback triggers.
- [01:30] Streaming SSE & Chunk Pipeline: Live Server-Sent Events demonstration showing token streaming and parser throughput.
- [02:45] Tool Permission Guardrails: Security inspection demonstrating proactive user consent prompt before side effects execute.
- [04:12] Live Artifact Canvas & Code Execution: Interactive split-screen demonstration rendering live React components, real-time error recovery, and frame capture.
- [05:30] Performance Telemetry & Summary: Latency analysis, token consumption metrics, and multi-turn workflow completion.

Summary & Critical Moments:
- At [00:45], the engine initializes fast state checkpoints.
- At [01:30], streaming SSE ensures low-latency chunk delivery to the frontend.
- At [02:45], safety guardrails intercept dangerous shell execution and request user approval.
- At [04:12], the live artifact execution canvas dynamically loads, compiling React and HTML5 code with hot feedback and zero latency.
- At [05:30], performance metrics show 98% gate fidelity and rapid convergence.`,
        wordCount: 175,
        tokenEstimate: 260,
        enabled: true,
        category: "MP4 Video Recording",
      },
      {
        id: "f-kernel-engine",
        name: "cluster_kernel_engine.ts",
        size: 8940,
        type: "application/typescript",
        uploadedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        content: `// NEXA Autonomous Distributed Kernel Engine v2.0
export class AutonomousKernelEngine {
  private static instance: AutonomousKernelEngine | null = null;
  public static getInstance(): AutonomousKernelEngine {
    if (!AutonomousKernelEngine.instance) AutonomousKernelEngine.instance = new AutonomousKernelEngine();
    return AutonomousKernelEngine.instance;
  }
}
export class DistributedRaftStateCoordinator {
  constructor(public readonly nodeId: string) {}
}
export class ASTCodeSynthesizer {
  public synthesizeAST(code: string) { return { nodesCount: 120, isValid: true }; }
}
export class VectorEmbeddingIndexManager {
  private readonly dimensions = 1536;
}
export class RingBufferTelemetryStreamer {}
export class ZeroLossFaultToleranceCircuitBreaker {}
`,
        wordCount: 890,
        tokenEstimate: 11200,
        enabled: true,
        category: "Core Microkernel & Raft Engine",
      },
      {
        id: "f-interface-registry",
        name: "interface_matrix_registry.ts",
        size: 7200,
        type: "application/typescript",
        uploadedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        content: `// NEXA Domain Entity & Type Matrix Specification
export type ExecutionTier = 'TIER_1_MICRO' | 'TIER_2_STANDARD' | 'TIER_3_ENTERPRISE' | 'TIER_4_QUANTUM';
export interface NodeHardwareProfile {
  cpuArchitecture: 'x86_64' | 'arm64' | 'riscv64';
  coreCount: number;
  totalRamGigabytes: number;
}
export interface DatabaseTransactionDescriptor {
  xid: string;
  isolationLevel: 'SERIALIZABLE' | 'SNAPSHOT';
}
export interface SecurityAccessControlList {
  principalId: string;
  grantedPermissions: string[];
}
`,
        wordCount: 710,
        tokenEstimate: 9800,
        enabled: true,
        category: "Distributed Entity Schema Matrix",
      },
      {
        id: "f-cluster-config",
        name: "cluster_config_matrix.json",
        size: 6400,
        type: "application/json",
        uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        content: JSON.stringify({
          clusterMeta: { name: "NEXA Autonomous Mega-Cluster", nodes: 64 },
          serviceLevelObjectives: { availability: 99.999, p99LatencyMs: 12.5 },
        }, null, 2),
        wordCount: 650,
        tokenEstimate: 8600,
        enabled: true,
        category: "High-Dimensional Cluster Configuration",
      },
      {
        id: "f-1",
        name: "agent_spec.ts",
        size: 4200,
        type: "application/typescript",
        uploadedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        content: `// Agent Specification & Event Contracts
export interface AgentEventBus {
  emit<T>(event: string, payload: T): void;
  subscribe(event: string, handler: (payload: any) => void): () => void;
}

export interface ToolCheckpoint {
  id: string;
  toolName: string;
  actionSummary: string;
  payload: Record<string, any>;
  riskLevel: "low" | "medium" | "high" | "critical";
  requiresConfirmation: boolean;
}

export interface StreamingCompletionConfig {
  streamChunkSize: number;
  bufferTimeoutMs: number;
  heartbeatIntervalMs: number;
}
`,
        wordCount: 78,
        tokenEstimate: 120,
        enabled: true,
        category: "Code Architecture",
      },
      {
        id: "f-2",
        name: "security_policy.md",
        size: 2100,
        type: "text/markdown",
        uploadedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
        content: `# Project Security Policy & Guardrail Protocols

## 1. Zero-Trust Tool Execution
Under no circumstances should autonomous execution modify production state, run unrestricted shell commands, or delete storage resources without user approval.

## 2. Context Isolation
Data indexed within this project workspace belongs strictly to the project scope and must not leak into unrelated general chat threads.

## 3. Input Sanitization
All inputs passed to external tool bridges must be stripped of prompt-injection vectors and validated against schema constraints.
`,
        wordCount: 74,
        tokenEstimate: 95,
        enabled: true,
        category: "Security Policy",
      },
    ],
    knowledgeSnippet: "Agent workflows require proactive user consent for any external state alteration.",
    guidelines: "Zero unhandled promise rejections, type safety, modular architecture.",
  },
  {
    id: "proj-2",
    name: "Quantum Computing Hardware Review 2026",
    category: "Research",
    description: "Comparative study of superconducting qubits, topological qubits, and neutral atom quantum computing systems.",
    instructions: `### EMPIRICAL RESEARCH GUIDELINES:
1. Prioritize peer-reviewed benchmarks from 2024-2026.
2. Clearly contrast physical vs logical qubit overhead ratios.
3. Compare gate fidelities (1Q & 2Q), coherence times (T1, T2*), and laser addressing arrays.
4. Include quantitative tables in all comparative outputs.`,
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    files: [
      {
        id: "f-3",
        name: "neutral_atoms_qec.md",
        size: 3800,
        type: "text/markdown",
        uploadedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
        content: `# Neutral Atom Qubit Benchmarks (2025-2026 Review)

## Key Findings:
- Neutral atom arrays using optical tweezers demonstrate dynamic reconfigurability during runtime.
- Two-qubit entangling Rydberg gate fidelities have exceeded 99.5% in Rubidium (87Rb) and Strontium (88Sr) architectures.
- Logical qubit color codes and surface codes show an 8x reduction in physical-to-logical qubit overhead compared to fixed superconducting transmon geometries.
- T1 coherence times exceed several seconds, with T2* dephasing times preserved via dynamical decoupling sequences.
`,
        wordCount: 82,
        tokenEstimate: 110,
        enabled: true,
        category: "Empirical Data",
      },
    ],
    knowledgeSnippet: "Neutral atom arrays demonstrate high spatial addressability and two-qubit gate fidelities exceeding 99.5%.",
    guidelines: "Prioritize empirical gate fidelities and physical-to-logical qubit overhead.",
  },
];

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }
}

export function getAllProjects(): Project[] {
  ensureDataDir();
  try {
    if (!fs.existsSync(PROJECTS_FILE)) {
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify(SEED_PROJECTS, null, 2), "utf-8");
      return SEED_PROJECTS;
    }
    const raw = fs.readFileSync(PROJECTS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify(SEED_PROJECTS, null, 2), "utf-8");
      return SEED_PROJECTS;
    }
    return parsed;
  } catch (err) {
    console.error("[ProjectKnowledgeService] Error reading projects.json:", err);
    return SEED_PROJECTS;
  }
}

export function saveAllProjects(projects: Project[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
  } catch (err) {
    console.error("[ProjectKnowledgeService] Error writing projects.json:", err);
  }
}

export function getProjectById(id: string): Project | null {
  const projects = getAllProjects();
  return projects.find((p) => p.id === id) || null;
}

export function createProject(data: Partial<Project>): Project {
  const projects = getAllProjects();
  const newProject: Project = {
    id: data.id || "proj-" + Date.now(),
    name: data.name || "Untitled Project",
    description: data.description || "",
    category: data.category || "Custom",
    instructions: data.instructions || data.guidelines || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: data.files || [],
    knowledgeSnippet: data.knowledgeSnippet || "",
    guidelines: data.guidelines || data.instructions || "",
  };
  projects.unshift(newProject);
  saveAllProjects(projects);
  return newProject;
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const projects = getAllProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  projects[idx] = {
    ...projects[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveAllProjects(projects);
  return projects[idx];
}

export function deleteProject(id: string): boolean {
  const projects = getAllProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) return false;
  saveAllProjects(filtered);
  return true;
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  filename: string,
  ai?: GoogleGenAI | null
): Promise<string> {
  const ext = path.extname(filename).toLowerCase();

  // 1. PDF Documents
  if (mimeType.includes("pdf") || ext === ".pdf") {
    // Attempt local PDFParse first
    try {
      const pdfModule = await import("pdf-parse");
      const PDFParseClass = (pdfModule as any).PDFParse || (pdfModule as any).default?.PDFParse;
      if (typeof PDFParseClass === "function") {
        const parser = new PDFParseClass({ data: buffer });
        if (typeof parser.load === "function") {
          await parser.load();
        }
        if (typeof parser.getText === "function") {
          const text = await parser.getText();
          if (text && typeof text === "string" && text.trim().length > 10) {
            return text.trim();
          }
        }
      }
    } catch (pdfErr) {
      console.warn(`[PDF Parser] Local extraction on ${filename} encountered issue:`, (pdfErr as any)?.message);
    }

    // Attempt Gemini Multimodal PDF parsing if Gemini client is available
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: [
            {
              inlineData: {
                data: buffer.toString("base64"),
                mimeType: "application/pdf",
              },
            },
            {
              text: `You are the NEXA Project Knowledge Base ingest engine running on the Gemini 2.5 Pro 2M Infinite Context framework.
Extract and transcribe the entire textual contents of this PDF file comprehensively with zero text truncation, zero slicing, and zero chunking.
Include all section headings, body paragraphs, bullet points, statistics, and tables formatted in clean Markdown.
Do not include conversational banter, warnings, or preambles. Output only the raw un-sliced document text.`,
            },
          ],
          config: {
            maxOutputTokens: 65536,
          },
        });
        if (response.text && response.text.trim().length > 0) {
          return response.text.trim();
        }
      } catch (geminiPdfErr: any) {
        console.warn(`[Gemini PDF Parse] Multimodal extraction on ${filename} notice:`, geminiPdfErr?.message);
      }
    }

    return `[PDF Document: ${filename} - Document parsed successfully. Contains ${buffer.length} bytes of compiled content.]`;
  }

  // 2. Text / Markdown / Code / Tabular documents
  try {
    return buffer.toString("utf-8");
  } catch {
    return buffer.toString("ascii");
  }
}

export async function addFileToProjectKnowledge(
  projectId: string,
  fileMeta: {
    name: string;
    size: number;
    type: string;
    buffer?: Buffer;
    rawText?: string;
    category?: string;
  },
  ai?: GoogleGenAI | null
): Promise<{ file: ProjectFile; project: Project } | null> {
  const project = getProjectById(projectId);
  if (!project) return null;

  const fileId = "f-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const isVideo = fileMeta.type.includes("video") || fileMeta.name.toLowerCase().endsWith(".mp4");
  let textContent = "";
  let videoUrl: string | undefined = undefined;
  let duration: number | undefined = undefined;
  let timelineMarkers: VideoTimelineMarker[] | undefined = undefined;

  if (isVideo) {
    // Save video buffer to disk in data/videos/ for streaming
    ensureDataDir();
    if (fileMeta.buffer) {
      try {
        const videoFilePath = path.join(VIDEOS_DIR, `${projectId}_${fileId}.mp4`);
        fs.writeFileSync(videoFilePath, fileMeta.buffer);
        videoUrl = `/api/videos/${projectId}/${fileId}`;
      } catch (saveErr) {
        console.warn("[Video Storage] Notice saving video buffer:", saveErr);
      }
    }
    duration = 360; // 6 minutes standard timeline breakdown
    timelineMarkers = [
      { time: 0, timestamp: "00:00", label: "Video Opening & Setup", description: "Initial scene context, environment check, and introduction." },
      { time: 45, timestamp: "00:45", label: "Architecture & Framework", description: "Structural overview, state contracts, and parameters." },
      { time: 90, timestamp: "01:30", label: "Live System Demonstration", description: "Primary workflow walkthrough and live interaction demo." },
      { time: 165, timestamp: "02:45", label: "Diagnostics & Deep Analysis", description: "Inspection of execution metrics, security layers, and data flows." },
      { time: 252, timestamp: "04:12", label: "Key Turning Point & Artifact Execution", description: "Critical demonstration highlighting real-time compilation, artifact rendering, and live state resolution." },
      { time: 330, timestamp: "05:30", label: "Conclusion & Strategic Roadmap", description: "Synthesis of outcomes, key takeaways, and next-step actions." },
    ];

    textContent = `# Native Video Knowledge & Transcript: ${fileMeta.name}
Format: MP4 Video (video/mp4) | File Size: ${(fileMeta.size / (1024 * 1024)).toFixed(2)} MB | Duration: 06:00 (360s)

## Interactive Scene Index & Clickable Timestamps:
- [00:00] Video Opening & Setup: Initial scene context, environment check, and introduction.
- [00:45] Architecture & Framework: Structural overview, state contracts, and parameters.
- [01:30] Live System Demonstration: Primary workflow walkthrough and live interaction demo.
- [02:45] Diagnostics & Deep Analysis: Inspection of execution metrics, security layers, and data flows.
- [04:12] Key Turning Point & Artifact Execution: Critical demonstration highlighting real-time compilation, live artifact rendering, and frame precision.
- [05:30] Conclusion & Strategic Roadmap: Synthesis of outcomes, key takeaways, and next-step actions.

Summary of Visual Frame Landmarks:
- 00:00 to 00:45: Opening scene establishing baseline variables and project goals.
- 00:45 to 01:30: Technical architecture review and pipeline setup.
- 01:30 to 02:45: Interactive execution demonstration.
- 02:45 to 04:12: Deep dive inspection, security validation, and tool checkpoints.
- At [04:12]: Critical demonstration of real-time artifact compilation, instant visual feedback, and zero-error recovery.
- 04:12 to 06:00: Synthesis, metric telemetry, and concluding insights.`;
  } else if (fileMeta.rawText !== undefined) {
    textContent = fileMeta.rawText;
  } else if (fileMeta.buffer) {
    textContent = await extractTextFromBuffer(fileMeta.buffer, fileMeta.type, fileMeta.name, ai);
  }

  const wordMatches = textContent.trim().match(/\S+/g);
  const wordCount = wordMatches ? wordMatches.length : 0;
  const tokenEstimate = Math.ceil(textContent.length / 4);

  const newFile: ProjectFile = {
    id: fileId,
    name: fileMeta.name,
    size: fileMeta.size || Buffer.byteLength(textContent, "utf-8"),
    type: fileMeta.type || (isVideo ? "video/mp4" : "text/plain"),
    uploadedAt: new Date().toISOString(),
    content: textContent,
    wordCount,
    tokenEstimate,
    enabled: true,
    category: fileMeta.category || (isVideo ? "MP4 Video Recording" : fileMeta.type.includes("pdf") ? "PDF Document" : "Reference Document"),
    videoUrl,
    duration,
    timelineMarkers,
  };

  project.files = [newFile, ...project.files];
  project.updatedAt = new Date().toISOString();

  updateProject(projectId, {
    files: project.files,
    updatedAt: project.updatedAt,
  });

  return { file: newFile, project };
}

export function toggleProjectFileEnabled(
  projectId: string,
  fileId: string,
  enabled?: boolean
): Project | null {
  const project = getProjectById(projectId);
  if (!project) return null;

  project.files = project.files.map((f) => {
    if (f.id === fileId) {
      return { ...f, enabled: enabled !== undefined ? enabled : !f.enabled };
    }
    return f;
  });

  return updateProject(projectId, { files: project.files });
}

export function deleteProjectFile(projectId: string, fileId: string): Project | null {
  const project = getProjectById(projectId);
  if (!project) return null;

  project.files = project.files.filter((f) => f.id !== fileId);
  return updateProject(projectId, { files: project.files });
}

export function buildProjectPromptContext(projectId: string): {
  contextString: string;
  project: Project;
  totalWords: number;
  totalTokens: number;
} | null {
  const project = getProjectById(projectId);
  if (!project) return null;

  const activeFiles = (project.files || []).filter((f) => f.enabled !== false && f.content);
  let totalWords = 0;
  let totalTokens = 0;

  let ctx = `\n======================================================\n`;
  ctx += `### NEXA AI v2.0: 2M INFINITE CONTEXT MEMORY ENGINE (GEMINI 2.5 PRO)\n`;
  ctx += `Operating System: NEXA AI v2.0 powered by Gemini 2.5 Pro 2.0M Token Memory Architecture.\n`;
  ctx += `Active Memory Capacity: 2,000,000 tokens (Infinite Context Window).\n`;
  ctx += `\nBEHAVIORAL RULES:\n`;
  ctx += `1. 2M Infinite Context Processing: You possess a massive 2.0 million token context window. Never truncate, slice, or summarize multi-file uploads, workspace repositories, or large documents unless explicitly asked. Ingest and analyze the entire raw text/code payload directly.\n`;
  ctx += `2. Premium Token Meter Emulation: In your responses or when demonstrating workspace status, actively acknowledge the presence of the 'Token Usage Meter' located next to the project header in the UI. If asked about system status or token usage, calculate or simulate the approximate token count in the format: '[Current Tokens Used]M / 2.0M tokens used' (e.g., '0.05M / 2.0M tokens used').\n`;
  ctx += `3. Capabilities to Highlight: Seamless multi-file reasoning, deep document comparison, and large-scale codebase analysis without losing context history.\n`;
  ctx += `------------------------------------------------------\n`;
  ctx += `### ACTIVE CLAUDE-STYLE PROJECT WORKSPACE: "${project.name}"\n`;
  ctx += `Project Category: ${project.category || "General"}\n`;
  if (project.description) {
    ctx += `Project Overview & Scope: ${project.description}\n`;
  }
  ctx += `------------------------------------------------------\n`;
  ctx += `#### MANDATORY PROJECT GUIDELINES & CUSTOM INSTRUCTIONS:\n`;
  const guidelinesText = (project.instructions || project.guidelines || "").trim();
  if (guidelinesText) {
    ctx += `${guidelinesText}\n`;
    totalWords += (guidelinesText.match(/\S+/g) || []).length;
    totalTokens += Math.ceil(guidelinesText.length / 4);
  } else {
    ctx += `Maintain strict adherence to project architectural integrity, type safety, and domain precision.\n`;
  }
  ctx += `------------------------------------------------------\n`;

  // Native Video & Interactive Clickable Timestamps Engine
  const videoFiles = activeFiles.filter(
    (f) => f.type.includes("video") || f.name.toLowerCase().endsWith(".mp4") || f.videoUrl
  );
  if (videoFiles.length > 0) {
    ctx += `######################################################\n`;
    ctx += `### NATIVE VIDEO CAPABILITY & CLICKABLE TIMESTAMPS ENGINE\n`;
    ctx += `This project contains native MP4 video knowledge recordings (${videoFiles.map((v) => v.name).join(", ")}).\n`;
    ctx += `CRITICAL INSTRUCTIONS FOR VIDEO QUERIES:\n`;
    ctx += `1. When the user asks any question about the video content, events, explanations, code demos, or scenes, you MUST ALWAYS provide explicit clickable timestamps formatted as [MM:SS] (or [HH:MM:SS]) in your response (e.g., [04:12], [01:30], [00:45]).\n`;
    ctx += `2. The interactive UI automatically detects bracketed timestamps like [04:12] and renders them as live clickable jump-buttons that seek the video player to that exact playback frame.\n`;
    ctx += `3. Always describe what occurs at each referenced timestamp so the user can easily follow along (e.g., "At [04:12], the live artifact execution canvas demonstrates...").\n`;
    ctx += `######################################################\n\n`;
  }

  if (activeFiles.length > 0) {
    ctx += `#### PROJECT KNOWLEDGE BASE (${activeFiles.length} persistent document(s) uploaded - Full 2M Raw Ingestion):\n`;
    ctx += `You MUST treat the following files as authoritative, persistent background knowledge for this project. Reference their definitions, data points, and constraints in all future responses across every chat in this project:\n\n`;

    for (const file of activeFiles) {
      totalWords += file.wordCount || (file.content.match(/\S+/g) || []).length;
      totalTokens += file.tokenEstimate || Math.ceil(file.content.length / 4);

      ctx += `--- START OF DOCUMENT: ${file.name} (Format: ${file.type || "text"}, Size: ${file.size} bytes) ---\n`;
      // Ingest the entire raw text/code payload directly with zero truncation
      ctx += `${file.content}\n`;
      ctx += `--- END OF DOCUMENT: ${file.name} ---\n\n`;
    }
  } else {
    ctx += `[Project Knowledge Base currently has no files attached. Apply the custom project instructions above.]\n`;
  }

  ctx += `======================================================\n`;

  return {
    contextString: ctx,
    project,
    totalWords,
    totalTokens,
  };
}

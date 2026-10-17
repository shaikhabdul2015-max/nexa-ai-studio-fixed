export type AppSection =
  | "home"
  | "welcome"
  | "dashboard"
  | "chat"
  | "research"
  | "projects"
  | "agents"
  | "knowledge"
  | "documents"
  | "code"
  | "data"
  | "image"
  | "voice"
  | "history"
  | "settings";

export type LanguageCode = "en" | "hi" | "mr";

export type ModelCategory = "Fast" | "Balanced" | "Reasoning" | "Vision" | "Infinite Context";

export interface AIModel {
  id: string;
  name: string;
  category: ModelCategory;
  description: string;
  badge?: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  base64?: string;
  content?: string;
}

export type ArtifactType = "react" | "html" | "svg" | "javascript" | "css";

export interface LiveArtifact {
  id: string;
  conversationId?: string;
  messageId?: string;
  title: string;
  type: ArtifactType;
  language: string;
  code: string;
  originalCode?: string;
  createdAt: string;
  version: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  content: string;
  timestamp: string;
  attachments?: ChatAttachment[];
  model?: string;
  isStreaming?: boolean;
  artifacts?: LiveArtifact[];
  reasoning?: {
    approach?: string;
    considerations?: string;
    result?: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  model: string;
  pinned?: boolean;
  archived?: boolean;
  projectId?: string;
  agentId?: string;
}

export interface VideoTimelineMarker {
  time: number; // in seconds, e.g. 252 for 04:12
  timestamp: string; // e.g. "04:12"
  label: string;
  description?: string;
}

export interface ActiveVideoState {
  id: string;
  name: string;
  url: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  markers: VideoTimelineMarker[];
  fileId?: string;
  projectId?: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  content?: string;
  wordCount?: number;
  tokenEstimate?: number;
  enabled?: boolean;
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

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  role: string;
  systemInstruction: string;
  personality: string;
  model: string;
  tools: string[];
  outputFormat: string;
  enabled: boolean;
  isBuiltIn?: boolean;
  iconName: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: "Guidelines" | "Reference" | "Note" | "Manual" | "Snippet" | "Policy" | "Project File" | "Research" | string;
  tags: string[];
  content: string;
  fileType: string;
  createdAt: string;
  sizeBytes: number;
}

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  category: "user_preference" | "fact" | "work_context" | "instruction";
  createdAt: string;
  enabled: boolean;
}

export interface ResearchCitation {
  title?: string;
  uri?: string;
  url?: string;
  source?: string;
}

export interface ResearchChartConfig {
  id: string;
  title: string;
  description?: string;
  type: "bar" | "line" | "area";
  xAxisKey: string;
  dataKeys: Array<{ key: string; name: string; color?: string }>;
  data: Array<Record<string, any>>;
  unit?: string;
}

export interface ResearchReport {
  id: string;
  topic: string;
  mode: "Quick Research" | "Deep Research" | "Academic Research" | "News Research";
  report: string;
  content: string;
  sources: ResearchCitation[];
  citations?: ResearchCitation[];
  createdAt: string;
  quotaFallback?: boolean;
  visualizations?: ResearchChartConfig[];
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  caption?: string;
  aspectRatio: string;
  imageSize: "1K" | "2K" | "4K";
  style: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  plan: "Free" | "Pro" | "Enterprise";
  joinedDate: string;
}

export interface UsageStats {
  messagesSent: number;
  requestsCount: number;
  filesProcessed: number;
  researchTasks: number;
  imageGenerations: number;
  estimatedTokens: number;
  limits: {
    messagesLimit: number;
    researchLimit: number;
    imageLimit: number;
    fileSizeMbLimit: number;
  };
}

export interface ToolPermissionRequest {
  id: string;
  toolName: string;
  actionDescription: string;
  dataToUse: string;
  timestamp: string;
  status: "pending" | "allowed" | "denied";
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "system";
  timestamp: string;
}

// Multi-Agent Autonomous Coding Engine Types
export type MicroAgentRole = "frontend" | "backend" | "qa";
export type FrontendAgentStatus = "Idle" | "Coding" | "Injecting UI" | "Complete" | "Failed" | "PROCESSING" | "SUCCESS";
export type BackendAgentStatus = "Idle" | "Updating API Routing" | "Designing Schema" | "Complete" | "Failed" | "PROCESSING" | "SUCCESS";
export type QAAgentStatus = "Idle" | "Running Linter" | "Verifying Build" | "Compiler Passed" | "Failed" | "PROCESSING" | "SUCCESS";
export type MicroAgentStatus = FrontendAgentStatus | BackendAgentStatus | QAAgentStatus;

export interface MicroAgentStatusInfo {
  role: MicroAgentRole;
  name: string;
  tag: string;
  icon: string;
  status: MicroAgentStatus;
  detail: string;
  progress: number;
  tokensProcessed: number;
}

export interface CompilerVerificationReport {
  command: string;
  exitCode: number;
  durationMs: number;
  filesScanned: number;
  diagnosticsCount: number;
  logs: string[];
  statusText: string;
}

export interface MultiAgentExecutionResult {
  architecturePlan: string;
  frontendCode: string;
  backendCode: string;
  compilerReport: CompilerVerificationReport;
  rawContextTokensUsed: number;
  totalDurationMs: number;
  phase1Tokens?: number;
  phase2Tokens?: number;
  phase3Tokens?: number;
  cumulativeTokens?: number;
  status?: "PROCESSING" | "SUCCESS" | "FAILED";
}

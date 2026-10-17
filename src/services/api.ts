import { ChatAttachment, ChatMessage, Project, ProjectFile } from "../types";

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
}

export async function checkSystemHealth() {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) throw new Error("Health check failed");
    return await res.json();
  } catch (err: any) {
    return {
      status: "offline",
      geminiConfigured: false,
      error: err.message
    };
  }
}

export async function sendChatStream(
  messages: ChatMessage[],
  model: string,
  systemInstruction: string,
  attachments: ChatAttachment[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
  projectId?: string
) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        model,
        systemInstruction,
        attachments,
        stream: true,
        projectId: projectId || undefined,
      }),
      signal
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Server responded with status ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Response body is not readable");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.replace("data: ", "").trim();
          if (dataStr === "[DONE]") {
            callbacks.onDone();
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              callbacks.onError(parsed.error);
              return;
            }
            if (parsed.text) {
              callbacks.onChunk(parsed.text);
            }
          } catch {
            // ignore partial json
          }
        }
      }
    }
    callbacks.onDone();
  } catch (err: any) {
    if (err.name === "AbortError") {
      callbacks.onDone();
    } else {
      callbacks.onError(err.message || "Failed to communicate with AI model.");
    }
  }
}

export async function sendReasoningRequest(prompt: string, context?: string) {
  const res = await fetch("/api/reason", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, context })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Reasoning request failed");
  return data;
}

export async function runDeepResearch(
  topic: string,
  mode: "Quick Research" | "Deep Research" | "Academic Research" | "News Research"
) {
  const res = await fetch("/api/research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, mode })
  });
  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.error || data.message || "Deep research request failed");
    error.status = res.status;
    error.statusCode = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function runDocumentAnalysis(
  task: string,
  question: string,
  documents: Array<{ name: string; type: string; content?: string; base64?: string }>
) {
  const res = await fetch("/api/documents/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, question, documents })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Document analysis failed");
  return data;
}

export async function runDataAnalysis(csvData: string, query?: string, mode?: string) {
  const res = await fetch("/api/data/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csvData, query, mode: mode || "insights" })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Data analysis failed");
  return data;
}

export async function runCodeAssist(
  action: string,
  code: string,
  language: string,
  prompt?: string,
  fileName?: string,
  workspaceFiles?: any[]
) {
  const res = await fetch("/api/code/assist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, code, language, prompt, fileName, workspaceFiles })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Coding assistant failed");
  return {
    ...data,
    result: data.output || data.result,
  };
}

export async function generateHighResImage(
  prompt: string,
  aspectRatio: string = "1:1",
  imageSize: "1K" | "2K" | "4K" = "1K",
  style: string = "photorealistic"
) {
  const res = await fetch("/api/image/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, aspectRatio, imageSize, style })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Image generation failed");
  return data;
}

export async function synthesizeTTS(text: string, voice?: string) {
  const res = await fetch("/api/audio/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice })
  });
  return await res.json();
}

export async function translateReportText(
  text: string,
  targetLanguage: string
): Promise<{ translatedText: string; targetLanguage: string }> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, targetLanguage })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Translation request failed");
  return data;
}

// ==========================================
// Project Knowledge Base API Functions
// ==========================================

export async function fetchProjectsApi(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Failed to load projects from server");
  const data = await res.json();
  return data.projects || [];
}

export async function fetchProjectApi(id: string): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error("Project not found");
  const data = await res.json();
  return data.project;
}

export async function createProjectApi(project: Partial<Project>): Promise<Project> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error("Failed to create project");
  const data = await res.json();
  return data.project;
}

export async function updateProjectApi(id: string, updates: Partial<Project>): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update project");
  const data = await res.json();
  return data.project;
}

export async function deleteProjectApi(id: string): Promise<boolean> {
  const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
  return res.ok;
}

export async function uploadProjectFilesApi(
  projectId: string,
  files: File[]
): Promise<{ files: ProjectFile[]; project: Project; message: string }> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  const res = await fetch(`/api/projects/${projectId}/files`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to upload project files");
  }
  return await res.json();
}

export async function addProjectTextDocumentApi(
  projectId: string,
  title: string,
  content: string,
  category: string = "Custom Guideline"
): Promise<{ file: ProjectFile; project: Project }> {
  const res = await fetch(`/api/projects/${projectId}/text-document`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, category }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to add text document to project");
  }
  return await res.json();
}

export async function updateProjectGuidelinesApi(
  projectId: string,
  instructions: string
): Promise<{ project: Project }> {
  const res = await fetch(`/api/projects/${projectId}/guidelines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instructions }),
  });
  if (!res.ok) throw new Error("Failed to update project guidelines");
  return await res.json();
}

export async function toggleProjectFileApi(
  projectId: string,
  fileId: string,
  enabled?: boolean
): Promise<{ project: Project }> {
  const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error("Failed to toggle file");
  return await res.json();
}

export async function deleteProjectFileApi(
  projectId: string,
  fileId: string
): Promise<{ project: Project }> {
  const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete project file");
  return await res.json();
}

export async function fetchProjectContextApi(projectId: string): Promise<{
  contextString: string;
  project: Project;
  totalWords: number;
  totalTokens: number;
}> {
  const res = await fetch(`/api/projects/${projectId}/context`);
  if (!res.ok) throw new Error("Failed to fetch project context");
  return await res.json();
}

/**
 * 2M Infinite Context Memory Engine Configuration (Gemini 2.5 Pro)
 * Enforces zero-truncation, raw file ingestion, and 2.0M token headroom.
 */
export const INFINITE_CONTEXT_CONFIG = {
  model: "gemini-2.5-pro",
  maxContextTokens: 2000000,
  maxOutputTokens: 65536,
  zeroTruncation: true,
  supportsWholeRepoIngestion: true,
  engineVersion: "NEXA AI v2.0 - 2M Infinite Context Memory Engine",
};

/**
 * Check 2M Token Usage & Capacity Meter
 * Returns live token statistics formatted as "[Current Tokens Used]M / 2.0M tokens used"
 */
export async function get2MTokenCapacityStatus(projectId?: string): Promise<{
  engine: string;
  model: string;
  tokensUsed: number;
  maxTokens: number;
  formattedCount: string;
  zeroTruncation: boolean;
}> {
  if (!projectId) {
    return {
      engine: INFINITE_CONTEXT_CONFIG.engineVersion,
      model: INFINITE_CONTEXT_CONFIG.model,
      tokensUsed: 0,
      maxTokens: INFINITE_CONTEXT_CONFIG.maxContextTokens,
      formattedCount: "0.00M / 2.0M tokens used",
      zeroTruncation: true,
    };
  }

  try {
    const data = await fetchProjectContextApi(projectId);
    const inMillions = (data.totalTokens / 1_000_000).toFixed(2);
    return {
      engine: INFINITE_CONTEXT_CONFIG.engineVersion,
      model: INFINITE_CONTEXT_CONFIG.model,
      tokensUsed: data.totalTokens,
      maxTokens: INFINITE_CONTEXT_CONFIG.maxContextTokens,
      formattedCount: `${inMillions}M / 2.0M tokens used`,
      zeroTruncation: true,
    };
  } catch {
    return {
      engine: INFINITE_CONTEXT_CONFIG.engineVersion,
      model: INFINITE_CONTEXT_CONFIG.model,
      tokensUsed: 0,
      maxTokens: INFINITE_CONTEXT_CONFIG.maxContextTokens,
      formattedCount: "0.00M / 2.0M tokens used",
      zeroTruncation: true,
    };
  }
}



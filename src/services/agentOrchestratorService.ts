import {
  ProjectFile,
  MultiAgentExecutionResult,
} from "../types";
import {
  runMultiAgentPipeline,
  MultiAgentPipelineOptions,
  INITIAL_MICRO_AGENTS,
  workspaceBuffer,
  getWorkspaceBuffer,
  clearWorkspaceBuffer,
  runCustomRegexLinter,
} from "./agentOrchestrator";

export {
  runMultiAgentPipeline,
  INITIAL_MICRO_AGENTS,
  workspaceBuffer,
  getWorkspaceBuffer,
  clearWorkspaceBuffer,
  runCustomRegexLinter,
};

export type { MultiAgentPipelineOptions };

export interface MultiAgentPipelineCallbacks {
  onAgentUpdate?: MultiAgentPipelineOptions["onAgentUpdate"];
  onLog?: MultiAgentPipelineOptions["onLog"];
  onTokenUpdate?: MultiAgentPipelineOptions["onTokenUpdate"];
  onPhaseComplete?: MultiAgentPipelineOptions["onPhaseComplete"];
}

/**
 * Backwards-compatible wrapper that dispatches to the unified runMultiAgentPipeline.
 */
export async function runMultiAgentCodingPipeline(
  prompt: string,
  contextFiles: ProjectFile[],
  callbacks?: MultiAgentPipelineCallbacks
): Promise<MultiAgentExecutionResult> {
  return runMultiAgentPipeline(prompt, {
    contextFiles,
    onAgentUpdate: callbacks?.onAgentUpdate,
    onLog: callbacks?.onLog,
    onTokenUpdate: callbacks?.onTokenUpdate,
    onPhaseComplete: callbacks?.onPhaseComplete,
  });
}

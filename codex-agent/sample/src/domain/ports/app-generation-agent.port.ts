/**
 * Agent action types that can be executed
 */
export type AgentAction =
  | {
      type: 'update_file';
      path: string;
      content: string;
    }
  | {
      type: 'run_command';
      command: string;
    }
  | {
      type: 'message';
      text: string;
    }
  | {
      type: 'finish';
      summary: string;
    };

/**
 * Request to execute one iteration of the agent
 */
export interface AgentIterationRequest {
  task: string;
  transcript: string;
  workspaceFiles: string[];
  allowedCommands: string[];
  workspaceRoot: string;
  threadId?: string;
}

/**
 * Result from executing one iteration
 */
export interface AgentIterationResult {
  actions: AgentAction[];
  responseText: string;
  threadId: string;
}

/**
 * Port interface for app generation agent.
 * This abstracts the specific AI service (Codex, Claude, etc.) from the domain logic.
 * The infrastructure layer owns the implementation details (prompts, parsing, etc.).
 */
export interface AppGenerationAgent {
  /**
   * Execute one iteration of the agent workflow
   * @param request - Context needed for the iteration
   * @returns The actions to execute and metadata
   */
  executeIteration(request: AgentIterationRequest): Promise<AgentIterationResult>;
}

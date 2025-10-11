/**
 * Port interface for code generation agent
 * Defines the contract for AI-powered code generation
 * 
 * This abstracts the specific AI service (Codex, Claude, etc.) from the domain logic.
 * Following Clean Architecture principles, this port belongs to the Domain layer.
 */
export interface CodeGenerationAgent {
  /**
   * Generate application code based on a natural language task
   * 
   * @param task - Natural language description of what to build
   * @param workspaceDir - Absolute path to the workspace directory
   * @returns Result containing success status, summary, actions taken, and thread ID
   */
  generateApp(task: string, workspaceDir: string): Promise<CodeGenerationResult>;
}

/**
 * Result of code generation
 */
export interface CodeGenerationResult {
  success: boolean;
  summary: string;
  threadId: string;
  actions: CodeGenerationAction[];
}

/**
 * Actions taken during code generation
 * Represents tool calls made by the AI agent
 */
export interface CodeGenerationAction {
  type: string;
  tool_name?: string;
  tool_args?: Record<string, any>;
  tool_result?: any;
  content?: string;
}

import type { CodexCompletion } from '@domain/entities/codex-completion';
import type { CodexPrompt } from '@domain/entities/codex-prompt';

/**
 * Options for running a prompt in a thread.
 */
export interface RunPromptOptions {
  threadId?: string;
}

/**
 * Result of running a prompt through Codex.
 */
export interface CodexThreadResult {
  completion: CodexCompletion;
  threadId?: string;
}

/**
 * Port interface for running Codex prompts in threads.
 * This is an infrastructure-level port, not a domain port.
 * It represents the contract between different infrastructure components.
 */
export interface CodexThreadRunner {
  runPrompt(prompt: CodexPrompt, options?: RunPromptOptions): Promise<CodexThreadResult>;
}

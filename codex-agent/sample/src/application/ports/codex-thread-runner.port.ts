import type { Usage } from '@openai/codex-sdk';

import type { CodexCompletion } from '@domain/entities/codex-completion';
import type { CodexPrompt } from '@domain/entities/codex-prompt';

export interface RunPromptOptions {
  threadId?: string;
}

export interface CodexThreadResult {
  completion: CodexCompletion;
  threadId: string | null;
  usage: Usage | null;
}

/**
 * Port interface for running Codex prompts in a thread context.
 * This follows the Dependency Inversion Principle - the application layer
 * defines the interface, and the infrastructure layer implements it.
 */
export interface CodexThreadRunner {
  runPrompt(prompt: CodexPrompt, options?: RunPromptOptions): Promise<CodexThreadResult>;
}

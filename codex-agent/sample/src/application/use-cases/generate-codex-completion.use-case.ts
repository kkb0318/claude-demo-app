import { z } from 'zod';

import type { Usage } from '@openai/codex-sdk';

import { CodexCompletion } from '@domain/entities/codex-completion';
import { CodexPrompt } from '@domain/entities/codex-prompt';

import type { CodexThreadResult, CodexThreadRunner } from '@infrastructure/adapters/codex-thread-service';

const InputSchema = z.object({
  prompt: z.string(),
  threadId: z.string().optional()
});

export type GenerateCodexCompletionInput = z.infer<typeof InputSchema>;

export interface GenerateCodexCompletionResult {
  completion: CodexCompletion;
  threadId: string | null;
  usage: Usage | null;
}

export class GenerateCodexCompletionUseCase {
  constructor(private readonly runner: CodexThreadRunner) {}

  async execute(input: GenerateCodexCompletionInput): Promise<GenerateCodexCompletionResult> {
    const parsed = InputSchema.parse(input);
    const prompt = CodexPrompt.create(parsed.prompt);

    const result: CodexThreadResult = await this.runner.runPrompt(prompt, {
      threadId: parsed.threadId
    });

    return result;
  }
}

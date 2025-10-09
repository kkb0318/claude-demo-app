import { describe, expect, it } from 'vitest';

import { GenerateCodexCompletionUseCase } from '@application/use-cases/generate-codex-completion.use-case';
import { CodexCompletion } from '@domain/entities/codex-completion';
import { CodexPrompt } from '@domain/entities/codex-prompt';

import type {
  CodexThreadResult,
  CodexThreadRunner
} from '@infrastructure/adapters/codex-thread-service';

class FakeCodexThreadRunner implements CodexThreadRunner {
  public readonly received: Array<{ prompt: string; threadId?: string }> = [];

  async runPrompt(prompt: CodexPrompt, options?: { threadId?: string }): Promise<CodexThreadResult> {
    this.received.push({ prompt: prompt.value, threadId: options?.threadId });

    return {
      completion: CodexCompletion.create({ text: `response for: ${prompt.value}` }),
      threadId: 'thread-123',
      usage: null
    };
  }
}

describe('GenerateCodexCompletionUseCase (integration)', () => {
  it('flows from use case to gateway and returns completion', async () => {
    const runner = new FakeCodexThreadRunner();
    const useCase = new GenerateCodexCompletionUseCase(runner);

    const result = await useCase.execute({ prompt: 'compose a haiku' });

    expect(result.completion.text).toBe('response for: compose a haiku');
    expect(result.threadId).toBe('thread-123');
    expect(runner.received).toHaveLength(1);
  });
});

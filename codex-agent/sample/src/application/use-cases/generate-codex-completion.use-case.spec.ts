import { describe, expect, it, vi } from 'vitest';

import { CodexCompletion } from '@domain/entities/codex-completion';

import type { CodexThreadRunner } from '@infrastructure/adapters/codex-thread-service';

import { GenerateCodexCompletionUseCase } from './generate-codex-completion.use-case';

describe('GenerateCodexCompletionUseCase', () => {
  const createRunner = () => {
    const runPrompt = vi.fn().mockResolvedValue({
      completion: CodexCompletion.create({ text: 'result' }),
      threadId: 'thread-123',
      usage: null
    });

    return {
      runPrompt
    } as CodexThreadRunner & { runPrompt: ReturnType<typeof vi.fn> };
  };

  it('delegates to thread runner with new thread when threadId omitted', async () => {
    const runner = createRunner();
    const useCase = new GenerateCodexCompletionUseCase(runner);

    const result = await useCase.execute({ prompt: 'write a poem about TypeScript' });

    expect(runner.runPrompt).toHaveBeenCalledWith(expect.anything(), { threadId: undefined });
    expect(result.completion.text).toBe('result');
    expect(result.threadId).toBe('thread-123');
  });

  it('resumes existing thread when threadId provided', async () => {
    const runner = createRunner();
    const useCase = new GenerateCodexCompletionUseCase(runner);

    await useCase.execute({ prompt: 'continue work', threadId: 'existing-thread' });

    expect(runner.runPrompt).toHaveBeenCalledWith(expect.anything(), {
      threadId: 'existing-thread'
    });
  });

  it('throws when prompt is invalid', async () => {
    const runner = createRunner();
    const useCase = new GenerateCodexCompletionUseCase(runner);

    await expect(
      useCase.execute({
        prompt: ''
      })
    ).rejects.toThrow();
  });
});

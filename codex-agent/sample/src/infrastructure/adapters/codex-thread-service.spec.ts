import { describe, expect, it, vi } from 'vitest';

import { CodexCompletion } from '@domain/entities/codex-completion';
import { CodexPrompt } from '@domain/entities/codex-prompt';

import type { CodexSdkInterface, CodexSdkThread } from './codex-sdk.interface';
import { CodexThreadService } from './codex-thread-service';

describe('CodexThreadService', () => {
  const createThread = (overrides: Partial<CodexSdkThread> = {}): CodexSdkThread => ({
    id: 'thread-123',
    run: vi.fn().mockResolvedValue({
      items: [],
      finalResponse: 'hello world',
      usage: null
    }),
    ...overrides
  });

  const createSdk = (thread: CodexSdkThread): CodexSdkInterface => ({
    startThread: vi.fn().mockReturnValue(thread),
    resumeThread: vi.fn().mockReturnValue(thread)
  });

  it('runs prompt on a new thread when no threadId provided', async () => {
    const thread = createThread();
    const sdk = createSdk(thread);
    const service = new CodexThreadService(sdk);

    const result = await service.runPrompt(CodexPrompt.create('say hi'));

    expect(sdk.startThread).toHaveBeenCalledTimes(1);
    expect(thread.run).toHaveBeenCalledWith('say hi');
    expect(result.completion).toBeInstanceOf(CodexCompletion);
    expect(result.threadId).toBe('thread-123');
  });

  it('resumes an existing thread when threadId is provided', async () => {
    const thread = createThread();
    const sdk = createSdk(thread);
    const service = new CodexThreadService(sdk);

    await service.runPrompt(CodexPrompt.create('continue'), { threadId: 'previous' });

    expect(sdk.resumeThread).toHaveBeenCalledWith('previous');
    expect(sdk.startThread).not.toHaveBeenCalled();
  });

  it('throws when Codex returns an empty response', async () => {
    const emptyThread = createThread({
      run: vi.fn().mockResolvedValue({ items: [], finalResponse: '', usage: null })
    });
    const sdk = createSdk(emptyThread);
    const service = new CodexThreadService(sdk);

    await expect(service.runPrompt(CodexPrompt.create('prompt'))).rejects.toThrow(
      /empty response/
    );
  });
});

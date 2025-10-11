import { describe, expect, it, vi } from 'vitest';

import { CodexCompletion } from '@domain/entities/codex-completion';
import { CodexPrompt } from '@domain/entities/codex-prompt';

import type { Thread as CodexThread } from '@openai/codex-sdk';

import { CodexSdkClient } from './codex-sdk.client';
import { CodexThreadService } from './codex-thread-service';

describe('CodexThreadService', () => {
  const createThread = (overrides: Partial<CodexThread> = {}): CodexThread => ({
    id: 'thread-123',
    run: vi.fn().mockResolvedValue({
      items: [],
      finalResponse: 'hello world',
      usage: null
    }),
    ...overrides
  } as CodexThread);

  const createClient = (thread: CodexThread): CodexSdkClient => ({
    startThread: vi.fn().mockReturnValue(thread),
    resumeThread: vi.fn().mockReturnValue(thread)
  } as unknown as CodexSdkClient);

  it('runs prompt on a new thread when no threadId provided', async () => {
    const thread = createThread();
    const client = createClient(thread);
    const service = new CodexThreadService(client);

    const result = await service.runPrompt(CodexPrompt.create('say hi'));

    expect(client.startThread).toHaveBeenCalledTimes(1);
    expect(thread.run).toHaveBeenCalledWith('say hi');
    expect(result.completion).toBeInstanceOf(CodexCompletion);
    expect(result.threadId).toBe('thread-123');
  });

  it('resumes an existing thread when threadId is provided', async () => {
    const thread = createThread();
    const client = createClient(thread);
    const service = new CodexThreadService(client);

    await service.runPrompt(CodexPrompt.create('continue'), { threadId: 'previous' });

    expect(client.resumeThread).toHaveBeenCalledWith('previous');
    expect(client.startThread).not.toHaveBeenCalled();
  });

  it('throws when Codex returns an empty response', async () => {
    const emptyThread = createThread({
      run: vi.fn().mockResolvedValue({ items: [], finalResponse: '', usage: null })
    });
    const client = createClient(emptyThread);
    const service = new CodexThreadService(client);

    await expect(service.runPrompt(CodexPrompt.create('prompt'))).rejects.toThrow(
      /empty response/
    );
  });
});

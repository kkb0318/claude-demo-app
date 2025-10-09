import { describe, expect, it, vi } from 'vitest';

import { CodexSdkClient } from './codex-sdk.client';

const createThread = () => {
  return {
    id: 'thread-1',
    run: vi.fn().mockResolvedValue({ items: [], finalResponse: 'ok', usage: null })
  };
};

describe('CodexSdkClient', () => {
  it('wraps startThread and exposes thread metadata', async () => {
    const thread = createThread();
    const codex = {
      startThread: vi.fn().mockReturnValue(thread),
      resumeThread: vi.fn().mockReturnValue(thread)
    } as unknown as import('@openai/codex-sdk').Codex;

    const client = new CodexSdkClient(codex);

    const wrappedThread = client.startThread();
    expect(codex.startThread).toHaveBeenCalled();
    expect(wrappedThread.id).toBe('thread-1');
  await wrappedThread.run('hello');
  expect(thread.run).toHaveBeenCalledWith('hello', undefined);
  });

  it('wraps resumeThread', async () => {
    const thread = createThread();
    const codex = {
      startThread: vi.fn(),
      resumeThread: vi.fn().mockReturnValue(thread)
    } as unknown as import('@openai/codex-sdk').Codex;

    const client = new CodexSdkClient(codex);

    const wrappedThread = client.resumeThread('thread-99');
  expect(codex.resumeThread).toHaveBeenCalledWith('thread-99', undefined);
  await wrappedThread.run('again');
  expect(thread.run).toHaveBeenCalledWith('again', undefined);
  });
});

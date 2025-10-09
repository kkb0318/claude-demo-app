import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@openai/codex-sdk', () => {
  return {
    Codex: vi.fn().mockImplementation((options: Record<string, unknown>) => ({
      options,
      startThread: vi.fn().mockReturnValue({
        id: 'thread',
        run: vi.fn()
      }),
      resumeThread: vi.fn().mockReturnValue({
        id: 'thread',
        run: vi.fn()
      })
    }))
  };
});

import {
  createCodexClient,
  loadCodexEnvironment,
  resetCodexEnvironmentCache
} from './codex.config';

describe('codex.config', () => {
  beforeEach(() => {
    resetCodexEnvironmentCache();
  });

  it('loads environment variables and trims values', () => {
    const env = loadCodexEnvironment({
      CODEX_API_KEY: ' test-key ',
      CODEX_BASE_URL: 'https://example.com'
    } as NodeJS.ProcessEnv);

    expect(env).toEqual({
      apiKey: 'test-key',
      baseUrl: 'https://example.com'
    });
  });

  it('falls back to OPENAI_API_KEY when CODEX_API_KEY is absent', () => {
    const env = loadCodexEnvironment({
      OPENAI_API_KEY: ' openai-key '
    } as NodeJS.ProcessEnv);

    expect(env).toEqual({
      apiKey: 'openai-key',
      baseUrl: undefined
    });
  });

  it('reuses the same Codex client instance', () => {
    const environment = loadCodexEnvironment({
      CODEX_API_KEY: 'key'
    } as NodeJS.ProcessEnv);

    const firstClient = createCodexClient(environment);
    const secondClient = createCodexClient(environment);

    expect(secondClient).toBe(firstClient);
  });

  it('throws helpful error when no API key is provided', () => {
    expect(() => loadCodexEnvironment({} as NodeJS.ProcessEnv)).toThrow(
      /CODEX_API_KEY or OPENAI_API_KEY/
    );
  });
});

import { beforeEach, describe, expect, it } from 'vitest';

import {
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

  it('throws helpful error when no API key is provided', () => {
    expect(() => loadCodexEnvironment({} as NodeJS.ProcessEnv)).toThrow(
      /CODEX_API_KEY or OPENAI_API_KEY/
    );
  });
});

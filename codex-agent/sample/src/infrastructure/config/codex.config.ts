import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

const envSchema = z.object({
  CODEX_API_KEY: z
    .string()
    .min(1, 'Set CODEX_API_KEY or OPENAI_API_KEY with a non-empty value')
    .trim(),
  CODEX_BASE_URL: z.string().url().optional()
});

export type CodexEnvironment = {
  apiKey: string;
  baseUrl?: string;
};

let cachedEnvironment: CodexEnvironment | undefined;

export function loadCodexEnvironment(env: NodeJS.ProcessEnv = process.env): CodexEnvironment {
  if (!cachedEnvironment) {
    loadEnv();

    const candidateApiKey = env.CODEX_API_KEY ?? env.OPENAI_API_KEY;

    if (!candidateApiKey) {
      throw new Error(
        'Missing Codex API key. Provide CODEX_API_KEY or OPENAI_API_KEY via environment variables or a .env file in sample/. '
      );
    }

    const parsed = envSchema.parse({
      CODEX_API_KEY: candidateApiKey,
      CODEX_BASE_URL: env.CODEX_BASE_URL
    });

    cachedEnvironment = {
      apiKey: parsed.CODEX_API_KEY,
      baseUrl: parsed.CODEX_BASE_URL
    };
  }

  return cachedEnvironment;
}

export function resetCodexEnvironmentCache(): void {
  cachedEnvironment = undefined;
}

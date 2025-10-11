import {
  Codex,
  Thread as CodexThread,
  type ThreadOptions
} from '@openai/codex-sdk';

/**
 * Wrapper for Codex SDK Client
 * Simplifies and encapsulates the Codex SDK API for use within the infrastructure layer.
 * Note: This is a concrete class, not an interface, as it's used only within the infrastructure layer.
 */
export class CodexSdkClient {
  constructor(private readonly codex: Codex = new Codex()) {}

  startThread(options?: ThreadOptions): CodexThread {
    return this.codex.startThread(options);
  }

  resumeThread(id: string, options?: ThreadOptions): CodexThread {
    return this.codex.resumeThread(id, options);
  }
}

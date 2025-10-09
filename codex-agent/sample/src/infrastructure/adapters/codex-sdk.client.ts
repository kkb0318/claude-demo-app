import {
  Codex,
  Thread as CodexThread,
  type RunResult,
  type ThreadOptions,
  type TurnOptions
} from '@openai/codex-sdk';

import type { CodexSdkInterface, CodexSdkThread } from './codex-sdk.interface';

class ThreadWrapper implements CodexSdkThread {

  constructor(private readonly thread: CodexThread) { }

  get id(): string | null {
    return this.thread.id;
  }

  run(input: string, turnOptions?: TurnOptions): Promise<RunResult> {
    return this.thread.run(input, turnOptions);
  }
}

export class CodexSdkClient implements CodexSdkInterface {
  constructor(private readonly codex: Codex = new Codex()) { }

  startThread(options?: ThreadOptions): CodexSdkThread {
    return new ThreadWrapper(this.codex.startThread(options));
  }

  resumeThread(id: string, options?: ThreadOptions): CodexSdkThread {
    return new ThreadWrapper(this.codex.resumeThread(id, options));
  }
}

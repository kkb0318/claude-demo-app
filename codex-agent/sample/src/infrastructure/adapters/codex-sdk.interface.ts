import type {
  RunResult,
  ThreadOptions,
  TurnOptions
} from '@openai/codex-sdk';

export interface CodexSdkThread {
  readonly id: string | null;
  run(input: string, turnOptions?: TurnOptions): Promise<RunResult>;
}

export interface CodexSdkInterface {
  startThread(options?: ThreadOptions): CodexSdkThread;
  resumeThread(id: string, options?: ThreadOptions): CodexSdkThread;
}

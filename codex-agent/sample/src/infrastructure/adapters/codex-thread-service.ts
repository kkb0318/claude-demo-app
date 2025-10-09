import type { Usage } from '@openai/codex-sdk';

import { CodexCompletion } from '@domain/entities/codex-completion';
import { CodexPrompt } from '@domain/entities/codex-prompt';

import type { CodexSdkInterface } from './codex-sdk.interface';

export interface RunPromptOptions {
  threadId?: string;
}

export interface CodexThreadResult {
  completion: CodexCompletion;
  threadId: string | null;
  usage: Usage | null;
}

export interface CodexThreadRunner {
  runPrompt(prompt: CodexPrompt, options?: RunPromptOptions): Promise<CodexThreadResult>;
}

export class CodexThreadService implements CodexThreadRunner {
  constructor(private readonly sdk: CodexSdkInterface) {}

  async runPrompt(prompt: CodexPrompt, options: RunPromptOptions = {}): Promise<CodexThreadResult> {
    const thread = options.threadId
      ? this.sdk.resumeThread(options.threadId)
      : this.sdk.startThread();

    const turn = await thread.run(prompt.value);

    const finalResponse = turn.finalResponse?.trim();
    if (!finalResponse) {
      throw new Error('Codex returned an empty response');
    }

    const completion = CodexCompletion.create({ text: finalResponse });

    return {
      completion,
      threadId: thread.id,
      usage: turn.usage
    };
  }
}

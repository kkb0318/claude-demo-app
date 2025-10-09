import { CodexCompletion } from '@domain/entities/codex-completion';
import type { CodexPrompt } from '@domain/entities/codex-prompt';
import type {
  CodexThreadRunner,
  CodexThreadResult,
  RunPromptOptions
} from '@application/ports/codex-thread-runner.port';

import type { CodexSdkInterface } from './codex-sdk.interface';

/**
 * Implementation of CodexThreadRunner port using the Codex SDK.
 * This adapter translates between the application's port interface
 * and the external Codex SDK.
 */
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

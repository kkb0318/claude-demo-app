import { CodexCompletion } from '@domain/entities/codex-completion';
import type { CodexPrompt } from '@domain/entities/codex-prompt';
import type {
  CodexThreadRunner,
  CodexThreadResult,
  RunPromptOptions
} from './codex-thread-runner.port';

import type { CodexSdkClient } from './codex-sdk.client';

/**
 * Implementation of CodexThreadRunner port using the Codex SDK.
 * This adapter translates between the application's port interface
 * and the external Codex SDK via CodexSdkClient.
 * 
 * Note: Depends on concrete class CodexSdkClient, which is acceptable
 * within the infrastructure layer. The DIP boundary is at the application/infrastructure
 * layer boundary (CodexThreadRunner interface).
 */
export class CodexThreadService implements CodexThreadRunner {
  constructor(private readonly client: CodexSdkClient) {}

  async runPrompt(prompt: CodexPrompt, options: RunPromptOptions = {}): Promise<CodexThreadResult> {
    const thread = options.threadId
      ? this.client.resumeThread(options.threadId)
      : this.client.startThread();

    const turn = await thread.run(prompt.value);

    const finalResponse = turn.finalResponse?.trim();
    if (!finalResponse) {
      throw new Error('Codex returned an empty response');
    }

    const completion = CodexCompletion.create({ text: finalResponse });

    return {
      completion,
      threadId: thread.id ?? undefined
    };
  }
}

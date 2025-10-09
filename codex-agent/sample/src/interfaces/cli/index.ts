/* c8 ignore start */

import { GenerateCodexCompletionUseCase } from '@application/use-cases/generate-codex-completion.use-case';
import { CodexThreadService } from '@infrastructure/adapters/codex-thread-service';
import { createCodexClient, loadCodexEnvironment } from '@infrastructure/config/codex.config';

import { runCli } from './cli-runner';

async function bootstrap(): Promise<void> {
  const environment = loadCodexEnvironment();
  const client = createCodexClient(environment);
  const threadService = new CodexThreadService(client);
  const useCase = new GenerateCodexCompletionUseCase(threadService);

  const exitCode = await runCli({
    args: process.argv.slice(2),
    useCase,
    stdout: (message) => console.log(message),
    stderr: (message) => console.error(message)
  });

  process.exitCode = exitCode;
}

bootstrap().catch((error) => {
  console.error('Unexpected failure', error);
  process.exitCode = 1;
});

/* c8 ignore stop */

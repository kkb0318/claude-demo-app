import { GenerateCodexCompletionUseCase } from '@application/use-cases/generate-codex-completion.use-case';

interface ParsedArgs {
  prompt?: string;
  threadId?: string;
  helpRequested: boolean;
}

export interface RunCliDependencies {
  args: string[];
  useCase: GenerateCodexCompletionUseCase;
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

export function parseCliArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    helpRequested: false
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      result.helpRequested = true;
      continue;
    }

    if (arg.startsWith('--prompt=')) {
      result.prompt = arg.slice('--prompt='.length);
      continue;
    }

    if (arg.startsWith('--thread=')) {
      result.threadId = arg.slice('--thread='.length);
      continue;
    }

    if (!arg.startsWith('--') && !result.prompt) {
      result.prompt = arg;
      continue;
    }
  }

  return result;
}

export function buildHelpMessage(): string {
  return [
    'Codex CLI Sample',
    '',
    'Usage:',
    '  pnpm start -- --prompt="Write a hello world script" [--thread=<thread-id>]',
    '',
    'Options:',
    '  --prompt=TEXT      Prompt text to send to Codex (or supply as first positional argument)',
    '  --thread=ID        Resume an existing Codex thread by id',
    '  --help             Show this message'
  ].join('\n');
}

export async function runCli({ args, useCase, stdout, stderr }: RunCliDependencies): Promise<number> {
  const parsed = parseCliArgs(args);

  if (parsed.helpRequested) {
    stdout(buildHelpMessage());
    return 0;
  }

  if (!parsed.prompt) {
    stderr('Error: prompt is required. Use --help for usage information.');
    return 1;
  }

  try {
    const result = await useCase.execute({
      prompt: parsed.prompt,
      threadId: parsed.threadId
    });

    stdout(result.completion.text);
    if (result.threadId) {
      stdout(`\n[thread id: ${result.threadId}]`);
    }

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    stderr(`Codex request failed: ${message}`);
    return 1;
  }
}

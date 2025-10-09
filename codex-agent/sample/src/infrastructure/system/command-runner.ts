import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import type {
  CommandExecutionResult,
  CommandRunner
} from '@application/ports/command-runner.port';

const execAsync = promisify(exec);

export class ShellCommandRunner implements CommandRunner {
  constructor(private readonly cwd: string, private readonly allowList: string[]) {}

  allowedCommands(): string[] {
    return [...this.allowList];
  }

  async run(command: string): Promise<CommandExecutionResult> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.cwd,
        maxBuffer: 1024 * 1024 * 8
      });

      return {
        command,
        exitCode: 0,
        stdout,
        stderr
      };
    } catch (error) {
      const execError = error as { code?: number; stdout?: string; stderr?: string };
      return {
        command,
        exitCode: typeof execError.code === 'number' ? execError.code : 1,
        stdout: execError.stdout ?? '',
        stderr: execError.stderr ?? String(error)
      };
    }
  }
}

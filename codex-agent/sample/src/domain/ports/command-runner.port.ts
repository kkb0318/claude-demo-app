/**
 * Result of executing a shell command.
 */
export interface CommandExecutionResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
}

/**
 * Port interface for running shell commands.
 * Implements a whitelist approach for security.
 */
export interface CommandRunner {
  run(command: string): Promise<CommandExecutionResult>;
  allowedCommands(): string[];
}

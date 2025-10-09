import { describe, expect, it } from 'vitest';

import type { AgentWorkspace } from '@application/ports/agent-workspace.port';
import type { CommandExecutionResult, CommandRunner } from '@application/ports/command-runner.port';
import type { CodexThreadRunner } from '@application/ports/codex-thread-runner.port';
import { CodexCompletion } from '@domain/entities/codex-completion';

import { CodingAgentRunner } from './coding-agent';

class StubThreadRunner implements CodexThreadRunner {
  private callCount = 0;

  constructor(private readonly responses: string[]) {}

  async runPrompt(): Promise<{
    completion: CodexCompletion;
    threadId: string | null;
    usage: { input_tokens: number; cached_input_tokens: number; output_tokens: number; total_tokens: number } | null;
  }> {
    if (this.callCount >= this.responses.length) {
      throw new Error('No more stubbed responses.');
    }

    const text = this.responses[this.callCount];
    this.callCount += 1;

    return {
      completion: CodexCompletion.create({ text }),
      threadId: 'thread-123',
      usage: null
    };
  }
}

class InMemoryWorkspace implements AgentWorkspace {
  readonly files = new Map<string, string>();

  constructor(public readonly rootDir: string, seed: Record<string, string> = {}) {
    Object.entries(seed).forEach(([path, content]) => {
      this.files.set(path, content);
    });
  }

  writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
    return Promise.resolve();
  }

  readFile(path: string): Promise<string> {
    const value = this.files.get(path);
    if (!value) {
      throw new Error(`File not found: ${path}`);
    }
    return Promise.resolve(value);
  }

  listProjectFiles(): Promise<string[]> {
    return Promise.resolve(Array.from(this.files.keys()).sort());
  }
}

class StubCommandRunner implements CommandRunner {
  constructor(
    private readonly allowList: string[],
    private readonly results: Record<string, CommandExecutionResult>
  ) {}

  allowedCommands(): string[] {
    return [...this.allowList];
  }

  run(command: string): Promise<CommandExecutionResult> {
    const result = this.results[command];
    if (!result) {
      throw new Error(`No stubbed command result for ${command}`);
    }
    return Promise.resolve(result);
  }
}

describe('CodingAgentRunner', () => {
  it('executes actions across iterations until finish', async () => {
    const runner = new StubThreadRunner([
      `{"actions":[{"type":"message","text":"Starting"},{"type":"update_file","path":"src/example.ts","content":"export const value = 1;"}]}`,
      `{"actions":[{"type":"run_command","command":"pnpm test"},{"type":"finish","summary":"All good"}]}`
    ]);

    const workspace = new InMemoryWorkspace('/repo', {
      'src/example.ts': 'export const value = 0;'
    });

    const commandRunner = new StubCommandRunner(['pnpm test'], {
      'pnpm test': {
        command: 'pnpm test',
        exitCode: 0,
        stdout: 'PASS',
        stderr: ''
      }
    });

    const agent = new CodingAgentRunner(runner, workspace, commandRunner);

    const result = await agent.run({ task: 'Update the value constant', maxIterations: 3, enforceRequiredCommands: false });

    expect(result.summary).toBe('All good');
    expect(result.iterations).toHaveLength(2);
    expect(workspace.files.get('src/example.ts')).toBe('export const value = 1;');
    expect(result.iterations[1]?.commandResults[0]?.stdout).toContain('PASS');
  });

  it('rejects unsafe file paths in update actions', async () => {
    const runner = new StubThreadRunner([
      `{"actions":[{"type":"update_file","path":"../outside.txt","content":"malicious"}]}`
    ]);

    const workspace = new InMemoryWorkspace('/repo');
    const commandRunner = new StubCommandRunner([], {});
    const agent = new CodingAgentRunner(runner, workspace, commandRunner);

    await expect(agent.run({ task: 'Do something dangerous', maxIterations: 1 })).rejects.toThrow(
      /Path .* is not allowed/
    );
  });

  it('parses responses wrapped in JSON fences', async () => {
    const runner = new StubThreadRunner([
      '```json\n{"actions":[{"type":"message","text":"Hi"},{"type":"finish","summary":"Done"}]}\n```'
    ]);

    const workspace = new InMemoryWorkspace('/repo');
    const commandRunner = new StubCommandRunner([], {});
    const agent = new CodingAgentRunner(runner, workspace, commandRunner);

    const result = await agent.run({ task: 'Say hello', maxIterations: 1, enforceRequiredCommands: false });

    expect(result.summary).toBe('Done');
    expect(result.iterations).toHaveLength(1);
  });

  it('rejects empty file paths in update actions', async () => {
    const runner = new StubThreadRunner([
      `{"actions":[{"type":"update_file","path":"","content":"malicious"}]}`
    ]);

    const workspace = new InMemoryWorkspace('/repo');
    const commandRunner = new StubCommandRunner([], {});
    const agent = new CodingAgentRunner(runner, workspace, commandRunner);

    await expect(agent.run({ task: 'Missing path', maxIterations: 1 })).rejects.toThrow(
      /requires a path/
    );
  });

  it('rejects absolute file paths in update actions', async () => {
    const runner = new StubThreadRunner([
      `{"actions":[{"type":"update_file","path":"/etc/passwd","content":"malicious"}]}`
    ]);

    const workspace = new InMemoryWorkspace('/repo');
    const commandRunner = new StubCommandRunner([], {});
    const agent = new CodingAgentRunner(runner, workspace, commandRunner);

    await expect(agent.run({ task: 'Absolute path', maxIterations: 1 })).rejects.toThrow(
      /must be relative/
    );
  });

  it('rejects commands that are not allow-listed', async () => {
    const runner = new StubThreadRunner([
      `{"actions":[{"type":"run_command","command":"pnpm lint"}]}`
    ]);

    const workspace = new InMemoryWorkspace('/repo');
    const commandRunner = new StubCommandRunner(['pnpm test'], {});
    const agent = new CodingAgentRunner(runner, workspace, commandRunner);

    await expect(agent.run({ task: 'Disallowed command', maxIterations: 1 })).rejects.toThrow(
      /Command pnpm lint is not allowed/
    );
  });

  it('returns fallback summary when no finish action is received', async () => {
    const seedFiles = Object.fromEntries(
      Array.from({ length: 45 }, (_, index) => [`src/file-${index}.ts`, `// file ${index}`] as const)
    );

    const runner = new StubThreadRunner([
      `{"actions":[{"type":"message","text":"still working"}]}`
    ]);

    const workspace = new InMemoryWorkspace('/repo', seedFiles);
    const commandRunner = new StubCommandRunner([], {});
    const agent = new CodingAgentRunner(runner, workspace, commandRunner);

    const result = await agent.run({ task: 'Long running task', maxIterations: 1 });

    expect(result.summary).toMatch(/Reached maximum iterations/);
    expect(result.iterations).toHaveLength(1);
    expect(result.iterations[0]?.requestPrompt).toContain('... (truncated)');
  });

  it('captures stderr output from failed commands', async () => {
    const runner = new StubThreadRunner([
      `{"actions":[{"type":"run_command","command":"pnpm test"}]}`,
      `{"actions":[{"type":"finish","summary":"Fixed"}]}`
    ]);

    const workspace = new InMemoryWorkspace('/repo');
    const commandRunner = new StubCommandRunner(['pnpm test'], {
      'pnpm test': {
        command: 'pnpm test',
        exitCode: 1,
        stdout: '',
        stderr: 'Failure'
      }
    });

    const agent = new CodingAgentRunner(runner, workspace, commandRunner);

    const result = await agent.run({ task: 'Handle failures', maxIterations: 2, enforceRequiredCommands: false });

    expect(result.summary).toBe('Fixed');
    expect(result.iterations[0]?.commandResults[0]?.stderr).toBe('Failure');
  });

  it('throws when agent response lacks actions', async () => {
    const runner = new StubThreadRunner(['{}']);
    const workspace = new InMemoryWorkspace('/repo');
    const commandRunner = new StubCommandRunner([], {});
    const agent = new CodingAgentRunner(runner, workspace, commandRunner);

    await expect(agent.run({ task: 'Invalid response', maxIterations: 1 })).rejects.toThrow(
      /missing actions array/
    );
  });

  it('propagates JSON parsing errors from agent responses', async () => {
    const runner = new StubThreadRunner(['```json\n{invalid json}\n```']);
    const workspace = new InMemoryWorkspace('/repo');
    const commandRunner = new StubCommandRunner([], {});
    const agent = new CodingAgentRunner(runner, workspace, commandRunner);

    await expect(agent.run({ task: 'Bad json', maxIterations: 1 })).rejects.toThrow();
  });

  it('throws on unsupported agent action types', async () => {
    const runner = new StubThreadRunner(['{"actions":[{"type":"unexpected"}]}']);
    const workspace = new InMemoryWorkspace('/repo');
    const commandRunner = new StubCommandRunner([], {});
    const agent = new CodingAgentRunner(runner, workspace, commandRunner);

    await expect(agent.run({ task: 'Unsupported action', maxIterations: 1 })).rejects.toThrow(
      /Unsupported action type/
    );
  });
});

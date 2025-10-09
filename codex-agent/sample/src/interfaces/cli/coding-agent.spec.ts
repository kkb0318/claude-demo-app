import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

const runMock = vi.fn();
const codingAgentRunnerConstructor = vi.fn().mockImplementation(() => ({
  run: runMock
}));

const loadCodexEnvironmentMock = vi.fn(() => ({ apiKey: 'test-key' }));
const createCodexClientMock = vi.fn(() => ({ client: 'mock' }));
const threadServiceConstructor = vi.fn();
const prepareWorkspaceMock = vi.fn();
const commandRunnerConstructor = vi.fn();

vi.mock('@application/services/coding-agent', () => ({
  CodingAgentRunner: codingAgentRunnerConstructor
}));

vi.mock('@infrastructure/config/codex.config', () => ({
  loadCodexEnvironment: loadCodexEnvironmentMock,
  createCodexClient: createCodexClientMock
}));

vi.mock('@infrastructure/adapters/codex-thread-service', () => ({
  CodexThreadService: threadServiceConstructor
}));

vi.mock('@infrastructure/system/workspace', () => ({
  prepareWorkspace: prepareWorkspaceMock
}));

vi.mock('@infrastructure/system/command-runner', () => ({
  ShellCommandRunner: commandRunnerConstructor
}));

describe('coding-agent CLI', () => {
  const originalArgv = [...process.argv];
  const originalMaxIterations = process.env.AGENT_MAX_ITERATIONS;
  let consoleLog: MockInstance<[message?: unknown, ...optionalParams: unknown[]], void>;

  beforeEach(() => {
    runMock.mockReset();
    runMock.mockResolvedValue({
      summary: 'done',
      threadId: 'thread-123',
      iterations: [
        {
          iteration: 1,
          requestPrompt: 'prompt-1',
          responseText: '{"actions":[]}',
          executedActions: [],
          commandResults: [
            {
              command: 'pnpm test',
              exitCode: 0,
              stdout: 'PASS',
              stderr: 'Issue'
            }
          ]
        },
        {
          iteration: 2,
          requestPrompt: 'prompt-2',
          responseText: '{"actions":[]}',
          executedActions: [],
          commandResults: []
        }
      ]
    });
    codingAgentRunnerConstructor.mockClear();
    loadCodexEnvironmentMock.mockClear();
    createCodexClientMock.mockClear();
    threadServiceConstructor.mockClear();
    commandRunnerConstructor.mockClear();
    prepareWorkspaceMock.mockReset();
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    prepareWorkspaceMock.mockResolvedValue({ rootDir: '/tmp/test-workspace' });
    if (originalMaxIterations === undefined) {
      delete process.env.AGENT_MAX_ITERATIONS;
    } else {
      process.env.AGENT_MAX_ITERATIONS = originalMaxIterations;
    }
  });

  afterEach(() => {
    process.argv = [...originalArgv];
    if (originalMaxIterations === undefined) {
      delete process.env.AGENT_MAX_ITERATIONS;
    } else {
      process.env.AGENT_MAX_ITERATIONS = originalMaxIterations;
    }
    consoleLog.mockRestore();
  });

  it('runs the coding agent with parsed CLI options', async () => {
    process.argv = ['node', 'script', 'Implement feature'];
    process.env.AGENT_MAX_ITERATIONS = '5';

    const module = await import('./coding-agent');
    await module.runCodingAgentCli();

    expect(loadCodexEnvironmentMock).toHaveBeenCalledTimes(1);
    expect(createCodexClientMock).toHaveBeenCalledTimes(1);
    expect(threadServiceConstructor).toHaveBeenCalledTimes(1);
    expect(prepareWorkspaceMock).toHaveBeenCalledTimes(1);
    expect(commandRunnerConstructor).toHaveBeenCalled();
    expect(codingAgentRunnerConstructor).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith({ task: 'Implement feature', maxIterations: 5 });
    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining('Workspace root: /tmp/test-workspace')
    );
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Agent summary'));
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Thread ID'));
  });

  it('throws when task description is missing', async () => {
    process.argv = ['node', 'script'];

    const module = await import('./coding-agent');
    await expect(module.runCodingAgentCli()).rejects.toThrow(/Missing task description/);
  });

  it('falls back to default iterations when AGENT_MAX_ITERATIONS is invalid', async () => {
    process.argv = ['node', 'script', 'Task'];
    process.env.AGENT_MAX_ITERATIONS = 'invalid';

    const module = await import('./coding-agent');
    await module.runCodingAgentCli();

    expect(runMock).toHaveBeenCalledWith({ task: 'Task', maxIterations: 8 });
  });
});

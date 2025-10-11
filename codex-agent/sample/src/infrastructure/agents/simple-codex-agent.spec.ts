import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimpleCodexAgent } from './simple-codex-agent';
import type { Codex } from '@openai/codex-sdk';

describe('SimpleCodexAgent', () => {
  let agent: SimpleCodexAgent;
  let mockCodex: Codex;
  let mockThread: any;

  beforeEach(() => {
    // Mock thread with run method
    mockThread = {
      run: vi.fn(),
      runStreamed: vi.fn(),
      id: 'thread-123'
    };

    // Mock Codex client
    mockCodex = {
      startThread: vi.fn().mockReturnValue(mockThread)
    } as unknown as Codex;

    agent = new SimpleCodexAgent(mockCodex);
  });

  describe('generateApp', () => {
    it('should start a thread with correct working directory', async () => {
      const workspaceDir = '/test/workspace';
      const task = 'Create a simple app';

      mockThread.run.mockResolvedValue({
        finalResponse: 'App created successfully',
        items: [],
        threadId: 'thread-123'
      });

      await agent.generateApp(task, workspaceDir);

      expect(mockCodex.startThread).toHaveBeenCalledWith({
        workingDirectory: workspaceDir,
        skipGitRepoCheck: true,
        sandboxMode: 'workspace-write'
      });
    });

    it('should run the task and return success result', async () => {
      const task = 'Create a calculator app';
      const workspaceDir = '/test/workspace';

      const mockResult = {
        finalResponse: 'Calculator app created with Next.js',
        items: [
          {
            type: 'tool_call',
            tool_name: 'write_file',
            tool_args: { path: 'src/app/page.tsx', content: '...' }
          }
        ],
        threadId: 'thread-123'
      };

      mockThread.run.mockResolvedValue(mockResult);

      const result = await agent.generateApp(task, workspaceDir);

      expect(mockThread.run).toHaveBeenCalledWith(task);
      expect(result).toEqual({
        success: true,
        summary: 'Calculator app created with Next.js',
        actions: mockResult.items,
        threadId: 'thread-123'
      });
    });

    it('should handle errors and return failure result', async () => {
      const task = 'Invalid task';
      const workspaceDir = '/test/workspace';

      mockThread.run.mockRejectedValue(new Error('Codex execution failed'));

      await expect(agent.generateApp(task, workspaceDir)).rejects.toThrow(
        'Codex execution failed'
      );
    });

    it('should pass through multiple actions from Codex', async () => {
      const task = 'Create and test app';
      const workspaceDir = '/test/workspace';

      const mockResult = {
        finalResponse: 'App created and tested',
        items: [
          {
            type: 'tool_call',
            tool_name: 'write_file',
            tool_args: { path: 'src/app/page.tsx', content: '...' }
          },
          {
            type: 'tool_call',
            tool_name: 'execute_command',
            tool_args: { command: 'npm run lint' },
            tool_result: { exitCode: 0 }
          },
          {
            type: 'tool_call',
            tool_name: 'execute_command',
            tool_args: { command: 'npm run build' },
            tool_result: { exitCode: 0 }
          }
        ],
        threadId: 'thread-456'
      };

      mockThread.run.mockResolvedValue(mockResult);

      const result = await agent.generateApp(task, workspaceDir);

      expect(result.success).toBe(true);
      expect(result.actions).toHaveLength(3);
      expect(result.actions[0].tool_name).toBe('write_file');
      expect(result.actions[1].tool_name).toBe('execute_command');
    });
  });

  describe('generateAppStreaming', () => {
    it('should use runStreamed method', async () => {
      const task = 'Create app with streaming';
      const workspaceDir = '/test/workspace';

      // Mock async iterator
      const mockChunks = [
        { type: 'message', content: 'Starting...' },
        { type: 'tool_call', tool_name: 'write_file', tool_args: { path: 'test.ts' } },
        { type: 'message', content: 'Done' }
      ];

      mockThread.runStreamed.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        }
      });

      const chunks: any[] = [];
      await agent.generateAppStreaming(task, workspaceDir, (chunk: any) => {
        chunks.push(chunk);
      });

      expect(mockThread.runStreamed).toHaveBeenCalledWith(task);
      expect(chunks).toHaveLength(3);
      expect(chunks[0].type).toBe('message');
      expect(chunks[1].tool_name).toBe('write_file');
    });
  });
});

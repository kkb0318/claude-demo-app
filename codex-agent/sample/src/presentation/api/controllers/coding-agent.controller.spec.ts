import { describe, expect, it, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { CodingAgentController } from '@presentation/api/controllers/coding-agent.controller';
import type { CodexThreadRunner } from '@application/ports/codex-thread-runner.port';
import type { CommandRunner } from '@application/ports/command-runner.port';
import { CodexCompletion } from '@domain/entities/codex-completion';
import type { GenerateAppRequest } from '@presentation/api/dto/generate-app.dto';

class MockThreadRunner implements CodexThreadRunner {
  async runPrompt() {
    return {
      completion: CodexCompletion.create({
        text: '{"actions":[{"type":"message","text":"Starting"},{"type":"finish","summary":"Done"}]}'
      }),
      threadId: 'test-thread',
      usage: null
    };
  }
}

class MockCommandRunner implements CommandRunner {
  allowedCommands() {
    return ['npm install', 'npm test'];
  }

  async run() {
    return {
      command: 'npm install',
      exitCode: 0,
      stdout: 'Success',
      stderr: ''
    };
  }
}

describe('CodingAgentController', () => {
  let controller: CodingAgentController;
  let mockThreadRunner: MockThreadRunner;
  let mockCommandRunner: MockCommandRunner;

  beforeEach(() => {
    mockThreadRunner = new MockThreadRunner();
    mockCommandRunner = new MockCommandRunner();
    controller = new CodingAgentController(mockThreadRunner, mockCommandRunner);
  });

  describe('generateApp', () => {
    it('should generate app successfully', async () => {
      const req = {
        body: {
          prompt: 'Create a TODO app',
          maxIterations: 2
        }
      } as Request<object, object, GenerateAppRequest>;

      const jsonFn = (data: unknown) => data;
      const res = {
        status: function (code: number) {
          expect(code).toBe(200);
          return this;
        },
        json: jsonFn
      } as unknown as Response;

      const next: NextFunction = () => {};

      await controller.generateApp(req, res, next);
    });

    it('should handle errors', async () => {
      const req = {
        body: {
          prompt: '', // Invalid prompt
          maxIterations: 2
        }
      } as Request<object, object, GenerateAppRequest>;

      const res = {} as unknown as Response;
      let errorCaught: Error | null = null;

      const next: NextFunction = (error?: unknown) => {
        if (error instanceof Error) {
          errorCaught = error;
        }
      };

      await controller.generateApp(req, res, next);

      expect(errorCaught).not.toBeNull();
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', () => {
      const req = {} as Request;

      let statusCode = 0;
      let responseData: unknown = null;

      const res = {
        status: function (code: number) {
          statusCode = code;
          return this;
        },
        json: function (data: unknown) {
          responseData = data;
          return this;
        }
      } as unknown as Response;

      controller.healthCheck(req, res);

      expect(statusCode).toBe(200);
      expect(responseData).toMatchObject({
        success: true,
        message: 'Service is healthy'
      });
    });
  });
});

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';

import { createApp } from '@presentation/api/app';
import type { CodexThreadRunner } from '@application/ports/codex-thread-runner.port';
import type { CommandRunner } from '@application/ports/command-runner.port';
import { CodexCompletion } from '@domain/entities/codex-completion';

class MockThreadRunner implements CodexThreadRunner {
  async runPrompt() {
    return {
      completion: CodexCompletion.create({
        text: '{"actions":[{"type":"message","text":"Starting"},{"type":"finish","summary":"Test complete"}]}'
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

describe('API Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    const mockThreadRunner = new MockThreadRunner();
    const mockCommandRunner = new MockCommandRunner();
    app = createApp(mockThreadRunner, mockCommandRunner);
  });

  afterAll(() => {
    // Cleanup if needed
  });

  describe('GET /', () => {
    it('should return service information', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Service is healthy'
      });
    });
  });

  describe('POST /api/generate', () => {
    it('should generate app with valid request', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Create a simple TODO app',
          maxIterations: 2
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('workspaceId');
      expect(response.body).toHaveProperty('summary');
    });

    it('should return 400 for invalid prompt', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: '', // Invalid: empty prompt
          maxIterations: 2
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing prompt', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          maxIterations: 2
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should use default maxIterations if not provided', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Create a calculator app'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
  });
});

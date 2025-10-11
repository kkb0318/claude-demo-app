import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';

import { createApp } from '@presentation/api/app';

// Mock Codex SDK
vi.mock('@openai/codex-sdk', () => ({
  Codex: vi.fn().mockImplementation(() => ({
    startThread: vi.fn().mockReturnValue({
      run: vi.fn().mockResolvedValue({
        finalResponse: 'Test complete',
        items: [
          { type: 'message', content: 'Starting' },
          { type: 'tool_call', tool_name: 'write_file', tool_args: {} }
        ]
      }),
      id: 'test-thread'
    })
  }))
}));

// Mock workspace
vi.mock('@infrastructure/system/workspace', () => ({
  prepareWorkspace: vi.fn().mockResolvedValue({
    rootDir: '/tmp/test-workspace'
  })
}));

describe('API Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
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

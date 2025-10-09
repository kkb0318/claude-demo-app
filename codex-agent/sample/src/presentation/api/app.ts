import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { CodingAgentController } from './controllers/coding-agent.controller';
import { createAgentRoutes } from './routes/agent.routes';
import { errorHandler } from './middlewares/error.middleware';
import { requestLogger } from './middlewares/logger.middleware';
import type { CodexThreadRunner } from '@application/ports/codex-thread-runner.port';
import type { CommandRunner } from '@application/ports/command-runner.port';

/**
 * Create and configure Express application
 * Dependency Injection pattern for clean architecture
 */
export function createApp(
  threadRunner: CodexThreadRunner,
  commandRunner: CommandRunner
): express.Application {
  const app = express();

  // Security middlewares
  app.use(helmet());
  app.use(cors());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Custom middlewares
  app.use(requestLogger);

  // Initialize controller
  const controller = new CodingAgentController(threadRunner, commandRunner);

  // Routes
  app.use('/api', createAgentRoutes(controller));

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      service: 'Coding Agent API',
      version: '1.0.0',
      endpoints: {
        health: 'GET /api/health',
        generate: 'POST /api/generate'
      }
    });
  });

  // Error handling (must be last)
  app.use(errorHandler);

  return app;
}

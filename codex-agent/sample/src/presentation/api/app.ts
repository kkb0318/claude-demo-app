import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { CodingAgentController } from './controllers/coding-agent.controller';
import { InfrastructureController } from './controllers/infrastructure.controller';
import { createRootRoutes } from './routes/root.routes';
import { createAgentRoutes } from './routes/agent.routes';
import { createInfrastructureRoutes } from './routes/infrastructure.routes';
import { createOpenAPIRoutes } from './routes/openapi.routes';
import { errorHandler } from './middlewares/error.middleware';
import { requestLogger } from './middlewares/logger.middleware';

/**
 * Create and configure Express application
 * Simplified to work with SimpleCodexAgent
 */
export function createApp(): express.Application {
  const app = express();

  // Security middlewares
  app.use(helmet());
  app.use(cors());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Custom middlewares
  app.use(requestLogger);

  // Initialize controllers
  // Note: Controllers are stateless - dependencies are created per request
  const codingAgentController = new CodingAgentController();
  const infrastructureController = new InfrastructureController();

  // Routes
  app.use('/', createRootRoutes());
  app.use('/api', createAgentRoutes(codingAgentController));
  app.use('/api/infrastructure', createInfrastructureRoutes(infrastructureController));
  app.use('/api', createOpenAPIRoutes());

  // Error handling (must be last)
  app.use(errorHandler);

  return app;
}

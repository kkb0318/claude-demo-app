import { Router } from 'express';

import type { CodingAgentController } from '../controllers/coding-agent.controller';
import { GenerateAppRequestSchema } from '../dto/generate-app.dto';
import { validateRequest } from '../middlewares/validation.middleware';

/**
 * API routes for code generation agent
 */
export function createAgentRoutes(controller: CodingAgentController): Router {
  const router = Router();

  /**
   * POST /api/generate
   * Generate an application from user prompt
   */
  router.post(
    '/generate',
    validateRequest(GenerateAppRequestSchema),
    (req, res, next) => controller.generateApp(req, res, next)
  );

  /**
   * GET /api/health
   * Health check endpoint
   */
  router.get('/health', (req, res) => controller.healthCheck(req, res));

  return router;
}

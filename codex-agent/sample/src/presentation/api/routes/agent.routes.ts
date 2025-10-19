import { Router } from 'express';
import { z } from 'zod';

import type { CodingAgentController } from '../controllers/coding-agent.controller';
import {
  GenerateAppRequestSchema,
  GenerateAppResponseSchema,
  ErrorResponseSchema
} from '../dto/generate-app.dto';
import { validateRequest } from '../middlewares/validation.middleware';
import { registerOpenAPIRoute } from '../openapi/types';

/**
 * API routes for code generation agent
 */
export function createAgentRoutes(controller: CodingAgentController): Router {
  const router = Router();

  // Register OpenAPI metadata for health check
  registerOpenAPIRoute({
    method: 'get',
    path: '/api/health',
    summary: 'Health check',
    description: 'Check if the API service is running and healthy',
    tags: ['Health'],
    responseSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      timestamp: z.string()
    })
  });

  // Register OpenAPI metadata for generate endpoint
  registerOpenAPIRoute({
    method: 'post',
    path: '/api/generate',
    summary: 'Generate application',
    description:
      'Generate an application from a natural language prompt using AI. Maximum prompt length is 4000 characters. The agent will iteratively modify files and run commands to implement the requested application.',
    tags: ['Code Generation'],
    requestSchema: GenerateAppRequestSchema,
    responseSchema: GenerateAppResponseSchema,
    errorSchemas: {
      400: ErrorResponseSchema,
      500: ErrorResponseSchema
    }
  });

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

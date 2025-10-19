import { Router } from 'express';
import { z } from 'zod';
import { registerOpenAPIRoute } from '../openapi/types';

/**
 * Root endpoint routes
 */
export function createRootRoutes(): Router {
  const router = Router();

  // Register OpenAPI metadata for root endpoint
  registerOpenAPIRoute({
    method: 'get',
    path: '/',
    summary: 'Service information',
    description: 'Get basic service information and available endpoints',
    tags: ['Info'],
    responseSchema: z.object({
      service: z.string(),
      version: z.string(),
      endpoints: z.object({
        health: z.string(),
        generate: z.string(),
        destroyInfrastructure: z.string(),
        openapiJson: z.string(),
        openapiYaml: z.string()
      })
    })
  });

  // Root endpoint
  router.get('/', (_req, res) => {
    res.json({
      service: 'Coding Agent API',
      version: '1.0.0',
      endpoints: {
        health: 'GET /api/health',
        generate: 'POST /api/generate',
        destroyInfrastructure: 'POST /api/infrastructure/destroy',
        openapiJson: 'GET /api/openapi.json',
        openapiYaml: 'GET /api/openapi.yaml'
      }
    });
  });

  return router;
}

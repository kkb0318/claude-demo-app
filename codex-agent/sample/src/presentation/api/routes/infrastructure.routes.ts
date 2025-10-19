import { Router } from 'express';
import type { InfrastructureController } from '../controllers/infrastructure.controller';
import {
  DestroyInfrastructureRequestSchema,
  DestroyInfrastructureResponseSchema
} from '../dto/destroy-infrastructure.dto';
import { ErrorResponseSchema } from '../dto/generate-app.dto';
import { registerOpenAPIRoute } from '../openapi/types';

/**
 * API routes for infrastructure management
 */
export function createInfrastructureRoutes(
  controller: InfrastructureController
): Router {
  const router = Router();

  // Register OpenAPI metadata for destroy endpoint
  registerOpenAPIRoute({
    method: 'post',
    path: '/api/infrastructure/destroy',
    summary: 'Destroy AWS infrastructure',
    description:
      'Destroy AWS infrastructure (S3 bucket and related resources) using Terraform. Requires valid AWS credentials and workspace directory with Terraform state.',
    tags: ['Infrastructure'],
    requestSchema: DestroyInfrastructureRequestSchema,
    responseSchema: DestroyInfrastructureResponseSchema,
    errorSchemas: {
      400: ErrorResponseSchema,
      500: ErrorResponseSchema
    }
  });

  /**
   * POST /api/infrastructure/destroy
   * Destroy AWS infrastructure
   */
  router.post('/destroy', (req, res) => controller.destroyInfrastructure(req, res));

  return router;
}

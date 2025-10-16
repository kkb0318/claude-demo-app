import { Router } from 'express';
import type { InfrastructureController } from '../controllers/infrastructure.controller';

/**
 * API routes for infrastructure management
 */
export function createInfrastructureRoutes(
  controller: InfrastructureController
): Router {
  const router = Router();

  /**
   * POST /api/infrastructure/destroy
   * Destroy AWS infrastructure
   */
  router.post('/destroy', (req, res) => controller.destroyInfrastructure(req, res));

  return router;
}

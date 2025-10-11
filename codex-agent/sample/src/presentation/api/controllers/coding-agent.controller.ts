import type { Request, Response, NextFunction } from 'express';

import { Codex } from '@openai/codex-sdk';
import { SimpleCodexAgent } from '@infrastructure/agents/simple-codex-agent';
import { prepareWorkspace } from '@infrastructure/system/workspace';
import { GenerateAppUseCase } from '@application/use-cases/generate-app.use-case';
import { loadCodexEnvironment } from '@infrastructure/config/codex.config';

import type {
  GenerateAppRequest,
  GenerateAppResponse
} from '../dto/generate-app.dto';

/**
 * Controller for code generation agent API
 * Following Clean Architecture: delegates to application service
 */
export class CodingAgentController {
  constructor() {
    // Stateless controller - services are created per request
  }

  /**
   * POST /api/generate
   * Generate an application based on user prompt
   */
  async generateApp(
    req: Request<object, object, GenerateAppRequest>,
    res: Response<GenerateAppResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { prompt } = req.body;

      // Prepare workspace for this request (copies template project)
      const workspace = await prepareWorkspace();

      // Create use case with the prepared workspace
      const environment = loadCodexEnvironment();
      const codex = new Codex({
        apiKey: environment.apiKey,
        baseUrl: environment.baseUrl
      });
      const agent = new SimpleCodexAgent(codex);
      const useCase = new GenerateAppUseCase(agent);

      // Execute use case
      const result = await useCase.execute({
        task: prompt,
        workspaceDir: workspace.rootDir
      });

      // Return successful response
      res.status(200).json({
        success: true,
        message: 'Application generated successfully',
        workspaceId: workspace.rootDir,
        summary: result.summary,
        iterations: result.statistics.filesModified + result.statistics.commandsExecuted
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/health
   * Health check endpoint
   */
  healthCheck(_req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      timestamp: new Date().toISOString()
    });
  }
}

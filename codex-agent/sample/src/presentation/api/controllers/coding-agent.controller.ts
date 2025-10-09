import type { Request, Response, NextFunction } from 'express';

import { CodingAgentRunner } from '@application/services/coding-agent';
import type { CommandRunner } from '@application/ports/command-runner.port';
import type { CodexThreadRunner } from '@application/ports/codex-thread-runner.port';
import { prepareWorkspace } from '@infrastructure/system/workspace';

import type {
  GenerateAppRequest,
  GenerateAppResponse
} from '../dto/generate-app.dto';

/**
 * Controller for code generation agent API
 * Follows Clean Architecture principles - handles HTTP concerns
 * and delegates business logic to the application layer
 */
export class CodingAgentController {
  constructor(
    private readonly threadRunner: CodexThreadRunner,
    private readonly commandRunner: CommandRunner
  ) {}

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
      const { prompt, maxIterations = 8 } = req.body;

      // Prepare workspace for this request
      const workspace = await prepareWorkspace();

      // Create and run agent
      const agent = new CodingAgentRunner(
        this.threadRunner,
        workspace,
        this.commandRunner
      );

      const result = await agent.run({
        task: prompt,
        maxIterations,
        enforceRequiredCommands: true
      });

      // Return successful response
      res.status(200).json({
        success: true,
        message: 'Application generated successfully',
        workspaceId: workspace.rootDir,
        summary: result.summary,
        iterations: result.iterations.length
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

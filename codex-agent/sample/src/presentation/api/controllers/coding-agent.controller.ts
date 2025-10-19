import type { Request, Response, NextFunction } from 'express';

import { Codex } from '@openai/codex-sdk';
import { SimpleCodexAgent } from '@infrastructure/agents/simple-codex-agent';
import { prepareWorkspace } from '@infrastructure/system/workspace';
import { GenerateAppUseCase } from '@application/use-cases/generate-app.use-case';
import { loadCodexEnvironment } from '@infrastructure/config/codex.config';
import { CDKTFProvisioner } from '@infrastructure/cdktf/cdktf-provisioner';
import { S3Deployer } from '@infrastructure/aws/s3-deployer';

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
      
      // Create infrastructure provisioner and deployer
      const provisioner = new CDKTFProvisioner();
      const deployer = new S3Deployer();
      
      const useCase = new GenerateAppUseCase(agent, provisioner, deployer);

      // Generate unique bucket name
      const timestamp = Date.now();
      const bucketName = `codex-app-${timestamp}`;
      const awsRegion = process.env.AWS_REGION || 'ap-northeast-1';

      // Execute use case with infrastructure provisioning
      const result = await useCase.execute({
        task: prompt,
        workspaceDir: workspace.rootDir,
        infrastructureConfig: {
          bucketName,
          awsRegion,
          environment: 'production',
          workspaceDir: workspace.rootDir
        },
        deployConfig: {
          bucketName,
          sourceDir: `${workspace.rootDir}/out`,
          awsRegion
        }
      });

      // Return successful response
      res.status(200).json({
        success: true,
        message: 'Application generated successfully',
        workspaceId: workspace.rootDir,
        summary: result.summary,
        iterations: result.statistics.filesModified + result.statistics.commandsExecuted,
        cloudfrontUrl: result.infrastructure?.outputs.cloudfrontUrl,
        cloudfrontDistributionId: result.infrastructure?.outputs.cloudfrontDistributionId,
        s3BucketName: result.infrastructure?.outputs.s3BucketName
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

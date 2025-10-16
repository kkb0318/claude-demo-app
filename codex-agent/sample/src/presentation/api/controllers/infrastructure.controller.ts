import type { Request, Response } from 'express';
import { CDKTFProvisioner } from '@infrastructure/cdktf/cdktf-provisioner';
import { DestroyInfrastructureDto } from '@presentation/api/dto/destroy-infrastructure.dto';

/**
 * Controller for infrastructure management operations
 * Following Clean Architecture: services are created per request
 */
export class InfrastructureController {
  constructor() {
    // Stateless controller - services are created per request
  }

  /**
   * Destroy AWS infrastructure
   * POST /api/infrastructure/destroy
   */
  async destroyInfrastructure(req: Request, res: Response): Promise<void> {
    try {
      // Parse and validate request body
      const dto = new DestroyInfrastructureDto();
      Object.assign(dto, req.body);

      const validationErrors = dto.validate();
      if (validationErrors.length > 0) {
        res.status(400).json({
          success: false,
          message: validationErrors.join(', '),
        });
        return;
      }

      // Create provisioner for this request
      const awsProfile = dto.awsProfile || process.env.AWS_PROFILE || 'agent-galaxy';
      const provisioner = new CDKTFProvisioner(awsProfile);

      // Execute destroy operation
      const result = await provisioner.destroy({
        bucketName: dto.bucketName,
        awsRegion: dto.awsRegion,
        workspaceDir: dto.workspaceDir,
        environment: 'dev', // Match the environment used during creation
        defaultRootObject: 'index.html',
        cloudfrontPriceClass: 'PriceClass_All',
        resourcePrefix: '',
      });

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

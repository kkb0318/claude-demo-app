import { describe, it, expect } from 'vitest';

import type {
  ApplicationDeployer,
  DeployConfig,
  DeployResult,
} from './application-deployer.port';

describe('ApplicationDeployer Port', () => {
  describe('Type Definitions', () => {
    it('should allow valid DeployConfig', () => {
      const config: DeployConfig = {
        sourceDir: '/tmp/build',
        bucketName: 'my-app-bucket',
        awsRegion: 'ap-northeast-1',
        awsProfile: 'my-profile',
        deleteRemoved: true,
      };

      expect(config.sourceDir).toBe('/tmp/build');
      expect(config.bucketName).toBe('my-app-bucket');
      expect(config.awsRegion).toBe('ap-northeast-1');
      expect(config.deleteRemoved).toBe(true);
    });

    it('should allow DeployConfig with minimal required fields', () => {
      const config: DeployConfig = {
        sourceDir: '/app/dist',
        bucketName: 'test-bucket',
        awsRegion: 'us-east-1',
      };

      expect(config.sourceDir).toBe('/app/dist');
      expect(config.awsProfile).toBeUndefined();
      expect(config.deleteRemoved).toBeUndefined();
    });

    it('should allow valid DeployResult with success', () => {
      const result: DeployResult = {
        success: true,
        message: 'Deployment completed successfully',
        filesUploaded: 42,
        filesDeleted: 3,
      };

      expect(result.success).toBe(true);
      expect(result.filesUploaded).toBe(42);
      expect(result.filesDeleted).toBe(3);
    });

    it('should allow valid DeployResult with failure', () => {
      const result: DeployResult = {
        success: false,
        message: 'Deployment failed: Access denied',
        filesUploaded: 0,
      };

      expect(result.success).toBe(false);
      expect(result.filesUploaded).toBe(0);
      expect(result.filesDeleted).toBeUndefined();
    });

    it('should allow DeployResult without filesDeleted', () => {
      const result: DeployResult = {
        success: true,
        message: 'Deployed successfully',
        filesUploaded: 15,
      };

      expect(result.filesDeleted).toBeUndefined();
    });
  });

  describe('Interface Contract', () => {
    it('should define deploy method signature', () => {
      const mockDeployer: ApplicationDeployer = {
        deploy: async (_config: DeployConfig): Promise<DeployResult> => {
          return {
            success: true,
            message: 'Deployed',
            filesUploaded: 10,
          };
        },
      };

      expect(mockDeployer.deploy).toBeDefined();
      expect(typeof mockDeployer.deploy).toBe('function');
    });

    it('should execute deploy method', async () => {
      const mockDeployer: ApplicationDeployer = {
        deploy: async (config: DeployConfig): Promise<DeployResult> => {
          return {
            success: true,
            message: `Deployed to ${config.bucketName}`,
            filesUploaded: 25,
            filesDeleted: 2,
          };
        },
      };

      const config: DeployConfig = {
        sourceDir: '/tmp/dist',
        bucketName: 'test-bucket',
        awsRegion: 'ap-northeast-1',
      };

      const result = await mockDeployer.deploy(config);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Deployed to test-bucket');
      expect(result.filesUploaded).toBe(25);
      expect(result.filesDeleted).toBe(2);
    });

    it('should handle deployment errors', async () => {
      const mockDeployer: ApplicationDeployer = {
        deploy: async (): Promise<DeployResult> => {
          return {
            success: false,
            message: 'Bucket not found',
            filesUploaded: 0,
          };
        },
      };

      const config: DeployConfig = {
        sourceDir: '/tmp/dist',
        bucketName: 'nonexistent-bucket',
        awsRegion: 'us-west-2',
      };

      const result = await mockDeployer.deploy(config);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Bucket not found');
      expect(result.filesUploaded).toBe(0);
    });

    it('should support deleteRemoved option', async () => {
      const mockDeployer: ApplicationDeployer = {
        deploy: async (config: DeployConfig): Promise<DeployResult> => {
          const deleted = config.deleteRemoved ? 5 : 0;
          return {
            success: true,
            message: 'Deployed',
            filesUploaded: 20,
            filesDeleted: deleted,
          };
        },
      };

      const configWithDelete: DeployConfig = {
        sourceDir: '/tmp/dist',
        bucketName: 'test-bucket',
        awsRegion: 'eu-west-1',
        deleteRemoved: true,
      };

      const result = await mockDeployer.deploy(configWithDelete);

      expect(result.filesDeleted).toBe(5);
    });
  });
});

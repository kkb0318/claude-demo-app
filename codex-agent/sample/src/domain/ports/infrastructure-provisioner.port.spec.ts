import { describe, it, expect } from 'vitest';

import type {
  InfrastructureConfig,
  InfrastructureProvisioner,
  ProvisionResult,
} from './infrastructure-provisioner.port';

describe('InfrastructureProvisioner Port', () => {
  describe('Type Definitions', () => {
    it('should allow valid InfrastructureConfig', () => {
      const config: InfrastructureConfig = {
        bucketName: 'test-bucket',
        awsRegion: 'ap-northeast-1',
        environment: 'dev',
        workspaceDir: '/tmp/workspace',
        defaultRootObject: 'index.html',
        cloudfrontPriceClass: 'PriceClass_100',
        resourcePrefix: 'test-',
      };

      expect(config.bucketName).toBe('test-bucket');
      expect(config.awsRegion).toBe('ap-northeast-1');
      expect(config.environment).toBe('dev');
      expect(config.workspaceDir).toBe('/tmp/workspace');
    });

    it('should allow InfrastructureConfig with minimal required fields', () => {
      const config: InfrastructureConfig = {
        bucketName: 'test-bucket',
        awsRegion: 'us-east-1',
        environment: 'production',
        workspaceDir: '/tmp/workspace',
      };

      expect(config.bucketName).toBe('test-bucket');
      expect(config.defaultRootObject).toBeUndefined();
      expect(config.cloudfrontPriceClass).toBeUndefined();
    });

    it('should allow valid ProvisionResult', () => {
      const result: ProvisionResult = {
        success: true,
        outputs: {
          cloudfrontUrl: 'https://d123.cloudfront.net',
          cloudfrontDomainName: 'd123.cloudfront.net',
          cloudfrontDistributionId: 'E123ABC',
          s3BucketName: 'test-bucket',
          s3BucketArn: 'arn:aws:s3:::test-bucket',
        },
        message: 'Infrastructure provisioned successfully',
      };

      expect(result.success).toBe(true);
      expect(result.outputs.cloudfrontUrl).toBeDefined();
      expect(result.message).toBe('Infrastructure provisioned successfully');
    });

    it('should allow ProvisionResult with empty outputs', () => {
      const result: ProvisionResult = {
        success: false,
        outputs: {},
        message: 'Provisioning failed',
      };

      expect(result.success).toBe(false);
      expect(result.outputs).toEqual({});
    });
  });

  describe('Interface Contract', () => {
    it('should define provision method signature', () => {
      // This test verifies the interface contract exists
      const mockProvisioner: InfrastructureProvisioner = {
        provision: async (config: InfrastructureConfig): Promise<ProvisionResult> => {
          return {
            success: true,
            outputs: {
              s3BucketName: config.bucketName,
            },
            message: 'Provisioned',
          };
        },
        destroy: async (): Promise<ProvisionResult> => {
          return {
            success: true,
            outputs: {},
            message: 'Destroyed',
          };
        },
        plan: async (): Promise<ProvisionResult> => {
          return {
            success: true,
            outputs: {},
            message: 'Planned',
          };
        },
      };

      expect(mockProvisioner.provision).toBeDefined();
      expect(mockProvisioner.destroy).toBeDefined();
      expect(mockProvisioner.plan).toBeDefined();
    });

    it('should execute provision method', async () => {
      const mockProvisioner: InfrastructureProvisioner = {
        provision: async (config: InfrastructureConfig): Promise<ProvisionResult> => {
          return {
            success: true,
            outputs: {
              s3BucketName: config.bucketName,
              cloudfrontUrl: 'https://test.cloudfront.net',
            },
            message: 'Successfully provisioned',
          };
        },
        destroy: async (): Promise<ProvisionResult> => {
          return { success: true, outputs: {}, message: 'Destroyed' };
        },
        plan: async (): Promise<ProvisionResult> => {
          return { success: true, outputs: {}, message: 'Planned' };
        },
      };

      const config: InfrastructureConfig = {
        bucketName: 'test-bucket',
        awsRegion: 'ap-northeast-1',
        environment: 'test',
        workspaceDir: '/tmp/test',
      };

      const result = await mockProvisioner.provision(config);

      expect(result.success).toBe(true);
      expect(result.outputs.s3BucketName).toBe('test-bucket');
      expect(result.outputs.cloudfrontUrl).toBe('https://test.cloudfront.net');
    });
  });
});

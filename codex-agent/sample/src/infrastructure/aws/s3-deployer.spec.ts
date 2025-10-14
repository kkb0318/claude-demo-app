import { describe, it, expect } from 'vitest';
import type { ApplicationDeployer, DeployConfig } from '@domain/ports/application-deployer.port';
import { S3Deployer } from './s3-deployer';

/**
 * Tests for S3Deployer
 * 
 * These tests verify that S3Deployer correctly implements the ApplicationDeployer port.
 * We focus on interface contract validation rather than mocking AWS SDK calls.
 */
describe('S3Deployer', () => {
  describe('Interface Contract', () => {
    it('should implement ApplicationDeployer interface', () => {
      const deployer: ApplicationDeployer = new S3Deployer();
      expect(deployer).toBeDefined();
      expect(typeof deployer.deploy).toBe('function');
    });

    it('should return DeployResult with required fields', async () => {
      const deployer = new S3Deployer();
      const config: DeployConfig = {
        sourceDir: '/nonexistent/path',
        bucketName: 'test-bucket',
        awsRegion: 'us-east-1',
      };

      const result = await deployer.deploy(config);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.filesUploaded).toBe('number');
      expect(typeof result.message).toBe('string');
    });

    it('should handle missing source directory', async () => {
      const deployer = new S3Deployer();
      const config: DeployConfig = {
        sourceDir: '/nonexistent/directory',
        bucketName: 'test-bucket',
        awsRegion: 'us-east-1',
      };

      const result = await deployer.deploy(config);

      expect(result.success).toBe(false);
      expect(result.filesUploaded).toBe(0);
      expect(result.message).toContain('does not exist');
    });

    it('should accept all DeployConfig fields', async () => {
      const deployer = new S3Deployer();
      const config: DeployConfig = {
        sourceDir: '/tmp/test',
        bucketName: 'my-bucket',
        awsRegion: 'ap-northeast-1',
        awsProfile: 'default',
        deleteRemoved: true,
      };

      // Should not throw
      const result = await deployer.deploy(config);
      expect(result).toBeDefined();
    });

    it('should include filesDeleted in result when deleteRemoved is true', async () => {
      const deployer = new S3Deployer();
      const config: DeployConfig = {
        sourceDir: '/nonexistent',
        bucketName: 'test-bucket',
        awsRegion: 'us-east-1',
        deleteRemoved: true,
      };

      const result = await deployer.deploy(config);

      // When deleteRemoved is true, filesDeleted should be present (even if 0 or undefined)
      expect('filesDeleted' in result || result.filesDeleted !== undefined).toBe(true);
    });

    it('should not include filesDeleted when deleteRemoved is false', async () => {
      const deployer = new S3Deployer();
      const config: DeployConfig = {
        sourceDir: '/nonexistent',
        bucketName: 'test-bucket',
        awsRegion: 'us-east-1',
        deleteRemoved: false,
      };

      const result = await deployer.deploy(config);

      expect(result.filesDeleted).toBeUndefined();
    });

    it('should return proper error message on failure', async () => {
      const deployer = new S3Deployer();
      const config: DeployConfig = {
        sourceDir: '/nonexistent',
        bucketName: 'test-bucket',
        awsRegion: 'us-east-1',
      };

      const result = await deployer.deploy(config);

      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
      expect(result.message.length).toBeGreaterThan(0);
    });
  });
});

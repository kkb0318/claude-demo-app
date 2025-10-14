import { describe, it, expect } from 'vitest';

import { CDKTFProvisioner } from './cdktf-provisioner';

/**
 * CDKTFProvisioner Unit Tests
 *
 * Note: CDKTFProvisioner executes actual Terraform commands via child_process.exec.
 * These unit tests verify the interface contract and basic instantiation.
 *
 * For testing actual Terraform execution, use integration tests with:
 * - A real AWS environment or LocalStack
 * - Proper AWS credentials configured
 * - Terraform CLI installed
 *
 * The actual provision/destroy/plan methods are tested in integration tests
 * to avoid the complexity of mocking Node.js child_process with promisify.
 */
describe('CDKTFProvisioner', () => {
  describe('Interface Implementation', () => {
    it('should implement InfrastructureProvisioner interface', () => {
      const provisioner = new CDKTFProvisioner('test-profile');

      // Verify all required methods exist
      expect(provisioner).toHaveProperty('provision');
      expect(provisioner).toHaveProperty('destroy');
      expect(provisioner).toHaveProperty('plan');

      // Verify methods are functions
      expect(typeof provisioner.provision).toBe('function');
      expect(typeof provisioner.destroy).toBe('function');
      expect(typeof provisioner.plan).toBe('function');
    });

    it('should be instantiable with AWS profile', () => {
      const provisioner = new CDKTFProvisioner('custom-profile');

      expect(provisioner).toBeDefined();
      expect(provisioner).toBeInstanceOf(CDKTFProvisioner);
    });

    it('should be instantiable without AWS profile', () => {
      const provisioner = new CDKTFProvisioner();

      expect(provisioner).toBeDefined();
      expect(provisioner).toBeInstanceOf(CDKTFProvisioner);
    });

    it('should have provision method that returns a Promise', () => {
      const provisioner = new CDKTFProvisioner();
      const config = {
        bucketName: 'test',
        awsRegion: 'us-east-1',
        environment: 'test',
        workspaceDir: '/tmp/test',
      };

      const result = provisioner.provision(config);

      expect(result).toBeInstanceOf(Promise);
    });

    it('should have destroy method that returns a Promise', () => {
      const provisioner = new CDKTFProvisioner();
      const config = {
        bucketName: 'test',
        awsRegion: 'us-east-1',
        environment: 'test',
        workspaceDir: '/tmp/test',
      };

      const result = provisioner.destroy(config);

      expect(result).toBeInstanceOf(Promise);
    });

    it('should have plan method that returns a Promise', () => {
      const provisioner = new CDKTFProvisioner();
      const config = {
        bucketName: 'test',
        awsRegion: 'us-east-1',
        environment: 'test',
        workspaceDir: '/tmp/test',
      };

      const result = provisioner.plan(config);

      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('Configuration', () => {
    it('should accept AWS profile in constructor', () => {
      const profile = 'my-custom-profile';
      const provisioner = new CDKTFProvisioner(profile);

      expect(provisioner).toBeDefined();
    });

    it('should work with undefined AWS profile', () => {
      const provisioner = new CDKTFProvisioner(undefined);

      expect(provisioner).toBeDefined();
    });
  });
});

import { describe, it, expect } from 'vitest';
import { DestroyInfrastructureDto } from './destroy-infrastructure.dto';

describe('DestroyInfrastructureDto', () => {
  describe('Validation', () => {
    it('should validate a valid DTO', () => {
      const dto = new DestroyInfrastructureDto();
      dto.bucketName = 'my-bucket-123';
      dto.awsRegion = 'ap-northeast-1';
      dto.workspaceDir = '/tmp/workspace';

      const errors = dto.validate();
      expect(errors).toHaveLength(0);
    });

    it('should require bucketName', () => {
      const dto = new DestroyInfrastructureDto();
      dto.awsRegion = 'ap-northeast-1';
      dto.workspaceDir = '/tmp/workspace';

      const errors = dto.validate();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('bucketName'))).toBe(true);
    });

    it('should require awsRegion', () => {
      const dto = new DestroyInfrastructureDto();
      dto.bucketName = 'my-bucket-123';
      dto.workspaceDir = '/tmp/workspace';

      const errors = dto.validate();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('awsRegion'))).toBe(true);
    });

    it('should require workspaceDir', () => {
      const dto = new DestroyInfrastructureDto();
      dto.bucketName = 'my-bucket-123';
      dto.awsRegion = 'ap-northeast-1';

      const errors = dto.validate();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('workspaceDir'))).toBe(true);
    });

    it('should use default awsProfile if not provided', () => {
      const dto = new DestroyInfrastructureDto();
      dto.bucketName = 'my-bucket-123';
      dto.awsRegion = 'ap-northeast-1';
      dto.workspaceDir = '/tmp/workspace';

      expect(dto.awsProfile).toBe('agent-galaxy');
    });

    it('should allow custom awsProfile', () => {
      const dto = new DestroyInfrastructureDto();
      dto.bucketName = 'my-bucket-123';
      dto.awsRegion = 'ap-northeast-1';
      dto.workspaceDir = '/tmp/workspace';
      dto.awsProfile = 'custom-profile';

      const errors = dto.validate();
      expect(errors).toHaveLength(0);
      expect(dto.awsProfile).toBe('custom-profile');
    });

    it('should validate bucketName format', () => {
      const dto = new DestroyInfrastructureDto();
      dto.bucketName = 'Invalid_Bucket_Name!';
      dto.awsRegion = 'ap-northeast-1';
      dto.workspaceDir = '/tmp/workspace';

      const errors = dto.validate();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('bucketName'))).toBe(true);
    });

    it('should validate awsRegion format', () => {
      const dto = new DestroyInfrastructureDto();
      dto.bucketName = 'my-bucket-123';
      dto.awsRegion = 'invalid-region';
      dto.workspaceDir = '/tmp/workspace';

      const errors = dto.validate();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('awsRegion'))).toBe(true);
    });
  });
});

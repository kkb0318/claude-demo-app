import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { InfrastructureController } from './infrastructure.controller';
import { CDKTFProvisioner } from '@infrastructure/cdktf/cdktf-provisioner';

// Mock CDKTFProvisioner
vi.mock('@infrastructure/cdktf/cdktf-provisioner');

describe('InfrastructureController', () => {
  let controller: InfrastructureController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockDestroy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock for destroy method
    mockDestroy = vi.fn().mockResolvedValue({
      success: true,
      outputs: {},
      message: 'Infrastructure destroyed successfully'
    });

    vi.mocked(CDKTFProvisioner).mockImplementation(() => ({
      destroy: mockDestroy,
      provision: vi.fn(),
      plan: vi.fn(),
    }) as any);

    // Mock Express Request and Response
    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    controller = new InfrastructureController();
  });

  describe('destroyInfrastructure', () => {
    it('should successfully destroy infrastructure', async () => {
      mockRequest.body = {
        bucketName: 'test-bucket-123',
        awsRegion: 'ap-northeast-1',
        workspaceDir: '/tmp/test-workspace',
      };

      await controller.destroyInfrastructure(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockDestroy).toHaveBeenCalledWith({
        bucketName: 'test-bucket-123',
        awsRegion: 'ap-northeast-1',
        workspaceDir: '/tmp/test-workspace',
        environment: 'dev',
        defaultRootObject: 'index.html',
        cloudfrontPriceClass: 'PriceClass_All',
        resourcePrefix: '',
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Infrastructure destroyed successfully',
      });
    });

    it('should return 400 for invalid input', async () => {
      mockRequest.body = {
        bucketName: 'Invalid_Bucket!',
        awsRegion: 'ap-northeast-1',
        workspaceDir: '/tmp/test',
      };

      await controller.destroyInfrastructure(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('bucketName'),
      });
    });

    it('should return 400 when bucketName is missing', async () => {
      mockRequest.body = {
        awsRegion: 'ap-northeast-1',
        workspaceDir: '/tmp/test',
      };

      await controller.destroyInfrastructure(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('bucketName'),
      });
    });

    it('should return 400 when awsRegion is missing', async () => {
      mockRequest.body = {
        bucketName: 'test-bucket-123',
        workspaceDir: '/tmp/test',
      };

      await controller.destroyInfrastructure(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('awsRegion'),
      });
    });

    it('should return 400 when workspaceDir is missing', async () => {
      mockRequest.body = {
        bucketName: 'test-bucket-123',
        awsRegion: 'ap-northeast-1',
      };

      await controller.destroyInfrastructure(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('workspaceDir'),
      });
    });

    it('should use custom awsProfile if provided', async () => {
      mockRequest.body = {
        bucketName: 'test-bucket-123',
        awsRegion: 'ap-northeast-1',
        workspaceDir: '/tmp/test-workspace',
        awsProfile: 'custom-profile',
      };

      await controller.destroyInfrastructure(
        mockRequest as Request,
        mockResponse as Response
      );

      // Verify CDKTFProvisioner was created with custom profile
      expect(CDKTFProvisioner).toHaveBeenCalledWith('custom-profile');
      expect(mockDestroy).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Infrastructure destroyed successfully',
      });
    });

    it('should handle provisioner failure', async () => {
      mockRequest.body = {
        bucketName: 'test-bucket-123',
        awsRegion: 'ap-northeast-1',
        workspaceDir: '/tmp/test-workspace',
      };

      mockDestroy.mockResolvedValueOnce({
        success: false,
        outputs: {},
        message: 'Failed to destroy CloudFront distribution',
      });

      await controller.destroyInfrastructure(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to destroy CloudFront distribution',
      });
    });

    it('should handle unexpected errors', async () => {
      mockRequest.body = {
        bucketName: 'test-bucket-123',
        awsRegion: 'ap-northeast-1',
        workspaceDir: '/tmp/test-workspace',
      };

      mockDestroy.mockRejectedValueOnce(new Error('Unexpected error'));

      await controller.destroyInfrastructure(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unexpected error',
      });
    });
  });
});

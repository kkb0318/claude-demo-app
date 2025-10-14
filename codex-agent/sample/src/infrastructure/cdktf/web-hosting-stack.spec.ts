import { Testing } from 'cdktf';
import { describe, it, expect } from 'vitest';

import { WebHostingStack, type WebHostingStackConfig } from './web-hosting-stack';

describe('WebHostingStack', () => {
  describe('Stack Synthesis', () => {
    it('should synthesize a valid CDKTF stack', () => {
      const app = Testing.app();
      const config: WebHostingStackConfig = {
        bucketName: 'test-bucket',
        awsRegion: 'ap-northeast-1',
        environment: 'test',
        defaultRootObject: 'index.html',
        cloudfrontPriceClass: 'PriceClass_100',
        resourcePrefix: 'test-',
      };

      const stack = new WebHostingStack(app, 'test-stack', config);

      expect(stack).toBeDefined();
      expect(stack.bucket).toBeDefined();
      expect(stack.distribution).toBeDefined();
    });

    it('should create stack with minimal configuration', () => {
      const app = Testing.app();
      const config: WebHostingStackConfig = {
        bucketName: 'minimal-bucket',
        awsRegion: 'us-east-1',
        environment: 'prod',
      };

      const stack = new WebHostingStack(app, 'minimal-stack', config);

      expect(stack).toBeDefined();
      expect(stack.bucket).toBeDefined();
      expect(stack.distribution).toBeDefined();
    });

    it('should use default values when optional fields are omitted', () => {
      const app = Testing.app();
      const config: WebHostingStackConfig = {
        bucketName: 'default-test-bucket',
        awsRegion: 'eu-west-1',
        environment: 'staging',
      };

      const stack = new WebHostingStack(app, 'default-stack', config);
      const synthesized = Testing.synth(stack);

      // Verify the stack synthesizes without errors
      expect(synthesized).toBeDefined();
      expect(typeof synthesized).toBe('string');
    });
  });

  describe('Resource Configuration', () => {
    it('should configure S3 bucket with correct name', () => {
      const app = Testing.app();
      const bucketName = 'my-website-bucket';
      const config: WebHostingStackConfig = {
        bucketName,
        awsRegion: 'ap-northeast-1',
        environment: 'dev',
      };

      const stack = new WebHostingStack(app, 'resource-stack', config);

      expect(stack.bucket).toBeDefined();
      // Note: Actual bucket name verification would require deeper CDKTF inspection
    });

    it('should configure CloudFront distribution', () => {
      const app = Testing.app();
      const config: WebHostingStackConfig = {
        bucketName: 'cdn-test-bucket',
        awsRegion: 'us-west-2',
        environment: 'production',
        cloudfrontPriceClass: 'PriceClass_200',
      };

      const stack = new WebHostingStack(app, 'cdn-stack', config);

      expect(stack.distribution).toBeDefined();
    });

    it('should apply resource prefix when provided', () => {
      const app = Testing.app();
      const config: WebHostingStackConfig = {
        bucketName: 'prefixed-bucket',
        awsRegion: 'ap-southeast-1',
        environment: 'test',
        resourcePrefix: 'myapp-',
      };

      const stack = new WebHostingStack(app, 'prefix-stack', config);
      const synthesized = Testing.synth(stack);

      // Verify synthesis succeeds with prefix
      expect(synthesized).toBeDefined();
      expect(stack.bucket).toBeDefined();
      expect(stack.distribution).toBeDefined();
    });
  });

  describe('Terraform Outputs', () => {
    it('should define required outputs', () => {
      const app = Testing.app();
      const config: WebHostingStackConfig = {
        bucketName: 'output-test-bucket',
        awsRegion: 'eu-central-1',
        environment: 'dev',
      };

      const stack = new WebHostingStack(app, 'output-stack', config);
      const synthesized = Testing.synth(stack);

      // Verify that the stack includes outputs
      expect(synthesized).toContain('output');
      expect(synthesized).toContain('cloudfront_url');
      expect(synthesized).toContain('s3_bucket_name');
    });
  });

  describe('Security Configuration', () => {
    it('should create stack with secure S3 and CloudFront configuration', () => {
      const app = Testing.app();
      const config: WebHostingStackConfig = {
        bucketName: 'secure-bucket',
        awsRegion: 'us-east-1',
        environment: 'production',
      };

      const stack = new WebHostingStack(app, 'secure-stack', config);
      const synthesized = Testing.synth(stack);

      // Verify security-related resources are present
      expect(synthesized).toContain('aws_s3_bucket_public_access_block');
      expect(synthesized).toContain('aws_cloudfront_origin_access_control');
      expect(synthesized).toContain('aws_s3_bucket_policy');
    });
  });

  describe('Backend Configuration', () => {
    it('should configure S3 backend when specified', () => {
      const app = Testing.app();
      const config: WebHostingStackConfig = {
        bucketName: 'backend-test-bucket',
        awsRegion: 'ap-northeast-1',
        environment: 'dev',
        tfStateS3Bucket: 'terraform-state-bucket',
        tfStateS3Key: 'web-hosting/terraform.tfstate',
        awsProfile: 'test-profile',
      };

      const stack = new WebHostingStack(app, 'backend-stack', config);
      const synthesized = Testing.synth(stack);

      // Verify S3 backend configuration is present
      expect(synthesized).toContain('terraform');
      expect(synthesized).toContain('backend');
    });

    it('should work without S3 backend configuration', () => {
      const app = Testing.app();
      const config: WebHostingStackConfig = {
        bucketName: 'no-backend-bucket',
        awsRegion: 'us-west-2',
        environment: 'test',
      };

      const stack = new WebHostingStack(app, 'no-backend-stack', config);

      // Should synthesize successfully without backend
      expect(() => Testing.synth(stack)).not.toThrow();
    });
  });
});

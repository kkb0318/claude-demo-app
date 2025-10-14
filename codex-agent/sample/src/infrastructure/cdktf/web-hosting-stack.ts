import { Construct } from 'constructs';
import { LocalBackend, S3Backend, TerraformOutput, TerraformStack, TerraformVariable } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';
import { CloudfrontOriginAccessControl } from '@cdktf/provider-aws/lib/cloudfront-origin-access-control';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import path from 'path';

/**
 * Configuration for Web Hosting Stack
 */
export interface WebHostingStackConfig {
  bucketName: string;
  awsRegion: string;
  environment: string;
  workspaceDir?: string; // Optional - required only when using local backend
  defaultRootObject?: string;
  cloudfrontPriceClass?: string;
  resourcePrefix?: string;
  awsProfile?: string;
  tfStateS3Bucket?: string;
  tfStateS3Key?: string;
}

/**
 * CDKTF Stack for AWS S3 + CloudFront Web Hosting
 *
 * This stack defines the infrastructure resources for static web hosting:
 * - S3 Bucket for storing website files
 * - CloudFront Distribution for CDN
 * - Origin Access Control (OAC) for secure S3 access
 * - Proper security configurations
 *
 * Following Infrastructure Layer principles:
 * - Implements concrete infrastructure details
 * - Uses external libraries (CDKTF, AWS provider)
 * - Can be swapped with other implementations
 */
export class WebHostingStack extends TerraformStack {
  public readonly bucket: S3Bucket;
  public readonly distribution: CloudfrontDistribution;

  constructor(scope: Construct, id: string, config: WebHostingStackConfig) {
    super(scope, id);

    const resourcePrefix = config.resourcePrefix || '';

    // Define Terraform variables
    const awsRegion = new TerraformVariable(this, 'aws_region', {
      type: 'string',
      default: config.awsRegion,
    });

    const bucketName = new TerraformVariable(this, 'bucket_name', {
      type: 'string',
      default: config.bucketName,
    });

    const environment = new TerraformVariable(this, 'environment', {
      type: 'string',
      default: config.environment,
    });

    const defaultRootObject = new TerraformVariable(this, 'default_root_object', {
      type: 'string',
      default: config.defaultRootObject || 'index.html',
    });

    const cloudfrontPriceClass = new TerraformVariable(this, 'cloudfront_price_class', {
      type: 'string',
      default: config.cloudfrontPriceClass || 'PriceClass_100',
    });

    // Configure Backend for Terraform state
    if (config.tfStateS3Bucket) {
      // Use S3 Backend if configured
      new S3Backend(this, {
        bucket: config.tfStateS3Bucket,
        key: config.tfStateS3Key || `web-hosting/${resourcePrefix}terraform.tfstate`,
        region: config.awsRegion,
        profile: config.awsProfile,
      });
    } else if (config.workspaceDir) {
      // Use Local Backend and store state in workspace directory
      const stateFileName = `terraform.${id}.tfstate`;
      const statePath = path.join(config.workspaceDir, stateFileName);
      new LocalBackend(this, {
        path: statePath,
      });
    }
    // If neither S3 nor workspaceDir is provided, CDKTF will use default local backend

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion.stringValue,
      profile: config.awsProfile,
    });

    // Create S3 Bucket for website hosting
    this.bucket = new S3Bucket(this, `${resourcePrefix}website`, {
      bucket: bucketName.stringValue,
      tags: {
        Name: bucketName.stringValue,
        Environment: environment.stringValue,
        ManagedBy: 'CDKTF',
      },
    });

    // Block all public access to S3 bucket
    new S3BucketPublicAccessBlock(this, `${resourcePrefix}website_public_access_block`, {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Create Origin Access Control for CloudFront
    const originAccessControl = new CloudfrontOriginAccessControl(
      this,
      `${resourcePrefix}website_oac`,
      {
        name: `${bucketName.stringValue}-oac`,
        description: `Origin Access Control for ${bucketName.stringValue}`,
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      }
    );

    // Create CloudFront Distribution
    this.distribution = new CloudfrontDistribution(
      this,
      `${resourcePrefix}website_distribution`,
      {
        enabled: true,
        isIpv6Enabled: true,
        comment: `CloudFront distribution for ${bucketName.stringValue}`,
        defaultRootObject: defaultRootObject.stringValue,
        priceClass: cloudfrontPriceClass.stringValue,

        origin: [
          {
            domainName: this.bucket.bucketRegionalDomainName,
            originId: `S3-${bucketName.stringValue}`,
            originAccessControlId: originAccessControl.id,
          },
        ],

        defaultCacheBehavior: {
          targetOriginId: `S3-${bucketName.stringValue}`,
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          // Use AWS Managed Cache Policy for web hosting (CachingOptimized)
          // This is the recommended approach instead of legacy forwardedValues
          cachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
        },

        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },

        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },

        // Custom error responses for SPA routing
        customErrorResponse: [
          {
            errorCode: 403,
            responseCode: 200,
            responsePagePath: `/${defaultRootObject.stringValue}`,
            errorCachingMinTtl: 300,
          },
          {
            errorCode: 404,
            responseCode: 200,
            responsePagePath: `/${defaultRootObject.stringValue}`,
            errorCachingMinTtl: 300,
          },
        ],

        tags: {
          Name: `${bucketName.stringValue}-distribution`,
          Environment: environment.stringValue,
          ManagedBy: 'CDKTF',
        },
      }
    );

    // Create S3 Bucket Policy to allow CloudFront access
    new S3BucketPolicy(this, `${resourcePrefix}website_bucket_policy`, {
      bucket: this.bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowCloudFrontServicePrincipal',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudfront.amazonaws.com',
            },
            Action: 's3:GetObject',
            Resource: `${this.bucket.arn}/*`,
            Condition: {
              StringEquals: {
                'AWS:SourceArn': this.distribution.arn,
              },
            },
          },
        ],
      }),
    });

    // Define Terraform Outputs
    new TerraformOutput(this, 'cloudfront_url', {
      value: `https://${this.distribution.domainName}`,
      description: 'CloudFront distribution URL for accessing the website',
    });

    new TerraformOutput(this, 'cloudfront_domain_name', {
      value: this.distribution.domainName,
      description: 'CloudFront distribution domain name',
    });

    new TerraformOutput(this, 'cloudfront_distribution_id', {
      value: this.distribution.id,
      description: 'CloudFront distribution ID',
    });

    new TerraformOutput(this, 's3_bucket_name', {
      value: this.bucket.id,
      description: 'Name of the S3 bucket',
    });

    new TerraformOutput(this, 's3_bucket_arn', {
      value: this.bucket.arn,
      description: 'ARN of the S3 bucket',
    });
  }
}

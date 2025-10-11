import { Construct } from "constructs";
import { TerraformStack, S3Backend, TerraformVariable, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { CloudfrontOriginAccessControl } from "@cdktf/provider-aws/lib/cloudfront-origin-access-control";
import { CloudfrontDistribution } from "@cdktf/provider-aws/lib/cloudfront-distribution";
import { S3BucketPolicy } from "@cdktf/provider-aws/lib/s3-bucket-policy";

export interface SimpleWebHostingStackConfig {
  bucketName: string;
  awsRegion: string;
  environment: string;
  defaultRootObject: string;
  cloudfrontPriceClass: string;
  resourcePrefix?: string;
}

export class SimpleWebHostingStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: SimpleWebHostingStackConfig) {
    super(scope, id);

    const resourcePrefix = config.resourcePrefix || "";

    const awsRegion = new TerraformVariable(this, "aws_region", {
      type: "string",
      default: config.awsRegion,
    });

    const bucketName = new TerraformVariable(this, "bucket_name", {
      type: "string",
      default: config.bucketName,
    });

    const environment = new TerraformVariable(this, "environment", {
      type: "string",
      default: config.environment,
    });

    const defaultRootObject = new TerraformVariable(this, "default_root_object", {
      type: "string",
      default: config.defaultRootObject,
    });

    const cloudfrontPriceClass = new TerraformVariable(this, "cloudfront_price_class", {
      type: "string",
      default: config.cloudfrontPriceClass,
    });

    new S3Backend(this, {
      bucket: "agent-galaxy-tfstate-storage",
      key: `simple-web-hosting/${resourcePrefix}terraform.tfstate`,
      region: config.awsRegion,
    });

    new AwsProvider(this, "aws", {
      region: awsRegion.stringValue,
      profile: "agent-galaxy",
    });

    const websiteBucket = new S3Bucket(this, `${resourcePrefix}website`, {
      bucket: bucketName.stringValue,
      tags: {
        Name: bucketName.stringValue,
        Environment: environment.stringValue,
      },
    });

    new S3BucketPublicAccessBlock(this, `${resourcePrefix}website_public_access_block`, {
      bucket: websiteBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    const originAccessControl = new CloudfrontOriginAccessControl(this, `${resourcePrefix}website_oac`, {
      name: `${bucketName.stringValue}-oac`,
      description: `Origin Access Control for ${bucketName.stringValue}`,
      originAccessControlOriginType: "s3",
      signingBehavior: "always",
      signingProtocol: "sigv4",
    });

    const distribution = new CloudfrontDistribution(this, `${resourcePrefix}website_distribution`, {
      enabled: true,
      isIpv6Enabled: true,
      comment: `CloudFront distribution for ${bucketName.stringValue}`,
      defaultRootObject: defaultRootObject.stringValue,
      priceClass: cloudfrontPriceClass.stringValue,

      origin: [
        {
          domainName: websiteBucket.bucketRegionalDomainName,
          originId: `S3-${bucketName.stringValue}`,
          originAccessControlId: originAccessControl.id,
        },
      ],

      defaultCacheBehavior: {
        targetOriginId: `S3-${bucketName.stringValue}`,
        viewerProtocolPolicy: "redirect-to-https",
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD"],
        compress: true,
        minTtl: 0,
        defaultTtl: 86400,
        maxTtl: 31536000,
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: "none",
          },
        },
      },

      restrictions: {
        geoRestriction: {
          restrictionType: "none",
        },
      },

      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },

      customErrorResponse: [
        {
          errorCode: 403,
          responseCode: 200,
          responsePagePath: "/index.html",
          errorCachingMinTtl: 300,
        },
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: "/index.html",
          errorCachingMinTtl: 300,
        },
      ],

      tags: {
        Name: `${bucketName.stringValue}-distribution`,
        Environment: environment.stringValue,
      },
    });

    new S3BucketPolicy(this, `${resourcePrefix}website_bucket_policy`, {
      bucket: websiteBucket.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "AllowCloudFrontServicePrincipal",
            Effect: "Allow",
            Principal: {
              Service: "cloudfront.amazonaws.com",
            },
            Action: "s3:GetObject",
            Resource: `${websiteBucket.arn}/*`,
            Condition: {
              StringEquals: {
                "AWS:SourceArn": distribution.arn,
              },
            },
          },
        ],
      }),
    });

    new TerraformOutput(this, "cloudfront_url", {
      value: `https://${distribution.domainName}`,
      description: "CloudFront distribution URL for accessing the website",
    });

    new TerraformOutput(this, "cloudfront_domain_name", {
      value: distribution.domainName,
      description: "CloudFront distribution domain name",
    });

    new TerraformOutput(this, "cloudfront_distribution_id", {
      value: distribution.id,
      description: "CloudFront distribution ID",
    });

    new TerraformOutput(this, "s3_bucket_name", {
      value: websiteBucket.id,
      description: "Name of the S3 bucket",
    });

    new TerraformOutput(this, "s3_bucket_arn", {
      value: websiteBucket.arn,
      description: "ARN of the S3 bucket",
    });
  }
}

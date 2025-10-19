import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import type {
  ApplicationDeployer,
  DeployConfig,
  DeployResult,
} from '@domain/ports/application-deployer.port';

/**
 * Get MIME type based on file extension
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * S3 Deployer
 * 
 * Infrastructure layer adapter implementing ApplicationDeployer port
 * using AWS SDK v3 with proper Content-Type handling.
 * 
 * Responsibilities:
 * - Upload built application files to S3 bucket with correct MIME types
 * - Recursively upload all files in a directory
 * - Handle AWS credentials and region configuration
 */
export class S3Deployer implements ApplicationDeployer {
  async deploy(config: DeployConfig): Promise<DeployResult> {
    const { sourceDir, bucketName, awsRegion, awsProfile } = config;

    // Validate source directory exists
    if (!fs.existsSync(sourceDir)) {
      return {
        success: false,
        filesUploaded: 0,
        message: `Source directory does not exist: ${sourceDir}`,
      };
    }

    // Check if source directory is empty
    const files = fs.readdirSync(sourceDir);
    if (files.length === 0) {
      return {
        success: false,
        filesUploaded: 0,
        message: `Source directory is empty: ${sourceDir}`,
      };
    }

    try {
      // Configure S3 client with AWS profile support
      const clientConfig: any = {
        region: awsRegion,
      };
      
      // Set AWS profile if provided (via AWS_PROFILE env var or config)
      if (awsProfile) {
        process.env.AWS_PROFILE = awsProfile;
      }
      
      const s3Client = new S3Client(clientConfig);

      // Upload all files recursively
      const uploadedFiles = await this.uploadDirectory(s3Client, sourceDir, bucketName, sourceDir);

      return {
        success: true,
        filesUploaded: uploadedFiles,
        message: `Successfully deployed ${uploadedFiles} files to ${bucketName}`,
      };
    } catch (error) {
      return {
        success: false,
        filesUploaded: 0,
        message: error instanceof Error ? error.message : 'Unknown deployment error',
      };
    }
  }

  /**
   * Recursively upload directory to S3 with proper Content-Type
   */
  private async uploadDirectory(
    s3Client: S3Client,
    localDir: string,
    bucketName: string,
    baseDir: string
  ): Promise<number> {
    let uploadCount = 0;
    const items = fs.readdirSync(localDir);

    for (const item of items) {
      const localPath = path.join(localDir, item);
      const stat = fs.statSync(localPath);

      if (stat.isDirectory()) {
        // Recursively upload subdirectory
        uploadCount += await this.uploadDirectory(s3Client, localPath, bucketName, baseDir);
      } else {
        // Upload file with proper Content-Type
        const s3Key = path.relative(baseDir, localPath).replace(/\\/g, '/');
        const fileContent = fs.readFileSync(localPath);
        const contentType = getMimeType(localPath);

        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
            Body: fileContent,
            ContentType: contentType,
          })
        );

        uploadCount++;
      }
    }

    return uploadCount;
  }
}

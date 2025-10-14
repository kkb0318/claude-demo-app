import { S3Client } from '@aws-sdk/client-s3';
import { S3SyncClient } from 's3-sync-client';
import * as fs from 'fs';
import type {
  ApplicationDeployer,
  DeployConfig,
  DeployResult,
} from '@domain/ports/application-deployer.port';

/**
 * S3 Deployer
 * 
 * Infrastructure layer adapter implementing ApplicationDeployer port
 * using AWS SDK v3 and s3-sync-client.
 * 
 * Responsibilities:
 * - Upload built application files to S3 bucket
 * - Sync local directory with S3 bucket
 * - Optionally delete removed files from S3
 * - Handle AWS credentials and region configuration
 */
export class S3Deployer implements ApplicationDeployer {
  async deploy(config: DeployConfig): Promise<DeployResult> {
    const { sourceDir, bucketName, awsRegion, awsProfile, deleteRemoved } = config;

    // Validate source directory exists
    if (!fs.existsSync(sourceDir)) {
      return {
        success: false,
        filesUploaded: 0,
        filesDeleted: deleteRemoved ? 0 : undefined,
        message: `Source directory does not exist: ${sourceDir}`,
      };
    }

    // Check if source directory is empty
    const files = fs.readdirSync(sourceDir);
    if (files.length === 0) {
      return {
        success: false,
        filesUploaded: 0,
        filesDeleted: deleteRemoved ? 0 : undefined,
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

      // Create sync client
      const syncClient = new S3SyncClient({ client: s3Client });

      // Count files before sync
      const filesBefore = this.countFiles(sourceDir);

      // Sync local directory to S3 bucket
      // Note: s3-sync-client automatically sets Content-Type based on file extension
      await syncClient.sync(sourceDir, `s3://${bucketName}`, {
        del: deleteRemoved ?? false,
      });

      return {
        success: true,
        filesUploaded: filesBefore,
        filesDeleted: deleteRemoved ? 0 : undefined,
        message: `Successfully deployed ${filesBefore} files to ${bucketName}`,
      };
    } catch (error) {
      return {
        success: false,
        filesUploaded: 0,
        filesDeleted: deleteRemoved ? 0 : undefined,
        message: error instanceof Error ? error.message : 'Unknown deployment error',
      };
    }
  }

  /**
   * Recursively count all files in a directory
   */
  private countFiles(dirPath: string): number {
    let count = 0;
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = `${dirPath}/${item}`;
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        count += this.countFiles(fullPath);
      } else {
        count++;
      }
    }

    return count;
  }
}

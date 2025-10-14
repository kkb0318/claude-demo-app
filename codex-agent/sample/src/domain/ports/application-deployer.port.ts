/**
 * Configuration for deploying application to cloud storage
 */
export interface DeployConfig {
  /**
   * Local directory path containing built application files
   */
  sourceDir: string;

  /**
   * Target S3 bucket name
   */
  bucketName: string;

  /**
   * AWS region
   */
  awsRegion: string;

  /**
   * Optional: AWS profile to use
   */
  awsProfile?: string;

  /**
   * Optional: Delete files in bucket that don't exist in source
   * @default false
   */
  deleteRemoved?: boolean;
}

/**
 * Result of deployment operation
 */
export interface DeployResult {
  success: boolean;
  message: string;
  filesUploaded: number;
  filesDeleted?: number;
}

/**
 * Domain Port: Application Deployer
 *
 * Defines the contract for deploying built application files to cloud storage.
 * This is an abstraction that the application layer depends on,
 * following the Dependency Inversion Principle.
 *
 * Implementations will be provided by the infrastructure layer
 * (e.g., S3Deployer, AzureBlobDeployer, GCSDeployer, etc.)
 */
export interface ApplicationDeployer {
  /**
   * Deploy built application files to cloud storage
   *
   * @param config - Configuration for deployment
   * @returns Result containing success status, message, and statistics
   */
  deploy(config: DeployConfig): Promise<DeployResult>;
}

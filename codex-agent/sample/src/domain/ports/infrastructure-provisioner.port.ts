/**
 * Configuration for infrastructure provisioning
 */
export interface InfrastructureConfig {
  bucketName: string;
  awsRegion: string;
  environment: string;
  workspaceDir: string;
  defaultRootObject?: string;
  cloudfrontPriceClass?: string;
  resourcePrefix?: string;
}

/**
 * Result of infrastructure provisioning operation
 */
export interface ProvisionResult {
  success: boolean;
  outputs: {
    cloudfrontUrl?: string;
    cloudfrontDomainName?: string;
    cloudfrontDistributionId?: string;
    s3BucketName?: string;
    s3BucketArn?: string;
  };
  message: string;
}

/**
 * Domain Port: Infrastructure Provisioner
 * 
 * Defines the contract for infrastructure provisioning operations.
 * This is an abstraction that the application layer depends on,
 * following the Dependency Inversion Principle.
 * 
 * Implementations will be provided by the infrastructure layer
 * (e.g., CDKTFProvisioner, TerraformProvisioner, etc.)
 */
export interface InfrastructureProvisioner {
  /**
   * Provision infrastructure resources
   * 
   * @param config - Configuration for infrastructure
   * @returns Result containing outputs and status
   */
  provision(config: InfrastructureConfig): Promise<ProvisionResult>;

  /**
   * Destroy infrastructure resources
   * 
   * @param config - Configuration for infrastructure
   * @returns Result containing status
   */
  destroy(config: InfrastructureConfig): Promise<ProvisionResult>;

  /**
   * Plan infrastructure changes (dry-run)
   * 
   * @param config - Configuration for infrastructure
   * @returns Result containing planned changes
   */
  plan(config: InfrastructureConfig): Promise<ProvisionResult>;
}

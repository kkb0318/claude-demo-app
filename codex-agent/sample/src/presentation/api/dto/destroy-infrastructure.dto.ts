/**
 * DTO for destroying infrastructure
 */
export class DestroyInfrastructureDto {
  /**
   * S3 bucket name to destroy
   */
  bucketName!: string;

  /**
   * AWS region where the infrastructure is deployed
   */
  awsRegion!: string;

  /**
   * Workspace directory containing Terraform state
   */
  workspaceDir!: string;

  /**
   * AWS profile to use (default: agent-galaxy)
   */
  awsProfile: string = 'agent-galaxy';

  /**
   * Validate the DTO
   * @returns Array of validation error messages (empty if valid)
   */
  validate(): string[] {
    const errors: string[] = [];

    // Validate bucketName
    if (!this.bucketName) {
      errors.push('bucketName is required');
    } else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(this.bucketName)) {
      errors.push('bucketName must contain only lowercase letters, numbers, and hyphens');
    }

    // Validate awsRegion
    if (!this.awsRegion) {
      errors.push('awsRegion is required');
    } else if (!/^[a-z]{2}-[a-z]+-\d{1}$/.test(this.awsRegion)) {
      errors.push('awsRegion must be a valid AWS region format (e.g., ap-northeast-1)');
    }

    // Validate workspaceDir
    if (!this.workspaceDir) {
      errors.push('workspaceDir is required');
    }

    return errors;
  }
}

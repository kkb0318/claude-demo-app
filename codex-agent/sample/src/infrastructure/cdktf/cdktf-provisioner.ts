import { App } from 'cdktf';
import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

import type {
  InfrastructureConfig,
  InfrastructureProvisioner,
  ProvisionResult,
} from '@domain/ports/infrastructure-provisioner.port';

import { WebHostingStack } from './web-hosting-stack';

const execAsync = promisify(exec);

/**
 * CDKTF-based implementation of InfrastructureProvisioner
 *
 * This adapter connects the domain port to the CDKTF infrastructure layer.
 * It handles CDKTF app synthesis only.
 *
 * Note: This implementation only synthesizes Terraform configuration.
 * Actual Terraform execution (init, plan, apply, destroy) should be
 * handled by external tools or orchestration layers.
 *
 * Following the Adapter pattern:
 * - Implements domain port interface
 * - Wraps external library (CDKTF)
 * - Translates between domain and infrastructure concerns
 */
export class CDKTFProvisioner implements InfrastructureProvisioner {
  constructor(private readonly awsProfile?: string) {}

  async provision(config: InfrastructureConfig): Promise<ProvisionResult> {
    try {
      const stackName = this.getStackName(config);

      // Step 1: Synthesize CDKTF app (generates Terraform JSON)
      await this.synthesizeCDKTFApp(config, stackName);

      const terraformDir = this.getTerraformDir(config.workspaceDir, stackName);

      // Step 2: Initialize Terraform
      await this.runTerraformCommand('terraform init -reconfigure', terraformDir);

      // Step 3: Apply Terraform to provision infrastructure
      await this.runTerraformCommand('terraform apply -auto-approve', terraformDir);

      // Step 4: Get outputs from Terraform state
      const outputs = await this.getTerraformOutputs(terraformDir);

      return {
        success: true,
        outputs: {
          cloudfrontUrl: outputs.cloudfront_url || '',
          cloudfrontDomainName: outputs.cloudfront_domain_name || '',
          cloudfrontDistributionId: outputs.cloudfront_distribution_id || '',
          s3BucketName: outputs.s3_bucket_name || config.bucketName,
          s3BucketArn: outputs.s3_bucket_arn || '',
        },
        message: 'Infrastructure provisioned successfully',
      };
    } catch (error) {
      return {
        success: false,
        outputs: {},
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async destroy(config: InfrastructureConfig): Promise<ProvisionResult> {
    try {
      const stackName = this.getStackName(config);
      const terraformDir = this.getTerraformDir(config.workspaceDir, stackName);

      // Check if infrastructure exists by looking for state file
      const infrastructureExists = await this.checkInfrastructureExists(config.workspaceDir, stackName);
      if (!infrastructureExists) {
        return {
          success: true,
          outputs: {},
          message: 'No infrastructure found to destroy',
        };
      }

      // Empty S3 bucket before destroying (required for successful deletion)
      try {
        await this.emptyS3Bucket(config.bucketName);
      } catch (error) {
        console.warn('Failed to empty S3 bucket (this is usually OK):', error);
      }

      // Destroy Terraform resources
      await this.runTerraformCommand('terraform destroy -auto-approve', terraformDir);

      return {
        success: true,
        outputs: {},
        message: 'Infrastructure destroyed successfully',
      };
    } catch (error) {
      return {
        success: false,
        outputs: {},
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async plan(config: InfrastructureConfig): Promise<ProvisionResult> {
    try {
      const stackName = this.getStackName(config);

      // Synthesize CDKTF app
      await this.synthesizeCDKTFApp(config, stackName);

      return {
        success: true,
        outputs: {},
        message: 'CDKTF app synthesized successfully. Run "terraform plan" manually to see planned changes.',
      };
    } catch (error) {
      return {
        success: false,
        outputs: {},
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate a consistent stack name from config
   */
  private getStackName(config: InfrastructureConfig): string {
    const prefix = config.resourcePrefix || '';
    return `${prefix}web-hosting-${config.environment}`;
  }

  /**
   * Get the terraform directory path for a given stack
   */
  private getTerraformDir(workspaceDir: string, stackName: string): string {
    return path.join(workspaceDir, 'cdktf.out', 'stacks', stackName);
  }

  /**
   * Check if infrastructure exists by looking for terraform state file in workspace
   */
  private async checkInfrastructureExists(workspaceDir: string, stackName: string): Promise<boolean> {
    try {
      // Check for state file in workspace directory
      const stateFileName = `terraform.${stackName}.tfstate`;
      const stateFilePath = path.join(workspaceDir, stateFileName);
      await fs.access(stateFilePath);
      
      // Read state file to verify it contains resources
      const stateContent = await fs.readFile(stateFilePath, 'utf-8');
      const state = JSON.parse(stateContent);
      
      // Check if state has resources (not just an empty state)
      return state.resources && state.resources.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Synthesize CDKTF app (generates Terraform JSON files)
   */
  private async synthesizeCDKTFApp(
    config: InfrastructureConfig,
    stackName: string
  ): Promise<void> {
    const outdir = path.join(config.workspaceDir, 'cdktf.out');
    await fs.mkdir(outdir, { recursive: true });

    const app = new App({ outdir });

    new WebHostingStack(app, stackName, {
      bucketName: config.bucketName,
      awsRegion: config.awsRegion,
      environment: config.environment,
      workspaceDir: config.workspaceDir,
      defaultRootObject: config.defaultRootObject,
      cloudfrontPriceClass: config.cloudfrontPriceClass,
      resourcePrefix: config.resourcePrefix,
      awsProfile: this.awsProfile,
    });

    app.synth();
  }

  /**
   * Run a Terraform command in the specified directory
   */
  private async runTerraformCommand(
    command: string,
    cwd: string
  ): Promise<{ stdout: string; stderr: string }> {
    const env = { ...process.env };
    if (this.awsProfile) {
      env.AWS_PROFILE = this.awsProfile;
    }

    return await execAsync(command, { cwd, env });
  }

  /**
   * Get Terraform outputs as a JSON object
   */
  private async getTerraformOutputs(terraformDir: string): Promise<Record<string, string>> {
    const result = await this.runTerraformCommand('terraform output -json', terraformDir);
    const outputs = JSON.parse(result.stdout) as Record<string, { value: string }>;

    // Convert Terraform output format to simple key-value pairs
    const simplified: Record<string, string> = {};
    for (const [key, value] of Object.entries(outputs)) {
      simplified[key] = value.value;
    }

    return simplified;
  }

  /**
   * Empty an S3 bucket before destroying
   */
  private async emptyS3Bucket(bucketName: string): Promise<void> {
    const command = `aws s3 rm s3://${bucketName} --recursive`;
    const env = { ...process.env };
    if (this.awsProfile) {
      env.AWS_PROFILE = this.awsProfile;
    }

    await execAsync(command, { env });
  }
}

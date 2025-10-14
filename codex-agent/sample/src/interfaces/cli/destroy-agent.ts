#!/usr/bin/env tsx

/**
 * CLI for destroying AWS infrastructure created by coding agent
 * 
 * Usage:
 *   BUCKET_NAME=demo-app-123 AWS_REGION=ap-northeast-1 pnpm destroy
 *   
 *   Or with workspace directory:
 *   WORKSPACE_DIR=/path/to/workspace BUCKET_NAME=demo-app-123 pnpm destroy
 */

import { CDKTFProvisioner } from '@infrastructure/cdktf/cdktf-provisioner';
import type { InfrastructureConfig } from '@domain/ports/infrastructure-provisioner.port';

interface DestroyOptions {
  bucketName: string;
  awsRegion: string;
  awsProfile: string;
  workspaceDir?: string;
}

function parseEnv(): DestroyOptions {
  const bucketName = process.env.BUCKET_NAME;
  const awsRegion = process.env.AWS_REGION || 'ap-northeast-1';
  const awsProfile = process.env.AWS_PROFILE || 'agent-galaxy';
  const workspaceDir = process.env.WORKSPACE_DIR;

  if (!bucketName) {
    console.error('❌ Error: BUCKET_NAME environment variable is required');
    console.error('');
    console.error('Usage:');
    console.error('  BUCKET_NAME=demo-app-123 AWS_REGION=ap-northeast-1 pnpm destroy');
    console.error('');
    console.error('Optional:');
    console.error('  WORKSPACE_DIR=/path/to/workspace - Directory containing CDKTF state');
    console.error('  AWS_PROFILE=profile-name - AWS profile to use (default: agent-galaxy)');
    process.exit(1);
  }

  return {
    bucketName,
    awsRegion,
    awsProfile,
    workspaceDir,
  };
}

export async function runDestroyAgentCli(): Promise<void> {
  const options = parseEnv();

  console.log('🗑️  Destroying AWS infrastructure...');
  console.log(`📦 Bucket: ${options.bucketName}`);
  console.log(`🌏 Region: ${options.awsRegion}`);
  console.log(`👤 Profile: ${options.awsProfile}`);
  if (options.workspaceDir) {
    console.log(`📁 Workspace: ${options.workspaceDir}`);
  }
  console.log('');

  const provisioner = new CDKTFProvisioner(options.awsProfile);

  const config: InfrastructureConfig = {
    bucketName: options.bucketName,
    awsRegion: options.awsRegion,
    workspaceDir: options.workspaceDir || '/tmp/destroy-agent-workspace',
    environment: 'dev', // Must match the environment used during creation
    defaultRootObject: 'index.html',
    cloudfrontPriceClass: 'PriceClass_All',
    resourcePrefix: '',
  };

  console.log('⏳ Starting destruction process...');
  console.log('   This will:');
  console.log('   1. Empty the S3 bucket');
  console.log('   2. Run terraform destroy to remove all infrastructure');
  console.log('');

  try {
    const result = await provisioner.destroy(config);

    if (result.success) {
      console.log('\n✅ Infrastructure destroyed successfully!');
      console.log(`📝 ${result.message}`);
    } else {
      console.error('\n❌ Failed to destroy infrastructure');
      console.error(`📝 ${result.message}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Unexpected error during destruction:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDestroyAgentCli().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

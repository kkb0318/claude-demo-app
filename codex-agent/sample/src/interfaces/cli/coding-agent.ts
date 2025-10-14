import { Codex } from '@openai/codex-sdk';
import { SimpleCodexAgent } from '@infrastructure/agents/simple-codex-agent';
import { prepareWorkspace } from '@infrastructure/system/workspace';
import { GenerateAppUseCase } from '@application/use-cases/generate-app.use-case';
import { loadCodexEnvironment } from '@infrastructure/config/codex.config';
import { CDKTFProvisioner } from '@infrastructure/cdktf/cdktf-provisioner';
import { S3Deployer } from '@infrastructure/aws/s3-deployer';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

interface CliOptions {
  task: string;
  provision?: boolean;
  deploy?: boolean;
  bucketName?: string;
  awsRegion?: string;
}

function parseArgs(argv: string[]): CliOptions {
  if (argv.length < 3) {
    throw new Error('Missing task description. Usage: pnpm agent "<task description>"');
  }

  const task = argv.slice(2).join(' ');
  return {
    task,
    provision: process.env.PROVISION === 'true',
    deploy: process.env.DEPLOY === 'true',
    bucketName: process.env.BUCKET_NAME,
    awsRegion: process.env.AWS_REGION || 'ap-northeast-1',
  };
}

export async function runCodingAgentCli(): Promise<void> {
  const options = parseArgs(process.argv);
  
  // Infrastructure layer: 依存関係の初期化
  const environment = loadCodexEnvironment();
  const codex = new Codex({
    apiKey: environment.apiKey,
    baseUrl: environment.baseUrl
  });
  const agent = new SimpleCodexAgent(codex);

  // オプショナルな依存関係の初期化
  const awsProfile = process.env.AWS_PROFILE || 'agent-galaxy';
  const provisioner = options.provision ? new CDKTFProvisioner(awsProfile) : undefined;
  const deployer = options.deploy ? new S3Deployer() : undefined;

  // ワークスペースの準備（テンプレートプロジェクトをコピー）
  // Note: Always use prepareWorkspace() to ensure template is copied
  // Custom workspace directories are not yet supported
  const workspace = await prepareWorkspace();

  // Application layer: ユースケースの初期化
  const useCase = new GenerateAppUseCase(agent, provisioner, deployer);

  console.log(`🚀 Starting coding agent for task: ${options.task}`);
  console.log(`📂 Workspace root: ${workspace.rootDir}`);
  if (options.provision) {
    console.log(`🏗️  Infrastructure provisioning: ENABLED`);
    console.log(`   Bucket: ${options.bucketName || 'auto-generated'}`);
    console.log(`   Region: ${options.awsRegion}`);
  }
  if (options.deploy) {
    console.log(`🚀 Deployment: ENABLED`);
  }

  try {
    // インフラ設定の準備
    const infrastructureConfig = options.provision && options.bucketName ? {
      bucketName: options.bucketName,
      awsRegion: options.awsRegion!,
      environment: 'dev',
      workspaceDir: workspace.rootDir,
    } : undefined;

    // デプロイ設定の準備
    const deployConfig = options.deploy && options.bucketName ? {
      sourceDir: path.join(workspace.rootDir, 'out'),
      bucketName: options.bucketName,
      awsRegion: options.awsRegion!,
      awsProfile,
      deleteRemoved: true,
    } : undefined;

    // ユースケースの実行
    const result = await useCase.execute({
      task: options.task,
      workspaceDir: workspace.rootDir,
      infrastructureConfig,
      deployConfig,
    });

    // 結果の表示
    console.log('\n✅ Task completed successfully!');
    console.log(`\n📊 Summary: ${result.summary}`);
    console.log(`\n🔗 Thread ID: ${result.threadId}`);
    console.log(`\n📁 Files modified: ${result.statistics.filesModified}`);
    console.log(`⚡ Commands executed: ${result.statistics.commandsExecuted}`);
    console.log(`\n📂 Workspace: ${result.workspaceDir}`);

    // インフラプロビジョニング結果
    if (result.infrastructure) {
      console.log('\n🏗️  Infrastructure Provisioning:');
      if (result.infrastructure.success) {
        console.log('   ✅ Status: Success');
        if (result.infrastructure.outputs.cloudfrontUrl) {
          console.log(`   🌐 CloudFront URL: ${result.infrastructure.outputs.cloudfrontUrl}`);
        }
        if (result.infrastructure.outputs.s3BucketName) {
          console.log(`   🪣 S3 Bucket: ${result.infrastructure.outputs.s3BucketName}`);
        }
      } else {
        console.log('   ❌ Status: Failed');
        console.log(`   📝 Message: ${result.infrastructure.message}`);
      }
    }

    // デプロイ結果
    if (result.deployment) {
      console.log('\n🚀 Deployment:');
      if (result.deployment.success) {
        console.log('   ✅ Status: Success');
        console.log(`   📤 Files uploaded: ${result.deployment.filesUploaded}`);
        if (result.deployment.filesDeleted !== undefined) {
          console.log(`   🗑️  Files deleted: ${result.deployment.filesDeleted}`);
        }
      } else {
        console.log('   ❌ Status: Failed');
        console.log(`   📝 Message: ${result.deployment.message}`);
      }
    }

    // 最終的なアクセスURL
    if (result.infrastructure?.success && result.infrastructure.outputs.cloudfrontUrl) {
      console.log('\n🎉 Your application is live!');
      console.log(`   👉 Access it at: ${result.infrastructure.outputs.cloudfrontUrl}`);
    }
    
  } catch (error) {
    console.error('\n❌ Task failed:', error);
    process.exit(1);
  }
}

const mainModuleUrl = pathToFileURL(process.argv[1] ?? '').href;

if (import.meta.url === mainModuleUrl) {
  runCodingAgentCli().catch((error) => {
    console.error('Coding agent failed:', error);
    process.exit(1);
  });
}

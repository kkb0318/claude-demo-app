import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import type { CodeGenerationAgent } from '@domain/ports/code-generation-agent.port';
import type {
  InfrastructureConfig,
  InfrastructureProvisioner,
  ProvisionResult,
} from '@domain/ports/infrastructure-provisioner.port';
import type {
  ApplicationDeployer,
  DeployConfig,
  DeployResult,
} from '@domain/ports/application-deployer.port';

const execAsync = promisify(exec);

/**
 * Request for generating an application
 */
export interface GenerateAppRequest {
  task: string;
  workspaceDir: string;
  infrastructureConfig?: InfrastructureConfig;
  deployConfig?: DeployConfig;
}

/**
 * Result of application generation
 */
export interface GenerateAppResult {
  success: boolean;
  summary: string;
  threadId: string;
  actions: any[];
  workspaceDir: string;
  statistics: {
    filesModified: number;
    commandsExecuted: number;
  };
  infrastructure?: ProvisionResult;
  deployment?: DeployResult;
}

/**
 * Use Case: Generate Application
 * 
 * Application layer orchestrates the use case by:
 * 1. Validating business rules
 * 2. Calling domain services/ports
 * 3. Aggregating results
 * 
 * Following Clean Architecture principles:
 * - Thin orchestration layer
 * - Depends on domain ports (not implementations)
 * - Contains use-case specific logic
 */
export class GenerateAppUseCase {
  constructor(
    private readonly agent: CodeGenerationAgent,
    private readonly provisioner?: InfrastructureProvisioner,
    private readonly deployer?: ApplicationDeployer
  ) {}

  async execute(request: GenerateAppRequest): Promise<GenerateAppResult> {
    const { task, workspaceDir, infrastructureConfig, deployConfig } = request;

    // Business rule validation
    if (!task || task.trim().length === 0) {
      throw new Error('Task description cannot be empty');
    }

    // Execute code generation through domain port
    const result = await this.agent.generateApp(task, workspaceDir);

    // Calculate statistics
    const statistics = this.calculateStatistics(result.actions);

    // Provision infrastructure if config is provided and provisioner is available
    let infrastructure: ProvisionResult | undefined;
    if (infrastructureConfig && this.provisioner) {
      try {
        infrastructure = await this.provisioner.provision(infrastructureConfig);
      } catch (error) {
        // Log error but don't fail the entire operation
        console.error('Infrastructure provisioning failed:', error);
        infrastructure = {
          success: false,
          outputs: {},
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Deploy application if config is provided and deployer is available
    let deployment: DeployResult | undefined;
    if (deployConfig && this.deployer) {
      try {
        // Build Next.js app before deployment
        try {
          console.log('\n📦 Building Next.js application...');
          await this.buildNextJsApp(workspaceDir);
          console.log('✅ Build completed successfully');
        } catch (buildError) {
          console.error('⚠️  Build failed:', buildError instanceof Error ? buildError.message : 'Unknown error');
          throw buildError;
        }

        deployment = await this.deployer.deploy(deployConfig);
      } catch (error) {
        // Log error but don't fail the entire operation
        console.error('Application deployment failed:', error);
        deployment = {
          success: false,
          filesUploaded: 0,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Aggregate and return result
    return {
      ...result,
      workspaceDir,
      statistics,
      infrastructure,
      deployment,
    };
  }

  /**
   * Calculate statistics from generation actions
   */
  private calculateStatistics(actions: any[]): {
    filesModified: number;
    commandsExecuted: number;
  } {
    const toolCalls = actions.filter((a: any) => a.type === 'tool_call');
    const filesModified = toolCalls.filter((a: any) => a.tool_name === 'write_file').length;
    const commandsExecuted = toolCalls.filter((a: any) => a.tool_name === 'execute_command').length;

    return {
      filesModified,
      commandsExecuted
    };
  }

  /**
   * Build Next.js application for static export
   */
  private async buildNextJsApp(workspaceDir: string): Promise<void> {
    try {
      // Run npm build to generate static files
      const { stdout, stderr } = await execAsync('npm run build', { cwd: workspaceDir });
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error: any) {
      const errorMessage = error.stderr || error.stdout || error.message || 'Unknown error';
      throw new Error(`Failed to build Next.js app: ${errorMessage}`);
    }
  }
}

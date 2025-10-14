import { describe, it, expect, beforeEach, vi } from 'vitest';

import type {
  CodeGenerationAgent,
  CodeGenerationResult,
} from '@domain/ports/code-generation-agent.port';
import type {
  ApplicationDeployer,
  DeployConfig,
  DeployResult,
} from '@domain/ports/application-deployer.port';
import type {
  InfrastructureConfig,
  InfrastructureProvisioner,
  ProvisionResult,
} from '@domain/ports/infrastructure-provisioner.port';

import { GenerateAppUseCase, type GenerateAppRequest } from './generate-app.use-case';

// Mock child_process
vi.mock('node:child_process', () => ({
  exec: vi.fn((_cmd: string, _options: any, callback?: any) => {
    // Call callback with success by default
    if (callback) {
      callback(null, { stdout: 'Build successful', stderr: '' });
    }
  }),
}));

vi.mock('node:util', () => ({
  promisify: vi.fn((_fn: any) => {
    return async () => {
      return { stdout: 'Build successful', stderr: '' };
    };
  }),
}));

/**
 * Stub implementation of CodeGenerationAgent for testing
 */
class StubCodeGenerationAgent implements CodeGenerationAgent {
  public lastTask = '';
  public lastWorkspaceDir = '';

  async generateApp(task: string, workspaceDir: string): Promise<CodeGenerationResult> {
    this.lastTask = task;
    this.lastWorkspaceDir = workspaceDir;

    return {
      success: true,
      summary: 'Generated successfully',
      actions: [
        { type: 'tool_call', tool_name: 'write_file', tool_args: { path: 'index.ts' } },
        { type: 'tool_call', tool_name: 'execute_command', tool_args: { command: 'npm install' } },
      ],
      threadId: 'test-thread-123',
    };
  }
}

/**
 * Stub implementation of InfrastructureProvisioner for testing
 */
class StubInfrastructureProvisioner implements InfrastructureProvisioner {
  public lastConfig: InfrastructureConfig | null = null;
  public shouldSucceed = true;

  async provision(config: InfrastructureConfig): Promise<ProvisionResult> {
    this.lastConfig = config;

    if (!this.shouldSucceed) {
      return {
        success: false,
        outputs: {},
        message: 'Provisioning failed',
      };
    }

    return {
      success: true,
      outputs: {
        cloudfrontUrl: 'https://d123.cloudfront.net',
        cloudfrontDomainName: 'd123.cloudfront.net',
        cloudfrontDistributionId: 'E123ABC',
        s3BucketName: config.bucketName,
        s3BucketArn: `arn:aws:s3:::${config.bucketName}`,
      },
      message: 'Infrastructure provisioned successfully',
    };
  }

  async destroy(config: InfrastructureConfig): Promise<ProvisionResult> {
    this.lastConfig = config;
    return {
      success: true,
      outputs: {},
      message: 'Infrastructure destroyed successfully',
    };
  }

  async plan(config: InfrastructureConfig): Promise<ProvisionResult> {
    this.lastConfig = config;
    return {
      success: true,
      outputs: {},
      message: 'Plan completed',
    };
  }
}

/**
 * Stub implementation of ApplicationDeployer for testing
 */
class StubApplicationDeployer implements ApplicationDeployer {
  public lastConfig: DeployConfig | null = null;
  public shouldSucceed = true;

  async deploy(config: DeployConfig): Promise<DeployResult> {
    this.lastConfig = config;

    if (!this.shouldSucceed) {
      return {
        success: false,
        message: 'Deployment failed',
        filesUploaded: 0,
      };
    }

    return {
      success: true,
      message: `Deployed to ${config.bucketName}`,
      filesUploaded: 42,
      filesDeleted: 3,
    };
  }
}

describe('GenerateAppUseCase', () => {
  let agent: StubCodeGenerationAgent;
  let useCase: GenerateAppUseCase;

  beforeEach(() => {
    agent = new StubCodeGenerationAgent();
    useCase = new GenerateAppUseCase(agent);
  });

  describe('execute (without provisioner)', () => {
    it('should successfully generate application', async () => {
      const request: GenerateAppRequest = {
        task: 'Create a simple TODO app',
        workspaceDir: '/tmp/test-workspace',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.summary).toBe('Generated successfully');
      expect(result.threadId).toBe('test-thread-123');
      expect(result.workspaceDir).toBe('/tmp/test-workspace');
      expect(result.statistics.filesModified).toBe(1);
      expect(result.statistics.commandsExecuted).toBe(1);
    });

    it('should throw error for empty task', async () => {
      const request: GenerateAppRequest = {
        task: '',
        workspaceDir: '/tmp/test-workspace',
      };

      await expect(useCase.execute(request)).rejects.toThrow('Task description cannot be empty');
    });

    it('should throw error for whitespace-only task', async () => {
      const request: GenerateAppRequest = {
        task: '   ',
        workspaceDir: '/tmp/test-workspace',
      };

      await expect(useCase.execute(request)).rejects.toThrow('Task description cannot be empty');
    });

    it('should calculate statistics correctly', async () => {
      const request: GenerateAppRequest = {
        task: 'Create an app',
        workspaceDir: '/tmp/test',
      };

      const result = await useCase.execute(request);

      expect(result.statistics).toEqual({
        filesModified: 1,
        commandsExecuted: 1,
      });
    });
  });

  describe('execute (with provisioner)', () => {
    let provisioner: StubInfrastructureProvisioner;

    beforeEach(() => {
      provisioner = new StubInfrastructureProvisioner();
      useCase = new GenerateAppUseCase(agent, provisioner);
    });

    it('should provision infrastructure when provisioner is provided', async () => {
      const request: GenerateAppRequest = {
        task: 'Create a simple TODO app',
        workspaceDir: '/tmp/test-workspace',
        infrastructureConfig: {
          bucketName: 'test-bucket',
          awsRegion: 'ap-northeast-1',
          environment: 'dev',
          workspaceDir: '/tmp/test-workspace',
        },
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.infrastructure).toBeDefined();
      expect(result.infrastructure?.success).toBe(true);
      expect(result.infrastructure?.outputs.cloudfrontUrl).toBe('https://d123.cloudfront.net');
      expect(result.infrastructure?.outputs.s3BucketName).toBe('test-bucket');

      // Verify provisioner was called with correct config
      expect(provisioner.lastConfig).toEqual({
        bucketName: 'test-bucket',
        awsRegion: 'ap-northeast-1',
        environment: 'dev',
        workspaceDir: '/tmp/test-workspace',
      });
    });

    it('should succeed even if infrastructure provisioning fails', async () => {
      provisioner.shouldSucceed = false;

      const request: GenerateAppRequest = {
        task: 'Create an app',
        workspaceDir: '/tmp/test',
        infrastructureConfig: {
          bucketName: 'test-bucket',
          awsRegion: 'us-east-1',
          environment: 'test',
          workspaceDir: '/tmp/test',
        },
      };

      const result = await useCase.execute(request);

      // App generation should still succeed
      expect(result.success).toBe(true);
      expect(result.summary).toBe('Generated successfully');

      // But infrastructure provisioning should report failure
      expect(result.infrastructure?.success).toBe(false);
      expect(result.infrastructure?.message).toBe('Provisioning failed');
    });

    it('should not provision infrastructure when config is not provided', async () => {
      const request: GenerateAppRequest = {
        task: 'Create an app',
        workspaceDir: '/tmp/test',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.infrastructure).toBeUndefined();
      expect(provisioner.lastConfig).toBeNull();
    });
  });

  describe('Application Deployment', () => {
    let deployer: StubApplicationDeployer;

    beforeEach(() => {
      deployer = new StubApplicationDeployer();
      useCase = new GenerateAppUseCase(agent, undefined, deployer);
    });

    it('should deploy application when deployer and deployConfig are provided', async () => {
      const request: GenerateAppRequest = {
        task: 'Create a TODO app',
        workspaceDir: '/tmp/test-workspace',
        deployConfig: {
          sourceDir: '/tmp/test-workspace/dist',
          bucketName: 'my-app-bucket',
          awsRegion: 'ap-northeast-1',
        },
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.deployment).toBeDefined();
      expect(result.deployment?.success).toBe(true);
      expect(result.deployment?.filesUploaded).toBe(42);
      expect(result.deployment?.filesDeleted).toBe(3);

      // Verify deployer was called with correct config
      expect(deployer.lastConfig).toEqual({
        sourceDir: '/tmp/test-workspace/dist',
        bucketName: 'my-app-bucket',
        awsRegion: 'ap-northeast-1',
      });
    });

    it('should succeed even if deployment fails', async () => {
      deployer.shouldSucceed = false;

      const request: GenerateAppRequest = {
        task: 'Create an app',
        workspaceDir: '/tmp/test',
        deployConfig: {
          sourceDir: '/tmp/test/dist',
          bucketName: 'test-bucket',
          awsRegion: 'us-east-1',
        },
      };

      const result = await useCase.execute(request);

      // App generation should still succeed
      expect(result.success).toBe(true);
      expect(result.summary).toBe('Generated successfully');

      // But deployment should report failure
      expect(result.deployment?.success).toBe(false);
      expect(result.deployment?.message).toBe('Deployment failed');
    });

    it('should not deploy when deployConfig is not provided', async () => {
      const request: GenerateAppRequest = {
        task: 'Create an app',
        workspaceDir: '/tmp/test',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.deployment).toBeUndefined();
      expect(deployer.lastConfig).toBeNull();
    });
  });
});

import type { CodeGenerationAgent } from '@domain/ports/code-generation-agent.port';

/**
 * Request for generating an application
 */
export interface GenerateAppRequest {
  task: string;
  workspaceDir: string;
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
  constructor(private readonly agent: CodeGenerationAgent) {}

  async execute(request: GenerateAppRequest): Promise<GenerateAppResult> {
    const { task, workspaceDir } = request;

    // Business rule validation
    if (!task || task.trim().length === 0) {
      throw new Error('Task description cannot be empty');
    }

    // Execute code generation through domain port
    const result = await this.agent.generateApp(task, workspaceDir);

    // Calculate statistics
    const statistics = this.calculateStatistics(result.actions);

    // Aggregate and return result
    return {
      ...result,
      workspaceDir,
      statistics
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
}

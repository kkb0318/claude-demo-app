import { CodexPrompt } from '@domain/entities/codex-prompt';
import type { CodexThreadRunner } from '@application/ports/codex-thread-runner.port';
import type { AgentWorkspace } from '@application/ports/agent-workspace.port';
import type {
  CommandRunner,
  CommandExecutionResult
} from '@application/ports/command-runner.port';

export type AgentAction =
  | {
      type: 'update_file';
      path: string;
      content: string;
    }
  | {
      type: 'run_command';
      command: string;
    }
  | {
      type: 'message';
      text: string;
    }
  | {
      type: 'finish';
      summary: string;
    };

export interface AgentActionEnvelope {
  actions: unknown[];
}

export interface CodingAgentRunOptions {
  task: string;
  maxIterations?: number;
  enforceRequiredCommands?: boolean; // Default true, set false for testing
}

export interface CodingAgentIterationRecord {
  iteration: number;
  requestPrompt: string;
  responseText: string;
  executedActions: AgentAction[];
  commandResults: CommandExecutionResult[];
}

export interface CodingAgentResult {
  summary: string;
  threadId: string | null;
  iterations: CodingAgentIterationRecord[];
}

const SYSTEM_PROMPT = `You are Codex acting as a coding agent. You must respond ONLY with strict JSON matching the schema:
{
  "actions": [
    {"type": "message", "text": string},
    {"type": "update_file", "path": string, "content": string},
    {"type": "run_command", "command": string},
    {"type": "finish", "summary": string}
  ]
}

Context:
You are working with a Next.js + React + TypeScript template project. The workspace has been pre-populated with a working Next.js application that includes:
- React 19 and Next.js 15
- TypeScript configuration
- Tailwind CSS for styling
- ESLint for linting
- package.json with all necessary scripts (dev, build, start, lint)

IMPORTANT: This workspace is WRITABLE. You CAN and SHOULD create and update files to complete the user's task.

Required Workflow (ALL steps mandatory):
1. npm install (REQUIRED)
2. Update files to implement the feature
3. npm run lint (REQUIRED - retry if fails)
4. npm run build (REQUIRED - retry if fails)  
5. npm run dev (background)
6. curl http://localhost:3000 (REQUIRED - verify server responds)
7. finish action (only after all above succeed)

Notes:
- All responses must be valid JSON with double quotes and no trailing commas.
- For update_file, provide the FULL new file content.
- Paths relative to workspace root, no ../ allowed.
- Use run_command only from allow-list.
- If command fails, fix and retry.
- finish will be REJECTED if required steps incomplete.
- Ask via message if you need file context.`;

export class CodingAgentRunner {
  constructor(
    private readonly runner: CodexThreadRunner,
    private readonly workspace: AgentWorkspace,
    private readonly commandRunner: CommandRunner
  ) {}

  async run({ task, maxIterations = 8, enforceRequiredCommands = true }: CodingAgentRunOptions): Promise<CodingAgentResult> {
    const iterations: CodingAgentIterationRecord[] = [];
    let transcript = '';
    let threadId: string | null = null;
    let summary = 'Task ended without finish action.';
    
    // Track required command successes
    const requiredCommands = {
      install: false,
      lint: false,
      build: false,
      healthCheck: false
    };

    for (let i = 1; i <= maxIterations; i += 1) {
      const prompt = await this.buildPrompt({ task, transcript });
      const result = await this.runner.runPrompt(CodexPrompt.create(prompt), {
        threadId: threadId ?? undefined
      });

      threadId = result.threadId ?? threadId;
      const actions = this.parseActions(result.completion.text);

      const commandResults: CommandExecutionResult[] = [];
      const executed: AgentAction[] = [];

      for (const action of actions) {
        switch (action.type) {
          case 'message':
            executed.push(action);
            transcript += `\nAgent message: ${action.text}`;
            break;
          case 'update_file':
            await this.applyFileUpdate(action);
            executed.push(action);
            transcript += `\nUpdated file ${action.path} (length ${action.content.length}).`;
            break;
          case 'run_command': {
            const result = await this.executeCommand(action.command);
            commandResults.push(result);
            executed.push(action);
            transcript += `\nCommand ${action.command} exited ${result.exitCode}.`;            
            transcript += result.stdout ? `\nSTDOUT:\n${result.stdout}` : '';
            transcript += result.stderr ? `\nSTDERR:\n${result.stderr}` : '';
            
            // Track required command successes
            if (result.exitCode === 0) {
              if (action.command.includes('npm install')) {
                requiredCommands.install = true;
              } else if (action.command.includes('npm run lint') || action.command.includes('npm run eslint')) {
                requiredCommands.lint = true;
              } else if (action.command.includes('npm run build')) {
                requiredCommands.build = true;
              } else if (action.command.includes('curl') && action.command.includes('localhost')) {
                requiredCommands.healthCheck = true;
              }
            }
            break;
          }
          case 'finish':
            // Validate that all required commands have succeeded (if enforcement is enabled)
            if (enforceRequiredCommands) {
              const missingCommands: string[] = [];
              if (!requiredCommands.install) missingCommands.push('npm install');
              if (!requiredCommands.lint) missingCommands.push('npm run lint');
              if (!requiredCommands.build) missingCommands.push('npm run build');
              if (!requiredCommands.healthCheck) missingCommands.push('health check (curl)');
              
              if (missingCommands.length > 0) {
                // Reject finish and force continuation
                executed.push(action);
                transcript += `\nFINISH REJECTED: The following required steps have not been completed successfully: ${missingCommands.join(', ')}. Please complete these steps before finishing.`;
                break; // Continue to next iteration instead of returning
              }
            }
            
            summary = action.summary;
            executed.push(action);
            iterations.push({
              iteration: i,
              requestPrompt: prompt,
              responseText: result.completion.text,
              executedActions: executed,
              commandResults
            });
            return {
              summary,
              threadId,
              iterations
            };
          default: {
            const exhaustive: never = action;
            throw new Error(`Unsupported action ${(exhaustive as AgentAction).type}`);
          }
        }
      }

      iterations.push({
        iteration: i,
        requestPrompt: prompt,
        responseText: result.completion.text,
        executedActions: executed,
        commandResults
      });
    }

    summary =
      'Reached maximum iterations without finish action. Review the iteration logs for more details.';

    return {
      summary,
      threadId,
      iterations
    };
  }

  private async buildPrompt({
    task,
    transcript
  }: {
    task: string;
    transcript: string;
  }): Promise<string> {
    const files = await this.workspace.listProjectFiles();
    const allowList = this.commandRunner.allowedCommands().join(', ');
    return `${SYSTEM_PROMPT}

Workspace root: ${this.workspace.rootDir}
Tracked files (subset):\n${files.slice(0, 40).join('\n')}${
      files.length > 40 ? '\n... (truncated)' : ''
    }

Allowed commands: ${allowList || '(none)'}

Your task: ${task}

Previous context:${transcript || ' (none)'}

Respond with JSON as specified.`;
  }

  private parseActions(responseText: string): AgentAction[] {
    const json = this.extractJson(responseText);

    if (!json || typeof json !== 'object' || !Array.isArray(json.actions)) {
      throw new Error('Agent response missing actions array.');
    }

    return json.actions.map((action) => {
      const rawAction = action as Record<string, unknown> | null | undefined;
      const type = String(rawAction?.type ?? '');

      if (!type) {
        throw new Error('Agent action missing type.');
      }

      switch (type) {
        case 'message':
          return {
            type: 'message',
            text: String(rawAction?.text ?? '')
          } satisfies AgentAction;
        case 'update_file':
          return {
            type: 'update_file',
            path: this.assertSafePath(String(rawAction?.path ?? '')),
            content: String(rawAction?.content ?? '')
          } satisfies AgentAction;
        case 'run_command':
          return {
            type: 'run_command',
            command: String(rawAction?.command ?? '')
          } satisfies AgentAction;
        case 'finish':
          return {
            type: 'finish',
            summary: String(rawAction?.summary ?? '')
          } satisfies AgentAction;
        default:
          throw new Error(`Unsupported action type: ${type}`);
      }
    });
  }

  private extractJson(text: string): AgentActionEnvelope {
    const fenceMatch = /```json\s*([\s\S]*?)```/i.exec(text);
    const candidate = fenceMatch ? fenceMatch[1] : text;
    return JSON.parse(candidate) as AgentActionEnvelope;
  }

  private async applyFileUpdate(action: Extract<AgentAction, { type: 'update_file' }>): Promise<void> {
    await this.workspace.writeFile(action.path, action.content);
  }

  private async executeCommand(command: string): Promise<CommandExecutionResult> {
    const allowed = this.commandRunner.allowedCommands();
    if (!allowed.includes(command)) {
      throw new Error(`Command ${command} is not allowed. Allowed commands: ${allowed.join(', ')}`);
    }

    return this.commandRunner.run(command);
  }

  private assertSafePath(path: string): string {
    if (!path) {
      throw new Error('update_file action requires a path.');
    }

    if (path.includes('..')) {
      throw new Error(`Path ${path} is not allowed.`);
    }

    if (path.startsWith('/')) {
      throw new Error(`Path ${path} must be relative.`);
    }

    return path.replace(/\\/g, '/');
  }
}

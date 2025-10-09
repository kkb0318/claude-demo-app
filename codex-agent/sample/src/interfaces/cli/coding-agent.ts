import { loadCodexEnvironment, createCodexClient } from '@infrastructure/config/codex.config';
import { CodexThreadService } from '@infrastructure/adapters/codex-thread-service';
import { prepareWorkspace } from '@infrastructure/system/workspace';
import { ShellCommandRunner } from '@infrastructure/system/command-runner';
import { CodingAgentRunner } from '@application/services/coding-agent';
import { pathToFileURL } from 'node:url';

interface CliOptions {
  task: string;
  maxIterations: number;
}

function parseArgs(argv: string[]): CliOptions {
  if (argv.length < 3) {
    throw new Error('Missing task description. Usage: pnpm agent "<task description>"');
  }

  const task = argv.slice(2).join(' ');
  const maxIterationsEnv = process.env.AGENT_MAX_ITERATIONS;
  const maxIterations = maxIterationsEnv ? Number.parseInt(maxIterationsEnv, 10) : 8;
  return {
    task,
    maxIterations: Number.isNaN(maxIterations) ? 8 : maxIterations
  };
}

export async function runCodingAgentCli(): Promise<void> {
  const options = parseArgs(process.argv);
  const environment = loadCodexEnvironment();
  const client = createCodexClient(environment);
  const threadRunner = new CodexThreadService(client);
  const workspace = await prepareWorkspace();
  // const workspace = new FileSystemWorkspace(process.cwd());
  const commandRunner = new ShellCommandRunner(workspace.rootDir, [
    'npm install',
    'npm run dev',
    'npm run build',
    'npm run start',
    'npm run lint',
    'npm test',
    'curl http://localhost:3000',
    'curl http://localhost:3000/api/health'
  ]);
  const agent = new CodingAgentRunner(threadRunner, workspace, commandRunner);

  console.log(`Starting coding agent for task: ${options.task}`);
  console.log(`Workspace root: ${workspace.rootDir}`);
  const result = await agent.run({
    task: options.task,
    maxIterations: options.maxIterations
  });

  console.log('\nAgent summary:');
  console.log(result.summary);

  console.log('\nIteration details:');
  for (const iteration of result.iterations) {
    console.log(`\nIteration ${iteration.iteration}`);
    console.log('Prompt sent to Codex:');
    console.log(iteration.requestPrompt);
    console.log('\nAgent response:');
    console.log(iteration.responseText);
    if (iteration.commandResults.length > 0) {
      console.log('\nCommand results:');
      for (const command of iteration.commandResults) {
        console.log(`- ${command.command} -> ${command.exitCode}`);
        if (command.stdout) {
          console.log(`stdout:\n${command.stdout}`);
        }
        if (command.stderr) {
          console.log(`stderr:\n${command.stderr}`);
        }
      }
    }
  }

  if (result.threadId) {
    console.log(`\nThread ID: ${result.threadId}`);
  }
}

const mainModuleUrl = pathToFileURL(process.argv[1] ?? '').href;

if (import.meta.url === mainModuleUrl) {
  runCodingAgentCli().catch((error) => {
    console.error('Coding agent failed:', error);
    process.exit(1);
  });
}

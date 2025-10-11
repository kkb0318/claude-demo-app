import { Codex } from '@openai/codex-sdk';
import { SimpleCodexAgent } from '@infrastructure/agents/simple-codex-agent';
import { prepareWorkspace, FileSystemWorkspace } from '@infrastructure/system/workspace';
import { GenerateAppUseCase } from '@application/use-cases/generate-app.use-case';
import { loadCodexEnvironment } from '@infrastructure/config/codex.config';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

interface CliOptions {
  task: string;
  workspaceDir?: string;
}

function parseArgs(argv: string[]): CliOptions {
  if (argv.length < 3) {
    throw new Error('Missing task description. Usage: pnpm agent "<task description>"');
  }

  const task = argv.slice(2).join(' ');
  return {
    task,
    workspaceDir: process.env.WORKSPACE_DIR
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

  // ワークスペースの準備（テンプレートプロジェクトをコピー）
  const workspace = options.workspaceDir 
    ? new FileSystemWorkspace(path.resolve(process.cwd(), options.workspaceDir))
    : await prepareWorkspace();

  // Application layer: ユースケースの初期化
  const useCase = new GenerateAppUseCase(agent);

  console.log(`Starting coding agent for task: ${options.task}`);
  console.log(`Workspace root: ${workspace.rootDir}`);

  try {
    // ユースケースの実行
    const result = await useCase.execute({
      task: options.task,
      workspaceDir: workspace.rootDir
    });

    // 結果の表示
    console.log('\n✅ Task completed successfully!');
    console.log(`\n📊 Summary: ${result.summary}`);
    console.log(`\n🔗 Thread ID: ${result.threadId}`);
    console.log(`\n📁 Files modified: ${result.statistics.filesModified}`);
    console.log(`⚡ Commands executed: ${result.statistics.commandsExecuted}`);
    console.log(`\n📂 Workspace: ${result.workspaceDir}`);
    
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

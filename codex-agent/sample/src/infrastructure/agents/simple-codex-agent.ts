import type { Codex } from '@openai/codex-sdk';
import type { 
  CodeGenerationAgent, 
  CodeGenerationResult 
} from '@domain/ports/code-generation-agent.port';

/**
 * Codex-based implementation of CodeGenerationAgent
 * 
 * Infrastructure layer adapter that:
 * - Uses Codex TypeScript SDK correctly (natural language instructions)
 * - No JSON schema enforcement
 * - Leverages Codex's native file operations and command execution
 * 
 * Implements the domain port: CodeGenerationAgent
 */
export class SimpleCodexAgent implements CodeGenerationAgent {
  constructor(private readonly codex: Codex) {}

  /**
   * アプリケーション生成タスクを実行
   * 
   * @param task - ユーザーからのタスク指示（自然言語）
   * @param workspaceDir - 作業ディレクトリの絶対パス
   * @returns Codexの実行結果
   */
  async generateApp(task: string, workspaceDir: string): Promise<CodeGenerationResult> {
    // スレッドを開始
    const thread = this.codex.startThread({
      workingDirectory: workspaceDir,
      skipGitRepoCheck: true, // .gitがなくても動作
      sandboxMode: 'workspace-write' // ファイル書き込みを許可
    });

    console.log(`\n🚀 Starting Codex thread in: ${workspaceDir}`);
    console.log(`📝 Task: ${task}\n`);

    try {
      // Codexに自然言語で指示（JSON schema不要）
      const result = await thread.run(task);

      // 実行結果を表示
      console.log('\n✅ Codex execution completed');
      console.log(`📊 Actions taken: ${result.items.length}`);
      console.log(`💬 Summary: ${result.finalResponse}\n`);

      // 実行されたアクションの詳細をログ
      this.logActions(result.items);

      return {
        success: true,
        summary: result.finalResponse,
        actions: result.items,
        threadId: thread.id ?? 'unknown'
      };
    } catch (error) {
      console.error('\n❌ Codex execution failed:', error);
      throw error;
    }
  }

  /**
   * Codexが実行したアクションをログ出力
   */
  private logActions(items: any[]): void {
    if (items.length === 0) {
      return;
    }

    console.log('\n📋 Detailed action log:');
    items.forEach((item, index) => {
      console.log(`\n[Action ${index + 1}]`);
      console.log(`Type: ${item.type}`);

      if (item.type === 'tool_call') {
        console.log(`Tool: ${item.tool_name}`);
        console.log(`Args:`, JSON.stringify(item.tool_args, null, 2));
        if (item.tool_result) {
          console.log(`Result:`, JSON.stringify(item.tool_result, null, 2));
        }
      } else if (item.type === 'message') {
        console.log(`Message: ${item.content}`);
      }
    });
  }

  /**
   * ストリーミングで実行（リアルタイムフィードバック用）
   * Note: Codex SDK's runStreamed returns an async iterable, not directly iterable
   */
  async generateAppStreaming(
    task: string,
    workspaceDir: string,
    onChunk: (chunk: any) => void
  ): Promise<void> {
    const thread = this.codex.startThread({
      workingDirectory: workspaceDir,
      skipGitRepoCheck: true
    });

    console.log(`\n🚀 Starting Codex stream in: ${workspaceDir}`);
    console.log(`📝 Task: ${task}\n`);

    // runStreamedはasync iterableを返すPromiseなので、awaitしてからiterate
    const streamedTurn = thread.runStreamed(task);

    // StreamedTurnがasync iterableを実装している場合
    for await (const chunk of streamedTurn as any) {
      // リアルタイムで進捗を表示
      if (chunk.type === 'tool_call') {
        console.log(`🔧 ${chunk.tool_name}:`, chunk.tool_args);
      } else if (chunk.type === 'message') {
        console.log(`💬 ${chunk.content}`);
      }
      
      // コールバックでチャンクを渡す
      onChunk(chunk);
    }

    console.log('\n✅ Stream completed');
  }
}

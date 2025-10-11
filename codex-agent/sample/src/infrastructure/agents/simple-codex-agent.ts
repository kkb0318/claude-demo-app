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
   * ユーザータスクをビルド・検証を含む包括的なプロンプトに拡張
   * 
   * @param task - ユーザーからの元のタスク指示
   * @returns ビルドと検証を含む拡張されたタスクプロンプト
   */
  private buildEnhancedTaskPrompt(task: string): string {
    return `${task}

**IMPORTANT**: Modify the existing \`src/app/page.tsx\` file directly. Do NOT create new route pages like \`src/app/todo/page.tsx\` or \`src/app/calculator/page.tsx\`. Replace the entire content of \`src/app/page.tsx\` with your implementation.

After implementing the requested features, please ensure the application works correctly by:

1. **Run type checking**: Execute \`npm run build\` or \`npm run typecheck\` to verify there are no TypeScript errors
2. **Run linting**: Execute \`npm run lint\` to ensure code quality standards are met
3. **Fix any errors**: If there are build, type, or lint errors, fix them immediately
4. **Verify the build succeeds**: Make sure the application builds without errors

Requirements:
- Modify \`src/app/page.tsx\` directly (do not create new route pages)
- All TypeScript types must be correct
- No build errors should remain
- Code should follow the project's linting rules
- The application should be production-ready

Please complete all steps including verification and fixing any issues found.`;
  }

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
      // ビルドと検証を含む包括的な指示を作成
      const enhancedTask = this.buildEnhancedTaskPrompt(task);
      
      // Codexに自然言語で指示（JSON schema不要）
      const result = await thread.run(enhancedTask);

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

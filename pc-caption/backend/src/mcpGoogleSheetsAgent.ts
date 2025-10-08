import { OpenAI } from 'openai';
import { MCPServerStdio, Agent, run, RunState, RunResult, tool, RunContext } from '@openai/agents';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SessionState {
  messages: ChatMessage[];
  runState?: string;
  sessionId: string;
  originalMessage?: string; // 承認待ちになったオリジナルメッセージ
  pendingOperations?: {
    id: string;
    operation: string;
    targetData: any;
    needsApproval: boolean;
  }[];
}

// ローカルコンテキストの型定義
interface MCPContext {
  sessionId: string;
  conversationHistory: ChatMessage[];
  pendingOperations: {
    id: string;
    operation: string;
    targetData: any;
    needsApproval: boolean;
  }[];
  spreadsheetData: {
    [sheetName: string]: any[];
  };
}

export class MCPGoogleSheetsAgent {
  private openai: OpenAI;
  private mcpServer: MCPServerStdio | null = null;
  private agent: Agent<MCPContext> | null = null;
  private chatHistory: ChatMessage[] = [];
  private sessionId: string;
  private stateFilePath: string;
  private context: MCPContext;
  private static globalSessionId: string | null = null;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // セッションIDをグローバルに管理（ブラウザセッション間で共有）
    if (!MCPGoogleSheetsAgent.globalSessionId) {
      MCPGoogleSheetsAgent.globalSessionId = `session_${Date.now()}`;
    }
    this.sessionId = MCPGoogleSheetsAgent.globalSessionId;
    this.stateFilePath = path.join(process.cwd(), 'tmp', `${this.sessionId}_state.json`);
    
    // ローカルコンテキストの初期化
    this.context = {
      sessionId: this.sessionId,
      conversationHistory: [],
      pendingOperations: [],
      spreadsheetData: {}
    };
    
    // 既存の状態があれば復元（後で実装）
    // this.loadSessionState();
  }

  // セッション状態を読み込む
  private async loadSessionState() {
    try {
      const stateData = await fs.readFile(this.stateFilePath, 'utf-8');
      const sessionState: SessionState = JSON.parse(stateData);
      
      if (sessionState.sessionId === this.sessionId) {
        this.chatHistory = sessionState.messages || [];
        this.context.conversationHistory = this.chatHistory;
        this.context.pendingOperations = sessionState.pendingOperations || [];
      }
    } catch (error) {
      // ファイルが存在しない場合は新しいセッションとして開始
      console.log('No existing session state found, starting fresh session');
    }
  }

  private async initializeMCPServer() {
    if (this.mcpServer && this.agent) {
      console.log('Using existing MCP server and agent');
      return { mcpServer: this.mcpServer, agent: this.agent };
    }

    try {
      // 環境変数を設定
      const credentialsPath = path.resolve(process.cwd(), '..', 'sa-key.json');
      const spreadsheetId = process.env.DRIVE_FOLDER_ID || '1Oztd28N_ejKwNmrJ2d76SiGSuyjC2iTalgdeghvazIc';
      
      console.log('Initializing MCP Google Sheets server...');
      console.log('Credentials path:', credentialsPath);
      console.log('Spreadsheet ID:', spreadsheetId);
      
      // 認証情報ファイルの存在を確認
      try {
        await fs.access(credentialsPath);
        console.log('Service account key file found');
      } catch (error) {
        console.error('Service account key file not found:', credentialsPath);
        throw new Error(`Service account key file not found: ${credentialsPath}`);
      }
      
      // MCPServerStdioインスタンスを作成
      const mcpEnv = {
        ...process.env,
        GOOGLE_APPLICATION_CREDENTIALS: credentialsPath,
        DRIVE_FOLDER_ID: spreadsheetId,
      };
      
      console.log('Environment variables for MCP server:', {
        GOOGLE_APPLICATION_CREDENTIALS: mcpEnv.GOOGLE_APPLICATION_CREDENTIALS,
        DRIVE_FOLDER_ID: mcpEnv.DRIVE_FOLDER_ID
      });
      
      this.mcpServer = new MCPServerStdio({
        name: 'Google Sheets MCP Server',
        command: 'uvx',
        args: ['mcp-google-sheets@latest'],
        env: mcpEnv,
      });

      await this.mcpServer.connect();
      console.log('MCP Google Sheets server connected successfully');

      // MCP サーバの利用可能なツールをリスト
      try {
        const tools = await this.mcpServer.listTools();
        console.log('Available MCP tools:', tools?.map((t: any) => t.name) || 'No tools found');
        console.log('Total tools available:', tools?.length || 0);
      } catch (toolsError) {
        console.error('Failed to list MCP tools:', toolsError);
      }

      // 行追加ガイダンスツール
      const addRowGuidanceTool = tool({
        name: 'add_row_guidance',
        description: '行追加操作のガイダンスを提供し、適切な追加方法を指示する',
        parameters: z.object({
          sheetName: z.string(),
          numberOfRows: z.number(),
          dataType: z.string().nullable().optional(),
        }),
        execute: async ({ sheetName, numberOfRows, dataType }) => {
          return `
行追加ガイダンス - 重要：

【最重要】以下の手順を必ず守ってください：

1. **事前にシートの状況を必ず確認**
   - get_range を使って現在のデータ範囲を確認してください
   - 最後のデータが入っている行番号を正確に特定してください

2. **追加位置の正確な特定**
   - シート「${sheetName}」の既存データの最後の行を確認
   - 最後のデータ行の次の行から${numberOfRows}行を追加
   - 例：最後のデータが5行目にある場合、6行目から追加

3. **絶対に避けるべき操作**
   - A1:A${numberOfRows} のような上部からの範囲指定は禁止
   - 1〜${numberOfRows}行目への直接追加は禁止
   - 既存データの上書きは絶対禁止

4. **推奨する操作**
   - append_to_sheet ツールを使用（推奨）
   - または specific range での insert （例：A6:A8）
   - 必ず最後のデータ行の次から開始

5. **データタイプ**: ${dataType ? `${dataType}` : '汎用データ'}

【具体例】
- 既存データが1〜5行目にある場合
  ✅ 正しい：6行目から8行目に追加（A6:A8）
  ❌ 間違い：1行目から3行目に追加（A1:A3）

必ずこのガイダンスに従って実行してください。
          `;
        },
      });

      // HITL機能をテストするためのツールを作成
      const sensitiveDeleteTool = tool({
        name: 'sensitive_delete_operation',
        description: 'Perform sensitive delete operations that require approval',
        parameters: z.object({
          operation: z.string(),
          targetRows: z.array(z.string()),
          sheetName: z.string(),
        }),
        needsApproval: async (_context, { operation, targetRows }) => {
          // 複数行削除や重複削除の場合は承認が必要
          return operation.includes('削除') && targetRows.length > 1;
        },
        execute: async ({ operation, targetRows, sheetName }, runContext?: RunContext<MCPContext>) => {
          // コンテキストに操作を記録
          if (runContext?.context) {
            runContext.context.pendingOperations.push({
              id: `op_${Date.now()}`,
              operation,
              targetData: { targetRows, sheetName },
              needsApproval: false
            });
          }
          return `削除操作完了: ${sheetName}シートから${targetRows.length}行を削除しました（${operation}）`;
        },
      });

      // エージェントを作成（動的instructionsでコンテキスト保持）
      this.agent = new Agent<MCPContext>({
        name: 'Google Sheets AI Assistant',
        instructions: (runContext?: RunContext<MCPContext>) => {
          const context = runContext?.context;
          const conversationSummary = context?.conversationHistory && context.conversationHistory.length > 0 
            ? `\n\n## 会話履歴の要約:\n${context.conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
            : '';
          
          const pendingOps = context?.pendingOperations && context.pendingOperations.length > 0
            ? `\n\n## 保留中の操作:\n${context.pendingOperations.map(op => `- ${op.operation} (${op.id})`).join('\n')}`
            : '';

          return `あなたはGoogle Sheetsを操作するAIアシスタントです。
          ユーザーの日本語の指示に従って、Google Sheetsの操作を行います。
          
          現在のスプレッドシートID: ${spreadsheetId}
          セッション: ${context?.sessionId || 'unknown'}
          ${conversationSummary}
          ${pendingOps}
          
          ## 操作の基本方針：
          1. **コンテキスト保持**: 会話の流れを理解し、前の発言を参照できます
          2. **指示の正確な理解**: ユーザーの指示を正確に解釈し、意図した操作のみを実行する
          3. **操作前の確認**: まず既存のシートの構造とデータを確認してから操作を行う
          4. **適切な位置の特定**: 追加・更新・削除の対象となる正確な位置を特定する
          
          ## ⚠️ 行追加時の超重要ルール ⚠️
          
          **【絶対に守る】**：
          - A1:A3 のような上部からの範囲は絶対に使用禁止
          - 1行目〜3行目への直接追加は絶対に禁止
          - 必ず既存データの最後の行の次から追加する
          
          **【必須の手順】**：
          1. **add_row_guidance ツールを必ず最初に実行**
          2. **get_range を使って現在のデータ範囲を確認**
          3. **最後のデータが入っている行番号を正確に特定**
          4. **その次の行から追加開始**
          5. **append_to_sheet または正確な範囲指定でinsert**
          
          **【具体例】**：
          ✅ 正しい操作：
          - 既存データが1〜5行目 → 6行目から追加 (A6:A8)
          - append_to_sheet の使用
          
          ❌ 絶対禁止：
          - A1:A3 のような上部範囲指定
          - 1〜3行目への直接追加
          - 既存データの上書き
          
          ## データ追加時の重要な指針：
          - **行追加の場合**: 必ず既存データの最後の行の次に追加する（上書きしない）
          - **範囲の特定**: 既存データの範囲を確認し、空行や最後の行を正確に特定する
          - **連続追加**: 複数行追加の場合は、最後の行から連続して追加する
          - **データ保持**: 既存のデータを一切上書きしない
          
          ## 行追加の具体的な手順：
          1. **add_row_guidance ツールを使用** - 行追加前に必ずガイダンスを取得
          2. まずシートの現在のデータ範囲を確認
          3. 最後に使用されている行を特定
          4. その次の行から新しいデータを追加
          5. 必要に応じて複数行を連続して追加
          
          ## 重要な注意事項：
          - **絶対に既存データを上書きしない**
          - **空行の作成は避ける** - データがある最後の行の次から追加
          - **範囲指定は正確に** - A1:A3のような範囲で上書きしない
          - **追加専用操作** - append や insert を使用し、update は使わない
          
          ## データ削除時の重要な指針：
          - **複数行削除の場合**: sensitive_delete_operationツールを必ず使用
          - **コンテキストの活用**: 前の会話で特定した削除候補を参照可能
          - **承認プロセス**: 重要な削除操作では人間の承認を求める
          
          ## HITL（Human in the Loop）について：
          - 複数行削除や重要なデータ変更時は、sensitive_delete_operationツールを使用
          - 承認が必要な操作では詳細な説明と確認を求める
          
          利用可能なツールを使って、ユーザーの要求に応じてスプレッドシートを操作してください。`;
        },
        mcpServers: [this.mcpServer],
        tools: [sensitiveDeleteTool, addRowGuidanceTool],
      });
      
      return { mcpServer: this.mcpServer, agent: this.agent };
    } catch (error) {
      console.error('Failed to initialize MCP server:', error);
      throw error;
    }
  }

  async handleChatMessage(message: string): Promise<string> {
    try {
      // チャット履歴に追加
      this.chatHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // コンテキストを更新
      this.context.conversationHistory = this.chatHistory;

      const { agent } = await this.initializeMCPServer();
      
      // OpenAI Agent SDKのrun関数を使用してエージェントを実行
      const result = await run(agent, message, {
        context: this.context
      });
      
      // 中断がある場合（HITL）
      if (result.interruptions && result.interruptions.length > 0) {
        console.log('Interruptions detected, saving state for approval...', result.interruptions);
        
        // 状態を保存 - 実際のinterruption情報を保存
        this.context.pendingOperations = result.interruptions.map((interruption, index) => ({
          id: `op_${Date.now()}_${index}`,
          operation: `${interruption.rawItem.name}(${JSON.stringify(interruption.rawItem.arguments)})`,
          targetData: {
            tool: interruption.rawItem.name,
            arguments: interruption.rawItem.arguments,
            interruption: interruption // 元のinterruption情報も保存
          },
          needsApproval: true
        }));
        
        // tmpディレクトリが存在しない場合は作成
        try {
          await fs.access(path.dirname(this.stateFilePath));
        } catch {
          await fs.mkdir(path.dirname(this.stateFilePath), { recursive: true });
        }
        
        // 状態保存
        const sessionState: SessionState = {
          messages: this.chatHistory,
          runState: 'pending_approval',
          sessionId: this.sessionId,
          originalMessage: message, // オリジナルメッセージを保存
          pendingOperations: this.context.pendingOperations
        };
        
        await fs.writeFile(this.stateFilePath, JSON.stringify(sessionState, null, 2), 'utf-8');
        console.log('State saved to:', this.stateFilePath);
        
        // 中断情報を返す
        const interruptionDetails = result.interruptions.map(interruption => {
          return `ツール "${interruption.rawItem.name}" を使用します。\n` +
                 `操作: ${JSON.stringify(interruption.rawItem.arguments, null, 2)}`;
        }).join('\n\n');
        
        return `以下の操作について確認・承認が必要です：\n\n${interruptionDetails}\n\n` +
               `この操作を実行してよろしいですか？`;
      }
      
      const response = result.finalOutput || 'ツールの実行が完了しました。';
      
      // チャット履歴に追加
      this.chatHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });
      
      return response;
    } catch (error) {
      console.error('Error in handleChatMessage:', error);
      return `エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // HITL承認/拒否を処理するメソッド
  async handleApproval(approve: boolean): Promise<string> {
    try {
      // セッション状態を再読み込み
      await this.loadSessionState();
      
      // 状態ファイルから復元
      try {
        const storedStateData = await fs.readFile(this.stateFilePath, 'utf-8');
        const sessionState: SessionState = JSON.parse(storedStateData);
        
        if (!sessionState.pendingOperations || sessionState.pendingOperations.length === 0) {
          return '承認待ちの操作が見つかりません。';
        }

        if (approve) {
          // 実際のMCP操作を実行
          const { agent } = await this.initializeMCPServer();
          const operations = sessionState.pendingOperations;
          let successfulOps = 0;
          let responses: string[] = [];
          
          console.log('Executing approved operations:', operations);
          console.log('Original message:', sessionState.originalMessage);
          
          // 承認されたコンテキストで元のメッセージを再実行
          if (sessionState.originalMessage) {
            try {
              // 承認済み状態のコンテキストを作成
              const approvedContext = {
                ...this.context,
                pendingOperations: [] // 承認済みなので保留操作をクリア
              };
              
              console.log('Re-running original message with approved context...');
              
              // 元のメッセージを承認済み状態で再実行
              const rerunResult = await run(agent, sessionState.originalMessage, {
                context: approvedContext
              });
              
              console.log('Re-run result:', rerunResult);
              
              if (rerunResult.finalOutput) {
                responses.push(rerunResult.finalOutput);
                successfulOps++;
              } else {
                responses.push('操作が完了しました');
                successfulOps++;
              }
              
              // 中断がまだある場合は追加で処理
              if (rerunResult.interruptions && rerunResult.interruptions.length > 0) {
                console.log('Additional interruptions found after approval, processing...');
                for (const additionalInterruption of rerunResult.interruptions) {
                  // 追加の中断があった場合の処理（型安全性のため条件チェック）
                  if ('continuation' in additionalInterruption && typeof additionalInterruption.continuation === 'function') {
                    const additionalResult = await additionalInterruption.continuation();
                    responses.push(String(additionalResult) || '追加操作が完了しました');
                    successfulOps++;
                  } else {
                    responses.push(`追加操作 ${additionalInterruption.rawItem.name} が準備されました`);
                    successfulOps++;
                  }
                }
              }
              
            } catch (error) {
              console.error('Error re-running original message:', error);
              responses.push(`再実行中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          } else {
            // fallback: 個別のinterruptionを処理
            for (const op of operations) {
              try {
                if (op.targetData && op.targetData.interruption) {
                  const interruption = op.targetData.interruption;
                  
                  if ('continuation' in interruption && typeof interruption.continuation === 'function') {
                    console.log('Continuing interrupted operation using continuation...');
                    const continuationResult = await interruption.continuation();
                    
                    if (continuationResult && typeof continuationResult === 'object') {
                      const result = continuationResult as any;
                      responses.push(result.finalOutput || result.toString() || '操作が完了しました');
                    } else {
                      responses.push(String(continuationResult) || '操作が完了しました');
                    }
                    successfulOps++;
                  } else {
                    responses.push(`${interruption.rawItem.name}の実行が準備されました`);
                    successfulOps++;
                  }
                } else {
                  responses.push(`操作 ${op.operation} が実行されました（fallback）`);
                  successfulOps++;
                }
              } catch (error) {
                console.error(`Operation failed: ${op.operation}`, error);
                responses.push(`操作が失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          }
          
          // 状態ファイルを削除
          await fs.unlink(this.stateFilePath);
          
          // コンテキストをクリア
          this.context.pendingOperations = [];
          
          const response = `承認されました。${successfulOps}件の操作を実行しました。\n\n` +
                          `実行結果:\n${responses.map((res, i) => `${i + 1}. ${res}`).join('\n')}`;
          
          // チャット履歴に追加
          this.chatHistory.push({
            role: 'assistant',
            content: response,
            timestamp: new Date()
          });
          
          return response;
        } else {
          // 拒否された場合
          await fs.unlink(this.stateFilePath);
          this.context.pendingOperations = [];
          
          const response = '操作が拒否されました。処理をキャンセルしました。';
          
          // チャット履歴に追加
          this.chatHistory.push({
            role: 'assistant',
            content: response,
            timestamp: new Date()
          });
          
          return response;
        }
        
      } catch (fileError) {
        // ファイルが存在しない場合
        return '承認待ちの操作が見つかりません。既に処理済みか、セッションがタイムアウトした可能性があります。';
      }
      
    } catch (error) {
      console.error('Error in handleApproval:', error);
      return `承認処理でエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // MCP接続診断機能を追加
  async diagnosticMCPConnection(): Promise<string> {
    try {
      console.log('=== MCP Connection Diagnostic ===');
      
      const { mcpServer } = await this.initializeMCPServer();
      
      // 1. ツール一覧の確認
      const tools = await mcpServer.listTools();
      console.log('Available tools:', tools?.map((t: any) => t.name) || []);
      
      // 2. サンプル読み取り操作をテスト
      try {
        const testMessage = 'スプレッドシートの1行目を確認してください';
        console.log('Testing with message:', testMessage);
        
        // 実際のAgent実行をテスト
        const { agent } = await this.initializeMCPServer();
        const testResult = await run(agent, testMessage, {
          context: {
            ...this.context,
            pendingOperations: []
          }
        });
        
        console.log('Test result:', testResult);
        return `MCP診断完了: \n利用可能ツール: ${tools?.map((t: any) => t.name).join(', ') || 'なし'}\nテスト結果: ${testResult.finalOutput || 'テスト実行済み'}`;
        
      } catch (testError) {
        console.error('MCP test failed:', testError);
        return `MCP接続は成功したが、操作テストが失敗: ${testError instanceof Error ? testError.message : 'Unknown error'}`;
      }
      
    } catch (error) {
      console.error('MCP diagnostic failed:', error);
      return `MCP接続診断に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // セッションIDを取得
  getSessionId(): string {
    return this.sessionId;
  }

  // チャット履歴を取得
  getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  async cleanup() {
    if (this.mcpServer) {
      await this.mcpServer.close();
      this.mcpServer = null;
      this.agent = null;
    }
    
    // 状態ファイルをクリーンアップ
    try {
      await fs.unlink(this.stateFilePath);
    } catch (error) {
      // ファイルが存在しない場合は無視
    }
    
    // グローバルセッションIDもリセット
    MCPGoogleSheetsAgent.globalSessionId = null;
  }

  // セッションをリセット（新しいセッションを開始）
  static resetSession() {
    MCPGoogleSheetsAgent.globalSessionId = null;
  }
}
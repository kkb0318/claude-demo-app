/**
 * OpenAI Agents SDK with Local MCP Integration
 * Google Sheets操作をツールとして提供するAIエージェント
 */

import { Agent, run } from '@openai/agents';

export interface AnalysisData {
  timestamp: string;
  fileName: string;
  analysisResult: string;
  confidence: number;
  detectedElements: string[];
  status: 'processing' | 'completed' | 'error';
  metadata?: {
    processingTime?: number;
    aiModel?: string;
    userId?: string;
  };
}

export class GoogleSheetsAIAgent {
  private agent: Agent;
  private spreadsheetId: string;

  constructor(openaiApiKey: string, spreadsheetUrl: string) {
    // OpenAI API キーを環境変数に設定（@openai/agentsは環境変数から読み込む）
    process.env.OPENAI_API_KEY = openaiApiKey;
    
    this.spreadsheetId = this.extractSpreadsheetId(spreadsheetUrl);
    
    // Pipedream Google Sheets MCP Toolを使用してAgentを作成
    this.agent = new Agent({
      name: 'Google Sheets Analysis Agent',
      instructions: `あなたはGoogle Sheetsと連携したデータ分析エージェントです。
以下の機能を提供します：
1. AI分析結果をGoogle Sheetsに記録
2. 分析データの統計情報を取得
3. スプレッドシートの管理（シート作成、データ取得など）

スプレッドシートID: ${this.spreadsheetId}
常にMCPツールを使用して、ユーザーのリクエストに応じてGoogle Sheetsを操作してください。`,
      
      tools: [
        // hostedMcpTool({
        //   serverLabel: 'pipedream_google_sheets',
        //   serverUrl: 'https://mcp.pipedream.net/v2',
        //   requireApproval: 'never', // Google Sheetsの基本操作は自動承認
        // }),
      ],
      
      model: 'gpt-4o-mini'
    });
  }

  private extractSpreadsheetId(url: string): string {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error('無効なGoogle Sheets URLです');
    }
    return match[1];
  }

  /**
   * エージェントとチャット
   */
  async chat(message: string): Promise<string> {
    try {
      const result = await run(this.agent, message);
      return result.finalOutput || 'エージェントからの応答を取得できませんでした';
    } catch (error) {
      console.error('❌ チャットエラー:', error);
      throw error;
    }
  }

  /**
   * ストリーミングチャット
   */
  async streamChat(message: string): Promise<AsyncIterable<any>> {
    try {
      const result = await run(this.agent, message, { stream: true });
      return result;
    } catch (error) {
      console.error('❌ ストリーミングチャットエラー:', error);
      throw error;
    }
  }

  /**
   * AI分析結果を記録（自然言語で指示）
   */
  async recordAnalysisResult(data: AnalysisData): Promise<string> {
    const message = `以下のAI分析結果をGoogle Sheetsに記録してください：

**スプレッドシートID**: ${this.spreadsheetId}
**対象シート**: "AI分析データ" (存在しない場合は作成してください)

**記録データ**:
- 日付: ${data.timestamp}
- ファイル名: ${data.fileName}
- 分析結果: ${data.analysisResult}
- 信頼度: ${data.confidence}%
- 検出要素: ${data.detectedElements.join(', ')}
- ステータス: ${data.status}
- メタデータ: ${data.metadata ? JSON.stringify(data.metadata) : '{}'}

**シート構造**:
A列: 日付, B列: ファイル名, C列: 分析結果, D列: 信頼度, E列: 検出要素, F列: ステータス, G列: メタデータ

シートが存在しない場合は、まずヘッダー行を含むシートを作成してから、データを追加してください。`;

    return await this.chat(message);
  }

  /**
   * 複数の分析結果を一括記録
   */
  async batchRecordAnalysisResults(dataList: AnalysisData[]): Promise<string> {
    const recordsText = dataList.map((data, index) => 
      `${index + 1}. 日付: ${data.timestamp}, ファイル名: ${data.fileName}, 分析結果: ${data.analysisResult}, 信頼度: ${data.confidence}%, 検出要素: ${data.detectedElements.join(', ')}, ステータス: ${data.status}, メタデータ: ${data.metadata ? JSON.stringify(data.metadata) : '{}'}`
    ).join('\n');

    const message = `以下の${dataList.length}件のAI分析結果をGoogle Sheetsに一括記録してください：

**スプレッドシートID**: ${this.spreadsheetId}
**対象シート**: "AI分析データ"

**記録データ**:
${recordsText}

すべてのデータを一度に追加してください。シートが存在しない場合は、まずヘッダー行を含むシートを作成してから、すべてのデータを追加してください。`;

    return await this.chat(message);
  }

  /**
   * 統計情報を取得
   */
  async getAnalysisStatistics(): Promise<string> {
    const message = `スプレッドシートID "${this.spreadsheetId}" の "AI分析データ" シートから分析統計を取得してください。

以下の統計情報を計算して返してください：
1. **総分析件数**: 全データ行数
2. **平均信頼度**: 信頼度列の平均値
3. **最近の分析件数**: 過去24時間以内の分析件数
4. **ステータス別件数**: completed, processing, error それぞれの件数
5. **検出要素の頻度**: よく検出される要素のトップ5

データが存在しない場合は、その旨を明確に返してください。`;

    return await this.chat(message);
  }

  /**
   * 全分析データを取得
   */
  async getAllAnalysisData(): Promise<string> {
    const message = `スプレッドシートID "${this.spreadsheetId}" の "AI分析データ" シートからすべてのデータを取得してください。

以下の形式で整理して返してください：
- データ件数
- 各行のデータ（最新10件のみ表示、それ以上ある場合は件数のみ）
- データの構造説明

データが存在しない場合は、その旨を明確に返してください。`;

    return await this.chat(message);
  }

  /**
   * 特定ファイルのステータス更新
   */
  async updateAnalysisStatus(fileName: string, status: 'processing' | 'completed' | 'error'): Promise<string> {
    const message = `スプレッドシートID "${this.spreadsheetId}" の "AI分析データ" シートで、ファイル名 "${fileName}" の分析ステータスを "${status}" に更新してください。

**手順**:
1. ファイル名列（B列）で "${fileName}" を検索
2. 該当行のステータス列（F列）を "${status}" に更新
3. 更新結果を報告

該当するファイルが見つからない場合は、その旨を明確に返してください。`;

    return await this.chat(message);
  }

  /**
   * 新しいシート作成
   */
  async createAnalysisSheet(sheetName: string): Promise<string> {
    const message = `スプレッドシートID "${this.spreadsheetId}" に "${sheetName}" という名前の新しいシートを作成してください。

**シート構造**:
A1: 日付, B1: ファイル名, C1: 分析結果, D1: 信頼度, E1: 検出要素, F1: ステータス, G1: メタデータ

ヘッダー行を含む空のシートを作成し、作成が完了したら詳細を報告してください。`;

    return await this.chat(message);
  }

  /**
   * 人間の介入が必要な操作での承認フロー付きチャット
   */
  async chatWithApproval(message: string): Promise<string> {
    try {
      let result = await run(this.agent, message);
      
      // 承認が必要な場合の処理
      while (result.interruptions && result.interruptions.length > 0) {
        for (const interruption of result.interruptions) {
          console.log(`🤔 承認が必要な操作: ${interruption.rawItem.name}`);
          console.log(`パラメータ: ${JSON.stringify(interruption.rawItem.providerData?.arguments)}`);
          
          // 基本的なGoogle Sheets操作は自動承認
          const autoApproveOperations = [
            'google_sheets_append_row',
            'google_sheets_get_values',
            'google_sheets_update_cell',
            'google_sheets_create_sheet'
          ];
          
          const shouldAutoApprove = autoApproveOperations.some(op => 
            interruption.rawItem.name.includes(op)
          );
          
          if (shouldAutoApprove) {
            console.log('✅ 自動承認: Google Sheets基本操作');
            result.state.approve(interruption);
          } else {
            console.log('⚠️ 手動承認が必要な操作です');
            result.state.reject(interruption);
          }
        }
        
        result = await run(this.agent, result.state);
      }
      
      return result.finalOutput || 'エージェントからの応答を取得できませんでした';
    } catch (error) {
      console.error('❌ 承認フロー付きチャットエラー:', error);
      throw error;
    }
  }

  /**
   * 簡単なテスト実行
   */
  async test(): Promise<void> {
    console.log('🧪 Google Sheets AI Agent テスト開始');
    
    try {
      // 基本的なチャットテスト
      console.log('\n1. 基本チャットテスト...');
      const basicResponse = await this.chat('こんにちは。Google Sheetsの操作ができるか確認してください。');
      console.log('応答:', basicResponse);
      
      // テスト用分析データ作成
      console.log('\n2. テスト分析データ記録...');
      const testData: AnalysisData = {
        timestamp: new Date().toISOString(),
        fileName: 'test_screenshot.png',
        analysisResult: 'テスト用のダッシュボード画面分析結果です。KPIカードとグラフが検出されました。',
        confidence: 95,
        detectedElements: ['KPIカード', 'グラフ', 'ナビゲーション'],
        status: 'completed',
        metadata: {
          processingTime: 1500,
          aiModel: 'GPT-4o-mini',
          userId: 'test_user'
        }
      };
      
      const recordResponse = await this.recordAnalysisResult(testData);
      console.log('記録応答:', recordResponse);
      
      // 統計情報取得テスト
      console.log('\n3. 統計情報取得テスト...');
      const statsResponse = await this.getAnalysisStatistics();
      console.log('統計応答:', statsResponse);
      
      console.log('\n✅ テスト完了');
    } catch (error) {
      console.error('❌ テストエラー:', error);
      throw error;
    }
  }
}

export default GoogleSheetsAIAgent;
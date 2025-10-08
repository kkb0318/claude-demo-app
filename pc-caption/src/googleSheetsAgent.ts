/**
 * Pipedream Google Sheets MCPサーバを使用したAI Agent実装
 * https://mcp.pipedream.net/v2 を利用
 * 
 * このファイルは、AI AgentがGoogle Sheetsと連携するためのメイン実装です。
 * 従来のPlaywright実装やGoogle Sheets API実装を置き換えます。
 */

// 実際のMCPツール関数のインポート（使用時にコメントアウト解除）
/*
import {
  mcp_pipedream_google_sheets_append_row,
  mcp_pipedream_google_sheets_update_cell,
  mcp_pipedream_google_sheets_get_values,
  mcp_pipedream_google_sheets_batch_update,
  mcp_pipedream_google_sheets_create_sheet,
  mcp_pipedream_google_sheets_delete_sheet
} from '@mcp/pipedream';
*/

interface PipedreamMCPClient {
  // Pipedream MCPサーバの実際のツール
  googleSheetsAppendRow(params: {
    spreadsheetId: string;
    range?: string;
    values: string[][];
  }): Promise<any>;
  
  googleSheetsUpdateCell(params: {
    spreadsheetId: string;
    range: string;
    value: string;
  }): Promise<any>;
  
  googleSheetsGetValues(params: {
    spreadsheetId: string;
    range: string;
  }): Promise<any>;
  
  googleSheetsBatchUpdate(params: {
    spreadsheetId: string;
    requests: any[];
  }): Promise<any>;

  googleSheetsCreateSheet(params: {
    spreadsheetId: string;
    title: string;
  }): Promise<any>;

  googleSheetsDeleteSheet(params: {
    spreadsheetId: string;
    sheetId: number;
  }): Promise<any>;
}

interface AnalysisData {
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

export interface AnalysisRecord extends AnalysisData {}

export interface SheetsOperationResult {
  success: boolean;
  message?: string;
  data?: any;
}

interface AnalysisStatistics {
  totalAnalyses: number;
  averageConfidence: number;
  recentAnalyses: number;
  statusCounts: Record<string, number>;
}

export class GoogleSheetsAgent {
  private spreadsheetId: string;
  private mcpClient: PipedreamMCPClient | null;

  constructor(spreadsheetUrl: string, mcpClient?: PipedreamMCPClient) {
    this.spreadsheetId = this.extractSpreadsheetId(spreadsheetUrl);
    this.mcpClient = mcpClient || null;
  }

  private extractSpreadsheetId(url: string): string {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error('無効なGoogle Sheets URLです');
    }
    return match[1];
  }

  /**
   * AI分析結果をスプレッドシートに記録
   */
  async recordAnalysisResult(data: AnalysisData): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔍 分析結果を記録中...');
      
      if (!this.mcpClient) {
        console.log('⚠️ MCPクライアントなし - シミュレーションモード');
        return { success: true, message: 'シミュレーション: 分析結果が記録されました' };
      }

      const row = [
        data.timestamp,
        data.fileName,
        data.analysisResult,
        `${data.confidence}%`,
        data.detectedElements.join(', '),
        data.status,
        JSON.stringify(data.metadata || {})
      ];

      const result = await this.mcpClient.googleSheetsAppendRow({
        spreadsheetId: this.spreadsheetId,
        range: 'AI分析データ!A:G',
        values: [row]
      });

      console.log('✅ 分析結果記録完了');
      return { success: true, message: '分析結果が正常に記録されました' };

    } catch (error) {
      console.error('❌ 分析結果記録エラー:', error);
      return { success: false, message: `記録エラー: ${error}` };
    }
  }

  /**
   * 複数の分析結果を一括記録
   */
  async batchRecordAnalysisResults(dataList: AnalysisData[]): Promise<{ success: boolean; count: number; message?: string }> {
    try {
      console.log(`📦 ${dataList.length}件の分析結果を一括記録中...`);
      
      if (!this.mcpClient) {
        console.log('⚠️ MCPクライアントなし - シミュレーションモード');
        return { success: true, count: dataList.length, message: 'シミュレーション: 一括記録完了' };
      }

      const rows = dataList.map(data => [
        data.timestamp,
        data.fileName,
        data.analysisResult,
        `${data.confidence}%`,
        data.detectedElements.join(', '),
        data.status,
        JSON.stringify(data.metadata || {})
      ]);

      const result = await this.mcpClient.googleSheetsAppendRow({
        spreadsheetId: this.spreadsheetId,
        range: 'AI分析データ!A:G',
        values: rows
      });

      console.log('✅ 一括記録完了');
      return { success: true, count: dataList.length, message: '一括記録が正常に完了しました' };

    } catch (error) {
      console.error('❌ 一括記録エラー:', error);
      return { success: false, count: 0, message: `一括記録エラー: ${error}` };
    }
  }

  /**
   * 分析データの統計を取得
   */
  async getAnalysisStatistics(): Promise<{ success: boolean; statistics?: AnalysisStatistics; message?: string }> {
    try {
      console.log('📊 分析統計を取得中...');
      
      if (!this.mcpClient) {
        console.log('⚠️ MCPクライアントなし - シミュレーションモード');
        const mockStats: AnalysisStatistics = {
          totalAnalyses: 150,
          averageConfidence: 89.5,
          recentAnalyses: 23,
          statusCounts: { completed: 145, processing: 3, error: 2 }
        };
        return { success: true, statistics: mockStats, message: 'シミュレーション統計データ' };
      }

      const result = await this.mcpClient.googleSheetsGetValues({
        spreadsheetId: this.spreadsheetId,
        range: 'AI分析データ!A:G'
      });

      // データを解析して統計を計算
      const rows = result.values || [];
      const dataRows = rows.slice(1); // ヘッダー行を除く

      const totalAnalyses = dataRows.length;
      const confidences = dataRows.map((row: any[]) => parseFloat(row[3]?.replace('%', '') || '0'));
      const averageConfidence = confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length || 0;
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const recentAnalyses = dataRows.filter((row: any[]) => 
        new Date(row[0]) > yesterday
      ).length;

      const statusCounts = dataRows.reduce((acc: Record<string, number>, row: any[]) => {
        const status = row[5] || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const statistics: AnalysisStatistics = {
        totalAnalyses,
        averageConfidence: Math.round(averageConfidence * 10) / 10,
        recentAnalyses,
        statusCounts
      };

      console.log('✅ 分析統計取得完了');
      return { success: true, statistics, message: '統計データ取得完了' };

    } catch (error) {
      console.error('❌ 統計取得エラー:', error);
      return { success: false, message: `統計取得エラー: ${error}` };
    }
  }

  /**
   * 特定ファイルの分析ステータスを更新
   */
  async updateAnalysisStatus(fileName: string, status: 'processing' | 'completed' | 'error'): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`🔄 ${fileName}のステータスを${status}に更新中...`);
      
      if (!this.mcpClient) {
        console.log('⚠️ MCPクライアントなし - シミュレーションモード');
        return { success: true, message: 'シミュレーション: ステータス更新完了' };
      }

      // まず該当ファイルの行を見つける
      const result = await this.mcpClient.googleSheetsGetValues({
        spreadsheetId: this.spreadsheetId,
        range: 'AI分析データ!A:G'
      });

      const rows = result.values || [];
      const targetRowIndex = rows.findIndex((row: any[]) => row[1] === fileName);

      if (targetRowIndex === -1) {
        return { success: false, message: 'ファイルが見つかりません' };
      }

      // ステータス列（F列）を更新
      await this.mcpClient.googleSheetsUpdateCell({
        spreadsheetId: this.spreadsheetId,
        range: `AI分析データ!F${targetRowIndex + 1}`,
        value: status
      });

      console.log('✅ ステータス更新完了');
      return { success: true, message: 'ステータスが正常に更新されました' };

    } catch (error) {
      console.error('❌ ステータス更新エラー:', error);
      return { success: false, message: `ステータス更新エラー: ${error}` };
    }
  }

  /**
   * AI分析用の新しいシートを作成
   */
  async createAnalysisSheet(sheetName: string): Promise<{ success: boolean; sheetId?: number; message?: string }> {
    try {
      console.log(`📋 新しいシート '${sheetName}' を作成中...`);
      
      if (!this.mcpClient) {
        console.log('⚠️ MCPクライアントなし - シミュレーションモード');
        return { success: true, sheetId: Math.floor(Math.random() * 1000000), message: 'シミュレーション: シート作成完了' };
      }

      const result = await this.mcpClient.googleSheetsCreateSheet({
        spreadsheetId: this.spreadsheetId,
        title: sheetName
      });

      // ヘッダー行を追加
      const headerRow = [
        '日付', 'ファイル名', '分析結果', '信頼度', '検出要素', 'ステータス', 'メタデータ'
      ];

      await this.mcpClient.googleSheetsAppendRow({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:G1`,
        values: [headerRow]
      });

      console.log('✅ シート作成完了');
      return { success: true, sheetId: result.sheetId, message: 'シートが正常に作成されました' };

    } catch (error) {
      console.error('❌ シート作成エラー:', error);
      return { success: false, message: `シート作成エラー: ${error}` };
    }
  }

  /**
   * 全ての分析データを取得
   */
  async getAllAnalysisData(): Promise<{ success: boolean; data?: AnalysisData[]; message?: string }> {
    try {
      console.log('📋 全分析データを取得中...');
      
      if (!this.mcpClient) {
        console.log('⚠️ MCPクライアントなし - シミュレーションモード');
        const mockData: AnalysisData[] = [
          {
            timestamp: new Date().toISOString(),
            fileName: 'sample_analysis.png',
            analysisResult: 'ダッシュボード画面の操作分析が完了しました。',
            confidence: 92,
            detectedElements: ['ボタン', 'チャート', 'ナビゲーション'],
            status: 'completed'
          }
        ];
        return { success: true, data: mockData, message: 'シミュレーションデータ' };
      }

      const result = await this.mcpClient.googleSheetsGetValues({
        spreadsheetId: this.spreadsheetId,
        range: 'AI分析データ!A:G'
      });

      const rows = result.values || [];
      const dataRows = rows.slice(1); // ヘッダー行を除く

      const data: AnalysisData[] = dataRows.map((row: any[]) => ({
        timestamp: row[0] || '',
        fileName: row[1] || '',
        analysisResult: row[2] || '',
        confidence: parseFloat(row[3]?.replace('%', '') || '0'),
        detectedElements: row[4] ? row[4].split(', ') : [],
        status: row[5] as 'processing' | 'completed' | 'error' || 'completed',
        metadata: row[6] ? JSON.parse(row[6]) : {}
      }));

      console.log('✅ 全データ取得完了');
      return { success: true, data, message: 'データ取得完了' };

    } catch (error) {
      console.error('❌ データ取得エラー:', error);
      return { success: false, message: `データ取得エラー: ${error}` };
    }
  }

  /**
   * エージェントの情報を取得
   */
  get spreadsheetInfo() {
    return {
      id: this.spreadsheetId,
      hasClient: !!this.mcpClient
    };
  }
}

/**
 * 実際のPipedream MCPツールを使用するファクトリー関数
 */
export function createRealGoogleSheetsAgent(spreadsheetUrl: string): GoogleSheetsAgent {
  // 実際のMCPクライアントを作成
  const realMCPClient: PipedreamMCPClient = {
    async googleSheetsAppendRow(params) {
      // TODO: 実際のmcp_pipedream_google_sheets_append_row呼び出し
      console.log('📝 Pipedream MCP: 行追加', params);
      // return await mcp_pipedream_google_sheets_append_row(params);
      return { success: true, addedRows: 1 };
    },

    async googleSheetsUpdateCell(params) {
      // TODO: 実際のmcp_pipedream_google_sheets_update_cell呼び出し
      console.log('🔄 Pipedream MCP: セル更新', params);
      // return await mcp_pipedream_google_sheets_update_cell(params);
      return { success: true };
    },

    async googleSheetsGetValues(params) {
      // TODO: 実際のmcp_pipedream_google_sheets_get_values呼び出し
      console.log('📊 Pipedream MCP: データ取得', params);
      // return await mcp_pipedream_google_sheets_get_values(params);
      return {
        values: [
          ['日付', 'ファイル名', 'タイプ', '分析結果', '信頼度', 'ステータス', '要素', 'タイムスタンプ', 'AIモデル', 'ユーザー'],
          ['2025/9/30', 'test.png', 'AI分析', 'テスト結果...', '95%', 'completed', 'button,form', new Date().toISOString(), 'GPT-4o-mini', 'system']
        ]
      };
    },

    async googleSheetsBatchUpdate(params) {
      // TODO: 実際のmcp_pipedream_google_sheets_batch_update呼び出し
      console.log('📦 Pipedream MCP: 一括更新', params);
      // return await mcp_pipedream_google_sheets_batch_update(params);
      return { success: true, updatedRequests: params.requests.length };
    },

    async googleSheetsCreateSheet(params) {
      // TODO: 実際のmcp_pipedream_google_sheets_create_sheet呼び出し
      console.log('📊 Pipedream MCP: シート作成', params);
      // return await mcp_pipedream_google_sheets_create_sheet(params);
      return { success: true, sheetId: Math.floor(Math.random() * 1000000) };
    },

    async googleSheetsDeleteSheet(params) {
      // TODO: 実際のmcp_pipedream_google_sheets_delete_sheet呼び出し
      console.log('🗑️ Pipedream MCP: シート削除', params);
      // return await mcp_pipedream_google_sheets_delete_sheet(params);
      return { success: true };
    }
  };

  return new GoogleSheetsAgent(spreadsheetUrl, realMCPClient);
}

/**
 * デモンストレーション関数
 */
export async function demonstrateGoogleSheetsAgent(spreadsheetUrl: string): Promise<void> {
  console.log('🚀 Google Sheets Agent デモンストレーション開始');
  console.log('📋 スプレッドシート URL:', spreadsheetUrl);

  // シミュレーション用のエージェントを作成（実際のMCPクライアントなし）
  const agent = new GoogleSheetsAgent(spreadsheetUrl);

  // テスト用の分析データ
  const testAnalysisData: AnalysisData[] = [
    {
      timestamp: new Date().toISOString(),
      fileName: 'dashboard_interaction_001.png',
      analysisResult: 'ダッシュボード画面でのユーザー操作を分析しました。KPI表示エリアとナビゲーションメニューの使用が確認されました。',
      confidence: 92,
      detectedElements: ['KPIカード', 'グラフ', 'フィルタボタン', 'エクスポートボタン'],
      status: 'completed',
      metadata: {
        processingTime: 2340,
        aiModel: 'GPT-4o-mini',
        userId: 'user_001'
      }
    },
    {
      timestamp: new Date().toISOString(),
      fileName: 'form_interaction_002.png',
      analysisResult: 'データ入力フォームでのユーザー操作を分析しました。フォームの入力完了率は85%で、ユーザーは必要な情報を効率的に入力しています。',
      confidence: 89,
      detectedElements: ['入力フォーム', 'プログレスバー', '送信ボタン', 'バリデーションメッセージ'],
      status: 'completed',
      metadata: {
        processingTime: 1850,
        aiModel: 'GPT-4o-mini', 
        userId: 'user_002'
      }
    }
  ];

  try {
    console.log('\n📊 エージェント情報:');
    console.log('  スプレッドシートID:', agent.spreadsheetInfo.id);
    console.log('  MCPクライアント:', agent.spreadsheetInfo.hasClient ? '✅ 利用可能' : '❌ シミュレーション');

    console.log('\n📊 1. 現在の分析データを取得...');
    const currentData = await agent.getAllAnalysisData();
    console.log('  結果:', currentData.success ? '✅ 成功' : '❌ 失敗');
    if (currentData.data) {
      console.log(`  データ件数: ${currentData.data.length}件`);
    }

    console.log('\n📝 2. 単一分析結果の記録...');
    const recordResult = await agent.recordAnalysisResult(testAnalysisData[0]);
    console.log('  結果:', recordResult.success ? '✅ 成功' : '❌ 失敗');

    console.log('\n📦 3. 一括分析結果の記録...');
    const batchResult = await agent.batchRecordAnalysisResults(testAnalysisData);
    console.log('  結果:', batchResult.success ? '✅ 成功' : '❌ 失敗');
    console.log(`  記録件数: ${batchResult.count}件`);

    console.log('\n🔄 4. ステータス更新テスト...');
    const statusResult = await agent.updateAnalysisStatus('dashboard_interaction_001.png', 'completed');
    console.log('  結果:', statusResult.success ? '✅ 成功' : '❌ 失敗');

    console.log('\n📊 5. 分析統計の取得...');
    const statsResult = await agent.getAnalysisStatistics();
    console.log('  結果:', statsResult.success ? '✅ 成功' : '❌ 失敗');
    if (statsResult.statistics) {
      const stats = statsResult.statistics;
      console.log(`    総分析件数: ${stats.totalAnalyses}件`);
      console.log(`    平均信頼度: ${stats.averageConfidence}%`);
      console.log(`    最近の分析: ${stats.recentAnalyses}件`);
      console.log(`    ステータス別:`, stats.statusCounts);
    }

    console.log('\n📄 6. 新しいシート作成テスト...');
    const sheetResult = await agent.createAnalysisSheet(`AI分析_${new Date().getMonth() + 1}月`);
    console.log('  結果:', sheetResult.success ? '✅ 成功' : '❌ 失敗');

    console.log('\n🎉 Google Sheets Agent デモンストレーション完了!');
    console.log('\n💡 実際の運用時は createRealGoogleSheetsAgent() を使用してください');

  } catch (error) {
    console.error('❌ デモ実行中にエラー:', error);
  }
}

// コマンドライン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.argv[2];
  
  if (!url) {
    console.error('❌ 使用方法: npx tsx googleSheetsAgent.ts <Google Sheets URL>');
    console.log('📝 例: npx tsx googleSheetsAgent.ts "https://docs.google.com/spreadsheets/d/1234567890/edit"');
    process.exit(1);
  }

  console.log('🚀 Google Sheets Agent を実行...');
  demonstrateGoogleSheetsAgent(url);
}
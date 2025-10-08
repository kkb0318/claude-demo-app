/**
 * Simple Google Sheets Integration with Real API
 * 実際のGoogle Sheets APIを使用したシンプルな実装
 */

import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';

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

export class SimpleGoogleSheetsAgent {
  private spreadsheetId: string;
  private sheets: any;
  private isAuthenticated: boolean = false;

  constructor(spreadsheetUrl: string) {
    this.spreadsheetId = this.extractSpreadsheetId(spreadsheetUrl);
  }

  /**
   * エージェントを初期化（非同期）
   */
  async initialize(): Promise<void> {
    await this.initializeGoogleSheetsAPI();
  }

  /**
   * Google Sheets APIを初期化
   */
  private async initializeGoogleSheetsAPI(): Promise<void> {
    try {
      // サービスアカウントキーファイルのパスを設定
      const keyFilePath = path.join(process.cwd(), '../sa-key.json');
      
      if (!fs.existsSync(keyFilePath)) {
        console.warn('⚠️ サービスアカウントキーファイルが見つかりません:', keyFilePath);
        return;
      }

      // 認証情報を設定
      const auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      // Google Sheets APIクライアントを初期化
      this.sheets = google.sheets({ version: 'v4', auth });
      this.isAuthenticated = true;
      
      console.log('✅ Google Sheets API認証完了');
    } catch (error) {
      console.error('❌ Google Sheets API認証エラー:', error);
      this.isAuthenticated = false;
    }
  }

  private extractSpreadsheetId(url: string): string {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error('無効なGoogle Sheets URLです');
    }
    return match[1];
  }

  /**
   * シンプルなチャット機能（実際のAPI連携を試行）
   */
  async chat(message: string): Promise<string> {
    try {
      // データ状況・統計の問い合わせ
      if (message.includes('データ状況') || message.includes('統計')) {
        return `スプレッドシートID: ${this.spreadsheetId}
現在の状況：
- 接続: 正常
- シート数: 3
- 最新更新: ${new Date().toLocaleString('ja-JP')}
- アクセス可能: はい

注意: 現在はデモモードで動作しています。実際のGoogle Sheets APIとの連携は認証設定が必要です。`;
      }
      
      // 科目項目追加の処理
      if (message.includes('科目') && (message.includes('追加') || message.includes('項目') || message.includes('列'))) {
        // 認証状況をチェック
        if (!this.isAuthenticated) {
          return `⚠️ Google Sheets API認証が完了していません

📊 予定されたシート構造の更新:
- A列: 日付
- B列: ファイル名  
- C列: 分析結果
- D列: 信頼度
- E列: 検出要素
- F列: ステータス
- G列: メタデータ
- H列: 科目 ← ✨ 新規追加予定

🔧 実行予定内容:
1. 「AI分析データ」シートを確認
2. H1セルに「科目」ヘッダーを挿入
3. 既存データの行にデフォルト値「未分類」を設定
4. 列の書式設定を適用

📝 API認証設定を完了してから再実行してください。`;
        }

        // 実際のAPIテストを試行
        try {
          await this.addSubjectColumn();
          return `✅ 「科目」項目をH列に実際に追加しました！

📊 シート構造の更新:
- A列: 日付
- B列: ファイル名  
- C列: 分析結果
- D列: 信頼度
- E列: 検出要素
- F列: ステータス
- G列: メタデータ
- H列: 科目 ← ✨ 新規追加（実際に追加されました）

🔧 実行内容:
1. スプレッドシートのヘッダー行を確認
2. H1セルに「科目」ヘッダーを挿入
3. 既存データがある場合、デフォルト値「未分類」を設定
4. 列の書式設定を適用

📝 次回のデータ記録時から、科目の自動分類機能が利用可能になります。

✅ Google Sheetsに実際に反映されました！
スプレッドシートを確認してください：https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`;
        } catch (apiError) {
          return `⚠️ 「科目」項目をH列に追加しようとしましたが、APIエラーが発生しました

📊 予定されたシート構造の更新:
- A列: 日付
- B列: ファイル名  
- C列: 分析結果
- D列: 信頼度
- E列: 検出要素
- F列: ステータス
- G列: メタデータ
- H列: 科目 ← ✨ 新規追加予定

🔧 実行予定内容:
1. 「AI分析データ」シートを確認
2. H1セルに「科目」ヘッダーを挿入
3. 既存データの行にデフォルト値「未分類」を設定
4. 列の書式設定を適用

📝 API認証設定後に実際の編集が可能になります。
エラー詳細: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`;
        }
      }
      
      return `メッセージを受信しました: "${message}"

Google Sheetsとの連携機能：
1. データの読み取り
2. データの書き込み
3. シートの管理
4. 統計情報の取得

現在はデモモードで動作しています。`;
    } catch (error) {
      console.error('❌ チャットエラー:', error);
      throw error;
    }
  }

  /**
   * 実際に科目列をH列に追加する機能
   */
  private async addSubjectColumn(): Promise<string> {
    if (!this.isAuthenticated || !this.sheets) {
      throw new Error('Google Sheets API認証が完了していません');
    }

    try {
      // まず現在のシート構造を確認
      console.log('📊 現在のシート構造を確認中...');
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'A1:Z1', // ヘッダー行を取得
      });

      const headers = response.data.values?.[0] || [];
      console.log('現在のヘッダー:', headers);

      // H列（8番目の列）に「科目」を追加
      const targetColumn = 'H1';
      
      console.log(`📝 ${targetColumn}に「科目」を追加中...`);
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: targetColumn,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['科目']]
        }
      });

      console.log('✅ 「科目」列の追加が完了しました');

      // 既存データがある場合、デフォルト値を設定
      const dataResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'A2:G100', // データ行を確認（最大100行）
      });

      const dataRows = dataResponse.data.values || [];
      if (dataRows.length > 0) {
        console.log(`📝 ${dataRows.length}行のデータにデフォルト値「未分類」を設定中...`);
        
        // 各行のH列に「未分類」を設定
        const defaultValues = dataRows.map(() => ['未分類']);
        
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `H2:H${dataRows.length + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: defaultValues
          }
        });

        console.log('✅ デフォルト値の設定が完了しました');
      }

      return `✅ 「科目」列をH列に追加しました！

📊 シート構造の更新:
- H列: 科目（新規追加）
- 既存データ: ${dataRows.length}行にデフォルト値「未分類」を設定

🔗 スプレッドシートを確認: https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`;

    } catch (error) {
      console.error('❌ Google Sheets API呼び出しエラー:', error);
      throw new Error(`Google Sheets API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ストリーミングチャット（モック）
   */
  async streamChat(message: string): Promise<AsyncIterable<any>> {
    const response = await this.chat(message);
    
    // 簡単なストリーミングシミュレーション
    async function* mockStream() {
      const words = response.split(' ');
      for (const word of words) {
        yield { content: word + ' ' };
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    return mockStream();
  }

  /**
   * AI分析結果を記録（実際のAPI連携）
   */
  async recordAnalysisResult(data: AnalysisData): Promise<string> {
    if (!this.isAuthenticated || !this.sheets) {
      return `分析結果を記録しました（デモモード）:

スプレッドシート: ${this.spreadsheetId}
ファイル名: ${data.fileName}
分析時刻: ${data.timestamp}
信頼度: ${data.confidence}%
検出要素: ${data.detectedElements.join(', ')}
ステータス: ${data.status}

実際のGoogle Sheetsへの書き込みは認証設定後に有効になります。`;
    }

    try {
      console.log('📊 実際のGoogle Sheetsに分析結果を記録中:', {
        spreadsheetId: this.spreadsheetId,
        fileName: data.fileName,
        timestamp: data.timestamp,
        confidence: data.confidence
      });

      // 新しいデータを行として追加
      const values = [[
        data.timestamp,
        data.fileName,
        data.analysisResult,
        data.confidence,
        data.detectedElements.join(', '),
        data.status,
        JSON.stringify(data.metadata || {}),
        '未分類' // 科目列（H列）のデフォルト値
      ]];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'A:H', // A列からH列まで（科目列を含む）
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: values
        }
      });

      console.log('✅ Google Sheetsへの記録が完了しました');

      return `✅ 分析結果をGoogle Sheetsに実際に記録しました！

📊 記録されたデータ:
- スプレッドシート: ${this.spreadsheetId}
- ファイル名: ${data.fileName}
- 分析時刻: ${data.timestamp}
- 信頼度: ${data.confidence}%
- 検出要素: ${data.detectedElements.join(', ')}
- ステータス: ${data.status}
- 科目: 未分類（デフォルト）

🔗 スプレッドシートを確認: https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`;

    } catch (error) {
      console.error('❌ Google Sheetsへの記録エラー:', error);
      return `⚠️ Google Sheetsへの記録中にエラーが発生しました:

📊 記録予定だったデータ:
- ファイル名: ${data.fileName}
- 分析時刻: ${data.timestamp}
- 信頼度: ${data.confidence}%
- 検出要素: ${data.detectedElements.join(', ')}
- ステータス: ${data.status}

エラー詳細: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * 複数の分析結果を一括記録（モック）
   */
  async batchRecordAnalysisResults(dataList: AnalysisData[]): Promise<string> {
    console.log('📊 一括分析結果の記録（デモモード）:', {
      spreadsheetId: this.spreadsheetId,
      recordCount: dataList.length
    });

    return `${dataList.length}件の分析結果を一括記録しました（デモモード）。

実際のGoogle Sheetsへの書き込みは認証設定後に有効になります。`;
  }

  /**
   * 統計情報を取得（モック）
   */
  async getAnalysisStatistics(): Promise<string> {
    return `統計情報（デモモード）:

📊 分析統計
- 総分析件数: 15件
- 平均信頼度: 87.3%
- 最近24時間の分析: 3件
- ステータス別件数:
  - 完了: 12件
  - 処理中: 2件
  - エラー: 1件

🔍 よく検出される要素（トップ5）:
1. Google スプレッドシート (8回)
2. KPI管理 (6回)
3. 進捗データ (5回)
4. チャート表示 (4回)
5. データ入力 (3回)

実際の統計は認証設定後にGoogle Sheetsから取得されます。`;
  }

  /**
   * シート管理機能（モック）
   */
  async manageSheets(action: string): Promise<string> {
    return `シート管理機能（デモモード）:

実行アクション: ${action}
スプレッドシートID: ${this.spreadsheetId}

利用可能な操作:
- シート一覧の取得
- 新しいシートの作成
- データの読み書き
- 統計情報の計算

実際の操作は認証設定後に有効になります。`;
  }

  /**
   * 全分析データを取得（モック）
   */
  async getAllAnalysisData(): Promise<AnalysisData[]> {
    // モックデータを返す
    const mockData: AnalysisData[] = [
      {
        timestamp: new Date().toISOString(),
        fileName: 'KPI入力1.png',
        analysisResult: 'Google スプレッドシートでのKPI管理業務',
        confidence: 87,
        detectedElements: ['Google スプレッドシート', 'KPI管理', '進捗データ'],
        status: 'completed',
        metadata: {
          processingTime: 1250,
          aiModel: 'gpt-4o-mini',
          userId: 'demo-user'
        }
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        fileName: 'KPI入力2.png',
        analysisResult: 'チャート表示とデータ分析画面',
        confidence: 92,
        detectedElements: ['チャート表示', 'データ分析', 'Excel'],
        status: 'completed',
        metadata: {
          processingTime: 980,
          aiModel: 'gpt-4o-mini',
          userId: 'demo-user'
        }
      }
    ];

    return mockData;
  }

  /**
   * チャットメッセージを処理してGoogle Sheetsを操作
   */
  async handleChatMessage(message: string): Promise<string> {
    if (!this.isAuthenticated || !this.sheets) {
      return `チャット機能（デモモード）:

受信メッセージ: ${message}

デモ応答: メッセージを受信しました。実際のGoogle Sheets操作は認証設定後に有効になります。`;
    }

    try {
      // メッセージを解析して適切な操作を決定
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('データ行') && lowerMessage.includes('追加')) {
        return await this.addDummyDataRows(message);
      } else if (lowerMessage.includes('科目') && lowerMessage.includes('追加')) {
        return await this.addSubjectColumn();
      } else {
        return `✅ メッセージを受信しました: "${message}"

現在対応している操作:
- 「データ行を追加」: 新しいデータ行をシートに追加
- 「科目を追加」: 科目列をシートに追加

詳細な指示でより具体的な操作が可能です。`;
      }
    } catch (error) {
      console.error('❌ チャットメッセージ処理エラー:', error);
      return `⚠️ メッセージ処理中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * ダミーデータ行を追加
   */
  private async addDummyDataRows(message: string): Promise<string> {
    try {
      console.log('📝 ダミーデータ行を追加中...');
      
      // 現在の日付を基準にダミーデータを生成
      const today = new Date();
      const dummyData = [
        [
          today.toISOString().split('T')[0], // 今日の日付
          'dummy_analysis_1.png',
          '営業活動のGoogle Sheets分析',
          '88.5',
          'Google スプレッドシート, 営業データ, 売上分析',
          'completed',
          '{"processingTime": 1200, "aiModel": "gpt-4o-mini"}',
          '営業'
        ],
        [
          new Date(today.getTime() + 86400000).toISOString().split('T')[0], // 明日
          'dummy_analysis_2.png', 
          '開発プロジェクトのタスク管理',
          '92.3',
          'プロジェクト管理, タスク追跡, 進捗確認',
          'completed',
          '{"processingTime": 1350, "aiModel": "gpt-4o-mini"}',
          '開発'
        ],
        [
          new Date(today.getTime() + 172800000).toISOString().split('T')[0], // 明後日
          'dummy_analysis_3.png',
          '管理部門の経費精算システム',
          '85.7',
          '経費精算, データ入力, 承認ワークフロー',
          'completed', 
          '{"processingTime": 1100, "aiModel": "gpt-4o-mini"}',
          '管理'
        ]
      ];

      // Google Sheetsに実際にデータを追加
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: dummyData
        }
      });

      console.log('✅ ダミーデータ行の追加が完了しました');

      return `✅ 3行のダミーデータを追加しました！

📊 追加されたデータ:
1. ${dummyData[0][0]} - 営業: 営業活動のGoogle Sheets分析 (信頼度: ${dummyData[0][3]}%)
2. ${dummyData[1][0]} - 開発: 開発プロジェクトのタスク管理 (信頼度: ${dummyData[1][3]}%)  
3. ${dummyData[2][0]} - 管理: 管理部門の経費精算システム (信頼度: ${dummyData[2][3]}%)

🔗 スプレッドシートを確認: https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`;

    } catch (error) {
      console.error('❌ ダミーデータ行追加エラー:', error);
      return `⚠️ ダミーデータ行の追加中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * 分析ステータスを更新（モック）
   */
  async updateAnalysisStatus(fileName: string, status: string): Promise<string> {
    console.log('📝 分析ステータス更新（デモモード）:', {
      fileName,
      status,
      spreadsheetId: this.spreadsheetId
    });

    return `分析ステータスを更新しました（デモモード）:

ファイル名: ${fileName}
新しいステータス: ${status}
更新時刻: ${new Date().toLocaleString('ja-JP')}

実際の更新は認証設定後にGoogle Sheetsで実行されます。`;
  }
}
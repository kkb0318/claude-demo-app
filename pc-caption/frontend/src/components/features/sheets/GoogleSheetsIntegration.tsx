'use client';

import { useState } from 'react';
import { Button } from '../../common/Button';

interface GoogleSheetsIntegrationProps {
  analysisResult?: string;
  fileName?: string;
}

export const GoogleSheetsIntegration: React.FC<GoogleSheetsIntegrationProps> = ({
  analysisResult,
  fileName
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sheetsData, setSheetsData] = useState<any>(null);

  const recordAnalysisToSheets = async () => {
    if (!analysisResult || !fileName) {
      setMessage('分析結果またはファイル名が不足しています');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/backend/sheets/record-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          analysisResult,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ 分析結果をGoogle Sheetsに記録しました');
      } else {
        setMessage('❌ 記録に失敗しました: ' + data.error);
      }
    } catch (error) {
      console.error('Google Sheets記録エラー:', error);
      setMessage('❌ 記録中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSheetsData = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/backend/sheets/info');
      const data = await response.json();

      if (data.success) {
        setSheetsData(data.info);
        setMessage('✅ スプレッドシート情報を取得しました');
      } else {
        setMessage('❌ データ取得に失敗しました: ' + data.error);
      }
    } catch (error) {
      console.error('Google Sheetsデータ取得エラー:', error);
      setMessage('❌ データ取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        📊 Google Sheets連携
      </h3>

      <div className="space-y-4">
        {/* スプレッドシート情報取得 */}
        <div>
          <Button
            onClick={loadSheetsData}
            disabled={isLoading}
            variant="secondary"
            className="w-full"
          >
            {isLoading ? '読み込み中...' : 'スプレッドシート情報を取得'}
          </Button>
        </div>

        {/* 分析結果記録 */}
        {analysisResult && fileName && (
          <div>
            <Button
              onClick={recordAnalysisToSheets}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? '記録中...' : '分析結果をGoogle Sheetsに記録'}
            </Button>
          </div>
        )}

        {/* メッセージ表示 */}
        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* スプレッドシート情報表示 */}
        {sheetsData && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-800 mb-2">スプレッドシート情報</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>タイトル:</strong> {sheetsData.title}</div>
              <div><strong>ID:</strong> {sheetsData.spreadsheetId}</div>
              {sheetsData.sheets && (
                <div>
                  <strong>シート一覧:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    {sheetsData.sheets.map((sheet: any) => (
                      <li key={sheet.sheetId}>
                        {sheet.title} ({sheet.gridProperties?.rowCount}行 × {sheet.gridProperties?.columnCount}列)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 使用方法 */}
        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="font-medium text-blue-800 mb-2">💡 使用方法</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>1. 「スプレッドシート情報を取得」でアクセス可能か確認</p>
            <p>2. 分析完了後、「分析結果をGoogle Sheetsに記録」で結果を保存</p>
            <p>3. Google Sheetsで分析履歴を管理・確認できます</p>
          </div>
        </div>
      </div>
    </div>
  );
};
'use client';

import React, { useState, useEffect } from 'react';
import { Sheet, MessageSquare, BarChart3, Database, Loader2, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { googleSheetsAIApi } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface GoogleSheetsAIProps {
  className?: string;
}

interface HealthStatus {
  available: boolean;
  config: {
    openaiApiKey: boolean;
    googleSheetsUrl: boolean;
  };
}

export function GoogleSheetsAI({ className }: GoogleSheetsAIProps) {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'statistics' | 'data'>('chat');
  
  // チャット関連の状態
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // 統計・データ関連の状態
  const [statistics, setStatistics] = useState<string>('');
  const [allData, setAllData] = useState<string>('');

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await googleSheetsAIApi.healthCheck();
      if (result.success && result.data) {
        setHealthStatus(result.data);
      } else {
        setError(result.error || 'ヘルスチェックに失敗しました');
      }
    } catch (err) {
      setError('ヘルスチェック中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;

    setIsChatLoading(true);
    setChatResponse('');
    
    try {
      const result = await googleSheetsAIApi.chat(chatMessage);
      if (result.success && result.data) {
        setChatResponse(result.data.response);
      } else {
        setChatResponse(`エラー: ${result.error || 'チャットに失敗しました'}`);
      }
    } catch (err) {
      setChatResponse('チャット中にエラーが発生しました');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGetStatistics = async () => {
    setIsLoading(true);
    
    try {
      const result = await googleSheetsAIApi.getStatistics();
      if (result.success && result.data) {
        setStatistics(result.data.statistics);
      } else {
        setError(result.error || '統計情報の取得に失敗しました');
      }
    } catch (err) {
      setError('統計情報の取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetAllData = async () => {
    setIsLoading(true);
    
    try {
      const result = await googleSheetsAIApi.getAllData();
      if (result.success && result.data) {
        setAllData(result.data.allData);
      } else {
        setError(result.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError('データの取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const renderHealthStatus = () => {
    if (isLoading) {
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">ヘルスチェック中...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkHealth}
            className="ml-2"
          >
            再試行
          </Button>
        </div>
      );
    }

    if (!healthStatus) {
      return null;
    }

    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {healthStatus.available ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          )}
          <span className="text-sm font-medium">
            Google Sheets AI Agent: {healthStatus.available ? '利用可能' : '利用不可'}
          </span>
        </div>
        
        <div className="text-xs text-gray-500 space-x-4">
          <span>
            OpenAI API: {healthStatus.config.openaiApiKey ? '✓' : '✗'}
          </span>
          <span>
            Sheets URL: {healthStatus.config.googleSheetsUrl ? '✓' : '✗'}
          </span>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Google Sheetsに質問・指示
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                  placeholder="例: 最新の分析結果を10件教えてください"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                  disabled={!healthStatus?.available || isChatLoading}
                />
                <Button
                  onClick={handleChat}
                  disabled={!healthStatus?.available || isChatLoading || !chatMessage.trim()}
                  className="flex items-center space-x-2"
                >
                  {isChatLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>送信</span>
                </Button>
              </div>
            </div>
            
            {chatResponse && (
              <div className="bg-gray-50 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">AI Agent応答:</h4>
                <div className="text-sm text-gray-600 whitespace-pre-wrap">
                  {chatResponse}
                </div>
              </div>
            )}
          </div>
        );

      case 'statistics':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">分析統計情報</h4>
              <Button
                onClick={handleGetStatistics}
                disabled={!healthStatus?.available || isLoading}
                size="sm"
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4" />
                )}
                <span>取得</span>
              </Button>
            </div>
            
            {statistics && (
              <div className="bg-gray-50 rounded-md p-4">
                <div className="text-sm text-gray-600 whitespace-pre-wrap">
                  {statistics}
                </div>
              </div>
            )}
          </div>
        );

      case 'data':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">全分析データ</h4>
              <Button
                onClick={handleGetAllData}
                disabled={!healthStatus?.available || isLoading}
                size="sm"
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                <span>取得</span>
              </Button>
            </div>
            
            {allData && (
              <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
                <div className="text-sm text-gray-600 whitespace-pre-wrap">
                  {allData}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={cn('bg-white rounded-lg border shadow-sm', className)}>
      {/* ヘッダー */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sheet className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Google Sheets AI Agent
            </h3>
          </div>
          {renderHealthStatus()}
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="px-4 py-2 border-b">
        <div className="flex space-x-4">
          {[
            { id: 'chat', label: 'チャット', icon: MessageSquare },
            { id: 'statistics', label: '統計', icon: BarChart3 },
            { id: 'data', label: 'データ', icon: Database },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={cn(
                'flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                activeTab === id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* コンテンツ */}
      <div className="p-4">
        {healthStatus?.available ? (
          renderTabContent()
        ) : (
          <div className="text-center py-8">
            <Sheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Google Sheets AI Agent が利用できません
            </h4>
            <p className="text-sm text-gray-500 mb-4">
              環境変数 OPENAI_API_KEY と GOOGLE_SHEETS_URL が必要です
            </p>
            <Button onClick={checkHealth} size="sm">
              再確認
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
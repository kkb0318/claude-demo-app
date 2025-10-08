'use client';

import React, { useState, useEffect } from 'react';
import { Cog, MessageSquare, Loader2, CheckCircle, AlertCircle, Send, Sparkles, ThumbsUp, ThumbsDown, Clock } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { mcpGoogleSheetsApi } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface MCPGoogleSheetsProps {
  className?: string;
}

interface MCPHealthStatus {
  available: boolean;
  config: {
    openaiApiKey: boolean;
    googleApplicationCredentials: boolean;
    mcpEnabled: boolean;
  };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatResponse {
  response: string;
  mcpEnabled: boolean;
  sessionId?: string;
}

export function MCPGoogleSheets({ className }: MCPGoogleSheetsProps) {
  const [healthStatus, setHealthStatus] = useState<MCPHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // チャット関連の状態
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  
  // HITL関連の状態
  const [pendingApproval, setPendingApproval] = useState<boolean>(false);
  const [isApprovalLoading, setIsApprovalLoading] = useState(false);

  useEffect(() => {
    checkHealth();
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const result = await mcpGoogleSheetsApi.getChatHistory();
      if (result.success && result.data) {
        setChatHistory(result.data.history || []);
        setSessionId(result.data.sessionId || '');
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const checkHealth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await mcpGoogleSheetsApi.healthCheck();
      if (result.success && result.data) {
        setHealthStatus(result.data);
      } else {
        setError(result.error || 'MCPヘルスチェックに失敗しました');
      }
    } catch (err) {
      setError('MCPヘルスチェック中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;

    setIsChatLoading(true);
    setChatResponse('');
    setPendingApproval(false);
    
    try {
      const result = await mcpGoogleSheetsApi.chat(chatMessage);
      if (result.success && result.data) {
        setChatResponse(result.data.response);
        setSessionId(result.data.sessionId || '');
        
        // HITL承認が必要かチェック
        if (result.data.response.includes('確認') && (result.data.response.includes('承認') || result.data.response.includes('削除'))) {
          setPendingApproval(true);
        }
        
        // チャット履歴を更新
        loadChatHistory();
      } else {
        setChatResponse(`エラー: ${result.error || 'MCPチャットに失敗しました'}`);
      }
    } catch (err) {
      setChatResponse('MCPチャット中にエラーが発生しました');
    } finally {
      setIsChatLoading(false);
      setChatMessage(''); // メッセージをクリア
    }
  };

  const handleApproval = async (approve: boolean) => {
    setIsApprovalLoading(true);
    
    try {
      const result = await mcpGoogleSheetsApi.approve(approve);
      if (result.success && result.data) {
        setChatResponse(result.data.response);
        setPendingApproval(false);
        
        // チャット履歴を更新
        loadChatHistory();
      } else {
        setChatResponse(`承認処理エラー: ${result.error || 'HITL承認に失敗しました'}`);
      }
    } catch (err) {
      setChatResponse('HITL承認処理中にエラーが発生しました');
    } finally {
      setIsApprovalLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  };

  const quickCommands = [
    '美術や技術の行が重複しているので、行ごと削除して',
    '追加の科目ダミーデータ行を３つ追加してください',
    'スプレッドシートの統計情報を教えてください',
    'データを整理してください'
  ];

  return (
    <div className={cn('bg-white rounded-lg shadow-lg p-6', className)}>
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Sparkles className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            MCP Google Sheets AI
          </h2>
          <p className="text-sm text-gray-600">
            OpenAI Agent SDK + Model Context Protocol
          </p>
        </div>
      </div>

      {/* ヘルスチェック状況 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-medium text-gray-700">システム状態</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkHealth}
            disabled={isLoading}
            className="p-1"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Cog className="w-4 h-4" />
            )}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-800 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {healthStatus && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {healthStatus.available ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm text-gray-600">
                MCP Agent: {healthStatus.available ? '利用可能' : '利用不可'}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className={cn(
                'flex items-center gap-1 p-2 rounded',
                healthStatus.config.openaiApiKey ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  healthStatus.config.openaiApiKey ? 'bg-green-500' : 'bg-red-500'
                )} />
                OpenAI API
              </div>
              
              <div className={cn(
                'flex items-center gap-1 p-2 rounded',
                healthStatus.config.googleApplicationCredentials ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  healthStatus.config.googleApplicationCredentials ? 'bg-green-500' : 'bg-red-500'
                )} />
                Google Auth
              </div>
              
              <div className={cn(
                'flex items-center gap-1 p-2 rounded',
                healthStatus.config.mcpEnabled ? 'bg-purple-50 text-purple-700' : 'bg-red-50 text-red-700'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  healthStatus.config.mcpEnabled ? 'bg-purple-500' : 'bg-red-500'
                )} />
                MCP有効
              </div>
            </div>
          </div>
        )}
      </div>

      {/* クイックコマンド */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">クイックコマンド</h3>
        <div className="grid grid-cols-1 gap-2">
          {quickCommands.map((command, index) => (
            <button
              key={index}
              onClick={() => setChatMessage(command)}
              className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
            >
              {command}
            </button>
          ))}
        </div>
      </div>

      {/* チャット */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-medium text-gray-900">AI Google Sheets チャット</h3>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <textarea
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="自然言語でGoogle Sheetsの操作を指示してください..."
              className="flex-1 p-3 border border-gray-300 rounded-lg resize-none text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={2}
              disabled={isChatLoading}
            />
            <Button
              onClick={handleChat}
              disabled={!chatMessage.trim() || isChatLoading || !healthStatus?.available}
              className="self-end px-4 py-3 bg-purple-600 hover:bg-purple-700"
            >
              {isChatLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {chatResponse && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">AI応答 (MCP powered)</span>
                {sessionId && (
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    Session: {sessionId.slice(-8)}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {chatResponse}
              </div>
              
              {/* HITL承認UI */}
              {pendingApproval && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">操作の承認が必要です</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApproval(true)}
                      disabled={isApprovalLoading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm"
                    >
                      {isApprovalLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <ThumbsUp className="w-4 h-4 mr-2" />
                      )}
                      承認 (Yes)
                    </Button>
                    <Button
                      onClick={() => handleApproval(false)}
                      disabled={isApprovalLoading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm"
                    >
                      {isApprovalLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <ThumbsDown className="w-4 h-4 mr-2" />
                      )}
                      拒否 (No)
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* チャット履歴 */}
          {chatHistory.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">チャット履歴</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      'p-2 rounded text-xs',
                      msg.role === 'user'
                        ? 'bg-blue-50 text-blue-800 ml-4'
                        : 'bg-purple-50 text-purple-800 mr-4'
                    )}
                  >
                    <div className="font-medium">
                      {msg.role === 'user' ? 'ユーザー' : 'AI'}
                      <span className="text-gray-500 ml-2">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="mt-1">{msg.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
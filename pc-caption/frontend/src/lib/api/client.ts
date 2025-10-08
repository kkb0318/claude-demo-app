import axios from 'axios';
import type { AnalysisResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 1 minute timeout for API calls
  headers: {
    'Accept': 'application/json',
  },
});

// Google Sheets API関連の型定義
export interface SpreadsheetData {
  range: string;
  values: any[][];
  rowCount: number;
}

export interface AnalysisRecord {
  timestamp: string;
  fileName: string;
  analysisResult: string;
  confidence: number;
  detectedElements: string[];
  status: 'completed' | 'in_progress' | 'failed';
  metadata?: {
    processingTime?: number;
    aiModel?: string;
    userId?: string;
  };
}

export interface AnalysisStatistics {
  totalAnalyses: number;
  statusCounts: Record<string, number>;
  averageConfidence: number;
  recentAnalyses: number;
  topDetectedElements: Record<string, number>;
  dailyAnalysisCount: Record<string, number>;
}

export interface SpreadsheetInfo {
  url: string;
  id: string;
  hasClient: boolean;
}

export const analysisApi = {
  async analyzeFiles(files: File[]): Promise<AnalysisResponse> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await apiClient.post<AnalysisResponse>(
        '/api/analysis/analyze',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  },

  async analyzeScreenshots(screenshots: File[]): Promise<AnalysisResponse> {
    const formData = new FormData();

    screenshots.forEach((file) => {
      formData.append('screenshots', file);
    });

    try {
      const response = await apiClient.post<AnalysisResponse>(
        '/api/analysis/analyze-screenshots',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  },
};

// Google Sheets API
export const googleSheetsApi = {
  /**
   * AI分析結果をGoogle Sheetsに記録
   */
  async recordAnalysisResult(record: {
    fileName: string;
    analysisResult: string;
    confidence: number;
    detectedElements?: string[];
    status?: 'completed' | 'in_progress' | 'failed';
    metadata?: {
      processingTime?: number;
      aiModel?: string;
      userId?: string;
    };
  }): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const response = await apiClient.post('/api/sheets/record-analysis', record);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'Google Sheets記録中に予期しないエラーが発生しました',
      };
    }
  },

  /**
   * 複数のAI分析結果を一括記録
   */
  async batchRecordAnalysisResults(records: AnalysisRecord[]): Promise<{
    success: boolean;
    error?: string;
    message?: string;
    data?: {
      totalRecords: number;
      successCount: number;
      errorCount: number;
    };
  }> {
    try {
      const response = await apiClient.post('/api/sheets/batch-record', { records });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: '一括記録中に予期しないエラーが発生しました',
      };
    }
  },

  /**
   * 分析統計を取得
   */
  async getAnalysisStatistics(): Promise<{
    success: boolean;
    error?: string;
    data?: { statistics: AnalysisStatistics };
  }> {
    try {
      const response = await apiClient.get('/api/sheets/statistics');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: '統計取得中に予期しないエラーが発生しました',
      };
    }
  },

  /**
   * スプレッドシートからデータを読み取り
   */
  async readData(range: string = 'A:H'): Promise<{
    success: boolean;
    error?: string;
    data?: SpreadsheetData;
  }> {
    try {
      const response = await apiClient.get(`/api/sheets/read/${encodeURIComponent(range)}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'データ読み取り中に予期しないエラーが発生しました',
      };
    }
  },

  /**
   * 分析結果のステータスを更新
   */
  async updateAnalysisStatus(fileName: string, status: string): Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }> {
    try {
      const response = await apiClient.patch(`/api/sheets/update-status/${encodeURIComponent(fileName)}`, { status });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'ステータス更新中に予期しないエラーが発生しました',
      };
    }
  },

  /**
   * スプレッドシート情報を取得
   */
  async getSpreadsheetInfo(): Promise<{
    success: boolean;
    error?: string;
    data?: {
      spreadsheetInfo: SpreadsheetInfo;
      currentUrl: string;
    };
  }> {
    try {
      const response = await apiClient.get('/api/sheets/info');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'スプレッドシート情報取得中に予期しないエラーが発生しました',
      };
    }
  },

  /**
   * スプレッドシートURLを動的に変更
   */
  async setSpreadsheetUrl(url: string): Promise<{
    success: boolean;
    error?: string;
    message?: string;
    data?: {
      newUrl: string;
      spreadsheetInfo: SpreadsheetInfo;
    };
  }> {
    try {
      const response = await apiClient.post('/api/sheets/set-url', { url });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'URL変更中に予期しないエラーが発生しました',
      };
    }
  },

  /**
   * 特定のセルを更新
   */
  async updateCell(cellAddress: string, value: string): Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }> {
    try {
      const response = await apiClient.patch(`/api/sheets/update-cell/${encodeURIComponent(cellAddress)}`, { value });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'セル更新中に予期しないエラーが発生しました',
      };
    }
  },

  /**
   * 新しいシートを作成
   */
  async createAnalysisSheet(sheetTitle: string): Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }> {
    try {
      const response = await apiClient.post('/api/sheets/create-sheet', { sheetTitle });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'シート作成中に予期しないエラーが発生しました',
      };
    }
  },
};

// Google Sheets AI Agent API
export const googleSheetsAIApi = {
  /**
   * ヘルスチェック
   */
  async healthCheck(): Promise<{
    success: boolean;
    data?: {
      available: boolean;
      config: {
        openaiApiKey: boolean;
        googleSheetsUrl: boolean;
      };
    };
    error?: string;
  }> {
    try {
      const response = await apiClient.get('/api/sheets-ai/health');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'ヘルスチェック中にエラーが発生しました',
      };
    }
  },

  /**
   * 分析結果を記録
   */
  async recordAnalysis(analysisData: AnalysisRecord): Promise<{
    success: boolean;
    data?: {
      message: string;
      sheetResponse: string;
    };
    error?: string;
  }> {
    try {
      const response = await apiClient.post('/api/sheets-ai/record', analysisData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: '分析結果の記録中にエラーが発生しました',
      };
    }
  },

  /**
   * 複数の分析結果を一括記録
   */
  async batchRecordAnalysis(analysisDataList: AnalysisRecord[]): Promise<{
    success: boolean;
    data?: {
      message: string;
      sheetResponse: string;
    };
    error?: string;
  }> {
    try {
      const response = await apiClient.post('/api/sheets-ai/batch-record', { analysisDataList });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: '一括記録中にエラーが発生しました',
      };
    }
  },

  /**
   * 統計情報を取得
   */
  async getStatistics(): Promise<{
    success: boolean;
    data?: {
      statistics: string;
    };
    error?: string;
  }> {
    try {
      const response = await apiClient.get('/api/sheets-ai/statistics');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: '統計情報の取得中にエラーが発生しました',
      };
    }
  },

  /**
   * 全分析データを取得
   */
  async getAllData(): Promise<{
    success: boolean;
    data?: {
      allData: string;
    };
    error?: string;
  }> {
    try {
      const response = await apiClient.get('/api/sheets-ai/data');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'データ取得中にエラーが発生しました',
      };
    }
  },

  /**
   * 分析ステータスを更新
   */
  async updateStatus(fileName: string, status: 'processing' | 'completed' | 'error'): Promise<{
    success: boolean;
    data?: {
      message: string;
      sheetResponse: string;
    };
    error?: string;
  }> {
    try {
      const response = await apiClient.put('/api/sheets-ai/status', { fileName, status });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'ステータス更新中にエラーが発生しました',
      };
    }
  },

  /**
   * 自然言語チャット
   */
  async chat(message: string): Promise<{
    success: boolean;
    data?: {
      response: string;
    };
    error?: string;
  }> {
    try {
      const response = await apiClient.post('/api/sheets-ai/chat', { message });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'チャット中にエラーが発生しました',
      };
    }
  },
};

// MCP Google Sheets API
export const mcpGoogleSheetsApi = {
  /**
   * ヘルスチェック
   */
  async healthCheck(): Promise<{
    success: boolean;
    data?: {
      available: boolean;
      config: {
        openaiApiKey: boolean;
        googleApplicationCredentials: boolean;
        mcpEnabled: boolean;
      };
    };
    error?: string;
  }> {
    try {
      const response = await apiClient.get('/api/mcp-sheets/health');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'MCPヘルスチェック中にエラーが発生しました',
      };
    }
  },

  /**
   * MCPチャット（AI powered Google Sheets operations）
   */
  async chat(message: string): Promise<{
    success: boolean;
    data?: {
      response: string;
      mcpEnabled: boolean;
      sessionId?: string;
    };
    error?: string;
  }> {
    try {
      const response = await apiClient.post('/api/mcp-sheets/chat', { message });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'MCPチャット中にエラーが発生しました',
      };
    }
  },

  /**
   * HITL承認/拒否
   */
  async approve(approve: boolean): Promise<{
    success: boolean;
    data?: {
      response: string;
      approved: boolean;
    };
    error?: string;
  }> {
    try {
      const response = await apiClient.post('/api/mcp-sheets/approve', { approve });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'HITL承認処理中にエラーが発生しました',
      };
    }
  },

  /**
   * チャット履歴取得
   */
  async getChatHistory(): Promise<{
    success: boolean;
    data?: {
      history: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
      }>;
      sessionId: string;
    };
    error?: string;
  }> {
    try {
      const response = await apiClient.get('/api/mcp-sheets/history');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }
      return {
        success: false,
        error: 'チャット履歴取得中にエラーが発生しました',
      };
    }
  },
};
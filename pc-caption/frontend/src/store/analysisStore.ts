import { create } from 'zustand';
import type { FileUpload, AnalysisResponse } from '@/types/api';
import { googleSheetsApi, type AnalysisRecord, type AnalysisStatistics } from '@/lib/api/client';

interface AnalysisState {
  files: FileUpload[];
  isUploading: boolean;
  isAnalyzing: boolean;
  isRecordingToSheets: boolean;
  currentStep: number; // 1: Upload, 2: Analysis, 3: Results
  analysisResult: AnalysisResponse | null;
  error: string | null;
  
  // Google Sheets関連
  analysisStatistics: AnalysisStatistics | null;
  isLoadingStatistics: boolean;
  autoRecordToSheets: boolean;

  addFile: (file: FileUpload) => void;
  removeFile: (fileName: string) => void;
  clearFiles: () => void;
  setUploading: (isUploading: boolean) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setCurrentStep: (step: number) => void;
  setAnalysisResult: (result: AnalysisResponse) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Google Sheets機能
  recordAnalysisToSheets: (analysisResult: AnalysisResponse) => Promise<boolean>;
  loadAnalysisStatistics: () => Promise<void>;
  setAutoRecordToSheets: (auto: boolean) => void;
  updateAnalysisStatus: (fileName: string, status: string) => Promise<boolean>;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  files: [],
  isUploading: false,
  isAnalyzing: false,
  isRecordingToSheets: false,
  currentStep: 1,
  analysisResult: null,
  error: null,
  
  // Google Sheets関連の初期値
  analysisStatistics: null,
  isLoadingStatistics: false,
  autoRecordToSheets: true, // デフォルトで自動記録有効

  addFile: (file) => set((state) => ({
    files: [...state.files, file],
    isUploading: false
  })),

  removeFile: (fileName) => set((state) => ({
    files: state.files.filter(f => f.file.name !== fileName)
  })),

  clearFiles: () => set({ files: [] }),

  setUploading: (isUploading) => set({ isUploading }),

  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

  setCurrentStep: (step) => set({ currentStep: step }),

  setAnalysisResult: async (result) => {
    set({ analysisResult: result, error: null, currentStep: 3 });
    
    // 自動記録が有効で分析成功時にGoogle Sheetsに記録
    const { autoRecordToSheets } = get();
    if (autoRecordToSheets && result.success && result.data) {
      const recordSuccess = await get().recordAnalysisToSheets(result);
      if (!recordSuccess) {
        console.warn('Google Sheetsへの自動記録に失敗しました');
      }
    }
  },

  setError: (error) => set({ error, isAnalyzing: false }),

  reset: () => set({
    files: [],
    isUploading: false,
    isAnalyzing: false,
    isRecordingToSheets: false,
    currentStep: 1,
    analysisResult: null,
    error: null
  }),

  // Google Sheets機能の実装
  recordAnalysisToSheets: async (analysisResult: AnalysisResponse): Promise<boolean> => {
    if (!analysisResult.success || !analysisResult.data) {
      return false;
    }

    set({ isRecordingToSheets: true });

    try {
      const files = get().files;
      if (files.length === 0) {
        console.warn('記録するファイルがありません');
        return false;
      }

      // 分析データから情報を抽出
      const analysisData = analysisResult.data;
      const businessInference = analysisData.businessInference;
      const screenshotAnalyses = analysisData.screenshotAnalyses || analysisData.analyses || [];

      // 複数ファイルがある場合は一括記録
      if (files.length > 1) {
        const records: AnalysisRecord[] = files.map((fileUpload, index) => {
          const analysis = screenshotAnalyses[index];
          return {
            timestamp: new Date().toISOString(),
            fileName: fileUpload.file.name,
            analysisResult: analysis?.analysis || businessInference?.overallActivity || '分析結果なし',
            confidence: 85, // デフォルト信頼度
            detectedElements: businessInference?.keyFindings || analysis?.keyActions || [],
            status: 'completed' as const,
            metadata: {
              processingTime: Date.now() - Date.now(), // 実際の処理時間に置き換え
              aiModel: 'GPT-4o-mini',
              userId: 'user'
            }
          };
        });

        const result = await googleSheetsApi.batchRecordAnalysisResults(records);
        
        if (result.success) {
          console.log(`${files.length}件の分析結果をGoogle Sheetsに記録しました`);
          // 統計を更新
          get().loadAnalysisStatistics();
          return true;
        } else {
          set({ error: `一括記録エラー: ${result.error}` });
          return false;
        }
      } else {
        // 単一ファイルの場合
        const fileUpload = files[0];
        const analysis = screenshotAnalyses[0];
        
        const result = await googleSheetsApi.recordAnalysisResult({
          fileName: fileUpload.file.name,
          analysisResult: analysis?.analysis || businessInference?.overallActivity || '分析結果なし',
          confidence: 85, // デフォルト信頼度
          detectedElements: businessInference?.keyFindings || analysis?.keyActions || [],
          status: 'completed',
          metadata: {
            processingTime: Date.now() - Date.now(), // 実際の処理時間に置き換え
            aiModel: 'GPT-4o-mini',
            userId: 'user'
          }
        });

        if (result.success) {
          console.log('分析結果をGoogle Sheetsに記録しました');
          // 統計を更新
          get().loadAnalysisStatistics();
          return true;
        } else {
          set({ error: `記録エラー: ${result.error}` });
          return false;
        }
      }
    } catch (error) {
      console.error('Google Sheets記録エラー:', error);
      set({ error: `記録中にエラーが発生しました: ${error}` });
      return false;
    } finally {
      set({ isRecordingToSheets: false });
    }
  },

  loadAnalysisStatistics: async () => {
    set({ isLoadingStatistics: true });
    
    try {
      const result = await googleSheetsApi.getAnalysisStatistics();
      
      if (result.success && result.data) {
        set({ analysisStatistics: result.data.statistics });
      } else {
        console.warn('統計取得失敗:', result.error);
      }
    } catch (error) {
      console.error('統計取得エラー:', error);
    } finally {
      set({ isLoadingStatistics: false });
    }
  },

  setAutoRecordToSheets: (auto: boolean) => set({ autoRecordToSheets: auto }),

  updateAnalysisStatus: async (fileName: string, status: string): Promise<boolean> => {
    try {
      const result = await googleSheetsApi.updateAnalysisStatus(fileName, status);
      
      if (result.success) {
        console.log(`${fileName}のステータスを${status}に更新しました`);
        // 統計を更新
        get().loadAnalysisStatistics();
        return true;
      } else {
        set({ error: `ステータス更新エラー: ${result.error}` });
        return false;
      }
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      set({ error: `ステータス更新中にエラーが発生しました: ${error}` });
      return false;
    }
  }
}));
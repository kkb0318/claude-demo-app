import { create } from 'zustand';
import type { FileUpload, AnalysisResponse } from '@/types/api';

interface AnalysisState {
  files: FileUpload[];
  isUploading: boolean;
  isAnalyzing: boolean;
  currentStep: number; // 1: Upload, 2: Analysis, 3: Results
  analysisResult: AnalysisResponse | null;
  error: string | null;

  addFile: (file: FileUpload) => void;
  removeFile: (fileName: string) => void;
  clearFiles: () => void;
  setUploading: (isUploading: boolean) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setCurrentStep: (step: number) => void;
  setAnalysisResult: (result: AnalysisResponse) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  files: [],
  isUploading: false,
  isAnalyzing: false,
  currentStep: 1,
  analysisResult: null,
  error: null,

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

  setAnalysisResult: (result) => set({ analysisResult: result, error: null, currentStep: 3 }),

  setError: (error) => set({ error, isAnalyzing: false }),

  reset: () => set({
    files: [],
    isUploading: false,
    isAnalyzing: false,
    currentStep: 1,
    analysisResult: null,
    error: null
  })
}));
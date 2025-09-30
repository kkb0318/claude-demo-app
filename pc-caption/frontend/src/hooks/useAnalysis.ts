import { useCallback } from 'react';
import { useAnalysisStore } from '@/store/analysisStore';
import { analysisApi } from '@/lib/api/client';

export const useAnalysis = () => {
  const {
    files,
    isUploading,
    isAnalyzing,
    currentStep,
    analysisResult,
    error,
    addFile,
    removeFile,
    clearFiles,
    setUploading,
    setAnalyzing,
    setCurrentStep,
    setAnalysisResult,
    setError,
    reset
  } = useAnalysisStore();

  const startAnalysis = useCallback(async () => {
    if (files.length === 0) {
      setError('Please upload at least one file');
      return;
    }

    setCurrentStep(2); // Move to AI Analysis step
    setAnalyzing(true);
    setError(null);

    try {
      const fileList = files.map(f => f.file);
      const response = await analysisApi.analyzeFiles(fileList);

      if (response.success) {
        setAnalysisResult(response);
      } else {
        setError(response.error || 'Analysis failed');
      }
    } catch (err) {
      setError('An unexpected error occurred during analysis');
    } finally {
      setAnalyzing(false);
    }
  }, [files, setAnalyzing, setError, setAnalysisResult, setCurrentStep]);

  const analyzeScreenshotsOnly = useCallback(async () => {
    const screenshots = files.filter(f => f.type === 'image');

    if (screenshots.length === 0) {
      setError('Please upload at least one screenshot');
      return;
    }

    setCurrentStep(2); // Move to AI Analysis step
    setAnalyzing(true);
    setError(null);

    try {
      const fileList = screenshots.map(f => f.file);
      const response = await analysisApi.analyzeScreenshots(fileList);

      if (response.success) {
        setAnalysisResult(response);
      } else {
        setError(response.error || 'Screenshot analysis failed');
      }
    } catch (err) {
      setError('An unexpected error occurred during screenshot analysis');
    } finally {
      setAnalyzing(false);
    }
  }, [files, setAnalyzing, setError, setAnalysisResult, setCurrentStep]);

  return {
    files,
    isUploading,
    isAnalyzing,
    currentStep,
    analysisResult,
    error,
    addFile,
    removeFile,
    clearFiles,
    setUploading,
    setCurrentStep,
    startAnalysis,
    analyzeScreenshotsOnly,
    reset
  };
};
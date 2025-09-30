'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Monitor, Brain, FileSearch, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { FileUploadZone } from '@/components/features/upload/FileUploadZone';
import { FileList } from '@/components/features/upload/FileList';
import { AnalysisResult } from '@/components/features/analysis/AnalysisResult';
import { Button } from '@/components/common/Button';
import { ProgressBar } from '@/components/common/ProgressBar';
import { useAnalysis } from '@/hooks/useAnalysis';
import { cn } from '@/lib/utils';

export default function Home() {
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
    setCurrentStep,
    startAnalysis,
    analyzeScreenshotsOnly,
    reset
  } = useAnalysis();

  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  useEffect(() => {
    if (!isAnalyzing) {
      setAnalysisProgress(0);
      return;
    }

    const messages = [
      'Uploading files to server...',
      'Processing screenshots with AI vision...',
      'Analyzing business activities...',
      'Extracting key insights...',
      'Generating comprehensive report...'
    ];

    let currentMessageIndex = 0;
    let currentProgress = 0;

    const messageInterval = setInterval(() => {
      if (currentMessageIndex < messages.length) {
        setProgressMessage(messages[currentMessageIndex]);
        currentMessageIndex++;
      }
    }, 2500);

    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress > 90) currentProgress = 90;
      setAnalysisProgress(currentProgress);
    }, 500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [isAnalyzing]);

  const handleFilesAdded = useCallback(async (newFiles: any[]) => {
    setUploading(true);
    // Simulate file processing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    newFiles.forEach(file => addFile(file));
    setUploading(false);
  }, [addFile, setUploading]);

  const hasJsonFile = files.some(f => f.type === 'json');
  const hasImageFiles = files.some(f => f.type === 'image');

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <Monitor className="w-10 h-10 text-blue-600" />
            <Brain className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            PC Caption Analyzer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload screenshots and operation logs to analyze business activities using AI-powered multimodal inference
          </p>
        </div>

        {/* Process Steps */}
        <div className="flex justify-center items-center space-x-4 mb-10">
          <div className={cn(
            "flex items-center space-x-2 transition-all",
            currentStep === 1 ? "scale-110" : "opacity-70"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-all",
              currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
            )}>
              {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
            </div>
            <span className="text-sm font-medium">Upload Files</span>
          </div>
          <ArrowRight className={cn(
            "w-4 h-4 transition-all",
            currentStep >= 2 ? "text-blue-600" : "text-gray-400"
          )} />
          <div className={cn(
            "flex items-center space-x-2 transition-all",
            currentStep === 2 ? "scale-110" : currentStep < 2 ? "opacity-70" : ""
          )}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-all",
              currentStep >= 2 ? "bg-purple-600 text-white" : "bg-gray-300 text-gray-600"
            )}>
              {currentStep > 2 ? <CheckCircle className="w-5 h-5" /> :
               currentStep === 2 && isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : "2"}
            </div>
            <span className="text-sm font-medium">AI Analysis</span>
          </div>
          <ArrowRight className={cn(
            "w-4 h-4 transition-all",
            currentStep >= 3 ? "text-green-600" : "text-gray-400"
          )} />
          <div className={cn(
            "flex items-center space-x-2 transition-all",
            currentStep === 3 ? "scale-110" : "opacity-70"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-all",
              currentStep >= 3 ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"
            )}>
              {currentStep === 3 ? <CheckCircle className="w-5 h-5" /> : "3"}
            </div>
            <span className="text-sm font-medium">Business Insights</span>
          </div>
        </div>

        {/* Show loading overlay during analysis */}
        {currentStep === 2 && !analysisResult && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
            <div className="flex flex-col items-center space-y-6">
              {isAnalyzing ? (
                <>
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Brain className="w-8 h-8 text-purple-600 animate-pulse" />
                    </div>
                  </div>

                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-semibold text-gray-900">AI Analysis in Progress</h2>
                    <p className="text-lg text-purple-600 font-medium min-h-[28px] transition-all">
                      {progressMessage || 'Initializing analysis...'}
                    </p>
                  </div>

                  <div className="w-full max-w-md space-y-2">
                    <ProgressBar
                      value={analysisProgress}
                      max={100}
                      showPercentage={true}
                      animated={true}
                    />
                    <p className="text-sm text-gray-500 text-center">
                      Processing {files.length} file{files.length > 1 ? 's' : ''}...
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-4">
                    <div className="flex items-center space-x-2">
                      <FileSearch className="w-4 h-4 text-purple-500" />
                      <span>Scanning content</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Brain className="w-4 h-4 text-purple-500" />
                      <span>AI processing</span>
                    </div>
                  </div>
                </>
              ) : error ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900">Analysis Failed</h2>
                  <p className="text-red-600 text-center max-w-md">{error}</p>
                  <Button
                    onClick={() => setCurrentStep(1)}
                    variant="secondary"
                  >
                    Back to Upload
                  </Button>
                </>
              ) : (
                <>
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                      <Brain className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900">Preparing Analysis</h2>

                  <div className="w-full max-w-md">
                    <ProgressBar
                      isIndeterminate={true}
                      animated={true}
                    />
                  </div>

                  <p className="text-gray-600 text-center max-w-md">
                    Initializing AI processing pipeline...
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Upload Section */}
        {!analysisResult && currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FileSearch className="w-6 h-6 mr-2 text-gray-600" />
              Upload Files for Analysis
            </h2>

            <FileUploadZone
              onFilesAdded={handleFilesAdded}
              isUploading={isUploading}
              disabled={isAnalyzing}
            />
            <FileList files={files} onRemove={removeFile} />

            {error && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-6 flex gap-3">
                {hasJsonFile && hasImageFiles && (
                  <Button
                    onClick={startAnalysis}
                    isLoading={isAnalyzing}
                    disabled={isAnalyzing || isUploading}
                  >
                    Analyze with Operation Log
                  </Button>
                )}
                {hasImageFiles && (
                  <Button
                    onClick={analyzeScreenshotsOnly}
                    isLoading={isAnalyzing}
                    disabled={isAnalyzing || isUploading}
                    variant={hasJsonFile ? "secondary" : "primary"}
                  >
                    Analyze Screenshots Only
                  </Button>
                )}
                <Button
                  onClick={clearFiles}
                  variant="ghost"
                  disabled={isAnalyzing}
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {analysisResult && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <AnalysisResult result={analysisResult} />

            <div className="mt-6 flex justify-center">
              <Button onClick={reset} variant="secondary">
                Start New Analysis
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
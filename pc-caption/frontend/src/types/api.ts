export interface RecordingStep {
  type: string;
  width?: number;
  height?: number;
  url?: string;
  title?: string;
  target?: string;
  selectors?: string[][];
  offsetX?: number;
  offsetY?: number;
  assertedEvents?: Array<{
    type: string;
    url?: string;
    title?: string;
  }>;
}

export interface Recording {
  title: string;
  steps: RecordingStep[];
}

export interface AnalysisResult {
  screenshot: string;
  analysis: string;
  businessActivity?: string;
  keyActions?: string[];
}

export interface BusinessActivityInference {
  overallActivity: string;
  activityType: string;
  keyFindings: string[];
  timeline: string;
  toolsUsed: string[];
  dataProcessed: string[];
}

export interface AnalysisResponse {
  success: boolean;
  data?: {
    screenshotAnalyses?: AnalysisResult[];
    analyses?: AnalysisResult[];
    businessInference?: BusinessActivityInference | null;
    report?: string;
  };
  error?: string;
}

export interface FileUpload {
  file: File;
  preview?: string;
  type: 'image' | 'json';
}
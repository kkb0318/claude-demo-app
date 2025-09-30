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
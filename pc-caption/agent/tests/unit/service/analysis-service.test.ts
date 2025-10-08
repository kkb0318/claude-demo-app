import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AnalysisService } from '../../../src/domain/service/analysis-service.js';
import type { OpenAIClient } from '../../../src/domain/client/openai-client.js';

// モッククラス定義
class MockOpenAIClient implements OpenAIClient {
  analyzeImage = vi.fn();
  generateInference = vi.fn();
}

// テスト用のAnalysisServiceImpl（後で実装される）
class AnalysisServiceImpl implements AnalysisService {
  constructor(private openaiClient: OpenAIClient) {}

  async analyzeScreenshot(
    imageBuffer: Buffer,
    fileName: string,
    context?: string
  ): Promise<{ screenshot: string; analysis: string }> {
    const base64Image = imageBuffer.toString('base64');

    const systemPrompt = `あなたは業務分析の専門家です。提供されたPCスクリーンショットを分析し、
    どのような業務活動が行われているかを詳細に説明してください。
    具体的には以下の点に注目してください：
    1. 使用されているアプリケーション/ツール
    2. 実行されている具体的な作業内容
    3. データの種類と内容（見える範囲で）
    4. 業務の目的や意図の推測
    5. 作業の進行状況`;

    const userPrompt = context
      ? `このスクリーンショットを分析してください。コンテキスト: ${context}`
      : 'このスクリーンショットを分析し、どのような業務活動が行われているか説明してください。';

    const prompt = `${systemPrompt}\n\n${userPrompt}`;

    const analysis = await this.openaiClient.analyzeImage(base64Image, prompt);

    return {
      screenshot: fileName,
      analysis
    };
  }
}

describe('AnalysisService', () => {
  let mockOpenAIClient: MockOpenAIClient;
  let analysisService: AnalysisService;

  beforeEach(() => {
    mockOpenAIClient = new MockOpenAIClient();
    analysisService = new AnalysisServiceImpl(mockOpenAIClient);
  });

  describe('analyzeScreenshot', () => {
    it('OpenAIクライアントが正しく呼び出される', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      const fileName = 'test-screenshot.png';
      const expectedAnalysis = 'This is the analysis result';

      mockOpenAIClient.analyzeImage.mockResolvedValue(expectedAnalysis);

      const result = await analysisService.analyzeScreenshot(
        mockImageBuffer,
        fileName
      );

      expect(mockOpenAIClient.analyzeImage).toHaveBeenCalledTimes(1);
      expect(mockOpenAIClient.analyzeImage).toHaveBeenCalledWith(
        mockImageBuffer.toString('base64'),
        expect.stringContaining('業務分析の専門家')
      );
      expect(result.screenshot).toBe(fileName);
      expect(result.analysis).toBe(expectedAnalysis);
    });

    it('コンテキストが提供された場合、プロンプトに含まれる', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      const fileName = 'test-screenshot.png';
      const context = 'User is working on KPI input';
      const expectedAnalysis = 'Analysis with context';

      mockOpenAIClient.analyzeImage.mockResolvedValue(expectedAnalysis);

      await analysisService.analyzeScreenshot(
        mockImageBuffer,
        fileName,
        context
      );

      expect(mockOpenAIClient.analyzeImage).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(context)
      );
    });

    it('OpenAIクライアントがエラーを投げた場合、エラーが伝播する', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      const fileName = 'test-screenshot.png';
      const error = new Error('OpenAI API Error');

      mockOpenAIClient.analyzeImage.mockRejectedValue(error);

      await expect(
        analysisService.analyzeScreenshot(mockImageBuffer, fileName)
      ).rejects.toThrow('OpenAI API Error');
    });

    it('空のバッファでも処理できる', async () => {
      const mockImageBuffer = Buffer.from('');
      const fileName = 'empty-screenshot.png';
      const expectedAnalysis = 'Empty analysis';

      mockOpenAIClient.analyzeImage.mockResolvedValue(expectedAnalysis);

      const result = await analysisService.analyzeScreenshot(
        mockImageBuffer,
        fileName
      );

      expect(result.screenshot).toBe(fileName);
      expect(result.analysis).toBe(expectedAnalysis);
    });
  });
});

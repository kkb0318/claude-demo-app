import type { AnalysisService } from '../domain/service/analysis-service.js';
import type { AnalysisResult } from '../domain/entities/analysis.js';
import type { OpenAIClient } from '../domain/client/openai-client.js';
import { logger } from '../infrastructure/logger/logger.js';

/**
 * 分析サービスの実装
 *
 * OpenAI APIを使用して画像分析を行うサービスクラス
 */
export class AnalysisServiceImpl implements AnalysisService {
  constructor(private readonly openaiClient: OpenAIClient) {
    logger.info('AnalysisService initialized');
  }

  /**
   * 単一のスクリーンショットを分析する
   */
  async analyzeScreenshot(
    imageBuffer: Buffer,
    fileName: string,
    context?: string
  ): Promise<AnalysisResult> {
    try {
      logger.info('Analyzing screenshot', { fileName });

      // 画像をBase64に変換
      const base64Image = imageBuffer.toString('base64');

      // プロンプトを生成
      const prompt = this.generatePrompt(context);

      // OpenAI APIで分析
      const analysis = await this.openaiClient.analyzeImage(
        base64Image,
        prompt
      );

      logger.info('Screenshot analysis completed', { fileName });

      return {
        screenshot: fileName,
        analysis
      };
    } catch (error) {
      logger.error('Error analyzing screenshot:', { fileName, error });
      throw error;
    }
  }

  /**
   * 分析プロンプトを生成する
   */
  private generatePrompt(context?: string): string {
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

    return `${systemPrompt}\n\n${userPrompt}`;
  }
}

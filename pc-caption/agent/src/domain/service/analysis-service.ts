import type { AnalysisResult } from '../entities/analysis.js';

/**
 * 分析サービスのインターフェース
 *
 * このインターフェースは、画像分析のビジネスロジックを定義します。
 * Service層で具象実装を提供します。
 */
export interface AnalysisService {
  /**
   * 単一のスクリーンショットを分析する
   *
   * @param imageBuffer - 画像データのBuffer
   * @param fileName - 画像ファイル名
   * @param context - オプションのコンテキスト情報（操作ログなど）
   * @returns 分析結果
   * @throws 分析処理中にエラーが発生した場合
   */
  analyzeScreenshot(
    imageBuffer: Buffer,
    fileName: string,
    context?: string
  ): Promise<AnalysisResult>;
}

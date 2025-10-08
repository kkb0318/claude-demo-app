import { z } from 'zod';

/**
 * 画像分析結果のエンティティ
 */
export interface AnalysisResult {
  /** スクリーンショットのファイル名 */
  screenshot: string;
  /** AI分析結果のテキスト */
  analysis: string;
}

/**
 * AnalysisResult のバリデーションスキーマ
 */
export const AnalysisResultSchema = z.object({
  screenshot: z.string().min(1, '画像ファイル名は必須です'),
  analysis: z.string().min(1, '分析結果は必須です')
});

/**
 * バリデーション済みのAnalysisResult型
 */
export type ValidatedAnalysisResult = z.infer<typeof AnalysisResultSchema>;

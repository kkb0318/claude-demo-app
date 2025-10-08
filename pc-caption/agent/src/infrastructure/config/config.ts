import dotenv from 'dotenv';

// 環境変数を読み込む
dotenv.config();

/**
 * アプリケーション設定
 *
 * 環境変数から設定を読み込み、型安全な設定オブジェクトを提供します。
 */
export const config = {
  /** OpenAI API設定 */
  openai: {
    /** OpenAI APIキー */
    apiKey: process.env.OPENAI_API_KEY || '',
    /** 使用するモデル */
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    /** 最大トークン数 */
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1500', 10),
    /** Temperature（ランダム性の度合い） */
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
  },

  /** ロギング設定 */
  logging: {
    /** ログレベル */
    level: process.env.LOG_LEVEL || 'info'
  }
} as const;

/**
 * 設定のバリデーション
 *
 * 必須の設定が欠けている場合にエラーを投げます。
 */
export function validateConfig(): void {
  if (!config.openai.apiKey) {
    throw new Error(
      'OPENAI_API_KEY is required. Please set it in your .env file.'
    );
  }
}

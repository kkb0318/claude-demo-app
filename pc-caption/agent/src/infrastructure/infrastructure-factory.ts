import type { OpenAIClient } from '../domain/client/openai-client.js';
import { OpenAIClientImpl } from './client/openai-client-impl.js';
import { validateConfig } from './config/config.js';
import { logger } from './logger/logger.js';

/**
 * インフラストラクチャファクトリー
 *
 * 依存性注入のためのファクトリークラス。
 * 環境変数から設定を読み込み、各コンポーネントのインスタンスを生成します。
 */
export class InfrastructureFactory {
  /**
   * OpenAI クライアントを作成
   *
   * @returns OpenAIClient のインスタンス
   * @throws 環境変数が不足している場合
   */
  static createOpenAIClient(): OpenAIClient {
    try {
      validateConfig();
      logger.info('Creating OpenAI client...');
      return new OpenAIClientImpl();
    } catch (error) {
      logger.error('Failed to create OpenAI client:', error);
      throw error;
    }
  }
}

import { Agent, run } from '@openai/agents';
import OpenAI from 'openai';
import type { OpenAIClient } from '../../domain/client/openai-client.js';
import { config } from '../config/config.js';
import { logger } from '../logger/logger.js';

/**
 * OpenAI API クライアントの実装
 *
 * @openai/agents SDKと OpenAI SDK を組み合わせて使用します。
 * - 画像分析: OpenAI SDK (Agentsは画像未対応のため)
 * - 推論生成: @openai/agents SDK
 */
export class OpenAIClientImpl implements OpenAIClient {
  private openai: OpenAI;
  private inferenceAgent: Agent;

  constructor() {
    // OpenAI SDK クライアント (画像分析用)
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });

    // 推論生成用エージェント
    this.inferenceAgent = new Agent({
      name: 'Business Inference Generator',
      instructions: '提供された情報から業務活動の全体像を推論し、要求されたフォーマットで回答してください。',
      model: config.openai.model,
      temperature: config.openai.temperature
    });

    logger.info('OpenAI client and agents initialized', {
      model: config.openai.model,
      maxTokens: config.openai.maxTokens,
      temperature: config.openai.temperature
    });
  }

  /**
   * 画像を分析する (OpenAI SDK使用)
   */
  async analyzeImage(base64Image: string, prompt: string): Promise<string> {
    try {
      logger.debug('Analyzing image with OpenAI SDK', {
        promptLength: prompt.length,
        imageSize: base64Image.length
      });

      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_completion_tokens: config.openai.maxTokens,
        temperature: config.openai.temperature
      });

      const analysis = response.choices[0]?.message?.content;

      if (!analysis) {
        throw new Error('No content received from OpenAI API');
      }

      logger.info('Image analysis completed', {
        responseLength: analysis.length,
        tokensUsed: response.usage?.total_tokens
      });

      return analysis;
    } catch (error) {
      logger.error('OpenAI API error during image analysis:', error);
      throw new Error(
        `Failed to analyze image with OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * テキストプロンプトから推論を生成する (@openai/agents使用)
   */
  async generateInference(
    prompt: string,
    requireJson: boolean = false
  ): Promise<any> {
    try {
      logger.debug('Generating inference with OpenAI Agent', {
        promptLength: prompt.length,
        requireJson
      });

      // JSON形式が必要な場合はプロンプトに明示的に指示を追加
      const finalPrompt = requireJson
        ? `${prompt}\n\n必ずJSON形式で回答してください。`
        : prompt;

      const result = await run(this.inferenceAgent, finalPrompt);
      const content = result.finalOutput;

      if (!content) {
        throw new Error('No content received from OpenAI Agent');
      }

      logger.info('Inference generation completed', {
        responseLength: content.length
      });

      return requireJson ? JSON.parse(content) : content;
    } catch (error) {
      logger.error('OpenAI Agent error during inference generation:', error);
      throw new Error(
        `Failed to generate inference with OpenAI Agent: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

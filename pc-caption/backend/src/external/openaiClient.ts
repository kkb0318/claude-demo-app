import OpenAI from 'openai';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

export class OpenAIClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async analyzeImage(base64Image: string, prompt: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
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

      return response.choices[0]?.message?.content || 'Analysis failed';
    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw new Error('Failed to analyze image with OpenAI');
    }
  }

  async generateInference(prompt: string, requireJson: boolean = false): Promise<any> {
    try {
      const messages = [
        {
          role: 'user' as const,
          content: prompt
        }
      ];

      const requestOptions: any = {
        model: config.openai.model,
        messages,
        max_completion_tokens: config.openai.maxTokens,
        temperature: config.openai.temperature
      };

      if (requireJson) {
        requestOptions.response_format = { type: 'json_object' };
      }

      const response = await this.client.chat.completions.create(requestOptions);
      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return requireJson ? JSON.parse(content) : content;
    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw new Error('Failed to generate inference with OpenAI');
    }
  }
}
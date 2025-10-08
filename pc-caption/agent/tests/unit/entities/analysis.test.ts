import { describe, it, expect } from 'vitest';
import { AnalysisResultSchema } from '../../../src/domain/entities/analysis.js';

describe('AnalysisResult Entity', () => {
  describe('バリデーション', () => {
    it('正しいデータでバリデーションが成功する', () => {
      const validData = {
        screenshot: 'test-screenshot.png',
        analysis: 'This is a test analysis result'
      };

      const result = AnalysisResultSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.screenshot).toBe('test-screenshot.png');
        expect(result.data.analysis).toBe('This is a test analysis result');
      }
    });

    it('必須フィールド screenshot が欠けている場合は失敗する', () => {
      const invalidData = {
        analysis: 'This is a test analysis result'
      };

      const result = AnalysisResultSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('必須フィールド analysis が欠けている場合は失敗する', () => {
      const invalidData = {
        screenshot: 'test-screenshot.png'
      };

      const result = AnalysisResultSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('screenshot が空文字列の場合は失敗する', () => {
      const invalidData = {
        screenshot: '',
        analysis: 'This is a test analysis result'
      };

      const result = AnalysisResultSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('analysis が空文字列の場合は失敗する', () => {
      const invalidData = {
        screenshot: 'test-screenshot.png',
        analysis: ''
      };

      const result = AnalysisResultSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('screenshot が null の場合は失敗する', () => {
      const invalidData = {
        screenshot: null,
        analysis: 'This is a test analysis result'
      };

      const result = AnalysisResultSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('analysis が null の場合は失敗する', () => {
      const invalidData = {
        screenshot: 'test-screenshot.png',
        analysis: null
      };

      const result = AnalysisResultSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('追加のプロパティを持つ場合でもバリデーションが成功する', () => {
      const dataWithExtra = {
        screenshot: 'test-screenshot.png',
        analysis: 'This is a test analysis result',
        extraField: 'This should be allowed'
      };

      const result = AnalysisResultSchema.safeParse(dataWithExtra);
      expect(result.success).toBe(true);
    });
  });
});

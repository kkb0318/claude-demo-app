import { describe, it, expect, beforeAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { InfrastructureFactory } from '../../src/infrastructure/infrastructure-factory.js';
import { AnalysisServiceImpl } from '../../src/service/analysis-service-impl.js';

/**
 * 単一画像分析の統合テスト
 *
 * 実際のOpenAI APIを使用して画像分析を行います。
 * このテストを実行するには、.envファイルにOPENAI_API_KEYが設定されている必要があります。
 */
describe('Single Image Analysis Integration Test', () => {
  let analysisService: AnalysisServiceImpl;
  let testImageBuffer: Buffer;

  beforeAll(async () => {
    // サービス初期化
    const openaiClient = InfrastructureFactory.createOpenAIClient();
    analysisService = new AnalysisServiceImpl(openaiClient);

    // テスト画像を読み込み
    const imagePath = path.join(process.cwd(), 'data', 'KPI入力1.png');
    testImageBuffer = await fs.readFile(imagePath);
  });

  it('実際の画像を分析し、結果が正しく返される', async () => {
    const result = await analysisService.analyzeScreenshot(
      testImageBuffer,
      'KPI入力1.png'
    );

    // 結果の検証
    expect(result).toBeDefined();
    expect(result.screenshot).toBe('KPI入力1.png');
    expect(result.analysis).toBeDefined();
    expect(typeof result.analysis).toBe('string');
    expect(result.analysis.length).toBeGreaterThan(0);

    // 分析結果に期待されるキーワードが含まれているか確認
    const analysisLower = result.analysis.toLowerCase();
    const hasRelevantContent =
      analysisLower.includes('kpi') ||
      analysisLower.includes('業務') ||
      analysisLower.includes('スプレッドシート') ||
      analysisLower.includes('google') ||
      analysisLower.includes('データ') ||
      analysisLower.includes('進捗');

    expect(hasRelevantContent).toBe(true);
  }, 30000); // タイムアウトを30秒に設定

  it('コンテキスト付きで画像を分析できる', async () => {
    const context = 'This is a KPI tracking spreadsheet';

    const result = await analysisService.analyzeScreenshot(
      testImageBuffer,
      'KPI入力1.png',
      context
    );

    expect(result).toBeDefined();
    expect(result.screenshot).toBe('KPI入力1.png');
    expect(result.analysis).toBeDefined();
    expect(result.analysis.length).toBeGreaterThan(0);
  }, 30000);

  it('小さい画像データでも処理できる', async () => {
    // 1x1ピクセルのPNG画像（最小限のデータ）
    const minimalPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const result = await analysisService.analyzeScreenshot(
      minimalPngBuffer,
      'minimal.png'
    );

    expect(result).toBeDefined();
    expect(result.screenshot).toBe('minimal.png');
    expect(result.analysis).toBeDefined();
  }, 30000);
});

import { promises as fs } from 'fs';
import path from 'path';
import { InfrastructureFactory } from '../infrastructure/infrastructure-factory.js';
import { AnalysisServiceImpl } from '../service/analysis-service-impl.js';
import { logger } from '../infrastructure/logger/logger.js';

/**
 * 単一画像分析のサンプル
 *
 * data/KPI入力1.png を分析します
 */
async function main() {
  try {
    logger.info('=== 単一画像分析サンプル ===');

    // 1. インフラストラクチャ初期化
    logger.info('Step 1: インフラストラクチャ初期化中...');
    const openaiClient = InfrastructureFactory.createOpenAIClient();

    // 2. サービス初期化
    logger.info('Step 2: 分析サービス初期化中...');
    const analysisService = new AnalysisServiceImpl(openaiClient);

    // 3. サンプル画像を読み込み
    const imagePath = path.join(process.cwd(), 'data', 'KPI入力1.png');
    logger.info(`Step 3: 画像読み込み中: ${imagePath}`);

    let imageBuffer: Buffer;
    try {
      imageBuffer = await fs.readFile(imagePath);
      logger.info(`画像読み込み成功: ${imageBuffer.length} bytes`);
    } catch (error) {
      logger.error(`画像ファイルが見つかりません: ${imagePath}`);
      logger.info(
        'ヒント: data/KPI入力1.png を配置してから再実行してください'
      );
      process.exit(1);
    }

    // 4. 分析実行
    logger.info('Step 4: 画像分析実行中...');
    const result = await analysisService.analyzeScreenshot(
      imageBuffer,
      'KPI入力1.png'
    );

    // 5. 結果を出力
    logger.info('Step 5: 分析結果出力');
    console.log('\n========================================');
    console.log('📊 分析結果');
    console.log('========================================');
    console.log(`📷 ファイル名: ${result.screenshot}`);
    console.log(`\n📝 分析内容:\n${result.analysis}`);
    console.log('========================================\n');

    logger.info('分析完了!');
  } catch (error) {
    logger.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

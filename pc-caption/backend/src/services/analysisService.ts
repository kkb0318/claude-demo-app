import { OpenAIClient } from '../external/openaiClient.js';
import type {
  Recording,
  AnalysisResult,
  BusinessActivityInference
} from '../types/index.js';
import logger from '../utils/logger.js';

export class AnalysisService {
  private openaiClient: OpenAIClient;

  constructor() {
    this.openaiClient = new OpenAIClient();
  }

  async analyzeScreenshot(
    imageBuffer: Buffer,
    fileName: string,
    context?: string
  ): Promise<AnalysisResult> {
    const base64Image = imageBuffer.toString('base64');

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

    const prompt = `${systemPrompt}\n\n${userPrompt}`;

    try {
      const analysis = await this.openaiClient.analyzeImage(base64Image, prompt);

      return {
        screenshot: fileName,
        analysis
      };
    } catch (error) {
      logger.error(`Error analyzing screenshot ${fileName}:`, error);
      throw error;
    }
  }

  async analyzeMultipleScreenshots(
    images: Array<{ buffer: Buffer; fileName: string }>,
    operationLog?: Recording
  ): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    for (let i = 0; i < images.length; i++) {
      const { buffer, fileName } = images[i];
      let context = '';

      if (operationLog && operationLog.steps) {
        const relevantSteps = operationLog.steps.slice(i * 3, (i + 1) * 3);
        context = `操作ログ: ${JSON.stringify(relevantSteps, null, 2)}`;
      }

      const result = await this.analyzeScreenshot(buffer, fileName, context);
      results.push(result);

      // Rate limiting
      if (i < images.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  async inferBusinessActivity(
    screenshotAnalyses: AnalysisResult[],
    operationLog: Recording
  ): Promise<BusinessActivityInference> {
    const analysisText = screenshotAnalyses.map((result, index) =>
      `スクリーンショット${index + 1} (${result.screenshot}):\n${result.analysis}`
    ).join('\n\n');

    const operationSummary = this.summarizeOperations(operationLog);

    const prompt = `あなたは業務プロセス分析の専門家です。
    複数のスクリーンショット分析結果と操作ログから、実行された業務活動の全体像を推論してください。

    以下の観点から総合的に分析してください：
    1. 業務の全体的な目的と種類
    2. 使用されたツールとシステム
    3. 処理されたデータの種類と内容
    4. 作業の流れとタイムライン
    5. 業務の重要性と影響範囲
    6. 効率性や改善点の観察

    【スクリーンショット分析結果】
    ${analysisText}

    【操作ログサマリー】
    ${operationSummary}

    【元の操作ログタイトル】
    ${operationLog.title}

    結果をJSON形式で返してください。JSONには以下のフィールドを含めてください：
    - overallActivity: 業務活動の全体的な説明
    - activityType: 業務タイプの分類
    - keyFindings: 主要な発見事項の配列
    - timeline: タイムライン情報
    - toolsUsed: 使用されたツールの配列
    - dataProcessed: 処理されたデータの配列`;

    try {
      const inference = await this.openaiClient.generateInference(prompt, true);

      // timelineが配列やオブジェクトの場合は文字列に変換
      let timelineStr = '';
      if (inference.timeline) {
        if (typeof inference.timeline === 'string') {
          timelineStr = inference.timeline;
        } else if (Array.isArray(inference.timeline)) {
          timelineStr = inference.timeline.map((item: any) =>
            typeof item === 'string' ? item : JSON.stringify(item)
          ).join(', ');
        } else {
          timelineStr = JSON.stringify(inference.timeline);
        }
      }

      return {
        overallActivity: inference.overallActivity || '業務活動の特定ができませんでした',
        activityType: inference.activityType || '不明',
        keyFindings: inference.keyFindings || [],
        timeline: timelineStr,
        toolsUsed: inference.toolsUsed || [],
        dataProcessed: inference.dataProcessed || []
      };
    } catch (error) {
      logger.error('Error inferring business activity:', error);
      throw error;
    }
  }

  private summarizeOperations(recording: Recording): string {
    const summary: string[] = [];

    const navigation = recording.steps.find(step => step.type === 'navigate');
    if (navigation) {
      summary.push(`アクセスURL: ${navigation.url}`);
      if (navigation.assertedEvents?.[0]?.title) {
        summary.push(`ページタイトル: ${navigation.assertedEvents[0].title}`);
      }
    }

    const clicks = recording.steps.filter(step =>
      step.type === 'click' || step.type === 'doubleClick'
    );
    summary.push(`クリック操作数: ${clicks.length}`);

    const inputs = recording.steps.filter(step =>
      step.type === 'change' || step.type === 'keyDown' || step.type === 'keyUp'
    );
    if (inputs.length > 0) {
      summary.push(`入力操作数: ${inputs.length}`);
    }

    const viewport = recording.steps.find(step => step.type === 'setViewport');
    if (viewport) {
      summary.push(`画面サイズ: ${viewport.width}x${viewport.height}`);
    }

    return summary.join('\n');
  }

  generateReport(
    inference: BusinessActivityInference,
    analyses: AnalysisResult[]
  ): string {
    const report = `# 業務活動分析レポート

## 実行された業務活動
${inference.overallActivity}

## 業務タイプ
${inference.activityType}

## 主要な発見事項
${inference.keyFindings.map((finding, i) => `${i + 1}. ${finding}`).join('\n')}

## タイムライン
${inference.timeline}

## 使用ツール
${inference.toolsUsed.map(tool => `- ${tool}`).join('\n')}

## 処理されたデータ
${inference.dataProcessed.map(data => `- ${data}`).join('\n')}

## 各スクリーンショットの詳細分析
${analyses.map((analysis, i) => `
### ${i + 1}. ${analysis.screenshot}
${analysis.analysis}
`).join('\n')}
`;

    return report;
  }
}
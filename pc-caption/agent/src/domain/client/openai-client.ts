/**
 * OpenAI API クライアントのインターフェース
 *
 * このインターフェースは、OpenAI APIとの通信を抽象化します。
 * Infrastructure層で具象実装を提供します。
 */
export interface OpenAIClient {
  /**
   * 画像を分析する
   *
   * @param base64Image - Base64エンコードされた画像データ
   * @param prompt - 分析のためのプロンプト
   * @returns 分析結果のテキスト
   * @throws OpenAI APIのエラーが発生した場合
   */
  analyzeImage(base64Image: string, prompt: string): Promise<string>;

  /**
   * テキストプロンプトから推論を生成する
   *
   * @param prompt - 推論生成のためのプロンプト
   * @param requireJson - JSON形式でのレスポンスを要求するか
   * @returns 推論結果（requireJsonがtrueの場合はパース済みオブジェクト、falseの場合は文字列）
   * @throws OpenAI APIのエラーが発生した場合
   */
  generateInference(prompt: string, requireJson?: boolean): Promise<any>;
}

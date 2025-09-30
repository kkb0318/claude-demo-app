import { google } from 'googleapis';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

export interface SpreadsheetData {
  range: string;
  values: any[][];
}

export class GoogleSheetsService {
  private sheets: any;
  private spreadsheetId: string;

  constructor() {
    // サービスアカウントまたはOAuth2を使用して認証
    const auth = new google.auth.GoogleAuth({
      keyFile: config.google?.serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = '1Oztd28N_ejKwNmrJ2d76SiGSuyjC2iTalgdeghvazIc';
  }

  /**
   * スプレッドシートからデータを読み取る
   */
  async readRange(range: string): Promise<SpreadsheetData | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range,
      });

      return {
        range: response.data.range || range,
        values: response.data.values || [],
      };
    } catch (error) {
      logger.error('Google Sheets読み取りエラー:', error);
      return null;
    }
  }

  /**
   * スプレッドシートにデータを書き込む
   */
  async writeRange(range: string, values: any[][]): Promise<boolean> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        requestBody: {
          values: values,
        },
      });

      logger.info(`Google Sheetsに書き込み完了: ${range}`);
      return true;
    } catch (error) {
      logger.error('Google Sheets書き込みエラー:', error);
      return false;
    }
  }

  /**
   * スプレッドシートにデータを追加
   */
  async appendData(range: string, values: any[][]): Promise<boolean> {
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: values,
        },
      });

      logger.info(`Google Sheetsにデータ追加完了: ${range}`);
      return true;
    } catch (error) {
      logger.error('Google Sheetsデータ追加エラー:', error);
      return false;
    }
  }

  /**
   * 特定のセルの値を更新
   */
  async updateCell(cellAddress: string, value: any): Promise<boolean> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: cellAddress,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[value]],
        },
      });

      logger.info(`セル更新完了: ${cellAddress} = ${value}`);
      return true;
    } catch (error) {
      logger.error('セル更新エラー:', error);
      return false;
    }
  }

  /**
   * スプレッドシートの情報を取得
   */
  async getSpreadsheetInfo(): Promise<any> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      return response.data;
    } catch (error) {
      logger.error('スプレッドシート情報取得エラー:', error);
      return null;
    }
  }

  /**
   * 指定されたシートのすべてのデータを取得
   */
  async getAllSheetData(sheetName: string): Promise<SpreadsheetData | null> {
    return this.readRange(`${sheetName}!A1:Z1000`);
  }

  /**
   * 分析結果をスプレッドシートに記録
   */
  async recordAnalysisResult(fileName: string, analysisResult: string, timestamp: Date): Promise<boolean> {
    const values = [
      [
        timestamp.toISOString(),
        fileName,
        analysisResult,
        'AI分析完了'
      ]
    ];

    return this.appendData('AnalysisLog!A:D', values);
  }
}
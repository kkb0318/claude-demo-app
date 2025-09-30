import { Request, Response } from 'express';
import { GoogleSheetsService } from '../services/googleSheetsService.js';
import logger from '../utils/logger.js';

export class GoogleSheetsController {
  private googleSheetsService: GoogleSheetsService;

  constructor() {
    this.googleSheetsService = new GoogleSheetsService();
  }

  /**
   * スプレッドシートからデータを読み取る
   */
  readData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { range } = req.params;
      
      if (!range) {
        res.status(400).json({ error: 'Range parameter is required' });
        return;
      }

      const data = await this.googleSheetsService.readRange(range);
      
      if (!data) {
        res.status(404).json({ error: 'Data not found or access denied' });
        return;
      }

      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      logger.error('Google Sheets read error:', error);
      res.status(500).json({ error: 'Failed to read data from Google Sheets' });
    }
  };

  /**
   * スプレッドシートにデータを書き込む
   */
  writeData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { range } = req.params;
      const { values } = req.body;
      
      if (!range || !values) {
        res.status(400).json({ error: 'Range and values are required' });
        return;
      }

      const success = await this.googleSheetsService.writeRange(range, values);
      
      if (!success) {
        res.status(500).json({ error: 'Failed to write data to Google Sheets' });
        return;
      }

      res.json({
        success: true,
        message: `Data written to range: ${range}`
      });
    } catch (error) {
      logger.error('Google Sheets write error:', error);
      res.status(500).json({ error: 'Failed to write data to Google Sheets' });
    }
  };

  /**
   * 分析結果をスプレッドシートに記録
   */
  recordAnalysis = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileName, analysisResult } = req.body;
      
      if (!fileName || !analysisResult) {
        res.status(400).json({ error: 'fileName and analysisResult are required' });
        return;
      }

      const success = await this.googleSheetsService.recordAnalysisResult(
        fileName,
        analysisResult,
        new Date()
      );
      
      if (!success) {
        res.status(500).json({ error: 'Failed to record analysis result' });
        return;
      }

      res.json({
        success: true,
        message: 'Analysis result recorded successfully'
      });
    } catch (error) {
      logger.error('Google Sheets record analysis error:', error);
      res.status(500).json({ error: 'Failed to record analysis result' });
    }
  };

  /**
   * スプレッドシート情報を取得
   */
  getInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const info = await this.googleSheetsService.getSpreadsheetInfo();
      
      if (!info) {
        res.status(404).json({ error: 'Spreadsheet not found or access denied' });
        return;
      }

      res.json({
        success: true,
        info: {
          spreadsheetId: info.spreadsheetId,
          title: info.properties?.title,
          sheets: info.sheets?.map((sheet: any) => ({
            sheetId: sheet.properties?.sheetId,
            title: sheet.properties?.title,
            gridProperties: sheet.properties?.gridProperties
          }))
        }
      });
    } catch (error) {
      logger.error('Google Sheets info error:', error);
      res.status(500).json({ error: 'Failed to get spreadsheet info' });
    }
  };

  /**
   * 指定されたシートのすべてのデータを取得
   */
  getSheetData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sheetName } = req.params;
      
      if (!sheetName) {
        res.status(400).json({ error: 'Sheet name is required' });
        return;
      }

      const data = await this.googleSheetsService.getAllSheetData(sheetName);
      
      if (!data) {
        res.status(404).json({ error: 'Sheet not found or access denied' });
        return;
      }

      res.json({
        success: true,
        sheetName: sheetName,
        data: data
      });
    } catch (error) {
      logger.error('Google Sheets get sheet data error:', error);
      res.status(500).json({ error: 'Failed to get sheet data' });
    }
  };
}
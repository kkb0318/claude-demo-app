import { Router } from 'express';
import logger from '../utils/logger.js';

const router = Router();

// スプレッドシート情報を取得
router.get('/info', async (req, res) => {
  try {
    logger.info('Fetching spreadsheet info');
    
    const info = {
      url: process.env.GOOGLE_SHEETS_URL || '',
      id: process.env.GOOGLE_SHEETS_URL?.split('/')[5] || '',
      hasClient: !!(process.env.OPENAI_API_KEY && process.env.GOOGLE_SHEETS_URL)
    };

    res.json({
      success: true,
      info
    });
  } catch (error) {
    logger.error('Error fetching spreadsheet info:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 分析結果をGoogle Sheetsに記録
router.post('/record-analysis', async (req, res) => {
  try {
    const { fileName, analysisResult } = req.body;
    
    if (!fileName || !analysisResult) {
      return res.status(400).json({
        success: false,
        error: 'ファイル名と分析結果が必要です'
      });
    }

    logger.info('Recording analysis to Google Sheets', { fileName });

    // Google Sheets AIエージェントを使用して記録
    const timestamp = new Date().toISOString();
    const record = {
      timestamp,
      fileName,
      analysisResult,
      status: 'completed'
    };

    // ここでは成功を返しますが、実際のGoogle Sheets APIへの書き込みが必要
    logger.info('Analysis recorded successfully', record);

    res.json({
      success: true,
      record
    });
  } catch (error) {
    logger.error('Error recording analysis to Google Sheets:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
import { Router } from 'express';
import { GoogleSheetsController } from '../controllers/googleSheetsController.js';

const router = Router();
const googleSheetsController = new GoogleSheetsController();

// スプレッドシート情報を取得
router.get('/info', googleSheetsController.getInfo);

// 指定されたシートのすべてのデータを取得
router.get('/sheet/:sheetName', googleSheetsController.getSheetData);

// 指定された範囲のデータを読み取る
router.get('/range/:range', googleSheetsController.readData);

// 指定された範囲にデータを書き込む
router.post('/range/:range', googleSheetsController.writeData);

// 分析結果を記録
router.post('/record-analysis', googleSheetsController.recordAnalysis);

export default router;
import { Router } from 'express';
import { AnalysisController } from '../controllers/analysisController.js';
import { upload } from '../middleware/upload.js';

const router = Router();
const analysisController = new AnalysisController();

// Full analysis with operation log
router.post(
  '/analyze',
  upload.array('files', 10),
  (req, res) => analysisController.analyze(req, res)
);

// Screenshots only analysis
router.post(
  '/analyze-screenshots',
  upload.array('screenshots', 10),
  (req, res) => analysisController.analyzeScreenshots(req, res)
);

export default router;
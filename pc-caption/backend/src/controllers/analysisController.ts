import { Request, Response } from 'express';
import { AnalysisService } from '../services/analysisService.js';
import type { Recording } from '../types/index.js';
import logger from '../utils/logger.js';

export class AnalysisController {
  private analysisService: AnalysisService;

  constructor() {
    this.analysisService = new AnalysisService();
  }

  async analyze(req: Request, res: Response): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
        return;
      }

      // Separate images and JSON
      const imageFiles = files.filter(file =>
        file.mimetype.startsWith('image/')
      );
      const jsonFile = files.find(file =>
        file.mimetype === 'application/json'
      );

      if (imageFiles.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No image files uploaded'
        });
        return;
      }

      // Parse operation log if provided
      let operationLog: Recording | undefined;
      if (jsonFile) {
        try {
          const jsonContent = jsonFile.buffer.toString('utf-8');
          operationLog = JSON.parse(jsonContent);
        } catch (error) {
          logger.error('Error parsing JSON file:', error);
          res.status(400).json({
            success: false,
            error: 'Invalid JSON file'
          });
          return;
        }
      }

      // Prepare images for analysis
      const images = imageFiles.map(file => ({
        buffer: file.buffer,
        fileName: file.originalname
      }));

      logger.info(`Analyzing ${images.length} screenshots`);

      // Analyze screenshots
      const screenshotAnalyses = await this.analysisService.analyzeMultipleScreenshots(
        images,
        operationLog
      );

      let businessInference = null;
      let report = '';

      // Infer business activity if operation log is provided
      if (operationLog) {
        businessInference = await this.analysisService.inferBusinessActivity(
          screenshotAnalyses,
          operationLog
        );

        report = this.analysisService.generateReport(
          businessInference,
          screenshotAnalyses
        );
      }

      res.status(200).json({
        success: true,
        data: {
          screenshotAnalyses,
          businessInference,
          report
        }
      });
    } catch (error) {
      logger.error('Analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during analysis'
      });
    }
  }

  async analyzeScreenshots(req: Request, res: Response): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
        return;
      }

      const images = files.map(file => ({
        buffer: file.buffer,
        fileName: file.originalname
      }));

      logger.info(`Analyzing ${images.length} screenshots`);

      const analyses = await this.analysisService.analyzeMultipleScreenshots(images);

      res.status(200).json({
        success: true,
        data: {
          analyses
        }
      });
    } catch (error) {
      logger.error('Screenshot analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during screenshot analysis'
      });
    }
  }
}
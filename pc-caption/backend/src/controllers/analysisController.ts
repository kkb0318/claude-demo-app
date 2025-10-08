import { Request, Response } from 'express';
import { AnalysisService } from '../services/analysisService.js';
import { SimpleGoogleSheetsAgent } from '../simpleGoogleSheetsAgent.js';
import type { AnalysisData } from '../simpleGoogleSheetsAgent.js';
import type { Recording } from '../types/index.js';
import logger from '../utils/logger.js';

export class AnalysisController {
  private analysisService: AnalysisService;
  private googleSheetsAgent: SimpleGoogleSheetsAgent | null = null;

  constructor() {
    this.analysisService = new AnalysisService();
    this.initializeGoogleSheetsAgent();
  }

  private initializeGoogleSheetsAgent(): void {
    const googleSheetsUrl = process.env.GOOGLE_SHEETS_URL;

    if (googleSheetsUrl) {
      try {
        this.googleSheetsAgent = new SimpleGoogleSheetsAgent(googleSheetsUrl);
        logger.info('Google Sheets AI Agent initialized for analysis recording');
      } catch (error) {
        logger.warn('Failed to initialize Google Sheets AI Agent:', error);
      }
    } else {
      logger.info('Google Sheets integration disabled (missing environment variables)');
    }
  }

  private async recordToGoogleSheets(
    fileName: string, 
    analysisResult: string, 
    confidence: number = 85,
    detectedElements: string[] = []
  ): Promise<void> {
    if (!this.googleSheetsAgent) return;

    try {
      const analysisData: AnalysisData = {
        timestamp: new Date().toISOString(),
        fileName,
        analysisResult,
        confidence,
        detectedElements,
        status: 'completed',
        metadata: {
          processingTime: Date.now(),
          aiModel: 'GPT-4o-mini',
          userId: 'api_user'
        }
      };

      await this.googleSheetsAgent.recordAnalysisResult(analysisData);
      logger.info(`Analysis result recorded to Google Sheets: ${fileName}`);
    } catch (error) {
      logger.error('Failed to record analysis to Google Sheets:', error);
    }
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

      // Google Sheetsに分析結果を記録（非同期）
      if (this.googleSheetsAgent) {
        Promise.all(
          screenshotAnalyses.map((analysis: any, index: number) => 
            this.recordToGoogleSheets(
              images[index].fileName,
              analysis.content || analysis.summary || 'Analysis completed',
              analysis.confidence || 85,
              analysis.detectedElements || []
            )
          )
        ).catch(error => {
          logger.error('Background Google Sheets recording failed:', error);
        });
      }
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

      // Google Sheetsに分析結果を記録（非同期）
      if (this.googleSheetsAgent) {
        Promise.all(
          analyses.map((analysis: any, index: number) => 
            this.recordToGoogleSheets(
              images[index].fileName,
              analysis.content || analysis.summary || 'Screenshot analysis completed',
              analysis.confidence || 85,
              analysis.detectedElements || []
            )
          )
        ).catch(error => {
          logger.error('Background Google Sheets recording failed:', error);
        });
      }
    } catch (error) {
      logger.error('Screenshot analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during screenshot analysis'
      });
    }
  }
}
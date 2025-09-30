import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import logger from './utils/logger.js';
import analysisRoutes from './routes/analysisRoutes.js';
import googleSheetsRoutes from './routes/googleSheetsRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/analysis', analysisRoutes);
app.use('/api/sheets', googleSheetsRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
  logger.info(`CORS enabled for: ${config.cors.origin}`);
});
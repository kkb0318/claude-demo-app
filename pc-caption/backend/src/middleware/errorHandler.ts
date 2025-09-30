import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error:', err);

  if (err.message.includes('Invalid file type')) {
    res.status(400).json({
      success: false,
      error: err.message
    });
    return;
  }

  if (err.message.includes('File too large')) {
    res.status(400).json({
      success: false,
      error: 'File size exceeds the limit'
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};
import type { Request, Response } from 'express';

import type { ErrorResponse } from '../dto/generate-app.dto';

/**
 * Global error handler middleware
 * Catches all errors and returns consistent error responses
 * Note: NextFunction parameter intentionally omitted but Express requires this signature
 */
export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response<ErrorResponse>
): void => {
  console.error('Error occurred:', error);

  // Domain validation errors (from CodexPrompt, etc.)
  if (error.message.includes('must be') || error.message.includes('required')) {
    res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      statusCode: 400
    });
    return;
  }

  // Default server error
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
    statusCode: 500
  });
};

import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

import type { ErrorResponse } from '../dto/generate-app.dto';

/**
 * Validation middleware using Zod schemas
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response<ErrorResponse>, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request body',
        statusCode: 400,
        details: error
      });
    }
  };
};
